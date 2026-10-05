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
 * Public as of Aug 2026 (gateways opened — previously CSRF/401 gated):
 *  • GET /api/research/search?q=…            — server-side search, no CSRF
 *  • GET /api/research/categories,tags,sources,count
 * Authenticated endpoints (Bearer key = THRIVE_GPP_API_KEY, verified working Aug 2026):
 *  • GET /api/v1/frameworks     — full framework library (CFIR 2.0/PRISM/TDF/i-PARIHS+)
 *  • GET /api/v1/research?q=…   — authenticated search
 *  • GET /api/grants            — still 401 with current key (separate auth)
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
import { fetchZctaData, stateAbbrevFromZip } from "./neighborhood-routes";
import { getCivicSignalRAGContextAsync } from "./civic-signal-connector";
import { getChildCORECommunityData, buildChildCOREContextBlock } from "./childcore-connector";

const RPLICE_BASE = process.env.RPLICE_BASE_URL || "https://www.bettersciencelab.com";

// Bearer key — set RPLICE_API_KEY secret to unlock all /api/v1/* authenticated endpoints.
// Without it, public endpoints still work; auth-gated calls return null gracefully.
// RPLICE authentication is a separate outbound trust boundary. Never reuse an
// inbound partner key or a GrantPathPro delivery key for this service.
const RPLICE_API_KEY = process.env.RPLICE_API_KEY || "";

/** Public GET — no auth needed (knowledge slices, /api/research, /api/frameworks/list) */
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

/** Authenticated GET — /api/v1/* endpoints; requires RPLICE_API_KEY */
async function fetchRpliceV1(path: string, timeout = 12000): Promise<any> {
  if (!RPLICE_API_KEY) return null;
  try {
    const resp = await fetch(`${RPLICE_BASE}${path}`, {
      headers: {
        "Authorization": `Bearer ${RPLICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeout),
    });
    if (resp.status === 401 || resp.status === 403) {
      console.error(`[rplice] v1 auth refused (${resp.status}) on ${path} — check RPLICE_API_KEY on Vercel`);
      return null;
    }
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/** Authenticated POST — /api/v1/* compute + analysis endpoints; requires RPLICE_API_KEY */
async function fetchRpliceV1Post(path: string, body: Record<string, unknown>, timeout = 20000): Promise<any> {
  if (!RPLICE_API_KEY) return null;
  try {
    const resp = await fetch(`${RPLICE_BASE}${path}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RPLICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Filter the full /api/research library by keywords.
 * Used as fallback when /api/v1/research search is unavailable.
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
      { id: "isss", name: "ChildCORE", interventions: ["Child and family community intelligence", "Provider availability and school information", "County-level community metrics", "Navigation and referral context"] },
      { id: "wholemind", name: "WholeMind Learning", url: "https://wholemindlearning.com", interventions: ["Pre-K to 12th grade curriculum", "AI homework help", "Adaptive learning", "Skill mastery tracking"] },
    ],
  },
  "health-equity": {
    platforms: [
      { id: "whole-person-health", name: "Whole-Person Health Ecosystem", url: "https://mentalwellnesssupport.net", interventions: ["C-SSRS, PHQ-9, GAD-7 clinical screenings", "Safety plan builder", "Crisis routing", "MAP-GAP assessment"] },
      { id: "sankofa", name: "HerHealth", url: "https://herhealthmatters2.com", interventions: ["Health gateway", "Responsive care", "GIS resource matching", "Population-aware health navigation"] },
      { id: "sankofa-maternal-health", name: "Maternal Health Network", url: "https://herhealthmatters2.com", interventions: ["Maternal risk assessment", "Doula matching", "Prenatal care navigation", "Postpartum recovery"] },
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
      { id: "sankofa-mens-health", name: "MaleHealth Matters", url: "https://malehealthmatters2.com", interventions: ["Veteran health pathways", "Behavioral-health engagement", "Peer mentor matching"] },
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
    studies: Array<{ title: string; authors?: string; year?: number; domain?: string; frameworks?: string[]; citationCount?: number; doi?: string }>;
    frameworks: string[];
    frameworksRich: any[];
    totalLibraryCount: number;
    ecosystemStatus: string;
    platformUrl: string;
    lastFetched: string;
  };
  // RPLICE authenticated data — active when RPLICE_API_KEY is set
  rpliceAuthenticated: {
    enabled: boolean;
    communityAnalysis: any;        // 15-domain FIPS community analysis
    frameworks: any;               // 53 IS frameworks full library
    cfirConstructs: any;           // CFIR 2.0 39 constructs
    salpCanon: any;
    grantProfiles: any;
    equityRubric: any;
    needsSchema: any;
    sustainabilityRubric: any;
    ericTaxonomy: any;             // ERIC implementation strategies
    federalIntegrations: any;
    researchSearchResults: any;
  };
  // RPLICE public data — always live, no key needed
  rplicePublic: {
    knowledgeFrameworks: any[];    // 53 IS frameworks (code, name, type, citation)
    toolsCatalog: any[];           // 90 tools with capabilities, stages, url
    executionEngines: any[];       // 11 compute engines
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
  includePrivateData?: boolean;
}): Promise<RpliceIntelligencePackage> {
  const { crisisDomains = [], regionName = "community", includePrivateData = true } = params;

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

  // ── Pull from ALL sources simultaneously ──────────────────────────────────
  // Public endpoints (no key): knowledge slices, /api/research, /api/frameworks/list
  // Authenticated endpoints (need RPLICE_API_KEY): all /api/v1/* calls
  // DB + bridge: always available
  const [
    // ── PUBLIC: always live ──────────────────────────────────────────────────
    allLiveResearchRaw,         // /api/research — 49 curated IS studies
    liveFrameworksRaw,          // /api/frameworks/list — RE-AIM + EPIS (rich)
    knowledgeIsSlice,           // /api/knowledge/slice/is — 53 frameworks + 30 instruments
    knowledgeToolsSlice,        // /api/knowledge/slice/tools — 90 tools with metadata
    execCatalog,                // /api/v1/partner/execution/catalog — 11 compute engines

    // ── AUTHENTICATED: activate when RPLICE_API_KEY is set ──────────────────
    v1Frameworks,               // GET /api/v1/frameworks — full 53-framework library
    v1CfirConstructs,           // GET /api/v1/cfir/constructs — CFIR 2.0 39-construct taxonomy
    v1SalpCanon,                // GET /api/v1/salp/canon
    v1GrantProfiles,            // GET /api/v1/grants/profiles — funder profiles
    v1EquityRubric,             // GET /api/v1/equity-evaluation/rubric
    v1NeedsSchema,              // GET /api/v1/needs-assessment/schema
    v1SustainabilityRubric,     // GET /api/v1/sustainability-wizard/rubric
    v1ImplStrategyTaxonomy,     // GET /api/v1/implementation-strategy/taxonomy (ERIC)
    v1FederalIntegrations,      // GET /api/v1/federal-integrations — federal data catalog
    v1ResearchSearched,         // GET /api/v1/research?q=...&limit=50 — proper search (no CSRF on v1)
    v1CommunityAnalysis,        // POST /api/v1/community-analysis — FIPS → 15 community domains

    // ── DB + Bridge: always available ────────────────────────────────────────
    dbAssessments,
    dbActionPlans,
    dbBaselines,
    bridgeIntelligence,
  ] = await Promise.all([
    // Public
    fetchRpliceLive("/api/research"),
    fetchRpliceLive("/api/frameworks/list"),
    fetchRpliceLive("/api/knowledge/slice/is"),
    fetchRpliceLive("/api/knowledge/slice/tools"),
    fetchRpliceLive("/api/v1/partner/execution/catalog"),

    // Authenticated GET
    fetchRpliceV1("/api/v1/frameworks"),
    fetchRpliceV1("/api/v1/cfir/constructs"),
    fetchRpliceV1("/api/v1/salp/canon"),
    fetchRpliceV1("/api/v1/grants/profiles"),
    fetchRpliceV1("/api/v1/equity-evaluation/rubric"),
    fetchRpliceV1("/api/v1/needs-assessment/schema"),
    fetchRpliceV1("/api/v1/sustainability-wizard/rubric"),
    fetchRpliceV1("/api/v1/implementation-strategy/taxonomy"),
    fetchRpliceV1("/api/v1/federal-integrations"),
    fetchRpliceV1(`/api/v1/research?q=${encodeURIComponent(searchQuery)}&limit=50`),

    // Authenticated POST — community analysis by FIPS (most powerful endpoint)
    (params.stateFips && params.countyFips)
      ? fetchRpliceV1Post("/api/v1/community-analysis", {
          stateFips: params.stateFips,
          countyFips: params.countyFips,
          ...(crisisDomains.length > 0 && { domains: crisisDomains }),
        })
      : Promise.resolve(null),

    // DB
    includePrivateData
      ? db.select().from(rpliceAssessments).orderBy(desc(rpliceAssessments.createdAt)).limit(50)
      : Promise.resolve([]),
    includePrivateData
      ? db.select().from(rpliceActionPlans).where(eq(rpliceActionPlans.status, "active")).orderBy(desc(rpliceActionPlans.createdAt)).limit(20)
      : Promise.resolve([]),
    includePrivateData
      ? db.select().from(outcomeBaselines).where(eq(outcomeBaselines.status, "active")).orderBy(desc(outcomeBaselines.createdAt)).limit(20)
      : Promise.resolve([]),
    generateRpliceHeartbeatIntelligence("thriveup").catch(() => null),
  ]);

  // ─── Research: use authenticated v1 search if key present, else filter public library ──
  const v1ResearchList = Array.isArray(v1ResearchSearched) ? v1ResearchSearched : [];
  const fallbackResearch = filterResearchByKeywords(
    allLiveResearchRaw,
    searchQuery.split(/[\s,]+/).filter(w => w.length > 3)
  );
  const researchSource = v1ResearchList.length > 0 ? v1ResearchList : fallbackResearch;
  const liveResearchFinal = researchSource.length > 0 ? researchSource : (allLiveResearchRaw || []);

  // ─── Frameworks: use authenticated v1 library (53) if available, else public RE-AIM+EPIS ──
  const v1FrameworksList: any[] = Array.isArray(v1Frameworks) ? v1Frameworks : [];
  const knowledgeFrameworks: any[] = knowledgeIsSlice?.data?.frameworks || [];
  // Frameworks for string list (AI context): prefer v1 full library, then knowledge slice, then public
  const frameworksForContext = v1FrameworksList.length > 0
    ? v1FrameworksList.map((f: any) => `${f.code || f.id || f.name}: ${f.name || f.fullName || ""}`)
    : knowledgeFrameworks.length > 0
      ? knowledgeFrameworks.map((f: any) => `${f.code}: ${f.name} [${(f.type || []).join(", ")}]`)
      : Array.isArray(liveFrameworksRaw)
        ? liveFrameworksRaw.map((f: any) => `${f.id}: ${f.fullName}`)
        : ["CFIR 2.0", "RE-AIM", "EPIS", "PRISM", "TDF", "i-PARIHS", "SALP", "MAP-GAP"];
  const frameworks = frameworksForContext;

  // Rich framework structs for dimensions/indicators/metrics (public RE-AIM+EPIS)
  const frameworksRich = Array.isArray(liveFrameworksRaw) ? liveFrameworksRaw : [];

  // ─── Categorize DB assessments ─────────────────────────────────────────────
  const cfirAssessments = dbAssessments.filter(a => a.assessmentType === "cfir");
  const reaimScorecards = dbAssessments.filter(a => a.assessmentType === "reaim");
  const fidelityChecklists = dbAssessments.filter(a => a.assessmentType === "fidelity");
  const threeRealitiesAnalyses = dbAssessments.filter(a => a.assessmentType === "three_realities");
  const communityAnalyses = dbAssessments.filter(a => a.assessmentType === "community_analysis");
  const multiAiAnalyses = dbAssessments.filter(a => a.assessmentType === "multi_ai_analysis");
  const grantNarratives = dbAssessments.filter(a => a.assessmentType === "grant_narrative");

  // ─── Live research studies ─────────────────────────────────────────────────
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

  const totalResearchLibraryCount = Array.isArray(allLiveResearchRaw) ? allLiveResearchRaw.length : 0;

  // ─── Tools catalog (90 tools from public knowledge slice) ─────────────────
  const toolsCatalog: any[] = Array.isArray(knowledgeToolsSlice?.data) ? knowledgeToolsSlice.data : [];
  const executionEngines: any[] = Array.isArray(execCatalog?.engines) ? execCatalog.engines : [];

  // ─── ERIC implementation strategies (authenticated) ───────────────────────
  const ericTaxonomy = v1ImplStrategyTaxonomy || null;

  // ─── CFIR constructs (authenticated) ──────────────────────────────────────
  const cfirConstructs = v1CfirConstructs || null;

  // ─── SALP canon (authenticated) ───────────────────────────────────────────
  const salpCanon = v1SalpCanon || null;

  // ─── Rubrics (authenticated) ──────────────────────────────────────────────
  const equityRubric = v1EquityRubric || null;
  const needsSchema = v1NeedsSchema || null;
  const sustainabilityRubric = v1SustainabilityRubric || null;

  // ─── Community analysis from RPLICE (authenticated, FIPS-based, 15 domains) ─
  const rpliceCommunityAnalysis = v1CommunityAnalysis || null;

  // ─── Grant profiles from RPLICE (authenticated) ───────────────────────────
  const rpliceGrantProfiles = Array.isArray(v1GrantProfiles) ? v1GrantProfiles : null;

  // ─── Federal integrations catalog (authenticated) ─────────────────────────
  const federalIntegrations = v1FederalIntegrations || null;

  const hasAuthenticatedData = RPLICE_API_KEY.length > 0;
  const ecosystemStatus = hasAuthenticatedData
    ? `bettersciencelab.com LIVE + AUTHENTICATED — ${v1FrameworksList.length || 53} frameworks, ${toolsCatalog.length || 90} tools, ${executionEngines.length} compute engines, 15-domain FIPS community analysis, CFIR 2.0 constructs, SALP canon, ERIC strategies, grant profiles`
    : `bettersciencelab.com PUBLIC — ${knowledgeFrameworks.length || 53} IS frameworks indexed, ${toolsCatalog.length || 90} tools cataloged, ${executionEngines.length} compute engines listed (add RPLICE_API_KEY to unlock full data layer)`;

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
  lines.push(`Source: www.bettersciencelab.com | Platform: RPLICE | ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Region: ${regionName} | Crisis domains: ${crisisDomains.join(", ") || "general"}`);
  lines.push(`Data layer: ${hasAuthenticatedData ? "AUTHENTICATED (full API)" : "PUBLIC (add RPLICE_API_KEY for full depth)"}`);
  lines.push("");

  // ── RPLICE community analysis (most powerful — FIPS → 15 domains) ──────────
  if (rpliceCommunityAnalysis) {
    lines.push("── RPLICE COMMUNITY ANALYSIS (bettersciencelab.com, FIPS-based, 15 domains) ──");
    const domains = rpliceCommunityAnalysis.domains || rpliceCommunityAnalysis.indicators || rpliceCommunityAnalysis;
    if (typeof domains === "object" && !Array.isArray(domains)) {
      for (const [domain, data] of Object.entries(domains).slice(0, 15)) {
        const d = data as any;
        lines.push(`• ${domain}: ${d?.score !== undefined ? `score=${d.score}` : ""} ${d?.summary || d?.label || JSON.stringify(d).slice(0, 80)}`);
      }
    } else if (Array.isArray(domains)) {
      for (const d of (domains as any[]).slice(0, 15)) {
        lines.push(`• ${d?.domain || d?.name}: ${d?.score !== undefined ? `score=${d.score}` : ""} ${d?.summary || ""}`);
      }
    }
    lines.push("");
  }

  if (studies.length > 0) {
    lines.push(`── LIVE SCHOLARLY RESEARCH (${hasAuthenticatedData ? "RPLICE v1 search" : "public library"}, ${studies.length} matched) ──`);
    for (const s of studies.slice(0, 8)) {
      lines.push(`• ${s.title}${s.year ? ` (${s.year})` : ""}${s.authors ? ` — ${s.authors}` : ""}${s.citationCount ? ` [${s.citationCount} cites]` : ""}`);
    }
    lines.push("");
  }

  if (frameworks.length > 0) {
    lines.push(`── IMPLEMENTATION FRAMEWORKS (${frameworks.length} available) ──`);
    for (const f of frameworks.slice(0, 12)) lines.push(`• ${f}`);
    lines.push("");
  }

  // ── CFIR 2.0 constructs (authenticated) ─────────────────────────────────
  if (cfirConstructs) {
    lines.push("── CFIR 2.0 CONSTRUCTS (bettersciencelab.com) ──");
    const constructs = Array.isArray(cfirConstructs) ? cfirConstructs : cfirConstructs.constructs || [];
    for (const c of (constructs as any[]).slice(0, 10)) {
      lines.push(`• [${c.domain}] ${c.name}: ${c.definition?.slice(0, 80) || ""}`);
    }
    lines.push("");
  }

  // ── SALP canon (authenticated) ───────────────────────────────────────────
  if (salpCanon) {
    lines.push("── SALP CANON (bettersciencelab.com) ──");
    const canon = Array.isArray(salpCanon) ? salpCanon : salpCanon.canon || salpCanon.indicators || [];
    for (const item of (canon as any[]).slice(0, 6)) {
      lines.push(`• ${item.dimension || item.letter}: ${item.description || item.definition || JSON.stringify(item).slice(0, 80)}`);
    }
    lines.push("");
  }

  // ── ERIC implementation strategies (authenticated) ───────────────────────
  if (ericTaxonomy) {
    lines.push("── ERIC IMPLEMENTATION STRATEGIES (bettersciencelab.com) ──");
    const strategies = Array.isArray(ericTaxonomy) ? ericTaxonomy : ericTaxonomy.strategies || [];
    for (const s of (strategies as any[]).slice(0, 8)) {
      lines.push(`• ${s.name || s.strategy}: ${s.description?.slice(0, 80) || ""}`);
    }
    lines.push("");
  }

  // ── Available compute engines ────────────────────────────────────────────
  if (executionEngines.length > 0) {
    lines.push("── RPLICE COMPUTE ENGINES AVAILABLE ──");
    for (const e of executionEngines) {
      lines.push(`• ${e.description} [${e.method} ${e.path}]`);
    }
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
      `Live RPLICE scholarly research: ${studies.length} studies (${hasAuthenticatedData ? "v1 authenticated search" : "public library"})`,
      `IS frameworks available: ${frameworks.length} (${hasAuthenticatedData ? "53 full library authenticated" : "knowledge slice + public"})`,
      hasAuthenticatedData && rpliceCommunityAnalysis ? `RPLICE community analysis: 15-domain FIPS data loaded` : null,
      hasAuthenticatedData && cfirConstructs ? `CFIR 2.0 constructs: loaded` : null,
      hasAuthenticatedData && ericTaxonomy ? `ERIC implementation strategies: loaded` : null,
      `Tools catalog: ${toolsCatalog.length} tools indexed`,
      `Compute engines: ${executionEngines.length} available (MAP-GAP, Preflight, Monte Carlo ×3, Stats, Stata, etc.)`,
      `CFIR assessments in DB: ${cfirAssessments.length}`,
      `RE-AIM scorecards in DB: ${reaimScorecards.length}`,
      `Fidelity checklists: ${fidelityChecklists.length}`,
      `Three Realities analyses: ${threeRealitiesAnalyses.length}`,
      `Community analyses (full 9-section): ${communityAnalyses.length}`,
      `Grant narratives previously generated: ${grantNarratives.length}`,
      `Active action plans (90-day): ${dbActionPlans.length}`,
      `Active outcome baselines: ${dbBaselines.length}`,
    ].filter(Boolean).join(" | "),
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

    // ── RPLICE authenticated data (null when RPLICE_API_KEY not set) ──────────
    rpliceAuthenticated: {
      enabled: hasAuthenticatedData,
      communityAnalysis: rpliceCommunityAnalysis,        // POST /api/v1/community-analysis — 15 domains
      frameworks: v1Frameworks,                          // GET /api/v1/frameworks — 53 IS frameworks
      cfirConstructs,                                    // GET /api/v1/cfir/constructs — 39 constructs
      salpCanon,                                         // GET /api/v1/salp/canon
      grantProfiles: rpliceGrantProfiles,                // GET /api/v1/grants/profiles
      equityRubric,                                      // GET /api/v1/equity-evaluation/rubric
      needsSchema,                                       // GET /api/v1/needs-assessment/schema
      sustainabilityRubric,                              // GET /api/v1/sustainability-wizard/rubric
      ericTaxonomy,                                      // GET /api/v1/implementation-strategy/taxonomy
      federalIntegrations,                               // GET /api/v1/federal-integrations
      researchSearchResults: v1ResearchList.length > 0 ? v1ResearchList : null,
    },

    // ── RPLICE public data (always live, no key needed) ───────────────────────
    rplicePublic: {
      knowledgeFrameworks,                               // 53 IS frameworks (code, name, type, citation)
      toolsCatalog,                                      // 90 tools (category, capabilities, stages, url)
      executionEngines,                                  // 11 compute engines
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

/**
 * Build a compact, AI-ready community context block for a known geography.
 *
 * Called by: Navigator (when ZIP detected), Collaborative AI (when geography
 * is in session), grant narrative engine, and any AI surface that knows where
 * the user is. Returns a string ready to prepend to any system prompt.
 *
 * Runs Census + RPLICE in parallel — typical latency 800ms-2s.
 */
export type CommunityAIContextSourceStatus = "available" | "empty" | "not_requested" | "failed";

export interface CommunityAIContextResult {
  content: string;
  sources: {
    census: CommunityAIContextSourceStatus;
    rplice: CommunityAIContextSourceStatus;
    civicSignal: CommunityAIContextSourceStatus;
    childcore: CommunityAIContextSourceStatus;
  };
}

export async function buildCommunityAIContextWithStatus(params: {
  zip?: string;
  stateFips?: string;
  countyFips?: string;
  crisisDomains?: string[];
  regionName?: string;
}): Promise<CommunityAIContextResult> {
  const { zip, stateFips, countyFips, crisisDomains = [], regionName } = params;

  try {
    const state = zip ? stateAbbrevFromZip(zip) : undefined;
    const civicTopic = crisisDomains[0] || "general";
    let rpliceFailed = false;
    let censusFailed = false;
    let civicSignalFailed = false;
    let childcoreFailed = false;
    const [rplicePkg, censusData, civicSignalContext, childcoreData] = await Promise.all([
      buildRpliceIntelligencePackage({
        crisisDomains,
        regionName: regionName || zip || "community",
        stateFips,
        countyFips,
        includePrivateData: false,
      }).catch((err) => {
        rpliceFailed = true;
        console.error("[CommunityContext] RPLICE package unavailable:", err instanceof Error ? err.message : String(err));
        return null;
      }),
      zip ? fetchZctaData(zip).catch((err) => {
        censusFailed = true;
        console.error("[CommunityContext] Census ZCTA data unavailable:", err instanceof Error ? err.message : String(err));
        return null;
      }) : Promise.resolve(null),
      getCivicSignalRAGContextAsync({
        topic: civicTopic,
        state,
        pullLive: Boolean(zip || stateFips || regionName),
      }).catch((err) => {
        civicSignalFailed = true;
        console.error("[CommunityContext] Civic Signal context failed:", err instanceof Error ? err.message : String(err));
        return "";
      }),
      zip ? getChildCORECommunityData(zip).catch((err) => {
        childcoreFailed = true;
        console.error("[CommunityContext] ChildCORE data unavailable:", err instanceof Error ? err.message : String(err));
        return null;
      }) : Promise.resolve(null),
    ]);

    const lines: string[] = [];
    lines.push("══ LIVE COMMUNITY INTELLIGENCE ══");

    // ── Census snapshot for this ZIP ───────────────────────────────────────────
    if (censusData && zip) {
      const ind = censusData.indicators || {};
      lines.push(`\n[CENSUS DATA — ZIP ${zip}${censusData.countyName ? " · " + censusData.countyName : ""}]`);
      if (censusData.population) lines.push(`• Population: ${Number(censusData.population).toLocaleString()}`);
      if (censusData.medianIncome) lines.push(`• Median household income: $${Number(censusData.medianIncome).toLocaleString()}`);
      if (ind.povertyRate) lines.push(`• Poverty rate: ${ind.povertyRate}%`);
      if (ind.unemploymentRate) lines.push(`• Unemployment: ${ind.unemploymentRate}%`);
      if (ind.uninsuredRate) lines.push(`• Uninsured: ${ind.uninsuredRate}%`);
      if (ind.noHighSchoolDiploma) lines.push(`• No HS diploma: ${ind.noHighSchoolDiploma}%`);
      if (ind.singleParentRate) lines.push(`• Single-parent households: ${ind.singleParentRate}%`);
      if (ind.snapRecipients) lines.push(`• SNAP recipients: ${ind.snapRecipients}%`);
      if (ind.limitedEnglish) lines.push(`• Limited English proficiency: ${ind.limitedEnglish}%`);
      if (censusData.sviScore != null) lines.push(`• Social Vulnerability Index: ${censusData.sviScore} (0=lowest, 1=highest)`);

      // Surface the top "needs attention" flags directly
      const flags = (censusData.needsAttention || []).slice(0, 4);
      if (flags.length > 0) {
        lines.push("• Community flags: " + flags.map((f: any) => f.label).join(" · "));
      }
    }

    // ── RPLICE 15-domain community analysis (FIPS-level) ──────────────────────
    const communityAnalysis = rplicePkg?.rpliceAuthenticated?.communityAnalysis;
    if (communityAnalysis?.domains?.length) {
      lines.push("\n[RPLICE COMMUNITY ANALYSIS — TOP DOMAINS BY SEVERITY]");
      const top = [...communityAnalysis.domains]
        .sort((a: any, b: any) => (b.severityScore ?? 0) - (a.severityScore ?? 0))
        .slice(0, 6);
      for (const d of top) {
        const tags = d.cfirConstructTags?.slice(0, 2).join(", ") || "";
        lines.push(`• ${d.domain}: severity ${d.severityScore ?? "?"}/10${tags ? " — CFIR: " + tags : ""}`);
      }
    }

    // ── RPLICE IS frameworks + grant profiles + implementation science ─────────
    if (rplicePkg?.aiContextBlock) {
      lines.push("\n" + rplicePkg.aiContextBlock);
    }

    // ── Community data-led story and action orchestra ─────────────────────────
    lines.push(
      "\n## COMMUNITY DATA-LED STORY + ACTION ORCHESTRA",
      "Sequence the response as: place → lived experience → evidence → meaning → community-defined priority → next action → measure and learn.",
      "Keep evidence classes distinct: Observed (source data), Derived (calculated interpretation), Modeled (scenario or forecast), Implemented (recorded action or outcome), and Partner lesson (Civic Signal).",
      "Do not invent a resident voice, outcome, program capacity, or partner agreement. Say what is known, what is inferred, what is modeled, and what still needs community confirmation.",
      "When the user is asking for a plan, return practical actions with an owner, timeframe, evidence basis, community safeguard, and success measure. The plan supports human decisions; it does not make them.",
    );

    if (civicSignalContext) {
      lines.push("\n" + civicSignalContext);
    }

    // ── ChildCORE partner data (providers, schools, SDOH, impact) ──────────────
    if (childcoreData) {
      lines.push("\n" + buildChildCOREContextBlock(childcoreData));
    }

    return {
      content: lines.join("\n"),
      sources: {
        census: zip ? (censusFailed ? "failed" : censusData ? "available" : "empty") : "not_requested",
        rplice: rpliceFailed ? "failed" : rplicePkg ? "available" : "empty",
        civicSignal: civicSignalFailed ? "failed" : civicSignalContext ? "available" : "empty",
        childcore: zip ? (childcoreFailed ? "failed" : childcoreData ? "available" : "empty") : "not_requested",
      },
    };
  } catch {
    return {
      content: "",
      sources: {
        census: params.zip ? "failed" : "not_requested",
        rplice: "failed",
        civicSignal: "failed",
        childcore: params.zip ? "failed" : "not_requested",
      },
    };
  }
}

export async function buildCommunityAIContext(params: {
  zip?: string;
  stateFips?: string;
  countyFips?: string;
  crisisDomains?: string[];
  regionName?: string;
}): Promise<string> {
  return (await buildCommunityAIContextWithStatus(params)).content;
}
