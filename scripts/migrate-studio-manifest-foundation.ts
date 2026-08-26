import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../server/storage";

async function migrate() {
const migrationPaths = [
    "migrations/20260829_studio_manifest_foundation.sql",
    "migrations/20260830_studio_import_and_org_records.sql",
    "migrations/20260831_studio_builder_durability.sql",
  "migrations/20260901_studio_e2e_cleanup_guard.sql",
  ];
  for (const migrationPath of migrationPaths) {
    await db.execute(sql.raw(readFileSync(resolve(process.cwd(), migrationPath), "utf8")));
  }
  console.log("✓ Studio manifest and governed follow-up migrations applied");
}

migrate().catch((error) => {
  console.error("Studio manifest foundation migration failed:", error);
  process.exit(1);
});