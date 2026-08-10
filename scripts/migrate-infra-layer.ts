import { db } from "../server/storage";
import { sql } from "drizzle-orm";

async function migrate() {
  await db.execute(sql`ALTER TABLE foster_youth_intakes ADD COLUMN IF NOT EXISTS referred_by text`);
  await db.execute(sql`ALTER TABLE foster_youth_intakes ADD COLUMN IF NOT EXISTS referral_org_id text`);
  await db.execute(sql`ALTER TABLE foster_youth_intakes ADD COLUMN IF NOT EXISTS caseworker_email text`);
  await db.execute(sql`ALTER TABLE foster_youth_intakes ADD COLUMN IF NOT EXISTS outcome_reported_at timestamp`);
  console.log("✓ foster_youth_intakes columns");

  await db.execute(sql`CREATE TABLE IF NOT EXISTS partner_webhooks (
    id serial PRIMARY KEY, partner_key_id text NOT NULL, event text NOT NULL,
    webhook_url text NOT NULL, secret text NOT NULL, active boolean DEFAULT true NOT NULL,
    last_fired_at timestamp, created_at timestamp DEFAULT now() NOT NULL
  )`);
  console.log("✓ partner_webhooks");

  await db.execute(sql`CREATE TABLE IF NOT EXISTS brief_shares (
    id text PRIMARY KEY, location text NOT NULL, brief_data jsonb NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL, expires_at timestamp NOT NULL
  )`);
  console.log("✓ brief_shares");

  await db.execute(sql`CREATE TABLE IF NOT EXISTS brief_subscriptions (
    id serial PRIMARY KEY, partner_key_id text NOT NULL, location text NOT NULL,
    webhook_url text NOT NULL, frequency text DEFAULT 'weekly' NOT NULL,
    active boolean DEFAULT true NOT NULL, last_sent_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
  )`);
  console.log("✓ brief_subscriptions");

  console.log("All migrations complete."); process.exit(0);
}
migrate().catch(e => { console.error(e); process.exit(1); });
