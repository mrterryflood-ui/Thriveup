import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../server/storage";

async function migrate() {
  const migrationPath = resolve(
    process.cwd(),
    "migrations/20260908_organization_members_composite_key_repair.sql",
  );
  await db.execute(sql.raw(readFileSync(migrationPath, "utf8")));
  console.log("✓ Organization-members composite parent key repair applied");
}

migrate().catch((error) => {
  console.error("Organization-members composite key repair failed:", error);
  process.exit(1);
});