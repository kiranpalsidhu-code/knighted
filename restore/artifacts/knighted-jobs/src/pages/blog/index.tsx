import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS } from "@/data/blog-content";
import { ArrowRight, BookOpen, Clock, TrendingUp, Briefcase, FileText, Star } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Negotiation": "bg-green-500/10 text-green-400 border-green-500/20",
  "Job Search": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Resume Tips": "bg-primary/10 text-primary border-primary/20",
  "Career Growth": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const CATEGORY_FALLBACK: Record<string, { gradient: string; Icon: React.ElementType }> = {
  "Salary & Negotiation": { gradient: "from-green-600 to-emerald-400", Icon: TrendingUp },
  "Job Search":           { gradient: "from-blue-600 to-sky-400",   Icon: Briefcase  },
  "Resume Tips":          { gradient: "from-primary to-violet-400", Icon: FileText   },
  "Career Growth":        { gradient: "from-purple-600 to-pink-400",Icon: Star       },
};

function CoverImage({ post, className }: { post: typeof import("@/data/blog-content").BLOG_POSTS[number]; className?: string }) {
  if (post.imageUrl) {
    return (
      <img
        src={post.imageUrl}
        alt={post.title}
        className={`object-cover ${className ?? ""}`}
        loading="lazy"
      />
    );
  }
  const fallback = CATEGORY_FALLBACK[post.category] ?? { gradient: "from-primary to-violet-400", Icon: BookOpen };
  const Icon = fallback.Icon;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${fallback.gradient} ${className ?? ""}`}>
      <Icon className="h-14 w-14 text-white/80" />
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function BlogIndexPage() {
  useSEO({
    title: "Career Advice — Salary Negotiation, Job Search Tips & More",
    description: "Expert career advice for ambitious professionals. Salary negotiation strategies, job search tactics, resume tips, and career growth guides.",
    canonical: "/blog",
  });
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border/50 py-16 md:py-20 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Career Advice
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4 text-foreground">
            Knighted Jobs Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Practical career advice for ambitious professionals — salary negotiation, job search strategy, and resume tips.
          </p>
        </section>

        <div className="container max-w-5xl py-12 px-4">
          {/* Featured post */}
          <Link href={`/blog/${featured.slug}`}>
            <article className="group mb-10 bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all rounded-2xl p-8 cursor-pointer">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={`text-xs border ${CATEGORY_COLORS[featured.category] ?? "bg-muted text-muted-foreground"}`}>
                      {featured.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featured.readTime}
                    </span>
                    <span className="text-xs text-muted-foreground">{fmt(featured.publishedAt)}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-primary text-sm font-medium group-hover:gap-2.5 transition-all">
                    Read article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="md:w-48 md:h-48 rounded-xl overflow-hidden shrink-0">
                  <CoverImage post={featured} className="w-full h-full" />
                </div>
              </div>
            </article>
          </Link>

          {/* Rest of posts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="group bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all rounded-xl overflow-hidden cursor-pointer h-full flex flex-col">
                  <div className="h-40 overflow-hidden">
                    <CoverImage post={post} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge className={`text-xs border ${CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground"}`}>
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 text-primary text-sm font-medium group-hover:gap-2.5 transition-all mt-auto">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-serif font-bold mb-2">Ready to put this advice into action?</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Search roles with disclosed salaries, use KI Match Score to rate your fit, and tailor your resume in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 text-primary">
                <Link href="/salary">Explore Salaries</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
