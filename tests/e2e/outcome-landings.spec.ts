import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const rows = JSON.parse(readFileSync("shared/route-nav.generated.json", "utf8")) as Array<{ path: string; outcome: string; access: string }>;
const outcomes = ["get-help", "learn", "work-earn", "connect", "fund", "see-the-data"];
test.setTimeout(120_000);
for (const width of [375, 1024, 1440]) {
  test(`six outcome doors render sourced terminal language at ${width}px without overflow`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    mkdirSync("screenshots/magnet-ia", { recursive: true });
    for (const outcome of outcomes) {
      await page.goto(`${BASE}/start/${outcome}`);
      await expect(page.getByTestId("outcome-landing")).toHaveAttribute("data-outcome", outcome);
      await expect(page.getByTestId("page-frame")).toHaveAttribute("data-outcome", outcome);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Illustrative AI-generated imagery, not program photography.")).toBeVisible();
      await expect.poll(() => page.locator("main img").first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const primary = page.getByTestId("outcome-primary-action");
      const href = await primary.getAttribute("href");
      expect(rows.find(r => r.path === href)?.access).toBe("public");
      expect((await request.get(`${BASE}${href}`)).status()).toBe(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByTestId("magnet-map")).toHaveCount(0);
      await page.screenshot({ path: `screenshots/magnet-ia/${outcome}-${width}.jpg`, type: "jpeg", quality: 60 });
    }
  });
}
test("explicit query geography, unavailable evidence, and public disclosures fail honestly", async ({ page }) => {
  await page.goto(`${BASE}/start/connect?place=78701`);
  await expect(page.getByLabel("Your place (optional)")).toHaveValue("78701");
  await expect(page.getByTestId("magnet-map")).toHaveCount(0);
  await page.getByRole("button", { name: "Open geographic evidence" }).click();
  await expect(page.getByTestId("magnet-map-summary")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Your place (optional)").fill("Nowhereville, ZZ");
  await page.getByRole("button", { name: "Use this place" }).click();
  await expect(page.getByTestId("magnet-map-error")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByTestId("magnet-map")).toHaveCount(0);
  await expect(page.getByText("No default city is assumed. Your entered place takes priority over a saved journey place.")).toBeVisible();
});
test("nearby has measured postal distances and Travis filing cities are available", async ({ request }) => {
  const response = await request.get(`${BASE}/api/community-gravity?city=Austin&state=TX`);
  expect(response.status()).toBe(200);
  const field = await response.json();
  expect(field.method.nearby).toContain("50 straight-line miles");
  const nearby = field.clusters.flatMap((c: { nearbyCities: Array<{ city: string; distanceMiles: number }> }) => c.nearbyCities);
  expect(nearby.length).toBeGreaterThan(0);
  for (const city of nearby) expect(city.distanceMiles >= 0 && city.distanceMiles <= 50).toBe(true);
  for (const city of ["Pflugerville", "Manor", "Del Valle"]) {
    const r = await request.get(`${BASE}/api/community-gravity?city=${encodeURIComponent(city)}&state=TX`);
    expect(r.status()).toBe(200);
    expect((await r.json()).builtFrom.orgCount).toBeGreaterThan(0);
  }
});