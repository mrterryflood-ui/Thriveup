import { searchResources, type StateResource } from "./resource-engine";

export type ResourceVerificationStatus = "source-listed" | "partner-verified" | "needs-verification";
export type ResourceAvailabilityStatus = "unknown" | "accepting-referrals" | "not-accepting-referrals";
export type CoordinateQuality = "none" | "approximate-centroid";

export interface CanonicalGeographyNode {
  id: string;
  type: "state" | "county" | "place" | "zip" | "tract";
  label: string;
  stateCode: string | null;
  geometry: null;
  geometryStatus: "not-loaded";
  coordinateQuality: CoordinateQuality;
  center: { lat: number; lng: number } | null;
  source: string;
  sourceYear: number | null;
}

export interface CanonicalResourceNode {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  url: string;
  phone: string | null;
  eligibility: string | null;
  stateCode: string;
  verificationStatus: ResourceVerificationStatus;
  availabilityStatus: ResourceAvailabilityStatus;
  lastVerifiedAt: null;
  freshness: "unknown";
  source: {
    type: "state-resource-catalog";
    label: string;
  };
}

export interface CanonicalResourceGeographyEdge {
  resourceId: string;
  geographyId: string;
  relationship: "covers";
  coverageConfidence: "catalog-state";
}

export interface CanonicalResourceGraph {
  contractVersion: "1.0";
  generatedAt: string;
  geography: CanonicalGeographyNode;
  resources: CanonicalResourceNode[];
  edges: CanonicalResourceGeographyEdge[];
  disclosures: string[];
}

function stableResourceId(resource: StateResource): string {
  const normalized = `${resource.stateCode}:${resource.category}:${resource.subcategory}:${resource.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `resource:${normalized}`;
}

export function buildCanonicalResourceGraph(stateCode: string): CanonicalResourceGraph {
  const normalizedState = stateCode.toUpperCase();
  const resources = searchResources({
    stateCode: normalizedState,
    categories: [],
    limit: 50,
  }).map((resource): CanonicalResourceNode => ({
    id: stableResourceId(resource),
    name: resource.name,
    category: resource.category,
    subcategory: resource.subcategory,
    description: resource.description,
    url: resource.url,
    phone: resource.phone ?? null,
    eligibility: resource.eligibility ?? null,
    stateCode: normalizedState,
    verificationStatus: "source-listed",
    availabilityStatus: "unknown",
    lastVerifiedAt: null,
    freshness: "unknown",
    source: {
      type: "state-resource-catalog",
      label: "State and federal resource catalog",
    },
  }));

  const geographyId = `state:${normalizedState.toLowerCase()}`;
  return {
    contractVersion: "1.0",
    generatedAt: new Date().toISOString(),
    geography: {
      id: geographyId,
      type: "state",
      label: normalizedState,
      stateCode: normalizedState,
      geometry: null,
      geometryStatus: "not-loaded",
      coordinateQuality: "none",
      center: null,
      source: "state-resource-catalog",
      sourceYear: null,
    },
    resources,
    edges: resources.map((resource) => ({
      resourceId: resource.id,
      geographyId,
      relationship: "covers",
      coverageConfidence: "catalog-state",
    })),
    disclosures: [
      "Resources are source-listed records, not partner-confirmed referrals.",
      "Availability and capacity are unknown until a provider or authoritative feed confirms them.",
      "State coverage is the only geography relationship represented in this contract.",
      "Boundary geometry is not loaded in this slice; no map hotspot or boundary claim is made.",
    ],
  };
}