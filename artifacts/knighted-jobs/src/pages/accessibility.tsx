import { Navbar } from "@/components/layout/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { CheckCircle2, AlertCircle, Mail, ExternalLink } from "lucide-react";

export function AccessibilityPage() {
  useSEO({
    title: "Accessibility",
    description: "KnightedJobs accessibility statement — our commitment to WCAG 2.1 AA conformance, known limitations, and how to report issues.",
    canonical: "/accessibility",
    noIndex: false,
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section aria-label="Accessibility statement header" className="border-b border-border/50 py-16 md:py-20 px-4 text-center">
          <div className="container max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Accessibility</h1>
            <p className="text-lg text-muted-foreground">
              We are committed to making KnightedJobs usable by everyone,
              including people who use assistive technologies.
            </p>
          </div>
        </section>

        <section aria-label="Conformance status" className="container max-w-3xl py-12 px-4">

          {/* Conformance badge */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-10 flex gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Partial conformance — WCAG 2.1 Level AA</p>
              <p className="text-sm text-muted-foreground">
                This site is <strong className="text-foreground">partially conformant</strong> with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
                Partial conformance means that some content does not yet fully conform to the standard.
                We are actively remediating the remaining gaps.
              </p>
            </div>
          </div>

          {/* What works */}
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-5">What is working</h2>
            <ul className="space-y-3">
              {[
                "Keyboard navigation is supported throughout the site.",
                "All pages use semantic landmark regions (header, main, footer, nav).",
                "Interactive elements have accessible names and roles.",
                "Form inputs include visible labels or aria-label attributes.",
                "Images and icons include descriptive alt text or are marked decorative.",
                "Heading levels follow a logical hierarchy on all pages.",
                "Text can be resized up to 200% without loss of content or functionality.",
                "Colour is not the only means of conveying information.",
                "Session cookies and preferences do not rely on colour alone.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Known limitations */}
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-5">Known limitations</h2>
            <p className="text-muted-foreground text-sm mb-4">
              The following issues have been identified and are being addressed. We aim to
              resolve all automated failures by September 2026.
            </p>
            <ul className="space-y-3">
              {[
                { issue: "Colour contrast", detail: "Some text elements using the brand amber colour on light backgrounds may not meet the 4.5:1 minimum ratio for normal text. We are updating the colour system in light mode." },
                { issue: "Third-party embeds", detail: "Some embedded components from authentication providers may contain elements we cannot directly control. We monitor these and raise issues upstream." },
                { issue: "Dynamic content announcements", detail: "Some search result updates may not be announced to screen readers. We are adding ARIA live regions to dynamic areas." },
              ].map(({ issue, detail }) => (
                <li key={issue} className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground"><strong className="text-foreground">{issue}:</strong> {detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Planned improvements */}
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-4">Planned improvements</h2>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Complete manual keyboard-only navigation audit (Q3 2026).</li>
              <li>Screen reader walkthrough using NVDA (Windows) and VoiceOver (macOS/iOS).</li>
              <li>Accessible error message implementation for all forms.</li>
              <li>VPAT 2.x conformance report against WCAG 2.1 AA (available on request, Q4 2026).</li>
              <li>Third-party accessibility audit for the university-ready release.</li>
            </ul>
          </div>

          {/* Technical approach */}
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-4">Technical approach</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              KnightedJobs is built with React and Tailwind CSS. We use semantic HTML5 elements,
              WAI-ARIA attributes where HTML semantics are insufficient, and follow the ARIA Authoring
              Practices Guide for complex components such as modals and dropdowns.
              Automated accessibility tests run against every deployment using established scanning tools.
            </p>
          </div>

          {/* Institutional & procurement */}
          <div className="mb-10 bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-serif font-bold mb-3">Institutional & procurement enquiries</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you are evaluating KnightedJobs for a university or institution, we can provide
              an up-to-date voluntary product accessibility template (VPAT), answer accessibility
              questionnaires, and discuss our remediation roadmap. A third-party audit is planned
              for the university-wide release stage.
            </p>
            <a href="mailto:accessibility@theknightedjobs.com" className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2">
              <Mail className="h-4 w-4" />
              accessibility@theknightedjobs.com
            </a>
          </div>

          {/* How to report */}
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-4">How to report an issue</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you encounter a barrier that prevents you from accessing content on KnightedJobs,
              please tell us. We aim to respond within <strong className="text-foreground">5 business days</strong> and
              to resolve confirmed accessibility issues within 30 days where technically feasible.
            </p>
            <p className="text-sm text-muted-foreground mb-4">When reporting, please include:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-6">
              <li>The page URL where the issue occurs.</li>
              <li>A description of the barrier and the assistive technology you are using.</li>
              <li>Your operating system and browser version if known.</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="mailto:accessibility@theknightedjobs.com"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Mail className="h-4 w-4" />
                Report an issue
              </a>
              <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors text-foreground">
                <ExternalLink className="h-4 w-4" />
                WCAG 2.1 reference
              </a>
            </div>
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-6">
            This statement was prepared in July 2026 and will be reviewed no later than July 2027.
          </p>
        </section>
      </main>
    </div>
  );
}
