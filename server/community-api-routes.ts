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
import type { Express, Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { db } from "./storage";
import { grantOpportunities } from "@shared/schema";
import { desc } from "drizzle-orm";
import { getStateFips } from "./gis-engine";

const CENSUS_ACS = "https://api.census.gov/data/2022/acs/acs5";
const CDC_PLACES = "https://data.cdc.gov/resource/swc5-untb.json";

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

// ── Route registration ────────────────────────────────────────────────────────
export function registerCommunityApiRoutes(app: Express) {
  const rl = rateLimit(60, 60_000);
  const mw = [requireApiKey, rl] as any[];

  // ── /api/community/profile ─────────────────────────────────────────────────
  app.get("/api/community/profile", ...mw, async (req: Request, res: Response) => {
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

  // ── /api/community/opportunities ──────────────────────────────────────────
  app.get("/api/community/opportunities", ...mw, async (req: Request, res: Response) => {
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

  // ── /api/community/compare ─────────────────────────────────────────────────
  app.get("/api/community/compare", ...mw, async (req: Request, res: Response) => {
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
}

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
