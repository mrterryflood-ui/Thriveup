// RPLICE v2 — Replicable Contract
// Grant partner registry + auto-tag logic.
// Funders are optional post-hoc metadata — never a gate on enrollment.

import type { BenefitAreaId, GrantPartner } from "./types";

export type GrantTagInput = {
  state?: string;
  county?: string;
  area?: BenefitAreaId;
  occurredAt?: string;   // ISO timestamp
};

// Pure function — both peers evaluate identically so auto-tagging converges.
// Returns the partners whose coverage matches. An enrollment can legitimately
// match more than one; callers decide which to persist as primary.
export function matchGrantPartners(
  input: GrantTagInput,
  partners: GrantPartner[],
): GrantPartner[] {
  const t = input.occurredAt ? Date.parse(input.occurredAt) : Date.now();
  return partners.filter(p => {
    if (p.activeFrom && t < Date.parse(p.activeFrom)) return false;
    if (p.activeUntil && t > Date.parse(p.activeUntil)) return false;
    if (p.coverageStates.length > 0 && input.state) {
      if (!p.coverageStates.map(s => s.toUpperCase()).includes(input.state.toUpperCase())) return false;
    }
    if (p.coverageCounties.length > 0 && input.county) {
      if (!p.coverageCounties.includes(input.county)) return false;
    }
    if (p.focusAreas.length > 0 && input.area) {
      if (!p.focusAreas.includes(input.area)) return false;
    }
    return true;
  });
}

// Starter registry. St. David's is the launch partner; new funders are
// inserted as simple config entries with no code change required.
export const DEFAULT_GRANT_PARTNERS: GrantPartner[] = [
  {
    id: "st-davids-wab2",
    name: "St. David's Foundation — WAB2",
    coverageStates: ["TX"],
    coverageCounties: ["tx-travis", "tx-williamson", "tx-hays", "tx-bastrop", "tx-caldwell"],
    focusAreas: ["healthcare-access", "mental-health", "dental-health", "healthy-aging", "healthy-children-families"],
    reportingCadence: "quarterly",
    activeFrom: "2026-04-01",
    activeUntil: null,
  },
];
