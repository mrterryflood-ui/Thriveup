/**
 * Hutto Ready — integrated demo content (route /hutto).
 *
 * Binding source: hutto/HUTTO_DEMO_SPEC.md. Every statistic below is one of the
 * spec's allowed facts and carries its source URL; no other Hutto statistic may
 * be added here. Evidence state: "observed" (cited external source) for facts,
 * "illustrative" for the composite family. Missing data is shown as missing.
 */

export const HUTTO_READY_TITLE = "Hutto Ready — Every Link, One Community";

export const HUTTO_DISCLAIMER =
  "Prepared for a conversation with Hutto ISD, the Hutto Area Chamber of Commerce and VeraBank. Not affiliated with, endorsed by, or sponsored by these organizations.";

export const HUTTO_COMPOSITE_LABEL = "Illustrative composite family, not a real Hutto record";

export const HUTTO_SPONSOR_SLOT = "Community sponsor: to be confirmed";

export type HuttoPlatformKey = "thriveup" | "childcore" | "lineready" | "finlitspark" | "hazardaware" | "fundingpathpro";

/** The six-link cross-platform strip, in spec order with spec labels. */
export const HUTTO_READY_LINKS: ReadonlyArray<{ key: HuttoPlatformKey; name: string; label: string; href: string }> = [
  { key: "thriveup", name: "ThriveUp", label: "Community front door", href: "https://thrivingcommunitiesforall.com/hutto" },
  { key: "childcore", name: "ChildCORE", label: "Early childhood", href: "https://childcorelearning.com/hutto" },
  { key: "lineready", name: "LineReady", label: "Workforce pathways", href: "https://linereadylabs.com/hutto" },
  { key: "finlitspark", name: "FinLitSpark", label: "Financial readiness", href: "https://financetrainingandtrading.com/hutto" },
  { key: "hazardaware", name: "HazardAware", label: "Emergency readiness", href: "https://www.clearsignalresponse.tech/hutto" },
  { key: "fundingpathpro", name: "Funding Path Pro", label: "Grants and funding", href: "https://pursuitsfundingprofessionals.com/hutto" },
];

export interface HuttoFact { id: string; text: string; source: string; href: string }

/** The spec's allowed facts, verbatim in substance. */
export const HUTTO_FACTS = {
  blueOrigin: { id: "blue-origin", text: "Blue Origin: more than $500M investment and more than 2,000 Hutto jobs over 10 years, with paid high-school internships and CTE support with Hutto ISD.", source: "KUT News, Oct 8, 2026", href: "https://www.kut.org/business/2026-10-08/blue-origin-hutto-aerospace-manufacturing" },
  cte: { id: "cte", text: "Hutto ISD offers 20 CTE programs of study across 11 career clusters.", source: "Hutto ISD CTE Programs of Study 2026–27", href: "https://www.hipponation.org/career-technical-education/programs-of-study-2026-2027" },
  headStart: { id: "head-start", text: "Hutto was the first area district with full-day Head Start.", source: "City of Hutto, About Hutto", href: "https://www.huttotx.gov/476/About-Hutto" },
  preK: { id: "pre-k", text: "Hutto ISD Pre-K is free for eligible families; paid Pre-K is $7,400 per year (2025–26).", source: "Hutto ISD Pre-K eligibility", href: "https://www.hipponation.org/early-childhood/prekindergarten-eligibility" },
  reach: { id: "reach", text: "The REACH program places students in internships with local businesses.", source: "Hutto EDC Workforce", href: "https://www.huttotxedc.gov/workforce" },
  tstc: { id: "tstc", text: "TSTC is expanding its robotics program to Williamson County.", source: "TSTC, Aug 17, 2026", href: "https://www.tstc.edu/blog/2026/08/17/tstc-expands-robotics-program-to-williamson-county-to-fill-regional-manufacturing-jobs/" },
  hb27: { id: "hb27", text: "Under HB 27, students entering grade 9 in 2026–27 take a half-credit personal financial literacy course.", source: "Texas Education Agency", href: "https://tea.texas.gov/taa-letters/updates-high-school-social-studies-personal-financial-literacy-graduation-requirements" },
  tec280021: { id: "tec-28-0021", text: "TEC §28.0021 allows personal financial literacy programs to be offered free to students.", source: "Texas Education Code §28.0021", href: "https://texas.public.law/statutes/tex._educ._code_section_28.0021" },
  infantCare: { id: "infant-care", text: "Williamson County average infant care costs $10,660 per year; 89% of surveyed centers reported hiring difficulty.", source: "United Way for Greater Austin Impact Report 2022–23", href: "https://unitedwayaustin.org/wp-content/uploads/2024/01/United-Way-for-Greater-Austin_ImpactReport_2022-2023-Financials.pdf" },
  population: { id: "population", text: "Williamson County had 752,827 residents in 2025, the 9th largest numeric growth in the U.S.", source: "U.S. Census Bureau, 2025 population estimates", href: "https://www.census.gov/newsroom/press-releases/2026/2025-popest-metro-micro-counties.html" },
  samsung: { id: "samsung", text: "Samsung Taylor: $17B initial investment and 1,800 direct jobs.", source: "Samsung Semiconductor, Taylor", href: "https://semiconductor.samsung.com/sas/company/taylor/" },
  dataCenters: { id: "data-centers", text: "About 30 data centers are operating or planned in Williamson County, 5 of them in Hutto.", source: "Austin Free Press, Data Boom", href: "https://austinfreepress.org/data-boom/" },
} satisfies Record<string, HuttoFact>;

export const HUTTO_PROBLEM: HuttoFact[] = [HUTTO_FACTS.population, HUTTO_FACTS.blueOrigin, HUTTO_FACTS.samsung, HUTTO_FACTS.dataCenters, HUTTO_FACTS.infantCare];
export const HUTTO_SOLUTION: HuttoFact[] = [HUTTO_FACTS.cte, HUTTO_FACTS.reach, HUTTO_FACTS.headStart, HUTTO_FACTS.preK, HUTTO_FACTS.tstc, HUTTO_FACTS.hb27, HUTTO_FACTS.tec280021];

export interface HuttoJourneyStop {
  n: number;
  platform: HuttoPlatformKey;
  who: string;
  title: string;
  see: string;
  facts: HuttoFact[];
}

/** The composite family journey — six numbered stops, one per platform. */
export const HUTTO_JOURNEY: HuttoJourneyStop[] = [
  { n: 1, platform: "thriveup", who: "Maria", title: "One front door for the whole family", see: "Maria types \"Hutto\" once and ThriveUp shows Hutto, TX (78634) by name, with local resources already in the directory and the next step for each family member.", facts: [] },
  { n: 2, platform: "childcore", who: "Leo, 4", title: "Early childhood while Leo waits for Pre-K", see: "ChildCORE's Hutto page shows how Leo's family can follow Pre-K eligibility and early-learning options while he is on a waitlist and Maria works an early shift.", facts: [HUTTO_FACTS.preK, HUTTO_FACTS.headStart] },
  { n: 3, platform: "lineready", who: "Andre, 14", title: "A robotics interest becomes a pathway", see: "LineReady's Hutto page maps Andre's robotics interest to career pathways that lead toward regional manufacturing jobs.", facts: [HUTTO_FACTS.cte, HUTTO_FACTS.tstc] },
  { n: 4, platform: "finlitspark", who: "Sofia, 17", title: "A first paycheck, handled well", see: "FinLitSpark's Hutto page walks Sofia through her first paycheck from a summer internship, in the personal financial literacy frame Texas now requires.", facts: [HUTTO_FACTS.reach, HUTTO_FACTS.hb27] },
  { n: 5, platform: "hazardaware", who: "The whole family", title: "Ready before an emergency", see: "HazardAware opens directly on the Hutto, Texas place view so the family can see emergency-readiness steps. People decide; nothing auto-sends.", facts: [] },
  { n: 6, platform: "fundingpathpro", who: "Partners", title: "Funding that keeps the links open", see: "Funding Path Pro's Hutto page shows how partners can find and pursue grants that sustain each link in this chain.", facts: [] },
];

export interface HuttoStakeholder { org: string; gets: string[]; facts: HuttoFact[] }

export const HUTTO_STAKEHOLDERS: HuttoStakeholder[] = [
  { org: "Hutto ISD", gets: [
    "One shared front door that points families to Pre-K, CTE pathways and financial literacy without new district systems.",
    "Pathway views that line up with the district's CTE programs of study and the new financial literacy requirement.",
  ], facts: [HUTTO_FACTS.cte, HUTTO_FACTS.hb27] },
  { org: "Hutto Area Chamber of Commerce", gets: [
    "A visible route from member businesses to student internships and the workforce employers are hiring for.",
    "Local business resources already listed in ThriveUp's directory, shown by name for Hutto.",
  ], facts: [HUTTO_FACTS.reach, HUTTO_FACTS.blueOrigin] },
  { org: "VeraBank", gets: [
    "A place-scoped community view (Hutto, TX) that a community bank can use to see local needs and financial-readiness touchpoints.",
    "A financial-readiness link for first-time earners like Sofia.",
    `${HUTTO_SPONSOR_SLOT}.`,
  ], facts: [HUTTO_FACTS.hb27] },
  { org: "Success By 6", gets: [
    "An early-childhood link (ChildCORE) that connects families on Pre-K waitlists to early-learning options.",
    "A way to see where child-care cost and staffing pressure meet family need in Williamson County.",
  ], facts: [HUTTO_FACTS.infantCare, HUTTO_FACTS.preK] },
];

export const HUTTO_ORCHESTRATION: ReadonlyArray<{ step: string; text: string }> = [
  { step: "Signal", text: "A need shows up: a Pre-K waitlist, a robotics interest, a first paycheck, a weather alert." },
  { step: "Front door", text: "The family starts at ThriveUp's Hutto page, recognized by name as Hutto, TX (78634)." },
  { step: "Act", text: "The right platform opens on its own Hutto page: ChildCORE, LineReady, FinLitSpark, HazardAware or Funding Path Pro." },
  { step: "Hand off to a named person", text: "Each handoff goes to a named contact at the receiving organization. Named contacts: to be confirmed with partners before any live use." },
  { step: "Measure", text: "Each handoff leaves a receipt. Outcomes are measurable once local data is connected; nothing here is a projected result." },
];
