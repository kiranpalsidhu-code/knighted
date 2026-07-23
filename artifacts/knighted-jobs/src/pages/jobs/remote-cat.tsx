import { useRoute, Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, ChevronRight, ArrowRight, Globe } from "lucide-react";
import { useSearchKnightedJobs } from "@workspace/api-client-react";
import { CATEGORY_SLUGS } from "@/data/landing-pages";

const REMOTE_CATEGORIES = [
  { slug: "engineering",    label: "Engineering"   },
  { slug: "finance",        label: "Finance"       },
  { slug: "data-ai",        label: "Data & AI"     },
  { slug: "product",        label: "Product"       },
  { slug: "consulting",     label: "Consulting"    },
  { slug: "marketing",      label: "Marketing"     },
  { slug: "design",         label: "Design"        },
  { slug: "operations",     label: "Operations"    },
  { slug: "sales",          label: "Sales"         },
  { slug: "people-hr",      label: "People & HR"   },
];

export function RemoteCategoryPage() {
  const [, params] = useRoute("/jobs/remote/:cat");
  const catSlug = params?.cat ?? "";
  const catLabel = CATEGORY_SLUGS[catSlug] ?? catSlug;

  useSEO({
    title: `Remote ${catLabel} Jobs — Work From Anywhere`,
    description: `Browse remote ${catLabel} jobs with disclosed salaries. Direct listings, no recruiter spam. Work from anywhere in ${catLabel}.`,
    canonical: `/jobs/remote/${catSlug}`,
  });

  const { data, isLoading } = useSearchKnightedJobs({
    remote: true,
    category: catLabel,
    page: 1,
  });
  const jobs  = data?.jobs?.slice(0, 12) ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <div className="container max-w-6xl pt-6 pb-0 px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/jobs" className="hover:text-primary transition-colors">Jobs</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/jobs/remote" className="hover:text-primary transition-colors">Remote</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{catLabel}</span>
        </nav>
      </div>

      <section aria-label="Category jobs overview" className="container max-w-6xl px-4 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Fully Remote</Badge>
              <Badge variant="outline" className="text-xs">{catLabel}</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
              Remote {catLabel} Jobs
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg text-base leading-relaxed">
              Fully remote {catLabel.toLowerCase()} roles with disclosed salaries — direct from the employer. No recruiters, no hybrid bait-and-switch.
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <div className="text-4xl font-serif font-bold text-primary">{total > 0 ? `${total}+` : "—"}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Roles</div>
            </div>
            <Button asChild size="lg" className="mb-0.5">
              <Link href={`/jobs?remote=true&category=${encodeURIComponent(catLabel)}`}>Browse All</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-6xl px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          <aside className="md:w-52 shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Remote by Category</h2>
            <nav aria-label="Browse by category" className="space-y-1">
              <Link href="/jobs/remote"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Globe className="h-3.5 w-3.5" /> All Remote
              </Link>
              {REMOTE_CATEGORIES.map(({ slug, label }) => (
                <Link key={slug} href={`/jobs/remote/${slug}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    slug === catSlug
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}>
                  {label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {isLoading ? "Loading…" : `${total} Remote ${catLabel} Jobs`}
                <span className="text-sm font-normal text-muted-foreground ml-2">Direct listings first</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Wifi className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">No remote {catLabel.toLowerCase()} listings yet</p>
                <p className="text-sm mt-1">Check back soon or browse all remote roles.</p>
                <div className="flex justify-center gap-3 mt-6">
                  <Button asChild variant="outline">
                    <Link href="/jobs/remote">All Remote Jobs</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/jobs?category=${encodeURIComponent(catLabel)}`}>All {catLabel} Jobs</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
                {total > 12 && (
                  <div className="mt-8 text-center">
                    <Button asChild variant="outline" size="lg">
                      <Link href={`/jobs?remote=true&category=${encodeURIComponent(catLabel)}`}>
                        View all {total} remote {catLabel.toLowerCase()} jobs <ArrowRight className="h-4 w-4 ml-2" />
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
