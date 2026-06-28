import { db } from "./storage";
import { agencyIntelligence } from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";
import {
  detectProfileFromGrant,
  getAllRagEntries,
  AGENCY_PROFILES,
  type AgencyProfile,
} from "./agency-profiles";

// USASpending live award data refreshes every 7 days.
const REFRESH_DAYS = 7;

// Agency resource-page refresh (forms, language dictionary updates) — monthly.
const RESOURCE_REFRESH_DAYS = 30;

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
  // ── Profile layer (from static agency-profiles.ts) ──────────────────────
  profile?: {
    agencyId: string;
    name: string;
    abbreviation: string;
    resourcesUrl: string;
    performanceSystem: string;
    requiredForms: Array<{ name: string; description: string; url: string; required: boolean; whenRequired?: string }>;
    languageDictionary: string[];
    evidenceRequirement: string;
    budgetRules: string;
    evaluationSignals: { whatTheyScore: string[]; commonDisqualifiers: string[]; winFactors: string[] };
    programOffices: Array<{ id: string; name: string; focus: string; typicalAward?: string }>;
    // Populated monthly from live resource page fetch
    resourcePageLastFetched?: string | null;
    resourcePageUpdates?: string | null;
  } | null;
};

function isStale(d: Date | string | null | undefined, days = REFRESH_DAYS): boolean {
  if (!d) return true;
  const ts = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  return Date.now() - ts > days * 86400 * 1000;
}

// ── USASpending live award fetch ──────────────────────────────────────────────
async function fetchUsaSpendingAwards(
  agency: string,
  cfda?: string | null,
): Promise<Array<{ recipient: string; project?: string; amount?: number; year?: number }>> {
  try {
    const body: Record<string, unknown> = {
      filters: {
        award_type_codes: ["02", "03", "04", "05"],
        agencies: [{ type: "awarding", tier: "toptier", name: agency }],
        time_period: [
          {
            start_date: `${new Date().getFullYear() - 3}-01-01`,
            end_date: new Date().toISOString().slice(0, 10),
          },
        ],
      },
      fields: ["Recipient Name", "Award Amount", "Award Description", "Start Date"],
      page: 1,
      limit: 25,
      sort: "Award Amount",
      order: "desc",
    };
    if (cfda) (body.filters as Record<string, unknown>).program_numbers = [cfda];
    const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
    return (data.results ?? []).slice(0, 15).map((r) => ({
      recipient: String(r["Recipient Name"] ?? "Unknown"),
      project: r["Award Description"]
        ? String(r["Award Description"]).slice(0, 200)
        : undefined,
      amount:
        typeof r["Award Amount"] === "number"
          ? (r["Award Amount"] as number)
          : Number(r["Award Amount"]) || undefined,
      year: r["Start Date"]
        ? new Date(String(r["Start Date"])).getFullYear()
        : undefined,
    }));
  } catch (err) {
    console.error("[agency-intel] usaspending fetch failed:", err);
    return [];
  }
}

async function summarizeWithAI(
  agency: string,
  winners: Array<{ recipient: string; project?: string; amount?: number; year?: number }>,
  profile?: AgencyProfile,
): Promise<{ whatTheyFund: string; languagePatterns: string[]; typicalAwardSize: string }> {
  if (winners.length === 0 && !profile) {
    return {
      whatTheyFund: "No prior-award data available for this agency in USASpending.",
      languagePatterns: [],
      typicalAwardSize: "Unknown",
    };
  }

  const amounts = winners
    .map((w) => w.amount)
    .filter((a): a is number => typeof a === "number" && a > 0);
  const median = amounts.length
    ? amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)]
    : 0;

  // If the static profile has typical award sizes, prefer that over computed median
  const typicalFromProfile = profile?.programOffices
    .map((o) => o.typicalAward)
    .filter(Boolean)
    .join(" / ");
  const typical =
    typicalFromProfile ||
    (median ? `$${(median / 1000).toFixed(0)}K (median of ${amounts.length} recent awards)` : "Unknown");

  if (winners.length === 0) {
    // Static profile only — no USASpending data
    return {
      whatTheyFund: profile
        ? `${profile.name} (${profile.abbreviation}) funds: ${profile.programOffices.map((o) => o.focus).join("; ")}.`
        : "No award data available.",
      languagePatterns: profile?.languageDictionary.slice(0, 8) ?? [],
      typicalAwardSize: typical,
    };
  }

  const sample = winners
    .slice(0, 10)
    .map(
      (w) =>
        `- ${w.recipient}${w.amount ? ` ($${w.amount.toLocaleString()})` : ""}${w.project ? `: ${w.project}` : ""}`,
    )
    .join("\n");

  try {
    const ai = await generateAIJSON<Record<string, unknown>>(
      `Agency: ${agency}\n\nRecent winners and project descriptions:\n${sample}`,
      `You summarize federal grant award patterns for nonprofit grant writers. Be specific, evidence-based, and concise. Return JSON: {"whatTheyFund": "2-3 sentences naming the project types this agency actually funds based on the award list", "languagePatterns": ["4-7 short phrases (3-7 words each) that recur across winning project descriptions — verbs, frames, populations, methodologies"]}`,
    );
    const parsed = ai && typeof ai === "object" ? ai : {};
    // Merge AI-detected language patterns with static profile dictionary
    const aiPatterns = Array.isArray(parsed.languagePatterns)
      ? (parsed.languagePatterns as unknown[]).map(String).slice(0, 8)
      : [];
    const profilePatterns = profile?.languageDictionary.slice(0, 6) ?? [];
    const merged = [...new Set([...aiPatterns, ...profilePatterns])].slice(0, 14);
    return {
      whatTheyFund:
        typeof parsed.whatTheyFund === "string"
          ? parsed.whatTheyFund
          : "Summary unavailable.",
      languagePatterns: merged,
      typicalAwardSize: typical,
    };
  } catch (err) {
    console.error("[agency-intel] AI summary failed:", err);
    return {
      whatTheyFund: "AI summary unavailable; see recent winners list.",
      languagePatterns: profile?.languageDictionary.slice(0, 8) ?? [],
      typicalAwardSize: typical,
    };
  }
}

// ── Monthly resource-page refresh ─────────────────────────────────────────────
// Fetches the agency's how-to-apply page, extracts any new forms/guidance,
// and stores a brief update note in the DB alongside the intel record.
async function fetchResourcePageUpdates(profile: AgencyProfile): Promise<string | null> {
  try {
    const res = await fetch(profile.resourcesUrl, {
      headers: { "User-Agent": "ThriveUp-GrantBot/1.0 (grant compliance research)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Strip tags, collapse whitespace, take a manageable excerpt
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);

    const update = await generateAIJSON<{ changes: string; newForms: string[]; notes: string }>(
      `Agency: ${profile.name} (${profile.abbreviation})\nResource page URL: ${profile.resourcesUrl}\n\nPage text excerpt:\n${text}`,
      `You are a federal grant compliance specialist reviewing an agency's forms and resources page for changes relevant to grant applicants.
Return JSON: {
  "changes": "1-2 sentence summary of any notable changes to required forms, guidance documents, or application requirements. If nothing changed, write 'No material changes detected.'",
  "newForms": ["list any NEW form names or document titles mentioned that weren't in the standard checklist"],
  "notes": "any deadline, policy change, or compliance note a grant writer should know right now"
}`,
    );

    if (!update || update.changes === "No material changes detected.") return null;
    const parts = [update.changes];
    if (update.newForms?.length) parts.push(`New forms detected: ${update.newForms.join(", ")}`);
    if (update.notes) parts.push(update.notes);
    return parts.join(" | ");
  } catch (err) {
    console.error(`[agency-intel] resource page fetch failed for ${profile.agencyId}:`, err);
    return null;
  }
}

// ── Core export: full merged profile + live data ──────────────────────────────
export async function getAgencyIntel(
  agencyName: string,
  cfda?: string | null,
  opportunityNumber?: string | null,
): Promise<AgencyIntel> {
  const name = agencyName.trim();
  const conds = [eq(agencyIntelligence.agencyName, name)];
  if (cfda) conds.push(eq(agencyIntelligence.cfda, cfda));
  else conds.push(isNull(agencyIntelligence.cfda));
  if (opportunityNumber) conds.push(eq(agencyIntelligence.opportunityNumber, opportunityNumber));
  else conds.push(isNull(agencyIntelligence.opportunityNumber));

  const [cached] = await db.select().from(agencyIntelligence).where(and(...conds));

  // Detect static profile
  const profile = detectProfileFromGrant({ agency: name, cfda: cfda ?? null });

  // USASpending cache still valid → return cached intel merged with static profile
  if (cached && !isStale(cached.refreshedAt, REFRESH_DAYS)) {
    const base = cached.intel as AgencyIntel;
    // Merge static profile into cached record if not already present
    if (profile && !base.profile) {
      return mergeProfile(base, profile);
    }
    return base;
  }

  // Refresh live USASpending data
  const winners = await fetchUsaSpendingAwards(name, cfda);
  const summary = await summarizeWithAI(name, winners, profile);

  // Build profile layer from static data
  let profileLayer: AgencyIntel["profile"] = null;
  if (profile) {
    // Check if resource page needs monthly refresh
    const existingProfile = (cached?.intel as AgencyIntel | undefined)?.profile;
    const lastFetched = existingProfile?.resourcePageLastFetched;
    let resourcePageUpdates = existingProfile?.resourcePageUpdates ?? null;

    if (isStale(lastFetched, RESOURCE_REFRESH_DAYS)) {
      console.log(`[agency-intel] Running monthly resource-page refresh for ${profile.agencyId}`);
      resourcePageUpdates = await fetchResourcePageUpdates(profile);
    }

    profileLayer = {
      agencyId: profile.agencyId,
      name: profile.name,
      abbreviation: profile.abbreviation,
      resourcesUrl: profile.resourcesUrl,
      performanceSystem: `${profile.performanceSystem.name}: ${profile.performanceSystem.description}`,
      requiredForms: profile.requiredForms,
      languageDictionary: profile.languageDictionary,
      evidenceRequirement: `${profile.evidenceRequirements.tier}: ${profile.evidenceRequirements.description}`,
      budgetRules: [
        `Match: ${profile.budgetRules.matchRequired}`,
        `Indirect: ${profile.budgetRules.indirectCostRule}`,
        profile.budgetRules.notes,
      ].join(" | "),
      evaluationSignals: profile.evaluationSignals,
      programOffices: profile.programOffices,
      resourcePageLastFetched: new Date().toISOString(),
      resourcePageUpdates,
    };
  }

  const intel: AgencyIntel = {
    agencyName: name,
    cfda: cfda ?? null,
    opportunityNumber: opportunityNumber ?? null,
    typicalAwardSize: summary.typicalAwardSize,
    typicalDuration: "Not estimated (varies by program)",
    recentWinners: winners,
    whatTheyFund: summary.whatTheyFund,
    languagePatterns: summary.languagePatterns,
    source: profile
      ? "USASpending.gov + AI summary + static agency profile"
      : "USASpending.gov + AI summary",
    refreshedAt: new Date().toISOString(),
    profile: profileLayer,
  };

  try {
    await db
      .insert(agencyIntelligence)
      .values({
        agencyName: name,
        cfda: cfda ?? null,
        opportunityNumber: opportunityNumber ?? null,
        intel,
      })
      .onConflictDoUpdate({
        target: [
          agencyIntelligence.agencyName,
          agencyIntelligence.cfda,
          agencyIntelligence.opportunityNumber,
        ],
        set: { intel, refreshedAt: new Date() },
      });
  } catch (err) {
    console.error("[agency-intel] cache write failed:", err);
  }

  return intel;
}

function mergeProfile(base: AgencyIntel, profile: AgencyProfile): AgencyIntel {
  return {
    ...base,
    languagePatterns: [
      ...new Set([...base.languagePatterns, ...profile.languageDictionary.slice(0, 6)]),
    ].slice(0, 14),
    profile: {
      agencyId: profile.agencyId,
      name: profile.name,
      abbreviation: profile.abbreviation,
      resourcesUrl: profile.resourcesUrl,
      performanceSystem: `${profile.performanceSystem.name}: ${profile.performanceSystem.description}`,
      requiredForms: profile.requiredForms,
      languageDictionary: profile.languageDictionary,
      evidenceRequirement: `${profile.evidenceRequirements.tier}: ${profile.evidenceRequirements.description}`,
      budgetRules: [
        `Match: ${profile.budgetRules.matchRequired}`,
        `Indirect: ${profile.budgetRules.indirectCostRule}`,
        profile.budgetRules.notes,
      ].join(" | "),
      evaluationSignals: profile.evaluationSignals,
      programOffices: profile.programOffices,
      resourcePageLastFetched: null,
      resourcePageUpdates: null,
    },
  };
}

// ── Startup: background monthly refresh for all 28 agencies ──────────────────
// Runs non-blocking on server start. Staggered 2-second intervals to avoid
// hammering agency sites. Only fetches resource pages — USASpending data
// refreshes on-demand when a grant is opened.
export function scheduleMonthlyResourceRefresh(): void {
  let delay = 10000; // start 10 seconds after boot
  for (const profile of AGENCY_PROFILES) {
    setTimeout(async () => {
      try {
        // Check if this agency already has a recent resource-page fetch in the DB
        const [existing] = await db
          .select()
          .from(agencyIntelligence)
          .where(eq(agencyIntelligence.agencyName, profile.name));

        const existingIntel = existing?.intel as AgencyIntel | undefined;
        const lastFetched = existingIntel?.profile?.resourcePageLastFetched;

        if (!isStale(lastFetched, RESOURCE_REFRESH_DAYS)) return; // still fresh

        console.log(`[agency-intel] Monthly refresh: ${profile.agencyId}`);
        const updates = await fetchResourcePageUpdates(profile);

        const baseIntel: Partial<AgencyIntel> = existingIntel ?? {
          agencyName: profile.name,
          cfda: null,
          opportunityNumber: null,
          recentWinners: [],
          whatTheyFund: `${profile.name} funds community and social service programs.`,
          languagePatterns: profile.languageDictionary.slice(0, 8),
          source: "Static agency profile",
          refreshedAt: new Date().toISOString(),
        };

        const profileLayer: AgencyIntel["profile"] = {
          agencyId: profile.agencyId,
          name: profile.name,
          abbreviation: profile.abbreviation,
          resourcesUrl: profile.resourcesUrl,
          performanceSystem: `${profile.performanceSystem.name}: ${profile.performanceSystem.description}`,
          requiredForms: profile.requiredForms,
          languageDictionary: profile.languageDictionary,
          evidenceRequirement: `${profile.evidenceRequirements.tier}: ${profile.evidenceRequirements.description}`,
          budgetRules: [
            `Match: ${profile.budgetRules.matchRequired}`,
            `Indirect: ${profile.budgetRules.indirectCostRule}`,
            profile.budgetRules.notes,
          ].join(" | "),
          evaluationSignals: profile.evaluationSignals,
          programOffices: profile.programOffices,
          resourcePageLastFetched: new Date().toISOString(),
          resourcePageUpdates: updates,
        };

        const intel: AgencyIntel = {
          ...(baseIntel as AgencyIntel),
          profile: profileLayer,
        };

        await db
          .insert(agencyIntelligence)
          .values({ agencyName: profile.name, cfda: null, opportunityNumber: null, intel })
          .onConflictDoUpdate({
            target: [
              agencyIntelligence.agencyName,
              agencyIntelligence.cfda,
              agencyIntelligence.opportunityNumber,
            ],
            set: { intel, refreshedAt: new Date() },
          });
      } catch (err) {
        console.error(`[agency-intel] Startup refresh failed for ${profile.agencyId}:`, err);
      }
    }, delay);
    delay += 2000; // stagger 2s between agencies
  }
}

// Re-export so rfp-rubric.ts / narrative routes can use it without touching
// the profiles import directly.
export { detectProfileFromGrant, getAllRagEntries };
