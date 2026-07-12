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

// ─── In-memory event store (lightweight — promote to DB if volume warrants) ─────
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

const gppEvents: GppEvent[] = [];

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

export function registerGrantPathProRoutes(app: Express) {

  /**
   * INBOUND — Grant Path Pro → ThriveUp
   * GPP POSTs grant execution events here.
   * Auth: x-api-key: THRIVEUP_INBOUND_KEY
   */
  app.post("/api/inbound/grantpathpro", requireGppInboundKey, (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<GppEvent> & { events?: Partial<GppEvent>[] };

      const toStore = (raw: Partial<GppEvent>): GppEvent => ({
        id: `gpp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        receivedAt: new Date().toISOString(),
        eventType: raw.eventType || "status_update",
        grantId: raw.grantId,
        grantTitle: raw.grantTitle,
        geography: raw.geography,
        status: raw.status,
        milestone: raw.milestone,
        amount: raw.amount,
        dueDate: raw.dueDate,
        notes: raw.notes,
        meta: raw.meta,
      });

      if (Array.isArray(body.events)) {
        const stored = body.events.map(toStore);
        gppEvents.unshift(...stored);
        console.log(`[GrantPathPro] Received batch: ${stored.length} event(s)`);
        return res.json({ received: true, count: stored.length, ids: stored.map(e => e.id) });
      }

      const event = toStore(body);
      gppEvents.unshift(event);
      if (gppEvents.length > 500) gppEvents.splice(500);
      console.log(`[GrantPathPro] Received event: ${event.eventType} — ${event.grantTitle || event.grantId || "no title"}`);
      return res.json({ received: true, id: event.id });

    } catch (err) {
      console.error("[GrantPathPro] Inbound error:", err);
      return res.status(500).json({ error: "Failed to process inbound event" });
    }
  });

  /**
   * GET /api/inbound/grantpathpro/events
   * Returns recent GPP events (internal use — grant hub, ops center).
   * No external auth required — internal only, not listed in public docs.
   */
  app.get("/api/inbound/grantpathpro/events", (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
    const grantId = req.query.grantId as string | undefined;
    const filtered = grantId
      ? gppEvents.filter(e => e.grantId === grantId)
      : gppEvents;
    return res.json({
      events: filtered.slice(0, limit),
      total: filtered.length,
    });
  });

  /**
   * GET /api/inbound/grantpathpro/status
   * Health check — lets GPP verify the connection is live.
   * Returns the inbound endpoint info without exposing the key.
   */
  app.get("/api/inbound/grantpathpro/status", requireGppInboundKey, (_req: Request, res: Response) => {
    return res.json({
      connected: true,
      platform: "ThriveUp Academy",
      inboundEndpoint: "/api/inbound/grantpathpro",
      eventsReceived: gppEvents.length,
      lastEventAt: gppEvents[0]?.receivedAt ?? null,
      capabilities: [
        "grant_status_updates",
        "milestone_events",
        "compliance_alerts",
        "budget_tracking",
        "outcome_reporting",
      ],
    });
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
