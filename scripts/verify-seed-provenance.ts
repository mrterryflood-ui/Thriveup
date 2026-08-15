/**
 * Verifies provenance disclosure for known hand-authored illustrative/example
 * seed rows, so a future change can't silently strip the disclosure and let a
 * fabricated row look like an unmarked verified fact.
 *
 * Two check styles, matched to how each table can be safely audited:
 *
 * 1. `dataSourceNotNull` — for tables where every legitimate insert path
 *    (real or seeded) always populates a `data_source`/`source` text column,
 *    so ANY row with a null/empty value is unambiguously a gap. Used for
 *    benefits_enrollment_data, whose only insert paths are two Census
 *    ingest routes (which always set data_source) and one demo seed.
 *
 * 2. `knownSeedIdsFlagged` — for tables that also accept real user-facing
 *    inserts (facilitator profiles, session plans, outcome tracking, etc.),
 *    where a real admin-entered row legitimately has is_demo_data=false and
 *    must NOT be flagged as a violation. Instead this checks that the
 *    specific, enumerated hand-authored seed ids from server/seed-*.ts still
 *    carry is_demo_data=true — a regression test on the seed backfill, not a
 *    blanket audit of every row in the table.
 *
 * Dynamic discovery (NEW):
 *    At startup this script queries information_schema.columns for every
 *    table in the public schema that has an `is_demo_data` column. Any such
 *    table that is NOT already covered by a `knownSeedIdsFlagged` entry in
 *    CHECKS is automatically subjected to a "no undisclosed rows" check:
 *    if the table has ANY row where is_demo_data IS NOT TRUE, the check
 *    fails. This catches a brand-new seed table that ships with a disclosure
 *    column but forgets to set isDemoData=true on its INSERT, without
 *    requiring anyone to edit this script's list.
 *
 *    Tables already covered by CHECKS are exempt from the dynamic check
 *    (their known-seed-ids check is already more precise).
 *
 * Exit 0 = all checks pass; exit 1 = at least one gap found.
 */
import { db } from "../server/storage";
import { sql } from "drizzle-orm";

function idList(ids: string[]) {
  return sql.join(ids.map((id) => sql`${id}`), sql`, `);
}

interface DataSourceCheck {
  kind: "dataSourceNotNull";
  table: string;
  column: "data_source" | "source";
}

interface KnownSeedIdsCheck {
  kind: "knownSeedIdsFlagged";
  table: string;
  ids: string[];
}

type TableCheck = DataSourceCheck | KnownSeedIdsCheck;

const OUTCOME_TRACKING_SEED_IDS = [
  "ot-001", "ot-002", "ot-003", "ot-004", "ot-005", "ot-006",
  ...Array.from({ length: 73 }, (_, i) => `oc-${String(i + 1).padStart(3, "0")}`),
];

const CHECKS: TableCheck[] = [
  { kind: "dataSourceNotNull", table: "benefits_enrollment_data", column: "data_source" },
  { kind: "knownSeedIdsFlagged", table: "environmental_strategies", ids: ["es-001", "es-002", "es-003"] },
  { kind: "knownSeedIdsFlagged", table: "dfc_core_measures", ids: ["dcm-001", "dcm-002"] },
  { kind: "knownSeedIdsFlagged", table: "community_readiness_assessments", ids: ["cra-001"] },
  { kind: "knownSeedIdsFlagged", table: "media_campaigns", ids: ["mc-001"] },
  { kind: "knownSeedIdsFlagged", table: "stakeholder_commitments", ids: ["sc-001", "sc-002", "sc-003", "sc-004", "sc-005"] },
  { kind: "knownSeedIdsFlagged", table: "facilitator_profiles", ids: ["fac-001", "fac-002", "fac-003"] },
  { kind: "knownSeedIdsFlagged", table: "session_plans", ids: ["sp-f-001", "sp-f-002", "sp-f-003", "sp-f-004"] },
  { kind: "knownSeedIdsFlagged", table: "curriculum_delivery_logs", ids: ["cdl-001", "cdl-002", "cdl-003"] },
  { kind: "knownSeedIdsFlagged", table: "outcome_tracking", ids: OUTCOME_TRACKING_SEED_IDS },
];

/**
 * Discovers every table in the public schema that has an `is_demo_data`
 * boolean column, returning their DB table names. This is the machine-
 * readable equivalent of reading shared/schema.ts — it reflects what is
 * actually deployed to the DB, so a new migration adding a disclosure column
 * is picked up automatically with no script edits required.
 */
async function discoverIsDemoDataTables(): Promise<string[]> {
  const result = await db.execute(
    sql`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'is_demo_data'
      ORDER BY table_name
    `
  );
  return result.rows.map((r: any) => r.table_name as string);
}

/**
 * Returns the set of table names already covered by an explicit
 * knownSeedIdsFlagged entry in CHECKS. These tables get a more precise
 * per-row regression test and are exempt from the blanket dynamic check.
 */
function alreadyCoveredTables(): Set<string> {
  return new Set(
    CHECKS
      .filter((c): c is KnownSeedIdsCheck => c.kind === "knownSeedIdsFlagged")
      .map((c) => c.table)
  );
}

async function main() {
  let violations = 0;

  // ── Static checks (existing behaviour, unchanged) ──────────────────────
  for (const check of CHECKS) {
    if (check.kind === "dataSourceNotNull") {
      const result = await db.execute(
        sql`SELECT id FROM ${sql.identifier(check.table)} WHERE ${sql.identifier(check.column)} IS NULL OR ${sql.identifier(check.column)} = '' LIMIT 20`
      );
      if (result.rows.length > 0) {
        violations += result.rows.length;
        console.error(
          `[verify-seed-provenance] ${check.table}: ${result.rows.length} row(s) missing ${check.column}. IDs: ${result.rows.map((r: any) => r.id).join(", ")}`
        );
      } else {
        console.log(`[verify-seed-provenance] ${check.table}: OK (all rows disclose ${check.column})`);
      }
      continue;
    }

    // knownSeedIdsFlagged: only check the specific seed ids exist and are
    // flagged. Real rows created through the app's own routes (is_demo_data
    // defaults to false) are never touched by this check.
    const result = await db.execute(
      sql`SELECT id FROM ${sql.identifier(check.table)} WHERE id IN (${idList(check.ids)}) AND is_demo_data IS NOT TRUE`
    );
    const foundIds = new Set(
      (await db.execute(sql`SELECT id FROM ${sql.identifier(check.table)} WHERE id IN (${idList(check.ids)})`)).rows.map((r: any) => r.id)
    );
    const missingIds = check.ids.filter((id) => !foundIds.has(id));

    if (result.rows.length > 0 || missingIds.length > 0) {
      violations += result.rows.length + missingIds.length;
      if (result.rows.length > 0) {
        console.error(
          `[verify-seed-provenance] ${check.table}: ${result.rows.length} known seed row(s) lost their is_demo_data flag. IDs: ${result.rows.map((r: any) => r.id).join(", ")}`
        );
      }
      if (missingIds.length > 0) {
        console.error(`[verify-seed-provenance] ${check.table}: expected seed row(s) not found: ${missingIds.join(", ")}`);
      }
    } else {
      console.log(`[verify-seed-provenance] ${check.table}: OK (known seed rows disclosed)`);
    }
  }

  // ── Dynamic discovery check ────────────────────────────────────────────
  //
  // Query the live DB for every table that has an is_demo_data column.
  // Any table NOT already covered by a knownSeedIdsFlagged entry gets a
  // blanket check: zero rows with is_demo_data IS NOT TRUE are allowed.
  //
  // Why "IS NOT TRUE" (i.e. catches both false AND null):
  //   The column is declared NOT NULL DEFAULT false in all current tables,
  //   so a seed INSERT that omits isDemoData will produce false — not null.
  //   Catching both false and null future-proofs against tables that might
  //   declare the column nullable.
  //
  // Failure scenario: a developer adds a new table (e.g. "prevention_plans")
  // with an is_demo_data boolean column, seeds illustrative rows without
  // setting isDemoData: true, and ships. On next run this script discovers
  // "prevention_plans" is not in alreadyCoveredTables(), queries it, finds
  // rows with is_demo_data = false, and exits 1 with an actionable message
  // telling them to either add the table to CHECKS with explicit seed IDs
  // (preferred) or set isDemoData: true on every seed INSERT.

  const discoveredTables = await discoverIsDemoDataTables();
  const covered = alreadyCoveredTables();
  const uncoveredTables = discoveredTables.filter((t) => !covered.has(t));

  if (uncoveredTables.length > 0) {
    console.log(
      `\n[verify-seed-provenance] Dynamic discovery found ${discoveredTables.length} table(s) with is_demo_data column; ` +
      `${uncoveredTables.length} not covered by explicit CHECKS: ${uncoveredTables.join(", ")}`
    );
  }

  for (const table of uncoveredTables) {
    const result = await db.execute(
      sql`SELECT id FROM ${sql.identifier(table)} WHERE is_demo_data IS NOT TRUE LIMIT 20`
    );
    if (result.rows.length > 0) {
      violations += result.rows.length;
      console.error(
        `[verify-seed-provenance] DYNAMIC: ${table} has ${result.rows.length} row(s) where is_demo_data is not set to true. ` +
        `IDs: ${result.rows.map((r: any) => r.id).join(", ")}. ` +
        `Either add this table to CHECKS in scripts/verify-seed-provenance.ts with its seed IDs, ` +
        `or ensure every seed INSERT sets isDemoData: true.`
      );
    } else {
      const countResult = await db.execute(
        sql`SELECT COUNT(*) AS n FROM ${sql.identifier(table)}`
      );
      const n = Number((countResult.rows[0] as any).n);
      if (n === 0) {
        console.log(`[verify-seed-provenance] DYNAMIC: ${table}: OK (table is empty — no undisclosed rows)`);
      } else {
        console.log(`[verify-seed-provenance] DYNAMIC: ${table}: OK (all ${n} row(s) have is_demo_data = true)`);
      }
    }
  }

  if (violations > 0) {
    console.error(
      `\nSEED PROVENANCE VIOLATION — ${violations} issue(s) across checked table(s).\n` +
        `A known illustrative seed row lost its provenance disclosure, or a real ingest path stopped setting its source field.\n` +
        `For dynamically-discovered tables: add them to CHECKS with explicit seed IDs, or set isDemoData: true on every seed INSERT.`
    );
    process.exit(1);
  }

  console.log("\n[verify-seed-provenance] All checked tables disclose provenance correctly.");
}

main().catch((err) => {
  console.error("[verify-seed-provenance] FAILED:", err);
  process.exit(1);
});
