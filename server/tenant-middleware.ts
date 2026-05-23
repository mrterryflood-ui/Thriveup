import type { Request, Response, NextFunction, RequestHandler } from "express";
import { db } from "./storage";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

export function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

/** TCAF internal admin gate — for /grant-command-center and TCAF-only routes. */
export async function requireTcafAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user?.isTcafAdmin) return next();
  } catch (e) {
    console.error("[tenant] tcaf admin check failed:", e);
  }
  return res.status(403).json({ error: "TCAF admin access required" });
}

/** Resolve the caller's organization. Attaches `req.org` if found. */
export async function loadCallerOrg(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) return next();
  try {
    const [org] = await db.select().from(organizations).where(eq(organizations.userId, userId));
    if (org) (req as unknown as Record<string, unknown>).org = org;
  } catch (e) {
    console.error("[tenant] loadCallerOrg failed:", e);
  }
  next();
}

export async function requireOrg(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  const existing = (req as unknown as Record<string, unknown>).org;
  if (existing) return next();
  try {
    const [org] = await db.select().from(organizations).where(eq(organizations.userId, userId));
    if (!org) return res.status(404).json({ error: "No organization profile found", code: "ORG_REQUIRED" });
    (req as unknown as Record<string, unknown>).org = org;
    next();
  } catch (e) {
    console.error("[tenant] requireOrg failed:", e);
    res.status(500).json({ error: "Org lookup failed" });
  }
}

export function getCallerOrg(req: Request): { id: string; [k: string]: unknown } | undefined {
  return (req as unknown as Record<string, unknown>).org as { id: string } | undefined;
}

// --- Cost-control rate limiter for paid-AI endpoints --------------------
// Per-user sliding window. Cheap, in-memory. Resets on server restart.
const aiCallLog = new Map<string, number[]>();
export function rateLimitAi(opts: { perMinute?: number; perHour?: number } = {}): RequestHandler {
  const perMinute = opts.perMinute ?? 6;
  const perHour = opts.perHour ?? 40;
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const now = Date.now();
    const log = (aiCallLog.get(userId) ?? []).filter(t => now - t < 3600_000);
    const lastMinute = log.filter(t => now - t < 60_000).length;
    if (lastMinute >= perMinute) {
      return res.status(429).json({ error: "Rate limit: too many AI calls in last minute", retryAfterSec: 60 });
    }
    if (log.length >= perHour) {
      return res.status(429).json({ error: "Rate limit: AI hourly quota reached", retryAfterSec: 3600 });
    }
    log.push(now);
    aiCallLog.set(userId, log);
    next();
  };
}
