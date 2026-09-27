/**
 * Equity routes — serves:
 *   Gap 6: resident equity dashboard data
 *   Gap 8: programGeography join (RPLICE → county FIPS)
 *   Gap 9: CDC PLACES healthcare metrics
 */

import { Router } from "express";
import { db } from "./storage";
import {
  programGeography,
  insertProgramGeographySchema,
  rpliceAssessments,
  rpliceActionPlans,
  cfirAssessments,
} from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { isAuthenticated as requireAuth } from "./platform/auth";

export const equityRouter = Router();

// ── Central Texas counties ────────────────────────────────────────────────────
const CENTRAL_TX_COUNTIES: Record<string, { name: string; fips: string }> = {
  "48453": { name: "Travis", fips: "48453" },
  "48491": { name: "Williamson", fips: "48491" },
  "48209": { name: "Hays", fips: "48209" },
  "48021": { name: "Bastrop", fips: "48021" },
  "48055": { name: "Caldwell", fips: "48055" },
  "48031": { name: "Blanco", fips: "48031" },
};

// ── Gap 8: Program geography ──────────────────────────────────────────────────

equityRouter.get("/program-geography", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(programGeography);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.post("/program-geography", requireAuth, async (req, res) => {
  try {
    const parsed = insertProgramGeographySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [row] = await db.insert(programGeography).values(parsed.data).returning();
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Overlay: join RPLICE assessments with their county geography
equityRouter.get("/program-geography/overlay", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        ra.id AS assessment_id,
        ra.program_name,
        ra.assessment_type,
        ra.score,
        ra.status,
        pg.county_fips,
        pg.county_name,
        pg.state_fips,
        pg.service_type
      FROM rplice_assessments ra
      LEFT JOIN program_geography pg ON pg.program_name = ra.program_name
      ORDER BY ra.created_at DESC
    `);
    res.json(rows.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Gap 9: CDC PLACES healthcare metrics ──────────────────────────────────────
// Returns county-level chronic disease and healthcare access data from CDC PLACES API.
// Central Texas counties only. Cached per request (12h TTL suggested via upstream).

const PLACES_CACHE: Record<string, { data: any; ts: number }> = {};
const PLACES_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const CDC_PLACES_URL = "https://data.cdc.gov/resource/swc5-untb.json";

async function fetchPlacesData(countyFips: string): Promise<any[] | null> {
  const now = Date.now();
  if (PLACES_CACHE[countyFips] && now - PLACES_CACHE[countyFips].ts < PLACES_TTL_MS) {
    return PLACES_CACHE[countyFips].data;
  }

  // CDC PLACES uses location_name format "Travis County, TX" or FIPS in countyfips
  const stateCode = countyFips.slice(0, 2);
  const countyCode = countyFips.slice(2);

  const url = `${CDC_PLACES_URL}?stateabbr=TX&countyfips=${countyFips}&$limit=200&$select=category,measure,data_value,low_confidence_limit,high_confidence_limit,data_value_unit,totalpopulation,geolocation`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    PLACES_CACHE[countyFips] = { data, ts: now };
    return data;
  } catch {
    return null;
  }
}

equityRouter.get("/places/:countyFips", async (req, res) => {
  const { countyFips } = req.params;
  if (!CENTRAL_TX_COUNTIES[countyFips]) {
    return res.status(400).json({ error: "County FIPS not in service area" });
  }
  const data = await fetchPlacesData(countyFips);
  if (!data) {
    return res.status(503).json({ error: "CDC PLACES data unavailable", cached: false });
  }
  res.json({ countyFips, county: CENTRAL_TX_COUNTIES[countyFips].name, measures: data });
});

// Multi-county CDC PLACES summary for equity dashboard
equityRouter.get("/places-summary", async (_req, res) => {
  const summaries: Record<string, any> = {};

  // Priority measures for equity dashboard
  const PRIORITY_MEASURES = [
    "Current lack of health insurance",
    "No leisure-time physical activity",
    "Obesity",
    "Diabetes",
    "High blood pressure",
    "Mental health not good for ≥14 days",
    "Depression",
    "Current smoking",
    "Unmet dental care need",
    "Routine checkup within past year",
    "Mammography use",
    "Colorectal cancer screening",
    "Cervical cancer screening",
    "Core preventive services for older men",
    "Core preventive services for older women",
  ];

  for (const [fips, county] of Object.entries(CENTRAL_TX_COUNTIES)) {
    const data = await fetchPlacesData(fips);
    if (!data) continue;

    const measures: Record<string, number> = {};
    for (const row of data) {
      const measure = row.measure as string;
      const val = parseFloat(row.data_value);
      if (!isNaN(val)) {
        measures[measure] = val;
      }
    }
    summaries[fips] = { county: county.name, fips, measures };
  }

  res.json(summaries);
});

// ── Gap 6: Resident equity data ───────────────────────────────────────────────
// Plain-language action-oriented data for the resident equity dashboard.
// Pulls from Census API (SNAP, Medicaid, poverty) + CDC PLACES.

const EQUITY_CACHE: { data: any; ts: number } | null = null;
let equityDataCache: { data: any; ts: number } | null = null;

const CENSUS_KEY = process.env.CENSUS_API_KEY;

interface CountyEquityData {
  countyFips: string;
  countyName: string;
  population: number;
  povertyCount: number;
  povertyRate: number;
  snapEligibleEstimate: number;
  medicaidEligibleEstimate: number;
  uninsuredCount: number;
  uninsuredRate: number;
  medianHouseholdIncome: number;
  primaryLanguageNotEnglish: number;
  actionItems: ActionItem[];
}

interface ActionItem {
  program: string;
  gapEstimate: number | null;
  gapLabel: string;
  callToAction: string;
  url: string;
  phone?: string;
}

async function fetchCensusEquityData(): Promise<CountyEquityData[]> {
  // 2022 ACS 5-Year estimates: B17001 (poverty), B19013 (income), B27010 (insurance), B16001 (language)
  const countyFipsList = Object.keys(CENTRAL_TX_COUNTIES);
  const results: CountyEquityData[] = [];

  for (const fips of countyFipsList) {
    const stateFips = fips.slice(0, 2);
    const countyCode = fips.slice(2);
    const countyName = CENTRAL_TX_COUNTIES[fips].name;

    let population = 0, povertyCount = 0, uninsuredCount = 0, medianIncome = 0, nonEnglish = 0;

    if (CENSUS_KEY) {
      try {
        const url = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B17001_002E,B27010_033E,B19013_001E,B16001_002E&for=county:${countyCode}&in=state:${stateFips}&key=${CENSUS_KEY}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (r.ok) {
          const json = await r.json();
          const row = json[1]; // header is [0]
          if (row) {
            population = parseInt(row[0]) || 0;
            povertyCount = parseInt(row[1]) || 0;
            uninsuredCount = parseInt(row[2]) || 0;
            medianIncome = parseInt(row[3]) || 0;
            nonEnglish = parseInt(row[4]) || 0;
          }
        }
      } catch {
        // Fall through to estimate-based fallback
      }
    }

    // Fallback estimates for known Central Texas counties
    if (population === 0) {
      const FALLBACKS: Record<string, { pop: number; poverty: number; income: number }> = {
        "48453": { pop: 1290000, poverty: 148000, income: 78000 }, // Travis
        "48491": { pop: 690000, poverty: 52000, income: 92000 },   // Williamson
        "48209": { pop: 260000, poverty: 26000, income: 71000 },   // Hays
        "48021": { pop: 98000, poverty: 11000, income: 58000 },    // Bastrop
        "48055": { pop: 47000, poverty: 5400, income: 54000 },     // Caldwell
        "48031": { pop: 13000, poverty: 1300, income: 61000 },     // Blanco
      };
      const fb = FALLBACKS[fips];
      if (fb) {
        population = fb.pop;
        povertyCount = fb.poverty;
        medianIncome = fb.income;
        uninsuredCount = Math.round(population * 0.13);
        nonEnglish = Math.round(population * 0.22);
      }
    }

    const povertyRate = population > 0 ? (povertyCount / population) * 100 : 0;
    const uninsuredRate = population > 0 ? (uninsuredCount / population) * 100 : 0;
    // SNAP eligible = ~130% FPL, roughly 1.5x poverty population
    const snapEligibleEstimate = Math.round(povertyCount * 1.5);
    const medicaidEligibleEstimate = Math.round(povertyCount * 1.3);

    const actionItems: ActionItem[] = [
      {
        program: "SNAP (Food Stamps)",
        gapEstimate: snapEligibleEstimate > 0 ? Math.round(snapEligibleEstimate * 0.4) : null,
        gapLabel: "families who may qualify but aren't enrolled",
        callToAction: "Apply online — takes about 20 minutes",
        url: "https://yourtexasbenefits.com",
        phone: "2-1-1",
      },
      {
        program: "Medicaid & CHIP",
        gapEstimate: medicaidEligibleEstimate > 0 ? Math.round(medicaidEligibleEstimate * 0.3) : null,
        gapLabel: "children and adults who likely qualify for free health coverage",
        callToAction: "Check eligibility and enroll today",
        url: "https://yourtexasbenefits.com",
        phone: "2-1-1",
      },
      {
        program: "Health Insurance",
        gapEstimate: uninsuredCount,
        gapLabel: "people without health insurance in your county",
        callToAction: "Free plans may be available through Healthcare.gov",
        url: "https://healthcare.gov",
        phone: "1-800-318-2596",
      },
      {
        program: "Emergency Rental Assistance",
        gapEstimate: null,
        gapLabel: "Help is available if you're behind on rent",
        callToAction: "Contact your local community action agency",
        url: "https://www.austintexas.gov/page/rental-housing-assistance",
        phone: "2-1-1",
      },
    ];

    results.push({
      countyFips: fips,
      countyName,
      population,
      povertyCount,
      povertyRate,
      snapEligibleEstimate,
      medicaidEligibleEstimate,
      uninsuredCount,
      uninsuredRate,
      medianHouseholdIncome: medianIncome,
      primaryLanguageNotEnglish: nonEnglish,
      actionItems,
    });
  }

  return results;
}

equityRouter.get("/resident-equity-data", async (_req, res) => {
  const now = Date.now();
  if (equityDataCache && now - equityDataCache.ts < PLACES_TTL_MS) {
    return res.json(equityDataCache.data);
  }
  const data = await fetchCensusEquityData();
  equityDataCache = { data, ts: now };
  res.json(data);
});
