import { sql } from "drizzle-orm";
import { db } from "../server/storage";

async function migrate() {
  console.log("[migrate] Creating user_journeys and childcore_county_metrics tables…");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_journeys (
      user_id VARCHAR(255) PRIMARY KEY NOT NULL,
      last_known_geography VARCHAR(20),
      identified_needs JSONB,
      screener_flags JSONB,
      active_referral_ids JSONB,
      yhsi_status VARCHAR(50),
      community_context_at TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS user_journeys_updated_idx ON user_journeys (updated_at)
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS childcore_county_metrics (
      id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid(),
      fips_code VARCHAR(10) NOT NULL,
      county_name VARCHAR(100),
      state_fips VARCHAR(2),
      desert_rate REAL,
      prek_enrollment_rate REAL,
      kindergarten_readiness REAL,
      subsidy_access_rate REAL,
      child_poverty_rate REAL,
      staff_turnover_rate REAL,
      raw_metrics JSONB,
      received_at TIMESTAMP NOT NULL DEFAULT NOW(),
      pushed_by VARCHAR(100) DEFAULT 'childcore'
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS childcore_county_metrics_fips_idx ON childcore_county_metrics (fips_code)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS childcore_county_metrics_received_idx ON childcore_county_metrics (received_at)
  `);
  await db.execute(sql`
    ALTER TABLE yhsi_youth_participants
    ADD COLUMN IF NOT EXISTS county_fips VARCHAR(5)
  `);
  console.log("[migrate] Done.");
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
