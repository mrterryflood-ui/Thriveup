import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  platformMetrics, insertPlatformMetricSchema,
  studentProgress, facilitatorProfiles, sessionPlans, curriculumDeliveryLogs,
  classrooms, certificates, completedLessons, quizAttempts,
  attendanceLogs,
} from "@shared/schema";
import { eq, desc, sql, count, gte } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function getTrend(current: number, previous: number): string {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
}

export function registerMetricsRoutes(app: Express) {
  app.get("/api/metrics/platform-wide", requireAuth, async (_req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const allStudents = await db.select().from(studentProgress);
      const activeStudents = allStudents.filter(s => s.lastActiveDate && s.lastActiveDate >= thirtyDaysAgo);
      const totalLessonsCompleted = allStudents.reduce((s, p) => s + p.lessonsCompleted, 0);
      const totalQuizzes = allStudents.reduce((s, p) => s + p.quizzesCompleted, 0);

      const allFacilitators = await db.select().from(facilitatorProfiles);
      const allLogs = await db.select().from(curriculumDeliveryLogs);
      const avgFidelity = allLogs.length > 0
        ? allLogs.reduce((s, l) => s + l.fidelityScore, 0) / allLogs.length
        : 0;
      const totalDosage = allLogs.reduce((s, l) => s + l.dosageMinutes, 0);

      const allClassrooms = await db.select().from(classrooms);
      const allCertificates = await db.select().from(certificates);

      const metrics = {
        engagement: {
          totalUsers: allStudents.length,
          activeUsers30d: activeStudents.length,
          lessonsCompleted: totalLessonsCompleted,
          quizzesCompleted: totalQuizzes,
        },
        prevention: {
          youthReached: allStudents.length,
          modulesCompleted: totalLessonsCompleted,
          avgScore: allStudents.length > 0
            ? Math.round(allStudents.reduce((s, p) => s + p.averageScore, 0) / allStudents.length)
            : 0,
        },
        coalition: {
          classroomsActive: allClassrooms.length,
          certificatesIssued: allCertificates.length,
        },
        workforce: {
          careerAssessments: 0,
          jobPlacements: 0,
        },
        grants: {
          applicationsInProgress: 0,
          totalFundingSecured: 0,
        },
        facilitator: {
          totalFacilitators: allFacilitators.length,
          sessionsDelivered: allLogs.length,
          avgFidelity: Math.round(avgFidelity * 10) / 10,
          totalDosageHours: Math.round(totalDosage / 60 * 10) / 10,
        },
        parent: {
          modulesCompleted: 0,
          familyAssessments: 0,
        },
        email: {
          inquiriesReceived: 0,
          responseRate: 0,
        },
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform metrics" });
    }
  });

  app.get("/api/metrics/trends/:category", requireAuth, async (req, res) => {
    try {
      const { category } = req.params;
      const stored = await db.select().from(platformMetrics)
        .where(eq(platformMetrics.metricCategory, category))
        .orderBy(desc(platformMetrics.calculatedAt));
      res.json(stored);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metric trends" });
    }
  });

  app.post("/api/metrics/snapshot", requireAuth, async (_req, res) => {
    try {
      const allStudents = await db.select().from(studentProgress);
      const allLogs = await db.select().from(curriculumDeliveryLogs);
      const allFacilitators = await db.select().from(facilitatorProfiles);

      const snapshots = [
        { metricName: "Total Users", metricCategory: "engagement", currentValue: allStudents.length, previousValue: 0, targetValue: 100, unit: "count", trend: "stable" },
        { metricName: "Total Facilitators", metricCategory: "facilitator", currentValue: allFacilitators.length, previousValue: 0, targetValue: 10, unit: "count", trend: "stable" },
        { metricName: "Sessions Delivered", metricCategory: "facilitator", currentValue: allLogs.length, previousValue: 0, targetValue: 50, unit: "count", trend: "stable" },
        { metricName: "Avg Fidelity", metricCategory: "fidelity", currentValue: allLogs.length > 0 ? allLogs.reduce((s, l) => s + l.fidelityScore, 0) / allLogs.length : 0, previousValue: 0, targetValue: 4.0, unit: "score", trend: "stable" },
        { metricName: "Total Dosage Hours", metricCategory: "operational", currentValue: Math.round(allLogs.reduce((s, l) => s + l.dosageMinutes, 0) / 60 * 10) / 10, previousValue: 0, targetValue: 500, unit: "hours", trend: "stable" },
        { metricName: "Youth Reached", metricCategory: "reach", currentValue: allStudents.length, previousValue: 0, targetValue: 200, unit: "count", trend: "stable" },
      ];

      for (const snap of snapshots) {
        await db.insert(platformMetrics).values(snap);
      }

      res.json({ success: true, snapshotCount: snapshots.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to capture snapshot" });
    }
  });

  app.get("/api/metrics/stored", requireAuth, async (_req, res) => {
    try {
      const stored = await db.select().from(platformMetrics).orderBy(desc(platformMetrics.calculatedAt));
      res.json(stored);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stored metrics" });
    }
  });
}
