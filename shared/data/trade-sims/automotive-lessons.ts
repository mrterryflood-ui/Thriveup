/**
 * Automotive trade — 15-day curriculum content.
 *
 * Mirrors the Electrical lesson schema exactly so the lesson player can mount
 * the same 5-loop runner. Engine modes:
 *   - "linear-dc"     → run the electrical MNA solver via the automotive
 *                       component adapter in `client/src/lib/trade-sims/automotive/component-defs.ts`.
 *   - "concept-only"  → no simulator; walkthrough + sandbox + inspection.
 *
 * Days using the solver: 2 (battery/charging), 3 (starting), 4 (ignition primary),
 * 9 (wiring diagram). 11 of 15 lessons are concept-only — diagnostics is a
 * pattern-recognition discipline more than a circuit-simulation one.
 *
 * Credential pathway hooks reference real programs only — ASE A1-A9 light
 * vehicle certifications, NCCER Automotive Level 1, ACC automotive certificate,
 * EPA Section 609 MVAC certification, IUOE Local 132 for heavy-equipment
 * crossovers. No invented partnerships.
 */

import type { LessonEngineMode, TradeMeta } from "./types";

export type LessonConcept = {
  blurb: string;
  keyTerms: Array<{ term: string; definition: string }>;
  diagramKey?: string;
};

export type LessonGuidedStep = {
  instruction: string;
  hint: string;
  checkDescription: string;
};

export type LessonSoloChallenge = {
  prompt: string;
  successCriteria: string;
  scoringRubric: { correctness: number; time: number; componentCount: number };
};

export type LessonSandboxStarter = {
  initialComponents: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  prompt: string;
};

export interface AutomotiveLessonContent {
  dayNumber: number;
  slug: string;
  title: string;
  shortDescription: string;
  engineMode: LessonEngineMode;
  concept: LessonConcept;
  guidedSteps: LessonGuidedStep[];
  soloChallenge: LessonSoloChallenge;
  sandboxStarter: LessonSandboxStarter;
  credentialPathway: string;
}

export const AUTOMOTIVE_TRADE_META: TradeMeta = {
  slug: "automotive",
  name: "Automotive",
  tagline: "Diagnose like a journeyman, even before you turn a wrench.",
  description:
    "Light-duty automotive repair and diagnostics. Start with the 12-volt system you can simulate end-to-end, then move into the diagnostic pattern recognition that separates real techs from parts swappers.",
  iconKey: "car",
  displayOrder: 5,
};

export const AUTOMOTIVE_LESSONS: AutomotiveLessonContent[] = [
  {
    dayNumber: 1,
    slug: "vehicle-systems-overview",
    title: "Vehicle Systems Overview",
    shortDescription: "The eight systems every light-duty car has, and how they hand off to each other.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A car is eight systems pretending to be one machine: powertrain, fuel, ignition, electrical/charging, cooling, lubrication, exhaust/emissions, and brakes. Every diagnosis starts by asking which system is misbehaving — get that wrong and you waste hours. Today you learn the boundaries so future symptoms tell you where to look first.",
      keyTerms: [
        { term: "Powertrain", definition: "Engine + transmission + drivetrain — what makes the wheels turn." },
        { term: "PCM", definition: "Powertrain Control Module — the computer running engine + transmission." },
        { term: "OBD-II", definition: "Standardized diagnostic interface every gas vehicle since 1996 has." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an ECU/PCM, an OBD-II port, and a 12 V battery on the canvas.", hint: "These are the three things on every modern diagnosis.", checkDescription: "ecu_pcm + obd2_port + car_battery present" },
      { instruction: "Click the ECU/PCM to inspect it. Read the description.", hint: "The inspector panel opens on the right.", checkDescription: "ecu_pcm inspected at least once" },
      { instruction: "Map a customer complaint — 'no crank' — to the most likely system.", hint: "No crank ≠ no start. Different system.", checkDescription: "learner selects 'electrical/charging' as primary suspect" },
    ],
    soloChallenge: {
      prompt: "A customer says 'engine cranks but won't start.' Pick the three systems most likely involved, in priority order.",
      successCriteria: "Learner identifies fuel + ignition + (sensors / immobilizer) — exact order matters less than the three.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "ecu_pcm" }, { kind: "obd2_port" }], prompt: "Drag each major system label next to the parts that belong to it. There is no wrong answer — explain your groupings in the debrief." },
    credentialPathway:
      "System-level thinking is what ASE testers look for first. Pass this and you're ready for the ASE G1 Auto Maintenance and Light Repair pre-test offered at ACC.",
  },
  {
    dayNumber: 2,
    slug: "battery-and-charging",
    title: "12-Volt Battery & Charging System",
    shortDescription: "Build the live 12 V system that powers everything else.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Every modern car starts as a 12 V circuit. A lead-acid battery sits at 12.6 V at rest; once the engine runs, the alternator pushes 13.8-14.4 V to charge it back. Drop below 12.4 V and you have a discharged battery; drop below 9.6 V under crank and you have a failing one. Today you build that exact circuit and watch the numbers.",
      keyTerms: [
        { term: "State of charge (SOC)", definition: "How full the battery is, measured at rest in volts." },
        { term: "CCA", definition: "Cold Cranking Amps — how much current the battery can deliver at 0°F for 30 sec." },
        { term: "Parasitic draw", definition: "Current the car pulls even when off — should be under 50 mA on most vehicles." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a 12 V car battery and a chassis ground on the canvas.", hint: "Battery negative will wire to chassis ground.", checkDescription: "car_battery + ground_point present" },
      { instruction: "Place an alternator and wire it in parallel with the battery (both + terminals together, both negatives to ground).", hint: "When the engine runs, alternator wins. When off, battery is the only source.", checkDescription: "alternator wired in parallel with battery" },
      { instruction: "Place a 1 Ω resistor as a stand-in load (headlights). Run with alternator OFF.", hint: "You should see ~12.6 V at the load.", checkDescription: "load voltage between 12.4 V and 12.7 V with alternator off" },
      { instruction: "Toggle the alternator ON and re-run.", hint: "Now you should see ~14 V at the load — the alternator wins.", checkDescription: "load voltage between 13.8 V and 14.4 V with alternator on" },
    ],
    soloChallenge: {
      prompt: "Wire a working 12 V system. With the alternator off the load should see 12.6 V; with it on, between 13.8 and 14.2 V.",
      successCriteria: "Both voltage targets met in the same circuit by toggling the alternator's running flag.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "car_battery", props: { voltage: 12.6 } }, { kind: "alternator", props: { voltage: 14.2, running: false } }, { kind: "ground_point" }], prompt: "Add loads. Try a 0.1 Ω load (heavy — headlights + heater on a cold day). What happens to bus voltage when the alternator is off?" },
    credentialPathway:
      "Battery and charging diagnosis is question 1 on ASE A6 Electrical/Electronic Systems. ACC's Light Duty Diesel and Automotive programs both start here.",
  },
  {
    dayNumber: 3,
    slug: "starting-system",
    title: "Starting System",
    shortDescription: "Why 'cranks slow' and 'no crank' point at different problems.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "The starter motor is a 12 V monster. It draws 150-300 A while cranking — enough to drop a healthy battery from 12.6 V down to ~10 V momentarily. If your battery sags below ~9.6 V under cranking load, the cells can't deliver the current, and you'll diagnose it as a weak battery, NOT a bad starter. Today you build the circuit and watch voltage sag in real time.",
      keyTerms: [
        { term: "Voltage sag", definition: "Temporary voltage drop when a large load is applied — diagnostic gold." },
        { term: "Starter solenoid", definition: "High-current relay that connects battery to starter motor when you turn the key." },
        { term: "Internal resistance", definition: "The battery's own resistance — rises as the battery ages, worsening sag." },
      ],
    },
    guidedSteps: [
      { instruction: "Build a battery + fuse + starter motor circuit, with chassis ground returning the loop.", hint: "Use a 200 A fuse so it doesn't immediately blow.", checkDescription: "car_battery + fuse(200A, not blown) + starter_motor + ground_point wired in a complete loop" },
      { instruction: "Run the sim. Note the starter current and battery+ voltage.", hint: "Expect ~250 A current, ~12.5 V at battery+ (small drop across the tiny fuse resistance).", checkDescription: "starter current between 200 A and 300 A" },
      { instruction: "Mark the fuse as BLOWN. Re-run.", hint: "Open circuit — starter current should go to zero.", checkDescription: "starter current = 0 A when fuse blown" },
    ],
    soloChallenge: {
      prompt: "A car cranks slowly. You suspect either a weak battery or a corroded starter cable. Build a model that shows ~150 A starter current (instead of 250 A). Identify which component you adjusted.",
      successCriteria: "Starter current measures between 130 and 170 A, achieved by either lowering battery voltage to ~10 V or raising the cable resistance via a fuse-rated-down stand-in.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: { initialComponents: [{ kind: "car_battery", props: { voltage: 12.6 } }, { kind: "fuse", props: { ratedAmps: 200, blown: false } }, { kind: "starter_motor", props: { resistance: 0.05 } }, { kind: "ground_point" }], prompt: "Lower the battery voltage to 10 V — what happens to starter current? At what voltage does the starter draw less than 100 A?" },
    credentialPathway:
      "Starting-system diagnosis is direct-tested on ASE A6. NCCER Automotive Level 1 Module 7 walks the same circuit you just built.",
  },
  {
    dayNumber: 4,
    slug: "ignition-primary",
    title: "Ignition System (Primary Side)",
    shortDescription: "The low-voltage trigger that fires every spark plug.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "A spark plug needs 20,000-40,000 V across its gap. You don't have that in the car. What you have is a 12 V primary winding in the ignition coil — when the ECU grounds it and then breaks the ground, the collapsing magnetic field induces the high voltage on the secondary winding. Today you simulate the primary side (the part the solver can model) and learn why the secondary is a separate, concept-only domain.",
      keyTerms: [
        { term: "Primary winding", definition: "Low-voltage side of the ignition coil — 12 V, ~0.5-1.5 Ω." },
        { term: "Secondary winding", definition: "High-voltage side — 20-40 kV output, NOT simulated here." },
        { term: "Dwell", definition: "Time the primary is grounded (energizing the coil) before the spark event." },
      ],
    },
    guidedSteps: [
      { instruction: "Wire a 12 V battery → ignition coil primary → ground, with no current limiting other than the coil's primary resistance.", hint: "Coil primary defaults to 0.5 Ω.", checkDescription: "car_battery + ignition_coil + ground wired in a complete primary-side loop" },
      { instruction: "Run the sim. Read the primary current.", hint: "I = V / R = 12.6 / 0.5 ≈ 25 A — that's why the ECU only grounds it for a few milliseconds.", checkDescription: "ignition coil primary current between 22 A and 30 A" },
      { instruction: "Add a spark plug to the canvas as a label-only component. Note that it does NOT join the circuit.", hint: "Secondary side is concept-only. The lesson player will mark it as inspectable.", checkDescription: "spark_plug placed; solver elements unchanged" },
    ],
    soloChallenge: {
      prompt: "A coil with 1.5 Ω primary resistance is in the parts bin. Replace your 0.5 Ω coil with it and predict the new primary current before you run the sim.",
      successCriteria: "Learner states 'about 8 A' before running, then confirms within ±15%.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "car_battery", props: { voltage: 12.6 } }, { kind: "ignition_coil", props: { primaryResistance: 0.5 } }, { kind: "spark_plug" }, { kind: "ground_point" }], prompt: "Add a fuse rated 20 A in line with the coil. What happens? (Hint: fuses don't actually blow in the sim — but mark it 'blown' and see what the symptom would be.)" },
    credentialPathway:
      "Primary ignition diagnostics is on ASE A8 Engine Performance. The wiring you just built is what's tested with a primary current waveform on a scope in advanced ACC courses.",
  },
  {
    dayNumber: 5,
    slug: "fuel-system-basics",
    title: "Fuel System Basics",
    shortDescription: "From tank to injector — pressure, volume, and how the ECU decides how much.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "The fuel system has one job: deliver pressurized, filtered gasoline to the injectors on demand. The pump (in the tank or inline) maintains 40-60 PSI for port injection or 1,500-3,000 PSI for direct injection. The ECU opens each injector for a precise number of milliseconds — that's pulse width, and it's controlled by the MAF, O2, and coolant-temp sensors you'll meet on Day 8.",
      keyTerms: [
        { term: "Pulse width", definition: "How long the ECU opens each injector — measured in milliseconds." },
        { term: "Fuel trim", definition: "ECU's running adjustment to pulse width based on O2 feedback. Short-term and long-term." },
        { term: "Direct injection", definition: "Fuel sprayed directly into the cylinder at very high pressure (1,500+ PSI)." },
      ],
    },
    guidedSteps: [
      { instruction: "Walk through the path: tank → pump → filter → rail → injector → cylinder.", hint: "Each step is a place a problem can hide.", checkDescription: "learner walks the fuel path in order" },
      { instruction: "Identify the two main pressure ranges (port vs direct injection).", hint: "An order of magnitude different.", checkDescription: "learner notes ~50 PSI vs ~2000 PSI" },
      { instruction: "Match symptom → likely fuel-system component: 'engine cuts out under heavy load' →", hint: "Volume problem under demand, not a pressure-at-idle problem.", checkDescription: "learner identifies fuel pump or restricted filter" },
    ],
    soloChallenge: {
      prompt: "A customer complains of long crank times when the car has sat overnight, but it starts fine if they restart within an hour. Pick the single most likely fuel-system culprit and justify in one sentence.",
      successCriteria: "Leaking injector or failed fuel pump check valve (loss of residual pressure) — either accepted with correct reasoning.",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Sketch the fuel path on the canvas using any labels available. Mark every place a fault could cause 'long crank when cold.'" },
    credentialPathway:
      "Fuel-system fundamentals open ASE A8 Engine Performance and ASE L1 Advanced Engine Performance pathways. ACC's Engine Performance certificate covers this in week 2.",
  },
  {
    dayNumber: 6,
    slug: "emissions-system-basics",
    title: "Emissions System Basics",
    shortDescription: "The catalytic converter, EVAP, EGR, and why one P-code never tells the whole story.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Emissions are how the car keeps unburned hydrocarbons, carbon monoxide, and NOx out of the air. Three systems do most of the work: the catalytic converter (cleans exhaust), EVAP (captures fuel-tank vapors), and EGR (recirculates exhaust into the intake to lower combustion temps). When OBD-II sees any of these failing, you get a code in the P0400 or P0420 range. Today you learn which code maps to which system.",
      keyTerms: [
        { term: "Catalytic converter", definition: "Honeycomb of precious metals that converts CO/HC/NOx to CO₂, H₂O, and N₂." },
        { term: "EVAP", definition: "Evaporative Emission Control — captures gas-tank vapors in a charcoal canister." },
        { term: "EGR", definition: "Exhaust Gas Recirculation — lowers combustion temps to reduce NOx." },
      ],
    },
    guidedSteps: [
      { instruction: "Match P-code to system: P0420 → ", hint: "Catalyst efficiency below threshold.", checkDescription: "learner selects catalytic converter" },
      { instruction: "Match P-code to system: P0440-P0457 → ", hint: "Family of EVAP leak codes.", checkDescription: "learner selects EVAP" },
      { instruction: "Match P-code to system: P0401 →", hint: "Insufficient flow.", checkDescription: "learner selects EGR" },
    ],
    soloChallenge: {
      prompt: "A car throws a P0442 (small EVAP leak). The customer says they smell gas in the driveway. List three places to check, in priority order.",
      successCriteria: "Gas cap, EVAP hoses, charcoal canister vent valve — in any defensible order with one-line reasoning each.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Label the three emissions subsystems on the canvas. Note which one is most often the cause of a Check Engine Light." },
    credentialPathway:
      "Emissions diagnostics is the highest-margin work in most shops — and it's a separate ASE certification (L1). NCCER Automotive Level 2 Module 4 covers the same material at apprentice depth.",
  },
  {
    dayNumber: 7,
    slug: "obd2-and-dtcs",
    title: "OBD-II & Diagnostic Trouble Codes",
    shortDescription: "Reading the language of the ECU — and knowing when a code is the cause vs the symptom.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "OBD-II is the standard every gas vehicle since 1996 must support. Plug into the 16-pin port under the dash and you can read Diagnostic Trouble Codes (DTCs), freeze-frame data (a snapshot of what the engine was doing when the code set), and live data. The structure is consistent: P=Powertrain, B=Body, C=Chassis, U=Network. The next digit splits generic (0) from manufacturer-specific (1). Today you learn to read codes, not chase them.",
      keyTerms: [
        { term: "DTC", definition: "Diagnostic Trouble Code — five-character code (P0301, etc.) describing a fault." },
        { term: "Freeze frame", definition: "Snapshot of sensor data captured the moment a code set. Tells you context." },
        { term: "Pending code", definition: "A fault detected once but not yet set the CEL — early warning." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an OBD-II port and ECU on the canvas. Wire the CAN-H and CAN-L pairs.", hint: "Real CAN is differential — concept here is just 'they connect to the bus.'", checkDescription: "obd2_port + ecu_pcm placed and CAN pins linked" },
      { instruction: "Inspect the OBD-II port to see its 16-pin layout.", hint: "Pins 4, 5 are ground; 16 is battery+; 6, 14 are CAN-H/L on most modern cars.", checkDescription: "obd2_port inspected" },
      { instruction: "Match the prefix: a P0301 means…", hint: "P = powertrain, 03 = ignition/misfire family, 01 = cylinder 1.", checkDescription: "learner identifies misfire on cylinder 1" },
    ],
    soloChallenge: {
      prompt: "Three codes are present: P0300, P0171, P0420. Which is most likely the ROOT cause, and which two are downstream symptoms?",
      successCriteria: "Root = P0171 (lean condition causes misfires + cooks the catalyst over time); P0300 and P0420 are downstream. Reasoning matters more than exact word choice.",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [{ kind: "obd2_port" }, { kind: "ecu_pcm" }], prompt: "Add 'sensor' labels for MAF, O2, and coolant-temp on the canvas, and draw arrows showing which way the data flows to the ECU." },
    credentialPathway:
      "OBD-II literacy is required on ASE A6, A8, and L1. Most independent shops will pay any tech a $1-2/hr bump after they pass ASE A8.",
  },
  {
    dayNumber: 8,
    slug: "sensor-diagnostics",
    title: "Sensor Diagnostics: MAF, O₂, Coolant Temp",
    shortDescription: "How to tell a bad sensor from a sensor reporting a real problem.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "The three sensors that drive most diagnostics: MAF (mass air flow — tells the ECU how much air is coming in), O2 (tells the ECU whether the air-fuel mix is right after burning), and coolant temp (tells the ECU whether to enrich for cold-start). A bad MAF will make the engine run rich or lean depending on fault mode. A bad O2 will lock fuel trim into a steady wrong number. A bad coolant temp sensor will give you cold-start problems even in summer.",
      keyTerms: [
        { term: "MAF", definition: "Mass Air Flow — measures incoming air in grams per second." },
        { term: "Stoichiometric", definition: "The exact air-fuel ratio for clean combustion — 14.7:1 for gasoline." },
        { term: "Fuel trim", definition: "ECU's correction factor based on O2 feedback. STFT (short term) + LTFT (long term)." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a MAF, an O2 sensor, and a coolant temp sensor on the canvas.", hint: "All three are inspectable.", checkDescription: "maf_sensor + o2_sensor + coolant_temp_sensor placed" },
      { instruction: "Inspect each sensor to see its typical output value.", hint: "MAF at idle ≈ 4-6 g/s · O2 swinging around 0.45 V · CTS at warm operating temp ≈ 90°C.", checkDescription: "all three sensors inspected at least once" },
      { instruction: "Identify which sensor would cause 'long crank when warm, fine when cold' →", hint: "Warm-only problem → coolant temp lying about being cold.", checkDescription: "learner selects coolant_temp_sensor" },
    ],
    soloChallenge: {
      prompt: "STFT is +25%, LTFT is +20%. The engine is at operating temp. Pick the single most likely sensor failure.",
      successCriteria: "MAF reading low (engine compensates by adding fuel = positive trims) — coolant temp and O2 each evaluated and ruled out.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [{ kind: "maf_sensor" }, { kind: "o2_sensor" }, { kind: "coolant_temp_sensor" }], prompt: "For each sensor, write a one-line description of (a) what it measures and (b) the failure mode you'd see most often in a 10-year-old car." },
    credentialPathway:
      "Sensor diagnostics is the bulk of ASE A8. Shops that bill for diagnostic time live or die on this skill — and it's where the AI tutor in this sim is most useful in real practice.",
  },
  {
    dayNumber: 9,
    slug: "reading-wiring-diagrams",
    title: "Reading a Wiring Diagram",
    shortDescription: "Build a real headlight circuit from a printed schematic.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Every shop manual has wiring diagrams. They look intimidating but follow rules: power flows from top to bottom, grounds are at the bottom, fuses and relays are explicit, and every wire has a color code. Today you build a simplified headlight circuit from a diagram. If you can build this, you can read 80% of real-world automotive schematics.",
      keyTerms: [
        { term: "Relay", definition: "Electrical switch controlled by a small current — lets a small switch turn on a big load." },
        { term: "Wire color code", definition: "Manufacturer-specific shorthand: e.g., on Ford, 'red/blue tracer' might mean battery-positive switched." },
        { term: "Splice pack", definition: "Junction where multiple wires of the same circuit meet — common failure point." },
      ],
    },
    guidedSteps: [
      { instruction: "Build: car battery (12.6 V) → fuse (10 A) → resistor (representing one headlight bulb at 5 Ω) → chassis ground.", hint: "A real headlight pulls about 5 A — pick R = V/I ≈ 2.5 Ω if you want exactly that, or use 5 Ω for a lower-watt sim.", checkDescription: "car_battery + fuse(rated 10A, not blown) + 5 Ω resistor + ground in a complete loop" },
      { instruction: "Run the sim. Note current.", hint: "I = 12.6 / 5 = 2.52 A. Safely under the 10 A fuse rating.", checkDescription: "load current between 2 A and 3 A" },
      { instruction: "Add a second headlight in parallel (another 5 Ω resistor on the same bus). Re-run.", hint: "Parallel doubles current. Now you're pulling ~5 A — still under the fuse.", checkDescription: "total current between 4.5 A and 5.5 A" },
    ],
    soloChallenge: {
      prompt: "Build a headlight circuit that pulls exactly 7 A from a 12.6 V source. What resistance does each of TWO parallel bulbs need?",
      successCriteria: "Each bulb ~3.6 Ω; total current 7 A ±5%.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "car_battery" }, { kind: "fuse", props: { ratedAmps: 10 } }, { kind: "ground_point" }], prompt: "Add three parallel bulbs and a relay (model the relay as a switchable connection — use the fuse's 'blown' flag to simulate the relay being de-energized). What total current do you draw with all three on?" },
    credentialPathway:
      "Wiring-diagram literacy is the difference between a parts-swapper and a tech. NCCER Automotive Level 2 Module 2 and ASE A6 both depend on this.",
  },
  {
    dayNumber: 10,
    slug: "brake-fundamentals",
    title: "Brake System Fundamentals",
    shortDescription: "Hydraulics, hydraulics, hydraulics — plus the electronics that ride along.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Brakes are hydraulic. When you push the pedal, a master cylinder converts your foot pressure into fluid pressure, which travels through brake lines to a caliper or wheel cylinder at each wheel. The caliper squeezes brake pads against a rotor (disc brakes) or pushes shoes against a drum. ABS adds a pump and valves that can release pressure at any individual wheel to prevent lockup. Today, walkthrough — diagnostic depth comes in Day 14.",
      keyTerms: [
        { term: "Master cylinder", definition: "Converts pedal force to hydraulic pressure. Two separate circuits for safety." },
        { term: "Caliper", definition: "Clamps brake pads onto the rotor. Floating vs fixed-piston designs." },
        { term: "ABS module", definition: "Anti-lock Braking System — modulates fluid pressure to prevent wheel lockup during hard stops." },
      ],
    },
    guidedSteps: [
      { instruction: "Walk the hydraulic path: pedal → master cylinder → brake lines → calipers/wheel cylinders → pads/shoes → rotor/drum.", hint: "Each junction is a potential leak point.", checkDescription: "learner walks the path in order" },
      { instruction: "Identify the two-circuit (split) design and why it exists.", hint: "Federally required since 1967 — if one circuit fails, the other still stops the car.", checkDescription: "learner notes 'one circuit failure ≠ total brake loss'" },
      { instruction: "Match symptom: 'pedal goes to floor slowly over time' → ", hint: "Slow loss = leak. Sudden = something binary failed.", checkDescription: "learner identifies fluid leak (most likely caliper or wheel cylinder)" },
    ],
    soloChallenge: {
      prompt: "A customer's brake pedal feels spongy. Pick the single most likely cause and your first diagnostic step.",
      successCriteria: "Air in the lines; bleed the system starting from the wheel farthest from the master cylinder.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Sketch the brake hydraulic circuit using labels on the canvas. Mark every point where fluid can leak." },
    credentialPathway:
      "ASE A5 Brakes is one of the most-claimed ASE certs because it's standalone — a tech can specialize. ACC's Brake Specialist short course is the local pathway.",
  },
  {
    dayNumber: 11,
    slug: "cooling-and-overheating",
    title: "Cooling System & Overheating",
    shortDescription: "Why overheating is almost never just a 'low coolant' problem.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Coolant absorbs heat from the engine block, flows to the radiator where the fan blows ambient air through it, then returns. A thermostat blocks flow until the engine is up to temp. A water pump (often belt-driven) keeps it circulating. Five things can cause overheating: low coolant, stuck thermostat, dead water pump, clogged radiator, failed cooling fan. The diagnosis order matters because each test rules out two others.",
      keyTerms: [
        { term: "Thermostat", definition: "Temperature-sensitive valve that blocks coolant flow until ~195°F." },
        { term: "Water pump", definition: "Belt-driven impeller that circulates coolant through the engine and radiator." },
        { term: "Head gasket", definition: "Seal between engine block and head. When it fails, combustion gases enter the cooling system → overheating + bubbles." },
      ],
    },
    guidedSteps: [
      { instruction: "Walk the cooling path: engine block → upper radiator hose → radiator → lower hose → water pump → engine block.", hint: "Coolant cycles continuously when the thermostat is open.", checkDescription: "learner walks the loop" },
      { instruction: "Identify the five most common overheating causes.", hint: "Three are about flow, one is about transfer, one is about gas-in-coolant.", checkDescription: "learner lists 5 causes" },
      { instruction: "Match symptom 'overheats only at idle, fine on the highway' → ", hint: "At idle, airflow over the radiator comes only from the fan. On the highway, airflow is forced.", checkDescription: "learner identifies failed cooling fan or fan clutch" },
    ],
    soloChallenge: {
      prompt: "The engine overheats within 5 minutes of starting cold. Coolant level is full. Pick the most likely cause and one test to confirm.",
      successCriteria: "Thermostat stuck closed; confirm by feeling upper radiator hose — if it stays cold while engine warms, thermostat is stuck.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Label the cooling loop on canvas. Mark every place a coolant leak commonly forms (water pump weep hole, heater core, radiator seam, hose clamps)." },
    credentialPathway:
      "Cooling-system work is one of the most common shop visits. ASE A1 Engine Repair covers head gaskets; ACC's Automotive Service certificate handles cooling top to bottom.",
  },
  {
    dayNumber: 12,
    slug: "maintenance-and-safety",
    title: "Maintenance Schedules & Shop Safety",
    shortDescription: "The 30/60/90K services every car gets, and the safety habits that keep you whole.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Most cars follow a 30,000-mile / 60,000-mile / 90,000-mile service rhythm: oil and filter (every 5-10K), tire rotation (every 5-10K), transmission fluid (60-100K), coolant flush (60-100K), spark plugs (60-100K iridium, 30K copper), timing belt if non-interference (60-100K). Safety habits are simpler: jack stands always, never under a car held only by a hydraulic jack; eye protection on every battery service; gloves on every brake job (asbestos history, modern dust is still a respiratory irritant).",
      keyTerms: [
        { term: "OEM interval", definition: "Manufacturer's recommended service mileage — found in the owner's manual." },
        { term: "Severe service", definition: "Short trips, dusty conditions, towing — shortens every interval roughly in half." },
        { term: "Jack stand", definition: "Mechanical support that holds the car up after the jack lifts it. Non-negotiable safety gear." },
      ],
    },
    guidedSteps: [
      { instruction: "List the items in a typical 30K-mile service.", hint: "Oil, filter, tire rotation, cabin filter, visual inspection.", checkDescription: "learner lists 4-5 typical 30K items" },
      { instruction: "List the items in a typical 60K service that are not in the 30K.", hint: "Transmission fluid, coolant, spark plugs (often), brake fluid.", checkDescription: "learner lists 3+ additional 60K items" },
      { instruction: "Identify the safety equipment required for every battery service.", hint: "Eyes and skin — sulfuric acid.", checkDescription: "learner names safety glasses + acid-resistant gloves" },
    ],
    soloChallenge: {
      prompt: "A customer brings a vehicle at 91,000 miles with no maintenance records. Build a service plan — pick the top 3 services to do immediately.",
      successCriteria: "Oil + filter, coolant flush, transmission fluid drain-and-fill (or spark plugs) — any defensible 3 with reasoning.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Build a 90K-mile service checklist on the canvas using labels. Mark each item as either 'always' or 'conditional on inspection.'" },
    credentialPathway:
      "Maintenance is the entry job in every shop and the first step on the ASE G1 Maintenance and Light Repair pathway. ACC's Automotive Maintenance Technician certificate is exactly this material.",
  },
  {
    dayNumber: 13,
    slug: "customer-writeup-estimating",
    title: "Customer Write-Up & Estimating",
    shortDescription: "How to translate 'it makes a weird noise' into billable work.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Half of automotive diagnosis happens at the service counter. A vague customer complaint — 'it makes a noise sometimes' — has to become specific enough that a tech can reproduce it. Ask: When does it happen? (cold/warm, accelerating/braking/turning) How long has it happened? Has anything changed recently? (new tires, recent repair) The estimating side is just labor-guide hours × shop rate + parts + tax. Get the diagnosis specific and the estimate writes itself.",
      keyTerms: [
        { term: "Reproduction", definition: "Recreating the customer's complaint in the shop. If you can't reproduce it, you can't fix it." },
        { term: "Labor guide", definition: "Standardized time estimates per repair — Mitchell, Motor, AllData. Industry standard for billing." },
        { term: "Authorization", definition: "Customer's signed approval for the work before you start. Required by law in most states." },
      ],
    },
    guidedSteps: [
      { instruction: "List 3 questions you'd ask a customer who says 'my brakes feel weird.'", hint: "Pull a direction? Spongy or hard? When does it happen?", checkDescription: "learner lists 3 specific questions" },
      { instruction: "Build a labor estimate: 1.5 hours at $140/hr + $85 part + 8.25% tax.", hint: "Labor + parts, then tax on the total.", checkDescription: "learner reaches ~$319 total" },
      { instruction: "Identify which complaint type requires written authorization before you start.", hint: "Almost all of them.", checkDescription: "learner says 'all work requires written authorization'" },
    ],
    soloChallenge: {
      prompt: "Customer: 'My car shakes between 55 and 65 mph.' Write the service ticket: 3 likely causes + the labor estimate ranges for each.",
      successCriteria: "Tire balance (low cost), bent wheel (mid), CV joint or driveshaft (high) — with rough labor ranges and a recommendation to inspect first before committing to a fix.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Draft a generic 'reproduction' checklist on the canvas — the questions a service writer should always ask before sending a vehicle to a tech." },
    credentialPathway:
      "Service-writing is its own career path. Many shops hire former techs into service-advisor roles at $50-80K. ACC's Service Manager certificate covers writing, estimating, and customer-relations modules.",
  },
  {
    dayNumber: 14,
    slug: "advanced-diagnostics-scan-tool",
    title: "Advanced Diagnostics with a Scan Tool",
    shortDescription: "Bidirectional control, live data, and the diagnostic patterns scan tools won't tell you.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Basic scan tools read codes. Advanced scan tools (Autel, Snap-on, OEM J2534) let you watch live data streams, command actuators (open the EVAP purge valve, run the fuel pump, cycle the radiator fan), and graph two sensors against each other — like MAF vs fuel trim or O2 vs RPM. The skill is knowing what to look for: a healthy O2 swings between 0.1 V and 0.9 V at 1 Hz; a lazy one moves slow; a dead one sits at 0.45 V. No code; the code only comes when the sensor is out of range. Diagnosis is what you do BEFORE a code sets.",
      keyTerms: [
        { term: "Bidirectional control", definition: "Scan tool commanding an actuator on demand (vs just reading sensors)." },
        { term: "Live data", definition: "Real-time sensor stream — PIDs (Parameter IDs) per OBD-II spec." },
        { term: "Mode 6", definition: "OBD-II mode for monitor results — shows what the ECU is testing in the background before a code sets." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an OBD-II port and an ECU on the canvas. Wire CAN-H and CAN-L.", hint: "Same as Day 7.", checkDescription: "obd2_port + ecu_pcm placed with CAN wiring" },
      { instruction: "List 3 live-data PIDs you'd watch for a misfire diagnosis.", hint: "Misfire counter per cylinder, fuel trim, O2 voltage.", checkDescription: "learner lists 3 relevant PIDs" },
      { instruction: "Identify the difference between a lazy O2 and a dead one on a graph.", hint: "Lazy = slow swings; dead = flat line at 0.45 V (the bias voltage).", checkDescription: "learner distinguishes the two patterns" },
    ],
    soloChallenge: {
      prompt: "Live data shows O2 sensor sitting at 0.85 V steady, LTFT at -15%. Pick the most likely cause and a confirmation test.",
      successCriteria: "Engine running rich; check for stuck-open injector or leaking fuel-pressure regulator; confirm with fuel-pressure gauge or commanded injector pulse-width review.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [{ kind: "obd2_port" }, { kind: "ecu_pcm" }, { kind: "o2_sensor" }, { kind: "maf_sensor" }], prompt: "For each sensor, write the live-data normal range and the value that would set its associated DTC." },
    credentialPathway:
      "Scan-tool mastery is the L1 (Advanced Engine Performance) ASE — the highest light-duty cert. It typically adds $4-7/hr to a tech's wage at any independent shop.",
  },
  {
    dayNumber: 15,
    slug: "capstone-diagnostic-case",
    title: "Capstone: 5-Symptom Diagnostic Case",
    shortDescription: "Pull it all together. One vehicle, five symptoms, find the root cause.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A real customer hands you the keys with five complaints. Most techs chase each one. The journeyman move is to look for the single fault that explains as many of them as possible — and only treat the remainder as separate problems. Today you get five symptoms, walk through systematic elimination, and arrive at one root cause + a small list of unrelated wear items. This is what you're hired to do.",
      keyTerms: [
        { term: "Root cause", definition: "The single fault that, if fixed, resolves multiple symptoms." },
        { term: "Differential diagnosis", definition: "The disciplined practice of ruling out causes one at a time." },
        { term: "Trust but verify", definition: "Confirm any customer-reported symptom with your own observation before working on it." },
      ],
    },
    guidedSteps: [
      { instruction: "Customer reports: (1) check-engine light on, (2) rough idle, (3) cuts out under load, (4) fuel economy down 30%, (5) smells fuel at the tailpipe.", hint: "Read the list. Three are 'engine running rich.' One is 'is the CEL the cause or just notification?' One could be ANYTHING.", checkDescription: "learner reads all 5 symptoms" },
      { instruction: "Group the symptoms by likely shared cause.", hint: "Rich-running explains 2, 3, 4, 5. The CEL is just the notification system.", checkDescription: "learner clusters 4 of 5 around 'rich running'" },
      { instruction: "Identify the diagnostic order to confirm root cause.", hint: "Scan tool first (read codes + live data) — let the ECU tell you which sensor is off before you guess.", checkDescription: "learner lists scan first, then narrow with live data" },
    ],
    soloChallenge: {
      prompt: "Walk through your diagnostic plan in writing. State the root-cause hypothesis, the first three tests in order, and the decision tree if each test is positive or negative.",
      successCriteria: "Hypothesis: faulty MAF or stuck-open injector. Tests: (1) scan codes + freeze frame, (2) live MAF g/s + fuel trim, (3) injector balance test or fuel-pressure check. Decision tree present.",
      scoringRubric: { correctness: 0.7, time: 0.1, componentCount: 0.2 },
    },
    sandboxStarter: { initialComponents: [{ kind: "obd2_port" }, { kind: "ecu_pcm" }, { kind: "maf_sensor" }, { kind: "o2_sensor" }, { kind: "coolant_temp_sensor" }], prompt: "Build a diagnostic tree on the canvas. From each test result, draw arrows to the next test. This is the same map you'll draw on paper in a real shop." },
    credentialPathway:
      "Capstone diagnostics is what ASE L1 tests. Pass this lesson, sit for ASE A8 + L1, and you're a Master Technician candidate. ACC's Advanced Diagnostics certificate ends here too. From here, the credential ladder is journeyman → master → shop foreman → independent shop owner.",
  },
];
