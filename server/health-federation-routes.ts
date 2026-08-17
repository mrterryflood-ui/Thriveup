// ============================================================
// Health Federation Routes — live partner content for the
// Health & Wellness hub. Read-only, public, server-side cached.
// An unreachable partner returns an explicit "offline" payload
// (200 for the content routes so the hub renders a visible
// outage state; /status reports per-partner ok/latency/error).
// ============================================================

import type { Express } from "express";
import {
  FEDERATED_PARTNERS,
  getFederatedContent,
  checkPartnerConnectivity,
} from "./health-federation";

export function registerHealthFederationRoutes(app: Express) {
  // Partner metadata + deep links (static config, never fails)
  app.get("/api/health/federation/partners", (_req, res) => {
    res.json(FEDERATED_PARTNERS);
  });

  // Connectivity check — registered BEFORE the parameterized route so it can
  // never be shadowed. Surfaces partner outages instead of failing silently.
  app.get("/api/health/federation/status", async (_req, res) => {
    try {
      const partners = await checkPartnerConnectivity();
      const allOk = partners.every((p) => p.ok);
      res.status(allOk ? 200 : 503).json({ allOk, partners });
    } catch (error) {
      console.error("[Health Federation] status check error:", error);
      res.status(502).json({ error: "Connectivity check failed" });
    }
  });

  // Live federated content per partner
  app.get("/api/health/federation/:partnerId", async (req, res) => {
    const partnerId = String(req.params.partnerId);
    if (partnerId !== "herhealth" && partnerId !== "malehealth") {
      return res.status(404).json({ error: `Unknown federation partner: ${partnerId}` });
    }
    try {
      const result = await getFederatedContent(partnerId);
      res.json(result);
    } catch (error) {
      console.error("[Health Federation] route error:", error);
      res.status(502).json({ error: "Federation gateway failure" });
    }
  });
}
