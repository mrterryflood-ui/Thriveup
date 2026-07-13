/**
 * Community Intelligence API
 * Prompt-driven GIS + SDOH analysis.
 * Returns: geocoded center, multi-layer SVI data, community org markers,
 * Chainweb ripple links, and AI synthesis — all in one call.
 */
import type { Express } from "express";
import { db } from "./storage";
import { benefitsPartners, communityPrograms } from "@shared/schema";
import { eq, or, isNotNull } from "drizzle-orm";
import { fetchZctaData, zipToGeography } from "./neighborhood-routes";
import { generateAIJSON } from "./ai-provider";
import { CHAINWEB_COEFFICIENTS, CHAINWEB_DOMAINS, EVIDENCE_PROGRAMS } from "./chainweb-coefficients";
import { withEthicalPreamble } from "./ai-provider";

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
async function getOrgMarkers(county: string) {
  try {
    const partners = await db
      .select({
        id: benefitsPartners.id,
        name: benefitsPartners.name,
        type: benefitsPartners.organizationType,
        services: benefitsPartners.servicesOffered,
        benefits: benefitsPartners.benefitTypes,
        address: benefitsPartners.address,
        lat: benefitsPartners.latitude,
        lng: benefitsPartners.longitude,
        phone: benefitsPartners.contactPhone,
        languages: benefitsPartners.languages,
        capacity: benefitsPartners.capacity,
      })
      .from(benefitsPartners)
      .where(eq(benefitsPartners.isActive, true));

    return partners.filter(p => p.lat && p.lng).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type || "service",
      services: p.services || [],
      benefits: p.benefits || [],
      address: p.address || "",
      lat: p.lat!,
      lng: p.lng!,
      phone: p.phone || "",
      languages: p.languages || [],
      capacity: p.capacity || null,
    }));
  } catch {
    return [];
  }
}

// ── Extract relevant Chainweb coefficients for high-vulnerability domains ───
function getChainwebLinks(sviData: any) {
  const priority: string[] = [];
  if (sviData.povertyRate > 15) priority.push("poverty", "income", "employment");
  if (sviData.unemploymentRate > 8) priority.push("workforce", "employment");
  if (sviData.noHealthInsuranceRate > 15) priority.push("health", "healthcare");
  if (sviData.noHighSchoolDiplomaRate > 15) priority.push("education");
  if (sviData.housingCostBurdenRate > 30) priority.push("housing");

  return CHAINWEB_COEFFICIENTS
    .filter(c =>
      priority.some(k =>
        c.cause.toLowerCase().includes(k) ||
        c.effect.toLowerCase().includes(k)
      )
    )
    .slice(0, 8)
    .map(c => ({
      cause: c.cause,
      effect: c.effect,
      coefficient: c.coefficient,
      direction: c.coefficient > 0 ? "positive" : "negative",
      magnitude: Math.abs(c.coefficient) > 1 ? "high" : Math.abs(c.coefficient) > 0.3 ? "medium" : "low",
      citation: c.citation,
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
async function handleInterventions(req: any, res: any) {
  try {
    const { zip, targetZip } = req.body;
    if (!zip || !/^\d{5}$/.test(String(zip))) {
      return res.status(400).json({ error: "Valid 5-digit ZIP required." });
    }

    const zipStr = String(zip);
    const targetZipStr = targetZip && /^\d{5}$/.test(String(targetZip)) ? String(targetZip) : null;

    const [sourceSVI, targetSVI] = await Promise.all([
      fetchZctaData(zipStr).catch(() => null),
      targetZipStr ? fetchZctaData(targetZipStr).catch(() => null) : Promise.resolve(null),
    ]);

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
          ? `~${Math.round((sourceSVI.population * (sourceSVI.povertyRate / 100)) * 0.1)} eligible residents in ZIP ${zipStr}`
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
  app.post("/api/community-intelligence/interventions", handleInterventions);
  app.post("/api/community-intelligence/analyze", async (req, res) => {
    try {
      const { prompt = "Analyze this community's SDOH profile and identify the highest-leverage intervention points.", zip } = req.body;

      if (!zip || !/^\d{5}$/.test(String(zip))) {
        return res.status(400).json({ error: "Valid 5-digit ZIP code required." });
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

      const county = geo?.countyName || "Unknown County";

      // Orgs + Chainweb + AI in parallel once we have SVI
      const [orgs, aiAnalysis] = await Promise.all([
        getOrgMarkers(county),
        synthesizeAnalysis(prompt, sviRaw, zipStr, 0),
      ]);

      const chainwebLinks = getChainwebLinks(sviRaw || {});

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
        stateName: geo ? undefined : undefined,
        census: {
          population: sviRaw?.population,
          medianHouseholdIncome: sviRaw?.medianHouseholdIncome,
          povertyRate: sviRaw?.povertyRate,
          unemploymentRate: sviRaw?.unemploymentRate,
          noHealthInsuranceRate: sviRaw?.noHealthInsuranceRate,
          noHighSchoolDiplomaRate: sviRaw?.noHighSchoolDiplomaRate,
          housingCostBurdenRate: sviRaw?.housingCostBurdenRate,
          percentMinority: sviRaw?.percentMinority,
          limitedEnglishProficiency: sviRaw?.limitedEnglishProficiency,
        },
        svi: {
          score: sviRaw?.sviScore,
          theme1Socioeconomic: sviRaw?.sviTheme1,
          theme2Household: sviRaw?.sviTheme2,
          theme3Minority: sviRaw?.sviTheme3,
          theme4Housing: sviRaw?.sviTheme4,
          urgency: sviRaw?.sviScore > 0.75 ? "crisis" : sviRaw?.sviScore > 0.5 ? "concern" : sviRaw?.sviScore > 0.25 ? "watch" : "stable",
        },
        orgs,
        chainwebLinks,
        quadrants,
        aiAnalysis,
      });
    } catch (err) {
      console.error("[CommunityIntelligence] Error:", err);
      return res.status(500).json({ error: "Analysis failed. Please try again." });
    }
  });
}
