import { Navbar } from "@/components/layout/Navbar";
import { useSEO } from "@/hooks/use-seo";

export function TermsPage() {
  useSEO({
    title: "Terms of Service — Knighted Jobs",
    description: "Terms and conditions governing your use of the Knighted Jobs platform.",
    canonical: "/terms",
    noIndex: true,
  });
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="container max-w-3xl prose prose-sm dark:prose-invert">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: July 2026</p>

          <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using KnightedJobs, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">2. Use of the service</h2>
          <p className="text-muted-foreground leading-relaxed">
            KnightedJobs is a job listing and discovery platform. You may use it to search for jobs, save listings, set job alerts, and apply to roles. You must not misuse the platform, submit fraudulent listings, or scrape content without permission.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">3. Employer responsibilities</h2>
          <p className="text-muted-foreground leading-relaxed">
            Employers who post listings represent that the roles are genuine, active, and compliant with applicable employment laws. KnightedJobs reserves the right to remove listings that violate these terms or contain false information.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">4. Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            Job posting fees are charged at the time of submission and are non-refundable once a listing becomes active. Payment is processed by Stripe. All prices are in USD unless stated otherwise.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">5. Intellectual property</h2>
          <p className="text-muted-foreground leading-relaxed">
            All content on KnightedJobs, including the design, logos, and software, is owned by or licensed to Knighted. Job listings remain the property of their respective employers.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">6. Disclaimer of warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            KnightedJobs is provided "as is". We make no guarantees about the accuracy of salary data, the quality of employers or candidates, or employment outcomes. Third-party listing data (such as Adzuna) is sourced externally and may not reflect current availability.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">7. Limitation of liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Knighted shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">8. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For terms-related questions, contact us at{" "}
            <a href="mailto:legal@theknightedjobs.com" className="text-primary underline underline-offset-2">
              legal@theknightedjobs.com
            </a>.
          </p>
        </div>
      </main>
    </div>
  );
}
