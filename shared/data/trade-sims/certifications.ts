/**
 * Certification catalog for ThriveUp Trade Sims.
 *
 * Each entry describes a real, currently-recognized industry credential a
 * learner can pursue after completing the corresponding trade course.
 *
 * Iron Rule discipline:
 * - Cert names, sponsoring bodies, and what each exam covers are stable,
 *   well-documented facts pulled from the sponsor's own public materials.
 * - Specific fees, retake windows, and seat availability vary by site and
 *   year. We do NOT quote them here. Every cert card surfaces a link to
 *   the sponsor and instructs learners to verify cost, scheduling, and
 *   eligibility with the sponsor before paying.
 * - Pass-rate percentages are NOT included because they are not
 *   consistently published.
 */

export type CertificationLevel = "entry" | "journey" | "specialty" | "safety";

export interface Certification {
  /** URL-safe slug, unique within trade. */
  slug: string;
  /** Display name as the sponsor uses it. */
  name: string;
  /** Sponsoring body (NCCER, AWS, ASE, EPA, OSHA, NATE, etc.). */
  sponsor: string;
  /** Where the credential sits in a career: entry-level vs. journey vs. specialty vs. safety. */
  level: CertificationLevel;
  /** One-sentence summary of what it certifies the holder can do. */
  whatItProves: string;
  /** Top exam domains in plain language — what the test actually covers. */
  examDomains: string[];
  /** Real-world jobs / scopes of work that typically require or value this credential. */
  unlocks: string[];
  /** Sponsor's primary verification URL — learners must confirm details there before paying. */
  sponsorUrl: string;
  /** Eligibility / prerequisites in plain language. */
  eligibility: string;
  /** True if the cert has a hands-on / performance component (not just multiple choice). */
  hasPerformanceTest: boolean;
}

interface TradeCertCatalog {
  tradeSlug: string;
  introCopy: string;
  certifications: Certification[];
}

export const TRADE_SIMS_CERTIFICATIONS: TradeCertCatalog[] = [
  {
    tradeSlug: "electrical",
    introCopy:
      "Electrical credentials stack. Most learners start with a safety card (OSHA 10) and an entry credential (NCCER Core + Electrical Level 1), then sit a state apprentice/journeyman exam once they have the required field hours. Texas issues electrician licenses through TDLR; other states use their own boards.",
    certifications: [
      {
        slug: "osha-10-construction",
        name: "OSHA 10-Hour Construction",
        sponsor: "OSHA Outreach Training Program",
        level: "safety",
        whatItProves:
          "Awareness-level construction safety training — recognized on most U.S. job sites as a hiring prerequisite.",
        examDomains: [
          "Introduction to OSHA and worker rights",
          "Focus four hazards (falls, struck-by, caught-in/between, electrocution)",
          "Personal protective equipment",
          "Health hazards in construction",
        ],
        unlocks: [
          "Entry to most union and open-shop construction sites",
          "Required by many state apprenticeships before first day on site",
        ],
        sponsorUrl: "https://www.osha.gov/training/outreach",
        eligibility: "Open to anyone. No prior experience required.",
        hasPerformanceTest: false,
      },
      {
        slug: "nccer-electrical-level-1",
        name: "NCCER Electrical Level 1",
        sponsor: "NCCER (National Center for Construction Education and Research)",
        level: "entry",
        whatItProves:
          "Foundational electrical knowledge aligned to the NCCER Electrical curriculum — recognized by 4,000+ industry partners and tracked in the National Registry.",
        examDomains: [
          "Orientation to the electrical trade and safety",
          "Hand and power tools",
          "Electrical theory (Ohm's Law, basic circuits)",
          "Electrical safety practices",
          "Introduction to the National Electrical Code",
        ],
        unlocks: [
          "NCCER Registry credential employers can verify",
          "Direct pathway into NCCER-affiliated apprenticeships and AGC/ABC employer pipelines",
        ],
        sponsorUrl: "https://www.nccer.org/credentialing",
        eligibility:
          "Available through NCCER-accredited training sponsors, secondary CTE programs, and many community colleges.",
        hasPerformanceTest: true,
      },
      {
        slug: "tx-electrical-apprentice-registration",
        name: "Texas Electrical Apprentice Registration",
        sponsor: "Texas Department of Licensing and Regulation (TDLR)",
        level: "entry",
        whatItProves:
          "Legally authorizes work as an electrical apprentice in Texas under the supervision of a licensed journeyman or master.",
        examDomains: [
          "No examination — registration only",
          "Acknowledgment of TDLR rules and supervision requirements",
        ],
        unlocks: [
          "Lawful paid work on Texas electrical job sites under supervision",
          "Required first step toward Journeyman Electrician licensure in Texas",
        ],
        sponsorUrl: "https://www.tdlr.texas.gov/electricians/electricians.htm",
        eligibility:
          "Texas residency not required. Pay TDLR registration fee. Renew annually. Track on-the-job hours toward 8,000-hour journeyman requirement.",
        hasPerformanceTest: false,
      },
    ],
  },
  {
    tradeSlug: "plumbing",
    introCopy:
      "Plumbing is one of the most state-regulated trades in the country. Most states require an apprentice registration before paid work begins, then a journeyman exam once required field hours are logged. Texas requires apprentice registration through TSBPE.",
    certifications: [
      {
        slug: "osha-10-construction-plumbing",
        name: "OSHA 10-Hour Construction",
        sponsor: "OSHA Outreach Training Program",
        level: "safety",
        whatItProves:
          "Awareness-level construction safety training — recognized on most U.S. job sites as a hiring prerequisite.",
        examDomains: [
          "Focus four hazards including struck-by and caught-in hazards (high relevance for trenching and excavation)",
          "Confined space awareness",
          "PPE and hazard communication",
        ],
        unlocks: ["Entry to most construction sites", "Often required before first apprentice day"],
        sponsorUrl: "https://www.osha.gov/training/outreach",
        eligibility: "Open to anyone.",
        hasPerformanceTest: false,
      },
      {
        slug: "nccer-plumbing-level-1",
        name: "NCCER Plumbing Level 1",
        sponsor: "NCCER",
        level: "entry",
        whatItProves:
          "Foundational plumbing knowledge aligned to the NCCER Plumbing curriculum — recognized nationally and tracked in the NCCER Registry.",
        examDomains: [
          "Plumbing safety and tools",
          "Plumbing math",
          "Introduction to drain, waste, and vent (DWV) systems",
          "Plastic and copper piping",
          "Fixture rough-in basics",
        ],
        unlocks: ["NCCER Registry credential", "Pathway into UA, ABC, and AGC apprenticeship pipelines"],
        sponsorUrl: "https://www.nccer.org/credentialing",
        eligibility: "Available through NCCER-accredited training sponsors.",
        hasPerformanceTest: true,
      },
      {
        slug: "tx-plumbing-apprentice-registration",
        name: "Texas Plumbing Apprentice Registration",
        sponsor: "Texas State Board of Plumbing Examiners (TSBPE)",
        level: "entry",
        whatItProves:
          "Required for paid plumbing work in Texas under the supervision of a licensed journeyman or master plumber.",
        examDomains: ["No examination — registration only"],
        unlocks: [
          "Lawful paid plumbing apprenticeship work in Texas",
          "First step toward Texas Journeyman Plumber license (Tradesman/Journeyman/Master ladder)",
        ],
        sponsorUrl: "https://www.tsbpe.texas.gov/",
        eligibility:
          "Submit registration to TSBPE. Renew annually. Track required on-the-job hours and classroom training toward Tradesman Plumber-Limited or Journeyman Plumber exam.",
        hasPerformanceTest: false,
      },
    ],
  },
  {
    tradeSlug: "welding",
    introCopy:
      "Welding is performance-driven: the employer cares whether you can lay a sound bead to a specific code position more than which classroom course you finished. AWS performance certifications are the gold standard. Stack a safety card with an AWS performance qualification to make yourself hireable.",
    certifications: [
      {
        slug: "osha-10-construction-welding",
        name: "OSHA 10-Hour Construction",
        sponsor: "OSHA Outreach Training Program",
        level: "safety",
        whatItProves: "Awareness-level construction safety training.",
        examDomains: ["Focus four hazards", "Hot work and fire prevention", "PPE", "Health hazards from welding fumes"],
        unlocks: ["Hiring prerequisite at most fabrication shops and construction sites"],
        sponsorUrl: "https://www.osha.gov/training/outreach",
        eligibility: "Open to anyone.",
        hasPerformanceTest: false,
      },
      {
        slug: "aws-sense-entry-welder",
        name: "AWS SENSE Entry Welder",
        sponsor: "American Welding Society (AWS)",
        level: "entry",
        whatItProves:
          "Demonstrates entry-level welding competency under the AWS Schools Excelling through National Skill Standards Education (SENSE) program — includes both written and performance components.",
        examDomains: [
          "Welding safety",
          "Basic welding processes (SMAW, GMAW, FCAW, GTAW intro)",
          "Reading welding symbols",
          "Performance qualifications on plate",
        ],
        unlocks: ["Entry into fabrication shops", "Direct credit toward many community-college welding programs"],
        sponsorUrl: "https://www.aws.org/certification-and-education/educators/sense-program",
        eligibility: "Available through AWS SENSE accredited educational institutions.",
        hasPerformanceTest: true,
      },
      {
        slug: "aws-d1-1-certified-welder",
        name: "AWS Certified Welder (D1.1 Structural Steel)",
        sponsor: "American Welding Society (AWS)",
        level: "specialty",
        whatItProves:
          "Performance qualification to weld structural steel under AWS D1.1 Structural Welding Code — Steel.",
        examDomains: [
          "Hands-on welding test in a specific process, position, and material thickness",
          "Visual and bend-test acceptance criteria per D1.1",
        ],
        unlocks: [
          "Structural steel, bridge, and heavy fabrication work",
          "Higher wages — D1.1 qualification is one of the most-requested credentials in commercial welding job postings",
        ],
        sponsorUrl: "https://www.aws.org/certification-and-education/welders/certified-welder",
        eligibility:
          "No coursework prerequisite. You schedule a test at an AWS Accredited Test Facility, pay the test fee, and either pass the performance test or do not. Continuity must be maintained (typically a periodic Maintenance Form) to keep the qualification active.",
        hasPerformanceTest: true,
      },
    ],
  },
  {
    tradeSlug: "automotive",
    introCopy:
      "Automotive credentialing is dominated by ASE (the National Institute for Automotive Service Excellence). Entry-level techs typically start with ASE G1 Auto Maintenance and Light Repair, then add A-series professional certifications (A1-A8) as they gain field experience. EPA Section 609 is required to handle MVAC refrigerant.",
    certifications: [
      {
        slug: "ase-g1-entry",
        name: "ASE G1 Auto Maintenance and Light Repair",
        sponsor: "ASE (National Institute for Automotive Service Excellence)",
        level: "entry",
        whatItProves:
          "Entry-level competency in auto maintenance and light repair across all major vehicle systems.",
        examDomains: [
          "Engine systems",
          "Automatic transmission/transaxle",
          "Manual drive train and axles",
          "Suspension and steering",
          "Brakes",
          "Electrical/electronic systems",
          "Heating, ventilation, and air conditioning",
        ],
        unlocks: [
          "Hiring at dealership and independent service shops",
          "Stacks toward ASE professional A-series certifications",
        ],
        sponsorUrl: "https://www.ase.com/Tests/ASE-Entry-Level-Tests.aspx",
        eligibility: "No experience required for the Entry-Level series.",
        hasPerformanceTest: false,
      },
      {
        slug: "epa-609-mvac",
        name: "EPA Section 609 Motor Vehicle Air Conditioning",
        sponsor: "U.S. Environmental Protection Agency (via approved certifying organizations)",
        level: "specialty",
        whatItProves:
          "Federally required certification to purchase and handle refrigerant for motor vehicle air conditioning service.",
        examDomains: [
          "Ozone depletion and refrigerant regulation",
          "MVAC system components and service",
          "Refrigerant recovery and recycling requirements",
        ],
        unlocks: [
          "Legally purchase MVAC refrigerant in containers smaller than 20 lb",
          "Perform paid MVAC service work without supervision",
        ],
        sponsorUrl: "https://www.epa.gov/section608/section-609-technician-training-and-certification-programs",
        eligibility: "Open to anyone. Multiple approved providers offer the exam, including the Mobile Air Climate Systems Association (MACS).",
        hasPerformanceTest: false,
      },
      {
        slug: "osha-10-general-industry-auto",
        name: "OSHA 10-Hour General Industry",
        sponsor: "OSHA Outreach Training Program",
        level: "safety",
        whatItProves: "Awareness-level general industry safety training relevant to dealership and shop work.",
        examDomains: ["Hazardous materials", "Walking-working surfaces", "PPE", "Electrical safety", "Machine guarding"],
        unlocks: ["Hiring prerequisite at many dealerships and independent shops"],
        sponsorUrl: "https://www.osha.gov/training/outreach",
        eligibility: "Open to anyone.",
        hasPerformanceTest: false,
      },
    ],
  },
  {
    tradeSlug: "hvac",
    introCopy:
      "HVAC has the clearest federally-required credential of any trade: EPA Section 608. You cannot legally handle refrigerant without it. Stack 608 Universal with NATE Ready-to-Work and an OSHA 10 card and you have the standard entry-level HVAC service hireable bundle.",
    certifications: [
      {
        slug: "epa-608-universal",
        name: "EPA Section 608 Universal",
        sponsor: "U.S. Environmental Protection Agency (via approved certifying organizations)",
        level: "specialty",
        whatItProves:
          "Federally required certification to handle stationary refrigerant — Universal covers all four EPA types (Core, Type I, Type II, Type III).",
        examDomains: [
          "Core: refrigerant regulation, ozone depletion, safety",
          "Type I: small appliances (≤5 lb refrigerant charge)",
          "Type II: high-pressure systems (split AC, heat pumps, supermarket racks)",
          "Type III: low-pressure systems (large chillers)",
        ],
        unlocks: [
          "Legally purchase and handle refrigerant for any stationary system",
          "Required for nearly all paid HVAC service positions in the U.S.",
        ],
        sponsorUrl: "https://www.epa.gov/section608",
        eligibility:
          "Open to anyone. Take through any EPA-approved certifying body: ESCO Institute, RSES, Mainstream Engineering, HVAC Excellence, etc.",
        hasPerformanceTest: false,
      },
      {
        slug: "nate-ready-to-work",
        name: "NATE Ready-to-Work",
        sponsor: "North American Technician Excellence (NATE)",
        level: "entry",
        whatItProves: "Entry-level HVACR knowledge — recognized by major HVACR manufacturers and contractor networks.",
        examDomains: [
          "Safety in the HVACR field",
          "Tools and materials",
          "Basic electrical theory",
          "Basic refrigeration theory",
          "Heat and temperature",
          "HVACR systems and components",
        ],
        unlocks: [
          "Entry HVAC service positions",
          "Stacks toward NATE Core + Specialty professional certifications later",
        ],
        sponsorUrl: "https://www.natex.org/Certifications",
        eligibility: "No prior experience required. Open to students and new technicians.",
        hasPerformanceTest: false,
      },
      {
        slug: "osha-10-construction-hvac",
        name: "OSHA 10-Hour Construction",
        sponsor: "OSHA Outreach Training Program",
        level: "safety",
        whatItProves: "Awareness-level construction safety training, including hot-work and electrical hazards relevant to HVAC installs.",
        examDomains: ["Focus four hazards", "Electrical safety (lockout/tagout)", "Hot work and brazing safety", "PPE"],
        unlocks: ["Hiring prerequisite at most contractor and construction sites"],
        sponsorUrl: "https://www.osha.gov/training/outreach",
        eligibility: "Open to anyone.",
        hasPerformanceTest: false,
      },
    ],
  },
];

/** Look up a trade's cert catalog by slug. Returns undefined if the trade isn't seeded. */
export function getCertCatalogForTrade(tradeSlug: string): TradeCertCatalog | undefined {
  return TRADE_SIMS_CERTIFICATIONS.find((c) => c.tradeSlug === tradeSlug);
}

/** Flat lookup across all trades by cert slug. */
export function findCertification(tradeSlug: string, certSlug: string): Certification | undefined {
  return getCertCatalogForTrade(tradeSlug)?.certifications.find((cert) => cert.slug === certSlug);
}
