import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

/**
 * Community Gravity (the Magnet) — public read path, provenance, honesty states,
 * and the server-side staff gate. Uses the live Austin, TX ingest; no AI calls.
 */

test("gravity API: provenance, method disclosure, validation, and staff gates", async ({ request }) => {
  const field = await request.get(`${BASE}/api/community-gravity?city=Austin&state=TX`);
  expect(field.status()).toBe(200);
  const body = await field.json();
  expect(body.builtFrom.source).toContain("IRS");
  expect(body.builtFrom.orgCount).toBeGreaterThan(1000);
  expect(body.method.magnet).toContain("never as $0");
  expect(body.limits.join(" ")).toContain("not a service area");
  const edu = body.clusters.find((c: { domain: string }) => c.domain === "education");
  expect(edu.magnets.length).toBeGreaterThan(0);
  for (const m of edu.magnets) expect(m.revenueAmt === null || m.revenueAmt > 0).toBeTruthy();

  const empty = await request.get(`${BASE}/api/community-gravity?city=Nowhereville&state=TX`);
  expect((await empty.json()).builtFrom).toBeNull();
  expect((await request.get(`${BASE}/api/community-gravity?city=1;drop&state=TX`)).status()).toBe(400);
  expect((await request.get(`${BASE}/api/community-gravity/orgs/12345/facts`)).status()).toBe(400);

  const search = await request.get(`${BASE}/api/community-gravity/orgs?city=Austin&state=TX&q=food+bank`);
  const orgs = (await search.json()).orgs as { ein: string; name: string }[];
  expect(orgs.some(o => /FOOD BANK/.test(o.name))).toBeTruthy();
  const facts = await request.get(`${BASE}/api/community-gravity/orgs/${orgs[0].ein}/facts`);
  expect(facts.status()).toBe(200);
  expect(Array.isArray((await facts.json()).facts)).toBeTruthy();

  // Writes are staff-only and enforced server-side (anonymous → 401).
  for (const path of [`/api/community-gravity/orgs/${orgs[0].ein}/research`, `/api/community-gravity/orgs/${orgs[0].ein}/verify`, `/api/community-gravity/ingest`]) {
    expect((await request.post(`${BASE}${path}`, { data: { verified: true, state: "TX" } })).status()).toBe(401);
  }
});

test("gravity page: clusters, drill-down, org drawer with provenance, and limits", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/community-gravity`);
  await expect(page.getByTestId("gravity-provenance")).toContainText("IRS Exempt Organizations Business Master File");
  await expect(page.getByTestId("gravity-cluster-education")).toBeVisible();
  await expect(page.getByTestId("gravity-evidence")).toContainText("not a service area");
  await expect(page.getByTestId("gravity-unclassified")).toContainText("no IRS activity");

  await page.getByTestId("gravity-see-all-education").click();
  await expect(page.getByTestId("gravity-results")).toContainText("matching organizations");
  await page.getByTestId("gravity-clear-domain").click();

  await page.getByTestId("gravity-search").fill("food bank");
  await expect(page.getByTestId("gravity-results")).toContainText("matching organizations");
  await page.locator('[data-testid^="gravity-org-"]').first().click();
  const drawer = page.getByTestId("gravity-org-drawer");
  await expect(drawer).toContainText("IRS filing address");
  await expect(drawer).toContainText("EIN");
  await expect(page.getByTestId("gravity-org-profile")).toHaveAttribute("href", /propublica\.org\/nonprofits\/organizations\/\d{9}/);
  await expect(drawer).toContainText(/Each fact carries the URL|No cited research on file/);
  await expect(page.getByTestId("gravity-org-research")).toHaveCount(0); // anonymous: no staff controls
  await page.getByTestId("gravity-org-close").click();
  await expect(drawer).toHaveCount(0);

  await page.getByTestId("gravity-city").fill("Nowhereville");
  await page.getByTestId("gravity-go").click();
  await expect(page.getByTestId("gravity-empty")).toContainText("not been loaded");
});

test("gravity page fits a phone without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(`${BASE}/community-gravity`);
  await expect(page.getByTestId("gravity-cluster-education")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
