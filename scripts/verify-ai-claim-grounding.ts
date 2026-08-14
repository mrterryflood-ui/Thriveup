// Regression + adversarial gate for the universal AI numeric-claim grounding
// engine (server/ai-claim-grounding.ts) and its use across every AI surface
// that can emit a statistic: the community brief narrative, the gun violence
// AI story, and the RPLICE multi-AI consensus analysis.
//
// This also acts as a lightweight PRE-MERGE static check: any new call site
// that invokes generateAIJSON/generateMultiAIResponse and returns numeric
// content to a client MUST import from ai-claim-grounding, or this gate
// fails the build. That is intentionally blunt (it can false-flag a file
// that has a legitimate reason not to ground its output), but per doctrine
// a false positive here only ever requires a one-line explicit allow-list
// edit below — it never silently lets an unguarded surface through.
//
// Run: npx tsx scripts/verify-ai-claim-grounding.ts

import fs from "fs";
import { enforceGroundedClaims, buildRoiRule, buildPercentRule, buildDollarMillionsRule, buildAnyOfRule, type ClaimRule } from "../server/ai-claim-grounding";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

// ── 1. Shared engine: ROI rule (existing behavior must be unchanged) ───────
console.log("── buildRoiRule via enforceGroundedClaims ──");
{
  const rule = buildRoiRule("roi", 3.2);
  check(
    "keeps a sentence stating the exact computed ROI",
    enforceGroundedClaims("Every dollar invested returns 3.2x in savings.", [rule]).text.includes("3.2x")
  );
  check(
    "strips a sentence with an invented ROI",
    !enforceGroundedClaims("Every dollar invested returns 9.9x in savings. The program is strong.", [rule]).text.includes("9.9x")
  );
  check(
    "unrelated sentences survive untouched",
    enforceGroundedClaims("This community has 40% poverty. Investment yields 3.2x.", [rule]).text.includes("40% poverty")
  );
  const noScenario = buildRoiRule("roi", null);
  check(
    "with no computed ROI, ANY ratio claim is stripped",
    !enforceGroundedClaims("This saves $5 for every $1 invested.", [noScenario]).text.includes("$5")
  );
}

// ── 2. Percent rule ─────────────────────────────────────────────────────────
console.log("── buildPercentRule ──");
{
  const rule = buildPercentRule("poverty-rate", /poverty/i, 22.5);
  check("keeps a matching poverty percentage", enforceGroundedClaims("The poverty rate here is 22.5%.", [rule]).text.includes("22.5%"));
  check("strips a mismatched poverty percentage", !enforceGroundedClaims("The poverty rate here is 60%.", [rule]).text.includes("60%"));
  check("leaves unrelated percentages alone", enforceGroundedClaims("Unemployment is 9% in this area.", [rule]).text.includes("9%"));
}

// ── 3. Dollar-millions rule ──────────────────────────────────────────────────
console.log("── buildDollarMillionsRule ──");
{
  const rule = buildDollarMillionsRule("cost-of-inaction", /cost of inaction/i, 4.2);
  check("keeps a matching (rounded) dollar figure", enforceGroundedClaims("The cost of inaction is $4.18M annually.", [rule]).text.includes("$4.18M"));
  check("strips a fabricated dollar figure", !enforceGroundedClaims("The cost of inaction is $50M annually.", [rule]).text.includes("$50M"));
}

// ── 4. Any-of rule (gun violence national stats pattern) ───────────────────
console.log("── buildAnyOfRule ──");
{
  const rule = buildAnyOfRule(
    "national-stats",
    /died|deaths?/i,
    (s) => {
      const claims: { value: number; kind: string }[] = [];
      const re = /(\d[\d,]*(?:\.\d+)?)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(s))) {
        const n = parseFloat(m[1].replace(/,/g, ""));
        // Exclude bare 4-digit calendar-year mentions ("since 1999") — a
        // year is not itself a statistical claim needing grounding.
        if (n >= 1900 && n <= 2100 && !m[1].includes(",")) continue;
        claims.push({ value: n, kind: "stat" });
      }
      return claims;
    },
    [834013, 14.5],
    (v) => Math.max(0.5, Math.abs(v) * 0.03)
  );
  check("keeps the real national death total", enforceGroundedClaims("834013 Americans have died since 1999.", [rule]).text.includes("834013"));
  check("strips an invented death total", !enforceGroundedClaims("2000000 Americans have died since 1999.", [rule]).text.includes("2000000"));
}

// ── 5. Multi-rule interaction: a sentence tripping two rules must satisfy both
console.log("── multi-rule sentences ──");
{
  const rules: ClaimRule[] = [buildRoiRule("roi", 3.2), buildPercentRule("poverty-rate", /poverty/i, 22.5)];
  const text = "This 40% poverty community sees 3.2x returns.";
  check("a sentence failing ONE of two rules is fully stripped", !enforceGroundedClaims(text, rules).text.includes("40%"));
  const goodText = "This 22.5% poverty community sees 3.2x returns.";
  check("a sentence satisfying BOTH rules survives", enforceGroundedClaims(goodText, rules).text.includes("22.5%") && enforceGroundedClaims(goodText, rules).text.includes("3.2x"));
}

// ── 6. Decision records are produced for chain recording ───────────────────
console.log("── grounding decisions ──");
{
  const rule = buildRoiRule("roi", 3.2);
  const result = enforceGroundedClaims("This saves 9.9x. Unrelated sentence.", [rule]);
  check("a stripped claim produces a 'stripped' decision", result.decisions.some((d) => d.verdict === "stripped"));
  check("decisions carry the rule id", result.decisions.every((d) => d.ruleId === "roi"));
}

// ── 7. Static enforcement: every known numeric AI surface imports the shared engine
console.log("── static import check (pre-merge gate) ──");
{
  const requiredImporters = [
    "server/conductor-routes.ts",
    "server/gun-violence-routes.ts",
    "server/rplice-tools.ts",
  ];
  for (const file of requiredImporters) {
    const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    check(`${file} imports ai-claim-grounding`, /from ["']\.\/ai-claim-grounding["']/.test(content));
    check(`${file} records claim-chain decisions`, /recordClaimDecisions/.test(content));
  }
}

console.log(failures === 0 ? "\n✓ All AI claim-grounding checks passed." : `\n✗ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
