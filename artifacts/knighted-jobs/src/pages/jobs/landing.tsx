import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Briefcase, ChevronRight, ArrowRight } from "lucide-react";
import { useSearchKnightedJobs } from "@workspace/api-client-react";
import {
  CATEGORY_SLUGS, CITY_SLUGS, TOP_CITIES, TOP_CATEGORIES,
  getCategorySlug, getCitySlug,
  type LandingMode,
} from "@/data/landing-pages";

interface Props {
  mode: LandingMode;
  catSlug?: string;
  citySlug?: string;
}

const CATEGORY_DESCRIPTION: Record<string, string> = {
  "Finance":        "investment banking, asset management, private equity, treasury, and financial analysis",
  "Consulting":     "management consulting, strategy, transformation, and advisory",
  "Legal":          "corporate law, regulatory compliance, litigation, and in-house counsel",
  "Engineering":    "software, infrastructure, mechanical, chemical, and systems engineering",
  "Energy":         "oil & gas, renewables, utilities, carbon markets, and energy trading",
  "Operations":     "supply chain, logistics, process improvement, and general management",
  "Healthcare":     "clinical, pharmaceutical, biotech, and health administration",
  "Public Sector":  "government, international organisations, policy, and civil service",
  "Academia":       "research, teaching, lecturing, and university administration",
  "Data & AI":      "data science, machine learning, analytics, and AI engineering",
  "Product":        "product management, product strategy, and product design",
  "Marketing":      "brand, performance marketing, growth, and communications",
  "Sales":          "account management, business development, and enterprise sales",
  "Design":         "UX, visual design, brand identity, and creative direction",
  "Social Work":    "community services, welfare, and social care",
  "Psychology":     "clinical psychology, organisational behaviour, and counselling",
  "Communications": "PR, internal comms, media relations, and copywriting",
  "Arts & Culture": "museums, galleries, performing arts, and creative industries",
  "People & HR":    "talent acquisition, HR business partnering, and people operations",
};

export function JobLandingPage({ mode, catSlug, citySlug }: Props) {
  const categoryName = catSlug ? CATEGORY_SLUGS[catSlug] : undefined;
  const cityName     = citySlug ? CITY_SLUGS[citySlug] : undefined;

  const { data, isLoading } = useSearchKnightedJobs({
    category: categoryName || undefined,
    location: cityName || undefined,
    page: 1,
  });

  const jobCount   = data?.total ?? 0;
  const jobs       = data?.jobs?.slice(0, 9) ?? [];

  // ── SEO title & meta ─────────────────────────────────────────────────
  const h1 = mode === "combined"
    ? `${categoryName} Jobs in ${cityName}`
    : mode === "category"
      ? `${categoryName} Jobs`
      : `Jobs in ${cityName}`;

  const description = mode === "combined"
    ? `Browse ${jobCount}+ ${categoryName} jobs in ${cityName}. Direct listings, salary data, and AI-powered resume tailoring — no ads, no noise.`
    : mode === "category"
      ? `Find ${jobCount}+ ${categoryName} jobs covering ${CATEGORY_DESCRIPTION[categoryName ?? ""] ?? "top roles"}. Direct listings with disclosed salaries.`
      : `Discover ${jobCount}+ jobs in ${cityName} across Finance, Law, Consulting, Engineering, and more. Direct listings with real salary data.`;

  const canonicalPath = mode === "combined" ? `/jobs/${catSlug}/${citySlug}`
    : mode === "category" ? `/jobs/${catSlug}` : `/jobs/${citySlug}`;

  useSEO({ title: h1, description, canonical: canonicalPath });

  // ── Breadcrumbs ───────────────────────────────────────────────────────
  const crumbs = [
    { label: "Jobs", href: "/jobs" },
    ...(categoryName
      ? [{ label: categoryName, href: `/jobs/${catSlug}` }]
      : []),
    ...(cityName
      ? [{ label: cityName, href: mode === "combined" ? `/jobs/${catSlug}/${citySlug}` : `/jobs/${citySlug}` }]
      : []),
  ];

  // ── Related links ─────────────────────────────────────────────────────
  const relatedCities = TOP_CITIES.filter(c => c !== citySlug).slice(0, 8);
  const relatedCategories = TOP_CATEGORIES.filter(c => c !== catSlug).slice(0, 8);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      {/* JSON-LD breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": crumbs.map((c, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": c.label,
              "item": `https://knightedjobs.com/knighted-jobs${c.href}`,
            })),
          }),
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section aria-label="Job listings overview" className="bg-card border-b border-border py-12 md:py-16">
        <div className="container max-w-6xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {i < crumbs.length - 1
                  ? <Link href={c.href} className="hover:text-primary transition-colors">{c.label}</Link>
                  : <span className="text-foreground font-medium">{c.label}</span>
                }
              </span>
            ))}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3 text-foreground">
                {h1}
              </h1>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
            </div>
            <div className="flex flex-col items-start md:items-end shrink-0">
              {isLoading ? (
                <Skeleton className="h-10 w-28" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary">{jobCount.toLocaleString()}+</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Open Roles</div>
                </>
              )}
            </div>
          </div>

          {/* Quick-search CTA */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/jobs?${new URLSearchParams({
                ...(categoryName ? { category: categoryName } : {}),
                ...(cityName ? { location: cityName } : {}),
              }).toString()}`}>
                Browse All {h1} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-border">
              <Link href="/post-a-job">Post a Job</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-6xl py-10" aria-label="Job listings">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Job listings ──────────────────────────────────────────── */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-5">
              {isLoading ? "Loading…" : `${jobCount.toLocaleString()} ${h1}`}
              <span className="text-muted-foreground font-normal text-sm ml-2">Direct listings first</span>
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full rounded-xl bg-card" />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-2">No direct listings yet</p>
                <p className="text-sm text-muted-foreground mb-4">Be the first to post a job here.</p>
                <Button asChild size="sm">
                  <Link href="/post-a-job">Post a Job</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>
                {jobCount > 9 && (
                  <div className="mt-8 text-center">
                    <Button asChild variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary/10">
                      <Link href={`/jobs?${new URLSearchParams({
                        ...(categoryName ? { category: categoryName } : {}),
                        ...(cityName ? { location: cityName } : {}),
                      }).toString()}`}>
                        View all {jobCount.toLocaleString()} {h1} <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Related sidebar ───────────────────────────────────────── */}
          <div className="w-full lg:w-64 space-y-8 shrink-0">

            {/* Browse by city */}
            {mode !== "city" && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {categoryName ? `${categoryName} Jobs by City` : "Browse by City"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedCities.map(slug => (
                    <Link key={slug}
                      href={mode === "category" ? `/jobs/${catSlug}/${slug}` : `/jobs/${slug}`}>
                      <Badge variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-xs">
                        {CITY_SLUGS[slug]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Browse by category */}
            {mode !== "category" && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  {cityName ? `Jobs in ${cityName} by Category` : "Browse by Category"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedCategories.map(slug => (
                    <Link key={slug}
                      href={mode === "city" ? `/jobs/${slug}/${citySlug}` : `/jobs/${slug}`}>
                      <Badge variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-xs">
                        {CATEGORY_SLUGS[slug]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* On combined page: show cross-links */}
            {mode === "combined" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3">More {categoryName} Jobs</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedCities.slice(0, 6).map(slug => (
                      <Link key={slug} href={`/jobs/${catSlug}/${slug}`}>
                        <Badge variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-xs">
                          {CITY_SLUGS[slug]}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">More Jobs in {cityName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedCategories.slice(0, 6).map(slug => (
                      <Link key={slug} href={`/jobs/${slug}/${citySlug}`}>
                        <Badge variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-xs">
                          {CATEGORY_SLUGS[slug]}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Popular landing pages */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Popular Searches</h3>
              <ul className="space-y-1.5">
                {[
                  { label: "Finance Jobs in London",    href: "/jobs/finance/london" },
                  { label: "Finance Jobs in New York",  href: "/jobs/finance/new-york" },
                  { label: "Consulting Jobs in Dubai",  href: "/jobs/consulting/dubai" },
                  { label: "Legal Jobs in London",      href: "/jobs/legal/london" },
                  { label: "Data & AI Jobs in Singapore", href: "/jobs/data-ai/singapore" },
                  { label: "Engineering Jobs in Zurich",href: "/jobs/engineering/zurich" },
                ].map(p => (
                  <li key={p.href}>
                    <Link href={p.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 shrink-0" />{p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
