import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@clerk/react";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, CreditCard, User, Shield } from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  const { user } = useUser();
  const { data: profile } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() }
  });
  const isPro = profile?.tier === "pro";

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and subscription.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Subscription
            </CardTitle>
            <CardDescription>Your current plan and billing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current plan</p>
                <p className="text-sm text-muted-foreground">
                  {isPro
                    ? "Unlimited AI features and resumes."
                    : "Free tier — 3 resumes, 10 tailoring requests/month."}
                </p>
              </div>
              <Badge
                variant={isPro ? "default" : "secondary"}
                className={isPro ? "bg-amber-500 hover:bg-amber-500" : ""}
              >
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>
            {!isPro && (
              <Link href="/pricing">
                <Button className="gap-2">
                  <Crown className="w-4 h-4" /> Upgrade to Pro
                </Button>
              </Link>
            )}
            {isPro && (
              <Link href="/pricing">
                <Button variant="outline" className="gap-2">
                  <CreditCard className="w-4 h-4" /> Manage Billing
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account details managed via Clerk.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{user?.fullName || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.primaryEmailAddress?.emailAddress || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Contact Us
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
