/** Shared read-only contract for the Phase 4 community map. No personal journey data. */
export interface MapZipCluster {
  zip: string; lat: number; lon: number; orgCount: number;
  domains: Record<string, number>; topOrg: { ein: string; name: string } | null;
}
export interface MapCountyNeed {
  fips: string; name: string; lat: number; lon: number;
  sviPercentile: number | null; povertyRate: number | null; population: number | null;
  focus: boolean; vintage: string | null;
}
export interface MapResourcePin {
  id: string; name: string; category: string; lat: number; lon: number; address: string | null;
}
export interface MagnetMapPayload {
  community: { city: string; state: string };
  gravity: {
    clusters: MapZipCluster[]; orgsPlaced: number; orgsUnplaced: number;
    source: string; fetchedAt: string | null;
  };
  need: { counties: MapCountyNeed[]; source: string; measure: string };
  resources: { pins: MapResourcePin[]; source: string };
  limits: string[];
}