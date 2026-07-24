import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGetSeekerProfile, useUpdateSeekerProfile, getGetSeekerProfileQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import { User, Briefcase, MapPin, Sparkles, X, Share2, TrendingUp, Gift } from "lucide-react";

type ReferralRow = { id: number; token: string; listingId: number; listingTitle: string; company: string; clickCount: number; createdAt: string };
type ReferralStats = { referrals: ReferralRow[]; totalClicks: number; rewardsEarned: number };

export function ProfilePage() {
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/knighted-jobs/referrals", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setReferralStats(await res.json());
      } catch { /* silent */ }
    })();
  }, [isSignedIn, getToken]);
  const { data: profile, isLoading } = useGetSeekerProfile({ query: { queryKey: getGetSeekerProfileQueryKey(), enabled: !!isSignedIn } });
  const updateProfile = useUpdateSeekerProfile();

  const [jobTitle, setJobTitle] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [location, setLocation] = useState("");
  const [remotePreference, setRemotePreference] = useState("any");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setJobTitle(profile.jobTitle ?? "");
      setSkills(profile.skills ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean) : []);
      setExperienceYears(profile.experienceYears != null ? String(profile.experienceYears) : "");
      setLocation(profile.location ?? "");
      setRemotePreference(profile.remotePreference ?? "any");
    }
  }, [profile]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((s) => [...s, trimmed]);
      setDirty(true);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((s) => s.filter((x) => x !== skill));
    setDirty(true);
  };

  const handleSave = () => {
    updateProfile.mutate(
      {
        data: {
          jobTitle: jobTitle || undefined,
          skills: skills.join(", ") || undefined,
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
          location: location || undefined,
          remotePreference: (remotePreference as "any" | "remote" | "hybrid" | "onsite") || undefined,
        },
      },
      {
        onSuccess: () => {
          setDirty(false);
          toast({ title: "Profile saved!", description: "Your preferences power KI Match Score and job recommendations." });
        },
        onError: () => toast({ title: "Failed to save profile", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-2xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Job Seeker Profile</h1>
          <p className="text-muted-foreground">Your profile powers KI Match Score and personalised job recommendations.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /> Current / Target Job Title</Label>
              <Input
                value={jobTitle}
                onChange={(e) => { setJobTitle(e.target.value); setDirty(true); }}
                placeholder="e.g. Senior Software Engineer"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-muted-foreground" /> Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill and press Enter"
                  className="bg-background"
                />
                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1.5 pr-1.5 bg-primary/10 text-primary">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="rounded-full hover:bg-primary/20 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => { setExperienceYears(e.target.value); setDirty(true); }}
                  placeholder="e.g. 5"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Preferred Location</Label>
                <Input
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setDirty(true); }}
                  placeholder="e.g. San Francisco, CA"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Remote Preference</Label>
              <Select value={remotePreference} onValueChange={(v) => { setRemotePreference(v); setDirty(true); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (no preference)</SelectItem>
                  <SelectItem value="remote">Remote only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full font-bold"
              onClick={handleSave}
              disabled={updateProfile.isPending || !dirty}
            >
              {updateProfile.isPending ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        )}

        {/* Referral Stats */}
        {isSignedIn && (
          <div className="mt-8 bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-serif font-bold text-foreground">Referral Rewards</h2>
            </div>

            <p className="text-sm text-muted-foreground">
              Share job listings and earn <strong className="text-foreground">1 month of ResumeReady Pro free</strong> for every 5 clicks on your referral links.
              Hit "Share &amp; Earn Pro" on any job to generate your unique link.
            </p>

            {referralStats && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Clicks", value: referralStats.totalClicks, icon: TrendingUp },
                  { label: "Listings Shared", value: referralStats.referrals.length, icon: Share2 },
                  { label: "Rewards Earned", value: referralStats.rewardsEarned, icon: Gift },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-4 text-center">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                    <div className="text-xl font-bold font-serif text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {referralStats && referralStats.rewardsEarned > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    You've earned {referralStats.rewardsEarned} free month{referralStats.rewardsEarned > 1 ? "s" : ""} of ResumeReady Pro!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email <a href="mailto:hello@theknightedjobs.com" className="text-primary underline">hello@theknightedjobs.com</a> with subject "Referral reward" to claim your Pro access.
                  </p>
                </div>
              </div>
            )}

            {referralStats && referralStats.referrals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Shared Listings</p>
                {referralStats.referrals.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                    <div className="flex-1 min-w-0 mr-3">
                      <span className="font-medium text-foreground truncate block">{r.listingTitle}</span>
                      <span className="text-xs text-muted-foreground">{r.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-foreground font-medium">{r.clickCount} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
