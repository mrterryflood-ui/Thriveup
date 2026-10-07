import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { 
  studentProgress, earnedBadges, academyPantherPower, 
  attendanceLogs, studentReflections,
  studentSelfAssessments, thriveScores, earlyWarningFlags,
  pathwayPlans
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
  // Add deprecation warning — migrate to /api/partner/v1/* with tcaf_ scoped keys
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "2027-01-01");
  res.setHeader("Link", '</api/partner/v1/docs>; rel="successor-version"');
  next();
};

export function registerCrossPlatformRoutes(app: Express) {
  app.get("/api/external/students/overview", requireApiKey, async (_req, res) => {
    try {
      const gradeFilter = _req.query.grade ? parseInt(_req.query.grade as string, 10) : null;
      const progress = await db.select().from(studentProgress);
      const power = await db.select().from(academyPantherPower);
      const pathways = await db.select().from(pathwayPlans);
      
      const powerMap = new Map(power.map(p => [p.userId, p]));
      const pathwayMap = new Map(pathways.map(pw => [pw.userId, pw]));
      
      let students = progress.map(p => {
        const uid = p.userId ?? "";
        const pp = uid ? powerMap.get(uid) : undefined;
        const pw = uid ? pathwayMap.get(uid) : undefined;
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
          pathway: pw ? {
            currentGrade: pw.currentGrade,
            primaryCareerInterest: pw.primaryCareerInterest,
            educationPathType: pw.educationPathType,
            pathwayStatus: pw.status,
          } : null,
        };
      });

      if (gradeFilter !== null && !isNaN(gradeFilter)) {
        students = students.filter(s => s.pathway?.currentGrade === gradeFilter);
      }

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
      const { interventions, origin } = req.body;
      if (!Array.isArray(interventions)) {
        return res.status(400).json({ error: "interventions must be an array" });
      }
      const { externalInterventions } = await import("@shared/schema");
      const originStr = String(origin || req.headers["x-rplice-origin"] || "unknown");
      const rows = interventions.map((iv: any) => ({
        origin: originStr,
        externalId: iv?.externalId ? String(iv.externalId) : iv?.id ? String(iv.id) : null,
        userId: iv?.userId ? String(iv.userId) : null,
        interventionType: iv?.type ? String(iv.type) : iv?.interventionType ? String(iv.interventionType) : null,
        payload: iv,
      }));
      let persisted = 0;
      if (rows.length > 0) {
        const inserted = await db.insert(externalInterventions).values(rows).returning({ id: externalInterventions.id });
        persisted = inserted.length;
      }
      res.json({ received: true, count: interventions.length, persisted, origin: originStr, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[interventions/receive]", error);
      res.status(500).json({ error: "Failed to receive interventions", detail: error?.message });
    }
  });

  app.get("/api/external/interventions/recent", requireApiKey, async (_req, res) => {
    try {
      const { externalInterventions } = await import("@shared/schema");
      const rows = await db.select().from(externalInterventions).orderBy(desc(externalInterventions.receivedAt)).limit(50);
      res.json({ count: rows.length, interventions: rows });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch interventions", detail: error?.message });
    }
  });

  app.get("/api/external/students/:userId/pathway", requireApiKey, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [plan] = await db.select().from(pathwayPlans).where(sql`${pathwayPlans.userId} = ${userId}`);
      if (!plan) {
        return res.json({ userId, pathway: null, timestamp: new Date().toISOString() });
      }
      res.json({
        userId,
        pathway: {
          userId: plan.userId,
          userName: plan.userName,
          currentGrade: plan.currentGrade,
          primaryCareerInterest: plan.primaryCareerInterest,
          secondaryCareerInterest: plan.secondaryCareerInterest,
          educationPathType: plan.educationPathType,
          completedMilestones: plan.completedMilestones,
          status: plan.status,
          revisionsThisYear: plan.revisionsThisYear,
          createdAt: plan.createdAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pathway data" });
    }
  });

  app.get("/api/external/pathways/overview", requireApiKey, async (_req, res) => {
    try {
      const allPlans = await db.select().from(pathwayPlans);
      const pathways = allPlans.map(plan => ({
        userId: plan.userId,
        userName: plan.userName,
        currentGrade: plan.currentGrade,
        primaryCareerInterest: plan.primaryCareerInterest,
        secondaryCareerInterest: plan.secondaryCareerInterest,
        educationPathType: plan.educationPathType,
        completedMilestones: plan.completedMilestones,
        status: plan.status,
        revisionsThisYear: plan.revisionsThisYear,
        createdAt: plan.createdAt,
      }));

      const gradeDistribution: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
      const educationPathCounts: Record<string, number> = {};
      let activeCount = 0;

      for (const plan of allPlans) {
        const grade = plan.currentGrade;
        if (grade >= 6 && grade <= 12) {
          gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        }
        const pathType = plan.educationPathType || "unspecified";
        educationPathCounts[pathType] = (educationPathCounts[pathType] || 0) + 1;
        if (plan.status === "active") {
          activeCount++;
        }
      }

      res.json({
        pathways,
        gradeDistribution,
        educationPathCounts,
        totalActive: activeCount,
        total: pathways.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pathways overview" });
    }
  });

  app.get("/api/external/health", requireApiKey, async (_req, res) => {
    res.json({ 
      status: "ok", 
      platform: "ThriveUp",
      version: "1.0",
      endpoints: [
        "GET /api/external/students/overview",
        "GET /api/external/students/:userId/thrive",
        "GET /api/external/students/:userId/assessments",
        "GET /api/external/students/:userId/pathway",
        "GET /api/external/attendance/summary",
        "GET /api/external/early-warnings",
        "GET /api/external/reflections/recent",
        "GET /api/external/pathways/overview",
        "POST /api/external/interventions/receive",
      ],
      timestamp: new Date().toISOString()
    });
  });
}
