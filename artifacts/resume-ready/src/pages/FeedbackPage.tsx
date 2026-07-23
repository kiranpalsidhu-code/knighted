import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useListResumes, 
  getListResumesQueryKey,
  useResumeFeedback
} from "@workspace/api-client-react";
import {
  Sparkles, FileText, CheckCircle2, ArrowRight, ClipboardCopy, Check,
  Eye, ChevronsUpDown, CheckSquare, Square, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/react";
import { cn } from "@/lib/utils";

export default function FeedbackPage() {
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [checkedIdxs, setCheckedIdxs] = useState<Set<number>>(new Set());
  const [previewQueue, setPreviewQueue] = useState<number[] | null>(null);
  const [applyingPreview, setApplyingPreview] = useState(false);

  const { data: resumes, isLoading: isLoadingResumes } = useListResumes({
    query: { queryKey: getListResumesQueryKey() }
  });

  const getFeedback = useResumeFeedback();
  const suggestions = getFeedback.data?.suggestions ?? [];

  const handleAnalyze = () => {
    if (!selectedResumeId) return;
    setCheckedIdxs(new Set());
    setPreviewQueue(null);
    getFeedback.mutate(
      { data: { resumeId: Number(selectedResumeId) } },
      {
        onError: () => {
          toast({ title: "Analysis Failed", description: "Could not generate feedback. Please try again.", variant: "destructive" });
        }
      }
    );
  };

  const toggleCheck = (idx: number) => {
    setCheckedIdxs(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const allChecked = suggestions.length > 0 && checkedIdxs.size === suggestions.length;
  const toggleAll = () => {
    setCheckedIdxs(allChecked ? new Set() : new Set(suggestions.map((_, i) => i)));
  };

  const handleCopy = (suggestion: string, idx: number) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedIdx(idx);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const applyChanges = async (idxs: number[]) => {
    if (!selectedResumeId || idxs.length === 0) return;
    setApplyingPreview(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/resume-ready/resumes/${selectedResumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load resume");
      const resume = await res.json();
      let content: string = resume.content ?? "";
      for (const idx of idxs) {
        const item = suggestions[idx];
        if (item) content = content.replace(item.bullet, (item as any).rewrite ?? item.suggestion);
      }
      const patchRes = await fetch(`/api/resume-ready/resumes/${selectedResumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      if (!patchRes.ok) throw new Error("Failed to save");
      toast({
        title: idxs.length === 1 ? "Change applied!" : `${idxs.length} changes applied!`,
        description: "Your resume has been updated."
      });
      setPreviewQueue(null);
      setCheckedIdxs(prev => { const next = new Set(prev); idxs.forEach(i => next.delete(i)); return next; });
    } catch {
      toast({
        title: "Couldn't apply",
        description: "Copy the suggestion and paste it into the editor manually.",
        variant: "destructive"
      });
    } finally {
      setApplyingPreview(false);
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
    if (score >= 5) return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
  };

  const previewItems = previewQueue?.map(i => ({ idx: i, ...suggestions[i] })).filter(Boolean) ?? [];

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analyze Resume</h1>
          <p className="text-muted-foreground text-lg">Get actionable feedback to improve your resume's impact.</p>
        </div>

        {/* Selector card */}
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-end sm:items-center gap-6">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium">Select Resume to Analyze</label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingResumes ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : resumes?.length === 0 ? (
                    <SelectItem value="none" disabled>No resumes found</SelectItem>
                  ) : (
                    resumes?.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8"
              onClick={handleAnalyze}
              disabled={!selectedResumeId || getFeedback.isPending}
            >
              {getFeedback.isPending ? "Analyzing..." : (
                <><Sparkles className="w-4 h-4 mr-2" /> Analyze Resume</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading skeletons */}
        {getFeedback.isPending && (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}

        {/* Results */}
        {suggestions.length > 0 && (
          <div className="space-y-6">
            {/* Results header + bulk toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Analysis Complete
              </h2>
              <div className="flex items-center gap-2">
                {/* Select all toggle */}
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {allChecked
                    ? <CheckSquare className="w-4 h-4 text-primary" />
                    : <Square className="w-4 h-4" />
                  }
                  {allChecked ? "Deselect all" : "Select all"}
                </button>

                {checkedIdxs.size > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setPreviewQueue(Array.from(checkedIdxs).sort((a, b) => a - b))}
                    className="gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Selected ({checkedIdxs.size})
                  </Button>
                )}
              </div>
            </div>

            {/* Suggestion cards */}
            <div className="grid gap-4">
              {suggestions.map((item, idx) => {
                const isChecked = checkedIdxs.has(idx);
                return (
                  <Card
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={cn(
                      "overflow-hidden border transition-all cursor-pointer select-none",
                      isChecked
                        ? "border-primary/60 ring-1 ring-primary/30 shadow-sm"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                      {/* Checkbox + original bullet */}
                      <div className="md:w-1/3 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleCheck(idx); }}
                              className="shrink-0 mt-0.5"
                            >
                              {isChecked
                                ? <CheckSquare className="w-4 h-4 text-primary" />
                                : <Square className="w-4 h-4 text-muted-foreground" />
                              }
                            </div>
                            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Original</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${getImpactColor(item.impact)}`}>
                            Impact: {item.impact}/10
                          </span>
                        </div>
                        <p className="text-sm bg-muted/50 p-3 rounded-md italic">"{item.bullet}"</p>
                      </div>

                      {/* Suggested improvement + actions */}
                      <div className="md:w-2/3 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                          <ArrowRight className="w-4 h-4" />
                          Suggested Improvement
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.suggestion}</p>
                        {(item as any).rewrite && (
                          <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Rewrite</p>
                            <p className="text-sm text-foreground leading-relaxed italic">"{(item as any).rewrite}"</p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy((item as any).rewrite ?? item.suggestion, idx)}
                            className="gap-1.5"
                          >
                            {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                            {copiedIdx === idx ? "Copied" : "Copy"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewQueue([idx])}
                            className="gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!getFeedback.isPending && suggestions.length === 0 && (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 opacity-50" />
            </div>
            <p>Select a resume and click Analyze to see suggested improvements.</p>
          </div>
        )}
      </div>

      {/* ── Preview Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!previewQueue} onOpenChange={(open) => { if (!open) setPreviewQueue(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {previewItems.length === 1 ? "Preview Change" : `Preview ${previewItems.length} Changes`}
            </DialogTitle>
            <DialogDescription>
              Review {previewItems.length === 1 ? "this improvement" : "these improvements"} before applying {previewItems.length === 1 ? "it" : "them"} to your resume.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {previewItems.map((item) => item && (
              <div key={item.idx} className="rounded-xl border border-border overflow-hidden">
                {/* Before */}
                <div className="bg-red-50 dark:bg-red-950/20 px-4 py-3 border-b border-border">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5 flex items-center gap-1.5">
                    <X className="w-3 h-3" /> Before
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">"{item.bullet}"</p>
                </div>
                {/* After */}
                <div className="bg-green-50 dark:bg-green-950/20 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1.5 flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> After
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{(item as any).rewrite ?? item.suggestion}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button variant="outline" onClick={() => setPreviewQueue(null)} disabled={applyingPreview}>
              Cancel
            </Button>
            <Button
              onClick={() => applyChanges(previewQueue ?? [])}
              disabled={applyingPreview}
              className="gap-2"
            >
              {applyingPreview ? (
                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Applying…</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> Apply {previewItems.length === 1 ? "Change" : `${previewItems.length} Changes`}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
