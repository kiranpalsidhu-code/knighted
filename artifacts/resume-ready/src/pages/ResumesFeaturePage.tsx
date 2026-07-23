import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/PublicNav";
import { FileText, Sparkles, Star, LayoutTemplate, Download, ArrowRight, CheckCircle2 } from "lucide-react";
import { SignInButton } from "@clerk/react";
import { useSEO } from "@/hooks/use-seo";

const FEATURES = [
  { icon: FileText, title: "Multiple resumes", body: "Keep separate resumes for every role type — all in one place, no more hunting through Google Docs." },
  { icon: Sparkles, title: "KI ATS Score", body: "Get an instant score and see exactly which keywords a job posting is looking for before you apply." },
  { icon: LayoutTemplate, title: "Professional templates", body: "Choose from clean, ATS-friendly templates designed to pass automated screening without sacrificing style." },
  { icon: Download, title: "Export in one click", body: "Download as a polished PDF ready to attach to any application." },
];

export default function ResumesFeaturePage() {
  useSEO({
    title: "AI Resume Builder — Multiple Resumes, ATS Scores, One-Click PDF",
    description: "Create and manage multiple tailored resumes, get instant ATS scores, choose from professional templates, and export to PDF in one click.",
    canonical: "/resumes",
  });
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <section className="py-20 md:py-28 border-b border-border/50 px-4">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <FileText className="h-3.5 w-3.5" /> Resume Builder
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Every resume you need,<br />
              <span className="text-primary">scored and ready to send.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Build, score, and tailor multiple resumes with AI — so every application puts your best foot forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignInButton mode="modal">
                <Button size="lg" className="text-base h-12 px-8">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignInButton>
              <Button asChild variant="outline" size="lg" className="text-base h-12">
                <Link href="/pricing">See Pricing</Link>
              </Button>
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
            <Star className="h-9 w-9 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Free to start, powerful when you need it</h2>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto mb-8">
              {["Up to 3 resumes on the free plan", "Unlimited resumes on Pro", "ATS scoring on every resume", "No credit card required"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <SignInButton mode="modal">
              <Button size="lg" className="text-base h-12 px-8">
                Create your first resume <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignInButton>
          </div>
        </section>
      </main>
    </div>
  );
}
