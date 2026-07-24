import { Navbar } from "@/components/layout/Navbar";
import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { CheckCircle2, Clock, Phone, Users, Trophy, XCircle, Briefcase, ExternalLink } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Applied:     { label: "Applied",      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",   icon: CheckCircle2 },
  PhoneScreen: { label: "Phone Screen", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Phone },
  Interview:   { label: "Interview",    color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Users },
  Offer:       { label: "Offer",        color: "bg-green-500/20 text-green-400 border-green-500/30",  icon: Trophy },
  Rejected:    { label: "Rejected",     color: "bg-red-500/20 text-red-400 border-red-500/30",       icon: XCircle },
};

const PIPELINE_ORDER = ["Applied", "PhoneScreen", "Interview", "Offer", "Rejected"];

export function MyApplicationsPage() {
  const { isSignedIn } = useAuth();
  const { data, isLoading } = useListApplications({
    query: {
      queryKey: getListApplicationsQueryKey(),
      enabled: !!isSignedIn,
    },
  });

  const apps = data ?? [];
  const counts = PIPELINE_ORDER.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track every role you've applied to, all in one place.</p>
        </div>

        {/* Pipeline bar */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {PIPELINE_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <div key={status} className={`rounded-lg border p-3 text-center ${cfg.color}`}>
                <Icon className="h-5 w-5 mx-auto mb-1 opacity-80" />
                <div className="text-xl font-bold">{counts[status]}</div>
                <div className="text-xs opacity-70">{cfg.label}</div>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h2 className="text-xl font-bold mb-2">No applications yet</h2>
            <p className="text-muted-foreground mb-6">Apply to jobs on Knighted Jobs or mark external applications as applied.</p>
            <Button asChild>
              <Link href="/search">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {apps
              .slice()
              .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
              .map((app) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.Applied;
                const Icon = cfg.icon;
                return (
                  <div key={app.id} className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-foreground truncate">{app.role}</h3>
                        <Badge className={`shrink-0 text-xs border ${cfg.color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{app.company}</span>
                        {app.salary && <span>· {app.salary}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {app.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{app.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.url && (
                        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-primary">
                          <a href={app.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a href="/resume-ready" target="_blank" rel="noreferrer">Open in KI →</a>
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}
