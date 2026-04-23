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

  // ---------- BASELINE: remaining 51 jurisdictions (Medicaid + SNAP + SHIP) ----------
  // Three real programs per jurisdiction: state Medicaid portal, state SNAP portal
  // (or USDA state directory fallback), and SHIP via the national locator that
  // resolves to the correct state office. Hub Workbench grows this via discovery.
  ...baseline51(),
];

// Baseline records for the 51 jurisdictions not deep-seeded above.
// SHIP_LOCATOR is the national SHIP TA Center locator; passing &state=XX
// resolves to that state's SHIP office.
function baseline51(): BenefitProgram[] {
  const SHIP = "https://www.shiphelp.org/about-medicare/regional-ship-location";
  const SNAP_DIR = "https://www.fns.usda.gov/snap/state-directory";
  type B = [string, string, string, string, string]; // code, MedicaidName, MedicaidURL, SNAPName, SNAPURL
  const data: B[] = [
    ["AL","Alabama Medicaid","https://medicaid.alabama.gov/","Alabama SNAP","https://dhr.alabama.gov/services/food-assistance/"],
    ["AK","Alaska Medicaid (DenaliCare)","https://health.alaska.gov/dpa/Pages/medicaid/default.aspx","Alaska SNAP (Food Stamps)","https://health.alaska.gov/dpa/Pages/foodstamps/default.aspx"],
    ["AZ","Arizona AHCCCS (Medicaid)","https://www.azahcccs.gov/","Arizona Nutrition Assistance","https://des.az.gov/services/basic-needs/food-assistance"],
    ["AR","Arkansas Medicaid","https://medicaid.mmis.arkansas.gov/","Arkansas SNAP","https://humanservices.arkansas.gov/divisions-shared-services/county-operations/programs-services/snap/"],
    ["CO","Health First Colorado (Medicaid)","https://www.healthfirstcolorado.com/","Colorado SNAP","https://cdhs.colorado.gov/snap"],
    ["CT","Connecticut HUSKY Health (Medicaid)","https://portal.ct.gov/husky","Connecticut SNAP","https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap"],
    ["DE","Delaware Medicaid","https://dhss.delaware.gov/dhss/dmma/medicaid.html","Delaware SNAP","https://dhss.delaware.gov/dhss/dss/foodstamps.html"],
    ["GA","Georgia Medicaid","https://medicaid.georgia.gov/","Georgia SNAP","https://dfcs.georgia.gov/services/food-stamps"],
    ["HI","Hawaii Med-QUEST (Medicaid)","https://medquest.hawaii.gov/","Hawaii SNAP","https://humanservices.hawaii.gov/bessd/snap/"],
    ["ID","Idaho Medicaid","https://healthandwelfare.idaho.gov/services-programs/medicaid-health","Idaho SNAP","https://healthandwelfare.idaho.gov/services-programs/food-assistance"],
    ["IN","Indiana Medicaid (Hoosier Healthwise)","https://www.in.gov/medicaid/","Indiana SNAP","https://www.in.gov/fssa/dfr/snap/"],
    ["IA","Iowa Medicaid (HHS)","https://hhs.iowa.gov/programs/welcome-iowa-medicaid","Iowa SNAP","https://hhs.iowa.gov/programs/welcome-iowa-snap"],
    ["KS","KanCare (Kansas Medicaid)","https://www.kancare.ks.gov/","Kansas SNAP (Food Assistance)","https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx"],
    ["KY","Kentucky Medicaid","https://www.chfs.ky.gov/agencies/dms/Pages/default.aspx","Kentucky SNAP","https://www.chfs.ky.gov/agencies/dcbs/dfs/Pages/snap.aspx"],
    ["LA","Louisiana Healthy Louisiana (Medicaid)","https://ldh.la.gov/medicaid","Louisiana SNAP","https://www.dcfs.louisiana.gov/page/snap"],
    ["ME","MaineCare (Medicaid)","https://www.maine.gov/dhhs/ofi/programs-services/medicaid-mainecare","Maine SNAP","https://www.maine.gov/dhhs/ofi/programs-services/food-supplement"],
    ["MD","Maryland Medicaid","https://health.maryland.gov/mmcp/Pages/Home.aspx","Maryland SNAP (FSP)","https://dhs.maryland.gov/supplemental-nutrition-assistance-program/"],
    ["MA","MassHealth (Medicaid)","https://www.mass.gov/masshealth","Massachusetts SNAP","https://www.mass.gov/snap-benefits-formerly-food-stamps"],
    ["MI","Michigan Medicaid","https://www.michigan.gov/mdhhs/assistance-programs/medicaid","Michigan Food Assistance Program","https://www.michigan.gov/mdhhs/assistance-programs/food"],
    ["MN","Minnesota Medical Assistance","https://mn.gov/dhs/people-we-serve/adults/health-care/health-care-programs/programs-and-services/medical-assistance.jsp","Minnesota SNAP","https://mn.gov/dhs/people-we-serve/adults/economic-assistance/food-nutrition/programs-and-services/supplemental-nutrition-assistance-program.jsp"],
    ["MS","Mississippi Medicaid","https://medicaid.ms.gov/","Mississippi SNAP","https://www.mdhs.ms.gov/economic-assistance/snap/"],
    ["MO","MO HealthNet (Medicaid)","https://mydss.mo.gov/healthcare","Missouri SNAP (Food Stamps)","https://mydss.mo.gov/food-assistance"],
    ["MT","Montana Medicaid (HMK)","https://dphhs.mt.gov/MontanaHealthcarePrograms","Montana SNAP","https://dphhs.mt.gov/hcsd/snap"],
    ["NE","Nebraska Medicaid","https://dhhs.ne.gov/Pages/Medicaid.aspx","Nebraska SNAP","https://dhhs.ne.gov/Pages/Economic-Assistance.aspx"],
    ["NV","Nevada Medicaid","https://dhcfp.nv.gov/","Nevada SNAP","https://dwss.nv.gov/SNAP/SNAP/"],
    ["NH","New Hampshire Medicaid","https://www.dhhs.nh.gov/programs-services/medicaid","New Hampshire SNAP (Food Stamps)","https://www.dhhs.nh.gov/programs-services/economic-stability/food-stamp-program-snap"],
    ["NJ","NJ FamilyCare (Medicaid)","https://www.njfamilycare.org/","NJ SNAP","https://www.nj.gov/humanservices/njsnap/"],
    ["NM","New Mexico Medicaid (Centennial Care)","https://www.hsd.state.nm.us/lookingforassistance/medicaid/","New Mexico SNAP","https://www.hsd.state.nm.us/lookingforassistance/supplemental-nutrition-assistance-program-snap-/"],
    ["NC","NC Medicaid","https://medicaid.ncdhhs.gov/","NC FNS (SNAP)","https://www.ncdhhs.gov/divisions/social-services/food-and-nutrition-services-food-stamps"],
    ["ND","North Dakota Medicaid","https://www.hhs.nd.gov/healthcare-coverage/medicaid","North Dakota SNAP","https://www.hhs.nd.gov/snap"],
    ["OH","Ohio Medicaid","https://medicaid.ohio.gov/","Ohio SNAP (Food Assistance)","https://jfs.ohio.gov/job-family-services/food-assistance"],
    ["OK","SoonerCare (Oklahoma Medicaid)","https://oklahoma.gov/ohca.html","Oklahoma SNAP","https://oklahoma.gov/okdhs/services/snap.html"],
    ["OR","Oregon Health Plan (Medicaid)","https://www.oregon.gov/oha/HSD/OHP/Pages/index.aspx","Oregon SNAP","https://www.oregon.gov/odhs/food/Pages/snap.aspx"],
    ["PA","Pennsylvania Medical Assistance (Medicaid)","https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx","Pennsylvania SNAP","https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx"],
    ["RI","Rhode Island Medicaid","https://eohhs.ri.gov/consumer/find-services/medicaid","Rhode Island SNAP","https://dhs.ri.gov/programs-and-services/snap-supplemental-nutrition-assistance-program"],
    ["SC","Healthy Connections (SC Medicaid)","https://www.scdhhs.gov/","South Carolina SNAP","https://dss.sc.gov/snap/"],
    ["SD","South Dakota Medicaid","https://dss.sd.gov/medicaid/","South Dakota SNAP","https://dss.sd.gov/foodstamps/"],
    ["TN","TennCare (Tennessee Medicaid)","https://www.tn.gov/tenncare.html","Tennessee SNAP (Families First)","https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html"],
    ["UT","Utah Medicaid","https://medicaid.utah.gov/","Utah SNAP","https://jobs.utah.gov/customereducation/services/foodstamps/index.html"],
    ["VT","Vermont Medicaid (Green Mountain Care)","https://dvha.vermont.gov/members","Vermont 3SquaresVT (SNAP)","https://dcf.vermont.gov/benefits/3SquaresVT"],
    ["VA","Virginia Medicaid (Cardinal Care)","https://www.dmas.virginia.gov/","Virginia SNAP","https://www.dss.virginia.gov/benefit/snap.cgi"],
    ["WA","Washington Apple Health (Medicaid)","https://www.hca.wa.gov/health-care-services-supports/apple-health-medicaid-coverage","Washington Basic Food (SNAP)","https://www.dshs.wa.gov/esa/community-services-offices/basic-food"],
    ["WV","West Virginia Medicaid","https://dhhr.wv.gov/bms/Pages/default.aspx","West Virginia SNAP","https://dhhr.wv.gov/bcf/Services/familyassistance/Pages/SNAP.aspx"],
    ["WI","BadgerCare Plus (WI Medicaid)","https://www.dhs.wisconsin.gov/medicaid/","FoodShare Wisconsin (SNAP)","https://www.dhs.wisconsin.gov/foodshare/index.htm"],
    ["WY","Wyoming Medicaid","https://health.wyo.gov/healthcarefin/medicaid/","Wyoming SNAP","https://dfs.wyo.gov/assistance-programs/snap-food-stamps/"],
    ["DC","DC Medicaid","https://dhcf.dc.gov/","DC SNAP","https://dhs.dc.gov/service/supplemental-nutrition-assistance-snap"],
    ["PR","Puerto Rico Medicaid","https://medicaid.pr.gov/","Puerto Rico Nutrition Assistance (PAN)","https://servicios.adsef.pr.gov/"],
    ["VI","USVI Medical Assistance Program","https://www.dhs.gov.vi/programs/medical-assistance.html","USVI SNAP",SNAP_DIR],
    ["GU","Guam Medicaid","https://dphss.guam.gov/dhcf-medicaid/","Guam SNAP","https://dphss.guam.gov/bureau-of-economic-security/"],
    ["AS","American Samoa Medicaid","https://www.lbj.as/health-services/medicaid/","American Samoa Nutrition Assistance",SNAP_DIR],
    ["MP","CNMI Medicaid","https://www.cnmimedicaid.com/","CNMI Nutrition Assistance",SNAP_DIR],
  ];
  const out: BenefitProgram[] = [];
  for (const [code, mName, mUrl, sName, sUrl] of data) {
    out.push(ST(code, "healthcare-access", mName, mUrl, "2-1-1",
      { eligibility: { incomeFPLmax: 138 }, annualDollarValueEstimate: 8400 }));
    out.push(ST(code, "food-nutrition", sName, sUrl, "2-1-1",
      { eligibility: { incomeFPLmax: 130 }, annualDollarValueEstimate: 2400 }));
    out.push(ST(code, "healthy-aging", `${code} SHIP (State Health Insurance Assistance Program)`, SHIP, "1-877-839-2675"));
  }
  return out;
}
