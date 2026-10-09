/**
 * Data Sources Registry API — DIS Alignment Condition 1
 *
 * The source registry is the foundation of evidence-class disclosure.
 * Every Claim<T> must reference a registered source ID.
 *
 * GET  /api/data-sources           → list all sources (public)
 * GET  /api/data-sources/:id       → single source with full metadata (public)
 * POST /api/data-sources           → register new source (staff only)
 * PATCH /api/data-sources/:id      → update source metadata (staff only)
 */
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { dataSources } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";
import { requireStaff } from "./yhsi-routes";
import { z } from "zod";
import { governmentRequestSchema } from "@shared/government-coordination";
import { coordinateGovernmentEvidence } from "./government-coordination";

const CreateSourceSchema = z.object({
  id: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),
  name: z.string().min(3).max(200),
  owner: z.string().max(200),
  collectionMethod: z.string().max(300),
  evidenceClass: z.enum([
    "verified",
    "estimated",
    "modeled",
    "community-reported",
    "unverified",
  ]),
  geographyLevel: z.string().max(100),
  timePeriod: z.string().max(100),
  refreshCadence: z.string().max(100),
  coverage: z.string().max(500),
  knownLimitations: z.string().max(1000).optional(),
  suppressionRules: z.string().max(500).optional(),
  primarySourceUrl: z.string().url().optional().nullable(),
  citationFormat: z.string().max(500).optional(),
  steward: z.string().max(200).optional(),
});

const UpdateSourceSchema = CreateSourceSchema.partial().omit({ id: true });

export function setupDataSourcesRoutes(app: Express): void {
  // Literal before :id. Public aggregate evidence only; no AI, credentials, or private records.
  const evidenceRequests = new Map<string, { count: number; until: number }>();
  app.get("/api/data-sources/coordination", async (req: Request, res: Response) => {
    const now = Date.now();
    const ip = req.ip || "unknown";
    if (evidenceRequests.size >= 2000) {
      for (const [key, window] of evidenceRequests) if (window.until <= now) evidenceRequests.delete(key);
      if (evidenceRequests.size >= 2000 && !evidenceRequests.has(ip)) {
        return res.status(429).json({ error: "Evidence reader is busy; retry shortly." });
      }
    }
    let window = evidenceRequests.get(ip);
    if (!window || window.until <= now) { window = { count: 0, until: now + 60_000 }; evidenceRequests.set(ip, window); }
    if (++window.count > 30) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "Too many evidence requests. Retry in one minute." });
    }
    const parsed = governmentRequestSchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Use an explicit geography, valid identifier, and supported need.", details: parsed.error.issues });
    try {
      const result = await coordinateGovernmentEvidence(parsed.data);
      res.setHeader("Cache-Control", "no-store");
      return res.json(result); // A partial bundle preserves useful tools, with explicit source failure.
    } catch (error) {
      console.error("[GovernmentCoordination] request failed:", error);
      return res.status(502).json({ error: "Government coordination unavailable; no evidence was substituted." });
    }
  });
  // ── Public: list sources ────────────────────────────────────────────────
  app.get("/api/data-sources", async (req: Request, res: Response) => {
    try {
      const search =
        typeof req.query.q === "string" ? req.query.q.trim() : undefined;
      const activeOnly = req.query.active !== "false";

      const rows = await db
        .select()
        .from(dataSources)
        .where(
          search
            ? or(
                ilike(dataSources.name, `%${search}%`),
                ilike(dataSources.owner, `%${search}%`),
                ilike(dataSources.steward, `%${search}%`),
              )
            : undefined,
        )
        .limit(100);

      const filtered = activeOnly ? rows.filter((r) => r.isActive) : rows;

      return res.json({
        sources: filtered,
        total: filtered.length,
        rubricsVersion: "1.0.0",
      });
    } catch (err) {
      console.error("[data-sources] list error:", err);
      return res.status(500).json({ error: "Failed to load source registry" });
    }
  });

  // ── Public: single source ───────────────────────────────────────────────
  app.get("/api/data-sources/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const rows = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, id))
        .limit(1);

      if (!rows.length) {
        return res.status(404).json({ error: "Source not found" });
      }
      return res.json(rows[0]);
    } catch (err) {
      console.error("[data-sources] get error:", err);
      return res.status(500).json({ error: "Failed to load source" });
    }
  });

  // ── Staff: register new source ──────────────────────────────────────────
  app.post(
    "/api/data-sources",
    requireStaff,
    async (req: Request, res: Response) => {
      const parsed = CreateSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid source data",
          details: parsed.error.issues,
        });
      }

      try {
        const existing = await db
          .select({ id: dataSources.id })
          .from(dataSources)
          .where(eq(dataSources.id, parsed.data.id))
          .limit(1);

        if (existing.length) {
          return res
            .status(409)
            .json({ error: "Source ID already registered. Use PATCH to update." });
        }

        await db.insert(dataSources).values({
          ...parsed.data,
          registeredAt: new Date(),
          lastReviewedAt: new Date(),
          isActive: true,
        });

        return res.status(201).json({ ok: true, id: parsed.data.id });
      } catch (err) {
        console.error("[data-sources] create error:", err);
        return res.status(500).json({ error: "Failed to register source" });
      }
    },
  );

  // ── Staff: update source metadata ───────────────────────────────────────
  app.patch(
    "/api/data-sources/:id",
    requireStaff,
    async (req: Request, res: Response) => {
      const id = String(req.params.id);
      const parsed = UpdateSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid update data",
          details: parsed.error.issues,
        });
      }

      try {
        const existing = await db
          .select({ id: dataSources.id })
          .from(dataSources)
          .where(eq(dataSources.id, id))
          .limit(1);

        if (!existing.length) {
          return res.status(404).json({ error: "Source not found" });
        }

        await db
          .update(dataSources)
          .set({ ...parsed.data, lastReviewedAt: new Date() })
          .where(eq(dataSources.id, id));

        return res.json({ ok: true, id });
      } catch (err) {
        console.error("[data-sources] update error:", err);
        return res.status(500).json({ error: "Failed to update source" });
      }
    },
  );
}
