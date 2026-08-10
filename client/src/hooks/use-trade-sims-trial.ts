/**
 * Trade Sims 10-minute anonymous trial hook.
 *
 * - Pings the server once on mount to get `startedAt` (server sets the signed
 *   cookie on first call).
 * - Computes `remainingMs` locally on a 1-second tick so the UI counts down
 *   without hammering the server.
 * - Re-fetches every 90s to catch server-side rejection (admin reset, etc.).
 * - When the caller becomes authenticated, the hook stops the trial and
 *   POSTs to /api/trade-sims/login-track so admin can see them.
 *
 * Used by <TradeSimsTrialGate>. Do not import elsewhere.
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface TrialStatus {
  authenticated: boolean;
  startedAt?: number;
  remainingMs: number;
  totalMs: number;
  expired: boolean;
}

const DEFAULT_TOTAL_MS = 10 * 60 * 1000;

async function fetchTrialStatus(signal?: AbortSignal): Promise<TrialStatus> {
  const r = await fetch("/api/trade-sims/trial/status", { credentials: "include", signal });
  if (!r.ok) {
    return {
      authenticated: false,
      remainingMs: DEFAULT_TOTAL_MS,
      totalMs: DEFAULT_TOTAL_MS,
      expired: false,
    };
  }
  return r.json();
}

async function trackLogin(path: string): Promise<void> {
  try {
    await fetch("/api/trade-sims/login-track", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch {
    // best-effort — we never want a tracking failure to break the page
  }
}

export interface UseTradeSimsTrialResult {
  /** True until the first status call resolves. */
  loading: boolean;
  /** True when the user is signed in — no timer applies. */
  authenticated: boolean;
  /** Server-issued trial start time (ms epoch). undefined while loading or authed. */
  startedAt?: number;
  /** Live-ticking remaining ms (ignored when authenticated). */
  remainingMs: number;
  /** Total trial length (10 min). */
  totalMs: number;
  /** True when remainingMs <= 0 and not authenticated. */
  expired: boolean;
}

export function useTradeSimsTrial(): UseTradeSimsTrialResult {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<TrialStatus | null>(null);
  const trackedRef = useRef<string | null>(null);

  // Initial + periodic fetch. Guard against overlapping polls: if a previous
  // fetch is still in flight when the interval fires, abort it first so a slow
  // response can't resolve after a newer one and clobber state.
  useEffect(() => {
    let cancelled = false;
    let inFlight: AbortController | null = null;

    const poll = async () => {
      // Abort any still-in-flight request before starting a new one.
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      try {
        const s = await fetchTrialStatus(controller.signal);
        if (!cancelled && !controller.signal.aborted) setState(s);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        // Non-abort network failure: leave prior state intact (fetchTrialStatus
        // only throws on network error, not on !ok).
      } finally {
        if (inFlight === controller) inFlight = null;
      }
    };

    void poll();
    const id = setInterval(() => { void poll(); }, 90_000);
    return () => {
      cancelled = true;
      clearInterval(id);
      inFlight?.abort();
    };
  }, [isAuthenticated]);

  // 1s tick so the countdown updates between server fetches.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (isAuthenticated) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  // Track login once per session on the first authenticated render.
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    if (trackedRef.current === path) return;
    trackedRef.current = path;
    void trackLogin(path);
  }, [isAuthenticated, authLoading]);

  const loading = authLoading || state === null;

  if (isAuthenticated) {
    return {
      loading,
      authenticated: true,
      remainingMs: DEFAULT_TOTAL_MS,
      totalMs: DEFAULT_TOTAL_MS,
      expired: false,
    };
  }

  if (!state) {
    return {
      loading: true,
      authenticated: false,
      remainingMs: DEFAULT_TOTAL_MS,
      totalMs: DEFAULT_TOTAL_MS,
      expired: false,
    };
  }

  const startedAt = state.startedAt;
  const totalMs = state.totalMs || DEFAULT_TOTAL_MS;
  const remainingMs = startedAt
    ? Math.max(0, totalMs - (nowMs - startedAt))
    : state.remainingMs;

  return {
    loading,
    authenticated: false,
    startedAt,
    remainingMs,
    totalMs,
    expired: remainingMs <= 0,
  };
}
