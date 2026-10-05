/** Census 2023 ZCTA Gazetteer interior points (server-only). ZIP ≈ ZCTA; non-ZCTA ZIPs (PO boxes) return undefined. */
import table from "./zcta-centroids.generated.json";
const ROWS = table as unknown as Record<string, [number, number]>;
export const ZCTA_CENTROID_SOURCE = "U.S. Census Bureau 2023 ZCTA Gazetteer (interior point)";
export function zctaCentroid(zip: string): { lat: number; lon: number } | undefined {
  const r = ROWS[zip.slice(0, 5)];
  return r ? { lat: r[0], lon: r[1] } : undefined;
}
