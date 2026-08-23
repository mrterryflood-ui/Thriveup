import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";

const REPLAY_WINDOW_SECONDS = 300;
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { db, storage } from "./storage";
import {
  networkPlatforms,
  networkMembers,
  networkMemberEvents,
  type InsertNetworkPlatform,
} from "@shared/schema";

// ---- Default federated platforms (seeded on startup) ----
const DEFAULT_PLATFORMS: InsertNetworkPlatform[] = [
  {
    id: "herhealth",
    name: "HerHealth Matters",
    baseUrl: "https://herhealthmatters2.com",
    description: "Women's Health Ecosystem — 9 domains, 84 conditions, AI navigator Nia. By Sankofa.",
    color: "from-pink-500 to-rose-600",
    secretEnvVar: "NETWORK_SECRET_HERHEALTH",
    active: true,
  },
  {
    id: "biblestudy",
    name: "Bible Study Buddies",
    baseUrl: "https://biblestudybuddies.net",
    description: "Faith-based community for Bible study, prayer partners, and church-connected groups.",
    color: "from-amber-500 to-orange-600",
    secretEnvVar: "NETWORK_SECRET_BIBLESTUDY",
    active: true,
  },
  {
    id: "healthyblkman",
    name: "MaleHealth Matters",
    baseUrl: "https://malehealthmatters2.com",
    description: "Men's health navigation, prevention, and care support.",
    color: "from-sky-600 to-indigo-700",
    secretEnvVar: "NETWORK_SECRET_HEALTHYBLKMAN",
    active: true,
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    baseUrl: "https://herhealthmatters2.com",
    description: "Health and wellness gateway connecting people to responsive care and support.",
    color: "from-emerald-600 to-teal-700",
    secretEnvVar: "NETWORK_SECRET_YOURHEALTHBIRTHRIGHT",
    active: true,
  },
];

async function seedDefaultPlatforms() {
  try {
    for (const p of DEFAULT_PLATFORMS) {
      const existing = await db.select().from(networkPlatforms).where(eq(networkPlatforms.id, p.id));
      if (existing.length === 0) {
        await db.insert(networkPlatforms).values(p);
        console.log(`[network] seeded platform: ${p.id}`);
      }
    }
  } catch (e: any) {
    console.warn("[network] seed skipped:", e?.message ?? e);
  }
}

// ---- HMAC verification ----
// Header: X-Network-Signature: sha256=<hex>
// Body:   raw bytes (we use express.raw for this route)
function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function verifyAndParse(req: Request): Promise<{ ok: boolean; status?: number; error?: string; body?: any; platformId?: string }> {
  const platformId = String(req.headers["x-network-platform"] ?? "").trim().toLowerCase();
  const signatureHeader = String(req.headers["x-network-signature"] ?? "").trim();
  const tsHeader = String(req.headers["x-network-timestamp"] ?? "").trim();
  if (!platformId) return { ok: false, status: 400, error: "Missing X-Network-Platform header" };
  if (!signatureHeader) return { ok: false, status: 401, error: "Missing X-Network-Signature header" };
  if (!tsHeader) return { ok: false, status: 401, error: "Missing X-Network-Timestamp header" };

  const ts = parseInt(tsHeader, 10);
  if (!Number.isFinite(ts)) return { ok: false, status: 401, error: "Invalid X-Network-Timestamp" };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > REPLAY_WINDOW_SECONDS) return { ok: false, status: 401, error: "Timestamp outside replay window" };

  const [platform] = await db.select().from(networkPlatforms).where(eq(networkPlatforms.id, platformId));
  if (!platform || !platform.active) return { ok: false, status: 404, error: "Unknown or inactive platform" };

  const envVar = platform.secretEnvVar || `NETWORK_SECRET_${platformId.toUpperCase()}`;
  const secret = process.env[envVar];
  if (!secret) return { ok: false, status: 500, error: `Server is missing ${envVar}` };

  // Use rawBody captured by the global express.json verify hook in server/index.ts
  const raw: Buffer = ((req as any).rawBody as Buffer) ?? Buffer.from(JSON.stringify((req as any).body ?? {}));
  // Sign over `${timestamp}.${body}` so timestamp is bound to signature
  const signingPayload = Buffer.concat([Buffer.from(`${tsHeader}.`), raw]);
  const expected = crypto.createHmac("sha256", secret).update(signingPayload).digest("hex");
  const provided = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  if (!timingSafeEqualHex(expected, provided)) {
    return { ok: false, status: 401, error: "Bad signature" };
  }

  return { ok: true, body: (req as any).body ?? {}, platformId };
}

// ---- Admin gate (matches the rest of the app) ----
async function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });
  const userId = req.user?.claims?.sub ?? req.user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher") return next();
  } catch {}
  return res.status(403).json({ error: "Admin access required" });
}

// ---- Member upsert based on event ----
async function applyEventToMember(platformId: string, ev: any) {
  const externalUserId = String(ev.externalUserId ?? ev.userId ?? "").trim();
  if (!externalUserId) return null;

  const [existing] = await db
    .select()
    .from(networkMembers)
    .where(and(eq(networkMembers.platformId, platformId), eq(networkMembers.externalUserId, externalUserId)));

  const now = new Date();
  const occurredAt = ev.occurredAt ? new Date(ev.occurredAt) : now;
  const eventType = String(ev.eventType ?? ev.type ?? "unknown");

  const patch: any = {
    email: ev.email ?? existing?.email ?? null,
    displayName: ev.displayName ?? ev.name ?? existing?.displayName ?? null,
    role: ev.role ?? existing?.role ?? "member",
    conditions: ev.conditions ?? existing?.conditions ?? null,
    zip: ev.zip ?? existing?.zip ?? null,
    county: ev.county ?? existing?.county ?? null,
    lastEventAt: occurredAt,
    metadata: { ...(existing?.metadata as any ?? {}), ...(ev.metadata ?? {}) },
    updatedAt: now,
  };

  if (eventType === "login" || eventType === "user.login") {
    patch.lastLoginAt = occurredAt;
    patch.loginCount = (existing?.loginCount ?? 0) + 1;
  }
  if (eventType === "navigator_engaged" || eventType === "nia.engaged") {
    patch.navigatorEngaged = true;
  }
  if (eventType === "appointment_booked" || eventType === "appointment.booked") {
    patch.appointmentsBooked = (existing?.appointmentsBooked ?? 0) + 1;
  }

  if (existing) {
    await db.update(networkMembers).set(patch).where(eq(networkMembers.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(networkMembers)
    .values({
      platformId,
      externalUserId,
      ...patch,
      firstSeenAt: occurredAt,
    } as any)
    .returning();
  return created.id;
}

async function recalcPlatformCounts(platformId: string) {
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(networkMembers)
    .where(eq(networkMembers.platformId, platformId));
  await db
    .update(networkPlatforms)
    .set({ totalMembers: c ?? 0, lastEventAt: new Date(), updatedAt: new Date() })
    .where(eq(networkPlatforms.id, platformId));
}

export function registerNetworkRoutes(app: Express) {
  void seedDefaultPlatforms();

  // --- Webhook receiver (HMAC over timestamp.body) ---
  app.post(
    "/api/network/events",
    async (req: Request, res: Response) => {
      const v = await verifyAndParse(req);
      if (!v.ok) return res.status(v.status ?? 400).json({ error: v.error });
      const platformId = v.platformId!;
      const body = v.body;
      const events = Array.isArray(body?.events) ? body.events : Array.isArray(body) ? body : [body];

      let written = 0;
      for (const ev of events) {
        if (!ev || typeof ev !== "object") continue;
        const externalUserId = String(ev.externalUserId ?? ev.userId ?? "").trim();
        const eventType = String(ev.eventType ?? ev.type ?? "").trim();
        if (!externalUserId || !eventType) continue;
        const occurredAt = ev.occurredAt ? new Date(ev.occurredAt) : new Date();
        await db.insert(networkMemberEvents).values({
          platformId,
          externalUserId,
          eventType,
          payload: ev,
          occurredAt,
        });
        await applyEventToMember(platformId, ev);
        written++;
      }
      await recalcPlatformCounts(platformId);
      res.json({ ok: true, accepted: written, platform: platformId });
    },
  );

  // --- Read APIs (admin only) ---
  app.get("/api/network/platforms", requireAdmin, async (_req, res) => {
    const rows = await db.select().from(networkPlatforms).orderBy(desc(networkPlatforms.lastEventAt));
    res.json({ ok: true, platforms: rows });
  });

  app.get("/api/network/members", requireAdmin, async (req, res) => {
    const platformId = String(req.query.platform ?? "").trim().toLowerCase();
    const role = String(req.query.role ?? "").trim();
    const q = String(req.query.q ?? "").trim();
    const limit = Math.min(parseInt(String(req.query.limit ?? "200"), 10) || 200, 1000);

    const where: any[] = [];
    if (platformId) where.push(eq(networkMembers.platformId, platformId));
    if (role) where.push(eq(networkMembers.role, role));
    if (q) {
      const like1 = `%${q.toLowerCase()}%`;
      where.push(or(like(sql`lower(${networkMembers.email})`, like1), like(sql`lower(${networkMembers.displayName})`, like1))!);
    }

    const rows = await db
      .select()
      .from(networkMembers)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(networkMembers.lastEventAt))
      .limit(limit);

    const platforms = await db.select().from(networkPlatforms);
    const platformMap = new Map(platforms.map((p) => [p.id, p]));

    const enriched = rows.map((m) => ({
      ...m,
      platformName: platformMap.get(m.platformId)?.name ?? m.platformId,
      platformBaseUrl: platformMap.get(m.platformId)?.baseUrl ?? null,
    }));

    res.json({ ok: true, members: enriched, total: enriched.length });
  });

  app.get("/api/network/members/:id/events", requireAdmin, async (req, res) => {
    const [member] = await db.select().from(networkMembers).where(eq(networkMembers.id, req.params.id));
    if (!member) return res.status(404).json({ error: "Member not found" });
    const events = await db
      .select()
      .from(networkMemberEvents)
      .where(and(eq(networkMemberEvents.platformId, member.platformId), eq(networkMemberEvents.externalUserId, member.externalUserId)))
      .orderBy(desc(networkMemberEvents.occurredAt))
      .limit(200);
    res.json({ ok: true, member, events });
  });

  app.get("/api/network/summary", requireAdmin, async (_req, res) => {
    const platforms = await db.select().from(networkPlatforms);
    const memberCounts = await db
      .select({
        platformId: networkMembers.platformId,
        total: sql<number>`count(*)::int`,
        admins: sql<number>`sum(case when ${networkMembers.role} = 'admin' then 1 else 0 end)::int`,
        active7d: sql<number>`sum(case when ${networkMembers.lastLoginAt} > now() - interval '7 days' then 1 else 0 end)::int`,
      })
      .from(networkMembers)
      .groupBy(networkMembers.platformId);
    const map = new Map(memberCounts.map((c) => [c.platformId, c]));
    const tiles = platforms.map((p) => ({
      ...p,
      total: map.get(p.id)?.total ?? 0,
      admins: map.get(p.id)?.admins ?? 0,
      active7d: map.get(p.id)?.active7d ?? 0,
      hasSecret: !!process.env[p.secretEnvVar || `NETWORK_SECRET_${p.id.toUpperCase()}`],
    }));
    res.json({ ok: true, platforms: tiles });
  });

  // --- Test signature helper (admin only) ---
  // POST /api/network/test-sign  { platform, body }  → returns the header you'd send.
  // Lets the maintainer of HerHealth verify their HMAC code against ours.
  app.post("/api/network/test-sign", requireAdmin, async (req, res) => {
    const platformId = String(req.body?.platform ?? "").trim().toLowerCase();
    const body = req.body?.body ?? {};
    const [platform] = await db.select().from(networkPlatforms).where(eq(networkPlatforms.id, platformId));
    if (!platform) return res.status(404).json({ error: "Unknown platform" });
    const envVar = platform.secretEnvVar || `NETWORK_SECRET_${platformId.toUpperCase()}`;
    const secret = process.env[envVar];
    if (!secret) return res.status(500).json({ error: `Server missing ${envVar}` });
    const raw = Buffer.from(JSON.stringify(body));
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = crypto.createHmac("sha256", secret).update(Buffer.concat([Buffer.from(`${ts}.`), raw])).digest("hex");
    res.json({
      ok: true,
      headers: {
        "Content-Type": "application/json",
        "X-Network-Platform": platformId,
        "X-Network-Timestamp": ts,
        "X-Network-Signature": `sha256=${sig}`,
      },
      bodyBytes: raw.length,
      sample: raw.toString("utf8").slice(0, 400),
    });
  });
}
