/**
 * Gap 7 — Nonprofit Effectiveness Scorecard
 * Partner orgs submit program outcomes against WIOA/CFIR rubric.
 * Scoring engine computes tier (Gold/Silver/Bronze/Provisional).
 */

import { Router } from "express";
import { db } from "./storage";
import {
  partnerOutcomeSubmissions,
  partnerEffectivenessScores,
  insertPartnerOutcomeSchema,
} from "../shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { isAuthenticated as requireAuth } from "./replit_integrations/auth/replitAuth";

export const scorecardRouter = Router();

// ── WIOA/CFIR scoring engine ──────────────────────────────────────────────────
// Benchmarks derived from WIOA Performance Accountability (2024 national averages).
const BENCHMARKS = {
  employmentRate: 72,        // % of completers who entered employment (WIOA national avg)
  retentionRate: 81,         // % still employed at 6 months
  credentialRate: 55,        // % who attained a credential
  earningsCents: 3500000,    // median quarterly earnings: $35,000/yr = $8,750/qtr
  completionRate: 65,        // % who completed the program
  skillsGainsRate: 60,       // % who demonstrated measurable skills gains
  cfirFidelity: 70,          // CFIR self-reported fidelity score (0–100)
};

function scoreSubmission(sub: typeof partnerOutcomeSubmissions.$inferSelect) {
  const served = sub.participantsServed || 1;
  const completed = sub.participantsCompleted || 0;

  // Rate-based metrics (clamp 0–100)
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const employmentRate = (sub.enteredEmployment / served) * 100;
  const retentionRate = sub.enteredEmployment > 0
    ? (sub.retainedEmployment6mo / sub.enteredEmployment) * 100 : 0;
  const credentialRate = (sub.credentialsAttained / served) * 100;
  const completionRate = (completed / served) * 100;
  const skillsGainsRate = (sub.measurableSkillsGains / served) * 100;

  // Score each metric vs. benchmark (100 = meets benchmark, 0 = zero performance)
  const score = (actual: number, bench: number) => clamp((actual / Math.max(bench, 1)) * 100);

  const employmentRateScore = score(employmentRate, BENCHMARKS.employmentRate);
  const retentionRateScore = score(retentionRate, BENCHMARKS.retentionRate);
  const credentialRateScore = score(credentialRate, BENCHMARKS.credentialRate);
  const completionRateScore = score(completionRate, BENCHMARKS.completionRate);
  const skillsGainsScore = score(skillsGainsRate, BENCHMARKS.skillsGainsRate);

  // Earnings: compare median earnings (cents) to benchmark quarterly earnings
  const earningsBenchmarkCents = BENCHMARKS.earningsCents;
  const earningsScore = sub.medianEarnings
    ? score(sub.medianEarnings, earningsBenchmarkCents)
    : 50; // neutral if not reported

  const cfirFidelityScore = sub.cfirFidelityScore != null
    ? clamp(sub.cfirFidelityScore) : 50; // neutral if not reported

  // WIOA indicators (60%) + CFIR fidelity (20%) + completion (10%) + skills gains (10%)
  const overallScore = clamp(
    employmentRateScore * 0.20 +
    retentionRateScore * 0.15 +
    earningsScore * 0.10 +
    credentialRateScore * 0.15 +
    completionRateScore * 0.10 +
    skillsGainsScore * 0.10 +
    cfirFidelityScore * 0.20,
  );

  // Tier assignment
  let tier: "gold" | "silver" | "bronze" | "provisional";
  if (overallScore >= 80) tier = "gold";
  else if (overallScore >= 65) tier = "silver";
  else if (overallScore >= 45) tier = "bronze";
  else tier = "provisional";

  return {
    submissionId: sub.id,
    orgName: sub.orgName,
    programName: sub.programName,
    reportingPeriod: sub.reportingPeriod,
    employmentRateScore,
    retentionRateScore,
    earningsScore,
    credentialRateScore,
    skillsGainsScore,
    completionRateScore,
    cfirFidelityScore,
    overallScore,
    tier,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Public: get all scored programs (for collective impact dashboard)
scorecardRouter.get("/scorecard", async (_req, res) => {
  try {
    const scores = await db
      .select()
      .from(partnerEffectivenessScores)
      .orderBy(desc(partnerEffectivenessScores.overallScore));
    res.json(scores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: collective impact summary
scorecardRouter.get("/scorecard/summary", async (_req, res) => {
  try {
    const subs = await db
      .select()
      .from(partnerOutcomeSubmissions)
      .where(eq(partnerOutcomeSubmissions.status, "approved"));

    const totalParticipants = subs.reduce((s, r) => s + r.participantsServed, 0);
    const totalEmployed = subs.reduce((s, r) => s + r.enteredEmployment, 0);
    const totalCredentials = subs.reduce((s, r) => s + r.credentialsAttained, 0);
    const totalRetained = subs.reduce((s, r) => s + r.retainedEmployment6mo, 0);
    const uniqueOrgs = new Set(subs.map(s => s.orgName)).size;

    // Score distribution
    const scores = await db.select().from(partnerEffectivenessScores);
    const tierCounts = { gold: 0, silver: 0, bronze: 0, provisional: 0 };
    for (const s of scores) {
      tierCounts[s.tier as keyof typeof tierCounts]++;
    }

    res.json({
      totalParticipantsServed: totalParticipants,
      totalEmployed,
      totalCredentials,
      retentionCount: totalRetained,
      partnerOrgs: uniqueOrgs,
      submissions: subs.length,
      tierDistribution: tierCounts,
      employmentRate: totalParticipants > 0
        ? Math.round((totalEmployed / totalParticipants) * 100) : 0,
      credentialRate: totalParticipants > 0
        ? Math.round((totalCredentials / totalParticipants) * 100) : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticated: submit program outcomes
scorecardRouter.post("/scorecard/submit", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = insertPartnerOutcomeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const [sub] = await db
      .insert(partnerOutcomeSubmissions)
      .values({ ...parsed.data, submittedBy: user.id, status: "pending" })
      .returning();

    // Auto-score and create effectiveness record
    const scoreData = scoreSubmission(sub);
    const [scoreRecord] = await db
      .insert(partnerEffectivenessScores)
      .values(scoreData)
      .returning();

    // Auto-approve (can add manual review later)
    await db
      .update(partnerOutcomeSubmissions)
      .set({ status: "approved" })
      .where(eq(partnerOutcomeSubmissions.id, sub.id));

    res.json({ submission: sub, score: scoreRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticated: my org's submissions
scorecardRouter.get("/scorecard/my-submissions", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const subs = await db
      .select()
      .from(partnerOutcomeSubmissions)
      .where(eq(partnerOutcomeSubmissions.submittedBy, user.id))
      .orderBy(desc(partnerOutcomeSubmissions.createdAt));
    res.json(subs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Learner profile routes (Gap 5) — co-located here for simplicity
import {
  learnerProfiles,
  insertLearnerProfileSchema,
} from "../shared/schema";

scorecardRouter.get("/learner-profile", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [profile] = await db
      .select()
      .from(learnerProfiles)
      .where(eq(learnerProfiles.userId, user.id))
      .limit(1);

    if (!profile) {
      // Auto-create with defaults
      const [created] = await db
        .insert(learnerProfiles)
        .values({ userId: user.id })
        .returning();
      return res.json(created);
    }
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

scorecardRouter.put("/learner-profile", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const allowed = ["readingLevel", "preferredLanguage", "captionsEnabled",
      "highContrastEnabled", "screenReaderMode"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    updates.updatedAt = new Date();

    const existing = await db
      .select()
      .from(learnerProfiles)
      .where(eq(learnerProfiles.userId, user.id))
      .limit(1);

    if (existing.length === 0) {
      const [created] = await db
        .insert(learnerProfiles)
        .values({ userId: user.id, ...updates })
        .returning();
      return res.json(created);
    }

    const [updated] = await db
      .update(learnerProfiles)
      .set(updates)
      .where(eq(learnerProfiles.userId, user.id))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
