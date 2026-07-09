/**
 * Engine Registry — "sheet music" for the platform-wide orchestration layer.
 *
 * Iron Rule #1/#2: this registry describes engines that ALREADY EXIST in
 * server/. It does not invent capability. Verified against server/ contents
 * on 2026-07-08 (grep sweep of route/engine files + top-of-file source
 * comments). If an engine file is renamed/removed, this registry goes stale —
 * treat it as a pointer, re-verify against server/ before trusting it blindly.
 *
 * Purely additive: importing this file changes no existing route or page
 * behavior. It is read by server/orchestration/conductor.ts (Phase 2).
 */

export type GeographyGrain = "household" | "tract" | "zip" | "county" | "state" | "national" | "individual" | "scenario";

export type EngineDomain =
  | "benefits" | "childcare" | "workforce" | "justice" | "reentry"
  | "health" | "housing" | "education" | "agriculture" | "rural-connectivity"
  | "economic-development" | "family-services" | "youth" | "narrative"
  | "roi-causal" | "equity" | "geospatial" | "program-management";

export interface EngineDefinition {
  id: string;
  file: string;
  label: string;
  domains: EngineDomain[];
  geographyGrains: GeographyGrain[];
  /** Primary data sources this engine cites (Iron Rule #2 traceability) */
  sources: string[];
  /** How the conductor should call it — direct import (server-internal) vs HTTP route */
  invocation: "function" | "route";
  /** Named export(s) the conductor can call, if invocation === "function" */
  exportNames?: string[];
  /** Route path prefix, if invocation === "route" */
  routePrefix?: string;
  /** Rough refresh cadence — how stale this engine's underlying data can get before a re-pull matters */
  refreshCadence: "realtime" | "daily" | "weekly" | "annual" | "on-demand";
  /** True if this engine ever touches household/individual PII — MUST stay walled off from RAG/orchestration output per 0-PHI-egress rule */
  touchesPII: boolean;
  notes?: string;
}

export const ENGINE_REGISTRY: EngineDefinition[] = [
  {
    id: "benefits",
    file: "server/benefits-routes.ts",
    label: "Benefits Intelligence System",
    domains: ["benefits", "equity"],
    geographyGrains: ["tract", "county", "zip"],
    sources: ["Census ACS", "CDC PLACES", "CDC SVI"],
    invocation: "route",
    routePrefix: "/api/benefits",
    refreshCadence: "annual",
    touchesPII: false,
    notes: "County + tract-level gap/barrier-index data. Tract ingestion via /api/benefits/ingest-tracts.",
  },
  {
    id: "chainweb-engine",
    file: "server/chainweb-engine.ts",
    label: "Chainweb ROI Causal Engine",
    domains: ["roi-causal"],
    geographyGrains: ["scenario", "county"],
    sources: ["Heckman Equation", "RAND studies", "peer-reviewed coefficient library (chainweb-coefficients.ts)"],
    invocation: "function",
    exportNames: ["getChainwebRAGContext"],
    refreshCadence: "on-demand",
    touchesPII: false,
    notes: "Counterfactual-vs-intervention cost modeling. Already the one engine wired into RAG today.",
  },
  {
    id: "corridor-chainweb",
    file: "server/corridor-chainweb.ts",
    label: "Corridor Data Harvester",
    domains: ["geospatial", "equity"],
    geographyGrains: ["county"],
    sources: ["Census", "CDC", "FBI"],
    invocation: "function",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "corridor-story",
    file: "server/corridor-story.ts",
    label: "Corridor Narrative Synthesis",
    domains: ["narrative", "equity"],
    geographyGrains: ["zip", "county"],
    sources: ["RPLICE", "GIS engine", "neighborhood engine", "grant engine"],
    invocation: "function",
    refreshCadence: "weekly",
    touchesPII: false,
    notes: "Currently hardcoded to a handful of ZIP 'focus areas' (78721, 76704) — Phase 1 generalizes this to any ZIP.",
  },
  {
    id: "resident-journey",
    file: "server/resident-journey.ts",
    label: "Resident Journey Tracker",
    domains: ["family-services", "equity"],
    geographyGrains: ["individual", "household", "county"],
    sources: ["Internal resident-journey event data (county COUNT-by-eventDomain aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "realtime",
    touchesPII: false,
    notes: "residentJourneyEvents rows carry participantId + eventPayload (can be PII-bearing) and are individual-level, touchesPII:true at the table level. This engine is wall-safe ONLY because the conductor branch groups by eventDomain and COUNTs rows matching countyAtEvent — it never selects participantId, eventPayload, eventTitle, or sourceUserId. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "regional-briefing",
    file: "server/regional-briefing-routes.ts",
    label: "Regional Briefing (CFIR/RE-AIM framed)",
    domains: ["health", "workforce", "economic-development"],
    geographyGrains: ["zip", "county", "state"],
    sources: ["CDC PLACES", "grant discovery corpus"],
    invocation: "route",
    routePrefix: "/api/regional-briefing",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "workforce",
    file: "server/workforce-routes.ts",
    label: "Workforce Development Engine",
    domains: ["workforce", "economic-development"],
    geographyGrains: ["individual", "county"],
    sources: ["Internal training/enrollment data (county COUNT-by-readinessLevel aggregate only)", "CareerOneStop (pending activation)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "daily",
    touchesPII: false,
    notes: "Core workforceAssessments table has userName/skills/workHistory/barriers/assessmentData/personalizedPlan (touchesPII:true at the table level). Wall-safe ONLY because the conductor branch joins userId->participantProfiles.userId->zipCode->zctaCountyMap->countyFips and selects nothing but readinessLevel for a COUNT, with small-cell (<5) suppression applied. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "justice",
    file: "server/justice-routes.ts",
    label: "Justice & Supervision Compliance",
    domains: ["justice"],
    geographyGrains: ["individual", "county"],
    sources: ["Internal referral data (county COUNT-by-status aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "daily",
    touchesPII: false,
    notes: "Core justiceReferrals table has agencyName/demographicData/offenseCategory/notes (touchesPII:true at the table level). Wall-safe ONLY because the conductor branch joins the same zip->county path as reentry/workforce and selects nothing but status for a COUNT, with small-cell (<5) suppression applied. supervisionCompliance is NOT joined in — no independent geography path. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "reentry",
    file: "server/reentry-routes.ts",
    label: "Reentry Planning Engine",
    domains: ["justice", "family-services"],
    geographyGrains: ["individual", "county"],
    sources: ["Internal reentry plan/milestone data (county COUNT-by-phase aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch, joins reentryPlans -> participantProfiles.zipCode -> zctaCountyMap)"],
    refreshCadence: "daily",
    touchesPII: false,
    notes: "Core reentryPlans/participantProfiles tables ARE individual-level PII (name, phone, email, address, race/ethnicity, disability, notes) — touchesPII:true at the table level. This engine is wall-safe ONLY because the conductor branch selects nothing but participantProfiles.zipCode (resolved to county via zctaCountyMap) plus reentryPlans.phase for a COUNT aggregate — never userName, notes, goals, or any other column. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "rural-health",
    file: "server/rural-health-routes.ts",
    label: "Rural Healthcare Hub",
    domains: ["health"],
    geographyGrains: ["county", "state"],
    sources: ["HRSA Data Warehouse", "HRSA Find a Health Center", "USDA ERS Rural Health", "AgriStress Helpline", "CMS Telehealth"],
    invocation: "route",
    routePrefix: "/api/rural-health",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "rural-workforce",
    file: "server/rural-workforce-routes.ts",
    label: "Rural Education & Ag Workforce Pipeline",
    domains: ["workforce", "agriculture", "education"],
    geographyGrains: ["county", "state"],
    sources: ["USDA NIFA", "USDA FSA Beginning Farmer", "NFJP", "FFA", "4-H", "land-grant extension", "Census occupational data"],
    invocation: "route",
    routePrefix: "/api/rural-workforce",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "rural-housing",
    file: "server/rural-housing-routes.ts",
    label: "Rural Housing Hub",
    domains: ["housing"],
    geographyGrains: ["county"],
    sources: ["USDA Rural Development (502/515/533/538)", "HUD Rural Housing", "Census ACS Housing Cost Burden"],
    invocation: "route",
    routePrefix: "/api/rural-housing",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "rural-connectivity",
    file: "server/rural-connectivity-routes.ts",
    label: "Rural Connectivity & Infrastructure Hub",
    domains: ["rural-connectivity"],
    geographyGrains: ["county"],
    sources: ["Census transportation/ACS data (service-desert score only)"],
    invocation: "function",
    exportNames: ["getServiceDesertScore"],
    refreshCadence: "weekly",
    touchesPII: false,
    notes: "PARTIAL wiring only. getServiceDesertScore(stateFips, countyFips) is genuinely callable in-process — its Census ACS call doesn't need lat/lng despite the function signature. FCC broadband-availability and cell-coverage lookups (getFccBroadband, getCellCoverageInfo) are NOT wired — they require real lat/lng coordinates, GeographyRef doesn't carry them, and there is no county-centroid table in this repo to derive a point without fabricating one. routePrefix still exists for those two sub-features.",
  },
  {
    id: "farm-cooperative",
    file: "server/farm-cooperative-routes.ts",
    label: "Farm Cooperative / Producer Data",
    domains: ["agriculture"],
    geographyGrains: ["individual", "county"],
    sources: ["Internal producer profile data (county COUNT-by-farmType aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "on-demand",
    touchesPII: false,
    notes: "Core producerProfiles table has accessToken/firstName/lastName/email/phoneDigitsOnly and is consent-gated PII at the row level (touchesPII:true at the table level). This engine is wall-safe ONLY because the conductor branch selects nothing but farmType for a COUNT aggregate, filtered by stateFips+countyFips. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "farm-profitability",
    file: "server/farm-profitability-routes.ts",
    label: "Farm Profitability Snapshots",
    domains: ["agriculture", "economic-development"],
    geographyGrains: ["individual", "county"],
    sources: ["Internal farm profitability snapshots (county COUNT-by-commodity aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "on-demand",
    touchesPII: false,
    notes: "Core farmProfitabilitySnapshots table has userId/sessionToken/snapshotName and detailed enterprise budgets (touchesPII:true at the table level). This engine is wall-safe ONLY because the conductor branch selects nothing but commodity for a COUNT aggregate, filtered by stateFips+countyFips. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "trade-sims",
    file: "server/trade-sims-routes.ts",
    label: "Trade Sims Skills Simulator",
    domains: ["workforce", "education"],
    geographyGrains: ["individual", "county"],
    sources: ["Internal trade simulation data (county COUNT-by-status aggregate only, lesson-progress table only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "on-demand",
    touchesPII: false,
    notes: "Wall-safe ONLY because the conductor branch queries tradeSimsLessonProgress alone (joined userId->participantProfiles->zctaCountyMap->countyFips) and selects nothing but status for a COUNT, with small-cell (<5) suppression. tradeSimsSandboxProjects is intentionally NOT joined in — canvasState/name are free-text fields not safe to touch even for a count. Do not widen the select() or add sandbox projects without re-review.",
  },
  {
    id: "college-access-ai",
    file: "server/college-access-ai-routes.ts",
    label: "College Access AI Advisor",
    domains: ["education", "youth"],
    geographyGrains: ["individual"],
    sources: ["Collaborative AI engine"],
    invocation: "route",
    routePrefix: "/api/college-access-ai",
    refreshCadence: "on-demand",
    touchesPII: true,
    notes: "Deliberately excluded from IN_PROCESS_ENGINE_IDS by design, not by schema blocker: there is no backing geography-indexed dataset (it's a live per-request AI advisor), so auto-including it in domain-wide orchestration bundles would fire a real paid LLM call on every matching query — an unbounded-AI-spend / DoS profile the other engines don't have (see threat_model.md). Conductor's callEngine() branch exists and reports this reasoning explicitly if requested by id; call the routes directly with a specific student question for real use.",
  },
  {
    id: "foster-youth-agency",
    file: "server/foster-youth-agency-routes.ts",
    label: "Foster Youth Agency Cases",
    domains: ["youth", "family-services"],
    geographyGrains: ["individual", "state"],
    sources: ["Internal foster youth agency/case data (state COUNT-by-placementType aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "daily",
    touchesPII: false,
    notes: "Core fosterYouthAgencyCases table has externalCaseId, hasIep, mentalHealthDx, justiceContact and other highly sensitive minor-specific fields (touchesPII:true at the table level). This engine is wall-safe ONLY because the conductor branch selects nothing but currentPlacementType for a COUNT aggregate, filtered by stateCode. NOTE: this table has NO county column, only stateCode — geography grain here is state-level only, coarser than most other engines. Do not widen the select() or this touchesPII:false becomes a lie.",
  },
  {
    id: "safe-passage",
    file: "server/safe-passage-routes.ts",
    label: "Safe Passage Housing Listings",
    domains: ["housing", "justice"],
    geographyGrains: ["county"],
    sources: ["Partner org housing listings"],
    invocation: "route",
    routePrefix: "/api/safe-passage",
    refreshCadence: "daily",
    touchesPII: false,
  },
  {
    id: "clinical",
    file: "server/clinical-routes.ts",
    label: "Clinical Screening Instruments",
    domains: ["health"],
    geographyGrains: ["individual", "county"],
    sources: ["RNR risk-level bucket counts only (county aggregate)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "on-demand",
    touchesPII: false,
    notes: "Highest-sensitivity table on the platform — treat this entry's touchesPII:false as extremely narrow. The conductor branch selects ONLY the already-categorical rnrRiskLevel (never rnrTotalScore, never any phq9/pcl5 score or *Responses jsonb, never referrals) for a COUNT, joined participantId->participantProfiles.id->zipCode->zctaCountyMap->countyFips, with small-cell (<5) suppression AND a total-below-floor guard. Any change that adds a new selected column here must be treated as a policy decision, not a routine edit — re-open this note before touching that branch.",
  },
  {
    id: "gis-engine",
    file: "server/gis-engine.ts",
    label: "GIS Context Engine",
    domains: ["geospatial", "health"],
    geographyGrains: ["tract", "county"],
    sources: ["CDC PLACES"],
    invocation: "function",
    refreshCadence: "annual",
    touchesPII: false,
  },
  {
    id: "neighborhood",
    file: "server/neighborhood-routes.ts",
    label: "Neighborhood Intelligence + Export",
    domains: ["geospatial", "narrative"],
    geographyGrains: ["zip", "tract"],
    sources: ["GIS engine", "corridor-story"],
    invocation: "route",
    routePrefix: "/api/neighborhood",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "equity",
    file: "server/equity-routes.ts",
    label: "Resident Equity Dashboard",
    domains: ["equity", "health"],
    geographyGrains: ["county", "tract"],
    sources: ["RPLICE program-geography join", "CDC PLACES healthcare metrics"],
    invocation: "route",
    routePrefix: "/api/equity",
    refreshCadence: "weekly",
    touchesPII: false,
  },
  {
    id: "scorecard",
    file: "server/scorecard-routes.ts",
    label: "Nonprofit Effectiveness Scorecard",
    domains: ["program-management"],
    geographyGrains: ["county"],
    sources: ["Partner-submitted WIOA/CFIR outcome data"],
    invocation: "route",
    routePrefix: "/api/scorecard",
    refreshCadence: "on-demand",
    touchesPII: false,
  },
  {
    id: "farmworker-iti",
    file: "shared/schema.ts (farmworkerItiEnrollments) + server/orchestration/conductor.ts",
    label: "Farmworker ITI Enrollment (aggregate)",
    domains: ["agriculture", "workforce", "equity"],
    geographyGrains: ["county"],
    sources: ["ThriveUp Farmworker ITI enrollment records (county/worker-type COUNT aggregate only)"],
    invocation: "function",
    exportNames: ["callEngine (conductor-internal aggregate branch)"],
    refreshCadence: "on-demand",
    touchesPII: false,
    notes: "Underlying table (farmworkerItiEnrollments) has per-person rows (accessToken, consent flags) and IS PII-bearing at the row level. This engine is wall-safe ONLY because the conductor branch returns a COUNT-by-workerType aggregate and never selects accessToken or any individual-identifying column. Do not change the conductor query to select('*') or this touchesPII flag becomes a lie.",
  },
];

export function getEnginesByDomain(domain: EngineDomain): EngineDefinition[] {
  return ENGINE_REGISTRY.filter((e) => e.domains.includes(domain));
}

export function getEnginesByGrain(grain: GeographyGrain): EngineDefinition[] {
  return ENGINE_REGISTRY.filter((e) => e.geographyGrains.includes(grain));
}

export function getEngineById(id: string): EngineDefinition | undefined {
  return ENGINE_REGISTRY.find((e) => e.id === id);
}

/** PII-safe subset — the only engines the orchestrator/RAG may draw from freely without an explicit aggregation step. */
export function getNonPIIEngines(): EngineDefinition[] {
  return ENGINE_REGISTRY.filter((e) => !e.touchesPII);
}
