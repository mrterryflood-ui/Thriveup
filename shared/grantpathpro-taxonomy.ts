export const MANOR_FUNDING_PACKAGE_PROFILE_KEY = "manor-tx-city" as const;
export const MANOR_FUNDING_PACKAGE_TAXONOMY_VERSION = "manor-four-package-v1" as const;

export type ManorFundingPackage = {
  key: string;
  label: string;
  purpose: string;
  candidateComponents: string[];
  keepSeparateOrFlag: string[];
  verificationChecklist: string[];
};

export const MANOR_FUNDING_PACKAGES: ManorFundingPackage[] = [
  {
    key: "water_infrastructure",
    label: "Water and wastewater infrastructure",
    purpose: "Utilities that enable developable land, housing, childcare, education, commercial services, and community facilities.",
    candidateComponents: [
      "Water distribution and capacity",
      "Wastewater collection and treatment",
      "Underground utility extensions",
      "Utility work that enables documented affordable or missing-middle housing",
    ],
    keepSeparateOrFlag: [
      "Private commercial construction and developer-only improvements",
      "Unverified capacity, demand, service-area, or cost claims",
    ],
    verificationChecklist: [
      "Service-area map and utility ownership",
      "Preliminary engineering report and cost estimate",
      "Capacity and demand documentation",
      "Environmental, easement, match, and reimbursement requirements",
      "Beneficiary and income analysis where housing or disadvantaged-community claims are made",
    ],
  },
  {
    key: "lake_flood_drought_resilience",
    label: "Lake, flood, and drought resilience",
    purpose: "Water-management, flood-resilience, drought-resilience, emergency-water, and public-safety components of the proposed lake or water feature.",
    candidateComponents: [
      "Floodplain and watershed mitigation",
      "Water-supply or drought-resilience components",
      "Dam, dredging, and water-management work",
      "Documented emergency-water or irrigation functions",
    ],
    keepSeparateOrFlag: [
      "Recreation-only components",
      "Fish stocking and later operating activities",
      "Engineering, hazard-classification, permitting, or water-rights claims not yet documented",
    ],
    verificationChecklist: [
      "Floodplain, watershed, and site maps",
      "Engineering, hazard, dam-safety, and permitting status",
      "Water-management and operational-use plan",
      "Environmental review and long-term maintenance plan",
      "Agency authority, match, and allowable-cost confirmation",
    ],
  },
  {
    key: "public_recreation",
    label: "Public recreation, parks, and sports access",
    purpose: "Publicly accessible recreation, parks, trails, water access, sports, education, and accessibility components.",
    candidateComponents: [
      "Public trails, parks, and open space",
      "Ball fields and youth or senior recreation",
      "Public canoe, kayak, fishing, or water access",
      "Accessibility, environmental education, and habitat-restoration features",
    ],
    keepSeparateOrFlag: [
      "Private retail, entertainment, or revenue-generating development",
      "Developer-led sports facilities without a documented public-access component",
      "Operating and maintenance costs not allowed by the specific program",
    ],
    verificationChecklist: [
      "Public ownership or access commitment",
      "Site plan and public-benefit description",
      "Accessibility and maintenance plan",
      "Capital versus operating-cost separation",
      "Program-specific public-use, match, and environmental requirements",
    ],
  },
  {
    key: "housing_enabling_infrastructure",
    label: "Affordable and missing-middle housing-enabling infrastructure",
    purpose: "Infrastructure that unlocks affordable, workforce, multifamily, townhome, or single-family housing and related family-serving facilities.",
    candidateComponents: [
      "Infrastructure serving multifamily affordable housing",
      "Townhome and workforce-housing enabling work",
      "Single-family housing-enabling utilities",
      "Childcare and educational facilities connected to the development plan",
    ],
    keepSeparateOrFlag: [
      "Housing affordability claims without unit counts, income bands, or affordability periods",
      "Land or parcel-control claims not supported by records",
      "Anti-displacement or development-readiness claims not yet documented",
    ],
    verificationChecklist: [
      "Parcel control and development commitments",
      "Unit counts, target income bands, and affordability periods",
      "Infrastructure cost allocation",
      "Anti-displacement and resident-benefit plan",
      "Development readiness, schedule, match, and funding-source requirements",
    ],
  },
];

export function buildManorFundingPackageBlock() {
  return {
    profileKey: MANOR_FUNDING_PACKAGE_PROFILE_KEY,
    taxonomyVersion: MANOR_FUNDING_PACKAGE_TAXONOMY_VERSION,
    packages: MANOR_FUNDING_PACKAGES,
    disclosure: "This permanent Manor taxonomy organizes pursuit work; package membership is advisory and does not establish eligibility, funding availability, deadline, award likelihood, or public/private cost allowability.",
    classificationRule: "Assign one primary package and any justified secondary package tags. Use cross-package review when classification is uncertain. Verify every opportunity against the current primary source before pursuit.",
  };
}

export function isManorOrganization(
  organization: { externalKey: string | null; name: string; state: string | null; counties: string[] },
): boolean {
  const normalizedName = organization.name.trim().toLowerCase();
  const normalizedState = organization.state?.trim().toUpperCase();
  const normalizedCounties = organization.counties.map((county) => county.trim().toLowerCase());
  return organization.externalKey === MANOR_FUNDING_PACKAGE_PROFILE_KEY
    && normalizedState === "TX"
    && normalizedName === "city of manor"
    && normalizedCounties.some((county) => county === "travis" || county === "travis county");
}