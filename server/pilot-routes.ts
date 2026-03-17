import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  pilotCohorts, cohortEnrollments, engagementDosageLogs,
  insertPilotCohortSchema, insertCohortEnrollmentSchema, insertEngagementDosageLogSchema,
  outcomeTracking,
} from "@shared/schema";
import { eq, desc, sql, and, gte, lte, inArray, count, type SQL } from "drizzle-orm";
import { storage } from "./storage";

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

export function registerPilotRoutes(app: Express) {

  app.get("/api/pilot/cohorts", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const cohorts = await db.select().from(pilotCohorts).orderBy(desc(pilotCohorts.createdAt));
      res.json(cohorts);
    } catch (error) {
      console.error("Failed to fetch cohorts:", error);
      res.status(500).json({ error: "Failed to fetch cohorts" });
    }
  });

  app.get("/api/pilot/cohorts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [cohort] = await db.select().from(pilotCohorts).where(eq(pilotCohorts.id, String(req.params.id)));
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      res.json(cohort);
    } catch (error) {
      console.error("Failed to fetch cohort:", error);
      res.status(500).json({ error: "Failed to fetch cohort" });
    }
  });

  app.post("/api/pilot/cohorts", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertPilotCohortSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid cohort data", details: parsed.error.flatten().fieldErrors });
      const userId = getUserId(req);
      const [cohort] = await db.insert(pilotCohorts).values({ ...parsed.data, createdBy: userId }).returning();
      res.json(cohort);
    } catch (error) {
      console.error("Failed to create cohort:", error);
      res.status(500).json({ error: "Failed to create cohort" });
    }
  });

  app.patch("/api/pilot/cohorts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name, description, targetPopulation, targetSize, startDate, endDate, status } = req.body;
      const [updated] = await db.update(pilotCohorts).set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(targetPopulation && { targetPopulation }),
        ...(targetSize && { targetSize }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(status && { status }),
        updatedAt: new Date(),
      }).where(eq(pilotCohorts.id, String(req.params.id))).returning();
      if (!updated) return res.status(404).json({ error: "Cohort not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update cohort:", error);
      res.status(500).json({ error: "Failed to update cohort" });
    }
  });

  app.delete("/api/pilot/cohorts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(cohortEnrollments).where(eq(cohortEnrollments.cohortId, String(req.params.id)));
      await db.delete(pilotCohorts).where(eq(pilotCohorts.id, String(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete cohort:", error);
      res.status(500).json({ error: "Failed to delete cohort" });
    }
  });

  app.get("/api/pilot/cohorts/:id/enrollments", requireAuth, requireAdmin, async (req, res) => {
    try {
      const enrollments = await db.select().from(cohortEnrollments)
        .where(eq(cohortEnrollments.cohortId, String(req.params.id)))
        .orderBy(desc(cohortEnrollments.enrolledAt));
      res.json(enrollments);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/pilot/cohorts/:id/enroll", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCohortEnrollmentSchema.safeParse({
        ...req.body,
        cohortId: req.params.id,
      });
      if (!parsed.success) return res.status(400).json({ error: "Invalid enrollment data", details: parsed.error.flatten().fieldErrors });
      const [enrollment] = await db.insert(cohortEnrollments).values(parsed.data).returning();
      res.json(enrollment);
    } catch (error) {
      console.error("Failed to enroll participant:", error);
      res.status(500).json({ error: "Failed to enroll participant" });
    }
  });

  app.patch("/api/pilot/enrollments/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const updateData: Record<string, unknown> = {};
      if (status) {
        updateData.status = status;
        if (status === "completed") updateData.completedAt = new Date();
      }
      if (notes !== undefined) updateData.notes = notes;
      const [updated] = await db.update(cohortEnrollments).set(updateData).where(eq(cohortEnrollments.id, String(req.params.id))).returning();
      if (!updated) return res.status(404).json({ error: "Enrollment not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update enrollment:", error);
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  });

  app.post("/api/dosage/log", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertEngagementDosageLogSchema.safeParse({
        ...req.body,
        sessionDate: req.body.sessionDate || new Date().toISOString().split("T")[0],
      });
      if (!parsed.success) return res.status(400).json({ error: "Invalid dosage data", details: parsed.error.flatten().fieldErrors });
      const MAX_DURATION_MINUTES = 480;
      if (parsed.data.durationMinutes > MAX_DURATION_MINUTES) {
        return res.status(400).json({ error: `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes (8 hours)` });
      }
      if (parsed.data.durationMinutes <= 0) {
        return res.status(400).json({ error: "Duration must be positive" });
      }
      const [log] = await db.insert(engagementDosageLogs).values(parsed.data).returning();
      res.json(log);
    } catch (error) {
      console.error("Failed to log dosage:", error);
      res.status(500).json({ error: "Failed to log dosage" });
    }
  });

  app.get("/api/dosage/logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, toolType, startDate, endDate, cohortId } = req.query;
      let conditions: SQL[] = [];
      if (userId) conditions.push(eq(engagementDosageLogs.userId, userId as string));
      if (toolType) conditions.push(eq(engagementDosageLogs.toolType, toolType as string));
      if (startDate) conditions.push(gte(engagementDosageLogs.sessionDate, startDate as string));
      if (endDate) conditions.push(lte(engagementDosageLogs.sessionDate, endDate as string));

      let query;
      if (cohortId) {
        const enrollments = await db.select().from(cohortEnrollments)
          .where(eq(cohortEnrollments.cohortId, cohortId as string));
        const enrolledUserIds = enrollments.map(e => e.userId);
        if (enrolledUserIds.length > 0) {
          conditions.push(inArray(engagementDosageLogs.userId, enrolledUserIds));
        } else {
          return res.json([]);
        }
      }

      if (conditions.length > 0) {
        query = db.select().from(engagementDosageLogs).where(and(...conditions)).orderBy(desc(engagementDosageLogs.createdAt));
      } else {
        query = db.select().from(engagementDosageLogs).orderBy(desc(engagementDosageLogs.createdAt));
      }

      const logs = await query;
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch dosage logs:", error);
      res.status(500).json({ error: "Failed to fetch dosage logs" });
    }
  });

  app.get("/api/dosage/summary", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { cohortId, startDate, endDate, userId, toolType } = req.query;
      let conditions: SQL[] = [];
      if (startDate) conditions.push(gte(engagementDosageLogs.sessionDate, startDate as string));
      if (endDate) conditions.push(lte(engagementDosageLogs.sessionDate, endDate as string));
      if (userId) conditions.push(eq(engagementDosageLogs.userId, userId as string));
      if (toolType) conditions.push(eq(engagementDosageLogs.toolType, toolType as string));

      let enrolledUserIds: string[] | null = null;
      if (cohortId) {
        const enrollments = await db.select().from(cohortEnrollments)
          .where(eq(cohortEnrollments.cohortId, cohortId as string));
        enrolledUserIds = enrollments.map(e => e.userId);
        if (enrolledUserIds.length > 0) {
          conditions.push(inArray(engagementDosageLogs.userId, enrolledUserIds));
        } else {
          return res.json({ totalMinutes: 0, totalSessions: 0, uniqueParticipants: 0, byToolType: {}, byParticipant: [] });
        }
      }

      let allLogs;
      if (conditions.length > 0) {
        allLogs = await db.select().from(engagementDosageLogs).where(and(...conditions));
      } else {
        allLogs = await db.select().from(engagementDosageLogs);
      }

      const totalMinutes = allLogs.reduce((s, l) => s + l.durationMinutes, 0);
      const uniqueUsers = new Set(allLogs.map(l => l.userId));
      const byToolType: Record<string, { sessions: number; totalMinutes: number }> = {};
      const byParticipant: Record<string, { userId: string; totalMinutes: number; sessions: number; toolTypes: Set<string> }> = {};

      for (const log of allLogs) {
        if (!byToolType[log.toolType]) byToolType[log.toolType] = { sessions: 0, totalMinutes: 0 };
        byToolType[log.toolType].sessions++;
        byToolType[log.toolType].totalMinutes += log.durationMinutes;

        if (!byParticipant[log.userId]) byParticipant[log.userId] = { userId: log.userId, totalMinutes: 0, sessions: 0, toolTypes: new Set() };
        byParticipant[log.userId].totalMinutes += log.durationMinutes;
        byParticipant[log.userId].sessions++;
        byParticipant[log.userId].toolTypes.add(log.toolType);
      }

      const participantList = Object.values(byParticipant).map(p => ({
        userId: p.userId,
        totalMinutes: Math.round(p.totalMinutes * 100) / 100,
        totalHours: Math.round((p.totalMinutes / 60) * 100) / 100,
        sessions: p.sessions,
        toolTypesUsed: p.toolTypes.size,
      })).sort((a, b) => b.totalMinutes - a.totalMinutes);

      res.json({
        totalMinutes: Math.round(totalMinutes * 100) / 100,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        totalSessions: allLogs.length,
        uniqueParticipants: uniqueUsers.size,
        byToolType,
        byParticipant: participantList,
      });
    } catch (error) {
      console.error("Failed to fetch dosage summary:", error);
      res.status(500).json({ error: "Failed to fetch dosage summary" });
    }
  });

  app.get("/api/pilot/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const allCohorts = await db.select().from(pilotCohorts).orderBy(desc(pilotCohorts.createdAt));
      const allEnrollments = await db.select().from(cohortEnrollments);
      const allLogs = await db.select().from(engagementDosageLogs);
      const allOutcomes = await db.select().from(outcomeTracking);

      const cohortSummaries = allCohorts.map(cohort => {
        const enrollments = allEnrollments.filter(e => e.cohortId === cohort.id);
        const enrolledUserIds = enrollments.map(e => e.userId);
        const cohortLogs = allLogs.filter(l =>
          l.cohortId === cohort.id || (l.cohortId === null && enrolledUserIds.includes(l.userId))
        );
        const totalMinutes = cohortLogs.reduce((s, l) => s + l.durationMinutes, 0);
        const activeEnrollments = enrollments.filter(e => e.status === "active").length;
        const completedEnrollments = enrollments.filter(e => e.status === "completed").length;

        const cohortOutcomes = allOutcomes.filter(o =>
          o.cohortId === cohort.id || (o.cohortId === null && enrolledUserIds.includes(o.userId))
        );
        const outcomeCategoryBreakdown: Record<string, number> = {};
        for (const o of cohortOutcomes) {
          outcomeCategoryBreakdown[o.category] = (outcomeCategoryBreakdown[o.category] || 0) + 1;
        }

        const toolTypeBreakdown: Record<string, number> = {};
        for (const l of cohortLogs) {
          toolTypeBreakdown[l.toolType] = (toolTypeBreakdown[l.toolType] || 0) + l.durationMinutes;
        }

        return {
          ...cohort,
          enrollmentCount: enrollments.length,
          activeEnrollments,
          completedEnrollments,
          completionRate: enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0,
          totalServiceMinutes: Math.round(totalMinutes * 100) / 100,
          totalServiceHours: Math.round((totalMinutes / 60) * 100) / 100,
          avgMinutesPerParticipant: enrolledUserIds.length > 0 ? Math.round((totalMinutes / enrolledUserIds.length) * 100) / 100 : 0,
          outcomesCount: cohortOutcomes.length,
          outcomeCategoryBreakdown,
          toolTypeBreakdown,
        };
      });

      const totalEnrollments = allEnrollments.length;
      const allEnrolledUserIds = new Set(allEnrollments.map(e => e.userId));
      const enrolledLogs = allLogs.filter(l => allEnrolledUserIds.has(l.userId));
      const totalServiceMinutes = enrolledLogs.reduce((s, l) => s + l.durationMinutes, 0);
      const uniqueParticipants = allEnrolledUserIds.size;

      res.json({
        cohorts: cohortSummaries,
        totals: {
          totalCohorts: allCohorts.length,
          totalEnrollments,
          uniqueParticipants,
          totalServiceMinutes: Math.round(totalServiceMinutes * 100) / 100,
          totalServiceHours: Math.round((totalServiceMinutes / 60) * 100) / 100,
          activeCohorts: allCohorts.filter(c => c.status === "active").length,
        },
      });
    } catch (error) {
      console.error("Failed to fetch pilot dashboard:", error);
      res.status(500).json({ error: "Failed to fetch pilot dashboard" });
    }
  });

  app.get("/api/dosage/service-hours", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { cohortId, userId, toolType, startDate, endDate } = req.query;
      const conditions: SQL[] = [];

      if (cohortId) conditions.push(eq(engagementDosageLogs.cohortId, cohortId as string));
      if (userId) conditions.push(eq(engagementDosageLogs.userId, userId as string));
      if (toolType) conditions.push(eq(engagementDosageLogs.toolType, toolType as string));
      if (startDate) conditions.push(gte(engagementDosageLogs.sessionDate, startDate as string));
      if (endDate) conditions.push(lte(engagementDosageLogs.sessionDate, endDate as string));

      let logs;
      if (conditions.length > 0) {
        logs = await db.select().from(engagementDosageLogs).where(and(...conditions));
      } else {
        logs = await db.select().from(engagementDosageLogs);
      }

      const byUser: Record<string, { userId: string; toolBreakdown: Record<string, number>; totalMinutes: number }> = {};
      for (const log of logs) {
        if (!byUser[log.userId]) byUser[log.userId] = { userId: log.userId, toolBreakdown: {}, totalMinutes: 0 };
        byUser[log.userId].totalMinutes += log.durationMinutes;
        byUser[log.userId].toolBreakdown[log.toolType] = (byUser[log.userId].toolBreakdown[log.toolType] || 0) + log.durationMinutes;
      }

      const report = Object.values(byUser).map(u => ({
        userId: u.userId,
        totalMinutes: Math.round(u.totalMinutes * 100) / 100,
        totalHours: Math.round((u.totalMinutes / 60) * 100) / 100,
        toolBreakdown: Object.entries(u.toolBreakdown).map(([tool, mins]) => ({
          toolType: tool,
          minutes: Math.round(mins * 100) / 100,
          hours: Math.round((mins / 60) * 100) / 100,
        })),
      })).sort((a, b) => b.totalMinutes - a.totalMinutes);

      res.json(report);
    } catch (error) {
      console.error("Failed to fetch service hours:", error);
      res.status(500).json({ error: "Failed to fetch service hours" });
    }
  });

  app.get("/api/dosage/export/csv", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { cohortId, userId, toolType, startDate, endDate } = req.query;
      const conditions: SQL[] = [];
      if (cohortId) conditions.push(eq(engagementDosageLogs.cohortId, cohortId as string));
      if (userId) conditions.push(eq(engagementDosageLogs.userId, userId as string));
      if (toolType) conditions.push(eq(engagementDosageLogs.toolType, toolType as string));
      if (startDate) conditions.push(gte(engagementDosageLogs.sessionDate, startDate as string));
      if (endDate) conditions.push(lte(engagementDosageLogs.sessionDate, endDate as string));

      let logs;
      if (conditions.length > 0) {
        logs = await db.select().from(engagementDosageLogs).where(and(...conditions)).orderBy(desc(engagementDosageLogs.createdAt));
      } else {
        logs = await db.select().from(engagementDosageLogs).orderBy(desc(engagementDosageLogs.createdAt));
      }

      const headers = ["userId", "toolType", "toolName", "durationMinutes", "sessionDate", "createdAt"];
      const csvRows = [headers.join(",")];
      for (const l of logs) {
        csvRows.push([
          l.userId,
          l.toolType,
          `"${l.toolName}"`,
          l.durationMinutes.toString(),
          l.sessionDate,
          l.createdAt ? new Date(l.createdAt).toISOString() : "",
        ].join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=dosage_report.csv");
      res.send(csvRows.join("\n"));
    } catch (error) {
      console.error("Failed to export dosage CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/pilot/export/csv", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { cohortId } = req.query;
      let enrollments;
      if (cohortId) {
        enrollments = await db.select().from(cohortEnrollments)
          .where(eq(cohortEnrollments.cohortId, cohortId as string));
      } else {
        enrollments = await db.select().from(cohortEnrollments);
      }

      const allLogs = await db.select().from(engagementDosageLogs);
      const cohorts = await db.select().from(pilotCohorts);
      const cohortMap = Object.fromEntries(cohorts.map(c => [c.id, c.name]));

      const headers = ["cohortName", "userId", "participantName", "status", "enrolledAt", "totalServiceMinutes", "totalServiceHours"];
      const csvRows = [headers.join(",")];

      for (const e of enrollments) {
        const userLogs = allLogs.filter(l =>
          l.userId === e.userId && (l.cohortId === e.cohortId || l.cohortId === null)
        );
        const totalMins = userLogs.reduce((s, l) => s + l.durationMinutes, 0);
        csvRows.push([
          `"${cohortMap[e.cohortId] || e.cohortId}"`,
          e.userId,
          `"${e.participantName}"`,
          e.status,
          e.enrolledAt ? new Date(e.enrolledAt).toISOString() : "",
          Math.round(totalMins * 100) / 100,
          Math.round((totalMins / 60) * 100) / 100,
        ].join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=pilot_data.csv");
      res.send(csvRows.join("\n"));
    } catch (error) {
      console.error("Failed to export pilot CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/outcomes/by-cohort/:cohortId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const cohortId = String(req.params.cohortId);
      const directOutcomes = await db.select().from(outcomeTracking)
        .where(eq(outcomeTracking.cohortId, cohortId))
        .orderBy(desc(outcomeTracking.measurementDate));

      if (directOutcomes.length > 0) {
        return res.json(directOutcomes);
      }

      const enrollments = await db.select().from(cohortEnrollments)
        .where(eq(cohortEnrollments.cohortId, cohortId));
      const userIds = enrollments.map(e => e.userId);
      if (userIds.length === 0) return res.json([]);
      const outcomes = await db.select().from(outcomeTracking)
        .where(inArray(outcomeTracking.userId, userIds))
        .orderBy(desc(outcomeTracking.measurementDate));
      res.json(outcomes);
    } catch (error) {
      console.error("Failed to fetch cohort outcomes:", error);
      res.status(500).json({ error: "Failed to fetch cohort outcomes" });
    }
  });
}
