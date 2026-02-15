import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { 
  studentProgress, earnedBadges, academyPantherPower, 
  attendanceLogs, studentReflections,
  studentSelfAssessments, thriveScores, earlyWarningFlags
} from "@shared/schema";
import { eq, desc, gte, sql } from "drizzle-orm";

const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const rawKey = req.headers["x-api-key"];
  const validKey = process.env.CROSS_PLATFORM_API_KEY;
  if (!validKey) return res.status(503).json({ error: "API key not configured" });
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : null;
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  next();
};

export function registerCrossPlatformRoutes(app: Express) {
  app.get("/api/external/students/overview", requireApiKey, async (_req, res) => {
    try {
      const progress = await db.select().from(studentProgress);
      const power = await db.select().from(academyPantherPower);
      
      const powerMap = new Map(power.map(p => [p.userId, p]));
      
      const students = progress.map(p => {
        const uid = p.userId ?? "";
        const pp = uid ? powerMap.get(uid) : undefined;
        return {
          userId: p.userId,
          studentName: p.studentName,
          totalPoints: p.totalPoints,
          currentStreak: p.streakDays,
          longestStreak: p.longestStreak,
          lessonsCompleted: p.lessonsCompleted,
          quizzesCompleted: p.quizzesCompleted,
          lastActiveDate: p.lastActiveDate,
          pantherPower: pp ? {
            totalScore: pp.totalScore,
            education: pp.educationScore,
            character: pp.characterScore,
            leadership: pp.leadershipScore,
            entrepreneurship: pp.entrepreneurshipScore,
            community: pp.communityScore,
            level: pp.level,
            title: pp.title,
          } : null,
        };
      });
      res.json({ students, count: students.length, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student overview" });
    }
  });

  app.get("/api/external/students/:userId/thrive", requireApiKey, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [score] = await db.select().from(thriveScores).where(sql`${thriveScores.userId} = ${userId}`);
      const flags = await db.select().from(earlyWarningFlags).where(sql`${earlyWarningFlags.userId} = ${userId}`).orderBy(desc(earlyWarningFlags.createdAt));
      res.json({ 
        userId,
        thriveScore: score || null, 
        earlyWarningFlags: flags,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thrive data" });
    }
  });

  app.get("/api/external/students/:userId/assessments", requireApiKey, async (req, res) => {
    try {
      const userId = req.params.userId;
      const assessments = await db.select().from(studentSelfAssessments)
        .where(sql`${studentSelfAssessments.userId} = ${userId}`)
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(30);
      res.json({ userId, assessments, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/external/attendance/summary", requireApiKey, async (_req, res) => {
    try {
      const logs = await db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.loginTime));
      const studentMap = new Map<string, { name: string; logins: number; lastLogin: string; dates: string[] }>();
      for (const log of logs) {
        const existing = studentMap.get(log.userId);
        if (existing) {
          existing.logins++;
          existing.dates.push(log.loginDate);
        } else {
          studentMap.set(log.userId, { name: log.studentName, logins: 1, lastLogin: log.loginDate, dates: [log.loginDate] });
        }
      }
      const summary = Array.from(studentMap.entries()).map(([userId, data]) => ({
        userId, studentName: data.name, totalLogins: data.logins, lastLogin: data.lastLogin,
        uniqueDays: new Set(data.dates).size,
      }));
      res.json({ summary, totalStudents: summary.length, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance summary" });
    }
  });

  app.get("/api/external/early-warnings", requireApiKey, async (_req, res) => {
    try {
      const flags = await db.select({
        id: earlyWarningFlags.id,
        userId: earlyWarningFlags.userId,
        flagLevel: earlyWarningFlags.flagLevel,
        triggerClass: earlyWarningFlags.triggerClass,
        whatChanged: earlyWarningFlags.whatChanged,
        whyItMatters: earlyWarningFlags.whyItMatters,
        resolvedAt: earlyWarningFlags.resolvedAt,
        createdAt: earlyWarningFlags.createdAt,
      }).from(earlyWarningFlags).orderBy(desc(earlyWarningFlags.createdAt));
      res.json({ flags, count: flags.length, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch early warnings" });
    }
  });

  app.get("/api/external/reflections/recent", requireApiKey, async (_req, res) => {
    try {
      const recent = await db.select({
        userId: studentReflections.userId,
        studentName: studentReflections.studentName,
        entryDate: studentReflections.entryDate,
        period: studentReflections.period,
        mood: studentReflections.mood,
      }).from(studentReflections).orderBy(desc(studentReflections.createdAt)).limit(50);
      const needsAttention = recent.filter(r => r.mood === "tired" || r.mood === "neutral");
      res.json({ 
        recentReflections: recent, 
        needsAttention,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reflections" });
    }
  });

  app.post("/api/external/interventions/receive", requireApiKey, async (req, res) => {
    try {
      const { interventions } = req.body;
      if (!Array.isArray(interventions)) {
        return res.status(400).json({ error: "interventions must be an array" });
      }
      res.json({ received: true, count: interventions.length, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to receive interventions" });
    }
  });

  app.get("/api/external/health", requireApiKey, async (_req, res) => {
    res.json({ 
      status: "ok", 
      platform: "TxEA Learning Academy",
      version: "1.0",
      endpoints: [
        "GET /api/external/students/overview",
        "GET /api/external/students/:userId/thrive",
        "GET /api/external/students/:userId/assessments",
        "GET /api/external/attendance/summary",
        "GET /api/external/early-warnings",
        "GET /api/external/reflections/recent",
        "POST /api/external/interventions/receive",
      ],
      timestamp: new Date().toISOString()
    });
  });
}
