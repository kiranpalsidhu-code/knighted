import { ParsedResume, formatContactLine } from "./resume-parser";

export type TemplateId =
  // Single-column — centered header
  | "classic" | "indigo" | "marine" | "sage" | "rose" | "amber" | "graphite"
  // Single-column — minimal accent rule
  | "minimal" | "forest" | "steel" | "plum"
  // Single-column — compact dense
  | "compact"
  // Single-column — serif / elegant
  | "elegant"
  // Header-band
  | "executive" | "crimson" | "onyx" | "ocean"
  // Header-band — bold stripe
  | "bold" | "saffron" | "olive"
  // Sidebar — colored left panel
  | "modern" | "cobalt" | "emerald"
  // Sidebar — dark chip panel
  | "slate" | "midnight" | "ash"
  // Accent-bar — left rule + gradient
  | "sharp" | "ruby" | "azure"
  | "teal" | "violet" | "gold";

export interface PdfTemplate {
  id: TemplateId;
  name: string;
  description: string;
  accentColor: string;
  previewBg: string;
  previewAccent: string;
  layout: "single" | "sidebar" | "header-band";
  tags: string[];
}

export const PDF_TEMPLATES: PdfTemplate[] = [
  // ── Single-column: Classic family ──────────────────────────────────────────
  {
    id: "classic",
    name: "Classic",
    description: "Traditional ATS-friendly layout. Clean typography, centred header.",
    accentColor: "#1a1a1a", previewBg: "#ffffff", previewAccent: "#1a1a1a",
    layout: "single", tags: ["All", "Classic"],
  },
  {
    id: "indigo",
    name: "Indigo",
    description: "Classic single-column with an indigo accent. Perfect for tech and SaaS roles.",
    accentColor: "#4f46e5", previewBg: "#eef2ff", previewAccent: "#4f46e5",
    layout: "single", tags: ["Tech", "Modern"],
  },
  {
    id: "marine",
    name: "Marine",
    description: "Deep navy accent on a white base. Trusted look for finance and legal.",
    accentColor: "#1e3a8a", previewBg: "#eff6ff", previewAccent: "#1e3a8a",
    layout: "single", tags: ["Finance", "Classic"],
  },
  {
    id: "sage",
    name: "Sage",
    description: "Soft sage-green accents. Ideal for healthcare, non-profit and science.",
    accentColor: "#3d7a5c", previewBg: "#f0fdf4", previewAccent: "#3d7a5c",
    layout: "single", tags: ["Healthcare", "Clean"],
  },
  {
    id: "rose",
    name: "Rose",
    description: "Bold rose accent on white. Stands out for creative and marketing roles.",
    accentColor: "#be185d", previewBg: "#fdf2f8", previewAccent: "#be185d",
    layout: "single", tags: ["Creative", "Bold"],
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm amber tones. Great for hospitality, retail, and customer-facing roles.",
    accentColor: "#b45309", previewBg: "#fffbeb", previewAccent: "#b45309",
    layout: "single", tags: ["Business", "Warm"],
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Neutral graphite header line. Versatile for operations and administration.",
    accentColor: "#374151", previewBg: "#f9fafb", previewAccent: "#374151",
    layout: "single", tags: ["All", "Classic"],
  },
  // ── Single-column: Minimal family ──────────────────────────────────────────
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with thin coloured dividers and generous white space.",
    accentColor: "#2d6a4f", previewBg: "#fafafa", previewAccent: "#2d6a4f",
    layout: "single", tags: ["All", "Clean"],
  },
  {
    id: "forest",
    name: "Forest",
    description: "Forest-green rule on an airy white page. Environmental and science roles.",
    accentColor: "#166534", previewBg: "#f0fdf4", previewAccent: "#166534",
    layout: "single", tags: ["Healthcare", "Clean"],
  },
  {
    id: "steel",
    name: "Steel",
    description: "Steel-blue minimal divider. Clean choice for engineering and data.",
    accentColor: "#1d4ed8", previewBg: "#f8faff", previewAccent: "#1d4ed8",
    layout: "single", tags: ["Tech", "Clean"],
  },
  {
    id: "plum",
    name: "Plum",
    description: "Plum-purple accent rule, generous spacing. Great for product and UX roles.",
    accentColor: "#7c3aed", previewBg: "#faf5ff", previewAccent: "#7c3aed",
    layout: "single", tags: ["Creative", "Clean"],
  },
  // ── Single-column: Compact ─────────────────────────────────────────────────
  {
    id: "compact",
    name: "Compact",
    description: "Tight 9pt layout with two-column skill chips. Fits more on one page.",
    accentColor: "#374151", previewBg: "#f9fafb", previewAccent: "#374151",
    layout: "single", tags: ["Tech", "Dense"],
  },
  // ── Single-column: Elegant ─────────────────────────────────────────────────
  {
    id: "elegant",
    name: "Elegant",
    description: "Serif typography, double-rule dividers, cream tint. Academic or legal.",
    accentColor: "#8b4513", previewBg: "#fffdf7", previewAccent: "#8b4513",
    layout: "single", tags: ["Legal", "Classic"],
  },
  // ── Header-band: Executive family ─────────────────────────────────────────
  {
    id: "executive",
    name: "Executive",
    description: "Full-bleed colour header. Bold typographic hierarchy.",
    accentColor: "#7c3aed", previewBg: "#f5f3ff", previewAccent: "#7c3aed",
    layout: "header-band", tags: ["Leadership", "Modern"],
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Deep crimson header for C-suite and senior leadership resumes.",
    accentColor: "#991b1b", previewBg: "#fff1f2", previewAccent: "#991b1b",
    layout: "header-band", tags: ["Leadership", "Bold"],
  },
  {
    id: "onyx",
    name: "Onyx",
    description: "Pure black header band, maximum authority. Finance and banking.",
    accentColor: "#111827", previewBg: "#f9fafb", previewAccent: "#111827",
    layout: "header-band", tags: ["Finance", "Bold"],
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Corporate ocean-blue header. Business development and consulting.",
    accentColor: "#0369a1", previewBg: "#f0f9ff", previewAccent: "#0369a1",
    layout: "header-band", tags: ["Business", "Modern"],
  },
  // ── Header-band: Bold family ───────────────────────────────────────────────
  {
    id: "bold",
    name: "Bold",
    description: "Full-bleed coral header, strong contrast. Creative and design roles.",
    accentColor: "#c0392b", previewBg: "#fff5f5", previewAccent: "#c0392b",
    layout: "header-band", tags: ["Creative", "Bold"],
  },
  {
    id: "saffron",
    name: "Saffron",
    description: "Saffron-orange stripe header. Marketing, brand, and growth roles.",
    accentColor: "#c2820a", previewBg: "#fffbeb", previewAccent: "#c2820a",
    layout: "header-band", tags: ["Business", "Bold"],
  },
  {
    id: "olive",
    name: "Olive",
    description: "Olive-green stripe, earthy authority. Consulting and operations.",
    accentColor: "#4d7c0f", previewBg: "#f7fee7", previewAccent: "#4d7c0f",
    layout: "header-band", tags: ["Business", "Bold"],
  },
  // ── Sidebar: Modern family ────────────────────────────────────────────────
  {
    id: "modern",
    name: "Modern",
    description: "Navy sidebar for contact & skills. Right column for experience.",
    accentColor: "#1e3a5f", previewBg: "#f0f4f8", previewAccent: "#1e3a5f",
    layout: "sidebar", tags: ["Tech", "Modern"],
  },
  {
    id: "cobalt",
    name: "Cobalt",
    description: "Cobalt-blue sidebar, clean white content area. Engineering and technical.",
    accentColor: "#1d4ed8", previewBg: "#eff6ff", previewAccent: "#1d4ed8",
    layout: "sidebar", tags: ["Tech", "Modern"],
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Emerald-green sidebar. Business development and sales leadership.",
    accentColor: "#065f46", previewBg: "#ecfdf5", previewAccent: "#065f46",
    layout: "sidebar", tags: ["Business", "Modern"],
  },
  // ── Sidebar: Dark chip family ─────────────────────────────────────────────
  {
    id: "slate",
    name: "Slate",
    description: "Charcoal sidebar with monochrome skill chips. Tech-forward.",
    accentColor: "#2d3748", previewBg: "#f7fafc", previewAccent: "#2d3748",
    layout: "sidebar", tags: ["Tech", "Classic"],
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Near-black sidebar for data, analytics, and software engineering.",
    accentColor: "#1a202c", previewBg: "#f7f7f8", previewAccent: "#1a202c",
    layout: "sidebar", tags: ["Tech", "Dense"],
  },
  {
    id: "ash",
    name: "Ash",
    description: "Medium-gray sidebar chip layout. Versatile across all industries.",
    accentColor: "#52525b", previewBg: "#fafafa", previewAccent: "#52525b",
    layout: "sidebar", tags: ["All", "Classic"],
  },
  // ── Accent-bar: Sharp family ─────────────────────────────────────────────
  {
    id: "sharp",
    name: "Sharp",
    description: "Left-aligned header with a bold teal accent bar. Crisp and corporate.",
    accentColor: "#0d7377", previewBg: "#f0fafa", previewAccent: "#0d7377",
    layout: "single", tags: ["Business", "Modern"],
  },
  {
    id: "ruby",
    name: "Ruby",
    description: "Ruby-red accent bar, high energy. Creative, media, and PR roles.",
    accentColor: "#be123c", previewBg: "#fff1f2", previewAccent: "#be123c",
    layout: "single", tags: ["Creative", "Bold"],
  },
  {
    id: "azure",
    name: "Azure",
    description: "Azure accent bar, left-aligned. Tech startups and product roles.",
    accentColor: "#0284c7", previewBg: "#f0f9ff", previewAccent: "#0284c7",
    layout: "single", tags: ["Tech", "Modern"],
  },
  // ── Accent-bar: Teal gradient family ─────────────────────────────────────
  {
    id: "teal",
    name: "Teal",
    description: "Sky-teal vertical accent rule, left-aligned. Clean startup look.",
    accentColor: "#0891b2", previewBg: "#f0f9ff", previewAccent: "#0891b2",
    layout: "single", tags: ["Tech", "Clean"],
  },
  {
    id: "violet",
    name: "Violet",
    description: "Violet gradient bar, modern feel. Product management and design.",
    accentColor: "#6d28d9", previewBg: "#f5f3ff", previewAccent: "#6d28d9",
    layout: "single", tags: ["Creative", "Modern"],
  },
  {
    id: "gold",
    name: "Gold",
    description: "Warm gold gradient bar. Premium feel for finance and wealth management.",
    accentColor: "#92400e", previewBg: "#fffbeb", previewAccent: "#92400e",
    layout: "single", tags: ["Finance", "Warm"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isBullet(line: string): boolean {
  return /^[-•*▪▸►✓✗→]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim());
}

function renderItems(items: string[]): string {
  const out: string[] = [];
  let inUl = false;

  for (const raw of items) {
    const line = raw.trim();
    if (!line) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      continue;
    }
    if (isBullet(line)) {
      if (!inUl) { out.push('<ul class="bullets">'); inUl = true; }
      out.push(`<li>${esc(line.replace(/^[-•*▪▸►✓✗→]\s*/, "").replace(/^\d+\.\s*/, ""))}</li>`);
    } else {
      if (inUl) { out.push("</ul>"); inUl = false; }
      out.push(`<p class="entry-line">${esc(line)}</p>`);
    }
  }
  if (inUl) out.push("</ul>");
  return out.join("\n");
}

// Shared base styles injected into every template.
// @page margin is 0 — each template controls its own whitespace via CSS padding,
// so users never need to touch margin settings in the print dialog.
const BASE = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
@page { margin: 0mm; size: letter; }
html, body {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  color-adjust: exact;
}
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1a1a1a;
  background: #fff;
}
.bullets { padding-left: 14pt; margin: 3pt 0 5pt; }
.bullets li { margin-bottom: 2.5pt; }
.entry-line { margin-bottom: 2.5pt; }
@media print {
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`.trim();

function printHtml(title: string, bodyHtml: string, styles: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<style>
${BASE}
${styles}
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

// ── Classic ───────────────────────────────────────────────────────────────────

export function generateClassicHtml(resume: ParsedResume, title: string): string {
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header"><span>${esc(s.title.toUpperCase())}</span></div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <h1>${esc(resume.name)}</h1>
    ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
  </div>
  ${sectionsHtml}
</div>`;

  const styles = `
.page { padding: 0.65in 0.7in; min-height: 100vh; }
.header { text-align: center; margin-bottom: 14pt; padding-bottom: 10pt; border-bottom: 2pt solid #1a1a1a; }
h1 { font-size: 22pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5pt; color: #111; }
.contact { font-size: 9pt; color: #555; letter-spacing: 0.3px; }
.section { margin-bottom: 12pt; page-break-inside: avoid; }
.section-header {
  display: flex; align-items: center; gap: 8pt; margin-bottom: 6pt;
}
.section-header span {
  font-size: 9.5pt; font-weight: 700; letter-spacing: 1.8px; white-space: nowrap; color: #111;
}
.section-header::after { content: ''; flex: 1; border-top: 0.75pt solid #ccc; }
.section-body { padding-left: 1pt; }`;

  return printHtml(title, body, styles);
}

// ── Modern ────────────────────────────────────────────────────────────────────

export function generateModernHtml(resume: ParsedResume, title: string): string {
  const NAVY = "#1e3a5f";

  const sidebarSections: typeof resume.sections = [];
  const mainSections: typeof resume.sections = [];

  for (const s of resume.sections) {
    const upper = s.title.toUpperCase();
    if (
      upper.includes("SKILL") || upper.includes("LANGUAGE") ||
      upper.includes("CERT") || upper.includes("INTEREST") ||
      upper.includes("COMPETENC") || upper.includes("TECHNOLOG") ||
      upper.includes("TOOL")
    ) {
      sidebarSections.push(s);
    } else {
      mainSections.push(s);
    }
  }

  const sidebarHtml = sidebarSections.map(s => `
<div class="sb-section">
  <div class="sb-title">${esc(s.title.toUpperCase())}</div>
  ${s.items
    .flatMap(i => i.split(/[,|•·]/).map(t => t.trim()))
    .filter(Boolean)
    .map(t => `<div class="skill-chip">${esc(t)}</div>`)
    .join("")}
</div>`).join("\n");

  const mainHtml = mainSections.map(s => `
<div class="section">
  <div class="section-title">${esc(s.title.toUpperCase())}</div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const contact = resume.contact
    .flatMap(l => l.split(/\s*[|•·]\s*/))
    .map(p => p.trim())
    .filter(Boolean);

  const body = `
<div class="layout">
  <div class="sidebar">
    <div class="sb-name">${esc(resume.name)}</div>
    <div class="sb-contacts">
      ${contact.map(c => `<div class="sb-contact">${esc(c)}</div>`).join("")}
    </div>
    ${sidebarHtml}
  </div>
  <div class="main">
    ${mainHtml}
  </div>
</div>`;

  const styles = `
html, body { height: 100%; }
.layout {
  display: flex;
  min-height: 100vh;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sidebar {
  width: 195pt;
  min-width: 195pt;
  background: ${NAVY};
  color: #fff;
  padding: 0.55in 0.22in 0.55in 0.32in;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sb-name {
  font-size: 14pt; font-weight: 700; line-height: 1.3;
  margin-bottom: 8pt; word-break: break-word;
}
.sb-contacts { margin-bottom: 4pt; }
.sb-contact {
  font-size: 8pt; color: #b3c6df; margin-bottom: 3pt;
  word-break: break-all; line-height: 1.35;
}
.sb-section { margin-top: 14pt; }
.sb-title {
  font-size: 7.5pt; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: #7ab0d4;
  border-bottom: 0.75pt solid rgba(255,255,255,0.25);
  padding-bottom: 3pt; margin-bottom: 7pt;
}
.skill-chip {
  font-size: 8.5pt; color: #dceeff; margin-bottom: 4pt;
  padding-left: 9pt; position: relative; line-height: 1.35;
}
.skill-chip::before { content: '▸'; position: absolute; left: 0; color: #7ab0d4; font-size: 7pt; top: 1pt; }
.main { flex: 1; padding: 0.55in 0.45in 0.55in 0.28in; }
.section { margin-bottom: 14pt; page-break-inside: avoid; }
.section-title {
  font-size: 9pt; font-weight: 700; letter-spacing: 1.5px;
  color: ${NAVY}; border-bottom: 1.25pt solid ${NAVY};
  padding-bottom: 2pt; margin-bottom: 7pt;
}
.section-body { padding-left: 1pt; }
@media print {
  .layout { display: flex !important; min-height: 100vh !important; }
  .sidebar {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: ${NAVY} !important;
  }
}`;

  return printHtml(title, body, styles);
}

// ── Minimal ───────────────────────────────────────────────────────────────────

export function generateMinimalHtml(resume: ParsedResume, title: string): string {
  const GREEN = "#2d6a4f";
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">
    <span class="rule"></span>
    <span class="label">${esc(s.title.toUpperCase())}</span>
  </div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <h1>${esc(resume.name)}</h1>
    ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
  </div>
  ${sectionsHtml}
</div>`;

  const styles = `
.page { padding: 0.65in 0.7in; min-height: 100vh; }
.header { margin-bottom: 20pt; }
h1 { font-size: 26pt; font-weight: 300; letter-spacing: -0.3px; color: #111; margin-bottom: 5pt; }
.contact { font-size: 9pt; color: #666; }
.section { margin-bottom: 15pt; page-break-inside: avoid; }
.section-header { display: flex; align-items: center; gap: 9pt; margin-bottom: 8pt; }
.rule { flex: 0 0 24pt; border-top: 1pt solid ${GREEN}; }
.label {
  font-size: 7.5pt; font-weight: 700; letter-spacing: 2.2px;
  color: ${GREEN}; text-transform: uppercase;
}
.section-body .entry-line { color: #222; }
.bullets li { color: #333; }`;

  return printHtml(title, body, styles);
}

// ── Executive ─────────────────────────────────────────────────────────────────

export function generateExecutiveHtml(resume: ParsedResume, title: string): string {
  const PURPLE = "#7c3aed";
  const LIGHT  = "#f5f3ff";
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">${esc(s.title.toUpperCase())}</div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <h1>${esc(resume.name)}</h1>
    ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
  </div>
  <div class="content">
    ${sectionsHtml}
  </div>
</div>`;

  const styles = `
html, body { height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  background: ${PURPLE};
  color: #fff;
  padding: 0.5in 0.7in 0.35in;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
h1 { font-size: 24pt; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 5pt; }
.contact { font-size: 9pt; color: rgba(255,255,255,0.82); letter-spacing: 0.3px; }
.content { flex: 1; padding: 0.35in 0.7in 0.65in; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header {
  font-size: 9pt; font-weight: 700; letter-spacing: 1.8px;
  color: ${PURPLE}; background: ${LIGHT};
  padding: 3.5pt 8pt; border-left: 3pt solid ${PURPLE};
  margin-bottom: 7pt;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.section-body .entry-line { margin-bottom: 2.5pt; }
@media print {
  .header, .section-header {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}`;

  return printHtml(title, body, styles);
}

// ── Sharp ─────────────────────────────────────────────────────────────────────
// Left-aligned header with a thick teal left border accent. Corporate / tech.

export function generateSharpHtml(resume: ParsedResume, title: string): string {
  const TEAL = "#0d7377";
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">
    <span class="sh-bar"></span>
    <span class="sh-label">${esc(s.title.toUpperCase())}</span>
    <span class="sh-line"></span>
  </div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <div class="accent-bar"></div>
    <div class="header-text">
      <h1>${esc(resume.name)}</h1>
      ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
    </div>
  </div>
  ${sectionsHtml}
</div>`;

  const styles = `
.page { padding: 0.6in 0.7in; min-height: 100vh; }
.header { display: flex; align-items: stretch; gap: 14pt; margin-bottom: 18pt; }
.accent-bar {
  width: 5pt; min-height: 42pt; flex-shrink: 0;
  background: ${TEAL};
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.header-text { display: flex; flex-direction: column; justify-content: center; }
h1 { font-size: 24pt; font-weight: 800; letter-spacing: -0.3px; color: #0a0a0a; margin-bottom: 4pt; }
.contact { font-size: 9pt; color: #555; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header {
  display: flex; align-items: center; gap: 7pt; margin-bottom: 7pt;
}
.sh-bar { width: 4pt; height: 11pt; background: ${TEAL}; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sh-label { font-size: 9.5pt; font-weight: 700; letter-spacing: 1.4px; color: #0a0a0a; white-space: nowrap; }
.sh-line { flex: 1; border-top: 0.5pt solid #bbb; }
.section-body { padding-left: 11pt; }
@media print {
  .accent-bar, .sh-bar { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

  return printHtml(title, body, styles);
}

// ── Slate ─────────────────────────────────────────────────────────────────────
// Dark charcoal sidebar with monochrome pills. Different vibe from Modern.

export function generateSlateHtml(resume: ParsedResume, title: string): string {
  const SLATE = "#2d3748";
  const MID   = "#4a5568";

  const sidebarSections: typeof resume.sections = [];
  const mainSections: typeof resume.sections = [];

  for (const s of resume.sections) {
    const upper = s.title.toUpperCase();
    if (
      upper.includes("SKILL") || upper.includes("LANGUAGE") ||
      upper.includes("CERT") || upper.includes("TECHNOLOG") ||
      upper.includes("TOOL") || upper.includes("COMPETENC")
    ) {
      sidebarSections.push(s);
    } else {
      mainSections.push(s);
    }
  }

  const contact = resume.contact
    .flatMap(l => l.split(/\s*[|•·]\s*/))
    .map(p => p.trim())
    .filter(Boolean);

  const sidebarHtml = sidebarSections.map(s => `
<div class="sb-section">
  <div class="sb-title">${esc(s.title.toUpperCase())}</div>
  <div class="chip-wrap">
    ${s.items
      .flatMap(i => i.split(/[,|•·]/).map(t => t.trim()))
      .filter(Boolean)
      .map(t => `<span class="chip">${esc(t)}</span>`)
      .join("")}
  </div>
</div>`).join("\n");

  const mainHtml = mainSections.map(s => `
<div class="section">
  <div class="section-title">${esc(s.title.toUpperCase())}</div>
  ${renderItems(s.items)}
</div>`).join("\n");

  const body = `
<div class="layout">
  <div class="sidebar">
    <div class="sb-name">${esc(resume.name)}</div>
    <div class="sb-divider"></div>
    ${contact.map(c => `<div class="sb-contact">${esc(c)}</div>`).join("")}
    ${sidebarHtml}
  </div>
  <div class="main">${mainHtml}</div>
</div>`;

  const styles = `
html, body { height: 100%; }
.layout { display: flex; min-height: 100vh; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sidebar {
  width: 185pt; min-width: 185pt;
  background: ${SLATE};
  color: #e2e8f0;
  padding: 0.5in 0.2in 0.5in 0.28in;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.sb-name { font-size: 13.5pt; font-weight: 700; line-height: 1.25; margin-bottom: 10pt; color: #fff; }
.sb-divider { border-top: 0.75pt solid ${MID}; margin-bottom: 8pt; }
.sb-contact { font-size: 7.5pt; color: #a0aec0; margin-bottom: 3.5pt; word-break: break-all; line-height: 1.3; }
.sb-section { margin-top: 13pt; }
.sb-title {
  font-size: 7pt; font-weight: 700; letter-spacing: 1.8px;
  text-transform: uppercase; color: #718096;
  margin-bottom: 6pt;
}
.chip-wrap { display: flex; flex-wrap: wrap; gap: 4pt; }
.chip {
  font-size: 7.5pt; background: ${MID}; color: #e2e8f0;
  padding: 1.5pt 5.5pt; border-radius: 2pt; line-height: 1.4;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.main { flex: 1; padding: 0.5in 0.45in 0.5in 0.25in; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-title {
  font-size: 8.5pt; font-weight: 700; letter-spacing: 1.6px;
  color: ${SLATE}; text-transform: uppercase;
  border-bottom: 1.5pt solid ${SLATE};
  padding-bottom: 2.5pt; margin-bottom: 7pt;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
@media print {
  .sidebar { background: ${SLATE} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .chip { background: ${MID} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

  return printHtml(title, body, styles);
}

// ── Elegant ───────────────────────────────────────────────────────────────────
// Serif fonts, cream background, double-rule section dividers. Academic / legal.

export function generateElegantHtml(resume: ParsedResume, title: string): string {
  const BROWN = "#5c3317";
  const CREAM = "#fffdf5";
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">
    <div class="double-rule"></div>
    <span class="label">${esc(s.title)}</span>
    <div class="double-rule"></div>
  </div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <h1>${esc(resume.name)}</h1>
    ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
    <div class="header-rule"></div>
  </div>
  ${sectionsHtml}
</div>`;

  const styles = `
body {
  font-family: Georgia, 'Times New Roman', Times, serif;
  background: ${CREAM};
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.page { padding: 0.7in 0.75in; min-height: 100vh; background: ${CREAM}; }
.header { text-align: center; margin-bottom: 18pt; }
h1 {
  font-size: 26pt; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; color: ${BROWN}; margin-bottom: 5pt;
  font-variant: small-caps;
}
.contact { font-size: 9pt; color: #666; font-style: italic; margin-bottom: 10pt; }
.header-rule {
  border-top: 2pt solid ${BROWN};
  border-bottom: 0.5pt solid ${BROWN};
  height: 4pt;
  margin: 0 auto;
  width: 100%;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.section { margin-bottom: 14pt; page-break-inside: avoid; }
.section-header {
  display: flex; align-items: center; gap: 8pt; margin-bottom: 8pt;
}
.double-rule { flex: 1; border-top: 1.5pt double ${BROWN}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.label {
  font-size: 9pt; font-weight: 700; letter-spacing: 2px;
  color: ${BROWN}; text-transform: uppercase; white-space: nowrap;
  font-variant: small-caps;
}
.section-body { font-size: 10pt; }
.section-body .entry-line { color: #222; margin-bottom: 3pt; }
.bullets li { color: #333; }
@media print {
  body, .page { background: ${CREAM} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

  return printHtml(title, body, styles);
}

// ── Bold ──────────────────────────────────────────────────────────────────────
// Full-bleed coral/red header, high contrast. Creative industries / design.

export function generateBoldHtml(resume: ParsedResume, title: string): string {
  const CORAL  = "#c0392b";
  const LIGHT  = "#fff5f5";
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">
    <span class="label">${esc(s.title.toUpperCase())}</span>
  </div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <h1>${esc(resume.name)}</h1>
    ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
  </div>
  <div class="content">${sectionsHtml}</div>
</div>`;

  const styles = `
html, body { height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  background: ${CORAL};
  color: #fff; padding: 0.48in 0.7in 0.38in;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1 { font-size: 27pt; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 5pt; text-transform: uppercase; }
.contact { font-size: 9pt; color: rgba(255,255,255,0.85); letter-spacing: 0.3px; }
.content { flex: 1; padding: 0.3in 0.7in 0.6in; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header { margin-bottom: 6pt; }
.label {
  display: inline-block;
  font-size: 8.5pt; font-weight: 900; letter-spacing: 2px;
  text-transform: uppercase; color: #fff;
  background: ${CORAL}; padding: 2.5pt 9pt;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.section-body { padding-left: 2pt; }
.section-body .entry-line { color: #1a1a1a; }
.bullets li { color: #222; }
@media print {
  .header, .label { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

  return printHtml(title, body, styles);
}

// ── Compact ───────────────────────────────────────────────────────────────────
// Tight 9pt layout with two-column skill chips. Senior engineers / dense CVs.

export function generateCompactHtml(resume: ParsedResume, title: string): string {
  const DARK = "#374151";
  const contact = formatContactLine(resume.contact);

  const skillSections: typeof resume.sections = [];
  const otherSections: typeof resume.sections = [];

  for (const s of resume.sections) {
    const upper = s.title.toUpperCase();
    if (upper.includes("SKILL") || upper.includes("TECHNOLOG") || upper.includes("TOOL") || upper.includes("COMPETENC")) {
      skillSections.push(s);
    } else {
      otherSections.push(s);
    }
  }

  const skillsHtml = skillSections.map(s => `
<div class="skill-group">
  <div class="skill-group-title">${esc(s.title.toUpperCase())}</div>
  <div class="chip-row">
    ${s.items
      .flatMap(i => i.split(/[,|•·]/).map(t => t.trim()))
      .filter(Boolean)
      .map(t => `<span class="chip">${esc(t)}</span>`)
      .join("")}
  </div>
</div>`).join("\n");

  const mainHtml = otherSections.map(s => `
<div class="section">
  <div class="section-header"><span>${esc(s.title.toUpperCase())}</span></div>
  ${renderItems(s.items)}
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <h1>${esc(resume.name)}</h1>
    ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
  </div>
  ${skillsHtml ? `<div class="skills-block">${skillsHtml}</div>` : ""}
  ${mainHtml}
</div>`;

  const styles = `
body { font-size: 9pt; line-height: 1.38; }
.page { padding: 0.5in 0.65in; min-height: 100vh; }
.header { text-align: center; margin-bottom: 10pt; padding-bottom: 7pt; border-bottom: 1.5pt solid ${DARK}; }
h1 { font-size: 19pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #0a0a0a; margin-bottom: 3pt; }
.contact { font-size: 8pt; color: #555; }
.skills-block { margin-bottom: 9pt; padding-bottom: 7pt; border-bottom: 0.5pt solid #ddd; }
.skill-group { margin-bottom: 5pt; }
.skill-group-title { font-size: 7.5pt; font-weight: 700; letter-spacing: 1.5px; color: ${DARK}; margin-bottom: 3pt; }
.chip-row { display: flex; flex-wrap: wrap; gap: 3pt; }
.chip {
  font-size: 7.5pt; background: #f3f4f6; color: #374151;
  padding: 1pt 5pt; border: 0.5pt solid #d1d5db; border-radius: 2pt; line-height: 1.5;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.section { margin-bottom: 9pt; page-break-inside: avoid; }
.section-header {
  display: flex; align-items: center; gap: 7pt; margin-bottom: 4pt;
}
.section-header span {
  font-size: 8pt; font-weight: 700; letter-spacing: 1.5px; color: ${DARK}; white-space: nowrap;
}
.section-header::after { content: ''; flex: 1; border-top: 0.5pt solid #bbb; }
.entry-line { margin-bottom: 2pt; }
.bullets { padding-left: 12pt; margin: 2pt 0 4pt; }
.bullets li { margin-bottom: 2pt; }
@media print {
  .chip { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

  return printHtml(title, body, styles);
}

// ── Teal ──────────────────────────────────────────────────────────────────────
// Sky-teal left vertical rule, left-aligned. Clean startup / product look.

export function generateTealHtml(resume: ParsedResume, title: string): string {
  const TEAL = "#0891b2";
  const LIGHT = "#ecfeff";
  const contact = formatContactLine(resume.contact);

  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">
    <span>${esc(s.title.toUpperCase())}</span>
  </div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");

  const body = `
<div class="page">
  <div class="header">
    <div class="vbar"></div>
    <div class="header-text">
      <h1>${esc(resume.name)}</h1>
      ${contact ? `<p class="contact">${esc(contact)}</p>` : ""}
    </div>
  </div>
  <div class="rule-wrap"><div class="header-rule"></div></div>
  ${sectionsHtml}
</div>`;

  const styles = `
html, body { height: 100%; }
.page { padding: 0.6in 0.7in; min-height: 100vh; }
.header { display: flex; align-items: stretch; gap: 12pt; margin-bottom: 14pt; }
.vbar {
  width: 4pt; flex-shrink: 0; background: ${TEAL}; border-radius: 2pt;
  min-height: 40pt;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.header-text { display: flex; flex-direction: column; justify-content: center; }
h1 { font-size: 23pt; font-weight: 800; letter-spacing: -0.2px; color: #0a0a0a; margin-bottom: 4pt; }
.contact { font-size: 9pt; color: #555; }
.rule-wrap { margin-bottom: 14pt; }
.header-rule {
  height: 2.5pt; background: linear-gradient(90deg, ${TEAL} 0%, ${LIGHT} 100%);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header {
  background: ${LIGHT}; border-left: 3pt solid ${TEAL};
  padding: 3pt 8pt; margin-bottom: 7pt;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.section-header span {
  font-size: 8.5pt; font-weight: 700; letter-spacing: 1.6px; color: ${TEAL};
}
.section-body { padding-left: 2pt; }
@media print {
  .vbar, .header-rule, .section-header {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}`;

  return printHtml(title, body, styles);
}

// ── Parameterized layout builders (used by color-variant templates) ───────────
// Each builder is a lightweight re-implementation of the base layout that
// accepts a color parameter, so new variants are a single function call.

function _classicLayout(resume: ParsedResume, title: string, C: string): string {
  const contact = formatContactLine(resume.contact);
  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header"><span>${esc(s.title.toUpperCase())}</span></div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");
  const body = `<div class="page"><div class="header"><h1>${esc(resume.name)}</h1>${contact ? `<p class="contact">${esc(contact)}</p>` : ""}</div>${sectionsHtml}</div>`;
  const styles = `
.page { padding: 0.65in 0.7in; min-height: 100vh; }
.header { text-align: center; margin-bottom: 14pt; padding-bottom: 10pt; border-bottom: 2pt solid ${C}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1 { font-size: 22pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${C}; margin-bottom: 5pt; }
.contact { font-size: 9pt; color: #555; }
.section { margin-bottom: 12pt; page-break-inside: avoid; }
.section-header { display: flex; align-items: center; gap: 8pt; margin-bottom: 6pt; }
.section-header span { font-size: 9.5pt; font-weight: 700; letter-spacing: 1.8px; white-space: nowrap; color: ${C}; }
.section-header::after { content: ''; flex: 1; border-top: 0.75pt solid #ccc; }
.section-body { padding-left: 1pt; }`;
  return printHtml(title, body, styles);
}

function _minimalLayout(resume: ParsedResume, title: string, C: string): string {
  const contact = formatContactLine(resume.contact);
  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header"><span class="rule"></span><span class="label">${esc(s.title.toUpperCase())}</span></div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");
  const body = `<div class="page"><div class="header"><h1>${esc(resume.name)}</h1>${contact ? `<p class="contact">${esc(contact)}</p>` : ""}</div>${sectionsHtml}</div>`;
  const styles = `
.page { padding: 0.65in 0.7in; min-height: 100vh; }
.header { margin-bottom: 20pt; }
h1 { font-size: 26pt; font-weight: 300; color: #111; margin-bottom: 5pt; }
.contact { font-size: 9pt; color: #666; }
.section { margin-bottom: 15pt; page-break-inside: avoid; }
.section-header { display: flex; align-items: center; gap: 9pt; margin-bottom: 8pt; }
.rule { flex: 0 0 24pt; border-top: 1pt solid ${C}; }
.label { font-size: 7.5pt; font-weight: 700; letter-spacing: 2.2px; color: ${C}; text-transform: uppercase; }`;
  return printHtml(title, body, styles);
}

function _executiveBandLayout(resume: ParsedResume, title: string, C: string): string {
  const LIGHT = C + "18";
  const contact = formatContactLine(resume.contact);
  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header">${esc(s.title.toUpperCase())}</div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");
  const body = `<div class="page"><div class="header"><h1>${esc(resume.name)}</h1>${contact ? `<p class="contact">${esc(contact)}</p>` : ""}</div><div class="content">${sectionsHtml}</div></div>`;
  const styles = `
html, body { height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { min-height: 100vh; display: flex; flex-direction: column; }
.header { background: ${C}; color: #fff; padding: 0.5in 0.7in 0.35in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1 { font-size: 24pt; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 5pt; }
.contact { font-size: 9pt; color: rgba(255,255,255,0.82); }
.content { flex: 1; padding: 0.35in 0.7in 0.65in; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header { font-size: 9pt; font-weight: 700; letter-spacing: 1.8px; color: ${C}; background: ${LIGHT}; padding: 3.5pt 8pt; border-left: 3pt solid ${C}; margin-bottom: 7pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print { .header, .section-header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
  return printHtml(title, body, styles);
}

function _boldStripeLayout(resume: ParsedResume, title: string, C: string): string {
  const contact = formatContactLine(resume.contact);
  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header"><span class="label">${esc(s.title.toUpperCase())}</span></div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");
  const body = `<div class="page"><div class="header"><h1>${esc(resume.name)}</h1>${contact ? `<p class="contact">${esc(contact)}</p>` : ""}</div><div class="content">${sectionsHtml}</div></div>`;
  const styles = `
html, body { height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { min-height: 100vh; display: flex; flex-direction: column; }
.header { background: ${C}; color: #fff; padding: 0.48in 0.7in 0.38in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1 { font-size: 27pt; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 5pt; text-transform: uppercase; }
.contact { font-size: 9pt; color: rgba(255,255,255,0.85); }
.content { flex: 1; padding: 0.3in 0.7in 0.6in; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header { margin-bottom: 6pt; }
.label { display: inline-block; font-size: 8.5pt; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #fff; background: ${C}; padding: 2.5pt 9pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print { .header, .label { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
  return printHtml(title, body, styles);
}

function _modernSidebarLayout(resume: ParsedResume, title: string, C: string): string {
  const sidebar: typeof resume.sections = [];
  const main: typeof resume.sections = [];
  for (const s of resume.sections) {
    const u = s.title.toUpperCase();
    if (u.includes("SKILL") || u.includes("LANGUAGE") || u.includes("CERT") || u.includes("INTEREST") || u.includes("COMPETENC") || u.includes("TECHNOLOG") || u.includes("TOOL")) sidebar.push(s);
    else main.push(s);
  }
  const contact = resume.contact.flatMap(l => l.split(/\s*[|•·]\s*/)).map(p => p.trim()).filter(Boolean);
  const sidebarHtml = sidebar.map(s => `
<div class="sb-section"><div class="sb-title">${esc(s.title.toUpperCase())}</div>
${s.items.flatMap(i => i.split(/[,|•·]/).map(t => t.trim())).filter(Boolean).map(t => `<div class="skill-chip">${esc(t)}</div>`).join("")}
</div>`).join("\n");
  const mainHtml = main.map(s => `<div class="section"><div class="section-title">${esc(s.title.toUpperCase())}</div><div class="section-body">${renderItems(s.items)}</div></div>`).join("\n");
  const body = `<div class="layout"><div class="sidebar"><div class="sb-name">${esc(resume.name)}</div><div class="sb-contacts">${contact.map(c => `<div class="sb-contact">${esc(c)}</div>`).join("")}</div>${sidebarHtml}</div><div class="main">${mainHtml}</div></div>`;
  const styles = `
html, body { height: 100%; }
.layout { display: flex; min-height: 100vh; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sidebar { width: 195pt; min-width: 195pt; background: ${C}; color: #fff; padding: 0.55in 0.22in 0.55in 0.32in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sb-name { font-size: 14pt; font-weight: 700; line-height: 1.3; margin-bottom: 8pt; word-break: break-word; }
.sb-contacts { margin-bottom: 4pt; }
.sb-contact { font-size: 8pt; color: rgba(255,255,255,0.7); margin-bottom: 3pt; word-break: break-all; line-height: 1.35; }
.sb-section { margin-top: 14pt; }
.sb-title { font-size: 7.5pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.6); border-bottom: 0.75pt solid rgba(255,255,255,0.25); padding-bottom: 3pt; margin-bottom: 7pt; }
.skill-chip { font-size: 8.5pt; color: rgba(255,255,255,0.9); margin-bottom: 4pt; padding-left: 9pt; position: relative; line-height: 1.35; }
.skill-chip::before { content: '▸'; position: absolute; left: 0; color: rgba(255,255,255,0.5); font-size: 7pt; top: 1pt; }
.main { flex: 1; padding: 0.55in 0.45in 0.55in 0.28in; }
.section { margin-bottom: 14pt; page-break-inside: avoid; }
.section-title { font-size: 9pt; font-weight: 700; letter-spacing: 1.5px; color: ${C}; border-bottom: 1.25pt solid ${C}; padding-bottom: 2pt; margin-bottom: 7pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print { .layout { display: flex !important; } .sidebar { background: ${C} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
  return printHtml(title, body, styles);
}

function _darkChipSidebarLayout(resume: ParsedResume, title: string, D: string, M: string): string {
  const sidebar: typeof resume.sections = [];
  const main: typeof resume.sections = [];
  for (const s of resume.sections) {
    const u = s.title.toUpperCase();
    if (u.includes("SKILL") || u.includes("LANGUAGE") || u.includes("CERT") || u.includes("TECHNOLOG") || u.includes("TOOL") || u.includes("COMPETENC")) sidebar.push(s);
    else main.push(s);
  }
  const contact = resume.contact.flatMap(l => l.split(/\s*[|•·]\s*/)).map(p => p.trim()).filter(Boolean);
  const sidebarHtml = sidebar.map(s => `
<div class="sb-section"><div class="sb-title">${esc(s.title.toUpperCase())}</div>
<div class="chip-wrap">${s.items.flatMap(i => i.split(/[,|•·]/).map(t => t.trim())).filter(Boolean).map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>
</div>`).join("\n");
  const mainHtml = main.map(s => `<div class="section"><div class="section-title">${esc(s.title.toUpperCase())}</div>${renderItems(s.items)}</div>`).join("\n");
  const body = `<div class="layout"><div class="sidebar"><div class="sb-name">${esc(resume.name)}</div><div class="sb-divider"></div>${contact.map(c => `<div class="sb-contact">${esc(c)}</div>`).join("")}${sidebarHtml}</div><div class="main">${mainHtml}</div></div>`;
  const styles = `
html, body { height: 100%; }
.layout { display: flex; min-height: 100vh; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sidebar { width: 185pt; min-width: 185pt; background: ${D}; color: #e2e8f0; padding: 0.5in 0.2in 0.5in 0.28in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sb-name { font-size: 13.5pt; font-weight: 700; line-height: 1.25; margin-bottom: 10pt; color: #fff; }
.sb-divider { border-top: 0.75pt solid ${M}; margin-bottom: 8pt; }
.sb-contact { font-size: 7.5pt; color: #a0aec0; margin-bottom: 3.5pt; word-break: break-all; line-height: 1.3; }
.sb-section { margin-top: 13pt; }
.sb-title { font-size: 7pt; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: #718096; margin-bottom: 6pt; }
.chip-wrap { display: flex; flex-wrap: wrap; gap: 4pt; }
.chip { font-size: 7.5pt; background: ${M}; color: #e2e8f0; padding: 1.5pt 5.5pt; border-radius: 2pt; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.main { flex: 1; padding: 0.5in 0.45in 0.5in 0.25in; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-title { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.6px; color: ${D}; text-transform: uppercase; border-bottom: 1.5pt solid ${D}; padding-bottom: 2.5pt; margin-bottom: 7pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print { .sidebar { background: ${D} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .chip { background: ${M} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
  return printHtml(title, body, styles);
}

function _sharpAccentBarLayout(resume: ParsedResume, title: string, C: string): string {
  const contact = formatContactLine(resume.contact);
  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header"><span class="sh-bar"></span><span class="sh-label">${esc(s.title.toUpperCase())}</span><span class="sh-line"></span></div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");
  const body = `<div class="page"><div class="header"><div class="accent-bar"></div><div class="header-text"><h1>${esc(resume.name)}</h1>${contact ? `<p class="contact">${esc(contact)}</p>` : ""}</div></div>${sectionsHtml}</div>`;
  const styles = `
.page { padding: 0.6in 0.7in; min-height: 100vh; }
.header { display: flex; align-items: stretch; gap: 14pt; margin-bottom: 18pt; }
.accent-bar { width: 5pt; min-height: 42pt; flex-shrink: 0; background: ${C}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.header-text { display: flex; flex-direction: column; justify-content: center; }
h1 { font-size: 24pt; font-weight: 800; letter-spacing: -0.3px; color: #0a0a0a; margin-bottom: 4pt; }
.contact { font-size: 9pt; color: #555; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header { display: flex; align-items: center; gap: 7pt; margin-bottom: 7pt; }
.sh-bar { width: 4pt; height: 11pt; background: ${C}; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sh-label { font-size: 9.5pt; font-weight: 700; letter-spacing: 1.4px; color: #0a0a0a; white-space: nowrap; }
.sh-line { flex: 1; border-top: 0.5pt solid #bbb; }
.section-body { padding-left: 11pt; }
@media print { .accent-bar, .sh-bar { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
  return printHtml(title, body, styles);
}

function _tealGradientBarLayout(resume: ParsedResume, title: string, C: string, BG: string): string {
  const contact = formatContactLine(resume.contact);
  const sectionsHtml = resume.sections.map(s => `
<div class="section">
  <div class="section-header"><span>${esc(s.title.toUpperCase())}</span></div>
  <div class="section-body">${renderItems(s.items)}</div>
</div>`).join("\n");
  const body = `<div class="page"><div class="header"><div class="vbar"></div><div class="header-text"><h1>${esc(resume.name)}</h1>${contact ? `<p class="contact">${esc(contact)}</p>` : ""}</div></div><div class="rule-wrap"><div class="header-rule"></div></div>${sectionsHtml}</div>`;
  const styles = `
html, body { height: 100%; }
.page { padding: 0.6in 0.7in; min-height: 100vh; }
.header { display: flex; align-items: stretch; gap: 12pt; margin-bottom: 14pt; }
.vbar { width: 4pt; flex-shrink: 0; background: ${C}; border-radius: 2pt; min-height: 40pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.header-text { display: flex; flex-direction: column; justify-content: center; }
h1 { font-size: 23pt; font-weight: 800; letter-spacing: -0.2px; color: #0a0a0a; margin-bottom: 4pt; }
.contact { font-size: 9pt; color: #555; }
.rule-wrap { margin-bottom: 14pt; }
.header-rule { height: 2.5pt; background: linear-gradient(90deg, ${C} 0%, ${BG} 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.section { margin-bottom: 13pt; page-break-inside: avoid; }
.section-header { background: ${BG}; border-left: 3pt solid ${C}; padding: 3pt 8pt; margin-bottom: 7pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.section-header span { font-size: 8.5pt; font-weight: 700; letter-spacing: 1.6px; color: ${C}; }
.section-body { padding-left: 2pt; }
@media print { .vbar, .header-rule, .section-header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
  return printHtml(title, body, styles);
}

// ── Color-variant generators ──────────────────────────────────────────────────
export function generateIndigoHtml(r: ParsedResume, t: string)   { return _classicLayout(r, t, "#4f46e5"); }
export function generateMarineHtml(r: ParsedResume, t: string)   { return _classicLayout(r, t, "#1e3a8a"); }
export function generateSageHtml(r: ParsedResume, t: string)     { return _classicLayout(r, t, "#3d7a5c"); }
export function generateRoseHtml(r: ParsedResume, t: string)     { return _classicLayout(r, t, "#be185d"); }
export function generateAmberHtml(r: ParsedResume, t: string)    { return _classicLayout(r, t, "#b45309"); }
export function generateGraphiteHtml(r: ParsedResume, t: string) { return _classicLayout(r, t, "#374151"); }

export function generateForestHtml(r: ParsedResume, t: string)   { return _minimalLayout(r, t, "#166534"); }
export function generateSteelHtml(r: ParsedResume, t: string)    { return _minimalLayout(r, t, "#1d4ed8"); }
export function generatePlumHtml(r: ParsedResume, t: string)     { return _minimalLayout(r, t, "#7c3aed"); }

export function generateCrimsonHtml(r: ParsedResume, t: string)  { return _executiveBandLayout(r, t, "#991b1b"); }
export function generateOnyxHtml(r: ParsedResume, t: string)     { return _executiveBandLayout(r, t, "#111827"); }
export function generateOceanHtml(r: ParsedResume, t: string)    { return _executiveBandLayout(r, t, "#0369a1"); }

export function generateSaffronHtml(r: ParsedResume, t: string)  { return _boldStripeLayout(r, t, "#c2820a"); }
export function generateOliveHtml(r: ParsedResume, t: string)    { return _boldStripeLayout(r, t, "#4d7c0f"); }

export function generateCobaltHtml(r: ParsedResume, t: string)   { return _modernSidebarLayout(r, t, "#1d4ed8"); }
export function generateEmeraldHtml(r: ParsedResume, t: string)  { return _modernSidebarLayout(r, t, "#065f46"); }

export function generateMidnightHtml(r: ParsedResume, t: string) { return _darkChipSidebarLayout(r, t, "#1a202c", "#2d3748"); }
export function generateAshHtml(r: ParsedResume, t: string)      { return _darkChipSidebarLayout(r, t, "#52525b", "#71717a"); }

export function generateRubyHtml(r: ParsedResume, t: string)     { return _sharpAccentBarLayout(r, t, "#be123c"); }
export function generateAzureHtml(r: ParsedResume, t: string)    { return _sharpAccentBarLayout(r, t, "#0284c7"); }

export function generateVioletHtml(r: ParsedResume, t: string)   { return _tealGradientBarLayout(r, t, "#6d28d9", "#f5f3ff"); }
export function generateGoldHtml(r: ParsedResume, t: string)     { return _tealGradientBarLayout(r, t, "#92400e", "#fffbeb"); }

// ── Router & window helper ────────────────────────────────────────────────────

export function generatePdfHtml(templateId: TemplateId, resume: ParsedResume, title: string): string {
  switch (templateId) {
    // Original 10
    case "classic":   return generateClassicHtml(resume, title);
    case "modern":    return generateModernHtml(resume, title);
    case "minimal":   return generateMinimalHtml(resume, title);
    case "executive": return generateExecutiveHtml(resume, title);
    case "sharp":     return generateSharpHtml(resume, title);
    case "slate":     return generateSlateHtml(resume, title);
    case "elegant":   return generateElegantHtml(resume, title);
    case "bold":      return generateBoldHtml(resume, title);
    case "compact":   return generateCompactHtml(resume, title);
    case "teal":      return generateTealHtml(resume, title);
    // Classic-family variants
    case "indigo":    return generateIndigoHtml(resume, title);
    case "marine":    return generateMarineHtml(resume, title);
    case "sage":      return generateSageHtml(resume, title);
    case "rose":      return generateRoseHtml(resume, title);
    case "amber":     return generateAmberHtml(resume, title);
    case "graphite":  return generateGraphiteHtml(resume, title);
    // Minimal-family variants
    case "forest":    return generateForestHtml(resume, title);
    case "steel":     return generateSteelHtml(resume, title);
    case "plum":      return generatePlumHtml(resume, title);
    // Executive-band variants
    case "crimson":   return generateCrimsonHtml(resume, title);
    case "onyx":      return generateOnyxHtml(resume, title);
    case "ocean":     return generateOceanHtml(resume, title);
    // Bold-stripe variants
    case "saffron":   return generateSaffronHtml(resume, title);
    case "olive":     return generateOliveHtml(resume, title);
    // Modern sidebar variants
    case "cobalt":    return generateCobaltHtml(resume, title);
    case "emerald":   return generateEmeraldHtml(resume, title);
    // Dark-chip sidebar variants
    case "midnight":  return generateMidnightHtml(resume, title);
    case "ash":       return generateAshHtml(resume, title);
    // Sharp accent-bar variants
    case "ruby":      return generateRubyHtml(resume, title);
    case "azure":     return generateAzureHtml(resume, title);
    // Teal gradient-bar variants
    case "violet":    return generateVioletHtml(resume, title);
    case "gold":      return generateGoldHtml(resume, title);
  }
}

export function openPrintWindow(html: string): void {
  const win = window.open("", "_blank", "width=860,height=720");
  if (!win) {
    alert(
      "Popup blocked — please allow popups for this site, then try again.\n\n" +
      "In Chrome: click the blocked popup icon in the address bar → Allow."
    );
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();

  const doPrint = () => {
    win.focus();
    win.print();
  };

  if (win.document.readyState === "complete") {
    setTimeout(doPrint, 400);
  } else {
    win.addEventListener("load", () => setTimeout(doPrint, 400));
  }
}
