import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/PublicNav";
import { Sparkles, Target, Clock, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import { SignInButton } from "@clerk/react";
import { useSEO } from "@/hooks/use-seo";

const STEPS = [
  { step: "1", title: "Paste the job description", body: "Copy any job posting URL or paste the raw description text." },
  { step: "2", title: "KI reads the requirements", body: "Our AI identifies the exact keywords, skills, and experience the hiring manager needs." },
  { step: "3", title: "Tailored in 60 seconds", body: "KI rewrites your bullets, adds missing keywords, and scores the new version against the JD." },
];

const BENEFITS = [
  { icon: Target, title: "Beat ATS filters", body: "Most resumes are rejected before a human ever reads them. KI makes sure yours isn't." },
  { icon: Clock, title: "60 seconds per application", body: "Stop spending hours rewriting the same resume for every role. KI handles it instantly." },
  { icon: TrendingUp, title: "Higher interview rate", body: "Tailored resumes get significantly more callbacks than generic ones." },
];

export default function AiTailorFeaturePage() {
  useSEO({
    title: "AI Resume Tailoring — Match Any Job Description in 60 Seconds",
    description: "Paste a job description and let KI rewrite your resume bullets, inject missing keywords, and score your match against ATS filters in under a minute.",
    canonical: "/ai-tailor",
  });
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <section className="py-20 md:py-28 border-b border-border/50 px-4">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" /> KI Resume Tailoring
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Tailored for every job.<br />
              <span className="text-primary">In under a minute.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Paste a job description, and Knight Intelligence rewrites your resume to match it — with the right keywords, the right structure, and a real ATS score.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="text-base h-12 px-8">
                Try KI Tailoring Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignInButton>
            <p className="text-xs text-muted-foreground mt-3">Pro feature — <Link href="/pricing" className="text-primary underline underline-offset-2">see pricing</Link></p>
          </div>
        </section>

        <section className="py-20 px-4 border-b border-border/50">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
            <div className="space-y-6">
              {STEPS.map((s) => (
                <div key={s.step} className="flex gap-5 items-start">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container max-w-4xl">
            <div className="grid sm:grid-cols-3 gap-6">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="bg-card border border-border rounded-xl p-7 text-center">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary/5 border-t border-border/50 px-4">
          <div className="container max-w-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to land more interviews?</h2>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto mb-8">
              {["Unlimited tailoring on Pro", "ATS score on every tailor", "Cover letter tailoring included", "Works with any job posting"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <SignInButton mode="modal">
              <Button size="lg" className="text-base h-12 px-8">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignInButton>
          </div>
        </section>
      </main>
    </div>
  );
}
