// Shared client-storage helper.
//
// Goals (from the offline/client-storage audit):
//   - Never throw in private-browsing / disabled-storage modes. All access is
//     wrapped; on failure we fall back to an in-memory Map so the current tab
//     keeps working (fail-soft for READS/WRITES, but never fabricate data).
//   - Versioned envelopes so a schema/format change invalidates old data
//     instead of silently mis-parsing it.
//   - Optional expiry so tokens/drafts don't live forever.
//   - QuotaExceededError handling: prune caller-nominated keys, then retry once.
//
// This is deliberately dependency-free and framework-agnostic.

type Store = "local" | "session";

// In-memory fallback used when the real Web Storage throws (private mode,
// blocked cookies, etc.). Keyed by store type so local/session stay distinct.
const memFallback: Record<Store, Map<string, string>> = {
  local: new Map(),
  session: new Map(),
};

function backing(store: Store): Storage | null {
  try {
    const s = store === "local" ? window.localStorage : window.sessionStorage;
    // Touch it to force a throw now (some browsers only throw on access).
    const probe = "__ss_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** Raw string get — never throws. Falls back to in-memory. */
export function safeGetRaw(key: string, store: Store = "local"): string | null {
  const s = backing(store);
  if (!s) return memFallback[store].get(key) ?? null;
  try {
    return s.getItem(key);
  } catch {
    return memFallback[store].get(key) ?? null;
  }
}

/**
 * Raw string set — never throws. On QuotaExceededError, prune the provided
 * `pruneKeys` (oldest-first, caller's responsibility to order) and retry once.
 * Returns true on success, false if it still could not persist (caller may
 * surface this loudly, e.g. via a toast).
 */
export function safeSetRaw(
  key: string,
  value: string,
  store: Store = "local",
  pruneKeys: string[] = [],
): boolean {
  const s = backing(store);
  if (!s) {
    memFallback[store].set(key, value);
    return false; // did not truly persist
  }
  try {
    s.setItem(key, value);
    return true;
  } catch (err) {
    // Attempt quota recovery: drop nominated keys then retry once.
    if (isQuotaError(err) && pruneKeys.length > 0) {
      for (const k of pruneKeys) {
        try { s.removeItem(k); } catch { /* ignore */ }
      }
      try {
        s.setItem(key, value);
        return true;
      } catch {
        memFallback[store].set(key, value);
        return false;
      }
    }
    memFallback[store].set(key, value);
    return false;
  }
}

export function safeRemove(key: string, store: Store = "local"): void {
  const s = backing(store);
  memFallback[store].delete(key);
  if (!s) return;
  try { s.removeItem(key); } catch { /* ignore */ }
}

export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    // Legacy Safari
    (err as any).code === 22 ||
    (err as any).code === 1014
  );
}

// ---------------------------------------------------------------------------
// Versioned envelope helpers
// ---------------------------------------------------------------------------

interface Envelope<T> {
  v: number;
  /** epoch ms expiry; omitted/undefined means no expiry */
  exp?: number;
  data: T;
}

export interface EnvelopeOptions {
  /** Version tag; a mismatch on read drops the stored value. */
  version: number;
  store?: Store;
  /** Time-to-live in ms from write. Omit for no expiry. */
  ttlMs?: number;
  /** Keys to prune (oldest-first) on QuotaExceededError. */
  pruneKeys?: string[];
}

/**
 * Read a versioned envelope. Returns null if missing, malformed, wrong
 * version, or expired. Expired/invalid entries are cleared as a side effect.
 * `validate` lets the caller assert the parsed shape (return false → drop).
 */
export function getVersioned<T>(
  key: string,
  opts: EnvelopeOptions,
  validate?: (data: unknown) => data is T,
): T | null {
  const store = opts.store ?? "local";
  const raw = safeGetRaw(key, store);
  if (raw == null) return null;
  let env: Envelope<unknown>;
  try {
    env = JSON.parse(raw) as Envelope<unknown>;
  } catch {
    safeRemove(key, store);
    return null;
  }
  if (!env || typeof env !== "object" || env.v !== opts.version) {
    safeRemove(key, store);
    return null;
  }
  const nowMs = Date.now();
  if (typeof env.exp === "number" && env.exp <= nowMs) {
    safeRemove(key, store);
    return null;
  }
  if (validate && !validate(env.data)) {
    safeRemove(key, store);
    return null;
  }
  return env.data as T;
}

/**
 * Write a versioned envelope. Returns true on persistence, false if it fell
 * back to memory / quota could not be recovered (caller should surface).
 */
export function setVersioned<T>(key: string, data: T, opts: EnvelopeOptions): boolean {
  const store = opts.store ?? "local";
  const env: Envelope<T> = { v: opts.version, data };
  if (typeof opts.ttlMs === "number") env.exp = Date.now() + opts.ttlMs;
  let payload: string;
  try {
    payload = JSON.stringify(env);
  } catch {
    return false;
  }
  return safeSetRaw(key, payload, store, opts.pruneKeys ?? []);
}
