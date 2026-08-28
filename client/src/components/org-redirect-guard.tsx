import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

// Routes that genuinely cannot function without an org row. A signed-in user
// who lands here without an org is bounced to /onboarding/org. Everything
// else (landing, dashboard, public surfaces, AI tools, ecosystem pages…) is
// allowed to render — the queryClient ORG_REQUIRED 404 guard is the backstop
// for any workspace API call that needs an org, and per-route guards exist on
// the workspace pages themselves (see rfp-writer.tsx, org-settings.tsx,
// partners-join.tsx). Prior implementation used an allowlist of "safe" paths
// which silently bounced Eric (and every other signed-in user without an org)
// off the landing page, dashboard, and every other surface on every click.
// Verified against client/src/App.tsx route definitions + server requireOrg
// middleware (rg "requireOrg" server/) on 2026-05-25. Keep this list in sync
// when adding new org-scoped pages; the queryClient ORG_REQUIRED 404 guard is
// the backstop if a route is missed here.
const REQUIRES_ORG_PREFIXES = [
  "/grant-narrative",
  "/my-grants",
  "/won-proposals",
  "/rfp-fidelity",
  "/proposal-command",
  "/proposal-pipeline",
  "/settings/organization",
  "/settings/documents",
  "/organization/events",
];

// Special-case: /grants/:grantId/compliance requires an org, but the bare
// /grants hub and other /grants/* viewers do not. Match the compliance suffix.
function pathRequiresOrg(location: string): boolean {
  if (REQUIRES_ORG_PREFIXES.some((p) => location.startsWith(p))) return true;
  if (/^\/grants\/[^/]+\/compliance(\/|$)/.test(location)) return true;
  return false;
}

interface OrgQuery {
  organization: { id: string } | null;
}

export function OrgRedirectGuard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  const { data, isLoading: orgLoading, isSuccess } = useQuery<OrgQuery>({
    queryKey: ["/api/me/organization"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
    retry: 1,
  });

  useEffect(() => {
    if (authLoading || orgLoading) return;
    if (!isAuthenticated) return;
    // Only redirect on a CONFIRMED null. If the org query errored (data
    // undefined), do nothing — bouncing a user with a valid org to onboarding
    // because of a transient 500 would be a worse failure than letting them
    // try the page. The queryClient ORG_REQUIRED guard still catches genuine
    // workspace-route 404s.
    if (!isSuccess) return;
    if (data?.organization) return;

    if (!pathRequiresOrg(location)) return;

    setLocation("/onboarding/org");
  }, [authLoading, orgLoading, isAuthenticated, isSuccess, data, location, setLocation]);

  return null;
}
