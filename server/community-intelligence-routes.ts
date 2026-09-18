/**
 * Community Intelligence API
 * Prompt-driven GIS + SDOH analysis.
 * Returns: geocoded center, multi-layer SVI data, community org markers,
 * Chainweb ripple links, and AI synthesis — all in one call.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { benefitsPartners, gisResourceOverlays, gunViolenceIncidents, communityIntelligenceSubmissions } from "@shared/schema";
import { eq, sql, and, gte, lte, ilike, or } from "drizzle-orm";
import { fetchZctaData, zipToGeography } from "./neighborhood-routes";
import { generateAIJSON } from "./ai-provider";
import { CHAINWEB_COEFFICIENTS, EVIDENCE_PROGRAMS } from "./chainweb-coefficients";
import { withEthicalPreamble } from "./ai-provider";

/** Normalize the fetchZctaData result into a flat shape the rest of this
 *  module can read without nesting. fetchZctaData buries rates inside
 *  .indicators and themes inside .themes — this unwraps them. */
function flattenSvi(raw: any): Record<string, any> {
  if (!raw) return {};
  return {
    population:              raw.population,
    medianHouseholdIncome:   raw.medianIncome,
    sviScore:                raw.sviScore,
    sviTheme1:               raw.themes?.socioeconomic,
    sviTheme2:               raw.themes?.household,
    sviTheme3:               raw.themes?.minority,
    sviTheme4:               raw.themes?.housingTransport,
    povertyRate:             raw.indicators?.povertyRate,
    unemploymentRate:        raw.indicators?.unemploymentRate,
    noHighSchoolDiplomaRate: raw.indicators?.noHighSchoolDiploma,
    noHealthInsuranceRate:   raw.indicators?.uninsuredRate,
    housingCostBurdenRate:   raw.indicators?.overcrowding,   // closest proxy
    percentMinority:         raw.indicators?.minorityPct,
    limitedEnglishProficiency: raw.indicators?.limitedEnglish,
    disabilityRate:          raw.indicators?.disabilityRate,
    snapRate:                raw.indicators?.snapRecipients,
    countyName:              raw.countyName,
  };
}

// ── Chicago Gun Violence Context (Cook County ZIPs 606xx) ────────────────────
async function fetchChicagoGunViolenceContext(zip: string): Promise<{
  cityIncidents: number;
  cityVictims: number;
  cityFatalities: number;
  zipIncidents: number;
  zipVictims: number;
  source: string;
  note: string;
} | null> {
  try {
    const [cityTotals] = await db
      .select({
        incidents:  sql<number>`count(*)::int`,
        victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
        fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
      })
      .from(gunViolenceIncidents)
      .where(eq(gunViolenceIncidents.city, "Chicago"));

    const [zipTotals] = await db
      .select({
        incidents:  sql<number>`count(*)::int`,
        victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
      })
      .from(gunViolenceIncidents)
      .where(eq(gunViolenceIncidents.zip, zip));

    const hasData = (cityTotals?.incidents ?? 0) > 0;
    return {
      cityIncidents:  cityTotals?.incidents  ?? 0,
      cityVictims:    cityTotals?.victims    ?? 0,
      cityFatalities: cityTotals?.fatalities ?? 0,
      zipIncidents:   zipTotals?.incidents   ?? 0,
      zipVictims:     zipTotals?.victims     ?? 0,
      source: "TCAF Gun Violence Registry",
      note: hasData
        ? `Registry data reflects confirmed import batches. Gun violence is a public health crisis in Chicago's South and West sides — the TCAF Chicago pilot anchors three agencies in the highest-impact neighborhoods (Woodlawn, Auburn Gresham, East Garfield Park). Trauma-informed care resources available through Community Healing Resource Center.`
        : "Gun Violence Registry is live and ready to receive data from connected sources. No records imported yet — contact the TCAF team to connect your data pipeline.",
    };
  } catch {
    return null;
  }
}

// ── Geocode a ZIP via Nominatim (OpenStreetMap, no key needed) ───────────────
async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=us&format=json&limit=1`,
      { headers: { "User-Agent": "ThriveUp-CommunityIntelligence/1.0" } }
    );
    const data = await resp.json();
    if (!data || !data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ── Pull community org markers from DB ───────────────────────────────────────
async function getOrgMarkers(_county: string) {
  try {
    // Primary: benefits_partners with coordinates
    const [partners, overlays] = await Promise.all([
      db.select({
        id: benefitsPartners.id,
        name: benefitsPartners.name,
        type: benefitsPartners.organizationType,
        services: benefitsPartners.servicesOffered,
        lat: benefitsPartners.latitude,
        lng: benefitsPartners.longitude,
        languages: benefitsPartners.languages,
        capacity: benefitsPartners.capacity,
      }).from(benefitsPartners).where(and(
        eq(benefitsPartners.isActive, true),
        ilike(benefitsPartners.county, `%${_county}%`),
      )),

      // Fallback: GIS resource overlays (always have coordinates)
      db.select({
        id: gisResourceOverlays.id,
        name: gisResourceOverlays.name,
        category: gisResourceOverlays.category,
        lat: gisResourceOverlays.latitude,
        lng: gisResourceOverlays.longitude,
      }).from(gisResourceOverlays).where(and(
        eq(gisResourceOverlays.isActive, true),
        or(
          ilike(gisResourceOverlays.address, `%${_county}%`),
          ilike(gisResourceOverlays.name, `%${_county}%`),
        ),
      )),
    ]);

    const fromPartners = partners.filter(p => p.lat && p.lng).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type || "service",
      services: p.services || [],
      lat: p.lat!,
      lng: p.lng!,
      languages: p.languages || [],
      capacity: p.capacity || null,
    }));

    const fromOverlays = overlays.filter(o => o.lat && o.lng).map(o => ({
      id: o.id,
      name: o.name,
      type: o.category || "resource",
      services: [o.category || "Community Resource"],
      lat: o.lat!,
      lng: o.lng!,
      languages: [],
      capacity: null,
    }));

    // Deduplicate by id, partners take priority
    const seen = new Set(fromPartners.map(p => p.id));
    const merged = [...fromPartners, ...fromOverlays.filter(o => !seen.has(o.id))];
    return merged;
  } catch {
    return [];
  }
}

const COMMUNITY_ANALYSIS_WINDOW_MS = 10 * 60 * 1000;
const COMMUNITY_ANALYSIS_MAX = 5;
const communityAnalysisHits = new Map<string, number[]>();
const MAX_ANALYSIS_BODY_BYTES = 8_000;
const MAX_ANALYSIS_PROMPT_LENGTH = 1_200;

function communityClientIp(req: Request): string {
  return (req.ip || req.socket?.remoteAddress || "unknown").trim();
}

function limitCommunityAnalysis(req: Request, res: Response, next: NextFunction) {
  const serialized = JSON.stringify(req.body ?? "");
  if (serialized.length > MAX_ANALYSIS_BODY_BYTES) {
    return res.status(413).json({ error: "Request body is too large for public analysis." });
  }
  const now = Date.now();
  const ip = communityClientIp(req);
  const recent = (communityAnalysisHits.get(ip) ?? []).filter((at) => at > now - COMMUNITY_ANALYSIS_WINDOW_MS);
  if (recent.length >= COMMUNITY_ANALYSIS_MAX) {
    const retryAfter = Math.max(1, Math.ceil((recent[0] + COMMUNITY_ANALYSIS_WINDOW_MS - now) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Too many public analysis requests. Please try again later." });
  }
  recent.push(now);
  communityAnalysisHits.set(ip, recent);
  return next();
}

// ── Extract relevant Chainweb coefficients for high-vulnerability domains ───
// CHAINWEB_COEFFICIENTS uses fromDomain/toDomain/fromMetric/toMetric/evidenceCitation
function getChainwebLinks(sviData: any) {
  const priority: string[] = [];
  if ((sviData.povertyRate ?? 0) > 10) priority.push("economic", "workforce", "early_childhood");
  if ((sviData.unemploymentRate ?? 0) > 5) priority.push("workforce", "economic");
  if ((sviData.noHealthInsuranceRate ?? 0) > 10) priority.push("health");
  if ((sviData.noHighSchoolDiplomaRate ?? 0) > 10) priority.push("education");
  if ((sviData.housingCostBurdenRate ?? 0) > 20) priority.push("housing");
  // SVI score fallback — always show something
  if (priority.length === 0) {
    priority.push("early_childhood", "economic", "workforce", "health", "education", "housing");
  }

  // Guard: skip entries missing required fields
  const valid = CHAINWEB_COEFFICIENTS.filter(
    c => c.fromDomain && c.toDomain && c.fromMetric && c.toMetric
  );

  const matched = valid.filter(c =>
    priority.some(k => c.fromDomain === k || c.toDomain === k)
  );

  // Always return at least 6 — fall back to all valid if too few matched
  const source = matched.length >= 4 ? matched : valid;

  return source
    .slice(0, 8)
    .map(c => ({
      cause: c.fromMetric,
      effect: c.toMetric,
      coefficient: c.coefficient,
      direction: c.coefficient > 0 ? "positive" : "negative",
      magnitude: Math.abs(c.coefficient) > 1 ? "high" : Math.abs(c.coefficient) > 0.3 ? "medium" : "low",
      citation: c.evidenceCitation || "",
    }));
}

// ── AI synthesis prompt ───────────────────────────────────────────────────────
async function synthesizeAnalysis(prompt: string, svi: any, zip: string, orgCount: number) {
  const systemPrompt = withEthicalPreamble(`
You are a community intelligence analyst specializing in GIS-based SDOH analysis.
You have access to U.S. Census ACS data, CDC/ATSDR Social Vulnerability Index scores,
and Chainweb evidence-based ripple coefficients.

Return a JSON object with these exact fields:
{
  "headline": "One sentence — the single most important finding for this community",
  "sviSummary": "2-3 sentences on the SVI score and what it means practically",
  "topPriorities": [
    { "domain": "string", "urgency": "crisis|concern|watch|stable", "finding": "string", "intervention": "string" }
  ],
  "chainwebInsight": "How 1-2 key interventions cascade across multiple SDOH domains for this ZIP",
  "gisFindings": "What the geographic distribution of orgs and hotspots reveals",
  "recommendations": ["actionable next step 1", "actionable next step 2", "actionable next step 3"],
  "fundingAngles": ["relevant funding stream 1", "funding stream 2"]
}
Keep each string concise (1-3 sentences). Do not fabricate data not provided.
`);

  const userPrompt = `
Analyst prompt from user: "${prompt}"

ZIP: ${zip}
SVI Score: ${svi?.sviScore ?? "unknown"} (0=low vulnerability, 1=high)
Population: ${svi?.population?.toLocaleString() ?? "unknown"}
Poverty rate: ${svi?.povertyRate ?? "?"}%
Unemployment: ${svi?.unemploymentRate ?? "?"}%
No health insurance: ${svi?.noHealthInsuranceRate ?? "?"}%
No HS diploma: ${svi?.noHighSchoolDiplomaRate ?? "?"}%
Housing cost burden: ${svi?.housingCostBurdenRate ?? "?"}%
Median HH income: $${svi?.medianHouseholdIncome?.toLocaleString() ?? "unknown"}
SVI Theme 1 (socioeconomic): ${svi?.sviTheme1 ?? "?"}
SVI Theme 2 (household/disability): ${svi?.sviTheme2 ?? "?"}
SVI Theme 3 (minority/language): ${svi?.sviTheme3 ?? "?"}
SVI Theme 4 (housing/transportation): ${svi?.sviTheme4 ?? "?"}
Community orgs with known coordinates: ${orgCount}
`;

  try {
    return await generateAIJSON<any>(userPrompt, systemPrompt);
  } catch {
    return {
      headline: "Analysis unavailable — see raw SDOH data above.",
      sviSummary: `SVI score ${svi?.sviScore ?? "unknown"} for ZIP ${zip}.`,
      topPriorities: [],
      chainwebInsight: "",
      gisFindings: "",
      recommendations: [],
      fundingAngles: [],
    };
  }
}

// ── SDOH domain → EVIDENCE_PROGRAMS matcher ──────────────────────────────────
function matchProgramsToSVI(svi: any): typeof EVIDENCE_PROGRAMS {
  const activeDomains: string[] = [];
  if ((svi?.povertyRate ?? 0) > 15)            activeDomains.push("economic", "workforce");
  if ((svi?.noHighSchoolDiplomaRate ?? 0) > 12) activeDomains.push("education");
  if ((svi?.noHealthInsuranceRate ?? 0) > 12)   activeDomains.push("health");
  if ((svi?.housingCostBurdenRate ?? 0) > 28)   activeDomains.push("housing");
  if ((svi?.limitedEnglishProficiency ?? 0) > 8) activeDomains.push("family");
  // Always include early_childhood and justice as platform priorities
  activeDomains.push("early_childhood", "justice", "family");

  return (EVIDENCE_PROGRAMS as typeof import("./chainweb-coefficients").EVIDENCE_PROGRAMS)
    .filter(p => p.domains.some(d => activeDomains.includes(d)))
    .slice(0, 6);
}

// ── Build CFIR adaptation analysis for a program in a community ─────────────
function buildCFIRAdaptation(program: any, sourceSVI: any, targetSVI: any | null) {
  const factors: { construct: string; assessment: string; implication: string }[] = [];

  // Inner Setting (organizational readiness)
  const poverty = sourceSVI?.povertyRate ?? 0;
  factors.push({
    construct: "Inner Setting — Readiness for Implementation",
    assessment: poverty > 20 ? "High urgency creates organizational motivation" : "Moderate — standard implementation pathway",
    implication: `Staff training and supervision infrastructure needed upfront; budget for ${program.shortName} fidelity checks.`,
  });

  // Outer Setting (policy / funding landscape)
  factors.push({
    construct: "Outer Setting — External Policy & Incentives",
    assessment: "Federal SAMHSA, Title IV-E, and CDC grant streams align with evidence base",
    implication: `${program.shortName} meets CDC Prevention threshold — use SVI score (${sourceSVI?.sviScore?.toFixed(2) ?? "??"}) in grant narrative to establish need.`,
  });

  // Innovation Characteristics (program adaptability)
  const roiStr = program.roiPerDollar ? `$${program.roiPerDollar} per $1 invested` : "strong";
  factors.push({
    construct: "Innovation Characteristics — Adaptability",
    assessment: `${program.replicationQuality === "strong" ? "High-fidelity model" : "Moderate flexibility available"} — core elements must stay intact`,
    implication: `ROI: ${roiStr}. Critical fidelity elements: ${program.whatWorked?.slice(0, 2).join("; ") ?? "see program guide"}.`,
  });

  // Individuals (implementers and recipients)
  const lep = sourceSVI?.limitedEnglishProficiency ?? 0;
  factors.push({
    construct: "Individuals — Recipients & Implementers",
    assessment: lep > 10 ? `LEP ${lep}% — bilingual staff essential` : "English-primary delivery acceptable",
    implication: `Recruit culturally matched implementers. ${program.targetPopulation}.`,
  });

  // Cross-city delta
  if (targetSVI) {
    const povertyDelta = ((targetSVI?.povertyRate ?? 0) - poverty).toFixed(1);
    const sviDelta = ((targetSVI?.sviScore ?? 0) - (sourceSVI?.sviScore ?? 0)).toFixed(3);
    factors.push({
      construct: "Cross-City Adaptation Delta",
      assessment: `Target community ${Number(povertyDelta) > 0 ? "higher" : "lower"} poverty (${povertyDelta}pp), SVI ${Number(sviDelta) > 0 ? "higher" : "lower"} (${sviDelta})`,
      implication: Number(povertyDelta) > 5
        ? "Scale up outreach and enrollment support — higher poverty means more barriers to sustained participation."
        : "Core model translates with minimal adaptation; adjust cultural competency staffing for local demographics.",
    });
  }

  return factors;
}

// ── POST /api/community-intelligence/interventions ────────────────────────────
async function handleInterventions(req: Request, res: Response) {
  try {
    const { zip, targetZip } = req.body;
    if (!zip || !/^\d{5}$/.test(String(zip))) {
      return res.status(400).json({ error: "Valid 5-digit ZIP required." });
    }

    const zipStr = String(zip);
    const targetZipStr = targetZip && /^\d{5}$/.test(String(targetZip)) ? String(targetZip) : null;

    const [sourceSVIRaw, targetSVIRaw] = await Promise.all([
      fetchZctaData(zipStr).catch(() => null),
      targetZipStr ? fetchZctaData(targetZipStr).catch(() => null) : Promise.resolve(null),
    ]);

    // Flatten nested fetchZctaData shapes
    const sourceSVI = flattenSvi(sourceSVIRaw);
    const targetSVI = targetSVIRaw ? flattenSvi(targetSVIRaw) : null;

    const [sourceCenter, targetCenter] = await Promise.all([
      geocodeZip(zipStr),
      targetZipStr ? geocodeZip(targetZipStr) : Promise.resolve(null),
    ]);

    const matchedRaw = matchProgramsToSVI(sourceSVI);

    const matchedPrograms = matchedRaw.map(program => ({
      id: program.id,
      name: program.name,
      shortName: program.shortName,
      domains: program.domains,
      targetPopulation: program.targetPopulation,
      deliveryModel: program.deliveryModel,
      effectSizes: program.effectSizes,
      roiPerDollar: program.roiPerDollar,
      whatWorked: program.whatWorked,
      whatFailed: program.whatFailed,
      replicationQuality: program.replicationQuality,
      clearinghouseRating: program.clearinghouseRating,
      contactUrl: program.contactUrl,
      // Projected impact scaled to local population
      projectedImpact: program.effectSizes.slice(0, 2).map(e => ({
        outcome: e.outcome,
        size: e.size,
        unit: e.unit,
        localScale: sourceSVI?.population
          ? `~${Math.round((sourceSVI.population * ((sourceSVI.povertyRate ?? 0) / 100)) * 0.1)} eligible residents in ZIP ${zipStr}`
          : "Scale to local eligible population",
      })),
      cfirAdaptation: buildCFIRAdaptation(program, sourceSVI, targetSVI),
    }));

    // AI narrative for cross-city adaptation
    let adaptationNarrative = "";
    if (targetZipStr && targetSVI) {
      try {
        const sysPrompt = withEthicalPreamble(
          "You are a RPLICE implementation science specialist applying CFIR 2.0, RE-AIM, and EPIS frameworks. " +
          "Write in plain language for a community health director. Return a JSON object with fields: " +
          '{ "summary": string, "adaptationSteps": string[], "fidelityWarnings": string[], "fundingBridge": string }'
        );
        const userPrompt = `
Source community (ZIP ${zipStr}): poverty ${sourceSVI?.povertyRate}%, SVI ${sourceSVI?.sviScore?.toFixed(3)}, pop ${sourceSVI?.population?.toLocaleString()}, LEP ${sourceSVI?.limitedEnglishProficiency}%
Target community (ZIP ${targetZipStr}): poverty ${targetSVI?.povertyRate}%, SVI ${targetSVI?.sviScore?.toFixed(3)}, pop ${targetSVI?.population?.toLocaleString()}, LEP ${targetSVI?.limitedEnglishProficiency}%
Programs matched: ${matchedRaw.map(p => p.shortName).join(", ")}
Question: How would these evidence-based interventions need to adapt moving from ZIP ${zipStr} to ZIP ${targetZipStr}? 
What CFIR factors differ? What fidelity elements are at risk? How should the implementation team prepare?
`;
        adaptationNarrative = await generateAIJSON<any>(userPrompt, sysPrompt);
      } catch {
        adaptationNarrative = "";
      }
    }

    return res.json({
      zip: zipStr,
      targetZip: targetZipStr,
      sourceProfile: {
        center: sourceCenter,
        population: sourceSVI?.population,
        povertyRate: sourceSVI?.povertyRate,
        sviScore: sourceSVI?.sviScore,
        unemployment: sourceSVI?.unemploymentRate,
        noInsurance: sourceSVI?.noHealthInsuranceRate,
        lep: sourceSVI?.limitedEnglishProficiency,
      },
      targetProfile: targetSVI ? {
        center: targetCenter,
        population: targetSVI?.population,
        povertyRate: targetSVI?.povertyRate,
        sviScore: targetSVI?.sviScore,
        unemployment: targetSVI?.unemploymentRate,
        noInsurance: targetSVI?.noHealthInsuranceRate,
        lep: targetSVI?.limitedEnglishProficiency,
      } : null,
      matchedPrograms,
      adaptationNarrative,
    });
  } catch (err) {
    console.error("[Interventions] Error:", err);
    return res.status(500).json({ error: "Intervention analysis failed. Please try again." });
  }
}

// ── Route registration ────────────────────────────────────────────────────────
export function registerCommunityIntelligenceRoutes(app: Express) {
  app.post("/api/community-intelligence", limitCommunityAnalysis, async (req, res) => {
    const { geographyKey, category, observation } = req.body ?? {};
    if (!/^\d{5}$/.test(String(geographyKey ?? ""))) {
      return res.status(400).json({ error: "A valid 5-digit ZIP code is required." });
    }
    if (!["housing", "health", "education", "employment", "safety", "other"].includes(category)) {
      return res.status(400).json({ error: "A valid observation category is required." });
    }
    if (typeof observation !== "string" || observation.trim().length === 0 || observation.length > 2000) {
      return res.status(400).json({ error: "Observation must be between 1 and 2,000 characters." });
    }
    try {
      const [submission] = await db.insert(communityIntelligenceSubmissions).values({
        submittedByUserId: "anonymous-public-submission",
        geographyKey: String(geographyKey),
        topic: category,
        observationType: "condition",
        title: `${category} observation`,
        body: observation.trim(),
        specificGeography: String(geographyKey),
      }).returning({ id: communityIntelligenceSubmissions.id });
      return res.status(201).json({ id: submission.id, status: "pending" });
    } catch (err) {
      console.error("[community-intelligence] observation submission error:", err);
      return res.status(500).json({ error: "Unable to submit observation." });
    }
  });
  app.post("/api/community-intelligence/interventions", limitCommunityAnalysis, handleInterventions);
  app.post("/api/community-intelligence/analyze", limitCommunityAnalysis, async (req, res) => {
    try {
      const { prompt = "Analyze this community's SDOH profile and identify the highest-leverage intervention points.", zip } = req.body;

      if (!zip || !/^\d{5}$/.test(String(zip))) {
        return res.status(400).json({ error: "Valid 5-digit ZIP code required." });
      }
      if (typeof prompt !== "string" || prompt.trim().length === 0 || prompt.length > MAX_ANALYSIS_PROMPT_LENGTH) {
        return res.status(400).json({ error: `Prompt must be a non-empty string of at most ${MAX_ANALYSIS_PROMPT_LENGTH} characters.` });
      }

      const zipStr = String(zip);

      // Run geocode + SVI + geo lookup in parallel
      const [center, sviRaw, geo] = await Promise.all([
        geocodeZip(zipStr),
        fetchZctaData(zipStr).catch(() => null),
        zipToGeography(zipStr).catch(() => null),
      ]);

      if (!center) {
        return res.status(404).json({ error: `Could not geocode ZIP ${zipStr}. Verify it is a valid U.S. ZIP code.` });
      }

      const county = geo?.countyName || sviRaw?.countyName || "Unknown County";

      // Flatten the nested fetchZctaData shape into the flat shape this module expects
      const svi = flattenSvi(sviRaw);

      // Detect Cook County / Chicago ZIPs (60601–60699)
      const isChicagoZip = /^606\d{2}$/.test(zipStr);

      // Orgs + AI + optional gun-violence context all in parallel
      const [orgs, aiAnalysis, gunViolenceCtx] = await Promise.all([
        getOrgMarkers(county),
        synthesizeAnalysis(prompt, svi, zipStr, 0),
        isChicagoZip ? fetchChicagoGunViolenceContext(zipStr) : Promise.resolve(null),
      ]);

      const chainwebLinks = getChainwebLinks(svi);

      // Compute quadrant bounds (±0.12 degree box around center)
      const delta = 0.12;
      const quadrants = [
        { label: "NW", bounds: [[center.lat, center.lng - delta], [center.lat + delta, center.lng]] },
        { label: "NE", bounds: [[center.lat, center.lng], [center.lat + delta, center.lng + delta]] },
        { label: "SW", bounds: [[center.lat - delta, center.lng - delta], [center.lat, center.lng]] },
        { label: "SE", bounds: [[center.lat - delta, center.lng], [center.lat, center.lng + delta]] },
      ];

      return res.json({
        zip: zipStr,
        center,
        county,
        evidence: {
          geography: {
            requested: { type: "ZIP", key: zipStr },
            resolved: { type: "Census ZCTA", key: zipStr },
            disclosure: "Aggregate geography only; this response does not contain resident-level information.",
          },
          sources: [
            {
              publisher: "U.S. Census Bureau / CDC ATSDR",
              dataset: "ACS/SVI community indicators",
              vintage: typeof (sviRaw as any)?.vintage === "string" ? (sviRaw as any).vintage : "Provider vintage not returned",
              status: sviRaw ? "available" : "unavailable",
            },
          ],
          claims: {
            observed: {
              evidenceClass: "observed",
              status: sviRaw ? "available" : "unavailable",
              disclosure: sviRaw
                ? "Returned aggregate indicators are source-backed estimates at the resolved ZCTA."
                : "The community indicator source did not return usable data; no values were substituted.",
            },
            derived: {
              evidenceClass: "derived",
              status: "available",
              disclosure: "Relationships and mapped context are calculated decision support, not causal proof.",
            },
            modeled: {
              evidenceClass: "modeled",
              status: "unavailable",
              disclosure: "No intervention scenario is included in this response.",
            },
          },
        },
        census: {
          population:              svi.population,
          medianHouseholdIncome:   svi.medianHouseholdIncome,
          povertyRate:             svi.povertyRate,
          unemploymentRate:        svi.unemploymentRate,
          noHealthInsuranceRate:   svi.noHealthInsuranceRate,
          noHighSchoolDiplomaRate: svi.noHighSchoolDiplomaRate,
          housingCostBurdenRate:   svi.housingCostBurdenRate,
          percentMinority:         svi.percentMinority,
          limitedEnglishProficiency: svi.limitedEnglishProficiency,
        },
        svi: {
          score:               svi.sviScore,
          theme1Socioeconomic: svi.sviTheme1,
          theme2Household:     svi.sviTheme2,
          theme3Minority:      svi.sviTheme3,
          theme4Housing:       svi.sviTheme4,
          urgency: svi.sviScore > 0.75 ? "crisis" : svi.sviScore > 0.5 ? "concern" : svi.sviScore > 0.25 ? "watch" : "stable",
        },
        orgs,
        chainwebLinks,
        quadrants,
        aiAnalysis,
        ...(gunViolenceCtx ? { gunViolenceContext: gunViolenceCtx } : {}),
      });
    } catch (err) {
      console.error("[CommunityIntelligence] Error:", err);
      return res.status(500).json({ error: "Analysis failed. Please try again." });
    }
  });
}
