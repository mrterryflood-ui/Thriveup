/**
 * HVAC trade — 15-day curriculum content.
 *
 * Mirrors the electrical and plumbing patterns:
 *   - 5-loop player (Concept → Guided → Solo → Sandbox → Debrief)
 *   - engineMode is explicit per day; "thermal-airflow" when the heat-balance
 *     solver runs, "concept-only" for code/safety/diagnostic-procedure days.
 *   - Credential pathway hooks reference REAL HVAC pathways:
 *     NATE certification, HVAC Excellence Employment-Ready, EPA Section 608,
 *     ACC HVAC Technology certificate, SMART Local 67 sheet-metal
 *     apprenticeship (Austin/Central TX), and IUEC Local 81 elevator
 *     constructors (adjacent commercial-mechanical pathway). No invented
 *     partnerships.
 */

import type { LessonEngineMode } from "./types";

export type HvacLessonConcept = {
  blurb: string;
  keyTerms: Array<{ term: string; definition: string }>;
  diagramKey?: string;
};

export type HvacLessonGuidedStep = {
  instruction: string;
  hint: string;
  checkDescription: string;
};

export type HvacLessonSoloChallenge = {
  prompt: string;
  successCriteria: string;
  scoringRubric: {
    correctness: number;
    time: number;
    componentCount: number;
  };
};

export type HvacLessonSandboxStarter = {
  initialComponents: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  prompt: string;
};

export interface HvacLessonContent {
  dayNumber: number;
  slug: string;
  title: string;
  shortDescription: string;
  engineMode: LessonEngineMode;
  concept: HvacLessonConcept;
  guidedSteps: HvacLessonGuidedStep[];
  soloChallenge: HvacLessonSoloChallenge;
  sandboxStarter: HvacLessonSandboxStarter;
  credentialPathway: string;
}

export const HVAC_TRADE_META = {
  slug: "hvac",
  name: "HVAC",
  tagline: "From heat transfer to a whole-home capstone in 15 days.",
  description:
    "Build real HVAC systems in your browser. Calculate loads, size ducts, choose between a heat pump and a furnace, and earn a credential pathway into ACC's HVAC certificate, NATE certification, EPA Section 608, or a SMART/sheet-metal apprenticeship. Free. No installation. Multilingual.",
  iconKey: "thermometer",
  displayOrder: 3,
};

// Credential pathway references — every one is a real, current credential or
// local union. We keep two unions explicit and distinct so learners aren't
// confused: SMART covers sheet-metal/HVAC duct work, IUEC covers elevator
// constructors (often the adjacent trade on commercial mechanical projects).
const ACC_HVAC = "ACC's HVAC Technology certificate (Austin Community College)";
const NATE = "NATE Core + specialty certification (North American Technician Excellence)";
const EPA608 = "EPA Section 608 Technician Certification (refrigerant handling, Clean Air Act)";
const SMART_SHEETMETAL = "SMART Local 67 sheet-metal apprenticeship (Austin/Central TX — HVAC duct fabrication & installation)";
const IUEC_TX = "IUEC Local 81 elevator constructors (San Antonio/Central TX — adjacent mechanical trade on commercial HVAC jobs)";
const HVAC_EXCELLENCE = "HVAC Excellence Employment-Ready certification";

export const HVAC_LESSONS: HvacLessonContent[] = [
  {
    dayNumber: 1,
    slug: "heat-transfer-fundamentals",
    title: "Heat Transfer Fundamentals",
    shortDescription:
      "Conduction, convection, radiation — the three ways heat moves and the three numbers a tech actually uses.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "HVAC is just the management of heat. Heat moves three ways: conduction (through solid walls), convection (with moving air or fluid), and radiation (through space, like sunlight on a window). For day-to-day load calc you mostly care about conduction through the envelope and the R-value that resists it: Q = (A/R) × ΔT. A bigger wall, lower R, or colder outdoors all push heat out faster — and the equipment has to put it back in.",
      keyTerms: [
        { term: "U-value", definition: "How easily heat passes through 1 m² of wall per 1 K. U = 1/R." },
        { term: "R-value", definition: "Resistance to heat flow. Higher R = better insulation." },
        { term: "ΔT (delta-T)", definition: "Temperature difference, usually indoor − outdoor. Drives load." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place one Zone with 60 m² external-wall area, R-4, target 22 °C.",
        hint: "Zone defaults are reasonable; you only need to confirm them.",
        checkDescription: "1 zone placed",
      },
      {
        instruction: "Place a Heat Pump and a Supply Duct from the heat pump to the zone.",
        hint: "Equipment palette, then duct palette.",
        checkDescription: "1 heat pump + 1 supply duct connected",
      },
      {
        instruction: "Run with ambient −5 °C. The solver reports the sensible heating load (W).",
        hint: "Heating mode kicks in whenever outdoor is colder than the zone.",
        checkDescription: "perZone.sensibleLoad > 0",
      },
      {
        instruction: "Double the wall area to 120 m². Sensible load roughly doubles.",
        hint: "Q ∝ A. More wall = more heat lost = more load.",
        checkDescription: "load roughly 2× the previous run",
      },
    ],
    soloChallenge: {
      prompt: "A bedroom has 40 m² of external wall, R-3, target 20 °C, ambient −10 °C. Compute the design heating load with no internal gains. (Expected ≈ 400 W.)",
      successCriteria: "Reported sensibleLoad within ±10 % of 400 W.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 80, targetTemp: 22, externalWallArea: 60, externalWallR: 4 } },
        { kind: "heat_pump", props: { heatingCapacity: 5000, coolingCapacity: 5000, blowerCFM: 500 } },
        { kind: "supply_duct", props: { length: 5, crossSection: 0.05 } },
      ],
      prompt: "Try changing R from 2 to 8 and watch load collapse. That's why insulation is the cheapest tool a homeowner has.",
    },
    credentialPathway: `Heat transfer is the first chapter of ${ACC_HVAC}. Master Q = (A/R)·ΔT and you're ready for ${HVAC_EXCELLENCE}.`,
  },
  {
    dayNumber: 2,
    slug: "psychrometric-chart",
    title: "The Psychrometric Chart",
    shortDescription:
      "Dry-bulb, wet-bulb, dew point, humidity ratio — five variables, one chart, every comfort decision.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Comfort isn't just temperature — it's the temperature + moisture combination. The psychrometric chart plots dry-bulb (the thermometer reading) against humidity ratio (kg of water per kg of dry air). Every line on the chart (relative humidity, wet bulb, enthalpy) is just a way to look at the same air. Cooling shifts you down-left; heating shifts you up-right; humidifying moves you up; drying moves you down.",
      keyTerms: [
        { term: "Dry-bulb temp", definition: "The plain air temperature." },
        { term: "Wet-bulb temp", definition: "Temp of a wet wick — falls below dry-bulb because of evaporation." },
        { term: "Humidity ratio (W)", definition: "kg water vapor per kg dry air. The chart's y-axis." },
        { term: "Dew point", definition: "Temp at which water starts condensing out of the air." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Read the chart: at 22 °C dry-bulb and 50 % RH, what is the humidity ratio?",
        hint: "Drop straight down from the 50 % RH line at 22 °C.",
        checkDescription: "answers ≈ 0.0083 kg/kg",
      },
      {
        instruction: "If you cool that same air to 14 °C without removing moisture, what is the new RH?",
        hint: "Horizontal line (constant W) to the left until you hit 14 °C.",
        checkDescription: "answers ≈ 100 % (you've hit dew point)",
      },
      {
        instruction: "What does that mean physically? (Condensation. That's why coils drip.)",
        hint: "Air can't hold more water than the saturation line.",
        checkDescription: "explanation includes condensation / dew point",
      },
    ],
    soloChallenge: {
      prompt: "Outdoor air is 32 °C / 70 % RH. Indoor target is 24 °C / 50 % RH. Is there latent load? (Yes — outdoor humidity ratio is higher.)",
      successCriteria: "Identifies latent load and that the coil must condense moisture.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "No solver today — sketch on the chart. Tomorrow we put numbers to sensible and latent loads.",
    },
    credentialPathway: `Psychrometric chart fluency is the gate to NATE specialty exams. ${NATE}.`,
  },
  {
    dayNumber: 3,
    slug: "sensible-latent-load",
    title: "Sensible vs. Latent Load",
    shortDescription:
      "Sensible load changes temperature. Latent load changes moisture. Both matter; only one shows up on the thermostat.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Total cooling load = sensible (the heat you feel) + latent (the heat in the water vapor). Q_sensible = m·c·ΔT moves the thermometer. Q_latent = m·h_fg·ΔW pulls water out of the air. A system that's too oversized for sensible load short-cycles before it has time to dehumidify, so latent stays high and you feel clammy at 24 °C. This is the #1 reason a 'cold' house still feels uncomfortable in August.",
      keyTerms: [
        { term: "Sensible heat", definition: "Heat that changes temperature. cp,air ≈ 1005 J/kg·K." },
        { term: "Latent heat", definition: "Heat tied up in phase change. h_fg ≈ 2.45 MJ/kg for water." },
        { term: "SHR", definition: "Sensible Heat Ratio = Q_sens / Q_total. Equipment quotes it." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place a Zone with 2 occupants and 0.02 m³/s ventilation. Cooling design (ambient 32 °C).",
        hint: "Occupants + outdoor air = a real latent load.",
        checkDescription: "zone with occupancy ≥ 2 and ventilationM3s > 0",
      },
      {
        instruction: "Set outdoor humidity ratio = 0.018, indoor = 0.0093. Run.",
        hint: "These are typical Gulf Coast summer / Travis County design conditions.",
        checkDescription: "perZone.latentLoad > 0",
      },
      {
        instruction: "Compare sensible to latent. SHR should be below 0.8 — meaning dehumidification matters.",
        hint: "SHR = sensible / (sensible+latent).",
        checkDescription: "SHR < 0.8",
      },
    ],
    soloChallenge: {
      prompt: "A 100 m² classroom with 25 students (occupancy 25) and 0.15 m³/s of outdoor air sits at 24 °C target. Outdoor 35 °C / W=0.020. Compute total load and SHR.",
      successCriteria: "Latent > 0; total load consistent with sum of perZone.designLoad.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 60, targetTemp: 24, occupancy: 2, externalWallArea: 50, externalWallR: 3, internalGain: 200 } },
        { kind: "heat_pump", props: { heatingCapacity: 0, coolingCapacity: 5000, blowerCFM: 400 } },
        { kind: "supply_duct" },
      ],
      prompt: "Vary outdoor humidity from 0.010 to 0.022. Notice how latent grows while sensible barely budges.",
    },
    credentialPathway: `Sensible/latent breakdown is the foundation of Manual J load calc — required for ${ACC_HVAC} and tested on NATE Air Conditioning specialty.`,
  },
  {
    dayNumber: 4,
    slug: "manual-j-load-calc",
    title: "Manual J Load Calculation",
    shortDescription:
      "ACCA Manual J in miniature: envelope, internal gains, infiltration, design-day outdoor — sized right, not rule-of-thumb.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Manual J is ACCA's published method for sizing residential equipment. Wrong sizing is the most common HVAC mistake — '1 ton per 500 ft²' is a folk rule that oversizes new construction by 30–60 %. Real Manual J adds up wall losses, window losses (huge), roof losses, infiltration, internal gains, then picks equipment that matches DESIGN-DAY load, not peak record. Travis County design outdoor: 36 °C cooling, −4 °C heating (99 %/1 % bins).",
      keyTerms: [
        { term: "Design day", definition: "Outdoor at the 99 %/1 % exceedance level — sized to cover almost every hour." },
        { term: "Block load", definition: "Whole-house load, what the equipment sees." },
        { term: "Room-by-room", definition: "Per-zone load — required for duct sizing." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place 4 zones with different sizes and R-values. Each one represents a room.",
        hint: "Living room, kitchen, two bedrooms is a good starting set.",
        checkDescription: "4 zones placed",
      },
      {
        instruction: "Connect each zone to the equipment with its own supply duct.",
        hint: "Room-by-room means a duct per zone.",
        checkDescription: "4 supply ducts",
      },
      {
        instruction: "Run at heating design (−5 °C). Note the per-zone loads vs the total.",
        hint: "Total should equal |sum(sensible)| + latent.",
        checkDescription: "totalLoad reported",
      },
    ],
    soloChallenge: {
      prompt: "Build a 4-zone house where the heating block load is between 6 and 8 kW. Resize equipment so capacity is within 1.2× of the load (no oversize warning).",
      successCriteria: "No 'Oversized' or 'Undersized' warning in result.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 80, targetTemp: 22, externalWallArea: 60, externalWallR: 5 } },
        { kind: "zone", props: { volume: 40, targetTemp: 22, externalWallArea: 30, externalWallR: 5, internalGain: 300 } },
        { kind: "zone", props: { volume: 50, targetTemp: 20, externalWallArea: 40, externalWallR: 5 } },
        { kind: "heat_pump", props: { heatingCapacity: 7000, coolingCapacity: 7000, blowerCFM: 800 } },
      ],
      prompt: "Try a 12 kW heat pump. Watch the Oversized warning appear. Manual J exists to prevent exactly that.",
    },
    credentialPathway: `Manual J is on every contractor licensing exam in Texas. ${ACC_HVAC} dedicates a full course to it.`,
  },
  {
    dayNumber: 5,
    slug: "duct-sizing-static-pressure",
    title: "Duct Sizing & Static Pressure",
    shortDescription:
      "Air is lazy — it takes the easiest path. Size ducts so the right CFM goes to every room without screaming.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Duct sizing is Bernoulli + friction. Each duct adds static pressure drop ΔP = f · (L/D_h) · (ρv²/2). The blower has a fixed rating (typically 0.5 in.w.c. ≈ 125 Pa external static); if your ducts eat more than that, airflow collapses. Rule of thumb: residential supply velocity 600–900 fpm (3–4.5 m/s), return 500–700 fpm. Manual D is the ACCA method; we replicate the core of it here.",
      keyTerms: [
        { term: "Static pressure", definition: "Pressure the blower has to push against to move air." },
        { term: "Hydraulic diameter", definition: "Dh = 4A/P; equivalent round diameter for rectangular ducts." },
        { term: "Equivalent length", definition: "Fittings (elbows, tees) add length in friction terms." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Take yesterday's 4-zone house. Look at each duct's velocity and ΔP.",
        hint: "Solver reports perDuct.velocity and pressureDropPa.",
        checkDescription: "all velocities visible",
      },
      {
        instruction: "Shrink one supply duct to 0.02 m² cross-section. Velocity jumps; warning appears.",
        hint: "Smaller area + same CFM = higher velocity = noise.",
        checkDescription: "warning string mentions 'velocity'",
      },
      {
        instruction: "Re-size it back up. Total system ΔP comes back under 125 Pa.",
        hint: "Add up the supply path with highest ΔP — that's the longest run.",
        checkDescription: "highest single duct ΔP < 100 Pa",
      },
    ],
    soloChallenge: {
      prompt: "Build a 3-zone system where every supply duct velocity stays under 4.5 m/s and the longest duct's ΔP is under 50 Pa.",
      successCriteria: "No velocity warning; all ΔP < 50 Pa.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 80, targetTemp: 22, externalWallArea: 60, externalWallR: 5 } },
        { kind: "blower", props: { blowerCFM: 1000 } },
        { kind: "supply_duct", props: { length: 5, crossSection: 0.05 } },
        { kind: "return_duct", props: { length: 8, crossSection: 0.08 } },
      ],
      prompt: "Returns are usually undersized in real installs. Try a 0.03 m² return and watch ΔP balloon.",
    },
    credentialPathway: `Duct design is the heart of the sheet-metal apprenticeship. Pathway: ${SMART_SHEETMETAL}. Adjacent commercial-mechanical pathway: ${IUEC_TX}.`,
  },
  {
    dayNumber: 6,
    slug: "refrigeration-cycle",
    title: "The Refrigeration Cycle",
    shortDescription:
      "Compressor, condenser, expansion valve, evaporator — the four-stage trick that moves heat against its will.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Refrigeration uses a phase change: low-pressure refrigerant absorbs heat indoors (boiling into vapor), the compressor squeezes it to high pressure (and temperature), the condenser rejects heat outdoors (vapor → liquid), and the expansion valve drops pressure for the next pass. Net effect: heat moves from cold to hot, powered by the compressor. Reversing the cycle is what makes a heat pump a heat pump. R-410A is the residential standard; R-454B is the AIM-Act successor as of 2025.",
      keyTerms: [
        { term: "Subcooling", definition: "Liquid refrigerant temp below saturation at condenser pressure — diagnostic." },
        { term: "Superheat", definition: "Vapor refrigerant temp above saturation at evap pressure — diagnostic." },
        { term: "EEV / TXV", definition: "Expansion valve. Electronic (EEV) or thermostatic (TXV)." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Trace the cycle on the diagram: compressor → condenser → expansion → evaporator → repeat.",
        hint: "Heat is absorbed at low pressure and rejected at high pressure.",
        checkDescription: "all 4 stages identified in order",
      },
      {
        instruction: "Explain why a heat pump is just an AC running backwards.",
        hint: "Reversing valve swaps which coil is condenser vs evaporator.",
        checkDescription: "explanation references reversing valve",
      },
      {
        instruction: "Why is EPA Section 608 certification required to work with refrigerant?",
        hint: "Refrigerant venting is regulated under the Clean Air Act.",
        checkDescription: "answer mentions ozone / Clean Air Act / regulated venting",
      },
    ],
    soloChallenge: {
      prompt: "An AC's superheat is 25 °F when it should be 10 °F. Subcooling is normal. What's the most likely cause?",
      successCriteria: "Identifies under-charge / low refrigerant or restricted metering device.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "No solver today. Walk the cycle on a P-h diagram in your head until the compressor work makes intuitive sense.",
    },
    credentialPathway: `${EPA608} is mandatory before you ever touch a gauge set. ${ACC_HVAC} covers the cycle in HART-1401.`,
  },
  {
    dayNumber: 7,
    slug: "heat-pump-operation",
    title: "Heat-Pump Operation",
    shortDescription:
      "One box, two seasons. COP, balance point, defrost, and why heat pumps now win below freezing.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Heat pumps move heat instead of making it, so they deliver 2.5–4× the heat per kWh that resistance does. Modern cold-climate models keep COP > 2 down to −15 °C. Two numbers matter at design: heating capacity at the design outdoor (always less than the rated 47 °F capacity) and the balance point — outdoor temp where the heat pump's output equals the house's load. Below the balance point you need auxiliary heat (strip or backup furnace).",
      keyTerms: [
        { term: "COP", definition: "Coefficient of Performance = heat delivered / electrical input. Heating side metric." },
        { term: "SEER2", definition: "Seasonal Energy Efficiency Ratio (2023+ revision). Cooling side metric." },
        { term: "Balance point", definition: "Outdoor temp where HP output = building load. Below it, aux heat kicks in." },
        { term: "Defrost", definition: "Periodic cycle reversal to clear frost off the outdoor coil." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place a Heat Pump rated at 10.5 kW heating, COP 3.5, and serve a 6 kW house.",
        hint: "Block load 6 kW means equipment is sized fine at design.",
        checkDescription: "1 heat pump + zones totaling ~6 kW load at design",
      },
      {
        instruction: "Run at ambient −5 °C. Verify load < capacity, no warnings.",
        hint: "totalLoad ≤ equipmentCapacity.",
        checkDescription: "no Undersized warning",
      },
      {
        instruction: "Drop ambient to −15 °C. Recompute. Does the heat pump still cover the load?",
        hint: "Real HP capacity drops at low temps; this v1 doesn't auto-derate, so the test is whether YOU realized it should.",
        checkDescription: "learner identifies need for aux heat",
      },
    ],
    soloChallenge: {
      prompt: "Design a heat pump + aux strip system for a Travis County house (5 kW load at −4 °C design, balance point goal 0 °C). Pick capacity + aux size.",
      successCriteria: "Heat-pump heatingCapacity ≥ 5 kW at design; aux backup ≥ load minus HP output at −10 °C.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 250, targetTemp: 22, externalWallArea: 200, externalWallR: 5, internalGain: 300 } },
        { kind: "heat_pump", props: { heatingCapacity: 8500, coolingCapacity: 10500, cop: 3.5, blowerCFM: 1000 } },
        { kind: "refrigerant_line", props: { length: 8 } },
        { kind: "supply_duct", props: { length: 6, crossSection: 0.06 } },
        { kind: "return_duct", props: { length: 8, crossSection: 0.10 } },
      ],
      prompt: "Vary ambient from +10 to −15 °C. You'll see the load curve cross the rated capacity around −5 °C — that's roughly your balance point.",
    },
    credentialPathway: `${NATE} Heat Pump specialty + ${EPA608} are the natural combo. Cold-climate HP installs are the fastest-growing IRA-incentivized work in Texas.`,
  },
  {
    dayNumber: 8,
    slug: "gas-furnace-combustion-safety",
    title: "Gas Furnace & Combustion Safety",
    shortDescription:
      "AFUE, draft, CO. The three numbers that separate a working furnace from a coroner's report.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A gas furnace burns natural gas or propane in a sealed heat exchanger; the products of combustion (CO₂, water vapor, and a tiny bit of CO) vent through a flue, while the heat exchanger transfers the warmth to circulating air. AFUE rates seasonal efficiency: 80 % is code minimum, 95 %+ is condensing (PVC flue). Three things kill people: cracked heat exchanger (CO into the supply air), blocked flue (CO into the room), and improper combustion air (incomplete burn = more CO). Test with a combustion analyzer, every install.",
      keyTerms: [
        { term: "AFUE", definition: "Annual Fuel Utilization Efficiency. Output / input over a season." },
        { term: "Draft", definition: "Negative pressure that pulls combustion products up the flue. Atmospheric, induced, or sealed." },
        { term: "CO", definition: "Carbon monoxide. Odorless, colorless, lethal. Action level 9 ppm; danger > 35 ppm sustained." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Explain how a condensing furnace gets to 95 % AFUE.",
        hint: "It pulls latent heat back out by condensing the water vapor in the exhaust.",
        checkDescription: "answer mentions latent recovery / condensing flue",
      },
      {
        instruction: "List three NFPA 54 / IFGC items you'd check on a furnace startup.",
        hint: "Clearance, combustion air, flue slope/connection, manifold pressure, temperature rise.",
        checkDescription: "at least 3 items listed",
      },
      {
        instruction: "Why is a combustion analyzer non-negotiable?",
        hint: "Eyeballing the flame won't tell you CO. Only an analyzer does.",
        checkDescription: "answer references CO measurement",
      },
    ],
    soloChallenge: {
      prompt: "A homeowner says the furnace 'smells funny.' What do you check first, and what reading would force you to red-tag?",
      successCriteria: "Identifies CO testing; red-tag threshold > 100 ppm air-free or any spillage at draft hood.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "No solver. Walk the 14-point combustion safety checklist in your head — TXG 2018 IFGC §304/§503.",
    },
    credentialPathway: `Combustion safety is in every Texas A/C-Heating Contractor license exam. ${NATE} Gas Heating specialty + manufacturer combustion-analyzer training (Bacharach, Testo).`,
  },
  {
    dayNumber: 9,
    slug: "thermostats-zoning",
    title: "Thermostats & Zoning",
    shortDescription:
      "One stat per room or one stat per house. Dampers and bypass make multi-zone work; smart stats make it actually save energy.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "A single-zone system holds one average temperature with one thermostat. Zoning splits the duct trunk into independently-damped branches, each with its own thermostat — so the bedroom can hold 18 °C while the office holds 22 °C. The trick is the bypass / variable-speed blower: when only one zone is calling, the blower has to slow down or dump excess air, or you'll over-pressurize the trunk and short-cycle the equipment.",
      keyTerms: [
        { term: "Zone damper", definition: "Motorized damper in a branch duct, opened by a calling thermostat." },
        { term: "Bypass duct", definition: "Diverts excess supply air back to the return when only one zone is open." },
        { term: "Setback", definition: "Temporary setpoint reduction (e.g., night). 1 °C setback ≈ 1–3 % season savings." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build a 3-zone system: living room, two bedrooms. Add a damper on each branch supply duct.",
        hint: "Damper kind exists in the palette; place it inline before the supply register.",
        checkDescription: "3 dampers placed",
      },
      {
        instruction: "Close the bedroom dampers (set open: false). Run.",
        hint: "Closed dampers should reduce airflow to those zones.",
        checkDescription: "perDuct for bedroom branches has near-zero CFM",
      },
      {
        instruction: "Re-open. Notice how load distribution and per-duct CFM change.",
        hint: "Returns aggregate; supplies follow the call signals.",
        checkDescription: "all branch ducts back to nominal CFM",
      },
    ],
    soloChallenge: {
      prompt: "Two bedrooms have a 4 °C setpoint difference (20 °C vs 24 °C). Sketch the damper + thermostat layout to hold both — and identify the failure mode if you don't add a bypass.",
      successCriteria: "Identifies bypass need; if missing → blower over-pressures or trips on high static.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 80, targetTemp: 22, externalWallArea: 60, externalWallR: 5 } },
        { kind: "zone", props: { volume: 50, targetTemp: 20, externalWallArea: 40, externalWallR: 5 } },
        { kind: "thermostat", props: { setpoint: 22 } },
        { kind: "thermostat", props: { setpoint: 20 } },
        { kind: "damper" },
        { kind: "damper" },
        { kind: "heat_pump" },
      ],
      prompt: "Smart stats add learning (ecobee, Nest) and remote sensors. Energy savings come from the schedule, not the algorithm.",
    },
    credentialPathway: `Zoning controls are a NATE Air Distribution specialty topic. Honeywell, Ecobee, and Nest all publish installer-certification tracks.`,
  },
  {
    dayNumber: 10,
    slug: "iaq-ventilation",
    title: "IAQ & Ventilation",
    shortDescription:
      "Filtration, fresh air, humidity. ASHRAE 62.2 is the floor — comfort and IAQ ride on top of it.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Indoor Air Quality is filtration + ventilation + humidity control. ASHRAE 62.2 sets the minimum continuous outdoor airflow at 7.5 CFM/person + 0.03 CFM/ft². MERV 11+ filters catch most allergens; HEPA is overkill for residential and adds static pressure. A humidifier holds winter indoor humidity around 30–40 % (above is condensation risk on windows). ERV/HRV recovers 70–80 % of the energy in exhausted air — required to make ventilation affordable in cold or hot climates.",
      keyTerms: [
        { term: "MERV", definition: "Minimum Efficiency Reporting Value. Higher = finer particulate capture, higher ΔP." },
        { term: "ERV / HRV", definition: "Energy / Heat Recovery Ventilator. Pre-conditions outdoor air with exhaust energy." },
        { term: "ACH", definition: "Air Changes per Hour. Volume × ACH / 3600 = m³/s ventilation rate." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Add a Filter and a Humidifier to a 2-zone house. Both go in the air-handler accessory chain.",
        hint: "Accessory palette.",
        checkDescription: "1 filter + 1 humidifier placed",
      },
      {
        instruction: "Set the filter to MERV 13 (ΔP ≈ 75 Pa). The blower's external static now has less margin.",
        hint: "Higher MERV = higher ΔP. Subtract from blower static rating.",
        checkDescription: "filter ΔP property ≥ 60",
      },
      {
        instruction: "Add 0.025 m³/s ventilation per zone (~53 CFM). Run cooling design and see latent load rise.",
        hint: "Outdoor air carries moisture in summer.",
        checkDescription: "totalLatent > 0",
      },
    ],
    soloChallenge: {
      prompt: "A 4-person family in a 200 m² house needs ASHRAE 62.2 ventilation. Compute the required outdoor airflow (CFM) and how much latent it adds at 32 °C / W=0.018 outdoor.",
      successCriteria: "Required ventilation ≈ 30 + 65 = 95 CFM; latent computed from m·h_fg·ΔW.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 200, occupancy: 4, targetTemp: 24, externalWallArea: 150, externalWallR: 5 } },
        { kind: "filter", props: { merv: 13, pressureDropPa: 75 } },
        { kind: "humidifier" },
        { kind: "heat_pump" },
      ],
      prompt: "Try MERV 8 vs MERV 13. The latent and IAQ benefit is real; the static-pressure tax is too.",
    },
    credentialPathway: `IAQ is a NATE specialty and a growing market post-COVID. ${HVAC_EXCELLENCE} has a dedicated IAQ track.`,
  },
  {
    dayNumber: 11,
    slug: "commissioning-balancing",
    title: "Commissioning & Air Balancing",
    shortDescription:
      "Installed isn't done. Measure CFM per register, set dampers, verify static — only then does the design become reality.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Commissioning is the verification step every install skips. Air balance: measure CFM at every register with a flow hood, compare to Manual D design, adjust balancing dampers until each room is within ±10 %. Static pressure: measure across the blower with a manometer — over 0.8 in.w.c. external static means undersized ducts. Refrigerant charge: weigh in OR set by subcool/superheat per manufacturer instructions. Document everything; this is what protects you on callbacks.",
      keyTerms: [
        { term: "TAB", definition: "Testing, Adjusting, and Balancing. The trade discipline of commissioning." },
        { term: "External static", definition: "Static pressure the blower fights, outside its own cabinet." },
        { term: "Total external static", definition: "Sum of all duct + filter + coil ΔPs the blower sees." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Take a finished 3-zone design. Sum the ΔP of supply path + return path + filter + coil.",
        hint: "Coil typical 75 Pa; longest supply + longest return + filter.",
        checkDescription: "summed external static reported",
      },
      {
        instruction: "If total ESP > 125 Pa (0.5 in.w.c.), the blower is being asked too much. Identify the worst offender.",
        hint: "Look at the per-duct table; the highest ΔP duct is usually the longest or smallest.",
        checkDescription: "highest ΔP duct identified",
      },
      {
        instruction: "Re-size or shorten that duct until total ESP < 125 Pa.",
        hint: "Increase cross-section OR shorten run.",
        checkDescription: "summed external static < 125 Pa",
      },
    ],
    soloChallenge: {
      prompt: "Given a 4-zone house with one supply duct hitting 80 Pa, total ESP = 200 Pa, blower rated 125 Pa — fix it by changing duct sizing only.",
      successCriteria: "Final total ESP < 125 Pa; per-zone CFM still within ±10 % of required.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 80, targetTemp: 22, externalWallArea: 60, externalWallR: 5 } },
        { kind: "zone", props: { volume: 50, targetTemp: 20, externalWallArea: 40, externalWallR: 5 } },
        { kind: "supply_duct", props: { length: 20, crossSection: 0.04 } },
        { kind: "return_duct", props: { length: 12, crossSection: 0.06 } },
        { kind: "blower", props: { blowerCFM: 1000, staticPressureRating: 125 } },
      ],
      prompt: "Long, skinny supply duct on purpose — the kind of mistake a hurried installer makes. Find and fix it.",
    },
    credentialPathway: `${HVAC_EXCELLENCE} Employment-Ready exam tests TAB directly. NEBB and AABC offer dedicated TAB certifications above the technician level.`,
  },
  {
    dayNumber: 12,
    slug: "codes-imc-iecc",
    title: "Codes: IMC, IECC, NFPA 54",
    shortDescription:
      "The Mechanical Code, the Energy Code, the Fuel Gas Code. Texas adopts them with amendments — know what's local.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Three codes govern HVAC work. The International Mechanical Code (IMC) handles duct construction, equipment installation, clearances. The International Energy Conservation Code (IECC) sets minimum equipment efficiency and envelope standards. NFPA 54 / International Fuel Gas Code (IFGC) covers gas-fired appliances — venting, combustion air, manifold pressure. Texas adopts these on a roughly 6-year cycle (currently 2018 IMC/IECC/IFGC for most jurisdictions; some Austin/Pflugerville amendments). Always check the local AHJ.",
      keyTerms: [
        { term: "AHJ", definition: "Authority Having Jurisdiction — the local inspector who interprets code." },
        { term: "IECC", definition: "Sets envelope U-values, equipment SEER/AFUE minimums, duct R-value." },
        { term: "IFGC", definition: "International Fuel Gas Code, the basis of TX gas-piping requirements." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Name the section of IMC that governs duct insulation in unconditioned space.",
        hint: "IMC 604.",
        checkDescription: "IMC 604 cited",
      },
      {
        instruction: "What's the minimum efficiency for a new residential AC in IECC 2021 (Texas climate zone 2A)?",
        hint: "Table C403/R403.",
        checkDescription: "answer ≥ SEER2 14.3 (2023 federal floor) and identifies climate zone",
      },
      {
        instruction: "What clearance does NFPA 54 require around a draft hood?",
        hint: "Combustion air + service clearance per Table 5.5.",
        checkDescription: "answer references combustion air clearance",
      },
    ],
    soloChallenge: {
      prompt: "A homeowner wants you to install a furnace in a closet with a sealed door. What does NFPA 54 require for combustion air?",
      successCriteria: "Identifies dedicated outdoor combustion air (direct vent or two openings sized per NFPA 54 §9.3).",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "No solver. Bookmark Austin/Travis County amendments; some jurisdictions require 90 %+ AFUE on new gas installs.",
    },
    credentialPathway: `Texas Department of Licensing & Regulation issues the Air Conditioning Contractor license. Code knowledge is 30 % of the exam.`,
  },
  {
    dayNumber: 13,
    slug: "troubleshooting",
    title: "Diagnostic Procedures",
    shortDescription:
      "The five-step service call: ask, observe, measure, decide, document. The difference between a parts-changer and a tech.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Real troubleshooting is procedural, not guess-and-replace. (1) ASK the customer for the symptom and the history. (2) OBSERVE the unit running — listen, smell, watch. (3) MEASURE — temperatures, pressures, voltages, amps. (4) DECIDE based on the measurement against the spec, not the symptom. (5) DOCUMENT — readings, parts, recommendations. A bad capacitor reads as a hard-starting compressor; a dirty coil reads as low capacity; a low charge reads as high superheat. Same symptoms, different fixes.",
      keyTerms: [
        { term: "Superheat", definition: "Above-saturation vapor temp. High = under-charge / restricted metering." },
        { term: "Subcooling", definition: "Below-saturation liquid temp. Low = under-charge; high = over-charge." },
        { term: "ΔT across coil", definition: "Return-air − supply-air. Normal 8–12 °C; low = airflow problem or refrigerant problem." },
      ],
    },
    guidedSteps: [
      {
        instruction: "AC isn't cooling. Customer says it 'used to be fine.' What's your first three measurements?",
        hint: "Static pressure, ΔT across the coil, suction/discharge pressure.",
        checkDescription: "answer includes ΔT or static",
      },
      {
        instruction: "Static is 0.95 in.w.c. (rated 0.5). ΔT is 7 °C (rated 11 °C). What's the most likely cause?",
        hint: "Airflow problem first, not refrigerant.",
        checkDescription: "answer identifies airflow / dirty filter / undersized return",
      },
      {
        instruction: "Filter is brand new and the blower wheel is clean. Where do you look next?",
        hint: "Coil. Especially evaporator on the supply side.",
        checkDescription: "answer references evaporator coil",
      },
    ],
    soloChallenge: {
      prompt: "Heat pump in heating: ΔT across the indoor coil is 4 °C, static is normal, superheat 28 °F. Diagnose.",
      successCriteria: "Identifies low-charge / restricted metering; recommends weigh-in or recovery + recharge.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Practice fault trees: low-airflow / low-charge / mechanical (compressor, motor, contactor). Each has its own measurement set.",
    },
    credentialPathway: `${NATE} service exams are entirely diagnostic. ${HVAC_EXCELLENCE} Employment-Ready Service Tech track is the natural next step.`,
  },
  {
    dayNumber: 14,
    slug: "efficiency-retrofits",
    title: "High-Efficiency Retrofits",
    shortDescription:
      "Heat-pump conversions, duct sealing, smart stats. IRA tax credits + utility rebates make the math work.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "The 2022 Inflation Reduction Act funds the largest residential efficiency push in U.S. history: 25C tax credit up to $2,000/yr for heat pumps, $1,200/yr for envelope work, plus state HEEHRA rebates that cover 50–100 % of cost for low-income households. Best retrofits in order of $/kWh saved: (1) air seal the envelope, (2) replace 80 % AFUE furnace + 14 SEER AC with a cold-climate heat pump, (3) MERV 13 + ERV, (4) variable-speed blower, (5) smart thermostat. Right-size before you electrify.",
      keyTerms: [
        { term: "IRA 25C", definition: "Federal income-tax credit, 30 % of project cost up to caps. Through 2032." },
        { term: "HEEHRA", definition: "High-Efficiency Electric Home Rebate Act. State-administered point-of-sale rebates." },
        { term: "Cold-climate HP", definition: "ENERGY STAR-rated to maintain capacity below 17 °F." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Take a 1980s-era house: R-11 walls, R-19 roof, ambient −5 °C. Compute heating load.",
        hint: "Bigger load than you'd guess for the same square footage.",
        checkDescription: "load reported",
      },
      {
        instruction: "Upgrade to R-23 walls (R-4 m²K/W) and R-49 roof (R-8.6). Recompute.",
        hint: "Same equipment, smaller load. This is the cheapest savings on the curve.",
        checkDescription: "load reduced by ≥ 35 %",
      },
      {
        instruction: "Now downsize the heat pump from 14 kW to 7 kW. Confirm no Undersized warning at the post-retrofit envelope.",
        hint: "Right-sizing IS the retrofit.",
        checkDescription: "no Undersized warning at design",
      },
    ],
    soloChallenge: {
      prompt: "Convert a 4-ton AC + 80 kBTU furnace to a single 3-ton cold-climate heat pump. Show that envelope upgrades make the math work for an 11 kW design load → 8 kW post-retrofit.",
      successCriteria: "Final design: heat pump 8.5–9.5 kW, no warnings.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 250, targetTemp: 22, externalWallArea: 200, externalWallR: 2, internalGain: 300 } },
        { kind: "heat_pump", props: { heatingCapacity: 14000, coolingCapacity: 14000, blowerCFM: 1400 } },
      ],
      prompt: "Walk the audit: envelope → equipment → controls. Most homeowners go in reverse and waste money.",
    },
    credentialPathway: `IRA retrofit work is the single fastest-growing HVAC niche. ${ACC_HVAC} now teaches it; BPI Building Analyst pairs naturally.`,
  },
  {
    dayNumber: 15,
    slug: "whole-home-capstone",
    title: "Whole-Home Capstone",
    shortDescription:
      "Design, size, lay out, balance, and commission a 3-zone home. End-to-end, judged on everything you've learned.",
    engineMode: "thermal-airflow",
    concept: {
      blurb:
        "Capstone day. You'll design a 3-zone Texas home (Pflugerville, climate zone 2A) end-to-end: Manual J load, equipment selection (heat pump preferred for IRA credit), Manual D duct sizing, zone controls, IAQ accessories, commissioning targets. The rubric scores: load accuracy, equipment right-sizing (no oversize/undersize warnings), duct static within blower rating, IAQ adequate, and economically defensible (capacity within 20 % of load).",
      keyTerms: [
        { term: "Manual J", definition: "Residential load calculation." },
        { term: "Manual D", definition: "Residential duct design." },
        { term: "Manual S", definition: "Equipment selection — match design load to certified performance data." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build the three zones: Living (90 m²), Kitchen (35 m²), Bedrooms-combined (90 m²).",
        hint: "Use R-5 walls, varied internal gains.",
        checkDescription: "3 zones placed",
      },
      {
        instruction: "Add a heat pump sized to design heating load (Travis County design −4 °C cooling 36 °C).",
        hint: "Check both heating and cooling at design ambient.",
        checkDescription: "no Undersized OR Oversized warnings at both runs",
      },
      {
        instruction: "Lay out supply + return ducts; verify total ESP < 125 Pa.",
        hint: "Use the perDuct table; size each branch to keep velocity 3–4.5 m/s.",
        checkDescription: "all velocity warnings absent",
      },
      {
        instruction: "Add MERV 11 filter, humidifier, and per-zone dampers + thermostats. Run final.",
        hint: "Full IAQ + control stack.",
        checkDescription: "filter, humidifier, ≥2 dampers, ≥2 thermostats present",
      },
    ],
    soloChallenge: {
      prompt: "Same 3-zone house, but the customer wants gas heat. Swap the heat pump for a gas furnace + AC coil; defend the choice with combustion-air, AFUE, and operating-cost math vs the heat pump option.",
      successCriteria: "Furnace sized correctly; combustion-air requirement identified; honest cost-vs-IRA-incentive comparison.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "zone", props: { volume: 220, targetTemp: 22, externalWallArea: 90, externalWallR: 5, internalGain: 200 } },
        { kind: "zone", props: { volume: 90, targetTemp: 22, externalWallArea: 35, externalWallR: 5, internalGain: 400 } },
        { kind: "zone", props: { volume: 220, targetTemp: 20, externalWallArea: 90, externalWallR: 5, internalGain: 150 } },
        { kind: "heat_pump", props: { heatingCapacity: 10500, coolingCapacity: 10500, cop: 3.5, blowerCFM: 1200 } },
        { kind: "blower", props: { blowerCFM: 1200, staticPressureRating: 125 } },
        { kind: "filter", props: { merv: 11, pressureDropPa: 50 } },
      ],
      prompt: "Capstone. When you're done, you've designed something a real Pflugerville inspector would sign off on. That's the credential pathway in one image.",
    },
    credentialPathway: `Capstone parallels the practical exam for ${NATE} Installation + ${HVAC_EXCELLENCE} Employment-Ready. Strong portfolio piece for ${ACC_HVAC}, ${SMART_SHEETMETAL}, and (for learners interested in commercial-mechanical work) ${IUEC_TX} apprenticeship interviews.`,
  },
];
