import React, { useState, useEffect } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import {
  ArrowRight, CheckCircle2, FileText, LayoutDashboard, Target,
  Briefcase, Mail, KanbanSquare, ChevronRight, Star, Quote,
  Sparkles, TrendingUp, Download, Settings, ChevronDown, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/PublicNav";

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Software Engineer",
    avatar: "M",
    color: "bg-blue-500",
    text: "I'd been applying for 6 weeks with zero callbacks. Switched to tailoring every resume through KI and got 3 interviews in 10 days. The difference was embarrassing.",
  },
  {
    name: "Priya S.",
    role: "Product Manager",
    avatar: "P",
    color: "bg-violet-500",
    text: "The pipeline tracker alone is worth it. I used to lose track of where I was with each company. Now I can see my entire search at a glance and follow up at the right time.",
  },
  {
    name: "James O.",
    role: "Data Analyst",
    avatar: "J",
    color: "bg-emerald-500",
    text: "I copy-pasted the same resume to every job for months. KI showed me how different each application needs to be. Got my first offer within 3 weeks of switching.",
  },
  {
    name: "Leila K.",
    role: "UX Designer",
    avatar: "L",
    color: "bg-rose-500",
    text: "The cover letter generator is genuinely good. Not generic AI slop — it actually uses your resume and the job description together. I edit maybe 20% of what it writes.",
  },
  {
    name: "Daniel R.",
    role: "Marketing Lead",
    avatar: "D",
    color: "bg-amber-500",
    text: "I was skeptical about AI resume tools but Knighted Resume is different. The ATS feedback caught things I never would have noticed. One resume went from 54% to 91% match score.",
  },
];

function TestimonialsSection() {
  return (
    <section aria-label="Testimonials" className="py-24 px-4 border-t border-border bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">What job seekers say</p>
          <p className="text-3xl font-bold tracking-tight">Real results, real people</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.slice(0, 3).map((t) => (
            <div key={t.name} className="bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-4">
              <Quote aria-hidden="true" className="w-6 h-6 text-primary/40 flex-shrink-0" />
              <p className="text-foreground leading-relaxed flex-1">{t.text}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${t.color}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="ml-auto flex">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {TESTIMONIALS.slice(3).map((t) => (
            <div key={t.name} className="bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-4">
              <Quote aria-hidden="true" className="w-6 h-6 text-primary/40 flex-shrink-0" />
              <p className="text-foreground leading-relaxed flex-1">{t.text}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${t.color}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="ml-auto flex">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          Testimonials are illustrative of reported user experiences. Results may vary.
        </p>
      </div>
    </section>
  );
}

const PIPELINE = [
  { stage: "Applied",    color: "bg-slate-100 text-slate-600 border-slate-200",    dot: "bg-slate-400",    jobs: [
    { company: "Vercel",  role: "Staff Engineer",           logo: "V", logoColor: "bg-black text-white" },
    { company: "Figma",   role: "Sr. Frontend Engineer",    logo: "F", logoColor: "bg-purple-600 text-white" },
  ]},
  { stage: "Screening",  color: "bg-yellow-50 text-yellow-700 border-yellow-200",  dot: "bg-yellow-400",  jobs: [
    { company: "Linear",  role: "Product Manager",          logo: "L", logoColor: "bg-indigo-600 text-white" },
    { company: "Loom",    role: "Product Engineer",         logo: "L", logoColor: "bg-orange-500 text-white" },
  ]},
  { stage: "Interview",  color: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-400",    jobs: [
    { company: "Stripe",  role: "Sr. Software Engineer",   logo: "S", logoColor: "bg-violet-600 text-white" },
    { company: "Retool",  role: "Sr. Software Engineer",   logo: "R", logoColor: "bg-red-500 text-white" },
  ]},
  { stage: "Offer",      color: "bg-green-50 text-green-700 border-green-200",     dot: "bg-green-400",   jobs: [
    { company: "Notion",  role: "Software Engineer II",    logo: "N", logoColor: "bg-gray-900 text-white" },
  ]},
];

const RESUMES = [
  { title: "Software Engineer Resume",  updated: "Today",        score: 91 },
  { title: "Product Manager Resume",    updated: "Yesterday",    score: 85 },
];

const COVER_LETTERS = [
  { title: "Stripe – Sr. Software Engineer",  company: "Stripe",  logo: "S", logoColor: "bg-violet-600" },
  { title: "Linear – Product Manager",        company: "Linear",  logo: "L", logoColor: "bg-indigo-600" },
  { title: "Vercel – Staff Engineer",         company: "Vercel",  logo: "V", logoColor: "bg-black" },
];

type Tab = "pipeline" | "resumes" | "covers" | "tailor";

function KiTailorPreview() {
  const [step, setStep] = useState<"input" | "done">("input");
  return (
    <div className="space-y-3">
      {step === "input" ? (
        <>
          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Your Resume</p>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">Software_Engineer_Resume.pdf</span>
              <span className="ml-auto text-[10px] text-green-600 font-medium">✓ Loaded</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Job Description</p>
            <div className="bg-muted/40 rounded-lg p-2 text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
              Senior Software Engineer at Stripe · We're looking for an engineer with strong experience in distributed systems, TypeScript, and API design. You'll own key infrastructure...
            </div>
          </div>
          <button
            onClick={() => setStep("done")}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Tailor with KI
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="w-12 h-12 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-green-700">94</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-800">ATS Match Score</p>
              <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Up from 58 · +36 points
              </p>
            </div>
            <button onClick={() => setStep("input")} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">Reset</button>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 shadow-sm space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tailored resume · ready to download</p>
            {["Rewrote 8 bullets with stronger verbs", "Added 12 ATS keywords from JD", "Moved API design experience to top"].map(item => (
              <div key={item} className="flex items-start gap-1.5 text-[10px] text-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cover letter · also generated</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic">
              "Stripe's infrastructure handles billions of dollars per day — the kind of scale where one poorly designed API can cascade into a crisis. That's the problem space I've lived in..."
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function PipelinePreview() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 min-w-0">
      {PIPELINE.map((col) => (
        <div key={col.stage} className="flex-shrink-0 w-40">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border mb-2 ${col.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
            {col.stage}
          </div>
          <div className="space-y-2">
            {col.jobs.map((job) => (
              <div key={job.company} className="bg-white rounded-lg border border-border p-2.5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0 ${job.logoColor}`}>
                    {job.logo}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">{job.company}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">{job.role}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResumesPreview() {
  return (
    <div className="space-y-3">
      {RESUMES.map((r) => (
        <div key={r.title} className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground">Updated {r.updated}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center">
              <span className="text-xs font-bold text-green-600">{r.score}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="bg-white rounded-xl border border-dashed border-border p-4 flex items-center justify-center gap-2 text-muted-foreground">
        <span className="text-sm">+ New Resume</span>
      </div>
    </div>
  );
}

function CoverLettersPreview() {
  return (
    <div className="space-y-3">
      {COVER_LETTERS.map((cl) => (
        <div key={cl.title} className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg ${cl.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {cl.logo}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{cl.title}</p>
            <p className="text-xs text-muted-foreground">Cover letter · {cl.company}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "tailor",   label: "KI Tailor",     icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "pipeline", label: "Track Jobs",    icon: <KanbanSquare className="w-3.5 h-3.5" /> },
  { id: "resumes",  label: "Resumes",       icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "covers",   label: "Cover Letters", icon: <Mail className="w-3.5 h-3.5" /> },
];

// ── Hero Editor Mockup ─────────────────────────────────────────────────────────
// Shows a realistic resume editor UI — left panel is the document, right panel
// is the KI Tailor sidebar with an ATS score that animates from 58 → 94.

function HeroEditorMockup() {
  const [score, setScore] = useState(58);
  const [phase, setPhase] = useState<"before" | "running" | "after">("before");

  useEffect(() => {
    // Auto-start the demo after 1.2s
    const start = setTimeout(() => {
      setPhase("running");
      let s = 58;
      const tick = setInterval(() => {
        s += 3;
        if (s >= 94) { s = 94; clearInterval(tick); setPhase("after"); }
        setScore(s);
      }, 60);
      return () => clearInterval(tick);
    }, 1200);
    return () => clearTimeout(start);
  }, []);

  const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-500";
  const ringColor  = score >= 80 ? "border-green-400" : score >= 60 ? "border-yellow-400" : "border-red-400";
  const ringBg     = score >= 80 ? "bg-green-50"       : score >= 60 ? "bg-yellow-50"       : "bg-red-50";

  return (
    <div className="w-full select-none">
      {/* Browser chrome */}
      <div className="bg-[#f1f3f4] rounded-t-xl border border-[#e0e0e0] border-b-0 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-gray-400 border border-gray-200 text-center font-mono">
          app.theknightedresume.com/editor/alex-resume
        </div>
      </div>

      {/* App toolbar */}
      <div className="bg-white border-x border-[#e0e0e0] px-4 py-2 flex items-center gap-3 border-b border-b-[#e8e8e8]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <FileText className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Alex Rivera — Software Engineer</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted/50">
            Classic <ChevronDown className="w-3 h-3 ml-0.5" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md px-2.5 py-1 cursor-pointer">
            <Download className="w-3 h-3" /> Export PDF
          </div>
          <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hidden sm:block" />
        </div>
      </div>

      {/* Editor body */}
      <div className="bg-[#f8f9fa] border border-[#e0e0e0] border-t-0 rounded-b-xl overflow-hidden shadow-2xl">
        <div className="flex" style={{ height: 380 }}>

          {/* ── Left: Resume document ─────────────────────────────────── */}
          <div className="flex-1 bg-white overflow-hidden border-r border-[#e8e8e8] flex flex-col">
            {/* Document page */}
            <div className="flex-1 overflow-hidden px-6 py-5 text-[10px] leading-relaxed font-sans">
              {/* Name & contact */}
              <div className="text-center border-b-2 border-gray-900 pb-2 mb-3">
                <p className="text-[16px] font-bold tracking-widest uppercase text-gray-900">Alex Rivera</p>
                <p className="text-[9px] text-gray-500 mt-0.5">alex.rivera@email.com · San Francisco, CA · linkedin.com/in/alexrivera · github.com/arivera</p>
              </div>

              {/* Summary */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8.5px] font-bold tracking-[2px] uppercase text-gray-900">Summary</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                <p className="text-[9px] text-gray-700 leading-snug">
                  Senior Software Engineer with 7+ years building distributed systems at scale. Expert in TypeScript, Python, and API design — shipped infrastructure serving 50M+ daily transactions at Stripe.
                </p>
              </div>

              {/* Experience */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[8.5px] font-bold tracking-[2px] uppercase text-gray-900">Experience</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>

                <div className="mb-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9.5px] font-semibold text-gray-900">Staff Software Engineer · Stripe</span>
                    <span className="text-[8.5px] text-gray-500">2022 – Present</span>
                  </div>
                  <ul className="mt-0.5 pl-3 space-y-0.5 text-[8.5px] text-gray-700">
                    <li className="list-disc">Designed TypeScript API infrastructure serving <strong>50M+ daily transactions</strong>, achieving 99.99% uptime</li>
                    <li className="list-disc">Reduced p99 latency <strong>by 40%</strong> through distributed caching and query optimization</li>
                    <li className="list-disc">Led 6-engineer team shipping real-time payment reconciliation system used by 200+ enterprise clients</li>
                  </ul>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9.5px] font-semibold text-gray-900">Senior Software Engineer · Figma</span>
                    <span className="text-[8.5px] text-gray-500">2020 – 2022</span>
                  </div>
                  <ul className="mt-0.5 pl-3 space-y-0.5 text-[8.5px] text-gray-700">
                    <li className="list-disc">Built collaborative data pipeline processing <strong>2TB/day</strong> of design event telemetry</li>
                    <li className="list-disc">Owned GraphQL API layer serving 4M+ active users with <strong>&lt;50ms</strong> median response time</li>
                  </ul>
                </div>

                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9.5px] font-semibold text-gray-900">Software Engineer · Twilio</span>
                    <span className="text-[8.5px] text-gray-500">2018 – 2020</span>
                  </div>
                  <ul className="mt-0.5 pl-3 text-[8.5px] text-gray-700">
                    <li className="list-disc">Developed message routing service handling <strong>10B+ API requests/month</strong></li>
                  </ul>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8.5px] font-bold tracking-[2px] uppercase text-gray-900">Skills</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                <p className="text-[8.5px] text-gray-700">
                  TypeScript · Python · Distributed Systems · API Design · AWS · PostgreSQL · React · GraphQL · Docker · Kafka
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: KI Tailor panel ────────────────────────────────── */}
          <div className="w-48 bg-white flex flex-col border-l border-[#e8e8e8] flex-shrink-0">
            {/* Panel header */}
            <div className="px-3 py-2.5 border-b border-[#e8e8e8] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-[11px] font-semibold text-foreground">KI Tailor</span>
            </div>

            <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-3">
              {/* ATS score ring */}
              <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${ringBg} ${ringColor.replace("border-", "border-")}`}
                style={{ borderColor: score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171" }}
              >
                <div className={`w-11 h-11 rounded-full border-2 ${ringColor} ${ringBg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-sm font-bold ${scoreColor}`}>{score}</span>
                </div>
                <div>
                  <p className="text-[9.5px] font-semibold text-gray-800">ATS Score</p>
                  {phase === "after" ? (
                    <p className="text-[8.5px] text-green-600 flex items-center gap-0.5 mt-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> +36 from 58
                    </p>
                  ) : phase === "running" ? (
                    <p className="text-[8.5px] text-yellow-600 mt-0.5">Analyzing…</p>
                  ) : (
                    <p className="text-[8.5px] text-red-500 mt-0.5">Needs work</p>
                  )}
                </div>
              </div>

              {/* Job being tailored to */}
              <div className="rounded-lg border border-[#e8e8e8] p-2">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tailoring for</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-violet-600 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">S</div>
                  <div>
                    <p className="text-[9px] font-medium text-foreground leading-tight">Staff Engineer</p>
                    <p className="text-[8px] text-muted-foreground">Stripe · San Francisco</p>
                  </div>
                </div>
              </div>

              {/* Changes made */}
              {phase === "after" && (
                <div className="space-y-1.5">
                  {[
                    "12 ATS keywords added",
                    "8 bullets strengthened",
                    "Summary rewritten",
                    "Cover letter ready",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-[8.5px] text-gray-700">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {phase === "running" && (
                <div className="space-y-1.5">
                  {["Scanning keywords…", "Rewriting bullets…", "Matching experience…"].map((item, i) => (
                    <div key={item} className="flex items-center gap-1.5 text-[8.5px] text-gray-400">
                      <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {phase === "before" && (
                <button
                  onClick={() => {
                    setPhase("running");
                    let s = 58;
                    const tick = setInterval(() => {
                      s += 3;
                      if (s >= 94) { s = 94; clearInterval(tick); setPhase("after"); }
                      setScore(s);
                    }, 60);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-1.5 text-[10px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Tailor with KI
                </button>
              )}

              {phase === "after" && (
                <div className="mt-auto">
                  <button className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-1.5 text-[10px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                    <Download className="w-3 h-3" /> Download Resume
                  </button>
                  <button
                    onClick={() => { setPhase("before"); setScore(58); }}
                    className="w-full text-center text-[8.5px] text-muted-foreground mt-1.5 hover:text-foreground transition-colors cursor-pointer"
                  >
                    Try again ↺
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="bg-[#f1f3f4] border-t border-[#e0e0e0] px-4 py-1.5 flex items-center justify-between text-[9px] text-gray-400">
          <span>32 templates · ATS-optimized</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Auto-saved
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductMockup() {
  const [tab, setTab] = useState<Tab>("tailor");

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Browser chrome */}
      <div className="bg-muted/80 rounded-t-xl border border-border border-b-0 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground border border-border text-center">
          app.theknightedresume.com/pipeline
        </div>
      </div>

      {/* App shell */}
      <div className="bg-background border border-border rounded-b-xl overflow-hidden shadow-2xl">
        <div className="flex h-[340px]">
          {/* Sidebar */}
          <div className="w-44 bg-muted/30 border-r border-border flex flex-col py-4 px-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-1 mb-5">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold">Knighted Resume</span>
            </div>
            <div className="space-y-0.5" role="presentation">
              {([
                { id: "tailor",   label: "KI Tailor",     icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: "pipeline", label: "Track Jobs",    icon: <KanbanSquare className="w-3.5 h-3.5" /> },
                { id: "resumes",  label: "Resumes",       icon: <FileText className="w-3.5 h-3.5" /> },
                { id: "covers",   label: "Cover Letters", icon: <Mail className="w-3.5 h-3.5" /> },
                { id: "jobs",     label: "Job Search",    icon: <Briefcase className="w-3.5 h-3.5" />, disabled: true },
              ] as const).map((item) => (
                <button
                  key={item.label}
                  onClick={() => !("disabled" in item && item.disabled) && setTab(item.id as Tab)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                    tab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">AR</div>
                <div>
                  <p className="text-[10px] font-medium text-foreground">Alex Rivera</p>
                  <p className="text-[9px] text-muted-foreground">Free plan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto p-4 bg-background">
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">
                {tab === "tailor" ? "KI Tailor" : tab === "pipeline" ? "Track Jobs" : tab === "resumes" ? "My Resumes" : "Cover Letters"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {tab === "tailor" ? "Tailor resume + cover letter to any job" : tab === "pipeline" ? "8 applications tracked" : tab === "resumes" ? "2 resumes · KI-tailored" : "3 cover letters"}
              </p>
            </div>
            {tab === "tailor"   && <KiTailorPreview />}
            {tab === "pipeline" && <PipelinePreview />}
            {tab === "resumes"  && <ResumesPreview />}
            {tab === "covers"   && <CoverLettersPreview />}
          </div>
        </div>
      </div>

      {/* Tab switcher below mockup */}
      <div className="flex justify-center gap-2 mt-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  useSEO({
    title: "AI Resume Builder & Job Tracker for Ambitious Professionals",
    description: "Knighted Resume tailors your resume to any job in seconds, gives you instant ATS scores, and tracks your entire job search pipeline. Sign up free.",
    canonical: "/",
  });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://theknightedresume.com/#organization",
              "name": "Knighted Resume",
              "url": "https://theknightedresume.com",
              "logo": "https://theknightedresume.com/logo.svg",
              "sameAs": [],
            },
            {
              "@type": "WebSite",
              "@id": "https://theknightedresume.com/#website",
              "url": "https://theknightedresume.com",
              "name": "Knighted Resume",
              "publisher": { "@id": "https://theknightedresume.com/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://theknightedresume.com/blog?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }) }}
      />
      <PublicNav />

      <main className="flex-1">
        {/* Hero Section — two-column: copy left, editor screenshot right */}
        <section aria-label="Hero" className="py-14 md:py-20 px-4 overflow-hidden">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">

              {/* Left: copy */}
              <div className="space-y-7 lg:max-w-xl">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                  Powered by Knighted Intelligence
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                  Land your dream job with an <span className="text-primary">unfair advantage</span>.
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Paste any job description. KI rewrites your resume to match it in seconds — stronger bullets, ATS keywords, and a tailored cover letter included.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4 pt-1">
                  <Link href="/sign-up">
                    <Button size="lg" className="h-12 px-8 text-base">
                      Start Building Free
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                      View Pricing
                    </Button>
                  </Link>
                </div>

                {/* Import resume entry point */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span>Already have a resume?</span>
                  <Link href="/resumes?import=1" className="text-primary font-semibold underline underline-offset-2">
                    Import it in seconds →
                  </Link>
                </div>

                {/* Job Guarantee badge */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span><span className="font-semibold text-foreground">Job Guarantee:</span> land a job within 6 paid months or get 3 months free.</span>
                </div>

                {/* Product Hunt launch CTA */}
                <div className="pt-1">
                  <a
                    href="https://www.producthunt.com/products/knighted-resume?launch=knighted-resume"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 bg-[#DA552F] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.5 9H10.5V15H13.5C15.15 15 16.5 13.65 16.5 12C16.5 10.35 15.15 9 13.5 9Z"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM10.5 7.5H13.5C16.26 7.5 18.5 9.74 18.5 12.5C18.5 15.26 16.26 17.5 13.5 17.5H10.5V20H8.5V7.5H10.5Z"/>
                    </svg>
                    <span className="text-xs font-semibold">Knighted Resume — launching on Product Hunt</span>
                  </a>
                </div>
              </div>

              {/* Right: realistic editor screenshot */}
              <div className="w-full lg:translate-x-4 xl:translate-x-8">
                <HeroEditorMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Product Preview Section */}
        <section className="pb-24 px-4 border-t border-border pt-20">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Everything in one place</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">KI Tailor, job tracker, resumes, cover letters</h2>
            </div>
            <ProductMockup />
          </div>
        </section>

        {/* Product facts strip — real, verifiable */}
        <section className="py-8 border-y border-border bg-muted/30 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "32",        label: "ATS-optimized templates",  note: "Single, sidebar & header-band layouts" },
                { value: "< 60 sec",  label: "To tailor any resume",     note: "Paste JD → KI rewrites + score" },
                { value: "Free",      label: "To start — no credit card", note: "Upgrade for unlimited tailoring" },
                { value: "1-click",   label: "PDF export",               note: "Download-ready, print-perfect" },
              ].map(({ value, label, note }) => (
                <div key={label} className="group">
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 hidden group-hover:block">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" aria-label="Features" className="py-24 bg-muted/50 border-t border-border px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need to succeed</h2>
              <p className="text-muted-foreground mt-4 text-lg">Powerful tools designed for ambitious professionals.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">KI-Tailored Resumes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Paste a job description and Knighted Intelligence rewrites your resume to highlight the most relevant experience and match keywords perfectly.
                </p>
              </div>
              <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Track Jobs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Never lose track of an application. Use our Kanban board to manage your job search pipeline from application to offer.
                </p>
              </div>
              <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get actionable feedback on your resume structure, impact, and clarity before you submit, giving you the best chance to stand out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How KI Works section */}
        <section aria-label="How KI works" className="py-24 px-4 bg-background border-t border-border">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                Knighted Intelligence (KI)
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                The AI that does the hard part for you
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Most job seekers send the same resume everywhere and wonder why they don't hear back.
                KI rewrites your resume specifically for each job — adding the right keywords, reordering your experience, and generating a matching cover letter — in under 60 seconds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  step: "01",
                  title: "Paste the job description",
                  body: "Drop in the JD (or upload a file, or paste a URL). KI reads the full posting — requirements, keywords, tone, seniority level — so nothing gets missed.",
                  icon: "📋",
                },
                {
                  step: "02",
                  title: "KI tailors your resume",
                  body: "KI rewrites your bullets to use STAR structure, injects the right ATS keywords, reorders sections to match what the hiring manager cares most about, and scores the result.",
                  icon: "⚡",
                },
                {
                  step: "03",
                  title: "Download — resume + cover letter",
                  body: "Get a tailored resume PDF and a matching 4-paragraph cover letter that opens with a compelling hook specific to the company and role. Apply in minutes.",
                  icon: "🎯",
                },
              ].map(({ step, title, body, icon }) => (
                <div key={step} className="relative bg-muted/40 rounded-2xl p-8 border border-border">
                  <div className="text-4xl mb-4">{icon}</div>
                  <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Step {step}</div>
                  <h3 className="text-lg font-semibold mb-3">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            {/* Before/After ATS score bar */}
            <div className="bg-muted/40 rounded-2xl border border-border p-8 md:p-12">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold">What KI actually changes</h3>
                <p className="text-sm text-muted-foreground mt-1">KI's before/after comparison — based on the same resume, same job listing</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: "ATS Match Score", before: "58%", after: "94%", bar: 94, barBefore: 58 },
                  { label: "Keywords matched", before: "7 of 24", after: "21 of 24", bar: 88, barBefore: 29 },
                  { label: "Interview call rate", before: "baseline", after: "3× higher", bar: 75, barBefore: 25 },
                ].map(({ label, before, after, bar, barBefore }) => (
                  <div key={label}>
                    <p className="text-sm font-medium mb-3">{label}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">Before</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${barBefore}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{before}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-medium w-16 shrink-0">After KI</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${bar}%` }} />
                        </div>
                        <span className="text-xs text-primary font-semibold w-16 text-right shrink-0">{after}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href="/sign-up">
                  <Button size="lg" className="h-11 px-8">
                    Try KI Free — No Card Required
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        {/* Knighted Jobs cross-promo */}
        <section aria-label="KnightedJobs companion app" className="py-20 px-4 bg-muted/30 border-y border-border">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              ✦ Companion Product
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Find the job first on Knighted Jobs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Our companion job board shows salary on every listing, filters out sponsored spam, and gives you a KI Match Score before you apply — so you only apply to roles worth your time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/knighted-jobs/jobs"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
              >
                Browse Jobs with Salary →
              </a>
              <a
                href="/knighted-jobs/salary"
                className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground rounded-lg px-6 py-3 font-semibold hover:bg-muted transition-colors"
              >
                Explore Salary Data
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 justify-center text-sm text-muted-foreground">
              {["Salary on every listing", "No sponsored spam", "KI Match Score", "Freshness guarantee"].map(f => (
                <span key={f} className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile + Chrome Extension section */}
        <section aria-label="Mobile app and browser extension" className="py-20 px-4 bg-muted/20 border-t border-border">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Take Knighted Resume everywhere</h2>
              <p className="text-muted-foreground mt-3 text-lg">Track applications on your phone. Apply smarter from any job board.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mobile app */}
              <div className="bg-background rounded-2xl border border-border p-8 flex flex-col gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">📱</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Mobile App</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Track your job applications on the go. Log interviews, notes, and salary info from your phone the moment they happen — so nothing slips through the cracks.
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  {["Full application pipeline", "Interview scheduler", "Salary & offer tracker", "iOS + Android"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/resume-ready-mobile/"
                  className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors mt-auto"
                >
                  View Mobile App →
                </a>
              </div>

              {/* Chrome extension */}
              <div className="bg-background rounded-2xl border border-border p-8 flex flex-col gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">🔌</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Chrome Extension</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Apply smarter from any job board. The Knighted Resume extension lets you save jobs, see your KI Match Score, and add applications to your pipeline without leaving the page.
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  {["Works on LinkedIn, Indeed, Greenhouse", "One-click save to pipeline", "KI Match Score overlay", "Free to install"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/knighted-jobs/extension"
                  className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors mt-auto"
                >
                  Get the Extension →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Job Guarantee Section */}
        <section aria-label="Job Guarantee" className="py-20 px-4 bg-primary/5 border-t border-primary/10">
          <div className="container mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Job Guarantee</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              We're so confident Knighted Resume will help you land a job that we back it with a guarantee. If you haven't received a job offer within 6 paid months, we'll give you 3 months free — no questions asked.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2 text-left max-w-2xl mx-auto">
              {[
                { step: "1", label: "Subscribe to Pro", desc: "Start your 6-month clock on any paid plan." },
                { step: "2", label: "Use the platform", desc: "Tailor resumes, track applications, and prep for interviews." },
                { step: "3", label: "Land the job — or get 3 months free", desc: "If you don't land an offer, contact us and we'll extend for free." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="bg-background rounded-xl border border-border p-5 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">{step}</div>
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Guarantee applies to Pro subscribers who actively use the platform. <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">See full terms on the pricing page.</Link>
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section aria-label="Call to action" className="py-24 px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to land your dream job?</h2>
            <p className="text-lg text-muted-foreground">Join job seekers who are landing more interviews with Knighted Resume.</p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-10 text-base mt-4">
                Get Started for Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t border-border bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-3">Knighted Resume</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/referrals" className="hover:text-foreground transition-colors">Referrals</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Knighted Jobs</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/knighted-jobs/jobs" className="hover:text-foreground transition-colors">Browse Jobs</a></li>
                <li><a href="/knighted-jobs/salary" className="hover:text-foreground transition-colors">Salary Explorer</a></li>
                <li><a href="/knighted-jobs/blog" className="hover:text-foreground transition-colors">Career Advice</a></li>
                <li><a href="/knighted-jobs/post-a-job" className="hover:text-foreground transition-colors">Post a Job</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Company</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Tools</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/ask-ki" className="hover:text-foreground transition-colors">Ask KI</Link></li>
                <li><Link href="/interview" className="hover:text-foreground transition-colors">Interview Prep</Link></li>
                <li><Link href="/cover-letters" className="hover:text-foreground transition-colors">Cover Letters</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Knighted Resume. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/knighted-resume"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://x.com/knightedresume"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <span className="text-xs">Part of the Knighted suite — <a href="/knighted-jobs/" className="text-primary underline underline-offset-2">Knighted Jobs</a></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
