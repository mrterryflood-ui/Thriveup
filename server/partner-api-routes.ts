import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { partnerApiKeys, partnerApiAuditLog, partnerInboundData, ecosystemPlatforms } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

function generateKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const plaintext = `tcaf_${raw}`;
  const prefix = plaintext.slice(0, 14);
  return { plaintext, prefix, hash: hashKey(plaintext) };
}

async function requirePartnerAuth(req: Request, res: Response, next: NextFunction) {
  const raw = (req.headers["x-partner-key"] as string) || (req.headers["authorization"] || "").replace("Bearer ", "");
  if (!raw || !raw.startsWith("tcaf_")) {
    return res.status(401).json({ error: "Missing or invalid partner key. Include x-partner-key header." });
  }

  const hash = hashKey(raw);
  const [key] = await db.select().from(partnerApiKeys).where(and(eq(partnerApiKeys.keyHash, hash), eq(partnerApiKeys.active, true)));
  if (!key) {
    return res.status(401).json({ error: "Invalid or revoked partner key." });
  }

  (req as any).partnerKey = key;

  // Log the call
  const endpoint = req.path;
  await db.insert(partnerApiAuditLog).values({
    keyId: key.id,
    keyPrefix: key.keyPrefix,
    partnerName: key.partnerName,
    endpoint,
    method: req.method,
    statusCode: 200,
    ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
    userAgent: (req.headers["user-agent"] || "").slice(0, 299),
  }).catch(() => {});

  // Increment usage count
  await db.update(partnerApiKeys)
    .set({ usageCount: key.usageCount + 1, lastUsedAt: new Date() })
    .where(eq(partnerApiKeys.id, key.id))
    .catch(() => {});

  next();
}

function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key: any = (req as any).partnerKey;
    if (!key?.scopes?.includes(scope)) {
      return res.status(403).json({ error: `This key does not have the '${scope}' scope.` });
    }
    next();
  };
}

// Admin auth reused from ecosystem connector pattern
function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  const user = session?.passport?.user || session?.user;
  if (!user) return res.status(401).json({ error: "Admin authentication required." });
  next();
}

export function registerPartnerApiRoutes(app: Express) {

  // ── Public partner endpoints ──────────────────────────────────────────────

  app.get("/api/partner/v1/health", requirePartnerAuth, (req, res) => {
    const key: any = (req as any).partnerKey;
    res.json({
      status: "ok",
      partner: key.partnerName,
      scopes: key.scopes,
      timestamp: new Date().toISOString(),
      message: "ThriveUp Partner API is live. You are authenticated.",
    });
  });

  app.get("/api/partner/v1/export", requirePartnerAuth, requireScope("content:read"), async (req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        description: ecosystemPlatforms.description,
        domain: ecosystemPlatforms.domain,
        role: ecosystemPlatforms.role,
        url: ecosystemPlatforms.url,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      const records = platforms
        .filter(p => p.description)
        .map(p => ({
          id: `platform:${p.id}`,
          content: `${p.name}: ${p.description}`,
          metadata: {
            source: "thriveup-academy",
            type: "platform",
            domain: p.domain,
            role: p.role,
            url: p.url,
            exportedAt: new Date().toISOString(),
          },
        }));

      res.json({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        count: records.length,
        records,
      });
    } catch (err) {
      res.status(500).json({ error: "Export failed." });
    }
  });

  app.get("/api/partner/v1/platforms", requirePartnerAuth, requireScope("platforms:read"), async (req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        url: ecosystemPlatforms.url,
        domain: ecosystemPlatforms.domain,
        role: ecosystemPlatforms.role,
        healthStatus: ecosystemPlatforms.healthStatus,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      res.json({ count: platforms.length, platforms });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch platforms." });
    }
  });

  // ── Inbound — partners push data TO ThriveUp ─────────────────────────────

  app.post("/api/partner/v1/heartbeat", requirePartnerAuth, async (req, res) => {
    const key: any = (req as any).partnerKey;
    await db.insert(partnerInboundData).values({
      keyId: key.id,
      partnerName: key.partnerName,
      dataType: "heartbeat",
      payload: { message: req.body?.message || "alive", meta: req.body?.meta || {} },
    }).catch(() => {});
    res.json({ received: true, partner: key.partnerName, timestamp: new Date().toISOString() });
  });

  app.post("/api/partner/v1/push", requirePartnerAuth, requireScope("inbound:write"), async (req, res) => {
    const key: any = (req as any).partnerKey;
    const { dataType, payload } = req.body;
    if (!dataType || !payload) {
      return res.status(400).json({ error: "dataType and payload are required." });
    }
    const ALLOWED_TYPES = ["content", "event", "insight", "update", "metric", "referral", "alert"];
    if (!ALLOWED_TYPES.includes(dataType)) {
      return res.status(400).json({ error: `dataType must be one of: ${ALLOWED_TYPES.join(", ")}` });
    }
    const [row] = await db.insert(partnerInboundData).values({
      keyId: key.id,
      partnerName: key.partnerName,
      dataType,
      payload,
    }).returning({ id: partnerInboundData.id, receivedAt: partnerInboundData.receivedAt });

    res.json({
      received: true,
      id: row.id,
      partner: key.partnerName,
      dataType,
      receivedAt: row.receivedAt,
    });
  });

  // ── Admin — inbound data viewer ───────────────────────────────────────────

  app.get("/api/admin/partner-inbound", requireAdminKey, async (req, res) => {
    try {
      const rows = await db.select().from(partnerInboundData)
        .orderBy(desc(partnerInboundData.receivedAt))
        .limit(100);
      res.json({ count: rows.length, data: rows });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inbound data." });
    }
  });

  app.patch("/api/admin/partner-inbound/:id/mark-processed", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerInboundData)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(partnerInboundData.id, req.params.id))
        .returning({ id: partnerInboundData.id });
      if (!updated) return res.status(404).json({ error: "Record not found." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark processed." });
    }
  });

  // ── Admin key management ──────────────────────────────────────────────────

  app.get("/api/admin/partner-keys", requireAdminKey, async (req, res) => {
    try {
      const keys = await db.select({
        id: partnerApiKeys.id,
        partnerName: partnerApiKeys.partnerName,
        partnerEmail: partnerApiKeys.partnerEmail,
        keyPrefix: partnerApiKeys.keyPrefix,
        scopes: partnerApiKeys.scopes,
        active: partnerApiKeys.active,
        usageCount: partnerApiKeys.usageCount,
        lastUsedAt: partnerApiKeys.lastUsedAt,
        notes: partnerApiKeys.notes,
        createdAt: partnerApiKeys.createdAt,
      }).from(partnerApiKeys).orderBy(desc(partnerApiKeys.createdAt));

      res.json({ keys });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch partner keys." });
    }
  });

  app.post("/api/admin/partner-keys", requireAdminKey, async (req, res) => {
    try {
      const { partnerName, partnerEmail, scopes, notes } = req.body;
      if (!partnerName) return res.status(400).json({ error: "partnerName is required." });

      const { plaintext, prefix, hash } = generateKey();
      const [created] = await db.insert(partnerApiKeys).values({
        partnerName,
        partnerEmail: partnerEmail || null,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: scopes && scopes.length ? scopes : ["content:read"],
        notes: notes || null,
      }).returning();

      res.json({
        success: true,
        key: created,
        plaintextKey: plaintext,
        warning: "Copy this key now — it will never be shown again.",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to create partner key." });
    }
  });

  app.patch("/api/admin/partner-keys/:id/revoke", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerApiKeys)
        .set({ active: false })
        .where(eq(partnerApiKeys.id, req.params.id))
        .returning({ id: partnerApiKeys.id, partnerName: partnerApiKeys.partnerName });
      if (!updated) return res.status(404).json({ error: "Key not found." });
      res.json({ success: true, revoked: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to revoke key." });
    }
  });

  app.patch("/api/admin/partner-keys/:id/restore", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerApiKeys)
        .set({ active: true })
        .where(eq(partnerApiKeys.id, req.params.id))
        .returning({ id: partnerApiKeys.id, partnerName: partnerApiKeys.partnerName });
      if (!updated) return res.status(404).json({ error: "Key not found." });
      res.json({ success: true, restored: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to restore key." });
    }
  });

  app.get("/api/admin/partner-keys/audit", requireAdminKey, async (req, res) => {
    try {
      const logs = await db.select().from(partnerApiAuditLog)
        .orderBy(desc(partnerApiAuditLog.calledAt))
        .limit(200);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit log." });
    }
  });
}
