// Integration tests for the access-model fixes (task: reentry / esign /
// platform-metrics / transparency). Pins down:
//
//   E-Sign staff APIs (documents/create/sign/revoke/generate-template):
//     anonymous → 401, student → 403, facilitator & case_manager & admin → not 401/403
//   E-Sign invite flow (public, token-scoped):
//     GET /api/esign/invite/:id with valid token → 200 without any session
//     bad/missing token → 404 (existence not revealed)
//     POST /api/esign/invite/:id/sign with valid token → 200 without session
//   Metrics:
//     GET /api/public/platform-metrics → 200 anonymous, no raw rows,
//       "not yet reported" sentinels (never placeholder zeros for unmeasured)
//     GET /api/metrics/platform-wide → 401 anonymous, 403 student, 200 staff
//   Reentry staff dashboard APIs accept EVERY role in the canonical
//     STAFF_ROLES set (admin, teacher, case_manager, facilitator, staff) —
//     the /api/reentry/access resolver routes all of them to the dashboard.
//
// Run: npx tsx scripts/test-access-model-guards.ts
// Exits non-zero on any failure. Uses the real DB (seeds prefixed test rows,
// deletes them afterward).

import express, { type Request, type Response, type NextFunction } from "express";
import type { Server } from "http";
import { db } from "../server/storage";
import { academyAvatars, documentSignatures } from "@shared/schema";
import { users } from "@shared/models/auth";
import { like, eq } from "drizzle-orm";
import { registerMetricsRoutes } from "../server/metrics-routes";
import { registerReentryRoutes } from "../server/reentry-routes";
import { registerGrantRoutes } from "../server/grant-routes";
import { registerAuthRoutes } from "../server/replit_integrations/auth/routes";

const PREFIX = "access-guard-test-";
const ROLES = ["student", "teacher", "case_manager", "facilitator", "staff", "admin"] as const;
const STAFF = new Set(["teacher", "case_manager", "facilitator", "staff", "admin"]);

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

async function main() {
  // Roles resolve through storage.getUser → academy_avatars (never the session).
  await db.delete(academyAvatars).where(like(academyAvatars.userId, `${PREFIX}%`));
  await db.delete(users).where(like(users.id, `${PREFIX}%`));
  for (const role of ROLES) {
    await db.insert(academyAvatars).values({ userId: `${PREFIX}${role}`, displayName: `${PREFIX}${role}`, role });
    // users row the OIDC callback would upsert — /api/auth/user reads it.
    await db.insert(users).values({ id: `${PREFIX}${role}`, email: `${PREFIX}${role}@test.local` });
  }

  const app = express();
  app.use(express.json({ limit: "5mb" }));
  // Test-only auth shim mirroring the real layer: req.user = { claims: { sub } } only.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const sub = req.header("x-test-user");
    if (sub) {
      // Mirror the real auth layer plus what isAuthenticated checks, so the
      // real /api/auth/user handler (role merging) can be exercised too.
      (req as any).user = { claims: { sub }, expires_at: Math.floor(Date.now() / 1000) + 3600 };
      (req as any).isAuthenticated = () => true;
    } else {
      (req as any).isAuthenticated = () => false;
    }
    next();
  });
  registerMetricsRoutes(app);
  registerReentryRoutes(app);
  registerGrantRoutes(app);
  registerAuthRoutes(app);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

  const call = async (path: string, opts: { user?: string; method?: string; body?: unknown } = {}) => {
    const headers: Record<string, string> = {};
    if (opts.user) headers["x-test-user"] = `${PREFIX}${opts.user}`;
    if (opts.body !== undefined) headers["content-type"] = "application/json";
    const res = await fetch(`${base}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, json };
  };

  let inviteDocId: string | null = null;
  try {
    // ── 1. Public metrics endpoint: anonymous, honest, aggregate-only ──────
    console.log("\nPublic metrics — GET /api/public/platform-metrics:");
    {
      const r = await call("/api/public/platform-metrics");
      check("anonymous → 200", r.status === 200, `got ${r.status}`);
      check("workforce is 'not yet reported' (no placeholder zeros)",
        r.json?.workforce?.careerAssessments === "not yet reported",
        JSON.stringify(r.json?.workforce));
      check("grants funding is 'not yet reported'",
        r.json?.grants?.totalFundingSecured === "not yet reported");
      const flat = JSON.stringify(r.json);
      check("no raw row arrays in payload", !flat.includes("\"id\":") && !flat.includes("userId"));
    }

    // ── 2. Internal metrics endpoints: staff only ──────────────────────────
    console.log("\nInternal metrics — GET /api/metrics/platform-wide:");
    {
      const anon = await call("/api/metrics/platform-wide");
      check("anonymous → 401", anon.status === 401, `got ${anon.status}`);
      const student = await call("/api/metrics/platform-wide", { user: "student" });
      check("student → 403", student.status === 403, `got ${student.status}`);
      const staff = await call("/api/metrics/platform-wide", { user: "facilitator" });
      check("facilitator → 200", staff.status === 200, `got ${staff.status}`);
      check("staff view labels unmeasured values honestly",
        staff.json?.workforce?.careerAssessments === "not yet reported");
    }
    {
      const student = await call("/api/metrics/stored", { user: "student" });
      check("GET /api/metrics/stored student → 403", student.status === 403, `got ${student.status}`);
      const student2 = await call("/api/metrics/snapshot", { user: "student", method: "POST", body: {} });
      check("POST /api/metrics/snapshot student → 403", student2.status === 403, `got ${student2.status}`);
    }

    // ── 3. Reentry staff APIs accept every canonical staff role ────────────
    console.log("\nReentry staff guard — GET /api/reentry/dashboard:");
    {
      const anon = await call("/api/reentry/dashboard");
      check("anonymous → 401", anon.status === 401, `got ${anon.status}`);
    }
    for (const role of ROLES) {
      const want = STAFF.has(role) ? 200 : 403;
      const r = await call("/api/reentry/dashboard", { user: role });
      check(`${role} → ${want}`, r.status === want, `got ${r.status}`);
    }
    {
      // Participant journey stays open to any authenticated user.
      const r = await call("/api/reentry/my-journey", { user: "student" });
      check("student → 200 on own journey", r.status === 200, `got ${r.status}`);
    }

    // ── 4. E-Sign staff APIs: staff only ───────────────────────────────────
    console.log("\nE-Sign staff guard:");
    {
      const anon = await call("/api/esign/documents");
      check("GET /api/esign/documents anonymous → 401", anon.status === 401, `got ${anon.status}`);
      const student = await call("/api/esign/documents", { user: "student" });
      check("student → 403", student.status === 403, `got ${student.status}`);
      const staff = await call("/api/esign/documents", { user: "facilitator" });
      check("facilitator → 200", staff.status === 200, `got ${staff.status}`);
    }
    {
      const student = await call("/api/esign/create", { user: "student", method: "POST", body: { documentType: "mou", documentTitle: "x", recipientName: "y" } });
      check("POST /api/esign/create student → 403", student.status === 403, `got ${student.status}`);
      const student2 = await call("/api/esign/generate-template", { user: "student", method: "POST", body: {} });
      check("POST /api/esign/generate-template student → 403", student2.status === 403, `got ${student2.status}`);
      const student3 = await call("/api/esign/revoke/some-id", { user: "student", method: "POST", body: {} });
      check("POST /api/esign/revoke student → 403", student3.status === 403, `got ${student3.status}`);
      const student4 = await call("/api/esign/sign/some-id", { user: "student", method: "POST", body: { signatureData: "data:image/png;base64,x" } });
      check("POST /api/esign/sign student → 403", student4.status === 403, `got ${student4.status}`);
    }

    // ── 5. E-Sign invite flow: public, token-scoped ────────────────────────
    console.log("\nE-Sign invite flow (no session):");
    {
      const created = await call("/api/esign/create", {
        user: "case_manager", method: "POST",
        body: { documentType: "mou", documentTitle: `${PREFIX}doc`, recipientName: "External Signer" },
      });
      check("staff can create a signature request", created.status === 200, `got ${created.status}`);
      inviteDocId = created.json?.id ?? null;
      const token: string | undefined = created.json?.signingToken;
      check("request carries a signing token", typeof token === "string" && token.length >= 32);

      if (inviteDocId && token) {
        const noToken = await call(`/api/esign/invite/${inviteDocId}`);
        check("invite without token → 404", noToken.status === 404, `got ${noToken.status}`);
        const badToken = await call(`/api/esign/invite/${inviteDocId}?token=deadbeef`);
        check("invite with wrong token → 404", badToken.status === 404, `got ${badToken.status}`);
        const good = await call(`/api/esign/invite/${inviteDocId}?token=${encodeURIComponent(token)}`);
        check("invite with valid token → 200 (no session)", good.status === 200, `got ${good.status}`);
        check("invite payload never echoes the token", !JSON.stringify(good.json).includes(token));
        const signed = await call(`/api/esign/invite/${inviteDocId}/sign`, {
          method: "POST",
          body: { token, signatureData: "data:image/png;base64,iVBORw0KGgo=" },
        });
        check("invitee can sign with valid token (no session)", signed.status === 200, `got ${signed.status}`);
      }
    }
    // ── 6. /api/auth/user exposes the server-resolved role ─────────────────
    // The client shows/hides staff-only controls (RequireAuth staffOnly, the
    // snapshot button on /platform-metrics) based on this role field — it must
    // match what the server's staff gates will actually grant.
    console.log("\nClient permission contract — GET /api/auth/user role field:");
    for (const role of ["student", "facilitator", "teacher"] as const) {
      const r = await call("/api/auth/user", { user: role });
      check(`${role} session → role "${role}" in payload`, r.status === 200 && r.json?.role === role,
        `got ${r.status} role=${r.json?.role}`);
    }
  } finally {
    server.close();
    if (inviteDocId) await db.delete(documentSignatures).where(eq(documentSignatures.id, inviteDocId));
    await db.delete(documentSignatures).where(like(documentSignatures.documentTitle, `${PREFIX}%`));
    await db.delete(academyAvatars).where(like(academyAvatars.userId, `${PREFIX}%`));
    await db.delete(users).where(like(users.id, `${PREFIX}%`));
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
