import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Star, Building, Users, BarChart3, MessageSquare, ArrowRight } from "lucide-react";

const PLANS = [
  {
    name: "Standard",
    price: 149,
    unit: "per listing",
    description: "One job posting with solid visibility",
    highlight: false,
    badge: null,
    features: [
      "30-day active listing",
      "Appears in search results",
      "Applicant management dashboard",
      "One-click applicant inbox",
      "Company profile page",
      "Email notifications on apply",
    ],
    cta: "Post a Job",
    ctaHref: "/post-a-job",
  },
  {
    name: "Featured",
    price: 299,
    unit: "per listing",
    description: "Maximum visibility, top-of-results placement",
    highlight: true,
    badge: "Most Popular",
    features: [
      "60-day active listing",
      "Pinned to top of search results",
      "\"Featured\" badge on listing",
      "KI Match Score priority boost",
      "Applicant management dashboard",
      "One-click applicant inbox",
      "Company profile page",
      "Priority email support",
    ],
    cta: "Post Featured Job",
    ctaHref: "/post-a-job?featured=1",
  },
  {
    name: "Enterprise",
    price: null,
    unit: "custom",
    description: "For teams hiring at scale across multiple roles",
    highlight: false,
    badge: null,
    features: [
      "Unlimited active listings",
      "Dedicated account manager",
      "Bulk job import (CSV / ATS API)",
      "Volume discounts on all postings",
      "Custom KI Match Score criteria",
      "Branded employer page",
      "Analytics & funnel reporting",
      "SLA-backed support",
    ],
    cta: "Contact Us",
    ctaHref: "mailto:employers@theknightedjobs.com",
    isExternal: true,
  },
];

const TRUST = [
  { icon: Building, label: "Direct listings only", body: "No scraped jobs. Every role is posted by a real employer." },
  { icon: Users, label: "Targeted audience", body: "Ambitious professionals in finance, consulting, engineering, legal, and more." },
  { icon: BarChart3, label: "KI Match Score", body: "Every candidate sees how well they match your role — better applicant quality." },
  { icon: MessageSquare, label: "Built-in inbox", body: "Manage applications directly from your employer dashboard, no ATS required." },
];

export function EmployerPricingPage() {
  useSEO({
    title: "Employer Pricing — Post a Job on Knighted Jobs",
    description: "Simple, transparent pricing for employers. Post a direct job listing on Knighted Jobs and reach ambitious professionals with real salary transparency.",
    canonical: "/pricing",
  });
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28 border-b border-border/50">
          <div className="container max-w-3xl text-center">
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              For Employers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-5">
              Hire ambitious professionals.<br />
              <span className="text-primary">No noise, no nonsense.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              KnightedJobs connects you directly with high-calibre candidates in finance, consulting, engineering, and legal — without the recruiter markup.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-base h-12 px-8">
                <Link href="/post-a-job">Post a Job Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-12">
                <Link href="/employer/dashboard">Employer Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-20 px-4">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold mb-3">Simple, transparent pricing</h2>
              <p className="text-muted-foreground">Pay per listing — no subscriptions, no surprise fees.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={[
                    "relative rounded-2xl p-7 flex flex-col",
                    plan.highlight
                      ? "border-2 border-primary bg-background shadow-lg"
                      : "border border-border bg-card",
                  ].join(" ")}
                >
                  {plan.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {plan.highlight && <Star className="h-4 w-4 text-primary fill-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold">${plan.price}</span>
                        <span className="text-muted-foreground text-sm font-medium">{plan.unit}</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold">Custom</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.isExternal ? (
                    <a href={plan.ctaHref} className="mt-auto">
                      <Button
                        variant={plan.highlight ? "default" : "outline"}
                        className="w-full h-11"
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  ) : (
                    <Link href={plan.ctaHref} className="mt-auto">
                      <Button
                        variant={plan.highlight ? "default" : "outline"}
                        className="w-full h-11"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              All listings include full applicant management. Need volume pricing?{" "}
              <a href="mailto:employers@theknightedjobs.com" className="text-primary underline underline-offset-2 font-medium">
                Get in touch →
              </a>
            </p>
          </div>
        </section>

        {/* Why KnightedJobs for employers */}
        <section className="py-16 bg-card/40 border-t border-border/50 px-4">
          <div className="container max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-serif font-bold mb-2">Why employers choose KnightedJobs</h2>
              <p className="text-muted-foreground text-sm">Built for quality over quantity.</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.label} className="text-center">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-semibold text-sm mb-1">{t.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 border-t border-border/50">
          <div className="container max-w-2xl text-center">
            <Zap className="h-10 w-10 text-primary mx-auto mb-5" />
            <h2 className="text-3xl font-serif font-bold mb-4">Ready to find your next hire?</h2>
            <p className="text-muted-foreground mb-8">
              Post your first job in under 5 minutes. No account required to get started.
            </p>
            <Button asChild size="lg" className="text-base h-12 px-10">
              <Link href="/post-a-job">Post a Job <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
