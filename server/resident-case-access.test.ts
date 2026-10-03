import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Request, Response } from "express";
import { storage } from "./storage";
import { requireStaff } from "./yhsi-routes";

test("case-review route is guarded before loading any participant data", () => {
  const source = readFileSync("server/resident-journey.ts", "utf8");
  assert.ok(source.includes('app.get("/api/case-manager/:id/risk-chain", requireStaff, async'));
  const app = readFileSync("client/src/App.tsx", "utf8");
  for (const path of ["/case-manager", "/case-manager/:id", "/chw-dashboard"]) {
    assert.ok(app.includes(`<Route path="${path}"><RequireAuth staffOnly`), path);
  }
});

test("case review uses persisted staff-role authorization, never a supplied role", async t => {
  async function verify(userId: string | undefined, role: string | undefined, expected: number) {
    const lookup = mock.method(storage, "getUser", async (id: string) => {
      assert.equal(id, userId);
      return role ? { role } as Awaited<ReturnType<typeof storage.getUser>> : undefined;
    });
    let status = 200;
    let advanced = false;
    const req = { user: userId ? { claims: { sub: userId }, role: "admin" } : undefined } as unknown as Request;
    const res = {
      status(code: number) { status = code; return this; },
      json() { return this; },
    } as unknown as Response;
    try {
      await requireStaff(req, res, () => { advanced = true; });
      assert.equal(status, expected);
      assert.equal(advanced, expected === 200);
      assert.equal(lookup.mock.callCount(), userId ? 1 : 0);
    } finally { lookup.mock.restore(); }
  }
  await t.test("anonymous is denied before DB access", () => verify(undefined, undefined, 401));
  await t.test("student cannot claim an admin role", () => verify("fixture", "student", 403));
  await t.test("missing persisted role fails closed", () => verify("fixture", undefined, 403));
  for (const role of ["admin", "teacher", "case_manager", "facilitator", "staff"]) {
    await t.test(`${role} is admitted`, () => verify("fixture", role, 200));
  }
});