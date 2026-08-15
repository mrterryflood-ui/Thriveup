// client/src/components/equity-loss/CountyChoroplethMap.tsx
//
// SVG county-level choropleth for the nationwide Equity-Loss browser.
// Uses us-atlas counties-10m.json from CDN (pre-projected Albers USA, 960×600 viewport)
// + topojson-client to decode arc topology into SVG path strings.
//
// Color scale: light yellow (low loss) → dark red (high loss)
// Suppressed counties: neutral gray #475569, never colored as 0%.
// Clicking a county navigates to the single-county detail view.

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — topojson-client types resolved via @types/topojson-client
import * as topojson from "topojson-client";
import { AlertCircle, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapCountyRow {
  county_fips: string;
  county_name: string;
  state_abbrev: string;
  state_fips: string;
  overall_loss_pct: number | null;
  suppressed: boolean;
}

interface MapResponse {
  noDataYet: boolean;
  message?: string;
  batchRunId?: string;
  dataAsOf?: string;
  frame?: string;
  rows: MapCountyRow[];
}

interface Props {
  frame: string;
  /** Called when the user clicks a county to navigate */
  onCountyClick?: (row: MapCountyRow) => void;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

// Sequential: light yellow → orange → dark red, matching the table's lossColor
// but using a proper scale for the full numeric range.
function lossPctToColor(pct: number): string {
  // Clamp to [0, 35] then interpolate through 5 stops
  const stops: Array<[number, [number, number, number]]> = [
    [0,  [250, 240, 180]],  // pale yellow
    [5,  [251, 191,  36]],  // amber
    [10, [251, 146,  60]],  // orange
    [20, [239,  68,  68]],  // red
    [35, [153,  27,  27]],  // dark red
  ];
  const clamped = Math.max(0, Math.min(pct, 35));
  for (let i = 0; i < stops.length - 1; i++) {
    const [lo, rgb0] = stops[i];
    const [hi, rgb1] = stops[i + 1];
    if (clamped <= hi) {
      const t = (clamped - lo) / (hi - lo);
      const r = Math.round(rgb0[0] + t * (rgb1[0] - rgb0[0]));
      const g = Math.round(rgb0[1] + t * (rgb1[1] - rgb0[1]));
      const b = Math.round(rgb0[2] + t * (rgb1[2] - rgb0[2]));
      return `rgb(${r},${g},${b})`;
    }
  }
  return "rgb(153,27,27)";
}

const SUPPRESSED_COLOR = "#475569";  // slate-600 — neutral, clearly distinct
const NO_DATA_COLOR    = "#1e293b";  // dark slate, counties not in current batch

// ---------------------------------------------------------------------------
// TopoJSON fetch (cached across remounts via module-level cache)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UsAtlasTopo = any;

let _topoCache: UsAtlasTopo | null = null;
let _topoFetching: Promise<UsAtlasTopo> | null = null;

const TOPO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

async function fetchTopo(): Promise<UsAtlasTopo> {
  if (_topoCache) return _topoCache;
  if (_topoFetching) return _topoFetching;
  _topoFetching = fetch(TOPO_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch map boundaries: HTTP ${r.status}`);
      return r.json();
    })
    .then((topo) => {
      _topoCache = topo;
      _topoFetching = null;
      return topo;
    });
  return _topoFetching;
}

// ---------------------------------------------------------------------------
// Convert topology feature to SVG path string (no d3-geo needed — coordinates
// are already in screen space for the 960×600 Albers USA projection).
// ---------------------------------------------------------------------------

function ringToPath(coords: number[][]): string {
  if (!coords.length) return "";
  const [x0, y0] = coords[0];
  let d = `M${x0.toFixed(1)},${y0.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const [x, y] = coords[i];
    d += `L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + "Z";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function geoJsonToSvgPath(geometry: any): string {
  if (!geometry) return "";
  const parts: string[] = [];
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      parts.push(ringToPath(ring));
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) {
        parts.push(ringToPath(ring));
      }
    }
  } else if (geometry.type === "LineString") {
    // For mesh borders — draw as open path
    const coords = geometry.coordinates as number[][];
    if (coords.length) {
      const [x0, y0] = coords[0];
      let d = `M${x0.toFixed(1)},${y0.toFixed(1)}`;
      for (let i = 1; i < coords.length; i++) {
        const [x, y] = coords[i];
        d += `L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      parts.push(d);
    }
  } else if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates as number[][][]) {
      if (line.length) {
        const [x0, y0] = line[0];
        let d = `M${x0.toFixed(1)},${y0.toFixed(1)}`;
        for (let i = 1; i < line.length; i++) {
          const [x, y] = line[i];
          d += `L${x.toFixed(1)},${y.toFixed(1)}`;
        }
        parts.push(d);
      }
    }
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function MapLegend() {
  const gradientId = "eq-loss-gradient";
  const stops = [0, 5, 10, 20, 35];
  const width = 200;
  const height = 14;

  const gradStops = stops.map((pct, i) => ({
    offset: `${(i / (stops.length - 1)) * 100}%`,
    color: lossPctToColor(pct),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Overall Loss % (IHDI)
      </div>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradStops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={width} height={height} fill={`url(#${gradientId})`} rx={3} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", width, fontSize: 10, color: "#94a3b8" }}>
        {stops.map((v) => <span key={v}>{v === 35 ? "35+%" : `${v}%`}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
        <div style={{ width: 14, height: 14, background: SUPPRESSED_COLOR, borderRadius: 2, flexShrink: 0 }} />
        <span>Suppressed (insufficient data — not zero)</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
        <div style={{ width: 14, height: 14, background: NO_DATA_COLOR, borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
        <span>Not in current batch run</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip state
// ---------------------------------------------------------------------------

interface TooltipState {
  svgX: number;
  svgY: number;
  row: MapCountyRow;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CountyChoroplethMap({ frame, onCountyClick }: Props) {
  const [, navigate] = useLocation();

  // Map data state
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // TopoJSON state
  const [topo, setTopo] = useState<UsAtlasTopo>(null);
  const [loadingTopo, setLoadingTopo] = useState(false);
  const [topoError, setTopoError] = useState<string | null>(null);

  // Computed SVG paths
  const [countyPaths, setCountyPaths] = useState<Array<{ fips: string; d: string }>>([]);
  const [stateBorderPath, setStateBorderPath] = useState<string>("");

  // Hover tooltip
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // FIPS → row lookup
  const dataMap = useRef<Map<string, MapCountyRow>>(new Map());

  // ---------------------------------------------------------------------------
  // Fetch map data
  // ---------------------------------------------------------------------------
  const fetchMapData = useCallback(async (fr: string) => {
    setLoadingData(true);
    setDataError(null);
    try {
      const res = await fetch(
        `/api/equity-loss/national/map?frame=${encodeURIComponent(fr)}`
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setMapData(json as MapResponse);
      const m = new Map<string, MapCountyRow>();
      for (const row of (json.rows as MapCountyRow[])) {
        m.set(row.county_fips, row);
      }
      dataMap.current = m;
    } catch (e) {
      setDataError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch TopoJSON
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setLoadingTopo(true);
    fetchTopo()
      .then((t: UsAtlasTopo) => {
        setTopo(t);
        setLoadingTopo(false);
      })
      .catch((e: Error) => {
        setTopoError(e.message);
        setLoadingTopo(false);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch map data when frame changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchMapData(frame);
  }, [frame, fetchMapData]);

  // ---------------------------------------------------------------------------
  // Compute SVG paths when topology loads
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!topo) return;

    const countyFeatures = topojson.feature(topo, topo.objects.counties);
    const paths = (countyFeatures.features as any[]).map((f: any) => ({
      fips: String(f.id),
      d: geoJsonToSvgPath(f.geometry),
    }));
    setCountyPaths(paths);

    // State internal borders as a single path
    const mesh = topojson.mesh(topo, topo.objects.states, (a: any, b: any) => a !== b);
    setStateBorderPath(geoJsonToSvgPath(mesh));
  }, [topo]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleCountyClick(fips: string) {
    const row = dataMap.current.get(fips);
    if (!row) return;
    if (onCountyClick) {
      onCountyClick(row);
    } else {
      navigate(`/equity-loss?state=${row.state_fips}&county=${row.county_fips.slice(2)}`);
    }
  }

  function handleMouseEnter(svgX: number, svgY: number, fips: string) {
    const row = dataMap.current.get(fips);
    if (!row) return;
    setTooltip({ svgX, svgY, row });
  }

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!tooltip || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 600 / rect.height;
    setTooltip((prev) =>
      prev ? {
        ...prev,
        svgX: (e.clientX - rect.left) * scaleX,
        svgY: (e.clientY - rect.top) * scaleY,
      } : null
    );
  }

  function handlePathMouseEnter(e: React.MouseEvent<SVGPathElement>, fips: string) {
    const row = dataMap.current.get(fips);
    if (!row || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 600 / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;
    handleMouseEnter(svgX, svgY, fips);
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const loading = loadingData || loadingTopo;

  if (topoError) {
    return (
      <div style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: 16, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", fontSize: 13 }}>
        <AlertCircle size={14} style={{ display: "inline", marginRight: 6 }} />
        Could not load map boundaries: {topoError}. Try refreshing the page.
      </div>
    );
  }

  if (dataError) {
    return (
      <div style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: 16, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", fontSize: 13 }}>
        <AlertCircle size={14} style={{ display: "inline", marginRight: 6 }} />
        Map data unavailable: {dataError}
      </div>
    );
  }

  if (mapData?.noDataYet) {
    return (
      <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
        <AlertCircle size={32} style={{ color: "#fbbf24", marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>
          Nationwide data is being computed
        </div>
        <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          The batch computation job has not completed yet. The map will populate once the first batch run finishes.
          Use the Table view or the{" "}
          <a href="/equity-loss" style={{ color: "#2563eb" }}>single-county lookup</a>
          {" "}in the meantime.
        </div>
      </div>
    );
  }

  // SVG viewport: us-atlas counties-10m is designed for a 960×600 Albers USA projection
  const SVG_W = 960;
  const SVG_H = 600;

  return (
    <div>
      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13, marginBottom: 12 }}>
          <Loader2 size={16} className="animate-spin" />
          {loadingTopo ? "Loading map boundaries…" : "Loading county data…"}
        </div>
      )}

      {/* SVG map */}
      <div style={{ position: "relative", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "#0f172a" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* County fills */}
          <g>
            {countyPaths.map(({ fips, d }) => {
              if (!d) return null;
              const row = dataMap.current.get(fips);
              let fill = NO_DATA_COLOR;
              if (row) {
                fill = row.suppressed
                  ? SUPPRESSED_COLOR
                  : row.overall_loss_pct !== null
                  ? lossPctToColor(row.overall_loss_pct)
                  : SUPPRESSED_COLOR;
              }
              return (
                <path
                  key={fips}
                  d={d}
                  fill={fill}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={0.3}
                  style={{ cursor: row ? "pointer" : "default" }}
                  onClick={() => handleCountyClick(fips)}
                  onMouseEnter={(e) => handlePathMouseEnter(e, fips)}
                />
              );
            })}
          </g>

          {/* State borders on top */}
          {stateBorderPath && (
            <path
              d={stateBorderPath}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={0.8}
              pointerEvents="none"
            />
          )}

          {/* Tooltip */}
          {tooltip && (() => {
            const { svgX, svgY, row } = tooltip;
            const TIP_W = 180;
            const TIP_H = row.suppressed ? 62 : 74;
            // Clamp so tooltip stays inside viewBox
            const tx = Math.min(svgX + 8, SVG_W - TIP_W - 4);
            const ty = svgY > SVG_H * 0.72 ? svgY - TIP_H - 8 : svgY + 8;

            return (
              <g transform={`translate(${tx},${ty})`} pointerEvents="none">
                <rect
                  width={TIP_W} height={TIP_H} rx={4}
                  fill="#1e293b"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={0.5}
                  opacity={0.97}
                />
                <text x={8} y={17} fontSize={9.5} fill="#e2e8f0" fontWeight="600">
                  {row.county_name}, {row.state_abbrev}
                </text>
                <text x={8} y={30} fontSize={8.5} fill="#64748b">
                  FIPS: {row.county_fips}
                </text>
                {row.suppressed ? (
                  <text x={8} y={46} fontSize={8.5} fill="#fbbf24">
                    Suppressed (insufficient data)
                  </text>
                ) : (
                  <>
                    <text x={8} y={46} fontSize={9.5} fill="#f8fafc" fontWeight="600">
                      Loss: {row.overall_loss_pct !== null ? `${row.overall_loss_pct.toFixed(1)}%` : "—"}
                    </text>
                    <text x={8} y={62} fontSize={8} fill="#475569">
                      Click to open detail →
                    </text>
                  </>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Legend + disclosure */}
      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "16px 40px", alignItems: "flex-start" }}>
        <MapLegend />
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, maxWidth: 440, flex: 1, minWidth: 220 }}>
          <strong style={{ color: "#64748b" }}>Map disclosure:</strong> Each county is shaded by its overall IHDI loss % for the
          selected comparison frame. Suppressed counties (gray) had insufficient data for a reliable estimate — they are
          shown explicitly as suppressed, never colored as zero loss. Counties absent from the current batch run appear dark.
          Click any county to open the live single-county computation view.
        </div>
      </div>
    </div>
  );
}
