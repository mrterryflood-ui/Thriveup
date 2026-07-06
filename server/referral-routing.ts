export interface ReferralRecommendation {
  domain: string;
  urgency: "immediate" | "within_week" | "within_month" | "routine";
  resourceName: string;
  resourceType: string;
  contactInfo: string;
  url?: string;
  eligibilityNote?: string;
}

const DOMAIN_RESOURCES: Record<string, ReferralRecommendation[]> = {
  mental_health: [
    {
      domain: "mental_health", urgency: "immediate",
      resourceName: "988 Suicide & Crisis Lifeline",
      resourceType: "Crisis intervention",
      contactInfo: "Call or text 988",
      url: "https://988lifeline.org",
    },
    {
      domain: "mental_health", urgency: "within_week",
      resourceName: "CommUnity Care FQHCs",
      resourceType: "Federally Qualified Health Center — behavioral health",
      contactInfo: "512-978-9015 | communitycaretx.org",
      url: "https://communitycaretx.org",
      eligibilityNote: "Sliding scale fees. Medicaid, uninsured accepted.",
    },
    {
      domain: "mental_health", urgency: "within_week",
      resourceName: "Integral Care (Austin Travis County MHMR)",
      resourceType: "County mental health authority",
      contactInfo: "512-472-4357 | integralcare.org",
      url: "https://integralcare.org",
      eligibilityNote: "Priority access for justice-involved individuals.",
    },
  ],
  substance_use: [
    {
      domain: "substance_use", urgency: "within_week",
      resourceName: "Austin Recovery (ATCIC)",
      resourceType: "Substance use treatment",
      contactInfo: "512-776-2704 | atcic.net",
      url: "https://atcic.net",
      eligibilityNote: "Medicaid accepted. Justice-involved individuals welcome.",
    },
    {
      domain: "substance_use", urgency: "routine",
      resourceName: "AA/NA Central Texas Intergroup",
      resourceType: "Peer support — recovery",
      contactInfo: "512-444-0071 | austinaa.org",
      url: "https://austinaa.org",
    },
  ],
  housing: [
    {
      domain: "housing", urgency: "immediate",
      resourceName: "LifeBridge Housing Services",
      resourceType: "Emergency and transitional housing navigation",
      contactInfo: "Via ThriveUp Navigator | lifebridge.org",
      url: "https://lifebridge.org",
    },
    {
      domain: "housing", urgency: "within_week",
      resourceName: "Foundation Communities",
      resourceType: "Affordable housing — reentry-friendly",
      contactInfo: "512-447-2026 | foundcom.org",
      url: "https://foundcom.org",
      eligibilityNote: "Background check policies vary by property. Ask about reentry units.",
    },
    {
      domain: "housing", urgency: "routine",
      resourceName: "Austin Housing Authority (Section 8)",
      resourceType: "Housing Choice Voucher",
      contactInfo: "512-477-4488 | hacanline.org",
      url: "https://hacanline.org",
      eligibilityNote: "Waitlist may be closed. Check hacanline.org for current status.",
    },
  ],
  education_employment: [
    {
      domain: "education_employment", urgency: "within_week",
      resourceName: "ThriveUp Academy Trade Sims",
      resourceType: "Workforce training — credentialing",
      contactInfo: "Available on this platform",
      url: "/academy/trade-sims",
    },
    {
      domain: "education_employment", urgency: "within_week",
      resourceName: "Austin Community College — Continuing Education",
      resourceType: "GED, vocational training",
      contactInfo: "512-223-7000 | austincc.edu/ce",
      url: "https://austincc.edu/ce",
      eligibilityNote: "GED prep free for eligible adults. Workforce programs WIOA-fundable.",
    },
    {
      domain: "education_employment", urgency: "routine",
      resourceName: "Workforce Solutions Capital Area",
      resourceType: "WIOA-funded employment services",
      contactInfo: "512-597-7100 | workforcesolutionscapitalarea.com",
      url: "https://workforcesolutionscapitalarea.com",
    },
  ],
  family_social: [
    {
      domain: "family_social", urgency: "within_month",
      resourceName: "The Collaborative Advocate Foundation (TCAF)",
      resourceType: "Mentorship, legal aid, advocacy",
      contactInfo: "terryflood@thrivingcommunitiesforall.com",
    },
    {
      domain: "family_social", urgency: "within_month",
      resourceName: "Austin Community Court",
      resourceType: "Restorative justice, family mediation",
      contactInfo: "512-974-4600",
    },
  ],
  criminal_history: [
    {
      domain: "criminal_history", urgency: "within_month",
      resourceName: "Texas RioGrande Legal Aid — Record Sealing",
      resourceType: "Expungement and nondisclosure legal services",
      contactInfo: "956-996-8752 | trla.org",
      url: "https://trla.org",
      eligibilityNote: "Free services for income-eligible individuals. Check eligibility at trla.org.",
    },
    {
      domain: "criminal_history", urgency: "within_month",
      resourceName: "Lone Star Justice Alliance",
      resourceType: "Reentry legal services",
      contactInfo: "info@lsjalliance.org | lsjalliance.org",
      url: "https://lsjalliance.org",
    },
  ],
  antisocial_cognition: [
    {
      domain: "antisocial_cognition", urgency: "within_week",
      resourceName: "Thinking for a Change (T4C)",
      resourceType: "Cognitive behavioral intervention — group format",
      contactInfo: "Refer to case manager for enrollment",
      eligibilityNote: "Evidence-based CBT program developed by NIC. Often available through probation/parole.",
    },
  ],
  leisure_recreation: [
    {
      domain: "leisure_recreation", urgency: "routine",
      resourceName: "Austin Parks & Recreation — Community Centers",
      resourceType: "Structured recreation, fitness",
      contactInfo: "512-974-6700 | austintexas.gov/department/parks-and-recreation",
      url: "https://austintexas.gov/department/parks-and-recreation",
    },
  ],
};

const CRISIS_REFERRALS: ReferralRecommendation[] = [
  {
    domain: "crisis", urgency: "immediate",
    resourceName: "988 Suicide & Crisis Lifeline",
    resourceType: "Crisis intervention",
    contactInfo: "Call or text 988 — 24/7",
    url: "https://988lifeline.org",
  },
  {
    domain: "crisis", urgency: "immediate",
    resourceName: "SafeReport Crisis Support",
    resourceType: "Platform safety resource",
    contactInfo: "Available via SafeReport on this platform",
    url: "/safe-report",
  },
];

export function generateReferrals(params: {
  rnrResult?: { flaggedDomains: string[]; needsIntervention: string[] };
  phq9Result?: { suicidalIdeation: boolean; severity: string; requiresImmediateFollowup: boolean };
  pcl5Result?: { ptsdIndicator: boolean };
}): {
  referrals: ReferralRecommendation[];
  requiresImmediateIntervention: boolean;
  requiresClinicalFollowup: boolean;
} {
  const referrals: ReferralRecommendation[] = [];
  let requiresImmediateIntervention = false;
  let requiresClinicalFollowup = false;

  if (params.phq9Result?.suicidalIdeation) {
    referrals.push(...CRISIS_REFERRALS);
    requiresImmediateIntervention = true;
  }

  if (params.phq9Result?.requiresImmediateFollowup) {
    referrals.push(...(DOMAIN_RESOURCES["mental_health"] ?? []).filter(r => r.urgency !== "immediate"));
    requiresClinicalFollowup = true;
  }

  if (params.pcl5Result?.ptsdIndicator) {
    const traumaRef = DOMAIN_RESOURCES["mental_health"]?.find(r =>
      r.resourceName.includes("CommUnity") || r.resourceName.includes("Integral")
    );
    if (traumaRef) referrals.push({ ...traumaRef, urgency: "within_week" });
    requiresClinicalFollowup = true;
  }

  for (const domain of params.rnrResult?.needsIntervention ?? []) {
    const resources = DOMAIN_RESOURCES[domain] ?? [];
    const topResource = resources.find(r => r.urgency === "within_week" || r.urgency === "within_month");
    if (topResource) referrals.push(topResource);
  }

  for (const domain of params.rnrResult?.flaggedDomains ?? []) {
    if (params.rnrResult?.needsIntervention.includes(domain)) continue;
    const resources = DOMAIN_RESOURCES[domain] ?? [];
    const routineResource = resources.find(r => r.urgency === "routine" || r.urgency === "within_month");
    if (routineResource) referrals.push(routineResource);
  }

  const seen = new Set<string>();
  const dedupedReferrals = referrals.filter(r => {
    if (seen.has(r.resourceName)) return false;
    seen.add(r.resourceName);
    return true;
  });

  return { referrals: dedupedReferrals, requiresImmediateIntervention, requiresClinicalFollowup };
}
