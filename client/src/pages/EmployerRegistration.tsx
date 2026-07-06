import { useState } from "react";

const CREDENTIAL_OPTIONS = ["electrical","plumbing","hvac","welding","automotive","ag-tech","culinary","construction","healthcare","it-support"];
const INDUSTRIES = ["Construction","Electrical","HVAC","Plumbing","Automotive","Healthcare","Food Service","Logistics","Technology","Retail","Other"];

export default function EmployerRegistration() {
  const [form, setForm] = useState({
    companyName: "", industry: "", contactName: "", contactEmail: "",
    contactPhone: "", website: "", location: "",
    banTheBox: false, fairChanceHiring: false, barrierFriendly: false,
    hiringCommitments: "", description: "",
    credentialTags: [] as string[],
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", boxSizing: "border-box", background: "#fff" };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/employers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Registration failed");
      }
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message ?? "Registration failed. Please try again.");
    } finally { setSubmitting(false); }
  }

  const canSubmit = form.companyName && form.contactName && form.contactEmail &&
    (form.banTheBox || form.fairChanceHiring);

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#065f46", marginBottom: 8 }}>Application received</h2>
          <p style={{ fontSize: 15, color: "#047857", lineHeight: 1.6 }}>
            Our team will review your application within 3 business days. Once approved, your company and open positions will appear in ThriveUp Academy's fair-chance job board.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10b981", marginBottom: 4 }}>ThriveUp Academy · Employer Partnership</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Become a Fair-Chance Employer Partner</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>Connect with credentialed, job-ready candidates from our workforce training programs.</p>
      </div>

      <div style={{ maxWidth: 680, margin: "32px auto", padding: "0 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "32px 36px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input data-testid="input-company-name" style={inputStyle} value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder="Acme Construction Co." />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <select data-testid="select-industry" style={inputStyle} value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Contact Name *</label>
              <input data-testid="input-contact-name" style={inputStyle} value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="Jane Smith" />
            </div>
            <div>
              <label style={labelStyle}>Contact Email *</label>
              <input data-testid="input-contact-email" type="email" style={inputStyle} value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                placeholder="jane@company.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input data-testid="input-phone" style={inputStyle} value={form.contactPhone}
                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                placeholder="512-555-0100" />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input data-testid="input-location" style={inputStyle} value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Austin, TX 78701" />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Fair-Chance Commitments * <span style={{ color: "#64748b", fontWeight: 400 }}>(at least one required)</span></label>
            {[
              { key: "banTheBox", label: "Ban the Box — we do not ask about criminal history on initial applications" },
              { key: "fairChanceHiring", label: "Fair Chance Hiring — criminal history is not an automatic disqualifier" },
              { key: "barrierFriendly", label: "Barrier Friendly — we actively support candidates facing employment barriers" },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                <input data-testid={`checkbox-${key}`} type="checkbox"
                  checked={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  style={{ marginTop: 2 }} />
                <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Credential areas you hire for</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CREDENTIAL_OPTIONS.map(c => (
                <label key={c} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  borderRadius: 6, border: `1px solid ${form.credentialTags.includes(c) ? "#10b981" : "#e2e8f0"}`,
                  background: form.credentialTags.includes(c) ? "#f0fdf4" : "#fff",
                  cursor: "pointer", fontSize: 13,
                }}>
                  <input data-testid={`credential-${c}`} type="checkbox" checked={form.credentialTags.includes(c)}
                    onChange={e => setForm(f => ({
                      ...f,
                      credentialTags: e.target.checked
                        ? [...f.credentialTags, c]
                        : f.credentialTags.filter(t => t !== c),
                    }))} style={{ display: "none" }} />
                  <span style={{
                    color: form.credentialTags.includes(c) ? "#065f46" : "#64748b",
                    fontWeight: form.credentialTags.includes(c) ? 600 : 400,
                    textTransform: "capitalize",
                  }}>{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Hiring commitments or additional context</label>
            <textarea data-testid="input-commitments"
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              value={form.hiringCommitments}
              onChange={e => setForm(f => ({ ...f, hiringCommitments: e.target.value }))}
              placeholder="Describe your commitment to fair-chance hiring, any specific programs, or how you support employees with barriers…" />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <button data-testid="btn-submit-employer"
            onClick={submit}
            disabled={submitting || !canSubmit}
            style={{
              padding: "14px 32px", background: canSubmit ? "#10b981" : "#e2e8f0",
              color: canSubmit ? "#fff" : "#94a3b8",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed", width: "100%",
            }}>
            {submitting ? "Submitting…" : "Submit employer application"}
          </button>
          <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
            Applications are reviewed within 3 business days. At least one fair-chance commitment is required.
          </div>
        </div>
      </div>
    </div>
  );
}
