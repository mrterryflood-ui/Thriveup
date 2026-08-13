import { test, expect } from "@playwright/test";

/**
 * Smoke tests for the five Foundation Network hub pages.
 * Guards against a future change to HubShell, OrchestraStrip, or the route
 * table silently blanking them out with no CI catch.
 *
 * Each test:
 *   1. Collects any JS runtime errors thrown during page load.
 *   2. Navigates to the hub route.
 *   3. Asserts the page-title heading is visible (proves the component mounted).
 *   4. Asserts no unhandled JS errors occurred.
 */

const HUB_ROUTES = [
  {
    path: "/hub",
    // Hub home uses a dynamic greeting; check for any non-empty h1 text.
    headingPattern: /Good (morning|afternoon|evening)/i,
    label: "/hub (home)",
  },
  {
    path: "/hub/serve",
    headingPattern: /Serve People/i,
    label: "/hub/serve",
  },
  {
    path: "/hub/grow",
    headingPattern: /Grow/i,
    label: "/hub/grow",
  },
  {
    path: "/hub/fund",
    headingPattern: /Get Funded/i,
    label: "/hub/fund",
  },
  {
    path: "/hub/connect",
    headingPattern: /Connect/i,
    label: "/hub/connect",
  },
];

test.describe("smoke: hub pages load without JS errors", () => {
  for (const { path, headingPattern, label } of HUB_ROUTES) {
    test(`${label} renders its title heading`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on("pageerror", (err) => jsErrors.push(err.message));

      await page.goto(path);

      // Wait for the h1 heading to appear (lazy-chunk compile can be slow on first hit)
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 25_000 });

      // Assert the correct heading text is present
      await expect(page.locator("h1").first()).toHaveText(headingPattern, { timeout: 5_000 });

      // Assert no unhandled JS errors were thrown during page load
      expect(
        jsErrors,
        `Unexpected JS errors on ${label}: ${jsErrors.join("; ")}`,
      ).toHaveLength(0);
    });
  }
});
