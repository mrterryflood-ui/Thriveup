/**
 * Startup migration runner — the single deploy path that applies committed
 * SQL migrations in `migrations/` to whatever database the app boots
 * against (dev and production alike).
 *
 * Why this exists: the project syncs dev schema with `drizzle-kit push`,
 * but nothing ever ran DDL against an existing/production database at
 * deploy time. This runner executes each `migrations/*.sql` file exactly
 * once (tracked in `schema_migrations`), in filename order, inside a
 * transaction. Migration files are written delta-only and idempotent
 * (IF NOT EXISTS guards), so running them against a database that already
 * received the same schema via push is a safe no-op.
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { DEFAULT_DB_CONNECTION_TIMEOUT_MS } from "./db-connection-timeout";

function envTimeout(name: string, fallbackMs: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

export async function runMigrations(): Promise<void> {
  const candidateDirs = [
    path.resolve(process.cwd(), "migrations"),
    path.resolve(process.cwd(), "dist/migrations"),
  ];
  const dir = candidateDirs.find((candidate) => fs.existsSync(candidate)
    && fs.readdirSync(candidate).some((file) => file.endsWith(".sql")));
  if (!dir) return;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) return;

  const connectionTimeoutMs = envTimeout("DB_CONNECTION_TIMEOUT_MS", DEFAULT_DB_CONNECTION_TIMEOUT_MS);
  const queryTimeoutMs = envTimeout("DB_MIGRATION_QUERY_TIMEOUT_MS", 60_000);
  const lockTimeoutMs = envTimeout("DB_MIGRATION_LOCK_TIMEOUT_MS", 120_000);
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: connectionTimeoutMs,
    query_timeout: queryTimeoutMs,
    statement_timeout: queryTimeoutMs,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    application_name: "thriveup-startup-migrations",
  });
  let migrationLockHeld = false;
  try {
    await client.connect();
    const baseline = await client.query<{ organizations: string | null; users: string | null }>(
      "SELECT to_regclass('public.organizations') AS organizations, to_regclass('public.users') AS users",
    );
    if (!baseline.rows[0]?.organizations || !baseline.rows[0]?.users) {
      throw new Error(
        "[migrations] incomplete baseline application schema detected; provision both organizations and users before applying delta migrations",
      );
    }
    const lockStartedAt = Date.now();
    while (!migrationLockHeld) {
      const lockResult = await client.query<{ acquired: boolean }>(
        "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
        ["thriveup:schema-migrations"],
      );
      migrationLockHeld = lockResult.rows[0]?.acquired === true;
      if (migrationLockHeld) break;
      if (Date.now() - lockStartedAt >= lockTimeoutMs) {
        throw new Error(`[migrations] timed out after ${lockTimeoutMs}ms waiting for the schema migration lock`);
      }
      const remainingMs = lockTimeoutMs - (Date.now() - lockStartedAt);
      await new Promise((resolve) => setTimeout(resolve, Math.min(250, Math.max(1, remainingMs))));
    }
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    for (const file of files) {
      const already = await client.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
      if ((already.rowCount ?? 0) > 0) continue;
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        for (const stmt of sql.split("--> statement-breakpoint")) {
          if (stmt.trim().length > 0) await client.query(stmt);
        }
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`[migrations] applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        // Fail loudly — booting with a missing schema would surface as
        // confusing runtime SQL errors on user requests instead.
        throw new Error(`[migrations] ${file} failed: ${(err as Error).message}`);
      }
    }
  } finally {
    if (migrationLockHeld) {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", ["thriveup:schema-migrations"]).catch((err) => {
        console.error("[migrations] advisory lock release failed:", err instanceof Error ? err.message : String(err));
      });
    }
    await client.end().catch((err) => {
      console.error("[migrations] database connection close failed:", err instanceof Error ? err.message : String(err));
    });
  }
}
