import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { contentToHtml } from "@/lib/content-utils";

// ─── FontSize extension ───────────────────────────────────────────────────────
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FontSize = Extension.create<any>({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFontSize: (fontSize: string) => ({ chain }: any) =>
        chain().setMark("textStyle", { fontSize }).run(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
];

const FONT_SIZES = [
  { label: "10", value: "10px" },
  { label: "11", value: "11px" },
  { label: "12", value: "12px" },
  { label: "13", value: "13px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
];

// ─── Toolbar helpers ──────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      title={title}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded text-sm transition-colors shrink-0",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const attrs = editor.getAttributes("textStyle") as {
    color?: string;
    fontFamily?: string;
    fontSize?: string;
  };
  const currentColor = attrs.color ?? "#000000";
  const currentFontFamily = attrs.fontFamily ?? "";
  const currentFontSize = attrs.fontSize ?? "";

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/20 shrink-0">
      <ToolbarBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      {/* Font family */}
      <select
        value={currentFontFamily}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            editor.chain().focus().setFontFamily(val).run();
          } else {
            editor.chain().focus().unsetFontFamily().run();
          }
        }}
        className="text-xs h-7 rounded border border-input bg-background px-1.5 text-foreground cursor-pointer max-w-[116px]"
        title="Font family"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font size */}
      <select
        value={currentFontSize}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            editor.chain().focus().setFontSize(val).run();
          } else {
            editor.chain().focus().unsetFontSize().run();
          }
        }}
        className="text-xs h-7 rounded border border-input bg-background px-1.5 text-foreground cursor-pointer w-[58px]"
        title="Font size (px)"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <Sep />

      {/* Text colour */}
      <label
        title="Text colour"
        className="inline-flex flex-col items-center justify-center w-7 h-7 rounded cursor-pointer text-foreground hover:bg-muted transition-colors gap-0 shrink-0"
      >
        <span className="text-[11px] font-bold leading-tight select-none">A</span>
        <div
          className="w-4 h-[3px] rounded-sm mt-0.5"
          style={{ backgroundColor: currentColor }}
        />
        <input
          type="color"
          value={currentColor.startsWith("#") ? currentColor : "#000000"}
          onInput={(e) =>
            editor
              .chain()
              .focus()
              .setColor((e.target as HTMLInputElement).value)
              .run()
          }
          className="sr-only"
        />
      </label>

      <Sep />

      <ToolbarBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      <ToolbarBtn
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        title="Clear formatting"
      >
        <RemoveFormatting className="w-3.5 h-3.5" />
      </ToolbarBtn>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  className,
  minHeight = "400px",
  editorRef,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-rte-empty",
      }),
    ],
    content: contentToHtml(value),
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        spellcheck: "true",
        class: "rte-prose outline-none",
        style: `min-height: ${minHeight}; padding: 1rem; font-size: 14px; line-height: 1.7;`,
      },
    },
  });

  // Sync externally-driven content changes (AI generation, file upload, version history, etc.)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incoming = contentToHtml(value);
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Expose editor instance for programmatic insertions
  useEffect(() => {
    if (editorRef) editorRef.current = editor ?? null;
    return () => {
      if (editorRef) editorRef.current = null;
    };
  }, [editor, editorRef]);

  return (
    <div
      className={cn(
        "flex flex-col border border-input rounded-md bg-background overflow-hidden",
        className
      )}
    >
      <Toolbar editor={editor ?? null} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export type { Editor };
