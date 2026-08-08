import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
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

// Canonical staff-role set — keep in lockstep with server/reentry-routes.ts,
// server/yhsi-routes.ts, server/grant-routes.ts, and the client RequireAuth
// staffOnly gate. Role is resolved from the DB (req.user.role is never set).
const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

async function requireStaff(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role && STAFF_ROLES.has(user.role)) return next();
  } catch (e) { console.error("Staff check error:", e); }
  return res.status(403).json({ error: "Staff access required" });
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

// Bounded SQL aggregates — never load full tables into memory. Every value
// the metrics endpoints publish is computed in the database.
async function computeAggregates() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [studentAgg] = await db.select({
    totalStudents: count(),
    activeStudents30d: sql<number>`count(*) filter (where ${studentProgress.lastActiveDate} >= ${thirtyDaysAgo})`.mapWith(Number),
    lessonsCompleted: sql<number>`coalesce(sum(${studentProgress.lessonsCompleted}), 0)`.mapWith(Number),
    quizzesCompleted: sql<number>`coalesce(sum(${studentProgress.quizzesCompleted}), 0)`.mapWith(Number),
    avgScore: sql<number | null>`avg(${studentProgress.averageScore})`.mapWith((v) => (v === null ? null : Number(v))),
  }).from(studentProgress);

  const [facilitatorAgg] = await db.select({ totalFacilitators: count() }).from(facilitatorProfiles);

  const [logAgg] = await db.select({
    sessionsDelivered: count(),
    avgFidelity: sql<number | null>`avg(${curriculumDeliveryLogs.fidelityScore})`.mapWith((v) => (v === null ? null : Number(v))),
    totalDosageMinutes: sql<number>`coalesce(sum(${curriculumDeliveryLogs.dosageMinutes}), 0)`.mapWith(Number),
  }).from(curriculumDeliveryLogs);

  const [classroomAgg] = await db.select({ classroomsActive: count() }).from(classrooms);
  const [certificateAgg] = await db.select({ certificatesIssued: count() }).from(certificates);

  return {
    totalStudents: studentAgg.totalStudents,
    activeStudents30d: studentAgg.activeStudents30d,
    lessonsCompleted: studentAgg.lessonsCompleted,
    quizzesCompleted: studentAgg.quizzesCompleted,
    avgScore: studentAgg.avgScore === null ? null : Math.round(studentAgg.avgScore),
    totalFacilitators: facilitatorAgg.totalFacilitators,
    sessionsDelivered: logAgg.sessionsDelivered,
    avgFidelity: logAgg.avgFidelity === null ? null : Math.round(logAgg.avgFidelity * 10) / 10,
    totalDosageHours: Math.round((logAgg.totalDosageMinutes / 60) * 10) / 10,
    classroomsActive: classroomAgg.classroomsActive,
    certificatesIssued: certificateAgg.certificatesIssued,
  };
}

export function registerMetricsRoutes(app: Express) {
  // PUBLIC read-only aggregates for /platform-metrics and /transparency.
  // No auth required. Returns ONLY non-sensitive rollups — no individual rows,
  // no names, no IDs. People counts below the suppression floor are masked.
  // Values with no live data source are labeled "not yet reported" (never 0).
  app.get("/api/public/platform-metrics", async (_req, res) => {
    try {
      const agg = await computeAggregates();

      res.json({
        engagement: {
          totalUsers: suppressCount(agg.totalStudents),
          activeUsers30d: suppressCount(agg.activeStudents30d),
          lessonsCompleted: agg.lessonsCompleted,
          quizzesCompleted: agg.quizzesCompleted,
        },
        prevention: {
          youthReached: suppressCount(agg.totalStudents),
          modulesCompleted: agg.lessonsCompleted,
          avgScore: agg.avgScore ?? NOT_YET_REPORTED,
        },
        coalition: {
          classroomsActive: agg.classroomsActive,
          certificatesIssued: agg.certificatesIssued,
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
          totalFacilitators: agg.totalFacilitators,
          sessionsDelivered: agg.sessionsDelivered,
          avgFidelity: agg.avgFidelity ?? NOT_YET_REPORTED,
          totalDosageHours: agg.totalDosageHours,
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


  // Authenticated staff view — exact counts (no suppression), but unmeasured
  // values are still labeled "not yet reported" rather than placeholder zeros.
  app.get("/api/metrics/platform-wide", requireStaff, async (_req, res) => {
    try {
      const agg = await computeAggregates();

      const metrics = {
        engagement: {
          totalUsers: agg.totalStudents,
          activeUsers30d: agg.activeStudents30d,
          lessonsCompleted: agg.lessonsCompleted,
          quizzesCompleted: agg.quizzesCompleted,
        },
        prevention: {
          youthReached: agg.totalStudents,
          modulesCompleted: agg.lessonsCompleted,
          avgScore: agg.avgScore ?? NOT_YET_REPORTED,
        },
        coalition: {
          classroomsActive: agg.classroomsActive,
          certificatesIssued: agg.certificatesIssued,
        },
        workforce: {
          careerAssessments: NOT_YET_REPORTED,
          jobPlacements: NOT_YET_REPORTED,
        },
        grants: {
          applicationsInProgress: NOT_YET_REPORTED,
          totalFundingSecured: NOT_YET_REPORTED,
        },
        facilitator: {
          totalFacilitators: agg.totalFacilitators,
          sessionsDelivered: agg.sessionsDelivered,
          avgFidelity: agg.avgFidelity ?? NOT_YET_REPORTED,
          totalDosageHours: agg.totalDosageHours,
        },
        parent: {
          modulesCompleted: NOT_YET_REPORTED,
          familyAssessments: NOT_YET_REPORTED,
        },
        email: {
          inquiriesReceived: NOT_YET_REPORTED,
          responseRate: NOT_YET_REPORTED,
        },
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform metrics" });
    }
  });

  app.get("/api/metrics/trends/:category", requireStaff, async (req, res) => {
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

  app.post("/api/metrics/snapshot", requireStaff, async (_req, res) => {
    try {
      const agg = await computeAggregates();

      const snapshots = [
        { metricName: "Total Users", metricCategory: "engagement", currentValue: agg.totalStudents, previousValue: 0, targetValue: 100, unit: "count", trend: "stable" },
        { metricName: "Total Facilitators", metricCategory: "facilitator", currentValue: agg.totalFacilitators, previousValue: 0, targetValue: 10, unit: "count", trend: "stable" },
        { metricName: "Sessions Delivered", metricCategory: "facilitator", currentValue: agg.sessionsDelivered, previousValue: 0, targetValue: 50, unit: "count", trend: "stable" },
        { metricName: "Avg Fidelity", metricCategory: "fidelity", currentValue: agg.avgFidelity ?? 0, previousValue: 0, targetValue: 4.0, unit: "score", trend: "stable" },
        { metricName: "Total Dosage Hours", metricCategory: "operational", currentValue: agg.totalDosageHours, previousValue: 0, targetValue: 500, unit: "hours", trend: "stable" },
        { metricName: "Youth Reached", metricCategory: "reach", currentValue: agg.totalStudents, previousValue: 0, targetValue: 200, unit: "count", trend: "stable" },
      ];

      for (const snap of snapshots) {
        await db.insert(platformMetrics).values(snap);
      }

      res.json({ success: true, snapshotCount: snapshots.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to capture snapshot" });
    }
  });

  app.get("/api/metrics/stored", requireStaff, async (_req, res) => {
    try {
      const stored = await db.select().from(platformMetrics).orderBy(desc(platformMetrics.calculatedAt));
      res.json(stored);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stored metrics" });
    }
  });
}
