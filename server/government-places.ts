import { z } from "zod";
import type { GovernmentRequest, GovernmentSnapshot, GovernmentMeasure } from "@shared/government-coordination";
import { governmentRequestSchema } from "@shared/government-coordination";

export const PLACES_DATASETS = {
  county: "swc5-untb", place: "eav7-hnsx", tract: "cwsq-ngmh", zcta: "qnzd-25i4",
} as const;
export const PLACES_LIMITATIONS = [
  "Modeled adult population estimates, not individual diagnoses or observed program outcomes.",
  "CDC advises against using PLACES to evaluate local intervention effects.",
  "Measure years and denominators differ; 2025 release uses 2023 data with five measures carried from 2022.",
  "2025 release: Kentucky and Pennsylvania lack 2023-based estimates; social-needs coverage is 39 states and DC.",
  "ZCTA is not a postal ZIP; geographic boundary changes require explicit crosswalks.",
];
const rowSchema = z.object({
  locationid: z.string().regex(/^\d+$/),
  locationname: z.string().max(250).optional(),
  stateabbr: z.string().regex(/^[A-Z]{2}$/).optional(),
  measureid: z.string().regex(/^[A-Z0-9_]+$/).max(50),
  measure: z.string().min(1).max(600),
  category: z.string().max(150),
  year: z.string().regex(/^\d{4}$/),
  data_value_type: z.literal("Crude prevalence"),
  data_value_unit: z.literal("%"),
  data_value: z.string().max(30).nullish(),
  low_confidence_limit: z.string().max(30).nullish(),
  high_confidence_limit: z.string().max(30).nullish(),
  totalpop18plus: z.string().max(20).nullish(),
  data_value_footnote: z.string().max(1000).nullish(),
});

function numberOrNull(value: unknown, max = 100): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

/** Deterministic structured-data parsing. No LLM fact extraction or inferred values. */
export function normalizePlacesRows(raw: unknown, expectedId?: string, expectedState?: string): {
  measures: GovernmentMeasure[]; rejectedRows: number; label: string; state: string | null;
} {
  if (!Array.isArray(raw)) throw new Error("CDC returned a non-array response");
  let rejectedRows = 0;
  let label = expectedId ?? "";
  let state: string | null = null;
  const measures = new Map<string, GovernmentMeasure>();
  for (const input of raw) {
    const result = rowSchema.safeParse(input);
    if (!result.success || (expectedId && result.data.locationid !== expectedId) ||
      (expectedState && result.data.stateabbr !== expectedState)) { rejectedRows++; continue; }
    const r = result.data;
    label = r.locationname || label;
    state = r.stateabbr ?? state;
    const value = numberOrNull(r.data_value);
    let lower95 = numberOrNull(r.low_confidence_limit);
    let upper95 = numberOrNull(r.high_confidence_limit);
    const invalid = (r.data_value != null && value === null) ||
      (r.low_confidence_limit != null && lower95 === null) ||
      (r.high_confidence_limit != null && upper95 === null) ||
      (lower95 !== null && upper95 !== null && lower95 > upper95) ||
      (value !== null && ((lower95 !== null && value < lower95) || (upper95 !== null && value > upper95)));
    if (invalid) { rejectedRows++; continue; }
    const year = Number(r.year);
    if (year < 2000 || year > new Date().getUTCFullYear()) { rejectedRows++; continue; }
    const measure: GovernmentMeasure = {
      id: r.measureid, label: r.measure, category: r.category, value,
      unit: r.data_value_unit, year, lower95, upper95,
      population: numberOrNull(r.totalpop18plus, 1_000_000_000),
      footnote: r.data_value_footnote ?? (value === null ? "Estimate unavailable or suppressed by source" : null),
      method: "modeled", valueType: "Crude prevalence",
    };
    const old = measures.get(r.measureid);
    if (!old || old.year < year) measures.set(r.measureid, measure);
    else if (old.year === year && JSON.stringify(old) !== JSON.stringify(measure)) {
      throw new Error(`CDC returned conflicting crude estimates for ${r.measureid}`);
    }
  }
  return { measures: [...measures.values()].sort((a, b) => a.id.localeCompare(b.id)), rejectedRows, label, state };
}

/** Fixed destinations, bounded time/body/rows. Callers cannot turn this into an arbitrary proxy. */
export async function readGovernmentJson(url: string, timeoutMs = 7000, maxBytes = 2_000_000): Promise<unknown> {
  timeoutMs = Math.max(1, Math.min(timeoutMs, 15000));
  maxBytes = Math.max(1, Math.min(maxBytes, 18_000_000));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "error", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Government source HTTP ${response.status}`);
    if (!response.body) throw new Error("Government source returned no body");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    let rejectAbort!: (reason: unknown) => void;
    const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
    const onAbort = () => rejectAbort(controller.signal.reason);
    controller.signal.addEventListener("abort", onAbort, { once: true });
    try {
      while (true) {
        const { done, value } = await Promise.race([reader.read(), aborted]);
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { controller.abort(); throw new Error("Government response exceeds safe size"); }
        chunks.push(value);
      }
    } catch (error) {
      void reader.cancel().catch(cancelError => console.error("[GovernmentEvidence] body cancellation failed:", cancelError));
      throw error;
    } finally {
      controller.signal.removeEventListener("abort", onAbort);
      reader.releaseLock();
    }
    controller.signal.throwIfAborted();
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { clearTimeout(timer); }
}

const metadataSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(500),
  rowsUpdatedAt: z.number().nonnegative().optional(),
});
const cache = new Map<string, { expires: number; snapshot: GovernmentSnapshot | null; error: string | null }>();
const pending = new Map<string, Promise<{ snapshot: GovernmentSnapshot | null; error: string | null }>>();
const metadataCache = new Map<string, { expires: number; name: string; updatedAt: string | null; measureIds: string[] }>();
const metadataPending = new Map<string, Promise<{ name: string; updatedAt: string | null; measureIds: string[] }>>();
const TTL = 6 * 60 * 60 * 1000;

async function datasetMetadata(dataset: string) {
  const hit = metadataCache.get(dataset);
  if (hit && hit.expires > Date.now()) return hit;
  if (metadataPending.has(dataset)) return metadataPending.get(dataset)!;
  const job = (async () => {
    const inventoryUrl = new URL(`https://data.cdc.gov/resource/${dataset}.json`);
    inventoryUrl.searchParams.set("$select", "distinct measureid");
    inventoryUrl.searchParams.set("$where", "data_value_type='Crude prevalence'");
    inventoryUrl.searchParams.set("$limit", "201");
    const results = await Promise.allSettled([
      readGovernmentJson(`https://data.cdc.gov/api/views/${dataset}.json`),
      readGovernmentJson(inventoryUrl.href),
    ]);
    if (results[0].status === "rejected") throw results[0].reason;
    if (results[1].status === "rejected") throw results[1].reason;
    const m = metadataSchema.parse(results[0].value);
    const inventory = z.array(z.object({ measureid: z.string().regex(/^[A-Z0-9_]+$/).max(50) })).min(1).max(200).parse(results[1].value);
    const geography = Object.entries(PLACES_DATASETS).find(([, id]) => id === dataset)?.[0];
    const geographyLabel = { county: /\bcounty\b/i, tract: /\btract\b/i, place: /\bplace data\b/i, zcta: /\bzcta\b/i };
    if (m.id !== dataset || !geography || !geographyLabel[geography as keyof typeof geographyLabel].test(m.name)) {
      throw new Error("CDC dataset identity/geography metadata mismatch");
    }
    const result = { name: m.name, updatedAt: m.rowsUpdatedAt ? new Date(m.rowsUpdatedAt * 1000).toISOString() : null, measureIds: [...new Set(inventory.map(r => r.measureid))] };
    metadataCache.set(dataset, { ...result, expires: Date.now() + TTL });
    return result;
  })().finally(() => metadataPending.delete(dataset));
  metadataPending.set(dataset, job);
  return job;
}

export async function getGovernmentPlaces(request: Pick<GovernmentRequest, "geography" | "id">): Promise<{
  snapshot: GovernmentSnapshot | null; error: string | null;
}> {
  const checked = governmentRequestSchema.safeParse({ geography: request.geography, id: request.id, need: "health" });
  if (!checked.success) return { snapshot: null, error: "Invalid explicit government geography." };
  const key = `${request.geography}:${request.id}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit;
  if (pending.has(key)) return pending.get(key)!;
  if (pending.size >= 8) return { snapshot: null, error: "Source reader is busy; retry shortly." };
  const job = (async () => {
    const dataset = PLACES_DATASETS[request.geography];
    const url = new URL(`https://data.cdc.gov/resource/${dataset}.json`);
    url.searchParams.set("$where", `locationid='${request.id}' AND data_value_type='Crude prevalence'`);
    url.searchParams.set("$limit", "201");
    // Wait for both bounded reads even after one fails; do not release a concurrency slot
    // while its sibling fetch is still running.
    const results = await Promise.allSettled([datasetMetadata(dataset), readGovernmentJson(url.href)]);
    if (results[0].status === "rejected") throw results[0].reason;
    if (results[1].status === "rejected") throw results[1].reason;
    const metadata = results[0].value;
    const raw = results[1].value;
    if (!Array.isArray(raw) || raw.length > 200) throw new Error("CDC result exceeded exact-geography row budget");
    const stateCodes = ["AL","AK","","AZ","AR","CA","","CO","CT","DE","DC","FL","GA","","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","","RI","SC","SD","TN","TX","UT","VT","VA","","WA","WV","WI","WY"];
    const expectedState = request.geography === "zcta" ? undefined : stateCodes[Number(request.id.slice(0, 2)) - 1];
    const parsed = normalizePlacesRows(raw, request.id, expectedState);
    const unavailableMeasureIds = metadata.measureIds.filter(id => !parsed.measures.some(m => m.id === id && m.value !== null));
    const snapshot: GovernmentSnapshot = {
      geography: request.geography, id: request.id, label: parsed.label || request.id, state: parsed.state,
      datasetId: dataset, sourceUrl: url.href, release: metadata.name, sourceUpdatedAt: metadata.updatedAt,
      fetchedAt: new Date().toISOString(), measures: parsed.measures, rejectedRows: parsed.rejectedRows,
      status: !parsed.measures.length ? "empty" : parsed.rejectedRows || unavailableMeasureIds.length ? "partial" : "available",
      coverage: { datasetMeasureCount: metadata.measureIds.length, returnedMeasureCount: parsed.measures.length, unavailableMeasureIds, geographyVerified: !!parsed.measures.length },
      limitations: [...PLACES_LIMITATIONS],
    };
    if (!parsed.measures.length) snapshot.limitations.push("No source rows confirm this identifier. An empty query cannot distinguish a nonexistent geography from absent source estimates.");
    return { snapshot, error: null };
  })().catch((error: unknown) => {
    console.error(`[GovernmentEvidence] ${key}:`, error instanceof Error ? error.message : String(error));
    return { snapshot: null, error: "CDC evidence could not be retrieved or validated. No estimates were substituted." };
  }).then((result) => {
    if (cache.size >= 120) cache.delete(cache.keys().next().value!);
    cache.set(key, { ...result, expires: Date.now() + (result.error ? 60_000 : TTL) });
    return result;
  }).finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}
