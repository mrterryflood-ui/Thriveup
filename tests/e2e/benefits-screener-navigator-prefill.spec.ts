import { test, expect, type Browser } from "@playwright/test";
import { Client } from "pg";
import {
  cleanupTestUser,
  ensureTestUser,
  forgeSession,
  requireEnv,
} from "./helpers/auth";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const TEST_USER_ID = "e2e-benefits-navigator-prefill";
const TEST_EMAIL = "e2e-benefits-navigator-prefill@test.local";
const CONVERSATION_ID = "e2e-benefits-navigator-prefill-conversation";

test.describe("Benefits Screener Navigator geography prefill", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, TEST_USER_ID);
    await db.query("DELETE FROM navigator_conversations WHERE id = $1", [CONVERSATION_ID]);
    await ensureTestUser(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "Benefits Navigator",
    });
    await db.query(
      `INSERT INTO navigator_conversations
        (id, user_id, title, identified_needs, user_context, last_message_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
      [
        CONVERSATION_ID,
        TEST_USER_ID,
        "Benefits location handoff",
        [],
        JSON.stringify({
          geography: { zip: "78660" },
          source: "navigator",
        }),
      ],
    );
  });

  test.afterAll(async () => {
    await db.query("DELETE FROM navigator_conversations WHERE id = $1", [CONVERSATION_ID]);
    await cleanupTestUser(db, TEST_USER_ID);
    await db.end();
  });

  async function openScreener(browser: Browser) {
    const cookie = await forgeSession(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "Benefits Navigator",
    });
    const context = await browser.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });
    const page = await context.newPage();
    await page.goto("/benefits-screener", { waitUntil: "domcontentloaded" });
    await page.getByTestId("button-next").click();
    await expect(page.getByTestId("step-household")).toBeVisible();
    return { context, page };
  }

  test("resolves Navigator ZIP context through prefill into state and county", async ({ browser }) => {
    const { context, page } = await openScreener(browser);

    await expect(page.getByTestId("banner-navigator-geography-prefill")).toBeVisible();
    await expect(page.getByTestId("select-state")).toContainText("Texas");
    await expect(page.getByTestId("select-county")).toContainText("Travis County");
    await expect(page.getByTestId("input-zip")).toHaveValue("78660");

    await context.close();

    const persisted = await db.query(
      "SELECT user_context FROM navigator_conversations WHERE id = $1",
      [CONVERSATION_ID],
    );
    expect(persisted.rows[0]?.user_context?.geography).toMatchObject({
      state: "TX",
      county: "48453",
      zip: "78660",
    });
  });

  test("does not overwrite location edits made while prefill is loading", async ({ browser }) => {
    const cookie = await forgeSession(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "Benefits Navigator",
    });
    const context = await browser.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });
    const page = await context.newPage();

    await page.route("**/api/navigator/prefill", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 750));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          hasContext: true,
          conversationTitle: "Delayed Navigator context",
          geography: { state: "TX", county: "48453", zip: "78660" },
        }),
      });
    });

    await page.goto("/benefits-screener", { waitUntil: "domcontentloaded" });
    await page.getByTestId("button-next").click();
    await expect(page.getByTestId("step-household")).toBeVisible();

    await page.getByTestId("select-state").click();
    await page.getByRole("option", { name: "Illinois" }).click();
    await page.getByTestId("input-zip").fill("60601");

    await expect(page.getByTestId("select-state")).toContainText("Illinois");
    await expect(page.getByTestId("input-zip")).toHaveValue("60601");

    await context.close();
  });
});