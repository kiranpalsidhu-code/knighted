import { writeFileSync, mkdirSync } from "fs";

const DOMAIN = process.env.CRAWL_WEB_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN;
if (!DOMAIN) {
  console.error("CRAWL_WEB_DOMAIN is not set");
  process.exit(1);
}

const BASE_URL = `https://${DOMAIN}`;

interface RouteCheck {
  route: string;
  requiresAuth: boolean;
  description: string;
}

const ROUTES: RouteCheck[] = [
  { route: "/", requiresAuth: false, description: "Landing page" },
  { route: "/pricing", requiresAuth: false, description: "Pricing tiers" },
  { route: "/blog", requiresAuth: false, description: "Blog index" },
  { route: "/privacy", requiresAuth: false, description: "Privacy policy" },
  { route: "/terms", requiresAuth: false, description: "Terms of service" },
  { route: "/contact", requiresAuth: false, description: "Contact page" },
  { route: "/sign-in", requiresAuth: false, description: "Sign in" },
  { route: "/sign-up", requiresAuth: false, description: "Sign up" },
  { route: "/dashboard", requiresAuth: true, description: "Dashboard" },
  { route: "/resumes", requiresAuth: true, description: "Resumes list" },
  { route: "/cover-letters", requiresAuth: true, description: "Cover letters list" },
  { route: "/jobs", requiresAuth: true, description: "Job search" },
  { route: "/pipeline", requiresAuth: true, description: "Application pipeline" },
  { route: "/contacts", requiresAuth: true, description: "Networking / contacts tracker" },
  { route: "/interview", requiresAuth: true, description: "Interview prep" },
  { route: "/feedback", requiresAuth: true, description: "AI resume feedback" },
  { route: "/referrals", requiresAuth: true, description: "Referral program" },
];

const API_ROUTES = [
  { route: "/api/resume-ready/dashboard", description: "Dashboard data (expects 401 unauthenticated)" },
  { route: "/api/resume-ready/me", description: "Current user (expects 401 unauthenticated)" },
  { route: "/api/resume-ready/applications", description: "Applications list (expects 401 unauthenticated)" },
  { route: "/api/resume-ready/contacts", description: "Contacts list (expects 401 unauthenticated)" },
];

interface CrawlResult {
  route: string;
  description: string;
  status: number | "ERROR";
  ok: boolean;
  responseTimeMs: number;
  contentLength: number;
  note: string;
}

async function checkRoute(route: string, description: string, expectedStatuses: number[]): Promise<CrawlResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
    const body = await res.text();
    const responseTimeMs = Date.now() - start;
    const ok = expectedStatuses.includes(res.status);
    return {
      route,
      description,
      status: res.status,
      ok,
      responseTimeMs,
      contentLength: body.length,
      note: ok ? "OK" : `Unexpected status (expected one of ${expectedStatuses.join(", ")})`,
    };
  } catch (err) {
    return {
      route,
      description,
      status: "ERROR",
      ok: false,
      responseTimeMs: Date.now() - start,
      contentLength: 0,
      note: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log(`Crawling website at ${BASE_URL} ...`);
  const results: CrawlResult[] = [];

  for (const r of ROUTES) {
    // SPA: every client route is served by the same index.html shell with 200.
    results.push(await checkRoute(r.route, r.description, [200]));
  }

  for (const r of API_ROUTES) {
    results.push(await checkRoute(r.route, r.description, [401]));
  }

  mkdirSync("reports", { recursive: true });

  const csvHeader = "route,description,status,ok,responseTimeMs,contentLength,note";
  const csvRows = results.map((r) =>
    [r.route, JSON.stringify(r.description), r.status, r.ok, r.responseTimeMs, r.contentLength, JSON.stringify(r.note)].join(",")
  );
  writeFileSync("reports/website-crawl.csv", [csvHeader, ...csvRows].join("\n") + "\n");

  const passCount = results.filter((r) => r.ok).length;
  const failCount = results.length - passCount;
  const mdLines = [
    "# Website Crawl Report",
    "",
    `Base URL: ${BASE_URL}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    `**${passCount} passed, ${failCount} failed** out of ${results.length} routes checked.`,
    "",
    "> Note: This is an HTTP-level crawl (status codes, response times, payload size). It confirms the server responds correctly for each route but does not execute client-side JavaScript, so it will not catch React runtime errors, broken buttons, or rendering bugs inside the SPA. Pair with the browser-based test suite for full behavioral coverage.",
    "",
    "| Route | Description | Status | Result | Time (ms) | Size (bytes) | Note |",
    "|---|---|---|---|---|---|---|",
    ...results.map(
      (r) =>
        `| \`${r.route}\` | ${r.description} | ${r.status} | ${r.ok ? "✅ Pass" : "❌ Fail"} | ${r.responseTimeMs} | ${r.contentLength} | ${r.note} |`
    ),
  ];
  writeFileSync("reports/website-crawl.md", mdLines.join("\n") + "\n");

  console.log(`Done. ${passCount}/${results.length} passed.`);
  console.log("Reports written to reports/website-crawl.csv and reports/website-crawl.md");
}

main();
