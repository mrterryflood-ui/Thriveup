import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";

const URGENCY_COLOR: Record<string, string> = {
  immediate: "#dc2626",
  within_week: "#ea580c",
  within_month: "#ca8a04",
  routine: "#16a34a",
};

const RISK_COLOR: Record<string, string> = {
  low: "#16a34a",
  moderate: "#ca8a04",
  high: "#ea580c",
  very_high: "#dc2626",
};

type Step = "intro" | "rnr" | "phq9" | "pcl5" | "results";

export default function ClinicalScreening() {
  const [, params] = useRoute("/clinical-screening/:participantId");
  const participantId = params?.participantId;

  const [step, setStep] = useState<Step>("intro");
  const [rnrResponses, setRnrResponses] = useState<Record<string, boolean>>({});
  const [phq9Responses, setPhq9Responses] = useState<Record<string, number>>({});
  const [pcl5Responses, setPcl5Responses] = useState<Record<string, number>>({});
  const [instruments, setInstruments] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instrumentError, setInstrumentError] = useState<string | null>(null);
  const [loadingInstruments, setLoadingInstruments] = useState(true);

  const loadInstruments = useCallback(async () => {
    setLoadingInstruments(true);
    setInstrumentError(null);
    try {
      const res = await fetch("/api/clinical/instruments", { credentials: "include" });
      if (!res.ok) {
        throw new Error(res.status === 401
          ? "Your session expired. Please sign in again."
          : "Screening instruments are temporarily unavailable.");
      }
      const data = await res.json();
      if (!data?.rnr?.items || !data?.phq9?.items || !data?.pcl5?.items) {
        throw new Error("Screening instruments are temporarily unavailable.");
      }
      setInstruments(data);
    } catch (err) {
      setInstruments(null);
      setInstrumentError(err instanceof Error ? err.message : "Failed to load screening instruments.");
    } finally {
      setLoadingInstruments(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Comprehensive Needs Assessment | ThriveUp";
    void loadInstruments();
  }, [loadInstruments]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clinical/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          instrumentType: "combined",
          rnrResponses,
          phq9Responses,
          pcl5Responses,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data);
      setStep("results");
    } catch (e: any) {
      setError(e.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const base: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" };
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 32px", marginBottom: 20 };
  const btn = (active: boolean, color = "#6366f1"): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: 7, border: `1px solid ${active ? color : "#e2e8f0"}`,
    background: active ? color : "transparent", color: active ? "#fff" : "#64748b",
    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
  });

  const rnrItems = instruments?.rnr?.items ?? [];
  const phq9Items = instruments?.phq9?.items ?? [];
  const pcl5Items = instruments?.pcl5?.items ?? [];
  const rnrComplete = rnrItems.length > 0 && rnrItems.every((item: any) => rnrResponses[item.id] !== undefined);
  const phq9Complete = phq9Items.length > 0 && phq9Items.every((item: any) => phq9Responses[item.id] !== undefined);
  const pcl5Complete = pcl5Items.length > 0 && pcl5Items.every((item: any) => pcl5Responses[item.id] !== undefined);

  return (
    <div style={base}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 4 }}>
          ThriveUp · Clinical Screening
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Comprehensive Needs Assessment
        </h1>
        {participantId && (
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Participant: {participantId}</div>
        )}
      </div>

      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        {(["intro","rnr","phq9","pcl5","results"] as Step[]).map((s, i) => (
          <div key={s} style={{
            flex: 1, padding: "12px 0", textAlign: "center",
            borderBottom: step === s ? "3px solid #6366f1" : "3px solid transparent",
            color: step === s ? "#6366f1" : "#94a3b8",
            fontSize: 13, fontWeight: step === s ? 700 : 400,
          }}>
            {["About","Needs (25)","Depression (9)","Trauma (20)","Results"][i]}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 760, margin: "32px auto", padding: "0 24px" }}>
        {instrumentError && (
          <div role="alert" style={{ ...card, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Assessment unavailable</div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>{instrumentError}</div>
            <button onClick={() => void loadInstruments()} style={btn(true, "#b91c1c")} disabled={loadingInstruments}>
              {loadingInstruments ? "Retrying…" : "Try again"}
            </button>
          </div>
        )}

        {step === "intro" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              About this assessment
            </h2>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
              This assessment combines three validated instruments to understand your needs and connect you with the right support. It takes approximately 20–30 minutes. Your responses are confidential and used only to inform your care plan.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { name: "Needs Screen", items: "25 questions", desc: "Life circumstances and support needs" },
                { name: "PHQ-9", items: "9 questions", desc: "Mood and emotional wellbeing" },
                { name: "PCL-5", items: "20 questions", desc: "Stress responses and trauma" },
              ].map(({ name, items, desc }) => (
                <div key={name} style={{ background: "#f8fafc", borderRadius: 8, padding: "16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 4 }}>{items}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e" }}>
              <strong>Note:</strong> If you are experiencing thoughts of self-harm or suicide, please call or text <strong>988</strong> immediately. You are not alone.
            </div>
            <button data-testid="btn-begin-assessment" onClick={() => setStep("rnr")} disabled={loadingInstruments || !!instrumentError} style={{ ...btn(!loadingInstruments && !instrumentError), padding: "12px 28px", fontSize: 14 }}>
              {loadingInstruments ? "Loading assessment…" : "Begin assessment →"}
            </button>
          </div>
        )}

        {step === "rnr" && (
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Part 1 of 3: Needs Screen</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Answer yes or no to each question. There are no right or wrong answers.</div>
            </div>
            {rnrItems.map((item: any, i: number) => (
              <div key={item.id} style={{ ...card, padding: "16px 20px", marginBottom: 10 }}>
                <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginBottom: 12 }}>
                  <span style={{ color: "#6366f1", fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                  {item.question}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["Yes", "No"].map(opt => (
                    <button key={opt}
                      data-testid={`rnr-${item.id}-${opt.toLowerCase()}`}
                      onClick={() => setRnrResponses(r => ({ ...r, [item.id]: opt === "Yes" }))}
                      style={btn(rnrResponses[item.id] === (opt === "Yes"))}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button onClick={() => setStep("intro")} style={btn(false)}>← Back</button>
              <button data-testid="btn-continue-phq9" onClick={() => setStep("phq9")} disabled={!rnrComplete}
                style={{ ...btn(rnrComplete), padding: "12px 24px" }}>
                Continue to PHQ-9 →
              </button>
            </div>
          </div>
        )}

        {step === "phq9" && (
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Part 2 of 3: PHQ-9</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Over the last 2 weeks, how often have you been bothered by any of the following problems?</div>
            </div>
            {phq9Items.map((item: any, i: number) => (
              <div key={item.id} style={{ ...card, padding: "16px 20px", marginBottom: 10 }}>
                {item.id === "phq9" && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#dc2626" }}>
                    If you answered anything other than "Not at all" to this question, please speak with your facilitator or call 988.
                  </div>
                )}
                <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginBottom: 12 }}>
                  <span style={{ color: "#6366f1", fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                  {item.question}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { value: 0, label: "Not at all" },
                    { value: 1, label: "Several days" },
                    { value: 2, label: "More than half" },
                    { value: 3, label: "Nearly every day" },
                  ].map(opt => (
                    <button key={opt.value}
                      data-testid={`phq9-${item.id}-${opt.value}`}
                      onClick={() => setPhq9Responses(r => ({ ...r, [item.id]: opt.value }))}
                      style={btn(phq9Responses[item.id] === opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button onClick={() => setStep("rnr")} style={btn(false)}>← Back</button>
              <button data-testid="btn-continue-pcl5" onClick={() => setStep("pcl5")} disabled={!phq9Complete}
                style={{ ...btn(phq9Complete), padding: "12px 24px" }}>
                Continue to PCL-5 →
              </button>
            </div>
          </div>
        )}

        {step === "pcl5" && (
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Part 3 of 3: PCL-5</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Below is a list of problems that people sometimes have in response to a very stressful experience. In the past month, how much have you been bothered by each of the following?</div>
            </div>
            {pcl5Items.map((item: any, i: number) => (
              <div key={item.id} style={{ ...card, padding: "16px 20px", marginBottom: 10 }}>
                <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginBottom: 12 }}>
                  <span style={{ color: "#6366f1", fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                  {item.question}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { value: 0, label: "Not at all" },
                    { value: 1, label: "A little" },
                    { value: 2, label: "Moderately" },
                    { value: 3, label: "Quite a bit" },
                    { value: 4, label: "Extremely" },
                  ].map(opt => (
                    <button key={opt.value}
                      data-testid={`pcl5-${item.id}-${opt.value}`}
                      onClick={() => setPcl5Responses(r => ({ ...r, [item.id]: opt.value }))}
                      style={btn(pcl5Responses[item.id] === opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button onClick={() => setStep("phq9")} style={btn(false)}>← Back</button>
              <button data-testid="btn-complete-screening" onClick={submit} disabled={!pcl5Complete || submitting}
                style={{ ...btn(pcl5Complete && !submitting), padding: "12px 28px", background: pcl5Complete && !submitting ? "#6366f1" : "#e2e8f0" }}>
                {submitting ? "Scoring…" : "Complete & View Results →"}
              </button>
            </div>
          </div>
        )}

        {step === "results" && results && (
          <div>
            {results.crisisAlert && (
              <div style={{ background: "#fef2f2", border: "2px solid #dc2626", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626", marginBottom: 8 }}>
                  ⚠ Immediate Support Available
                </div>
                <div style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.6, marginBottom: 8 }}>{results.crisisAlert.message}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>{results.crisisAlert.contact}</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {results.rnrResult && (
                <div style={{ ...card, margin: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Needs Screen</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: RISK_COLOR[results.rnrResult.riskLevel] }}>
                    {results.rnrResult.totalScore}/50
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: RISK_COLOR[results.rnrResult.riskLevel], textTransform: "capitalize" }}>
                    {results.rnrResult.riskLevel.replace("_", " ")} risk
                  </div>
                  {results.rnrResult.recommendFullLsiR && (
                    <div style={{ fontSize: 11, color: "#ea580c", marginTop: 6 }}>Full LSI-R recommended</div>
                  )}
                </div>
              )}
              {results.phq9Result && (
                <div style={{ ...card, margin: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>PHQ-9</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: results.phq9Result.totalScore >= 15 ? "#dc2626" : results.phq9Result.totalScore >= 10 ? "#ea580c" : "#16a34a" }}>
                    {results.phq9Result.totalScore}/27
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize", color: "#374151" }}>
                    {results.phq9Result.severity.replace("_", " ")}
                  </div>
                </div>
              )}
              {results.pcl5Result && (
                <div style={{ ...card, margin: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>PCL-5</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: results.pcl5Result.ptsdIndicator ? "#dc2626" : "#16a34a" }}>
                    {results.pcl5Result.totalScore}/80
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: results.pcl5Result.ptsdIndicator ? "#dc2626" : "#16a34a" }}>
                    {results.pcl5Result.ptsdIndicator ? "PTSD indicator" : "Below threshold"}
                  </div>
                </div>
              )}
            </div>

            {results.referrals?.length > 0 && (
              <div style={card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
                  Recommended resources ({results.referrals.length})
                </div>
                {results.referrals.map((r: any, i: number) => (
                  <div key={i} style={{ padding: "14px 0", borderBottom: i < results.referrals.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{r.resourceName}</div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: `${URGENCY_COLOR[r.urgency]}18`,
                        color: URGENCY_COLOR[r.urgency],
                        border: `1px solid ${URGENCY_COLOR[r.urgency]}30`,
                        whiteSpace: "nowrap", marginLeft: 12,
                      }}>
                        {r.urgency.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{r.resourceType}</div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{r.contactInfo}</div>
                    {r.eligibilityNote && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>{r.eligibilityNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              {results.rnrResult?.interpretationNote && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#475569" }}>
                  <strong>Needs screen:</strong> {results.rnrResult.interpretationNote}
                </div>
              )}
              {results.phq9Result?.clinicalNote && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#475569" }}>
                  <strong>Depression screen:</strong> {results.phq9Result.clinicalNote}
                </div>
              )}
              {results.pcl5Result?.clinicalNote && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#475569" }}>
                  <strong>Trauma screen:</strong> {results.pcl5Result.clinicalNote}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
