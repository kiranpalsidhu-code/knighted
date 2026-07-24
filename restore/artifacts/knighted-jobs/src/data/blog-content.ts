export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  bodyHtml: string;
  imageUrl?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-negotiate-salary-offer",
    title: "How to Negotiate a Job Offer (Without Losing It)",
    excerpt: "Most candidates accept the first offer. Here's why you should never do that — and exactly what to say when you push back.",
    category: "Salary & Negotiation",
    readTime: "6 min read",
    publishedAt: "2026-07-01",
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=500&fit=crop&auto=format",
    bodyHtml: `
<h2>The negotiation window is smaller than you think</h2>
<p>Once a company has decided to make you an offer, you have a narrow but powerful window to negotiate. Research consistently shows that over 80% of hiring managers expect a counter-offer — and most have budget headroom of 10–20% above the initial number they quote.</p>
<p>Yet surveys find that fewer than 40% of candidates negotiate at all. The reason? Fear of seeming greedy or losing the offer. Both fears are almost entirely unfounded once you understand how the process actually works.</p>

<h2>The rule: never accept on the spot</h2>
<p>When you receive a verbal or written offer, the correct response is always: "Thank you so much — I'm genuinely excited about this role. Can I have a few days to review the details?" No recruiter will rescind an offer because you asked for 48 hours. If they do, you've just learned something important about the company.</p>

<h2>Research your number before you respond</h2>
<p>Use tools like Knighted Jobs Salary Explorer to benchmark the role against real market data. Target the 60th–75th percentile for your experience level, not the median — you're negotiating, not accepting average.</p>
<p>Factors that should push your number up:</p>
<ul>
<li>You have a competing offer (the single strongest lever)</li>
<li>You have a specialised skill the team specifically needs</li>
<li>You're relocating or taking a significant cost-of-living change</li>
<li>The role has been open for a long time</li>
</ul>

<h2>What to actually say</h2>
<p>Keep it simple, positive, and specific. A framework that works:</p>
<blockquote>"I'm really excited about joining the team and I'm confident I can contribute from day one. Based on my research and the scope of the role, I was hoping we could land closer to [X]. Is there any flexibility there?"</blockquote>
<p>The key elements: express enthusiasm, cite a specific reason (research/scope), give a specific number, and end with an open question.</p>
<p>Don't apologise. Don't over-explain. Don't give a range — it anchors to the bottom.</p>

<h2>If they say no to the salary</h2>
<p>Salary isn't the only lever. Consider negotiating:</p>
<ul>
<li><strong>Sign-on bonus</strong> — often comes from a different budget and is easier to approve</li>
<li><strong>Equity</strong> — especially at startups where cash is constrained</li>
<li><strong>Remote/hybrid flexibility</strong> — has real monetary value</li>
<li><strong>Start date</strong> — an extra week of notice period = extra week of salary at your current job</li>
<li><strong>Professional development budget</strong> — courses, conferences, certifications</li>
</ul>

<h2>The timing of base salary reviews</h2>
<p>Always ask: "When does this role come up for its first performance review, and is that when base salary is typically reassessed?" Companies that do annual reviews in January will often give you a shorter time to the first review if you start in November — get it in writing.</p>

<h2>One last thing</h2>
<p>After every negotiation conversation, send a follow-up email summarising what was agreed. This creates a paper trail, prevents misunderstandings, and signals professionalism. It also locks in any verbal commitments before the formal offer letter arrives.</p>
`,
  },
  {
    slug: "red-flags-in-job-descriptions",
    title: "7 Red Flags in Job Descriptions You Should Never Ignore",
    excerpt: "Before you spend hours tailoring your resume, check the listing for these warning signs that a job isn't what it claims to be.",
    category: "Job Search",
    readTime: "5 min read",
    publishedAt: "2026-07-05",
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=500&fit=crop&auto=format",
    bodyHtml: `
<h2>Job descriptions are marketing documents</h2>
<p>Companies write job postings to attract candidates, not to give you an accurate preview of the role. Most experienced recruiters would admit that the gap between the posting and the actual job can be significant. Knowing what to look for helps you filter out the roles that will waste your time — or worse, leave you miserable six months in.</p>

<h2>Red flag #1: "Wear many hats"</h2>
<p>This phrase occasionally appears in genuinely exciting early-stage startups where broad scope is a feature. But more often, it's code for "we're understaffed and you'll be covering work that should be done by three people." Ask explicitly in the interview: "What does a typical week look like for the person in this role?"</p>

<h2>Red flag #2: "Fast-paced environment / startup mentality"</h2>
<p>These phrases have become so overused they've lost meaning. But when combined with other signals — no salary listed, vague role scope, very high expectations for experience level — they often signal a culture of chronic overwork normalised as "hustle."</p>

<h2>Red flag #3: Salary not disclosed</h2>
<p>By 2026, many jurisdictions require salary transparency in job postings, yet plenty of employers still omit it. When a company doesn't share the range, it's often because the pay is below market and they know it. Use Knighted Jobs' salary filter to focus on roles that respect your time.</p>

<h2>Red flag #4: "We're a family here"</h2>
<p>Healthy workplaces are professional, respectful, and supportive — not "family." The language of family at work is often used to justify expectations that wouldn't be acceptable in a normal professional context: unpaid extra hours, emotional guilt-tripping, and difficulty enforcing boundaries.</p>

<h2>Red flag #5: Requirements that don't match the seniority level</h2>
<p>If a "junior" role asks for 5+ years of experience, or an "IC" (individual contributor) role lists 15 responsibilities that would require a team to execute, the company either doesn't know what they want or is trying to hire above the grade they're willing to pay for. Both are problems.</p>

<h2>Red flag #6: The listing has been up for months</h2>
<p>A listing that's been sitting for 3+ months usually means one of three things: the internal candidate fell through and they're going through the motions, the hiring manager keeps rejecting candidates for unclear reasons, or the team has a culture problem that's filtering people out at the offer stage. Ask the recruiter how long the role has been open and why it hasn't been filled.</p>

<h2>Red flag #7: No mention of growth, learning, or career development</h2>
<p>The best job postings tell you not just what you'll do, but how you'll grow. A posting that's entirely focused on what you'll deliver — with nothing about mentorship, progression, learning budget, or team culture — may signal a company that will extract value without investing back in you.</p>

<h2>What to do when you spot red flags</h2>
<p>Red flags aren't always dealbreakers — context matters. But they should prompt specific questions in the interview. Use them as a checklist to investigate before you invest heavily in your application. Your time is worth protecting.</p>
`,
  },
  {
    slug: "ats-proof-resume-tips-2026",
    title: "ATS-Proof Your Resume in 2026: What Actually Works",
    excerpt: "Applicant Tracking Systems reject most resumes before a human reads them. Here's the current state of ATS and how to beat it.",
    category: "Resume Tips",
    readTime: "7 min read",
    publishedAt: "2026-07-10",
    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=500&fit=crop&auto=format",
    bodyHtml: `
<h2>ATS in 2026: smarter but still beatable</h2>
<p>Modern Applicant Tracking Systems have evolved significantly. The best ones now use semantic matching rather than exact keyword matching — they understand that "cross-functional collaboration" and "worked across departments" mean the same thing. But even the most sophisticated ATS still has hard constraints that trip up even experienced candidates.</p>

<h2>The two-filter model</h2>
<p>Think of the hiring pipeline as having two gates: the ATS gate (machine) and the recruiter gate (human). You need to get through both. The ATS filters on format, keywords, and structure. The recruiter filters on clarity, relevance, and narrative. Optimising for one at the expense of the other is a common mistake.</p>

<h2>Format rules that still matter in 2026</h2>
<ul>
<li><strong>Single column:</strong> Multi-column layouts still confuse many ATS parsers. Stick to one column for the content body.</li>
<li><strong>Standard section headings:</strong> Use "Work Experience," "Education," "Skills" — not "Where I've Made Impact" or other creative alternatives.</li>
<li><strong>No tables or text boxes:</strong> Content inside tables and text boxes is often skipped entirely by parsers.</li>
<li><strong>PDF vs .docx:</strong> Both work well with modern systems. PDFs are preferable unless the job posting specifically requests .docx.</li>
<li><strong>No headers/footers:</strong> Contact info in document headers is invisible to some ATS.</li>
</ul>

<h2>Keyword strategy that actually works</h2>
<p>The goal isn't to stuff keywords — it's to ensure your resume accurately reflects the language of the role. Here's a practical process:</p>
<ol>
<li>Copy the job description into a text editor and highlight every skill, tool, methodology, and qualification mentioned</li>
<li>Compare against your resume and identify genuine gaps where you have the experience but use different terminology</li>
<li>Rewrite affected bullet points to naturally incorporate the matching language</li>
<li>Don't add skills you don't have — you'll be filtered out in the technical screen anyway</li>
</ol>

<h2>The skills section problem</h2>
<p>A long list of skills at the bottom of your resume is low-signal for both ATS and humans. Instead, embed skills in context: "Led migration to Kubernetes on AWS, reducing infrastructure costs by 34%" tells both the machine and the human much more than "AWS" buried in a list.</p>

<h2>The KI Tailoring shortcut</h2>
<p>Knighted Resume's KI Tailoring feature analyses your resume against a specific job description, identifies keyword gaps, rewrites bullet points to match, and gives you an ATS compatibility score — all in under two minutes. For a competitive role, the difference between a 58% and 88% ATS score can determine whether a human ever reads your application.</p>

<h2>What to prioritise</h2>
<p>If you only change one thing: get your most recent role's bullet points to closely mirror the language in the job description. The ATS weights recent experience heavily, so this single change has the highest ROI of any resume tweak.</p>
`,
  },
  {
    slug: "remote-job-search-strategy",
    title: "The 2026 Remote Job Search Strategy That Actually Works",
    excerpt: "Remote job competition is global. Here's how to stand out when you're competing against candidates from every timezone.",
    category: "Job Search",
    readTime: "8 min read",
    publishedAt: "2026-07-14",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop&auto=format",
    bodyHtml: `
<h2>The post-remote-boom reality</h2>
<p>The remote-first era that began in 2020 has matured into something more nuanced. The companies that are genuinely remote-first have sorted themselves out; the ones that were remote out of necessity have largely returned to office or settled into structured hybrid. What this means for job seekers: the competition for truly remote roles is global, and the bar for demonstrating remote-readiness has risen significantly.</p>

<h2>What employers actually mean by "remote"</h2>
<p>There are three meaningfully different things a company might mean:</p>
<ul>
<li><strong>Async-first remote:</strong> Work can happen across timezones with minimal synchronous requirements. Usually found at companies with distributed engineering teams built from scratch around remote work.</li>
<li><strong>Remote-friendly:</strong> Remote is tolerated but the culture is built around co-located teams. Career progression and relationships naturally favour those in the office.</li>
<li><strong>Remote for now:</strong> The company is remote because of circumstances (early-stage, distributed founders) but expects convergence around a hub as they grow.</li>
</ul>
<p>Ask in the interview: "Where is the leadership team based, and how does the company make important decisions — synchronously or asynchronously?" The answer tells you everything.</p>

<h2>Standing out as a remote candidate</h2>
<p>Companies hiring remotely worry about: communication quality, self-direction, timezone overlap, and long-term retention. Your application needs to address all four.</p>

<h3>Written communication</h3>
<p>Your cover letter, take-home assignments, and even email correspondence are direct signals of how you'll communicate in a remote environment. Every piece of written communication is a work sample. Clarity and concision matter more than completeness.</p>

<h3>Demonstrating async discipline</h3>
<p>In your resume, highlight any experience with async workflows: documentation, project management tools, asynchronous decision-making, or managing distributed teams. These are explicit signals you've worked this way before.</p>

<h3>Timezone strategy</h3>
<p>If you're applying to a US-headquartered company from a significantly different timezone, address it proactively. "I've worked successfully with US-based teams for three years with a 6-hour offset — I start early and maintain core overlap hours of 1–5pm ET" is a much stronger position than leaving the interviewer to worry about it.</p>

<h2>Where to find genuinely remote roles</h2>
<p>Filter by "Remote Only" on Knighted Jobs — our freshness guarantee means you won't find remote listings that were quietly converted to office roles. Beyond that: company career pages for known remote-first companies (Automattic, GitLab, Basecamp), and communities like Remote OK and We Work Remotely for leads.</p>

<h2>The remote salary variable</h2>
<p>Some companies pay location-adjusted salaries; others pay to San Francisco or New York benchmarks regardless of where you live. Always ask during the recruiter screen — before you get to the offer stage — whether compensation is location-dependent. A 40% salary adjustment for living in a lower cost-of-living city can significantly affect the real value of an offer.</p>

<h2>Building async credibility before the interview</h2>
<p>If you have a GitHub, portfolio, published writing, or open-source contributions — lead with them. They are the most credible demonstration of self-directed, high-quality async work. A hiring manager at a remote company will weight a strong portfolio more heavily than at a comparable in-office role.</p>
`,
  },
];
