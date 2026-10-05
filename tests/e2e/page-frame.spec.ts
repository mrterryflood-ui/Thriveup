import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { NavRoute } from "../../shared/route-nav";

// Playwright's Node ESM loader requires JSON import attributes; read the manifest directly.
const manifest = JSON.parse(readFileSync("shared/route-nav.generated.json", "utf8")) as NavRoute[];

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
test.setTimeout(90_000);

test("G3 rail reads registry outcomes and only exposes public next steps", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of ["/get-help", "/academy", "/workforce", "/partners", "/community-banks", "/methodology"]) {
    const row = manifest.find(r => r.path === path)!;
    expect(row).toBeTruthy();
    await page.goto(`${BASE}${path}`);
    await expect(page.getByTestId("page-frame")).toHaveAttribute("data-outcome", row.outcome);
    await expect(page.getByTestId("page-frame-guide")).toHaveText(row.guide);
    const links = page.locator('[data-testid^="page-frame-next-"]');
    for (const href of await links.evaluateAll(nodes => nodes.map(n => n.getAttribute("href")!))) {
      expect(manifest.find(r => r.path === href)?.access).toBe("public");
      expect((await request.get(`${BASE}${href}`)).status()).toBe(200);
    }
  }
  await page.goto(`${BASE}/`);
  await expect(page.getByTestId("page-frame")).toHaveCount(0);
  await page.goto(`${BASE}/get-help?embed=1`);
  await expect(page.getByTestId("page-frame")).toHaveCount(0);
});

test("phone rail defaults collapsed, is keyboard operable and persists only an explicit choice", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(`${BASE}/get-help`);
  const toggle = page.getByTestId("page-frame-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("page-frame-guide")).toBeVisible();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("map API keeps county scope, rejects malformed selectors and requires auth for journey context", async ({ request }) => {
  for (const query of ["city=Austin", "city=Austin&state=ZZ", "counties=48453,06037", "counties=00000", "counties=48453&state=CA", "counties=48453,garbage"]) {
    expect((await request.get(`${BASE}/api/community-gravity/map?${query}`)).status()).toBe(400);
  }
  expect((await request.get(`${BASE}/api/community-gravity/context`)).status()).toBe(401);
  const county = await request.get(`${BASE}/api/community-gravity/map?counties=48453&state=TX`);
  expect(county.status()).toBe(200);
  const data = await county.json();
  expect(data.need.counties.map((c: { fips: string }) => c.fips)).toEqual(["48453"]);
  expect(data.need.counties[0].lat).toBeCloseTo(30.23951, 3);
  expect(data.resources.source).toContain("not independently verified");
});

test("gravity map is explicitly opened and renders real ZIP clusters with an accessible twin", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/community-gravity?city=Austin&state=TX`);
  await expect(page.getByTestId("gravity-map-toggle")).toBeVisible();
  await expect(page.getByTestId("magnet-map")).toHaveCount(0);
  await page.getByTestId("gravity-map-toggle").click();
  await expect(page.getByTestId("magnet-map-summary")).toContainText("organizations placed", { timeout: 20_000 });
  await expect(page.locator(".leaflet-container")).toBeVisible();
  expect(await page.locator(".leaflet-overlay-pane path").count()).toBeGreaterThan(1);
  await page.getByTestId("magnet-map").getByText("Accessible data list", { exact: true }).click();
  await expect(page.getByTestId("magnet-map-list")).toBeVisible();
  await expect(page.getByTestId("magnet-map-list")).toContainText("ZIP 78731");
  await page.getByTestId("gravity-map-toggle").click();
  await expect(page.getByTestId("magnet-map")).toHaveCount(0);
});

test("bank map sends the complete assessment area rather than substituting a city", async ({ page }) => {
  await page.goto(`${BASE}/community-banks?place=`);
  const toggle = page.getByTestId("cb-map-toggle");
  await expect(toggle).toBeVisible({ timeout: 45_000 });
  const response = page.waitForResponse(r => r.url().includes("/api/community-gravity/map?"));
  await toggle.click();
  const map = await (await response).json();
  expect(map.need.counties.map((c: { fips: string }) => c.fips).sort()).toEqual(["48021", "48055", "48209", "48453", "48491"]);
  await expect(page.getByTestId("magnet-map-summary")).toBeVisible();
});

test("directory disclosure keeps all search matches reachable and resets between filters", async ({ page }) => {
  await page.goto(`${BASE}/tools?outcome=see-the-data`);
  const group = page.getByTestId("tools-group-see-the-data");
  await expect(group.locator('[data-testid^="tool-link-"]')).toHaveCount(12);
  const more = group.getByRole("button", { name: /show all/i });
  await more.click();
  await expect.poll(() => group.locator('[data-testid^="tool-link-"]').count()).toBeGreaterThan(12);
  await page.getByTestId("tools-search").fill("community");
  await expect(page.getByTestId("tools-result-count")).toContainText("All matching search results are shown.");
  const count = Number((await page.getByTestId("tools-result-count").textContent())!.match(/\d+/)![0]);
  await expect(group.locator('[data-testid^="tool-link-"]')).toHaveCount(count);
  await page.getByTestId("tools-search").fill("");
  await expect(group.locator('[data-testid^="tool-link-"]')).toHaveCount(12);
});

test("saved journey ZIP is reused; explicit place wins and private failures never select Austin", async ({ page }) => {
  await page.route("**/api/auth/user", r => r.fulfill({ json: { id: "map-place-test", role: "member" } }));
  await page.route("**/api/community-gravity/context", r => r.fulfill({ json: { place: "78701", status: "available" } }));
  await page.goto(`${BASE}/community-gravity`);
  await expect(page.getByTestId("gravity-journey-map")).toContainText("78701");
  await page.goto(`${BASE}/community-gravity?city=Austin&state=TX`);
  await expect(page.getByTestId("gravity-journey-map")).toHaveCount(0);
  await page.unroute("**/api/community-gravity/context");
  await page.route("**/api/community-gravity/context", r => r.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.goto(`${BASE}/community-gravity`);
  await expect(page.getByRole("alert").filter({ hasText: "saved journey place" })).toBeVisible();
  await expect(page.getByTestId("gravity-clusters")).toHaveCount(0);
});