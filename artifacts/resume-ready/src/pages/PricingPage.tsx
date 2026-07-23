import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, ArrowRight, Lock, ShieldCheck, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/react";
import { PublicNav } from "@/components/layout/PublicNav";

type Plan = "monthly" | "3month" | "6month";

const MONTHLY_PRICE = 14;
const PLANS: Record<Plan, { label: string; months: number; discountPct: number; cta: string }> = {
  monthly: { label: "Monthly", months: 1, discountPct: 0, cta: "Upgrade to Pro" },
  "3month": { label: "3 Months", months: 3, discountPct: 7.5, cta: "Get the 3-Month Plan" },
  "6month": { label: "6 Months", months: 6, discountPct: 15, cta: "Get the 6-Month Plan" },
};

function planPricing(plan: Plan) {
  const { months, discountPct } = PLANS[plan];
  const total = Math.round(MONTHLY_PRICE * months * (1 - discountPct / 100) * 100) / 100;
  const perMonth = Math.round((total / months) * 100) / 100;
  return { total, perMonth };
}

const FAQ_ITEMS = [
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. Monthly Pro plans can be cancelled at any time — you'll keep access until the end of your billing period. 3- and 6-month plans are one-time payments, not recurring subscriptions.",
  },
  {
    q: "What happens when I hit the free resume limit?",
    a: "The Starter plan includes up to 3 resumes. When you reach the limit, you'll be prompted to upgrade to Pro for unlimited resumes. Your existing resumes are never deleted.",
  },
  {
    q: "Is my resume data private?",
    a: "Yes. Your resume content is encrypted at rest and never shared with third parties. We do not sell your data. See our Privacy Policy for full details.",
  },
  {
    q: "Does the AI use my resume to train its models?",
    a: "No. Knighted Resume uses Anthropic's Claude models via AWS Bedrock, which does not use your content for model training.",
  },
  {
    q: "Do you offer refunds?",
    a: "Monthly plans can be cancelled anytime with no additional charge. For 3- or 6-month plans, contact us at support@theknightedresume.com within 7 days of purchase and we'll sort it out.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All transactions are secured by Stripe's PCI-compliant infrastructure.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function FaqList() {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-background px-6">
      {FAQ_ITEMS.map((item) => (
        <FaqItem key={item.q} q={item.q} a={item.a} />
      ))}
    </div>
  );
}

export default function PricingPage() {
  useSEO({
    title: "Pricing — Free & Pro Plans",
    description: "Get started free with Knighted Resume. Upgrade to Pro for unlimited AI tailoring, ATS scoring, cover letters, and full pipeline tracking.",
    canonical: "/pricing",
  });
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan>("monthly");
  const [isPending, setIsPending] = useState(false);

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      setLocation("/sign-up");
      return;
    }
    setIsPending(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "No checkout URL");
      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Failed to start checkout",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const { total, perMonth } = planPricing(plan);
  const { discountPct } = PLANS[plan];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground mb-10">Start for free, upgrade when you need more power.</p>

          {/* Plan length toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-muted/40">
            {(Object.keys(PLANS) as Plan[]).map((key) => (
              <button
                key={key}
                onClick={() => setPlan(key)}
                className={[
                  "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                  plan === key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {PLANS[key].label}
                {PLANS[key].discountPct > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    -{PLANS[key].discountPct}%
                  </span>
                )}
              </button>
            ))}
          </div>

          {discountPct > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-3">
              You save ${(MONTHLY_PRICE * PLANS[plan].months - total).toFixed(2)} with the {PLANS[plan].label.toLowerCase()} plan
            </p>
          )}
        </div>

        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-8 items-start">
          {/* Starter Plan */}
          <div className="bg-background rounded-3xl p-8 border border-border shadow-sm flex flex-col">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-muted-foreground">Perfect for casual job seekers</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-extrabold tracking-tight">$0</span>
                <span className="text-muted-foreground ml-2 font-medium">/forever</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Up to 3 resumes</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Job tracker (Applied → Offer)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Cover letters (up to 3)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>KI job search (5 searches/month)</span>
              </li>
              <li className="flex items-start text-muted-foreground">
                <div className="w-5 h-5 mr-3 shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="w-3.5 h-px bg-muted-foreground/40 rounded" />
                </div>
                <span>KI resume tailoring & feedback</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Community support</span>
              </li>
            </ul>

            {isSignedIn ? (
              <Link href="/dashboard" className="mt-auto">
                <Button variant="outline" className="w-full h-12 text-base" data-testid="button-starter-plan">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up" className="mt-auto">
                <Button variant="outline" className="w-full h-12 text-base" data-testid="button-starter-plan">
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-background rounded-3xl p-8 border-2 border-primary shadow-lg relative flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase">
              Most Popular
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-muted-foreground">KI tailors every resume & cover letter to the specific job — in 60 seconds</p>
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight">${perMonth}</span>
                  <span className="text-muted-foreground font-medium">/month</span>
                  {discountPct > 0 && (
                    <span className="text-sm text-muted-foreground line-through">${MONTHLY_PRICE}</span>
                  )}
                </div>
                {plan === "monthly" ? (
                  <p className="text-sm text-muted-foreground mt-1">Billed monthly, cancel anytime</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Billed <span className="font-semibold text-foreground">${total} once</span> for {PLANS[plan].months} months
                  </p>
                )}
              </div>

              {plan === "6month" && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Job Guarantee:</span> if you haven't landed a job within 6 months, we'll give you 3 more months free.
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="font-medium">Unlimited resumes</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="font-medium">Unlimited cover letters</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="font-medium">KI tailoring to specific jobs</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="font-medium">Detailed KI feedback & scoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Unlimited KI job searches</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Advanced pipeline features</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                <span>Priority email support</span>
              </li>
              {plan === "6month" && (
                <li className="flex items-start">
                  <ShieldCheck className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                  <span className="font-medium">Job Guarantee — 3 months free if you don't land a job</span>
                </li>
              )}
            </ul>

            <Button
              className="w-full h-12 text-base mt-auto"
              onClick={handleUpgrade}
              disabled={isPending}
              data-testid="button-pro-plan"
            >
              {isPending ? "Starting checkout..." : (
                <>
                  {PLANS[plan].cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Team Plan */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl border-2 border-border bg-muted/30 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold">Team Plan</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">New</span>
                </div>
                <p className="text-muted-foreground mb-4">For career coaches, university career centres, and job-seeking cohorts — manage up to 50 seats from one admin dashboard.</p>
                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {[
                    "5–50 Pro seats, billed together",
                    "Admin dashboard & seat management",
                    "Bulk resume & cover letter exports",
                    "Branded portal (career centre use)",
                    "Cohort-level application analytics",
                    "Dedicated account manager",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-3 min-w-[160px]">
              <div className="text-center">
                <p className="text-3xl font-extrabold tracking-tight">Custom</p>
                <p className="text-sm text-muted-foreground">pricing per seat</p>
              </div>
              <a
                href="mailto:teams@theknightedresume.com?subject=Team%20Plan%20Enquiry"
                className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Users className="w-4 h-4" />
                Contact us
              </a>
              <p className="text-xs text-muted-foreground text-center">We reply within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/20 border-t border-border">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Frequently asked questions</h2>
          <FaqList />
        </div>
      </section>

      <footer className="border-t border-border py-6 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Secure checkout via Stripe. Monthly plans cancel anytime; 3- and 6-month plans are paid upfront.</span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
