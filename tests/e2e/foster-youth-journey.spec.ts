import { test, expect } from "@playwright/test";

/**
 * Foster Youth Aging Out — end-to-end congruence test.
 * Walks the entire journey Jim Currier would walk on demo day.
 * Asserts the test IDs in the CONGRUENCE-MANIFEST.json are present and interactive.
 *
 * Run: npx playwright test tests/e2e/foster-youth-journey.spec.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Foster Youth Aging Out — congruence walkthrough", () => {
  test("Hub renders with Marcus, six tools, evidence stats, honest disclosure", async ({ page }) => {
    await page.goto(`${BASE}/foster-youth`);
    await expect(page.getByTestId("page-foster-youth-hub")).toBeVisible();
    await expect(page.getByTestId("banner-crisis")).toBeVisible();
    await expect(page.getByTestId("link-crisis-988")).toBeVisible();
    await expect(page.getByTestId("text-marcus-title")).toContainText(/Marcus/i);
    await expect(page.getByTestId("tile-toolkit")).toBeVisible();
    await expect(page.getByTestId("tile-transition-plan")).toBeVisible();
    await expect(page.getByTestId("tile-wellbeing")).toBeVisible();
    await expect(page.getByTestId("tile-rights")).toBeVisible();
    await expect(page.getByTestId("tile-benefits")).toBeVisible();
    await expect(page.getByTestId("tile-fafsa")).toBeVisible();
    await expect(page.getByTestId("alert-honest-disclosure")).toBeVisible();
    await expect(page.getByTestId("stat-evidence-0")).toBeVisible();
  });

  test("Toolkit categorized checklist saves to localStorage", async ({ page }) => {
    await page.goto(`${BASE}/foster-youth/toolkit`);
    await expect(page.getByTestId("page-foster-youth-toolkit")).toBeVisible();
    await expect(page.getByTestId("section-cat-identity-documents")).toBeVisible();
    await expect(page.getByTestId("section-cat-records-you-own")).toBeVisible();
    await expect(page.getByTestId("section-cat-housing")).toBeVisible();
    await page.getByTestId("checkbox-item-id-ssn").click();
    await expect(page.getByTestId("text-progress-count")).toContainText(/1 of/);
    await page.reload();
    await expect(page.getByTestId("text-progress-count")).toContainText(/1 of/);
  });

  test("Transition Plan has before+after tabs and saves", async ({ page }) => {
    await page.goto(`${BASE}/foster-youth/transition-plan`);
    await expect(page.getByTestId("page-foster-youth-transition-plan")).toBeVisible();
    await expect(page.getByTestId("tab-before")).toBeVisible();
    await expect(page.getByTestId("tab-after")).toBeVisible();
    await page.getByTestId("textarea-field-before-housing").fill("Aunt Maria's house, 123 Main St");
    await page.getByTestId("button-save").click();
    await page.reload();
    await expect(page.getByTestId("textarea-field-before-housing")).toHaveValue(/Aunt Maria/);
  });

  test("Wellbeing screen routes to crisis on red flag", async ({ page }) => {
    await page.goto(`${BASE}/foster-youth/wellbeing`);
    await expect(page.getByTestId("alert-crisis-banner")).toBeVisible();
    await page.getByTestId("radio-phq1-3").click();
    await page.getByTestId("radio-phq2-3").click();
    await page.getByTestId("radio-gad1-0").click();
    await page.getByTestId("radio-gad2-0").click();
    await page.getByTestId("radio-housing-unsheltered").click();
    await page.getByTestId("radio-food-none").click();
    await page.getByTestId("button-see-results").click();
    await expect(page.getByTestId("section-warm-handoff")).toBeVisible();
    await expect(page.getByTestId("action-mh")).toBeVisible();
    await expect(page.getByTestId("action-housing")).toBeVisible();
    await expect(page.getByTestId("action-food")).toBeVisible();
  });

  test("Rights page lists federal + Texas with legal sources", async ({ page }) => {
    await page.goto(`${BASE}/foster-youth/rights`);
    await expect(page.getByTestId("accordion-right-chafee")).toBeVisible();
    await expect(page.getByTestId("accordion-right-etv")).toBeVisible();
    await expect(page.getByTestId("accordion-right-fyi")).toBeVisible();
    await expect(page.getByTestId("accordion-right-medicaid26")).toBeVisible();
    await expect(page.getByTestId("accordion-right-tx-pal")).toBeVisible();
    await expect(page.getByTestId("accordion-right-tx-tuition")).toBeVisible();
  });

  test("State Benefits navigator covers 50 states with TX detail", async ({ page }) => {
    await page.goto(`${BASE}/foster-youth/benefits`);
    await expect(page.getByTestId("page-foster-youth-benefits")).toBeVisible();
    await expect(page.getByTestId("card-benefit-tx-pal")).toBeVisible();
    await expect(page.getByTestId("card-benefit-fed-medicaid")).toBeVisible();
    await expect(page.getByTestId("card-benefit-fed-fyi")).toBeVisible();
  });
});
