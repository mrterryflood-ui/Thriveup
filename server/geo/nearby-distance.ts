export interface FilingPoint { lat: number; lon: number }
/** Great-circle distance between Census interior points, not travel or service-area distance. */
export function milesBetween(a: FilingPoint, b: FilingPoint): number {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
export function nearestFilingMiles(origins: FilingPoint[], destination: FilingPoint): number | null {
  return origins.length ? Math.min(...origins.map(origin => milesBetween(origin, destination))) : null;
}