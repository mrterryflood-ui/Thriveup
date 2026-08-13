/**
 * Grant Conduit — ThriveUp Nationwide Intelligence Layer
 * ═══════════════════════════════════════════════════════
 *
 * TCAF is a conduit. We know the verified community facts, real outcome
 * evidence, and implementation-science rigor that any charitable organization
 * needs to make a winning case to any funder — federal, foundation, state,
 * municipal, corporate — for any geography in the US.
 *
 * This router turns that intelligence into a structured package any org can
 * hand directly to a grant writer or push straight to GPP.
 *
 * Supported applicant types
 *   nonprofit | university | government | rural | tribal | faith | coalition
 *
 * Routes
 *   GET  /api/grant-conduit/org-types       — supported types + eligible grant universe
 *   GET  /api/grant-conduit/readiness       — quick geography readiness check
 *   POST /api/grant-conduit/package         — full intelligence package (the main endpoint)
 *   POST /api/grant-conduit/push-to-gpp     — package + forward to GPP in one call
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "./storage";
import { requireStaff } from "./yhsi-routes";
import {
  grantOpportunities,
  partnerOutcomeSubmissions,
  cedsRegions,
  cedsGoals,
  jobPlacements,
  certificates,
  gunViolenceIncidents,
} from "@shared/schema";
import { desc, sql, eq, ilike, or, and, gte } from "drizzle-orm";
import { generateAIJSON, withEthicalPreamble } from "./ai-provider";
import { getLatestRpliceEvidence } from "./rplice-inbound-routes";

// ── Org-type → funder eligibility keyword map ─────────────────────────────────
// These are the terms funders use in eligibilityCriteria for each applicant type.
const ORG_ELIGIBILITY_KEYWORDS: Record<string, string[]> = {
  nonprofit:   ["501(c)(3)", "nonprofit", "community-based", "charitable", "NGO", "CBO", "not-for-profit"],
  university:  ["higher education", "university", "college", "IHE", "research institution", "academic institution", "postsecondary"],
  government:  ["unit of government", "local government", "municipality", "city", "county", "state agency", "public agency", "unit of local government"],
  rural:       ["rural", "frontier", "rural community", "underserved rural", "rural area", "rural development"],
  tribal:      ["tribal", "tribe", "native american", "american indian", "alaska native", "indigenous", "tribal government"],
  faith:       ["faith-based", "religious organization", "faith community", "congregation", "church", "faith-based organization"],
  coalition:   ["coalition", "consortium", "partnership", "collaborative", "intermediary", "backbone organization", "pass-through"],
};

// Priority grant domains by org type — drives narrative framing + AI context
const ORG_GRANT_DOMAINS: Record<string, string[]> = {
  nonprofit:   ["workforce development", "reentry", "housing stability", "health equity", "youth services", "community development"],
  university:  ["research", "STEM education", "implementation science", "program evaluation", "workforce pipeline", "innovation"],
  government:  ["public safety", "infrastructure", "economic development", "affordable housing", "emergency management", "broadband"],
  rural:       ["rural development", "broadband access", "agricultural resilience", "rural health access", "rural workforce"],
  tribal:      ["tribal sovereignty", "Indigenous health", "language preservation", "economic self-determination", "tribal housing"],
  faith:       ["community services", "food security", "transitional housing", "family stability", "mental health support"],
  coalition:   ["capacity building", "backbone services", "systems change", "collective impact", "intermediary services"],
};

// Federal agency alignment by org type — helps funders see who is most likely to award
const ORG_AGENCY_ALIGNMENT: Record<string, string[]> = {
  nonprofit:   ["DOL", "HHS", "HUD", "USDA", "DOJ", "ACF", "SAMHSA", "AmeriCorps"],
  university:  ["NSF", "NIH", "AHRQ", "DOE", "ED", "DARPA", "NASA"],
  government:  ["HUD", "DOT", "EDA", "EPA", "FEMA", "SBA", "USDA"],
  rural:       ["USDA Rural Development", "EDA", "FCC", "HHS Rural Health", "HRSA"],
  tribal:      ["BIA", "IHS", "HUD IHBG", "DOJ Tribal", "ACF Tribal", "EPA Tribal"],
  faith:       ["HHS", "AmeriCorps", "ACF", "USDA", "SAMHSA"],
  coalition:   ["HHS", "DOL", "HUD", "ACF", "EDA", "AmeriCorps"],
};

// ── Build RPLICE evidence summary from live inbound events ────────────────────
function buildRpliceEvidence() {
  const events = getLatestRpliceEvidence();
  if (!events.length) return null;

  const latest          = events[0];
  const fidelityEvent   = events.find(e => e.eventType === "fidelity_assessment" && e.fidelityScore != null);
  const cifrEvent       = events.find(e => e.eventType === "cfir_assessment");
  const reaimEvent      = events.find(e => e.eventType === "reaim_evaluation");
  const strongEvidence  = events.filter(e => e.evidenceLevel === "strong").slice(0, 3);
  const allCitations    = events.flatMap(e => e.citations ?? []).filter(Boolean).slice(0, 10);
  const allFrameworks   = [...new Set(events.map(e => e.framework).filter(Boolean))] as string[];
  const allPrograms     = [...new Set(events.map(e => e.program).filter(Boolean))] as string[];

  return {
    fidelityScore:      fidelityEvent?.fidelityScore ?? null,
    evidenceLevel:      latest.evidenceLevel ?? "emerging",
    latestFinding:      latest.finding ?? null,
    frameworksApplied:  allFrameworks,
    cifrAssessment:     cifrEvent?.finding ?? null,
    reaimEvaluation:    reaimEvent?.finding ?? null,
    strongFindings:     strongEvidence.map(e => e.finding).filter(Boolean) as string[],
    citations:          allCitations as string[],
    lastUpdated:        latest.receivedAt,
    programsAssessed:   allPrograms,
    qualityGate:        events.some(e => e.eventType === "quality_gate_review") ? "passed" : "pending",
    grantNarrativeFeedback: events
      .filter(e => e.eventType === "grant_narrative_feedback")
      .slice(0, 2)
      .map(e => e.finding)
      .filter(Boolean) as string[],
  };
}

// ── Compute grant readiness score ─────────────────────────────────────────────
function computeReadiness(opts: {
  hasRegion: boolean;
  hasRplice: boolean;
  hasOutcomes: boolean;
  hasGrants: boolean;
  hasMission: boolean;
  hasIdentity: boolean;
}) {
  const checks = [
    { item: "CEDS regional alignment documented",            weight: 15, met: opts.hasRegion },
    { item: "RPLICE implementation evidence (CFIR/RE-AIM)", weight: 25, met: opts.hasRplice },
    { item: "Platform outcome data (real enrollments)",      weight: 20, met: opts.hasOutcomes },
    { item: "Matching grant opportunities found",            weight: 15, met: opts.hasGrants },
    { item: "Mission statement and focus areas provided",    weight: 15, met: opts.hasMission },
    { item: "Org identity (EIN or UEI) provided",            weight: 10, met: opts.hasIdentity },
  ];
  const score = checks.reduce((a, c) => a + (c.met ? c.weight : 0), 0);
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : "D";
  return { score, max: 100, grade, checklist: checks };
}

// ── Rate limiting for /package (AI + DB intensive) ───────────────────────────
const packageRateMap = new Map<string, { count: number; resetAt: number }>();
function checkPackageRate(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const limit = 10;
  let entry = packageRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + window };
    packageRateMap.set(ip, entry);
  }
  entry.count++;
  return entry.count <= limit;
}

export const grantConduitRouter = Router();

// ── GET /org-types ────────────────────────────────────────────────────────────
grantConduitRouter.get("/org-types", (_req: Request, res: Response) => {
  return res.json({
    conduit: {
      description: "ThriveUp serves as a nationwide grant intelligence conduit. Any charitable organization — city, rural community, nonprofit, college, tribe, faith org, coalition — can receive a verified evidence package that backs their grant application with real community data, RPLICE research rigor, and platform-proven outcomes.",
      coverage: { states: 50, languages: 107, serviceCategories: 25, aiEngines: 4 },
    },
    supported: Object.entries(ORG_ELIGIBILITY_KEYWORDS).map(([type, keywords]) => ({
      type,
      eligibilityKeywords: keywords,
      priorityDomains:     ORG_GRANT_DOMAINS[type] ?? [],
      agencyAlignment:     ORG_AGENCY_ALIGNMENT[type] ?? [],
    })),
    usage: "POST /api/grant-conduit/package with orgType to receive your intelligence package.",
  });
});

// ── GET /readiness ────────────────────────────────────────────────────────────
grantConduitRouter.get("/readiness", async (req: Request, res: Response) => {
  const { zip, state } = req.query as { zip?: string; state?: string };
  if (!state) return res.status(400).json({ error: "state query param is required" });

    const [region] = await db.select().from(cedsRegions)
      .where(eq(cedsRegions.state, state)).limit(1);

  const rplice = buildRpliceEvidence();

    const [outcomeRow] = await db.select({
      participantsServed:  sql<number>`coalesce(sum(${partnerOutcomeSubmissions.participantsServed}), 0)`,
      enteredEmployment:   sql<number>`coalesce(sum(${partnerOutcomeSubmissions.enteredEmployment}), 0)`,
      credentialsAttained: sql<number>`coalesce(sum(${partnerOutcomeSubmissions.credentialsAttained}), 0)`,
      medianEarnings:      sql<number>`coalesce(avg(${partnerOutcomeSubmissions.medianEarnings}), 0)`,
    }).from(partnerOutcomeSubmissions);

    const pServedCount = Number(outcomeRow?.participantsServed ?? 0);
    const readiness = computeReadiness({
      hasRegion:   !!region,
      hasRplice:   !!rplice,
      hasOutcomes: pServedCount > 0,
      hasGrants:   false,    // grants not queried in readiness endpoint
      hasMission:  false,    // mission not a query param for readiness
      hasIdentity: false,    // ein/uei not provided in readiness check
    });

  return res.json({
    geography: { zip: zip ?? null, state: state.toUpperCase() },
    cedsRegion: region ?? null,
    rpliceEvidence: rplice
      ? { evidenceLevel: rplice.evidenceLevel, fidelityScore: rplice.fidelityScore, qualityGate: rplice.qualityGate }
      : null,
    platformOutcomes: { participantsServed: pServedCount },
    readiness,
    nextStep: "POST /api/grant-conduit/package with orgType, geography, missionText, and focusAreas to receive your full package.",
  });
});

// ── POST /package — the main intelligence engine ──────────────────────────────
grantConduitRouter.post("/package", async (req: Request, res: Response) => {
  const ip = req.ip || "unknown";
  if (!checkPackageRate(ip)) {
    return res.status(429).json({ error: "Rate limit: 10 package requests per minute per IP." });
  }
  try {
    const {
      orgType          = "nonprofit",
      orgName,
      ein,
      uei,
      is501c3,
      geography,
      populationsServed = [],
      missionText,
      focusAreas        = [],
      targetGrantTypes,           // optional: ["federal","foundation","state","city"]
      generateNarratives = true,
    } = req.body as {
      orgType?:          string;
      orgName?:          string;
      ein?:              string;
      uei?:              string;
      is501c3?:          boolean;
      geography:         { zip?: string; state: string; county?: string; city?: string };
      populationsServed?: string[];
      missionText?:      string;
      focusAreas?:       string[];
      targetGrantTypes?: string[];
      generateNarratives?: boolean;
    };

    if (!geography?.state) return res.status(400).json({ error: "geography.state is required" });
    const state = geography.state.toUpperCase();

    // ── 1. CEDS regional intelligence ─────────────────────────────────────────
    const [region] = await db.select().from(cedsRegions)
      .where(eq(cedsRegions.state, state)).limit(1);
    const regionGoals = region
      ? await db.select().from(cedsGoals).where(eq(cedsGoals.regionId, region.id)).limit(10)
      : [];

    // ── 2. Grant matching — org-type-aware ────────────────────────────────────
    const eligibilityTerms = ORG_ELIGIBILITY_KEYWORDS[orgType] ?? ORG_ELIGIBILITY_KEYWORDS.nonprofit;

    // Pull broad set sorted by fit score, then filter client-side for eligibility
    const allGrants = await db.select({
      id:                  grantOpportunities.id,
      title:               grantOpportunities.title,
      agency:              grantOpportunities.agency,
      fundingAmount:       grantOpportunities.fundingAmount,
      deadline:            grantOpportunities.deadline,
      description:         grantOpportunities.description,
      eligibilityCriteria: grantOpportunities.eligibilityCriteria,
      focusAreas:          grantOpportunities.focusAreas,
      fitScore:            grantOpportunities.fitScore,
      cfda:                grantOpportunities.cfda,
      sourceUrl:           grantOpportunities.sourceUrl,
      grantType:           grantOpportunities.grantType,
      awardCeiling:        grantOpportunities.awardCeiling,
      awardFloor:          grantOpportunities.awardFloor,
      category:            grantOpportunities.category,
    }).from(grantOpportunities)
      .orderBy(desc(grantOpportunities.fitScore))
      .limit(300);

    const lowerTerms   = eligibilityTerms.map(t => t.toLowerCase());
    const lowerFocus   = focusAreas.map(f => f.toLowerCase());
    const lowerDomains = (ORG_GRANT_DOMAINS[orgType] ?? []).map(d => d.toLowerCase());
    const lowerTargetTypes = (targetGrantTypes ?? []).map(t => t.toLowerCase());

    const matched = allGrants.filter(g => {
      const elig  = (g.eligibilityCriteria ?? "").toLowerCase();
      const desc2 = (g.description ?? "").toLowerCase();
      const title = (g.title ?? "").toLowerCase();
      const gfa   = (g.focusAreas as string[] ?? []).map(f => f.toLowerCase());

      const termHit   = lowerTerms.some(t => elig.includes(t) || desc2.includes(t));
      const focusHit  = lowerFocus.length === 0 || lowerFocus.some(f => gfa.some(fa => fa.includes(f)) || desc2.includes(f) || title.includes(f));
      const domainHit = lowerDomains.some(d => desc2.includes(d) || title.includes(d) || gfa.some(fa => fa.includes(d)));
      const typeHit   = lowerTargetTypes.length === 0 || lowerTargetTypes.includes((g.grantType ?? "").toLowerCase());

      return (termHit || domainHit) && focusHit && typeHit;
    });

    const topGrants = matched.slice(0, 20);

    // ── 3. RPLICE evidence ────────────────────────────────────────────────────
    const rpliceEvidence = buildRpliceEvidence();

    // ── 4. Gun violence intelligence ──────────────────────────────────────────
    // Pull 90-day window for the requested geography.
    const gvWindow = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const gvConditions = [
      gte(gunViolenceIncidents.occurredAt, gvWindow),
      eq(gunViolenceIncidents.state, state),
      ...(geography.zip ? [eq(gunViolenceIncidents.zip, geography.zip)] : []),
    ];
    const [gvTotals] = await db.select({
      incidents:  sql<number>`count(*)::int`,
      victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
      fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
    }).from(gunViolenceIncidents).where(and(...gvConditions));

    // Monthly trend (last 12 months, state-level)
    const gvTrendWindow = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const gvTrend = await db.select({
      month:      sql<string>`to_char(date_trunc('month', ${gunViolenceIncidents.occurredAt}), 'YYYY-MM')`,
      incidents:  sql<number>`count(*)::int`,
      victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
      fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
    }).from(gunViolenceIncidents)
      .where(and(gte(gunViolenceIncidents.occurredAt, gvTrendWindow), eq(gunViolenceIncidents.state, state)))
      .groupBy(sql`date_trunc('month', ${gunViolenceIncidents.occurredAt})`)
      .orderBy(sql`date_trunc('month', ${gunViolenceIncidents.occurredAt})`);

    const gvIncidents = Number(gvTotals?.incidents ?? 0);
    const gvVictims   = Number(gvTotals?.victims   ?? 0);
    const gvFatal     = Number(gvTotals?.fatalities ?? 0);

    // Violence-triggered grant categories — when incident counts are non-zero,
    // surface these funder categories explicitly so nonprofits don't miss them.
    const violenceGrantCategories = gvIncidents > 0 ? [
      { agency: "DOJ / OJJDP", program: "Second Chance Act", cfda: "16.812", reason: "Reentry + violence prevention for returning citizens" },
      { agency: "CDC / NCIPC", program: "Violence Prevention", cfda: "93.136", reason: "Community-based violence intervention programs" },
      { agency: "DOJ / BJA", program: "Byrne JAG", cfda: "16.738", reason: "Local law enforcement + community violence programs" },
      { agency: "HHS / SAMHSA", program: "Community Mental Health", cfda: "93.958", reason: "Trauma-informed care for violence-affected populations" },
    ] : [];

    // ── 5. Platform outcome aggregate ─────────────────────────────────────────
    const [outcomeRow] = await db.select({
      participantsServed:  sql<number>`coalesce(sum(${partnerOutcomeSubmissions.participantsServed}), 0)`,
      enteredEmployment:   sql<number>`coalesce(sum(${partnerOutcomeSubmissions.enteredEmployment}), 0)`,
      credentialsAttained: sql<number>`coalesce(sum(${partnerOutcomeSubmissions.credentialsAttained}), 0)`,
      medianEarnings:      sql<number>`coalesce(avg(${partnerOutcomeSubmissions.medianEarnings}), 0)`,
    }).from(partnerOutcomeSubmissions);

    const [placementsRow] = await db.select({ total: sql<number>`count(*)` }).from(jobPlacements);
    const [certsRow]      = await db.select({ total: sql<number>`count(*)` }).from(certificates);

    const pServed = Number(outcomeRow?.participantsServed ?? 0);
    const pEmployed = Number(outcomeRow?.enteredEmployment ?? 0);
    const outcomes = {
      participantsServed:  pServed,
      enteredEmployment:   pEmployed,
      credentialsAttained: Number(outcomeRow?.credentialsAttained ?? 0),
      medianEarnings:      Math.round(Number(outcomeRow?.medianEarnings ?? 0)),
      jobPlacementsTotal:  Number(placementsRow?.total ?? 0),
      certificatesEarned:  Number(certsRow?.total ?? 0),
      employmentRate:      pServed > 0 ? Math.round((pEmployed / pServed) * 100) : 0,
    };

    // ── 5. Grant readiness ────────────────────────────────────────────────────
    const readiness = computeReadiness({
      hasRegion:   !!region,
      hasRplice:   !!rpliceEvidence,
      hasOutcomes: pServed > 0,
      hasGrants:   topGrants.length > 0,
      hasMission:  !!(missionText && focusAreas.length > 0),
      hasIdentity: !!(ein || uei),
    });

    // ── 6. AI narrative generation ────────────────────────────────────────────
    // Each section is a grant-ready paragraph grounded in the verified facts above.
    let narratives: Record<string, string> = {};
    if (generateNarratives && missionText) {
      const contextFacts = [
        `ORGANIZATION: ${orgName ?? "Applicant organization"} | Type: ${orgType} | Geography: ${geography.city ?? ""}${geography.county ? `, ${geography.county}` : ""}, ${state}${geography.zip ? ` (ZIP ${geography.zip})` : ""}`,
        `MISSION: ${missionText}`,
        `POPULATIONS SERVED: ${populationsServed.join(", ") || "community residents"}`,
        `FOCUS AREAS: ${focusAreas.join(", ") || ORG_GRANT_DOMAINS[orgType]?.join(", ")}`,
        region
          ? `ECONOMIC DEVELOPMENT REGION (CEDS): ${region.eddName}${region.eddAbbr ? ` (${region.eddAbbr})` : ""}. Regional vision: "${region.strategicVision ?? "equitable regional prosperity"}". Population served: ${(region.populationServed ?? 0).toLocaleString()}. ${region.distressedDesignation ? "DESIGNATED DISTRESSED COMMUNITY (EDA)." : ""}`
          : "",
        regionGoals.length
          ? `CEDS STRATEGIC GOALS: ${regionGoals.slice(0, 4).map((g: any) => g.goalTitle ?? g.goal ?? "").filter(Boolean).join("; ")}`
          : "",
        rpliceEvidence
          ? [
              `RESEARCH EVIDENCE (RPLICE): Evidence level = ${rpliceEvidence.evidenceLevel}. Fidelity score: ${rpliceEvidence.fidelityScore ?? "pending assessment"}. Quality gate: ${rpliceEvidence.qualityGate}.`,
              rpliceEvidence.cifrAssessment ? `CFIR assessment: ${rpliceEvidence.cifrAssessment}` : "",
              rpliceEvidence.reaimEvaluation ? `RE-AIM evaluation: ${rpliceEvidence.reaimEvaluation}` : "",
              rpliceEvidence.strongFindings.length ? `Strong evidence findings: ${rpliceEvidence.strongFindings.join("; ")}` : "",
              rpliceEvidence.citations.length ? `Citations: ${rpliceEvidence.citations.slice(0, 5).join("; ")}` : "",
            ].filter(Boolean).join(" ")
          : "RESEARCH EVIDENCE: RPLICE implementation science assessment in progress.",
        `PLATFORM OUTCOMES (verified): ${pServed.toLocaleString()} participants served | ${outcomes.employmentRate}% employment rate | ${outcomes.credentialsAttained.toLocaleString()} credentials attained | ${outcomes.jobPlacementsTotal.toLocaleString()} job placements | Median earnings: $${outcomes.medianEarnings.toLocaleString()}`,
        gvIncidents > 0
          ? `GUN VIOLENCE REGISTRY (last 90 days, ${state}${geography.zip ? ` ZIP ${geography.zip}` : ""}): ${gvIncidents} incidents | ${gvVictims} victims | ${gvFatal} fatalities. This is verified incident-level data from the TCAF Gun Violence Registry — cite it directly in the needs statement. Priority grant programs triggered: DOJ/OJJDP Second Chance Act (CFDA 16.812), CDC Violence Prevention (CFDA 93.136), DOJ/BJA Byrne JAG (CFDA 16.738), SAMHSA Community Mental Health (CFDA 93.958).`
          : "GUN VIOLENCE REGISTRY: No incidents on record for this geography in the last 90 days.",
        `FUNDING LANDSCAPE: ${topGrants.length} matched grant opportunities identified. Top agencies: ${[...new Set(topGrants.slice(0, 5).map(g => g.agency).filter(Boolean))].join(", ")}.`,
        `TCAF ECOSYSTEM CONTEXT: ThriveUp Academy — 501(c)(3), CAGE 9VKK3, EIN 41-3618003, SAM.gov active. 15 service platforms, 107 languages, 4 AI engines, serving all 50 states as architecture. This ecosystem provides the technology backbone, evaluation infrastructure, and data credibility behind this application.`,
      ].filter(Boolean).join("\n\n");

      const systemPrompt = withEthicalPreamble(
        `You are a senior federal grant writer with 20 years of experience winning awards from DOL, HHS, HUD, NSF, NIH, DOE, and major foundations. You write exclusively from verified facts — you never fabricate statistics, invent programs, or exaggerate outcomes. Your writing is precise, compelling, and reviewer-ready.

You are writing on behalf of a ${orgType} organization. Use the verified community and outcome data below as the factual backbone of every section. Where data is strong, lead with numbers. Where data is pending, frame the readiness infrastructure honestly.

VERIFIED FACTS FOR THIS PACKAGE:
${contextFacts}

Return ONLY valid JSON (no markdown, no code fences, no explanation) with exactly these keys:
- needsStatement: 3 paragraphs. Open with the geographic and population context. Use the CEDS regional designation if distressed. Cite the RPLICE evidence level and platform outcomes. Close with the cost-of-inaction argument.
- targetPopulation: 2 paragraphs. Describe who is served, the barriers they face, and why this org is uniquely positioned. Reference populations served and geography.
- evidenceBase: 2-3 paragraphs. Ground the intervention in the RPLICE findings (CFIR/RE-AIM frameworks, fidelity score, evidence level). Cite any available citations. If evidence is emerging, frame the evaluation design as the contribution.
- evaluationPlan: 2 paragraphs. Describe the evaluation methodology using CFIR/RE-AIM if RPLICE evidence is available, otherwise a logic model approach. Reference the platform data infrastructure as the measurement system.
- organizationalCapacity: 2 paragraphs. Describe the organization's track record, the TCAF technology ecosystem as backbone infrastructure, and the 15-platform reach as scale evidence. Include SAM.gov active status and 501(c)(3) as compliance evidence for federal awards.
- executiveSummary: 1 paragraph. A 150-word program officer opener that names the funder priority, the geography, the population, the intervention, and the expected outcomes.`
      );

      try {
        narratives = await generateAIJSON<Record<string, string>>(
          "Generate the six grant narrative sections based on the verified facts provided.",
          systemPrompt
        ) ?? {};
      } catch {
        narratives = { note: "Narrative generation unavailable — the data package is complete for manual writing." };
      }
    }

    // ── 7. Compose and return ─────────────────────────────────────────────────
    return res.json({
      generatedAt:   new Date().toISOString(),
      conduitVersion: "2.0",

      orgProfile: {
        orgType,
        orgName:  orgName  ?? null,
        ein:      ein      ?? null,
        uei:      uei      ?? null,
        is501c3:  is501c3  ?? null,
        agencyAlignment:    ORG_AGENCY_ALIGNMENT[orgType] ?? [],
        eligibilityKeywords: eligibilityTerms,
      },

      geography,
      readiness,

      cedsRegion: region ? {
        id:                   region.id,
        name:                 region.eddName,
        abbr:                 region.eddAbbr,
        state:                region.state,
        strategicVision:      region.strategicVision,
        populationServed:     region.populationServed,
        distressedDesignation: region.distressedDesignation,
        edaDistrictId:        region.edaDistrictId,
        goals: regionGoals.slice(0, 6).map((g: any) => ({
          title:       g.goalTitle ?? g.goal ?? "",
          description: g.description ?? "",
          pm:          g.performanceMeasure ?? null,
        })),
      } : null,

      rpliceEvidence,

      outcomeMetrics: outcomes,

      // The 15 matched opportunities best aligned to this org type and focus areas
      matchedOpportunities: topGrants.map(g => ({
        id:                  g.id,
        title:               g.title,
        agency:              g.agency,
        fundingAmount:       g.fundingAmount,
        awardFloor:          g.awardFloor,
        awardCeiling:        g.awardCeiling,
        deadline:            g.deadline,
        fitScore:            g.fitScore,
        cfda:                g.cfda,
        grantType:           g.grantType,
        category:            g.category,
        sourceUrl:           g.sourceUrl,
        eligibilityCriteria: g.eligibilityCriteria,
        focusAreas:          g.focusAreas,
      })),

      gunViolence: {
        windowDays: 90,
        geography: { state, zip: geography.zip ?? null },
        incidents:  gvIncidents,
        victims:    gvVictims,
        fatalities: gvFatal,
        monthlyTrend: gvTrend,
        triggeredGrantCategories: violenceGrantCategories,
        policyTimelineEndpoint: `/api/gun-violence/policy-timeline?state=${state}${geography.zip ? `&zip=${geography.zip}` : ""}`,
        note: gvIncidents > 0
          ? "Violence data is drawn from the TCAF Gun Violence Registry. Cite directly in needs statements — verified incident-level data, not estimates."
          : "No incidents on record for this geography in the last 90 days. Omit violence context from narratives.",
      },

      narratives: generateNarratives && missionText
        ? narratives
        : { note: "Provide missionText in your request body to generate AI-drafted narrative sections." },

      // Contextual intelligence for the grant writer
      grantWriterContext: {
        cedsFramework:        "EDA Comprehensive Economic Development Strategy — PM1 per capita income, PM2 unemployment, PM3 poverty, PM4 employment, PM5 economic complexity",
        rpliceFramework:      "CFIR (Consolidated Framework for Implementation Research) + RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance)",
        platformEcosystem:    "15 service platforms | 107 languages | 4 AI engines | 50 states (architecture) | CAGE 9VKK3 | EIN 41-3618003",
        conduitStatement:     "ThriveUp Academy is a 501(c)(3) nonprofit serving as the technology backbone, data infrastructure, and evaluation engine for this application. Outcome data is drawn from real platform enrollments, not projections.",
        priorityDomains:      ORG_GRANT_DOMAINS[orgType] ?? [],
      },

      meta: {
        totalGrantsSearched:  allGrants.length,
        eligibleMatchesFound: matched.length,
        orgType,
        focusAreas,
        populationsServed,
      },
    });

  } catch (err) {
    console.error("[GrantConduit] package error:", (err as any)?.message);
    return res.status(500).json({ error: "Failed to build grant intelligence package" });
  }
});

// ── POST /push-to-gpp — package + forward to GPP in one step ─────────────────
grantConduitRouter.post("/push-to-gpp", requireStaff, async (req: Request, res: Response) => {
  const gppUrl = process.env.GPP_API_URL;
  const gppKey = process.env.THRIVE_GPP_API_KEY;

  // Build the intelligence package first (same logic as /package)
  const packageRes = await fetch(`http://localhost:5000/api/grant-conduit/package`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });
  const pkg = await packageRes.json();

  if (!gppUrl) {
    return res.json({ sent: false, preview: pkg, note: "GPP_API_URL not set — returning preview payload." });
  }

  try {
    const r = await fetch(`${gppUrl}/api/inbound/conduit-package`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${gppKey ?? ""}` },
      body: JSON.stringify({ source: "thriveup-grant-conduit", sentAt: new Date().toISOString(), package: pkg }),
      signal: AbortSignal.timeout(15_000),
    });
    const response = r.ok ? await r.json().catch(() => ({ status: r.status })) : { status: r.status, statusText: r.statusText };
    return res.json({ sent: true, response, packageReadiness: pkg.readiness });
  } catch (e: any) {
    return res.json({ sent: false, error: e.message, preview: pkg });
  }
});
