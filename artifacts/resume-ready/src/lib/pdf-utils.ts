/**
 * Extracts text from a PDF file using pdfjs-dist, preserving line structure
 * by using the positional (transform) data of each text item.
 *
 * The naive approach of joining all items with spaces destroys every line break
 * and section header. This implementation groups items by Y-coordinate so each
 * visual line becomes one text line, and inserts blank lines when the gap between
 * consecutive lines is large (indicating a section break or heading separator).
 */

/** Accepted MIME types and extensions for document uploads across the app. */
export const ACCEPTED_DOC_TYPES = ".pdf,.docx,.doc,.txt,.md,.rtf";

/**
 * Universal file-to-text extractor.
 * Handles PDF (pdfjs-dist), DOCX/DOC (mammoth), and plain text files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    return extractPdfText(file);
  }

  if (ext === "docx" || ext === "doc") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result.value.trim()) throw new Error("No text could be extracted from this Word document.");
    return result.value;
  }

  // Plain text variants: txt, md, rtf, csv, etc.
  if (["txt", "md", "rtf", "csv", "text"].includes(ext) || file.type.startsWith("text/")) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsText(file);
    });
  }

  throw new Error("Unsupported file type. Please upload a PDF, Word (.docx), or plain text file.");
}
export async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const tc = await page.getTextContent();

    const rawItems = (tc.items as any[]).filter(
      (it) => "str" in it && it.str.length > 0
    );
    if (rawItems.length === 0) continue;

    // Sort: top of page (highest Y in PDF coords) first, then left-to-right.
    // transform[4] = X, transform[5] = Y (origin at bottom-left of page).
    rawItems.sort((a, b) => {
      const dy = b.transform[5] - a.transform[5];
      if (Math.abs(dy) > 1.5) return dy;
      return a.transform[4] - b.transform[4];
    });

    // Group items that share the same vertical position into one line.
    const lineGroups: { y: number; parts: string[] }[] = [];
    for (const item of rawItems) {
      const y = item.transform[5];
      const last = lineGroups[lineGroups.length - 1];
      if (!last || Math.abs(y - last.y) > 2) {
        lineGroups.push({ y, parts: [item.str] });
      } else {
        // Same line: insert a space between parts when neither side has one.
        const prev = last.parts[last.parts.length - 1];
        const needsSpace =
          prev.length > 0 &&
          !prev.endsWith(" ") &&
          item.str.length > 0 &&
          !item.str.startsWith(" ");
        last.parts.push(needsSpace ? " " + item.str : item.str);
      }
    }

    // Build the page text, adding a blank line when the vertical gap between
    // consecutive lines is large (> ~1.3× typical line height ≈ 14–16 pt).
    const textLines: string[] = [];
    for (let j = 0; j < lineGroups.length; j++) {
      const lineText = lineGroups[j].parts.join("").trim();
      if (!lineText) continue;
      if (j > 0) {
        const gap = lineGroups[j - 1].y - lineGroups[j].y;
        if (gap > 15) textLines.push("");
      }
      textLines.push(lineText);
    }

    if (textLines.length > 0) pages.push(textLines.join("\n"));
  }

  return pages.join("\n\n");
}
