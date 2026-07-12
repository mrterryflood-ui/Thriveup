/**
 * RPLICE Maximum Intelligence Package
 * ─────────────────────────────────────
 * Centralizes every data source RPLICE has to offer into a single package
 * used by the conductor, collaborative-ai, and GrantPathPro export.
 *
 * Live platform: https://www.bettersciencelab.com (100+ implementation science tools)
 *
 * Public API endpoints (no auth required):
 *  • GET /api/research          — 49 curated implementation science studies
 *                                 (CFIR 24, RE-AIM 25, EPIS 9, PRISM 7, TDF 6, i-PARIHS 4)
 *  • GET /api/frameworks/list   — RE-AIM + EPIS full structured frameworks
 *                                 (dimensions, indicators, metrics, key questions)
 *  • GET /api/v1/health         — platform health check
 *
 * Authenticated endpoints (need Bearer API key — /api/v1/frameworks includes
 * CFIR/PRISM/TDF/i-PARIHS; /api/grants; /api/research/categories):
 *  • GET /api/v1/frameworks     — full framework library (6+ frameworks)
 *  • GET /api/grants            — grant finder and alignment data
 *  • GET /api/research/categories,tags,sources,count
 *
 * bettersciencelab.com tools surface (~1000 live data sources aggregated):
 *  CFIR tools · SALP distributed/monitor/validation · grant-alignment/finder ·
 *  equity-evaluation · federal-integrations · external-data-feeds · GIS ·
 *  disease-surveillance · climate/heat-prevention · needs-assessment ·
 *  barriers-facilitators-wizard · adaptation-wizard · sustainability-wizard ·
 *  implementation-strategy-wizard · CHW hub · mixed-methods · and 80+ more
 *
 * ThriveUp DB:
 *  2. rpliceAssessments (cfir, reaim, fidelity, three_realities,
 *                         community_analysis, multi_ai_analysis, grant_narrative)
 *     rpliceActionPlans (active 90-day plans with milestones)
 *     outcomeBaselines   (active metric baselines with targets)
 *  3. Bridge intelligence            — generateRpliceHeartbeatIntelligence()
 *  4. Grant profile matching         — 8 funder profiles (BB Collective, Rare Impact,
 *     St. David's, Austin FC, SSG Fox, DOJ/BJA, SAMHSA, WIOA Title I)
 *  5. Platform matching              — 24 ecosystem platforms × risk factors
 *  6. Analytical frameworks          — CFIR 2.0 / RE-AIM / Three Realities /
 *     SALP / MAP-GAP / ACEs / RNR / gentrification detection
 */

import { db } from "./storage";
import {
  rpliceAssessments,
  rpliceActionPlans,
  outcomeBaselines,
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { generateRpliceHeartbeatIntelligence } from "./ecosystem-rplice-bridge";

const RPLICE_BASE = "https://www.bettersciencelab.com";

async function fetchRpliceLive(path: string, timeout = 10000): Promise<any> {
  try {
    const resp = await fetch(`${RPLICE_BASE}${path}`, {
      signal: AbortSignal.timeout(timeout),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Filter the full /api/research library (49 studies) by keywords.
 * Used instead of /api/research/search which requires CSRF tokens.
 */
function filterResearchByKeywords(studies: any[], keywords: string[]): any[] {
  if (!studies?.length || !keywords?.length) return studies || [];
  const terms = keywords.map(k => k.toLowerCase());
  return studies.filter(s => {
    const text = [
      s.title, s.abstract, s.journal,
      ...(s.keywords || []), ...(s.frameworks || []), s.category,
    ].join(" ").toLowerCase();
    return terms.some(t => text.includes(t));
  });
}

// ─── Grant Profile Definitions ───────────────────────────────────────────────
// Each profile has the funder voice, focus areas, and domain tags so we can
// match automatically from community risk factors.

export const RPLICE_GRANT_PROFILES: Record<string, {
  name: string;
  funder: string;
  voice: string;
  focusAreas: string[];
  domains: string[];
  federalAgency?: string;
  typicalAward?: string;
  cfirEmphasis: string[];
  reaimPriority: string[];
}> = {
  "bb-collective": {
    name: "BB Collective Research Grant",
    funder: "BB Collective",
    voice: "Academic research methodology — emphasize study design, evidence base, peer-reviewed literature, replicability, and methodological rigor. Formal academic tone with citations and theoretical frameworks.",
    focusAreas: ["research methodology", "implementation science", "evidence-based practice", "community-based participatory research"],
    domains: ["research", "education"],
    cfirEmphasis: ["Innovation Characteristics", "Implementation Process"],
    reaimPriority: ["Effectiveness", "Adoption"],
  },
  "rare-impact": {
    name: "Rare Impact Fund",
    funder: "Rare Beauty / Rare Impact Fund",
    voice: "Community impact and mental health — lived experience, community voice, mental wellness, youth empowerment, systemic change. Accessible, empathetic language centering the community.",
    focusAreas: ["mental health", "youth development", "community empowerment", "stigma reduction"],
    domains: ["mental-health", "community", "health-equity"],
    cfirEmphasis: ["Outer Setting", "Individuals"],
    reaimPriority: ["Reach", "Maintenance"],
  },
  "st-davids": {
    name: "St. David's Foundation Health Equity Grant",
    funder: "St. David's Foundation",
    voice: "Health equity and social determinants — health disparities, SDOH, access barriers, community health workers, clinical-community linkages. Public health language with epidemiological data.",
    focusAreas: ["health equity", "social determinants of health", "community health", "healthcare access"],
    domains: ["health-equity"],
    cfirEmphasis: ["Outer Setting", "Inner Setting"],
    reaimPriority: ["Reach", "Effectiveness", "Adoption"],
  },
  "austin-fc": {
    name: "Austin FC Community Fund",
    funder: "Austin FC Foundation",
    voice: "Youth development and community building — sports as vehicle for social change, after-school programming, character development, mentorship, physical wellness. Energetic, community-first language.",
    focusAreas: ["youth development", "after-school programs", "physical wellness", "mentorship"],
    domains: ["education", "community"],
    cfirEmphasis: ["Individuals", "Implementation Process"],
    reaimPriority: ["Reach", "Implementation"],
  },
  "ssg-fox": {
    name: "SSG Fox Veteran Services Fund",
    funder: "SSG Fox Foundation",
    voice: "Veteran services and military transition — military-to-civilian transition, veteran mental health, post-service employment, family reintegration, service-connected challenges. Honor military service while addressing systemic gaps.",
    focusAreas: ["veteran services", "military transition", "PTSD treatment", "veteran employment"],
    domains: ["veterans", "mental-health"],
    cfirEmphasis: ["Inner Setting", "Individuals"],
    reaimPriority: ["Adoption", "Implementation", "Maintenance"],
  },
  "doj-bja": {
    name: "DOJ/BJA Violence Prevention Grant",
    funder: "Department of Justice / Bureau of Justice Assistance",
    voice: "Evidence-based violence prevention and community safety — data-driven approaches, risk/protective factors, recidivism reduction, community-led safety strategies. Federal grant language with outcome metrics.",
    focusAreas: ["violence prevention", "community safety", "reentry support", "juvenile justice"],
    domains: ["safety", "community"],
    federalAgency: "DOJ",
    typicalAward: "$500K–$2M",
    cfirEmphasis: ["Innovation Characteristics", "Outer Setting"],
    reaimPriority: ["Effectiveness", "Implementation"],
  },
  "samhsa": {
    name: "SAMHSA Community Grant",
    funder: "Substance Abuse and Mental Health Services Administration",
    voice: "Behavioral health and substance use prevention — trauma-informed care, recovery support, community-based treatment, integrated behavioral health. Clinical and public health terminology.",
    focusAreas: ["substance abuse prevention", "mental health services", "trauma-informed care", "behavioral health"],
    domains: ["mental-health", "health-equity"],
    federalAgency: "HHS/SAMHSA",
    typicalAward: "$300K–$1.5M",
    cfirEmphasis: ["Innovation Characteristics", "Outer Setting", "Inner Setting"],
    reaimPriority: ["Reach", "Effectiveness", "Maintenance"],
  },
  "wioa-title-i": {
    name: "WIOA Title I Youth Program",
    funder: "Department of Labor / Texas Workforce Commission",
    voice: "Workforce development and youth employment — 14 youth elements, career pathways, work-based learning, credential attainment, measurable employment outcomes. DOL performance metrics language.",
    focusAreas: ["workforce development", "youth employment", "career pathways", "credential attainment"],
    domains: ["workforce", "education"],
    federalAgency: "DOL",
    typicalAward: "$200K–$1M",
    cfirEmphasis: ["Inner Setting", "Implementation Process"],
    reaimPriority: ["Reach", "Adoption", "Implementation"],
  },
};

// ─── Domain → Crisis Label Mapping ───────────────────────────────────────────
const CONDUCTOR_DOMAIN_TO_RPLICE: Record<string, string[]> = {
  "economicMobility": ["workforce", "education", "community"],
  "healthEquity": ["health-equity"],
  "educationalAccess": ["education"],
  "housingStability": ["housing", "community"],
  "mentalHealth": ["mental-health", "health-equity"],
  "publicSafety": ["safety", "community"],
  "familyStability": ["community", "education"],
  "workforceDevelopment": ["workforce"],
  "childWelfare": ["education", "community", "health-equity"],
  "reentrySupport": ["safety", "workforce"],
  "veteranServices": ["veterans"],
  "healthcareAccess": ["health-equity"],
};

/**
 * Match grant profiles to the community's crisis domains.
 * Returns ranked profiles with alignment scores and narrative guidance.
 */
export function matchGrantProfiles(crisisDomains: string[]): Array<{
  profile: typeof RPLICE_GRANT_PROFILES[string] & { id: string };
  alignmentScore: number;
  matchedDomains: string[];
  narrativeEndpoint: string;
  priority: "STRONG" | "MODERATE" | "POTENTIAL";
}> {
  const rpliceRiskFactors = new Set<string>();
  for (const domain of crisisDomains) {
    const factors = CONDUCTOR_DOMAIN_TO_RPLICE[domain] || [];
    for (const f of factors) rpliceRiskFactors.add(f);
  }

  const results = Object.entries(RPLICE_GRANT_PROFILES).map(([id, profile]) => {
    const matchedDomains = profile.domains.filter(d => rpliceRiskFactors.has(d));
    const alignmentScore = profile.domains.length > 0
      ? Math.round((matchedDomains.length / profile.domains.length) * 100)
      : 0;
    return {
      profile: { ...profile, id },
      alignmentScore,
      matchedDomains,
      narrativeEndpoint: "POST /api/rplice/grant-narrative",
      priority: alignmentScore >= 75
        ? "STRONG" as const
        : alignmentScore >= 40
        ? "MODERATE" as const
        : "POTENTIAL" as const,
    };
  });

  return results
    .filter(r => r.alignmentScore > 0)
    .sort((a, b) => b.alignmentScore - a.alignmentScore);
}

// ─── Platform Intervention Map ────────────────────────────────────────────────
const PLATFORM_INTERVENTION_MAP: Record<string, {
  platforms: Array<{ id: string; name: string; url: string; interventions: string[] }>;
}> = {
  "education": {
    platforms: [
      { id: "isss", name: "ISSS — Integrated Supports for Thriving Youth", url: "https://implementationineducatio.com", interventions: ["MTSS implementation", "Student support coordination", "Early warning system", "Implementation fidelity tracking"] },
      { id: "wholemind", name: "WholeMind Learning", url: "https://wholemindlearning.com", interventions: ["Pre-K to 12th grade curriculum", "AI homework help", "Adaptive learning", "Skill mastery tracking"] },
    ],
  },
  "health-equity": {
    platforms: [
      { id: "whole-person-health", name: "Whole-Person Health Ecosystem", url: "https://mentalwellnesssupport.net", interventions: ["C-SSRS, PHQ-9, GAD-7 clinical screenings", "Safety plan builder", "Crisis routing", "MAP-GAP assessment"] },
      { id: "sankofa", name: "Sankofa Health Network", url: "https://yourhealthbirthright.net", interventions: ["Health equity gateway", "Culturally responsive care", "GIS resource matching", "Population-specific health navigation"] },
      { id: "sankofa-maternal-health", name: "Black Maternal Health Network", url: "https://yourhealthbirthright.net", interventions: ["Maternal risk assessment", "Doula matching", "Prenatal care navigation", "Postpartum recovery"] },
      { id: "safecognicare", name: "SafeCogniCare", url: "https://safecognicare.com", interventions: ["MoCA/MMSE cognitive health assessments", "TBI screening", "Cognitive decline monitoring", "Care coordination"] },
    ],
  },
  "workforce": {
    platforms: [
      { id: "mce", name: "Minority Center of Excellence", url: "https://minoritycenterofexcellence.com", interventions: ["Business lifecycle tools", "SAM.gov integration", "Certification wizard (8a/HUBZone/SDVOSB/WOSB)", "Dual-AI proposal review"] },
      { id: "pinnacle-business-conglomerate", name: "Pinnacle Business Conglomerate", url: "https://pinnaclebusinessconglomerate.com", interventions: ["Contractor enablement pipeline", "MAP-GAP business diagnostics", "Bid strategy development", "Workforce development pipeline"] },
    ],
  },
  "housing": {
    platforms: [
      { id: "lifebridge", name: "LifeBridge", url: "https://lifetransitionsaid.org", interventions: ["Housing assistance navigation", "24/7 resource matching", "Social determinant scoring", "Community health worker dispatch"] },
    ],
  },
  "safety": {
    platforms: [
      { id: "safereport", name: "SafeReport", url: "https://safereports.net", interventions: ["Incident management", "50-state regulation database", "Compliance tracking", "Court-admissible records"] },
      { id: "emergency-mgmt", name: "Emergency Management", url: "https://shieldatlas.net", interventions: ["Geographic risk mapping", "Community resilience scoring", "Predictive safety modeling", "Emergency coordination"] },
    ],
  },
  "mental-health": {
    platforms: [
      { id: "perfectly-different", name: "Perfectly Different", url: "https://neurodifferentassistant.app", interventions: ["Neurodiversity support", "IEP/504 plan assistance", "Executive function coaching", "Sensory management"] },
      { id: "whole-person-health", name: "Whole-Person Health Ecosystem", url: "https://mentalwellnesssupport.net", interventions: ["PHQ-9 depression screening", "GAD-7 anxiety screening", "C-SSRS suicidality screening", "Safety plan builder"] },
    ],
  },
  "veterans": {
    platforms: [
      { id: "m2c", name: "Mission Transition (M2C)", url: "https://vetmissiontransition.com", interventions: ["MOS/AFSC career translation", "VA benefits navigation", "Identity transition support", "Proactive outreach"] },
      { id: "sankofa-mens-health", name: "Black Men's Health Hub", url: "https://thehealthyblkman.com", interventions: ["Veteran health pathways", "Mental health stigma reduction", "Peer mentor matching"] },
    ],
  },
  "community": {
    platforms: [
      { id: "lifebridge", name: "LifeBridge", url: "https://lifetransitionsaid.org", interventions: ["Benefits navigation", "Community health worker pathway", "Two-generation family support"] },
    ],
  },
};

/**
 * Full RPLICE intelligence package for a specific geography.
 * Pulls from: live RPLICE API + ThriveUp DB + bridge + grant profiles + platform matching.
 */
export interface RpliceIntelligencePackage {
  // Live scholarly data from RPLICE research library
  liveResearch: {
    studies: Array<{ title: string; authors?: string; year?: number; domain?: string }>;
    frameworks: string[];
    ecosystemStatus: string;
    lastFetched: string;
  };
  // All DB records
  db: {
    cfirAssessments: any[];
    reaimScorecards: any[];
    fidelityChecklists: any[];
    threeRealitiesAnalyses: any[];
    communityAnalyses: any[];
    grantNarratives: any[];
    activeActionPlans: any[];
    activeBaselines: any[];
  };
  // Bridge intelligence (platform assignments, milestones, baselines)
  bridge: {
    relevanceScore: number;
    relevant: boolean;
    reasoning: string;
    interventionAssignments: any[];
    actionPlanMilestones: any[];
    outcomeBaselines: any[];
  };
  // Matched grant profiles (ranked)
  grantProfiles: ReturnType<typeof matchGrantProfiles>;
  // Ecosystem platform interventions by risk factor
  platformInterventions: Array<{
    riskFactor: string;
    platforms: Array<{ id: string; name: string; url: string; interventions: string[] }>;
  }>;
  // Full analytical frameworks to inject into AI prompts
  analyticalFrameworks: {
    cfir: string;
    reaim: string;
    threeRealities: string;
    salp: string;
    mapgap: string;
    aces: string;
    rnr: string;
    keyPrinciples: string[];
    grantNarrativeRules: string[];
  };
  // Compact AI context block for prompt injection
  aiContextBlock: string;
  // GPP-formatted package
  gppPackage: {
    frameworksApplied: string[];
    researchCitations: string[];
    topGrantProfiles: Array<{ name: string; funder: string; alignmentScore: number; focusAreas: string[]; cfirEmphasis: string[]; priority: string }>;
    platformDeploymentPlan: Array<{ riskFactor: string; platforms: string[] }>;
    analyticalDepth: string;
    narrativeGuidance: string[];
  };
}

export async function buildRpliceIntelligencePackage(params: {
  crisisDomains?: string[];
  regionName?: string;
  stateFips?: string;
  countyFips?: string;
}): Promise<RpliceIntelligencePackage> {
  const { crisisDomains = [], regionName = "community" } = params;

  // Build search query from crisis domains
  const searchTerms = crisisDomains.map(d => {
    const map: Record<string, string> = {
      economicMobility: "economic mobility poverty workforce",
      healthEquity: "health equity disparities social determinants",
      educationalAccess: "education college attainment youth",
      housingStability: "housing stability affordable displacement",
      mentalHealth: "mental health behavioral health trauma",
      publicSafety: "violence prevention reentry community safety",
      familyStability: "family structure two-parent households ACEs",
      workforceDevelopment: "workforce development employment career",
      childWelfare: "child welfare foster youth prevention",
      reentrySupport: "reentry second chance recidivism RNR",
      veteranServices: "veteran military transition PTSD",
      healthcareAccess: "healthcare access community health workers",
    };
    return map[d] || d;
  }).join(" ");

  const searchQuery = (searchTerms || "community implementation evidence-based").slice(0, 200);

  // Pull from all sources in parallel
  const [
    allLiveResearchRaw,
    liveFrameworksRaw,
    dbAssessments,
    dbActionPlans,
    dbBaselines,
    bridgeIntelligence,
  ] = await Promise.all([
    // Fetch the full 49-study library; filter client-side (search endpoint requires CSRF tokens)
    fetchRpliceLive("/api/research"),
    // Public: RE-AIM + EPIS with full dimensions/indicators/metrics
    fetchRpliceLive("/api/frameworks/list"),
    // /api/ecosystem/status does not exist on bettersciencelab.com (returns 404)
    db.select().from(rpliceAssessments).orderBy(desc(rpliceAssessments.createdAt)).limit(50),
    db.select().from(rpliceActionPlans).where(eq(rpliceActionPlans.status, "active")).orderBy(desc(rpliceActionPlans.createdAt)).limit(20),
    db.select().from(outcomeBaselines).where(eq(outcomeBaselines.status, "active")).orderBy(desc(outcomeBaselines.createdAt)).limit(20),
    generateRpliceHeartbeatIntelligence("thriveup").catch(() => null),
  ]);

  // Filter by searchQuery keywords client-side
  const liveResearchRaw = filterResearchByKeywords(
    allLiveResearchRaw,
    searchQuery.split(/[\s,]+/).filter(w => w.length > 3)
  );
  // Fallback: if no filtered results, use the full library
  const liveResearchFinal = liveResearchRaw.length > 0 ? liveResearchRaw : (allLiveResearchRaw || []);

  // ─── Categorize DB assessments ─────────────────────────────────────────────
  const cfirAssessments = dbAssessments.filter(a => a.assessmentType === "cfir");
  const reaimScorecards = dbAssessments.filter(a => a.assessmentType === "reaim");
  const fidelityChecklists = dbAssessments.filter(a => a.assessmentType === "fidelity");
  const threeRealitiesAnalyses = dbAssessments.filter(a => a.assessmentType === "three_realities");
  const communityAnalyses = dbAssessments.filter(a => a.assessmentType === "community_analysis");
  const multiAiAnalyses = dbAssessments.filter(a => a.assessmentType === "multi_ai_analysis");
  const grantNarratives = dbAssessments.filter(a => a.assessmentType === "grant_narrative");

  // ─── Live RPLICE data ──────────────────────────────────────────────────────
  const studies = Array.isArray(liveResearchFinal)
    ? liveResearchFinal.slice(0, 15).map((r: any) => ({
        title: r.title || "Untitled",
        authors: r.authors,
        year: r.year,
        domain: r.domain || r.category,
        frameworks: r.frameworks,
        citationCount: r.citationCount,
        doi: r.doi,
      }))
    : [];

  // Full library count for context injection
  const totalResearchLibraryCount = Array.isArray(allLiveResearchRaw) ? allLiveResearchRaw.length : 0;

  const frameworks = Array.isArray(liveFrameworksRaw)
    ? liveFrameworksRaw.map((f: any) => `${f.id || f.name}: ${f.fullName || f.description || ""}`)
    : ["CFIR 2.0", "RE-AIM", "EPIS", "RPLICE Decision Framework", "MAP-GAP"];

  // Full framework structs for rich AI context (dimensions, indicators, metrics)
  const frameworksRich = Array.isArray(liveFrameworksRaw) ? liveFrameworksRaw : [];

  const ecosystemStatus = "bettersciencelab.com live — 100+ implementation science tools, ~1000 live data sources";

  // ─── Grant profile matching ────────────────────────────────────────────────
  const grantProfiles = matchGrantProfiles(crisisDomains);

  // ─── Platform intervention mapping ────────────────────────────────────────
  const rpliceRiskFactors = new Set<string>();
  for (const domain of crisisDomains) {
    for (const f of (CONDUCTOR_DOMAIN_TO_RPLICE[domain] || [])) rpliceRiskFactors.add(f);
  }
  const platformInterventions = [...rpliceRiskFactors].map(factor => ({
    riskFactor: factor,
    platforms: PLATFORM_INTERVENTION_MAP[factor]?.platforms || [],
  })).filter(x => x.platforms.length > 0);

  // ─── Analytical frameworks ────────────────────────────────────────────────
  const analyticalFrameworks = {
    cfir: `CFIR 2.0 (Consolidated Framework for Implementation Research) — 5 domains, 39 constructs:
  1. Innovation Characteristics — evidence quality, relative advantage, adaptability, complexity, cost
  2. Outer Setting — patient/community needs, cosmopolitanism, peer pressure, external policies
  3. Inner Setting — structural characteristics, culture, implementation climate, organizational readiness
  4. Individuals — knowledge/beliefs, self-efficacy, individual stage of change, identification
  5. Implementation Process — planning, engaging, executing, reflecting/evaluating
  → Every grant Section G must rate each domain 1–5 and name a mitigation strategy for barriers scored ≤2`,

    reaim: `RE-AIM Evaluation Model — score each dimension for the proposed intervention:
  R — Reach: What % of the eligible population will be served? How will we find them?
  E — Effectiveness: What evidence-based approaches work? What are the expected effect sizes?
  A — Adoption: Which organizations can deliver this at fidelity? What enables uptake?
  I — Implementation: What does fidelity look like? What are the checklist items?
  M — Maintenance: How do we sustain past the grant period? What is the replication plan?
  → Every grant Section E (Evaluation) must include a completed RE-AIM table with targets`,

    threeRealities: `Three Realities Framework (Dr. Flood):
  1. Research Reality — what the Census and peer-reviewed literature say
     (cite specific tract numbers, ACS table codes, study DOIs)
  2. Political Reality — what officials and media report (county-level averages that mask neighborhood crisis)
  3. Ground Truth — what the community actually experiences day-to-day
  → Grant narratives must bridge all three: open with ground truth (funder empathy),
     anchor with data (credibility), and expose the political mask (urgency)`,

    salp: `SALP Indicators — for every intervention outcome, require all four:
  S — Specific: Measurable target (e.g., "increase college enrollment by 12% in ZIP 78741")
  A — Actionable: Concrete program activity that drives the metric
  L — Linked: Causal connection between activity and outcome (theory of change)
  P — Predictive: Leading indicator that tells you the lagging outcome is coming
  → Section F (Objectives) must include a SALP table, one row per outcome`,

    mapgap: `MAP-GAP Continuous Improvement (Dr. Flood's framework):
  M — Measure: Current state baseline (must cite Census, administrative data, or direct measure)
  A — Analyze: What patterns, gaps, or underperformance exist at the tract level?
  P — Plan: What is the priority fix? Which CFIR facilitators do we activate?
  G — Gap: Specific distance between current and desired state (quantified)
  A — Action: Concrete steps that close the gap within the grant period
  P — Progress: How do we track and report improvement to the funder?
  → Section D (Evaluation) must include a MAP-GAP cycle cadence (monthly/quarterly)`,

    aces: `ACEs (Adverse Childhood Experiences) Integration:
  → Connect every youth/family outcome to the ACEs research base
  → Cite Felitti et al. (1998) AJPM study (17,000 participants, foundational)
  → Frame all interventions as "buffering ACEs exposure" not "treating deficits"
  → Protective factors: stable housing, 2-parent households, 1 year of college, mentorship, faith community
  → Dr. Flood's principle: "1 year of college = primary protective factor"
  → Neighborhood→School→Outcomes pipeline must be named and mapped`,

    rnr: `RNR (Risk-Need-Responsivity) — Gold Standard for Justice-Involved Populations:
  R — Risk Principle: Match intervention intensity to risk level (low-risk clients harmed by high-intensity)
  N — Need Principle: Target criminogenic needs (antisocial attitudes, peers, substance use, employment)
  R — Responsivity Principle: Tailor delivery to client's learning style, language, culture, motivation
  → Any grant targeting reentry, recidivism, juvenile justice, or criminal justice must cite RNR
  → Cite Andrews & Bonta (2010) as the authoritative source`,

    keyPrinciples: [
      '"1 year of college = primary protective factor" (Dr. Flood) — education IS the intervention, not a parallel service',
      '"Crime doesn\'t disappear, it migrates" — gentrification displaces poverty, produces no net safety gain; cite Census longitudinal data',
      'Family structure amplifies ALL other factors — 2-parent households, marriage rates, children in stable homes are leading indicators',
      'Neighborhood→School→Outcomes pipeline — life trajectory is set by ZIP code; tract-level data must drive the needs assessment',
      'Risk and protective factors must be measured at TRACT level, not county level — county averages mask neighborhood crisis',
      'Measure at 30%+ poverty tracts specifically — every grant needs a count of max-risk tracts in the service area',
      'Income gap (richest tract / poorest tract) is a proxy for segregation and opportunity hoarding — cite it explicitly',
    ],

    grantNarrativeRules: [
      'Open Section A (Need Statement) with Ground Truth, anchor with Census tract data, expose the political mask',
      'Every statistic must cite the specific ACS table code (e.g., "B17001 — poverty") and vintage year',
      'CFIR domain ratings (1–5) must appear in Section G with named facilitators and barriers',
      'RE-AIM table (R/E/A/I/M with targets) must appear in Section E or F',
      'SALP table (Specific/Actionable/Linked/Predictive) for every stated objective',
      'MAP-GAP cycle cadence (monthly/quarterly check-ins) must be named in Section D',
      'ACEs connection must be drawn for every youth/family outcome in Section B (Target Population)',
      'Fidelity measurement plan (who checks, what tool, what threshold triggers course correction) in Section G',
      'Sustainability plan must name 3+ post-grant funding sources — no "we will seek future funding" language',
      'Cost of inaction calculation (from conductor cascade model) must appear in Section A — reviewers need to feel the cost of doing nothing',
    ],
  };

  // ─── AI context block ──────────────────────────────────────────────────────
  const lines: string[] = [];
  lines.push("=== RPLICE MAXIMUM INTELLIGENCE PACKAGE ===");
  lines.push(`Source: RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence) | ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Region: ${regionName} | Crisis domains: ${crisisDomains.join(", ") || "general"}`);
  lines.push("");

  if (studies.length > 0) {
    lines.push("── LIVE SCHOLARLY RESEARCH (RPLICE library) ──");
    for (const s of studies.slice(0, 8)) {
      lines.push(`• ${s.title}${s.year ? ` (${s.year})` : ""}${s.authors ? ` — ${s.authors}` : ""}`);
    }
    lines.push("");
  }

  if (frameworks.length > 0) {
    lines.push("── IMPLEMENTATION FRAMEWORKS AVAILABLE ──");
    for (const f of frameworks.slice(0, 8)) lines.push(`• ${f}`);
    lines.push("");
  }

  if (cfirAssessments.length > 0 || communityAnalyses.length > 0) {
    lines.push("── SAVED RPLICE ASSESSMENTS (DB) ──");
    for (const a of [...communityAnalyses, ...cfirAssessments].slice(0, 5)) {
      lines.push(`• ${a.assessmentType.toUpperCase()}: ${a.programName} (${a.status}${a.score ? `, score: ${a.score}` : ""})`);
    }
    lines.push("");
  }

  if (grantProfiles.length > 0) {
    lines.push("── MATCHED GRANT PROFILES (ranked) ──");
    for (const g of grantProfiles.slice(0, 5)) {
      lines.push(`• [${g.priority}] ${g.profile.name} — ${g.profile.funder} (${g.alignmentScore}% aligned)`);
      lines.push(`  Focus: ${g.profile.focusAreas.join(", ")}`);
      lines.push(`  CFIR: ${g.profile.cfirEmphasis.join(", ")} | RE-AIM: ${g.profile.reaimPriority.join(", ")}`);
    }
    lines.push("");
  }

  if (platformInterventions.length > 0) {
    lines.push("── ECOSYSTEM PLATFORM DEPLOYMENT PLAN ──");
    for (const pi of platformInterventions) {
      const names = pi.platforms.map(p => p.name).join(" + ");
      lines.push(`• ${pi.riskFactor.toUpperCase()}: ${names}`);
    }
    lines.push("");
  }

  lines.push("── ANALYTICAL FRAMEWORKS (apply to every narrative section) ──");
  lines.push(analyticalFrameworks.cfir.split("\n")[0]);
  lines.push(analyticalFrameworks.reaim.split("\n")[0]);
  lines.push(analyticalFrameworks.threeRealities.split("\n")[0]);
  lines.push("SALP: Specific · Actionable · Linked · Predictive (required for every outcome)");
  lines.push("ACEs: Adverse Childhood Experiences — every youth outcome must cite Felitti 1998");
  lines.push("");

  lines.push("── DR. FLOOD'S KEY PRINCIPLES ──");
  for (const p of analyticalFrameworks.keyPrinciples) {
    lines.push(`• ${p}`);
  }
  lines.push("");

  lines.push("── GRANT NARRATIVE RULES ──");
  for (const r of analyticalFrameworks.grantNarrativeRules.slice(0, 6)) {
    lines.push(`• ${r}`);
  }

  const aiContextBlock = lines.join("\n");

  // ─── GPP Package ──────────────────────────────────────────────────────────
  const gppPackage = {
    frameworksApplied: [
      "CFIR 2.0 (Consolidated Framework for Implementation Research) — 5 domains, 39 constructs",
      "RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) — evaluation model",
      "EPIS (Exploration, Preparation, Implementation, Sustainment) — change management",
      "Three Realities (Research Reality / Political Reality / Ground Truth) — Dr. Flood",
      "SALP Indicators (Specific / Actionable / Linked / Predictive) — outcome design",
      "MAP-GAP Continuous Improvement — Measure, Analyze, Plan, Gap, Action, Progress",
      "ACEs (Adverse Childhood Experiences) — Felitti 1998 foundational framework",
      "RNR (Risk-Need-Responsivity) — gold standard for justice-involved populations",
    ],
    researchCitations: studies.slice(0, 10).map(s =>
      `${s.title}${s.authors ? ` (${s.authors})` : ""}${s.year ? `, ${s.year}` : ""}`
    ),
    topGrantProfiles: grantProfiles.slice(0, 5).map(g => ({
      name: g.profile.name,
      funder: g.profile.funder,
      alignmentScore: g.alignmentScore,
      focusAreas: g.profile.focusAreas,
      cfirEmphasis: g.profile.cfirEmphasis,
      reaimPriority: g.profile.reaimPriority,
      priority: g.priority,
      federalAgency: g.profile.federalAgency,
      typicalAward: g.profile.typicalAward,
      narrativeEndpoint: "POST /api/rplice/grant-narrative",
      generateNarrativeBody: {
        note: "Add stateFips, countyFips, cityName to this body",
        grantName: g.profile.id,
      },
    })),
    platformDeploymentPlan: platformInterventions.map(pi => ({
      riskFactor: pi.riskFactor,
      platforms: pi.platforms.map(p => `${p.name} (${p.url}) — ${p.interventions.slice(0, 2).join(", ")}`),
    })),
    analyticalDepth: [
      `Live RPLICE scholarly research: ${studies.length} studies retrieved`,
      `Implementation frameworks: ${frameworks.length} loaded`,
      `CFIR assessments in DB: ${cfirAssessments.length}`,
      `RE-AIM scorecards in DB: ${reaimScorecards.length}`,
      `Fidelity checklists: ${fidelityChecklists.length}`,
      `Three Realities analyses: ${threeRealitiesAnalyses.length}`,
      `Community analyses (full 9-section): ${communityAnalyses.length}`,
      `Grant narratives previously generated: ${grantNarratives.length}`,
      `Active action plans (90-day): ${dbActionPlans.length}`,
      `Active outcome baselines: ${dbBaselines.length}`,
    ].join(" | "),
    narrativeGuidance: analyticalFrameworks.grantNarrativeRules,
  };

  return {
    liveResearch: {
      studies,
      frameworks,
      frameworksRich,
      totalLibraryCount: totalResearchLibraryCount,
      ecosystemStatus,
      platformUrl: "https://www.bettersciencelab.com",
      lastFetched: new Date().toISOString(),
    },
    db: {
      cfirAssessments,
      reaimScorecards,
      fidelityChecklists,
      threeRealitiesAnalyses,
      communityAnalyses,
      grantNarratives,
      activeActionPlans: dbActionPlans,
      activeBaselines: dbBaselines,
    },
    bridge: {
      relevanceScore: bridgeIntelligence?.relevanceScore ?? 0,
      relevant: bridgeIntelligence?.relevant ?? false,
      reasoning: bridgeIntelligence?.reasoning ?? "",
      interventionAssignments: bridgeIntelligence?.interventionAssignments ?? [],
      actionPlanMilestones: bridgeIntelligence?.actionPlanMilestones ?? [],
      outcomeBaselines: bridgeIntelligence?.outcomeBaselines ?? [],
    },
    grantProfiles,
    platformInterventions,
    analyticalFrameworks,
    aiContextBlock,
    gppPackage,
  };
}
