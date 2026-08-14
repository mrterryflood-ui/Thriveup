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
import type { Express, Request, Response, NextFunction } from "express";
import { db, storage } from "./storage";
import { aiClaimChain, type InsertAiClaimChain } from "@shared/schema";
import { asc, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import type { GroundingDecision } from "./ai-claim-grounding";

// Stable advisory-lock key used to serialize chain appends across concurrent
// requests. pg_advisory_xact_lock() holds until the surrounding transaction
// commits or rolls back, so two concurrent recordClaimDecisions calls are
// guaranteed to see each other's rows before building the next prevHash.
// The key is arbitrary; it must not collide with other pg_advisory_lock uses
// in this codebase (none currently exist).
const CHAIN_LOCK_KEY = 0x7463_6166n; // "tcaf" in hex, as bigint

const GENESIS = crypto.createHash("sha256").update("tcaf:ai-claim-chain:v1:genesis").digest("hex");

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

type LinkableRow = { surface: string; subject: string; ruleId: string; verdict: string; claimText: string; extractedValuesJson: string; expectedDescription: string };

// `extractedValuesJson` must already be the exact JSON string that was (or
// will be) persisted — never re-stringify a value read back from the DB, and
// never pass a live object here; see the schema comment on
// `aiClaimChain.extractedValuesJson` for why.
// IMPORTANT: this must hash exactly the values that end up persisted in the
// row — including `expectedDescription` (what we expected the claim to say,
// i.e. the "why" of the decision) — or that field could be edited later
// without detection. Callers MUST pass fields already normalized/truncated
// to their column limits (see recordClaimDecisions), never the raw
// pre-truncation value, or a valid input longer than the column limit
// hashes one string but stores another, permanently breaking that row's own
// re-derivation.
function linkHash(prevHash: string, row: LinkableRow): string {
  return sha256(`${prevHash}|${row.surface}|${row.subject}|${row.ruleId}|${row.verdict}|${row.claimText}|${row.extractedValuesJson}|${row.expectedDescription}`);
}

// v1 formula, kept ONLY so rows written before expectedDescription joined
// the hash input still verify instead of every one of them being reported
// as a false-positive break the moment this file changes. New rows are
// always written and verified with the current (v2) formula first; v1 is a
// read-compatibility fallback for chain history that already exists,
// exactly the kind of schema-evolution problem an append-only chain must
// survive without invalidating everything written before the change.
function linkHashV1(prevHash: string, row: LinkableRow): string {
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
    await db.transaction(async (tx) => {
      // Acquire an exclusive session-level advisory lock for the duration of
      // this transaction. Any concurrent recordClaimDecisions call will block
      // here until the current transaction commits, guaranteeing that the
      // prevHash read and the subsequent insert are atomic with respect to
      // other appenders — so verifyChainIntegrity can never see a gap or
      // a reused prevHash caused by two callers racing on the same chain head.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(CHAIN_LOCK_KEY))})`);

      const [latest] = await tx.select({ hash: aiClaimChain.hash }).from(aiClaimChain).orderBy(desc(aiClaimChain.id)).limit(1);
      let prevHash = latest ? latest.hash : GENESIS;

      // Truncate to column limits BEFORE hashing, not after, so the hashed
      // string and the persisted string are byte-for-byte identical — a
      // caller-supplied subject/description longer than the column limit
      // must never hash the untruncated value and then store the truncated
      // one, or that row can never re-derive.
      const truncSubject = subject.slice(0, 500);
      const rows: InsertAiClaimChain[] = [];
      for (const d of decisions) {
        const claimText = d.sentence.slice(0, 2000);
        const extractedValuesJson = JSON.stringify(d.extractedValues);
        const expectedDescription = d.expectedDescription.slice(0, 500);
        const hash = linkHash(prevHash, { surface, subject: truncSubject, ruleId: d.ruleId, verdict: d.verdict, claimText, extractedValuesJson, expectedDescription });
        rows.push({
          surface,
          subject: truncSubject,
          ruleId: d.ruleId,
          verdict: d.verdict,
          claimText,
          extractedValuesJson,
          expectedDescription,
          prevHash,
          hash,
        });
        prevHash = hash;
      }
      await tx.insert(aiClaimChain).values(rows);
    });
  } catch (err) {
    console.error(`[ClaimChain] failed to record ${decisions.length} decision(s) for ${surface}/${subject} (non-fatal):`, err);
  }
}

export interface ChainVerifyRow extends LinkableRow {
  id: number;
  prevHash: string;
  hash: string;
}

export interface ChainVerifyResult {
  ok: boolean;
  totalRows: number;
  brokenAtId: number | null;
  reason: string | null;
}

/**
 * Pure, DB-free re-derivation of a chain given as an in-memory array of rows
 * (already in insertion order) plus the genesis hash to start from. Kept
 * separate from `verifyChainIntegrity` so tamper-detection can be exercised
 * with synthetic in-memory rows — never against the live chain — and so the
 * logic itself has no side effects to reason about.
 */
export function verifyChainRows(rows: ChainVerifyRow[], genesis: string = GENESIS): ChainVerifyResult {
  let prevHash = genesis;
  for (const row of rows) {
    if (row.prevHash !== prevHash) {
      return { ok: false, totalRows: rows.length, brokenAtId: row.id, reason: `stored prevHash does not match the actual preceding chain head (row reordered or a prior row was deleted)` };
    }
    // Try the current hash formula first; fall back to the v1 formula (which
    // predates expectedDescription joining the hash input) so chain history
    // written before that change keeps verifying instead of every pre-change
    // row being reported as a false-positive tamper the moment this file
    // changes. A row only needs to match ONE formula to be considered intact.
    const recomputed = linkHash(prevHash, row);
    const recomputedV1 = recomputed !== row.hash ? linkHashV1(prevHash, row) : null;
    if (recomputed !== row.hash && recomputedV1 !== row.hash) {
      return { ok: false, totalRows: rows.length, brokenAtId: row.id, reason: `stored hash does not match recomputed hash under the current or legacy formula (row content was edited after being chained)` };
    }
    prevHash = row.hash;
  }
  return { ok: true, totalRows: rows.length, brokenAtId: null, reason: null };
}

/**
 * Re-derives the entire chain from the current DB rows in insertion order.
 * Read-only — never mutates the live chain. See `verifyChainRows` for the
 * underlying pure logic (used directly by tests against synthetic data).
 */
export async function verifyChainIntegrity(): Promise<ChainVerifyResult> {
  const rows = await db.select().from(aiClaimChain).orderBy(asc(aiClaimChain.id));
  return verifyChainRows(rows);
}

export async function getChainHead(): Promise<string> {
  const rows = await db.select({ hash: aiClaimChain.hash }).from(aiClaimChain).orderBy(asc(aiClaimChain.id));
  return rows.length > 0 ? rows[rows.length - 1].hash : GENESIS;
}

export { GENESIS as CHAIN_GENESIS };

// Same shape/role gate as the `requireAdmin` middleware in server/routes.ts
// (kept local rather than imported so this module has no dependency on
// routes.ts). `subject`/`claimText` on chain rows can echo back
// request-controlled text (an org name typed into Grant Hunt, a
// user-composed RPLICE question, a free-typed geography) — that is
// internal-audit content, not something anonymous or non-staff callers
// should be able to page through.
async function requireStaffAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const userId = (req as any).user?.claims?.sub;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher") return next();
  } catch (e) {
    console.error("[ClaimChain] staff auth check error:", e);
  }
  return res.status(403).json({ error: "Staff access required" });
}

/**
 * GET  /api/claim-chain/verify   — public, read-only re-derivation of the
 *   entire AI-claim chain, run server-side against the live DB. This proves
 *   the stored chain is currently self-consistent (every hash still matches
 *   its own row content + the prior row's hash); it does NOT let a caller
 *   with no DB access recompute hashes themselves, since doing so would
 *   require exposing every row's raw claimText/subject/extractedValuesJson
 *   publicly — the same fields that make the raw chain internal-audit
 *   content (see requireStaffAuth above). Returns aggregate counts only.
 * GET  /api/claim-chain/recent   — staff/admin-only. Last 100 decisions
 *   (raw claim text, subject, verdict) for an internal auditor to spot-check
 *   what got stripped vs kept and why, alongside the chain hashes needed to
 *   independently recompute linkage by hand.
 */
export function registerClaimChainRoutes(app: Express) {
  app.get("/api/claim-chain/verify", async (_req: Request, res: Response) => {
    try {
      const result = await verifyChainIntegrity();
      const head = await getChainHead();
      res.json({
        ok: result.ok,
        chainHead: head,
        totalDecisions: result.totalRows,
        brokenAtId: result.brokenAtId,
        reason: result.reason,
        verifiedAt: new Date().toISOString(),
        message: result.ok
          ? "The stored AI numeric-claim grounding chain is currently self-consistent: every hash re-derives correctly from its own row content and the prior chain hash, so no row has been altered since it was appended. This is a server-side re-derivation against the live database (not a third-party recomputation from published raw data — the underlying claim text/subject are internal audit content, see /api/claim-chain/recent, staff-only) and it detects tampering rather than cryptographically preventing it; there is no external anchor."
          : `Tamper detected at chain position id=${result.brokenAtId}: ${result.reason}`,
      });
    } catch (error: any) {
      console.error("[ClaimChain] verify endpoint error:", error);
      res.status(500).json({ ok: false, error: "Verification failed", detail: String(error?.message || error) });
    }
  });

  app.get("/api/claim-chain/recent", requireStaffAuth, async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(aiClaimChain)
        .orderBy(desc(aiClaimChain.id))
        .limit(100);
      res.json({
        decisions: rows.map((r) => ({
          id: r.id,
          surface: r.surface,
          subject: r.subject,
          ruleId: r.ruleId,
          verdict: r.verdict,
          claimText: r.claimText,
          extractedValuesJson: r.extractedValuesJson,
          expectedDescription: r.expectedDescription,
          prevHash: r.prevHash,
          hash: r.hash,
          createdAt: r.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("[ClaimChain] recent endpoint error:", error);
      res.status(500).json({ error: "Failed to load recent claim decisions", detail: String(error?.message || error) });
    }
  });
}
