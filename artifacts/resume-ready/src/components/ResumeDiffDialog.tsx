import { diffWords } from "diff";
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Check, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChangeSegment = {
  kind: "change";
  id: string;
  removed: string;
  added: string;
  accepted: boolean | null; // null = pending (defaults to "accept")
};
type ContextSegment = { kind: "context"; value: string };
type Segment = ContextSegment | ChangeSegment;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function parseDiff(previous: string, next: string): Segment[] {
  const parts = diffWords(previous, next);
  const segs: Segment[] = [];
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];
    if (!p.added && !p.removed) {
      segs.push({ kind: "context", value: p.value });
      i++;
    } else if (p.removed) {
      const nx = parts[i + 1];
      if (nx?.added) {
        segs.push({ kind: "change", id: uid(), removed: p.value, added: nx.value, accepted: null });
        i += 2;
      } else {
        segs.push({ kind: "change", id: uid(), removed: p.value, added: "", accepted: null });
        i++;
      }
    } else {
      // pure addition
      segs.push({ kind: "change", id: uid(), removed: "", added: p.value, accepted: null });
      i++;
    }
  }
  return segs;
}

function buildResult(segs: Segment[]): string {
  return segs
    .map((s) => {
      if (s.kind === "context") return s.value;
      // pending (null) = accepted by default
      const accept = s.accepted !== false;
      return accept ? s.added : s.removed;
    })
    .join("");
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ResumeDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousContent: string;
  nextContent: string;
  onAccept: (result: string) => void;
  onDiscard: () => void;
  acceptLabel?: string;
  discardLabel?: string;
  descriptionExtra?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ResumeDiffDialog({
  open,
  onOpenChange,
  previousContent,
  nextContent,
  onAccept,
  onDiscard,
  acceptLabel = "Apply changes",
  discardLabel = "Keep original",
  descriptionExtra,
}: ResumeDiffDialogProps) {
  const [segments, setSegments] = useState<Segment[]>([]);

  // Re-parse whenever the dialog opens or content changes
  useMemo(() => {
    if (open) setSegments(parseDiff(previousContent, nextContent));
  }, [open, previousContent, nextContent]);

  const changes = segments.filter((s): s is ChangeSegment => s.kind === "change");
  const hasChanges = changes.length > 0;
  const accepted = changes.filter((c) => c.accepted !== false).length;
  const rejected = changes.filter((c) => c.accepted === false).length;
  const pending = changes.filter((c) => c.accepted === null).length;

  const toggle = useCallback((id: string, accept: boolean) => {
    setSegments((prev) =>
      prev.map((s) =>
        s.kind === "change" && s.id === id
          ? { ...s, accepted: s.accepted === accept ? null : accept }
          : s
      )
    );
  }, []);

  const acceptAll = () =>
    setSegments((prev) =>
      prev.map((s) => (s.kind === "change" ? { ...s, accepted: true } : s))
    );

  const rejectAll = () =>
    setSegments((prev) =>
      prev.map((s) => (s.kind === "change" ? { ...s, accepted: false } : s))
    );

  const handleApply = () => onAccept(buildResult(segments));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Review AI changes
          </DialogTitle>
          <DialogDescription className="mt-1">
            {hasChanges ? (
              <>
                <span className="font-medium text-foreground">{changes.length} change{changes.length !== 1 ? "s" : ""}</span>
                {" — "}
                <span className="text-green-700 dark:text-green-400">{accepted - pending} accepted</span>
                {", "}
                <span className="text-red-600 dark:text-red-400">{rejected} rejected</span>
                {pending > 0 && <span className="text-muted-foreground">, {pending} pending</span>}
                {". Accept or reject each change, or use the buttons below."}
              </>
            ) : (
              "No changes were made."
            )}
            {descriptionExtra && (
              <span className="block mt-1 text-primary font-medium">{descriptionExtra}</span>
            )}
          </DialogDescription>
          {hasChanges && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-green-700 border-green-200 hover:bg-green-50" onClick={acceptAll}>
                <Check className="w-3 h-3" /> Accept all
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={rejectAll}>
                <X className="w-3 h-3" /> Reject all
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed whitespace-pre-wrap bg-muted/20">
          {hasChanges ? (
            segments.map((seg, i) => {
              if (seg.kind === "context") {
                return <span key={i}>{seg.value}</span>;
              }
              const { id, removed, added, accepted } = seg;
              const isPending = accepted === null;
              const isAccepted = accepted === true;
              const isRejected = accepted === false;

              return (
                <span
                  key={id}
                  className="inline-flex flex-wrap items-baseline gap-0.5 group"
                >
                  {/* Show removed text */}
                  {removed && (
                    <span
                      className={
                        isRejected
                          ? "bg-amber-50 dark:bg-amber-950/30 text-foreground border-b border-amber-300"
                          : isAccepted
                            ? "bg-red-50 dark:bg-red-950/30 text-red-400 line-through opacity-50"
                            : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 line-through"
                      }
                    >
                      {removed}
                    </span>
                  )}
                  {/* Show added text */}
                  {added && (
                    <span
                      className={
                        isRejected
                          ? "text-muted-foreground line-through opacity-40"
                          : isAccepted
                            ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : isPending
                              ? "bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200"
                              : ""
                      }
                    >
                      {added}
                    </span>
                  )}
                  {/* Accept / Reject inline buttons */}
                  <span className="inline-flex items-center gap-0.5 align-middle ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Accept this change"
                      onClick={() => toggle(id, true)}
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] border transition-colors ${
                        isAccepted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-background border-green-300 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      title="Reject this change"
                      onClick={() => toggle(id, false)}
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] border transition-colors ${
                        isRejected
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-background border-red-300 text-red-500 hover:bg-red-50"
                      }`}
                    >
                      ✕
                    </button>
                  </span>
                </span>
              );
            })
          ) : (
            <p className="text-muted-foreground">No changes were made to your content.</p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onDiscard}>
            {discardLabel}
          </Button>
          <Button onClick={handleApply} disabled={!hasChanges}>
            {acceptLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
