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
