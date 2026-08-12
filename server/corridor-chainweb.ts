/**
 * Corridor Chain Web
 * ----------------------------------------------------------------------------
 * ONE repeatable function that pulls public data in a linked sequence.
 * Each step cites the step before it, so every verified fact in the
 * synthesis has a traceable chain back to a primary source.
 *
 * Usage (single button / single route):
 *   POST /api/corridor/chainweb/run   -> runs all steps with retries
 *   GET  /api/corridor/chainweb/last  -> last run report
 *
 * Adding a new public data source = add one entry to CHAIN_STEPS.
 * ============================================================================ */
import type { Express, NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";
import { db } from "./storage";
import { CORRIDOR } from "./corridor-story";
import { upsertEvidence, getStateFips } from "./gis-engine";

// ── Auth + rate-limit for the Chainweb endpoints (paid + DB-mutating) ───────
function cwGetUserId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { claims?: { sub?: string }; id?: string } }).user;
  return u?.claims?.sub || u?.id;
}
function cwRequireSignedIn(req: Request, res: Response, next: NextFunction) {
  if (!cwGetUserId(req)) return res.status(401).json({ error: "Sign in to run Chainweb." });
  return next();
}
const cwRateBucket = new Map<string, { count: number; resetAt: number }>();
function cwRateLimit(opts: { keyPrefix: string; max: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = req.socket.remoteAddress || "0.0.0.0";
    const ipHash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
    const key = `${opts.keyPrefix}:${ipHash}`;
    const now = Date.now();
    const entry = cwRateBucket.get(key);
    if (!entry || entry.resetAt < now) {
      cwRateBucket.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (entry.count >= opts.max) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
    }
    entry.count += 1;
    return next();
  };
}

const CENSUS_ACS = "https://api.census.gov/data/2022/acs/acs5";
const CDC_PLACES = "https://data.cdc.gov/resource/swc5-untb.json";
const ATSDR_SVI = "https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/SVI2022_US_county/FeatureServer/0/query";
const FBI_CDE = "https://api.usa.gov/crime/fbi/cde/summarized/state";

/* --- local fetch with retry (self-contained so this module is portable) ---- */
async function fetchJson(url: string, retries = 3, timeoutMs = 25000): Promise<any> {
  let lastErr: any;
  for (let i = 1; i <= retries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return await r.json();
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      if (i < retries) await new Promise((res) => setTimeout(res, 600 * Math.pow(2, i - 1)));
    }
  }
  throw lastErr;
}

/* ----------------------------------------------------------------------------
 * Chain step type — each step is a named pull that cites its predecessor(s).
 * ---------------------------------------------------------------------------- */
export interface ChainStep {
  id: string;
  label: string;
  source: string;
  sourceUrl: string;
  dependsOn: string[]; // list of prior step IDs whose evidence this step cites
  run: (county: { countyFips: string; metroId: string }, ctx: ChainCtx) => Promise<ChainStepResult>;
}

export interface ChainCtx {
  censusKey: string;
  fbiKey: string;
  priorValues: Record<string, Record<string, number>>; // stepId -> countyFips -> value
}

export interface ChainStepResult {
  ok: boolean;
  evidenceWritten: number;
  values: Record<string, number>; // countyFips -> primary value (for chaining)
  error?: string;
  skipped?: string;
}

/* ----------------------------------------------------------------------------
 * The chain — ordered, each step cites its predecessors.
 *
 * Step 1: total_population (Census B01003)
 * Step 2: black_population (Census B01001B)     cites step 1
 * Step 3: black_by_age                          cites step 2
 * Step 4: black_poverty_rate (Census B17001B)   cites step 2
 * Step 5: black_family_structure (Census B11003B) cites step 2
 * Step 6: cdc_places_mental_health              cites step 1
 * Step 7: atsdr_svi                             cites step 1 + step 4
 * Step 8: fbi_crime_profile                     cites step 1
 * ---------------------------------------------------------------------------- */
export const CHAIN_STEPS: ChainStep[] = [
  /* ---------------- Step 1: total population ---------------- */
  {
    id: "census_total_population",
    label: "Total county population",
    source: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01003",
    sourceUrl: `${CENSUS_ACS}`,
    dependsOn: [],
    run: async (county, ctx) => {
      const st = county.countyFips.slice(0, 2);
      const cn = county.countyFips.slice(2);
      const url = `${CENSUS_ACS}?get=NAME,B01003_001E&for=county:${cn}&in=state:${st}${ctx.censusKey ? `&key=${ctx.censusKey}` : ""}`;
      const data = await fetchJson(url);
      const total = parseInt(data?.[1]?.[1] ?? "0") || 0;
      if (!total) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      await upsertEvidence(db, {
        geographyKey: county.countyFips,
        geographyType: "county",
        metricKey: "total_population",
        metricLabel: "Total county population (Census ACS B01003_001E)",
        value: total,
        unit: "people",
        asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01003",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Total Population",
        methodology: "CHAIN STEP 1 · Root universe. Direct Census API call for county total population.",
        verifiedBy: "chainweb:census_total_population",
      });
      return { ok: true, evidenceWritten: 1, values: { [county.countyFips]: total } };
    },
  },

  /* ---------------- Step 2: black population ---------------- */
  {
    id: "census_black_population",
    label: "Black population (total)",
    source: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01001B",
    sourceUrl: CENSUS_ACS,
    dependsOn: ["census_total_population"],
    run: async (county, ctx) => {
      const st = county.countyFips.slice(0, 2);
      const cn = county.countyFips.slice(2);
      const vars = [
        "NAME", "B01001B_001E",
        "B01001B_003E","B01001B_004E","B01001B_005E","B01001B_006E",
        "B01001B_018E","B01001B_019E","B01001B_020E","B01001B_021E",
        "B01001B_007E","B01001B_008E","B01001B_022E","B01001B_023E",
      ].join(",");
      const url = `${CENSUS_ACS}?get=${vars}&for=county:${cn}&in=state:${st}${ctx.censusKey ? `&key=${ctx.censusKey}` : ""}`;
      const data = await fetchJson(url);
      const r = data?.[1]; if (!r) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      const n = (i: number) => parseInt(r[i] ?? "0") || 0;
      const black = n(1);
      const children017 = n(2)+n(3)+n(4)+n(5)+n(6)+n(7)+n(8)+n(9);
      const youth1824 = n(10)+n(11)+n(12)+n(13);
      const totalPop = ctx.priorValues["census_total_population"]?.[county.countyFips] ?? null;
      const shareStr = totalPop ? ` (${(black / totalPop * 100).toFixed(1)}% of verified total ${totalPop.toLocaleString()})` : "";

      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_population",
        metricLabel: "Black population (Census ACS B01001B_001E)",
        value: black, unit: "people", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Sex by Age — Black or African American Alone",
        methodology: `CHAIN STEP 2 · Cites step 1 (total_population). Direct Census API call for Black alone total${shareStr}.`,
        verifiedBy: "chainweb:census_black_population",
      });
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_children_017",
        metricLabel: "Black children 0–17 (Census ACS B01001B)",
        value: children017, unit: "children", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Sex by Age — Black or African American Alone",
        methodology: "CHAIN STEP 2a · Cites step 2 (black_population). Sum of age brackets 0-17 across both sexes.",
        verifiedBy: "chainweb:census_black_population",
      });
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_youth_1824",
        metricLabel: "Black youth 18–24 (Census ACS B01001B)",
        value: youth1824, unit: "youth", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B01001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Sex by Age — Black or African American Alone",
        methodology: "CHAIN STEP 2b · Cites step 2 (black_population). Sum of age brackets 18-24 across both sexes.",
        verifiedBy: "chainweb:census_black_population",
      });
      return { ok: true, evidenceWritten: 3, values: { [county.countyFips]: black } };
    },
  },

  /* ---------------- Step 3: Black poverty (B17001B) ---------------- */
  {
    id: "census_black_poverty",
    label: "Black poverty rate",
    source: "U.S. Census Bureau ACS 5-year — Table B17001B",
    sourceUrl: CENSUS_ACS,
    dependsOn: ["census_black_population"],
    run: async (county, ctx) => {
      const st = county.countyFips.slice(0, 2);
      const cn = county.countyFips.slice(2);
      // B17001B_001E = population for whom poverty is determined (Black); B17001B_002E = below poverty
      const url = `${CENSUS_ACS}?get=B17001B_001E,B17001B_002E&for=county:${cn}&in=state:${st}${ctx.censusKey ? `&key=${ctx.censusKey}` : ""}`;
      const data = await fetchJson(url);
      const r = data?.[1]; if (!r) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      const universe = parseInt(r[0]) || 0;
      const inPoverty = parseInt(r[1]) || 0;
      if (!universe) return { ok: false, evidenceWritten: 0, values: {}, error: "universe=0" };
      const rate = +(inPoverty / universe * 100).toFixed(2);
      const blackPop = ctx.priorValues["census_black_population"]?.[county.countyFips] ?? null;
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_poverty_count",
        metricLabel: "Black population below poverty (Census ACS B17001B_002E)",
        value: inPoverty, unit: "people", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B17001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Poverty Status by Sex by Age — Black or African American Alone",
        methodology: `CHAIN STEP 3 · Cites step 2 (black_population=${blackPop?.toLocaleString() ?? "—"}). Census B17001B_002E.`,
        verifiedBy: "chainweb:census_black_poverty",
      });
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_poverty_rate",
        metricLabel: "Black poverty rate (Census ACS B17001B)",
        value: rate, unit: "%", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B17001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Poverty Status by Sex by Age — Black or African American Alone",
        methodology: `CHAIN STEP 3a · Derived: B17001B_002E (${inPoverty.toLocaleString()}) / B17001B_001E (${universe.toLocaleString()}) × 100.`,
        verifiedBy: "chainweb:census_black_poverty",
      });
      return { ok: true, evidenceWritten: 2, values: { [county.countyFips]: rate } };
    },
  },

  /* ---------------- Step 4: Black household type (B11001B) ---------------- */
  {
    id: "census_black_family",
    label: "Black family structure (single-parent households)",
    source: "U.S. Census Bureau ACS 5-year — Table B11001B",
    sourceUrl: CENSUS_ACS,
    dependsOn: ["census_black_population"],
    run: async (county, ctx) => {
      const st = county.countyFips.slice(0, 2);
      const cn = county.countyFips.slice(2);
      // B11001B: Household Type — Black alone householder
      //   001 total households, 002 family hh, 003 married-couple family,
      //   005 male householder no spouse, 006 female householder no spouse
      const vars = "B11001B_001E,B11001B_002E,B11001B_003E,B11001B_005E,B11001B_006E";
      const url = `${CENSUS_ACS}?get=${vars}&for=county:${cn}&in=state:${st}${ctx.censusKey ? `&key=${ctx.censusKey}` : ""}`;
      const data = await fetchJson(url);
      const r = data?.[1]; if (!r) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      const familyHH = parseInt(r[1]) || 0;
      const married = parseInt(r[2]) || 0;
      const singleFather = parseInt(r[3]) || 0;
      const singleMother = parseInt(r[4]) || 0;
      const singleParent = singleFather + singleMother;
      if (!familyHH) return { ok: false, evidenceWritten: 0, values: {}, error: "family_hh=0" };
      const singleParentRate = +(singleParent / familyHH * 100).toFixed(2);
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_family_single_parent_rate",
        metricLabel: "Black families — single-parent share of family households",
        value: singleParentRate, unit: "%", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B11001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Household Type — Black Alone",
        methodology: `CHAIN STEP 4 · Cites step 2 (black_population). (male-no-spouse ${singleFather} + female-no-spouse ${singleMother}) / family_hh ${familyHH} × 100. Replaces prior 55% national estimate.`,
        verifiedBy: "chainweb:census_black_family",
      });
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_single_mother_households",
        metricLabel: "Black female-householder (no spouse) households (B11001B_006E)",
        value: singleMother, unit: "households", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table B11001B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Household Type — Black Alone",
        methodology: "CHAIN STEP 4a · Direct Census B11001B_006E.",
        verifiedBy: "chainweb:census_black_family",
      });
      return { ok: true, evidenceWritten: 2, values: { [county.countyFips]: singleParentRate } };
    },
  },

  /* ---------------- Step 5: Black educational attainment (C15002B) ---------------- */
  {
    id: "census_black_education",
    label: "Black educational attainment 25+",
    source: "U.S. Census Bureau ACS 5-year — Table C15002B",
    sourceUrl: CENSUS_ACS,
    dependsOn: ["census_black_population"],
    run: async (county, ctx) => {
      const st = county.countyFips.slice(0, 2);
      const cn = county.countyFips.slice(2);
      // C15002B: Sex by Educational Attainment (Black alone), 25+
      //   001 total, 002 male total, 003 male <HS, 004 male HS, 005 male some-college/AA, 006 male BA+
      //   007 female total, 008 female <HS, 009 female HS, 010 female some-college/AA, 011 female BA+
      const vars = "C15002B_001E,C15002B_003E,C15002B_008E,C15002B_006E,C15002B_011E";
      const url = `${CENSUS_ACS}?get=${vars}&for=county:${cn}&in=state:${st}${ctx.censusKey ? `&key=${ctx.censusKey}` : ""}`;
      const data = await fetchJson(url);
      const r = data?.[1]; if (!r) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      const n = (i: number) => parseInt(r[i]) || 0;
      const total = n(0);
      const lessThanHS = n(1) + n(2);
      const bachPlus = n(3) + n(4);
      if (!total) return { ok: false, evidenceWritten: 0, values: {}, error: "universe=0" };
      const lessHsRate = +(lessThanHS / total * 100).toFixed(2);
      const baPlusRate = +(bachPlus / total * 100).toFixed(2);
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_less_than_hs_rate",
        metricLabel: "Black adults 25+ without HS diploma",
        value: lessHsRate, unit: "%", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table C15002B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Sex by Educational Attainment — Black Alone, 25+",
        methodology: `CHAIN STEP 5 · Cites step 2 (black_population). ${lessThanHS.toLocaleString()} without HS / ${total.toLocaleString()} total Black 25+.`,
        verifiedBy: "chainweb:census_black_education",
      });
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "black_bachelors_plus_rate",
        metricLabel: "Black adults 25+ with Bachelor's or higher",
        value: baPlusRate, unit: "%", asOfDate: "2022-12-31",
        sourceName: "U.S. Census Bureau ACS 5-year (2018–2022) — Table C15002B",
        sourceUrl: CENSUS_ACS,
        documentTitle: "Sex by Educational Attainment — Black Alone, 25+",
        methodology: `CHAIN STEP 5a · Protective factor. ${bachPlus.toLocaleString()} BA+ / ${total.toLocaleString()} total.`,
        verifiedBy: "chainweb:census_black_education",
      });
      return { ok: true, evidenceWritten: 2, values: { [county.countyFips]: lessHsRate } };
    },
  },

  /* ---------------- Step 6: CDC PLACES county-level mental/physical ---------------- */
  {
    id: "cdc_places_county",
    label: "CDC PLACES — mental health, depression, uninsured",
    source: "CDC PLACES: Local Data for Better Health",
    sourceUrl: CDC_PLACES,
    dependsOn: ["census_total_population"],
    run: async (county, _ctx) => {
      // Pull tract-level PLACES rows for this county, average the specific measures.
      const url = `${CDC_PLACES}?$where=locationid='${county.countyFips}'&$limit=5000`;
      const rows: any[] = await fetchJson(url);
      if (!Array.isArray(rows) || rows.length === 0) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      const measureAvg = (id: string) => {
        const matching = rows.filter((x) => x.measureid === id && x.data_value);
        if (!matching.length) return null;
        const sum = matching.reduce((a, x) => a + parseFloat(x.data_value || "0"), 0);
        return +(sum / matching.length).toFixed(2);
      };
      const mh = measureAvg("MHLTH");
      const dep = measureAvg("DEPRESSION");
      const uninsured = measureAvg("ACCESS2");
      const sleep = measureAvg("SLEEP");
      let wrote = 0;
      if (mh != null) {
        await upsertEvidence(db, {
          geographyKey: county.countyFips, geographyType: "county",
          metricKey: "frequent_mental_distress_rate",
          metricLabel: "Adults with frequent mental distress (≥14 days/mo)",
          value: mh, unit: "%", asOfDate: "2022-12-31",
          sourceName: "CDC PLACES — Local Data for Better Health",
          sourceUrl: CDC_PLACES,
          documentTitle: "Measure MHLTH (county-tract avg)",
          methodology: `CHAIN STEP 6 · Cites step 1. Average of MHLTH across ${rows.filter((x: any) => x.measureid === "MHLTH").length} tracts in county.`,
          verifiedBy: "chainweb:cdc_places_county",
        }); wrote++;
      }
      if (dep != null) {
        await upsertEvidence(db, {
          geographyKey: county.countyFips, geographyType: "county",
          metricKey: "depression_prevalence",
          metricLabel: "Adults diagnosed with depression",
          value: dep, unit: "%", asOfDate: "2022-12-31",
          sourceName: "CDC PLACES — Local Data for Better Health",
          sourceUrl: CDC_PLACES,
          documentTitle: "Measure DEPRESSION (county-tract avg)",
          methodology: "CHAIN STEP 6a · Cites step 6. Average across tracts.",
          verifiedBy: "chainweb:cdc_places_county",
        }); wrote++;
      }
      if (uninsured != null) {
        await upsertEvidence(db, {
          geographyKey: county.countyFips, geographyType: "county",
          metricKey: "uninsured_rate",
          metricLabel: "Adults 18-64 without health insurance",
          value: uninsured, unit: "%", asOfDate: "2022-12-31",
          sourceName: "CDC PLACES — Local Data for Better Health",
          sourceUrl: CDC_PLACES,
          documentTitle: "Measure ACCESS2 (county-tract avg)",
          methodology: "CHAIN STEP 6b · Cites step 6. Average across tracts.",
          verifiedBy: "chainweb:cdc_places_county",
        }); wrote++;
      }
      if (sleep != null) {
        await upsertEvidence(db, {
          geographyKey: county.countyFips, geographyType: "county",
          metricKey: "short_sleep_rate",
          metricLabel: "Adults with <7 hours sleep",
          value: sleep, unit: "%", asOfDate: "2022-12-31",
          sourceName: "CDC PLACES — Local Data for Better Health",
          sourceUrl: CDC_PLACES,
          documentTitle: "Measure SLEEP (county-tract avg)",
          methodology: "CHAIN STEP 6c · Cites step 6. Stress/health proxy.",
          verifiedBy: "chainweb:cdc_places_county",
        }); wrote++;
      }
      return { ok: wrote > 0, evidenceWritten: wrote, values: { [county.countyFips]: mh ?? 0 } };
    },
  },

  /* ---------------- Step 7: ATSDR SVI composite ---------------- */
  {
    id: "atsdr_svi_county",
    label: "CDC/ATSDR Social Vulnerability Index (county composite)",
    source: "CDC/ATSDR SVI 2022 — Overall RPL_THEMES",
    sourceUrl: ATSDR_SVI,
    dependsOn: ["census_total_population", "census_black_poverty"],
    run: async (county, _ctx) => {
      const url = `${ATSDR_SVI}?where=${encodeURIComponent(`FIPS='${county.countyFips}'`)}&outFields=FIPS,COUNTY,RPL_THEMES,EP_POV150,EP_UNEMP,EP_NOHSDP,EP_CROWD,EP_NOVEH&f=json`;
      const data = await fetchJson(url);
      const f = data?.features?.[0]?.attributes;
      if (!f || f.RPL_THEMES == null) return { ok: false, evidenceWritten: 0, values: {}, error: "no data" };
      const rpl = parseFloat(f.RPL_THEMES);
      if (isNaN(rpl)) return { ok: false, evidenceWritten: 0, values: {}, error: "bad RPL_THEMES" };
      const pct = +(rpl * 100).toFixed(1);
      await upsertEvidence(db, {
        geographyKey: county.countyFips, geographyType: "county",
        metricKey: "svi_overall_percentile",
        metricLabel: "Social Vulnerability Index — overall percentile (0=low, 100=high)",
        value: pct, unit: "percentile (0-100)", asOfDate: "2022-12-31",
        sourceName: "CDC/ATSDR SVI 2022 — Overall RPL_THEMES",
        sourceUrl: ATSDR_SVI,
        documentTitle: "SVI 2022 US Counties",
        methodology: `CHAIN STEP 7 · Cites step 1 + step 3. SVI_RPL_THEMES=${rpl.toFixed(4)} converted to percentile.`,
        verifiedBy: "chainweb:atsdr_svi_county",
      });
      return { ok: true, evidenceWritten: 1, values: { [county.countyFips]: pct } };
    },
  },

  /* ---------------- Step 8: FBI CDE — state summarized by offense ---------------- */
  {
    id: "fbi_crime_state",
    label: "FBI Crime Data Explorer — state summarized by offense",
    source: "FBI Crime Data Explorer (CDE) — summarized state endpoint",
    sourceUrl: FBI_CDE,
    dependsOn: ["census_total_population"],
    run: async (county, ctx) => {
      if (!ctx.fbiKey) {
        return { ok: false, evidenceWritten: 0, values: {}, skipped: "FBI_CRIME_API_KEY not configured" };
      }
      const stateAbbr = "TX";
      const stateName = "Texas";
      const year = "2022";
      const from = `01-${year}`;
      const to = `12-${year}`;
      // Offense IDs per FBI CDE docs
      const offenses: Array<{ id: string; metricKey: string; metricLabel: string }> = [
        { id: "violent-crime", metricKey: "crime_violent", metricLabel: "Violent crime (state total, FBI CDE)" },
        { id: "property-crime", metricKey: "crime_property", metricLabel: "Property crime (state total, FBI CDE)" },
        { id: "homicide", metricKey: "crime_homicide", metricLabel: "Homicide (state total, FBI CDE)" },
        { id: "aggravated-assault", metricKey: "crime_aggravated_assault", metricLabel: "Aggravated assault (state total, FBI CDE)" },
        { id: "robbery", metricKey: "crime_robbery", metricLabel: "Robbery (state total, FBI CDE)" },
        { id: "burglary", metricKey: "crime_burglary", metricLabel: "Burglary (state total, FBI CDE)" },
      ];
      let wrote = 0;
      let violentTotal = 0;
      for (const off of offenses) {
        try {
          const url = `${FBI_CDE}/${stateAbbr}/${off.id}?type=counts&from=${from}&to=${to}&API_KEY=${ctx.fbiKey}`;
          const data = await fetchJson(url);
          const monthly = data?.offenses?.actuals?.[`${stateName} Offenses`];
          if (!monthly || typeof monthly !== "object") continue;
          const annual = Object.values(monthly as Record<string, number>).reduce((a, v) => a + (Number(v) || 0), 0);
          if (!annual) continue;
          await upsertEvidence(db, {
            geographyKey: county.countyFips, geographyType: "county",
            metricKey: off.metricKey, metricLabel: off.metricLabel,
            value: annual, unit: `incidents (${year}, TX state total)`, asOfDate: `${year}-12-31`,
            sourceName: `FBI Crime Data Explorer — TX summarized ${off.id} (${year})`,
            sourceUrl: FBI_CDE,
            documentTitle: "FBI CDE Summarized by Offense",
            methodology: `CHAIN STEP 8 · Cites step 1 (total_population). Sum of monthly FBI CDE counts 01-${year}..12-${year} for offense=${off.id}. State-level signal — not apportioned to county.`,
            verifiedBy: "chainweb:fbi_crime_state",
          });
          wrote++;
          if (off.id === "violent-crime") violentTotal = annual;
        } catch (err) {
          // continue; one bad offense shouldn't break the whole step
        }
      }
      return { ok: wrote > 0, evidenceWritten: wrote, values: { [county.countyFips]: violentTotal } };
    },
  },
  {
    id: "ceds_alignment",
    label: "CEDS Regional Alignment (EDA Framework)",
    source: "EDA Comprehensive Economic Development Strategy",
    sourceUrl: "https://www.eda.gov/funding/programs/comprehensive-economic-development-strategies",
    dependsOn: ["census_pop", "acs_poverty"],
    run: async (county, _ctx) => {
      // Look up EDD region for this county FIPS, attach CEDS goals + EDA performance measures
      try {
        const { db } = await import("./storage");
        const { cedsRegions: regTbl, cedsGoals: goalTbl, cedsAlignments: alignTbl } = await import("@shared/schema");
        const { inArray } = await import("drizzle-orm");

        const allRegions = await db.select().from(regTbl);
        const matched = allRegions.filter(r => r.countyFips?.includes(county.countyFips));
        if (!matched.length) {
          return { ok: true, evidenceWritten: 0, values: {}, skipped: `No CEDS region found for FIPS ${county.countyFips}` };
        }

        const regionIds = matched.map(r => r.id);
        const goals = await db.select().from(goalTbl).where(inArray(goalTbl.regionId, regionIds));
        const alignments = await db.select().from(alignTbl).where(inArray(alignTbl.regionId, regionIds));

        const regionSummary = matched.map(r => ({
          edd: r.eddName,
          abbr: r.eddAbbr,
          vision: r.strategicVision,
          distressed: r.distressedDesignation,
          goals: goals.filter(g => g.regionId === r.id).map(g => g.goalTitle),
        }));

        const { upsertEvidence } = await import("./gis-engine");
        let wrote = 0;
        for (const r of matched) {
          await upsertEvidence(db, {
            geographyKey: county.countyFips,
            geographyType: "county",
            metricKey: "ceds_region",
            metricLabel: `EDD: ${r.eddName} (${r.eddAbbr})`,
            value: r.id,
            unit: "id",
            asOfDate: `${r.cedsYear ?? new Date().getFullYear()}-01-01`,
            sourceName: "EDA CEDS Registry",
            sourceUrl: r.edaUrl ?? "https://www.eda.gov",
            documentTitle: "CEDS Regional Registry",
            methodology: "EDA CEDS alignment via chainweb",
            verifiedBy: "chainweb:ceds_alignment",
          });
          wrote++;
        }
        return { ok: true, evidenceWritten: wrote, values: { [county.countyFips]: matched.length } };
      } catch (err: any) {
        return { ok: false, evidenceWritten: 0, values: {}, error: err.message };
      }
    },
  },
];

/* ----------------------------------------------------------------------------
 * Runner — executes the chain. Each step's result is available to later steps.
 * Returns a structured run report (the "chain web") that's safe to JSON.
 * ---------------------------------------------------------------------------- */
export interface ChainRunReport {
  runId: string;
  startedAt: string;
  finishedAt: string;
  counties: Array<{ countyFips: string; metroId: string }>;
  steps: Array<{
    id: string;
    label: string;
    source: string;
    sourceUrl: string;
    dependsOn: string[];
    perCounty: Record<string, { ok: boolean; evidenceWritten: number; value: number | null; error?: string; skipped?: string }>;
    totalEvidenceWritten: number;
  }>;
  totalEvidenceWritten: number;
  summary: { succeeded: number; failed: number; skipped: number };
}

let LAST_RUN: ChainRunReport | null = null;

/** Read-only accessor for the orchestration Conductor — never triggers a new run (that hits Census/FBI APIs and writes evidence). */
export function getLastChainWebRun(): ChainRunReport | null {
  return LAST_RUN;
}

export async function runChainWeb(
  counties: Array<{ countyFips: string; metroId: string }> = CORRIDOR.metros.map((m) => ({
    countyFips: m.countyFips, metroId: m.id,
  })),
): Promise<ChainRunReport> {
  const runId = `run_${Date.now()}`;
  const startedAt = new Date().toISOString();
  const ctx: ChainCtx = {
    censusKey: process.env.CENSUS_API_KEY || "",
    fbiKey: process.env.FBI_CRIME_API_KEY || "",
    priorValues: {},
  };
  const steps: ChainRunReport["steps"] = [];
  let totalEvidenceWritten = 0;
  let succeeded = 0, failed = 0, skipped = 0;

  for (const step of CHAIN_STEPS) {
    const perCounty: Record<string, { ok: boolean; evidenceWritten: number; value: number | null; error?: string; skipped?: string }> = {};
    let stepTotalEvidence = 0;
    const stepValues: Record<string, number> = {};
    for (const county of counties) {
      try {
        const r = await step.run(county, ctx);
        perCounty[county.countyFips] = {
          ok: r.ok,
          evidenceWritten: r.evidenceWritten,
          value: r.values[county.countyFips] ?? null,
          error: r.error,
          skipped: r.skipped,
        };
        stepTotalEvidence += r.evidenceWritten;
        if (r.ok && r.values[county.countyFips] != null) stepValues[county.countyFips] = r.values[county.countyFips]!;
        if (r.skipped) skipped++; else if (r.ok) succeeded++; else failed++;
      } catch (err: any) {
        perCounty[county.countyFips] = { ok: false, evidenceWritten: 0, value: null, error: String(err?.message ?? err) };
        failed++;
      }
    }
    ctx.priorValues[step.id] = stepValues;
    totalEvidenceWritten += stepTotalEvidence;
    steps.push({
      id: step.id, label: step.label, source: step.source, sourceUrl: step.sourceUrl,
      dependsOn: step.dependsOn, perCounty, totalEvidenceWritten: stepTotalEvidence,
    });
  }

  const report: ChainRunReport = {
    runId, startedAt, finishedAt: new Date().toISOString(),
    counties, steps, totalEvidenceWritten,
    summary: { succeeded, failed, skipped },
  };
  LAST_RUN = report;
  return report;
}

/* ----------------------------------------------------------------------------
 * Routes
 * ---------------------------------------------------------------------------- */
export function registerChainWebRoutes(app: Express) {
  app.post(
    "/api/corridor/chainweb/run",
    cwRequireSignedIn,
    cwRateLimit({ keyPrefix: "cw-run", max: 3, windowMs: 15 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        console.log(`[chainweb] /run triggered by uid=${cwGetUserId(req)}`);
        const report = await runChainWeb();
        res.json({ ok: true, report });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  // Chainweb-anywhere: same pipeline, arbitrary counties.
  // Body: { counties: [{ countyFips: "48491", metroId?: "wilco" }] }
  app.post(
    "/api/corridor/chainweb/run-counties",
    cwRequireSignedIn,
    cwRateLimit({ keyPrefix: "cw-run-counties", max: 6, windowMs: 15 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const raw = Array.isArray(req.body?.counties) ? req.body.counties : [];
        const counties = raw
          .map((c: unknown) => {
            const r = (c ?? {}) as Record<string, unknown>;
            const countyFips = String(r.countyFips ?? "").trim();
            // Hardened: alphanumeric + dash/underscore only, max 32 chars
            const rawMetro = String(r.metroId ?? "").trim().slice(0, 32).replace(/[^A-Za-z0-9_-]/g, "");
            const metroId = rawMetro || `cty-${countyFips}`;
            return { countyFips, metroId };
          })
          .filter((c: { countyFips: string }) => /^\d{5}$/.test(c.countyFips))
          .slice(0, 12);
        if (!counties.length) {
          return res.status(400).json({ error: "Provide counties: [{ countyFips: '48491', metroId?: 'wilco' }]" });
        }
        console.log(`[chainweb] /run-counties triggered by uid=${cwGetUserId(req)} counties=${counties.length}`);
        const report = await runChainWeb(counties);
        res.json({ ok: true, report });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  app.get("/api/corridor/chainweb/last", (_req: Request, res: Response) => {
    if (!LAST_RUN) return res.json({ ok: false, report: null, note: "No chain-web run yet." });
    res.json({ ok: true, report: LAST_RUN });
  });

  app.get("/api/corridor/chainweb/steps", (_req: Request, res: Response) => {
    res.json({
      steps: CHAIN_STEPS.map((s) => ({
        id: s.id, label: s.label, source: s.source, sourceUrl: s.sourceUrl, dependsOn: s.dependsOn,
      })),
    });
  });
}
