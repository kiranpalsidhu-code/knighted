// Reconstructed placeholder for the SEO build plugins.
//
// NOTE: The original `seo-plugin.ts` was NOT included in the code export. The
// Vite config imports two plugins from here — `ssrMetaPlugin` and
// `prerenderPlugin` — which previously handled per-route SEO (injecting
// route-specific <title>/meta and prerendering static HTML snapshots for
// crawlers). That logic could not be recovered from the export.
//
// These implementations are intentionally minimal so the app builds and runs.
// The static SEO tags in index.html and the runtime `useSEO` hook still work.
// Restore or reimplement the prerendering here before relying on crawler SEO
// for individual routes (blog posts, feature pages, job listings, etc.).

import type { Plugin } from "vite";

/**
 * Placeholder for the original SSR/meta injection plugin.
 * Currently a no-op passthrough; index.html already ships default meta tags.
 */
export function ssrMetaPlugin(): Plugin {
  return {
    name: "seo-ssr-meta-plugin",
    apply: undefined,
    // transformIndexHtml hook left as a passthrough — extend to inject
    // route-aware meta once the original logic is restored.
    transformIndexHtml(html) {
      return html;
    },
  };
}

/**
 * Placeholder for the original static prerender plugin.
 * Currently a no-op; add per-route prerendering here to restore crawler SEO.
 */
export function prerenderPlugin(): Plugin {
  return {
    name: "seo-prerender-plugin",
  };
}
