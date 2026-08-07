/**
 * Import the official HUD "2007-2024 PIT Counts by CoC" workbook (XLSB) into
 * hud_pit_counts — every CoC nationwide, every year present in the file.
 *
 * Source (official, downloaded 2026-08-07):
 *   https://www.huduser.gov/portal/sites/default/files/xls/2007-2024-PIT-Counts-by-CoC.xlsb
 *
 * All-or-nothing: any malformed row aborts the whole run. No estimation,
 * no interpolation — only values present in the official file are stored.
 *
 * Usage: npx tsx scripts/import-hud-pit.ts /tmp/pit-by-coc.xlsb
 */
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { db } from "../server/storage";
import { hudPitCounts } from "../shared/schema";
import { sql } from "drizzle-orm";

const SOURCE = "huduser.gov 2007-2024-PIT-Counts-by-CoC.xlsb (official HUD AHAR companion file)";

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw new Error(`non-whole-number value: ${String(v)}`);
  return n;
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: npx tsx scripts/import-hud-pit.ts <xlsb path>");
  const wb = XLSX.read(readFileSync(file), { type: "buffer" });
  const rowsToInsert: Array<typeof hudPitCounts.$inferInsert> = [];

  for (const sheetName of wb.SheetNames) {
    const year = Number(sheetName.trim());
    if (!Number.isInteger(year) || year < 2007 || year > 2030) continue;
    const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    const header = (rows[0] ?? []).map((h) => String(h ?? ""));
    const iOverall = header.indexOf("Overall Homeless");
    const iYouth = header.indexOf("Overall Homeless Unaccompanied Youth (Under 25)"); // absent pre-2015
    const iUnshel = header.indexOf("Unsheltered Homeless");
    if (iOverall < 0) {
      // some early sheets suffix the year, e.g. "Overall Homeless, 2007"
      const alt = header.findIndex((h) => h === `Overall Homeless, ${year}`);
      if (alt < 0) throw new Error(`${sheetName}: cannot locate Overall Homeless column`);
    }
    const col = (base: string) => {
      let i = header.indexOf(base);
      if (i < 0) i = header.indexOf(`${base}, ${year}`);
      return i;
    };
    const cOverall = col("Overall Homeless");
    const cYouth = col("Overall Homeless Unaccompanied Youth (Under 25)");
    const cUnshel = col("Unsheltered Homeless");

    for (const r of rows.slice(1)) {
      const coc = String(r[0] ?? "").trim();
      if (!/^[A-Z]{2}-\d{3}/.test(coc)) continue; // skip Total + footnote rows
      rowsToInsert.push({
        cocNumber: coc.slice(0, 6),
        cocName: String(r[1] ?? "").trim().slice(0, 300) || "(unnamed in source)",
        state: coc.slice(0, 2),
        year,
        overallHomeless: cOverall >= 0 ? intOrNull(r[cOverall]) : null,
        unaccompaniedYouthUnder25: cYouth >= 0 ? intOrNull(r[cYouth]) : null,
        unshelteredHomeless: cUnshel >= 0 ? intOrNull(r[cUnshel]) : null,
        source: SOURCE,
      });
    }
  }

  console.log(`parsed ${rowsToInsert.length} CoC-year rows; upserting transactionally…`);
  await db.transaction(async (tx) => {
    const chunk = 500;
    for (let i = 0; i < rowsToInsert.length; i += chunk) {
      await tx
        .insert(hudPitCounts)
        .values(rowsToInsert.slice(i, i + chunk))
        .onConflictDoUpdate({
          target: [hudPitCounts.cocNumber, hudPitCounts.year],
          set: {
            cocName: sql`excluded.coc_name`,
            overallHomeless: sql`excluded.overall_homeless`,
            unaccompaniedYouthUnder25: sql`excluded.unaccompanied_youth_under_25`,
            unshelteredHomeless: sql`excluded.unsheltered_homeless`,
            source: sql`excluded.source`,
            importedAt: sql`now()`,
          },
        });
    }
  });
  const [{ count }] = (await db.execute(sql`SELECT count(*)::int AS count FROM hud_pit_counts`)).rows as any[];
  console.log(`done — hud_pit_counts now holds ${count} rows.`);
  process.exit(0);
}

main().catch((e) => { console.error("IMPORT FAILED (nothing committed):", e.message); process.exit(1); });
