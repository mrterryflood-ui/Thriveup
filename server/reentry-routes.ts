import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { reentryPlans, reentryMilestones, reentryIntakeAssessments, thriveScores, earlyWarningFlags } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

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

const DEFAULT_MILESTONES: Record<string, Array<{ category: string; title: string; phase: string }>> = {
  pre_release: [
    { category: "education", title: "Complete educational assessment", phase: "pre_release" },
    { category: "employment", title: "Develop employment readiness plan", phase: "pre_release" },
    { category: "housing", title: "Identify transitional housing options", phase: "pre_release" },
    { category: "behavioral_health", title: "Complete behavioral health screening", phase: "pre_release" },
    { category: "community", title: "Connect with community mentor", phase: "pre_release" },
  ],
  transition: [
    { category: "education", title: "Enroll in education or training program", phase: "transition" },
    { category: "employment", title: "Begin job search or vocational training", phase: "transition" },
    { category: "housing", title: "Secure stable housing arrangement", phase: "transition" },
    { category: "behavioral_health", title: "Attend initial counseling sessions", phase: "transition" },
    { category: "community", title: "Attend 4 mentor meetings", phase: "transition" },
    { category: "compliance", title: "Complete all supervision check-ins", phase: "transition" },
  ],
  stabilization: [
    { category: "education", title: "Maintain enrollment with 80% attendance", phase: "stabilization" },
    { category: "employment", title: "Obtain employment or complete vocational certificate", phase: "stabilization" },
    { category: "housing", title: "Maintain stable housing for 90 days", phase: "stabilization" },
    { category: "behavioral_health", title: "Complete 6 counseling sessions", phase: "stabilization" },
    { category: "financial", title: "Open bank account and begin budgeting", phase: "stabilization" },
  ],
  independence: [
    { category: "education", title: "Complete credential or program milestone", phase: "independence" },
    { category: "employment", title: "Maintain employment for 90+ days", phase: "independence" },
    { category: "housing", title: "Transition to independent housing", phase: "independence" },
    { category: "community", title: "Participate in community service or leadership", phase: "independence" },
    { category: "financial", title: "Build 3-month emergency fund", phase: "independence" },
  ],
};

export function registerReentryRoutes(app: Express) {
  app.get("/api/reentry/plans", requireAuth, requireAdmin, async (req, res) => {
    try {
      const plans = await db.select().from(reentryPlans).orderBy(desc(reentryPlans.createdAt));
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reentry plans" });
    }
  });

  app.post("/api/reentry/plans", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [plan] = await db.insert(reentryPlans).values(req.body).returning();

      const phaseMilestones = DEFAULT_MILESTONES[plan.phase] || DEFAULT_MILESTONES.pre_release;
      for (const m of phaseMilestones) {
        await db.insert(reentryMilestones).values({
          planId: plan.id,
          userId: plan.userId,
          ...m,
        });
      }

      res.json(plan);
    } catch (error) {
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
      } catch {}
      res.json({ ...plan, milestones, intake: intake || null, thriveScore: thriveData });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  });

  app.patch("/api/reentry/plans/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body, updatedAt: new Date() };
      const oldPlan = await db.select().from(reentryPlans).where(eq(reentryPlans.id, req.params.id));
      const [updated] = await db.update(reentryPlans).set(data).where(eq(reentryPlans.id, req.params.id)).returning();

      if (data.phase && oldPlan[0] && oldPlan[0].phase !== data.phase) {
        const newMilestones = DEFAULT_MILESTONES[data.phase] || [];
        for (const m of newMilestones) {
          await db.insert(reentryMilestones).values({
            planId: updated.id,
            userId: updated.userId,
            ...m,
          });
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  app.get("/api/reentry/plans/:planId/milestones", requireAuth, requireAdmin, async (req, res) => {
    try {
      const milestones = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, req.params.planId));
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/reentry/milestones", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [milestone] = await db.insert(reentryMilestones).values(req.body).returning();
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  app.patch("/api/reentry/milestones/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(reentryMilestones).set(req.body).where(eq(reentryMilestones.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  app.post("/api/reentry/intake", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [assessment] = await db.insert(reentryIntakeAssessments).values(req.body).returning();
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create intake assessment" });
    }
  });

  app.get("/api/reentry/intake/:planId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [assessment] = await db.select().from(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.planId, req.params.planId));
      res.json(assessment || null);
    } catch (error) {
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
        totalPlans: plans.length,
        activePlans,
        phaseDistribution: phaseCount,
        riskDistribution: riskCount,
        milestoneCompletion: { completed: completedMilestones, total: totalMilestones, rate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0 },
        recentPlans: plans.slice(0, 10),
      });
    } catch (error) {
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
      } catch {}

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
      res.status(500).json({ error: "Failed to generate report" });
    }
  });
}
