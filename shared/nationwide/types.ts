// RPLICE v2 — Replicable Contract
// Nationwide Benefits Engine — shared types
// Byte-for-byte identical on every RPLICE peer (LifeBridge, ThriveUp, future peers).
// Do not edit without coordinated rollout across peers.

import { BENEFIT_AREAS } from "./areas";

export type BenefitAreaId = typeof BENEFIT_AREAS[number]["id"];

export type ApplicationChannel = "online" | "phone" | "in-person" | "paper" | "mail";
export type RenewalCadence = "annual" | "6mo" | "continuous" | "one-time" | "as-needed";
export type ProgramScope = "federal" | "state" | "county" | "city";

export type BenefitProgram = {
  slug: string;              // canonical, byte-identical across peers
  scope: ProgramScope;
  state?: string | null;     // 2-letter ISO, e.g. "TX"
  county?: string | null;    // canonical county slug, e.g. "tx-travis"
  area: BenefitAreaId;
  programName: string;
  programNameEs?: string;
  description?: string;
  eligibility: BenefitEligibilityRules;
  portalUrl?: string;
  portalUrlEs?: string;
  phone?: string;
  applicationChannels: ApplicationChannel[];
  renewalCadence: RenewalCadence;
  processingDaysMedian?: number;
  annualDollarValueEstimate?: number;
  culturalSpecificity?: string[];
};

export type BenefitEligibilityRules = {
  ageMin?: number;
  ageMax?: number;
  incomeFPLmax?: number;
  householdRules?: string;
  residencyRequired?: boolean;
  citizenshipRules?: string;
  pregnancyOrParent?: boolean;
  veteranRequired?: boolean;
  disabilityRequired?: boolean;
  docsRequired?: string[];
  specialRules?: string;
};

// PII-free input shape for deterministic eligibility evaluation.
// Both platforms MUST use these exact field names.
export type Applicant = {
  ageBand?: "under-18" | "18-25" | "26-49" | "50-64" | "65-plus";
  age?: number;
  householdSize: number;
  incomeFPL?: number;              // household income as % of federal poverty level
  state?: string;                  // 2-letter ISO
  county?: string;                 // canonical county slug
  zip?: string;
  citizenshipStatus?: "citizen" | "lpr" | "refugee" | "qualified-non-citizen" | "other";
  hasInsurance?: boolean;
  veteranStatus?: boolean;
  pregnancyStatus?: boolean;
  disabilityDeclared?: boolean;
  childrenInHousehold?: boolean;
  tribalMember?: boolean;
};

export type EligibilityResult = "eligible" | "likely-eligible" | "not-eligible" | "need-more-info";

// Grant partner registry. Funders are optional post-hoc metadata on enrollments;
// never a gate on who can use the tool.
export type GrantPartner = {
  id: string;
  name: string;
  coverageStates: string[];        // e.g. ["TX"]; empty array = nationwide
  coverageCounties: string[];      // canonical county slugs; empty = all counties in coverage states
  focusAreas: BenefitAreaId[];     // empty = all areas
  reportingCadence: "monthly" | "quarterly" | "semiannual" | "annual";
  rpliceChannel?: string;          // private per-grant channel key
  activeFrom?: string;             // ISO date
  activeUntil?: string | null;     // ISO date or null for open-ended
};

// Canonical event vocabulary. Both platforms emit and consume all of these.
export type RPLICEEventType =
  | "benefitProgram.updated"
  | "benefit.enrollment.created"
  | "benefit.enrollment.updated"
  | "eligibility.screened"
  | "grantPartner.registered"
  | "grantPartner.tagged"
  | "outcome.enrolled"
  | "outcome.declined"
  | "outcome.referred"
  | "intent.need"
  | "intent.engagement"
  | "intent.capacity";

export type RPLICEEvent<T = any> = {
  type: RPLICEEventType;
  origin: string;                  // peer id, e.g. "thriveup" or "lifebridge"
  occurredAt?: string;             // ISO timestamp
  payload: T;
};

// Canonical enrollment payload. Terry's dedup key = peer|residentRef|programSlug|status.
export type EnrollmentPayload = {
  residentRef: string;             // sha256(...).substr(0,16) — see resident-ref.ts
  programSlug: string;             // e.g. "federal:medicaid"
  status: "screened" | "enrolled" | "declined" | "referred" | "pending" | "withdrawn";
  state?: string;
  county?: string;
  zip?: string;
  area?: BenefitAreaId;
  grantPartnerId?: string | null;
  grantReportingTags?: string[];
  externalId?: string;             // peer's internal id for this record
  annualDollarValueEstimate?: number;
  occurredAt?: string;
};

export type EligibilityScreenedPayload = {
  residentRef: string;
  state?: string;
  county?: string;
  zip?: string;
  area?: BenefitAreaId;
  programSlug?: string;
  result: EligibilityResult;
  occurredAt?: string;
};

// Handshake payload shape — same on every peer.
// RPLICE compares peers state-by-state to detect drift and trigger scoped replay.
export type HandshakeByStateSlice = {
  localOwned: number;
  localEnrolled: number;
  peerMirrored: number;
  peerEnrolled: number;
  networkTotal: number;
  networkEnrolled: number;
  byCounty?: Record<string, { localOwned: number; peerMirrored: number; networkTotal: number }>;
  byArea?: Record<string, { localOwned: number; peerMirrored: number; networkTotal: number }>;
  byStatus?: Record<string, number>;
  byGrantPartner?: Record<string, number>;
};

export type HandshakeResponse = {
  ok: true;
  self: string;                    // this peer's id
  peers: Array<{ id: string; url: string }>;
  enrollments: {
    localOwned: number;
    localEnrolled: number;
    peerMirrored: number;
    peerEnrolled: number;
    networkTotal: number;
    networkEnrolled: number;
    byPeer: Record<string, number>;
    byState: Record<string, HandshakeByStateSlice>;
  };
  acceptedEventTypes: RPLICEEventType[];
  catalogVersion: string;
  lastEventAt: string | null;
  generatedAt: string;
};
