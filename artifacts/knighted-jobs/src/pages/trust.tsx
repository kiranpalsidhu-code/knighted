import { Navbar } from "@/components/layout/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { Shield, Lock, Server, Users, Eye, RefreshCw, AlertTriangle, Mail } from "lucide-react";

interface TrustCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function TrustCard({ icon: Icon, title, children }: TrustCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </div>
  );
}

export function TrustPage() {
  useSEO({
    title: "Security & Trust",
    description: "How KnightedJobs protects your data — infrastructure, encryption, access controls, and our honest SOC 2 position.",
    canonical: "/trust",
    noIndex: false,
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section aria-label="Trust page header" className="border-b border-border/50 py-16 md:py-20 px-4 text-center">
          <div className="container max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Security &amp; Trust</h1>
            <p className="text-lg text-muted-foreground">
              We handle job seeker data and employer information with care.
              Here is an honest account of our security posture.
            </p>
          </div>
        </section>

        <section aria-label="Security controls" className="container max-w-4xl py-12 px-4">

          <div className="grid sm:grid-cols-2 gap-6 mb-12">

            <TrustCard icon={Server} title="Data hosting">
              <p>
                Application and database infrastructure is hosted on enterprise cloud infrastructure.
                Data is stored with <strong className="text-foreground">encryption at rest</strong> (AES-256).
              </p>
              <p>
                <strong className="text-foreground">Institutional clients:</strong> Canadian-region
                hosting is available for universities and institutions with data-residency
                requirements under FOIP or provincial privacy law. Contact us to discuss your
                institution's specific needs before signing any data agreement.
              </p>
            </TrustCard>

            <TrustCard icon={Lock} title="Encryption">
              <p>
                All traffic between your browser and our servers is encrypted via{" "}
                <strong className="text-foreground">HTTPS/TLS 1.2+</strong>.
                Sensitive fields in the database are encrypted at rest.
                We do not store payment card data — payments are handled entirely by Stripe.
              </p>
            </TrustCard>

            <TrustCard icon={Users} title="Authentication & access control">
              <p>
                User authentication is provided by{" "}
                <strong className="text-foreground">Clerk</strong>, which holds SOC 2 Type II
                certification. Staff access to production systems requires MFA and follows
                least-privilege principles. Access is reviewed and revoked promptly on offboarding.
              </p>
            </TrustCard>

            <TrustCard icon={Eye} title="Monitoring & logging">
              <p>
                Application errors, availability, and unusual access patterns are monitored
                with alerting in place. Logs are retained to support incident investigation.
                We have an incident response process and will notify affected users in the
                event of a confirmed data breach.
              </p>
            </TrustCard>

            <TrustCard icon={RefreshCw} title="Backups & recovery">
              <p>
                The database is backed up on a regular automated schedule.
                Backups are tested periodically to confirm recoverability.
                We maintain a recovery time objective (RTO) appropriate for the service tier.
              </p>
            </TrustCard>

            <TrustCard icon={Shield} title="Vulnerability management">
              <p>
                We run automated dependency vulnerability scanning on every build.
                Security patches are applied promptly, with critical patches deployed
                outside the normal release cycle where necessary.
                A penetration test is planned annually.
              </p>
            </TrustCard>

          </div>

          {/* SOC 2 honest statement */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-10">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold mb-2">SOC 2 status</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">KnightedJobs does not currently hold SOC 2 certification.</strong>{" "}
                  We have the baseline controls documented above in place, and SOC 2 Type II
                  is on our roadmap as we move towards institutional and enterprise sales.
                  For a free pilot with a faculty cohort, our current control posture is
                  typically sufficient; we can answer your institution's security questionnaire
                  honestly and in full. Contact us if you need our questionnaire response pack.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-processors */}
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-bold mb-4">Sub-processors</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The following third-party services process data on our behalf:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border">Service</th>
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border">Purpose</th>
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border">Certifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { service: "Clerk", purpose: "Authentication & user management", certs: "SOC 2 Type II" },
                    { service: "Stripe", purpose: "Payment processing", certs: "SOC 2 Type II, PCI DSS Level 1" },
                    { service: "Adzuna / JSearch", purpose: "Curated job listing data", certs: "—" },
                    { service: "Resend", purpose: "Transactional email", certs: "SOC 2 Type II" },
                  ].map(({ service, purpose, certs }) => (
                    <tr key={service} className="text-muted-foreground">
                      <td className="px-4 py-3 font-medium text-foreground">{service}</td>
                      <td className="px-4 py-3">{purpose}</td>
                      <td className="px-4 py-3">{certs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-serif font-bold mb-3">Security enquiries</h2>
            <p className="text-sm text-muted-foreground mb-4">
              For security questionnaires, penetration test reports, data processing agreements,
              or to report a vulnerability, contact our security team. We aim to respond to
              security reports within 2 business days.
            </p>
            <a href="mailto:security@theknightedjobs.com"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2">
              <Mail className="h-4 w-4" />
              security@theknightedjobs.com
            </a>
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-6 mt-10">
            Last updated July 2026. This page will be kept current as our security posture evolves.
          </p>
        </section>
      </main>
    </div>
  );
}
