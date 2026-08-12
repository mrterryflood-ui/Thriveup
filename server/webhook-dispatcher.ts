/**
 * webhook-dispatcher.ts — Shared outbound webhook utility.
 *
 * fireWebhook(event, payload):
 *   - Queries partnerWebhooks for active hooks matching the event.
 *   - For each: POSTs to webhookUrl with JSON body, X-TCAF-Event header,
 *     and X-TCAF-Signature (HMAC-SHA256 of JSON body signed with the row secret).
 *   - Non-blocking: uses Promise.allSettled, caller does NOT await.
 *   - Never throws.  Logs success/failure per hook.
 *   - Payload always receives: event, timestamp (ISO), tcaf_version: "1.0".
 */

import { db } from "./storage";
import { partnerWebhooks, partnerApiKeys } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";

/** Enrich the caller's payload with required envelope fields. */
function buildEnvelope(event: string, payload: object): string {
  const body = {
    ...payload,
    event,
    timestamp: new Date().toISOString(),
    tcaf_version: "1.0",
  };
  return JSON.stringify(body);
}

function hmacSign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverWebhook(
  hook: { id: number; webhookUrl: string; secret: string },
  event: string,
  body: string,
): Promise<void> {
  const signature = hmacSign(hook.secret, body);
  const response = await fetch(hook.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TCAF-Event": event,
      "X-TCAF-Signature": `sha256=${signature}`,
    },
    body,
  });
  if (!response.ok) {
    console.error(
      `[WebhookDispatcher] hook id=${hook.id} event=${event} → HTTP ${response.status} from ${hook.webhookUrl}`,
    );
  } else {
    console.log(
      `[WebhookDispatcher] hook id=${hook.id} event=${event} → delivered (HTTP ${response.status})`,
    );
  }
  // Mark lastFiredAt regardless of success/failure — best effort.
  await db
    .update(partnerWebhooks)
    .set({ lastFiredAt: new Date() })
    .where(eq(partnerWebhooks.id, hook.id))
    .catch((err: unknown) => {
      console.error(`[WebhookDispatcher] Failed to update lastFiredAt for hook id=${hook.id}:`, err);
    });
}

/**
 * Fire all active webhooks registered for `event`.
 * Non-blocking — returns void immediately.  The caller should NOT await this.
 * Never throws.
 */
export function fireWebhook(event: string, payload: object): void {
  const body = buildEnvelope(event, payload);

  // Deliberately not awaited — runs in the background.
  void (async () => {
    try {
      const hooks = await db
        .select({
          id: partnerWebhooks.id,
          webhookUrl: partnerWebhooks.webhookUrl,
          secret: partnerWebhooks.secret,
        })
        .from(partnerWebhooks)
        .where(and(eq(partnerWebhooks.event, event), eq(partnerWebhooks.active, true)));

      // Zero subscribers is a clean no-op: never throws, never error-logs.
      // Log at INFO so operators know webhooks are not yet configured when they
      // see referrals flowing but no partner is being notified automatically.
      if (hooks.length === 0) {
        console.info(
          `[WebhookDispatcher] event=${event} → 0 active subscribers. ` +
          `Referral data is stored and the status URL is live, but no partner ` +
          `endpoint was notified. Register a webhook in the Partner API Hub to ` +
          `enable automatic org notification.`
        );
        return;
      }

      const results = await Promise.allSettled(
        hooks.map((hook) => deliverWebhook(hook, event, body)),
      );
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            `[WebhookDispatcher] hook id=${hooks[i]!.id} event=${event} threw:`,
            r.reason,
          );
        }
      });
    } catch (err: unknown) {
      console.error(`[WebhookDispatcher] Error fetching hooks for event=${event}:`, err);
    }
  })();
}

/**
 * Fire webhooks for `event` scoped to a specific target org.
 * Only hooks whose partner key's partnerName (case-insensitive, normalised)
 * matches `targetOrgName` will receive the payload.
 *
 * Use this for events that carry referral-specific data so that Org A cannot
 * receive events intended for Org B just because they subscribed to the same
 * event type.
 *
 * Non-blocking — returns void immediately.  Never throws.
 */
export function fireWebhookForOrg(event: string, payload: object, targetOrgName: string): void {
  const body = buildEnvelope(event, payload);
  const normTarget = targetOrgName.trim().toLowerCase().replace(/\s+/g, " ");

  void (async () => {
    try {
      // Join partnerWebhooks → partnerApiKeys to filter by org name at query time.
      const rows = await db
        .select({
          id: partnerWebhooks.id,
          webhookUrl: partnerWebhooks.webhookUrl,
          secret: partnerWebhooks.secret,
          partnerName: partnerApiKeys.partnerName,
        })
        .from(partnerWebhooks)
        .innerJoin(partnerApiKeys, eq(partnerWebhooks.partnerKeyId, partnerApiKeys.id))
        .where(and(
          eq(partnerWebhooks.event, event),
          eq(partnerWebhooks.active, true),
          eq(partnerApiKeys.active, true),   // revoked/offboarded keys stop receiving events
        ));

      // Filter in-process to handle case/spacing differences reliably.
      const hooks = rows.filter(
        (r) => r.partnerName.trim().toLowerCase().replace(/\s+/g, " ") === normTarget,
      );

      if (hooks.length === 0) {
        console.info(
          `[WebhookDispatcher] event=${event} orgName="${targetOrgName}" → 0 matching subscribers.`,
        );
        return;
      }

      const results = await Promise.allSettled(
        hooks.map((hook) => deliverWebhook(hook, event, body)),
      );
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            `[WebhookDispatcher] hook id=${hooks[i]!.id} event=${event} threw:`,
            r.reason,
          );
        }
      });
    } catch (err: unknown) {
      console.error(`[WebhookDispatcher] Error fetching hooks for event=${event} org="${targetOrgName}":`, err);
    }
  })();
}
