// NSF 26-508 Hub: MOU partner pipeline + Discoveries confirmation + Federation status.

import type { Express } from "express";
import { db } from "./storage";
import { hubMous, nationwideDiscoveries, insertHubMouSchema } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getJurisdiction } from "@shared/nationwide/jurisdictions";

export function registerMouRoutes(app: Express): void {
  // ---- MOU pipeline ----
  app.get("/api/nsf/mous/:stateCode", async (req, res) => {
    const code = (req.params.stateCode || "").toUpperCase();
    const rows = await db.select().from(hubMous).where(eq(hubMous.hubStateCode, code)).orderBy(hubMous.partnerOrg);
    res.json({ stateCode: code, mous: rows });
  });

  app.post("/api/nsf/mous", async (req, res) => {
    try {
      const body = { ...req.body, hubStateCode: String(req.body?.hubStateCode || "").toUpperCase() };
      if (!getJurisdiction(body.hubStateCode)) return res.status(400).json({ error: "Unknown jurisdiction" });
      const parsed = insertHubMouSchema.parse(body);
      const [row] = await db.insert(hubMous).values(parsed).returning();
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "invalid payload" });
    }
  });

  app.patch("/api/nsf/mous/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const allowed: Record<string, true> = { partnerOrg: true, partnerRole: true, contactName: true, contactEmail: true, contactPhone: true, status: true, notes: true };
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      for (const k of Object.keys(req.body || {})) if (allowed[k]) updates[k] = req.body[k];
      const [row] = await db.update(hubMous).set(updates).where(eq(hubMous.id, id)).returning();
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "invalid payload" });
    }
  });

  app.delete("/api/nsf/mous/:id", async (req, res) => {
    await db.delete(hubMous).where(eq(hubMous.id, req.params.id));
    res.json({ ok: true });
  });

  // ---- Discoveries (Perplexity findings) confirmation ----
  app.get("/api/nsf/discoveries/:stateCode", async (req, res) => {
    const code = (req.params.stateCode || "").toUpperCase();
    const status = req.query.status ? String(req.query.status) : undefined;
    const where = status
      ? and(eq(nationwideDiscoveries.stateCode, code), eq(nationwideDiscoveries.status, status))
      : eq(nationwideDiscoveries.stateCode, code);
    const rows = await db.select().from(nationwideDiscoveries).where(where).orderBy(desc(nationwideDiscoveries.retrievedAt)).limit(50);
    res.json({ stateCode: code, count: rows.length, discoveries: rows });
  });

  app.patch("/api/nsf/discoveries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const status = String(req.body?.status || "");
      if (!["pending", "confirmed", "dismissed"].includes(status)) {
        return res.status(400).json({ error: "status must be pending|confirmed|dismissed" });
      }
      const [row] = await db.update(nationwideDiscoveries)
        .set({ status, reviewedBy: req.body?.reviewedBy ?? "hub-admin", reviewedAt: new Date() })
        .where(eq(nationwideDiscoveries.id, id))
        .returning();
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "invalid payload" });
    }
  });

  // ---- Federation status (read-through to existing /api/rplice/state) ----
  app.get("/api/nsf/federation-status", async (_req, res) => {
    try {
      const r = await fetch("http://localhost:5000/api/rplice/state", { signal: AbortSignal.timeout(3000) });
      if (!r.ok) return res.json({ ok: false, peers: [], note: "federation state unavailable" });
      const data: any = await r.json();
      res.json({ ok: true, peers: data?.network?.peers ?? [], lastEventAt: data?.lastEventAt ?? null, mirrorLog: (data?.mirrorLog ?? []).slice(0, 10) });
    } catch (e: any) {
      res.json({ ok: false, peers: [], note: e?.message ?? "fetch failed" });
    }
  });
}
