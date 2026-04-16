import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./storage";
import { ecosystemEvents } from "@shared/schema";
import { desc, eq, and, gte } from "drizzle-orm";

const RPLICE_INBOUND_URL =
  process.env.RPLICE_INBOUND_URL ||
  "https://implementationineducatio.com/api/v1/benefits/inbound";

const PEER_NAME = "thriveup";
const PEER_SOURCE_ID = "rplice";

const SUPPORTED_INBOUND_EVENT_TYPES = [
  "rplice.assessment.completed",
  "rplice.action_plan.created",
  "rplice.baseline.set",
  "rplice.intervention.assigned",
];

const SUPPORTED_OUTBOUND_EVENT_TYPES = [
  "thriveup.benefit.enrolled",
  "thriveup.benefit.graduated",
  "thriveup.outcome.reported",
  "thriveup.referral.completed",
];

interface PeerEvent {
  eventId: string;
  eventType: string;
  occurredAt: string;
  source: string;
  data: Record<string, any>;
}

function getSharedSecret(): string | null {
  return process.env.THRIVEUP_SHARED_SECRET || null;
}

function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifySignature(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
  const match = /^sha256=([a-f0-9]+)$/i.exec(signatureHeader.trim());
  if (!match) return false;
  const provided = match[1].toLowerCase();
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEq(provided, computed);
}

function signPayload(rawBody: string, secret: string): string {
  const hex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return `sha256=${hex}`;
}

export function registerRplicePeerSyncRoutes(app: Express) {
  app.post("/api/rplice/sync", async (req: Request, res: Response) => {
    const startedAt = Date.now();
    const secret = getSharedSecret();
    const signature = (req.headers["x-rplice-signature"] as string) || "";

    if (!secret) {
      return res.status(503).json({
        ok: false,
        error: "THRIVEUP_SHARED_SECRET not configured on this peer",
      });
    }
    if (!signature) {
      return res.status(401).json({ ok: false, error: "Missing X-RPLICE-Signature header" });
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      return res.status(400).json({ ok: false, error: "Raw body unavailable for signature verification" });
    }

    const valid = verifySignature(rawBody, signature, secret);
    if (!valid) {
      try {
        await db.insert(ecosystemEvents).values({
          sourcePlatformId: PEER_SOURCE_ID,
          targetPlatformId: PEER_NAME,
          eventType: "peer.sync.signature_invalid",
          eventData: {
            direction: "inbound",
            signaturePresent: true,
            signatureValid: false,
            latencyMs: Date.now() - startedAt,
          },
          status: "rejected",
          processedAt: new Date(),
        });
      } catch {}
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }

    const event = req.body as PeerEvent;
    if (!event || !event.eventType || !event.eventId) {
      return res.status(400).json({ ok: false, error: "Event must include eventType and eventId" });
    }

    const recognized = SUPPORTED_INBOUND_EVENT_TYPES.includes(event.eventType);

    try {
      await db.insert(ecosystemEvents).values({
        sourcePlatformId: event.source || PEER_SOURCE_ID,
        targetPlatformId: PEER_NAME,
        eventType: event.eventType,
        eventData: {
          direction: "inbound",
          eventId: event.eventId,
          occurredAt: event.occurredAt,
          data: event.data || {},
          signatureValid: true,
          recognized,
          latencyMs: Date.now() - startedAt,
        },
        status: recognized ? "processed" : "received_unknown_type",
        processedAt: new Date(),
      });
    } catch (e: any) {
      console.error("[rplice-peer-sync] Failed to log inbound event:", e.message);
    }

    return res.status(200).json({
      ok: true,
      eventId: event.eventId,
      recognized,
      acknowledgedAt: new Date().toISOString(),
    });
  });

  app.post("/api/rplice/peer/publish", async (req: Request, res: Response) => {
    const adminKey = req.headers["x-admin-key"] as string;
    const expectedAdmin = process.env.ADMIN_KEY || process.env.RPLICE_ADMIN_KEY;
    if (!expectedAdmin || adminKey !== expectedAdmin) {
      return res.status(403).json({ ok: false, error: "Admin key required" });
    }

    const secret = getSharedSecret();
    if (!secret) {
      return res.status(503).json({ ok: false, error: "THRIVEUP_SHARED_SECRET not configured" });
    }

    const { eventType, data } = req.body || {};
    if (!eventType) {
      return res.status(400).json({ ok: false, error: "eventType is required" });
    }
    if (!SUPPORTED_OUTBOUND_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({
        ok: false,
        error: `Unsupported eventType. Allowed: ${SUPPORTED_OUTBOUND_EVENT_TYPES.join(", ")}`,
      });
    }

    const event: PeerEvent = {
      eventId: crypto.randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      source: PEER_NAME,
      data: data || {},
    };

    const rawPayload = JSON.stringify(event);
    const signature = signPayload(rawPayload, secret);
    const startedAt = Date.now();

    let statusCode = 0;
    let responseText = "";
    let success = false;
    try {
      const response = await fetch(RPLICE_INBOUND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RPLICE-Signature": signature,
          "X-Peer-Name": PEER_NAME,
        },
        body: rawPayload,
      });
      statusCode = response.status;
      responseText = (await response.text()).slice(0, 500);
      success = response.ok;
    } catch (e: any) {
      responseText = `network_error: ${e.message}`;
    }

    try {
      await db.insert(ecosystemEvents).values({
        sourcePlatformId: PEER_NAME,
        targetPlatformId: PEER_SOURCE_ID,
        eventType,
        eventData: {
          direction: "outbound",
          eventId: event.eventId,
          payload: event.data,
          targetUrl: RPLICE_INBOUND_URL,
          statusCode,
          responseSnippet: responseText,
          latencyMs: Date.now() - startedAt,
        },
        status: success ? "delivered" : "failed",
        processedAt: new Date(),
      });
    } catch (e: any) {
      console.error("[rplice-peer-sync] Failed to log outbound event:", e.message);
    }

    return res.status(success ? 200 : 502).json({
      ok: success,
      eventId: event.eventId,
      targetUrl: RPLICE_INBOUND_URL,
      statusCode,
      responseSnippet: responseText,
    });
  });

  app.get("/api/rplice/peer/events", async (req: Request, res: Response) => {
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);
    const direction = req.query.direction as string | undefined;
    const sinceParam = req.query.since as string | undefined;

    let rows;
    if (sinceParam) {
      const since = new Date(sinceParam);
      rows = await db
        .select()
        .from(ecosystemEvents)
        .where(
          and(
            eq(ecosystemEvents.sourcePlatformId, PEER_SOURCE_ID),
            gte(ecosystemEvents.createdAt, since),
          ),
        )
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(limit);
    } else {
      rows = await db
        .select()
        .from(ecosystemEvents)
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(limit * 2);
    }

    const peerRows = rows.filter((r) => {
      const isPeerPair =
        (r.sourcePlatformId === PEER_SOURCE_ID && r.targetPlatformId === PEER_NAME) ||
        (r.sourcePlatformId === PEER_NAME && r.targetPlatformId === PEER_SOURCE_ID);
      if (!isPeerPair) return false;
      if (!direction) return true;
      const ed = (r.eventData as any) || {};
      return ed.direction === direction;
    });

    return res.json({
      peer: PEER_NAME,
      counterparty: PEER_SOURCE_ID,
      counterpartyInboundUrl: RPLICE_INBOUND_URL,
      sharedSecretConfigured: Boolean(getSharedSecret()),
      adminKeyConfigured: Boolean(process.env.ADMIN_KEY || process.env.RPLICE_ADMIN_KEY),
      supportedInboundEventTypes: SUPPORTED_INBOUND_EVENT_TYPES,
      supportedOutboundEventTypes: SUPPORTED_OUTBOUND_EVENT_TYPES,
      count: peerRows.length,
      events: peerRows.slice(0, limit),
    });
  });

  app.get("/api/rplice/peer/health", (_req: Request, res: Response) => {
    res.json({
      peer: PEER_NAME,
      ready: Boolean(getSharedSecret()),
      counterparty: PEER_SOURCE_ID,
      counterpartyInboundUrl: RPLICE_INBOUND_URL,
      sharedSecretConfigured: Boolean(getSharedSecret()),
      adminKeyConfigured: Boolean(process.env.ADMIN_KEY || process.env.RPLICE_ADMIN_KEY),
      inboundEndpoint: "/api/rplice/sync",
      outboundEndpoint: "/api/rplice/peer/publish",
      eventLogEndpoint: "/api/rplice/peer/events",
    });
  });
}
