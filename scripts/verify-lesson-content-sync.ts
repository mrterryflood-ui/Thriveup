/**
 * Verifies lesson content quality across all three core trades (plumbing, HVAC, electrical).
 * For each lesson, checks:
 *   - dayNumber > 0
 *   - title non-empty
 *   - concept.blurb.length > 50
 *   - concept.keyTerms.length >= 2
 *   - guidedSteps.length >= 1
 *   - soloChallenge.prompt.length > 20
 *   - credentialPathway non-empty
 *
 * Usage: npx tsx scripts/verify-lesson-content-sync.ts
 */

import { PLUMBING_LESSONS } from "../shared/data/trade-sims/plumbing-lessons";
import { HVAC_LESSONS } from "../shared/data/trade-sims/hvac-lessons";
import { ELECTRICAL_LESSONS } from "../shared/data/trade-sims/electrical-lessons";

type AnyLesson = {
  dayNumber: number;
  title: string;
  concept: { blurb: string; keyTerms: Array<unknown> };
  guidedSteps: Array<unknown>;
  soloChallenge: { prompt: string };
  credentialPathway: string;
};

const failures: string[] = [];

function checkLesson(trade: string, lesson: AnyLesson) {
  const tag = `[${trade} day ${lesson.dayNumber}]`;

  if (!(lesson.dayNumber > 0)) {
    failures.push(`${tag} dayNumber must be > 0, got ${lesson.dayNumber}`);
  }
  if (!lesson.title || lesson.title.trim().length === 0) {
    failures.push(`${tag} title is empty`);
  }
  if (!lesson.concept?.blurb || lesson.concept.blurb.length <= 50) {
    failures.push(`${tag} concept.blurb too short (${lesson.concept?.blurb?.length ?? 0} chars, need > 50)`);
  }
  if (!lesson.concept?.keyTerms || lesson.concept.keyTerms.length < 2) {
    failures.push(`${tag} concept.keyTerms has fewer than 2 entries (got ${lesson.concept?.keyTerms?.length ?? 0})`);
  }
  if (!lesson.guidedSteps || lesson.guidedSteps.length < 1) {
    failures.push(`${tag} guidedSteps is empty`);
  }
  if (!lesson.soloChallenge?.prompt || lesson.soloChallenge.prompt.length <= 20) {
    failures.push(`${tag} soloChallenge.prompt too short (${lesson.soloChallenge?.prompt?.length ?? 0} chars, need > 20)`);
  }
  if (!lesson.credentialPathway || lesson.credentialPathway.trim().length === 0) {
    failures.push(`${tag} credentialPathway is empty`);
  }
}

const plumbing = PLUMBING_LESSONS as unknown as AnyLesson[];
const hvac = HVAC_LESSONS as unknown as AnyLesson[];
const electrical = ELECTRICAL_LESSONS as unknown as AnyLesson[];

for (const lesson of plumbing) checkLesson("plumbing", lesson);
for (const lesson of hvac) checkLesson("hvac", lesson);
for (const lesson of electrical) checkLesson("electrical", lesson);

if (failures.length > 0) {
  console.error("✗ Lesson content sync FAILED:");
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  process.exit(1);
}

console.log(
  `✓ Lesson content sync verified: ${plumbing.length} plumbing + ${hvac.length} hvac + ${electrical.length} electrical lessons`
);
process.exit(0);
