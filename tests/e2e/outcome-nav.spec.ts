import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

/**
 * Phase 3 (G2) — navigation reads the route registry: six outcome groups in the
 * sidebar, outcome bottom tabs, /tools grouped by outcome with audience context,
 * alias redirects. Anonymous visitor; no AI calls.
 */

test("sidebar shows the six public outcomes from the registry and hides the Operator door for anonymous visitors", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/`);
  const groups = page.getByTestId("focused-nav-outcomes");
  await expect(groups).toBeVisible();
  for (const o of ["get-help", "learn", "work-earn", "connect", "fund", "see-the-data"]) await expect(page.getByTestId(`focused-outcome-${o}`)).toBeVisible();
  await expect(page.getByTestId("focused-outcome-operate")).toHaveCount(0);
  await expect(page.getByTestId("focused-nav-audience")).toBeVisible();
});

test("bottom tabs are outcomes on a phone and the Help tab lands on /get-help", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(`${BASE}/`);
  const bar = page.getByTestId("nav-bottom-tab-bar");
  await expect(bar).toBeVisible();
  for (const t of ["start", "help", "learn", "data", "tools"]) await expect(page.getByTestId(`tab-${t}`)).toBeVisible();
  const box = await bar.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(375);
  await page.getByTestId("tab-help").click();
  await expect(page).toHaveURL(/\/get-help$/);
});

test("/tools groups by outcome, honours ?outcome=, and audience context persists across reload", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/tools?outcome=learn`);
  await expect(page.getByTestId("tools-outcome-learn")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("tools-group-learn")).toBeVisible();
  await expect(page.getByTestId("tools-group-get-help")).toHaveCount(0);
  await expect(page.getByTestId("tools-outcome-operate")).toHaveCount(0);
  const countText = async () => Number((await page.getByTestId("tools-result-count").textContent())!.match(/\d+/)![0]);
  const everyone = await countText();
  expect(everyone).toBeGreaterThan(0);
  await page.getByTestId("tools-audience").selectOption("foster-youth");
  const narrowed = await countText();
  expect(narrowed).toBeLessThanOrEqual(everyone);
  await page.reload();
  await expect(page.getByTestId("tools-audience")).toHaveValue("foster-youth");
  await expect(page.getByTestId("tools-result-count")).toContainText("Foster youth");
  // At least one card discloses where it leads next (registry downstream connections).
  await page.getByTestId("tools-outcome-all").click();
  await expect(page.getByTestId("tool-connections").first()).toBeVisible();
});

test("duplicate paths redirect to their canonical route", async ({ page }) => {
  for (const [alias, canonical] of [["/hub", "/"], ["/intake-wizard", "/intake"], ["/research", "/methodology"], ["/transparency-dashboard", "/transparency"], ["/wab2-enrollment", "/st-davids"]]) {
    await page.goto(`${BASE}${alias}`);
    await expect(page).toHaveURL(new RegExp(`${canonical.replace(/\//g, "\\/")}$`));
  }
});
