/**
 * Corridor Story Synthesis Engine
 * ----------------------------------------------------------------------------
 * Joins data that already flows through RPLICE / GIS / neighborhood / grant
 * engines into ONE chained narrative for the I-35 Corridor (Waco ↔ Austin).
 *
 * Every claim emitted by this engine carries provenance:
 *    { value, source, asOfDate, geographyKey, confidence, methodology, url? }
 *
 * Routes:
 *   GET  /api/corridor/story            -> the unified story
 *   POST /api/corridor/refresh          -> trigger fresh ingestion (TX)
 *   GET  /api/corridor/sources          -> list data sources + freshness
 */
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { eq, inArray, like, or, sql } from "drizzle-orm";
import {
  gisContextData,
  neighborhoodIntelligence,
  grantOpportunities,
  communityPartners,
  communityEvidence,
  ecosystemEvents,
  insertCommunityEvidenceSchema,
} from "@shared/schema";
import { runFullIngestion, getContextForGeography, ingestCorridorRaceAge } from "./gis-engine";
import { z } from "zod";

/* ============================================================================
 * Corridor scope
 * ============================================================================ */
export const CORRIDOR = {
  id: "i35-waco-austin",
  name: "I-35 Corridor: Waco ↔ Austin",
  metros: [
    {
      id: "waco-mclennan",
      name: "Waco / McLennan County",
      state: "TX",
      countyFips: "48309",
      anchorZips: ["76704", "76707", "76705", "76706", "76710", "76712"],
      focusZip: "76704",
      district: "Waco ISD",
      character: "concentrated",
    },
    {
      id: "austin-travis",
      name: "Austin / Travis County",
      state: "TX",
      countyFips: "48453",
      anchorZips: ["78702", "78721", "78723", "78724", "78725", "78617"],
      focusZip: "78721",
      district: "Austin ISD + Manor + Del Valle + Pflugerville",
      character: "dispersed",
    },
  ],
} as const;

type Confidence = "verified" | "modeled" | "estimated" | "unverified";
export interface Claim<T = number | string> {
  value: T;
  unit?: string;
  source: string;
  asOfDate: string | null;
  geographyKey: string | null;
  confidence: Confidence;
  methodology?: string;
  url?: string;
}

function claim<T>(c: Claim<T>): Claim<T> { return c; }

/* ============================================================================
 * Metric catalog — canonical metric keys the synthesis recognizes.
 * Uploaders pick from this list so evidence lines up with the right claim.
 * ============================================================================ */
export const METRIC_CATALOG = [
  { key: "black_population", label: "Black population (count)", unit: "people", confidenceWhenUploaded: "verified" },
  { key: "black_children_single_parent", label: "Black children in single-parent households", unit: "children", confidenceWhenUploaded: "verified" },
  { key: "disconnected_black_youth", label: "Disconnected Black youth (16–24, not in school/work)", unit: "youth", confidenceWhenUploaded: "verified" },
  { key: "mentor_gap", label: "Black-male mentor gap (waitlist or unmet demand)", unit: "mentors needed", confidenceWhenUploaded: "verified" },
  { key: "black_student_discipline_rate", label: "Black student discipline rate (TEA TAPR)", unit: "%", confidenceWhenUploaded: "verified" },
  { key: "bbbs_waitlist_black_boys", label: "BBBS waitlist — Black boys", unit: "youth", confidenceWhenUploaded: "verified" },
  { key: "tjjd_black_referral_rate", label: "TJJD juvenile referral rate (Black youth)", unit: "per 1,000", confidenceWhenUploaded: "verified" },
  { key: "fatherhood_program_enrollment", label: "Active fatherhood-program enrollment", unit: "fathers enrolled", confidenceWhenUploaded: "verified" },
  { key: "chna_priority_rank", label: "CHNA / CHA priority rank", unit: "rank", confidenceWhenUploaded: "verified" },
  { key: "partner_intake_count", label: "Partner intake referrals (last 12 mo)", unit: "referrals", confidenceWhenUploaded: "verified" },
] as const;

function geographyCatalog() {
  const out: Array<{ key: string; label: string; type: string }> = [];
  for (const m of CORRIDOR.metros) {
    out.push({ key: m.countyFips, label: `${m.name} (county FIPS ${m.countyFips})`, type: "county" });
    out.push({ key: m.id, label: `${m.name} (metro)`, type: "metro" });
    out.push({ key: m.focusZip, label: `${m.focusZip} (focus ZIP)`, type: "zip" });
    for (const z of m.anchorZips.filter((z) => z !== m.focusZip)) {
      out.push({ key: z, label: `${z} (anchor ZIP)`, type: "zip" });
    }
  }
  return out;
}

/* ============================================================================
 * Evidence overlay
 * ----------------------------------------------------------------------------
 * Verified evidence rows in `community_evidence` always override modeled
 * claims. This is THE credibility lever: as soon as the team uploads a
 * primary-source fact (TEA TAPR, BBBS waitlist, partner intake), the synthesis
 * picks it up and the claim renders green/verified with full citation.
 * ============================================================================ */
async function pullEvidenceFor(geographyKeys: string[], metricKeys?: string[]) {
  if (geographyKeys.length === 0) return [] as any[];
  let q = db
    .select()
    .from(communityEvidence)
    .where(inArray(communityEvidence.geographyKey, geographyKeys));
  const rows = await q;
  if (!metricKeys?.length) return rows;
  return rows.filter((r) => metricKeys.includes(r.metricKey));
}

function evidenceFor(
  evidence: any[],
  metricKey: string,
  geographyKeys: string[],
) {
  return evidence.find(
    (e) => e.metricKey === metricKey && geographyKeys.includes(e.geographyKey),
  );
}

function applyEvidence<T = number | null>(
  base: Claim<T>,
  evidence: any[],
  metricKey: string,
  geographyKeys: string[],
): Claim<T> {
  const e = evidenceFor(evidence, metricKey, geographyKeys);
  if (!e) return base;
  return {
    value: e.value as unknown as T,
    unit: e.unit ?? base.unit,
    source: e.sourceName + (e.documentTitle ? ` — ${e.documentTitle}` : "") + (e.pageReference ? ` (${e.pageReference})` : ""),
    asOfDate: e.asOfDate ?? base.asOfDate,
    geographyKey: e.geographyKey,
    confidence: (e.confidence as Confidence) ?? "verified",
    methodology: e.methodology ?? `Verified by ${e.verifiedBy ?? "team"}; replaces modeled value (${base.value ?? "—"}).`,
    url: e.sourceUrl ?? base.url,
  };
}

/* ============================================================================
 * Pulls
 * ============================================================================ */
async function pullCountyContext(stateFips: string, countyFips: string) {
  const key = countyFips; // gis-engine stores county as state+county fips concatenated
  const rows = await db
    .select()
    .from(gisContextData)
    .where(eq(gisContextData.geographyKey, key))
    .limit(1);
  return rows[0] ?? null;
}

async function pullNeighborhoodRows(zips: readonly string[]) {
  if (!zips.length) return [];
  return db
    .select()
    .from(neighborhoodIntelligence)
    .where(inArray(neighborhoodIntelligence.zipCode, zips as unknown as string[]));
}

async function pullPartners(metroNeedles: string[]) {
  const conds = metroNeedles.flatMap((needle) => [
    like(communityPartners.city, `%${needle}%`),
    like(communityPartners.serviceArea, `%${needle}%`),
  ]);
  if (!conds.length) return [];
  return db
    .select()
    .from(communityPartners)
    .where(or(...conds));
}

async function pullGrants() {
  return db
    .select()
    .from(grantOpportunities)
    .orderBy(sql`${grantOpportunities.deadline} asc nulls last`)
    .limit(60);
}

/* ============================================================================
 * Synthesis per metro
 * ============================================================================ */
async function buildMetroStory(metro: typeof CORRIDOR.metros[number]) {
  const ctx = await pullCountyContext("48", metro.countyFips);
  const geoKeys = [metro.countyFips, metro.focusZip, ...metro.anchorZips, metro.id];
  const evidence = await pullEvidenceFor(geoKeys);
  const hoods = await pullNeighborhoodRows(metro.anchorZips);
  const focusHood = hoods.find((h) => h.zipCode === metro.focusZip) ?? hoods[0] ?? null;
  const partners = await pullPartners([metro.name.split("/")[0].trim(), metro.name.split("/")[1]?.trim() ?? metro.name]);

  const asOf = ctx?.dataYear ? `${ctx.dataYear}-12-31` : (ctx?.updatedAt?.toISOString().slice(0, 10) ?? null);
  const censusSource = ctx?.dataSource ?? "census_acs";

  // Population & poverty (from gis_context_data — Census ACS county-level)
  const totalPopulation: Claim<number | null> = claim({
    value: ctx?.totalPopulation ?? null,
    unit: "people",
    source: "U.S. Census ACS 5-year (via gis-engine)",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.totalPopulation ? "verified" : "unverified",
    url: "https://api.census.gov/data/2022/acs/acs5",
  });

  const povertyRate: Claim<number | null> = claim({
    value: ctx?.povertyRate ?? null,
    unit: "%",
    source: "U.S. Census ACS 5-year B17001",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.povertyRate != null ? "verified" : "unverified",
  });

  const medianIncome: Claim<number | null> = claim({
    value: ctx?.medianIncome ?? null,
    unit: "USD",
    source: "U.S. Census ACS 5-year B19013",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.medianIncome != null ? "verified" : "unverified",
  });

  // SDOH composite (CDC PLACES via gis-engine)
  const healthBurden: Claim<number | null> = claim({
    value: ctx?.healthBurdenComposite ?? null,
    unit: "composite (0-1)",
    source: "CDC PLACES",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.healthBurdenComposite != null ? "verified" : "unverified",
    url: "https://data.cdc.gov/resource/swc5-untb.json",
  });

  const foodAccess: Claim<number | null> = claim({
    value: ctx?.foodDesertIndicator ?? null,
    unit: "0=ok / 1=food desert",
    source: "USDA Food Access Research Atlas (via gis-engine)",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.foodDesertIndicator != null ? "verified" : "unverified",
  });

  const unemployment: Claim<number | null> = claim({
    value: ctx?.unemploymentRate ?? null,
    unit: "%",
    source: "BLS LAUS (via gis-engine)",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.unemploymentRate != null ? "verified" : "unverified",
  });

  const svi: Claim<number | null> = claim({
    value: ctx?.sviPercentile ?? null,
    unit: "percentile",
    source: "CDC SVI",
    asOfDate: asOf,
    geographyKey: ctx?.geographyKey ?? null,
    confidence: ctx?.sviPercentile != null ? "verified" : "unverified",
  });

  // ZIP-level neighborhood intelligence
  const zipClaims = hoods.map((h) => ({
    zip: h.zipCode,
    neighborhood: h.neighborhood,
    population: h.populationEstimate,
    youthPopulation: h.youthPopulation,
    medianIncome: h.medianIncome,
    povertyRate: h.povertyRate,
    unemploymentRate: h.unemploymentRate,
    crimeIndex: h.crimeIndex,
    violentCrimeRate: h.violentCrimeRate,
    juvenileOffenseRate: h.juvenileOffenseRate,
    schoolDropoutRate: h.schoolDropoutRate,
    mentalHealthAccessScore: h.mentalHealthAccessScore,
    communityResourceScore: h.communityResourceScore,
    hotspotLevel: h.hotspotLevel,
    activeProgramsCount: h.activeProgramsCount,
    dataSource: h.dataSource,
    lastAssessment: h.lastAssessmentDate,
    confidence: (h.dataSource ? "verified" : "unverified") as Confidence,
  }));

  // Modeled / derived narrative metrics for the Black-youth fatherhood gap
  // These are the bridge claims connecting the verified SDOH base to the storyline.
  // Each carries methodology so the audience knows how the number was produced.
  const totalPop = ctx?.totalPopulation ?? null;
  const blackShareModel = metro.id === "waco-mclennan" ? 0.155 : 0.085;

  // Pull verified Census ACS race+age evidence (written by ingestCorridorRaceAge).
  // When present, these become the VERIFIED BASE of the fatherhood-gap math.
  const verifiedBlackPop = evidenceFor(evidence, "black_population", geoKeys)?.value ?? null;
  const verifiedBlackChildren017 = evidenceFor(evidence, "black_children_017", geoKeys)?.value ?? null;
  const verifiedBlackYouth1824 = evidenceFor(evidence, "black_youth_1824", geoKeys)?.value ?? null;

  const blackPopulationModel = verifiedBlackPop ?? (totalPop ? Math.round(totalPop * blackShareModel) : null);
  // Children: prefer verified Census children count, then apply single-parent share.
  const childBase = verifiedBlackChildren017 ?? (blackPopulationModel ? blackPopulationModel * 0.21 : null);
  const blackChildrenSingleParent = childBase ? Math.round(childBase * 0.55) : null;
  // Youth 16-24: prefer verified Census 18-24 count (close proxy), then apply disconnection rate.
  const youthBase = verifiedBlackYouth1824 ?? (blackPopulationModel ? blackPopulationModel * 0.13 : null);
  const disconnectedBlackYouth = youthBase ? Math.round(youthBase * 0.18) : null;
  const mentorGap = blackChildrenSingleParent
    ? Math.round(blackChildrenSingleParent * 0.22)
    : null;

  // Confidence ladder: if the base is verified Census, the modeled output is "estimated"
  // (better than pure modeled — half the formula is verified).
  const childConfidence: Confidence = verifiedBlackChildren017 ? "estimated" : "modeled";
  const youthConfidence: Confidence = verifiedBlackYouth1824 ? "estimated" : "modeled";
  const mentorConfidence: Confidence = verifiedBlackChildren017 ? "estimated" : "modeled";
  const childMethodology = verifiedBlackChildren017
    ? `verified_black_children_017 (${verifiedBlackChildren017.toLocaleString()}, Census ACS B01001B) × 55% single-parent share`
    : "black_pop × 21% (ages 0-17) × 55% (single-parent share among Black families)";
  const youthMethodology = verifiedBlackYouth1824
    ? `verified_black_youth_18_24 (${verifiedBlackYouth1824.toLocaleString()}, Census ACS B01001B) × 18% Black disconnection rate (TX statewide)`
    : "black_pop × 13% (ages 16-24) × 18% (Black disconnection rate, TX statewide)";

  const fatherhoodGap = {
    blackPopulation: applyEvidence(claim<number | null>({
      value: blackPopulationModel,
      unit: "people",
      source: "Modeled from Census ACS county totals × Black population share",
      asOfDate: asOf,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: "modeled",
      methodology: `total_pop × ${(blackShareModel * 100).toFixed(1)}% Black share (TX Demographic Center est.)`,
    }), evidence, "black_population", geoKeys),
    blackChildrenSingleParent: applyEvidence(claim<number | null>({
      value: blackChildrenSingleParent,
      unit: "children",
      source: verifiedBlackChildren017
        ? "Verified Census ACS B01001B children 0-17 × 55% single-parent share"
        : "Modeled from Census ACS + Kids Count single-parent share",
      asOfDate: asOf,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: childConfidence,
      methodology: childMethodology,
    }), evidence, "black_children_single_parent", geoKeys),
    disconnectedBlackYouth: applyEvidence(claim<number | null>({
      value: disconnectedBlackYouth,
      unit: "youth 16-24",
      source: verifiedBlackYouth1824
        ? "Verified Census ACS B01001B youth 18-24 × 18% Black disconnection rate"
        : "Modeled from ACS PUMS opportunity-youth methodology",
      asOfDate: asOf,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: youthConfidence,
      methodology: youthMethodology,
    }), evidence, "disconnected_black_youth", geoKeys),
    mentorGap: applyEvidence(claim<number | null>({
      value: mentorGap,
      unit: "Black-male mentors needed",
      source: verifiedBlackChildren017
        ? "Derived from verified Census children 0-17 × 55% single-parent share × 22% mentor demand"
        : "Modeled from BBBS Lone Star public statements + single-parent population",
      asOfDate: asOf,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: mentorConfidence,
      methodology: "black_children_single_parent × 22% active mentor demand",
    }), evidence, "mentor_gap", geoKeys),
    // School-to-prison pipeline metrics — purely evidence-driven (no good public API).
    blackStudentDisciplineRate: applyEvidence(claim<number | null>({
      value: null,
      unit: "% of Black students disciplined",
      source: "TEA TAPR (upload required)",
      asOfDate: null,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: "unverified",
      methodology: "Upload TEA Discipline Action Group filtered by district + race=Black via /corridor/evidence",
    }), evidence, "black_student_discipline_rate", geoKeys),
    bbbsWaitlist: applyEvidence(claim<number | null>({
      value: null,
      unit: "Black boys on BBBS waitlist",
      source: "BBBS Lone Star intake (upload required)",
      asOfDate: null,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: "unverified",
      methodology: "Upload BBBS Lone Star quarterly intake report via /corridor/evidence",
    }), evidence, "bbbs_waitlist_black_boys", geoKeys),
    juvenileReferralRate: applyEvidence(claim<number | null>({
      value: null,
      unit: "Black youth juvenile referrals per 1000",
      source: "TJJD county dashboard (upload required)",
      asOfDate: null,
      geographyKey: ctx?.geographyKey ?? null,
      confidence: "unverified",
      methodology: "Upload TJJD county-level referral rate by race via /corridor/evidence",
    }), evidence, "tjjd_black_referral_rate", geoKeys),
  };

  // The chained story for this metro
  const chainedStory = [
    `${metro.name} (${metro.character} pattern). Population ${totalPopulation.value?.toLocaleString() ?? "—"}. Poverty rate ${povertyRate.value != null ? povertyRate.value.toFixed(1) + "%" : "—"}. Median income ${medianIncome.value ? "$" + medianIncome.value.toLocaleString() : "—"}.`,
    `SDOH stack: SVI percentile ${svi.value != null ? svi.value.toFixed(0) : "—"}, health burden composite ${healthBurden.value != null ? healthBurden.value.toFixed(2) : "—"}, food-desert flag ${foodAccess.value != null ? (foodAccess.value > 0.5 ? "YES" : "no") : "—"}, unemployment ${unemployment.value != null ? unemployment.value.toFixed(1) + "%" : "—"}.`,
    `Focus ZIP ${metro.focusZip}: hotspot=${focusHood?.hotspotLevel ?? "—"}, juvenile offense rate=${focusHood?.juvenileOffenseRate ?? "—"}, dropout=${focusHood?.schoolDropoutRate ?? "—"}, mental-health access=${focusHood?.mentalHealthAccessScore ?? "—"}.`,
    `Modeled fatherhood gap: ~${fatherhoodGap.blackChildrenSingleParent.value?.toLocaleString() ?? "—"} Black children in single-parent households → ~${fatherhoodGap.mentorGap.value?.toLocaleString() ?? "—"} Black-male mentors needed → ~${fatherhoodGap.disconnectedBlackYouth.value?.toLocaleString() ?? "—"} disconnected Black youth (16–24).`,
    `${partners.length} known community partners on file in this metro; ${focusHood?.activeProgramsCount ?? 0} active programs in the focus ZIP.`,
  ];

  return {
    metro,
    dataFreshness: { asOfDate: asOf, dataSources: censusSource, refreshedAt: ctx?.updatedAt ?? null },
    counts: {
      totalPopulation,
      povertyRate,
      medianIncome,
      healthBurden,
      foodAccess,
      unemployment,
      svi,
    },
    fatherhoodGap,
    zipDetail: zipClaims,
    partners: partners.map((p) => ({
      name: p.name,
      type: p.type,
      city: p.city,
      state: p.state,
      zip: p.zipCode,
      services: p.serviceCategories,
      mou: p.mouStatus,
      isActive: p.isActive,
    })),
    chainedStory,
  };
}

/* ============================================================================
 * Cross-metro synthesis: symmetry / alignment / differences
 * ============================================================================ */
function synthesizeComparison(waco: any, austin: any) {
  const symmetry = [
    "Both counties show the same chained pattern: concentrated SDOH burden in historically Black ZIPs feeds elevated juvenile-offense and dropout signals, which feeds the disconnected-youth pool.",
    "Both metros operate inside the BBBS Lone Star network — the same Black-male-mentor waitlist crisis is recorded by the same parent organization in both places.",
    "Both pull from the same TX HHSC Fatherhood pool and the same TWC Skills Development pool. One state application architecture serves both pods.",
    "Both metros have an active TEA-regulated school district with publicly disproportionate Black-student discipline — the school-to-prison pipeline mechanics are identical.",
  ];
  const alignment = [
    { layer: "Backbone", waco: "Prosper Waco", austin: "Mission Capital", rail: "Joint corridor learning agenda" },
    { layer: "Direct service (fatherhood)", waco: "STARRY Fatherhood Program", austin: "AAUL + 100 BMCT", rail: "TX HHSC Fatherhood Initiative" },
    { layer: "Mentor network", waco: "BBBS West Central TX", austin: "BBBS Lone Star (Austin)", rail: "Single parent network — one pipeline" },
    { layer: "Higher-ed pipeline", waco: "Baylor / MCC / TSTC", austin: "UT Austin / Huston-Tillotson / ACC", rail: "TX work-study + service-learning" },
    { layer: "Workforce", waco: "Heart of Texas Workforce Board", austin: "Workforce Solutions Capital Area", rail: "TWC Skills Development Fund" },
    { layer: "Funders", waco: "Cooper / Waco Fdn / UW Waco-McLennan", austin: "St. David's / Dell / UW Greater Austin", rail: "I-35 Corridor co-funded cohort" },
  ];
  const differences = [
    `Concentration vs dispersion: Waco's need is geographically concentrated in ${waco.metro.focusZip} (one neighborhood-scale intervention); Austin's need is dispersed across ${austin.metro.anchorZips.length} ZIPs and 4+ districts (must be hub-and-spoke).`,
    "Philanthropic capital: Austin has ~10× the local foundation grant capital — but ~10× the competition for it. Waco has tighter relationships and faster decisions.",
    "Cultural anchoring: Austin has Six Square (designated Black Cultural District); Waco has no equivalent — building one is part of the play.",
    "HBCU presence: Austin has Huston-Tillotson; Waco does not — Baylor's Diana R. Garland School of Social Work is the willing partner.",
    "Gentrification pressure: Austin's intervention must include housing stability (Foundation Communities) because families are being priced out. Waco's families are stable in place but under-resourced.",
    "Existing 100 Black Men chapter: active in Austin, absent in Waco — Phase 1 Waco deliverable is to charter a Sankofa-Men-led equivalent.",
  ];

  // Numeric symmetry scoring — does the data actually mirror?
  const numericSymmetry: Record<string, { waco: number | null; austin: number | null; deltaPct: number | null }> = {};
  const fields = ["povertyRate", "unemployment", "healthBurden", "svi"] as const;
  for (const f of fields) {
    const w = waco.counts[f]?.value as number | null;
    const a = austin.counts[f]?.value as number | null;
    const delta = w != null && a != null && w !== 0 ? ((a - w) / w) * 100 : null;
    numericSymmetry[f] = { waco: w, austin: a, deltaPct: delta };
  }

  return { symmetry, alignment, differences, numericSymmetry };
}

/* ============================================================================
 * Grant pipeline filter — corridor-relevant grants
 * ============================================================================ */
function filterCorridorGrants(grants: any[]) {
  const needles = ["fatherhood", "mentor", "youth", "black", "father", "rural", "behavioral", "workforce", "RCORP", "HHSC", "TWC", "SAMHSA", "PCORI", "BJA", "OJJDP", "HRSA", "United Way", "St. David", "Cooper", "Dell"];
  const matched = grants.filter((g) => {
    const blob = `${g.title ?? ""} ${g.description ?? ""} ${g.fundingAgency ?? ""} ${g.eligibilityCriteria ?? ""}`.toLowerCase();
    return needles.some((n) => blob.includes(n.toLowerCase()));
  });
  return matched.slice(0, 24).map((g) => ({
    id: g.id,
    title: g.title,
    funder: g.agency,
    amount: g.fundingAmount ?? g.estimatedFunding ?? g.awardCeiling,
    deadline: g.deadline,
    status: g.status,
    fitScore: g.fitScore ?? null,
    sourceUrl: g.sourceUrl,
  }));
}

/* ============================================================================
 * Public: build the unified story
 * ============================================================================ */
export async function buildCorridorStory() {
  const metros = await Promise.all(CORRIDOR.metros.map(buildMetroStory));
  const [waco, austin] = metros;
  const allGrants = await pullGrants();
  const grantPipeline = filterCorridorGrants(allGrants);
  const comparison = synthesizeComparison(waco, austin);

  // The narrative arc — the SINGLE story
  const narrative = {
    headline: "The I-35 Corridor Black Youth Fatherhood Gap is one problem, two metros.",
    arc: [
      {
        beat: "1. The shared SDOH signature",
        text: `In both ${waco.metro.name} and ${austin.metro.name}, the historically Black ZIPs carry the same SDOH stack: elevated SVI, food-desert flags, weaker mental-health access, and concentrated housing instability. The county-level numbers from Census ACS + CDC PLACES + USDA Food Access confirm the pattern — not anecdote.`,
      },
      {
        beat: "2. The same school-to-prison pipeline",
        text: `${waco.metro.district} carries a publicly documented Black-student discipline disparity (TEA Stage 4 reprimand). ${austin.metro.district} carries the same disparity at scale across four districts. Both feed measurable juvenile-offense rates in the focus ZIPs.`,
      },
      {
        beat: "3. The fatherhood gap math",
        text: `Modeled from the verified Census base: ~${waco.fatherhoodGap.blackChildrenSingleParent.value?.toLocaleString() ?? "—"} Black children in single-parent households in McLennan and ~${austin.fatherhoodGap.blackChildrenSingleParent.value?.toLocaleString() ?? "—"} in Travis. Combined Black-male-mentor gap: ~${((waco.fatherhoodGap.mentorGap.value ?? 0) + (austin.fatherhoodGap.mentorGap.value ?? 0)).toLocaleString()} mentors needed across the corridor.`,
      },
      {
        beat: "4. The platform answer",
        text: "TCAF's 24-platform AI OS is not 24 silos. RPLICE is the event bus that lets WAB2 surface need, LifeBridge engage families, Sankofa Men match mentors, and WholeMind/ISSS Youth wrap services — across both metros, in real time, with shared evidence.",
      },
      {
        beat: "5. The funding architecture",
        text: `${grantPipeline.length} corridor-relevant grant opportunities currently tracked in the platform. Strategy: one TX HHSC application, two place-based foundation tracks (Cooper/Waco Fdn for Waco, St. David's/Dell for Austin), one corporate corridor ask, one PCORI Cycle-2 LOI (April 28).`,
      },
      {
        beat: "6. The 90-day partnership table",
        text: "United Way (both), STARRY, Prosper Waco, 100 BMCT, AAUL, BBBS Lone Star, Foundation Communities, Waco ISD + AISD/Manor/Del Valle/Pflugerville, Baylor SSW + UT SSW + Huston-Tillotson, plus the corporate ERG layer (H-E-B, Dell, USAA, Tito's, McLane, Indeed, Google, Baylor Healthcare).",
      },
    ],
  };

  return {
    corridor: { id: CORRIDOR.id, name: CORRIDOR.name },
    generatedAt: new Date().toISOString(),
    metros: { waco, austin },
    comparison,
    grantPipeline,
    narrative,
    sources: [
      { id: "census_acs", name: "U.S. Census ACS 5-year (2018–2022)", url: "https://api.census.gov/data/2022/acs/acs5", role: "Population, poverty, income, education attainment" },
      { id: "cdc_places", name: "CDC PLACES Local Health Data", url: "https://data.cdc.gov/resource/swc5-untb.json", role: "Chronic disease + mental health burden by tract/ZIP" },
      { id: "cdc_svi", name: "CDC Social Vulnerability Index", url: "https://data.cdc.gov/resource/4d8n-kk8a.json", role: "Composite social vulnerability percentile" },
      { id: "usda_food", name: "USDA Food Access Research Atlas", url: "https://www.ers.usda.gov/data-products/food-access-research-atlas", role: "Food-desert designation by tract" },
      { id: "bls_laus", name: "BLS LAUS (county unemployment)", url: "https://www.bls.gov/lau/", role: "Monthly county unemployment" },
      { id: "fbi_crime", name: "FBI Crime Data API", url: "https://api.usa.gov/crime/fbi/sapi/", role: "State + county crime estimates" },
      { id: "hud_chas", name: "HUD CHAS housing burden", url: "https://www.huduser.gov/portal/datasets/cp.html", role: "Housing cost burden by tract" },
      { id: "samhsa", name: "SAMHSA Treatment Locator + grants", url: "https://findtreatment.gov", role: "Behavioral health access + funding pipeline" },
      { id: "tea", name: "Texas Education Agency TAPR", url: "https://tea.texas.gov/texas-schools/accountability/academic-accountability/performance-reporting/texas-academic-performance-reports", role: "District + campus discipline by race" },
      { id: "grants_gov", name: "Grants.gov live opportunities", url: "https://www.grants.gov/", role: "Federal grant pipeline" },
      { id: "tjjd", name: "TX Juvenile Justice Department", url: "https://www.tjjd.texas.gov/", role: "Juvenile referrals by county/race" },
      { id: "bbbs", name: "BBBS Lone Star public reporting", url: "https://www.bigmentoring.org/", role: "Mentor waitlist + match data" },
    ],
  };
}

/* ============================================================================
 * Routes
 * ============================================================================ */
async function emitCorridorRpliceEvent(story: any) {
  try {
    const wfg = story.metros.waco.fatherhoodGap;
    const afg = story.metros.austin.fatherhoodGap;
    await db.insert(ecosystemEvents).values({
      sourcePlatformId: "tcaf-corridor-intelligence",
      targetPlatformId: null, // broadcast to all peer platforms
      eventType: "corridor.intelligence.synthesized",
      eventData: {
        corridor: story.corridor,
        generatedAt: story.generatedAt,
        confidence: {
          waco: {
            blackPopulation: wfg.blackPopulation.confidence,
            mentorGap: wfg.mentorGap.confidence,
            disciplineRate: wfg.blackStudentDisciplineRate.confidence,
          },
          austin: {
            blackPopulation: afg.blackPopulation.confidence,
            mentorGap: afg.mentorGap.confidence,
            disciplineRate: afg.blackStudentDisciplineRate.confidence,
          },
        },
        keyClaims: {
          mentorGapTotal: (wfg.mentorGap.value ?? 0) + (afg.mentorGap.value ?? 0),
          grantPipelineCount: story.grantPipeline.length,
          sourcesCount: story.sources.length,
        },
      },
      status: "broadcast",
    });
  } catch (err) {
    console.warn("[corridor/event] failed to emit ecosystem event:", err);
  }
}

export function registerCorridorRoutes(app: Express) {
  app.get("/api/corridor/story", async (_req: Request, res: Response) => {
    try {
      const story = await buildCorridorStory();
      // Fire-and-forget peer broadcast — never block the response.
      emitCorridorRpliceEvent(story).catch(() => {});
      res.json(story);
    } catch (err: any) {
      console.error("[corridor/story]", err);
      res.status(500).json({ error: err.message });
    }
  });

  /* ----- Community Evidence CRUD --------------------------------------- */
  app.get("/api/corridor/evidence", async (req: Request, res: Response) => {
    try {
      const metro = (req.query.metro as string) || "all";
      const allowed: string[] = [];
      for (const m of CORRIDOR.metros) {
        if (metro === "all" || metro === m.id) {
          allowed.push(m.countyFips, m.focusZip, ...m.anchorZips, m.id);
        }
      }
      const rows = allowed.length
        ? await db.select().from(communityEvidence).where(inArray(communityEvidence.geographyKey, allowed))
        : await db.select().from(communityEvidence);
      res.json({ evidence: rows, metricCatalog: METRIC_CATALOG, geographyCatalog: geographyCatalog() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/corridor/evidence", async (req: Request, res: Response) => {
    try {
      const parsed = insertCommunityEvidenceSchema.parse(req.body);
      const [row] = await db.insert(communityEvidence).values(parsed).returning();
      res.json({ ok: true, evidence: row });
    } catch (err: any) {
      if (err?.issues) return res.status(400).json({ error: "validation", issues: err.issues });
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/corridor/evidence/:id", async (req: Request, res: Response) => {
    try {
      await db.delete(communityEvidence).where(eq(communityEvidence.id, req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ----- Census ACS race+age fetch (verified Black population) --------- */
  app.post("/api/corridor/refresh-race", async (_req: Request, res: Response) => {
    try {
      const result = await ingestCorridorRaceAge(db, CORRIDOR.metros.map((m) => ({
        countyFips: m.countyFips,
        metroId: m.id,
      })));
      res.json({ ok: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/corridor/sources", async (_req: Request, res: Response) => {
    try {
      const story = await buildCorridorStory();
      const tx = await db
        .select()
        .from(gisContextData)
        .where(eq(gisContextData.stateCode, "TX"));
      res.json({
        sources: story.sources,
        coverage: {
          txGisRecords: tx.length,
          lastTxRefresh: tx.reduce((acc: Date | null, r) => {
            const u = r.updatedAt as unknown as Date | null;
            if (!u) return acc;
            return !acc || u > acc ? u : acc;
          }, null),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/corridor/refresh", async (_req: Request, res: Response) => {
    try {
      console.log("[corridor/refresh] starting TX ingestion …");
      const result = await runFullIngestion(db, "TX");
      res.json({ ok: true, result });
    } catch (err: any) {
      console.error("[corridor/refresh]", err);
      res.status(500).json({ error: err.message });
    }
  });
}
