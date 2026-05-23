// Foundation 990-PF mining via ProPublica Nonprofit Explorer (free, no key).
// USASpending only covers federal grants — for private foundations we lean on
// IRS 990-PF filings exposed through ProPublica's public API.
// Honest disclosure: ProPublica gives us org metadata + recent filing totals.
// Grant-by-grant detail (Schedule I / Part XV) lives in the raw 990-PF XML.
// We extract what's available, then AI-summarize giving patterns from the
// recent-filings totals + AI's general knowledge of the funder. The result is
// clearly labeled as "foundation intel (990-PF derived)" so the user knows
// the provenance.

import { db } from "./storage";
import { foundationIntelligence } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

const REFRESH_DAYS = 30;

export type FoundationIntel = {
  funderName: string;
  ein?: string | null;
  classification?: string;
  state?: string;
  totalAssets?: number;
  totalGrantsPaid?: number;
  recentFiscalYear?: number;
  taxFormUrls: string[]; // links to recent 990-PF filings (PDF)
  typicalGrantSize?: string;
  whatTheyFund: string;
  fundingPriorities: string[]; // 4-7 short phrases
  languagePatterns: string[]; // 4-7 short phrases winners tend to use
  geographicFocus?: string;
  source: string;
  refreshedAt: string;
};

function isStale(d: Date | string | null | undefined): boolean {
  if (!d) return true;
  const ts = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  return Date.now() - ts > REFRESH_DAYS * 86400 * 1000;
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function searchProPublica(funderName: string): Promise<{ ein: string; name: string; state?: string; classification?: string } | null> {
  try {
    const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(funderName)}&c_code%5Bid%5D=3`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return null;
    const data = await res.json() as { organizations?: Array<Record<string, unknown>> };
    const orgs = data.organizations ?? [];
    if (orgs.length === 0) return null;
    const target = normalize(funderName);
    const exact = orgs.find(o => normalize(String(o.name ?? "")) === target);
    const pick = exact ?? orgs[0];
    return {
      ein: String(pick.ein ?? ""),
      name: String(pick.name ?? funderName),
      state: pick.state ? String(pick.state) : undefined,
      classification: pick.subseccd ? String(pick.subseccd) : undefined,
    };
  } catch (err) {
    console.error("[foundation-intel] propublica search failed:", err);
    return null;
  }
}

async function fetchProPublicaOrg(ein: string): Promise<{
  totalAssets?: number;
  totalGrantsPaid?: number;
  fiscalYear?: number;
  taxFormUrls: string[];
} | null> {
  try {
    const cleanEin = ein.replace(/[^0-9]/g, "");
    if (!cleanEin) return null;
    const url = `https://projects.propublica.org/nonprofits/api/v2/organizations/${cleanEin}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as {
      filings_with_data?: Array<Record<string, unknown>>;
      filings_without_data?: Array<Record<string, unknown>>;
    };
    const filings = (data.filings_with_data ?? []).slice(0, 3);
    if (filings.length === 0) return null;
    const latest = filings[0];
    const pdfs = [...filings, ...(data.filings_without_data ?? []).slice(0, 2)]
      .map(f => f.pdf_url ? String(f.pdf_url) : "")
      .filter(Boolean)
      .slice(0, 5);
    return {
      totalAssets: numOrUndef(latest.totassetsend),
      totalGrantsPaid: numOrUndef(latest.totcntrbgftgrntpaid) ?? numOrUndef(latest.totprgmrevnue) ?? numOrUndef(latest.totfuncexpns),
      fiscalYear: numOrUndef(latest.tax_prd_yr),
      taxFormUrls: pdfs,
    };
  } catch (err) {
    console.error("[foundation-intel] propublica org fetch failed:", err);
    return null;
  }
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

async function aiSynthesize(funderName: string, ein: string | null, totals: {
  totalAssets?: number; totalGrantsPaid?: number; fiscalYear?: number;
}): Promise<Pick<FoundationIntel, "whatTheyFund" | "fundingPriorities" | "languagePatterns" | "typicalGrantSize" | "geographicFocus">> {
  const assets = totals.totalAssets ? `$${(totals.totalAssets / 1_000_000).toFixed(1)}M` : "unknown";
  const grants = totals.totalGrantsPaid ? `$${(totals.totalGrantsPaid / 1_000_000).toFixed(2)}M` : "unknown";
  const fy = totals.fiscalYear ? String(totals.fiscalYear) : "unknown";
  const prompt = `Funder: ${funderName}\nEIN: ${ein ?? "unknown"}\nMost recent 990-PF (or 990) on file: FY ${fy}\nTotal assets: ${assets}\nTotal grants paid that year: ${grants}\n\nUsing only what is verifiably documented about this funder (their public website, 990 filings, well-known grantee lists, published priorities), describe their giving pattern. If you don't have reliable information, say so plainly — DO NOT invent priorities or grantees.`;
  const system = "You are a foundation-research analyst writing for a nonprofit grant writer. Be conservative — only state what is documented. Return strict JSON: {\"whatTheyFund\": \"2-3 sentences naming the project types and populations this foundation actually funds. If unknown say 'Insufficient public information; review the 990-PF Schedule I directly.'\", \"fundingPriorities\": [\"4-7 short phrases (3-7 words each) naming verified priority areas\"], \"languagePatterns\": [\"4-7 short phrases that winning proposals to this funder commonly use — verbs, frames, populations\"], \"typicalGrantSize\": \"e.g. '$25K-$100K' if known, else 'Unknown — see 990-PF'\", \"geographicFocus\": \"e.g. 'Central Texas' or 'National' or 'Unknown'\"}.";
  try {
    const ai = await generateAIJSON<Record<string, unknown>>(prompt, system);
    const o = (ai && typeof ai === "object") ? ai : {};
    return {
      whatTheyFund: typeof o.whatTheyFund === "string" ? o.whatTheyFund : "Insufficient public information; review the 990-PF Schedule I directly.",
      fundingPriorities: Array.isArray(o.fundingPriorities) ? (o.fundingPriorities as unknown[]).map(String).slice(0, 10) : [],
      languagePatterns: Array.isArray(o.languagePatterns) ? (o.languagePatterns as unknown[]).map(String).slice(0, 10) : [],
      typicalGrantSize: typeof o.typicalGrantSize === "string" ? o.typicalGrantSize : "Unknown",
      geographicFocus: typeof o.geographicFocus === "string" ? o.geographicFocus : undefined,
    };
  } catch (err) {
    console.error("[foundation-intel] AI synthesis failed:", err);
    return {
      whatTheyFund: "AI synthesis unavailable; consult 990-PF directly.",
      fundingPriorities: [],
      languagePatterns: [],
      typicalGrantSize: "Unknown",
    };
  }
}

export async function getFoundationIntel(funderName: string, einHint?: string | null): Promise<FoundationIntel> {
  const name = funderName.trim();
  const [cached] = await db.select().from(foundationIntelligence).where(eq(foundationIntelligence.funderName, name));
  if (cached && !isStale(cached.refreshedAt)) {
    return cached.intel as FoundationIntel;
  }

  let ein: string | null = einHint?.replace(/[^0-9]/g, "") || null;
  let classification: string | undefined;
  let state: string | undefined;

  if (!ein) {
    const found = await searchProPublica(name);
    if (found) {
      ein = found.ein;
      classification = found.classification;
      state = found.state;
    }
  }

  let totals: { totalAssets?: number; totalGrantsPaid?: number; fiscalYear?: number; taxFormUrls: string[] } = { taxFormUrls: [] };
  if (ein) {
    const fetched = await fetchProPublicaOrg(ein);
    if (fetched) totals = fetched;
  }

  const summary = await aiSynthesize(name, ein, totals);

  const intel: FoundationIntel = {
    funderName: name,
    ein,
    classification,
    state,
    totalAssets: totals.totalAssets,
    totalGrantsPaid: totals.totalGrantsPaid,
    recentFiscalYear: totals.fiscalYear,
    taxFormUrls: totals.taxFormUrls,
    typicalGrantSize: summary.typicalGrantSize,
    whatTheyFund: summary.whatTheyFund,
    fundingPriorities: summary.fundingPriorities,
    languagePatterns: summary.languagePatterns,
    geographicFocus: summary.geographicFocus,
    source: ein ? "ProPublica 990-PF + AI synthesis" : "AI synthesis (no 990 located)",
    refreshedAt: new Date().toISOString(),
  };

  try {
    await db.insert(foundationIntelligence).values({
      funderName: name, ein, intel,
    }).onConflictDoUpdate({
      target: foundationIntelligence.funderName,
      set: { intel, ein, refreshedAt: new Date() },
    });
  } catch (err) {
    console.error("[foundation-intel] cache write failed:", err);
  }
  return intel;
}

// Heuristic — decides whether to use government (USASpending) or foundation (990-PF) intel.
export function classifyFunder(grant: { source?: string | null; agency?: string | null; grantType?: string | null } | null): "government" | "foundation" {
  if (!grant) return "government";
  const src = (grant.source ?? "").toLowerCase();
  if (src.includes("foundation") || src.includes("corp")) return "foundation";
  const agency = (grant.agency ?? "").toLowerCase();
  if (/(foundation|trust|fund\b|endowment|philanthrop)/.test(agency)) return "foundation";
  const gt = (grant.grantType ?? "").toLowerCase();
  if (gt.includes("foundation") || gt.includes("private")) return "foundation";
  return "government";
}
