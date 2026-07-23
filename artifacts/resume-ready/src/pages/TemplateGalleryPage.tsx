import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, LayoutTemplate, Columns2, Rows3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/PublicNav";
import { PDF_TEMPLATES, PdfTemplate } from "@/lib/resume-pdf-templates";

// ── Visual mockup renderer ────────────────────────────────────────────────────
// Uses the template's `layout` field to pick the right chrome; accent colors
// provide the visual differentiation between color variants.

function TemplateMockup({ tpl }: { tpl: PdfTemplate }) {
  const { accentColor, previewBg, layout, id } = tpl;

  if (layout === "sidebar") {
    const isDark = id === "slate" || id === "midnight" || id === "ash";
    return (
      <div className="w-full h-full flex rounded-lg overflow-hidden" style={{ background: previewBg }}>
        <div className="w-[34%] flex flex-col gap-1.5 p-2" style={{ background: accentColor }}>
          <div className="w-7 h-7 rounded-full bg-white/25 mx-auto mt-0.5 flex-shrink-0" />
          <div className="h-1 rounded bg-white/55 mt-1" />
          <div className="h-0.5 rounded bg-white/35" />
          <div className="h-0.5 rounded bg-white/35 w-3/4" />
          <div className="mt-1.5 h-px rounded bg-white/20" />
          {isDark ? (
            // Chip-style pills for dark sidebar
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {[3, 4, 3, 2].map((w, i) => (
                <div key={i} className="h-2 rounded-sm bg-white/20" style={{ width: `${w * 8}px` }} />
              ))}
            </div>
          ) : (
            // Bullet-style lines for colored sidebar
            <>
              <div className="h-0.5 rounded bg-white/25 w-2/3 mt-0.5" />
              <div className="h-0.5 rounded bg-white/25 w-1/2" />
              <div className="h-0.5 rounded bg-white/25 w-3/4" />
            </>
          )}
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          <div className="h-1.5 rounded w-[70%]" style={{ background: accentColor, opacity: 0.75 }} />
          <div className="h-px w-full" style={{ background: accentColor, opacity: 0.3 }} />
          {[100, 83, 67, 92, 75].map((w, i) => (
            <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
          ))}
          <div className="h-px w-full mt-0.5" style={{ background: accentColor, opacity: 0.25 }} />
          {[88, 70].map((w, i) => (
            <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (layout === "header-band") {
    const isBoldStripe = id === "bold" || id === "saffron" || id === "olive";
    return (
      <div className="w-full h-full flex flex-col rounded-lg overflow-hidden" style={{ background: previewBg }}>
        <div className={`flex items-center gap-2 px-3 ${isBoldStripe ? "h-8" : "h-1/4 flex-col justify-center"}`}
          style={{ background: accentColor }}>
          {isBoldStripe ? (
            <>
              <div className="h-2 rounded bg-white/80 w-1/3" />
              <div className="ml-auto h-1 rounded bg-white/50 w-1/4" />
            </>
          ) : (
            <>
              <div className="h-2 rounded bg-white/80 w-2/3" />
              <div className="h-1 rounded bg-white/55 w-1/2" />
              <div className="h-0.5 rounded bg-white/35 w-3/4" />
            </>
          )}
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          {/* Colored section label chip */}
          <div className="h-1 rounded w-1/3 mt-0.5" style={{ background: accentColor, opacity: 0.8 }} />
          {[100, 83, 67].map((w, i) => (
            <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
          ))}
          <div className="h-1 rounded w-2/5 mt-0.5" style={{ background: accentColor, opacity: 0.8 }} />
          {[92, 75].map((w, i) => (
            <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── single-column family ───────────────────────────────────────────────────
  const isMinimalFamily = id === "minimal" || id === "forest" || id === "steel" || id === "plum";
  const isElegant = id === "elegant";
  const isCompact = id === "compact";
  const isSharpFamily = id === "sharp" || id === "ruby" || id === "azure";
  const isTealFamily = id === "teal" || id === "violet" || id === "gold";

  if (isElegant) {
    return (
      <div className="w-full h-full flex flex-col rounded-lg overflow-hidden p-2 gap-1" style={{ background: previewBg }}>
        <div className="flex flex-col items-center gap-0.5 pb-1">
          <div className="h-1.5 rounded w-2/3 bg-gray-700" />
          <div className="h-0.5 rounded w-1/2 bg-gray-400" />
          <div className="h-px w-full mt-0.5" style={{ background: accentColor }} />
          <div className="h-px w-full" style={{ background: accentColor, opacity: 0.4 }} />
        </div>
        <div className="flex flex-col gap-1.5 mt-0.5">
          {[["1/3", 0.65], ["full", 0.2]].flatMap(([lw, lo], si) => [
            <div key={`label-${si}`} className="h-0.5 rounded" style={{ background: accentColor, opacity: lo as number, width: lw as string }} />,
            ...[100, 83].map((w, i) => (
              <div key={`line-${si}-${i}`} className="h-0.5 rounded bg-gray-300" style={{ width: `${w}%` }} />
            )),
          ])}
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="w-full h-full flex flex-col rounded-lg overflow-hidden p-1.5 gap-1" style={{ background: previewBg }}>
        <div className="px-0.5 mb-0.5">
          <div className="h-1.5 rounded w-1/2 bg-gray-700 mb-0.5" />
          <div className="h-px w-full" style={{ background: accentColor }} />
        </div>
        {/* Chip row */}
        <div className="flex gap-0.5 flex-wrap">
          {[3, 4, 3, 5, 3].map((w, i) => (
            <div key={i} className="h-1.5 rounded-sm bg-gray-200" style={{ width: `${w * 6}px` }} />
          ))}
        </div>
        <div className="h-px" style={{ background: accentColor, opacity: 0.3 }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${75 + (i % 3) * 7}%` }} />
        ))}
      </div>
    );
  }

  if (isSharpFamily) {
    return (
      <div className="w-full h-full flex flex-col rounded-lg overflow-hidden p-2 gap-1.5" style={{ background: previewBg }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-1 h-8 rounded-sm flex-shrink-0" style={{ background: accentColor }} />
          <div className="flex flex-col gap-0.5">
            <div className="h-1.5 rounded w-24 bg-gray-700" />
            <div className="h-0.5 rounded w-20 bg-gray-400" />
          </div>
        </div>
        {[["1/3", 0.9], ["full", 0.15], ["full", 0.15], ["5/6", 0.15]].map(([lw, lo], i) =>
          lo === 0.9 ? (
            <div key={i} className="flex items-center gap-1 mt-0.5">
              <div className="w-0.5 h-2.5 rounded-sm" style={{ background: accentColor }} />
              <div className="h-0.5 rounded flex-1 bg-gray-300" />
            </div>
          ) : (
            <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: lw as string }} />
          )
        )}
      </div>
    );
  }

  if (isTealFamily) {
    return (
      <div className="w-full h-full flex flex-col rounded-lg overflow-hidden p-2 gap-1" style={{ background: previewBg }}>
        <div className="flex items-stretch gap-1.5 mb-0.5">
          <div className="w-0.5 rounded-sm min-h-6 flex-shrink-0" style={{ background: accentColor }} />
          <div className="flex flex-col gap-0.5">
            <div className="h-1.5 rounded w-20 bg-gray-700" />
            <div className="h-0.5 rounded w-16 bg-gray-400" />
          </div>
        </div>
        <div className="h-0.5 w-full rounded" style={{ background: accentColor, opacity: 0.35 }} />
        {[[true, "1/3"], [false, "full"], [false, "5/6"], [false, "4/6"], [true, "2/5"], [false, "full"], [false, "4/5"]].map(([isLabel, w], i) => (
          <div
            key={i}
            className={isLabel ? "h-1 rounded mt-0.5" : "h-0.5 rounded bg-gray-200"}
            style={isLabel ? { background: accentColor, opacity: 0.8, width: w as string } : { width: w as string }}
          />
        ))}
      </div>
    );
  }

  if (isMinimalFamily) {
    return (
      <div className="w-full h-full flex flex-col rounded-lg overflow-hidden p-2 gap-1.5" style={{ background: previewBg }}>
        <div className="mb-1">
          <div className="h-2 rounded w-1/2 bg-gray-700 font-thin mb-0.5" />
          <div className="h-0.5 rounded w-1/3 bg-gray-400" />
        </div>
        {[1, 2].map((sec) => (
          <React.Fragment key={sec}>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 flex-shrink-0" style={{ background: accentColor }} />
              <div className="h-0.5 rounded" style={{ background: accentColor, opacity: 0.7, width: "30%" }} />
            </div>
            {[83, 100, 67].map((w, i) => (
              <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Default: classic-family (centered header + section divider lines)
  return (
    <div className="w-full h-full flex flex-col rounded-lg overflow-hidden p-2 gap-1.5" style={{ background: previewBg }}>
      <div className="flex flex-col items-center gap-0.5 pb-1 border-b-2" style={{ borderColor: accentColor }}>
        <div className="h-1.5 rounded w-2/3 bg-gray-700" />
        <div className="h-0.5 rounded w-1/2 bg-gray-400" />
      </div>
      {[1, 2].map((sec) => (
        <React.Fragment key={sec}>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-0.5 rounded w-1/4" style={{ background: accentColor, opacity: 0.85 }} />
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {[100, 83, 67].map((w, i) => (
            <div key={i} className="h-0.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Filter config ──────────────────────────────────────────────────────────────

const LAYOUT_FILTERS = [
  { label: "All layouts", value: "all", icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  { label: "Single Column", value: "single", icon: <Rows3 className="w-3.5 h-3.5" /> },
  { label: "Two Column", value: "sidebar", icon: <Columns2 className="w-3.5 h-3.5" /> },
  { label: "Header Band", value: "header-band", icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
];

const TAG_FILTERS = ["All", "Tech", "Finance", "Healthcare", "Creative", "Business", "Legal"];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TemplateGalleryPage() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [layoutFilter, setLayoutFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return PDF_TEMPLATES.filter(t => {
      const matchesLayout = layoutFilter === "all" || t.layout === layoutFilter;
      const matchesTag = tagFilter === "All" || t.tags.includes(tagFilter);
      const q = search.toLowerCase();
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
      return matchesLayout && matchesTag && matchesSearch;
    });
  }, [layoutFilter, tagFilter, search]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-2">
              32 professional templates
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Find your perfect resume style
            </h1>
            <p className="text-xl text-muted-foreground">
              ATS-friendly templates for every industry and role. KI tailors the content — you pick the look.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/sign-up">
                <Button size="lg" className="h-11 px-8">
                  Start Free — Use Any Template
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <div className="border-y border-border bg-muted/30 py-4 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["All templates pass ATS scanners", "Export to PDF instantly", "KI tailors content to each job", "Switch templates anytime on Pro"].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> {f}
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <section className="py-6 px-4 border-b border-border bg-background sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto max-w-6xl flex flex-col gap-3">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search templates…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {filtered.length} of {PDF_TEMPLATES.length} templates
              </span>
            </div>

            {/* Layout filter */}
            <div className="flex flex-wrap gap-2">
              {LAYOUT_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setLayoutFilter(f.value)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-colors border ${
                    layoutFilter === f.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}

              <div className="w-px bg-border self-stretch mx-1" />

              {/* Industry/tag filter */}
              {TAG_FILTERS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`px-3 h-8 rounded-full text-xs font-medium transition-colors border ${
                    tagFilter === tag
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Template grid */}
        <section className="py-10 pb-24 px-4">
          <div className="container mx-auto max-w-6xl">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-2">
                <LayoutTemplate className="w-10 h-10 opacity-20" />
                <p className="font-medium">No templates match your filters</p>
                <button
                  onClick={() => { setLayoutFilter("all"); setTagFilter("All"); setSearch(""); }}
                  className="text-sm text-primary underline underline-offset-2"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    onMouseEnter={() => setHovered(tpl.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Visual preview */}
                    <div
                      className="relative h-44 p-3 transition-all duration-300"
                      style={{ background: tpl.previewBg }}
                    >
                      <div className={`w-full h-full transition-transform duration-300 ${hovered === tpl.id ? "scale-[1.04]" : "scale-100"}`}>
                        <TemplateMockup tpl={tpl} />
                      </div>

                      {/* Layout badge */}
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 border border-white/60 shadow-sm">
                          {tpl.layout === "sidebar" ? "Two Column" : tpl.layout === "header-band" ? "Header Band" : "Single Column"}
                        </span>
                      </div>

                      {/* Accent colour swatch */}
                      <div
                        className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                        style={{ background: tpl.accentColor }}
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{tpl.name}</h3>
                        <div className="flex gap-1">
                          {tpl.tags.filter(t => t !== "All").slice(0, 1).map(tag => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/8 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{tpl.description}</p>
                      <Link href="/sign-up">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                        >
                          Use this template
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-4 bg-muted/30 border-t border-border text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">All 32 templates — free to start</h2>
            <p className="text-muted-foreground text-lg">
              Create your first resume with any template. Switch templates any time — your content stays intact.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-10 mt-2">
                Start for Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© 2026 Knighted Resume. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
