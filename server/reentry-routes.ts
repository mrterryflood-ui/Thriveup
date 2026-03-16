import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  reentryPlans, reentryMilestones, reentryIntakeAssessments,
  thriveScores, earlyWarningFlags,
  insertReentryPlanSchema, insertReentryMilestoneSchema, insertReentryIntakeAssessmentSchema,
  participantProfiles, serviceRecords, consentRecords,
  insertParticipantProfileSchema, insertServiceRecordSchema, insertConsentRecordSchema,
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

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

const DEFAULT_MILESTONES: Record<string, Array<{ category: string; title: string; phase: string }>> = {
  pre_release: [
    { category: "education", title: "Complete educational assessment", phase: "pre_release" },
    { category: "employment", title: "Develop employment readiness plan", phase: "pre_release" },
    { category: "housing", title: "Identify transitional housing options", phase: "pre_release" },
    { category: "behavioral_health", title: "Complete behavioral health screening", phase: "pre_release" },
    { category: "community", title: "Identify community support resources", phase: "pre_release" },
  ],
  transition: [
    { category: "education", title: "Enroll in education program", phase: "transition" },
    { category: "employment", title: "Complete job skills training", phase: "transition" },
    { category: "housing", title: "Secure stable housing", phase: "transition" },
    { category: "behavioral_health", title: "Begin counseling sessions", phase: "transition" },
    { category: "community", title: "Connect with assigned mentor", phase: "transition" },
  ],
  stabilization: [
    { category: "education", title: "Maintain education enrollment", phase: "stabilization" },
    { category: "employment", title: "Obtain employment placement", phase: "stabilization" },
    { category: "housing", title: "Maintain housing stability", phase: "stabilization" },
    { category: "behavioral_health", title: "Complete behavioral health program", phase: "stabilization" },
    { category: "community", title: "Regular mentor meetings", phase: "stabilization" },
  ],
  independence: [
    { category: "education", title: "Earn credential or diploma", phase: "independence" },
    { category: "employment", title: "90-day job retention", phase: "independence" },
    { category: "housing", title: "Independent housing achieved", phase: "independence" },
    { category: "behavioral_health", title: "Sustained behavioral health progress", phase: "independence" },
    { category: "community", title: "Community integration assessment", phase: "independence" },
  ],
};

const planCreateSchema = insertReentryPlanSchema.pick({
  userId: true, userName: true, phase: true, riskLevel: true, notes: true,
  releaseDate: true, caseManagerId: true,
});

const planUpdateSchema = z.object({
  phase: z.enum(["pre_release", "transition", "stabilization", "independence"]).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["active", "completed", "paused", "terminated"]).optional(),
  notes: z.string().optional(),
  transitionStartDate: z.string().optional(),
  stabilizationStartDate: z.string().optional(),
  independenceStartDate: z.string().optional(),
});

const milestoneCreateSchema = insertReentryMilestoneSchema.pick({
  planId: true, userId: true, title: true, category: true, phase: true, targetDate: true,
});

const milestoneUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
  completedDate: z.string().optional(),
  notes: z.string().optional(),
});

export function registerReentryRoutes(app: Express) {
  app.get("/api/reentry/plans", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const plans = await db.select().from(reentryPlans).orderBy(desc(reentryPlans.createdAt));
      res.json(plans);
    } catch (error) {
      console.error("Failed to fetch reentry plans:", error);
      res.status(500).json({ error: "Failed to fetch reentry plans" });
    }
  });

  app.post("/api/reentry/plans", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = planCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid plan data", details: parsed.error.flatten().fieldErrors });
      const [plan] = await db.insert(reentryPlans).values(parsed.data).returning();
      const phaseMilestones = DEFAULT_MILESTONES[plan.phase] || DEFAULT_MILESTONES.pre_release;
      for (const m of phaseMilestones) {
        await db.insert(reentryMilestones).values({ planId: plan.id, userId: plan.userId, ...m });
      }
      res.json(plan);
    } catch (error) {
      console.error("Failed to create reentry plan:", error);
      res.status(500).json({ error: "Failed to create reentry plan" });
    }
  });

  app.get("/api/reentry/plans/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      const milestones = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, plan.id));
      const [intake] = await db.select().from(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.planId, plan.id));
      let thriveData = null;
      try {
        const [ts] = await db.select().from(thriveScores).where(eq(thriveScores.userId, plan.userId));
        thriveData = ts || null;
      } catch (thriveErr) { console.error("Thrive score lookup skipped:", thriveErr); }
      res.json({ ...plan, milestones, intake: intake || null, thriveScore: thriveData });
    } catch (error) {
      console.error("Failed to fetch plan:", error);
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  });

  app.patch("/api/reentry/plans/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const parsed = planUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const oldPlan = await db.select().from(reentryPlans).where(eq(reentryPlans.id, id));
      if (!oldPlan.length) return res.status(404).json({ error: "Plan not found" });
      const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      const [updated] = await db.update(reentryPlans).set(updateData).where(eq(reentryPlans.id, id)).returning();
      if (parsed.data.phase && oldPlan[0].phase !== parsed.data.phase) {
        const newMilestones = DEFAULT_MILESTONES[parsed.data.phase] || [];
        for (const m of newMilestones) {
          await db.insert(reentryMilestones).values({ planId: updated.id, userId: updated.userId, ...m });
        }
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  app.get("/api/reentry/plans/:planId/milestones", requireAuth, requireAdmin, async (req, res) => {
    try {
      const planId = req.params.planId as string;
      const milestones = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, planId));
      res.json(milestones);
    } catch (error) {
      console.error("Failed to fetch milestones:", error);
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/reentry/milestones", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = milestoneCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid milestone data", details: parsed.error.flatten().fieldErrors });
      const [milestone] = await db.insert(reentryMilestones).values(parsed.data).returning();
      res.json(milestone);
    } catch (error) {
      console.error("Failed to create milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  app.patch("/api/reentry/milestones/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = milestoneUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid milestone data", details: parsed.error.flatten().fieldErrors });
      const id = req.params.id as string;
      const updateData: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.completedDate) {
        updateData.completedDate = new Date(parsed.data.completedDate);
      }
      const [updated] = await db.update(reentryMilestones).set(updateData).where(eq(reentryMilestones.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  app.post("/api/reentry/intake", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertReentryIntakeAssessmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid intake data", details: parsed.error.flatten().fieldErrors });
      const [assessment] = await db.insert(reentryIntakeAssessments).values(parsed.data).returning();
      res.json(assessment);
    } catch (error) {
      console.error("Failed to create intake assessment:", error);
      res.status(500).json({ error: "Failed to create intake assessment" });
    }
  });

  app.get("/api/reentry/intake/:planId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const planId = req.params.planId as string;
      const [assessment] = await db.select().from(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.planId, planId));
      res.json(assessment || null);
    } catch (error) {
      console.error("Failed to fetch intake assessment:", error);
      res.status(500).json({ error: "Failed to fetch intake assessment" });
    }
  });

  app.get("/api/reentry/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const plans = await db.select().from(reentryPlans).orderBy(desc(reentryPlans.createdAt));
      const allMilestones = await db.select().from(reentryMilestones);
      const phaseCount: Record<string, number> = { pre_release: 0, transition: 0, stabilization: 0, independence: 0 };
      const riskCount: Record<string, number> = { low: 0, medium: 0, high: 0 };
      let activePlans = 0;
      for (const plan of plans) {
        if (plan.status === "active") {
          activePlans++;
          phaseCount[plan.phase] = (phaseCount[plan.phase] || 0) + 1;
          riskCount[plan.riskLevel || "medium"] = (riskCount[plan.riskLevel || "medium"] || 0) + 1;
        }
      }
      const completedMilestones = allMilestones.filter(m => m.status === "completed").length;
      const totalMilestones = allMilestones.length;
      res.json({
        totalPlans: plans.length, activePlans,
        phaseDistribution: phaseCount, riskDistribution: riskCount,
        milestoneCompletion: { completed: completedMilestones, total: totalMilestones, rate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0 },
        recentPlans: plans.slice(0, 10),
      });
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/reentry/plans/:id/report", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      const milestones = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, plan.id));
      const [intake] = await db.select().from(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.planId, plan.id));
      let thriveData = null;
      try {
        const [ts] = await db.select().from(thriveScores).where(eq(thriveScores.userId, plan.userId));
        thriveData = ts || null;
      } catch (thriveErr) { console.error("Thrive score lookup skipped:", thriveErr); }
      const report = {
        generatedAt: new Date().toISOString(),
        reportType: "Court-Ready Progress Report",
        participant: { userId: plan.userId, name: plan.userName },
        plan: { id: plan.id, phase: plan.phase, status: plan.status, riskLevel: plan.riskLevel, createdAt: plan.createdAt, releaseDate: plan.releaseDate },
        intake: intake || null,
        milestones: {
          total: milestones.length,
          completed: milestones.filter(m => m.status === "completed").length,
          inProgress: milestones.filter(m => m.status === "in_progress").length,
          pending: milestones.filter(m => m.status === "pending").length,
          details: milestones.map(m => ({ title: m.title, category: m.category, phase: m.phase, status: m.status, targetDate: m.targetDate, completedDate: m.completedDate })),
        },
        thriveScore: thriveData,
      };
      res.json(report);
    } catch (error) {
      console.error("Failed to generate report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ==================== INTAKE & SERVICE DELIVERY ROUTES ====================

  const REQUIRED_SERVICE_CATEGORIES = [
    "case_management", "workforce_training", "education", "housing_assistance",
    "mental_health", "substance_abuse", "legal_aid", "mentoring",
    "financial_coaching", "transportation", "childcare",
  ];

  app.get("/api/intake/participants", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const profiles = await db.select().from(participantProfiles).orderBy(desc(participantProfiles.createdAt));
      res.json(profiles);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.get("/api/intake/participants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, req.params.id));
      if (!profile) return res.status(404).json({ error: "Participant not found" });
      res.json(profile);
    } catch (error) {
      console.error("Failed to fetch participant:", error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  app.post("/api/intake/participants", requireAuth, async (req, res) => {
    try {
      const parsed = insertParticipantProfileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid participant data", details: parsed.error.flatten().fieldErrors });
      const [profile] = await db.insert(participantProfiles).values(parsed.data).returning();
      res.json(profile);
    } catch (error) {
      console.error("Failed to create participant:", error);
      res.status(500).json({ error: "Failed to create participant" });
    }
  });

  app.patch("/api/intake/participants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allowed = ["firstName", "lastName", "preferredName", "phone", "email", "address", "city", "state", "zipCode",
        "housingStatus", "housingDetails", "employmentStatus", "educationLevel", "status", "notes",
        "assignedCaseManagerId", "assignedFacilitatorId", "immediateNeeds", "shortTermGoals", "longTermGoals"];
      const filtered: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of allowed) { if (req.body[key] !== undefined) filtered[key] = req.body[key]; }
      const [updated] = await db.update(participantProfiles).set(filtered).where(eq(participantProfiles.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Participant not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update participant:", error);
      res.status(500).json({ error: "Failed to update participant" });
    }
  });

  app.delete("/api/intake/participants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(serviceRecords).where(eq(serviceRecords.participantId, req.params.id));
      await db.delete(consentRecords).where(eq(consentRecords.participantId, req.params.id));
      const [deleted] = await db.delete(participantProfiles).where(eq(participantProfiles.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "Participant not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete participant:", error);
      res.status(500).json({ error: "Failed to delete participant" });
    }
  });

  app.get("/api/intake/services/all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const records = await db.select().from(serviceRecords).orderBy(desc(serviceRecords.createdAt));
      res.json(records);
    } catch (error) {
      console.error("Failed to fetch all services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/intake/services/:participantId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const records = await db.select().from(serviceRecords)
        .where(eq(serviceRecords.participantId, req.params.participantId))
        .orderBy(desc(serviceRecords.createdAt));
      res.json(records);
    } catch (error) {
      console.error("Failed to fetch service records:", error);
      res.status(500).json({ error: "Failed to fetch service records" });
    }
  });

  app.post("/api/intake/services", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertServiceRecordSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid service data", details: parsed.error.flatten().fieldErrors });
      const [record] = await db.insert(serviceRecords).values(parsed.data).returning();
      res.json(record);
    } catch (error) {
      console.error("Failed to create service record:", error);
      res.status(500).json({ error: "Failed to create service record" });
    }
  });

  app.patch("/api/intake/services/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allowedService = ["notes", "outcome", "followUpNeeded", "followUpDate", "followUpNotes", "status"];
      const filteredService: Record<string, unknown> = {};
      for (const key of allowedService) { if (req.body[key] !== undefined) filteredService[key] = req.body[key]; }
      const [updated] = await db.update(serviceRecords).set(filteredService).where(eq(serviceRecords.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Service record not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update service record:", error);
      res.status(500).json({ error: "Failed to update service record" });
    }
  });

  app.delete("/api/intake/services/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [deleted] = await db.delete(serviceRecords).where(eq(serviceRecords.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "Service record not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete service record:", error);
      res.status(500).json({ error: "Failed to delete service record" });
    }
  });

  app.post("/api/intake/consent", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertConsentRecordSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid consent data", details: parsed.error.flatten().fieldErrors });
      const [record] = await db.insert(consentRecords).values(parsed.data).returning();
      res.json(record);
    } catch (error) {
      console.error("Failed to create consent record:", error);
      res.status(500).json({ error: "Failed to create consent record" });
    }
  });

  app.get("/api/intake/consent/:participantId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const records = await db.select().from(consentRecords)
        .where(eq(consentRecords.participantId, req.params.participantId))
        .orderBy(desc(consentRecords.createdAt));
      res.json(records);
    } catch (error) {
      console.error("Failed to fetch consent records:", error);
      res.status(500).json({ error: "Failed to fetch consent records" });
    }
  });

  app.patch("/api/intake/consent/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allowedConsent = ["acknowledged", "revokedAt"];
      const filteredConsent: Record<string, unknown> = {};
      for (const key of allowedConsent) { if (req.body[key] !== undefined) filteredConsent[key] = req.body[key]; }
      const [updated] = await db.update(consentRecords).set(filteredConsent).where(eq(consentRecords.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Consent record not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update consent record:", error);
      res.status(500).json({ error: "Failed to update consent record" });
    }
  });

  app.delete("/api/intake/consent/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [deleted] = await db.delete(consentRecords).where(eq(consentRecords.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "Consent record not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete consent record:", error);
      res.status(500).json({ error: "Failed to delete consent record" });
    }
  });

  app.get("/api/intake/caseload", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const allParticipants = await db.select().from(participantProfiles);
      const allServiceRecords = await db.select().from(serviceRecords);
      const activeParticipants = allParticipants.filter(p => p.status === "active").length;
      const totalMinutes = allServiceRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
      const followUpsNeeded = allServiceRecords.filter(r => r.followUpNeeded && r.status !== "follow_up_completed").length;
      const servicesByCategory: Record<string, number> = {};
      allServiceRecords.forEach(r => {
        servicesByCategory[r.serviceCategory] = (servicesByCategory[r.serviceCategory] || 0) + (r.durationMinutes || 0);
      });

      const facilitatorCaseloads: Record<string, { facilitatorId: string; participantCount: number; participants: string[]; serviceHours: number; followUps: number }> = {};
      allParticipants.forEach(p => {
        const fId = p.assignedFacilitatorId || p.assignedCaseManagerId || "unassigned";
        if (!facilitatorCaseloads[fId]) facilitatorCaseloads[fId] = { facilitatorId: fId, participantCount: 0, participants: [], serviceHours: 0, followUps: 0 };
        facilitatorCaseloads[fId].participantCount++;
        facilitatorCaseloads[fId].participants.push(p.id);
      });
      allServiceRecords.forEach(r => {
        const participant = allParticipants.find(p => p.id === r.participantId);
        const fId = participant?.assignedFacilitatorId || participant?.assignedCaseManagerId || "unassigned";
        if (facilitatorCaseloads[fId]) {
          facilitatorCaseloads[fId].serviceHours += (r.durationMinutes || 0) / 60;
          if (r.followUpNeeded && r.status !== "follow_up_completed") facilitatorCaseloads[fId].followUps++;
        }
      });

      const serviceGaps: Array<{ participantId: string; participantName: string; missingCategories: string[]; facilitatorId: string | null }> = [];
      allParticipants.filter(p => p.status === "active").forEach(p => {
        const pServices = allServiceRecords.filter(r => r.participantId === p.id);
        const servedCategories = new Set(pServices.map(r => r.serviceCategory));
        const needs = p.immediateNeeds || [];
        const needMap: Record<string, string> = {
          "Housing assistance": "housing_assistance", "Employment support": "workforce_training",
          "Education/GED": "education", "Mental health services": "mental_health",
          "Substance abuse treatment": "substance_abuse", "Legal aid": "legal_aid",
          "Mentoring": "mentoring", "Financial coaching": "financial_coaching",
          "Transportation": "transportation", "Childcare": "childcare",
        };
        const missing: string[] = [];
        needs.forEach(n => { const cat = needMap[n]; if (cat && !servedCategories.has(cat)) missing.push(cat); });
        if (missing.length > 0) {
          serviceGaps.push({
            participantId: p.id,
            participantName: `${p.firstName} ${p.lastName}`,
            missingCategories: missing,
            facilitatorId: p.assignedFacilitatorId || p.assignedCaseManagerId || null,
          });
        }
      });

      res.json({
        totalParticipants: allParticipants.length,
        activeParticipants,
        totalServiceHours: totalMinutes / 60,
        followUpsNeeded,
        servicesByCategory,
        recentServices: allServiceRecords.slice(0, 20),
        facilitatorCaseloads: Object.values(facilitatorCaseloads),
        serviceGaps,
      });
    } catch (error) {
      console.error("Failed to fetch caseload data:", error);
      res.status(500).json({ error: "Failed to fetch caseload data" });
    }
  });

  app.get("/api/intake/caseload/facilitator/:facilitatorId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const fId = req.params.facilitatorId;
      const participants = await db.select().from(participantProfiles)
        .where(fId === "unassigned"
          ? and(
              sql`${participantProfiles.assignedFacilitatorId} IS NULL`,
              sql`${participantProfiles.assignedCaseManagerId} IS NULL`
            )
          : sql`(${participantProfiles.assignedFacilitatorId} = ${fId} OR ${participantProfiles.assignedCaseManagerId} = ${fId})`
        );
      const participantIds = participants.map(p => p.id);
      let services: typeof serviceRecords.$inferSelect[] = [];
      if (participantIds.length > 0) {
        services = await db.select().from(serviceRecords)
          .where(inArray(serviceRecords.participantId, participantIds))
          .orderBy(desc(serviceRecords.createdAt));
      }
      const totalMinutes = services.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
      const followUps = services.filter(r => r.followUpNeeded && r.status !== "follow_up_completed");
      const dosageByParticipant: Record<string, Record<string, number>> = {};
      services.forEach(r => {
        if (!dosageByParticipant[r.participantId]) dosageByParticipant[r.participantId] = {};
        dosageByParticipant[r.participantId][r.serviceCategory] = (dosageByParticipant[r.participantId][r.serviceCategory] || 0) + (r.durationMinutes || 0);
      });
      res.json({
        facilitatorId: fId,
        participants,
        totalServiceHours: totalMinutes / 60,
        followUps,
        dosageByParticipant,
        participantCount: participants.length,
      });
    } catch (error) {
      console.error("Failed to fetch facilitator caseload:", error);
      res.status(500).json({ error: "Failed to fetch facilitator caseload" });
    }
  });

  app.get("/api/intake/export", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const allParticipants = await db.select().from(participantProfiles);
      const allServiceRecords = await db.select().from(serviceRecords);
      const allConsents = await db.select().from(consentRecords);
      res.json({
        exportDate: new Date().toISOString(),
        participants: allParticipants,
        serviceRecords: allServiceRecords,
        consentRecords: allConsents,
      });
    } catch (error) {
      console.error("Failed to export data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });
}
