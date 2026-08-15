// client/src/pages/EquityLossEngine.tsx
// Equity-Loss Engine — county-grain IHDI/Atkinson equity-loss lookup.
// Data: GET /api/equity-loss/county/:stateFips/:countyFips (public, no auth)
// Route: /equity-loss
//
// Per the stakeholder red-team (docs/equity-loss-phase1-2-decisions.md),
// suppression reasons, trust tiers, and stated assumptions are surfaced
// inline next to every number — never hidden behind a tooltip or omitted.
// Visual language matches EquityDashboard.tsx (dark, card-based, accent
// colors keyed to meaning) so this reads as the same product family.

import { useState, useEffect } from "react";
import { Link } from "wouter";

interface FrameRow {
  geoId: string;
  geoLevel: string;
  frame: string;
  suppressed: boolean;
  suppressionReason: string | null;
  overallLossPct: number | null;
  referenceLossPct: number | null;
  divergenceFromReferencePct: number | null;
  tier: string;
  assumptionText: string | null;
  healthValueBasis: string | null;
  coverageFlags: string[];
}

interface EquityLossResponse {
  county: {
    fips: string;
    name: string;
    state: string;
    ruccCode: number;
    ruralityBand: string;
    censusRegion: string;
    growthBand: string;
  };
  peerClassKey: string;
  peerClassAssumption: string | null;
  frames: {
    vsParentCounty: FrameRow;
    vsState: FrameRow;
    vsNationalPeerClass: FrameRow;
    divergencePct: number | null;
    divergenceInterpretation: string;
  };
}

const FRAME_LABELS: Record<string, string> = {
  vs_parent_county: "vs. National (US)",
  vs_state: "vs. Own State",
  vs_national_peer_class: "vs. National Peer Class",
};

const TIER_LABELS: Record<string, string> = {
  computed: "Computed — no unvalidated assumptions",
  derived_with_stated_assumption: "Derived — uses a stated, unvalidated assumption",
  ai_estimate: "AI estimate — lowest confidence",
};

const PRESETS = [
  { label: "Cook County, IL", state: "17", county: "031" },
  { label: "Harris County, TX", state: "48", county: "201" },
  { label: "Williamson County, TX", state: "48", county: "491" },
  { label: "Kings County, NY", state: "36", county: "047" },
  { label: "Aroostook County, ME", state: "23", county: "003" },
];

function card(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "20px 22px",
  };
}

function FrameCard({ row }: { row: FrameRow }) {
  const divergence = row.divergenceFromReferencePct;
  const divergenceColor = divergence === null ? "#94a3b8" : divergence > 0 ? "#f87171" : "#34d399";
  return (
    <div style={card()}>
      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>
        {FRAME_LABELS[row.frame] ?? row.frame}
      </span>

      {row.suppressed ? (
        <div style={{ marginTop: 12, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.5 }}>
          Suppressed — {row.suppressionReason?.replace(/_/g, " ")}. A visible gap is shown instead of a guess.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8, color: "#f1f5f9", lineHeight: 1.1 }}>
            {row.overallLossPct?.toFixed(1)}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>overall loss to inequality (IHDI)</div>

          {row.referenceLossPct !== null ? (
            <div style={{ fontSize: 13, color: "#cbd5e1" }}>
              Reference: <strong style={{ color: "#e2e8f0" }}>{row.referenceLossPct.toFixed(1)}%</strong>
              <div style={{ marginTop: 4 }}>
                Divergence:{" "}
                <strong style={{ color: divergenceColor }}>
                  {divergence !== null ? `${divergence > 0 ? "+" : ""}${divergence.toFixed(1)} pts` : "n/a"}
                </strong>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#64748b" }}>Reference value not yet available for this frame.</div>
          )}
        </>
      )}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#94a3b8" }}>
        Trust tier: <strong style={{ color: "#cbd5e1" }}>{TIER_LABELS[row.tier] ?? row.tier}</strong>
      </div>
      {row.assumptionText && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#fbbf24", fontStyle: "italic", lineHeight: 1.4 }}>
          {row.assumptionText}
        </div>
      )}
      {row.coverageFlags?.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
          Coverage notes: {row.coverageFlags.join(", ").replace(/_/g, " ")}
        </div>
      )}
    </div>
  );
}

export default function EquityLossEnginePage() {
  // Support deep-link from the national view: /equity-loss?state=17&county=031
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initState = urlParams.get("state") || PRESETS[0].state;
  const initCounty = urlParams.get("county") || PRESETS[0].county;

  const [stateFips, setStateFips] = useState(initState);
  const [countyFips, setCountyFips] = useState(initCounty);
  const [data, setData] = useState<EquityLossResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-run if deep-linked with FIPS params
  useEffect(() => {
    const s = urlParams.get("state");
    const c = urlParams.get("county");
    if (s && c) {
      runLookup(s, c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runLookup(sf?: string, cf?: string) {
    const s = sf ?? stateFips;
    const c = cf ?? countyFips;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/equity-loss/county/${s}/${c}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1120", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Nav tabs — single county vs nationwide */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <span style={{
            padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: "rgba(37,99,235,0.18)", color: "#93c5fd",
            border: "1px solid rgba(37,99,235,0.35)",
          }}>
            Single-County Lookup
          </span>
          <Link href="/equity-loss/national" style={{
            padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
            background: "rgba(255,255,255,0.04)", color: "#94a3b8",
            border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none", cursor: "pointer",
          }}>
            Nationwide Browse →
          </Link>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: 0 }}>Equity-Loss Engine</h1>
        <p style={{ color: "#94a3b8", marginTop: 8, marginBottom: 28, maxWidth: 640, lineHeight: 1.5 }}>
          County-grain human development loss to inequality (IHDI/Atkinson method), compared across three
          independent frames. Domestic (US) scope only.
        </p>

        <div style={{ ...card(), marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: "#94a3b8" }}>
              State FIPS
              <input
                value={stateFips}
                onChange={(e) => setStateFips(e.target.value)}
                maxLength={2}
                style={{
                  display: "block", width: 70, padding: "8px 10px", marginTop: 6,
                  background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                }}
              />
            </label>
            <label style={{ fontSize: 12, color: "#94a3b8" }}>
              County FIPS
              <input
                value={countyFips}
                onChange={(e) => setCountyFips(e.target.value)}
                maxLength={3}
                style={{
                  display: "block", width: 80, padding: "8px 10px", marginTop: 6,
                  background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                }}
              />
            </label>
            <button
              onClick={() => runLookup()}
              disabled={loading}
              style={{
                padding: "9px 20px", background: "#2563eb", color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 600, cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Computing…" : "Compute"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setStateFips(p.state);
                  setCountyFips(p.county);
                  runLookup(p.state, p.county);
                }}
                style={{
                  fontSize: 12, padding: "6px 12px", borderRadius: 999,
                  background: "rgba(255,255,255,0.06)", color: "#cbd5e1",
                  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: 16, borderRadius: 10, marginBottom: 20, border: "1px solid rgba(239,68,68,0.25)" }}>
            {error}
          </div>
        )}

        {data && (
          <>
            <div style={{ marginBottom: 20, fontSize: 14, color: "#cbd5e1" }}>
              <strong style={{ color: "#f8fafc", fontSize: 17 }}>{data.county.name}, {data.county.state}</strong>
              <div style={{ marginTop: 4, color: "#94a3b8" }}>
                RUCC {data.county.ruccCode} ({data.county.ruralityBand.replace("_", " ")}) · {data.county.censusRegion} · growth: {data.county.growthBand}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <FrameCard row={data.frames.vsParentCounty} />
              <FrameCard row={data.frames.vsState} />
              <FrameCard row={data.frames.vsNationalPeerClass} />
            </div>

            <div style={{ ...card(), marginTop: 24 }}>
              <strong style={{ color: "#f8fafc" }}>Divergence (state vs. peer class): </strong>
              <span style={{ color: "#cbd5e1" }}>
                {data.frames.divergencePct !== null
                  ? `${data.frames.divergencePct.toFixed(1)} pts — ${data.frames.divergenceInterpretation.replace(/_/g, " ")}`
                  : "insufficient data"}
              </span>
              <div style={{ marginTop: 8, color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                A county can read as deprived against its own state and advantaged against national peers of the
                same type — both can be true, and they imply different policy responses. These frames are never
                averaged together.
              </div>
            </div>

            {data.peerClassAssumption && (
              <div style={{ marginTop: 14, fontSize: 12, color: "#fbbf24", fontStyle: "italic", lineHeight: 1.5 }}>
                Peer-class methodology: {data.peerClassAssumption}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
