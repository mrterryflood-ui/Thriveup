/**
 * Electrical trade — 15-day curriculum content.
 *
 * Each lesson is shaped to fit the 5-loop player (Concept → Guided → Solo → Sandbox → Debrief).
 * Loaded into `trade_sims_lessons` at seed time. Edits here propagate via re-seed.
 *
 * Design notes:
 *   - Concept blurbs are short (≤120 words) — the canvas is the teacher, not the text.
 *   - Guided steps have an `expectedState` predicate the runtime can check against
 *     the live circuit (component types present + solver result tolerances).
 *   - Solo challenge scoring rubric is correctness-weighted then time-weighted.
 *   - Sandbox starters give the learner a working seed they can extend.
 *   - Credential pathway hooks link to ACC, NCCER, IBEW, apprenticeship signup.
 */

export type LessonConcept = {
  blurb: string;
  keyTerms: Array<{ term: string; definition: string }>;
  diagramKey?: string;
};

export type LessonGuidedStep = {
  instruction: string;
  hint: string;
  /** Free-form check description; the player runtime maps this to solver assertions. */
  checkDescription: string;
};

export type LessonSoloChallenge = {
  prompt: string;
  successCriteria: string;
  scoringRubric: {
    correctness: number; // weight, 0-1
    time: number;        // weight, 0-1
    componentCount: number; // bonus for elegance, 0-1
  };
};

export type LessonSandboxStarter = {
  /** Optional pre-placed components. Empty = blank canvas. */
  initialComponents: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  prompt: string;
};

/**
 * Tells the lesson player which simulation engine to expect.
 *  - "linear-dc": the MNA solver in `circuit-solver.ts` will run; guided checks
 *    that mention current/voltage are honored.
 *  - "concept-only": the solver is NOT run. Lessons in this mode are walkthroughs
 *    (AC theory, transistor behavior, gates, code, safety, schematic reading,
 *     power-system structure). Phase A's solver does not model nonlinear or
 *    digital behavior, so the player must skip "run the sim" checks here.
 *    Day 7–10 will graduate to a richer engine in Phase D.
 */
export type LessonEngineMode = "linear-dc" | "concept-only";

export interface ElectricalLessonContent {
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

export const ELECTRICAL_LESSONS: ElectricalLessonContent[] = [
  {
    dayNumber: 1,
    slug: "ohms-law",
    title: "Ohm's Law",
    shortDescription: "Voltage, current, and resistance — the foundation of every circuit.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Every working circuit obeys one rule: V = I × R. Voltage (V) is the push, current (I) is the flow, and resistance (R) is what slows the flow down. Change any one and the other two adjust. Memorize the triangle, then forget it — you'll feel it in every circuit you build from here on.",
      keyTerms: [
        { term: "Voltage (V)", definition: "Electrical pressure between two points, measured in volts." },
        { term: "Current (I)", definition: "Rate of electron flow, measured in amperes (amps)." },
        { term: "Resistance (R)", definition: "Opposition to current flow, measured in ohms (Ω)." },
      ],
    },
    guidedSteps: [
      {
        instruction: "Drag a 9V battery onto the canvas.",
        hint: "Find 'Battery' in the source palette on the left.",
        checkDescription: "exactly one battery placed with voltage = 9",
      },
      {
        instruction: "Drag a 1 kΩ resistor onto the canvas.",
        hint: "Resistors are in the passive components group.",
        checkDescription: "exactly one resistor placed with resistance = 1000",
      },
      {
        instruction: "Wire the battery's + terminal to one side of the resistor, then wire the other side back to the battery's −.",
        hint: "Click a terminal, then click the destination terminal to draw a wire.",
        checkDescription: "complete loop: battery+ → resistor → battery−",
      },
      {
        instruction: "Press 'Run'. Read the current on the resistor. It should be 9 mA (0.009 A).",
        hint: "I = V / R = 9 / 1000 = 0.009 A. The canvas displays this in mA.",
        checkDescription: "resistor current within ±5% of 9 mA",
      },
    ],
    soloChallenge: {
      prompt: "Build a circuit where exactly 25 mA flows through a single resistor powered by a 5 V battery. Pick the right resistance.",
      successCriteria: "Resistor current measures 25 mA ±5%.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "battery", props: { voltage: 9 } },
        { kind: "resistor", props: { resistance: 1000 } },
      ],
      prompt: "Experiment: change the resistance and watch the current change. Try 100 Ω, 10 kΩ, 1 MΩ. What pattern do you see?",
    },
    credentialPathway:
      "Ohm's Law is the first thing tested on the NCCER Electrical Level 1 written exam. Master this and you're ready for ACC's pre-apprenticeship intake.",
  },
  {
    dayNumber: 2,
    slug: "dc-circuits",
    title: "DC Circuits",
    shortDescription: "Series, parallel, and the difference that decides which lights stay on.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Direct current (DC) flows in one direction — battery → load → battery. When components share the same current path, they're in SERIES. When they share the same voltage across them, they're in PARALLEL. Series circuits split voltage; parallel circuits split current. Get this right and house wiring suddenly makes sense.",
      keyTerms: [
        { term: "Series", definition: "Components arranged so the same current flows through each one in turn." },
        { term: "Parallel", definition: "Components arranged so each one has the same voltage across it." },
        { term: "DC (Direct Current)", definition: "Current that flows in one constant direction. Batteries make DC." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a 9 V battery.", hint: "Same as Day 1.", checkDescription: "1 battery, 9V" },
      { instruction: "Place two 1 kΩ resistors in series.", hint: "Wire them end-to-end so current goes battery → R1 → R2 → battery.", checkDescription: "2 resistors in a single loop" },
      { instruction: "Run. Note the current is 4.5 mA — half of Day 1.", hint: "Series resistances add: 1k + 1k = 2k. I = 9 / 2000 = 4.5 mA.", checkDescription: "resistor currents both 4.5 mA ±5%" },
      { instruction: "Add a switch in the loop and open it.", hint: "Find 'Switch' in the palette. Click it to toggle.", checkDescription: "switch placed, open" },
      { instruction: "Run again. Current is now zero — the open switch breaks the path.", hint: "An open switch is an infinite resistance.", checkDescription: "all currents = 0" },
    ],
    soloChallenge: {
      prompt: "Build a parallel circuit: one 9 V battery powering two 1 kΩ resistors in parallel. What's the current through each? What's the total current from the battery?",
      successCriteria: "Each resistor: 9 mA. Battery current: 18 mA. Both within ±5%.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [{ kind: "battery", props: { voltage: 12 } }],
      prompt: "You have 12 V. Design a circuit that powers an LED safely (LED forward voltage 2 V, safe current ~10 mA). What resistor value do you need?",
    },
    credentialPathway:
      "Series vs parallel is the #1 troubleshooting concept on residential wiring. Every electrician apprentice masters this in Week 1.",
  },
  {
    dayNumber: 3,
    slug: "ac-circuits-intro",
    title: "AC Circuits (Introduction)",
    shortDescription: "What changes when the current keeps reversing direction.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Alternating current (AC) reverses direction many times per second — 60 Hz in the U.S. wall outlet. AC is how power gets delivered to your house because it travels long distances better. For now, you'll learn how to recognize AC and where it shows up. We'll work mostly in DC for the simulator, but every electrician needs to know the difference.",
      keyTerms: [
        { term: "AC (Alternating Current)", definition: "Current that reverses direction periodically. U.S. mains is 60 Hz." },
        { term: "Frequency (Hz)", definition: "Cycles per second. Hz = Hertz." },
        { term: "RMS (Root Mean Square)", definition: "Effective DC-equivalent value of an AC waveform. 120 V AC RMS = 170 V peak." },
      ],
    },
    guidedSteps: [
      { instruction: "Observe: a battery (DC source) and an AC source side by side.", hint: "The waveform display shows the difference.", checkDescription: "concept-only check" },
      { instruction: "Note that a resistor behaves the same in DC and AC — it just dissipates power.", hint: "P = I² × R works for both.", checkDescription: "concept-only check" },
    ],
    soloChallenge: {
      prompt: "Identify three places in a house where you'd find DC vs AC. (Answer in the debrief.)",
      successCriteria: "Free-response, AI tutor grades.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "This is a concept-only day. Free-explore — try any of the components you've learned so far.",
    },
    credentialPathway: "AC fundamentals appear in NCCER Electrical Level 1 lesson 4. You're a third of the way there.",
  },
  {
    dayNumber: 4,
    slug: "resistors-deep",
    title: "Resistors in Depth",
    shortDescription: "Color codes, tolerances, and the power rating that decides when a resistor burns up.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Resistors aren't just numbers — they have a tolerance (±5%, ±1%) and a power rating (¼ W, ½ W, 1 W). Pick a resistor that's too small for the power it has to dissipate and you get smoke. P = I² × R is the formula that keeps your circuits from catching fire.",
      keyTerms: [
        { term: "Tolerance", definition: "How close a resistor's actual value is to its nominal value. ±5% is common." },
        { term: "Power rating", definition: "Maximum power a resistor can dissipate without damage." },
        { term: "Color code", definition: "Bands on a resistor encode its value. Black=0, Brown=1, Red=2, Orange=3..." },
      ],
    },
    guidedSteps: [
      { instruction: "Build a 12 V circuit with a 100 Ω resistor.", hint: "Series loop.", checkDescription: "12V battery, 100Ω resistor, loop closed" },
      { instruction: "Run. Note current = 0.12 A and resistor power = I² × R = 1.44 W.", hint: "Most through-hole resistors are ¼ W rated. This one would burn up.", checkDescription: "current ≈ 0.12 A, computed power displayed" },
      { instruction: "Increase resistor to 1 kΩ. Now power = 0.144 W — safe under a ¼ W rating.", hint: "Bigger resistance, less current, less power dissipated.", checkDescription: "current ≈ 12 mA, power ≈ 144 mW" },
    ],
    soloChallenge: {
      prompt: "A 24 V battery powers a single resistor. You only have ½ W resistors on hand. What's the minimum resistance you can safely use?",
      successCriteria: "Resistance ≥ 1152 Ω (since P = V²/R, 0.5 = 576/R → R = 1152).",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "battery", props: { voltage: 24 } },
        { kind: "resistor", props: { resistance: 1500 } },
      ],
      prompt: "Try driving an LED off 24 V. What current-limiting resistor keeps the LED at 10 mA without exceeding ¼ W?",
    },
    credentialPathway:
      "Resistor sizing is the difference between a working install and a fire-marshal callback. NCCER Level 1 lesson 6.",
  },
  {
    dayNumber: 5,
    slug: "capacitors",
    title: "Capacitors",
    shortDescription: "Energy storage in an electric field — the component that smooths every power supply.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Capacitors store energy in an electric field between two plates. In DC steady state, a capacitor acts like an open circuit — no current flows through it once it's fully charged. In AC and transient circuits, it does much more: smoothing power supplies, filtering noise, timing flashes. For now, learn what 'open in DC' means visually.",
      keyTerms: [
        { term: "Capacitance (F)", definition: "Ability to store electric charge. Measured in Farads. 1 µF = 0.000001 F." },
        { term: "Charging", definition: "Building up charge on the plates by applying voltage." },
        { term: "DC steady-state", definition: "After enough time has passed, capacitor current = 0." },
      ],
    },
    guidedSteps: [
      { instruction: "Build: 9 V battery → 1 kΩ resistor → 1 µF capacitor → back to battery.", hint: "Standard RC loop.", checkDescription: "loop with battery, resistor, capacitor" },
      { instruction: "Run. Steady-state current = 0 (the capacitor blocks DC).", hint: "Real life: it would have charged in milliseconds.", checkDescription: "all currents 0" },
      { instruction: "Voltage across the capacitor = 9 V (it's holding the full battery voltage).", hint: "All voltage drop is across the cap; none across the resistor since I=0.", checkDescription: "cap voltage = 9V" },
    ],
    soloChallenge: {
      prompt: "Build a DC circuit where the voltage across a capacitor is 6 V, using a 12 V battery and one resistor. (Hint: it can't be done with just those components — explain why.)",
      successCriteria: "AI tutor grades the explanation. Key insight: in DC steady-state, ALL the voltage drops across the cap if it's the only series load — there's nothing to share the drop with.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "battery", props: { voltage: 12 } },
        { kind: "capacitor", props: { capacitance: 0.0001 } },
      ],
      prompt: "Add a resistor in series and observe steady-state voltage distribution.",
    },
    credentialPathway: "Caps show up in every motor starter, every fluorescent ballast, every HVAC unit. NCCER Level 2 builds on this.",
  },
  {
    dayNumber: 6,
    slug: "inductors",
    title: "Inductors",
    shortDescription: "Energy storage in a magnetic field — the heart of motors, transformers, and relays.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "An inductor is a coil of wire that stores energy in its magnetic field when current flows. In DC steady state, an inductor acts like a short circuit — zero resistance, full current through. In AC and transients, it resists changes in current (the opposite of a capacitor, which resists changes in voltage). Inductors are the working heart of every motor, transformer, and relay you'll ever see.",
      keyTerms: [
        { term: "Inductance (H)", definition: "Ability to store energy in a magnetic field. Measured in Henrys." },
        { term: "Back-EMF", definition: "Voltage generated by a collapsing magnetic field when current changes." },
        { term: "DC short", definition: "In steady DC, an inductor has zero impedance." },
      ],
    },
    guidedSteps: [
      { instruction: "Build: 9 V battery → 1 kΩ resistor → 1 mH inductor → back to battery.", hint: "RL loop.", checkDescription: "loop with battery, resistor, inductor" },
      { instruction: "Run. Steady-state current ≈ 9 mA — same as a simple R-only circuit.", hint: "The inductor is a short in DC.", checkDescription: "current ≈ 9 mA" },
      { instruction: "Voltage across the inductor = 0 V. All voltage drop is on the resistor.", hint: "Short circuit = no voltage drop.", checkDescription: "inductor voltage ≈ 0" },
    ],
    soloChallenge: {
      prompt: "Predict: if you put a 1 mH inductor in parallel with a 1 kΩ resistor across a 9 V battery, what's the current through each in DC steady state?",
      successCriteria: "Inductor: ∞ (short) — actually limited only by source resistance. Resistor: 9 mA. Total: very high.",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [
        { kind: "battery", props: { voltage: 9 } },
        { kind: "inductor", props: { inductance: 0.001 } },
        { kind: "resistor", props: { resistance: 1000 } },
      ],
      prompt: "Wire these in different topologies (series, parallel) and observe.",
    },
    credentialPathway: "Inductors = transformers = motor windings. Every commercial electrical install touches inductive loads.",
  },
  {
    dayNumber: 7,
    slug: "npn-transistor",
    title: "NPN Transistor",
    shortDescription: "A tiny switch controlled by an even tinier signal — the building block of all electronics.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "An NPN transistor has three terminals: collector (C), base (B), and emitter (E). A small current into the base controls a much larger current from collector to emitter. The gain (β, beta) is typically 100 — so 1 mA in the base = 100 mA through the collector. Transistors are how a microcontroller pin drives a 12 V relay or a strip of LEDs.",
      keyTerms: [
        { term: "Collector (C)", definition: "Where the controlled current flows IN." },
        { term: "Base (B)", definition: "Control pin. Small current here unlocks the big current." },
        { term: "Emitter (E)", definition: "Where the controlled current flows OUT." },
        { term: "Beta (β)", definition: "Current gain. I_C ≈ β × I_B when the transistor is in active mode." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an NPN transistor on the canvas.", hint: "Active components group.", checkDescription: "1 NPN placed" },
      { instruction: "Wire collector to a 12 V supply through a 100 Ω resistor (the load).", hint: "12V → R → C", checkDescription: "wiring matches" },
      { instruction: "Wire base through a 10 kΩ resistor to a 5 V control signal.", hint: "5V → R → B", checkDescription: "wiring matches" },
      { instruction: "Wire emitter to ground. Run.", hint: "Standard common-emitter switch configuration.", checkDescription: "wiring complete" },
    ],
    soloChallenge: {
      prompt: "You have a 3.3 V microcontroller pin that can source only 5 mA. You need to drive a 12 V solenoid that draws 200 mA. Design the NPN driver circuit.",
      successCriteria: "Correct topology: μC pin → base resistor → base; collector → load → 12V; emitter → ground. Base resistor sized so I_B × β ≥ 200 mA.",
      scoringRubric: { correctness: 0.8, time: 0.1, componentCount: 0.1 },
    },
    sandboxStarter: {
      initialComponents: [{ kind: "npn_transistor" }],
      prompt: "Design a switch circuit using an NPN to control an LED.",
    },
    credentialPathway: "Transistor switching is the bridge from electrical to electronics. Foundation for industrial controls.",
  },
  {
    dayNumber: 8,
    slug: "pnp-transistor",
    title: "PNP Transistor",
    shortDescription: "The NPN's mirror image — for switching the HIGH side of a load.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A PNP transistor is the mirror of an NPN. Current flows from emitter to collector, and the base needs to be pulled LOW to turn the transistor on. PNPs are the right tool when you need to switch the positive supply rail (high-side switching) rather than the ground side.",
      keyTerms: [
        { term: "High-side switching", definition: "Switching the positive supply between source and load — PNP territory." },
        { term: "Low-side switching", definition: "Switching the ground return — NPN territory." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a PNP transistor.", hint: "Same group as NPN.", checkDescription: "1 PNP placed" },
      { instruction: "Wire emitter to +12 V, collector through load to ground.", hint: "Emitter is the HIGH side for PNP.", checkDescription: "wiring matches" },
      { instruction: "Wire base through a resistor to a control signal.", hint: "Pull base LOW to turn ON.", checkDescription: "wiring complete" },
    ],
    soloChallenge: {
      prompt: "When would you choose PNP over NPN in a real install?",
      successCriteria: "Explain: high-side switching is preferred for safety in some grounded-load configurations.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [{ kind: "pnp_transistor" }],
      prompt: "Build a high-side LED driver.",
    },
    credentialPathway: "PNPs appear less often in residential but commonly in automotive and industrial control panels.",
  },
  {
    dayNumber: 9,
    slug: "logic-gates",
    title: "Logic Gates",
    shortDescription: "AND, OR, NOT — the alphabet of every digital circuit.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Logic gates take binary inputs (HIGH or LOW, 1 or 0) and produce a binary output. AND outputs HIGH only when both inputs are HIGH. OR outputs HIGH when either input is HIGH. NOT inverts. Every microprocessor, every smart thermostat, every digital control on an HVAC unit is built from millions of these.",
      keyTerms: [
        { term: "HIGH / LOW", definition: "Logic levels. HIGH ≈ supply voltage; LOW ≈ 0 V." },
        { term: "Truth table", definition: "Lists every input combination and the corresponding output." },
        { term: "Boolean algebra", definition: "The math of combining logic gates." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an AND gate with two HIGH inputs. Output is HIGH.", hint: "AND needs both inputs HIGH.", checkDescription: "AND gate placed, both inputs HIGH, output HIGH" },
      { instruction: "Set one input LOW. Output goes LOW.", hint: "Truth table A=1,B=0 → out=0.", checkDescription: "output LOW" },
      { instruction: "Replace with OR. With same inputs (one HIGH, one LOW), output is HIGH.", hint: "OR needs at least one HIGH.", checkDescription: "OR output HIGH" },
    ],
    soloChallenge: {
      prompt: "Build a circuit that turns on a fan ONLY when (motion-detected AND temperature-above-threshold). Use AND.",
      successCriteria: "Correct gate placement and truth-table behavior.",
      scoringRubric: { correctness: 0.9, time: 0.05, componentCount: 0.05 },
    },
    sandboxStarter: {
      initialComponents: [{ kind: "and_gate" }, { kind: "or_gate" }, { kind: "not_gate" }],
      prompt: "Combine these three to make XOR (exclusive OR): output HIGH only when inputs differ.",
    },
    credentialPathway: "Logic gates are foundational for PLC (Programmable Logic Controller) work in industrial electrical.",
  },
  {
    dayNumber: 10,
    slug: "microcontroller-intro",
    title: "Microcontroller Intro",
    shortDescription: "A computer the size of a fingernail that controls every modern device.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A microcontroller is a tiny computer on a single chip — CPU, memory, and digital/analog I/O pins. Modern HVAC, smart locks, EV chargers, and industrial sensors all run on microcontrollers. You don't need to be a programmer to install them, but you do need to know how to wire their digital pins to relays, transistors, and sensors.",
      keyTerms: [
        { term: "GPIO", definition: "General-Purpose I/O. A pin that can be configured as input or output." },
        { term: "PWM", definition: "Pulse-Width Modulation. How a microcontroller fakes analog output." },
        { term: "I²C / SPI / UART", definition: "Common serial protocols microcontrollers use to talk to sensors and displays." },
      ],
    },
    guidedSteps: [
      { instruction: "Conceptually: a microcontroller pin can source/sink only ~20 mA. Most loads need more.", hint: "Hence the transistor driver from Day 7.", checkDescription: "concept-only" },
      { instruction: "Sketch: μC pin → NPN base resistor → NPN → load → +V.", hint: "Same as Day 7.", checkDescription: "concept-only" },
    ],
    soloChallenge: {
      prompt: "You're installing a smart thermostat. It has a 3.3 V output pin that needs to control a 24 V HVAC relay coil. What's the interface circuit?",
      successCriteria: "NPN low-side driver with base current-limit resistor, flyback diode across relay coil.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Free-design: a battery-powered LED dimmer using PWM concepts.",
    },
    credentialPathway: "Smart-home and building-automation installers earn 20-40% more than standard electrical apprentices.",
  },
  {
    dayNumber: 11,
    slug: "power-systems",
    title: "Power Systems",
    shortDescription: "From the panel to the outlet — how electricity gets to where it does work.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Residential power in the U.S. comes in at 240 V split-phase: two 120 V hot legs and a neutral. The main panel distributes branch circuits through circuit breakers. Every branch circuit has a load limit (15 A or 20 A for lighting/outlets, 30+ A for major appliances). Understanding how power is distributed is the difference between a passable wiring job and a code-compliant one.",
      keyTerms: [
        { term: "Service entrance", definition: "Where power enters the building from the utility." },
        { term: "Main panel", definition: "Distributes power to branch circuits via breakers." },
        { term: "Branch circuit", definition: "A single circuit from the panel to a set of loads." },
        { term: "Neutral vs ground", definition: "Two different conductors. Neutral carries return current; ground is safety only." },
      ],
    },
    guidedSteps: [
      { instruction: "Concept: model the 120 V branch as a 120 V source feeding multiple parallel loads.", hint: "Outlets in a room are in parallel.", checkDescription: "concept" },
      { instruction: "If each outlet draws 5 A and the breaker is 20 A, how many outlets can be loaded?", hint: "20 ÷ 5 = 4.", checkDescription: "answer = 4" },
    ],
    soloChallenge: {
      prompt: "A 15 A breaker feeds a circuit with three loads in parallel: 800 W microwave, 200 W lamp, 1500 W space heater. Will the breaker trip? (At 120 V.)",
      successCriteria: "Total power = 2500 W. Total current = 2500/120 = 20.8 A. YES, breaker trips.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Sketch a panel diagram with three branch circuits of different loads.",
    },
    credentialPathway: "Branch-circuit sizing is the most-tested topic on the journeyman electrician license exam.",
  },
  {
    dayNumber: 12,
    slug: "wiring-safety",
    title: "Wiring Safety",
    shortDescription: "The rules that keep people alive — GFCI, AFCI, and the National Electrical Code.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Electrical work kills more workers than any other trade if shortcuts are taken. The National Electrical Code (NEC) exists because of every fire, electrocution, and arc-flash injury that's ever happened. GFCI outlets save you from drowning-while-using-a-hairdryer; AFCI breakers stop arcing fires in bedroom walls. Knowing WHERE each is required is half the job.",
      keyTerms: [
        { term: "GFCI", definition: "Ground-Fault Circuit Interrupter. Trips on imbalance between hot and neutral. Required at all kitchen, bathroom, outdoor outlets." },
        { term: "AFCI", definition: "Arc-Fault Circuit Interrupter. Detects arcing patterns. Required in bedrooms, living rooms." },
        { term: "Lockout/Tagout", definition: "Procedure to disable a circuit before working on it." },
        { term: "NEC", definition: "National Electrical Code. Updated every 3 years. The bible of electrical installation." },
      ],
    },
    guidedSteps: [
      { instruction: "Concept: GFCI works by comparing current in the hot and neutral. Any imbalance > 5 mA = trip.", hint: "5 mA is the level that can stop your heart.", checkDescription: "concept" },
      { instruction: "AFCI works by detecting waveform patterns characteristic of arcing.", hint: "AFCI looks for the chaotic signature of arcing.", checkDescription: "concept" },
    ],
    soloChallenge: {
      prompt: "Where are GFCIs required by code? (List at least 5 locations.)",
      successCriteria: "Kitchen, bathroom, outdoor, garage, unfinished basement, near pools/spas, laundry, crawl spaces.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Concept-only day. Review NEC Article 210 highlights.",
    },
    credentialPathway: "Safety modules are mandatory on every NCCER and union apprenticeship exam.",
  },
  {
    dayNumber: 13,
    slug: "schematic-reading",
    title: "Schematic Reading",
    shortDescription: "Translating a drawing into a working install — and back again.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A schematic shows the electrical connections, not the physical layout. Battery symbols, resistor zigzags, ground triangles, switch lines — every symbol is universal. Read a schematic well and you can install ANY circuit. Read it poorly and you wire your house wrong.",
      keyTerms: [
        { term: "Schematic", definition: "Diagram showing electrical connections and component values, NOT physical placement." },
        { term: "Pictorial diagram", definition: "Shows components as they look physically, with simplified wires." },
        { term: "Wiring diagram", definition: "Shows actual wire routing in a real install." },
      ],
    },
    guidedSteps: [
      { instruction: "Given a schematic on screen, identify each symbol.", hint: "Battery = long-short lines. Resistor = zigzag. Ground = triangle pointing down.", checkDescription: "identify symbols" },
      { instruction: "Recreate the schematic on the canvas.", hint: "Drag components, wire as shown.", checkDescription: "canvas matches schematic" },
    ],
    soloChallenge: {
      prompt: "Read the provided schematic and identify what it does. Build it.",
      successCriteria: "Canvas circuit topologically equivalent to the schematic.",
      scoringRubric: { correctness: 0.8, time: 0.2, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Reverse: design your own simple circuit and produce its schematic.",
    },
    credentialPathway: "Schematic literacy is the gateway to industrial controls, motor control centers, and PLC work.",
  },
  {
    dayNumber: 14,
    slug: "troubleshooting",
    title: "Troubleshooting",
    shortDescription: "Why isn't the circuit working? The seven things to check, in order.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "Every working electrician spends most of their time NOT building new circuits — they're fixing broken ones. Troubleshooting is the highest-paid skill in the trade. The order matters: (1) is power on? (2) is the breaker tripped? (3) is the switch working? (4) is the load itself broken? (5) is the wiring intact? (6) is the neutral connected? (7) is there a ground fault? Skip a step and you waste hours.",
      keyTerms: [
        { term: "Continuity test", definition: "Multimeter test to check if a wire/connection is unbroken." },
        { term: "Voltage test", definition: "Multimeter test to confirm voltage is present." },
        { term: "Isolation", definition: "Disconnect parts of the circuit to narrow down where the fault is." },
      ],
    },
    guidedSteps: [
      { instruction: "The simulator has a broken circuit. Run it — no current flows.", hint: "Check each component and connection.", checkDescription: "broken state detected" },
      { instruction: "Find and fix the fault.", hint: "Look for an open switch, broken wire, or wrong component value.", checkDescription: "circuit works after fix" },
    ],
    soloChallenge: {
      prompt: "A house circuit feeds three outlets in series (wrong — but it happens). The first outlet works, the other two don't. What's the fault and how do you confirm it?",
      successCriteria: "Fault: an open connection between outlet 1 and 2. Confirm with continuity test from outlet 1's downstream terminal to outlet 2's upstream terminal.",
      scoringRubric: { correctness: 1, time: 0, componentCount: 0 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Design your own faulty circuit and teach a friend to troubleshoot it.",
    },
    credentialPathway: "Troubleshooting separates apprentices from journeymen. This is where the wage gap opens.",
  },
  {
    dayNumber: 15,
    slug: "capstone",
    title: "Capstone — Design and Defend",
    shortDescription: "Bring everything together. Design a working circuit, defend your choices, earn the certificate.",
    engineMode: "linear-dc",
    concept: {
      blurb:
        "You've worked through 14 days of fundamentals. Now design a real circuit from scratch: pick a goal, lay it out, simulate it, explain your component choices, and pass an AI-tutor oral exam. Pass the capstone and your ThriveUp Academy profile shows the Electrical Fundamentals badge — usable as evidence of prior learning at ACC and several NCCER-affiliated pre-apprenticeship programs.",
      keyTerms: [
        { term: "Design intent", definition: "What the circuit is supposed to do, in plain language." },
        { term: "Component selection", definition: "Choosing parts with the right values AND ratings for the job." },
        { term: "Defense", definition: "Explaining why you chose what you chose, to a real-world tester." },
      ],
    },
    guidedSteps: [
      { instruction: "Pick a project: (a) battery-powered LED night light, (b) 12 V relay-driven motor controller, (c) two-input AND-gate alarm.", hint: "Choose one.", checkDescription: "project chosen" },
      { instruction: "Design the circuit on the canvas. Simulate it. Confirm it meets the goal.", hint: "Use everything you've learned.", checkDescription: "circuit functional" },
      { instruction: "Submit to the AI tutor for review.", hint: "Tutor will quiz you on component choices.", checkDescription: "tutor pass" },
    ],
    soloChallenge: {
      prompt: "Capstone project, your design, your defense.",
      successCriteria: "AI tutor PASS rating on: correctness, safety, component sizing, and design intent.",
      scoringRubric: { correctness: 0.6, time: 0.0, componentCount: 0.4 },
    },
    sandboxStarter: {
      initialComponents: [],
      prompt: "Free design — anything you want to try.",
    },
    credentialPathway:
      "On capstone PASS: ThriveUp Academy issues Electrical Fundamentals badge. Submit with your application to ACC's pre-apprenticeship cohort or a sponsoring electrical contractor. Three TCAF coalition contractors hire badge-holders directly.",
  },
];

export const ELECTRICAL_TRADE_META = {
  slug: "electrical",
  name: "Electrical",
  tagline: "From Ohm's Law to a working capstone in 15 days.",
  description:
    "Build real circuits in your browser. Get instant feedback. Earn a credential pathway into ACC's pre-apprenticeship program or a sponsoring electrical contractor. Free. No installation. Multilingual.",
  iconKey: "zap",
  displayOrder: 1,
};
