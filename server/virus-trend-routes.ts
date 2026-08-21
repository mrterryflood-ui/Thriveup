import type { Express, Request, Response } from "express";
import { getLatestRpliceEvidence } from "./rplice-inbound-routes";

const CDC_DATASET = "2ew6-ywp6";
const RPLICE_THRIVEUP_API = (process.env.RPLICE_THRIVEUP_API_URL || "https://www.bettersciencelab.com/api/v1/thriveup").replace(/\/$/, "");
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: VirusTrendResponse }>();
const requestCounts = new Map<string, { startedAt: number; count: number }>();

type VirusObservation = {
  state: string;
  county: string | null;
  city: string | null;
  date: string;
  detectionRate: number | null;
  percentile: number | null;
  populationServed: number | null;
  source: "CDC NWSS";
  status: "observed";
};

type VirusTrendResponse = {
  generatedAt: string;
  filters: { state: string | null; city: string | null; days: number };
  observations: VirusObservation[];
  trend: { date: string; averageDetectionRate: number | null; reportingSites: number }[];
  stateSummary: { state: string; observations: number; reportingSites: number; latestDate: string | null; averageDetectionRate: number | null }[];
  latestObservedDate: string | null;
  rplIceOutbreakFindings: Array<{
    id: string;
    receivedAt: string;
    region: string | null;
    finding: string | null;
    evidenceLevel: string | null;
    citations: string[];
    source: "RPLICE inbound evidence feed" | "RPLICE ThriveUp surveillance API";
    status: "evidence";
  }>;
  rpliceApi: { available: boolean; source: string; note: string };
  sources: Array<{ name: string; url: string; type: "observed" | "evidence" }>;
  coverage: {
    virusObservation: string;
    rpliceOutbreaks: string;
  };
};

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildRplIceFindings() {
  return getLatestRpliceEvidence()
    .filter((event) => {
      const searchable = JSON.stringify({
        finding: event.finding,
        program: event.program,
        region: event.region,
        meta: event.meta,
      }).toLowerCase();
      return /\b(outbreak|virus|viral|infectious|respiratory|disease|pathogen)\b/.test(searchable);
    })
    .slice(0, 25)
    .map((event) => ({
      id: event.id,
      receivedAt: event.receivedAt,
      region: event.region ?? null,
      finding: event.finding ?? null,
      evidenceLevel: event.evidenceLevel ?? null,
      citations: event.citations ?? [],
      source: "RPLICE inbound evidence feed" as const,
      status: "evidence" as const,
    }));
}

async function fetchCdcObservations(state: string | null, city: string | null, days: number): Promise<VirusObservation[]> {
  const clauses = [
    "date_end IS NOT NULL",
    `date_end >= '${new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)}'`,
  ];
  if (state) clauses.push(`upper(reporting_jurisdiction)='${state.replace(/'/g, "''")}'`);
  if (city) {
    const escaped = city.replace(/'/g, "''").toUpperCase();
    clauses.push(`(upper(sample_location_specify) like '%${escaped}%' OR upper(county_names) like '%${escaped}%')`);
  }

  const params = new URLSearchParams({
    "$select": "reporting_jurisdiction,county_names,sample_location_specify,date_end,detect_prop_15d,percentile,population_served",
    "$where": clauses.join(" AND "),
    "$order": "date_end DESC",
    "$limit": "1000",
  });
  const response = await fetch(`https://data.cdc.gov/resource/${CDC_DATASET}.json?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`CDC NWSS returned ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("CDC NWSS returned an unexpected response");

  return rows.map((row: any) => ({
    state: textOrNull(row.reporting_jurisdiction) ?? "Unknown",
    county: textOrNull(row.county_names),
    city: textOrNull(row.sample_location_specify),
    date: textOrNull(row.date_end) ?? "",
    detectionRate: numberOrNull(row.detect_prop_15d),
    percentile: numberOrNull(row.percentile),
    populationServed: numberOrNull(row.population_served),
    source: "CDC NWSS" as const,
    status: "observed" as const,
  })).filter((row: VirusObservation) => row.date);
}

let discoveryCache: { checkedAt: number; advertised: Set<string> | null; discoveryOk: boolean } | null = null;
const DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;

// Discovery-first: ask the upstream RPLICE ThriveUp API what it actually advertises
// before assuming any surveillance endpoint exists. If discovery itself is
// unavailable (e.g. not implemented at this host), we fall back to the
// documented integration contract endpoints but disclose that the fallback
// was NOT capability-verified, rather than silently pretending it was.
async function getAdvertisedCapabilities(): Promise<{ advertised: Set<string> | null; discoveryOk: boolean }> {
  if (discoveryCache && Date.now() - discoveryCache.checkedAt < DISCOVERY_CACHE_TTL_MS) {
    return { advertised: discoveryCache.advertised, discoveryOk: discoveryCache.discoveryOk };
  }
  try {
    const response = await fetch(`${RPLICE_THRIVEUP_API}/_discovery`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) {
      discoveryCache = { checkedAt: Date.now(), advertised: null, discoveryOk: false };
      return { advertised: null, discoveryOk: false };
    }
    const body = await response.json();
    const capabilities: unknown = body?.capabilities ?? body?.endpoints ?? body?.surfaces;
    const advertised = new Set<string>(
      Array.isArray(capabilities)
        ? capabilities.filter((v): v is string => typeof v === "string")
        : []
    );
    discoveryCache = { checkedAt: Date.now(), advertised, discoveryOk: true };
    return { advertised, discoveryOk: true };
  } catch {
    discoveryCache = { checkedAt: Date.now(), advertised: null, discoveryOk: false };
    return { advertised: null, discoveryOk: false };
  }
}

async function fetchRpliceSurveillance(state: string | null, city: string | null) {
  const { advertised, discoveryOk } = await getAdvertisedCapabilities();

  const candidateEndpoints = ["surveillance/summary", "surveillance/outbreaks", "surveillance/osint-feed"];
  // Only call an endpoint if discovery explicitly advertised it, OR discovery
  // itself was unavailable (unknown, not confirmed-absent) — in which case we
  // fall back to the documented contract but mark the result unverified.
  const endpointsToTry = discoveryOk
    ? candidateEndpoints.filter((ep) => advertised?.has(ep))
    : candidateEndpoints;

  if (discoveryOk && endpointsToTry.length === 0) {
    return { available: false, verified: true, discoveryOk: true, summary: null, outbreaks: [], osint: [] };
  }

  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (city) params.set("city", city);
  const suffix = params.toString() ? `?${params}` : "";

  const responses = await Promise.all(
    endpointsToTry.map((ep) =>
      fetch(`${RPLICE_THRIVEUP_API}/${ep}${suffix}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) })
        .catch(() => null)
    )
  );
  if (!responses.some((response) => response && response.ok)) {
    return { available: false, verified: discoveryOk, discoveryOk, summary: null, outbreaks: [], osint: [] };
  }
  const read = async (response: globalThis.Response | null) => response && response.ok ? response.json() : null;
  const byName = new Map(endpointsToTry.map((ep, i) => [ep, responses[i]] as const));
  const [summary, outbreaks, osint] = await Promise.all([
    read(byName.get("surveillance/summary") ?? null),
    read(byName.get("surveillance/outbreaks") ?? null),
    read(byName.get("surveillance/osint-feed") ?? null),
  ]);
  const asItems = (value: any): any[] => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.items) ? value.items : Array.isArray(value?.results) ? value.results : [];
  return { available: true, verified: discoveryOk, discoveryOk, summary, outbreaks: asItems(outbreaks), osint: asItems(osint) };
}

function normalizeRpliceFindings(feed: any[]) {
  return feed.slice(0, 25).map((item: any, index) => ({
    id: String(item.id ?? item.outbreakId ?? item.guid ?? `rplice_api_${index}`),
    receivedAt: textOrNull(item.receivedAt ?? item.updatedAt ?? item.publishedAt ?? item.date) ?? new Date().toISOString(),
    region: textOrNull(item.region ?? item.location ?? item.city ?? item.state),
    finding: textOrNull(item.finding ?? item.summary ?? item.description ?? item.title ?? item.headline),
    evidenceLevel: textOrNull(item.evidenceLevel ?? item.confidence ?? item.status),
    citations: Array.isArray(item.citations) ? item.citations.filter((value: unknown): value is string => typeof value === "string").slice(0, 5) : [],
    source: "RPLICE ThriveUp surveillance API" as const,
    status: "evidence" as const,
  }));
}

export function registerVirusTrendRoutes(app: Express) {
  app.get("/api/public-health/virus-trends", async (req: Request, res: Response) => {
    try {
      const ip = req.ip || "unknown";
      const now = Date.now();
      const window = requestCounts.get(ip);
      if (!window || now - window.startedAt >= 60_000) {
        requestCounts.set(ip, { startedAt: now, count: 1 });
      } else if (window.count >= 30) {
        return res.status(429).json({ error: "Too many requests. Limit: 30/min." });
      } else {
        window.count++;
      }
      const state = textOrNull(req.query.state)?.toUpperCase() ?? null;
      const city = textOrNull(req.query.city);
      const requestedDays = Number(req.query.days ?? 365);
      const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.round(requestedDays), 30), 365) : 90;
      if (state && !/^[A-Z]{2}$/.test(state)) {
        return res.status(400).json({ error: "state must be a two-letter US state code" });
      }

      const key = `${state ?? ""}|${city?.toLowerCase() ?? ""}|${days}`;
      const cached = cache.get(key);
      if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);

      const [observations, rplice] = await Promise.all([
        fetchCdcObservations(state, city, days),
        fetchRpliceSurveillance(state, city),
      ]);
      const grouped = new Map<string, VirusObservation[]>();
      for (const observation of observations) {
        const list = grouped.get(observation.date) ?? [];
        list.push(observation);
        grouped.set(observation.date, list);
      }
      const trend = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => {
        const values = rows.map((row) => row.detectionRate).filter((value): value is number => value !== null);
        return {
          date,
          averageDetectionRate: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
          reportingSites: rows.length,
        };
      });
      const byState = new Map<string, VirusObservation[]>();
      for (const observation of observations) {
        const rows = byState.get(observation.state) ?? [];
        rows.push(observation);
        byState.set(observation.state, rows);
      }
      const stateSummary = [...byState.entries()].map(([stateCode, rows]) => {
        const values = rows.map((row) => row.detectionRate).filter((value): value is number => value !== null);
        return {
          state: stateCode,
          observations: rows.length,
          reportingSites: new Set(rows.map((row) => row.city ?? row.county ?? row.state)).size,
          latestDate: rows.map((row) => row.date).sort().at(-1) ?? null,
          averageDetectionRate: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
        };
      }).sort((a, b) => b.observations - a.observations);

      const apiFindings = normalizeRpliceFindings([...rplice.outbreaks, ...rplice.osint]);
      const result: VirusTrendResponse = {
        generatedAt: new Date().toISOString(),
        filters: { state, city, days },
        observations: observations.slice(0, 250),
        trend,
        stateSummary,
        latestObservedDate: observations.map((row) => row.date).sort().at(-1) ?? null,
        rplIceOutbreakFindings: [...apiFindings, ...buildRplIceFindings()].slice(0, 25),
        rpliceApi: {
          available: rplice.available,
          source: RPLICE_THRIVEUP_API,
          note: rplice.available
            ? "RPLICE surveillance, outbreak, and OSINT endpoints responded successfully."
            : "The configured RPLICE ThriveUp surveillance endpoints did not respond successfully; the page is showing CDC observations and any locally received RPLICE evidence events.",
        },
        sources: [
          { name: "CDC National Wastewater Surveillance System (NWSS)", url: "https://data.cdc.gov/Public-Health/NWSS-Public-SARS-CoV-2-Wastewater-Metric-Data/2ew6-ywp6", type: "observed" },
          { name: "RPLICE inbound evidence feed", url: "/api/inbound/rplice/latest", type: "evidence" },
        ],
        coverage: {
          virusObservation: "Observed SARS-CoV-2 wastewater metrics from reporting sites. A missing city or state is not evidence of no virus activity.",
          rpliceOutbreaks: rplice.available
            ? "RPLICE outbreak and OSINT records are evidence items, not a complete case-count denominator. Empty results mean no records were returned for this query."
            : "The RPLICE surveillance API was unavailable. Any local RPLICE evidence events shown are not a complete outbreak feed.",
        },
      };
      cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
      res.json(result);
    } catch (err: any) {
      console.error("[virus-trends] GET error:", err);
      res.status(502).json({ error: "Virus trend data is temporarily unavailable.", detail: err.message });
    }
  });
}