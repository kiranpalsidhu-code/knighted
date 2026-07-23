import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, CheckCircle2 } from "lucide-react";
import { PDF_TEMPLATES, TemplateId, generatePdfHtml, openPrintWindow } from "@/lib/resume-pdf-templates";
import { parseResumeContent } from "@/lib/resume-parser";

interface ExportPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeTitle: string;
  resumeContent: string;
}

const PAPER_W = 816;
const PAPER_H = 1056;

function TemplateIframePreview({
  html,
  containerW,
  containerH,
}: {
  html: string;
  containerW: number;
  containerH: number;
}) {
  const scale = containerW / PAPER_W;
  return (
    <div
      style={{ width: containerW, height: containerH, overflow: "hidden", flexShrink: 0 }}
      className="rounded-sm pointer-events-none"
    >
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{
          width: PAPER_W,
          height: PAPER_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          border: "none",
          display: "block",
        }}
        title="Resume preview"
      />
    </div>
  );
}

export function ExportPdfDialog({ open, onOpenChange, resumeTitle, resumeContent }: ExportPdfDialogProps) {
  const [selected, setSelected] = useState<TemplateId>("classic");

  const parsed = useMemo(() => parseResumeContent(resumeContent), [resumeContent]);

  const htmlMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of PDF_TEMPLATES) {
      map[t.id] = generatePdfHtml(t.id, parsed, resumeTitle);
    }
    return map;
  }, [parsed, resumeTitle]);

  const THUMB_W = 188;
  const THUMB_H = Math.round(THUMB_W * (PAPER_H / PAPER_W));

  const LARGE_W = 500;
  const LARGE_H = Math.round(LARGE_W * (PAPER_H / PAPER_W));

  const selectedTemplate = PDF_TEMPLATES.find(t => t.id === selected)!;

  const handlePreview = () => openPrintWindow(htmlMap[selected]);
  const handleDownload = () => openPrintWindow(htmlMap[selected]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 gap-0 overflow-hidden">
        <div className="flex flex-col">
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Export as PDF</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Pick a template, then click Export PDF — your browser will open a print dialog. Choose <strong>Save as PDF</strong>.
            </DialogDescription>
          </div>

          <div className="flex min-h-0" style={{ height: LARGE_H + 2 }}>
            <div className="w-56 border-r flex flex-col overflow-y-auto shrink-0">
              {PDF_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-left border-b last:border-b-0 transition-colors hover:bg-muted/50 ${
                    selected === t.id ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                  }`}
                >
                  <div
                    className="rounded-sm border border-border overflow-hidden shrink-0 shadow-sm"
                    style={{ width: 52, height: Math.round(52 * PAPER_H / PAPER_W) }}
                  >
                    <TemplateIframePreview
                      html={htmlMap[t.id]}
                      containerW={52}
                      containerH={Math.round(52 * PAPER_H / PAPER_W)}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{t.name}</span>
                      {selected === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col items-center justify-start bg-muted/20 overflow-hidden p-4">
              <div className="rounded-md border border-border shadow-lg overflow-hidden bg-white" style={{ width: LARGE_W, height: LARGE_H }}>
                <TemplateIframePreview
                  html={htmlMap[selected]}
                  containerW={LARGE_W}
                  containerH={LARGE_H}
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-background">
            <p className="text-xs text-muted-foreground">
              <strong>{selectedTemplate.name}</strong> — {selectedTemplate.description}
            </p>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" /> Export PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
