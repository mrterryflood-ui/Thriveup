/**
 * Electrical trade-sims content upsert.
 *
 * Idempotent: select-then-update-or-insert keyed on `slug` (trade) and
 * `(tradeId, slug)` (lessons). Safe to run repeatedly — reseeding is the
 * sanctioned way to push lesson-content fixes to users (the DB is the
 * runtime source of truth; the API serves tradeSimsLessons rows).
 *
 * Called from:
 *   - `scripts/seed-trade-sims-electrical.ts` (manual CLI run against dev)
 */

import { db } from "./storage";
import { tradeSimsTrades, tradeSimsLessons } from "../shared/schema";
import { and, eq } from "drizzle-orm";
import {
  ELECTRICAL_LESSONS,
  ELECTRICAL_TRADE_META,
} from "../shared/data/trade-sims/electrical-lessons";

export async function seedTradeSimsElectrical(): Promise<{ tradeId: number; upserted: number }> {
  const meta = ELECTRICAL_TRADE_META;
  const [existing] = await db.select().from(tradeSimsTrades).where(eq(tradeSimsTrades.slug, meta.slug)).limit(1);
  let tradeId: number;
  if (existing) {
    const [updated] = await db.update(tradeSimsTrades).set({
      name: meta.name, tagline: meta.tagline, description: meta.description,
      iconKey: meta.iconKey, displayOrder: meta.displayOrder, active: true,
    }).where(eq(tradeSimsTrades.id, existing.id)).returning();
    tradeId = updated.id;
  } else {
    const [inserted] = await db.insert(tradeSimsTrades).values({
      slug: meta.slug, name: meta.name, tagline: meta.tagline,
      description: meta.description, iconKey: meta.iconKey,
      displayOrder: meta.displayOrder, active: true,
    }).returning();
    tradeId = inserted.id;
  }

  let upserted = 0;
  for (const lesson of ELECTRICAL_LESSONS) {
    const [existingLesson] = await db.select().from(tradeSimsLessons)
      .where(and(eq(tradeSimsLessons.tradeId, tradeId), eq(tradeSimsLessons.slug, lesson.slug))).limit(1);
    const values = {
      tradeId,
      dayNumber: lesson.dayNumber,
      slug: lesson.slug,
      title: lesson.title,
      shortDescription: lesson.shortDescription,
      concept: lesson.concept as unknown,
      guidedSteps: lesson.guidedSteps as unknown,
      soloChallenge: lesson.soloChallenge as unknown,
      sandboxStarter: lesson.sandboxStarter as unknown,
      credentialPathway: lesson.credentialPathway,
      active: true,
    };
    if (existingLesson) {
      await db.update(tradeSimsLessons).set(values).where(eq(tradeSimsLessons.id, existingLesson.id));
    } else {
      await db.insert(tradeSimsLessons).values(values);
    }
    upserted++;
  }
  console.log(`[seed-trade-sims-electrical] upserted ${upserted} lessons`);
  return { tradeId, upserted };
}
