import { Router } from "express";
import { db } from "@workspace/db";
import { knightedJobListingsTable, knightedSavedJobsTable, knightedJobAlertsTable, knightedJobApplicationsTable, knightedSeekerProfilesTable, knightedCompanyProfilesTable, createJobAlertSchema, createJobApplicationSchema, upsertCompanyProfileSchema } from "@workspace/db";
import { eq, desc, count, sql, and, ilike, or, isNotNull } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import { Resend } from "resend";
import { anthropic, MODEL_SONNET } from "@workspace/integrations-anthropic-ai";
import {
  SearchKnightedJobsQueryParams,
  ListKnightedListingsQueryParams,
  GetKnightedListingParams,
  CreateKnightedListingBody,
} from "@workspace/api-zod";
import { saveJobInputSchema, createSeekerProfileSchema, createMatchScoreSchema } from "@workspace/db";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "TheKnightedJobs <onboarding@resend.dev>";

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const router = Router();

// Country detection — mirrors the resumeReady Adzuna logic
const LOCATION_TO_COUNTRY: [RegExp, string][] = [
  [/\b(canada|canadian|ontario|quebec|bc|alberta|toronto|vancouver|montreal|calgary|ottawa)\b/i, "ca"],
  [/\b(united states|usa|us\b|u\.s\.|american?|new york|california|texas|florida|chicago|seattle|boston)\b/i, "us"],
  [/\b(uk|united kingdom|england|britain|london|manchester|edinburgh|glasgow|birmingham)\b/i, "gb"],
  [/\b(australia|australian|sydney|melbourne|brisbane|perth|auckland)\b/i, "au"],
  [/\b(germany|german|deutschland|berlin|munich|frankfurt|hamburg)\b/i, "de"],
  [/\b(france|french|paris|lyon|marseille)\b/i, "fr"],
  [/\b(india|indian|bangalore|mumbai|delhi|hyderabad|chennai)\b/i, "in"],
  [/\b(brazil|brasil|sao paulo|rio de janeiro)\b/i, "br"],
  [/\b(singapore|sg\b)\b/i, "sg"],
  [/\b(south africa|cape town|johannesburg|durban)\b/i, "za"],
];

const detectCountries = (loc?: string): string[] => {
  if (!loc) return ["us", "gb", "ca", "au"];
  for (const [pattern, code] of LOCATION_TO_COUNTRY) {
    if (pattern.test(loc)) return [code];
  }
  return ["us", "gb", "ca"];
};

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();

// Map KnightedJobs categories → Remotive category slugs (free, no-key API)
const KJ_TO_REMOTIVE: Record<string, string> = {
  "Finance":       "Finance",
  "Legal":         "Legal",
  "Engineering":   "Engineering",
  "Data & AI":     "Artificial Intelligence",
  "Technology":    "Software Development",
  "Marketing":     "Marketing",
  "Design":        "Design",
  "Sales":         "Sales",
  "Operations":    "Operations",
  "Consulting":    "Business Development",
  "Healthcare":    "Medical",
  "People & HR":   "Human Resources",
  "Product":       "Product Management",
  "Communications":"Communications",
  "Academia":      "Teaching",
};

async function fetchRemotiveJobs(query: string, category?: string): Promise<any[]> {
  try {
    const remotiveCat = category ? KJ_TO_REMOTIVE[category] : undefined;
    const params = new URLSearchParams({ limit: "50" });
    if (remotiveCat) params.set("category", remotiveCat);
    // Use the query as keyword search unless it's the bare category name (no added value)
    if (query && query !== category) params.set("search", query);

    const r = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
    if (!r.ok) return [];
    const data = await r.json() as any;

    return (data.jobs || []).map((j: any) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name || "Unknown",
      logoUrl: j.company_logo || null,
      location: j.candidate_required_location || "Remote",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",
      description: j.description ? stripHtml(j.description).slice(0, 600) : "",
      url: j.url || null,
      isRemote: true,
      employmentType: j.job_type === "full_time" ? "full_time"
        : j.job_type === "part_time" ? "part_time"
        : j.job_type === "contract" ? "contract"
        : j.job_type === "internship" ? "internship"
        : null,
      category: category || j.category || null,
      postedAt: j.publication_date || new Date().toISOString(),
      source: "remotive",
    }));
  } catch {
    return [];
  }
}

// The Muse free tier only has live listings for these specific categories.
// Others return 0 even though the categories technically exist.
const KJ_TO_MUSE: Record<string, string> = {
  "Sales":         "Sales",
  "Technology":    "Software Engineer",
  "Product":       "Product",
};

// ─── Remote OK ────────────────────────────────────────────────────────────────
// 65-100 live remote jobs per tag. Returns subset of the ~150 active postings.
const KJ_TO_REMOTEOK: Record<string, string> = {
  "Finance":       "finance",
  "Legal":         "legal",
  "Engineering":   "engineering",
  "Technology":    "developer",
  "Data & AI":     "machine-learning",
  "Marketing":     "marketing",
  "Design":        "design",
  "Sales":         "sales",
  "Operations":    "ops",
  "Healthcare":    "healthcare",
  "People & HR":   "hr",
  "Product":       "product",
  "Consulting":    "business",
  "Communications":"marketing",
};

async function fetchRemoteOKJobs(category?: string): Promise<any[]> {
  try {
    const tag = category ? KJ_TO_REMOTEOK[category] : undefined;
    if (category && !tag) return [];
    const url = tag
      ? `https://remoteok.com/api?tags=${encodeURIComponent(tag)}`
      : "https://remoteok.com/api";
    const r = await fetch(url, { headers: { "User-Agent": "KnightedJobs/1.0" } });
    if (!r.ok) return [];
    const data = await r.json() as any[];
    return data
      .filter((j: any) => typeof j === "object" && j.position)
      .map((j: any) => ({
        id: `remoteok-${j.id}`,
        title: j.position,
        company: j.company || "Unknown",
        logoUrl: j.company_logo || j.logo || null,
        location: j.location || "Remote",
        salaryMin: j.salary_min && j.salary_min > 0 ? j.salary_min : null,
        salaryMax: j.salary_max && j.salary_max > 0 ? j.salary_max : null,
        salaryCurrency: "USD",
        description: j.description ? stripHtml(j.description).slice(0, 600) : "",
        url: j.apply_url || j.url || null,
        isRemote: true,
        employmentType: null,
        category: category || null,
        postedAt: j.epoch ? new Date(j.epoch * 1000).toISOString() : new Date().toISOString(),
        source: "remoteok",
      }));
  } catch {
    return [];
  }
}

// ─── 4 Day Week ───────────────────────────────────────────────────────────────
// ~25 premium jobs at companies with genuine 4-day work weeks. Has category + salary.
const KJ_TO_4DW: Record<string, string> = {
  "Finance":       "finance",
  "Legal":         "legal",
  "Engineering":   "engineering",
  "Technology":    "engineering",
  "Data & AI":     "data",
  "Marketing":     "marketing",
  "Design":        "design",
  "Sales":         "sales",
  "Operations":    "operations",
  "People & HR":   "hr",
  "Product":       "product",
  "Communications":"marketing",
};

async function fetchFourDayWeekJobs(category?: string): Promise<any[]> {
  try {
    const r = await fetch("https://4dayweek.io/api/jobs", {
      headers: { "User-Agent": "KnightedJobs/1.0" },
    });
    if (!r.ok) return [];
    const data = await r.json() as any;
    const jobs: any[] = Array.isArray(data) ? data : data.jobs ?? data.data ?? [];
    const fourDwCat = category ? KJ_TO_4DW[category] : undefined;
    const filtered = fourDwCat
      ? jobs.filter((j: any) => j.category === fourDwCat)
      : jobs;
    return filtered
      .filter((j: any) => !j.is_expired)
      .map((j: any) => {
        const loc = j.locations?.[0];
        const locationStr = loc
          ? [loc.city, loc.country].filter(Boolean).join(", ")
          : "Remote";
        return {
          id: `4dw-${j.id}`,
          title: j.title,
          company: j.company?.name || j.company_name || "Unknown",
          logoUrl: j.company?.logo_url || null,
          location: locationStr,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: j.salary_currency || "USD",
          description: "",
          url: j.slug ? `https://4dayweek.io/jobs/${j.slug}` : null,
          isRemote: j.work_arrangement === "remote",
          employmentType: "full_time",
          category: category || j.category || null,
          postedAt: j.posted ? new Date(j.posted * 1000).toISOString() : new Date().toISOString(),
          source: "4dayweek",
        };
      });
  } catch {
    return [];
  }
}

// ─── Working Nomads ───────────────────────────────────────────────────────────
// ~34 curated fully-remote jobs, refreshed daily. No category filter — added only for keyword searches.
async function fetchWorkingNomadsJobs(): Promise<any[]> {
  try {
    const r = await fetch("https://www.workingnomads.com/api/exposed_jobs/", {
      headers: { "User-Agent": "KnightedJobs/1.0" },
    });
    if (!r.ok) return [];
    const data = await r.json() as any;
    const jobs: any[] = Array.isArray(data) ? data : [];
    return jobs.map((j: any) => ({
      id: `wn-${Buffer.from(j.url || j.title || Math.random().toString()).toString("base64").slice(0, 16)}`,
      title: j.title,
      company: j.company_name || "Unknown",
      logoUrl: null,
      location: j.location || "Remote",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",
      description: j.description ? stripHtml(j.description).slice(0, 600) : "",
      url: j.url || null,
      isRemote: true,
      employmentType: null,
      category: j.category_name || null,
      postedAt: j.pub_date || new Date().toISOString(),
      source: "workingnomads",
    }));
  } catch {
    return [];
  }
}

async function fetchMuseJobs(query: string, category?: string): Promise<any[]> {
  try {
    const museCat = category ? KJ_TO_MUSE[category] : undefined;
    // Only call The Muse when we know the category has real listings,
    // or when it's a free-text keyword search with no category.
    if (category && !museCat) return [];
    const params = new URLSearchParams({ page: "1", descending: "true" });
    if (museCat) params.set("category", museCat);

    const r = await fetch(`https://www.themuse.com/api/public/jobs?${params}`);
    if (!r.ok) return [];
    const data = await r.json() as any;

    return (data.results || []).map((j: any) => {
      const loc = j.locations?.[0]?.name || "Flexible / Remote";
      return {
        id: `muse-${j.id}`,
        title: j.name,
        company: j.company?.name || "Unknown",
        logoUrl: null,
        location: loc,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        description: j.contents ? stripHtml(j.contents).slice(0, 600) : "",
        url: j.refs?.landing_page || null,
        isRemote: /remote|flexible/i.test(loc),
        employmentType: null,
        category: category || (j.categories?.[0]?.name ?? null),
        postedAt: j.publication_date || new Date().toISOString(),
        source: "themuse",
      };
    });
  } catch {
    return [];
  }
}

async function fetchAdzunaJobs(query: string, location?: string, isRemote?: boolean): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return [];

  // When no location is specified, cast a wide international net.
  const countries = location ? detectCountries(location) : ["us", "gb", "ca", "au"];

  try {
    // Fetch 2 pages per country for richer results (still within free-tier 5k calls/day budget).
    const pagesToFetch = location ? [1] : [1, 2];
    const perSlice = await Promise.all(
      countries.flatMap((countryCode) =>
        pagesToFetch.map(async (page) => {
          const params = new URLSearchParams({
            app_id: appId,
            app_key: appKey,
            what: query,
            results_per_page: "20",
            sort_by: "date",
          });
          if (location) params.set("where", location);
          if (isRemote) params.set("what_or", "remote");

          const r = await fetch(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}?${params}`);
          if (!r.ok) return [];
          const data = await r.json() as any;

          const SIXTY_DAYS_AGO = Date.now() - 60 * 24 * 60 * 60 * 1000;
          return (data.results || [])
            .filter((j: any) => j.redirect_url)
            .filter((j: any) => !j.created || new Date(j.created).getTime() > SIXTY_DAYS_AGO)
            .map((j: any) => ({
              id: `adzuna-${countryCode}-${j.id}`,
              title: j.title,
              company: j.company?.display_name || "Unknown",
              location: j.location?.display_name || location || "Unknown",
              salaryMin: j.salary_min ?? null,
              salaryMax: j.salary_max ?? null,
              salaryCurrency: "USD",
              description: j.description ? stripHtml(j.description).slice(0, 600) : "",
              url: j.redirect_url,
              isRemote: /remote/i.test(j.location?.display_name || "") || /remote/i.test(j.title || ""),
              employmentType: j.contract_time?.toLowerCase() === "full_time" ? "full_time"
                : j.contract_time?.toLowerCase() === "part_time" ? "part_time" : null,
              category: j.category?.label ?? null,
              postedAt: j.created || new Date().toISOString(),
              source: "adzuna",
            }));
        })
      )
    );
    return perSlice.flat();
  } catch {
    return [];
  }
}

async function fetchJSearchJobs(query: string, location?: string, remote?: boolean): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      query: location ? `${query} in ${location}` : query,
      page: "1",
      num_pages: "2",
      date_posted: "month",
    });
    if (remote) params.set("remote_jobs_only", "true");

    const r = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    });
    if (!r.ok) return [];
    const data = await r.json() as any;

    return (data.data || []).slice(0, 30).map((j: any) => ({
      id: `jsearch-${j.job_id}`,
      title: j.job_title,
      company: j.employer_name || "Unknown",
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || "Unknown",
      salaryMin: j.job_min_salary ?? null,
      salaryMax: j.job_max_salary ?? null,
      salaryCurrency: j.job_salary_currency || "USD",
      description: j.job_description ? stripHtml(j.job_description).slice(0, 600) : "",
      url: j.job_apply_link || null,
      isRemote: j.job_is_remote ?? false,
      employmentType:
        j.job_employment_type === "FULLTIME" ? "full_time"
        : j.job_employment_type === "PARTTIME" ? "part_time"
        : j.job_employment_type === "CONTRACTOR" ? "contract"
        : j.job_employment_type === "INTERN" ? "internship"
        : null,
      category: null,
      postedAt: j.job_posted_at_datetime_utc || new Date().toISOString(),
      source: "jsearch",
    }));
  } catch {
    return [];
  }
}

function mapListingToJob(listing: any): any {
  const isCurrentlyPromoted =
    listing.isPromoted &&
    (!listing.promotedUntil || new Date(listing.promotedUntil) > new Date());
  return {
    id: `direct-${listing.id}`,
    title: listing.title,
    company: listing.company,
    logoUrl: listing.logoUrl ?? null,
    location: listing.location,
    salaryMin: listing.salaryMin ? parseFloat(listing.salaryMin) : null,
    salaryMax: listing.salaryMax ? parseFloat(listing.salaryMax) : null,
    salaryCurrency: listing.salaryCurrency || "USD",
    description: listing.description?.slice(0, 600) ?? "",
    url: listing.applyUrl || null,
    isRemote: listing.isRemote,
    employmentType: listing.employmentType || null,
    category: listing.category || null,
    postedAt: listing.createdAt?.toISOString() ?? new Date().toISOString(),
    source: "direct",
    isPromoted: isCurrentlyPromoted,
    isAgency: listing.isAgency ?? false,
  };
}

// GET /knighted-jobs/search
router.get("/knighted-jobs/search", async (req, res) => {
  const parseResult = SearchKnightedJobsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const { q = "", location, type, remote, salaryDisclosed, seniority, page = 1, category, sort, postedWithin, minSalary, maxSalary } = parseResult.data as any;
  const PAGE_SIZE = 20;
  const pageNum = Math.max(1, Number(page));

  try {
    // Build DB conditions
    const dbConditions: any[] = [eq(knightedJobListingsTable.isActive, true)];
    if (category) dbConditions.push(eq(knightedJobListingsTable.category, category));
    if (postedWithin) {
      const cutoff = new Date(Date.now() - Number(postedWithin) * 24 * 60 * 60 * 1000);
      dbConditions.push(sql`${knightedJobListingsTable.createdAt} >= ${cutoff}`);
    }

    // Fetch all sources in parallel:
    //   - Remotive: live worldwide remote jobs (free, no key)
    //   - The Muse: real company postings for Sales/Tech/Product (free, no key)
    //   - Remote OK: tag-filtered remote jobs (free, no key)
    //   - 4 Day Week: category-filtered 4-day-week jobs (free, no key)
    //   - Working Nomads: curated nomad-friendly jobs for keyword searches (free, no key)
    //   - Adzuna: aggregates Indeed/Glassdoor/50+ boards (activates once secrets are set)
    //   - JSearch: location-aware supplement (activates if RAPIDAPI_KEY works)
    const [remotiveJobs, museJobs, remoteOKJobs, fourDayWeekJobs, workingNomadsJobs, adzunaJobs, jsearchJobs, directListings] = await Promise.all([
      (q || category) ? fetchRemotiveJobs(q || category || "jobs", category) : Promise.resolve([]),
      (q || category) ? fetchMuseJobs(q || category || "", category) : Promise.resolve([]),
      fetchRemoteOKJobs(category),
      fetchFourDayWeekJobs(category),
      q ? fetchWorkingNomadsJobs() : Promise.resolve([]),
      fetchAdzunaJobs(q || category || "jobs", location, remote),
      (q || location) ? fetchJSearchJobs(q || category || "jobs", location, remote) : Promise.resolve([]),
      db
        .select()
        .from(knightedJobListingsTable)
        .where(dbConditions.length === 1 ? dbConditions[0] : and(...dbConditions))
        .orderBy(desc(knightedJobListingsTable.createdAt))
        .limit(500),
    ]);

    const directJobs = directListings.map(mapListingToJob);

    // Merge: direct first, then all live feeds, then paid aggregators
    let combined = [
      ...directJobs,
      ...remotiveJobs,
      ...museJobs,
      ...remoteOKJobs,
      ...fourDayWeekJobs,
      ...workingNomadsJobs,
      ...adzunaJobs,
      ...jsearchJobs,
    ];

    // Filter by type if specified
    if (type) {
      combined = combined.filter((j) => j.employmentType === type || j.employmentType == null);
    }

    // Filter by seniority level (direct listings only, based on title keywords)
    const SENIORITY_KEYWORDS: Record<string, string[]> = {
      entry:     ["intern", "internship", "trainee", "graduate", "placement", "entry level", "entry-level", "apprentice"],
      analyst:   ["analyst", "associate", "junior", "assistant", "coordinator"],
      senior:    ["senior", "lead", "principal", "specialist", "expert", "staff"],
      manager:   ["manager", "head of", "head,", "director", "vice president", "vp "],
      executive: ["chief", " ceo", " cfo", " cto", " coo", " cpo", "president", "managing director", " md,", "founder"],
    };
    if (seniority && SENIORITY_KEYWORDS[seniority]) {
      const kws = SENIORITY_KEYWORDS[seniority];
      combined = combined.filter((j) => {
        if (j.source !== "direct") return true;
        const titleLower = ` ${j.title.toLowerCase()} `;
        return kws.some((kw) => titleLower.includes(kw));
      });
    }

    // ── Synonym groups ────────────────────────────────────────────────────────
    // Each key maps to its full synonym group. A token matches if ANY member of
    // its group appears in the haystack (OR within the group, AND across groups).
    const SYNONYM_GROUPS: Record<string, string[]> = {
      developer:          ["developer", "engineer"],
      engineer:           ["engineer", "developer"],
      programmer:         ["programmer", "developer", "engineer"],
      lawyer:             ["lawyer", "solicitor", "attorney", "counsel"],
      solicitor:          ["lawyer", "solicitor", "attorney", "counsel"],
      attorney:           ["lawyer", "solicitor", "attorney", "counsel"],
      counsel:            ["lawyer", "solicitor", "attorney", "counsel"],
      physician:          ["physician", "doctor"],
      doctor:             ["physician", "doctor"],
      nurse:              ["nurse", "nursing"],
      nursing:            ["nurse", "nursing"],
    };

    // ── "remote" / "wfh" in the search box → activate the remote filter ──────
    const REMOTE_TRIGGER = /\b(remote|wfh)\b/i;
    const hasRemoteKeyword = REMOTE_TRIGGER.test(q);
    const effectiveRemote = remote === true || hasRemoteKeyword;
    // Strip the remote-trigger words from the keyword query so they don't become tokens
    const cleanQ = hasRemoteKeyword
      ? q.replace(/\b(remote|wfh)\b/gi, " ").replace(/\s+/g, " ").trim()
      : q;

    // Filter by remote if specified (or triggered by keyword)
    if (effectiveRemote) {
      combined = combined.filter((j) => j.isRemote);
    }

    // Filter by salary disclosed
    if (salaryDisclosed === true) {
      combined = combined.filter((j) => j.salaryMin != null || j.salaryMax != null);
    }

    // Filter by salary range (G2)
    if (minSalary) {
      const min = Number(minSalary);
      combined = combined.filter((j) => j.salaryMax == null || j.salaryMax >= min);
    }
    if (maxSalary) {
      const max = Number(maxSalary);
      combined = combined.filter((j) => j.salaryMin == null || j.salaryMin <= max);
    }

    // Sort (G3)
    if (sort === "newest") {
      combined.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    } else if (sort === "salary_desc") {
      combined.sort((a, b) => {
        const aS = Math.max(a.salaryMax ?? 0, a.salaryMin ?? 0);
        const bS = Math.max(b.salaryMax ?? 0, b.salaryMin ?? 0);
        return bS - aS;
      });
    } else {
      // Default relevance: promoted → salary-disclosed → direct → external
      combined.sort((a, b) => {
        const aPromoted = (a as any).isPromoted ? 1 : 0;
        const bPromoted = (b as any).isPromoted ? 1 : 0;
        if (aPromoted !== bPromoted) return bPromoted - aPromoted;
        const aHasSalary = a.salaryMin != null || a.salaryMax != null ? 1 : 0;
        const bHasSalary = b.salaryMin != null || b.salaryMax != null ? 1 : 0;
        if (aHasSalary !== bHasSalary) return bHasSalary - aHasSalary;
        const sourceRank = (s: string) => s === "direct" ? 2 : s === "jsearch" ? 1 : 0;
        return sourceRank(b.source) - sourceRank(a.source);
      });
    }

    // Filter by keywords AND location — applies to all results (B1+B2 fix).
    // Keyword filter runs on direct listings only (external already filtered by Adzuna).
    // Location filter now runs on ALL results so external jobs don't bleed through.
    if (cleanQ || location) {
      const rawTokens = cleanQ ? cleanQ.toLowerCase().split(/\s+/).filter((w: string) => w.length > 1) : [];
      const locLower = location?.toLowerCase().trim() ?? "";

      const variantMatches = (variant: string, haystack: string) => {
        const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`).test(haystack);
      };
      const tokenMatches = (token: string, haystack: string) => {
        const group = SYNONYM_GROUPS[token] ?? [token];
        return group.some(v => variantMatches(v, haystack));
      };

      combined = combined.filter((j) => {
        // Keyword filter: direct listings only
        if (j.source === "direct" && rawTokens.length > 0) {
          const haystack = `${j.title} ${j.category ?? ""} ${j.description}`.toLowerCase();
          if (!rawTokens.every((t: string) => tokenMatches(t, haystack))) return false;
        }
        // Location filter: ALL results — job location must contain the search term
        // OR be explicitly remote. Remote jobs always pass when location is searched.
        if (locLower.length > 2) {
          const jobLoc = j.location.toLowerCase();
          if (!jobLoc.includes(locLower) && !j.isRemote) return false;
        }
        return true;
      });
    }

    const total = combined.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const offset = (pageNum - 1) * PAGE_SIZE;
    const jobs = combined.slice(offset, offset + PAGE_SIZE);

    return res.json({ jobs, total, page: pageNum, totalPages });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs search error");
    return res.status(500).json({ error: "Search failed" });
  }
});

// GET /knighted-jobs/listings
router.get("/knighted-jobs/listings", async (req, res) => {
  const parseResult = ListKnightedListingsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const { page = 1, limit = 20 } = parseResult.data;
  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * pageSize;

  try {
    const [listings, totalResult] = await Promise.all([
      db
        .select()
        .from(knightedJobListingsTable)
        .where(eq(knightedJobListingsTable.isActive, true))
        .orderBy(desc(knightedJobListingsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: count() })
        .from(knightedJobListingsTable)
        .where(eq(knightedJobListingsTable.isActive, true)),
    ]);

    const total = totalResult[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const mapped = listings.map((l) => ({
      id: l.id,
      title: l.title,
      company: l.company,
      companyWebsite: l.companyWebsite ?? null,
      logoUrl: l.logoUrl ?? null,
      location: l.location,
      isRemote: l.isRemote,
      employmentType: l.employmentType ?? null,
      salaryMin: l.salaryMin ? parseFloat(l.salaryMin) : null,
      salaryMax: l.salaryMax ? parseFloat(l.salaryMax) : null,
      salaryCurrency: l.salaryCurrency,
      category: l.category ?? null,
      description: l.description,
      applyUrl: l.applyUrl ?? null,
      contactEmail: l.contactEmail,
      postedAt: l.createdAt.toISOString(),
      expiresAt: l.expiresAt?.toISOString() ?? null,
      isActive: l.isActive,
    }));

    return res.json({ listings: mapped, total, page: pageNum, totalPages });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs list listings error");
    return res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET /knighted-jobs/employer/listings (requireAuth — employer dashboard)
router.get("/knighted-jobs/employer/listings", requireAuth, async (req: any, res) => {
  try {
    const listings = await db
      .select()
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.createdByUserId, req.userId))
      .orderBy(desc(knightedJobListingsTable.createdAt));

    const counts = await db
      .select({ listingId: knightedJobApplicationsTable.listingId, count: count() })
      .from(knightedJobApplicationsTable)
      .where(
        listings.length > 0
          ? sql`${knightedJobApplicationsTable.listingId} IN (${sql.join(listings.map((l) => sql`${l.id}`), sql`, `)})`
          : sql`1=0`
      )
      .groupBy(knightedJobApplicationsTable.listingId);

    const countMap = new Map(counts.map((c) => [c.listingId, Number(c.count)]));

    const appBaseUrl = process.env.APP_URL ?? "https://theknightedjobs.com";

    return res.json({
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        company: l.company,
        location: l.location,
        isRemote: l.isRemote,
        employmentType: l.employmentType ?? null,
        isActive: l.isActive,
        isPromoted: l.isPromoted,
        promotedUntil: l.promotedUntil?.toISOString() ?? null,
        expiresAt: l.expiresAt?.toISOString() ?? null,
        postedAt: l.createdAt.toISOString(),
        applicantCount: countMap.get(l.id) ?? 0,
        viewCount: l.viewCount ?? 0,
        reviewUrl: l.reviewToken ? `${appBaseUrl}/knighted-jobs/employer/${l.id}?token=${l.reviewToken}` : null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "employer dashboard error");
    return res.status(500).json({ error: "Failed to fetch employer listings" });
  }
});

// POST /knighted-jobs/listings/:id/view — increment view counter (unauthenticated, fire-and-forget)
router.post("/knighted-jobs/listings/:id/view", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) return res.status(204).end();
  try {
    await db
      .update(knightedJobListingsTable)
      .set({ viewCount: sql`${knightedJobListingsTable.viewCount} + 1` })
      .where(eq(knightedJobListingsTable.id, id));
  } catch (_) { /* silently swallow */ }
  return res.status(204).end();
});

// PATCH /knighted-jobs/listings/:id/status (requireAuth — pause/close)
router.patch("/knighted-jobs/listings/:id/status", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID" });

  const { isActive } = req.body;
  if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive must be a boolean" });

  try {
    const [listing] = await db
      .select({ id: knightedJobListingsTable.id, createdByUserId: knightedJobListingsTable.createdByUserId })
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.id, id))
      .limit(1);

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.createdByUserId !== req.userId) return res.status(403).json({ error: "Not your listing" });

    await db
      .update(knightedJobListingsTable)
      .set({ isActive })
      .where(eq(knightedJobListingsTable.id, id));

    return res.json({ id, isActive });
  } catch (err) {
    req.log.error({ err }, "employer patch status error");
    return res.status(500).json({ error: "Failed to update listing" });
  }
});

// POST /knighted-jobs/listings/:id/promote — create Stripe checkout to promote a listing
const PROMOTE_PRICE_CENTS = 4900; // $49
const PROMOTE_DAYS = 30;
const MAX_PROMOTED_SLOTS = 5;

router.post("/knighted-jobs/listings/:id/promote", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: "Stripe not configured" });

  try {
    // Verify ownership
    const [listing] = await db
      .select({ id: knightedJobListingsTable.id, createdByUserId: knightedJobListingsTable.createdByUserId, title: knightedJobListingsTable.title, company: knightedJobListingsTable.company })
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.id, id))
      .limit(1);

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.createdByUserId !== req.userId) return res.status(403).json({ error: "Not your listing" });

    // Check active promoted slot count
    const [{ activeCount }] = await db
      .select({ activeCount: count() })
      .from(knightedJobListingsTable)
      .where(
        and(
          eq(knightedJobListingsTable.isPromoted, true),
          sql`${knightedJobListingsTable.promotedUntil} > now()`
        )
      );

    if (Number(activeCount) >= MAX_PROMOTED_SLOTS) {
      return res.status(409).json({ error: "All promoted slots are currently taken. Try again later." });
    }

    const stripe = new Stripe(stripeKey);
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Promoted Listing — ${listing.title} at ${listing.company}`,
              description: `Featured at the top of search results for ${PROMOTE_DAYS} days. Limited to ${MAX_PROMOTED_SLOTS} slots.`,
            },
            unit_amount: PROMOTE_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { type: "promote_listing", listingId: String(id), userId: req.userId },
      success_url: `${origin}/knighted-jobs/employer/promote-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/knighted-jobs/employer/dashboard`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "promote listing error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /knighted-jobs/stripe-webhook — activate promoted listing on payment success
router.post("/knighted-jobs/stripe-webhook", async (req: any, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.type === "promote_listing" && meta.listingId) {
      const listingId = Number(meta.listingId);
      const promotedUntil = new Date(Date.now() + PROMOTE_DAYS * 86400 * 1000);
      try {
        await db
          .update(knightedJobListingsTable)
          .set({ isPromoted: true, promotedUntil })
          .where(eq(knightedJobListingsTable.id, listingId));
      } catch (err) {
        // Log but don't fail — Stripe will retry
      }
    }
  }

  return res.json({ received: true });
});

// POST /knighted-jobs/listings
router.post("/knighted-jobs/listings", async (req, res) => {
  const parseResult = CreateKnightedListingBody.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Validation error", details: parseResult.error.issues });
  }

  const data = parseResult.data;

  try {
    const [inserted] = await db
      .insert(knightedJobListingsTable)
      .values({
        title: data.title,
        company: data.company,
        companyWebsite: data.companyWebsite ?? null,
        logoUrl: (data as any).logoUrl ?? null,
        location: data.location ?? "Remote",
        isRemote: data.isRemote ?? false,
        employmentType: data.employmentType ?? null,
        salaryMin: data.salaryMin?.toString() ?? null,
        salaryMax: data.salaryMax?.toString() ?? null,
        salaryCurrency: data.salaryCurrency ?? "USD",
        category: data.category ?? null,
        description: data.description,
        applyUrl: data.applyUrl ?? null,
        contactEmail: data.contactEmail,
        isActive: true,
        createdByUserId: getAuth(req).userId ?? null,
        reviewToken: randomBytes(16).toString("hex"),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      })
      .returning();

    const appBaseUrl = process.env.APP_URL ?? "https://theknightedjobs.com";
    const reviewUrl = inserted.reviewToken
      ? `${appBaseUrl}/knighted-jobs/employer/${inserted.id}?token=${inserted.reviewToken}`
      : null;

    const response = {
      id: inserted.id,
      title: inserted.title,
      company: inserted.company,
      companyWebsite: inserted.companyWebsite ?? null,
      logoUrl: inserted.logoUrl ?? null,
      location: inserted.location,
      isRemote: inserted.isRemote,
      employmentType: inserted.employmentType ?? null,
      salaryMin: inserted.salaryMin ? parseFloat(inserted.salaryMin) : null,
      salaryMax: inserted.salaryMax ? parseFloat(inserted.salaryMax) : null,
      salaryCurrency: inserted.salaryCurrency,
      category: inserted.category ?? null,
      description: inserted.description,
      applyUrl: inserted.applyUrl ?? null,
      contactEmail: inserted.contactEmail,
      postedAt: inserted.createdAt.toISOString(),
      expiresAt: inserted.expiresAt?.toISOString() ?? null,
      isActive: inserted.isActive,
      reviewUrl,
    };

    res.status(201).json(response);

    // Fire post-listing side-effects asynchronously — do not block the response
    if (process.env.RESEND_API_KEY) {
      // 1. Notify the poster that their listing is live
      const salaryText = inserted.salaryMin && inserted.salaryMax
        ? ` · ${inserted.salaryCurrency} ${Number(inserted.salaryMin).toLocaleString()} – ${Number(inserted.salaryMax).toLocaleString()}`
        : "";
      resend.emails.send({
        from: FROM_EMAIL,
        to: inserted.contactEmail,
        subject: `✅ Your job is live: ${inserted.title} at ${inserted.company}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
            <h2 style="color:#f59e0b">Your job is live on KnightedJobs 🎉</h2>
            <h3 style="margin:0 0 8px">${inserted.title}</h3>
            <p style="color:#666;margin:0 0 16px">${inserted.company} · ${inserted.location}${salaryText}</p>
            <p>Your listing is now visible to ambitious professionals across our global network. Here are your important links:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr>
                <td style="padding:10px 0;color:#666;width:140px">View listing</td>
                <td style="padding:10px 0"><a href="${appBaseUrl}/knighted-jobs/jobs/${inserted.id}" style="color:#f59e0b">${appBaseUrl}/knighted-jobs/jobs/${inserted.id}</a></td>
              </tr>
              ${reviewUrl ? `<tr>
                <td style="padding:10px 0;color:#666;vertical-align:top">Applicant inbox</td>
                <td style="padding:10px 0"><a href="${reviewUrl}" style="color:#f59e0b">${reviewUrl}</a><br/><small style="color:#999">Keep this link private — it lets you view and score all applicants with AI.</small></td>
              </tr>` : ""}
            </table>
            <p style="color:#666;font-size:13px">Your listing expires in 60 days. Reply to this email if you need to edit or extend it.</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
            <p style="font-size:12px;color:#999">KnightedJobs · Direct listings, real salary data, no spam.</p>
          </div>
        `,
      }).catch(() => {});

      // 2. Fire matching job alerts
      fireJobAlerts(inserted, req.log).catch((err) =>
        req.log.error({ err }, "knighted-jobs fire alerts error")
      );
    }

    return;
  } catch (err) {
    req.log.error({ err }, "knighted-jobs create listing error");
    return res.status(500).json({ error: "Failed to create listing" });
  }
});

async function fireJobAlerts(listing: typeof knightedJobListingsTable.$inferSelect, log: any) {
  const alerts = await db
    .select()
    .from(knightedJobAlertsTable)
    .where(eq(knightedJobAlertsTable.isActive, true));

  const matches = alerts.filter((alert) => {
    if (alert.remoteOnly && !listing.isRemote) return false;
    if (alert.employmentType && listing.employmentType !== alert.employmentType) return false;
    if (alert.query) {
      const q = alert.query.toLowerCase();
      const searchable = `${listing.title} ${listing.company} ${listing.description} ${listing.category ?? ""}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (alert.location) {
      const loc = alert.location.toLowerCase();
      const listingLoc = listing.location.toLowerCase();
      if (!listingLoc.includes(loc) && !loc.includes("remote")) return false;
    }
    return true;
  });

  if (!matches.length) return;

  const jobUrl = `${process.env.APP_URL ?? "https://theknightedjobs.com"}/knighted-jobs/jobs/direct-${listing.id}`;

  await Promise.allSettled(
    matches.map(async (alert) => {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: alert.email,
          subject: `New role: ${listing.title} at ${listing.company}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
              <h2 style="color:#f59e0b">New job match on TheKnightedJobs</h2>
              <h3 style="margin:0">${listing.title}</h3>
              <p style="color:#666;margin:4px 0 16px">${listing.company} · ${listing.location}${listing.isRemote ? " · Remote" : ""}</p>
              <p>${listing.description.slice(0, 300)}…</p>
              <a href="${jobUrl}" style="display:inline-block;background:#f59e0b;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px">View Job</a>
              <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
              <p style="font-size:12px;color:#999">
                You're receiving this because you set up a job alert on TheKnightedJobs.<br/>
                <a href="https://theknightedjobs.com/knighted-jobs/alerts" style="color:#f59e0b">Manage your alerts</a>
              </p>
            </div>
          `,
        });
        await db
          .update(knightedJobAlertsTable)
          .set({ lastSentAt: new Date() })
          .where(eq(knightedJobAlertsTable.id, alert.id));
      } catch {
        log.warn({ alertId: alert.id }, "alert email failed");
      }
    })
  );
}

// GET /knighted-jobs/listings/:id
router.get("/knighted-jobs/listings/:id", async (req, res) => {
  const parseResult = GetKnightedListingParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid listing ID" });
  }

  try {
    const [listing] = await db
      .select()
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.id, parseResult.data.id))
      .limit(1);

    if (!listing) {
      return res.status(410).json({ error: "Listing no longer available" });
    }

    if (!listing.isActive) {
      return res.status(410).json({ error: "Listing no longer available" });
    }

    return res.json({
      id: listing.id,
      title: listing.title,
      company: listing.company,
      companyWebsite: listing.companyWebsite ?? null,
      logoUrl: listing.logoUrl ?? null,
      location: listing.location,
      isRemote: listing.isRemote,
      employmentType: listing.employmentType ?? null,
      salaryMin: listing.salaryMin ? parseFloat(listing.salaryMin) : null,
      salaryMax: listing.salaryMax ? parseFloat(listing.salaryMax) : null,
      salaryCurrency: listing.salaryCurrency,
      category: listing.category ?? null,
      description: listing.description,
      applyUrl: listing.applyUrl ?? null,
      contactEmail: listing.contactEmail,
      postedAt: listing.createdAt.toISOString(),
      expiresAt: listing.expiresAt?.toISOString() ?? null,
      isActive: listing.isActive,
    });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs get listing error");
    return res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// POST /knighted-jobs/listings/:id/apply
router.post("/knighted-jobs/listings/:id/apply", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID" });

  const parseResult = createJobApplicationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Validation error", details: parseResult.error.issues });
  }

  try {
    const [listing] = await db
      .select()
      .from(knightedJobListingsTable)
      .where(and(eq(knightedJobListingsTable.id, id), eq(knightedJobListingsTable.isActive, true)))
      .limit(1);

    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const [application] = await db
      .insert(knightedJobApplicationsTable)
      .values({
        listingId: id,
        name: parseResult.data.name,
        email: parseResult.data.email,
        phone: parseResult.data.phone ?? null,
        linkedinUrl: parseResult.data.linkedinUrl ?? null,
        coverNote: parseResult.data.coverNote ?? null,
        resumeText: parseResult.data.resumeText ?? null,
      })
      .returning();

    res.status(201).json({ id: application.id });

    // Notify employer asynchronously
    if (process.env.RESEND_API_KEY) {
      const { name, email, phone, linkedinUrl, coverNote } = parseResult.data;
      resend.emails.send({
        from: FROM_EMAIL,
        to: listing.contactEmail,
        subject: `New application: ${name} for ${listing.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
            <h2 style="color:#f59e0b">New application via TheKnightedJobs</h2>
            <h3 style="margin:0">${listing.title}</h3>
            <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#666;width:120px">Name</td><td style="padding:8px 0;font-weight:bold">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#f59e0b">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${phone}</td></tr>` : ""}
              ${linkedinUrl ? `<tr><td style="padding:8px 0;color:#666">LinkedIn</td><td style="padding:8px 0"><a href="${linkedinUrl}" style="color:#f59e0b">${linkedinUrl}</a></td></tr>` : ""}
            </table>
            ${coverNote ? `<div style="margin-top:16px"><p style="color:#666;margin:0 0 8px;font-weight:bold">Cover note:</p><p style="background:#f9f9f9;padding:16px;border-radius:6px;white-space:pre-wrap">${coverNote}</p></div>` : ""}
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
            <p style="font-size:12px;color:#999">Powered by TheKnightedJobs</p>
          </div>
        `,
      }).catch(() => {});
    }

    return;
  } catch (err) {
    req.log.error({ err }, "knighted-jobs apply error");
    return res.status(500).json({ error: "Failed to submit application" });
  }
});

// GET /knighted-jobs/employer/inbox — all applications across all owned listings (requireAuth)
router.get("/knighted-jobs/employer/inbox", requireAuth, async (req: any, res) => {
  try {
    const appBaseUrl = process.env.APP_URL ?? "https://theknightedjobs.com";

    const rows = await db
      .select({
        appId: knightedJobApplicationsTable.id,
        name: knightedJobApplicationsTable.name,
        email: knightedJobApplicationsTable.email,
        phone: knightedJobApplicationsTable.phone,
        linkedinUrl: knightedJobApplicationsTable.linkedinUrl,
        coverNote: knightedJobApplicationsTable.coverNote,
        hasResume: sql<boolean>`(${knightedJobApplicationsTable.resumeText} IS NOT NULL)`,
        appliedAt: knightedJobApplicationsTable.appliedAt,
        listingId: knightedJobListingsTable.id,
        listingTitle: knightedJobListingsTable.title,
        company: knightedJobListingsTable.company,
        reviewToken: knightedJobListingsTable.reviewToken,
      })
      .from(knightedJobApplicationsTable)
      .innerJoin(
        knightedJobListingsTable,
        eq(knightedJobApplicationsTable.listingId, knightedJobListingsTable.id)
      )
      .where(eq(knightedJobListingsTable.createdByUserId, req.userId))
      .orderBy(desc(knightedJobApplicationsTable.appliedAt));

    // Group by listing
    const listingMap = new Map<
      number,
      { id: number; title: string; company: string; reviewUrl: string | null; applications: any[] }
    >();

    for (const row of rows) {
      if (!listingMap.has(row.listingId)) {
        listingMap.set(row.listingId, {
          id: row.listingId,
          title: row.listingTitle,
          company: row.company,
          reviewUrl: row.reviewToken
            ? `${appBaseUrl}/knighted-jobs/employer/${row.listingId}?token=${row.reviewToken}`
            : null,
          applications: [],
        });
      }
      listingMap.get(row.listingId)!.applications.push({
        id: row.appId,
        name: row.name,
        email: row.email,
        phone: row.phone ?? null,
        linkedinUrl: row.linkedinUrl ?? null,
        coverNote: row.coverNote ?? null,
        hasResume: Boolean(row.hasResume),
        appliedAt: row.appliedAt.toISOString(),
      });
    }

    const listings = Array.from(listingMap.values());
    const total = rows.length;

    return res.json({ listings, total });
  } catch (err) {
    req.log.error({ err }, "employer inbox error");
    return res.status(500).json({ error: "Failed to fetch inbox" });
  }
});

// GET /knighted-jobs/listings/:id/applications (employer review — token-gated)
router.get("/knighted-jobs/listings/:id/applications", async (req, res) => {
  const id = Number(req.params.id);
  const token = typeof req.query.token === "string" ? req.query.token : null;

  if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID" });
  if (!token) return res.status(401).json({ error: "Review token required" });

  try {
    const [listing] = await db
      .select()
      .from(knightedJobListingsTable)
      .where(and(eq(knightedJobListingsTable.id, id), eq(knightedJobListingsTable.reviewToken, token)))
      .limit(1);

    if (!listing) return res.status(403).json({ error: "Invalid token or listing not found" });

    const applications = await db
      .select()
      .from(knightedJobApplicationsTable)
      .where(eq(knightedJobApplicationsTable.listingId, id))
      .orderBy(desc(knightedJobApplicationsTable.appliedAt));

    const scored = await Promise.allSettled(
      applications.map(async (app) => {
        const base = {
          id: app.id,
          name: app.name,
          email: app.email,
          phone: app.phone ?? null,
          linkedinUrl: app.linkedinUrl ?? null,
          coverNote: app.coverNote ?? null,
          hasResume: Boolean(app.resumeText),
          appliedAt: app.appliedAt.toISOString(),
          matchScore: null as number | null,
          matchSummary: null as string | null,
        };

        if (!app.resumeText) return base;

        try {
          const completion = await anthropic.messages.create({
            model: MODEL_SONNET,
            max_tokens: 300,
            messages: [{
              role: "user",
              content: `You are an expert recruiter. Score how well this resume matches the job description. Return only valid JSON.

Job: ${listing.title} at ${listing.company}
Description: ${listing.description.slice(0, 1500)}

Resume: ${app.resumeText.slice(0, 2500)}

Return: {"score": <0-100>, "summary": "<2-3 sentences>"}`,
            }],
          });
          const raw = completion.content[0]?.type === "text" ? completion.content[0].text : "{}";
          const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
          return { ...base, matchScore: result.score ?? null, matchSummary: result.summary ?? null };
        } catch {
          return base;
        }
      })
    );

    const results = scored
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean)
      .sort((a, b) => {
        if (a!.matchScore === null && b!.matchScore === null) return 0;
        if (a!.matchScore === null) return 1;
        if (b!.matchScore === null) return -1;
        return (b!.matchScore ?? 0) - (a!.matchScore ?? 0);
      });

    return res.json({ listing: { id: listing.id, title: listing.title, company: listing.company }, applications: results, total: results.length });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs employer review error");
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// GET /knighted-jobs/alerts
router.get("/knighted-jobs/alerts", requireAuth, async (req: any, res) => {
  try {
    const alerts = await db
      .select()
      .from(knightedJobAlertsTable)
      .where(and(eq(knightedJobAlertsTable.userId, req.userId), eq(knightedJobAlertsTable.isActive, true)))
      .orderBy(desc(knightedJobAlertsTable.createdAt));

    return res.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        userId: a.userId,
        email: a.email,
        query: a.query,
        location: a.location ?? null,
        employmentType: a.employmentType ?? null,
        remoteOnly: a.remoteOnly,
        isActive: a.isActive,
        lastSentAt: a.lastSentAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs get alerts error");
    return res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// POST /knighted-jobs/alerts
// Accepts both authenticated users (Clerk session) and anonymous email-only signups.
router.post("/knighted-jobs/alerts", async (req: any, res) => {
  const parseResult = createJobAlertSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Validation error", details: parseResult.error.issues });
  }

  const { email, query, location, employmentType, remoteOnly } = parseResult.data;

  // Use the authenticated userId if present, otherwise derive one from the email
  const auth = getAuth(req);
  const userId = auth?.userId ?? `anon:${email}`;

  try {
    const [alert] = await db
      .insert(knightedJobAlertsTable)
      .values({
        userId,
        email,
        query: query ?? "",
        location: location ?? null,
        employmentType: employmentType ?? null,
        remoteOnly: remoteOnly ?? false,
        isActive: true,
      })
      .returning();

    return res.status(201).json({
      id: alert.id,
      userId: alert.userId,
      email: alert.email,
      query: alert.query,
      location: alert.location ?? null,
      employmentType: alert.employmentType ?? null,
      remoteOnly: alert.remoteOnly,
      isActive: alert.isActive,
      lastSentAt: null,
      createdAt: alert.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs create alert error");
    return res.status(500).json({ error: "Failed to create alert" });
  }
});

// DELETE /knighted-jobs/alerts/:id
router.delete("/knighted-jobs/alerts/:id", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid alert ID" });

  try {
    const deleted = await db
      .delete(knightedJobAlertsTable)
      .where(and(eq(knightedJobAlertsTable.id, id), eq(knightedJobAlertsTable.userId, req.userId)))
      .returning();

    if (!deleted.length) return res.status(404).json({ error: "Not found" });
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "knighted-jobs delete alert error");
    return res.status(500).json({ error: "Failed to delete alert" });
  }
});

// GET /knighted-jobs/saved
router.get("/knighted-jobs/saved", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(knightedSavedJobsTable)
      .where(eq(knightedSavedJobsTable.userId, req.userId))
      .orderBy(desc(knightedSavedJobsTable.savedAt));

    return res.json({
      savedJobs: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        jobId: r.jobId,
        jobSnapshot: r.jobSnapshot,
        savedAt: r.savedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs get saved error");
    return res.status(500).json({ error: "Failed to fetch saved jobs" });
  }
});

// POST /knighted-jobs/saved
router.post("/knighted-jobs/saved", requireAuth, async (req: any, res) => {
  const parseResult = saveJobInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Validation error", details: parseResult.error.issues });
  }

  const { jobId, jobSnapshot } = parseResult.data;

  try {
    const [row] = await db
      .insert(knightedSavedJobsTable)
      .values({ userId: req.userId, jobId, jobSnapshot })
      .onConflictDoNothing()
      .returning();

    if (!row) {
      // Already saved — fetch existing
      const [existing] = await db
        .select()
        .from(knightedSavedJobsTable)
        .where(and(eq(knightedSavedJobsTable.userId, req.userId), eq(knightedSavedJobsTable.jobId, jobId)))
        .limit(1);
      return res.status(201).json({
        id: existing.id,
        userId: existing.userId,
        jobId: existing.jobId,
        jobSnapshot: existing.jobSnapshot,
        savedAt: existing.savedAt.toISOString(),
      });
    }

    return res.status(201).json({
      id: row.id,
      userId: row.userId,
      jobId: row.jobId,
      jobSnapshot: row.jobSnapshot,
      savedAt: row.savedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs save job error");
    return res.status(500).json({ error: "Failed to save job" });
  }
});

// DELETE /knighted-jobs/saved/:jobId
router.delete("/knighted-jobs/saved/:jobId", requireAuth, async (req: any, res) => {
  const jobId = req.params.jobId;
  if (!jobId) return res.status(400).json({ error: "Missing jobId" });

  try {
    const deleted = await db
      .delete(knightedSavedJobsTable)
      .where(and(eq(knightedSavedJobsTable.userId, req.userId), eq(knightedSavedJobsTable.jobId, jobId)))
      .returning();

    if (!deleted.length) return res.status(404).json({ error: "Not found" });
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "knighted-jobs unsave job error");
    return res.status(500).json({ error: "Failed to unsave job" });
  }
});

// GET /knighted-jobs/location-suggestions
router.get("/knighted-jobs/location-suggestions", async (req, res) => {
  const q = ((req.query.q as string) || "").trim().toLowerCase();
  if (q.length < 2) return res.json({ suggestions: [] });
  try {
    const rows = await db
      .select({ location: knightedJobListingsTable.location })
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.isActive, true))
      .limit(500);

    // Split "City, Country" → individual segments; deduplicate; filter
    const allLocations = new Set<string>();
    rows.forEach((r) => {
      if (r.location) {
        // Keep both "London, UK" and "London"
        allLocations.add(r.location.trim());
        const city = r.location.split(",")[0].trim();
        if (city) allLocations.add(city);
      }
    });

    const suggestions = [...allLocations]
      .filter((l) => l.toLowerCase().includes(q))
      .sort((a, b) => {
        // Prefer full "City, Country" form and put prefix matches first
        const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.localeCompare(b);
      })
      .slice(0, 8);

    return res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "location-suggestions error");
    return res.json({ suggestions: [] });
  }
});

// GET /knighted-jobs/sitemap.xml
router.get("/knighted-jobs/sitemap.xml", async (req, res) => {
  try {
    const listings = await db
      .select({ id: knightedJobListingsTable.id, createdAt: knightedJobListingsTable.createdAt })
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.isActive, true))
      .orderBy(desc(knightedJobListingsTable.createdAt))
      .limit(5000);

    const baseUrl = "https://theknightedjobs.com";
    const staticPages = ["/", "/jobs", "/salary", "/blog", "/post-a-job"];

    const CATEGORY_SLUGS: Record<string, string> = {
      "finance": "Finance", "consulting": "Consulting", "legal": "Legal",
      "engineering": "Engineering", "energy": "Energy", "operations": "Operations",
      "healthcare": "Healthcare", "public-sector": "Public Sector", "academia": "Academia",
      "data-ai": "Data & AI", "product": "Product", "marketing": "Marketing",
      "sales": "Sales", "design": "Design", "social-work": "Social Work",
      "psychology": "Psychology", "communications": "Communications",
      "arts-culture": "Arts & Culture", "people-hr": "People & HR",
    };
    const CITY_SLUGS: Record<string, string> = {
      "london": "London", "new-york": "New York", "singapore": "Singapore",
      "hong-kong": "Hong Kong", "dubai": "Dubai", "frankfurt": "Frankfurt",
      "paris": "Paris", "amsterdam": "Amsterdam", "zurich": "Zurich",
      "sydney": "Sydney", "tokyo": "Tokyo", "seoul": "Seoul",
      "kuala-lumpur": "Kuala Lumpur", "mumbai": "Mumbai", "bangalore": "Bangalore",
    };

    const staticUrls = staticPages.map((p) =>
      `  <url><loc>${baseUrl}${p === "/" ? "" : "/knighted-jobs" + p}</loc><changefreq>daily</changefreq><priority>${p === "/" ? "1.0" : "0.8"}</priority></url>`
    );

    const jobUrls = listings.map((l) =>
      `  <url><loc>${baseUrl}/knighted-jobs/jobs/${l.id}</loc><lastmod>${new Date(l.createdAt!).toISOString().split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    );

    // Landing page URLs: /jobs/:category, /jobs/:city, /jobs/:category/:city
    const catSlugs = Object.keys(CATEGORY_SLUGS);
    const citySlugs = Object.keys(CITY_SLUGS);
    const categoryUrls = catSlugs.map(s =>
      `  <url><loc>${baseUrl}/knighted-jobs/jobs/${s}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    );
    const cityUrls = citySlugs.map(s =>
      `  <url><loc>${baseUrl}/knighted-jobs/jobs/${s}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    );
    const combinedUrls: string[] = [];
    for (const cat of catSlugs) {
      for (const city of citySlugs) {
        combinedUrls.push(
          `  <url><loc>${baseUrl}/knighted-jobs/jobs/${cat}/${city}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        );
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...cityUrls, ...combinedUrls, ...jobUrls].join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    return res.send(xml);
  } catch (err) {
    req.log.error({ err }, "sitemap.xml error");
    return res.status(500).send("Error generating sitemap");
  }
});

// GET /knighted-jobs/stats
router.get("/knighted-jobs/stats", async (req, res) => {
  try {
    const [totalResult, categoriesResult] = await Promise.all([
      db
        .select({
          total: count(),
          companies: sql<number>`COUNT(DISTINCT ${knightedJobListingsTable.company})`,
        })
        .from(knightedJobListingsTable)
        .where(eq(knightedJobListingsTable.isActive, true)),
      db
        .select({
          name: knightedJobListingsTable.category,
          count: count(),
        })
        .from(knightedJobListingsTable)
        .where(eq(knightedJobListingsTable.isActive, true))
        .groupBy(knightedJobListingsTable.category)
        .orderBy(desc(count())),
    ]);

    const totalDirectListings = totalResult[0]?.total ?? 0;
    const totalCompanies = totalResult[0]?.companies ?? 0;

    const topCategories = categoriesResult
      .filter((r) => r.name != null)
      .map((r) => ({ name: r.name as string, count: r.count }));

    return res.json({
      totalJobs: totalDirectListings,
      totalCompanies: totalCompanies,
      totalDirectListings,
      topCategories,
    });
  } catch (err) {
    req.log.error({ err }, "knighted-jobs stats error");
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── Seeker Profile ────────────────────────────────────────────────────────

const seekerProfileInputSchema = createSeekerProfileSchema;

router.get("/knighted-jobs/profile", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(knightedSeekerProfilesTable)
      .where(eq(knightedSeekerProfilesTable.userId, req.userId))
      .limit(1);

    if (!profile) {
      return res.json({ userId: req.userId, updatedAt: new Date().toISOString() });
    }
    return res.json({ ...profile, updatedAt: profile.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get seeker profile error");
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/knighted-jobs/profile", requireAuth, async (req: any, res) => {
  const parse = seekerProfileInputSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Validation error", details: parse.error.issues });

  try {
    const [updated] = await db
      .insert(knightedSeekerProfilesTable)
      .values({ userId: req.userId, ...parse.data })
      .onConflictDoUpdate({
        target: knightedSeekerProfilesTable.userId,
        set: { ...parse.data, updatedAt: new Date() },
      })
      .returning();
    return res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update seeker profile error");
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── KI Match Score ────────────────────────────────────────────────────────

const matchScoreInputSchema = createMatchScoreSchema;

router.post("/knighted-jobs/match-score", async (req, res) => {
  const parse = matchScoreInputSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Validation error", details: parse.error.issues });

  try {
    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 1024,
      system: `You are an expert ATS analyst. Analyse the resume and job description and return JSON with:
- score (0-100 integer)
- summary (1-2 sentence overall assessment)
- matchedKeywords (array of strings — up to 10 key terms the resume already covers)
- missingKeywords (array of strings — up to 8 important terms missing from the resume)
- suggestions (array of 3 actionable strings to improve the match)

Be realistic. Most resumes score 40-75. Return only valid JSON, no markdown.`,
      messages: [
        {
          role: "user",
          content: `JOB DESCRIPTION:\n${parse.data.jobDescription.slice(0, 3000)}\n\nRESUME:\n${parse.data.resumeText.slice(0, 3000)}`,
        },
      ],
    });

    const rawText = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const raw = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    return res.json({
      score: Math.min(100, Math.max(0, Number(raw.score) || 0)),
      summary: raw.summary ?? "",
      matchedKeywords: Array.isArray(raw.matchedKeywords) ? raw.matchedKeywords : [],
      missingKeywords: Array.isArray(raw.missingKeywords) ? raw.missingKeywords : [],
      suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    });
  } catch (err) {
    req.log.error({ err }, "match-score error");
    return res.status(500).json({ error: "Failed to score match" });
  }
});

// ─── Personalized Recommendations ─────────────────────────────────────────

router.get("/knighted-jobs/recommendations", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(knightedSeekerProfilesTable)
      .where(eq(knightedSeekerProfilesTable.userId, req.userId))
      .limit(1);

    if (!profile || (!profile.skills && !profile.jobTitle)) {
      // No profile yet — return newest listings
      const listings = await db
        .select()
        .from(knightedJobListingsTable)
        .where(eq(knightedJobListingsTable.isActive, true))
        .orderBy(desc(knightedJobListingsTable.createdAt))
        .limit(6);
      return res.json({ listings });
    }

    // Use title + skills to filter relevant listings
    const keywords = [
      profile.jobTitle,
      ...(profile.skills ? profile.skills.split(",").map((s: string) => s.trim()) : []),
    ].filter(Boolean) as string[];

    const baseQuery = db
      .select()
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.isActive, true));

    const all = await baseQuery.orderBy(desc(knightedJobListingsTable.createdAt)).limit(100);

    // Score each listing by keyword overlap
    const scored = all
      .map((listing) => {
        const text = `${listing.title} ${listing.description} ${listing.category ?? ""}`.toLowerCase();
        const score = keywords.reduce((acc, kw) => acc + (text.includes(kw.toLowerCase()) ? 1 : 0), 0);
        return { listing, score };
      })
      .sort((a, b) => b.score - a.score || new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime())
      .slice(0, 6)
      .map((x) => x.listing);

    return res.json({ listings: scored });
  } catch (err) {
    req.log.error({ err }, "recommendations error");
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// GET /knighted-jobs/salary — crowd-sourced + Adzuna salary data by role/location
router.get("/knighted-jobs/salary", async (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role.trim() : "";
  const location = typeof req.query.location === "string" ? req.query.location.trim() : undefined;

  if (!role || role.length < 2) {
    return res.status(400).json({ error: "role query param required (min 2 chars)" });
  }

  try {
    const roleLower = role.toLowerCase();

    // 1. Direct listings with salary data
    const directListings = await db
      .select({
        title: knightedJobListingsTable.title,
        location: knightedJobListingsTable.location,
        salaryMin: knightedJobListingsTable.salaryMin,
        salaryMax: knightedJobListingsTable.salaryMax,
        salaryCurrency: knightedJobListingsTable.salaryCurrency,
      })
      .from(knightedJobListingsTable)
      .where(
        and(
          eq(knightedJobListingsTable.isActive, true),
          sql`(${knightedJobListingsTable.salaryMin} IS NOT NULL OR ${knightedJobListingsTable.salaryMax} IS NOT NULL)`
        )
      )
      .limit(200);

    const matchingDirect = directListings.filter((l) => {
      const titleLower = l.title.toLowerCase();
      // Require a word-boundary match so "engineer" doesn't blend salaries from
      // "Software Engineer", "Data Engineer", and "Electrical Engineer" together.
      const escapedRole = roleLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordBoundaryRe = new RegExp(`(?:^|\\s)${escapedRole}(?:\\s|$|[,./])`);
      const titleMatch = titleLower.includes(roleLower) && wordBoundaryRe.test(titleLower);
      const locMatch = !location || l.location.toLowerCase().includes(location.toLowerCase());
      return titleMatch && locMatch;
    });

    // 2. Adzuna data (parallel)
    const adzunaJobs = await fetchAdzunaJobs(role, location);
    const escapedRoleAdz = roleLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const adzunaTitleRe = new RegExp(`(?:^|\\s)${escapedRoleAdz}(?:\\s|$|[,./])`, "i");
    const adzunaWithSalary = adzunaJobs.filter((j) => {
      if (!j.salaryMin && !j.salaryMax) return false;
      const t = j.title.toLowerCase();
      return t.includes(roleLower) && adzunaTitleRe.test(t);
    });

    type SalarySample = {
      title: string;
      location: string;
      min: number | null;
      max: number | null;
      midpoint: number;
      source: "direct" | "adzuna";
    };

    const samples: SalarySample[] = [
      ...matchingDirect.map((l) => {
        const min = l.salaryMin ? parseFloat(l.salaryMin) : null;
        const max = l.salaryMax ? parseFloat(l.salaryMax) : null;
        const midpoint = min && max ? (min + max) / 2 : (min ?? max ?? 0);
        return { title: l.title, location: l.location, min, max, midpoint, source: "direct" as const };
      }),
      ...adzunaWithSalary.map((j) => {
        const min = j.salaryMin ? Number(j.salaryMin) : null;
        const max = j.salaryMax ? Number(j.salaryMax) : null;
        const midpoint = min && max ? (min + max) / 2 : (min ?? max ?? 0);
        return { title: j.title, location: j.location, min, max, midpoint, source: "adzuna" as const };
      }),
    ].filter((s) => s.midpoint > 10000); // sanity filter

    if (samples.length === 0) {
      return res.json({ role, location, samples: [], median: null, p25: null, p75: null, min: null, max: null, count: 0, directCount: 0, adzunaCount: 0 });
    }

    const midpoints = samples.map((s) => s.midpoint).sort((a, b) => a - b);
    const median = midpoints[Math.floor(midpoints.length / 2)];
    const p25 = midpoints[Math.floor(midpoints.length * 0.25)];
    const p75 = midpoints[Math.floor(midpoints.length * 0.75)];

    return res.json({
      role,
      location: location ?? null,
      samples: samples.slice(0, 30),
      median,
      p25,
      p75,
      min: midpoints[0],
      max: midpoints[midpoints.length - 1],
      count: midpoints.length,
      directCount: samples.filter((s) => s.source === "direct").length,
      adzunaCount: samples.filter((s) => s.source === "adzuna").length,
    });
  } catch (err) {
    req.log.error({ err }, "salary explorer error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// --------------- Company Profiles ---------------

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// GET /knighted-jobs/employer/company — get current user's company profile
router.get("/knighted-jobs/employer/company", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(knightedCompanyProfilesTable)
      .where(eq(knightedCompanyProfilesTable.userId, req.userId))
      .limit(1);

    if (!profile) return res.status(404).json({ error: "No company profile found" });

    return res.json({
      ...profile,
      techStack: profile.techStack ? JSON.parse(profile.techStack) : [],
      benefits: profile.benefits ? JSON.parse(profile.benefits) : [],
    });
  } catch (err) {
    req.log.error({ err }, "get company profile error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /knighted-jobs/employer/company — upsert current user's company profile
router.put("/knighted-jobs/employer/company", requireAuth, async (req: any, res) => {
  const parseResult = upsertCompanyProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Validation error", details: parseResult.error.issues });
  }

  const data = parseResult.data;
  const baseSlug = makeSlug(data.companyName);

  try {
    // Check if a profile already exists for this user
    const [existing] = await db
      .select({ id: knightedCompanyProfilesTable.id, slug: knightedCompanyProfilesTable.slug })
      .from(knightedCompanyProfilesTable)
      .where(eq(knightedCompanyProfilesTable.userId, req.userId))
      .limit(1);

    let slug = existing?.slug ?? baseSlug;

    // If no existing profile, ensure slug uniqueness
    if (!existing) {
      let attempt = 0;
      while (true) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
        const [conflict] = await db
          .select({ id: knightedCompanyProfilesTable.id })
          .from(knightedCompanyProfilesTable)
          .where(eq(knightedCompanyProfilesTable.slug, candidate))
          .limit(1);
        if (!conflict) { slug = candidate; break; }
        attempt++;
        if (attempt > 20) { slug = `${baseSlug}-${Date.now()}`; break; }
      }
    }

    const values = {
      userId: req.userId,
      companyName: data.companyName,
      slug,
      logoUrl: data.logoUrl || null,
      website: data.website || null,
      location: data.location || null,
      size: data.size || null,
      foundedYear: data.foundedYear ?? null,
      cultureBlurb: data.cultureBlurb || null,
      techStack: data.techStack ? JSON.stringify(data.techStack) : null,
      benefits: data.benefits ? JSON.stringify(data.benefits) : null,
      updatedAt: new Date(),
    };

    let profile;
    if (existing) {
      const [updated] = await db
        .update(knightedCompanyProfilesTable)
        .set(values)
        .where(eq(knightedCompanyProfilesTable.userId, req.userId))
        .returning();
      profile = updated;
    } else {
      const [inserted] = await db
        .insert(knightedCompanyProfilesTable)
        .values(values)
        .returning();
      profile = inserted;
    }

    return res.json({
      ...profile,
      techStack: profile.techStack ? JSON.parse(profile.techStack) : [],
      benefits: profile.benefits ? JSON.parse(profile.benefits) : [],
    });
  } catch (err) {
    req.log.error({ err }, "upsert company profile error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /knighted-jobs/companies/:slug — public company profile
router.get("/knighted-jobs/companies/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    // Try exact slug match from employer profiles first
    const [profile] = await db
      .select()
      .from(knightedCompanyProfilesTable)
      .where(eq(knightedCompanyProfilesTable.slug, slug))
      .limit(1);

    if (profile) {
      const listings = await db
        .select()
        .from(knightedJobListingsTable)
        .where(
          and(
            eq(knightedJobListingsTable.createdByUserId, profile.userId),
            eq(knightedJobListingsTable.isActive, true)
          )
        )
        .orderBy(desc(knightedJobListingsTable.createdAt))
        .limit(20);

      return res.json({
        profile: {
          ...profile,
          techStack: profile.techStack ? JSON.parse(profile.techStack) : [],
          benefits: profile.benefits ? JSON.parse(profile.benefits) : [],
        },
        listings: listings.map(mapListingToJob),
      });
    }

    // Fall back: find any listing whose company name slugifies to this slug
    const allActive = await db
      .select()
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.isActive, true))
      .limit(1000);

    const matched = allActive.filter((l) => makeSlug(l.company) === slug);
    if (matched.length === 0) return res.status(404).json({ error: "Company not found" });

    const companyName = matched[0].company;
    const website = matched[0].companyWebsite ?? null;

    return res.json({
      profile: {
        companyName,
        slug,
        logoUrl: null,
        website,
        location: null,
        size: null,
        foundedYear: null,
        cultureBlurb: null,
        techStack: [],
        benefits: [],
      },
      listings: matched.slice(0, 20).map(mapListingToJob),
    });
  } catch (err) {
    req.log.error({ err }, "get company profile public error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// --------------- Referral Loop ---------------

function generateToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

// GET /knighted-jobs/r/:token — track click, redirect to listing
router.get("/knighted-jobs/r/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const [row] = await db
      .select()
      .from(sql`knighted_job_referrals` as any)
      .where(sql`token = ${token}`)
      .limit(1) as any[];

    if (!row) return res.redirect("/knighted-jobs/jobs");

    // Increment click count
    await db.execute(sql`
      UPDATE knighted_job_referrals SET click_count = click_count + 1 WHERE token = ${token}
    `);

    return res.redirect(`/knighted-jobs/jobs/${row.listing_id}?ref=${token}`);
  } catch (err) {
    req.log.error({ err }, "referral track error");
    return res.redirect("/knighted-jobs/jobs");
  }
});

// POST /knighted-jobs/referrals — create referral link for a listing (auth required)
router.post("/knighted-jobs/referrals", requireAuth as any, async (req: any, res) => {
  const { listingId } = req.body ?? {};
  if (!listingId) return res.status(400).json({ error: "listingId required" });

  try {
    // Check listing exists
    const [listing] = await db
      .select({ id: knightedJobListingsTable.id })
      .from(knightedJobListingsTable)
      .where(eq(knightedJobListingsTable.id, Number(listingId)))
      .limit(1);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Check if referral already exists for this user+listing
    const existing = await db.execute(sql`
      SELECT token FROM knighted_job_referrals
      WHERE referrer_user_id = ${req.userId} AND listing_id = ${Number(listingId)}
      LIMIT 1
    `);
    if (existing.rows.length > 0) {
      return res.json({ token: (existing.rows[0] as any).token });
    }

    const token = generateToken();
    await db.execute(sql`
      INSERT INTO knighted_job_referrals (referrer_user_id, listing_id, token)
      VALUES (${req.userId}, ${Number(listingId)}, ${token})
    `);
    return res.json({ token });
  } catch (err) {
    req.log.error({ err }, "create referral error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /knighted-jobs/referrals — get user's referral stats (auth required)
router.get("/knighted-jobs/referrals", requireAuth as any, async (req: any, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT r.id, r.token, r.listing_id, r.click_count, r.created_at,
             l.title, l.company
      FROM knighted_job_referrals r
      JOIN knighted_job_listings l ON l.id = r.listing_id
      WHERE r.referrer_user_id = ${req.userId}
      ORDER BY r.click_count DESC, r.created_at DESC
      LIMIT 50
    `);

    const referrals = rows.rows.map((r: any) => ({
      id: r.id,
      token: r.token,
      listingId: r.listing_id,
      listingTitle: r.title,
      company: r.company,
      clickCount: r.click_count,
      createdAt: r.created_at,
    }));

    const totalClicks = referrals.reduce((sum: number, r: any) => sum + r.clickCount, 0);
    const rewardsEarned = Math.floor(totalClicks / 5);

    return res.json({ referrals, totalClicks, rewardsEarned });
  } catch (err) {
    req.log.error({ err }, "get referrals error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
