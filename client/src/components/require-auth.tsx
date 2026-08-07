import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  reason?: string;
  adminOnly?: boolean;
  /** Allows admin, teacher, and case_manager — mirrors the server's requireStaff policy. */
  staffOnly?: boolean;
}

const STAFF_ROLES = new Set(["admin", "teacher", "case_manager"]);

export function RequireAuth({ children, reason, adminOnly, staffOnly }: RequireAuthProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-16 px-4" data-testid="auth-gate-loading">
        <div className="space-y-3">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const role = (user as any)?.role;
  const isAdmin = role === "admin";
  const isStaff = STAFF_ROLES.has(role);
  const blocked = !isAuthenticated || (adminOnly && !isAdmin) || (staffOnly && !isStaff);

  if (blocked) {
    return (
      <div className="container max-w-3xl py-16 px-4">
        <Card className="border-2" data-testid="auth-gate-blocked">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold">Internal Workspace</h1>
            <p className="text-sm text-muted-foreground max-w-prose mx-auto">
              {reason ||
                "This page is part of TCAF/ALC's internal grant-development workspace. It is not part of the public site. Approved staff and partners can sign in to continue."}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button asChild data-testid="button-auth-login">
                <a href={`/api/login?returnTo=${encodeURIComponent(
                  typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/"
                )}`}><LogIn className="mr-2 h-4 w-4" /> Sign in</a>
              </Button>
              <Button asChild variant="outline" data-testid="button-auth-home">
                <a href="/">Return to public site</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Are you a partner or funder needing access? Email{" "}
              <a href="mailto:president@thecollaborativeadvocate.org" className="text-primary hover:underline">
                president@thecollaborativeadvocate.org
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
