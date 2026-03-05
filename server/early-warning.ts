import {
  thriveScores,
  thriveHistory,
  earlyWarningFlags,
  interventionPlaybooks,
  completedLessons,
  academyChoiceLogs,
  academyTransactions,
  planRevisions,
  gisContextData,
  studentSelfAssessments,
  academyAvatars,
  studentProgress,
  type EarlyWarningFlag,
} from "@shared/schema";
import { eq, and, gte, desc, sql, lt } from "drizzle-orm";

export interface DriftSignal {
  triggerClass: "engagement_drift" | "decision_pattern_risk" | "context_shock";
  severity: number;
  description: string;
  affectedDomains: string[];
}

export interface ExplainableCard {
  whatChanged: string;
  whyItMatters: string;
  navigationAction: string;
  thirtyDayTarget: string;
}

export interface EarlyWarningResult {
  flagLevel: "watch" | "support" | "stabilize" | null;
  signals: DriftSignal[];
  cards: ExplainableCard[];
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function detectEngagementDrift(
  db: any,
  userId: string
): Promise<DriftSignal | null> {
  try {
    const twoWeeksAgo = daysAgo(14);
    const fourWeeksAgo = daysAgo(28);

    const recentLessons = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(completedLessons)
      .innerJoin(
        studentProgress,
        eq(completedLessons.progressId, studentProgress.id)
      )
      .where(
        and(
          eq(studentProgress.userId, userId),
          gte(completedLessons.completedAt, twoWeeksAgo)
        )
      );

    const priorLessons = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(completedLessons)
      .innerJoin(
        studentProgress,
        eq(completedLessons.progressId, studentProgress.id)
      )
      .where(
        and(
          eq(studentProgress.userId, userId),
          gte(completedLessons.completedAt, fourWeeksAgo),
          lt(completedLessons.completedAt, twoWeeksAgo)
        )
      );

    const recentCount = Number(recentLessons[0]?.cnt ?? 0);
    const priorCount = Number(priorLessons[0]?.cnt ?? 0);

    const recentRevisions = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(planRevisions)
      .where(
        and(
          eq(planRevisions.userId, userId),
          gte(planRevisions.createdAt, twoWeeksAgo)
        )
      );
    const priorRevisions = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(planRevisions)
      .where(
        and(
          eq(planRevisions.userId, userId),
          gte(planRevisions.createdAt, fourWeeksAgo),
          lt(planRevisions.createdAt, twoWeeksAgo)
        )
      );

    const recentRevCount = Number(recentRevisions[0]?.cnt ?? 0);
    const priorRevCount = Number(priorRevisions[0]?.cnt ?? 0);

    const recentAssessments = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(studentSelfAssessments)
      .where(
        and(
          eq(studentSelfAssessments.userId, userId),
          gte(studentSelfAssessments.createdAt, twoWeeksAgo)
        )
      );
    const attendanceProxy = Number(recentAssessments[0]?.cnt ?? 0);

    let severity = 0;
    const issues: string[] = [];
    const affectedDomains: string[] = [];

    if (priorCount > 0 && recentCount < priorCount * 0.5) {
      severity += 40;
      issues.push(
        `Lesson completions dropped from ${priorCount} to ${recentCount} over the last 2 weeks`
      );
      affectedDomains.push("A");
    } else if (priorCount > 0 && recentCount < priorCount * 0.75) {
      severity += 25;
      issues.push(
        `Lesson completions declined from ${priorCount} to ${recentCount}`
      );
      affectedDomains.push("A");
    }

    if (priorRevCount > 0 && recentRevCount === 0) {
      severity += 20;
      issues.push("Portfolio updates have stalled completely");
      if (!affectedDomains.includes("A")) affectedDomains.push("A");
      affectedDomains.push("B");
    }

    if (attendanceProxy === 0) {
      severity += 20;
      issues.push("No self-assessment check-ins in the last 2 weeks");
      affectedDomains.push("D");
    }

    if (recentCount === 0 && priorCount === 0) {
      severity += 20;
      issues.push("No lesson activity detected in the past 4 weeks");
      if (!affectedDomains.includes("A")) affectedDomains.push("A");
    }

    if (severity > 0) {
      return {
        triggerClass: "engagement_drift",
        severity: Math.min(severity, 100),
        description: issues.join(". "),
        affectedDomains: Array.from(new Set(affectedDomains)),
      };
    }

    return null;
  } catch (error) {
    console.error("[Early Warning] Error detecting engagement drift:", error);
    return null;
  }
}

export async function detectDecisionPatternRisk(
  db: any,
  userId: string
): Promise<DriftSignal | null> {
  try {
    const cutoff = daysAgo(90);

    const choiceLogs = await db
      .select()
      .from(academyChoiceLogs)
      .where(
        and(
          eq(academyChoiceLogs.userId, userId),
          gte(academyChoiceLogs.createdAt, cutoff)
        )
      );

    let impulsiveCount = 0;
    for (const log of choiceLogs) {
      const label = (log.choiceLabel || "").toLowerCase();
      if (
        label.includes("rush") ||
        label.includes("skip") ||
        label.includes("ignore") ||
        label.includes("quick") ||
        label.includes("shortcut")
      ) {
        impulsiveCount++;
      }
    }

    const semesterCutoff = daysAgo(180);
    const revisions = await db
      .select()
      .from(planRevisions)
      .where(
        and(
          eq(planRevisions.userId, userId),
          gte(planRevisions.createdAt, semesterCutoff)
        )
      );

    let lowQualityRevisions = 0;
    for (const rev of revisions) {
      if (!rev.requestReason || rev.requestReason.length < 20) {
        lowQualityRevisions++;
      }
    }

    const walletRows = await db
      .select()
      .from(academyTransactions)
      .innerJoin(
        sql`academy_wallets aw`,
        sql`aw.id = ${academyTransactions.walletId} AND aw.user_id = ${userId}`
      )
      .where(gte(academyTransactions.createdAt, cutoff));

    let shortTermCount = 0;
    let longTermCount = 0;
    for (const row of walletRows) {
      const tx = row.academy_transactions;
      const cat = (tx.category || "").toLowerCase();
      const desc = (tx.description || "").toLowerCase();
      if (
        cat.includes("invest") ||
        desc.includes("invest") ||
        desc.includes("long-term") ||
        desc.includes("save")
      ) {
        longTermCount++;
      } else if (
        cat.includes("spend") ||
        desc.includes("purchase") ||
        desc.includes("buy") ||
        desc.includes("impulse")
      ) {
        shortTermCount++;
      }
    }

    let severity = 0;
    const issues: string[] = [];
    const affectedDomains: string[] = ["B"];

    if (choiceLogs.length > 0) {
      const impulsiveRatio = impulsiveCount / choiceLogs.length;
      if (impulsiveRatio > 0.4) {
        severity += 35;
        issues.push(
          `${Math.round(impulsiveRatio * 100)}% of CYOA choices show impulsive patterns`
        );
      } else if (impulsiveRatio > 0.25) {
        severity += 20;
        issues.push(
          `${Math.round(impulsiveRatio * 100)}% of CYOA choices indicate rushing behavior`
        );
      }
    }

    if (revisions.length >= 3 && lowQualityRevisions >= 2) {
      severity += 30;
      issues.push(
        `${revisions.length} pathway revisions this semester with ${lowQualityRevisions} lacking quality justification`
      );
      affectedDomains.push("A");
    } else if (revisions.length >= 3) {
      severity += 15;
      issues.push(
        `${revisions.length} pathway revisions this semester may indicate uncertainty`
      );
    }

    const totalFinancial = shortTermCount + longTermCount;
    if (totalFinancial > 0 && shortTermCount > longTermCount * 2) {
      severity += 20;
      issues.push(
        "Financial simulation behavior heavily skewed toward short-term spending"
      );
      affectedDomains.push("F");
    }

    if (severity > 0) {
      return {
        triggerClass: "decision_pattern_risk",
        severity: Math.min(severity, 100),
        description: issues.join(". "),
        affectedDomains: Array.from(new Set(affectedDomains)),
      };
    }

    return null;
  } catch (error) {
    console.error(
      "[Early Warning] Error detecting decision pattern risk:",
      error
    );
    return null;
  }
}

export async function detectContextShock(
  db: any,
  userId: string
): Promise<DriftSignal | null> {
  try {
    const scoreRecord = await db
      .select()
      .from(thriveScores)
      .where(eq(thriveScores.userId, userId))
      .limit(1);

    const geoKey = scoreRecord[0]?.geographyKey;
    if (!geoKey) return null;

    const contextRows = await db
      .select()
      .from(gisContextData)
      .where(eq(gisContextData.geographyKey, geoKey))
      .limit(1);

    if (contextRows.length === 0) return null;

    const context = contextRows[0];
    const contextLoadIndex = Number(context.contextLoadIndex ?? 0);

    const domainFScore = Number(scoreRecord[0]?.domainFScore ?? 50);
    const protectiveDeficit = domainFScore < 40;

    let severity = 0;
    const issues: string[] = [];
    const affectedDomains: string[] = ["E"];

    if (contextLoadIndex >= 70) {
      severity += 40;
      issues.push(
        `Context Load Index is high (${contextLoadIndex.toFixed(1)}) indicating significant environmental stress`
      );
    } else if (contextLoadIndex >= 50) {
      severity += 20;
      issues.push(
        `Context Load Index is elevated (${contextLoadIndex.toFixed(1)})`
      );
    }

    if (protectiveDeficit) {
      severity += 30;
      issues.push(
        `Protective factor score is low (${domainFScore.toFixed(1)}) indicating limited safety net`
      );
      affectedDomains.push("F");
    }

    const svi = Number(context.sviPercentile ?? 0);
    if (svi >= 75) {
      severity += 15;
      issues.push("Social Vulnerability Index is in the high-risk range");
    }

    if (severity > 0 && (contextLoadIndex >= 50 || protectiveDeficit)) {
      return {
        triggerClass: "context_shock",
        severity: Math.min(severity, 100),
        description: issues.join(". "),
        affectedDomains: Array.from(new Set(affectedDomains)),
      };
    }

    return null;
  } catch (error) {
    console.error("[Early Warning] Error detecting context shock:", error);
    return null;
  }
}

export async function evaluateFlags(
  db: any,
  userId: string
): Promise<EarlyWarningResult> {
  const [engagementSignal, decisionSignal, contextSignal] = await Promise.all([
    detectEngagementDrift(db, userId),
    detectDecisionPatternRisk(db, userId),
    detectContextShock(db, userId),
  ]);

  const signals: DriftSignal[] = [];
  if (engagementSignal) signals.push(engagementSignal);
  if (decisionSignal) signals.push(decisionSignal);
  if (contextSignal) signals.push(contextSignal);

  const currentScore = await db
    .select()
    .from(thriveScores)
    .where(eq(thriveScores.userId, userId))
    .limit(1);

  const thirtyDayHistory = await db
    .select()
    .from(thriveHistory)
    .where(
      and(
        eq(thriveHistory.userId, userId),
        gte(thriveHistory.snapshotDate, daysAgo(30))
      )
    )
    .orderBy(thriveHistory.snapshotDate)
    .limit(1);

  const sixtyDayHistory = await db
    .select()
    .from(thriveHistory)
    .where(
      and(
        eq(thriveHistory.userId, userId),
        gte(thriveHistory.snapshotDate, daysAgo(60))
      )
    )
    .orderBy(thriveHistory.snapshotDate)
    .limit(1);

  const current = currentScore[0];
  const prev30 = thirtyDayHistory[0];
  const prev60 = sixtyDayHistory[0];

  let domainsDeclined10 = 0;
  let domainsDeclined15 = 0;
  const declinedDomainNames: string[] = [];

  if (current && prev30) {
    const domainPairs = [
      { key: "A", curr: current.domainAScore, prev: prev30.domainAScore },
      { key: "B", curr: current.domainBScore, prev: prev30.domainBScore },
      { key: "C", curr: current.domainCScore, prev: prev30.domainCScore },
      { key: "E", curr: current.domainEScore, prev: prev30.domainEScore },
      { key: "F", curr: current.domainFScore, prev: prev30.domainFScore },
    ];
    if (current.domainDActive && current.domainDScore != null && prev30.domainDScore != null) {
      domainPairs.push({ key: "D", curr: current.domainDScore, prev: prev30.domainDScore });
    }

    for (const dp of domainPairs) {
      if (dp.prev == null || dp.curr == null) continue;
      const decline = dp.prev - dp.curr;
      const declinePercent = dp.prev > 0 ? (decline / dp.prev) * 100 : 0;
      if (declinePercent >= 15) {
        domainsDeclined15++;
        domainsDeclined10++;
        declinedDomainNames.push(dp.key);
      } else if (declinePercent >= 10) {
        domainsDeclined10++;
        declinedDomainNames.push(dp.key);
      }
    }
  }

  const semesterCutoff = daysAgo(180);
  const semesterRevisions = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(planRevisions)
    .where(
      and(
        eq(planRevisions.userId, userId),
        gte(planRevisions.createdAt, semesterCutoff)
      )
    );
  const revisionCount = Number(semesterRevisions[0]?.cnt ?? 0);

  let decliningSlope60 = false;
  if (current && prev60) {
    const compositeDecline =
      (prev60.compositeScore ?? 50) - (current.compositeScore ?? 50);
    decliningSlope60 = compositeDecline > 10;
  }

  const protectiveDeficit = current ? Number(current.domainFScore ?? 50) < 40 : false;

  const hasEngagementDrop =
    engagementSignal != null && engagementSignal.severity >= 40;
  const hasDecisionRisk =
    decisionSignal != null && decisionSignal.severity >= 30;

  let flagLevel: "watch" | "support" | "stabilize" | null = null;

  if (
    domainsDeclined15 >= 3 ||
    (decliningSlope60 && protectiveDeficit)
  ) {
    flagLevel = "stabilize";
  } else if (
    domainsDeclined10 >= 2 ||
    revisionCount >= 3 ||
    hasDecisionRisk
  ) {
    flagLevel = "support";
  } else if (
    domainsDeclined10 >= 1 ||
    hasEngagementDrop
  ) {
    flagLevel = "watch";
  }

  const cards: ExplainableCard[] = [];
  for (const signal of signals) {
    if (flagLevel) {
      cards.push(generateExplainableCard(signal, flagLevel));
    }
  }

  return { flagLevel, signals, cards };
}

export function generateExplainableCard(
  signal: DriftSignal,
  flagLevel: string
): ExplainableCard {
  const cardMap: Record<
    string,
    Record<string, Omit<ExplainableCard, "whatChanged">>
  > = {
    engagement_drift: {
      watch: {
        whyItMatters:
          "Early disengagement patterns often predict larger learning gaps if not addressed within 2-3 weeks.",
        navigationAction:
          "Advisor should review activity log and schedule an encouraging check-in within 48 hours.",
        thirtyDayTarget:
          "Student will complete at least 3 lessons per week and log 2 self-assessments per week for 30 days.",
      },
      support: {
        whyItMatters:
          "Sustained disengagement risks falling behind on milestone progression and weakening peer connections.",
        navigationAction:
          "Schedule advisor session to create a modified milestone timeline with daily check-ins for 2 weeks.",
        thirtyDayTarget:
          "Student will return to 80% of baseline lesson completion rate and attend all scheduled check-ins.",
      },
      stabilize: {
        whyItMatters:
          "Critical disengagement threatens pathway continuity and may indicate unaddressed barriers to participation.",
        navigationAction:
          "Convene coordinated team meeting with advisor, mentor, and parent. Establish daily touchpoints.",
        thirtyDayTarget:
          "Student will re-engage with at least 1 lesson daily, attend all team touchpoints, and complete a re-entry plan.",
      },
    },
    decision_pattern_risk: {
      watch: {
        whyItMatters:
          "Impulsive decision patterns in simulations may reflect developing habits that affect real-world choices.",
        navigationAction:
          "Add extra reflection prompts to next CYOA scenario and schedule a mentor check-in.",
        thirtyDayTarget:
          "Student will demonstrate deliberate choice-making in 75% of CYOA decisions over the next 30 days.",
      },
      support: {
        whyItMatters:
          "Repeated impulsive decisions and frequent plan changes suggest difficulty with consequence evaluation.",
        navigationAction:
          "Enroll student in 3-session advisor workshop on consequence mapping. Revise CYOA scenarios for guided practice.",
        thirtyDayTarget:
          "Student will complete all 3 workshop sessions and show improved decision quality scores in CYOA scenarios.",
      },
      stabilize: {
        whyItMatters:
          "Persistent decision-making challenges combined with plan instability require intensive structured support.",
        navigationAction:
          "Assign intensive mentor pairing. Implement structured decision journaling with weekly advisor review.",
        thirtyDayTarget:
          "Student will complete daily decision journal entries and demonstrate measurable improvement in CYOA outcome quality.",
      },
    },
    context_shock: {
      watch: {
        whyItMatters:
          "Environmental stress changes can gradually affect focus, attendance, and engagement if support is not available.",
        navigationAction:
          "Share community resource overlay with family. Advisor conducts a supportive check-in.",
        thirtyDayTarget:
          "Family will access at least 1 community resource. Student maintains current engagement levels.",
      },
      support: {
        whyItMatters:
          "Elevated environmental stress combined with limited protective factors creates vulnerability to learning disruption.",
        navigationAction:
          "Initiate counselor referral. Increase mentor contact to weekly. Prepare family resource packet.",
        thirtyDayTarget:
          "Student will connect with counselor, attend weekly mentor sessions, and maintain stable Thrive scores.",
      },
      stabilize: {
        whyItMatters:
          "High environmental stress with protective factor deficit requires multi-system coordinated response.",
        navigationAction:
          "Coordinate multi-agency support. Establish daily check-ins. Provide crisis resources. Modify academic expectations.",
        thirtyDayTarget:
          "Student will have active connections with 2+ support agencies, attend daily check-ins, and show score stabilization.",
      },
    },
  };

  const triggerCards = cardMap[signal.triggerClass];
  const levelCard = triggerCards?.[flagLevel] ?? triggerCards?.watch ?? {
    whyItMatters: "This pattern may affect learning outcomes if not addressed.",
    navigationAction: "Advisor should review the situation and schedule a check-in.",
    thirtyDayTarget: "Student will demonstrate improvement in affected areas within 30 days.",
  };

  return {
    whatChanged: signal.description,
    ...levelCard,
  };
}

export async function createWarningFlag(
  db: any,
  userId: string,
  card: ExplainableCard,
  triggerClass: string,
  flagLevel: string,
  affectedDomains: string[]
): Promise<EarlyWarningFlag> {
  const matchingPlaybook = await db
    .select()
    .from(interventionPlaybooks)
    .where(
      and(
        eq(interventionPlaybooks.triggerClass, triggerClass),
        eq(interventionPlaybooks.flagLevel, flagLevel),
        eq(interventionPlaybooks.isActive, true)
      )
    )
    .limit(1);

  const playbookId = matchingPlaybook[0]?.id ?? null;

  const followUpDate = new Date();
  if (flagLevel === "stabilize") {
    followUpDate.setDate(followUpDate.getDate() + 1);
  } else if (flagLevel === "support") {
    followUpDate.setDate(followUpDate.getDate() + 7);
  } else {
    followUpDate.setDate(followUpDate.getDate() + 14);
  }

  const [created] = await db
    .insert(earlyWarningFlags)
    .values({
      userId,
      flagLevel,
      triggerClass,
      whatChanged: card.whatChanged,
      whyItMatters: card.whyItMatters,
      navigationAction: card.navigationAction,
      thirtyDayTarget: card.thirtyDayTarget,
      affectedDomains,
      playbookId,
      status: "active",
      followUpDate,
    })
    .returning();

  return created;
}

export async function resolveFlag(
  db: any,
  flagId: string,
  resolvedBy: string,
  notes: string
): Promise<void> {
  await db
    .update(earlyWarningFlags)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy,
      resolutionNotes: notes,
    })
    .where(eq(earlyWarningFlags.id, flagId));
}

export async function getActiveFlags(
  db: any,
  userId?: string
): Promise<EarlyWarningFlag[]> {
  if (userId) {
    return db
      .select()
      .from(earlyWarningFlags)
      .where(
        and(
          eq(earlyWarningFlags.userId, userId),
          eq(earlyWarningFlags.status, "active")
        )
      )
      .orderBy(desc(earlyWarningFlags.createdAt));
  }

  return db
    .select()
    .from(earlyWarningFlags)
    .where(eq(earlyWarningFlags.status, "active"))
    .orderBy(desc(earlyWarningFlags.createdAt));
}

export async function runEarlyWarningCheck(db: any): Promise<void> {
  const avatars = await db
    .select({ userId: academyAvatars.userId })
    .from(academyAvatars);

  let processed = 0;
  let flagsCreated = 0;
  let errors = 0;

  for (const avatar of avatars) {
    try {
      const result = await evaluateFlags(db, avatar.userId);

      if (result.flagLevel && result.signals.length > 0) {
        const existingFlags = await db
          .select()
          .from(earlyWarningFlags)
          .where(
            and(
              eq(earlyWarningFlags.userId, avatar.userId),
              eq(earlyWarningFlags.status, "active")
            )
          );

        const existingTriggers = new Set(
          existingFlags.map((f: EarlyWarningFlag) => f.triggerClass)
        );

        for (let i = 0; i < result.signals.length; i++) {
          const signal = result.signals[i];
          if (!existingTriggers.has(signal.triggerClass)) {
            const card = result.cards[i] ?? generateExplainableCard(signal, result.flagLevel);
            await createWarningFlag(
              db,
              avatar.userId,
              card,
              signal.triggerClass,
              result.flagLevel,
              signal.affectedDomains
            );
            flagsCreated++;
          }
        }
      }

      processed++;
    } catch (error) {
      console.error(
        `[Early Warning] Error processing user ${avatar.userId}:`,
        error
      );
      errors++;
    }
  }

}
