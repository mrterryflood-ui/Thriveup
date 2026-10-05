import type { Express, RequestHandler } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./storage";
import { grantAlerts, grantOpportunities } from "@shared/schema";
import { gppLifecycleSchema, type GppLifecycleEvent } from "@shared/grant-lifecycle";
import { recordInboundVerification, verifyInboundPayload, type FieldRejection } from "./inbound-verification";

const TYPE = "gpp_catalogue_lifecycle";
export async function applyGppLifecycleEvent(event: GppLifecycleEvent) {
  const changes = [...event.changes].sort((a, b) => a.grantId.localeCompare(b.grantId));
  const canonical = JSON.stringify({ contractVersion: event.contractVersion, eventId: event.eventId, changes });
  return db.transaction(async tx => {
    // Serialize event admission, including first deliveries/retries across pods.
    await tx.execute(sql`select pg_advisory_xact_lock(47119639)`);
    const batchId = `gpp-lifecycle:${event.eventId}`;
    const [previous] = await tx.select({ message: grantAlerts.message }).from(grantAlerts).where(eq(grantAlerts.id, batchId));
    if (previous) {
      if (previous.message !== canonical) throw new Error("Event identity was reused with different content");
      return { accepted: true, duplicate: true, changed: 0, receiptId: batchId };
    }
    const records = await tx.select({ id: grantOpportunities.id, status: grantOpportunities.status }).from(grantOpportunities)
      .where(inArray(grantOpportunities.id, changes.map(change => change.grantId))).orderBy(grantOpportunities.id).for("update");
    if (records.length !== changes.length) throw new Error("Unknown canonical opportunity identity; nothing changed");
    for (let index = 0; index < changes.length; index++) {
      const change = changes[index];
      const stamp = new Date(change.sourceTimestamp);
      if (stamp.getTime() > Date.now() + 300_000) throw new Error("Future source timestamp; nothing changed");
      const [last] = await tx.select({ message: grantAlerts.message }).from(grantAlerts)
        .where(and(eq(grantAlerts.alertType, TYPE), eq(grantAlerts.grantId, change.grantId)))
        .orderBy(desc(sql`(${grantAlerts.message}::jsonb->>'sourceTimestamp')::timestamptz`)).limit(1);
      if (last && new Date(JSON.parse(last.message || "{}").sourceTimestamp).getTime() >= stamp.getTime()) {
        throw new Error("Superseded source event; nothing changed");
      }
      if (change.status === "reopened" && (!change.deadline || new Date(change.deadline).getTime() <= Date.now())) {
        throw new Error("Reopening requires a future issuer deadline; nothing changed");
      }
      // Issuer/catalogue state is separate from organization pursuit history.
      // Preserve decided/submitted corpus statuses and all organization rows.
      const current = records.find(record => record.id === change.grantId)!;
      if (["identified", "open", "active", "new", "tracking", "expired", "cancelled"].includes(current.status ?? "identified")) {
        await tx.update(grantOpportunities).set({
          status: change.status === "reopened" ? "identified" : change.status,
          ...(change.status === "reopened" ? { deadline: new Date(change.deadline!), deadlineType: "fixed_timestamp" } : {}),
          updatedAt: new Date(),
        }).where(eq(grantOpportunities.id, change.grantId));
      }
      await tx.insert(grantAlerts).values({
        id: `${batchId}:${index}`, grantId: change.grantId, alertType: TYPE,
        title: `GPP reported source opportunity ${change.status}`,
        message: JSON.stringify(change), isRead: true, createdAt: new Date(),
      });
    }
    await tx.insert(grantAlerts).values({
      id: batchId, grantId: "__gpp_lifecycle__", alertType: "gpp_lifecycle_batch",
      title: "GPP catalogue lifecycle event applied", message: canonical, isRead: true, createdAt: new Date(),
    });
    return { accepted: true, duplicate: false, changed: changes.length, receiptId: batchId };
  });
}

export function registerGppLifecycleCallback(app: Express, authenticate: RequestHandler) {
  const endpoint = "/api/inbound/grantpathpro/opportunity-lifecycle";
  app.post(endpoint, (req, res, next) => {
    // Catalogue-wide authority MUST NOT inherit the shared legacy ingest key.
    if (!process.env.THRIVEUP_CALLBACK_API_KEY?.trim()) {
      res.status(503).json({ error: "Dedicated GPP callback credential is not configured; no catalogue changes accepted" });
      return;
    }
    return authenticate(req, res, next);
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
        grantId: { type: "string", required: true, maxLength: 100 },
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