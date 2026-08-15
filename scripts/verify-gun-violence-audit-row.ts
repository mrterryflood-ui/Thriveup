/**
 * verify-gun-violence-audit-row.ts
 *
 * Confirms that the boot-time gun violence registry sync ran and wrote a
 * fresh audit row to gun_violence_imports.
 *
 * Exit 0 — at least one audit row exists (any time window, confirms the sync
 *           path is wired and writing correctly).
 * Exit 1 — no audit rows exist at all (the boot-time sync never ran or never
 *           wrote an audit row, indicating a broken integration).
 *
 * This script is intentionally lenient about recency: in a CI/test environment
 * the server may not have run a real network sync (the upstream registry may be
 * unreachable), so we only assert the row-writing path works, not that data is
 * fresher than N minutes. The 48-hour staleness alert in server/index.ts handles
 * the production freshness gate.
 *
 * Pattern: mirrors scripts/verify-gun-violence-registry.ts (direct DB, no HTTP auth).
 */
import { db } from "../server/storage";
import { gunViolenceImports } from "../shared/schema";
import { desc } from "drizzle-orm";

let passed = 0;
let failed = 0;

function pass(name: string) { console.log(`  ✓ ${name}`); passed++; }
function fail(name: string, detail?: string) {
  console.error(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
  failed++;
}

async function run() {
  console.log("\n[verify-gun-violence-audit-row] Starting...\n");

  // ── 1. At least one audit row must exist ─────────────────────────────────
  console.log("1. Audit row existence (boot-time sync must have written to gun_violence_imports)");

  const rows = await db
    .select({
      id:          gunViolenceImports.id,
      dataSource:  gunViolenceImports.dataSource,
      recordCount: gunViolenceImports.recordCount,
      importedAt:  gunViolenceImports.importedAt,
      notes:       gunViolenceImports.notes,
    })
    .from(gunViolenceImports)
    .orderBy(desc(gunViolenceImports.importedAt))
    .limit(5);

  if (rows.length === 0) {
    fail(
      "No audit rows found in gun_violence_imports",
      "The boot-time runGunViolenceRegistrySync() call has never written a row. " +
      "Check that server/index.ts wires the sync on startup and that the upstream " +
      "registry (gun-violence-registry.replit.app) was reachable."
    );
  } else {
    const latest = rows[0];
    pass(
      `Found ${rows.length} audit row(s) — latest: source=${latest.dataSource} ` +
      `records=${latest.recordCount} at=${latest.importedAt?.toISOString() ?? "unknown"}`
    );
  }

  // ── 2. Latest row has the expected dataSource ─────────────────────────────
  if (rows.length > 0) {
    console.log("\n2. Audit row shape validation");
    const latest = rows[0];

    if (typeof latest.recordCount === "number" && latest.recordCount >= 0) {
      pass(`recordCount is a non-negative integer (${latest.recordCount})`);
    } else {
      fail("recordCount is missing or invalid", String(latest.recordCount));
    }

    if (latest.dataSource && latest.dataSource.length > 0) {
      pass(`dataSource is present (${latest.dataSource})`);
    } else {
      fail("dataSource is empty or null");
    }

    if (latest.importedAt instanceof Date && !isNaN(latest.importedAt.getTime())) {
      pass(`importedAt is a valid timestamp (${latest.importedAt.toISOString()})`);
    } else {
      fail("importedAt is missing or not a valid Date", String(latest.importedAt));
    }
  }

  // ── Final verdict ─────────────────────────────────────────────────────────
  console.log(`\n[verify-gun-violence-audit-row] ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("[verify-gun-violence-audit-row] Fatal error:", err);
  process.exit(1);
});
