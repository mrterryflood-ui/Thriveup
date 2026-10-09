import { safeOversightGate, type FactLike, type GateVerdict } from "@shared/inference-honesty";

/** Only independently assembled context; NEVER facts supplied in a chat body. */
export function navigatorHonesty(
  answer: string,
  census: { povertyRate: number | null; unemploymentRate: number | null; uninsuredRate: number | null } | null,
  gv: { totalDeaths: number | null; totalHomicides: number | null; totalSuicides: number | null } | null,
  gvInjected: boolean,
  grantCount: number | null,
  governmentEvidence: {
    evidence: { coverage: { returnedMeasureCount: number; datasetMeasureCount: number } } | null;
  } | null = null,
): GateVerdict {
  const facts: FactLike[] = [];
  const add = (label: string, value: number | null | undefined, unit: string) => {
    if (typeof value === "number" && Number.isFinite(value)) facts.push({ label, value: `${value} ${unit}` });
  };
  add("Poverty rate", census?.povertyRate, "%");
  add("Unemployment rate", census?.unemploymentRate, "%");
  add("Uninsured rate", census?.uninsuredRate, "%");
  if (gvInjected) {
    add("National firearm deaths", gv?.totalDeaths, "deaths");
    add("National firearm homicides", gv?.totalHomicides, "homicides");
    add("National firearm suicides", gv?.totalSuicides, "suicides");
  }
  add("Retrieved grant count", grantCount, "grants");
  // Only source-owned retrieval counts, not a certification of free-form
  // interpretation or equivalence between different measure populations.
  if (governmentEvidence?.evidence) {
    add("CDC returned measure records", governmentEvidence.evidence.coverage.returnedMeasureCount, "records");
    add("CDC dataset measure definitions", governmentEvidence.evidence.coverage.datasetMeasureCount, "definitions");
  }
  return safeOversightGate(answer, facts, { labels: ["observed", "projected", "inference"], evidenceOrigin: "server-context" });
}