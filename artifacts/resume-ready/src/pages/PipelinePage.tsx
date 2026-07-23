import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListApplications,
  getListApplicationsQueryKey,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Building2, Briefcase, Trash2, Edit2, GripVertical, ExternalLink,
  Link2, DollarSign, User, Calendar, Clock, Phone, Monitor, Users, HelpCircle,
  PlusCircle, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = [
  { value: "Applied",     label: "Applied" },
  { value: "PhoneScreen", label: "Screening" },
  { value: "Interview",   label: "Interview" },
  { value: "Offer",       label: "Offer" },
  { value: "Rejected",    label: "Rejected" },
];

type InterviewType = "phone" | "in_person" | "online" | "other";

type InterviewEntry = {
  id: string;
  date: string;
  type: InterviewType;
  notes?: string;
};

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "phone",     label: "Phone Screen" },
  { value: "online",    label: "Online / Video" },
  { value: "in_person", label: "In Person" },
  { value: "other",     label: "Other" },
];

function interviewTypeLabel(t: string): string {
  return INTERVIEW_TYPES.find(x => x.value === t)?.label ?? t;
}

function interviewTypeIcon(t: string) {
  if (t === "phone")     return <Phone className="w-3 h-3" />;
  if (t === "online")    return <Monitor className="w-3 h-3" />;
  if (t === "in_person") return <Users className="w-3 h-3" />;
  return <HelpCircle className="w-3 h-3" />;
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

type AppFields = {
  id: number;
  company: string;
  role: string;
  status: string;
  url: string;
  notes: string;
  salary: string;
  recruiterName: string;
  recruiterEmail: string;
  deadline: string;
  appliedDate: string;
  interviews: InterviewEntry[];
};

function blankFields(): Omit<AppFields, "id"> {
  return {
    company: "", role: "", url: "", notes: "",
    salary: "", recruiterName: "", recruiterEmail: "",
    deadline: "", appliedDate: "", interviews: [], status: "Applied",
  };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

function isUpcoming(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isPast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso + "T00:00:00") < new Date();
}

function nextInterview(interviews: InterviewEntry[] | null | undefined): InterviewEntry | null {
  if (!interviews || interviews.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = interviews
    .filter(i => i.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? [...interviews].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

// ─── Interview row editor ────────────────────────────────────────────────────
function InterviewRow({
  entry,
  index,
  onChange,
  onRemove,
}: {
  entry: InterviewEntry;
  index: number;
  onChange: (patch: Partial<InterviewEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-start bg-muted/40 border border-border rounded-lg p-3">
      <div className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={entry.type} onValueChange={(v) => onChange({ type: v as InterviewType })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            className="h-8 text-sm"
            value={entry.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Notes <span className="text-muted-foreground/60">(optional)</span></Label>
          <Input
            className="h-8 text-sm"
            placeholder="e.g. Hiring manager, loop, system design…"
            value={entry.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive rounded mt-0.5"
        title="Remove interview"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Application form fields (shared between add/edit) ───────────────────────
function AppForm({
  fields,
  patch,
  showStatus = false,
}: {
  fields: Omit<AppFields, "id">;
  patch: (p: Partial<Omit<AppFields, "id">>) => void;
  showStatus?: boolean;
}) {
  const patchInterview = (index: number, p: Partial<InterviewEntry>) => {
    const updated = fields.interviews.map((iv, i) => i === index ? { ...iv, ...p } : iv);
    patch({ interviews: updated });
  };
  const addInterview = () => {
    patch({ interviews: [...fields.interviews, { id: uid(), date: "", type: "phone", notes: "" }] });
  };
  const removeInterview = (index: number) => {
    patch({ interviews: fields.interviews.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-5 py-4">
      {/* Company + Role */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Company</Label>
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Acme Corp" value={fields.company} onChange={(e) => patch({ company: e.target.value })} autoFocus />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <div className="relative">
            <Briefcase className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Senior Engineer" value={fields.role} onChange={(e) => patch({ role: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Status (edit only) */}
      {showStatus && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={(fields as any).status || ""} onValueChange={(v) => patch({ status: v } as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLUMNS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date Applied + Deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Date Applied <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" type="date" value={fields.appliedDate} onChange={(e) => patch({ appliedDate: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Application Deadline <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" type="date" value={fields.deadline} onChange={(e) => patch({ deadline: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Salary */}
      <div className="space-y-1.5">
        <Label>Salary Range <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <div className="relative">
          <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="e.g. $120k–$150k or $85/hr" value={fields.salary} onChange={(e) => patch({ salary: e.target.value })} />
        </div>
      </div>

      {/* Recruiter */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Recruiter Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Jane Smith" value={fields.recruiterName} onChange={(e) => patch({ recruiterName: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Recruiter Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input type="email" placeholder="jane@company.com" value={fields.recruiterEmail} onChange={(e) => patch({ recruiterEmail: e.target.value })} />
        </div>
      </div>

      {/* ── Interviews ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Interviews <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={addInterview}>
            <PlusCircle className="w-3.5 h-3.5" /> Add Interview
          </Button>
        </div>
        {fields.interviews.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">No interviews recorded yet. Click "Add Interview" to log one.</p>
        )}
        <div className="space-y-2">
          {fields.interviews.map((iv, i) => (
            <InterviewRow
              key={iv.id}
              entry={iv}
              index={i}
              onChange={(p) => patchInterview(i, p)}
              onRemove={() => removeInterview(i)}
            />
          ))}
        </div>
      </div>

      {/* URL */}
      <div className="space-y-1.5">
        <Label>Job Posting URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <div className="relative">
          <ExternalLink className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" type="url" placeholder="https://..." value={fields.url} onChange={(e) => patch({ url: e.target.value })} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea placeholder="Anything worth remembering about this role…" rows={3} className="resize-none" value={fields.notes} onChange={(e) => patch({ notes: e.target.value })} />
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey() }
  });

  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFields, setNewFields] = useState(blankFields());
  const [editingApp, setEditingApp] = useState<AppFields | null>(null);

  const patchNew = (patch: Partial<typeof newFields>) => setNewFields(prev => ({ ...prev, ...patch }));
  const patchEdit = (patch: Partial<AppFields>) => setEditingApp(prev => prev ? { ...prev, ...patch } : null);

  // Pre-fill from Chrome extension URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ext_add") === "1") {
      const title   = params.get("ext_title")   || "";
      const company = params.get("ext_company") || "";
      const url     = params.get("ext_url")     || "";
      if (title || company) {
        setNewFields(prev => ({ ...prev, role: title, company, url }));
        setIsAddOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const buildPayload = (fields: Omit<AppFields, "id">) => ({
    company: fields.company,
    role: fields.role,
    status: (fields as any).status,
    url: fields.url.trim() || undefined,
    notes: fields.notes.trim() || undefined,
    salary: fields.salary.trim() || undefined,
    recruiterName: fields.recruiterName.trim() || undefined,
    recruiterEmail: fields.recruiterEmail.trim() || undefined,
    deadline: fields.deadline || undefined,
    appliedDate: fields.appliedDate || undefined,
    interviews: fields.interviews.length > 0 ? fields.interviews : undefined,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFields.company.trim() || !newFields.role.trim()) return;
    createApplication.mutate(
      { data: buildPayload({ ...newFields, status: "Applied" }) as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          setIsAddOpen(false);
          setNewFields(blankFields());
          toast({ title: "Application added", description: "Successfully added to your pipeline." });
        },
        onError: () => toast({ title: "Error", description: "Failed to add application.", variant: "destructive" }),
      }
    );
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editingApp.company.trim() || !editingApp.role.trim()) return;
    updateApplication.mutate(
      { id: editingApp.id, data: buildPayload(editingApp) as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          setEditingApp(null);
          toast({ title: "Application updated" });
        },
        onError: () => toast({ title: "Error", description: "Failed to update application.", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteApplication.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          setEditingApp(null);
          toast({ title: "Application deleted" });
        },
        onError: () => toast({ title: "Error", description: "Failed to delete application.", variant: "destructive" }),
      }
    );
  };

  const moveApp = (id: number, direction: "prev" | "next") => {
    const app = applications?.find((a) => a.id === id);
    if (!app) return;
    const colIdx = COLUMNS.findIndex((c) => c.value === app.status);
    const targetIdx = direction === "next" ? colIdx + 1 : colIdx - 1;
    if (targetIdx < 0 || targetIdx >= COLUMNS.length) return;
    const targetStatus = COLUMNS[targetIdx].value;
    queryClient.setQueryData(getListApplicationsQueryKey(), (old: any) =>
      old ? old.map((a: any) => a.id === id ? { ...a, status: targetStatus } : a) : old
    );
    updateApplication.mutate(
      { id, data: { status: targetStatus } },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          toast({ title: "Error", description: "Failed to move application.", variant: "destructive" });
        },
      }
    );
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("applicationId", id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("applicationId"));
    if (!id) return;
    const app = applications?.find(a => a.id === id);
    if (!app || app.status === targetStatus) return;
    queryClient.setQueryData(getListApplicationsQueryKey(), (old: any) =>
      old ? old.map((a: any) => a.id === id ? { ...a, status: targetStatus } : a) : old
    );
    updateApplication.mutate(
      { id, data: { status: targetStatus } },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          toast({ title: "Error", description: "Failed to move application.", variant: "destructive" });
        }
      }
    );
  };

  const openEdit = (app: any) => setEditingApp({
    id: app.id,
    company: app.company,
    role: app.role,
    status: app.status,
    url: app.url || "",
    notes: app.notes || "",
    salary: app.salary || "",
    recruiterName: app.recruiterName || "",
    recruiterEmail: app.recruiterEmail || "",
    deadline: app.deadline || "",
    appliedDate: app.appliedDate || "",
    interviews: (app.interviews as InterviewEntry[]) || [],
  });

  return (
    <AppLayout>
      <div className="p-8 h-full flex flex-col min-w-max">
        <div className="flex justify-between items-center mb-8 pr-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Track Jobs</h1>
            <p className="text-muted-foreground">Track your job applications from applied to offer.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-application">
            <Plus className="w-4 h-4 mr-2" /> Add Application
          </Button>
        </div>

        {/* Analytics strip */}
        {applications && applications.length > 0 && (() => {
          const total = applications.length;
          const interviewed = applications.filter(a => ["PhoneScreen","Interview","Offer"].includes(a.status)).length;
          const offers = applications.filter(a => a.status === "Offer").length;
          const rejected = applications.filter(a => a.status === "Rejected").length;
          const interviewRate = total > 0 ? Math.round((interviewed / total) * 100) : 0;
          return (
            <div className="flex flex-wrap gap-4 mb-6 pr-4">
              {[
                { label: "Total applications", value: String(total), sub: "" },
                { label: "Interview rate", value: `${interviewRate}%`, sub: `${interviewed} reached screening` },
                { label: "Offers", value: String(offers), sub: offers > 0 ? `${Math.round((offers/total)*100)}% offer rate` : "Keep applying" },
                { label: "Rejected", value: String(rejected), sub: rejected > 0 ? `${Math.round((rejected/total)*100)}% rejection rate` : "" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex-shrink-0 bg-background border border-border rounded-xl px-5 py-3 min-w-[130px]">
                  <p className="text-xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
                  {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          );
        })()}

        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div
              key={col.value}
              className="flex-shrink-0 w-80 bg-muted/40 rounded-xl p-4 border border-border flex flex-col h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.value)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-semibold text-sm uppercase tracking-wider">{col.label}</h2>
                <span className="bg-background text-muted-foreground text-xs py-0.5 px-2.5 rounded-full font-medium border border-border">
                  {applications?.filter(a => a.status === col.value).length || 0}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {isLoading ? (
                  <Skeleton className="h-24 w-full rounded-lg" />
                ) : applications?.filter(a => a.status === col.value).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border/60 rounded-xl text-muted-foreground/40 gap-1.5 mt-1">
                    <span className="text-xl">📭</span>
                    <span className="text-xs font-medium">No {col.label.toLowerCase()} yet</span>
                    <span className="text-[10px]">Drag a card here</span>
                  </div>
                ) : (
                  applications?.filter(a => a.status === col.value).map((app) => {
                    const a = app as any;
                    const interviews: InterviewEntry[] = a.interviews || [];
                    const next = nextInterview(interviews);
                    const nextSoon = isUpcoming(next?.date);
                    const deadlineSoon = isUpcoming(a.deadline);
                    const deadlinePast = isPast(a.deadline);
                    const displayApplied = a.appliedDate || (a.appliedAt ? a.appliedAt.split("T")[0] : null);
                    return (
                      <Card
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => openEdit(app)}
                        className="p-4 cursor-pointer hover:border-primary/50 transition-colors group relative bg-background"
                        data-testid={`card-application-${app.id}`}
                      >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          {a.url && (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-muted-foreground hover:text-primary rounded-md"
                              title="View job posting"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(app); }}
                            className="p-1 text-muted-foreground hover:text-primary rounded-md"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-start gap-2 mb-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-0.5 -ml-1 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground leading-none mb-1.5 pr-12 truncate">{app.company}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Briefcase className="w-3 h-3 mr-1.5 shrink-0" />
                              <span className="truncate">{app.role}</span>
                            </div>
                            {a.url && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1.5">
                                <Link2 className="w-3 h-3 mr-1 shrink-0" />
                                <span className="truncate">{(() => { try { return new URL(a.url).hostname; } catch { return a.url; } })()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detail chips */}
                        <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                          {/* Applied date */}
                          {displayApplied && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5">
                              <Calendar className="w-3 h-3" />{formatDate(displayApplied)}
                            </span>
                          )}
                          {/* Salary */}
                          {a.salary && (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                              <DollarSign className="w-3 h-3" />{a.salary}
                            </span>
                          )}
                          {/* Recruiter */}
                          {a.recruiterName && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                              <User className="w-3 h-3" />{a.recruiterName}
                            </span>
                          )}
                          {/* Interview count badge */}
                          {interviews.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-full px-2 py-0.5">
                              <Users className="w-3 h-3" />
                              {interviews.length} interview{interviews.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {/* Next interview chip */}
                          {next && (
                            <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border ${
                              nextSoon
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                : "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800"
                            }`}>
                              {interviewTypeIcon(next.type)}
                              {nextSoon ? "⚡ " : ""}{interviewTypeLabel(next.type)} · {formatDate(next.date)}
                            </span>
                          )}
                          {/* Deadline */}
                          {a.deadline && (
                            <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border ${
                              deadlinePast
                                ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 line-through opacity-60"
                                : deadlineSoon
                                  ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                                  : "bg-muted text-muted-foreground border-border"
                            }`}>
                              <Clock className="w-3 h-3" />
                              {deadlineSoon && !deadlinePast ? "⚠ " : ""}{formatDate(a.deadline)}
                            </span>
                          )}
                        </div>

                        {/* Stage move buttons */}
                        {(() => {
                          const colIdx = COLUMNS.findIndex((c) => c.value === app.status);
                          const prevCol = COLUMNS[colIdx - 1];
                          const nextCol = COLUMNS[colIdx + 1];
                          if (!prevCol && !nextCol) return null;
                          return (
                            <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                              <div>
                                {prevCol && (
                                  <button
                                    onClick={() => moveApp(app.id, "prev")}
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded px-2 py-0.5 transition-colors"
                                    title={`Move back to ${prevCol.label}`}
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                    {prevCol.label}
                                  </button>
                                )}
                              </div>
                              <div>
                                {nextCol && (
                                  <button
                                    onClick={() => moveApp(app.id, "next")}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded px-2 py-0.5 transition-colors"
                                    title={`Move to ${nextCol.label}`}
                                  >
                                    {nextCol.label}
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Add Dialog ─────────────────────────────────────────────── */}
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setNewFields(blankFields()); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
              <DialogDescription>Track a new job opportunity in your pipeline.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <AppForm fields={newFields} patch={patchNew} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newFields.company.trim() || !newFields.role.trim() || createApplication.isPending}>
                  {createApplication.isPending ? "Adding..." : "Add to Track Jobs"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Edit / Delete Dialog ────────────────────────────────────── */}
        <Dialog open={!!editingApp} onOpenChange={(open) => !open && setEditingApp(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Application</DialogTitle>
            </DialogHeader>
            {editingApp && (
              <form onSubmit={handleEdit}>
                <AppForm fields={editingApp} patch={patchEdit} showStatus />
                <DialogFooter className="flex justify-between items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => editingApp && handleDelete(editingApp.id)}
                    disabled={deleteApplication.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditingApp(null)}>Cancel</Button>
                    <Button type="submit" disabled={!editingApp.company.trim() || !editingApp.role.trim() || updateApplication.isPending}>
                      {updateApplication.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
