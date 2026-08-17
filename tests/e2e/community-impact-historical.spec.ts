/**
 * Community Impact — Historical Receipt & County Disclosure E2E tests.
 *
 * Test 1 (ZIP lookup): Submits ZIP 78741 (Austin, TX), waits for results,
 *   asserts that the Historical Receipt section, the vintage table, and the
 *   verdict dollar figure are all visible and real.
 *
 * Test 2 (County lookup): Submits "Travis County, TX", asserts the county
 *   disclosure note appears and the Historical Receipt section itself does NOT
 *   render (the server sets historicalCascade: null for county geographies).
 *
 * Run: npx playwright test tests/e2e/community-impact-historical.spec.ts
 */

import { test, expect } from "@playwright/test";

// Generous timeout: community-brief hits Census + AI, can take 30–60 s cold.
const BRIEF_TIMEOUT = 90_000;

test.describe("Community Impact — Historical Receipt (ZIP lookup)", () => {
  test("ZIP 78741: section-historical-receipt and table visible with a real dollar total", async ({
    page,
  }) => {
    // Suppress Vite HMR overlay — WebGL is unavailable in headless Chromium
    // (THREE.WebGLRenderer throws), which causes the Vite error overlay to
    // block the entire page. Dismiss it via keyboard before interacting.
    await page.addInitScript(() => {
      // Stub WebGL so THREE.WebGLRenderer doesn't throw in the headless environment
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
          return null; // suppress rather than throw
        }
        return orig.apply(this, [type, ...args] as any);
      };
    });

    await page.goto("/community-impact");

    // If the Vite HMR error overlay appears (WebGL failure), press Escape to
    // dismiss it so we can interact with the page below.
    await page.keyboard.press("Escape");

    // Fill in the ZIP and submit
    await page.getByTestId("input-location").fill("78741");
    await page.getByTestId("button-search").click();

    // Wait for the Historical Receipt section to appear — this proves the brief
    // returned historicalCascade vintages (Census multi-vintage succeeded).
    const section = page.getByTestId("section-historical-receipt");
    await expect(section).toBeVisible({ timeout: BRIEF_TIMEOUT });

    // The vintage table must have at least one data row.
    const table = page.getByTestId("table-historical-vintages");
    await expect(table).toBeVisible();
    // At least one vintage row exists (data-testid="row-vintage-{year}")
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // The Verdict Hero dollar figure must be a real amount — not "—" or "$0".
    const verdictTotal = page.getByTestId("verdict-historical-total");
    await expect(verdictTotal).toBeVisible();
    const totalText = await verdictTotal.textContent();
    expect(totalText).toBeTruthy();
    // Must start with "$" and contain a non-zero digit sequence.
    expect(totalText).toMatch(/^\$[1-9]/);
    // Must not be a dash placeholder
    expect(totalText).not.toBe("—");
    expect(totalText).not.toBe("$0");
  });
});

test.describe("Community Impact — County lookup disclosure", () => {
  test("Travis County, TX: county note appears and Historical Receipt section does NOT render", async ({
    page,
  }) => {
    // Same WebGL suppression as the ZIP test above.
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
          return null;
        }
        return orig.apply(this, [type, ...args] as any);
      };
    });

    await page.goto("/community-impact");
    await page.keyboard.press("Escape");

    // Submit a county name — conductor sets historicalCascade null for counties.
    await page.getByTestId("input-location").fill("Travis County, TX");
    await page.getByTestId("button-search").click();

    // Wait for the brief to complete: the unavailable-disclosure section must appear.
    // The server sets evidence.claims.historicalCascade.status = "unavailable" and
    // historicalCascade = null when isCountyLevel is true.
    const unavailableSection = page.getByTestId(
      "section-historical-receipt-unavailable"
    );
    await expect(unavailableSection).toBeVisible({ timeout: BRIEF_TIMEOUT });

    // The note must mention county/ZIP to guide the user.
    const noteText = await unavailableSection.textContent();
    expect(noteText).toBeTruthy();
    // The server disclosure text reads: "Multi-vintage historical data is not
    // available for county or multi-county geographies" — assert it references
    // either "county" or "ZIP" (fallback text also mentions both).
    const lowerNote = (noteText ?? "").toLowerCase();
    expect(lowerNote.includes("county") || lowerNote.includes("zip")).toBe(true);

    // The real Historical Receipt section must NOT be rendered for a county lookup.
    await expect(page.getByTestId("section-historical-receipt")).not.toBeVisible();
  });
});
