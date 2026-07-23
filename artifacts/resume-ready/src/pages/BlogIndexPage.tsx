import React from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { BLOG_POSTS } from "@/data/blog-content";
import { PublicNav } from "@/components/layout/PublicNav";
import { useSEO } from "@/hooks/use-seo";

const CATEGORY_GRADIENTS: Record<string, { bg: string; glow: string }> = {
  "Resume Tips":    { bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", glow: "rgba(139,92,246,0.35)" },
  "Cover Letters":  { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", glow: "rgba(16,185,129,0.35)" },
  "Job Search":     { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", glow: "rgba(245,158,11,0.35)" },
  "Interview Tips": { bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", glow: "rgba(124,58,237,0.35)" },
  "Interview Prep": { bg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", glow: "rgba(109,40,217,0.35)" },
  "Career Growth":  { bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", glow: "rgba(14,165,233,0.35)" },
  "Career Advice":  { bg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)", glow: "rgba(20,184,166,0.35)" },
  "LinkedIn":       { bg: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)", glow: "rgba(10,102,194,0.35)" },
  "ATS & Keywords": { bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", glow: "rgba(59,130,246,0.35)" },
};
const DEFAULT_GRADIENT = { bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", glow: "rgba(99,102,241,0.35)" };

function BlogCoverImage({ emoji, category, size = "list" }: { emoji: string; category: string; size?: "list" | "hero" }) {
  const g = CATEGORY_GRADIENTS[category] ?? DEFAULT_GRADIENT;
  const emojiSize = size === "hero" ? "text-7xl" : "text-4xl";
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center" style={{ background: g.bg }}>
      {/* Decorative circle in corner */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 bg-white" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 bg-white" />
      {/* Glow behind emoji */}
      <div className="absolute w-16 h-16 rounded-full blur-xl" style={{ background: "rgba(255,255,255,0.3)" }} />
      <span className={`${emojiSize} relative z-10 drop-shadow-lg`}>{emoji}</span>
    </div>
  );
}

export default function BlogIndexPage() {
  useSEO({
    title: "Career Advice & Resume Tips Blog",
    description: "Expert articles on resume writing, ATS optimisation, job searching, and interview prep from the Knighted Resume team.",
    canonical: "/blog",
  });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Career Advice & Tips</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Knighted Resume Blog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Practical advice on resumes, job applications, and navigating your job search — written for ambitious professionals.
            </p>
          </div>

          <div className="grid gap-8">
            {BLOG_POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-background cursor-pointer">
                  <div className="md:w-48 flex-shrink-0">
                    <div className="aspect-video md:aspect-square rounded-xl overflow-hidden">
                      <BlogCoverImage emoji={post.emoji} category={post.category} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        <Tag className="w-3 h-3" />
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      Read article <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to put this into practice?</h2>
            <p className="text-muted-foreground mb-6">Knighted Resume gives you the tools to apply everything you've read — AI resume tailoring, pipeline tracking, and more.</p>
            <Link href="/sign-up">
              <button className="inline-flex items-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground h-11 px-8 hover:bg-primary/90 transition-colors">
                Start for Free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
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
