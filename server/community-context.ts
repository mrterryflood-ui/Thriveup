/**
 * Community Context Orchestration Layer
 *
 * Single source of truth for injecting live community intelligence into every
 * AI call on the platform. Uses Node.js AsyncLocalStorage so the context flows
 * automatically through the async call stack — no route-level changes required.
 *
 * How it works:
 *  1. communityContextMiddleware() extracts ZIP from any request body field.
 *  2. If the ZIP is cached, it wraps next() inside AsyncLocalStorage.run() so
 *     every downstream AI call inherits the community context automatically.
 *  3. If the ZIP is not cached, it fires a background warm — the *current*
 *     request proceeds without community context, but future requests for the
 *     same ZIP will hit the cache.
 *  4. withEthicalPreamble() (ai-provider.ts) reads getCurrentCommunityContext()
 *     and appends it to every system prompt — zero route changes needed.
 *
 * Cache: 30-min TTL, in-flight deduplication, ~60 ZIPs in memory at once.
 */

import type { Request, Response, NextFunction } from "express";
import { AsyncLocalStorage } from "async_hooks";
import { buildCommunityAIContext, buildCommunityAIContextWithStatus } from "./rplice-intelligence";
import { governmentContextForZipWithStatus } from "./government-coordination";

// ─── AsyncLocalStorage (the wire) ─────────────────────────────────────────────
const communityStorage = new AsyncLocalStorage<string>();

/** Read the community context string wired into the current async context.
 *  Returns "" if no context is active (request had no geography). */
export function getCurrentCommunityContext(): string {
  return communityStorage.getStore() ?? "";
}

/** Run fn() inside an AsyncLocalStorage context carrying the given string.
 *  Used by the middleware to wrap next() — all async work under next()
 *  inherits the community context without any explicit passing. */
export function runWithCommunityContext<T>(context: string, fn: () => T): T {
  return communityStorage.run(context, fn);
}

// ─── TTL cache ─────────────────────────────────────────────────────────────────
interface CacheEntry { context: string; expiresAt: number }
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<string>>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ENTRIES = 80;               // cap memory
const MAX_IN_FLIGHT = 100;

function evictOldest() {
  if (cache.size < MAX_ENTRIES) return;
  const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
  if (oldest) cache.delete(oldest[0]);
}

/** Return cached context synchronously. Empty string if not cached. */
export function getCommunityContextSync(zip: string): string {
  const entry = cache.get(zip);
  if (entry && entry.expiresAt > Date.now()) return entry.context;
  if (entry) cache.delete(zip);
  return "";
}

/** Fetch + cache community context for a ZIP. Deduplicates in-flight requests. */
export async function warmCommunityContext(zip: string): Promise<string> {
  const cached = cache.get(zip);
  if (cached && cached.expiresAt > Date.now()) return cached.context;
  if (cached) cache.delete(zip);

  if (inFlight.has(zip)) return inFlight.get(zip)!;
  if (inFlight.size >= MAX_IN_FLIGHT) {
    console.warn("[CommunityContext] in-flight capacity reached; skipping warm");
    return "";
  }

  const promise = Promise.all([
    buildCommunityAIContextWithStatus({ zip }),
    governmentContextForZipWithStatus(zip),
  ])
    .then(([result, government]) => {
      const ctx = [result.content, government.content].filter(Boolean).join("\n\n");
      if (!ctx) {
        inFlight.delete(zip);
        return "";
      }
      evictOldest();
      const hasFailedSource = Object.values(result.sources).includes("failed") || government.failed;
      const ttl = hasFailedSource ? 5 * 60 * 1000 : CACHE_TTL_MS;
      cache.set(zip, { context: ctx, expiresAt: Math.min(Date.now() + ttl, government.expiresAt) });
      inFlight.delete(zip);
      return ctx;
    })
    .catch((err) => {
      console.error("[CommunityContext] Context warm failed:", err instanceof Error ? err.message : String(err));
      inFlight.delete(zip);
      return "";
    });

  inFlight.set(zip, promise);
  return promise;
}

// ─── ZIP extraction ────────────────────────────────────────────────────────────
/**
 * Extract a 5-digit ZIP from anywhere it commonly appears in a request:
 * body.zip, body.zipCode, body.zip_code, body.geography.zip,
 * body.location.zip, body.address.zip, params.zip, query.zip
 */
function extractZip(req: Request): string | null {
  const b: any = req.body || {};
  const candidates = [
    b.zip, b.zipCode, b.zip_code,
    b.geography?.zip, b.location?.zip, b.address?.zip,
    b.brief?.geography?.zip,
    (req.params as any)?.zip,
    (req.query as any)?.zip,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && /^\d{5}$/.test(c.trim())) return c.trim();
    if (typeof c === "number" && String(c).length === 5) return String(c);
  }
  return null;
}

// ─── Express middleware ────────────────────────────────────────────────────────
/**
 * Register this once in server/routes.ts after body-parser but before routes.
 *
 *   app.use(communityContextMiddleware());
 *
 * Every AI call downstream automatically receives the live community data
 * for the request's geography through withEthicalPreamble() in ai-provider.ts.
 */
export function communityContextMiddleware() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const zip = extractZip(req);

    if (!zip) {
      next();
      return;
    }

    const cached = getCommunityContextSync(zip);

    if (cached) {
      // Hot path: context already in cache — wrap next() in AsyncLocalStorage
      runWithCommunityContext(cached, () => next());
      return;
    }

    // Cold path: wait for the bounded source fan-in so the interaction that
    // supplied the geography receives the same evidence-aware context as the
    // next request. This is the consistency path; in-flight deduplication and
    // the 30-minute cache keep subsequent interactions fast.
    let budgetTimer: ReturnType<typeof setTimeout>;
    const budget = new Promise<string>((resolve) => {
      budgetTimer = setTimeout(() => resolve(`[Community sources for ZIP ${zip} are still loading; no current evidence has been retrieved for this request. Do not invent local facts.]`), 250);
    });
    void Promise.race([warmCommunityContext(zip), budget])
      .finally(() => clearTimeout(budgetTimer))
      .then((context) => {
        if (context) {
          runWithCommunityContext(context, () => next());
        } else {
          next();
        }
      })
      .catch((err) => {
        console.error("[CommunityContext] Cold-path context unavailable:", err instanceof Error ? err.message : String(err));
        next();
      });
  };
}

/**
 * Manually inject community context for a specific ZIP into the current
 * async context. Used by Navigator (which detects ZIP from message text,
 * not request body) and any route that knows geography but whose ZIP
 * doesn't live in req.body.
 *
 * Usage:
 *   const ctx = await warmCommunityContext(zip);
 *   return runWithCommunityContext(ctx, () => callAI(...));
 */
export { buildCommunityAIContext };
