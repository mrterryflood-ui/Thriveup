import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8", submitted: "#3b82f6", acknowledged: "#8b5cf6",
  processing: "#f59e0b", response_received: "#10b981",
  appealed: "#f87171", closed: "#64748b", denied: "#dc2626",
};

const AGENCIES = [
  "travis_county_clerk", "williamson_county_clerk",
  "hays_county_clerk", "bastrop_county_clerk",
  "texas_hhsc", "texas_doc",
];

const TEMPLATES: Record<string, string> = {
  eviction_filings: "Aggregate data on all eviction (forcible detainer) case filings in [COUNTY] for the period January 1, [YEAR] through December 31, [YEAR], including: (1) total number of cases filed, (2) disposition outcomes, (3) cases by ZIP code or census tract where available, (4) demographic data if collected.",
  housing_court_dispositions: "All records relating to eviction case dispositions in [COUNTY] Justice of the Peace courts for calendar year [YEAR], including case number, filing date, disposition date, disposition type, and ZIP code of the subject property (personal identifiers redacted).",
  landlord_repeat_filers: "A list of the top 25 plaintiffs (landlords or property management companies) by number of eviction cases filed in [COUNTY] during calendar year [YEAR], including the name of the plaintiff and total number of filings.",
};

export default function FoiaTracker() {
  const [requests, setRequests] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "create">("list");
  const [form, setForm] = useState({ agency: "travis_county_clerk", requestedRecords: "", purposeStatement: "" });
  const [created, setCreated] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "FOIA Request Tracker | ThriveUp";
    fetch("/api/foia/requests")
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setRequests(data) : setRequests([]))
      .catch(() => {});
  }, [view]);

  async function createRequest() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/foia/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setCreated(data);
    } finally { setSubmitting(false); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/foia/requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRequests(r => r.map(req => req.id === id ? { ...req, status } : req));
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", color: "#0f172a", background: "#fff" };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 4 }}>ThriveUp</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>FOIA Request Tracker</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Texas Public Information Act — housing court & recidivism data</p>
        </div>
        <button data-testid="btn-toggle-view"
          onClick={() => { setView(view === "list" ? "create" : "list"); setCreated(null); }}
          style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {view === "list" ? "+ New Request" : "← All Requests"}
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 24px" }}>
        {view === "list" && (
          <div>
            {requests.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                No FOIA requests yet. Create one to request housing court data from county clerks.
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{r.agencyName}</div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
                    background: `${STATUS_COLORS[r.status] ?? "#94a3b8"}18`,
                    color: STATUS_COLORS[r.status] ?? "#94a3b8",
                    border: `1px solid ${STATUS_COLORS[r.status] ?? "#94a3b8"}30`,
                    textTransform: "capitalize",
                  }}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>
                  {r.requestedRecords.substring(0, 150)}{r.requestedRecords.length > 150 ? "…" : ""}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["submitted","acknowledged","processing","response_received","closed"].map(s => (
                    <button key={s}
                      data-testid={`status-${r.id}-${s}`}
                      onClick={() => updateStatus(r.id, s)}
                      style={{
                        padding: "5px 10px", fontSize: 11, borderRadius: 5,
                        border: `1px solid ${r.status === s ? STATUS_COLORS[s] : "#e2e8f0"}`,
                        background: r.status === s ? `${STATUS_COLORS[s]}15` : "transparent",
                        color: r.status === s ? STATUS_COLORS[s] : "#94a3b8",
                        cursor: "pointer", fontWeight: r.status === s ? 700 : 400,
                      }}>
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
                {r.responseDeadline && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                    Response due: {new Date(r.responseDeadline).toLocaleDateString()}
                    {new Date(r.responseDeadline) < new Date() && r.status !== "response_received" && r.status !== "closed" && (
                      <span style={{ color: "#dc2626", fontWeight: 700 }}> — OVERDUE</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {view === "create" && !created && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 32px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>New FOIA Request</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Agency</label>
              <select data-testid="select-agency" style={inputStyle} value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))}>
                {AGENCIES.map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Use a template</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(TEMPLATES).map(([key, text]) => (
                  <button key={key}
                    data-testid={`template-${key}`}
                    onClick={() => setForm(f => ({ ...f, requestedRecords: text }))}
                    style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#374151", cursor: "pointer" }}>
                    {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Records Requested *</label>
              <textarea data-testid="input-records-requested"
                style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
                value={form.requestedRecords}
                onChange={e => setForm(f => ({ ...f, requestedRecords: e.target.value }))}
                placeholder="Describe the specific records you are requesting…" />
            </div>

            <button data-testid="btn-generate-letter"
              onClick={createRequest} disabled={submitting || form.requestedRecords.length < 10}
              style={{ padding: "12px 28px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {submitting ? "Generating letter…" : "Generate FOIA Letter"}
            </button>
          </div>
        )}

        {created && (
          <div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 14, color: "#065f46" }}>
              ✓ Request created. Letter generated. Copy and send to {created.request?.agencyEmail ?? "the agency"}.
            </div>
            {created.letter && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Generated FOIA Letter</div>
                  <button data-testid="btn-copy-letter"
                    onClick={() => navigator.clipboard.writeText(created.letter)}
                    style={{ padding: "6px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                    Copy letter
                  </button>
                </div>
                <pre style={{ fontFamily: "'Georgia', serif", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#374151", margin: 0 }}>
                  {created.letter}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
