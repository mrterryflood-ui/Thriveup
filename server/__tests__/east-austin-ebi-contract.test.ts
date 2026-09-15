import assert from "node:assert/strict";
import test from "node:test";
import {
  adaptationSchema,
  containsProhibitedPlanningContent,
  deriveImplementationReadiness,
  evaluationSchema,
  protocolSchema,
} from "../east-austin-approval-routes";

const protocol = {
  interventionName: "Locally selected evidence-based intervention",
  interventionVersion: "1.0",
  evidenceBasis: "Peer-reviewed evidence with a documented Austin applicability review.",
  targetPopulation: "The locally defined eligible population in the approved planning geography.",
  setting: "Approved community delivery settings",
  deliveryMode: "Facilitated group sessions",
  dosage: "Eight weekly sessions",
  staffingRequirements: "Two trained facilitators per group",
  trainingRequirements: "Protocol certification and annual refresh",
  supervisionRequirements: "Monthly fidelity supervision",
  contraindications: "Do not use outside the validated population or setting",
  theoryOfChange: "Specified intervention mechanisms produce measurable implementation outcomes.",
  coreComponents: ["Structured sequence"],
  adaptableComponents: ["Session schedule"],
  prohibitedChanges: ["Removing the core mechanism"],
  fidelityInstrument: "A versioned observation checklist completed by trained reviewers.",
  fidelityScoringMethod: "Percentage of required observable items delivered as specified.",
  fidelityThreshold: 85,
  observationCadence: "Monthly",
  belowThresholdAction: "Pause expansion, document causes, and complete corrective supervision.",
  protocolStatus: "ready_for_review",
  expectedUpdatedAt: null,
} as const;

const evaluation = {
  evaluationVersion: "1.0",
  designType: "Pre-post implementation evaluation",
  causalClaimAllowed: false,
  nonCausalStatement: "Observed changes will be reported as associations and not causal effects.",
  primaryOutcome: "Pre-specified implementation outcome with a defined numerator and denominator.",
  processOutcomes: ["Reach"],
  fidelityOutcomes: ["Protocol adherence"],
  equityOutcomes: ["Reach by approved subgroup"],
  harmOutcomes: ["Unintended burden"],
  baselinePeriod: "Three months before launch",
  followupWindows: ["Three months after launch"],
  denominatorDefinition: "All eligible implementation settings during the measurement period.",
  comparatorDescription: "Baseline period only; no causal comparator is claimed.",
  measurementInstruments: ["Versioned fidelity instrument"],
  dataDictionaryReference: "Internal version-controlled data dictionary",
  missingDataRules: "Report missingness by measure and do not impute primary outcomes.",
  attritionRules: "Report attrition counts, denominator changes, and stated reasons.",
  suppressionRules: "Suppress cells below five and combine categories only when substantively valid.",
  subgroupDimensions: ["Geography"],
  continueRule: "Continue only when safety and minimum fidelity thresholds are met.",
  adaptRule: "Adapt delivery form only after documented local and fidelity review.",
  pauseRule: "Pause when fidelity or harm monitoring crosses a prespecified threshold.",
  stopRule: "Stop when prohibited changes occur or corrective action does not restore safety.",
  expectedUpdatedAt: null,
} as const;

test("protocol requires versioned core, adaptable, prohibited, and fidelity controls", () => {
  assert.equal(protocolSchema.safeParse(protocol).success, true);
  assert.equal(protocolSchema.safeParse({ ...protocol, coreComponents: [] }).success, false);
  assert.equal(protocolSchema.safeParse({ ...protocol, fidelityThreshold: 0 }).success, false);
});

test("evaluation contract is fail-closed against causal claims and missing harm measures", () => {
  assert.equal(evaluationSchema.safeParse(evaluation).success, true);
  assert.equal(evaluationSchema.safeParse({ ...evaluation, causalClaimAllowed: true }).success, false);
  assert.equal(evaluationSchema.safeParse({ ...evaluation, harmOutcomes: [] }).success, false);
});

test("adaptation proposals require local input, fidelity, and equity effects", () => {
  const candidate = {
    protocolId: "protocol-123456",
    adaptationTitle: "Evening delivery",
    proposedChange: "Offer the same protocol sequence during evening hours.",
    rationale: "Local access review identified work-hour scheduling as a barrier.",
    localInput: "Documented input from the authorized Austin planning process.",
    componentClassification: "adaptable",
    expectedFidelityEffect: "No change to content sequence, dose, or facilitation requirements.",
    expectedEquityEffect: "May reduce access barriers for people working daytime hours.",
  };
  assert.equal(adaptationSchema.safeParse(candidate).success, true);
  assert.equal(adaptationSchema.safeParse({ ...candidate, localInput: "" }).success, false);
});

test("planning filter checks nested arrays and objects for person-level content", () => {
  assert.equal(containsProhibitedPlanningContent({ nested: ["aggregate evidence only", { note: "client phone 512-555-0100" }] }), true);
  assert.equal(containsProhibitedPlanningContent({ nested: ["aggregate evidence only"] }), false);
});

test("readiness remains blocked until all gates, evidence, protocol, and evaluation exist", () => {
  const gates = Array.from({ length: 6 }, (_, index) => ({
    status: "approved",
    namedApprover: "server-derived-approver",
    decisionRecord: "Documented approval decision",
    reviewedAt: new Date(),
    revalidateAt: new Date(Date.now() + 86_400_000),
    gateKey: `gate-${index}`,
  })) as any;
  const sources = [{ applicability: "direct_match" }] as any;
  const readyProtocol = { ...protocol, protocolStatus: "ready_for_review" } as any;
  const readyEvaluation = { ...evaluation } as any;
  assert.equal(deriveImplementationReadiness(gates, sources, readyProtocol, readyEvaluation).state, "approved_for_planning");
  assert.equal(deriveImplementationReadiness(gates, [], readyProtocol, readyEvaluation).state, "blocked");
  const expired = [{ ...gates[0], revalidateAt: new Date(Date.now() - 1) }, ...gates.slice(1)];
  assert.equal(deriveImplementationReadiness(expired as any, sources, readyProtocol, readyEvaluation).state, "blocked");
});

test("even complete readiness never authorizes implementation, resident data, or release", () => {
  const gates = Array.from({ length: 6 }, (_, index) => ({
    status: "approved",
    namedApprover: "server-derived-approver",
    decisionRecord: "Documented approval decision",
    reviewedAt: new Date(),
    revalidateAt: new Date(Date.now() + 86_400_000),
    gateKey: `gate-${index}`,
  })) as any;
  const result = deriveImplementationReadiness(gates, [{ applicability: "direct_match" }] as any, { ...protocol } as any, evaluation as any);
  assert.equal(result.implementationAuthorized, false);
  assert.equal(result.residentDataAllowed, false);
  assert.equal(result.partnerReleaseAllowed, false);
  assert.equal(result.effectivenessEstablished, false);
  assert.equal(result.replicationEstablished, false);
});