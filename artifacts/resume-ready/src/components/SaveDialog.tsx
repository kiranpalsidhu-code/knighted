import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, FileText, FileType2, Printer, Check } from "lucide-react";
import { generatePdfHtml, openPrintWindow, PDF_TEMPLATES, type TemplateId } from "@/lib/resume-pdf-templates";
import { parseResumeContent } from "@/lib/resume-parser";
import { htmlToPlainText, cssColorToDocxHex } from "@/lib/content-utils";

export type DownloadFormat = "cloud" | "txt" | "docx" | "pdf";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  content: string;
  isSaving: boolean;
  isUploadedReplacement?: boolean;
  showTxtOption?: boolean;
  onConfirm: (name: string, format: DownloadFormat, pdfTemplate?: TemplateId) => void;
}

const BASE_FORMAT_OPTIONS: {
  id: DownloadFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  txtOnly?: boolean;
}[] = [
  {
    id: "cloud",
    label: "Dashboard only",
    description: "Save to your dashboard — no file download.",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Styled document — pick a template below.",
    icon: <Printer className="w-5 h-5" />,
  },
  {
    id: "docx",
    label: "Word (.docx)",
    description: "Editable document for Word or Google Docs.",
    icon: <FileType2 className="w-5 h-5" />,
  },
  {
    id: "txt",
    label: "Plain text (.txt)",
    description: "Simple text file, great for ATS copy-paste.",
    icon: <FileText className="w-5 h-5" />,
    txtOnly: true,
  },
];

export function SaveDialog({
  open,
  onOpenChange,
  name,
  content,
  isSaving,
  isUploadedReplacement = false,
  showTxtOption = true,
  onConfirm,
}: SaveDialogProps) {
  const [editedName, setEditedName] = useState(name);
  const [format, setFormat] = useState<DownloadFormat>("cloud");
  const [pdfTemplate, setPdfTemplate] = useState<TemplateId>("classic");

  useEffect(() => {
    if (open) {
      setEditedName(name);
      setFormat("cloud");
    }
  }, [open, name]);

  const formatOptions = BASE_FORMAT_OPTIONS.filter(o => showTxtOption || !o.txtOnly);

  const handleConfirm = () => {
    const finalName = editedName.trim() || name;
    onConfirm(finalName, format, format === "pdf" ? pdfTemplate : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Save</DialogTitle>
          <DialogDescription>
            {isUploadedReplacement
              ? "Your document will be saved as a new entry. Choose a name and whether to download a copy."
              : "Choose a name and whether to also download a copy."}
          </DialogDescription>
        </DialogHeader>

        {/* Name field */}
        <div className="space-y-1.5 pb-1">
          <Label htmlFor="save-name" className="text-sm font-medium">Save as</Label>
          <Input
            id="save-name"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Enter a name…"
            autoFocus
          />
        </div>

        {/* Format options */}
        <div className="flex flex-col gap-2 py-1">
          {formatOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFormat(opt.id)}
              className={[
                "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                format === opt.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              ].join(" ")}
            >
              <span className={format === opt.id ? "text-primary" : "text-muted-foreground"}>
                {opt.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
              {format === opt.id && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>

        {format === "pdf" && showTxtOption && (
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template</p>
            <div className="flex flex-wrap gap-1.5">
              {PDF_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPdfTemplate(t.id)}
                  className={[
                    "text-xs px-2.5 py-1 rounded-md border font-medium transition-colors",
                    pdfTemplate === t.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-muted-foreground/40",
                  ].join(" ")}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Your browser's print dialog will open — choose <strong>Save as PDF</strong>.
            </p>
          </div>
        )}

        {format === "pdf" && !showTxtOption && (
          <p className="text-xs text-muted-foreground pt-1">
            Your browser's print dialog will open — choose <strong>Save as PDF</strong>.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving || !editedName.trim()}>
            {isSaving ? "Saving…" : format === "cloud" ? "Save to dashboard" : "Save & Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── HTML → docx paragraph converter ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDocxFromHtml(html: string, Paragraph: any, TextRun: any, HeadingLevel: any): any[] {
  // Recursively collect TextRun objects from a DOM node tree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseNodes(node: Node, style: Record<string, any> = {}): any[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text) return [];
      return [new TextRun({ text, ...style })];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as HTMLElement;
    const tag = el.tagName;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next: Record<string, any> = { ...style };

    if (tag === "STRONG" || tag === "B") next.bold = true;
    if (tag === "EM" || tag === "I") next.italics = true;
    if (tag === "U") next.underline = {};
    if (tag === "S" || tag === "STRIKE" || tag === "DEL") next.strike = true;
    if (el.style?.color) {
      const hex = cssColorToDocxHex(el.style.color);
      if (hex) next.color = hex;
    }
    if (el.style?.fontSize) {
      const px = parseFloat(el.style.fontSize);
      if (!isNaN(px)) next.size = Math.round(px * 2); // half-points
    }
    if (el.style?.fontFamily) {
      next.font = el.style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runs: any[] = [];
    for (const child of el.childNodes) runs.push(...parseNodes(child, next));
    return runs;
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paragraphs: any[] = [];

  for (const child of root.children) {
    const tag = child.tagName;
    if (tag === "UL" || tag === "OL") {
      for (const li of child.querySelectorAll(":scope > li")) {
        const runs = parseNodes(li);
        paragraphs.push(
          new Paragraph({
            ...(tag === "UL" ? { bullet: { level: 0 } } : {}),
            children: runs.length ? runs : [new TextRun({ text: "" })],
          })
        );
      }
    } else {
      const heading =
        tag === "H1" ? HeadingLevel.HEADING_1 :
        tag === "H2" ? HeadingLevel.HEADING_2 :
        tag === "H3" ? HeadingLevel.HEADING_3 :
        tag === "H4" ? HeadingLevel.HEADING_4 :
        null;
      const runs = parseNodes(child);
      paragraphs.push(
        new Paragraph({
          ...(heading ? { heading } : {}),
          children: runs.length ? runs : [new TextRun({ text: "" })],
        })
      );
    }
  }

  return paragraphs;
}

export async function downloadResumeAs(
  format: DownloadFormat,
  title: string,
  content: string,
  pdfTemplate: TemplateId = "classic",
) {
  const safeTitle = title.replace(/[^a-z0-9_\- ]/gi, "").trim() || "resume";
  const plainContent = htmlToPlainText(content);

  if (format === "txt") {
    const blob = new Blob([plainContent], { type: "text/plain" });
    triggerDownload(blob, `${safeTitle}.txt`);
    return;
  }

  if (format === "pdf") {
    const parsed = parseResumeContent(plainContent);
    const html = generatePdfHtml(pdfTemplate, parsed, title);
    openPrintWindow(html);
    return;
  }

  if (format === "docx") {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
    const paragraphs = buildDocxFromHtml(content, Paragraph, TextRun, HeadingLevel);
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const buffer = await Packer.toBlob(doc);
    triggerDownload(buffer, `${safeTitle}.docx`);
  }
}

export async function downloadCoverLetterAs(
  format: Exclude<DownloadFormat, "cloud" | "txt">,
  name: string,
  content: string,
) {
  const safeTitle = name.replace(/[^a-z0-9_\- ]/gi, "").trim() || "cover-letter";

  if (format === "pdf") {
    // content is now HTML from the rich-text editor — use it directly in the print template
    const bodyHtml = content.trimStart().startsWith("<")
      ? content
      : content
          .split(/\n{2,}/)
          .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
          .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.7;
             color: #1a1a1a; max-width: 680px; margin: 48px auto; padding: 0 24px; }
      p { margin-bottom: 1em; }
      strong { font-weight: 700; }
      em { font-style: italic; }
      u { text-decoration: underline; }
      ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
      ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
      @media print { body { margin: 0; } }
    </style></head><body>${bodyHtml}</body></html>`;
    openPrintWindow(html);
    return;
  }

  if (format === "docx") {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
    const paragraphs = buildDocxFromHtml(content, Paragraph, TextRun, HeadingLevel);
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const buffer = await Packer.toBlob(doc);
    triggerDownload(buffer, `${safeTitle}.docx`);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
