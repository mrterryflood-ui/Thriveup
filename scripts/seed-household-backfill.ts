/**
 * Gap 10 — Household model backfill.
 * Creates a resident_households record for every studentProgress user who has a
 * userId but no matching household yet. Safe to re-run (idempotent).
 *
 * Run: npx tsx scripts/seed-household-backfill.ts
 */

import { db } from "../server/storage";
import { studentProgress, residentHouseholds } from "../shared/schema";
import { isNotNull, notInArray, sql } from "drizzle-orm";

async function backfill() {
  console.log("[household-backfill] Scanning studentProgress for un-housed users...");

  // All student progress records that have a userId
  const allStudents = await db
    .select({ userId: studentProgress.userId, studentName: studentProgress.studentName })
    .from(studentProgress)
    .where(isNotNull(studentProgress.userId));

  if (allStudents.length === 0) {
    console.log("[household-backfill] No studentProgress records with userId found. Done.");
    process.exit(0);
  }

  // All userIds that already have a household
  const existingHouseholds = await db
    .select({ userId: residentHouseholds.userId })
    .from(residentHouseholds);

  const existingUserIds = new Set(existingHouseholds.map(h => h.userId));

  const toCreate = allStudents.filter(s => s.userId && !existingUserIds.has(s.userId));
  console.log(`[household-backfill] ${allStudents.length} students with userId, ${existingUserIds.size} already have households, ${toCreate.length} need backfill.`);

  if (toCreate.length === 0) {
    console.log("[household-backfill] Nothing to backfill. Done.");
    process.exit(0);
  }

  let created = 0;
  let failed = 0;

  for (const student of toCreate) {
    if (!student.userId) continue;
    // Derive a household name from the student name
    const householdName = student.studentName
      ? `${student.studentName}'s Household`
      : "My Household";

    try {
      await db.insert(residentHouseholds).values({
        userId: student.userId,
        householdName,
      });
      created++;
      if (created % 25 === 0) {
        console.log(`[household-backfill] Progress: ${created} created...`);
      }
    } catch (err: any) {
      // Unique constraint violation = already exists (race condition), skip silently
      if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
        continue;
      }
      console.warn(`[household-backfill] Failed for userId=${student.userId}:`, err.message);
      failed++;
    }
  }

  console.log(`\n[household-backfill] Done: ${created} households created, ${failed} failures.`);
  console.log("[household-backfill] Going forward, household creation fires on every new signup via the /api/my-household auto-create route.");
  process.exit(0);
}

backfill().catch(err => {
  console.error("[household-backfill] Fatal:", err);
  process.exit(1);
});
