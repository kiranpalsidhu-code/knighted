import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useSearchJobs,
  useCreateApplication,
  getListApplicationsQueryKey,
  useListResumes,
  getListResumesQueryKey,
  type JobResult,
  type JobSearchResults,
  JobSearchInputWorkArrangement,
} from "@workspace/api-client-react";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Wifi,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Building2,
  Star,
  KanbanSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const EMPLOYMENT_TYPES = [
  { value: "FULLTIME", label: "Full-time" },
  { value: "PARTTIME", label: "Part-time" },
  { value: "CONTRACTOR", label: "Contract" },
  { value: "INTERN", label: "Internship" },
];

const WORK_ARRANGEMENTS = [
  { value: "any", label: "Any arrangement" },
  { value: "remote", label: "Remote only" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite only" },
];

const LOADING_STEPS = [
  "Reading your resume…",
  "Extracting skills and experience…",
  "Identifying best-fit roles…",
  "Searching live job boards…",
  "Filtering out expired listings…",
  "Ranking matches for you…",
];

function LoadingSteps() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-10 flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
      </div>
      <div className="space-y-2 w-full max-w-xs">
        {LOADING_STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 text-sm transition-all duration-500 ${i <= step ? "opacity-100" : "opacity-20"}`}>
            {i < step ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : i === step ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className={i === step ? "text-foreground font-medium" : "text-muted-foreground"}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: JobSearchResults["analysis"] }) {
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm text-primary">Resume Analysis</p>
          <Badge variant="secondary" className="text-xs ml-auto">KI-powered</Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{analysis.summary}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-background rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Best Fit Role</span>
            </div>
            <p className="text-sm font-semibold">{analysis.jobTitle}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Level</span>
            </div>
            <p className="text-sm font-semibold">{analysis.seniorityLevel}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Experience</span>
            </div>
            <p className="text-sm font-semibold">{analysis.yearsOfExperience}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Industry</span>
            </div>
            <p className="text-sm font-semibold">{analysis.industries.join(", ") || "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Top Skills Identified</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.topSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JobCard({ job }: { job: JobResult }) {
  const [saved, setSaved] = useState(false);
  const createApplication = useCreateApplication();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleSaveToPipeline = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    createApplication.mutate(
      { data: { company: job.company, role: job.title, status: "Applied", url: job.url || undefined } },
      {
        onSuccess: () => {
          setSaved(true);
          qc.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          toast({ title: "Saved to pipeline!", description: `${job.company} added to Applied.` });
        },
        onError: () => toast({ title: "Error", description: "Could not save to pipeline.", variant: "destructive" }),
      }
    );
  };

  const formatEmploymentType = (type: string | null | undefined) => {
    if (!type) return null;
    return type.replace("FULLTIME", "Full-time")
      .replace("PARTTIME", "Part-time")
      .replace("CONTRACTOR", "Contract")
      .replace("INTERN", "Internship");
  };

  const postedDate = job.postedAt ? new Date(job.postedAt) : null;
  const isVeryRecent = postedDate && (Date.now() - postedDate.getTime()) < 24 * 60 * 60 * 1000;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <p className="font-semibold text-base">{job.title}</p>
              {isVeryRecent && (
                <Badge className="text-xs bg-green-100 text-green-700 border-green-200 flex-shrink-0">
                  🔥 New today
                </Badge>
              )}
              {job.isRemote && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 flex-shrink-0">
                  <Wifi className="w-3 h-3" /> Remote
                </Badge>
              )}
              {job.employmentType && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {formatEmploymentType(job.employmentType)}
                </Badge>
              )}
            </div>

            <p className="text-sm font-medium text-primary mb-2">{job.company}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {job.location}
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> {job.salary}
                </span>
              )}
              {postedDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(postedDate, { addSuffix: true })}
                </span>
              )}
            </div>

            {job.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            <a href={job.url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 w-full">
                Apply <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={saved || createApplication.isPending}
              onClick={handleSaveToPipeline}
            >
              {saved ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Saved</>
              ) : createApplication.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                <><KanbanSquare className="w-3.5 h-3.5" /> Track</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobSearchPage() {
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workArrangement, setWorkArrangement] = useState<JobSearchInputWorkArrangement>(JobSearchInputWorkArrangement.any);
  const [employmentType, setEmploymentType] = useState<string>("any");
  const [results, setResults] = useState<JobSearchResults | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data: resumes, isLoading: resumesLoading } = useListResumes({
    query: { queryKey: getListResumesQueryKey() },
  });

  const searchJobs = useSearchJobs();

  const handleSearch = () => {
    setNotConfigured(false);
    setSearchError(null);
    setResults(null);

    searchJobs.mutate(
      {
        data: {
          resumeId: selectedResumeId ? Number(selectedResumeId) : undefined,
          jobTitle: jobTitle.trim() || undefined,
          location: location.trim() || undefined,
          workArrangement: workArrangement !== "any" ? workArrangement : undefined,
          employmentType: employmentType && employmentType !== "any" ? employmentType : undefined,
        },
      },
      {
        onSuccess: (data) => setResults(data),
        onError: (err: any) => {
          const status = err?.response?.status ?? err?.status;
          if (status === 503) {
            setNotConfigured(true);
          } else {
            setSearchError("Something went wrong while searching. Please try again.");
          }
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Job Search</h1>
          <p className="text-muted-foreground">
            Knighted Intelligence performs a thorough analysis of your resume, then finds fresh, active job listings matched to your profile.
          </p>
        </div>

        {/* KnightedJobs cross-promo */}
        <a href="/knighted-jobs/jobs" className="block mb-6 group">
          <div className="flex items-center gap-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl px-5 py-3.5 hover:border-primary/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">Browse KnightedJobs</p>
              <p className="text-xs text-muted-foreground mt-0.5">Employer-posted direct listings with salary data, company profiles & one-click apply</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </a>

        {/* Search Panel */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label>Resume <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={resumesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={resumesLoading ? "Loading..." : "Choose a resume"} />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes?.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Job Title <span className="text-muted-foreground text-xs font-normal">(optional — AI picks if blank)</span></Label>
                <Input
                  placeholder="e.g. Senior Product Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Location <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. New York, London"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Work Arrangement</Label>
                <Select value={workArrangement} onValueChange={(v) => setWorkArrangement(v as JobSearchInputWorkArrangement)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_ARRANGEMENTS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col justify-end">
                <Button onClick={handleSearch} disabled={searchJobs.isPending} className="w-full">
                  {searchJobs.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Find Jobs</>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              Pulls live listings from Adzuna, Remotive & more — always fresh, no duplicates
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {searchJobs.isPending && <LoadingSteps />}

        {/* Search error */}
        {notConfigured && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Search temporarily unavailable</p>
              <p className="text-sm text-amber-800 mt-0.5">
                The job search service is temporarily unavailable. Please try again in a moment.
              </p>
            </div>
          </div>
        )}
        {searchError && !notConfigured && (
          <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">Search failed</p>
              <p className="text-sm text-destructive/80 mt-0.5">{searchError}</p>
            </div>
            <button
              onClick={handleSearch}
              className="text-sm font-medium text-destructive hover:underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {results && !searchJobs.isPending && (
          <>
            {results.analysis && <AnalysisCard analysis={results.analysis} />}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{results.jobs.length} active jobs</span>
                {" "}matching <span className="font-medium text-foreground">"{results.query}"</span>
              </p>
            </div>

            {results.jobs.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold mb-1">No matching listings found</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No listings found for <span className="font-medium text-foreground">"{results.query}"</span> in the past month. Try a slightly broader term or remove the location filter to widen the search.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </>
        )}

        {!results && !searchJobs.isPending && !notConfigured && (
          <div className="text-center py-20 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">Find your perfect job</p>
            <p className="text-sm">Select a resume above for personalised AI-matched listings, or search without one. KI surfaces recent, active jobs matched to your profile. Always verify listings directly with the employer before applying.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
