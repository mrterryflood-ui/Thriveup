import { db } from "./storage";
import { agencyIntelligence, type AgencyIntelligence } from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

const REFRESH_DAYS = 7;

export type AgencyIntel = {
  agencyName: string;
  cfda?: string | null;
  opportunityNumber?: string | null;
  typicalAwardSize?: string;
  typicalDuration?: string;
  recentWinners: Array<{ recipient: string; project?: string; amount?: number; year?: number }>;
  whatTheyFund: string;
  languagePatterns: string[];
  source: string;
  refreshedAt: string;
};

function isStale(d: Date | string | null | undefined): boolean {
  if (!d) return true;
  const ts = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  return Date.now() - ts > REFRESH_DAYS * 86400 * 1000;
}

async function fetchUsaSpendingAwards(agency: string, cfda?: string | null): Promise<Array<{ recipient: string; project?: string; amount?: number; year?: number }>> {
  try {
    const body: any = {
      filters: {
        award_type_codes: ["02", "03", "04", "05"], // grants
        agencies: [{ type: "awarding", tier: "toptier", name: agency }],
        time_period: [{ start_date: `${new Date().getFullYear() - 3}-01-01`, end_date: new Date().toISOString().slice(0, 10) }],
      },
      fields: ["Recipient Name", "Award Amount", "Award Description", "Start Date"],
      page: 1, limit: 25, sort: "Award Amount", order: "desc",
    };
    if (cfda) body.filters.program_numbers = [cfda];
    const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: Array<Record<string, unknown>> };
    return (data.results ?? []).slice(0, 15).map((r) => ({
      recipient: String(r["Recipient Name"] ?? "Unknown"),
      project: r["Award Description"] ? String(r["Award Description"]).slice(0, 200) : undefined,
      amount: typeof r["Award Amount"] === "number" ? r["Award Amount"] as number : Number(r["Award Amount"]) || undefined,
      year: r["Start Date"] ? new Date(String(r["Start Date"])).getFullYear() : undefined,
    }));
  } catch (err) {
    console.error("[agency-intel] usaspending fetch failed:", err);
    return [];
  }
}

async function summarizeWithAI(agency: string, winners: Array<{ recipient: string; project?: string; amount?: number; year?: number }>): Promise<{ whatTheyFund: string; languagePatterns: string[]; typicalAwardSize: string }> {
  if (winners.length === 0) {
    return { whatTheyFund: "No prior-award data available for this agency in USASpending.", languagePatterns: [], typicalAwardSize: "Unknown" };
  }
  const amounts = winners.map(w => w.amount).filter((a): a is number => typeof a === "number" && a > 0);
  const median = amounts.length ? amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)] : 0;
  const typical = median ? `$${(median / 1000).toFixed(0)}K (median of ${amounts.length} recent awards)` : "Unknown";

  const sample = winners.slice(0, 10).map(w => `- ${w.recipient}${w.amount ? ` ($${w.amount.toLocaleString()})` : ""}${w.project ? `: ${w.project}` : ""}`).join("\n");
  try {
    const ai = await generateAIJSON<Record<string, unknown>>(
      `Agency: ${agency}\n\nRecent winners and project descriptions:\n${sample}`,
      "You summarize federal grant award patterns for nonprofit grant writers. Be specific, evidence-based, and concise. Return JSON: {\"whatTheyFund\": \"2-3 sentences naming the project types this agency actually funds based on the award list\", \"languagePatterns\": [\"4-7 short phrases (3-7 words each) that recur across winning project descriptions — verbs, frames, populations, methodologies\"]}"
    );
    const parsed = (ai && typeof ai === "object") ? ai : {};
    return {
      whatTheyFund: typeof parsed.whatTheyFund === "string" ? parsed.whatTheyFund : "Summary unavailable.",
      languagePatterns: Array.isArray(parsed.languagePatterns) ? (parsed.languagePatterns as unknown[]).map(String).slice(0, 10) : [],
      typicalAwardSize: typical,
    };
  } catch (err) {
    console.error("[agency-intel] AI summary failed:", err);
    return { whatTheyFund: "AI summary unavailable; see recent winners list.", languagePatterns: [], typicalAwardSize: typical };
  }
}

export async function getAgencyIntel(agencyName: string, cfda?: string | null, opportunityNumber?: string | null): Promise<AgencyIntel> {
  const name = agencyName.trim();
  const conds = [eq(agencyIntelligence.agencyName, name)];
  if (cfda) conds.push(eq(agencyIntelligence.cfda, cfda)); else conds.push(isNull(agencyIntelligence.cfda));
  if (opportunityNumber) conds.push(eq(agencyIntelligence.opportunityNumber, opportunityNumber)); else conds.push(isNull(agencyIntelligence.opportunityNumber));
  const [cached] = await db.select().from(agencyIntelligence).where(and(...conds));

  if (cached && !isStale(cached.refreshedAt)) {
    return cached.intel as AgencyIntel;
  }

  const winners = await fetchUsaSpendingAwards(name, cfda);
  const summary = await summarizeWithAI(name, winners);
  const intel: AgencyIntel = {
    agencyName: name,
    cfda: cfda ?? null,
    opportunityNumber: opportunityNumber ?? null,
    typicalAwardSize: summary.typicalAwardSize,
    typicalDuration: "Not estimated (varies by program)",
    recentWinners: winners,
    whatTheyFund: summary.whatTheyFund,
    languagePatterns: summary.languagePatterns,
    source: "USASpending.gov + AI summary",
    refreshedAt: new Date().toISOString(),
  };

  try {
    await db.insert(agencyIntelligence).values({
      agencyName: name, cfda: cfda ?? null, opportunityNumber: opportunityNumber ?? null, intel,
    }).onConflictDoUpdate({
      target: [agencyIntelligence.agencyName, agencyIntelligence.cfda, agencyIntelligence.opportunityNumber],
      set: { intel, refreshedAt: new Date() },
    });
  } catch (err) {
    console.error("[agency-intel] cache write failed:", err);
  }

  return intel;
}
