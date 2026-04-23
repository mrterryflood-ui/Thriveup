// RPLICE v2 — Replicable Contract
// Deterministic eligibility evaluator. Pure function, byte-identical logic
// across peers, so LifeBridge and ThriveUp always qualify the same person
// the same way for the same program.

import type { Applicant, BenefitProgram, EligibilityResult } from "./types";

export function evaluateEligibility(
  applicant: Applicant,
  program: BenefitProgram,
): EligibilityResult {
  const rules = program.eligibility || {};

  // Hard geographic gate: state/county-scoped programs only apply in their territory.
  if (program.scope === "state" && program.state && applicant.state && applicant.state.toUpperCase() !== program.state.toUpperCase()) {
    return "not-eligible";
  }
  if ((program.scope === "county" || program.scope === "city") && program.county && applicant.county && program.county !== applicant.county) {
    return "not-eligible";
  }

  // Age gates
  const age = applicant.age ?? ageFromBand(applicant.ageBand);
  if (rules.ageMin != null && age != null && age < rules.ageMin) return "not-eligible";
  if (rules.ageMax != null && age != null && age > rules.ageMax) return "not-eligible";

  // Income gate (FPL-based)
  if (rules.incomeFPLmax != null) {
    if (applicant.incomeFPL == null) return "need-more-info";
    if (applicant.incomeFPL > rules.incomeFPLmax) return "not-eligible";
  }

  // Pregnancy / parent gate
  if (rules.pregnancyOrParent) {
    const ok = applicant.pregnancyStatus === true || applicant.childrenInHousehold === true;
    if (!ok) return "not-eligible";
  }

  // Veteran gate
  if (rules.veteranRequired && applicant.veteranStatus !== true) return "not-eligible";

  // Disability gate
  if (rules.disabilityRequired && applicant.disabilityDeclared !== true) return "not-eligible";

  // Citizenship: Medicaid/SNAP require US citizen or qualified non-citizen;
  // we flag other statuses as need-more-info rather than hard-deny, because
  // state exceptions (e.g. emergency Medicaid, CHIP for lawfully-residing kids) apply.
  if (/citizen/i.test(rules.citizenshipRules || "")) {
    const c = applicant.citizenshipStatus;
    if (!c) return "need-more-info";
    if (c === "other") return "need-more-info";
  }

  // Free-text special rules → we cannot auto-decide; surface for navigator review.
  if (rules.specialRules && !hasAnyInput(applicant)) return "need-more-info";

  // If all gates passed with concrete inputs, mark eligible. If only some inputs
  // were provided, mark likely-eligible so the wizard surfaces it without over-promising.
  return isFullyScreened(applicant, rules) ? "eligible" : "likely-eligible";
}

function ageFromBand(band?: Applicant["ageBand"]): number | undefined {
  switch (band) {
    case "under-18": return 12;
    case "18-25":    return 22;
    case "26-49":    return 35;
    case "50-64":    return 57;
    case "65-plus":  return 70;
    default:         return undefined;
  }
}

function hasAnyInput(a: Applicant): boolean {
  return a.ageBand != null || a.age != null || a.incomeFPL != null
      || a.citizenshipStatus != null || a.veteranStatus != null
      || a.pregnancyStatus != null || a.disabilityDeclared != null;
}

function isFullyScreened(a: Applicant, rules: BenefitProgram["eligibility"]): boolean {
  if (rules.ageMin != null || rules.ageMax != null) {
    if (a.age == null && a.ageBand == null) return false;
  }
  if (rules.incomeFPLmax != null && a.incomeFPL == null) return false;
  if (rules.pregnancyOrParent && a.pregnancyStatus == null && a.childrenInHousehold == null) return false;
  if (rules.veteranRequired && a.veteranStatus == null) return false;
  if (rules.disabilityRequired && a.disabilityDeclared == null) return false;
  return true;
}

// Screen an applicant against the full catalog and return programs they're
// eligible or likely-eligible for, ordered by annual dollar value.
export function screenAll(
  applicant: Applicant,
  catalog: BenefitProgram[],
): Array<{ program: BenefitProgram; result: EligibilityResult }> {
  const out: Array<{ program: BenefitProgram; result: EligibilityResult }> = [];
  for (const program of catalog) {
    const result = evaluateEligibility(applicant, program);
    if (result === "not-eligible") continue;
    out.push({ program, result });
  }
  out.sort((a, b) => (b.program.annualDollarValueEstimate || 0) - (a.program.annualDollarValueEstimate || 0));
  return out;
}
