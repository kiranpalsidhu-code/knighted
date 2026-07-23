import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetResume, 
  getGetResumeQueryKey,
  useUpdateResume,
  useCreateResume,
  useTailorResume,
  useGenerateCoverLetter,
  useCreateCoverLetter,
  useGetMyProfile
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Sparkles, AlertTriangle, Download, Globe, X, Upload, Eye, EyeOff, History, BarChart2, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor, type Editor } from "@/components/RichTextEditor";
import { htmlToPlainText } from "@/lib/content-utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
import { FeedbackDialog } from "@/components/ui/feedback-dialog";
import { ExportPdfDialog } from "@/components/ExportPdfDialog";
import { useAuth } from "@clerk/react";
import { parseResumeContent } from "@/lib/resume-parser";
import { generatePdfHtml, PDF_TEMPLATES, type TemplateId } from "@/lib/resume-pdf-templates";
import { VersionHistorySheet } from "@/components/VersionHistorySheet";
import { SkillsAutocomplete } from "@/components/SkillsAutocomplete";
import { ResumeDiffDialog } from "@/components/ResumeDiffDialog";
import { SaveDialog, downloadResumeAs } from "@/components/SaveDialog";
import { CoverLetterResultDialog } from "@/components/CoverLetterResultDialog";
import { FileText } from "lucide-react";

export default function ResumeEditorPage() {
  const { id } = useParams();
  const resumeId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { getToken } = useAuth();

  const { data: profile } = useGetMyProfile();
  const isPro = profile?.tier === 'pro';

  const { data: resume, isLoading } = useGetResume(resumeId, {
    query: { enabled: !!resumeId, queryKey: getGetResumeQueryKey(resumeId) }
  });

  const updateResume = useUpdateResume();
  const createResume = useCreateResume();
  const tailorResume = useTailorResume();
  const generateCoverLetter = useGenerateCoverLetter();
  const createCoverLetter = useCreateCoverLetter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showJobUrlInput, setShowJobUrlInput] = useState(false);
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [isFetchingJobUrl, setIsFetchingJobUrl] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadedReplacement, setIsUploadedReplacement] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const [existingCoverLetter, setExistingCoverLetter] = useState("");
  const [showExistingCl, setShowExistingCl] = useState(false);
  const [clDiff, setClDiff] = useState<{ before: string; after: string } | null>(null);
  const [pendingNavigateTo, setPendingNavigateTo] = useState<string | null>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [rightPanel, setRightPanel] = useState<"tailor" | "preview" | "gap" | "bullet">("tailor");
  const [showHistory, setShowHistory] = useState(false);
  const [diffPreview, setDiffPreview] = useState<{ before: string; after: string } | null>(null);
  const [bulletInput, setBulletInput] = useState("");
  const [bulletResult, setBulletResult] = useState<string | null>(null);
  const [isRewritingBullet, setIsRewritingBullet] = useState(false);

  const handleRewriteBullet = async () => {
    if (!bulletInput.trim()) return;
    setIsRewritingBullet(true);
    setBulletResult(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/ai/rewrite-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bullet: bulletInput, jobDescription, customInstructions }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const data = await res.json();
      setBulletResult(data.rewritten);
    } catch {
      toast({ title: "Rewrite failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsRewritingBullet(false);
    }
  };

  const handleInsertRewrittenBullet = () => {
    if (!bulletResult) return;
    const editor = editorInstanceRef.current;
    if (editor) {
      editor.chain().focus().insertContent(bulletResult).run();
    } else {
      setContent(prev => prev + "\n" + bulletResult);
    }
    setBulletResult(null);
    setBulletInput("");
    toast({ title: "Bullet inserted!", description: "Scroll to see it in your resume." });
  };

  const [gapResult, setGapResult] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId>("classic");
  const [debouncedContent, setDebouncedContent] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");

  const initRef = useRef<number | null>(null);

  const dismissSharePrompt = () => {
    setShowSharePrompt(false);
    localStorage.setItem("kr_share_prompt_dismissed", String(Date.now()));
  };

  const shouldShowSharePrompt = () => {
    const dismissed = localStorage.getItem("kr_share_prompt_dismissed");
    if (!dismissed) return true;
    const daysSince = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
    return daysSince > 14;
  };

  useEffect(() => {
    if (resume && initRef.current !== resumeId) {
      initRef.current = resumeId;
      setTitle(resume.title);
      setContent(resume.content);
      setIsUploadedReplacement(false);
    }
  }, [resume, resumeId]);

  const isDirty =
    !!resume &&
    (title !== resume.title || content !== resume.content);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && title.trim()) handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, title, content]);

  // Debounce content/title into the preview so the iframe isn't rebuilt on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedContent(content);
      setDebouncedTitle(title);
    }, 450);
    return () => clearTimeout(t);
  }, [content, title]);

  const previewHtml = useMemo(() => {
    const plain = htmlToPlainText(debouncedContent);
    if (rightPanel !== "preview" || !plain.trim()) return "";
    try {
      return generatePdfHtml(previewTemplateId, parseResumeContent(plain), debouncedTitle || "Resume");
    } catch {
      return "";
    }
  }, [rightPanel, debouncedContent, debouncedTitle, previewTemplateId]);

  const handleInsertSkill = (skill: string) => {
    const editor = editorInstanceRef.current;
    if (editor) {
      editor.chain().focus().insertContent(", " + skill).run();
    } else {
      setContent((prev) => prev + (prev.endsWith(", ") || prev.endsWith("\n") || prev === "" ? "" : ", ") + skill);
    }
  };

  const handleAnalyzeKeywords = async () => {
    if (!jobDescription.trim() || !content.trim()) return;
    setIsAnalyzing(true);
    setGapResult(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/resume-ready/ai/keyword-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeContent: content, jobDescription }),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const data = await res.json();
      setGapResult(data);
    } catch {
      toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Scale a letter-width iframe (816 px) to fit the 400 px side panel
  const PAPER_W = 816;
  const PAPER_H = 2200; // generous — covers ~2 pages
  const PANEL_INNER = 368; // 400px panel − 2×16px padding
  const SCALE = PANEL_INNER / PAPER_W;

  const wordCount = useMemo(() => {
    const plain = htmlToPlainText(content);
    return plain.trim() ? plain.trim().split(/\s+/).length : 0;
  }, [content]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      navigate("/resumes");
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async (name: string, format: "cloud" | "txt" | "docx" | "pdf", pdfTemplate?: TemplateId) => {
    const saveName = name.trim() || title;
    if (!saveName) return;
    if (saveName !== title) setTitle(saveName);

    const doSave = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (isUploadedReplacement) {
          createResume.mutate(
            { data: { title: saveName, content } },
            {
              onSuccess: (data) => {
                setIsUploadedReplacement(false);
                queryClient.invalidateQueries();
                navigate(`/resumes/${data.id}`);
                resolve();
              },
              onError: reject,
            }
          );
        } else {
          updateResume.mutate(
            { id: resumeId, data: { title: saveName, content } },
            {
              onSuccess: (data) => {
                queryClient.setQueryData(getGetResumeQueryKey(resumeId), data);
                resolve();
              },
              onError: reject,
            }
          );
        }
      });

    try {
      await doSave();
      setShowSaveDialog(false);
      if (format !== "cloud") {
        await downloadResumeAs(format, saveName, content, pdfTemplate);
        toast({ title: "Saved & downloaded", description: `Resume saved to dashboard and downloaded as ${format.toUpperCase()}.` });
      } else {
        toast({ title: "Saved", description: isUploadedReplacement ? "Saved as a new resume on your dashboard." : "Resume saved to your dashboard." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save resume.", variant: "destructive" });
    }
  };

  const handleTailor = () => {
    if (!isPro) {
      toast({
        title: "Pro Feature",
        description: "KI tailoring is a Pro feature. Please upgrade to use this.",
        variant: "destructive"
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({ title: "Missing details", description: "Please provide a job description." });
      return;
    }

    tailorResume.mutate(
      { data: { resumeId, jobDescription, customInstructions: customInstructions.trim() || undefined } },
      {
        onSuccess: (data) => {
          setDiffPreview({ before: content, after: data.content });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to tailor resume.", variant: "destructive" });
        }
      }
    );
  };

  const handleAcceptTailor = (result: string) => {
    if (isCoverLetterMode) {
      createResume.mutate(
        { data: { title: `${title} – Tailored`, content: result } },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries();
            setDiffPreview(null);
            setIsCoverLetterMode(false);
            if (clDiff) {
              setPendingNavigateTo(`/resumes/${data.id}`);
              toast({ title: "Resume saved!", description: "Review your cover letter changes below." });
            } else {
              toast({ title: "Both saved!", description: "Tailored resume and cover letter saved as separate documents." });
              navigate(`/resumes/${data.id}`);
            }
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to save the tailored resume.", variant: "destructive" });
          },
        }
      );
    } else {
      setContent(result);
      setDiffPreview(null);
      toast({ title: "Changes applied", description: "Your resume has been updated based on the job description." });
      if (shouldShowSharePrompt()) setShowSharePrompt(true);
    }
  };

  const handleAcceptClDiff = (result: string) => {
    createCoverLetter.mutate(
      { data: { title: `Cover Letter – ${title}`, content: result } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          setClDiff(null);
          toast({ title: "Both saved!", description: "Tailored resume and revised cover letter saved." });
          if (pendingNavigateTo) { navigate(pendingNavigateTo); setPendingNavigateTo(null); }
          else navigate("/cover-letters");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save the cover letter.", variant: "destructive" });
        },
      }
    );
  };

  const handleDiscardClDiff = () => {
    setClDiff(null);
    if (pendingNavigateTo) { navigate(pendingNavigateTo); setPendingNavigateTo(null); }
  };

  const handleDiscardTailor = () => {
    setDiffPreview(null);
    setIsCoverLetterMode(false);
    toast({ title: "Kept original", description: "No changes were applied to your resume." });
  };

  const handleTailorWithCoverLetter = () => {
    if (!isPro) {
      toast({ title: "Pro Feature", description: "KI tailoring is a Pro feature. Please upgrade to use this.", variant: "destructive" });
      return;
    }
    if (!jobDescription.trim()) {
      toast({ title: "Missing details", description: "Please provide a job description." });
      return;
    }

    tailorResume.mutate(
      { data: { resumeId, jobDescription, customInstructions: customInstructions.trim() || undefined } },
      {
        onSuccess: (tailorData) => {
          setDiffPreview({ before: content, after: tailorData.content });
          setIsCoverLetterMode(true);
          generateCoverLetter.mutate(
            {
              data: {
                resumeContent: tailorData.content,
                jobDescription,
                customInstructions: customInstructions.trim() || undefined,
                existingCoverLetter: existingCoverLetter.trim() || undefined,
              }
            },
            {
              onSuccess: (clData) => {
                if (existingCoverLetter.trim()) {
                  // Show CL diff after resume diff
                  setClDiff({ before: existingCoverLetter, after: clData.content });
                  toast({ title: "Almost done!", description: "Review your resume changes, then we'll show cover letter revisions." });
                } else {
                  createCoverLetter.mutate(
                    { data: { title: `Cover Letter – ${title}`, content: clData.content } },
                    {
                      onSuccess: () => toast({ title: "Cover letter saved", description: "Your cover letter is in the Cover Letters section. Now review your resume changes below." }),
                      onError: () => toast({ title: "Cover letter failed to save", description: "Generated but couldn't save. Try the Cover Letters page.", variant: "destructive" }),
                    }
                  );
                }
              },
              onError: () => toast({ title: "Cover letter failed", description: "Resume was tailored but cover letter generation failed. Try the Cover Letters page.", variant: "destructive" }),
            }
          );
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to tailor resume.", variant: "destructive" });
        },
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setIsUploadingFile(true);
    try {
      const { extractTextFromFile } = await import("@/lib/pdf-utils");
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error("No text could be extracted from this file.");
      setContent(text);
      setIsUploadedReplacement(true);
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
      toast({ title: "File loaded", description: "Saving will create a new resume so your original stays untouched." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not extract text from this file.", variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFetchJobUrl = async () => {
    const trimmed = jobUrlInput.trim();
    if (!trimmed) return;
    setIsFetchingJobUrl(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/resume-ready/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch URL");
      setJobDescription(data.text);
      setShowJobUrlInput(false);
      setJobUrlInput("");
      toast({ title: "Job description fetched", description: "Review the extracted text, then click Tailor." });
    } catch (err: any) {
      toast({ title: "Fetch failed", description: err?.message || "Could not fetch that URL.", variant: "destructive" });
    } finally {
      setIsFetchingJobUrl(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading editor...</div>
        </div>
      </AppLayout>
    );
  }

  if (!resume) {
    return (
      <AppLayout>
        <div className="p-8 max-w-7xl mx-auto">Resume not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Unsaved changes dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes that will be lost if you leave. Do you want to discard them?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => navigate("/resumes")}
              >
                Discard & leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header */}
        <div className="flex-none border-b border-border bg-background px-6 py-4 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-lg font-bold border-transparent focus-visible:ring-0 focus-visible:border-input px-2 h-9 w-[300px]"
              />
              {isDirty && (
                <span className="text-xs text-muted-foreground italic">Unsaved</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileUploadRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.rtf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileUploadRef.current?.click()}
              disabled={isUploadingFile}
              title="Upload a PDF, DOCX, or TXT file to replace the editor content"
            >
              {isUploadingFile ? (
                <><div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" /> Reading…</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Upload File</>
              )}
            </Button>
            <SkillsAutocomplete onInsert={handleInsertSkill} />
            {/* Right-panel tab switcher */}
            <div className="hidden lg:flex items-center rounded-md border border-border overflow-hidden">
              {(["tailor", "preview", "gap", "bullet"] as const).map((panel) => {
                const labels: Record<string, React.ReactNode> = {
                  tailor: <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Tailor</>,
                  preview: <><Eye className="w-3.5 h-3.5 mr-1.5" />Preview</>,
                  gap: <><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Keywords</>,
                  bullet: <><Lightbulb className="w-3.5 h-3.5 mr-1.5" />Bullet Rewriter</>,
                };
                return (
                  <button
                    key={panel}
                    onClick={() => setRightPanel(panel)}
                    className={[
                      "px-3 py-1.5 text-xs font-medium flex items-center transition-colors",
                      rightPanel === panel
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    {labels[panel]}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              title="Version history"
            >
              <History className="w-4 h-4 mr-2" /> History
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)}>
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={handleSave} disabled={updateResume.isPending || createResume.isPending}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>

        <ExportPdfDialog
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          resumeTitle={title}
          resumeContent={content}
        />

        <VersionHistorySheet
          open={showHistory}
          onOpenChange={setShowHistory}
          resumeId={resumeId}
          currentContent={content}
          onRestore={(restoredContent, restoredTitle) => {
            setContent(restoredContent);
            setTitle(restoredTitle);
          }}
        />

        {/* Share prompt banner */}
        {showSharePrompt && (
          <div className="flex-none bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-primary font-medium">
              🎉 Great result! Did KI help you land more interviews?{" "}
              <a
                href={`mailto:support@theknightedresume.com?subject=${encodeURIComponent("My Knighted Resume Story")}&body=${encodeURIComponent("Hi,\n\nI wanted to share my experience using Knighted Resume...\n\n")}`}
                className="underline underline-offset-2 font-semibold hover:opacity-80"
              >
                Share your story →
              </a>
            </p>
            <button
              onClick={dismissSharePrompt}
              className="text-primary/60 hover:text-primary text-lg leading-none shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Editor */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Paste your resume content here…"
              className="flex-1 border-0 rounded-none shadow-none"
              minHeight="800px"
              editorRef={editorInstanceRef}
            />
            <div className="flex items-center justify-end gap-4 pt-2 pb-1 text-xs text-muted-foreground">
              <span>{wordCount.toLocaleString()} words</span>
              <span>{content.length.toLocaleString()} characters</span>
              <span className="opacity-50">Ctrl+S to save</span>
            </div>
          </div>

          {/* Right panel — Tailor / Preview / Keywords */}
          <div className="w-[400px] border-l border-border bg-muted/10 flex flex-col hidden lg:flex overflow-hidden">
            {rightPanel === "preview" ? (
              /* ── Live Preview ───────────────────────────────────── */
              <>
                <div className="flex-none p-3 border-b border-border bg-background flex flex-col gap-2">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-primary" /> Live Preview
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {PDF_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPreviewTemplateId(t.id)}
                        className={[
                          "text-xs px-2 py-1 rounded font-medium transition-colors whitespace-nowrap",
                          previewTemplateId === t.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        ].join(" ")}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
                  {previewHtml ? (
                    <div
                      style={{
                        width: `${Math.round(PAPER_W * SCALE)}px`,
                        height: `${Math.round(PAPER_H * SCALE)}px`,
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                        borderRadius: "2px",
                        background: "#fff",
                      }}
                    >
                      <iframe
                        srcDoc={previewHtml}
                        title="Resume preview"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: `${PAPER_W}px`,
                          height: `${PAPER_H}px`,
                          transform: `scale(${SCALE})`,
                          transformOrigin: "top left",
                          border: "none",
                          pointerEvents: "none",
                        }}
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                      <Eye className="w-6 h-6 opacity-30" />
                      Start typing to see your resume take shape
                    </div>
                  )}
                </div>
              </>
            ) : rightPanel === "gap" ? (
              /* ── Keyword Gap Visualizer ─────────────────────────── */
              <>
                <div className="p-6 border-b border-border bg-background">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    Keyword Gap Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">See exactly which keywords the job demands — and which your resume is missing.</p>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                  {/* Job description input — shared with Tailor */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Job Description</label>
                    <Textarea
                      className="resize-none bg-background text-sm"
                      rows={5}
                      placeholder="Paste the job posting here..."
                      value={jobDescription}
                      onChange={(e) => { setJobDescription(e.target.value); setGapResult(null); }}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAnalyzeKeywords}
                    disabled={!jobDescription.trim() || !content.trim() || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <><div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />Analyzing…</>
                    ) : (
                      <><BarChart2 className="w-4 h-4 mr-2" />Analyze Keywords</>
                    )}
                  </Button>

                  {/* Results */}
                  {gapResult && (
                    <div className="flex flex-col gap-5">
                      {/* Score */}
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
                            <circle
                              cx="18" cy="18" r="15.9" fill="none"
                              strokeWidth="2.5"
                              strokeDasharray={`${gapResult.score} ${100 - gapResult.score}`}
                              strokeLinecap="round"
                              className={gapResult.score >= 75 ? "text-green-500" : gapResult.score >= 50 ? "text-amber-500" : "text-red-500"}
                              stroke="currentColor"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                            {gapResult.score}%
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {gapResult.score >= 75 ? "Strong match" : gapResult.score >= 50 ? "Partial match" : "Weak match"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {gapResult.matchedKeywords.length} keywords matched · {gapResult.missingKeywords.length} gaps found
                          </p>
                          {gapResult.score < 75 && (
                            <button
                              onClick={() => setRightPanel("tailor")}
                              className="text-xs text-primary underline underline-offset-2 mt-1 hover:opacity-80"
                            >
                              Auto-fix with KI Tailor →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Missing keywords */}
                      {gapResult.missingKeywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-500" /> Missing from your resume
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {gapResult.missingKeywords.map((kw) => (
                              <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matched keywords */}
                      {gapResult.matchedKeywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Already in your resume
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {gapResult.matchedKeywords.map((kw) => (
                              <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {gapResult.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> How to close the gaps
                          </p>
                          <ul className="space-y-2">
                            {gapResult.suggestions.map((s, i) => (
                              <li key={i} className="text-sm text-foreground flex gap-2 leading-relaxed">
                                <span className="shrink-0 text-amber-500 font-bold">{i + 1}.</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!gapResult && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                      <BarChart2 className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Paste a job description and hit Analyze to see your keyword score.</p>
                    </div>
                  )}
                </div>
              </>
            ) : rightPanel === "bullet" ? (
              /* ── Bullet Rewriter ─────────────────────────────────── */
              <>
                <div className="p-6 border-b border-border bg-background">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    KI Bullet Rewriter
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Paste any weak bullet — KI rewrites it with stronger verbs, STAR structure, and ATS keywords.</p>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Original bullet</label>
                    <Textarea
                      className="resize-none bg-background text-sm"
                      rows={3}
                      placeholder="e.g. Responsible for managing the team's social media accounts"
                      value={bulletInput}
                      onChange={(e) => { setBulletInput(e.target.value); setBulletResult(null); }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground -mt-1">
                    Tip: if you have a job description pasted in the <button className="underline hover:text-foreground" onClick={() => setRightPanel("tailor")}>Tailor panel</button>, KI will mirror its keywords automatically.
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleRewriteBullet}
                    disabled={!bulletInput.trim() || isRewritingBullet}
                  >
                    {isRewritingBullet ? (
                      <><div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />Rewriting…</>
                    ) : (
                      <><Lightbulb className="w-4 h-4 mr-2" />Rewrite with KI</>
                    )}
                  </Button>

                  {bulletResult && (
                    <div className="flex flex-col gap-3">
                      <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Rewritten bullet
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{bulletResult}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleInsertRewrittenBullet}>
                          Insert into Resume
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Copy to clipboard" onClick={() => navigator.clipboard.writeText(bulletResult)} title="Copy to clipboard">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <button
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground text-left"
                        onClick={handleRewriteBullet}
                      >
                        Try another variation →
                      </button>
                    </div>
                  )}

                  {!bulletResult && !isRewritingBullet && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                      <Lightbulb className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Paste any bullet point above and KI will rewrite it with stronger impact.</p>
                      <p className="text-xs mt-1 opacity-70">Try: "Responsible for managing the project timeline"</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── AI Tailor Sidebar ──────────────────────────────── */
              <>
                <div className="p-6 border-b border-border bg-background">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Match This Job, Perfectly
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Paste the job description and we'll rewrite your resume to speak their language — keywords, tone, and all.</p>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                  {!isPro && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-2 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-semibold text-primary">Pro Feature.</span> Upgrade to tailor your resumes automatically.
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex-1 flex flex-col min-h-[200px]">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Job Description</label>
                        {isPro && (
                          <button
                            type="button"
                            onClick={() => setShowJobUrlInput((v) => !v)}
                            className="flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                          >
                            {showJobUrlInput ? (
                              <><X className="w-3 h-3" /> Paste text instead</>
                            ) : (
                              <><Globe className="w-3 h-3" /> Fetch from URL</>
                            )}
                          </button>
                        )}
                      </div>
                      {showJobUrlInput ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              type="url"
                              placeholder="https://boards.greenhouse.io/..."
                              value={jobUrlInput}
                              onChange={(e) => setJobUrlInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetchJobUrl(); } }}
                              disabled={isFetchingJobUrl}
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleFetchJobUrl}
                              disabled={!jobUrlInput.trim() || isFetchingJobUrl}
                              className="shrink-0"
                            >
                              {isFetchingJobUrl ? "Fetching…" : "Fetch"}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Works with Greenhouse, Lever, Workday, and most company career pages. LinkedIn requires login.
                          </p>
                        </div>
                      ) : (
                        <Textarea
                          className="flex-1 resize-none bg-background"
                          placeholder="Paste the job requirements and responsibilities..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          disabled={!isPro}
                        />
                      )}
                    </div>
                    <div className="flex flex-col min-h-[100px]">
                      <label className="text-sm font-medium mb-1">Anything specific? <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <p className="text-xs text-muted-foreground mb-2">Tell us what matters to you — a career pivot, a tone, something to keep or skip.</p>
                      <Textarea
                        className="flex-1 resize-none bg-background text-sm"
                        placeholder='e.g. "Keep it to one page", "Emphasise leadership", "I want to transition into product management"'
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        disabled={!isPro}
                        rows={3}
                      />
                    </div>
                    {/* Existing Cover Letter for AI revision */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setShowExistingCl((v) => !v)}
                        className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 self-start"
                      >
                        <FileText className="w-3 h-3" />
                        {showExistingCl ? "Hide existing cover letter" : "Have a cover letter? Paste it to revise instead of generate from scratch"}
                      </button>
                      {showExistingCl && (
                        <Textarea
                          className="resize-none bg-background text-sm"
                          placeholder="Paste your existing cover letter here — AI will revise it to better target this job, preserving your voice and achievements."
                          value={existingCoverLetter}
                          onChange={(e) => setExistingCoverLetter(e.target.value)}
                          disabled={!isPro}
                          rows={5}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleTailor}
                      disabled={!jobDescription.trim() || tailorResume.isPending || generateCoverLetter.isPending || !isPro}
                      title="Tailor your resume to this job description"
                    >
                      <Sparkles className="w-4 h-4 mr-2 shrink-0" />
                      {tailorResume.isPending && !generateCoverLetter.isPending ? "Tailoring…" : "Tailor Resume"}
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      variant="outline"
                      onClick={handleTailorWithCoverLetter}
                      disabled={!jobDescription.trim() || tailorResume.isPending || generateCoverLetter.isPending || !isPro}
                      title="Tailor your resume and generate a matching cover letter"
                    >
                      <FileText className="w-4 h-4 mr-2 shrink-0" />
                      {tailorResume.isPending && generateCoverLetter.isPending
                        ? "Generating…"
                        : existingCoverLetter.trim()
                          ? "Revise Cover Letter"
                          : "+ Cover Letter"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      🔒 Your resume content is used only to generate your result and is never stored by Knighted Intelligence or used for training.
                    </p>
                    <p className="text-xs text-center leading-relaxed">
                      Got a question or suggestion?{" "}
                      <FeedbackDialog />
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {diffPreview && (
        <ResumeDiffDialog
          open={!!diffPreview}
          onOpenChange={(open) => { if (!open) handleDiscardTailor(); }}
          previousContent={diffPreview.before}
          nextContent={diffPreview.after}
          onAccept={handleAcceptTailor}
          onDiscard={handleDiscardTailor}
          acceptLabel={isCoverLetterMode ? "Save as New Resume" : "Apply changes"}
          discardLabel={isCoverLetterMode ? "Discard both" : "Keep original"}
          descriptionExtra={
            isCoverLetterMode
              ? clDiff
                ? "✓ Cover letter revisions ready — save this resume first, then we'll show cover letter changes."
                : "✓ Cover letter already saved — now save the tailored resume as a new document."
              : undefined
          }
        />
      )}
      {clDiff && (
        <ResumeDiffDialog
          open={!!clDiff}
          onOpenChange={(open) => { if (!open) handleDiscardClDiff(); }}
          previousContent={clDiff.before}
          nextContent={clDiff.after}
          onAccept={handleAcceptClDiff}
          onDiscard={handleDiscardClDiff}
          acceptLabel="Save revised cover letter"
          discardLabel="Keep original cover letter"
          descriptionExtra="Review AI revisions to your cover letter. Accept or reject each change."
        />
      )}
      <SaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        name={title}
        content={content}
        isSaving={updateResume.isPending || createResume.isPending}
        isUploadedReplacement={isUploadedReplacement}
        showTxtOption={true}
        onConfirm={handleSaveConfirm}
      />
      {coverLetterResult && (
        <CoverLetterResultDialog
          open={!!coverLetterResult}
          onOpenChange={(open) => { if (!open) setCoverLetterResult(null); }}
          content={coverLetterResult}
          resumeTitle={title}
          onNavigateToCoverLetters={() => { setCoverLetterResult(null); navigate("/cover-letters"); }}
        />
      )}
    </AppLayout>
  );
}
