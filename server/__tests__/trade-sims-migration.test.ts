/**
 * Integration test for the startup migration runner (server/run-migrations.ts).
 *
 * Starts from the PRIOR schema (drops the adaptive-growth columns and the
 * attempt-events table, and clears the migration ledger entry), then runs
 * the supported deployment path — `runMigrations()` — and verifies it
 * recreates all five progress columns, the attempt-events table, and its
 * indexes. Also verifies a second run is a clean no-op (ledger-tracked).
 *
 * Run: npx tsx --test server/__tests__/trade-sims-migration.test.ts
 * NOTE: mutates the connected dev database's adaptive-growth schema (it
 * restores it via the migration itself). Attempt-event rows are dropped.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { runMigrations } from "../run-migrations";

const NEW_COLUMNS = ["solo_passed", "stretch_passed", "mastery_override", "override_note", "weak_concepts"];

async function withClient<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function presentColumns(c: pg.Client): Promise<string[]> {
  const r = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'trade_sims_lesson_progress' AND column_name = ANY($1)`,
    [NEW_COLUMNS],
  );
  return r.rows.map((row) => row.column_name).sort();
}

async function tableExists(c: pg.Client, name: string): Promise<boolean> {
  const r = await c.query(`SELECT to_regclass($1) AS reg`, [`public.${name}`]);
  return r.rows[0].reg !== null;
}

test("deployment path upgrades a prior-schema database and is idempotent", async () => {
  // 1. Simulate a deployed database that never received the new schema.
  await withClient(async (c) => {
    await c.query(`DROP TABLE IF EXISTS trade_sims_attempt_events`);
    await c.query(
      `ALTER TABLE trade_sims_lesson_progress
         DROP COLUMN IF EXISTS solo_passed,
         DROP COLUMN IF EXISTS stretch_passed,
         DROP COLUMN IF EXISTS mastery_override,
         DROP COLUMN IF EXISTS override_note,
         DROP COLUMN IF EXISTS weak_concepts`,
    );
    await c.query(`DELETE FROM schema_migrations WHERE filename LIKE '%trade-sims-adaptive-growth%'`).catch(() => {});
    assert.deepEqual(await presentColumns(c), []);
    assert.equal(await tableExists(c, "trade_sims_attempt_events"), false);
  });

  // 2. Run the supported deployment command (same call the server boot makes).
  await runMigrations();

  // 3. Verify every schema element exists.
  await withClient(async (c) => {
    assert.deepEqual(await presentColumns(c), [...NEW_COLUMNS].sort());
    assert.equal(await tableExists(c, "trade_sims_attempt_events"), true);
    const idx = await c.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'trade_sims_attempt_events'`);
    const names = idx.rows.map((r) => r.indexname);
    assert.ok(names.includes("idx_trade_sims_attempts_user_lesson"));
    assert.ok(names.includes("idx_trade_sims_attempts_anon_lesson"));
    const ledger = await c.query(`SELECT filename FROM schema_migrations WHERE filename LIKE '%trade-sims-adaptive-growth%'`);
    assert.equal(ledger.rowCount, 1);
  });

  // 4. Second run must be a clean no-op.
  await runMigrations();
  await withClient(async (c) => {
    assert.deepEqual(await presentColumns(c), [...NEW_COLUMNS].sort());
  });
});
