import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  communityPartners, partnerReferrals,
  insertCommunityPartnerSchema, insertPartnerReferralSchema,
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
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

const partnerCreateSchema = insertCommunityPartnerSchema.pick({
  name: true, type: true, description: true, contactName: true,
  contactEmail: true, contactPhone: true, address: true, city: true,
  state: true, zipCode: true, website: true, serviceArea: true,
  serviceCategories: true,
});

const partnerUpdateSchema = partnerCreateSchema.partial().extend({
  isVerified: z.boolean().optional(),
  mouStatus: z.enum(["none", "pending", "active", "expired"]).optional(),
});

const referralCreateSchema = insertPartnerReferralSchema.pick({
  partnerId: true, userId: true, serviceType: true, notes: true,
  referredBy: true,
});

const referralUpdateSchema = z.object({
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  partnerNotes: z.string().optional(),
  outcomeStatus: z.string().optional(),
  completedDate: z.string().optional(),
});

export function registerPartnerRoutes(app: Express) {
  app.get("/api/partners", requireAuth, async (_req, res) => {
    try {
      const partners = await db.select().from(communityPartners).orderBy(desc(communityPartners.createdAt));
      res.json(partners);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/partners", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = partnerCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid partner data", details: parsed.error.flatten().fieldErrors });
      const [partner] = await db.insert(communityPartners).values(parsed.data).returning();
      res.json(partner);
    } catch (error) {
      console.error("Failed to create partner:", error);
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
      console.error("Failed to fetch partner:", error);
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });

  app.patch("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = partnerUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const [updated] = await db.update(communityPartners).set({ ...parsed.data, updatedAt: new Date() }).where(eq(communityPartners.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update partner:", error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(communityPartners).where(eq(communityPartners.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete partner:", error);
      res.status(500).json({ error: "Failed to delete partner" });
    }
  });

  app.get("/api/partner-referrals", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const referrals = await db.select().from(partnerReferrals).orderBy(desc(partnerReferrals.createdAt));
      res.json(referrals);
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.post("/api/partner-referrals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = referralCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid referral data", details: parsed.error.flatten().fieldErrors });
      const [referral] = await db.insert(partnerReferrals).values(parsed.data).returning();
      res.json(referral);
    } catch (error) {
      console.error("Failed to create referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.patch("/api/partner-referrals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = referralUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const [updated] = await db.update(partnerReferrals).set({ ...parsed.data, updatedAt: new Date() }).where(eq(partnerReferrals.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update referral:", error);
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
          partnerId: p.id, partnerName: p.name, type: p.type,
          totalReferrals: pReferrals.length,
          completed: pReferrals.filter(r => r.status === "completed").length,
          pending: pReferrals.filter(r => r.status === "pending").length,
          active: pReferrals.filter(r => r.status === "active").length,
          completionRate: pReferrals.length > 0 ? Math.round((pReferrals.filter(r => r.status === "completed").length / pReferrals.length) * 100) : 0,
          mouStatus: p.mouStatus, isVerified: p.isVerified,
        };
      });
      res.json({
        totalPartners: partners.length,
        verifiedPartners: partners.filter(p => p.isVerified).length,
        withMOU: partners.filter(p => p.mouStatus === "active").length,
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter(r => r.status === "completed").length,
        partnerStats,
      });
    } catch (error) {
      console.error("Failed to fetch impact:", error);
      res.status(500).json({ error: "Failed to fetch impact data" });
    }
  });
}
