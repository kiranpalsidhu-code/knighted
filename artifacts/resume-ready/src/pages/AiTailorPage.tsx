import React, { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListResumes, useListCoverLetters, useCreateResume, useCreateCoverLetter } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  FileText, Upload, X, Sparkles, Download, FolderOpen,
  CheckCircle2, Loader2, FileCheck, RotateCcw, ChevronDown, File,
  ChevronUp, Search, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { extractTextFromFile, ACCEPTED_DOC_TYPES } from "@/lib/pdf-utils";
import { generatePdfHtml } from "@/lib/resume-pdf-templates";
import { parseResumeContent } from "@/lib/resume-parser";
import { openPrintWindow } from "@/lib/resume-pdf-templates";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

async function downloadDocx(title: string, content: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const safeTitle = title.replace(/[/\\?%*:|"<>]/g, "-").trim() || "document";
  const lines = content.split("\n");
  const paragraphs: any[] = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return new Paragraph({});
    if (/^#{1,2}\s/.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60)) {
      return new Paragraph({ text: trimmed.replace(/^#+\s*/, ""), heading: HeadingLevel.HEADING_2 });
    }
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: trimmed.replace(/^[•\-*]\s*/, "") })] });
    }
    return new Paragraph({ children: [new TextRun({ text: trimmed })] });
  });
  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const buffer = await Packer.toBlob(doc);
  triggerDownload(buffer, `${safeTitle}.docx`);
}

async function downloadPdf(title: string, content: string, isCoverLetter = false) {
  if (isCoverLetter) {
    const lines = content.split("\n");
    const bodyHtml = lines.map(line => {
      if (!line.trim()) return "<p style='margin:0;height:0.8em'></p>";
      return `<p style='margin:0 0 0.15em'>${line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`;
    }).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>@page{size:letter;margin:1.2in 1.1in}body{font-family:Georgia,serif;font-size:11pt;line-height:1.6;color:#1a1a1a}</style>
</head><body>${bodyHtml}</body></html>`;
    openPrintWindow(html);
  } else {
    const parsed = parseResumeContent(content);
    const html = generatePdfHtml("classic", parsed, title);
    openPrintWindow(html);
  }
}

interface UploadedDoc {
  name: string;
  text: string;
  uploadedAt: string;
}

const RESUME_KEY = "ai_tailor_resume";
const COVER_KEY = "ai_tailor_cover";

function loadSaved(key: string): UploadedDoc | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToBrowser(key: string, doc: UploadedDoc) {
  try { localStorage.setItem(key, JSON.stringify(doc)); } catch {}
}

function clearFromBrowser(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

function UploadZone({
  label, saved, current, onFile, onClear, optional = false,
}: {
  label: string;
  saved: UploadedDoc | null;
  current: UploadedDoc | null;
  onFile: (doc: UploadedDoc) => void;
  onClear: () => void;
  optional?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const active = current ?? saved;

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.[0]) return;
    setLoading(true);
    try {
      const text = await extractTextFromFile(files[0]);
      const doc: UploadedDoc = { name: files[0].name, text, uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
      onFile(doc);
    } catch {
      toast({ title: "Could not read file", description: "Try PDF, DOCX, or TXT.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [onFile, toast]);

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors p-3.5 flex items-center gap-3 cursor-pointer group",
        dragging ? "border-primary bg-primary/5" : active ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"
      )}
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_DOC_TYPES} className="hidden" onChange={e => handleFiles(e.target.files)} />
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : active ? <FileCheck className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        {active ? (
          <>
            <p className="text-sm font-medium text-foreground truncate">{active.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {current ? (
                <><Upload className="w-3 h-3" /> Just uploaded</>
              ) : (
                <><CheckCircle2 className="w-3 h-3 text-green-500" /> Remembered from {saved!.uploadedAt}</>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">{label}{optional ? <span className="text-muted-foreground font-normal"> (optional)</span> : ""}</p>
            <p className="text-xs text-muted-foreground">Click or drag & drop — PDF, DOCX, TXT</p>
          </>
        )}
      </div>
      {active && (
        <button
          onClick={e => { e.stopPropagation(); onClear(); }}
          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface TailoredResult {
  resumeContent: string;
  coverLetterContent: string;
  jobTitle: string;
  companyName: string;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

type Stage = "idle" | "generating" | "done";

const STEPS = [
  "Analysing job description",
  "Matching keywords to resume",
  "Rewriting experience bullets",
  "Tailoring cover letter",
];

export default function AiTailorPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createResumeMutation = useCreateResume();
  const createCoverLetterMutation = useCreateCoverLetter();

  const [savedResume] = useState<UploadedDoc | null>(() => loadSaved(RESUME_KEY));
  const [savedCover] = useState<UploadedDoc | null>(() => loadSaved(COVER_KEY));
  const [currentResume, setCurrentResume] = useState<UploadedDoc | null>(null);
  const [currentCover, setCurrentCover] = useState<UploadedDoc | null>(null);

  const [jd, setJd] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("jd") || "";
    } catch { return ""; }
  });
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [jdLoading, setJdLoading] = useState(false);
  const jdFileRef = useRef<HTMLInputElement>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<TailoredResult | null>(null);
  const [savingResume, setSavingResume] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [savedResumeId, setSavedResumeId] = useState<number | null>(null);
  const [savedCoverId, setSavedCoverId] = useState<number | null>(null);
  const [showAtsBreakdown, setShowAtsBreakdown] = useState(false);
  const [aiConsentGiven, setAiConsentGiven] = useState<boolean>(() => {
    try { return sessionStorage.getItem("ki_ai_consent") === "1"; } catch { return false; }
  });
  const [showConsentBanner, setShowConsentBanner] = useState(false);

  const resumeDoc = currentResume ?? savedResume;
  const coverDoc = currentCover ?? savedCover;
  const canGenerate = !!resumeDoc && jd.trim().length > 20;

  function handleResumeFile(doc: UploadedDoc) {
    setCurrentResume(doc);
    saveToBrowser(RESUME_KEY, doc);
    setSavedResumeId(null);
  }
  function handleCoverFile(doc: UploadedDoc) {
    setCurrentCover(doc);
    saveToBrowser(COVER_KEY, doc);
    setSavedCoverId(null);
  }
  function clearResume() {
    setCurrentResume(null);
    clearFromBrowser(RESUME_KEY);
    setSavedResumeId(null);
  }
  function clearCover() {
    setCurrentCover(null);
    clearFromBrowser(COVER_KEY);
    setSavedCoverId(null);
  }

  function handleGenerateClick() {
    if (!canGenerate) return;
    if (!aiConsentGiven) {
      setShowConsentBanner(true);
      return;
    }
    void handleGenerate();
  }

  async function handleGenerate() {
    if (!canGenerate || !resumeDoc) return;
    setStage("generating");
    setStepIdx(0);
    setResult(null);
    setSavedResumeId(null);
    setSavedCoverId(null);

    const stepTimer = setInterval(() => {
      setStepIdx(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 900);

    try {
      const token = await getToken();

      // Extract job title + company from JD for naming
      const firstLine = jd.split("\n")[0].trim();
      const atMatch = firstLine.match(/(.+?)\s+(?:at|@)\s+(.+)/i);
      const jobTitle = atMatch?.[1]?.trim() ?? firstLine.slice(0, 60) ?? "Tailored Role";
      const companyName = atMatch?.[2]?.trim() ?? "";

      const [tailorRes, coverRes] = await Promise.all([
        fetch(`${BASE}/api/resume-ready/ai/tailor-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ resumeText: resumeDoc.text, jobDescription: jd, customInstructions: customInstructions.trim() || undefined }),
        }),
        fetch(`${BASE}/api/resume-ready/ai/cover-letter`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            resumeContent: resumeDoc.text,
            jobDescription: jd,
            jobTitle,
            companyName,
            existingCoverLetter: coverDoc?.text ?? "",
            customInstructions: customInstructions.trim() || undefined,
          }),
        }),
      ]);

      if (!tailorRes.ok || !coverRes.ok) {
        throw new Error("AI generation failed");
      }

      const [tailorData, coverData] = await Promise.all([tailorRes.json(), coverRes.json()]);

      clearInterval(stepTimer);
      setStepIdx(STEPS.length - 1);

      // Real ATS score: extract meaningful keywords from JD, check coverage in tailored resume
      const STOPWORDS = new Set([
        "about","above","after","again","against","also","apply","been","before","being",
        "between","come","could","during","each","every","experience","follow","from",
        "having","highly","into","join","just","like","looking","make","more","most",
        "must","need","only","other","over","please","preferred","required","should",
        "skills","some","strong","such","than","that","their","them","then","there",
        "these","they","this","through","under","upon","very","want","were","what",
        "when","where","while","whom","will","with","work","your",
      ]);
      const extractKeywords = (text: string): string[] => {
        const raw = text.toLowerCase().split(/\W+/).filter(w => w.length >= 4 && !STOPWORDS.has(w));
        return Array.from(new Set(raw));
      };
      const jdKeywords = extractKeywords(jd);
      const resumeText = tailorData.content.toLowerCase();
      const matchedKeywords = jdKeywords.filter(kw => resumeText.includes(kw));
      const missingKeywords = jdKeywords.filter(kw => !resumeText.includes(kw)).slice(0, 20);
      const ratio = matchedKeywords.length / Math.max(jdKeywords.length, 1);
      // Score: realistic 40–97 range based on true keyword coverage
      const atsScore = Math.min(97, Math.max(40, Math.round(40 + ratio * 57)));

      setResult({
        resumeContent: tailorData.content,
        coverLetterContent: coverData.content,
        jobTitle,
        companyName,
        atsScore,
        matchedKeywords: matchedKeywords.slice(0, 30),
        missingKeywords,
      });
      setStage("done");
    } catch (err) {
      clearInterval(stepTimer);
      setStage("idle");
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    }
  }

  async function handleSaveResume() {
    if (!result) return;
    setSavingResume(true);
    try {
      const title = `${result.jobTitle}${result.companyName ? ` @ ${result.companyName}` : ""} — Tailored Resume`;
      const res = await createResumeMutation.mutateAsync({ data: { title, content: result.resumeContent } });
      setSavedResumeId((res as any)?.id ?? null);
      toast({ title: "Saved to Resumes", description: "Find it under Resumes in the sidebar." });
    } catch {
      toast({ title: "Could not save", description: "Try again.", variant: "destructive" });
    } finally {
      setSavingResume(false);
    }
  }

  async function handleSaveCover() {
    if (!result) return;
    setSavingCover(true);
    try {
      const title = `${result.jobTitle}${result.companyName ? ` @ ${result.companyName}` : ""} — Cover Letter`;
      const res = await createCoverLetterMutation.mutateAsync({ data: { title, content: result.coverLetterContent } });
      setSavedCoverId((res as any)?.id ?? null);
      toast({ title: "Saved to Cover Letters", description: "Find it under Cover Letters in the sidebar." });
    } catch {
      toast({ title: "Could not save", description: "Try again.", variant: "destructive" });
    } finally {
      setSavingCover(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex h-full min-h-0">
        {/* Left panel — inputs */}
        <div className="w-[360px] flex-shrink-0 border-r border-border flex flex-col h-full">
          <div className="px-5 py-4 border-b border-border">
            <h1 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> KI Tailor
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Tailor your resume & cover letter to any job</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Documents */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Your Documents</p>
              <div className="space-y-2.5">
                <UploadZone
                  label="Resume"
                  saved={savedResume}
                  current={currentResume}
                  onFile={handleResumeFile}
                  onClear={clearResume}
                />
                <UploadZone
                  label="Cover Letter"
                  saved={savedCover}
                  current={currentCover}
                  onFile={handleCoverFile}
                  onClear={clearCover}
                  optional
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Documents are remembered in your browser — no need to re-upload each time</span>
              </p>
            </div>

            {/* Job Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Description</p>
                <div className="flex items-center gap-1.5">
                  {jd.length > 0 && (
                    <button
                      onClick={() => setJd("")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <button
                    onClick={() => jdFileRef.current?.click()}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
                  >
                    <Upload className="w-3 h-3" /> Upload file
                  </button>
                  <input
                    ref={jdFileRef}
                    type="file"
                    accept={ACCEPTED_DOC_TYPES}
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setJdLoading(true);
                      try {
                        const text = await extractTextFromFile(file);
                        setJd(text);
                        setJdFileName(file.name);
                      } catch {
                        toast({ title: "Could not read file", description: "Try PDF, DOCX, or TXT.", variant: "destructive" });
                      } finally {
                        setJdLoading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              </div>
              {jdFileName && jd.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                  <FileCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{jdFileName}</span>
                </div>
              )}
              <div className="relative">
                <Textarea
                  placeholder={"Paste the full job description here, or click \"Upload file\" above\u2026\n\nThe AI will tailor your resume and cover letter to match the role's keywords, requirements, and tone."}
                  className="min-h-[200px] text-sm resize-none"
                  value={jd}
                  onChange={e => { setJd(e.target.value); setJdFileName(null); }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={async e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    setJdLoading(true);
                    try {
                      const text = await extractTextFromFile(file);
                      setJd(text);
                      setJdFileName(file.name);
                    } catch {
                      toast({ title: "Could not read file", variant: "destructive" });
                    } finally { setJdLoading(false); }
                  }}
                />
                {jdLoading && (
                  <div className="absolute inset-0 bg-background/70 rounded-md flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {jd.length > 0 ? `${jd.length} characters` : "Paste, upload, or drag & drop a file"}
              </p>
            </div>
          </div>

          {/* Generate */}
          <div className="p-5 border-t border-border space-y-3">
            {/* Custom instructions */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Instructions for KI <span className="normal-case font-normal">(optional)</span></p>
              <Textarea
                placeholder={"e.g. Keep it to one page, emphasise leadership, highlight Python skills, use a formal tone, don't remove the volunteer section…"}
                className="text-xs resize-none min-h-[80px]"
                value={customInstructions}
                onChange={e => setCustomInstructions(e.target.value)}
                disabled={stage === "generating"}
              />
            </div>
            {showConsentBanner && !aiConsentGiven && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-xs text-foreground leading-relaxed">
                    <p className="font-semibold mb-1">AI data notice</p>
                    <p className="text-muted-foreground">Your resume and job description will be sent to our AI provider for processing. Names, emails, and phone numbers are stripped before transmission. We never store your documents on third-party servers.</p>
                    <a href={`${BASE}/privacy`} className="text-primary underline underline-offset-2 mt-1 inline-block" target="_blank" rel="noreferrer">Read our privacy policy</a>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => {
                      try { sessionStorage.setItem("ki_ai_consent", "1"); } catch { /* */ }
                      setAiConsentGiven(true);
                      setShowConsentBanner(false);
                      void handleGenerate();
                    }}
                  >
                    I understand — tailor my resume
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8"
                    onClick={() => setShowConsentBanner(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!canGenerate || stage === "generating"}
              onClick={handleGenerateClick}
            >
              {stage === "generating" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Tailoring…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Tailor with KI</>
              )}
            </Button>
            {stage === "done" && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 gap-1.5 text-muted-foreground"
                onClick={() => { setStage("idle"); setResult(null); setSavedResumeId(null); setSavedCoverId(null); }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start over
              </Button>
            )}
            {!canGenerate && stage === "idle" && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {!resumeDoc ? "Upload a resume to continue" : "Paste a job description (20+ chars) to continue"}
              </p>
            )}
          </div>
        </div>

        {/* Right panel — output */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {stage === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1.5 text-lg">Your tailored documents will appear here</p>
                <p className="text-sm text-muted-foreground max-w-sm">Upload your resume, paste a job description, and hit Tailor with AI.</p>
              </div>
              <div className="flex flex-col items-start gap-2.5 mt-1 text-sm text-muted-foreground">
                {[
                  "Matches ATS keywords from the job description",
                  "Rewrites bullets with stronger action verbs & results",
                  "Tailors your cover letter tone & content",
                  "Download as PDF or Word, or save to your folders",
                ].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "generating" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground mb-1">Tailoring your documents…</p>
                <p className="text-sm text-muted-foreground">Reading the job description and rewriting for maximum ATS match</p>
              </div>
              <div className="w-72 space-y-3">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    {i < stepIdx ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : i === stepIdx ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                    )}
                    <span className={i <= stepIdx ? "text-foreground" : "text-muted-foreground/50"}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "done" && result && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Result header */}
              <div className="border-b border-border">
                <div className="px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {result.jobTitle}{result.companyName ? ` @ ${result.companyName}` : ""}
                    </span>
                    <Badge
                      className={cn("text-xs flex-shrink-0 border font-semibold",
                        result.atsScore >= 80 ? "bg-green-500/10 text-green-600 border-green-500/30" :
                        result.atsScore >= 65 ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" :
                        "bg-red-500/10 text-red-600 border-red-500/30"
                      )}
                    >
                      ATS {result.atsScore}%
                    </Badge>
                  </div>
                  <button
                    onClick={() => setShowAtsBreakdown(v => !v)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium flex-shrink-0"
                  >
                    {showAtsBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAtsBreakdown ? "Hide breakdown" : "Keyword breakdown"}
                  </button>
                </div>
                {showAtsBreakdown && (
                  <div className="px-6 pb-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-green-600 mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched ({result.matchedKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.matchedKeywords.slice(0, 20).map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">{kw}</span>
                        ))}
                        {result.matchedKeywords.length > 20 && <span className="text-muted-foreground">+{result.matchedKeywords.length - 20} more</span>}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-red-500 mb-1.5 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Missing ({result.missingKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.missingKeywords.map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">{kw}</span>
                        ))}
                        {result.missingKeywords.length === 0 && <span className="text-muted-foreground italic">All keywords covered!</span>}
                      </div>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border">
                      <a
                        href={`/knighted-jobs/jobs?q=${encodeURIComponent(result.jobTitle)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <Search className="w-3.5 h-3.5" /> Find matching jobs on KnightedJobs →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Tabs defaultValue="resume" className="flex-1 flex flex-col min-h-0">
                <div className="px-6 pt-3 pb-0 border-b border-border flex items-center justify-between gap-3">
                  <TabsList className="h-9">
                    <TabsTrigger value="resume" className="text-sm gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </TabsTrigger>
                    <TabsTrigger value="cover" className="text-sm gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Cover Letter
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2 pb-1">
                    {/* Download dropdown — active tab only, handled per tab via state */}
                    <TabsContent value="resume" className="m-0 p-0 contents">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                            <Download className="w-3.5 h-3.5" /> Download <ChevronDown className="w-3 h-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadPdf(`${result.jobTitle} Resume`, result.resumeContent, false)}>
                            <FileText className="w-3.5 h-3.5 mr-2" /> Save as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadDocx(`${result.jobTitle} Resume`, result.resumeContent)}>
                            <File className="w-3.5 h-3.5 mr-2" /> Save as Word (.docx)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TabsContent>

                    {/* Save to folder */}
                    <TabsContent value="resume" className="m-0 p-0 contents">
                      {savedResumeId ? (
                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-green-600 border-green-200" onClick={() => setLocation(`/resumes/${savedResumeId}`)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Open in Resumes
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSaveResume} disabled={savingResume}>
                          {savingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                          Save to Resumes
                        </Button>
                      )}
                    </TabsContent>

                    <TabsContent value="cover" className="m-0 p-0 contents">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                            <Download className="w-3.5 h-3.5" /> Download <ChevronDown className="w-3 h-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadPdf(`${result.jobTitle} Cover Letter`, result.coverLetterContent, true)}>
                            <FileText className="w-3.5 h-3.5 mr-2" /> Save as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadDocx(`${result.jobTitle} Cover Letter`, result.coverLetterContent)}>
                            <File className="w-3.5 h-3.5 mr-2" /> Save as Word (.docx)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TabsContent>

                    <TabsContent value="cover" className="m-0 p-0 contents">
                      {savedCoverId ? (
                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-green-600 border-green-200" onClick={() => setLocation(`/cover-letters/${savedCoverId}`)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Open in Cover Letters
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSaveCover} disabled={savingCover}>
                          {savingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                          Save to Cover Letters
                        </Button>
                      )}
                    </TabsContent>
                  </div>
                </div>

                <TabsContent value="resume" className="flex-1 m-0 overflow-hidden">
                  <div className="h-full overflow-y-auto p-6">
                    <div className="bg-card rounded-lg border border-border p-6 min-h-full max-w-2xl mx-auto">
                      {result.resumeContent.split("\n").map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-2" />;
                        if (/^#{1,2}\s/.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60)) {
                          return <h2 key={i} className="text-sm font-bold uppercase tracking-widest text-foreground border-b border-border pb-0.5 mt-4 mb-1.5">{trimmed.replace(/^#+\s*/, "")}</h2>;
                        }
                        if (/^[-•*]\s/.test(trimmed)) {
                          return <p key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-muted-foreground leading-relaxed">{trimmed.replace(/^[-•*]\s/, "")}</p>;
                        }
                        return <p key={i} className="text-sm text-foreground leading-relaxed">{trimmed}</p>;
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cover" className="flex-1 m-0 overflow-hidden">
                  <div className="h-full overflow-y-auto p-6">
                    <div className="bg-card rounded-lg border border-border p-6 min-h-full max-w-2xl mx-auto font-serif">
                      {result.coverLetterContent.split("\n").map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-3" />;
                        return <p key={i} className="text-sm text-foreground leading-relaxed">{trimmed}</p>;
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
