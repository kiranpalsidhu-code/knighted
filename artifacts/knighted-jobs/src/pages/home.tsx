import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Sparkles, User, Code2, Layers, Palette,
  BarChart3, Megaphone, TrendingUp, DollarSign, Settings2,
  Users, Scale, CheckCircle2, Zap, ShieldCheck, Bell, Briefcase, Globe,
  Activity, Landmark, GraduationCap, HandHeart, Brain, Mic, Drama,
} from "lucide-react";
import {
  useGetKnightedJobStats, useListKnightedListings,
  useGetRecommendations, getGetRecommendationsQueryKey,
  useGetSeekerProfile, getGetSeekerProfileQueryKey,
} from "@workspace/api-client-react";
import { JobCard } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { name: "Finance",        icon: DollarSign },
  { name: "Consulting",     icon: Briefcase  },
  { name: "Legal",          icon: Scale      },
  { name: "Engineering",    icon: Code2      },
  { name: "Energy",         icon: Zap        },
  { name: "Operations",     icon: Settings2  },
  { name: "Healthcare",     icon: Activity   },
  { name: "Public Sector",  icon: Landmark   },
  { name: "Academia",       icon: GraduationCap },
  { name: "Data & AI",      icon: BarChart3  },
  { name: "Product",        icon: Layers     },
  { name: "Marketing",      icon: Megaphone  },
  { name: "Sales",          icon: TrendingUp },
  { name: "Design",         icon: Palette    },
  { name: "Social Work",    icon: HandHeart  },
  { name: "Psychology",     icon: Brain      },
  { name: "Communications", icon: Mic        },
  { name: "Arts & Culture", icon: Drama      },
  { name: "People & HR",    icon: Users      },
];

const TRENDING_FALLBACK = [
  "Investment Banking", "ESG Analyst", "M&A Associate", "Carbon Trader",
  "Corporate Lawyer", "Strategy Consultant", "Petroleum Engineer", "Portfolio Manager",
];

const DIFFERENTIATORS = [
  {
    icon: Globe,
    title: "Global coverage, niche depth.",
    body: "London, New York, Toronto, Singapore, Sydney, Dubai, Hong Kong — every major financial centre, curated to the depth that matters. Not a firehose of spam.",
  },
  {
    icon: DollarSign,
    title: "Salary always front and centre.",
    body: "Every listing shows a salary range. Filter to salary-only in one click. No more wasting time on roles that ghost you at the offer stage.",
  },
  {
    icon: Zap,
    title: "Tailor your resume with AI — per listing.",
    body: "Every job card connects directly to Knighted Resume. One click pre-loads the job description into KI, which rewrites your resume to match in under 60 seconds.",
  },
];

const VS_TABLE = [
  ["Recruiter spam & anonymous listings", "No — employer-quality only",  "Common"],
  ["Salary always shown",               "Yes — every listing",         "Optional, ~40%"],
  ["Global financial centre coverage",  "London · NY · SG · Sydney · Dubai · HK", "Yes, but buried in noise"],
  ["AI resume tailoring per listing",   "One-click, built-in",         "Not available"],
  ["Direct apply links",                "Yes — careers page or source", "Often recruiter ATS"],
  ["Application pipeline tracker",      "Built-in (free)",             "Not available"],
];

export function Home() {
  useSEO({
    title: "Find Jobs — Direct Listings, Real Salaries",
    description: "Browse 500+ finance, consulting, legal, and engineering jobs with disclosed salaries. AI resume tailoring with Knight Intelligence. No ads, no recruiter spam.",
    canonical: "/",
  });

  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locSuggestions, setLocSuggestions] = useState<string[]>([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowLocDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (locationQuery.length < 2) { setLocSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/knighted-jobs/location-suggestions?q=${encodeURIComponent(locationQuery)}`)
        .then(r => r.json())
        .then(d => { setLocSuggestions(d.suggestions || []); setShowLocDropdown(d.suggestions?.length > 0); })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [locationQuery]);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertQuery, setAlertQuery] = useState("");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertDone, setAlertDone] = useState(false);
  const { isSignedIn } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useGetKnightedJobStats();
  const { data: listingsData, isLoading: listingsLoading } = useListKnightedListings({ limit: 6 });
  const { data: profile } = useGetSeekerProfile({ query: { queryKey: getGetSeekerProfileQueryKey(), enabled: !!isSignedIn } });
  const { data: recsData, isLoading: recsLoading } = useGetRecommendations({
    query: { queryKey: getGetRecommendationsQueryKey(), enabled: !!isSignedIn },
  });

  const hasProfile = !!(profile?.jobTitle || profile?.skills);
  const recs = recsData?.listings ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (locationQuery) params.append("location", locationQuery);
    setLocation(`/jobs?${params.toString()}`);
  };

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail || !alertEmail.includes("@")) return;
    setAlertSubmitting(true);
    try {
      const res = await fetch("/api/knighted-jobs/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail, query: alertQuery, remoteOnly: false }),
      });
      if (!res.ok) throw new Error("Failed");
      setAlertDone(true);
      toast({ title: "Alert created!", description: "We'll email you when matching roles are posted." });
    } catch {
      toast({ title: "Error", description: "Could not create alert. Try again.", variant: "destructive" });
    } finally {
      setAlertSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Knighted Jobs",
          "url": "https://theknightedjobs.com/knighted-jobs/",
          "description": "Direct job listings, real salary data, and AI resume tailoring for ambitious professionals.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://theknightedjobs.com/knighted-jobs/jobs?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }) }}
      />
      <Navbar />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
          <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Now with KI Match Score on every listing
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-6 text-foreground">
              Find your next move.<br /><span className="text-primary">Land the role.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Curated listings, real salary data, and AI resume tailoring — all in one place. No ads. No noise.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto bg-card p-3 rounded-xl border border-border shadow-lg mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, keywords, or company"
                  aria-label="Job title, keywords, or company"
                  className="pl-10 border-0 bg-transparent focus-visible:ring-0 shadow-none text-base h-12" />
              </div>
              <div className="w-px bg-border hidden sm:block mx-2" />
              <div className="relative flex-1 border-t sm:border-t-0 border-border pt-3 sm:pt-0" ref={locRef}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground sm:mt-0 mt-1.5 z-10" />
                <Input value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  onFocus={() => locSuggestions.length > 0 && setShowLocDropdown(true)}
                  placeholder="City, state, or remote"
                  aria-label="City, state, or remote"
                  className="pl-10 border-0 bg-transparent focus-visible:ring-0 shadow-none text-base h-12" />
                {showLocDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {locSuggestions.map(s => (
                      <button key={s} type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                        onMouseDown={e => { e.preventDefault(); setLocationQuery(s); setShowLocDropdown(false); }}>
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 text-base font-medium mt-3 sm:mt-0 w-full sm:w-auto">
                Search Roles
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-1">Trending:</span>
              {(stats?.topCategories?.length
                ? stats.topCategories.slice(0, 8).map(c => c.name)
                : TRENDING_FALLBACK
              ).map(t => (
                <button key={t} onClick={() => setLocation(`/jobs?q=${encodeURIComponent(t)}`)}
                  className="text-xs border border-border rounded-full px-3 py-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-card">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Strip ── */}
        <section className="py-10 bg-card border-b border-border/50">
          <div className="container max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-8 w-20 mx-auto" />
                    <Skeleton className="h-4 w-28 mx-auto" />
                  </div>
                ))
              ) : (
                <>
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {stats?.totalJobs?.toLocaleString() ?? "500+"}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct-Posted Roles</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {stats?.totalCompanies?.toLocaleString() ?? "250+"}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hiring Companies</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stats?.totalDirectListings?.toLocaleString() ?? "120+"}
                    </div>
                    <div className="text-xs font-medium text-primary uppercase tracking-wider">Direct Listings</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">100%</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ad-Free Results</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Browse by Category ── */}
        <section className="py-20 bg-background border-b border-border/50">
          <div className="container max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold mb-3">Browse by category</h2>
              <p className="text-muted-foreground">Find roles that match your skillset across every function.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const realCount = stats?.topCategories?.find((c: any) => c.name === cat.name)?.count;
                const countLabel = realCount ? `${realCount.toLocaleString()}+` : null;
                return (
                  <button key={cat.name} onClick={() => setLocation(`/jobs?category=${encodeURIComponent(cat.name)}`)}
                    className="group flex flex-col items-center gap-3 bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all text-center">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-tight">{cat.name}</p>
                      {statsLoading
                        ? <div className="h-3 w-12 bg-muted rounded animate-pulse mt-1 mx-auto" />
                        : countLabel
                          ? <p className="text-xs text-muted-foreground mt-0.5">{countLabel} jobs</p>
                          : <p className="text-xs text-muted-foreground mt-0.5">Hiring now</p>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Why KnightedJobs ── */}
        <section className="py-20 bg-card/50 border-b border-border/50">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Why KnightedJobs</Badge>
              <h2 className="text-3xl font-serif font-bold mb-3">Built for candidates, not advertisers.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Every decision we make puts job seekers first. Here's what that looks like in practice.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {DIFFERENTIATORS.map(d => {
                const Icon = d.icon;
                return (
                  <div key={d.title} className="bg-card border border-border rounded-xl p-7">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 leading-tight">{d.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
                  </div>
                );
              })}
            </div>

            {/* vs Indeed comparison table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 text-sm font-semibold border-b border-border bg-muted/30">
                <div className="px-6 py-4 text-muted-foreground">Feature</div>
                <div className="px-6 py-4 text-primary border-x border-border">KnightedJobs ✦</div>
                <div className="px-6 py-4 text-muted-foreground">Indeed</div>
              </div>
              {VS_TABLE.map(([feat, us, them]) => (
                <div key={feat} className="grid grid-cols-3 text-sm border-b border-border last:border-0">
                  <div className="px-6 py-3.5 text-muted-foreground">{feat}</div>
                  <div className="px-6 py-3.5 border-x border-border flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span className="text-foreground font-medium">{us}</span>
                  </div>
                  <div className="px-6 py-3.5 text-muted-foreground/70">{them}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personalised Recommendations (signed-in) ── */}
        {isSignedIn && (
          <section className="py-20 bg-background border-b border-border/50">
            <div className="container max-w-6xl">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">Matched for You</span>
                  </div>
                  <h2 className="text-3xl font-serif font-bold mb-2">Roles that fit your profile</h2>
                  <p className="text-muted-foreground">
                    {hasProfile ? "Based on your skills and job title." : "Set your profile to get personalised matches."}
                  </p>
                </div>
                {!hasProfile && (
                  <Button variant="outline" asChild className="hidden sm:flex border-primary/30 text-primary hover:bg-primary/10">
                    <Link href="/profile"><User className="h-4 w-4 mr-2" />Set Up Profile</Link>
                  </Button>
                )}
              </div>
              {recsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl bg-card border border-border" />)}
                </div>
              ) : recs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recs.map(listing => <JobCard key={listing.id} job={listing} />)}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <User className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="text-lg font-medium mb-2">No listings matched yet</h3>
                  <p className="text-muted-foreground mb-4 text-sm">Set up your profile so we can match you to the right roles.</p>
                  <Button asChild variant="outline" className="border-primary/30 text-primary">
                    <Link href="/profile">Set Up Profile</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Featured Direct Listings ── */}
        <section className="py-20 bg-card/30 border-b border-border/50">
          <div className="container max-w-6xl">
            <div className="flex justify-between items-end mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">Direct from Employers</span>
                </div>
                <h2 className="text-3xl font-serif font-bold mb-2">Featured Roles</h2>
                <p className="text-muted-foreground">Hand-posted by employers — no recruiters, no middlemen.</p>
              </div>
              <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link href="/jobs">View All →</Link>
              </Button>
            </div>
            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl bg-card border border-border" />)}
              </div>
            ) : listingsData && listingsData.listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listingsData.listings.slice(0, 6).map(listing => <JobCard key={listing.id} job={listing} />)}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Be the first employer here</h3>
                <p className="text-muted-foreground mb-6">Post a direct listing and reach qualified, motivated candidates.</p>
                <Button asChild><Link href="/post-a-job">Post a Job</Link></Button>
              </div>
            )}
            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" className="w-full" asChild><Link href="/jobs">View All Roles</Link></Button>
            </div>
          </div>
        </section>

        {/* ── Email Alerts CTA ── */}
        <section className="py-20 bg-background border-b border-border/50">
          <div className="container max-w-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Bell className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-3">Never miss the right role.</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Set up a job alert and we'll email you the moment matching roles are posted — no spam, unsubscribe any time.
            </p>
            {alertDone ? (
              <div className="flex items-center justify-center gap-2 text-green-500 font-medium">
                <CheckCircle2 className="h-5 w-5" /> Alert created — check your inbox!
              </div>
            ) : (
              <form onSubmit={handleAlertSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <Input placeholder="Job title or keyword (e.g. React Engineer)" value={alertQuery}
                  onChange={e => setAlertQuery(e.target.value)} className="flex-1 h-12" />
                <Input placeholder="Your email" value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)} type="email" required className="flex-1 h-12" />
                <Button type="submit" disabled={alertSubmitting} className="h-12 px-6 shrink-0">
                  {alertSubmitting ? "Setting up…" : "Get Alerts"}
                </Button>
              </form>
            )}
          </div>
        </section>

        {/* ── Knighted Resume Cross-promo ── */}
        <section className="border-t border-border/50 py-16 px-4 bg-card/30">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              ✦ Companion Product
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
              Found your role? Tailor your resume for it in 60 seconds.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-7">
              Knighted Resume uses AI to match your resume to the job description — stronger bullets, ATS keywords, and a tailored cover letter included.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild><a href="/">Tailor Your Resume Free →</a></Button>
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <a href="/pricing">View Pricing</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
