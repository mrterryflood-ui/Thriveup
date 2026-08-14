/**
 * AI Claim Chain
 * ----------------------------------------------------------------------------
 * A tamper-evident, append-only SHA-256 hash chain of every AI numeric-claim
 * grounding decision made by `ai-claim-grounding.ts`. Same design as the
 * existing donor-outcome-receipt chain (`donor-receipts.ts`), generalized to
 * claims instead of resident journey events:
 *
 *   h_n = sha256( h_{n-1} + surface + subject + ruleId + verdict + claimText + extractedValuesJson )
 *
 * Every grounding decision — kept AND stripped — is recorded, not just the
 * failures, so the chain is a complete, independently re-derivable audit
 * trail of "what did the AI claim, what did we check it against, and what
 * did we do about it." A DB operator who edits a row breaks every
 * downstream hash from that point forward; `verifyChainIntegrity` detects
 * exactly that.
 */
import { db } from "./storage";
import { aiClaimChain, type InsertAiClaimChain } from "@shared/schema";
import { asc, desc } from "drizzle-orm";
import crypto from "crypto";
import type { GroundingDecision } from "./ai-claim-grounding";

const GENESIS = crypto.createHash("sha256").update("tcaf:ai-claim-chain:v1:genesis").digest("hex");

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// `extractedValuesJson` must already be the exact JSON string that was (or
// will be) persisted — never re-stringify a value read back from the DB, and
// never pass a live object here; see the schema comment on
// `aiClaimChain.extractedValuesJson` for why.
function linkHash(prevHash: string, row: { surface: string; subject: string; ruleId: string; verdict: string; claimText: string; extractedValuesJson: string }): string {
  return sha256(`${prevHash}|${row.surface}|${row.subject}|${row.ruleId}|${row.verdict}|${row.claimText}|${row.extractedValuesJson}`);
}

/**
 * Appends every grounding decision from one AI-generation call to the chain,
 * in order, each linked to the current chain head. Never throws into the
 * caller's request path — a claim-chain write failure must not block the
 * (already-grounded) response from reaching the user; it is logged instead
 * so an operator can investigate why the audit trail has a gap.
 */
export async function recordClaimDecisions(surface: string, subject: string, decisions: GroundingDecision[]): Promise<void> {
  if (decisions.length === 0) return;
  try {
    const [latest] = await db.select({ hash: aiClaimChain.hash }).from(aiClaimChain).orderBy(desc(aiClaimChain.id)).limit(1);
    let prevHash = latest ? latest.hash : GENESIS;

    const rows: InsertAiClaimChain[] = [];
    for (const d of decisions) {
      const claimText = d.sentence.slice(0, 2000);
      const extractedValuesJson = JSON.stringify(d.extractedValues);
      const hash = linkHash(prevHash, { surface, subject, ruleId: d.ruleId, verdict: d.verdict, claimText, extractedValuesJson });
      rows.push({
        surface,
        subject: subject.slice(0, 500),
        ruleId: d.ruleId,
        verdict: d.verdict,
        claimText,
        extractedValuesJson,
        expectedDescription: d.expectedDescription.slice(0, 500),
        prevHash,
        hash,
      });
      prevHash = hash;
    }
    await db.insert(aiClaimChain).values(rows);
  } catch (err) {
    console.error(`[ClaimChain] failed to record ${decisions.length} decision(s) for ${surface}/${subject} (non-fatal):`, err);
  }
}

/**
 * Re-derives the entire chain from the current DB rows in insertion order
 * and confirms every stored hash matches what recomputing it from that
 * row's own fields + the previous row's hash produces. Returns the first
 * break found, if any — a break means either a row was edited/deleted after
 * the fact, or rows were reordered.
 */
export async function verifyChainIntegrity(): Promise<{ ok: boolean; totalRows: number; brokenAtId: number | null; reason: string | null }> {
  const rows = await db.select().from(aiClaimChain).orderBy(asc(aiClaimChain.id));
  let prevHash = GENESIS;
  for (const row of rows) {
    if (row.prevHash !== prevHash) {
      return { ok: false, totalRows: rows.length, brokenAtId: row.id, reason: `stored prevHash does not match the actual preceding chain head (row reordered or a prior row was deleted)` };
    }
    const recomputed = linkHash(prevHash, { surface: row.surface, subject: row.subject, ruleId: row.ruleId, verdict: row.verdict, claimText: row.claimText, extractedValuesJson: row.extractedValuesJson });
    if (recomputed !== row.hash) {
      return { ok: false, totalRows: rows.length, brokenAtId: row.id, reason: `stored hash does not match recomputed hash (row content was edited after being chained)` };
    }
    prevHash = row.hash;
  }
  return { ok: true, totalRows: rows.length, brokenAtId: null, reason: null };
}

export async function getChainHead(): Promise<string> {
  const rows = await db.select({ hash: aiClaimChain.hash }).from(aiClaimChain).orderBy(asc(aiClaimChain.id));
  return rows.length > 0 ? rows[rows.length - 1].hash : GENESIS;
}
