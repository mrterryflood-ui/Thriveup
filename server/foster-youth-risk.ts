// Rule-based, transparent risk stratification for foster-youth caseload rows.
// Every factor cites a published source. No black-box ML, no inference of
// race/ethnicity, no PII. Output is deterministic and explainable.
//
// Sources are public, peer-reviewed or federal/agency-published research:
//  - Midwest Evaluation of the Adult Functioning of Former Foster Youth (Courtney et al., 2011) — Chapin Hall
//  - National Youth in Transition Database (NYTD) — Children's Bureau
//  - National Working Group on Foster Care and Education — fact sheets
//  - Casey Family Programs — research briefs on placement stability
//  - Vera Institute — crossover-youth research
//  - True Colors United — LGBTQ youth homelessness data
//
// Tiers communicate URGENCY, not deficit. The youth is never "high risk";
// the *system response* is "elevated" because more stakeholders need to coordinate.

export type RiskTier = "stable" | "watch" | "elevated" | "critical";

export interface RiskFactor {
  id: string;
  label: string;
  points: number;
  citation: string;
  sourceUrl: string;
}

export interface CaseInputs {
  ageYears?: number | null;
  currentPlacementType?: string | null;
  monthsInCare?: number | null;
  placementCount?: number | null;
  schoolDisruptions?: number | null;
  ageAtFirstRemoval?: number | null;
  hasIep?: boolean | null;
  mentalHealthDx?: boolean | null;
  mhInTreatment?: boolean | null;
  priorRunaway?: boolean | null;
  justiceContact?: boolean | null;
  pregnantOrParenting?: boolean | null;
  siblingsSeparated?: boolean | null;
  permanentConnectionAdult?: boolean | null;
  pregEducDocsComplete?: boolean | null;
  lgbtqPlus?: boolean | null;
}

export interface RiskResult {
  score: number;
  tier: RiskTier;
  factors: RiskFactor[];
}

const CONGREGATE = new Set(["group_home", "RTC", "emergency", "runaway"]);

export function scoreCase(c: CaseInputs): RiskResult {
  const factors: RiskFactor[] = [];

  if ((c.placementCount ?? 0) > 5) {
    factors.push({
      id: "placement-instability",
      label: `${c.placementCount} placements (>5 documented as a major instability marker)`,
      points: 25,
      citation: "Midwest Study (Courtney et al., 2011)",
      sourceUrl: "https://www.chapinhall.org/research/midwest-evaluation-of-the-adult-functioning-of-former-foster-youth/",
    });
  }
  if ((c.schoolDisruptions ?? 0) > 3) {
    factors.push({
      id: "school-disruption",
      label: `${c.schoolDisruptions} school changes (>3 strongly correlates with non-completion)`,
      points: 15,
      citation: "National Working Group on Foster Care and Education (2018)",
      sourceUrl: "https://www.fostercareandeducation.org/",
    });
  }
  if ((c.monthsInCare ?? 0) > 36 && c.currentPlacementType && CONGREGATE.has(c.currentPlacementType)) {
    factors.push({
      id: "long-congregate-stay",
      label: `Long stay (${c.monthsInCare} mo) in congregate care`,
      points: 20,
      citation: "Casey Family Programs — Placement Stability brief",
      sourceUrl: "https://www.casey.org/placement-stability-impacts/",
    });
  }
  if (c.priorRunaway) {
    factors.push({
      id: "prior-runaway",
      label: "Prior runaway / AWOL episode",
      points: 15,
      citation: "NYTD — youth-reported homelessness antecedents",
      sourceUrl: "https://www.acf.hhs.gov/cb/data-research/nytd",
    });
  }
  if (c.justiceContact) {
    factors.push({
      id: "justice-crossover",
      label: "Crossover with juvenile-justice system",
      points: 15,
      citation: "Vera Institute — Crossover Youth Practice Model",
      sourceUrl: "https://www.vera.org/publications/crossover-youth-practice-model",
    });
  }
  if (c.mentalHealthDx && !c.mhInTreatment) {
    factors.push({
      id: "untreated-mh",
      label: "Mental-health diagnosis without active treatment provider",
      points: 10,
      citation: "AAP/Casey — Healthcare Issues for Children in Foster Care",
      sourceUrl: "https://publications.aap.org/pediatrics/article/136/4/e1131/33902/Health-Care-Issues-for-Children-and-Adolescents-in",
    });
  }
  if (c.permanentConnectionAdult === false) {
    factors.push({
      id: "no-permanent-connection",
      label: "No identified lifelong connection adult",
      points: 10,
      citation: "Midwest Study — connection as outcome predictor",
      sourceUrl: "https://www.chapinhall.org/research/midwest-evaluation-of-the-adult-functioning-of-former-foster-youth/",
    });
  }
  if (c.siblingsSeparated) {
    factors.push({
      id: "sibling-separation",
      label: "Separated from siblings in care",
      points: 5,
      citation: "Casey — sibling placement research",
      sourceUrl: "https://www.casey.org/",
    });
  }
  if ((c.ageAtFirstRemoval ?? 0) >= 12) {
    factors.push({
      id: "late-entry",
      label: `Late entry to care (age ${c.ageAtFirstRemoval}+)`,
      points: 5,
      citation: "Children's Bureau — late-entry teen outcomes",
      sourceUrl: "https://www.acf.hhs.gov/cb",
    });
  }
  if (c.pregnantOrParenting) {
    factors.push({
      id: "pregnant-parenting",
      label: "Pregnant or parenting in care",
      points: 10,
      citation: "Center for the Study of Social Policy — expecting & parenting youth",
      sourceUrl: "https://cssp.org/our-work/projects/expecting-parenting-youth-in-foster-care/",
    });
  }
  if (c.lgbtqPlus) {
    factors.push({
      id: "lgbtq",
      label: "LGBTQ+ self-disclosed (system-response signal, not deficit)",
      points: 5,
      citation: "True Colors United — LGBTQ youth homelessness",
      sourceUrl: "https://truecolorsunited.org/our-issue/",
    });
  }
  if (c.hasIep && c.pregEducDocsComplete === false) {
    factors.push({
      id: "iep-doc-gap",
      label: "IEP active but transition documents incomplete",
      points: 5,
      citation: "IDEA §300.43 transition-services requirement",
      sourceUrl: "https://sites.ed.gov/idea/regs/b/a/300.43",
    });
  }

  const score = factors.reduce((s, f) => s + f.points, 0);
  let tier: RiskTier = "stable";
  if (score >= 60) tier = "critical";
  else if (score >= 40) tier = "elevated";
  else if (score >= 20) tier = "watch";

  return { score, tier, factors };
}

// Stakeholders who should be looped in by tier — ISS-style coordinated care.
export function recommendedStakeholders(tier: RiskTier): string[] {
  const base = ["Caseworker", "Foster parent / placement", "School counselor"];
  if (tier === "stable") return [...base, "ILP coordinator (yearly check)"];
  if (tier === "watch") return [...base, "ILP coordinator", "Healthcare PCP"];
  if (tier === "elevated") return [...base, "ILP coordinator", "Healthcare PCP", "Mental-health clinician", "CASA / GAL", "Court (next hearing)"];
  return [...base, "ILP coordinator", "Healthcare PCP", "Mental-health clinician", "CASA / GAL", "Court (emergency review)", "PHA (FYI voucher pre-screen)", "Education advocate"];
}
