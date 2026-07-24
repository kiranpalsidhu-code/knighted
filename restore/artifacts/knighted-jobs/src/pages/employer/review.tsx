import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Zap, Mail, Phone, Linkedin, FileText, AlertCircle, Users, Trophy } from "lucide-react";

type Applicant = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  coverNote: string | null;
  hasResume: boolean;
  appliedAt: string;
  matchScore: number | null;
  matchSummary: string | null;
};

type ReviewData = {
  listing: { id: number; title: string; company: string };
  applications: Applicant[];
  total: number;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-xs text-muted-foreground italic">No resume provided</span>;
  }
  const color = score >= 75 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const bar = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 min-w-[160px]">
      <div className={`text-2xl font-bold font-serif ${color}`}>{score}%</div>
      <div className="flex-1">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">KI Match</div>
      </div>
    </div>
  );
}

export function EmployerReviewPage() {
  const { id } = useParams<{ id: string }>();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setError("Missing listing ID or review token.");
      setLoading(false);
      return;
    }
    fetch(`/api/knighted-jobs/listings/${id}/applications?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${r.status})`);
        }
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-3xl py-12 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground text-sm">{error ?? "Invalid review link."}</p>
          </div>
        </main>
      </div>
    );
  }

  const withScore = data.applications.filter((a) => a.matchScore !== null);
  const withoutScore = data.applications.filter((a) => a.matchScore === null);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-3xl py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-primary font-semibold uppercase tracking-wider">KI Application Review</span>
          </div>
          <h1 className="text-3xl font-serif font-bold mb-1">{data.listing.title}</h1>
          <p className="text-muted-foreground">{data.listing.company} · {data.total} applicant{data.total !== 1 ? "s" : ""}</p>
        </div>

        {data.total === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No applications yet</h2>
            <p className="text-muted-foreground text-sm">Applicants will appear here as they apply. Bookmark this page to check back.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withScore.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span>Sorted by KI Match Score — highest fit first</span>
              </div>
            )}
            {data.applications.map((app, idx) => (
              <div key={app.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{app.name}</span>
                      {withScore.length > 0 && app.matchScore !== null && idx === 0 && (
                        <Badge className="bg-primary/20 text-primary text-xs">Top Match</Badge>
                      )}
                      {app.hasResume && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileText className="h-3 w-3" /> Resume provided
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Mail className="h-3.5 w-3.5" />{app.email}
                      </a>
                      {app.phone && (
                        <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Phone className="h-3.5 w-3.5" />{app.phone}
                        </a>
                      )}
                      {app.linkedinUrl && (
                        <a href={app.linkedinUrl.startsWith("http") ? app.linkedinUrl : `https://${app.linkedinUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Linkedin className="h-3.5 w-3.5" />LinkedIn
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Applied {relativeTime(app.appliedAt)}</p>
                  </div>
                  <div className="shrink-0">
                    <ScoreBadge score={app.matchScore} />
                  </div>
                </div>

                {app.matchSummary && (
                  <div className="mt-3 bg-background rounded-lg border border-border p-3 text-sm text-muted-foreground">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">KI Assessment</span>
                    {app.matchSummary}
                  </div>
                )}

                {(app.coverNote) && (
                  <div className="mt-3">
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                      {expanded === app.id ? "Hide" : "Show"} cover note
                    </Button>
                    {expanded === app.id && app.coverNote && (
                      <div className="mt-2 bg-background rounded-lg border border-border p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                        {app.coverNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8 text-center">
          This is your private employer review page. Keep this URL confidential.
        </p>
      </main>
    </div>
  );
}
