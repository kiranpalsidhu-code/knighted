import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Briefcase, DollarSign, Sparkles, Bookmark, BookmarkCheck, CheckCircle2, CircleAlert, Clock, Globe, Heart, TrendingUp, Plane } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { relativeTime, freshnessClass, freshnessLabel } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/react";
import { useSaveJob, useUnsaveJob, useGetSavedJobs, getGetSavedJobsQueryKey, useCreateApplication } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { KnightedJob, KnightedListing } from "@workspace/api-client-react";

const SKILL_KEYWORDS = [
  "Python","JavaScript","TypeScript","React","Node.js","AWS","SQL","Excel",
  "Power BI","Tableau","Bloomberg","VBA","Docker","Kubernetes","Java","Go",
  "R","Salesforce","SAP","CFA","Terraform","GraphQL","C++","C#","Swift",
  "Kotlin","Angular","Vue","Redis","MongoDB","PostgreSQL","MySQL","Azure",
  "GCP","Spark","Airflow","dbt","Looker","Pandas","TensorFlow","PyTorch",
  "Figma","JIRA","Confluence","Snowflake","Databricks","Power Apps","NumPy",
];

function SkillTags({ description }: { description: string }) {
  const plain = description.replace(/(<([^>]+)>)/gi, "");
  const found = SKILL_KEYWORDS.filter(s =>
    new RegExp(`\\b${s.replace(/[+#]/g, "\\$&")}\\b`, "i").test(plain)
  );
  if (found.length === 0) return null;
  const shown = found.slice(0, 4);
  const extra = found.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
      {shown.map(s => (
        <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/60 font-mono">
          {s}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs px-1.5 py-0.5 text-muted-foreground/60">+{extra}</span>
      )}
    </div>
  );
}

const PERK_PATTERNS: { label: string; pattern: RegExp; icon: React.ReactNode }[] = [
  { label: "Visa Sponsorship", pattern: /visa spon|sponsorship available|relocation|immigration support/i, icon: <Plane className="h-2.5 w-2.5" /> },
  { label: "Equity / RSU", pattern: /\bequity\b|\brsu\b|stock option|vesting/i, icon: <TrendingUp className="h-2.5 w-2.5" /> },
  { label: "Health Cover", pattern: /health insurance|medical cover|private health|dental|healthcare benefit/i, icon: <Heart className="h-2.5 w-2.5" /> },
  { label: "Remote-Friendly", pattern: /hybrid|flexible working|work from home|remote working/i, icon: <Globe className="h-2.5 w-2.5" /> },
];

function BenefitTags({ description }: { description: string }) {
  const matched = PERK_PATTERNS.filter(p => p.pattern.test(description));
  if (matched.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {matched.map(p => (
        <span key={p.label} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {p.icon}{p.label}
        </span>
      ))}
    </div>
  );
}

interface JobCardProps {
  job: KnightedJob | KnightedListing;
}

export function JobCard({ job }: JobCardProps) {
  const { isSignedIn } = useAuth();
  const { data: savedData } = useGetSavedJobs({ query: { queryKey: getGetSavedJobsQueryKey(), enabled: !!isSignedIn } });
  const saveJob = useSaveJob();
  const unsaveJob = useUnsaveJob();
  const createApplication = useCreateApplication();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [markedApplied, setMarkedApplied] = useState(false);

  const isDirect = 'source' in job ? job.source === 'direct' : true;
  const isPromoted = isDirect && (job as any).isPromoted === true;
  const externalUrl = 'url' in job && job.url ? job.url : null;
  const detailUrl = isDirect ? `/jobs/${job.id}` : (externalUrl || '#');

  const tailorUrl = `/resumes?ki=1&role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&jd=${encodeURIComponent(job.description.slice(0, 2000))}`;

  const jobId = String(job.id);
  const isSaved = savedData?.savedJobs?.some((s) => s.jobId === jobId) ?? false;

  const handleMarkApplied = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      toast({ title: "Sign in to track applications", description: "Create a free account to track your applications." });
      return;
    }
    const salary = job.salaryMin || job.salaryMax
      ? [job.salaryMin && `$${job.salaryMin.toLocaleString()}`, job.salaryMax && `$${job.salaryMax.toLocaleString()}`].filter(Boolean).join(' – ')
      : undefined;
    createApplication.mutate(
      { data: { company: job.company, role: job.title, status: "Applied", url: externalUrl ?? undefined, salary } },
      {
        onSuccess: () => {
          setMarkedApplied(true);
          toast({ title: "Tracked in your pipeline!", description: "View it in Knighted Resume." });
        },
        onError: () => {
          toast({ title: "Couldn't track application", variant: "destructive" });
        },
      }
    );
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      toast({ title: "Sign in to save jobs", description: "Create a free account to bookmark roles." });
      return;
    }

    if (isSaved) {
      unsaveJob.mutate({ jobId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getSavedJobs"] });
          toast({ title: "Removed from saved jobs" });
        },
      });
    } else {
      const snapshot = {
        id: String(job.id),
        title: job.title,
        company: job.company,
        location: job.location,
        salaryMin: job.salaryMin ?? null,
        salaryMax: job.salaryMax ?? null,
        salaryCurrency: job.salaryCurrency ?? null,
        description: job.description,
        url: externalUrl ?? null,
        isRemote: job.isRemote ?? false,
        employmentType: job.employmentType ?? null,
        category: job.category ?? null,
        postedAt: 'postedAt' in job ? (job.postedAt as string) : new Date().toISOString(),
        source: 'source' in job ? job.source : 'direct',
      };
      saveJob.mutate({ data: { jobId, jobSnapshot: snapshot } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getSavedJobs"] });
          toast({ title: "Job saved!", description: "Find it in Saved Jobs." });
        },
      });
    }
  };

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const currency = job.salaryCurrency || 'USD';
    const min = job.salaryMin ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(job.salaryMin) : '';
    const max = job.salaryMax ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(job.salaryMax) : '';
    if (min && max) return `${min} – ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  };

  const salary = formatSalary();
  const CardWrapper = isDirect ? Link : "a";
  const wrapperProps = isDirect ? { href: detailUrl } : { href: detailUrl, target: "_blank", rel: "noreferrer" };

  return (
    <Card className={`group transition-all duration-300 hover:border-primary/50 hover:shadow-md bg-card flex flex-col h-full ${isPromoted ? "ring-1 ring-primary/40 border-primary/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <CompanyLogo company={job.company} logoUrl={(job as any).logoUrl} size="sm" />
            <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-xl font-serif text-card-foreground group-hover:text-primary transition-colors">
              <CardWrapper {...wrapperProps} className="focus:outline-none focus:underline">
                {job.title}
              </CardWrapper>
            </CardTitle>
            <div className="flex items-center text-muted-foreground text-sm gap-2 flex-wrap">
              <Link href={`/companies/${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                className="font-medium hover:text-primary hover:underline transition-colors"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {job.company}
              </Link>
              {isPromoted && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2 py-0 gap-1">
                  <Sparkles className="h-3 w-3" /> Featured
                </Badge>
              )}
              {isDirect ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs px-2 py-0">
                  Direct Listing
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-2 py-0">
                  External
                </Badge>
              )}
            </div>
            </div>
          </div>
          <button
            onClick={handleSaveToggle}
            className={`shrink-0 p-1.5 rounded-md transition-colors ${isSaved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            title={isSaved ? "Remove from saved" : "Save job"}
            aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
          >
            {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{job.location || 'Location Not Specified'}</span>
            {job.isRemote && <Badge variant="outline" className="ml-1 text-xs">Remote</Badge>}
          </div>
          {job.employmentType && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
            </div>
          )}
          {salary ? (
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span>{salary}</span>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs px-1.5 py-0 border">
                Salary Disclosed
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <CircleAlert className="h-3.5 w-3.5 text-amber-500/70" />
              <span className="text-xs text-amber-500/70 italic">Salary not listed</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {job.description.replace(/(<([^>]+)>)/gi, "")}
        </p>
        <SkillTags description={job.description} />
        <BenefitTags description={job.description} />
      </CardContent>
      <CardFooter className="pt-0 flex flex-col items-stretch gap-2 border-t border-border/50 mt-auto pt-4">
        {'postedAt' in job && job.postedAt && (
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground/60" />
            <span className={`text-xs font-medium ${freshnessClass(job.postedAt as string)}`}>
              {freshnessLabel(job.postedAt as string)}
            </span>
            <span className="text-xs text-muted-foreground/60">· {relativeTime(job.postedAt as string)}</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 border-primary/20 text-primary hover:bg-primary/10" asChild>
                  <a href={tailorUrl}>
                    <Sparkles className="h-4 w-4" />
                    Tailor Resume with KI
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <strong>Knight Intelligence (KI)</strong> — AI rewrites your resume to match this job's keywords and ATS requirements, boosting your interview chances.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="sm" className="w-full sm:w-auto" asChild>
            <CardWrapper {...wrapperProps}>
              {isDirect ? "View Details" : "Apply Externally"}
            </CardWrapper>
          </Button>
        </div>
        {!isDirect && isSignedIn && (
          <Button
            variant="ghost"
            size="sm"
            className={`w-full gap-2 ${markedApplied ? "text-green-500 hover:text-green-500" : "text-muted-foreground hover:text-foreground"}`}
            onClick={handleMarkApplied}
            disabled={createApplication.isPending || markedApplied}
          >
            <CheckCircle2 className="h-4 w-4" />
            {markedApplied ? "Application tracked!" : "Mark as Applied"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
