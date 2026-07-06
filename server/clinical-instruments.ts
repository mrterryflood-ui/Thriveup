export interface RnrItem {
  id: string;
  domain: string;
  question: string;
  weight: number;
  scoring: "binary" | "scale3" | "scale5";
  reverseScored?: boolean;
}

export const RNR_ITEMS: RnrItem[] = [
  { id: "ch1", domain: "criminal_history", weight: 2, scoring: "binary",
    question: "Have you ever been convicted of a felony?" },
  { id: "ch2", domain: "criminal_history", weight: 2, scoring: "binary",
    question: "Have you had 2 or more prior convictions (felony or misdemeanor)?" },
  { id: "ch3", domain: "criminal_history", weight: 2, scoring: "binary",
    question: "Have you previously been on probation or parole?" },
  { id: "ch4", domain: "criminal_history", weight: 2, scoring: "binary",
    question: "Have you ever had a probation or parole revocation?" },
  { id: "ch5", domain: "criminal_history", weight: 2, scoring: "binary",
    question: "Were you under 18 at the time of your first arrest?" },
  { id: "ee1", domain: "education_employment", weight: 2, scoring: "binary",
    question: "Do you currently lack a high school diploma or GED?" },
  { id: "ee2", domain: "education_employment", weight: 2, scoring: "binary",
    question: "Were you unemployed for most of the 12 months before your last incarceration?" },
  { id: "ee3", domain: "education_employment", weight: 2, scoring: "binary",
    question: "Have you had 3 or more jobs in the past 2 years (not by choice)?" },
  { id: "ee4", domain: "education_employment", weight: 2, scoring: "binary",
    question: "Do you currently have no employment plans or prospects?" },
  { id: "fs1", domain: "family_social", weight: 2, scoring: "binary",
    question: "Are most of your close friends or family members currently involved in criminal activity?" },
  { id: "fs2", domain: "family_social", weight: 2, scoring: "binary",
    question: "Do you feel isolated from positive social support?" },
  { id: "fs3", domain: "family_social", weight: 2, scoring: "binary",
    question: "Have you experienced significant conflict in close relationships in the past year?" },
  { id: "su1", domain: "substance_use", weight: 2, scoring: "binary",
    question: "Have you used alcohol or drugs problematically in the past 12 months?" },
  { id: "su2", domain: "substance_use", weight: 2, scoring: "binary",
    question: "Has substance use ever contributed to your involvement with the law?" },
  { id: "su3", domain: "substance_use", weight: 2, scoring: "binary",
    question: "Have you ever been in substance use treatment?" },
  { id: "su4", domain: "substance_use", weight: 2, scoring: "binary",
    question: "Do you feel that substance use is currently a problem for you?" },
  { id: "hs1", domain: "housing", weight: 2, scoring: "binary",
    question: "Do you lack stable, safe housing currently?" },
  { id: "hs2", domain: "housing", weight: 2, scoring: "binary",
    question: "Have you experienced homelessness in the past 2 years?" },
  { id: "mh1", domain: "mental_health", weight: 2, scoring: "binary",
    question: "Have you ever been diagnosed with a mental health condition?" },
  { id: "mh2", domain: "mental_health", weight: 2, scoring: "binary",
    question: "Are you currently experiencing mental health symptoms that interfere with daily life?" },
  { id: "aa1", domain: "antisocial_cognition", weight: 2, scoring: "binary",
    question: "Do you believe that rules and laws are generally unfair or don't apply to you?" },
  { id: "aa2", domain: "antisocial_cognition", weight: 2, scoring: "binary",
    question: "Do you frequently feel that others are to blame for problems in your life?" },
  { id: "aa3", domain: "antisocial_cognition", weight: 2, scoring: "binary",
    question: "Do you have difficulty controlling anger or impulsive reactions?" },
  { id: "lr1", domain: "leisure_recreation", weight: 2, scoring: "binary",
    question: "Do you have few or no structured positive leisure activities?" },
  { id: "lr2", domain: "leisure_recreation", weight: 2, scoring: "binary",
    question: "Do you spend most of your free time with people who engage in antisocial behavior?" },
];

export interface RnrResult {
  totalScore: number;
  riskLevel: "low" | "moderate" | "high" | "very_high";
  domainScores: Record<string, number>;
  flaggedDomains: string[];
  needsIntervention: string[];
  recommendFullLsiR: boolean;
  interpretationNote: string;
}

const DOMAIN_MAXES: Record<string, number> = {
  criminal_history: 10, education_employment: 8, family_social: 6,
  substance_use: 8, housing: 4, mental_health: 4,
  antisocial_cognition: 6, leisure_recreation: 4,
};

export function scoreRnr(responses: Record<string, boolean>): RnrResult {
  const domainScores: Record<string, number> = {};
  let totalScore = 0;

  for (const item of RNR_ITEMS) {
    const answered = responses[item.id] === true;
    const points = answered ? item.weight : 0;
    domainScores[item.domain] = (domainScores[item.domain] ?? 0) + points;
    totalScore += points;
  }

  const riskLevel =
    totalScore >= 30 ? "very_high" :
    totalScore >= 20 ? "high" :
    totalScore >= 10 ? "moderate" : "low";

  const flaggedDomains = Object.entries(domainScores)
    .filter(([domain, score]) => score > (DOMAIN_MAXES[domain] ?? 4) * 0.5)
    .map(([domain]) => domain);

  const needsIntervention = Object.entries(domainScores)
    .filter(([domain, score]) => score > (DOMAIN_MAXES[domain] ?? 4) * 0.75)
    .map(([domain]) => domain);

  return {
    totalScore,
    riskLevel,
    domainScores,
    flaggedDomains,
    needsIntervention,
    recommendFullLsiR: totalScore >= 20,
    interpretationNote: totalScore >= 20
      ? "Score indicates moderate-high risk. A full LSI-R or ORAS assessment by a licensed clinician is recommended before program planning."
      : "Score indicates lower risk level. Proceed with standard program planning and quarterly check-ins.",
  };
}

export const PHQ9_ITEMS = [
  { id: "phq1", question: "Little interest or pleasure in doing things" },
  { id: "phq2", question: "Feeling down, depressed, or hopeless" },
  { id: "phq3", question: "Trouble falling or staying asleep, or sleeping too much" },
  { id: "phq4", question: "Feeling tired or having little energy" },
  { id: "phq5", question: "Poor appetite or overeating" },
  { id: "phq6", question: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down" },
  { id: "phq7", question: "Trouble concentrating on things, such as reading the newspaper or watching television" },
  { id: "phq8", question: "Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual" },
  { id: "phq9", question: "Thoughts that you would be better off dead, or of hurting yourself in some way" },
];

export interface Phq9Result {
  totalScore: number;
  severity: "minimal" | "mild" | "moderate" | "moderately_severe" | "severe";
  suicidalIdeation: boolean;
  requiresImmediateFollowup: boolean;
  clinicalNote: string;
}

export function scorePhq9(responses: Record<string, number>): Phq9Result {
  const totalScore = PHQ9_ITEMS.reduce((sum, item) => sum + (responses[item.id] ?? 0), 0);
  const suicidalIdeation = (responses["phq9"] ?? 0) > 0;

  const severity =
    totalScore >= 20 ? "severe" :
    totalScore >= 15 ? "moderately_severe" :
    totalScore >= 10 ? "moderate" :
    totalScore >= 5 ? "mild" : "minimal";

  return {
    totalScore,
    severity,
    suicidalIdeation,
    requiresImmediateFollowup: suicidalIdeation || totalScore >= 15,
    clinicalNote: suicidalIdeation
      ? "IMMEDIATE FOLLOW-UP REQUIRED: Item 9 indicates suicidal ideation. Refer to crisis services immediately. Do not leave the individual alone."
      : totalScore >= 15
      ? "Moderately severe to severe depression indicated. Refer to mental health services. Medication evaluation may be warranted."
      : totalScore >= 10
      ? "Moderate depression indicated. Consider referral to counseling or behavioral health."
      : "Screen complete. Monitor and re-screen in 30 days if concerns persist.",
  };
}

export const PCL5_ITEMS = [
  { id: "pcl1", cluster: "B", question: "Repeated, disturbing, and unwanted memories of a stressful experience from the past?" },
  { id: "pcl2", cluster: "B", question: "Repeated, disturbing dreams of a stressful experience?" },
  { id: "pcl3", cluster: "B", question: "Suddenly feeling or acting as if the experience was actually happening again (as if you were actually back there reliving it)?" },
  { id: "pcl4", cluster: "B", question: "Feeling very upset when something reminded you of the experience?" },
  { id: "pcl5", cluster: "B", question: "Having strong physical reactions when something reminded you of the experience (heart pounding, trouble breathing, sweating)?" },
  { id: "pcl6", cluster: "C", question: "Avoiding memories, thoughts, or feelings related to a stressful experience?" },
  { id: "pcl7", cluster: "C", question: "Avoiding external reminders of a stressful experience (people, places, conversations, activities, objects, or situations)?" },
  { id: "pcl8", cluster: "D", question: "Trouble remembering important parts of a stressful experience?" },
  { id: "pcl9", cluster: "D", question: "Having strong negative beliefs about yourself, other people, or the world?" },
  { id: "pcl10", cluster: "D", question: "Blaming yourself or someone else for the stressful experience or what happened after it?" },
  { id: "pcl11", cluster: "D", question: "Having strong negative feelings such as fear, horror, anger, guilt, or shame?" },
  { id: "pcl12", cluster: "D", question: "Loss of interest in activities that you used to enjoy?" },
  { id: "pcl13", cluster: "D", question: "Feeling distant or cut off from other people?" },
  { id: "pcl14", cluster: "D", question: "Trouble experiencing positive feelings (for example, being unable to feel happiness or love toward people close to you)?" },
  { id: "pcl15", cluster: "E", question: "Irritable behavior, angry outbursts, or acting aggressively?" },
  { id: "pcl16", cluster: "E", question: "Taking too many risks or doing things that could cause you harm?" },
  { id: "pcl17", cluster: "E", question: "Being 'superalert' or watchful or on guard?" },
  { id: "pcl18", cluster: "E", question: "Feeling jumpy or easily startled?" },
  { id: "pcl19", cluster: "E", question: "Having difficulty concentrating?" },
  { id: "pcl20", cluster: "E", question: "Trouble falling or staying asleep?" },
];

export interface Pcl5Result {
  totalScore: number;
  ptsdIndicator: boolean;
  clusterScores: { B: number; C: number; D: number; E: number };
  dominantCluster: string;
  clinicalNote: string;
}

export function scorePcl5(responses: Record<string, number>): Pcl5Result {
  const clusterScores = { B: 0, C: 0, D: 0, E: 0 };
  let totalScore = 0;

  for (const item of PCL5_ITEMS) {
    const val = responses[item.id] ?? 0;
    clusterScores[item.cluster as keyof typeof clusterScores] += val;
    totalScore += val;
  }

  const ptsdIndicator = totalScore >= 33;
  const dominantCluster = Object.entries(clusterScores)
    .sort(([,a],[,b]) => b - a)[0][0];

  const clusterLabels: Record<string, string> = {
    B: "intrusive memories and re-experiencing",
    C: "avoidance of trauma reminders",
    D: "negative thoughts and mood changes",
    E: "hyperarousal and reactivity",
  };

  return {
    totalScore,
    ptsdIndicator,
    clusterScores,
    dominantCluster,
    clinicalNote: ptsdIndicator
      ? `PCL-5 score (${totalScore}/80) meets provisional PTSD threshold. Primary symptoms cluster around ${clusterLabels[dominantCluster]}. Refer to trauma-informed therapist or VA mental health services.`
      : `PCL-5 score (${totalScore}/80) below PTSD threshold. Trauma-informed care approach still recommended. Re-screen in 60 days.`,
  };
}
