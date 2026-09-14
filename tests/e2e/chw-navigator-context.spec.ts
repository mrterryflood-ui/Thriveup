import { test, expect, type Browser } from "@playwright/test";
import { Client } from "pg";
import {
  cleanupTestUser,
  ensureTestUser,
  forgeSession,
  requireEnv,
} from "./helpers/auth";

/**
 * Regression coverage for the CHW referral modal's Navigator handoff.
 *
 * The browser session is forged only at the Replit OIDC sign-in boundary. The
 * modal, Navigator context query, and referral submission all use the real UI
 * and client request code; only the Navigator/referral responses and unrelated
 * dashboard registry data are mocked so this test stays deterministic and does
 * not create referral rows.
 *
 * Run: npx playwright test tests/e2e/chw-navigator-context.spec.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const TEST_USER_ID = "e2e-chw-navigator-context";
const TEST_EMAIL = "e2e-chw-navigator-context@test.local";

const CONTEXT_WITH_SESSION = {
  hasContext: true,
  latestConversationId: "navigator-conversation-e2e-402",
  latestTitle: "Finding housing and food support",
  latestAt: "2026-09-14T12:00:00.000Z",
  identifiedNeeds: ["Housing stability", "Food assistance"],
  geography: { city: "Austin", state: "TX", zip: "78753" },
  conversationCount: 1,
};

const CONTEXT_WITHOUT_SESSION = {
  hasContext: false,
  latestConversationId: null,
  latestTitle: null,
  latestAt: null,
  identifiedNeeds: [],
  geography: null,
  conversationCount: 0,
};

test.describe("CHW referral Navigator context", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, TEST_USER_ID);
    await ensureTestUser(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "CHW Navigator",
      role: "case_manager",
    });
  });

  test.afterAll(async () => {
    await cleanupTestUser(db, TEST_USER_ID);
    await db.end();
  });

  async function openReferralModal(
    browser: Browser,
    contextFixture: typeof CONTEXT_WITH_SESSION | typeof CONTEXT_WITHOUT_SESSION,
  ) {
    const cookie = await forgeSession(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "CHW Navigator",
    });
    const context = await browser.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });
    const page = await context.newPage();

    await page.route("**/api/navigator/context", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contextFixture),
      });
    });
    // Keep unrelated dashboard demo/live resource rendering out of this
    // modal-focused test. The current development resource fixture contains a
    // null phone field that is unrelated to the Navigator handoff.
    await page.route("**/api/chw/resources", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          resources: [{
            id: "e2e-resource-402",
            name: "E2E Resource",
            category: "support",
            description: "Test resource",
            address: "E2E",
            phone: "555-0100",
            hours: "Test hours",
            website: null,
            acceptingClients: true,
          }],
          isLive: false,
        }),
      });
    });
    await page.route("**/api/directory/capacity", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ orgs: [] }),
      });
    });

    await page.goto("/chw-dashboard");
    await expect(page.getByTestId("chw-dashboard-page")).toBeVisible();
    const contextResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/navigator/context") &&
        response.request().method() === "GET",
    );
    await page.getByTestId("button-new-referral").click();
    await expect(page.getByTestId("dialog-new-referral")).toBeVisible();
    await contextResponse;

    return { context, page };
  }

  test("shows needs and geography from an existing Navigator session and forwards its conversation id", async ({
    browser,
  }) => {
    const { context, page } = await openReferralModal(
      browser,
      CONTEXT_WITH_SESSION,
    );
    let referralBody: Record<string, unknown> | undefined;

    await page.route("**/api/referrals", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      referralBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          referral: {
            id: "referral-e2e-402-with-context",
            status: "sent",
            programCode: "HOUSING-E2E-402",
            orgName: "E2E Housing Partner",
          },
          statusUrl: "/status/status-token-e2e-402-with-context",
          orgConfirmUrl: "/org-confirm/org-token-e2e-402-with-context",
        }),
      });
    });

    const dialog = page.getByTestId("dialog-new-referral");
    const panel = dialog.getByTestId("navigator-context-panel");
    const panelBody = dialog.getByTestId("navigator-context-body");
    await expect(panel).toBeVisible();
    await expect(panelBody).toBeVisible();
    await expect(panelBody).toContainText("Housing stability");
    await expect(panelBody).toContainText("Food assistance");
    await expect(panelBody).toContainText("Austin, TX, 78753");
    await expect(
      dialog.getByTestId("button-insert-navigator-location"),
    ).toBeVisible();

    await page.getByTestId("input-referral-notes").fill("Prior context from CHW");
    await page.getByTestId("button-insert-navigator-location").click();
    await expect(page.getByTestId("input-referral-notes")).toHaveValue(
      "Prior context from CHW\nClient-reported location: Austin, TX, 78753",
    );
    await expect(
      dialog.getByTestId("button-insert-navigator-location"),
    ).toHaveCount(0);

    await page.getByTestId("input-program-code").fill("HOUSING-E2E-402");
    await page.getByTestId("input-org-name").fill("E2E Housing Partner");
    await page.getByTestId("button-submit-referral").click();
    await expect(page.getByTestId("referral-result")).toBeVisible();
    await expect(page.getByTestId("text-status-url")).toHaveValue(
      "/status/status-token-e2e-402-with-context",
    );
    await expect(page.getByTestId("text-org-confirm-url")).toHaveValue(
      "/org-confirm/org-token-e2e-402-with-context",
    );

    expect(referralBody).toMatchObject({
      programCode: "HOUSING-E2E-402",
      orgName: "E2E Housing Partner",
      navigatorConversationId: CONTEXT_WITH_SESSION.latestConversationId,
    });
    expect(referralBody?.notes).toBe(
      "Prior context from CHW\nClient-reported location: Austin, TX, 78753",
    );
    await context.close();
  });

  test("keeps the Navigator panel hidden and omits its id when no session exists", async ({
    browser,
  }) => {
    const { context, page } = await openReferralModal(
      browser,
      CONTEXT_WITHOUT_SESSION,
    );
    let referralBody: Record<string, unknown> | undefined;

    await page.route("**/api/referrals", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      referralBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          referral: {
            id: "referral-e2e-402-without-context",
            status: "sent",
            programCode: "FOOD-E2E-402",
            orgName: "E2E Food Partner",
          },
          statusUrl: "/status/status-token-e2e-402-without-context",
          orgConfirmUrl: "/org-confirm/org-token-e2e-402-without-context",
        }),
      });
    });

    const dialog = page.getByTestId("dialog-new-referral");
    await expect(dialog.getByTestId("navigator-context-panel")).toHaveCount(0);

    await page.getByTestId("input-program-code").fill("FOOD-E2E-402");
    await page.getByTestId("input-org-name").fill("E2E Food Partner");
    await page.getByTestId("button-submit-referral").click();
    await expect(page.getByTestId("referral-result")).toBeVisible();

    expect(referralBody).toMatchObject({
      programCode: "FOOD-E2E-402",
      orgName: "E2E Food Partner",
    });
    expect(referralBody).not.toHaveProperty("navigatorConversationId");
    await context.close();
  });

  test("does not expose unrelated numbers as Navigator prefill geography", async ({
    browser,
  }) => {
    const cookie = await forgeSession(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "CHW Navigator",
    });
    const conversationId = "e2e-chw-navigator-prefill-403";
    await db.query("DELETE FROM navigator_conversations WHERE user_id = $1", [
      TEST_USER_ID,
    ]);
    await db.query(
      `INSERT INTO navigator_conversations
        (id, user_id, title, identified_needs, user_context, last_message_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
      [
        conversationId,
        TEST_USER_ID,
        "Income and case information",
        [],
        null,
      ],
    );

    const context = await browser.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });
    const page = await context.newPage();

    try {
      await page.goto("/");
      const noLocation = await page.evaluate(async () => {
        const response = await fetch("/api/navigator/prefill");
        return { status: response.status, body: await response.json() };
      });
      expect(noLocation.status).toBe(200);
      expect(noLocation.body).toMatchObject({
        hasContext: true,
        conversationId,
        geography: null,
      });

      await db.query(
        `UPDATE navigator_conversations
         SET user_context = $1::jsonb
         WHERE id = $2`,
        [
          JSON.stringify({
            geography: {
              zip: "5000",
              notes: "must not cross the prefill boundary",
            },
          }),
          conversationId,
        ],
      );
      const malformedLocation = await page.evaluate(async () => {
        const response = await fetch("/api/navigator/prefill");
        return { status: response.status, body: await response.json() };
      });
      expect(malformedLocation.status).toBe(200);
      expect(malformedLocation.body.geography).toBeNull();
    } finally {
      await context.close();
      await db.query(
        "DELETE FROM navigator_conversations WHERE id = $1",
        [conversationId],
      );
    }
  });
});