import React, { useState, useRef, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListCoverLetters, getListCoverLettersQueryKey,
  useGetCoverLetter, getGetCoverLetterQueryKey,
  useCreateCoverLetter, useUpdateCoverLetter, useDeleteCoverLetter,
  useGenerateCoverLetter,
  useListResumes, getListResumesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Mail, Plus, Search, Trash2, Edit3, Clock, Building2, FileDown,
  Sparkles, Globe, Loader2, X, ChevronDown, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/ExportDialog";
import { useAuth } from "@clerk/react";
import { cn } from "@/lib/utils";

// ── Cover letter text preview ─────────────────────────────────────────────────
function CoverLetterPreview({ content, title, jobTitle, companyName }: { content: string; title: string; jobTitle?: string; companyName?: string }) {
  const meta = [jobTitle, companyName].filter(Boolean).join(" @ ");
  const lines = content.split("\n");
  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-8 max-w-2xl mx-auto text-sm leading-relaxed font-serif">
      <div className="border-b-2 border-gray-800 pb-3 mb-5">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {meta && <p className="text-xs text-gray-500 mt-0.5">{meta}</p>}
      </div>
      <div className="space-y-0">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-3" />;
          return <p key={i} className="text-gray-800 leading-relaxed">{line}</p>;
        })}
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
async function extractFile(file: File): Promise<string> {
  const { extractTextFromFile } = await import("@/lib/pdf-utils");
  return extractTextFromFile(file);
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function CoverLettersPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { getToken } = useAuth();

  // ── sidebar state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [letterToDelete, setLetterToDelete] = useState<number | null>(null);

  // ── preview state ──────────────────────────────────────────────────────────
  const [exportLetter, setExportLetter] = useState<{ title: string; content: string; jobTitle?: string; companyName?: string } | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // ── KI panel state ─────────────────────────────────────────────────────────
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [showJobUrl, setShowJobUrl] = useState(false);
  const [isFetchingJobUrl, setIsFetchingJobUrl] = useState(false);

  // ── queries ────────────────────────────────────────────────────────────────
  const { data: letters, isLoading: listLoading } = useListCoverLetters({ query: { queryKey: getListCoverLettersQueryKey() } });
  const { data: selectedLetter, isLoading: letterLoading } = useGetCoverLetter(selectedId ?? 0, {
    query: { enabled: selectedId !== null, queryKey: getGetCoverLetterQueryKey(selectedId ?? 0) },
  });
  const { data: resumes } = useListResumes({ query: { queryKey: getListResumesQueryKey() } });

  const createLetter = useCreateCoverLetter();
  const updateLetter = useUpdateCoverLetter();
  const deleteLetter = useDeleteCoverLetter();
  const generateLetter = useGenerateCoverLetter();

  const filtered = letters?.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.companyName.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-select first letter
  useEffect(() => {
    if (!selectedId && letters && letters.length > 0) setSelectedId(letters[0].id);
  }, [letters]);

  // Sync preview when letter loads
  useEffect(() => {
    if (selectedLetter) {
      setPreviewContent(selectedLetter.content);
      setHasUnsaved(false);
    }
  }, [selectedLetter]);

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (hasUnsaved) e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createLetter.mutate({ data: { title: newTitle.trim(), jobTitle: newJobTitle.trim(), companyName: newCompany.trim(), content: "" } }, {
      onSuccess: (letter) => {
        qc.invalidateQueries({ queryKey: getListCoverLettersQueryKey() });
        setSelectedId(letter.id);
        setIsCreateOpen(false); setNewTitle(""); setNewJobTitle(""); setNewCompany("");
        setLocation(`/cover-letters/${letter.id}`);
      },
      onError: () => toast({ title: "Error", description: "Failed to create.", variant: "destructive" }),
    });
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!letterToDelete) return;
    deleteLetter.mutate({ id: letterToDelete }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCoverLettersQueryKey() });
        if (selectedId === letterToDelete) setSelectedId(null);
        setLetterToDelete(null);
        toast({ title: "Deleted" });
      },
      onError: () => { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }); setLetterToDelete(null); },
    });
  };

  // ── save changes ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedId || !selectedLetter) return;
    setIsSaving(true);
    try {
      await updateLetter.mutateAsync({ id: selectedId, data: { title: selectedLetter.title, jobTitle: selectedLetter.jobTitle, companyName: selectedLetter.companyName, content: previewContent } });
      qc.invalidateQueries({ queryKey: getGetCoverLetterQueryKey(selectedId) });
      qc.invalidateQueries({ queryKey: getListCoverLettersQueryKey() });
      setHasUnsaved(false);
      toast({ title: "Saved" });
    } catch { toast({ title: "Error", description: "Failed to save.", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  // ── KI: fetch job URL ──────────────────────────────────────────────────────
  const handleFetchJobUrl = async () => {
    if (!jobUrlInput.trim()) return;
    setIsFetchingJobUrl(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/extract-url", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ url: jobUrlInput.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setJobDescription(data.text);
      setShowJobUrl(false); setJobUrlInput("");
    } catch (err: any) { toast({ title: "Error", description: err.message || "Could not fetch URL.", variant: "destructive" }); }
    finally { setIsFetchingJobUrl(false); }
  };

  // ── KI: generate ───────────────────────────────────────────────────────────
  const handleGenerate = () => {
    const resume = resumes?.find(r => r.id === Number(selectedResumeId));
    generateLetter.mutate({
      data: {
        resumeContent: resume?.content || "",
        jobDescription,
        jobTitle: selectedLetter?.jobTitle || undefined,
        companyName: selectedLetter?.companyName || undefined,
        customInstructions: customInstructions.trim() || undefined,
        existingCoverLetter: selectedLetter?.content?.trim() ? selectedLetter.content : undefined,
      },
    }, {
      onSuccess: (result) => {
        setPreviewContent(result.content);
        setHasUnsaved(true);
        toast({ title: "Generated!", description: "Review the letter and save when ready." });
      },
      onError: () => toast({ title: "Error", description: "Generation failed.", variant: "destructive" }),
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 flex flex-col border-r border-border bg-muted/20 h-full overflow-hidden">
          {/* Sidebar header */}
          <div className="px-3 pt-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-semibold text-sm text-foreground">Cover Letters</h1>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" title="New cover letter" aria-label="New cover letter" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-8 h-7 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Letter list */}
          <div className="flex-1 overflow-y-auto py-1">
            {listLoading && [1,2,3].map(i => (
              <div key={i} className="px-3 py-2.5">
                <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            ))}
            {!listLoading && filtered?.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Mail className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{search ? "No results" : "No cover letters yet"}</p>
              </div>
            )}
            {filtered?.map(letter => (
              <button
                key={letter.id}
                onClick={() => { setSelectedId(letter.id); setHasUnsaved(false); }}
                className={cn(
                  "w-full text-left flex flex-col px-3 py-2.5 border-l-2 transition-colors group",
                  selectedId === letter.id
                    ? "border-l-primary bg-primary/5 text-foreground"
                    : "border-l-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-medium truncate leading-snug">{letter.title}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setLetterToDelete(letter.id); }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {(letter.companyName || letter.jobTitle) && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5 shrink-0" />
                    {[letter.jobTitle, letter.companyName].filter(Boolean).join(" @ ")}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {format(new Date(letter.updatedAt), "MMM d, yyyy")}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN AREA ────────────────────────────────────────────────────── */}
        {(!selectedId || (!letterLoading && !selectedLetter)) ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-muted/10">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Select a cover letter</h3>
              <p className="text-sm text-muted-foreground">Choose a cover letter from the sidebar to preview and generate with KI.</p>
            </div>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Cover Letter</Button>
          </div>
        ) : letterLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : selectedLetter ? (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden">

            {/* ── PREVIEW PANE ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border overflow-hidden">
              {/* Top bar */}
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-background">
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm truncate">{selectedLetter.title}</h2>
                  {(selectedLetter.jobTitle || selectedLetter.companyName) && (
                    <p className="text-[11px] text-muted-foreground truncate">{[selectedLetter.jobTitle, selectedLetter.companyName].filter(Boolean).join(" @ ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasUnsaved && (
                    <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {isSaving ? "Saving…" : "Save Changes"}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Export" aria-label="Export cover letter" onClick={() => setExportLetter({ title: selectedLetter.title, content: previewContent, jobTitle: selectedLetter.jobTitle ?? undefined, companyName: selectedLetter.companyName ?? undefined })}>
                    <FileDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setLocation(`/cover-letters/${selectedLetter.id}`)}>
                    <Edit3 className="w-3 h-3" /> Full editor
                  </Button>
                </div>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
                {previewContent ? (
                  <CoverLetterPreview
                    content={previewContent}
                    title={selectedLetter.title}
                    jobTitle={selectedLetter.jobTitle ?? undefined}
                    companyName={selectedLetter.companyName ?? undefined}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <Mail className="w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">This cover letter has no content yet.</p>
                    <p className="text-xs text-muted-foreground">Use the KI panel to generate one, or open the full editor.</p>
                    <Button size="sm" onClick={() => setLocation(`/cover-letters/${selectedLetter.id}`)}>Open Editor</Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── KI PANEL ─────────────────────────────────────────────── */}
            <div className="w-80 shrink-0 flex flex-col overflow-hidden bg-background">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">KI Generate</span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Resume selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Base Resume</Label>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a resume (optional)…" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes?.map(r => <SelectItem key={r.id} value={String(r.id)} className="text-xs">{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Job description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Job Description</Label>
                    <button onClick={() => setShowJobUrl(v => !v)} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                      <Globe className="w-3 h-3" /> Fetch from URL
                    </button>
                  </div>
                  {showJobUrl && (
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="https://…"
                        value={jobUrlInput}
                        onChange={e => setJobUrlInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleFetchJobUrl()}
                        className="h-7 text-xs flex-1"
                      />
                      <Button size="sm" className="h-7 px-2 text-xs shrink-0" onClick={handleFetchJobUrl} disabled={isFetchingJobUrl || !jobUrlInput.trim()}>
                        {isFetchingJobUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : "Fetch"}
                      </Button>
                    </div>
                  )}
                  <Textarea
                    placeholder="Paste the job posting here…"
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    className="text-xs resize-none min-h-[100px] max-h-40"
                    rows={5}
                  />
                  {jobDescription.trim() && (
                    <button onClick={() => setJobDescription("")} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {/* Custom instructions */}
                <div>
                  <button
                    onClick={() => setShowCustom(v => !v)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showCustom && "rotate-180")} />
                    Custom instructions
                  </button>
                  {showCustom && (
                    <Textarea
                      placeholder="e.g. Enthusiastic tone, mention remote work preference…"
                      value={customInstructions}
                      onChange={e => setCustomInstructions(e.target.value)}
                      className="mt-1.5 text-xs resize-none min-h-[60px]"
                      rows={3}
                    />
                  )}
                </div>

                {/* Existing letter notice */}
                {previewContent && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-400">
                    KI will <strong>revise</strong> the existing letter based on the job description.
                  </div>
                )}

                {/* Generate button */}
                <Button
                  className="w-full h-8 text-xs gap-2"
                  onClick={handleGenerate}
                  disabled={generateLetter.isPending}
                >
                  {generateLetter.isPending
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> {previewContent ? "Revise with KI" : "Generate with KI"}</>}
                </Button>

                {generateLetter.isPending && (
                  <p className="text-[10px] text-center text-muted-foreground">This takes about 15 seconds…</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Create dialog ─────────────────────────────────────────────────── */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Cover Letter</DialogTitle>
              <DialogDescription>Give it a name, optionally add the job title and company.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-3 py-4">
                <Input autoFocus placeholder="Title (e.g. Software Engineer at Acme)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <Input placeholder="Job Title (optional)" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} />
                <Input placeholder="Company Name (optional)" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newTitle.trim() || createLetter.isPending}>{createLetter.isPending ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Delete dialog ─────────────────────────────────────────────────── */}
        <Dialog open={!!letterToDelete} onOpenChange={open => { if (!open) setLetterToDelete(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Cover Letter</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLetterToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteLetter.isPending}>{deleteLetter.isPending ? "Deleting…" : "Delete"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Export dialog ─────────────────────────────────────────────────── */}
        <ExportDialog
          open={!!exportLetter}
          onOpenChange={open => { if (!open) setExportLetter(null); }}
          mode="cover-letter"
          title={exportLetter?.title ?? ""}
          content={exportLetter?.content ?? ""}
          jobTitle={exportLetter?.jobTitle}
          companyName={exportLetter?.companyName}
        />
      </div>
    </AppLayout>
  );
}
