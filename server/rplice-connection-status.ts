import type { Express, RequestHandler } from "express";

type FetchLike = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status: number }>;

export interface RpliceConnectionStatusOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  now?: () => number;
}

function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return { signal: AbortSignal.timeout(timeoutMs), cleanup: () => {} };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

export function resolveRpliceApiKey(explicit?: string): string {
  if (explicit !== undefined) return explicit;
  return process.env.RPLICE_API_KEY
    || process.env.THRIVE_GPP_API_KEY
    || process.env.THRIVEUP_INBOUND_KEY
    || process.env.THRIVE_GPP_API
    || "";
}

export function createRpliceConnectionStatusHandler(options: RpliceConnectionStatusOptions = {}): RequestHandler {
  const fetchImpl = options.fetchImpl ?? (fetch as FetchLike);
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const baseUrl = options.baseUrl ?? process.env.RPLICE_BASE_URL ?? "https://www.bettersciencelab.com";

  return async (_req, res) => {
    const apiKey = resolveRpliceApiKey(options.apiKey);
    if (!apiKey) {
      return res.status(503).json({ connected: false, reason: "RPLICE_API_KEY is not configured" });
    }

    const startedAt = now();
    const { signal, cleanup } = createTimeoutSignal(timeoutMs);
    try {
      const authHeader = "Bearer " + apiKey;
      const response = await fetchImpl(`${baseUrl}/api/v1/frameworks`, {
        headers: { Authorization: authHeader },
        signal,
      });

      return res.status(response.ok ? 200 : 502).json({
        connected: response.ok,
        upstreamStatus: response.status,
        latencyMs: Math.max(0, now() - startedAt),
      });
    } catch {
      return res.status(502).json({
        connected: false,
        reason: "RPLICE request failed",
        latencyMs: Math.max(0, now() - startedAt),
      });
    } finally {
      cleanup();
    }
  };
}

export function registerRpliceConnectionStatusRoute(
  app: Express,
  requireAuth: RequestHandler,
  options: RpliceConnectionStatusOptions = {},
): void {
  app.get("/api/rplice/connection-status", requireAuth, createRpliceConnectionStatusHandler(options));
}
