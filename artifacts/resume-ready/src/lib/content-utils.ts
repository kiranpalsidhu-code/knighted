/**
 * Shared utilities for converting between plain-text and HTML editor content.
 * Safe to import in both browser and SSR contexts — DOM usage is guarded.
 */

/** Convert legacy plain-text resume/cover-letter content to HTML for the rich-text editor. */
export function contentToHtml(content: string): string {
  if (!content) return "";
  if (content.trimStart().startsWith("<")) return content; // already HTML
  return content
    .split("\n")
    .map((line) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return escaped ? `<p>${escaped}</p>` : "<p></p>";
    })
    .join("");
}

/** Strip HTML tags, preserving whitespace/newlines from block elements. */
export function htmlToPlainText(html: string): string {
  if (!html || !html.includes("<")) return html;
  const div = document.createElement("div");
  div.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/div>/gi, "\n");
  return (div.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Convert CSS color string (hex or rgb()) to a bare hex string (no #) for docx. */
export function cssColorToDocxHex(color: string): string | undefined {
  if (!color) return undefined;
  const c = color.trim();
  if (c.startsWith("#")) return c.slice(1);
  const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m)
    return [m[1], m[2], m[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("");
  return undefined;
}
