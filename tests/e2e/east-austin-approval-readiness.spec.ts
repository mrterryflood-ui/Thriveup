import { expect, request as pwRequest, test } from "@playwright/test";
import { Client } from "pg";
import { cleanupTestUser, ensureTestUser, forgeSession, requireEnv } from "./helpers/auth";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const STAFF_ID = "e2e-east-austin-staff";
const STUDENT_ID = "e2e-east-austin-student";

test.describe("East Austin approval-readiness workspace", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, STAFF_ID);
    await cleanupTestUser(db, STUDENT_ID);
    await ensureTestUser(db, { userId: STAFF_ID, email: "e2e-east-austin-staff@test.local", role: "staff" });
    await ensureTestUser(db, { userId: STUDENT_ID, email: "e2e-east-austin-student@test.local", role: "student" });
  });

  test.afterAll(async () => {
    await db.query(`DELETE FROM east_austin_readiness_sources WHERE created_by_user_id = $1`, [STAFF_ID]);
    await db.query(`DELETE FROM east_austin_readiness_tabletops WHERE created_by_user_id = $1`, [STAFF_ID]);
    await db.query(`DELETE FROM east_austin_readiness_audit_events WHERE actor_user_id = $1`, [STAFF_ID]);
    await cleanupTestUser(db, STAFF_ID);
    await cleanupTestUser(db, STUDENT_ID);
    await db.end();
  });

  test("fails closed for anonymous and non-staff callers, while staff receives six blocked gates", async () => {
    const anonymous = await pwRequest.newContext({ baseURL: BASE });
    expect((await anonymous.get("/api/east-austin/readiness")).status()).toBe(401);
    await anonymous.dispose();

    const studentCookie = await forgeSession(db, { userId: STUDENT_ID, email: "e2e-east-austin-student@test.local" });
    const student = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Cookie: studentCookie } });
    expect((await student.get("/api/east-austin/readiness")).status()).toBe(403);
    await student.dispose();

    const staffCookie = await forgeSession(db, { userId: STAFF_ID, email: "e2e-east-austin-staff@test.local" });
    const staff = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Cookie: staffCookie } });
    const response = await staff.get("/api/east-austin/readiness");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("private");
    const body = await response.json();
    expect(body.packet.boundaryStatus).toBe("provisional");
    expect(body.gates).toHaveLength(6);
    expect(body.gates.every((gate: { effectiveStatus: string }) => gate.effectiveStatus === "blocked")).toBe(true);
    expect(body.safeguards.noParticipantIntake).toBe(true);
    await staff.dispose();
  });

  test("rejects unsupported approval transitions and accepts a bounded source record", async () => {
    const staffCookie = await forgeSession(db, { userId: STAFF_ID, email: "e2e-east-austin-staff@test.local" });
    const staff = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Cookie: staffCookie } });
    const workspace = await staff.get("/api/east-austin/readiness");
    expect(workspace.status()).toBe(200);
    const currentGate = (await workspace.json()).gates.find((gate: { gateKey: string }) => gate.gateKey === "authorization");
    const rejected = await staff.patch("/api/east-austin/readiness/gates/authorization", {
      data: { status: "approved", classification: "approval_record", expectedUpdatedAt: currentGate.updatedAt },
    });
    expect(rejected.status()).toBe(409);
    const rejectedBody = await rejected.json();
    expect(rejectedBody.error).toMatch(/invalid readiness transition/i);
    expect(JSON.stringify(rejectedBody)).not.toMatch(/stack|select |insert |password|secret/i);

    const source = await staff.post("/api/east-austin/readiness/sources", {
      data: {
        sourceTitle: "E2E bounded public evidence record",
        sourceType: "public_evidence",
        geography: "East Austin — provisional",
        vintage: "2026 planning screen",
        permittedUse: "Private planning review only.",
        applicability: "related_setting_limited",
        limitations: "Not evidence of Austin effectiveness or approval.",
        sourceReference: "E2E test reference",
        sourceUrl: "https://example.com/evidence",
        correctsSourceId: null,
      },
    });
    expect(source.status()).toBe(201);
    const sourceBody = await source.json();
    expect(sourceBody.source.sourceTitle).toBe("E2E bounded public evidence record");
    expect(sourceBody.source.createdByUserId).toBe(STAFF_ID);
    await staff.dispose();
  });

  test("staff UI makes the mapped operating surfaces visible without claiming approval", async ({ page }) => {
    await page.route("**/api/auth/user", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: STAFF_ID, role: "staff" }) });
    });
    await page.route("**/api/east-austin/readiness", async (route) => {
      const gates = Array.from({ length: 6 }, (_, index) => ({
        id: `gate-${index}`,
        gateKey: `gate-${index}`,
        label: `Gate ${index + 1}`,
        requiredDecision: "A named decision is required.",
        status: "blocked",
        effectiveStatus: "blocked",
        classification: "planning_only",
        namedApprover: null,
        decisionRecord: null,
        reviewedAt: null,
        revalidateAt: null,
        notes: null,
        updatedAt: new Date().toISOString(),
      }));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          packet: {
            title: "East Austin Community Bridge",
            planningState: "approval_readiness",
            boundaryStatus: "provisional",
            boundaryLabel: "East Austin six-square territory — provisional",
            boundarySource: "Not yet recorded",
            boundaryMethod: "Not yet recorded",
            baselineMethod: "Not yet recorded",
            dataVintage: "Not yet recorded",
            stakeholderCategories: ["youth", "family", "community", "provider", "HBCU", "funder"],
            stakeholderSettings: ["inner setting", "outer setting"],
          },
          gates,
          sources: [],
          tabletops: [],
          auditEvents: [],
          safeguards: { planningOnly: true, noParticipantIntake: true, noPartnerDataImport: true, noPublicClassification: true, noPublication: true },
        }),
      });
    });
    await page.goto("/austin-community-bridge/readiness");
    await expect(page.getByTestId("east-austin-approval-readiness")).toBeVisible();
    await expect(page.getByTestId("east-austin-operating-surfaces")).toBeVisible();
    await expect(page.getByRole("link", { name: /map conditions by location/i })).toHaveAttribute("href", "/community-map");
    await expect(page.getByRole("link", { name: /compare states and disparities/i })).toHaveAttribute("href", "/equity-loss/national");
    await expect(page.getByText(/No pilot execution, recruitment, referral operations/i)).toBeVisible();
  });
});