import React from "react";
import { Link } from "wouter";
import { PublicNav } from "@/components/layout/PublicNav";
import { useSEO } from "@/hooks/use-seo";

export default function TermsPage() {
  useSEO({
    title: "Terms of Service",
    description: "Read the Knighted Resume terms of service to understand your rights and responsibilities when using our platform.",
    canonical: "/terms",
    noIndex: true,
  });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-10">Last updated: July 5, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using Knighted Resume ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">2. Your account</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-6">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be 16 or older to use the Service.</li>
              <li>You may not share your account with others or use the Service to provide a competing service.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">3. Your content</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You retain ownership of any content you submit (resumes, cover letters, pipeline data). By submitting content, you grant us a limited licence to process it solely to provide the Service. We do not sell or share your content with third parties except as described in our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for ensuring your content does not infringe any third-party rights or violate any laws.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">4. Acceptable use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You must not use the Service to:</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-6">
              <li>Submit false, misleading, or fraudulent resume content.</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the Service.</li>
              <li>Violate any applicable law or regulation.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">5. Subscriptions and billing</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-6">
              <li><strong className="text-foreground">Starter plan</strong> — free forever with the features listed on our <Link href="/pricing" className="text-primary underline">Pricing page</Link>.</li>
              <li><strong className="text-foreground">Pro plan</strong> — billed monthly at the rate shown at checkout. Billing is handled by Stripe.</li>
              <li><strong className="text-foreground">Cancellation</strong> — you may cancel at any time from your account settings. Your Pro access continues until the end of the current billing period. No partial refunds are issued for unused days.</li>
              <li><strong className="text-foreground">Refunds</strong> — we offer refunds within 7 days of your first Pro charge if you are not satisfied. Contact us at <a href="mailto:support@theknightedresume.com" className="text-primary underline">support@theknightedresume.com</a>.</li>
              <li><strong className="text-foreground">Price changes</strong> — we will give at least 30 days' notice before changing Pro pricing.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">6. AI-generated content</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
              <p className="text-amber-900 leading-relaxed">
                Knighted Intelligence (KI) generates resume suggestions, cover letters, and job recommendations using AI. These outputs are provided as a starting point and may contain inaccuracies. You are solely responsible for reviewing, editing, and submitting any AI-generated content. Knighted Resume makes no guarantee that KI-generated content will result in job offers or interviews.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">7. Job search results</h2>
            <p className="text-muted-foreground leading-relaxed">
              Job listings displayed in the Job Search feature are sourced from third-party job boards. We do not control or guarantee the accuracy, availability, or legitimacy of any job listing. Always verify a listing directly with the employer before applying.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">8. Limitation of liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Knighted Resume is not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including unsuccessful job applications, AI-generated content errors, or service interruptions.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time; see our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> for data deletion details.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">10. Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms. Material changes will be communicated via email or in-app notice at least 14 days before taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about these Terms? Email us at{" "}
              <a href="mailto:support@theknightedresume.com" className="text-primary underline">support@theknightedresume.com</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 border-t border-border bg-background text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Knighted Resume</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
