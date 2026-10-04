import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const INDICATORS = ["population", "median-income", "svi", "homeless-pit", "childcare-gap"];

async function expectProfile(page: import("@playwright/test").Page, labelPattern: RegExp) {
  await expect(page.getByTestId("text-cb-geography")).toContainText(labelPattern, { timeout: 60_000 });
  for (const id of INDICATORS) {
    await expect(page.getByTestId(`cb-indicator-${id}`)).toBeVisible();
    await expect(page.getByTestId(`cb-coverage-${id}`)).toHaveText(/observed|modeled|unavailable/);
  }
  await expect(page.getByTestId("cb-cra-lens")).toBeVisible();
  await expect(page.getByTestId("cb-live-tools")).toBeVisible();
  expect(await page.getByTestId("cb-ecosystem").locator("li").count()).toBeGreaterThan(5);
  await expect(page.getByTestId("cb-limits")).toContainText("No utilization, outcome, or return-on-investment");
  await expect(page.getByTestId("button-open-navigator").or(page.getByTestId("input-search-help"))).toHaveCount(0);
}

test("Central Texas default resolves to the Austin MSA without sign-in", async ({ page }) => {
  await page.goto(`${BASE}/community-banks`);
  await expectProfile(page, /Austin MSA/);
  await expect(page.getByTestId("cb-tool-check-benefits")).toHaveAttribute("href", /\/benefits-screener\?zip=48453/);
  await expect(page.getByTestId("cb-coverage-poverty-rate")).toHaveText("observed");
  await expect(page.getByTestId("cb-coverage-median-income")).toHaveText("modeled");
  // Every indicator is a real route, not a dead end.
  for (const id of [...INDICATORS, "poverty-rate"]) {
    const href = await page.getByTestId(`cb-indicator-${id}`).getAttribute("href");
    const res = await page.request.get(`${BASE}${href}`);
    expect(res.status(), `${href} should resolve`).toBeLessThan(400);
  }
});

test("same page serves Chicago and Philadelphia with coverage caveats", async ({ page }) => {
  await page.goto(`${BASE}/community-banks?place=Chicago%2C%20IL`);
  await expectProfile(page, /Cook County, IL/);
  await expect(page.getByTestId("cb-limits")).toContainText("Texas-only depth not shown");
  await page.getByTestId("input-cb-place").fill("Philadelphia, PA");
  await page.getByTestId("button-cb-place").click();
  await expect(page).toHaveURL(/place=Philadelphia/);
  await expectProfile(page, /Philadelphia County, PA/);
  await page.getByTestId("button-cb-default").click();
  await expectProfile(page, /Austin MSA/);
});

test("explicit county FIPS resolves to a single county with a published median", async ({ page }) => {
  const api = await page.request.get(`${BASE}/api/community-banks/profile?place=county%3A48491`);
  expect(api.status()).toBe(200);
  const body = await api.json();
  expect(body.geography.label).toMatch(/Williamson County, TX/);
  expect(body.indicators.find((i: { id: string }) => i.id === "median-income")?.coverage).toBe("observed");
  // A ZIP lookup for the same county must not overwrite the FIPS label through the cache.
  const zip = await (await page.request.get(`${BASE}/api/community-banks/profile?place=78664`)).json();
  expect(zip.geography.label).toMatch(/ZIP 78664/);
  const again = await (await page.request.get(`${BASE}/api/community-banks/profile?place=county%3A48491`)).json();
  expect(again.geography.label).toMatch(/Williamson County, TX$/);
  await page.goto(`${BASE}/community-banks?place=county%3A48491`);
  await expectProfile(page, /Williamson County, TX/);
});

test("unresolvable place fails closed with guidance and a 404 from the API", async ({ page }) => {
  const api = await page.request.get(`${BASE}/api/community-banks/profile?place=Nowhere%2C%20ZZ`);
  expect(api.status()).toBe(404);
  await page.goto(`${BASE}/community-banks?place=Nowhere%2C%20ZZ`);
  await expect(page.getByTestId("cb-error")).toContainText("ZIP code");
  await expect(page.getByTestId("cb-indicators")).toHaveCount(0);
});

test("fits a 360x640 phone: area control and first indicator reachable above bottom navigation", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`${BASE}/community-banks`);
  await expect(page.getByTestId("text-cb-geography")).toBeVisible({ timeout: 60_000 });
  const geometry = await page.getByTestId("input-cb-place").evaluate(el => {
    const r = el.getBoundingClientRect();
    const nav = document.querySelector('[data-testid="nav-bottom-tab-bar"]')?.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, floor: nav && nav.height > 0 ? nav.top : window.innerHeight };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.floor);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
