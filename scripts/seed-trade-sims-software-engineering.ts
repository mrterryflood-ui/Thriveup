/**
 * Seed script for the Software Engineering trade in ThriveUp Trade Sims.
 *
 * Idempotent: select-then-update-or-insert keyed on `slug` (trade) and
 * `(tradeId, slug)` (lessons). Safe to run repeatedly.
 *
 * Usage:
 *     npx tsx scripts/seed-trade-sims-software-engineering.ts
 *
 * Mirrors the welding/automotive/plumbing/hvac seed pattern exactly.
 */

import { db } from "../server/storage";
import { tradeSimsTrades, tradeSimsLessons } from "../shared/schema";
import { and, eq } from "drizzle-orm";
import {
  SOFTWARE_ENGINEERING_LESSONS,
  SOFTWARE_ENGINEERING_TRADE_META,
} from "../shared/data/trade-sims/software-engineering-lessons";

async function main() {
  console.log("[seed-trade-sims-software-engineering] starting");

  const [existingTrade] = await db
    .select()
    .from(tradeSimsTrades)
    .where(eq(tradeSimsTrades.slug, SOFTWARE_ENGINEERING_TRADE_META.slug))
    .limit(1);

  let tradeId: number;
  if (existingTrade) {
    const [updated] = await db
      .update(tradeSimsTrades)
      .set({
        name: SOFTWARE_ENGINEERING_TRADE_META.name,
        tagline: SOFTWARE_ENGINEERING_TRADE_META.tagline,
        description: SOFTWARE_ENGINEERING_TRADE_META.description,
        iconKey: SOFTWARE_ENGINEERING_TRADE_META.iconKey,
        displayOrder: SOFTWARE_ENGINEERING_TRADE_META.displayOrder,
        active: true,
      })
      .where(eq(tradeSimsTrades.id, existingTrade.id))
      .returning();
    tradeId = updated.id;
    console.log(`[seed-trade-sims-software-engineering] updated trade id=${tradeId}`);
  } else {
    const [inserted] = await db
      .insert(tradeSimsTrades)
      .values({
        slug: SOFTWARE_ENGINEERING_TRADE_META.slug,
        name: SOFTWARE_ENGINEERING_TRADE_META.name,
        tagline: SOFTWARE_ENGINEERING_TRADE_META.tagline,
        description: SOFTWARE_ENGINEERING_TRADE_META.description,
        iconKey: SOFTWARE_ENGINEERING_TRADE_META.iconKey,
        displayOrder: SOFTWARE_ENGINEERING_TRADE_META.displayOrder,
        active: true,
      })
      .returning();
    tradeId = inserted.id;
    console.log(`[seed-trade-sims-software-engineering] inserted trade id=${tradeId}`);
  }

  let upserted = 0;
  for (const lesson of SOFTWARE_ENGINEERING_LESSONS) {
    const [existing] = await db
      .select()
      .from(tradeSimsLessons)
      .where(and(eq(tradeSimsLessons.tradeId, tradeId), eq(tradeSimsLessons.slug, lesson.slug)))
      .limit(1);

    const conceptWithMode = {
      ...lesson.concept,
      engineMode: lesson.engineMode,
    };

    const values = {
      tradeId,
      dayNumber: lesson.dayNumber,
      slug: lesson.slug,
      title: lesson.title,
      shortDescription: lesson.shortDescription,
      concept: conceptWithMode as unknown,
      guidedSteps: lesson.guidedSteps as unknown,
      soloChallenge: lesson.soloChallenge as unknown,
      sandboxStarter: lesson.sandboxStarter as unknown,
      credentialPathway: lesson.credentialPathway,
      active: true,
    };

    if (existing) {
      await db.update(tradeSimsLessons).set(values).where(eq(tradeSimsLessons.id, existing.id));
    } else {
      await db.insert(tradeSimsLessons).values(values);
    }
    upserted++;
  }

  console.log(`[seed-trade-sims-software-engineering] upserted ${upserted} lessons`);
  console.log("[seed-trade-sims-software-engineering] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-trade-sims-software-engineering] failed:", err);
  process.exit(1);
});
