/**
 * FCC Broadband Data Collection (BDC) Public Data API client.
 *
 * Implements the official spec (docs/data-sources/fcc-bdc/, v1.6 2025-09-30):
 *   base https://bdc.fcc.gov, GET only, headers `username` + `hash_value`,
 *   10 calls / minute, envelope { data, result_count, status_code, message, status, request_date }.
 *
 * Credentials come from FCC_BDC_USERNAME / FCC_BDC_HASH_VALUE. When absent the
 * client is "offline" and every call throws FccBdcUnavailable — no substitute data.
 */

export const FCC_BDC_BASE_URL = "https://bdc.fcc.gov";
export const FCC_BDC_RATE_LIMIT_PER_MINUTE = 10;
export const FCC_BDC_TOKEN_INSTRUCTIONS =
  "Sign in at https://broadbandmap.fcc.gov/login with an FCC User Registration account, open the username menu → Manage API Access, accept the FCC Terms of Use, click Generate, then store FCC_BDC_USERNAME and FCC_BDC_HASH_VALUE.";

export type BdcDataType = "availability" | "challenge";
export type BdcAvailabilityCategory = "Summary" | "State" | "Provider";
export type BdcTechnologyType = "Fixed Broadband" | "Mobile Broadband" | "Mobile Voice";

export interface BdcEnvelope<T> {
  data: T[];
  result_count: number;
  status_code: number;
  message: string | null;
  status: string;
  request_date: string;
}

export interface BdcAsOfDate { data_type: BdcDataType; as_of_date: string }
export interface BdcAvailabilityFile {
  file_id: number | string;
  category: string;
  subcategory: string;
  technology_type: string | null;
  technology_code: string | null;
  technology_code_desc: string | null;
  speed_tier: string | null;
  state_fips: string | null;
  state_name: string | null;
  provider_id: string | number | null;
  provider_name: string | null;
  file_type: "csv" | "gis" | string;
  file_name: string;
  record_count: number | null;
}
export interface BdcChallengeFile {
  file_id: number | string;
  category: string;
  state_fips: string | null;
  state_name: string | null;
  record_count: number | null;
}
export interface BdcFundingFile {
  file_id: number | string;
  category: string;
  data_type: string;
  agency_name: string | null;
  program_name: string | null;
  project_name: string | null;
  state_fips: string | null;
  state_name: string | null;
  file_name: string;
  record_count: number | null;
}
export interface BdcGeography { geography_type: string; geography_id: string; geography_desc_full: string }

export class FccBdcUnavailable extends Error {
  readonly reason: "missing_credentials" | "rate_limited" | "upstream";
  readonly httpStatus?: number;
  constructor(reason: FccBdcUnavailable["reason"], message: string, httpStatus?: number) {
    super(message);
    this.name = "FccBdcUnavailable";
    this.reason = reason;
    this.httpStatus = httpStatus;
  }
}

function credentials(): { username: string; hash_value: string } | null {
  // BROADBAND_USERNAME / BROADBAND_MAP_API are the operator-chosen aliases for the FCC username and BDC token (hash_value).
  const username = (process.env.FCC_BDC_USERNAME ?? process.env.BROADBAND_USERNAME)?.trim();
  const hash_value = (process.env.FCC_BDC_HASH_VALUE ?? process.env.BROADBAND_MAP_API)?.trim();
  return username && hash_value ? { username, hash_value } : null;
}

/** Which half of the credential pair is missing, for truthful status reporting. */
export function fccBdcMissingCredentials(): string[] {
  const missing: string[] = [];
  if (!(process.env.FCC_BDC_USERNAME ?? process.env.BROADBAND_USERNAME)?.trim()) missing.push("FCC_BDC_USERNAME (or BROADBAND_USERNAME)");
  if (!(process.env.FCC_BDC_HASH_VALUE ?? process.env.BROADBAND_MAP_API)?.trim()) missing.push("FCC_BDC_HASH_VALUE (or BROADBAND_MAP_API)");
  return missing;
}

export function fccBdcStatus() {
  const configured = credentials() !== null;
  return {
    source: "FCC Broadband Data Collection Public Data API",
    baseUrl: FCC_BDC_BASE_URL,
    specVersion: "1.6 (2025-09-30)",
    specPath: "docs/data-sources/fcc-bdc/",
    configured,
    missingCredentials: fccBdcMissingCredentials(),
    rateLimitPerMinute: FCC_BDC_RATE_LIMIT_PER_MINUTE,
    recentCalls: callTimes.length,
    pointLookupSupported: false,
    note: configured
      ? "Bulk-download catalogue only; location-level answers require the state Location Coverage files."
      : `Offline: credentials not configured. ${FCC_BDC_TOKEN_INSTRUCTIONS}`,
  };
}

// Sliding-window limiter shared across the process (spec: 10 calls per minute per token).
const callTimes: number[] = [];
function takeRateSlot(): void {
  const now = Date.now();
  while (callTimes.length && now - callTimes[0] > 60_000) callTimes.shift();
  if (callTimes.length >= FCC_BDC_RATE_LIMIT_PER_MINUTE) {
    const retryInMs = 60_000 - (now - callTimes[0]);
    throw new FccBdcUnavailable("rate_limited", `FCC BDC rate limit (${FCC_BDC_RATE_LIMIT_PER_MINUTE}/min) reached; retry in ${Math.ceil(retryInMs / 1000)}s`, 429);
  }
  callTimes.push(now);
}

async function bdcFetch(path: string, query?: Record<string, string | undefined>, accept = "application/json"): Promise<globalThis.Response> {
  const creds = credentials();
  if (!creds) throw new FccBdcUnavailable("missing_credentials", `FCC BDC credentials not configured. ${FCC_BDC_TOKEN_INSTRUCTIONS}`, 503);
  takeRateSlot();
  const url = new URL(path, FCC_BDC_BASE_URL);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, v);
  const r = await fetch(url, {
    headers: { username: creds.username, hash_value: creds.hash_value, accept, "user-agent": "ThriveUp-RuralConnectivity/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new FccBdcUnavailable("upstream", `FCC BDC ${r.status} from ${url.pathname}`, r.status);
  return r;
}

async function bdcJson<T>(path: string, query?: Record<string, string | undefined>): Promise<BdcEnvelope<T>> {
  const r = await bdcFetch(path, query);
  const body = (await r.json()) as Partial<BdcEnvelope<T>>;
  if (!Array.isArray(body?.data)) {
    throw new FccBdcUnavailable("upstream", `FCC BDC returned no data array (status_code ${body?.status_code ?? "?"}: ${body?.message ?? "no message"})`, 502);
  }
  return body as BdcEnvelope<T>;
}

const AS_OF_DATE = /^\d{4}-\d{2}-\d{2}$/;
function assertAsOfDate(d: string): void {
  if (!AS_OF_DATE.test(d)) throw new FccBdcUnavailable("upstream", `as_of_date must be YYYY-MM-DD, got "${d}"`, 400);
}

/** §3.1 */
export const listAsOfDates = () => bdcJson<BdcAsOfDate>("/api/public/map/listAsOfDates");

/** §3.2 */
export function listAvailabilityData(asOfDate: string, filters: { category?: BdcAvailabilityCategory; subcategory?: string; technology_type?: BdcTechnologyType; speed_tier?: "35/3" | "7/1" } = {}) {
  assertAsOfDate(asOfDate);
  return bdcJson<BdcAvailabilityFile>(`/api/public/map/downloads/listAvailabilityData/${asOfDate}`, filters);
}

/** §3.3 */
export function listChallengeData(asOfDate: string, category?: string) {
  assertAsOfDate(asOfDate);
  return bdcJson<BdcChallengeFile>(`/api/public/map/downloads/listChallengeData/${asOfDate}`, { category });
}

/** §3.4 — returns the raw response (zip stream); caller decides where it goes. */
export function downloadMapFile(dataType: BdcDataType, fileId: string | number, gisFileType?: 1 | 2) {
  const tail = gisFileType ? `/${gisFileType}` : "";
  return bdcFetch(`/api/public/map/downloads/downloadFile/${dataType}/${encodeURIComponent(String(fileId))}${tail}`, undefined, "*/*");
}

/** §4.1 */
export const listFundingData = () => bdcJson<BdcFundingFile>("/api/public/fundingmap/downloads/listFundingData");
export const downloadFundingFile = (fileId: string | number) =>
  bdcFetch(`/api/public/fundingmap/downloads/downloadFile/${encodeURIComponent(String(fileId))}`, undefined, "*/*");
export const listReadmeFiles = () => bdcJson<Record<string, unknown>>("/api/public/fundingmap/downloads/listReadmeFiles");

/** §4.2.1 */
export const listGeographyData = () => bdcJson<BdcGeography>("/api/public/fundingmap/downloads/listGeographyData");
