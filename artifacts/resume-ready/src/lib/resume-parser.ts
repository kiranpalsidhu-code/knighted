export interface ResumeSection {
  title: string;
  items: string[];
}

export interface ParsedResume {
  name: string;
  contact: string[];
  sections: ResumeSection[];
}

const SECTION_KEYWORDS = [
  "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT",
  "EDUCATION", "ACADEMIC", "QUALIFICATIONS",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "TECHNOLOGIES", "EXPERTISE",
  "SUMMARY", "PROFESSIONAL SUMMARY", "OBJECTIVE", "PROFILE", "ABOUT",
  "PROJECTS", "PERSONAL PROJECTS", "PORTFOLIO",
  "CERTIFICATIONS", "CERTIFICATES", "LICENSES",
  "AWARDS", "HONORS", "ACHIEVEMENTS",
  "LANGUAGES",
  "VOLUNTEER", "VOLUNTEERING", "COMMUNITY",
  "LEADERSHIP", "ACTIVITIES", "EXTRACURRICULAR",
  "PUBLICATIONS", "RESEARCH",
  "REFERENCES",
  "INTERESTS", "HOBBIES",
];

function isSectionHeader(line: string): boolean {
  const upper = line.toUpperCase().trim();
  if (upper.length < 2 || upper.length > 60) return false;
  if (SECTION_KEYWORDS.some(k => upper === k || upper.startsWith(k + " ") || upper.endsWith(" " + k))) return true;
  const isAllCaps = upper === line.trim() && /^[A-Z\s&/\-]+$/.test(line.trim()) && line.trim().length > 3;
  return isAllCaps;
}

function isContactLine(line: string): boolean {
  if (!line.trim()) return false;
  if (line.includes("@") && line.includes(".")) return true;
  if (/(\+?1?\s*[-.]?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/.test(line)) return true;
  if (/linkedin\.com|github\.com|portfolio\.|behance\.net|dribbble\.com/i.test(line)) return true;
  const parts = line.split(/[|•·,]/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2 && parts.length <= 6 && parts.every(p => p.length < 80)) return true;
  if (/^[A-Z][a-z]+[\s,]+[A-Z]{2,}(\s+\d{5})?$/.test(line.trim())) return true;
  return false;
}

export function parseResumeContent(raw: string): ParsedResume {
  const lines = raw.split("\n").map(l => l.trimEnd());
  const nonempty = lines.filter(l => l.trim().length > 0);

  if (nonempty.length === 0) return { name: "Your Name", contact: [], sections: [] };

  let idx = 0;
  const name = nonempty[idx++] || "Your Name";

  const contact: string[] = [];
  while (idx < nonempty.length && idx < 6) {
    if (isContactLine(nonempty[idx]) && !isSectionHeader(nonempty[idx])) {
      contact.push(nonempty[idx]);
      idx++;
    } else {
      break;
    }
  }

  const sections: ResumeSection[] = [];
  let current: ResumeSection | null = null;

  while (idx < nonempty.length) {
    const line = nonempty[idx];
    if (isSectionHeader(line)) {
      if (current) sections.push(current);
      current = { title: line.trim(), items: [] };
    } else {
      if (!current) {
        current = { title: "SUMMARY", items: [] };
      }
      current.items.push(line);
    }
    idx++;
  }
  if (current) sections.push(current);

  return { name, contact, sections };
}

export function formatContactLine(lines: string[]): string {
  return lines
    .flatMap(l => l.split(/\s*[|•·]\s*/))
    .map(p => p.trim())
    .filter(Boolean)
    .join("  •  ");
}
