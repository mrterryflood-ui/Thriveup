import type { Express } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./storage";
import { grantAlerts, grantOpportunities } from "@shared/schema";
import { gppLifecycleSchema, type GppLifecycleChange, type GppLifecycleEvent } from "@shared/grant-lifecycle";
import { recordInboundVerification, verifyInboundPayload, type FieldRejection } from "./inbound-verification";

const TYPE = "gpp_catalogue_lifecycle";

// Catalogue-wide lifecycle authority: the dedicated callback key when present,
// otherwise the partner-issued THRIVEUP_API_KEY already provisioned to GPP.
// Deliberately NOT the shared ingest fallbacks (THRIVEUP_INGEST/INBOUND).
function lifecycleKeys(): string[] {
  return [process.env.THRIVEUP_CALLBACK_API_KEY, process.env.THRIVEUP_API_KEY]
    .map(value => value?.trim()).filter((value): value is string => Boolean(value));
}
function keysMatch(supplied: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  const candidate = digest(supplied);
  return lifecycleKeys().some(key => timingSafeEqual(candidate, digest(key)));
}

async function resolveGrantId(change: GppLifecycleChange): Promise<string | null> {
  if (change.grantId) {
    const [row] = await db.select({ id: grantOpportunities.id }).from(grantOpportunities).where(eq(grantOpportunities.id, change.grantId)).limit(1);
    return row?.id ?? null;
  }
  const external = change.externalId!;
  const [row] = await db.select({ id: grantOpportunities.id }).from(grantOpportunities).where(
    sql`${grantOpportunities.samgovNoticeId} = ${external} or ${grantOpportunities.samgovId} = ${external}
      or ${grantOpportunities.sourceUrl} = ${external} or ${grantOpportunities.discoveryUrl} = ${external}
      or ${grantOpportunities.sourceUrl} = ${change.sourceUrl} or ${grantOpportunities.discoveryUrl} = ${change.sourceUrl}`,
  ).limit(1);
  return row?.id ?? null;
}

export async function applyGppLifecycleEvent(event: GppLifecycleEvent) {
  return db.transaction(async tx => {
    // Serialize event admission, including first deliveries/retries across pods.
    await tx.execute(sql`select pg_advisory_xact_lock(47119639)`);
    // Deterministic per-change identity: re-sends of a known change are no-ops,
    // so batch composition may change as GPP's retired set grows.
    let changed = 0; let skipped = 0;
    for (const change of event.changes) {
      const grantId = await resolveGrantId(change);
      if (!grantId) throw new Error(`Unknown opportunity identity (${change.grantId ?? change.externalId}); nothing changed`);
      const stamp = new Date(change.sourceTimestamp);
      if (stamp.getTime() > Date.now() + 300_000) throw new Error("Future source timestamp; nothing changed");
      const [last] = await tx.select({ message: grantAlerts.message }).from(grantAlerts)
        .where(and(eq(grantAlerts.alertType, TYPE), eq(grantAlerts.grantId, grantId)))
        .orderBy(desc(sql`(${grantAlerts.message}::jsonb->>'sourceTimestamp')::timestamptz`)).limit(1);
      if (last) {
        const prior = JSON.parse(last.message || "{}");
        const priorStamp = new Date(prior.sourceTimestamp).getTime();
        if (priorStamp === stamp.getTime() && prior.status === change.status) { skipped++; continue; }
        if (priorStamp >= stamp.getTime()) throw new Error("Superseded source event; nothing changed");
      }
      if (change.status === "reopened" && (!change.deadline || new Date(change.deadline).getTime() <= Date.now())) {
        throw new Error("Reopening requires a future issuer deadline; nothing changed");
      }
      // Issuer/catalogue state is separate from organization pursuit history.
      const [current] = await tx.select({ status: grantOpportunities.status }).from(grantOpportunities).where(eq(grantOpportunities.id, grantId)).for("update");
      if (current && ["identified", "open", "active", "new", "tracking", "expired", "cancelled"].includes(current.status ?? "identified")) {
        await tx.update(grantOpportunities).set({
          status: change.status === "reopened" ? "identified" : change.status,
          ...(change.status === "reopened" ? { deadline: new Date(change.deadline!), deadlineType: "fixed_timestamp" } : {}),
          updatedAt: new Date(),
        }).where(eq(grantOpportunities.id, grantId));
      }
      await tx.insert(grantAlerts).values({
        grantId, alertType: TYPE,
        title: `GPP reported source opportunity ${change.status}`,
        message: JSON.stringify({ ...change, grantId }), isRead: true, createdAt: new Date(),
      });
      changed++;
    }
    await tx.insert(grantAlerts).values({
      id: `gpp-lifecycle:${event.eventId}`, grantId: "__gpp_lifecycle__", alertType: "gpp_lifecycle_batch",
      title: "GPP catalogue lifecycle event applied",
      message: JSON.stringify({ contractVersion: event.contractVersion, eventId: event.eventId, changes: event.changes.length, changed, skipped }),
      isRead: true, createdAt: new Date(),
    }).onConflictDoNothing();
    return { accepted: true, duplicate: changed === 0 && skipped > 0, changed, skipped, receiptId: `gpp-lifecycle:${event.eventId}` };
  });
}

export function registerGppLifecycleCallback(app: Express) {
  const endpoint = "/api/inbound/grantpathpro/opportunity-lifecycle";
  app.post(endpoint, (req, res, next) => {
    if (!lifecycleKeys().length) {
      res.status(503).json({ error: "No GPP callback credential is configured; no catalogue changes accepted" });
      return;
    }
    const supplied = req.header("x-api-key")?.trim();
    if (!supplied || !keysMatch(supplied)) {
      res.status(401).json({ error: "Invalid GrantPathPro lifecycle key" });
      return;
    }
    next();
  }, async (req, res) => {
    const parsed = gppLifecycleSchema.safeParse(req.body);
    if (!parsed.success) {
      const rejections: FieldRejection[] = parsed.error.issues.map(issue => ({
        field: issue.path.join("."), reason: "schema_rejection", receivedValue: "[not retained]",
        expected: issue.message, blocking: true,
      }));
      await recordInboundVerification("grantpathpro", endpoint, rejections);
      return res.status(400).json({ accepted: false, corrections: rejections.map(({ field, expected }) => ({ field, expected })) });
    }
    // Shared inbound verification plus strict nested contract; no raw body
    // reaches storage. URLs/deadlines/statuses remain source-reported evidence.
    for (const change of parsed.data.changes) {
      const checked = verifyInboundPayload(change, {
        status: { type: "enum", required: true, enum: ["expired", "cancelled", "reopened"] },
        sourceTimestamp: { type: "string", required: true, maxLength: 100 },
        sourceUrl: { type: "url", required: true, maxLength: 1000 },
      });
      if (checked.rejections.length) {
        await recordInboundVerification("grantpathpro", endpoint, checked.rejections);
        return res.status(400).json({ accepted: false, corrections: checked.rejections });
      }
    }
    try {
      res.json(await applyGppLifecycleEvent(parsed.data));
    } catch (error) {
      console.error("[GPP lifecycle] event rejected:", error);
      res.status(409).json({ accepted: false, error: error instanceof Error ? error.message : "Lifecycle reconciliation failed; no acknowledgement" });
    }
  });
}
