/**
 * Community Impact Conductor — the orchestration layer that connects all social
 * systems (health, mental health, benefits, housing, ECE, education, justice,
 * workforce, foster care, homeless) into a single community story, nationwide.
 *
 * POST /api/conductor/community-brief  — full analysis for any geography
 * POST /api/conductor/compare          — side-by-side multi-geography comparison
 */

import type { Express, Request, Response } from "express";
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

      try {
        const geo = await zipToGeography(zip);
        if (geo && !geo.isZcta && geo.stateFips && geo.countyFips && geo.tractFips) {
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

      const [grants, narrative] = await Promise.all([
        findRelevantGrants(domainScores),
        generateCommunityNarrative(displayName, demographics, domainScores, cascade, atRiskPopulations),
      ]);

      // Step 5: Evidence programs (filter by crisis domains)
      const crisisDomainIds = Object.entries(domainScores)
        .filter(([, v]) => v.urgency === "crisis" || v.urgency === "concern")
        .map(([k]) => k);

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

      const comparisons = results.map((r, i) => ({
        location: locations[i],
        data: r.status === "fulfilled" ? r.value : null,
        error: r.status === "rejected" ? String(r.reason) : null,
      }));

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
}
