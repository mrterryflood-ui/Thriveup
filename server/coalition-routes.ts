import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  coalitions, coalitionSectors, coalitionMembers, coalitionMeetings,
  coalitionActionItems, coalitionCapacityAssessments, communityActionPlans,
  costMatchRecords, communityPartners,
  insertCoalitionSchema, insertCoalitionSectorSchema, insertCoalitionMemberSchema,
  insertCoalitionMeetingSchema, insertCoalitionActionItemSchema,
  insertCoalitionCapacityAssessmentSchema, insertCommunityActionPlanSchema,
  insertCostMatchRecordSchema,
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, and, count } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const SECTOR_PARTNER_TYPE_MAP: Record<number, string[]> = {
  1: ["Youth Development", "Mentoring Program"],
  2: ["Family Services"],
  3: ["Employer"],
  4: ["Community Organization"],
  5: ["School/Education"],
  6: ["Youth Development", "Mentoring Program", "Community Organization"],
  7: ["Law Enforcement", "Community Policing Commission", "Recidivism Prevention Task Force"],
  8: ["Church/Faith-Based"],
  9: ["Community Organization"],
  10: ["Healthcare Provider", "Mental Health Services", "Substance Abuse Treatment"],
  11: ["Community Organization"],
  12: ["Substance Abuse Treatment", "Mental Health Services"],
};

const DFC_SECTORS = [
  { sectorNumber: 1, sectorName: "Youth (Ages 10-18)", description: "Young people between ages 10-18 who are affected by substance abuse in the community" },
  { sectorNumber: 2, sectorName: "Parents", description: "Parents, guardians, and caregivers of youth in the community" },
  { sectorNumber: 3, sectorName: "Business Community", description: "Local business owners and leaders invested in community wellness" },
  { sectorNumber: 4, sectorName: "Media", description: "Local media outlets including newspapers, radio, TV, and digital media" },
  { sectorNumber: 5, sectorName: "School Personnel", description: "Teachers, administrators, counselors, and other school staff" },
  { sectorNumber: 6, sectorName: "Youth-Serving Organizations", description: "Non-profit organizations that provide services to youth" },
  { sectorNumber: 7, sectorName: "Law Enforcement", description: "Local police, sheriff departments, and other law enforcement agencies" },
  { sectorNumber: 8, sectorName: "Religious/Fraternal Organizations", description: "Churches, mosques, temples, fraternal orders, and faith-based organizations" },
  { sectorNumber: 9, sectorName: "Civic/Volunteer Groups", description: "Community service clubs, volunteer organizations, and civic associations" },
  { sectorNumber: 10, sectorName: "Healthcare Professionals", description: "Doctors, nurses, pharmacists, mental health professionals, and other healthcare providers" },
  { sectorNumber: 11, sectorName: "State/Local Government", description: "Elected officials, government agencies, and public sector representatives" },
  { sectorNumber: 12, sectorName: "Other Substance Abuse Organizations", description: "Treatment providers, prevention specialists, recovery organizations" },
];

async function seedDefaultCoalition() {
  try {
    const existing = await db.select().from(coalitions);
    if (existing.length > 0) return;
    const [coalition] = await db.insert(coalitions).values({
      name: "ThriveUp Community Coalition",
      mission: "To reduce youth substance abuse through community collaboration, evidence-based prevention strategies, and the empowerment of all 12 community sectors.",
      formationDate: new Date().toISOString().split("T")[0],
      status: "active",
    }).returning();
    for (const sector of DFC_SECTORS) {
      await db.insert(coalitionSectors).values({ coalitionId: coalition.id, ...sector });
    }
    console.log("[coalition] Seeded default coalition with 12 DFC sectors");
  } catch (e) {
    console.error("[coalition] Seed error:", e);
  }
}

export function registerCoalitionRoutes(app: Express) {
  seedDefaultCoalition();

  app.get("/api/coalitions", async (_req, res) => {
    try {
      const results = await db.select().from(coalitions);
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch coalitions:", error);
      res.status(500).json({ error: "Failed to fetch coalitions" });
    }
  });

  app.post("/api/coalitions", requireAuth, async (req, res) => {
    try {
      const parsed = insertCoalitionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [coalition] = await db.insert(coalitions).values(parsed.data).returning();

      for (const sector of DFC_SECTORS) {
        await db.insert(coalitionSectors).values({
          coalitionId: coalition.id,
          ...sector,
        });
      }

      res.json(coalition);
    } catch (error) {
      console.error("Failed to create coalition:", error);
      res.status(500).json({ error: "Failed to create coalition" });
    }
  });

  app.get("/api/coalitions/:id", async (req, res) => {
    try {
      const id = req.params.id as string;
      const [coalition] = await db.select().from(coalitions).where(eq(coalitions.id, id));
      if (!coalition) return res.status(404).json({ error: "Coalition not found" });
      res.json(coalition);
    } catch (error) {
      console.error("Failed to fetch coalition:", error);
      res.status(500).json({ error: "Failed to fetch coalition" });
    }
  });

  app.patch("/api/coalitions/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertCoalitionSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(coalitions).set(allowed.data).where(eq(coalitions.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update coalition:", error);
      res.status(500).json({ error: "Failed to update coalition" });
    }
  });

  app.get("/api/coalitions/:id/sectors", async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const sectors = await db.select().from(coalitionSectors).where(eq(coalitionSectors.coalitionId, coalitionId));
      res.json(sectors);
    } catch (error) {
      console.error("Failed to fetch sectors:", error);
      res.status(500).json({ error: "Failed to fetch sectors" });
    }
  });

  app.patch("/api/coalition-sectors/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertCoalitionSectorSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(coalitionSectors).set(allowed.data).where(eq(coalitionSectors.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update sector:", error);
      res.status(500).json({ error: "Failed to update sector" });
    }
  });

  app.get("/api/coalitions/:id/members", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const members = await db.select().from(coalitionMembers).where(eq(coalitionMembers.coalitionId, coalitionId));
      res.json(members);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  app.post("/api/coalition-members", requireAuth, async (req, res) => {
    try {
      const parsed = insertCoalitionMemberSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [member] = await db.insert(coalitionMembers).values(parsed.data).returning();

      if (parsed.data.sectorId) {
        await db.update(coalitionSectors).set({ isRepresented: true }).where(eq(coalitionSectors.id, parsed.data.sectorId));
      }

      res.json(member);
    } catch (error) {
      console.error("Failed to add member:", error);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  app.delete("/api/coalition-members/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [member] = await db.select().from(coalitionMembers).where(eq(coalitionMembers.id, id));
      await db.delete(coalitionMembers).where(eq(coalitionMembers.id, id));
      if (member?.sectorId) {
        const remaining = await db.select().from(coalitionMembers).where(eq(coalitionMembers.sectorId, member.sectorId));
        if (remaining.length === 0) {
          await db.update(coalitionSectors).set({ isRepresented: false }).where(eq(coalitionSectors.id, member.sectorId));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete member:", error);
      res.status(500).json({ error: "Failed to delete member" });
    }
  });

  app.get("/api/coalitions/:id/meetings", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const meetings = await db.select().from(coalitionMeetings).where(eq(coalitionMeetings.coalitionId, coalitionId));
      res.json(meetings);
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/coalition-meetings", requireAuth, async (req, res) => {
    try {
      const parsed = insertCoalitionMeetingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [meeting] = await db.insert(coalitionMeetings).values(parsed.data).returning();
      res.json(meeting);
    } catch (error) {
      console.error("Failed to create meeting:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.patch("/api/coalition-meetings/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertCoalitionMeetingSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(coalitionMeetings).set(allowed.data).where(eq(coalitionMeetings.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update meeting:", error);
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.get("/api/coalitions/:id/action-items", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const items = await db.select().from(coalitionActionItems).where(eq(coalitionActionItems.coalitionId, coalitionId));
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch action items:", error);
      res.status(500).json({ error: "Failed to fetch action items" });
    }
  });

  app.post("/api/coalition-action-items", requireAuth, async (req, res) => {
    try {
      const parsed = insertCoalitionActionItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [item] = await db.insert(coalitionActionItems).values(parsed.data).returning();
      res.json(item);
    } catch (error) {
      console.error("Failed to create action item:", error);
      res.status(500).json({ error: "Failed to create action item" });
    }
  });

  app.patch("/api/coalition-action-items/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertCoalitionActionItemSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const updateData: Record<string, unknown> = { ...allowed.data };
      if (allowed.data.status === "completed") {
        updateData.completedAt = new Date();
      }
      const [updated] = await db.update(coalitionActionItems).set(updateData).where(eq(coalitionActionItems.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update action item:", error);
      res.status(500).json({ error: "Failed to update action item" });
    }
  });

  app.get("/api/coalitions/:id/capacity-assessments", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const assessments = await db.select().from(coalitionCapacityAssessments)
        .where(eq(coalitionCapacityAssessments.coalitionId, coalitionId))
        .orderBy(desc(coalitionCapacityAssessments.assessedAt));
      res.json(assessments);
    } catch (error) {
      console.error("Failed to fetch capacity assessments:", error);
      res.status(500).json({ error: "Failed to fetch capacity assessments" });
    }
  });

  app.post("/api/coalition-capacity-assessments", requireAuth, async (req, res) => {
    try {
      const parsed = insertCoalitionCapacityAssessmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const data = parsed.data;
      const orgCap = data.organizationalCapacity ?? 0;
      const leadEff = data.leadershipEffectiveness ?? 0;
      const subKnow = data.substanceAbuseKnowledge ?? 0;
      const commEng = data.communityEngagement ?? 0;
      const overallScore = Math.round((orgCap + leadEff + subKnow + commEng) / 4);
      const recommendations: string[] = [];
      if (orgCap < 60) recommendations.push("Strengthen organizational structure and governance processes");
      if (leadEff < 60) recommendations.push("Invest in leadership development and succession planning");
      if (subKnow < 60) recommendations.push("Increase training on substance abuse prevention strategies");
      if (commEng < 60) recommendations.push("Expand community outreach and engagement activities");

      const [assessment] = await db.insert(coalitionCapacityAssessments).values({
        ...data,
        overallScore,
        recommendations,
        assessorId: getUserId(req as Request) || data.assessorId,
      }).returning();
      res.json(assessment);
    } catch (error) {
      console.error("Failed to create capacity assessment:", error);
      res.status(500).json({ error: "Failed to create capacity assessment" });
    }
  });

  app.get("/api/coalitions/:id/action-plans", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const plans = await db.select().from(communityActionPlans)
        .where(eq(communityActionPlans.coalitionId, coalitionId))
        .orderBy(desc(communityActionPlans.createdAt));
      res.json(plans);
    } catch (error) {
      console.error("Failed to fetch action plans:", error);
      res.status(500).json({ error: "Failed to fetch action plans" });
    }
  });

  app.post("/api/coalition-action-plans", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommunityActionPlanSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [plan] = await db.insert(communityActionPlans).values(parsed.data).returning();
      res.json(plan);
    } catch (error) {
      console.error("Failed to create action plan:", error);
      res.status(500).json({ error: "Failed to create action plan" });
    }
  });

  app.patch("/api/coalition-action-plans/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertCommunityActionPlanSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(communityActionPlans).set(allowed.data).where(eq(communityActionPlans.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update action plan:", error);
      res.status(500).json({ error: "Failed to update action plan" });
    }
  });

  app.get("/api/coalitions/:id/cost-match", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const records = await db.select().from(costMatchRecords).where(eq(costMatchRecords.coalitionId, coalitionId));
      res.json(records);
    } catch (error) {
      console.error("Failed to fetch cost match records:", error);
      res.status(500).json({ error: "Failed to fetch cost match records" });
    }
  });

  app.post("/api/coalition-cost-match", requireAuth, async (req, res) => {
    try {
      const parsed = insertCostMatchRecordSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [record] = await db.insert(costMatchRecords).values(parsed.data).returning();
      res.json(record);
    } catch (error) {
      console.error("Failed to create cost match record:", error);
      res.status(500).json({ error: "Failed to create cost match record" });
    }
  });

  app.get("/api/coalitions/:id/dashboard", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const sectors = await db.select().from(coalitionSectors).where(eq(coalitionSectors.coalitionId, coalitionId));
      const members = await db.select().from(coalitionMembers).where(eq(coalitionMembers.coalitionId, coalitionId));
      const meetings = await db.select().from(coalitionMeetings).where(eq(coalitionMeetings.coalitionId, coalitionId));
      const actionItems = await db.select().from(coalitionActionItems).where(eq(coalitionActionItems.coalitionId, coalitionId));
      const assessments = await db.select().from(coalitionCapacityAssessments)
        .where(eq(coalitionCapacityAssessments.coalitionId, coalitionId))
        .orderBy(desc(coalitionCapacityAssessments.assessedAt));
      const costRecords = await db.select().from(costMatchRecords).where(eq(costMatchRecords.coalitionId, coalitionId));
      const plans = await db.select().from(communityActionPlans).where(eq(communityActionPlans.coalitionId, coalitionId));

      const representedSectors = sectors.filter(s => s.isRepresented).length;
      const sectorCoverage = sectors.length > 0 ? Math.round((representedSectors / sectors.length) * 100) : 0;
      const completedMeetings = meetings.filter(m => m.status === "completed").length;
      const latestAssessment = assessments.length > 0 ? assessments[0] : null;
      const totalCostMatch = costRecords.reduce((sum, r) => sum + parseFloat(r.dollarValue || "0"), 0);
      const completedActions = actionItems.filter(a => a.status === "completed").length;

      res.json({
        sectorCoverage,
        representedSectors,
        totalSectors: sectors.length,
        totalMembers: members.length,
        totalMeetings: meetings.length,
        completedMeetings,
        totalActionItems: actionItems.length,
        completedActions,
        latestCapacityScore: latestAssessment?.overallScore ?? 0,
        totalCostMatch,
        totalPlans: plans.length,
        capacityTrend: assessments.slice(0, 5).map(a => ({ score: a.overallScore, date: a.assessedAt })),
      });
    } catch (error) {
      console.error("Failed to fetch coalition dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/coalitions/:id/sector-partner-map", async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const sectors = await db.select().from(coalitionSectors).where(eq(coalitionSectors.coalitionId, coalitionId));
      const allPartners = await db.select().from(communityPartners);

      const sectorMap = sectors.map(sector => {
        const matchedTypes = SECTOR_PARTNER_TYPE_MAP[sector.sectorNumber] || [];
        const suggestedPartners = allPartners.filter(p => matchedTypes.includes(p.type));
        return {
          sectorId: sector.id,
          sectorNumber: sector.sectorNumber,
          sectorName: sector.sectorName,
          isRepresented: sector.isRepresented,
          mappedPartnerTypes: matchedTypes,
          suggestedPartners: suggestedPartners.map(p => ({
            id: p.id, name: p.name, type: p.type, contactName: p.contactName,
          })),
          suggestedCount: suggestedPartners.length,
        };
      });

      const totalCoverage = sectorMap.filter(s => s.isRepresented || s.suggestedCount > 0).length;
      res.json({ sectors: sectorMap, totalSectors: sectors.length, potentialCoverage: totalCoverage, partnerTypeMapping: SECTOR_PARTNER_TYPE_MAP });
    } catch (error) {
      console.error("Failed to fetch sector-partner map:", error);
      res.status(500).json({ error: "Failed to fetch sector-partner map" });
    }
  });

  app.get("/api/coalitions/:id/cost-match-compliance", requireAuth, async (req, res) => {
    try {
      const coalitionId = req.params.id as string;
      const records = await db.select().from(costMatchRecords).where(eq(costMatchRecords.coalitionId, coalitionId));

      let totalCash = 0;
      let totalInKind = 0;
      let totalVolunteerHoursDollars = 0;
      let totalPartnerContributions = 0;
      let totalVolunteerHours = 0;

      for (const r of records) {
        const val = parseFloat(r.dollarValue || "0");
        const hours = parseFloat(r.hoursContributed || "0");
        totalVolunteerHours += hours;
        switch (r.contributionType) {
          case "cash": totalCash += val; break;
          case "in_kind": totalInKind += val; break;
          case "volunteer_hours": totalVolunteerHoursDollars += val; break;
          case "partner_contribution": totalPartnerContributions += val; break;
        }
      }

      const totalMatch = totalCash + totalInKind + totalVolunteerHoursDollars + totalPartnerContributions;
      const dfcGrantAmount = 125000;
      const matchRatio = dfcGrantAmount > 0 ? Math.round((totalMatch / dfcGrantAmount) * 100) : 0;
      const isCompliant = matchRatio >= 100;

      res.json({
        totalMatch,
        totalCash,
        totalInKind,
        totalVolunteerHoursDollars,
        totalVolunteerHours,
        totalPartnerContributions,
        dfcGrantAmount,
        matchRatio,
        isCompliant,
        recordCount: records.length,
        breakdown: {
          cash: { amount: totalCash, pct: totalMatch > 0 ? Math.round((totalCash / totalMatch) * 100) : 0 },
          inKind: { amount: totalInKind, pct: totalMatch > 0 ? Math.round((totalInKind / totalMatch) * 100) : 0 },
          volunteerHours: { amount: totalVolunteerHoursDollars, hours: totalVolunteerHours, pct: totalMatch > 0 ? Math.round((totalVolunteerHoursDollars / totalMatch) * 100) : 0 },
          partnerContributions: { amount: totalPartnerContributions, pct: totalMatch > 0 ? Math.round((totalPartnerContributions / totalMatch) * 100) : 0 },
        },
      });
    } catch (error) {
      console.error("Failed to fetch cost match compliance:", error);
      res.status(500).json({ error: "Failed to fetch cost match compliance" });
    }
  });

  app.post("/api/coalitions/seed-default", requireAuth, async (_req, res) => {
    try {
      const existing = await db.select().from(coalitions);
      if (existing.length > 0) return res.json(existing[0]);

      const [coalition] = await db.insert(coalitions).values({
        name: "ThriveUp Community Coalition",
        mission: "To reduce youth substance abuse through community collaboration, evidence-based prevention strategies, and the empowerment of all 12 community sectors.",
        formationDate: new Date().toISOString().split("T")[0],
        status: "active",
      }).returning();

      for (const sector of DFC_SECTORS) {
        await db.insert(coalitionSectors).values({
          coalitionId: coalition.id,
          ...sector,
        });
      }

      res.json(coalition);
    } catch (error) {
      console.error("Failed to seed coalition:", error);
      res.status(500).json({ error: "Failed to seed coalition" });
    }
  });
}
