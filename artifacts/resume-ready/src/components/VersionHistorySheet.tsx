import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { format, formatDistanceToNow } from "date-fns";
import { History, RotateCcw, Trash2, ChevronRight, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Version {
  id: number;
  title: string;
  content: string;
  label: string | null;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: number;
  currentContent: string;
  onRestore: (content: string, title: string) => void;
}

export function VersionHistorySheet({ open, onOpenChange, resumeId, currentContent, onRestore }: Props) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Version | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<Version | null>(null);
  const [labelEdit, setLabelEdit] = useState<{ id: number; value: string } | null>(null);
  const [savingLabel, setSavingLabel] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/resume-ready/resumes/${resumeId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setVersions(data);
    } catch {
      toast({ title: "Error", description: "Could not load version history.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchVersions();
      setSelected(null);
    }
  }, [open, resumeId]);

  const handleSaveLabel = async (versionId: number, label: string) => {
    setSavingLabel(true);
    try {
      const token = await getToken();
      await fetch(`/api/resume-ready/resumes/${resumeId}/versions/${versionId}/label`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      setVersions(prev => prev.map(v => v.id === versionId ? { ...v, label: label.trim() || null } : v));
      setLabelEdit(null);
    } catch {
      toast({ title: "Error", description: "Could not save label.", variant: "destructive" });
    } finally {
      setSavingLabel(false);
    }
  };

  const handleDelete = async (versionId: number) => {
    try {
      const token = await getToken();
      await fetch(`/api/resume-ready/resumes/${resumeId}/versions/${versionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setVersions(prev => prev.filter(v => v.id !== versionId));
      if (selected?.id === versionId) setSelected(null);
      toast({ title: "Version deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete version.", variant: "destructive" });
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/resume-ready/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: "Manual checkpoint" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Checkpoint saved", description: "Current version snapshotted." });
      fetchVersions();
    } catch {
      toast({ title: "Error", description: "Could not save checkpoint.", variant: "destructive" });
    }
  };

  const wordCount = (text: string) =>
    text.trim() ? text.trim().split(/\s+/).length : 0;

  const diff = selected
    ? Math.abs(wordCount(selected.content) - wordCount(currentContent))
    : 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[420px] sm:w-[520px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" /> Version History
            </SheetTitle>
            <SheetDescription>
              Auto-saved on every save. Click a version to preview, then restore it.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pt-4 pb-2 shrink-0">
            <Button variant="outline" size="sm" className="w-full" onClick={handleSaveSnapshot}>
              <Tag className="w-4 h-4 mr-2" /> Save Checkpoint Now
            </Button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6 text-center">
              <History className="w-10 h-10 opacity-30" />
              <p className="text-sm">No versions yet. Versions are saved automatically each time you save your resume.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {selected ? (
                /* ── Version Preview ─── */
                <div className="flex flex-col h-full">
                  <div className="px-6 py-3 border-b border-border flex items-center gap-2 bg-muted/20">
                    <button
                      onClick={() => setSelected(null)}
                      className="text-xs text-primary underline underline-offset-2 flex items-center gap-1"
                    >
                      ← All versions
                    </button>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(selected.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    {selected.label && (
                      <Badge variant="secondary" className="text-xs ml-auto">{selected.label}</Badge>
                    )}
                  </div>
                  <pre className="flex-1 overflow-y-auto px-6 py-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {selected.content}
                  </pre>
                  <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {wordCount(selected.content).toLocaleString()} words
                      {diff > 0 && (
                        <span className="ml-1 text-amber-600">
                          ({diff > 0 ? `${diff} word${diff !== 1 ? "s" : ""} diff` : "same"})
                        </span>
                      )}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setRestoreConfirm(selected)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Restore This Version
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Version List ─── */
                <ul className="divide-y divide-border">
                  {versions.map((v) => (
                    <li key={v.id} className="group flex items-start gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {v.label ? (
                            <span className="text-sm font-medium text-foreground">{v.label}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                            </span>
                          )}
                          {v.label && (
                            <span className="text-xs text-muted-foreground">
                              · {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(v.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          {" · "}{wordCount(v.content).toLocaleString()} words
                        </p>

                        {/* Inline label editor */}
                        {labelEdit?.id === v.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              autoFocus
                              className="h-7 text-xs"
                              value={labelEdit.value}
                              onChange={(e) => setLabelEdit({ id: v.id, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveLabel(v.id, labelEdit.value);
                                if (e.key === "Escape") setLabelEdit(null);
                              }}
                              placeholder="e.g. Before AI tailor"
                              maxLength={60}
                            />
                            <Button size="sm" className="h-7 text-xs px-2" disabled={savingLabel} onClick={() => handleSaveLabel(v.id, labelEdit.value)}>
                              {savingLabel ? "…" : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setLabelEdit(null)}>×</Button>
                          </div>
                        ) : (
                          <button
                            className="text-xs text-primary/60 hover:text-primary mt-1 flex items-center gap-1"
                            onClick={() => setLabelEdit({ id: v.id, value: v.label || "" })}
                          >
                            <Tag className="w-3 h-3" />
                            {v.label ? "Edit label" : "Add label"}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Preview this version"
                          onClick={() => setSelected(v)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete this version"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!restoreConfirm} onOpenChange={(open) => !open && setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current unsaved changes will be replaced with this version from{" "}
              {restoreConfirm && format(new Date(restoreConfirm.createdAt), "MMM d 'at' h:mm a")}.
              The current content will be auto-snapshotted first so you can get it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreConfirm) {
                  onRestore(restoreConfirm.content, restoreConfirm.title);
                  setRestoreConfirm(null);
                  setSelected(null);
                  onOpenChange(false);
                  toast({ title: "Version restored", description: "Your resume has been restored to the selected version." });
                }
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
