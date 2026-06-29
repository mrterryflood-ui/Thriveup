/**
 * Community Intelligence API — partner-facing, key-authenticated
 *
 * GET /api/community/profile?state=TX&county=Burnet
 *   Full demographic + health profile for any U.S. county
 *
 * GET /api/community/opportunities?state=TX&county=Burnet
 *   Matched grant/funding opportunities from ThriveUp's discovery engine
 *
 * GET /api/community/compare?state=TX&county=Burnet
 *   County vs. state vs. national benchmarks — ready for grant narratives
 *
 * Auth: X-Api-Key: <key>  OR  Authorization: Bearer <key>
 * Rate: 60 requests / minute per IP
 */
import { Router } from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { db } from "./storage";
import { grantOpportunities } from "@shared/schema";
import { desc } from "drizzle-orm";
import { getStateFips } from "./gis-engine";

const CENSUS_ACS      = "https://api.census.gov/data/2022/acs/acs5";
const CDC_PLACES      = "https://data.cdc.gov/resource/swc5-untb.json";
const CENSUS_GEOCODER = "https://geocoding.geo.census.gov/geocoder/geographies";

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
  DC:"District of Columbia",
};

// Reverse FIPS → state abbreviation (used after Census Geocoder resolves a county)
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

// ── Fetch with retry ─────────────────────────────────────────────────────────
async function fetchJson(url: string, retries = 2): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15_000);
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return await r.json();
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (i < retries - 1) await new Promise(res => setTimeout(res, 600));
    }
  }
  throw lastErr;
}

// ── API key auth ──────────────────────────────────────────────────────────────
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.COMMUNITY_API_KEY;
  if (!expectedKey) {
    return res.status(503).json({ error: "Community API not configured on this server." });
  }
  const auth = req.headers["authorization"] as string | undefined;
  const xKey = req.headers["x-api-key"] as string | undefined;
  const provided = xKey || (auth?.startsWith("Bearer ") ? auth.slice(7) : null);
  if (!provided) {
    return res.status(401).json({
      error: "API key required.",
      hint: "Pass X-Api-Key: <key>  OR  Authorization: Bearer <key>",
    });
  }
  const exp = expectedKey.trim();
  const prov = provided.trim();
  if (exp !== prov) {
    return res.status(403).json({ error: "Invalid API key." });
  }
  next();
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
const rateBucket = new Map<string, { count: number; resetAt: number }>();
function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    const key = `capi:${ip}`;
    const now = Date.now();
    const entry = rateBucket.get(key);
    if (!entry || entry.resetAt < now) {
      rateBucket.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      return res.status(429).json({ error: "Rate limit exceeded. Max 60 requests/minute." });
    }
    entry.count++;
    next();
  };
}

// ── County FIPS resolver ──────────────────────────────────────────────────────
async function resolveCountyFips(
  stateFips: string,
  countyInput: string,
  censusKey: string,
): Promise<{ countyFips: string; countyFips3: string; resolvedName: string } | null> {
  const keyParam = censusKey ? `&key=${censusKey}` : "";
  const url = `${CENSUS_ACS}?get=NAME&for=county:*&in=state:${stateFips}${keyParam}`;
  const data = await fetchJson(url);
  if (!Array.isArray(data) || data.length < 2) return null;

  const normalized = countyInput.toLowerCase().replace(/\s*county\s*$/i, "").trim();
  for (let i = 1; i < data.length; i++) {
    const rawName: string = String(data[i][0]);
    const stripped = rawName.toLowerCase().replace(/\s*county\s*,.*/, "").trim();
    if (stripped === normalized) {
      const countyFips3: string = data[i][2];
      return {
        countyFips: `${stateFips}${countyFips3}`,
        countyFips3,
        resolvedName: rawName,
      };
    }
  }
  return null;
}

// ── Census ACS demographics ───────────────────────────────────────────────────
async function fetchCensusProfile(stateFips: string, countyFips3: string, censusKey: string) {
  const keyParam = censusKey ? `&key=${censusKey}` : "";
  const vars = [
    "NAME",
    "B01003_001E",                                                   // total population
    "B17001_001E", "B17001_002E",                                    // poverty universe, below poverty
    "B19013_001E",                                                   // median household income
    "B23025_002E", "B23025_005E",                                    // labor force, unemployed
    "B15003_001E",                                                   // education universe (25+)
    "B15003_017E","B15003_018E","B15003_019E","B15003_020E",         // HS diploma, GED, some coll, assoc
    "B15003_021E","B15003_022E","B15003_023E","B15003_024E","B15003_025E", // bach, master, prof, doctorate
    "B02001_001E","B02001_002E","B02001_003E","B02001_004E","B02001_005E", // race
    "B03001_001E","B03001_003E",                                     // hispanic universe, hispanic
    "B25003_001E","B25003_002E",                                     // tenure total, owner-occupied
  ].join(",");

  const url = `${CENSUS_ACS}?get=${vars}&for=county:${countyFips3}&in=state:${stateFips}${keyParam}`;
  const data = await fetchJson(url);
  if (!Array.isArray(data) || data.length < 2) throw new Error("No Census data returned");

  const headers: string[] = data[0];
  const row: string[] = data[1];
  const g = (k: string) => parseInt(row[headers.indexOf(k)] ?? "0") || 0;
  const pct = (n: number, d: number) => d > 0 ? +((n / d) * 100).toFixed(1) : null;

  const totalPop       = g("B01003_001E");
  const povUniverse    = g("B17001_001E");
  const belowPov       = g("B17001_002E");
  const medIncome      = g("B19013_001E");
  const laborForce     = g("B23025_002E");
  const unemployed     = g("B23025_005E");
  const edUniverse     = g("B15003_001E");
  const hsPlus = ["B15003_017E","B15003_018E","B15003_019E","B15003_020E",
                  "B15003_021E","B15003_022E","B15003_023E","B15003_024E","B15003_025E"]
                  .reduce((s, k) => s + g(k), 0);
  const raceTotal      = g("B02001_001E");
  const housingTotal   = g("B25003_001E");
  const ownerOccupied  = g("B25003_002E");

  return {
    countyLabel: row[headers.indexOf("NAME")] ?? "",
    demographics: {
      totalPopulation:        totalPop,
      povertyRatePct:         pct(belowPov, povUniverse),
      belowPovertyCount:      belowPov,
      medianHouseholdIncome:  medIncome > 0 ? medIncome : null,
      unemploymentRatePct:    pct(unemployed, laborForce),
      highSchoolGradRatePct:  pct(hsPlus, edUniverse),
      homeownershipRatePct:   pct(ownerOccupied, housingTotal),
      race: {
        whiteAlonePct:    pct(g("B02001_002E"), raceTotal),
        blackAlonePct:    pct(g("B02001_003E"), raceTotal),
        aianAlonePct:     pct(g("B02001_004E"), raceTotal),
        asianAlonePct:    pct(g("B02001_005E"), raceTotal),
        hispanicPct:      pct(g("B03001_003E"), g("B03001_001E")),
      },
    },
  };
}

// ── CDC PLACES health indicators ──────────────────────────────────────────────
async function fetchCdcHealth(stateAbbr: string, countyInput: string) {
  const countyFull = /county/i.test(countyInput) ? countyInput : `${countyInput} County`;
  const url = `${CDC_PLACES}?stateabbr=${encodeURIComponent(stateAbbr.toUpperCase())}&countyname=${encodeURIComponent(countyFull)}&$limit=100`;
  try {
    const data = await fetchJson(url);
    if (!Array.isArray(data) || data.length === 0) return null;
    const labelMap: Record<string, string> = {
      BPHIGH:   "highBloodPressurePct",
      DIABETES: "diabetesPct",
      MHLTH:    "mentalHealthNotGoodPct",
      OBESITY:  "obesityPct",
      SLEEP:    "sleepDeprivationPct",
      ACCESS2:  "noHealthInsurancePct",
      CSMOKING: "currentSmokingPct",
      STROKE:   "strokePct",
    };
    const health: Record<string, number> = {};
    for (const row of data) {
      const measure = String(row.measureid ?? "").toUpperCase();
      const mapped = labelMap[measure];
      if (mapped && row.data_value != null) health[mapped] = parseFloat(row.data_value);
    }
    return Object.keys(health).length > 0 ? health : null;
  } catch {
    return null;
  }
}

// ── ACS quick-pull for compare ────────────────────────────────────────────────
async function fetchAcsSummary(forClause: string, censusKey: string) {
  const keyParam = censusKey ? `&key=${censusKey}` : "";
  const vars = "B01003_001E,B17001_001E,B17001_002E,B19013_001E,B23025_002E,B23025_005E";
  const url = `${CENSUS_ACS}?get=NAME,${vars}&for=${forClause}${keyParam}`;
  try {
    const data = await fetchJson(url);
    if (!Array.isArray(data) || data.length < 2) return null;
    const h: string[] = data[0];
    const r: string[] = data[1];
    const g = (k: string) => parseInt(r[h.indexOf(k)] ?? "0") || 0;
    const povU  = g("B17001_001E");
    const lf    = g("B23025_002E");
    return {
      label:                  String(r[h.indexOf("NAME")] ?? ""),
      population:             g("B01003_001E"),
      povertyRatePct:         povU > 0  ? +((g("B17001_002E") / povU) * 100).toFixed(1) : null,
      medianHouseholdIncome:  g("B19013_001E") || null,
      unemploymentRatePct:    lf > 0    ? +((g("B23025_005E") / lf) * 100).toFixed(1) : null,
    };
  } catch {
    return null;
  }
}

// ── Census Geocoder helpers ───────────────────────────────────────────────────
type ResolvedCounty = {
  stateFips: string;
  countyFips3: string;
  countyFips: string;
  countyName: string;
  stateAbbr: string;
};

function extractCountyFromGeographies(geographies: any): ResolvedCounty | null {
  const counties: any[] =
    geographies?.["Counties"] ??
    geographies?.["2010 Census Counties"] ??
    geographies?.["Census Counties"] ??
    [];
  if (!Array.isArray(counties) || counties.length === 0) return null;
  const c = counties[0];
  const stateFips   = String(c.STATE   ?? c.STATEFP  ?? "");
  const countyFips3 = String(c.COUNTY  ?? c.COUNTYFP ?? "");
  if (!stateFips || !countyFips3) return null;
  const countyName = String(c.NAME ?? c.BASENAME ?? "")
    .replace(/\s*County\s*$/, "")
    .trim();
  return {
    stateFips,
    countyFips3,
    countyFips: `${stateFips}${countyFips3}`,
    countyName,
    stateAbbr: FIPS_TO_STATE[stateFips] ?? "",
  };
}

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_UA = "ThriveUp-CommunityAPI/2.0 (thrivingcommunitiesforall.com)";

// Nominatim → lat/lon → Census Geocoder reverse → county
// Nominatim handles ZIP-only and city-only lookups; Census Geocoder does not.
async function nominatimToCounty(params: Record<string, string>): Promise<ResolvedCounty | null> {
  const qs = new URLSearchParams({ ...params, country: "us", format: "json", addressdetails: "1", limit: "1" });
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10_000);
    const r = await fetch(`${NOMINATIM}?${qs}`, {
      headers: { Accept: "application/json", "User-Agent": NOMINATIM_UA },
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const data = await r.json();
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit?.lat || !hit?.lon) return null;
    return resolveLatLngToCounty(parseFloat(hit.lat), parseFloat(hit.lon));
  } catch { return null; }
}

// City + state → county
async function resolveCityToCounty(city: string, stateAbbr: string): Promise<ResolvedCounty | null> {
  return nominatimToCounty({ city, state: stateAbbr });
}

// ZIP code → county
async function resolveZipToCounty(zip: string): Promise<ResolvedCounty | null> {
  return nominatimToCounty({ postalcode: zip });
}

// Lat/lng reverse geocode → county (Census Geocoder coordinates endpoint)
async function resolveLatLngToCounty(lat: number, lng: number): Promise<ResolvedCounty | null> {
  const url = `${CENSUS_GEOCODER}/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Counties&format=json`;
  try {
    const data = await fetchJson(url);
    const geographies = data?.result?.geographies;
    if (!geographies) return null;
    return extractCountyFromGeographies(geographies);
  } catch { return null; }
}

// ── Router factory ────────────────────────────────────────────────────────────
// Returns an Express Router mounted at /api/community by server/index.ts.
// All paths here are relative (e.g. "/profile" not "/api/community/profile").
export function createCommunityRouter(): Router {
  const router = Router();
  const rl = rateLimit(60, 60_000);
  const mw = [requireApiKey, rl] as any[];

  // ── /profile ───────────────────────────────────────────────────────────────
  router.get("/profile", ...mw, async (req: Request, res: Response) => {
    try {
      const state  = String(req.query.state  ?? "").toUpperCase().trim();
      const county = String(req.query.county ?? "").trim();
      if (!state || !county) {
        return res.status(400).json({ error: "state and county are required.", example: "?state=TX&county=Burnet" });
      }
      const stateFips = getStateFips(state);
      if (!stateFips) return res.status(400).json({ error: `Unrecognized state: ${state}` });

      const censusKey = process.env.CENSUS_API_KEY ?? "";
      const resolved = await resolveCountyFips(stateFips, county, censusKey);
      if (!resolved) {
        return res.status(404).json({ error: `County "${county}" not found in ${state}.`, tip: "Try the full name, e.g. 'Burnet County'" });
      }

      const [censusResult, healthResult] = await Promise.allSettled([
        fetchCensusProfile(stateFips, resolved.countyFips3, censusKey),
        fetchCdcHealth(state, county),
      ]);

      const census = censusResult.status === "fulfilled" ? censusResult.value : null;
      const health = healthResult.status === "fulfilled" ? healthResult.value : null;

      return res.json({
        geography: {
          state,
          county:     county.replace(/\s*county\s*$/i, "").trim(),
          countyFips: resolved.countyFips,
          label:      census?.countyLabel ?? resolved.resolvedName,
        },
        demographics: census?.demographics ?? null,
        health: health ?? null,
        sources: [
          "U.S. Census Bureau ACS 5-year (2018–2022)",
          health ? "CDC PLACES 2023" : null,
        ].filter(Boolean),
        asOf: "2022–2023",
        _poweredBy: "ThriveUp Community Intelligence API · thrivingcommunitiesforall.com",
      });
    } catch (err: any) {
      console.error("[community-api/profile]", err?.message ?? err);
      return res.status(500).json({ error: "Failed to retrieve community profile. Please retry." });
    }
  });

  // ── /opportunities ────────────────────────────────────────────────────────
  router.get("/opportunities", ...mw, async (req: Request, res: Response) => {
    try {
      const state  = String(req.query.state  ?? "").toUpperCase().trim();
      const county = String(req.query.county ?? "").trim();
      if (!state) {
        return res.status(400).json({ error: "state is required.", example: "?state=TX&county=Burnet" });
      }
      const stateName = STATE_NAMES[state];
      if (!stateName) return res.status(400).json({ error: `Unrecognized state: ${state}` });

      let grants = await db
        .select()
        .from(grantOpportunities)
        .orderBy(desc(grantOpportunities.fitScore), desc(grantOpportunities.createdAt));

      // Keep national + state-relevant grants
      const haystack = (g: (typeof grants)[0]) =>
        `${g.title} ${g.description ?? ""} ${g.eligibilityCriteria ?? ""} ${(g.focusAreas as string[] ?? []).join(" ")}`.toLowerCase();

      grants = grants.filter(g => {
        const hay = haystack(g);
        const isNational = /national|nationwide|all states|fifty states/i.test(hay);
        return isNational || hay.includes(state.toLowerCase()) || hay.includes(stateName.toLowerCase());
      });

      // County refinement (best-effort, don't shrink to zero)
      if (county) {
        const cn = county.toLowerCase().replace(/\s*county\s*$/i, "").trim();
        const refined = grants.filter(g => haystack(g).includes(cn));
        if (refined.length > 0) grants = refined;
      }

      const opportunities = grants.slice(0, 50).map(g => ({
        id:                   g.id,
        title:                g.title,
        funder:               g.agency ?? null,
        fundingType:          g.grantType ?? null,
        amountRange:          g.fundingAmount ?? null,
        deadline:             g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : null,
        fitScore:             g.fitScore ?? null,
        focusAreas:           (g.focusAreas as string[] ?? []),
        eligibilitySummary:   g.eligibilityCriteria ?? null,
        applyUrl:             g.sourceUrl ?? null,
        status:               g.status ?? null,
        whyItMatches:         `Fit score ${g.fitScore ?? "N/A"}/100 · ${(g.focusAreas as string[] ?? []).slice(0, 3).join(", ")}`,
      }));

      return res.json({
        geography: { state, stateName, county: county || null },
        total:    opportunities.length,
        opportunities,
        _poweredBy: "ThriveUp Grant Discovery Engine · SAM.gov · Grants.gov · curated foundation feeds",
      });
    } catch (err: any) {
      console.error("[community-api/opportunities]", err?.message ?? err);
      return res.status(500).json({ error: "Failed to retrieve opportunities." });
    }
  });

  // ── /compare ──────────────────────────────────────────────────────────────
  router.get("/compare", ...mw, async (req: Request, res: Response) => {
    try {
      const state  = String(req.query.state  ?? "").toUpperCase().trim();
      const county = String(req.query.county ?? "").trim();
      if (!state || !county) {
        return res.status(400).json({ error: "state and county are required.", example: "?state=TX&county=Burnet" });
      }
      const stateFips = getStateFips(state);
      if (!stateFips) return res.status(400).json({ error: `Unrecognized state: ${state}` });

      const censusKey = process.env.CENSUS_API_KEY ?? "";
      const resolved  = await resolveCountyFips(stateFips, county, censusKey);
      if (!resolved) {
        return res.status(404).json({ error: `County "${county}" not found in ${state}.` });
      }

      const [countyResult, stateResult] = await Promise.allSettled([
        fetchAcsSummary(`county:${resolved.countyFips3}&in=state:${stateFips}`, censusKey),
        fetchAcsSummary(`state:${stateFips}`, censusKey),
      ]);

      const countyMetrics = countyResult.status === "fulfilled" ? countyResult.value : null;
      const stateMetrics  = stateResult.status  === "fulfilled" ? stateResult.value  : null;

      // National benchmarks — Census ACS 2022 national estimates
      const national = {
        label:                "United States",
        population:           331_449_281,
        povertyRatePct:       12.6,
        medianHouseholdIncome: 74_580,
        unemploymentRatePct:  5.3,
      };

      function gap(countyVal: number | null, bench: number, higherIsBetter: boolean) {
        if (countyVal === null) return null;
        const diff = +(countyVal - bench).toFixed(1);
        const direction = diff > 0 ? (higherIsBetter ? "above" : "worse_than")
                        : diff < 0 ? (higherIsBetter ? "below"  : "better_than")
                        : "at_par";
        return { countyValue: countyVal, benchmarkValue: bench, difference: diff, direction };
      }

      const comparison = countyMetrics ? {
        vsState: stateMetrics ? {
          povertyRate:          gap(countyMetrics.povertyRatePct,       stateMetrics.povertyRatePct ?? 0,       false),
          medianIncome:         gap(countyMetrics.medianHouseholdIncome, stateMetrics.medianHouseholdIncome ?? 0, true),
          unemploymentRate:     gap(countyMetrics.unemploymentRatePct,   stateMetrics.unemploymentRatePct ?? 0,   false),
        } : null,
        vsNational: {
          povertyRate:          gap(countyMetrics.povertyRatePct,       national.povertyRatePct,        false),
          medianIncome:         gap(countyMetrics.medianHouseholdIncome, national.medianHouseholdIncome, true),
          unemploymentRate:     gap(countyMetrics.unemploymentRatePct,   national.unemploymentRatePct,   false),
        },
      } : null;

      return res.json({
        geography:     { state, county: county.replace(/\s*county\s*$/i, "").trim(), countyFips: resolved.countyFips },
        countyMetrics,
        stateMetrics,
        nationalBenchmarks: national,
        comparison,
        grantNarrativeHint: comparison?.vsNational ? buildNarrativeHint(county, state, countyMetrics, comparison.vsNational) : null,
        sources:       ["U.S. Census Bureau ACS 5-year (2018–2022)"],
        asOf:          "2022-12-31",
        _poweredBy:    "ThriveUp Community Intelligence API · thrivingcommunitiesforall.com",
      });
    } catch (err: any) {
      console.error("[community-api/compare]", err?.message ?? err);
      return res.status(500).json({ error: "Failed to retrieve comparison data." });
    }
  });

  // ── / (root manifest) ─────────────────────────────────────────────────────
  // Must be registered AFTER the sub-routes so it doesn't shadow them.
  // Returns JSON capabilities — never HTML.
  router.get("/", ...mw, (_req: Request, res: Response) => {
    res.json({
      name: "ThriveUp Community Intelligence API",
      version: "2.0.0",
      poweredBy: "thrivingcommunitiesforall.com",
      description: "Real-time U.S. county demographics, health indicators, and grant opportunities for any geography.",
      endpoints: {
        profile:       "GET /api/community/profile?state=TX&county=Burnet",
        city:          "GET /api/community/city?city=Austin&state=TX",
        zip:           "GET /api/community/zip?zip=78701",
        geo:           "GET /api/community/geo?lat=30.2672&lng=-97.7431",
        search:        "GET /api/community/search?q=Austin+TX",
        opportunities: "GET /api/community/opportunities?state=TX&county=Burnet",
        compare:       "GET /api/community/compare?state=TX&county=Burnet",
      },
      auth: "X-Api-Key: <key>  OR  Authorization: Bearer <key>",
      rateLimit: "60 requests / minute per IP",
      dataSources: [
        "U.S. Census Bureau ACS 5-year (2018–2022)",
        "CDC PLACES 2023",
        "Census Geocoder (city / ZIP / lat-lng resolution)",
        "ThriveUp Grant Discovery Engine (SAM.gov · Grants.gov · curated feeds)",
      ],
    });
  });

  // ── /city ─────────────────────────────────────────────────────────────────
  // City + state → Nominatim → lat/lon → Census Geocoder → county + full profile
  router.get("/city", ...mw, async (req: Request, res: Response) => {
    try {
      const city  = String(req.query.city  ?? "").trim();
      const state = String(req.query.state ?? "").toUpperCase().trim();
      if (!city || !state) {
        return res.status(400).json({ error: "city and state are required.", example: "?city=Austin&state=TX" });
      }
      const resolved = await resolveCityToCounty(city, state);
      if (!resolved) {
        return res.status(404).json({
          error: `Could not resolve "${city}, ${state}" to a county.`,
          tip: "Try a nearby major city, or use /api/community/zip or /api/community/profile?state=TX&county=Travis",
        });
      }
      const censusKey = process.env.CENSUS_API_KEY ?? "";
      const [censusResult, healthResult] = await Promise.allSettled([
        fetchCensusProfile(resolved.stateFips, resolved.countyFips3, censusKey),
        fetchCdcHealth(resolved.stateAbbr || state, resolved.countyName),
      ]);
      const census = censusResult.status === "fulfilled" ? censusResult.value : null;
      const health = healthResult.status === "fulfilled" ? healthResult.value : null;
      return res.json({
        resolvedFrom: { city, state, method: "census-geocoder" },
        geography: {
          state:      resolved.stateAbbr || state,
          county:     resolved.countyName,
          countyFips: resolved.countyFips,
          label:      census?.countyLabel ?? `${resolved.countyName} County`,
        },
        demographics: census?.demographics ?? null,
        health:       health ?? null,
        sources: ["U.S. Census Bureau ACS 5-year (2018–2022)", health ? "CDC PLACES 2023" : null, "Census Geocoder"].filter(Boolean),
        asOf: "2022–2023",
        _poweredBy: "ThriveUp Community Intelligence API · thrivingcommunitiesforall.com",
      });
    } catch (err: any) {
      console.error("[community-api/city]", err?.message ?? err);
      return res.status(500).json({ error: "Failed to resolve city. Please retry." });
    }
  });

  // ── /zip ──────────────────────────────────────────────────────────────────
  // ZIP code → Nominatim → lat/lon → Census Geocoder → county + full profile
  router.get("/zip", ...mw, async (req: Request, res: Response) => {
    try {
      const zip = String(req.query.zip ?? "").replace(/\D/g, "").slice(0, 5);
      if (!zip || zip.length < 5) {
        return res.status(400).json({ error: "A 5-digit ZIP code is required.", example: "?zip=78701" });
      }
      const resolved = await resolveZipToCounty(zip);
      if (!resolved) {
        return res.status(404).json({ error: `Could not resolve ZIP code "${zip}" to a U.S. county.` });
      }
      const censusKey = process.env.CENSUS_API_KEY ?? "";
      const [censusResult, healthResult] = await Promise.allSettled([
        fetchCensusProfile(resolved.stateFips, resolved.countyFips3, censusKey),
        fetchCdcHealth(resolved.stateAbbr, resolved.countyName),
      ]);
      const census = censusResult.status === "fulfilled" ? censusResult.value : null;
      const health = healthResult.status === "fulfilled" ? healthResult.value : null;
      return res.json({
        resolvedFrom: { zip, method: "census-geocoder" },
        geography: {
          state:      resolved.stateAbbr,
          county:     resolved.countyName,
          countyFips: resolved.countyFips,
          label:      census?.countyLabel ?? `${resolved.countyName} County`,
        },
        demographics: census?.demographics ?? null,
        health:       health ?? null,
        sources: ["U.S. Census Bureau ACS 5-year (2018–2022)", health ? "CDC PLACES 2023" : null, "Census Geocoder"].filter(Boolean),
        asOf: "2022–2023",
        _poweredBy: "ThriveUp Community Intelligence API · thrivingcommunitiesforall.com",
      });
    } catch (err: any) {
      console.error("[community-api/zip]", err?.message ?? err);
      return res.status(500).json({ error: "Failed to resolve ZIP code. Please retry." });
    }
  });

  // ── /geo ──────────────────────────────────────────────────────────────────
  // Lat/lng → Census Geocoder reverse → county + full profile
  router.get("/geo", ...mw, async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(String(req.query.lat ?? ""));
      const lng = parseFloat(String(req.query.lng ?? req.query.lon ?? ""));
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "lat and lng are required.", example: "?lat=30.2672&lng=-97.7431" });
      }
      if (lat < 18 || lat > 72 || lng < -180 || lng > -65) {
        return res.status(400).json({ error: "Coordinates appear to be outside the United States." });
      }
      const resolved = await resolveLatLngToCounty(lat, lng);
      if (!resolved) {
        return res.status(404).json({ error: "Could not resolve these coordinates to a U.S. county." });
      }
      const censusKey = process.env.CENSUS_API_KEY ?? "";
      const [censusResult, healthResult] = await Promise.allSettled([
        fetchCensusProfile(resolved.stateFips, resolved.countyFips3, censusKey),
        fetchCdcHealth(resolved.stateAbbr, resolved.countyName),
      ]);
      const census = censusResult.status === "fulfilled" ? censusResult.value : null;
      const health = healthResult.status === "fulfilled" ? healthResult.value : null;
      return res.json({
        resolvedFrom: { lat, lng, method: "census-geocoder-reverse" },
        geography: {
          state:      resolved.stateAbbr,
          county:     resolved.countyName,
          countyFips: resolved.countyFips,
          label:      census?.countyLabel ?? `${resolved.countyName} County`,
        },
        demographics: census?.demographics ?? null,
        health:       health ?? null,
        sources: ["U.S. Census Bureau ACS 5-year (2018–2022)", health ? "CDC PLACES 2023" : null, "Census Geocoder"].filter(Boolean),
        asOf: "2022–2023",
        _poweredBy: "ThriveUp Community Intelligence API · thrivingcommunitiesforall.com",
      });
    } catch (err: any) {
      console.error("[community-api/geo]", err?.message ?? err);
      return res.status(500).json({ error: "Failed to resolve coordinates. Please retry." });
    }
  });

  // ── /api/community/search ──────────────────────────────────────────────────
  // Free-text → Nominatim → ranked county candidates (autocomplete helper)
  router.get("/search", ...mw, async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (!q || q.length < 2) {
        return res.status(400).json({ error: "q must be at least 2 characters.", example: "?q=Austin+TX" });
      }

      // Nominatim handles free-text city/county/ZIP queries; Census Geocoder requires street addresses.
      const qs = new URLSearchParams({ q, country: "us", format: "json", addressdetails: "1", limit: "5" });
      let hits: any[] = [];
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 10_000);
        const r = await fetch(`${NOMINATIM}?${qs}`, {
          headers: { Accept: "application/json", "User-Agent": NOMINATIM_UA },
          signal: ctl.signal,
        });
        clearTimeout(t);
        if (r.ok) hits = await r.json();
      } catch { /* non-fatal */ }

      // Deduplicate by county FIPS — multiple Nominatim hits often map to same county
      const seen = new Set<string>();
      const results: any[] = [];
      for (const hit of hits) {
        if (!hit.lat || !hit.lon) continue;
        const geo = await resolveLatLngToCounty(parseFloat(hit.lat), parseFloat(hit.lon));
        if (!geo || seen.has(geo.countyFips)) continue;
        seen.add(geo.countyFips);
        results.push({
          matchedText:  hit.display_name?.split(",").slice(0, 2).join(",").trim() ?? null,
          county:       geo.countyName,
          state:        geo.stateAbbr,
          countyFips:   geo.countyFips,
          profileUrl:   `/api/community/profile?state=${geo.stateAbbr}&county=${encodeURIComponent(geo.countyName)}`,
        });
        if (results.length >= 5) break;
      }

      return res.json({
        query:   q,
        total:   results.length,
        results,
        tip: results.length === 0 ? "Try adding a state abbreviation, e.g. 'Austin TX', '78701', or 'Travis County TX'" : undefined,
        _poweredBy: "ThriveUp Community Intelligence API · Nominatim · Census Geocoder",
      });
    } catch (err: any) {
      console.error("[community-api/search]", err?.message ?? err);
      return res.status(500).json({ error: "Search failed. Please retry." });
    }
  });

  // ── Terminal JSON 404 — must be last in this router ──────────────────────
  router.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "API endpoint not found.",
      availableEndpoints: [
        "GET /api/community",
        "GET /api/community/profile?state=TX&county=Burnet",
        "GET /api/community/city?city=Austin&state=TX",
        "GET /api/community/zip?zip=78701",
        "GET /api/community/geo?lat=30.2672&lng=-97.7431",
        "GET /api/community/search?q=Austin+TX",
        "GET /api/community/opportunities?state=TX&county=Burnet",
        "GET /api/community/compare?state=TX&county=Burnet",
      ],
    });
  });

  return router;
}

// Singleton export — mounted as app.use('/api/community', communityRouter) in index.ts
export const communityRouter = createCommunityRouter();

// ── Grant narrative hint builder ──────────────────────────────────────────────
function buildNarrativeHint(
  county: string,
  state: string,
  metrics: { povertyRatePct?: number | null; medianHouseholdIncome?: number | null; unemploymentRatePct?: number | null } | null,
  vsNational: Record<string, { direction?: string; difference?: number } | null>,
): string {
  if (!metrics) return "";
  const parts: string[] = [];
  if (metrics.povertyRatePct != null) {
    const cmp = vsNational.povertyRate;
    parts.push(`${county} County, ${state} has a poverty rate of ${metrics.povertyRatePct}%${cmp ? ` — ${Math.abs(cmp.difference ?? 0)} percentage points ${cmp.direction === "worse_than" ? "above" : "below"} the national average of 12.6%` : ""}.`);
  }
  if (metrics.medianHouseholdIncome != null) {
    const cmp = vsNational.medianIncome;
    parts.push(`Median household income is $${metrics.medianHouseholdIncome.toLocaleString()}${cmp ? `, $${Math.abs(cmp.difference ?? 0).toLocaleString()} ${cmp.direction === "below" ? "below" : "above"} the national median of $74,580` : ""}.`);
  }
  if (metrics.unemploymentRatePct != null) {
    parts.push(`The unemployment rate stands at ${metrics.unemploymentRatePct}%.`);
  }
  return parts.join(" ");
}
