import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    // Cascade-failure guard: any signed-in user without an org profile gets
    // bounced to the onboarding wizard instead of seeing a silent dead-end.
    // Every workspace route (RFP Fidelity, My Grants, Documents…) returns
    // 404 with code:"ORG_REQUIRED" via tenant-middleware.requireOrg. Without
    // this redirect the page just spins or shows an opaque error toast.
    if (res.status === 404 && text.includes("ORG_REQUIRED") && typeof window !== "undefined") {
      const here = window.location.pathname;
      if (!here.startsWith("/onboarding/org") && !here.startsWith("/api/")) {
        window.location.assign("/onboarding/org");
      }
    }
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
