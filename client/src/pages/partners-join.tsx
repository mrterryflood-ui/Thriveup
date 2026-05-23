import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LogIn, Building2, Upload, Trophy, ShieldCheck, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function PartnersJoinPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If they're already signed in, skip the sign-in walkthrough entirely.
  // No org yet → straight to onboarding. Has org → straight to doc library.
  const { data: orgData, isLoading: orgLoading } = useQuery<{ organization: { id: string } | null }>({
    queryKey: ["/api/me/organization"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated || isLoading || orgLoading) return;
    if (orgData?.organization) {
      setLocation("/settings/documents");
    } else {
      setLocation("/onboarding/org");
    }
  }, [isAuthenticated, isLoading, orgLoading, orgData, setLocation]);

  if (isAuthenticated && (isLoading || orgLoading)) {
    return (
      <div className="container max-w-3xl mx-auto p-6 py-16 space-y-4 text-center" data-testid="partners-join-routing">
        <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold">You're already signed in — taking you to the right place…</h2>
        <p className="text-sm text-muted-foreground">
          Routing to your organization profile or document library.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-8" data-testid="partners-join-page">
      <div className="text-center space-y-3 py-6">
        <Badge variant="secondary" className="mx-auto">For affiliated partners</Badge>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
          Set up your entity in three steps.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          You've been invited to join the ThriveUp teaming network. Sign in, create your organization profile,
          and upload your supporting docs once — they'll auto-populate every joint proposal we team on,
          no follow-up emails required.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card data-testid="card-step-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge>Step 1</Badge>
              <LogIn className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-2">Sign in</CardTitle>
            <CardDescription>One-click sign-in with Replit Auth. No new password to remember.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/api/login?returnTo=/onboarding/org">
              <Button className="w-full" data-testid="button-signin-1">
                Sign in <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card data-testid="card-step-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge>Step 2</Badge>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-2">Create your organization profile</CardTitle>
            <CardDescription>
              Legal name, EIN, mission, focus areas, state &amp; counties served, NAICS / PSC / UEI / CAGE.
              Takes about 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            After sign-in, you'll be sent straight to the wizard.
          </CardContent>
        </Card>

        <Card data-testid="card-step-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge>Step 3</Badge>
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-2">Upload your documents</CardTitle>
            <CardDescription>
              Capability statement · 501(c)(3) letter · W-9 · COI · past-performance writeups · licenses.
              Drop multiple files at once.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You can come back any time to add or replace files.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What this gets you</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-primary" /> Auto-fit to live RFPs</div>
            <p className="text-muted-foreground">Your profile gets scored against 700+ live grants. You see the ones that actually fit your lane.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-primary" /> Self-serve teaming</div>
            <p className="text-muted-foreground">Your docs are pulled into every joint proposal automatically — no chasing you for the latest capability statement.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Your data, your control</div>
            <p className="text-muted-foreground">Only you can edit, replace, or delete your org's files. Sign in any time to update.</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2 py-4">
        <a href="/api/login?returnTo=/onboarding/org">
          <Button size="lg" data-testid="button-signin-cta">
            Get started — sign in <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">
          Already have a profile? <Link href="/settings/documents" className="underline">Go straight to your document library</Link>.
        </p>
      </div>
    </div>
  );
}
