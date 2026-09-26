import { sql } from "drizzle-orm";
import { childcoreCountyMetrics } from "@shared/schema";
import { db } from "./storage";

type CountyRow = typeof childcoreCountyMetrics.$inferInsert;

/**
 * The source snapshot guard belongs on the UPDATE, not the conflict target.
 * A date-only flat snapshot and a timestamped legacy snapshot share this
 * latest-per-FIPS row; only an equal or newer source snapshot may replace it.
 */
export function buildChildCORECountyUpsert(
  rows: CountyRow[],
  executor: Pick<typeof db, "insert"> = db,
) {
  return executor.insert(childcoreCountyMetrics)
    .values(rows)
    .onConflictDoUpdate({
      target: childcoreCountyMetrics.fipsCode,
      set: {
        countyName: sql`excluded.county_name`,
        stateFips: sql`excluded.state_fips`,
        desertRate: sql`excluded.desert_rate`,
        prekEnrollmentRate: sql`excluded.prek_enrollment_rate`,
        kindergartenReadiness: sql`excluded.kindergarten_readiness`,
        subsidyAccessRate: sql`excluded.subsidy_access_rate`,
        childPovertyRate: sql`excluded.child_poverty_rate`,
        staffTurnoverRate: sql`excluded.staff_turnover_rate`,
        rawMetrics: sql`excluded.raw_metrics`,
        receivedAt: sql`excluded.received_at`,
        pushedBy: sql`excluded.pushed_by`,
      },
      setWhere: sql`${childcoreCountyMetrics.receivedAt} <= excluded.received_at`,
    })
    .returning({ fipsCode: childcoreCountyMetrics.fipsCode });
}