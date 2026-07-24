import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import {
  useGetKnightedListing,
  getGetKnightedListingQueryKey,
  useApplyToListing,
  useCreateApplication,
  useGetMatchScore,
  useSearchKnightedJobs,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Briefcase, DollarSign, Sparkles, Clock, Globe, CheckCircle2, Zap, X, ChevronRight, Share2, Copy, Check, ArrowRight } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
import { JobDescription } from "@/components/jobs/JobDescription";
import "@/styles/job-description.css";

function SimilarJobs({ category, currentId }: { category: string; currentId: number }) {
  const { data } = useSearchKnightedJobs({ q: category, page: 1 });
  const similar = data?.jobs?.filter((j) => Number(j.id) !== currentId).slice(0, 4) ?? [];
  if (similar.length === 0) return null;
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold">Similar Roles</h2>
        <Link href={`/jobs?q=${encodeURIComponent(category)}`}
          className="text-sm text-primary underline underline-offset-2 flex items-center gap-1">
          See all {category} roles <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similar.map((j) => <JobCard key={j.id} job={j} />)}
      </div>
    </div>
  );
}
import { relativeTime, freshnessClass, freshnessLabel } from "@/lib/time";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

export function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const id = params?.id ? Number(params.id) : 0;
  const { user } = useUser();
  const { toast } = useToast();

  const { data: job, isLoading, isError } = useGetKnightedListing(id, {
    query: {
      enabled: !!id,
      queryKey: getGetKnightedListingQueryKey(id),
    }
  });

  const applyMutation = useApplyToListing();
  const createApplication = useCreateApplication();
  const matchScoreMutation = useGetMatchScore();
  const [referralCopied, setReferralCopied] = useState(false);

  useSEO({
    title: job ? `${job.title} at ${job.company}` : "Job Details",
    description: job
      ? `${job.title} at ${job.company} · ${job.location}. ${job.description.slice(0, 110).replace(/\n/g, " ")}…`
      : "View this direct job listing on KnightedJobs. Real salary data and AI-powered resume tailoring.",
    canonical: `/jobs/${id}`,
    ogType: "article",
  });

  // Fire-and-forget view tracking
  useEffect(() => {
    if (id) {
      fetch(`/api/knighted-jobs/listings/${id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [id]);

  // JSON-LD JobPosting structured data
  useEffect(() => {
    if (!job) return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
      },
      "jobLocation": {
        "@type": "Place",
        "address": { "@type": "PostalAddress", "addressLocality": job.location },
      },
      "datePosted": job.postedAt,
      "directApply": true,
      "url": `https://theknightedjobs.com/knighted-jobs/jobs/${job.id}`,
    };
    if (job.salaryMin || job.salaryMax) {
      schema["baseSalary"] = {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salaryMin ?? job.salaryMax,
          "maxValue": job.salaryMax ?? job.salaryMin,
          "unitText": "YEAR",
        },
      };
    }
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, [job]);

  // Recently viewed — save to localStorage when job data loads
  useEffect(() => {
    if (!job) return;
    try {
      const KEY = "kj_recently_viewed";
      const stored: Array<{ id: number; title: string; company: string; location: string; postedAt: string }> =
        JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const entry = { id: Number(job.id), title: job.title, company: job.company, location: job.location, postedAt: "postedAt" in job ? (job.postedAt as string) : "" };
      const filtered = stored.filter(r => r.id !== entry.id);
      const next = [entry, ...filtered].slice(0, 10);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [job]);

  const handleShare = async () => {
    if (!user) {
      toast({ title: "Sign in to create a referral link", description: "Earn 1 month of Knighted Resume Pro for every 5 referral clicks." });
      return;
    }
    try {
      const res = await fetch("/api/knighted-jobs/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await (window as any).Clerk?.session?.getToken()}` },
        body: JSON.stringify({ listingId: id }),
      });
      const { token } = await res.json();
      const referralUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/knighted-jobs/r/${token}`;
      await navigator.clipboard.writeText(referralUrl);
      setReferralCopied(true);
      toast({ title: "Referral link copied!", description: "Share it — earn 1 month of Knighted Resume Pro for every 5 clicks." });
      setTimeout(() => setReferralCopied(false), 3000);
    } catch {
      toast({ title: "Could not generate link", variant: "destructive" });
    }
  };

  // Apply modal
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [form, setForm] = useState({
    name: user?.fullName ?? "",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    phone: "",
    linkedinUrl: "",
    coverNote: "",
    resumeText: "",
  });

  // KI Match Score modal
  const [matchOpen, setMatchOpen] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [matchResult, setMatchResult] = useState<null | {
    score: number;
    summary: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  }>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(
      { id, data: { name: form.name, email: form.email, phone: form.phone || undefined, linkedinUrl: form.linkedinUrl || undefined, coverNote: form.coverNote || undefined, resumeText: form.resumeText || undefined } },
      {
        onSuccess: () => {
          setApplied(true);
          if (user && job) {
            const salary = job.salaryMin || job.salaryMax
              ? [job.salaryMin && `$${job.salaryMin.toLocaleString()}`, job.salaryMax && `$${job.salaryMax.toLocaleString()}`].filter(Boolean).join(' – ')
              : undefined;
            const jobUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/jobs/${id}`;
            createApplication.mutate({
              data: { company: job.company, role: job.title, status: "Applied", salary, notes: form.coverNote || undefined, url: jobUrl }
            });
          }
        },
        onError: () => {
          toast({ title: "Failed to submit", description: "Please try again or contact the employer directly.", variant: "destructive" });
        },
      }
    );
  };

  const handleMatchScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    matchScoreMutation.mutate(
      { data: { resumeText, jobDescription: job.description } },
      {
        onSuccess: (result) => setMatchResult(result),
        onError: () => toast({ title: "Couldn't run match score", variant: "destructive" }),
      }
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBar = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const tailorUrl = job
    ? `/resumes?ki=1&role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&jd=${encodeURIComponent(job.description.slice(0, 2000))}`
    : "/resumes";

  const formatSalary = () => {
    if (!job?.salaryMin && !job?.salaryMax) return null;
    const currency = job.salaryCurrency || 'USD';
    const min = job.salaryMin ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(job.salaryMin) : '';
    const max = job.salaryMax ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(job.salaryMax) : '';
    if (min && max) return `${min} – ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-4xl py-12">
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </main>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
            <p className="text-muted-foreground">This listing may have expired or been removed.</p>
          </div>
        </main>
      </div>
    );
  }

  const salary = formatSalary();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "JobPosting",
          "title": job.title,
          "description": job.description,
          "datePosted": job.postedAt,
          "validThrough": job.expiresAt,
          "employmentType": ({ full_time: "FULL_TIME", part_time: "PART_TIME", contract: "CONTRACTOR", internship: "INTERN" } as Record<string, string>)[job.employmentType ?? ""] ?? "FULL_TIME",
          "hiringOrganization": { "@type": "Organization", "name": job.company, "sameAs": job.companyWebsite },
          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": job.location } },
          ...(salary ? { "baseSalary": { "@type": "MonetaryAmount", "currency": job.salaryCurrency || "USD", "value": { "@type": "QuantitativeValue", "minValue": job.salaryMin, "maxValue": job.salaryMax, "unitText": "YEAR" } } } : {})
        })
      }} />

      <main className="flex-1 container max-w-4xl py-12">
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <CompanyLogo company={job.company} logoUrl={(job as any).logoUrl} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Direct Listing</Badge>
                    {job.isRemote && <Badge variant="outline">Remote</Badge>}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-0">{job.title}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Link href={`/companies/${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                    className="font-medium text-foreground hover:text-primary hover:underline transition-colors">
                    {job.company}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{job.location}</span>
                </div>
                {job.employmentType && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
                  </div>
                )}
                {salary && (
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <DollarSign className="h-5 w-5" />
                    <span>{salary}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <Button size="lg" className="w-full font-bold shadow-md" onClick={() => setApplyOpen(true)}>
                Apply Now
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      onClick={() => setMatchOpen(true)}
                    >
                      <Zap className="h-4 w-4" />
                      KI Match Score
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs text-xs">
                    <strong>Knight Intelligence (KI)</strong> — paste your resume and get an AI-powered score (0–100) showing how well you match this role, plus a keyword gap analysis.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10" asChild>
                      <a href={tailorUrl} target="_blank" rel="noreferrer">
                        <Sparkles className="h-4 w-4" />
                        Tailor Resume with KI →
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs text-xs">
                    <strong>Knight Intelligence (KI)</strong> — AI rewrites your resume to hit this job's exact keywords and ATS filters, boosting your callback rate.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Social share row */}
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${job.title} at ${job.company}`)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.257 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-border text-xs text-muted-foreground hover:text-[#0077b5] hover:border-[#0077b5]/40 hover:bg-[#0077b5]/5 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Share
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
                  onClick={handleShare}
                >
                  {referralCopied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
                  {referralCopied ? "Copied!" : "Earn Pro"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-border pt-8 mt-8">
            <div className="md:col-span-3">
              <h2 className="text-xl font-bold font-serif mb-4 text-foreground">About the Role</h2>
              <JobDescription text={job.description} />
            </div>
            <div className="md:col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Job Details</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={freshnessClass(job.postedAt)}>
                      {freshnessLabel(job.postedAt)} · {relativeTime(job.postedAt)}
                    </span>
                  </li>
                  {job.category && (
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{job.category}</span>
                    </li>
                  )}
                  {job.companyWebsite && (
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={job.companyWebsite} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                        Company Website
                      </a>
                    </li>
                  )}
                </ul>
              </div>
              <Button size="sm" className="w-full" onClick={() => setApplyOpen(true)}>Apply Now</Button>
              <Button size="sm" variant="outline" className="w-full gap-1.5 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" onClick={() => setMatchOpen(true)}>
                <Zap className="h-4 w-4" />
                Check My Match
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Jobs */}
        {job.category && <SimilarJobs category={job.category} currentId={id} />}
      </main>

      {/* Apply Modal */}
      <Dialog open={applyOpen} onOpenChange={(o) => { setApplyOpen(o); if (!o) setApplied(false); }}>
        <DialogContent className="max-w-lg bg-card border-border">
          {applied ? (
            <div className="flex flex-col items-center py-8 text-center gap-4">
              <CheckCircle2 className="h-16 w-16 text-primary" />
              <h2 className="text-2xl font-serif font-bold">Application Sent!</h2>
              <p className="text-muted-foreground">
                Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been submitted. The employer will be in touch.
              </p>
              <div className="flex gap-3 mt-2">
                {job.applyUrl && (
                  <Button asChild variant="outline">
                    <a href={job.applyUrl} target="_blank" rel="noreferrer">Continue to Employer →</a>
                  </Button>
                )}
                <Button onClick={() => { setApplyOpen(false); setApplied(false); }}>Done</Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Apply for {job.title}</DialogTitle>
                <DialogDescription>{job.company} · {job.location}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleApply} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full name *</Label>
                    <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" required className="bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" required className="bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" className="bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn URL</Label>
                    <Input value={form.linkedinUrl} onChange={(e) => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="linkedin.com/in/..." className="bg-background" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Cover note</Label>
                  <Textarea value={form.coverNote} onChange={(e) => setForm(f => ({ ...f, coverNote: e.target.value }))} placeholder="Tell the employer why you're a great fit…" rows={4} className="bg-background resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    Resume text <span className="text-muted-foreground font-normal text-xs ml-1">optional — enables KI Application Score</span>
                  </Label>
                  <Textarea value={form.resumeText} onChange={(e) => setForm(f => ({ ...f, resumeText: e.target.value }))} placeholder="Paste your resume text here so the employer can see your KI match score…" rows={5} className="bg-background resize-none font-mono text-sm" />
                </div>
                <Button type="submit" className="w-full font-bold" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? "Submitting…" : "Submit Application"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* KI Match Score Modal */}
      <Dialog open={matchOpen} onOpenChange={(o) => { setMatchOpen(o); if (!o) setMatchResult(null); }}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              KI Match Score
            </DialogTitle>
            <DialogDescription>Paste your resume to see how well it matches <strong>{job.title}</strong> at {job.company}.</DialogDescription>
          </DialogHeader>

          {matchResult ? (
            <div className="space-y-6 mt-2">
              {/* Score */}
              <div className="flex flex-col items-center py-6 bg-background rounded-xl border border-border">
                <div className={`text-6xl font-bold font-serif mb-2 ${getScoreColor(matchResult.score)}`}>
                  {matchResult.score}%
                </div>
                <div className="w-48 mb-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${getScoreBar(matchResult.score)}`} style={{ width: `${matchResult.score}%` }} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-sm">{matchResult.summary}</p>
              </div>

              {/* Keywords */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg border border-green-500/20 p-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Matched ({matchResult.matchedKeywords.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchedKeywords.map((kw) => (
                      <Badge key={kw} className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-background rounded-lg border border-red-500/20 p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                    <X className="h-4 w-4" /> Missing ({matchResult.missingKeywords.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingKeywords.map((kw) => (
                      <Badge key={kw} className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-background rounded-lg border border-primary/20 p-4">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> KI Suggestions
                </h3>
                <ul className="space-y-2">
                  {matchResult.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2" asChild>
                  <a href={tailorUrl} target="_blank" rel="noreferrer">
                    <Sparkles className="h-4 w-4" />
                    Tailor Resume in KI →
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setMatchResult(null)} className="flex-1">
                  Re-score
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMatchScore} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Paste your resume text *</Label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the full text of your resume here…"
                  rows={10}
                  className="bg-background resize-none font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">We'll compare your experience against this job description using AI.</p>
              </div>
              <Button type="submit" className="w-full gap-2 font-bold" disabled={matchScoreMutation.isPending || resumeText.length < 50}>
                <Zap className="h-4 w-4" />
                {matchScoreMutation.isPending ? "Analysing…" : "Get My Match Score"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
