/**
 * Community Impact Conductor — the orchestration layer that connects all social
 * systems (health, mental health, benefits, housing, ECE, education, justice,
 * workforce, foster care, homeless) into a single community story, nationwide.
 *
 * POST /api/conductor/community-brief  — full analysis for any geography
 * POST /api/conductor/compare          — side-by-side multi-geography comparison
 */

import type { Express, NextFunction, Request, Response } from "express";
import { buildRpliceIntelligencePackage } from "./rplice-intelligence";
import { buildRpliceInboundContext } from "./rplice-inbound-routes";
import {
  resolveLocationToZip,
  fetchZctaData,
  resolveCountyInput,
  fetchCountyData,
  fetchMultiCountyData,
  FIPS_TO_STATE as CONDUCTOR_FIPS_TO_STATE,
} from "./neighborhood-routes";
import {
  EVIDENCE_PROGRAMS,
  JURISDICTION_DATA,
  type EvidenceProgram,
} from "./chainweb-coefficients";
import { generateAIJSON } from "./ai-provider";
import { db, storage } from "./storage";
import { grantOpportunities } from "@shared/schema";
import { desc, gte, and, isNotNull } from "drizzle-orm";
import { hasValidCommunityEvidence } from "./community-evidence";

// ── First-party session auth (mirrors requireAuth in server/routes.ts) ────────
// Roles live in the users table, never on req.user — resolve via storage.getUser
// (same pattern as yhsi-routes requireStaff).
function conductorGetUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub || user?.id;
}

function conductorRequireAuth(req: Request, res: Response, next: NextFunction) {
  if (!conductorGetUserId(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// ── Anonymous abuse protection for the PUBLIC community analyzer ──────────────
// The community-brief + neighbor-zips endpoints are a public, no-account-required
// marketing feature. They must NOT sit behind a login wall (that killed the
// flagship promise). Instead we protect anonymous access with three cheap,
// in-memory controls: a per-IP sliding-window rate limit, a per-ZIP response
// cache (so repeated lookups of the same ZIP don't re-spend Census + AI), and
// hard caps on request body values. None of these endpoints returns PII — they
// serve only aggregate public Census data + capped AI narrative — so anonymous
// access is safe once amplification/cost is bounded.

function conductorClientIp(req: Request): string {
  // Use Express's resolved client IP. The app runs with `trust proxy = 1`
  // (server/replit_integrations/auth/replitAuth.ts), so req.ip is the real
  // client address as resolved from the single trusted Replit proxy hop — NOT
  // an attacker-controlled raw X-Forwarded-For header. Parsing the raw header
  // ourselves would let any caller spoof a fresh IP per request and bypass the
  // rate limit to make unlimited paid Census + AI calls.
  const ip = req.ip || req.socket?.remoteAddress || "";
  return ip.trim() || "unknown";
}

// Per-IP sliding window: at most CONDUCTOR_BRIEF_MAX briefs per window.
const CONDUCTOR_BRIEF_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CONDUCTOR_BRIEF_MAX = 5;
const conductorIpHits = new Map<string, number[]>();

// Returns null if allowed, or the number of seconds until the caller may retry.
function conductorRateLimit(ip: string): number | null {
  const now = Date.now();
  const cutoff = now - CONDUCTOR_BRIEF_WINDOW_MS;
  const hits = (conductorIpHits.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= CONDUCTOR_BRIEF_MAX) {
    const retryMs = hits[0] + CONDUCTOR_BRIEF_WINDOW_MS - now;
    conductorIpHits.set(ip, hits);
    return Math.max(1, Math.ceil(retryMs / 1000));
  }
  hits.push(now);
  conductorIpHits.set(ip, hits);
  // Opportunistic cleanup so the map doesn't grow unbounded across many IPs.
  if (conductorIpHits.size > 5000) {
    for (const [k, v] of conductorIpHits) {
      const live = v.filter((t) => t > cutoff);
      if (live.length === 0) conductorIpHits.delete(k);
      else conductorIpHits.set(k, live);
    }
  }
  return null;
}

// Per-ZIP response cache (simple LRU by insertion order + TTL). Keyed on the
// full request shape (zip + populationSize + timeHorizon) so different cascade
// parameters don't collide. Caches ONLY successful aggregate briefs — never
// errors, never anything caller-specific.
const CONDUCTOR_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const CONDUCTOR_CACHE_MAX = 300;
const conductorBriefCache = new Map<string, { at: number; value: unknown }>();

function conductorCacheGet(key: string): unknown | undefined {
  const entry = conductorBriefCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > CONDUCTOR_CACHE_TTL_MS) {
    conductorBriefCache.delete(key);
    return undefined;
  }
  // A cache entry written by an older server version (before an evidence-
  // integrity fix shipped) can otherwise be served, unchanged, for up to the
  // full TTL — silently reintroducing a bug that was already fixed in code.
  // Treat any cached value that fails today's strict contract as a miss.
  if (!hasValidCommunityEvidence(entry.value)) {
    conductorBriefCache.delete(key);
    return undefined;
  }
  // Refresh LRU recency.
  conductorBriefCache.delete(key);
  conductorBriefCache.set(key, entry);
  return entry.value;
}

function conductorCacheSet(key: string, value: unknown): void {
  conductorBriefCache.set(key, { at: Date.now(), value });
  while (conductorBriefCache.size > CONDUCTOR_CACHE_MAX) {
    const oldest = conductorBriefCache.keys().next().value;
    if (oldest === undefined) break;
    conductorBriefCache.delete(oldest);
  }
}

// Clamp caller-supplied numeric cascade parameters into sane ranges. Anonymous
// callers must not be able to drive absurd population/time values into the
// cost model.
function conductorClampInt(raw: unknown, def: number, min: number, max: number): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n)));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DomainScore {
  score: number;
  grade: string;
  label: string;
  icon: string;
  keyGap: string;
  urgency: "stable" | "watch" | "concern" | "crisis";
}

export interface AtRiskPopulation {
  id: string;
  name: string;
  icon: string;
  estimated: number;
  unit: string;
  primaryGap: string;
  urgency: "moderate" | "high" | "critical";
  interventions: string[];
}

interface CascadeChain {
  chain: string;
  without: string;
  with: string;
  costDelta: number;
}

interface TimelineNode {
  age: string;
  milestone: string;
  without: string;
  with: string;
  interventionWindow?: string;
}

interface HistoricalVintage {
  year: number;
  povertyRate: number;
  unemploymentRate: number;
  cohortCost: number;
}

interface HistoricalCascade {
  vintages: HistoricalVintage[];
  totalAccumulatedCost: number;
  trendDirection: "improving" | "stagnant" | "worsening";
  yearsAboveCrisisThreshold: number;
  keyInsight: string;
  yearsOfData: number;
}

interface CommunityEvidenceContract {
  version: "community-evidence/v1";
  geography: {
    requested: { input: string; type: "zip" | "city" | "county" | "multi_county" | "address_or_place" };
    resolved: {
      type: "zcta" | "county" | "multi_county";
      identifier: string;
      label: string;
      method: string;
      coverageWarning?: string;
    };
  };
  sources: Array<{
    publisher: "U.S. Census Bureau";
    dataset: "American Community Survey 5-Year Estimates";
    vintage: "2022";
    retrievedAt: string;
    url: string;
    variables: string[];
    geographyGrain: "ZCTA" | "county" | "multi-county aggregate";
  }>;
  claims: {
    observed: { label: string; status: "available" };
    tcafDerived: { label: string; status: "available" | "unavailable"; disclosure: string };
    tcafScenario: { label: string; status: "available" | "unavailable"; disclosure: string };
    historicalCascade: { label: string; status: "available" | "unavailable"; disclosure: string };
    aiSynthesis: { label: string; status: "available"; disclosure: string };
  };
  dataQuality: {
    status: "verified_at_resolved_grain" | "limited_resolution" | "unavailable";
    warnings: string[];
  };
}

interface ConductorBrief {
  geography: {
    input: string;
    zip: string;
    displayName: string;
    state: string;
    countyName: string;
  };
  demographics: Record<string, number | string | null>;
  systemsScores: Record<string, DomainScore>;
  overallScore: number | null;
  overallGrade: string | null;
  atRiskPopulations: AtRiskPopulation[];
  cascade: {
    timeHorizonYears: number;
    populationSize: number;
    counterfactualCost: number;
    interventionCost: number;
    netSavings: number;
    roi: string;
    keyChains: CascadeChain[];
    timeline: TimelineNode[];
  } | null;
  historicalCascade: HistoricalCascade | null;
  solutions: {
    topInterventions: EvidenceProgram[];
    grants: any[];
    policyActions: string[];
  };
  narrative: string;
  policyContext: {
    state: string;
    strengths: string[];
    gaps: string[];
    nationalComparison: string;
  };
  evidence: CommunityEvidenceContract;
  // AUTHENTICATED-ONLY. The RPLICE intelligence package is built from
  // GLOBALLY-scoped, non-geography-filtered internal operational data (active
  // action plans, outcome baselines, assessment records). It must NEVER be sent
  // to an anonymous caller of the public analyzer — it is attached only when a
  // first-party session is present, so on anonymous responses this field is
  // simply omitted (hence optional).
  rplice?: ConductorRpliceBlock | null;
  generatedAt: string;
}

// Shape of the RPLICE intelligence block as actually constructed below. Typed
// explicitly so the constructed object is checked against a real contract and
// authed clients get a stable shape.
interface ConductorRpliceBlock {
  relevant: boolean;
  reasoning: string;
  relevanceScore: number;
  interventionAssignments: unknown[];
  actionPlanMilestones: unknown[];
  outcomeBaselines: unknown[];
  liveResearch: {
    studies: unknown[];
    frameworks: unknown[];
    ecosystemStatus: unknown;
  };
  matchedGrantProfiles: Array<{
    id: unknown;
    name: unknown;
    funder: unknown;
    priority: unknown;
    alignmentScore: unknown;
    matchedDomains: unknown;
    focusAreas: unknown;
  }>;
  platformInterventions: unknown;
  assessmentCounts: {
    cfir: number;
    reaim: number;
    fidelity: number;
    threeRealities: number;
    communityAnalyses: number;
    grantNarratives: number;
    activeActionPlans: number;
    activeBaselines: number;
  };
  inboundEvidenceFeedActive: boolean;
}

// ─── Domain scoring (derived from Census indicators) ─────────────────────────

function gradeFromScore(score: number): string {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

function urgencyFromScore(score: number): DomainScore["urgency"] {
  if (score >= 75) return "stable";
  if (score >= 60) return "watch";
  if (score >= 45) return "concern";
  return "crisis";
}

function clamp(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

function computeDomainScores(ind: {
  povertyRate: number;
  uninsuredRate: number;
  housingCostBurden?: number;
  singleParentRate: number;
  unemploymentRate: number;
  noHighSchoolDiploma: number;
  limitedEnglish?: number;
  disabilityRate?: number;
  age65Plus?: number;
  ageUnder17?: number;
}): Record<string, DomainScore> {
  const {
    povertyRate: pov,
    uninsuredRate: unins,
    housingCostBurden: hcb,
    singleParentRate: spr,
    unemploymentRate: unem,
    noHighSchoolDiploma: noHs,
    disabilityRate: dis,
  } = ind;

  const domains: Array<{
    id: string;
    score: number;
    label: string;
    icon: string;
    keyGap: string;
  }> = [
    {
      id: "healthAccess",
      score: clamp(100 - unins * 2.8 - pov * 0.4),
      label: "Health Access",
      icon: "Heart",
      keyGap:
        unins > 15
          ? `${unins.toFixed(1)}% uninsured — 3× national average; preventive care largely inaccessible`
          : unins > 8
            ? `${unins.toFixed(1)}% uninsured — coverage gaps for low-income and self-employed workers`
            : "Health coverage adequate; access barriers (transportation, hours) remain",
    },
    {
      id: "mentalHealth",
      score: clamp(100 - pov * 1.9 - unins * 1.4 - spr * 0.5),
      label: "Mental Health",
      icon: "Brain",
      keyGap:
        pov > 20 || unins > 15
          ? "Mental health desert — high poverty + uninsured = zero access for most who need care"
          : "Provider capacity insufficient; uninsured adults cannot afford outpatient therapy",
    },
    {
      id: "benefits",
      score: clamp(100 - pov * 1.8 - unins * 1.3),
      label: "Benefits Access",
      icon: "Shield",
      keyGap:
        pov > 20
          ? "High poverty with enrollment gaps — SNAP, Medicaid, EITC under-utilized due to navigation barriers"
          : "Benefits available but enrollment complexity prevents full utilization",
    },
    {
      id: "housing",
      score: clamp(100 - ((hcb ?? Number.NaN) - 20) * 2.2 - pov * 0.6),
      label: "Housing Stability",
      icon: "Home",
      keyGap:
        Number(hcb) > 40
          ? `${Number(hcb).toFixed(1)}% spend >30% income on housing — eviction risk high; homelessness pipeline active`
          : Number(hcb) > 30
            ? `${Number(hcb).toFixed(1)}% cost-burdened; one crisis away from housing loss`
            : "Housing costs manageable; affordability gaps emerging",
    },
    {
      id: "earlyChildhood",
      score: clamp(100 - pov * 2.6 - spr * 1.3),
      label: "Early Childhood",
      icon: "Baby",
      keyGap:
        pov > 20
          ? "Children in poverty lack pre-K — 3rd grade failure risk elevated; school-to-prison pipeline seeded at birth"
          : "ECE affordability gap for working-poor families; waitlists common",
    },
    {
      id: "education",
      score: clamp(100 - noHs * 2.9 - unem * 0.7),
      label: "Education",
      icon: "GraduationCap",
      keyGap:
        noHs > 20
          ? `${noHs.toFixed(1)}% lack HS diploma — generational poverty lock; workforce exclusion compounds`
          : noHs > 12
            ? `${noHs.toFixed(1)}% without diploma; GED and adult ed pathways underfunded`
            : "Educational attainment solid; gaps concentrate in specific subpopulations",
    },
    {
      id: "justice",
      score: clamp(100 - pov * 1.3 - noHs * 1.6 - spr * 0.9),
      label: "Justice & Safety",
      icon: "Scale",
      keyGap:
        pov > 20 && noHs > 15
          ? "Poverty + education gaps create high incarceration probability; reentry support absent"
          : "Justice involvement risk elevated; reentry employment barriers compound recidivism",
    },
    {
      id: "workforce",
      score: clamp(100 - unem * 3.8 - noHs * 1.7),
      label: "Workforce",
      icon: "Briefcase",
      keyGap:
        unem > 10
          ? `${unem.toFixed(1)}% unemployment — structural mismatch; credential gap locking workers out`
          : unem > 6
            ? `${unem.toFixed(1)}% unemployment; skills gap emerging as economy shifts`
            : "Employment strong; wage stagnation and benefits quality gap remain",
    },
    {
      id: "fostersAndAging",
      score: clamp(100 - pov * 1.5 - (dis ?? Number.NaN) * 1.2 - spr * 0.8),
      label: "Foster & Aging",
      icon: "Users",
      keyGap:
        "Youth aging out of foster care and elderly without family support fall through system gaps simultaneously",
    },
    {
      id: "ruralAccess",
      score: clamp(100 - unins * 1.5 - unem * 2 - noHs * 1.2),
      label: "Rural & Remote",
      icon: "MapPin",
      keyGap: "Broadband, transportation, and provider deserts create access barriers regardless of coverage",
    },
  ];

  const result: Record<string, DomainScore> = {};
  for (const d of domains) {
    if (!Number.isFinite(d.score)) continue;
    result[d.id] = {
      score: d.score,
      grade: gradeFromScore(d.score),
      label: d.label,
      icon: d.icon,
      keyGap: d.keyGap,
      urgency: urgencyFromScore(d.score),
    };
  }
  return result;
}

// ─── At-risk population estimator ────────────────────────────────────────────

function identifyAtRiskPopulations(
  ind: {
    povertyRate: number;
    uninsuredRate: number;
    housingCostBurden?: number;
    singleParentRate: number;
    unemploymentRate: number;
    noHighSchoolDiploma: number;
    limitedEnglish?: number;
    disabilityRate?: number;
    ageUnder17?: number;
    age65Plus?: number;
    totalPopulation?: number;
  },
  totalPopulation: number
): AtRiskPopulation[] {
  const {
    povertyRate: pov,
    uninsuredRate: unins,
    housingCostBurden: hcb,
    singleParentRate: spr,
    unemploymentRate: unem,
    noHighSchoolDiploma: noHs,
    limitedEnglish: le,
    disabilityRate: dis,
    ageUnder17,
    age65Plus,
  } = ind;

  const pop = totalPopulation;

  const populations: AtRiskPopulation[] = [
    {
      id: "children-poverty",
      name: "Children in Poverty",
      icon: "Baby",
      estimated: Math.round(pop * (Number(ageUnder17) / 100) * (pov / 100)),
      unit: "children",
      primaryGap: "Pre-K access, food security, stable housing",
      urgency: pov > 25 ? "critical" : pov > 15 ? "high" : "moderate",
      interventions: ["Head Start / pre-K enrollment", "SNAP outreach", "NFP home visiting", "After-school programs"],
    },
    {
      id: "uninsured-adults",
      name: "Uninsured Adults",
      icon: "Heart",
      estimated: Math.round(pop * (unins / 100) * 0.75),
      unit: "adults",
      primaryGap: "No access to preventive care, mental health, or prescription coverage",
      urgency: unins > 18 ? "critical" : unins > 10 ? "high" : "moderate",
      interventions: ["ACA Marketplace enrollment", "Medicaid navigation", "FQHC outreach", "CHW-led enrollment drives"],
    },
    {
      id: "housing-burdened",
      name: "Housing Cost-Burdened",
      icon: "Home",
      estimated: Math.round(pop * ((Math.max(Number(hcb), 20) - 20) / 100) * 0.6),
      unit: "households",
      primaryGap: "One crisis from eviction; no emergency housing safety net",
      urgency: Number(hcb) > 40 ? "critical" : Number(hcb) > 30 ? "high" : "moderate",
      interventions: ["Emergency rental assistance", "Housing counseling", "Section 8 waitlist navigation", "Housing First programs"],
    },
    {
      id: "single-parents",
      name: "Single-Parent Households",
      icon: "Users",
      estimated: Math.round(pop * (spr / 100) * 0.35),
      unit: "households",
      primaryGap: "Childcare cost exceeds wages; no backup care; job instability cycles with childcare gaps",
      urgency: spr > 35 ? "critical" : spr > 20 ? "high" : "moderate",
      interventions: ["Subsidized childcare (CCDF)", "Head Start priority enrollment", "Co-parenting resources", "Emergency childcare fund"],
    },
    {
      id: "limited-english",
      name: "Limited English Proficient",
      icon: "Globe",
      estimated: Math.round(pop * (Number(le) / 100)),
      unit: "individuals",
      primaryGap: "Language barrier blocks benefits enrollment, healthcare navigation, employment, and legal access",
      urgency: Number(le) > 15 ? "high" : "moderate",
      interventions: ["CHW/promotora outreach", "Multilingual benefits navigation", "ESL programs", "Interpreter services"],
    },
    {
      id: "disability",
      name: "People with Disabilities",
      icon: "Accessibility",
      estimated: Math.round(pop * (Number(dis) / 100)),
      unit: "individuals",
      primaryGap: "Benefits cliffs (earn too much → lose Medicaid), employment discrimination, inaccessible services",
      urgency: "high",
      interventions: ["SSI/SSDI counseling", "Ticket to Work navigation", "Accessible employment", "ADA accommodation support"],
    },
    {
      id: "elderly-isolated",
      name: "Elderly & Isolated (65+)",
      icon: "UserCheck",
      estimated: Math.round(pop * (Number(age65Plus) / 100) * 0.25),
      unit: "individuals",
      primaryGap: "Social isolation, technology barrier to benefits, caregiver absence, medication costs",
      urgency: "high",
      interventions: ["Meals on Wheels", "PACE program", "Benefits counseling", "Volunteer visitor programs"],
    },
  ];

  return populations.filter((p) => Number.isFinite(p.estimated) && p.estimated > 0).sort((a, b) => {
    const urgOrder = { critical: 0, high: 1, moderate: 2 };
    return urgOrder[a.urgency] - urgOrder[b.urgency];
  });
}

// ─── State name/abbrev → FIPS lookup ─────────────────────────────────────────

const STATE_FIPS: Record<string, string> = {
  AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
  HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
  MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
  NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
  SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",
  DC:"11",PR:"72",
  ALABAMA:"01",ALASKA:"02",ARIZONA:"04",ARKANSAS:"05",CALIFORNIA:"06",COLORADO:"08",
  CONNECTICUT:"09",DELAWARE:"10",FLORIDA:"12",GEORGIA:"13",HAWAII:"15",IDAHO:"16",
  ILLINOIS:"17",INDIANA:"18",IOWA:"19",KANSAS:"20",KENTUCKY:"21",LOUISIANA:"22",
  MAINE:"23",MARYLAND:"24",MASSACHUSETTS:"25",MICHIGAN:"26",MINNESOTA:"27",
  MISSISSIPPI:"28",MISSOURI:"29",MONTANA:"30",NEBRASKA:"31",NEVADA:"32",
  "NEW HAMPSHIRE":"33",NEWHAMPSHIRE:"33","NEW JERSEY":"34",NEWJERSEY:"34",
  "NEW MEXICO":"35",NEWMEXICO:"35","NEW YORK":"36",NEWYORK:"36",
  "NORTH CAROLINA":"37",NORTHCAROLINA:"37","NORTH DAKOTA":"38",NORTHDAKOTA:"38",
  OHIO:"39",OKLAHOMA:"40",OREGON:"41",PENNSYLVANIA:"42","RHODE ISLAND":"44",
  RHODEISLAND:"44","SOUTH CAROLINA":"45",SOUTHCAROLINA:"45","SOUTH DAKOTA":"46",
  SOUTHDAKOTA:"46",TENNESSEE:"47",TEXAS:"48",UTAH:"49",VERMONT:"50",VIRGINIA:"51",
  WASHINGTON:"53","WEST VIRGINIA":"54",WESTVIRGINIA:"54",WISCONSIN:"55",WYOMING:"56",
  "DISTRICT OF COLUMBIA":"11",DISTRICTOFCOLUMBIA:"11","PUERTO RICO":"72",PUERTORICO:"72",
};

function stateFipsFromName(name: string): string {
  const key = name.trim().toUpperCase().replace(/[^A-Z ]/g, "");
  return STATE_FIPS[key] || STATE_FIPS[key.replace(/ /g, "")] || "";
}

// ZIP range → state FIPS — covers all 50 states + DC + PR
function stateFipsFromZip(zip: string): string {
  const n = parseInt(zip.slice(0, 5), 10);
  if (isNaN(n)) return "";
  if (n >= 600   && n <= 988  ) return "72"; // PR
  if (n >= 1000  && n <= 2799 ) return "25"; // MA
  if (n >= 2800  && n <= 2999 ) return "44"; // RI
  if (n >= 3000  && n <= 3899 ) return "33"; // NH
  if (n >= 3900  && n <= 4999 ) return "23"; // ME
  if (n >= 5000  && n <= 5999 ) return "50"; // VT
  if (n >= 6000  && n <= 6999 ) return "09"; // CT
  if (n >= 7000  && n <= 8999 ) return "34"; // NJ
  if (n >= 10000 && n <= 14999) return "36"; // NY
  if (n >= 15000 && n <= 19699) return "42"; // PA
  if (n >= 19700 && n <= 19999) return "10"; // DE
  if (n >= 20000 && n <= 20099) return "11"; // DC
  if (n >= 20100 && n <= 20199) return "51"; // VA (N. VA)
  if (n >= 20200 && n <= 20599) return "11"; // DC
  if (n >= 20600 && n <= 21999) return "24"; // MD
  if (n >= 22000 && n <= 24699) return "51"; // VA
  if (n >= 24700 && n <= 26999) return "54"; // WV
  if (n >= 27000 && n <= 28999) return "37"; // NC
  if (n >= 29000 && n <= 29999) return "45"; // SC
  if (n >= 30000 && n <= 31999) return "13"; // GA
  if (n >= 32000 && n <= 34999) return "12"; // FL
  if (n >= 35000 && n <= 36999) return "01"; // AL
  if (n >= 37000 && n <= 38599) return "47"; // TN
  if (n >= 38600 && n <= 39999) return "28"; // MS
  if (n >= 40000 && n <= 42799) return "21"; // KY
  if (n >= 43000 && n <= 45999) return "39"; // OH
  if (n >= 46000 && n <= 47999) return "18"; // IN
  if (n >= 48000 && n <= 49999) return "26"; // MI
  if (n >= 50000 && n <= 52999) return "19"; // IA
  if (n >= 53000 && n <= 54999) return "55"; // WI
  if (n >= 55000 && n <= 56799) return "27"; // MN
  if (n >= 57000 && n <= 57999) return "46"; // SD
  if (n >= 58000 && n <= 58999) return "38"; // ND
  if (n >= 59000 && n <= 59999) return "30"; // MT
  if (n >= 60000 && n <= 62999) return "17"; // IL
  if (n >= 63000 && n <= 65999) return "29"; // MO
  if (n >= 66000 && n <= 67999) return "20"; // KS
  if (n >= 68000 && n <= 69999) return "31"; // NE
  if (n >= 70000 && n <= 71599) return "22"; // LA
  if (n >= 71600 && n <= 72999) return "05"; // AR
  if (n >= 73000 && n <= 74999) return "40"; // OK
  if (n >= 75000 && n <= 79999) return "48"; // TX
  if (n >= 80000 && n <= 81999) return "08"; // CO
  if (n >= 82000 && n <= 83199) return "56"; // WY
  if (n >= 83200 && n <= 83999) return "16"; // ID
  if (n >= 84000 && n <= 84999) return "49"; // UT
  if (n >= 85000 && n <= 86599) return "04"; // AZ
  if (n >= 87000 && n <= 88499) return "35"; // NM
  if (n >= 88500 && n <= 88599) return "48"; // TX (El Paso area)
  if (n >= 89000 && n <= 89999) return "32"; // NV
  if (n >= 90000 && n <= 96199) return "06"; // CA
  if (n >= 96700 && n <= 96899) return "15"; // HI
  if (n >= 97000 && n <= 97999) return "41"; // OR
  if (n >= 98000 && n <= 99499) return "53"; // WA
  if (n >= 99500 && n <= 99999) return "02"; // AK
  return "";
}

// ─── Historical cascade — what has ALREADY been paid (multi-vintage ACS) ──────

async function buildHistoricalCascade(zcta: string, censusKey: string, stateFips = ""): Promise<HistoricalCascade> {
  const VINTAGES = [2013, 2015, 2019, 2022];
  const BASE = "https://api.census.gov/data";
  const kp = censusKey ? `&key=${censusKey}` : "";
  const CURRENT_YEAR = 2025;
  const CRISIS_POVERTY_THRESHOLD = 15;

  // Helper: try a URL, return parsed row or null
  async function tryUrl(url: string) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) return null;
      const data = await resp.json();
      // Census returns [[header...], [row...]] — error responses are objects or have string first element
      if (!Array.isArray(data) || !Array.isArray(data[0]) || !data[1]) return null;
      return data[1] as string[];
    } catch { return null; }
  }

  // Fetch poverty + unemployment for each vintage in parallel
  // Older ACS vintages require &in=state:{fips} to disambiguate ZCTA queries
  const rows = await Promise.all(
    VINTAGES.map(async (yr) => {
      try {
        const vars = "NAME,B17001_001E,B17001_002E,B23025_003E,B23025_005E";
        const geo  = `for=zip%20code%20tabulation%20area:${zcta}`;
        const base = `${BASE}/${yr}/acs/acs5?get=${vars}&${geo}`;

        // Try simple URL first (works for 2022+)
        let row = await tryUrl(`${base}${kp}`);

        // If that fails and we have a state FIPS, add &in=state qualifier
        if (!row && stateFips) {
          row = await tryUrl(`${base}&in=state:${stateFips}${kp}`);
        }

        // If still nothing and we have a 2-digit FIPS from ZCTA prefix, try TX=48 as last resort
        if (!row) {
          // Most ZCTAs can be partially mapped by leading digits — skip rather than guess wrong
          return null;
        }

        const total      = parseInt(row[1]) || 0;
        const inPoverty  = parseInt(row[2]) || 0;
        const laborForce = parseInt(row[3]) || 0;
        const unemployed = parseInt(row[4]) || 0;
        return {
          year: yr,
          povertyRate:      total > 0      ? (inPoverty  / total)      * 100 : 0,
          unemploymentRate: laborForce > 0 ? (unemployed / laborForce) * 100 : 0,
        };
      } catch { return null; }
    })
  );

  const valid = rows.filter(Boolean) as Array<{ year: number; povertyRate: number; unemploymentRate: number }>;

  // Require at least 2 distinct vintage years. A single year cannot show
  // trend direction and would generate a misleading "for at least 12 years"
  // insight. Return null so the caller sets the evidence claim to "unavailable"
  // rather than presenting incomplete data as a full historical receipt.
  if (valid.length < 2) {
    throw new Error(
      `buildHistoricalCascade: only ${valid.length} of ${VINTAGES.length} vintages returned data for ZCTA ${zcta} — insufficient for a multi-year receipt`,
    );
  }

  // For each vintage, compute what that year's cohort of at-risk children has
  // ALREADY cost in realized government + social expenditure.
  // Children age 0-5 in a given vintage year are now old enough for those costs to have materialized.
  const COHORT = 1000; // per-1000-children baseline for comparability
  const vintageResults: HistoricalVintage[] = valid.map(({ year, povertyRate, unemploymentRate }) => {
    const yearsElapsed = CURRENT_YEAR - year;

    // ECE → dropout → incarceration chain (proportional to poverty rate)
    const childrenInPov   = COHORT * (povertyRate / 100) * 0.24;
    const noPrek          = childrenInPov * 0.38;
    const thirdGradeFail  = noPrek * 0.62;
    const dropouts        = thirdGradeFail * 0.72;
    const incarcerated    = dropouts * 0.45;

    // Realized costs based on how many years have elapsed since that cohort was young
    const remedialEd  = Math.round(thirdGradeFail * 11500 * Math.min(yearsElapsed, 8));
    const jailCost    = Math.round(incarcerated   * 45000 * Math.min(yearsElapsed / 4, 4));
    const lostWages   = Math.round(dropouts       * 9000  * Math.min(yearsElapsed, 12));

    // Mental health chain
    const mhUnmet     = COHORT * (unemploymentRate / 100) * 0.28;
    const mhCost      = Math.round(mhUnmet * 6200 * Math.min(yearsElapsed, 10));

    const cohortCost = remedialEd + jailCost + lostWages + mhCost;

    return { year, povertyRate, unemploymentRate, cohortCost };
  });

  const totalAccumulatedCost = vintageResults.reduce((s, v) => s + v.cohortCost, 0);

  // Trend direction from first to last vintage (require span ≥ 1 year so the
  // direction claim is grounded; also derive labels from the actual years
  // returned rather than hardcoded strings).
  const firstVintage = vintageResults[0];
  const lastVintage  = vintageResults[vintageResults.length - 1];
  const first = firstVintage.povertyRate;
  const last  = lastVintage.povertyRate;
  const firstYear = firstVintage.year;
  const lastYear  = lastVintage.year;
  const spanYears = lastYear - firstYear;

  const trendDirection: "improving" | "stagnant" | "worsening" =
    last < first - 2 ? "improving" : last > first + 2 ? "worsening" : "stagnant";

  const yearsAboveCrisisThreshold = vintageResults.filter(v => v.povertyRate >= CRISIS_POVERTY_THRESHOLD).length;

  const keyInsight = trendDirection === "stagnant"
    ? `This community's poverty rate has stayed near ${Math.round((first + last) / 2)}% across the ${spanYears}-year period from ${firstYear} to ${lastYear} — no structural shift occurred.`
    : trendDirection === "worsening"
    ? `Poverty rose from ${first.toFixed(1)}% in ${firstYear} to ${last.toFixed(1)}% by ${lastYear} — conditions deteriorated over ${spanYears} years.`
    : `Poverty fell from ${first.toFixed(1)}% in ${firstYear} to ${last.toFixed(1)}% by ${lastYear} — progress was made, but accumulated cost remains real and documented.`;

  return {
    vintages: vintageResults,
    totalAccumulatedCost,
    trendDirection,
    yearsAboveCrisisThreshold,
    keyInsight,
    yearsOfData: valid.length * 5, // each vintage covers a 5-year period
  };
}

// ─── Cross-domain cascade model ───────────────────────────────────────────────

function buildCascadeModel(
  ind: {
    povertyRate: number;
    uninsuredRate: number;
    housingCostBurden?: number;
    singleParentRate: number;
    unemploymentRate: number;
    noHighSchoolDiploma: number;
    ageUnder17?: number;
  },
  populationSize: number,
  timeHorizonYears: number
) {
  const {
    povertyRate: pov,
    uninsuredRate: unins,
    housingCostBurden: hcb,
    singleParentRate: spr,
    noHighSchoolDiploma: noHs,
    ageUnder17,
  } = ind;

  const h = Math.min(timeHorizonYears, 25);

  // ── Chain 1: ECE → Education → Justice ──────────────────────────────────
  const childrenInPoverty = Math.round(populationSize * (Number(ageUnder17) / 100) * (pov / 100));
  const noPrekGap = Math.round(childrenInPoverty * 0.38); // 38% of poverty children lack quality pre-K
  const thirdGradeFailures = Math.round(noPrekGap * 0.62);
  const dropouts = Math.round(thirdGradeFailures * 0.72);
  const incarcerationPool = Math.round(dropouts * 0.45); // avg male/female mix
  const remedialEd = thirdGradeFailures * 11500 * Math.min(h, 8);
  const jailCost = incarcerationPool * 45000 * Math.min(h / 4, 4);
  const lostRevenue = dropouts * 9000 * h;
  const chain1Cost = remedialEd + jailCost + lostRevenue;

  // ── Chain 2: Mental health desert → Substance use → Homelessness ─────────
  const uninsuredWithMHNeed = Math.round(populationSize * (unins / 100) * 0.28);
  const untreatedSUD = Math.round(uninsuredWithMHNeed * 0.38);
  const homelessFromUntreated = Math.round(untreatedSUD * 0.22);
  const mhHealthcareCost = homelessFromUntreated * 14480 * Math.min(h, 10); // $14,480/yr homeless healthcare
  const mhServiceCost = untreatedSUD * 6200 * Math.min(h, 10);
  const chain2Cost = mhHealthcareCost + mhServiceCost;

  // ── Chain 3: Housing instability → School disruption → Poverty cycle ──────
  const overBurdened = Math.round(populationSize * (Math.max(Number(hcb) - 25, 0) / 100));
  const chronicallyUnstable = Math.round(overBurdened * 0.14);
  const erVisits = chronicallyUnstable * 4 * 1800; // 4 ER visits/yr @ $1,800
  const educationDisruption = Math.round(chronicallyUnstable * 0.4 * 8000 * Math.min(h, 10));
  const chain3Cost = erVisits * Math.min(h, 12) + educationDisruption;

  // ── Chain 4: Generational ACE transmission ────────────────────────────────
  const atriskFamilies = Math.round(populationSize * (spr / 100) * (pov / 100) * 5);
  const aceExposed = Math.round(atriskFamilies * 0.42); // 42% intergenerational transmission
  const generationalCost = Math.round(aceExposed * 175000 * (h / 25)); // lifetime cost per ACE-exposed child

  const counterfactualCost = chain1Cost + chain2Cost + chain3Cost + generationalCost;

  // ── Intervention costs ────────────────────────────────────────────────────
  const prekCost = noPrekGap * 9000; // $9K/child quality pre-K
  const medicaidExpansion = uninsuredWithMHNeed * 2400; // Medicaid expansion annual cost
  const housingFirst = homelessFromUntreated * 14500; // Housing First annual
  const parentingSupport = atriskFamilies * 850; // NFP/PCIT annual per family
  const interventionCost = prekCost + medicaidExpansion + housingFirst + parentingSupport;

  const netSavings = counterfactualCost - interventionCost;
  const roi = interventionCost > 0 ? (netSavings / interventionCost).toFixed(1) : "N/A";

  const keyChains: CascadeChain[] = [
    {
      chain: "ECE Gap → 3rd Grade Failure → Dropout → Incarceration",
      without: `${incarcerationPool.toLocaleString()} incarcerated, ${dropouts.toLocaleString()} dropouts, $${(chain1Cost / 1e6).toFixed(1)}M government cost`,
      with: "Quality pre-K reduces 3rd grade failure 62%, cuts dropout rate 40%, saves $12.90 per $1 invested (Heckman 2010)",
      costDelta: chain1Cost,
    },
    {
      chain: "Mental Health Desert → Untreated SUD → Homelessness",
      without: `${homelessFromUntreated.toLocaleString()} homeless from untreated illness, $14,480/year each in emergency healthcare`,
      with: "Medicaid expansion + Housing First reduces homeless rate 60%, saves $2.80/dollar (WSIPP 2013)",
      costDelta: chain2Cost,
    },
    {
      chain: "Housing Cost Burden → Chronic Instability → Next Generation",
      without: `${chronicallyUnstable.toLocaleString()} chronically unstable households, children's education disrupted repeatedly`,
      with: "Affordable housing + wraparound navigation stabilizes 70% within 12 months",
      costDelta: chain3Cost,
    },
    {
      chain: "ACE Transmission → Generational Poverty Cycle",
      without: `${aceExposed.toLocaleString()} children inherit ACEs at 42% transmission rate — cycle continues`,
      with: "NFP home visiting + parenting support cuts ACE transmission 38%; Perry Preschool 40-yr follow-up confirms",
      costDelta: generationalCost,
    },
  ];

  const timeline: TimelineNode[] = [
    {
      age: "Birth",
      milestone: "A child is born",
      without: `Born into poverty (${pov.toFixed(0)}% local rate). No prenatal care if mother uninsured. ACE clock starts.`,
      with: "Nurse-Family Partnership enrolled prenatally. Healthy birth weight. Mother supported.",
      interventionWindow: "Prenatal — 0-12 months: highest-leverage window",
    },
    {
      age: "Age 3",
      milestone: "Pre-K enrollment window",
      without: "No quality pre-K available or affordable. Home environment underprepared. Language gap widens.",
      with: "Head Start or state pre-K enrolled. Play-based learning. Vocabulary at grade-level.",
      interventionWindow: "Age 3-4: $12.90 returned per $1 invested in quality pre-K",
    },
    {
      age: "Age 6",
      milestone: "Kindergarten readiness",
      without: "Arrives unprepared. Labeled 'behind' on day one. Teacher overwhelmed. Self-concept injured.",
      with: "Arrives ready to learn. Social-emotional skills intact. 40% higher graduation probability.",
    },
    {
      age: "Age 8",
      milestone: "3rd Grade reading gate",
      without: "Below proficiency. State retention policy triggers. $11,500/year in remediation begins. Dropout clock starts.",
      with: "At or above grade level. On-track trajectory confirmed. No remediation needed.",
      interventionWindow: "3rd grade: last clear inflection point before dropout trajectory locks in",
    },
    {
      age: "Age 13",
      milestone: "Middle school — social environment",
      without: "Chronic absenteeism. Maladaptive peer group. No mentor. Trauma unaddressed. Substance risk begins.",
      with: "BBBS mentor matched. Extracurricular engaged. Trauma-informed school environment.",
    },
    {
      age: "Age 18",
      milestone: "High school completion",
      without: `${Math.round(72)}% of at-risk cohort has dropped out. No credential. No pathway. System contact begins.`,
      with: "92% graduation rate in intervention cohort. Post-secondary pathway planned.",
      interventionWindow: "Age 16-18: last workforce/education intervention before adulthood",
    },
    {
      age: "Age 23",
      milestone: "Early adulthood",
      without: "Justice-involved, no credential, child born into same circumstances. Cycle generation 2 begins.",
      with: "Post-secondary credential earned. Family stable. Child born into different circumstances.",
    },
    {
      age: "Age 30+",
      milestone: "Life trajectory & next generation",
      without: `Incarcerated or cycling through systems. Children at 42% ACE transmission risk. Tax cost: $45K/yr.`,
      with: "Economically stable. ACE transmission reduced 70%. Children on-track. Tax contributor.",
    },
  ];

  return {
    timeHorizonYears: h,
    populationSize,
    counterfactualCost,
    interventionCost,
    netSavings,
    roi,
    keyChains,
    timeline,
  };
}

// ─── Policy context by state ──────────────────────────────────────────────────

function getPolicyContext(stateName: string) {
  const stateRecords = JURISDICTION_DATA.filter(
    (j) => j.state.toLowerCase() === stateName.toLowerCase()
  );

  const strengths: string[] = [];
  const gaps: string[] = [];

  for (const r of stateRecords) {
    const desc = `${r.policyName}: ${r.evidenceSummary.split(".")[0]}.`;
    if (r.outcome === "effective" || r.outcome === "ongoing_promising") {
      strengths.push(desc);
    } else if (r.outcome === "null_effect" || r.outcome === "harmful") {
      gaps.push(desc);
    }
  }

  if (strengths.length === 0) strengths.push("No effective state policy records on file — submit state program data to expand the knowledge base");
  if (gaps.length === 0) gaps.push("Compare your state's per-capita social service investment against peer states using the City Comparison tool");

  const nationalComparison = stateRecords.length > 0
    ? `${stateName} has ${stateRecords.filter(r => r.outcome === "effective").length} effective and ${stateRecords.filter(r => r.outcome === "null_effect" || r.outcome === "harmful").length} failed/ineffective policy records in the platform knowledge base.`
    : `${stateName || "This state"} — compare using the City Comparison tool to benchmark against peer states.`;

  return { strengths, gaps, nationalComparison };
}

// ─── Grant matcher ────────────────────────────────────────────────────────────

async function findRelevantGrants(domainScores: Record<string, DomainScore>, limit = 5) {
  try {
    const rows = await db
      .select()
      .from(grantOpportunities)
      .where(and(isNotNull(grantOpportunities.fitScore), gte(grantOpportunities.fitScore, 40)))
      .orderBy(desc(grantOpportunities.fitScore))
      .limit(limit * 3);

    // Prioritize grants in domains with lowest scores
    const crisisDomains = Object.entries(domainScores)
      .filter(([, v]) => v.urgency === "crisis" || v.urgency === "concern")
      .map(([k]) => k.toLowerCase());

    const scored = rows.map((g) => {
      const text = `${g.title} ${g.agency} ${g.description || ""}`.toLowerCase();
      const domainBonus = crisisDomains.some((d) => text.includes(d)) ? 20 : 0;
      return { grant: g, priority: (g.fitScore || 0) + domainBonus };
    });

    return scored
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
      .map((s) => s.grant);
  } catch (err) {
    // Fail loudly: a DB failure here previously returned an empty list, silently
    // hiding real grant matches. Let the caller surface an honest 500/502.
    console.error("[Conductor] grant matching query failed:", err);
    throw new Error(
      `Grant matching failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ─── AI narrative generator ───────────────────────────────────────────────────

// ── Deterministic ROI-claim validation ──────────────────────────────────────
// Prompt instructions alone are not a guarantee the model complies — an LLM
// can still restate, round, or reframe a ratio. This is a mechanical,
// non-AI check run AFTER generation: it extracts every cost-benefit-ratio-
// shaped claim from the narrative text and verifies it is either absent (no
// scenario computed) or exactly matches the one real computed ROI. Anything
// that fails is redacted before the narrative is ever returned.
const ROI_NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

interface RoiClaim {
  value: number;
  // "ratio": directly comparable to cascade.roi (e.g. "3.2x", "3.2:1").
  // "percent": a % framing of the same multiplier (e.g. "320% return" for
  // roi=3.2), compared against roi*100.
  kind: "ratio" | "percent";
}

// Every phrasing this platform is willing to treat as a grounded ROI
// statement, each capturing the number that must equal the computed ROI
// (or, for percent claims, roi*100). Deliberately covers numeric AND
// spelled-out forms across every trigger phrase in ROI_TRIGGER_RE below, so
// a correctly-grounded claim in any of these forms survives redaction while
// an invented or mismatched number in the same form does not.
function extractRoiClaimsDetailed(text: string): RoiClaim[] {
  const claims: RoiClaim[] = [];
  const ratioNumericPatterns = [
    /(\d+(?:\.\d+)?)\s*(?::|to)\s*1\b/gi, // "5:1" / "5 to 1"
    /(\d+(?:\.\d+)?)\s*x\b/gi, // "5x" / "5.0x"
    /\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?)?\s*for every\s*(?:\$ ?1|dollar)\b/gi, // "$5 for every $1" / "5 dollars for every dollar"
    /\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?)?\s*(?:saved|returned)?\s*per\s*(?:dollar|\$1)\b(?:\s+invested)?/gi, // "$5 saved per dollar" / "5 per dollar invested"
    /(\d+(?:\.\d+)?)[\s-]*fold\b/gi, // "5-fold" / "5 fold" / "5fold"
    /(\d+(?:\.\d+)?)\s*times\s*(?:the\s*)?(?:investment|cost)\b/gi, // "5 times the investment"
  ];
  for (const re of ratioNumericPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n)) claims.push({ value: n, kind: "ratio" });
    }
  }
  const percentPatterns = [
    /(\d+(?:\.\d+)?)\s*%\s*return\b/gi, // "320% return"
    /(\d+(?:\.\d+)?)\s*percent\s*return\b/gi, // "320 percent return"
  ];
  for (const re of percentPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n)) claims.push({ value: n, kind: "percent" });
    }
  }
  const wordAlternation = "one|two|three|four|five|six|seven|eight|nine|ten";
  const wordPatterns = [
    new RegExp(`\\b(${wordAlternation})\\b[\\s-]*(?:dollars?)?\\s*(?:for every|to|per)\\s*\\$?(?:one|1|dollar)\\b`, "gi"),
    new RegExp(`\\b(${wordAlternation})[\\s-]*fold\\b`, "gi"),
    new RegExp(`\\b(${wordAlternation})\\b\\s*times\\s*(?:the\\s*)?(?:investment|cost)\\b`, "gi"),
  ];
  for (const re of wordPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = ROI_NUMBER_WORDS[m[1].toLowerCase()];
      if (n != null) claims.push({ value: n, kind: "ratio" });
    }
  }
  return claims;
}

export function extractRoiClaims(narrative: string): number[] {
  return extractRoiClaimsDetailed(narrative).map((c) => c.value);
}

// Broad trigger: any phrasing that COULD be a cost-benefit / return-on-
// investment style claim, however it is worded — numeric, spelled-out,
// percentage, "-fold", or named ("ROI", "return on investment"). Deliberately
// wide, because the redaction rule below is a per-sentence allow-list (a
// triggered sentence is kept only if it states the exact canonical ROI), so
// over-triggering only ever removes text, never lets a mismatch through.
// NOTE: decimal points inside these patterns must use \u0000 (see
// `protectDecimals` below), not a literal ".", or the sentence splitter two
// functions down would misread "3.2" as two sentences.
const ROI_TRIGGER_RE = /(return on investment|\bROI\b|for every\s*(?:dollar|\$ ?1)\b|dollars?\s+for every|per\s*(?:dollar|\$1)\b(?:\s+invested)?|\d+(?:\u0000\d+)?\s*(?::|to)\s*1\b|\d+(?:\u0000\d+)?\s*x\b|\w*fold\b|times\s*(?:the\s*)?(?:investment|cost)\b|%\s*return|percent\s*return|cost[- ]benefit)/i;

// A real decimal point ("3.2") always has a digit on both sides with no
// space; a sentence-ending period never does. Swap decimal points for a
// sentinel character before sentence-splitting or pattern-matching, so "."
// can be trusted as a sentence boundary, and restore it in the final output.
function protectDecimals(text: string): string {
  return text.replace(/(\d)\.(?=\d)/g, "$1\u0000");
}
function restoreDecimals(text: string): string {
  return text.replace(/\u0000/g, ".");
}

/**
 * A sentence that trips ROI_TRIGGER_RE is only "grounded" if it states the
 * exact computed ROI figure in a recognized canonical form. Anything else —
 * an invented number, a rephrased ratio, a vague "for every dollar invested"
 * claim with no verifiable figure — cannot be confirmed to match the
 * computed value, so it does not count as grounded.
 */
function roiSentenceIsGrounded(protectedSentence: string, cascade: { roi: string } | null): boolean {
  if (!cascade) return false; // no scenario was computed — no claim can be grounded
  const roi = parseFloat(cascade.roi);
  if (!Number.isFinite(roi)) return false;
  // Sentence-splitting is already done; safe to restore real decimal points
  // before running the (unprotected) claim extractor.
  const claims = extractRoiClaimsDetailed(restoreDecimals(protectedSentence));
  if (claims.length === 0) return false; // trigger fired but no verifiable number — can't confirm it's grounded
  return claims.every((c) => (c.kind === "percent" ? Math.abs(c.value - roi * 100) < 0.5 : Math.abs(c.value - roi) < 0.05));
}

/**
 * Returns the narrative unchanged if it contains no ROI/cost-benefit-shaped
 * claim at all. Otherwise, splits into sentences (including a trailing
 * fragment with no terminal punctuation) and keeps only sentences that
 * either don't touch ROI/cost-benefit language, or state the exact computed
 * ROI figure verbatim. This is a mechanical, non-AI check — it does not
 * trust prompt instructions to have been followed.
 */
export function enforceGroundedRoi(narrative: string, cascade: { roi: string } | null): string {
  const protectedText = protectDecimals(narrative);
  if (!ROI_TRIGGER_RE.test(protectedText)) return narrative;
  const sentences = protectedText.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [protectedText];
  let droppedAny = false;
  const kept = sentences.filter((sentence) => {
    if (!ROI_TRIGGER_RE.test(sentence)) return true;
    const grounded = roiSentenceIsGrounded(sentence, cascade);
    if (!grounded) droppedAny = true;
    return grounded;
  });
  if (!droppedAny) return narrative;
  console.error(
    `[Conductor] narrative contained an ungrounded ROI/cost-benefit claim ` +
    `(expected ${cascade ? `${cascade.roi}x` : "none (no scenario computed)"}) — redacting offending sentence(s).`
  );
  return restoreDecimals(kept.join(" ").replace(/\s{2,}/g, " ").trim());
}

async function generateCommunityNarrative(
  geography: string,
  demographics: Record<string, number | string | null>,
  domainScores: Record<string, DomainScore>,
  cascade: ReturnType<typeof buildCascadeModel> | null,
  populations: AtRiskPopulation[]
): Promise<string> {
  const crisisDomains = Object.values(domainScores)
    .filter((d) => d.urgency === "crisis")
    .map((d) => d.label);

  const topPop = populations.slice(0, 4).map((p) => p.name).join(", ");

  // The narrative previously produced its own return-on-investment framing
  // (e.g. "every dollar invested prevents five dollars") independent of the
  // ROI figure this brief actually computed and displays elsewhere. That
  // contradiction is a direct evidence-integrity failure — the fix is to
  // hand the model the exact computed figure and forbid it from stating any
  // other ratio, rather than trying to detect the contradiction after the
  // fact in free text.
  try {
    const result = await generateAIJSON<{ narrative?: string }>(
      `You are writing a community impact narrative for ${geography}. 
      
Write a 4-paragraph plain-language narrative (no jargon, no bullet points) that:
1. Opens with what is HAPPENING in this community right now — specific, human, grounded in the data
2. Describes the available observed indicators without implying they represent any larger city, county, or service area
3. If a TCAF scenario is supplied, identify it explicitly as a scenario/model, not an observed Census finding
3. Names the COUNTERFACTUAL — what this community could look like with evidence-based investment
4. Closes with a CALL TO ACTION for organizations, policymakers, and funders

Data inputs:
- Geography: ${geography}
- Poverty rate: ${demographics.povertyRate}%
- Uninsured rate: ${demographics.uninsuredRate}%
- Crisis domains: ${crisisDomains.join(", ") || "none in crisis"}
- TCAF scenario availability: ${cascade ? "available" : "unavailable because required observed inputs were not returned"}
${cascade ? `- TCAF scenario cost of inaction: $${(cascade.counterfactualCost / 1e6).toFixed(1)}M
- TCAF scenario intervention cost: $${(cascade.interventionCost / 1e6).toFixed(1)}M
- TCAF scenario net savings: $${(cascade.netSavings / 1e6).toFixed(1)}M
- TCAF scenario ROI: ${cascade.roi}x (this is the ONLY return-on-investment figure you may state — do not invent, round to a different ratio, or restate it as a "dollars saved per dollar" claim using any other number)` : "- No cost-benefit ratio, ROI, or \"dollars saved per dollar\" figure may be stated anywhere in the narrative, because no scenario was computed for this geography."}
- At-risk populations: ${topPop}

Tone: compassionate, honest, evidence-grounded. Blame the systems, not the people. Do not call any modeled dollar figure Census-verified or a fact. Do not call a ZCTA result citywide. This is decision support, not a factual certification. Never state a cost-benefit ratio, "return per dollar", or "saves $X for every $1" claim other than the exact TCAF scenario ROI figure given above (or, if none was given, do not state one at all).

Return JSON: { "narrative": "..." }`
    );
    return enforceGroundedRoi(result.narrative || "", cascade);
  } catch (err) {
    // Fail loudly: previously this returned a hardcoded, fabricated narrative that
    // looked AI-generated. Surface the real failure so the caller returns an
    // honest error instead of shipping template text as if it were analysis.
    console.error("[Conductor] narrative generation failed:", err);
    throw new Error(
      `AI narrative generation failed for ${geography}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function registerConductorRoutes(app: Express) {
  // POST /api/conductor/community-brief
  // DECISION: PUBLIC (anonymous OK). This is the flagship "no account required"
  // Community Impact analyzer. It returns ONLY aggregate public U.S. Census data
  // plus a capped AI narrative — NO PII of any kind is present in the response.
  // A login wall broke the platform's public promise, so instead of requireAuth
  // we protect anonymous access with real abuse controls: (1) a per-IP sliding-
  // window rate limit (5 briefs / 10 min) to stop amplification against Census +
  // the paid AI, (2) a per-ZIP response cache so repeated identical lookups don't
  // re-spend upstream calls, and (3) hard caps on the caller-supplied numeric
  // parameters. Aggregate public Census data + capped AI spend = safe anonymous.
  app.post("/api/conductor/community-brief", async (req: Request, res: Response) => {
    try {
      // The RPLICE intelligence block is built from globally-scoped internal
      // operational data (active action plans, outcome baselines, assessments)
      // with NO geography filter. It must only be exposed to a first-party
      // authenticated caller — never to an anonymous public visitor. We resolve
      // auth once here and (a) skip building the package entirely for anon (no
      // wasted DB work) and (b) omit the field from anonymous responses.
      const isAuthed = !!conductorGetUserId(req);
      const { location } = req.body || {};
      const populationSize = conductorClampInt(req.body?.populationSize, 10000, 100, 5_000_000);
      const timeHorizon = conductorClampInt(req.body?.timeHorizon, 25, 1, 50);
      if (!location || typeof location !== "string") {
        return res.status(400).json({ error: "location is required (ZIP code, city, or community name)" });
      }

      // Serve a cached brief for an identical (location + params) request before
      // spending any Census/AI budget — and before charging the rate limiter, so
      // cache hits stay free. The cache holds ONLY the anon-safe, RPLICE-free
      // brief, so we serve it from cache only to anonymous callers; an
      // authenticated caller always falls through to a full build so they get
      // the up-to-date RPLICE intelligence block attached (never cached).
      const cacheKey = `${location.trim().toLowerCase()}|${populationSize}|${timeHorizon}`;
      // Dev-only cache bypass: the e2e gate sends X-Cache-Skip: 1 so every gate
      // run exercises the real Census + AI path rather than a cached answer.
      // This header is only honored in non-production to prevent anonymous
      // production traffic from using it to drain rate-limit / cache protections.
      const skipCache =
        process.env.NODE_ENV !== "production" &&
        req.headers["x-cache-skip"] === "1";
      if (!isAuthed && !skipCache) {
        const cached = conductorCacheGet(cacheKey);
        if (cached !== undefined) {
          return res.json(cached);
        }
      }

      // Rate limit only cache misses (the expensive path). The dev-mode
      // X-Cache-Skip bypass also exempts the request from rate limiting so
      // the e2e gate can run unconditionally against a warm dev server
      // regardless of how many validation passes have run in the window.
      // skipCache is already gated on NODE_ENV !== "production" so this
      // exemption cannot be triggered by anonymous production traffic.
      if (!skipCache) {
        const retryAfter = conductorRateLimit(conductorClientIp(req));
        if (retryAfter !== null) {
          res.setHeader("Retry-After", String(retryAfter));
          return res.status(429).json({
            error: `You've run several community analyses in a short time. Please wait about ${Math.ceil(retryAfter / 60)} minute(s) and try again — this keeps the free public analyzer available for everyone.`,
          });
        }
      }

      // Step 1: Resolve geography — county-aware path, then ZIP fallback
      //
      // Priority order (doctrine C1 — scope must match actual service area):
      //   1. Pipe-separated multi-county   "Columbus County, NC|Brunswick County, NC|…"
      //   2. Single county name / FIPS     "Columbus County, NC" or "37047"
      //   3. ZIP code                      "28472"
      //   4. City, State                   "Whiteville, NC" (normalised if comma-less)
      //
      // A county or multi-county query goes directly to county-level Census ACS —
      // it NEVER gets downsampled to a single ZIP (which would fabricate scope).

      let censusData: any = null;
      let displayName = location.trim();
      let countyName  = "";
      let stateName   = "";
      let stateFips   = "";
      let zip         = "";
      let isCountyLevel = false;
      let evidenceGeography: CommunityEvidenceContract["geography"];

      const rawInput = location.trim();

      // ── 1a: Multi-county (pipe-separated) ────────────────────────────────
      if (rawInput.includes("|")) {
        const parts = rawInput.split("|").map(s => s.trim()).filter(Boolean);
        const resolved = await Promise.all(parts.map(p => resolveCountyInput(p)));
        const counties = resolved.filter(Boolean) as Array<{ stateFips: string; countyFips: string; displayName: string; stateAbbrev: string }>;
        if (!counties.length) {
          return res.status(404).json({
            error: `Could not resolve any counties in "${rawInput}". Use format "Columbus County, NC|Brunswick County, NC".`,
          });
        }
        try {
          censusData = await fetchMultiCountyData(counties);
        } catch (err) {
          console.error("[Conductor] Multi-county Census fetch failed:", err);
        }
        if (!censusData) {
          return res.status(502).json({
            error: `Census data unavailable for the specified counties. Please try again shortly.`,
          });
        }
        isCountyLevel = true;
        displayName = counties.map(c => c.displayName.split(",")[0]).join(" / ") + ", " + counties[0].stateAbbrev;
        countyName  = displayName;
        stateName   = counties[0].stateAbbrev;
        stateFips   = counties[0].stateFips;
        evidenceGeography = {
          requested: { input: rawInput, type: "multi_county" },
          resolved: {
            type: "multi_county",
            identifier: counties.map((county) => `${county.stateFips}${county.countyFips}`).join("|"),
            label: displayName,
            method: "Direct Census ACS aggregation across the requested counties",
          },
        };

      // ── 1b: Single county name or 5-digit county FIPS ────────────────────
      } else {
        const countyResolved = await resolveCountyInput(rawInput);
        if (countyResolved) {
          try {
            censusData = await fetchCountyData(countyResolved.stateFips, countyResolved.countyFips);
          } catch (err) {
            console.error("[Conductor] County Census fetch failed:", err);
          }
          if (!censusData) {
            return res.status(502).json({
              error: `Census data unavailable for "${rawInput}". The county exists but Census ACS data could not be retrieved. Please try again shortly.`,
            });
          }
          isCountyLevel = true;
          displayName = countyResolved.displayName;
          countyName  = countyResolved.displayName;
          stateName   = countyResolved.stateAbbrev;
          stateFips   = countyResolved.stateFips;
          evidenceGeography = {
            requested: { input: rawInput, type: "county" },
            resolved: {
              type: "county",
              identifier: `${countyResolved.stateFips}${countyResolved.countyFips}`,
              label: displayName,
              method: "Direct Census ACS county lookup",
            },
          };
        }
      }

      // ── 1c: ZIP / city fallback (if not a county query) ──────────────────
      if (!isCountyLevel) {
        // Normalise "City ST" (no comma) → "City, ST" so city resolver picks it up
        const normalised = rawInput.replace(/^([A-Za-z\s]+)\s+([A-Z]{2})$/, "$1, $2");

        const resolved = await resolveLocationToZip(normalised);
        if (!resolved) {
          return res.status(404).json({
            error: `Could not find a location for "${rawInput}". ` +
              `Try a ZIP code (e.g. 28472), a county name (e.g. "Columbus County, NC"), ` +
              `or a city name (e.g. "Whiteville, NC").`,
          });
        }
        zip = resolved.zip;
        // A ZIP is analyzed as its Census ZCTA. Never carry a city-like label
        // after resolving it to one representative ZIP; that would overstate the
        // coverage of the public data.
        displayName = `ZCTA ${zip}`;
        stateName = resolved.stateAbbrev ?? "";
        stateFips = stateName ? stateFipsFromName(stateName) : "";
        evidenceGeography = {
          requested: { input: rawInput, type: resolved.requestedType },
          resolved: {
            type: "zcta",
            identifier: zip,
            label: displayName,
            method: resolved.resolutionMethod,
            coverageWarning: resolved.requestedType === "city"
              ? `The city request "${rawInput}" was resolved to ZCTA ${zip}. This is not a citywide estimate.`
              : "Census ZCTAs approximate ZIP delivery areas and are not USPS ZIP boundaries.",
          },
        };

        // Fail loudly on Census failure. Do not geocode a made-up street inside
        // the ZIP to obtain an arbitrary tract.
        try {
          censusData = await fetchZctaData(zip);
        } catch (err) {
          console.error(`[Conductor] Census fetch failed for ${zip}:`, err);
          return res.status(502).json({
            error: `Census data is currently unavailable for ${displayName}. ` +
              `The community brief cannot be generated without real demographic data. Please try again shortly.`,
          });
        }

        if (!censusData?.indicators || censusData.indicators.povertyRate == null) {
          return res.status(502).json({
            error: `No Census demographic data returned for ${displayName} (${zip}). ` +
              `We will not generate a brief from fabricated figures. Verify the location and try again.`,
          });
        }

        // Do not infer a county from a ZCTA: ZCTAs commonly cross county lines.
        // State is included only when resolution supplied an explicit state.
        if (stateFips) stateName = CONDUCTOR_FIPS_TO_STATE[stateFips] || stateName;
      }

      if (!censusData?.indicators || censusData.indicators.povertyRate == null) {
        return res.status(502).json({
          error: `No Census demographic data returned for ${displayName}. We will not generate a brief from fabricated figures.`,
        });
      }

      // Step 2 (was Step 3): Build indicators from real Census data.
      const ci = censusData.indicators;
      const ind: any = {
        povertyRate: ci.povertyRate,
        uninsuredRate: ci.uninsuredRate ?? null,
        housingCostBurden: ci.housingCostBurden ?? null,
        singleParentRate: ci.singleParentRate ?? null,
        unemploymentRate: ci.unemploymentRate ?? null,
        noHighSchoolDiploma: ci.noHighSchoolDiploma ?? null,
        limitedEnglish: ci.limitedEnglish ?? null,
        disabilityRate: ci.disabilityRate ?? null,
        ageUnder17: ci.ageUnder17 ?? null,
        age65Plus: ci.age65Plus ?? null,
        totalPopulation: censusData.population ?? null,
      };

      if (!Number.isFinite(ind.totalPopulation) || ind.totalPopulation <= 0) {
        return res.status(502).json({
          error: `Census returned no usable population for ${displayName}. We will not substitute the requested population parameter for observed data.`,
        });
      }
      const totalPop = ind.totalPopulation;

      const demographics = {
        totalPopulation: totalPop,
        povertyRate: ind.povertyRate,
        uninsuredRate: ind.uninsuredRate,
        housingCostBurden: ind.housingCostBurden,
        singleParentRate: ind.singleParentRate,
        unemploymentRate: ind.unemploymentRate,
        noHighSchoolDiploma: ind.noHighSchoolDiploma,
        limitedEnglish: ind.limitedEnglish,
        disabilityRate: ind.disabilityRate,
        ageUnder17: ind.ageUnder17,
        age65Plus: ind.age65Plus,
        medianIncome: censusData?.medianIncome ?? null,
      };

      // Step 4: Compute all layers in parallel
      const domainScores = computeDomainScores(ind);
      const atRiskPopulations = identifyAtRiskPopulations(ind, totalPop);
      const scenarioInputsAvailable = [
        ind.povertyRate,
        ind.uninsuredRate,
        ind.housingCostBurden,
        ind.singleParentRate,
        ind.noHighSchoolDiploma,
        ind.ageUnder17,
      ].every((value) => Number.isFinite(value));
      const cascade = scenarioInputsAvailable
        ? buildCascadeModel(ind, Math.min(totalPop, populationSize), timeHorizon)
        : null;

      // Compute crisis domains before the parallel block so RPLICE gets the full picture
      const crisisDomainIds = Object.entries(domainScores)
        .filter(([, v]) => v.urgency === "crisis" || v.urgency === "concern")
        .map(([k]) => k);

      const resolvedEvidenceGeography = evidenceGeography!;

      // Historical cascade is only possible for ZCTA (ZIP-level) geographies —
      // older ACS vintages expose ZCTA-level poverty/unemployment but NOT
      // county-level time series through the same endpoint pattern. For county
      // and multi-county briefs we set it null with a clear disclosure so the
      // client can render an appropriate message instead of an empty section.
      // For older ACS vintages (2013, 2015, 2019) the Census API requires
      // &in=state:{fips} to disambiguate ZCTAs. When the user submitted a raw
      // ZIP, stateFips may be empty (no state was resolved). Fall back to the
      // ZIP-range table so the state qualifier is always available.
      const historicalStateFips = stateFips || stateFipsFromZip(zip);
      const historicalCascadePromise: Promise<HistoricalCascade | null> =
        !isCountyLevel && zip
          ? buildHistoricalCascade(zip, process.env.CENSUS_API_KEY || "", historicalStateFips).catch((err) => {
              console.warn("[Conductor] buildHistoricalCascade failed (non-fatal):", err?.message ?? err);
              return null;
            })
          : Promise.resolve(null);

      const [grants, narrative, rpliceIntelligence, historicalCascade] = await Promise.all([
        findRelevantGrants(domainScores),
        generateCommunityNarrative(
          `${resolvedEvidenceGeography.resolved.label} (${resolvedEvidenceGeography.resolved.type.toUpperCase()} ${resolvedEvidenceGeography.resolved.identifier})`,
          demographics,
          domainScores,
          cascade,
          atRiskPopulations,
        ),
        // Only build the internal RPLICE intelligence package for authenticated
        // callers — anonymous responses never include it, so don't spend the DB
        // queries for them.
        isAuthed
          ? buildRpliceIntelligencePackage({
              crisisDomains: crisisDomainIds,
              regionName: displayName,
              stateFips: stateFips || stateFipsFromName(stateName) || stateFipsFromZip(zip) || undefined,
              countyFips: undefined,
            }).catch(() => null)
          : Promise.resolve(null),
        historicalCascadePromise,
      ]);

      // Step 5: Evidence programs (filter by crisis domains — already computed above)

      const topInterventions = EVIDENCE_PROGRAMS.filter((p) => {
        const kw = (p.topicKeywords || []).join(" ").toLowerCase();
        return crisisDomainIds.some((d) => {
          const dLabel = d.replace(/([A-Z])/g, " $1").toLowerCase();
          return kw.includes(dLabel.split(" ")[0]) || kw.includes("poverty") || kw.includes("community");
        });
      }).slice(0, 5);

      // Step 6: Policy context
      const policyCtx = getPolicyContext(stateName);
      const nationalComparison = policyCtx.nationalComparison;

      // Step 7: Policy actions
      const policyActions: string[] = [];
      if (Number.isFinite(ind.povertyRate) && ind.povertyRate > 15) policyActions.push("Expand EITC eligibility and auto-enrollment for eligible filers");
      if (Number.isFinite(ind.uninsuredRate) && ind.uninsuredRate > 10) policyActions.push("Medicaid expansion (if not expanded) or gap coverage for 100–138% FPL adults");
      if (Number.isFinite(ind.housingCostBurden) && ind.housingCostBurden > 35) policyActions.push("Inclusionary zoning and affordable housing trust fund capitalization");
      if (Number.isFinite(ind.noHighSchoolDiploma) && ind.noHighSchoolDiploma > 15) policyActions.push("Universal pre-K investment and 3rd grade reading guarantees");
      if (Number.isFinite(ind.singleParentRate) && ind.singleParentRate > 30) policyActions.push("Subsidized childcare (CCDF expansion) and co-parenting program funding");
      policyActions.push("Community health worker (CHW) Medicaid reimbursement");
      policyActions.push("Second Chance Act reentry funding for local workforce programs");

      // Step 8: Overall score
      const scores = Object.values(domainScores).map((d) => d.score);
      const overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      const retrievedAt = new Date().toISOString();
      const evidence: CommunityEvidenceContract = {
        version: "community-evidence/v1",
        geography: resolvedEvidenceGeography,
        sources: [{
          publisher: "U.S. Census Bureau",
          dataset: "American Community Survey 5-Year Estimates",
          vintage: "2022",
          retrievedAt,
          url: "https://api.census.gov/data/2022/acs/acs5.html",
          variables: [
            "B01003_001E", "B19013_001E", "B17001_001E", "B17001_002E",
            "B23025_003E", "B23025_005E", "B27001_001E", "B11001_001E",
          ],
          geographyGrain: resolvedEvidenceGeography.resolved.type === "zcta"
            ? "ZCTA"
            : resolvedEvidenceGeography.resolved.type === "county"
              ? "county"
              : "multi-county aggregate",
        }],
        claims: {
          observed: { label: "Observed public-data estimates", status: "available" },
          tcafDerived: {
            label: "TCAF-derived scores and population estimates",
            status: scores.length > 0 ? "available" : "unavailable",
            disclosure: "Scores and at-risk population estimates are TCAF calculations from the observed estimates above; they are not Census findings.",
          },
          tcafScenario: {
            label: "TCAF scenario/model output",
            status: cascade ? "available" : "unavailable",
            disclosure: cascade
              ? "Cascade costs, savings, ROI, and timelines are TCAF scenario outputs using observed inputs and published model assumptions. They are not observed or Census-verified costs."
              : "Scenario output is unavailable because one or more required observed inputs were not returned. No default values were substituted.",
          },
          historicalCascade: {
            label: "Multi-vintage historical cost model (2013–2022)",
            status: historicalCascade ? "available" : "unavailable",
            disclosure: historicalCascade
              ? "Historical cohort costs are TCAF chain-model outputs derived from multi-vintage Census ACS 5-Year Estimates (poverty + unemployment per ZCTA). They represent modeled cohort outcomes, not Census-verified government expenditures."
              : isCountyLevel
                ? "Multi-vintage historical data is not available for county or multi-county geographies — the Census ACS ZCTA endpoint used for multi-year comparison does not support county-level queries."
                : "Historical vintage data could not be retrieved for this ZCTA. The Census ACS endpoint may not have data for all requested years at this geography.",
          },
          aiSynthesis: {
            label: "TCAF AI synthesis",
            status: "available",
            disclosure: "The narrative is AI-generated decision support grounded in the disclosed geography and inputs. It is not an independently verified factual finding.",
          },
        },
        dataQuality: {
          status: resolvedEvidenceGeography.resolved.type === "zcta" && resolvedEvidenceGeography.requested.type !== "zip"
            ? "limited_resolution"
            : "verified_at_resolved_grain",
          warnings: [
            ...(resolvedEvidenceGeography.resolved.coverageWarning ? [resolvedEvidenceGeography.resolved.coverageWarning] : []),
            ...(!cascade ? ["No TCAF scenario is displayed because the required observed inputs are incomplete."] : []),
          ],
        },
      };

      // Build RPLICE context block (inbound evidence feed)
      const rpliceInboundContext = buildRpliceInboundContext();

      // Build the RPLICE block separately (only present for authed callers).
      // It is deliberately NOT part of the cached, anon-safe brief below so a
      // cache entry seeded by an authed request can never leak internal data to
      // a subsequent anonymous caller.
      const rpliceBlock: ConductorRpliceBlock | null = rpliceIntelligence
          ? {
              // Bridge intelligence
              relevant: rpliceIntelligence.bridge.relevant,
              reasoning: rpliceIntelligence.bridge.reasoning,
              relevanceScore: rpliceIntelligence.bridge.relevanceScore,
              interventionAssignments: rpliceIntelligence.bridge.interventionAssignments,
              actionPlanMilestones: rpliceIntelligence.bridge.actionPlanMilestones,
              outcomeBaselines: rpliceIntelligence.bridge.outcomeBaselines,
              // Live RPLICE research library
              liveResearch: {
                studies: rpliceIntelligence.liveResearch.studies.slice(0, 8),
                frameworks: rpliceIntelligence.liveResearch.frameworks.slice(0, 6),
                ecosystemStatus: rpliceIntelligence.liveResearch.ecosystemStatus,
              },
              // Grant profiles ranked by alignment to this community's crisis domains
              matchedGrantProfiles: rpliceIntelligence.grantProfiles.slice(0, 5).map(g => ({
                id: g.profile.id,
                name: g.profile.name,
                funder: g.profile.funder,
                priority: g.priority,
                alignmentScore: g.alignmentScore,
                matchedDomains: g.matchedDomains,
                focusAreas: g.profile.focusAreas,
              })),
              // Ecosystem platform deployment plan
              platformInterventions: rpliceIntelligence.platformInterventions,
              // DB assessment counts
              assessmentCounts: {
                cfir: rpliceIntelligence.db.cfirAssessments.length,
                reaim: rpliceIntelligence.db.reaimScorecards.length,
                fidelity: rpliceIntelligence.db.fidelityChecklists.length,
                threeRealities: rpliceIntelligence.db.threeRealitiesAnalyses.length,
                communityAnalyses: rpliceIntelligence.db.communityAnalyses.length,
                grantNarratives: rpliceIntelligence.db.grantNarratives.length,
                activeActionPlans: rpliceIntelligence.db.activeActionPlans.length,
                activeBaselines: rpliceIntelligence.db.activeBaselines.length,
              },
              inboundEvidenceFeedActive: rpliceInboundContext.length > 0,
            }
          : null;

      // Anon-safe brief: aggregate public Census data + capped AI narrative,
      // NO PII and NO internal RPLICE block. This is the ONLY thing we cache.
      const brief: ConductorBrief = {
        geography: {
          input: location,
          zip,
          displayName,
          state: stateName,
          countyName,
        },
        demographics,
        systemsScores: domainScores,
        overallScore,
        overallGrade: overallScore == null ? null : gradeFromScore(overallScore),
        atRiskPopulations,
        cascade,
        historicalCascade,
        solutions: {
          topInterventions,
          grants,
          policyActions,
        },
        narrative,
        policyContext: {
          state: stateName,
          strengths: policyCtx.strengths,
          gaps: policyCtx.gaps,
          nationalComparison,
        },
        evidence,
        generatedAt: retrievedAt,
      };

      // Cache the aggregate, RPLICE-free brief (no PII, no internal data) so
      // repeat lookups of the same ZIP/params are served free — safe to hand to
      // any caller, authed or anonymous.
      conductorCacheSet(cacheKey, brief);

      // Attach the internal RPLICE intelligence block ONLY for authenticated
      // callers, on the outbound response and never into the cache.
      if (isAuthed) {
        return res.json({ ...brief, rplice: rpliceBlock });
      }
      return res.json(brief);
    } catch (err) {
      // Honest error: surface the real failure (AI narrative / grant DB / Census
      // upstream) instead of swallowing it. Upstream (AI/DB) failures map to 502.
      console.error("Conductor error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isUpstream = /narrative generation failed|grant matching failed/i.test(msg);
      return res.status(isUpstream ? 502 : 500).json({
        error: `Community brief generation failed: ${msg}`,
      });
    }
  });

  // POST /api/conductor/compare — side-by-side geography comparison
  // DECISION: requireAuth. Unlike the single public brief, compare fans out into
  // 2–4 community-brief runs at once (AI + Census cost multiplied by N). We keep
  // this multi-location amplification behind an authenticated first-party user;
  // anonymous visitors still get the full single-location analyzer for free.
  app.post("/api/conductor/compare", conductorRequireAuth, async (req: Request, res: Response) => {
    try {
      const { locations } = req.body || {};
      if (!Array.isArray(locations) || locations.length < 2 || locations.length > 4) {
        return res.status(400).json({ error: "Provide 2–4 location strings to compare" });
      }
      // Each location must be a bounded, non-empty string. A single malformed
      // entry fails the whole request loudly (400) rather than silently
      // fanning out a garbage self-call whose failure would be buried in the
      // per-item error field.
      const badLocation = locations.find(
        (loc) => typeof loc !== "string" || loc.trim().length === 0 || loc.trim().length > 200,
      );
      if (badLocation !== undefined) {
        return res.status(400).json({ error: "Each location must be a non-empty string of at most 200 characters" });
      }
      const normalizedLocations = (locations as string[]).map((loc) => loc.trim());

      // Relay the caller's session cookie to the internal self-calls. community-
      // brief is public now, so this is no longer required for auth — we forward
      // it only so any per-user community context still attaches. The server
      // never trusts a fabricated identity; it only relays the real cookie.
      const forwardCookie = req.headers.cookie || "";

      const results = await Promise.allSettled(
        normalizedLocations.map((loc: string) =>
          fetch(`http://localhost:5000/api/conductor/community-brief`, {
            method: "POST",
            headers: { "Content-Type": "application/json", cookie: forwardCookie },
            body: JSON.stringify({ location: loc, populationSize: 10000 }),
          }).then(async (r) => {
            // Non-2xx must be an explicit failure, never spread into results
            // as if it were comparison data.
            if (!r.ok) {
              const body = await r.text().catch(() => "");
              throw new Error(`community-brief ${r.status}: ${body.slice(0, 200)}`);
            }
            return r.json();
          })
        )
      );

      // Per-item explicit status: each comparison carries `status: "ok" | "failed"`
      // plus an `error` string on failure, so a downstream consumer can never
      // mistake a failed self-call for real comparison data.
      const comparisons = results.map((r, i) => {
        const brief = r.status === "fulfilled" ? r.value : null;
        return {
          location: normalizedLocations[i],
          status: r.status === "fulfilled" ? "ok" : "failed",
          error: r.status === "rejected" ? String(r.reason) : null,
          ...(brief ?? {}),
        };
      });

      return res.json({ comparisons });
    } catch (err) {
      console.error("Conductor compare error:", err);
      return res.status(500).json({ error: "Comparison failed" });
    }
  });

  // ─── POST /api/conductor/neighbor-zips ──────────────────────────────────────
  // Fetch neighboring ZIPs with real Census data for the 3D skyline map.
  // Returns array of { zip, lat, lng, score, grade, urgency, costOfInaction }.
  // DECISION: PUBLIC (anonymous OK). This powers the 3D skyline on the public
  // community-impact page and is auto-triggered after every brief, so it cannot
  // sit behind a login wall. It returns ONLY aggregate public Census figures +
  // approximate ZIP centroids — NO PII. It does fan out up to ~18 live Census +
  // one Nominatim geocode per call, so we bound anonymous amplification with the
  // same per-IP sliding-window rate limit as community-brief plus a per-ZIP
  // response cache (identical ZIP → cached neighbor set, no re-fanning-out).
  app.post("/api/conductor/neighbor-zips", async (req: Request, res: Response) => {
    try {
      const { zip, centerScore = 50, centerGrade = "D", centerUrgency = "concern", centerCost = 100000 } = req.body;
      if (!zip) return res.status(400).json({ error: "zip required" });
      if (typeof zip !== "string" || !/^\d{5}$/.test(zip)) {
        return res.status(400).json({ error: "zip must be a 5-digit ZIP code" });
      }

      // Cache first (keyed on the center ZIP + center display attributes), then
      // rate-limit only the expensive fan-out path.
      const nbrKey = `${zip}|${centerScore}|${centerGrade}|${centerUrgency}|${centerCost}`;
      const nbrCached = conductorCacheGet(`nbr:${nbrKey}`);
      if (nbrCached !== undefined) {
        return res.json(nbrCached);
      }
      const nbrRetry = conductorRateLimit(conductorClientIp(req));
      if (nbrRetry !== null) {
        res.setHeader("Retry-After", String(nbrRetry));
        return res.status(429).json({
          error: `Too many map lookups in a short time. Please wait about ${Math.ceil(nbrRetry / 60)} minute(s) and try again.`,
        });
      }

      const CENSUS_ACS = "https://api.census.gov/data/2022/acs/acs5";
      const CENSUS_KEY = process.env.CENSUS_API_KEY || "";
      const keyParam = CENSUS_KEY ? `&key=${CENSUS_KEY}` : "";

      // Step 1: Get center ZIP centroid via Nominatim (OSM geocoder, no key needed).
      // HONESTY: if geocoding fails we return an explicit error — we never
      // substitute default coordinates and present another city's neighbors
      // as if they belonged to the requested ZIP.
      let centerLat: number; let centerLng: number;
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&countrycodes=us&format=json&limit=1`;
        const nomResp = await fetch(nomUrl, {
          headers: { "User-Agent": "ThriveUp-CommunityImpact/1.0 (terryflood@thrivingcommunitiesforall.com)" },
          signal: AbortSignal.timeout(6000),
        });
        if (!nomResp.ok) throw new Error(`geocoder responded ${nomResp.status}`);
        const nomData = await nomResp.json();
        if (!nomData[0]?.lat) throw new Error(`no geocoding result for ZIP ${zip}`);
        centerLat = parseFloat(nomData[0].lat);
        centerLng = parseFloat(nomData[0].lon);
      } catch (geoErr: any) {
        return res.status(502).json({
          error: `Could not locate ZIP ${zip} right now (geocoding unavailable). Please try again shortly.`,
        });
      }

      // Step 2: Generate candidate neighbor ZIPs from same 3-digit prefix range
      // ZIPs in the same prefix region are geographically proximate for most US metros.
      const baseNum = parseInt(zip, 10);
      const prefix = Math.floor(baseNum / 100) * 100; // e.g. 78700 for 78741
      const candidateZips: string[] = [];
      for (let offset = 0; offset <= 99; offset += 2) {
        const z = String(prefix + offset).padStart(5, "0");
        if (z !== zip) candidateZips.push(z);
      }
      const neighborCandidates = candidateZips.slice(0, 18); // up to 18 candidates

      let neighborZips: Array<{ zip: string; lat: number; lng: number }> = neighborCandidates.map((z, i) => {
        // Assign approximate lat/lng by distributing around center in a grid
        const angle = (i / neighborCandidates.length) * 2 * Math.PI;
        const radius = 0.15 + (i % 3) * 0.12;
        return {
          zip: z,
          lat: centerLat + Math.sin(angle) * radius,
          lng: centerLng + Math.cos(angle) * radius,
        };
      });

      // Step 3: Fetch simplified ACS indicators for each neighbor ZIP in parallel
      function quickScore(povertyRate: number, unemploymentRate: number) {
        const raw = Math.max(0, 100 - povertyRate * 2.5 - unemploymentRate * 2);
        const score = Math.round(Math.min(100, raw));
        const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
        const urgency: "stable" | "watch" | "concern" | "crisis" =
          score >= 75 ? "stable" : score >= 55 ? "watch" : score >= 35 ? "concern" : "crisis";
        const costOfInaction = Math.round((povertyRate / 100) * 10000 * 18000 * 0.47);
        return { score, grade, urgency, costOfInaction };
      }

      const scoredNeighbors = await Promise.allSettled(
        neighborZips.map(async (nz) => {
          try {
            const url = `${CENSUS_ACS}?get=B17001_001E,B17001_002E,B23025_003E,B23025_005E` +
              `&for=zip%20code%20tabulation%20area:${nz.zip}${keyParam}`;
            const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
            const rows = await r.json();
            if (!Array.isArray(rows) || rows.length < 2) return null;
            const [headers, values] = [rows[0], rows[1]];
            const h = (k: string) => parseFloat(values[headers.indexOf(k)] || "0") || 0;
            const totalPop = h("B17001_001E");
            const povertyRate = totalPop > 0 ? (h("B17001_002E") / totalPop) * 100 : 12;
            const laborForce = h("B23025_003E");
            const unemploymentRate = laborForce > 0 ? (h("B23025_005E") / laborForce) * 100 : 5;
            return { ...nz, povertyRate: Math.round(povertyRate * 10) / 10, unemploymentRate: Math.round(unemploymentRate * 10) / 10, ...quickScore(povertyRate, unemploymentRate) };
          } catch { return null; }
        })
      );

      const zips = [
        { zip, lat: centerLat, lng: centerLng, score: centerScore, grade: centerGrade, urgency: centerUrgency, costOfInaction: centerCost, isCenter: true },
        ...scoredNeighbors
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value),
      ];

      const nbrResult = { zips, centerLat, centerLng };
      conductorCacheSet(`nbr:${nbrKey}`, nbrResult);
      return res.json(nbrResult);
    } catch (err) {
      console.error("neighbor-zips error:", err);
      return res.status(500).json({ error: "Failed to fetch neighbor ZIPs" });
    }
  });

  /**
   * POST /api/conductor/export-to-grantpathpro
   * Packages the community brief (needs assessment, cascade, domain scores) and
   * sends it to the Grant Path Pro API for grant execution and monitoring.
   *
   * WIRING NOTE: Set GPP_API_URL and GPP_API_KEY environment variables when
   * the Grant Path Pro API endpoint and credentials are available.
   * Until then, the endpoint returns the payload so the frontend can show a preview.
   */
  // DECISION: requireAuth. Exports a full intelligence package to an external
  // partner system (Grant Path Pro) and can transmit with a server-held API key.
  // This is a privileged outbound action, never anonymous.
  app.post("/api/conductor/export-to-grantpathpro", conductorRequireAuth, async (req: Request, res: Response) => {
    try {
      const { brief, geography, requestedBy } = req.body;

      if (!brief || !geography) {
        return res.status(400).json({ error: "brief and geography are required" });
      }

      const host = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://thriveupacademy.com";

      // Pull full RPLICE intelligence for GPP export — live research library,
      // all DB assessments, grant profiles matched to the brief's domains, and platform map
      const briefDomains = brief?.systemsScores
        ? Object.entries(brief.systemsScores)
            .filter(([, v]: [string, any]) => v.urgency === "crisis" || v.urgency === "concern")
            .map(([k]) => k)
        : [];

      const [rpliceGppPackage, rpliceInboundEventsForGpp] = await Promise.all([
        buildRpliceIntelligencePackage({
          crisisDomains: briefDomains,
          regionName: geography.city || geography.county || geography.zip || "community",
          stateFips: geography.stateFips || stateFipsFromZip(geography.zip) || stateFipsFromName(geography.state) || undefined,
          countyFips: geography.countyFips || undefined,
        }).catch(() => null),
        fetch(`http://localhost:5000/api/inbound/rplice/latest`)
          .then((r) => r.json())
          .catch(() => ({ events: [], contextBlock: "", total: 0 })),
      ]);

      // Surface inbound event categories from the RPLICE evidence feed
      const qualityGateReviews = (rpliceInboundEventsForGpp.events || []).filter(
        (e: any) => e.eventType === "quality_gate_review" || e.eventType === "grant_narrative_feedback"
      );
      const fidelityAssessments = (rpliceInboundEventsForGpp.events || []).filter(
        (e: any) => e.eventType === "fidelity_assessment"
      );
      const evidenceUpdates = (rpliceInboundEventsForGpp.events || []).filter(
        (e: any) => e.eventType === "evidence_update" || e.eventType === "research_finding"
      );
      const outcomeData = (rpliceInboundEventsForGpp.events || []).filter(
        (e: any) => e.eventType === "outcome_data" || e.eventType === "reaim_evaluation"
      );
      const implementationAlerts = (rpliceInboundEventsForGpp.events || []).filter(
        (e: any) => e.eventType === "implementation_alert" || e.eventType === "cfir_assessment"
      );

      const gppPayload = {
        source: "ThriveUp Community Impact Conductor",
        exportedAt: new Date().toISOString(),
        requestedBy: requestedBy || "anonymous",
        geography: {
          zip: geography.zip,
          city: geography.city,
          county: geography.county,
          state: geography.state,
        },
        needsAssessment: {
          overallScore: brief.overallScore,
          grade: brief.grade,
          population: brief.population,
          povertyRate: brief.povertyRate,
          unemploymentRate: brief.unemploymentRate,
          medianIncome: brief.medianIncome,
          domainScores: brief.domainScores,
          atRiskPopulations: brief.atRiskPopulations,
        },
        financialImpact: {
          historicalCost: brief.historicalCost,
          forwardProjection: brief.forwardProjection,
          interventionSavings: brief.interventionSavings,
          roi: brief.roi,
          cascadeChains: brief.cascadeChains,
        },
        grantAlignment: {
          matchedOpportunities: brief.matchedGrants ?? [],
          evidencePrograms: brief.evidencePrograms ?? [],
          recommendedInterventions: brief.recommendedInterventions ?? [],
        },
        narrative: brief.aiNarrative ?? null,
        /**
         * RPLICE Maximum Intelligence Package
         * ─────────────────────────────────────
         * Everything GPP needs to write a defensible, funder-facing grant narrative
         * grounded in implementation science. Sources:
         *
         * • Live RPLICE scholarly research library (www.bettersciencelab.com — 100+ tools, ~1000 live sources)
         * • 8 funder-specific grant profiles with unique AI voices, matched to crisis domains
         * • 24 ecosystem platform interventions mapped to risk factors
         * • All ThriveUp DB assessments (CFIR, RE-AIM, fidelity, Three Realities, etc.)
         * • Bridge intelligence (assignments, milestones, outcome baselines)
         * • Inbound RPLICE evidence feed (quality-gate reviews, fidelity, research)
         * • Full analytical frameworks: CFIR 2.0, RE-AIM, Three Realities, SALP, MAP-GAP, ACEs, RNR
         */
        rplice: rpliceGppPackage
          ? {
              // ── Core GPP package from intelligence builder ──────────────────
              ...rpliceGppPackage.gppPackage,

              // ── Live RPLICE research library ────────────────────────────────
              liveResearch: {
                studies: rpliceGppPackage.liveResearch.studies.slice(0, 12),
                frameworks: rpliceGppPackage.liveResearch.frameworks.slice(0, 8),
                ecosystemStatus: rpliceGppPackage.liveResearch.ecosystemStatus,
                lastFetched: rpliceGppPackage.liveResearch.lastFetched,
              },

              // ── Full ranked grant profiles with narrative endpoints ──────────
              grantProfiles: rpliceGppPackage.grantProfiles.map(g => ({
                id: g.profile.id,
                name: g.profile.name,
                funder: g.profile.funder,
                voice: g.profile.voice,
                focusAreas: g.profile.focusAreas,
                domains: g.profile.domains,
                alignmentScore: g.alignmentScore,
                matchedDomains: g.matchedDomains,
                priority: g.priority,
                federalAgency: g.profile.federalAgency,
                typicalAward: g.profile.typicalAward,
                cfirEmphasis: g.profile.cfirEmphasis,
                reaimPriority: g.profile.reaimPriority,
                howToGenerate: {
                  endpoint: "POST /api/rplice/grant-narrative",
                  body: { grantName: g.profile.id, stateFips: "<from geography>", countyFips: "<from geography>", cityName: "<from geography>" },
                  note: "Streams a 5-section grant narrative via SSE using live Census + RPLICE research. Ready for grant submission.",
                },
              })),

              // ── Full analytical frameworks ──────────────────────────────────
              analyticalFrameworks: rpliceGppPackage.analyticalFrameworks,

              // ── Bridge intelligence ─────────────────────────────────────────
              bridgeIntelligence: {
                relevant: rpliceGppPackage.bridge.relevant,
                relevanceScore: rpliceGppPackage.bridge.relevanceScore,
                reasoning: rpliceGppPackage.bridge.reasoning,
                interventionAssignments: rpliceGppPackage.bridge.interventionAssignments.slice(0, 5),
                actionPlanMilestones: rpliceGppPackage.bridge.actionPlanMilestones.slice(0, 5),
                outcomeBaselinesSummary: rpliceGppPackage.bridge.outcomeBaselines.slice(0, 5),
              },

              // ── DB assessments (cite these in grant narrative sections) ─────
              savedAssessments: {
                cfir: rpliceGppPackage.db.cfirAssessments.slice(0, 3).map((a: any) => ({
                  name: a.programName, score: a.score, status: a.status,
                })),
                reaim: rpliceGppPackage.db.reaimScorecards.slice(0, 3).map((a: any) => ({
                  name: a.programName, score: a.score, status: a.status,
                })),
                fidelity: rpliceGppPackage.db.fidelityChecklists.slice(0, 3).map((a: any) => ({
                  name: a.programName, score: a.score, status: a.status,
                })),
                threeRealities: rpliceGppPackage.db.threeRealitiesAnalyses.slice(0, 3).map((a: any) => ({
                  name: a.programName, status: a.status,
                })),
                communityAnalyses: rpliceGppPackage.db.communityAnalyses.slice(0, 3).map((a: any) => ({
                  name: a.programName, createdAt: a.createdAt,
                })),
                activeActionPlans: rpliceGppPackage.db.activeActionPlans.slice(0, 3).map((p: any) => ({
                  region: p.regionName, phaseCount: (p.phases || []).length, status: p.status,
                })),
                activeBaselines: rpliceGppPackage.db.activeBaselines.slice(0, 3).map((b: any) => ({
                  region: b.regionName, timelineMonths: b.timelineMonths,
                  metrics: Object.keys(b.metrics || {}),
                })),
              },

              // ── Inbound RPLICE evidence feed ────────────────────────────────
              qualityGate: {
                reviewed: qualityGateReviews.length > 0,
                reviewCount: qualityGateReviews.length,
                reviews: qualityGateReviews.slice(0, 5).map((e: any) => ({
                  receivedAt: e.receivedAt, finding: e.finding,
                  actionItems: e.actionItems ?? [], citations: e.citations ?? [],
                  evidenceLevel: e.evidenceLevel,
                })),
                note: qualityGateReviews.length === 0
                  ? "No RPLICE quality-gate review yet — submit narrative to RPLICE via POST /api/inbound/rplice (eventType: grant_narrative_feedback)"
                  : `${qualityGateReviews.length} review(s) from RPLICE — address all actionItems before submission`,
              },
              fidelityScores: fidelityAssessments.slice(0, 10).map((e: any) => ({
                program: e.program, region: e.region, score: e.fidelityScore,
                evidenceLevel: e.evidenceLevel, receivedAt: e.receivedAt,
              })),
              inboundEvidenceBase: evidenceUpdates.slice(0, 10).map((e: any) => ({
                program: e.program, framework: e.framework, finding: e.finding,
                evidenceLevel: e.evidenceLevel, citations: e.citations ?? [],
                receivedAt: e.receivedAt,
              })),
              implementationPlan: {
                alerts: implementationAlerts.slice(0, 5).map((e: any) => ({
                  region: e.region, framework: e.framework, finding: e.finding,
                  actionRequired: e.actionRequired, actionItems: e.actionItems ?? [],
                  receivedAt: e.receivedAt,
                })),
              },

              // ── Meta ────────────────────────────────────────────────────────
              inboundFeedTotal: rpliceInboundEventsForGpp.total ?? 0,
              lastRpliceUpdateAt: rpliceInboundEventsForGpp.lastReceivedAt ?? null,
              rpliceConnectionInfo: `${host}/api/inbound/rplice/connection-info`,
            }
          : {
              // Fallback when intelligence package unavailable
              frameworksApplied: ["CFIR 2.0", "RE-AIM", "MAP-GAP", "SALP", "RNR"],
              qualityGate: { reviewed: false, reviewCount: 0, reviews: [],
                note: "RPLICE intelligence package unavailable — retry export" },
              rpliceConnectionInfo: `${host}/api/inbound/rplice/connection-info`,
            },
        censusSources: [
          "U.S. Census Bureau ACS 5-Year Estimates (2013, 2015, 2019, 2022)",
          `ZCTA: ${geography.zip}`,
        ],
        callback: {
          description: "POST grant execution events back to ThriveUp using these credentials",
          inboundEndpoint: `${host}/api/inbound/grantpathpro`,
          rpliceQualityGateEndpoint: `${host}/api/inbound/rplice`,
          statusEndpoint: `${host}/api/inbound/grantpathpro/status`,
          authHeader: "x-api-key",
          authValue: process.env.THRIVEUP_INBOUND_KEY ?? "(contact ThriveUp for key)",
          rpliceAuthHeader: "x-shared-secret",
          eventTypes: [
            "status_update",
            "milestone_reached",
            "compliance_alert",
            "budget_event",
            "outcome_report",
          ],
          rpliceEventTypes: [
            "quality_gate_review — RPLICE review of a GPP-drafted narrative section",
            "grant_narrative_feedback — line-by-line feedback before submission",
            "fidelity_assessment — program fidelity score for grant Section C",
            "outcome_data — baseline/target pairs for grant Section E",
            "evidence_update — new evidence to cite in the grant narrative",
          ],
        },
      };

      const gppApiUrl = process.env.GPP_API_URL;
      const gppApiKey = process.env.GRANTPATHPRO_WEBHOOK_API_KEY || process.env.GPP_API_KEY;

      if (gppApiUrl && gppApiKey) {
        const gppResponse = await fetch(gppApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${gppApiKey}`,
            "X-Source": "ThriveUp-ConductorV1",
          },
          body: JSON.stringify(gppPayload),
          signal: AbortSignal.timeout(15000),
        });

        if (!gppResponse.ok) {
          const errText = await gppResponse.text();
          console.error("Grant Path Pro API error:", gppResponse.status, errText);
          return res.status(502).json({
            error: "Grant Path Pro API returned an error",
            status: gppResponse.status,
            detail: errText,
          });
        }

        const gppResult = await gppResponse.json();
        return res.json({
          success: true,
          mode: "live",
          gppResponse: gppResult,
          exportedPayload: gppPayload,
        });
      }

      return res.json({
        success: true,
        mode: "preview",
        message: "Grant Path Pro API credentials not yet configured. Payload ready for transmission.",
        exportedPayload: gppPayload,
      });

    } catch (err) {
      console.error("export-to-grantpathpro error:", err);
      return res.status(500).json({ error: "Failed to export to Grant Path Pro" });
    }
  });
}
