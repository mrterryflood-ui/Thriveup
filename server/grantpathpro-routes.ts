/**
 * Grant Path Pro ↔ ThriveUp Bidirectional Integration
 * ─────────────────────────────────────────────────────
 *
 * INBOUND  (Grant Path Pro → ThriveUp)
 *   POST /api/inbound/grantpathpro
 *   Auth: x-api-key: process.env.THRIVEUP_INGEST_KEY
 *   GPP sends grant execution status, monitoring updates, milestone events.
 *
 * OUTBOUND (ThriveUp → Grant Path Pro)
 *   POST <GPP_API_URL>
 *   Auth: Bearer <GPP_API_KEY>  (set as env vars when GPP provides them)
 *   ThriveUp sends community brief — needs assessment, cascade, domain scores,
 *   matched grants, AI narrative. Triggered from /api/conductor/export-to-grantpathpro.
 *
 * WIRING STATUS
 *   Inbound:  live — validates THRIVEUP_INGEST_KEY, stores events durably
 *             (promote to DB when event volume warrants it)
 *   Outbound: stub returns preview payload until GPP_API_URL + GPP_API_KEY are set
 */

import type { Express, Request, Response, NextFunction } from "express";
import { db, storage } from "./storage";
import { organizations, organizationMembers, grantOpportunities, consortiumProposals, consortiumTeamMembers, gppEvents as gppEventsTable, gppMirrorSnapshots } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateAIResponse, withEthicalPreamble } from "./ai-provider";
import { timingSafeEqual } from "crypto";
import { getGrantPathProDisplayOrigin, getGrantPathProOutboundConfig, getGrantPathProEmbedConfig, getGrantPathProMirrorConfig } from "./grantpathpro-config";
import { recordInboundVerification, rejectionsToCorrectionNote, verifyInboundPayload } from "./inbound-verification";

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  if (!user) return undefined;
  // Replit Auth (OIDC) stores the id at claims.sub — check it first, in
  // lockstep with server/grant-routes.ts.
  return user.claims?.sub || user.id || user.userId || user.sub || undefined;
}

/**
 * Load a consortium proposal and enforce that the caller either created it or
 * is staff/admin. Returns the proposal on success; otherwise sends the error
 * response and returns null so the caller can `return`.
 * SECURITY: proposals hold org identity (UEI/EIN) + grant strategy — never
 * expose or mutate another user's proposal.
 */
async function loadOwnedProposal(
  req: Request,
  res: Response,
  proposalIdRaw: string | string[],
): Promise<typeof consortiumProposals.$inferSelect | null> {
  const proposalId = Array.isArray(proposalIdRaw) ? proposalIdRaw[0] : proposalIdRaw;
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return null;
  }
  const [proposal] = await db.select().from(consortiumProposals).where(eq(consortiumProposals.id, proposalId));
  if (!proposal) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  if (proposal.createdBy !== userId) {
    if (!(await isVerifiedStaff(userId))) {
      res.status(403).json({ error: "You do not have access to this proposal" });
      return null;
    }
  }
  return proposal;
}

async function isVerifiedStaff(userId: string): Promise<boolean> {
  const viewer = await storage.getUser(userId);
  return !!viewer?.role && STAFF_ROLES.has(viewer.role);
}

/**
 * Organization identity, EIN/UEI, and capability profile are organization-
 * private. Never accept a client-supplied organization id as authority: the
 * caller must own it, be an active member, or hold a DB-verified staff role.
 */
async function loadOwnedOrganization(
  req: Request,
  res: Response,
  organizationIdRaw: string | string[],
): Promise<typeof organizations.$inferSelect | null> {
  const organizationId = Array.isArray(organizationIdRaw) ? organizationIdRaw[0] : organizationIdRaw;
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return null;
  }
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
  if (!organization) {
    res.status(404).json({ error: "Organization not found" });
    return null;
  }
  if (await isVerifiedStaff(userId)) return organization;
  if (organization.userId === userId) return organization;
  const [membership] = await db.select().from(organizationMembers).where(and(
    eq(organizationMembers.orgId, organization.id),
    eq(organizationMembers.userId, userId),
  ));
  if (!membership) {
    res.status(403).json({ error: "You do not have access to this organization" });
    return null;
  }
  return organization;
}

// ─── GppEvent shape (mirrors the DB table columns) ───────────────────────────
export interface GppEvent {
  id: string;
  receivedAt: string;
  eventType: string;
  grantId?: string;
  grantTitle?: string;
  geography?: string;
  status?: string;
  milestone?: string;
  amount?: number;
  dueDate?: string;
  notes?: string;
  meta?: Record<string, unknown>;
}

const MAX_GPP_EVENT_BATCH = 100;
const GPP_EVENT_SCHEMA = {
  eventType: { type: "string" as const, maxLength: 100 },
  grantId: { type: "string" as const, maxLength: 200 },
  grantTitle: { type: "string" as const, maxLength: 500 },
  geography: { type: "string" as const, maxLength: 300 },
  status: { type: "string" as const, maxLength: 100 },
  milestone: { type: "string" as const, maxLength: 300 },
  amount: { type: "number" as const, min: 0, max: 1_000_000_000 },
  dueDate: { type: "string" as const, maxLength: 50 },
  notes: { type: "string" as const, maxLength: 10_000 },
};

function isBoundedMeta(value: unknown, depth = 0): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 4) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  const entries = Object.entries(value);
  if (entries.length > 50) return false;
  return entries.every(([key, item]) => {
    if (key.length > 100 || item === null || ["string", "number", "boolean"].includes(typeof item)) {
      return key.length <= 100 && (typeof item !== "string" || item.length <= 2_000);
    }
    if (Array.isArray(item)) return item.length <= 25 && item.every(v => ["string", "number", "boolean"].includes(typeof v) && (typeof v !== "string" || v.length <= 500));
    return isBoundedMeta(item, depth + 1);
  });
}

function validDueDate(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Strip whitespace and non-ASCII trailing chars (e.g. accidental em-dash from copy-paste) */
function normalizeKey(s: string): string {
  return s.replace(/[\s\u0080-\uffff]+$/, "").replace(/^[\s\u0080-\uffff]+/, "");
}

function secretsMatch(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

function requireGppInboundKey(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-api-key"];
  const rawExpected = process.env.THRIVEUP_INGEST_KEY?.trim() || process.env.THRIVEUP_INBOUND_KEY?.trim();

  if (!rawExpected) {
    return res.status(503).json({ error: "THRIVEUP_INGEST_KEY not configured on this server" });
  }
  const expected = normalizeKey(rawExpected);
  const provided = typeof raw === "string" ? normalizeKey(raw) : null;

  if (!provided || !secretsMatch(expected, provided)) {
    return res.status(401).json({ error: "Invalid or missing x-api-key" });
  }
  next();
}

// Canonical staff-role set — keep in lockstep with server/grant-routes.ts,
// server/reentry-routes.ts, server/yhsi-routes.ts, and the client RequireAuth
// staffOnly gate. Role is resolved from the DB (req.user.role is never set).
const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

/**
 * Allow either (a) a signed-in staff session (role verified from the DB), or
 * (b) the GPP inbound x-api-key — the same key /status accepts.
 */
async function requireStaffOrInboundKey(req: Request, res: Response, next: NextFunction) {
  // (b) inbound key path
  const raw = req.headers["x-api-key"];
  const rawExpected = process.env.THRIVEUP_INGEST_KEY?.trim() || process.env.THRIVEUP_INBOUND_KEY?.trim();
  if (typeof raw === "string" && rawExpected && secretsMatch(normalizeKey(rawExpected), normalizeKey(raw))) {
    return next();
  }
  // (a) staff session path
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role && STAFF_ROLES.has(user.role)) return next();
  } catch (e) {
    console.error("[GrantPathPro] Staff check error:", e);
  }
  return res.status(403).json({ error: "Staff access required" });
}

export function registerGrantPathProRoutes(app: Express) {

  /**
   * GET /api/consortium/gpp-status
   * Returns whether GPP_API_URL is configured — used by the UI to show sync status.
   * No auth required (config presence is not sensitive).
   */
  app.get("/api/consortium/gpp-status", (_req: Request, res: Response) => {
    const config = getGrantPathProOutboundConfig();
    return res.json({ configured: config.configured, url: getGrantPathProDisplayOrigin(config.url) });
  });

  /**
   * GET /api/consortium/gpp-embed
   * ThriveUp-side bridge to GrantPathPro's /thriveup/embed endpoint.
   * The partner credential stays on the server. The returned URL is intended
   * for an authenticated nonprofit user whose entity was selected explicitly.
   */
  app.get("/api/consortium/gpp-embed", async (req: Request, res: Response) => {
    try {
      if (!getUserId(req)) return res.status(401).json({ error: "Sign in required" });
      const orgId = typeof req.query.orgId === "string" ? req.query.orgId.trim() : "";
      const mode = req.query.mode === "iframe" ? "iframe" : "redirect";
      if (!orgId || orgId.length > 200) {
        return res.status(400).json({ error: "A valid GrantPathPro orgId is required" });
      }

      const config = getGrantPathProEmbedConfig();
      if (!config.configured || !config.url || !config.partnerKey) {
        return res.status(503).json({ error: "GrantPathPro embed is not configured" });
      }

      const upstream = new URL(config.url);
      upstream.searchParams.set("orgId", orgId);
      upstream.searchParams.set("mode", mode);
      const response = await fetch(upstream, {
        method: "GET",
        headers: { Accept: "application/json", "x-partner-key": config.partnerKey },
        signal: AbortSignal.timeout(15_000),
      });
      const text = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
      if (!response.ok) {
        console.error(`[GrantPathPro] Embed upstream returned HTTP ${response.status}`);
        return res.status(502).json({ error: "GrantPathPro embed endpoint is unavailable" });
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return res.status(502).json({ error: "GrantPathPro returned an invalid embed response" });
      }
      const upstreamRecord = payload as Record<string, unknown>;
      const embedUrl = typeof upstreamRecord.url === "string"
        ? upstreamRecord.url
        : typeof upstreamRecord.embedUrl === "string"
          ? upstreamRecord.embedUrl
          : typeof upstreamRecord.deepLinkUrl === "string"
            ? upstreamRecord.deepLinkUrl
          : null;
      if (!embedUrl || !/^https?:\/\//i.test(embedUrl)) {
        return res.status(502).json({ error: "GrantPathPro returned no valid embed URL" });
      }
      return res.json({ provider: "GrantPathPro", orgId, mode, url: embedUrl });
    } catch (err) {
      console.error("[GrantPathPro] Embed bridge failed:", err);
      return res.status(502).json({ error: "GrantPathPro embed request failed" });
    }
  });

  // GPP Mirror push: exact partner contract, authenticated separately from
  // outbound embed calls. The payload is stored verbatim for audit/provenance.
  app.post("/api/inbound/grantpathpro/mirror", requireGppInboundKey, async (req: Request, res: Response) => {
    const orgId = typeof req.body?.orgId === "string" ? req.body.orgId.trim() : "";
    const snapshot = req.body?.snapshot;
    if (!orgId || orgId.length > 200 || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return res.status(400).json({ error: "orgId and an object snapshot are required" });
    }
    try {
      const [row] = await db.insert(gppMirrorSnapshots).values({
        orgId,
        snapshot: snapshot as Record<string, unknown>,
        source: "grantpathpro",
      }).returning({ id: gppMirrorSnapshots.id, receivedAt: gppMirrorSnapshots.receivedAt });
      return res.status(201).json({ ok: true, snapshotId: row.id, receivedAt: row.receivedAt });
    } catch (err) {
      console.error("[GrantPathPro] Mirror snapshot persistence failed:", err);
      return res.status(500).json({ error: "Mirror snapshot could not be stored" });
    }
  });

  // Push a verified organization's current Mirror snapshot to GPP's receiver.
  app.post("/api/organizations/:orgId/grantpathpro-mirror/push", async (req: Request, res: Response) => {
    const organization = await loadOwnedOrganization(req, res, req.params.orgId);
    if (!organization) return;
    const snapshot = req.body?.snapshot;
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return res.status(400).json({ error: "An object snapshot is required" });
    }
    const config = getGrantPathProMirrorConfig();
    if (!config.configured || !config.url || !config.ingestKey) {
      return res.status(503).json({ error: "GrantPathPro Mirror receiver is not configured" });
    }
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "x-api-key": config.ingestKey },
        body: JSON.stringify({ orgId: organization.id, snapshot }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        console.error(`[GrantPathPro] Mirror receiver returned HTTP ${response.status}`);
        return res.status(502).json({ error: "GrantPathPro Mirror receiver rejected the snapshot" });
      }
      const [row] = await db.insert(gppMirrorSnapshots).values({
        orgId: organization.id, snapshot: snapshot as Record<string, unknown>, source: "thriveup",
      }).returning({ id: gppMirrorSnapshots.id, receivedAt: gppMirrorSnapshots.receivedAt });
      return res.status(201).json({ ok: true, snapshotId: row.id, receivedAt: row.receivedAt });
    } catch (err) {
      console.error("[GrantPathPro] Mirror push failed:", err);
      return res.status(502).json({ error: "GrantPathPro Mirror push failed" });
    }
  });

  // Latest snapshot for an organization profile. Access is tenant-scoped.
  app.get("/api/organizations/:orgId/grantpathpro-mirror", async (req: Request, res: Response) => {
    const organization = await loadOwnedOrganization(req, res, req.params.orgId);
    if (!organization) return;
    try {
      const [latest] = await db.select().from(gppMirrorSnapshots)
        .where(eq(gppMirrorSnapshots.orgId, organization.id))
        .orderBy(desc(gppMirrorSnapshots.receivedAt))
        .limit(1);
      return res.json({
        organizationId: organization.id,
        organizationName: organization.name,
        snapshot: latest?.snapshot ?? null,
        receivedAt: latest?.receivedAt ?? null,
        active: latest ? Date.now() - latest.receivedAt.getTime() < 7 * 24 * 60 * 60 * 1000 : false,
        status: latest ? "received" : "not_received",
      });
    } catch (err) {
      console.error("[GrantPathPro] Mirror snapshot read failed:", err);
      return res.status(500).json({ error: "Mirror snapshot could not be loaded" });
    }
  });

  /**
   * INBOUND — Grant Path Pro → ThriveUp
   * GPP POSTs grant execution events here.
   * Auth: x-api-key: THRIVEUP_INGEST_KEY
   */
  app.post("/api/inbound/grantpathpro", requireGppInboundKey, async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ error: "Inbound body must be an event object or an events batch" });
      }
      if ("events" in body && !Array.isArray(body.events)) {
        return res.status(400).json({ error: "events must be an array" });
      }
      const rawEvents = Array.isArray(body.events) ? body.events : [body];
      if (rawEvents.length === 0 || rawEvents.length > MAX_GPP_EVENT_BATCH) {
        return res.status(400).json({ error: `events must contain 1 to ${MAX_GPP_EVENT_BATCH} events` });
      }

      const corrections: Array<{ event: number; corrections: ReturnType<typeof rejectionsToCorrectionNote> }> = [];
      const rowsToInsert = [];
      for (const [index, raw] of rawEvents.entries()) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          corrections.push({ event: index, corrections: [{ field: "event", problem: "wrong type", expected: "an object" }] });
          continue;
        }
        const { clean, rejections } = verifyInboundPayload<Partial<GppEvent>>(raw as Record<string, unknown>, GPP_EVENT_SCHEMA);
        if ("dueDate" in clean && !validDueDate(clean.dueDate)) {
          rejections.push({ field: "dueDate", reason: "wrong_type", receivedValue: clean.dueDate, expected: "a parseable date string", blocking: false });
          delete clean.dueDate;
        }
        const rawMeta = (raw as Record<string, unknown>).meta;
        if (rawMeta !== undefined && !isBoundedMeta(rawMeta)) {
          rejections.push({ field: "meta", reason: "out_of_range", receivedValue: rawMeta, expected: "a plain object (max depth 5, 50 keys, bounded values)", blocking: false });
        }
        if (rejections.length) corrections.push({ event: index, corrections: rejectionsToCorrectionNote(rejections) });
        await recordInboundVerification("grantpathpro", "/api/inbound/grantpathpro", rejections);
        rowsToInsert.push({
          eventType: clean.eventType || "status_update",
          grantId: clean.grantId ?? null, grantTitle: clean.grantTitle ?? null,
          geography: clean.geography ?? null, status: clean.status ?? null,
          milestone: clean.milestone ?? null, amount: clean.amount ?? null,
          dueDate: clean.dueDate ?? null, notes: clean.notes ?? null,
          meta: rawMeta !== undefined && isBoundedMeta(rawMeta) ? rawMeta : null,
        });
      }
      if (corrections.some(({ corrections: eventCorrections }) => eventCorrections.some(c => c.field === "event"))) {
        return res.status(400).json({ error: "Each event must be an object", corrections });
      }

      if (Array.isArray(body.events)) {
        const rows = await db.insert(gppEventsTable).values(rowsToInsert).returning({ id: gppEventsTable.id });
        console.log(`[GrantPathPro] Received batch: ${rows.length} event(s)`);
        return res.json({ received: true, count: rows.length, ids: rows.map(r => r.id), ...(corrections.length ? { corrections } : {}) });
      }

      const [row] = await db.insert(gppEventsTable).values(rowsToInsert[0]).returning({ id: gppEventsTable.id });
      console.log(`[GrantPathPro] Received event: ${rowsToInsert[0].eventType} — ${rowsToInsert[0].grantTitle || rowsToInsert[0].grantId || "no title"}`);
      return res.json({ received: true, id: row.id, ...(corrections.length ? { corrections } : {}) });

    } catch (err) {
      console.error("[GrantPathPro] Inbound error:", err);
      return res.status(500).json({ error: "Failed to process inbound event" });
    }
  });

  /**
   * GET /api/inbound/grantpathpro/events
   * Returns recent GPP events (grant hub, ops center).
   * Auth: signed-in staff session (role resolved from the DB) OR the same
   * x-api-key GPP uses for /status. Grant pipeline activity (titles, statuses,
   * milestones, compliance data) must never be anonymously readable.
   */
  app.get("/api/inbound/grantpathpro/events", requireStaffOrInboundKey, async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
      const grantId = req.query.grantId as string | undefined;

      const query = db
        .select()
        .from(gppEventsTable)
        .orderBy(desc(gppEventsTable.receivedAt))
        .limit(500);

      const allRows = await (grantId
        ? db.select().from(gppEventsTable).where(eq(gppEventsTable.grantId, grantId)).orderBy(desc(gppEventsTable.receivedAt)).limit(500)
        : query);

      const events = allRows.slice(0, limit).map(r => ({
        id: r.id,
        receivedAt: r.receivedAt?.toISOString() ?? new Date().toISOString(),
        eventType: r.eventType,
        grantId: r.grantId ?? undefined,
        grantTitle: r.grantTitle ?? undefined,
        geography: r.geography ?? undefined,
        status: r.status ?? undefined,
        milestone: r.milestone ?? undefined,
        amount: r.amount ?? undefined,
        dueDate: r.dueDate ?? undefined,
        notes: r.notes ?? undefined,
        meta: r.meta as Record<string, unknown> | undefined,
      }));

      return res.json({ events, total: allRows.length });
    } catch (err) {
      console.error("[GrantPathPro] Events fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  /**
   * GET /api/inbound/grantpathpro/status
   * Health check — lets GPP verify the connection is live.
   * Returns the inbound endpoint info without exposing the key.
   */
  app.get("/api/inbound/grantpathpro/status", requireGppInboundKey, async (_req: Request, res: Response) => {
    try {
      const [latest] = await db
        .select({ id: gppEventsTable.id, receivedAt: gppEventsTable.receivedAt })
        .from(gppEventsTable)
        .orderBy(desc(gppEventsTable.receivedAt))
        .limit(1);
      // Count is approximate (last 500 rows) — full COUNT(*) is expensive; use latest row as proxy
      const countRows = await db
        .select({ id: gppEventsTable.id })
        .from(gppEventsTable)
        .limit(500);
      return res.json({
        connected: true,
        platform: "ThriveUp Academy",
        inboundEndpoint: "/api/inbound/grantpathpro",
        eventsReceived: countRows.length,
        lastEventAt: latest?.receivedAt?.toISOString() ?? null,
        capabilities: [
          "grant_status_updates",
          "milestone_events",
          "compliance_alerts",
          "budget_tracking",
          "outcome_reporting",
        ],
      });
    } catch (err) {
      console.error("[GrantPathPro] Status error:", err);
      return res.status(500).json({ error: "Status check failed" });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // CONSORTIUM PROPOSAL CRUD
  // ══════════════════════════════════════════════════════════════

  app.post("/api/consortium/proposals", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const { grantTitle, grantNofo, grantDeadline, grantId, awardAmount, projectTitle, geography,
      primeOrgName, primeUei, primeEin, primeOrgId, indirectCostApproach } = req.body;
    if (!grantTitle || !projectTitle || !primeOrgName) {
      return res.status(400).json({ error: "grantTitle, projectTitle, and primeOrgName are required" });
    }
    const [row] = await db.insert(consortiumProposals).values({
      createdBy: userId, grantTitle, grantNofo, grantId: grantId || null,
      grantDeadline: grantDeadline ? new Date(grantDeadline) : null,
      awardAmount, projectTitle, geography, primeOrgName,
      primeUei, primeEin, primeOrgId, indirectCostApproach: indirectCostApproach || "de_minimis_10",
    }).returning();
    return res.status(201).json(row);
  });

  app.get("/api/consortium/proposals", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const rows = await db.select().from(consortiumProposals)
      .where(eq(consortiumProposals.createdBy, userId))
      .orderBy(desc(consortiumProposals.updatedAt));
    return res.json(rows);
  });

  app.get("/api/consortium/proposals/:id", async (req: Request, res: Response) => {
    const proposal = await loadOwnedProposal(req, res, req.params.id);
    if (!proposal) return;
    const members = await db.select().from(consortiumTeamMembers).where(eq(consortiumTeamMembers.consortiumId, proposal.id));
    return res.json({ ...proposal, members });
  });

  app.post("/api/consortium/proposals/:id/members", async (req: Request, res: Response) => {
    const reqId = req.params.id as string;
    const owned = await loadOwnedProposal(req, res, reqId);
    if (!owned) return;
    const { orgName, contactName, contactEmail, role, assignedSections, notes } = req.body;
    if (!orgName || !role) return res.status(400).json({ error: "orgName and role required" });
    const [row] = await db.insert(consortiumTeamMembers).values({
      consortiumId: reqId, orgName, contactName, contactEmail,
      role, assignedSections: assignedSections || [], notes,
    }).returning();
    return res.status(201).json(row);
  });

  app.delete("/api/consortium/proposals/:id/members/:memberId", async (req: Request, res: Response) => {
    const reqId = req.params.id as string;
    const owned = await loadOwnedProposal(req, res, reqId);
    if (!owned) return;
    // Only delete the member if it belongs to this (owned) proposal.
    await db.delete(consortiumTeamMembers).where(and(
      eq(consortiumTeamMembers.id, req.params.memberId as string),
      eq(consortiumTeamMembers.consortiumId, owned.id),
    ));
    return res.json({ ok: true });
  });

  /** Generate a section for a specific team member's assignment */
  app.post("/api/consortium/proposals/:id/generate-section", async (req: Request, res: Response) => {
    const proposal = await loadOwnedProposal(req, res, req.params.id);
    if (!proposal) return;
    const { memberId, section, additionalContext } = req.body;
    if (!memberId || !section) return res.status(400).json({ error: "memberId and section required" });

    const [member] = await db.select().from(consortiumTeamMembers).where(and(
      eq(consortiumTeamMembers.id, memberId),
      eq(consortiumTeamMembers.consortiumId, proposal.id),
    ));
    if (!member) return res.status(404).json({ error: "Member not found" });

    const prompt = `You are a federal grant writer. Generate the "${section}" narrative section for a HUD Youth Homelessness System Improvement (YHSI) grant proposal.

GRANT: ${proposal.grantTitle} ${proposal.grantNofo ? `(${proposal.grantNofo})` : ""}
PROJECT: ${proposal.projectTitle}
GEOGRAPHY: ${proposal.geography || "not specified"}
AWARD: ${proposal.awardAmount || "~$1,000,000"}, 30 months, no match required
PRIME APPLICANT: ${proposal.primeOrgName}${proposal.primeUei ? ` (UEI: ${proposal.primeUei})` : ""}

CONTRIBUTING ORG: ${member.orgName}
ROLE: ${member.role}
CONTACT: ${member.contactName || ""}

SECTION TO WRITE: ${section}
${additionalContext ? `\nADDITIONAL CONTEXT: ${additionalContext}` : ""}

Write 500-700 words in formal HUD grant language. Plain paragraphs, no markdown headers. Emphasize youth voice, cross-system coordination, data-driven continuous improvement, and measurable system-level outcomes. YHSI cannot fund direct services or housing — keep all content system-level.`;

    try {
      const content = await generateAIResponse([
        { role: "system", content: withEthicalPreamble("You are a professional federal grant writer specializing in HUD youth homelessness programs. Write in formal, precise grant language.") },
        { role: "user", content: prompt },
      ], 1400);

      // Persist into member's sectionContent JSONB
      const existing = (member.sectionContent as Record<string, string>) || {};
      existing[section] = content;
      await db.update(consortiumTeamMembers)
        .set({ sectionContent: existing })
        .where(eq(consortiumTeamMembers.id, memberId));

      return res.json({ section, content, memberId, memberOrg: member.orgName });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Generation failed" });
    }
  });

  /** Merge all member sections into a unified narrative on the proposal */
  app.post("/api/consortium/proposals/:id/merge", async (req: Request, res: Response) => {
    const proposal = await loadOwnedProposal(req, res, req.params.id);
    if (!proposal) return;
    const members = await db.select().from(consortiumTeamMembers).where(eq(consortiumTeamMembers.consortiumId, proposal.id));

    const parts: string[] = [`# ${proposal.projectTitle}\n${proposal.grantTitle}${proposal.grantNofo ? ` — ${proposal.grantNofo}` : ""}\nPrime Applicant: ${proposal.primeOrgName}\nGeography: ${proposal.geography || "Not specified"}\n`];
    for (const m of members) {
      const content = m.sectionContent as Record<string, string>;
      for (const [section, text] of Object.entries(content)) {
        if (text) parts.push(`\n## ${section}\n[${m.orgName} — ${m.role}]\n\n${text}`);
      }
    }
    const merged = parts.join("\n");
    await db.update(consortiumProposals).set({ mergedNarrative: merged, updatedAt: new Date() }).where(eq(consortiumProposals.id, proposal.id));
    return res.json({ merged });
  });

  // ══════════════════════════════════════════════════════════════
  // FOUR PUSH ROUTES — ThriveUp → GrantPathPro
  // Each packages data from ThriveUp's DB and POSTs to GPP.
  // If GPP_API_URL is not set, returns a preview of what would be sent.
  // ══════════════════════════════════════════════════════════════

  async function pushToGpp(payload: Record<string, unknown>, endpoint: string): Promise<{ sent: boolean; preview?: unknown; response?: unknown; error?: string; authMismatch?: boolean }> {
    const { url: gppUrl, apiKey: gppKey, configured } = getGrantPathProOutboundConfig();
    if (!configured || !gppUrl || !gppKey) return { sent: false, preview: payload, error: "GrantPathPro delivery is not configured" };
    try {
      const r = await fetch(`${gppUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${gppKey || ""}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });

      // Detect Clerk JWT auth wall — the new GPP server (pursuitsfundingprofessionals.com)
      // uses Clerk for all /api/* routes. A plain API key string is not a valid Clerk JWT
      // (which must have three dot-separated parts). When this is detected we log a specific,
      // actionable message rather than a generic "push failed" so operators know exactly what
      // configuration change is needed on GPP's side.
      if (r.status === 401) {
        const clerkStatus = r.headers.get("x-clerk-auth-status");
        const clerkMsg    = r.headers.get("x-clerk-auth-message");
        if (clerkStatus) {
          console.warn(
            `[GrantPathPro] Push to ${gppUrl}${endpoint} blocked by Clerk auth wall ` +
            `(x-clerk-auth-status=${clerkStatus}). ` +
            `GPP must expose a service-to-service inbound endpoint (e.g. /api/inbound/*) ` +
            `that accepts a plain Bearer API key, or provide a Clerk machine token. ` +
            `Clerk message: ${clerkMsg ?? "none"}`
          );
          const body = await r.json().catch(() => ({ status: 401 }));
          return { sent: false, authMismatch: true, response: { ...body, clerkAuthStatus: clerkStatus }, error: "GPP endpoint requires Clerk JWT — plain API key not accepted" };
        }
      }

      if (!r.ok) {
        const body = await r.json().catch(() => ({ status: r.status, statusText: r.statusText }));
        console.warn(`[GrantPathPro] Push to ${gppUrl}${endpoint} returned HTTP ${r.status}:`, body);
        return { sent: false, response: body, error: `HTTP ${r.status}` };
      }

      const response = await r.json().catch(() => ({ status: r.status }));
      return { sent: true, response };
    } catch (e: any) {
      return { sent: false, error: e.message || "Unable to reach GrantPathPro" };
    }
  }

  /** POST /api/thriveup/push-entity — push org profile to GPP */
  app.post("/api/thriveup/push-entity", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const { entityId, consortiumId } = req.body;
    if (!entityId && !consortiumId) return res.status(400).json({ error: "entityId or consortiumId required" });

    let orgData: Record<string, unknown> = {};
    if (entityId) {
      const org = await loadOwnedOrganization(req, res, entityId);
      if (!org) return;
      orgData = { name: org.name, ein: org.ein, uei: org.uei, cageCode: org.cageCode, state: org.state, is501c3: org.is501c3, focusAreas: org.focusAreas, populationsServed: org.populationsServed, naicsCodes: org.naicsCodes, samStatus: org.samStatus, missionText: org.missionText };
    }
    if (consortiumId) {
      const cp = await loadOwnedProposal(req, res, consortiumId);
      if (!cp) return;
      orgData = { ...orgData, consortiumPrimeOrg: cp.primeOrgName, consortiumPrimeUei: cp.primeUei, consortiumPrimeEin: cp.primeEin };
    }

    const payload = { source: "thriveup", type: "entity_profile", entity: orgData, pushedAt: new Date().toISOString() };
    const result = await pushToGpp(payload, "/api/inbound/entity");
    return res.json(result);
  });

  /** POST /api/thriveup/push-pursuit — push NOFO context + opportunity packet to GPP */
  app.post("/api/thriveup/push-pursuit", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const { grantId, consortiumId } = req.body;
    if (!grantId && !consortiumId) return res.status(400).json({ error: "grantId or consortiumId required" });
    // Grant opportunities are a shared catalog with no per-grant owner. A
    // grant-only export therefore has no ownership proof and is staff-only;
    // organization-linked pursuit exports are authorized by their consortium.
    if (grantId && !consortiumId && !(await isVerifiedStaff(userId))) {
      return res.status(403).json({ error: "Staff access required for a grant-only export" });
    }

    let grantData: Record<string, unknown> = {};
    let entityContext: Record<string, unknown> = {};

    if (grantId) {
      const [g] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, grantId));
      if (g) grantData = { title: g.title, agency: g.agency, nofo: g.samgovId, deadline: g.deadline, description: g.description, eligibility: g.eligibilityCriteria, fundingAmount: g.fundingAmount, awardCeiling: g.awardCeiling, cfda: g.cfda, sourceUrl: g.sourceUrl, focusAreas: g.focusAreas, fitScore: g.fitScore, fitAnalysis: g.fitAnalysis, aiAnalysis: g.aiAnalysis };
    }
    if (consortiumId) {
      const cp = await loadOwnedProposal(req, res, consortiumId);
      if (!cp) return;
      entityContext = { primeOrg: cp.primeOrgName, primeUei: cp.primeUei, projectTitle: cp.projectTitle, geography: cp.geography, awardAmount: cp.awardAmount };
      if (!grantData.title) grantData = { title: cp.grantTitle, nofo: cp.grantNofo, deadline: cp.grantDeadline, fundingAmount: cp.awardAmount };
    }

    const payload = { source: "thriveup", type: "pursuit_packet", grant: grantData, entityContext, pushedAt: new Date().toISOString() };
    const result = await pushToGpp(payload, "/api/inbound/pursuit");
    return res.json(result);
  });

  /** POST /api/thriveup/push-collaborative — push consortium structure to GPP */
  app.post("/api/thriveup/push-collaborative", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const { consortiumId } = req.body;
    if (!consortiumId) return res.status(400).json({ error: "consortiumId required" });

    const proposal = await loadOwnedProposal(req, res, consortiumId);
    if (!proposal) return;
    const members = await db.select().from(consortiumTeamMembers).where(eq(consortiumTeamMembers.consortiumId, consortiumId));

    const payload = {
      source: "thriveup", type: "collaborative_structure",
      grant: { title: proposal.grantTitle, nofo: proposal.grantNofo, deadline: proposal.grantDeadline, fundingAmount: proposal.awardAmount },
      projectTitle: proposal.projectTitle, geography: proposal.geography,
      prime: { orgName: proposal.primeOrgName, uei: proposal.primeUei, ein: proposal.primeEin, indirectCostApproach: proposal.indirectCostApproach },
      team: members.map(m => ({ orgName: m.orgName, contactName: m.contactName, contactEmail: m.contactEmail, role: m.role, assignedSections: m.assignedSections })),
      pushedAt: new Date().toISOString(),
    };
    const result = await pushToGpp(payload, "/api/inbound/collaborative");
    return res.json(result);
  });

  /** POST /api/thriveup/push-proposal — push all generated sections to GPP */
  app.post("/api/thriveup/push-proposal", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const { consortiumId } = req.body;
    if (!consortiumId) return res.status(400).json({ error: "consortiumId required" });

    const proposal = await loadOwnedProposal(req, res, consortiumId);
    if (!proposal) return;
    const members = await db.select().from(consortiumTeamMembers).where(eq(consortiumTeamMembers.consortiumId, consortiumId));

    const sections: Array<{ section: string; content: string; author: string; role: string; wordCount: number }> = [];
    for (const m of members) {
      const content = m.sectionContent as Record<string, string>;
      for (const [section, text] of Object.entries(content)) {
        if (text) sections.push({ section, content: text, author: m.orgName, role: m.role, wordCount: text.split(/\s+/).length });
      }
    }

    const payload = {
      source: "thriveup", type: "proposal_draft",
      grant: { title: proposal.grantTitle, nofo: proposal.grantNofo },
      projectTitle: proposal.projectTitle, prime: proposal.primeOrgName,
      sections, mergedNarrative: proposal.mergedNarrative,
      totalWords: sections.reduce((s, x) => s + x.wordCount, 0),
      pushedAt: new Date().toISOString(),
    };

    const result = await pushToGpp(payload, "/api/inbound/proposal");
    // Delivery, not an attempted request, is the only honest basis for a
    // pushed timestamp. This also prevents an upstream 405/outage from being
    // displayed as a successful partner handoff.
    if (result.sent) {
      await db.update(consortiumProposals).set({ gppPushedAt: new Date() }).where(eq(consortiumProposals.id, consortiumId));
    }
    return res.json(result);
  });

  /**
   * GET /api/inbound/grantpathpro/connection-info
   * Returns what GPP needs to know to connect to ThriveUp.
   * Used to configure the integration on the GPP side.
   */
  app.get("/api/inbound/grantpathpro/connection-info", (_req: Request, res: Response) => {
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://thriveupacademy.com";

    return res.json({
      platform: "ThriveUp Academy",
      inboundEndpoint: `${host}/api/inbound/grantpathpro`,
      statusEndpoint: `${host}/api/inbound/grantpathpro/status`,
      authHeader: "x-api-key",
      authKeyName: "THRIVEUP_INGEST_KEY",
      note: "Contact ThriveUp for the actual key value — never transmitted in plain text",
      outboundCallback: {
        description: "ThriveUp will POST community briefs to Grant Path Pro",
        requiredEnvVars: ["GPP_API_URL", "THRIVE_GPP_API_KEY"],
        payloadFields: [
          "geography (zip, city, county, state)",
          "needsAssessment (domainScores, atRiskPopulations, povertyRate)",
          "financialImpact (historicalCost, forwardProjection, roi, cascadeChains)",
          "grantAlignment (matchedOpportunities, evidencePrograms)",
          "narrative (aiNarrative)",
          "censusSources",
        ],
      },
      eventTypes: [
        "status_update — grant moved to a new stage",
        "milestone_reached — submission sent, award received, etc.",
        "compliance_alert — deadline or requirement flagged",
        "budget_event — spend recorded or variance detected",
        "outcome_report — post-award reporting submitted",
      ],
    });
  });
}
