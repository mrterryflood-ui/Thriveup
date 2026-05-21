/**
 * Trade Sims 10-minute anonymous trial + login audit.
 *
 * Design (per user spec 2026-05-20):
 *   - Anonymous users get 10 minutes CUMULATIVE across ALL trade-sim lessons,
 *     keyed by a server-signed HttpOnly cookie. Cookie cleared = fresh trial
 *     (acceptable soft gate; we are not selling access, we want sign-in).
 *   - Authenticated users have no timer.
 *   - Every sign-in on a trade-sims page upserts trade_sims_logins so we can
 *     see who signed up and how much trial time they used.
 *   - Admin list at GET /api/admin/trade-sims-signups.
 *   - Daily digest email to Dr. Flood (terryflood@thrivingcommunitiesforall.com)
 *     via sendTradeSimsSignupsDigest() called from a 24h interval in index.ts.
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./storage";
import { tradeSimsLogins, users } from "@shared/schema";
import { eq, sql, inArray } from "drizzle-orm";

const TRIAL_MS = 10 * 60 * 1000;       // 10 minutes
const COOKIE_NAME = "tsm_trial";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function signingSecret(): string {
  // Replit Auth wires SESSION_SECRET; fall back to a derived per-instance
  // secret so the route never crashes in dev — only consequence of fallback
  // is that signed cookies don't survive a restart, which is fine for a
  // soft trial gate.
  return (
    process.env.SESSION_SECRET ||
    process.env.THRIVEUP_SHARED_SECRET ||
    "tsm-trial-fallback-secret-restart-resets-anon-trials"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", signingSecret()).update(payload).digest("hex");
}

function readTrialCookie(req: Request): number | null {
  const raw = (req.headers.cookie || "")
    .split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  const value = decodeURIComponent(raw.slice(COOKIE_NAME.length + 1));
  const [startedAtStr, sig] = value.split(".");
  if (!startedAtStr || !sig) return null;
  if (sign(startedAtStr) !== sig) return null;
  const startedAt = Number(startedAtStr);
  if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
  return startedAt;
}

function writeTrialCookie(res: Response, startedAt: number): void {
  const value = `${startedAt}.${sign(String(startedAt))}`;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${COOKIE_MAX_AGE_S}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clientIp(req: Request): string {
  // Trust X-Forwarded-For when behind Replit's proxy (set in index.ts trust proxy).
  const xff = (req.headers["x-forwarded-for"] || "").toString();
  const first = xff.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "";
}

interface AuthedUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

function authedUserFrom(req: Request): AuthedUser | null {
  // Replit Auth puts the user on req.user.claims (passport flow).
  const u: any = (req as any).user;
  if (!u) return null;
  const claims = u.claims || u;
  const id = claims?.sub || claims?.id;
  if (!id) return null;
  return {
    id: String(id),
    email: claims.email ?? null,
    firstName: claims.first_name ?? claims.firstName ?? null,
    lastName: claims.last_name ?? claims.lastName ?? null,
  };
}

export function registerTradeSimsTrialRoutes(app: Express) {
  /**
   * GET /api/trade-sims/trial/status
   *
   * Anonymous-safe. Returns remaining trial ms. Issues cookie on first hit.
   * Authenticated users always get { authenticated: true, remainingMs: Infinity-equivalent }.
   */
  app.get("/api/trade-sims/trial/status", (req: Request, res: Response) => {
    const user = authedUserFrom(req);
    if (user) {
      return res.json({
        authenticated: true,
        remainingMs: TRIAL_MS, // not consulted by client when authed
        totalMs: TRIAL_MS,
        expired: false,
      });
    }
    let startedAt = readTrialCookie(req);
    if (startedAt === null) {
      startedAt = Date.now();
      writeTrialCookie(res, startedAt);
    }
    const elapsed = Date.now() - startedAt;
    const remainingMs = Math.max(0, TRIAL_MS - elapsed);
    return res.json({
      authenticated: false,
      startedAt,
      remainingMs,
      totalMs: TRIAL_MS,
      expired: remainingMs <= 0,
    });
  });

  /**
   * POST /api/trade-sims/login-track
   *
   * Called by the client immediately after a user lands back on a trade-sims
   * page while authenticated. Upserts a row in trade_sims_logins. Body may
   * include the trial cookie value so we can report trialMsUsedBeforeLogin.
   */
  app.post("/api/trade-sims/login-track", async (req: Request, res: Response) => {
    const user = authedUserFrom(req);
    if (!user) {
      return res.status(401).json({ error: "not authenticated" });
    }
    try {
      // Pull richer profile from the users table when available (claim names
      // are sparse for some providers).
      let email = user.email ?? null;
      let firstName = user.firstName ?? null;
      let lastName = user.lastName ?? null;
      try {
        const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        if (row) {
          email = email ?? (row as any).email ?? null;
          firstName = firstName ?? (row as any).firstName ?? null;
          lastName = lastName ?? (row as any).lastName ?? null;
        }
      } catch {
        // users table lookup is best-effort; we still record what we have
        // from claims.
      }

      const startedAt = readTrialCookie(req);
      const trialMsUsed = startedAt
        ? Math.max(0, Math.min(TRIAL_MS, Date.now() - startedAt))
        : null;

      const ip = clientIp(req).slice(0, 64);
      const ua = (req.headers["user-agent"] || "").toString().slice(0, 500);
      const path = typeof req.body?.path === "string" ? req.body.path.slice(0, 500) : null;

      const existing = await db
        .select()
        .from(tradeSimsLogins)
        .where(eq(tradeSimsLogins.userId, user.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(tradeSimsLogins).values({
          userId: user.id,
          email,
          firstName,
          lastName,
          trialMsUsedBeforeLogin: trialMsUsed,
          lastIp: ip || null,
          lastUserAgent: ua || null,
          lastPath: path,
          totalVisits: 1,
          notifiedInDigest: false,
        });
      } else {
        await db
          .update(tradeSimsLogins)
          .set({
            email: email ?? existing[0].email,
            firstName: firstName ?? existing[0].firstName,
            lastName: lastName ?? existing[0].lastName,
            lastSeenAt: new Date(),
            lastIp: ip || existing[0].lastIp,
            lastUserAgent: ua || existing[0].lastUserAgent,
            lastPath: path ?? existing[0].lastPath,
            totalVisits: sql`${tradeSimsLogins.totalVisits} + 1`,
          })
          .where(eq(tradeSimsLogins.userId, user.id));
      }

      return res.json({ ok: true });
    } catch (err: any) {
      console.error("[trade-sims-trial] login-track failed:", err?.message || err);
      return res.status(500).json({ error: "login-track failed" });
    }
  });

  /**
   * GET /api/admin/trade-sims-signups
   *
   * Admin-only list of everyone who has logged in via a trade-sims page.
   */
  app.get("/api/admin/trade-sims-signups", async (req: Request, res: Response) => {
    const user = authedUserFrom(req);
    if (!user) return res.status(401).json({ error: "not authenticated" });
    try {
      const [me] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const role = (me as any)?.role;
      if (role !== "admin") {
        return res.status(403).json({ error: "admin only" });
      }
      const rows = await db
        .select()
        .from(tradeSimsLogins)
        .orderBy(sql`${tradeSimsLogins.lastSeenAt} desc`);
      return res.json({ signups: rows, count: rows.length });
    } catch (err: any) {
      console.error("[trade-sims-trial] admin list failed:", err?.message || err);
      return res.status(500).json({ error: "list failed" });
    }
  });

  /**
   * POST /api/admin/trade-sims-signups/send-digest
   *
   * Manual trigger for the daily digest. Admin only. The interval in index.ts
   * also calls sendTradeSimsSignupsDigest() once every 24h.
   */
  app.post("/api/admin/trade-sims-signups/send-digest", async (req: Request, res: Response) => {
    const user = authedUserFrom(req);
    if (!user) return res.status(401).json({ error: "not authenticated" });
    try {
      const [me] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      if ((me as any)?.role !== "admin") {
        return res.status(403).json({ error: "admin only" });
      }
      const sent = await sendTradeSimsSignupsDigest({ force: true });
      return res.json({ sent });
    } catch (err: any) {
      console.error("[trade-sims-trial] manual digest failed:", err?.message || err);
      return res.status(500).json({ error: "digest failed" });
    }
  });
}

// ---------------------------------------------------------------------------
// Daily digest — collects new (un-notified) signups, emails Dr. Flood, then
// flips notifiedInDigest=true so they don't show up again. Exported for the
// 24h interval started in server/index.ts.
// ---------------------------------------------------------------------------
export async function sendTradeSimsSignupsDigest(opts?: { force?: boolean }): Promise<{
  ok: boolean;
  count: number;
  reason?: string;
}> {
  try {
    const rows = await db
      .select()
      .from(tradeSimsLogins)
      .where(eq(tradeSimsLogins.notifiedInDigest, false))
      .orderBy(sql`${tradeSimsLogins.firstSeenAt} asc`);

    if (rows.length === 0 && !opts?.force) {
      return { ok: true, count: 0, reason: "no new signups" };
    }

    // Capture the exact IDs we are about to email. We only flip
    // notifiedInDigest=true on these rows so any signup inserted between
    // this SELECT and the UPDATE below is NOT marked-as-sent and stays in
    // the queue for the next digest.
    const sentIds = rows.map((r) => r.id);

    // Lazy import to avoid loading the Resend client at module-load time.
    const { sendTradeSimsDigestEmail } = await import("./email-service");
    const ok = await sendTradeSimsDigestEmail(rows);
    if (!ok) {
      return { ok: false, count: rows.length, reason: "email send failed" };
    }

    if (sentIds.length > 0) {
      await db
        .update(tradeSimsLogins)
        .set({ notifiedInDigest: true })
        .where(inArray(tradeSimsLogins.id, sentIds));
    }

    return { ok: true, count: rows.length };
  } catch (err: any) {
    console.error("[trade-sims-trial] digest failed:", err?.message || err);
    return { ok: false, count: 0, reason: err?.message || "unknown error" };
  }
}
