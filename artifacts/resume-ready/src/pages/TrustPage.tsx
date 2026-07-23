import React from "react";
import { Link } from "wouter";
import { PublicNav } from "@/components/layout/PublicNav";
import { useSEO } from "@/hooks/use-seo";
import { Shield, Lock, Server, Users, Eye, RefreshCw, AlertTriangle, Mail } from "lucide-react";

interface TrustCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function TrustCard({ icon: Icon, title, children }: TrustCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
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

export default function TrustPage() {
  useSEO({
    title: "Security & Trust",
    description: "How Knighted Resume protects your data — infrastructure, encryption, access controls, and our honest SOC 2 position.",
    canonical: "/trust",
    noIndex: false,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Security &amp; Trust</h1>
          <p className="text-muted-foreground mb-10">
            We handle sensitive career data — resumes, job applications, and personal
            information. Here is an honest account of how we protect it.
          </p>

          <TrustCard icon={Server} title="Data hosting">
            <p>
              Application and database infrastructure is hosted on enterprise cloud infrastructure
              with <strong className="text-foreground">encryption at rest</strong> (AES-256).
            </p>
            <p>
              <strong className="text-foreground">Institutional clients:</strong> Canadian-region
              hosting is available for universities and institutions with data-residency requirements
              under FOIP or provincial privacy law. Contact us before signing any data agreement
              to discuss your institution's specific requirements.
            </p>
          </TrustCard>

          <TrustCard icon={Lock} title="Encryption">
            <p>
              All traffic between your browser and our servers is encrypted via{" "}
              <strong className="text-foreground">HTTPS/TLS 1.2+</strong>.
              Sensitive fields are encrypted at rest. Payment card data is never stored by us —
              all payment processing is handled by Stripe (PCI DSS Level 1).
            </p>
          </TrustCard>

          <TrustCard icon={Users} title="Authentication & access control">
            <p>
              User authentication is provided by{" "}
              <strong className="text-foreground">Clerk</strong> (SOC 2 Type II certified).
              Staff access to production systems requires MFA and follows least-privilege principles.
              Access is reviewed regularly and revoked promptly on offboarding.
            </p>
          </TrustCard>

          <TrustCard icon={Eye} title="Monitoring & incident response">
            <p>
              Application errors, availability, and unusual access patterns are monitored with
              alerting. Logs are retained to support incident investigation. We have a documented
              incident response process and will notify affected users in the event of a confirmed
              data breach in accordance with applicable law.
            </p>
          </TrustCard>

          <TrustCard icon={RefreshCw} title="Backups & recovery">
            <p>
              The database is backed up on a regular automated schedule. Backups are tested
              periodically to confirm recoverability. We maintain a recovery time objective
              appropriate for the service tier.
            </p>
          </TrustCard>

          <TrustCard icon={Shield} title="Vulnerability management">
            <p>
              Automated dependency vulnerability scanning runs on every build. Security patches
              are applied promptly, with critical patches deployed outside the normal release
              cycle where necessary. A penetration test is planned annually.
            </p>
          </TrustCard>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-10">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold mb-2">SOC 2 status</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Knighted Resume does not currently hold SOC 2 certification.</strong>{" "}
                  The baseline controls above are in place and SOC 2 Type II is on our roadmap as
                  we scale towards institutional deployments. For a free pilot with a faculty cohort,
                  our current posture is typically sufficient; we can answer your institution's
                  security questionnaire in full. Contact us if you need our questionnaire response pack.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Sub-processors</h2>
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
                    { service: "Anthropic (via AWS Bedrock)", purpose: "AI resume tailoring & KI features", certs: "SOC 2 Type II" },
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

          <div className="bg-card border border-border rounded-xl p-6 mb-10">
            <h2 className="text-xl font-semibold mb-3">Security enquiries</h2>
            <p className="text-sm text-muted-foreground mb-4">
              For security questionnaires, penetration test reports, data processing agreements,
              or to report a vulnerability, contact our security team. We aim to respond to
              security reports within 2 business days.
            </p>
            <a href="mailto:security@theknightedresume.com"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2">
              <Mail className="h-4 w-4" />
              security@theknightedresume.com
            </a>
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-6">
            Last updated July 2026. This page will be kept current as our security posture evolves.
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
