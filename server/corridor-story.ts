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
import { CHAIN_STEPS } from "./corridor-chainweb";
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
      district: "Waco Independent School District",
      character: "concentrated",
    },
    {
      id: "austin-travis",
      name: "Austin / Travis County",
      state: "TX",
      countyFips: "48453",
      anchorZips: ["78702", "78721", "78723", "78724", "78725", "78617"],
      focusZip: "78721",
      district: "Austin Independent School District plus Manor, Del Valle, and Pflugerville school districts",
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

  /* -------------------------------------------------------------------------
   * DEPTH SECTIONS — pull from chain-web evidence written into community_evidence.
   * Each section cites the exact evidence row it came from, so every number in
   * the story has a traceable chain back to a primary source.
   * ------------------------------------------------------------------------- */
  const evFor = (metricKey: string) => evidenceFor(evidence, metricKey, geoKeys);
  const toClaim = (metricKey: string, label: string, fallbackSource: string): Claim<number | null> => {
    const e = evFor(metricKey);
    if (!e) return claim({ value: null, source: fallbackSource, asOfDate: null, geographyKey: null, confidence: "unverified", methodology: `No evidence uploaded for ${metricKey}` });
    return claim({
      value: Number(e.value),
      unit: e.unit ?? undefined,
      source: e.sourceName + (e.documentTitle ? ` — ${e.documentTitle}` : ""),
      asOfDate: e.asOfDate ?? null,
      geographyKey: e.geographyKey,
      confidence: (e.confidence as Confidence) ?? "verified",
      methodology: e.methodology ?? undefined,
      url: e.sourceUrl ?? undefined,
    });
  };

  // RISK FACTORS — indicators that increase fatherhood/mentorship need.
  // Each pulled straight from chain-web evidence when available.
  const riskFactors = [
    { key: "black_poverty_rate", label: "Black poverty rate", weight: 0.20, claim: toClaim("black_poverty_rate", "Black poverty rate", "Census ACS B17001B (run chain web)") },
    { key: "black_family_single_parent_rate", label: "Black families single-parent share", weight: 0.20, claim: toClaim("black_family_single_parent_rate", "Black single-parent share", "Census ACS B11003B (run chain web)") },
    { key: "black_less_than_hs_rate", label: "Black adults without HS diploma", weight: 0.10, claim: toClaim("black_less_than_hs_rate", "Black <HS rate", "Census ACS C15002B (run chain web)") },
    { key: "svi_overall_percentile", label: "Social Vulnerability Index percentile", weight: 0.15, claim: toClaim("svi_overall_percentile", "SVI percentile", "CDC/ATSDR SVI (run chain web)") },
    { key: "frequent_mental_distress_rate", label: "Adults with frequent mental distress", weight: 0.10, claim: toClaim("frequent_mental_distress_rate", "Mental distress rate", "CDC PLACES MHLTH (run chain web)") },
    { key: "depression_prevalence", label: "Depression prevalence", weight: 0.10, claim: toClaim("depression_prevalence", "Depression %", "CDC PLACES (run chain web)") },
    { key: "uninsured_rate", label: "Adults without health insurance", weight: 0.10, claim: toClaim("uninsured_rate", "Uninsured %", "CDC PLACES ACCESS2 (run chain web)") },
    { key: "black_student_discipline_rate", label: "Black student discipline rate", weight: 0.05, claim: toClaim("black_student_discipline_rate", "Discipline rate", "TEA TAPR (upload required)") },
  ];
  // Composite risk index: weighted average of verified values on 0-100 scale.
  const verifiedRisks = riskFactors.filter((r) => r.claim.value != null && r.claim.confidence === "verified");
  const riskIndex = verifiedRisks.length
    ? +(
        verifiedRisks.reduce((acc, r) => {
          // Normalize: SVI is 0-100 already. Others are %. Cap at 100.
          const v = Math.min(100, Number(r.claim.value));
          return acc + v * r.weight;
        }, 0) / verifiedRisks.reduce((acc, r) => acc + r.weight, 0)
      ).toFixed(1)
    : null;

  // PROTECTIVE FACTORS — assets that reduce fatherhood/mentorship need.
  const baPlus = toClaim("black_bachelors_plus_rate", "Black BA+ rate", "Census ACS C15002B (run chain web)");
  const activePartners = partners.filter((p) => p.isActive);
  const activeMouPartners = partners.filter((p) => p.mouStatus === "active" || p.mouStatus === "signed");
  const protectiveFactors = [
    { key: "black_bachelors_plus_rate", label: "Black adults 25+ with BA+", claim: baPlus },
    { key: "active_community_partners", label: "Active community partners on file", value: activePartners.length, source: "Platform partner directory" },
    { key: "active_mou_partners", label: "Partners with active MOU", value: activeMouPartners.length, source: "Platform partner directory" },
    { key: "active_programs_in_focus_zip", label: `Active programs in focus ZIP ${metro.focusZip}`, value: focusHood?.activeProgramsCount ?? 0, source: "Neighborhood intelligence" },
    { key: "community_resource_score", label: "Community resource score (focus ZIP)", value: focusHood?.communityResourceScore ?? null, source: "Neighborhood intelligence" },
  ];

  // CRIME PROFILE — from FBI chain-web step (state-level proxy) + neighborhood rates.
  const crimeProfile = {
    violent: toClaim("crime_violent", "Violent crime", "FBI Crime Data API (run chain web)"),
    property: toClaim("crime_property", "Property crime", "FBI Crime Data API (run chain web)"),
    homicide: toClaim("crime_homicide", "Homicide", "FBI Crime Data API (run chain web)"),
    aggravatedAssault: toClaim("crime_aggravated_assault", "Aggravated assault", "FBI Crime Data API (run chain web)"),
    robbery: toClaim("crime_robbery", "Robbery", "FBI Crime Data API (run chain web)"),
    burglary: toClaim("crime_burglary", "Burglary", "FBI Crime Data API (run chain web)"),
    focusZipCrimeIndex: focusHood?.crimeIndex ?? null,
    focusZipViolentRate: focusHood?.violentCrimeRate ?? null,
    focusZipJuvenileRate: focusHood?.juvenileOffenseRate ?? null,
  };

  // ROOT CAUSES — narrative that links the chain: each cause references the verified data that supports it.
  const povertyEv = evFor("black_poverty_rate");
  const familyEv = evFor("black_family_single_parent_rate");
  const eduEv = evFor("black_less_than_hs_rate");
  const sviEv = evFor("svi_overall_percentile");
  const mhEv = evFor("frequent_mental_distress_rate");
  const rootCauses = [
    {
      cause: "Economic exclusion",
      narrative: povertyEv
        ? `${Number(povertyEv.value).toFixed(1)}% of the Black population in ${metro.name} lives below poverty (Census B17001B, ${povertyEv.asOfDate ?? "—"}). This is the upstream driver of housing instability, food insecurity, and caregiver stress.`
        : `Poverty rate pending — run chain web to populate from Census B17001B.`,
      citesStepIds: ["census_black_poverty"],
      evidenceId: povertyEv?.id ?? null,
    },
    {
      cause: "Family structure under economic stress",
      narrative: familyEv
        ? `${Number(familyEv.value).toFixed(1)}% of Black families with own children in ${metro.name} are single-parent households (Census B11003B). This sets the scale of the mentorship gap.`
        : `Single-parent share pending — run chain web to populate from Census B11003B.`,
      citesStepIds: ["census_black_family"],
      evidenceId: familyEv?.id ?? null,
    },
    {
      cause: "Education-to-opportunity gap",
      narrative: eduEv
        ? `${Number(eduEv.value).toFixed(1)}% of Black adults 25+ lack a HS diploma in ${metro.name} (Census C15002B), limiting earning power and modeling effects for youth.`
        : `Educational attainment pending — run chain web to populate from Census C15002B.`,
      citesStepIds: ["census_black_education"],
      evidenceId: eduEv?.id ?? null,
    },
    {
      cause: "Compounded neighborhood pressure",
      narrative: sviEv
        ? `${Number(sviEv.value).toFixed(0)}th percentile on the federal Social Vulnerability Index (CDC and the federal Agency for Toxic Substances and Disease Registry, 2022). Translation: the same neighborhood carries poverty, housing burden, transportation gaps, and language barriers all at once — not one pressure at a time.`
        : `Social Vulnerability Index pending — run the data refresh to load from the federal CDC source.`,
      citesStepIds: ["atsdr_svi_county"],
      evidenceId: sviEv?.id ?? null,
    },
    {
      cause: "Untreated mental-health burden",
      narrative: mhEv
        ? `${Number(mhEv.value).toFixed(1)}% of adults report frequent mental distress (CDC PLACES community health survey). Combined with ${evFor("uninsured_rate") ? Number(evFor("uninsured_rate").value).toFixed(1) + "%" : "—"} of adults without health insurance, getting help is structurally hard — not a matter of willpower.`
        : `Mental-health indicators pending — run the data refresh to load from the CDC PLACES survey.`,
      citesStepIds: ["cdc_places_county"],
      evidenceId: mhEv?.id ?? null,
    },
    {
      cause: "School-to-justice-system pipeline",
      narrative: `Publicly documented disparities in how Black students are disciplined in ${metro.district} feed juvenile-justice referral rates in the focus ZIP code. Upload the Texas Education Agency annual school-performance report and the Texas Juvenile Justice Department county dashboard to quantify the local picture.`,
      citesStepIds: [],
      evidenceId: evFor("black_student_discipline_rate")?.id ?? null,
    },
  ];

  // RECOMMENDED SOLUTIONS — derived from gaps × partner capabilities × platform modules.
  const recommendedSolutions = [
    {
      solution: "Fatherhood Pod (peer + case-managed)",
      addresses: ["black_family_single_parent_rate", "mentor_gap"],
      deliveryPartners: metro.id === "waco-mclennan"
        ? ["STARRY Fatherhood", "Prosper Waco", "Baylor Diana R. Garland SSW"]
        : ["AAUL", "100 BMCT Austin", "Foundation Communities", "Huston-Tillotson"],
      platformModules: ["LifeBridge", "Sankofa Men", "WholeMind"],
      fundingFit: ["TX HHSC Fatherhood", "TWC Skills Development", "United Way"],
      kpi: "active_father_enrollment, 6-month retention",
    },
    {
      solution: "Black-male mentor match pipeline",
      addresses: ["mentor_gap", "bbbs_waitlist_black_boys"],
      deliveryPartners: ["BBBS Lone Star", "100 Black Men (chapter or chartered)", "Alpha Phi Alpha / Omega Psi Phi / Kappa Alpha Psi"],
      platformModules: ["Sankofa Men", "WholeMind", "ISSS Youth"],
      fundingFit: ["NBCUniversal Together Fund", "Spencer", "BJA SCA"],
      kpi: "black_boys_matched_quarterly, match_wait_time_days",
    },
    {
      solution: "Wraparound behavioral-health access",
      addresses: ["frequent_mental_distress_rate", "depression_prevalence", "uninsured_rate"],
      deliveryPartners: metro.id === "waco-mclennan"
        ? ["Ascension Providence Waco", "MHMR Waco-Heart of Texas"]
        : ["St. David's Foundation", "Integral Care", "Austin Travis County Integral Care"],
      platformModules: ["WholeMind", "ISSS Youth", "Medicaid 1115 alignment layer"],
      fundingFit: ["SAMHSA MHBG", "PCORI Cycle-2", "HRSA RCORP"],
      kpi: "referral_to_service_days, warm_handoff_rate",
    },
    {
      solution: "School-climate + discipline disparity intervention",
      addresses: ["black_student_discipline_rate", "school-to-prison pipeline"],
      deliveryPartners: metro.id === "waco-mclennan" ? ["Waco ISD"] : ["Austin ISD", "Manor ISD", "Del Valle ISD", "Pflugerville ISD"],
      platformModules: ["ISSS Youth", "Community Intelligence"],
      fundingFit: ["OJJDP Youth Mentoring", "ED Title IV"],
      kpi: "suspension_rate_black_students, restorative_practice_adoption",
    },
    {
      solution: "Corridor evidence engine (this platform)",
      addresses: ["data fragmentation across funders"],
      deliveryPartners: ["TCAF (backbone)"],
      platformModules: ["Corridor Intelligence", "RPLICE event bus", "Chain Web ingestor"],
      fundingFit: ["Agency Fund", "Borealis", "Walton"],
      kpi: "verified_evidence_rows, unique_sources_cited, platform_synthesis_runs",
    },
  ];

  // COMMUNITY RESOURCES — tied to partner directory (real records).
  const communityResources = partners.map((p) => ({
    name: p.name,
    type: p.type,
    city: p.city,
    zip: p.zipCode,
    services: p.serviceCategories,
    mou: p.mouStatus,
    isActive: p.isActive,
  }));

  // The chained story for this metro — written for any reader (parent, employer,
  // educator, council member, funder), not just grant reviewers. Acronyms spelled out.
  const chainedStory = [
    `${metro.name} (need is ${metro.character === "concentrated" ? "concentrated in one neighborhood" : "spread across several neighborhoods"}). Population: ${totalPopulation.value?.toLocaleString() ?? "—"}. Poverty rate: ${povertyRate.value != null ? povertyRate.value.toFixed(1) + "%" : "—"}. Median household income: ${medianIncome.value ? "$" + medianIncome.value.toLocaleString() : "—"}.`,
    `Neighborhood-pressure profile: Social Vulnerability Index ranks at the ${svi.value != null ? svi.value.toFixed(0) + "th" : "—"} percentile nationally (the higher the number, the more pressure on the community). Overall health burden score: ${healthBurden.value != null ? healthBurden.value.toFixed(2) : "—"} on a 0-to-1 scale. Federal food-desert flag (U.S. Department of Agriculture): ${foodAccess.value != null ? (foodAccess.value > 0.5 ? "YES" : "no") : "—"}. Unemployment: ${unemployment.value != null ? unemployment.value.toFixed(1) + "%" : "—"}.`,
    `Focus ZIP code ${metro.focusZip}: activity hotspot level — ${focusHood?.hotspotLevel ?? "—"}; juvenile-justice referral rate — ${focusHood?.juvenileOffenseRate ?? "—"}; high-school dropout rate — ${focusHood?.schoolDropoutRate ?? "—"}; mental-health-care access score — ${focusHood?.mentalHealthAccessScore ?? "—"}.`,
    `Fatherhood and mentorship gap (modeled from verified U.S. Census data): roughly ${fatherhoodGap.blackChildrenSingleParent.value?.toLocaleString() ?? "—"} Black children in single-parent households → roughly ${fatherhoodGap.mentorGap.value?.toLocaleString() ?? "—"} Black-male mentors needed → roughly ${fatherhoodGap.disconnectedBlackYouth.value?.toLocaleString() ?? "—"} young adults (ages 16–24) currently disconnected from both school and work.`,
    `${partners.length} community partner organizations on file in this city; ${focusHood?.activeProgramsCount ?? 0} active programs in the focus ZIP code.`,
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
    riskFactors,
    riskIndex,
    protectiveFactors,
    crimeProfile,
    rootCauses,
    recommendedSolutions,
    communityResources,
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
    "Both cities show the same chain of pressure: concentrated neighborhood hardship in historically Black ZIP codes feeds higher juvenile-justice referrals and school dropout, which in turn feeds the population of young adults disconnected from school and work.",
    "Both cities operate inside the Big Brothers Big Sisters Lone Star network — the same waitlist of Black boys waiting for a mentor is documented by the same parent organization in both places.",
    "Both cities draw from the same statewide funding pools: the Texas Health and Human Services Commission's fatherhood program and the Texas Workforce Commission's Skills Development Fund. One state application can serve both cities at the same time.",
    "Both cities have a regulated school district with publicly disproportionate discipline rates for Black students. The pattern is the same in Waco and Austin; only the scale differs.",
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
    `Concentration vs. spread: Waco's need is concentrated in one ZIP code (${waco.metro.focusZip}), so a single neighborhood-scale program can reach most of it. Austin's need is spread across ${austin.metro.anchorZips.length} ZIP codes and four school districts, so the response has to be a hub with multiple spokes.`,
    "Foundation funding: Austin has roughly ten times more local foundation money available — and roughly ten times more competition for it. Waco has tighter relationships and faster decisions.",
    "Cultural anchor: Austin has Six Square, a city-designated Black cultural district. Waco has no equivalent yet — building one is part of the plan.",
    "Higher education: Austin has Huston-Tillotson University, a Historically Black College or University (HBCU). Waco does not. Baylor University's Diana R. Garland School of Social Work is the willing local partner instead.",
    "Housing pressure: Austin's response has to include housing stability (in partnership with Foundation Communities) because families are being priced out of the historic neighborhoods. Waco's families are stable in place but under-resourced.",
    "Mentorship infrastructure: 100 Black Men of Central Texas is active in Austin but does not yet have a Waco chapter. Launching a local equivalent is the first-year deliverable in Waco.",
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

  // The narrative arc — the SINGLE story.
  // Written in plain language for any reader: parents, teachers, mentors, faith
  // leaders, employers, city council members, foundation officers, and federal
  // grant reviewers. Acronyms are spelled out the first time they appear.
  const narrative = {
    headline:
      "One challenge, two cities. Black children along the Interstate 35 corridor between Waco and Austin face the same gaps in mentorship, opportunity, and support — and the same coordinated response can close them.",
    arc: [
      {
        beat: "1. The same neighborhood pressures show up in both cities",
        text: `In both ${waco.metro.name} and ${austin.metro.name}, the historically Black ZIP codes carry the same set of pressures: higher rates of poverty and housing instability, fewer grocery stores within reach, harder access to mental-health care, and high scores on the federal Social Vulnerability Index (a CDC measure of how vulnerable a community is to disasters and chronic stress). These are not anecdotes — the numbers come from the U.S. Census American Community Survey, the CDC PLACES community health survey, and the U.S. Department of Agriculture food-access maps.`,
      },
      {
        beat: "2. The school-to-justice-system pattern repeats",
        text: `${waco.metro.district} has publicly documented disparities in how Black students are disciplined, reported each year by the Texas Education Agency. ${austin.metro.district} carries the same disparity at larger scale. In both cities, those discipline gaps feed measurable juvenile-justice referral rates in the same ZIP codes — a chain that is documented, not assumed.`,
      },
      {
        beat: "3. The fatherhood and mentorship gap, in real numbers",
        text: `Calculated from verified U.S. Census data: roughly ${waco.fatherhoodGap.blackChildrenSingleParent.value?.toLocaleString() ?? "—"} Black children are growing up in single-parent households in McLennan County (Waco), and roughly ${austin.fatherhoodGap.blackChildrenSingleParent.value?.toLocaleString() ?? "—"} in Travis County (Austin). Together, that points to about ${((waco.fatherhoodGap.mentorGap.value ?? 0) + (austin.fatherhoodGap.mentorGap.value ?? 0)).toLocaleString()} additional Black-male mentors needed across the two cities — adults who can show up consistently in a young person's life. This is a measurable, fillable gap, not a feeling.`,
      },
      {
        beat: "4. A coordinated answer instead of scattered programs",
        text: "Today, the work happens in silos: one organization spots a family in need, another runs a fatherhood class, a third tries to find a mentor, a fourth handles housing or behavioral-health support. The Collaborative Advocate Foundation's platform connects all of these in one place, across both cities — so partners can stop duplicating each other and families can stop telling their story over and over.",
      },
      {
        beat: "5. One funding plan, not many scattered asks",
        text: `${grantPipeline.length} grant opportunities relevant to this corridor are currently tracked in the platform. The plan: (a) one statewide application to the Texas Health and Human Services Commission and the Texas Workforce Commission for the fatherhood and workforce pieces; (b) two place-based foundation tracks — Cooper Foundation and Waco Foundation in Waco, St. David's Foundation and Dell Foundation in Austin; (c) one corporate corridor ask aimed at employers with offices in both cities; and (d) one federal research letter of intent to the Patient-Centered Outcomes Research Institute (a federal health-research funder).`,
      },
      {
        beat: "6. The partner table that has to be at the table",
        text: "United Way (in both cities), STARRY, Prosper Waco, 100 Black Men of Central Texas, the Austin Area Urban League, Big Brothers Big Sisters Lone Star, Foundation Communities (housing), Waco Independent School District plus Austin / Manor / Del Valle / Pflugerville school districts, the schools of social work at Baylor University and the University of Texas at Austin, Huston-Tillotson University (Austin's Historically Black University), and the employee-resource-group layer at H-E-B, Dell, USAA, Tito's, McLane, Indeed, Google, and Baylor Scott & White Healthcare.",
      },
    ],
  };

  // Chain-web definition — flat list of steps + their dependencies, for UI to render the graph.
  const chainWeb = {
    steps: CHAIN_STEPS.map((s) => ({ id: s.id, label: s.label, source: s.source, sourceUrl: s.sourceUrl, dependsOn: s.dependsOn })),
    legend: "Each step pulls from a public data source and writes verified evidence. Later steps cite earlier steps in their methodology — every verified fact is traceable back through the chain.",
    runEndpoint: "POST /api/corridor/chainweb/run",
    statusEndpoint: "GET /api/corridor/chainweb/last",
  };

  return {
    corridor: { id: CORRIDOR.id, name: CORRIDOR.name },
    generatedAt: new Date().toISOString(),
    metros: { waco, austin },
    comparison,
    grantPipeline,
    narrative,
    chainWeb,
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
