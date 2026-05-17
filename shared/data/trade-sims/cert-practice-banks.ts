/**
 * Test-prep practice question banks for ThriveUp Trade Sims certifications.
 *
 * These are STUDY questions, NOT official exam content. Every cert sponsor
 * (NCCER, AWS, ASE, EPA, OSHA, NATE) owns the actual exam item bank and we
 * do not copy from it. Questions here are drawn from publicly documented
 * exam objectives and standard trade fundamentals.
 *
 * Each question shows:
 *  - the stem
 *  - 4 options
 *  - the correct option index
 *  - a plain-language rationale so the learner understands WHY, not just WHAT
 *
 * Iron Rule: nothing here is presented as "the actual exam." Cert page UI
 * surfaces a disclaimer pointing learners to the sponsor's own prep
 * materials. Question count per cert starts small (3-5) and grows over
 * time. The framework supports unlimited additions.
 */

export interface PracticeQuestion {
  id: string;
  stem: string;
  options: string[];
  /** 0-based index into `options`. */
  correctIndex: number;
  rationale: string;
}

export interface CertPracticeBank {
  /** Matches Certification.slug from certifications.ts */
  certSlug: string;
  /** Trade this cert belongs to. */
  tradeSlug: string;
  /** Free-text intro shown above the quiz. */
  intro: string;
  questions: PracticeQuestion[];
}

export const CERT_PRACTICE_BANKS: CertPracticeBank[] = [
  // ────────────────────────────────────────────────────────────────────────
  // ELECTRICAL
  // ────────────────────────────────────────────────────────────────────────
  {
    certSlug: "osha-10-construction",
    tradeSlug: "electrical",
    intro: "OSHA 10 covers awareness-level construction safety. Focus on the Focus Four hazards.",
    questions: [
      {
        id: "osha10-e-01",
        stem: "OSHA's Focus Four hazards account for the majority of construction fatalities. Which is NOT one of the Focus Four?",
        options: ["Falls", "Struck-by", "Heat illness", "Electrocution"],
        correctIndex: 2,
        rationale:
          "Focus Four = Falls, Struck-by, Caught-in/between, and Electrocution. Heat illness is a serious hazard but is not in the Focus Four set.",
      },
      {
        id: "osha10-e-02",
        stem: "On a U.S. construction site, what is the general fall-protection trigger height?",
        options: ["4 feet", "6 feet", "10 feet", "20 feet"],
        correctIndex: 1,
        rationale:
          "OSHA 29 CFR 1926.501 requires fall protection in construction at 6 feet or more above a lower level. (General industry uses 4 feet — different standard.)",
      },
      {
        id: "osha10-e-03",
        stem: "What is the primary purpose of OSHA's lockout/tagout standard for electrical work?",
        options: [
          "To label equipment for inventory tracking",
          "To prevent the unexpected energization or startup of equipment during service",
          "To document maintenance work for the owner",
          "To identify which workers performed the service",
        ],
        correctIndex: 1,
        rationale:
          "Lockout/tagout (29 CFR 1910.147) exists to control hazardous energy so equipment cannot start unexpectedly while it is being serviced.",
      },
    ],
  },
  {
    certSlug: "nccer-electrical-level-1",
    tradeSlug: "electrical",
    intro:
      "NCCER Electrical Level 1 tests foundational electrical theory and safety. Ohm's Law, basic series/parallel reasoning, and tool safety appear heavily.",
    questions: [
      {
        id: "nccer-e1-01",
        stem: "A 12 V source drives a single 4 Ω resistor. What is the current?",
        options: ["0.33 A", "3 A", "8 A", "48 A"],
        correctIndex: 1,
        rationale: "Ohm's Law: I = V / R = 12 / 4 = 3 A.",
      },
      {
        id: "nccer-e1-02",
        stem: "Three 6 Ω resistors are connected in parallel. What is the total resistance?",
        options: ["2 Ω", "6 Ω", "9 Ω", "18 Ω"],
        correctIndex: 0,
        rationale: "Identical parallel resistors: R_total = R / n = 6 / 3 = 2 Ω.",
      },
      {
        id: "nccer-e1-03",
        stem: "Which conductor color is used for the grounded (neutral) conductor in standard 120 V branch-circuit wiring per the NEC?",
        options: ["Black", "Red", "White or gray", "Green"],
        correctIndex: 2,
        rationale:
          "NEC 200.6 requires the grounded (neutral) conductor to be identified by a continuous white or gray outer finish (or three continuous white stripes).",
      },
      {
        id: "nccer-e1-04",
        stem: "In a series DC circuit, how does current behave?",
        options: [
          "It is largest at the source and decreases at each resistor",
          "It is the same at every point in the loop",
          "It splits proportionally across each component",
          "It equals the sum of currents through each resistor",
        ],
        correctIndex: 1,
        rationale:
          "In a series circuit, current has only one path, so it is the same at every point in the loop. (Voltage is what divides across the resistors.)",
      },
      {
        id: "nccer-e1-05",
        stem: "A circuit dissipates 60 W at 120 V. What is the current?",
        options: ["0.5 A", "2 A", "20 A", "60 A"],
        correctIndex: 0,
        rationale: "Power formula: I = P / V = 60 / 120 = 0.5 A.",
      },
    ],
  },
  {
    certSlug: "tx-electrical-apprentice-registration",
    tradeSlug: "electrical",
    intro: "Texas TDLR apprentice registration is administrative, not an exam — but you should know the rules.",
    questions: [
      {
        id: "tdlr-e-01",
        stem: "Under TDLR rules, who must directly supervise the work of a registered Texas electrical apprentice?",
        options: [
          "Any other apprentice with at least one year of registration",
          "A licensed Journeyman or Master Electrician",
          "The job site superintendent regardless of license",
          "The customer or property owner",
        ],
        correctIndex: 1,
        rationale:
          "Texas Occupations Code Ch. 1305 and TDLR rules require apprentice electricians to work under the direct supervision of a licensed journeyman or master.",
      },
      {
        id: "tdlr-e-02",
        stem: "Approximately how many hours of on-the-job training must a Texas electrical apprentice typically log before being eligible to sit the Journeyman exam?",
        options: ["1,000 hours", "4,000 hours", "8,000 hours", "12,000 hours"],
        correctIndex: 2,
        rationale: "TDLR requires 8,000 hours of OJT for Journeyman Electrician eligibility.",
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────
  // PLUMBING
  // ────────────────────────────────────────────────────────────────────────
  {
    certSlug: "osha-10-construction-plumbing",
    tradeSlug: "plumbing",
    intro: "Plumbing-specific OSHA 10 study should weight trenching, confined space, and PPE.",
    questions: [
      {
        id: "osha10-p-01",
        stem: "At what trench depth does OSHA require a protective system (sloping, shoring, or shielding) under 29 CFR 1926 Subpart P?",
        options: ["3 feet", "5 feet", "8 feet", "10 feet"],
        correctIndex: 1,
        rationale:
          "Protective systems are required for trenches 5 feet or deeper (unless the excavation is made entirely in stable rock).",
      },
      {
        id: "osha10-p-02",
        stem: "Which hazard is the leading cause of fatal injuries in trenching and excavation work?",
        options: ["Heat illness", "Cave-in", "Electric shock", "Vehicle backover"],
        correctIndex: 1,
        rationale: "Cave-ins are by far the leading cause of fatal trench injuries — a cubic yard of soil weighs over 3,000 lb.",
      },
      {
        id: "osha10-p-03",
        stem: "Before entering a permit-required confined space, what testing is required?",
        options: [
          "Visual inspection only",
          "Atmospheric testing for oxygen, flammable gases, and toxic substances",
          "Temperature and humidity testing",
          "Radiation testing",
        ],
        correctIndex: 1,
        rationale:
          "29 CFR 1910.146 requires atmospheric testing for oxygen content, flammable atmospheres, and toxic air contaminants before entry.",
      },
    ],
  },
  {
    certSlug: "nccer-plumbing-level-1",
    tradeSlug: "plumbing",
    intro: "NCCER Plumbing Level 1 covers DWV basics, plumbing math, and common piping materials.",
    questions: [
      {
        id: "nccer-p1-01",
        stem: "What does DWV stand for in plumbing systems?",
        options: [
          "Drain, Water, Vent",
          "Drain, Waste, Vent",
          "Discharge, Waste, Volume",
          "Direct Water Valve",
        ],
        correctIndex: 1,
        rationale: "DWV = Drain, Waste, and Vent system — handles the gravity drainage and venting side of plumbing.",
      },
      {
        id: "nccer-p1-02",
        stem: "What is the typical fall (slope) for a horizontal DWV drain pipe 3 inches or smaller in diameter under most codes?",
        options: [
          "1/4 inch per foot",
          "1/2 inch per foot",
          "1 inch per foot",
          "Slope is not required — gravity is enough",
        ],
        correctIndex: 0,
        rationale:
          "Most plumbing codes (IPC, UPC) require ¼-inch-per-foot fall for horizontal drains 3 inches and smaller to keep solids moving.",
      },
      {
        id: "nccer-p1-03",
        stem: "A P-trap's primary function is to:",
        options: [
          "Slow water flow during peak use",
          "Filter solids out of waste flow",
          "Hold a water seal that blocks sewer gas from entering the building",
          "Reduce water pressure at the fixture",
        ],
        correctIndex: 2,
        rationale: "The P-trap holds a water seal (typically 2-4 inches deep) that prevents sewer gas from entering the occupied space.",
      },
      {
        id: "nccer-p1-04",
        stem: "Which piping material is most commonly used for residential potable water supply lines today, especially in repipes?",
        options: [
          "Cast iron",
          "Galvanized steel",
          "Lead",
          "PEX (cross-linked polyethylene)",
        ],
        correctIndex: 3,
        rationale:
          "PEX has largely replaced copper as the dominant residential potable water supply material due to cost and freeze resistance.",
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────
  // WELDING
  // ────────────────────────────────────────────────────────────────────────
  {
    certSlug: "aws-sense-entry-welder",
    tradeSlug: "welding",
    intro: "AWS SENSE Entry Welder covers process fundamentals, welding symbols, and safety.",
    questions: [
      {
        id: "aws-sense-01",
        stem: "Which welding process uses a continuously-fed solid wire electrode and an externally-supplied shielding gas?",
        options: ["SMAW (stick)", "GMAW (MIG)", "GTAW (TIG)", "OAW (oxy-fuel)"],
        correctIndex: 1,
        rationale:
          "GMAW (Gas Metal Arc Welding, commonly called MIG) feeds a continuous solid wire and uses an external shielding gas like 75/25 Argon/CO2.",
      },
      {
        id: "aws-sense-02",
        stem: "On a welding symbol, what does a circle at the elbow joint indicate?",
        options: [
          "Inspection required",
          "Weld all around",
          "Field weld",
          "Flush finish",
        ],
        correctIndex: 1,
        rationale: "A circle at the joint of the reference line and arrow indicates a 'weld all around' instruction.",
      },
      {
        id: "aws-sense-03",
        stem: "What test position number is used for a flat groove weld on plate?",
        options: ["1G", "2G", "3G", "4G"],
        correctIndex: 0,
        rationale: "1G = flat groove. 2G = horizontal, 3G = vertical, 4G = overhead.",
      },
      {
        id: "aws-sense-04",
        stem: "Excessive welding amperage on thin material is most likely to cause:",
        options: ["Cold lap (incomplete fusion)", "Burnthrough", "Slag inclusions", "Lack of penetration"],
        correctIndex: 1,
        rationale:
          "Too much amperage on thin material drives heat input past what the joint can absorb, melting holes through the workpiece — burnthrough.",
      },
    ],
  },
  {
    certSlug: "aws-d1-1-certified-welder",
    tradeSlug: "welding",
    intro: "AWS Certified Welder under D1.1 is a performance test — these questions cover the procedural and acceptance-criteria knowledge that supports it.",
    questions: [
      {
        id: "awsd11-01",
        stem: "AWS D1.1 governs welding of which base material category?",
        options: ["Aluminum", "Stainless steel", "Structural steel", "Cast iron"],
        correctIndex: 2,
        rationale: "AWS D1.1 is the Structural Welding Code — Steel. D1.2 covers aluminum, D1.6 covers stainless.",
      },
      {
        id: "awsd11-02",
        stem: "What is the maximum allowable undercut on a fillet weld inspected to D1.1 visual acceptance criteria for statically loaded structures?",
        options: ["1/64 in", "1/32 in", "1/16 in", "1/8 in"],
        correctIndex: 1,
        rationale:
          "D1.1 visual acceptance for statically loaded nontubular connections allows undercut up to 1/32 in for most thicknesses (longer allowance for material >1 in). Cyclically loaded structures are stricter.",
      },
      {
        id: "awsd11-03",
        stem: "Continuity of a D1.1 Certified Welder qualification is maintained how?",
        options: [
          "By retesting annually",
          "By the welder periodically performing welding using the process — the employer/owner certifies continued use via the AWS Maintenance Form",
          "By completing 40 hours of continuing education each year",
          "Once issued, the qualification never lapses",
        ],
        correctIndex: 1,
        rationale:
          "AWS Certified Welder qualifications remain valid as long as the welder is actively welding in the qualified process — periodic submission of the AWS Maintenance Form documents that continuity.",
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────
  // AUTOMOTIVE
  // ────────────────────────────────────────────────────────────────────────
  {
    certSlug: "ase-g1-entry",
    tradeSlug: "automotive",
    intro: "ASE G1 covers maintenance and light repair across all eight major vehicle systems.",
    questions: [
      {
        id: "ase-g1-01",
        stem: "A vehicle is brought in with a brake pedal that goes slowly to the floor when held under steady pressure. The most likely cause is:",
        options: [
          "Worn brake pads",
          "An internal leak in the master cylinder",
          "Air in the lines (would feel spongy, not sink slowly)",
          "Overheated rotors",
        ],
        correctIndex: 1,
        rationale:
          "A pedal that sinks under steady pressure (rather than feels spongy) indicates an internal leak past the master cylinder's primary or secondary seal.",
      },
      {
        id: "ase-g1-02",
        stem: "What is the primary function of the PCV (Positive Crankcase Ventilation) valve?",
        options: [
          "Recirculate exhaust gas into the intake",
          "Route blow-by gases from the crankcase back into the intake manifold for re-burning",
          "Filter the engine's intake air",
          "Regulate transmission fluid pressure",
        ],
        correctIndex: 1,
        rationale:
          "The PCV system routes crankcase blow-by gases back into the intake manifold so they are re-burned rather than vented to atmosphere.",
      },
      {
        id: "ase-g1-03",
        stem: "On a properly functioning vehicle, the cooling system thermostat opens to:",
        options: [
          "Increase coolant flow at cold start",
          "Allow coolant to flow through the radiator once the engine reaches operating temperature",
          "Bypass the radiator when overheating",
          "Activate the cooling fan",
        ],
        correctIndex: 1,
        rationale:
          "A closed thermostat at cold start keeps coolant in the engine until it reaches operating temperature; the thermostat then opens to route coolant through the radiator for cooling.",
      },
    ],
  },
  {
    certSlug: "epa-609-mvac",
    tradeSlug: "automotive",
    intro: "EPA Section 609 covers refrigerant rules and MVAC service.",
    questions: [
      {
        id: "epa-609-01",
        stem: "Which refrigerant is the current OEM standard for new motor-vehicle air conditioning systems in most U.S. light-duty vehicles?",
        options: ["R-12", "R-22", "R-134a (legacy)", "R-1234yf"],
        correctIndex: 3,
        rationale:
          "R-1234yf has been adopted as the OEM standard for new MVAC systems in the U.S. due to its much lower global warming potential than R-134a. (R-134a remains common in service of older systems.)",
      },
      {
        id: "epa-609-02",
        stem: "Section 609 prohibits venting of MVAC refrigerant to the atmosphere. The correct service procedure is to:",
        options: [
          "Vent only small amounts to relieve pressure",
          "Recover the refrigerant using approved equipment before opening the system",
          "Allow natural evaporation overnight",
          "Vent into a sealed plastic bag for disposal",
        ],
        correctIndex: 1,
        rationale:
          "Venting any refrigerant during MVAC service is a violation of the Clean Air Act. Refrigerant must be recovered with EPA-approved equipment.",
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────
  // HVAC
  // ────────────────────────────────────────────────────────────────────────
  {
    certSlug: "epa-608-universal",
    tradeSlug: "hvac",
    intro: "EPA 608 Universal covers all four EPA types. Focus heavily on Core (regulation) plus the type-specific service procedures.",
    questions: [
      {
        id: "epa-608-01",
        stem: "Which EPA Section 608 type covers small appliances containing 5 lb or less of refrigerant?",
        options: ["Core", "Type I", "Type II", "Type III"],
        correctIndex: 1,
        rationale:
          "Type I covers small appliances (≤5 lb charge) such as household refrigerators, window AC units, and PTAC units.",
      },
      {
        id: "epa-608-02",
        stem: "Type II covers which equipment category?",
        options: [
          "Low-pressure chillers",
          "Small appliances",
          "High-pressure equipment (split AC, heat pumps, supermarket racks)",
          "Motor vehicle air conditioning",
        ],
        correctIndex: 2,
        rationale:
          "Type II covers high-pressure stationary equipment such as split-system air conditioners, residential and commercial heat pumps, and supermarket refrigeration racks.",
      },
      {
        id: "epa-608-03",
        stem: "What is the primary environmental concern that triggered EPA refrigerant regulation under the Clean Air Act?",
        options: [
          "Stratospheric ozone depletion (and increasingly, global warming potential)",
          "Drinking water contamination",
          "Soil acidification",
          "Air-particulate emissions",
        ],
        correctIndex: 0,
        rationale:
          "Original 608 regulation was driven by stratospheric ozone depletion from CFCs and HCFCs under the Montreal Protocol; the AIM Act has since added GWP-driven phasedowns for HFCs.",
      },
      {
        id: "epa-608-04",
        stem: "When transferring recovered refrigerant for disposal or recycling, what is required of the receiving DOT cylinder?",
        options: [
          "It must be new and unused",
          "It must be color-coded blue regardless of refrigerant type",
          "It must be hydrostatically tested every 5 years and properly labeled for the refrigerant it contains",
          "It must be vented before refilling",
        ],
        correctIndex: 2,
        rationale:
          "DOT recovery cylinders must be hydrostatically tested every 5 years and clearly labeled. Using an out-of-test or mislabeled cylinder is a serious safety and regulatory violation.",
      },
    ],
  },
  {
    certSlug: "nate-ready-to-work",
    tradeSlug: "hvac",
    intro: "NATE Ready-to-Work tests fundamental HVACR knowledge across electrical, refrigeration, and systems.",
    questions: [
      {
        id: "nate-rtw-01",
        stem: "In a vapor-compression refrigeration cycle, where does the refrigerant absorb heat from the conditioned space?",
        options: ["Condenser", "Compressor", "Evaporator", "Expansion valve"],
        correctIndex: 2,
        rationale:
          "The evaporator absorbs heat from the conditioned space, boiling low-pressure liquid refrigerant into vapor. The condenser rejects that heat outdoors.",
      },
      {
        id: "nate-rtw-02",
        stem: "What is the typical superheat target for a fixed-orifice (piston) residential split AC operating at design conditions?",
        options: ["0-2 °F", "8-12 °F", "30-40 °F", "50-60 °F"],
        correctIndex: 1,
        rationale:
          "Typical superheat for a properly-charged fixed-orifice residential split system at design conditions is roughly 8-12 °F (manufacturer chart governs the exact target). TXV systems target subcooling instead.",
      },
      {
        id: "nate-rtw-03",
        stem: "A capacitor with a swollen top is most likely:",
        options: [
          "Operating normally — that's how they look when warm",
          "Failed and needing replacement",
          "Underrated for the load",
          "Wired incorrectly",
        ],
        correctIndex: 1,
        rationale:
          "A bulged or swollen capacitor case indicates internal failure (often from heat, overvoltage, or age) and the capacitor must be replaced — measure capacitance with the system de-energized to confirm.",
      },
    ],
  },
];

/** Find the practice bank for a given cert. Returns undefined if none seeded yet. */
export function getPracticeBank(certSlug: string): CertPracticeBank | undefined {
  return CERT_PRACTICE_BANKS.find((b) => b.certSlug === certSlug);
}
