import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Users, Eye, Pause, Play, Plus, Zap,
  Clock, MapPin, ChevronRight, AlertCircle, Trophy, Rocket, Building,
} from "lucide-react";

type Listing = {
  id: number;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  employmentType: string | null;
  isActive: boolean;
  isPromoted: boolean;
  promotedUntil: string | null;
  expiresAt: string | null;
  postedAt: string;
  applicantCount: number;
  viewCount: number;
  reviewUrl: string | null;
};

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export function EmployerDashboard() {
  const { getToken, isSignedIn } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [promotingId, setPromotingId] = useState<number | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    const token = await getToken();
    const r = await fetch("/api/knighted-jobs/employer/listings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error("Failed to load listings");
    const data = await r.json();
    setListings(data.listings);
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchListings()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isSignedIn, fetchListings]);

  const promoteListing = async (id: number) => {
    setPromotingId(id);
    setPromoteError(null);
    try {
      const token = await getToken();
      const r = await fetch(`/api/knighted-jobs/listings/${id}/promote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) {
        setPromoteError(data.error || "Failed to start promotion");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setPromoteError("Failed to start promotion");
    } finally {
      setPromotingId(null);
    }
  };

  const toggleStatus = async (id: number, currentlyActive: boolean) => {
    setTogglingId(id);
    try {
      const token = await getToken();
      const r = await fetch(`/api/knighted-jobs/listings/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      if (!r.ok) throw new Error("Failed to update");
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isActive: !currentlyActive } : l))
      );
    } catch {
      // silently ignore — state unchanged
    } finally {
      setTogglingId(null);
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
            <p className="text-muted-foreground text-sm">Please sign in to access your employer dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  const active = listings.filter((l) => l.isActive);
  const paused = listings.filter((l) => !l.isActive);
  const totalApplicants = listings.reduce((s, l) => s + l.applicantCount, 0);
  const totalViews = listings.reduce((s, l) => s + (l.viewCount ?? 0), 0);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Employer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your listings and review applicants</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button asChild variant="ghost" size="sm" className="gap-2 shrink-0 text-muted-foreground">
              <Link href="/employer/company"><Building className="h-4 w-4" /> Company Profile</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 shrink-0 border-primary/20 text-primary">
              <Link href="/employer/inbox"><Users className="h-4 w-4" /> Applicant Inbox</Link>
            </Button>
            <Button asChild size="lg" className="gap-2 shrink-0">
              <Link href="/post-a-job"><Plus className="h-4 w-4" /> Post a New Job</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Listings",  value: active.length,    icon: Briefcase, color: "text-green-400" },
            { label: "Total Applicants", value: totalApplicants,  icon: Users,     color: "text-primary"   },
            { label: "Total Views",      value: totalViews,       icon: Eye,       color: "text-blue-400"  },
            { label: "Paused / Closed",  value: paused.length,    icon: Pause,     color: "text-muted-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5 text-center">
              <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
              <div className="text-2xl font-bold font-serif">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {promoteError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{promoteError}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No listings yet</h2>
            <p className="text-muted-foreground text-sm mb-6">Post your first role to start receiving applications.</p>
            <Button asChild>
              <Link href="/post-a-job"><Plus className="h-4 w-4 mr-2" />Post a Job</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const days = daysLeft(listing.expiresAt);
              const isExpiring = days !== null && days <= 7;
              const isExpired = days !== null && days === 0;
              return (
                <div
                  key={listing.id}
                  className={`bg-card border rounded-xl p-5 transition-colors ${
                    listing.isActive ? "border-border" : "border-border/40 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground truncate">{listing.title}</span>
                        {listing.isPromoted && (
                          <Badge className="bg-primary/20 text-primary text-xs gap-1">
                            <Trophy className="h-3 w-3" /> Promoted
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${listing.isActive ? "border-green-500/40 text-green-400" : "border-muted text-muted-foreground"}`}
                        >
                          {listing.isActive ? "Active" : "Paused"}
                        </Badge>
                        {isExpired && <Badge className="bg-destructive/20 text-destructive text-xs">Expired</Badge>}
                        {isExpiring && !isExpired && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Expires in {days}d</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {listing.location}{listing.isRemote ? " · Remote" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Posted {relativeTime(listing.postedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <strong className="text-foreground">{listing.applicantCount}</strong> applicant{listing.applicantCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400/70">
                          <Eye className="h-3.5 w-3.5" />
                          <strong className="text-blue-400">{(listing.viewCount ?? 0).toLocaleString()}</strong> view{listing.viewCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                        <Link href={`/jobs/${listing.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </Button>
                      {listing.reviewUrl && listing.applicantCount > 0 && (
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                          <a href={listing.reviewUrl}>
                            <Zap className="h-3.5 w-3.5 text-yellow-400" />
                            Review {listing.applicantCount}
                            <ChevronRight className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {!listing.isPromoted && listing.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          disabled={promotingId === listing.id}
                          onClick={() => promoteListing(listing.id)}
                        >
                          <Rocket className="h-3.5 w-3.5" />
                          {promotingId === listing.id ? "Redirecting…" : "Promote $49"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        disabled={togglingId === listing.id}
                        onClick={() => toggleStatus(listing.id, listing.isActive)}
                      >
                        {listing.isActive
                          ? <><Pause className="h-3.5 w-3.5" /> Pause</>
                          : <><Play className="h-3.5 w-3.5" /> Resume</>
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
