import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/jobs/JobCard";
import {
  Building2, Globe, MapPin, Users, Calendar, Code2,
  Gift, AlertCircle, ArrowLeft, Briefcase,
} from "lucide-react";

type CompanyProfile = {
  companyName: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  location: string | null;
  size: string | null;
  foundedYear: number | null;
  cultureBlurb: string | null;
  techStack: string[];
  benefits: string[];
};

type CompanyPageData = {
  profile: CompanyProfile;
  listings: any[];
};

export function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CompanyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/knighted-jobs/companies/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-4xl py-10 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Company not found</h1>
            <p className="text-muted-foreground text-sm mb-6">
              This company profile doesn't exist or has been removed.
            </p>
            <Button asChild variant="outline">
              <Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-2" /> Browse Jobs</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { profile, listings } = data;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-10">
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground -ml-2 mb-6" asChild>
          <Link href="/jobs"><ArrowLeft className="h-3.5 w-3.5" /> Browse Jobs</Link>
        </Button>

        {/* Company header */}
        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <div className="flex items-start gap-6">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={`${profile.companyName} logo`}
                className="w-20 h-20 rounded-xl object-contain bg-muted shrink-0 border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                <Building2 className="h-9 w-9 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">{profile.companyName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.size && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {profile.size} employees
                  </span>
                )}
                {profile.foundedYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Founded {profile.foundedYear}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary underline underline-offset-2"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {profile.cultureBlurb && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-muted-foreground leading-relaxed">{profile.cultureBlurb}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {profile.techStack.length > 0 && (
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.techStack.map((tech) => (
                  <Badge key={tech} className="bg-primary/10 text-primary border-primary/20">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.benefits.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Gift className="h-4 w-4" /> Benefits
              </h2>
              <ul className="space-y-2">
                {profile.benefits.map((b) => (
                  <li key={b} className="text-sm text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Open roles */}
        {listings.length > 0 && (
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Open Roles ({listings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listings.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
