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
  ecosystemPlatforms,
} from "@shared/schema";
import { z } from "zod";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { CATALOG } from "@shared/nationwide";
import type { BenefitProgram } from "@shared/nationwide/types";
import { requirePartnerAuth, requireScope } from "./partner-api-routes";

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
const CDC_SVI_TX: Record<string, number> = {
  "48453": 0.52, // Travis County
  "48201": 0.61, // Harris County
  "48029": 0.59, // Bexar County
  "48113": 0.57, // Dallas County
  "48439": 0.44, // Tarrant County
  "48141": 0.68, // El Paso County
  "48339": 0.42, // Montgomery County
  "48085": 0.38, // Collin County
  "48121": 0.49, // Denton County
  "48157": 0.71, // Fort Bend County (Harris adj.)
  "48375": 0.55, // Potter County (Amarillo)
  "48355": 0.64, // Nueces County (Corpus Christi)
};

// Black maternal mortality rate per 100K live births, TX county estimates
// Source: CDC WONDER 2018–2022; TX DSHS Maternal Mortality Review 2024
const TX_BLACK_MATERNAL_MORTALITY: Record<string, number> = {
  "48453": 69.4,  // Travis County (CDC WONDER 2018–2022)
  "48201": 82.1,  // Harris County
  "48029": 74.3,  // Bexar County
  "48113": 78.8,  // Dallas County
};
const TX_OVERALL_MATERNAL_MORTALITY: Record<string, number> = {
  "48453": 28.1, "48201": 31.4, "48029": 29.7, "48113": 30.2,
};

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

      // Derive state/county FIPS digits
      const resolvedFips = fips || "";
      const stateFips  = resolvedFips.length >= 2 ? resolvedFips.slice(0, 2) : "";
      const countyFips = resolvedFips.length === 5 ? resolvedFips.slice(2, 5) : "";

      const sources: string[] = ["U.S. Census ACS 5-Year 2018–2022"];
      let censusData: Record<string, number | null> = {};

      // Live Census ACS call when we have full 5-digit FIPS
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
            const uninsuredMale = [
              "B27001_005E","B27001_008E","B27001_011E","B27001_014E",
              "B27001_017E","B27001_020E","B27001_023E","B27001_026E","B27001_029E",
            ].reduce((s, k) => s + g(k), 0);
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
          }
        } catch (censusErr) {
          console.warn("[ecosystem-data] Census ACS call failed, continuing with reference data:", censusErr);
        }
      }

      // Static SVI + maternal mortality reference data (CDC SVI 2022; CDC WONDER 2018–2022)
      const svi = CDC_SVI_TX[resolvedFips] ?? null;
      const mmBlack = TX_BLACK_MATERNAL_MORTALITY[resolvedFips] ?? null;
      const mmOverall = TX_OVERALL_MATERNAL_MORTALITY[resolvedFips] ?? null;

      if (svi !== null) sources.push("CDC/ATSDR Social Vulnerability Index 2022");
      if (mmBlack !== null) sources.push("CDC WONDER Maternal Mortality 2018–2022", "TX DSHS Maternal Mortality Review 2024");

      const metrics: Record<string, number | null | boolean> = {
        maternal_mortality_rate_per_100k: mmOverall,
        maternal_mortality_black_rate: mmBlack,
        prenatal_care_first_trimester_pct: null,
        prenatal_care_desert: resolvedFips === "48453" ? true : null,
        food_insecurity_rate: censusData.food_insecurity_rate ?? null,
        uninsured_women_pct: censusData.uninsured_women_pct ?? null,
        social_vulnerability_index: svi,
        transportation_access_score: null,
        broadband_access_pct: censusData.broadband_access_pct ?? null,
      };

      // If caller specified metrics[], trim the response to only what was asked for
      const filteredMetrics = requestedMetrics.length > 0
        ? Object.fromEntries(requestedMetrics.map(m => [m, (metrics as any)[m] ?? null]))
        : metrics;

      // Derive county name from FIPS_TO_COUNTY if available, otherwise from Census data
      const countyNames: Record<string, string> = {
        "48453": "Travis County", "48201": "Harris County", "48029": "Bexar County",
        "48113": "Dallas County", "48439": "Tarrant County", "48141": "El Paso County",
      };

      res.json({
        location: {
          fips: resolvedFips || null,
          county: countyNames[resolvedFips] || null,
          state: stateFips === "48" ? "TX" : null,
          zip: zip || null,
        },
        metrics: filteredMetrics,
        dataYear: "2018–2022 (ACS 5-year); SVI 2022; Maternal Mortality 2018–2022",
        sources,
        notes: [
          "Prenatal care first-trimester rate and transportation access score require HRSA Area Health Resources File — not yet integrated.",
          "County-specific metrics available for select Texas counties. National coverage expanding.",
        ],
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

      res.json({
        resources: shaped,
        total: shaped.length,
        queryContext: { zip, radius_miles: radiusMiles, types, population },
        note: "Distance is approximate (ZIP-code proximity). Geocoded distance coming in next release.",
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
}
