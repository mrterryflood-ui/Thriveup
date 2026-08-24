export const IMPACT_CHAIN_STAGES = [
  "condition", "evidence", "intervention", "action", "implementation", "outcome", "learning",
] as const;

export type ImpactChainStage = typeof IMPACT_CHAIN_STAGES[number];
export type ImpactClaimStatus = "observed" | "modeled" | "recommended" | "not_connected";
export type ImpactPrivacyBoundary = "public" | "aggregate" | "organization" | "case";

export interface ImpactChainLink {
  id: string;
  stage: ImpactChainStage;
  title: string;
  status: ImpactClaimStatus;
  recordId: string | null;
  source: string | null;
  citation: string | null;
  responsibleOrganization: string | null;
  privacyBoundary: ImpactPrivacyBoundary;
  confidence: "strong" | "moderate" | "emerging" | "unknown";
  connected: boolean;
  nextAction: string | null;
}

export interface ImpactChainContract {
  version: "1.0";
  scenarioId: number;
  geography: string;
  links: ImpactChainLink[];
  complete: boolean;
  missingStages: ImpactChainStage[];
  disclosure: string;
}