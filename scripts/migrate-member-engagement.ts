/**
 * One-time migration: create Member Health Engagement Engine tables.
 * Run via: npx tsx scripts/migrate-member-engagement.ts
 */
import { db } from "../server/storage";
import { sql } from "drizzle-orm";

const statements = [
  `CREATE TABLE IF NOT EXISTS health_plan_orgs (
    id text PRIMARY KEY,
    name varchar(255) NOT NULL,
    plan_type varchar(50) NOT NULL DEFAULT 'mixed',
    state varchar(2),
    states_served text[] DEFAULT '{}',
    contact_name varchar(255),
    contact_email varchar(255),
    contact_phone varchar(20),
    npi_number varchar(20),
    member_count integer DEFAULT 0,
    hedis_contract_year varchar(4),
    stars_rating_current numeric(3,2),
    stars_target_rating numeric(3,2),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS hedis_measures (
    id text PRIMARY KEY,
    measure_code varchar(10) NOT NULL UNIQUE,
    measure_name varchar(255) NOT NULL,
    category varchar(100) NOT NULL,
    description text,
    clinical_priority integer NOT NULL DEFAULT 3,
    stars_weight numeric(4,2) DEFAULT 1.00,
    gap_definition text,
    closure_criteria text,
    due_date_logic varchar(255),
    eligible_population text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS health_plan_members (
    id text PRIMARY KEY,
    plan_org_id text NOT NULL REFERENCES health_plan_orgs(id),
    member_id varchar(100),
    user_id integer,
    first_name varchar(100),
    last_name varchar(100),
    date_of_birth date,
    gender varchar(30),
    preferred_language varchar(50) DEFAULT 'english',
    email varchar(255),
    phone varchar(20),
    preferred_contact_channel varchar(20) DEFAULT 'email',
    address_line1 varchar(255),
    address_city varchar(100),
    address_state varchar(2),
    address_zip varchar(10),
    pcp_name varchar(255),
    pcp_npi varchar(20),
    plan_enrollment_date date,
    plan_end_date date,
    risk_tier varchar(20) DEFAULT 'low',
    sdoh_score integer,
    sdoh_flags text[] DEFAULT '{}',
    opted_out_at timestamp,
    opted_out_channel varchar(20),
    entry_source varchar(20) NOT NULL DEFAULT 'chw_manual',
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS member_care_gaps (
    id text PRIMARY KEY,
    member_id text NOT NULL REFERENCES health_plan_members(id),
    measure_id text NOT NULL REFERENCES hedis_measures(id),
    measure_code varchar(10) NOT NULL,
    measurement_year integer NOT NULL,
    due_date date,
    priority integer NOT NULL DEFAULT 3,
    status varchar(20) NOT NULL DEFAULT 'open',
    closed_at timestamp,
    closure_method varchar(30),
    closed_by_referral_id text,
    closed_by_user_id integer,
    notes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS member_outreach_campaigns (
    id text PRIMARY KEY,
    plan_org_id text NOT NULL REFERENCES health_plan_orgs(id),
    name varchar(255) NOT NULL,
    description text,
    channel varchar(20) NOT NULL DEFAULT 'email',
    target_measure_codes text[] DEFAULT '{}',
    target_risk_tiers text[] DEFAULT '{}',
    target_zips text[] DEFAULT '{}',
    target_languages text[] DEFAULT '{}',
    message_subject varchar(255),
    message_body text NOT NULL,
    call_to_action varchar(255),
    call_to_action_url text,
    status varchar(20) NOT NULL DEFAULT 'draft',
    scheduled_at timestamp,
    sent_at timestamp,
    created_by_user_id integer,
    total_recipients integer DEFAULT 0,
    total_delivered integer DEFAULT 0,
    total_opened integer DEFAULT 0,
    total_responded integer DEFAULT 0,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS member_outreach_touches (
    id text PRIMARY KEY,
    campaign_id text NOT NULL REFERENCES member_outreach_campaigns(id),
    member_id text NOT NULL REFERENCES health_plan_members(id),
    channel varchar(20) NOT NULL,
    sent_at timestamp,
    delivered_at timestamp,
    opened_at timestamp,
    responded_at timestamp,
    response_type varchar(30),
    bounced boolean DEFAULT false,
    bounced_reason varchar(255),
    external_message_id varchar(255),
    created_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS member_benefit_utilization (
    id text PRIMARY KEY,
    member_id text NOT NULL REFERENCES health_plan_members(id),
    plan_org_id text NOT NULL REFERENCES health_plan_orgs(id),
    benefit_type varchar(50) NOT NULL,
    plan_year integer NOT NULL,
    allowance_usd numeric(10,2),
    utilized_usd numeric(10,2) DEFAULT 0,
    utilization_count integer DEFAULT 0,
    last_utilized_at timestamp,
    benefit_reset_date date,
    notes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS member_chw_engagements (
    id text PRIMARY KEY,
    member_id text NOT NULL REFERENCES health_plan_members(id),
    assigned_to_user_id integer,
    escalation_reason varchar(100) NOT NULL,
    open_care_gap_count integer DEFAULT 0,
    priority integer NOT NULL DEFAULT 3,
    status varchar(20) NOT NULL DEFAULT 'queued',
    chw_notes text,
    contacted_at timestamp,
    resolved_at timestamp,
    resolution_summary text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
];

async function migrate() {
  for (const stmt of statements) {
    const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
    try {
      await db.execute(sql.raw(stmt));
      console.log(`✓ ${tableName}`);
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(`↩ ${tableName} (already exists)`);
      } else {
        console.error(`✗ ${tableName}:`, err.message);
        throw err;
      }
    }
  }
  console.log("[member-engagement] Migration complete — 8 tables ready");
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
