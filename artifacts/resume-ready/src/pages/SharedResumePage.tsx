import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "wouter";
import { generatePdfHtml, PDF_TEMPLATES, type TemplateId } from "@/lib/resume-pdf-templates";
import { parseResumeContent } from "@/lib/resume-parser";
import { FileText, ChevronDown, Download } from "lucide-react";

export default function SharedResumePage() {
  const { token } = useParams<{ token: string }>();
  const [resume, setResume] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/resume-ready/public/resumes/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject("not_found"))
      .then(data => setResume(data))
      .catch(() => setError("This resume link is invalid or has been revoked."))
      .finally(() => setLoading(false));
  }, [token]);

  const html = useMemo(() => {
    if (!resume?.content) return "";
    return generatePdfHtml(templateId, parseResumeContent(resume.content), resume.title || "Resume");
  }, [resume, templateId]);

  // Scale the 816px wide letter iframe to fit the container
  useEffect(() => {
    const measure = () => {
      const container = iframeRef.current?.parentElement;
      if (!container) return;
      const w = container.clientWidth;
      setScale(Math.min(1, w / 816));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [html]);

  const handleDownload = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Shared Resume</p>
            {resume && <h1 className="text-base font-semibold text-foreground truncate leading-tight">{resume.title}</h1>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Download PDF */}
            <button
              onClick={handleDownload}
              disabled={!html}
              className="inline-flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg px-3 py-1.5 bg-white hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />
              Download PDF
            </button>

            {/* Template picker */}
            <div className="relative">
              <button
                onClick={() => setTemplatePickerOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg px-3 py-1.5 bg-white hover:bg-muted/50 transition-colors"
              >
                {PDF_TEMPLATES.find((t) => t.id === templateId)?.name ?? "Classic"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {templatePickerOpen && (
                <div className="absolute right-0 mt-1 z-50 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                  {PDF_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTemplateId(t.id as TemplateId); setTemplatePickerOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/60 transition-colors ${templateId === t.id ? "font-semibold text-primary" : ""}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="/" className="text-sm text-primary underline underline-offset-2 font-medium">
              Build yours free →
            </a>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        {loading && (
          <div className="mt-20 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading resume…</p>
          </div>
        )}

        {error && (
          <div className="mt-20 max-w-md text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Link not found</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {html && (
          <div
            className="bg-white shadow-xl rounded-sm"
            style={{ width: 816 * scale, height: "auto", maxWidth: "100%" }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={html}
              title={resume?.title || "Resume"}
              style={{
                width: 816,
                height: 1056,
                border: "none",
                transformOrigin: "top left",
                transform: `scale(${scale})`,
                display: "block",
              }}
            />
          </div>
        )}

        {html && (
          <p className="mt-6 text-xs text-muted-foreground">
            Powered by{" "}
            <a href="/" className="text-primary underline underline-offset-2 font-medium">
              Knighted Resume
            </a>
          </p>
        )}
      </main>
    </div>
  );
}
