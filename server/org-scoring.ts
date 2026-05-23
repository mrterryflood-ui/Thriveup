import { db } from "./storage";
import { grantOpportunities, organizations, grantOrgScores, type Organization, type GrantOpportunity } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

type ScoreResult = { fitScore: number; reasoning: string };

const SCORE_SYS = `You score grant-applicant fit on a 0-100 scale for a specific nonprofit. Return JSON: {"fitScore": <0-100>, "reasoning": "<one sentence, plain language, why this score>"}. Score based on overlap between the grant's purpose/eligibility and the org's mission, focus areas, populations, geography. Be honest: most grants are 30-60. Only score 80+ when the alignment is strong and the org clearly qualifies. Never invent capabilities the org doesn't claim.`;

function buildScoreQuery(grant: GrantOpportunity, org: Organization): string {
  const focus = (org.focusAreas ?? []).join(", ") || "(none specified)";
  const pops = (org.populationsServed ?? []).join(", ") || "(none specified)";
  const geo = org.state ? `${org.state}${org.counties?.length ? ` (counties: ${org.counties.join(", ")})` : ""}` : "(not specified)";
  return [
    `ORGANIZATION:`,
    `Name: ${org.name}`,
    `Mission: ${org.missionText || "(not provided)"}`,
    `Capability statement: ${org.capabilityStatementText || "(not provided)"}`,
    `Focus areas: ${focus}`,
    `Populations served: ${pops}`,
    `Geography served: ${geo}`,
    `501(c)(3) status: ${org.is501c3 ? "yes" : "no/unknown"}`,
    `Budget range: ${org.budgetRange || "(not specified)"}`,
    ``,
    `GRANT:`,
    `Title: ${grant.title}`,
    `Agency: ${grant.agency || "(unknown)"}`,
    `Description: ${grant.description || "(none)"}`,
    `Eligibility: ${grant.eligibilityCriteria || "(none stated)"}`,
    `Focus areas: ${(grant.focusAreas ?? []).join(", ") || "(none)"}`,
    `Amount: ${grant.fundingAmount || "(unspecified)"}`,
  ].join("\n");
}

export async function scoreGrantForOrg(grantId: string, orgId: string): Promise<ScoreResult | null> {
  // Cache hit?
  const [cached] = await db.select().from(grantOrgScores)
    .where(and(eq(grantOrgScores.grantId, grantId), eq(grantOrgScores.orgId, orgId)));
  if (cached) return { fitScore: cached.fitScore, reasoning: cached.reasoning || "" };

  const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, grantId));
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  if (!grant || !org) return null;

  let result: ScoreResult;
  try {
    const ai = await generateAIJSON<Record<string, unknown>>(buildScoreQuery(grant, org), SCORE_SYS);
    const parsed = (ai && typeof ai === "object") ? ai : {};
    const score = Math.max(0, Math.min(100, Number(parsed.fitScore ?? 0)));
    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 500) : "";
    result = { fitScore: Math.round(score), reasoning };
  } catch (err) {
    console.error("[org-scoring] AI scoring failed; falling back to keyword overlap", err);
    result = keywordFallbackScore(grant, org);
  }

  await db.insert(grantOrgScores).values({
    grantId, orgId, fitScore: result.fitScore, reasoning: result.reasoning,
  }).onConflictDoUpdate({
    target: [grantOrgScores.grantId, grantOrgScores.orgId],
    set: { fitScore: result.fitScore, reasoning: result.reasoning, scoredAt: new Date() },
  });

  return result;
}

function keywordFallbackScore(grant: GrantOpportunity, org: Organization): ScoreResult {
  const hay = `${grant.title} ${grant.description ?? ""} ${(grant.focusAreas ?? []).join(" ")} ${grant.eligibilityCriteria ?? ""}`.toLowerCase();
  const orgTerms = [
    ...(org.focusAreas ?? []),
    ...(org.populationsServed ?? []),
    ...(org.missionText ?? "").split(/\s+/).filter(w => w.length > 4),
  ].map(t => t.toLowerCase());
  const hits = orgTerms.filter(t => hay.includes(t)).length;
  const score = Math.min(85, 30 + hits * 5);
  return { fitScore: score, reasoning: `Keyword-overlap fallback: ${hits} term matches between grant and org profile.` };
}

export async function scoreGrantsForOrgBatch(grantIds: string[], orgId: string): Promise<Map<string, ScoreResult>> {
  const result = new Map<string, ScoreResult>();
  if (grantIds.length === 0) return result;
  const cached = await db.select().from(grantOrgScores)
    .where(and(eq(grantOrgScores.orgId, orgId), inArray(grantOrgScores.grantId, grantIds)));
  const cachedSet = new Set<string>();
  for (const c of cached) {
    result.set(c.grantId, { fitScore: c.fitScore, reasoning: c.reasoning || "" });
    cachedSet.add(c.grantId);
  }
  // Lazy-score uncached in background (don't block response).
  const uncached = grantIds.filter(id => !cachedSet.has(id));
  if (uncached.length > 0) {
    // Fire-and-forget; first 20 only to avoid runaway cost.
    const slice = uncached.slice(0, 20);
    Promise.all(slice.map(id => scoreGrantForOrg(id, orgId).catch(e => {
      console.error(`[org-scoring] background score failed for ${id}:`, e);
      return null;
    }))).catch(() => {});
  }
  return result;
}

export async function invalidateOrgScores(orgId: string): Promise<void> {
  await db.delete(grantOrgScores).where(eq(grantOrgScores.orgId, orgId));
}
