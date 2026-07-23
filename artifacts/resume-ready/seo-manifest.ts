// SEO route manifest for Knighted Resume.
//
// Single source of truth for build-time prerendering (see seo-plugin.ts).
// The values here mirror the per-page useSEO({...}) calls so crawlers get
// correct <title>/description/canonical/OG tags in static HTML, while the SPA
// still hydrates and manages meta at runtime for client navigation.

import { BLOG_POSTS } from "./src/data/blog-content";

export const SITE = {
  name: "Knighted Resume",
  url: "https://theknightedresume.com",
  defaultImage: "https://theknightedresume.com/opengraph.jpg",
} as const;

export interface RouteMeta {
  path: string; // route path, e.g. "/pricing"
  title: string; // page title without the " | <site>" suffix
  description: string;
  canonical: string; // canonical path, usually === path
  ogType?: "website" | "article";
  ogImage?: string;
  noIndex?: boolean;
}

// Public, prerenderable routes. Protected routes are excluded (they render an
// auth fallback for signed-out visitors; the three feature pages below are
// exactly those public fallbacks and are safe to prerender).
export const STATIC_ROUTES: RouteMeta[] = [
  {
    path: "/",
    title: "AI Resume Builder & Job Tracker for Ambitious Professionals",
    description:
      "Knighted Resume tailors your resume to any job in seconds, gives you instant ATS scores, and tracks your entire job search pipeline. Sign up free.",
    canonical: "/",
  },
  {
    path: "/pricing",
    title: "Pricing — Free & Pro Plans",
    description:
      "Get started free with Knighted Resume. Upgrade to Pro for unlimited AI tailoring, ATS scoring, cover letters, and full pipeline tracking.",
    canonical: "/pricing",
  },
  {
    path: "/resumes",
    title: "AI Resume Builder — Multiple Resumes, ATS Scores, One-Click PDF",
    description:
      "Create and manage multiple tailored resumes, get instant ATS scores, choose from professional templates, and export to PDF in one click.",
    canonical: "/resumes",
  },
  {
    path: "/ai-tailor",
    title: "AI Resume Tailoring — Match Any Job Description in 60 Seconds",
    description:
      "Paste a job description and let KI rewrite your resume bullets, inject missing keywords, and score your match against ATS filters in under a minute.",
    canonical: "/ai-tailor",
  },
  {
    path: "/pipeline",
    title: "Job Application Tracker — Your Entire Pipeline in One View",
    description:
      "Track every job application from first click to offer. Move roles through Applied → Interview → Offer, add notes, and never miss a follow-up.",
    canonical: "/pipeline",
  },
  {
    path: "/blog",
    title: "Career Advice & Resume Tips Blog",
    description:
      "Expert articles on resume writing, ATS optimisation, job searching, and interview prep from the Knighted Resume team.",
    canonical: "/blog",
  },
  {
    path: "/contact",
    title: "Contact Us",
    description:
      "Get in touch with the Knighted Resume team. We typically respond within one business day.",
    canonical: "/contact",
  },
  {
    path: "/trust",
    title: "Security & Trust",
    description:
      "How Knighted Resume protects your data — infrastructure, encryption, access controls, and our honest SOC 2 position.",
    canonical: "/trust",
  },
  {
    path: "/accessibility",
    title: "Accessibility",
    description:
      "Knighted Resume accessibility statement — our commitment to WCAG 2.1 AA conformance, known limitations, and how to report issues.",
    canonical: "/accessibility",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Read the Knighted Resume privacy policy to learn how we collect, use, and protect your personal information.",
    canonical: "/privacy",
    noIndex: true,
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description:
      "Read the Knighted Resume terms of service to understand your rights and responsibilities when using our platform.",
    canonical: "/terms",
    noIndex: true,
  },
];

export function getBlogRoutes(): RouteMeta[] {
  return BLOG_POSTS.map((post) => ({
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    canonical: `/blog/${post.slug}`,
    ogType: "article" as const,
  }));
}

/** Every route to emit static HTML for. */
export function getPrerenderRoutes(): RouteMeta[] {
  return [...STATIC_ROUTES, ...getBlogRoutes()];
}

/** Indexable routes only — used for sitemap.xml. */
export function getIndexableRoutes(): RouteMeta[] {
  return getPrerenderRoutes().filter((r) => !r.noIndex);
}
