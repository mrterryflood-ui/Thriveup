/**
 * DC Circuit Solver — Modified Nodal Analysis (MNA)
 *
 * Solves linear DC circuits containing:
 *   - Resistors (R)
 *   - Independent voltage sources (V)
 *   - Independent current sources (I)
 *   - Wires (treated as merged nodes; handled upstream)
 *   - Switches (open = removed; closed = wire)
 *
 * Returns node voltages (relative to ground node 0) and branch currents
 * for voltage sources. Branch currents for resistors are derived as
 *   I_R = (V_a - V_b) / R
 *
 * Reference: Pillage/Rohrer "Electronic Circuit and System Simulation Methods".
 *
 * No external math deps. Gaussian elimination with partial pivoting.
 * Adequate for circuits up to ~200 nodes; not optimized for large sparse.
 */

export type CircuitElement =
  | { id: string; kind: "resistor"; nodes: [number, number]; resistance: number }
  | { id: string; kind: "vsource"; nodes: [number, number]; voltage: number }
  | { id: string; kind: "isource"; nodes: [number, number]; current: number };

export interface SolveInput {
  /** Total number of nodes including ground. Ground MUST be node 0. */
  nodeCount: number;
  elements: CircuitElement[];
}

export interface SolveOutput {
  nodeVoltages: number[]; // length = nodeCount; nodeVoltages[0] = 0
  vsourceCurrents: Record<string, number>; // element id → current flowing from + to -
  resistorCurrents: Record<string, number>; // element id → current from node[0] to node[1]
  ok: true;
}

export interface SolveError {
  ok: false;
  error: string;
}

/**
 * Solve a DC circuit using Modified Nodal Analysis.
 *
 * The MNA matrix has size (n + m) where n = nodeCount - 1 (non-ground nodes)
 * and m = number of voltage sources. We use 1-indexed nodes internally; the
 * ground node 0 is omitted from the matrix.
 */
export function solveCircuit(input: SolveInput): SolveOutput | SolveError {
  const { nodeCount, elements } = input;
  if (nodeCount < 2) {
    return { ok: false, error: "Circuit must have at least 2 nodes (ground + 1)." };
  }

  const vsources = elements.filter((e): e is Extract<CircuitElement, { kind: "vsource" }> => e.kind === "vsource");
  const n = nodeCount - 1; // non-ground nodes
  const m = vsources.length;
  const size = n + m;

  // Build augmented MNA matrix [A | z] of size size × (size + 1).
  const A: number[][] = Array.from({ length: size }, () => new Array(size + 1).fill(0));

  const nodeIdx = (node: number) => node - 1; // 0 = ground → -1 (skip), else node-1

  // Stamp resistors and current sources into G submatrix (top-left n×n).
  for (const el of elements) {
    if (el.kind === "resistor") {
      if (el.resistance <= 0) {
        return { ok: false, error: `Resistor ${el.id} has non-positive resistance ${el.resistance}.` };
      }
      const g = 1 / el.resistance;
      const a = nodeIdx(el.nodes[0]);
      const b = nodeIdx(el.nodes[1]);
      if (a >= 0) A[a][a] += g;
      if (b >= 0) A[b][b] += g;
      if (a >= 0 && b >= 0) {
        A[a][b] -= g;
        A[b][a] -= g;
      }
    } else if (el.kind === "isource") {
      // Current flows from node[0] (out of node) into node[1] (into node).
      // Convention: positive current OUT of the + terminal of the source.
      // Stamp on right-hand side z.
      const a = nodeIdx(el.nodes[0]);
      const b = nodeIdx(el.nodes[1]);
      if (a >= 0) A[a][size] -= el.current;
      if (b >= 0) A[b][size] += el.current;
    }
  }

  // Stamp voltage sources (B, C, D submatrices + z).
  vsources.forEach((vs, k) => {
    const row = n + k;
    const a = nodeIdx(vs.nodes[0]); // + terminal
    const b = nodeIdx(vs.nodes[1]); // - terminal
    if (a >= 0) {
      A[a][row] += 1; // B
      A[row][a] += 1; // C
    }
    if (b >= 0) {
      A[b][row] -= 1;
      A[row][b] -= 1;
    }
    A[row][size] = vs.voltage; // V_a - V_b = voltage
  });

  // Gaussian elimination with partial pivoting.
  for (let i = 0; i < size; i++) {
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let r = i + 1; r < size; r++) {
      if (Math.abs(A[r][i]) > maxVal) {
        maxVal = Math.abs(A[r][i]);
        maxRow = r;
      }
    }
    if (maxVal < 1e-12) {
      return {
        ok: false,
        error: "Singular system — check for floating nodes, short circuits, or duplicate voltage sources.",
      };
    }
    if (maxRow !== i) {
      const tmp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tmp;
    }
    for (let r = i + 1; r < size; r++) {
      const factor = A[r][i] / A[i][i];
      if (factor === 0) continue;
      for (let c = i; c <= size; c++) {
        A[r][c] -= factor * A[i][c];
      }
    }
  }

  // Back-substitution.
  const x = new Array<number>(size).fill(0);
  for (let i = size - 1; i >= 0; i--) {
    let sum = A[i][size];
    for (let c = i + 1; c < size; c++) sum -= A[i][c] * x[c];
    x[i] = sum / A[i][i];
  }

  // Extract results.
  const nodeVoltages = new Array<number>(nodeCount).fill(0);
  for (let i = 1; i < nodeCount; i++) nodeVoltages[i] = x[i - 1];

  const vsourceCurrents: Record<string, number> = {};
  vsources.forEach((vs, k) => {
    vsourceCurrents[vs.id] = x[n + k];
  });

  const resistorCurrents: Record<string, number> = {};
  for (const el of elements) {
    if (el.kind === "resistor") {
      resistorCurrents[el.id] = (nodeVoltages[el.nodes[0]] - nodeVoltages[el.nodes[1]]) / el.resistance;
    }
  }

  return { ok: true, nodeVoltages, vsourceCurrents, resistorCurrents };
}

/** Convenience: power dissipated by a resistor (W). */
export function resistorPower(currentAmps: number, resistanceOhms: number): number {
  return currentAmps * currentAmps * resistanceOhms;
}

/** Convenience: format a value with SI prefix. */
export function formatSI(value: number, unit: string, precision = 3): string {
  if (!isFinite(value)) return `∞ ${unit}`;
  const abs = Math.abs(value);
  if (abs === 0) return `0 ${unit}`;
  const prefixes: Array<[number, string]> = [
    [1e9, "G"],
    [1e6, "M"],
    [1e3, "k"],
    [1, ""],
    [1e-3, "m"],
    [1e-6, "µ"],
    [1e-9, "n"],
    [1e-12, "p"],
  ];
  for (const [scale, p] of prefixes) {
    if (abs >= scale) {
      return `${(value / scale).toPrecision(precision)} ${p}${unit}`;
    }
  }
  return `${value.toPrecision(precision)} ${unit}`;
}
