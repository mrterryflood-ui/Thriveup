import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";

test("place carries 411 → screener → parents → academy → impact with zero re-entry (anonymous)", async ({ page }) => {
  const consentPrompts: string[] = [];
  page.on("dialog", (d) => { consentPrompts.push(d.message()); void d.dismiss(); });

  await page.goto(`${BASE}/411?place=78634`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-showing")).toContainText("Hutto, TX (78634)");
  await expect(page.getByTestId("input-zip")).toHaveValue("78634");

  const steps = ["/benefits-screener", "/parents", "/academy/financial-literacy", "/academy/careers", "/impact"];
  for (const path of steps) {
    await page.getByTestId("journey-place-next").click();
    await expect(page).toHaveURL(new RegExp(`${path}\\?.*place=78634`));
    await expect(page.getByTestId("journey-place-showing")).toContainText("Hutto, TX (78634)");
  }
  expect(consentPrompts).toEqual([]);
  await expect(page.getByText(/sign in to (view|continue)/i)).toHaveCount(0);
});

test("no place in URL → no bar, no assumed city", async ({ page }) => {
  await page.goto(`${BASE}/parents`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-bar")).toHaveCount(0);
});

test("invalid place is ignored; clear control removes place", async ({ page }) => {
  await page.goto(`${BASE}/parents?place=%3Cscript%3E`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-bar")).toHaveCount(0);
  await page.goto(`${BASE}/parents?place=78634`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("journey-place-clear").click();
  await expect(page).not.toHaveURL(/place=/);
  await expect(page.getByTestId("journey-place-bar")).toHaveCount(0);
});

/**
 * Phase A proof language: the place must be USED on arrival — visible and pre-filled in the tool's own
 * control — not merely present in the URL or the shell bar. One assertion per Phase A route.
 */
const PLACE = "78634";
const RESOLVED = /Williamson County, TX \(ZIP 78634\)/;

test("Phase A: every named route pre-fills and shows the carried place on arrival", async ({ page }) => {
  // /411 — ZIP input
  await page.goto(`${BASE}/411?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-zip")).toHaveValue(PLACE);

  // /benefits-screener — ZIP input (location step may be further in; the value is bound on arrival)
  await page.goto(`${BASE}/benefits-screener?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-showing")).toContainText(`ZIP ${PLACE}`);

  // /parents — audience lane + shell bar (page has no geography control by design)
  await page.goto(`${BASE}/parents?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-showing")).toContainText(`ZIP ${PLACE}`);

  // /community-analysis — ZIP input
  await page.goto(`${BASE}/community-analysis?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-zip")).toHaveValue(PLACE);

  // /chainweb — geography label field
  await page.goto(`${BASE}/chainweb?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-geo-label")).toHaveValue(`ZIP ${PLACE}`);

  // /corridor-intelligence — place evidence panel: input pre-filled, resolved county shown, indicators rendered
  await page.goto(`${BASE}/corridor-intelligence?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-journey-place")).toHaveValue(PLACE);
  await expect(page.getByTestId("journey-place-evidence-showing")).toContainText(RESOLVED, { timeout: 20_000 });
  await expect(page.getByTestId("indicator-population")).toBeVisible();

  // /impact — same panel
  await page.goto(`${BASE}/impact?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-journey-place")).toHaveValue(PLACE);
  await expect(page.getByTestId("journey-place-evidence-showing")).toContainText(RESOLVED, { timeout: 20_000 });
  await expect(page.getByTestId("indicator-population")).toBeVisible();
});

test("place evidence panel: no place → no fetch, no default; clear removes it; unresolvable place fails visibly", async ({ page }) => {
  const profileCalls: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/community-banks/profile")) profileCalls.push(r.url()); });
  await page.goto(`${BASE}/corridor-intelligence`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("journey-place-evidence-empty")).toBeVisible();
  expect(profileCalls).toEqual([]);

  await page.goto(`${BASE}/impact?place=${PLACE}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-evidence-showing")).toContainText(RESOLVED, { timeout: 20_000 });
  await page.getByTestId("button-journey-place-clear").click();
  await expect(page).not.toHaveURL(/place=/);
  await expect(page.getByTestId("journey-place-evidence-empty")).toBeVisible();

  await page.goto(`${BASE}/impact?place=00000`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-evidence-error")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("journey-place-indicators")).toHaveCount(0);
});
