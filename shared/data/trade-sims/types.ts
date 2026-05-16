/**
 * Shared types for the Trade Sims engine.
 *
 * Each trade (electrical, plumbing, HVAC, welding, automotive, …) has its own
 * lesson data file, its own physics solver, and its own component library.
 * The schema (trade_sims_* tables) and backend routes (/api/trade-sims/*) are
 * already trade-agnostic — they key off `tradeSlug` and never need to change
 * to add a new trade.
 *
 * The one thing every trade MUST share is the `LessonEngineMode` union, which
 * tells the lesson player UI which simulator to mount for any given lesson.
 * To keep parallel-developed trades from conflicting on this union, the source
 * of truth lives here and every trade's lesson data file imports it.
 */

export type LessonEngineMode =
  // Electrical (Days 1-2, 4-6, 14-15) and Automotive (car-electrical days).
  // Backed by the Modified Nodal Analysis solver in
  // `client/src/lib/trade-sims/electrical/circuit-solver.ts`.
  | "linear-dc"
  // Any walkthrough lesson where the solver does NOT run. Used heavily for
  // AC theory, transistors, gates, microcontrollers, safety, schematic
  // reading, code, joint design, diagnostic procedure, etc. The player should
  // present concept + guided steps + sandbox without running a simulator.
  | "concept-only"
  // Plumbing pipe-network flow (Hardy-Cross loop iteration). Returns flow per
  // pipe and pressure per junction.
  | "pipe-network"
  // HVAC steady-state heat-balance. Returns temperatures + airflow per zone.
  | "thermal-airflow"
  // Welding parameter calculator (heat input = V × I × 60 / travel-speed) and
  // joint-strength evaluator. Not a continuous-simulation engine — it's a
  // numerical evaluator the player runs against the learner's settings.
  | "heat-input";

/** Trade meta shared by every trade's lesson data file. */
export interface TradeMeta {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  iconKey: string;
  displayOrder: number;
}
