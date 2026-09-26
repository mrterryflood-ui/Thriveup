/**
 * ChildCORE API Routes
 *
 * Transparent proxy + status surface for the ChildCORE Partner API integration.
 * All protected GET routes require a valid ThriveUp administrator session so community
 * data never leaks to unauthenticated callers.
 * The /ping and public destination metadata routes are credential-free.
 *
 * Protected routes use storage.getUser(), which normalizes the users-table
 * TCAF-admin flag to the admin role; session role claims are never trusted.
 * Monitoring and settings are limited to administrators.
 * Public ping and destination metadata remain credential-free.
 */

import type { NextFunction, Router, Request, Response } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { checkChildCOREIngressAuthorization } from "./childcore-ingest-auth";
import { normalizeChildCORECountyPayload, type ChildCORECountyEvidence } from "./childcore-ingest-payload";
import { buildChildCORECountyUpsert } from "./childcore-county-upsert";
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
import {
  getChildCOREIntegrationConfig,
  isTrustedChildCOREApiBaseUrl,
  updateChildCOREIntegrationConfig,
} from "./childcore-config";
import { childcoreIntegrationConfigSchema } from "@shared/childcore-config";
import { buildCommunityAIContextWithStatus } from "./rplice-intelligence";
import { db, storage } from "./storage";
import {
  partnerApiAuditLog,
  partnerApiKeys,
  yhsiYouthParticipants,
  yhsiReferrals,
  yhsiOutcomeSnapshots,
  childcoreCountyMetrics,
} from "@shared/schema";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const publicConfigHits = new Map<string, { count: number; resetAt: number }>();
const PUBLIC_CONFIG_WINDOW_MS = 60_000;
const PUBLIC_CONFIG_MAX_REQUESTS = 60;
let publicProbeCache: {
  expiresAt: number;
  result: Awaited<ReturnType<typeof probeChildCORE>>;
} | null = null;
const PUBLIC_PROBE_CACHE_MS = 15_000;
const countyMetricsHits = new Map<string, { count: number; resetAt: number }>();
const COUNTY_METRICS_WINDOW_MS = 60_000;
const COUNTY_METRICS_MAX_REQUESTS = 20;

function getUserId(req: Request): string | undefined {
  const user = (req as unknown as { user?: { claims?: { sub?: string }; id?: string } }).user;
  return user?.claims?.sub || user?.id;
}

async function requireSettingsAdmin(req: Request, res: Response): Promise<string | null> {
  if (!req.isAuthenticated?.() || !getUserId(req)) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  try {
    const userId = getUserId(req)!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "TCAF administrator access required for ChildCORE settings and monitoring" });
      return null;
    }
    return userId;
  } catch (error) {
    console.error("[ChildCORE] settings admin check failed:", error);
    res.status(500).json({ error: "Could not verify administrator access" });
    return null;
  }
}

function rateLimitPublicConfig(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (publicConfigHits.size > 1000) {
    for (const [key, entry] of publicConfigHits) {
      if (entry.resetAt <= now) publicConfigHits.delete(key);
    }
    while (publicConfigHits.size >= 10_000) {
      const oldest = publicConfigHits.keys().next().value;
      if (typeof oldest !== "string") break;
      publicConfigHits.delete(oldest);
    }
  }
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const current = publicConfigHits.get(ip);
  if (!current || current.resetAt <= now) {
    publicConfigHits.set(ip, { count: 1, resetAt: now + PUBLIC_CONFIG_WINDOW_MS });
    next();
    return;
  }
  if (current.count >= PUBLIC_CONFIG_MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))));
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  current.count += 1;
  next();
}

function hashPartnerKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

function rateLimitCountyMetrics(req: Request, res: Response): boolean {
  const ip = req.ip || "unknown";
  const now = Date.now();
  if (countyMetricsHits.size > 1024) {
    for (const [key, entry] of countyMetricsHits) {
      if (entry.resetAt <= now) countyMetricsHits.delete(key);
    }
  }
  const current = countyMetricsHits.get(ip);
  if (!current || current.resetAt <= now) {
    if (countyMetricsHits.size >= 10_000) {
      res.status(429).json({ error: "Too many requests" });
      return false;
    }
    countyMetricsHits.set(ip, { count: 1, resetAt: now + COUNTY_METRICS_WINDOW_MS });
    return true;
  }
  if (current.count >= COUNTY_METRICS_MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))));
    res.status(429).json({ error: "Too many requests" });
    return false;
  }
  current.count++;
  return true;
}

// ── Partner-key auth for inbound pushes ────────────────────────────────────────
// ChildCORE stores ThriveUp's THRIVEUP_API_KEY and sends it as
// Authorization: Bearer <key> on inbound county-metrics pushes.
// We validate it against the partnerApiKeys table (hashed).
async function resolveInboundPartnerKey(
  req: Request,
  res: Response,
): Promise<{ keyId: string; keyHash: string; partnerName: string; keyPrefix: string; scopes: string[] } | null> {
  const authHeader = req.headers.authorization ?? "";
  const bearerPrefix = /^Bearer\s+/i.exec(authHeader)?.[0];
  const raw = bearerPrefix
    ? authHeader.slice(bearerPrefix.length).trim()
    : (req.headers["x-partner-key"] as string | undefined)?.trim() ?? "";
  if (!raw) {
    res.status(401).json({ error: "Authentication required. Include Authorization: Bearer <partner-key>" });
    return null;
  }
  const hashed = hashPartnerKey(raw);
  let lookupResults:
    | Array<Pick<typeof partnerApiKeys.$inferSelect, "id" | "partnerName" | "keyPrefix" | "active" | "scopes">>
    | undefined;
  try {
    lookupResults = await db
      .select({
        id: partnerApiKeys.id,
        partnerName: partnerApiKeys.partnerName,
        keyPrefix: partnerApiKeys.keyPrefix,
        active: partnerApiKeys.active,
        scopes: partnerApiKeys.scopes,
      })
      .from(partnerApiKeys)
      .where(eq(partnerApiKeys.keyHash, hashed))
      .limit(1);
  } catch (error) {
    console.error(
      "[ChildCORE] inbound partner-key lookup failed:",
      error instanceof Error ? error.message : String(error),
    );
    res.status(503).json({ error: "Partner authentication service temporarily unavailable" });
    return null;
  }
  const [key] = lookupResults;
  if (!key || !key.active) {
    res.status(403).json({ error: "Invalid or revoked partner key" });
    return null;
  }
  return {
    keyId: key.id,
    keyHash: hashed,
    partnerName: key.partnerName,
    keyPrefix: key.keyPrefix,
    scopes: Array.isArray(key.scopes) ? key.scopes as string[] : [],
  };
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerChildCORERoutes(router: Router): void {

  // ── Health / status ─────────────────────────────────────────────────────────
  // Open to all (no auth) — used by the homepage live badge
  router.get("/childcore/ping", rateLimitPublicConfig, async (_req, res) => {
    try {
      const now = Date.now();
      if (publicProbeCache && publicProbeCache.expiresAt > now) {
        return res.json(publicProbeCache.result);
      }
      const probe = await probeChildCORE();
      if (!probe.configAvailable) {
        return res.status(503).json({ ...probe, error: "ChildCORE destination configuration unavailable" });
      }
      publicProbeCache = { expiresAt: now + PUBLIC_PROBE_CACHE_MS, result: probe };
      res.json(probe);
    } catch {
      res.status(503).json({
        ok: false,
        latencyMs: 0,
        configured: isChildCOREConfigured(),
        configAvailable: false,
      });
    }
  });

  // Public pages may show the current external destination, but never receive
  // credentials or protected monitoring metadata.
  router.get("/childcore/public-config", rateLimitPublicConfig, async (_req, res) => {
    try {
      const config = await getChildCOREIntegrationConfig();
      res.setHeader("Cache-Control", "no-store");
      res.json({ docsUrl: config.docsUrl });
    } catch (err) {
      console.error("[ChildCORE] public config failed:", err);
      res.status(503).json({ error: "ChildCORE destination unavailable", docsUrl: null });
    }
  });

  router.get("/childcore/status", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    try {
      const status = await getChildCOREConnectionStatus();
      res.json(status);
    } catch (err) {
      console.error("[ChildCORE] status metadata/probe failed:", err);
      // Do not invent a destination when the integration status cannot be
      // loaded. The protected dashboard renders an honest unavailable state.
      res.status(503).json({
        error: "Status probe failed",
        baseUrl: null,
        docsUrl: null,
      });
    }
  });

  // ── Operator-managed destinations ─────────────────────────────────────────
  router.get("/childcore/settings", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    try {
      const config = await getChildCOREIntegrationConfig();
      res.json(config);
    } catch (err) {
      console.error("[ChildCORE] settings read failed:", err);
      res.status(503).json({ error: "ChildCORE destination settings are temporarily unavailable" });
    }
  });

  router.patch("/childcore/settings", async (req, res) => {
    const actorUserId = await requireSettingsAdmin(req, res);
    if (!actorUserId) return;
    try {
      const parsed = childcoreIntegrationConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Both destinations must be valid HTTPS URLs.",
          details: parsed.error.flatten(),
        });
      }
      if (!isTrustedChildCOREApiBaseUrl(parsed.data.baseUrl)) {
        return res.status(400).json({
          error: "The API base URL origin is not in the trusted ChildCORE origin allowlist.",
          details: { fieldErrors: { baseUrl: ["Use an approved ChildCORE API origin."] } },
        });
      }
      const config = await updateChildCOREIntegrationConfig(parsed.data, actorUserId);
      publicProbeCache = null;
      res.json({ ok: true, ...config });
    } catch (err) {
      console.error("[ChildCORE] settings update failed:", err);
      res.status(500).json({ error: "Could not update ChildCORE settings" });
    }
  });

  // ── Community intelligence pull ──────────────────────────────────────────────
  router.get("/childcore/community/:geo/providers", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    const data = await getChildCOREProviders(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  router.get("/childcore/community/:geo/schools", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    const data = await getChildCORESchools(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  router.get("/childcore/community/:geo/sdoh", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    const data = await getChildCORESDOH(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  router.get("/childcore/community/:geo/impact", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    const data = await getChildCOREImpact(req.params.geo);
    if (!data) return res.status(503).json({ error: "ChildCORE unavailable or not configured" });
    res.json(data);
  });

  // ── Outbound push: ThriveUp → ChildCORE ─────────────────────────────────────
  router.post("/childcore/push", async (req, res) => {
    if (!(await requireSettingsAdmin(req, res))) return;
    const { event, zip, data } = req.body ?? {};
    if (typeof event !== "string" || event.length === 0 || event.length > 100) {
      return res.status(400).json({ error: "event is required" });
    }
    if (zip !== undefined && (typeof zip !== "string" || !/^\d{5}$/.test(zip))) {
      return res.status(400).json({ error: "zip must be a 5-digit ZIP code" });
    }
    if (data !== undefined && (typeof data !== "object" || data === null || Array.isArray(data) || JSON.stringify(data).length > 50_000)) {
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
    if (!(await requireSettingsAdmin(req, res))) return;
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
    if (!(await requireSettingsAdmin(req, res))) return;
    try {
      const rawLimit = req.query.limit;
      if (rawLimit !== undefined && typeof rawLimit !== "string") {
        return res.status(400).json({ error: "limit must be a single positive integer" });
      }
      const limitText = (rawLimit as string | undefined) ?? "100";
      if (!/^[1-9]\d*$/.test(limitText)) {
        return res.status(400).json({ error: "limit must be a positive integer" });
      }
      const parsedLimit = Number(limitText);
      if (!Number.isSafeInteger(parsedLimit)) {
        return res.status(400).json({ error: "limit must be a safe integer" });
      }
      const limit = Math.min(parsedLimit, 200);
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
    if (!(await requireSettingsAdmin(req, res))) return;
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
    if (!(await requireSettingsAdmin(req, res))) return;

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

  // ── Inbound: ChildCORE → ThriveUp county metrics push ───────────────────────
  // ChildCORE sends county-level early-childhood intelligence to this route.
  // Both its documented flat metric payload and the existing records[] batch
  // are accepted; only safely projected aggregates reach Navigator context.
  //
  // Auth: Authorization: Bearer <THRIVEUP_API_KEY> (hashed in partner_api_keys)
  // Scope required: inbound:write — prevents read-only partner keys from injecting
  // or poisoning county-level metrics data.
  router.post("/childcore/county-metrics/ingest", async (req, res) => {
    if (!rateLimitCountyMetrics(req, res)) return;
    const partner = await resolveInboundPartnerKey(req, res);
    if (!partner) return;
    const configuredChildCoreKey = process.env.THRIVEUP_API_KEY?.trim();
    const configuredChildCoreHash = configuredChildCoreKey ? hashPartnerKey(configuredChildCoreKey) : "";
    const authorizationFailure = checkChildCOREIngressAuthorization(partner, configuredChildCoreHash);
    if (authorizationFailure === "wrong_partner_identity") {
      res.status(403).json({ error: "This endpoint only accepts the ChildCORE partner identity" });
      return;
    }
    if (authorizationFailure === "missing_scope") {
      res.status(403).json({ error: "inbound:write scope required for county metrics ingestion" });
      return;
    }

    const normalized = normalizeChildCORECountyPayload(req.body);
    if (normalized.kind === "invalid") {
      return res.status(400).json({ error: normalized.error });
    }
    const { records } = normalized;
    const batchSnapshotValue = normalized.snapshotAt;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "'records' must be a non-empty array" });
    }
    if (records.length > 500) {
      return res.status(400).json({ error: "Batch limit is 500 records per push" });
    }

    const accepted: string[] = [];
    const rejected: Array<{ index: number; reason: string }> = [];
    const pendingRows: Array<{ index: number; row: typeof childcoreCountyMetrics.$inferInsert }> = [];
    const seenFips = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const candidate = records[i];
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        rejected.push({ index: i, reason: "record must be an object" });
        continue;
      }
      const raw = candidate as Record<string, unknown>;
      const fipsValue = raw.fipsCode ?? raw.fips_code;
      const fipsCode = typeof fipsValue === "string" ? fipsValue.trim() : "";
      if (!fipsCode || !/^\d{5}$/.test(fipsCode)) {
        rejected.push({ index: i, reason: "fipsCode must be a 5-digit string" });
        continue;
      }
      if (seenFips.has(fipsCode)) {
        rejected.push({ index: i, reason: "duplicate fipsCode in batch" });
        continue;
      }
      seenFips.add(fipsCode);
      const rateFields = [
        "desertRate", "prekEnrollmentRate", "kindergartenReadiness",
        "subsidyAccessRate", "childPovertyRate", "staffTurnoverRate",
      ];
      const invalidRate = rateFields.find((field) => {
        const value = raw[field];
        return value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100);
      });
      if (invalidRate) {
        rejected.push({ index: i, reason: `${invalidRate} must be a finite number between 0 and 100` });
        continue;
      }
      if (raw.countyName !== undefined &&
          (typeof raw.countyName !== "string" || raw.countyName.length > 100)) {
        rejected.push({ index: i, reason: "countyName must be a string of at most 100 characters" });
        continue;
      }
      const snapshotValue = raw.snapshotAt ?? batchSnapshotValue;
      if (typeof snapshotValue !== "string") {
        rejected.push({ index: i, reason: "snapshotAt is required as an ISO timestamp" });
        continue;
      }
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(snapshotValue)) {
        rejected.push({ index: i, reason: "snapshotAt must be an ISO-8601 UTC timestamp" });
        continue;
      }
      const snapshotAt = new Date(snapshotValue);
      if (!Number.isFinite(snapshotAt.getTime())) {
        rejected.push({ index: i, reason: "snapshotAt must be a valid ISO timestamp" });
        continue;
      }
      if (snapshotAt.toISOString().slice(0, 10) !== snapshotValue.slice(0, 10)) {
        rejected.push({ index: i, reason: "snapshotAt must contain a valid calendar date" });
        continue;
      }
      if (snapshotAt.getTime() > Date.now() + 5 * 60 * 1000) {
        rejected.push({ index: i, reason: "snapshotAt cannot be more than 5 minutes in the future" });
        continue;
      }
      try {
        const boundedRate = (field: string): number | null => {
          const value = raw[field];
          return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
        };
        const boundedString = (field: string, max: number): string | null => {
          const value = raw[field];
          return value == null ? null : typeof value === "string" && value.length <= max ? value.trim() : null;
        };
        const rawMetricsValue = raw.rawMetrics;
        let rawMetrics: ChildCORECountyEvidence | null = null;
        if (normalized.kind === "flat") {
          rawMetrics = normalized.rawMetrics;
        } else if (rawMetricsValue !== undefined) {
          if (!rawMetricsValue || typeof rawMetricsValue !== "object" || Array.isArray(rawMetricsValue) ||
              Object.keys(rawMetricsValue).length > 50 ||
              Object.entries(rawMetricsValue).some(([key, value]) =>
                key.length > 64 || typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1_000_000_000)) {
            rejected.push({ index: i, reason: "rawMetrics must contain at most 50 bounded finite numeric fields" });
            continue;
          }
          rawMetrics = rawMetricsValue as Record<string, number>;
        }
        const row = {
          fipsCode,
          countyName: boundedString("countyName", 100),
          stateFips: fipsCode.slice(0, 2),
          desertRate: boundedRate("desertRate"),
          prekEnrollmentRate: boundedRate("prekEnrollmentRate"),
          kindergartenReadiness: boundedRate("kindergartenReadiness"),
          subsidyAccessRate: boundedRate("subsidyAccessRate"),
          childPovertyRate: boundedRate("childPovertyRate"),
          staffTurnoverRate: boundedRate("staffTurnoverRate"),
          rawMetrics,
          receivedAt: snapshotAt,
          pushedBy: partner.partnerName ?? "childcore",
        };
        pendingRows.push({ index: i, row });
      } catch (err: any) {
        rejected.push({ index: i, reason: err.message ?? "DB insert failed" });
      }
    }
    let storageFailure = false;
    if (pendingRows.length > 0) {
      try {
        // The unique FIPS index plus one bulk upsert avoids one database round
        // trip per county and prevents older source dates replacing newer ones.
        const persisted = await buildChildCORECountyUpsert(pendingRows.map(({ row }) => row));
        const persistedFips = new Set(persisted.map(({ fipsCode }) => fipsCode));
        for (const { index, row } of pendingRows) {
          if (persistedFips.has(row.fipsCode)) {
            accepted.push(row.fipsCode);
          } else {
            rejected.push({ index, reason: "stale snapshot was not applied" });
          }
        }
      } catch (err: any) {
        storageFailure = true;
        for (const { index } of pendingRows) {
          rejected.push({ index, reason: err?.message ?? "Database upsert failed" });
        }
      }
    }

    const allRejected = records.length > 0 && rejected.length === records.length;
    const responseStatus = storageFailure ? 503 : allRejected ? 400 : 202;

    // Audit log
    try {
      await db.insert(partnerApiAuditLog).values({
        keyId: partner.keyId,
        keyPrefix: partner.keyPrefix,
        partnerName: partner.partnerName,
        endpoint: "POST /api/childcore/county-metrics/ingest",
        method: "POST",
        statusCode: responseStatus,
        ip: req.ip ?? "",
        userAgent: typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"].slice(0, 299)
          : null,
      });
    } catch (error) {
      console.error(
        "[ChildCORE] inbound audit log insert failed:",
        error instanceof Error ? error.message : String(error),
      );
    }

    res.status(responseStatus).json({
      received: records.length,
      accepted: accepted.length,
      rejected: rejected.length,
      rejections: rejected.slice(0, 20),
      receipt: {
        partner: partner.partnerName,
        ingestedAt: new Date().toISOString(),
        fipsCodes: accepted,
      },
    });
  });
}
