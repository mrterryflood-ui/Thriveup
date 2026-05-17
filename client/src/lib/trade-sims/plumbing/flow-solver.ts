/**
 * Plumbing pipe-network flow solver (steady-state, incompressible).
 *
 * Uses the Hardy-Cross method, generalized as a Newton-Raphson iteration on
 * junction heads (the modern node-based formulation that is mathematically
 * equivalent to classical loop-based Hardy-Cross for any pipe network with
 * pressure boundaries). This handles open networks (reservoirs at fixed head)
 * naturally — classical loop Hardy-Cross requires "pseudo-loops" for that
 * case and is harder to make robust.
 *
 * Head-loss model: Darcy-Weisbach.
 *     h_f = K * Q * |Q|     where    K = 8 * f * L / (pi^2 * g * D^5)
 *
 * Optional pump elements add a constant head boost along a pipe; optional
 * valve restrictions add to K. Closed valves remove the pipe. One-way pipes
 * (check valves) are handled with an outer active-set loop: if a one-way
 * pipe shows reverse flow, close it and re-solve; if a closed one-way pipe
 * shows forward driving head, reopen it.
 *
 * All errors surface as `{ ok: false, error: string }` — no throws — so the
 * lesson player can render them inline.
 *
 * Units: SI (m, m^3/s, m head). Caller is responsible for unit conversions.
 */

const G = 9.80665; // gravitational acceleration, m/s^2

export interface Pipe {
  id: string;
  from: string; // junction id
  to: string; // junction id
  length: number; // m
  diameter: number; // m
  frictionFactor?: number; // dimensionless Darcy f; default 0.02
  pumpHead?: number; // m of head added in the from->to direction
  valveClosed?: boolean;
  valveKAdd?: number; // additional K added by a restricting valve
  /**
   * If true, this pipe blocks reverse flow. Models a check valve.
   * When the solver finds the pipe would carry negative flow (to->from),
   * it is treated as closed for the next pass. When closed but driving
   * head reappears in the forward (from->to) direction, it reopens.
   */
  oneWay?: boolean;
}

export interface Junction {
  id: string;
  fixedHead?: number; // m (reservoir or pressure boundary)
  demand?: number; // m^3/s, positive = withdrawn from the junction
}

export interface FlowSolveInput {
  pipes: Pipe[];
  junctions: Junction[];
  maxIterations?: number; // default 50
  tolerance?: number; // m^3/s, default 1e-8
}

export interface FlowSolveResult {
  ok: true;
  heads: Record<string, number>; // junction id -> head (m)
  flows: Record<string, number>; // pipe id -> flow (m^3/s), positive = from->to
  iterations: number;
  residual: number; // max |mass-balance error| at any free junction (m^3/s)
  /**
   * Ids of one-way pipes that the active-set loop forced closed because
   * the network was trying to push flow through them backwards. Useful for
   * UI to highlight "this check valve prevented backflow."
   */
  closedOneWays: string[];
}

export interface FlowSolveError {
  ok: false;
  error: string;
}

/** K = 8 f L / (pi^2 g D^5) — head loss coefficient for h_f = K Q |Q|. */
function pipeK(p: Pipe): number {
  const f = p.frictionFactor ?? 0.02;
  const k = (8 * f * p.length) / (Math.PI * Math.PI * G * Math.pow(p.diameter, 5));
  return k + (p.valveKAdd ?? 0);
}

/**
 * Solve a pipe network for steady-state flows and junction heads.
 *
 * @returns Either a successful result or a structured error. Never throws.
 */
export function solveFlow(input: FlowSolveInput): FlowSolveResult | FlowSolveError {
  const { pipes, junctions } = input;
  const maxIter = input.maxIterations ?? 50;
  const tol = input.tolerance ?? 1e-8;

  // --- 1. Validate inputs ---------------------------------------------------
  if (junctions.length === 0) {
    return { ok: false, error: "Network has no junctions." };
  }
  const jIds = new Set<string>();
  for (const j of junctions) {
    if (jIds.has(j.id)) return { ok: false, error: `Duplicate junction id: ${j.id}` };
    jIds.add(j.id);
    if (j.fixedHead !== undefined && (j.demand ?? 0) !== 0) {
      return {
        ok: false,
        error: `Junction ${j.id} has both fixedHead and a nonzero demand — over-constrained.`,
      };
    }
    if (j.fixedHead !== undefined && !Number.isFinite(j.fixedHead)) {
      return { ok: false, error: `Junction ${j.id} fixedHead is not finite.` };
    }
    if (j.fixedHead !== undefined && j.fixedHead < 0) {
      return {
        ok: false,
        error: `Junction ${j.id} has negative pressure boundary (fixedHead=${j.fixedHead} m). Heads must be >= 0; use a reference datum at or below the lowest point in the network.`,
      };
    }
  }
  const pIds = new Set<string>();
  // Active pipes: exclude user-closed valves and degenerate pipes.
  const userOpen: Pipe[] = [];
  for (const p of pipes) {
    if (pIds.has(p.id)) return { ok: false, error: `Duplicate pipe id: ${p.id}` };
    pIds.add(p.id);
    if (!jIds.has(p.from)) return { ok: false, error: `Pipe ${p.id} references unknown junction ${p.from}` };
    if (!jIds.has(p.to)) return { ok: false, error: `Pipe ${p.id} references unknown junction ${p.to}` };
    if (p.from === p.to) return { ok: false, error: `Pipe ${p.id} loops back on itself.` };
    if (p.length <= 0) return { ok: false, error: `Pipe ${p.id} has non-positive length ${p.length}.` };
    if (p.diameter <= 0) return { ok: false, error: `Pipe ${p.id} has non-positive diameter ${p.diameter}.` };
    if ((p.frictionFactor ?? 0.02) <= 0) {
      return { ok: false, error: `Pipe ${p.id} has non-positive friction factor.` };
    }
    if (p.valveClosed) continue;
    userOpen.push(p);
  }

  const fixedHeadMap = new Map<string, number>();
  const demandMap = new Map<string, number>();
  for (const j of junctions) {
    if (j.fixedHead !== undefined) fixedHeadMap.set(j.id, j.fixedHead);
    demandMap.set(j.id, j.demand ?? 0);
  }
  if (fixedHeadMap.size === 0) {
    return {
      ok: false,
      error: "Network has no fixed-head boundary — at least one junction must have a reservoir/tank/pressure boundary.",
    };
  }

  // --- 2. Active-set outer loop for one-way (check valve) pipes ----------
  // `forcedClosed` is the set of one-way pipe ids the active-set logic has
  // decided to close to prevent reverse flow. Inner solve runs with
  // `userOpen - forcedClosed`. After each inner solve, we check whether the
  // active set is consistent: any open one-way pipe with negative flow gets
  // closed; any closed one-way pipe with forward driving head gets reopened.
  // Reverse-flow closure threshold is decoupled from the caller-supplied
  // solver tolerance: even with a loose `tol`, any nonzero negative flow
  // through a one-way pipe must trigger closure (the Day 6 "no backflow ever"
  // contract). 1e-12 m^3/s ≈ 1.6e-8 gpm — well below any meaningful leak.
  const FLOW_NEG_TOL = 1e-12;
  const ONEWAY_REOPEN_TOL = 1e-6; // m — forward head threshold to reopen
  const MAX_ACTIVE_SET_PASSES = 20;
  const forcedClosed = new Set<string>();

  let result: FlowSolveResult | FlowSolveError | null = null;
  let pass = 0;
  for (; pass < MAX_ACTIVE_SET_PASSES; pass++) {
    const active = userOpen.filter((p) => !forcedClosed.has(p.id));
    result = solveInner(active, junctions, fixedHeadMap, demandMap, maxIter, tol);
    if (!result.ok) return result;

    // Fill zero flow for any pipe we excluded so the result is complete.
    for (const p of pipes) {
      if (!(p.id in result.flows)) result.flows[p.id] = 0;
    }

    // Decide whether the active set changed.
    let changed = false;
    for (const p of userOpen) {
      if (!p.oneWay) continue;
      if (forcedClosed.has(p.id)) {
        // Closed: would it reopen? Need forward driving head.
        const hf = result.heads[p.from];
        const ht = result.heads[p.to];
        if (hf === undefined || ht === undefined) continue;
        const dH = hf + (p.pumpHead ?? 0) - ht;
        if (dH > ONEWAY_REOPEN_TOL) {
          forcedClosed.delete(p.id);
          changed = true;
        }
      } else {
        // Open: is it carrying reverse flow?
        const q = result.flows[p.id] ?? 0;
        if (q < -FLOW_NEG_TOL) {
          forcedClosed.add(p.id);
          changed = true;
        }
      }
    }
    if (!changed) {
      result.closedOneWays = [...forcedClosed];
      return result;
    }
  }
  return {
    ok: false,
    error: `One-way pipe active-set did not stabilize after ${MAX_ACTIVE_SET_PASSES} passes — check-valve placement may be cyclic or inconsistent.`,
  };
}

/**
 * Inner solver: given a pre-filtered active pipe set (user-open AND not
 * forced-closed by the active-set loop), compute heads and flows. Same
 * Newton-Raphson on junction heads as the original implementation.
 */
function solveInner(
  active: Pipe[],
  junctions: Junction[],
  fixedHeadMap: Map<string, number>,
  demandMap: Map<string, number>,
  maxIter: number,
  tol: number,
): FlowSolveResult | FlowSolveError {
  // --- Reachability: every free junction must reach a fixed-head one -----
  const adj = new Map<string, string[]>();
  for (const j of junctions) adj.set(j.id, []);
  for (const p of active) {
    adj.get(p.from)!.push(p.to);
    adj.get(p.to)!.push(p.from);
  }
  const reached = new Set<string>(fixedHeadMap.keys());
  const queue: string[] = [...fixedHeadMap.keys()];
  while (queue.length) {
    const n = queue.shift()!;
    for (const nb of adj.get(n) ?? []) {
      if (!reached.has(nb)) {
        reached.add(nb);
        queue.push(nb);
      }
    }
  }
  for (const j of junctions) {
    if (!reached.has(j.id)) {
      return {
        ok: false,
        error: `Junction ${j.id} is not connected to any fixed-head boundary — network is over-constrained or disconnected. (A check valve may be installed in the wrong direction, blocking the only supply path.)`,
      };
    }
  }

  // --- Index free (non-fixed-head) junctions ----------------------------
  const free: string[] = [];
  const freeIdx = new Map<string, number>();
  for (const j of junctions) {
    if (!fixedHeadMap.has(j.id)) {
      freeIdx.set(j.id, free.length);
      free.push(j.id);
    }
  }
  const n = free.length;

  // Initial head guess: average of fixed heads.
  const fixedSum = [...fixedHeadMap.values()].reduce((a, b) => a + b, 0);
  const fixedAvg = fixedSum / fixedHeadMap.size;
  const H = new Array<number>(n).fill(fixedAvg);

  // Precompute pipe Ks.
  const K = new Map<string, number>();
  for (const p of active) K.set(p.id, pipeK(p));

  const headOf = (id: string): number => {
    const fh = fixedHeadMap.get(id);
    if (fh !== undefined) return fh;
    return H[freeIdx.get(id)!];
  };

  // Flow on pipe from->to given current heads. Uses smoothed |Q|-linearization
  // near zero to keep the Jacobian non-singular.
  const Q_EPS = 1e-12;
  const pipeFlow = (p: Pipe, hf: number, ht: number): { q: number; dqdh: number } => {
    const k = K.get(p.id)!;
    const dH = hf + (p.pumpHead ?? 0) - ht;
    const aDH = Math.abs(dH);
    const q = Math.sign(dH) * Math.sqrt(aDH / k);
    const dqdh = 1 / (2 * Math.sqrt(k * Math.max(aDH, Q_EPS)));
    return { q, dqdh };
  };

  if (n === 0) {
    // Pure boundary problem: every junction is fixed-head. Just compute flows.
    const flows: Record<string, number> = {};
    for (const p of active) {
      const { q } = pipeFlow(p, fixedHeadMap.get(p.from)!, fixedHeadMap.get(p.to)!);
      flows[p.id] = q;
    }
    const heads: Record<string, number> = {};
    for (const j of junctions) heads[j.id] = fixedHeadMap.get(j.id)!;
    return { ok: true, heads, flows, iterations: 0, residual: 0, closedOneWays: [] };
  }

  // Adjacency by free junction (kept for parity with original; unused below).
  void adj;

  // --- Newton-Raphson loop ----------------------------------------------
  let lastResidual = Infinity;
  let iter = 0;
  for (; iter < maxIter; iter++) {
    const F = new Array<number>(n).fill(0);
    const J: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

    for (let i = 0; i < n; i++) {
      F[i] = -(demandMap.get(free[i]) ?? 0);
    }

    for (const p of active) {
      const hf = headOf(p.from);
      const ht = headOf(p.to);
      const { q, dqdh } = pipeFlow(p, hf, ht);
      const fi = freeIdx.get(p.from);
      const ti = freeIdx.get(p.to);
      if (fi !== undefined) F[fi] += -q;
      if (ti !== undefined) F[ti] += +q;
      if (fi !== undefined) {
        J[fi][fi] += -dqdh;
        if (ti !== undefined) J[fi][ti] += +dqdh;
      }
      if (ti !== undefined) {
        J[ti][ti] += -dqdh;
        if (fi !== undefined) J[ti][fi] += +dqdh;
      }
    }

    const maxRes = F.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    lastResidual = maxRes;
    if (maxRes < tol) break;

    const A: number[][] = J.map((row, i) => [...row, -F[i]]);
    for (let i = 0; i < n; i++) {
      let piv = i;
      let pivVal = Math.abs(A[i][i]);
      for (let r = i + 1; r < n; r++) {
        if (Math.abs(A[r][i]) > pivVal) {
          pivVal = Math.abs(A[r][i]);
          piv = r;
        }
      }
      if (pivVal < 1e-18) {
        return {
          ok: false,
          error: "Singular Jacobian during Newton iteration — network likely disconnected or degenerate.",
        };
      }
      if (piv !== i) {
        const tmp = A[i];
        A[i] = A[piv];
        A[piv] = tmp;
      }
      for (let r = i + 1; r < n; r++) {
        const factor = A[r][i] / A[i][i];
        if (factor === 0) continue;
        for (let c = i; c <= n; c++) A[r][c] -= factor * A[i][c];
      }
    }
    const dH = new Array<number>(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = A[i][n];
      for (let c = i + 1; c < n; c++) s -= A[i][c] * dH[c];
      dH[i] = s / A[i][i];
    }
    const DAMP = 0.7;
    for (let i = 0; i < n; i++) H[i] += DAMP * dH[i];
  }

  if (lastResidual >= tol && iter >= maxIter) {
    return {
      ok: false,
      error: `Hardy-Cross solver did not converge within ${maxIter} iterations (residual ${lastResidual.toExponential(3)} m^3/s).`,
    };
  }

  const heads: Record<string, number> = {};
  for (const j of junctions) heads[j.id] = headOf(j.id);
  const flows: Record<string, number> = {};
  for (const p of active) {
    const { q } = pipeFlow(p, headOf(p.from), headOf(p.to));
    flows[p.id] = q;
  }

  return { ok: true, heads, flows, iterations: iter, residual: lastResidual, closedOneWays: [] };
}

/** Convenience: head loss across a pipe at a given flow (m). */
export function pipeHeadLoss(p: Pipe, flowM3s: number): number {
  return pipeK(p) * flowM3s * Math.abs(flowM3s);
}

/** Convenience: exposed for component-defs unit conversions. */
export { pipeK as pipeKCoefficient };
