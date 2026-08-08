# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-role-access.spec.ts >> Shared auth helper role support >> admin-role forged session passes requireAdmin and requireStaff gates
- Location: tests/e2e/staff-role-access.spec.ts:44:3

# Error details

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, copyfile '/home/runner/workspace/test-results/.playwright-artifacts-1/traces/743980d02dd24072f0c2-1803437c0b41ea792a5b-recording9.network' -> '/home/runner/workspace/test-results/.playwright-artifacts-1/traces/743980d02dd24072f0c2-1803437c0b41ea792a5b-recording9-pwnetcopy-1.network'
```

# Test source

```ts
  1  | import { test, expect, request as pwRequest } from "@playwright/test";
  2  | import { Client } from "pg";
  3  | import {
  4  |   forgeSession,
  5  |   ensureTestUser,
  6  |   cleanupTestUser,
  7  |   requireEnv,
  8  | } from "./helpers/auth";
  9  | 
  10 | /**
  11 |  * Verifies the shared signed-in helper's role support: a forged session for a
  12 |  * user whose role was provisioned via ensureTestUser() must pass both role
  13 |  * gates on the platform — requireAdmin (server/routes.ts) and requireStaff
  14 |  * (server/yhsi-routes.ts) — which resolve roles from the DB, not the session.
  15 |  *
  16 |  * Run: npx playwright test tests/e2e/staff-role-access.spec.ts
  17 |  */
  18 | 
  19 | const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
  20 | const ADMIN_ID = "e2e-staff-role-admin";
  21 | const ADMIN_EMAIL = "e2e-staff-role-admin@test.local";
  22 | 
  23 | test.describe("Shared auth helper role support", () => {
  24 |   let db: Client;
  25 | 
  26 |   test.beforeAll(async () => {
  27 |     db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  28 |     await db.connect();
  29 |     await cleanupTestUser(db, ADMIN_ID);
  30 |     await ensureTestUser(db, {
  31 |       userId: ADMIN_ID,
  32 |       email: ADMIN_EMAIL,
  33 |       firstName: "E2E",
  34 |       lastName: "StaffRole",
  35 |       role: "admin",
  36 |     });
  37 |   });
  38 | 
  39 |   test.afterAll(async () => {
  40 |     await cleanupTestUser(db, ADMIN_ID);
  41 |     await db.end();
  42 |   });
  43 | 
  44 |   test("admin-role forged session passes requireAdmin and requireStaff gates", async () => {
  45 |     const cookie = await forgeSession(db, { userId: ADMIN_ID, email: ADMIN_EMAIL });
  46 |     const ctx = await pwRequest.newContext({
  47 |       baseURL: BASE,
  48 |       extraHTTPHeaders: { Cookie: cookie },
  49 |     });
  50 | 
  51 |     // requireAdmin gate (server/routes.ts)
  52 |     const adminRes = await ctx.get("/api/parent/support-alerts");
  53 |     expect(adminRes.status()).toBe(200);
  54 | 
  55 |     // requireStaff gate (server/yhsi-routes.ts) — staff-only participants list
  56 |     const staffRes = await ctx.get("/api/yhsi/participants");
  57 |     expect(staffRes.status()).toBe(200);
  58 | 
> 59 |     await ctx.dispose();
     |               ^ Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, copyfile '/home/runner/workspace/test-results/.playwright-artifacts-1/traces/743980d02dd24072f0c2-1803437c0b41ea792a5b-recording9.network' -> '/home/runner/workspace/test-results/.playwright-artifacts-1/traces/743980d02dd24072f0c2-1803437c0b41ea792a5b-recording9-pwnetcopy-1.network'
  60 |   });
  61 | 
  62 |   test("same endpoints reject anonymous requests", async () => {
  63 |     const anon = await pwRequest.newContext({ baseURL: BASE });
  64 |     expect((await anon.get("/api/parent/support-alerts")).status()).toBe(401);
  65 |     expect((await anon.get("/api/yhsi/participants")).status()).toBe(401);
  66 |     await anon.dispose();
  67 |   });
  68 | });
  69 | 
```