import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, Globe, Clock, DollarSign, ChevronRight, Briefcase, ArrowRight } from "lucide-react";
import { useSearchKnightedJobs } from "@workspace/api-client-react";

const REMOTE_CATEGORIES = [
  "Engineering", "Data & AI", "Product", "Design",
  "Marketing", "Finance", "Consulting", "Operations",
  "Sales", "Communications", "People & HR",
];

const CAT_SLUG: Record<string, string> = {
  "Engineering": "engineering", "Data & AI": "data-ai", "Product": "product",
  "Design": "design", "Marketing": "marketing", "Finance": "finance",
  "Consulting": "consulting", "Operations": "operations", "Sales": "sales",
  "Communications": "communications", "People & HR": "people-hr",
};

const PERKS = [
  { icon: Globe, title: "Work from anywhere", body: "All listings allow full remote. No hybrid bait-and-switch." },
  { icon: DollarSign, title: "Salary disclosed", body: "The majority of remote listings include a salary range upfront." },
  { icon: Clock, title: "Async-friendly", body: "Many roles are timezone-flexible or fully async with no mandatory standups." },
  { icon: Briefcase, title: "Direct applications", body: "Apply straight to the employer. No recruiter middlemen or phantom listings." },
];

export function RemoteJobsPage() {
  useSEO({
    title: "Remote Jobs — Work From Anywhere",
    description: "Browse 100+ remote jobs across Engineering, Finance, Product, Design and more. Direct listings, real salaries, no recruiter spam. Work from anywhere.",
    canonical: "/jobs/remote",
  });

  const { data, isLoading } = useSearchKnightedJobs({ remote: true, page: 1 });
  const jobs   = data?.jobs?.slice(0, 12) ?? [];
  const total  = data?.total ?? 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      {/* Breadcrumb */}
      <div className="container max-w-6xl pt-6 pb-0 px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/jobs" className="hover:text-primary transition-colors">Jobs</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Remote</span>
        </nav>
      </div>

      {/* Hero */}
      <section aria-label="Remote jobs overview" className="container max-w-6xl px-4 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Fully Remote</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
              Remote Jobs
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg text-base leading-relaxed">
              Real remote roles — no hybrid, no "remote-ish." Browse direct listings with disclosed salaries from companies that trust their teams to work from anywhere.
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <div className="text-4xl font-serif font-bold text-primary">{total > 0 ? `${total}+` : "—"}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Remote Roles</div>
            </div>
            <Button asChild size="lg" className="mb-0.5">
              <Link href="/jobs?remote=true">Browse All Remote</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why remote here */}
      <section aria-label="Remote jobs features" className="border-y border-border/40 bg-card/40">
        <div className="container max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-6xl px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar */}
          <aside className="md:w-52 shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Browse by Category</h2>
            <nav aria-label="Browse by category" className="space-y-1">
              <Link
                href="/jobs/remote"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium"
              >
                <Wifi className="h-3.5 w-3.5" /> All Remote
              </Link>
              {REMOTE_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/jobs/${CAT_SLUG[cat] ?? cat.toLowerCase()}?remote=true`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {isLoading ? "Loading…" : `${total} Remote Jobs`}
                <span className="text-sm font-normal text-muted-foreground ml-2">Direct listings first</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Wifi className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">No remote listings yet</p>
                <p className="text-sm mt-1">Check back soon or browse all jobs.</p>
                <Button asChild className="mt-6">
                  <Link href="/jobs">Browse All Jobs</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                {total > 12 && (
                  <div className="mt-8 text-center">
                    <Button asChild variant="outline" size="lg">
                      <Link href="/jobs?remote=true">
                        View all {total} remote jobs <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
