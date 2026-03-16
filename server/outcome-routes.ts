import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  outcomeTracking, reentryPlans, reentryMilestones,
  insertOutcomeTrackingSchema,
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
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const outcomeCreateSchema = insertOutcomeTrackingSchema.pick({
  userId: true, planId: true, category: true, metricName: true,
  metricValue: true, periodMonths: true, source: true,
});

export function registerOutcomeRoutes(app: Express) {
  app.get("/api/outcomes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let results;
      if (category) {
        results = await db.select().from(outcomeTracking).where(eq(outcomeTracking.category, category)).orderBy(desc(outcomeTracking.measurementDate));
      } else {
        results = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.measurementDate));
      }
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch outcomes:", error);
      res.status(500).json({ error: "Failed to fetch outcomes" });
    }
  });

  app.post("/api/outcomes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = outcomeCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid outcome data", details: parsed.error.flatten().fieldErrors });
      const [outcome] = await db.insert(outcomeTracking).values(parsed.data).returning();
      res.json(outcome);
    } catch (error) {
      console.error("Failed to create outcome:", error);
      res.status(500).json({ error: "Failed to create outcome" });
    }
  });

  app.get("/api/outcomes/user/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).where(eq(outcomeTracking.userId, req.params.userId)).orderBy(desc(outcomeTracking.measurementDate));
      res.json(outcomes);
    } catch (error) {
      console.error("Failed to fetch user outcomes:", error);
      res.status(500).json({ error: "Failed to fetch user outcomes" });
    }
  });

  app.get("/api/outcomes/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.measurementDate));
      const plans = await db.select().from(reentryPlans);
      const milestones = await db.select().from(reentryMilestones);

      const uniqueUsers = new Set(outcomes.map(o => o.userId));
      const completedMilestones = milestones.filter(m => m.status === "completed").length;

      const categoryCounts: Record<string, Record<string, number>> = {};
      for (const o of outcomes) {
        if (!categoryCounts[o.category]) categoryCounts[o.category] = { total: 0 };
        categoryCounts[o.category].total++;
        categoryCounts[o.category][o.metricName] = (categoryCounts[o.category][o.metricName] || 0) + 1;
      }

      res.json({
        totalOutcomes: outcomes.length,
        uniqueParticipants: uniqueUsers.size,
        totalActivePlans: plans.filter(p => p.status === "active").length,
        milestoneCompletionRate: milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0,
        ...categoryCounts,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/outcomes/report/doj", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking);
      const plans = await db.select().from(reentryPlans);
      const milestones = await db.select().from(reentryMilestones);

      const recidivism = outcomes.filter(o => o.category === "recidivism");
      const employment = outcomes.filter(o => o.category === "employment");
      const education = outcomes.filter(o => o.category === "education");
      const housing = outcomes.filter(o => o.category === "housing");

      const sixMonth = recidivism.filter(o => o.periodMonths === 6);
      const twelveMonth = recidivism.filter(o => o.periodMonths === 12);
      const thirtySixMonth = recidivism.filter(o => o.periodMonths === 36);

      const report = {
        generatedAt: new Date().toISOString(),
        reportType: "OJJDP Grant Performance Report",
        grantProgram: "Second Chance Act Youth Reentry",
        programOverview: {
          totalParticipantsServed: new Set([...plans.map(p => p.userId), ...outcomes.map(o => o.userId)]).size,
          activePlans: plans.filter(p => p.status === "active").length,
          completedPlans: plans.filter(p => p.status === "completed").length,
          programCompletionRate: plans.length > 0 ? Math.round((plans.filter(p => p.status === "completed").length / plans.length) * 100) : 0,
        },
        recidivismOutcomes: {
          sixMonth: { tracked: sixMonth.length, noReoffense: sixMonth.filter(o => o.metricValue === "no_reoffense").length },
          twelveMonth: { tracked: twelveMonth.length, noReoffense: twelveMonth.filter(o => o.metricValue === "no_reoffense").length },
          thirtySixMonth: { tracked: thirtySixMonth.length, noReoffense: thirtySixMonth.filter(o => o.metricValue === "no_reoffense").length },
        },
        employmentOutcomes: {
          totalPlaced: employment.filter(o => o.metricName === "job_placement").length,
          retention30Day: { tracked: employment.filter(o => o.metricName === "retention" && o.periodMonths === 1).length, retained: employment.filter(o => o.metricName === "retention" && o.periodMonths === 1 && o.metricValue === "retained").length },
          retention90Day: { tracked: employment.filter(o => o.metricName === "retention" && o.periodMonths === 3).length, retained: employment.filter(o => o.metricName === "retention" && o.periodMonths === 3 && o.metricValue === "retained").length },
        },
        educationOutcomes: {
          enrolled: education.filter(o => o.metricName === "enrollment").length,
          credentialsEarned: education.filter(o => o.metricName === "credential_completion").length,
        },
        housingOutcomes: {
          tracked: housing.length,
          stable: housing.filter(o => o.metricValue === "stable").length,
        },
        milestoneProgress: {
          total: milestones.length,
          completed: milestones.filter(m => m.status === "completed").length,
          completionRate: milestones.length > 0 ? Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100) : 0,
        },
      };
      res.json(report);
    } catch (error) {
      console.error("Failed to generate DOJ report:", error);
      res.status(500).json({ error: "Failed to generate DOJ report" });
    }
  });

  app.get("/api/outcomes/export/csv", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const outcomes = await db.select().from(outcomeTracking).orderBy(desc(outcomeTracking.measurementDate));
      const headers = ["id", "userId", "planId", "category", "metricName", "metricValue", "periodMonths", "measurementDate", "source", "baseline", "target", "createdAt"];
      const csvRows = [headers.join(",")];
      for (const o of outcomes) {
        csvRows.push(headers.map(h => {
          const val = o[h as keyof typeof o];
          if (val === null || val === undefined) return "";
          return String(val).includes(",") ? `"${String(val)}"` : String(val);
        }).join(","));
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=outcome_data.csv");
      res.send(csvRows.join("\n"));
    } catch (error) {
      console.error("Failed to export CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });
}
