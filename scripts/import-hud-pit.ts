/**
 * CLI import of the official HUD "PIT Counts by CoC" workbook (XLSB/XLSX)
 * into hud_pit_counts — every CoC nationwide, every year in the file.
 *
 * Official source: https://www.huduser.gov/portal/datasets/ahar.html
 * (AHAR Part 1 companion file, e.g. 2007-2024-PIT-Counts-by-CoC.xlsb)
 *
 * Usage: npx tsx scripts/import-hud-pit.ts <path-to-downloaded-file>
 */
import { readFileSync } from "node:fs";
import { parseHudPitWorkbook, upsertHudPitRows } from "../server/hud-pit-import";
import { db } from "../server/storage";
import { sql } from "drizzle-orm";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: npx tsx scripts/import-hud-pit.ts <xlsb/xlsx path>");
  const fileName = file.split("/").pop()!;
  const rows = parseHudPitWorkbook(readFileSync(file), `huduser.gov ${fileName} (official HUD AHAR companion file)`);
  console.log(`parsed ${rows.length} CoC-year rows; upserting transactionally…`);
  await upsertHudPitRows(rows);
  const [{ count }] = (await db.execute(sql`SELECT count(*)::int AS count FROM hud_pit_counts`)).rows as any[];
  console.log(`done — hud_pit_counts now holds ${count} rows.`);
  process.exit(0);
}

main().catch((e) => { console.error("IMPORT FAILED (nothing committed):", e.message); process.exit(1); });
