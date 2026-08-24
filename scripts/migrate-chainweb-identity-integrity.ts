import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../server/storage";

async function migrate() {
  const migrationPath = resolve(process.cwd(), "migrations/20260824_chainweb_identity_integrity.sql");
  const migration = readFileSync(migrationPath, "utf8");
  await db.execute(sql.raw(migration));
  console.log("✓ Chainweb identity and relationship integrity migration applied");
}

migrate().catch((error) => {
  console.error("Chainweb integrity migration failed:", error);
  process.exit(1);
});