import type { Outcome } from "./route-registry.types";

export type PublicOutcome = Exclude<Outcome, "operate">;
export interface OutcomeLanding {
  title: string;
  description: string;
  actions: readonly string[];
}
export const OUTCOME_LANDINGS: Record<PublicOutcome, OutcomeLanding> = {
  "get-help": { title: "Get Help", description: "Find support, check eligibility, and choose your next step without repeating your story.", actions: ["/get-help", "/benefits-screener", "/resource-directory"] },
  learn: { title: "Learn", description: "Explore lessons and practical activities, then continue into a learning pathway.", actions: ["/academy", "/curriculum", "/module-1-2-tools"] },
  "work-earn": { title: "Work & Earn", description: "Explore work, practice a trade, and translate your experience into a training pathway.", actions: ["/workforce", "/academy/trade-sims", "/mos-translator"] },
  connect: { title: "Connect", description: "See who is doing the work, find community partners, and coordinate around shared needs.", actions: ["/community-gravity", "/partners", "/for-nonprofits"] },
  fund: { title: "Fund", description: "Understand community priorities and available funding guidance before preparing a proposal.", actions: ["/community-banks", "/community-story-pack", "/hub/fund"] },
  "see-the-data": { title: "See the Data", description: "Inspect geographic evidence, sources, methods, and the limits of what the data can tell you.", actions: ["/community-analysis", "/equity-loss", "/methodology"] },
};
// /outcomes is a pre-existing staff report; do not inherit or weaken its legacy access boundary.
export const outcomeLandingPath = (outcome: PublicOutcome) => `/start/${outcome}`;