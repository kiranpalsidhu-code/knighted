import React from "react";
import { Link } from "wouter";
import { PublicNav } from "@/components/layout/PublicNav";
import { useSEO } from "@/hooks/use-seo";

export default function PrivacyPage() {
  useSEO({
    title: "Privacy Policy",
    description: "Read the Knighted Resume privacy policy to learn how we collect, use, and protect your personal information.",
    canonical: "/privacy",
    noIndex: true,
  });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-3xl prose prose-slate">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: July 5, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">1. What we collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you use Knighted Resume, we collect:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-6">
              <li><strong className="text-foreground">Account data</strong> — name, email address, and authentication details managed via Clerk.</li>
              <li><strong className="text-foreground">Resume content</strong> — the text you write or paste into the resume editor.</li>
              <li><strong className="text-foreground">Job descriptions</strong> — text you paste when using KI tailoring.</li>
              <li><strong className="text-foreground">Application pipeline data</strong> — company names, roles, and status entries you create.</li>
              <li><strong className="text-foreground">Cover letter content</strong> — text you write or generate.</li>
              <li><strong className="text-foreground">Usage data</strong> — pages visited, features used, error logs (no keystroke-level tracking).</li>
              <li><strong className="text-foreground">Billing data</strong> — payment processing is handled entirely by Stripe. We do not store card numbers.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">2. How we use your data</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-6">
              <li>To provide and improve the Knighted Resume service.</li>
              <li>To process resume tailoring and feedback requests via Knighted Intelligence (our AI career assistant).</li>
              <li>To send transactional emails (e.g. billing receipts, support replies). We do not send marketing email without your consent.</li>
              <li>To diagnose errors and improve reliability.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">3. AI data use (Knighted Intelligence)</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-4">
              <p className="text-foreground font-medium mb-2">When you use KI features (resume tailoring, feedback, cover letter generation):</p>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li><strong className="text-foreground">Before your resume reaches the AI:</strong> We automatically strip direct identifiers (email address, phone number, street address, LinkedIn/GitHub URLs) from the text. Only the body of your resume — experience, skills, education — is sent. Your identifiers are re-inserted locally after the AI responds.</li>
                <li>We do not use your resume content to train AI models. Our provider agreements include no-training and zero-retention terms.</li>
                <li>We do not sell your resume data to any third party.</li>
                <li><strong className="text-foreground">Canadian AI routing (in progress):</strong> We are migrating AI inference to Azure OpenAI Canada East or AWS Bedrock ca-central-1 so all AI processing remains in Canada.</li>
              </ul>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              You will be shown a consent notice before your first AI tailoring action each session. You can proceed or cancel at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">4. Data storage and security</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-6">
              <li>Data is stored in a PostgreSQL database with encryption at rest.</li>
              <li>Authentication is handled by Clerk (SOC 2 Type II certified). We are migrating to self-hosted Canadian auth (SuperTokens in a Canadian region).</li>
              <li>All traffic between your browser and our servers is encrypted via HTTPS/TLS.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">5. Canadian data residency</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <p className="text-foreground font-medium mb-2">For institutional and university deployments</p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We are actively migrating to full Canadian data residency to support FOIP and provincial privacy law requirements:
              </p>
              <ul className="space-y-1 text-muted-foreground list-disc pl-6">
                <li><strong className="text-foreground">Database:</strong> PostgreSQL in AWS ca-central-1 (Montréal) or ca-west-1 (Calgary).</li>
                <li><strong className="text-foreground">Authentication:</strong> Self-hosted SuperTokens in a Canadian region, backed by the Canadian database.</li>
                <li><strong className="text-foreground">AI inference:</strong> Azure OpenAI Canada East or AWS Bedrock ca-central-1 with no-training, zero-retention agreements.</li>
                <li><strong className="text-foreground">Compute:</strong> API server deployed in a Canadian cloud region.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                Contact us at <a href="mailto:privacy@theknightedresume.com" className="text-primary underline">privacy@theknightedresume.com</a> before signing any institutional data agreement. We recommend confirming FOIP-specific obligations with a Canadian privacy lawyer before any institutional deployment.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">6. Data retention and deletion</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Your account data is retained for as long as your account is active. If you delete your account, your resumes, cover letters, pipeline entries, and personal data are permanently deleted within 30 days.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To request deletion or an export of your data, contact us at{" "}
              <a href="mailto:privacy@theknightedresume.com" className="text-primary underline">privacy@theknightedresume.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">7. Third-party sub-processors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Processor</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Purpose</th>
                    <th className="text-left py-2 font-semibold text-foreground">Data region</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Clerk</td>
                    <td className="py-2 pr-4">Authentication &amp; user management</td>
                    <td className="py-2">US (Canadian migration planned)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">Payment processing</td>
                    <td className="py-2">US/EU</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Anthropic (Claude)</td>
                    <td className="py-2 pr-4">AI resume tailoring &amp; feedback</td>
                    <td className="py-2">US (Canadian endpoint planned)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Resend</td>
                    <td className="py-2 pr-4">Transactional email</td>
                    <td className="py-2">US</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">8. Your rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, correct, export, or delete your personal data. To exercise any of these rights, email us at{" "}
              <a href="mailto:privacy@theknightedresume.com" className="text-primary underline">privacy@theknightedresume.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">9. Changes to this policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about this policy? Email us at{" "}
              <a href="mailto:privacy@theknightedresume.com" className="text-primary underline">privacy@theknightedresume.com</a>.
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
