/**
 * Verifies that content seeds are idempotent: running them again must not
 * change row counts (content upserts in place, never duplicates).
 * Exit 0 = idempotent; exit 1 = violation or error.
 */
import { db } from "../server/storage";
import { sql } from "drizzle-orm";
import { seedAILevels } from "../server/seed-ai";
import { seedWorkforceLessons } from "../server/seed-workforce-lessons";

async function counts() {
  const r = await db.execute(sql`SELECT
    (SELECT count(*)::int FROM lessons) AS lessons,
    (SELECT count(*)::int FROM quiz_questions) AS quiz_questions,
    (SELECT count(*)::int FROM badges) AS badges,
    (SELECT count(*)::int FROM modules) AS modules,
    (SELECT count(*)::int FROM levels) AS levels`);
  return JSON.stringify(r.rows[0]);
}

async function main() {
  const before = await counts();
  await seedAILevels(db);
  await seedWorkforceLessons(db);
  const after = await counts();
  console.log("before:", before);
  console.log("after :", after);
  if (before !== after) {
    console.error("SEED IDEMPOTENCY VIOLATION — reseeding changed row counts");
    process.exit(1);
  }
  console.log("OK: seeds are idempotent");
  process.exit(0);
}
main().catch((e) => { console.error("SEED TEST ERROR:", e.message); process.exit(1); });
