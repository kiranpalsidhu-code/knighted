import { useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"question" | "suggestion" | "bug" | "other">("suggestion");

  const typeLabels: Record<typeof type, string> = {
    question: "Question",
    suggestion: "Suggestion",
    bug: "Bug Report",
    other: "Other",
  };

  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/resume-ready/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          feedbackType: type,
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({
        title: "Message sent — thank you!",
        description: "I read every message personally and will get back to you soon.",
      });
      setOpen(false);
      setName("");
      setEmail("");
      setMessage("");
      setType("suggestion");
    } catch {
      toast({
        title: "Couldn't send",
        description: "Something went wrong. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
            I'd love to hear from you.
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-primary" />
            Get in Touch
          </DialogTitle>
          <DialogDescription>
            Got a question, idea, or something bugging you? I read every message personally and reply to all of them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2">
            {(["question", "suggestion", "bug", "other"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-sm py-1.5 px-3 rounded-md border transition-colors ${
                  type === t
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Your Name</Label>
              <Input
                placeholder="Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Your Email</Label>
              <Input
                type="email"
                placeholder="alex@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Message</Label>
            <Textarea
              placeholder="Tell me what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!message.trim() || sending}>
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
