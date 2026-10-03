import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const ACTIONS = ["home-task-find-support", "home-task-check-benefits", "home-task-learn-work", "home-guide-toggle"];

async function assertFirstScreen(page: Page) {
  for (const id of ACTIONS) {
    await expect(page.getByTestId(id)).toBeVisible();
    const geometry = await page.getByTestId(id).evaluate(el => {
      const r = el.getBoundingClientRect();
      const main = document.getElementById("main-content")?.getBoundingClientRect();
      const nav = document.querySelector('[data-testid="nav-bottom-tab-bar"]')?.getBoundingClientRect();
      const floor = nav && nav.height > 0 ? nav.top : window.innerHeight;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height,
        ceiling: main?.top ?? 0, floor, width: window.innerWidth,
        clickable: Boolean(hit && (hit === el || el.contains(hit))),
      };
    });
    expect(geometry.top, `${id} above app header`).toBeGreaterThanOrEqual(geometry.ceiling);
    expect(geometry.bottom, `${id} hidden by bottom navigation`).toBeLessThanOrEqual(geometry.floor);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.width);
    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(geometry.clickable, `${id} covered by another control`).toBe(true);
  }
}

for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`real starting actions fit the first ${viewport.width}x${viewport.height} screen`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(BASE);
    await expect(page.locator('[data-testid^="home-task-"]')).toHaveCount(3);
    await assertFirstScreen(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByTestId("guided-start-input")).toHaveCount(0);
    await expect(page.getByTestId("home-workspace-organizations")).toHaveAttribute("href", "/workspace/organizations");
    await expect(page.getByTestId("home-workspace-funders")).toHaveAttribute("href", "/workspace/funders");
    await expect(page.getByTestId("home-workspace-community")).toHaveAttribute("href", "/workspace/community");
    // Return preferences must not push a fresh visit's task actions below the fold.
    await page.evaluate(() => sessionStorage.setItem("thriveup.workspace.v1", "organizations"));
    await page.reload();
    await assertFirstScreen(page);
  });
}

test("one visitor can activate support, benefits and learning without an account or a dead end", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE);
  await page.getByTestId("home-task-find-support").click();
  await expect(page).toHaveURL(/\/get-help$/);
  await page.getByTestId("task-start-show").click();
  await expect(page.getByTestId("input-search-help")).toBeFocused();
  await page.getByTestId("input-search-help").fill("housing");
  await page.getByTestId("button-category-housing").click();
  await expect(page.locator("a").filter({ has: page.getByTestId("link-service-hud-resource-locator") })).toHaveAttribute("href", "https://resources.hud.gov/");
  await page.getByTestId("task-start-change").click();
  await expect(page.locator("#home-title")).toBeFocused();
  await page.getByTestId("home-task-check-benefits").click();
  await expect(page).toHaveURL(/\/benefits-screener$/);
  await expect(page.getByTestId("task-start-instruction")).toContainText("not an eligibility determination");
  await page.getByTestId("task-start-show").click();
  await expect(page.getByTestId("button-next")).toBeFocused();
  await page.getByTestId("button-next").click();
  await expect(page.getByTestId("input-zip")).toBeVisible();
  await page.getByTestId("task-start-change").click();
  await page.getByTestId("home-task-learn-work").click();
  await expect(page).toHaveURL(/\/academy$/);
  await expect(page.getByTestId("onboarding-dialog")).toHaveCount(0);
  await page.getByTestId("task-start-show").click();
  await expect(page.getByTestId("link-building-learning-center")).toBeFocused();
  await page.getByTestId("button-open-academy-orientation").click();
  await expect(page.getByTestId("onboarding-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByTestId("onboarding-dialog")).toHaveCount(0);
  await expect(page.getByTestId("link-building-learning-center")).toHaveAttribute("href", "/academy/lessons");
  await page.getByTestId("task-start-dismiss").click();
  await expect(page.getByTestId("task-start-hint")).toHaveCount(0);
  await expect(page.getByTestId("link-building-learning-center")).toBeFocused();
  await page.getByTestId("tab-start").click();
  await page.getByTestId("home-task-find-support").click();
  await expect(page.getByTestId("task-start-hint")).toBeVisible();
});

test("canonical and embed entries preserve activation without competing floating helpers", async ({ page }) => {
  for (const route of ["/get-help", "/benefits-screener", "/academy"]) {
    for (const suffix of ["", "?embed=1"]) {
      await page.goto(`${BASE}${route}${suffix}`);
      await expect(page.getByTestId("task-start-hint")).toBeVisible();
      await expect(page.getByTestId("button-open-navigator")).toHaveCount(0);
      await expect(page.getByTestId("contextual-help-trigger")).toHaveCount(0);
      await expect(page.getByTestId("contextual-help-restore")).toHaveCount(0);
    }
  }
});

test("optional guide is reachable, keyboard-focused, resettable and local-only", async ({ page }) => {
  const sentinel = "funding for my organization private-test-sentinel";
  const requests: string[] = [];
  page.on("request", r => requests.push(`${r.url()} ${r.postData() ?? ""}`));
  await page.goto(BASE);
  await page.getByTestId("home-guide-toggle").click();
  await expect(page.getByTestId("home-guide-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("guided-start-input")).toBeFocused();
  await page.getByTestId("guided-start-input").fill(sentinel);
  await page.getByTestId("guided-start-submit").click();
  await page.getByTestId("guided-start-choice-organization-funding").click();
  await expect(page.getByTestId("guided-start-continue")).toHaveAttribute("href", "/hub/fund");
  await page.getByTestId("home-guide-toggle").click();
  await expect(page.getByTestId("home-guide-toggle")).toBeFocused();
  await page.getByTestId("home-guide-toggle").click();
  await expect(page.getByTestId("guided-start-input")).toHaveValue("");
  expect(requests.join("\n")).not.toContain("private-test-sentinel");
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain("private-test-sentinel");
});

test("professional workspaces expose a real first task on a small phone while preserving role gates", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  for (const [workspace, task] of [["organizations", "coordinate-services"], ["funders", "evaluate"], ["community", "community-analysis"]]) {
    await page.goto(`${BASE}/workspace/${workspace}`);
    const start = page.getByTestId(`workspace-task-${task}`);
    await expect(start).toBeVisible();
    const position = await start.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, nav: document.querySelector('[data-testid="nav-bottom-tab-bar"]')!.getBoundingClientRect().top };
    });
    expect(position.top).toBeGreaterThanOrEqual(0);
    expect(position.bottom, `${workspace} card clips fixed navigation`).toBeLessThanOrEqual(position.nav);
  }
  await page.goto(`${BASE}/workspace/organizations`);
  await expect(page.getByTestId("workspace-signin-chw")).toContainText("Requires existing staff authorization");
  await expect(page.getByTestId("workspace-login-chw")).toHaveAttribute("href", "/api/login?returnTo=%2Fchw-dashboard");
});

test("learning handoff exposes actual lesson content before optional background without phone overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`${BASE}/academy/lessons`);
  const first = page.locator('[data-testid^="card-lesson-"]').first();
  await expect(first).toBeVisible();
  const skill = first.locator('[data-testid^="text-life-skill-"]');
  const geometry = await skill.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, nav: document.querySelector('[data-testid="nav-bottom-tab-bar"]')!.getBoundingClientRect().top };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.nav);
  await expect(page.getByTestId("lesson-filter-select")).toBeVisible();
  await expect(page.getByTestId("section-parallel-universe")).not.toBeVisible();
  for (const id of ["button-open-navigator", "contextual-help-trigger", "contextual-help-restore"]) {
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
  await page.getByTestId("lesson-filter-select").selectOption("stocks");
  await expect(page.locator('[data-testid^="card-lesson-"]')).not.toHaveCount(0);
  await page.getByText("The Parallel Universe", { exact: false }).click();
  await expect(page.getByTestId("mapping-stocks")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  expect(await page.locator("#main-content").evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(360);
});