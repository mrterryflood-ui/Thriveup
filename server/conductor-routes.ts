/**
 * Community Impact Conductor — the orchestration layer that connects all social
 * systems (health, mental health, benefits, housing, ECE, education, justice,
 * workforce, foster care, homeless) into a single community story, nationwide.
 *
 * POST /api/conductor/community-brief  — full analysis for any geography
 * POST /api/conductor/compare          — side-by-side multi-geography comparison
 */

import type { Express, Request, Response } from "express";
import { buildRpliceIntelligencePackage } from "./rplice-intelligence";
import { buildRpliceInboundContext } from "./rplice-inbound-routes";
import {
  resolveLocationToZip,
  zipToGeography,
  fetchZctaData,
  fetchNeighborhoodData,
} from "./neighborhood-routes";
import {
  EVIDENCE_PROGRAMS,
  JURISDICTION_DATA,
  type EvidenceProgram,
} from "./chainweb-coefficients";
import { generateAIJSON } from "./ai-provider";
import { db } from "./storage";
import { grantOpportunities } from "@shared/schema";
import { desc, gte, and, isNotNull } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DomainScore {
  score: number;
  grade: string;
  label: string;
  icon: string;
  keyGap: string;
  urgency: "stable" | "watch" | "concern" | "crisis";
}

interface AtRiskPopulation {
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

interface ConductorBrief {
  geography: {
    input: string;
    zip: string;
    displayName: string;
    state: string;
    countyName: string;
  };
  demographics: Record<string, number | string>;
  systemsScores: Record<string, DomainScore>;
  overallScore: number;
  overallGrade: string;
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
  };
  historicalCascade: HistoricalCascade;
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
  rplice: {
    relevant: boolean;
    reasoning: string;
    relevanceScore: number;
    activeAnalyses: unknown[];
    interventionAssignments: unknown[];
    actionPlanMilestones: unknown[];
    outcomeBaselines: unknown[];
    availableTools: string[];
    inboundEvidenceFeedActive: boolean;
  } | null;
  generatedAt: string;
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
    housingCostBurden: hcb = 30,
    singleParentRate: spr,
    unemploymentRate: unem,
    noHighSchoolDiploma: noHs,
    disabilityRate: dis = 10,
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
      score: clamp(100 - (hcb - 20) * 2.2 - pov * 0.6),
      label: "Housing Stability",
      icon: "Home",
      keyGap:
        hcb > 40
          ? `${hcb.toFixed(1)}% spend >30% income on housing — eviction risk high; homelessness pipeline active`
          : hcb > 30
            ? `${hcb.toFixed(1)}% cost-burdened; one crisis away from housing loss`
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
      score: clamp(100 - pov * 1.5 - dis * 1.2 - spr * 0.8),
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
    housingCostBurden: hcb = 30,
    singleParentRate: spr,
    unemploymentRate: unem,
    noHighSchoolDiploma: noHs,
    limitedEnglish: le = 5,
    disabilityRate: dis = 10,
    ageUnder17 = 24,
    age65Plus = 13,
  } = ind;

  const pop = totalPopulation;

  const populations: AtRiskPopulation[] = [
    {
      id: "children-poverty",
      name: "Children in Poverty",
      icon: "Baby",
      estimated: Math.round(pop * (ageUnder17 / 100) * (pov / 100)),
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
      estimated: Math.round(pop * ((Math.max(hcb, 20) - 20) / 100) * 0.6),
      unit: "households",
      primaryGap: "One crisis from eviction; no emergency housing safety net",
      urgency: hcb > 40 ? "critical" : hcb > 30 ? "high" : "moderate",
      interventions: ["Emergency rental assistance", "Housing counseling", "Section 8 waitlist navigation", "Housing First programs"],
    },
    {
      id: "foster-aging-out",
      name: "Youth Aging Out of Foster Care",
      icon: "Shield",
      estimated: Math.round(pop * 0.0015),
      unit: "youth/year",
      primaryGap: "Medicaid cliff at 18, no housing, no employment record, no support network",
      urgency: "critical",
      interventions: ["Medicaid bridge enrollment", "Transitional housing", "Employment mentorship", "Independent living programs"],
    },
    {
      id: "reentry",
      name: "Recently Released (Reentry)",
      icon: "Scale",
      estimated: Math.round(pop * 0.008),
      unit: "individuals",
      primaryGap: "No ID, no housing, no employer willing to hire; recidivism risk highest in first 90 days",
      urgency: "critical",
      interventions: ["ID restoration", "Reentry housing", "RNR-aligned employment", "Peer mentor networks"],
    },
    {
      id: "homeless",
      name: "Homeless / Unstably Housed",
      icon: "MapPin",
      estimated: Math.round(pop * 0.003 * (1 + pov / 50)),
      unit: "individuals",
      primaryGap: "Excluded from digital systems; no address = no benefits; highest ER cost users",
      urgency: "critical",
      interventions: ["Housing First", "Street outreach teams", "Benefits enrollment without address", "Peer navigators"],
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
      estimated: Math.round(pop * (le / 100)),
      unit: "individuals",
      primaryGap: "Language barrier blocks benefits enrollment, healthcare navigation, employment, and legal access",
      urgency: le > 15 ? "high" : "moderate",
      interventions: ["CHW/promotora outreach", "Multilingual benefits navigation", "ESL programs", "Interpreter services"],
    },
    {
      id: "disability",
      name: "People with Disabilities",
      icon: "Accessibility",
      estimated: Math.round(pop * (dis / 100)),
      unit: "individuals",
      primaryGap: "Benefits cliffs (earn too much → lose Medicaid), employment discrimination, inaccessible services",
      urgency: "high",
      interventions: ["SSI/SSDI counseling", "Ticket to Work navigation", "Accessible employment", "ADA accommodation support"],
    },
    {
      id: "elderly-isolated",
      name: "Elderly & Isolated (65+)",
      icon: "UserCheck",
      estimated: Math.round(pop * (age65Plus / 100) * 0.25),
      unit: "individuals",
      primaryGap: "Social isolation, technology barrier to benefits, caregiver absence, medication costs",
      urgency: "high",
      interventions: ["Meals on Wheels", "PACE program", "Benefits counseling", "Volunteer visitor programs"],
    },
  ];

  return populations.filter((p) => p.estimated > 0).sort((a, b) => {
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

  // Trend direction from first to last vintage
  const first = vintageResults[0]?.povertyRate ?? 0;
  const last  = vintageResults[vintageResults.length - 1]?.povertyRate ?? 0;
  const trendDirection: "improving" | "stagnant" | "worsening" =
    last < first - 2 ? "improving" : last > first + 2 ? "worsening" : "stagnant";

  const yearsAboveCrisisThreshold = vintageResults.filter(v => v.povertyRate >= CRISIS_POVERTY_THRESHOLD).length;

  const keyInsight = trendDirection === "stagnant"
    ? `This community's poverty rate has stayed near ${Math.round(first)}% for at least 12 years — no structural shift occurred.`
    : trendDirection === "worsening"
    ? `Poverty rose from ${first.toFixed(1)}% in ${vintageResults[0]?.year ?? 2010} to ${last.toFixed(1)}% by ${vintageResults[vintageResults.length - 1]?.year ?? 2022} — conditions deteriorated.`
    : `Poverty fell from ${first.toFixed(1)}% to ${last.toFixed(1)}% — progress was made, but accumulated cost remains real and documented.`;

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
    housingCostBurden: hcb = 30,
    singleParentRate: spr,
    noHighSchoolDiploma: noHs,
    ageUnder17 = 24,
  } = ind;

  const h = Math.min(timeHorizonYears, 25);

  // ── Chain 1: ECE → Education → Justice ──────────────────────────────────
  const childrenInPoverty = Math.round(populationSize * (ageUnder17 / 100) * (pov / 100));
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
  const overBurdened = Math.round(populationSize * (Math.max(hcb - 25, 0) / 100));
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
  } catch {
    return [];
  }
}

// ─── AI narrative generator ───────────────────────────────────────────────────

async function generateCommunityNarrative(
  geography: string,
  demographics: Record<string, number | string>,
  domainScores: Record<string, DomainScore>,
  cascade: ReturnType<typeof buildCascadeModel>,
  populations: AtRiskPopulation[]
): Promise<string> {
  const crisisDomains = Object.values(domainScores)
    .filter((d) => d.urgency === "crisis")
    .map((d) => d.label);

  const topPop = populations.slice(0, 4).map((p) => p.name).join(", ");

  try {
    const result = await generateAIJSON(
      `You are writing a community impact narrative for ${geography}. 
      
Write a 4-paragraph plain-language narrative (no jargon, no bullet points) that:
1. Opens with what is HAPPENING in this community right now — specific, human, grounded in the data
2. Describes the CASCADE — how these conditions compound over 25 years through the lives of children, families, and the next generation
3. Names the COUNTERFACTUAL — what this community could look like with evidence-based investment
4. Closes with a CALL TO ACTION for organizations, policymakers, and funders

Data inputs:
- Geography: ${geography}
- Poverty rate: ${demographics.povertyRate}%
- Uninsured rate: ${demographics.uninsuredRate}%
- Crisis domains: ${crisisDomains.join(", ") || "none in crisis"}
- 25-year cost of inaction: $${(cascade.counterfactualCost / 1e6).toFixed(1)}M
- Intervention cost: $${(cascade.interventionCost / 1e6).toFixed(1)}M
- Net savings: $${(cascade.netSavings / 1e6).toFixed(1)}M
- At-risk populations: ${topPop}

Tone: compassionate, honest, evidence-grounded. Blame the systems, not the people. Every dollar figure must feel real, not abstract. This is meant to move a funder to act.

Return JSON: { "narrative": "..." }`,
      { narrative: "" }
    );
    return result.narrative || "";
  } catch {
    return `In ${geography}, the data reveals interconnected systems under strain. A poverty rate of ${demographics.povertyRate}% and uninsured rate of ${demographics.uninsuredRate}% are not isolated statistics — they are the conditions that determine whether a child born here today will graduate high school, access mental health care, find stable housing, and participate in the workforce. The 25-year cost of inaction is estimated at $${(cascade.counterfactualCost / 1e6).toFixed(1)}M — far exceeding the $${(cascade.interventionCost / 1e6).toFixed(1)}M cost of evidence-based intervention. This community deserves investment, not blame. Organizations, policymakers, and funders have a clear, affordable path forward.`;
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function registerConductorRoutes(app: Express) {
  // POST /api/conductor/community-brief
  app.post("/api/conductor/community-brief", async (req: Request, res: Response) => {
    try {
      const { location, populationSize = 10000, timeHorizon = 25 } = req.body || {};
      if (!location || typeof location !== "string") {
        return res.status(400).json({ error: "location is required (ZIP code, city, or community name)" });
      }

      // Step 1: Resolve geography
      const resolved = await resolveLocationToZip(location.trim());
      if (!resolved) {
        return res.status(404).json({
          error: `Could not find a location for "${location}". Try a ZIP code (e.g. 78741) or city name (e.g. "Austin, TX").`,
        });
      }

      const { zip, displayName } = resolved;

      // Step 2: Fetch Census data
      let censusData: any = null;
      let stateName = "";
      let countyName = "";
      let stateFips = "";

      try {
        const geo = await zipToGeography(zip);
        if (geo && !geo.isZcta && geo.stateFips && geo.countyFips && geo.tractFips) {
          stateFips = geo.stateFips || "";
          censusData = await fetchNeighborhoodData(geo.stateFips, geo.countyFips, geo.tractFips);
          countyName = geo.countyName || "";
        }
        if (!censusData) {
          censusData = await fetchZctaData(zip);
        }
      } catch {
        censusData = null;
      }

      // Step 3: Build indicators (with safe defaults)
      const ind = {
        povertyRate: censusData?.indicators?.povertyRate ?? 14.5,
        uninsuredRate: censusData?.indicators?.uninsuredRate ?? 10.2,
        housingCostBurden: censusData?.indicators?.housingCostBurden ?? 30,
        singleParentRate: censusData?.indicators?.singleParentRate ?? 22,
        unemploymentRate: censusData?.indicators?.unemploymentRate ?? 5.8,
        noHighSchoolDiploma: censusData?.indicators?.noHighSchoolDiploma ?? 12,
        limitedEnglish: censusData?.indicators?.limitedEnglish ?? 5,
        disabilityRate: censusData?.indicators?.disabilityRate ?? 10,
        ageUnder17: censusData?.indicators?.ageUnder17 ?? 24,
        age65Plus: censusData?.indicators?.age65Plus ?? 13,
        totalPopulation: censusData?.indicators?.totalPopulation ?? populationSize,
      };

      const totalPop = Math.max(ind.totalPopulation, populationSize);

      // Try to extract state from displayName
      const stateMatch = displayName.match(/,\s*([A-Z]{2})\s*\d{5}$/) ||
        displayName.match(/,\s*([A-Za-z ]+)$/);
      stateName = stateMatch?.[1]?.trim() || "";
      if (!countyName) countyName = censusData?.countyName || displayName;

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
        medianIncome: censusData?.indicators?.medianIncome ?? 55000,
      };

      // Step 4: Compute all layers in parallel
      const domainScores = computeDomainScores(ind);
      const atRiskPopulations = identifyAtRiskPopulations(ind, totalPop);
      const cascade = buildCascadeModel(ind, Math.min(totalPop, populationSize), timeHorizon);
      const BRIEF_CENSUS_KEY = process.env.CENSUS_API_KEY || "";

      // Compute crisis domains before the parallel block so RPLICE gets the full picture
      const crisisDomainIds = Object.entries(domainScores)
        .filter(([, v]) => v.urgency === "crisis" || v.urgency === "concern")
        .map(([k]) => k);

      const [grants, narrative, historicalCascade, rpliceIntelligence] = await Promise.all([
        findRelevantGrants(domainScores),
        generateCommunityNarrative(displayName, demographics, domainScores, cascade, atRiskPopulations),
        buildHistoricalCascade(zip, BRIEF_CENSUS_KEY, stateFips || stateFipsFromName(stateName) || stateFipsFromZip(zip)).catch(() => ({
          vintages: [], totalAccumulatedCost: 0, trendDirection: "stagnant" as const,
          yearsAboveCrisisThreshold: 0, keyInsight: "", yearsOfData: 0,
        })),
        buildRpliceIntelligencePackage({
          crisisDomains: crisisDomainIds,
          regionName: displayName,
          stateFips: stateFips || stateFipsFromName(stateName) || stateFipsFromZip(zip) || undefined,
          countyFips: undefined,
        }).catch(() => null),
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
      if (ind.povertyRate > 15) policyActions.push("Expand EITC eligibility and auto-enrollment for eligible filers");
      if (ind.uninsuredRate > 10) policyActions.push("Medicaid expansion (if not expanded) or gap coverage for 100–138% FPL adults");
      if (ind.housingCostBurden > 35) policyActions.push("Inclusionary zoning and affordable housing trust fund capitalization");
      if (ind.noHighSchoolDiploma > 15) policyActions.push("Universal pre-K investment and 3rd grade reading guarantees");
      if (ind.singleParentRate > 30) policyActions.push("Subsidized childcare (CCDF expansion) and co-parenting program funding");
      policyActions.push("Community health worker (CHW) Medicaid reimbursement");
      policyActions.push("Second Chance Act reentry funding for local workforce programs");

      // Step 8: Overall score
      const scores = Object.values(domainScores).map((d) => d.score);
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      // Build RPLICE context block (inbound evidence feed)
      const rpliceInboundContext = buildRpliceInboundContext();

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
        overallGrade: gradeFromScore(overallScore),
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
        rplice: rpliceIntelligence
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
          : null,
        generatedAt: new Date().toISOString(),
      };

      return res.json(brief);
    } catch (err) {
      console.error("Conductor error:", err);
      return res.status(500).json({ error: "Community brief generation failed. Please try again." });
    }
  });

  // POST /api/conductor/compare — side-by-side geography comparison
  app.post("/api/conductor/compare", async (req: Request, res: Response) => {
    try {
      const { locations } = req.body || {};
      if (!Array.isArray(locations) || locations.length < 2 || locations.length > 4) {
        return res.status(400).json({ error: "Provide 2–4 location strings to compare" });
      }

      const results = await Promise.allSettled(
        locations.map((loc: string) =>
          fetch(`http://localhost:5000/api/conductor/community-brief`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: loc, populationSize: 10000 }),
          }).then((r) => r.json())
        )
      );

      const comparisons = results.map((r, i) => {
        const brief = r.status === "fulfilled" ? r.value : null;
        return {
          location: locations[i],
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
  app.post("/api/conductor/neighbor-zips", async (req: Request, res: Response) => {
    try {
      const { zip, centerScore = 50, centerGrade = "D", centerUrgency = "concern", centerCost = 100000 } = req.body;
      if (!zip) return res.status(400).json({ error: "zip required" });

      const CENSUS_ACS = "https://api.census.gov/data/2022/acs/acs5";
      const CENSUS_KEY = process.env.CENSUS_API_KEY || "";
      const keyParam = CENSUS_KEY ? `&key=${CENSUS_KEY}` : "";

      // Step 1: Get center ZIP centroid via Nominatim (OSM geocoder, no key needed)
      let centerLat = 30.25, centerLng = -97.75;
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&countrycodes=us&format=json&limit=1`;
        const nomResp = await fetch(nomUrl, {
          headers: { "User-Agent": "ThriveUp-CommunityImpact/1.0 (terryflood@thrivingcommunitiesforall.com)" },
          signal: AbortSignal.timeout(6000),
        });
        const nomData = await nomResp.json();
        if (nomData[0]?.lat) {
          centerLat = parseFloat(nomData[0].lat);
          centerLng = parseFloat(nomData[0].lon);
        }
      } catch { /* use defaults */ }

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

      return res.json({ zips, centerLat, centerLng });
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
  app.post("/api/conductor/export-to-grantpathpro", async (req: Request, res: Response) => {
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
