/**
 * Plumbing trade-sims content upsert.
 *
 * Idempotent: select-then-update-or-insert keyed on `slug` (trade) and
 * `(tradeId, slug)` (lessons). Safe to run repeatedly — reseeding is the
 * sanctioned way to push lesson-content fixes to users (the DB is the
 * runtime source of truth; the API serves tradeSimsLessons rows).
 *
 * Called from:
 *   - `scripts/seed-trade-sims-plumbing.ts` (manual CLI run against dev)
 *   - `server/index.ts` production startup (so every deploy carries the
 *     latest lesson content — e.g. Day 6 backflowRubric — to production
 *     without a manual post-deploy step). Data-only upserts; no DDL.
 */

import { db } from "./storage";
import { tradeSimsTrades, tradeSimsLessons } from "../shared/schema";
import { and, eq } from "drizzle-orm";
import {
  PLUMBING_LESSONS,
  PLUMBING_TRADE_META,
} from "../shared/data/trade-sims/plumbing-lessons";

export async function seedTradeSimsPlumbing(): Promise<{ tradeId: number; upserted: number }> {
  // 1. Upsert trade row.
  const [existingTrade] = await db
    .select()
    .from(tradeSimsTrades)
    .where(eq(tradeSimsTrades.slug, PLUMBING_TRADE_META.slug))
    .limit(1);

  let tradeId: number;
  if (existingTrade) {
    const [updated] = await db
      .update(tradeSimsTrades)
      .set({
        name: PLUMBING_TRADE_META.name,
        tagline: PLUMBING_TRADE_META.tagline,
        description: PLUMBING_TRADE_META.description,
        iconKey: PLUMBING_TRADE_META.iconKey,
        displayOrder: PLUMBING_TRADE_META.displayOrder,
        active: true,
      })
      .where(eq(tradeSimsTrades.id, existingTrade.id))
      .returning();
    tradeId = updated.id;
    console.log(`[seed-trade-sims-plumbing] updated trade id=${tradeId}`);
  } else {
    const [inserted] = await db
      .insert(tradeSimsTrades)
      .values({
        slug: PLUMBING_TRADE_META.slug,
        name: PLUMBING_TRADE_META.name,
        tagline: PLUMBING_TRADE_META.tagline,
        description: PLUMBING_TRADE_META.description,
        iconKey: PLUMBING_TRADE_META.iconKey,
        displayOrder: PLUMBING_TRADE_META.displayOrder,
        active: true,
      })
      .returning();
    tradeId = inserted.id;
    console.log(`[seed-trade-sims-plumbing] inserted trade id=${tradeId}`);
  }

  // 2. Upsert each lesson row.
  let upserted = 0;
  for (const lesson of PLUMBING_LESSONS) {
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

  console.log(`[seed-trade-sims-plumbing] upserted ${upserted} lessons`);
  return { tradeId, upserted };
}
