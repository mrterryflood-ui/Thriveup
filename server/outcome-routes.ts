import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { outcomeTracking, reentryPlans, reentryMilestones } from "@shared/schema";
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

export function registerOutcomeRoutes(app: Express) {
  app.get("/api/outcomes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let results;
      if (category) {
        results = await db.select().from(outcomeTracking).where(eq(outcomeTracking.category, category)).orderBy(desc(outcomeTracking.createdAt));
      } else {
        results = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.createdAt));
      }
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outcomes" });
    }
  });

  app.post("/api/outcomes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [outcome] = await db.insert(outcomeTracking).values(req.body).returning();
      res.json(outcome);
    } catch (error) {
      res.status(500).json({ error: "Failed to create outcome" });
    }
  });

  app.get("/api/outcomes/user/:userId", requireAuth, async (req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).where(eq(outcomeTracking.userId, req.params.userId)).orderBy(desc(outcomeTracking.measurementDate));
      res.json(outcomes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user outcomes" });
    }
  });

  app.get("/api/outcomes/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.createdAt));
      const plans = await db.select().from(reentryPlans);
      const milestones = await db.select().from(reentryMilestones);

      const categories: Record<string, { count: number; users: Set<string> }> = {};
      for (const o of outcomes) {
        if (!categories[o.category]) categories[o.category] = { count: 0, users: new Set() };
        categories[o.category].count++;
        categories[o.category].users.add(o.userId);
      }

      const recidivismOutcomes = outcomes.filter(o => o.category === "recidivism");
      const employmentOutcomes = outcomes.filter(o => o.category === "employment");
      const educationOutcomes = outcomes.filter(o => o.category === "education");
      const housingOutcomes = outcomes.filter(o => o.category === "housing");

      const completedMilestones = milestones.filter(m => m.status === "completed").length;

      res.json({
        totalOutcomes: outcomes.length,
        uniqueParticipants: new Set(outcomes.map(o => o.userId)).size,
        totalActivePlans: plans.filter(p => p.status === "active").length,
        milestoneCompletionRate: milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0,
        categoryBreakdown: Object.entries(categories).map(([cat, data]) => ({ category: cat, measurements: data.count, participants: data.users.size })),
        recidivism: { total: recidivismOutcomes.length, noReoffense: recidivismOutcomes.filter(o => o.metricValue === "no_reoffense").length },
        employment: { total: employmentOutcomes.length, placed: employmentOutcomes.filter(o => o.metricName === "job_placement" && o.metricValue === "placed").length },
        education: { total: educationOutcomes.length, enrolled: educationOutcomes.filter(o => o.metricName === "enrollment" && o.metricValue === "enrolled").length },
        housing: { total: housingOutcomes.length, stable: housingOutcomes.filter(o => o.metricValue === "stable").length },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outcome dashboard" });
    }
  });

  app.get("/api/outcomes/report/doj", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.createdAt));
      const plans = await db.select().from(reentryPlans);
      const milestones = await db.select().from(reentryMilestones);

      const uniqueUsers = new Set(plans.map(p => p.userId));
      const completedPlans = plans.filter(p => p.status === "completed");

      const recidivism6mo = outcomes.filter(o => o.category === "recidivism" && o.periodMonths === 6);
      const recidivism12mo = outcomes.filter(o => o.category === "recidivism" && o.periodMonths === 12);
      const recidivism36mo = outcomes.filter(o => o.category === "recidivism" && o.periodMonths === 36);

      const employment30 = outcomes.filter(o => o.category === "employment" && o.metricName === "retention" && o.periodMonths === 1);
      const employment90 = outcomes.filter(o => o.category === "employment" && o.metricName === "retention" && o.periodMonths === 3);
      const employment180 = outcomes.filter(o => o.category === "employment" && o.metricName === "retention" && o.periodMonths === 6);

      const report = {
        reportType: "OJJDP Grant Performance Report",
        generatedAt: new Date().toISOString(),
        reportingPeriod: { start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
        programOverview: {
          totalParticipantsServed: uniqueUsers.size,
          activePlans: plans.filter(p => p.status === "active").length,
          completedPlans: completedPlans.length,
          programCompletionRate: plans.length > 0 ? Math.round((completedPlans.length / plans.length) * 100) : 0,
        },
        recidivismOutcomes: {
          sixMonth: { tracked: recidivism6mo.length, noReoffense: recidivism6mo.filter(o => o.metricValue === "no_reoffense").length },
          twelveMonth: { tracked: recidivism12mo.length, noReoffense: recidivism12mo.filter(o => o.metricValue === "no_reoffense").length },
          thirtySixMonth: { tracked: recidivism36mo.length, noReoffense: recidivism36mo.filter(o => o.metricValue === "no_reoffense").length },
        },
        employmentOutcomes: {
          totalPlaced: outcomes.filter(o => o.category === "employment" && o.metricName === "job_placement").length,
          retention30Day: { tracked: employment30.length, retained: employment30.filter(o => o.metricValue === "retained").length },
          retention90Day: { tracked: employment90.length, retained: employment90.filter(o => o.metricValue === "retained").length },
          retention180Day: { tracked: employment180.length, retained: employment180.filter(o => o.metricValue === "retained").length },
        },
        educationOutcomes: {
          enrolled: outcomes.filter(o => o.category === "education" && o.metricName === "enrollment").length,
          credentialsEarned: outcomes.filter(o => o.category === "education" && o.metricName === "credential_completion").length,
          gedDiploma: outcomes.filter(o => o.category === "education" && o.metricName === "ged_diploma").length,
        },
        housingOutcomes: {
          tracked: outcomes.filter(o => o.category === "housing").length,
          stable: outcomes.filter(o => o.category === "housing" && o.metricValue === "stable").length,
        },
        behavioralHealth: {
          assessmentsCompleted: outcomes.filter(o => o.category === "behavioral_health").length,
          improved: outcomes.filter(o => o.category === "behavioral_health" && o.metricValue === "improved").length,
        },
        milestoneProgress: {
          total: milestones.length,
          completed: milestones.filter(m => m.status === "completed").length,
          completionRate: milestones.length > 0 ? Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100) : 0,
        },
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate DOJ report" });
    }
  });

  app.get("/api/outcomes/export/csv", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.createdAt));
      const headers = ["ID", "User ID", "Plan ID", "Category", "Metric Name", "Metric Value", "Measurement Date", "Period (Months)", "Baseline", "Target", "Source"];
      const rows = outcomes.map(o => [o.id, o.userId, o.planId || "", o.category, o.metricName, o.metricValue || "", o.measurementDate?.toISOString() || "", o.periodMonths?.toString() || "", o.baseline || "", o.target || "", o.source || ""].join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=outcome_data.csv");
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export outcomes" });
    }
  });
}
