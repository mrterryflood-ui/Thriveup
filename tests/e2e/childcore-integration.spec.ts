import { test, expect, type Browser } from "@playwright/test";
import { Client } from "pg";
import {
  ensureTestUser,
  cleanupTestUser,
  forgeSession,
  requireEnv,
} from "./helpers/auth";

/**
 * Authenticated browser proof for the protected ChildCORE monitoring page.
 *
 * The real app session is forged through the shared helper because Replit OIDC
 * sign-in is not scriptable. The status endpoint is intercepted only to prove
 * the two user-visible contract states without depending on ChildCORE uptime.
 *
 * Run: npx playwright test tests/e2e/childcore-integration.spec.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const TEST_USER_ID = "e2e-childcore-dashboard-admin";
const TEST_EMAIL = "e2e-childcore-dashboard-admin@test.local";
const HEALTHY_BASE_URL = "https://configured-childcore.example/api/v1";
const HEALTHY_DOCS_URL = "https://docs.example/partner-api";

test.describe("ChildCORE integration dashboard destinations", () => {
  let db: Client;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, TEST_USER_ID);
    await ensureTestUser(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "ChildCORE",
      role: "admin",
    });
    await db.query(
      `UPDATE users SET is_tcaf_admin = true WHERE id = $1`,
      [TEST_USER_ID],
    );
  });

  test.afterAll(async () => {
    await cleanupTestUser(db, TEST_USER_ID);
    await db.end();
  });

  async function openAuthenticatedPage(
    browser: Browser,
    statusResponse: { status: number; body: Record<string, unknown> },
  ) {
    const cookie = await forgeSession(db, {
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      firstName: "E2E",
      lastName: "ChildCORE",
    });
    const context = await browser.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Cookie: cookie },
    });
    const page = await context.newPage();
    let statusRequests = 0;

    await page.route("**/api/childcore/status", async (route) => {
      statusRequests += 1;
      await route.fulfill({
        status: statusResponse.status,
        contentType: "application/json",
        body: JSON.stringify(statusResponse.body),
      });
    });
    await page.route("**/api/childcore/ping", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          reachable: true,
          authenticated: true,
          configured: true,
          service: "ChildCORE",
          version: "e2e",
          latencyMs: 1,
        }),
      });
    });
    await page.route("**/api/childcore/capabilities", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ keyActive: true, scopes: [] }),
      });
    });

    await page.goto("/childcore-integration");
    return { context, page, getStatusRequestCount: () => statusRequests };
  }

  test("keeps the protected page usable and explains unavailable destinations", async ({
    browser,
  }) => {
    const { context, page, getStatusRequestCount } = await openAuthenticatedPage(
      browser,
      {
        status: 503,
        body: { error: "Status probe failed", baseUrl: null, docsUrl: null },
      },
    );

    await expect(page.getByTestId("childcore-integration-page")).toBeVisible();
    await expect(page.getByTestId("text-childcore-upstream")).toHaveText(
      "API: unavailable",
    );
    await expect(
      page.getByTestId("text-childcore-header-docs-unavailable"),
    ).toHaveText("Partner API docs unavailable");
    await expect(
      page.getByTestId("text-childcore-metadata-unavailable"),
    ).toHaveText("Integration metadata unavailable.");
    await expect(
      page.getByTestId("text-childcore-docs-unavailable"),
    ).toHaveText("ChildCORE API docs unavailable.");
    await expect(page.getByTestId("tabs-childcore")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("useful-viper-536");
    await expect(page.locator("body")).not.toContainText("childcore.app/docs");
    expect(getStatusRequestCount()).toBeGreaterThan(0);

    await page.getByTestId("tab-data-preview").click();
    await expect(page.getByTestId("tab-data-preview")).toHaveAttribute(
      "data-state",
      "active",
    );

    await context.close();
  });

  test("renders the configured host and external documentation link when healthy", async ({
    browser,
  }) => {
    const { context, page } = await openAuthenticatedPage(browser, {
      status: 200,
      body: {
        baseUrl: HEALTHY_BASE_URL,
        docsUrl: HEALTHY_DOCS_URL,
      },
    });

    await expect(page.getByTestId("text-childcore-upstream")).toHaveText(
      "API: configured-childcore.example",
    );
    const headerDocs = page.getByRole("link", { name: "Partner API docs" });
    await expect(headerDocs).toHaveAttribute("href", HEALTHY_DOCS_URL);
    const connectionDocs = page.getByRole("link", { name: "ChildCORE API docs" });
    await expect(connectionDocs).toHaveAttribute("href", HEALTHY_DOCS_URL);
    await expect(
      page.getByTestId("text-childcore-header-docs-unavailable"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("text-childcore-metadata-unavailable"),
    ).not.toBeVisible();

    await context.close();
  });
});