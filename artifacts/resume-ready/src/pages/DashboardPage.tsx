import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetMyProfile,
  getGetMyProfileQueryKey,
  useListCoverLetters,
} from "@workspace/api-client-react";
import { FileText, KanbanSquare, CheckCircle2, TrendingUp, Sparkles, ArrowRight, Chrome, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/react";

function GuaranteeClaimCard() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [claim, setClaim] = useState<{ status: string } | null | undefined>(undefined);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/resume-ready/billing/guarantee-claim", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClaim(data.claim || null);
      } catch {
        setClaim(null);
      }
    })();
  }, [getToken]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/billing/guarantee-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit claim");
      setClaim(data.claim);
      toast({ title: "Claim submitted", description: "We'll review your request and follow up by email." });
    } catch (err: any) {
      toast({ title: "Failed to submit claim", description: err?.message || "Please try again later.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (claim === undefined) return null;

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-xl p-6">
      <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-primary" />
        Job Guarantee
      </h2>
      {claim ? (
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            claim.status === "approved" ? "bg-green-100 text-green-700" :
            claim.status === "denied" ? "bg-red-100 text-red-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            Claim {claim.status}
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            {claim.status === "pending" && "We've received your request and will follow up by email soon."}
            {claim.status === "approved" && "Your claim was approved — check your email for details on your 3 free months."}
            {claim.status === "denied" && "Your claim was reviewed. Contact support if you have questions."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Haven't landed a job yet? Tell us a bit about your search and we'll review your request for 3 free months.
          </p>
          <Textarea
            placeholder="Optional: share details about your job search (roles applied to, timeline, etc.)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mb-3 bg-background"
            rows={3}
          />
          <Button onClick={handleSubmit} disabled={submitting} size="sm">
            {submitting ? "Submitting..." : "Request Job Guarantee"}
          </Button>
        </>
      )}
    </div>
  );
}

const ONBOARDING_STEPS = [
  { label: "Create your first resume", href: "/resumes", done: (s: any, _cl: number) => (s?.resumeCount || 0) > 0 },
  { label: "Add a job to your pipeline", href: "/pipeline", done: (s: any, _cl: number) => (s?.applicationCount || 0) > 0 },
  { label: "Tailor your resume with KI", href: "/resumes", done: (s: any, _cl: number) => (s?.resumeCount || 0) > 1 },
  { label: "Generate a cover letter", href: "/cover-letters", done: (_s: any, cl: number) => cl > 0 },
];

export default function DashboardPage() {
  const [location] = useLocation();
  const { toast } = useToast();

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: profile, isLoading: isLoadingProfile } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() }
  });

  const { data: coverLetters } = useListCoverLetters();
  const coverLetterCount = coverLetters?.length ?? 0;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('upgraded') === 'true') {
      toast({
        title: "Upgrade Successful!",
        description: "Welcome to Knighted Resume Pro. You now have access to all premium features.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const isLoading = isLoadingSummary || isLoadingProfile;
  const isPro = profile?.tier === 'pro';
  const planType = (profile as any)?.planType;

  const isNewUser = !isLoading && (summary?.resumeCount || 0) === 0 && (summary?.applicationCount || 0) === 0;
  const completedSteps = isLoading ? 0 : ONBOARDING_STEPS.filter(s => s.done(summary, coverLetterCount)).length;
  const allDone = completedSteps >= 2;

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your job search progress.</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current Plan:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {isPro ? 'Pro' : 'Starter'}
              </span>
            </div>
          )}
        </div>

        {!isLoading && !isPro && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Unlock your full potential
              </h2>
              <p className="text-muted-foreground mt-1">Upgrade to Pro for unlimited resumes, KI tailoring, and advanced feedback.</p>
            </div>
            <Link href="/pricing">
              <Button>Upgrade to Pro</Button>
            </Link>
          </div>
        )}

        {!isLoading && isPro && planType === '6month' && <GuaranteeClaimCard />}

        {/* Onboarding checklist for new users */}
        {isNewUser && (
          <div className="border border-border rounded-xl p-6 bg-muted/20">
            <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Get started — 4 steps to your first tailored application
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Follow these steps to get the most out of Knighted Resume.</p>
            <div className="space-y-2">
              {ONBOARDING_STEPS.map((step, i) => {
                const done = step.done(summary, coverLetterCount);
                return (
                  <Link key={i} href={step.href}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer ${done ? 'bg-green-50 border-green-200 text-green-800' : 'bg-background border-border hover:bg-muted/40'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${done ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm font-medium ${done ? 'line-through text-green-700' : ''}`}>{step.label}</span>
                      {!done && <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Resumes</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold">{summary?.resumeCount || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
              <KanbanSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold">{summary?.applicationCount || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold">{summary?.applicationsByStatus?.['Interview'] || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Offers</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold text-green-600">{summary?.applicationsByStatus?.['Offer'] || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get back to work quickly</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <Link href="/resumes" className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-md text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Manage Resumes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
              
              <Link href="/pipeline" className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-md text-primary">
                    <KanbanSquare className="w-5 h-5" />
                  </div>
                  <span className="font-medium">View Track Jobs</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              <Link href="/pipeline?ext_add=0" onClick={(e) => { e.preventDefault(); window.open("https://chromewebstore.google.com/", "_blank"); }} className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md text-muted-foreground">
                    <Chrome className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-medium block">Chrome Extension</span>
                    <span className="text-xs text-muted-foreground">One-click capture from LinkedIn & Indeed</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Track Jobs</CardTitle>
              <CardDescription>Status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (summary?.applicationCount || 0) === 0 ? (
                <div className="text-center py-6">
                  <KanbanSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No applications yet.</p>
                  <Link href="/pipeline">
                    <Button size="sm" variant="outline">
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add your first application
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { key: 'Applied',     label: 'Applied',     color: 'bg-blue-500' },
                    { key: 'PhoneScreen', label: 'Screening',   color: 'bg-indigo-500' },
                    { key: 'Interview',   label: 'Interview',   color: 'bg-purple-500' },
                    { key: 'Offer',       label: 'Offer',       color: 'bg-green-500' },
                    { key: 'Rejected',    label: 'Rejected',    color: 'bg-red-500' }
                  ].map(({ key, label, color }) => {
                    const count = summary?.applicationsByStatus?.[key] || 0;
                    const total = summary?.applicationCount || 1;
                    const pct = Math.round((count / total) * 100) || 0;
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-28 text-sm font-medium">{label}</div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="w-8 text-right text-sm text-muted-foreground">{count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
