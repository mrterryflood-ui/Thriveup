/**
 * PlaceStoryEngine — Generalized Community Intelligence Engine
 *
 * Produces a provenance-stamped community story for any US county FIPS.
 * Generalized from the I-35 Corridor pattern in server/corridor-story.ts.
 *
 * Used by: Rural Workforce, HBCU Opportunity Network, #DATA community stories.
 * All three products call this single engine — no product assembles its own
 * community intelligence separately (that would create the siloes we are eliminating).
 *
 * Routes:
 *   GET /api/place-story/:stateFips/:countyFips
 *
 * Cache: 30-minute TTL, in-process Map
 */

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { eq, and, like } from "drizzle-orm";
import {
  gisContextData,
  neighborhoodIntelligence,
  communityEvidence,
} from "@shared/schema";
import {
  type Claim,
  type PlaceStory,
  type UncertaintyTrigger,
  makeClaim,
} from "./shared/claim-types";
import { perplexityResearch, withEthicalPreamble } from "./ai-provider";

// ── 30-minute in-process cache ────────────────────────────────────────────
interface CacheEntry {
  result: PlaceStory;
  expiresAt: number;
}
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCached(key: string): PlaceStory | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { CACHE.delete(key); return null; }
  return entry.result;
}
function setCache(key: string, result: PlaceStory): void {
  CACHE.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── County label helper ───────────────────────────────────────────────────
const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "12": "FL", "13": "GA", "15": "HI", "16": "ID",
  "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA",
  "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ",
  "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK",
  "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN",
  "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY",
};

function buildLabel(stateFips: string, countyFips: string): string {
  const stateAbbr = STATE_FIPS_TO_ABBR[stateFips] ?? stateFips;
  return `County FIPS ${countyFips}, ${stateAbbr}`;
}

// ── Lookup state code from state FIPS ─────────────────────────────────────
function stateCode(stateFips: string): string {
  return STATE_FIPS_TO_ABBR[stateFips] ?? "";
}

// ── Build claims from GIS context data ───────────────────────────────────
// gisContextData is keyed by geographyKey (ZIP or tract) and optionally stateCode.
// neighborhoodIntelligence is keyed by neighborhood name + city, not countyFips.
// communityEvidence is keyed by geographyKey which may be a county FIPS.
async function buildClaimsFromGIS(
  stateFips: string,
  countyFips: string,
): Promise<{
  economic: Claim[];
  educational: Claim[];
  health: Claim[];
  housing: Claim[];
}> {
  const economic: Claim[] = [];
  const educational: Claim[] = [];
  const health: Claim[] = [];
  const housing: Claim[] = [];

  const sc = stateCode(stateFips);

  try {
    // Query GIS context data by state code (no county-FIPS column exists)
    // geographyKey is a ZIP or tract — county FIPS is a 5-char prefix of tracts
    const gisRows = sc
      ? await db
          .select()
          .from(gisContextData)
          .where(and(
            eq(gisContextData.stateCode, sc),
            like(gisContextData.geographyKey, `${countyFips}%`),
          ))
          .limit(5)
      : [];

    // Fallback: query by county FIPS prefix on geographyKey alone if no state code
    const gisRowsFallback = gisRows.length === 0
      ? await db
          .select()
          .from(gisContextData)
          .where(like(gisContextData.geographyKey, `${countyFips}%`))
          .limit(5)
      : gisRows;

    // communityEvidence is keyed by geographyKey which may be the county FIPS directly
    const evidenceRows = await db
      .select()
      .from(communityEvidence)
      .where(eq(communityEvidence.geographyKey, countyFips))
      .limit(30);

    // Map GIS rows to claims — use actual schema columns
    for (const row of gisRowsFallback) {
      const base = {
        asOfDate: row.dataYear ? `${row.dataYear}-01-01` : null,
        geographyKey: countyFips,
        source: row.dataSource ?? "Census ACS",
        sourceId: "census-acs-5yr",
        confidence: "estimated" as const,
      };

      if (row.povertyRate != null) {
        economic.push(makeClaim({
          ...base,
          value: Number(row.povertyRate),
          unit: "%",
          source: "Census ACS 5-Year (B17001)",
          sourceId: "census-acs-5yr",
          decisionCaption: `${Number(row.povertyRate).toFixed(1)}% poverty rate. Communities above 20% face significant resource constraints for workforce and health programming.`,
        }));
      }
      if (row.unemploymentRate != null) {
        economic.push(makeClaim({
          ...base,
          value: Number(row.unemploymentRate),
          unit: "%",
          source: "Census ACS 5-Year (S2301)",
          sourceId: "census-acs-5yr",
          decisionCaption: `${Number(row.unemploymentRate).toFixed(1)}% unemployment. Use this to scope workforce pathway demand and identify WIOA eligibility for residents.`,
        }));
      }
      if (row.medianIncome != null) {
        economic.push(makeClaim({
          ...base,
          value: Number(row.medianIncome),
          unit: "USD/yr",
          source: "Census ACS 5-Year (S1901)",
          sourceId: "census-acs-5yr",
          decisionCaption: `Median household income $${Number(row.medianIncome).toLocaleString()}/yr. Use against living-wage benchmarks to identify housing and food insecurity risk.`,
        }));
      }
      if (row.sviPercentile != null) {
        health.push(makeClaim({
          ...base,
          value: Number(row.sviPercentile),
          unit: "percentile",
          source: "CDC/ATSDR SVI 2020",
          sourceId: "cdc-svi",
          asOfDate: "2020-01-01",
          confidence: "modeled" as const,
          decisionCaption: `Social Vulnerability Index: ${Number(row.sviPercentile).toFixed(2)} (higher = more vulnerable). SVI above 75th percentile indicates high vulnerability — prioritize outreach to this community.`,
        }));
      }
      if (row.educationAttainmentRate != null) {
        educational.push(makeClaim({
          ...base,
          value: Number(row.educationAttainmentRate),
          unit: "%",
          source: "Census ACS 5-Year (S1501)",
          sourceId: "census-acs-5yr",
          decisionCaption: `${Number(row.educationAttainmentRate).toFixed(1)}% high school attainment rate. Adult education and HiSET/GED programs serve residents below this threshold.`,
        }));
      }
      if (row.housingInstabilityIndex != null) {
        housing.push(makeClaim({
          ...base,
          value: Number(row.housingInstabilityIndex),
          unit: "index",
          source: "HUD CHAS / ACS composite",
          sourceId: "hud-chas-housing",
          confidence: "modeled" as const,
          decisionCaption: `Housing instability index: ${Number(row.housingInstabilityIndex).toFixed(2)}. Higher values indicate greater cost burden and eviction risk. Emergency rental assistance is the primary intervention.`,
        }));
      }
    }

    // Map community evidence rows to claims
    for (const ev of evidenceRows) {
      const isDomainKnown = ["poverty_rate", "unemployment_rate", "median_income",
        "uninsured_rate", "school_dropout_rate", "housing_cost_burden"].includes(ev.metricKey);
      if (!isDomainKnown) continue;

      const claim = makeClaim({
        value: Number(ev.value),
        unit: ev.unit ?? "",
        source: ev.sourceName,
        sourceId: "community-intelligence-submissions",
        asOfDate: ev.asOfDate ?? null,
        geographyKey: countyFips,
        confidence: (ev.confidence as "verified" | "estimated" | "modeled" | "community-reported" | "unverified") ?? "unverified",
        decisionCaption: `${ev.metricLabel}: ${ev.value}${ev.unit ?? ""}. Source: ${ev.sourceName}.`,
      });

      if (["poverty_rate", "unemployment_rate", "median_income"].includes(ev.metricKey)) {
        economic.push(claim);
      } else if (["school_dropout_rate"].includes(ev.metricKey)) {
        educational.push(claim);
      } else if (["uninsured_rate"].includes(ev.metricKey)) {
        health.push(claim);
      } else if (["housing_cost_burden"].includes(ev.metricKey)) {
        housing.push(claim);
      }
    }
  } catch (err) {
    console.error("[place-story-engine] GIS query error:", err);
  }

  return { economic, educational, health, housing };
}

// ── Perplexity fallback for missing claims ────────────────────────────────
async function fetchClaimsViaPerplexity(
  stateFips: string,
  countyFips: string,
  label: string,
): Promise<Claim[]> {
  try {
    const systemPrompt = withEthicalPreamble(
      `You are a community data research assistant. Provide specific statistics about the requested county with source citations. Return ONLY the statistics as a JSON array of objects with shape: { metric: string, value: number, unit: string, source: string, year: number }. Return at most 6 key community condition metrics. If you cannot find data for a specific metric, omit it. Never fabricate statistics.`,
    );

    const { text } = await perplexityResearch(
      `Provide key community condition statistics for county FIPS ${countyFips} (${label}). Include: poverty rate, unemployment rate, median household income, uninsured rate, high school attainment, housing cost burden. Source from Census ACS, HUD, CDC. Respond with JSON array only.`,
      systemPrompt,
      600,
    );

    // Try to parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      metric: string;
      value: number;
      unit: string;
      source: string;
      year: number;
    }>;

    return parsed.map((item) =>
      makeClaim({
        value: item.value,
        unit: item.unit,
        source: item.source || "Perplexity live search",
        sourceId: "community-intelligence-submissions",
        asOfDate: item.year ? `${item.year}-01-01` : null,
        geographyKey: countyFips,
        confidence: "unverified",
        decisionCaption: `${item.metric}: ${item.value}${item.unit}. Source: ${item.source}. This figure was retrieved via live search — verify before making program decisions.`,
      }),
    );
  } catch (err) {
    console.error("[place-story-engine] Perplexity fallback error:", err);
    return [];
  }
}

// ── Gap diagnosis from claims ─────────────────────────────────────────────
function buildGapDiagnosis(claims: Claim[]): PlaceStory["gapDiagnosis"] {
  // Find the highest-severity condition
  const poverty = claims.find(
    (c) => typeof c.value === "number" && c.source.includes("B17001") && Number(c.value) > 20,
  );
  const unemployment = claims.find(
    (c) => typeof c.value === "number" && c.source.includes("S2301") && Number(c.value) > 10,
  );
  const uninsured = claims.find(
    (c) => typeof c.value === "number" && c.source.includes("uninsur") && Number(c.value) > 15,
  );

  if (poverty) {
    return {
      primaryGap: `Poverty rate of ${poverty.value}% exceeds the 20% threshold for high-poverty community designation.`,
      cfirBarrierDomain: "Outer Setting — economic conditions",
      ericStrategyRecommendation: "Identify and prepare champions; build coalitions with anti-poverty and workforce organizations.",
    };
  }
  if (unemployment) {
    return {
      primaryGap: `Unemployment rate of ${unemployment.value}% exceeds 10%, indicating significant workforce detachment.`,
      cfirBarrierDomain: "Outer Setting — labor market conditions",
      ericStrategyRecommendation: "Conduct local consensus discussions; identify workforce board resources and WIOA eligibility.",
    };
  }
  if (uninsured) {
    return {
      primaryGap: `Uninsured rate of ${uninsured.value}% indicates significant health access barriers.`,
      cfirBarrierDomain: "Outer Setting — health system access",
      ericStrategyRecommendation: "Develop relationships with local champions; connect to HRSA-funded FQHCs and marketplace enrollment.",
    };
  }

  return {
    primaryGap: "Community conditions data is incomplete — full gap diagnosis requires additional data collection.",
    cfirBarrierDomain: "Unknown — insufficient data",
    ericStrategyRecommendation: "Conduct local needs assessment to identify primary CFIR barriers before selecting ERIC strategies.",
  };
}

// ── Main engine function ──────────────────────────────────────────────────
export async function getPlaceStory(
  stateFips: string,
  countyFips: string,
): Promise<PlaceStory> {
  const cacheKey = `${stateFips}:${countyFips}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const label = buildLabel(stateFips, countyFips);
  const uncertainties: UncertaintyTrigger[] = [];

  // Build claims from DB
  const { economic, educational, health, housing } =
    await buildClaimsFromGIS(stateFips, countyFips);

  // If DB returned no economic claims, try Perplexity
  if (economic.length === 0 && educational.length === 0) {
    const liveClaims = await fetchClaimsViaPerplexity(stateFips, countyFips, label);
    economic.push(...liveClaims);

    if (liveClaims.length === 0) {
      uncertainties.push({
        uncertaintyType: "missing-data",
        whatIsUnknown: `Community condition data (poverty, income, employment) for county FIPS ${countyFips} is not in the platform database.`,
        whyItMatters: "Gap diagnosis and CFIR barrier identification require community condition data.",
        displayedTo: "user",
        triggeredAt: "Sense",
        perplexityQuery: `community conditions poverty unemployment income ${label} county statistics 2022 2023`,
      });
    }
  }

  if (health.length === 0) {
    uncertainties.push({
      uncertaintyType: "missing-data",
      whatIsUnknown: `Health conditions data for county FIPS ${countyFips} is not yet in the platform.`,
      whyItMatters: "Health access barriers are a primary CFIR outer-setting barrier for most interventions.",
      displayedTo: "user",
      triggeredAt: "Sense",
      perplexityQuery: `health insurance uninsured rate HRSA shortage area ${label} 2022 2023`,
    });
  }

  if (housing.length === 0) {
    uncertainties.push({
      uncertaintyType: "missing-data",
      whatIsUnknown: `Housing cost burden data for county FIPS ${countyFips} is not yet in the platform.`,
      whyItMatters: "Housing instability is a significant barrier to workforce and educational participation.",
      displayedTo: "user",
      triggeredAt: "Sense",
      perplexityQuery: `housing cost burden rental affordability ${label} HUD ACS 2022`,
    });
  }

  const allClaims = [...economic, ...educational, ...health, ...housing];
  const gapDiagnosis = buildGapDiagnosis(allClaims);

  const story: PlaceStory = {
    geographyKey: countyFips,
    stateFips,
    countyFips,
    label,
    resolvedAt: new Date().toISOString(),
    economic,
    educational,
    health,
    housing,
    gapDiagnosis,
    uncertainties,
  };

  setCache(cacheKey, story);
  return story;
}

// ── Route setup ───────────────────────────────────────────────────────────
export function setupPlaceStoryRoutes(app: Express): void {
  app.get(
    "/api/place-story/:stateFips/:countyFips",
    async (req: Request, res: Response) => {
      const stateFips = String(req.params.stateFips).padStart(2, "0");
      const countyFips = String(req.params.countyFips).padStart(5, "0");

      if (!/^\d{2}$/.test(stateFips) || !/^\d{5}$/.test(countyFips)) {
        return res.status(400).json({ error: "Invalid FIPS codes" });
      }

      try {
        const story = await getPlaceStory(stateFips, countyFips);
        return res.json(story);
      } catch (err) {
        console.error("[place-story] error:", err);
        return res.status(500).json({ error: "Failed to build place story" });
      }
    },
  );
}
