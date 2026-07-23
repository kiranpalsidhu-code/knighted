import { writeFileSync, mkdirSync } from "fs";

const DOMAIN = process.env.CRAWL_MOBILE_DOMAIN ?? process.env.REPLIT_EXPO_DEV_DOMAIN;
if (!DOMAIN) {
  console.error("CRAWL_MOBILE_DOMAIN is not set");
  process.exit(1);
}

const BASE_URL = `https://${DOMAIN}`;

interface RouteCheck {
  route: string;
  description: string;
}

// expo-router file-based routes for the local-only job tracker app.
const ROUTES: RouteCheck[] = [
  { route: "/", description: "Dashboard tab (pipeline overview)" },
  { route: "/jobs", description: "Applications list tab" },
  { route: "/job/new", description: "Add job application modal" },
  { route: "/does-not-exist", description: "Fallback / not-found screen" },
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

async function checkRoute(route: string, description: string): Promise<CrawlResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
    const body = await res.text();
    const responseTimeMs = Date.now() - start;
    // Expo web bundler serves the same SPA shell (200) for every client route,
    // including the not-found fallback (handled client-side by expo-router).
    const ok = res.status === 200;
    return {
      route,
      description,
      status: res.status,
      ok,
      responseTimeMs,
      contentLength: body.length,
      note: ok ? "OK" : "Unexpected status (expected 200)",
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
  console.log(`Crawling mobile app at ${BASE_URL} ...`);
  const results: CrawlResult[] = [];

  for (const r of ROUTES) {
    results.push(await checkRoute(r.route, r.description));
  }

  mkdirSync("reports", { recursive: true });

  const csvHeader = "route,description,status,ok,responseTimeMs,contentLength,note";
  const csvRows = results.map((r) =>
    [r.route, JSON.stringify(r.description), r.status, r.ok, r.responseTimeMs, r.contentLength, JSON.stringify(r.note)].join(",")
  );
  writeFileSync("reports/mobile-crawl.csv", [csvHeader, ...csvRows].join("\n") + "\n");

  const passCount = results.filter((r) => r.ok).length;
  const failCount = results.length - passCount;
  const mdLines = [
    "# Mobile App Crawl Report",
    "",
    `Base URL: ${BASE_URL}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    `**${passCount} passed, ${failCount} failed** out of ${results.length} routes checked.`,
    "",
    "> Note: ResumeReady Mobile is a local-only Expo app (no backend calls, AsyncStorage persistence). This is an HTTP-level crawl of the Expo web preview bundler - it confirms each route's shell loads but does not execute app JS, so it will not catch runtime errors inside screens. Pair with the browser-based test suite for full behavioral coverage.",
    "",
    "| Route | Description | Status | Result | Time (ms) | Size (bytes) | Note |",
    "|---|---|---|---|---|---|---|",
    ...results.map(
      (r) =>
        `| \`${r.route}\` | ${r.description} | ${r.status} | ${r.ok ? "✅ Pass" : "❌ Fail"} | ${r.responseTimeMs} | ${r.contentLength} | ${r.note} |`
    ),
  ];
  writeFileSync("reports/mobile-crawl.md", mdLines.join("\n") + "\n");

  console.log(`Done. ${passCount}/${results.length} passed.`);
  console.log("Reports written to reports/mobile-crawl.csv and reports/mobile-crawl.md");
}

main();
