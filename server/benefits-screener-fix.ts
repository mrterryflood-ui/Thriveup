import { getBenefitNav } from "./benefits-local-nav";

export const BENEFIT_NAVIGATION: Record<string, {
  applicationUrl: string;
  documentsRequired: string[];
  enrollmentType: string;
  processingDays: string;
  estimatedAnnualValue: number;
  notes?: string;
}> = {
  SNAP: {
    applicationUrl: "https://yourtexasbenefits.com",
    documentsRequired: ["Photo ID", "Proof of income (last 30 days)", "Proof of residency", "Social Security numbers for all household members"],
    enrollmentType: "Rolling — apply any time",
    processingDays: "30 days standard; 7 days if expedited (income under $150/mo)",
    estimatedAnnualValue: 3024,
    notes: "Apply online at YourTexasBenefits.com or call 2-1-1 for in-person help.",
  },
  Medicaid: {
    applicationUrl: "https://yourtexasbenefits.com",
    documentsRequired: ["Photo ID", "Proof of income", "Social Security number", "Proof of citizenship or immigration status"],
    enrollmentType: "Rolling — no open enrollment period",
    processingDays: "45 days standard; 90 days for disability-based",
    estimatedAnnualValue: 7200,
  },
  CHIP: {
    applicationUrl: "https://chipmedicaid.org",
    documentsRequired: ["Child's birth certificate", "Proof of income", "Proof of Texas residency", "Social Security numbers"],
    enrollmentType: "Rolling",
    processingDays: "30 days",
    estimatedAnnualValue: 2400,
  },
  WIC: {
    applicationUrl: "https://texaswic.org",
    documentsRequired: ["Photo ID", "Proof of income", "Proof of residency", "Medical records showing pregnancy or child's age"],
    enrollmentType: "Rolling — certification every 6 months",
    processingDays: "Same-day at WIC clinic",
    estimatedAnnualValue: 528,
    notes: "Call 1-800-942-3678 to find your nearest WIC clinic.",
  },
  TANF: {
    applicationUrl: "https://yourtexasbenefits.com",
    documentsRequired: ["Photo ID", "Birth certificates for all children", "Proof of income", "Social Security numbers", "Proof of Texas residency", "School enrollment verification for children over 6"],
    enrollmentType: "Rolling; 60-month lifetime limit in Texas",
    processingDays: "30 days; interview required",
    estimatedAnnualValue: 6444,
    notes: "Texas TANF averages $74/month for a family of 3. Work requirements apply unless exempt.",
  },
  Marketplace: {
    applicationUrl: "https://healthcare.gov",
    documentsRequired: ["Social Security number", "Employer and income information", "Policy numbers for current coverage"],
    enrollmentType: "Open enrollment Nov 1 – Jan 15; Special Enrollment if qualifying life event",
    processingDays: "Coverage starts 1st of following month",
    estimatedAnnualValue: 5400,
  },
  EITC: {
    applicationUrl: "https://irs.gov/eitc",
    documentsRequired: ["Social Security numbers for self, spouse, and children", "W-2s and 1099s", "Birth dates for all children"],
    enrollmentType: "Annual — file federal tax return",
    processingDays: "21 days after filing if e-filed with direct deposit",
    estimatedAnnualValue: 3584,
    notes: "Free tax filing help at myfreetaxes.com or local VITA sites.",
  },
  CTC: {
    applicationUrl: "https://irs.gov/childtaxcredit",
    documentsRequired: ["Social Security numbers for children", "Proof of relationship", "Tax return"],
    enrollmentType: "Annual — claim on federal tax return",
    processingDays: "21 days if e-filed",
    estimatedAnnualValue: 3600,
  },
  SSI: {
    applicationUrl: "https://ssa.gov/ssi/apply",
    documentsRequired: ["Social Security card", "Birth certificate", "Proof of residency", "Medical records", "Financial records"],
    enrollmentType: "Rolling — apply immediately if disabled",
    processingDays: "3–6 months; up to 2 years if appealed",
    estimatedAnnualValue: 10092,
    notes: "Apply as early as possible — backpay starts from application date.",
  },
  SSDI: {
    applicationUrl: "https://ssa.gov/disability/apply",
    documentsRequired: ["Work history", "Medical records", "Social Security card", "W-2s last 2 years"],
    enrollmentType: "Rolling",
    processingDays: "3–6 months; Medicare starts after 24 months of SSDI",
    estimatedAnnualValue: 16560,
  },
  CCDF: {
    applicationUrl: "https://childcare.texas.gov",
    documentsRequired: ["Child's birth certificate", "Proof of income", "Proof of work/school/training enrollment", "Social Security numbers", "Immunization records"],
    enrollmentType: "Rolling; waitlist common in high-demand areas",
    processingDays: "30–90 days depending on waitlist",
    estimatedAnnualValue: 8400,
    notes: "Texas Child Care Assistance (CCAP) through Texas HHSC. Call 1-877-541-7905.",
  },
  LIHEAP: {
    applicationUrl: "https://capmetx.org",
    documentsRequired: ["Photo ID", "Proof of income", "Utility bill", "Social Security numbers", "Proof of residency"],
    enrollmentType: "Seasonal — typically Oct–Sep; funds limited",
    processingDays: "2–4 weeks",
    estimatedAnnualValue: 1200,
    notes: "Apply early — LIHEAP funds are exhausted quickly each season. Local CAP agency: capmetx.org.",
  },
  Section8: {
    applicationUrl: "https://hacanline.org",
    documentsRequired: ["Photo ID", "Social Security cards for all members", "Birth certificates", "Income verification", "Rental history"],
    enrollmentType: "Waitlist-based; HACA opens waitlist periodically",
    processingDays: "Waitlist: months to years",
    estimatedAnnualValue: 12000,
    notes: "Austin Housing Authority (HACA): 512-477-4488. Also check local PHA and project-based Section 8.",
  },
  VeteransBenefits: {
    applicationUrl: "https://va.gov/apply-for-benefits",
    documentsRequired: ["DD-214", "Service records", "Medical records", "Social Security number"],
    enrollmentType: "Rolling — apply immediately after discharge",
    processingDays: "125 days average for disability claims",
    estimatedAnnualValue: 18000,
    notes: "VSO assistance available at no cost. Contact DAV, VFW, or American Legion.",
  },
  UnemploymentInsurance: {
    applicationUrl: "https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx",
    documentsRequired: ["Social Security number", "Driver's license or state ID", "Employer name(s) and address(es) for the last 18 months", "Dates of employment and reason for separation", "Bank account/routing number for direct deposit"],
    enrollmentType: "File a new claim the same week you become unemployed — do not wait",
    processingDays: "2–3 weeks for first payment after a 1-week unpaid waiting period in most states",
    estimatedAnnualValue: 7800,
    notes: "Unemployment insurance is run by each state, not the federal government — the exact website, weekly benefit amount, and rules vary by state. This link routes you to your state's official unemployment agency. Must be able and available to work, and actively searching for a job, to keep receiving payments.",
  },
  WorkersComp: {
    applicationUrl: "https://www.dol.gov/general/topic/workcomp/state",
    documentsRequired: ["Written notice of injury given to employer (as soon as possible, before any state deadline)", "Medical records / doctor's report tying the injury to your job", "Incident report or witness statements", "Pay stubs (last 4–8 weeks) to calculate wage-replacement amount", "Employer and insurance carrier information"],
    enrollmentType: "Report the injury to your employer immediately, then file a claim with your state's workers' compensation agency or your employer's insurer",
    processingDays: "Varies by state and injury type — initial employer notice deadlines are often as short as 30 days",
    estimatedAnnualValue: 15600,
    notes: "Workers' compensation is run by each state (federal employees, longshore workers, and coal miners have separate federal programs). This link lists every state's workers' comp agency. You generally cannot be fired for filing a valid claim — free legal help is available if an employer retaliates or an insurer denies a legitimate claim.",
  },
};

/**
 * PROGRAM_DEFAULT_ANNUAL_VALUE — default annual benefit value (USD) per program
 * code, derived from the per-program estimatedAnnualValue figures in
 * BENEFIT_NAVIGATION above. Used when an org confirms enrollment without a
 * dollar estimate so funder dashboards never show $0 for a confirmed enrollment.
 * Reuses the exact numbers so screener estimates and funder value stay in sync.
 */
export const PROGRAM_DEFAULT_ANNUAL_VALUE: Record<string, number> = Object.fromEntries(
  Object.entries(BENEFIT_NAVIGATION).map(([code, v]) => [code, v.estimatedAnnualValue]),
);

export function computeEligibility(data: {
  annualIncome: number;
  householdSize: number;
  hasChildren?: boolean;
  isPregnant?: boolean;
  isDisabled?: boolean;
  isVeteran?: boolean;
  isSingleParent?: boolean;
  isUnemployed?: boolean;
  hadWorkplaceInjury?: boolean;
  currentBenefits?: string[];
  state?: string;   // USPS 2-letter code, e.g. "TX", "IL" — enables state-specific portals/hotlines
}): {
  eligible: string[];
  gaps: string[];
  estimatedAnnualValue: number;
  navigationGuides: Record<string, any>;
} {
  const income = data.annualIncome || 0;
  const hhSize = data.householdSize || 1;
  const fpl = 15060 + (hhSize - 1) * 5380;
  const eligible: string[] = [];

  if (income <= fpl * 1.3) eligible.push("SNAP");
  if (income <= fpl * 1.38) eligible.push("Medicaid");
  if (data.hasChildren && income <= fpl * 2.0) eligible.push("CHIP");
  if (data.isPregnant || data.hasChildren) eligible.push("WIC");
  if (income <= fpl * 4.0) eligible.push("Marketplace");
  if (income > 0 && income <= fpl * 3.0) eligible.push("EITC");
  if (data.hasChildren && income <= fpl * 4.0) eligible.push("CTC");
  if (data.isDisabled) { eligible.push("SSI"); eligible.push("SSDI"); }

  if (data.hasChildren && income <= fpl * 0.17) eligible.push("TANF");
  if (data.hasChildren && income <= 53000) eligible.push("CCDF");
  if (income <= fpl * 1.5) eligible.push("LIHEAP");

  const austinAMI50pct = Math.max(27575, 55150 + (hhSize - 4) * 5000);
  if (income <= austinAMI50pct) eligible.push("Section8");

  if (data.isVeteran) eligible.push("VeteransBenefits");

  if (data.isUnemployed) eligible.push("UnemploymentInsurance");
  if (data.hadWorkplaceInjury) eligible.push("WorkersComp");

  const current = data.currentBenefits || [];
  const gaps = eligible.filter((b) => !current.includes(b));

  const estimatedAnnualValue = gaps.reduce(
    (sum, b) => sum + (BENEFIT_NAVIGATION[b]?.estimatedAnnualValue ?? 0),
    0
  );

  // Build state-aware navigation guides: merge static docs/value with
  // the state-specific portal, hotline, and office-finder URL.
  const navigationGuides: Record<string, any> = {};
  for (const b of gaps) {
    const staticInfo = BENEFIT_NAVIGATION[b];
    if (!staticInfo) continue;
    const stateNav = getBenefitNav(data.state, b);
    navigationGuides[b] = {
      ...staticInfo,
      ...(stateNav || {}),
    };
  }

  return { eligible, gaps, estimatedAnnualValue, navigationGuides };
}
