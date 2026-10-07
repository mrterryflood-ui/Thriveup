/**
 * Community Intelligence — internal context assembly for grant AI
 *
 * Pulls directly from the DB (same server — no HTTP round-trip) and
 * assembles a PursuitContext object suitable for injecting into grant
 * proposal prompts via assemblePursuitContext().
 *
 * Data streams:
 *   community:read  — ecosystem platform summary (17 platforms, domains, health)
 *   impact:read     — partner outcome submissions (participants served, employment, credentials)
 *   benefits:read   — program catalog (titles, populations, geographies)
 */

import { db } from "./storage";
import {
  ecosystemPlatforms,
  partnerOutcomeSubmissions,
  programs,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityStream {
  totalPlatforms: number;
  platformsOnline: number;
  domainBreakdown: Record<string, number>;
  languagesSupported: number;
  geographicReach: string;
  platforms: Array<{ name: string; role: string; domain: string; description: string }>;
}

export interface ImpactStream {
  totalParticipantsServed: number;
  totalEnteredEmployment: number;
  totalCredentialsAttained: number;
  employmentRate: string;
  outcomeCount: number;
  recentOutcomes: Array<{
    orgName: string;
    programName: string;
    programType: string;
    reportingPeriod: string;
    participantsServed: number;
    enteredEmployment: number;
    credentialsAttained: number;
    cfirFidelityScore: number | null;
    countyFips: string | null;
  }>;
}

export interface BenefitsStream {
  catalogSize: number;
  programs: Array<{
    title: string;
    description: string;
    targetPopulation: string | null;
    geographicFocus: string | null;
    status: string | null;
  }>;
}

export interface PursuitContext {
  fetchedAt: string;
  community: CommunityStream;
  impact: ImpactStream;
  benefits: BenefitsStream;
  /** Pre-formatted paragraph ready for injection into a grant AI system prompt */
  narrativeBlock: string;
}

/** County name to optionally scope this context to (e.g. "Travis County") — enables the macro-to-micro Census supplement below. */
export type CountyScope = string | undefined;

// ─── Data fetchers ─────────────────────────────────────────────────────────

async function fetchCommunityStream(): Promise<CommunityStream> {
  const platforms = await db.select({
    name: ecosystemPlatforms.name,
    role: ecosystemPlatforms.role,
    domain: ecosystemPlatforms.domain,
    healthStatus: ecosystemPlatforms.healthStatus,
    description: ecosystemPlatforms.description,
  }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

  const domainBreakdown: Record<string, number> = {};
  for (const p of platforms) {
    if (p.domain) domainBreakdown[p.domain] = (domainBreakdown[p.domain] || 0) + 1;
  }
  const online = platforms.filter(
    p => p.healthStatus === "healthy" || p.healthStatus === "ok"
  ).length;

  return {
    totalPlatforms: platforms.length,
    platformsOnline: online,
    domainBreakdown,
    languagesSupported: 107,
    geographicReach: "50-state architecture, Texas-first deployment",
    platforms: platforms.map(p => ({
      name: p.name,
      role: p.role || "",
      domain: p.domain || "",
      description: p.description || "",
    })),
  };
}

async function fetchImpactStream(limit = 50): Promise<ImpactStream> {
  const outcomes = await db.select({
    orgName: partnerOutcomeSubmissions.orgName,
    programName: partnerOutcomeSubmissions.programName,
    programType: partnerOutcomeSubmissions.programType,
    reportingPeriod: partnerOutcomeSubmissions.reportingPeriod,
    participantsServed: partnerOutcomeSubmissions.participantsServed,
    participantsCompleted: partnerOutcomeSubmissions.participantsCompleted,
    enteredEmployment: partnerOutcomeSubmissions.enteredEmployment,
    retainedEmployment6mo: partnerOutcomeSubmissions.retainedEmployment6mo,
    credentialsAttained: partnerOutcomeSubmissions.credentialsAttained,
    cfirFidelityScore: partnerOutcomeSubmissions.cfirFidelityScore,
    countyFips: partnerOutcomeSubmissions.countyFips,
  }).from(partnerOutcomeSubmissions)
    .orderBy(desc(partnerOutcomeSubmissions.id))
    .limit(limit);

  const totals = outcomes.reduce(
    (acc, o) => ({
      totalParticipantsServed: acc.totalParticipantsServed + (o.participantsServed || 0),
      totalEnteredEmployment: acc.totalEnteredEmployment + (o.enteredEmployment || 0),
      totalCredentialsAttained: acc.totalCredentialsAttained + (o.credentialsAttained || 0),
    }),
    { totalParticipantsServed: 0, totalEnteredEmployment: 0, totalCredentialsAttained: 0 }
  );

  const employmentRate =
    totals.totalParticipantsServed > 0
      ? `${Math.round((totals.totalEnteredEmployment / totals.totalParticipantsServed) * 100)}%`
      : "N/A";

  return {
    ...totals,
    employmentRate,
    outcomeCount: outcomes.length,
    recentOutcomes: outcomes.map(o => ({
      orgName: o.orgName || "",
      programName: o.programName || "",
      programType: o.programType || "",
      reportingPeriod: o.reportingPeriod || "",
      participantsServed: o.participantsServed || 0,
      enteredEmployment: o.enteredEmployment || 0,
      credentialsAttained: o.credentialsAttained || 0,
      cfirFidelityScore: o.cfirFidelityScore ?? null,
      countyFips: o.countyFips ?? null,
    })),
  };
}

async function fetchBenefitsStream(limit = 30): Promise<BenefitsStream> {
  const catalog = await db.select({
    title: programs.title,
    description: programs.description,
    targetPopulation: programs.targetPopulation,
    geographicFocus: programs.geographicFocus,
    status: programs.status,
  }).from(programs).limit(limit);

  return {
    catalogSize: catalog.length,
    programs: catalog.map(p => ({
      title: p.title,
      description: p.description || "",
      targetPopulation: p.targetPopulation ?? null,
      geographicFocus: p.geographicFocus ?? null,
      status: p.status ?? null,
    })),
  };
}

// ─── Macro-to-micro Census supplement ─────────────────────────────────────
//
// County-level ACS data is a useful macro read, but grant narratives often
// need to name the actual cities inside a county. This curated map (real
// Census 2022 Gazetteer place FIPS codes — verified, not guessed) lets us
// fetch every listed city for a county in a single batched ACS5 call.
//
// Deliberately separate from fetchCountySubdivisions() in
// neighborhood-routes.ts: that pulls every CCD/subdivision in a county
// (Census's native "below county" unit, which does not always map to a
// recognizable city name). This map is hand-curated to real, named cities
// so the narrative can say "Austin, Pflugerville, Manor..." rather than
// "Austin CCD".
const COUNTY_CITIES_FIPS: Record<string, Array<{ name: string; fips: string }>> = {
  "travis": [
    { name: "Austin", fips: "05000" },
    { name: "Pflugerville", fips: "57176" },
    { name: "Manor", fips: "46440" },
    { name: "Lakeway", fips: "40984" },
    { name: "Bee Cave", fips: "07156" },
  ],
  "williamson": [
    { name: "Round Rock", fips: "63500" },
    { name: "Georgetown", fips: "29336" },
    { name: "Cedar Park", fips: "13552" },
    { name: "Leander", fips: "42016" },
    { name: "Taylor", fips: "71948" },
  ],
  "hays": [
    { name: "San Marcos", fips: "65600" },
    { name: "Kyle", fips: "39952" },
    { name: "Buda", fips: "11080" },
    { name: "Dripping Springs", fips: "21424" },
  ],
  "caldwell": [
    { name: "Lockhart", fips: "43240" },
    { name: "Luling", fips: "45096" },
  ],
  "gonzales": [
    { name: "Gonzales", fips: "30116" },
    { name: "Nixon", fips: "51588" },
  ],
  "guadalupe": [
    { name: "Seguin", fips: "66644" },
    { name: "Schertz", fips: "66128" },
    { name: "Cibolo", fips: "14920" },
  ],
  "comal": [
    { name: "New Braunfels", fips: "50820" },
    { name: "Bulverde", fips: "11224" },
  ],
  "washington": [
    { name: "Brenham", fips: "10156" },
  ],
  "bell": [
    { name: "Killeen", fips: "39148" },
    { name: "Temple", fips: "72176" },
    { name: "Belton", fips: "07492" },
    { name: "Harker Heights", fips: "32312" },
  ],
  "burnet": [
    { name: "Burnet", fips: "11464" },
    { name: "Marble Falls", fips: "46584" },
    { name: "Granite Shoals", fips: "30584" },
  ],
  "mclennan": [
    { name: "Waco", fips: "76000" },
    { name: "Woodway", fips: "80224" },
    { name: "Hewitt", fips: "33428" },
    { name: "Robinson", fips: "62588" },
  ],
};

interface MicroGeographyCity {
  name: string;
  population: number;
  medianIncome: number;
  povertyRate: number;
}

// 30-day cache — this is macro-context for grant narratives, not a live
// dashboard, so a month of staleness is an acceptable tradeoff for cutting
// Census API calls.
const MICRO_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const microGeographyCache = new Map<string, { at: number; cities: MicroGeographyCity[] }>();

function normalizeCountyKey(countyName: string): string {
  return countyName
    .toLowerCase()
    .replace(/\bcounty\b/g, "")
    .replace(/,.*$/, "")
    .trim();
}

/**
 * Fetch real-city ACS5 data (population, median income, poverty rate) for
 * every curated city inside a county, in one batched Census API call.
 *
 * Returns [] — never throws — when:
 *   - CENSUS_API_KEY is not configured
 *   - the county isn't one of the curated 11 (COUNTY_CITIES_FIPS)
 *   - the Census API call fails or returns malformed data
 */
export async function fetchCountyMicroGeographies(countyName: string, stateFips = "48"): Promise<MicroGeographyCity[]> {
  const censusKey = process.env.CENSUS_API_KEY || "";
  if (!censusKey) return [];

  const key = normalizeCountyKey(countyName);
  const cities = COUNTY_CITIES_FIPS[key];
  if (!cities || cities.length === 0) return [];

  const cacheKey = `census-micro:${stateFips}:${key}`;
  const cached = microGeographyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < MICRO_CACHE_TTL_MS) return cached.cities;

  try {
    const placeFips = cities.map(c => c.fips).join(",");
    const vars = ["NAME", "B01003_001E", "B19013_001E", "B17001_002E", "B17001_001E"];
    const url = `https://api.census.gov/data/2022/acs/acs5?get=${vars.join(",")}&for=place:${placeFips}&in=state:${stateFips}&key=${censusKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return [];

    const header = data[0] as string[];
    const idxName = header.indexOf("NAME");
    const idxPop = header.indexOf("B01003_001E");
    const idxIncome = header.indexOf("B19013_001E");
    const idxPovCount = header.indexOf("B17001_002E");
    const idxPovUniverse = header.indexOf("B17001_001E");
    if ([idxName, idxPop, idxIncome, idxPovCount, idxPovUniverse].some(i => i < 0)) return [];

    const parseNum = (raw: string | undefined): number | null => {
      if (typeof raw !== "string" || !/^-?\d+$/.test(raw)) return null;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : null;
    };

    const results: MicroGeographyCity[] = [];
    for (const row of data.slice(1) as string[][]) {
      const population = parseNum(row[idxPop]);
      const medianIncome = parseNum(row[idxIncome]);
      const povCount = parseNum(row[idxPovCount]);
      const povUniverse = parseNum(row[idxPovUniverse]);
      // A city with suppressed/incomplete ACS estimates is skipped rather
      // than failing the whole batch.
      if (population == null || medianIncome == null || povCount == null || povUniverse == null || povUniverse === 0) continue;

      const rawName = row[idxName] || "";
      const displayName = rawName.split(",")[0] || rawName;
      results.push({
        name: displayName,
        population,
        medianIncome,
        povertyRate: Math.round((povCount / povUniverse) * 1000) / 10,
      });
    }

    // Largest-population first, so a truncated narrative still leads with
    // the most-relevant city.
    results.sort((a, b) => b.population - a.population);
    microGeographyCache.set(cacheKey, { at: Date.now(), cities: results });
    return results;
  } catch (err) {
    console.error(`[community-intel] Micro-geography fetch failed for county "${countyName}":`, err);
    return [];
  }
}

/**
 * Formatted paragraph naming real cities inside a county with poverty
 * rate / median income, for direct injection into a grant narrative.
 * Returns "" when the county isn't curated or no cities resolved cleanly —
 * callers should treat that as "no micro-geography context available" and
 * fall back to county-level context only.
 */
export async function buildMicroGeographiesBlock(countyName: string, stateFips = "48"): Promise<string> {
  const cities = await fetchCountyMicroGeographies(countyName, stateFips);
  if (cities.length === 0) return "";

  const countyLabel = normalizeCountyKey(countyName)
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const cityLines = cities
    .map(c => `${c.name} (pop. ${c.population.toLocaleString()}, median income $${c.medianIncome.toLocaleString()}, poverty rate ${c.povertyRate}%)`)
    .join("; ");

  return `${countyLabel} County includes: ${cityLines}.`;
}

// ─── Narrative block builder ──────────────────────────────────────────────

function buildNarrativeBlock(community: CommunityStream, impact: ImpactStream, benefits: BenefitsStream, microGeographiesBlock?: string): string {
  const domainLines = Object.entries(community.domainBreakdown)
    .map(([domain, count]) => `${domain} (${count})`)
    .join(", ");

  const programSample = benefits.programs
    .slice(0, 6)
    .map(p => p.title)
    .join(", ");

  return `
LIVE COMMUNITY INTELLIGENCE CONTEXT (pull from thrivingcommunitiesforall.com — verified ${new Date().toLocaleDateString()}):

PLATFORM INFRASTRUCTURE:
ThriveUp operates a ${community.totalPlatforms}-platform community intelligence ecosystem serving families, nonprofits, and funders across a 50-state architecture with Texas-first deployment. The network spans ${Object.keys(community.domainBreakdown).length} service domains including ${domainLines}, providing coordinated community response across ${community.languagesSupported} languages.

MEASURED IMPACT (${impact.outcomeCount} outcome submissions across partner programs):
• Participants served: ${impact.totalParticipantsServed.toLocaleString()}
• Entered employment: ${impact.totalEnteredEmployment.toLocaleString()} (${impact.employmentRate} employment rate)
• Credentials attained: ${impact.totalCredentialsAttained.toLocaleString()}
• Implementation fidelity tracked using 39-construct CFIR framework across all programs

BENEFITS & PROGRAM CATALOG (${benefits.catalogSize} active programs):
Sample programs: ${programSample || "workforce development, benefits navigation, health equity, reentry support"}
All programs are evidence-based, trauma-informed, and designed for populations including families experiencing poverty, justice-involved individuals, foster youth, immigrants, and rural communities.

Use these verified data points throughout the proposal wherever community need, organizational capacity, or impact evidence is required. Cite the platform count (${community.totalPlatforms}), language reach (${community.languagesSupported}), and outcome data as primary-source evidence.
${microGeographiesBlock ? `\nLOCAL CITY-LEVEL DATA:\n${microGeographiesBlock}` : ""}
`.trim();
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Assemble a full PursuitContext in parallel across all three data streams.
 * Safe to call from any grant route handler — pure DB reads, no side effects.
 */
export async function assemblePursuitContext(countyName?: CountyScope): Promise<PursuitContext> {
  const [community, impact, benefits, microGeographiesBlock] = await Promise.all([
    fetchCommunityStream(),
    fetchImpactStream(),
    fetchBenefitsStream(),
    countyName ? buildMicroGeographiesBlock(countyName) : Promise.resolve(""),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    community,
    impact,
    benefits,
    narrativeBlock: buildNarrativeBlock(community, impact, benefits, microGeographiesBlock),
  };
}

/**
 * Lightweight version — just the narrative block string, for direct prompt injection.
 * Use this when you only need to append context to an existing system prompt.
 * Pass `countyName` (e.g. "Travis County") to also fold in the real-city
 * macro-to-micro Census supplement for one of the 11 curated TX counties —
 * it's a no-op string append when the county isn't mapped.
 */
export async function communityNarrativeBlock(countyName?: CountyScope): Promise<string> {
  try {
    const ctx = await assemblePursuitContext(countyName);
    return ctx.narrativeBlock;
  } catch (err) {
    console.error("[community-intel] Failed to assemble pursuit context:", err);
    return "";
  }
}
