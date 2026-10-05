/** Merged human classification lanes (Phase 2b–2e). Each lane file is one hub; the generator merges them over the draft. */
import type { RouteClassificationLane } from "./route-registry.types";
import { LANE_GET_HELP } from "./route-registry/lane-get-help";
import { LANE_LEARN_WORK } from "./route-registry/lane-learn-work";
import { LANE_CONNECT_FUND_DATA } from "./route-registry/lane-connect-fund-data";
import { LANE_OPERATE } from "./route-registry/lane-operate";
import { OUTCOME_LANDINGS, type PublicOutcome } from "./outcome-landings";
import { AUDIENCES } from "./route-registry.types";

const LANDINGS: RouteClassificationLane = Object.fromEntries(
  (Object.entries(OUTCOME_LANDINGS) as Array<[PublicOutcome, typeof OUTCOME_LANDINGS[PublicOutcome]]>).map(([outcome, landing]) => [
    `/start/${outcome}`, {
      title: `${landing.title}: starting points`, outcome, access: "public",
      audiences: [...AUDIENCES], description: landing.description, upstream: ["/"],
      downstream: [...landing.actions],
      guide: `Need ${landing.title.toLowerCase()} → choose a starting point → open a tool or inspect the community evidence`,
    },
  ]),
);

export const ROUTE_CLASSIFICATIONS: RouteClassificationLane = {
  ...LANE_GET_HELP, ...LANE_LEARN_WORK, ...LANE_CONNECT_FUND_DATA, ...LANE_OPERATE,
  ...LANDINGS,
};
