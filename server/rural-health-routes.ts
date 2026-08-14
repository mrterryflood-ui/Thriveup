/**
 * Rural Healthcare Hub
 * Sources: HRSA Data Warehouse · HRSA Find a Health Center ·
 *          USDA ERS Rural Health · AgriStress Helpline ·
 *          CMS Telehealth · Rural Hospital closure data
 */
import { type Request, type Response } from "express";
import { db } from "./storage";

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, {
    headers: { "User-Agent": "ThriveUp-RuralHealth/1.0 (terryflood@thrivingcommunitiesforall.com)", "Accept": "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
  return r.json();
}

const STATE_FIPS: Record<string, string> = {
  AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
  HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
  MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
  NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
  SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",
};

// HRSA HPSA data for a state — whether area is a Health Professional Shortage Area
export async function getHpsaData(stateFips: string, facilityType: "Primary Medical Care" | "Dental Health" | "Mental Health" = "Primary Medical Care") {
  try {
    const typeCode = facilityType === "Primary Medical Care" ? "1" : facilityType === "Dental Health" ? "2" : "3";
    const url = `https://data.hrsa.gov/api/download/datafile?filename=BCD_HPSA_FCT_DET_P.csv`;
    // Use HRSA's query API instead
    const apiUrl = `https://data.hrsa.gov/api/search/json?query=hpsa&State=${stateFips}&HPSAType=${typeCode}&limit=20`;
    const data = await fetchJson(apiUrl);
    return data;
  } catch {
    // Return structured static data about shortage areas
    return null;
  }
}

// HRSA Find a Health Center (FQHC) near a location
async function getFqhc(lat: number, lng: number, radiusMiles = 50) {
  try {
    const url = `https://findahealthcenter.hrsa.gov/api/findahealthcenter?latitude=${lat}&longitude=${lng}&distance=${radiusMiles}&resultCount=20`;
    const data = await fetchJson(url);
    return (data || []).map((c: any) => ({
      name: c.SiteName || c.BHCName,
      address: `${c.SiteAddress1 || ""}, ${c.SiteCity || ""}, ${c.SiteStateAbbreviation || ""} ${c.SiteZipCode || ""}`.trim(),
      phone: c.SitePhoneNumber,
      distanceMiles: c.Distance,
      slidingScale: true,
      acceptsMedicaid: c.MedicaidAccepted === "Y",
      acceptsMedicare: c.MedicareAccepted === "Y",
      acceptsUninsured: true,
      telehealth: c.TelehealthAvailable === "Y" || c.VirtualVisit === "Y",
      url: c.SiteWebsite,
      lat: c.SiteLatitude,
      lng: c.SiteLongitude,
      source: "HRSA Find a Health Center",
    }));
  } catch (e: any) {
    console.error("[RuralHealth] FQHC error:", e.message);
    return [];
  }
}

// Farm stress resources — documented crisis: farmers/ranchers have an elevated suicide
// rate versus the general population (CDC/NIOSH occupational mortality surveillance;
// commonly cited multiplier is ~3.5x, varies by study year and occupational classification).
function getFarmStressResources(state: string) {
  return {
    crisis: {
      hotlines: [
        { name: "988 Suicide & Crisis Lifeline", number: "988", available: "24/7", note: "Press 2 for Veterans" },
        { name: "AgriStress Helpline (Farm-Specific)", number: "1-833-897-2474", available: "24/7", note: "Trained in farm financial stress" },
        { name: "Farm Aid Hotline", number: "1-800-FARM-AID", available: "Mon-Fri 9am-5pm ET", note: "Farm financial crisis, referrals" },
        { name: "Crisis Text Line", number: "Text HOME to 741741", available: "24/7", note: "Text-based crisis support" },
      ],
      stateResources: getStateFarmStressResources(state),
    },
    mentalHealth: {
      programName: "Farm and Ranch Stress Assistance Network (FRSAN)",
      administrator: "USDA NIFA",
      description: "USDA funds state networks of farm stress counselors, financial counselors, and rural mental health resources.",
      findCounselor: `https://www.extension.org/farm-stress/`,
      source: "USDA NIFA FRSAN",
    },
    financialCounseling: {
      name: "Farm Financial Counseling",
      programs: [
        { name: "USDA Farm Service Agency (FSA) Farm Loan Programs", url: "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/index", note: "Emergency loans, loan servicing" },
        { name: "Farmers Legal Action Group (FLAG)", url: "https://www.flaginc.org/", note: "Free legal help for financially distressed farmers" },
        { name: "Land Stewardship Project Farm Legal & Financial Counseling", url: "https://landstewardshipproject.org/", note: "MN, IA, WI — farm financial crisis" },
      ],
    },
    stigmaNote: "Farm stress and mental health struggles are documented, not weakness. Multiple farm-stress surveys report roughly 1 in 3 farmers experiencing significant psychological distress. Resources are confidential.",
    source: "CDC/NIOSH occupational mortality surveillance; USDA NIFA Farm and Ranch Stress Assistance Network survey data",
  };
}

function getStateFarmStressResources(state: string): any[] {
  const resources: Record<string, any[]> = {
    TX: [{ name: "Texas AgriLife Extension Farm Stress", url: "https://aglifesciences.tamu.edu/", phone: "1-888-900-4055" }],
    IA: [{ name: "Iowa State University Extension Farm Stress Line", url: "https://www.extension.iastate.edu/", phone: "1-800-447-1985" }],
    MN: [{ name: "Minnesota Farm & Rural Helpline", url: "https://www.mda.state.mn.us/farmstress", phone: "1-833-600-2670" }],
    WI: [{ name: "Wisconsin Farm Center", url: "https://datcp.wi.gov/Pages/Programs_Services/WFCOverview.aspx", phone: "1-800-942-2474" }],
    IN: [{ name: "Indiana's Agricultural Mental Health Program", url: "https://www.purdue.edu/agriculture/", phone: "1-800-225-4246" }],
    OH: [{ name: "OSU Extension Farm Stress", url: "https://ohioline.osu.edu/", phone: "1-800-589-8764" }],
    KS: [{ name: "Kansas Farm Mediation", url: "https://www.agriculture.ks.gov/", phone: "1-800-321-3276" }],
    NE: [{ name: "Nebraska Farm Hotline", url: "https://extension.unl.edu/", phone: "1-800-464-0258" }],
  };
  return resources[state] || [{ name: `${state} Cooperative Extension", url: "https://www.nifa.usda.gov/about-nifa/how-we-work/extension`, phone: "Contact your county extension office" }];
}

// Rural hospital vulnerability data
export function getRuralHospitalContext(state: string) {
  const AT_RISK_STATES: Record<string, any> = {
    TX: { atRisk: 22, closed2010: 26, criticalAccess: 89, note: "Largest number of rural hospital closures nationally" },
    GA: { atRisk: 17, closed2010: 11, criticalAccess: 51 },
    TN: { atRisk: 12, closed2010: 12, criticalAccess: 14 },
    KY: { atRisk: 11, closed2010: 9, criticalAccess: 25 },
    MS: { atRisk: 10, closed2010: 8, criticalAccess: 35 },
    AL: { atRisk: 10, closed2010: 12, criticalAccess: 22 },
    OK: { atRisk: 9, closed2010: 9, criticalAccess: 35 },
    KS: { atRisk: 8, closed2010: 8, criticalAccess: 83 },
    MO: { atRisk: 8, closed2010: 10, criticalAccess: 36 },
    NE: { atRisk: 6, closed2010: 4, criticalAccess: 64 },
    ND: { atRisk: 5, closed2010: 3, criticalAccess: 36 },
    SD: { atRisk: 5, closed2010: 2, criticalAccess: 36 },
  };
  const stateData = AT_RISK_STATES[state] || {};
  return {
    state,
    hospitalsAtRisk: stateData.atRisk || null,
    closedSince2010: stateData.closed2010 || null,
    criticalAccessHospitals: stateData.criticalAccess || null,
    nationalContext: { totalClosedSince2010: 194, totalAtRisk: 453 },
    note: stateData.note || null,
    findHospital: `https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/cahs`,
    ruralHealthInfo: "https://www.ruralhealthinfo.org/topics/hospitals",
    source: "Chartis Center for Rural Health / USDA ERS",
  };
}

// Telehealth eligibility
function getTelehealthEligibility(isRural: boolean, isMedicare: boolean, isMedicaid: boolean, state: string) {
  return {
    permanentExpansions: [
      { program: "Medicare", benefit: "Telehealth visits at home (no originating site requirement)", permanent: true },
      { program: "Medicare", benefit: "Mental health telehealth — annual in-person visit required after first 12 months", permanent: true },
      { program: "Medicare", benefit: "Federally Qualified Health Centers & Rural Health Clinics as distant sites", permanent: true },
      { program: "Medicare", benefit: "Audio-only telehealth for established patients", permanent: true },
    ],
    ruralSpecific: isRural ? [
      { program: "Medicare Rural Health Clinic (RHC)", benefit: "RHCs can serve as distant sites for telehealth", permanent: true },
      { program: "USDA Distance Learning & Telemedicine Grant", benefit: "Infrastructure funding for rural broadband/telehealth", url: "https://www.rd.usda.gov/programs-services/distance-learning-telemedicine-grants" },
    ] : [],
    medicaid: { note: `${state} Medicaid telehealth coverage varies — contact your state Medicaid office`, url: `https://www.medicaid.gov/` },
    findProvider: "https://telehealth.hhs.gov/",
    source: "CMS / HHS Telehealth.HHS.gov",
  };
}

// Rural maternal health — maternity desert assessment
function getRuralMaternalHealthContext(state: string) {
  const DESERT_STATES: Record<string, any> = {
    TX: { countiesWithNoOB: 173, totalCounties: 254, desertPct: 68, maternalMortRuralVsUrban: "1.9x" },
    GA: { countiesWithNoOB: 79, totalCounties: 159, desertPct: 50 },
    MS: { countiesWithNoOB: 51, totalCounties: 82, desertPct: 62 },
    AL: { countiesWithNoOB: 45, totalCounties: 67, desertPct: 67 },
    AR: { countiesWithNoOB: 47, totalCounties: 75, desertPct: 63 },
    OK: { countiesWithNoOB: 54, totalCounties: 77, desertPct: 70 },
    KY: { countiesWithNoOB: 60, totalCounties: 120, desertPct: 50 },
    LA: { countiesWithNoOB: 37, totalCounties: 64, desertPct: 58 },
  };
  const s = DESERT_STATES[state] || {};
  return {
    state,
    context: s,
    nationalFact: "Rural counties have 60% higher maternal mortality than urban counties (CDC 2023)",
    solutions: [
      "Community paramedicine — paramedics doing prenatal home visits",
      "Telehealth OB care — remote monitoring for high-risk pregnancies",
      "Certified Nurse Midwives — can provide care in rural settings without OB present",
      "HRSA Rural Maternity & Obstetrics Management Strategies (RMOMS) program",
    ],
    hrsa: { program: "RMOMS", url: "https://www.hrsa.gov/rural-health/rural-hospital-programs/rmoms" },
    marchOfDimes: "https://www.marchofdimes.org/research/maternity-care-deserts-report",
    source: "March of Dimes / CDC / HRSA",
  };
}

export function registerRuralHealthRoutes(app: any) {

  // FQHC finder by lat/lng
  app.get("/api/rural-health/fqhc", async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius as string || "50");
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: "lat and lng required" });
    try {
      const centers = await getFqhc(lat, lng, radius);
      res.json({ centers, total: centers.length, radiusMiles: radius, source: "HRSA Find a Health Center" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Farm stress resources
  app.get("/api/rural-health/farm-stress", (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    res.json(getFarmStressResources(state));
  });

  // Rural hospital context
  app.get("/api/rural-health/hospitals", (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    res.json(getRuralHospitalContext(state));
  });

  // Telehealth eligibility
  app.get("/api/rural-health/telehealth", (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    const isRural = req.query.rural !== "false";
    const isMedicare = req.query.medicare === "true";
    const isMedicaid = req.query.medicaid === "true";
    res.json(getTelehealthEligibility(isRural, isMedicare, isMedicaid, state));
  });

  // Maternal health context
  app.get("/api/rural-health/maternal", (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    res.json(getRuralMaternalHealthContext(state));
  });

  // Comprehensive health screener — single endpoint for full health picture
  app.get("/api/rural-health/snapshot", async (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    const lat = parseFloat(req.query.lat as string || "30.26");
    const lng = parseFloat(req.query.lng as string || "-97.74");
    try {
      const [fqhc, farmStress, hospitals, telehealth, maternal] = await Promise.allSettled([
        getFqhc(lat, lng, 60),
        Promise.resolve(getFarmStressResources(state)),
        Promise.resolve(getRuralHospitalContext(state)),
        Promise.resolve(getTelehealthEligibility(true, false, false, state)),
        Promise.resolve(getRuralMaternalHealthContext(state)),
      ]);
      const v = (r: any, fallback: any) => r.status === "fulfilled" ? r.value : fallback;
      res.json({
        state,
        generatedAt: new Date().toISOString(),
        fqhc: v(fqhc, []),
        farmStress: v(farmStress, {}),
        hospitals: v(hospitals, {}),
        telehealth: v(telehealth, {}),
        maternal: v(maternal, {}),
        nationalResources: {
          ruralHealthInfo: "https://www.ruralhealthinfo.org/",
          hrsa: "https://www.hrsa.gov/rural-health",
          agriStress: "1-833-897-2474",
          crisis988: "988",
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // HRSA grant programs for rural health
  app.get("/api/rural-health/grants", (_req: Request, res: Response) => {
    res.json({
      programs: [
        { name: "HRSA Rural Health Care Services Outreach", amount: "Up to $500K/yr", deadline: "Rolling", url: "https://www.hrsa.gov/grants/find-funding" },
        { name: "HRSA Small Health Care Provider Quality Improvement", amount: "Up to $200K/yr", url: "https://www.hrsa.gov/grants" },
        { name: "USDA Distance Learning & Telemedicine", amount: "$50K–$1M", url: "https://www.rd.usda.gov/programs-services/distance-learning-telemedicine-grants" },
        { name: "HRSA Rural Communities Opioid Response", amount: "Up to $750K", url: "https://www.hrsa.gov/rural-health/rcorp" },
        { name: "SAMHSA Rural Behavioral Health", amount: "Varies", url: "https://www.samhsa.gov/grants" },
        { name: "CDC Rural Public Health Capacity Building", amount: "Varies", url: "https://www.cdc.gov/ruralpublichealth/" },
        { name: "USDA FRSAN Farm Stress", amount: "Up to $2M (state networks)", url: "https://www.nifa.usda.gov/grants/programs/farm-ranch-stress-assistance-network-frsan" },
        { name: "HHS Maternal & Child Health Rural", amount: "Varies", url: "https://mchb.hrsa.gov/" },
      ],
      source: "HRSA / USDA NIFA / SAMHSA / CDC",
    });
  });
}
