import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  communityPartners, partnerReferrals, partnerEngagements, mouDocuments,
  partnershipRequests, sharedOutcomes, externalWarmHandoffs,
  insertPartnershipRequestSchema, insertSharedOutcomeSchema, insertExternalWarmHandoffSchema,
  insertCommunityPartnerSchema,
} from "@shared/schema";
import { eq, desc, sql, and, ilike, or, count } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated?.() && !(req as any).user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function registerCollaborationRoutes(app: Express) {

  app.get("/api/collaboration/partners", async (_req, res) => {
    try {
      const { search, category, status } = _req.query;
      let query = db.select().from(communityPartners).orderBy(desc(communityPartners.createdAt)).$dynamic();
      const partners = await query;
      let filtered = partners;
      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.city?.toLowerCase().includes(s) ||
          p.serviceCategories?.some(c => c.toLowerCase().includes(s))
        );
      }
      if (category && typeof category === "string" && category !== "all") {
        filtered = filtered.filter(p => p.type === category || p.serviceCategories?.includes(category));
      }
      if (status && typeof status === "string" && status !== "all") {
        if (status === "verified") filtered = filtered.filter(p => p.isVerified);
        else if (status === "mou_active") filtered = filtered.filter(p => p.mouStatus === "active");
        else if (status === "active") filtered = filtered.filter(p => p.isActive);
      }
      res.json(filtered);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/collaboration/partners/:id", async (req, res) => {
    try {
      const [partner] = await db.select().from(communityPartners).where(eq(communityPartners.id, req.params.id));
      if (!partner) return res.status(404).json({ error: "Partner not found" });
      const referrals = await db.select().from(partnerReferrals).where(eq(partnerReferrals.partnerId, req.params.id)).orderBy(desc(partnerReferrals.createdAt));
      const engagements = await db.select().from(partnerEngagements).where(eq(partnerEngagements.partnerId, req.params.id)).orderBy(desc(partnerEngagements.createdAt));
      const outcomes = await db.select().from(sharedOutcomes).where(eq(sharedOutcomes.partnerId, req.params.id));
      const handoffs = await db.select().from(externalWarmHandoffs).where(eq(externalWarmHandoffs.partnerId, req.params.id)).orderBy(desc(externalWarmHandoffs.createdAt));
      const mous = await db.select().from(mouDocuments).where(eq(mouDocuments.partnerId, req.params.id));
      res.json({ partner, referrals, engagements, outcomes, handoffs, mous });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/collaboration/partners", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommunityPartnerSchema.parse(req.body);
      const [partner] = await db.insert(communityPartners).values(parsed).returning();
      res.json(partner);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/collaboration/partners/:id", requireAuth, async (req, res) => {
    try {
      const [partner] = await db.update(communityPartners)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(communityPartners.id, req.params.id))
        .returning();
      res.json(partner);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/collaboration/partnership-requests", async (_req, res) => {
    try {
      const requests = await db.select().from(partnershipRequests).orderBy(desc(partnershipRequests.createdAt));
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/collaboration/partnership-requests", requireAuth, async (req, res) => {
    try {
      const parsed = insertPartnershipRequestSchema.parse(req.body);
      const [request] = await db.insert(partnershipRequests).values(parsed).returning();
      res.json(request);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/collaboration/partnership-requests/:id", requireAuth, async (req, res) => {
    try {
      const updates: any = { ...req.body };
      if (req.body.status === "approved" || req.body.status === "declined") {
        updates.reviewedAt = new Date();
      }
      const [request] = await db.update(partnershipRequests)
        .set(updates)
        .where(eq(partnershipRequests.id, req.params.id))
        .returning();
      res.json(request);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/collaboration/partnership-requests/:id/convert", requireAuth, async (req, res) => {
    try {
      const [request] = await db.select().from(partnershipRequests).where(eq(partnershipRequests.id, req.params.id));
      if (!request) return res.status(404).json({ error: "Request not found" });
      const [partner] = await db.insert(communityPartners).values({
        name: request.organizationName,
        type: request.organizationType,
        description: request.mission,
        contactName: request.contactName,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
        website: request.website,
        serviceCategories: request.focusAreas,
        serviceArea: request.geographicArea,
        isVerified: false,
        isActive: true,
        mouStatus: "none",
      }).returning();
      await db.update(partnershipRequests)
        .set({ status: "onboarded", convertedPartnerId: partner.id })
        .where(eq(partnershipRequests.id, req.params.id));
      res.json(partner);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/collaboration/shared-outcomes", async (req, res) => {
    try {
      const { partnerId } = req.query;
      let outcomes;
      if (partnerId && typeof partnerId === "string") {
        outcomes = await db.select().from(sharedOutcomes).where(eq(sharedOutcomes.partnerId, partnerId));
      } else {
        outcomes = await db.select().from(sharedOutcomes).orderBy(desc(sharedOutcomes.createdAt));
      }
      res.json(outcomes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/collaboration/shared-outcomes", requireAuth, async (req, res) => {
    try {
      const parsed = insertSharedOutcomeSchema.parse(req.body);
      const [outcome] = await db.insert(sharedOutcomes).values(parsed).returning();
      res.json(outcome);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/collaboration/shared-outcomes/:id", requireAuth, async (req, res) => {
    try {
      const [outcome] = await db.update(sharedOutcomes)
        .set({ ...req.body, lastReportedAt: new Date() })
        .where(eq(sharedOutcomes.id, req.params.id))
        .returning();
      res.json(outcome);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/collaboration/warm-handoffs", async (req, res) => {
    try {
      const { partnerId, status, direction } = req.query;
      let handoffs = await db.select().from(externalWarmHandoffs).orderBy(desc(externalWarmHandoffs.createdAt));
      if (partnerId && typeof partnerId === "string") {
        handoffs = handoffs.filter(h => h.partnerId === partnerId);
      }
      if (status && typeof status === "string" && status !== "all") {
        handoffs = handoffs.filter(h => h.status === status);
      }
      if (direction && typeof direction === "string" && direction !== "all") {
        handoffs = handoffs.filter(h => h.direction === direction);
      }
      res.json(handoffs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/collaboration/warm-handoffs", requireAuth, async (req, res) => {
    try {
      const parsed = insertExternalWarmHandoffSchema.parse(req.body);
      const [handoff] = await db.insert(externalWarmHandoffs).values(parsed).returning();
      res.json(handoff);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/collaboration/warm-handoffs/:id", requireAuth, async (req, res) => {
    try {
      const updates: any = { ...req.body };
      if (req.body.status === "accepted") updates.acceptedAt = new Date();
      if (req.body.status === "completed") updates.completedAt = new Date();
      const [handoff] = await db.update(externalWarmHandoffs)
        .set(updates)
        .where(eq(externalWarmHandoffs.id, req.params.id))
        .returning();
      res.json(handoff);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/collaboration/stats", async (_req, res) => {
    try {
      const [partnerCount] = await db.select({ count: count() }).from(communityPartners).where(eq(communityPartners.isActive, true));
      const [requestCount] = await db.select({ count: count() }).from(partnershipRequests).where(eq(partnershipRequests.status, "pending"));
      const [outcomeCount] = await db.select({ count: count() }).from(sharedOutcomes).where(eq(sharedOutcomes.status, "active"));
      const [handoffCount] = await db.select({ count: count() }).from(externalWarmHandoffs);
      const [activeHandoffs] = await db.select({ count: count() }).from(externalWarmHandoffs)
        .where(or(eq(externalWarmHandoffs.status, "initiated"), eq(externalWarmHandoffs.status, "accepted")));
      res.json({
        totalPartners: partnerCount?.count || 0,
        pendingRequests: requestCount?.count || 0,
        activeOutcomes: outcomeCount?.count || 0,
        totalHandoffs: handoffCount?.count || 0,
        activeHandoffs: activeHandoffs?.count || 0,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/collaboration/partnership-inquiry", requireAuth, async (req, res) => {
    try {
      const parsed = insertPartnershipRequestSchema.parse({ ...req.body, status: "pending" });
      const [request] = await db.insert(partnershipRequests).values(parsed).returning();
      res.json({ success: true, requestId: request.id, message: "Partnership inquiry submitted. Our team will review and respond within 5 business days." });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}
