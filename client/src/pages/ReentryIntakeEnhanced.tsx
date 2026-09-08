import { useState } from "react";
import { EvidenceSummary } from "@/components/evidence-label";
import { ConsentDisclosure } from "@/components/consent-disclosure";

const RISK_QUESTIONS = [
  { id: "priorFelonies", label: "Has the participant had 2 or more prior felony convictions?" },
  { id: "priorViolations", label: "Has the participant had prior probation or parole violations?" },
  { id: "unstableHousing", label: "Does the participant have unstable or no housing at release?" },
  { id: "unemployedAtOffense", label: "Was the participant unemployed at the time of the offense?" },
  { id: "noHsDiploma", label: "Does the participant lack a high school diploma or GED?" },
  { id: "substanceHistory", label: "Is there a documented history of substance use?" },
  { id: "antisocialNetwork", label: "Does the participant's primary social network have criminal history?" },
  { id: "mentalHealthNeeds", label: "Has the participant self-reported mental health needs?" },
];

const PHASES = ["pre_release", "transition", "stabilization", "independence"] as const;
type Phase = typeof PHASES[number];

interface IntakeProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  currentPhase: Phase;
  dependentsCount: number;
  isVeteran: boolean;
  zipCode: string;
  immediateNeeds: string;
}

export default function ReentryIntakeEnhanced() {
  const [step, setStep] = useState<"profile" | "risk" | "results">("profile");
  const [profile, setProfile] = useState<IntakeProfile>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    currentPhase: "transition",
    dependentsCount: 0,
    isVeteran: false,
    zipCode: "",
    immediateNeeds: "",
  });
  const [riskAnswers, setRiskAnswers] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitIntake() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: profile.dateOfBirth,
          dependents: profile.dependentsCount,
          veteranStatus: profile.isVeteran,
          zipCode: profile.zipCode,
          immediateNeeds: profile.immediateNeeds ? [profile.immediateNeeds] : [],
          riskAnswers,
          zipCodeExtra: profile.zipCode,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data);
      setStep("results");
    } catch (e: any) {
      setError(e.message ?? "Intake failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-10 py-5">
        <div className="text-xs tracking-widest uppercase text-indigo-500 mb-1">
          ThriveUp Academy · Reentry Program
        </div>
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-reentry-intake">
          Participant Intake
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex mb-8">
          {[
            { id: "profile", label: "1. Profile" },
            { id: "risk", label: "2. Risk Screen" },
            { id: "results", label: "3. Results" },
          ].map(({ id, label }) => (
            <div
              key={id}
              className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 ${
                step === id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-slate-200 text-slate-400"
              }`}
              data-testid={`step-indicator-${id}`}
            >
              {label}
            </div>
          ))}
        </div>
        <ConsentDisclosure
          className="mb-6"
          purpose="Create a reentry participant profile and identify service needs for case-management follow-up."
          fields={[
            { name: "Name, date of birth, ZIP code, and dependents", why: "Creates and matches the participant profile.", required: true },
            { name: "Criminal history and supervision history", why: "Supports the risk and needs screen.", sensitive: true },
            { name: "Housing status and immediate needs", why: "Identifies stabilization services.", sensitive: true },
            { name: "Substance use and mental health needs", why: "Identifies appropriate health and recovery referrals.", sensitive: true },
          ]}
          sharing="Authorized TCAF reentry case-management staff and service coordinators supporting this participant."
          withdrawal="Ask a case manager to review, correct, or withdraw information where permitted."
        />

        {step === "profile" && (
          <div className="bg-white rounded-xl border border-slate-200 p-7">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  className={inputCls}
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="First name"
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  className={inputCls}
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Last name"
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input
                  type="date"
                  className={inputCls}
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  data-testid="input-dob"
                />
              </div>
              <div>
                <label className={labelCls}>Current Phase</label>
                <select
                  className={inputCls}
                  value={profile.currentPhase}
                  onChange={(e) => setProfile((p) => ({ ...p, currentPhase: e.target.value as Phase }))}
                  data-testid="select-phase"
                >
                  {PHASES.map((ph) => (
                    <option key={ph} value={ph}>
                      {ph.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>ZIP Code</label>
                <input
                  className={inputCls}
                  value={profile.zipCode}
                  onChange={(e) => setProfile((p) => ({ ...p, zipCode: e.target.value }))}
                  placeholder="78653"
                  data-testid="input-zip"
                />
              </div>
              <div>
                <label className={labelCls}>Number of Dependents</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={profile.dependentsCount}
                  onChange={(e) => setProfile((p) => ({ ...p, dependentsCount: parseInt(e.target.value) || 0 }))}
                  data-testid="input-dependents"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isVeteran}
                  onChange={(e) => setProfile((p) => ({ ...p, isVeteran: e.target.checked }))}
                  data-testid="checkbox-veteran"
                />
                Veteran (eligible for additional VA benefits)
              </label>
            </div>
            <div className="mb-6">
              <label className={labelCls}>Immediate Needs (free text)</label>
              <textarea
                className={`${inputCls} min-h-[80px] resize-y`}
                value={profile.immediateNeeds}
                onChange={(e) => setProfile((p) => ({ ...p, immediateNeeds: e.target.value }))}
                placeholder="Housing, ID, medications, childcare…"
                data-testid="textarea-immediate-needs"
              />
            </div>
            <button
              onClick={() => setStep("risk")}
              disabled={!profile.firstName || !profile.lastName}
              data-testid="button-continue-to-risk"
              className="px-7 py-3 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              Continue to Risk Screen →
            </button>
          </div>
        )}

        {step === "risk" && (
          <div className="bg-white rounded-xl border border-slate-200 p-7">
            <div className="mb-5">
              <div className="text-base font-bold text-slate-900 mb-2">Risk & Needs Screen</div>
              <div className="text-sm text-slate-500 leading-relaxed">
                Simplified 8-domain intake triage. Scores 6+ flag for full LSI-R or ORAS assessment by a case manager.
                All responses are confidential.
              </div>
            </div>
            {RISK_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-4 py-3.5 border-b border-slate-100 last:border-0"
                data-testid={`risk-question-${q.id}`}
              >
                <div className="flex gap-3 shrink-0">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        checked={riskAnswers[q.id] === (opt === "Yes")}
                        onChange={() => setRiskAnswers((r) => ({ ...r, [q.id]: opt === "Yes" }))}
                        data-testid={`radio-${q.id}-${opt.toLowerCase()}`}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{q.label}</span>
              </div>
            ))}
            {error && (
              <div className="text-red-600 text-sm mt-4" data-testid="text-intake-error">
                {error}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("profile")}
                className="px-5 py-2.5 bg-transparent border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                data-testid="button-back-to-profile"
              >
                ← Back
              </button>
              <button
                onClick={submitIntake}
                disabled={submitting}
                data-testid="button-complete-intake"
                className="px-7 py-3 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                {submitting ? "Creating profile…" : "Complete Intake →"}
              </button>
            </div>
          </div>
        )}

        {step === "results" && results && (
          <div className="space-y-4">
            {results.riskScreen && (
              <div
                className={`rounded-xl border p-5 ${
                  results.riskScreen.riskLevel === "high"
                    ? "bg-red-50 border-red-200"
                    : results.riskScreen.riskLevel === "medium"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-green-50 border-green-200"
                }`}
                data-testid="card-risk-result"
              >
                <div className="text-sm font-bold text-slate-900 mb-2">
                  Risk/Needs Screen:{" "}
                  <span
                    className={
                      results.riskScreen.riskLevel === "high"
                        ? "text-red-600"
                        : results.riskScreen.riskLevel === "medium"
                        ? "text-amber-600"
                        : "text-green-600"
                    }
                  >
                    {results.riskScreen.riskLevel} risk
                  </span>{" "}
                  (score {results.riskScreen.score}/16)
                </div>
                {results.riskScreen.recommendFullAssessment && (
                  <div className="text-sm text-amber-800 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 mb-3" data-testid="banner-full-assessment">
                    ⚠ Recommend full LSI-R or ORAS assessment by a case manager
                  </div>
                )}
                {results.riskScreen.flaggedDomains?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Flagged domains:</div>
                    {results.riskScreen.flaggedDomains.map((d: string) => (
                      <div key={d} className="text-sm text-slate-700 mb-1">• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {results.benefitsScreening && results.benefitsScreening.gaps?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5" data-testid="card-benefits-result">
                <div className="text-sm font-bold text-slate-900 mb-3">
                  Benefits Gap —{" "}
                  <span className="text-emerald-600">
                    estimated ${results.benefitsScreening.estimatedAnnualValue?.toLocaleString()}/yr unclaimed
                  </span>
                </div>
                {results.benefitsScreening.gaps.map((b: string) => (
                  <div
                    key={b}
                    className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0"
                    data-testid={`benefit-gap-${b}`}
                  >
                    <span className="text-sm font-semibold text-slate-900">{b}</span>
                    {results.benefitsScreening.navigationGuides?.[b]?.applicationUrl && (
                      <a
                        href={results.benefitsScreening.navigationGuides[b].applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                        data-testid={`link-apply-${b}`}
                      >
                        Apply →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.employerMatches?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5" data-testid="card-employer-matches">
                <div className="text-sm font-bold text-slate-900 mb-3">
                  Fair-Chance Employer Matches ({results.employerMatches.length})
                </div>
                {results.employerMatches.map((m: any) => (
                  <div key={m.employer.id} className="py-3 border-b border-slate-100 last:border-0">
                    <div className="text-sm font-semibold text-slate-900">{m.employer.companyName}</div>
                    <div className="text-xs text-slate-500 mb-1.5">
                      {m.employer.industry} · {m.openPostings.length} open position
                      {m.openPostings.length !== 1 ? "s" : ""}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {m.openPostings.slice(0, 3).map((p: any) => (
                        <span
                          key={p.id}
                          className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded"
                        >
                          {p.title}
                          {p.wageRange ? ` · ${p.wageRange}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-100 rounded-lg px-4 py-3 text-sm text-slate-500" data-testid="card-intake-ids">
              Household record: <strong>{results.householdId}</strong>
              <br />
              Participant ID: <strong>{results.profile?.id}</strong>
            </div>
            <EvidenceSummary
              claims={[{
                value: results.riskScreen?.score ?? null,
                unit: "risk-screen score",
                source: "TCAF Reentry Case Management System",
                sourceId: "tcaf-reentry-cms",
                asOfDate: null,
                geographyKey: null,
                confidence: "verified",
                decisionCaption: "This screen supports triage and must be reviewed by a case manager; it is not a clinical or sentencing decision.",
              }]}
            />

            <button
              onClick={() => {
                setStep("profile");
                setProfile({ firstName: "", lastName: "", dateOfBirth: "", currentPhase: "transition", dependentsCount: 0, isVeteran: false, zipCode: "", immediateNeeds: "" });
                setRiskAnswers({});
                setResults(null);
              }}
              data-testid="button-new-intake"
              className="w-full py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Start New Intake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
