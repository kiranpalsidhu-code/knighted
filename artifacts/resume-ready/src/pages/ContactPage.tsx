import React, { useState } from "react";
import { Link } from "wouter";
import { Mail, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PublicNav } from "@/components/layout/PublicNav";

export default function ContactPage() {
  useSEO({
    title: "Contact Us",
    description: "Get in touch with the Knighted Resume team. We typically respond within one business day.",
    canonical: "/contact",
  });
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/resume-ready/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, feedbackType: "question" }),
      });

      if (!res.ok) throw new Error("Failed");

      setSentToEmail(email);
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast({ title: "Failed to send", description: "Please email us directly at support@theknightedresume.com", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Get in touch</h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">Have a question, found a bug, or want to share feedback? We read every message.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email us directly</h3>
                  <a href="mailto:support@theknightedresume.com" className="text-primary underline underline-offset-2">support@theknightedresume.com</a>
                  <p className="text-sm text-muted-foreground mt-1">For billing, account issues, and data requests.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Response time</h3>
                  <p className="text-muted-foreground">We typically reply within 1–2 business days.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Common topics</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Billing and subscription questions</li>
                    <li>• Account deletion requests</li>
                    <li>• Bug reports and feature requests</li>
                    <li>• Privacy and data questions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-2xl border border-border p-8">
              {sent ? (
                <div className="flex flex-col items-center text-center gap-4 py-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Message sent!</h2>
                    <p className="text-muted-foreground text-sm">
                      We'll get back to you at <strong>{sentToEmail}</strong> within 1–2 business days.
                    </p>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="text-sm text-primary underline underline-offset-2 mt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" placeholder="Alex Rivera" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Tell us what's on your mind..." rows={5} value={message} onChange={e => setMessage(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border bg-background text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Knighted Resume</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
