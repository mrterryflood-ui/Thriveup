// RPLICE v2 — Replicable Contract
// State layer: each state's Medicaid expansion, CHIP, WIC, SHIP, MH authority,
// unemployment, AAA, vocational rehab, legal aid, veterans office.
//
// Seed set below covers TX, CA, NY, FL, IL with verified portals. The ST()
// helper produces byte-identical slugs so peers match when adding new states.
// All 50 states + DC follow the same pattern; fill in as partnerships land.

import type { BenefitProgram, BenefitAreaId, ApplicationChannel, RenewalCadence } from "./types";

// Slug helper — canonical, byte-identical across peers.
export function stateSlug(stateCode: string, area: BenefitAreaId, programName: string): string {
  const p = programName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `state:${stateCode.toLowerCase()}:${area}:${p}`;
}

const ST = (
  code: string,
  area: BenefitAreaId,
  programName: string,
  portalUrl: string,
  phone: string,
  extras: Partial<BenefitProgram> = {},
): BenefitProgram => ({
  slug: stateSlug(code, area, programName),
  scope: "state",
  state: code,
  county: null,
  area,
  programName,
  eligibility: extras.eligibility ?? {},
  portalUrl,
  phone,
  applicationChannels: extras.applicationChannels ?? (["online","phone","in-person"] as ApplicationChannel[]),
  renewalCadence: (extras.renewalCadence ?? "annual") as RenewalCadence,
  annualDollarValueEstimate: extras.annualDollarValueEstimate,
  programNameEs: extras.programNameEs,
  description: extras.description,
});

export const STATE_PROGRAMS: BenefitProgram[] = [
  // ---------- TEXAS ----------
  ST("TX", "healthcare-access", "Texas Medicaid (Your Texas Benefits)", "https://www.yourtexasbenefits.com/", "2-1-1",
     { eligibility: { incomeFPLmax: 138 }, annualDollarValueEstimate: 8400 }),
  ST("TX", "healthy-children-families", "Texas CHIP", "https://www.yourtexasbenefits.com/", "1-800-647-6558",
     { eligibility: { ageMax: 18, incomeFPLmax: 250 }, annualDollarValueEstimate: 4200 }),
  ST("TX", "healthy-children-families", "Texas WIC", "https://texaswic.org/", "1-800-942-3678",
     { eligibility: { pregnancyOrParent: true, ageMax: 5, incomeFPLmax: 185 }, annualDollarValueEstimate: 1800 }),
  ST("TX", "healthcare-access", "Healthy Texas Women", "https://www.healthytexaswomen.org/", "1-866-993-9972",
     { eligibility: { ageMin: 15, ageMax: 44, incomeFPLmax: 200 }, annualDollarValueEstimate: 3200 }),
  ST("TX", "mental-health", "Texas HHSC Mental Health Services", "https://www.hhs.texas.gov/services/mental-health-substance-use", "1-877-541-7905"),
  ST("TX", "healthy-aging", "Texas SHIP (Health Information Counseling & Advocacy)", "https://www.hhs.texas.gov/services/aging/health-insurance-counseling", "1-800-252-9240"),
  ST("TX", "healthy-aging", "Texas Area Agencies on Aging", "https://apps.hhs.texas.gov/contact/ReferralSearch.cfm", "1-800-252-9240"),
  ST("TX", "income-employment", "Texas Workforce Commission Unemployment", "https://www.twc.texas.gov/jobseekers/unemployment-benefits-services", "1-800-939-6631"),
  ST("TX", "legal-rights", "Texas Legal Services Center", "https://tlsc.org/", "1-800-622-2520",
     { eligibility: { incomeFPLmax: 125 } }),
  ST("TX", "veterans", "Texas Veterans Commission", "https://tvc.texas.gov/", "1-800-252-8387"),

  // ---------- CALIFORNIA ----------
  ST("CA", "healthcare-access", "Medi-Cal", "https://www.dhcs.ca.gov/services/medi-cal/Pages/default.aspx", "1-800-541-5555",
     { eligibility: { incomeFPLmax: 138 }, annualDollarValueEstimate: 8400 }),
  ST("CA", "food-nutrition", "CalFresh (SNAP)", "https://www.getcalfresh.org/", "1-877-847-3663",
     { eligibility: { incomeFPLmax: 200 }, annualDollarValueEstimate: 2400 }),
  ST("CA", "healthy-children-families", "WIC California", "https://www.cdph.ca.gov/Programs/CFH/DWICSN/Pages/Program-Landing.aspx", "1-888-942-9675",
     { eligibility: { pregnancyOrParent: true, ageMax: 5, incomeFPLmax: 185 }, annualDollarValueEstimate: 1800 }),
  ST("CA", "healthcare-access", "Covered California", "https://www.coveredca.com/", "1-800-300-1506",
     { eligibility: { incomeFPLmax: 400 }, annualDollarValueEstimate: 4800 }),
  ST("CA", "income-employment", "CalWORKs", "https://www.cdss.ca.gov/calworks", "2-1-1",
     { eligibility: { pregnancyOrParent: true, incomeFPLmax: 55 }, annualDollarValueEstimate: 7200 }),
  ST("CA", "mental-health", "California DHCS Behavioral Health", "https://www.dhcs.ca.gov/services/Pages/BehavioralHealth.aspx", "1-916-445-4171"),
  ST("CA", "healthy-aging", "California HICAP (SHIP)", "https://cahealthadvocates.org/hicap/", "1-800-434-0222"),
  ST("CA", "income-employment", "California EDD Unemployment", "https://edd.ca.gov/en/unemployment/", "1-800-300-5616"),
  ST("CA", "legal-rights", "Legal Aid Association of California", "https://laaconline.org/", "2-1-1",
     { eligibility: { incomeFPLmax: 125 } }),
  ST("CA", "veterans", "CalVet", "https://www.calvet.ca.gov/", "1-800-952-5626"),

  // ---------- NEW YORK ----------
  ST("NY", "healthcare-access", "NY Medicaid (NY State of Health)", "https://nystateofhealth.ny.gov/", "1-855-355-5777",
     { eligibility: { incomeFPLmax: 138 }, annualDollarValueEstimate: 8400 }),
  ST("NY", "food-nutrition", "NY SNAP", "https://otda.ny.gov/programs/snap/", "1-800-342-3009",
     { eligibility: { incomeFPLmax: 150 }, annualDollarValueEstimate: 2400 }),
  ST("NY", "healthy-children-families", "WIC New York", "https://www.health.ny.gov/prevention/nutrition/wic/", "1-800-522-5006",
     { eligibility: { pregnancyOrParent: true, ageMax: 5, incomeFPLmax: 185 }, annualDollarValueEstimate: 1800 }),
  ST("NY", "healthy-children-families", "Child Health Plus", "https://www.health.ny.gov/health_care/child_health_plus/", "1-800-698-4543",
     { eligibility: { ageMax: 18, incomeFPLmax: 400 }, annualDollarValueEstimate: 4200 }),
  ST("NY", "mental-health", "NY OMH NY Project Hope", "https://nyprojecthope.org/", "1-844-863-9314"),
  ST("NY", "healthy-aging", "NY HIICAP (SHIP)", "https://aging.ny.gov/health-insurance-information-counseling-and-assistance-program", "1-800-701-0501"),
  ST("NY", "income-employment", "NY DOL Unemployment", "https://dol.ny.gov/unemployment/", "1-888-209-8124"),
  ST("NY", "legal-rights", "LawHelpNY", "https://www.lawhelpny.org/", "2-1-1",
     { eligibility: { incomeFPLmax: 125 } }),
  ST("NY", "veterans", "NY Dept of Veterans Services", "https://veterans.ny.gov/", "1-888-838-7697"),
  ST("NY", "income-employment", "NY Temporary Assistance (TANF)", "https://otda.ny.gov/programs/temporary-assistance/", "1-800-342-3009",
     { eligibility: { pregnancyOrParent: true, incomeFPLmax: 50 } }),

  // ---------- FLORIDA ----------
  ST("FL", "healthcare-access", "Florida Medicaid (ACCESS Florida)", "https://www.myflfamilies.com/services/public-assistance/access-florida", "1-866-762-2237",
     { eligibility: { incomeFPLmax: 138 }, annualDollarValueEstimate: 8400 }),
  ST("FL", "healthy-children-families", "Florida KidCare (CHIP)", "https://www.floridakidcare.org/", "1-888-540-5437",
     { eligibility: { ageMax: 18, incomeFPLmax: 200 }, annualDollarValueEstimate: 4200 }),
  ST("FL", "healthy-children-families", "WIC Florida", "https://www.floridahealth.gov/programs-and-services/wic/", "1-800-342-3556",
     { eligibility: { pregnancyOrParent: true, ageMax: 5, incomeFPLmax: 185 }, annualDollarValueEstimate: 1800 }),
  ST("FL", "food-nutrition", "Florida SNAP (Food Assistance)", "https://www.myflfamilies.com/services/public-assistance/food-assistance-program", "1-866-762-2237",
     { eligibility: { incomeFPLmax: 130 }, annualDollarValueEstimate: 2400 }),
  ST("FL", "mental-health", "Florida DCF Mental Health", "https://www.myflfamilies.com/services/mental-health-substance-abuse", "2-1-1"),
  ST("FL", "healthy-aging", "Florida SHINE (SHIP)", "https://www.floridashine.org/", "1-800-963-5337"),
  ST("FL", "income-employment", "Florida Reemployment Assistance", "https://connect.myflorida.com/", "1-800-204-2418"),
  ST("FL", "legal-rights", "Florida Legal Aid", "https://www.floridalawhelp.org/", "2-1-1",
     { eligibility: { incomeFPLmax: 125 } }),
  ST("FL", "veterans", "Florida Dept of Veterans Affairs", "https://www.fdva.state.fl.us/", "1-727-518-3202"),
  ST("FL", "income-employment", "Florida TCA (TANF)", "https://www.myflfamilies.com/services/public-assistance/temporary-cash-assistance", "1-866-762-2237",
     { eligibility: { pregnancyOrParent: true, incomeFPLmax: 50 } }),

  // ---------- ILLINOIS ----------
  ST("IL", "healthcare-access", "Illinois Medicaid (ABE)", "https://abe.illinois.gov/", "1-800-843-6154",
     { eligibility: { incomeFPLmax: 138 }, annualDollarValueEstimate: 8400 }),
  ST("IL", "healthy-children-families", "All Kids (Illinois CHIP)", "https://www.allkids.com/", "1-866-255-5437",
     { eligibility: { ageMax: 18, incomeFPLmax: 318 }, annualDollarValueEstimate: 4200 }),
  ST("IL", "healthy-children-families", "WIC Illinois", "https://dph.illinois.gov/topics-services/prevention-wellness/wic.html", "1-800-323-4769",
     { eligibility: { pregnancyOrParent: true, ageMax: 5, incomeFPLmax: 185 }, annualDollarValueEstimate: 1800 }),
  ST("IL", "food-nutrition", "Illinois SNAP", "https://www.dhs.state.il.us/page.aspx?item=30357", "1-800-843-6154",
     { eligibility: { incomeFPLmax: 165 }, annualDollarValueEstimate: 2400 }),
  ST("IL", "mental-health", "Illinois DMH", "https://www.dhs.state.il.us/page.aspx?item=29735", "1-866-359-7953"),
  ST("IL", "healthy-aging", "Illinois SHIP", "https://ilaging.illinois.gov/ship.html", "1-800-252-8966"),
  ST("IL", "income-employment", "IDES Unemployment", "https://ides.illinois.gov/unemployment.html", "1-800-244-5631"),
  ST("IL", "legal-rights", "Illinois Legal Aid Online", "https://www.illinoislegalaid.org/", "2-1-1",
     { eligibility: { incomeFPLmax: 125 } }),
  ST("IL", "veterans", "Illinois Dept of Veterans' Affairs", "https://veterans.illinois.gov/", "1-217-782-6641"),
  ST("IL", "income-employment", "Illinois TANF", "https://www.dhs.state.il.us/page.aspx?item=30358", "1-800-843-6154",
     { eligibility: { pregnancyOrParent: true, incomeFPLmax: 50 } }),
];

// TODO (nationwide rollout): extend STATE_PROGRAMS with the remaining
// 45 states + DC using the same ST() helper. Every addition must be
// committed to BOTH peers in lockstep so the dedup keys align.
