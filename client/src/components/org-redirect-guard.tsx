import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

// Paths a signed-in-but-org-less user is allowed to sit on. Everything else
// (landing, workspace, settings, AI tools…) bounces to /onboarding/org so the
// user can finish setting up and actually use the platform. Without this, the
// post-sign-in redirect lands users on `/` with no obvious next step and the
// queryClient ORG_REQUIRED guard never fires because the landing page makes
// no /api/me/* calls.
const SAFE_PREFIXES = [
  "/onboarding/",
  "/sign-out",
  "/api/",
  "/partners/join",
  "/join",
  "/ecosystem/embed",
  "/ecosystem/lifebridge",
  "/presentation",
  "/coverage",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

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

    const onSafePath = SAFE_PREFIXES.some((p) => location.startsWith(p));
    if (onSafePath) return;

    setLocation("/onboarding/org");
  }, [authLoading, orgLoading, isAuthenticated, isSuccess, data, location, setLocation]);

  return null;
}
