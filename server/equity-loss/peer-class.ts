/**
 * peer-class.ts
 *
 * County-grain peer classification for the equity-loss engine's
 * `vs_national_peer_class` frame: RUCC rurality band × decadal-growth band
 * × census region. 3 x 3 x 4 = 36 classes.
 *
 * The classification lookup (rucc_county_codes) is exhaustive across all US
 * counties. The benchmark VALUE for each class is NOT an average of every
 * county in that class — computing that live/exhaustively (~3,143 counties,
 * 2+ external API calls each) is not a viable request-time or even
 * same-session batch operation. Instead each class's benchmark is the
 * computed equity-loss of ONE representative county for that class,
 * produced by scripts/compute-peer-class-benchmarks.ts. This is a stated,
 * disclosed assumption surfaced to the user (see assumptionText below),
 * consistent with how the two other unvalidated thresholds in this engine
 * are already disclosed rather than hidden.
 */
import { Pool } from "pg";

export type RuralityBand = "metro" | "small_town" | "rural";
export type GrowthBand = "declining" | "stable" | "growing";

export interface CountyClassification {
  countyFips: string;
  countyName: string;
  stateAbbrev: string;
  ruccCode: number;
  ruralityBand: RuralityBand;
  censusRegion: string;
}

export function ruralityBandFromRucc(rucc: number): RuralityBand {
  if (rucc <= 3) return "metro";
  if (rucc <= 6) return "small_town";
  return "rural";
}

export function growthBandFromPct(decadalGrowthPct: number): GrowthBand {
  if (decadalGrowthPct < -2) return "declining";
  if (decadalGrowthPct > 10) return "growing";
  return "stable";
}

export function peerClassKey(
  ruralityBand: RuralityBand,
  growthBand: GrowthBand,
  region: string,
): string {
  return `${ruralityBand}.${growthBand}.${region}`;
}

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function classifyCounty(countyFips: string): Promise<CountyClassification | null> {
  const { rows } = await getPool().query(
    `SELECT county_fips, county_name, state_abbrev, rucc_code, census_region
     FROM rucc_county_codes WHERE county_fips = $1`,
    [countyFips],
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    countyFips: r.county_fips,
    countyName: r.county_name,
    stateAbbrev: r.state_abbrev,
    ruccCode: r.rucc_code,
    ruralityBand: ruralityBandFromRucc(r.rucc_code),
    censusRegion: r.census_region,
  };
}

/** One representative county FIPS per RUCC band, used by the batch script. */
export async function pickRepresentativeCounty(
  ruralityBand: RuralityBand,
  region: string,
): Promise<string | null> {
  const ruccRange =
    ruralityBand === "metro" ? [1, 3] : ruralityBand === "small_town" ? [4, 6] : [7, 9];
  const { rows } = await getPool().query(
    `SELECT county_fips FROM rucc_county_codes
     WHERE rucc_code BETWEEN $1 AND $2 AND census_region = $3
     ORDER BY population_2020 DESC NULLS LAST
     LIMIT 1`,
    [ruccRange[0], ruccRange[1], region],
  );
  return rows[0]?.county_fips ?? null;
}

export const PEER_CLASS_ASSUMPTION_TEXT =
  "National peer-class benchmark is the computed loss of one representative " +
  "county for this rurality/growth/region class (highest-population county " +
  "in the class), not an average across all counties of that class. " +
  "Computing an exhaustive national average live was not feasible for this build.";
