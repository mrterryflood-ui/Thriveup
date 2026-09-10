/**
 * ChildCORE API Routes
 *
 * Transparent proxy + status surface for the ChildCORE Partner API integration.
 * All GET routes require a valid ThriveUp session (staff or admin) so community
 * data never leaks to unauthenticated callers.
 * The /status and /ping routes are open to any authenticated session.
 *
 * Push (POST /api/childcore/push) requires admin role.
 * Admin-only routes: /rag-preview, /events, /yhsi-summary
 */

import type { Router, Request, Response } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import {
  probeChildCORE,
  getChildCOREProviders,
  getChildCORESchools,
  getChildCORESDOH,
  getChildCOREImpact,
  getChildCOREConnectionStatus,
  pushToChildCORE,
  isChildCOREConfigured,
} from "./childcore-connector";
import { buildCommunityAIContextWithStatus } from "./rplice-intelligence";
import { db } from "./storage";
import {
  partnerApiAuditLog,
  partnerApiKeys,
  yhsiYouthParticipants,
  yhsiReferrals,
  yhsiOutcomeSnapshots,
} from "@shared/schema";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!requireAuth(req, res)) return false;
  const role = (req.user as any)?.role;
  if (role !== "admin" && role !== "platform_staff") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

function hashPartnerKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerChildCORERoutes(router: Router): void {

  // ── Health / status ─────────────────────────────────────────────────────────
  // Open to all (no auth) — used by the homepage live badge
  router.get("/childcore/ping", async (_req, res) => {
    try {
      const probe = await probeChildCORE();
      res.json(probe);
    } catch {
      res.status(503).json({ ok: false, latencyMs: 0, configured: isChildCOREConfigured() });
    }
  });

  router.get("/childcore/status", async (req, res) => {
    if (!requireAuth(req, res)) return;
    try {
      const status = await getChildCOREConnectionStatus();
      res.json(status);
    } catch {
      res.status(503).json({ error: "Status probe failed" });
    }
  });

  // ── Community intelligence pull ──────────────────────────────────────────────
  router.get("/childcore/community/:geo/providers", async (req, res) => {
    if (!requireAuth(req, res)) return;
    const data = await getChildCOREProviders(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  router.get("/childcore/community/:geo/schools", async (req, res) => {
    if (!requireAuth(req, res)) return;
    const data = await getChildCORESchools(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  router.get("/childcore/community/:geo/sdoh", async (req, res) => {
    if (!requireAuth(req, res)) return;
    const data = await getChildCORESDOH(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  router.get("/childcore/community/:geo/impact", async (req, res) => {
    if (!requireAuth(req, res)) return;
    const data = await getChildCOREImpact(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  // ── Outbound push: ThriveUp → ChildCORE ─────────────────────────────────────
  router.post("/childcore/push", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { event, zip, data } = req.body ?? {};
    if (!event || typeof event !== "string") {
      return res.status(400).json({ error: "event is required" });
    }
    if (data !== undefined && typeof data !== "object") {
      return res.status(400).json({ error: "data must be an object" });
    }
    const result = await pushToChildCORE({ event, zip, data: data ?? {} });
    if (!result.ok) {
      return res.status(503).json({ error: result.error });
    }
    res.json({ ok: true, response: result.response });
  });

  // ── RAG context preview (admin only) ────────────────────────────────────────
  // Returns the exact community-intelligence context string the AI would receive,
  // plus source-status for each data partner.
  router.get("/childcore/rag-preview", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const zip = (req.query.zip as string | undefined)?.trim();
    if (!zip || !/^\d{5}$/.test(zip)) {
      return res.status(400).json({ error: "zip query parameter must be a 5-digit ZIP code." });
    }
    try {
      const result = await buildCommunityAIContextWithStatus({ zip });
      res.json({
        zip,
        content: result.content,
        sources: result.sources,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Context build failed", detail: err?.message });
    }
  });

  // ── Event / audit log (admin only) ──────────────────────────────────────────
  // Returns the last 100 Partner API calls attributed to ChildCORE.
  // Covers both directions: ChildCORE → ThriveUp (logged by requirePartnerAuth)
  // and manual admin probes.
  router.get("/childcore/events", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 200);
      const rows = await db
        .select({
          id: partnerApiAuditLog.id,
          endpoint: partnerApiAuditLog.endpoint,
          method: partnerApiAuditLog.method,
          statusCode: partnerApiAuditLog.statusCode,
          keyPrefix: partnerApiAuditLog.keyPrefix,
          ip: partnerApiAuditLog.ip,
          calledAt: partnerApiAuditLog.calledAt,
        })
        .from(partnerApiAuditLog)
        .where(eq(partnerApiAuditLog.partnerName, "ChildCORE"))
        .orderBy(desc(partnerApiAuditLog.calledAt))
        .limit(limit);

      res.json({ events: rows, count: rows.length });
    } catch (err: any) {
      res.status(500).json({ error: "Event query failed", detail: err?.message });
    }
  });

  // ── YHSI aggregate summary (admin only) ─────────────────────────────────────
  // Returns floor-5-suppressed aggregate YHSI metrics for the integration status panel.
  // Uses the same suppression logic as the partner API endpoints.
  const FLOOR = 5;
  function suppress(n: number): number | null { return n >= FLOOR ? n : null; }

  router.get("/childcore/yhsi-summary", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const [pts] = await db.select({
        total:          sql<number>`count(*)::int`,
        chronicCount:   sql<number>`count(*) filter (where chronic_pattern = true)::int`,
        fosterCount:    sql<number>`count(*) filter (where foster_care_history = true)::int`,
        justiceCount:   sql<number>`count(*) filter (where justice_involvement = true)::int`,
        parentingCount: sql<number>`count(*) filter (where is_parenting = true)::int`,
        mckneyCount:    sql<number>`count(*) filter (where mckinney_vento_status = 'identified')::int`,
      }).from(yhsiYouthParticipants);

      const [refs] = await db.select({
        total:    sql<number>`count(*)::int`,
        resolved: sql<number>`count(*) filter (where status = 'resolved')::int`,
        active:   sql<number>`count(*) filter (where status in ('in_service','enrolled'))::int`,
        pending:  sql<number>`count(*) filter (where status in ('referred','pending'))::int`,
      }).from(yhsiReferrals);

      const snapRows = await db.select({
        snapshotType: yhsiOutcomeSnapshots.snapshotType,
        total:        sql<number>`count(*)::int`,
        stableHoused: sql<number>`count(*) filter (where housing_status like 'stable%')::int`,
        housingKnown: sql<number>`count(*) filter (where housing_status is not null and housing_status <> 'unknown')::int`,
        employed:     sql<number>`count(*) filter (where employment_status in ('employed_ft','employed_pt'))::int`,
        employKnown:  sql<number>`count(*) filter (where employment_status is not null and employment_status <> 'unknown')::int`,
        hsDone:       sql<number>`count(*) filter (where hs_completion in ('completed','on_track','ged_track'))::int`,
        hsKnown:      sql<number>`count(*) filter (where hs_completion is not null and hs_completion not in ('na','unknown'))::int`,
      }).from(yhsiOutcomeSnapshots).groupBy(yhsiOutcomeSnapshots.snapshotType);

      const byMilestone: Record<string, any> = {};
      for (const r of snapRows) {
        byMilestone[r.snapshotType] = {
          total: suppress(r.total),
          housingStabilityRate: r.housingKnown >= FLOOR ? Math.round(r.stableHoused / r.housingKnown * 100) : null,
          employmentRate: r.employKnown >= FLOOR ? Math.round(r.employed / r.employKnown * 100) : null,
          hsCompletionRate: r.hsKnown >= FLOOR ? Math.round(r.hsDone / r.hsKnown * 100) : null,
        };
      }

      res.json({
        suppressionFloor: FLOOR,
        note: `Counts below ${FLOOR} are suppressed (null).`,
        participants: {
          total:              suppress(pts.total),
          chronicPattern:     suppress(pts.chronicCount),
          fosterCareHistory:  suppress(pts.fosterCount),
          justiceInvolvement: suppress(pts.justiceCount),
          isParenting:        suppress(pts.parentingCount),
          mckinneyVentoIdentified: suppress(pts.mckneyCount),
        },
        referrals: {
          total:    suppress(refs.total),
          active:   suppress(refs.active),
          pending:  suppress(refs.pending),
          resolved: suppress(refs.resolved),
          resolutionRate: refs.total >= FLOOR
            ? Math.round(refs.resolved / refs.total * 100)
            : null,
        },
        milestones: byMilestone,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: "YHSI summary failed", detail: err?.message });
    }
  });

  // ── Live partner capability status (admin only) ───────────────────────────
  // The UI must not claim a scope is active from a hard-coded list. The
  // partner middleware authorizes against the hashed THRIVEUP_API_KEY row at
  // request time, so this endpoint reports that same row without exposing the
  // key or any secret material.
  router.get("/childcore/capabilities", async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const expectedScopes = [
      "community:read",
      "impact:read",
      "inbound:write",
      "student:read",
      "chainweb:read",
      "yhsi:read",
    ];
    const rawKey = process.env.THRIVEUP_API_KEY?.trim();

    if (!rawKey) {
      return res.json({
        keyConfigured: false,
        keyFound: false,
        keyActive: false,
        partnerName: null,
        scopes: Object.fromEntries(expectedScopes.map((scope) => [scope, "key_not_configured"])),
        capabilities: {
          roi: { status: "connecting", requiredScope: "chainweb:read" },
          yhsi: { status: "connecting", requiredScope: "yhsi:read" },
          student: { status: "connecting", requiredScope: "student:read" },
        },
        checkedAt: new Date().toISOString(),
      });
    }

    try {
      const [key] = await db
        .select({
          partnerName: partnerApiKeys.partnerName,
          scopes: partnerApiKeys.scopes,
          active: partnerApiKeys.active,
          lastUsedAt: partnerApiKeys.lastUsedAt,
        })
        .from(partnerApiKeys)
        .where(eq(partnerApiKeys.keyHash, hashPartnerKey(rawKey)));

      const granted = new Set(Array.isArray(key?.scopes) ? key.scopes : []);
      const stateFor = (scope: string): "active" | "not_granted" | "key_inactive" | "key_not_found" =>
        !key ? "key_not_found" : !key.active ? "key_inactive" : granted.has(scope) ? "active" : "not_granted";
      const scopes = Object.fromEntries(expectedScopes.map((scope) => [scope, stateFor(scope)]));
      const capabilityStatus = (scope: string) => stateFor(scope) === "active" ? "available" : "connecting";

      res.json({
        keyConfigured: true,
        keyFound: Boolean(key),
        keyActive: key?.active ?? false,
        partnerName: key?.partnerName ?? null,
        scopes,
        capabilities: {
          roi: {
            status: capabilityStatus("chainweb:read"),
            requiredScope: "chainweb:read",
            endpoints: [
              "GET /api/partner/v1/chainweb/coefficients",
              "GET /api/partner/v1/chainweb/templates",
              "POST /api/partner/v1/chainweb/scenarios",
              "POST /api/partner/v1/chainweb/scenarios/:id/calculate",
              "POST /api/partner/v1/chainweb/calculations/:id/narratives",
            ],
          },
          yhsi: {
            status: capabilityStatus("yhsi:read"),
            requiredScope: "yhsi:read",
            endpoints: [
              "GET /api/partner/v1/yhsi/metrics",
              "GET /api/partner/v1/yhsi/outcomes-summary",
            ],
          },
          student: {
            status: capabilityStatus("student:read"),
            requiredScope: "student:read",
            endpoints: [
              "GET /api/partner/v1/students/overview",
              "GET /api/partner/v1/attendance/summary",
              "GET /api/partner/v1/early-warnings",
              "GET /api/partner/v1/pathways/overview",
            ],
          },
        },
        lastUsedAt: key?.lastUsedAt ?? null,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[ChildCORE] capability status failed:", err);
      res.status(500).json({ error: "Capability status query failed" });
    }
  });
}
