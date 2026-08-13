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
import { partnerApiKeys } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

/** Parse the location written by Agency Connector into the notes field. */
function extractLocation(notes: string | null): string {
  if (!notes) return "28472";
  const m = notes.match(/Location:\s*([^.]+)\./);
  return m ? m[1].trim() : "28472";
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
    return res.json({
      valid:     true,
      orgName:   record.partnerName,
      orgEmail:  record.partnerEmail,
      location:  extractLocation(record.notes ?? null),
      scopes:    record.scopes ?? [],
      keyPrefix: record.keyPrefix,
    });
  });

  // ── GET /api/partner-dashboard/community-story ───────────────────────────────
  app.get("/api/partner-dashboard/community-story", requireKey, async (req: Request, res: Response) => {
    const record   = (req as any).partnerRecord;
    const key      = (req as any).tcafKey as string;
    const location = (req.query.location as string) || extractLocation(record.notes ?? null);
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

  // ── POST /api/partner-dashboard/report-pdf ───────────────────────────────────
  // Streams the community-story PDF back to the client.
  app.post("/api/partner-dashboard/report-pdf", requireKey, async (req: Request, res: Response) => {
    const record   = (req as any).partnerRecord;
    const location = (req.body?.location as string) || extractLocation(record.notes ?? null);
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
