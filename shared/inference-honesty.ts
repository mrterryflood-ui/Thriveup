/**
 * Adapted from the user's inference-honesty.ts upload (2026-10-03).
 * Dependency-free, advisory only. Existing binding grounding stays authoritative.
 * This is literal numeric/label screening, NOT verification of general prose,
 * causality, citation authority, eligibility, or bare numbers without units.
 */
export type FactLike = { label: string; value: string };
export type Override = { figure: string; official: string[] };
export const HAZARD_UNITS = ["ft", "cfs", "%", "°C", "mm"] as const;
export const THRIVEUP_UNITS = ["%", "percent", "FTE", "FTEs", "participant", "participants", "person", "people", "family", "families", "child", "children", "household", "households", "provider", "providers", "grant", "grants", "job", "jobs", "death", "deaths", "homicide", "homicides", "suicide", "suicides", "hour", "hours", "day", "days", "month", "months", "year", "years"] as const;
export const MAX_HONESTY_OUTPUT_CHARS = 100_000;
const NUMBER = String.raw`-?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)`;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
type Figure = { key: string; unit: string; text: string };
const canonicalUnit = (s: string) => {
  const unit = s.toLowerCase();
  if (unit === "percent") return "%";
  if (unit === "ftes") return "fte";
  if (unit === "people") return "person";
  if (unit === "families") return "family";
  if (unit === "children") return "child";
  return ["participants", "households", "providers", "grants", "jobs", "deaths", "homicides", "suicides", "hours", "days", "months", "years"].includes(unit) ? unit.slice(0, -1) : unit;
};
function figures(text: string, units: readonly string[]): Figure[] {
  const out: Figure[] = [];
  const add = (raw: string, number: string, unit: string, multiplier = 1) => {
    const value = Number(number.replace(/,/g, "")) * multiplier;
    if (Number.isFinite(value)) out.push({ key: `${value}|${unit}`, unit, text: raw.trim() });
  };
  if (units.length) {
    const suffix = new RegExp(`(?<![\\w.,])(${NUMBER})\\s*(?:-\\s*)?(${[...units].sort((a,b) => b.length-a.length).map(escape).join("|")})(?!\\w)`, "gi");
    for (const m of text.matchAll(suffix)) add(m[0], m[1], canonicalUnit(m[2]));
  }
  // Currency is a separate prefix/suffix pattern, not a fictional "$" suffix.
  const money = new RegExp(`(?<![\\w])(-)?\\$\\s*(${NUMBER})\\s*(billion|million|thousand|[kmb](?!\\w))?`, "gi");
  const multiplier = (s?: string) => /^(b|billion)$/i.test(s ?? "") ? 1e9 : /^(m|million)$/i.test(s ?? "") ? 1e6 : /^(k|thousand)$/i.test(s ?? "") ? 1e3 : 1;
  for (const m of text.matchAll(money)) add(m[0], `${m[1] ?? ""}${m[2]}`, "usd", multiplier(m[3]));
  const dollars = new RegExp(`(?<![\\w.,])(${NUMBER})\\s*(billion|million|thousand)?\\s*(?:USD|dollars?)(?!\\w)`, "gi");
  for (const m of text.matchAll(dollars)) add(m[0], m[1], "usd", multiplier(m[2]));
  return out;
}
export function detectOverrides(answer: string, facts: FactLike[], units: readonly string[] = THRIVEUP_UNITS): Override[] {
  const official = facts.flatMap(f => figures(`${f.label} ${f.value}`, units));
  const keys = new Set(official.map(f => f.key));
  const out = new Map<string, Override>();
  for (const f of figures(answer, units)) {
    if (!keys.has(f.key) && !out.has(f.key)) out.set(f.key, { figure: f.text, official: [...new Set(official.filter(o => o.unit === f.unit).map(o => o.text))].slice(0, 6) });
  }
  return [...out.values()];
}
export type GateContract = {
  labels?: ("observed" | "projected" | "inference")[];
  units?: readonly string[];
  evidenceOrigin?: "server-context" | "caller-supplied";
};
export type GateVerdict = {
  pass: boolean;
  reasons: string[];
  overrides: Override[];
  status: "checked" | "not_evaluated" | "unavailable";
  evidenceOrigin: "server-context" | "caller-supplied" | "none";
  scope: string;
};
export const HONESTY_SCOPE = "Literal unit-bearing numbers, dollar amounts, and forecast labels only. Matching does not verify subject, geography, or time period. Bare numbers, general prose, source authority, and causal claims are not verified.";
const PREDICTIVE = /\b(will|forecasts?|expects?|predicts?|projects?|outlook|anticipate|on track|could reach|likely)\b/i;
const LABELED = /\b(forecasts?|projected|projection|outlook|estimated?|expected|predicted)\b/i;
function labelProblems(output: string, required: boolean): string[] {
  if (!required) return [];
  const sentences = output.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());
  return sentences.some(s => PREDICTIVE.test(s) && (!LABELED.test(s) || /\bobserved\b/i.test(s)))
    ? ["Predictive phrasing needs an explicit projected/forecast/estimate label in the same sentence; observed is not a prediction label."] : [];
}
export function oversightGate(output: string, facts: FactLike[], contract: GateContract = {}): GateVerdict {
  const text = output.trim();
  const reasons = text ? [] : ["Empty output: nothing to deliver."];
  if (!facts.length) reasons.push("No evidence facts were supplied; numeric grounding was not evaluated.");
  const overrides = detectOverrides(text, facts, contract.units);
  for (const o of overrides) reasons.push(`Figure "${o.figure}" is not supported by the supplied facts; review it before relying on it.`);
  reasons.push(...labelProblems(text, Boolean(contract.labels?.length)));
  return {
    pass: reasons.length === 0, reasons, overrides,
    status: facts.length ? "checked" : "not_evaluated",
    evidenceOrigin: facts.length ? contract.evidenceOrigin ?? "caller-supplied" : "none",
    scope: HONESTY_SCOPE,
  };
}
/** Malformed/unbounded facts never become successful evidence. No output withheld. */
export function safeOversightGate(output: string, facts: unknown, contract: GateContract = {}): GateVerdict {
  try {
    if (typeof output !== "string" || output.length > MAX_HONESTY_OUTPUT_CHARS) throw new Error("Advisory output limit exceeded");
    if (!Array.isArray(facts) || facts.length > 500 || facts.some(f => !f || typeof f.label !== "string" || typeof f.value !== "string" || f.label.length > 500 || f.value.length > 2000)) throw new Error("Invalid evidence facts");
    if (facts.reduce((length, fact) => length + fact.label.length + fact.value.length, 0) > 64_000) throw new Error("Advisory evidence limit exceeded");
    return oversightGate(output, facts, contract);
  } catch (error) {
    console.warn("[InferenceHonesty] Could not evaluate receipt:", error instanceof Error ? error.message : "unknown error");
    return { pass: false, status: "unavailable", evidenceOrigin: "none", reasons: ["The automated numeric/label check could not be completed."], overrides: [], scope: HONESTY_SCOPE };
  }
}
export function isGateVerdict(value: unknown): value is GateVerdict {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.pass === false && (!Array.isArray(v.reasons) || v.reasons.length === 0)) return false;
  if (v.pass === true && (v.status !== "checked" || v.evidenceOrigin === "none" || !Array.isArray(v.reasons) || v.reasons.length || !Array.isArray(v.overrides) || v.overrides.length)) return false;
  if (v.status === "checked" && v.evidenceOrigin === "none") return false;
  if (v.status !== "checked" && (v.pass !== false || v.evidenceOrigin !== "none")) return false;
  return typeof v.pass === "boolean" && ["checked", "not_evaluated", "unavailable"].includes(String(v.status)) &&
    ["none", "server-context", "caller-supplied"].includes(String(v.evidenceOrigin)) && typeof v.scope === "string" &&
    Array.isArray(v.reasons) && v.reasons.every(r => typeof r === "string") &&
    Array.isArray(v.overrides) && v.overrides.every(o => o && typeof o.figure === "string" && Array.isArray(o.official) && o.official.every((s: unknown) => typeof s === "string"));
}
export type EvalFact = FactLike & { sourceName: string };
export type EvalCase = { id: string; role: "household" | "analyst" | "manager" | "field" | "official"; question: string; facts: EvalFact[]; requiredCitations: string[]; requireProjectedLabel: boolean };
export type EvalScores = { noInvention: number; citationRecall: number; labelHeld: number; factRecall: number; total: number };
export function evaluateAnswer(c: EvalCase, answer: string, units: readonly string[] = THRIVEUP_UNITS): EvalScores {
  if (!answer.trim()) return { noInvention: 0, citationRecall: 0, labelHeld: 0, factRecall: 0, total: 0 };
  const noInvention = answer.trim() && detectOverrides(answer, c.facts, units).length === 0 ? 1 : 0;
  const expected = [...new Set(c.facts.flatMap(f => figures(f.value, units)).map(f => f.key))];
  const present = new Set(figures(answer, units).map(f => f.key));
  const factRecall = expected.length ? expected.filter(key => present.has(key)).length / expected.length : 1;
  const cited = c.requiredCitations.filter(p => answer.toLowerCase().includes(p.toLowerCase())).length;
  const citationRecall = c.requiredCitations.length ? cited / c.requiredCitations.length : 1;
  const labelHeld = c.requireProjectedLabel ? Number(Boolean(answer.trim()) && LABELED.test(answer) && labelProblems(answer, true).length === 0) : 1;
  // Literal numeric coverage prevents a citation-only/non-answer from scoring
  // as a complete numeric answer. This is not a general prose-completeness metric.
  return { noInvention, citationRecall, labelHeld, factRecall, total: Number(((noInvention * .5 + citationRecall * .3 + labelHeld * .2) * factRecall).toFixed(4)) };
}
export function aggregate(scores: EvalScores[]): number {
  return scores.length ? Number((scores.reduce((n,s) => n+s.total, 0)/scores.length).toFixed(4)) : 0;
}
// Fixed evaluation snapshot, NOT a live eligibility catalog. Opened official
// USDA SNAP Eligibility, updated 2026-10-01, on 2026-10-03. Domain: community benefits.
const SNAP_SOURCE = "https://www.fna.usda.gov/snap/recipient/eligibility";
export const GOLDEN_SET_ID = "thriveup-community-benefits-2026-10-03";
export const GOLDEN_SET: EvalCase[] = [
  { id: "snap-money", role: "household", question: "For Oct 2026–Sept 2027 in the contiguous states and DC, what is the one-person maximum monthly SNAP allotment? State that actual eligibility and award are determined by the state.",
    facts: [{ label: "One-person maximum monthly allotment", value: "$306", sourceName: SNAP_SOURCE }], requiredCitations: [SNAP_SOURCE], requireProjectedLabel: false },
  { id: "snap-projection", role: "manager", question: "Describe a hypothetical 12-month budget at the one-person maximum. Label it projected and conditional, not a guaranteed award or observed outcome.",
    facts: [{ label: "Monthly maximum", value: "$306", sourceName: SNAP_SOURCE }, { label: "Illustrative 12-month projection, assumes unchanged eligibility and amount", value: "$3,672", sourceName: SNAP_SOURCE }], requiredCitations: [SNAP_SOURCE], requireProjectedLabel: true },
  { id: "snap-citation", role: "field", question: "What earned-income deduction does the cited Oct 2026–Sept 2027 USDA SNAP page state? Cite the supplied URL; do not determine anyone's eligibility.",
    facts: [{ label: "Earned-income deduction", value: "20%", sourceName: SNAP_SOURCE }], requiredCitations: [SNAP_SOURCE], requireProjectedLabel: false },
];
export type ModelCapability = "grounded-qa" | "synthesis" | "deterministic";
export type ModelEntry = {
  id: string; description: string; costPer1kInUsd: number | null; costPer1kOutUsd: number | null;
  latencyClass: "fast" | "standard" | "slow"; capabilities: ModelCapability[]; evalScore: number | null;
  status: "configured" | "not-connected" | "deterministic";
};
// HazardAware 0.94/0.88 scores and unverified prices are deliberately NOT adopted.
export const MODEL_REGISTRY: ModelEntry[] = [
  { id: "deterministic", description: "No model invocation", costPer1kInUsd: 0, costPer1kOutUsd: 0, latencyClass: "fast", capabilities: ["grounded-qa", "deterministic"], evalScore: null, status: "deterministic" },
  ...["gpt-5.1", "gpt-5-mini", "gpt-5-nano", "perplexity/sonar-pro", "claude-haiku-4-5", "anthropic/claude-haiku-4-5", "gemini-2.0-flash", "deepseek/deepseek-r1"].map(id => ({
    id, description: "Provider model; availability is resolved by the existing provider layer", costPer1kInUsd: null, costPer1kOutUsd: null,
    latencyClass: "standard" as const, capabilities: ["grounded-qa", "synthesis"] as ModelCapability[], evalScore: null, status: "not-connected" as const,
  })),
];
export function lookupModel(id: string): ModelEntry | undefined { return MODEL_REGISTRY.find(m => m.id === id); }
export type RouteDecision = { deterministic: boolean; reason: string; candidateIds: string[] };
/** Advisory; never replaces the platform's availability/deadline/fallback routing. */
export function routePolicy(synthesisNeeded: boolean, configuredIds: readonly string[] = MODEL_REGISTRY.filter(m => m.status === "configured").map(m => m.id)): RouteDecision {
  if (!synthesisNeeded) return { deterministic: true, reason: "No synthesis needed; prefer the deterministic lane.", candidateIds: ["deterministic"] };
  const candidates = MODEL_REGISTRY.filter(m => configuredIds.includes(m.id) && m.capabilities.includes("synthesis"));
  candidates.sort((a,b) => ((a.costPer1kInUsd ?? Infinity)+(a.costPer1kOutUsd ?? Infinity))-((b.costPer1kInUsd ?? Infinity)+(b.costPer1kOutUsd ?? Infinity)));
  return { deterministic: false, reason: "Configured synthesis candidates; unknown prices cannot establish a cheapest model.", candidateIds: candidates.map(m => m.id) };
}
export function estimateCost(modelId: string, tokensIn: number, tokensOut: number): { costUsd: number | null; basis: "registry" | "unaccounted" } {
  const m = lookupModel(modelId);
  if (![tokensIn,tokensOut].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error("Token counts must be nonnegative safe integers");
  if (!m || m.costPer1kInUsd == null || m.costPer1kOutUsd == null) return { costUsd: null, basis: "unaccounted" };
  return { costUsd: Number(((tokensIn*m.costPer1kInUsd+tokensOut*m.costPer1kOutUsd)/1000).toFixed(6)), basis: "registry" };
}
export type EvalScoreRecord = { score: number; at: string; cases: number; goldenSetId: string };
const evalScores = new Map<string, EvalScoreRecord>();
export function applyEvalScore(id: string, score: number, cases: number, at = new Date().toISOString()): void {
  const m = lookupModel(id);
  if (!m || !Number.isFinite(score) || score < 0 || score > 1 || !Number.isSafeInteger(cases) || cases < 1 || !Number.isFinite(Date.parse(at))) throw new Error("Invalid model evaluation record");
  evalScores.set(id, { score, cases, at, goldenSetId: GOLDEN_SET_ID });
  m.evalScore = score;
}
export function evalScoreRecord(id: string): EvalScoreRecord | undefined { return evalScores.get(id); }
export function clearEvalScores(): void {
  evalScores.clear();
  for (const model of MODEL_REGISTRY) model.evalScore = null;
}