/**
 * Server-side attempt grading for the adaptive growth path.
 *
 * TRUST BOUNDARY: the client submits only its canvas representation — the
 * placed components with their connectivity (shared node ids). The server
 * reconstructs the network, runs the SAME authoritative solver the sim uses
 * (MNA circuit solver for automotive, pipe-network flow solver for
 * plumbing), and grades the *server-computed* physics against the rubric it
 * holds on the lesson row. Client-generated solver output (voltages,
 * currents, closedOneWays) is never accepted; pass/fail, concept tags, and
 * summaries are all derived here.
 *
 * The solvers and adapters are pure numeric modules with no DOM/React
 * dependencies, so the server imports them from the client tree directly —
 * one physics engine, two callers, zero drift.
 */

import { gradeSag } from "../client/src/lib/trade-sims/automotive/sag-rubric";
import type { SagRubric } from "../client/src/lib/trade-sims/automotive/sag-rubric";
import {
  placedToSolverElements as autoPlacedToElements,
  type AdapterContext,
  type PlacedAutoComponent,
} from "../client/src/lib/trade-sims/automotive/component-defs";
import { solveCircuit, type SolveOutput } from "../client/src/lib/trade-sims/electrical/circuit-solver";
import { gradeBackflow, type BackflowRubric } from "../client/src/lib/trade-sims/plumbing/backflow-rubric";
import { placedToSolverElements as plumbingPlacedToElements, type PlacedPlumbingComponent } from "../client/src/lib/trade-sims/plumbing/component-defs";
import { solveFlow, type FlowSolveResult } from "../client/src/lib/trade-sims/plumbing/flow-solver";
import {
  SAG_MODE_CONCEPT,
  BACKFLOW_MODE_CONCEPT,
  SAG_STRETCH,
  BACKFLOW_STRETCH,
} from "../shared/data/trade-sims/concept-tags";

export type AttemptTier = "standard" | "stretch";

export type GradedAttempt =
  | { ok: true; passed: boolean; missedConcepts: string[]; summary: string }
  | { ok: false; error: string };

interface SoloChallengeLike {
  sagRubric?: { mode: string; passMessage?: string; failMessage?: string };
  backflowRubric?: { mode: string; passMessage?: string; failMessage?: string };
}

// Bounds that keep a forged canvas from becoming a DoS vector: the MNA
// solver allocates O(nodeCount²) matrices.
const MAX_COMPONENTS = 200;
const MAX_NODE_ID = 2000;

class ValidationError extends Error {}
class NoStretchError extends Error {}

/** Structural validation of a submitted automotive canvas. */
function validateAutoComponents(components: unknown): PlacedAutoComponent[] {
  if (!Array.isArray(components) || components.length === 0 || components.length > MAX_COMPONENTS) {
    throw new ValidationError("Submit the placed components from your canvas.");
  }
  const seen = new Set<string>();
  for (const c of components) {
    if (!c || typeof c !== "object") throw new ValidationError("Malformed component.");
    const comp = c as Record<string, unknown>;
    if (typeof comp.id !== "string" || comp.id.length === 0 || comp.id.length > 64 || seen.has(comp.id)) {
      throw new ValidationError("Component ids must be unique non-empty strings.");
    }
    seen.add(comp.id);
    if (typeof comp.kind !== "string" || comp.kind.length > 64) throw new ValidationError("Malformed component kind.");
    const tn = comp.terminalNodes;
    if (!tn || typeof tn !== "object") throw new ValidationError("Each component needs terminalNodes connectivity.");
    for (const v of Object.values(tn as Record<string, unknown>)) {
      if (!Number.isInteger(v) || (v as number) < 0 || (v as number) > MAX_NODE_ID) {
        throw new ValidationError("terminalNodes must map to bounded integer node ids.");
      }
    }
    if (comp.props !== undefined && (comp.props === null || typeof comp.props !== "object")) {
      throw new ValidationError("Component props must be an object.");
    }
    if (comp.props === undefined) comp.props = {};
  }
  return components as PlacedAutoComponent[];
}

/** Structural validation of a submitted plumbing canvas. */
function validatePlumbingComponents(components: unknown): PlacedPlumbingComponent[] {
  if (!Array.isArray(components) || components.length === 0 || components.length > MAX_COMPONENTS) {
    throw new ValidationError("Submit the placed components from your canvas.");
  }
  const seen = new Set<string>();
  for (const c of components) {
    if (!c || typeof c !== "object") throw new ValidationError("Malformed component.");
    const comp = c as Record<string, unknown>;
    if (typeof comp.id !== "string" || comp.id.length === 0 || comp.id.length > 64 || seen.has(comp.id)) {
      throw new ValidationError("Component ids must be unique non-empty strings.");
    }
    seen.add(comp.id);
    if (typeof comp.kind !== "string" || comp.kind.length > 64) throw new ValidationError("Malformed component kind.");
    const tn = comp.terminalNodes;
    if (!tn || typeof tn !== "object") throw new ValidationError("Each component needs terminalNodes connectivity.");
    for (const v of Object.values(tn as Record<string, unknown>)) {
      if (typeof v !== "string" || v.length === 0 || v.length > 64) {
        throw new ValidationError("Plumbing terminalNodes must map to junction id strings.");
      }
    }
    if (comp.props !== undefined && (comp.props === null || typeof comp.props !== "object")) {
      throw new ValidationError("Component props must be an object.");
    }
    if (comp.props === undefined) comp.props = {};
  }
  return components as PlacedPlumbingComponent[];
}

/**
 * Re-run the authoritative MNA circuit solver on a submitted automotive
 * canvas — mirrors the client canvas's solve path exactly.
 */
function solveAutoServerSide(comps: PlacedAutoComponent[]): SolveOutput | null {
  let maxNode = 0;
  for (const c of comps) {
    for (const v of Object.values(c.terminalNodes)) {
      if (typeof v === "number" && v > maxNode) maxNode = v;
    }
  }
  let counter = maxNode + 1;
  const ctx: AdapterContext = { allocNode: () => counter++ };
  const elements = comps.flatMap((c) => {
    try {
      return autoPlacedToElements(c, ctx);
    } catch {
      return [];
    }
  });
  if (elements.length === 0) return null;
  const out = solveCircuit({ nodeCount: counter, elements });
  return out.ok ? out : null;
}

/** Re-run the authoritative flow solver on a submitted plumbing canvas. */
function solvePlumbingServerSide(comps: PlacedPlumbingComponent[]): FlowSolveResult | null {
  const { pipes, junctions } = plumbingPlacedToElements(comps);
  if (pipes.length === 0) return null;
  const out = solveFlow({ pipes, junctions });
  return out.ok ? out : null;
}

/**
 * Grade a submitted attempt entirely server-side: validate the canvas,
 * re-run the applicable solver, grade the recomputed physics.
 *
 * @param soloChallenge lesson.soloChallenge JSON from the DB (authoritative rubric source)
 * @param tier          standard = the lesson's own rubric; stretch = harder server-registered variant
 * @param components    the caller's placed components + connectivity (untrusted, validated here)
 */
export function gradeAttemptServerSide(
  soloChallenge: unknown,
  tier: AttemptTier,
  components: unknown,
): GradedAttempt {
  const sc = (soloChallenge ?? null) as SoloChallengeLike | null;
  const sagRubricRaw = sc?.sagRubric && typeof sc.sagRubric.mode === "string" ? sc.sagRubric : null;
  const backflowRubricRaw =
    sc?.backflowRubric && typeof sc.backflowRubric.mode === "string" ? sc.backflowRubric : null;

  if (!sagRubricRaw && !backflowRubricRaw) {
    return { ok: false, error: "This lesson's solo challenge has no graded rubric — attempts are not recorded for it." };
  }

  try {
    if (sagRubricRaw) {
      const rubric: SagRubric =
        tier === "stretch"
          ? (SAG_STRETCH[sagRubricRaw.mode]?.rubric as SagRubric | undefined) ??
            (() => {
              throw new NoStretchError();
            })()
          : (sagRubricRaw as SagRubric);
      const comps = validateAutoComponents(components);
      const solve = solveAutoServerSide(comps);
      const grade = gradeSag(rubric, solve, comps);
      if (grade.status === "pending") {
        return { ok: false, error: "The submitted circuit could not be solved — wire it up and run the sim first." };
      }
      const passed = grade.status === "pass";
      const conceptTag = SAG_MODE_CONCEPT[(rubric as { mode: string }).mode];
      return {
        ok: true,
        passed,
        missedConcepts: !passed && conceptTag ? [conceptTag] : [],
        summary: String(grade.message ?? "").slice(0, 500),
      };
    }

    const rubric: BackflowRubric =
      tier === "stretch"
        ? (BACKFLOW_STRETCH[backflowRubricRaw!.mode]?.rubric as BackflowRubric | undefined) ??
          (() => {
            throw new NoStretchError();
          })()
        : (backflowRubricRaw as BackflowRubric);
    const comps = validatePlumbingComponents(components);
    const solve = solvePlumbingServerSide(comps);
    const grade = gradeBackflow(rubric, solve, comps);
    if (grade.status === "pending") {
      return { ok: false, error: "The submitted network could not be solved — connect it and run the sim first." };
    }
    const passed = grade.status === "pass";
    const conceptTag = BACKFLOW_MODE_CONCEPT[rubric.mode];
    return {
      ok: true,
      passed,
      missedConcepts: !passed && conceptTag ? [conceptTag] : [],
      summary: String(grade.message ?? "").slice(0, 500),
    };
  } catch (err) {
    if (err instanceof NoStretchError) {
      return { ok: false, error: "No stretch variant exists for this lesson." };
    }
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    // Malformed forged state must fail loudly as a bad request, not a 500.
    return { ok: false, error: "Could not grade the submitted canvas." };
  }
}

/** Whether a lesson's solo challenge has any graded rubric at all. */
export function soloChallengeHasRubric(soloChallenge: unknown): boolean {
  const sc = (soloChallenge ?? null) as SoloChallengeLike | null;
  return !!(sc?.sagRubric?.mode || sc?.backflowRubric?.mode);
}
