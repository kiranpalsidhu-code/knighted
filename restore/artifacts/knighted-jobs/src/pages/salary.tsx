import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, DollarSign, Database, AlertCircle, Briefcase, MapPin } from "lucide-react";

const POPULAR_ROLES = [
  "Software Engineer", "Product Manager", "Data Scientist", "DevOps Engineer",
  "UX Designer", "Marketing Manager", "Sales Engineer", "Data Analyst",
];

type SalarySample = {
  title: string;
  location: string;
  min: number | null;
  max: number | null;
  midpoint: number;
  source: "direct" | "adzuna";
};

type SalaryData = {
  role: string;
  location: string | null;
  samples: SalarySample[];
  median: number | null;
  p25: number | null;
  p75: number | null;
  min: number | null;
  max: number | null;
  count: number;
  directCount: number;
  adzunaCount: number;
};

function fmt(n: number | null): string {
  if (!n) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function SalaryBar({ p25, p75, median, min, max }: { p25: number; p75: number; median: number; min: number; max: number }) {
  const range = max - min;
  if (range <= 0) return null;
  const pctP25 = ((p25 - min) / range) * 100;
  const pctP75 = ((p75 - min) / range) * 100;
  const pctMedian = ((median - min) / range) * 100;

  return (
    <div className="relative h-10 my-4">
      <div className="absolute inset-y-3 left-0 right-0 bg-muted rounded-full" />
      <div
        className="absolute inset-y-3 bg-primary/30 rounded-full"
        style={{ left: `${pctP25}%`, right: `${100 - pctP75}%` }}
      />
      <div
        className="absolute top-1 bottom-1 w-1 bg-primary rounded-full shadow-lg"
        style={{ left: `calc(${pctMedian}% - 2px)` }}
      />
    </div>
  );
}

export function SalaryExplorerPage() {
  useSEO({
    title: "Salary Explorer — Real Market Salaries for Ambitious Professionals",
    description: "Discover salary ranges for any role. Data from direct listings and live market sources. Search by job title and location to see median, 25th, and 75th percentile pay.",
    canonical: "/salary",
  });
  const [, navigate] = useLocation();
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const didAutoSearch = useRef(false);

  const search = async (r?: string, l?: string) => {
    const q = (r ?? role).trim();
    const loc = (l ?? location).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ role: q });
      if (loc) params.set("location", loc);
      const res = await fetch(`/api/knighted-jobs/salary?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch salary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!didAutoSearch.current) {
      didAutoSearch.current = true;
      search("Software Engineer");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const quickSearch = (r: string) => {
    setRole(r);
    search(r, location);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border/50 py-16 md:py-24 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <TrendingUp className="h-4 w-4" />
          Real-time salary data
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4 text-foreground">
          Salary Explorer
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Crowd-sourced salary ranges from direct job listings + live Adzuna market data.
          Know your worth before you apply.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Job title or role (e.g. Software Engineer)"
              aria-label="Job title or role"
              className="pl-9 h-12"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              aria-label="Location"
              className="pl-9 h-12"
            />
          </div>
          <Button type="submit" size="lg" className="gap-2 h-12 shrink-0" disabled={loading || !role.trim()}>
            <Search className="h-4 w-4" />
            {loading ? "Searching…" : "Explore"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 justify-center mt-6">
          {POPULAR_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => quickSearch(r)}
              className="text-xs border border-border text-muted-foreground rounded-full px-3 py-1 hover:border-primary/50 hover:text-primary transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <main className="flex-1 container max-w-4xl py-12 px-4" ref={resultRef}>
        {!hasSearched && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Database, title: "Direct Listings", desc: "Salaries from employers who post directly on Knighted Jobs — 100% verified." },
              { icon: TrendingUp, title: "Live Market Data", desc: "Augmented with Adzuna's real-time index of hundreds of thousands of jobs." },
              { icon: DollarSign, title: "P25–P75 Range", desc: "See the 25th–75th percentile band and median so you know the full picture." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 text-center">
                <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h2 className="font-semibold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-foreground">{data.role}</h2>
                  {data.location && (
                    <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {data.location}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {data.directCount > 0 && (
                    <Badge className="bg-primary/10 text-primary text-xs">
                      {data.directCount} direct listing{data.directCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {data.adzunaCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {data.adzunaCount} market listing{data.adzunaCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {data.count === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-1">No salary data found</p>
                  <p className="text-sm text-muted-foreground">Try a broader role (e.g. "Engineer" instead of a specific title) or remove the location filter.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Median", value: fmt(data.median), highlight: true },
                      { label: "25th Percentile", value: fmt(data.p25), highlight: false },
                      { label: "75th Percentile", value: fmt(data.p75), highlight: false },
                      { label: "Sample Size", value: String(data.count), highlight: false },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className={`rounded-lg p-4 text-center ${highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
                        <div className={`text-xl font-bold font-serif ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {data.p25 && data.p75 && data.median && data.min && data.max && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{fmt(data.min)}</span>
                        <span className="text-primary font-medium">Median: {fmt(data.median)}</span>
                        <span>{fmt(data.max)}</span>
                      </div>
                      <SalaryBar p25={data.p25} p75={data.p75} median={data.median} min={data.min} max={data.max} />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Min</span>
                        <span className="text-muted-foreground">← Typical range ({fmt(data.p25)} – {fmt(data.p75)}) →</span>
                        <span>Max</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Listings breakdown */}
            {data.samples.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" /> Data Points ({data.samples.length})
                </h3>
                <div className="space-y-2">
                  {data.samples.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                      <div className="flex-1 min-w-0 mr-4">
                        <span className="font-medium text-foreground truncate block">{s.title}</span>
                        <span className="text-xs text-muted-foreground">{s.location}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-foreground font-medium">
                          {s.min && s.max ? `${fmt(s.min)} – ${fmt(s.max)}` : fmt(s.min ?? s.max)}
                        </span>
                        <Badge variant={s.source === "direct" ? "default" : "secondary"} className="text-xs px-1.5">
                          {s.source === "direct" ? "Direct" : "Market"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Ready to find a <strong className="text-foreground">{data.role}</strong> role with a disclosed salary?
              </p>
              <Button
                onClick={() => navigate(`/jobs?q=${encodeURIComponent(data.role)}${data.location ? `&location=${encodeURIComponent(data.location)}` : ""}`)}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Browse {data.role} Jobs →
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
