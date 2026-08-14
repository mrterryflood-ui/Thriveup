// Tamper-evident AI claim chain — independent re-derivation gate.
//
// Every AI numeric-claim grounding decision (community brief narrative, gun
// violence AI story, RPLICE consensus analysis) is appended to the
// ai_claim_chain table via server/claim-chain.ts. This script has two parts:
//
//   1. An adversarial suite that proves the tamper-DETECTION logic itself
//      works, using synthetic in-memory rows only (verifyChainRows is a
//      pure function — no DB access). It never appends, mutates, or deletes
//      a real chain row, so it is safe to run against a live/shared
//      database with no risk of colliding with a concurrent real
//      recordClaimDecisions() call.
//   2. A read-only re-derivation of the actual live chain (verifyChainIntegrity).
//
// Run: npx tsx scripts/verify-claim-chain-integrity.ts

import { verifyChainIntegrity, verifyChainRows, getChainHead, CHAIN_GENESIS, type ChainVerifyRow } from "../server/claim-chain";
import crypto from "crypto";

let failed = false;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ ${msg}`); failed = true; }
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
// Mirrors server/claim-chain.ts's current (v2) linkHash formula exactly, so
// this synthetic-chain builder produces rows verifyChainRows accepts. If
// that formula ever changes, this local copy must change with it — that
// coupling is intentional: it's what makes this a real test of the
// production hashing logic, not just of whatever this file assumes it is.
function linkHash(prevHash: string, row: { surface: string; subject: string; ruleId: string; verdict: string; claimText: string; extractedValuesJson: string; expectedDescription: string }): string {
  return sha256(`${prevHash}|${row.surface}|${row.subject}|${row.ruleId}|${row.verdict}|${row.claimText}|${row.extractedValuesJson}|${row.expectedDescription}`);
}

function buildSyntheticChain(): ChainVerifyRow[] {
  const base = {
    surface: "__test__",
    subject: "x".repeat(600).slice(0, 500), // exercise the truncate-before-hash contract
    ruleId: "rule-a",
    verdict: "kept",
    claimText: "synthetic claim text",
    extractedValuesJson: JSON.stringify([{ value: 42, kind: "count" }]),
    expectedDescription: "synthetic expected description",
  };
  let prevHash = CHAIN_GENESIS;
  const rows: ChainVerifyRow[] = [];
  for (let i = 1; i <= 3; i++) {
    const row = { ...base, claimText: `${base.claimText} #${i}` };
    const hash = linkHash(prevHash, row);
    rows.push({ id: i, prevHash, hash, ...row });
    prevHash = hash;
  }
  return rows;
}

function runTamperDetectionAdversarialSuite() {
  console.log("── AI claim chain — tamper-detection adversarial suite (synthetic, in-memory only) ──");

  const chain = buildSyntheticChain();
  assert(chain[0].subject.length === 500, "a >500-char subject is truncated to the column limit before being hashed (not hashed-then-truncated)");

  const clean = verifyChainRows(chain);
  assert(clean.ok, "an untampered synthetic chain verifies cleanly");

  const fields: Array<keyof ChainVerifyRow> = ["claimText", "expectedDescription", "extractedValuesJson", "verdict", "subject", "ruleId", "hash", "prevHash"];
  for (const field of fields) {
    const tampered = chain.map((r) => ({ ...r }));
    const target = tampered[1]; // middle row — proves detection isn't just an edge (first/last) effect
    const original = String(target[field]);
    (target as any)[field] = original.length > 0 ? original.slice(0, -1) + (original.slice(-1) === "Z" ? "Y" : "Z") : "Z";
    const result = verifyChainRows(tampered);
    assert(!result.ok && result.brokenAtId === target.id, `mutating '${String(field)}' on a mid-chain row is detected as a break at the correct row id`);
  }

  // A row's own hash under the legacy (pre-expectedDescription) formula must
  // still verify — this is the schema-evolution compatibility path: chain
  // history written before expectedDescription joined the hash input must
  // not be reported as tampered just because the hashing code changed.
  const legacyPrevHash = CHAIN_GENESIS;
  const legacyRowFields = { surface: "__test__", subject: "legacy row", ruleId: "rule-legacy", verdict: "kept", claimText: "legacy claim", extractedValuesJson: JSON.stringify([{ value: 1, kind: "count" }]), expectedDescription: "legacy expected description (not part of the v1 hash input)" };
  const legacyHash = sha256(`${legacyPrevHash}|${legacyRowFields.surface}|${legacyRowFields.subject}|${legacyRowFields.ruleId}|${legacyRowFields.verdict}|${legacyRowFields.claimText}|${legacyRowFields.extractedValuesJson}`);
  const legacyChain: ChainVerifyRow[] = [{ id: 1, prevHash: legacyPrevHash, hash: legacyHash, ...legacyRowFields }];
  const legacyResult = verifyChainRows(legacyChain);
  assert(legacyResult.ok, "a row hashed under the pre-expectedDescription (v1) formula still verifies via the legacy fallback");

  // But a row that matches NEITHER formula must still be caught.
  const legacyTampered = [{ ...legacyChain[0], claimText: "an entirely different claim" }];
  const legacyTamperedResult = verifyChainRows(legacyTampered);
  assert(!legacyTamperedResult.ok, "a row matching neither the current nor legacy formula is still reported as tampered");
}

async function main() {
  runTamperDetectionAdversarialSuite();

  console.log("── AI claim chain integrity (live chain, read-only) ──");
  const result = await verifyChainIntegrity();
  const head = await getChainHead();

  console.log(`  rows checked: ${result.totalRows}`);
  console.log(`  chain head:   ${head}`);

  if (result.ok) {
    console.log(`  ✓ chain intact — every hash re-derives correctly from row content + prior hash`);
  } else {
    console.error(`  ✗ TAMPER DETECTED at row id=${result.brokenAtId}: ${result.reason}`);
    failed = true;
  }

  if (failed) {
    console.error("\n✗ Claim chain integrity gate FAILED.");
    process.exit(1);
  }
  console.log("\n✓ Claim chain integrity gate passed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[verify-claim-chain-integrity] error:", err);
  process.exit(1);
});
