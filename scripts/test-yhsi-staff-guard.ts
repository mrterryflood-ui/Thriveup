// Integration tests for the YHSI staff guard (requireStaff) and the youth
// voice capability-token check — the full login-type matrix.
//
// Context: the first build shipped a session-only role check that silently
// locked out ALL staff (req.user.role is never populated by the auth layer;
// roles live in academy_avatars via storage.getUser). This script pins down
// the matrix so a regression is caught immediately:
//
//   anonymous          → 401 on staff routes
//   ordinary user      → 403 (has avatar, role=student)
//   session, no avatar → 403 (getUser returns undefined)
//   teacher            → 200
//   case_manager       → 200
//   admin              → 200
//
// Capability token (GET /api/yhsi/voice/:id, header x-voice-token only):
//   valid token, anonymous       → 200 (and accessToken never echoed)
//   missing/invalid/empty token  → 404 (existence not revealed)
//   wrong-length token           → 404
//   no token but staff session   → 200
//   no token, ordinary user      → 404
//
// Run: npx tsx scripts/test-yhsi-staff-guard.ts
// Exits non-zero on any failure. Uses the real DB (seeds prefixed test
// avatars + one voice entry, deletes them afterward).

import express, { type Request, type Response, type NextFunction } from "express";
import type { Server } from "http";
import { db } from "../server/storage";
import { academyAvatars, yhsiVoiceEntries } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { registerYhsiRoutes } from "../server/yhsi-routes";

const PREFIX = "yhsi-guard-test-";
const TEST_USERS: Array<{ id: string; role: string | null; label: string }> = [
  { id: `${PREFIX}student`, role: "student", label: "ordinary user (student avatar)" },
  { id: `${PREFIX}teacher`, role: "teacher", label: "teacher" },
  { id: `${PREFIX}case-manager`, role: "case_manager", label: "case manager" },
  { id: `${PREFIX}admin`, role: "admin", label: "admin" },
  { id: `${PREFIX}ghost`, role: null, label: "session with no DB record" }, // no avatar row seeded
];

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  // ── Seed test avatars (roles resolve through storage.getUser → academy_avatars)
  await db.delete(academyAvatars).where(like(academyAvatars.userId, `${PREFIX}%`));
  for (const u of TEST_USERS) {
    if (u.role) {
      await db.insert(academyAvatars).values({ userId: u.id, displayName: u.label, role: u.role });
    }
  }

  // ── App: same route module as production, with a test-only auth shim that
  // mimics the real auth layer exactly — it sets req.user = { claims: { sub } }
  // and NOTHING else (no role on the session — that is the whole point).
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const sub = req.header("x-test-user");
    if (sub) (req as any).user = { claims: { sub } };
    next();
  });
  registerYhsiRoutes(app);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

  const call = async (path: string, opts: { user?: string; token?: string; method?: string; body?: unknown } = {}) => {
    const headers: Record<string, string> = {};
    if (opts.user) headers["x-test-user"] = opts.user;
    if (opts.token !== undefined) headers["x-voice-token"] = opts.token;
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

  let voiceEntryId: string | null = null;
  try {
    // ── 1. Staff-guard matrix on a PII endpoint ──────────────────────────
    console.log("\nStaff guard matrix — GET /api/yhsi/participants (youth PII):");
    {
      const r = await call("/api/yhsi/participants");
      check("anonymous → 401", r.status === 401, `got ${r.status}`);
    }
    const expectations: Array<[string, number]> = [
      [`${PREFIX}student`, 403],
      [`${PREFIX}ghost`, 403],
      [`${PREFIX}teacher`, 200],
      [`${PREFIX}case-manager`, 200],
      [`${PREFIX}admin`, 200],
    ];
    for (const [user, want] of expectations) {
      const label = TEST_USERS.find((u) => u.id === user)!.label;
      const r = await call("/api/yhsi/participants", { user });
      check(`${label} → ${want}`, r.status === want, `got ${r.status}`);
    }

    // Same matrix on a second staff surface (voice review list) to confirm the
    // guard is applied uniformly, not per-route.
    console.log("\nStaff guard matrix — GET /api/yhsi/voice (staff review list):");
    {
      const r = await call("/api/yhsi/voice");
      check("anonymous → 401", r.status === 401, `got ${r.status}`);
    }
    for (const [user, want] of expectations) {
      const label = TEST_USERS.find((u) => u.id === user)!.label;
      const r = await call("/api/yhsi/voice", { user });
      check(`${label} → ${want}`, r.status === want, `got ${r.status}`);
    }

    // Write path: ordinary user must not be able to mutate youth records.
    console.log("\nStaff guard — write paths:");
    {
      const r = await call("/api/yhsi/participants", { user: `${PREFIX}student`, method: "POST", body: {} });
      check("ordinary user POST /participants → 403", r.status === 403, `got ${r.status}`);
      const r2 = await call("/api/yhsi/participants", { method: "POST", body: {} });
      check("anonymous POST /participants → 401", r2.status === 401, `got ${r2.status}`);
      const r3 = await call("/api/yhsi/hmis/export.csv", { user: `${PREFIX}student` });
      check("ordinary user GET /hmis/export.csv → 403", r3.status === 403, `got ${r3.status}`);
      const r4 = await call("/api/yhsi/metrics", { user: `${PREFIX}ghost` });
      check("no-DB-record session GET /metrics → 403", r4.status === 403, `got ${r4.status}`);
    }

    // Privilege escalation: a client-supplied avatar role must never grant a
    // privileged role. This exercises the exact sanitizer used by
    // POST /api/academy/avatar (server/roles.ts).
    console.log("\nRole escalation — client-supplied avatar roles are demoted:");
    {
      const { sanitizeAvatarRole } = await import("../server/roles");
      check("role=admin on create → student", sanitizeAvatarRole("admin", undefined) === "student", `got ${sanitizeAvatarRole("admin", undefined)}`);
      check("role=teacher on create → student", sanitizeAvatarRole("teacher", undefined) === "student", `got ${sanitizeAvatarRole("teacher", undefined)}`);
      check("role=case_manager on update keeps existing", sanitizeAvatarRole("case_manager", "student") === "student", `got ${sanitizeAvatarRole("case_manager", "student")}`);
      check("cosmetic role passes through", sanitizeAvatarRole("explorer", "student") === "explorer", `got ${sanitizeAvatarRole("explorer", "student")}`);
      check("admin-set teacher role survives cosmetic update", sanitizeAvatarRole(undefined, "teacher") === "teacher", `got ${sanitizeAvatarRole(undefined, "teacher")}`);
    }

    // ── 2. Capability token matrix ───────────────────────────────────────
    console.log("\nCapability token — GET /api/yhsi/voice/:id:");
    const created = await call("/api/yhsi/voice", {
      method: "POST",
      body: { body: "Guard-matrix test entry (safe to delete).", contributorAlias: "guard-test", livedExperience: false },
    });
    check("public voice create → 201 with one-time token", created.status === 201 && !!created.json?.accessToken, `got ${created.status}`);
    if (created.status !== 201) throw new Error("Cannot continue token matrix — voice create failed");
    const token: string = created.json.accessToken;
    voiceEntryId = created.json.entry.id as string;
    check("create response entry omits accessToken", !("accessToken" in created.json.entry));

    const vp = `/api/yhsi/voice/${voiceEntryId}`;
    {
      const r = await call(vp, { token });
      check("valid token, anonymous → 200", r.status === 200, `got ${r.status}`);
      check("response never echoes accessToken", r.json && !("accessToken" in r.json));
      const r2 = await call(vp);
      check("no token, anonymous → 404 (not 401/403 — existence hidden)", r2.status === 404, `got ${r2.status}`);
      const r3 = await call(vp, { token: "invalid-token-invalid-token-invalid1" });
      check("invalid same-length-ish token → 404", r3.status === 404, `got ${r3.status}`);
      const r4 = await call(vp, { token: "short" });
      check("wrong-length token → 404", r4.status === 404, `got ${r4.status}`);
      const r5 = await call(vp, { token: "" });
      check("empty token → 404", r5.status === 404, `got ${r5.status}`);
      const r6 = await call(vp, { user: `${PREFIX}case-manager` });
      check("no token but staff session → 200", r6.status === 200, `got ${r6.status}`);
      const r7 = await call(vp, { user: `${PREFIX}student` });
      check("no token, ordinary user session → 404", r7.status === 404, `got ${r7.status}`);
      const r8 = await call(vp, { user: `${PREFIX}ghost` });
      check("no token, no-DB-record session → 404", r8.status === 404, `got ${r8.status}`);
      const r9 = await call(vp, { token, user: `${PREFIX}student` });
      check("valid token wins even for non-staff session → 200", r9.status === 200, `got ${r9.status}`);
    }
  } finally {
    // ── Cleanup ──────────────────────────────────────────────────────────
    if (voiceEntryId) await db.delete(yhsiVoiceEntries).where(eq(yhsiVoiceEntries.id, voiceEntryId));
    await db.delete(academyAvatars).where(like(academyAvatars.userId, `${PREFIX}%`));
    server.close();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
