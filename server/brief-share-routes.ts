/**
 * Shareable community brief links.
 *
 *   POST /api/conductor/community-brief/share  — store a brief, return a share URL
 *   GET  /api/conductor/community-brief/share/:shareId — retrieve stored brief
 */

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { briefShares } from "@shared/schema";
import { eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Per-IP rate limiter (5 shares / hour) ────────────────────────────────────
const SHARE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SHARE_MAX = 5;
const shareIpHits = new Map<string, number[]>();

function shareRateLimit(ip: string): number | null {
  const now = Date.now();
  const cutoff = now - SHARE_WINDOW_MS;
  const hits = (shareIpHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (hits.length >= SHARE_MAX) {
    return Math.max(1, Math.ceil((hits[0] + SHARE_WINDOW_MS - now) / 1000));
  }
  hits.push(now);
  shareIpHits.set(ip, hits);
  return null;
}

function clientIp(req: Request): string {
  return (req.ip || req.socket?.remoteAddress || "unknown").trim();
}

export function registerBriefShareRoutes(app: Express) {
  /**
   * POST /api/conductor/community-brief/share
   * Body: the full brief object the client already has.
   * Stores in brief_shares and returns {shareId, shareUrl}.
   * Public, rate-limited 5/hour/IP.
   */
  app.post("/api/conductor/community-brief/share", async (req: Request, res: Response) => {
    try {
      const ip = clientIp(req);
      const retryAfter = shareRateLimit(ip);
      if (retryAfter !== null) {
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: "Too many share requests. Please wait before sharing again.",
        });
      }

      const brief = req.body;
      if (!brief || typeof brief !== "object") {
        return res.status(400).json({ error: "brief object is required in request body" });
      }

      // Share links are PUBLIC and unauthenticated. The `rplice` research /
      // intelligence block is authenticated-analyst-only (built from internal
      // operational data), so it must never be persisted into a shared brief —
      // strip it server-side regardless of what the client sent.
      if ("rplice" in brief) {
        delete (brief as Record<string, unknown>).rplice;
      }

      const location = String(
        brief.geography?.displayName ?? brief.geography?.input ?? brief.location ?? "community",
      ).slice(0, 400);

      const id = nanoid(8);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(briefShares).values({
        id,
        location,
        briefData: brief as Record<string, unknown>,
        createdAt: now,
        expiresAt,
      });

      // Opportunistic cleanup of expired rows (non-blocking; best-effort).
      db.delete(briefShares)
        .where(lt(briefShares.expiresAt, now))
        .catch((err: Error) => console.error("[brief-share] cleanup error:", err));

      const shareUrl = `https://thrivingcommunitiesforall.com/brief/${id}`;
      return res.json({ shareId: id, shareUrl });
    } catch (err) {
      console.error("[brief-share/post] error:", err);
      return res.status(500).json({ error: "Failed to create shareable link." });
    }
  });

  /**
   * GET /api/conductor/community-brief/share/:shareId
   * Returns the stored brief JSON. 404 if expired or not found.
   * Public.
   */
  app.get("/api/conductor/community-brief/share/:shareId", async (req: Request, res: Response) => {
    try {
      const shareId = String(req.params.shareId ?? "");
      if (!shareId) return res.status(400).json({ error: "shareId is required" });

      const [row] = await db
        .select()
        .from(briefShares)
        .where(eq(briefShares.id, shareId))
        .limit(1);

      if (!row) {
        return res.status(404).json({
          error: "Shared brief not found. It may have expired (links are valid for 30 days) or the ID is incorrect.",
        });
      }

      if (new Date(row.expiresAt) < new Date()) {
        // Clean up the expired row.
        await db.delete(briefShares).where(eq(briefShares.id, shareId)).catch(() => {});
        return res.status(404).json({
          error: "This shared brief has expired. Links are valid for 30 days from creation.",
        });
      }

      // Defensive strip on read: rows written before the POST-side strip was
      // deployed may still carry the analyst-only `rplice` block. The share
      // GET is public, so never return it — and scrub the stored row so the
      // legacy data doesn't linger until expiry.
      const stored = row.briefData as Record<string, unknown> | null;
      if (stored && typeof stored === "object" && "rplice" in stored) {
        delete stored.rplice;
        db.update(briefShares)
          .set({ briefData: stored })
          .where(eq(briefShares.id, shareId))
          .catch((err: Error) => console.error("[brief-share] legacy rplice scrub error:", err));
      }
      return res.json(stored);
    } catch (err) {
      console.error("[brief-share/get] error:", err);
      return res.status(500).json({ error: "Failed to retrieve shared brief." });
    }
  });
}
