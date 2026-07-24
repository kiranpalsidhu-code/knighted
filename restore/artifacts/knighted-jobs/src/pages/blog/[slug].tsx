import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS } from "@/data/blog-content";
import { ArrowLeft, Clock, ArrowRight, BookOpen } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Negotiation": "bg-green-500/10 text-green-400 border-green-500/20",
  "Job Search": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Resume Tips": "bg-primary/10 text-primary border-primary/20",
  "Career Growth": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  if (!post) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Article not found</h1>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/blog"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishedAt,
            publisher: { "@type": "Organization", name: "Knighted Jobs" },
          }),
        }}
      />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border/50 py-12 md:py-16 px-4">
          <div className="container max-w-3xl">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground -ml-2 mb-6" asChild>
              <Link href="/blog"><ArrowLeft className="h-3.5 w-3.5" /> All Articles</Link>
            </Button>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <Badge className={`text-xs border ${CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground"}`}>
                {post.category}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {post.readTime}
              </span>
              <span className="text-xs text-muted-foreground">{fmt(post.publishedAt)}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
          </div>
        </section>

        {/* Article body */}
        <article className="container max-w-3xl py-10 px-4">
          <div
            className="prose prose-invert max-w-none
              prose-headings:font-serif prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-muted-foreground prose-li:mb-1
              prose-ul:my-4 prose-ol:my-4
              prose-strong:text-foreground prose-strong:font-semibold
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
              prose-a:text-primary prose-a:underline prose-a:underline-offset-2"
            dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
          />
        </article>

        {/* CTA */}
        <div className="container max-w-3xl px-4 pb-8">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8">
            <h2 className="text-xl font-serif font-bold mb-2">Apply what you've learned</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Browse jobs with salary transparency, check your KI Match Score, and get your resume AI-tailored in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href="/jobs">Browse Jobs with Salary</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 text-primary">
                <Link href="/salary">Salary Explorer</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="container max-w-3xl px-4 pb-16">
            <h2 className="text-xl font-serif font-bold text-foreground mb-5">More Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`}>
                  <article className="group bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all rounded-xl p-5 cursor-pointer h-full flex flex-col">
                    <Badge className={`text-xs border w-fit mb-2 ${CATEGORY_COLORS[r.category] ?? "bg-muted text-muted-foreground"}`}>
                      {r.category}
                    </Badge>
                    <h3 className="text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2 flex-1">
                      {r.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all mt-2">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
