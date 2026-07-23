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

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");
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

export default app;
