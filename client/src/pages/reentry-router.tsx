import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ReentryProgramPage from "@/pages/reentry-program";
import ReentryDashboard from "@/pages/reentry-dashboard";
import ReentryMyJourney from "@/pages/reentry-my-journey";
import { AlertTriangle } from "lucide-react";
import type { ReentryPlan, ReentryMilestone } from "@shared/schema";

interface ReentryAccess {
  role: string;
  isStaff: boolean;
  hasPlan: boolean;
}

export interface ReentryJourney {
  hasPlan: boolean;
  plans: Array<ReentryPlan & { milestones: ReentryMilestone[] }>;
}

/**
 * /reentry access model:
 *   - Unauthenticated visitor  → public program info page (NEVER a 403)
 *   - Authenticated staff       → full case-management caseload dashboard
 *   - Authenticated participant  → their own reentry journey (own plan only)
 *
 * Role is resolved server-side (/api/reentry/access) because req.user.role is
 * never set — the client cannot trust its own role signal for staff gating.
 */
export default function ReentryRouterPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: access, isLoading: accessLoading, error } = useQuery<ReentryAccess>({
    queryKey: ["/api/reentry/access"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Unauthenticated → public info page. No auth wall, no 403.
  if (!authLoading && !isAuthenticated) {
    return <ReentryProgramPage />;
  }

  if (authLoading || (isAuthenticated && accessLoading)) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  // Authenticated but the access probe failed — fail loudly, don't silently
  // fall back to the public page (which would hide a real error).
  if (error || !access) {
    return (
      <div className="container max-w-3xl py-16 px-4">
        <Card className="border-2 border-amber-300">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
            <h1 className="text-xl font-bold">Reentry workspace unavailable</h1>
            <p className="text-sm text-muted-foreground">
              We couldn't load your reentry access right now. Please refresh, or visit the{" "}
              <Link href="/reentry-program" className="text-primary hover:underline">public program page</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (access.isStaff) {
    return <ReentryDashboard />;
  }

  // Authenticated participant → own journey.
  return <ReentryMyJourney />;
}
