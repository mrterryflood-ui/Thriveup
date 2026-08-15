/**
 * Benefits Local Navigation Catalog
 *
 * State-aware application portals, local office finders, and hotlines for
 * every U.S. state and DC. Federal programs (EITC, CTC, SSI, SSDI, Marketplace,
 * VeteransBenefits) are the same everywhere and handled separately.
 *
 * For each state we store per-program overrides. When a program is not listed
 * for a state the getBenefitNav() helper falls back to the national defaults.
 */

export interface BenefitNavEntry {
  applicationUrl: string;
  officeFinder?: string;       // URL to find the nearest local office
  hotline?: string;            // State-specific phone number
  notes?: string;
  processingDays?: string;
  enrollmentType?: string;
}

// ── Federal programs — identical in every state ───────────────────────────────
const FEDERAL: Record<string, BenefitNavEntry> = {
  Marketplace: {
    applicationUrl: "https://healthcare.gov",
    hotline: "1-800-318-2596",
    notes: "Open enrollment Nov 1 – Jan 15. Many families pay $0–50/month with tax credits.",
    processingDays: "Coverage starts 1st of following month",
    enrollmentType: "Open enrollment Nov 1 – Jan 15; Special Enrollment for qualifying life events",
  },
  EITC: {
    applicationUrl: "https://irs.gov/eitc",
    officeFinder: "https://irs.treasury.gov/freetaxprep/",
    hotline: "1-800-906-9887",
    notes: "Free tax filing help at IRS Free Tax Prep sites and VITA locations near you.",
    processingDays: "21 days after e-filing with direct deposit",
    enrollmentType: "Annual — file federal tax return",
  },
  CTC: {
    applicationUrl: "https://irs.gov/childtaxcredit",
    officeFinder: "https://irs.treasury.gov/freetaxprep/",
    hotline: "1-800-829-1040",
    notes: "Claim on your federal tax return. Free filing help at VITA sites.",
    processingDays: "21 days if e-filed",
    enrollmentType: "Annual — claim on federal tax return",
  },
  SSI: {
    applicationUrl: "https://ssa.gov/ssi/apply",
    officeFinder: "https://www.ssa.gov/locator/",
    hotline: "1-800-772-1213",
    notes: "Apply as early as possible — backpay starts from application date. TTY: 1-800-325-0778.",
    processingDays: "3–6 months; up to 2 years if appealed",
    enrollmentType: "Rolling — apply immediately if disabled",
  },
  SSDI: {
    applicationUrl: "https://ssa.gov/disability/apply",
    officeFinder: "https://www.ssa.gov/locator/",
    hotline: "1-800-772-1213",
    notes: "Medicare starts after 24 months of SSDI. TTY: 1-800-325-0778.",
    processingDays: "3–6 months",
    enrollmentType: "Rolling",
  },
  VeteransBenefits: {
    applicationUrl: "https://va.gov/apply-for-benefits",
    officeFinder: "https://www.va.gov/find-locations/",
    hotline: "1-800-827-1000",
    notes: "Free VSO (Veterans Service Organization) assistance available — DAV, VFW, American Legion. TTY: 711.",
    processingDays: "125 days average for disability claims",
    enrollmentType: "Rolling — apply immediately after discharge",
  },
  // Unemployment insurance and workers' comp are run entirely by each state
  // (not a single federal portal), so these are national fallback locators
  // rather than a single application site. Real per-state links can be added
  // to STATE_NAV over time without changing the frontend.
  UnemploymentInsurance: {
    applicationUrl: "https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx",
    officeFinder: "https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx",
    hotline: "1-877-US2-JOBS (1-877-872-5627)",
    notes: "Unemployment insurance is run by your state, not the federal government — this locator routes you to your state's official site. File the same week you lose your job; don't wait.",
    processingDays: "2–3 weeks for first payment in most states, after a 1-week unpaid waiting period",
    enrollmentType: "File a new claim immediately after becoming unemployed",
  },
  WorkersComp: {
    applicationUrl: "https://www.dol.gov/general/topic/workcomp/state",
    officeFinder: "https://www.dol.gov/general/topic/workcomp/state",
    hotline: "1-866-4-USA-DOL (1-866-487-2365)",
    notes: "Workers' compensation is run by your state (federal employees, longshore/harbor workers, and coal miners have separate federal programs at dol.gov/owcp). Report the injury to your employer immediately — many states have short notice deadlines.",
    processingDays: "Varies by state and injury severity",
    enrollmentType: "Report injury to employer immediately, then file with the state agency or employer's insurer",
  },
};

// ── State-specific overrides keyed by USPS state code ────────────────────────
// Programs omitted here fall back to national defaults below.
const STATE_NAV: Record<string, Record<string, BenefitNavEntry>> = {
  AL: {
    SNAP:     { applicationUrl: "https://aces.alabama.gov", hotline: "1-800-382-0499", officeFinder: "https://dhr.alabama.gov/county-offices/", notes: "Apply at your county DHR office or online via ACES." },
    Medicaid: { applicationUrl: "https://aces.alabama.gov", hotline: "1-800-362-1504", officeFinder: "https://dhr.alabama.gov/county-offices/", notes: "Alabama Medicaid Agency — same portal as SNAP." },
    CHIP:     { applicationUrl: "https://aces.alabama.gov", hotline: "1-800-362-1504", notes: "ALL Kids program in Alabama." },
    WIC:      { applicationUrl: "https://adph.org/wic/", hotline: "1-800-654-3445", notes: "Call to find your nearest WIC clinic." },
    TANF:     { applicationUrl: "https://aces.alabama.gov", hotline: "1-800-382-0499", notes: "Temporary Assistance for Needy Families through ACES." },
    LIHEAP:   { applicationUrl: "https://adeca.alabama.gov/liheap/", hotline: "1-800-392-8098", notes: "Contact your local Community Action Agency for energy assistance." },
    CCDF:     { applicationUrl: "https://dhr.alabama.gov/childcare/", hotline: "1-334-242-1425", notes: "Child Care Subsidy through Alabama DHR." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local Public Housing Authority (PHA). Waitlists are long — apply to multiple PHAs." },
  },
  AK: {
    SNAP:     { applicationUrl: "https://mybenefits.alaska.gov", hotline: "1-800-478-7778", officeFinder: "https://health.alaska.gov/dpa/Pages/offices.aspx", notes: "Food Stamp / SNAP through Alaska DPA." },
    Medicaid: { applicationUrl: "https://mybenefits.alaska.gov", hotline: "1-800-780-9972", notes: "Denali KidCare for children and pregnant women." },
    CHIP:     { applicationUrl: "https://mybenefits.alaska.gov", hotline: "1-800-780-9972", notes: "Denali KidCare is Alaska's CHIP program." },
    WIC:      { applicationUrl: "https://dhss.alaska.gov/dph/wcws/wic/", hotline: "1-907-269-3430", notes: "Call to find your local WIC clinic." },
    TANF:     { applicationUrl: "https://mybenefits.alaska.gov", hotline: "1-800-478-7778", notes: "Alaska Temporary Assistance Program (ATAP)." },
    LIHEAP:   { applicationUrl: "https://commerce.alaska.gov/web/dcced/CommerceCommunityEconDev/CommunityAdvocacy/LIHEAP.aspx", hotline: "1-907-269-4500", notes: "Home Energy Assistance Program (HEAP)." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local PHA. Alaska Housing Finance Corporation manages statewide HCV." },
  },
  AZ: {
    SNAP:     { applicationUrl: "https://healthearizonaplus.gov", hotline: "1-855-HEA-PLUS (1-855-432-7587)", officeFinder: "https://des.az.gov/services/basic-needs/food/nutrition-assistance", notes: "Apply online at Health-E-Arizona Plus or at your local DES office." },
    Medicaid: { applicationUrl: "https://healthearizonaplus.gov", hotline: "1-800-654-8713", notes: "AHCCCS (Arizona Health Care Cost Containment System)." },
    CHIP:     { applicationUrl: "https://healthearizonaplus.gov", hotline: "1-800-654-8713", notes: "KidsCare — Arizona's CHIP program for children." },
    WIC:      { applicationUrl: "https://www.azdhs.gov/prevention/azwic/", hotline: "1-800-252-5942", notes: "Call to find your nearest WIC office." },
    TANF:     { applicationUrl: "https://healthearizonaplus.gov", hotline: "1-855-432-7587", notes: "Temporary Assistance for Needy Families through DES." },
    LIHEAP:   { applicationUrl: "https://des.az.gov/services/basic-needs/energy-assistance", hotline: "1-800-582-5706", notes: "Low Income Home Energy Assistance Program through local community action agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local PHA. Phoenix area: 602-262-6794. Tucson: 520-791-4171." },
  },
  AR: {
    SNAP:     { applicationUrl: "https://access.arkansas.gov", hotline: "1-800-482-8988", officeFinder: "https://humanservices.arkansas.gov/offices/", notes: "Apply online or at your county DHS office." },
    Medicaid: { applicationUrl: "https://access.arkansas.gov", hotline: "1-888-987-1200", notes: "Arkansas Medicaid through DHS." },
    CHIP:     { applicationUrl: "https://access.arkansas.gov", hotline: "1-888-987-1200", notes: "ARKids First is Arkansas's CHIP program." },
    WIC:      { applicationUrl: "https://www.healthy.arkansas.gov/programs-services/topics/arkansas-wic-program", hotline: "1-800-235-0002", notes: "Call to find your local WIC clinic." },
    TANF:     { applicationUrl: "https://access.arkansas.gov", hotline: "1-800-482-8988", notes: "TEA (Transitional Employment Assistance)." },
    LIHEAP:   { applicationUrl: "https://humanservices.arkansas.gov/divisions-offices/county-operations/liheap/", hotline: "1-501-682-8715", notes: "Apply at your county DHS office." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local PHA for the Housing Choice Voucher program." },
  },
  CA: {
    SNAP:     { applicationUrl: "https://benefitscal.com", hotline: "1-877-847-3663", officeFinder: "https://benefitscal.com/find-office", notes: "CalFresh — apply online at BenefitsCal.com or call 211." },
    Medicaid: { applicationUrl: "https://benefitscal.com", hotline: "1-800-541-5555", notes: "Medi-Cal — same portal as CalFresh/CalWORKs." },
    CHIP:     { applicationUrl: "https://benefitscal.com", hotline: "1-800-541-5555", notes: "Children enrolled in Medi-Cal under 138% FPL; Healthy Families ended 2013." },
    WIC:      { applicationUrl: "https://www.cdph.ca.gov/Programs/CFH/DWICSN/Pages/Program-Landing1.aspx", hotline: "1-888-942-5746", officeFinder: "https://www.cdph.ca.gov/Programs/CFH/DWICSN/Pages/Find-Your-Local-WIC.aspx", notes: "WIC varies by county — call or use the locator to find your clinic." },
    TANF:     { applicationUrl: "https://benefitscal.com", hotline: "1-877-847-3663", notes: "CalWORKs — California's TANF program." },
    LIHEAP:   { applicationUrl: "https://www.csd.ca.gov/Pages/LIHEAPUtilityAssistance.aspx", hotline: "1-866-675-6623", notes: "Energy assistance through local Community Services agencies." },
    CCDF:     { applicationUrl: "https://mychildcare.ca.gov/", hotline: "1-800-KIDS-793 (1-800-543-7793)", notes: "California Alternative Payment Program (CAPP) — childcare subsidy." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "LA: HACLA 213-252-2500. SF: SFHA 415-554-1200. Apply to multiple PHAs — waitlists can be years long." },
  },
  CO: {
    SNAP:     { applicationUrl: "https://peak.colorado.gov", hotline: "1-800-536-5298", officeFinder: "https://www.colorado.gov/pacific/cdhs/county-offices", notes: "Apply online at PEAK or at your county department of human services." },
    Medicaid: { applicationUrl: "https://peak.colorado.gov", hotline: "1-800-221-3943", notes: "Health First Colorado — Colorado's Medicaid program." },
    CHIP:     { applicationUrl: "https://peak.colorado.gov", hotline: "1-800-359-1991", notes: "Child Health Plan Plus (CHP+)." },
    WIC:      { applicationUrl: "https://cdphe.colorado.gov/wic", hotline: "1-800-688-7777", notes: "Call to find your local WIC clinic." },
    TANF:     { applicationUrl: "https://peak.colorado.gov", hotline: "1-800-536-5298", notes: "Colorado Works — TANF program." },
    LIHEAP:   { applicationUrl: "https://energyoutreach.org/liheap/", hotline: "1-866-HEAT-HLP (1-866-432-8457)", notes: "Low-Income Energy Assistance Program through local agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Denver HCV: DCHA 720-944-3300. Contact your local PHA." },
  },
  CT: {
    SNAP:     { applicationUrl: "https://connect.ct.gov", hotline: "1-855-626-6632", officeFinder: "https://portal.ct.gov/dss/offices/listing-of-all-dsss-offices", notes: "Apply online at ConneCT or at your local DSS office." },
    Medicaid: { applicationUrl: "https://connect.ct.gov", hotline: "1-800-842-1508", notes: "HUSKY Health — Connecticut's Medicaid/CHIP program." },
    CHIP:     { applicationUrl: "https://connect.ct.gov", hotline: "1-800-842-1508", notes: "HUSKY B — Connecticut's CHIP component." },
    WIC:      { applicationUrl: "https://portal.ct.gov/DPH/WIC/WIC", hotline: "1-800-741-2600", notes: "Call to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://connect.ct.gov", hotline: "1-855-626-6632", notes: "TFA (Temporary Family Assistance)." },
    LIHEAP:   { applicationUrl: "https://portal.ct.gov/dss/Energy-Assistance/Connecticut-Energy-Assistance-Program", hotline: "1-800-842-1132", notes: "Connecticut Energy Assistance Program (CEAP)." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "HANH (New Haven) 203-498-8800. Contact your local PHA." },
  },
  DC: {
    SNAP:     { applicationUrl: "https://dc.gov/service/food-assistance-snap", hotline: "1-202-727-5355", officeFinder: "https://dhs.dc.gov/service/economic-security-administration-service-centers", notes: "Apply at DHS Service Centers or online." },
    Medicaid: { applicationUrl: "https://dc.gov/service/medicaid", hotline: "1-202-442-5988", notes: "DC Medicaid — covers all income levels with no waiting period." },
    CHIP:     { applicationUrl: "https://dc.gov/service/chip", hotline: "1-202-442-5988", notes: "DC Healthy Families covers children and pregnant women." },
    WIC:      { applicationUrl: "https://dchealth.dc.gov/service/wic-program", hotline: "1-202-724-5506", notes: "Call for your nearest DC WIC site." },
    TANF:     { applicationUrl: "https://dhs.dc.gov/service/tanf", hotline: "1-202-727-5355", notes: "DC TANF — Temporary Assistance for Needy Families." },
    LIHEAP:   { applicationUrl: "https://dhs.dc.gov/service/home-energy-assistance", hotline: "1-202-673-6750", notes: "DC Heating Emergency Assistance Program." },
    Section8: { applicationUrl: "https://www.dcha.dc.gov/service/housing-choice-voucher-program", officeFinder: "https://www.dcha.dc.gov/", hotline: "1-202-535-1500", notes: "DC Housing Authority manages HCV program in the District." },
  },
  DE: {
    SNAP:     { applicationUrl: "https://compass.dhss.delaware.gov", hotline: "1-866-843-7212", officeFinder: "https://dhss.delaware.gov/dhss/dss/offices.html", notes: "Apply online via COMPASS or at your local DSS office." },
    Medicaid: { applicationUrl: "https://compass.dhss.delaware.gov", hotline: "1-800-372-2022", notes: "Delaware Medicaid." },
    CHIP:     { applicationUrl: "https://compass.dhss.delaware.gov", hotline: "1-800-372-2022", notes: "Delaware Healthy Children — CHIP component." },
    WIC:      { applicationUrl: "https://dhss.delaware.gov/dhss/dph/dpc/wicprog.html", hotline: "1-800-222-2190", notes: "Call to schedule a WIC appointment." },
    TANF:     { applicationUrl: "https://compass.dhss.delaware.gov", hotline: "1-866-843-7212", notes: "Delaware Works — TANF program." },
    LIHEAP:   { applicationUrl: "https://www.destatehousing.com/FormsAndInformation/energy.html", hotline: "1-302-739-4263", notes: "LIHEAP through Delaware State Housing Authority." },
    Section8: { applicationUrl: "https://www.destatehousing.com/HomeOwnership/hcvp.html", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-302-739-4263", notes: "Delaware State Housing Authority manages the HCV program." },
  },
  FL: {
    SNAP:     { applicationUrl: "https://www.myflorida.com/accessflorida/", hotline: "1-866-762-2237", officeFinder: "https://www.myflorida.com/accessflorida/find-an-access-florida-office.html", notes: "Apply at ACCESS Florida online or at a local DCF office." },
    Medicaid: { applicationUrl: "https://www.myflorida.com/accessflorida/", hotline: "1-866-762-2237", notes: "Florida Medicaid through DCF — same portal as SNAP." },
    CHIP:     { applicationUrl: "https://www.myflorida.com/accessflorida/", hotline: "1-888-540-5437", notes: "Florida KidCare — CHIP component for children." },
    WIC:      { applicationUrl: "https://www.floridahealth.gov/programs-and-services/women-infants-and-children/", hotline: "1-800-342-3556", officeFinder: "https://www.floridahealth.gov/programs-and-services/women-infants-and-children/find-a-wic-site/index.html", notes: "Call or use the site finder to locate your WIC clinic." },
    TANF:     { applicationUrl: "https://www.myflorida.com/accessflorida/", hotline: "1-866-762-2237", notes: "Temporary Cash Assistance (TCA) — Florida's TANF program." },
    LIHEAP:   { applicationUrl: "https://www.floridacommerce.com/community/energy-programs", hotline: "1-850-717-8400", notes: "LIHEAP through local community action agencies and county offices." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Miami: MDHA 786-469-4100. Orlando: OCHA 407-895-3300. Contact your local PHA." },
  },
  GA: {
    SNAP:     { applicationUrl: "https://gateway.ga.gov", hotline: "1-877-423-4746", officeFinder: "https://dfcs.georgia.gov/dfcs-county-offices", notes: "Apply at Georgia Gateway or your county DFCS office." },
    Medicaid: { applicationUrl: "https://gateway.ga.gov", hotline: "1-888-423-6765", notes: "Georgia Medicaid / PeachCare for Kids." },
    CHIP:     { applicationUrl: "https://gateway.ga.gov", hotline: "1-800-PeachCare (1-800-732-4273)", notes: "PeachCare for Kids — Georgia's CHIP program." },
    WIC:      { applicationUrl: "https://dph.georgia.gov/wic", hotline: "1-800-228-9173", officeFinder: "https://dph.georgia.gov/wic/find-wic-clinic", notes: "Call or use the locator to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://gateway.ga.gov", hotline: "1-877-423-4746", notes: "TANF through DFCS Gateway." },
    LIHEAP:   { applicationUrl: "https://www.georgiavoices.org/liheap", hotline: "1-404-206-5350", notes: "Apply through your local Community Action Agency." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Atlanta: AHA 404-817-7300. Apply to multiple PHAs — waitlists are often closed." },
  },
  HI: {
    SNAP:     { applicationUrl: "https://mybenefits.hawaii.gov", hotline: "1-855-643-1643", officeFinder: "https://humanservices.hawaii.gov/nesd/med-quest/mqd-benefit-services/find-your-local-office/", notes: "Apply at MyBenefits Hawaii or your local DHS office." },
    Medicaid: { applicationUrl: "https://mybenefits.hawaii.gov", hotline: "1-800-316-8005", notes: "Med-QUEST — Hawaii's Medicaid managed care program." },
    CHIP:     { applicationUrl: "https://mybenefits.hawaii.gov", hotline: "1-800-316-8005", notes: "Hawaii's CHIP is covered under Med-QUEST." },
    WIC:      { applicationUrl: "https://health.hawaii.gov/wic/", hotline: "1-808-586-8175", notes: "Call for your local WIC site." },
    TANF:     { applicationUrl: "https://mybenefits.hawaii.gov", hotline: "1-855-643-1643", notes: "TANF through Hawaii DHS." },
    LIHEAP:   { applicationUrl: "https://hawaiicommunityaction.org/programs/liheap/", hotline: "1-808-593-1994", notes: "Hawaii Community Action Program." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Hawaii Public Housing Authority: 808-832-4694." },
  },
  ID: {
    SNAP:     { applicationUrl: "https://healthandwelfare.idaho.gov/services-programs/food", hotline: "1-877-456-1233", notes: "Idaho Food Stamps (SNAP) through DHW." },
    Medicaid: { applicationUrl: "https://healthandwelfare.idaho.gov/medicaid", hotline: "1-877-456-1233", notes: "Idaho Medicaid." },
    CHIP:     { applicationUrl: "https://healthandwelfare.idaho.gov/medicaid", hotline: "1-877-456-1233", notes: "Covered by Medicaid in Idaho." },
    WIC:      { applicationUrl: "https://healthandwelfare.idaho.gov/services-programs/nutrition/wic", hotline: "1-208-334-5945", notes: "Call to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://healthandwelfare.idaho.gov/tanf", hotline: "1-877-456-1233", notes: "TAFI (Temporary Assistance for Families in Idaho)." },
    LIHEAP:   { applicationUrl: "https://healthandwelfare.idaho.gov/liheap", hotline: "1-800-926-2588", notes: "Idaho LIHEAP — Energy and weatherization assistance." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local PHA. Boise City/Ada County HA: 208-345-4907." },
  },
  IL: {
    SNAP:     { applicationUrl: "https://abe.illinois.gov", hotline: "1-800-843-6154", officeFinder: "https://dhs.illinois.gov/office-locator", notes: "Apply at ABE.illinois.gov or call 1-800-843-6154. DHS offices across Cook County are walk-in friendly." },
    Medicaid: { applicationUrl: "https://abe.illinois.gov", hotline: "1-877-805-5312", officeFinder: "https://dhs.illinois.gov/office-locator", notes: "Illinois Medicaid (Medical Assistance). Same portal as SNAP. Cover Illinois also helps at coverillinois.gov." },
    CHIP:     { applicationUrl: "https://abe.illinois.gov", hotline: "1-800-226-0768", notes: "All Kids — Illinois comprehensive insurance program for all children." },
    WIC:      { applicationUrl: "https://dph.illinois.gov/topics-services/life-stages-populations/maternal-infant-child-health/wic-women-infants-children", hotline: "1-800-323-4769", officeFinder: "https://wiclocator.dph.illinois.gov/", notes: "Use the WIC locator or call to find your nearest clinic. Chicago WIC offices are citywide." },
    TANF:     { applicationUrl: "https://abe.illinois.gov", hotline: "1-800-843-6154", notes: "TANF through IDHS — apply at ABE or call your local office." },
    LIHEAP:   { applicationUrl: "https://dceo.illinois.gov/communityservices/energyassistance/liheap", hotline: "1-877-411-9276", notes: "Illinois LIHEAP (Low Income Home Energy Assistance Program). Chicago: Community and Economic Development Association (CEDA) 773-292-4980." },
    CCDF:     { applicationUrl: "https://www.ilchildcare.org/", hotline: "1-888-228-1146", notes: "Child Care Assistance Program (CCAP) through IDHS. Apply at ABE or your local child care resource and referral agency." },
    Section8: { applicationUrl: "https://www.thecha.org/residents/housing-choice-voucher", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-312-663-5447", notes: "Chicago Housing Authority (CHA) manages HCV in Chicago. Also check HACC and suburban PHAs — waitlists are long." },
  },
  IN: {
    SNAP:     { applicationUrl: "https://www.fssabenefits.in.gov", hotline: "1-800-403-0864", officeFinder: "https://www.in.gov/fssa/dfr/find-a-dfroffice/", notes: "Apply at FSSA Benefits or your local DFR office." },
    Medicaid: { applicationUrl: "https://www.fssabenefits.in.gov", hotline: "1-800-403-0864", notes: "Hoosier Healthwise and Hoosier Care Connect." },
    CHIP:     { applicationUrl: "https://www.fssabenefits.in.gov", hotline: "1-800-403-0864", notes: "Hoosier Healthwise covers children." },
    WIC:      { applicationUrl: "https://www.in.gov/health/mch/wic-program/", hotline: "1-800-522-0874", notes: "Call to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://www.fssabenefits.in.gov", hotline: "1-800-403-0864", notes: "TANF through FSSA." },
    LIHEAP:   { applicationUrl: "https://www.in.gov/ihcda/3819.htm", hotline: "1-800-872-0371", notes: "LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "IMHA (Indianapolis) 317-261-7100. Contact your local PHA." },
  },
  IA: {
    SNAP:     { applicationUrl: "https://dhs.iowa.gov/food-assistance", hotline: "1-888-372-5678", notes: "Iowa Food Assistance through DHS." },
    Medicaid: { applicationUrl: "https://dhs.iowa.gov/hawk-i", hotline: "1-800-338-8366", notes: "Iowa Medicaid." },
    CHIP:     { applicationUrl: "https://dhs.iowa.gov/hawk-i", hotline: "1-800-257-8563", notes: "hawk-i — Iowa's CHIP program." },
    WIC:      { applicationUrl: "https://idph.iowa.gov/wic", hotline: "1-800-532-1579", notes: "Call to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://dhs.iowa.gov/family-investment-program", hotline: "1-888-372-5678", notes: "Family Investment Program (FIP) — Iowa's TANF." },
    LIHEAP:   { applicationUrl: "https://dhs.iowa.gov/liheap", hotline: "1-800-310-6999", notes: "LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local PHA. Iowa City HA: 319-887-6000." },
  },
  KS: {
    SNAP:     { applicationUrl: "https://www.kansasbenefits.gov", hotline: "1-888-369-4777", notes: "Kansas SNAP through DCF." },
    Medicaid: { applicationUrl: "https://www.kansasbenefits.gov", hotline: "1-800-792-4884", notes: "Kansas Medicaid (KanCare)." },
    CHIP:     { applicationUrl: "https://www.kansasbenefits.gov", hotline: "1-800-792-4884", notes: "HealthWave — Kansas CHIP program." },
    WIC:      { applicationUrl: "https://www.kdheks.gov/wic/", hotline: "1-800-332-6262", notes: "Call for your nearest Kansas WIC site." },
    TANF:     { applicationUrl: "https://www.kansasbenefits.gov", hotline: "1-888-369-4777", notes: "Kansas Works — TANF program." },
    LIHEAP:   { applicationUrl: "https://kshousingcorp.org/residents/energy/liheap/", hotline: "1-785-217-2001", notes: "LIHEAP through Kansas Housing Resources Corporation." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Wichita PHA: 316-462-3700. Contact your local housing authority." },
  },
  KY: {
    SNAP:     { applicationUrl: "https://kynect.ky.gov", hotline: "1-855-4KY-NECT (1-855-459-6328)", officeFinder: "https://chfs.ky.gov/agencies/dcbs/dfs/Pages/cabinetoffices.aspx", notes: "Apply at kynect.ky.gov or call 1-855-4KY-NECT." },
    Medicaid: { applicationUrl: "https://kynect.ky.gov", hotline: "1-800-635-2570", notes: "Kentucky Medicaid (Passport, WellCare, Molina, etc.)." },
    CHIP:     { applicationUrl: "https://kynect.ky.gov", hotline: "1-877-524-4718", notes: "KCHIP — Kentucky Children's Health Insurance Program." },
    WIC:      { applicationUrl: "https://chfs.ky.gov/agencies/dph/dphps/mchb/Pages/wic.aspx", hotline: "1-800-462-6122", notes: "Call to find your nearest WIC clinic." },
    TANF:     { applicationUrl: "https://kynect.ky.gov", hotline: "1-855-459-6328", notes: "KTAP (Kentucky Transitional Assistance Program)." },
    LIHEAP:   { applicationUrl: "https://chfs.ky.gov/agencies/dcbs/dfs/Pages/liheap.aspx", hotline: "1-800-456-3452", notes: "LIHEAP through DCBS — apply at your local DCBS office." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Louisville MSD: 502-569-3400. Contact your local PHA." },
  },
  LA: {
    SNAP:     { applicationUrl: "https://ldh.la.gov/snap", hotline: "1-888-524-3578", officeFinder: "https://www.dcfs.louisiana.gov/page/snap-offices", notes: "Apply online or at your local DCFS office." },
    Medicaid: { applicationUrl: "https://ldh.la.gov/medicaid", hotline: "1-888-342-6207", notes: "Louisiana Medicaid (Healthy Louisiana)." },
    CHIP:     { applicationUrl: "https://ldh.la.gov/medicaid", hotline: "1-877-252-2447", notes: "LaCHIP — Louisiana Children's Health Insurance Program." },
    WIC:      { applicationUrl: "https://ldh.la.gov/wic", hotline: "1-800-251-2229", notes: "Call to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://www.dcfs.louisiana.gov/page/tanf", hotline: "1-888-524-3578", notes: "FITAP (Family Independence Temporary Assistance Program)." },
    LIHEAP:   { applicationUrl: "https://www.doa.la.gov/pages/ocs/liheap.aspx", hotline: "1-888-454-2001", notes: "LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "HANO (New Orleans) 504-670-3300. Contact your local PHA." },
  },
  ME: {
    SNAP:     { applicationUrl: "https://www.maine.gov/dhhs/ofi/programs-services/food-supplement", hotline: "1-855-797-4357", notes: "Maine SNAP (Food Supplement Program)." },
    Medicaid: { applicationUrl: "https://www.maine.gov/dhhs/ofi/programs-services/mainecare", hotline: "1-800-977-6740", notes: "MaineCare — Maine's Medicaid program." },
    CHIP:     { applicationUrl: "https://www.maine.gov/dhhs/ofi/programs-services/mainecare", hotline: "1-800-977-6740", notes: "MaineCare covers children." },
    WIC:      { applicationUrl: "https://www.maine.gov/dhhs/mecdc/population-health/wic/", hotline: "1-800-437-9300", notes: "Call to find your nearest WIC site." },
    TANF:     { applicationUrl: "https://www.maine.gov/dhhs/ofi/programs-services/aspire-tanf", hotline: "1-855-797-4357", notes: "ASPIRE — Maine's TANF program." },
    LIHEAP:   { applicationUrl: "https://www.maine.gov/dhhs/ofi/programs-services/heap", hotline: "1-877-699-6228", notes: "Maine HEAP (Home Energy Assistance Program)." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Maine State Housing Authority: 207-626-4600." },
  },
  MD: {
    SNAP:     { applicationUrl: "https://mymdthink.maryland.gov", hotline: "1-800-332-6347", officeFinder: "https://dhs.maryland.gov/local-offices/", notes: "Apply at myMDTHINK or your local Department of Social Services office." },
    Medicaid: { applicationUrl: "https://mymdthink.maryland.gov", hotline: "1-800-226-2214", notes: "Maryland Medicaid (HealthChoice)." },
    CHIP:     { applicationUrl: "https://mymdthink.maryland.gov", hotline: "1-800-456-8900", notes: "Maryland Children's Health Program (MCHP)." },
    WIC:      { applicationUrl: "https://phpa.health.maryland.gov/mch/Pages/wic.aspx", hotline: "1-800-242-4WIC (1-800-242-4942)", notes: "Call or use the locator to find your WIC clinic." },
    TANF:     { applicationUrl: "https://mymdthink.maryland.gov", hotline: "1-800-332-6347", notes: "Family Investment Program (FIP) — Maryland TANF." },
    LIHEAP:   { applicationUrl: "https://www.energyassistance.maryland.gov/", hotline: "1-800-332-6347", notes: "Maryland LIHEAP — Electric Universal Service Program." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "HABC (Baltimore) 410-396-3232. MCPD (Montgomery County) 240-773-9400." },
  },
  MA: {
    SNAP:     { applicationUrl: "https://dtaconnect.eohhs.mass.gov", hotline: "1-877-382-2363", officeFinder: "https://www.mass.gov/how-to/find-a-dta-local-office", notes: "Apply at DTAConnect.com or your local DTA office." },
    Medicaid: { applicationUrl: "https://mahix.org", hotline: "1-800-841-2900", notes: "MassHealth — Massachusetts Medicaid. Apply at MAhix.org." },
    CHIP:     { applicationUrl: "https://mahix.org", hotline: "1-800-841-2900", notes: "MassHealth covers children." },
    WIC:      { applicationUrl: "https://www.mass.gov/wic", hotline: "1-800-WIC-1007 (1-800-942-1007)", officeFinder: "https://www.mass.gov/service-details/find-your-wic-local-program", notes: "Call or use the site locator." },
    TANF:     { applicationUrl: "https://dtaconnect.eohhs.mass.gov", hotline: "1-877-382-2363", notes: "TAFDC (Transitional Aid to Families with Dependent Children)." },
    LIHEAP:   { applicationUrl: "https://www.masscommunityaction.org/liheap/", hotline: "1-800-632-8175", notes: "Fuel Assistance through Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Boston Housing Authority: 617-988-4000. RAFT program also available for rental assistance." },
  },
  MI: {
    SNAP:     { applicationUrl: "https://mibridges.michigan.gov", hotline: "1-888-642-7434", officeFinder: "https://www.michigan.gov/mdhhs/0,5885,7-339-71547_5527---,00.html", notes: "Apply at MI Bridges or call your local MDHHS office." },
    Medicaid: { applicationUrl: "https://mibridges.michigan.gov", hotline: "1-800-642-3195", notes: "Michigan Medicaid / Healthy Michigan Plan." },
    CHIP:     { applicationUrl: "https://mibridges.michigan.gov", hotline: "1-888-988-6300", notes: "MIChild — Michigan's CHIP program." },
    WIC:      { applicationUrl: "https://www.michigan.gov/mdhhs/0,5885,7-339-71547_4910---,00.html", hotline: "1-800-942-1636", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://mibridges.michigan.gov", hotline: "1-888-642-7434", notes: "Family Independence Program (FIP) — Michigan's TANF." },
    LIHEAP:   { applicationUrl: "https://www.michigan.gov/liheap", hotline: "1-800-292-5650", notes: "Michigan LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Detroit HCD: 313-877-8000. MSHDA also administers statewide vouchers." },
  },
  MN: {
    SNAP:     { applicationUrl: "https://mnbenefits.mn.gov", hotline: "1-800-657-3698", officeFinder: "https://mn.gov/dhs/people-we-serve/children-and-families/services/", notes: "Apply at MN Compass or your county Human Services office." },
    Medicaid: { applicationUrl: "https://mnbenefits.mn.gov", hotline: "1-800-657-3739", notes: "Medical Assistance (MA) — Minnesota Medicaid." },
    CHIP:     { applicationUrl: "https://mnbenefits.mn.gov", hotline: "1-800-657-3739", notes: "MinnesotaCare covers children not eligible for MA." },
    WIC:      { applicationUrl: "https://www.health.state.mn.us/people/wic/", hotline: "1-800-657-3942", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://mnbenefits.mn.gov", hotline: "1-800-657-3698", notes: "MFIP (Minnesota Family Investment Program)." },
    LIHEAP:   { applicationUrl: "https://mn.gov/commerce/consumers/consumer-assistance/energy/", hotline: "1-800-657-3710", notes: "LIHEAP through county Human Services — can be combined with energy assistance programs." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "MPHA (Minneapolis) 612-342-1400. SPPHA (St. Paul) 651-298-5664." },
  },
  MS: {
    SNAP:     { applicationUrl: "https://www.mdhs.ms.gov/economic-assistance/snap/", hotline: "1-800-948-3050", notes: "Mississippi SNAP through MDHS." },
    Medicaid: { applicationUrl: "https://www.medicaid.ms.gov/", hotline: "1-800-421-2408", notes: "Mississippi Medicaid." },
    CHIP:     { applicationUrl: "https://www.medicaid.ms.gov/mississippi-chip/", hotline: "1-877-543-7669", notes: "CHIP through Mississippi Division of Medicaid." },
    WIC:      { applicationUrl: "https://msdh.ms.gov/msdhsite/_static/44,0,95.html", hotline: "1-800-721-7222", notes: "Mississippi WIC — call for nearest clinic." },
    TANF:     { applicationUrl: "https://www.mdhs.ms.gov/economic-assistance/tanf/", hotline: "1-800-948-3050", notes: "TANF through MDHS." },
    LIHEAP:   { applicationUrl: "https://www.mdhs.ms.gov/liheap", hotline: "1-800-421-0737", notes: "Mississippi LIHEAP through MDHS." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "JCHA (Jackson) 601-969-4321. Contact your local PHA." },
  },
  MO: {
    SNAP:     { applicationUrl: "https://mydss.mo.gov", hotline: "1-855-373-4636", officeFinder: "https://dss.mo.gov/fsd/county.htm", notes: "Apply at myDSS.mo.gov or your local FSD office." },
    Medicaid: { applicationUrl: "https://mydss.mo.gov", hotline: "1-855-373-4636", notes: "Missouri Medicaid (MO HealthNet)." },
    CHIP:     { applicationUrl: "https://mydss.mo.gov", hotline: "1-800-444-6989", notes: "MO HealthNet for Kids — Missouri CHIP." },
    WIC:      { applicationUrl: "https://health.mo.gov/living/families/wic/", hotline: "1-800-392-8209", notes: "Call to find your nearest WIC clinic." },
    TANF:     { applicationUrl: "https://mydss.mo.gov", hotline: "1-855-373-4636", notes: "Temporary Assistance (TA) — Missouri TANF." },
    LIHEAP:   { applicationUrl: "https://dss.mo.gov/fsd/liheap.htm", hotline: "1-855-373-4636", notes: "LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "KCHA (Kansas City) 816-968-4200. SLHA (St. Louis) 314-534-9560." },
  },
  MT: {
    SNAP:     { applicationUrl: "https://benefits.mt.gov", hotline: "1-888-706-1535", notes: "Montana SNAP through DPHHS." },
    Medicaid: { applicationUrl: "https://benefits.mt.gov", hotline: "1-800-362-8312", notes: "Montana Medicaid." },
    CHIP:     { applicationUrl: "https://benefits.mt.gov", hotline: "1-800-362-8312", notes: "Healthy Montana Kids (HMK) — Montana CHIP." },
    WIC:      { applicationUrl: "https://dphhs.mt.gov/publichealth/WIC", hotline: "1-800-433-3021", notes: "Call for your nearest Montana WIC site." },
    TANF:     { applicationUrl: "https://benefits.mt.gov", hotline: "1-888-706-1535", notes: "FAIM (Families Achieving Independence in Montana)." },
    LIHEAP:   { applicationUrl: "https://dphhs.mt.gov/EAPDP/LIHEAP", hotline: "1-888-706-1535", notes: "Montana LIHEAP through DPHHS." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Contact your local PHA. Great Falls HA: 406-452-3391." },
  },
  NE: {
    SNAP:     { applicationUrl: "https://accessnebraska.ne.gov", hotline: "1-800-383-4278", notes: "Nebraska SNAP through DHHS." },
    Medicaid: { applicationUrl: "https://accessnebraska.ne.gov", hotline: "1-855-632-7633", notes: "Nebraska Medicaid." },
    CHIP:     { applicationUrl: "https://accessnebraska.ne.gov", hotline: "1-855-632-7633", notes: "Nebraska Children's Health Insurance Program (CHIP)." },
    WIC:      { applicationUrl: "https://dhhs.ne.gov/Pages/WIC.aspx", hotline: "1-800-942-1171", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://accessnebraska.ne.gov", hotline: "1-800-383-4278", notes: "ADC (Aid to Dependent Children) — Nebraska TANF." },
    LIHEAP:   { applicationUrl: "https://dhhs.ne.gov/Pages/LIHEAP.aspx", hotline: "1-800-383-4278", notes: "Nebraska LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Omaha Housing Authority: 402-444-4000." },
  },
  NV: {
    SNAP:     { applicationUrl: "https://dwss.nv.gov", hotline: "1-800-992-0900", notes: "Nevada SNAP through DWSS." },
    Medicaid: { applicationUrl: "https://dwss.nv.gov", hotline: "1-800-992-0900", notes: "Nevada Medicaid." },
    CHIP:     { applicationUrl: "https://dwss.nv.gov", hotline: "1-800-992-0900", notes: "Nevada Check Up — Nevada CHIP." },
    WIC:      { applicationUrl: "https://dpbh.nv.gov/Programs/NevadaWIC/", hotline: "1-888-881-0233", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://dwss.nv.gov", hotline: "1-800-992-0900", notes: "TANF through DWSS." },
    LIHEAP:   { applicationUrl: "https://dcfs.nv.gov/programs/liheap/", hotline: "1-800-992-0900", notes: "Nevada LIHEAP." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "SNHC (Las Vegas) 702-922-6900. RENO HA: 775-329-3630." },
  },
  NH: {
    SNAP:     { applicationUrl: "https://www.dhhs.nh.gov/programs-services/financial-assistance/food-stamps-snap", hotline: "1-603-271-9700", notes: "New Hampshire SNAP through DHHS." },
    Medicaid: { applicationUrl: "https://www.dhhs.nh.gov/medicaid", hotline: "1-888-901-4999", notes: "New Hampshire Medicaid." },
    CHIP:     { applicationUrl: "https://www.dhhs.nh.gov/medicaid", hotline: "1-888-901-4999", notes: "NH Medicaid covers children." },
    WIC:      { applicationUrl: "https://www.dhhs.nh.gov/programs-services/health-care-services/wic", hotline: "1-603-271-4546", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://www.dhhs.nh.gov/financial-assistance/tanf", hotline: "1-603-271-9700", notes: "FANF (Family Assistance to Needy Families) — NH TANF." },
    LIHEAP:   { applicationUrl: "https://www.dhhs.nh.gov/programs-services/financial-assistance/liheap", hotline: "1-603-271-7200", notes: "NH LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "NH Housing Finance Authority: 603-472-8623." },
  },
  NJ: {
    SNAP:     { applicationUrl: "https://www.nj.gov/humanservices/dfd/programs/njsnap/", hotline: "1-800-687-9512", officeFinder: "https://www.nj.gov/humanservices/dfd/home/county/", notes: "Apply at NJ SNAP or your county Board of Social Services." },
    Medicaid: { applicationUrl: "https://www.nj.gov/humanservices/dmahs/home/", hotline: "1-800-356-1561", notes: "New Jersey Medicaid / FamilyCare." },
    CHIP:     { applicationUrl: "https://www.nj.gov/humanservices/dmahs/home/", hotline: "1-800-701-0710", notes: "NJ FamilyCare — NJ's CHIP/Medicaid program." },
    WIC:      { applicationUrl: "https://www.nj.gov/health/fhs/wic/", hotline: "1-800-328-3838", officeFinder: "https://www.nj.gov/health/fhs/wic/find-a-clinic.shtml", notes: "Call or use the locator to find your WIC clinic." },
    TANF:     { applicationUrl: "https://www.nj.gov/humanservices/dfd/programs/wfnj/", hotline: "1-800-792-9773", notes: "WFNJ (Work First New Jersey) — NJ TANF." },
    LIHEAP:   { applicationUrl: "https://www.nj.gov/dca/divisions/dhcr/offices/liheap.html", hotline: "1-800-510-3102", notes: "NJ Universal Service Fund and LIHEAP through local CAPs." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "NJDCA administers HCV statewide. Newark HA: 973-645-3779." },
  },
  NM: {
    SNAP:     { applicationUrl: "https://yes.state.nm.us", hotline: "1-888-473-3676", notes: "NM SNAP through HSD." },
    Medicaid: { applicationUrl: "https://yes.state.nm.us", hotline: "1-888-997-2583", notes: "New Mexico Medicaid (Centennial Care)." },
    CHIP:     { applicationUrl: "https://yes.state.nm.us", hotline: "1-888-997-2583", notes: "NM CHIP — covered under Centennial Care." },
    WIC:      { applicationUrl: "https://www.nmhealth.org/about/phd/fch/wic/", hotline: "1-800-WIC-BABY (1-800-942-2229)", notes: "Call for your nearest NM WIC site." },
    TANF:     { applicationUrl: "https://yes.state.nm.us", hotline: "1-888-473-3676", notes: "NM TANF through HSD." },
    LIHEAP:   { applicationUrl: "https://www.hsd.state.nm.us/lookingforassistance/liheap/", hotline: "1-800-283-4465", notes: "NM LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Albuquerque Housing Services: 505-764-3920." },
  },
  NY: {
    SNAP:     { applicationUrl: "https://mybenefits.ny.gov", hotline: "1-800-342-3009", officeFinder: "https://www.benefits.ny.gov/OCA/", notes: "Apply at myBenefits.ny.gov or at your local Department of Social Services." },
    Medicaid: { applicationUrl: "https://mybenefits.ny.gov", hotline: "1-800-541-2831", notes: "New York Medicaid. NYC residents: NYC HRA 718-557-1399." },
    CHIP:     { applicationUrl: "https://mybenefits.ny.gov", hotline: "1-800-698-4543", notes: "Child Health Plus — NY's CHIP program." },
    WIC:      { applicationUrl: "https://www.health.ny.gov/prevention/nutrition/wic/", hotline: "1-800-522-5006", officeFinder: "https://www.health.ny.gov/prevention/nutrition/wic/local_agencies.htm", notes: "Call or use the locator to find your WIC agency." },
    TANF:     { applicationUrl: "https://mybenefits.ny.gov", hotline: "1-800-342-3009", notes: "FA (Family Assistance) — NY TANF." },
    LIHEAP:   { applicationUrl: "https://otda.ny.gov/programs/heap/", hotline: "1-800-342-3009", notes: "HEAP (Home Energy Assistance Program) — NY's LIHEAP. Apply in the fall before funds run out." },
    CCDF:     { applicationUrl: "https://www.childcareresource.org/", hotline: "1-800-424-2246", notes: "Child Care Assistance Program through local CCR&Rs." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "NYCHA (NYC) 212-306-3000. SCHA (Syracuse) 315-473-2641." },
  },
  NC: {
    SNAP:     { applicationUrl: "https://www.epass.nc.gov", hotline: "1-800-662-7030", officeFinder: "https://www.ncdhhs.gov/about/department-offices/divisionsoffices/county-directory", notes: "Apply at ePASS or your county DSS office." },
    Medicaid: { applicationUrl: "https://www.epass.nc.gov", hotline: "1-888-245-0179", notes: "NC Medicaid through DHHS." },
    CHIP:     { applicationUrl: "https://www.epass.nc.gov", hotline: "1-800-367-2229", notes: "NC Health Choice — NC CHIP." },
    WIC:      { applicationUrl: "https://www.nutritionnc.com/wic/", hotline: "1-800-FOR-BABY (1-800-367-2229)", officeFinder: "https://www.nutritionnc.com/wic/agencies.htm", notes: "Call or use the site finder." },
    TANF:     { applicationUrl: "https://www.epass.nc.gov", hotline: "1-800-662-7030", notes: "Work First — NC TANF." },
    LIHEAP:   { applicationUrl: "https://www.ncdhhs.gov/liheap", hotline: "1-800-662-7030", notes: "NC LIHEAP through local DSS and Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Charlotte HA: 704-376-9073. Durham HA: 919-683-1551." },
  },
  ND: {
    SNAP:     { applicationUrl: "https://www.nd.gov/dhs/services/financialhelp/snap.html", hotline: "1-800-755-2716", notes: "ND SNAP through DHS." },
    Medicaid: { applicationUrl: "https://www.nd.gov/dhs/services/medicalserv/medicaid/", hotline: "1-800-755-2604", notes: "North Dakota Medicaid." },
    CHIP:     { applicationUrl: "https://www.nd.gov/dhs/services/medicalserv/medicaid/", hotline: "1-800-755-2604", notes: "Healthy Steps — ND CHIP component." },
    WIC:      { applicationUrl: "https://www.health.nd.gov/wic", hotline: "1-800-472-2286", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://www.nd.gov/dhs/services/financialhelp/tanf.html", hotline: "1-800-755-2716", notes: "TANF through ND DHS." },
    LIHEAP:   { applicationUrl: "https://www.communityservices.nd.gov/liheap/", hotline: "1-800-472-2273", notes: "ND LIHEAP through Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Fargo Housing: 701-293-6262." },
  },
  OH: {
    SNAP:     { applicationUrl: "https://benefits.ohio.gov", hotline: "1-844-640-OHIO (1-844-640-6446)", officeFinder: "https://oh-odjfs.state.oh.us/county", notes: "Apply at benefits.ohio.gov or your county DJFS." },
    Medicaid: { applicationUrl: "https://benefits.ohio.gov", hotline: "1-800-324-8680", notes: "Ohio Medicaid." },
    CHIP:     { applicationUrl: "https://benefits.ohio.gov", hotline: "1-800-324-8680", notes: "Ohio CHIP — covered under Ohio Medicaid." },
    WIC:      { applicationUrl: "https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/women-infants-children", hotline: "1-800-755-4769", officeFinder: "https://ohiowic.com/wic-clinics/", notes: "Call or use the clinic finder." },
    TANF:     { applicationUrl: "https://benefits.ohio.gov", hotline: "1-844-640-6446", notes: "Ohio Works First (OWF) — Ohio TANF." },
    LIHEAP:   { applicationUrl: "https://development.ohio.gov/community/community-services/energy-assistance", hotline: "1-800-282-0880", notes: "HEAP (Home Energy Assistance Program) — Ohio's LIHEAP." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "CMHA (Cleveland) 216-348-5000. CHA (Columbus) 614-421-6000. CMHA (Cincinnati) 513-977-5800." },
  },
  OK: {
    SNAP:     { applicationUrl: "https://okdhslive.oklahoma.gov", hotline: "1-405-522-5050", notes: "Oklahoma SNAP (Food Benefits) through DHS." },
    Medicaid: { applicationUrl: "https://okdhslive.oklahoma.gov", hotline: "1-800-987-7767", notes: "Oklahoma Medicaid (SoonerCare)." },
    CHIP:     { applicationUrl: "https://okdhslive.oklahoma.gov", hotline: "1-800-987-7767", notes: "SoonerCare covers children." },
    WIC:      { applicationUrl: "https://oklahoma.gov/health/family-health/wic.html", hotline: "1-800-522-0203", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://okdhslive.oklahoma.gov", hotline: "1-405-521-3444", notes: "TANF through OK DHS." },
    LIHEAP:   { applicationUrl: "https://okdhslive.oklahoma.gov", hotline: "1-866-411-1234", notes: "Oklahoma LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "OHA (Oklahoma City) 405-239-7551. THA (Tulsa) 918-581-5775." },
  },
  OR: {
    SNAP:     { applicationUrl: "https://oregonconnects.oregon.gov", hotline: "1-800-699-9075", officeFinder: "https://www.oregon.gov/dhs/offices/Pages/index.aspx", notes: "Apply online at ONE (Oregon Eligibility) or your local DHS office." },
    Medicaid: { applicationUrl: "https://healthcare.oregon.gov", hotline: "1-800-699-9075", notes: "Oregon Health Plan (OHP) — Oregon's Medicaid." },
    CHIP:     { applicationUrl: "https://healthcare.oregon.gov", hotline: "1-800-699-9075", notes: "OHP covers children." },
    WIC:      { applicationUrl: "https://www.oregon.gov/oha/PH/HEALTHYPEOPLEFAMILIES/WIC/Pages/index.aspx", hotline: "1-800-SAFENET (1-800-723-3638)", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://oregonconnects.oregon.gov", hotline: "1-800-699-9075", notes: "TANF/JOBS program through Oregon DHS." },
    LIHEAP:   { applicationUrl: "https://www.oregon.gov/ohcs/for-individuals/Pages/housing-assistance.aspx", hotline: "1-800-453-5511", notes: "LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "PHB (Portland) 503-823-2375. Contact your local PHA." },
  },
  PA: {
    SNAP:     { applicationUrl: "https://compass.dhs.pa.gov", hotline: "1-800-692-7462", officeFinder: "https://www.dhs.pa.gov/Services/Assistance/Pages/CAO-Office-Locator.aspx", notes: "Apply at COMPASS or your local County Assistance Office (CAO)." },
    Medicaid: { applicationUrl: "https://compass.dhs.pa.gov", hotline: "1-800-692-7462", notes: "Pennsylvania Medical Assistance." },
    CHIP:     { applicationUrl: "https://compass.dhs.pa.gov", hotline: "1-800-986-CHIP (1-800-986-2447)", notes: "CHIP — Children's Health Insurance Program in PA." },
    WIC:      { applicationUrl: "https://www.pawic.com/", hotline: "1-800-WIC-WINS (1-800-942-9467)", officeFinder: "https://www.pawic.com/WICClinicLocator.aspx", notes: "Use the clinic locator or call." },
    TANF:     { applicationUrl: "https://compass.dhs.pa.gov", hotline: "1-800-692-7462", notes: "Cash Assistance (CA) — PA TANF." },
    LIHEAP:   { applicationUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/LIHEAP.aspx", hotline: "1-800-692-7462", notes: "PA LIHEAP — apply in the fall; funds are limited." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "PHA (Philadelphia) 215-684-4000. HACP (Pittsburgh) 412-456-5000." },
  },
  RI: {
    SNAP:     { applicationUrl: "https://ridhs.ri.gov", hotline: "1-855-MY-RIDHS (1-855-697-4347)", notes: "Rhode Island SNAP (RIte Care) through DHS." },
    Medicaid: { applicationUrl: "https://ridhs.ri.gov", hotline: "1-855-697-4347", notes: "Medicaid / RIte Care through RI DHS." },
    CHIP:     { applicationUrl: "https://ridhs.ri.gov", hotline: "1-855-697-4347", notes: "RIte Care covers children." },
    WIC:      { applicationUrl: "https://health.ri.gov/programs/wic/", hotline: "1-800-942-7434", notes: "Call for your nearest RI WIC site." },
    TANF:     { applicationUrl: "https://ridhs.ri.gov", hotline: "1-855-697-4347", notes: "FIP (Family Independence Program) — RI TANF." },
    LIHEAP:   { applicationUrl: "https://www.ridhs.ri.gov/benefits-assistance/home-heating-assistance/", hotline: "1-855-697-4347", notes: "LIHEAP through RI DHS." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "RIHA (Providence) 401-751-6400." },
  },
  SC: {
    SNAP:     { applicationUrl: "https://www.scdhhs.gov/snap", hotline: "1-888-549-0820", notes: "SC SNAP through SCDHHS." },
    Medicaid: { applicationUrl: "https://www.scdhhs.gov", hotline: "1-888-549-0820", notes: "South Carolina Medicaid." },
    CHIP:     { applicationUrl: "https://www.scdhhs.gov", hotline: "1-888-549-0820", notes: "Partners for Healthy Children — SC CHIP." },
    WIC:      { applicationUrl: "https://www.scdhec.gov/health/child-teen-health/wic", hotline: "1-800-868-0404", notes: "Call for your nearest SC WIC site." },
    TANF:     { applicationUrl: "https://www.dss.sc.gov/tanf/", hotline: "1-800-311-7220", notes: "SC TANF through DSS." },
    LIHEAP:   { applicationUrl: "https://www.dss.sc.gov/liheap", hotline: "1-800-311-7220", notes: "SC LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Columbia HA: 803-254-3886. Contact your local PHA." },
  },
  SD: {
    SNAP:     { applicationUrl: "https://dss.sd.gov/economicassistance/snap/", hotline: "1-877-999-5612", notes: "SD SNAP through DSS." },
    Medicaid: { applicationUrl: "https://dss.sd.gov/medicaid/", hotline: "1-800-597-1603", notes: "South Dakota Medicaid." },
    CHIP:     { applicationUrl: "https://dss.sd.gov/medicaid/", hotline: "1-800-597-1603", notes: "SD CHIP covered under Medicaid." },
    WIC:      { applicationUrl: "https://doh.sd.gov/topics/wic/", hotline: "1-800-738-2301", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://dss.sd.gov/economicassistance/tanf/", hotline: "1-877-999-5612", notes: "SD TANF through DSS." },
    LIHEAP:   { applicationUrl: "https://dss.sd.gov/energyassistance/", hotline: "1-800-442-2147", notes: "SD LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Sioux Falls HA: 605-367-8966." },
  },
  TN: {
    SNAP:     { applicationUrl: "https://www.tn.gov/humanservices/for-families/family-assistance/food-stamp-program.html", hotline: "1-866-311-4287", officeFinder: "https://www.tn.gov/humanservices/county-offices.html", notes: "Apply online or at your county DHS office." },
    Medicaid: { applicationUrl: "https://www.tn.gov/tenncare", hotline: "1-800-342-3145", notes: "TennCare — Tennessee's Medicaid managed care program." },
    CHIP:     { applicationUrl: "https://www.tn.gov/tenncare", hotline: "1-800-342-3145", notes: "TennCare covers children." },
    WIC:      { applicationUrl: "https://www.tn.gov/health/health-program-areas/fhw/wic.html", hotline: "1-800-342-3145", notes: "Call for your nearest WIC site." },
    TANF:     { applicationUrl: "https://www.tn.gov/humanservices/for-families/family-assistance/families-first.html", hotline: "1-866-311-4287", notes: "Families First — Tennessee TANF." },
    LIHEAP:   { applicationUrl: "https://www.tn.gov/humanservices/for-adults/community-services/energy-assistance.html", hotline: "1-800-836-6055", notes: "Low-Income Home Energy Assistance Program." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Nashville MHA: 615-252-8400. Memphis HA: 901-544-1100." },
  },
  TX: {
    SNAP:     { applicationUrl: "https://yourtexasbenefits.com", hotline: "2-1-1", officeFinder: "https://yourtexasbenefits.com/Learn/FindAnOffice", notes: "Apply online or visit a local Texas Health and Human Services office. Call 2-1-1 for assistance in any language." },
    Medicaid: { applicationUrl: "https://yourtexasbenefits.com", hotline: "1-800-252-8263", officeFinder: "https://yourtexasbenefits.com/Learn/FindAnOffice", notes: "Same portal as SNAP. Medicaid covers doctor visits, hospital, prescriptions, mental health." },
    CHIP:     { applicationUrl: "https://chipmedicaid.org", hotline: "1-800-647-6558", notes: "CHIP Medicaid — health coverage for children. Apply online or call." },
    WIC:      { applicationUrl: "https://texaswic.org", hotline: "1-800-942-3678", officeFinder: "https://texaswic.org/find-clinic", notes: "Find your nearest Texas WIC clinic at texaswic.org or call." },
    TANF:     { applicationUrl: "https://yourtexasbenefits.com", hotline: "2-1-1", notes: "Texas TANF averages $74/month for a family of 3. Work requirements apply. Apply at YourTexasBenefits." },
    LIHEAP:   { applicationUrl: "https://capmetx.org", hotline: "512-476-2417", notes: "Austin area: CAP Metro/LIHEAP 512-476-2417. Statewide: call 2-1-1 to find your local Community Action Agency." },
    CCDF:     { applicationUrl: "https://childcare.texas.gov", hotline: "1-877-541-7905", notes: "Texas Child Care Assistance Program (CCAP) through Texas HHSC." },
    Section8: { applicationUrl: "https://hacanline.org", hotline: "512-477-4488", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", notes: "Austin: HACA 512-477-4488. Dallas: DHA 214-951-8300. Houston: HHA 713-260-0500. San Antonio: SAHA 210-477-6000. Wait-list based — apply to multiple PHAs." },
  },
  UT: {
    SNAP:     { applicationUrl: "https://jobs.utah.gov/mycase", hotline: "1-866-435-7414", notes: "Utah SNAP through DWS." },
    Medicaid: { applicationUrl: "https://medicaid.utah.gov", hotline: "1-800-662-9651", notes: "Utah Medicaid." },
    CHIP:     { applicationUrl: "https://healthinsurance.utah.gov/chip/", hotline: "1-877-543-7669", notes: "CHIP — Utah Children's Health Insurance Program." },
    WIC:      { applicationUrl: "https://health.utah.gov/wic", hotline: "1-800-662-9651", notes: "Call for your nearest Utah WIC site." },
    TANF:     { applicationUrl: "https://jobs.utah.gov/mycase", hotline: "1-866-435-7414", notes: "FEP (Family Employment Program) — Utah TANF." },
    LIHEAP:   { applicationUrl: "https://jobs.utah.gov/mycase", hotline: "1-866-435-7414", notes: "Utah Home Energy Assistance Target Program (HEAT)." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "HASLC (Salt Lake City) 801-487-2161." },
  },
  VT: {
    SNAP:     { applicationUrl: "https://mybenefits.vt.gov", hotline: "1-800-479-6151", notes: "3SquaresVT — Vermont SNAP." },
    Medicaid: { applicationUrl: "https://mybenefits.vt.gov", hotline: "1-800-250-8427", notes: "Vermont Medicaid / Dr. Dynasaur." },
    CHIP:     { applicationUrl: "https://mybenefits.vt.gov", hotline: "1-800-250-8427", notes: "Dr. Dynasaur — Vermont's CHIP program." },
    WIC:      { applicationUrl: "https://www.healthvermont.gov/family/wic", hotline: "1-800-464-4343", notes: "Call for your nearest Vermont WIC site." },
    TANF:     { applicationUrl: "https://mybenefits.vt.gov", hotline: "1-800-479-6151", notes: "Reach Up — Vermont TANF." },
    LIHEAP:   { applicationUrl: "https://dcf.vermont.gov/benefits/lievheap", hotline: "1-800-479-6151", notes: "LIHEAP through Vermont DCF." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Vermont State Housing Authority: 802-828-3295." },
  },
  VA: {
    SNAP:     { applicationUrl: "https://commonhelp.virginia.gov", hotline: "1-855-635-4370", officeFinder: "https://www.dss.virginia.gov/localagency/", notes: "Apply at CommonHelp or your local Department of Social Services." },
    Medicaid: { applicationUrl: "https://commonhelp.virginia.gov", hotline: "1-800-552-3431", notes: "Virginia Medicaid." },
    CHIP:     { applicationUrl: "https://commonhelp.virginia.gov", hotline: "1-855-242-8282", notes: "FAMIS — Virginia CHIP." },
    WIC:      { applicationUrl: "https://www.vdh.virginia.gov/wic/", hotline: "1-800-WIC-WORK (1-800-942-9675)", officeFinder: "https://www.vdh.virginia.gov/wic/local-wic-agencies/", notes: "Call or use the locator to find your WIC site." },
    TANF:     { applicationUrl: "https://commonhelp.virginia.gov", hotline: "1-855-635-4370", notes: "Virginia TANF — work requirements apply." },
    LIHEAP:   { applicationUrl: "https://www.dss.virginia.gov/benefit/liheap.cgi", hotline: "1-855-635-4370", notes: "LIHEAP through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "RPHA (Richmond) 804-780-4200. Arlington HA: 703-228-1300." },
  },
  WA: {
    SNAP:     { applicationUrl: "https://www.washingtonconnection.org", hotline: "1-877-501-2233", officeFinder: "https://www.dshs.wa.gov/office-locator", notes: "Apply at Washington Connection or your local DSHS office." },
    Medicaid: { applicationUrl: "https://www.wahealthplanfinder.org", hotline: "1-855-923-4633", notes: "Apple Health — Washington Medicaid." },
    CHIP:     { applicationUrl: "https://www.wahealthplanfinder.org", hotline: "1-855-923-4633", notes: "Apple Health for Children." },
    WIC:      { applicationUrl: "https://www.doh.wa.gov/YouandYourFamily/WIC", hotline: "1-800-841-1410", officeFinder: "https://www.doh.wa.gov/YouandYourFamily/WIC/ContactaLocalWICClinic", notes: "Call or use the locator to find your WIC site." },
    TANF:     { applicationUrl: "https://www.washingtonconnection.org", hotline: "1-877-501-2233", notes: "TANF through DSHS." },
    LIHEAP:   { applicationUrl: "https://www.commerce.wa.gov/growing-the-economy/energy/low-income-energy-assistance/", hotline: "1-800-526-7145", notes: "WA State Energy Assistance through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "SHA (Seattle) 206-239-1500. Tacoma HA: 253-207-4400." },
  },
  WV: {
    SNAP:     { applicationUrl: "https://wvpath.wv.gov", hotline: "1-800-642-8589", notes: "WV SNAP through DHHR." },
    Medicaid: { applicationUrl: "https://dhhr.wv.gov/bms", hotline: "1-877-716-1212", notes: "West Virginia Medicaid." },
    CHIP:     { applicationUrl: "https://wvpath.wv.gov", hotline: "1-877-982-2447", notes: "WV CHIP." },
    WIC:      { applicationUrl: "https://dhhr.wv.gov/wic/", hotline: "1-800-642-9704", notes: "Call for your nearest WV WIC site." },
    TANF:     { applicationUrl: "https://wvpath.wv.gov", hotline: "1-800-642-8589", notes: "WV TANF — apply at WV PATH." },
    LIHEAP:   { applicationUrl: "https://dhhr.wv.gov/bcf/liheap", hotline: "1-800-642-8589", notes: "WV LIHEAP through DHHR." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "WVHDF administers vouchers. Huntington HA: 304-529-3353." },
  },
  WI: {
    SNAP:     { applicationUrl: "https://access.wi.gov", hotline: "1-800-362-3002", officeFinder: "https://www.dhs.wisconsin.gov/county/index.htm", notes: "FoodShare Wisconsin — apply at ACCESS or your county DHHS." },
    Medicaid: { applicationUrl: "https://access.wi.gov", hotline: "1-800-362-3002", notes: "Wisconsin Medicaid / BadgerCare Plus." },
    CHIP:     { applicationUrl: "https://access.wi.gov", hotline: "1-800-362-3002", notes: "BadgerCare Plus covers children." },
    WIC:      { applicationUrl: "https://www.dhs.wisconsin.gov/wic/", hotline: "1-800-722-2295", officeFinder: "https://www.wiclocator.dhs.wi.gov/", notes: "Use the WIC locator or call." },
    TANF:     { applicationUrl: "https://access.wi.gov", hotline: "1-888-794-5556", notes: "Wisconsin Works (W-2) — Wisconsin TANF." },
    LIHEAP:   { applicationUrl: "https://www.dhs.wisconsin.gov/ea/", hotline: "1-866-432-8931", notes: "Energy Assistance through local Community Action Agencies." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "HACM (Milwaukee) 414-286-5000. MMHA (Madison) 608-257-2061." },
  },
  WY: {
    SNAP:     { applicationUrl: "https://dfs.wyo.gov/snap/", hotline: "1-307-777-6789", notes: "Wyoming SNAP through DFS." },
    Medicaid: { applicationUrl: "https://health.wyo.gov/healthcarefin/medicaid/", hotline: "1-800-251-1269", notes: "Wyoming Medicaid." },
    CHIP:     { applicationUrl: "https://kidcare.wyo.gov/", hotline: "1-888-996-8786", notes: "Wyoming KidCare CHIP." },
    WIC:      { applicationUrl: "https://health.wyo.gov/familyhealth/wic/", hotline: "1-307-777-6921", notes: "Call for your nearest WY WIC site." },
    TANF:     { applicationUrl: "https://dfs.wyo.gov/tanf/", hotline: "1-307-777-6789", notes: "POWER (Personal Opportunities with Employment Responsibilities) — WY TANF." },
    LIHEAP:   { applicationUrl: "https://dfs.wyo.gov/liheap", hotline: "1-307-777-6789", notes: "Wyoming LIHEAP through DFS." },
    Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Wyoming Community Development Authority: 307-265-0603." },
  },
};

// ── National fallbacks (used when a state override doesn't exist for a program) ──
const NATIONAL_FALLBACK: Record<string, BenefitNavEntry> = {
  SNAP:     { applicationUrl: "https://www.fns.usda.gov/snap/apply", officeFinder: "https://www.fns.usda.gov/snap/retailer-locator", hotline: "2-1-1", notes: "Call 2-1-1 to find your local SNAP office." },
  Medicaid: { applicationUrl: "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/", officeFinder: "https://www.medicaid.gov/about-us/where-can-i-get-help/index.html", hotline: "1-800-318-2596", notes: "Apply through your state Medicaid agency." },
  CHIP:     { applicationUrl: "https://www.insurekidsnow.gov/", hotline: "1-877-543-7669", notes: "CHIP varies by state — call 1-877-KIDS-NOW for help." },
  WIC:      { applicationUrl: "https://www.fns.usda.gov/wic", hotline: "1-800-942-3678", notes: "Call or visit fns.usda.gov/wic to find your state WIC program." },
  TANF:     { applicationUrl: "https://www.acf.hhs.gov/ofa/programs/tanf", officeFinder: "https://www.benefits.gov/benefit/722", hotline: "2-1-1", notes: "Apply at your local Department of Social Services." },
  LIHEAP:   { applicationUrl: "https://www.acf.hhs.gov/ocs/liheap-apply", hotline: "1-866-674-6327", notes: "Apply through your local Community Action Agency." },
  CCDF:     { applicationUrl: "https://childcare.gov/", hotline: "1-800-424-2246", notes: "Childcare assistance varies by state — visit childcare.gov." },
  Section8: { applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", officeFinder: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts", hotline: "1-800-669-9777", notes: "Housing Choice Voucher: contact your local Public Housing Authority (PHA). Waitlists can be long — apply to multiple." },
};

/**
 * Get navigation info for a specific benefit program in a given state.
 * Priority: state-specific override > national fallback > federal catalog.
 */
export function getBenefitNav(
  state: string | undefined,
  programCode: string,
): BenefitNavEntry | null {
  const usps = (state || "").toUpperCase();

  // Federal programs are the same everywhere
  if (FEDERAL[programCode]) return FEDERAL[programCode];

  // State-specific override
  const stateEntry = STATE_NAV[usps]?.[programCode];
  if (stateEntry) return stateEntry;

  // National fallback
  return NATIONAL_FALLBACK[programCode] || null;
}

/**
 * Get all navigation entries for a list of programs in a given state.
 */
export function getNavigationGuides(
  state: string | undefined,
  programs: string[],
): Record<string, BenefitNavEntry> {
  const result: Record<string, BenefitNavEntry> = {};
  for (const code of programs) {
    const nav = getBenefitNav(state, code);
    if (nav) result[code] = nav;
  }
  return result;
}
