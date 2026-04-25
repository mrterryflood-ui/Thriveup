// RPLICE v2 — Replicable Contract — barrel export
export * from "./types";
export * from "./areas";
export { BENEFIT_AREAS } from "./areas";
export * from "./resident-ref";
export * from "./eligibility";
export * from "./federal-programs";
export * from "./state-programs";
export * from "./grant-partners";
export * from "./zip-resolver";
export * from "./counties";
export * from "./jurisdictions";

import { FEDERAL_PROGRAMS } from "./federal-programs";
import { STATE_PROGRAMS } from "./state-programs";
import type { BenefitProgram } from "./types";

// Canonical catalog — federal + state. County-layer programs are maintained
// separately per-peer and concatenated at runtime by the server.
export const CATALOG: BenefitProgram[] = [...FEDERAL_PROGRAMS, ...STATE_PROGRAMS];

// Version string published in the handshake so peers detect catalog drift.
// Bump manually when the catalog changes in a way peers must re-sync on.
export const CATALOG_VERSION = "2026.04.23-rplice-v2-seed-1";

// List of accepted inbound event types — advertised in the handshake.
export const ACCEPTED_EVENT_TYPES = [
  "benefitProgram.updated",
  "benefit.enrollment.created",
  "benefit.enrollment.updated",
  "eligibility.screened",
  "grantPartner.registered",
  "grantPartner.tagged",
  "outcome.enrolled",
  "outcome.declined",
  "outcome.referred",
  "intent.need",
  "intent.engagement",
  "intent.capacity",
] as const;
