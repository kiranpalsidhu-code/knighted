import { useRoute, Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, ChevronRight, ArrowRight, Globe } from "lucide-react";
import { useSearchKnightedJobs } from "@workspace/api-client-react";
import { CITY_SLUGS } from "@/data/landing-pages";

const REMOTE_CITIES = [
  { slug: "london",       label: "London"       },
  { slug: "new-york",     label: "New York"      },
  { slug: "singapore",    label: "Singapore"     },
  { slug: "dubai",        label: "Dubai"         },
  { slug: "hong-kong",    label: "Hong Kong"     },
  { slug: "sydney",       label: "Sydney"        },
  { slug: "amsterdam",    label: "Amsterdam"     },
  { slug: "zurich",       label: "Zurich"        },
  { slug: "toronto",      label: "Toronto"       },
  { slug: "berlin",       label: "Berlin"        },
];

export function RemoteCityPage() {
  const [, params] = useRoute("/jobs/remote/city/:city");
  const citySlug = params?.city ?? "";
  const cityLabel = CITY_SLUGS[citySlug] ?? citySlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  useSEO({
    title: `Remote Jobs for ${cityLabel}-Based Candidates`,
    description: `Fully remote roles open to candidates based in ${cityLabel}. Direct listings, real salaries, no recruiter spam. Work from ${cityLabel} or anywhere.`,
    canonical: `/jobs/remote/city/${citySlug}`,
  });

  const { data, isLoading } = useSearchKnightedJobs({ remote: true, page: 1 });
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
          <span className="text-foreground font-medium">Based in {cityLabel}</span>
        </nav>
      </div>

      <section aria-label="City jobs overview" className="container max-w-6xl px-4 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Fully Remote</Badge>
              <Badge variant="outline" className="text-xs">{cityLabel}</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
              Remote Jobs — Based in {cityLabel}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg text-base leading-relaxed">
              Fully remote roles accessible to candidates in {cityLabel}. No relocation, no office commute — work from {cityLabel} while landing a world-class role. All listings include disclosed salaries.
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

      <main className="flex-1 container max-w-6xl px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          <aside className="md:w-52 shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Remote by City</h2>
            <nav aria-label="Browse by city" className="space-y-1">
              <Link href="/jobs/remote"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Globe className="h-3.5 w-3.5" /> All Remote
              </Link>
              {REMOTE_CITIES.map(({ slug, label }) => (
                <Link key={slug} href={`/jobs/remote/city/${slug}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    slug === citySlug
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
                {isLoading ? "Loading…" : `${total} Remote Jobs`}
                <span className="text-sm font-normal text-muted-foreground ml-2">Open to {cityLabel}-based candidates</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Wifi className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">No remote listings yet</p>
                <p className="text-sm mt-1">Check back soon or browse all remote roles.</p>
                <Button asChild className="mt-6">
                  <Link href="/jobs/remote">All Remote Jobs</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => <JobCard key={job.id} job={job} />)}
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
