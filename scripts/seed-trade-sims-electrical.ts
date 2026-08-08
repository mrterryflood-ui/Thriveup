/**
 * Seed script for the Electrical trade in ThriveUp Trade Sims.
 *
 * Idempotent: select-then-update-or-insert keyed on `slug` (trade) and
 * `(tradeId, slug)` (lessons). Safe to run repeatedly.
 *
 * Usage:
 *     npx tsx scripts/seed-trade-sims-electrical.ts
 */

import { seedTradeSimsElectrical } from "../server/seed-trade-sims-electrical";

async function main() {
  console.log("[seed-trade-sims-electrical] starting");
  await seedTradeSimsElectrical();
  console.log("[seed-trade-sims-electrical] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-trade-sims-electrical] failed:", err);
  process.exit(1);
});
