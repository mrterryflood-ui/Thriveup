import { db } from "./storage";
import { justiceIndicators } from "../shared/justice-schema";
import { eq } from "drizzle-orm";

const BJS_DATASETS = [
  {
    name: "NCRP_RELEASES",
    url: "https://bjs.ojp.gov/sites/g/files/xyckuh236/files/media/document/ncrp_releases.csv",
    description: "Prison releases by state, year, demographics",
  },
  {
    name: "NCRP_RECIDIVISM",
    url: "https://bjs.ojp.gov/sites/g/files/xyckuh236/files/media/document/rpr24yr0514yfup0718.csv",
    description: "Recidivism rates: 5-year follow-up, 30-state study",
  },
];

const TEXAS_STATE_FIPS = "48";

interface NcrpRow {
  STATE?: string;
  YEAR?: string;
  COUNTY?: string;
  RACE?: string;
  SEX?: string;
  AGE_GROUP?: string;
  RECIDIVISM_RATE?: string;
  COUNT?: string;
  [key: string]: string | undefined;
}

async function parseCSVFromUrl(url: string): Promise<NcrpRow[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`BJS fetch failed: ${res.status} ${url}`);
  const text = await res.text();
  const lines = text.split("\n").filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const row: NcrpRow = {};
    headers.forEach((h, i) => { row[h] = values[i]; });
    return row;
  });
}

async function ingestRecidivismDataset(rows: NcrpRow[], dataSource: string): Promise<number> {
  let ingested = 0;
  for (const row of rows) {
    const state = row.STATE ?? row.state ?? "";
    if (state && state !== "TX" && state !== "48" && state !== "Texas") continue;
    const year = parseInt(row.YEAR ?? row.year ?? "0");
    if (!year || year < 2015) continue;
    const recidivismRate = parseFloat(row.RECIDIVISM_RATE ?? row.recidivism_rate ?? "0");
    const count = parseInt(row.COUNT ?? row.count ?? "0");
    if (!recidivismRate && !count) continue;
    const demographicGroup = [
      row.RACE ?? row.race,
      row.SEX ?? row.sex,
      row.AGE_GROUP ?? row.age_group,
    ].filter(Boolean).join(", ") || "All";
    try {
      await db.insert(justiceIndicators).values({
        dataType: "recidivism_rate",
        geography: "Texas",
        stateFips: TEXAS_STATE_FIPS,
        reportingYear: year,
        reportingPeriod: `FY${year}`,
        value: recidivismRate || count,
        unit: recidivismRate ? "percent" : "count",
        denominator: count > 0 ? count : undefined,
        demographicGroup,
        dataSource,
        rawData: row as any,
        notes: `Auto-ingested from BJS ${dataSource}`,
      }).onConflictDoNothing();
      ingested++;
    } catch (err) {
      console.error(`[bjs-ingestion] Row skip:`, err);
    }
  }
  return ingested;
}

export async function runBjsIngestion(): Promise<{ success: boolean; ingested: number; errors: string[] }> {
  const errors: string[] = [];
  let totalIngested = 0;
  for (const dataset of BJS_DATASETS) {
    try {
      console.log(`[bjs-ingestion] Fetching ${dataset.name}...`);
      const rows = await parseCSVFromUrl(dataset.url);
      console.log(`[bjs-ingestion] ${dataset.name}: ${rows.length} rows parsed`);
      const count = await ingestRecidivismDataset(rows, dataset.name);
      console.log(`[bjs-ingestion] ${dataset.name}: ${count} rows ingested`);
      totalIngested += count;
    } catch (err: any) {
      const msg = `${dataset.name}: ${err.message}`;
      errors.push(msg);
      console.error(`[bjs-ingestion] Error:`, msg);
    }
  }
  return { success: errors.length === 0, ingested: totalIngested, errors };
}
