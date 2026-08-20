import { searchResources, type StateResource } from "./resource-engine";

export type ResourceVerificationStatus = "source-listed" | "partner-verified" | "needs-verification";
export type ResourceAvailabilityStatus = "unknown" | "accepting-referrals" | "not-accepting-referrals";
export type CoordinateQuality = "none" | "approximate-centroid";
export type ResourceCoverageScope = "state" | "national";

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
  coverageScope: ResourceCoverageScope;
  verificationStatus: ResourceVerificationStatus;
  availabilityStatus: ResourceAvailabilityStatus;
  lastVerifiedAt: null;
  freshness: "unknown";
  source: {
    type: "state-resource-catalog" | "federal-resource-catalog";
    label: string;
  };
}

export interface CanonicalResourceGeographyEdge {
  resourceId: string;
  geographyId: string;
  relationship: "covers";
  coverageConfidence: "catalog-state" | "catalog-national";
}

export interface CanonicalResourceGraph {
  contractVersion: "1.0";
  generatedAt: string;
  geography: CanonicalGeographyNode;
  geographies: CanonicalGeographyNode[];
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
    stateCode: resource.stateCode === "US" ? "US" : normalizedState,
    coverageScope: resource.stateCode === "US" ? "national" : "state",
    verificationStatus: "source-listed",
    availabilityStatus: "unknown",
    lastVerifiedAt: null,
    freshness: "unknown",
    source: {
      type: resource.stateCode === "US" ? "federal-resource-catalog" : "state-resource-catalog",
      label: resource.stateCode === "US" ? "Federal resource catalog" : "State resource catalog",
    },
  }));

  const geographyId = `state:${normalizedState.toLowerCase()}`;
  const stateGeography: CanonicalGeographyNode = {
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
  };
  const nationalGeography: CanonicalGeographyNode = {
    id: "national:us",
    type: "state",
    label: "United States",
    stateCode: "US",
    geometry: null,
    geometryStatus: "not-loaded",
    coordinateQuality: "none",
    center: null,
    source: "federal-resource-catalog",
    sourceYear: null,
  };
  const hasNationalResource = resources.some((resource) => resource.coverageScope === "national");
  return {
    contractVersion: "1.0",
    generatedAt: new Date().toISOString(),
    geography: stateGeography,
    geographies: hasNationalResource ? [stateGeography, nationalGeography] : [stateGeography],
    resources,
    edges: resources.map((resource) => ({
      resourceId: resource.id,
      geographyId: resource.coverageScope === "national" ? nationalGeography.id : geographyId,
      relationship: "covers",
      coverageConfidence: resource.coverageScope === "national" ? "catalog-national" : "catalog-state",
    })),
    disclosures: [
      "Resources are source-listed records, not partner-confirmed referrals.",
      "Availability and capacity are unknown until a provider or authoritative feed confirms them.",
      "National records retain national coverage; state records are linked only to the requested state.",
      "Boundary geometry is not loaded in this slice; no map hotspot or boundary claim is made.",
    ],
  };
}