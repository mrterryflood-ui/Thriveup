import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  facilitatorProfiles, sessionPlans, curriculumDeliveryLogs, facilitatorCertifications,
  insertFacilitatorProfileSchema, insertSessionPlanSchema,
  insertCurriculumDeliveryLogSchema, insertFacilitatorCertificationSchema,
} from "@shared/schema";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { generateAIResponse } from "./ai-provider";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function registerFacilitatorRoutes(app: Express) {
  app.get("/api/facilitators", requireAuth, async (_req, res) => {
    try {
      const profiles = await db.select().from(facilitatorProfiles).orderBy(desc(facilitatorProfiles.createdAt));
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitators" });
    }
  });

  app.get("/api/facilitators/:id", requireAuth, async (req, res) => {
    try {
      const [profile] = await db.select().from(facilitatorProfiles).where(eq(facilitatorProfiles.id, req.params.id as string));
      if (!profile) return res.status(404).json({ error: "Not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitator" });
    }
  });

  app.post("/api/facilitators", requireAuth, async (req, res) => {
    try {
      const data = insertFacilitatorProfileSchema.parse(req.body);
      const [profile] = await db.insert(facilitatorProfiles).values(data).returning();
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to create facilitator" });
    }
  });

  app.patch("/api/facilitators/:id", requireAuth, async (req, res) => {
    try {
      const [profile] = await db.update(facilitatorProfiles).set(req.body).where(eq(facilitatorProfiles.id, req.params.id as string)).returning();
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update facilitator" });
    }
  });

  app.delete("/api/facilitators/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(facilitatorProfiles).where(eq(facilitatorProfiles.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete facilitator" });
    }
  });

  app.get("/api/facilitators/dashboard/metrics", requireAuth, async (_req, res) => {
    try {
      const allFacilitators = await db.select().from(facilitatorProfiles);
      const allSessions = await db.select().from(sessionPlans);
      const allLogs = await db.select().from(curriculumDeliveryLogs);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const sessionsThisMonth = allSessions.filter(s => s.sessionDate >= thirtyDaysAgo);
      const logsThisMonth = allLogs.filter(l => l.actualDate >= thirtyDaysAgo);
      const avgFidelity = allLogs.length > 0
        ? allLogs.reduce((sum, l) => sum + l.fidelityScore, 0) / allLogs.length
        : 0;
      const totalDosage = allLogs.reduce((sum, l) => sum + l.dosageMinutes, 0);
      const upcomingSessions = allSessions.filter(s => s.sessionDate >= now.toISOString().split("T")[0] && s.status !== "delivered");

      res.json({
        totalFacilitators: allFacilitators.length,
        activeFacilitators: allFacilitators.filter(f => f.status === "active").length,
        sessionsThisMonth: sessionsThisMonth.length,
        deliveredThisMonth: logsThisMonth.length,
        averageFidelityScore: Math.round(avgFidelity * 10) / 10,
        totalDosageHours: Math.round(totalDosage / 60 * 10) / 10,
        upcomingSessions: upcomingSessions.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/session-plans", requireAuth, async (_req, res) => {
    try {
      const plans = await db.select().from(sessionPlans).orderBy(desc(sessionPlans.sessionDate));
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session plans" });
    }
  });

  app.post("/api/session-plans", requireAuth, async (req, res) => {
    try {
      const data = insertSessionPlanSchema.parse(req.body);
      const [plan] = await db.insert(sessionPlans).values(data).returning();
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session plan" });
    }
  });

  app.patch("/api/session-plans/:id", requireAuth, async (req, res) => {
    try {
      const [plan] = await db.update(sessionPlans).set(req.body).where(eq(sessionPlans.id, req.params.id as string)).returning();
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session plan" });
    }
  });

  app.delete("/api/session-plans/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(sessionPlans).where(eq(sessionPlans.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session plan" });
    }
  });

  app.post("/api/facilitators/session-plans/generate", requireAuth, async (req, res) => {
    try {
      const { moduleId, targetAudience, duration } = req.body;
      const prompt = `Generate a detailed session plan for a curriculum delivery session.
Module: ${moduleId || "General prevention curriculum"}
Target Audience: ${targetAudience || "Youth ages 10-18"}
Duration: ${duration || 60} minutes

Respond in JSON format with these fields:
{
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "materialsNeeded": ["material1", "material2"],
  "activitySequence": [
    {"time": "0-10 min", "activity": "Opening/warm-up", "description": "..."},
    {"time": "10-30 min", "activity": "Main lesson", "description": "..."},
    {"time": "30-50 min", "activity": "Group activity", "description": "..."},
    {"time": "50-60 min", "activity": "Closing/reflection", "description": "..."}
  ],
  "assessmentMethods": ["method1", "method2"],
  "differentiationStrategies": ["strategy1", "strategy2"],
  "notes": "Additional facilitator guidance"
}`;
      const response = await generateAIResponse([
        { role: "system", content: "You are a curriculum design expert specializing in youth prevention programs. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ], 2000);

      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate session plan" });
    }
  });

  app.get("/api/delivery-logs", requireAuth, async (_req, res) => {
    try {
      const logs = await db.select().from(curriculumDeliveryLogs).orderBy(desc(curriculumDeliveryLogs.actualDate));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery logs" });
    }
  });

  app.post("/api/delivery-logs", requireAuth, async (req, res) => {
    try {
      const data = insertCurriculumDeliveryLogSchema.parse(req.body);
      const [log] = await db.insert(curriculumDeliveryLogs).values(data).returning();
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to create delivery log" });
    }
  });

  app.patch("/api/delivery-logs/:id", requireAuth, async (req, res) => {
    try {
      const [log] = await db.update(curriculumDeliveryLogs).set(req.body).where(eq(curriculumDeliveryLogs.id, req.params.id as string)).returning();
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery log" });
    }
  });

  app.get("/api/facilitators/fidelity-report", requireAuth, async (_req, res) => {
    try {
      const logs = await db.select().from(curriculumDeliveryLogs).orderBy(desc(curriculumDeliveryLogs.actualDate));
      const byMonth: Record<string, { total: number; count: number }> = {};
      for (const log of logs) {
        const month = log.actualDate.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = { total: 0, count: 0 };
        byMonth[month].total += log.fidelityScore;
        byMonth[month].count += 1;
      }
      const trends = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          averageFidelity: Math.round((data.total / data.count) * 10) / 10,
          sessionCount: data.count,
        }));
      const overall = logs.length > 0
        ? Math.round((logs.reduce((s, l) => s + l.fidelityScore, 0) / logs.length) * 10) / 10
        : 0;
      res.json({ overallFidelity: overall, totalSessions: logs.length, trends });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fidelity report" });
    }
  });

  app.get("/api/facilitator-certifications/:facilitatorId", requireAuth, async (req, res) => {
    try {
      const certs = await db.select().from(facilitatorCertifications)
        .where(eq(facilitatorCertifications.facilitatorId, req.params.facilitatorId as string))
        .orderBy(desc(facilitatorCertifications.createdAt));
      res.json(certs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  app.post("/api/facilitator-certifications", requireAuth, async (req, res) => {
    try {
      const data = insertFacilitatorCertificationSchema.parse(req.body);
      const [cert] = await db.insert(facilitatorCertifications).values(data).returning();
      res.json(cert);
    } catch (error) {
      res.status(500).json({ error: "Failed to create certification" });
    }
  });

  app.patch("/api/facilitator-certifications/:id", requireAuth, async (req, res) => {
    try {
      const [cert] = await db.update(facilitatorCertifications).set(req.body).where(eq(facilitatorCertifications.id, req.params.id as string)).returning();
      res.json(cert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update certification" });
    }
  });

  app.delete("/api/facilitator-certifications/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(facilitatorCertifications).where(eq(facilitatorCertifications.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete certification" });
    }
  });
}
