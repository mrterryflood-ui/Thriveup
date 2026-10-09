import { z } from "zod";

export const GOVERNMENT_NEEDS = ["health", "housing", "food", "family-workforce", "education", "recovery"] as const;
export const GOVERNMENT_ROLES = ["resident", "chw", "planner"] as const;
export const GOVERNMENT_GEOGRAPHIES = ["county", "tract", "place", "zcta"] as const;
export const governmentRequestSchema = z.object({
  geography: z.enum(GOVERNMENT_GEOGRAPHIES),
  id: z.string().regex(/^\d+$/).max(11),
  need: z.enum(GOVERNMENT_NEEDS),
  role: z.enum(GOVERNMENT_ROLES).default("resident"),
}).strict().superRefine((value, ctx) => {
  const lengths = { county: 5, tract: 11, place: 7, zcta: 5 };
  if (value.id.length !== lengths[value.geography]) ctx.addIssue({
    code: z.ZodIssueCode.custom, path: ["id"],
    message: `${value.geography} requires exactly ${lengths[value.geography]} digits`,
  });
  const states = new Set(["01","02","04","05","06","08","09","10","11","12","13","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","44","45","46","47","48","49","50","51","53","54","55","56"]);
  if (value.geography !== "zcta" && (!states.has(value.id.slice(0, 2)) ||
    (value.geography !== "place" && value.id.slice(2, 5) === "000"))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["id"], message: "Use a recognized US state/DC FIPS and nonzero county code." });
  }
  if (/^0+$/.test(value.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["id"], message: "A zero identifier is not a geography." });
});
export type GovernmentRequest = z.infer<typeof governmentRequestSchema>;
export type GovernmentNeed = GovernmentRequest["need"];

export function governmentDraft(request: GovernmentRequest): string {
  const r = governmentRequestSchema.parse(request);
  const perspective = r.role === "planner"
    ? "Help me compare population-level evidence and coordinate relevant public resources. Ask about planning objectives and evidence limitations before recommending an action."
    : r.role === "chw"
      ? "Help me coordinate relevant resources for this area. Ask about the person's expressed priorities and consent without requesting identifying case details."
      : "Help me understand area evidence and explore practical options. Ask about my actual circumstances before recommending an action.";
  return `[Government evidence: ${r.geography}:${r.id}; need:${r.need}; role:${r.role}]\nFor ${r.need.replace(/-/g, " ")}: ${perspective} Do not treat area estimates as personal facts or proof of service availability.`;
}

export function governmentRequestFromDraft(text: string): GovernmentRequest | null {
  const matches = [...text.matchAll(/\[Government evidence: ([a-z]+):(\d+); need:([a-z-]+); role:([a-z]+)\]/g)];
  if (matches.length !== 1) return null;
  const [, geography, id, need, role] = matches[0];
  const parsed = governmentRequestSchema.safeParse({ geography, id, need, role });
  return parsed.success ? parsed.data : null;
}

export function governmentDraftFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  const parsed = governmentRequestSchema.safeParse({
    geography: params.get("governmentGeography"), id: params.get("governmentId"),
    need: params.get("governmentNeed"), role: params.get("governmentRole") || "resident",
  });
  return parsed.success ? governmentDraft(parsed.data) : "";
}

export interface GovernmentMeasure {
  id: string;
  label: string;
  category: string;
  value: number | null;
  unit: string;
  year: number;
  lower95: number | null;
  upper95: number | null;
  population: number | null;
  footnote: string | null;
  method: "modeled";
  valueType: "Crude prevalence";
}
export interface GovernmentSnapshot {
  geography: GovernmentRequest["geography"];
  id: string;
  label: string;
  state: string | null;
  sourceUrl: string;
  datasetId: string;
  release: string;
  sourceUpdatedAt: string | null;
  fetchedAt: string;
  measures: GovernmentMeasure[];
  rejectedRows: number;
  status: "available" | "partial" | "empty";
  coverage: {
    datasetMeasureCount: number;
    returnedMeasureCount: number;
    unavailableMeasureIds: string[];
    geographyVerified: boolean;
  };
  limitations: string[];
}
export interface GovernmentResource {
  id: string;
  name: string;
  url: string;
  needs: readonly GovernmentNeed[];
  access: "public-download" | "catalog-key" | "account-or-license";
  connection: "cdc-reader" | "existing-tool" | "discovery";
  limitation: string;
}
// Adapter/decision configuration, not a claim of ingestion or local service availability.
export const GOVERNMENT_RESOURCES: readonly GovernmentResource[] = [
  { id: "cdc-places", name: "CDC PLACES", url: "https://www.cdc.gov/places/current-release-notes/index.html", needs: ["health", "housing", "food", "family-workforce"], access: "public-download", connection: "cdc-reader", limitation: "Modeled adult estimates; varying coverage. Not for local intervention-effect evaluation." },
  { id: "census-acs", name: "Census ACS", url: "https://www.census.gov/programs-surveys/acs/data/data-via-ftp.html", needs: ["health", "housing", "food", "family-workforce", "education"], access: "public-download", connection: "existing-tool", limitation: "Survey periods, margins of error, and denominators matter. Geography does not identify personal circumstances." },
  { id: "census-geography", name: "Census TIGER/Line and relationship files", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html", needs: ["health", "housing", "food", "family-workforce", "education", "recovery"], access: "public-download", connection: "existing-tool", limitation: "Boundary vintage required; postal ZIP is not a ZCTA. No demographic values in boundaries." },
  { id: "cdc-svi", name: "CDC/ATSDR Social Vulnerability Index", url: "https://www.atsdr.cdc.gov/place-health/php/svi/index.html", needs: ["health", "housing", "recovery"], access: "public-download", connection: "existing-tool", limitation: "Relative ranking, not a diagnosis. ACS-derived components are not independent corroboration of ACS." },
  { id: "hrsa", name: "HRSA shortages and health-center locations", url: "https://data.hrsa.gov/topics/health-workforce/shortage-areas", needs: ["health"], access: "public-download", connection: "existing-tool", limitation: "Designation geography varies; provider listing does not establish appointment capacity." },
  { id: "cms", name: "CMS Provider Data Catalog", url: "https://data.cms.gov/provider-data", needs: ["health"], access: "public-download", connection: "discovery", limitation: "Quality and provider records do not establish insurance acceptance or current openings." },
  { id: "hud-chas", name: "HUD CHAS housing needs", url: "https://www.huduser.gov/portal/datasets/cp.html", needs: ["housing"], access: "public-download", connection: "existing-tool", limitation: "ACS-period estimates; suppression and definition changes limit comparisons." },
  { id: "hud-pit", name: "HUD homelessness and housing inventory", url: "https://www.huduser.gov/portal/datasets/ahar.html", needs: ["housing"], access: "public-download", connection: "existing-tool", limitation: "CoC is not county geography; point-in-time counts and beds are not live shelter vacancies." },
  { id: "usda-food", name: "USDA food and SNAP-retailer access", url: "https://www.ers.usda.gov/data-products/food-access-research-atlas/download-the-data", needs: ["food", "health"], access: "public-download", connection: "discovery", limitation: "2025 SNAP retailer data use 2020 tracts; 2019 large-retailer data use 2010 tracts. Proximity is not affordability." },
  { id: "bls", name: "BLS employment and wages", url: "https://www.bls.gov/cew/downloadable-data-files.htm", needs: ["family-workforce"], access: "public-download", connection: "existing-tool", limitation: "Industry employment and wages are not current job vacancies." },
  { id: "lehd", name: "Census LEHD commuting and workforce flows", url: "https://lehd.ces.census.gov/data", needs: ["family-workforce", "education"], access: "public-download", connection: "discovery", limitation: "Release/boundary alignment required; selected education outcomes are not universal coverage." },
  { id: "cbp", name: "Census County Business Patterns", url: "https://www.census.gov/programs-surveys/cbp/data.html", needs: ["family-workforce"], access: "public-download", connection: "existing-tool", limitation: "Industry establishments are not licensed childcare slots or available openings." },
  { id: "childcare-prices", name: "DOL childcare prices", url: "https://www.dol.gov/agencies/wb/topics/featured-childcare", needs: ["family-workforce"], access: "public-download", connection: "discovery", limitation: "Reviewed database covers 2008–2022; historical estimates are not current provider prices." },
  { id: "head-start", name: "Head Start service locations", url: "https://www.headstart.gov/about-us/article/head-start-service-location-datasets", needs: ["family-workforce", "education"], access: "public-download", connection: "discovery", limitation: "Confirm enrollment openings and distinguish program/grant address from service location." },
  { id: "acf", name: "ACF childcare assistance and policy resources", url: "https://www.acf.hhs.gov/occ/guide-ccdf-resources", needs: ["family-workforce"], access: "public-download", connection: "discovery", limitation: "Aggregate participation is not individual eligibility; use current jurisdiction rules." },
  { id: "nces", name: "NCES public schools", url: "https://nces.ed.gov/ccd/files.asp", needs: ["education"], access: "public-download", connection: "discovery", limitation: "Directory/enrollment data are not student-level records or current service capacity." },
  { id: "college-scorecard", name: "College Scorecard and IPEDS", url: "https://collegescorecard.ed.gov/data", needs: ["education", "family-workforce"], access: "public-download", connection: "existing-tool", limitation: "Costs, earnings, completion, and debt can describe different cohorts." },
  { id: "transit", name: "BTS National Transit Map", url: "https://www.bts.gov/national-transit-map", needs: ["health", "family-workforce", "education"], access: "public-download", connection: "discovery", limitation: "Scheduled service is not real-time availability; local feed coverage varies." },
  { id: "fcc", name: "FCC broadband availability", url: "https://www.fcc.gov/BroadbandData", needs: ["family-workforce", "education"], access: "account-or-license", connection: "discovery", limitation: "Account/license requirements vary; reported availability is not adoption or measured performance." },
  { id: "fema", name: "OpenFEMA", url: "https://www.fema.gov/about/openfema/data-sets", needs: ["recovery", "housing"], access: "public-download", connection: "discovery", limitation: "Declarations do not prove individual assistance eligibility or receipt." },
  { id: "epa", name: "EPA air-quality monitoring", url: "https://www.epa.gov/outdoor-air-quality-data/download-daily-data", needs: ["health", "recovery"], access: "public-download", connection: "discovery", limitation: "Monitor readings are not address-specific or personal exposure measurements." },
  { id: "irs", name: "IRS nonprofit identity", url: "https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf", needs: ["housing", "food", "family-workforce", "education", "recovery"], access: "public-download", connection: "existing-tool", limitation: "Filing address/tax status does not verify service location, quality, or current operations." },
  { id: "data-gov", name: "Data.gov broader discovery", url: "https://catalog.data.gov/", needs: ["health", "housing", "food", "family-workforce", "education", "recovery"], access: "catalog-key", connection: "discovery", limitation: "Metadata catalog, not a warehouse; automated catalog API requires a free key. Each distribution needs qualification." },
];

export interface GovernmentCoordination {
  request: GovernmentRequest;
  checkedAt: string;
  evidence: GovernmentSnapshot | null;
  error: string | null;
  relevantMeasureIds: string[];
  resources: GovernmentResource[];
  tools: Array<{ path: string; title: string; reason: string; access: string }>;
  nextQuestion: string;
  handoff: { geography: string; need: GovernmentNeed; evidenceUrl: string; instruction: string };
}

/** Server-owned receipt, not an AI-authored account of which data was used. */
export const governmentNavigatorReceiptSchema = z.object({
  request: governmentRequestSchema,
  checkedAt: z.string().datetime(),
  error: z.string().nullable(),
  nextQuestion: z.string(),
  tools: z.array(z.object({
    path: z.string().regex(/^\/(?!\/)[a-z0-9/-]+$/),
    title: z.string(),
    reason: z.string(),
    access: z.string(),
  })).max(30),
  evidence: z.object({
    geography: z.enum(["county", "tract", "place", "zcta"]),
    id: z.string(),
    label: z.string(),
    state: z.string().nullable(),
    sourceUrl: z.string().url().refine(url => {
      try {
        const source = new URL(url);
        return source.protocol === "https:" && source.hostname === "data.cdc.gov";
      } catch { return false; }
    }),
    datasetId: z.string(),
    release: z.string(),
    sourceUpdatedAt: z.string().nullable(),
    fetchedAt: z.string().datetime(),
    rejectedRows: z.number().int().nonnegative(),
    status: z.enum(["available", "partial", "empty"]),
    coverage: z.object({
      datasetMeasureCount: z.number().int().nonnegative(),
      returnedMeasureCount: z.number().int().nonnegative(),
      unavailableMeasureIds: z.array(z.string()),
      geographyVerified: z.boolean(),
    }),
    limitations: z.array(z.string()),
    measures: z.array(z.object({
      id: z.string(), label: z.string(), category: z.string(),
      value: z.number().min(0).max(100).nullable(), unit: z.string(),
      year: z.number().int(), lower95: z.number().min(0).max(100).nullable(),
      upper95: z.number().min(0).max(100).nullable(),
      population: z.number().nonnegative().nullable(), footnote: z.string().nullable(),
      method: z.literal("modeled"), valueType: z.literal("Crude prevalence"),
    })).max(200),
  }).nullable(),
}).superRefine((receipt, ctx) => {
  const evidence = receipt.evidence;
  if (!evidence) return;
  if (evidence.geography !== receipt.request.geography || evidence.id !== receipt.request.id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Receipt geography does not match request" });
  }
  if (evidence.coverage.returnedMeasureCount !== evidence.measures.length ||
      evidence.coverage.datasetMeasureCount < evidence.measures.length ||
      new Set(evidence.measures.map(m => m.id)).size !== evidence.measures.length ||
      new Set(evidence.coverage.unavailableMeasureIds).size !== evidence.coverage.unavailableMeasureIds.length ||
      evidence.coverage.datasetMeasureCount !== evidence.measures.length + evidence.coverage.unavailableMeasureIds.length ||
      evidence.coverage.unavailableMeasureIds.some(id => evidence.measures.some(m => m.id === id))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Receipt coverage is inconsistent" });
  }
});
export type GovernmentNavigatorReceipt = z.infer<typeof governmentNavigatorReceiptSchema>;

/** A new valid draft wins over inherited context; malformed tags never become ZIPs. */
export function resolveGovernmentNavigatorRequest(text: string, inherited?: unknown): GovernmentRequest | null {
  if (text.includes("[Government evidence:")) {
    const request = governmentRequestFromDraft(text);
    if (!request) throw new Error("Government evidence draft is invalid. Re-select its place and topic in Data Sources.");
    return request;
  }
  if (inherited === undefined || inherited === null) return null;
  return governmentRequestSchema.parse(inherited);
}
