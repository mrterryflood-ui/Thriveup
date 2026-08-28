import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { peekAnonSessionId, clearAnonSessionId } from "@/lib/trade-sims/anon-session";
import { queryClient as globalQueryClient, WAS_AUTHED_LS_KEY } from "@/lib/queryClient";
import { clearCurrentOrgSelection } from "@/hooks/use-current-org";

// Merge anonymous trade-sims progress into the account once, right after auth
// becomes available. Fires exactly once per page load per authenticated user.
async function mergeAnonTradeSimsProgress(): Promise<void> {
  const anonSessionId = peekAnonSessionId();
  if (!anonSessionId) return;
  // 401 here means the session isn't actually authenticated yet — leave the
  // anon id in place so a later, genuinely authenticated call can merge it.
  // The x-anon-session header is the possession proof the server requires.
  const res = await fetch("/api/trade-sims/merge-anon", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-anon-session": anonSessionId },
    body: JSON.stringify({ anonSessionId }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`merge-anon failed: ${res.status}`);
  await res.json();
  // Merge succeeded (rows moved and/or conflicts resolved) — clear the local
  // anon id so we don't merge (and log) the same session again.
  clearAnonSessionId();
  globalQueryClient.invalidateQueries({ queryKey: ["/api/trade-sims/progress"] });
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  clearCurrentOrgSelection();
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Session-expiry signal: remember that this browser WAS authenticated so the
  // global 401 handler (queryClient.ts) can tell "expired session" apart from
  // "anonymous visitor" even when the auth cache is null/unresolved. Cleared
  // only on explicit logout.
  useEffect(() => {
    if (user) {
      try { localStorage.setItem(WAS_AUTHED_LS_KEY, "1"); } catch { /* private mode */ }
    }
  }, [user]);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      try { localStorage.removeItem(WAS_AUTHED_LS_KEY); } catch { /* private mode */ }
      queryClient.clear();
    },
  });

  // When auth resolves to a real user and a local anon trade-sims session
  // exists, merge that anonymous progress into the account once.
  const mergeFiredForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const uid = user.id ?? null;
    if (uid === null || mergeFiredForRef.current === uid) return;
    if (!peekAnonSessionId()) return;
    mergeFiredForRef.current = uid;
    // Fire loudly — surface failures in the console rather than swallowing them.
    mergeAnonTradeSimsProgress().catch((err) => {
      console.error("[Auth] trade-sims anon merge failed:", err);
      // Allow a retry on the next auth resolution rather than sticking.
      mergeFiredForRef.current = null;
    });
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
