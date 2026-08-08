/**
 * Plumbing trade — 15-day curriculum content.
 *
 * Mirrors the electrical pattern (see `./electrical-lessons.ts`):
 *   - 5-loop player (Concept → Guided → Solo → Sandbox → Debrief)
 *   - engineMode is explicit per day; "pipe-network" when the Hardy-Cross
 *     solver runs, "concept-only" for code/safety/diagnostic-procedure days.
 *   - Credential pathway hooks reference REAL plumbing pathways
 *     (UA Local 286 Austin, ACC plumbing certificate, PHCC apprenticeship,
 *     EPA WaterSense partner). No invented partnerships.
 */

import type { LessonEngineMode } from "./types";

export type PlumbingLessonConcept = {
  blurb: string;
  keyTerms: Array<{ term: string; definition: string }>;
  diagramKey?: string;
};

/**
 * Pass/fail rubric that grades a learner's plumbing network based on the
 * `closedOneWays` signal from the flow solver. Attach to a guided step or
 * solo challenge to turn the existing red-badge backflow signal into actual
 * pedagogy. See `client/src/lib/trade-sims/plumbing/backflow-rubric.ts`.
 */
export type PlumbingBackflowRubric = {
  mode: "must-close" | "must-not-close" | "must-have-check-valve";
  passMessage: string;
  failMessage: string;
  /** Flow-based modes only: also fail unless a check valve is present. */
  requireCheckValve?: boolean;
  /** Shown when `requireCheckValve` is set and no check valve is placed. */
  missingCheckValveMessage?: string;
};

export type PlumbingLessonGuidedStep = {
  instruction: string;
  hint: string;
  checkDescription: string;
  backflowRubric?: PlumbingBackflowRubric;
};

export type PlumbingLessonSoloChallenge = {
  prompt: string;
  successCriteria: string;
  scoringRubric: {
    correctness: number;
    time: number;
    componentCount: number;
  };
  backflowRubric?: PlumbingBackflowRubric;
};

export type PlumbingLessonSandboxStarter = {
  initialComponents: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  prompt: string;
};

export interface PlumbingLessonContent {
  dayNumber: number;
  slug: string;
  title: string;
  shortDescription: string;
  engineMode: LessonEngineMode;
  concept: PlumbingLessonConcept;
  guidedSteps: PlumbingLessonGuidedStep[];
  soloChallenge: PlumbingLessonSoloChallenge;
  sandboxStarter: PlumbingLessonSandboxStarter;
  credentialPathway: string;
}

export const PLUMBING_TRADE_META = {
  slug: "plumbing",
  name: "Plumbing",
  tagline: "From water pressure to a whole-house capstone in 15 days.",
  description:
    "Build real plumbing systems in your browser. Size pipes, solve pressure drops, prevent backflow, and earn a credential pathway into ACC's plumbing certificate, UA Local 286, or a PHCC apprenticeship. Free. No installation. Multilingual.",
  iconKey: "droplets",
  displayOrder: 2,
};

export const PLUMBING_LESSONS: PlumbingLessonContent[] = [
  {
    dayNumber: 1,
    slug: "water-pressure-flow",
    title: "Water Pressure & Flow",
    shortDescription: "Pressure pushes; flow moves. The two numbers every plumber lives by.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Plumbing has two numbers: pressure (how hard the water is being pushed, measured in psi or meters of head) and flow (how fast it's moving, in gpm or m³/s). A typical U.S. residential water main sits around 40–80 psi (28–55 m head). Pressure drives flow; flow runs into resistance (friction in the pipe) and that resistance drops the pressure further down the line. Get this relationship in your bones and the rest of plumbing is just bookkeeping.",
      keyTerms: [
        { term: "Head (m)", definition: "Pressure expressed as the height of a water column. 1 m head ≈ 1.42 psi." },
        { term: "Flow (Q)", definition: "Volume of water passing a point per unit time. m³/s in SI, gpm in U.S." },
        { term: "Friction loss", definition: "Pressure dropped as water rubs against pipe walls. Bigger flow = more loss." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place a Tank with 40 m head (≈57 psi street pressure) on the canvas.",
        hint: "Tanks are in the source palette.",
        checkDescription: "1 tank placed, head ≈ 40",
      },
      {
        instruction: "Place a 3 m Pipe (3/4\" ≈ 0.019 m diameter) connecting the tank to a second tank at 30 m head.",
        hint: "Two tanks let you see flow driven by pressure difference.",
        checkDescription: "1 pipe between two tanks",
      },
      {
        instruction: "Run. The solver reports flow > 0 from high head to low head.",
        hint: "Flow always goes from higher pressure to lower pressure.",
        checkDescription: "pipe flow positive, from high-head to low-head tank",
      },
      {
        instruction: "Increase pipe length to 30 m. Flow drops — more pipe means more friction.",
        hint: "Same pressure difference, more resistance, less flow.",
        checkDescription: "flow decreases as length increases",
      },
    ],
    soloChallenge: {
      prompt: "Two tanks at 50 m and 20 m head are connected by a single 10 m pipe. Pick a diameter that delivers about 0.001 m³/s (≈16 gpm).",
      successCriteria: "Computed flow within ±10% of 0.001 m³/s.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 40 } },
        { kind: "pipe", props: { length: 5, diameter: 0.019 } },
        { kind: "tank", props: { head: 0 } },
      ],
      prompt: "Experiment: shrink the diameter and watch flow collapse. That's why nobody puts a 1/4-inch supply line on a shower.",
    },
    credentialPathway:
      "Pressure and flow are the first thing tested on the PHCC apprenticeship entrance exam. Master this and you're ready for ACC's plumbing certificate intake.",
  },
  {
    dayNumber: 2,
    slug: "pipe-sizing-friction-loss",
    title: "Pipe Sizing & Friction Loss",
    shortDescription: "Bigger pipe = less friction. But pipe costs money. The sizing trade-off.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "The Darcy-Weisbach equation says head loss equals K × Q² where K depends on length, diameter, and friction factor. Double the diameter and K drops by a factor of 32 (D to the 5th power). That's why undersized pipes are the #1 cause of low-pressure complaints. Plumbing codes set MINIMUM diameters for each fixture; smart sizing goes one step bigger when long runs are involved.",
      keyTerms: [
        { term: "Darcy-Weisbach", definition: "h_f = f · (L/D) · v² / 2g. The universal head-loss formula." },
        { term: "Friction factor (f)", definition: "Dimensionless number ≈ 0.02 for clean copper, 0.03+ for older galvanized." },
        { term: "Fixture supply size", definition: "UPC minimums: 1/2\" to a single fixture, 3/4\" to a branch serving multiple." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build: Tank (40 m head) → 10 m Pipe (0.013 m / 1/2\" copper) → Tank (0 m).",
        hint: "Small-diameter long run.",
        checkDescription: "loop with 1/2-inch pipe between two tanks",
      },
      {
        instruction: "Run. Note the flow rate.",
        hint: "It'll be modest — small pipe, big friction loss.",
        checkDescription: "flow recorded",
      },
      {
        instruction: "Change pipe diameter to 0.025 m (1\"). Run again — flow more than doubles.",
        hint: "Friction loss drops dramatically with bigger pipe.",
        checkDescription: "flow increases substantially with diameter increase",
      },
      {
        instruction: "Add a closed Gate Valve in the line. Flow goes to zero.",
        hint: "Closing the valve is the same as removing the pipe.",
        checkDescription: "valve placed and closed; flow = 0",
      },
    ],
    soloChallenge: {
      prompt: "A 20 m supply line must deliver at least 0.0005 m³/s (≈8 gpm) between tanks at 45 m and 5 m head. Find the smallest pipe diameter that works.",
      successCriteria: "Resulting flow ≥ 0.0005 m³/s; diameter chosen within standard sizes (1/2, 3/4, 1\").",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 40 } },
        { kind: "pipe", props: { length: 15, diameter: 0.019 } },
        { kind: "tank", props: { head: 10 } },
      ],
      prompt: "Add a gate valve and a ball valve in series. Open one and close the other. Which combination delivers flow?",
    },
    credentialPathway:
      "Pipe sizing is on every NCCER Plumbing Level 1 exam and the IRC Section P2903 (residential water sizing) requirements ACC teaches in PLAB 1305.",
  },
  {
    dayNumber: 3,
    slug: "fixture-units-demand",
    title: "Fixture Units & Demand",
    shortDescription: "Counting fixtures to predict how much water a system has to deliver.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Every fixture gets a Water Supply Fixture Unit (WSFU) rating. Lavatory = 1 WSFU. Toilet (tank type) = 2.2. Shower = 2. Add them up, look up the corresponding probable peak demand on the UPC/IPC chart, and that's the gpm the system has to deliver. The chart is non-linear — 10 fixtures don't all run at once. Real demand is much less than the worst case.",
      keyTerms: [
        { term: "WSFU", definition: "Water Supply Fixture Unit. Code-defined weight for a fixture's likely demand." },
        { term: "Demand", definition: "Actual gpm the system must deliver during peak use." },
        { term: "Diversity factor", definition: "Probability that not all fixtures run simultaneously. Bigger building = lower diversity." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place a Tank (40 m head), a 5 m Pipe (3/4\"), and a Sink Fixture.",
        hint: "Sink default demand is 0.5 gpm ≈ 3.15e-5 m³/s.",
        checkDescription: "tank → pipe → sink",
      },
      {
        instruction: "Run. Note the head at the sink and verify the demand is being met.",
        hint: "Head at the fixture should still be most of 40 m.",
        checkDescription: "sink supply head > 30 m",
      },
      {
        instruction: "Add a Shower Fixture (2 gpm) on the same branch. Run again.",
        hint: "Bigger demand means more friction loss; head at the fixtures drops.",
        checkDescription: "head at fixtures drops when shower added",
      },
    ],
    soloChallenge: {
      prompt: "Size a single supply line from a 50 m head tank to a bathroom with one sink, one toilet, and one shower (≈4 WSFU). Pipe must be ≤ 8 m long and keep all fixture supply heads above 20 m.",
      successCriteria: "All three fixtures show supply head ≥ 20 m at peak demand.",
      scoringRubric: { correctness: 0.7, time: 0.15, componentCount: 0.15 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 40 } },
        { kind: "pipe", props: { length: 6, diameter: 0.019 } },
        { kind: "sink_fixture" },
      ],
      prompt: "Add fixtures one at a time and watch the supply head drop. At what point does the sink supply head fall below 14 m (≈20 psi, code minimum)?",
    },
    credentialPathway:
      "WSFU sizing is the spine of every commercial plumbing plan. Mastered in UA Local 286 first-year curriculum and ACC PLAB 1305.",
  },
  {
    dayNumber: 4,
    slug: "supply-line-design",
    title: "Supply-Line Design",
    shortDescription: "Branches, tees, reducers — the geometry of getting water to every fixture.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "A real house has a trunk (typically 3/4\" or 1\" copper or PEX) running from the meter, with branches teeing off to each bathroom group. The trunk is sized for total demand; branches are sized for the fixtures they serve. Reducers step the diameter down at the branch tee. Long, undersized branch lines are the #1 reason for slow showers on the far side of the house.",
      keyTerms: [
        { term: "Trunk-and-branch", definition: "Single main line with tees serving each fixture group. Most common residential layout." },
        { term: "Home run / manifold", definition: "Each fixture gets its own dedicated line from a central manifold. More copper, more even pressure." },
        { term: "Tee", definition: "Three-way fitting — straight-through plus a branch." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Place a Tank, a 5 m trunk Pipe (1\"), then a Tee.",
        hint: "Tee branches one supply into two.",
        checkDescription: "tank → pipe → tee",
      },
      {
        instruction: "On each tee branch, add a 2 m Pipe (3/4\") and a Sink Fixture.",
        hint: "Two sinks, served by one trunk.",
        checkDescription: "two sinks each fed by branch from tee",
      },
      {
        instruction: "Run. Both sinks should have similar supply head.",
        hint: "Balanced trunk-and-branch.",
        checkDescription: "two sinks with similar head (within 1 m)",
      },
    ],
    soloChallenge: {
      prompt: "Design a supply layout for a kitchen with sink + dishwasher + ice-maker, fed from a 1\" trunk. Keep all branches ≤ 3 m and use the right diameter at each split.",
      successCriteria: "All three fixtures' supply heads ≥ 25 m at simultaneous demand.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 45 } },
        { kind: "pipe", props: { length: 4, diameter: 0.025 } },
        { kind: "tee" },
      ],
      prompt: "Extend the design to two bathrooms on opposite sides of a house. Where do you place the tee for the most even pressure?",
    },
    credentialPathway:
      "Trunk-and-branch layout drills are core to ACC PLAB 1413 (Plumbing II) and to PHCC's apprenticeship Year 1 lab curriculum.",
  },
  {
    dayNumber: 5,
    slug: "drainage-venting",
    title: "Drainage & Venting",
    shortDescription: "Where the water goes after. Gravity, traps, and the air vents that make traps work.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Supply piping is pressurized; drainage piping is NOT. Drains rely on gravity (a 1/4 inch per foot slope is the standard) and on traps (U-shaped sections holding water) to keep sewer gas out of the house. Every trap needs a VENT pipe to the roof — otherwise the falling water column siphons the trap dry. No vent = sewer gas in the house. This is concept-only in v1; the pipe-network solver models pressurized supply.",
      keyTerms: [
        { term: "Trap", definition: "U-shaped pipe section holding ~2\" of water as a seal against sewer gas." },
        { term: "Vent", definition: "Pipe to the roof that lets air in/out of the drainage system so traps stay full." },
        { term: "Slope (drainage)", definition: "Typically 1/4\" per foot (≈2%). Too flat = clogs; too steep = solids left behind." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Identify the trap on a labeled sink schematic.",
        hint: "It's the U-shape immediately below the drain.",
        checkDescription: "trap identified",
      },
      {
        instruction: "Identify the vent pipe rising from the drain line.",
        hint: "Vertical line going up, not horizontal toward the sewer.",
        checkDescription: "vent identified",
      },
    ],
    soloChallenge: {
      prompt: "A homeowner reports sewer-gas smell in a bathroom that's been unused for a month. What's the most likely cause and the fix?",
      successCriteria: "Diagnose: trap dried out from evaporation. Fix: run water at every fixture monthly, or install a trap primer.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Concept day — draw a single-fixture drain + vent layout on paper or in any sketching tool, label trap, vent, slope direction.",
    },
    credentialPathway:
      "Drainage, waste, and venting (DWV) is the second-largest section of the IRC and the UPC. Heavily tested in NCCER Plumbing Level 1.",
  },
  {
    dayNumber: 6,
    slug: "backflow-prevention",
    title: "Backflow Prevention",
    shortDescription: "Stopping dirty water from running backward into the clean supply.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Backflow happens when pressure in a contaminated source briefly exceeds pressure in the clean supply — say, a fire hydrant opens nearby and back-siphons a hose left in a bucket. Code requires CHECK VALVES (or air gaps, or reduced-pressure zone assemblies) at every cross-connection. The EPA WaterSense program tracks this; failure to prevent backflow is one of the few plumbing violations that triggers utility shut-off.",
      keyTerms: [
        { term: "Cross-connection", definition: "Any direct link between potable supply and a possible contaminant source." },
        { term: "Check valve", definition: "One-way valve. Allows flow only in the forward direction." },
        { term: "Air gap", definition: "Physical separation between supply outlet and the rim of a receiving vessel. Most reliable backflow protection." },
        { term: "RPZ", definition: "Reduced-pressure zone assembly. Required at high-hazard cross-connections like irrigation systems with fertilizer injectors." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build: Tank (40 m) → Check Valve → Pipe → second Tank (0 m). Run the sim. Expected: forward flow, no check valve closed.",
        hint: "Standard one-way installation. The check valve should sit idle on the forward run.",
        checkDescription: "tank + check valve + pipe + tank; no closed one-ways",
        backflowRubric: {
          mode: "must-not-close",
          passMessage: "Forward run: pressure pushes the right direction and the check valve stays open. That's the everyday case — the valve is doing nothing yet, and that's correct.",
          failMessage: "Your check valve closed on a forward run. That usually means the source tank is lower than the sink — re-check the head values before swapping them in the next step.",
        },
      },
      {
        instruction: "Now swap the two tank heads (set source to 0 m, sink to 40 m) and run again. The check valve must now do its job.",
        hint: "This simulates the supply briefly losing pressure while a downstream tank is still full.",
        checkDescription: "tank heads swapped; at least one check valve closed",
        backflowRubric: {
          mode: "must-close",
          passMessage: "Backflow event caught. The solver forced the check valve closed — in the real world that's the moment the valve seats and protects the clean supply.",
          failMessage: "Swap the source and sink tank heads (source = 0 m, sink = 40 m) and run the sim. The check valve should be forced closed; if it isn't, the network isn't producing a reverse-pressure scenario yet.",
        },
      },
      {
        instruction: "Read the red badge: the player lists every check valve the solver had to close. That list is the same signal a real backflow-prevention assembly test report records.",
        hint: "Closed-one-ways is the auditable trail. Zero closures on a backflow event = the supply was contaminated.",
        checkDescription: "learner reads the closedOneWays badge",
      },
    ],
    soloChallenge: {
      prompt: "Build a network that proves backflow protection works: a high downstream tank, a check valve, a pipe, and a low upstream tank. Run it and force the solver to close the check valve. PASS = at least one check valve is closed in the result.",
      successCriteria: "PASS when the solver's closedOneWays list contains at least one check valve — i.e. your design actually triggered backflow and your check valve actually caught it. Bonus: write one sentence about why an RPZ would be required instead of a check valve for an irrigation system with a fertilizer injector.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
      backflowRubric: {
        mode: "must-close",
        passMessage: "Solo PASS. Your network created a reverse-pressure scenario and your check valve closed to prevent it. That's what every backflow-prevention assembly test is verifying in the field.",
        failMessage: "Solo not yet passing. Build a layout where the downstream tank head is higher than the source tank head, put a check valve in between, and run the sim. The solver will flag the closed check valve in its red badge.",
      },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 40 } },
        { kind: "check_valve" },
        { kind: "pipe", props: { length: 5, diameter: 0.019 } },
        { kind: "tank", props: { head: 0 } },
      ],
      prompt: "Add a second supply path WITHOUT a check valve. Run with the main supply at low head. Where does dirty water go?",
    },
    credentialPathway:
      "Backflow prevention certification (ASSE 5110) is a separate trade credential. ACC, PHCC, and UA Local 286 all offer the cross-connection control specialist track.",
  },
  {
    dayNumber: 7,
    slug: "hot-water-systems",
    title: "Hot-Water Systems",
    shortDescription: "Tank, tankless, recirculation — three ways to deliver hot water to every fixture.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "A tank water heater stores 40–80 gallons at temperature; a tankless heats on demand. Either way, you have a SEPARATE hot-water supply network running in parallel with the cold side. Recirculation pumps push hot water in a constant loop so you don't wait for the cold water in the pipe to clear. Recirculation costs energy but saves water and time — a real trade-off.",
      keyTerms: [
        { term: "Tank heater", definition: "Stores pre-heated water. Cheaper up-front, more standby loss." },
        { term: "Tankless heater", definition: "Heats water on demand. Higher up-front cost, lower standby loss." },
        { term: "Recirculation loop", definition: "Pumped return line keeping hot water at every fixture immediately." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build a hot-side supply: Tank (35 m — hot heater output) → 8 m Pipe → Shower Fixture.",
        hint: "Single hot-side run.",
        checkDescription: "tank → pipe → shower",
      },
      {
        instruction: "Run. Note the supply head at the shower.",
        hint: "Should be reasonable — single fixture on a short run.",
        checkDescription: "shower supply head computed",
      },
      {
        instruction: "Add a Pump (5 m boost) in the line to model a recirculation pump pushing toward the fixture.",
        hint: "Pumps add head in the inlet-to-outlet direction.",
        checkDescription: "pump placed; shower supply head increases",
      },
      {
        instruction: "Add a Check Valve after the pump. Every recirculation loop needs one — when the pump shuts off, hot water will thermosiphon backward through the loop without it.",
        hint: "Check valves are in the valve palette. Place it downstream of the pump, pointing toward the fixture.",
        checkDescription: "check valve present in the recirculation line",
        backflowRubric: {
          mode: "must-have-check-valve",
          passMessage: "Check valve added. One thing this grader can't see: placement. It only protects the loop if it sits downstream of the pump, pointing toward the fixture — double-check yours before moving on. When the pump cycles off, that valve is what stops the hot side from thermosiphoning backward all night.",
          failMessage: "No check valve in the network yet. A recirculation line without one runs backward the moment the pump stops — add a check valve downstream of the pump.",
        },
      },
    ],
    soloChallenge: {
      prompt: "A two-story house with a tankless heater in the garage struggles to deliver hot water to the upstairs master bath. The pipe run is 25 m. Diagnose and propose two fixes.",
      successCriteria: "Identify: long run + small diameter + no recirculation = cold water flush + pressure drop. Fixes: (1) recirculation pump on a dedicated return line, (2) on-demand recirculation triggered by motion sensor, (3) point-of-use booster.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 35 } },
        { kind: "pipe", props: { length: 12, diameter: 0.019 } },
        { kind: "shower_fixture" },
      ],
      prompt: "Add a recirculation loop returning from the shower to the heater. Add a small pump in the return line. What happens to delivery time?",
    },
    credentialPathway:
      "Hot-water and recirculation design is a featured topic in ACC PLAB 1413 and in the PHCC apprenticeship Year 2 hot-water systems module.",
  },
  {
    dayNumber: 8,
    slug: "pressure-regulators",
    title: "Pressure Regulators",
    shortDescription: "Knocking down street pressure to a safe range — and why the wrong PRV breaks everything downstream.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Some municipal water mains run 100+ psi (70+ m head). Most plumbing fixtures are rated for 80 psi max. A pressure-reducing valve (PRV) at the meter knocks the incoming pressure down to a safe range, typically 50–60 psi. When a PRV fails closed, the whole house has low pressure; when it fails open, you start blowing fixture supply hoses. In v1 we model a PRV as a tank-set-head boundary.",
      keyTerms: [
        { term: "PRV", definition: "Pressure-reducing valve. Drops upstream pressure to a set downstream value." },
        { term: "Static vs working pressure", definition: "Static = no flow; working = with fixtures running. PRVs are rated for both." },
        { term: "Thermal expansion tank", definition: "Required downstream of a PRV — gives heated water somewhere to expand into instead of blowing the T&P valve." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build a 'before-PRV' system: Tank (70 m, ≈100 psi) → 3 m Pipe → Sink.",
        hint: "Street pressure that's too high.",
        checkDescription: "tank @ 70m → pipe → sink",
      },
      {
        instruction: "Replace the source tank with a 35 m tank (simulating a properly-set PRV downstream of the meter). Add a Check Valve right after it — most modern PRVs have an integral check — and run. On a healthy regulated system, that check must stay open.",
        hint: "Same plumbing, but the source head is regulated. The check valve should sit idle on a normal forward run.",
        checkDescription: "source head ≈ 35 m; check valve present; no closed one-ways",
        backflowRubric: {
          mode: "must-not-close",
          requireCheckValve: true,
          missingCheckValveMessage: "No check valve in the network yet. This step models a PRV's integral check — add a Check Valve right after the regulated source tank, then run the sim.",
          passMessage: "Regulated forward run: 35 m of PRV-set head drives every fixture and the integral check never has to seat. That's a healthy system — and it's also why a thermal expansion tank is required: that check makes the house a closed system with nowhere for heated water to expand.",
          failMessage: "Your check valve closed on what should be a normal forward run. That means something downstream has higher head than your regulated source — re-check that the source tank is at 35 m and the fixtures are the low-pressure end.",
        },
      },
      {
        instruction: "Compare flow before and after. Lower head = lower flow but safer fixtures.",
        hint: "PRVs are a safety trade-off, not just a comfort one.",
        checkDescription: "flow lower with regulated source",
      },
    ],
    soloChallenge: {
      prompt: "A homeowner complains: 'My pressure dropped suddenly — I have to wait forever for the bathtub to fill.' What's your first check, second check, and third check?",
      successCriteria: "1) gauge the static pressure at an outdoor hose bib upstream of the PRV (street pressure); 2) gauge the regulated pressure downstream (PRV setting); 3) check the PRV for a stuck or failed cartridge.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 35 } },
        { kind: "pipe", props: { length: 5, diameter: 0.019 } },
        { kind: "sink_fixture" },
      ],
      prompt: "Drop the source-tank head from 35 m to 10 m and see how each fixture responds. That's what a failing PRV looks like.",
    },
    credentialPathway:
      "PRV installation and adjustment is on the UA Local 286 first-year practical exam and a routine ACC PLAB 1305 demonstration.",
  },
  {
    dayNumber: 9,
    slug: "pumps-boosters",
    title: "Pumps & Boosters",
    shortDescription: "When street pressure isn't enough — pushing water up, out, or across.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Pumps add head. Well pumps lift groundwater into the house; booster pumps in tall buildings get water above the 5th floor; sewage ejector pumps lift waste from below-grade fixtures up to the sewer line. Every pump has a head-flow curve — bigger head means less flow. In v1 we model the pump as adding a constant head; real pump curves are non-linear and require matching to system demand.",
      keyTerms: [
        { term: "Total dynamic head (TDH)", definition: "Sum of static lift + friction loss + pressure required at the outlet. What the pump must overcome." },
        { term: "NPSH", definition: "Net positive suction head. Minimum pressure at the pump inlet to prevent cavitation." },
        { term: "Pump curve", definition: "Manufacturer chart of head vs flow. Pick the pump whose curve crosses your system demand at the design point." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build: Tank (5 m head — low well pressure) → Pump (set to 30 m boost) → Pipe → Shower Fixture.",
        hint: "Boosting from a low source.",
        checkDescription: "low tank + pump + pipe + shower",
      },
      {
        instruction: "Run. Verify the shower gets adequate supply head.",
        hint: "Source 5 m + pump 30 m = 35 m of available head minus friction.",
        checkDescription: "shower supply head ≥ 20 m",
      },
      {
        instruction: "Disable the pump (set pumpHead to 0). Flow collapses.",
        hint: "Without the pump, 5 m source can't drive the system.",
        checkDescription: "flow ≪ before with pump off",
      },
    ],
    soloChallenge: {
      prompt: "A well delivers 1 m of head at the pressure tank. The kitchen sink is 8 m above the tank, 15 m of 3/4\" pipe away. Pick a pump head that delivers ≥ 0.0003 m³/s at the sink.",
      successCriteria: "Pump head between 25–60 m; verified flow ≥ 0.0003 m³/s.",
      scoringRubric: { correctness: 0.7, time: 0.15, componentCount: 0.15 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 3 } },
        { kind: "pump", props: { pumpHead: 25 } },
        { kind: "pipe", props: { length: 10, diameter: 0.019 } },
        { kind: "shower_fixture" },
      ],
      prompt: "Add a second shower at the same level. Does one pump still work? At what total demand does the pump's 25 m boost become insufficient?",
    },
    credentialPathway:
      "Well, booster, and ejector pump installation is covered in ACC PLAB 2335 (Service Plumbing) and is a UA Local 286 Year 2 specialty track.",
  },
  {
    dayNumber: 10,
    slug: "reading-schematics",
    title: "Reading Plumbing Schematics",
    shortDescription: "Translating a riser diagram into a working install — and back again.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A riser diagram shows the plumbing system as if you were looking through the walls — vertical mains, branches, fixtures, and DWV stacks. Symbols are standardized: a circle with a cross is a floor drain, a half-circle is a sanitary tee, a hexagon is a cleanout. Read a riser well and you can install any system. Read it poorly and you'll find yourself cutting drywall a week later because the vent doesn't tie in.",
      keyTerms: [
        { term: "Riser diagram", definition: "Vertical isometric view of the plumbing system showing every pipe, fitting, and fixture." },
        { term: "Cleanout", definition: "Removable fitting (Y- or T-shape) allowing a snake or auger access for clogs." },
        { term: "Wet vent / dry vent", definition: "Wet vent carries both drainage and vent flow above the upper fixture. Dry vent is air only." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Given a riser diagram on screen, identify each symbol.",
        hint: "Floor drain, cleanout, sanitary tee, vent, trap.",
        checkDescription: "symbols identified",
      },
      {
        instruction: "Identify the vent that serves each fixture.",
        hint: "Trace from each trap upward to the vent stack.",
        checkDescription: "vent paths traced",
      },
    ],
    soloChallenge: {
      prompt: "Read the provided two-bathroom riser. Identify which vent serves which fixture and whether any fixture is improperly vented.",
      successCriteria: "AI tutor grades vent-path identification and code-compliance call.",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Reverse: sketch a single-bathroom (sink + toilet + shower) riser including supply and DWV. Label every fitting.",
    },
    credentialPathway:
      "Schematic literacy is the gateway to commercial plumbing and is a graded skill on the NCCER Plumbing Level 2 practical exam.",
  },
  {
    dayNumber: 11,
    slug: "codes-safety",
    title: "Codes & Safety",
    shortDescription: "IPC, UPC, lead-free, scald protection — what the inspector will fail you for.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Two main model codes govern plumbing: the International Plumbing Code (IPC, used in most of the U.S. East and South including Texas) and the Uniform Plumbing Code (UPC, used in most of the West). Federal law (SDWA / Reduction of Lead in Drinking Water Act) limits lead content in any potable-supply component to 0.25%. Anti-scald mixing valves (ASSE 1016/1017) are required on every new shower. Knowing what's required keeps your callbacks down.",
      keyTerms: [
        { term: "IPC vs UPC", definition: "Two competing model codes. Texas adopts IPC. Each is updated on a 3-year cycle." },
        { term: "Lead-free", definition: "<0.25% lead in wetted surfaces. NSF 372 certifies; the mark is required on every fitting touching potable supply." },
        { term: "Scald protection", definition: "Pressure-balancing or thermostatic mixing valve required on showers. Cap at 120 °F / 49 °C." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Identify which code applies in Travis County, Texas.",
        hint: "Hint: it's the same one Austin Water adopted in its 2021 update.",
        checkDescription: "IPC identified",
      },
      {
        instruction: "Look at a fitting picture. Find the NSF 372 lead-free mark.",
        hint: "Usually stamped or labeled near the manufacturer's mark.",
        checkDescription: "NSF 372 identified",
      },
    ],
    soloChallenge: {
      prompt: "You replace a shower valve in a 1985 house. Before today, the valve was a simple two-handle, no mixing. The new code requires what specific upgrade?",
      successCriteria: "Anti-scald (pressure-balancing or thermostatic) mixing valve per ASSE 1016 / ASSE 1017 capped at 120 °F.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "List five things an inspector would check on rough-in for a new bathroom. Compare your list against the IPC Section 305 (general regulations) checklist.",
    },
    credentialPathway:
      "Texas State Board of Plumbing Examiners (TSBPE) requires 24 hours of CE every license-renewal cycle, half of it on code. UA Local 286 hosts the CE classes.",
  },
  {
    dayNumber: 12,
    slug: "troubleshooting-low-pressure",
    title: "Troubleshooting Low Pressure",
    shortDescription: "The seven things to check, in order, when a house is suddenly slow.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Low-pressure complaints are the most common plumbing service call. Order matters: (1) Is it the whole house or just one fixture? (2) Is the meter spinning? (3) PRV setting? (4) Aerator clogged? (5) Supply line crimped? (6) Galvanized pipe rusted internally? (7) Water heater dip-tube broken (hot-only complaints)? Skip a step and you waste an hour. Run them in order and you find the fault in 15 minutes.",
      keyTerms: [
        { term: "Whole-house vs single-fixture", definition: "First triage. Whole house = source-side problem; single fixture = downstream of a tee." },
        { term: "Aerator", definition: "Screen at the end of a faucet. Catches debris and is the cheapest, most common low-flow culprit." },
        { term: "Internal corrosion", definition: "Galvanized pipe (1960s+) rusts on the inside, shrinking the effective diameter. Pre-1980 houses are suspect." },
      ],
    },
    guidedSteps: [
      {
        instruction: "The simulator gives you a broken house: low flow at the kitchen sink. Run it.",
        hint: "Look at the head at the kitchen sink fixture.",
        checkDescription: "broken state detected",
      },
      {
        instruction: "Try closing each valve in turn. Identify which closed valve doesn't change the outcome (it was already nearly closed in real life — a partially-stuck gate valve).",
        hint: "A barely-open valve has high effective K.",
        checkDescription: "fault identified",
      },
      {
        instruction: "Replace the stuck valve. Verify flow restored.",
        hint: "Set valveClosed false; remove valveKAdd.",
        checkDescription: "flow restored",
      },
    ],
    soloChallenge: {
      prompt: "Whole house went slow this morning. Outdoor hose bib still has 60 psi. What's your next test?",
      successCriteria: "Hose bib is typically upstream of the PRV. 60 psi at the bib + low pressure inside = PRV failing closed. Verify by gauging downstream of the PRV.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Build a 'house' with three branches. Add a partially-stuck (high-K) gate valve at random. Have a friend troubleshoot it.",
    },
    credentialPathway:
      "Troubleshooting is the difference between an apprentice and a service plumber. This is where the wage gap opens — service techs in Austin earn $35–55/hr per the Bureau of Labor Statistics 2024 OEWS data.",
  },
  {
    dayNumber: 13,
    slug: "troubleshooting-leaks",
    title: "Troubleshooting Leaks",
    shortDescription: "Drips, slab leaks, hidden pinholes — how to find what's leaking before you cut drywall.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A meter test (shut off every fixture and watch the meter's leak-indicator dial) tells you IF you have a leak. Finding WHERE is the trick. Listening discs and acoustic gear locate slab leaks; thermal imaging finds hot-water leaks; tracer gas (helium) finds tiny pressurized leaks. Pinhole copper leaks are usually pitting corrosion from aggressive water chemistry; chlorine in PEX is a known degradation mode.",
      keyTerms: [
        { term: "Meter test", definition: "Close all fixtures. If the meter's leak-indicator triangle still spins, there's a leak somewhere." },
        { term: "Slab leak", definition: "Pinhole in a supply line buried in or under the foundation slab. Hot-side most common." },
        { term: "Pitting corrosion", definition: "Localized failure mode of copper. Microscopic pits eventually punch through pipe wall." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Conceptually: close every fixture in a house. Read the meter.",
        hint: "Leak-indicator dial keeps moving = leak somewhere.",
        checkDescription: "concept understood",
      },
      {
        instruction: "Isolate hot vs cold by closing the cold supply at the water heater. If meter stops, leak is on the cold side.",
        hint: "Half the system at a time.",
        checkDescription: "isolation logic understood",
      },
    ],
    soloChallenge: {
      prompt: "Slab is warm to the touch in one spot, gas bill spiked, hot-water heater runs constantly. Diagnose and outline the repair path.",
      successCriteria: "Diagnose: hot-side slab leak. Repair path: locate with acoustic + thermal; choose between (1) spot repair through slab, (2) re-route through attic, (3) full re-pipe with PEX manifold.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Draw the decision tree a service plumber walks through on a leak call. Start at: meter spinning with all fixtures closed.",
    },
    credentialPathway:
      "Leak detection is its own specialty (ASSE 6020). ACC offers continuing education in non-destructive locating; PHCC offers a leak-detection certificate track.",
  },
  {
    dayNumber: 14,
    slug: "commercial-vs-residential",
    title: "Commercial vs Residential",
    shortDescription: "Same physics, ten-times the scale — what changes in a commercial install.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "Commercial systems use the same physics as residential but scale up: 4\" mains instead of 1\"; flush valves (no tank) for toilets at 1.6 gpf flushing in 4 seconds; recirculation as a code requirement for any hot-water run > 50 ft; flushometer urinals; grease interceptors on every food-service drain; multiple risers per floor. The math is the same — Hardy-Cross, fixture units, Darcy-Weisbach — but diversity matters more: as fixture count grows, the fraction of fixtures running at the same time shrinks, so peak demand grows much more slowly than fixture count. That's why a 200-fixture building doesn't need 100× the pipe of a 2-fixture bathroom.",
      keyTerms: [
        { term: "Flushometer", definition: "Direct-supply toilet/urinal valve. Typical manufacturer specs call for roughly 25 psi flowing pressure and a 1\" supply — always verify the actual model's spec sheet and locally adopted code." },
        { term: "Grease interceptor", definition: "Tank between food-service drains and the sewer. Captures fats, oils, grease. Sized per IPC Chapter 10." },
        { term: "Riser", definition: "Vertical supply run feeding multiple floors." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Build a 2-fixture commercial bathroom: Tank (60 m) → 1\" trunk → Tee → two sinks (3.15e-5 m³/s each).",
        hint: "Higher source head, larger trunk.",
        checkDescription: "commercial-scale layout",
      },
      {
        instruction: "Run. Confirm both sinks have adequate supply head.",
        hint: "Commercial fixtures often need ≥ 25 psi (≈18 m) at the device.",
        checkDescription: "both sinks ≥ 18 m supply head",
      },
      {
        instruction: "Scale up to 6 sinks. Run. Compare to the residential 2-fixture case.",
        hint: "Diversity matters — not all sinks will run at once.",
        checkDescription: "6 fixtures scaled",
      },
    ],
    soloChallenge: {
      prompt: "A 4-story office building has 8 bathrooms per floor. What's the right primary trunk diameter for a 60 m head source, given roughly 200 WSFU at peak demand?",
      successCriteria: "Trunk sized to maintain ≥ 25 psi at top-floor fixtures during peak demand. Typical answer: 3\" copper or 4\" iron primary, with risers stepping down at each floor branch.",
      scoringRubric: { correctness: 0.7, time: 0.15, componentCount: 0.15 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "tank", props: { head: 55 } },
        { kind: "pipe", props: { length: 20, diameter: 0.051 } },
        { kind: "tee" },
      ],
      prompt: "Build out a 2-floor riser with bathrooms on each floor. Where does pressure get tight first?",
    },
    credentialPathway:
      "Commercial plumbing is the highest-paid lane in the trade. UA Local 286 commercial journeyman wage scale in Austin (2024) exceeds $40/hr with full benefits.",
  },
  {
    dayNumber: 15,
    slug: "capstone",
    title: "Capstone — Design and Defend a Whole-House System",
    shortDescription: "Bring everything together. Design a working system, defend your choices, earn the certificate.",
    engineMode: "pipe-network",
    concept: {
      blurb:
        "You've worked through 14 days of fundamentals. Now design a real whole-house supply system from scratch: pick the layout, size every pipe, place every valve and fixture, simulate it, explain your choices, and pass an AI-tutor oral exam. Pass the capstone and your ThriveUp Academy profile shows the Plumbing Fundamentals badge — usable as evidence of prior learning at ACC's PLAB sequence, UA Local 286 pre-apprenticeship intake, and PHCC's apprenticeship application.",
      keyTerms: [
        { term: "Design intent", definition: "What the system delivers, in plain language: GPM at peak demand at each fixture." },
        { term: "Component selection", definition: "Right pipe size, right valves, right backflow devices, code-compliant fittings." },
        { term: "Defense", definition: "Explaining why you chose what you chose — to an inspector, to a homeowner, to a journeyman." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Pick a project: (a) 1-bathroom small house, (b) 2-bath/1-kitchen typical house, (c) 3-bath with hot-water recirculation.",
        hint: "Choose one.",
        checkDescription: "project chosen",
      },
      {
        instruction: "Design the supply system on the canvas. Simulate it. Confirm every fixture gets ≥ 20 m supply head at peak demand.",
        hint: "Use everything you've learned — trunk-and-branch, valves, recirculation, backflow protection.",
        checkDescription: "system functional",
      },
      {
        instruction: "Submit to the AI tutor for review.",
        hint: "Tutor will quiz you on pipe sizing, code, and design intent.",
        checkDescription: "tutor pass",
      },
    ],
    soloChallenge: {
      prompt: "Capstone project, your design, your defense.",
      successCriteria: "AI tutor PASS rating on: correctness, code compliance, pipe sizing, backflow protection, and design intent.",
      scoringRubric: { correctness: 0.6, time: 0.0, componentCount: 0.4 },
      backflowRubric: {
        mode: "must-have-check-valve",
        passMessage: "Backflow protection present. Your capstone design includes at least one check valve at a cross-connection — the one criterion an inspector will fail an otherwise perfect system for missing.",
        failMessage: "Your capstone has no backflow protection. Code requires a check valve (or air gap / RPZ) at every cross-connection — add at least one check valve to your design before submitting.",
      },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Free design — anything you want to try.",
    },
    credentialPathway:
      "On capstone PASS: ThriveUp Academy issues a Plumbing Fundamentals badge that you can attach to your application to ACC's PLAB 1305 (Basic Plumbing) intake, UA Local 286 pre-apprenticeship, or PHCC apprenticeship as evidence of prior learning. Direct-hire and contractor referral pathways are being built out and will be listed here as partnerships are confirmed in writing.",
  },
];
