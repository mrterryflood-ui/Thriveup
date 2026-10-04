/**
 * Route registry schema — the single source every navigation reader will
 * collapse into (focused sidebar, legacy sidebar, command palette, /tools,
 * per-page frame). Phase 2 generates the draft; Phase 3 makes it the authority.
 *
 * Two orthogonal axes: OUTCOME is primary navigation; AUDIENCE is context.
 * "community" is an audience word only — the data outcome is "see-the-data".
 */
export const OUTCOMES = ["get-help", "learn", "work-earn", "connect", "fund", "see-the-data", "operate"] as const;
export type Outcome = typeof OUTCOMES[number];
export const OUTCOME_LABELS: Record<Outcome, string> = {
  "get-help": "Get Help", learn: "Learn", "work-earn": "Work & Earn", connect: "Connect",
  fund: "Fund", "see-the-data": "See the Data", operate: "Operate (staff & admin)",
};

export const AUDIENCES = ["resident-family", "students-youth", "foster-youth", "veterans", "returning-citizens", "caregivers-chws", "nonprofit-cbo", "agency-government", "funder-evaluator", "rural-farm"] as const;
export type Audience = typeof AUDIENCES[number];
export const AUDIENCE_LABELS: Record<Audience, string> = {
  "resident-family": "Residents & families", "students-youth": "Students & youth", "foster-youth": "Foster youth", veterans: "Veterans",
  "returning-citizens": "Returning citizens", "caregivers-chws": "Caregivers & CHWs", "nonprofit-cbo": "Nonprofits & CBOs",
  "agency-government": "Agencies & government", "funder-evaluator": "Funders & evaluators", "rural-farm": "Rural & farm communities",
};
/** Existing 4 workspaces are audience GROUPS; the 10 audiences nest under them. */
export const WORKSPACE_AUDIENCES = {
  residents: ["resident-family", "students-youth", "foster-youth", "veterans", "returning-citizens", "rural-farm"],
  organizations: ["caregivers-chws", "nonprofit-cbo"],
  funders: ["funder-evaluator"],
  community: ["agency-government"],
} as const satisfies Record<string, readonly Audience[]>;

export type Access = "public" | "authenticated" | "staff" | "admin";
export type RegistrySource = "app-routes" | "legacy-sidebar" | "command-palette" | "workspace-catalog";

export interface RouteEntry {
  /** Route path as declared in App.tsx (may contain :params). */
  path: string;
  title: string;
  outcome: Outcome;
  audiences: Audience[];
  access: Access;
  /** Where the user usually comes from (paths) — the "upstream need". */
  upstream: string[];
  /** Where this page sends people next (paths) — the "downstream action". */
  downstream: string[];
  /** Legacy hub / group label the draft was inferred from, kept for audit. */
  legacyGroup?: string;
  /** Which inventories mention this path. */
  sources: RegistrySource[];
  /** false until a human classifies the generated draft row. */
  classified: boolean;
  /** If the path is only an alias/redirect of another canonical path. */
  aliasOf?: string;
  /** One sentence, plain language, what the person can do here (no superlatives). */
  description?: string;
  /** Guide line for the page frame: the upstream need → this page → next action. */
  guide?: string;
}

/** Human classification override for one route (merged over the generated draft by the generator). */
export type RouteClassification = Partial<Pick<RouteEntry, "title" | "outcome" | "audiences" | "access" | "upstream" | "downstream" | "aliasOf" | "description" | "guide">>;
export type RouteClassificationLane = Record<string, RouteClassification>;
