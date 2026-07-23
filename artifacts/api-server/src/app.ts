import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { RR_SITEMAP_XML, KJ_ROBOTS_TXT, RR_ROBOTS_TXT } from "./lib/seoContent";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));

// www → apex redirect
app.use((req, res, next) => {
  const host = req.hostname;
  if (host === "www.theknightedjobs.com") {
    return res.redirect(301, `https://theknightedjobs.com${req.url}`);
  }
  if (host === "www.theknightedresume.com") {
    return res.redirect(301, `https://theknightedresume.com${req.url}`);
  }
  next();
});

// Content-Security-Policy for the served web apps (allows Clerk, Stripe, fonts).
// API responses (JSON) get a strict, locked-down policy instead.
const SPA_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://js.clerk.dev https://cdn.clerk.io https://*.clerk.accounts.dev https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com https://challenges.cloudflare.com; form-action 'self'; base-uri 'self';";
const API_CSP = "default-src 'none'; frame-ancestors 'none';";

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader(
    "Content-Security-Policy",
    req.path.startsWith("/api") ? API_CSP : SPA_CSP,
  );
  next();
});

app.use("/api/resume-ready/billing/webhook", express.raw({ type: "application/json" }));
app.use("/api/knighted-jobs/stripe-webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Host-aware sitemap and robots — must appear before the /api router so the proxy
// can route /sitemap.xml and /robots.txt here instead of the static serves.
app.get("/sitemap.xml", (_req, res) => {
  const host = _req.hostname;
  if (host === "theknightedjobs.com") {
    return res.redirect(301, "/knighted-jobs/sitemap.xml");
  }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(RR_SITEMAP_XML);
});

app.get("/robots.txt", (_req, res) => {
  const host = _req.hostname;
  const content = host === "theknightedjobs.com" ? KJ_ROBOTS_TXT : RR_ROBOTS_TXT;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(content);
});

app.use("/api", router);

// ---------------------------------------------------------------------------
// Static hosting for the two web apps, so a single Node service can serve
// everything (both sites + the API). Enabled only when the built SPA output
// exists — in local dev the Vite dev servers serve the apps instead, and this
// block is skipped so the API can run standalone.
//
// Layout served:
//   /knighted-jobs/*  -> Knighted Jobs SPA (with per-route prerendered HTML)
//   /*                -> Knighted Resume SPA (with per-route prerendered HTML)
// Paths are overridable via RESUME_READY_DIST / KNIGHTED_JOBS_DIST.
// ---------------------------------------------------------------------------
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const RR_DIST =
  process.env.RESUME_READY_DIST ??
  path.resolve(serverDir, "../../resume-ready/dist/public");
const KJ_DIST =
  process.env.KNIGHTED_JOBS_DIST ??
  path.resolve(serverDir, "../../knighted-jobs/dist/public");

// Serve a prerendered <dist>/<sub>/index.html when one exists (correct per-route
// SEO meta, clean 200 — no trailing-slash redirect), otherwise the SPA shell.
function sendAppHtml(dist: string, sub: string, res: express.Response): void {
  const clean = sub.replace(/^\/+/, "").replace(/\/+$/, "");
  const candidate = path.join(dist, clean, "index.html");
  const shell = path.join(dist, "index.html");
  res.sendFile(clean && fs.existsSync(candidate) ? candidate : shell);
}

const kjIndex = path.join(KJ_DIST, "index.html");
if (fs.existsSync(kjIndex)) {
  // Real files (assets, prerendered html) first; no auto-index, no redirect.
  app.use(
    "/knighted-jobs",
    express.static(KJ_DIST, { index: false, redirect: false }),
  );
  app.get(/^\/knighted-jobs(\/.*)?$/, (req, res) =>
    sendAppHtml(KJ_DIST, req.path.replace(/^\/knighted-jobs/, ""), res),
  );
  logger.info({ dir: KJ_DIST }, "Serving Knighted Jobs static app at /knighted-jobs");
}

const rrIndex = path.join(RR_DIST, "index.html");
if (fs.existsSync(rrIndex)) {
  app.use(express.static(RR_DIST, { index: false, redirect: false }));
  // All remaining (non-/api, non-/knighted-jobs) routes.
  app.get(/^\/(?!api\/|knighted-jobs(\/|$)).*/, (req, res) =>
    sendAppHtml(RR_DIST, req.path, res),
  );
  logger.info({ dir: RR_DIST }, "Serving Knighted Resume static app at /");
}

export default app;
