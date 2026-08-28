import type { Request, Response, NextFunction, RequestHandler } from "express";
import { db } from "./storage";
import { users, organizations, organizationMembers } from "@shared/schema";
import { and, eq } from "drizzle-orm";

// The Community Events & Impact workspace is intentionally governed by two
// independent persisted authorities: a platform staff role and an
// organization-scoped membership role. Keep the predicates here so routes
// that administer and enforce the workspace cannot drift apart.
export const EVENT_WORKSPACE_PLATFORM_STAFF_ROLES = [
  "admin",
  "teacher",
  "case_manager",
  "facilitator",
  "staff",
] as const;
export const EVENT_WORKSPACE_ACTIVE_MEMBER_ROLES = [
  "owner",
  "staff",
] as const;
export const EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE = "staff" as const;

export function isEventWorkspacePlatformStaffRole(role: string | null | undefined): boolean {
  return EVENT_WORKSPACE_PLATFORM_STAFF_ROLES.includes(role as typeof EVENT_WORKSPACE_PLATFORM_STAFF_ROLES[number]);
}

export function isEventWorkspaceActiveMemberRole(role: string | null | undefined): boolean {
  return EVENT_WORKSPACE_ACTIVE_MEMBER_ROLES.includes(role as typeof EVENT_WORKSPACE_ACTIVE_MEMBER_ROLES[number]);
}

export function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

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

// Resolve which org the caller is acting as for this request.
// Multi-org users (e.g. Eric in both M&T and TCAF) disambiguate by sending
// an x-org-id header. Without one, we pick the user's earliest membership
// — typically their own org. Legacy fallback: if no membership rows exist
// for this user yet, look up by organizations.user_id (the original
// one-user-one-org column) so pre-migration users still work.
export async function loadCallerOrg(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) return next();
  try {
    const requested = req.headers["x-org-id"];
    const requestedOrgId = typeof requested === "string" ? requested : undefined;

    const memberships = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, userId));

    let chosenOrgId: string | undefined;
    let role: string | undefined;
    if (memberships.length > 0) {
      const matched = requestedOrgId ? memberships.find((m) => m.orgId === requestedOrgId) : undefined;
      if (requestedOrgId && !matched) {
        return res.status(403).json({ error: "The selected organization is not one of your current memberships.", code: "ORG_ACCESS_DENIED" });
      }
      const picked = matched ?? memberships.slice().sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
      chosenOrgId = picked.orgId;
      role = picked.role;
    } else {
      // Legacy fallback — pre-membership users
      const [org] = await db.select().from(organizations).where(eq(organizations.userId, userId));
      if (org) {
        chosenOrgId = org.id;
        role = "owner";
      }
    }

    if (!chosenOrgId) return next();
    const [org] = await db.select().from(organizations).where(eq(organizations.id, chosenOrgId));
    if (org) {
      (req as unknown as Record<string, unknown>).org = org;
      (req as unknown as Record<string, unknown>).orgRole = role;
    }
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
  // Re-run the resolution path so requireOrg can stand on its own without
  // requiring callers to also use loadCallerOrg first.
  await loadCallerOrg(req, res, () => {});
  const resolved = (req as unknown as Record<string, unknown>).org;
  if (!resolved) {
    return res.status(404).json({ error: "No organization profile found", code: "ORG_REQUIRED" });
  }
  next();
}

export function getCallerOrg(req: Request): { id: string; [k: string]: unknown } | undefined {
  return (req as unknown as Record<string, unknown>).org as { id: string } | undefined;
}

export function getCallerOrgRole(req: Request): string | undefined {
  return (req as unknown as Record<string, unknown>).orgRole as string | undefined;
}

const aiCallLog = new Map<string, number[]>();
export function rateLimitAi(opts: { perMinute?: number; perHour?: number } = {}): RequestHandler {
  const perMinute = opts.perMinute ?? 6;
  const perHour = opts.perHour ?? 40;
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const now = Date.now();
    const log = (aiCallLog.get(userId) ?? []).filter((t) => now - t < 3600_000);
    const lastMinute = log.filter((t) => now - t < 60_000).length;
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
