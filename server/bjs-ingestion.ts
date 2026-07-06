/**
 * BJS data ingestion — robust CSV field mapper.
 * Handles format variations across BJS dataset years.
 * Sources: NCRP (National Corrections Reporting Program), BJS statistics tables.
 *
 * Iron Rule #2: all data ingested from primary BJS sources only.
 */

import { db } from "./storage";
import { justiceIndicators } from "../shared/justice-schema";

const TEXAS_STATE_FIPS = "48";
const TEXAS_STATE_CODES = new Set(["TX", "48", "Texas", "TEXAS"]);

// ── BJS dataset registry ──────────────────────────────────────────────────────
const BJS_DATASETS: Array<{
  name: string;
  urls: string[]; // Try in order — first success wins
  dataType: "recidivism_rate" | "incarceration_rate" | "probation_population";
  description: string;
}> = [
  {
    name: "NCRP_RELEASES",
    urls: [
      "https://bjs.ojp.gov/sites/g/files/xyckuh236/files/media/document/ncrp_releases.csv",
      "https://bjs.ojp.gov/data/datasets/national-corrections-reporting-program",
    ],
    dataType: "recidivism_rate",
    description: "NCRP prison releases by state and year",
  },
  {
    name: "BJS_RECIDIVISM_5YR",
    urls: [
      "https://bjs.ojp.gov/sites/g/files/xyckuh236/files/media/document/rpr24yr0514yfup0718.csv",
    ],
    dataType: "recidivism_rate",
    description: "BJS 5-year recidivism follow-up, 30-state study",
  },
];

// ── Header normalization map ──────────────────────────────────────────────────
// Maps all known BJS CSV column name variants to canonical field names.
// Handles variations across years (e.g., "STATE" / "state_cd" / "State" / "STATECODE").
const HEADER_ALIASES: Record<string, string> = {
  // State
  state: "STATE", state_cd: "STATE", statecode: "STATE", statefips: "STATE",
  stateabbr: "STATE", state_abbr: "STATE", relstate: "STATE", state_name: "STATE_NAME",

  // Year
  year: "YEAR", releaseyear: "YEAR", release_year: "YEAR", reportyear: "YEAR",
  report_year: "YEAR", datacollectyear: "YEAR", survey_year: "YEAR", cy: "YEAR",

  // Count / value
  count: "COUNT", releases: "COUNT", total: "COUNT", n: "COUNT",
  totalreleases: "COUNT", num_releases: "COUNT", total_count: "COUNT",

  // Recidivism rate
  recidivism_rate: "RECIDIVISM_RATE", recid_rate: "RECIDIVISM_RATE",
  rearrest_rate: "RECIDIVISM_RATE", reconviction_rate: "RECIDIVISM_RATE",
  reincarceration_rate: "RECIDIVISM_RATE", pct_rearrested: "RECIDIVISM_RATE",
  pct_reconvicted: "RECIDIVISM_RATE", pct_reincarcerated: "RECIDIVISM_RATE",
  recidivism_pct: "RECIDIVISM_RATE",

  // Race/ethnicity
  race: "RACE", raceethnicity: "RACE", race_ethnicity: "RACE",
  racecd: "RACE", race_cd: "RACE", ethnicity: "ETHNICITY",

  // Sex/gender
  sex: "SEX", gender: "SEX", sexcd: "SEX",

  // Age
  age_group: "AGE_GROUP", agegroup: "AGE_GROUP", age_cat: "AGE_GROUP",
  age_category: "AGE_GROUP", agegrp: "AGE_GROUP",

  // Offense type
  offense: "OFFENSE", offensetype: "OFFENSE", offense_type: "OFFENSE",
  crimecat: "OFFENSE", crime_category: "OFFENSE",

  // Follow-up period
  followup: "FOLLOWUP_YEARS", followup_years: "FOLLOWUP_YEARS",
  follow_up_period: "FOLLOWUP_YEARS",

  // Supervision type
  supervision_type: "SUPERVISION", supervision: "SUPERVISION",
  releasetype: "SUPERVISION", release_type: "SUPERVISION",
};

// ── Race/ethnicity normalization ──────────────────────────────────────────────
const RACE_MAP: Record<string, string> = {
  "1": "White", "2": "Black", "3": "Hispanic", "4": "Other",
  "W": "White", "B": "Black", "H": "Hispanic", "O": "Other",
  "A": "Asian/Pacific Islander", "I": "American Indian/Alaska Native",
  "white": "White", "black": "Black", "hispanic": "Hispanic",
  "latino": "Hispanic", "asian": "Asian/Pacific Islander",
  "native": "American Indian/Alaska Native",
  "multiracial": "Multiracial", "unknown": "Unknown",
};

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  // Handle quoted fields
  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const rawHeaders = splitLine(lines[0]);

  // Normalize headers
  const headers = rawHeaders.map(h => {
    const normalized = h.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    return HEADER_ALIASES[normalized] ?? h.trim().toUpperCase();
  });

  return lines.slice(1).map(line => {
    const values = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

// ── State detection ───────────────────────────────────────────────────────────
function isTexas(row: Record<string, string>): boolean {
  const stateVal = (row["STATE"] ?? row["STATE_NAME"] ?? "").trim();
  if (!stateVal) return true; // No state filter = accept all (national dataset)
  return TEXAS_STATE_CODES.has(stateVal) || stateVal === "48" || stateVal === "Texas";
}

// ── Year extraction ───────────────────────────────────────────────────────────
function extractYear(row: Record<string, string>): number | null {
  const raw = row["YEAR"] ?? "";
  if (!raw) return null;
  const year = parseInt(raw);
  if (isNaN(year) || year < 2000 || year > 2035) return null;
  return year;
}

// ── Value extraction ──────────────────────────────────────────────────────────
function extractValue(row: Record<string, string>): { value: number; unit: string } | null {
  // Prefer recidivism rate if available
  const rateRaw = row["RECIDIVISM_RATE"] ?? "";
  if (rateRaw) {
    const rate = parseFloat(rateRaw.replace("%", ""));
    if (!isNaN(rate) && rate > 0 && rate <= 100) {
      return { value: rate, unit: "percent" };
    }
  }

  // Fall back to count
  const countRaw = row["COUNT"] ?? "";
  if (countRaw) {
    const count = parseInt(countRaw.replace(/,/g, ""));
    if (!isNaN(count) && count > 0) {
      return { value: count, unit: "count" };
    }
  }

  return null;
}

// ── Demographic group builder ─────────────────────────────────────────────────
function buildDemographicGroup(row: Record<string, string>): string {
  const parts: string[] = [];

  const race = RACE_MAP[(row["RACE"] ?? "").toLowerCase()] ?? row["RACE"];
  if (race && race !== "Unknown") parts.push(race);

  const sex = row["SEX"];
  if (sex === "1" || sex?.toLowerCase() === "male") parts.push("Male");
  else if (sex === "2" || sex?.toLowerCase() === "female") parts.push("Female");
  else if (sex) parts.push(sex);

  const age = row["AGE_GROUP"];
  if (age) parts.push(`Age: ${age}`);

  const offense = row["OFFENSE"];
  if (offense) parts.push(`Offense: ${offense}`);

  const supervision = row["SUPERVISION"];
  if (supervision) parts.push(supervision);

  const followup = row["FOLLOWUP_YEARS"];
  if (followup) parts.push(`${followup}-yr follow-up`);

  return parts.join(", ") || "All";
}

// ── Fetch with retry ──────────────────────────────────────────────────────────
async function fetchCSV(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { "Accept": "text/csv, text/plain, */*" },
      });
      if (!res.ok) {
        console.warn(`[bjs] HTTP ${res.status} for ${url}`);
        continue;
      }
      const text = await res.text();
      if (text.length < 50) {
        console.warn(`[bjs] Response too short from ${url}`);
        continue;
      }
      return text;
    } catch (err: any) {
      console.warn(`[bjs] Fetch failed for ${url}: ${err.message}`);
    }
  }
  return null;
}

// ── Main ingestion function ───────────────────────────────────────────────────
async function ingestDataset(
  dataset: typeof BJS_DATASETS[0],
): Promise<{ ingested: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];

  const text = await fetchCSV(dataset.urls);
  if (!text) {
    errors.push(`${dataset.name}: all URLs failed`);
    return { ingested: 0, skipped: 0, errors };
  }

  const rows = parseCSV(text);
  console.log(`[bjs] ${dataset.name}: parsed ${rows.length} rows`);

  let ingested = 0;
  let skipped = 0;

  for (const row of rows) {
    // Filter to Texas
    if (!isTexas(row)) { skipped++; continue; }

    const year = extractYear(row);
    if (!year) { skipped++; continue; }

    const val = extractValue(row);
    if (!val) { skipped++; continue; }

    const demographicGroup = buildDemographicGroup(row);

    try {
      await db.insert(justiceIndicators).values({
        dataType: dataset.dataType,
        geography: "Texas",
        stateFips: TEXAS_STATE_FIPS,
        reportingYear: year,
        reportingPeriod: `FY${year}`,
        value: val.value,
        unit: val.unit,
        demographicGroup,
        dataSource: dataset.name,
        rawData: row as any,
        notes: `BJS auto-ingestion: ${dataset.description}`,
      }).onConflictDoNothing();
      ingested++;
    } catch (err: any) {
      errors.push(`${dataset.name} row: ${err.message}`);
      skipped++;
    }
  }

  return { ingested, skipped, errors };
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function runBjsIngestion(): Promise<{
  success: boolean;
  ingested: number;
  errors: string[];
  datasetsProcessed: number;
}> {
  let totalIngested = 0;
  const allErrors: string[] = [];
  let datasetsProcessed = 0;

  for (const dataset of BJS_DATASETS) {
    console.log(`[bjs] Processing ${dataset.name}...`);
    try {
      const result = await ingestDataset(dataset);
      totalIngested += result.ingested;
      allErrors.push(...result.errors);
      if (result.ingested > 0) datasetsProcessed++;
      console.log(`[bjs] ${dataset.name}: ${result.ingested} ingested, ${result.skipped} skipped, ${result.errors.length} errors`);
    } catch (err: any) {
      const msg = `${dataset.name}: fatal — ${err.message}`;
      allErrors.push(msg);
      console.error(`[bjs] Fatal:`, msg);
    }
  }

  return {
    success: allErrors.length === 0,
    ingested: totalIngested,
    errors: allErrors,
    datasetsProcessed,
  };
}
