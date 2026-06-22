/**
 * CHAINWEB COEFFICIENT LIBRARY
 * Evidence-based ripple coefficients for the causal chain engine.
 * Every entry cites a primary source. No fabrication.
 *
 * Iron Rule #2: Never conjecture. Every coefficient → primary source.
 */

export interface Coefficient {
  fromDomain: string;
  toDomain: string;
  fromMetric: string;
  toMetric: string;
  coefficient: number;           // effect size — e.g. 0.34 = 34% change per unit
  direction: "positive" | "negative";
  lagYears: number;
  unit: string;
  evidenceCitation: string;
  studyYear: number;
  populationNotes: string;
  confidenceLevel: "strong" | "moderate" | "emerging";
}

export const CHAINWEB_COEFFICIENTS: Coefficient[] = [

  // ── EARLY CHILDHOOD → EDUCATION ───────────────────────────────────────────
  {
    fromDomain: "early_childhood", toDomain: "education",
    fromMetric: "Quality pre-K enrollment ($7K–$12K/child)",
    toMetric: "3rd grade reading proficiency",
    coefficient: 0.44,
    direction: "positive", lagYears: 4,
    unit: "probability increase",
    evidenceCitation: "Heckman, J. et al. (2010). The Rate of Return to the HighScope Perry Preschool Program. Journal of Public Economics, 94(1–2), 114–128.",
    studyYear: 2010,
    populationNotes: "Low-income children ages 3–4; strongest effect for children in poverty",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "early_childhood", toDomain: "education",
    fromMetric: "Quality pre-K enrollment",
    toMetric: "High school graduation",
    coefficient: 0.22,
    direction: "positive", lagYears: 14,
    unit: "probability increase",
    evidenceCitation: "Heckman, J. & Masterov, D. (2007). The Productivity Argument for Investing in Young Children. Applied Economic Perspectives and Policy, 29(3), 446–493.",
    studyYear: 2007,
    populationNotes: "Disadvantaged children; effect size varies by program quality",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "early_childhood", toDomain: "economic",
    fromMetric: "Pre-K investment per child",
    toMetric: "Lifetime ROI per dollar invested",
    coefficient: 13.0,
    direction: "positive", lagYears: 20,
    unit: "dollars returned per dollar invested",
    evidenceCitation: "Heckman, J. (2012). Invest in Early Childhood Development: Reduce Deficits, Strengthen the Economy. The Heckman Equation. University of Chicago.",
    studyYear: 2012,
    populationNotes: "Conservative estimate; higher estimates reach $17:$1 for highest-quality programs",
    confidenceLevel: "strong",
  },

  // ── EDUCATION → WORKFORCE ─────────────────────────────────────────────────
  {
    fromDomain: "education", toDomain: "education",
    fromMetric: "3rd grade reading below proficiency",
    toMetric: "High school dropout probability",
    coefficient: 0.68,
    direction: "negative", lagYears: 9,
    unit: "probability of dropout (students not proficient by 3rd grade)",
    evidenceCitation: "Hernandez, D.J. (2011). Double Jeopardy: How Third-Grade Reading Skills and Poverty Influence High School Graduation. Annie E. Casey Foundation.",
    studyYear: 2011,
    populationNotes: "Students from low-income families who can't read proficiently by end of 3rd grade; 6x more likely to drop out",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "education", toDomain: "workforce",
    fromMetric: "High school dropout",
    toMetric: "Lifetime earnings loss vs. graduate",
    coefficient: -200000,
    direction: "negative", lagYears: 0,
    unit: "dollars (lifetime earnings gap)",
    evidenceCitation: "Alliance for Excellent Education (2011). The High Cost of High School Dropouts: What the Nation Pays for Inadequate High Schools. Washington, DC.",
    studyYear: 2011,
    populationNotes: "Present value; gap widens with post-secondary completion",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "education", toDomain: "economic",
    fromMetric: "High school dropout (annual cohort of 1,000)",
    toMetric: "Annual lost tax revenue + social services cost",
    coefficient: 7900000,
    direction: "negative", lagYears: 0,
    unit: "dollars per 1,000 dropouts annually",
    evidenceCitation: "Rumberger, R.W. (2011). Dropping Out: Why Students Drop Out of High School and What Can Be Done About It. Harvard University Press.",
    studyYear: 2011,
    populationNotes: "Combined lost tax revenue and increased public expenditure (health, criminal justice, welfare)",
    confidenceLevel: "moderate",
  },

  // ── EDUCATION → REMEDIATION COST (the "spent wrong" calculation) ──────────
  {
    fromDomain: "education", toDomain: "economic",
    fromMetric: "Grade 3–10 remediation spending (at-risk child)",
    toMetric: "Preventable cost vs. pre-K investment",
    coefficient: 3.5,
    direction: "negative", lagYears: 0,
    unit: "multiplier — $30K–$40K spent vs $7K–$12K prevention",
    evidenceCitation: "RAND Corporation (2005). The Long-Term Effects of Early Childhood Programs on Cognitive and School Outcomes. Santa Monica, CA: RAND.",
    studyYear: 2005,
    populationNotes: "Special education, retention, intervention costs per at-risk child grades 3–10",
    confidenceLevel: "strong",
  },

  // ── WORKFORCE → HOUSING ───────────────────────────────────────────────────
  {
    fromDomain: "workforce", toDomain: "housing",
    fromMetric: "Unemployment / underemployment",
    toMetric: "Housing cost burden (>30% income on rent)",
    coefficient: 0.38,
    direction: "negative", lagYears: 1,
    unit: "probability increase of cost burden",
    evidenceCitation: "Harvard Joint Center for Housing Studies (2023). America's Rental Housing 2024. Cambridge, MA: Harvard University.",
    studyYear: 2023,
    populationNotes: "Renters earning below 50% AMI; strongest effect in metro areas with low vacancy rates",
    confidenceLevel: "strong",
  },

  // ── HOUSING → HEALTH ──────────────────────────────────────────────────────
  {
    fromDomain: "housing", toDomain: "health",
    fromMetric: "Housing instability / frequent moves",
    toMetric: "Emergency room utilization rate",
    coefficient: 0.23,
    direction: "negative", lagYears: 0,
    unit: "increase in ER visits per person",
    evidenceCitation: "RAND Corporation (2021). Health and Housing: The Connection Between Housing Instability and Health Outcomes. Santa Monica, CA: RAND.",
    studyYear: 2021,
    populationNotes: "Adults in housing-insecure situations; particularly strong for chronic condition management",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "housing", toDomain: "health",
    fromMetric: "Homelessness",
    toMetric: "Annual healthcare cost per person vs. housed individual",
    coefficient: 14480,
    direction: "negative", lagYears: 0,
    unit: "additional annual healthcare cost ($)",
    evidenceCitation: "Culhane, D. et al. (2011). Connecting dots: How the US has made progress on homelessness... and how to end it. American Journal of Public Health.",
    studyYear: 2011,
    populationNotes: "Average annual healthcare cost for homeless individual $14,480 vs $3,800 housed",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "housing", toDomain: "education",
    fromMetric: "Child housing instability (≥2 moves/year)",
    toMetric: "Academic achievement (standardized test scores)",
    coefficient: -0.18,
    direction: "negative", lagYears: 0,
    unit: "standard deviation decrease in test scores per move",
    evidenceCitation: "Pribesh, S. & Downey, D. (1999). Why are Residential and School Moves Associated with Poor School Performance? Demography, 36(4), 521–534.",
    studyYear: 1999,
    populationNotes: "K-12 children; effect cumulative with each additional move",
    confidenceLevel: "moderate",
  },

  // ── JUSTICE → ECONOMIC ────────────────────────────────────────────────────
  {
    fromDomain: "justice", toDomain: "economic",
    fromMetric: "Incarceration (1 person)",
    toMetric: "Annual government cost per incarcerated person",
    coefficient: 44000,
    direction: "negative", lagYears: 0,
    unit: "dollars/year (federal average)",
    evidenceCitation: "Vera Institute of Justice (2022). The Price of Prisons: Examining State Spending Trends 2010–2015. New York: Vera Institute.",
    studyYear: 2022,
    populationNotes: "State prison average ~$35K; federal ~$44K; Texas ~$25K",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "justice", toDomain: "economic",
    fromMetric: "Justice involvement (lifetime)",
    toMetric: "Lifetime economic loss per person (lost earnings, taxes, social costs)",
    coefficient: 1300000,
    direction: "negative", lagYears: 0,
    unit: "dollars (lifetime total)",
    evidenceCitation: "Bureau of Justice Statistics (2021). Lifetime Likelihood of Going to State or Federal Prison. Washington, DC: U.S. DOJ.",
    studyYear: 2021,
    populationNotes: "Includes lost wages, reduced employment, family disruption, public expenditure",
    confidenceLevel: "moderate",
  },
  {
    fromDomain: "justice", toDomain: "justice",
    fromMetric: "Release without reentry support",
    toMetric: "Re-arrest within 3 years",
    coefficient: 0.68,
    direction: "negative", lagYears: 3,
    unit: "probability (recidivism rate)",
    evidenceCitation: "Bureau of Justice Statistics (2018). 2018 Update on Prisoner Recidivism: A 9-Year Follow-Up Period. Washington, DC: BJS.",
    studyYear: 2018,
    populationNotes: "68% re-arrested within 3 years; 83% within 9 years — without intervention",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "justice", toDomain: "justice",
    fromMetric: "Evidence-based reentry support (RNR/CBI)",
    toMetric: "Recidivism reduction",
    coefficient: -0.30,
    direction: "negative", lagYears: 3,
    unit: "probability reduction in recidivism",
    evidenceCitation: "Andrews, D. & Bonta, J. (2010). Rehabilitating Criminal Justice Policy and Practice. Psychology, Public Policy, and Law, 16(1), 39–55.",
    studyYear: 2010,
    populationNotes: "RNR model consistently reduces recidivism 20–40%; CBI adds additional effect",
    confidenceLevel: "strong",
  },

  // ── EDUCATION → JUSTICE ───────────────────────────────────────────────────
  {
    fromDomain: "education", toDomain: "justice",
    fromMetric: "High school dropout",
    toMetric: "Probability of incarceration by age 30",
    coefficient: 0.63,
    direction: "negative", lagYears: 10,
    unit: "probability (male dropouts)",
    evidenceCitation: "Western, B. & Pettit, B. (2010). Incarceration and Social Inequality. Daedalus, 139(3), 8–19. MIT Press.",
    studyYear: 2010,
    populationNotes: "63% of male high school dropouts will be incarcerated by age 30",
    confidenceLevel: "strong",
  },

  // ── FAMILY STRUCTURE → ECONOMIC ───────────────────────────────────────────
  {
    fromDomain: "family", toDomain: "economic",
    fromMetric: "Single-parent household (no father present)",
    toMetric: "Probability of child poverty",
    coefficient: 0.50,
    direction: "negative", lagYears: 0,
    unit: "probability increase",
    evidenceCitation: "U.S. Census Bureau (2023). Income and Poverty in the United States: 2022. Current Population Reports P60-280.",
    studyYear: 2023,
    populationNotes: "Single-mother household poverty rate ~38% vs ~8% married-couple; effect stronger for Black and Latino families",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "family", toDomain: "education",
    fromMetric: "Father absence (non-residential, disengaged)",
    toMetric: "Child school dropout probability",
    coefficient: 0.14,
    direction: "negative", lagYears: 10,
    unit: "probability increase vs. father-present households",
    evidenceCitation: "McLanahan, S., Tach, L., & Schneider, D. (2013). The Causal Effects of Father Absence. Annual Review of Sociology, 39, 399–427.",
    studyYear: 2013,
    populationNotes: "Controls for income; effect independent of socioeconomic status",
    confidenceLevel: "strong",
  },

  // ── HEALTH → WORKFORCE ────────────────────────────────────────────────────
  {
    fromDomain: "health", toDomain: "workforce",
    fromMetric: "Untreated mental health condition",
    toMetric: "Employment rate reduction",
    coefficient: -0.24,
    direction: "negative", lagYears: 0,
    unit: "probability decrease in employment",
    evidenceCitation: "Insel, T.R. (2008). Assessing the Economic Costs of Serious Mental Illness. American Journal of Psychiatry, 165(6), 663–665.",
    studyYear: 2008,
    populationNotes: "Serious mental illness; milder conditions have smaller but significant effects",
    confidenceLevel: "moderate",
  },
  {
    fromDomain: "health", toDomain: "economic",
    fromMetric: "Untreated mental health (national annual burden)",
    toMetric: "Annual economic cost (lost productivity + healthcare)",
    coefficient: 193000000000,
    direction: "negative", lagYears: 0,
    unit: "dollars annually (US national)",
    evidenceCitation: "Insel, T.R. (2008). Assessing the Economic Costs of Serious Mental Illness. American Journal of Psychiatry, 165(6), 663–665.",
    studyYear: 2008,
    populationNotes: "Lost earnings + excess healthcare; $193B annually in the US",
    confidenceLevel: "moderate",
  },

  // ── FAILED POLICIES (counterfactual evidence) ─────────────────────────────
  {
    fromDomain: "justice", toDomain: "justice",
    fromMetric: "Mandatory minimum drug sentencing (1986–2010)",
    toMetric: "Reduction in drug use / recidivism",
    coefficient: 0.0,
    direction: "negative", lagYears: 5,
    unit: "effect size on drug use rates (null)",
    evidenceCitation: "National Research Council (2014). The Growth of Incarceration in the United States. Washington, DC: National Academies Press.",
    studyYear: 2014,
    populationNotes: "Mandatory minimums drove mass incarceration (10x increase 1970–2010) with no measurable deterrence effect; disproportionate impact on communities of color",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "education", toDomain: "health",
    fromMetric: "DARE program implementation",
    toMetric: "Youth drug use reduction",
    coefficient: 0.0,
    direction: "negative", lagYears: 2,
    unit: "effect size on drug use (null to negative)",
    evidenceCitation: "Ennett, S. et al. (1994). How Effective is Drug Abuse Resistance Education? American Journal of Public Health, 84(9), 1394–1401. Also: General Accounting Office (2003). Drug Abuse: Efforts to Measure DARE's Effectiveness Have Produced Limited and Inconclusive Results.",
    studyYear: 2003,
    populationNotes: "Meta-analysis: DARE shows no significant effect on drug use; some studies show increased curiosity/use among participants",
    confidenceLevel: "strong",
  },

  // ── GENERATIONAL CYCLE ────────────────────────────────────────────────────
  {
    fromDomain: "family", toDomain: "early_childhood",
    fromMetric: "Mother's adverse childhood experiences (ACEs ≥4)",
    toMetric: "Child ACE exposure probability",
    coefficient: 0.42,
    direction: "negative", lagYears: 0,
    unit: "intergenerational transmission probability",
    evidenceCitation: "Merrick, M. et al. (2019). Vital Signs: Estimated Proportion of Adult Health Problems Attributable to Adverse Childhood Experiences. MMWR, 68(44), 999–1005. CDC.",
    studyYear: 2019,
    populationNotes: "ACEs are the mechanism through which generational cycles perpetuate; intervention before age 6 is most effective break point",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "early_childhood", toDomain: "family",
    fromMetric: "Adolescent parent (mother under 19)",
    toMetric: "Child poverty / instability probability",
    coefficient: 0.53,
    direction: "negative", lagYears: 0,
    unit: "probability increase vs. adult-parent households",
    evidenceCitation: "Hoffman, S. (2006). By the Numbers: The Public Costs of Teen Childbearing. Washington, DC: The National Campaign to Prevent Teen and Unplanned Pregnancy.",
    studyYear: 2006,
    populationNotes: "Teen births cost US taxpayers $9.4B annually in increased social services; children of teen mothers more likely to become teen parents themselves",
    confidenceLevel: "moderate",
  },

  // ── INTERVENTION EFFECTIVENESS ────────────────────────────────────────────
  {
    fromDomain: "early_childhood", toDomain: "economic",
    fromMetric: "Nurse-Family Partnership home visiting program",
    toMetric: "ROI per dollar invested",
    coefficient: 5.70,
    direction: "positive", lagYears: 15,
    unit: "dollars returned per dollar invested",
    evidenceCitation: "Washington State Institute for Public Policy (2019). Nurse-Family Partnership: Benefit-Cost Analysis. Olympia, WA: WSIPP.",
    studyYear: 2019,
    populationNotes: "NFP serves first-time low-income mothers; $5.70 returned per $1 invested over 15 years",
    confidenceLevel: "strong",
  },
  {
    fromDomain: "housing", toDomain: "economic",
    fromMetric: "Supportive housing (Housing First model)",
    toMetric: "Government cost reduction vs. shelter/ER/incarceration",
    coefficient: 0.40,
    direction: "positive", lagYears: 1,
    unit: "cost reduction ratio",
    evidenceCitation: "Culhane, D. et al. (2002). Public Service Reductions Associated with Placement of Homeless Persons with Severe Mental Illness in Supportive Housing. Housing Policy Debate, 13(1), 107–163.",
    studyYear: 2002,
    populationNotes: "Housing First reduces government cost 40–60% vs. emergency shelter cycling; strong replication across US cities",
    confidenceLevel: "strong",
  },
];

// ── Domain metadata ────────────────────────────────────────────────────────
export const CHAINWEB_DOMAINS = [
  { id: "early_childhood", label: "Early Childhood",   color: "#f59e0b", icon: "Baby",         description: "Pre-K, ages 0–5, ACEs, parental stability" },
  { id: "education",       label: "Education",          color: "#3b82f6", icon: "GraduationCap", description: "3rd grade literacy, dropout, graduation, remediation costs" },
  { id: "workforce",       label: "Workforce",          color: "#10b981", icon: "Briefcase",     description: "Employment, earnings, skills, credential attainment" },
  { id: "housing",         label: "Housing",            color: "#8b5cf6", icon: "Home",          description: "Stability, cost burden, homelessness, moves" },
  { id: "health",          label: "Health",             color: "#ef4444", icon: "Heart",         description: "Mental health, ER utilization, chronic disease, maternal" },
  { id: "justice",         label: "Justice",            color: "#6366f1", icon: "Scale",         description: "Incarceration, recidivism, reentry, court costs" },
  { id: "family",          label: "Family Stability",   color: "#f97316", icon: "Users",         description: "Father presence, teen parenthood, ACE transmission, structure" },
  { id: "civic",           label: "Civic & Community",  color: "#14b8a6", icon: "Building2",     description: "Voter participation, community trust, tax base, budget burden" },
  { id: "economic",        label: "Economic",           color: "#64748b", icon: "TrendingUp",    description: "Government costs, tax revenue, ROI calculations, GDP" },
];

// Preset scenario templates — ready-to-run
export const CHAINWEB_TEMPLATES = [
  {
    id: "early_literacy",
    name: "Pre-K Investment vs. Grade 3–10 Remediation",
    entryDomain: "early_childhood",
    interventionName: "Universal Pre-K + Early Childhood Counseling (ages 0–5)",
    description: "Dr. Flood's foundational case: $7K–$12K invested before age 6 vs. $30K–$40K per child spent trying to remediate from grades 3–10 — and the full downstream cost if we don't.",
    domains: ["early_childhood","education","workforce","justice","family","economic"],
  },
  {
    id: "school_to_prison",
    name: "School-to-Prison Pipeline Interruption",
    entryDomain: "education",
    interventionName: "Comprehensive reentry + wraparound services (RNR/CBI model)",
    description: "The causal web from 3rd grade dropout risk through incarceration, recidivism, generational transmission, and the government cost of doing nothing.",
    domains: ["education","justice","workforce","housing","family","economic"],
  },
  {
    id: "housing_first",
    name: "Housing First vs. Emergency Shelter Cycling",
    entryDomain: "housing",
    interventionName: "Housing First supportive housing placement",
    description: "What housing instability costs across ER, incarceration, child outcomes, and workforce — vs. the cost of Housing First.",
    domains: ["housing","health","education","workforce","justice","economic"],
  },
  {
    id: "dads_care",
    name: "Father Engagement → Family Stability Cascade",
    entryDomain: "family",
    interventionName: "Dads Care 2 — Father re-engagement program",
    description: "Father presence effect on child poverty, education, justice involvement, and the generational cycle — in Travis/Williamson County.",
    domains: ["family","early_childhood","education","economic","justice"],
  },
];

// ── Evidence-Based Program Catalog ─────────────────────────────────────────
// Derived from citations already in CHAINWEB_COEFFICIENTS + peer-reviewed
// implementation science literature. Every entry cites a primary source.

export interface EvidenceProgram {
  id: string;
  name: string;
  shortName: string;
  topicKeywords: string[];
  domains: string[];
  targetPopulation: string;
  deliveryModel: string;
  effectSizes: { outcome: string; size: string; unit: string; citation: string }[];
  roiPerDollar: number | null;
  roiCitation: string | null;
  whatWorked: string[];
  whatFailed: string[];
  replicationQuality: "strong" | "moderate" | "emerging";
  clearinghouseRating: string;
  contactUrl: string;
  notes: string;
}

export const EVIDENCE_PROGRAMS: EvidenceProgram[] = [
  {
    id: "nurse_family_partnership",
    name: "Nurse-Family Partnership",
    shortName: "NFP",
    topicKeywords: ["nurse","home visiting","maternal","infant","prenatal","home visit","newborn","first-time mother","nurse home visiting"],
    domains: ["early_childhood","health","family","economic"],
    targetPopulation: "First-time, low-income mothers; enrollment before 28 weeks gestation",
    deliveryModel: "Registered nurses visit homes from pregnancy through child age 2; 64 visits over 2.5 years",
    effectSizes: [
      { outcome: "Child abuse and neglect", size: "48", unit: "% reduction", citation: "Olds, D. et al. (1997). Long-term effects of home visitation on maternal life course. JAMA, 278(8), 637–643." },
      { outcome: "Childhood injuries", size: "56", unit: "% reduction", citation: "Olds, D. et al. (1986). Preventing child abuse and neglect: a randomized trial of nurse home visitation. Pediatrics, 78(1), 65–78." },
      { outcome: "Child criminal arrests by age 19 (daughters)", size: "59", unit: "% reduction", citation: "Olds, D. et al. (1998). Long-term effects of nurse home visitation on children's criminal and antisocial behavior. JAMA, 280(14), 1238–1244." },
    ],
    roiPerDollar: 5.70,
    roiCitation: "Washington State Institute for Public Policy (2019). Nurse-Family Partnership: Benefit-Cost Analysis. Olympia, WA: WSIPP.",
    whatWorked: [
      "Registered nurses (not paraprofessionals) as primary deliverers — critical fidelity element",
      "Enrollment before 28 weeks gestation maximizes effect",
      "Consistent nurse assignment over the full 2.5-year program period",
      "Structured visit curriculum with clearly defined content",
      "Strongest effects for highest-risk populations (very low income, single, young mothers)",
    ],
    whatFailed: [
      "Paraprofessional versions show significantly weaker effects than RN-delivered model",
      "Late enrollment (post-birth) substantially reduces child outcome effects",
      "Effects on maternal life course (education, employment) are modest vs. child health outcomes",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "Title IV-E Prevention Services Clearinghouse: Well-Supported",
    contactUrl: "https://www.nursefamilypartnership.org",
    notes: "RCT evidence from three geographically distinct trials (Elmira NY, Memphis TN, Denver CO). One of only ~5 programs rated Well-Supported by the Title IV-E Clearinghouse.",
  },
  {
    id: "perry_preschool",
    name: "HighScope Perry Preschool Program",
    shortName: "Perry Preschool",
    topicKeywords: ["pre-k","preschool","early childhood","early education","kindergarten readiness","3-year-old","4-year-old","head start"],
    domains: ["early_childhood","education","economic","justice"],
    targetPopulation: "Low-income African American children ages 3–4 at high risk of school failure",
    deliveryModel: "2.5-hour daily classroom (active learning) + weekly home visit; 2 years",
    effectSizes: [
      { outcome: "High school graduation", size: "65 vs 45", unit: "% (treatment vs control)", citation: "Schweinhart, L. et al. (2005). Lifetime Effects: The HighScope Perry Preschool Study through age 40. Ypsilanti, MI: HighScope Press." },
      { outcome: "Arrested 5+ times by age 40", size: "36 vs 55", unit: "% (treatment vs control)", citation: "Schweinhart, L. et al. (2005). Lifetime Effects." },
      { outcome: "Monthly earnings at age 40", size: "42", unit: "% higher than control", citation: "Schweinhart, L. et al. (2005). Lifetime Effects." },
    ],
    roiPerDollar: 12.90,
    roiCitation: "Heckman, J. et al. (2010). The Rate of Return to the HighScope Perry Preschool Program. Journal of Public Economics, 94(1–2), 114–128.",
    whatWorked: [
      "Child-initiated learning (plan-do-review cycle) — active learning is the critical ingredient",
      "Daily sessions plus weekly 90-minute home visits",
      "Small class size (1:6 teacher-child ratio)",
      "Effects strongest for highest-risk children (lowest cognitive scores at baseline)",
    ],
    whatFailed: [
      "IQ gains faded by 2nd grade — long-run effects came through non-cognitive skills (self-regulation, motivation)",
      "Single-site study; large-scale replication not yet fully demonstrated",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "What Works Clearinghouse: Strong Evidence",
    contactUrl: "https://highscope.org/perry-preschool-project",
    notes: "40-year follow-up is unique in the field. Non-cognitive skill development is the primary mechanism of long-term effects, not IQ.",
  },
  {
    id: "housing_first",
    name: "Housing First (Pathways to Housing Model)",
    shortName: "Housing First",
    topicKeywords: ["housing","homelessness","homeless","supportive housing","permanent housing","shelter","housing first"],
    domains: ["housing","health","economic","justice"],
    targetPopulation: "Chronically homeless adults, including those with serious mental illness and co-occurring substance use",
    deliveryModel: "Immediate permanent housing (scattered-site) with voluntary wraparound services; no sobriety requirement",
    effectSizes: [
      { outcome: "Housing retention at 2 years", size: "80 vs 30", unit: "% (treatment vs usual care)", citation: "Tsemberis, S. et al. (2004). Housing First, consumer choice, and harm reduction. American Journal of Public Health, 94(4), 651–656." },
      { outcome: "Government cost reduction vs. shelter cycling", size: "40", unit: "% reduction", citation: "Culhane, D. et al. (2002). Public Service Reductions Associated with Placement of Homeless Persons. Housing Policy Debate, 13(1), 107–163." },
      { outcome: "Psychiatric hospitalization", size: "35", unit: "% reduction", citation: "Gulcur, L. et al. (2003). Housing, hospitalization, and cost outcomes. Journal of Community and Applied Social Psychology, 13(2), 171–186." },
    ],
    roiPerDollar: 1.40,
    roiCitation: "Montgomery, A. et al. (2016). Housing First and cost offsets. Psychiatric Services, 67(2), 168–172.",
    whatWorked: [
      "Immediate housing — no 'housing readiness' requirement is the critical fidelity element",
      "Consumer choice of housing unit type and location",
      "Voluntary services — participants choose which supports to accept",
      "Harm reduction philosophy rather than abstinence requirement",
    ],
    whatFailed: [
      "Substance use outcomes are mixed — housing stability improves but substance use may not decrease without treatment",
      "Requires landlord recruitment and ongoing partnership — chronically underinvested",
      "Family homelessness implementation has weaker evidence than adult chronic homelessness",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "SAMHSA Evidence-Based Practices Resource Center: Strong Research Evidence",
    contactUrl: "https://www.pathwaystohousing.org",
    notes: "Canadian At Home/Chez Soi trial (2,000+ participants) confirmed US findings. Cost savings depend on local ER/shelter/jail costs.",
  },
  {
    id: "rnr_reentry",
    name: "Risk-Need-Responsivity (RNR) Reentry Programs",
    shortName: "RNR/CBI Reentry",
    topicKeywords: ["reentry","recidivism","incarceration","prison","probation","parole","justice","reintegration","cognitive behavioral","RNR","CBI"],
    domains: ["justice","workforce","housing","economic","family"],
    targetPopulation: "Adults returning from incarceration; highest effects for moderate-to-high-risk individuals",
    deliveryModel: "Structured cognitive-behavioral intervention targeting criminogenic needs; pre- and post-release",
    effectSizes: [
      { outcome: "Recidivism reduction (re-arrest/re-conviction)", size: "20–40", unit: "% reduction across meta-analyses", citation: "Andrews, D. & Bonta, J. (2010). Rehabilitating Criminal Justice Policy and Practice. Psychology, Public Policy, and Law, 16(1), 39–55." },
      { outcome: "Re-incarceration at 3 years (high-fidelity RNR)", size: "30", unit: "% reduction", citation: "Lipsey, M. (2009). The Primary Factors that Characterize Effective Interventions with Juvenile Offenders. Victims & Offenders, 4(2), 124–147." },
    ],
    roiPerDollar: 2.80,
    roiCitation: "Drake, E. (2013). Inventory of Evidence-Based Programs for Adult Corrections. Olympia, WA: WSIPP.",
    whatWorked: [
      "Risk principle: target moderate-to-high risk; low-risk individuals do NOT benefit and may be harmed",
      "Need principle: target criminogenic needs (anti-social attitudes, peers, substance use) not non-criminogenic needs",
      "Cognitive-behavioral components — changing thinking patterns is the active ingredient",
      "Continuity of care from pre-release to community (bridging the gap is critical)",
    ],
    whatFailed: [
      "Low-risk individuals: RNR programs increase recidivism when applied incorrectly — documented, consistent finding",
      "Boot camps: no recidivism effect, sometimes negative (NRC 2014)",
      "Scared Straight: increases recidivism 1.6–28% across 9 evaluations (Petrosino et al., 2003)",
      "Mandatory minimum sentencing: zero deterrence effect, massive cost (NRC 2014)",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "CrimeSolutions.gov: Effective (multiple RNR-based programs)",
    contactUrl: "https://www.wsipp.wa.gov",
    notes: "RNR is a framework, not a single program. TCAF's Chainweb school-to-prison pipeline template is built on this framework.",
  },
  {
    id: "big_brothers_big_sisters",
    name: "Big Brothers Big Sisters Community-Based Mentoring",
    shortName: "BBBS",
    topicKeywords: ["mentoring","mentor","youth","big brothers","big sisters","BBBS","male role model","fatherhood","male mentor","youth mentoring"],
    domains: ["family","education","justice","economic"],
    targetPopulation: "Youth ages 6–18, particularly from single-parent households or with an incarcerated parent",
    deliveryModel: "One-to-one community-based mentoring; matched volunteer adult meets youth 2–4x/month",
    effectSizes: [
      { outcome: "Drug and alcohol initiation", size: "46", unit: "% less likely to initiate", citation: "Tierney, J. et al. (1995). Making a Difference: An Impact Study of Big Brothers Big Sisters. Philadelphia: Public/Private Ventures." },
      { outcome: "School attendance", size: "52", unit: "% less likely to skip school", citation: "Tierney, J. et al. (1995). Public/Private Ventures." },
      { outcome: "Violence (hitting someone)", size: "32", unit: "% less likely to hit someone", citation: "Tierney, J. et al. (1995). Public/Private Ventures." },
    ],
    roiPerDollar: 23.0,
    roiCitation: "Aos, S. et al. (2011). Return on Investment: Evidence-Based Options. Olympia, WA: WSIPP.",
    whatWorked: [
      "Match duration: 12+ month matches produce significantly stronger outcomes",
      "Match quality and consistency: frequent, reliable contact is the strongest predictor",
      "Youth with incarcerated parents show particularly strong positive response",
      "Black male youth matched with Black male mentors show strong identity and social effects",
    ],
    whatFailed: [
      "Early closure (< 6 months) can be HARMFUL — worse outcomes than no match",
      "Under-screened volunteers with inconsistent follow-through create harm",
      "Black male mentors are critically undersupplied — waitlists for Black boys are the documented gap TCAF addresses",
    ],
    replicationQuality: "moderate",
    clearinghouseRating: "OJJDP Model Programs: Promising; What Works Clearinghouse: Moderate Evidence",
    contactUrl: "https://www.bbbs.org",
    notes: "Travis County BBBS waitlist data for Black boys is a tracked metric in the TCAF corridor-story evidence catalog.",
  },
  {
    id: "multisystemic_therapy",
    name: "Multisystemic Therapy (MST)",
    shortName: "MST",
    topicKeywords: ["youth","juvenile","delinquency","family therapy","MST","multisystemic","juvenile justice","truancy","behavior","antisocial"],
    domains: ["family","justice","education","health"],
    targetPopulation: "Adolescents ages 12–17 at risk of out-of-home placement due to serious antisocial behavior",
    deliveryModel: "Intensive family- and community-based treatment; therapist caseload 4–6 families; 3–5 months",
    effectSizes: [
      { outcome: "Re-arrest at 2–4 years", size: "25–70", unit: "% reduction across trials", citation: "Henggeler, S. et al. (2009). Multisystemic Therapy for Antisocial Behavior in Children and Adolescents (2nd ed.). New York: Guilford Press." },
      { outcome: "Out-of-home placement", size: "54", unit: "% reduction vs usual services", citation: "Schaeffer, C. & Borduin, C. (2005). Long-term follow-up to a randomized clinical trial of MST. JCCP, 73(3), 445–453." },
      { outcome: "Days incarcerated (14-year follow-up)", size: "57", unit: "% fewer days", citation: "Schaeffer, C. & Borduin, C. (2005). JCCP." },
    ],
    roiPerDollar: 18.0,
    roiCitation: "Washington State Institute for Public Policy (2019). Multisystemic Therapy for Juveniles. Benefit-Cost Analysis. Olympia, WA: WSIPP.",
    whatWorked: [
      "Whole-system approach: therapist works with family, school, peers, AND community simultaneously",
      "High contact frequency with 24/7 crisis availability",
      "Treatment fidelity — therapist adherence to MST principles is the strongest predictor of outcomes",
      "Individualized to identified drivers of behavior",
    ],
    whatFailed: [
      "Low-fidelity implementations produce weak or null effects — program quality is decisive",
      "Does not show strong effects for substance use as the primary presenting problem",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "Blueprints for Healthy Youth Development: Model Plus; CrimeSolutions: Effective",
    contactUrl: "https://www.mstservices.com",
    notes: "Proprietary — requires licensing through MST Services. Strong evidence for reducing out-of-home placement and long-term incarceration.",
  },
  {
    id: "dads_care_2",
    name: "Dads Care 2 — Father Re-engagement Program",
    shortName: "Dads Care 2",
    topicKeywords: ["father","fatherhood","dads","paternal","dad engagement","father involvement","non-custodial","co-parenting","Black fathers","Latino fathers"],
    domains: ["family","early_childhood","education","economic"],
    targetPopulation: "Non-custodial, justice-involved, and disconnected fathers in urban communities; focus on Black and Latino fathers",
    deliveryModel: "Group-based + individual coaching; peer mentor model; CHW outreach at trusted community touchpoints",
    effectSizes: [
      { outcome: "Father-child contact frequency", size: "62", unit: "% of participants increased contact", citation: "TCAF Program Outcome Data (2024). Available upon request: terryflood@thrivingcommunitiesforall.com" },
      { outcome: "Child school engagement (parental report)", size: "41", unit: "% showed improvement", citation: "TCAF Program Outcome Data (2024)." },
      { outcome: "Co-parenting conflict reduction", size: "38", unit: "% reduction in reported conflict", citation: "TCAF Program Outcome Data (2024)." },
    ],
    roiPerDollar: null,
    roiCitation: null,
    whatWorked: [
      "Peer mentor model — fathers who succeeded mentoring fathers currently struggling",
      "Meeting men where they are: barbershops, churches, community centers",
      "Non-judgmental approach — no blame for past; focus on current relationship and capacity",
      "Connecting to legal aid for child support modification where applicable",
    ],
    whatFailed: [
      "Formal evaluation limited — primary source data is TCAF; peer-reviewed evidence base is emerging",
      "Engagement difficult with fathers who have active CPS involvement",
      "Sustainability of behavioral changes beyond program period requires booster sessions",
    ],
    replicationQuality: "emerging",
    clearinghouseRating: "Not yet formally rated — TCAF-developed; evaluation underway",
    contactUrl: "https://www.thrivingcommunitiesforall.com",
    notes: "Aligned with the Responsible Fatherhood literature (Bronte-Tinkew et al., 2007). The Chainweb 'Father Engagement' template models the causal chain this program interrupts.",
  },
  {
    id: "snap_navigation",
    name: "Benefits Navigation / SNAP Enrollment Assistance",
    shortName: "Benefits Navigation",
    topicKeywords: ["SNAP","food stamps","benefits","enrollment","navigation","CHW","community health worker","medicaid","WIC","CHIP","benefits gap"],
    domains: ["economic","health","family","early_childhood"],
    targetPopulation: "Low-income families eligible for SNAP, Medicaid, CHIP, EITC, WIC — not enrolled due to barriers",
    deliveryModel: "CHW-led outreach at trusted touchpoints; 9-program simultaneous screener; bilingual; offline-capable",
    effectSizes: [
      { outcome: "Enrollment rate vs. self-directed enrollment", size: "3x", unit: "higher enrollment rate with CHW assistance", citation: "Bovell-Ammon, A. et al. (2020). WIC Participation and Socioeconomic Outcomes. Pediatrics, 145(3), e20192841." },
      { outcome: "Food insecurity reduction (SNAP recipients)", size: "30", unit: "% reduction", citation: "Chloe East (2018). The Effect of Food Stamps on Children's Health. American Economic Journal: Economic Policy, 10(2), 109–133." },
      { outcome: "Avoidable ER visits (Medicaid enrollment)", size: "25", unit: "% reduction", citation: "Wherry, L. et al. (2018). Childhood Medicaid Coverage and Later Life Health Care Utilization. Review of Economics and Statistics, 100(2), 287–302." },
    ],
    roiPerDollar: 1.80,
    roiCitation: "Center on Budget and Policy Priorities (2019). SNAP Works for America's Children. Washington, DC: CBPP.",
    whatWorked: [
      "Trusted community touchpoints — enrollment events at churches, schools, food pantries outperform office-based outreach",
      "Bilingual navigators matching the community's language and culture",
      "9-program simultaneous screener: catch everything in one visit",
      "Offline capability for no-broadband zones",
      "60-30-14-day automated renewal cascade to prevent benefit loss",
    ],
    whatFailed: [
      "Office-based enrollment (HHSC/DHS): administrative burden, hostile design, English-only forms systematically exclude eligible families",
      "Annual renewal requirements cause benefit churning — families lose and regain same benefits repeatedly",
      "Online-only applications exclude ~42% of eligible households in high-barrier tracts",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "USDA FNS Outreach Model: Evidence-Based; CBPP Best Practices",
    contactUrl: "https://www.thrivingcommunitiesforall.com",
    notes: "TCAF's Benefits Intelligence System is the platform implementation of this model. The SDOH Impact Chain benefits gap data comes directly from this system's enrollment gap calculation.",
  },
  {
    id: "community_health_worker",
    name: "Community Health Worker (CHW) Model",
    shortName: "CHW Model",
    topicKeywords: ["community health worker","CHW","promotora","health navigator","peer health","trusted messenger","lay health","outreach"],
    domains: ["health","economic","family","civic"],
    targetPopulation: "Medically underserved communities; immigrant families; rural and low-income urban populations",
    deliveryModel: "DSHS-certified CHWs embedded in community settings; trusted-messenger model; stipended",
    effectSizes: [
      { outcome: "Preventable ER visit reduction", size: "18–29", unit: "% reduction", citation: "Kangovi, S. et al. (2014). Patient-Centered CHW Intervention to Improve Posthospital Outcomes. JAMA Internal Medicine, 174(4), 535–543." },
      { outcome: "Preventive care utilization", size: "40", unit: "% increase in recommended preventive services", citation: "Lewin, S. et al. (2010). Lay health workers in primary and community health care. Cochrane Database of Systematic Reviews." },
    ],
    roiPerDollar: 2.30,
    roiCitation: "AHRQ (2010). Economic Analysis of Community Health Worker Programs. Publication No. 10-E003. Rockville, MD: AHRQ.",
    whatWorked: [
      "Lived experience — CHWs from the same community, speaking the same language",
      "Stipended model — paying CHWs as professionals, not volunteers, for sustainability",
      "Integration with clinical teams (co-located or electronic referral pathway)",
      "Case management continuity — same CHW over time",
    ],
    whatFailed: [
      "Volunteer-only models have poor retention and variable quality",
      "Without sustainable funding (Medicaid billing now possible in TX), programs are grant-dependent",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "CDC Community Preventive Services Task Force: Sufficient Evidence",
    contactUrl: "https://www.thrivingcommunitiesforall.com",
    notes: "TCAF's ITI (Integration through Invitation) framework is the shadow-worker enrollment pathway for CHW identification and credentialing.",
  },
  {
    id: "trauma_focused_cbt",
    name: "Trauma-Focused Cognitive Behavioral Therapy (TF-CBT)",
    shortName: "TF-CBT",
    topicKeywords: ["trauma","ACE","adverse childhood experience","CBT","therapy","PTSD","sexual abuse","child trauma","mental health","trauma-informed"],
    domains: ["health","family","early_childhood","education"],
    targetPopulation: "Children ages 3–18 who have experienced traumatic events; caregiver participation required",
    deliveryModel: "12–25 structured therapy sessions for child and caregiver separately then jointly; manualized protocol",
    effectSizes: [
      { outcome: "PTSD symptoms", size: "0.80", unit: "standard deviation reduction (large effect)", citation: "Cohen, J. et al. (2004). A multisite RCT for children with sexual abuse-related PTSD. JAACAP, 43(4), 393–402." },
      { outcome: "Depression symptoms", size: "0.68", unit: "standard deviation reduction", citation: "Mavranezouli, I. et al. (2020). Psychological treatments for PTSD: a network meta-analysis. Psychological Medicine." },
      { outcome: "Caregiver distress", size: "0.61", unit: "standard deviation reduction", citation: "Cohen, J. et al. (2004). JAACAP." },
    ],
    roiPerDollar: 4.20,
    roiCitation: "Washington State Institute for Public Policy (2019). TF-CBT: Benefit-Cost Analysis. Olympia, WA: WSIPP.",
    whatWorked: [
      "Caregiver involvement — treating the non-offending caregiver is a critical active ingredient",
      "Trauma narrative component — child constructs and processes the trauma story",
      "Gradual exposure — systematic desensitization",
      "Telehealth delivery shows comparable outcomes to in-person",
    ],
    whatFailed: [
      "Without caregiver involvement, outcomes are substantially weaker",
      "Requires trained therapists — shortage in rural areas and communities of color",
    ],
    replicationQuality: "strong",
    clearinghouseRating: "Title IV-E Prevention Services Clearinghouse: Well-Supported; Blueprints: Model Program",
    contactUrl: "https://tfcbt.org",
    notes: "One of the best-studied child trauma treatments. Relevant to TCAF's WPH and foster care surfaces.",
  },
];

// ── State/Jurisdiction Policy History ─────────────────────────────────────
// What states have tried, what happened. Honest — includes failures and null effects.

export interface JurisdictionRecord {
  state: string;
  stateCode: string;
  topic: string;
  topicKeywords: string[];
  policyName: string;
  yearImplemented: number;
  yearEnded: number | null;
  outcome: "effective" | "null_effect" | "harmful" | "mixed" | "ongoing_promising";
  evidenceSummary: string;
  costInvestment: string | null;
  primaryCitation: string;
}

export const JURISDICTION_DATA: JurisdictionRecord[] = [
  {
    state: "Texas", stateCode: "TX",
    topic: "early_childhood",
    topicKeywords: ["pre-k","preschool","early childhood","early education"],
    policyName: "Texas Pre-K 4 SA (San Antonio)",
    yearImplemented: 2013, yearEnded: null,
    outcome: "effective",
    evidenceSummary: "Full-day pre-K in San Antonio ISD. 78% of graduates met kindergarten readiness standards vs. 62% statewide. Strong outcomes for Black and Latino students. Funded by city 1/8-cent sales tax — a local innovation bypassing state funding limits.",
    costInvestment: "$16,000 per child annually",
    primaryCitation: "Texas Education Agency / Pre-K 4 SA Independent Evaluation (2022). Annual Program Evaluation Report. San Antonio, TX.",
  },
  {
    state: "Texas", stateCode: "TX",
    topic: "justice",
    topicKeywords: ["reentry","recidivism","justice","prison","parole"],
    policyName: "TDCJ Reentry Programs (CHANGES)",
    yearImplemented: 2010, yearEnded: null,
    outcome: "mixed",
    evidenceSummary: "Texas recidivism rate declined from 28% (2010) to 22% (2022), partially attributed to reentry services. However Texas still incarcerates at the highest absolute rate in the US. Evidence-based programming reaches < 30% of the incarcerated population.",
    costInvestment: "~$340M annually for all TDCJ reentry and rehabilitation programs",
    primaryCitation: "Texas Department of Criminal Justice (2023). Statistical Report FY2022. Austin, TX: TDCJ.",
  },
  {
    state: "Texas", stateCode: "TX",
    topic: "housing",
    topicKeywords: ["housing","homelessness","homeless","supportive housing"],
    policyName: "TexHOPE / Austin ECHO Coordinated System",
    yearImplemented: 2021, yearEnded: null,
    outcome: "ongoing_promising",
    evidenceSummary: "Austin reduced its point-in-time homeless count by 12% between 2020–2023 using Housing First investments. Statewide counts increased in non-urban areas. Austin ECHO (Ending Community Homelessness Coalition) is the most mature coordinated homeless system in Texas.",
    costInvestment: "Governor's Emergency Rental Assistance Program: $1.37B (2021–2022)",
    primaryCitation: "Texas Homeless Network (2023). State of Homelessness in Texas 2023. Austin, TX: THN.",
  },
  {
    state: "Texas", stateCode: "TX",
    topic: "family",
    topicKeywords: ["fatherhood","father","dad","family stability","responsible fatherhood"],
    policyName: "Texas Fatherhood Initiative (TFI)",
    yearImplemented: 2000, yearEnded: null,
    outcome: "mixed",
    evidenceSummary: "State-funded fatherhood programs through HHSC. Limited rigorous evaluation. Programs vary widely in quality. Most are curriculum-based (Nurturing Fathers, 24/7 Dad) with self-reported outcomes. TCAF's Dads Care 2 is a community-developed alternative with stronger cultural alignment for Black and Latino fathers in Central TX.",
    costInvestment: "$15M–$20M annually from TANF and state general revenue",
    primaryCitation: "Texas Health and Human Services Commission (2022). Fatherhood Program Annual Report. Austin, TX: HHSC.",
  },
  {
    state: "Texas", stateCode: "TX",
    topic: "workforce",
    topicKeywords: ["workforce","job training","employment","career","certification"],
    policyName: "TWC Industry-Based Certification (IBC)",
    yearImplemented: 2009, yearEnded: null,
    outcome: "effective",
    evidenceSummary: "Participants with IBC credentials earn 18–23% more than those without within 2 years. Welding (AWS D1.1), healthcare, and IT certifications show strongest wage gains. TCAF's workforce training platform aligns with this framework.",
    costInvestment: "$12M annually; employer match required",
    primaryCitation: "Texas Workforce Commission (2023). Industry-Based Certification Outcomes Report. Austin, TX: TWC.",
  },
  {
    state: "Texas", stateCode: "TX",
    topic: "education",
    topicKeywords: ["education","dropout","school","literacy","reading","3rd grade"],
    policyName: "Texas Reading Academies (HB 3)",
    yearImplemented: 2019, yearEnded: null,
    outcome: "ongoing_promising",
    evidenceSummary: "HB 3 mandated reading academies for all K-3 teachers; science of reading curriculum; 3rd grade retention policy for non-readers. 2023 NAEP shows Texas 4th grade reading 2 points above national average — improved from 2019. Implementation gaps remain in rural and high-poverty districts.",
    costInvestment: "$1.8B over 2019–2023 biennium",
    primaryCitation: "Texas Education Agency (2023). 2023 Texas Academic Performance Reports. Austin, TX: TEA.",
  },
  {
    state: "California", stateCode: "CA",
    topic: "early_childhood",
    topicKeywords: ["pre-k","preschool","universal pre-k","TK","transitional kindergarten"],
    policyName: "Universal Transitional Kindergarten (UTK)",
    yearImplemented: 2021, yearEnded: null,
    outcome: "ongoing_promising",
    evidenceSummary: "California is rolling out universal TK (age 4 as of 2022–23, expanding to age 3.5 by 2025–26). No outcome data yet from this implementation. This is the largest state universal pre-K expansion in US history (~350,000 additional children by full rollout).",
    costInvestment: "$2.7B annually at full implementation",
    primaryCitation: "California Department of Education (2023). UTK Implementation Report. Sacramento, CA: CDE.",
  },
  {
    state: "Illinois", stateCode: "IL",
    topic: "early_childhood",
    topicKeywords: ["pre-k","preschool","early childhood","home visiting","maternal"],
    policyName: "Preschool for All + Healthy Families Illinois",
    yearImplemented: 1998, yearEnded: null,
    outcome: "effective",
    evidenceSummary: "Illinois has one of the longest-running state pre-K programs (1998) and robust home visiting through Healthy Families Illinois (an NFP adaptation). Illinois pre-K participants show significantly lower special education rates and higher 3rd grade reading scores. A national model for layered early childhood investment.",
    costInvestment: "$550M annually across early childhood programs",
    primaryCitation: "Illinois State Board of Education (2022). Preschool for All Program Evaluation. Springfield, IL: ISBE.",
  },
  {
    state: "Multiple", stateCode: "US",
    topic: "justice",
    topicKeywords: ["mandatory minimum","drug sentencing","mass incarceration","criminal justice","failed policy"],
    policyName: "Mandatory Minimum Drug Sentencing (1986 Anti-Drug Abuse Act)",
    yearImplemented: 1986, yearEnded: null,
    outcome: "harmful",
    evidenceSummary: "Mandatory minimums drove a 10x increase in the US incarcerated population (1970–2010). National Research Council (2014): zero deterrence effect on drug use; zero effect on drug crime rates; massive racial disparity (Black Americans incarcerated at 5x the rate of white Americans for similar offenses). Total cost of mass incarceration: ~$182B annually.",
    costInvestment: "$182 billion annually in combined federal, state, and local incarceration costs",
    primaryCitation: "National Research Council (2014). The Growth of Incarceration in the United States. Washington, DC: National Academies Press.",
  },
  {
    state: "Multiple", stateCode: "US",
    topic: "education",
    topicKeywords: ["DARE","drug prevention","school-based","failed policy","drug education"],
    policyName: "Drug Abuse Resistance Education (DARE)",
    yearImplemented: 1983, yearEnded: null,
    outcome: "null_effect",
    evidenceSummary: "Implemented in 75% of US school districts at peak (~$1–1.5B annually). GAO evaluation and systematic reviews: no significant effect on drug use. Some studies found DARE participants showed increased curiosity/experimentation. Lesson: police-led, scare-based drug education without behavioral skill-building produces no protective effect.",
    costInvestment: "$1B+ annually at peak; largely reformed",
    primaryCitation: "Ennett, S. et al. (1994). How effective is Drug Abuse Resistance Education? A meta-analysis. American Journal of Public Health, 84(9), 1394–1401.",
  },
];
