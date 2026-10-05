/**
 * Removes exact-duplicate career_fields rows left by the pre-fix seedNonCollegiatePathways (it inserted on
 * every boot; observed 1,564 copies of each of 34 careers, 53k rows, 32 MB on /api/careers).
 * Dry run by default — prints what would go. Pass --apply to delete. Keeps the earliest row per name
 * (lowest sort_order, then id) — the same row /api/careers already serves — and never touches a name with one row.
 * Usage: npx tsx scripts/repair-career-field-duplicates.ts [--apply]
 */
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const apply = process.argv.includes("--apply");
const dupes = await db.execute(sql`
  select name, count(*)::int as copies from career_fields group by name having count(*) > 1 order by copies desc, name`);
const rows = dupes.rows as Array<{ name: string; copies: number }>;
const extra = rows.reduce((n, r) => n + r.copies - 1, 0);
console.log(`${rows.length} career names duplicated; ${extra} surplus rows${apply ? "" : " (dry run — pass --apply to delete)"}`);
for (const r of rows.slice(0, 5)) console.log(`  ${r.name}: ${r.copies} copies`);
if (apply && extra > 0) {
  const result = await db.execute(sql`
    delete from career_fields c using (
      select id, row_number() over (partition by name order by sort_order, id) as rn from career_fields
    ) ranked where ranked.id = c.id and ranked.rn > 1`);
  console.log(`deleted ${result.rowCount} surplus rows`);
}
process.exit(0);
