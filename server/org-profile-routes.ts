import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { organizations, grantOrgTracking, grantOpportunities, insertOrganizationSchema, insertGrantOrgTrackingSchema } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, getUserId, loadCallerOrg, requireOrg, getCallerOrg } from "./tenant-middleware";
import { invalidateOrgScores } from "./org-scoring";

export function registerOrgProfileRoutes(app: Express) {
  // Get the caller's own organization (or null if none yet).
  app.get("/api/me/organization", requireAuth, loadCallerOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req);
    res.json({ organization: org ?? null });
  });

  // Create the caller's organization (one-time, during onboarding wizard).
  app.post("/api/me/organization", requireAuth, async (req: Request, res: Response) => {
    const userId = getUserId(req)!;
    try {
      const [existing] = await db.select().from(organizations).where(eq(organizations.userId, userId));
      if (existing) return res.status(409).json({ error: "Organization already exists", organization: existing });
      const parsed = insertOrganizationSchema.parse({ ...req.body, userId: userId });
      const [created] = await db.insert(organizations).values(parsed).returning();
      res.status(201).json({ organization: created });
    } catch (err) {
      console.error("[org-profile] create failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // Update the caller's organization.
  app.patch("/api/me/organization", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    try {
      const updatable = insertOrganizationSchema.partial().omit({ userId: true }).parse(req.body);
      const [updated] = await db.update(organizations).set({ ...updatable, updatedAt: new Date() }).where(eq(organizations.id, org.id)).returning();
      // Mission/focus/geography changed → invalidate cached fit scores.
      const scoreRelevant = ["missionText", "capabilityStatementText", "focusAreas", "populationsServed", "state", "counties", "budgetRange"];
      if (scoreRelevant.some(k => k in updatable)) {
        invalidateOrgScores(org.id).catch(e => console.error("[org-profile] invalidate failed:", e));
      }
      res.json({ organization: updated });
    } catch (err) {
      console.error("[org-profile] update failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // Track / pursue a grant for this org.
  app.post("/api/me/grants/:grantId/track", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    try {
      const parsed = insertGrantOrgTrackingSchema.parse({ ...req.body, orgId: org.id, grantId });
      const [row] = await db.insert(grantOrgTracking).values(parsed).onConflictDoUpdate({
        target: [grantOrgTracking.orgId, grantOrgTracking.grantId],
        set: { ...parsed, updatedAt: new Date() },
      }).returning();
      res.json({ tracking: row });
    } catch (err) {
      console.error("[org-profile] track failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // Update tracking status (decision, awarded, declined).
  app.patch("/api/me/grants/:grantId/track", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    try {
      const updatable = insertGrantOrgTrackingSchema.partial().omit({ orgId: true, grantId: true }).parse(req.body);
      const [row] = await db.update(grantOrgTracking).set({ ...updatable, updatedAt: new Date() })
        .where(and(eq(grantOrgTracking.orgId, org.id), eq(grantOrgTracking.grantId, grantId))).returning();
      if (!row) return res.status(404).json({ error: "Not tracking this grant" });
      res.json({ tracking: row });
    } catch (err) {
      console.error("[org-profile] tracking update failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // Untrack.
  app.delete("/api/me/grants/:grantId/track", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    await db.delete(grantOrgTracking).where(and(eq(grantOrgTracking.orgId, org.id), eq(grantOrgTracking.grantId, grantId)));
    res.json({ ok: true });
  });

  // List my tracked grants (joined with grant metadata).
  app.get("/api/me/grants/tracked", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const rows = await db.select({
      tracking: grantOrgTracking,
      grant: grantOpportunities,
    }).from(grantOrgTracking)
      .innerJoin(grantOpportunities, eq(grantOpportunities.id, grantOrgTracking.grantId))
      .where(eq(grantOrgTracking.orgId, org.id))
      .orderBy(desc(grantOrgTracking.updatedAt));
    res.json({ tracked: rows });
  });

  // Win-rate summary.
  app.get("/api/me/grants/win-rate", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const rows = await db.select().from(grantOrgTracking).where(eq(grantOrgTracking.orgId, org.id));
    const submitted = rows.filter(r => ["submitted", "awarded", "declined"].includes(r.status)).length;
    const awarded = rows.filter(r => r.status === "awarded").length;
    const declined = rows.filter(r => r.status === "declined").length;
    const pending = rows.filter(r => ["interested", "pursuing", "drafting", "submitted"].includes(r.status)).length;
    const awardAmount = rows.filter(r => r.status === "awarded").reduce((sum, r) => sum + (r.awardAmount ?? 0), 0);
    const winRate = submitted > 0 ? Math.round((awarded / submitted) * 100) : 0;
    res.json({
      summary: {
        totalTracked: rows.length,
        submitted, awarded, declined, pending,
        awardAmount,
        winRatePct: winRate,
      },
    });
  });
}
