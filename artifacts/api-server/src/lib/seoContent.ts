// Host-aware SEO content served by the API server for /sitemap.xml and /robots.txt.
// Both theknightedresume.com and theknightedjobs.com point at this single Replit
// deployment, so we serve the correct content per domain here rather than relying
// on the static builds (which don't have host-awareness).

const today = new Date().toISOString().slice(0, 10);

export const RR_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://theknightedresume.com/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://theknightedresume.com/pricing</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://theknightedresume.com/resumes</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://theknightedresume.com/ai-tailor</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://theknightedresume.com/pipeline</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://theknightedresume.com/templates</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://theknightedresume.com/blog</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://theknightedresume.com/blog/how-to-tailor-your-resume-for-ats</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/blog/how-to-write-cover-letter-with-ai</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/blog/job-application-tracker-that-works</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/blog/how-to-answer-tell-me-about-yourself</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/blog/how-to-negotiate-salary</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/blog/resume-mistakes-costing-interviews</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/blog/linkedin-profile-that-gets-recruiters</loc><lastmod>2026-07-01</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://theknightedresume.com/contact</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.5</priority></url>
  <url><loc>https://theknightedresume.com/privacy</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://theknightedresume.com/terms</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`;

export const KJ_ROBOTS_TXT = `User-agent: *
Allow: /

Disallow: /knighted-jobs/employer/dashboard
Disallow: /knighted-jobs/employer/inbox
Disallow: /knighted-jobs/employer/company
Disallow: /knighted-jobs/saved-jobs
Disallow: /knighted-jobs/my-applications
Disallow: /knighted-jobs/alerts
Disallow: /knighted-jobs/profile

Sitemap: https://theknightedjobs.com/knighted-jobs/sitemap.xml
`;

export const RR_ROBOTS_TXT = `User-agent: *
Allow: /

# theknightedresume.com — disallow authenticated app routes
Disallow: /dashboard
Disallow: /editor/
Disallow: /today
Disallow: /ask-ki
Disallow: /interview
Disallow: /feedback
Disallow: /referrals
Disallow: /contacts
Disallow: /settings
Disallow: /sign-in
Disallow: /sign-up

# theknightedjobs.com — disallow employer/user private routes
Disallow: /knighted-jobs/employer/dashboard
Disallow: /knighted-jobs/employer/inbox
Disallow: /knighted-jobs/employer/company
Disallow: /knighted-jobs/saved-jobs
Disallow: /knighted-jobs/my-applications
Disallow: /knighted-jobs/alerts
Disallow: /knighted-jobs/profile

Sitemap: https://theknightedresume.com/sitemap.xml
Sitemap: https://theknightedjobs.com/knighted-jobs/sitemap.xml
`;
