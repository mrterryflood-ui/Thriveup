/**
 * Adds navigator_conversation_id and navigator_context columns to referrals.
 * Safe to re-run — uses ADD COLUMN IF NOT EXISTS.
 */
import { sql } from "drizzle-orm";
import { db } from "../server/storage";

async function migrate() {
  console.log("[migrate] Adding navigator context columns to referrals…");
  await db.execute(sql`
    ALTER TABLE referrals
      ADD COLUMN IF NOT EXISTS navigator_conversation_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS navigator_context JSONB
  `);
  console.log("[migrate] Done.");
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
