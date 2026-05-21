// NSF 26-508 Hub Intelligence Service
// Live state-specific research powered by Perplexity sonar-pro via OpenRouter.
// Returns structured findings with citations. Cached 24h per (state, queryType)
// in nationwide_discoveries to bound cost and speed re-renders.

import { db } from "./storage";
import { nationwideDiscoveries } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import OpenAI from "openai";
import { withEthicalPreamble } from "./ai-provider";
import { getJurisdiction } from "@shared/nationwide/jurisdictions";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const DAILY_BUDGET_TOKENS = parseInt(process.env.HUB_INTEL_DAILY_TOKEN_CAP ?? "200000", 10);

export type QueryType =
  | "ai_initiatives"
  | "recent_federal_awards"
  | "workforce_programs"
  | "lead_org_context";

export interface IntelligenceFinding {
  text: string;
  citations: string[];
  retrievedAt: string;
  cached: boolean;
  source: "perplexity-sonar-pro" | "cache" | "unavailable";
}

let dailyTokensUsed = 0;
let dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;

function checkBudget(estimatedTokens: number): boolean {
  if (Date.now() > dailyResetAt) {
    dailyTokensUsed = 0;
    dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
  }
  return dailyTokensUsed + estimatedTokens <= DAILY_BUDGET_TOKENS;
}

function buildPrompt(stateCode: string, qt: QueryType, extra?: Record<string, string>): string {
  const j = getJurisdiction(stateCode);
  const stateName = j?.name ?? stateCode;
  switch (qt) {
    case "ai_initiatives":
      return `What are the most significant current state-level Artificial Intelligence readiness, AI literacy, AI workforce, or AI integration initiatives operating in ${stateName} as of 2026? Include state-government programs, university initiatives, public-private partnerships, and major nonprofit efforts. For each, give a one-sentence description. Focus on concrete, verifiable initiatives. Cite sources.`;
    case "recent_federal_awards":
      return `What recent (2024-2026) NSF, U.S. Department of Labor, USDA-NIFA, or SBA grants and awards related to AI workforce, AI literacy, or AI readiness have been made to institutions, governments, or organizations in ${stateName}? List specific awards with grant numbers when available. Cite sources.`;
    case "workforce_programs":
      return `What are the major workforce-development programs in ${stateName} that are integrating Artificial Intelligence skills training, including state Workforce Boards, American Job Centers, Registered Apprenticeship sponsors, community colleges, and labor-management partnerships? Include current AI-related curricula or partnerships. Cite sources.`;
    case "lead_org_context":
      return `Provide a current public-information overview of the organization "${extra?.orgName}" operating in ${stateName}: mission, scale, current federal funding, leadership, and any recent AI-related activities. Cite sources.`;
  }
}

async function fromCache(stateCode: string, qt: QueryType, queryHash: string): Promise<IntelligenceFinding | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);
  const rows = await db.select().from(nationwideDiscoveries)
    .where(and(
      eq(nationwideDiscoveries.stateCode, stateCode),
      eq(nationwideDiscoveries.queryType, qt),
      eq(nationwideDiscoveries.queryHash, queryHash),
      gte(nationwideDiscoveries.retrievedAt, cutoff),
    ))
    .limit(1);
  if (!rows.length) return null;
  const r = rows[0];
  return {
    text: r.text ?? "",
    citations: (r.citations as string[] | null) ?? [],
    retrievedAt: r.retrievedAt!.toISOString(),
    cached: true,
    source: "cache",
  };
}

async function persistFinding(stateCode: string, qt: QueryType, queryHash: string, text: string, citations: string[]): Promise<void> {
  await db.insert(nationwideDiscoveries).values({
    stateCode,
    queryType: qt,
    queryHash,
    text,
    citations,
    retrievedAt: new Date(),
  });
}

function hashQuery(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

export async function research(stateCode: string, qt: QueryType, extra?: Record<string, string>): Promise<IntelligenceFinding> {
  const code = stateCode.toUpperCase();
  const prompt = buildPrompt(code, qt, extra);
  const queryHash = hashQuery(prompt);

  const cached = await fromCache(code, qt, queryHash);
  if (cached) return cached;

  const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  if (!apiKey || !baseURL) {
    return { text: "", citations: [], retrievedAt: new Date().toISOString(), cached: false, source: "unavailable" };
  }
  if (!checkBudget(2000)) {
    return { text: "Daily research budget reached. Cached results only until reset.", citations: [], retrievedAt: new Date().toISOString(), cached: false, source: "unavailable" };
  }

  const client = new OpenAI({ apiKey, baseURL });
  try {
    const resp = await client.chat.completions.create({
      model: "perplexity/sonar-pro",
      messages: [
        { role: "system", content: withEthicalPreamble("You are a research analyst providing factual, citation-backed answers about U.S. state-level programs. Be specific and verifiable. Never invent grants, programs, or organizations. If unsure, say so.") },
        { role: "user", content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.2,
    });
    const text = resp.choices[0]?.message?.content ?? "";
    const usage = resp.usage?.total_tokens ?? 0;
    dailyTokensUsed += usage;
    // Citations may be returned in three different shapes depending on provider:
    //   1. resp.citations               — direct Perplexity API
    //   2. resp.search_results          — newer Perplexity API
    //   3. choices[0].message.annotations[].url_citation.url — OpenRouter / modelfarm proxy
    const topLevel = (resp as unknown as { citations?: string[]; search_results?: Array<{ url?: string }> });
    const annotations = (resp.choices[0]?.message as unknown as { annotations?: Array<{ type?: string; url_citation?: { url?: string } }> })?.annotations ?? [];
    const fromAnnotations = annotations
      .filter(a => a?.type === "url_citation" && a.url_citation?.url)
      .map(a => a.url_citation!.url!);
    const citations: string[] = topLevel.citations
      ?? topLevel.search_results?.map(s => s.url).filter((u): u is string => !!u)
      ?? fromAnnotations;
    await persistFinding(code, qt, queryHash, text, citations);
    return { text, citations, retrievedAt: new Date().toISOString(), cached: false, source: "perplexity-sonar-pro" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: `Research unavailable (${msg}).`, citations: [], retrievedAt: new Date().toISOString(), cached: false, source: "unavailable" };
  }
}

export async function intelligenceBundle(stateCode: string): Promise<{
  aiInitiatives: IntelligenceFinding;
  recentFederalAwards: IntelligenceFinding;
  workforcePrograms: IntelligenceFinding;
}> {
  const [ai, awards, wf] = await Promise.all([
    research(stateCode, "ai_initiatives"),
    research(stateCode, "recent_federal_awards"),
    research(stateCode, "workforce_programs"),
  ]);
  return { aiInitiatives: ai, recentFederalAwards: awards, workforcePrograms: wf };
}

export function budgetStatus(): { used: number; cap: number; resetsAt: string } {
  return { used: dailyTokensUsed, cap: DAILY_BUDGET_TOKENS, resetsAt: new Date(dailyResetAt).toISOString() };
}
