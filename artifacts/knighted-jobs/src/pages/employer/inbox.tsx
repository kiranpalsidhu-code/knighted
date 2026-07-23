import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Mail, Phone, Linkedin, FileText, ChevronDown, ChevronUp,
  AlertCircle, Inbox, Zap, Clock, ArrowLeft,
} from "lucide-react";

type Application = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  coverNote: string | null;
  hasResume: boolean;
  appliedAt: string;
};

type ListingGroup = {
  id: number;
  title: string;
  company: string;
  reviewUrl: string | null;
  applications: Application[];
};

type InboxData = {
  listings: ListingGroup[];
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

function ApplicantRow({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">{app.name}</span>
            {app.hasResume && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1 px-1.5 py-0">
                <FileText className="h-2.5 w-2.5" /> Resume
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {app.email}
            </span>
            {app.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {app.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(app.appliedAt)}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-muted/10">
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`mailto:${app.email}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
            >
              <Mail className="h-3.5 w-3.5" /> {app.email}
            </a>
            {app.linkedinUrl && (
              <a
                href={app.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
              >
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn Profile
              </a>
            )}
          </div>
          {app.coverNote && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Cover Note</p>
              <p className="text-sm text-foreground leading-relaxed bg-card border border-border rounded-lg p-3">
                {app.coverNote}
              </p>
            </div>
          )}
          {!app.coverNote && !app.hasResume && (
            <p className="text-xs text-muted-foreground italic">No cover note or resume provided.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ListingSection({ group }: { group: ListingGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <span className="font-semibold text-foreground truncate block">{group.title}</span>
            <span className="text-xs text-muted-foreground">{group.company}</span>
          </div>
          <Badge className="bg-primary/10 text-primary shrink-0">
            <Users className="h-3 w-3 mr-1" />
            {group.applications.length} applicant{group.applications.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {group.reviewUrl && group.applications.length > 0 && (
            <a
              href={group.reviewUrl}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-2.5 py-1 text-foreground hover:bg-muted transition-colors"
            >
              <Zap className="h-3 w-3 text-yellow-400" />
              AI Score All
            </a>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && group.applications.length > 0 && (
        <div className="border-t border-border/40">
          {group.applications.map((app) => (
            <ApplicantRow key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EmployerInboxPage() {
  const { getToken, isSignedIn } = useAuth();
  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    const token = await getToken();
    const r = await fetch("/api/knighted-jobs/employer/inbox", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error("Failed to load inbox");
    return r.json() as Promise<InboxData>;
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchInbox()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isSignedIn, fetchInbox]);

  if (!isSignedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Sign in required</h1>
            <p className="text-muted-foreground text-sm">Please sign in to access your applicant inbox.</p>
          </div>
        </main>
      </div>
    );
  }

  const totalApplicants = data?.total ?? 0;
  const listingsWithApps = data?.listings.filter((l) => l.applications.length > 0) ?? [];
  const listingsWithoutApps = data?.listings.filter((l) => l.applications.length === 0) ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground -ml-2" asChild>
                <Link href="/employer/dashboard"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</Link>
              </Button>
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
              <Inbox className="h-7 w-7 text-primary" />
              Applicant Inbox
            </h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading…" : `${totalApplicants} total application${totalApplicants !== 1 ? "s" : ""} across ${data?.listings.length ?? 0} listing${(data?.listings.length ?? 0) !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : !data || data.listings.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No applications yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Applications from job seekers will appear here once your listings receive responses.
            </p>
            <Button asChild>
              <Link href="/post-a-job">Post a Job</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {listingsWithApps.map((group) => (
              <ListingSection key={group.id} group={group} />
            ))}

            {listingsWithoutApps.length > 0 && (
              <div className="mt-8">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                  Listings with no applications yet
                </p>
                <div className="space-y-2">
                  {listingsWithoutApps.map((group) => (
                    <div key={group.id} className="bg-card/50 border border-border/40 rounded-xl px-5 py-3 flex items-center justify-between opacity-60">
                      <div>
                        <span className="text-sm font-medium">{group.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">{group.company}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">No applicants</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
