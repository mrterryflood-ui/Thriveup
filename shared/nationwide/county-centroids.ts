/**
 * Official county interior-point centroids from the U.S. Census Bureau
 * 2023 National Counties Gazetteer File (INTPTLAT / INTPTLONG).
 * Source: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip
 * Regenerate with scripts/build-county-centroids.ts. Never estimate county coordinates.
 */
import table from "./county-centroids.generated.json";

export interface CountyCentroid { state: string; name: string; lat: number; lon: number }
type Row = [string, string, number, number];
const ROWS = table as unknown as Record<string, Row>;

export const COUNTY_CENTROID_SOURCE = "U.S. Census Bureau 2023 Gazetteer (county interior point)";

/** 5-digit county FIPS (state + county) → centroid; undefined when the FIPS is not a 2023 county/equivalent. */
export function countyCentroid(fips5: string): CountyCentroid | undefined {
  const r = ROWS[fips5];
  return r ? { state: r[0], name: r[1], lat: r[2], lon: r[3] } : undefined;
}

export function countyCentroidsForState(usps: string): Array<CountyCentroid & { fips: string }> {
  const s = usps.toUpperCase();
  return Object.entries(ROWS).filter(([, r]) => r[0] === s).map(([fips, r]) => ({ fips, state: r[0], name: r[1], lat: r[2], lon: r[3] }));
}
