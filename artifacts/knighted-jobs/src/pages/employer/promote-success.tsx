import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Rocket, ArrowRight } from "lucide-react";

export function PromoteSuccessPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/20">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold text-foreground">You're Featured!</h1>
            <p className="text-muted-foreground">
              Your listing is now promoted at the top of search results for <strong className="text-foreground">30 days</strong>.
              Job seekers will see it first.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Rocket className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Top placement in all searches</p>
                <p className="text-xs text-muted-foreground">Promoted listings appear above all other results</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Featured badge on your listing</p>
                <p className="text-xs text-muted-foreground">A gold "Featured" badge distinguishes your role</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/employer/dashboard">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/jobs">View Job Board</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
