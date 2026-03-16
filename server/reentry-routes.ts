import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  reentryPlans, reentryMilestones, reentryIntakeAssessments,
  thriveScores, earlyWarningFlags,
  insertReentryPlanSchema, insertReentryMilestoneSchema, insertReentryIntakeAssessmentSchema,
} from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";

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
      const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, req.params.id));
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
      const parsed = planUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const oldPlan = await db.select().from(reentryPlans).where(eq(reentryPlans.id, req.params.id));
      if (!oldPlan.length) return res.status(404).json({ error: "Plan not found" });
      const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      const [updated] = await db.update(reentryPlans).set(updateData).where(eq(reentryPlans.id, req.params.id)).returning();
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
      const milestones = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, req.params.planId));
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
      const [updated] = await db.update(reentryMilestones).set(parsed.data).where(eq(reentryMilestones.id, req.params.id)).returning();
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
      const [assessment] = await db.select().from(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.planId, req.params.planId));
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
      const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, req.params.id));
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
}
