import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, BookOpen, ExternalLink } from "lucide-react";
import { useCreateCoverLetter } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface CoverLetterResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  resumeTitle: string;
  onNavigateToCoverLetters: () => void;
}

export function CoverLetterResultDialog({
  open,
  onOpenChange,
  content,
  resumeTitle,
  onNavigateToCoverLetters,
}: CoverLetterResultDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const createCoverLetter = useCreateCoverLetter();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Cover letter copied to clipboard." });
  };

  const handleSave = () => {
    createCoverLetter.mutate(
      { data: { title: `Cover Letter – ${resumeTitle}`, content } },
      {
        onSuccess: () => {
          setSaved(true);
          toast({
            title: "Saved",
            description: "Cover letter saved to your Cover Letters section.",
          });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save cover letter.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Your Cover Letter
          </DialogTitle>
          <DialogDescription>
            AI-generated and tailored to the job description. Review, edit if needed, then copy or save it.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          className="flex-1 resize-none text-sm leading-relaxed min-h-[320px] bg-muted/20"
          value={content}
          readOnly
        />

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={createCoverLetter.isPending || saved}
            >
              {saved ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <BookOpen className="w-4 h-4 mr-2" />}
              {createCoverLetter.isPending ? "Saving…" : saved ? "Saved!" : "Save to Cover Letters"}
            </Button>
          </div>
          <div className="flex gap-2">
            {saved && (
              <Button variant="ghost" size="sm" onClick={onNavigateToCoverLetters}>
                <ExternalLink className="w-4 h-4 mr-1.5" /> View Cover Letters
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
