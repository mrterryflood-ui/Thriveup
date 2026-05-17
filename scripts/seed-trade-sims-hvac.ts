/**
 * Seed script for the HVAC trade in ThriveUp Trade Sims.
 *
 * Idempotent: select-then-update-or-insert keyed on `slug` (trade) and
 * `(tradeId, slug)` (lessons). Safe to run repeatedly.
 *
 * Usage:
 *     npx tsx scripts/seed-trade-sims-hvac.ts
 *
 * The `engineMode` field is flattened into the `concept` jsonb column to
 * match the way the electrical and plumbing seeds store it.
 */

import { db } from "../server/storage";
import { tradeSimsTrades, tradeSimsLessons } from "../shared/schema";
import { and, eq } from "drizzle-orm";
import {
  HVAC_LESSONS,
  HVAC_TRADE_META,
} from "../shared/data/trade-sims/hvac-lessons";

async function main() {
  console.log("[seed-trade-sims-hvac] starting");

  // 1. Upsert trade row.
  const [existingTrade] = await db
    .select()
    .from(tradeSimsTrades)
    .where(eq(tradeSimsTrades.slug, HVAC_TRADE_META.slug))
    .limit(1);

  let tradeId: number;
  if (existingTrade) {
    const [updated] = await db
      .update(tradeSimsTrades)
      .set({
        name: HVAC_TRADE_META.name,
        tagline: HVAC_TRADE_META.tagline,
        description: HVAC_TRADE_META.description,
        iconKey: HVAC_TRADE_META.iconKey,
        displayOrder: HVAC_TRADE_META.displayOrder,
        active: true,
      })
      .where(eq(tradeSimsTrades.id, existingTrade.id))
      .returning();
    tradeId = updated.id;
    console.log(`[seed-trade-sims-hvac] updated trade id=${tradeId}`);
  } else {
    const [inserted] = await db
      .insert(tradeSimsTrades)
      .values({
        slug: HVAC_TRADE_META.slug,
        name: HVAC_TRADE_META.name,
        tagline: HVAC_TRADE_META.tagline,
        description: HVAC_TRADE_META.description,
        iconKey: HVAC_TRADE_META.iconKey,
        displayOrder: HVAC_TRADE_META.displayOrder,
        active: true,
      })
      .returning();
    tradeId = inserted.id;
    console.log(`[seed-trade-sims-hvac] inserted trade id=${tradeId}`);
  }

  // 2. Upsert each lesson row.
  let upserted = 0;
  for (const lesson of HVAC_LESSONS) {
    const [existing] = await db
      .select()
      .from(tradeSimsLessons)
      .where(and(eq(tradeSimsLessons.tradeId, tradeId), eq(tradeSimsLessons.slug, lesson.slug)))
      .limit(1);

    // Flatten engineMode into concept jsonb (matches electrical's storage shape).
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

  console.log(`[seed-trade-sims-hvac] upserted ${upserted} lessons`);
  console.log("[seed-trade-sims-hvac] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-trade-sims-hvac] failed:", err);
  process.exit(1);
});
