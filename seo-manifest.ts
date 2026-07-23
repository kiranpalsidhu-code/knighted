// SEO route manifest for Knighted Jobs.
//
// Single source of truth for build-time prerendering (see seo-plugin.ts).
// Values mirror the per-page useSEO({...}) calls. Dynamic pages (individual
// job listings, company profiles, filtered searches) are not prerendered —
// they rely on runtime useSEO and are covered by noIndex where appropriate.

import { BLOG_POSTS } from "./src/data/blog-content";

export const SITE = {
  name: "KnightedJobs",
  url: "https://theknightedjobs.com",
  defaultImage: "https://theknightedjobs.com/knighted-jobs/opengraph.jpg",
} as const;

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogType?: "website" | "article";
  ogImage?: string;
  noIndex?: boolean;
}

export const STATIC_ROUTES: RouteMeta[] = [
  {
    path: "/",
    title: "Find Jobs — Direct Listings, Real Salaries",
    description:
      "Browse 500+ finance, consulting, legal, and engineering jobs with disclosed salaries. AI resume tailoring with Knight Intelligence. No ads, no recruiter spam.",
    canonical: "/",
  },
  {
    path: "/jobs",
    title: "Find Jobs",
    description:
      "Browse direct-listed jobs with real salaries. Direct applications, no recruiter spam. Powered by Knight Intelligence AI.",
    canonical: "/jobs",
  },
  {
    path: "/jobs/remote",
    title: "Remote Jobs — Work From Anywhere",
    description:
      "Browse 100+ remote jobs across Engineering, Finance, Product, Design and more. Direct listings, real salaries, no recruiter spam. Work from anywhere.",
    canonical: "/jobs/remote",
  },
  {
    path: "/salary",
    title: "Salary Explorer — Real Market Salaries for Ambitious Professionals",
    description:
      "Discover salary ranges for any role. Data from direct listings and live market sources. Search by job title and location to see median, 25th, and 75th percentile pay.",
    canonical: "/salary",
  },
  {
    path: "/post-a-job",
    title: "Post a Job — Reach Ambitious Professionals on Knighted Jobs",
    description:
      "List your role directly on Knighted Jobs. No recruiter middlemen. Reach finance, consulting, legal, and engineering candidates who apply through your careers page.",
    canonical: "/post-a-job",
  },
  {
    path: "/pricing",
    title: "Employer Pricing — Post a Job on Knighted Jobs",
    description:
      "Simple, transparent pricing for employers. Post a direct job listing on Knighted Jobs and reach ambitious professionals with real salary transparency.",
    canonical: "/pricing",
  },
  {
    path: "/blog",
    title: "Career Advice — Salary Negotiation, Job Search Tips & More",
    description:
      "Expert career advice for ambitious professionals. Salary negotiation strategies, job search tactics, resume tips, and career growth guides.",
    canonical: "/blog",
  },
  {
    path: "/contact",
    title: "Contact Us",
    description:
      "Get in touch with the KnightedJobs team. Questions about job listings, employer accounts, or our platform — we're here to help.",
    canonical: "/contact",
  },
  {
    path: "/trust",
    title: "Security & Trust",
    description:
      "How KnightedJobs protects your data — infrastructure, encryption, access controls, and our honest SOC 2 position.",
    canonical: "/trust",
  },
  {
    path: "/accessibility",
    title: "Accessibility",
    description:
      "KnightedJobs accessibility statement — our commitment to WCAG 2.1 AA conformance, known limitations, and how to report issues.",
    canonical: "/accessibility",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Knighted Jobs",
    description:
      "How Knighted Jobs collects, uses, and protects your personal data.",
    canonical: "/privacy",
    noIndex: true,
  },
  {
    path: "/terms",
    title: "Terms of Service — Knighted Jobs",
    description:
      "Terms and conditions governing your use of the Knighted Jobs platform.",
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

export function getPrerenderRoutes(): RouteMeta[] {
  return [...STATIC_ROUTES, ...getBlogRoutes()];
}

export function getIndexableRoutes(): RouteMeta[] {
  return getPrerenderRoutes().filter((r) => !r.noIndex);
}
