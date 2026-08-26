import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../server/storage";

async function migrate() {
  const migrationPath = resolve(process.cwd(), "migrations/20260829_studio_manifest_foundation.sql");
  await db.execute(sql.raw(readFileSync(migrationPath, "utf8")));
  console.log("✓ Studio manifest foundation migration applied");
}

migrate().catch((error) => {
  console.error("Studio manifest foundation migration failed:", error);
  process.exit(1);
});