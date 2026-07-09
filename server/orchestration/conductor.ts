/**
 * Conductor — Phase 2 of the platform-wide Orchestration Layer.
 *
 * Calls the relevant registered, non-PII-touching engines for a given
 * geography IN PARALLEL and merges their output into one provenance-tagged
 * bundle. Every fact carries its source engine + a fetchedAt timestamp so
 * staleness is visible instead of silently assumed (Iron Rule #2 + #11).
 *
 * PII WALL: this module only ever calls engines flagged touchesPII=false in
 * the engine registry, or calls PII-bearing engines through an aggregate-only
 * path that never returns individual records. This is enforced by filtering
 * against ENGINE_REGISTRY, not by trusting each call site to remember.
 */
import { db } from "../storage";
import { gisContextData, benefitsEnrollmentData, partnerOutcomeSubmissions, farmworkerItiEnrollments, reentryPlans, participantProfiles, zctaCountyMap, residentJourneyEvents, producerProfiles, farmProfitabilitySnapshots, fosterYouthAgencyCases } from "@shared/schema";
import { eq, like, and, sql } from "drizzle-orm";
import { getEngineById, getNonPIIEngines, type EngineDefinition } from "./engine-registry";
import { getChainwebRAGContext } from "../chainweb-engine";
import { getContextForGeography } from "../gis-engine";
import { getLastChainWebRun } from "../corridor-chainweb";
import { buildCorridorStory, CORRIDOR } from "../corridor-story";
import { loadRpliceContextBlock } from "../regional-briefing-routes";
import { getHpsaData, getRuralHospitalContext } from "../rural-health-routes";
import { getAgWageData } from "../rural-workforce-routes";
import { getHousingCostBurden } from "../rural-housing-routes";
import { fetchZctaData } from "../neighborhood-routes";
import { getListingsForCounty } from "../safe-passage-routes";

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","12":"FL","13":"GA",
  "15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ",
  "35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC",
  "46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
};

export interface GeographyRef {
  /** Best-known geography key: county FIPS preferred, ZIP as fallback */
  countyFips?: string;
  zip?: string;
  state?: string;
  countyName?: string;
}

export interface OrchestrationFact {
  engineId: string;
  engineLabel: string;
  sources: string[];
  fetchedAt: string;
  data: unknown;
  error?: string;
}

export interface OrchestrationBundle {
  geography: GeographyRef;
  requestedAt: string;
  facts: OrchestrationFact[];
  /** Engines that were skipped because they weren't relevant/selected, or blocked by the PII wall */
  skipped: { engineId: string; reason: string }[];
}

export interface OrchestrationOptions {
  /** If provided, ONLY these engine ids are consulted — this is the "instrument picker" mechanism */
  engines?: string[];
  /** If provided (and `engines` is not), only engines tagged with these domains are consulted */
  domains?: string[];
}

async function callEngine(engine: EngineDefinition, geo: GeographyRef): Promise<OrchestrationFact> {
  const fetchedAt = new Date().toISOString();
  try {
    if (engine.id === "chainweb-engine") {
      const context = await getChainwebRAGContext(undefined, geo.countyName || geo.state, undefined);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: context };
    }
    if (engine.id === "gis-engine") {
      const geoKey = geo.countyFips ? `${geo.countyFips}` : geo.state ? geo.state : "";
      if (!geoKey) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No geography key resolvable for GIS lookup" };
      const record = await getContextForGeography(db, geoKey);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: record };
    }
    if (engine.id === "equity") {
      if (!geo.countyFips) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips" };
      const records = await db.select().from(gisContextData).where(like(gisContextData.geographyKey, `${geo.countyFips}%`));
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: records };
    }
    if (engine.id === "benefits") {
      if (!geo.countyFips) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips" };
      const records = await db.select().from(benefitsEnrollmentData).where(eq(benefitsEnrollmentData.countyFips, geo.countyFips));
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: records };
    }
    if (engine.id === "scorecard") {
      if (!geo.countyFips) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips" };
      const records = await db.select().from(partnerOutcomeSubmissions).where(eq(partnerOutcomeSubmissions.countyFips, geo.countyFips));
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: records };
    }
    if (engine.id === "corridor-chainweb") {
      const report = getLastChainWebRun();
      if (!report) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No corridor chain-web run has executed yet this process — read-only accessor never triggers a new run (that hits Census/FBI APIs)." };
      const county = geo.countyFips ? report.steps.map((s) => ({ id: s.id, label: s.label, value: s.perCounty[geo.countyFips!]?.value ?? null })) : null;
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: county ?? report };
    }
    if (engine.id === "farmworker-iti") {
      if (!geo.countyFips || geo.countyFips.length !== 5) {
        return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No 5-digit countyFips resolvable for farmworker-iti aggregate lookup" };
      }
      const stateFips = geo.countyFips.slice(0, 2);
      const countyPart = geo.countyFips.slice(2);
      // Aggregate-only: COUNT by workerType, never accessToken or any other individual-identifying column.
      const rows = await db
        .select({ workerType: farmworkerItiEnrollments.workerType, count: sql<number>`count(*)::int` })
        .from(farmworkerItiEnrollments)
        .where(and(eq(farmworkerItiEnrollments.stateFips, stateFips), eq(farmworkerItiEnrollments.countyFips, countyPart)))
        .groupBy(farmworkerItiEnrollments.workerType);
      const total = rows.reduce((sum, r) => sum + r.count, 0);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { totalEnrollments: total, byWorkerType: rows } };
    }
    if (engine.id === "reentry") {
      if (!geo.countyFips || geo.countyFips.length !== 5) {
        return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No 5-digit countyFips resolvable for reentry aggregate lookup" };
      }
      // Aggregate-only join: resolve each participant's zipCode to a county via
      // zctaCountyMap, then COUNT reentry plans by phase for the target county.
      // Never selects userName, notes, goals, or any other PII column.
      const rows = await db
        .select({ phase: reentryPlans.phase, count: sql<number>`count(*)::int` })
        .from(reentryPlans)
        .innerJoin(participantProfiles, eq(reentryPlans.userId, participantProfiles.userId))
        .innerJoin(zctaCountyMap, eq(participantProfiles.zipCode, zctaCountyMap.zip))
        .where(eq(zctaCountyMap.countyFips, geo.countyFips))
        .groupBy(reentryPlans.phase);
      const total = rows.reduce((sum, r) => sum + r.count, 0);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { totalActiveOrCompletePlans: total, byPhase: rows } };
    }
    if (engine.id === "resident-journey") {
      if (!geo.countyFips) {
        return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips resolvable for resident-journey aggregate lookup" };
      }
      // Aggregate-only: COUNT by eventDomain, matched on countyAtEvent. Never
      // selects participantId, eventPayload, eventTitle, or sourceUserId.
      const rows = await db
        .select({ eventDomain: residentJourneyEvents.eventDomain, count: sql<number>`count(*)::int` })
        .from(residentJourneyEvents)
        .where(eq(residentJourneyEvents.countyAtEvent, geo.countyFips))
        .groupBy(residentJourneyEvents.eventDomain);
      const total = rows.reduce((sum, r) => sum + r.count, 0);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { totalEvents: total, byDomain: rows } };
    }
    if (engine.id === "corridor-story") {
      const corridorCounties = CORRIDOR.metros.map((m) => m.countyFips);
      if (!geo.countyFips || !corridorCounties.includes(geo.countyFips)) {
        return {
          engineId: engine.id,
          engineLabel: engine.label,
          sources: engine.sources,
          fetchedAt,
          data: null,
          error: `Geography outside the I-35 Waco–Austin corridor scope (McLennan 48309 / Travis 48453 only)`,
        };
      }
      const story = await buildCorridorStory();
      const metro = geo.countyFips === CORRIDOR.metros[0].countyFips ? story.metros.waco : story.metros.austin;
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { metro, comparison: story.comparison, narrative: story.narrative } };
    }
    if (engine.id === "regional-briefing") {
      if (!geo.countyFips) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips resolvable for regional-briefing lookup" };
      const block = await loadRpliceContextBlock([geo.countyFips]);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: block || null };
    }
    if (engine.id === "rural-health") {
      if (!geo.countyFips) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips resolvable for rural-health lookup" };
      const stateFips = geo.countyFips.slice(0, 2);
      const abbr = STATE_FIPS_TO_ABBR[stateFips];
      const [hpsa, hospital] = await Promise.all([
        getHpsaData(stateFips).catch(() => null),
        abbr ? Promise.resolve(getRuralHospitalContext(abbr)) : Promise.resolve(null),
      ]);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { hpsa, hospitalVulnerability: hospital } };
    }
    if (engine.id === "rural-workforce") {
      if (!geo.countyFips) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyFips resolvable for rural-workforce lookup" };
      const stateFips = geo.countyFips.slice(0, 2);
      const wages = await getAgWageData(stateFips).catch((e: any) => ({ error: e?.message || String(e) }));
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: wages };
    }
    if (engine.id === "rural-housing") {
      if (!geo.countyFips || geo.countyFips.length !== 5) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No 5-digit countyFips resolvable for rural-housing lookup" };
      const stateFips = geo.countyFips.slice(0, 2);
      const countyPart = geo.countyFips.slice(2);
      const burden = await getHousingCostBurden(stateFips, countyPart).catch((e: any) => ({ error: e?.message || String(e) }));
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: burden };
    }
    if (engine.id === "neighborhood") {
      if (!geo.zip) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Neighborhood engine requires a specific ZIP (tract-level Census lookup) — county-only geography is insufficient" };
      const data = await fetchZctaData(geo.zip).catch((e: any) => ({ error: e?.message || String(e) }));
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data };
    }
    if (engine.id === "safe-passage") {
      if (!geo.countyName) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No countyName resolvable for safe-passage lookup (listings are keyed by county name, not FIPS)" };
      const listings = getListingsForCounty(geo.countyName);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { count: listings.length, listings } };
    }
    if (engine.id === "farm-cooperative") {
      if (!geo.countyFips || geo.countyFips.length !== 5) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No 5-digit countyFips resolvable for farm-cooperative aggregate lookup" };
      const stateFips = geo.countyFips.slice(0, 2);
      const countyPart = geo.countyFips.slice(2);
      // Aggregate-only: COUNT by farmType, never accessToken/firstName/lastName/email/phone.
      const rows = await db
        .select({ farmType: producerProfiles.farmType, count: sql<number>`count(*)::int` })
        .from(producerProfiles)
        .where(and(eq(producerProfiles.stateFips, stateFips), eq(producerProfiles.countyFips, countyPart)))
        .groupBy(producerProfiles.farmType);
      const total = rows.reduce((sum, r) => sum + r.count, 0);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { totalProducers: total, byFarmType: rows } };
    }
    if (engine.id === "farm-profitability") {
      if (!geo.countyFips || geo.countyFips.length !== 5) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No 5-digit countyFips resolvable for farm-profitability aggregate lookup" };
      const stateFips = geo.countyFips.slice(0, 2);
      const countyPart = geo.countyFips.slice(2);
      // Aggregate-only: COUNT by commodity, never userId/sessionToken/snapshotName.
      const rows = await db
        .select({ commodity: farmProfitabilitySnapshots.commodity, count: sql<number>`count(*)::int` })
        .from(farmProfitabilitySnapshots)
        .where(and(eq(farmProfitabilitySnapshots.stateFips, stateFips), eq(farmProfitabilitySnapshots.countyFips, countyPart)))
        .groupBy(farmProfitabilitySnapshots.commodity);
      const total = rows.reduce((sum, r) => sum + r.count, 0);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { totalSnapshots: total, byCommodity: rows } };
    }
    if (engine.id === "foster-youth-agency") {
      const abbr = geo.state || (geo.countyFips ? STATE_FIPS_TO_ABBR[geo.countyFips.slice(0, 2)] : undefined);
      if (!abbr) return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "No state resolvable for foster-youth-agency aggregate lookup (this table is state-level only, no county column exists)" };
      // Aggregate-only: COUNT by placementType, never externalCaseId or any clinical/justice flag column.
      const rows = await db
        .select({ placementType: fosterYouthAgencyCases.currentPlacementType, count: sql<number>`count(*)::int` })
        .from(fosterYouthAgencyCases)
        .where(eq(fosterYouthAgencyCases.stateCode, abbr))
        .groupBy(fosterYouthAgencyCases.currentPlacementType);
      const total = rows.reduce((sum, r) => sum + r.count, 0);
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: { totalCases: total, byPlacementType: rows, geographyGrain: "state (no county column exists on this table)" } };
    }
    if (engine.id === "rural-connectivity") {
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Blocked: underlying FCC/service-desert lookups require lat/lng, which GeographyRef does not carry (only county/zip/state). Needs a ZIP/county-centroid lookup added before this can be wired." };
    }
    if (engine.id === "workforce") {
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Blocked: workforceAssessments has no zip/county/state column anywhere in its schema — a real geography rollup requires a schema change, not just a resolver." };
    }
    if (engine.id === "justice") {
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Blocked: justiceReferrals/supervisionCompliance have no zip/county/state column — a real geography rollup requires a schema change. (Note: reentry, a related justice-domain engine, IS wired via participantProfiles.zipCode.)" };
    }
    if (engine.id === "clinical") {
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Blocked: clinicalScreenings has no zip/county/state column, and this is the platform's highest-sensitivity PII table — even an aggregate wiring would need a deliberate schema + policy decision, not a quick fix." };
    }
    if (engine.id === "trade-sims") {
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Blocked: trade-sims tables (lessons, progress, sandbox projects) have no geography column at all — this is a per-learner skill simulator, not geography-indexed data." };
    }
    if (engine.id === "college-access-ai") {
      return { engineId: engine.id, engineLabel: engine.label, sources: engine.sources, fetchedAt, data: null, error: "Blocked: this engine is a live per-request AI advisor with no backing geography-indexed table — there is no stored dataset to query for a given county." };
    }
    // Any other route-invoked engine not yet covered above.
    return {
      engineId: engine.id,
      engineLabel: engine.label,
      sources: engine.sources,
      fetchedAt,
      data: null,
      error: `Engine ${engine.id} is route-invocation only; not yet wired into the in-process Conductor. Call ${engine.routePrefix} directly if needed.`,
    };
  } catch (err) {
    return {
      engineId: engine.id,
      engineLabel: engine.label,
      sources: engine.sources,
      fetchedAt,
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Currently wired for in-process (function-call) invocation. Route-only
 * engines are listed in the bundle with an explicit "not yet wired" marker
 * rather than silently omitted — visibility over false completeness.
 */
const IN_PROCESS_ENGINE_IDS = [
  "chainweb-engine", "gis-engine", "equity", "benefits", "corridor-chainweb", "scorecard", "corridor-story",
  "farmworker-iti", "reentry", "resident-journey",
  "regional-briefing", "rural-health", "rural-workforce", "rural-housing", "neighborhood", "safe-passage",
  "farm-cooperative", "farm-profitability", "foster-youth-agency",
];

export async function getOrchestratedIntelligence(
  geo: GeographyRef,
  options: OrchestrationOptions = {},
): Promise<OrchestrationBundle> {
  const requestedAt = new Date().toISOString();
  const pool = getNonPIIEngines();

  let selected: EngineDefinition[];
  const skipped: { engineId: string; reason: string }[] = [];

  if (options.engines && options.engines.length > 0) {
    selected = options.engines
      .map((id) => getEngineById(id))
      .filter((e): e is EngineDefinition => {
        if (!e) return true; // unknown id — will surface below
        if (e.touchesPII) {
          skipped.push({ engineId: e.id, reason: "PII wall — engine touches individual/household PII, excluded from orchestration output" });
          return false;
        }
        return true;
      });
    for (const id of options.engines) {
      if (!getEngineById(id)) skipped.push({ engineId: id, reason: "Unknown engine id — not found in registry" });
    }
  } else if (options.domains && options.domains.length > 0) {
    selected = pool.filter((e) => e.domains.some((d) => options.domains!.includes(d)));
  } else {
    selected = pool;
  }

  const callable = selected.filter((e) => IN_PROCESS_ENGINE_IDS.includes(e.id));
  for (const e of selected) {
    if (!IN_PROCESS_ENGINE_IDS.includes(e.id)) {
      skipped.push({ engineId: e.id, reason: "route-invocation only, not yet wired into in-process Conductor" });
    }
  }

  const facts = await Promise.all(callable.map((e) => callEngine(e, geo)));

  return { geography: geo, requestedAt, facts, skipped };
}

/** Render an orchestration bundle as an LLM-consumable context block with provenance. */
export function renderBundleAsContext(bundle: OrchestrationBundle): string {
  const lines: string[] = [`ORCHESTRATED INTELLIGENCE (as of ${bundle.requestedAt}):`];
  for (const fact of bundle.facts) {
    if (fact.error) {
      lines.push(`- [${fact.engineLabel}] unavailable: ${fact.error}`);
      continue;
    }
    if (!fact.data) continue;
    const dataStr = typeof fact.data === "string" ? fact.data : JSON.stringify(fact.data);
    lines.push(`- [${fact.engineLabel}] (source: ${fact.sources.join(", ")}; fetched ${fact.fetchedAt}): ${dataStr.slice(0, 1500)}`);
  }
  if (bundle.skipped.length > 0) {
    lines.push(`\nEngines not included in this answer: ${bundle.skipped.map((s) => `${s.engineId} (${s.reason})`).join("; ")}`);
  }
  return lines.join("\n");
}
