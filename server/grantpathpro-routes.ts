/**
 * Grant Path Pro ↔ ThriveUp Bidirectional Integration
 * ─────────────────────────────────────────────────────
 *
 * INBOUND  (Grant Path Pro → ThriveUp)
 *   POST /api/inbound/grantpathpro
 *   Auth: x-api-key: process.env.THRIVEUP_INBOUND_KEY
 *   GPP sends grant execution status, monitoring updates, milestone events.
 *
 * OUTBOUND (ThriveUp → Grant Path Pro)
 *   POST <GPP_API_URL>
 *   Auth: Bearer <GPP_API_KEY>  (set as env vars when GPP provides them)
 *   ThriveUp sends community brief — needs assessment, cascade, domain scores,
 *   matched grants, AI narrative. Triggered from /api/conductor/export-to-grantpathpro.
 *
 * WIRING STATUS
 *   Inbound:  live — validates THRIVEUP_INBOUND_KEY, stores events in memory
 *             (promote to DB when event volume warrants it)
 *   Outbound: stub returns preview payload until GPP_API_URL + GPP_API_KEY are set
 */

import type { Express, Request, Response, NextFunction } from "express";
import { db, storage } from "./storage";
import { organizations, grantOpportunities, consortiumProposals, consortiumTeamMembers, gppEvents as gppEventsTable } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateAIResponse, withEthicalPreamble } from "./ai-provider";

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
    const viewer = await storage.getUser(userId);
    const isStaff = viewer?.role === "admin" || viewer?.role === "teacher" || viewer?.role === "facilitator";
    if (!isStaff) {
      res.status(403).json({ error: "You do not have access to this proposal" });
      return null;
    }
  }
  return proposal;
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

/** Strip whitespace and non-ASCII trailing chars (e.g. accidental em-dash from copy-paste) */
function normalizeKey(s: string): string {
  return s.replace(/[\s\u0080-\uffff]+$/, "").replace(/^[\s\u0080-\uffff]+/, "");
}

function requireGppInboundKey(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-api-key"];
  const rawExpected = process.env.THRIVEUP_INBOUND_KEY;

  if (!rawExpected) {
    return res.status(503).json({ error: "THRIVEUP_INBOUND_KEY not configured on this server" });
  }
  const expected = normalizeKey(rawExpected);
  const provided = typeof raw === "string" ? normalizeKey(raw) : null;

  if (!provided || provided !== expected) {
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
  const rawExpected = process.env.THRIVEUP_INBOUND_KEY;
  if (typeof raw === "string" && rawExpected && normalizeKey(raw) === normalizeKey(rawExpected)) {
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
    const configured = !!(process.env.GPP_API_URL && process.env.GPP_API_URL.trim());
    return res.json({ configured, url: configured ? process.env.GPP_API_URL!.replace(/\/.*/, "") : null });
  });

  /**
   * INBOUND — Grant Path Pro → ThriveUp
   * GPP POSTs grant execution events here.
   * Auth: x-api-key: THRIVEUP_INBOUND_KEY
   */
  app.post("/api/inbound/grantpathpro", requireGppInboundKey, async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<GppEvent> & { events?: Partial<GppEvent>[] };

      const toInsert = (raw: Partial<GppEvent>) => ({
        eventType: raw.eventType || "status_update",
        grantId: raw.grantId ?? null,
        grantTitle: raw.grantTitle ?? null,
        geography: raw.geography ?? null,
        status: raw.status ?? null,
        milestone: raw.milestone ?? null,
        amount: raw.amount ?? null,
        dueDate: raw.dueDate ?? null,
        notes: raw.notes ?? null,
        meta: raw.meta ?? null,
      });

      if (Array.isArray(body.events)) {
        const rows = await db.insert(gppEventsTable).values(body.events.map(toInsert)).returning({ id: gppEventsTable.id });
        console.log(`[GrantPathPro] Received batch: ${rows.length} event(s)`);
        return res.json({ received: true, count: rows.length, ids: rows.map(r => r.id) });
      }

      const [row] = await db.insert(gppEventsTable).values(toInsert(body)).returning({ id: gppEventsTable.id });
      console.log(`[GrantPathPro] Received event: ${body.eventType || "status_update"} — ${body.grantTitle || body.grantId || "no title"}`);
      return res.json({ received: true, id: row.id });

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
    // Auto-push entity profile to GPP in background
    pushToGpp({ source: "thriveup", type: "entity_profile", entity: { name: primeOrgName, uei: primeUei, ein: primeEin }, consortiumId: row.id, pushedAt: new Date().toISOString() }, "/api/inbound/entity").catch(() => {});
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
    // Auto-push updated collaborative structure to GPP in background
    db.select().from(consortiumProposals).where(eq(consortiumProposals.id, reqId)).then(([cp]) => {
      if (!cp) return;
      db.select().from(consortiumTeamMembers).where(eq(consortiumTeamMembers.consortiumId, cp.id)).then(members => {
        pushToGpp({ source: "thriveup", type: "collaborative_structure", grant: { title: cp.grantTitle, nofo: cp.grantNofo }, projectTitle: cp.projectTitle, prime: { orgName: cp.primeOrgName, uei: cp.primeUei }, team: members.map(m => ({ orgName: m.orgName, role: m.role, assignedSections: m.assignedSections })), pushedAt: new Date().toISOString() }, "/api/inbound/collaborative").catch(() => {});
      }).catch(() => {});
    }).catch(() => {});
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

      // Auto-push updated proposal draft to GPP in background
      db.select().from(consortiumTeamMembers).where(eq(consortiumTeamMembers.consortiumId, proposal.id)).then(allMembers => {
        const sections = allMembers.flatMap(m => Object.entries((m.sectionContent as Record<string,string>) || {}).filter(([,t]) => t).map(([sec, text]) => ({ section: sec, content: text, author: m.orgName, role: m.role, wordCount: text.split(/\s+/).length })));
        pushToGpp({ source: "thriveup", type: "proposal_draft", grant: { title: proposal.grantTitle, nofo: proposal.grantNofo }, projectTitle: proposal.projectTitle, prime: proposal.primeOrgName, sections, totalWords: sections.reduce((s,x) => s + x.wordCount, 0), pushedAt: new Date().toISOString() }, "/api/inbound/proposal").catch(() => {});
      }).catch(() => {});
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
    // Auto-push full merged proposal to GPP in background
    pushToGpp({ source: "thriveup", type: "proposal_merged", grant: { title: proposal.grantTitle, nofo: proposal.grantNofo }, projectTitle: proposal.projectTitle, prime: proposal.primeOrgName, mergedNarrative: merged, pushedAt: new Date().toISOString() }, "/api/inbound/proposal").catch(() => {});
    return res.json({ merged });
  });

  // ══════════════════════════════════════════════════════════════
  // FOUR PUSH ROUTES — ThriveUp → GrantPathPro
  // Each packages data from ThriveUp's DB and POSTs to GPP.
  // If GPP_API_URL is not set, returns a preview of what would be sent.
  // ══════════════════════════════════════════════════════════════

  async function pushToGpp(payload: Record<string, unknown>, endpoint: string): Promise<{ sent: boolean; preview?: unknown; response?: unknown; error?: string; authMismatch?: boolean }> {
    const gppUrl = process.env.GPP_API_URL;
    const gppKey = process.env.THRIVE_GPP_API_KEY;
    if (!gppUrl) return { sent: false, preview: payload };
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
      return { sent: false, error: e.message, preview: payload };
    }
  }

  /** POST /api/thriveup/push-entity — push org profile to GPP */
  app.post("/api/thriveup/push-entity", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Sign in required" });
    const { entityId, consortiumId } = req.body;

    let orgData: Record<string, unknown> = {};
    if (entityId) {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, entityId));
      if (org) {
        orgData = { name: org.name, ein: org.ein, uei: org.uei, cageCode: org.cageCode, state: org.state, is501c3: org.is501c3, focusAreas: org.focusAreas, populationsServed: org.populationsServed, naicsCodes: org.naicsCodes, samStatus: org.samStatus, missionText: org.missionText };
      }
    }
    if (consortiumId) {
      const [cp] = await db.select().from(consortiumProposals).where(eq(consortiumProposals.id, consortiumId));
      if (cp) orgData = { ...orgData, consortiumPrimeOrg: cp.primeOrgName, consortiumPrimeUei: cp.primeUei, consortiumPrimeEin: cp.primeEin };
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

    let grantData: Record<string, unknown> = {};
    let entityContext: Record<string, unknown> = {};

    if (grantId) {
      const [g] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, grantId));
      if (g) grantData = { title: g.title, agency: g.agency, nofo: g.samgovId, deadline: g.deadline, description: g.description, eligibility: g.eligibilityCriteria, fundingAmount: g.fundingAmount, awardCeiling: g.awardCeiling, cfda: g.cfda, sourceUrl: g.sourceUrl, focusAreas: g.focusAreas, fitScore: g.fitScore, fitAnalysis: g.fitAnalysis, aiAnalysis: g.aiAnalysis };
    }
    if (consortiumId) {
      const [cp] = await db.select().from(consortiumProposals).where(eq(consortiumProposals.id, consortiumId));
      if (cp) {
        entityContext = { primeOrg: cp.primeOrgName, primeUei: cp.primeUei, projectTitle: cp.projectTitle, geography: cp.geography, awardAmount: cp.awardAmount };
        if (!grantData.title) grantData = { title: cp.grantTitle, nofo: cp.grantNofo, deadline: cp.grantDeadline, fundingAmount: cp.awardAmount };
      }
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

    // Mark push timestamp
    await db.update(consortiumProposals).set({ gppPushedAt: new Date() }).where(eq(consortiumProposals.id, consortiumId));
    const result = await pushToGpp(payload, "/api/inbound/proposal");
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
      authKeyName: "THRIVEUP_INBOUND_KEY",
      note: "Contact ThriveUp for the actual key value — never transmitted in plain text",
      outboundCallback: {
        description: "ThriveUp will POST community briefs to Grant Path Pro",
        requiredEnvVars: ["GPP_API_URL", "GPP_API_KEY"],
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
