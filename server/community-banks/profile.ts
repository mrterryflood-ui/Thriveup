/**
 * Community Bank Impact profile composer.
 *
 * Integration-only: composes EXISTING resolvers and data organs into one
 * place-scoped payload. No new datasets, no AI calls, no scoring.
 * Every indicator carries source/vintage/coverage; a missing source renders an
 * explicit "unavailable" item instead of a silent zero.
 */
import { desc, eq, and } from "drizzle-orm";
import { db } from "../storage";
import { hudPitCounts, ecosystemPlatforms, gisContextData } from "@shared/schema";
import { resolveZipBestEffort } from "../geo/zip-county-resolver";
import { fetchCountyAcs } from "../equity-loss/acs-county-source";
import { getChildcareIntelByFips } from "../childcare-provider-intel";
import { getStateName } from "../gis-engine";

export interface BankGeography {
  label: string;
  state: string;
  stateName: string;
  counties: { fips: string; name: string }[];
  resolvedFrom: "default-msa" | "zip" | "county-fips" | "city";
}

export type Coverage = "observed" | "modeled" | "unavailable";

export interface Indicator {
  id: string;
  label: string;
  value: number | null;
  unit: "count" | "usd" | "percent" | "ratio";
  source: string;
  vintage: string;
  coverage: Coverage;
  scope: "county" | "msa" | "state";
  note?: string;
  href: string;
}

export interface EcosystemNode {
  id: string;
  name: string;
  url: string;
  role: string;
  healthStatus: string | null;
  lastHealthCheck: string | null;
}

export interface BankProfile {
  geography: BankGeography;
  indicators: Indicator[];
  ecosystem: EcosystemNode[];
  limits: string[];
  generatedAt: string;
}

// Central Texas default assessment area (Austin–Round Rock MSA core counties).
export const AUSTIN_MSA: BankGeography = {
  label: "Austin MSA (Travis, Williamson, Hays, Bastrop, Caldwell)",
  state: "TX",
  stateName: "Texas",
  resolvedFrom: "default-msa",
  counties: [
    { fips: "48453", name: "Travis County" },
    { fips: "48491", name: "Williamson County" },
    { fips: "48209", name: "Hays County" },
    { fips: "48021", name: "Bastrop County" },
    { fips: "48055", name: "Caldwell County" },
  ],
};

// Curated city → primary county. Any other place must use a ZIP (nationwide resolver).
const CITY_COUNTY: Record<string, { fips: string; name: string; state: string }> = {
  "austin, tx": { fips: "48453", name: "Travis County", state: "TX" },
  "round rock, tx": { fips: "48491", name: "Williamson County", state: "TX" },
  "san marcos, tx": { fips: "48209", name: "Hays County", state: "TX" },
  "houston, tx": { fips: "48201", name: "Harris County", state: "TX" },
  "dallas, tx": { fips: "48113", name: "Dallas County", state: "TX" },
  "fort worth, tx": { fips: "48439", name: "Tarrant County", state: "TX" },
  "san antonio, tx": { fips: "48029", name: "Bexar County", state: "TX" },
  "el paso, tx": { fips: "48141", name: "El Paso County", state: "TX" },
  "chicago, il": { fips: "17031", name: "Cook County", state: "IL" },
  "philadelphia, pa": { fips: "42101", name: "Philadelphia County", state: "PA" },
  "new york, ny": { fips: "36061", name: "New York County", state: "NY" },
  "los angeles, ca": { fips: "06037", name: "Los Angeles County", state: "CA" },
  "phoenix, az": { fips: "04013", name: "Maricopa County", state: "AZ" },
  "atlanta, ga": { fips: "13121", name: "Fulton County", state: "GA" },
  "detroit, mi": { fips: "26163", name: "Wayne County", state: "MI" },
  "charlotte, nc": { fips: "37119", name: "Mecklenburg County", state: "NC" },
  "raleigh, nc": { fips: "37183", name: "Wake County", state: "NC" },
  "memphis, tn": { fips: "47157", name: "Shelby County", state: "TN" },
  "new orleans, la": { fips: "22071", name: "Orleans Parish", state: "LA" },
  "denver, co": { fips: "08031", name: "Denver County", state: "CO" },
  "seattle, wa": { fips: "53033", name: "King County", state: "WA" },
  "minneapolis, mn": { fips: "27053", name: "Hennepin County", state: "MN" },
  "milwaukee, wi": { fips: "55079", name: "Milwaukee County", state: "WI" },
  "baltimore, md": { fips: "24510", name: "Baltimore city", state: "MD" },
  "cleveland, oh": { fips: "39035", name: "Cuyahoga County", state: "OH" },
  "st. louis, mo": { fips: "29510", name: "St. Louis city", state: "MO" },
};

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY",
};

async function ingestedCountyName(fips: string): Promise<string | undefined> {
  try {
    const [row] = await db.select({ name: gisContextData.locationName }).from(gisContextData).where(and(eq(gisContextData.geographyKey, fips), eq(gisContextData.geographyType, "county"))).limit(1);
    return row?.name?.split(",")[0]?.trim() || undefined;
  } catch { return undefined; }
}

function knownCountyName(fips: string): string | undefined {
  return AUSTIN_MSA.counties.find(c => c.fips === fips)?.name ?? Object.values(CITY_COUNTY).find(c => c.fips === fips)?.name;
}

export type ResolveResult = { ok: true; geography: BankGeography } | { ok: false; reason: string };

export async function resolvePlace(raw: string | undefined): Promise<ResolveResult> {
  const place = (raw ?? "").trim();
  if (!place) return { ok: true, geography: AUSTIN_MSA };
  if (place.length > 80) return { ok: false, reason: "Place query too long." };

  // Explicit county FIPS: "county:48453" / "fips:48453" (bare 5 digits are ambiguous with ZIPs).
  const explicitFips = /^(?:county|fips):?\s*(\d{5})$/i.exec(place)?.[1];
  if (explicitFips) {
    const stateAbbr = STATE_FIPS_TO_ABBR[explicitFips.slice(0, 2)];
    if (!stateAbbr) return { ok: false, reason: `County FIPS ${explicitFips} has an unknown state prefix.` };
    const name = knownCountyName(explicitFips) ?? (await ingestedCountyName(explicitFips)) ?? `County ${explicitFips}`;
    return { ok: true, geography: { label: `${name}, ${stateAbbr}`, state: stateAbbr, stateName: getStateName(stateAbbr), counties: [{ fips: explicitFips, name }], resolvedFrom: "county-fips" } };
  }

  if (/^\d{5}$/.test(place)) {
    // ZIP first; a 5-digit string that is not a ZIP falls back to county FIPS.
    const stateAbbr = STATE_FIPS_TO_ABBR[place.slice(0, 2)];
    const zip = await resolveZipBestEffort(place);
    if (zip.countyFips && zip.state) {
      const name = zip.countyName ?? knownCountyName(zip.countyFips) ?? `County ${zip.countyFips}`;
      return {
        ok: true,
        geography: {
          label: `${name}, ${zip.state} (ZIP ${place})`,
          state: zip.state,
          stateName: getStateName(zip.state),
          counties: [{ fips: zip.countyFips, name }],
          resolvedFrom: "zip",
        },
      };
    }
    if (stateAbbr) {
      return {
        ok: true,
        geography: {
          label: `County FIPS ${place}, ${stateAbbr}`,
          state: stateAbbr,
          stateName: getStateName(stateAbbr),
          counties: [{ fips: place, name: knownCountyName(place) ?? `County ${place}` }],
          resolvedFrom: "county-fips",
        },
      };
    }
    return { ok: false, reason: `ZIP ${place} could not be matched to a county.` };
  }

  const city = CITY_COUNTY[place.toLowerCase().replace(/\s+/g, " ")];
  if (city) {
    return {
      ok: true,
      geography: {
        label: `${city.name}, ${city.state}`,
        state: city.state,
        stateName: getStateName(city.state),
        counties: [{ fips: city.fips, name: city.name }],
        resolvedFrom: "city",
      },
    };
  }
  return { ok: false, reason: `"${place}" is not in the curated city list. Enter a 5-digit ZIP code for any U.S. location, or a county FIPS code as county:48453.` };
}

function weightedMedian(points: { value: number; weight: number }[]): number | null {
  const sorted = points.filter(p => Number.isFinite(p.value) && p.weight > 0).sort((a, b) => a.value - b.value);
  const total = sorted.reduce((s, p) => s + p.weight, 0);
  if (!total) return null;
  let acc = 0;
  for (const p of sorted) { acc += p.weight; if (acc >= total / 2) return Math.round(p.value); }
  return null;
}

// gis_context_data.data_year is overwritten by later PLACES/SVI refreshes (calendar year), so the
// ACS vintage is pinned to what the GIS engine ingests (ACS 5-year 2022) rather than read from the row.
const ACS_INGEST_VINTAGE = "ACS 5-year 2022";

const unavailable = (id: string, label: string, unit: Indicator["unit"], source: string, href: string, scope: Indicator["scope"], note: string): Indicator =>
  ({ id, label, value: null, unit, source, vintage: "—", coverage: "unavailable", scope, note, href });

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([p, new Promise<T>((_, rej) => { t = setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms); })]);
  } finally { if (t) clearTimeout(t); }
}

export async function buildIndicators(geo: BankGeography): Promise<{ indicators: Indicator[]; limits: string[] }> {
  const limits: string[] = [];
  const scope: Indicator["scope"] = geo.counties.length > 1 ? "msa" : "county";
  const indicators: Indicator[] = [];

  // Ingested county context (ACS-derived poverty/median income, CDC SVI when present). Read once.
  const ingested = new Map<string, typeof gisContextData.$inferSelect>();
  try {
    const rows = await Promise.all(geo.counties.map(c => db.select().from(gisContextData).where(and(eq(gisContextData.geographyKey, c.fips), eq(gisContextData.geographyType, "county"))).limit(1)));
    rows.forEach((r, i) => { if (r[0]) ingested.set(geo.counties[i].fips, r[0]); });
  } catch (error) {
    limits.push("Ingested county context could not be read; poverty and SVI tiles withheld.");
    console.warn("[community-banks] gis_context_data read failed:", error);
  }

  // ACS county population / median household income (nationwide, Census API).
  const acs = await Promise.allSettled(geo.counties.map(c => withTimeout(fetchCountyAcs(c.fips.slice(0, 2), c.fips.slice(2)), 12000)));
  const okAcs = acs.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchCountyAcs>>> => r.status === "fulfilled").map(r => r.value);
  if (okAcs.length === geo.counties.length) {
    indicators.push({ id: "population", label: "Population", value: okAcs.reduce((s, a) => s + a.population, 0), unit: "count", source: "U.S. Census Bureau ACS 5-year", vintage: "latest ACS 5-year", coverage: "observed", scope, href: "/community-analysis" });
    const published = geo.counties.map(c => ingested.get(c.fips)?.medianIncome ?? null);
    if (published.every((m): m is number => typeof m === "number" && m > 0)) {
      const popW = okAcs.map(a => a.population);
      const value = scope === "msa" ? Math.round(published.reduce((s, m, i) => s + m * popW[i], 0) / popW.reduce((s, p) => s + p, 0)) : published[0];
      indicators.push({ id: "median-income", label: "Median household income", value, unit: "usd", source: "U.S. Census Bureau ACS 5-year (B19013)", vintage: ACS_INGEST_VINTAGE, coverage: scope === "msa" ? "modeled" : "observed", scope, note: scope === "msa" ? "Population-weighted mean of county medians; not a single published MSA median." : undefined, href: "/equity-loss" });
    } else {
    const medians = okAcs.map(a => weightedMedian(a.incomeDistribution)).filter((m): m is number => m !== null);
    if (medians.length === okAcs.length) {
      const popW = okAcs.map(a => a.population);
      const value = Math.round(medians.reduce((s, m, i) => s + m * popW[i], 0) / popW.reduce((s, p) => s + p, 0));
      indicators.push({ id: "median-income", label: "Median household income (ACS band midpoint)", value, unit: "usd", source: "U.S. Census Bureau ACS 5-year income bands", vintage: "latest ACS 5-year", coverage: "modeled", scope, note: (scope === "msa" ? "Population-weighted across counties. " : "") + "Midpoint of the ACS income band containing the median household; not the published exact median.", href: "/equity-loss" });
    }
    }
  } else {
    const failed = acs.filter(r => r.status === "rejected").length;
    limits.push(`Census ACS unavailable for ${failed} of ${geo.counties.length} counties; population and income tiles withheld.`);
    indicators.push(unavailable("population", "Population", "count", "U.S. Census Bureau ACS", "/community-analysis", scope, "Census ACS did not respond for this area."));
  }

  // SVI / poverty from ingested GIS context (county key), if present.
  {
    const found = geo.counties.map(c => ingested.get(c.fips)).filter((f): f is NonNullable<typeof f> => Boolean(f));
    // Poverty rate (ACS B17001 below-poverty / B01003 population), population-weighted across counties.
    if (found.length === geo.counties.length && found.every(f => f.povertyRate !== null && (f.totalPopulation ?? 0) > 0)) {
      const popW = found.map(f => f.totalPopulation ?? 0);
      const value = found.reduce((s, f, i) => s + (f.povertyRate ?? 0) * popW[i], 0) / popW.reduce((s, p) => s + p, 0);
      indicators.push({ id: "poverty-rate", label: "Population below the poverty line", value: Math.round(value * 10) / 10, unit: "percent", source: "U.S. Census Bureau ACS 5-year (B17001)", vintage: ACS_INGEST_VINTAGE, coverage: "observed", scope, note: scope === "msa" ? "Population-weighted across counties." : undefined, href: "/sdoh-explorer" });
    }
    if (found.length === geo.counties.length && found.every(f => f.sviPercentile !== null)) {
      const avg = found.reduce((s, f) => s + (f.sviPercentile ?? 0), 0) / found.length;
      indicators.push({ id: "svi", label: "Social Vulnerability Index (percentile)", value: Math.round(avg * (avg <= 1 ? 100 : 1)), unit: "percent", source: found[0].dataSource ?? "CDC/ATSDR SVI", vintage: String(found[0].dataYear ?? "—"), coverage: "observed", scope, note: scope === "msa" ? "Unweighted mean of county percentiles." : undefined, href: "/sdoh-explorer" });
    } else {
      indicators.push(unavailable("svi", "Social Vulnerability Index", "percent", "CDC/ATSDR SVI", "/sdoh-explorer", scope, "County-level SVI has not been ingested for this area."));
    }
  }

  // HUD PIT homelessness — state-level latest year (CoC geography does not align to counties).
  try {
    const latest = await db.select({ year: hudPitCounts.year }).from(hudPitCounts).where(eq(hudPitCounts.state, geo.state)).orderBy(desc(hudPitCounts.year)).limit(1);
    if (latest[0]) {
      const rows = await db.select().from(hudPitCounts).where(and(eq(hudPitCounts.state, geo.state), eq(hudPitCounts.year, latest[0].year)));
      const total = rows.reduce((s, r) => s + (r.overallHomeless ?? 0), 0);
      indicators.push({ id: "homeless-pit", label: `People experiencing homelessness (${geo.stateName}, PIT)`, value: total, unit: "count", source: "HUD Point-in-Time Count", vintage: String(latest[0].year), coverage: "observed", scope: "state", note: "HUD counts by Continuum of Care, reported here at state level.", href: "/community-data" });
    } else {
      indicators.push(unavailable("homeless-pit", "People experiencing homelessness (PIT)", "count", "HUD Point-in-Time Count", "/community-data", "state", "No HUD PIT rows loaded for this state."));
    }
  } catch {
    indicators.push(unavailable("homeless-pit", "People experiencing homelessness (PIT)", "count", "HUD Point-in-Time Count", "/community-data", "state", "HUD PIT lookup failed."));
  }

  // Childcare slot gap (TX = HHSC licensing; other states = Census CBP/ACS model).
  try {
    const intel = await Promise.allSettled(geo.counties.map(c => withTimeout(getChildcareIntelByFips(c.fips.slice(0, 2), c.fips, c.name), 15000)));
    const ok = intel.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getChildcareIntelByFips>>> => r.status === "fulfilled").map(r => r.value);
    const gaps = ok.map(i => i.slotGap.slotGap).filter((g): g is number => g !== null);
    if (ok.length === geo.counties.length && gaps.length === ok.length) {
      indicators.push({ id: "childcare-gap", label: "Estimated childcare slot gap (modeled demand − licensed capacity)", value: gaps.reduce((s, g) => s + g, 0), unit: "count", source: ok[0].slotGap.dataSource, vintage: geo.state === "TX" ? "HHSC CCL live + ACS" : "Census CBP 2022 / ACS", coverage: "modeled", scope, note: ok[0].slotGap.methodology, href: "/child-care" });
    } else {
      indicators.push(unavailable("childcare-gap", "Licensed childcare slot gap", "count", "HHSC CCL / Census CBP", "/child-care", scope, "Childcare supply data incomplete for this area."));
    }
  } catch {
    indicators.push(unavailable("childcare-gap", "Licensed childcare slot gap", "count", "HHSC CCL / Census CBP", "/child-care", scope, "Childcare lookup failed."));
  }

  if (geo.state !== "TX") {
    limits.push("Texas-only depth not shown: HHSC licensing detail, CEDS regional alignment, and CHW network coverage. National Census fallbacks are used where available.");
  }
  limits.push("No utilization, outcome, or return-on-investment figures are claimed. Indicators describe community conditions from public sources, not platform results.");
  return { indicators, limits };
}

export async function loadEcosystem(): Promise<EcosystemNode[]> {
  const rows = await db.select({
    id: ecosystemPlatforms.id, name: ecosystemPlatforms.name, url: ecosystemPlatforms.url, role: ecosystemPlatforms.role,
    healthStatus: ecosystemPlatforms.healthStatus, lastHealthCheck: ecosystemPlatforms.lastHealthCheck, publicVisible: ecosystemPlatforms.publicVisible,
  }).from(ecosystemPlatforms);
  return rows
    .filter(r => r.publicVisible !== false && r.url && /^https?:\/\//.test(r.url))
    .map(r => ({ id: r.id, name: r.name, url: r.url, role: r.role ?? "platform", healthStatus: r.healthStatus ?? null, lastHealthCheck: r.lastHealthCheck ? new Date(r.lastHealthCheck).toISOString() : null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const cache = new Map<string, { at: number; value: BankProfile }>();
const TTL_MS = 10 * 60 * 1000;

export async function buildBankProfile(geo: BankGeography): Promise<BankProfile> {
  const key = `${geo.resolvedFrom}|${geo.label}|${geo.counties.map(c => c.fips).join(",")}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const [{ indicators, limits }, ecosystem] = await Promise.all([buildIndicators(geo), loadEcosystem().catch(() => [] as EcosystemNode[])]);
  if (!ecosystem.length) limits.push("Ecosystem registry could not be read; platform status rail is empty.");
  const value: BankProfile = { geography: geo, indicators, ecosystem, limits, generatedAt: new Date().toISOString() };
  cache.set(key, { at: Date.now(), value });
  return value;
}
