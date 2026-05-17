/**
 * Welding trade — 15-day curriculum content.
 *
 * Mirrors the Electrical / Plumbing / Automotive lesson schema exactly so the
 * lesson player runs without modification. Engine modes:
 *   - "heat-input"    → run the evaluator in
 *                       `client/src/lib/trade-sims/welding/heat-input-evaluator.ts`
 *   - "concept-only"  → no evaluator; walkthrough + sandbox + inspection.
 *
 * Days using the evaluator: 4-7 (process basics), 9-10 (fillet + groove
 * sizing), 14-15 (troubleshooting + capstone WPS). 7 of 15 lessons are
 * concept-only — safety, metallurgy, codes, and inspection are pattern-
 * recognition disciplines.
 *
 * Credential pathway hooks reference real programs only — AWS CW + CWI tracks,
 * NCCER Welding Levels 1-3, ACC welding certificate, Tulsa Welding School
 * national pathway, Ironworkers Local 482 (Austin) apprenticeship. No invented
 * partnerships.
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

export interface WeldingLessonContent {
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

export const WELDING_TRADE_META: TradeMeta = {
  slug: "welding",
  name: "Welding",
  tagline: "Heat input, joint geometry, code-grade welds — without burning a single rod.",
  description:
    "Stick, MIG, flux-core, and TIG. Learn the parameters that separate a code weld from a porous mess, then verify your settings against AWS D1.1 before you strike an arc.",
  iconKey: "flame",
  displayOrder: 4,
};

export const WELDING_LESSONS: WeldingLessonContent[] = [
  {
    dayNumber: 1,
    slug: "process-overview",
    title: "Welding Process Overview",
    shortDescription: "Stick, MIG, flux-core, TIG — what each is for, what each is not.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Four welding processes cover 95% of the work. SMAW (stick) is portable and works in wind and dirt — field jobs love it. GMAW (MIG) is fast and clean in a shop with clean steel and shielding gas. FCAW (flux-core) is GMAW's tougher cousin — bigger gaps, dirtier steel, more deposition. GTAW (TIG) is slow and clean — thin material, stainless, aluminum, code work where the bead matters. Choose process before you choose anything else.",
      keyTerms: [
        { term: "SMAW", definition: "Shielded Metal Arc Welding — stick rod with flux coating. The portable, all-purpose process." },
        { term: "GMAW", definition: "Gas Metal Arc Welding — continuous wire with external shielding gas. The shop workhorse." },
        { term: "FCAW", definition: "Flux-Cored Arc Welding — tubular wire with internal flux. Self- or gas-shielded." },
        { term: "GTAW", definition: "Gas Tungsten Arc Welding (TIG) — non-consumable tungsten + hand-fed filler. Precision work." },
      ],
    },
    guidedSteps: [
      { instruction: "Place one consumable of each process: stick electrode, MIG wire spool, FCAW wire, TIG tungsten.", hint: "Find them in the consumables palette.", checkDescription: "smaw_electrode + gmaw_wire_spool + fcaw_wire + tig_tungsten all placed" },
      { instruction: "Inspect each consumable to see its typical use case.", hint: "The inspector shows process, diameter, and parameter ranges.", checkDescription: "all four consumables inspected at least once" },
      { instruction: "Match application to process: 'pipeline in a field, no clean shop, mild steel' →", hint: "Wind + dirt = stick rod's home turf.", checkDescription: "learner selects SMAW" },
    ],
    soloChallenge: {
      prompt: "A customer has 1.5 mm stainless tubing to join. Pick the welding process and one-line reasoning.",
      successCriteria: "GTAW (TIG) — slow, clean, low heat input controllable on thin material; stainless prefers TIG.",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Build a decision tree on the canvas: 'first ask thickness, then ask environment, then ask material' → process." },
    credentialPathway:
      "Process literacy is question 1 on the AWS Certified Welder structural exam and NCCER Welding Level 1 Module 1.",
  },
  {
    dayNumber: 2,
    slug: "safety-and-ppe",
    title: "Welding Safety & PPE",
    shortDescription: "The single most-skipped lesson in welding. Don't skip it.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Welding hurts you in four ways: UV light (arc eye, like a sunburn on your cornea), heat (slag, sparks, hot metal), fumes (manganese, hexavalent chromium on stainless, zinc on galvanized), and electric shock (any wet boot on a wet floor with a live electrode). The PPE answer is the same as it was 100 years ago — auto-darkening helmet (shade 10-13), leathers, gloves, respirator on stainless / galvanized, and never weld with bare feet or wet clothes. Most welder injuries are 'I just need to tack this real quick.'",
      keyTerms: [
        { term: "Arc eye", definition: "UV burn on the cornea. Feels like sand. Heals in 24-48 hours; permanent damage with repeated exposure." },
        { term: "Hexavalent chromium", definition: "Carcinogen produced when welding stainless. Requires respirator and exhaust ventilation." },
        { term: "Auto-darkening helmet", definition: "Lens that darkens within ~0.1 ms of arc strike. Shade 10-13 typical." },
      ],
    },
    guidedSteps: [
      { instruction: "List the four ways welding can hurt you.", hint: "Light, heat, fumes, shock.", checkDescription: "learner names all 4" },
      { instruction: "Identify the PPE for each hazard.", hint: "Helmet/leathers/respirator/dry boots.", checkDescription: "learner matches PPE to each hazard" },
      { instruction: "Spot the violation: 'tacking a galvanized pipe, no respirator.' →", hint: "Zinc fumes = metal-fume fever (flu-like, 6-24 hr onset).", checkDescription: "learner flags respirator missing" },
    ],
    soloChallenge: {
      prompt: "Walk into a shop. Three welders are working — one TIG on stainless with no respirator, one stick outdoors in light rain, one MIG in clean shop air with full PPE. Rank the immediate risks.",
      successCriteria: "Highest risk = stick in rain (shock); second = TIG on stainless without respirator (hex-chrome); third = MIG (PPE-compliant, only residual fume).",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Build a safety checklist on the canvas. Mark which items are 'always' and which are 'process- or material-specific.'" },
    credentialPathway:
      "OSHA 10 and 30-hour cards are required at most union shops. NCCER Core Module 1 and 2 cover this exact material.",
  },
  {
    dayNumber: 3,
    slug: "base-metals-and-weldability",
    title: "Base Metals & Weldability",
    shortDescription: "Why mild steel forgives and stainless punishes.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Not all metal welds the same. Mild steel (A36) is forgiving — heat it, fill the gap, move on. Stainless 304 needs low heat input and back-purging to prevent chromium-carbide precipitation. Aluminum 6061 needs AC TIG and an oxide-cleaning action because its oxide melts at a higher temperature than the metal itself. Cast iron and high-carbon steels often crack on cooling and need preheat + post-weld heat treatment. Today you learn to ask 'what is it?' before 'what settings?'",
      keyTerms: [
        { term: "A36", definition: "Most common structural mild steel — very weldable, low carbon (≤0.25%)." },
        { term: "Sensitization", definition: "Chromium carbides forming at grain boundaries in stainless when held at 800-1500°F. Reduces corrosion resistance." },
        { term: "Preheat", definition: "Heating base metal before welding to slow cooling — required for high-carbon steel and thick sections." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a base-metal plate. Inspect its default material (A36 mild steel).", hint: "The inspector shows material, thickness, length.", checkDescription: "base_metal_plate placed and inspected" },
      { instruction: "Change the plate to stainless 304 (in the props). Note how the recommended process changes.", hint: "TIG with back-purge for code work; pulse-MIG for production.", checkDescription: "learner changes material to 304" },
      { instruction: "Identify the metal that requires preheat: 'high-carbon AISI 4340.' →", hint: "Anything ≥0.4% C usually wants preheat.", checkDescription: "learner flags preheat required" },
    ],
    soloChallenge: {
      prompt: "Three plates: A36 mild steel 10 mm, 304 stainless 3 mm, 6061 aluminum 6 mm. Pick the process and one critical parameter consideration for each.",
      successCriteria: "Mild → SMAW/GMAW, standard params; Stainless → GTAW low HI + back-purge; Aluminum → AC GTAW, oxide cleaning.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [{ kind: "base_metal_plate", props: { material: "A36", thicknessMm: 6 } }], prompt: "Switch between three materials in the inspector and note which process recommendation changes." },
    credentialPathway:
      "Material identification is a hands-on test on the AWS CW practical. ACC's Welding Technology AAS covers metallurgy in semester 2.",
  },
  {
    dayNumber: 4,
    slug: "smaw-stick-basics",
    title: "SMAW Stick Basics & Rod Selection",
    shortDescription: "Strike, run, watch your puddle. The original portable welding process.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "SMAW is the field welder's process. A flux-coated rod is held in an electrode holder; you strike it on the work, hold the arc length steady (about one rod-diameter), and travel. The flux burns to produce shielding gas and a slag layer you chip off after. E7018 is the workhorse low-hydrogen rod for structural; E6010 for root passes on pipe. Today you set up an SMAW pass and watch the evaluator check your heat input.",
      keyTerms: [
        { term: "E7018", definition: "Low-hydrogen, all-position structural electrode. The most common stick rod in North American structural work." },
        { term: "E6010", definition: "Fast-freeze cellulosic rod. Used for root passes on pipe and outdoor work." },
        { term: "Arc length", definition: "Distance between rod tip and work. ~1 rod-diameter is the rule of thumb. Too long = porosity; too short = sticking." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a stick electrode (E7018, 3.2 mm) and a base-metal plate (A36, 10 mm).", hint: "Default values are fine.", checkDescription: "smaw_electrode + base_metal_plate placed" },
      { instruction: "Add a joint tile set to 'butt' and a position tile set to '1G'.", hint: "Flat groove — easiest position.", checkDescription: "joint_tile(butt) + position_tile(1G) placed" },
      { instruction: "Set parameters: 22 V, 120 A, 4 mm/s travel. Run the evaluator — it should pass.", hint: "HI = 0.80 × 22 × 120 / 4 = 528 J/mm. Reasonable for 10 mm steel.", checkDescription: "evaluator returns pass=true at these parameters" },
    ],
    soloChallenge: {
      prompt: "Find parameters that pass the evaluator on a 6 mm A36 plate, butt joint, 1G position. Heat input should land between 300 and 700 J/mm.",
      successCriteria: "Evaluator returns pass=true with HI in the 300-700 J/mm window.",
      scoringRubric: { correctness: 0.6, time: 0.2, componentCount: 0.2 },
    },
    sandboxStarter: { initialComponents: [{ kind: "smaw_electrode" }, { kind: "base_metal_plate" }, { kind: "joint_tile" }, { kind: "position_tile" }], prompt: "Try cranking amps too high — what does the evaluator say? Now try too-low amps. See the difference." },
    credentialPathway:
      "SMAW is the foundation of the AWS CW structural test. NCCER Welding Level 1 Modules 3-6 cover stick top to bottom.",
  },
  {
    dayNumber: 5,
    slug: "gmaw-mig-basics",
    title: "GMAW (MIG) Basics",
    shortDescription: "Wire feed, gas, trigger — the shop production process.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "GMAW (MIG) is fast. Pull the trigger and wire feeds continuously, gas flows out a cup, an arc strikes when the wire touches the work. Three transfer modes: short-circuit (low heat, thin material), globular (rarely chosen), spray (high heat, thick material, flat/horizontal only). 75% Ar / 25% CO₂ for mild steel; 100% Ar with helium for aluminum; tri-mix for stainless. Today you set up a MIG pass with shielding gas.",
      keyTerms: [
        { term: "Short-circuit transfer", definition: "Low-voltage GMAW where the wire repeatedly touches and arcs. Cool — good for sheet metal and out-of-position." },
        { term: "Spray transfer", definition: "High-voltage continuous metal stream. Hot and productive but flat/horizontal only on plate." },
        { term: "CTWD", definition: "Contact Tip to Work Distance. Affects current — longer CTWD reduces current because the wire heats more in the extension." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a MIG wire spool, a shielding gas tank (Ar75-CO225), and a 6 mm A36 plate.", hint: "Check the gas flow defaults to 15 L/min.", checkDescription: "gmaw_wire_spool + shielding_gas + base_metal_plate placed" },
      { instruction: "Add a butt joint tile and 1G position. Set 22 V, 200 A, 5 mm/s travel.", hint: "These are mid-range GMAW spray-transfer numbers.", checkDescription: "evaluator returns pass=true" },
      { instruction: "Drop gas flow to 5 L/min. Re-run. The evaluator should now flag insufficient shielding.", hint: "Below 10 L/min, atmospheric contamination causes porosity.", checkDescription: "evaluator returns pass=false with gas note" },
    ],
    soloChallenge: {
      prompt: "Build a GMAW WPS for a 3 mm A36 butt joint in 1G. Find parameters that pass without burnthrough.",
      successCriteria: "Evaluator returns pass=true; penetration classification = adequate (not burnthrough or incomplete).",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "gmaw_wire_spool" }, { kind: "shielding_gas", props: { flowLPerMin: 15 } }, { kind: "base_metal_plate", props: { thicknessMm: 6 } }, { kind: "joint_tile" }], prompt: "Try short-circuit-transfer numbers (16-18 V) vs spray (22-28 V). What changes in heat input?" },
    credentialPathway:
      "GMAW is the second exam on the AWS CW structural ticket. Most production fab shops hire for MIG ticket first.",
  },
  {
    dayNumber: 6,
    slug: "fcaw-flux-core",
    title: "FCAW Flux-Cored",
    shortDescription: "MIG's tougher cousin. Self-shielded variants weld in the wind.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "FCAW uses a tubular wire with internal flux. Self-shielded (FCAW-S) needs no external gas — the flux makes its own shielding. Gas-shielded (FCAW-G) adds external CO₂ or Ar/CO₂ for cleaner welds. Deposition rates beat GMAW (more pounds-per-hour). The tradeoff: slag to chip, and on FCAW-S, a less-clean weld appearance. Used heavily on outdoor structural work and bridges.",
      keyTerms: [
        { term: "FCAW-S", definition: "Self-shielded flux-cored. No gas tank. Works in wind. E71T-11, E71T-GS." },
        { term: "FCAW-G", definition: "Gas-shielded flux-cored. Higher quality but needs gas. E71T-1C, E71T-1M." },
        { term: "Deposition rate", definition: "Pounds of weld metal deposited per hour. FCAW typically beats GMAW by 30-50% at the same amps." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an FCAW wire (E71T-1C, gas-shielded by default), shielding gas, and an A36 plate.", hint: "Default is gas-shielded.", checkDescription: "fcaw_wire + shielding_gas + base_metal_plate placed" },
      { instruction: "Set 26 V, 220 A, 6 mm/s. Run the evaluator.", hint: "HI = 0.85 × 26 × 220 / 6 ≈ 810 J/mm — solid number for thicker plate.", checkDescription: "evaluator returns pass=true with HI around 800 J/mm" },
      { instruction: "Switch the FCAW wire to self-shielded (props.selfShielded = true), remove the gas, re-run.", hint: "FCAW-S should still pass — no gas needed.", checkDescription: "evaluator returns pass=true without gas tank" },
    ],
    soloChallenge: {
      prompt: "Build an FCAW pass that lays down >800 J/mm into 12 mm A36 steel, 1G butt. Beat the burnthrough check.",
      successCriteria: "Evaluator passes; penetration adequate (not burnthrough).",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "fcaw_wire" }, { kind: "shielding_gas" }, { kind: "base_metal_plate", props: { thicknessMm: 12 } }], prompt: "Try the same parameters with FCAW-S vs FCAW-G (toggle selfShielded). What note does the evaluator add?" },
    credentialPathway:
      "FCAW is the third structural ticket on AWS CW. Bridge fabricators and ironworkers (Local 482 Austin) hire heavily for FCAW.",
  },
  {
    dayNumber: 7,
    slug: "gtaw-tig-basics",
    title: "GTAW (TIG) Basics",
    shortDescription: "The slowest, cleanest, most-required process for code-quality work.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "GTAW uses a non-consumable tungsten electrode; you feed filler rod by hand with the other hand. Slow. Clean. Used for stainless code work, aluminum, thin material, and any exposed weld where appearance matters (motorcycle frames, food-grade tanks, aircraft). DCEN (negative) for steel/stainless, AC for aluminum (to clean the oxide). Foot pedal controls current — your hands aim, your foot decides heat.",
      keyTerms: [
        { term: "DCEN", definition: "Direct Current Electrode Negative. Most heat in the work, less in the tungsten. Used for steel, stainless, copper." },
        { term: "AC TIG", definition: "Alternating current. Half the cycle cleans aluminum oxide; the other half melts the puddle. Required for aluminum." },
        { term: "Foot pedal", definition: "Variable current control under the welder's foot. Lets you start cold, ramp up, hold, and taper off." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a TIG tungsten (2.4 mm, 2% lanthanated, DCEN), pure Ar shielding gas, and a 3 mm A36 plate.", hint: "TIG efficiency is 0.70 — lowest of the four processes.", checkDescription: "tig_tungsten + shielding_gas + base_metal_plate placed" },
      { instruction: "Set 12 V, 80 A, 1.5 mm/s travel. Run the evaluator.", hint: "HI = 0.70 × 12 × 80 / 1.5 ≈ 448 J/mm — slow but right for thin steel.", checkDescription: "evaluator returns pass=true with HI between 400 and 500 J/mm" },
      { instruction: "Bump amps to 220 (way too high). Re-run. The evaluator should flag amps and likely burnthrough.", hint: "TIG envelope tops out around 200 A.", checkDescription: "evaluator returns pass=false with amperage out-of-range note" },
    ],
    soloChallenge: {
      prompt: "Build a TIG WPS for 1.5 mm stainless 304 in 1G position, butt joint. Stay in spec.",
      successCriteria: "Evaluator passes; penetration adequate (no burnthrough on the thin material).",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "tig_tungsten" }, { kind: "shielding_gas", props: { mixture: "Ar100", flowLPerMin: 12 } }, { kind: "base_metal_plate", props: { material: "304SS", thicknessMm: 1.5 } }], prompt: "Try DCEN on aluminum (won't clean the oxide — the evaluator won't catch this but real welds will look terrible)." },
    credentialPathway:
      "AWS CW for TIG is the highest-paying ticket in most cities. Aerospace and food-grade fabrication shops will not hire without it.",
  },
  {
    dayNumber: 8,
    slug: "joints-and-symbols",
    title: "Joint Types & Weld Symbols",
    shortDescription: "The drawing tells you what to do — if you can read it.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Five basic joint types — butt, lap, tee, corner, edge — cover almost everything. Each accepts certain weld types: butts get groove welds; tees and laps get fillet welds; corners can get either. AWS A2.4 weld symbols compress all the info (process, joint, size, length, other-side requirement) into a small triangle on the drawing. Reading the symbol fast is what separates an apprentice from a journeyman on the shop floor.",
      keyTerms: [
        { term: "Butt joint", definition: "Two pieces meeting edge-to-edge, in the same plane. Gets groove welds." },
        { term: "Tee joint", definition: "One piece perpendicular to another. Gets fillet welds — sometimes both sides." },
        { term: "Weld symbol triangle", definition: "AWS A2.4 standard. The reference line, an arrow, and any other-side info above the line." },
      ],
    },
    guidedSteps: [
      { instruction: "Place one joint tile of each type (set the jointType prop): butt, lap, tee, corner.", hint: "You can place multiple joint_tile components with different props.", checkDescription: "4 joint_tile components placed with different jointType props" },
      { instruction: "Add a weld symbol tile. Inspect to see the symbol structure.", hint: "Arrow side below the reference line; other side above.", checkDescription: "weld_symbol placed and inspected" },
      { instruction: "Match symbol: 'fillet weld, 5 mm leg, both sides, all around.' →", hint: "Triangle below AND above the reference line + circle at the bend.", checkDescription: "learner identifies the symbol elements" },
    ],
    soloChallenge: {
      prompt: "A drawing shows a tee joint with a 6 mm fillet symbol on the arrow side only. Describe in words exactly what the welder should produce.",
      successCriteria: "One 6 mm fillet weld on the side the arrow points to; no weld on the opposite side; weld runs the length shown.",
      scoringRubric: { correctness: 0.9, time: 0.1, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [{ kind: "joint_tile" }, { kind: "weld_symbol" }], prompt: "For each of the five joint types, build the matching weld symbol on the canvas using labels." },
    credentialPathway:
      "Weld symbol reading is on every AWS exam. ACC's Welding Print Reading course is built around AWS A2.4.",
  },
  {
    dayNumber: 9,
    slug: "fillet-welds",
    title: "Fillet Welds — Sizing & Inspection",
    shortDescription: "AWS D1.1 §5.7 — the table every structural welder knows by heart.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "A fillet weld is the triangular bead at the joint between two perpendicular pieces. Its size is the leg length — the side of the triangle. AWS D1.1 Table 5.7 sets minimum leg size based on the thickness of the thinner part: 3 mm for ≤6 mm base, 5 mm for 6-13 mm, 6 mm for 13-19 mm, 8 mm above. Undersize and the weld fails inspection — every time. Today the evaluator enforces that.",
      keyTerms: [
        { term: "Leg size", definition: "Length of the fillet weld's triangular side touching one of the joined pieces." },
        { term: "Throat", definition: "The shortest distance from the weld root to the face of the bead. Cross-sectional strength comes from throat." },
        { term: "AWS D1.1", definition: "Structural Welding Code — Steel. The bible of structural welding in the U.S." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a stick electrode, A36 plate (10 mm), tee joint tile, position 2F, and a fillet bead with leg = 4 mm.", hint: "10 mm base → AWS minimum is 5 mm. Your 4 mm bead is undersize.", checkDescription: "smaw_electrode + base_metal_plate + joint_tile(tee) + fillet_bead(legMm:4) placed" },
      { instruction: "Set parameters: 22 V, 130 A, 4 mm/s. Run evaluator.", hint: "The evaluator should pass on heat input but flag the undersize fillet.", checkDescription: "evaluator returns pass=false with AWS D1.1 leg-size note" },
      { instruction: "Bump the fillet leg to 5 mm. Re-run.", hint: "Now you're at the AWS minimum.", checkDescription: "evaluator returns pass=true" },
    ],
    soloChallenge: {
      prompt: "Build a passing tee-joint fillet weld on 16 mm A36, 2F position. Pick the leg size and parameters.",
      successCriteria: "Leg ≥ 6 mm (AWS minimum for 13-19 mm base); evaluator passes overall.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "smaw_electrode" }, { kind: "base_metal_plate", props: { thicknessMm: 16 } }, { kind: "joint_tile", props: { jointType: "tee" } }, { kind: "fillet_bead", props: { legMm: 6 } }], prompt: "Try a 3 mm leg on 16 mm steel. The evaluator will fail it. Now try 8 mm — overkill but passes." },
    credentialPathway:
      "AWS D1.1 §5.7 is on every structural welder qualification record. The 2F and 3F fillet test plates are the most common practical exams.",
  },
  {
    dayNumber: 10,
    slug: "groove-welds-and-passes",
    title: "Groove Welds & Multi-Pass",
    shortDescription: "Root, hot pass, fill, cap — how thick joints get done.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "Thick material can't be welded in one pass — the puddle's too big, the heat sinks too fast, and you'd get incomplete penetration in the middle. So you grind a groove between the pieces (V, double-V, J, U), then fill it in passes: root pass establishes the bottom; hot pass burns out slag; fill passes add metal; cap pass dresses the top. Each pass has its own heat input target. Today you build a multi-pass groove on 12 mm steel.",
      keyTerms: [
        { term: "Root pass", definition: "First weld bead at the bottom of the groove. Must fuse both sides completely." },
        { term: "Backing strip", definition: "Strip of base metal placed behind the root to support the puddle. Allows fuller penetration without burnthrough." },
        { term: "Root gap", definition: "Distance between the two pieces at the bottom of the groove. Typically 2-3 mm." },
      ],
    },
    guidedSteps: [
      { instruction: "Place an SMAW electrode, 12 mm A36 plate, butt joint, position 1G, groove bead (60° angle, 2 mm root gap, 3 passes), and a backing strip.", hint: "Default groove props are fine.", checkDescription: "smaw_electrode + base_metal_plate(12mm) + joint_tile(butt) + groove_bead + backing_strip placed" },
      { instruction: "Set parameters for the root pass: 22 V, 110 A (lower than fill), 3 mm/s travel.", hint: "Roots run cooler to avoid burnthrough.", checkDescription: "evaluator returns pass=true at root pass parameters" },
      { instruction: "Now adjust to fill-pass parameters: 24 V, 150 A, 4 mm/s. Re-run.", hint: "Fill passes are hotter and faster — more deposition per pass.", checkDescription: "evaluator returns pass=true at fill pass parameters" },
    ],
    soloChallenge: {
      prompt: "Build a 5-pass groove weld plan for 19 mm A36 in 1G. State the heat input target for the root and for the fill passes (in J/mm).",
      successCriteria: "Root HI ~400-600 J/mm; fill HI ~700-1200 J/mm. Reasoning shows root cooler than fill.",
      scoringRubric: { correctness: 0.7, time: 0.2, componentCount: 0.1 },
    },
    sandboxStarter: { initialComponents: [{ kind: "smaw_electrode" }, { kind: "base_metal_plate", props: { thicknessMm: 19 } }, { kind: "joint_tile" }, { kind: "groove_bead", props: { passes: 5 } }, { kind: "backing_strip" }], prompt: "Walk each pass at different parameters. Notice how root + cap are usually cooler than the fill passes in between." },
    credentialPathway:
      "Multi-pass groove welds are the practical for the AWS D1.1 unlimited-thickness ticket. NCCER Welding Level 2 walks this exact sequence.",
  },
  {
    dayNumber: 11,
    slug: "distortion-and-stress",
    title: "Distortion & Residual Stress",
    shortDescription: "Why your perfect weld pulls the plate into a U-shape.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Every weld shrinks as it cools. That shrinkage pulls the surrounding material — and if you're not strategic, your flat plate becomes a curl. Three distortion modes: transverse (across the weld), longitudinal (along), and angular (the plates fold toward each other). Combat with tack welding, backstep welding, balanced passes (alternating sides), preheat, or fixturing/clamping. The veterans on the shop floor don't bend material straight — they prevent the bend.",
      keyTerms: [
        { term: "Transverse shrinkage", definition: "Across the weld — narrows the gap. The classic 'plates pull together' effect." },
        { term: "Angular distortion", definition: "The plates fold toward each other, hinging on the weld root. Common on single-V grooves." },
        { term: "Backstep technique", definition: "Welding in short forward-then-backward sequences. Spreads heat input over time, reduces distortion." },
      ],
    },
    guidedSteps: [
      { instruction: "Identify which distortion mode dominates: 'single-V butt groove, no backing, welded in one pass.' →", hint: "Heat unbalanced toward one side — folds the plates together.", checkDescription: "learner selects angular distortion" },
      { instruction: "List 3 strategies to control distortion on a long welded seam.", hint: "Tacks, backstep, alternating sides, preheat, fixturing.", checkDescription: "learner names 3+ strategies" },
      { instruction: "Identify what backing strips do for distortion.", hint: "They also support the root — but also act as heat sinks.", checkDescription: "learner notes 'supports root + acts as heat sink, reducing angular distortion'" },
    ],
    soloChallenge: {
      prompt: "A 4-foot long tee joint is welded continuously from one end. After cooling, the long plate is bowed. Pick the most likely distortion mode and one prevention strategy.",
      successCriteria: "Longitudinal distortion (along the weld); use backstep welding or alternate sides.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Draft a welding sequence on the canvas for a 4-foot tee joint that minimizes distortion. Mark each pass and its direction." },
    credentialPathway:
      "Distortion control is a journeyman skill — covered in NCCER Welding Level 3 and ASME Section IX for code work.",
  },
  {
    dayNumber: 12,
    slug: "codes-and-qualification",
    title: "Codes (AWS D1.1) & Welder Qualification",
    shortDescription: "How welders get tested, and what 'qualified' means on a structural job.",
    engineMode: "concept-only",
    concept: {
      blurb:
        "Structural welding in the U.S. follows AWS D1.1 — the code that says how welds must be made, inspected, and documented. A WPS (Welding Procedure Specification) describes the approved parameters for a specific joint. A welder gets qualified by passing a test plate to that WPS. Qualification is position- and thickness-limited: pass a 2F test on 10 mm and you can weld 2F and 1F up to 19 mm — but not 3F (vertical) or thicker plate. Code work demands paper. Track everything.",
      keyTerms: [
        { term: "WPS", definition: "Welding Procedure Specification — the document listing approved parameters." },
        { term: "PQR", definition: "Procedure Qualification Record — the test results proving a WPS produces sound welds." },
        { term: "WPQR", definition: "Welder Performance Qualification Record — proves an individual welder can execute a given WPS." },
      ],
    },
    guidedSteps: [
      { instruction: "Match the document: 'tells the welder what V, I, travel speed to use' →", hint: "Procedure level.", checkDescription: "learner selects WPS" },
      { instruction: "Match the document: 'proves welder John passed the 2G test plate' →", hint: "Performance level.", checkDescription: "learner selects WPQR" },
      { instruction: "Identify what happens when a welder passes a 3G test plate (qualifies for 3G + which other positions?).", hint: "3G qualifies the welder for 1G, 2G, and 3G — vertical includes flat and horizontal.", checkDescription: "learner names 1G+2G+3G" },
    ],
    soloChallenge: {
      prompt: "A welder needs to qualify for all groove positions on plate up to 25 mm thick. What single test plate qualifies them for the most positions?",
      successCriteria: "4G test on plate ≥ 19 mm (or 6G on pipe) qualifies all positions — the hardest test covers the easiest.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "On the canvas, build the qualification matrix: which test position qualifies the welder for which production positions?" },
    credentialPathway:
      "AWS CW + WPQR is the entry credential at any structural shop. Boilermakers, ironworkers, and pipe-fitters add ASME Section IX on top.",
  },
  {
    dayNumber: 13,
    slug: "inspection-visual-and-ndt",
    title: "Visual & NDT Inspection",
    shortDescription: "How a CWI looks at your weld and says 'good' or 'cut it out.'",
    engineMode: "concept-only",
    concept: {
      blurb:
        "A Certified Welding Inspector (CWI) starts with visual inspection: bead profile, undercut, cracks, porosity at the surface, leg size on fillets. About 80% of rejects are caught visually. For the other 20%, NDT methods take over: magnetic-particle (MT) for surface and near-surface cracks in ferrous metals, dye penetrant (PT) for surface defects on any metal, ultrasonic (UT) for internal defects, radiographic (RT) for internal defects on critical work. Each test has its own acceptance criteria in AWS D1.1 §6.",
      keyTerms: [
        { term: "Undercut", definition: "Groove melted into the base metal alongside the weld bead — stress riser, often rejectable." },
        { term: "Porosity", definition: "Trapped gas bubbles in the weld. Single pore may be acceptable; clusters are not." },
        { term: "RT (radiographic testing)", definition: "X-ray of the weld. Required on high-pressure piping and critical structural code work." },
      ],
    },
    guidedSteps: [
      { instruction: "List the four NDT methods most common in structural welding.", hint: "VT, PT, MT, UT, RT.", checkDescription: "learner names 4+ methods" },
      { instruction: "Match defect to method: 'subsurface crack in a steel plate' →", hint: "MT catches near-surface; UT or RT catches deeper.", checkDescription: "learner selects UT or RT" },
      { instruction: "Identify which defect is almost always a reject under D1.1.", hint: "Cracks. No transverse cracks of any length are allowed.", checkDescription: "learner names cracks as auto-reject" },
    ],
    soloChallenge: {
      prompt: "A 12 mm structural butt weld shows a 1 mm-deep undercut along 50 mm of the toe. Acceptable under D1.1 or reject?",
      successCriteria: "Reject — D1.1 §6 limits undercut to 1 mm depth max but only in short discontinuous lengths; a 50 mm run is excessive.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [], prompt: "Build a defect-vs-method matrix on the canvas. For each common defect, mark which NDT method best detects it." },
    credentialPathway:
      "CWI is its own AWS certification — 5 years of experience required, but pays $80-120K. CWE (Educator) and SCWI (Senior) come after.",
  },
  {
    dayNumber: 14,
    slug: "troubleshooting-defects",
    title: "Troubleshooting: Porosity, Undercut, Lack of Fusion",
    shortDescription: "Three defects, three root-cause clusters. Diagnose like a pro.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "Three defects cause most rejects. Porosity = atmospheric contamination (wrong gas, low flow, dirty metal, wet rods). Undercut = too much heat at the toe (too much amperage, too long an arc, wrong angle). Lack of fusion = not enough heat OR wrong angle (sometimes both). Today the evaluator helps you produce each defect on purpose, then fix it. The fastest way to learn what 'good' looks like is to make 'bad' and adjust.",
      keyTerms: [
        { term: "Porosity", definition: "Gas bubbles trapped in the weld. Atmospheric contamination from missing gas, low gas flow, or moisture." },
        { term: "Undercut", definition: "Melted groove alongside the weld bead. Excessive heat at the toe of the weld." },
        { term: "Lack of fusion", definition: "Weld metal didn't fully bond to base metal or to a prior pass. Insufficient heat input or poor technique." },
      ],
    },
    guidedSteps: [
      { instruction: "Place a GMAW wire and shielding gas at flow=4 L/min (too low). 6 mm A36 plate, butt joint.", hint: "Gas under 10 L/min = insufficient shielding.", checkDescription: "gmaw_wire_spool + shielding_gas(flowLPerMin:4) + base_metal_plate + joint_tile placed" },
      { instruction: "Set 22 V, 200 A, 5 mm/s. Run. The evaluator should flag the gas problem.", hint: "Insufficient shielding → atmospheric pickup → porosity in real life.", checkDescription: "evaluator returns pass=false with shielding-gas note" },
      { instruction: "Bump gas flow to 15 L/min. Re-run.", hint: "Now the porosity-root-cause is fixed.", checkDescription: "evaluator returns pass=true" },
    ],
    soloChallenge: {
      prompt: "An apprentice's weld shows undercut along the toe. They were using 250 A on a 6 mm A36 plate with E7018 stick. Diagnose and prescribe a fix.",
      successCriteria: "Too much amperage for the rod and plate — drop amps to 120-140 A range and shorten arc length.",
      scoringRubric: { correctness: 0.85, time: 0.15, componentCount: 0 },
    },
    sandboxStarter: { initialComponents: [{ kind: "smaw_electrode" }, { kind: "base_metal_plate" }, { kind: "joint_tile" }], prompt: "Try to produce each defect on purpose: porosity by wrong gas, undercut by over-amperage, lack-of-fusion by under-amperage with fast travel. Then fix each." },
    credentialPathway:
      "Defect diagnosis is what separates a journeyman from an apprentice on the shop floor. AWS CW practical tests look exactly for this skill.",
  },
  {
    dayNumber: 15,
    slug: "capstone-build-a-wps",
    title: "Capstone: Develop a WPS for a Real Joint",
    shortDescription: "Pull everything together. Write the procedure that qualifies the job.",
    engineMode: "heat-input",
    concept: {
      blurb:
        "A WPS (Welding Procedure Specification) is the document that ties together everything you've learned: process, joint, base metal, position, parameters, shielding gas, technique. Today you'll receive a job spec — a real-world joint that needs welding — and you'll write a one-page WPS that the evaluator certifies. Pass this and you're ready to sit for the AWS CW practical.",
      keyTerms: [
        { term: "Essential variables", definition: "Parameters in a WPS that, if changed, require re-qualification — process, position, base metal, filler classification, thickness range." },
        { term: "Range qualification", definition: "A WPS qualifies a range, not a single value — e.g., 'V = 18-26' rather than 'V = 22.'" },
        { term: "Sign-off", definition: "A qualified WPS is signed by the welding engineer and the responsible CWI. No production work without a signed WPS in the file." },
      ],
    },
    guidedSteps: [
      { instruction: "Read the job spec: 'A36 mild steel, 12 mm thick, 2G butt groove joint, structural application.' Place a base-metal plate at 12 mm.", hint: "12 mm is heavy enough to need a groove + multi-pass.", checkDescription: "base_metal_plate(12mm) placed" },
      { instruction: "Choose process and consumable. Justify in a sentence (in your head — the rubric checks the choice).", hint: "GMAW or FCAW for production speed; SMAW if field/portable.", checkDescription: "any consumable component placed alongside" },
      { instruction: "Add groove_bead, backing_strip, joint_tile(butt), position_tile(2G), shielding gas (if applicable).", hint: "Everything a WPS line item would have.", checkDescription: "groove_bead + joint_tile(butt) + position_tile(2G) placed" },
      { instruction: "Set parameters and run the evaluator. The capstone passes when evaluator returns pass=true with score ≥ 0.8.", hint: "Aim for HI 600-1000 J/mm on root, slightly higher on fill.", checkDescription: "evaluator returns pass=true with score >= 0.8" },
    ],
    soloChallenge: {
      prompt: "A bridge contractor needs a WPS for 25 mm A36 plate, 1G groove, FCAW process. Build it and pass the evaluator.",
      successCriteria: "Evaluator passes; HI in the 800-1500 J/mm range; no penetration warnings; gas flow in spec.",
      scoringRubric: { correctness: 0.6, time: 0.15, componentCount: 0.25 },
    },
    sandboxStarter: { initialComponents: [{ kind: "fcaw_wire" }, { kind: "shielding_gas" }, { kind: "base_metal_plate", props: { thicknessMm: 25 } }, { kind: "joint_tile" }, { kind: "groove_bead", props: { passes: 7 } }, { kind: "backing_strip" }, { kind: "position_tile", props: { position: "1G" } }], prompt: "Write the WPS in the comments — process, joint, base, position, parameters, gas, technique. Then run the evaluator until it passes at ≥ 0.8 score." },
    credentialPathway:
      "This capstone is the same one ACC's Welding AAS uses to graduate students into the AWS Certified Welder practical. Pass it here, walk into the testing center, do it once on real steel, and you're certified.",
  },
];
