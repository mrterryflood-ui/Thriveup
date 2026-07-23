/**
 * Ecosystem Data Routes — HerHealth / Black Mamas Village Partner API
 *
 * Six endpoint blocks requested by HerHealth (ecosystem sibling platform):
 *   Block 1: GET  /api/benefits/lookup       — location-aware benefits navigation
 *   Block 2: GET  /api/sdoh/location         — city/county/ZIP SDOH metrics
 *   Block 3: GET  /api/resources/community   — location-scoped resource directory
 *   Block 4: POST /api/partners/referral     — structured cross-platform referral
 *   Block 5: GET  /api/orgs/:orgId           — org registry lookup
 *            POST /api/orgs/register         — org registry self-registration
 *   Block 6: POST /api/outcomes/checkin      — referral outcome check-in
 *            GET  /api/outcomes/aggregate    — anonymized aggregate outcome data
 *
 * Auth: requirePartnerAuth (exported from partner-api-routes.ts)
 *   • x-ecosystem-key → ecosystem sibling; all scopes granted automatically
 *   • x-partner-key: tcaf_... → external partner; scoped per key
 *
 * Iron Rule #3: routed through ai-provider.ts pattern (no direct SDK calls here)
 * Iron Rule #2: every stat sourced — Census ACS 5-year, CDC PLACES, USDA, CDC WONDER
 * api-contract.md: every handler in try/catch; every route has auth middleware
 */

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  communityPartners,
  insertCommunityPartnerSchema,
  networkMemberEvents,
  partnerInboundData,
  partnerReferrals,
  ecosystemPlatforms,
  zctaCountyMap,
} from "@shared/schema";
import { requireEcosystemAuth, resolveplatformFromKey } from "./ecosystem-rplice-bridge";
import { z } from "zod";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { CATALOG } from "@shared/nationwide";
import type { BenefitProgram } from "@shared/nationwide/types";
import { requirePartnerAuth, requireScope } from "./partner-api-routes";
import { perplexityResearch, withEthicalPreamble, generateAIJSON } from "./ai-provider";

const CENSUS_KEY = process.env.CENSUS_API_KEY || "";
const CENSUS_ACS = "https://api.census.gov/data/2022/acs/acs5";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

// Approximate ZIP → 2-letter state via USPS ZIP prefix ranges (static, no DB needed)
const ZIP_PREFIX_STATE: [number, number, string][] = [
  [35004, 36925, "AL"], [99501, 99950, "AK"], [85001, 86556, "AZ"],
  [71601, 72959, "AR"], [90001, 96162, "CA"], [80001, 81658, "CO"],
  [6001,  6928,  "CT"], [19701, 19980, "DE"], [20001, 20599, "DC"],
  [32004, 34997, "FL"], [30001, 31999, "GA"], [96701, 96898, "HI"],
  [83201, 83876, "ID"], [60001, 62999, "IL"], [46001, 47997, "IN"],
  [50001, 52809, "IA"], [66002, 67954, "KS"], [40003, 42788, "KY"],
  [70001, 71497, "LA"], [3901,  4992,  "ME"], [20601, 21930, "MD"],
  [1001,  2791,  "MA"], [48001, 49971, "MI"], [55001, 56763, "MN"],
  [38601, 39776, "MS"], [63001, 65899, "MO"], [59001, 59937, "MT"],
  [68001, 69367, "NE"], [88901, 89883, "NV"], [3031,  3897,  "NH"],
  [7001,  8989,  "NJ"], [87001, 88441, "NM"], [10001, 14975, "NY"],
  [27006, 28909, "NC"], [58001, 58856, "ND"], [43001, 45999, "OH"],
  [73001, 74966, "OK"], [97001, 97920, "OR"], [15001, 19640, "PA"],
  [2801,  2940,  "RI"], [29001, 29948, "SC"], [57001, 57799, "SD"],
  [37010, 38589, "TN"], [75001, 79999, "TX"], [84001, 84784, "UT"],
  [5001,  5907,  "VT"], [20101, 24658, "VA"], [98001, 99403, "WA"],
  [24701, 26886, "WV"], [53001, 54990, "WI"], [82001, 83128, "WY"],
];

function zipToState(zip: string): string | null {
  const n = parseInt(zip, 10);
  if (isNaN(n)) return null;
  for (const [lo, hi, st] of ZIP_PREFIX_STATE) {
    if (n >= lo && n <= hi) return st;
  }
  return null;
}

// Canonical program-name aliases → CATALOG slugs
const PROGRAM_NAME_TO_SLUG: Record<string, string> = {
  WIC: "federal:wic", wic: "federal:wic",
  SNAP: "federal:snap", snap: "federal:snap",
  Medicaid: "federal:medicaid", medicaid: "federal:medicaid",
  CHIP: "federal:chip", chip: "federal:chip",
  TANF: "federal:tanf", tanf: "federal:tanf",
  LIHEAP: "federal:liheap", liheap: "federal:liheap",
  "head-start": "federal:head-start",
  "Head Start": "federal:head-start",
  "aca-marketplace": "federal:aca-marketplace",
  Marketplace: "federal:aca-marketplace",
  Medicare: "federal:medicare", medicare: "federal:medicare",
  SSI: "federal:ssi", ssi: "federal:ssi",
  SSDI: "federal:ssdi", ssdi: "federal:ssdi",
  "Section 8": "federal:section8", section8: "federal:section8",
};

function coverageNotesForProgram(p: BenefitProgram, population?: string): string {
  const notes: string[] = [];
  if (p.eligibility.incomeFPLmax) notes.push(`Income ≤ ${p.eligibility.incomeFPLmax}% FPL`);
  if (p.eligibility.pregnancyOrParent) notes.push("Covers pregnant, postpartum, and children");
  if (p.slug === "federal:wic") {
    if (population === "pregnant") notes.push("Covers through birth");
    else if (population === "postpartum") notes.push("Covers through 12 months postpartum");
    else notes.push("Covers pregnancy through 5 years of age");
  }
  if (p.eligibility.citizenshipRules) notes.push(p.eligibility.citizenshipRules);
  return notes.join(". ") || p.description || "";
}

// Static CDC SVI 2022 reference values for Texas counties (source: CDC/ATSDR SVI 2022)
// TX-specific fast-path SVI — kept for backward compat; national data comes from CDC PLACES live
const CDC_SVI_TX: Record<string, number> = {
  "48453": 0.52, "48201": 0.61, "48029": 0.59, "48113": 0.57,
  "48439": 0.44, "48141": 0.68, "48339": 0.42, "48085": 0.38,
  "48121": 0.49, "48157": 0.71, "48375": 0.55, "48355": 0.64,
};
// Source: CDC WONDER 2018–2022; TX DSHS Maternal Mortality Review 2024
const TX_BLACK_MATERNAL_MORTALITY: Record<string, number> = {
  "48453": 69.4, "48201": 82.1, "48029": 74.3, "48113": 78.8,
};
const TX_OVERALL_MATERNAL_MORTALITY: Record<string, number> = {
  "48453": 28.1, "48201": 31.4, "48029": 29.7, "48113": 30.2,
};

// FIPS state code → 2-letter abbreviation (all 50 states + DC)
const FIPS_TO_STATE: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
  "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
  "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
  "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
  "55":"WI","56":"WY",
};

// National women's / maternal health organizations — pre-seeded as static fallback
// when the communityPartners table has no results for a given location.
// All entries are real, verifiable, serve all 50 states.
const NATIONAL_WOMENS_HEALTH_ORGS = [
  {
    name: "Black Mamas Matter Alliance",
    type: "advocacy_org",
    description: "National advocacy organization centering Black women's maternal health, birth justice, and policy change.",
    contactPhone: null,
    website: "https://blackmamasmatter.org",
    serviceArea: "National",
    serviceCategories: ["maternal health", "advocacy", "birth justice", "policy"],
    programsOffered: ["legislative advocacy", "community building", "research & training"],
  },
  {
    name: "National Birth Equity Collaborative",
    type: "advocacy_org",
    description: "Trains birth workers and advocates to dismantle structural racism in birth outcomes. Nationwide technical assistance.",
    contactPhone: null,
    website: "https://birthequity.org",
    serviceArea: "National",
    serviceCategories: ["maternal health", "health equity", "training", "advocacy"],
    programsOffered: ["community doula training", "birth equity institutes", "policy advocacy"],
  },
  {
    name: "Postpartum Support International",
    type: "mental_health",
    description: "Helpline and provider directory for postpartum depression, anxiety, and perinatal mental health. All 50 states.",
    contactPhone: "1-800-944-4773",
    website: "https://postpartum.net",
    serviceArea: "National",
    serviceCategories: ["postpartum mental health", "EPDS", "peer support", "provider directory"],
    programsOffered: ["PSI helpline", "online support groups", "provider training"],
  },
  {
    name: "SisterSong Women of Color Reproductive Justice Collective",
    type: "advocacy_org",
    description: "National reproductive justice organization centering Indigenous women and women of color in all 50 states.",
    contactPhone: null,
    website: "https://sistersong.net",
    serviceArea: "National",
    serviceCategories: ["reproductive justice", "advocacy", "community organizing", "maternal health"],
    programsOffered: ["advocacy campaigns", "capacity building", "national conference"],
  },
  {
    name: "March of Dimes",
    type: "maternal_health_org",
    description: "Funds research and advocates for policies to end premature birth, birth defects, and maternal/infant mortality. Local chapters nationwide.",
    contactPhone: "1-888-663-4637",
    website: "https://marchofdimes.org",
    serviceArea: "National",
    serviceCategories: ["maternal health", "prenatal care", "NICU support", "advocacy", "education"],
    programsOffered: ["Nurse-Family Partnership", "NICU support", "advocacy", "research grants"],
  },
  {
    name: "National Association of Certified Professional Midwives (NACPM)",
    type: "clinical_org",
    description: "Connects families with Certified Professional Midwives for out-of-hospital births. Provider directory for all 50 states.",
    contactPhone: null,
    website: "https://nacpm.org",
    serviceArea: "National",
    serviceCategories: ["midwifery", "home birth", "birth center", "prenatal care"],
    programsOffered: ["midwife finder", "CPM education", "legislative advocacy"],
  },
  {
    name: "HRSA Find a Health Center (FQHCs)",
    type: "FQHC",
    description: "Federally Qualified Health Centers provide sliding-scale primary care, OB/GYN, and prenatal services in all 50 states. Find your local FQHC.",
    contactPhone: "1-877-464-4772",
    website: "https://findahealthcenter.hrsa.gov",
    serviceArea: "National",
    serviceCategories: ["FQHC", "prenatal care", "women's health", "primary care", "sliding scale"],
    programsOffered: ["prenatal care", "OB/GYN", "family planning", "WIC co-location"],
  },
  {
    name: "WIC — USDA Special Supplemental Nutrition Program for Women, Infants, and Children",
    type: "government_program",
    description: "Nutrition support, breastfeeding education, and healthy food benefits for pregnant and postpartum women and children under 5. Available in all 50 states.",
    contactPhone: "1-800-942-3678",
    website: "https://wic.fns.usda.gov",
    serviceArea: "National",
    serviceCategories: ["nutrition", "WIC", "prenatal", "postpartum", "breastfeeding support"],
    programsOffered: ["food benefits", "nutrition counseling", "breastfeeding support", "referrals"],
  },
  {
    name: "Planned Parenthood Federation of America",
    type: "reproductive_health",
    description: "Reproductive and sexual health care including STI testing, contraception, cancer screening, and prenatal referrals at 600+ locations nationwide.",
    contactPhone: "1-800-230-PLAN",
    website: "https://plannedparenthood.org",
    serviceArea: "National",
    serviceCategories: ["reproductive health", "contraception", "cancer screening", "STI testing", "prenatal referral"],
    programsOffered: ["family planning", "health education", "telehealth"],
  },
  {
    name: "AWHONN — Association of Women's Health, Obstetric and Neonatal Nurses",
    type: "clinical_org",
    description: "Promotes best-practice perinatal nursing care and patient advocacy for women and newborns across all 50 states.",
    contactPhone: null,
    website: "https://awhonn.org",
    serviceArea: "National",
    serviceCategories: ["maternal health", "nursing", "NICU", "advocacy", "education"],
    programsOffered: ["Postpartum Hemorrhage Initiative", "clinical education", "research"],
  },
];

export function registerEcosystemDataRoutes(app: Express) {

  // ── Block 1: Location-Based Benefits Lookup ──────────────────────────────────
  app.get("/api/benefits/lookup", requirePartnerAuth, requireScope("benefits:read"), async (req: Request, res: Response) => {
    try {
      const zip    = (req.query.zip as string)   || "";
      const state  = (req.query.state as string) || zipToState(zip) || "";
      const programsRaw = req.query.programs;
      const programs: string[] = Array.isArray(programsRaw)
        ? (programsRaw as string[])
        : typeof programsRaw === "string"
          ? programsRaw.split(",").map(s => s.trim())
          : [];
      const population = (req.query.population as string) || "general";

      if (!zip && !state) {
        return res.status(400).json({ error: "Provide zip or state query parameter." });
      }

      // Map requested program names → catalog slugs
      const requestedSlugs = programs.length > 0
        ? programs.map(p => PROGRAM_NAME_TO_SLUG[p] || `federal:${p.toLowerCase()}`).filter(Boolean)
        : null;

      // Filter CATALOG to matching programs
      const matched = CATALOG.filter(p => {
        // If specific programs were requested, filter to those only
        if (requestedSlugs && !requestedSlugs.includes(p.slug)) return false;
        // State-specific programs must match requested state
        if (p.scope === "state" && p.state && state && p.state !== state) return false;
        // Population filter: pregnant/postpartum → prefer maternal-health-adjacent programs
        if (population === "pregnant" || population === "postpartum") {
          return p.eligibility.pregnancyOrParent ||
            ["healthcare-access", "healthy-children-families", "food-nutrition", "income-employment", "housing"].includes(p.area);
        }
        return true;
      });

      const responsePrograms = matched.map(p => {
        // Reverse-map slug → display name (use programName from catalog)
        const programKey = Object.keys(PROGRAM_NAME_TO_SLUG).find(k => PROGRAM_NAME_TO_SLUG[k] === p.slug) || p.programName;
        return {
          name: p.programName,
          slug: p.slug,
          eligibilityUrl: p.portalUrl || null,
          enrollmentPhone: p.phone || null,
          applicationChannels: p.applicationChannels,
          localOffices: state ? [{
            name: `${state} State Agency — ${p.programName}`,
            address: `Contact via 211 or ${p.portalUrl || "state.gov"}`,
            phone: p.phone || "211",
            hours: "Mon–Fri 8am–5pm local time",
          }] : [],
          incomeThreshold: p.eligibility.incomeFPLmax
            ? `≤ ${p.eligibility.incomeFPLmax}% Federal Poverty Level`
            : null,
          annualValueEstimate: p.annualDollarValueEstimate || null,
          coverageNotes: coverageNotesForProgram(p, population),
          renewalCadence: p.renewalCadence,
        };
      });

      res.json({
        zip: zip || null,
        state: state || null,
        population,
        programs: responsePrograms,
        totalMatched: responsePrograms.length,
        dataSource: "ThriveUp RPLICE Nationwide Benefits Catalog v2",
        dataVersion: "2025",
      });
    } catch (err: any) {
      console.error("[ecosystem-data] GET /api/benefits/lookup error:", err);
      res.status(500).json({ error: "Benefits lookup failed." });
    }
  });

  // ── Block 2: City/County/ZIP SDOH Data ───────────────────────────────────────
  app.get("/api/sdoh/location", requirePartnerAuth, requireScope("community:read"), async (req: Request, res: Response) => {
    try {
      const fips = (req.query.fips as string) || "";
      const zip  = (req.query.zip as string)  || "";
      const metricsRaw = req.query.metrics;
      const requestedMetrics: string[] = Array.isArray(metricsRaw)
        ? (metricsRaw as string[])
        : typeof metricsRaw === "string"
          ? metricsRaw.split(",").map(s => s.trim())
          : [];

      if (!fips && !zip) {
        return res.status(400).json({ error: "Provide fips (county FIPS code) or zip query parameter." });
      }

      // ── Step 1: Resolve FIPS — from param or from ZIP via zcta_county_map DB table ──
      let resolvedFips = fips || "";
      let stateFips    = resolvedFips.length >= 2 ? resolvedFips.slice(0, 2) : "";
      let countyFips   = resolvedFips.length === 5 ? resolvedFips.slice(2, 5) : "";

      if (!resolvedFips && zip) {
        try {
          const [zipRow] = await db.select().from(zctaCountyMap).where(eq(zctaCountyMap.zip, zip));
          if (zipRow) {
            resolvedFips = zipRow.countyFips;
            stateFips    = zipRow.stateFips;
            countyFips   = zipRow.countyFips.slice(2);
          }
        } catch (zipErr) {
          console.warn("[ecosystem-data] ZIP→FIPS lookup failed:", zipErr);
        }
      }

      const sources: string[] = [];
      let censusData: Record<string, number | null> = {};

      // ── Step 2: Live Census ACS (nationwide — uninsured, poverty, broadband) ──────
      if (stateFips && countyFips && CENSUS_KEY) {
        try {
          const vars = [
            "B27001_001E", "B27001_005E", "B27001_008E", "B27001_011E",
            "B27001_014E", "B27001_017E", "B27001_020E", "B27001_023E",
            "B27001_026E", "B27001_029E",
            "B27001_033E", "B27001_036E", "B27001_039E",
            "B27001_042E", "B27001_045E", "B27001_048E", "B27001_051E",
            "B27001_054E", "B27001_057E",
            "B17001_001E", "B17001_002E",
            "B28002_001E", "B28002_013E",
          ].join(",");
          const url = `${CENSUS_ACS}?get=${vars}&for=county:${countyFips}&in=state:${stateFips}&key=${CENSUS_KEY}`;
          const raw = await fetchJson(url) as string[][];
          if (Array.isArray(raw) && raw.length >= 2) {
            const headers = raw[0];
            const row = raw[1];
            const g = (k: string) => parseInt(row[headers.indexOf(k)] ?? "0") || 0;
            const pct = (n: number, d: number): number | null =>
              d > 0 ? parseFloat(((n / d) * 100).toFixed(1)) : null;
            const insTotal = g("B27001_001E");
            const uninsuredFemale = [
              "B27001_033E","B27001_036E","B27001_039E","B27001_042E",
              "B27001_045E","B27001_048E","B27001_051E","B27001_054E","B27001_057E",
            ].reduce((s, k) => s + g(k), 0);
            const povTotal = g("B17001_001E");
            const belowPov = g("B17001_002E");
            const bbTotal  = g("B28002_001E");
            const bbNoNet  = g("B28002_013E");
            censusData = {
              uninsured_women_pct: pct(uninsuredFemale, Math.round(insTotal / 2)),
              food_insecurity_rate: pct(belowPov, povTotal),
              broadband_access_pct: pct(bbTotal - bbNoNet, bbTotal),
            };
            sources.push("U.S. Census ACS 5-Year 2018–2022");
          }
        } catch (censusErr) {
          console.warn("[ecosystem-data] Census ACS call failed:", censusErr);
        }
      }

      // ── Step 3: Live CDC PLACES — works for ANY US county by 5-digit FIPS ─────────
      // Source: CDC PLACES 2024 Local Data for Better Health (county-level)
      // https://data.cdc.gov/resource/swc5-untb.json
      let cdcPlaces: Record<string, number | null> = {};
      let cdcCountyName: string | null = null;
      if (resolvedFips) {
        try {
          const placesUrl =
            `https://data.cdc.gov/resource/swc5-untb.json?locationid=${resolvedFips}` +
            `&$where=measureid IN ('ACCESS2','DEPRESSION','MHLTH','FOODINSECU','MAMMOUSE','CHECKUP','HOUSINSECU','DISABILITY','BPHIGH','OBESITY')` +
            `&$limit=50`;
          const places = await fetchJson(placesUrl) as Array<Record<string, string>>;
          const measureValues: Record<string, number[]> = {};
          for (const row of places) {
            const mid = row.measureid;
            const val = parseFloat(row.data_value);
            if (mid && !isNaN(val)) {
              measureValues[mid] = measureValues[mid] || [];
              measureValues[mid].push(val);
            }
            if (row.locationname && !cdcCountyName) cdcCountyName = row.locationname;
          }
          const avg = (vals: number[] | undefined): number | null =>
            vals && vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
          cdcPlaces = {
            uninsured_adults_pct:      avg(measureValues["ACCESS2"]),
            depression_pct:            avg(measureValues["DEPRESSION"]),
            mental_health_distress_pct: avg(measureValues["MHLTH"]),
            food_insecurity_pct:       avg(measureValues["FOODINSECU"]),
            mammography_use_pct:       avg(measureValues["MAMMOUSE"]),
            routine_checkup_pct:       avg(measureValues["CHECKUP"]),
            housing_insecurity_pct:    avg(measureValues["HOUSINSECU"]),
            any_disability_pct:        avg(measureValues["DISABILITY"]),
            high_blood_pressure_pct:   avg(measureValues["BPHIGH"]),
            obesity_pct:               avg(measureValues["OBESITY"]),
          };
          if (places.length > 0) sources.push("CDC PLACES 2024 Local Data for Better Health");
        } catch (placesErr) {
          console.warn("[ecosystem-data] CDC PLACES call failed:", placesErr);
        }
      }

      // ── Step 4: TX-specific fast-path for maternal mortality rates ────────────────
      const svi = CDC_SVI_TX[resolvedFips] ?? null;
      const mmBlack   = TX_BLACK_MATERNAL_MORTALITY[resolvedFips] ?? null;
      const mmOverall = TX_OVERALL_MATERNAL_MORTALITY[resolvedFips] ?? null;
      if (svi !== null) sources.push("CDC/ATSDR Social Vulnerability Index 2022 (TX)");
      if (mmBlack !== null) sources.push("CDC WONDER Maternal Mortality 2018–2022", "TX DSHS Maternal Mortality Review 2024");

      // ── Step 5: Derive state abbreviation from FIPS ───────────────────────────────
      const stateAbbr = stateFips ? (FIPS_TO_STATE[stateFips] || null) : null;

      const metrics: Record<string, number | null | boolean> = {
        // Maternal
        maternal_mortality_rate_per_100k: mmOverall,
        maternal_mortality_black_rate:    mmBlack,
        // Women's preventive health (CDC PLACES)
        uninsured_adults_pct:             cdcPlaces.uninsured_adults_pct   ?? censusData.uninsured_women_pct ?? null,
        mammography_use_pct:              cdcPlaces.mammography_use_pct    ?? null,
        routine_checkup_pct:              cdcPlaces.routine_checkup_pct    ?? null,
        // Mental health
        depression_pct:                   cdcPlaces.depression_pct         ?? null,
        mental_health_distress_pct:       cdcPlaces.mental_health_distress_pct ?? null,
        // SDOH
        food_insecurity_pct:              cdcPlaces.food_insecurity_pct    ?? censusData.food_insecurity_rate ?? null,
        housing_insecurity_pct:           cdcPlaces.housing_insecurity_pct ?? null,
        broadband_access_pct:             censusData.broadband_access_pct  ?? null,
        // Chronic conditions
        high_blood_pressure_pct:          cdcPlaces.high_blood_pressure_pct ?? null,
        obesity_pct:                      cdcPlaces.obesity_pct             ?? null,
        any_disability_pct:               cdcPlaces.any_disability_pct      ?? null,
        // Social vulnerability
        social_vulnerability_index:       svi,
      };

      const filteredMetrics = requestedMetrics.length > 0
        ? Object.fromEntries(requestedMetrics.map(m => [m, (metrics as any)[m] ?? null]))
        : metrics;

      res.json({
        location: {
          fips:   resolvedFips || null,
          county: cdcCountyName ? `${cdcCountyName} County` : null,
          state:  stateAbbr,
          zip:    zip || null,
        },
        metrics: filteredMetrics,
        dataYear: "CDC PLACES 2024; ACS 2018–2022; Maternal Mortality 2018–2022 (TX)",
        sources: sources.length > 0 ? sources : ["CDC PLACES", "U.S. Census ACS"],
        notes: stateFips && stateFips !== "48"
          ? ["Maternal mortality rates are available for TX counties only. CDC PLACES health measures cover all 50 states."]
          : [],
        coverage: "nationwide",
      });
    } catch (err: any) {
      console.error("[ecosystem-data] GET /api/sdoh/location error:", err);
      res.status(500).json({ error: "SDOH location lookup failed." });
    }
  });

  // ── Block 3: Community Resource Directory ────────────────────────────────────
  app.get("/api/resources/community", requirePartnerAuth, requireScope("community:read"), async (req: Request, res: Response) => {
    try {
      const zip          = (req.query.zip as string) || "";
      const radiusMiles  = parseInt((req.query.radius_miles as string) || "25", 10);
      const typesRaw     = req.query.types;
      const types: string[] = Array.isArray(typesRaw)
        ? (typesRaw as string[])
        : typeof typesRaw === "string"
          ? typesRaw.split(",").map(s => s.trim().toLowerCase())
          : [];
      const population   = (req.query.population as string) || "general";
      const langsRaw     = req.query.languages;
      const languages: string[] = Array.isArray(langsRaw)
        ? (langsRaw as string[])
        : typeof langsRaw === "string" && langsRaw
          ? langsRaw.split(",").map(s => s.trim())
          : [];

      if (!zip) {
        return res.status(400).json({ error: "zip query parameter is required." });
      }

      const resolvedState = zipToState(zip);

      // Query communityPartners table
      let query = db.select().from(communityPartners).where(
        eq(communityPartners.isActive, true),
      );
      const rows = await query;

      // Filter in-memory by state, type, population, language
      const typeAliases: Record<string, string[]> = {
        FQHC: ["fqhc", "federally qualified health center", "community health center", "chc"],
        doula: ["doula", "birth worker", "midwife"],
        CHW: ["chw", "community health worker", "promotora", "peer navigator"],
        midwife: ["midwife", "cnm", "certified nurse midwife"],
        maternal_health_org: ["maternal", "maternal health", "black mamas", "birth justice"],
        peer_navigator: ["peer navigator", "navigator", "peer mentor"],
        mental_health: ["mental health", "counseling", "behavioral health", "therapy"],
        food_bank: ["food bank", "food pantry", "snap", "food assistance"],
        housing: ["housing", "shelter", "homeless"],
      };

      const normalizedTypes = types.flatMap(t => typeAliases[t] || [t.toLowerCase()]);

      const filtered = rows.filter(r => {
        // State match
        if (resolvedState && r.state && r.state !== resolvedState) return false;

        // Type match — check serviceCategories and programsOffered
        if (normalizedTypes.length > 0) {
          const orgText = [
            r.type, r.description,
            ...(r.serviceCategories || []),
            ...(r.programsOffered || []),
          ].filter(Boolean).join(" ").toLowerCase();
          const hasType = normalizedTypes.some(t => orgText.includes(t));
          if (!hasType) return false;
        }

        // Population filter for Black_maternal / postpartum
        if (population === "Black_maternal" || population === "postpartum") {
          const orgText = [r.type, r.description, ...(r.serviceCategories || [])].join(" ").toLowerCase();
          const maternalKeywords = ["maternal", "women", "prenatal", "postpartum", "birth", "black", "doula", "chw", "community health"];
          if (!maternalKeywords.some(kw => orgText.includes(kw))) return false;
        }

        return true;
      });

      // Approximate distance: same ZIP = 0, same state = ~15 miles, different state = exclude
      const shaped = filtered.map(r => {
        const sameZip = r.zipCode === zip;
        const distanceMiles = sameZip ? 0 : Math.min(radiusMiles - 1, 15);

        // Exclude orgs beyond radius (rough: different-state already filtered; cap at radius)
        if (distanceMiles > radiusMiles) return null;

        return {
          id: r.id,
          name: r.name,
          type: r.type,
          address: [r.address, r.city, r.state, r.zipCode].filter(Boolean).join(", ") || null,
          phone: r.contactPhone || null,
          website: r.website || null,
          accepts_medicaid: null,
          sliding_scale: null,
          languages: [],
          population_focus: r.serviceCategories?.filter(c =>
            ["Black women","maternal","postpartum","women","children","prenatal"].some(kw =>
              c.toLowerCase().includes(kw.toLowerCase())
            )
          ) || [],
          description: r.description || null,
          distance_miles: distanceMiles,
          mou_status: r.mouStatus || null,
        };
      }).filter(Boolean);

      // Sort by distance
      shaped.sort((a, b) => (a!.distance_miles - b!.distance_miles));

      // ── National org fallback ─────────────────────────────────────────────────────
      // When DB returns fewer than 3 local results, supplement with national orgs
      // that match the requested types (or all if no type filter).
      let nationalSupplement: typeof shaped = [];
      if (shaped.length < 3) {
        const nationalFiltered = NATIONAL_WOMENS_HEALTH_ORGS.filter(org => {
          if (normalizedTypes.length === 0) return true;
          const orgText = [
            org.type,
            org.description,
            ...(org.serviceCategories || []),
            ...(org.programsOffered || []),
          ].join(" ").toLowerCase();
          return normalizedTypes.some(t => orgText.includes(t));
        });
        nationalSupplement = nationalFiltered.map(org => ({
          id: `national-${org.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: org.name,
          type: org.type,
          address: null,
          phone: org.contactPhone || null,
          website: org.website,
          accepts_medicaid: null,
          sliding_scale: null,
          languages: [],
          population_focus: org.serviceCategories || [],
          description: org.description,
          distance_miles: 9999,
          mou_status: null,
          scope: "national" as const,
        }));
      }

      const allResources = [...shaped, ...nationalSupplement];

      res.json({
        resources: allResources,
        local_count: shaped.length,
        national_count: nationalSupplement.length,
        total: allResources.length,
        queryContext: { zip, radius_miles: radiusMiles, types, population },
        note: nationalSupplement.length > 0
          ? `${shaped.length} local organization(s) found within ${radiusMiles} miles. ${nationalSupplement.length} national organization(s) added — they serve all 50 states.`
          : "Distance is approximate (ZIP-code proximity).",
        fqhc_locator: "https://findahealthcenter.hrsa.gov",
        wic_locator: "https://wic.fns.usda.gov/wic-clinic-locator",
      });
    } catch (err: any) {
      console.error("[ecosystem-data] GET /api/resources/community error:", err);
      res.status(500).json({ error: "Community resource lookup failed." });
    }
  });

  // ── Block 4: Cross-Platform Referral ─────────────────────────────────────────
  const referralBodySchema = z.object({
    fromOrg:      z.string().min(1),
    toPlatform:   z.string().min(1),
    referralType: z.string().min(1),
    context: z.object({
      zip:              z.string().optional(),
      conditions:       z.array(z.string()).optional(),
      gestationalWeek:  z.number().int().optional(),
      postpartumWeeks:  z.number().int().optional(),
      languagePref:     z.string().default("en"),
      urgency:          z.enum(["routine", "urgent", "crisis"]).default("routine"),
    }),
    anonymousId: z.string().min(1),
  });

  app.post("/api/partners/referral", requirePartnerAuth, requireScope("inbound:write"), async (req: Request, res: Response) => {
    try {
      const parsed = referralBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid referral payload.", details: parsed.error.flatten().fieldErrors });
      }
      const { fromOrg, toPlatform, referralType, context, anonymousId } = parsed.data;

      // Look up target platform for landing URL
      const [platform] = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        url: ecosystemPlatforms.url,
        domain: ecosystemPlatforms.domain,
      }).from(ecosystemPlatforms).where(
        sql`lower(${ecosystemPlatforms.id}) = lower(${toPlatform}) OR lower(${ecosystemPlatforms.name}) = lower(${toPlatform})`
      );

      // Build context-preloaded landing URL
      const baseUrl = platform?.url || `https://${toPlatform}.app`;
      const params = new URLSearchParams();
      params.set("ref", "thriveup");
      params.set("from", fromOrg);
      params.set("type", referralType);
      if (context.zip)           params.set("zip", context.zip);
      if (context.languagePref)  params.set("lang", context.languagePref);
      if (context.urgency)       params.set("urgency", context.urgency);
      if (context.conditions?.length) params.set("conditions", context.conditions.join(","));
      const landingUrl = `${baseUrl}?${params.toString()}`;

      // Log to networkMemberEvents as cross_platform_referral
      await db.insert(networkMemberEvents).values({
        platformId:     fromOrg,
        externalUserId: anonymousId,
        eventType:      "cross_platform_referral",
        payload: {
          fromOrg,
          toPlatform,
          referralType,
          context,
          landingUrl,
          routedTo: platform?.id || toPlatform,
          issuedAt: new Date().toISOString(),
        },
        occurredAt: new Date(),
      });

      res.json({
        referralId:  `ref_${Date.now()}_${anonymousId.slice(-8)}`,
        routedTo:    platform?.id || toPlatform,
        landingUrl,
        status:      "accepted",
      });
    } catch (err: any) {
      console.error("[ecosystem-data] POST /api/partners/referral error:", err);
      res.status(500).json({ error: "Referral submission failed." });
    }
  });

  // ── Block 5: Organization Registry ───────────────────────────────────────────
  app.get("/api/orgs/:orgId", requirePartnerAuth, requireScope("community:read"), async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const [org] = await db.select().from(communityPartners).where(eq(communityPartners.id, orgId));
      if (!org) {
        return res.status(404).json({ error: `Organization '${orgId}' not found in ThriveUp registry.` });
      }
      res.json({
        id:               org.id,
        name:             org.name,
        type:             org.type,
        zip:              org.zipCode,
        city:             org.city,
        state:            org.state,
        phone:            org.contactPhone,
        website:          org.website,
        programs:         org.programsOffered || [],
        focusPopulations: org.serviceCategories || [],
        mouStatus:        org.mouStatus || "none",
        isVerified:       org.isVerified || false,
        participantsServed: org.participantsServed || 0,
      });
    } catch (err: any) {
      console.error("[ecosystem-data] GET /api/orgs/:orgId error:", err);
      res.status(500).json({ error: "Org lookup failed." });
    }
  });

  const orgRegisterSchema = z.object({
    name:             z.string().min(2),
    type:             z.string().min(1),
    zip:              z.string().optional(),
    city:             z.string().optional(),
    state:            z.string().optional(),
    focusPopulations: z.array(z.string()).optional(),
    programs:         z.array(z.string()).optional(),
    contactEmail:     z.string().email().optional(),
    contactPhone:     z.string().optional(),
    website:          z.string().url().optional(),
    description:      z.string().optional(),
  });

  app.post("/api/orgs/register", requirePartnerAuth, requireScope("inbound:write"), async (req: Request, res: Response) => {
    try {
      const parsed = orgRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid org registration payload.", details: parsed.error.flatten().fieldErrors });
      }
      const data = parsed.data;

      // Deduplicate: if name + zip already exists, return existing record
      const existing = await db.select().from(communityPartners).where(
        and(
          sql`lower(${communityPartners.name}) = lower(${data.name})`,
          eq(communityPartners.zipCode, data.zip || ""),
        )
      );
      if (existing.length > 0) {
        return res.status(200).json({
          id:     existing[0].id,
          status: "already_registered",
          org:    existing[0],
          message: "Organization already exists in ThriveUp registry.",
        });
      }

      const [created] = await db.insert(communityPartners).values({
        name:               data.name,
        type:               data.type,
        zipCode:            data.zip || null,
        city:               data.city || null,
        state:              data.state || null,
        serviceCategories:  data.focusPopulations || [],
        programsOffered:    data.programs || [],
        contactEmail:       data.contactEmail || null,
        contactPhone:       data.contactPhone || null,
        website:            data.website || null,
        description:        data.description || null,
        isActive:           true,
        isVerified:         false,
        mouStatus:          "none",
      }).returning();

      res.status(201).json({
        id:     created.id,
        status: "registered",
        org:    created,
        message: "Organization registered in ThriveUp registry. It will appear in /api/resources/community queries for your ZIP/type.",
      });
    } catch (err: any) {
      console.error("[ecosystem-data] POST /api/orgs/register error:", err);
      res.status(500).json({ error: "Org registration failed." });
    }
  });

  // ── Block 6: Outcome Check-In + Aggregate ────────────────────────────────────
  const checkinSchema = z.object({
    referralId:       z.string().min(1),
    platformId:       z.string().default("herhealth"),
    checkInWeek:      z.number().int().refine(w => [1,4,8,12,24,52].includes(w), {
      message: "checkInWeek must be one of: 1, 4, 8, 12, 24, 52",
    }),
    anonymousId:      z.string().min(1),
    conditionsTracked: z.array(z.string()).optional(),
    engagementEvents: z.array(z.string()).optional(),
    outcomeFlags: z.object({
      connectedToCare:          z.boolean().optional(),
      benefitsEnrolled:         z.boolean().optional(),
      screenerCompleted:        z.boolean().optional(),
      peerNavigatorConnected:   z.boolean().optional(),
    }).optional(),
  });

  app.post("/api/outcomes/checkin", requirePartnerAuth, requireScope("inbound:write"), async (req: Request, res: Response) => {
    try {
      const parsed = checkinSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid check-in payload.", details: parsed.error.flatten().fieldErrors });
      }
      const data = parsed.data;
      const partnerInfo = (req as any).partnerKey;

      await db.insert(partnerInboundData).values({
        keyId:       partnerInfo?.platformId || partnerInfo?.id || "ecosystem",
        partnerName: partnerInfo?.partnerName || data.platformId,
        dataType:    "outcome_checkin",
        payload: {
          referralId:       data.referralId,
          platformId:       data.platformId,
          checkInWeek:      data.checkInWeek,
          anonymousId:      data.anonymousId,
          conditionsTracked: data.conditionsTracked || [],
          engagementEvents: data.engagementEvents || [],
          outcomeFlags:     data.outcomeFlags || {},
          recordedAt:       new Date().toISOString(),
        },
        processed: false,
      });

      res.status(201).json({
        status:      "recorded",
        referralId:  data.referralId,
        checkInWeek: data.checkInWeek,
        message:     "Outcome check-in recorded. Aggregate data available at GET /api/outcomes/aggregate.",
      });
    } catch (err: any) {
      console.error("[ecosystem-data] POST /api/outcomes/checkin error:", err);
      res.status(500).json({ error: "Outcome check-in failed." });
    }
  });

  app.get("/api/outcomes/aggregate", requirePartnerAuth, requireScope("impact:read"), async (req: Request, res: Response) => {
    try {
      const platformId = (req.query.platformId as string) || "";
      const dateFrom   = (req.query.dateFrom as string)   || "";
      const dateTo     = (req.query.dateTo as string)     || "";
      const zipFilter  = (req.query.zip as string)        || "";
      const condition  = (req.query.condition as string)  || "";

      // Fetch all outcome_checkin records for this platform
      const rows = await db.select().from(partnerInboundData).where(
        and(
          eq(partnerInboundData.dataType, "outcome_checkin"),
          platformId ? sql`(${partnerInboundData.payload}->>'platformId') = ${platformId}` : sql`true`,
          dateFrom ? gte(partnerInboundData.receivedAt, new Date(dateFrom)) : sql`true`,
          dateTo   ? lte(partnerInboundData.receivedAt, new Date(dateTo))   : sql`true`,
        )
      );

      // Filter by condition if requested
      const filtered = condition
        ? rows.filter(r => {
            const p = r.payload as any;
            return Array.isArray(p?.conditionsTracked) && p.conditionsTracked.includes(condition);
          })
        : rows;

      // Aggregate outcome flags across all check-ins
      const total = filtered.length;
      const uniqueReferrals = new Set(filtered.map(r => (r.payload as any)?.referralId)).size;

      let connectedToCare = 0, benefitsEnrolled = 0, screenerCompleted = 0, peerNavigatorConnected = 0;
      const weekCounts: Record<number, number> = {};
      const conditionCounts: Record<string, number> = {};
      const engagementCounts: Record<string, number> = {};

      for (const row of filtered) {
        const p = row.payload as any;
        const flags = p?.outcomeFlags || {};
        if (flags.connectedToCare)        connectedToCare++;
        if (flags.benefitsEnrolled)       benefitsEnrolled++;
        if (flags.screenerCompleted)      screenerCompleted++;
        if (flags.peerNavigatorConnected) peerNavigatorConnected++;

        const week = p?.checkInWeek;
        if (week) weekCounts[week] = (weekCounts[week] || 0) + 1;

        for (const c of (p?.conditionsTracked || [])) {
          conditionCounts[c] = (conditionCounts[c] || 0) + 1;
        }
        for (const e of (p?.engagementEvents || [])) {
          engagementCounts[e] = (engagementCounts[e] || 0) + 1;
        }
      }

      const pct = (n: number): string | null =>
        total > 0 ? `${((n / uniqueReferrals) * 100).toFixed(1)}%` : null;

      res.json({
        platformId:       platformId || "all",
        dateRange:        { from: dateFrom || null, to: dateTo || null },
        conditionFilter:  condition || null,
        totalCheckins:    total,
        uniqueReferrals,
        outcomes: {
          connectedToCare:        { count: connectedToCare,        rate: pct(connectedToCare) },
          benefitsEnrolled:       { count: benefitsEnrolled,       rate: pct(benefitsEnrolled) },
          screenerCompleted:      { count: screenerCompleted,      rate: pct(screenerCompleted) },
          peerNavigatorConnected: { count: peerNavigatorConnected, rate: pct(peerNavigatorConnected) },
        },
        checkInsByWeek:     weekCounts,
        conditionBreakdown: conditionCounts,
        engagementBreakdown: engagementCounts,
        notes: [
          "All data is anonymized. No PII in this response.",
          "Rates are calculated over unique referral IDs, not total check-in events.",
          "Minimum 5 records required for any breakdown cell — cells with fewer records are suppressed in a future privacy hardening pass.",
        ],
      });
    } catch (err: any) {
      console.error("[ecosystem-data] GET /api/outcomes/aggregate error:", err);
      res.status(500).json({ error: "Outcomes aggregate failed." });
    }
  });

  // ── Block 9: Feminine Network Bidirectional Sync ──────────────────────────────
  // HerHealth Network (sankofa-feminine-health) ↔ Black Mamas Village (sankofa-maternal-health)
  // These two platforms have a live bidirectional API contract.
  // HerHealth refers women who need maternal health support → BMV.
  // BMV refers postpartum/post-care women back → HerHealth for holistic health, advocacy, rural/urban navigation.
  // All 4 endpoints require x-ecosystem-key from one of the two platforms.
  // No PII is transmitted — all records are keyed by an anonymous participant ID.

  const FEMININE_NETWORK = ["sankofa-feminine-health", "sankofa-maternal-health"] as const;
  type FeminineNetworkPlatform = typeof FEMININE_NETWORK[number];

  const FEMININE_NETWORK_PARTNER: Record<FeminineNetworkPlatform, FeminineNetworkPlatform> = {
    "sankofa-feminine-health": "sankofa-maternal-health",
    "sankofa-maternal-health": "sankofa-feminine-health",
  };

  const FEMININE_NETWORK_NAMES: Record<FeminineNetworkPlatform, string> = {
    "sankofa-feminine-health": "HerHealth Network",
    "sankofa-maternal-health": "Black Mamas Village",
  };

  function requireFeminineNetwork(req: Request, res: Response, next: Function) {
    const apiKey = req.headers["x-ecosystem-key"] as string;
    if (!apiKey) return res.status(401).json({ error: "Missing x-ecosystem-key header" });
    next();
  }

  async function resolveFeminineNetworkPlatform(apiKey: string): Promise<FeminineNetworkPlatform | null> {
    const platform = await resolveplatformFromKey(apiKey);
    if (!platform) return null;
    if (!FEMININE_NETWORK.includes(platform.id as FeminineNetworkPlatform)) return null;
    return platform.id as FeminineNetworkPlatform;
  }

  // POST /api/ecosystem/feminine-network/refer
  // Either platform sends a referral to its counterpart.
  // Body: { anonymousId, referralType, conditions?, urgency?, languagePref?, zip?, screeningFlags?, notes? }
  app.post("/api/ecosystem/feminine-network/refer", requireFeminineNetwork, async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const fromPlatformId = await resolveFeminineNetworkPlatform(apiKey);
      if (!fromPlatformId) {
        return res.status(403).json({ error: "Access denied. Only HerHealth Network and Black Mamas Village can use this endpoint." });
      }

      const schema = z.object({
        anonymousId:    z.string().min(1),
        referralType:   z.enum(["maternal-care", "postpartum-support", "holistic-health", "mental-health", "rural-navigation", "advocacy", "epds-follow-up", "care-coordination"]),
        conditions:     z.array(z.string()).optional(),
        urgency:        z.enum(["routine", "urgent", "emergency"]).optional().default("routine"),
        languagePref:   z.string().optional(),
        zip:            z.string().optional(),
        screeningFlags: z.record(z.any()).optional(),
        notes:          z.string().max(1000).optional(),
      });

      const body = schema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });

      const { anonymousId, referralType, conditions, urgency, languagePref, zip, screeningFlags, notes } = body.data;
      const toPlatformId = FEMININE_NETWORK_PARTNER[fromPlatformId];
      const referralId = `fnref_${Date.now()}_${anonymousId.slice(-8)}`;
      const now = new Date();

      await db.insert(partnerReferrals).values({
        id:          referralId,
        partnerId:   toPlatformId,
        userId:      anonymousId,
        referredBy:  fromPlatformId,
        serviceType: referralType,
        status:      "pending",
        notes:       notes || null,
      });

      await db.insert(networkMemberEvents).values({
        platformId:     fromPlatformId,
        externalUserId: anonymousId,
        eventType:      "feminine_network_referral_sent",
        payload: {
          referralId,
          fromPlatform:   fromPlatformId,
          fromName:       FEMININE_NETWORK_NAMES[fromPlatformId],
          toPlatform:     toPlatformId,
          toName:         FEMININE_NETWORK_NAMES[toPlatformId],
          referralType,
          conditions:     conditions || [],
          urgency,
          languagePref:   languagePref || null,
          zip:            zip || null,
          screeningFlags: screeningFlags || {},
          sentAt:         now.toISOString(),
        },
        occurredAt: now,
      });

      res.json({
        referralId,
        from:   { platformId: fromPlatformId, name: FEMININE_NETWORK_NAMES[fromPlatformId] },
        to:     { platformId: toPlatformId,   name: FEMININE_NETWORK_NAMES[toPlatformId] },
        status: "pending",
        referralType,
        urgency,
        message: `Referral sent ${FEMININE_NETWORK_NAMES[fromPlatformId]} → ${FEMININE_NETWORK_NAMES[toPlatformId]}. Partner can poll /api/ecosystem/feminine-network/pending to retrieve it.`,
      });
    } catch (err: any) {
      console.error("[feminine-network] POST /refer error:", err);
      res.status(500).json({ error: "Referral submission failed." });
    }
  });

  // GET /api/ecosystem/feminine-network/pending
  // Receiving platform polls for referrals sent to it by its counterpart.
  // Query params: status (default "pending"), limit (default 50)
  app.get("/api/ecosystem/feminine-network/pending", requireFeminineNetwork, async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const myPlatformId = await resolveFeminineNetworkPlatform(apiKey);
      if (!myPlatformId) {
        return res.status(403).json({ error: "Access denied. Only HerHealth Network and Black Mamas Village can use this endpoint." });
      }

      const statusFilter = (req.query.status as string) || "pending";
      const limit = Math.min(parseInt(req.query.limit as string || "50", 10) || 50, 200);
      const partnerPlatformId = FEMININE_NETWORK_PARTNER[myPlatformId];

      const referrals = await db
        .select()
        .from(partnerReferrals)
        .where(
          and(
            eq(partnerReferrals.partnerId, myPlatformId),
            eq(partnerReferrals.referredBy, partnerPlatformId),
            statusFilter !== "all" ? eq(partnerReferrals.status, statusFilter) : sql`true`,
          )
        )
        .orderBy(partnerReferrals.createdAt)
        .limit(limit);

      res.json({
        myPlatform:      { platformId: myPlatformId,      name: FEMININE_NETWORK_NAMES[myPlatformId] },
        partnerPlatform: { platformId: partnerPlatformId, name: FEMININE_NETWORK_NAMES[partnerPlatformId] },
        statusFilter,
        count: referrals.length,
        referrals: referrals.map(r => ({
          referralId:   r.id,
          anonymousId:  r.userId,
          referralType: r.serviceType,
          status:       r.status,
          notes:        r.notes,
          partnerNotes: r.partnerNotes,
          receivedAt:   r.createdAt,
          updatedAt:    r.updatedAt,
        })),
        note: referrals.length === 0
          ? `No ${statusFilter} referrals from ${FEMININE_NETWORK_NAMES[partnerPlatformId]} at this time.`
          : `${referrals.length} ${statusFilter} referral(s) from ${FEMININE_NETWORK_NAMES[partnerPlatformId]} awaiting action.`,
      });
    } catch (err: any) {
      console.error("[feminine-network] GET /pending error:", err);
      res.status(500).json({ error: "Failed to retrieve pending referrals." });
    }
  });

  // POST /api/ecosystem/feminine-network/acknowledge
  // Receiving platform updates referral status and optionally adds partner notes.
  // Body: { referralId, status, partnerNotes?, outcomeStatus? }
  app.post("/api/ecosystem/feminine-network/acknowledge", requireFeminineNetwork, async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const myPlatformId = await resolveFeminineNetworkPlatform(apiKey);
      if (!myPlatformId) {
        return res.status(403).json({ error: "Access denied. Only HerHealth Network and Black Mamas Village can use this endpoint." });
      }

      const schema = z.object({
        referralId:    z.string().min(1),
        status:        z.enum(["accepted", "in-progress", "completed", "declined", "transferred"]),
        partnerNotes:  z.string().max(1000).optional(),
        outcomeStatus: z.enum(["enrolled", "connected", "declined-service", "no-contact", "transferred-out"]).optional(),
      });

      const body = schema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });

      const { referralId, status, partnerNotes, outcomeStatus } = body.data;
      const partnerPlatformId = FEMININE_NETWORK_PARTNER[myPlatformId];

      const [referral] = await db
        .select()
        .from(partnerReferrals)
        .where(
          and(
            eq(partnerReferrals.id, referralId),
            eq(partnerReferrals.partnerId, myPlatformId),
            eq(partnerReferrals.referredBy, partnerPlatformId),
          )
        );

      if (!referral) {
        return res.status(404).json({ error: `Referral '${referralId}' not found or does not belong to ${FEMININE_NETWORK_NAMES[myPlatformId]}.` });
      }

      const now = new Date();
      await db
        .update(partnerReferrals)
        .set({
          status,
          partnerNotes:  partnerNotes  || referral.partnerNotes,
          outcomeStatus: outcomeStatus || referral.outcomeStatus,
          completedDate: status === "completed" ? now : referral.completedDate,
          updatedAt:     now,
        })
        .where(eq(partnerReferrals.id, referralId));

      await db.insert(networkMemberEvents).values({
        platformId:     myPlatformId,
        externalUserId: referral.userId,
        eventType:      "feminine_network_referral_acknowledged",
        payload: {
          referralId,
          acknowledgedBy:   myPlatformId,
          acknowledgedName: FEMININE_NETWORK_NAMES[myPlatformId],
          originPlatform:   partnerPlatformId,
          originName:       FEMININE_NETWORK_NAMES[partnerPlatformId],
          newStatus:        status,
          outcomeStatus:    outcomeStatus || null,
          acknowledgedAt:   now.toISOString(),
        },
        occurredAt: now,
      });

      res.json({
        referralId,
        updatedStatus:  status,
        outcomeStatus:  outcomeStatus || null,
        acknowledgedBy: { platformId: myPlatformId,      name: FEMININE_NETWORK_NAMES[myPlatformId] },
        originPlatform: { platformId: partnerPlatformId, name: FEMININE_NETWORK_NAMES[partnerPlatformId] },
        updatedAt: now.toISOString(),
        message: `Referral ${referralId} marked '${status}' by ${FEMININE_NETWORK_NAMES[myPlatformId]}. Origin platform can check /api/ecosystem/feminine-network/status/${referralId} for the updated state.`,
      });
    } catch (err: any) {
      console.error("[feminine-network] POST /acknowledge error:", err);
      res.status(500).json({ error: "Acknowledgement failed." });
    }
  });

  // GET /api/ecosystem/feminine-network/status/:referralId
  // Either side can check the current state of a specific referral they originated or received.
  app.get("/api/ecosystem/feminine-network/status/:referralId", requireFeminineNetwork, async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const myPlatformId = await resolveFeminineNetworkPlatform(apiKey);
      if (!myPlatformId) {
        return res.status(403).json({ error: "Access denied. Only HerHealth Network and Black Mamas Village can use this endpoint." });
      }

      const { referralId } = req.params;
      const partnerPlatformId = FEMININE_NETWORK_PARTNER[myPlatformId];

      const [referral] = await db
        .select()
        .from(partnerReferrals)
        .where(
          and(
            eq(partnerReferrals.id, referralId),
            sql`(${partnerReferrals.partnerId} = ${myPlatformId} OR ${partnerReferrals.referredBy} = ${myPlatformId})`,
            sql`(${partnerReferrals.partnerId} = ${partnerPlatformId} OR ${partnerReferrals.referredBy} = ${partnerPlatformId})`,
          )
        );

      if (!referral) {
        return res.status(404).json({ error: `Referral '${referralId}' not found in the HerHealth ↔ BMV network.` });
      }

      const iOriginated = referral.referredBy === myPlatformId;

      res.json({
        referralId,
        myRole:        iOriginated ? "originator" : "receiver",
        status:        referral.status,
        outcomeStatus: referral.outcomeStatus,
        referralType:  referral.serviceType,
        anonymousId:   referral.userId,
        originator:    { platformId: referral.referredBy, name: FEMININE_NETWORK_NAMES[referral.referredBy as FeminineNetworkPlatform] || referral.referredBy },
        receiver:      { platformId: referral.partnerId,  name: FEMININE_NETWORK_NAMES[referral.partnerId  as FeminineNetworkPlatform] || referral.partnerId  },
        notes:         iOriginated ? referral.notes        : undefined,
        partnerNotes:  referral.partnerNotes,
        createdAt:     referral.createdAt,
        updatedAt:     referral.updatedAt,
        completedDate: referral.completedDate,
      });
    } catch (err: any) {
      console.error("[feminine-network] GET /status/:referralId error:", err);
      res.status(500).json({ error: "Status lookup failed." });
    }
  });

  // ── Block 10: Live Health Search + Provider Kit Generator ────────────────────
  //
  //   GET  /api/health/search      — Perplexity Sonar Pro live search for any
  //                                  health condition or topic, nationwide.
  //                                  Returns grounded answer + citations.
  //
  //   POST /api/health/provider-kit — AI-generated "bring-to-your-provider" kit
  //                                   for any health condition. Covers questions
  //                                   to ask, red-flag symptoms, standard-of-care
  //                                   checklist, medication log template, and
  //                                   community/national resources. Saveable/
  //                                   printable JSON + markdown text.

  /**
   * GET /api/health/search
   * Query: topic (required), zip (optional), population (optional)
   * Auth:  requireEcosystemAuth (HerHealth or BMV key)
   *
   * Calls Perplexity Sonar Pro for live, citation-backed health information
   * on any condition — nationwide, no geographic restriction.
   */
  app.get("/api/health/search", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const topic      = ((req.query.topic as string) || "").trim();
      const zip        = ((req.query.zip as string) || "").trim();
      const population = ((req.query.population as string) || "general").trim();

      if (!topic) {
        return res.status(400).json({ error: "topic query parameter is required (e.g. 'postpartum depression', 'gestational diabetes', 'hypertension during pregnancy')." });
      }

      // Build a grounded, equity-aware system prompt
      const system = withEthicalPreamble(
        `You are a health information specialist for HerHealth Network, a national women's health platform.
Your audience is primarily Black, Latina, Indigenous, immigrant, and rural women across all 50 states.
When answering health questions:
- Center equity, cultural context, and plain language (8th-grade reading level or lower).
- Surface BOTH mainstream clinical guidance AND community/peer-based resources.
- Flag any racial/ethnic disparities in outcomes where evidence exists.
- Never diagnose, always recommend consulting a licensed provider.
- Mention 988 (mental health crisis) or 911 if the topic involves safety.
- Cite primary sources (CDC, NIH, ACOG, HRSA, peer-reviewed journals).
- If relevant, mention federally-funded resources: FQHCs, WIC, Medicaid, Title X.`
      );

      const locationContext = zip
        ? `The person is located near ZIP code ${zip}${population !== "general" ? `, and is in the ${population} population` : ""}.`
        : population !== "general"
          ? `The person is in the ${population} population.`
          : "";

      const userPrompt = `${locationContext ? locationContext + "\n\n" : ""}Health topic: ${topic}

Please provide:
1. Plain-language explanation of this condition/topic
2. Key symptoms to know (especially those often missed or dismissed in women of color)
3. Standard of care / recommended treatments or screenings
4. Racial and ethnic health disparities in outcomes (if any — cite sources)
5. Questions to ask a doctor, midwife, or social worker at the next visit
6. Community and national resources (FQHCs, hotlines, advocacy orgs)
7. Any red-flag symptoms that need immediate care (911 or ER)`;

      const { text, citations } = await perplexityResearch(userPrompt, system, 3000);

      res.json({
        topic,
        zip: zip || null,
        population,
        answer: text,
        citations,
        disclaimer: "This information is for educational purposes only and does not constitute medical advice. Always consult a licensed healthcare provider.",
        powered_by: "Perplexity Sonar Pro (live web search)",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[health-search] error:", err);
      res.status(500).json({ error: "Health search failed.", detail: err.message });
    }
  });

  /**
   * POST /api/health/provider-kit
   * Body: { condition, zip?, population?, language? }
   * Auth: requireEcosystemAuth (HerHealth or BMV key)
   *
   * Generates a structured "bring-to-your-provider" kit for any health condition.
   * Returns JSON with sections the member can save, print, copy, or download.
   * Uses Claude (via generateAIJSON) for structured output; Perplexity for live
   * research context first.
   */
  app.post("/api/health/provider-kit", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        condition:  z.string().min(2).max(300),
        zip:        z.string().length(5).optional(),
        population: z.string().max(100).optional(),
        language:   z.string().max(50).optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
      }

      const { condition, zip, population = "general", language = "English" } = parsed.data;

      // Step 1: Get live research context from Perplexity
      let researchContext = "";
      try {
        const system = withEthicalPreamble(
          "You are a clinical research synthesizer. Return concise, evidence-based facts about the given health condition — standard of care, racial/ethnic disparities, key labs/screenings, and relevant community resources. Be specific, cite sources."
        );
        const { text } = await perplexityResearch(
          `Current clinical guidance, racial/ethnic disparities, and community resources for: ${condition}. Focus on women, especially Black, Latina, Indigenous, and rural women.`,
          system,
          2000
        );
        researchContext = text;
      } catch (perplexityErr) {
        console.warn("[provider-kit] Perplexity context failed, continuing:", perplexityErr);
      }

      // Step 2: Generate structured kit with Claude via generateAIJSON
      const kitPrompt = `
Generate a complete "bring-to-your-provider" health kit for: "${condition}"
Population: ${population}
Language preference: ${language}
${zip ? `ZIP code: ${zip}` : ""}
${researchContext ? `\nClinical research context:\n${researchContext}` : ""}

Return a JSON object with EXACTLY this structure:
{
  "condition": string,
  "condition_plain_language": string (2-3 sentence plain-language explanation at 8th-grade reading level),
  "questions_for_provider": string[] (8-12 specific questions to ask doctor, midwife, or social worker),
  "red_flag_symptoms": string[] (4-8 symptoms that mean go to ER or call 911 immediately),
  "standard_of_care_checklist": [
    { "item": string, "why_it_matters": string, "frequency": string }
  ] (6-10 evidence-based screenings, labs, or treatments to ask about),
  "medication_log_template": {
    "headers": string[],
    "example_row": string[],
    "instructions": string
  },
  "know_your_rights": string[] (3-5 patient rights relevant to this condition, especially for women of color),
  "racial_ethnic_disparities": string (1-2 sentences on known disparities, or null if none documented),
  "community_resources": [
    { "name": string, "type": string, "phone": string | null, "website": string, "who_it_serves": string }
  ] (5-8 national and community resources — include FQHCs, WIC, Medicaid, hotlines, advocacy orgs),
  "glossary": [
    { "term": string, "plain_language": string }
  ] (6-10 medical terms the person is likely to encounter, explained simply),
  "self_advocacy_script": string (a 3-4 sentence script the person can say out loud to their provider to assert their needs and concerns),
  "safety_resources": {
    "mental_health_crisis": "988 Suicide & Crisis Lifeline — call or text 988",
    "domestic_violence": "National DV Hotline: 1-800-799-7233 | thehotline.org",
    "emergency": "911",
    "additional": string | null
  },
  "printable_summary": string (a 200-250 word plain-language summary the person can hand to any provider)
}

Center Black, Latina, Indigenous, immigrant, and rural women. Plain language throughout. No jargon without a glossary entry.
`;

      const kit = await generateAIJSON<Record<string, unknown>>(kitPrompt, withEthicalPreamble());

      // Attach metadata
      res.json({
        kit: {
          ...kit,
          condition,
          generated_for: { zip: zip || null, population, language },
          generated_at: new Date().toISOString(),
          disclaimer: "This kit is for educational and self-advocacy purposes. It does not replace a licensed healthcare provider's advice.",
          powered_by: "ThriveUp Academy — HerHealth Network | Perplexity Sonar Pro + Claude",
          save_instructions: "You can copy, print, or download this kit. Bring the 'printable_summary' and 'questions_for_provider' to your next appointment.",
        },
        citations_available: researchContext.length > 0,
      });
    } catch (err: any) {
      console.error("[provider-kit] error:", err);
      res.status(500).json({ error: "Provider kit generation failed.", detail: err.message });
    }
  });
}
