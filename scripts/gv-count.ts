import { db } from "../server/storage";
import { gunViolenceIncidents, gunViolenceImports } from "../shared/schema";
import { sql, desc } from "drizzle-orm";

async function main() {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(gunViolenceIncidents);
  const imports = await db.select().from(gunViolenceImports).orderBy(desc(gunViolenceImports.importedAt)).limit(3);
  console.log("gun_violence_incidents rows:", row.count);
  console.log("recent imports:", JSON.stringify(imports, null, 2));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
