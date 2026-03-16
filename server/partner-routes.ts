import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { communityPartners, partnerReferrals } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as any).user;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

export function registerPartnerRoutes(app: Express) {
  app.get("/api/partners", requireAuth, async (_req, res) => {
    try {
      const partners = await db.select().from(communityPartners).orderBy(desc(communityPartners.createdAt));
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/partners", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [partner] = await db.insert(communityPartners).values(req.body).returning();
      res.json(partner);
    } catch (error) {
      res.status(500).json({ error: "Failed to create partner" });
    }
  });

  app.get("/api/partners/:id", requireAuth, async (req, res) => {
    try {
      const [partner] = await db.select().from(communityPartners).where(eq(communityPartners.id, req.params.id));
      if (!partner) return res.status(404).json({ error: "Partner not found" });
      const referrals = await db.select().from(partnerReferrals).where(eq(partnerReferrals.partnerId, partner.id)).orderBy(desc(partnerReferrals.createdAt));
      res.json({ ...partner, referrals });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });

  app.patch("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(communityPartners).set({ ...req.body, updatedAt: new Date() }).where(eq(communityPartners.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(communityPartners).where(eq(communityPartners.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete partner" });
    }
  });

  app.get("/api/partner-referrals", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const referrals = await db.select().from(partnerReferrals).orderBy(desc(partnerReferrals.createdAt));
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.post("/api/partner-referrals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [referral] = await db.insert(partnerReferrals).values(req.body).returning();
      res.json(referral);
    } catch (error) {
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.patch("/api/partner-referrals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(partnerReferrals).set({ ...req.body, updatedAt: new Date() }).where(eq(partnerReferrals.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update referral" });
    }
  });

  app.get("/api/partners/dashboard/impact", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const partners = await db.select().from(communityPartners);
      const referrals = await db.select().from(partnerReferrals);

      const partnerStats = partners.map(p => {
        const pReferrals = referrals.filter(r => r.partnerId === p.id);
        return {
          partnerId: p.id,
          partnerName: p.name,
          type: p.type,
          totalReferrals: pReferrals.length,
          completed: pReferrals.filter(r => r.status === "completed").length,
          pending: pReferrals.filter(r => r.status === "pending").length,
          active: pReferrals.filter(r => r.status === "active").length,
          completionRate: pReferrals.length > 0 ? Math.round((pReferrals.filter(r => r.status === "completed").length / pReferrals.length) * 100) : 0,
          mouStatus: p.mouStatus,
          isVerified: p.isVerified,
        };
      });

      res.json({
        totalPartners: partners.length,
        verifiedPartners: partners.filter(p => p.isVerified).length,
        activePartners: partners.filter(p => p.isActive).length,
        withMOU: partners.filter(p => p.mouStatus === "active").length,
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter(r => r.status === "completed").length,
        partnerStats,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partner impact" });
    }
  });
}
