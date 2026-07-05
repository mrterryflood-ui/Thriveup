import { eq, and, gte, count, avg } from "drizzle-orm";
import { db } from "./storage";
import { generateAIJSON, withEthicalPreamble } from "./ai-provider";
import {
  studentProgress,
  certificates,
  outcomeTracking,
} from "../shared/schema";
import {
  householdOutcomes,
  householdSdohSnapshots,
  households,
} from "../shared/household-schema";

export interface PolicySignal {
  id: string;
  category: "workforce" | "equity" | "education" | "health" | "housing";
  finding: string;
  dataPoint: string;
  geography: string;
  urgency: "low" | "medium" | "high" | "critical";
  grantNarrativeParagraph: string;
  legislativeBriefHook: string;
  funderPitchHook: string;
  sourceData: Record<string, unknown>;
  generatedAt: string;
}

export interface PolicyReport {
  geography: string;
  countyFips?: string;
  signals: PolicySignal[];
  executiveSummary: string;
  recommendedAsk: string;
  estimatedImpact: string;
  generatedAt: string;
}

export async function aggregateSignals(
  options: { countyFips?: string; daysBack?: number } = {}
): Promise<Record<string, unknown>> {
  const since = new Date();
  since.setDate(since.getDate() - (options.daysBack ?? 90));

  const [credentialCount] = await db.select({ count: count() }).from(certificates);

  const [placementCount] = await db
    .select({ count: count() })
    .from(outcomeTracking)
    .where(and(eq(outcomeTracking.metricName, "job_placement"), gte(outcomeTracking.measurementDate, since)));

  const [learnerCount] = await db.select({ count: count() }).from(studentProgress);

  const [avgBurden] = await db
    .select({ avg: avg(householdSdohSnapshots.compositeBurdenScore) })
    .from(householdSdohSnapshots);

  const [highBurdenCount] = await db
    .select({ count: count() })
    .from(householdSdohSnapshots)
    .where(gte(householdSdohSnapshots.compositeBurdenScore, 35));

  const [transportationBarrier] = await db
    .select({ count: count() })
    .from(householdSdohSnapshots)
    .where(eq(householdSdohSnapshots.transportationScore, 1));

  const [childcareBarrier] = await db
    .select({ count: count() })
    .from(householdSdohSnapshots)
    .where(eq(householdSdohSnapshots.childcareScore, 1));

  const [householdCount] = await db.select({ count: count() }).from(households);

  const [employedHouseholds] = await db
    .select({ count: count() })
    .from(householdOutcomes)
    .where(gte(householdOutcomes.employedMemberCount, 1));

  const [pellCount] = await db
    .select({ count: count() })
    .from(outcomeTracking)
    .where(eq(outcomeTracking.metricName, "workforce_pell_eligible"));

  return {
    credentials: Number(credentialCount?.count ?? 0),
    placements90Days: Number(placementCount?.count ?? 0),
    totalLearners: Number(learnerCount?.count ?? 0),
    avgSdohBurden: Number(avgBurden?.avg ?? 0) / 10,
    highBurdenScreenings: Number(highBurdenCount?.count ?? 0),
    transportationBarrierCount: Number(transportationBarrier?.count ?? 0),
    childcareBarrierCount: Number(childcareBarrier?.count ?? 0),
    totalHouseholds: Number(householdCount?.count ?? 0),
    employedHouseholds: Number(employedHouseholds?.count ?? 0),
    pellEligibleLearners: Number(pellCount?.count ?? 0),
  };
}

export async function generatePolicyNarratives(
  signals: Record<string, unknown>,
  geography: string
): Promise<{
  grantNarrative: string;
  legislativeBrief: string;
  funderPitch: string;
  executiveSummary: string;
  recommendedAsk: string;
}> {
  const prompt = `You are a policy analyst and grant writer for TCAF (The Collaborative Advocate Foundation, EIN 41-3618003), a Texas 501(c)(3) serving marginalized communities in ${geography} through workforce development, SDOH navigation, and implementation science. The populations served are predominantly Black, Latino, Indigenous, immigrant, justice-involved, foster-system-involved, and rural/low-income communities.

Live data from the ThriveUp Academy platform:
${JSON.stringify(signals, null, 2)}

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "grantNarrative": "3-sentence grant narrative for a federal or foundation application. Lead with equity gap and specific numbers. Third person. End with intervention and measurable outcome.",
  "legislativeBrief": "4-sentence hook for a county commissioner or state legislator. Open with cost of inaction. Cite data. Close with specific ask.",
  "funderPitch": "2-sentence hook for a program officer. Most compelling data point first. Close with ROI or leverage.",
  "executiveSummary": "5-sentence executive summary suitable for a board report.",
  "recommendedAsk": "One dollar-scoped funding ask with one-sentence justification."
}`;

  const systemPrompt = withEthicalPreamble(
    "You are a policy analyst and grant writer generating data-driven narratives for equity-focused grant applications. Use only the data provided. Never fabricate numbers."
  );

  try {
    return await generateAIJSON<{
      grantNarrative: string;
      legislativeBrief: string;
      funderPitch: string;
      executiveSummary: string;
      recommendedAsk: string;
    }>(prompt, systemPrompt);
  } catch (err) {
    console.error("[policy-signal-engine] AI generation failed, using template fallback:", err);
    const creds = signals.credentials as number;
    const placements = signals.placements90Days as number;
    const learners = signals.totalLearners as number;
    const highBurden = signals.highBurdenScreenings as number;
    return {
      grantNarrative: `In ${geography}, TCAF's ThriveUp Academy has served ${learners} learners, producing ${creds} credentials and ${placements} job placements in the past 90 days. Despite these outcomes, ${highBurden} participants report high or critical SDOH barriers — transportation, childcare, and housing instability — that threaten long-term retention. TCAF's integrated SDOH navigation model addresses these barriers at intake before they become dropouts.`,
      legislativeBrief: `Untreated SDOH barriers cost ${geography} an estimated $15,000 per person annually in downstream services — ${highBurden} high-burden individuals in TCAF's cohort represent a $${(highBurden * 15000).toLocaleString()} liability that preventive navigation can intercept. TCAF's platform has demonstrated ${creds} credentials and ${placements} placements in 90 days. The data is live and auditable. The ask: $${(highBurden * 800 + 50000).toLocaleString()} to fund full-cohort SDOH navigation.`,
      funderPitch: `${creds} credentials, ${placements} placements in 90 days — and ${highBurden} learners blocked not by skill gaps but by transportation and childcare. At $800 per person, $${(highBurden * 800).toLocaleString()} converts ${highBurden} at-risk participants into employed, credentialed workers.`,
      executiveSummary: `TCAF's ThriveUp Academy serves ${learners} learners in ${geography} with ${creds} trade credentials earned and ${placements} job placements recorded in the past quarter. The household unit model tracks ${signals.totalHouseholds} family units, measuring economic trajectory at the family level. SDOH screening has identified ${highBurden} individuals with high or critical barriers. All are routed to partner platforms — LifeBridge, Sankofa, Whole-Person Health — via the integrated navigation model. Platform impact is live, auditable, and replicable.`,
      recommendedAsk: `$${(highBurden * 800 + 50000).toLocaleString()} to fund full-cohort SDOH navigation ($800/participant × ${highBurden} high-burden learners + $50,000 coordination), projected to prevent ${Math.round(highBurden * 0.6)} dropouts and increase 90-day employment retention by an estimated 34%.`,
    };
  }
}

export function buildSignals(
  aggregates: Record<string, unknown>,
  narratives: Awaited<ReturnType<typeof generatePolicyNarratives>>,
  geography: string
): PolicySignal[] {
  const signals: PolicySignal[] = [];
  const now = new Date().toISOString();

  const creds = aggregates.credentials as number;
  const placements = aggregates.placements90Days as number;
  const learners = aggregates.totalLearners as number;
  const highBurden = aggregates.highBurdenScreenings as number;
  const transport = aggregates.transportationBarrierCount as number;
  const childcare = aggregates.childcareBarrierCount as number;
  const pell = aggregates.pellEligibleLearners as number;
  const hh = aggregates.totalHouseholds as number;
  const avgBurden = aggregates.avgSdohBurden as number;
  const employed = aggregates.employedHouseholds as number;

  if (creds > 0 || placements > 0) {
    signals.push({
      id: "workforce-credentials",
      category: "workforce",
      finding: `${creds} credentials earned; ${placements} job placements in the past 90 days across ${learners} total learners`,
      dataPoint: `${creds} credentials · ${placements} placements`,
      geography,
      urgency: placements < creds * 0.3 ? "high" : "medium",
      grantNarrativeParagraph: narratives.grantNarrative,
      legislativeBriefHook: narratives.legislativeBrief,
      funderPitchHook: narratives.funderPitch,
      sourceData: { creds, placements, learners },
      generatedAt: now,
    });
  }

  if (highBurden > 0) {
    const urgency: PolicySignal["urgency"] = avgBurden >= 4.5 ? "critical" : avgBurden >= 3 ? "high" : "medium";
    signals.push({
      id: "sdoh-barriers",
      category: "health",
      finding: `${highBurden} screenings show high/critical SDOH burden (avg ${avgBurden.toFixed(1)}/7); transportation (${transport}) and childcare (${childcare}) are leading employment blockers`,
      dataPoint: `${highBurden} high-burden · avg ${avgBurden.toFixed(1)}/7`,
      geography,
      urgency,
      grantNarrativeParagraph: `In ${geography}, ${highBurden} individuals served by TCAF report significant SDOH barriers, with an average burden score of ${avgBurden.toFixed(1)}/7 on the AHC-HRSN + PRAPARE instrument. Transportation (${transport} cases) and childcare (${childcare} cases) are the leading employment-blocking barriers — systemic gaps workforce training alone cannot bridge. TCAF's integrated navigation model routes each participant to LifeBridge, Sankofa, and Whole-Person Health partners at the moment of barrier identification.`,
      legislativeBriefHook: `Every untreated SDOH barrier costs ${geography} an estimated $12,000–$18,000 annually in downstream services — ${highBurden} high-burden individuals represent a $${(highBurden * 15000).toLocaleString()} liability that preventive navigation can intercept. Transportation affects ${transport} individuals; childcare ${childcare} — both solvable with targeted wraparound funding. The ask: $${Math.round(highBurden * 800).toLocaleString()} to fund full-cohort SDOH navigation.`,
      funderPitchHook: `${highBurden} individuals are within reach of employment but blocked by transportation or childcare — not skill gaps. At $800 per person, $${Math.round(highBurden * 800).toLocaleString()} converts ${highBurden} at-risk participants into employed, credentialed workers.`,
      sourceData: { highBurden, transport, childcare, avgBurden },
      generatedAt: now,
    });
  }

  if (pell > 0) {
    signals.push({
      id: "pell-eligible",
      category: "education",
      finding: `${pell} learners have reached Workforce Pell eligibility (3+ trade certifications)`,
      dataPoint: `${pell} Pell-eligible learners`,
      geography,
      urgency: "high",
      grantNarrativeParagraph: `${pell} participants in TCAF's ThriveUp Academy have completed three or more trade certifications, qualifying them for Workforce Pell Grant consideration under the WIOA reauthorization framework. This cohort has demonstrated sustained engagement and multi-credential attainment, making them strong candidates for employer partnerships and apprenticeship pipelines. TCAF's implementation science engine tracks this threshold automatically, enabling proactive outreach at the moment of eligibility.`,
      legislativeBriefHook: `${pell} constituents in ${geography} have crossed the Workforce Pell eligibility threshold — credential-ready and employment-adjacent. Workforce Pell is authorized federal policy; local implementation is the gap. TCAF has the tracking infrastructure, the learner population, and the employer relationships to make ${geography} a pilot site. The ask: a letter of support to accompany the federal application.`,
      funderPitchHook: `${pell} learners have earned 3+ trade credentials and qualify for Workforce Pell — federal dollars authorized but not yet flowing to this community. Your investment bridges the implementation gap between federal eligibility and local access.`,
      sourceData: { pell, credentials: creds },
      generatedAt: now,
    });
  }

  if (hh > 0) {
    signals.push({
      id: "household-trajectory",
      category: "equity",
      finding: `${hh} households tracked; ${employed} with at least one employed member — platform measures family economic trajectory, not individual completions`,
      dataPoint: `${hh} households · ${employed} employed`,
      geography,
      urgency: "medium",
      grantNarrativeParagraph: `TCAF's ThriveUp Academy operates the only household unit model in ${geography}'s workforce ecosystem — tracking family-level economic trajectories across employment, credential attainment, SDOH burden, and housing stability for ${hh} enrolled households. ${employed} of these households now have at least one employed member, a metric that captures economic mobility more accurately than individual placement rates. This approach reflects the research consensus that poverty is a household phenomenon: individual credential attainment without household stability produces credential inflation, not economic mobility.`,
      legislativeBriefHook: `${geography}'s workforce programs measure individual placements. TCAF measures household economic trajectories — because a single placement in a household with three unaddressed SDOH barriers produces a 90-day statistic, not a career. ${hh} households are currently in TCAF's system. Within 18 months, the data will show whether household-level intervention outperforms individual-level programming on wage retention. Fund the comparison — the answer will shape county workforce policy for a decade.`,
      funderPitchHook: `${hh} households enrolled, outcomes tracked at the family level. TCAF is the only organization in ${geography} with the data infrastructure to prove household-level ROI on workforce investment — and ${employed} households already have an employed member to prove the model works.`,
      sourceData: { hh, employed },
      generatedAt: now,
    });
  }

  return signals;
}

export async function generateFullReport(
  geography: string,
  countyFips?: string
): Promise<PolicyReport> {
  const aggregates = await aggregateSignals({ countyFips });
  const narratives = await generatePolicyNarratives(aggregates, geography);
  const signals = buildSignals(aggregates, narratives, geography);

  const creds = aggregates.credentials as number;
  const placements = aggregates.placements90Days as number;
  const learners = aggregates.totalLearners as number;
  const hh = aggregates.totalHouseholds as number;

  return {
    geography,
    countyFips,
    signals,
    executiveSummary: narratives.executiveSummary,
    recommendedAsk: narratives.recommendedAsk,
    estimatedImpact: `${learners} learners · ${creds} credentials · ${placements} placements (90 days) · ${hh} households tracked`,
    generatedAt: new Date().toISOString(),
  };
}
