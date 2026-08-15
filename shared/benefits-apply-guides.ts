/**
 * Shared "How to Apply" guide data for every benefit program the platform
 * models. Used by:
 *   - client/src/pages/benefits-how-to-apply.tsx  (the guided walkthrough page)
 *   - client/src/pages/benefits-screener.tsx      (links into the page)
 *   - server/benefits-routes.ts                    (GET /api/benefits/how-to-apply/:program)
 *   - scripts/verify-how-to-apply.ts               (parity gate)
 *
 * Program codes here MUST stay in lockstep with BENEFIT_NAVIGATION in
 * server/benefits-screener-fix.ts — the verify script enforces this.
 */

export type ApplyStage = { title: string; detail: string };

export interface ApplyProgramMeta {
  name: string;
  description: string;
  /** Docs shown in the checklist when the state-aware guide has none. */
  docs: string[];
  annualValue: number;
  /** Does this program have walk-in physical offices worth searching for locally? */
  hasPhysicalOffices: boolean;
  /** Resource-finder search used to surface nearby offices/orgs (when hasPhysicalOffices). */
  officeSearch?: { categories: string[]; q: string };
  /** Plain-language disclosure when exact rules/URLs vary by state. */
  stateVariance?: string;
}

export const APPLY_PROGRAM_META: Record<string, ApplyProgramMeta> = {
  SNAP: {
    name: "SNAP (Food Benefits)",
    description: "Monthly funds loaded onto an EBT card for groceries.",
    docs: ["ID for all household members", "Proof of income (pay stubs, tax return)", "Proof of residence (utility bill, lease)", "Social Security numbers"],
    annualValue: 3024,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["food"], q: "SNAP" },
  },
  Medicaid: {
    name: "Medicaid",
    description: "Free or low-cost health coverage — doctor visits, hospital, prescriptions, mental health.",
    docs: ["ID", "Proof of income", "Proof of residence", "Social Security number", "Immigration documents (if applicable)"],
    annualValue: 7200,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["healthcare"], q: "Medicaid" },
  },
  CHIP: {
    name: "CHIP (Children's Health Insurance)",
    description: "Health coverage for children in families who earn too much for Medicaid but can't afford private insurance.",
    docs: ["Child's birth certificate or ID", "Parent/guardian ID", "Proof of income", "Social Security numbers"],
    annualValue: 2400,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["healthcare"], q: "CHIP" },
  },
  WIC: {
    name: "WIC (Women, Infants & Children)",
    description: "Nutrition support, healthy food, and breastfeeding support for pregnant women and children under 5.",
    docs: ["ID for parent and child", "Proof of income", "Proof of residence", "Proof of pregnancy (if applicable)"],
    annualValue: 528,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["food"], q: "WIC" },
  },
  TANF: {
    name: "TANF (Temporary Cash Assistance)",
    description: "Monthly cash assistance for families with children and very low income, plus job-readiness support.",
    docs: ["ID", "Birth certificates for children", "Proof of income", "Social Security numbers", "Proof of residency"],
    annualValue: 6444,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["financial"], q: "TANF" },
  },
  Marketplace: {
    name: "Health Insurance Marketplace",
    description: "Subsidized health insurance plans — many families pay $0–50/month with tax credits.",
    docs: ["ID", "Social Security number", "Proof of income", "Current insurance info (if any)"],
    annualValue: 5400,
    hasPhysicalOffices: false,
  },
  EITC: {
    name: "Earned Income Tax Credit",
    description: "A tax refund for working families — you may be owed money from previous years too.",
    docs: ["Tax return", "W-2s or 1099s", "Social Security numbers for all family members", "Child's birth certificate (if claiming children)"],
    annualValue: 3584,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["financial"], q: "tax" },
  },
  CTC: {
    name: "Child Tax Credit",
    description: "Up to $2,000 per child under 17 — refundable even if you owe no taxes.",
    docs: ["Tax return", "Child's Social Security number", "Proof child lived with you"],
    annualValue: 3600,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["financial"], q: "tax" },
  },
  SSI: {
    name: "SSI (Supplemental Security Income)",
    description: "Monthly income for people with disabilities or age 65+ with limited income.",
    docs: ["ID", "Medical records", "Proof of disability", "Bank statements", "Proof of income/resources"],
    annualValue: 10092,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["financial"], q: "Social Security" },
  },
  SSDI: {
    name: "SSDI (Social Security Disability)",
    description: "Monthly income for people who worked and paid into Social Security but can no longer work due to disability.",
    docs: ["ID", "Social Security number", "Medical records", "Work history", "Doctor contact information"],
    annualValue: 16560,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["financial"], q: "Social Security" },
  },
  CCDF: {
    name: "Child Care Assistance",
    description: "Helps pay for child care so a parent can work, look for work, or attend school/training.",
    docs: ["Child's birth certificate", "Proof of income", "Proof of work/school enrollment", "Social Security numbers"],
    annualValue: 8400,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["financial", "youth"], q: "child care" },
  },
  LIHEAP: {
    name: "Home Energy Assistance (LIHEAP)",
    description: "Helps pay heating and cooling bills, weatherization, and utility shutoff prevention.",
    docs: ["ID", "Proof of income", "A recent utility bill", "Social Security numbers"],
    annualValue: 1200,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["housing"], q: "energy" },
  },
  Section8: {
    name: "Housing Choice Vouchers (Section 8)",
    description: "Rental assistance that pays part of your rent directly to a private landlord.",
    docs: ["ID for all household members", "Social Security cards", "Birth certificates", "Income verification", "Rental history"],
    annualValue: 12000,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["housing"], q: "housing" },
  },
  VeteransBenefits: {
    name: "VA Disability & Benefits",
    description: "Disability compensation, health care, and other benefits for veterans based on service-connected conditions.",
    docs: ["DD-214", "Service records", "Medical records", "Social Security number"],
    annualValue: 18000,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["workforce", "healthcare"], q: "veteran" },
  },
  UnemploymentInsurance: {
    name: "Unemployment Insurance",
    description: "Weekly payments to replace part of your income while you look for a new job after losing one through no fault of your own.",
    docs: ["Social Security number", "Driver's license or state ID", "Employer names/addresses (last 18 months)", "Dates of employment and reason for separation", "Bank account for direct deposit"],
    annualValue: 7800,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["workforce"], q: "unemployment" },
    stateVariance: "Unemployment insurance is run by each state, not the federal government. The exact website, weekly benefit amount, waiting period, and rules all vary by state — the links here route you to your state's official agency.",
  },
  WorkersComp: {
    name: "Workers' Compensation",
    description: "Covers medical care and part of your lost wages if you were injured or got sick because of your job.",
    docs: ["Written notice of injury given to employer", "Medical records tying the injury to your job", "Incident report or witness statements", "Recent pay stubs", "Employer/insurance carrier information"],
    annualValue: 15600,
    hasPhysicalOffices: true,
    officeSearch: { categories: ["workforce", "legal"], q: "workers" },
    stateVariance: "Workers' compensation is run by each state (federal employees, longshore workers, and coal miners have separate federal programs). Deadlines, forms, and the agency you file with vary by state — the links here route you to your state's official agency.",
  },
};

export const APPLY_PROGRAM_CODES = Object.keys(APPLY_PROGRAM_META);

// Generic stage timeline — most safety-net programs follow this shape.
export const DEFAULT_APPLY_STAGES: ApplyStage[] = [
  { title: "Gather your documents", detail: "Collect the items in the checklist before you start — having them ready avoids a stalled application." },
  { title: "Submit your application", detail: "Apply online, by phone, or in person at your local office. Save your confirmation number or take a screenshot." },
  { title: "Verification / interview", detail: "The agency may call, mail a request, or schedule a short interview to confirm your information. Respond by the deadline in their letter — missing it is the #1 reason applications get denied." },
  { title: "Decision", detail: "You'll get a written notice (mail, email, or portal message) approving, denying, or asking for more information. Federal law caps how long most agencies can take — see processing time above." },
  { title: "If denied — appeal", detail: "You have the right to appeal almost any denial, usually within 30–90 days. Ask for the appeal in writing and keep a copy. A navigator or legal aid office can help for free." },
];

export const APPLY_STAGE_OVERRIDES: Record<string, ApplyStage[]> = {
  EITC: [
    { title: "Gather your tax documents", detail: "W-2s/1099s, Social Security numbers for everyone on the return, and last year's return if you have it." },
    { title: "File your tax return", detail: "EITC and CTC are claimed by filing a federal tax return — even if you don't owe taxes or aren't required to file. Free filing help (VITA) is available if your income is under the IRS threshold." },
    { title: "IRS processes your return", detail: "By law, the IRS cannot issue EITC/CTC refunds before mid-February, even if you file in January." },
    { title: "Refund arrives", detail: "Track it at irs.gov/refunds. Direct deposit is fastest." },
  ],
  CTC: [
    { title: "Gather your tax documents", detail: "W-2s/1099s, Social Security numbers for each qualifying child, and last year's return if you have it." },
    { title: "File your tax return", detail: "The Child Tax Credit is claimed on your federal tax return. Free filing help (VITA) is available if your income is under the IRS threshold." },
    { title: "IRS processes your return", detail: "Processing typically takes a few weeks for e-filed returns with direct deposit." },
    { title: "Refund/credit arrives", detail: "Track it at irs.gov/refunds." },
  ],
  VeteransBenefits: [
    { title: "Gather your service & medical records", detail: "DD-214, any medical evidence connecting a condition to your service, and current treatment records." },
    { title: "File your claim", detail: "Apply online at VA.gov, by mail, or with free help from a Veterans Service Officer (VSO) — VSOs are trained, free, and often get better outcomes." },
    { title: "C&P exam", detail: "The VA may schedule a Compensation & Pension exam to evaluate your condition. Attend — missing it can result in denial." },
    { title: "Decision", detail: "The VA issues a rating decision by mail/portal. Average time is well over 100 days — check status at VA.gov." },
    { title: "If denied or rated too low — appeal", detail: "You can request a Higher-Level Review, file a Supplemental Claim, or appeal to the Board of Veterans' Appeals. A VSO can help for free." },
  ],
  UnemploymentInsurance: [
    { title: "File your claim immediately", detail: "File the same week you become unemployed — payments are not retroactive before your filing date in most states." },
    { title: "Weekly certification", detail: "Most states require you to certify weekly or bi-weekly that you're able, available, and actively searching for work — missing this pauses payment." },
    { title: "Waiting period", detail: "Most states have one unpaid waiting week built into the process." },
    { title: "Payments begin", detail: "Typically 2–3 weeks after a complete, verified claim." },
    { title: "If denied — appeal", detail: "You can appeal a denial, usually within 10–30 days depending on your state. Keep records of your job search." },
  ],
  WorkersComp: [
    { title: "Report the injury to your employer", detail: "Do this immediately, in writing if possible — many states have short deadlines (as little as a few days to 30 days)." },
    { title: "Get medical treatment", detail: "See a doctor (sometimes your employer/insurer designates one) and make sure the injury is documented as work-related." },
    { title: "Employer files the claim", detail: "Your employer or their insurance carrier files the claim with the state workers' comp agency. Follow up to confirm it was filed." },
    { title: "Insurer decision", detail: "The insurer accepts, denies, or disputes the claim. Wage-replacement and medical benefits begin if accepted." },
    { title: "If denied — appeal", detail: "You can request a hearing with your state's workers' comp board or use free legal aid — retaliation for a valid claim is illegal in every state." },
  ],
};

export function getApplyStages(programCode: string): ApplyStage[] {
  return APPLY_STAGE_OVERRIDES[programCode] || DEFAULT_APPLY_STAGES;
}
