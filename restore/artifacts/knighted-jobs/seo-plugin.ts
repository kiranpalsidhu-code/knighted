// SEO build plugins for the web app.
//
// - ssrMetaPlugin(): guarantees the HTML template carries a default canonical
//   link + og:url (the base index.html omits canonical), so even non-prerendered
//   responses have a sensible default.
// - prerenderPlugin(): after the SPA build, emits a static index.html per public
//   route (from seo-manifest.ts) with correct <title>/description/robots/
//   canonical/OG/Twitter tags, plus sitemap.xml and robots.txt. The SPA still
//   hydrates and manages meta at runtime for client-side navigation.
//
// Deliberately dependency-free (no headless browser), so it runs in any build
// environment.

import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import {
  SITE,
  getPrerenderRoutes,
  getIndexableRoutes,
  type RouteMeta,
} from "./seo-manifest";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHead(meta: RouteMeta): string {
  const fullTitle = `${meta.title} | ${SITE.name}`;
  const desc = meta.description.slice(0, 160);
  const url = `${SITE.url}${meta.canonical}`;
  const image = meta.ogImage ?? SITE.defaultImage;
  const robots = meta.noIndex ? "noindex,nofollow" : "index,follow";
  const ogType = meta.ogType ?? "website";
  return [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join("\n    ");
}

// Strip the SEO-managed tags the template already ships so we can replace them.
const SEO_TAG_PATTERNS: RegExp[] = [
  /[ \t]*<title>[\s\S]*?<\/title>\n?/i,
  /[ \t]*<meta\s+name="description"[^>]*>\n?/gi,
  /[ \t]*<meta\s+name="robots"[^>]*>\n?/gi,
  /[ \t]*<meta\s+name="twitter:[^"]*"[^>]*>\n?/gi,
  /[ \t]*<meta\s+property="og:[^"]*"[^>]*>\n?/gi,
  /[ \t]*<link\s+rel="canonical"[^>]*>\n?/gi,
];

function applyMeta(template: string, meta: RouteMeta): string {
  let html = template;
  for (const re of SEO_TAG_PATTERNS) html = html.replace(re, "");
  return html.replace(/<\/head>/i, `  ${renderHead(meta)}\n  </head>`);
}

export function ssrMetaPlugin(): Plugin {
  return {
    name: "seo-ssr-meta",
    transformIndexHtml(html) {
      if (/rel="canonical"/i.test(html)) return html;
      const inject = [
        `<link rel="canonical" href="${SITE.url}/" />`,
        `<meta property="og:url" content="${SITE.url}/" />`,
      ].join("\n    ");
      return html.replace(/<\/head>/i, `  ${inject}\n  </head>`);
    },
  };
}

export function prerenderPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "seo-prerender",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const templatePath = path.join(outDir, "index.html");
      if (!fs.existsSync(templatePath)) return;
      const template = fs.readFileSync(templatePath, "utf8");

      const routes = getPrerenderRoutes();
      for (const route of routes) {
        const html = applyMeta(template, route);
        const rel =
          route.path === "/"
            ? "index.html"
            : path.join(route.path.replace(/^\//, ""), "index.html");
        const dest = path.join(outDir, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, html);
      }

      const indexable = getIndexableRoutes();
      const urls = indexable
        .map((r) => `  <url><loc>${SITE.url}${r.canonical}</loc></url>`)
        .join("\n");
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
      fs.writeFileSync(
        path.join(outDir, "robots.txt"),
        `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`,
      );

      config.logger.info(
        `\n[seo-prerender] wrote ${routes.length} route(s) + sitemap.xml + robots.txt`,
      );
    },
  };
}
