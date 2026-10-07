import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { EvidenceSummary } from "@/components/evidence-label";

const DOMAIN_COLORS: Record<string, string> = {
  housing: "#f87171",
  food: "#fb923c",
  transportation: "#f59e0b",
  childcare: "#a78bfa",
  legal: "#60a5fa",
  healthcare: "#34d399",
  safety: "#f472b6",
};

const DOMAIN_PARTNERS: Record<string, string> = {
  housing: "LifeBridge",
  food: "Whole-Person Health",
  transportation: "ISSS",
  childcare: "ISSS",
  legal: "Collaborative Advocate",
  healthcare: "Whole-Person Health",
  safety: "SafeReport",
};

function BurdenBadge({ score }: { score: number }) {
  const category =
    score >= 5 ? "Critical" : score >= 3.5 ? "High" : score >= 2 ? "Moderate" : "Low";
  const color =
    score >= 5 ? "#dc2626" : score >= 3.5 ? "#ea580c" : score >= 2 ? "#ca8a04" : "#16a34a";
  return (
    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }}>
      {category} · {score.toFixed(1)}/7
    </span>
  );
}

function MemberCard({ member, sdoh }: any) {
  const burdenScore = sdoh ? sdoh.compositeBurdenScore / 10 : null;
  const flaggedDomains = sdoh
    ? ["housing","food","transportation","childcare","legal","healthcare","safety"].filter((d) => (sdoh as any)[`${d}Score`] > 0)
    : [];

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>{member.memberName}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {member.role.replace(/_/g, " ")} · {member.status}
            {member.isEmployed && " · Employed"}
            {member.hasVehicle && " · Has vehicle"}
          </div>
        </div>
        {burdenScore !== null && <BurdenBadge score={burdenScore} />}
      </div>
      {flaggedDomains.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Barriers identified</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {flaggedDomains.map((d) => (
              <span key={d} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, background: `${DOMAIN_COLORS[d]}18`, color: DOMAIN_COLORS[d], border: `1px solid ${DOMAIN_COLORS[d]}30` }}>
                {d} → {DOMAIN_PARTNERS[d]}
              </span>
            ))}
          </div>
        </div>
      )}
      {member.isMinor && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#a78bfa" }}>
          ⚠ Minor — parental consent required for program enrollment
        </div>
      )}
    </div>
  );
}

export default function HouseholdProfilePage() {
  const [, params] = useRoute("/household/:id");
  const householdId = params?.id;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "sdoh" | "outcomes">("overview");

  useEffect(() => {
    if (!householdId) return;
    fetch(`/api/households/${householdId}`)
      .then((r) => r.json())
      .then((d) => { setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [householdId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
      Loading household profile…
    </div>
  );

  if (!profile || profile.error) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171" }}>
      Household not found.
    </div>
  );

  const { household, members, latestSdoh, latestOutcome, aggregates } = profile;
  const tabs = ["overview", "members", "sdoh", "outcomes"] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "24px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10b981", marginBottom: 4 }}>
          ThriveUp · Household Profile
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{household.householdCode}</h1>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {household.zipCode && `ZIP ${household.zipCode}`}
            {household.countyFips && ` · FIPS ${household.countyFips}`}
            {household.programCohort && ` · ${household.programCohort}`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 40px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            style={{ padding: "14px 20px", background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #10b981" : "2px solid transparent", color: activeTab === tab ? "#10b981" : "#64748b", fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>

        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Active Members", value: aggregates.activeMembers, color: "#10b981" },
                { label: "Employed", value: aggregates.employedCount, color: "#34d399" },
                { label: "Active Learners", value: aggregates.activeLearners, color: "#60a5fa" },
                { label: "Credentials Earned", value: aggregates.credentialsEarned, color: "#a78bfa" },
                { label: "Avg SDOH Burden", value: `${aggregates.avgBurdenScore}/7`, color: aggregates.avgBurdenScore >= 4 ? "#f87171" : "#f59e0b" },
                { label: "Combined Wage/hr", value: `$${aggregates.combinedWagePerHour.toFixed(2)}`, color: "#34d399" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <EvidenceSummary
              claims={[{
                value: aggregates.activeMembers,
                unit: "active household members",
                source: "TCAF Platform Administrative Records",
                sourceId: "platform-program-enrollment",
                asOfDate: null,
                geographyKey: household.countyFips || null,
                confidence: "verified",
                decisionCaption: "Use household records to coordinate services with the household's consent.",
              }]}
            />
            {aggregates.highestBurdenDomains.length > 0 && (
              <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fb923c", marginBottom: 12 }}>Priority barriers for this household</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {aggregates.highestBurdenDomains.map((d: string) => (
                    <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: `${DOMAIN_COLORS[d]}15`, border: `1px solid ${DOMAIN_COLORS[d]}30`, borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: DOMAIN_COLORS[d], fontWeight: 600, textTransform: "capitalize" }}>{d}</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>→ {DOMAIN_PARTNERS[d]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div>
            {members.map((m: any) => {
              const sdoh = latestSdoh.find((s: any) => s.memberId === m.id);
              return <MemberCard key={m.id} member={m} sdoh={sdoh} />;
            })}
            {members.length === 0 && (
              <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>No members found.</div>
            )}
          </div>
        )}

        {activeTab === "sdoh" && (
          <div>
            {latestSdoh.length === 0 && (
              <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>
                No SDOH screenings on record.
              </div>
            )}
            {latestSdoh.map((s: any) => {
              const member = members.find((m: any) => m.id === s.memberId);
              const domains = ["housing","food","transportation","childcare","legal","healthcare","safety"];
              return (
                <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{member?.memberName ?? "Member"}</div>
                    <BurdenBadge score={s.compositeBurdenScore / 10} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                    {domains.map((d) => {
                      const val = (s as any)[`${d}Score`];
                      return (
                        <div key={d} style={{ textAlign: "center" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", margin: "0 auto 6px", background: val > 0 ? `${DOMAIN_COLORS[d]}30` : "rgba(255,255,255,0.04)", border: `2px solid ${val > 0 ? DOMAIN_COLORS[d] : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                            {val > 0 ? "⚠" : "✓"}
                          </div>
                          <div style={{ fontSize: 10, color: val > 0 ? DOMAIN_COLORS[d] : "#475569", textTransform: "capitalize" }}>{d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "outcomes" && (
          <div>
            {latestOutcome ? (
              <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 12, padding: "24px 28px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 16 }}>Latest Outcome Snapshot</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    ["Employed Members", latestOutcome.employedMemberCount],
                    ["Active Learners", latestOutcome.activeLearnersCount],
                    ["Credentials Earned", latestOutcome.credentialsEarnedCount],
                    ["WIOA Enrolled", latestOutcome.wioa_enrolled ? "Yes" : "No"],
                    ["Pell Eligible", latestOutcome.pellEligibleFlag ? "Yes" : "No"],
                    ["Reentry Household", latestOutcome.reentryHousehold ? "Yes" : "No"],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: "#475569" }}>
                  Snapshot: {new Date(latestOutcome.measuredAt).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>
                No outcome snapshots yet. They generate automatically when SDOH data is recorded.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
