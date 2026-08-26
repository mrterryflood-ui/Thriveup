import { spawnSync } from "node:child_process";

const checks = [
  ["architect", "npm run architect"],
  ["frontend lint", "npm run lint"],
  ["strict TypeScript", "NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p ."],
  ["browser and PDF proof", "npm run verify:browser"],
  ["preflight", "npx tsx scripts/preflight.ts"],
  ["memory health", "npx tsx scripts/memory-health.ts"],
  ["full-stack congruence", "npx tsx scripts/congruence-audit.ts"],
  ["diff whitespace", "git diff --check"],
];

console.log("COMPLETE VERIFICATION — ordered post-build gate");
console.log("Run this after every build. It fails closed; it does not convert warnings or unavailable evidence into passes.\n");

for (const [label, command] of checks) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\nCOMPLETE VERIFICATION FAILED at: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nCOMPLETE VERIFICATION PASSED");