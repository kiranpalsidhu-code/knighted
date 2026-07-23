import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import { Gift, Copy, Users, Check } from "lucide-react";

interface ReferralsData {
  referralCode: string;
  referredCount: number;
  rewardDaysEarned: number;
  referrals: { email: string | null; createdAt: string; rewardGranted: boolean }[];
}

export default function ReferralsPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/resume-ready/referrals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load referrals");
        setData(await res.json());
      } catch {
        toast({ title: "Couldn't load referrals", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getToken, toast]);

  const referralLink = data
    ? `${window.location.origin}${import.meta.env.BASE_URL}?ref=${data.referralCode}`
    : "";

  const shareText = "I'm using Knighted Resume to land my next job — AI resume tailoring, cover letters, and job tracking. Join with my link and we both get a free month of Pro 🚀";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied", description: "Your invite link is on the clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      "_blank", "noopener,noreferrer"
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`,
      "_blank", "noopener,noreferrer"
    );
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${referralLink}`)}`,
      "_blank", "noopener,noreferrer"
    );
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invite Friends</h1>
          <p className="text-muted-foreground mt-1">
            Share your link — when a friend signs up, you get 1 month of Pro free. No limit on how many friends you invite.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-primary" />
              Your invite link
            </CardTitle>
            <CardDescription>Anyone who signs up through this link earns you a free month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="font-mono text-sm" />
                  <Button onClick={handleCopy} variant="outline" className="shrink-0">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground self-center">Share on:</span>
                  <button
                    onClick={shareLinkedIn}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </button>
                  <button
                    onClick={shareTwitter}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="w-4 h-4" />
                Friends referred
              </div>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold">{data?.referredCount ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Gift className="w-4 h-4" />
                Free days earned
              </div>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold">{data?.rewardDaysEarned ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your invites</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.referrals.length ? (
              <p className="text-sm text-muted-foreground">
                No invites yet — share your link above to start earning free months.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data.referrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">{r.email || "New user"}</span>
                    <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className={r.rewardGranted ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {r.rewardGranted ? "+1 month free" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
