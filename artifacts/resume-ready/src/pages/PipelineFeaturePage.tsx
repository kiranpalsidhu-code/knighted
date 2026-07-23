import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/PublicNav";
import { Briefcase, BarChart3, Bell, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { SignInButton } from "@clerk/react";
import { useSEO } from "@/hooks/use-seo";

const STAGES = [
  { label: "Applied", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { label: "Screening", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { label: "Interview", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Offer", color: "bg-green-50 text-green-700 border-green-200" },
];

const FEATURES = [
  { icon: Briefcase, title: "Full pipeline view", body: "See every application at a glance — from first click to offer. No more spreadsheets." },
  { icon: BarChart3, title: "Track every stage", body: "Move applications through Applied → Screening → Interview → Offer with one click." },
  { icon: Bell, title: "Never miss a follow-up", body: "Add notes, deadlines, and reminders to each role so nothing slips through the cracks." },
  { icon: Calendar, title: "Interview calendar", body: "Log interview dates and notes in one place — tied directly to each application." },
];

export default function PipelineFeaturePage() {
  useSEO({
    title: "Job Application Tracker — Your Entire Pipeline in One View",
    description: "Track every job application from first click to offer. Move roles through Applied → Interview → Offer, add notes, and never miss a follow-up.",
    canonical: "/pipeline",
  });
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <section className="py-20 md:py-28 border-b border-border/50 px-4">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Briefcase className="h-3.5 w-3.5" /> Job Pipeline
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Track every application.<br />
              <span className="text-primary">Land the right offer.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Your personal job search pipeline. Manage every application from first contact to signed offer — all in one clean board.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignInButton mode="modal">
                <Button size="lg" className="text-base h-12 px-8">
                  Start Tracking Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignInButton>
              <Button asChild variant="outline" size="lg" className="text-base h-12">
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 border-b border-border/50">
          <div className="container max-w-2xl">
            <h2 className="text-xl font-bold text-center mb-8 text-muted-foreground">Your pipeline stages</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {STAGES.map((s) => (
                <div key={s.label} className={`px-5 py-2.5 rounded-full border text-sm font-semibold ${s.color}`}>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container max-w-4xl">
            <div className="grid sm:grid-cols-2 gap-6">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="bg-card border border-border rounded-xl p-7">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary/5 border-t border-border/50 px-4">
          <div className="container max-w-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Your job search, organised.</h2>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto mb-8">
              {["Free on all plans", "Unlimited applications to track", "Notes and reminders per role", "Works on mobile too"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <SignInButton mode="modal">
              <Button size="lg" className="text-base h-12 px-8">
                Start Tracking Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignInButton>
          </div>
        </section>
      </main>
    </div>
  );
}
