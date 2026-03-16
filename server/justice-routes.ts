import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  justiceReferrals, supervisionCompliance, reentryPlans, reentryMilestones, outcomeTracking,
  insertJusticeReferralSchema, insertSupervisionComplianceSchema,
} from "@shared/schema";
import type { ReentryMilestone, OutcomeTracking, SupervisionCompliance as SupervisionComplianceType } from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";

const requireApiKey = (req: Request, res: Response, next: Function) => {
  const rawKey = req.headers["x-api-key"];
  const validKey = process.env.CROSS_PLATFORM_API_KEY;
  if (!validKey) return res.status(503).json({ error: "API key not configured" });
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : null;
  if (!apiKey || apiKey !== validKey) return res.status(401).json({ error: "Invalid or missing API key" });
  next();
};

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

const externalReferralSchema = insertJusticeReferralSchema.pick({
  externalReferralId: true, agencyName: true, agencyType: true,
  userId: true, youthName: true, dateOfBirth: true, releaseDate: true,
  supervisionLevel: true, chargeType: true, specialConditions: true,
  assignedPlanId: true,
});

const referralUpdateSchema = z.object({
  status: z.enum(["received", "assigned", "active", "completed", "declined"]).optional(),
  assignedPlanId: z.string().optional(),
  notes: z.string().optional(),
});

const complianceCreateSchema = insertSupervisionComplianceSchema.pick({
  userId: true, complianceType: true, scheduledDate: true,
  completedDate: true, status: true, notes: true, verifiedBy: true,
});

const complianceUpdateSchema = z.object({
  status: z.enum(["pending", "completed", "missed", "excused"]).optional(),
  completedDate: z.string().optional(),
  notes: z.string().optional(),
  verifiedBy: z.string().optional(),
});

export function registerJusticeRoutes(app: Express) {
  app.post("/api/external/justice/referrals", requireApiKey, async (req, res) => {
    try {
      const parsed = externalReferralSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid referral data", details: parsed.error.flatten().fieldErrors });
      const [referral] = await db.insert(justiceReferrals).values(parsed.data).returning();
      res.json({ received: true, referralId: referral.id, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Failed to create referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/external/justice/referrals/:id/progress", requireApiKey, async (req, res) => {
    try {
      const [referral] = await db.select().from(justiceReferrals).where(eq(justiceReferrals.id, req.params.id));
      if (!referral) return res.status(404).json({ error: "Referral not found" });

      let planData = null;
      let milestoneData: ReentryMilestone[] = [];
      if (referral.assignedPlanId) {
        const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, referral.assignedPlanId));
        planData = plan || null;
        if (plan) {
          milestoneData = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, plan.id));
        }
      }

      let compliance: SupervisionComplianceType[] = [];
      if (referral.userId) {
        compliance = await db.select().from(supervisionCompliance).where(eq(supervisionCompliance.userId, referral.userId)).orderBy(desc(supervisionCompliance.createdAt));
      }

      res.json({
        referralId: referral.id, status: referral.status,
        plan: planData ? { phase: planData.phase, status: planData.status, riskLevel: planData.riskLevel } : null,
        milestones: {
          total: milestoneData.length,
          completed: milestoneData.filter(m => m.status === "completed").length,
          details: milestoneData.map(m => ({ title: m.title, category: m.category, status: m.status, completedDate: m.completedDate })),
        },
        compliance: compliance.map(c => ({ type: c.complianceType, scheduledDate: c.scheduledDate, completedDate: c.completedDate, status: c.status })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/external/justice/referrals/:id/report", requireApiKey, async (req, res) => {
    try {
      const [referral] = await db.select().from(justiceReferrals).where(eq(justiceReferrals.id, req.params.id));
      if (!referral) return res.status(404).json({ error: "Referral not found" });

      let planData = null;
      let milestoneData: ReentryMilestone[] = [];
      let outcomes: OutcomeTracking[] = [];

      if (referral.assignedPlanId) {
        const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, referral.assignedPlanId));
        planData = plan || null;
        if (plan) {
          milestoneData = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, plan.id));
        }
      }

      if (referral.userId) {
        outcomes = await db.select().from(outcomeTracking).where(eq(outcomeTracking.userId, referral.userId));
      }

      const compliance = referral.userId
        ? await db.select().from(supervisionCompliance).where(eq(supervisionCompliance.userId, referral.userId))
        : [];

      const report = {
        reportType: "Court-Ready Progress Report",
        generatedAt: new Date().toISOString(),
        referral: {
          id: referral.id, externalReferralId: referral.externalReferralId,
          agencyName: referral.agencyName, referralDate: referral.referralDate, status: referral.status,
        },
        programParticipation: {
          planPhase: planData?.phase || "not_assigned",
          planStatus: planData?.status || "not_assigned",
          riskLevel: planData?.riskLevel || "unknown",
          enrollmentDate: planData?.createdAt,
        },
        milestoneProgress: {
          total: milestoneData.length,
          completed: milestoneData.filter(m => m.status === "completed").length,
          inProgress: milestoneData.filter(m => m.status === "in_progress").length,
          milestones: milestoneData.map(m => ({
            title: m.title, category: m.category, phase: m.phase,
            status: m.status, targetDate: m.targetDate, completedDate: m.completedDate,
          })),
        },
        supervisionCompliance: {
          totalCheckins: compliance.length,
          completed: compliance.filter(c => c.status === "completed").length,
          complianceRate: compliance.length > 0 ? Math.round((compliance.filter(c => c.status === "completed").length / compliance.length) * 100) : 0,
          records: compliance.map(c => ({ type: c.complianceType, scheduled: c.scheduledDate, completed: c.completedDate, status: c.status })),
        },
        outcomes: outcomes.map(o => ({ category: o.category, metric: o.metricName, value: o.metricValue, date: o.measurementDate })),
      };
      res.json(report);
    } catch (error) {
      console.error("Failed to generate report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/justice/referrals", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const referrals = await db.select().from(justiceReferrals).orderBy(desc(justiceReferrals.createdAt));
      res.json(referrals);
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.patch("/api/justice/referrals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = referralUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const [updated] = await db.update(justiceReferrals).set({ ...parsed.data, updatedAt: new Date() }).where(eq(justiceReferrals.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update referral:", error);
      res.status(500).json({ error: "Failed to update referral" });
    }
  });

  app.get("/api/justice/compliance", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const records = await db.select().from(supervisionCompliance).orderBy(desc(supervisionCompliance.createdAt));
      res.json(records);
    } catch (error) {
      console.error("Failed to fetch compliance:", error);
      res.status(500).json({ error: "Failed to fetch compliance" });
    }
  });

  app.post("/api/justice/compliance", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = complianceCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid compliance data", details: parsed.error.flatten().fieldErrors });
      const [record] = await db.insert(supervisionCompliance).values(parsed.data).returning();
      res.json(record);
    } catch (error) {
      console.error("Failed to create compliance record:", error);
      res.status(500).json({ error: "Failed to create compliance record" });
    }
  });

  app.patch("/api/justice/compliance/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = complianceUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const [updated] = await db.update(supervisionCompliance).set(parsed.data).where(eq(supervisionCompliance.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update compliance:", error);
      res.status(500).json({ error: "Failed to update compliance" });
    }
  });

  app.get("/api/external/justice/health", requireApiKey, async (_req, res) => {
    res.json({
      status: "ok",
      platform: "AI Mastery Academy - Justice System Integration",
      version: "1.0",
      endpoints: [
        "POST /api/external/justice/referrals",
        "GET /api/external/justice/referrals/:id/progress",
        "GET /api/external/justice/referrals/:id/report",
      ],
      timestamp: new Date().toISOString(),
    });
  });
}
