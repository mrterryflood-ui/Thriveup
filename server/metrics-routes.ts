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

// Suppression floor: any people/participant count below this is not published
// as an exact value (small-cell disclosure protection). Returns the number if
// it is 0 or >= floor; otherwise the sentinel "<5" string.
const SUPPRESSION_FLOOR = 5;
function suppressCount(n: number): number | string {
  if (n === 0) return 0;
  return n < SUPPRESSION_FLOOR ? `<${SUPPRESSION_FLOOR}` : n;
}

// Marker for aggregates that are not yet measured/wired to a live data source.
// Presented to the public as "not yet reported" rather than a misleading 0.
const NOT_YET_REPORTED = "not yet reported" as const;

export function registerMetricsRoutes(app: Express) {
  // PUBLIC read-only aggregates for /platform-metrics and /transparency.
  // No auth required. Returns ONLY non-sensitive rollups — no individual rows,
  // no names, no IDs. People counts below the suppression floor are masked.
  // Values with no live data source are labeled "not yet reported" (never 0).
  app.get("/api/public/platform-metrics", async (_req, res) => {
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

      res.json({
        engagement: {
          totalUsers: suppressCount(allStudents.length),
          activeUsers30d: suppressCount(activeStudents.length),
          lessonsCompleted: totalLessonsCompleted,
          quizzesCompleted: totalQuizzes,
        },
        prevention: {
          youthReached: suppressCount(allStudents.length),
          modulesCompleted: totalLessonsCompleted,
          avgScore: allStudents.length > 0
            ? Math.round(allStudents.reduce((s, p) => s + p.averageScore, 0) / allStudents.length)
            : NOT_YET_REPORTED,
        },
        coalition: {
          classroomsActive: allClassrooms.length,
          certificatesIssued: allCertificates.length,
        },
        // No live source yet — do not present placeholder zeros as measured.
        workforce: {
          careerAssessments: NOT_YET_REPORTED,
          jobPlacements: NOT_YET_REPORTED,
        },
        grants: {
          applicationsInProgress: NOT_YET_REPORTED,
          totalFundingSecured: NOT_YET_REPORTED,
        },
        facilitator: {
          totalFacilitators: allFacilitators.length,
          sessionsDelivered: allLogs.length,
          avgFidelity: allLogs.length > 0 ? Math.round(avgFidelity * 10) / 10 : NOT_YET_REPORTED,
          totalDosageHours: Math.round(totalDosage / 60 * 10) / 10,
        },
        parent: {
          modulesCompleted: NOT_YET_REPORTED,
          familyAssessments: NOT_YET_REPORTED,
        },
        email: {
          inquiriesReceived: NOT_YET_REPORTED,
          responseRate: NOT_YET_REPORTED,
        },
      });
    } catch (error) {
      console.error("Failed to fetch public platform metrics:", error);
      res.status(500).json({ error: "Failed to fetch public platform metrics" });
    }
  });


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
      const { category } = req.params as Record<string, string>;
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
