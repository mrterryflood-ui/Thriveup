import { QueryClient, QueryCache, MutationCache, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

/**
 * Thrown when a query hits a 401 and the app expected an authenticated user.
 * The global QueryCache onError (below) detects this, shows a single toast and
 * redirects to the login flow. Distinguishing this from "no data" is what stops
 * an expired session from silently rendering empty dashboards everywhere.
 */
export class SessionExpiredError extends Error {
  constructor(message = "Your session expired. Please sign in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

// Multi-org membership: the user selects which workspace they're acting as
// from the sidebar OrgSwitcher; the selection is persisted in localStorage
// and sent on every request as x-org-id so server-side loadCallerOrg can
// resolve the correct org. If no selection (single-org user), the server
// picks the earliest membership.
export const CURRENT_ORG_LS_KEY = "thriveup.currentOrgId";

// Set by useAuth when a user signs in; cleared on explicit logout. Lets the
// session-expiry handler distinguish an expired session from a visitor who was
// never signed in, even before the auth query resolves.
export const WAS_AUTHED_LS_KEY = "thriveup.wasAuthenticated";
function currentOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const v = window.localStorage.getItem(CURRENT_ORG_LS_KEY);
    return v ? { "x-org-id": v } : {};
  } catch { return {}; }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // A 401 on a mutation (via apiRequest) or a "throw"-mode query means the
    // session expired. Surface the typed error so the global handler shows a
    // single toast + login redirect instead of a raw "401: Unauthorized".
    if (res.status === 401) {
      throw new SessionExpiredError();
    }
    const text = (await res.text()) || res.statusText;
    // ORG_REQUIRED 404s are an EXPECTED response for signed-in-no-org users
    // hitting /api/me/* endpoints. Route-level redirects to /onboarding/org
    // are handled by client/src/components/org-redirect-guard.tsx (soft wouter
    // navigation, scoped to routes that genuinely require an org). Per-page
    // queries that incidentally hit a requireOrg endpoint (e.g. /api/grants
    // page fetching /api/me/grants/tracked) should treat ORG_REQUIRED as
    // "no data yet" and let the page render. Previously this branch did a
    // hard window.location.assign() reload, which (a) caused a full-page
    // flash on every click that touched any /api/me/* endpoint, and (b)
    // silently bounced users away from public pages whose components happened
    // to call an org-scoped query without gating on isAuthenticated. The
    // fix: do NOT redirect from here. Pages that need to gate on org should
    // pass `enabled: isAuthenticated` to their useQuery calls, and pages that
    // genuinely require an org are protected by the route-level guard above.
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...currentOrgHeader(),
      ...(extraHeaders ?? {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// "returnNull"       — 401 means "no data yet" (genuinely public/optional queries).
// "throw"            — 401 throws a generic Error (legacy behavior).
// "sessionExpired"   — 401 throws SessionExpiredError, which the global
//                      QueryCache onError turns into ONE toast + login redirect.
//                      This is the default: it's what surfaces an expired session
//                      instead of rendering it as empty data.
type UnauthorizedBehavior = "returnNull" | "throw" | "sessionExpired";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: { ...currentOrgHeader() },
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null as any;
      }
      if (unauthorizedBehavior === "sessionExpired") {
        throw new SessionExpiredError();
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// ─── Single-flight session-expiry handling ──────────────────────────────────
// When a session expires, a page with 10 authenticated queries will fire 10
// SessionExpiredErrors near-simultaneously. We must not spam 10 toasts or kick
// off 10 redirects. This latch ensures exactly ONE toast + ONE redirect.
let sessionExpiryHandled = false;
export function handleSessionExpired() {
  if (sessionExpiryHandled) return;
  if (typeof window === "undefined") return;

  // ANONYMOUS GUARD: a visitor who was never signed in will also get 401s from
  // authed endpoints their page happens to query. That is NOT an expired
  // session — never toast/redirect them off a public page. We treat a 401 as
  // session expiry only if the auth cache currently has a user OR this browser
  // was previously authenticated (localStorage flag set by useAuth on sign-in,
  // cleared on explicit logout) — the flag covers the window where the auth
  // query is unresolved or has already cached null for the expired session.
  const cachedUser = queryClient.getQueryData(["/api/auth/user"]);
  let wasAuthed = false;
  try { wasAuthed = window.localStorage.getItem(WAS_AUTHED_LS_KEY) === "1"; } catch { /* private mode */ }
  if (!cachedUser && !wasAuthed) return;

  sessionExpiryHandled = true;
  try { window.localStorage.removeItem(CURRENT_ORG_LS_KEY); } catch { /* private mode */ }

  toast({
    title: "Session expired",
    description: "Your session expired — please sign in again.",
    variant: "destructive",
  });

  // Preserve where the user was so the login flow can bring them back.
  const returnTo = window.location.pathname + window.location.search;
  // Small delay so the toast is visible before the full-page navigation.
  window.setTimeout(() => {
    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, 800);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof SessionExpiredError) {
        handleSessionExpired();
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof SessionExpiredError) {
        handleSessionExpired();
      }
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "sessionExpired" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
