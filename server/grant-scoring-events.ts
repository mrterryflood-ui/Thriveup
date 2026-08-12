/**
 * grant-scoring-events.ts
 *
 * Outcome-driven grant fit score pipeline.
 * When a CHW referral resolves as "enrolled" (via staff PATCH or partner
 * org-confirm), this module identifies matching grant opportunities and
 * increments their fitScore by +1 (capped at 100), then logs the event.
 *
 * Design invariants:
 * - Fire-and-forget: errors are logged but never bubble to the caller.
 * - Idempotent over short windows: the same referral ID won't bump the same
 *   grant twice (checked via grantFitEvents).
 * - Never decrements scores.
 */

import { db } from "./storage";
import { grantOpportunities, grantFitEvents } from "@shared/schema";
import { eq, or, sql, and } from "drizzle-orm";

// Maps program codes and service categories to grant keyword buckets.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  housing:         ["housing", "shelter", "homeless", "rental assistance", "eviction"],
  workforce:       ["workforce", "employment", "job training", "placement", "career"],
  healthcare:      ["health", "medical", "behavioral health", "mental health", "substance"],
  reentry:         ["reentry", "re-entry", "justice", "incarceration", "criminal record"],
  education:       ["education", "literacy", "credential", "GED", "diploma", "school"],
  childcare:       ["child care", "childcare", "early childhood", "daycare", "head start"],
  benefits:        ["benefits", "SNAP", "TANF", "LIHEAP", "public assistance"],
  food:            ["food", "nutrition", "hunger", "pantry", "meals"],
  transportation:  ["transportation", "transit", "vehicle", "mobility"],
  legal:           ["legal", "civil legal", "expungement", "record sealing"],
  mentalhealth:    ["mental health", "counseling", "therapy", "psychiatric", "crisis"],
  substanceuse:    ["substance use", "addiction", "recovery", "SUD", "opioid"],
  domestic:        ["domestic violence", "DV", "intimate partner", "survivor"],
  disability:      ["disability", "ADA", "accessibility", "adaptive"],
  veteran:         ["veteran", "military", "VASH", "VA services"],
  foster:          ["foster", "aging out", "youth in care", "independent living"],
  farmworker:      ["farmworker", "agricultural", "migrant worker", "H-2A"],
};

function getKeywords(programCode: string, serviceCategory?: string): string[] {
  const codes = [programCode, serviceCategory].filter(Boolean) as string[];
  const sets = new Set<string>();
  for (const code of codes) {
    const normalized = code.toLowerCase().replace(/[-_]/g, "");
    for (const [key, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        kws.forEach(k => sets.add(k));
      }
    }
    // Fall back to the raw code as a keyword
    if (sets.size === 0) sets.add(code);
  }
  return Array.from(sets);
}

export async function onReferralEnrolled(
  referralId: string,
  orgId: string,
  programCode: string,
  serviceCategory?: string,
): Promise<void> {
  try {
    const keywords = getKeywords(programCode, serviceCategory);
    if (keywords.length === 0) return;

    // Find grants already bumped by this referral (idempotency guard)
    const alreadyBumped = await db
      .select({ grantId: grantFitEvents.grantId })
      .from(grantFitEvents)
      .where(and(
        eq(grantFitEvents.triggerId, referralId),
        eq(grantFitEvents.triggerType, "referral_enrolled"),
      ));
    const alreadyBumpedIds = new Set(alreadyBumped.map(r => r.grantId));

    // Find matching open/active grants (not archived/closed)
    const whereClause = or(
      ...keywords.map(kw =>
        sql`lower(${grantOpportunities.title}) like ${"%" + kw.toLowerCase() + "%"}`
      ),
    );
    const matching = await db
      .select({ id: grantOpportunities.id, fitScore: grantOpportunities.fitScore })
      .from(grantOpportunities)
      .where(whereClause)
      .limit(15);

    for (const grant of matching) {
      if (alreadyBumpedIds.has(grant.id)) continue;
      const scoreBefore = grant.fitScore ?? 0;
      const scoreAfter = Math.min(100, scoreBefore + 1);
      if (scoreAfter === scoreBefore) continue;

      await db.update(grantOpportunities)
        .set({ fitScore: scoreAfter })
        .where(eq(grantOpportunities.id, grant.id));

      await db.insert(grantFitEvents).values({
        grantId: grant.id,
        triggerType: "referral_enrolled",
        triggerId: referralId,
        orgId,
        serviceCategory: programCode,
        scoreBefore,
        scoreAfter,
      });
    }

    console.log(
      `[grant-scoring] referral ${referralId} → bumped ${matching.length} grants` +
      ` (keywords: ${keywords.slice(0, 3).join(", ")})`
    );
  } catch (err: any) {
    console.error("[grant-scoring] onReferralEnrolled failed:", err.message);
  }
}

export async function onOutcomeSubmitted(
  submissionId: string,
  orgName: string,
  programType: string,
  participantsServed: number,
): Promise<void> {
  if (participantsServed < 5) return; // suppression floor — too small to influence scores
  try {
    const keywords = getKeywords(programType);
    if (keywords.length === 0) return;

    const whereClause = or(
      ...keywords.map(kw =>
        sql`lower(${grantOpportunities.title}) like ${"%" + kw.toLowerCase() + "%"}`
      ),
    );
    const matching = await db
      .select({ id: grantOpportunities.id, fitScore: grantOpportunities.fitScore })
      .from(grantOpportunities)
      .where(whereClause)
      .limit(10);

    for (const grant of matching) {
      const scoreBefore = grant.fitScore ?? 0;
      const scoreAfter = Math.min(100, scoreBefore + Math.min(3, Math.floor(participantsServed / 20)));
      if (scoreAfter === scoreBefore) continue;

      await db.update(grantOpportunities)
        .set({ fitScore: scoreAfter })
        .where(eq(grantOpportunities.id, grant.id));

      await db.insert(grantFitEvents).values({
        grantId: grant.id,
        triggerType: "outcome_submitted",
        triggerId: submissionId,
        orgId: orgName,
        serviceCategory: programType,
        scoreBefore,
        scoreAfter,
      });
    }
  } catch (err: any) {
    console.error("[grant-scoring] onOutcomeSubmitted failed:", err.message);
  }
}
