export type VisualIntelligenceLens =
  | "map"
  | "data"
  | "comparison"
  | "resources"
  | "story"
  | "impact";

export type VisualEvidenceClass =
  | "observed"
  | "derived"
  | "modeled"
  | "unavailable";

export type VisualSourceStatus = "available" | "partial" | "stale" | "unavailable";

export interface VisualIntelligenceLayer {
  id: string;
  label: string;
  kind: "observed" | "derived" | "modeled";
  description: string;
}

export interface VisualIntelligenceObservation {
  id: string;
  label: string;
  evidenceClass: VisualEvidenceClass;
  geography: string;
  source: string;
  vintage: string;
  status: VisualSourceStatus;
  uncertainty?: string;
  disclosure?: string;
}

export interface VisualIntelligenceState {
  geography: string;
  lens: VisualIntelligenceLens;
  selectedLayers: string[];
  comparisonGeographies: string[];
  historicalVintage?: string;
  view?: "story" | "impact";
}

export const VISUAL_INTELLIGENCE_LAYERS: VisualIntelligenceLayer[] = [
  {
    id: "svi",
    label: "Social vulnerability",
    kind: "observed",
    description: "CDC/ATSDR SVI indicators at the disclosed geography.",
  },
  {
    id: "sdoh",
    label: "Community conditions",
    kind: "observed",
    description: "Census ACS socioeconomic and access indicators.",
  },
  {
    id: "resources",
    label: "Service context",
    kind: "observed",
    description: "Source-listed organizations and resource coverage.",
  },
  {
    id: "relationships",
    label: "Evidence relationships",
    kind: "derived",
    description: "Calculated or evidence-linked relationships; not causal proof.",
  },
  {
    id: "scenarios",
    label: "Intervention scenarios",
    kind: "modeled",
    description: "TCAF decision-support scenarios, never observed outcomes.",
  },
];

export function parseVisualIntelligenceState(
  search: string,
  fallbackGeography = "",
): VisualIntelligenceState {
  const params = new URLSearchParams(search);
  const lens = params.get("lens");
  const validLenses: VisualIntelligenceLens[] = [
    "map",
    "data",
    "comparison",
    "resources",
    "story",
    "impact",
  ];

  return {
    geography:
      params.get("geo") ||
      params.get("zip") ||
      params.get("q") ||
      params.get("a") ||
      fallbackGeography,
    lens: validLenses.includes(lens as VisualIntelligenceLens)
      ? (lens as VisualIntelligenceLens)
      : "map",
    selectedLayers: (params.get("layers") || "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => VISUAL_INTELLIGENCE_LAYERS.some((layer) => layer.id === value))
      .filter(Boolean),
    comparisonGeographies: (params.get("compare") || params.get("geo")?.split(" vs ").join("|") || "")
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean),
    historicalVintage: /^\d{4}$/.test(params.get("vintage") || "")
      ? params.get("vintage") || undefined
      : undefined,
    view: params.get("view") === "story" || params.get("view") === "impact"
      ? (params.get("view") as "story" | "impact")
      : undefined,
  };
}

export function buildVisualIntelligenceHref(
  path: string,
  state: Partial<VisualIntelligenceState>,
): string {
  const params = new URLSearchParams();
  if (state.geography) params.set("geo", state.geography);
  if (state.lens) params.set("lens", state.lens);
  if (state.selectedLayers?.length) params.set("layers", state.selectedLayers.join(","));
  if (state.comparisonGeographies?.length) {
    params.set("compare", state.comparisonGeographies.join("|"));
  }
  if (state.historicalVintage) params.set("vintage", state.historicalVintage);
  if (state.view) params.set("view", state.view);

  // Keep the canonical shared state while also satisfying each existing
  // destination's established query contract during this additive rollout.
  const comparisonGeographies = state.comparisonGeographies?.length
    ? state.comparisonGeographies
    : state.geography?.split(" vs ").map((value) => value.trim()).filter(Boolean) || [];
  const geography = (state.geography || comparisonGeographies[0] || "").trim();
  if (geography) {
    const primaryGeography = comparisonGeographies[0] || geography;
    if (path === "/community-impact") params.set("q", primaryGeography);
    if (path === "/community-compare") params.set("a", primaryGeography);
    if (path === "/community-map") params.set("q", primaryGeography);
    if (path === "/community-analysis" && /^\d{5}$/.test(geography)) {
      params.set("zip", geography);
    }
    if (path === "/sdoh-explorer" && /^[A-Za-z]{2}$/.test(geography)) {
      params.set("state", geography.toUpperCase());
    }
  }
  if (comparisonGeographies.length > 1) {
    params.set("compare", comparisonGeographies.join("|"));
  }
  const query = params.toString();
  const separator = path.includes("?") ? "&" : "?";
  return query ? `${path}${separator}${query}` : path;
}