import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useGetJobAlerts, useCreateJobAlert, useDeleteJobAlert, getGetJobAlertsQueryKey } from "@workspace/api-client-react";
import { useAuth, SignInButton, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Trash2, Lock, Plus, Search, MapPin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function AlertsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { data, isLoading } = useGetJobAlerts({
    query: { queryKey: getGetJobAlertsQueryKey(), enabled: !!isSignedIn },
  });
  const createAlert = useCreateJobAlert();
  const deleteAlert = useDeleteJobAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("any");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? "");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Enter an email to receive alerts.", variant: "destructive" });
      return;
    }
    createAlert.mutate(
      {
        data: {
          email,
          query: query || undefined,
          location: location || undefined,
          employmentType: employmentType !== "any" ? (employmentType as any) : undefined,
          remoteOnly: remoteOnly || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobAlertsQueryKey() });
          toast({ title: "Alert created!", description: `We'll email ${email} when matching jobs appear.` });
          setQuery("");
          setLocation("");
          setEmploymentType("any");
          setRemoteOnly(false);
        },
        onError: () => {
          toast({ title: "Failed to create alert", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteAlert.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobAlertsQueryKey() });
        toast({ title: "Alert deleted" });
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-3xl py-10">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-serif font-bold">Job Alerts</h1>
        </div>

        {!isLoaded ? null : !isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-card rounded-2xl border border-border">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Sign in to set up job alerts</h2>
              <p className="text-muted-foreground mb-6">Get notified by email when new roles match your criteria.</p>
              <SignInButton mode="modal">
                <Button size="lg">Sign in</Button>
              </SignInButton>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Create Alert Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Create New Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <Search className="h-3.5 w-3.5 inline mr-1" />
                        Keywords
                      </Label>
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Product Manager, React"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 inline mr-1" />
                        Location
                      </Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. New York, Remote"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Job Type</Label>
                      <Select value={employmentType} onValueChange={setEmploymentType}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Any type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any type</SelectItem>
                          <SelectItem value="full_time">Full-time</SelectItem>
                          <SelectItem value="part_time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Alert Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-background"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="remote" checked={remoteOnly} onCheckedChange={setRemoteOnly} />
                    <Label htmlFor="remote" className="cursor-pointer text-sm">Remote only</Label>
                  </div>
                  <Button type="submit" disabled={createAlert.isPending} className="w-full sm:w-auto">
                    {createAlert.isPending ? "Creating…" : "Create Alert"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Alerts</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-card" />)}
                </div>
              ) : !data?.alerts?.length ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border text-muted-foreground">
                  <BellOff className="h-8 w-8 mx-auto mb-3" />
                  <p>No alerts yet — create one above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.alerts.map((alert) => (
                    <Card key={alert.id} className="bg-card border-border">
                      <CardContent className="py-4 flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap gap-2 items-center">
                            {alert.query ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Search className="h-3 w-3 mr-1" />
                                {alert.query}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">All jobs</Badge>
                            )}
                            {alert.location && (
                              <Badge variant="outline">
                                <MapPin className="h-3 w-3 mr-1" />
                                {alert.location}
                              </Badge>
                            )}
                            {alert.employmentType && (
                              <Badge variant="outline" className="capitalize">
                                {alert.employmentType.replace("_", " ")}
                              </Badge>
                            )}
                            {alert.remoteOnly && (
                              <Badge variant="outline">Remote only</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Sending to <span className="font-medium">{alert.email}</span>
                            {alert.lastSentAt && (
                              <> · Last sent {new Date(alert.lastSentAt).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => handleDelete(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
