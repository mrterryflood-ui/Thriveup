// ============================================================
// Health Federation Gateway — live partner platform connectors
// Swaps the Sankofa gateway's placeholder-only federation for
// real, live content from two sibling platforms:
//   - HerHealth Network        https://herhealthmatters2.com
//   - Male Health Matters      https://malehealthmatters2.com
// Honest-failure doctrine: a partner outage returns an explicit
// offline status — never fabricated or stale-silently-served data.
// All inbound partner JSON passes through verifyInboundPayload
// before it is cached or served (AI-to-AI/partner doctrine).
// ============================================================

import {
  verifyInboundPayload,
  hasBlockingRejection,
  recordInboundVerification,
  type InboundSchema,
  type FieldRejection,
} from "./inbound-verification";

export interface FederatedPartner {
  id: "herhealth" | "malehealth";
  name: string;
  baseUrl: string;
  tagline: string;
  aiCompanion: { name: string; url: string; description: string };
  tools: Array<{ label: string; url: string; description: string }>;
}

export const FEDERATED_PARTNERS: FederatedPartner[] = [
  {
    id: "herhealth",
    name: "HerHealth Network",
    baseUrl: "https://herhealthmatters2.com",
    tagline:
      "Women's health equity platform — condition library sourced from NIH, FDA, and ClinicalTrials.gov, with a 24,000+ resource directory.",
    aiCompanion: {
      name: "Nia",
      url: "https://herhealthmatters2.com/ai-navigator",
      description: "AI health navigator for women's health questions",
    },
    tools: [
      {
        label: "Condition Library",
        url: "https://herhealthmatters2.com/conditions",
        description: "NIH/FDA-sourced condition guides",
      },
      {
        label: "Find Services",
        url: "https://herhealthmatters2.com/find-services",
        description: "Verified resource directory",
      },
    ],
  },
  {
    id: "malehealth",
    name: "Male Health Matters",
    baseUrl: "https://malehealthmatters2.com",
    tagline:
      "Men's health platform — condition library, MAP-GAP 8-domain health assessment, and provider directory.",
    aiCompanion: {
      name: "Malik",
      url: "https://malehealthmatters2.com/malik",
      description: "AI health companion for men's health questions",
    },
    tools: [
      {
        label: "MAP-GAP Assessment",
        url: "https://malehealthmatters2.com/assessment",
        description: "8-domain men's health self-assessment",
      },
      {
        label: "Provider Directory",
        url: "https://malehealthmatters2.com/find-care/providers",
        description: "Find providers who serve men's health needs",
      },
    ],
  },
];

// ---------- fetch plumbing ----------

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "ThriveUp-Federation/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error(`Non-JSON response (${ct})`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, loader: () => Promise<T>): Promise<{ data: T; fetchedAt: string; fromCache: boolean }> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    return { data: hit.data as T, fetchedAt: new Date(hit.fetchedAt).toISOString(), fromCache: true };
  }
  const data = await loader();
  const fetchedAt = Date.now();
  cache.set(key, { data, fetchedAt });
  return { data, fetchedAt: new Date(fetchedAt).toISOString(), fromCache: false };
}

// ---------- inbound verification schemas ----------

const MALE_CONDITION_SCHEMA: InboundSchema = {
  slug: { type: "string", required: true, maxLength: 120 },
  fullName: { type: "string", required: true, maxLength: 200 },
  domain: { type: "string", required: true, maxLength: 120 },
};

const HER_CONDITION_SCHEMA: InboundSchema = {
  slug: { type: "string", required: true, maxLength: 120 },
  conditionName: { type: "string", required: true, maxLength: 200 },
  summary: { type: "string", maxLength: 2000 },
};

// ---------- HerHealth Network connector ----------

export interface FederatedConditionItem {
  slug: string;
  name: string;
  domain?: string;
  summary?: string;
  url: string;
}

export interface FederatedContent {
  partnerId: string;
  partnerName: string;
  sourceUrl: string;
  attribution: string;
  fetchedAt: string;
  stats?: Record<string, string | number>;
  conditions: FederatedConditionItem[];
  conditionsTotal: number;
}

// HerHealth has no public list endpoint; per-condition reference endpoint is
// public. Featured slugs chosen from its flagship condition hubs.
const HERHEALTH_FEATURED_SLUGS = [
  "endometriosis",
  "fibroids",
  "pcos",
  "breast-cancer",
  "heart-disease",
  "hypertension",
  "depression",
  "type-2-diabetes",
];

async function loadHerHealthContent(): Promise<FederatedContent> {
  const base = "https://herhealthmatters2.com";
  const [statsRaw, ...conditionResults] = await Promise.all([
    fetchJson(`${base}/api/research/platform-stats`).catch((e: Error) => {
      throw new Error(`platform-stats failed: ${e.message}`);
    }),
    ...HERHEALTH_FEATURED_SLUGS.map((slug) =>
      fetchJson(`${base}/api/reference/condition/${slug}`)
        .then((raw) => ({ slug, raw }))
        .catch(() => null),
    ),
  ]);

  const stats: Record<string, string | number> = {};
  const s = statsRaw as Record<string, any>;
  if (s?.live && typeof s.live === "object") {
    if (typeof s.live.resourcesInDirectory === "number") stats["Resources in directory"] = s.live.resourcesInDirectory;
    if (typeof s.live.conditionsWithResources === "number") stats["Conditions covered"] = s.live.conditionsWithResources;
  }
  if (typeof s?.domains === "number") stats["Health domains"] = s.domains;

  const conditions: FederatedConditionItem[] = [];
  const allRejections: FieldRejection[] = [];
  for (const result of conditionResults) {
    if (!result) continue;
    const raw = result.raw as Record<string, any>;
    const flattened = {
      slug: raw?.slug ?? result.slug,
      conditionName: raw?.conditionName,
      summary: typeof raw?.overview?.summary === "string" ? raw.overview.summary.slice(0, 2000) : undefined,
    };
    const { clean, rejections } = verifyInboundPayload<{ slug: string; conditionName: string; summary?: string }>(
      flattened,
      HER_CONDITION_SCHEMA,
    );
    if (rejections.length > 0) allRejections.push(...rejections);
    if (hasBlockingRejection(rejections)) continue;
    conditions.push({
      slug: clean.slug!,
      name: clean.conditionName!,
      summary: clean.summary ? `${clean.summary.slice(0, 240)}${clean.summary.length > 240 ? "…" : ""}` : undefined,
      url: `${base}/conditions`,
    });
  }
  if (allRejections.length > 0) {
    await recordInboundVerification("herhealth-federation", "/api/reference/condition", allRejections);
  }
  if (conditions.length === 0) {
    throw new Error("HerHealth returned no valid condition records");
  }

  return {
    partnerId: "herhealth",
    partnerName: "HerHealth Network",
    sourceUrl: base,
    attribution: "Sourced live from HerHealth Network (herhealthmatters2.com) — content by our sister platform, not ThriveUp.",
    fetchedAt: new Date().toISOString(),
    stats,
    conditions,
    conditionsTotal: typeof s?.live?.conditionsWithResources === "number" ? s.live.conditionsWithResources : conditions.length,
  };
}

// ---------- Male Health Matters connector ----------

async function loadMaleHealthContent(): Promise<FederatedContent> {
  const base = "https://malehealthmatters2.com";
  const raw = (await fetchJson(`${base}/api/conditions`)) as Record<string, any>;
  if (!raw || raw.success !== true || !Array.isArray(raw.conditions)) {
    throw new Error("Male Health Matters /api/conditions returned an unexpected shape");
  }

  const conditions: FederatedConditionItem[] = [];
  const allRejections: FieldRejection[] = [];
  for (const item of raw.conditions) {
    const { clean, rejections } = verifyInboundPayload<{ slug: string; fullName: string; domain: string }>(
      item,
      MALE_CONDITION_SCHEMA,
    );
    if (rejections.length > 0) allRejections.push(...rejections);
    if (hasBlockingRejection(rejections)) continue;
    conditions.push({
      slug: clean.slug!,
      name: clean.fullName!,
      domain: clean.domain,
      url: `${base}/conditions`,
    });
  }
  if (allRejections.length > 0) {
    await recordInboundVerification("malehealth-federation", "/api/conditions", allRejections);
  }
  if (conditions.length === 0) {
    throw new Error("Male Health Matters returned no valid condition records");
  }

  return {
    partnerId: "malehealth",
    partnerName: "Male Health Matters",
    sourceUrl: base,
    attribution: "Sourced live from Male Health Matters (malehealthmatters2.com) — content by our sister platform, not ThriveUp.",
    fetchedAt: new Date().toISOString(),
    conditions,
    conditionsTotal: typeof raw.totalConditions === "number" ? raw.totalConditions : conditions.length,
  };
}

// ---------- public gateway API ----------

export type FederationResult =
  | { status: "ok"; fromCache: boolean; content: FederatedContent }
  | { status: "offline"; partnerId: string; partnerName: string; sourceUrl: string; error: string; checkedAt: string };

export async function getFederatedContent(partnerId: "herhealth" | "malehealth"): Promise<FederationResult> {
  const partner = FEDERATED_PARTNERS.find((p) => p.id === partnerId)!;
  try {
    const loader = partnerId === "herhealth" ? loadHerHealthContent : loadMaleHealthContent;
    const { data, fromCache, fetchedAt } = await cached(partnerId, loader);
    return { status: "ok", fromCache, content: { ...data, fetchedAt } };
  } catch (error: any) {
    console.error(`[Health Federation] ${partner.name} unavailable:`, error?.message || error);
    return {
      status: "offline",
      partnerId: partner.id,
      partnerName: partner.name,
      sourceUrl: partner.baseUrl,
      error: String(error?.message || error),
      checkedAt: new Date().toISOString(),
    };
  }
}

// ---------- connectivity check ----------

export interface PartnerHealth {
  partnerId: string;
  partnerName: string;
  baseUrl: string;
  ok: boolean;
  latencyMs: number | null;
  error?: string;
  checkedAt: string;
}

export async function checkPartnerConnectivity(): Promise<PartnerHealth[]> {
  return Promise.all(
    FEDERATED_PARTNERS.map(async (partner): Promise<PartnerHealth> => {
      const started = Date.now();
      try {
        const raw = (await fetchJson(`${partner.baseUrl}/api/health`)) as Record<string, any>;
        const ok = raw?.status === "ok";
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          baseUrl: partner.baseUrl,
          ok,
          latencyMs: Date.now() - started,
          error: ok ? undefined : `Unexpected health payload: ${JSON.stringify(raw).slice(0, 200)}`,
          checkedAt: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error(`[Health Federation] Connectivity check FAILED for ${partner.name}: ${error?.message || error}`);
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          baseUrl: partner.baseUrl,
          ok: false,
          latencyMs: null,
          error: String(error?.message || error),
          checkedAt: new Date().toISOString(),
        };
      }
    }),
  );
}
