import type { Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { engagementDosageLogs, cohortEnrollments } from "@shared/schema";
import { eq, and } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

interface DosageRouteConfig {
  pattern: RegExp;
  toolType: string;
  toolName: string;
  estimatedMinutes: number;
  methods: string[];
}

const TRACKED_ROUTES: DosageRouteConfig[] = [
  { pattern: /^\/api\/ai\/chat/, methods: ["POST"], toolType: "ai_chat", toolName: "AI Chat", estimatedMinutes: 5 },
  { pattern: /^\/api\/ai-tools\/.*\/generate/, methods: ["POST"], toolType: "ai_chat", toolName: "AI Creation Studio", estimatedMinutes: 8 },
  { pattern: /^\/api\/sparky\/chat/, methods: ["POST"], toolType: "ai_chat", toolName: "Sparky AI Companion", estimatedMinutes: 5 },
  { pattern: /^\/api\/companion\/chat/, methods: ["POST"], toolType: "ai_chat", toolName: "Spark AI Companion", estimatedMinutes: 5 },
  { pattern: /^\/api\/navigator\/chat/, methods: ["POST"], toolType: "navigator", toolName: "AI Navigator", estimatedMinutes: 5 },
  { pattern: /^\/api\/progress\/complete-lesson/, methods: ["POST"], toolType: "lesson", toolName: "Lesson Completion", estimatedMinutes: 15 },
  { pattern: /^\/api\/quiz\/submit/, methods: ["POST"], toolType: "assessment", toolName: "Quiz Submission", estimatedMinutes: 10 },
  { pattern: /^\/api\/quiz\/.*\/submit/, methods: ["POST"], toolType: "assessment", toolName: "Quiz Submission", estimatedMinutes: 10 },
  { pattern: /^\/api\/academy\/self-assessment/, methods: ["POST"], toolType: "self_assessment", toolName: "Self Assessment", estimatedMinutes: 10 },
  { pattern: /^\/api\/academy\/scenarios\/.*\/choose/, methods: ["POST"], toolType: "scenario", toolName: "Adventure Scenario", estimatedMinutes: 8 },
  { pattern: /^\/api\/academy\/quests\/.*\/complete/, methods: ["POST", "PATCH"], toolType: "quiz", toolName: "Daily Quest", estimatedMinutes: 5 },
  { pattern: /^\/api\/academy\/journal/, methods: ["POST"], toolType: "journal", toolName: "Student Journal", estimatedMinutes: 10 },
  { pattern: /^\/api\/career\/explore/, methods: ["POST", "GET"], toolType: "career_explorer", toolName: "Career Explorer", estimatedMinutes: 5 },
  { pattern: /^\/api\/academy\/careers/, methods: ["POST"], toolType: "career_explorer", toolName: "Career Exploration", estimatedMinutes: 5 },
  { pattern: /^\/api\/games\/sessions/, methods: ["POST"], toolType: "game", toolName: "Game Session", estimatedMinutes: 15 },
  { pattern: /^\/api\/academy\/financial-literacy/, methods: ["POST"], toolType: "financial_literacy", toolName: "Financial Literacy", estimatedMinutes: 10 },
  { pattern: /^\/api\/staar\/assessments/, methods: ["POST"], toolType: "assessment", toolName: "STAAR Test Prep", estimatedMinutes: 15 },
  { pattern: /^\/api\/courses\/.*\/lessons\/.*\/complete/, methods: ["POST", "PATCH"], toolType: "course", toolName: "Course Lesson", estimatedMinutes: 15 },
  { pattern: /^\/api\/workforce\/assessments/, methods: ["POST"], toolType: "assessment", toolName: "Workforce Assessment", estimatedMinutes: 20 },
  { pattern: /^\/api\/parent-education\/progress/, methods: ["POST"], toolType: "parent_education", toolName: "Parent Education Module", estimatedMinutes: 15 },
  { pattern: /^\/api\/parent-education\/family-assessments/, methods: ["POST"], toolType: "family_assessment", toolName: "Family Assessment", estimatedMinutes: 10 },
  { pattern: /^\/api\/parent-education\/conversation-starters/, methods: ["POST"], toolType: "ai_chat", toolName: "AI Conversation Starters", estimatedMinutes: 5 },
];

export function dosageTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = getUserId(req);
  if (!userId) {
    next();
    return;
  }

  const matchedRoute = TRACKED_ROUTES.find(
    route => route.methods.includes(req.method) && route.pattern.test(req.path)
  );

  if (!matchedRoute) {
    next();
    return;
  }

  const startTime = Date.now();

  res.on("finish", () => {
    if (res.statusCode >= 400) return;

    const elapsedMs = Date.now() - startTime;
    const elapsedMinutes = elapsedMs / 60000;

    db.select().from(cohortEnrollments)
      .where(and(
        eq(cohortEnrollments.userId, userId),
        eq(cohortEnrollments.status, "active")
      ))
      .then(enrollments => {
        const cohortId = enrollments.length > 0 ? enrollments[0].cohortId : null;
        return db.insert(engagementDosageLogs).values({
          userId,
          cohortId,
          toolType: matchedRoute.toolType,
          toolName: matchedRoute.toolName,
          durationMinutes: elapsedMinutes,
          sessionDate: new Date().toISOString().split("T")[0],
          metadata: {
            requestPath: req.path,
            method: req.method,
            elapsedMs,
            estimatedMinutes: matchedRoute.estimatedMinutes,
          },
        });
      })
      .catch(err => {
        console.error("Failed to log dosage:", err);
      });
  });

  next();
}
