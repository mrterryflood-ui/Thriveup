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

async function main() {
  let violations = 0;

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

  if (violations > 0) {
    console.error(
      `\nSEED PROVENANCE VIOLATION — ${violations} issue(s) across ${CHECKS.length} table(s).\n` +
        `A known illustrative seed row lost its provenance disclosure, or a real ingest path stopped setting its source field.`
    );
    process.exit(1);
  }

  console.log("\n[verify-seed-provenance] All checked tables disclose provenance correctly.");
}

main().catch((err) => {
  console.error("[verify-seed-provenance] FAILED:", err);
  process.exit(1);
});
