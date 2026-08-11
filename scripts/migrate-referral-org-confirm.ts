import { db } from "../server/storage";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";

async function migrate() {
  console.log("Running referral org-confirm migration...");

  // Additive, idempotent column adds.
  await db.execute(sql`
    ALTER TABLE referrals ADD COLUMN IF NOT EXISTS org_confirm_token VARCHAR
  `);
  await db.execute(sql`
    ALTER TABLE referrals ADD COLUMN IF NOT EXISTS value_source VARCHAR
  `);

  // Backfill org_confirm_token for existing rows with a random hex token.
  const rows = await db.execute(sql`SELECT id FROM referrals WHERE org_confirm_token IS NULL`);
  const ids: string[] = (rows.rows as Array<{ id: string }>).map((r) => r.id);
  for (const id of ids) {
    const token = randomBytes(16).toString("hex");
    await db.execute(sql`UPDATE referrals SET org_confirm_token = ${token} WHERE id = ${id}`);
  }
  console.log(`✓ Backfilled org_confirm_token for ${ids.length} existing row(s)`);

  // Enforce uniqueness now that all rows have a value.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS referrals_org_confirm_token_uq ON referrals (org_confirm_token)
  `);

  console.log("✓ Migration complete: org_confirm_token, value_source columns ready");
  process.exit(0);
}
migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
