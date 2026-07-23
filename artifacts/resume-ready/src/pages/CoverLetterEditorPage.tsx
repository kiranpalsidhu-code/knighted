import React, { useEffect, useRef, useState } from "react";
import { FeedbackDialog } from "@/components/ui/feedback-dialog";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCoverLetter,
  getGetCoverLetterQueryKey,
  useUpdateCoverLetter,
  useGenerateCoverLetter,
  useListResumes,
  getListResumesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { SaveDialog, downloadCoverLetterAs, type DownloadFormat } from "@/components/SaveDialog";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function CoverLetterEditorPage() {
  const { id } = useParams();
  const letterId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: letter, isLoading } = useGetCoverLetter(letterId, {
    query: { enabled: !!letterId, queryKey: getGetCoverLetterQueryKey(letterId) },
  });

  const { data: resumes } = useListResumes({
    query: { queryKey: getListResumesQueryKey() },
  });

  const updateLetter = useUpdateCoverLetter();
  const generateLetter = useGenerateCoverLetter();

  const [title, setTitle] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [content, setContent] = useState("");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const [showAiDialog, setShowAiDialog] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [clCustomInstructions, setClCustomInstructions] = useState("");

  const initRef = useRef<number | null>(null);

  useEffect(() => {
    if (letter && initRef.current !== letterId) {
      initRef.current = letterId;
      setTitle(letter.title);
      setJobTitle(letter.jobTitle);
      setCompanyName(letter.companyName);
      setContent(letter.content);
    }
  }, [letter, letterId]);

  const isDirty =
    !!letter &&
    (title !== letter.title ||
      jobTitle !== letter.jobTitle ||
      companyName !== letter.companyName ||
      content !== letter.content);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDirty) { setShowExitDialog(true); } else { navigate("/cover-letters"); }
  };

  const handleSaveConfirm = async (saveName: string, format: DownloadFormat) => {
    const finalTitle = saveName.trim() || title;
    if (finalTitle !== title) setTitle(finalTitle);

    await new Promise<void>((resolve, reject) => {
      updateLetter.mutate(
        { id: letterId, data: { title: finalTitle, jobTitle, companyName, content } },
        {
          onSuccess: (updated) => {
            queryClient.setQueryData(getGetCoverLetterQueryKey(letterId), updated);
            resolve();
          },
          onError: reject,
        }
      );
    }).catch(() => {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
      return;
    });

    setShowSaveDialog(false);

    if (format === "pdf" || format === "docx") {
      try {
        await downloadCoverLetterAs(format, finalTitle, content);
        toast({ title: "Saved & downloaded", description: `Cover letter saved and downloaded as ${format.toUpperCase()}.` });
      } catch {
        toast({ title: "Saved", description: "Cover letter saved. Download failed — try again." });
      }
    } else {
      toast({ title: "Saved", description: "Cover letter saved to your dashboard." });
    }
  };

  const handleGenerate = () => {
    const resume = resumes?.find((r) => r.id === Number(selectedResumeId));
    if (!resume && !selectedResumeId) {
      toast({ title: "Select a resume", description: "Choose a resume to base the letter on.", variant: "destructive" });
      return;
    }

    generateLetter.mutate(
      {
        data: {
          resumeContent: resume?.content || "",
          jobDescription,
          jobTitle: jobTitle || undefined,
          companyName: companyName || undefined,
          customInstructions: clCustomInstructions.trim() || undefined,
        },
      },
      {
        onSuccess: (result) => {
          setContent(result.content);
          setShowAiDialog(false);
          setJobDescription("");
          toast({ title: "Generated!", description: "Cover letter ready. Review and save." });
        },
        onError: () => {
          toast({ title: "Error", description: "Generation failed.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!letter) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">Cover letter not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-4 bg-card">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cover Letters
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAiDialog(true)}
              disabled={generateLetter.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              {generateLetter.isPending ? "Generating..." : "KI Generate"}
            </Button>
            <Button size="sm" onClick={() => setShowSaveDialog(true)} disabled={updateLetter.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateLetter.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-5 overflow-y-auto">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cover Letter Title"
            className="text-2xl font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Job Title</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Company</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Cover Letter</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your cover letter here, or use KI Generate to create one from your resume and job description…"
              minHeight="520px"
            />
          </div>
        </div>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/cover-letters")}>
              Discard & leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Write Me a Cover Letter That Gets Read</DialogTitle>
            <DialogDescription>
              Pick your resume, paste the job description, and we'll write something that actually sounds like you — not a template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Resume to base it on</Label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume..." />
                </SelectTrigger>
                <SelectContent>
                  {resumes?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Job Description</Label>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[130px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Your Instructions <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <p className="text-xs text-muted-foreground -mt-1">Tell Knighted Intelligence anything specific — tone, length, what to emphasise.</p>
              <Textarea
                placeholder={`e.g. "Keep it under 300 words", "Match the company's casual tone", "Emphasise my startup experience"`}
                value={clCustomInstructions}
                onChange={(e) => setClCustomInstructions(e.target.value)}
                className="text-sm"
                rows={3}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground text-center leading-relaxed px-1">
              🔒 Your resume and job details are used only to generate your result and are never stored by our AI service or used for training.
            </p>
            <p className="text-xs text-center leading-relaxed">
              Got feedback or ideas?{" "}
              <FeedbackDialog />
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiDialog(false)}>Cancel</Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedResumeId || !jobDescription.trim() || generateLetter.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateLetter.isPending ? "Writing your letter..." : "Write My Cover Letter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        name={title}
        content={content}
        isSaving={updateLetter.isPending}
        showTxtOption={false}
        onConfirm={handleSaveConfirm}
      />
    </AppLayout>
  );
}
