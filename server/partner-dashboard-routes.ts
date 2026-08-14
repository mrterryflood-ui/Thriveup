/**
 * Partner Dashboard Routes
 *
 * Proxy endpoints that let the Partner Dashboard page make authenticated
 * requests to the Partner API without exposing the tcaf_* key to
 * the browser. The client sends x-tcaf-key on every request; we validate
 * it against the DB and forward to the internal Partner API.
 *
 * Endpoints:
 *   POST /api/partner-dashboard/auth            → validate key, return org context
 *   GET  /api/partner-dashboard/community-story → proxies /partner/v1/community-story
 *   GET  /api/partner-dashboard/benefits        → proxies /partner/v1/benefits
 *   GET  /api/partner-dashboard/impact          → proxies /partner/v1/impact
 *   POST /api/partner-dashboard/report-pdf      → proxies /community-story/pdf (streams back)
 */

import crypto from "crypto";
import { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { partnerApiKeys, programs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { assembleStoryPack } from "./community-story-routes";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

/** Parse the location written by Agency Connector into the notes field. */
function extractLocation(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/Location:\s*([^.]+)\./);
  return m?.[1]?.trim() || null;
}

function missingLocationError() {
  return {
    error: "This partner dashboard has no valid service-area location configured. Add a ZIP, city/state, county, or multi-county service area in Agency Connector before generating a community story.",
  };
}

async function resolveKey(key: string) {
  if (!key || !key.startsWith("tcaf_")) return null;
  const hash = hashKey(key);
  const [record] = await db
    .select()
    .from(partnerApiKeys)
    .where(and(eq(partnerApiKeys.keyHash, hash), eq(partnerApiKeys.active, true)));
  return record ?? null;
}

/** Middleware: validate x-tcaf-key header and attach the record to req. */
async function requireKey(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers["x-tcaf-key"] as string) || "";
  const record = await resolveKey(key).catch(() => null);
  if (!record) {
    return res.status(401).json({ error: "Invalid or inactive partner key." });
  }
  (req as any).partnerRecord = record;
  (req as any).tcafKey = key;
  next();
}

/** Proxy a GET request to the internal Partner API. */
async function proxyGet(path: string, key: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`http://localhost:5000${path}`, {
      headers: { "x-partner-key": key, "Accept": "application/json" },
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || "fetch failed" };
  }
}

// ── Route registration ────────────────────────────────────────────────────────
export function registerPartnerDashboardRoutes(app: Express) {

  // ── POST /api/partner-dashboard/auth ────────────────────────────────────────
  app.post("/api/partner-dashboard/auth", async (req: Request, res: Response) => {
    const { key } = req.body ?? {};
    if (!key || typeof key !== "string" || !key.startsWith("tcaf_")) {
      return res.status(400).json({ error: "A valid tcaf_* partner key is required." });
    }
    const record = await resolveKey(key).catch(() => null);
    if (!record) {
      return res.status(401).json({ error: "Key not found or inactive. Check your key and try again." });
    }
    const location = extractLocation(record.notes ?? null);
    return res.status(location ? 200 : 422).json({
      valid:     true,
      orgName:   record.partnerName,
      orgEmail:  record.partnerEmail,
      location,
      scopes:    record.scopes ?? [],
      keyPrefix: record.keyPrefix,
      ...(location ? {} : { configurationError: missingLocationError().error }),
    });
  });

  // ── GET /api/partner-dashboard/community-story ───────────────────────────────
  app.get("/api/partner-dashboard/community-story", requireKey, async (req: Request, res: Response) => {
    const record   = (req as any).partnerRecord;
    const key      = (req as any).tcafKey as string;
    const location = (req.query.location as string)?.trim() || extractLocation(record.notes ?? null);
    if (!location) return res.status(422).json(missingLocationError());
    const orgName  = encodeURIComponent(record.partnerName);
    const result   = await proxyGet(
      `/api/partner/v1/community-story?location=${encodeURIComponent(location)}&orgName=${orgName}`,
      key,
    );
    if (!result.ok) return res.status(502).json({ error: result.error ?? "Community story unavailable." });
    return res.json(result.data);
  });

  // ── GET /api/partner-dashboard/benefits ─────────────────────────────────────
  app.get("/api/partner-dashboard/benefits", requireKey, async (req: Request, res: Response) => {
    const key    = (req as any).tcafKey as string;
    const result = await proxyGet("/api/partner/v1/benefits", key);
    if (!result.ok) return res.status(502).json({ error: result.error ?? "Benefits unavailable." });
    return res.json(result.data);
  });

  // ── GET /api/partner-dashboard/impact ───────────────────────────────────────
  app.get("/api/partner-dashboard/impact", requireKey, async (req: Request, res: Response) => {
    const key    = (req as any).tcafKey as string;
    const result = await proxyGet("/api/partner/v1/impact", key);
    if (!result.ok) return res.status(502).json({ error: result.error ?? "Impact data unavailable." });
    return res.json(result.data);
  });

  // ── POST /api/partner-dashboard/share/generate ──────────────────────────────
  // Authenticated: creates or returns a share token for the org's dashboard.
  app.post("/api/partner-dashboard/share/generate", requireKey, async (req: Request, res: Response) => {
    const record = (req as any).partnerRecord;
    try {
      // Reuse existing token if already generated
      if (record.shareToken) {
        const shareUrl = `${req.protocol}://${req.get("host")}/partner-dashboard/shared/${record.shareToken}`;
        return res.json({ shareUrl, token: record.shareToken });
      }
      const token = nanoid(20);
      await db.update(partnerApiKeys)
        .set({ shareToken: token })
        .where(eq(partnerApiKeys.id, record.id));
      const shareUrl = `${req.protocol}://${req.get("host")}/partner-dashboard/shared/${token}`;
      return res.json({ shareUrl, token });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? "Could not generate share link." });
    }
  });

  // ── Shared (public) endpoints — authenticated by share token, not tcaf_* key ─
  async function resolveShareToken(token: string) {
    if (!token) return null;
    const [record] = await db
      .select()
      .from(partnerApiKeys)
      .where(and(eq(partnerApiKeys.shareToken, token), eq(partnerApiKeys.active, true)));
    return record ?? null;
  }

  app.get("/api/partner-dashboard/share/:token/profile", async (req: Request, res: Response) => {
    const record = await resolveShareToken(String(req.params.token ?? "")).catch(() => null);
    if (!record) return res.status(404).json({ error: "Share link not found or expired." });
    const location = extractLocation(record.notes ?? null);
    if (!location) return res.status(422).json(missingLocationError());
    return res.json({
      orgName:  record.partnerName,
      location,
      scopes:   record.scopes ?? [],
    });
  });

  app.get("/api/partner-dashboard/share/:token/community-story", async (req: Request, res: Response) => {
    const record = await resolveShareToken(String(req.params.token ?? "")).catch(() => null);
    if (!record) return res.status(404).json({ error: "Share link not found." });
    const location = extractLocation(record.notes ?? null);
    if (!location) return res.status(422).json(missingLocationError());
    try {
      // Call assembleStoryPack directly — no self-HTTP round-trip
      const story = await assembleStoryPack({
        location,
        orgName: record.partnerName,
      });
      return res.json(story);
    } catch (err: any) {
      return res.status(502).json({ error: "Community story unavailable." });
    }
  });

  app.get("/api/partner-dashboard/share/:token/benefits", async (req: Request, res: Response) => {
    const record = await resolveShareToken(String(req.params.token ?? "")).catch(() => null);
    if (!record) return res.status(404).json({ error: "Share link not found." });
    try {
      // Query the programs table directly — no self-HTTP round-trip
      const catalog = await db.select({
        id:               programs.id,
        title:            programs.title,
        description:      programs.description,
        methodology:      programs.methodology,
        status:           programs.status,
        targetPopulation: programs.targetPopulation,
        geographicFocus:  programs.geographicFocus,
      }).from(programs).limit(100);
      return res.json({ count: catalog.length, programs: catalog, exportedAt: new Date().toISOString() });
    } catch (err: any) {
      return res.status(502).json({ error: "Benefits unavailable." });
    }
  });

  // ── DELETE /api/partner-dashboard/share/revoke ───────────────────────────────
  // Authenticated: clears the share_token so any existing public link stops working.
  app.delete("/api/partner-dashboard/share/revoke", requireKey, async (req: Request, res: Response) => {
    const record = (req as any).partnerRecord;
    try {
      await db.update(partnerApiKeys)
        .set({ shareToken: null })
        .where(eq(partnerApiKeys.id, record.id));
      return res.json({ revoked: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? "Could not revoke share link." });
    }
  });

  // ── POST /api/partner-dashboard/report-pdf ───────────────────────────────────
  // Streams the community-story PDF back to the client.
  app.post("/api/partner-dashboard/report-pdf", requireKey, async (req: Request, res: Response) => {
    const record   = (req as any).partnerRecord;
    const location = (req.body?.location as string)?.trim() || extractLocation(record.notes ?? null);
    if (!location) return res.status(422).json(missingLocationError());
    const orgName  = record.partnerName;
    try {
      const upstream = await fetch("http://localhost:5000/api/community-story/pdf", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ location, orgName, includeGrantData: true }),
      });
      if (!upstream.ok) {
        return res.status(502).json({ error: "PDF generation failed." });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="community-report-${orgName.replace(/\s+/g, "-")}.pdf"`);
      const buf = await upstream.arrayBuffer();
      return res.send(Buffer.from(buf));
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? "PDF error" });
    }
  });
}
