import React, { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, FileText, File } from "lucide-react";
import { PDF_TEMPLATES, TemplateId, generatePdfHtml, openPrintWindow } from "@/lib/resume-pdf-templates";
import { parseResumeContent } from "@/lib/resume-parser";
import { cn } from "@/lib/utils";

const PAPER_W = 816;
const PAPER_H = 1056;

type ExportMode = "resume" | "cover-letter";
type FormatTab = "pdf" | "docx";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ExportMode;
  title: string;
  content: string;
  jobTitle?: string;
  companyName?: string;
}

// ── Iframe preview ────────────────────────────────────────────────────────────
function TemplateIframePreview({ html, containerW, containerH }: { html: string; containerW: number; containerH: number }) {
  const scale = containerW / PAPER_W;
  return (
    <div style={{ width: containerW, height: containerH, overflow: "hidden", flexShrink: 0 }} className="rounded-sm pointer-events-none">
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{ width: PAPER_W, height: PAPER_H, transform: `scale(${scale})`, transformOrigin: "top left", border: "none", display: "block" }}
        title="Preview"
      />
    </div>
  );
}

// ── Cover letter PDF HTML ─────────────────────────────────────────────────────
function buildCoverLetterHtml(title: string, content: string, jobTitle?: string, companyName?: string): string {
  const meta = [jobTitle, companyName].filter(Boolean).join(" @ ");
  const lines = content.split("\n");
  const bodyHtml = lines.map(line => {
    if (!line.trim()) return "<p style='margin:0;height:0.8em'></p>";
    return `<p style='margin:0 0 0.15em'>${line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>")}</p>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  @page { size: letter; margin: 1.2in 1.1in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
  .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 18px; }
  .title { font-size: 16pt; font-weight: bold; margin: 0 0 4px; }
  .meta { font-size: 9.5pt; color: #555; margin: 0; }
  .body { }
  @media print {
    body { margin: 0; }
    button { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <p class="title">${title}</p>
  ${meta ? `<p class="meta">${meta}</p>` : ""}
</div>
<div class="body">${bodyHtml}</div>
</body>
</html>`;
}

// ── DOCX export ───────────────────────────────────────────────────────────────
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
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");
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

// ── Main dialog ───────────────────────────────────────────────────────────────
export function ExportDialog({ open, onOpenChange, mode, title, content, jobTitle, companyName }: ExportDialogProps) {
  const [format, setFormat] = useState<FormatTab>("pdf");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classic");
  const [isDownloading, setIsDownloading] = useState(false);

  const safeTitle = title.replace(/[/\\?%*:|"<>]/g, "-").trim() || "document";

  // Resume PDF templates
  const parsed = useMemo(() => mode === "resume" ? parseResumeContent(content) : null, [content, mode]);
  const htmlMap = useMemo(() => {
    if (mode !== "resume" || !parsed) return {};
    const map: Record<string, string> = {};
    for (const t of PDF_TEMPLATES) map[t.id] = generatePdfHtml(t.id, parsed, title);
    return map;
  }, [parsed, title, mode]);

  // Cover letter PDF html
  const clHtml = useMemo(() =>
    mode === "cover-letter" ? buildCoverLetterHtml(title, content, jobTitle, companyName) : "",
    [mode, title, content, jobTitle, companyName]
  );

  const THUMB_W = 52;
  const THUMB_H = Math.round(THUMB_W * PAPER_H / PAPER_W);
  const LARGE_W = mode === "resume" ? 480 : 560;
  const LARGE_H = Math.round(LARGE_W * PAPER_H / PAPER_W);
  const SIDEBAR_W = mode === "resume" ? 220 : 0;
  const PANEL_H = LARGE_H + 2;

  const currentPdfHtml = mode === "resume" ? htmlMap[selectedTemplate] : clHtml;

  const handlePdfExport = () => openPrintWindow(currentPdfHtml);

  const handleDocxDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadDocx(title, content);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 gap-0 overflow-hidden">
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Export "{title}"</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Choose a format to download or print your {mode === "resume" ? "resume" : "cover letter"}.
            </DialogDescription>
            {/* Format tabs */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setFormat("pdf")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  format === "pdf"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={() => setFormat("docx")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  format === "docx"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <File className="w-4 h-4" /> Word (.docx)
              </button>
            </div>
          </div>

          {/* PDF panel */}
          {format === "pdf" && (
            <>
              <div className="flex min-h-0" style={{ height: PANEL_H }}>
                {/* Template list — resume only */}
                {mode === "resume" && (
                  <div className="border-r flex flex-col overflow-y-auto shrink-0" style={{ width: SIDEBAR_W }}>
                    {PDF_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-left border-b last:border-b-0 transition-colors hover:bg-muted/50 ${
                          selectedTemplate === t.id ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="rounded-sm border border-border overflow-hidden shrink-0 shadow-sm" style={{ width: THUMB_W, height: THUMB_H }}>
                          <TemplateIframePreview html={htmlMap[t.id]} containerW={THUMB_W} containerH={THUMB_H} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{t.name}</span>
                            {selectedTemplate === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5">{t.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Preview */}
                <div className="flex-1 flex flex-col items-center justify-start bg-muted/20 overflow-hidden p-4">
                  <div className="rounded-md border border-border shadow-lg overflow-hidden bg-white" style={{ width: LARGE_W, height: LARGE_H }}>
                    <TemplateIframePreview html={currentPdfHtml} containerW={LARGE_W} containerH={LARGE_H} />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-background">
                {mode === "resume" ? (
                  <p className="text-xs text-muted-foreground">
                    <strong>{PDF_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</strong> — {PDF_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Browser print dialog will open — choose <strong>Save as PDF</strong>.</p>
                )}
                <Button onClick={handlePdfExport}>
                  <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
              </div>
            </>
          )}

          {/* DOCX panel */}
          {format === "docx" && (
            <>
              <div className="flex flex-col items-center justify-center bg-muted/20 py-16 px-8 gap-6">
                <div className="w-16 h-20 bg-white rounded-lg border-2 border-border shadow flex flex-col items-center justify-center gap-1.5">
                  <File className="w-7 h-7 text-blue-600" />
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">DOCX</span>
                </div>
                <div className="text-center max-w-md">
                  <p className="font-medium mb-1">{safeTitle}.docx</p>
                  <p className="text-sm text-muted-foreground">
                    Downloads a Word-compatible document. Open it in Microsoft Word, Google Docs, or Apple Pages.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-background">
                <Button onClick={handleDocxDownload} disabled={isDownloading}>
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? "Generating..." : "Download Word (.docx)"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
