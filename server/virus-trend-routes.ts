import type { Express, Request, Response } from "express";
import { getLatestRpliceEvidence } from "./rplice-inbound-routes";

const CDC_DATASET = "2ew6-ywp6";
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: VirusTrendResponse }>();

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
  rplIceOutbreakFindings: Array<{
    id: string;
    receivedAt: string;
    region: string | null;
    finding: string | null;
    evidenceLevel: string | null;
    citations: string[];
    source: "RPLICE inbound evidence feed";
    status: "evidence";
  }>;
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

export function registerVirusTrendRoutes(app: Express) {
  app.get("/api/public-health/virus-trends", async (req: Request, res: Response) => {
    try {
      const state = textOrNull(req.query.state)?.toUpperCase() ?? null;
      const city = textOrNull(req.query.city);
      const requestedDays = Number(req.query.days ?? 90);
      const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.round(requestedDays), 30), 365) : 90;
      if (state && !/^[A-Z]{2}$/.test(state)) {
        return res.status(400).json({ error: "state must be a two-letter US state code" });
      }

      const key = `${state ?? ""}|${city?.toLowerCase() ?? ""}|${days}`;
      const cached = cache.get(key);
      if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);

      const observations = await fetchCdcObservations(state, city, days);
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

      const result: VirusTrendResponse = {
        generatedAt: new Date().toISOString(),
        filters: { state, city, days },
        observations: observations.slice(0, 250),
        trend,
        rplIceOutbreakFindings: buildRplIceFindings(),
        sources: [
          { name: "CDC National Wastewater Surveillance System (NWSS)", url: "https://data.cdc.gov/Public-Health/NWSS-Public-SARS-CoV-2-Wastewater-Metric-Data/2ew6-ywp6", type: "observed" },
          { name: "RPLICE inbound evidence feed", url: "/api/inbound/rplice/latest", type: "evidence" },
        ],
        coverage: {
          virusObservation: "Observed SARS-CoV-2 wastewater metrics from reporting sites. A missing city or state is not evidence of no virus activity.",
          rpliceOutbreaks: "Only outbreak-related RPLICE evidence events received by this running ThriveUp process appear here. No RPLICE event means unavailable, not zero.",
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