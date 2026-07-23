import React from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Tag, ArrowRight } from "lucide-react";
import { BLOG_POSTS } from "@/data/blog-content";
import { PublicNav } from "@/components/layout/PublicNav";
import { useSEO } from "@/hooks/use-seo";

const CATEGORY_GRADIENTS: Record<string, { bg: string }> = {
  "Resume Tips":    { bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
  "Cover Letters":  { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
  "Job Search":     { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  "Interview Tips": { bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
  "Interview Prep": { bg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" },
  "Career Growth":  { bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)" },
  "Career Advice":  { bg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" },
  "LinkedIn":       { bg: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)" },
  "ATS & Keywords": { bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
};
const DEFAULT_GRADIENT = { bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" };

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  useSEO({
    title: post ? post.title : "Blog Post",
    description: post ? post.excerpt : "Career advice and tips from the Knighted Resume team.",
    canonical: slug ? `/blog/${slug}` : "/blog",
    ogType: "article",
  });

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-4 text-center">
          <span className="text-5xl">📭</span>
          <h1 className="text-2xl font-bold">Article not found</h1>
          <p className="text-muted-foreground">This post may have been moved or removed.</p>
          <Link href="/blog" className="inline-flex items-center gap-1 text-primary underline underline-offset-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
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

  const others = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          </div>

          <div className="w-full aspect-video rounded-2xl overflow-hidden mb-10 relative flex items-center justify-center"
            style={{ background: (CATEGORY_GRADIENTS[post.category] ?? DEFAULT_GRADIENT).bg }}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15 bg-white" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10 bg-white" />
            <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-30 bg-white" />
            <span className="text-8xl drop-shadow-lg relative z-10">{post.emoji}</span>
          </div>

          <article
            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
          />

          {/* Share row */}
          <div className="mt-10 pt-8 border-t border-border flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Share this article:</span>
            <button
              onClick={() => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </button>
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy link
            </button>
          </div>

          <div className="mt-8 p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h2 className="text-2xl font-bold mb-3">Put this into practice</h2>
            <p className="text-muted-foreground mb-6">Knighted Resume gives you everything in this article — AI tailoring, cover letters, pipeline tracking — free to start.</p>
            <Link href="/sign-up">
              <button className="inline-flex items-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground h-11 px-8 hover:bg-primary/90 transition-colors">
                Try Knighted Resume Free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {others.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6">More articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {others.map((other) => (
                  <Link key={other.slug} href={`/blog/${other.slug}`}>
                    <article className="group p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                      <div className="text-3xl mb-3">{other.emoji}</div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{other.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{other.excerpt}</p>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 border-t border-border bg-background text-center mt-12">
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
