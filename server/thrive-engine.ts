import {
  completedLessons,
  pathwayPlans,
  planRevisions,
  academyDailyQuests,
  academyChoiceLogs,
  academyScenarioRuns,
  mentorRequests,
  academyMeritEvents,
  academyCompetitionEntries,
  studentSelfAssessments,
  gisContextData,
  academyPantherPower,
  academyCampusProjects,
  thriveScores,
  thriveHistory,
  academyAvatars,
  healthScreeningResults,
  type ThriveHistory,
} from "@shared/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export interface ThriveScoreResult {
  domainA: { score: number; trend: string };
  domainB: { score: number; trend: string };
  domainC: { score: number; trend: string };
  domainD: { score: number | null; trend: string | null; active: boolean };
  domainE: { score: number; trend: string };
  domainF: { score: number; trend: string };
  composite: { score: number; trend: string };
  flagLevel: string | null;
  nextBestActions: string[];
}

export async function computeDomainA(db: any, userId: string): Promise<number> {
  try {
    const cutoff = thirtyDaysAgo();

    const recentLessons = await db
      .select({ cnt: count() })
      .from(completedLessons)
      .where(gte(completedLessons.completedAt, cutoff));

    const userLessons = await db
      .select({ cnt: count() })
      .from(completedLessons)
      .innerJoin(
        sql`student_progress sp`,
        sql`sp.id = ${completedLessons.progressId} AND sp.user_id = ${userId}`
      )
      .where(gte(completedLessons.completedAt, cutoff));

    const lessonCount = Number(userLessons[0]?.cnt ?? 0);
    const attendanceScore = clamp(Math.min(lessonCount * 10, 100));

    const plans = await db
      .select()
      .from(pathwayPlans)
      .where(eq(pathwayPlans.userId, userId))
      .limit(1);
    const milestones = plans[0]?.completedMilestones ?? [];
    const milestoneScore = clamp(Math.min((Array.isArray(milestones) ? milestones.length : 0) * 15, 100));

    const questResults = await db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${academyDailyQuests.completed} = true)`,
      })
      .from(academyDailyQuests)
      .where(eq(academyDailyQuests.userId, userId));

    const totalQuests = Number(questResults[0]?.total ?? 0);
    const completedQuests = Number(questResults[0]?.completed ?? 0);
    const questScore = totalQuests > 0 ? clamp((completedQuests / totalQuests) * 100) : 50;

    const revisionResults = await db
      .select({ cnt: count() })
      .from(planRevisions)
      .where(
        and(
          eq(planRevisions.userId, userId),
          gte(planRevisions.createdAt, cutoff)
        )
      );
    const revisionCount = Number(revisionResults[0]?.cnt ?? 0);
    const portfolioScore = clamp(Math.min(revisionCount * 20, 100));

    const domainA = (attendanceScore * 0.30 + milestoneScore * 0.25 + questScore * 0.25 + portfolioScore * 0.20);
    return clamp(Math.round(domainA));
  } catch (error) {
    console.error("[Thrive Engine] Error computing Domain A:", error);
    return 50;
  }
}

export async function computeDomainB(db: any, userId: string): Promise<number> {
  try {
    const cutoff = thirtyDaysAgo();

    const assessments = await db
      .select()
      .from(studentSelfAssessments)
      .where(
        and(
          eq(studentSelfAssessments.userId, userId),
          gte(studentSelfAssessments.createdAt, cutoff)
        )
      );

    let reflectionScore = 50;
    if (assessments.length > 0) {
      const withReflection = assessments.filter(
        (a: any) => a.reflectionText && a.reflectionText.length > 0
      );
      const presenceRatio = withReflection.length / assessments.length;
      const avgLength =
        withReflection.length > 0
          ? withReflection.reduce((sum: number, a: any) => sum + (a.reflectionText?.length ?? 0), 0) / withReflection.length
          : 0;
      const lengthScore = clamp(Math.min(avgLength / 2, 100));
      reflectionScore = clamp(presenceRatio * 50 + lengthScore * 0.5);
    }

    const revisions = await db
      .select()
      .from(planRevisions)
      .where(
        and(
          eq(planRevisions.userId, userId),
          gte(planRevisions.createdAt, cutoff)
        )
      );
    let justificationScore = 50;
    if (revisions.length > 0) {
      const withReason = revisions.filter(
        (r: any) => r.requestReason && r.requestReason.length > 20
      );
      justificationScore = clamp((withReason.length / revisions.length) * 100);
    }

    const choiceLogs = await db
      .select()
      .from(academyChoiceLogs)
      .where(
        and(
          eq(academyChoiceLogs.userId, userId),
          gte(academyChoiceLogs.createdAt, cutoff)
        )
      );
    let decisionScore = 50;
    if (choiceLogs.length > 0) {
      const deliberateChoices = choiceLogs.filter((c: any) => {
        const label = (c.choiceLabel || "").toLowerCase();
        return !label.includes("rush") && !label.includes("skip") && !label.includes("ignore");
      });
      decisionScore = clamp((deliberateChoices.length / choiceLogs.length) * 100);
    }

    const scenarioRuns = await db
      .select()
      .from(academyScenarioRuns)
      .where(
        and(
          eq(academyScenarioRuns.userId, userId),
          eq(academyScenarioRuns.status, "completed")
        )
      );
    let recoveryScore = 50;
    if (scenarioRuns.length > 0) {
      const withRecovery = scenarioRuns.filter((r: any) => {
        const outcome = r.outcome as any;
        return outcome && (outcome.recovered || outcome.repairAction || Number(r.totalPowerEarned ?? 0) > 0);
      });
      recoveryScore = clamp((withRecovery.length / scenarioRuns.length) * 100);
    }

    const domainB = reflectionScore * 0.25 + justificationScore * 0.25 + decisionScore * 0.30 + recoveryScore * 0.20;
    return clamp(Math.round(domainB));
  } catch (error) {
    console.error("[Thrive Engine] Error computing Domain B:", error);
    return 50;
  }
}

export async function computeDomainC(db: any, userId: string): Promise<number> {
  try {
    const cutoff = thirtyDaysAgo();

    const mentorResults = await db
      .select({ cnt: count() })
      .from(mentorRequests)
      .where(
        and(
          eq(mentorRequests.studentId, userId),
          eq(mentorRequests.status, "approved")
        )
      );
    const approvedMentors = Number(mentorResults[0]?.cnt ?? 0);
    const mentorScore = clamp(Math.min(approvedMentors * 25, 100));

    const meritResults = await db
      .select({ cnt: count() })
      .from(academyMeritEvents)
      .where(
        and(
          eq(academyMeritEvents.userId, userId),
          gte(academyMeritEvents.createdAt, cutoff)
        )
      );
    const meritCount = Number(meritResults[0]?.cnt ?? 0);
    const houseScore = clamp(Math.min(meritCount * 15, 100));

    const compResults = await db
      .select({ cnt: count() })
      .from(academyCompetitionEntries)
      .where(eq(academyCompetitionEntries.userId, userId));
    const compCount = Number(compResults[0]?.cnt ?? 0);
    const peerScore = clamp(Math.min(compCount * 20, 100));

    const supportResults = await db
      .select({ cnt: count() })
      .from(studentSelfAssessments)
      .where(
        and(
          eq(studentSelfAssessments.userId, userId),
          eq(studentSelfAssessments.needsSupport, true),
          gte(studentSelfAssessments.createdAt, cutoff)
        )
      );
    const supportRequests = Number(supportResults[0]?.cnt ?? 0);
    const helpSeekingScore = clamp(Math.min(supportRequests * 25, 100));

    const domainC = mentorScore * 0.30 + houseScore * 0.25 + peerScore * 0.25 + helpSeekingScore * 0.20;
    return clamp(Math.round(domainC));
  } catch (error) {
    console.error("[Thrive Engine] Error computing Domain C:", error);
    return 50;
  }
}

export async function computeDomainD(
  db: any,
  userId: string
): Promise<{ score: number | null; active: boolean }> {
  try {
    const cutoff = thirtyDaysAgo();

    const assessments = await db
      .select()
      .from(studentSelfAssessments)
      .where(
        and(
          eq(studentSelfAssessments.userId, userId),
          eq(studentSelfAssessments.consentGiven, true),
          gte(studentSelfAssessments.createdAt, cutoff)
        )
      );

    if (assessments.length === 0) {
      try {
        const recentScreenings = await db
          .select()
          .from(healthScreeningResults)
          .where(
            and(
              eq(healthScreeningResults.userId, userId),
              gte(healthScreeningResults.completedAt, cutoff)
            )
          );

        if (recentScreenings.length > 0) {
          let totalPct = 0;
          for (const s of recentScreenings) {
            totalPct += (s.totalScore / s.maxScore) * 100;
          }
          const healthScore = clamp(Math.round(totalPct / recentScreenings.length));
          return { score: healthScore, active: true };
        }
      } catch (error) {
        console.error("[Thrive Engine] Error fetching health screenings for Domain D (no-assessment path):", error);
      }

      return { score: null, active: false };
    }

    let energySum = 0, energyCount = 0;
    let stressSum = 0, stressCount = 0;
    let focusSum = 0, focusCount = 0;
    let moodSum = 0, moodCount = 0;

    for (const a of assessments) {
      if (a.energyLevel != null) { energySum += a.energyLevel; energyCount++; }
      if (a.stressLevel != null) { stressSum += a.stressLevel; stressCount++; }
      if (a.focusLevel != null) { focusSum += a.focusLevel; focusCount++; }
      if (a.moodRating != null) { moodSum += a.moodRating; moodCount++; }
    }

    const normalize = (val: number, max: number) => clamp((val / max) * 100);

    const energyScore = energyCount > 0 ? normalize(energySum / energyCount, 10) : 50;
    const stressScore = stressCount > 0 ? normalize(10 - (stressSum / stressCount), 10) : 50;
    const focusScore = focusCount > 0 ? normalize(focusSum / focusCount, 10) : 50;
    const moodScore = moodCount > 0 ? normalize(moodSum / moodCount, 10) : 50;

    let selfAssessmentScore = clamp(Math.round(
      energyScore * 0.25 + stressScore * 0.30 + focusScore * 0.25 + moodScore * 0.20
    ));

    let healthScreeningScore: number | null = null;
    try {
      const recentScreenings = await db
        .select()
        .from(healthScreeningResults)
        .where(
          and(
            eq(healthScreeningResults.userId, userId),
            gte(healthScreeningResults.completedAt, cutoff)
          )
        );

      if (recentScreenings.length > 0) {
        let totalPct = 0;
        for (const s of recentScreenings) {
          totalPct += (s.totalScore / s.maxScore) * 100;
        }
        healthScreeningScore = clamp(Math.round(totalPct / recentScreenings.length));
      }
    } catch (error) {
      console.error("[Thrive Engine] Error fetching health screenings for Domain D blending:", error);
    }

    let score: number;
    if (healthScreeningScore != null) {
      score = clamp(Math.round(selfAssessmentScore * 0.70 + healthScreeningScore * 0.30));
    } else {
      score = selfAssessmentScore;
    }

    return { score, active: true };
  } catch (error) {
    console.error("[Thrive Engine] Error computing Domain D:", error);
    return { score: null, active: false };
  }
}

export async function computeDomainE(
  db: any,
  userId: string,
  geographyKey?: string
): Promise<number> {
  try {
    if (!geographyKey) {
      const scoreRecord = await db
        .select()
        .from(thriveScores)
        .where(eq(thriveScores.userId, userId))
        .limit(1);
      geographyKey = scoreRecord[0]?.geographyKey ?? undefined;
    }

    if (!geographyKey) {
      return 50;
    }

    const contextRows = await db
      .select()
      .from(gisContextData)
      .where(eq(gisContextData.geographyKey, geographyKey))
      .limit(1);

    if (contextRows.length === 0 || contextRows[0].contextLoadIndex == null) {
      return 50;
    }

    const contextLoadIndex = Number(contextRows[0].contextLoadIndex);
    return clamp(Math.round(100 - contextLoadIndex));
  } catch (error) {
    console.error("[Thrive Engine] Error computing Domain E:", error);
    return 50;
  }
}

export async function computeDomainF(db: any, userId: string): Promise<number> {
  try {
    const mentorResults = await db
      .select({ cnt: count() })
      .from(mentorRequests)
      .where(
        and(
          eq(mentorRequests.studentId, userId),
          eq(mentorRequests.status, "approved")
        )
      );
    const stableAdultScore = clamp(Math.min(Number(mentorResults[0]?.cnt ?? 0) * 30, 100));

    const compResults = await db
      .select({ cnt: count() })
      .from(academyCompetitionEntries)
      .where(eq(academyCompetitionEntries.userId, userId));
    const questResults = await db
      .select({
        completed: sql<number>`count(*) filter (where ${academyDailyQuests.completed} = true)`,
      })
      .from(academyDailyQuests)
      .where(eq(academyDailyQuests.userId, userId));

    const activityAnchors = Number(compResults[0]?.cnt ?? 0) + Number(questResults[0]?.completed ?? 0);
    const activityScore = clamp(Math.min(activityAnchors * 5, 100));

    const revisionResults = await db
      .select({ cnt: count() })
      .from(planRevisions)
      .where(eq(planRevisions.userId, userId));
    const portfolioScore = clamp(Math.min(Number(revisionResults[0]?.cnt ?? 0) * 20, 100));

    const campusResults = await db
      .select()
      .from(academyCampusProjects)
      .where(eq(academyCampusProjects.userId, userId));
    let communityScore = 50;
    if (campusResults.length > 0) {
      const totalFunded = campusResults.reduce(
        (sum: number, p: any) => sum + Number(p.amountFunded ?? 0),
        0
      );
      communityScore = clamp(Math.min((totalFunded / 500) * 100, 100));
    }

    const pantherResults = await db
      .select()
      .from(academyPantherPower)
      .where(eq(academyPantherPower.userId, userId))
      .limit(1);
    let leadershipScore = 50;
    if (pantherResults.length > 0) {
      const totalScore = pantherResults[0].totalScore ?? 0;
      leadershipScore = clamp(Math.min((totalScore / 500) * 100, 100));
    }

    const domainF = stableAdultScore * 0.25 + activityScore * 0.20 + portfolioScore * 0.20 + communityScore * 0.15 + leadershipScore * 0.20;
    return clamp(Math.round(domainF));
  } catch (error) {
    console.error("[Thrive Engine] Error computing Domain F:", error);
    return 50;
  }
}

function computeTrend(current: number, previous: number | null | undefined): string {
  if (previous == null) return "flat";
  const diff = current - previous;
  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "flat";
}

function determineFlagLevel(
  currentScores: { a: number; b: number; c: number; d: number | null; e: number; f: number },
  previousScores: { a?: number | null; b?: number | null; c?: number | null; d?: number | null; e?: number | null; f?: number | null } | null
): string | null {
  if (!previousScores) return null;

  const domains = [
    { key: "A", current: currentScores.a, previous: previousScores.a },
    { key: "B", current: currentScores.b, previous: previousScores.b },
    { key: "C", current: currentScores.c, previous: previousScores.c },
    { key: "E", current: currentScores.e, previous: previousScores.e },
    { key: "F", current: currentScores.f, previous: previousScores.f },
  ];
  if (currentScores.d != null && previousScores.d != null) {
    domains.push({ key: "D", current: currentScores.d, previous: previousScores.d });
  }

  let declinedOver10 = 0;
  let declinedOver15 = 0;

  for (const d of domains) {
    if (d.previous == null) continue;
    const decline = (d.previous as number) - d.current;
    if (decline > 15) {
      declinedOver15++;
      declinedOver10++;
    } else if (decline > 10) {
      declinedOver10++;
    }
  }

  if (declinedOver15 >= 3) return "stabilize";
  if (declinedOver10 >= 2) return "support";
  if (declinedOver10 >= 1) return "watch";

  return null;
}

function generateNextBestActions(result: ThriveScoreResult): string[] {
  const actions: string[] = [];

  if (result.domainA.score < 40) {
    actions.push("Increase lesson completion frequency - aim for at least 2 lessons per week");
  }
  if (result.domainA.trend === "declining") {
    actions.push("Re-engage with daily quests to rebuild learning momentum");
  }

  if (result.domainB.score < 40) {
    actions.push("Practice reflection writing in daily self-assessments");
  }
  if (result.domainB.trend === "declining") {
    actions.push("Review recent scenario decisions and reflect on alternative outcomes");
  }

  if (result.domainC.score < 40) {
    actions.push("Connect with a mentor or join a house competition activity");
  }
  if (result.domainC.trend === "declining") {
    actions.push("Participate in a peer collaboration event this week");
  }

  if (result.domainD.active && result.domainD.score != null && result.domainD.score < 40) {
    actions.push("Check in with a trusted adult about current stress levels");
  }

  if (result.domainE.score < 40) {
    actions.push("Explore available community resources and support services");
  }

  if (result.domainF.score < 40) {
    actions.push("Strengthen protective factors by joining an activity or reaching out to a mentor");
  }

  if (actions.length === 0 && result.composite.score >= 70) {
    actions.push("Maintain current engagement - consider mentoring a peer");
  }

  if (actions.length === 0) {
    actions.push("Continue building consistent daily habits across all domains");
  }

  return actions.slice(0, 5);
}

export async function computeFullThriveScore(
  db: any,
  userId: string
): Promise<ThriveScoreResult> {
  const [scoreA, scoreB, scoreC, domainDResult, scoreF] = await Promise.all([
    computeDomainA(db, userId),
    computeDomainB(db, userId),
    computeDomainC(db, userId),
    computeDomainD(db, userId),
    computeDomainF(db, userId),
  ]);

  const existingScore = await db
    .select()
    .from(thriveScores)
    .where(eq(thriveScores.userId, userId))
    .limit(1);

  const geoKey = existingScore[0]?.geographyKey ?? undefined;
  const scoreE = await computeDomainE(db, userId, geoKey);

  const cutoff = thirtyDaysAgo();
  const previousHistory = await db
    .select()
    .from(thriveHistory)
    .where(
      and(
        eq(thriveHistory.userId, userId),
        gte(thriveHistory.snapshotDate, cutoff)
      )
    )
    .orderBy(thriveHistory.snapshotDate)
    .limit(1);

  const prev = previousHistory[0] ?? null;

  const trendA = computeTrend(scoreA, prev?.domainAScore);
  const trendB = computeTrend(scoreB, prev?.domainBScore);
  const trendC = computeTrend(scoreC, prev?.domainCScore);
  const trendD = domainDResult.active ? computeTrend(domainDResult.score!, prev?.domainDScore) : null;
  const trendE = computeTrend(scoreE, prev?.domainEScore);
  const trendF = computeTrend(scoreF, prev?.domainFScore);

  let composite: number;
  if (domainDResult.active && domainDResult.score != null) {
    composite = 0.25 * scoreA + 0.20 * scoreB + 0.15 * scoreC + 0.10 * domainDResult.score + 0.15 * scoreE + 0.15 * scoreF;
  } else {
    composite = 0.278 * scoreA + 0.222 * scoreB + 0.167 * scoreC + 0.167 * scoreE + 0.167 * scoreF;
  }
  composite = clamp(Math.round(composite));

  const compositeTrend = computeTrend(composite, prev?.compositeScore);

  const flagLevel = determineFlagLevel(
    { a: scoreA, b: scoreB, c: scoreC, d: domainDResult.score, e: scoreE, f: scoreF },
    prev
      ? {
          a: prev.domainAScore,
          b: prev.domainBScore,
          c: prev.domainCScore,
          d: prev.domainDScore,
          e: prev.domainEScore,
          f: prev.domainFScore,
        }
      : null
  );

  const result: ThriveScoreResult = {
    domainA: { score: scoreA, trend: trendA },
    domainB: { score: scoreB, trend: trendB },
    domainC: { score: scoreC, trend: trendC },
    domainD: { score: domainDResult.score, trend: trendD, active: domainDResult.active },
    domainE: { score: scoreE, trend: trendE },
    domainF: { score: scoreF, trend: trendF },
    composite: { score: composite, trend: compositeTrend },
    flagLevel,
    nextBestActions: [],
  };

  result.nextBestActions = generateNextBestActions(result);

  const scoreData = {
    userId,
    domainAScore: scoreA,
    domainATrend: trendA,
    domainBScore: scoreB,
    domainBTrend: trendB,
    domainCScore: scoreC,
    domainCTrend: trendC,
    domainDScore: domainDResult.score,
    domainDTrend: trendD,
    domainDActive: domainDResult.active,
    domainEScore: scoreE,
    domainETrend: trendE,
    domainFScore: scoreF,
    domainFTrend: trendF,
    compositeScore: composite,
    compositeTrend: compositeTrend,
    flagLevel,
    nextBestActions: result.nextBestActions,
    geographyKey: geoKey ?? null,
    updatedAt: new Date(),
  };

  if (existingScore.length > 0) {
    await db
      .update(thriveScores)
      .set(scoreData)
      .where(eq(thriveScores.id, existingScore[0].id));
  } else {
    await db.insert(thriveScores).values(scoreData);
  }

  await db.insert(thriveHistory).values({
    userId,
    domainAScore: scoreA,
    domainBScore: scoreB,
    domainCScore: scoreC,
    domainDScore: domainDResult.score,
    domainEScore: scoreE,
    domainFScore: scoreF,
    compositeScore: composite,
    flagLevel,
  });

  return result;
}

export async function computeAllStudentScores(db: any): Promise<void> {
  const avatars = await db
    .select({ userId: academyAvatars.userId })
    .from(academyAvatars);

  let processed = 0;
  let errors = 0;

  for (const avatar of avatars) {
    try {
      await computeFullThriveScore(db, avatar.userId);
      processed++;
    } catch (error) {
      console.error(`[Thrive Engine] Error computing score for user ${avatar.userId}:`, error);
      errors++;
    }
  }

}

export async function getThriveHistory(
  db: any,
  userId: string,
  days: number = 90
): Promise<ThriveHistory[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(thriveHistory)
    .where(
      and(
        eq(thriveHistory.userId, userId),
        gte(thriveHistory.snapshotDate, cutoff)
      )
    )
    .orderBy(desc(thriveHistory.snapshotDate));
}
