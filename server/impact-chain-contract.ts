import type {
  ChainwebCalculation, ChainwebNarrative, ChainwebNode, ChainwebScenario,
} from "@shared/schema";
import {
  IMPACT_CHAIN_STAGES,
  type ImpactChainContract,
  type ImpactChainLink,
} from "@shared/impact-chain";

export function assembleImpactChain(input: {
  scenario: ChainwebScenario;
  nodes: ChainwebNode[];
  calculation: ChainwebCalculation | null;
  narratives: ChainwebNarrative[];
}): ImpactChainContract {
  const { scenario, nodes, calculation, narratives } = input;
  const evidenceNodes = nodes.filter((node) => !node.isEntryNode && Boolean(node.dataSource || node.citation));
  const links: ImpactChainLink[] = [
    {
      id: `condition:${scenario.id}`, stage: "condition",
      title: `${scenario.entryDomain.replace(/_/g, " ")} conditions in ${scenario.geographyLabel}`,
      status: "recommended", recordId: String(scenario.id),
      source: scenario.populationProfile ? "User-supplied community profile" : "User-defined scenario",
      citation: null, responsibleOrganization: null, privacyBoundary: "organization",
      confidence: "unknown", connected: true,
      nextAction: "Review the evidence used to define the condition.",
    },
    ...evidenceNodes.map((node): ImpactChainLink => ({
      id: `evidence:${node.id}`, stage: "evidence", title: node.label, status: "modeled",
      recordId: String(node.id), source: node.dataSource, citation: node.citation,
      responsibleOrganization: null, privacyBoundary: "aggregate", confidence: "moderate",
      connected: true, nextAction: "Confirm local fit and implementation relevance.",
    })),
    {
      id: `intervention:${scenario.id}`, stage: "intervention", title: scenario.interventionName,
      status: "recommended", recordId: String(scenario.id), source: "Chainweb scenario",
      citation: null, responsibleOrganization: null, privacyBoundary: "organization",
      confidence: evidenceNodes.length ? "moderate" : "emerging", connected: true,
      nextAction: "Assign an accountable organization and authorize the action.",
    },
    {
      id: `action:${scenario.id}`, stage: "action", title: "Organization action or coordinated referral",
      status: "not_connected", recordId: null, source: null, citation: null,
      responsibleOrganization: null, privacyBoundary: "case", confidence: "unknown",
      connected: false, nextAction: "Connect an authorized referral, service, or organizational action record.",
    },
    {
      id: `implementation:${scenario.id}`, stage: "implementation", title: "Implementation and fidelity record",
      status: "not_connected", recordId: null, source: null, citation: null,
      responsibleOrganization: null, privacyBoundary: "organization", confidence: "unknown",
      connected: false, nextAction: "Connect readiness, fidelity, dosage, and adaptation records.",
    },
    {
      id: `outcome:${scenario.id}`, stage: "outcome",
      title: calculation ? "Anticipated cross-domain results" : "Measured or anticipated result",
      status: calculation ? "modeled" : "not_connected", recordId: calculation ? String(calculation.id) : null,
      source: calculation ? "Chainweb ROI calculation" : null, citation: null,
      responsibleOrganization: null, privacyBoundary: "aggregate",
      confidence: calculation ? "emerging" : "unknown", connected: Boolean(calculation),
      nextAction: calculation ? "Compare modeled results with observed outcome records over time." : "Calculate the scenario or connect an observed outcome record.",
    },
    {
      id: `learning:${scenario.id}`, stage: "learning", title: "Continuous learning decision",
      status: "not_connected", recordId: null,
      source: narratives.length ? "Narrative exists, but no adaptation or learning decision is recorded" : null,
      citation: null, responsibleOrganization: null, privacyBoundary: "organization",
      confidence: "unknown", connected: false,
      nextAction: "Record what changed, what was learned, and the next authorized adaptation.",
    },
  ];
  const presentStages = new Set(links.filter((link) => link.connected).map((link) => link.stage));
  const missingStages = IMPACT_CHAIN_STAGES.filter((stage) => !presentStages.has(stage));
  return {
    version: "1.0", scenarioId: scenario.id, geography: scenario.geographyLabel, links,
    complete: missingStages.length === 0, missingStages,
    disclosure: "Observed data, modeled estimates, and recommendations are labeled separately. A connected link does not prove causation.",
  };
}