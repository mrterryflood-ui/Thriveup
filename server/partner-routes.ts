import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  communityPartners, partnerReferrals, partnerEngagements,
  mouDocuments, ambassadorProfiles,
  insertCommunityPartnerSchema, insertPartnerReferralSchema,
  insertPartnerEngagementSchema, insertMouDocumentSchema,
  insertAmbassadorProfileSchema,
  type InsertPartnerEngagement, type InsertMouDocument, type InsertAmbassadorProfile,
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
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
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const partnerCreateSchema = insertCommunityPartnerSchema.pick({
  name: true, type: true, description: true, contactName: true,
  contactEmail: true, contactPhone: true, address: true, city: true,
  state: true, zipCode: true, website: true, serviceArea: true,
  serviceCategories: true,
}).extend({
  programsOffered: z.array(z.string()).optional(),
  facilitiesAvailable: z.array(z.string()).optional(),
  capacity: z.number().optional(),
  hiringCommitments: z.number().optional(),
});

const partnerUpdateSchema = partnerCreateSchema.partial().extend({
  isVerified: z.boolean().optional(),
  mouStatus: z.enum(["none", "pending", "active", "expired"]).optional(),
  hiringCommitments: z.number().optional(),
  hiringFulfilled: z.number().optional(),
  diversionReferrals: z.number().optional(),
  volunteerCount: z.number().optional(),
  totalVolunteerHours: z.number().optional(),
  eventsHosted: z.number().optional(),
  participantsServed: z.number().optional(),
  resourcesDistributed: z.number().optional(),
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

const engagementCreateSchema = z.object({
  partnerId: z.string(),
  engagementType: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  volunteerHours: z.number().optional().nullable(),
  participantsServed: z.number().optional().nullable(),
  resourcesDistributed: z.number().optional().nullable(),
  facilityShared: z.boolean().optional().nullable(),
  facilityDetails: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  impactNotes: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});

const mouCreateSchema = z.object({
  partnerId: z.string(),
  title: z.string(),
  status: z.enum(["draft", "sent", "signed", "active", "expired"]).optional(),
  terms: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  signatoryName: z.string().optional().nullable(),
  signatoryTitle: z.string().optional().nullable(),
  signedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});

const mouUpdateSchema = mouCreateSchema.partial();

const ambassadorCreateSchema = z.object({
  name: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional(),
  assignedCommunity: z.string().optional().nullable(),
  assignedRegion: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  specializations: z.array(z.string()).optional().nullable(),
  partnerIds: z.array(z.string()).optional().nullable(),
});

const ambassadorUpdateSchema = ambassadorCreateSchema.partial().extend({
  status: z.enum(["invited", "onboarding", "active", "inactive"]).optional(),
});

const SERVICE_CAPABILITY_CATEGORIES = [
  "mental health", "substance abuse", "housing", "employment",
  "education", "legal aid", "healthcare", "food assistance",
  "transportation", "mentoring", "youth development", "family services",
  "financial coaching", "faith-based services",
];

function getPartnerServiceCapabilities(partner: { type: string; serviceCategories: string[] | null }): Set<string> {
  const capabilities = new Set<string>();
  const typeMap: Record<string, string[]> = {
    "Mental Health Services": ["mental health"],
    "Substance Abuse Treatment": ["substance abuse"],
    "Housing Authority": ["housing"],
    "Employer": ["employment"],
    "School/Education": ["education"],
    "Legal Aid": ["legal aid"],
    "Healthcare Provider": ["healthcare"],
    "Food Assistance": ["food assistance"],
    "Transportation": ["transportation"],
    "Mentoring Program": ["mentoring"],
    "Youth Development": ["youth development"],
    "Family Services": ["family services"],
    "Financial Coaching": ["financial coaching"],
    "Church/Faith-Based": ["faith-based services"],
    "Community Organization": [],
    "Law Enforcement": [],
    "Community Policing Commission": [],
    "Recidivism Prevention Task Force": [],
  };
  const mapped = typeMap[partner.type];
  if (mapped) mapped.forEach(c => capabilities.add(c));

  if (partner.serviceCategories) {
    for (const cat of partner.serviceCategories) {
      const lower = cat.toLowerCase();
      for (const svc of SERVICE_CAPABILITY_CATEGORIES) {
        if (lower.includes(svc) || svc.includes(lower)) {
          capabilities.add(svc);
        }
      }
    }
  }
  return capabilities;
}

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

  app.get("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [partner] = await db.select().from(communityPartners).where(eq(communityPartners.id, id));
      if (!partner) return res.status(404).json({ error: "Partner not found" });
      const referrals = await db.select().from(partnerReferrals).where(eq(partnerReferrals.partnerId, partner.id)).orderBy(desc(partnerReferrals.createdAt));
      const engagements = await db.select().from(partnerEngagements).where(eq(partnerEngagements.partnerId, partner.id)).orderBy(desc(partnerEngagements.createdAt));
      const mous = await db.select().from(mouDocuments).where(eq(mouDocuments.partnerId, partner.id)).orderBy(desc(mouDocuments.createdAt));
      res.json({ ...partner, referrals, engagements, mous });
    } catch (error) {
      console.error("Failed to fetch partner:", error);
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });

  app.patch("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const parsed = partnerUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      const [updated] = await db.update(communityPartners).set(updateData).where(eq(communityPartners.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update partner:", error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      await db.delete(communityPartners).where(eq(communityPartners.id, id));
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
      const id = req.params.id as string;
      const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.completedDate) {
        updateData.completedDate = new Date(parsed.data.completedDate);
      }
      const [updated] = await db.update(partnerReferrals).set(updateData).where(eq(partnerReferrals.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update referral:", error);
      res.status(500).json({ error: "Failed to update referral" });
    }
  });

  app.get("/api/partner-engagements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const partnerId = req.query.partnerId as string | undefined;
      let results;
      if (partnerId) {
        results = await db.select().from(partnerEngagements).where(eq(partnerEngagements.partnerId, partnerId)).orderBy(desc(partnerEngagements.createdAt));
      } else {
        results = await db.select().from(partnerEngagements).orderBy(desc(partnerEngagements.createdAt));
      }
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch engagements:", error);
      res.status(500).json({ error: "Failed to fetch engagements" });
    }
  });

  app.post("/api/partner-engagements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = engagementCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid engagement data", details: parsed.error.flatten().fieldErrors });
      const insertData: InsertPartnerEngagement = {
        partnerId: parsed.data.partnerId,
        engagementType: parsed.data.engagementType,
        title: parsed.data.title,
        description: parsed.data.description ?? undefined,
        eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : undefined,
        volunteerHours: parsed.data.volunteerHours ?? undefined,
        participantsServed: parsed.data.participantsServed ?? undefined,
        resourcesDistributed: parsed.data.resourcesDistributed ?? undefined,
        facilityShared: parsed.data.facilityShared ?? undefined,
        facilityDetails: parsed.data.facilityDetails ?? undefined,
        category: parsed.data.category ?? undefined,
        impactNotes: parsed.data.impactNotes ?? undefined,
        createdBy: parsed.data.createdBy ?? undefined,
      };
      const [engagement] = await db.insert(partnerEngagements).values(insertData).returning();
      res.json(engagement);
    } catch (error) {
      console.error("Failed to create engagement:", error);
      res.status(500).json({ error: "Failed to create engagement" });
    }
  });

  app.get("/api/mou-documents", requireAuth, requireAdmin, async (req, res) => {
    try {
      const partnerId = req.query.partnerId as string | undefined;
      let results;
      if (partnerId) {
        results = await db.select().from(mouDocuments).where(eq(mouDocuments.partnerId, partnerId)).orderBy(desc(mouDocuments.createdAt));
      } else {
        results = await db.select().from(mouDocuments).orderBy(desc(mouDocuments.createdAt));
      }
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch MOU documents:", error);
      res.status(500).json({ error: "Failed to fetch MOU documents" });
    }
  });

  app.post("/api/mou-documents", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = mouCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid MOU data", details: parsed.error.flatten().fieldErrors });
      const insertData: InsertMouDocument = {
        partnerId: parsed.data.partnerId,
        title: parsed.data.title,
        status: parsed.data.status ?? "draft",
        terms: parsed.data.terms ?? undefined,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        renewalDate: parsed.data.renewalDate ? new Date(parsed.data.renewalDate) : undefined,
        signatoryName: parsed.data.signatoryName ?? undefined,
        signatoryTitle: parsed.data.signatoryTitle ?? undefined,
        signedDate: parsed.data.signedDate ? new Date(parsed.data.signedDate) : undefined,
        notes: parsed.data.notes ?? undefined,
        createdBy: parsed.data.createdBy ?? undefined,
      };
      const [mou] = await db.insert(mouDocuments).values(insertData).returning();
      res.json(mou);
    } catch (error) {
      console.error("Failed to create MOU:", error);
      res.status(500).json({ error: "Failed to create MOU" });
    }
  });

  app.patch("/api/mou-documents/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = mouUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid MOU update", details: parsed.error.flatten().fieldErrors });
      const updateData: Partial<InsertMouDocument> & { updatedAt: Date } = { updatedAt: new Date() };
      if (parsed.data.partnerId !== undefined) updateData.partnerId = parsed.data.partnerId;
      if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
      if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
      if (parsed.data.terms !== undefined) updateData.terms = parsed.data.terms ?? undefined;
      if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
      if (parsed.data.endDate !== undefined) updateData.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;
      if (parsed.data.renewalDate !== undefined) updateData.renewalDate = parsed.data.renewalDate ? new Date(parsed.data.renewalDate) : undefined;
      if (parsed.data.signatoryName !== undefined) updateData.signatoryName = parsed.data.signatoryName ?? undefined;
      if (parsed.data.signatoryTitle !== undefined) updateData.signatoryTitle = parsed.data.signatoryTitle ?? undefined;
      if (parsed.data.signedDate !== undefined) updateData.signedDate = parsed.data.signedDate ? new Date(parsed.data.signedDate) : undefined;
      if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes ?? undefined;
      if (parsed.data.createdBy !== undefined) updateData.createdBy = parsed.data.createdBy ?? undefined;
      const [updated] = await db.update(mouDocuments).set(updateData).where(eq(mouDocuments.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update MOU:", error);
      res.status(500).json({ error: "Failed to update MOU" });
    }
  });

  app.get("/api/ambassadors", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const ambassadors = await db.select().from(ambassadorProfiles).orderBy(desc(ambassadorProfiles.createdAt));
      res.json(ambassadors);
    } catch (error) {
      console.error("Failed to fetch ambassadors:", error);
      res.status(500).json({ error: "Failed to fetch ambassadors" });
    }
  });

  app.post("/api/ambassadors", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = ambassadorCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid ambassador data", details: parsed.error.flatten().fieldErrors });
      const insertData: InsertAmbassadorProfile = {
        name: parsed.data.name,
        email: parsed.data.email ?? undefined,
        phone: parsed.data.phone ?? undefined,
        role: parsed.data.role ?? "ambassador",
        assignedCommunity: parsed.data.assignedCommunity ?? undefined,
        assignedRegion: parsed.data.assignedRegion ?? undefined,
        bio: parsed.data.bio ?? undefined,
        specializations: parsed.data.specializations ?? undefined,
        partnerIds: parsed.data.partnerIds ?? undefined,
      };
      const [ambassador] = await db.insert(ambassadorProfiles).values(insertData).returning();
      res.json(ambassador);
    } catch (error) {
      console.error("Failed to create ambassador:", error);
      res.status(500).json({ error: "Failed to create ambassador" });
    }
  });

  app.patch("/api/ambassadors/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = ambassadorUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid ambassador update", details: parsed.error.flatten().fieldErrors });
      const updateData: Partial<InsertAmbassadorProfile> & { updatedAt: Date } = { updatedAt: new Date() };
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
      if (parsed.data.email !== undefined) updateData.email = parsed.data.email ?? undefined;
      if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone ?? undefined;
      if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
      if (parsed.data.assignedCommunity !== undefined) updateData.assignedCommunity = parsed.data.assignedCommunity ?? undefined;
      if (parsed.data.assignedRegion !== undefined) updateData.assignedRegion = parsed.data.assignedRegion ?? undefined;
      if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio ?? undefined;
      if (parsed.data.specializations !== undefined) updateData.specializations = parsed.data.specializations ?? undefined;
      if (parsed.data.partnerIds !== undefined) updateData.partnerIds = parsed.data.partnerIds ?? undefined;
      if (parsed.data.status !== undefined) {
        updateData.status = parsed.data.status;
        if (parsed.data.status === "active") {
          updateData.onboardedAt = new Date();
        }
      }
      const [updated] = await db.update(ambassadorProfiles).set(updateData).where(eq(ambassadorProfiles.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update ambassador:", error);
      res.status(500).json({ error: "Failed to update ambassador" });
    }
  });

  app.delete("/api/ambassadors/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(ambassadorProfiles).where(eq(ambassadorProfiles.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete ambassador:", error);
      res.status(500).json({ error: "Failed to delete ambassador" });
    }
  });

  app.get("/api/partners/dashboard/impact", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const partners = await db.select().from(communityPartners);
      const referrals = await db.select().from(partnerReferrals);
      const engagements = await db.select().from(partnerEngagements);
      const mous = await db.select().from(mouDocuments);
      const ambassadors = await db.select().from(ambassadorProfiles);

      const totalVolunteerHours = engagements.reduce((s, e) => s + (e.volunteerHours || 0), 0);
      const totalParticipantsServed = engagements.reduce((s, e) => s + (e.participantsServed || 0), 0);
      const totalResourcesDistributed = engagements.reduce((s, e) => s + (e.resourcesDistributed || 0), 0);

      const partnersByType: Record<string, number> = {};
      for (const p of partners) {
        partnersByType[p.type] = (partnersByType[p.type] || 0) + 1;
      }

      const partnerStats = partners.map(p => {
        const pReferrals = referrals.filter(r => r.partnerId === p.id);
        const pEngagements = engagements.filter(e => e.partnerId === p.id);
        return {
          partnerId: p.id, partnerName: p.name, type: p.type,
          totalReferrals: pReferrals.length,
          completed: pReferrals.filter(r => r.status === "completed").length,
          pending: pReferrals.filter(r => r.status === "pending").length,
          active: pReferrals.filter(r => r.status === "active").length,
          completionRate: pReferrals.length > 0 ? Math.round((pReferrals.filter(r => r.status === "completed").length / pReferrals.length) * 100) : 0,
          mouStatus: p.mouStatus, isVerified: p.isVerified,
          volunteerHours: pEngagements.reduce((s, e) => s + (e.volunteerHours || 0), 0),
          eventsHosted: pEngagements.length,
          participantsServed: pEngagements.reduce((s, e) => s + (e.participantsServed || 0), 0),
          hiringCommitments: p.hiringCommitments || 0,
          hiringFulfilled: p.hiringFulfilled || 0,
          diversionReferrals: p.diversionReferrals || 0,
        };
      });

      res.json({
        totalPartners: partners.length,
        verifiedPartners: partners.filter(p => p.isVerified).length,
        withMOU: partners.filter(p => p.mouStatus === "active").length,
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter(r => r.status === "completed").length,
        totalEngagements: engagements.length,
        totalVolunteerHours,
        totalParticipantsServed,
        totalResourcesDistributed,
        activeMOUs: mous.filter(m => m.status === "active" || m.status === "signed").length,
        pendingMOUs: mous.filter(m => m.status === "draft" || m.status === "sent").length,
        expiringMOUs: mous.filter(m => {
          if (!m.endDate) return false;
          const daysUntilExpiry = (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
        }).length,
        activeAmbassadors: ambassadors.filter(a => a.status === "active").length,
        totalAmbassadors: ambassadors.length,
        partnersByType,
        partnerStats,
      });
    } catch (error) {
      console.error("Failed to fetch impact:", error);
      res.status(500).json({ error: "Failed to fetch impact data" });
    }
  });

  app.get("/api/partners/dashboard/coordination", requireAuth, requireAdmin, async (req, res) => {
    try {
      const community = req.query.community as string | undefined;
      let partners = await db.select().from(communityPartners).where(eq(communityPartners.isActive, true));
      if (community) {
        partners = partners.filter(p => p.city?.toLowerCase() === community.toLowerCase() || p.serviceArea?.toLowerCase().includes(community.toLowerCase()));
      }
      const referrals = await db.select().from(partnerReferrals);
      const engagements = await db.select().from(partnerEngagements);
      const ambassadors = await db.select().from(ambassadorProfiles);

      const coveredCapabilities = new Set<string>();
      for (const p of partners) {
        const caps = getPartnerServiceCapabilities(p);
        caps.forEach(c => coveredCapabilities.add(c));
      }

      const serviceGaps: string[] = [];
      for (const svc of SERVICE_CAPABILITY_CATEGORIES) {
        if (!coveredCapabilities.has(svc)) serviceGaps.push(svc);
      }

      const coordinationData = partners.map(p => {
        const pRefs = referrals.filter(r => r.partnerId === p.id);
        const pEngs = engagements.filter(e => e.partnerId === p.id);
        return {
          id: p.id, name: p.name, type: p.type,
          city: p.city, state: p.state,
          isVerified: p.isVerified, mouStatus: p.mouStatus,
          services: p.serviceCategories || [],
          referralCount: pRefs.length,
          completedReferrals: pRefs.filter(r => r.status === "completed").length,
          engagementCount: pEngs.length,
          volunteerHours: pEngs.reduce((s, e) => s + (e.volunteerHours || 0), 0),
          participantsServed: pEngs.reduce((s, e) => s + (e.participantsServed || 0), 0),
          programsOffered: p.programsOffered || [],
          capacity: p.capacity,
        };
      });

      const communityAmbassadors = community
        ? ambassadors.filter(a => a.assignedCommunity?.toLowerCase() === community.toLowerCase())
        : ambassadors.filter(a => a.status === "active");

      res.json({
        partners: coordinationData,
        serviceGaps,
        ambassadors: communityAmbassadors,
        summary: {
          totalPartners: coordinationData.length,
          totalReferrals: coordinationData.reduce((s, p) => s + p.referralCount, 0),
          totalEngagements: coordinationData.reduce((s, p) => s + p.engagementCount, 0),
          totalVolunteerHours: coordinationData.reduce((s, p) => s + p.volunteerHours, 0),
          totalParticipantsServed: coordinationData.reduce((s, p) => s + p.participantsServed, 0),
          serviceTypesCovered: coveredCapabilities.size,
          serviceGapsCount: serviceGaps.length,
        },
      });
    } catch (error) {
      console.error("Failed to fetch coordination data:", error);
      res.status(500).json({ error: "Failed to fetch coordination data" });
    }
  });

  app.get("/api/partners/dashboard/collective-impact", requireAuth, requireAdmin, async (req, res) => {
    try {
      const region = req.query.region as string | undefined;
      let partners = await db.select().from(communityPartners).where(eq(communityPartners.isActive, true));
      if (region) {
        partners = partners.filter(p => p.city?.toLowerCase() === region.toLowerCase() || p.state?.toLowerCase() === region.toLowerCase());
      }
      const partnerIds = partners.map(p => p.id);
      const allReferrals = await db.select().from(partnerReferrals);
      const allEngagements = await db.select().from(partnerEngagements);
      const allMous = await db.select().from(mouDocuments);

      const referrals = allReferrals.filter(r => partnerIds.includes(r.partnerId));
      const engagements = allEngagements.filter(e => partnerIds.includes(e.partnerId));
      const mous = allMous.filter(m => partnerIds.includes(m.partnerId));

      const serviceBreakdown: Record<string, { partners: number; referrals: number; completed: number }> = {};
      for (const p of partners) {
        if (!serviceBreakdown[p.type]) serviceBreakdown[p.type] = { partners: 0, referrals: 0, completed: 0 };
        serviceBreakdown[p.type].partners++;
        const pRefs = referrals.filter(r => r.partnerId === p.id);
        serviceBreakdown[p.type].referrals += pRefs.length;
        serviceBreakdown[p.type].completed += pRefs.filter(r => r.status === "completed").length;
      }

      const engagementsByType: Record<string, { count: number; volunteerHours: number; participantsServed: number }> = {};
      for (const e of engagements) {
        const t = e.engagementType || "Other";
        if (!engagementsByType[t]) engagementsByType[t] = { count: 0, volunteerHours: 0, participantsServed: 0 };
        engagementsByType[t].count++;
        engagementsByType[t].volunteerHours += e.volunteerHours || 0;
        engagementsByType[t].participantsServed += e.participantsServed || 0;
      }

      const totalHiringCommitments = partners.reduce((s, p) => s + (p.hiringCommitments || 0), 0);
      const totalHiringFulfilled = partners.reduce((s, p) => s + (p.hiringFulfilled || 0), 0);
      const totalDiversionReferrals = partners.reduce((s, p) => s + (p.diversionReferrals || 0), 0);

      res.json({
        reportTitle: "Collective Impact Report",
        generatedAt: new Date().toISOString(),
        region: region || "All Regions",
        overview: {
          totalPartners: partners.length,
          verifiedPartners: partners.filter(p => p.isVerified).length,
          activeMOUs: mous.filter(m => m.status === "active" || m.status === "signed").length,
          serviceTypesCovered: new Set(partners.map(p => p.type)).size,
        },
        referralOutcomes: {
          totalReferrals: referrals.length,
          completedReferrals: referrals.filter(r => r.status === "completed").length,
          activeReferrals: referrals.filter(r => r.status === "active").length,
          completionRate: referrals.length > 0 ? Math.round((referrals.filter(r => r.status === "completed").length / referrals.length) * 100) : 0,
          uniqueParticipants: new Set(referrals.map(r => r.userId)).size,
        },
        communityEngagement: {
          totalEngagements: engagements.length,
          totalVolunteerHours: engagements.reduce((s, e) => s + (e.volunteerHours || 0), 0),
          totalParticipantsServed: engagements.reduce((s, e) => s + (e.participantsServed || 0), 0),
          totalResourcesDistributed: engagements.reduce((s, e) => s + (e.resourcesDistributed || 0), 0),
          facilitySharedEvents: engagements.filter(e => e.facilityShared).length,
          engagementsByType,
        },
        employmentImpact: {
          totalHiringCommitments,
          totalHiringFulfilled,
          fulfillmentRate: totalHiringCommitments > 0 ? Math.round((totalHiringFulfilled / totalHiringCommitments) * 100) : 0,
        },
        justiceImpact: {
          totalDiversionReferrals,
        },
        serviceBreakdown,
      });
    } catch (error) {
      console.error("Failed to generate collective impact report:", error);
      res.status(500).json({ error: "Failed to generate collective impact report" });
    }
  });
}
