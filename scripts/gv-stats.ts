/**
 * Quick stats query on gun_violence_incidents — shows what we have in DB.
 */
import { db } from "../server/storage";
import { gunViolenceIncidents } from "../shared/schema";
import { sql, eq, desc } from "drizzle-orm";

async function main() {
  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(gunViolenceIncidents);
  console.log(`\nTotal incidents in DB: ${total.count}`);

  // Top 15 states
  const byState = await db
    .select({ state: gunViolenceIncidents.state, count: sql<number>`count(*)::int`, victims: sql<number>`sum(victim_count)::int`, fatal: sql<number>`sum(fatal_count)::int` })
    .from(gunViolenceIncidents)
    .groupBy(gunViolenceIncidents.state)
    .orderBy(sql`count(*) desc`)
    .limit(15);
  console.log("\nTop states:");
  byState.forEach(r => console.log(`  ${r.state?.padEnd(5)} incidents=${r.count}  victims=${r.victims}  fatal=${r.fatal}`));

  // Chicago-specific
  const [chicago] = await db
    .select({ count: sql<number>`count(*)::int`, victims: sql<number>`sum(victim_count)::int`, fatal: sql<number>`sum(fatal_count)::int` })
    .from(gunViolenceIncidents)
    .where(eq(gunViolenceIncidents.city, "Chicago"));
  console.log(`\nChicago: incidents=${chicago.count} victims=${chicago.victims} fatal=${chicago.fatal}`);

  // Date range
  const [dateRange] = await db
    .select({ earliest: sql<string>`min(occurred_at)::text`, latest: sql<string>`max(occurred_at)::text` })
    .from(gunViolenceIncidents);
  console.log(`\nDate range: ${dateRange.earliest} → ${dateRange.latest}`);

  // Incident types
  const byType = await db
    .select({ type: gunViolenceIncidents.incidentType, count: sql<number>`count(*)::int` })
    .from(gunViolenceIncidents)
    .groupBy(gunViolenceIncidents.incidentType)
    .orderBy(sql`count(*) desc`)
    .limit(10);
  console.log("\nIncident types:");
  byType.forEach(r => console.log(`  ${(r.type||'unknown').padEnd(20)} ${r.count}`));

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
