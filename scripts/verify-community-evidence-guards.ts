// Regression gate for two evidence-integrity invariants fixed 2026-08-14:
//
//  1. `canonicalizeGeographyFromEvidence` — a caller-supplied brief/story can
//     pair a structurally-valid evidence contract for one geography with an
//     arbitrary displayed `geography` block. This must be forced to agree
//     with `evidence.geography.resolved` before anything is stored or served
//     across a public trust boundary (brief-share-routes.ts,
//     community-story-routes.ts).
//  2. `enforceGroundedRoi` — the AI narrative is instructed to state only the
//     one real computed ROI figure (or none), but that is not a guarantee.
//     This mechanical, non-AI check strips any sentence containing a
//     ratio-shaped claim that does not exactly match the computed ROI.
//
// Run: npx tsx scripts/verify-community-evidence-guards.ts

import { canonicalizeGeographyFromEvidence } from "../server/community-evidence";
import { enforceGroundedRoi, extractRoiClaims } from "../server/conductor-routes";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

// ── 1. Geography canonicalization ───────────────────────────────────────────
console.log("── canonicalizeGeographyFromEvidence ──");
{
  // Attacker submits a valid ZCTA evidence block but a citywide-looking
  // displayed geography — the exact contradiction the code review rejected.
  const brief: Record<string, any> = {
    geography: { displayName: "City of Austin (all neighborhoods)", zip: "00000" },
    evidence: {
      version: "community-evidence/v1",
      geography: {
        requested: { input: "78660", type: "zip" },
        resolved: { type: "zcta", identifier: "78660", label: "ZCTA 78660", method: "census-zcta-lookup" },
      },
    },
  };
  canonicalizeGeographyFromEvidence(brief);
  check("displayName forced to match evidence resolved label", brief.geography.displayName === "ZCTA 78660");
  check("zip forced to match evidence resolved identifier", brief.geography.zip === "78660");
  check("countyName cleared for a zcta resolution", brief.geography.countyName === undefined);
}
{
  // County-resolved geography: displayed county name must match too.
  const brief: Record<string, any> = {
    geography: { displayName: "Some Other County, TX", zip: "12345" },
    evidence: {
      version: "community-evidence/v1",
      geography: {
        requested: { input: "Travis County, TX", type: "county" },
        resolved: { type: "county", identifier: "48453", label: "Travis County, TX", method: "census-county-lookup" },
      },
    },
  };
  canonicalizeGeographyFromEvidence(brief);
  check("county displayName forced to match evidence resolved label", brief.geography.displayName === "Travis County, TX");
  check("zip cleared for a county resolution", brief.geography.zip === undefined);
}
{
  // No evidence.geography.resolved present at all — must be a no-op, not a crash.
  const brief: Record<string, any> = { geography: { displayName: "Untouched" }, evidence: {} };
  canonicalizeGeographyFromEvidence(brief);
  check("no-op when evidence.geography.resolved is missing", brief.geography.displayName === "Untouched");
}

// ── 2. ROI narrative grounding ──────────────────────────────────────────────
console.log("── enforceGroundedRoi ──");
{
  const cascade = { roi: "3.2" };
  const grounded = "Investing here returns 3.2x every dollar spent. This community deserves support.";
  check("narrative stating the exact computed ROI is left untouched", enforceGroundedRoi(grounded, cascade) === grounded);
}
{
  const cascade = { roi: "3.2" };
  const invented = "For every dollar invested, this community sees five dollars for every $1 returned. Support is needed.";
  const cleaned = enforceGroundedRoi(invented, cascade);
  check("invented ratio ('five dollars for every $1') is stripped", !/five/i.test(cleaned) && !/for every/i.test(cleaned));
  check("non-offending sentence survives redaction", /Support is needed/.test(cleaned));
}
{
  const cascade = { roi: "3.2" };
  const wrongNumber = "This intervention delivers a 5:1 return on investment for the community.";
  const cleaned = enforceGroundedRoi(wrongNumber, cascade);
  check("mismatched numeric ratio (5:1 vs computed 3.2) is stripped", !/5:1/.test(cleaned));
}
{
  // No scenario was computed at all — ANY ratio claim is fabricated.
  const invented = "Every dollar spent here returns $5 for every $1 invested.";
  const cleaned = enforceGroundedRoi(invented, null);
  check("any ratio claim with no scenario computed is stripped", cleaned === "" || !/for every/i.test(cleaned));
}
{
  const cascade = { roi: "3.2" };
  const noClaim = "This community faces real challenges, but targeted investment can change the trajectory.";
  check("narrative with no ratio claim is left untouched", enforceGroundedRoi(noClaim, cascade) === noClaim);
}
{
  check("extractRoiClaims finds '3.2x'", extractRoiClaims("a 3.2x return").includes(3.2));
  check("extractRoiClaims finds '5:1'", extractRoiClaims("a 5:1 ratio").includes(5));
  check("extractRoiClaims finds spelled-out 'five to one'", extractRoiClaims("a five to one ratio").includes(5));
}

// ── Adversarial cases from code review: unpunctuated end-of-string, and
//    prose variants that don't fit a strict numeric-ratio regex ────────────
console.log("── enforceGroundedRoi adversarial cases ──");
{
  const cascade = { roi: "3.2" };
  const noTrailingPunctuation = "Every dollar spent here returns 5x";
  const cleaned = enforceGroundedRoi(noTrailingPunctuation, cascade);
  check("mismatched ratio with NO terminal punctuation is still redacted", !/5x/.test(cleaned));
}
{
  const cascade = { roi: "3.2" };
  const proseVariant = "This program returns five dollars for every dollar invested in the community.";
  const cleaned = enforceGroundedRoi(proseVariant, cascade);
  check("'five dollars for every dollar invested' (no $ sign) is redacted", cleaned === "");
}
{
  const cascade = { roi: "3.2" };
  const perDollar = "The community sees real returns per dollar invested in prevention.";
  const cleaned = enforceGroundedRoi(perDollar, cascade);
  check("vague 'per dollar invested' with no verifiable figure is redacted", cleaned === "");
}
{
  const cascade = { roi: "3.2" };
  const fold = "Investment here could return the community's spending fivefold.";
  const cleaned = enforceGroundedRoi(fold, cascade);
  check("'fivefold' claim is redacted", cleaned === "");
}
{
  const cascade = { roi: "3.2" };
  const timesInvestment = "Prevention programs return three times the investment in avoided costs.";
  const cleaned = enforceGroundedRoi(timesInvestment, cascade);
  check("'times the investment' claim is redacted", cleaned === "");
}
{
  const cascade = { roi: "3.2" };
  const percentReturn = "This scenario models a 220% return for the community.";
  const cleaned = enforceGroundedRoi(percentReturn, cascade);
  check("percentage-return claim is redacted", cleaned === "");
}
{
  const cascade = { roi: "3.2" };
  // Correct, canonical figure stated as "3.2x" mid-sentence — must survive.
  const correct = "TCAF's model projects a 3.2x return for every dollar the community invests here.";
  check("sentence stating the exact canonical ROI figure survives", enforceGroundedRoi(correct, cascade) === correct);
}

// ── Positive cases: EXACT-match alternate phrasings must survive, not just
//    "3.2x" — the reviewer flagged that an allow-list of only "Nx"/"N:1"
//    would incorrectly strip a correctly-grounded claim stated another way.
console.log("── enforceGroundedRoi grounded alternate phrasings survive ──");
{
  const cascade = { roi: "3.2" };
  const perDollar = "This program returns $3.2 per dollar invested in prevention.";
  check("exact '$3.2 per dollar invested' survives", enforceGroundedRoi(perDollar, cascade) === perDollar);
}
{
  const cascade = { roi: "3.2" };
  const forEvery = "The community sees 3.2 dollars for every dollar spent here.";
  check("exact '3.2 dollars for every dollar' survives", enforceGroundedRoi(forEvery, cascade) === forEvery);
}
{
  const cascade = { roi: "3.2" };
  const fold = "Prevention spending returns 3.2-fold for this community.";
  check("exact '3.2-fold' survives", enforceGroundedRoi(fold, cascade) === fold);
}
{
  const cascade = { roi: "3.2" };
  const times = "This investment returns 3.2 times the investment in avoided costs.";
  check("exact '3.2 times the investment' survives", enforceGroundedRoi(times, cascade) === times);
}
{
  const cascade = { roi: "3.2" };
  const ratioColon = "Community leaders can point to a 3.2:1 return on investment.";
  check("exact '3.2:1' survives", enforceGroundedRoi(ratioColon, cascade) === ratioColon);
}
{
  const cascade = { roi: "3.2" };
  const percent = "This scenario models a 320% return for the community.";
  check("exact matching '320% return' (roi*100) survives", enforceGroundedRoi(percent, cascade) === percent);
}
{
  const cascade = { roi: "3.2" };
  // Unpunctuated ending + exact grounded figure — must still survive (not just get caught when wrong).
  const noPunctuation = "Every dollar spent here returns 3.2x";
  check("exact grounded claim with no terminal punctuation survives", enforceGroundedRoi(noPunctuation, cascade) === noPunctuation);
}

console.log(`\n── Results: ${failures === 0 ? "ALL PASSED" : `${failures} FAILED`} ──`);
if (failures > 0) process.exit(1);
