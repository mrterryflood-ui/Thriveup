// Integration through Invitation (ITI) — dignity primitive for shadow workers.
// See Iron Rule #8 + docs/agent-memory/topics/integration-through-invitation.md
//
// Public, capability-token-authenticated (same pattern as foster-youth-intake-routes.ts).
// All consent toggles default false (anti-extraction). Witness loop is always on.

import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  integrationInvitations,
  invitationConsents,
  recognitionEvents,
  type IntegrationInvitation,
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomBytes, timingSafeEqual } from "crypto";

function getUser(req: Request) {
  const u = (req as unknown as Record<string, unknown>).user as
    | { claims?: { sub?: string; email?: string }; id?: string; role?: string }
    | undefined;
  return u;
}
function getUserId(req: Request): string | undefined {
  const u = getUser(req);
  return u?.claims?.sub || u?.id;
}
// ITI admin = true admin ONLY. Shadow-worker records carry layered consent + recognition
// audit; broader roles (case_manager, teacher) MUST NOT read them. See Iron Rule #8.
function isAdmin(req: Request): boolean {
  const u = getUser(req);
  return !!u && u.role === "admin";
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Unauthorized" });
  if (isAdmin(req)) return next();
  return res.status(403).json({ error: "Admin access required" });
}
function tokensMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Lightweight per-IP rate limiter (last-resort budget guardrail for the public create endpoint).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
function consume(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, retryAfterSec: 0 }; }
  if (b.count >= max) return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}
function rateLimit(name: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isAdmin(req)) return next();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const r = consume(`iti:${name}:${ip}`, max, windowMs);
    if (!r.allowed) { res.setHeader("Retry-After", String(r.retryAfterSec)); return res.status(429).json({ error: `Rate limit exceeded. Try again in ${r.retryAfterSec}s.` }); }
    const g = consume(`iti:global:${name}`, max * 50, windowMs);
    if (!g.allowed) { res.setHeader("Retry-After", String(g.retryAfterSec)); return res.status(429).json({ error: `Service is temporarily limiting ${name}.` }); }
    next();
  };
}

// Header-only capability token. NO query-param fallback (avoids token leakage via
// referrers, server logs, browser history). Iron Rule #8 hygiene.
async function authorizeInvitation(req: Request, invitationId: string): Promise<{ invitation: IntegrationInvitation } | null> {
  const [invitation] = await db.select().from(integrationInvitations).where(eq(integrationInvitations.id, invitationId)).limit(1);
  if (!invitation) return null;
  if (isAdmin(req)) return { invitation };
  const presented = (req.header("x-iti-token") || "").trim();
  if (tokensMatch(invitation.accessToken, presented)) return { invitation };
  return null;
}

// === ANTI-EXTRACTION GATE — Iron Rule #8 ===
// Any AI call site (summarizer, clusterer, insight generator, grant-doc generator)
// that processes content authored by an ITI invitee MUST call this helper first.
// Returns true only if the invitee has explicitly toggled `aggregateMyData=true`.
// Throws ItiConsentDeniedError if not — callers should catch and skip that record.
//
// This is the load-bearing enforcement point for the doctrine "AI never summarizes
// a shadow-worker story without aggregateMyData=true." If you bypass it, you break
// the promise.
export class ItiConsentDeniedError extends Error {
  constructor(public invitationId: string, public consentKey: string) {
    super(`ITI consent denied: invitation=${invitationId} requires ${consentKey}=true`);
    this.name = "ItiConsentDeniedError";
  }
}

export async function assertItiConsent(
  invitationId: string,
  consentKey: "aggregateMyData" | "quoteMe" | "shareWithFunder" | "nameMePublicly"
): Promise<boolean> {
  const [row] = await db.select().from(invitationConsents).where(eq(invitationConsents.invitationId, invitationId)).limit(1);
  if (!row || !row[consentKey]) throw new ItiConsentDeniedError(invitationId, consentKey);
  return true;
}

/** Filter a list of records, returning only those whose linked ITI invitee has granted the consent. Silently drops non-consenting records. */
export async function filterByItiConsent<T extends { itiInvitationId?: string | null }>(
  rows: T[],
  consentKey: "aggregateMyData" | "quoteMe" | "shareWithFunder" | "nameMePublicly"
): Promise<T[]> {
  const result: T[] = [];
  for (const r of rows) {
    if (!r.itiInvitationId) { result.push(r); continue; } // not ITI-linked, pass through
    try { await assertItiConsent(r.itiInvitationId, consentKey); result.push(r); }
    catch (e) { if (!(e instanceof ItiConsentDeniedError)) throw e; /* drop */ }
  }
  return result;
}

const ALLOWED_SURFACES = new Set([
  "voice-project", "foster-intake", "lifebridge", "justice-hub",
  "trade-sims", "wph", "workforce-readiness", "public-site", "direct",
]);

const MAX_TEXT = 4000;
const MAX_SHORT = 500;
function clean(v: unknown, max = MAX_SHORT): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

async function logRecognition(invitationId: string, eventType: string, description: string, opts?: { actorRole?: string; actorId?: string; surfaceRef?: string; payload?: Record<string, unknown> }) {
  try {
    await db.insert(recognitionEvents).values({
      invitationId,
      eventType,
      description,
      actorRole: opts?.actorRole ?? null,
      actorId: opts?.actorId ?? null,
      surfaceRef: opts?.surfaceRef ?? null,
      payloadJson: opts?.payload ?? null,
    });
  } catch (err) {
    console.error("[ITI] recognition log failed:", err);
  }
}

export function registerIntegrationInvitationRoutes(app: Express) {
  // --- PUBLIC: self-identify (creates the invitation + capability token) ---
  app.post("/api/iti/invitations", rateLimit("create", 30, 60 * 60 * 1000), async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const surface = clean(body.surface, 64);
      if (!surface || !ALLOWED_SURFACES.has(surface)) return res.status(400).json({ error: "Invalid or missing surface" });

      const workDescription = clean(body.workDescription, MAX_TEXT);
      if (!workDescription) return res.status(400).json({ error: "workDescription is required — tell us what work you do, in your own words" });

      const rolesRaw = Array.isArray(body.workRolesSelfIdentified) ? body.workRolesSelfIdentified : [];
      const workRolesSelfIdentified = rolesRaw.map((r) => clean(r, 100)).filter((r): r is string => !!r).slice(0, 10);

      const accessToken = randomBytes(24).toString("base64url");

      const [row] = await db.insert(integrationInvitations).values({
        accessToken,
        displayName: clean(body.displayName, 200),
        preferredContact: clean(body.preferredContact, 200),
        preferredLanguage: (clean(body.preferredLanguage, 16) || "en"),
        workDescription,
        workRolesSelfIdentified,
        yearsDoingWork: clean(body.yearsDoingWork, 200),
        region: clean(body.region, 300),
        zipCode: clean(body.zipCode, 12),
        surface,
        surfaceContext: clean(body.surfaceContext, 300),
        status: "invited",
      }).returning();

      // All consent toggles default false — anti-extraction posture
      await db.insert(invitationConsents).values({ invitationId: row.id });

      await logRecognition(row.id, "heard", "Self-identified through Integration through Invitation", { actorRole: "system", surfaceRef: surface });

      const { accessToken: _t, ...safe } = row;
      res.status(201).json({ invitation: safe, accessToken });
    } catch (err) {
      console.error("[ITI] create failed:", err);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // --- PUBLIC (token-authed): read own record ---
  app.get("/api/iti/invitations/:id", async (req, res) => {
    const auth = await authorizeInvitation(req, req.params.id);
    if (!auth) return res.status(404).json({ error: "Not found" });
    const [consents] = await db.select().from(invitationConsents).where(eq(invitationConsents.invitationId, auth.invitation.id)).limit(1);
    const { accessToken: _t, ...safe } = auth.invitation;
    res.json({ invitation: safe, consents: consents ?? null });
  });

  // --- PUBLIC (token-authed): update profile fields ---
  app.patch("/api/iti/invitations/:id", async (req, res) => {
    const auth = await authorizeInvitation(req, req.params.id);
    if (!auth) return res.status(404).json({ error: "Not found" });
    const body = req.body as Record<string, unknown>;
    const updates: Partial<typeof integrationInvitations.$inferInsert> = {};
    if ("displayName" in body) updates.displayName = clean(body.displayName, 200);
    if ("preferredContact" in body) updates.preferredContact = clean(body.preferredContact, 200);
    if ("preferredLanguage" in body) updates.preferredLanguage = clean(body.preferredLanguage, 16) || "en";
    if ("workDescription" in body) { const v = clean(body.workDescription, MAX_TEXT); if (v) updates.workDescription = v; }
    if ("workRolesSelfIdentified" in body && Array.isArray(body.workRolesSelfIdentified)) {
      updates.workRolesSelfIdentified = body.workRolesSelfIdentified.map((r) => clean(r, 100)).filter((r): r is string => !!r).slice(0, 10);
    }
    if ("yearsDoingWork" in body) updates.yearsDoingWork = clean(body.yearsDoingWork, 200);
    if ("region" in body) updates.region = clean(body.region, 300);
    if ("zipCode" in body) updates.zipCode = clean(body.zipCode, 12);
    updates.lastSeenAt = new Date();
    const [updated] = await db.update(integrationInvitations).set(updates).where(eq(integrationInvitations.id, auth.invitation.id)).returning();
    await logRecognition(auth.invitation.id, "corrected-record", "Profile updated by invitee", { actorRole: "invitee" });
    const { accessToken: _t, ...safe } = updated;
    res.json({ invitation: safe });
  });

  // --- PUBLIC (token-authed): update layered consents ---
  app.patch("/api/iti/invitations/:id/consents", async (req, res) => {
    const auth = await authorizeInvitation(req, req.params.id);
    if (!auth) return res.status(404).json({ error: "Not found" });
    const body = req.body as Record<string, unknown>;
    const fields = ["quoteMe", "aggregateMyData", "nameMePublicly", "routeMyInfoToService", "shareWithFunder", "inviteToConvening", "acceptStipend", "routeToCredentialing"] as const;
    const updates: Partial<typeof invitationConsents.$inferInsert> = { updatedAt: new Date() };
    const changedKeys: string[] = [];
    for (const f of fields) {
      if (f in body) {
        const v = !!body[f];
        (updates as Record<string, unknown>)[f] = v;
        changedKeys.push(`${f}=${v}`);
      }
    }
    const [existing] = await db.select().from(invitationConsents).where(eq(invitationConsents.invitationId, auth.invitation.id)).limit(1);
    let row;
    if (existing) {
      [row] = await db.update(invitationConsents).set(updates).where(eq(invitationConsents.invitationId, auth.invitation.id)).returning();
    } else {
      [row] = await db.insert(invitationConsents).values({ invitationId: auth.invitation.id, ...updates }).returning();
    }
    await logRecognition(auth.invitation.id, "corrected-record", `Consent updated: ${changedKeys.join(", ")}`, { actorRole: "invitee" });
    res.json({ consents: row });
  });

  // --- PUBLIC (token-authed): withdraw ---
  app.post("/api/iti/invitations/:id/withdraw", async (req, res) => {
    const auth = await authorizeInvitation(req, req.params.id);
    if (!auth) return res.status(404).json({ error: "Not found" });
    await db.update(integrationInvitations).set({ status: "withdrawn", withdrawnAt: new Date() }).where(eq(integrationInvitations.id, auth.invitation.id));
    // Reset all consents to false on withdrawal
    await db.update(invitationConsents).set({
      quoteMe: false, aggregateMyData: false, nameMePublicly: false, routeMyInfoToService: false,
      shareWithFunder: false, inviteToConvening: false, acceptStipend: false, routeToCredentialing: false,
      updatedAt: new Date(),
    }).where(eq(invitationConsents.invitationId, auth.invitation.id));
    await logRecognition(auth.invitation.id, "corrected-record", "Invitee withdrew. All consents revoked.", { actorRole: "invitee" });
    res.json({ ok: true });
  });

  // --- PUBLIC (token-authed): witness loop — who heard you, what was done with it ---
  app.get("/api/iti/invitations/:id/recognition", async (req, res) => {
    const auth = await authorizeInvitation(req, req.params.id);
    if (!auth) return res.status(404).json({ error: "Not found" });
    const events = await db.select().from(recognitionEvents)
      .where(eq(recognitionEvents.invitationId, auth.invitation.id))
      .orderBy(desc(recognitionEvents.createdAt))
      .limit(200);
    res.json({ events });
  });

  // --- ADMIN: list invitations for a surface (e.g. all shadow workers identified on north-wilco voice project) ---
  app.get("/api/iti/admin/invitations", requireAdmin, async (req, res) => {
    const surface = (req.query.surface as string | undefined)?.trim();
    const surfaceContext = (req.query.surfaceContext as string | undefined)?.trim();
    const conditions = [eq(integrationInvitations.status, "invited")];
    if (surface) conditions.push(eq(integrationInvitations.surface, surface));
    if (surfaceContext) conditions.push(eq(integrationInvitations.surfaceContext, surfaceContext));
    const rows = await db.select().from(integrationInvitations)
      .where(and(...conditions))
      .orderBy(desc(integrationInvitations.createdAt))
      .limit(500);
    const safe = rows.map((r) => { const { accessToken: _t, ...s } = r; return s; });
    res.json({ invitations: safe });
  });

  // --- ADMIN: get full record including consents + recognition history ---
  app.get("/api/iti/admin/invitations/:id", requireAdmin, async (req, res) => {
    const [invitation] = await db.select().from(integrationInvitations).where(eq(integrationInvitations.id, req.params.id as string)).limit(1);
    if (!invitation) return res.status(404).json({ error: "Not found" });
    const [consents] = await db.select().from(invitationConsents).where(eq(invitationConsents.invitationId, invitation.id)).limit(1);
    const events = await db.select().from(recognitionEvents).where(eq(recognitionEvents.invitationId, invitation.id)).orderBy(desc(recognitionEvents.createdAt)).limit(200);
    const { accessToken: _t, ...safe } = invitation;
    res.json({ invitation: safe, consents: consents ?? null, events });
  });

  // --- ADMIN: log a recognition event ("we heard you", "we cited you", "we paid you", "we invited you") ---
  app.post("/api/iti/admin/invitations/:id/recognize", requireAdmin, async (req, res) => {
    const [invitation] = await db.select().from(integrationInvitations).where(eq(integrationInvitations.id, req.params.id as string)).limit(1);
    if (!invitation) return res.status(404).json({ error: "Not found" });
    const body = req.body as Record<string, unknown>;
    const eventType = clean(body.eventType, 32);
    const description = clean(body.description, MAX_TEXT);
    if (!eventType || !description) return res.status(400).json({ error: "eventType and description are required" });
    await logRecognition(invitation.id, eventType, description, {
      actorRole: "admin",
      actorId: getUserId(req),
      surfaceRef: clean(body.surfaceRef, 500) ?? undefined,
      payload: (body.payload as Record<string, unknown>) ?? undefined,
    });
    res.json({ ok: true });
  });
}
