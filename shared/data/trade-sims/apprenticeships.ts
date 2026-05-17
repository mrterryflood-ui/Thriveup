/**
 * Apprenticeship pathway catalog for ThriveUp Trade Sims.
 *
 * Each entry describes a real Registered Apprenticeship pathway recognized by
 * the U.S. Department of Labor (USDOL) or a state apprenticeship agency.
 *
 * We surface the sponsor name, what the apprenticeship covers, typical
 * length, and the official locator URLs learners can use to find a sponsor
 * near them. We do NOT promise specific openings at specific locals — those
 * change constantly. The locator URLs are the single source of truth.
 *
 * Iron Rule: durations and wage ratios cited here are the standard published
 * by the sponsoring body (e.g. "4-5 year IBEW/NECA inside wireman program").
 * If a sponsor publishes a range, we surface the range, not a fabricated point estimate.
 */

export interface ApprenticeshipPathway {
  slug: string;
  /** Display name of the apprenticeship pathway. */
  name: string;
  /** Sponsoring body — union, employer association, or state agency. */
  sponsor: string;
  /** One-sentence summary of the trade scope covered. */
  scope: string;
  /** Typical program length as published by the sponsor (e.g., "4-5 years"). */
  typicalLength: string;
  /** What a learner earns / receives during the apprenticeship in plain language. */
  earningStructure: string;
  /** Plain-language eligibility / entry steps. */
  entrySteps: string[];
  /** Primary locator or "find a sponsor near you" URL — the verification source of truth. */
  locatorUrl: string;
  /** Secondary URL if the sponsor publishes a separate "what we offer" page. */
  programInfoUrl?: string;
  /** Free-text notes (open shop vs. union, state-specific quirks, COVID-era waiver status, etc.). */
  notes?: string;
}

interface TradeApprenticeshipCatalog {
  tradeSlug: string;
  introCopy: string;
  pathways: ApprenticeshipPathway[];
}

/**
 * Universal pathways every trade should surface — apprenticeship.gov is the
 * USDOL master locator and works for all five trades. State-specific links
 * complement it, not replace it.
 */
const UNIVERSAL_LOCATORS = {
  usdolApprenticeshipGov: "https://www.apprenticeship.gov/apprenticeship-job-finder",
  twcApprenticeship:
    "https://www.twc.texas.gov/jobseekers/job-training-employment-and-career-programs#apprenticeship",
  twcWorkInTexas: "https://www.workintexas.com/",
};

export const TRADE_SIMS_APPRENTICESHIPS: TradeApprenticeshipCatalog[] = [
  {
    tradeSlug: "electrical",
    introCopy:
      "Electrical has the most-developed apprenticeship infrastructure of any U.S. trade. Two parallel pathways: union (IBEW + NECA Joint Apprenticeship Training Committees, called 'JATCs') and open-shop (Independent Electrical Contractors and ABC chapters). Both end in journeyman-equivalent skill; pay scales and benefits differ.",
    pathways: [
      {
        slug: "ibew-neca-inside-wireman",
        name: "IBEW/NECA Inside Wireman",
        sponsor: "International Brotherhood of Electrical Workers (IBEW) + National Electrical Contractors Association (NECA)",
        scope:
          "Commercial and industrial electrical installation, maintenance, and service — the most common 'electrician' job in the country.",
        typicalLength: "4-5 years (8,000+ on-the-job hours + ~900 classroom hours)",
        earningStructure:
          "Paid from day one; wages step up in defined increments (typically every 6-12 months) until reaching journeyman scale. Healthcare and pension typically included.",
        entrySteps: [
          "Find your local JATC via the locator URL below",
          "Apply during your local's intake window (often 1-2 windows per year)",
          "Pass an aptitude test, interview, and pre-employment drug screen",
          "Have a high-school diploma or GED and at least one year of high-school algebra (or equivalent)",
        ],
        locatorUrl: "https://www.njatc.org/",
        programInfoUrl: "https://www.electricaltrainingalliance.org/",
        notes:
          "Texas IBEW locals serving the I-35 corridor include Local 520 (Austin), Local 716 (Houston), Local 60 (San Antonio), and Local 59 (Dallas).",
      },
      {
        slug: "iec-ec-apprenticeship",
        name: "Independent Electrical Contractors (IEC) Apprenticeship",
        sponsor: "Independent Electrical Contractors — multiple regional chapters",
        scope: "Open-shop electrical apprenticeship covering residential, commercial, and industrial work.",
        typicalLength: "4 years (8,000 OJT hours + 576 classroom hours)",
        earningStructure: "Paid by sponsoring employer with periodic raises as classroom milestones are met.",
        entrySteps: [
          "Find your regional IEC chapter (Texas Gulf Coast, Central Texas, North Texas, etc.) via the locator URL",
          "Apply to the chapter or directly to an IEC-affiliated contractor",
          "Pass entry screening (basic math + reading) and a drug test",
        ],
        locatorUrl: "https://www.ieci.org/",
        notes: "Central Texas chapter (Austin) and Houston-Gulf Coast chapter are the closest to the TCAF pilot zone.",
      },
      {
        slug: "tx-tdlr-electrical-apprentice",
        name: "Texas TDLR Electrical Apprentice — non-program pathway",
        sponsor: "Texas Department of Licensing and Regulation",
        scope:
          "Pure registration pathway for a Texas apprentice who has a sponsoring licensed electrician but is not enrolled in a formal apprenticeship program.",
        typicalLength: "Self-paced — must log 8,000 hours under supervision before sitting Journeyman exam",
        earningStructure: "Paid by sponsoring employer at whatever rate they negotiate.",
        entrySteps: [
          "Find a Texas-licensed Journeyman or Master Electrician willing to sponsor you",
          "Register with TDLR as an Electrical Apprentice",
          "Track all OJT hours toward the 8,000-hour Journeyman exam requirement",
        ],
        locatorUrl: "https://www.tdlr.texas.gov/electricians/electricians.htm",
        notes: "Lower structure than a formal apprenticeship but maximum flexibility. Most learners do better in a formal IBEW/NECA or IEC program.",
      },
    ],
  },
  {
    tradeSlug: "plumbing",
    introCopy:
      "Plumbing apprenticeship is heavily union in the U.S. — the United Association (UA) operates 300+ training centers across the country. Open-shop alternatives exist via ABC. In Texas, you must register as an apprentice with TSBPE before paid work begins.",
    pathways: [
      {
        slug: "ua-local-plumbing-pipefitting",
        name: "United Association Plumbing / Pipefitting Apprenticeship",
        sponsor: "United Association of Journeymen and Apprentices of the Plumbing and Pipe Fitting Industry (UA)",
        scope:
          "Plumbing, pipefitting, sprinkler fitting, and HVACR service — UA has separate apprenticeship tracks for each.",
        typicalLength: "5 years (10,000 OJT hours + ~1,800 classroom hours)",
        earningStructure:
          "Paid from day one with structured raises. Healthcare and pension typically included.",
        entrySteps: [
          "Find your UA local via the locator URL below",
          "Apply during your local's intake window",
          "Pass aptitude testing and an interview",
          "Have a high-school diploma or GED",
        ],
        locatorUrl: "https://www.ua.org/training/find-a-training-center/",
        notes:
          "Texas UA locals include Local 286 (Austin), Local 100 (Dallas), Local 211 (Houston), and Local 142 (San Antonio).",
      },
      {
        slug: "abc-merit-shop-plumbing",
        name: "ABC Merit Shop Plumbing Apprenticeship",
        sponsor: "Associated Builders and Contractors (ABC) chapters",
        scope: "Open-shop plumbing apprenticeship across residential and commercial work.",
        typicalLength: "4 years (8,000 OJT hours + 576 classroom hours)",
        earningStructure: "Paid by sponsoring employer at chapter-set wage scales.",
        entrySteps: [
          "Find your ABC chapter via abc.org",
          "Apply or be placed by a sponsoring ABC member contractor",
        ],
        locatorUrl: "https://www.abc.org/Education-Training/Apprenticeship-Craft-Training",
        notes: "ABC Central Texas (Austin) and ABC Greater Houston serve the TCAF pilot zone.",
      },
      {
        slug: "tx-tsbpe-plumbing-apprentice",
        name: "Texas TSBPE Plumbing Apprentice — Tradesman/Journeyman ladder",
        sponsor: "Texas State Board of Plumbing Examiners",
        scope: "Required registration regardless of which apprenticeship program you choose.",
        typicalLength: "Self-paced — track hours toward Tradesman Plumber-Limited or Journeyman Plumber exam",
        earningStructure: "Paid by sponsoring employer.",
        entrySteps: [
          "Find a licensed plumber willing to sponsor your apprenticeship",
          "Register with TSBPE as a plumbing apprentice",
          "Log OJT hours toward Tradesman Plumber-Limited or Journeyman Plumber license",
        ],
        locatorUrl: "https://www.tsbpe.texas.gov/",
      },
    ],
  },
  {
    tradeSlug: "welding",
    introCopy:
      "Welding apprenticeship is less standardized than electrical or plumbing because the trade rewards demonstrated skill (a passing weld) over time-in-program. Common pathways: Iron Workers / SMART (structural), Boilermakers (heavy industrial), and shop-based apprenticeships through community-college welding programs or NCCER-affiliated employers.",
    pathways: [
      {
        slug: "iron-workers-structural-welder",
        name: "Iron Workers Structural Apprenticeship (includes welding)",
        sponsor: "International Association of Bridge, Structural, Ornamental and Reinforcing Iron Workers",
        scope: "Structural ironwork including structural welding to AWS D1.1, rebar tying, and erection.",
        typicalLength: "3-4 years",
        earningStructure: "Paid from day one with structured raises. Healthcare and pension typically included.",
        entrySteps: [
          "Find your Iron Workers local via the locator URL",
          "Apply during the local's intake window",
        ],
        locatorUrl: "https://www.ironworkers.org/apprenticeship/get-started",
      },
      {
        slug: "smart-sheet-metal",
        name: "SMART Sheet Metal Workers Apprenticeship",
        sponsor: "International Association of Sheet Metal, Air, Rail and Transportation Workers (SMART)",
        scope:
          "Sheet metal fabrication and installation, HVAC ductwork, architectural metal, and welding of light-gauge metals.",
        typicalLength: "4-5 years",
        earningStructure: "Paid from day one with structured raises.",
        entrySteps: ["Find your SMART local via the locator URL", "Apply during intake"],
        locatorUrl: "https://smart-union.org/sm/get-into-the-trade/",
      },
      {
        slug: "abc-welding-apprenticeship",
        name: "ABC Merit Shop Welding Apprenticeship",
        sponsor: "Associated Builders and Contractors (ABC) chapters",
        scope: "Open-shop welding apprenticeship — typical sponsor is a fabrication shop or industrial contractor.",
        typicalLength: "Varies by chapter (typically 3-4 years)",
        earningStructure: "Paid by sponsoring employer.",
        entrySteps: ["Find your ABC chapter via abc.org", "Apply or be placed by an ABC member contractor"],
        locatorUrl: "https://www.abc.org/Education-Training/Apprenticeship-Craft-Training",
      },
    ],
  },
  {
    tradeSlug: "automotive",
    introCopy:
      "Automotive doesn't have the union apprenticeship density of construction trades, but two strong pathways exist: dealer-sponsored OEM tech programs (Ford ASSET, GM ASEP, Honda PACT, Toyota T-TEN) and ASE-stackable shop apprenticeships. Both stack with community-college coursework.",
    pathways: [
      {
        slug: "oem-tech-program",
        name: "OEM Manufacturer Tech Program (Ford ASSET / GM ASEP / Honda PACT / Toyota T-TEN)",
        sponsor: "Major auto manufacturers — partner with community colleges",
        scope: "Brand-specific entry-tech training combining classroom + paid dealership rotations.",
        typicalLength: "2 years (associate degree typical) + ongoing OEM training as a tech",
        earningStructure: "Paid during dealership rotations; tuition often partially subsidized by sponsoring dealership.",
        entrySteps: [
          "Apply to the partner community college's automotive program",
          "Be placed with a sponsoring dealership",
        ],
        locatorUrl: "https://www.automotivetraining.com/oem-program-locator/",
        notes: "In Central Texas, Austin Community College's automotive program participates in several OEM tracks.",
      },
      {
        slug: "ase-shop-apprentice",
        name: "ASE-aligned Shop Apprenticeship",
        sponsor: "Individual independent or dealership shops + ASE (credentialing body)",
        scope:
          "Less-formal but widely used: a shop hires you as an apprentice tech and you stack ASE certifications as you go.",
        typicalLength: "Self-paced — typically 2-4 years to reach ASE Master Tech (8 of 8 A-series)",
        earningStructure: "Paid by employer; ASE exam fees often reimbursed on pass.",
        entrySteps: [
          "Pass ASE G1 Entry Level Auto Maintenance and Light Repair",
          "Apply directly to local shops",
        ],
        locatorUrl: "https://www.ase.com/",
      },
    ],
  },
  {
    tradeSlug: "hvac",
    introCopy:
      "HVAC apprenticeship splits across service-side (UA, ABC) and sheet metal/duct side (SMART, ABC). Most learners enter through community-college HVAC programs paired with employer-paid apprenticeships. EPA 608 Universal is the federal floor — get it before applying.",
    pathways: [
      {
        slug: "ua-hvacr-service",
        name: "UA HVACR Service Apprenticeship",
        sponsor: "United Association (UA) — HVACR service track",
        scope: "Residential and commercial HVACR install, service, and repair.",
        typicalLength: "5 years",
        earningStructure: "Paid from day one with structured raises. Healthcare and pension typically included.",
        entrySteps: ["Find your UA local via the locator URL", "Apply during intake window"],
        locatorUrl: "https://www.ua.org/training/find-a-training-center/",
      },
      {
        slug: "smart-hvac-sheet-metal",
        name: "SMART HVAC / Sheet Metal Apprenticeship",
        sponsor: "SMART — Sheet Metal Workers International Association",
        scope: "HVAC ductwork fabrication and install, architectural sheet metal, light-gauge welding.",
        typicalLength: "4-5 years",
        earningStructure: "Paid from day one with structured raises.",
        entrySteps: ["Find your SMART local via the locator URL", "Apply during intake"],
        locatorUrl: "https://smart-union.org/sm/get-into-the-trade/",
      },
      {
        slug: "abc-hvac",
        name: "ABC Merit Shop HVAC Apprenticeship",
        sponsor: "Associated Builders and Contractors (ABC) chapters",
        scope: "Open-shop HVAC service and install apprenticeship.",
        typicalLength: "4 years (8,000 OJT hours + 576 classroom hours)",
        earningStructure: "Paid by sponsoring employer at chapter-set wage scales.",
        entrySteps: ["Find your ABC chapter via abc.org", "Apply or be placed by an ABC member contractor"],
        locatorUrl: "https://www.abc.org/Education-Training/Apprenticeship-Craft-Training",
      },
    ],
  },
];

/** Locator URLs that apply to every trade — show alongside trade-specific options. */
export const UNIVERSAL_APPRENTICESHIP_LOCATORS = UNIVERSAL_LOCATORS;

/** Look up apprenticeship catalog by trade slug. */
export function getApprenticeshipCatalogForTrade(
  tradeSlug: string,
): TradeApprenticeshipCatalog | undefined {
  return TRADE_SIMS_APPRENTICESHIPS.find((c) => c.tradeSlug === tradeSlug);
}
