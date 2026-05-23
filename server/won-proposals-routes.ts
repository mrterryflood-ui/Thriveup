import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { wonProposals, insertWonProposalSchema, grantOrgTracking, grantOpportunities } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireOrg, getCallerOrg, rateLimitAi } from "./tenant-middleware";
import { classifyFunder } from "./foundation-intelligence";

export function registerWonProposalsRoutes(app: Express) {
  // List all winning proposals for the caller's org.
  app.get("/api/me/won-proposals", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const rows = await db.select().from(wonProposals)
        .where(eq(wonProposals.orgId, org.id))
        .orderBy(desc(wonProposals.awardedAt), desc(wonProposals.createdAt));
      res.json({ wins: rows });
    } catch (err) {
      console.error("[won-proposals] list failed:", err);
      res.status(500).json({ error: "Failed to list winning proposals" });
    }
  });

  // Create a winning proposal manually OR auto-from a tracked grant.
  app.post("/api/me/won-proposals", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      // If grantId provided, auto-fill funderName + funderType from the grant catalog.
      let body: Record<string, unknown> = { ...req.body };
      if (typeof body.grantId === "string" && body.grantId) {
        const [g] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, body.grantId));
        if (g) {
          if (!body.funderName) body.funderName = g.agency ?? "Unknown funder";
          if (!body.funderType) body.funderType = classifyFunder(g);
          if (!body.projectTitle) body.projectTitle = g.title;
        }
      }
      const parsed = insertWonProposalSchema.parse({ ...body, orgId: org.id });
      const [row] = await db.insert(wonProposals).values(parsed).returning();
      res.status(201).json({ win: row });
    } catch (err) {
      console.error("[won-proposals] create failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // Update — typically to attach/replace the draft text after the fact.
  app.patch("/api/me/won-proposals/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const updatable = insertWonProposalSchema.partial().omit({ orgId: true }).parse(req.body);
      const [row] = await db.update(wonProposals)
        .set(updatable)
        .where(and(eq(wonProposals.id, String(req.params.id)), eq(wonProposals.orgId, org.id)))
        .returning();
      if (!row) return res.status(404).json({ error: "Winning proposal not found" });
      res.json({ win: row });
    } catch (err) {
      console.error("[won-proposals] update failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.delete("/api/me/won-proposals/:id", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const rows = await db.delete(wonProposals)
        .where(and(eq(wonProposals.id, String(req.params.id)), eq(wonProposals.orgId, org.id)))
        .returning({ id: wonProposals.id });
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (err) {
      console.error("[won-proposals] delete failed:", err);
      res.status(500).json({ error: "Delete failed" });
    }
  });
}
