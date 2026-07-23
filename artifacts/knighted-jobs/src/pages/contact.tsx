import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { Mail, MessageSquare, Briefcase } from "lucide-react";

export function ContactPage() {
  useSEO({
    title: "Contact Us",
    description: "Get in touch with the KnightedJobs team. Questions about job listings, employer accounts, or our platform — we're here to help.",
    canonical: "/contact",
  });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section aria-label="Contact header" className="border-b border-border/50 py-16 md:py-20 px-4 text-center">
          <div className="container max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Get in touch</h1>
            <p className="text-lg text-muted-foreground">
              Questions about listings, your account, or the platform?
              We're here to help.
            </p>
          </div>
        </section>

        <section aria-label="Contact options" className="container max-w-4xl py-16 px-4">
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <div className="bg-card border border-border rounded-xl p-6">
              <Mail className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-lg font-semibold mb-2">General Enquiries</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Questions about job listings, saved jobs, or your seeker account.
              </p>
              <a
                href="mailto:hello@theknightedjobs.com"
                className="text-sm text-primary underline underline-offset-2 font-medium"
              >
                hello@theknightedjobs.com
              </a>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <Briefcase className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-lg font-semibold mb-2">Employer Support</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Post a job, manage your listing, or set up a company profile.
              </p>
              <a
                href="/employer/dashboard"
                className="text-sm text-primary underline underline-offset-2 font-medium"
              >
                Employer Dashboard →
              </a>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <MessageSquare className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-lg font-semibold mb-2">Job Alerts</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set up email alerts and get notified when matching roles are posted.
              </p>
              <a
                href="/alerts"
                className="text-sm text-primary underline underline-offset-2 font-medium"
              >
                Manage Alerts →
              </a>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold mb-3">Looking for a job?</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Browse direct listings with disclosed salaries across Finance, Consulting, Law, Engineering, and more.
            </p>
            <a
              href="/jobs"
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Jobs
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
