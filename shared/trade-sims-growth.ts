/**
 * Trade Sims adaptive growth path — pure logic shared by server and client.
 *
 * IGN doctrine applied to the flagship training experience:
 *   - Mastery gating: Day N+1 unlocks only when Day N's solo challenge passed
 *     (or the learner/staff explicitly overrode the gate — nobody hard-blocks).
 *   - Weakness tracking: failed rubric checks tag concepts; aggregates feed
 *     targeted review reps and the AI tutor debrief.
 *
 * Kept dependency-free so it can run in node --test without a DB.
 */

export interface GrowthProgressLike {
  lessonId: number;
  status: string;
  soloPassed: boolean;
  stretchPassed: boolean;
  masteryOverride: boolean;
  weakConcepts?: Record<string, number> | null;
}

export interface GrowthLessonLike {
  id: number;
  dayNumber: number;
}

export interface LessonGrowthState {
  lessonId: number;
  dayNumber: number;
  unlocked: boolean;
  /** Why it is unlocked/locked — for UI copy. */
  reason: "first" | "prev-mastered" | "override" | "locked";
  mastered: boolean;
  stretchPassed: boolean;
  overridden: boolean;
  weakConcepts: Record<string, number>;
}

/**
 * A lesson counts as mastered when its solo challenge passed, OR — to
 * grandfather rows written before adaptivity existed — when it was completed
 * before the soloPassed column was introduced (completed && attemptCount-era
 * rows have soloPassed=false but represent the old honest-completion gate).
 * We deliberately do NOT grandfather here: `completed` alone no longer
 * unlocks the next day, but the explicit override keeps nobody hard-blocked.
 */
export function isMastered(p: GrowthProgressLike | undefined): boolean {
  return !!p && p.soloPassed;
}

/**
 * Compute unlock state for every lesson in a trade.
 * Lessons must be the full active set; they are sorted by dayNumber here.
 */
export function computeGrowthStates(
  lessons: GrowthLessonLike[],
  progressByLessonId: Map<number, GrowthProgressLike>,
): LessonGrowthState[] {
  const sorted = [...lessons].sort((a, b) => a.dayNumber - b.dayNumber);
  const out: LessonGrowthState[] = [];
  let prevMastered = true; // first lesson is always unlocked
  let isFirst = true;
  for (const l of sorted) {
    const p = progressByLessonId.get(l.id);
    const overridden = !!p?.masteryOverride;
    let reason: LessonGrowthState["reason"];
    let unlocked: boolean;
    if (isFirst) {
      reason = "first";
      unlocked = true;
    } else if (prevMastered) {
      reason = "prev-mastered";
      unlocked = true;
    } else if (overridden) {
      reason = "override";
      unlocked = true;
    } else {
      reason = "locked";
      unlocked = false;
    }
    const mastered = isMastered(p);
    out.push({
      lessonId: l.id,
      dayNumber: l.dayNumber,
      unlocked,
      reason,
      mastered,
      stretchPassed: !!p?.stretchPassed,
      overridden,
      weakConcepts: (p?.weakConcepts as Record<string, number>) ?? {},
    });
    prevMastered = mastered;
    isFirst = false;
  }
  return out;
}

/**
 * Merge a new attempt's missed concept tags into the running aggregate.
 * A PASSED attempt decays prior misses for the concepts it covered — the
 * learner demonstrated the skill, so stale weakness flags fade instead of
 * following them forever.
 */
export function mergeWeakConcepts(
  existing: Record<string, number> | null | undefined,
  missedConcepts: string[],
  passed: boolean,
): Record<string, number> {
  const next: Record<string, number> = { ...(existing ?? {}) };
  if (passed) {
    // Decay every tracked concept by 1 on a clean pass; drop zeros.
    for (const k of Object.keys(next)) {
      next[k] = next[k] - 1;
      if (next[k] <= 0) delete next[k];
    }
    return next;
  }
  for (const c of missedConcepts) {
    if (!c) continue;
    next[c] = (next[c] ?? 0) + 1;
  }
  return next;
}

/** Top-N weakest concepts, strongest signal first. */
export function topWeakConcepts(
  weak: Record<string, number> | null | undefined,
  n = 3,
): Array<{ concept: string; count: number }> {
  return Object.entries(weak ?? {})
    .map(([concept, count]) => ({ concept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
