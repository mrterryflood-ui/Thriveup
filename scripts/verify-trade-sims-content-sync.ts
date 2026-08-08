/**
 * Verifies the production content-sync path for Trade Sims lessons:
 * an existing lesson row that has drifted from shared/data content must be
 * restored by the boot-time seed (`seedTradeSimsAll`, invoked on every
 * startup via seedComprehensive in registerRoutes).
 *
 * Method: corrupt one lesson row's title in the DB, run seedTradeSimsAll(),
 * and assert the row is restored to the shared/data source of truth.
 *
 * Usage: npx tsx scripts/verify-trade-sims-content-sync.ts
 */

import { db } from "../server/storage";
import { tradeSimsTrades, tradeSimsLessons } from "../shared/schema";
import { and, eq } from "drizzle-orm";
import { seedTradeSimsAll } from "../server/seed-comprehensive";
import { ELECTRICAL_LESSONS } from "../shared/data/trade-sims/electrical-lessons";

async function main() {
  const canonical = ELECTRICAL_LESSONS[0];
  const [trade] = await db.select().from(tradeSimsTrades).where(eq(tradeSimsTrades.slug, "electrical")).limit(1);
  if (!trade) throw new Error("electrical trade row missing — run the seed first");

  const where = and(eq(tradeSimsLessons.tradeId, trade.id), eq(tradeSimsLessons.slug, canonical.slug));
  const [row] = await db.select().from(tradeSimsLessons).where(where).limit(1);
  if (!row) throw new Error(`lesson row ${canonical.slug} missing — run the seed first`);

  // 1. Simulate drift.
  const DRIFT = "__DRIFTED_TITLE_FOR_SYNC_TEST__";
  await db.update(tradeSimsLessons).set({ title: DRIFT }).where(eq(tradeSimsLessons.id, row.id));

  // 2. Run the boot-time seed path.
  await seedTradeSimsAll();

  // 3. Assert restoration.
  const [after] = await db.select().from(tradeSimsLessons).where(eq(tradeSimsLessons.id, row.id)).limit(1);
  if (!after || after.title !== canonical.title) {
    console.error(`FAIL: lesson title not restored by seedTradeSimsAll — got "${after?.title}"`);
    process.exit(1);
  }
  console.log("OK: boot-time seed restores drifted lesson content (production content-sync path works)");
  process.exit(0);
}

main().catch((err) => {
  console.error("verify-trade-sims-content-sync failed:", err);
  process.exit(1);
});
