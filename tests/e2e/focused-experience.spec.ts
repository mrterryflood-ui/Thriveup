import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

/**
 * Focused-entry journey regression coverage. These tests are browser-only and
 * do not seed data, submit consent, visit protected staff data, or invoke AI.
 * Role assertions below are simulated UI states, not server-authorization tests.
 *
 * Manual run evidence (development app :5000, desktop 1440×980/mobile 390×844):
 * task benefits loaded after transient skeleton; the community impact workspace
 * rendered with source status “Unavailable”; funding and unknown guide journeys
 * stayed local; storage failure was non-fatal; mobile tabs/sidebar worked.
 * Screenshot evidence IDs from the browser run: benefits `ou1f17`, guided
 * funding confirmation `qbee0i`, unknown fallback `nvqsu0`, mobile `q4jofa`,
 * storage limitation `u8was1`, simulated teacher `qvihsc`. A normal iframe
 * attempt was blocked before app render by CSP `frame-ancestors 'none'`
 * (`ovrtmn`); the regular route itself retained its shell.
 * Some anonymous/upstream requests returned 401/unavailable, while
 * shell/navigation remained functional. Role assertions are mocks only.
 */

test("focused entry: tasks, workspaces, public tools, and scope", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto(BASE);
  await expect(page.locator('[data-testid^="home-task-"]')).toHaveCount(7);
  await expect(page.locator('[data-testid^="home-workspace-"]')).toHaveCount(4);

  await page.getByTestId("home-task-check-benefits").click();
  await expect(page).toHaveURL(/\/benefits-screener$/);
  await expect(page.getByTestId("header-workspace")).toHaveText("Residents & families");
  await expect(page.getByTestId("focused-nav-check-benefits")).toBeVisible();

  await page.getByTestId("focused-nav-change").click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(page.getByTestId("chooser-organizations")).toBeVisible();
  await page.getByTestId("chooser-organizations").click();
  await expect(page).toHaveURL(/\/workspace\/organizations$/);
  await expect(page.getByTestId("workspace-task-coordinate-services")).toBeVisible();
  await expect(page.getByTestId("workspace-task-organization-funding")).toBeVisible();
  await expect(page.getByTestId("focused-nav-organization-funding")).toHaveAttribute("href", "/hub/fund");
  await expect(page.getByTestId("workspace-switch")).toHaveAttribute("href", "/workspaces");
  await expect(page.getByTestId("workspace-signin-chw")).toContainText("Requires existing staff authorization");

  await page.getByTestId("workspace-switch").click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await page.getByTestId("chooser-organizations").click();
  await expect(page).toHaveURL(/\/workspace\/organizations$/);
  await page.getByTestId("focused-nav-tools").click();
  await page.getByTestId("tools-search").fill("scenarios");
  await expect(page.getByTestId("tool-link--community-impact")).toBeVisible();
  await page.getByTestId("tools-scope-workspace").click();
  await expect(page.getByTestId("tools-result-count")).toContainText("0 matching destinations");
  await page.getByTestId("tools-scope-all").click();
  await page.getByTestId("tools-search").fill("organizational funding");
  await expect(page.getByTestId("tool-link--hub-fund")).toBeVisible();
  await page.getByTestId("tools-scope-workspace").click();
  await expect(page.getByTestId("tools-scope-workspace")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("tools-search").fill("abracadabra-no-such-tool");
  await expect(page.getByTestId("tools-reset")).toBeVisible();
  await page.getByTestId("tools-reset").click();
});

test("workspace preference, original overview, and supported embed routes", async ({ page }) => {
  await page.goto(`${BASE}/workspace/organizations`);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("thriveup.workspace.v1"))).toBe("organizations");
  await page.reload();
  await expect(page.getByTestId("header-workspace")).toHaveText("Organizations & practitioners");

  await page.goto(`${BASE}/workspace/community`);
  await expect(page.getByTestId("header-workspace")).toHaveText("Community & policy");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("thriveup.workspace.v1"))).toBe("community");

  await page.goto(`${BASE}/platform-overview`);
  await expect(page.getByTestId("landing-page")).toBeVisible();
  await expect(page.getByTestId("text-hero-title")).toContainText(/Nobody should fall\s*through the cracks\./);
  await expect(page.getByTestId("focused-sidebar-home")).toBeVisible();

  await page.goto(`${BASE}/?embed=1`);
  await expect(page.getByTestId("focused-sidebar-home")).toHaveCount(0);
  await expect(page.getByTestId("guided-start-input")).toBeVisible();

  await page.goto(`${BASE}/ecosystem/embed`);
  await expect(page.getByTestId("focused-sidebar-home")).toHaveCount(0);
  await page.goto(`${BASE}/workspace/residents`);
  await expect(page.getByTestId("focused-sidebar-home")).toBeVisible();
});

test("focused guide stays local, clarifies funding, and resets stale decisions", async ({ page }) => {
  const requestDetails: string[] = [];
  page.on("request", (request) => requestDetails.push(`${request.url()} ${request.postData() ?? ""}`));
  await page.goto(BASE);

  await page.getByTestId("guided-start-input").fill("funding");
  await page.getByTestId("guided-start-submit").click();
  await expect(page.getByTestId("guided-start-choice-organization-funding")).toBeVisible();
  await page.getByTestId("guided-start-choice-organization-funding").click();
  await expect(page.getByTestId("guided-start-confirmation")).toContainText("Find organizational funding");
  await expect(page.getByTestId("guided-start-continue")).toHaveAttribute("href", "/hub/fund");
  await page.getByTestId("guided-start-continue").click();
  await expect(page).toHaveURL(/\/hub\/fund$/);
  const persisted = await page.evaluate(() => ({
    session: { ...sessionStorage },
    local: { ...localStorage },
  }));
  expect(JSON.stringify(persisted).toLowerCase()).not.toContain("funding");
  expect(requestDetails.join("\n").toLowerCase()).not.toContain("funding");
  await page.goto(BASE);
  await page.getByTestId("guided-start-input").fill("I need funding for my organization");
  await page.getByTestId("guided-start-submit").click();
  await expect(page.getByTestId("guided-start-choice-organization-funding")).toBeVisible();
  await page.getByTestId("guided-start-choice-organization-funding").click();
  await expect(page.getByTestId("guided-start-confirmation")).toContainText("Find organizational funding");
  await expect(page.getByTestId("guided-start-continue")).toHaveAttribute("href", "/hub/fund");

  await page.goto(BASE);
  await page.getByTestId("guided-start-input").fill("abracadabra");
  await page.getByTestId("guided-start-submit").click();
  await expect(page.getByTestId("guided-start-result")).toContainText("No direct match");
  await expect(page.getByTestId("guided-start-navigator")).toBeVisible();
  await page.getByTestId("guided-start-input").fill("food help");
  await expect(page.getByTestId("guided-start-result")).toHaveCount(0);
});

test("palette scopes to current workspace, opens by Enter, and closes by Escape", async ({ page }) => {
  await page.goto(`${BASE}/workspace/organizations`);
  await page.getByTestId("button-search-palette").click();
  await expect(page.getByTestId("dialog-command-palette")).toContainText("Current workspace");
  await page.getByTestId("input-command-search").fill("community impact");
  await expect(page.getByTestId("list-command-results")).toContainText("No results");
  await page.getByTestId("command-scope-toggle").click();
  await expect(page.getByTestId("item-command-community-impact-conductor")).toBeVisible();
  await page.getByTestId("input-command-search").press("Enter");
  await expect(page).toHaveURL(/\/community-impact$/);

  await page.getByTestId("button-search-palette").click();
  await page.getByTestId("input-command-search").press("Escape");
  await expect(page.getByTestId("dialog-command-palette")).toHaveCount(0);
});

test("anonymous private routes gate content and preserve returnTo", async ({ page }) => {
  for (const route of [
    "/my-journey",
    "/my-documents",
    "/my-appointments",
    "/chw-dashboard",
    "/case-manager",
  ]) {
    await page.goto(`${BASE}${route}`);
    await expect(page.getByTestId("button-auth-login")).toHaveAttribute(
      "href",
      `/api/login?returnTo=${encodeURIComponent(route)}`,
    );
    await expect(page.getByTestId("button-auth-home")).toHaveAttribute("href", "/");
  }
});

test("mobile tabs and sidebar navigation remain within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE);
  await expect(page.getByTestId("tab-start")).toBeVisible();
  await expect(page.getByTestId("tab-workspace")).toBeVisible();
  await expect(page.getByTestId("tab-tools")).toBeVisible();
  await page.getByTestId("tab-workspace").click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(page.getByTestId("tab-workspace")).toHaveAttribute("aria-current", "page");
  await page.getByTestId("button-sidebar-toggle").click();
  await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
  await page.getByTestId("focused-nav-tools").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("storage failures are non-fatal; student/teacher access states are simulated", async ({ browser }) => {
  const storageContext = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 980 } });
  await storageContext.addInitScript(() => {
    const fail = () => { throw new DOMException("Storage disabled", "SecurityError"); };
    Storage.prototype.getItem = fail;
    Storage.prototype.setItem = fail;
    Storage.prototype.removeItem = fail;
  });
  const storagePage = await storageContext.newPage();
  await storagePage.goto(`${BASE}/workspace/residents`);
  await expect(storagePage.getByText("Your browser could not save this preference.", { exact: false })).toBeVisible();
  await expect(storagePage.getByText("Residents & families", { exact: true }).first()).toBeVisible();
  await storageContext.close();

  async function simulatedRole(role: "student" | "teacher") {
    const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 980 } });
    const page = await context.newPage();
    await page.route("**/api/auth/user", (route) => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ id: `simulated-${role}`, role, isTcafAdmin: false }),
    }));
    await page.route("**/api/academy/avatar", (route) => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify({ role }),
    }));
    await page.route("**/api/attendance/log", (route) =>
      route.request().method() === "POST" ? route.fulfill({ status: 204 }) : route.continue(),
    );
    await page.goto(`${BASE}/workspace/organizations`);
    return { context, page };
  }

  const student = await simulatedRole("student");
  await expect(student.page.locator('[data-testid^="workspace-denied-"]')).toHaveCount(2);
  await student.page.goto(`${BASE}/tools`);
  await expect(student.page.locator('a[href="/chw-dashboard"], a[href="/case-manager"]')).toHaveCount(0);
  await student.context.close();

  const teacher = await simulatedRole("teacher");
  await expect(teacher.page.locator('a[href="/chw-dashboard"]').first()).toBeVisible();
  // Do not navigate to staff destinations: these are mock-only UI assertions.
  await teacher.context.close();
});