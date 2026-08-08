import { Client } from "pg";
import crypto from "crypto";

/**
 * Shared signed-in test helper.
 *
 * Auth is Replit OIDC, so the interactive sign-in itself isn't scriptable from
 * Playwright. Tests simulate only the sign-in the same way the app experiences
 * it: a session row in the `sessions` table (the app's own connect-pg-simple
 * store) plus a `connect.sid` cookie signed with SESSION_SECRET. Everything
 * after sign-in should use the real flows.
 *
 * Role-gated endpoints (requireAdmin in server/routes.ts, requireStaff in
 * server/yhsi-routes.ts) resolve the role via storage.getUser(), which reads
 * `academy_avatars.role` — NOT a column on the `users` table. Passing `role`
 * here upserts that row so admin/teacher/case_manager-gated endpoints pass.
 */

export interface TestUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /** e.g. "admin" | "teacher" | "case_manager" — written to academy_avatars.role */
  role?: string;
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required for this test`);
  return v;
}

/** Sign a session id the way express-session/cookie-signature does. */
export function signSid(sid: string, secret: string): string {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(sid)
    .digest("base64")
    .replace(/=+$/, "");
  return `s:${sid}.${sig}`;
}

/**
 * Create the users row the OIDC callback would normally upsert (needed by
 * /api/auth/user), plus — when `role` is given — the academy_avatars row that
 * role-gated middleware reads.
 */
export async function ensureTestUser(db: Client, user: TestUser): Promise<void> {
  await db.query(
    `INSERT INTO users (id, email, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email,
       first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name`,
    [user.userId, user.email, user.firstName ?? "E2E", user.lastName ?? "Test"]
  );
  if (user.role) {
    const existing = await db.query(
      `SELECT id FROM academy_avatars WHERE user_id = $1`,
      [user.userId]
    );
    if (existing.rowCount) {
      await db.query(`UPDATE academy_avatars SET role = $2 WHERE user_id = $1`, [
        user.userId,
        user.role,
      ]);
    } else {
      await db.query(
        `INSERT INTO academy_avatars (user_id, display_name, role) VALUES ($1, $2, $3)`,
        [user.userId, `${user.firstName ?? "E2E"} ${user.lastName ?? "Test"}`, user.role]
      );
    }
  }
}

/** Insert a fresh session row for the user; returns the Cookie header value. */
export async function forgeSession(
  db: Client,
  user: Pick<TestUser, "userId" | "email" | "firstName" | "lastName">
): Promise<string> {
  const sid = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const sess = {
    cookie: {
      originalMaxAge: 60 * 60 * 1000,
      expires: expires.toISOString(),
      secure: true,
      httpOnly: true,
      path: "/",
    },
    passport: {
      user: {
        claims: {
          sub: user.userId,
          email: user.email,
          first_name: user.firstName ?? "E2E",
          last_name: user.lastName ?? "Test",
        },
        expires_at: Math.floor(expires.getTime() / 1000),
      },
    },
  };
  await db.query(
    `INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)`,
    [sid, JSON.stringify(sess), expires]
  );
  return `connect.sid=${encodeURIComponent(signSid(sid, requireEnv("SESSION_SECRET")))}`;
}

/** Remove the user's sessions, users row, and any academy_avatars role row. */
export async function cleanupTestUser(db: Client, userId: string): Promise<void> {
  await db.query(
    `DELETE FROM sessions WHERE sess->'passport'->'user'->'claims'->>'sub' = $1`,
    [userId]
  );
  await db.query(`DELETE FROM academy_avatars WHERE user_id = $1`, [userId]);
  await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
}
