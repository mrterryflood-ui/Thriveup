import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./storage";
import { grantAlerts, grantOpportunities } from "@shared/schema";

export const LIFECYCLE_SENTINEL = "__grant_lifecycle__";
const ALERT_TYPE = "opportunity_expiry_receipt";
const INACTIVE = ["expired", "dismissed", "cancelled", "closed", "superseded_duplicate", "discontinued_invitation_only", "declined", "not_pursuing", "not_pursued", "withdrawn", "submitted", "applied", "awarded", "won", "lost"];

// Date-only legacy deadlines remain current through their recorded UTC day.
// Explicit timestamp precision (or a non-midnight time) expires at its instant.
// Undated/rolling records are not aged out. A past known fixed deadline is
// hidden immediately, even between a source import and the nightly sweep.
export function passedGrantDeadline() {
  return sql`${grantOpportunities.deadline} is not null
    and (case when ${grantOpportunities.deadlineType} = 'fixed_timestamp'
      or ${grantOpportunities.deadline}::time <> time '00:00:00'
      then ${grantOpportunities.deadline} <= (now() at time zone 'UTC')
      else ${grantOpportunities.deadline}::date < (now() at time zone 'UTC')::date end)
    and coalesce(${grantOpportunities.deadlineType}, 'unknown') not in ('rolling','ongoing')`;
}

export function retirableGrantCondition() {
  return and(passedGrantDeadline(), sql`coalesce(${grantOpportunities.status},'identified') in ('identified','tracking','new','open','active')`);
}

export function activeGrantCondition() {
  return sql`coalesce(${grantOpportunities.status},'identified') not in (${sql.join(INACTIVE.map(value => sql`${value}`), sql`, `)})
    and not (${passedGrantDeadline()})
    and lower(coalesce(${grantOpportunities.source},'')) not like '%usaspending%'
    and coalesce((select a.message::jsonb->>'status' from grant_alerts a
      where a.grant_id = ${grantOpportunities.id} and a.alert_type = 'gpp_catalogue_lifecycle'
      order by (a.message::jsonb->>'sourceTimestamp')::timestamptz desc limit 1), 'reopened') = 'reopened'`;
}

export async function getGrantLifecycleReceipt() {
  const [receipt] = await db.select({ id: grantAlerts.id, completedAt: grantAlerts.createdAt, message: grantAlerts.message })
    .from(grantAlerts).where(and(eq(grantAlerts.alertType, ALERT_TYPE), eq(grantAlerts.grantId, LIFECYCLE_SENTINEL)))
    .orderBy(desc(grantAlerts.createdAt)).limit(1);
  if (!receipt) return null;
  const data = JSON.parse(receipt.message || "{}") as { retired?: unknown };
  if (!Number.isInteger(data.retired) || Number(data.retired) < 0) throw new Error("Invalid opportunity lifecycle receipt");
  return { id: receipt.id, completedAt: receipt.completedAt?.toISOString() ?? null, retired: Number(data.retired) };
}

/** One atomic status-only retirement and receipt, serialized across processes.
 * No corpus, entity tracking, proposal or award-history row is deleted. */
export async function reconcileGrantExpiry(force = false) {
  return db.transaction(async tx => {
    const lock = await tx.execute(sql`select pg_try_advisory_xact_lock(47119638) as acquired`);
    if (!(lock.rows[0] as { acquired?: boolean })?.acquired) return { skipped: true, reason: "already_running" };
    if (!force) {
      const [already] = await tx.select({ id: grantAlerts.id }).from(grantAlerts).where(and(
        eq(grantAlerts.alertType, ALERT_TYPE), eq(grantAlerts.grantId, LIFECYCLE_SENTINEL),
        sql`${grantAlerts.createdAt} >= date_trunc('day',now() at time zone 'UTC')
          and ${grantAlerts.createdAt} < date_trunc('day',now() at time zone 'UTC') + interval '1 day'`,
      )).limit(1);
      if (already) return { skipped: true, reason: "already_completed_today" };
    }
    const retired = await tx.update(grantOpportunities).set({ status: "expired", updatedAt: new Date() })
      .where(retirableGrantCondition())
      .returning({ id: grantOpportunities.id });
    const [receipt] = await tx.insert(grantAlerts).values({
      grantId: LIFECYCLE_SENTINEL, alertType: ALERT_TYPE,
      title: "Opportunity expiry reconciliation completed",
      message: JSON.stringify({ retired: retired.length, historyPreserved: true, policy: "UTC day for date-only; instant for timestamp precision; no undated age cutoff", gppExecution: "not_verified_by_this_local_receipt" }),
      isRead: true, createdAt: new Date(),
    }).returning({ id: grantAlerts.id });
    return { skipped: false, retired: retired.length, receiptId: receipt.id };
  });
}

/** Catch up on boot; nightly 00:45 UTC follows GPP's 00:30 UTC retirement.
 * This cadence is coordination, not evidence that GPP ran or delivered events. */
export function startGrantLifecycleScheduler() {
  const run = () => void (async () => {
    // Same index is declared in the schema for deployment congruence.
    await db.execute(sql`create index if not exists grant_alerts_lifecycle_lookup_idx on grant_alerts(grant_id,alert_type,created_at)`);
    await reconcileGrantExpiry();
  })().catch(error => console.error("[GrantLifecycle] expiry reconciliation failed; no success receipt:", error));
  run();
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(0, 45, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const timer = setTimeout(() => {
    run();
    setInterval(run, 24 * 60 * 60 * 1000).unref();
  }, next.getTime() - now.getTime());
  timer.unref();
}