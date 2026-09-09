/**
 * ChildCORE API Routes
 *
 * Transparent proxy + status surface for the ChildCORE Partner API integration.
 * All GET routes require a valid ThriveUp session (staff or admin) so community
 * data never leaks to unauthenticated callers.
 * The /status and /ping routes are open to any authenticated session.
 *
 * Push (POST /api/childcore/push) requires admin role.
 */

import type { Router, Request, Response } from "express";
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
}
