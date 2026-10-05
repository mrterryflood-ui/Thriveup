import { test, expect } from "@playwright/test";

/**
 * R1 Phase B gate — audience continuity. The carried ?audience= sets each tool's existing lane preference
 * on arrival; unknown audiences change nothing; the person's own toggle still wins afterwards.
 * Run: npx playwright test tests/e2e/journey-audience.spec.ts
 */
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const PLACE = "place=78634";

test("/411: helper audience arrives in Navigator mode; resident audience and unknown audience stay in resident mode", async ({ page }) => {
  await page.goto(`${BASE}/411?${PLACE}&audience=caregivers-chws`);
  await expect(page.getByTestId("input-zip")).toHaveValue("78634");
  const navigatorBg = await page.getByTestId("button-mode-navigator").evaluate((b) => getComputedStyle(b).backgroundColor);
  const residentBg = await page.getByTestId("button-mode-resident").evaluate((b) => getComputedStyle(b).backgroundColor);
  expect(navigatorBg, "navigator button is the filled (active) one").not.toBe(residentBg);
  // toggle still wins
  await page.getByTestId("button-mode-resident").click();
  expect(await page.getByTestId("button-mode-resident").evaluate((b) => getComputedStyle(b).backgroundColor)).toBe(navigatorBg);

  await page.goto(`${BASE}/411?${PLACE}&audience=resident-family`);
  expect(await page.getByTestId("button-mode-resident").evaluate((b) => getComputedStyle(b).backgroundColor)).toBe(navigatorBg);
  await page.goto(`${BASE}/411?${PLACE}&audience=martians`);
  expect(await page.getByTestId("button-mode-resident").evaluate((b) => getComputedStyle(b).backgroundColor)).toBe(navigatorBg);
});

test("/benefits-screener: helper audience arrives in CHW mode; resident audience does not", async ({ page }) => {
  await page.goto(`${BASE}/benefits-screener?${PLACE}&audience=nonprofit-cbo`);
  const sw = page.getByRole("switch").first();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await page.goto(`${BASE}/benefits-screener?${PLACE}&audience=students-youth`);
  await expect(page.getByRole("switch").first()).toHaveAttribute("aria-checked", "false");
});

test("/parents: helper audience lands on the workshops tab; families keep Prevention & Family", async ({ page }) => {
  await page.goto(`${BASE}/parents?${PLACE}&audience=agency-government`);
  await expect(page.getByTestId("tab-training")).toHaveAttribute("data-state", "active");
  await page.goto(`${BASE}/parents?${PLACE}&audience=resident-family`);
  await expect(page.getByTestId("tab-prevention-family")).toHaveAttribute("data-state", "active");
});
