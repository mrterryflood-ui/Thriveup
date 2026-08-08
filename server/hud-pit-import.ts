/**
 * Shared parser/upserter for the official HUD "PIT Counts by CoC" workbook.
 * Used by scripts/import-hud-pit.ts (CLI) and the admin refresh endpoint.
 *
 * Integrity rules (non-negotiable):
 *  - Only values present in the official file are stored — no estimation.
 *  - All-or-nothing transaction: one malformed row aborts the whole run.
 *  - Source provenance recorded on every row.
 */
import * as XLSX from "xlsx";
import { db } from "./storage";
import { hudPitCounts } from "@shared/schema";
import { sql } from "drizzle-orm";

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw new Error(`non-whole-number value: ${String(v)}`);
  return n;
}

export function parseHudPitWorkbook(buffer: Buffer, sourceLabel: string) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const rowsToInsert: Array<typeof hudPitCounts.$inferInsert> = [];

  for (const sheetName of wb.SheetNames) {
    const year = Number(sheetName.trim());
    if (!Number.isInteger(year) || year < 2007 || year > 2035) continue;
    const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    const header = (rows[0] ?? []).map((h) => String(h ?? ""));
    const col = (base: string) => {
      let i = header.indexOf(base);
      if (i < 0) i = header.indexOf(`${base}, ${year}`);
      return i;
    };
    const cOverall = col("Overall Homeless");
    const cYouth = col("Overall Homeless Unaccompanied Youth (Under 25)");
    const cUnshel = col("Unsheltered Homeless");
    if (cOverall < 0) throw new Error(`${sheetName}: cannot locate Overall Homeless column`);

    const seen = new Set<string>();
    for (const r of rows.slice(1)) {
      const coc = String(r[0] ?? "").trim();
      if (!/^[A-Z]{2}-\d{3}/.test(coc)) {
        // Permitted non-data rows: blank spacers, the national "Total" row, and
        // long footnote paragraphs. Anything else with a count value in the
        // Overall column is a malformed data row — abort, never silently drop.
        const isTotal = coc.toLowerCase() === "total" || String(r[1] ?? "").trim().toLowerCase() === "total";
        const isBlank = !coc && r.every((c) => c === null || c === undefined || c === "");
        const isFootnote = coc.length > 40; // footnotes are paragraph-length text in col 0
        if (!isTotal && !isBlank && !isFootnote && r[cOverall] !== undefined && r[cOverall] !== null && r[cOverall] !== "") {
          throw new Error(`${sheetName}: unexpected row with data but unrecognized CoC label: "${coc.slice(0, 60)}"`);
        }
        continue;
      }
      const key = `${coc.slice(0, 6)}:${year}`;
      if (seen.has(key)) throw new Error(`${sheetName}: duplicate CoC row ${coc.slice(0, 6)}`);
      seen.add(key);
      rowsToInsert.push({
        cocNumber: coc.slice(0, 6),
        cocName: String(r[1] ?? "").trim().slice(0, 300) || "(unnamed in source)",
        state: coc.slice(0, 2),
        year,
        overallHomeless: intOrNull(r[cOverall]),
        unaccompaniedYouthUnder25: cYouth >= 0 ? intOrNull(r[cYouth]) : null,
        unshelteredHomeless: cUnshel >= 0 ? intOrNull(r[cUnshel]) : null,
        source: sourceLabel,
      });
    }
  }
  if (rowsToInsert.length === 0) throw new Error("no CoC rows found — is this the official HUD PIT-by-CoC workbook?");
  return rowsToInsert;
}

export async function upsertHudPitRows(rowsToInsert: Array<typeof hudPitCounts.$inferInsert>) {
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
  return rowsToInsert.length;
}
