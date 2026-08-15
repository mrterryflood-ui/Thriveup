// client/src/pages/EquityLossEngine.tsx
// Equity-Loss Engine — county-grain IHDI/Atkinson equity-loss lookup.
// Data: GET /api/equity-loss/county/:stateFips/:countyFips (public, no auth)
// Route: /equity-loss
//
// Per the stakeholder red-team (docs/equity-loss-phase1-2-decisions.md),
// suppression reasons, trust tiers, and stated assumptions are surfaced
// inline next to every number — never hidden behind a tooltip or omitted.

import { useState } from "react";

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

function FrameCard({ row }: { row: FrameRow }) {
  return (
    <div style={{ border: "1px solid #d8dee8", borderRadius: 10, padding: 18, background: "#fff" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937" }}>{FRAME_LABELS[row.frame] ?? row.frame}</div>
      {row.suppressed ? (
        <div style={{ marginTop: 10, color: "#92400e", background: "#fffbeb", padding: 10, borderRadius: 8, fontSize: 13 }}>
          Suppressed — {row.suppressionReason?.replace(/_/g, " ")}. A visible gap is shown here instead of a guess.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: "#0f172a" }}>
            {row.overallLossPct?.toFixed(1)}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>overall loss to inequality (IHDI)</div>
          {row.referenceLossPct !== null && (
            <div style={{ fontSize: 13, color: "#334155" }}>
              Reference: {row.referenceLossPct.toFixed(1)}% · Divergence:{" "}
              <strong style={{ color: (row.divergenceFromReferencePct ?? 0) > 0 ? "#b91c1c" : "#15803d" }}>
                {row.divergenceFromReferencePct !== null
                  ? `${row.divergenceFromReferencePct > 0 ? "+" : ""}${row.divergenceFromReferencePct.toFixed(1)} pts`
                  : "n/a"}
              </strong>
            </div>
          )}
          {row.referenceLossPct === null && (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Reference value not yet available for this frame.</div>
          )}
        </>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: "#475569" }}>
        Trust tier: <strong>{TIER_LABELS[row.tier] ?? row.tier}</strong>
      </div>
      {row.assumptionText && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#7c2d12", fontStyle: "italic" }}>{row.assumptionText}</div>
      )}
      {row.coverageFlags?.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
          Coverage notes: {row.coverageFlags.join(", ").replace(/_/g, " ")}
        </div>
      )}
    </div>
  );
}

export default function EquityLossEnginePage() {
  const [stateFips, setStateFips] = useState("48");
  const [countyFips, setCountyFips] = useState("453");
  const [data, setData] = useState<EquityLossResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runLookup() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/equity-loss/county/${stateFips}/${countyFips}`);
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
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Equity-Loss Engine</h1>
      <p style={{ color: "#475569", marginTop: 4, marginBottom: 20 }}>
        County-grain human development loss to inequality (IHDI/Atkinson method), compared across three independent
        frames. Domestic (US) scope only.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: "#334155" }}>
          State FIPS
          <input
            value={stateFips}
            onChange={(e) => setStateFips(e.target.value)}
            maxLength={2}
            style={{ display: "block", width: 70, padding: 6, marginTop: 4, border: "1px solid #cbd5e1", borderRadius: 6 }}
          />
        </label>
        <label style={{ fontSize: 13, color: "#334155" }}>
          County FIPS
          <input
            value={countyFips}
            onChange={(e) => setCountyFips(e.target.value)}
            maxLength={3}
            style={{ display: "block", width: 80, padding: 6, marginTop: 4, border: "1px solid #cbd5e1", borderRadius: 6 }}
          />
        </label>
        <button
          onClick={runLookup}
          disabled={loading}
          style={{
            marginTop: 18, padding: "8px 18px", background: "#1d4ed8", color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
          }}
        >
          {loading ? "Computing…" : "Compute"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", color: "#991b1b", padding: 14, borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ marginBottom: 18, fontSize: 14, color: "#334155" }}>
            <strong>{data.county.name}, {data.county.state}</strong> · RUCC {data.county.ruccCode} (
            {data.county.ruralityBand.replace("_", " ")}) · {data.county.censusRegion} · growth: {data.county.growthBand}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <FrameCard row={data.frames.vsParentCounty} />
            <FrameCard row={data.frames.vsState} />
            <FrameCard row={data.frames.vsNationalPeerClass} />
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "#f8fafc", borderRadius: 10, fontSize: 13, color: "#334155" }}>
            <strong>Divergence (state vs. peer class): </strong>
            {data.frames.divergencePct !== null
              ? `${data.frames.divergencePct.toFixed(1)} pts — ${data.frames.divergenceInterpretation.replace(/_/g, " ")}`
              : "insufficient data"}
            <div style={{ marginTop: 6, color: "#64748b" }}>
              A county can read as deprived against its own state and advantaged against national peers of the same
              type — both can be true, and they imply different policy responses. These frames are never averaged
              together.
            </div>
          </div>

          {data.peerClassAssumption && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#7c2d12", fontStyle: "italic" }}>
              Peer-class methodology: {data.peerClassAssumption}
            </div>
          )}
        </>
      )}
    </div>
  );
}
