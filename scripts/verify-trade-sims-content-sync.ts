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
import { PLUMBING_LESSONS } from "../shared/data/trade-sims/plumbing-lessons";
import { HVAC_LESSONS } from "../shared/data/trade-sims/hvac-lessons";
import { WELDING_LESSONS } from "../shared/data/trade-sims/welding-lessons";
import { AUTOMOTIVE_LESSONS } from "../shared/data/trade-sims/automotive-lessons";
import { SOFTWARE_ENGINEERING_LESSONS } from "../shared/data/trade-sims/software-engineering-lessons";

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

  // 4. Assert engineMode survives the boot-time seed for every trade.
  //    The lesson-player reads concept.engineMode to decide whether to mount
  //    an interactive canvas; a seed that drops it silently downgrades every
  //    sim lesson to read+reflect (this actually happened — see task history).
  const tradeLessonSources: Array<[string, ReadonlyArray<{ slug: string; engineMode: string }>]> = [
    ["electrical", ELECTRICAL_LESSONS as any],
    ["plumbing", PLUMBING_LESSONS as any],
    ["hvac", HVAC_LESSONS as any],
    ["welding", WELDING_LESSONS as any],
    ["automotive", AUTOMOTIVE_LESSONS as any],
    ["software-engineering", SOFTWARE_ENGINEERING_LESSONS as any],
  ];
  let engineFailures = 0;
  for (const [slug, lessons] of tradeLessonSources) {
    const [t] = await db.select().from(tradeSimsTrades).where(eq(tradeSimsTrades.slug, slug)).limit(1);
    if (!t) { console.error(`FAIL: trade ${slug} missing after seed`); engineFailures++; continue; }
    const rows = await db.select().from(tradeSimsLessons).where(eq(tradeSimsLessons.tradeId, t.id));
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    for (const l of lessons) {
      const r = bySlug.get(l.slug);
      const stored = (r?.concept as any)?.engineMode;
      if (!r || stored !== l.engineMode) {
        console.error(`FAIL: ${slug}/${l.slug} concept.engineMode = ${JSON.stringify(stored)}, expected "${l.engineMode}"`);
        engineFailures++;
      }
    }
  }
  if (engineFailures > 0) {
    console.error(`FAIL: ${engineFailures} lesson(s) lost engineMode through the boot-time seed`);
    process.exit(1);
  }
  console.log("OK: boot-time seed restores drifted lesson content and preserves concept.engineMode for all 6 trades");
  process.exit(0);
}

main().catch((err) => {
  console.error("verify-trade-sims-content-sync failed:", err);
  process.exit(1);
});
