import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
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
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
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
