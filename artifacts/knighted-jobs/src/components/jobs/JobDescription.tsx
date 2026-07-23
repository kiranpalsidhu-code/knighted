interface JobDescriptionProps {
  text: string;
}

function renderInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function parseDescription(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) { html.push("</ul>"); inList = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    const isBullet = /^[-•*]\s+/.test(trimmed);
    const isHeader = /^(#{1,3}\s+.+|[A-Z][^a-z\n]{2,}:?\s*$|.{3,50}:\s*$)/.test(trimmed) && !isBullet;

    if (isBullet) {
      if (!inList) { html.push('<ul class="jd-list">'); inList = true; }
      const content = renderInline(trimmed.replace(/^[-•*]\s+/, ""));
      html.push(`<li>${content}</li>`);
      continue;
    }

    closeList();

    if (isHeader) {
      const level = /^#{1,3}\s+/.test(trimmed) ? trimmed.match(/^(#+)/)?.[1].length ?? 2 : 2;
      const text = renderInline(trimmed.replace(/^#{1,3}\s+/, "").replace(/:$/, ""));
      html.push(`<h${level} class="jd-heading">${text}</h${level}>`);
      continue;
    }

    html.push(`<p class="jd-para">${renderInline(trimmed)}</p>`);
  }

  closeList();
  return html.join("\n");
}

export function JobDescription({ text }: JobDescriptionProps) {
  const html = parseDescription(text);
  return (
    <div
      className="job-description"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
