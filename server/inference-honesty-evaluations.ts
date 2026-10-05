import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { GOLDEN_SET, GOLDEN_SET_ID, aggregate, evaluateAnswer, applyEvalScore, clearEvalScores, evalScoreRecord, type EvalScoreRecord } from "@shared/inference-honesty";

export const goldenSetFingerprint = () => createHash("sha256").update(JSON.stringify(GOLDEN_SET)).digest("hex");
export const EVALUATION_METHOD = "literal-numeric-coverage-url-recall-local-forecast-labels";

/** A dated, narrow measurement, not a live-health check or routing authority. */
export function loadModelEvaluations(): Map<string, EvalScoreRecord> {
  const records = new Map<string, EvalScoreRecord>();
  clearEvalScores(); // An absent/changed report cannot leave stale runtime scores.
  const path = ".verification/inference-honesty-live-evaluation.json";
  try {
    if (statSync(path).size > 1_000_000) return records;
    const report = JSON.parse(readFileSync(path, "utf8"));
    if (report.goldenSetId !== GOLDEN_SET_ID || report.goldenSetFingerprint !== goldenSetFingerprint() ||
        report.evaluationMethod !== EVALUATION_METHOD || !Array.isArray(report.runs)) return records;
    for (const run of report.runs) {
      if (run.status !== "complete" || typeof run.requestedModel !== "string" || typeof run.requestedProvider !== "string" || !Array.isArray(run.cases) || run.cases.length !== GOLDEN_SET.length) continue;
      if (!run.cases.every((c: { provider?: { model?: string; name?: string }; answer?: string }) => typeof c.answer === "string" && c.answer.length < 100_000 && c.provider?.model === run.requestedModel && c.provider?.name === run.requestedProvider)) continue;
      const ordered = GOLDEN_SET.map(f => run.cases.filter((c: { caseId?: string }) => c.caseId === f.id));
      if (!ordered.every(c => c.length === 1)) continue;
      const scores = ordered.map((c, i) => evaluateAnswer(GOLDEN_SET[i], c[0].answer));
      const at = report.rescoredAt ?? report.generatedAt;
      if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) continue;
      applyEvalScore(run.requestedModel, aggregate(scores), scores.length, at);
      records.set(run.requestedModel, evalScoreRecord(run.requestedModel)!);
    }
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) console.warn("[InferenceHonesty] Evaluation record unavailable.");
  }
  return records;
}