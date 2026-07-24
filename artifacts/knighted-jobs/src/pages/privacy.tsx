import { Navbar } from "@/components/layout/Navbar";
import { useSEO } from "@/hooks/use-seo";

export function PrivacyPage() {
  useSEO({
    title: "Privacy Policy — Knighted Jobs",
    description: "How Knighted Jobs collects, uses, and protects your personal data.",
    canonical: "/privacy",
    noIndex: true,
  });
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="container max-w-3xl prose prose-sm dark:prose-invert">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: July 21, 2026</p>

          <h2 className="text-xl font-semibold mt-8 mb-3">1. Information we collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly — such as your name, email address, job preferences, and profile data when you create an account. We also collect usage data including pages viewed, search queries, and interactions with job listings to improve the service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">2. How we use your information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use your information to provide the KnightedJobs service, send job alerts you've subscribed to, and improve our recommendations. We do not sell your personal data to third parties. Employer-submitted job listings may include data shared with applicants who choose to apply.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">3. Cookies and analytics</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies to maintain your session and remember preferences such as dark mode. We may use analytics tools to understand aggregate usage patterns. You can opt out of non-essential cookies through your browser settings.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">4. Data retention and deletion</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Account data is retained for as long as your account is active. If you delete your account, your profile data, saved jobs, alerts, and personal information are permanently deleted within 30 days. You may request deletion at any time by emailing{" "}
            <a href="mailto:privacy@theknightedjobs.com" className="text-primary underline underline-offset-2">privacy@theknightedjobs.com</a>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You may also request an export of your personal data by emailing the same address. We will respond within 30 days.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">5. Third-party sub-processors</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We use the following sub-processors to deliver the KnightedJobs service:
          </p>
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
                  <td className="py-2">US (Canadian auth migration planned)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Stripe</td>
                  <td className="py-2 pr-4">Payment processing</td>
                  <td className="py-2">US/EU</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Adzuna</td>
                  <td className="py-2 pr-4">Job listing aggregation</td>
                  <td className="py-2">UK/EU</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Anthropic (Claude)</td>
                  <td className="py-2 pr-4">AI resume tailoring (via Knighted Resume)</td>
                  <td className="py-2">US (Canadian AI endpoint planned)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Resend</td>
                  <td className="py-2 pr-4">Transactional email (job alerts, receipts)</td>
                  <td className="py-2">US</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-3">6. Canadian data residency</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-4">
            <p className="text-foreground font-medium mb-2">For institutional and university deployments</p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We are actively migrating to full Canadian data residency to support FOIP and provincial privacy law requirements. Our target architecture places all storage and compute in Canada:
            </p>
            <ul className="space-y-1 text-muted-foreground list-disc pl-6">
              <li><strong className="text-foreground">Database:</strong> PostgreSQL in AWS ca-central-1 (Montréal) or ca-west-1 (Calgary).</li>
              <li><strong className="text-foreground">Authentication:</strong> Self-hosted SuperTokens in a Canadian region, backed by the Canadian database.</li>
              <li><strong className="text-foreground">AI inference:</strong> Azure OpenAI Canada East or AWS Bedrock ca-central-1 with no-training, zero-retention agreements.</li>
              <li><strong className="text-foreground">Compute:</strong> API server deployed in a Canadian cloud region.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Contact us at <a href="mailto:privacy@theknightedjobs.com" className="text-primary underline underline-offset-2">privacy@theknightedjobs.com</a> before signing any institutional data agreement to confirm current residency status. We recommend confirming FOIP-specific obligations with a Canadian privacy lawyer before any institutional deployment.
            </p>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-3">7. Your rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, export, or delete your personal data. To exercise any of these rights, email{" "}
            <a href="mailto:privacy@theknightedjobs.com" className="text-primary underline underline-offset-2">privacy@theknightedjobs.com</a>. We will respond within 30 days.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">8. Changes to this policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">9. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions, contact us at{" "}
            <a href="mailto:privacy@theknightedjobs.com" className="text-primary underline underline-offset-2">
              privacy@theknightedjobs.com
            </a>.
          </p>
        </div>
      </main>
    </div>
  );
}
