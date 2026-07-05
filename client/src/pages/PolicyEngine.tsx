import { useState } from "react";

interface PolicySignal {
  id: string;
  category: string;
  finding: string;
  dataPoint: string;
  geography: string;
  urgency: "low" | "medium" | "high" | "critical";
  grantNarrativeParagraph: string;
  legislativeBriefHook: string;
  funderPitchHook: string;
  sourceData: Record<string, unknown>;
  generatedAt: string;
}

interface PolicyReport {
  geography: string;
  signals: PolicySignal[];
  executiveSummary: string;
  recommendedAsk: string;
  estimatedImpact: string;
  generatedAt: string;
}

const COUNTY_PRESETS = [
  { label: "Travis County", geography: "Travis County, TX", fips: "48453" },
  { label: "Williamson County", geography: "Williamson County, TX", fips: "48491" },
  { label: "Hays County", geography: "Hays County, TX", fips: "48209" },
  { label: "Bastrop County", geography: "Bastrop County, TX", fips: "48021" },
];

const URGENCY_CONFIG = {
  critical: { label: "Critical", color: "#dc2626" },
  high: { label: "High", color: "#ea580c" },
  medium: { label: "Medium", color: "#ca8a04" },
  low: { label: "Low", color: "#16a34a" },
};

const CATEGORY_ICONS: Record<string, string> = {
  workforce: "🔧",
  health: "❤️",
  education: "🎓",
  equity: "⚖️",
  housing: "🏠",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      data-testid={`copy-${label.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      style={{
        padding: "6px 14px",
        background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 6,
        color: copied ? "#10b981" : "#94a3b8",
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ Copied" : `Copy ${label}`}
    </button>
  );
}

function SignalCard({ signal }: { signal: PolicySignal }) {
  const [expanded, setExpanded] = useState(false);
  const urg = URGENCY_CONFIG[signal.urgency];

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 28px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[signal.category] ?? "📊"}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{signal.finding}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{signal.category}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: `${urg.color}18`, color: urg.color, border: `1px solid ${urg.color}40` }}>
            {urg.label}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#94a3b8", fontSize: 12, cursor: "pointer" }}
          >
            {expanded ? "Collapse" : "Expand narratives"}
          </button>
        </div>
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
        {signal.dataPoint}
      </div>

      {expanded && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Grant Narrative", text: signal.grantNarrativeParagraph },
            { label: "Legislative Brief", text: signal.legislativeBriefHook },
            { label: "Funder Pitch", text: signal.funderPitchHook },
          ].map(({ label, text }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>{label}</div>
                <CopyButton text={text} label={label} />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "#cbd5e1", lineHeight: 1.7 }}>{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PolicyEngine() {
  const [selected, setSelected] = useState(COUNTY_PRESETS[0]);
  const [report, setReport] = useState<PolicyReport | null>(null);
  const [signals, setSignals] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSignals() {
    setLoading(true);
    setError(null);
    try {
      const [sigRes, rawRes] = await Promise.allSettled([
        fetch(`/api/policy/report?geography=${encodeURIComponent(selected.geography)}&countyFips=${selected.fips}`),
        fetch(`/api/policy/signals?countyFips=${selected.fips}`),
      ]);
      if (sigRes.status === "fulfilled" && sigRes.value.ok) {
        setReport(await sigRes.value.json());
      } else {
        setError("Could not generate policy report.");
      }
      if (rawRes.status === "fulfilled" && rawRes.value.ok) {
        setSignals(await rawRes.value.json());
      }
    } catch {
      setError("Network error. Verify API is reachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#10b981", marginBottom: 4 }}>
            TCAF · RPLICE Intelligence
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>
            Policy Signal Engine
          </h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Live platform data → grant narrative → legislative brief → funder pitch
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {COUNTY_PRESETS.map((c) => (
            <button
              key={c.fips}
              data-testid={`county-${c.fips}`}
              onClick={() => { setSelected(c); setReport(null); setSignals(null); }}
              style={{ padding: "8px 16px", borderRadius: 8, border: selected.fips === c.fips ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.1)", background: selected.fips === c.fips ? "rgba(16,185,129,0.12)" : "transparent", color: selected.fips === c.fips ? "#10b981" : "#94a3b8", fontSize: 13, cursor: "pointer", fontWeight: selected.fips === c.fips ? 600 : 400 }}
            >
              {c.label}
            </button>
          ))}
          <button
            data-testid="button-generate-report"
            onClick={loadSignals}
            disabled={loading}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: loading ? "rgba(16,185,129,0.3)" : "#10b981", color: "#0a0f1a", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: "32px 40px", padding: 20, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div style={{ padding: "80px 40px", textAlign: "center", color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, color: "#64748b", marginBottom: 8 }}>Select a county and click Generate Report</div>
          <div style={{ fontSize: 13, color: "#334155" }}>
            Pulls live signals from all platform data sources and composes grant-ready language in one click.
          </div>
        </div>
      )}

      {report && (
        <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>

          {/* Executive summary + recommended ask */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 32 }}>
            <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14, padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#10b981" }}>Executive Summary</div>
                <CopyButton text={report.executiveSummary} label="Summary" />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "#cbd5e1", lineHeight: 1.8 }}>{report.executiveSummary}</p>
            </div>
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b" }}>Recommended Ask</div>
                <CopyButton text={report.recommendedAsk} label="Ask" />
              </div>
              <p style={{ margin: 0, fontSize: 15, color: "#fef3c7", lineHeight: 1.7, fontWeight: 500 }}>{report.recommendedAsk}</p>
            </div>
          </div>

          {/* Raw signal counts */}
          {signals && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
              {[
                { label: "Total Learners", value: signals.totalLearners, color: "#60a5fa" },
                { label: "Credentials Earned", value: signals.credentials, color: "#a78bfa" },
                { label: "Placements (90d)", value: signals.placements90Days, color: "#34d399" },
                { label: "Households", value: signals.totalHouseholds, color: "#10b981" },
                { label: "High-Burden Screenings", value: signals.highBurdenScreenings, color: "#f87171" },
                { label: "Pell Eligible", value: signals.pellEligibleLearners, color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color }}>{String(value ?? 0)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Policy signals */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>
              Policy Signals · {report.geography}
            </div>
            {report.signals.length === 0 && (
              <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>
                No signals generated. Add learner data to the platform to populate signals.
              </div>
            )}
            {report.signals.map((s) => <SignalCard key={s.id} signal={s} />)}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 11, color: "#334155" }}>
              {report.estimatedImpact} · Generated {new Date(report.generatedAt).toLocaleString()}
            </div>
            <button
              data-testid="button-export-briefing"
              onClick={() => window.print()}
              style={{ padding: "10px 20px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#10b981", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
            >
              Export for briefing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
