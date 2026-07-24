import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useGetSavedJobs, useUnsaveJob, getGetSavedJobsQueryKey } from "@workspace/api-client-react";
import { useAuth, SignInButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, BookmarkX, MapPin, Briefcase, DollarSign, Building, Sparkles, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function SavedJobsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { data, isLoading } = useGetSavedJobs({ query: { queryKey: getGetSavedJobsQueryKey(), enabled: !!isSignedIn } });
  const unsave = useUnsaveJob();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUnsave = (jobId: string, title: string) => {
    unsave.mutate({ jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getSavedJobs"] });
        toast({ title: "Removed", description: `"${title}" removed from saved jobs.` });
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-10">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-serif font-bold">Saved Jobs</h1>
        </div>

        {!isLoaded ? null : !isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-card rounded-2xl border border-border">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Sign in to see your saved jobs</h2>
              <p className="text-muted-foreground mb-6">Save roles as you browse and come back to them any time.</p>
              <SignInButton mode="modal">
                <Button size="lg">Sign in</Button>
              </SignInButton>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl bg-card" />)}
          </div>
        ) : !data?.savedJobs?.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-card rounded-2xl border border-border">
            <Bookmark className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold mb-2">No saved jobs yet</h2>
              <p className="text-muted-foreground mb-6">Hit the bookmark icon on any job to save it here.</p>
              <Button asChild>
                <Link href="/jobs">Browse Roles</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.savedJobs.map(({ jobId, jobSnapshot, savedAt }) => {
              const job = jobSnapshot as any;
              const isDirect = job.source === "direct";
              const detailUrl = isDirect ? `/jobs/${job.id}` : (job.url || "#");

              const formatSalary = () => {
                if (!job.salaryMin && !job.salaryMax) return null;
                const currency = job.salaryCurrency || "USD";
                const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
                if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
                if (job.salaryMin) return `${fmt(job.salaryMin)}+`;
                return `Up to ${fmt(job.salaryMax)}`;
              };

              const salary = formatSalary();
              const savedDate = new Date(savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

              return (
                <Card key={jobId} className="group transition-all duration-300 hover:border-primary/50 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl font-serif text-card-foreground group-hover:text-primary transition-colors">
                          {isDirect ? (
                            <Link href={detailUrl} className="focus:outline-none focus:underline">{job.title}</Link>
                          ) : (
                            <a href={detailUrl} target="_blank" rel="noreferrer" className="focus:outline-none focus:underline">{job.title}</a>
                          )}
                        </CardTitle>
                        <div className="flex items-center text-muted-foreground text-sm gap-2">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{job.company}</span>
                          <span className="text-xs text-muted-foreground/60">· Saved {savedDate}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleUnsave(jobId, job.title)}
                      >
                        <BookmarkX className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location || "Location not specified"}</span>
                        {job.isRemote && <Badge variant="outline" className="ml-1 text-xs">Remote</Badge>}
                      </div>
                      {job.employmentType && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" />
                          <span className="capitalize">{job.employmentType.replace("_", " ")}</span>
                        </div>
                      )}
                      {salary && (
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <DollarSign className="h-4 w-4" />
                          <span>{salary}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description?.replace(/(<([^>]+)>)/gi, "") || ""}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border/50 mt-auto pt-4">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 border-primary/20 text-primary hover:bg-primary/10" asChild>
                      <a href="https://theknightedresume.com" target="_blank" rel="noreferrer">
                        <Sparkles className="h-4 w-4" />
                        Tailor Resume with KI
                      </a>
                    </Button>
                    <Button size="sm" className="w-full sm:w-auto" asChild>
                      {isDirect ? (
                        <Link href={detailUrl}>View Details</Link>
                      ) : (
                        <a href={detailUrl} target="_blank" rel="noreferrer">Apply Externally</a>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
