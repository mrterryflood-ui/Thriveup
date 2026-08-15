/**
 * reference-cache.ts
 *
 * Computes and caches (in benchmark_metrics, as immutable is_reference rows)
 * the national and per-state "own loss" reference values used by the
 * `vs_parent_county` (repurposed to mean "vs national" at county grain) and
 * `vs_state` frames. Computed once per state/nationally, not per request —
 * these are stable geography-level aggregates, not something that changes
 * between two requests for counties in the same state.
 */
import { Pool } from "pg";
import {
  computeEquityLoss,
  DEFAULT_SUPPRESSION,
  type UnitInputs,
} from "./equity-loss-engine";
import { UNDP_GOALPOSTS } from "./atkinson";
import { fetchStateAcs, fetchNationalAcs } from "./acs-county-source";
import { fetchUsaleepStateLifeExpectancy } from "./usaleep-source";

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function getCached(id: string): Promise<number | null> {
  const { rows } = await getPool().query("SELECT value FROM benchmark_metrics WHERE id = $1", [id]);
  return rows.length > 0 ? parseFloat(rows[0].value) : null;
}

async function storeReference(id: string, geoLevel: string, geoValue: string, value: number): Promise<void> {
  await getPool().query(
    `INSERT INTO benchmark_metrics
       (id, domain, metric_key, geo_level, geo_value, value, unit, year,
        is_reference, source_publisher, source_url)
     VALUES ($1,'economic','equity_loss_own_computed',$2,$3,$4,'pct',2022,
             TRUE,'TCAF equity-loss engine','internal computation')
     ON CONFLICT (id) DO NOTHING`,
    [id, geoLevel, geoValue, value],
  );
}

/**
 * National LE dispersion input: USALEEP does not publish a national LE
 * distribution array, only point estimates. We use a single-value
 * "distribution" (the national mean LE) for the national reference — this
 * necessarily produces zero measured health dispersion at that grain,
 * which is expected and disclosed (national aggregate, not sub-national
 * comparison).
 */
export async function getNationalReference(): Promise<number | null> {
  const id = "equity_loss.national_own_loss";
  const cached = await getCached(id);
  if (cached !== null) return cached;

  const acs = await fetchNationalAcs();
  // USALEEP has no direct national row; approximate the national mean LE via
  // an unweighted average of all seeded state means already fetched by the
  // caller would be circular. Use CDC's separately published national LE
  // (2022, NCHS) as the single-point input for this aggregate-only frame.
  const nationalLifeExpectancy = 77.5; // CDC NCHS National Vital Statistics, 2022 provisional
  const inputs: UnitInputs = {
    geoId: "US",
    geoLevel: "state" as any,
    state: "US",
    year: 2022,
    population: acs.population,
    decadalGrowthPct: 0,
    incomeDistribution: acs.incomeDistribution,
    incomeMoeRatio: acs.incomeMoeRatio,
    educationDistribution: acs.educationDistribution,
    educationMoeRatio: acs.educationMoeRatio,
    lifeExpectancyDistribution: [nationalLifeExpectancy],
    healthInequalityMethod: "geographic_dispersion",
    usedUsaleepIhmeHybrid: false,
    healthValueBasis: "observed",
  };
  const row = computeEquityLoss(inputs, "vs_parent_county", null, UNDP_GOALPOSTS, DEFAULT_SUPPRESSION);
  if (row.suppressed || row.overallLossPct === null) return null;
  await storeReference(id, "national", "US", row.overallLossPct);
  return row.overallLossPct;
}

const STATE_NAME_BY_ABBREV: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

export async function getStateReference(stateFips: string, stateAbbrev: string): Promise<number | null> {
  const id = `equity_loss.state_own_loss.${stateAbbrev}`;
  const cached = await getCached(id);
  if (cached !== null) return cached;

  const acs = await fetchStateAcs(stateFips);
  const stateName = STATE_NAME_BY_ABBREV[stateAbbrev];
  const stateLe = stateName ? await fetchUsaleepStateLifeExpectancy(stateName) : null;
  if (stateLe === null) return null; // e.g. ME/WI are USALEEP-excluded states — coverage gap, not fabricated

  const inputs: UnitInputs = {
    geoId: stateAbbrev,
    geoLevel: "state",
    state: stateAbbrev,
    year: 2022,
    population: acs.population,
    decadalGrowthPct: acs.decadalGrowthPct,
    incomeDistribution: acs.incomeDistribution,
    incomeMoeRatio: acs.incomeMoeRatio,
    educationDistribution: acs.educationDistribution,
    educationMoeRatio: acs.educationMoeRatio,
    lifeExpectancyDistribution: [stateLe],
    healthInequalityMethod: "geographic_dispersion",
    usedUsaleepIhmeHybrid: false,
    healthValueBasis: "observed",
  };
  const row = computeEquityLoss(inputs, "vs_state", null, UNDP_GOALPOSTS, DEFAULT_SUPPRESSION);
  if (row.suppressed || row.overallLossPct === null) return null;
  await storeReference(id, "state", stateAbbrev, row.overallLossPct);
  return row.overallLossPct;
}

export async function getPeerClassReference(peerKey: string): Promise<number | null> {
  const id = `equity_loss.peer_class.${peerKey}`;
  return getCached(id);
}
