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
 * valve restrictions add to K. Closed valves remove the pipe.
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
  // Active pipes: exclude closed valves and degenerate pipes.
  const active: Pipe[] = [];
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
    active.push(p);
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

  // --- 2. Reachability: every free junction must reach a fixed-head one ----
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
        error: `Junction ${j.id} is not connected to any fixed-head boundary — network is over-constrained or disconnected.`,
      };
    }
  }

  // --- 3. Index free (non-fixed-head) junctions ----------------------------
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
  // dH := H_from + pumpHead - H_to.  h_f = K * Q * |Q|  =>  Q = sign(dH) sqrt(|dH|/K)
  // Derivative dQ/dH_from = 1/(2 K |Q|) (linearized).  We use a smoothing term.
  const Q_EPS = 1e-12;
  const pipeFlow = (p: Pipe, hf: number, ht: number): { q: number; dqdh: number } => {
    const k = K.get(p.id)!;
    const dH = hf + (p.pumpHead ?? 0) - ht;
    const aDH = Math.abs(dH);
    const q = Math.sign(dH) * Math.sqrt(aDH / k);
    // dQ/d(dH) = 1/(2 sqrt(k * |dH|)) ; smoothed by Q_EPS in denominator.
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
    // Closed/missing pipes report zero.
    for (const p of pipes) if (!(p.id in flows)) flows[p.id] = 0;
    const heads: Record<string, number> = {};
    for (const j of junctions) heads[j.id] = fixedHeadMap.get(j.id)!;
    return { ok: true, heads, flows, iterations: 0, residual: 0 };
  }

  // Adjacency: for each free junction, the pipes touching it.
  const incident = new Map<string, Pipe[]>();
  for (const id of free) incident.set(id, []);
  for (const p of active) {
    if (freeIdx.has(p.from)) incident.get(p.from)!.push(p);
    if (freeIdx.has(p.to)) incident.get(p.to)!.push(p);
  }

  // --- 4. Newton-Raphson loop ---------------------------------------------
  let lastResidual = Infinity;
  let iter = 0;
  for (; iter < maxIter; iter++) {
    // Residual F_i = sum(Q into junction i) - demand_i
    const F = new Array<number>(n).fill(0);
    // Jacobian J (n x n)
    const J: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

    for (let i = 0; i < n; i++) {
      F[i] = -(demandMap.get(free[i]) ?? 0);
    }

    for (const p of active) {
      const hf = headOf(p.from);
      const ht = headOf(p.to);
      const { q, dqdh } = pipeFlow(p, hf, ht);
      // Q flows from->to. Into "from" = -q ; Into "to" = +q.
      const fi = freeIdx.get(p.from);
      const ti = freeIdx.get(p.to);
      if (fi !== undefined) F[fi] += -q;
      if (ti !== undefined) F[ti] += +q;
      // dQ/dH_from = +dqdh, dQ/dH_to = -dqdh
      if (fi !== undefined) {
        J[fi][fi] += -dqdh; // d(-q)/dH_from
        if (ti !== undefined) J[fi][ti] += +dqdh; // d(-q)/dH_to
      }
      if (ti !== undefined) {
        J[ti][ti] += -dqdh; // d(+q)/dH_to = -dqdh
        if (fi !== undefined) J[ti][fi] += +dqdh; // d(+q)/dH_from = +dqdh
      }
    }

    const maxRes = F.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    lastResidual = maxRes;
    if (maxRes < tol) break;

    // Solve J * dH = -F  via Gaussian elimination with partial pivoting.
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
    // Damped Newton step to keep convergence stable near zero-flow.
    const DAMP = 0.7;
    for (let i = 0; i < n; i++) H[i] += DAMP * dH[i];
  }

  if (lastResidual >= tol && iter >= maxIter) {
    return {
      ok: false,
      error: `Hardy-Cross solver did not converge within ${maxIter} iterations (residual ${lastResidual.toExponential(3)} m^3/s).`,
    };
  }

  // --- 5. Pack results -----------------------------------------------------
  const heads: Record<string, number> = {};
  for (const j of junctions) heads[j.id] = headOf(j.id);
  const flows: Record<string, number> = {};
  for (const p of active) {
    const { q } = pipeFlow(p, headOf(p.from), headOf(p.to));
    flows[p.id] = q;
  }
  for (const p of pipes) if (!(p.id in flows)) flows[p.id] = 0;

  return { ok: true, heads, flows, iterations: iter, residual: lastResidual };
}

/** Convenience: head loss across a pipe at a given flow (m). */
export function pipeHeadLoss(p: Pipe, flowM3s: number): number {
  return pipeK(p) * flowM3s * Math.abs(flowM3s);
}

/** Convenience: exposed for component-defs unit conversions. */
export { pipeK as pipeKCoefficient };
