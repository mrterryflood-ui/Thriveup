import { db } from "./storage";
import { eq, and, count, sql, isNull, asc } from "drizzle-orm";
import {
  studentProgress,
  certificates,
  outcomeTracking,
  academyDailyQuests,
  tradeSimsLessons,
  tradeSimsLessonProgress,
  tradeSimsTrades,
  users,
} from "@shared/schema";
import { householdMembers } from "../shared/household-schema";
import { snapshotHouseholdOutcomes } from "./household-queries";

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

const TRADE_NAMES: Record<number, string> = {
  1: "Electrical", 2: "Plumbing", 3: "HVAC",
  4: "Welding", 5: "Automotive", 6: "Ag-Tech",
};

async function awardXP(userId: string, userName: string, xp: number, lessonsIncrement = 0) {
  const [existing] = await db
    .select({ id: studentProgress.id })
    .from(studentProgress)
    .where(eq(studentProgress.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(studentProgress).set({
      totalPoints: sql`${studentProgress.totalPoints} + ${xp}`,
      lessonsCompleted: sql`${studentProgress.lessonsCompleted} + ${lessonsIncrement}`,
      currentLevel: sql`GREATEST(1, floor((${studentProgress.totalPoints} + ${xp}) / 500.0)::int + 1)`,
      lastActiveDate: new Date().toISOString().slice(0, 10),
    }).where(eq(studentProgress.id, existing.id));
  } else {
    // Race-safe under uq_student_progress_user: if a concurrent request won
    // the insert, fall back to updating the winning row so XP is not lost.
    const [created] = await db.insert(studentProgress).values({
      userId, studentName: userName,
      totalPoints: xp, lessonsCompleted: lessonsIncrement,
      currentLevel: 1, streakDays: 0,
      lastActiveDate: new Date().toISOString().slice(0, 10),
    }).onConflictDoNothing().returning({ id: studentProgress.id });
    if (!created) {
      await db.update(studentProgress).set({
        totalPoints: sql`${studentProgress.totalPoints} + ${xp}`,
        lessonsCompleted: sql`${studentProgress.lessonsCompleted} + ${lessonsIncrement}`,
        lastActiveDate: new Date().toISOString().slice(0, 10),
      }).where(eq(studentProgress.userId, userId));
    }
  }
}

async function handleTradeLessonCompleted(event: LearnerEvent) {
  const { userId, userName, metadata } = event;
  const lessonId = Number(metadata.lessonId);

  await awardXP(userId, userName, 50, 1);

  await db.insert(outcomeTracking).values({
    userId, category: "workforce", metricName: "lesson_completed",
    metricValue: String(lessonId), source: "trade_sims",
    notes: `Score: ${metadata.score ?? "N/A"}`,
  });

  const [lesson] = await db
    .select({ tradeId: tradeSimsLessons.tradeId })
    .from(tradeSimsLessons)
    .where(eq(tradeSimsLessons.id, lessonId))
    .limit(1);
  if (!lesson) return;

  const [{ totalLessons }] = await db
    .select({ totalLessons: count() })
    .from(tradeSimsLessons)
    .where(and(eq(tradeSimsLessons.tradeId, lesson.tradeId), eq(tradeSimsLessons.active, true)));

  const [{ completedCount }] = await db
    .select({ completedCount: count() })
    .from(tradeSimsLessonProgress)
    .innerJoin(tradeSimsLessons, and(
      eq(tradeSimsLessonProgress.lessonId, tradeSimsLessons.id),
      eq(tradeSimsLessons.tradeId, lesson.tradeId),
    ))
    .where(and(
      eq(tradeSimsLessonProgress.userId, userId),
      eq(tradeSimsLessonProgress.status, "completed"),
    ));

  if (Number(completedCount) >= Number(totalLessons) && Number(totalLessons) > 0) {
    const [trade] = await db
      .select({ name: tradeSimsTrades.name })
      .from(tradeSimsTrades)
      .where(eq(tradeSimsTrades.id, lesson.tradeId))
      .limit(1);
    await handleTradeCompleted({
      type: "trade_completed", userId, userName,
      metadata: { tradeName: trade?.name ?? TRADE_NAMES[lesson.tradeId] ?? "Trade", tradeId: lesson.tradeId },
    });
  }
}

async function handleTradeCompleted(event: LearnerEvent) {
  const { userId, userName, metadata } = event;
  const tradeName = String(metadata.tradeName ?? "Trade");

  await awardXP(userId, userName, 200, 0);

  // Dedupe: the (userId, sourceKey) unique index makes issuance concurrency-
  // safe — simultaneous final-lesson completions race harmlessly and exactly
  // one insert wins. onConflictDoNothing + returning() tells us if we lost.
  const certTitle = `${tradeName} Trade Certification`;
  const tradeId = Number(metadata.tradeId);
  const [trade] = Number.isFinite(tradeId)
    ? await db.select({ slug: tradeSimsTrades.slug }).from(tradeSimsTrades).where(eq(tradeSimsTrades.id, tradeId)).limit(1)
    : [];
  const sourceKey = `trade-sim:${trade?.slug ?? tradeName.toLowerCase().replace(/\s+/g, "-")}`;

  // The credential must carry the learner's real name — the event pipeline
  // often only knows a placeholder ("Learner"), so resolve from the users row.
  const [u] = await db
    .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const realName =
    [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || u?.email || userName;

  // If a keyed certificate already exists, we're done — never claim or insert
  // another (also protects the legacy claim below from a unique violation).
  const [alreadyKeyed] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.sourceKey, sourceKey)))
    .limit(1);
  if (alreadyKeyed) return;

  // Claim a legacy pre-source_key certificate for this trade (and repair a
  // placeholder name) instead of minting a duplicate alongside it. Historical
  // duplicates are possible, so claim exactly ONE deterministic row (earliest
  // issued) by primary key; any extra legacy rows stay NULL-keyed (retired).
  const [legacy] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(and(
      eq(certificates.userId, userId),
      eq(certificates.levelTitle, certTitle),
      isNull(certificates.sourceKey),
    ))
    .orderBy(asc(certificates.issuedAt), asc(certificates.id))
    .limit(1);
  if (legacy) {
    // isNull guard keeps a concurrent claimer from double-writing. If a
    // concurrent insert won the (userId, sourceKey) key first, the update
    // hits the unique index — swallow it: a keyed certificate exists.
    try {
      await db
        .update(certificates)
        .set({ sourceKey, userName: realName })
        .where(and(eq(certificates.id, legacy.id), isNull(certificates.sourceKey)));
    } catch (err: any) {
      if (err?.code !== "23505") throw err;
    }
    return;
  }

  const inserted = await db.insert(certificates).values({
    userId, userName: realName, levelId: 1,
    levelTitle: certTitle,
    sourceKey,
  }).onConflictDoNothing({ target: [certificates.userId, certificates.sourceKey] }).returning({ id: certificates.id });
  if (inserted.length === 0) return; // already issued — don't duplicate outcome rows

  await db.insert(outcomeTracking).values({
    userId, category: "workforce", metricName: "trade_certification_earned",
    metricValue: tradeName, source: "trade_sims",
    notes: `Completed all lessons for ${tradeName}`,
  });

  const [{ certCount }] = await db
    .select({ certCount: count() })
    .from(outcomeTracking)
    .where(and(
      eq(outcomeTracking.userId, userId),
      eq(outcomeTracking.metricName, "trade_certification_earned"),
    ));

  if (Number(certCount) >= 3) {
    await db.insert(outcomeTracking).values({
      userId, category: "financial_aid", metricName: "workforce_pell_eligible",
      metricValue: "true", source: "learner_events",
      notes: `Triggered at ${certCount} trade certifications`,
    });
  }
}

async function handleQuestCompleted(event: LearnerEvent) {
  const { userId, userName, metadata } = event;
  const questId = String(metadata.questId ?? "");
  if (!questId) return;

  const [quest] = await db
    .select()
    .from(academyDailyQuests)
    .where(and(eq(academyDailyQuests.id, questId), eq(academyDailyQuests.userId, userId)))
    .limit(1);
  if (!quest || quest.completed) return;

  await awardXP(userId, userName, quest.rewardPoints ?? 10, 0);
  await db.update(academyDailyQuests)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(academyDailyQuests.id, questId));

  await db.insert(outcomeTracking).values({
    userId, category: "engagement", metricName: "quest_completed",
    metricValue: questId, source: "quests",
    notes: `Reward: ${quest.rewardPoints ?? 10} XP`,
  });
}

async function handleBenefitsScreeningDone(event: LearnerEvent) {
  const { userId, metadata } = event;
  await db.insert(outcomeTracking).values({
    userId, category: "benefits", metricName: "screening_completed",
    metricValue: JSON.stringify(metadata.programs ?? metadata.programsChecked ?? []),
    source: "navigator",
    notes: `Screened on ${new Date().toLocaleDateString()}`,
  });
}

async function handleJobPlacementRecorded(event: LearnerEvent) {
  const { userId, metadata } = event;
  await db.insert(outcomeTracking).values({
    userId, category: "employment", metricName: "job_placement",
    metricValue: String(metadata.employerName ?? ""),
    source: "workforce",
    notes: `Wage: ${metadata.wage ?? "N/A"} | Start: ${metadata.startDate ?? "N/A"}`,
  });
  // Update household employment flag when a member gets a job placement
  const [hm] = await db.select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId));
  if (hm) {
    await db.update(householdMembers)
      .set({ isEmployed: true, employmentWage: Math.round((Number(metadata.wage) || 0) * 100) })
      .where(eq(householdMembers.id, hm.id));
    await snapshotHouseholdOutcomes(hm.householdId).catch(
      (e) => console.error("[learner-events] household snapshot failed:", e)
    );
  }
}

export async function fireLearnerEvent(event: LearnerEvent): Promise<void> {
  try {
    switch (event.type) {
      case "trade_lesson_completed":  await handleTradeLessonCompleted(event); break;
      case "trade_completed":         await handleTradeCompleted(event); break;
      case "quest_completed":         await handleQuestCompleted(event); break;
      case "benefits_screening_done": await handleBenefitsScreeningDone(event); break;
      case "job_placement_recorded":  await handleJobPlacementRecorded(event); break;
    }
  } catch (err) {
    console.error(`[learner-events] fireLearnerEvent(${event.type}) failed silently:`, err);
  }
}
