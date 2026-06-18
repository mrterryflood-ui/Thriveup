/**
 * Rural Housing Hub
 * Sources: USDA Rural Development (Section 502, 515, 533, 538) ·
 *          HUD Rural Housing · Census ACS Housing Cost Burden ·
 *          USDA ERS Housing data
 */
import { type Request, type Response } from "express";

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, {
    headers: { "User-Agent": "ThriveUp-RuralHousing/1.0 (terryflood@thrivingcommunitiesforall.com)", "Accept": "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const INCOME_LIMITS_CONTEXT: Record<number, { label: string; pct: number }> = {
  1: { label: "Very Low Income (50% AMI)", pct: 50 },
  2: { label: "Low Income (80% AMI)", pct: 80 },
  3: { label: "Moderate Income (115% AMI)", pct: 115 },
};

// USDA RD Section 502 Direct Home Loan — primary rural homeownership program
function getSection502Direct(state: string, householdSize: number, annualIncome: number) {
  const eligibleIncomes: Record<string, Record<number, number>> = {
    TX: { 1: 45850, 2: 52400, 3: 58950, 4: 65450, 5: 70700, 6: 75950, 7: 81200, 8: 86400 },
    IA: { 1: 41750, 2: 47700, 3: 53650, 4: 59600, 5: 64400, 6: 69150, 7: 73950, 8: 78700 },
    MS: { 1: 34000, 2: 38850, 3: 43700, 4: 48550, 5: 52450, 6: 56350, 7: 60250, 8: 64150 },
    DEFAULT: { 1: 45850, 2: 52400, 3: 58950, 4: 65450, 5: 70700, 6: 75950, 7: 81200, 8: 86400 },
  };
  const limits = eligibleIncomes[state] || eligibleIncomes.DEFAULT;
  const limit = limits[Math.min(householdSize, 8)] || limits[4];
  const eligible = annualIncome <= limit;

  return {
    program: "USDA Section 502 Direct Home Loan",
    eligible,
    reason: eligible ? "Income is within Very Low / Low Income limits for rural housing" : `Income exceeds the ${state} limit of $${limit.toLocaleString()} for household of ${householdSize}`,
    keyFeatures: [
      "No down payment required",
      "Interest rate as low as 1% with payment assistance",
      "Terms up to 33 years (38 years for very low income)",
      "No private mortgage insurance (PMI)",
      "Can be used for new construction or existing home purchase",
    ],
    eligibilityRequirements: [
      `Household income at or below $${limit.toLocaleString()} (${state}, household of ${householdSize})`,
      "Property must be in eligible rural area (usually < 35,000 population)",
      "Be a U.S. citizen or eligible non-citizen",
      "Have legal capacity to incur a loan",
      "Unable to obtain conventional financing at reasonable rates",
      "Property must be primary residence",
    ],
    paymentAssistance: {
      available: eligible,
      description: "Reduces effective interest rate to as low as 1% for lowest-income borrowers",
      baseRate: "Current USDA rate — check rd.usda.gov for current rate",
    },
    applyUrl: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-direct-home-loans",
    findOffice: "https://www.rd.usda.gov/contactus/state-offices",
    source: "USDA Rural Development",
    incomeLimit: limit,
  };
}

// USDA Section 502 Guaranteed — for moderate income (up to 115% AMI)
function getSection502Guaranteed(state: string, householdSize: number, annualIncome: number) {
  const guaranteedLimits: Record<string, number[]> = {
    TX: [103350, 103350, 103350, 103350, 136400, 136400, 136400, 136400],
    DEFAULT: [103350, 103350, 103350, 103350, 136400, 136400, 136400, 136400],
  };
  const limits = guaranteedLimits[state] || guaranteedLimits.DEFAULT;
  const limitIdx = Math.min(householdSize - 1, 7);
  const limit = limits[limitIdx];
  const eligible = annualIncome <= limit;
  return {
    program: "USDA Section 502 Guaranteed Loan",
    eligible,
    incomeLimit: limit,
    keyFeatures: [
      "No down payment required",
      "Competitive interest rates through approved lenders",
      "1% upfront guarantee fee (can be rolled into loan)",
      "0.35% annual fee",
      "30-year fixed rate",
      "Can be used for new construction or existing home",
    ],
    requirements: [
      `Income at or below $${limit.toLocaleString()} for ${state} household of ${householdSize}`,
      "Property in eligible rural area",
      "Primary residence only",
      "Must work with USDA-approved lender",
    ],
    applyUrl: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program",
    source: "USDA Rural Development",
  };
}

// USDA Section 504 Home Repair
function getSection504(state: string, annualIncome: number, isElderly: boolean) {
  const VERY_LOW_INCOME = 45850;
  const eligible504Loan = annualIncome <= VERY_LOW_INCOME * 1.5;
  const eligible504Grant = isElderly && annualIncome <= VERY_LOW_INCOME;
  return {
    program: "USDA Section 504 Home Repair Loans & Grants",
    loanEligible: eligible504Loan,
    grantEligible: eligible504Grant,
    loan: {
      maxAmount: "$40,000",
      rate: "1% fixed",
      term: "20 years",
      use: "Repair, improve, or modernize the home",
    },
    grant: {
      maxAmount: "$10,000 (lifetime)",
      eligibility: "Must be 62+ years old and unable to repay a loan",
      use: "Remove health and safety hazards",
    },
    applyUrl: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-repair-loans-grants",
    source: "USDA Rural Development",
  };
}

// USDA Section 515 Rural Rental Housing
function getSection515() {
  return {
    program: "USDA Section 515 Rural Rental Housing",
    description: "Affordable rental housing developments in rural areas for low and very low income families, the elderly, and persons with disabilities.",
    forTenants: {
      description: "If you live or want to live in USDA-financed rental housing, you may qualify for rental assistance.",
      rentalAssistance: "Tenants pay no more than 30% of adjusted income toward rent",
      eligibility: "Income at or below 80% of Area Median Income",
      findApartment: "https://www.rd.usda.gov/page/multi-family-housing-active-projects",
    },
    forDevelopers: {
      description: "Direct loans to build or preserve affordable rental housing in rural areas",
      applyUrl: "https://www.rd.usda.gov/programs-services/multi-family-housing-programs/multi-family-housing-direct-loans",
    },
    source: "USDA Rural Development",
  };
}

// Housing cost burden by county using Census ACS
async function getHousingCostBurden(stateFips: string, countyFips: string) {
  const censusBit = process.env.CENSUS_API_KEY ? `&key=${process.env.CENSUS_API_KEY}` : "";
  try {
    // B25070: Gross rent as % of income; B25091: Owner costs as % of income
    const rentUrl = `https://api.census.gov/data/2022/acs/acs5?get=B25070_007E,B25070_008E,B25070_009E,B25070_010E,B25070_001E,B25003_001E,B25003_002E,B25003_003E,B19013_001E,B01003_001E,NAME&for=county:${countyFips}&in=state:${stateFips}${censusBit}`;
    const data = await fetchJson(rentUrl);
    if (data?.[1]) {
      const [rent30_34, rent35_39, rent40_49, rent50plus, rentTotal, totalHousing, ownerOcc, renterOcc, medIncome, totalPop, name] = data[1];
      const costBurdened = parseInt(rent30_34) + parseInt(rent35_39) + parseInt(rent40_49) + parseInt(rent50plus);
      const severelyCostBurdened = parseInt(rent50plus);
      const totalRenters = parseInt(renterOcc);
      return {
        county: name?.split(",")[0],
        state: stateFips,
        totalPop: parseInt(totalPop),
        medianHouseholdIncome: parseInt(medIncome),
        housing: {
          total: parseInt(totalHousing),
          ownerOccupied: parseInt(ownerOcc),
          renterOccupied: parseInt(renterOcc),
          ownerOccRate: totalHousing > 0 ? ((parseInt(ownerOcc) / parseInt(totalHousing)) * 100).toFixed(1) + "%" : null,
        },
        rentBurden: {
          costBurdened: costBurdened,
          costBurdenedPct: totalRenters > 0 ? ((costBurdened / totalRenters) * 100).toFixed(1) : null,
          severelyCostBurdened: severelyCostBurdened,
          severelyCostBurdenedPct: totalRenters > 0 ? ((severelyCostBurdened / totalRenters) * 100).toFixed(1) : null,
          note: "Cost-burdened = paying 30%+ of income on rent; Severely = 50%+",
        },
        source: "U.S. Census ACS 5-year 2022 — Tables B25070, B25003, B19013",
      };
    }
    return null;
  } catch (e: any) {
    console.error("[RuralHousing] Census housing error:", e.message);
    return null;
  }
}

export function registerRuralHousingRoutes(app: any) {

  // Full eligibility screener
  app.post("/api/rural-housing/eligibility", (req: Request, res: Response) => {
    const { state = "TX", householdSize = 4, annualIncome = 45000, isElderly = false, isRenter = false, needsRepair = false } = req.body;
    const s = (state as string).toUpperCase();
    const size = parseInt(String(householdSize));
    const income = parseInt(String(annualIncome));

    const section502Direct = getSection502Direct(s, size, income);
    const section502Guaranteed = getSection502Guaranteed(s, size, income);
    const section504 = getSection504(s, income, !!isElderly);
    const section515 = getSection515();

    const eligiblePrograms = [
      section502Direct.eligible && section502Direct,
      section502Guaranteed.eligible && section502Guaranteed,
      (needsRepair && section504.loanEligible) && { ...section504, program: "Section 504 Home Repair Loan" },
      (needsRepair && section504.grantEligible) && { ...section504, program: "Section 504 Home Repair Grant (ELDER)" },
    ].filter(Boolean);

    res.json({
      eligiblePrograms,
      allPrograms: {
        homeownership: [section502Direct, section502Guaranteed],
        rental: section515,
        repair: section504,
      },
      additionalPrograms: [
        {
          name: "HUD HOME Investment Partnerships",
          description: "Block grants to states/localities for affordable housing — rental and homeownership assistance",
          url: "https://www.hud.gov/program_offices/comm_planning/home",
        },
        {
          name: "HUD USDA Mutual Self-Help Housing (Section 523)",
          description: "Families build their own homes with technical assistance — sweat equity reduces cost",
          url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/mutual-self-help-housing-technical-assistance-grants",
        },
        {
          name: "LIHTC — Low Income Housing Tax Credits",
          description: "Tax credits that finance affordable rental housing construction and rehabilitation",
          url: "https://www.huduser.gov/portal/datasets/lihtc.html",
        },
        {
          name: "HAF — Homeowner Assistance Fund",
          description: "State programs to help homeowners struggling with mortgage payments, utility bills",
          url: "https://homeownerassistancefund.org/",
        },
      ],
      disclaimer: "Eligibility is based on income limits and area eligibility. Contact your USDA Rural Development state office for final determination.",
      findOffice: "https://www.rd.usda.gov/contactus/state-offices",
      source: "USDA Rural Development",
    });
  });

  // Housing cost burden by county
  app.get("/api/rural-housing/cost-burden", async (req: Request, res: Response) => {
    const stateFips = req.query.stateFips as string || "48";
    const countyFips = req.query.countyFips as string || "453";
    try {
      const data = await getHousingCostBurden(stateFips, countyFips);
      if (!data) return res.json({ error: "Census data not available for this county", stateFips, countyFips });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // USDA RD housing programs overview
  app.get("/api/rural-housing/programs", (_req: Request, res: Response) => {
    res.json({
      programs: [
        { name: "Section 502 Direct", type: "homeownership", income: "Very Low / Low (50-80% AMI)", downPayment: "None", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-direct-home-loans" },
        { name: "Section 502 Guaranteed", type: "homeownership", income: "Moderate (up to 115% AMI)", downPayment: "None", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program" },
        { name: "Section 504 Repair Loan", type: "repair", income: "Very Low", downPayment: "N/A", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-repair-loans-grants" },
        { name: "Section 504 Repair Grant", type: "repair-grant", income: "Very Low + 62+ years old", downPayment: "N/A", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-repair-loans-grants" },
        { name: "Section 515 Rental", type: "rental", income: "Low (up to 80% AMI)", downPayment: "N/A (rental)", url: "https://www.rd.usda.gov/programs-services/multi-family-housing-programs/rural-rental-housing-direct-loans" },
        { name: "Section 521 Rental Assistance", type: "rental-subsidy", income: "Very Low", downPayment: "N/A", url: "https://www.rd.usda.gov/programs-services/multi-family-housing-programs/multi-family-housing-rental-assistance" },
        { name: "Section 523 Mutual Self-Help", type: "homeownership-sweat", income: "Very Low / Low", downPayment: "Sweat equity", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/mutual-self-help-housing-technical-assistance-grants" },
        { name: "Section 538 Guaranteed Rental", type: "rental-development", income: "For developers", downPayment: "N/A", url: "https://www.rd.usda.gov/programs-services/multi-family-housing-programs/multi-family-housing-loan-guarantees" },
      ],
      source: "USDA Rural Development",
      findOffice: "https://www.rd.usda.gov/contactus/state-offices",
    });
  });

  // Housing grants for nonprofits / orgs
  app.get("/api/rural-housing/org-grants", (_req: Request, res: Response) => {
    res.json({
      grants: [
        { name: "USDA Rural Housing Site Loans (Sections 523/524)", amount: "Varies", description: "Loans to acquire and develop sites for low-moderate income housing", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/rural-housing-site-loans" },
        { name: "HOME Investment Partnerships Program", amount: "$3M–$30M (to states/localities)", description: "Federal block grants for affordable housing development, rehabilitation, homebuyer assistance", url: "https://www.hud.gov/program_offices/comm_planning/home" },
        { name: "CDBG — Community Development Block Grants", amount: "Varies", description: "Flexible funding for housing, community facilities, economic development in low-income areas", url: "https://www.hud.gov/program_offices/comm_planning/cdbg" },
        { name: "USDA Self-Help Technical Assistance Grants", amount: "Up to $3M", description: "Fund nonprofits to administer mutual self-help housing programs", url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/mutual-self-help-housing-technical-assistance-grants" },
        { name: "National Housing Trust Fund", amount: "Varies by state", description: "Targeted to extremely low income renters", url: "https://nlihc.org/explore-issues/projects-campaigns/national-housing-trust-fund" },
        { name: "NeighborWorks Rural Housing", amount: "Varies", description: "Capacity grants for nonprofits providing rural housing services", url: "https://www.neighborworks.org/" },
      ],
      source: "HUD / USDA RD / NeighborWorks",
    });
  });
}
