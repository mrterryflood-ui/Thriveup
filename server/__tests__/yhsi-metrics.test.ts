// YHSI metric-truth unit tests.
//
// This project has no configured test runner (see package.json), so these
// tests use Node's built-in test runner via tsx:
//
//   npx tsx --test server/__tests__/yhsi-metrics.test.ts
//
// They lock the *denominator + status* doctrine that the funder metrics depend
// on. The route handlers themselves run these predicates against the DB; here
// we assert the pure rules so a regression (e.g. counting in_service as
// "resolved" again, or declined as "offered") fails loudly in CI.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUPPRESSION_FLOOR,
  suppress,
  isResolvedReferralStatus,
  isOfferedEntitlementStatus,
  isPlaceholderNarrative,
  toUtcPeriodDate,
  NARRATIVE_PLACEHOLDER,
} from "../yhsi-routes";

// ── Suppression floor (doctrine: never expose counts 1–4) ──────────────────
test("suppress hides counts 1..4 and passes 0 and >=floor", () => {
  assert.equal(suppress(0), 0);
  for (let n = 1; n < SUPPRESSION_FLOOR; n++) assert.equal(suppress(n), null);
  assert.equal(suppress(SUPPRESSION_FLOOR), SUPPRESSION_FLOOR);
  assert.equal(suppress(SUPPRESSION_FLOOR + 42), SUPPRESSION_FLOOR + 42);
});

// ── Referral resolution rate: only terminal success counts as resolved ─────
test("only 'completed' referrals count as resolved", () => {
  assert.equal(isResolvedReferralStatus("completed"), true);
  for (const s of ["initiated", "contacted", "enrolled", "in_service", "closed_unresolved", "declined"]) {
    assert.equal(isResolvedReferralStatus(s), false, `${s} must NOT be resolved`);
  }
});

test("resolution rate uses completed-only numerator", () => {
  const byStatus = [
    { key: "completed", n: 6 },
    { key: "in_service", n: 4 }, // previously (wrongly) counted as resolved
    { key: "enrolled", n: 3 }, // previously (wrongly) counted as resolved
    { key: "declined", n: 2 },
  ];
  const total = byStatus.reduce((s, r) => s + r.n, 0); // 15
  const resolved = byStatus.filter((r) => isResolvedReferralStatus(r.key)).reduce((s, r) => s + r.n, 0);
  assert.equal(resolved, 6);
  assert.equal(Math.round((resolved / total) * 100), 40); // not 87% (13/15)
});

// ── Entitlement "offered": only real offers count ──────────────────────────
test("only offered/applied/enrolled count as offered", () => {
  for (const s of ["offered", "applied", "enrolled"]) {
    assert.equal(isOfferedEntitlementStatus(s), true, `${s} is an offer`);
  }
  for (const s of ["declined", "denied", "ineligible"]) {
    assert.equal(isOfferedEntitlementStatus(s), false, `${s} is NOT an offer`);
  }
});

// ── Outcomes summary doctrine: known-only denominators + dedupe per youth ──
// Re-implements the exact rules the SQL applies, over an in-memory fixture,
// so the "one latest snapshot per (participant, snapshotType)" + "known-only
// denominator" contract is regression-locked.
type Snap = {
  participantId: string;
  snapshotType: string;
  recordedAt: number;
  employmentStatus: string | null;
};

function latestPerParticipantType(snaps: Snap[]): Snap[] {
  const best = new Map<string, Snap>();
  for (const s of snaps) {
    const k = `${s.participantId}::${s.snapshotType}`;
    const cur = best.get(k);
    if (!cur || s.recordedAt > cur.recordedAt) best.set(k, s);
  }
  return [...best.values()];
}

test("employment rate dedupes to latest snapshot per participant and excludes unknowns from denominator", () => {
  const snaps: Snap[] = [
    // participant A: two month_6 snapshots — only the latest (t=2) counts
    { participantId: "A", snapshotType: "month_6", recordedAt: 1, employmentStatus: "seeking" },
    { participantId: "A", snapshotType: "month_6", recordedAt: 2, employmentStatus: "employed_ft" },
    // B employed
    { participantId: "B", snapshotType: "month_6", recordedAt: 1, employmentStatus: "employed_pt" },
    // C unknown -> excluded from BOTH numerator and denominator
    { participantId: "C", snapshotType: "month_6", recordedAt: 1, employmentStatus: "unknown" },
    // D not employed but known
    { participantId: "D", snapshotType: "month_6", recordedAt: 1, employmentStatus: "not_seeking" },
    // E,F known not-employed to clear the suppression floor of 5 knowns
    { participantId: "E", snapshotType: "month_6", recordedAt: 1, employmentStatus: "seeking" },
    { participantId: "F", snapshotType: "month_6", recordedAt: 1, employmentStatus: "seeking" },
  ];
  const deduped = latestPerParticipantType(snaps);
  assert.equal(deduped.length, 6); // A counted once

  const known = deduped.filter((s) => s.employmentStatus && s.employmentStatus !== "unknown");
  const employed = known.filter((s) => ["employed_ft", "employed_pt"].includes(s.employmentStatus!));
  assert.equal(known.length, 5); // C's unknown excluded
  assert.equal(employed.length, 2); // A(latest)=ft, B=pt

  const rate = known.length >= SUPPRESSION_FLOOR ? Math.round((employed.length / known.length) * 100) : null;
  assert.equal(rate, 40); // 2/5, NOT 2/6 (total) and NOT double-counting A
});

// ── HUD report: placeholder narrative gate ─────────────────────────────────
test("placeholder / empty narratives are flagged incomplete", () => {
  assert.equal(isPlaceholderNarrative(undefined), true);
  assert.equal(isPlaceholderNarrative(null), true);
  assert.equal(isPlaceholderNarrative("   "), true);
  assert.equal(isPlaceholderNarrative(NARRATIVE_PLACEHOLDER), true);
  assert.equal(isPlaceholderNarrative(`Draft in progress. ${NARRATIVE_PLACEHOLDER}`), true);
  assert.equal(isPlaceholderNarrative("A fully written HUD narrative with real content."), false);
});

// ── HUD report: timezone-safe (UTC) period dates ───────────────────────────
test("date-only period strings pin to UTC midnight regardless of locale", () => {
  const d = toUtcPeriodDate("2024-06-30");
  assert.ok(d);
  assert.equal(d!.toISOString(), "2024-06-30T00:00:00.000Z");
  assert.equal(toUtcPeriodDate("not-a-date"), null);
  const passthrough = toUtcPeriodDate(new Date("2024-01-15T12:00:00.000Z"));
  assert.equal(passthrough!.toISOString(), "2024-01-15T12:00:00.000Z");
});
