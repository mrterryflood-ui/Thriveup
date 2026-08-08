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

export async function runMigrations(): Promise<void> {
  const dir = path.resolve(process.cwd(), "migrations");
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) return;

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
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
    await client.end();
  }
}
