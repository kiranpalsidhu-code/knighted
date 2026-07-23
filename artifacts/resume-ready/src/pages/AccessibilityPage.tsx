import React from "react";
import { Link } from "wouter";
import { PublicNav } from "@/components/layout/PublicNav";
import { useSEO } from "@/hooks/use-seo";
import { CheckCircle2, AlertCircle, Mail, ExternalLink } from "lucide-react";

export default function AccessibilityPage() {
  useSEO({
    title: "Accessibility",
    description: "Knighted Resume accessibility statement — our commitment to WCAG 2.1 AA conformance, known limitations, and how to report issues.",
    canonical: "/accessibility",
    noIndex: false,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Accessibility</h1>
          <p className="text-muted-foreground mb-10">Statement prepared July 2026</p>

          <section className="mb-10">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Partial conformance — WCAG 2.1 Level AA</p>
                <p className="text-sm text-muted-foreground">
                  Knighted Resume is <strong className="text-foreground">partially conformant</strong> with
                  WCAG 2.1 Level AA. Some content does not yet fully conform; we are actively
                  addressing the remaining gaps with a target of full automated conformance by
                  September 2026.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-5">What is working</h2>
            <ul className="space-y-3">
              {[
                "All pages use semantic landmark regions (header, main, footer, nav).",
                "Interactive elements have accessible names and roles throughout.",
                "Form inputs include visible labels or aria-label attributes.",
                "Keyboard navigation is supported throughout the application.",
                "Heading levels follow a logical hierarchy on all pages.",
                "Text can be resized up to 200% without loss of content or functionality.",
                "Images and icons include descriptive alt text or are marked decorative.",
                "Colour is never the sole means of conveying information.",
                "Focus management is implemented in modal dialogs and dynamic content.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Known limitations</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The following issues have been identified. We are working to resolve them.
            </p>
            <ul className="space-y-3">
              {[
                { issue: "Colour contrast", detail: "Some muted text on light backgrounds may not meet the 4.5:1 minimum ratio. A systematic colour audit is in progress." },
                { issue: "Third-party components", detail: "Authentication dialogs rendered by Clerk may contain elements outside our direct control. We monitor and raise issues upstream." },
                { issue: "Complex editor interactions", detail: "The resume editor uses contenteditable regions that may not be fully navigable by all screen readers. We are exploring accessible alternatives." },
              ].map(({ issue, detail }) => (
                <li key={issue} className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{issue}:</strong> {detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Planned improvements</h2>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Complete manual keyboard-only navigation audit (Q3 2026).</li>
              <li>Screen reader walkthrough using NVDA, JAWS, and VoiceOver.</li>
              <li>ARIA live regions for all dynamic content updates (tailoring results, score changes).</li>
              <li>VPAT 2.x conformance report against WCAG 2.1 AA — available on request, Q4 2026.</li>
              <li>Third-party accessibility audit for institutional procurement.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Technical approach</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Knighted Resume is built with React and Tailwind CSS. We use semantic HTML5 elements,
              WAI-ARIA attributes where HTML semantics are insufficient, and follow the ARIA Authoring
              Practices Guide for interactive components. Automated accessibility tests run against
              every deployment.
            </p>
          </section>

          <section className="mb-10 bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3">Institutional & procurement enquiries</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you are evaluating Knighted Resume for a university or institution, we can provide
              a VPAT, answer accessibility questionnaires, and discuss our roadmap. A third-party
              audit is planned for the university-wide release stage.
            </p>
            <a href="mailto:accessibility@theknightedresume.com"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2">
              <Mail className="h-4 w-4" />
              accessibility@theknightedresume.com
            </a>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Report an accessibility issue</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you encounter a barrier, please contact us. We aim to respond within{" "}
              <strong className="text-foreground">5 business days</strong> and to resolve confirmed
              issues within 30 days where technically feasible.
            </p>
            <p className="text-sm text-muted-foreground mb-2">When reporting, please include:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-6">
              <li>The page URL where the issue occurs.</li>
              <li>A description of the barrier and the assistive technology you are using.</li>
              <li>Your operating system and browser version if known.</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="mailto:accessibility@theknightedresume.com"
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
          </section>

          <p className="text-xs text-muted-foreground border-t border-border pt-6">
            This statement was prepared in July 2026 and will be reviewed no later than July 2027.
          </p>
        </div>
      </main>

      <footer className="py-8 border-t border-border bg-background text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Knighted Resume</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/accessibility" className="hover:text-foreground transition-colors">Accessibility</Link>
          <Link href="/trust" className="hover:text-foreground transition-colors">Trust</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
