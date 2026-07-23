import React from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import {
  Calendar, Clock, Briefcase, Phone, Monitor, Users, HelpCircle,
  ArrowRight, FileText, KanbanSquare, Mail, Mic, Plus, Sparkles,
  ChevronRight, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type InterviewEntry = { id: string; date: string; type: string; notes?: string };

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysFromToday(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00"); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDay(dateStr: string): string {
  const diff = daysFromToday(dateStr);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function interviewTypeIcon(t: string) {
  if (t === "phone") return <Phone className="w-4 h-4" />;
  if (t === "online") return <Monitor className="w-4 h-4" />;
  if (t === "in_person") return <Users className="w-4 h-4" />;
  return <HelpCircle className="w-4 h-4" />;
}

function interviewTypeLabel(t: string): string {
  if (t === "phone") return "Phone Screen";
  if (t === "online") return "Online / Video";
  if (t === "in_person") return "In Person";
  return "Interview";
}

function greet(firstName?: string | null): string {
  const h = new Date().getHours();
  const name = firstName ? `, ${firstName}` : "";
  if (h < 12) return `Good morning${name}`;
  if (h < 17) return `Good afternoon${name}`;
  return `Good evening${name}`;
}

const QUICK_ACTIONS = [
  { icon: FileText,    label: "My Resumes",     sub: "View and edit your resumes",         href: "/resumes" },
  { icon: Mail,        label: "Cover Letters",  sub: "Generate tailored cover letters",    href: "/cover-letters" },
  { icon: Briefcase,   label: "Job Search",     sub: "Find matched jobs with AI",          href: "/jobs" },
  { icon: KanbanSquare,label: "Track Jobs",     sub: "Move applications through stages",   href: "/pipeline" },
  { icon: Mic,         label: "Interview Prep", sub: "Practice with AI mock interviews",   href: "/interview" },
];

export default function TodayPage() {
  const { user } = useUser();
  const { data: applications, isLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey() }
  });

  const today = todayStr();

  const upcomingInterviews: { company: string; role: string; appId: number; iv: InterviewEntry }[] = [];
  const upcomingDeadlines: { company: string; role: string; appId: number; deadline: string }[] = [];
  const pastInterviews: { company: string; role: string; appId: number; iv: InterviewEntry }[] = [];

  if (applications) {
    for (const app of applications as any[]) {
      const ivs: InterviewEntry[] = app.interviews || [];
      for (const iv of ivs) {
        const diff = daysFromToday(iv.date);
        if (iv.date && diff >= 0 && diff <= 14) {
          upcomingInterviews.push({ company: app.company, role: app.role, appId: app.id, iv });
        } else if (iv.date && diff < 0 && diff >= -30) {
          pastInterviews.push({ company: app.company, role: app.role, appId: app.id, iv });
        }
      }
      if (app.deadline) {
        const diff = daysFromToday(app.deadline);
        if (diff >= 0 && diff <= 14) {
          upcomingDeadlines.push({ company: app.company, role: app.role, appId: app.id, deadline: app.deadline });
        }
      }
    }
    upcomingInterviews.sort((a, b) => a.iv.date.localeCompare(b.iv.date));
    upcomingDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));
    pastInterviews.sort((a, b) => b.iv.date.localeCompare(a.iv.date));
  }

  const hasAlerts = upcomingInterviews.length > 0 || upcomingDeadlines.length > 0;

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{greet(user?.firstName)}</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Alerts section */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : hasAlerts ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coming Up</h2>

            {upcomingInterviews.map(({ company, role, appId, iv }) => {
              const diff = daysFromToday(iv.date);
              const isToday = diff === 0;
              const isTomorrow = diff === 1;
              return (
                <Link key={iv.id} href="/pipeline">
                  <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    isToday
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                      : isTomorrow
                        ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-950/50"
                        : "bg-background border-border hover:bg-muted/40"
                  }`}>
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      isToday ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                              : "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
                    }`}>
                      {interviewTypeIcon(iv.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{interviewTypeLabel(iv.type)}</span>
                        {isToday && <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded-full">TODAY</span>}
                        {isTomorrow && <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900 px-2 py-0.5 rounded-full">TOMORROW</span>}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{company} · {role}</div>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0 text-right">
                      <div className="font-medium">{formatDay(iv.date)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}

            {upcomingDeadlines.map(({ company, role, deadline }) => {
              const diff = daysFromToday(deadline);
              const urgent = diff <= 2;
              return (
                <Link key={`dl-${company}-${deadline}`} href="/pipeline">
                  <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    urgent
                      ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50"
                      : "bg-background border-border hover:bg-muted/40"
                  }`}>
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      urgent ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                             : "bg-muted text-muted-foreground"
                    }`}>
                      {urgent ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Application Deadline</span>
                        {urgent && <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded-full">SOON</span>}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{company} · {role}</div>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0 text-right">
                      <div className="font-medium">{formatDay(deadline)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : !isLoading && (applications?.length ?? 0) > 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">No upcoming interviews or deadlines in the next 2 weeks. Keep applying!</p>
          </div>
        ) : null}

        {/* Quick add */}
        <div className="flex items-center gap-3">
          <Link href="/pipeline">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Application
            </Button>
          </Link>
          <Link href="/interview">
            <Button size="sm" variant="outline" className="gap-2">
              <Mic className="w-4 h-4" /> Practice Interview
            </Button>
          </Link>
          <Link href="/jobs">
            <Button size="sm" variant="outline" className="gap-2">
              <Briefcase className="w-4 h-4" /> Search Jobs
            </Button>
          </Link>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jump To</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, sub, href }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground truncate">{sub}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pipeline snapshot */}
        {!isLoading && (applications?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Snapshot</h2>
              <Link href="/pipeline">
                <span className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Applied",   key: "Applied",     color: "bg-blue-500" },
                { label: "Screening", key: "PhoneScreen",  color: "bg-indigo-500" },
                { label: "Interview", key: "Interview",    color: "bg-violet-500" },
                { label: "Offer",     key: "Offer",        color: "bg-green-500" },
                { label: "Rejected",  key: "Rejected",     color: "bg-red-400" },
              ].map(({ label, key, color }) => {
                const count = (applications as any[]).filter((a: any) => a.status === key).length;
                return (
                  <Link key={key} href="/pipeline">
                    <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className={`text-2xl font-bold ${count > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{count}</div>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                          <div className="text-xs text-muted-foreground font-medium">{label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Interviews */}
        {!isLoading && pastInterviews.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Interviews</h2>
            <div className="space-y-2">
              {pastInterviews.map(({ company, role, iv }) => (
                <Link key={iv.id} href="/pipeline">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors cursor-pointer">
                    <div className="p-2.5 rounded-lg shrink-0 bg-muted text-muted-foreground">
                      {interviewTypeIcon(iv.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">{interviewTypeLabel(iv.type)}</div>
                      <div className="text-xs text-muted-foreground truncate">{company} · {role}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{formatDay(iv.date)}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for brand-new users */}
        {!isLoading && (applications?.length ?? 0) === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
            <KanbanSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Start tracking your job search</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first application to see upcoming interviews and deadlines here.</p>
            <Link href="/pipeline">
              <Button><Plus className="w-4 h-4 mr-2" /> Add First Application</Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
