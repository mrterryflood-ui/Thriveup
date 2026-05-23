import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { activeBids, insertActiveBidSchema } from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import { ACTIVE_BIDS_SEED } from "@shared/active-bids";
import { requireAuth } from "./tenant-middleware";

// Per-RFP teaming + rubric strategy. Single source of truth shared by the
// tracking dashboard and the AI writer engine. Reads are auth-gated;
// writes require auth.
export function registerActiveBidsRoutes(app: Express) {
  // Auto-seed on first boot if table is empty (so the dashboard never blanks).
  void seedActiveBidsIfEmpty();

  app.get("/api/active-bids", requireAuth, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(activeBids).orderBy(asc(activeBids.deadlineIso));
      res.json({ bids: rows });
    } catch (err) {
      console.error("[active-bids] list failed:", err);
      res.status(500).json({ error: "Failed to list active bids" });
    }
  });

  app.get("/api/active-bids/:rfpId", requireAuth, async (req: Request, res: Response) => {
    try {
      const rfpId = String(req.params.rfpId);
      const [row] = await db.select().from(activeBids).where(eq(activeBids.rfpId, rfpId));
      if (!row) return res.status(404).json({ error: "Active bid not found" });
      res.json({ bid: row });
    } catch (err) {
      console.error("[active-bids] get failed:", err);
      res.status(500).json({ error: "Failed to fetch active bid" });
    }
  });

  // Upsert by rfpId — POST is idempotent on rfpId so the writer engine can
  // safely re-seed from shared/active-bids.ts.
  app.post("/api/active-bids", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertActiveBidSchema.parse({
        ...req.body,
        deadlineIso: typeof req.body?.deadlineIso === "string" ? new Date(req.body.deadlineIso) : req.body?.deadlineIso,
      });
      const [row] = await db.insert(activeBids).values(parsed).onConflictDoUpdate({
        target: activeBids.rfpId,
        set: { ...parsed, updatedAt: new Date() },
      }).returning();
      res.status(201).json({ bid: row });
    } catch (err) {
      console.error("[active-bids] upsert failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.patch("/api/active-bids/:rfpId", requireAuth, async (req: Request, res: Response) => {
    try {
      const rfpId = String(req.params.rfpId);
      const partial = insertActiveBidSchema.partial().parse({
        ...req.body,
        ...(typeof req.body?.deadlineIso === "string" ? { deadlineIso: new Date(req.body.deadlineIso) } : {}),
      });
      const [row] = await db.update(activeBids)
        .set({ ...partial, updatedAt: new Date() })
        .where(eq(activeBids.rfpId, rfpId))
        .returning();
      if (!row) return res.status(404).json({ error: "Active bid not found" });
      res.json({ bid: row });
    } catch (err) {
      console.error("[active-bids] update failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.delete("/api/active-bids/:rfpId", requireAuth, async (req: Request, res: Response) => {
    try {
      const rfpId = String(req.params.rfpId);
      const rows = await db.delete(activeBids).where(eq(activeBids.rfpId, rfpId)).returning({ rfpId: activeBids.rfpId });
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (err) {
      console.error("[active-bids] delete failed:", err);
      res.status(500).json({ error: "Delete failed" });
    }
  });

  // Admin: force re-seed from shared/active-bids.ts (upsert, so existing
  // rows get refreshed, manually-added rows survive).
  app.post("/api/active-bids/seed", requireAuth, async (_req: Request, res: Response) => {
    try {
      const summary = await reseedActiveBidsFromFile();
      res.json(summary);
    } catch (err) {
      console.error("[active-bids] seed failed:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Seed failed" });
    }
  });
}

async function seedActiveBidsIfEmpty() {
  try {
    const existing = await db.select({ id: activeBids.id }).from(activeBids).limit(1);
    if (existing.length > 0) return;
    await reseedActiveBidsFromFile();
    console.log(`[active-bids] seeded ${ACTIVE_BIDS_SEED.length} bids from shared/active-bids.ts`);
  } catch (err) {
    console.error("[active-bids] startup seed failed (non-fatal):", err);
  }
}

async function reseedActiveBidsFromFile(): Promise<{ ok: true; upserted: number }> {
  let upserted = 0;
  for (const bid of ACTIVE_BIDS_SEED) {
    const payload = {
      rfpId: bid.rfpId,
      grantId: bid.grantId ?? null,
      title: bid.title,
      funder: bid.funder,
      deadline: bid.deadline,
      deadlineIso: new Date(bid.deadlineIso),
      teamIds: bid.teamIds,
      notes: bid.notes,
      submission: bid.submission,
      rubric: bid.rubric,
      status: "tracking" as const,
    };
    await db.insert(activeBids).values(payload).onConflictDoUpdate({
      target: activeBids.rfpId,
      set: { ...payload, updatedAt: new Date() },
    });
    upserted++;
  }
  return { ok: true, upserted };
}
