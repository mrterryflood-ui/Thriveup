import { db } from "../server/storage";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Running referral loop migration...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      screening_id INTEGER,
      program_code TEXT NOT NULL,
      org_name TEXT NOT NULL,
      org_id TEXT,
      client_display_name TEXT,
      client_phone TEXT,
      chw_user_id INTEGER,
      status_token TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'sent',
      benefit_value_estimate INTEGER,
      notes TEXT,
      funder_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS org_capacity (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      org_name TEXT NOT NULL,
      program_code TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'open',
      wait_weeks INTEGER,
      note TEXT,
      contact_phone TEXT,
      contact_url TEXT,
      service_zips TEXT[],
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by_partner_key TEXT,
      UNIQUE(org_id, program_code)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS funders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'foundation',
      share_token TEXT UNIQUE,
      linked_org_ids TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("✓ Migration complete: referrals, org_capacity, funders tables ready");
  process.exit(0);
}
migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
