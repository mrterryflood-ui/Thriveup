// inference-honesty.ts — the answer-honesty layer, self-contained and dependency-free.
// One file, no imports, no vendor: drop it into any Node/express/EDGE runtime as-is.
//
// What it does: before an LLM answer is surfaced, check it against the retrieved
// evidence ("the sourced rows"). Three checks, all fail-closed:
//   1. figure-vs-template override — a number-with-unit the rows don't carry.
//   2. predictive-without-label — "will/could reach/on track…" with no projected label.
//   3. empty output — nothing to deliver.
// It returns { pass, reasons, overrides } and is meant to ride ALONGSIDE the answer
// (non-blocking), never to hard-stop delivery on its own.
//
// Unit vocabulary is parameterized so the shared mechanism stays shared while each
// product supplies its own units (hazard=ft/cfs/%, defense=kt/nm/dB, thriveup=…).

export type FactLike = { label: string; value: string };
export type Override = { figure: string; official: string[] };

// ── override: figure-vs-template detector ────────────────────────────────────

export const HAZARD_UNITS = ["ft", "cfs", "%", "°C", "mm"] as const;
// Replace with thriveup's units — e.g. ["%", "ft", "hr", "wk", "FTE", "acre"].
// Keep them alphanumeric-safe (no regex metacharacters unless you escape them).
// NOTE: the detector matches a SUFFIX unit ("5.9 ft"). Currency in PREFIX form
// ("$2.5M") is NOT matched — a dollar-prefix figure needs its own pattern if you
// want invention-catching on money. Flag for the integrator rather than assuming it works.
// LIMITATION: bare numbers WITHOUT a unit ("1240" → "9999") are also NOT flagged —
// the detector is unit-bearing-figure only. Pair it with your existing grounding
// check if you also need bare-number drift detection.

function figureRegex(units: readonly string[]): RegExp {
  const escaped = units.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${escaped.join("|")})(?!\\w)`, "gi");
}

function fmtFigure(num: string, unit: string): string {
  return unit === "%" ? `${num}${unit}` : `${num} ${unit}`;
}

function officialFigures(facts: FactLike[], units: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  const text = facts.map((f) => `${f.label} ${f.value}`).join(" ");
  const re = figureRegex(units);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const key = `${Number(m[1])}|${m[2].toLowerCase()}`;
    if (!out.has(key)) out.set(key, fmtFigure(m[1], m[2]));
  }
  return out;
}

export function detectOverrides(
  answer: string,
  facts: FactLike[],
  units: readonly string[] = HAZARD_UNITS,
): Override[] {
  const official = officialFigures(facts, units);
  const out = new Map<string, Override>();
  const re = figureRegex(units);
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer))) {
    if (!official.has(`${Number(m[1])}|${m[2].toLowerCase()}`) && !out.has(fmtFigure(m[1], m[2]))) {
      out.set(fmtFigure(m[1], m[2]), {
        figure: fmtFigure(m[1], m[2]),
        official: Array.from(official.values())
          .filter((v) => v.toLowerCase().endsWith(m![2].toLowerCase()))
          .slice(0, 6),
      });
    }
  }
  return Array.from(out.values());
}

// ── gate: the oversight filter ───────────────────────────────────────────────

export type GateContract = {
  labels?: ("observed" | "projected" | "inference")[];
  units?: readonly string[];
};

export type GateVerdict = { pass: boolean; reasons: string[]; overrides: Override[] };

const PREDICTIVE = /\b(will|forecast|expect|predict|project|outlook|anticipate|on track|could reach|likely)\b/i;
const LABELED = /\b(forecast|projected|projection|outlook|estimate|expected|predicted)\b/i;

export function oversightGate(output: string, facts: FactLike[], contract: GateContract = {}): GateVerdict {
  const reasons: string[] = [];
  const trimmed = (output || "").trim();
  if (!trimmed) reasons.push("empty output: nothing to deliver");

  const overrides = detectOverrides(trimmed, facts, contract.units);
  for (const o of overrides) reasons.push(`figure "${o.figure}" is not in the sourced rows and is withdrawn`);

  if (contract.labels && contract.labels.length && PREDICTIVE.test(trimmed) && !LABELED.test(trimmed)) {
    reasons.push("predictive phrasing detected without a projected/forecast/estimate label");
  }

  return { pass: reasons.length === 0, reasons, overrides };
}

// ── evals: golden-set answer-honesty scoring ─────────────────────────────────

export type EvalRole = "household" | "analyst" | "manager" | "field" | "official";
export type EvalFact = FactLike & { sourceName: string };

export type EvalCase = {
  id: string;
  role: EvalRole;
  question: string;
  facts: EvalFact[];
  requiredCitations: string[];
  requireProjectedLabel: boolean;
};

export type EvalScores = {
  noInvention: number;
  citationRecall: number;
  labelHeld: number;
  total: number;
};

const W = { noInvention: 0.5, citationRecall: 0.3, labelHeld: 0.2 };

export function evaluateAnswer(c: EvalCase, answer: string, units?: readonly string[]): EvalScores {
  const overrides = detectOverrides(answer, c.facts, units);
  const noInvention = overrides.length === 0 ? 1 : 0;

  const lower = answer.toLowerCase();
  const cited = c.requiredCitations.filter((p) => lower.includes(p.toLowerCase())).length;
  const citationRecall = c.requiredCitations.length ? cited / c.requiredCitations.length : 1;

  const labelHeld = c.requireProjectedLabel
    ? oversightGate(answer, c.facts, { labels: ["projected"], units }).pass
      ? 1
      : 0
    : 1;

  const total = Number((noInvention * W.noInvention + citationRecall * W.citationRecall + labelHeld * W.labelHeld).toFixed(4));
  return { noInvention, citationRecall, labelHeld, total };
}

export function aggregate(scores: EvalScores[]): number {
  if (!scores.length) return 0;
  return Number((scores.reduce((a, s) => a + s.total, 0) / scores.length).toFixed(4));
}

// ── PLACEHOLDER GOLDEN SET — replace with thriveup's own domain fixtures. ────
// These are generic illustrative cases, NOT thriveup evidence. A score is only
// meaningful against YOUR golden set. Fill in: a forecast case (requireProjectedLabel
// true), a grounded-figure case, and a citation case from real thriveup sources.
export const GOLDEN_SET: EvalCase[] = [
  {
    id: "forecast-case",
    role: "manager",
    question: "What will the enrollment be next quarter?",
    facts: [{ label: "Enrollment", value: "1,240 participants", sourceName: "your system of record" }],
    requiredCitations: ["your system of record"],
    requireProjectedLabel: true,
  },
  {
    id: "grounded-figure-case",
    role: "analyst",
    question: "What is the completion rate for this program?",
    facts: [{ label: "Completion", value: "78%", sourceName: "your program ledger" }],
    requiredCitations: ["your program ledger"],
    requireProjectedLabel: false,
  },
  {
    id: "citation-case",
    role: "field",
    question: "What is the cited basis for this program?",
    facts: [{ label: "Basis", value: "statute §1234", sourceName: "the governing statute" }],
    requiredCitations: ["the governing statute"],
    requireProjectedLabel: false,
  },
];

// ── registry: model metadata + costing + routing ─────────────────────────────

export type ModelCapability = "grounded-qa" | "synthesis" | "deterministic";

export type ModelEntry = {
  id: string;
  description: string;
  costPer1kInUsd: number;
  costPer1kOutUsd: number;
  latencyClass: "fast" | "standard" | "slow";
  capabilities: ModelCapability[];
  evalScore: number | null;
  status: "live" | "not-connected";
};

// NOTE ON SCORES: the two non-null evalScore values below are REAL live-run numbers,
// but they were measured 2026-10-03 against the HAZARDAWARE golden set (river crest,
// crop production, drought, weather) — NOT thriveup's domain. Treat them as a
// reference point only. Re-run evaluateAnswer against THRIVEUP's own GOLDEN_SET
// (above, after you replace the placeholder cases) to produce thriveup-calibrated
// numbers before adopting. `null` means "not yet scored in this domain."
export const MODEL_REGISTRY: ModelEntry[] = [
  {
    id: "deterministic",
    description: "Composed, evidence-grounded answer; no reasoning model invoked",
    costPer1kInUsd: 0,
    costPer1kOutUsd: 0,
    latencyClass: "fast",
    capabilities: ["grounded-qa", "deterministic"],
    evalScore: null,
    status: "live",
  },
  {
    id: "gpt-5.1",
    description: "OpenAI reasoning lane",
    costPer1kInUsd: 1.25,
    costPer1kOutUsd: 5.0,
    latencyClass: "standard",
    capabilities: ["grounded-qa", "synthesis"],
    evalScore: 0.94, // hazard-aware golden set only — re-run for thriveup
    status: "live",
  },
  {
    id: "sonar",
    description: "Perplexity sonar lane (native web citation)",
    costPer1kInUsd: 1.0,
    costPer1kOutUsd: 5.0,
    latencyClass: "standard",
    capabilities: ["grounded-qa", "synthesis"],
    evalScore: 0.88, // hazard-aware golden set only — re-run for thriveup
    status: "live",
  },
];

export function lookupModel(id: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

export type RouteDecision = { deterministic: boolean; reason: string; candidateIds: string[] };

export function routePolicy(synthesisNeeded: boolean): RouteDecision {
  if (!synthesisNeeded) {
    return {
      deterministic: true,
      reason: "no synthesis required; the deterministic lane is the default",
      candidateIds: ["deterministic"],
    };
  }
  const live = MODEL_REGISTRY.filter(
    (m) => m.status === "live" && m.capabilities.includes("synthesis") && m.id !== "deterministic",
  );
  return {
    deterministic: false,
    reason: "synthesis required; cheapest synthesis-capable model first",
    candidateIds: live.map((m) => m.id),
  };
}

export function estimateCost(
  modelId: string,
  tokensIn: number,
  tokensOut: number,
): { costUsd: number; basis: "registry" | "unaccounted" } {
  const m = lookupModel(modelId);
  if (!m || modelId === "deterministic") return { costUsd: 0, basis: "unaccounted" };
  const cost = (tokensIn / 1000) * m.costPer1kInUsd + (tokensOut / 1000) * m.costPer1kOutUsd;
  return { costUsd: Number(cost.toFixed(6)), basis: "registry" };
}

export type EvalScoreRecord = { score: number; at: string; cases: number };
const _evalScores = new Map<string, EvalScoreRecord>();

export function applyEvalScore(id: string, score: number, cases: number, at = new Date().toISOString()): void {
  const rec = { score, cases, at };
  _evalScores.set(id, rec);
  const m = lookupModel(id);
  if (m) m.evalScore = score;
}

export function evalScoreRecord(id: string): EvalScoreRecord | undefined {
  return _evalScores.get(id);
}
