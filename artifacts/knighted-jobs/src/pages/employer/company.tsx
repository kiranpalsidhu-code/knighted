import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, ArrowLeft, Save, Plus, X, ExternalLink, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CompanyProfile = {
  id: number;
  companyName: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  location: string | null;
  size: string | null;
  foundedYear: number | null;
  cultureBlurb: string | null;
  techStack: string[];
  benefits: string[];
};

const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"];

export function EmployerCompanyPage() {
  const { getToken, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    logoUrl: "",
    website: "",
    location: "",
    size: "",
    foundedYear: "",
    cultureBlurb: "",
  });
  const [techStack, setTechStack] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  const fetchProfile = useCallback(async () => {
    const token = await getToken();
    const r = await fetch("/api/knighted-jobs/employer/company", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("Failed to load profile");
    return r.json() as Promise<CompanyProfile>;
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchProfile()
      .then((p) => {
        if (p) {
          setProfile(p);
          setForm({
            companyName: p.companyName,
            logoUrl: p.logoUrl ?? "",
            website: p.website ?? "",
            location: p.location ?? "",
            size: p.size ?? "",
            foundedYear: p.foundedYear ? String(p.foundedYear) : "",
            cultureBlurb: p.cultureBlurb ?? "",
          });
          setTechStack(p.techStack);
          setBenefits(p.benefits);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isSignedIn, fetchProfile]);

  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput("");
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const r = await fetch("/api/knighted-jobs/employer/company", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          logoUrl: form.logoUrl || undefined,
          website: form.website || undefined,
          location: form.location || undefined,
          size: form.size || undefined,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
          cultureBlurb: form.cultureBlurb || undefined,
          techStack,
          benefits,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Save failed");
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Company profile saved!" });
    } catch (err: any) {
      toast({ title: err.message ?? "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Sign in required</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-3xl py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground -ml-2 mb-1" asChild>
              <Link href="/employer/dashboard"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              Company Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Visible to job seekers on your listings — tell them who you are.
            </p>
          </div>
          {profile && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
              <Link href={`/companies/${profile.slug}`}>
                <ExternalLink className="h-3.5 w-3.5" /> Preview
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, size: form.size === s ? "" : s })}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          form.size === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Founded Year</Label>
                  <Input
                    type="number"
                    value={form.foundedYear}
                    onChange={(e) => setForm({ ...form, foundedYear: e.target.value })}
                    placeholder="2018"
                    min={1800}
                    max={2100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://acme.com/logo.png"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Culture & Mission</h2>
              <Textarea
                value={form.cultureBlurb}
                onChange={(e) => setForm({ ...form, cultureBlurb: e.target.value })}
                placeholder="Tell candidates why they'd love working here — your mission, values, and what makes your team unique."
                rows={5}
                className="resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{form.cultureBlurb.length}/1000</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tech Stack</h2>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                {techStack.map((t) => (
                  <Badge key={t} className="bg-primary/10 text-primary gap-1.5 pl-2.5 pr-1.5 py-1">
                    {t}
                    <button onClick={() => removeTag(techStack, setTechStack, t)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="e.g. React, TypeScript, PostgreSQL"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(techStack, setTechStack, techInput, setTechInput);
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => addTag(techStack, setTechStack, techInput, setTechInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Benefits & Perks</h2>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                {benefits.map((b) => (
                  <Badge key={b} variant="outline" className="gap-1.5 pl-2.5 pr-1.5 py-1 border-green-500/30 text-green-400">
                    {b}
                    <button onClick={() => removeTag(benefits, setBenefits, b)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="e.g. Remote-first, 401k, Unlimited PTO"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(benefits, setBenefits, benefitInput, setBenefitInput);
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => addTag(benefits, setBenefits, benefitInput, setBenefitInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </span>
              )}
              <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Profile"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
