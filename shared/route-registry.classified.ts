/** Merged human classification lanes (Phase 2b–2e). Each lane file is one hub; the generator merges them over the draft. */
import type { RouteClassificationLane } from "./route-registry.types";
import { LANE_GET_HELP } from "./route-registry/lane-get-help";
import { LANE_LEARN_WORK } from "./route-registry/lane-learn-work";
import { LANE_CONNECT_FUND_DATA } from "./route-registry/lane-connect-fund-data";
import { LANE_OPERATE } from "./route-registry/lane-operate";

export const ROUTE_CLASSIFICATIONS: RouteClassificationLane = {
  ...LANE_GET_HELP, ...LANE_LEARN_WORK, ...LANE_CONNECT_FUND_DATA, ...LANE_OPERATE,
};
