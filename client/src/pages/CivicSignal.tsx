// client/src/pages/CivicSignal.tsx
// Civic Signal bidirectional connector — status, incoming policy-adaptation
// lessons, live pull, and pushing Equity-Loss Engine results out.
// Data:
//   GET  /api/civic-signal/status
//   GET  /api/civic-signal/lessons?topic=&state=
//   GET  /api/civic-signal/adaptations?topic=&state=
//   POST /api/civic-signal/push-equity-loss/:stateFips/:countyFips
// Route: /civic-signal (public, no auth)

import { useEffect, useState } from "react";

interface ConnectionStatus {
  outboundReachable: boolean;
  outboundDetail: string;
  inboundLessonsStored: number;
  inboundAuthenticationConfigured: boolean;
}

interface Lesson {
  id: string;
  lesson: string;
  topic: string;
  state: string;
  source: string;
  sourceDate: string;
  evidenceClass: string;
  confidence: string;
  receivedAt: string;
  roiImplication?: string;
}

function card(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "20px 22px",
  };
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
        padding: "4px 10px", borderRadius: 999,
        background: ok ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
        color: ok ? "#34d399" : "#f87171",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? "#34d399" : "#f87171" }} />
      {label}
    </span>
  );
}

export default function CivicSignalPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  const [pullTopic, setPullTopic] = useState("housing");
  const [pullState, setPullState] = useState("");
  const [pullResult, setPullResult] = useState<{
    adaptations: Lesson[];
    source: string;
    liveStatus?: "available" | "unavailable";
    fallbackUsed?: boolean;
    liveUnavailableReason?: string;
    error?: string;
  } | null>(null);
  const [pulling, setPulling] = useState(false);

  const [pushStateFips, setPushStateFips] = useState("17");
  const [pushCountyFips, setPushCountyFips] = useState("031");
  const [pushResult, setPushResult] = useState<any>(null);
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/civic-signal/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch((e) => setStatus({ outboundReachable: false, outboundDetail: e.message, inboundLessonsStored: 0, inboundAuthenticationConfigured: false }))
      .finally(() => setStatusLoading(false));

    fetch("/api/civic-signal/lessons")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        return body;
      })
      .then((d) => setLessons(d.lessons ?? []))
      .catch((e) => {
        setLessons([]);
        setLessonsError(e instanceof Error ? e.message : "Lesson store unavailable");
      })
      .finally(() => setLessonsLoading(false));
  }, []);

  async function runPull() {
    setPulling(true);
    setPullResult(null);
    try {
      const params = new URLSearchParams({ topic: pullTopic });
      if (pullState) params.set("state", pullState);
      const res = await fetch(`/api/civic-signal/adaptations?${params}`);
      setPullResult(await res.json());
    } catch (e) {
      setPullResult({ adaptations: [], source: "error", error: (e as Error).message });
    } finally {
      setPulling(false);
    }
  }

  async function runPush() {
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const res = await fetch(`/api/civic-signal/push-equity-loss/${pushStateFips}/${pushCountyFips}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setPushResult(json);
    } catch (e) {
      setPushError((e as Error).message);
    } finally {
      setPushing(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1120", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: 0 }}>Civic Signal Connection</h1>
        <p style={{ color: "#94a3b8", marginTop: 8, marginBottom: 24, maxWidth: 680, lineHeight: 1.5 }}>
          A bidirectional evidence loop with Civic Signal, a policy intelligence platform that adapts what's working
          in other jurisdictions to local context. ThriveUp pushes community equity data out; Civic Signal pushes
          adaptation lessons back in. Both directions serve the same community, from different angles.
        </p>

        {/* Connection status */}
        <div style={{ ...card(), marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Inbound (Civic Signal → ThriveUp)
            </div>
            <StatusPill
              ok={!!status?.inboundAuthenticationConfigured}
              label={status?.inboundAuthenticationConfigured ? "Credential configured" : "Not configured"}
            />
            <span style={{ marginLeft: 8, fontSize: 13, color: "#cbd5e1" }}>
              {statusLoading
                ? "Checking…"
                : status?.inboundLessonsStored
                  ? `${status.inboundLessonsStored} verified lessons received`
                  : "No verified deliveries yet"}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Outbound (ThriveUp → Civic Signal)
            </div>
            {statusLoading ? (
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Checking…</span>
            ) : (
              <>
                <StatusPill ok={!!status?.outboundReachable} label={status?.outboundReachable ? "Reachable" : "Not reachable"} />
                <span style={{ marginLeft: 8, fontSize: 13, color: "#94a3b8" }}>{status?.outboundDetail}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20 }}>
          {/* Incoming lessons */}
          <div style={card()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", marginTop: 0 }}>Incoming Lessons</h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: -8, marginBottom: 14 }}>
              Policy adaptation lessons Civic Signal has pushed to ThriveUp via webhook.
            </p>
            {lessonsLoading ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading…</div>
            ) : lessonsError ? (
              <div role="alert" style={{ color: "#fca5a5", fontSize: 13 }}>
                Lesson store unavailable; no conclusion can be drawn about received lessons. {lessonsError}
              </div>
            ) : lessons.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>
                No lessons received yet. This list fills in as Civic Signal pushes adaptation intelligence to the
                webhook — nothing to show is the honest current state, not an error.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
                {lessons.map((l) => (
                  <div key={l.id} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 12 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Partner lesson — Civic Signal · {l.topic.toUpperCase()} · {l.state} · {l.confidence} confidence
                    </div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 4, lineHeight: 1.4 }}>{l.lesson}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      Source: {l.source} · Source date: {l.sourceDate} · Received: {l.receivedAt.slice(0, 10)}
                    </div>
                    {l.roiImplication && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>ROI implication: {l.roiImplication}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 8 }}>
                Pull adaptations live
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label htmlFor="civic-pull-topic" style={{ flex: 1, minWidth: 140, fontSize: 12, color: "#94a3b8" }}>
                  Topic
                <input
                  id="civic-pull-topic"
                  value={pullTopic}
                  onChange={(e) => setPullTopic(e.target.value)}
                  placeholder="topic (e.g. housing)"
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "7px 10px", background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 13 }}
                />
                </label>
                <label htmlFor="civic-pull-state" style={{ fontSize: 12, color: "#94a3b8" }}>
                  State (optional)
                <input
                  id="civic-pull-state"
                  aria-describedby="civic-pull-state-help"
                  value={pullState}
                  onChange={(e) => setPullState(e.target.value)}
                  placeholder="state (optional)"
                  maxLength={2}
                  style={{ display: "block", width: 90, marginTop: 4, padding: "7px 10px", background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 13 }}
                />
                  <span id="civic-pull-state-help" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    Two-letter state code
                  </span>
                </label>
                <button
                  type="button"
                  onClick={runPull}
                  disabled={pulling}
                  style={{ padding: "7px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: pulling ? 0.6 : 1 }}
                >
                  {pulling ? "Pulling adaptations…" : "Pull"}
                </button>
              </div>
              {pullResult && (
                <div aria-live="polite" style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
                  Source: <strong style={{ color: "#cbd5e1" }}>{pullResult.source}</strong>
                  {pullResult.error && <span style={{ color: "#f87171" }}> — {pullResult.error}</span>}
                  {pullResult.adaptations?.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                      {pullResult.adaptations.map((a, i) => (
                        <div key={a.id || i} style={{ color: "#e2e8f0", fontSize: 13 }}>
                          <strong>Partner lesson — Civic Signal</strong>
                          <div>{a.lesson}</div>
                          <div style={{ color: "#94a3b8", marginTop: 3 }}>
                            {a.state} · {a.confidence} confidence · {a.source} · {a.sourceDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {pullResult.liveStatus === "unavailable" && (
                    <div style={{ marginTop: 6, color: "#fca5a5" }}>
                      Live Civic Signal pull unavailable; {pullResult.adaptations.length} verified cached lessons.
                      {pullResult.liveUnavailableReason ? ` ${pullResult.liveUnavailableReason}` : ""}
                    </div>
                  )}
                  {pullResult.liveStatus === "available" && pullResult.adaptations?.length === 0 && !pullResult.error && (
                    <div style={{ marginTop: 6 }}>The live query returned no validated adaptations for this topic/state.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Push equity-loss data out */}
          <div style={card()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", marginTop: 0 }}>Push Equity-Loss Data Out</h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: -8, marginBottom: 14 }}>
              Compute a county's Equity-Loss Engine result and push each non-suppressed frame to Civic Signal as an
              evidence event. This write action requires an authenticated, authorized operator.
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: "#94a3b8" }}>
                State FIPS
                <input
                  value={pushStateFips}
                  onChange={(e) => setPushStateFips(e.target.value)}
                  maxLength={2}
                  style={{ display: "block", width: 70, padding: "7px 10px", marginTop: 4, background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
                />
              </label>
              <label style={{ fontSize: 12, color: "#94a3b8" }}>
                County FIPS
                <input
                  value={pushCountyFips}
                  onChange={(e) => setPushCountyFips(e.target.value)}
                  maxLength={3}
                  style={{ display: "block", width: 80, padding: "7px 10px", marginTop: 4, background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
                />
              </label>
              <button
                  type="button"
                onClick={runPush}
                disabled={pushing}
                style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: pushing ? 0.6 : 1 }}
              >
                {pushing ? "Computing & pushing…" : "Compute & Push"}
              </button>
            </div>

            {pushError && (
              <div style={{ marginTop: 14, background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: 12, borderRadius: 8, fontSize: 13 }}>
                {pushError}
              </div>
            )}

            {pushResult && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 8 }}>
                  {pushResult.county?.name}, {pushResult.county?.state}
                </div>
                {Object.entries(pushResult.pushResults ?? {}).map(([frame, r]: [string, any]) => (
                  <div key={frame} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <StatusPill ok={r.pushed} label={r.pushed ? "Pushed" : "Not pushed"} />
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{frame}: {r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
