import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";

test("place carries 411 → screener → parents → academy → impact with zero re-entry (anonymous)", async ({ page }) => {
  const consentPrompts: string[] = [];
  page.on("dialog", (d) => { consentPrompts.push(d.message()); void d.dismiss(); });

  await page.goto(`${BASE}/411?place=78634`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-showing")).toContainText("ZIP 78634");
  await expect(page.getByTestId("input-zip")).toHaveValue("78634");

  const steps = ["/benefits-screener", "/parents", "/academy/financial-literacy", "/academy/careers", "/impact"];
  for (const path of steps) {
    await page.getByTestId("journey-place-next").click();
    await expect(page).toHaveURL(new RegExp(`${path}\\?.*place=78634`));
    await expect(page.getByTestId("journey-place-showing")).toContainText("ZIP 78634");
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

test("prefill: screener, analysis, chainweb take the carried ZIP", async ({ page }) => {
  await page.goto(`${BASE}/community-analysis?place=78634`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-zip")).toHaveValue("78634");
  await page.goto(`${BASE}/chainweb?place=78634`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("journey-place-showing")).toContainText("ZIP 78634");
});
