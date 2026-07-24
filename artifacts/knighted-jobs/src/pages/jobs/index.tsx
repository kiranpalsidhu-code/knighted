import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useSearchKnightedJobs } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/use-seo";
import { JobCard } from "@/components/jobs/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Briefcase, ShieldCheck, Bell, CheckCircle2, ArrowUpDown, X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SearchKnightedJobsType } from "@workspace/api-client-react";

const TITLE_SUGGESTIONS = [
  "Software Engineer","Senior Software Engineer","Staff Engineer","Principal Engineer",
  "Frontend Engineer","Backend Engineer","Full Stack Engineer","DevOps Engineer",
  "Site Reliability Engineer","Platform Engineer","Machine Learning Engineer",
  "Data Engineer","Data Scientist","Data Analyst","Analytics Engineer",
  "Product Manager","Senior Product Manager","Principal Product Manager","Group Product Manager",
  "Product Designer","UX Designer","UI Designer","Design Lead","Brand Designer",
  "Engineering Manager","VP of Engineering","CTO","Director of Engineering",
  "Investment Analyst","Investment Banking Analyst","Private Equity Associate",
  "Hedge Fund Analyst","Asset Management Associate","Quantitative Analyst",
  "Financial Analyst","Corporate Finance Manager","Treasury Analyst",
  "Management Consultant","Strategy Consultant","Business Analyst",
  "Marketing Manager","Growth Manager","Performance Marketing Manager","Brand Manager",
  "Sales Engineer","Account Executive","Account Manager","Business Development Manager",
  "HR Business Partner","Talent Acquisition Manager","People Operations Manager",
  "Operations Manager","Supply Chain Manager","Project Manager","Program Manager",
  "Lawyer","Associate","Legal Counsel","Compliance Manager","Paralegal",
  "Research Scientist","Postdoctoral Researcher","Lecturer","Professor",
  "Social Worker","Community Manager","Policy Analyst","Communications Manager",
];

const CATEGORY_PILLS = [
  { label: "All",            category: "",               remote: false },
  { label: "Finance",        category: "Finance",        remote: false },
  { label: "Consulting",     category: "Consulting",     remote: false },
  { label: "Legal",          category: "Legal",          remote: false },
  { label: "Engineering",    category: "Engineering",    remote: false },
  { label: "Energy",         category: "Energy",         remote: false },
  { label: "Operations",     category: "Operations",     remote: false },
  { label: "Healthcare",     category: "Healthcare",     remote: false },
  { label: "Public Sector",  category: "Public Sector",  remote: false },
  { label: "Academia",       category: "Academia",       remote: false },
  { label: "Data & AI",      category: "Data & AI",      remote: false },
  { label: "Product",        category: "Product",        remote: false },
  { label: "Marketing",      category: "Marketing",      remote: false },
  { label: "Sales",          category: "Sales",          remote: false },
  { label: "Design",         category: "Design",         remote: false },
  { label: "Social Work",    category: "Social Work",    remote: false },
  { label: "Psychology",     category: "Psychology",     remote: false },
  { label: "Communications", category: "Communications", remote: false },
  { label: "Arts & Culture", category: "Arts & Culture", remote: false },
  { label: "People & HR",    category: "People & HR",    remote: false },
  { label: "Remote",         category: "",               remote: true  },
];

type RecentJob = { id: number; title: string; company: string; location: string; postedAt: string };

function RecentlyViewed() {
  const [items, setItems] = useState<RecentJob[]>([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("kj_recently_viewed") ?? "[]") as RecentJob[];
      setItems(stored.slice(0, 5));
    } catch {}
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="mb-6 p-4 rounded-xl border border-border/50 bg-card/40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recently Viewed</span>
        <button onClick={() => { localStorage.removeItem("kj_recently_viewed"); setItems([]); }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors">Clear</button>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map(job => (
          <a key={job.id} href={`/knighted-jobs/jobs/${job.id}`}
            className="flex items-start justify-between gap-3 group hover:bg-muted/40 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{job.title}</p>
              <p className="text-xs text-muted-foreground truncate">{job.company} · {job.location}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function JobsIndex() {
  const searchParams = new URLSearchParams(window.location.search);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  const [locQuery, setLocQuery] = useState(searchParams.get("location") || "");
  const [locSuggestions, setLocSuggestions] = useState<string[]>([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (titleRef.current && !titleRef.current.contains(e.target as Node)) setShowTitleDropdown(false);
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowLocDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (locQuery.length < 2) { setLocSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/knighted-jobs/location-suggestions?q=${encodeURIComponent(locQuery)}`)
        .then(r => r.json())
        .then(d => { setLocSuggestions(d.suggestions || []); setShowLocDropdown(d.suggestions?.length > 0); })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [locQuery]);

  const [type, setType] = useState<SearchKnightedJobsType | "any">((searchParams.get("type") as SearchKnightedJobsType) || "any");
  const [remote, setRemote] = useState(searchParams.get("remote") === "true");
  const [salaryDisclosed, setSalaryDisclosed] = useState(searchParams.get("salaryDisclosed") === "true");
  const [seniority, setSeniority] = useState(searchParams.get("seniority") || "any");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || (searchParams.get("q") ? "relevance" : "newest"));
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") || "");
  const [minSalary, setMinSalary] = useState(searchParams.get("minSalary") || "");
  const [maxSalary, setMaxSalary] = useState(searchParams.get("maxSalary") || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const [alertEmail, setAlertEmail] = useState("");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertDone, setAlertDone] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  const [, navigate] = useLocation();
  const { toast } = useToast();

  const buildParams = (overrides: Record<string, any> = {}) => {
    const v = (k: string, fallback: any) => overrides[k] !== undefined ? overrides[k] : fallback;
    const params = new URLSearchParams();
    const qVal        = v("q", q);
    const locVal      = v("locQuery", locQuery);
    const typeVal     = v("type", type);
    const remoteVal   = v("remote", remote);
    const salaryVal   = v("salaryDisclosed", salaryDisclosed);
    const senVal      = v("seniority", seniority);
    const catVal      = v("category", category);
    const sortVal     = v("sort", sort);
    const withinVal   = v("postedWithin", postedWithin);
    const minSalVal   = v("minSalary", minSalary);
    const maxSalVal   = v("maxSalary", maxSalary);
    const pageVal     = v("page", page);
    if (qVal) params.append("q", qVal);
    if (locVal) params.append("location", locVal);
    if (typeVal && typeVal !== "any") params.append("type", typeVal);
    if (remoteVal) params.append("remote", "true");
    if (salaryVal) params.append("salaryDisclosed", "true");
    if (senVal && senVal !== "any") params.append("seniority", senVal);
    if (catVal) params.append("category", catVal);
    if (sortVal && sortVal !== "relevance") params.append("sort", sortVal);
    if (withinVal) params.append("postedWithin", withinVal);
    if (minSalVal) params.append("minSalary", minSalVal);
    if (maxSalVal) params.append("maxSalary", maxSalVal);
    if (pageVal > 1) params.append("page", pageVal.toString());
    return params;
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    navigate(`/jobs?${buildParams({ page: 1 }).toString()}`);
  };

  const handleCategoryPill = (pill: typeof CATEGORY_PILLS[0]) => {
    setCategory(pill.category);
    setQ("");
    if (pill.remote) {
      setRemote(true);
    } else {
      setRemote(false);
    }
    setPage(1);
    navigate(`/jobs?${buildParams({ category: pill.category, q: "", remote: !!pill.remote, page: 1 }).toString()}`);
  };

  useEffect(() => {
    navigate(`/jobs?${buildParams().toString()}`);
  }, [type, remote, salaryDisclosed, seniority, category, sort, postedWithin, page]);

  const effectiveQ = [q, ...selectedSkills].filter(Boolean).join(" ");

  const hasFilters = !!(effectiveQ || locQuery || type !== "any" || remote || category || postedWithin || minSalary || maxSalary);
  const locLabel = locQuery ? ` in ${locQuery}` : "";
  const qLabel   = effectiveQ ? `${effectiveQ} ` : "";
  useSEO({
    title: effectiveQ ? `${effectiveQ} Jobs${locQuery ? ` in ${locQuery}` : ""}` : locQuery ? `Jobs in ${locQuery}` : "Find Jobs",
    description: `Browse ${qLabel}jobs${locLabel}. Direct applications, real salaries, no recruiter spam. Powered by Knight Intelligence AI.`,
    canonical: "/jobs",
    noIndex: hasFilters,
  });

  const { data, isLoading, isError } = useSearchKnightedJobs({
    q: effectiveQ || undefined,
    location: locQuery || undefined,
    type: type !== "any" ? type : undefined,
    remote: remote || undefined,
    salaryDisclosed: salaryDisclosed || undefined,
    seniority: (seniority !== "any" ? seniority : undefined) as any,
    category: category || undefined,
    sort: (sort !== "relevance" ? sort : undefined) as any,
    postedWithin: postedWithin ? Number(postedWithin) : undefined,
    minSalary: minSalary ? Number(minSalary) : undefined,
    maxSalary: maxSalary ? Number(maxSalary) : undefined,
    page,
  });

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail || !alertEmail.includes("@")) return;
    setAlertSubmitting(true);
    try {
      const res = await fetch("/api/knighted-jobs/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail, query: q, remoteOnly: remote }),
      });
      if (!res.ok) throw new Error("Failed");
      setAlertDone(true);
      toast({ title: "Alert created!", description: `We'll email you when "${q || "new"}" roles are posted.` });
    } catch {
      toast({ title: "Error", description: "Could not create alert. Try again.", variant: "destructive" });
    } finally {
      setAlertSubmitting(false);
    }
  };

  const activePill = CATEGORY_PILLS.find(p =>
    p.label === "Remote" ? remote && !category : p.category === category && !remote
  ) ?? CATEGORY_PILLS[0];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      {/* ── Search Header ── */}
      <section aria-label="Job search" className="bg-card border-b border-border py-8">
        <div className="container max-w-6xl">
          <h1 className="text-3xl font-serif font-bold mb-6">Find Your Next Move</h1>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1" ref={titleRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                value={q}
                onChange={e => {
                  const v = e.target.value;
                  setQ(v);
                  if (v.length >= 1) {
                    const matches = TITLE_SUGGESTIONS.filter(t => t.toLowerCase().includes(v.toLowerCase())).slice(0, 7);
                    setTitleSuggestions(matches);
                    setShowTitleDropdown(matches.length > 0);
                  } else {
                    setShowTitleDropdown(false);
                  }
                }}
                onFocus={() => { if (titleSuggestions.length > 0) setShowTitleDropdown(true); }}
                placeholder="Job title, keywords, or company"
                aria-label="Job title, keywords, or company"
                className="pl-9 h-12 bg-background border-border"
              />
              {showTitleDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {titleSuggestions.map(s => (
                    <button key={s} type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                      onMouseDown={e => { e.preventDefault(); setQ(s); setShowTitleDropdown(false); }}>
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1" ref={locRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input value={locQuery}
                onChange={e => setLocQuery(e.target.value)}
                onFocus={() => locSuggestions.length > 0 && setShowLocDropdown(true)}
                placeholder="City, state, or remote"
                aria-label="City, state, or remote"
                className="pl-9 h-12 bg-background border-border" />
              {showLocDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {locSuggestions.map(s => (
                    <button key={s} type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                      onMouseDown={e => { e.preventDefault(); setLocQuery(s); setShowLocDropdown(false); }}>
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">Search</Button>
          </form>

          {/* Category pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORY_PILLS.map(pill => {
              const isActive = pill.label === "Remote"
                ? remote && !category
                : pill.category === activePill.category && !remote;
              return (
                <button key={pill.label} onClick={() => handleCategoryPill(pill)}
                  className={`text-xs rounded-full px-3.5 py-1.5 border font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}>
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-6xl py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* ── Filters Sidebar ── */}
          <div className="w-full md:w-60 space-y-5 flex-shrink-0">
            <div>
              <h2 className="font-semibold mb-4 text-base">Filters</h2>
              <div className="space-y-4">

                {/* Remote / Salary toggles */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="remote" checked={remote}
                    onCheckedChange={c => { setRemote(c as boolean); setPage(1); }} />
                  <Label htmlFor="remote" className="text-sm font-medium cursor-pointer">Remote Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="salary" checked={salaryDisclosed}
                    onCheckedChange={c => { setSalaryDisclosed(c as boolean); setPage(1); }} />
                  <Label htmlFor="salary" className="text-sm font-medium cursor-pointer">Salary Disclosed</Label>
                </div>

                {/* Date Posted */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Posted</Label>
                  <Select value={postedWithin || "any"} onValueChange={v => { setPostedWithin(v === "any" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-full bg-card text-sm h-9">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any time</SelectItem>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employment Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Employment Type</Label>
                  <Select value={type} onValueChange={v => { setType(v as any); setPage(1); }}>
                    <SelectTrigger className="w-full bg-card text-sm h-9">
                      <SelectValue placeholder="Any Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Experience Level</Label>
                  <Select value={seniority} onValueChange={v => { setSeniority(v); setPage(1); }}>
                    <SelectTrigger className="w-full bg-card text-sm h-9">
                      <SelectValue placeholder="Any Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Level</SelectItem>
                      <SelectItem value="entry">Graduate / Intern</SelectItem>
                      <SelectItem value="analyst">Analyst / Associate</SelectItem>
                      <SelectItem value="senior">Senior / Lead</SelectItem>
                      <SelectItem value="manager">Manager / Director</SelectItem>
                      <SelectItem value="executive">VP / C-Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Salary Range</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Min"
                      aria-label="Minimum salary"
                      value={minSalary}
                      onChange={e => setMinSalary(e.target.value.replace(/\D/g, ""))}
                      onBlur={() => setPage(1)}
                      onKeyDown={e => e.key === "Enter" && (setPage(1), handleSearch())}
                      className="h-9 text-sm bg-card"
                    />
                    <span className="text-muted-foreground text-xs shrink-0">–</span>
                    <Input
                      placeholder="Max"
                      aria-label="Maximum salary"
                      value={maxSalary}
                      onChange={e => setMaxSalary(e.target.value.replace(/\D/g, ""))}
                      onBlur={() => setPage(1)}
                      onKeyDown={e => e.key === "Enter" && (setPage(1), handleSearch())}
                      className="h-9 text-sm bg-card"
                    />
                  </div>
                  {(minSalary || maxSalary) && (
                    <button onClick={() => { setMinSalary(""); setMaxSalary(""); setPage(1); }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Clear salary filter
                    </button>
                  )}
                </div>

                {/* Skills & Tools */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Skills &amp; Tools</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Python","JavaScript","TypeScript","React","Node.js","AWS",
                      "SQL","Excel","Power BI","Tableau","Bloomberg","VBA",
                      "Docker","Kubernetes","Java","Go","R","Salesforce",
                      "SAP","CFA","Terraform","GraphQL",
                    ].map(skill => (
                      <button
                        key={skill}
                        onClick={() => {
                          setSelectedSkills(prev =>
                            prev.includes(skill)
                              ? prev.filter(s => s !== skill)
                              : [...prev, skill]
                          );
                          setPage(1);
                        }}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          selectedSkills.includes(skill)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  {selectedSkills.length > 0 && (
                    <button
                      onClick={() => { setSelectedSkills([]); setPage(1); }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Clear skills filter
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Inline alert signup */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Get job alerts</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Email me when {category ? `"${category}"` : q ? `"${q}"` : "matching"} roles are posted.
              </p>
              {alertDone ? (
                <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Alert created!
                </div>
              ) : showAlertForm ? (
                <form onSubmit={handleAlertSubmit} className="space-y-2">
                  <Input placeholder="Your email" aria-label="Email address for job alerts" value={alertEmail} onChange={e => setAlertEmail(e.target.value)}
                    type="email" required className="h-9 text-sm" />
                  <Button type="submit" size="sm" disabled={alertSubmitting} className="w-full h-9 text-xs">
                    {alertSubmitting ? "Setting up…" : "Subscribe"}
                  </Button>
                </form>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowAlertForm(true)}
                  className="w-full h-9 text-xs border-primary/30 text-primary hover:bg-primary/10">
                  Set Up Alert
                </Button>
              )}
            </div>
          </div>

          {/* ── Results Area ── */}
          <div className="flex-1">
            <RecentlyViewed />
            {(() => {
              const count = [
                remote, salaryDisclosed,
                type !== "any", seniority !== "any",
                !!category, !!postedWithin, !!minSalary, !!maxSalary,
                selectedSkills.length > 0, !!q, !!locQuery,
              ].filter(Boolean).length;
              return count > 0 ? (
                <div className="mb-3 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
                  <span className="text-sm text-primary font-medium">
                    {count} filter{count > 1 ? "s" : ""} active
                  </span>
                  <button
                    onClick={() => {
                      setQ(""); setLocQuery(""); setType("any"); setRemote(false);
                      setSalaryDisclosed(false); setSeniority("any"); setCategory("");
                      setPostedWithin(""); setMinSalary(""); setMaxSalary("");
                      setSelectedSkills([]); setPage(1);
                    }}
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear all
                  </button>
                </div>
              ) : null;
            })()}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {isLoading ? "Searching…" : `${data?.total?.toLocaleString() || 0} Results`}
                {category && <span className="text-muted-foreground font-normal ml-2">in {category}</span>}
                {q && !category && <span className="text-muted-foreground font-normal ml-2">for "{q}"</span>}
              </h2>
              <div className="flex items-center gap-2">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs bg-card border-border w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="salary_desc">Highest salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>
                    <span className="text-primary font-medium">Direct</span>{" "}first
                  </span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl bg-card" />)}
              </div>
            ) : isError ? (
              <div className="text-center py-20 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
                <p>Failed to load jobs. Please try again.</p>
              </div>
            ) : data?.jobs.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6">Try different keywords or broaden your filters.</p>
                {!alertDone && (
                  <div className="max-w-sm mx-auto">
                    <p className="text-sm text-muted-foreground mb-3">Get notified when matching roles are posted:</p>
                    <form onSubmit={handleAlertSubmit} className="flex gap-2">
                      <Input placeholder="Your email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)}
                        type="email" required className="flex-1 h-10" />
                      <Button type="submit" size="sm" disabled={alertSubmitting} className="h-10 px-4">
                        {alertSubmitting ? "…" : "Alert me"}
                      </Button>
                    </form>
                  </div>
                )}
                {alertDone && (
                  <div className="flex items-center justify-center gap-2 text-green-500 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Alert created!
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.jobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <div className="text-sm font-medium px-4">Page {page} of {data.totalPages}</div>
                <Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
