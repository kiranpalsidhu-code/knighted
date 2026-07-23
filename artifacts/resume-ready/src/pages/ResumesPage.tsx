import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListResumes, getListResumesQueryKey,
  useGetResume, getGetResumeQueryKey,
  useCreateResume, useUpdateResume, useDeleteResume,
  useTailorResume, useGenerateCoverLetter, useCreateCoverLetter,
  useGetMyProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, Search, Trash2, Edit3, Clock, Upload, Sparkles, Share2,
  Copy, Check, Link2Off, MessageSquare, Globe, Loader2, X, CheckCircle2, XCircle,
  Lightbulb, BarChart2, FileDown, Link2, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/react";
import { ExportDialog } from "@/components/ExportDialog";
import { ResumeDiffDialog } from "@/components/ResumeDiffDialog";
import { generatePdfHtml, PDF_TEMPLATES, type TemplateId } from "@/lib/resume-pdf-templates";
import { parseResumeContent } from "@/lib/resume-parser";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── helpers ───────────────────────────────────────────────────────────────────
async function extractFile(file: File): Promise<string> {
  const { extractTextFromFile } = await import("@/lib/pdf-utils");
  return extractTextFromFile(file);
}

const PAPER_W = 816;
const PAPER_H = 1056;

function ResumeIframePreview({ html, containerW }: { html: string; containerW: number }) {
  const containerH = Math.round(containerW * PAPER_H / PAPER_W);
  const scale = containerW / PAPER_W;
  return (
    <div style={{ width: containerW, height: containerH, overflow: "hidden", flexShrink: 0 }} className="pointer-events-none select-none">
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{ width: PAPER_W, height: PAPER_H, transform: `scale(${scale})`, transformOrigin: "top left", border: "none", display: "block" }}
        title="Resume preview"
      />
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function ResumesPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { getToken } = useAuth();

  // ── sidebar state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<"paste" | "file" | "url" | "linkedin">("paste");
  const [importTitle, setImportTitle] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinPasteText, setLinkedinPasteText] = useState("");
  const [linkedinScrapeError, setLinkedinScrapeError] = useState("");
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  const [linkedinZipFile, setLinkedinZipFile] = useState<File | null>(null);
  const [isImportingLinkedInZip, setIsImportingLinkedInZip] = useState(false);
  const linkedinZipRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [resumeToDelete, setResumeToDelete] = useState<number | null>(null);

  // ── preview state ──────────────────────────────────────────────────────────
  const [previewTemplate, setPreviewTemplate] = useState<TemplateId>("classic");
  const [exportResume, setExportResume] = useState<{ title: string; content: string } | null>(null);
  const [shareResume, setShareResume] = useState<{ id: number; title: string; shareToken: string | null } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── KI panel state ─────────────────────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [showJobUrl, setShowJobUrl] = useState(false);
  const [isFetchingJobUrl, setIsFetchingJobUrl] = useState(false);
  const [kiTab, setKiTab] = useState<"tailor" | "gap">("tailor");
  const [gapResult, setGapResult] = useState<{ score: number; matchedKeywords: string[]; missingKeywords: string[]; suggestions: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diffPreview, setDiffPreview] = useState<{ before: string; after: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadQuickRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const [isJdFileLoading, setIsJdFileLoading] = useState(false);

  // ── queries ────────────────────────────────────────────────────────────────
  const { data: profile } = useGetMyProfile();
  const isPro = profile?.tier === "pro";
  const { data: resumes, isLoading: listLoading } = useListResumes({ query: { queryKey: getListResumesQueryKey() } });
  const { data: selectedResume, isLoading: resumeLoading } = useGetResume(selectedId ?? 0, {
    query: { enabled: selectedId !== null, queryKey: getGetResumeQueryKey(selectedId ?? 0) },
  });

  const createResume = useCreateResume();
  const updateResume = useUpdateResume();
  const deleteResume = useDeleteResume();
  const tailorResume = useTailorResume();
  const generateCoverLetter = useGenerateCoverLetter();
  const createCoverLetter = useCreateCoverLetter();

  const canCreate = isPro || (resumes?.length ?? 0) < 3;

  const filtered = resumes?.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  // Deep-link from KnightedJobs: ?ki=1&role=...&company=...&jd=...
  const [kiFromJobs, setKiFromJobs] = useState<{ role: string; company: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ki") === "1") {
      const jd = params.get("jd") || "";
      const role = params.get("role") || "";
      const company = params.get("company") || "";
      if (jd) setJobDescription(jd);
      if (role || company) setKiFromJobs({ role, company });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Auto-open import dialog when ?import=1 is in URL
  useEffect(() => {
    if (window.location.search.includes("import=1")) setIsImportOpen(true);
  }, []);

  // Auto-select first resume when list loads
  useEffect(() => {
    if (!selectedId && resumes && resumes.length > 0) setSelectedId(resumes[0].id);
  }, [resumes]);

  // ── preview html ───────────────────────────────────────────────────────────
  const previewHtml = useMemo(() => {
    if (!selectedResume?.content?.trim()) return "";
    try { return generatePdfHtml(previewTemplate, parseResumeContent(selectedResume.content), selectedResume.title); }
    catch { return ""; }
  }, [selectedResume, previewTemplate]);

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!canCreate) {
      toast({ title: "Limit reached", description: "Upgrade to Pro to create more resumes.", variant: "destructive" });
      return;
    }
    createResume.mutate({ data: { title: newTitle.trim(), content: "" } }, {
      onSuccess: (r) => { qc.invalidateQueries({ queryKey: getListResumesQueryKey() }); setSelectedId(r.id); setIsCreateOpen(false); setNewTitle(""); setLocation(`/resumes/${r.id}`); },
      onError: () => toast({ title: "Error", description: "Failed to create resume.", variant: "destructive" }),
    });
  };

  // ── quick upload ───────────────────────────────────────────────────────────
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!canCreate) { toast({ title: "Limit reached", description: "Upgrade to Pro to upload more resumes.", variant: "destructive" }); return; }
    try {
      const text = await extractFile(file);
      const title = file.name.replace(/\.[^.]+$/, "");
      createResume.mutate({ data: { title, content: text } }, {
        onSuccess: (r) => { qc.invalidateQueries({ queryKey: getListResumesQueryKey() }); setSelectedId(r.id); toast({ title: "Uploaded", description: "Resume uploaded. You can now tailor it with KI." }); },
        onError: () => toast({ title: "Error", description: "Failed to save resume.", variant: "destructive" }),
      });
    } catch { toast({ title: "Error", description: "Could not read file.", variant: "destructive" }); }
  };

  // ── import dialog ──────────────────────────────────────────────────────────
  const closeImport = () => { setIsImportOpen(false); setImportTitle(""); setImportContent(""); setImportTab("paste"); setSelectedFileName(""); setImportUrl(""); setLinkedinUrl(""); setLinkedinPasteText(""); setLinkedinScrapeError(""); setLinkedinZipFile(null); };
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setIsParsingFile(true);
    try { const t = await extractFile(file); setImportContent(t); setSelectedFileName(file.name); if (!importTitle) setImportTitle(file.name.replace(/\.[^.]+$/, "")); }
    catch { toast({ title: "Error", description: "Could not read file.", variant: "destructive" }); }
    finally { setIsParsingFile(false); }
  };
  const handleFetchUrl = async () => {
    if (!importUrl.trim()) return;
    setIsFetchingUrl(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/extract-url", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ url: importUrl.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setImportContent(data.text);
      if (!importTitle) setImportTitle("Imported Resume");
    } catch (err: any) { toast({ title: "Error", description: err.message || "Could not fetch URL.", variant: "destructive" }); }
    finally { setIsFetchingUrl(false); }
  };
  const handleLinkedInImport = async (source: "url" | "paste") => {
    setIsImportingLinkedIn(true); setLinkedinScrapeError("");
    try {
      const token = await getToken();
      let text = source === "paste" ? linkedinPasteText.trim() : "";
      if (source === "url") {
        const res = await fetch("/api/resume-ready/extract-url", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ url: linkedinUrl.trim() }) });
        const data = await res.json();
        if (!res.ok) { setLinkedinScrapeError("LinkedIn blocked automatic access. Copy your profile text below instead."); return; }
        text = data.text;
      }
      if (!text) return;
      const fmtRes = await fetch("/api/resume-ready/ai/import-profile", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ rawText: text }) });
      const fmtData = await fmtRes.json();
      if (!fmtRes.ok) throw new Error(fmtData.error || "Failed to format profile");
      setImportContent(fmtData.content);
      if (!importTitle) setImportTitle("LinkedIn Resume");
      setImportTab("paste");
    } catch { toast({ title: "Error", description: "LinkedIn import failed.", variant: "destructive" }); }
    finally { setIsImportingLinkedIn(false); }
  };

  const handleLinkedInZipImport = async () => {
    if (!linkedinZipFile) return;
    setIsImportingLinkedInZip(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("file", linkedinZipFile);
      const res = await fetch("/api/resume-ready/ai/import-linkedin-zip", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportContent(data.content);
      if (!importTitle) setImportTitle(data.suggestedTitle || "LinkedIn Resume");
      setImportTab("paste");
      toast({ title: "LinkedIn imported!", description: "Your profile has been converted into a resume. Review and save it." });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message || "Could not parse your LinkedIn export.", variant: "destructive" });
    } finally {
      setIsImportingLinkedInZip(false);
    }
  };
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importContent.trim()) return;
    if (!canCreate) { toast({ title: "Limit reached", description: "Upgrade to Pro.", variant: "destructive" }); return; }
    createResume.mutate({ data: { title: importTitle.trim(), content: importContent.trim() } }, {
      onSuccess: (r) => { qc.invalidateQueries({ queryKey: getListResumesQueryKey() }); setSelectedId(r.id); closeImport(); toast({ title: "Imported!", description: "You can now tailor it with KI." }); },
      onError: () => toast({ title: "Error", description: "Failed to import.", variant: "destructive" }),
    });
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!resumeToDelete) return;
    deleteResume.mutate({ id: resumeToDelete }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
        if (selectedId === resumeToDelete) setSelectedId(null);
        setResumeToDelete(null);
        toast({ title: "Deleted" });
      },
      onError: () => { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }); setResumeToDelete(null); },
    });
  };

  // ── share ──────────────────────────────────────────────────────────────────
  const shareUrl = shareResume?.shareToken
    ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/r/${shareResume.shareToken}`
    : null;
  const handleEnableShare = async () => {
    if (!shareResume) return; setShareLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/resume-ready/resumes/${shareResume.id}/share`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setShareResume(prev => prev ? { ...prev, shareToken: data.shareToken } : null);
      qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
    } catch { toast({ title: "Error", description: "Could not enable sharing.", variant: "destructive" }); }
    finally { setShareLoading(false); }
  };
  const handleRevokeShare = async () => {
    if (!shareResume) return; setShareLoading(true);
    try {
      const token = await getToken();
      await fetch(`/api/resume-ready/resumes/${shareResume.id}/share`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setShareResume(prev => prev ? { ...prev, shareToken: null } : null);
      qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
      toast({ title: "Link revoked" });
    } catch { toast({ title: "Error", description: "Could not revoke link.", variant: "destructive" }); }
    finally { setShareLoading(false); }
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

  // ── KI: tailor ─────────────────────────────────────────────────────────────
  const handleTailor = () => {
    if (!isPro) { toast({ title: "Pro feature", description: "KI tailoring requires Pro. Please upgrade.", variant: "destructive" }); return; }
    if (!jobDescription.trim()) { toast({ title: "Missing job description", description: "Paste the job description first." }); return; }
    if (!selectedId || !selectedResume) return;
    tailorResume.mutate({ data: { resumeId: selectedId, jobDescription, customInstructions: customInstructions.trim() || undefined } }, {
      onSuccess: (data) => setDiffPreview({ before: selectedResume.content, after: data.content }),
      onError: () => toast({ title: "Error", description: "Tailoring failed.", variant: "destructive" }),
    });
  };

  const handleAcceptTailor = (result: string) => {
    if (!selectedId) return;
    updateResume.mutate({ id: selectedId, data: { title: selectedResume!.title, content: result } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetResumeQueryKey(selectedId) });
        setDiffPreview(null);
        toast({ title: "Resume updated", description: "Changes applied and saved." });
      },
      onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
    });
  };

  // ── KI: keyword gap ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !selectedResume?.content) return;
    setIsAnalyzing(true); setGapResult(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/ai/keyword-gap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ resumeContent: selectedResume.content, jobDescription }) });
      if (!res.ok) throw new Error("Failed");
      setGapResult(await res.json());
    } catch { toast({ title: "Analysis failed", description: "Please try again.", variant: "destructive" }); }
    finally { setIsAnalyzing(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 flex flex-col border-r border-border bg-muted/20 h-full overflow-hidden">
          {/* Sidebar header */}
          <div className="px-3 pt-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-semibold text-sm text-foreground">Resumes</h1>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Upload file" aria-label="Upload resume file" onClick={() => uploadQuickRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Import / paste" aria-label="Import or paste resume" onClick={() => setIsImportOpen(true)}>
                  <FileText className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" title="New blank resume" aria-label="New blank resume" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-8 h-7 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Resume list */}
          <div className="flex-1 overflow-y-auto py-1">
            {listLoading && [1,2,3].map(i => (
              <div key={i} className="px-3 py-2.5 mx-1">
                <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            ))}
            {!listLoading && filtered?.length === 0 && (
              <div className="px-4 py-8 text-center">
                <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{search ? "No results" : "No resumes yet"}</p>
              </div>
            )}
            {filtered?.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  "w-full text-left flex flex-col px-3 py-2.5 mx-0 border-l-2 transition-colors group",
                  selectedId === r.id
                    ? "border-l-primary bg-primary/5 text-foreground"
                    : "border-l-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-medium truncate leading-snug">{r.title}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {(r as any).shareToken && (
                      <span title="Public link active" className="text-primary">
                        <Globe className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setResumeToDelete(r.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {format(new Date(r.updatedAt), "MMM d, yyyy")}
                  {(r as any).shareToken && (
                    <span className="text-primary font-medium">· Live</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {!isPro && (
            <div className="px-3 py-2.5 border-t border-border text-[10px] text-muted-foreground">
              {resumes?.length ?? 0}/3 resumes · <button onClick={() => setLocation("/billing")} className="text-primary underline underline-offset-2">Upgrade for unlimited</button>
            </div>
          )}
        </div>

        {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
        {(!selectedId || (!resumeLoading && !selectedResume)) ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-muted/10">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Select a resume</h3>
              <p className="text-sm text-muted-foreground">Choose a resume from the sidebar to preview and tailor it with KI.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}><Upload className="w-4 h-4 mr-2" /> Import</Button>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Resume</Button>
            </div>
          </div>
        ) : resumeLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : selectedResume ? (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden">

            {/* ── PREVIEW PANE ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border overflow-hidden">
              {/* Preview top bar */}
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-background">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-semibold text-sm truncate">{selectedResume.title}</h2>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Template picker */}
                  <Select value={previewTemplate} onValueChange={v => setPreviewTemplate(v as TemplateId)}>
                    <SelectTrigger className="h-7 text-xs w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PDF_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Export" aria-label="Export resume" onClick={() => setExportResume({ title: selectedResume.title, content: selectedResume.content })}>
                    <FileDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Share" aria-label="Share resume" onClick={() => setShareResume({ id: selectedResume.id, title: selectedResume.title, shareToken: (selectedResume as any).shareToken ?? null })}>
                    <Share2 className={cn("w-3.5 h-3.5", (selectedResume as any).shareToken ? "text-primary" : "")} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setLocation(`/resumes/${selectedResume.id}`)}>
                    <Edit3 className="w-3 h-3" /> Full editor
                  </Button>
                </div>
              </div>

              {/* Preview iframe */}
              <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
                {previewHtml ? (
                  <div className="w-full">
                    <ResumeIframePreview html={previewHtml} containerW={Math.min(650, window.innerWidth - 620)} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">This resume has no content yet.</p>
                    <Button size="sm" onClick={() => setLocation(`/resumes/${selectedResume.id}`)}>Open Editor</Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── KI PANEL ─────────────────────────────────────────────── */}
            <div className="w-[420px] shrink-0 flex flex-col overflow-hidden bg-background">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">KI Assistant</span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* KnightedJobs deep-link banner */}
                {kiFromJobs && (
                  <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-primary leading-tight">Job loaded from KnightedJobs</p>
                      {(kiFromJobs.role || kiFromJobs.company) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {[kiFromJobs.role, kiFromJobs.company].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setKiFromJobs(null)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Job description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Job Description</Label>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => jdFileInputRef.current?.click()}
                        disabled={isJdFileLoading}
                        className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
                      >
                        {isJdFileLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload file
                      </button>
                      <input
                        ref={jdFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsJdFileLoading(true);
                          try {
                            const text = await extractFile(file);
                            setJobDescription(text);
                            setShowJobUrl(false);
                          } catch {
                            toast({ title: "Could not read file", description: "Try PDF, DOCX, or TXT.", variant: "destructive" });
                          } finally {
                            setIsJdFileLoading(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      <button onClick={() => setShowJobUrl(v => !v)} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                        <Globe className="w-3 h-3" /> Fetch from URL
                      </button>
                    </div>
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

                {/* Tabs: Tailor / Keyword Gap */}
                <Tabs value={kiTab} onValueChange={v => setKiTab(v as "tailor" | "gap")}>
                  <TabsList className="w-full h-7 text-xs">
                    <TabsTrigger value="tailor" className="flex-1 text-xs">Tailor</TabsTrigger>
                    <TabsTrigger value="gap" className="flex-1 text-xs">Keyword Gap</TabsTrigger>
                  </TabsList>

                  {/* Tailor tab */}
                  <TabsContent value="tailor" className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-primary" /> Instructions for KI
                      </Label>
                      <Textarea
                        placeholder="e.g. Emphasise leadership, keep under 1 page, focus on my Python experience…"
                        value={customInstructions}
                        onChange={e => setCustomInstructions(e.target.value)}
                        className="text-xs resize-none min-h-[80px] bg-muted/40 focus:bg-background transition-colors"
                        rows={4}
                      />
                    </div>
                    <Button
                      className="w-full h-8 text-xs gap-2"
                      onClick={handleTailor}
                      disabled={tailorResume.isPending || !jobDescription.trim()}
                    >
                      {tailorResume.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Tailoring…</> : <><Sparkles className="w-3.5 h-3.5" /> Tailor Resume</>}
                    </Button>
                    {!isPro && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                        Tailoring requires Pro. <button onClick={() => setLocation("/billing")} className="underline">Upgrade</button>
                      </p>
                    )}
                  </TabsContent>

                  {/* Keyword gap tab */}
                  <TabsContent value="gap" className="mt-3 space-y-3">
                    <Button
                      className="w-full h-8 text-xs gap-2"
                      variant="outline"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !jobDescription.trim() || !selectedResume.content.trim()}
                    >
                      {isAnalyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : <><BarChart2 className="w-3.5 h-3.5" /> Analyze Keywords</>}
                    </Button>

                    {gapResult && (
                      <div className="space-y-3">
                        {/* Score */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="shrink-0">
                            <div className="text-2xl font-bold leading-none" style={{ color: gapResult.score >= 75 ? "#22c55e" : gapResult.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                              {gapResult.score}
                            </div>
                            <div className="text-[10px] text-muted-foreground">/ 100</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${gapResult.score}%`, backgroundColor: gapResult.score >= 75 ? "#22c55e" : gapResult.score >= 50 ? "#f59e0b" : "#ef4444" }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">ATS match score</p>
                          </div>
                        </div>

                        {/* Matched */}
                        {gapResult.matchedKeywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-green-600 flex items-center gap-1 mb-1.5"><CheckCircle2 className="w-3 h-3" /> Matched ({gapResult.matchedKeywords.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {gapResult.matchedKeywords.slice(0, 8).map(k => <span key={k} className="text-[10px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded">{k}</span>)}
                              {gapResult.matchedKeywords.length > 8 && <span className="text-[10px] text-muted-foreground">+{gapResult.matchedKeywords.length - 8}</span>}
                            </div>
                          </div>
                        )}

                        {/* Missing */}
                        {gapResult.missingKeywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-red-600 flex items-center gap-1 mb-1.5"><XCircle className="w-3 h-3" /> Missing ({gapResult.missingKeywords.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {gapResult.missingKeywords.slice(0, 8).map(k => <span key={k} className="text-[10px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">{k}</span>)}
                              {gapResult.missingKeywords.length > 8 && <span className="text-[10px] text-muted-foreground">+{gapResult.missingKeywords.length - 8}</span>}
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {gapResult.suggestions.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5"><Lightbulb className="w-3 h-3" /> Suggestions</p>
                            <ul className="space-y-1">
                              {gapResult.suggestions.map((s, i) => <li key={i} className="text-[10px] text-muted-foreground leading-snug flex gap-1.5"><span className="shrink-0 mt-0.5">•</span>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── hidden inputs ──────────────────────────────────────────────── */}
        <input ref={uploadQuickRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt,.md,.rtf" onChange={handleQuickUpload} />

        {/* ── Create dialog ──────────────────────────────────────────────── */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Resume</DialogTitle><DialogDescription>Give it a name to get started.</DialogDescription></DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="py-4"><Input autoFocus placeholder="e.g. Software Engineer – Google" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newTitle.trim() || createResume.isPending}>{createResume.isPending ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Import dialog ──────────────────────────────────────────────── */}
        <Dialog open={isImportOpen} onOpenChange={v => { if (!v) closeImport(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Import Resume</DialogTitle><DialogDescription>Paste, upload a file, or import from LinkedIn / a URL.</DialogDescription></DialogHeader>
            <form onSubmit={handleImportSubmit}>
              <div className="space-y-4 py-2">
                <Input placeholder="Resume title" value={importTitle} onChange={e => setImportTitle(e.target.value)} />
                <Tabs value={importTab} onValueChange={v => setImportTab(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="paste" className="flex-1">Paste</TabsTrigger>
                    <TabsTrigger value="file" className="flex-1">Upload File</TabsTrigger>
                    <TabsTrigger value="url" className="flex-1">Web URL</TabsTrigger>
                    <TabsTrigger value="linkedin" className="flex-1">LinkedIn</TabsTrigger>
                  </TabsList>
                  <TabsContent value="paste" className="mt-3">
                    <Textarea placeholder="Paste your resume text here…" value={importContent} onChange={e => setImportContent(e.target.value)} className="min-h-[200px] text-sm" />
                  </TabsContent>
                  <TabsContent value="file" className="mt-3">
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isParsingFile ? <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" /> : <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />}
                      <p className="text-sm font-medium">{selectedFileName || "Click to upload"}</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, DOC, TXT supported</p>
                      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt,.md,.rtf" onChange={handleImportFile} />
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="https://…" value={importUrl} onChange={e => setImportUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleFetchUrl())} />
                      <Button type="button" onClick={handleFetchUrl} disabled={isFetchingUrl || !importUrl.trim()}>{isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}</Button>
                    </div>
                    {importContent && <Textarea value={importContent} onChange={e => setImportContent(e.target.value)} className="min-h-[140px] text-sm" />}
                  </TabsContent>
                  <TabsContent value="linkedin" className="mt-3 space-y-4">
                    {/* Step-by-step instructions */}
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                      <p className="text-sm font-semibold">Import your full LinkedIn profile</p>
                      <ol className="space-y-2.5">
                        {[
                          { step: "1", text: <>Go to <a href="https://www.linkedin.com/mypreferences/d/categories/dmp" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">LinkedIn Settings</a> → <strong>Data Privacy</strong> → <strong>Get a copy of your data</strong></> },
                          { step: "2", text: <>Select <strong>Want something in particular? → All your data</strong>, then click <strong>Request archive</strong></> },
                          { step: "3", text: <>LinkedIn will email you a download link — usually arrives within <strong>a few minutes</strong></> },
                          { step: "4", text: <>Download the ZIP file, then upload it below</> },
                        ].map(({ step, text }) => (
                          <li key={step} className="flex gap-3 items-start">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold mt-0.5">{step}</span>
                            <span className="text-xs text-muted-foreground leading-relaxed">{text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* ZIP upload */}
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => linkedinZipRef.current?.click()}
                    >
                      {isImportingLinkedInZip
                        ? <><Loader2 className="w-5 h-5 animate-spin mx-auto mb-1.5 text-primary" /><p className="text-sm font-medium">Parsing your LinkedIn data…</p><p className="text-xs text-muted-foreground mt-0.5">KI is converting your profile into a resume</p></>
                        : <><Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" /><p className="text-sm font-medium">{linkedinZipFile ? linkedinZipFile.name : "Upload your LinkedIn ZIP"}</p><p className="text-xs text-muted-foreground mt-0.5">{linkedinZipFile ? "Ready to import" : "Click to select file · .zip only"}</p></>
                      }
                      <input ref={linkedinZipRef} type="file" className="hidden" accept=".zip" onChange={e => { const f = e.target.files?.[0]; if (f) setLinkedinZipFile(f); e.target.value = ""; }} />
                    </div>
                    {linkedinZipFile && !isImportingLinkedInZip && (
                      <Button type="button" size="sm" className="w-full" onClick={handleLinkedInZipImport}>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />Import with KI
                      </Button>
                    )}

                    {/* Fallback: paste profile text */}
                    <details className="group">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                        <span className="group-open:rotate-90 transition-transform inline-block">›</span> Or paste your profile text manually
                      </summary>
                      <div className="mt-2 space-y-2">
                        <Textarea placeholder="Copy all text from your LinkedIn profile page and paste it here…" value={linkedinPasteText} onChange={e => setLinkedinPasteText(e.target.value)} className="min-h-[100px] text-sm" />
                        {linkedinPasteText.trim() && <Button type="button" size="sm" variant="outline" onClick={() => handleLinkedInImport("paste")} disabled={isImportingLinkedIn}>{isImportingLinkedIn ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Formatting…</> : "Format with KI"}</Button>}
                      </div>
                    </details>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={closeImport}>Cancel</Button>
                <Button type="submit" disabled={!importTitle.trim() || !importContent.trim() || createResume.isPending}>{createResume.isPending ? "Importing…" : "Import Resume"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Delete dialog ──────────────────────────────────────────────── */}
        <Dialog open={!!resumeToDelete} onOpenChange={open => { if (!open) setResumeToDelete(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Resume</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResumeToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteResume.isPending}>{deleteResume.isPending ? "Deleting…" : "Delete"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Export dialog ──────────────────────────────────────────────── */}
        <ExportDialog
          open={!!exportResume}
          onOpenChange={open => { if (!open) setExportResume(null); }}
          mode="resume"
          title={exportResume?.title ?? ""}
          content={exportResume?.content ?? ""}
        />

        {/* ── Share dialog ───────────────────────────────────────────────── */}
        <Dialog open={!!shareResume} onOpenChange={open => { if (!open) { setShareResume(null); setCopied(false); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Share Resume</DialogTitle><DialogDescription>Create a public link to share a read-only view.</DialogDescription></DialogHeader>
            <div className="py-4 space-y-4">
              {shareUrl ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <input readOnly value={shareUrl} className="flex-1 bg-transparent text-xs font-mono truncate outline-none" />
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive" onClick={handleRevokeShare} disabled={shareLoading}>
                    <Link2Off className="w-4 h-4" /> Revoke link
                  </Button>
                </>
              ) : (
                <Button className="w-full gap-2" onClick={handleEnableShare} disabled={shareLoading}>
                  {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Enable public link
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Diff dialog ────────────────────────────────────────────────── */}
        {diffPreview && (
          <ResumeDiffDialog
            open={!!diffPreview}
            onOpenChange={open => { if (!open) setDiffPreview(null); }}
            previousContent={diffPreview.before}
            nextContent={diffPreview.after}
            onAccept={handleAcceptTailor}
            onDiscard={() => setDiffPreview(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
