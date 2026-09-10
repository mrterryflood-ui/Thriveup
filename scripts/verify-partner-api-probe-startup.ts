/**
 * Verify that server/index.ts registers both production startup probes
 * (startCommunityBriefProbe and startPartnerApiContractProbe) in the correct
 * NODE_ENV === "production" blocks.
 *
 * Uses line-based analysis to avoid regex fragility from destructuring braces
 * inside the import lines.
 *
 * Exit: 0 on all assertions passing, 1 on any failure.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const src = readFileSync(resolve("server/index.ts"), "utf-8");
const lines = src.split("\n");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

/**
 * Find all line indices that match a regex.
 */
function findLines(re: RegExp): number[] {
  return lines.reduce<number[]>((acc, line, idx) => (re.test(line) ? [...acc, idx] : acc), []);
}

/**
 * Check whether any call-site line (e.g. `startFoo()`) is preceded within
 * `windowLines` by a production guard line, without an intervening closing `}`
 * that would exit the guard block.
 *
 * Strategy: for each call-site line, scan backwards up to windowLines.  If we
 * encounter a `NODE_ENV.*production` line before we see an unmatched `}` that
 * closes the block, the call is inside a production guard.
 */
function callIsInsideProductionBlock(callLineIdx: number, windowLines = 20): boolean {
  let braceDepth = 0;
  for (let i = callLineIdx - 1; i >= Math.max(0, callLineIdx - windowLines); i--) {
    const line = lines[i];
    // Count closing braces on this line (we're scanning backwards, so } is an opener of an outer block)
    for (const ch of line) {
      if (ch === "}") braceDepth++;
      if (ch === "{") {
        if (braceDepth > 0) {
          braceDepth--;
        } else {
          // Opening brace of the enclosing block — check if this line has a production guard
          if (/NODE_ENV\s*===\s*["']production["']/.test(line) || /NODE_ENV\s*===\s*["']production["']/.test(lines[i])) {
            return true;
          }
        }
      }
    }
    if (/if\s*\(.*NODE_ENV\s*===\s*["']production["']/.test(line)) {
      return true;
    }
  }
  return false;
}

console.log("\nPartner API contract probe startup registration test\n");

// ── 1. Imports ────────────────────────────────────────────────────────────────

console.log("[1] Imports");
assert(
  "community-brief-probe is imported",
  /community-brief-probe/.test(src),
  "import not found in server/index.ts",
);
assert(
  "partner-api-contract-probe is imported",
  /partner-api-contract-probe/.test(src),
  "import not found in server/index.ts",
);

// ── 2. Call sites exist ───────────────────────────────────────────────────────

console.log("\n[2] Call sites");
const communityCallLines = findLines(/startCommunityBriefProbe\s*\(\s*\)/);
const contractCallLines = findLines(/startPartnerApiContractProbe\s*\(\s*\)/);

assert(
  "startCommunityBriefProbe() is called",
  communityCallLines.length > 0,
  "call site not found — function may be imported but never invoked",
);
assert(
  "startPartnerApiContractProbe() is called",
  contractCallLines.length > 0,
  "call site not found — function may be imported but never invoked",
);

// ── 3. Calls are inside production guards ────────────────────────────────────

console.log("\n[3] Production guards");

// Use a proximity search: check that a NODE_ENV === "production" guard appears
// within 15 lines before each call site (the if-block is typically 3–6 lines).
const GUARD_WINDOW = 15;

const communityInGuard = communityCallLines.some((lineIdx) => {
  for (let i = Math.max(0, lineIdx - GUARD_WINDOW); i < lineIdx; i++) {
    if (/NODE_ENV\s*===\s*["']production["']/.test(lines[i])) return true;
  }
  return false;
});

const contractInGuard = contractCallLines.some((lineIdx) => {
  for (let i = Math.max(0, lineIdx - GUARD_WINDOW); i < lineIdx; i++) {
    if (/NODE_ENV\s*===\s*["']production["']/.test(lines[i])) return true;
  }
  return false;
});

const productionGuardLines = findLines(/NODE_ENV\s*===\s*["']production["']/);
assert(
  "At least two production guards exist in server/index.ts",
  productionGuardLines.length >= 2,
  `found ${productionGuardLines.length} guard(s)`,
);
assert(
  "startCommunityBriefProbe() is called inside a production guard",
  communityInGuard,
  `call at line(s) ${communityCallLines.map((l) => l + 1).join(", ")} — no guard in preceding ${GUARD_WINDOW} lines`,
);
assert(
  "startPartnerApiContractProbe() is called inside a production guard",
  contractInGuard,
  `call at line(s) ${contractCallLines.map((l) => l + 1).join(", ")} — no guard in preceding ${GUARD_WINDOW} lines`,
);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
