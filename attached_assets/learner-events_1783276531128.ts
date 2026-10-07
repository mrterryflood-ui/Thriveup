// server/learner-events.ts
// ThriveUp — Learner Event Bus
// One learner action fires in multiple directions. Zero side-effect failures crash the primary request.

import { eq, and, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LearnerEventType =
  | "trade_lesson_completed"
  | "trade_completed"
  | "quest_completed"
  | "benefits_screening_done"
  | "job_placement_recorded";

export interface LearnerEvent {
  type: LearnerEventType;
  userId: string;
  userName: string;
  metadata: Record<string, unknown>;
}

// DrizzleDB type — matches the db instance exported from your db.ts / storage.ts
type DrizzleDB = Parameters<typeof import("drizzle-orm/node-postgres").drizzle>[0] extends infer T
  ? any
  : any;

// ─── Table imports (adjust path to match your project) ────────────────────────
import {
  studentProgress,
  certificates,
  academyDailyQuests,
  outcomeTracking,
  tradeSimsLessonProgress,
} from "../shared/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function awardXP(
  db: DrizzleDB,
  userId: string,
  userName: string,
  points: number,
  lessonsIncrement = 0
): Promise<void> {
  // Upsert: one row per user. Update if exists, insert if not.
  await db
    .insert(studentProgress)
    .values({
      userId,
      studentName: userName,
      totalPoints: points,
      lessonsCompleted: lessonsIncrement,
      currentLevel: 1,
      streakDays: 0,
      lastActiveDate: new Date().toISOString().split("T")[0],
    })
    .onConflictDoUpdate({
      target: studentProgress.userId,
      set: {
        totalPoints: sql`${studentProgress.totalPoints} + ${points}`,
        lessonsCompleted: sql`${studentProgress.lessonsCompleted} + ${lessonsIncrement}`,
        lastActiveDate: new Date().toISOString().split("T")[0],
      },
    });
}

async function checkAllLessonsComplete(
  db: DrizzleDB,
  userId: string,
  tradeId: number
): Promise<boolean> {
  // A trade is "complete" when the user has at least one completed lesson per
  // lesson in that trade and no lesson for this user+trade is still in_progress.
  const incomplete = await db
    .select({ count: count() })
    .from(tradeSimsLessonProgress)
    .where(
      and(
        eq(tradeSimsLessonProgress.userId, userId),
        eq(tradeSimsLessonProgress.tradeId, tradeId),
        eq(tradeSimsLessonProgress.status, "in_progress")
      )
    );

  const completed = await db
    .select({ count: count() })
    .from(tradeSimsLessonProgress)
    .where(
      and(
        eq(tradeSimsLessonProgress.userId, userId),
        eq(tradeSimsLessonProgress.tradeId, tradeId),
        eq(tradeSimsLessonProgress.status, "completed")
      )
    );

  const incompleteCount = incomplete[0]?.count ?? 1;
  const completedCount = completed[0]?.count ?? 0;

  return Number(incompleteCount) === 0 && Number(completedCount) > 0;
}

const TRADE_NAMES: Record<number, string> = {
  1: "Electrical",
  2: "Plumbing",
  3: "HVAC",
  4: "Welding",
  5: "Automotive",
  6: "Ag-Tech",
};

// ─── Event Handlers ───────────────────────────────────────────────────────────

async function handleTradeLessonCompleted(
  db: DrizzleDB,
  event: LearnerEvent
): Promise<void> {
  const { userId, userName, metadata } = event;
  const tradeId = metadata.tradeId as number;
  const lessonId = metadata.lessonId as number;

  // 1. Award 50 XP, increment lessons_completed
  await awardXP(db, userId, userName, 50, 1);

  // 2. Log to outcome_tracking
  await db.insert(outcomeTracking).values({
    userId,
    category: "workforce",
    metricName: "lesson_completed",
    metricValue: String(lessonId),
    source: "trade_sims",
    notes: `Trade ID: ${tradeId} | Score: ${metadata.score ?? "N/A"}`,
  });

  // 3. Check if entire trade is now complete → cascade event
  const tradeIsDone = await checkAllLessonsComplete(db, userId, tradeId);
  if (tradeIsDone) {
    await handleTradeCompleted(db, {
      type: "trade_completed",
      userId,
      userName,
      metadata: { tradeId },
    });
  }
}

async function handleTradeCompleted(
  db: DrizzleDB,
  event: LearnerEvent
): Promise<void> {
  const { userId, userName, metadata } = event;
  const tradeId = metadata.tradeId as number;
  const tradeName = TRADE_NAMES[tradeId] ?? `Trade ${tradeId}`;

  // 1. Award 200 XP bonus
  await awardXP(db, userId, userName, 200, 0);

  // 2. Issue certificate
  await db.insert(certificates).values({
    userId,
    userName,
    levelId: 1,
    levelTitle: `${tradeName} Trade Certification`,
  });

  // 3. Log trade certification to outcome_tracking
  await db.insert(outcomeTracking).values({
    userId,
    category: "workforce",
    metricName: "trade_certification_earned",
    metricValue: tradeName,
    source: "trade_sims",
    notes: `Completed all lessons for ${tradeName}`,
  });

  // 4. Check Workforce Pell eligibility: 3+ trade certifications earned
  const earnedCerts = await db
    .select({ count: count() })
    .from(outcomeTracking)
    .where(
      and(
        eq(outcomeTracking.userId, userId),
        eq(outcomeTracking.metricName, "trade_certification_earned")
      )
    );

  const certCount = Number(earnedCerts[0]?.count ?? 0);
  if (certCount >= 3) {
    await db.insert(outcomeTracking).values({
      userId,
      category: "financial_aid",
      metricName: "workforce_pell_eligible",
      metricValue: "true",
      source: "learner_events",
      notes: `Triggered at ${certCount} trade certifications`,
    });
  }
}

async function handleQuestCompleted(
  db: DrizzleDB,
  event: LearnerEvent
): Promise<void> {
  const { userId, userName, metadata } = event;
  const questId = metadata.questId as string;
  const rewardPoints = (metadata.rewardPoints as number) ?? 10;

  // 1. Award XP from quest reward
  await awardXP(db, userId, userName, rewardPoints, 0);

  // 2. Mark quest completed
  await db
    .update(academyDailyQuests)
    .set({
      completed: true,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(academyDailyQuests.id, questId),
        eq(academyDailyQuests.userId, userId)
      )
    );

  // 3. Log to outcome_tracking
  await db.insert(outcomeTracking).values({
    userId,
    category: "engagement",
    metricName: "quest_completed",
    metricValue: questId,
    source: "quests",
    notes: `Reward: ${rewardPoints} XP`,
  });
}

async function handleBenefitsScreeningDone(
  db: DrizzleDB,
  event: LearnerEvent
): Promise<void> {
  const { userId, metadata } = event;

  await db.insert(outcomeTracking).values({
    userId,
    category: "benefits",
    metricName: "screening_completed",
    metricValue: JSON.stringify(metadata.programsChecked ?? {}),
    source: "navigator",
    notes: `Screened on ${new Date().toLocaleDateString()}`,
  });
}

async function handleJobPlacementRecorded(
  db: DrizzleDB,
  event: LearnerEvent
): Promise<void> {
  const { userId, metadata } = event;

  await db.insert(outcomeTracking).values({
    userId,
    category: "employment",
    metricName: "job_placement",
    metricValue: String(metadata.employerName ?? "Unknown"),
    source: "workforce",
    notes: `Wage: ${metadata.wage} | Start: ${metadata.startDate}`,
  });
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function fireLearnerEvent(
  event: LearnerEvent,
  db: DrizzleDB
): Promise<void> {
  // All side effects are fire-and-forget wrapped in try/catch.
  // A failure here NEVER crashes the primary API request.
  try {
    switch (event.type) {
      case "trade_lesson_completed":
        await handleTradeLessonCompleted(db, event);
        break;
      case "trade_completed":
        await handleTradeCompleted(db, event);
        break;
      case "quest_completed":
        await handleQuestCompleted(db, event);
        break;
      case "benefits_screening_done":
        await handleBenefitsScreeningDone(db, event);
        break;
      case "job_placement_recorded":
        await handleJobPlacementRecorded(db, event);
        break;
      default:
        console.warn("[learner-events] Unknown event type:", (event as any).type);
    }
  } catch (err) {
    // Log but never throw — side effects must not crash the primary request
    console.error("[learner-events] Side effect failed for event:", event.type, err);
  }
}
