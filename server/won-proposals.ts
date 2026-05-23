// Self-learning loop: retrieve an org's own won proposals to inject into
// future drafts as "this is how we win." Ranking is simple, deterministic,
// and fast (no embeddings): exact funder match > same funder type and
// similar dollar tier > most recent. Cap at 3 examples to keep prompts lean.

import { db } from "./storage";
import { wonProposals, type WonProposal } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";

export async function loadRelevantWonProposals(params: {
  orgId: string;
  funderName?: string | null;
  funderType?: "government" | "foundation" | "corporate" | "state" | "local";
  targetAmount?: number | null;
  limit?: number;
}): Promise<WonProposal[]> {
  const { orgId, funderName, funderType, targetAmount } = params;
  const limit = params.limit ?? 3;

  // 1. Exact funder-name match (case-insensitive). Stubs (auto-created on
  // status→awarded with placeholder text) are excluded so the AI never sees
  // the "[Paste your winning...]" prompt as if it were a real win.
  const rows = await db.select().from(wonProposals)
    .where(eq(wonProposals.orgId, orgId))
    .orderBy(desc(wonProposals.awardedAt), desc(wonProposals.createdAt));
  const all = rows.filter(r => !r.draftText.trimStart().startsWith("[Paste your winning"));
  if (all.length === 0) return [];

  const targetFunder = (funderName ?? "").trim().toLowerCase();
  const exact = targetFunder
    ? all.filter(w => w.funderName.trim().toLowerCase() === targetFunder)
    : [];
  if (exact.length >= limit) return exact.slice(0, limit);

  // 2. Same funder type, similar dollar tier (within 3× range).
  const typeBucket = (funderType ?? "government").toLowerCase();
  const tierMatches = all.filter(w => {
    if (exact.some(e => e.id === w.id)) return false;
    if (w.funderType.toLowerCase() !== typeBucket) return false;
    if (targetAmount && w.dollarAmount) {
      const ratio = w.dollarAmount / targetAmount;
      if (ratio < 0.33 || ratio > 3) return false;
    }
    return true;
  });

  const combined = [...exact, ...tierMatches];
  if (combined.length >= limit) return combined.slice(0, limit);

  // 3. Fallback: most recent across all funders, dedup.
  const rest = all.filter(w => !combined.some(c => c.id === w.id));
  return [...combined, ...rest].slice(0, limit);
}

export function buildWonProposalsBlock(wins: WonProposal[]): string {
  if (wins.length === 0) {
    return "(No prior winning proposals on file for this organization. Draft from first principles — the rubric and RFP are the source of truth.)";
  }
  return wins.map((w, i) => {
    const header = `--- WIN #${i + 1}: ${w.projectTitle ?? "Untitled project"} ---\nFunder: ${w.funderName} (${w.funderType})${w.dollarAmount ? ` · Awarded $${w.dollarAmount.toLocaleString()}` : ""}${w.awardedAt ? ` · ${new Date(w.awardedAt).toISOString().slice(0, 7)}` : ""}`;
    // Trim each prior win to ~2500 chars so 3 wins don't blow the prompt budget.
    const body = w.draftText.length > 2500 ? `${w.draftText.slice(0, 2500)}\n[…trimmed for context budget]` : w.draftText;
    return `${header}\n${body}`;
  }).join("\n\n");
}
