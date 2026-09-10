import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon path issue in bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface GeoPoint {
  id: string;
  label: string;
  lat: number;
  lon: number;
  needScore: number; // 0–100
  metrics: Record<string, { value: number; label: string; unit?: string }>;
}

export interface Correlation {
  fromId: string;
  toId: string;
  metric: string;
  pearsonR: number;
}

export interface GisNeedHeatMapProps {
  points: GeoPoint[];
  correlations?: Correlation[];
  height?: string;
  className?: string;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function needColor(score: number): string {
  if (score > 70) return "#dc2626"; // red
  if (score > 40) return "#d97706"; // amber
  return "#16a34a";                  // green
}

function correlationColor(r: number): string {
  return r >= 0 ? "#3b82f6" : "#8b5cf6";
}

function needRadius(score: number): number {
  return 12 + (score / 100) * 28; // 12–40 px
}

// ── Bezier arc helper ─────────────────────────────────────────────────────────
// Returns 20 LatLng points along a quadratic Bezier curve between A and B,
// with a control point offset perpendicular to AB so the arc curves visually.

function bezierArc(
  a: [number, number],
  b: [number, number],
  r: number,
  steps = 20,
): [number, number][] {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dy = lat2 - lat1;
  const dx = lon2 - lon1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offsetMag = len * 0.35 * (r >= 0 ? 1 : -1);
  // Perpendicular unit vector: (-dy, dx) rotated
  const perpLat = (-dx / len) * offsetMag;
  const perpLon = ( dy / len) * offsetMag;
  const cx = (lat1 + lat2) / 2 + perpLat;
  const cy = (lon1 + lon2) / 2 + perpLon;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const lat = mt * mt * lat1 + 2 * mt * t * cx + t * t * lat2;
    const lon = mt * mt * lon1 + 2 * mt * t * cy + t * t * lon2;
    pts.push([lat, lon]);
  }
  return pts;
}

// ── Auto-fit bounds ───────────────────────────────────────────────────────────

function BoundsFitter({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length === 0) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
    fitted.current = true;
  }, [map, points]);
  return null;
}

// ── Legend ────────────────────────────────────────────────────────────────────

function MapLegend() {
  return (
    <div
      className="absolute bottom-6 right-2 z-[1000] bg-white/95 dark:bg-slate-900/95 border border-border rounded-lg shadow-lg p-3 text-xs space-y-1.5 pointer-events-none"
      style={{ minWidth: 160 }}
    >
      <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Need Score</div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#dc2626" }} />
        <span className="text-slate-600 dark:text-slate-300">High (&gt;70)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#d97706" }} />
        <span className="text-slate-600 dark:text-slate-300">Moderate (40–70)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#16a34a" }} />
        <span className="text-slate-600 dark:text-slate-300">Low (&lt;40)</span>
      </div>
      <div className="border-t border-border my-1" />
      <div className="font-semibold text-slate-700 dark:text-slate-200">Correlation Arc</div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-6 rounded" style={{ background: "#3b82f6" }} />
        <span className="text-slate-600 dark:text-slate-300">Positive r</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-6 rounded" style={{ background: "#8b5cf6" }} />
        <span className="text-slate-600 dark:text-slate-300">Negative r</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GisNeedHeatMap({
  points,
  correlations = [],
  height = "480px",
  className = "",
}: GisNeedHeatMapProps) {
  const center: [number, number] = points.length > 0
    ? [
        points.reduce((s, p) => s + p.lat, 0) / points.length,
        points.reduce((s, p) => s + p.lon, 0) / points.length,
      ]
    : [39.5, -98.35]; // continental US center

  const pointMap = Object.fromEntries(points.map(p => [p.id, p]));

  const significantCorrelations = correlations.filter(c => Math.abs(c.pearsonR) >= 0.55);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border shadow ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={points.length === 0 ? 4 : 7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsFitter points={points} />

        {/* Correlation arcs — drawn first so circles render on top */}
        {significantCorrelations.map((corr, i) => {
          const from = pointMap[corr.fromId];
          const to = pointMap[corr.toId];
          if (!from || !to) return null;
          const arcPts = bezierArc([from.lat, from.lon], [to.lat, to.lon], corr.pearsonR);
          const midIdx = Math.floor(arcPts.length / 2);
          const midPt = arcPts[midIdx];
          return (
            <Polyline
              key={`arc-${i}`}
              positions={arcPts}
              pathOptions={{
                color: correlationColor(corr.pearsonR),
                weight: 1 + Math.abs(corr.pearsonR) * 3,
                opacity: 0.65,
                dashArray: undefined,
              }}
            >
              <Popup position={midPt}>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold">{corr.metric}</div>
                  <div>r = {corr.pearsonR.toFixed(2)}</div>
                  <div className="text-muted-foreground">{from.label} ↔ {to.label}</div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Need-heat circles */}
        {points.map(pt => (
          <CircleMarker
            key={pt.id}
            center={[pt.lat, pt.lon]}
            radius={needRadius(pt.needScore)}
            pathOptions={{
              fillColor: needColor(pt.needScore),
              fillOpacity: 0.75,
              color: "#ffffff",
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs space-y-1 min-w-[160px]">
                <div className="font-bold text-sm">{pt.label}</div>
                <div className="flex items-center gap-1">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: needColor(pt.needScore) }}
                  />
                  <span className="font-semibold">Need Score: {Math.round(pt.needScore)}/100</span>
                </div>
                <div className="border-t border-border pt-1 space-y-0.5">
                  {Object.entries(pt.metrics).slice(0, 4).map(([key, m]) => (
                    <div key={key} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium tabular-nums">
                        {m.value.toLocaleString()}{m.unit ? ` ${m.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend overlay — sits above the Leaflet canvas */}
      <MapLegend />
    </div>
  );
}
