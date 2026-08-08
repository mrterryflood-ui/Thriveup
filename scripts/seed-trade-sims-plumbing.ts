/**
 * Seed script for the Plumbing trade in ThriveUp Trade Sims.
 *
 * Idempotent: select-then-update-or-insert keyed on `slug` (trade) and
 * `(tradeId, slug)` (lessons). Safe to run repeatedly.
 *
 * Usage:
 *     npx tsx scripts/seed-trade-sims-plumbing.ts
 *
 * The actual upsert logic lives in `server/seed-trade-sims-plumbing.ts` so
 * the production server can run the same content push at startup (the DB is
 * the runtime source of truth for lesson content).
 */

import { seedTradeSimsPlumbing } from "../server/seed-trade-sims-plumbing";

async function main() {
  console.log("[seed-trade-sims-plumbing] starting");
  await seedTradeSimsPlumbing();
  console.log("[seed-trade-sims-plumbing] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-trade-sims-plumbing] failed:", err);
  process.exit(1);
});
