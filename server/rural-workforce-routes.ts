/**
 * Rural Education & Ag Workforce Pipeline
 * Sources: USDA NIFA · USDA FSA Beginning Farmer · NFJP · FFA · 4-H ·
 *          Land-grant extension · Hispanic-Serving Ag Colleges ·
 *          USDA 1890 HBCUs · Census occupational data
 */
import { type Request, type Response } from "express";

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, {
    headers: { "User-Agent": "ThriveUp-RuralWorkforce/1.0 (terryflood@thrivingcommunitiesforall.com)", "Accept": "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const AG_CAREERS = [
  { title: "Precision Agriculture Technician", medianWage: 58000, growth: "13% (faster than avg)", credential: "Certified Crop Adviser (CCA)", daysToCredential: 180, path: "technical" },
  { title: "Agricultural Service Representative (FSA/NRCS)", medianWage: 62000, growth: "5%", credential: "USDA civil service", daysToCredential: 60, path: "government" },
  { title: "Certified Crop Adviser (CCA)", medianWage: 65000, growth: "8%", credential: "American Society of Agronomy", daysToCredential: 365, path: "technical" },
  { title: "Soil Conservation Technician", medianWage: 56000, growth: "9%", credential: "NRCS CPESC", daysToCredential: 240, path: "conservation" },
  { title: "Farm Manager", medianWage: 75000, growth: "6%", credential: "Accredited Farm Manager (AFM)", daysToCredential: 365, path: "management" },
  { title: "Community Health Worker (Ag)", medianWage: 48000, growth: "14%", credential: "State CHW certification", daysToCredential: 120, path: "health" },
  { title: "Agricultural Loan Officer", medianWage: 78000, growth: "4%", credential: "USDA Direct Loan training", daysToCredential: 90, path: "finance" },
  { title: "Irrigation Specialist / CPSS", medianWage: 62000, growth: "7%", credential: "Certified Professional Soil Scientist", daysToCredential: 365, path: "technical" },
  { title: "Organic Inspector / Certifier", medianWage: 52000, growth: "11%", credential: "IOIA Organic Inspector", daysToCredential: 120, path: "compliance" },
  { title: "Rural Electric Cooperative Technician", medianWage: 68000, growth: "6%", credential: "NRECA certification", daysToCredential: 90, path: "energy" },
  { title: "Veterinary Technician (Livestock)", medianWage: 48000, growth: "20%", credential: "AVMA-accredited Vet Tech (NAVTA)", daysToCredential: 730, path: "animal" },
  { title: "Farmers Market Manager", medianWage: 42000, growth: "9%", credential: "FMC Farmers Market Manager", daysToCredential: 60, path: "market" },
  { title: "Cover Crop / NRCS Technical Service Provider", medianWage: 64000, growth: "12%", credential: "NRCS TSP Certification", daysToCredential: 180, path: "conservation" },
];

const TRAINING_PROGRAMS = [
  {
    name: "National Farmworker Jobs Program (NFJP)",
    administrator: "USDOL",
    description: "Job training, job placement, and related assistance for migrant and seasonal farmworkers. Covers training costs, supportive services, and job placement.",
    eligibility: "Seasonal or migrant agricultural worker or dependent; income at or below 150% of poverty line",
    fundingAvailable: "Training costs fully covered",
    duration: "Varies — vocational training to credential programs",
    url: "https://www.dol.gov/agencies/eta/agriculture",
    locations: "Contact your state workforce agency",
    equityNote: "Serves disproportionately Hispanic/Latino, immigrant, and low-income agricultural workers",
  },
  {
    name: "USDA Beginning Farmer & Rancher Development Program (BFRDP)",
    administrator: "USDA NIFA",
    description: "Training, education, outreach, and technical assistance specifically for beginning farmers and ranchers.",
    eligibility: "Farming for fewer than 10 years",
    funding: "$250K–$750K to organizations — participants attend free",
    duration: "Varies by program",
    url: "https://www.nifa.usda.gov/grants/programs/beginning-farmer-rancher-development-program-bfrdp",
    equityNote: "Priority to socially disadvantaged, veteran, and limited-resource beginning farmers",
  },
  {
    name: "USDA 1890 Scholars Program",
    administrator: "USDA / 1890 HBCUs",
    description: "Full scholarships for students attending 1890 HBCU land-grant institutions, with placement into USDA careers upon graduation.",
    eligibility: "Enrolled at 1890 HBCU; pursuing ag-related degree",
    funding: "Full tuition, fees, books, room and board, summer internships, and job offer",
    url: "https://www.usda.gov/our-agency/careers/students-and-graduates/1890-scholars",
    equityNote: "Specifically for HBCU students — pipeline to USDA careers for Black agricultural professionals",
  },
  {
    name: "USDA Hispanic-Serving Agricultural Colleges & Universities (HSACU)",
    administrator: "USDA NIFA",
    description: "Grants to HSACs to strengthen agriculture programs serving Hispanic students in rural areas.",
    url: "https://www.nifa.usda.gov/grants/programs/capacity-grants/ep-hispanic-serving-agricultural-colleges-universities",
    equityNote: "Targets Hispanic/Latino students in agricultural education",
  },
  {
    name: "National FFA Organization",
    administrator: "National FFA / USDA",
    description: "The premier agricultural education organization for youth (grades 7-12). Career development, scholarships, leadership, supervised agricultural experiences.",
    url: "https://www.ffa.org/",
    scholarships: "Hundreds of scholarships ranging $1,000–$25,000",
    programs: ["FFA Supervised Agricultural Experience (SAE)", "FFA Career Development Events", "Agricultural Science coursework"],
  },
  {
    name: "4-H Agricultural Programs",
    administrator: "USDA NIFA / Land-grant universities",
    description: "Nation's largest youth development organization — agricultural literacy, hands-on projects, livestock programs, ag careers exploration.",
    url: "https://4-h.org/",
    ruralFocus: true,
  },
  {
    name: "Jumpstart Farm Program (USDA / Ag Lenders)",
    administrator: "USDA FSA",
    description: "Down payment loan program for beginning farmers — farm ownership loans with lower down payment requirements.",
    eligibility: "Beginning farmer, farming < 10 years, not owned farm > 30% of county's average farm size",
    maxLoan: "45% of purchase price, up to $300,150",
    downPayment: "5% minimum from borrower's own funds",
    url: "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/beginning-farmers-and-ranchers/index",
  },
];

const CREDENTIALS = [
  { name: "Certified Crop Adviser (CCA)", org: "American Society of Agronomy", url: "https://www.agronomy.org/certifications/cca", relevance: ["farm-profitability","ag-trade-sims"], studyTime: "6-12 months" },
  { name: "Certified Professional Agronomist (CPAg)", org: "American Society of Agronomy", url: "https://www.agronomy.org/certifications/cpag", relevance: ["soil-amendment","cover-crops"], studyTime: "3-5 years experience required" },
  { name: "Certified Professional Soil Scientist (CPSS)", org: "Soil Science Society of America", url: "https://www.soils.org/certification/cpss", relevance: ["soil-amendment"], studyTime: "2-5 years" },
  { name: "NRCS Technical Service Provider (TSP)", org: "USDA NRCS", url: "https://www.nrcs.usda.gov/getting-assistance/other/technical-service-providers", relevance: ["eqip","conservation"], studyTime: "3-6 months" },
  { name: "Certified Farm Manager (AFM)", org: "American Society of Farm Managers & Rural Appraisers", url: "https://www.asfmra.org/", relevance: ["farm-management"], studyTime: "5 years experience" },
  { name: "Pesticide Applicator License", org: "State Department of Agriculture", url: "https://www.epa.gov/pesticide-applicator-certification-and-training", relevance: ["invasive-species","crop-protection"], studyTime: "1-3 months per category" },
  { name: "Organic Inspector (IOIA)", org: "International Organic Inspectors Association", url: "https://www.ioia.net/", relevance: ["organic-certification"], studyTime: "6 months" },
  { name: "USDA Organic System Plan Manager", org: "USDA AMS / Accredited Certifiers", url: "https://www.ams.usda.gov/rules-regulations/organic/certifiers", relevance: ["organic-farming"], studyTime: "varies" },
  { name: "Dairy Grazing Apprenticeship", org: "GLCI / Dairy Grazing Apprenticeship", url: "https://dairygrazingapprenticeship.org/", relevance: ["livestock","dairy"], studyTime: "2 years registered apprenticeship" },
  { name: "Beginning Farmer USDA Financial Training", org: "USDA FSA", url: "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/beginning-farmers-and-ranchers/index", relevance: ["farm-finance"], studyTime: "1-3 months" },
];

// Census occupational wage data for ag jobs
async function getAgWageData(stateFips: string) {
  const censusBit = process.env.CENSUS_API_KEY ? `&key=${process.env.CENSUS_API_KEY}` : "";
  try {
    // C24010: occupation by sex; B24022: occupation by sex & median earnings
    const url = `https://api.census.gov/data/2022/acs/acs5?get=B24022_003E,B24022_004E,B24022_005E,B24022_006E,B01003_001E,NAME&for=state:${stateFips}${censusBit}`;
    const data = await fetchJson(url);
    if (data?.[1]) {
      return {
        state: stateFips,
        agManagementMedianEarnings: data[1][0],
        agSupportMedianEarnings: data[1][1],
        source: "U.S. Census ACS 5-year 2022",
      };
    }
    return null;
  } catch { return null; }
}

// Land-grant universities by state
function getLandGrantsByState(state: string) {
  const LAND_GRANTS: Record<string, { name: string; url: string; isHBCU?: boolean; isHSI?: boolean }[]> = {
    TX: [
      { name: "Texas A&M University", url: "https://www.tamu.edu/" },
      { name: "Prairie View A&M (1890 HBCU)", url: "https://www.pvamu.edu/", isHBCU: true },
    ],
    FL: [
      { name: "University of Florida (IFAS)", url: "https://ifas.ufl.edu/" },
      { name: "Florida A&M (1890 HBCU)", url: "https://www.famu.edu/", isHBCU: true },
    ],
    GA: [
      { name: "University of Georgia", url: "https://www.uga.edu/" },
      { name: "Fort Valley State (1890 HBCU)", url: "https://www.fvsu.edu/", isHBCU: true },
    ],
    IA: [{ name: "Iowa State University", url: "https://www.iastate.edu/" }],
    MN: [{ name: "University of Minnesota", url: "https://www.umn.edu/" }],
    NC: [
      { name: "NC State", url: "https://www.ncsu.edu/" },
      { name: "NC A&T (1890 HBCU)", url: "https://www.ncat.edu/", isHBCU: true },
    ],
    MS: [
      { name: "Mississippi State University", url: "https://www.msstate.edu/" },
      { name: "Alcorn State (1890 HBCU)", url: "https://www.alcorn.edu/", isHBCU: true },
    ],
    AL: [
      { name: "Auburn University", url: "https://www.auburn.edu/" },
      { name: "Alabama A&M (1890 HBCU)", url: "https://www.aamu.edu/", isHBCU: true },
      { name: "Tuskegee University (1890 HBCU)", url: "https://www.tuskegee.edu/", isHBCU: true },
    ],
  };
  return LAND_GRANTS[state] || [{ name: "Find your land-grant university", url: "https://www.nasulgc.org/about/land-grant-universities/" }];
}

export function registerRuralWorkforceRoutes(app: any) {

  // Ag career explorer
  app.get("/api/rural-workforce/careers", (req: Request, res: Response) => {
    const path = req.query.path as string || "";
    const filtered = path ? AG_CAREERS.filter(c => c.path === path) : AG_CAREERS;
    res.json({
      careers: filtered,
      paths: [...new Set(AG_CAREERS.map(c => c.path))],
      source: "BLS Occupational Outlook Handbook / ASA / NRCS",
    });
  });

  // Training programs
  app.get("/api/rural-workforce/training", (req: Request, res: Response) => {
    res.json({ programs: TRAINING_PROGRAMS, source: "USDA NIFA / USDOL / FFA / 4-H" });
  });

  // Credentials
  app.get("/api/rural-workforce/credentials", (req: Request, res: Response) => {
    const relevance = req.query.relevance as string || "";
    const filtered = relevance ? CREDENTIALS.filter(c => c.relevance.some(r => r.includes(relevance))) : CREDENTIALS;
    res.json({ credentials: filtered, source: "ASA / SSSA / NRCS / EPA / IOIA" });
  });

  // Land-grant universities
  app.get("/api/rural-workforce/land-grants", (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    res.json({
      state,
      universities: getLandGrantsByState(state),
      extensionFinder: `https://www.extension.org/state-extension-offices/`,
      nifaLandGrant: "https://www.nifa.usda.gov/about-nifa/how-we-work/extension",
      source: "USDA NIFA / NASULGC",
    });
  });

  // Wage data
  app.get("/api/rural-workforce/wages", async (req: Request, res: Response) => {
    const stateFips = req.query.stateFips as string || "48";
    try {
      const data = await getAgWageData(stateFips);
      res.json({
        ...data,
        nationalAgWage: { median: 43800, source: "BLS 2023" },
        careers: AG_CAREERS.map(c => ({ title: c.title, medianWage: c.medianWage, growth: c.growth })),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Pathway builder — given worker profile, recommend training path
  app.post("/api/rural-workforce/pathway", (req: Request, res: Response) => {
    const { currentRole = "farmworker", educationLevel = "high-school", goals = [], state = "TX", isNfjpEligible = false } = req.body;
    const s = (state as string).toUpperCase();

    const recommended: any[] = [];

    // NFJP first if eligible
    if (isNfjpEligible) {
      recommended.push(TRAINING_PROGRAMS[0]); // NFJP
    }

    // Education level gates
    const canDoTechnical = ["some-college","associate","bachelor","graduate"].includes(educationLevel);
    const canDoManagement = ["bachelor","graduate"].includes(educationLevel);

    const relevantCareers = AG_CAREERS.filter(c => {
      if (!canDoTechnical && c.path === "technical") return false;
      if (!canDoManagement && c.path === "management") return false;
      if (Array.isArray(goals) && goals.length > 0) {
        return goals.some((g: string) => c.path.includes(g) || c.title.toLowerCase().includes(g.toLowerCase()));
      }
      return true;
    }).slice(0, 4);

    const relevantCredentials = CREDENTIALS.filter(c =>
      relevantCareers.some(rc => c.relevance.some(r => rc.path.includes(r) || rc.title.toLowerCase().includes(r)))
    ).slice(0, 3);

    res.json({
      profile: { currentRole, educationLevel, goals, state: s },
      pathway: {
        immediateSteps: [
          isNfjpEligible && "Apply to National Farmworker Jobs Program (NFJP) — covers training costs",
          canDoTechnical && "Enroll in USDA Beginning Farmer training through your local extension office",
          "Connect with your land-grant university extension county office",
        ].filter(Boolean),
        recommendedCareers: relevantCareers,
        recommendedCredentials: relevantCredentials,
        recommendedPrograms: TRAINING_PROGRAMS.filter(p => isNfjpEligible || p.name !== "NFJP"),
        landGrants: getLandGrantsByState(s),
      },
      resources: {
        extensionFinder: `https://www.extension.org/state-extension-offices/`,
        nfjpLocator: "https://www.dol.gov/agencies/eta/agriculture",
        bfrdpLocator: "https://www.nifa.usda.gov/grants/programs/beginning-farmer-rancher-development-program-bfrdp",
        careerOneStop: "https://www.careeronestop.org/",
      },
    });
  });

  // Education gap assessment for a county using Census
  app.get("/api/rural-workforce/education-gap", async (req: Request, res: Response) => {
    const stateFips = req.query.stateFips as string || "48";
    const countyFips = req.query.countyFips as string || "453";
    const censusBit = process.env.CENSUS_API_KEY ? `&key=${process.env.CENSUS_API_KEY}` : "";
    try {
      const url = `https://api.census.gov/data/2022/acs/acs5?get=B15003_002E,B15003_017E,B15003_018E,B15003_021E,B15003_022E,B15003_001E,B01003_001E,NAME&for=county:${countyFips}&in=state:${stateFips}${censusBit}`;
      const data = await fetchJson(url);
      if (!data?.[1]) return res.json({ error: "Census data unavailable" });
      const [noSchool, hs_diploma, ged, someCollege, associate, total25plus, totalPop, name] = data[1];
      const total = parseInt(total25plus);
      const hsOrAbove = parseInt(hs_diploma) + parseInt(ged) + parseInt(someCollege) + parseInt(associate);
      const noSchooling = parseInt(noSchool);
      res.json({
        county: name?.split(",")[0],
        totalPop25plus: total,
        hsGradRatePct: total > 0 ? ((hsOrAbove / total) * 100).toFixed(1) : null,
        noSchoolingPct: total > 0 ? ((noSchooling / total) * 100).toFixed(1) : null,
        agWorkforcePipeline: {
          challenge: `${(((total - hsOrAbove) / total) * 100).toFixed(0)}% of adults 25+ lack HS diploma — barrier to credentialed ag careers`,
          solutions: [
            "Adult Education & Literacy grants (Title II of WIOA)",
            "HiSET / GED completion through community colleges",
            "NFJP wrap-around services for low-literacy farmworkers",
            "FFA adult farmer programs",
          ],
        },
        source: "U.S. Census ACS 5-year 2022 — Table B15003",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
