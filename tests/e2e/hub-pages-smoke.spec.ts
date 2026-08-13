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

/**
 * Chip-filter regression tests for the four hub sub-pages.
 *
 * For each hub we click every chip that is guaranteed to surface at least one
 * card for an unauthenticated visitor (authOnly cards are hidden for anon
 * users, so chips whose entire card set is authOnly are excluded from
 * assertions — see hub-fund "Writing / Applications / Analytics" below).
 *
 * The selector `[data-testid^="hero-card-"], [data-testid^="tool-card-"]`
 * matches both variants rendered by HubShell.  If a card's `tag` field or a
 * chip label drifts, the filtered view empties out and this test catches it.
 */

/** Selector that matches any hero or tool card rendered by HubShell. */
const ANY_CARD = '[data-testid^="hero-card-"], [data-testid^="tool-card-"]';

/**
 * Returns the data-testid for a chip button given its display label.
 * Mirrors the derivation in hub-shell.tsx:
 *   `chip-${chip.toLowerCase().replace(/\s+/g, "-")}`
 */
function chipTestId(label: string) {
  return `[data-testid="chip-${label.toLowerCase().replace(/\s+/g, "-")}"]`;
}

/**
 * Hub chip definitions.
 *
 * `chipsWithPublicCards` lists only the chips where at least one card is
 * visible without authentication.  hub-fund's "Writing", "Applications", and
 * "Analytics" chips are intentionally omitted because every card in those
 * categories carries `authOnly: true`; asserting a visible card there would
 * produce a false failure rather than a real one.
 */
const HUB_CHIP_SPECS = [
  {
    label: "/hub/serve chip filters",
    path: "/hub/serve",
    headingPattern: /Serve People/i,
    chipsWithPublicCards: ["All", "Benefits", "Foster Youth", "Justice", "Health"],
  },
  {
    label: "/hub/grow chip filters",
    path: "/hub/grow",
    headingPattern: /Grow/i,
    chipsWithPublicCards: ["All", "Trade Sims", "Workforce", "Veterans", "Academy", "AI"],
  },
  {
    label: "/hub/fund chip filters",
    path: "/hub/fund",
    headingPattern: /Get Funded/i,
    // Writing / Applications / Analytics chips are all authOnly cards — skip them.
    chipsWithPublicCards: ["All", "Opportunities"],
  },
  {
    label: "/hub/connect chip filters",
    path: "/hub/connect",
    headingPattern: /Connect/i,
    chipsWithPublicCards: ["All", "Network", "Media", "Civic", "Impact", "About"],
  },
];

test.describe("chip filters: clicking a chip shows the right cards", () => {
  for (const { label, path, headingPattern, chipsWithPublicCards } of HUB_CHIP_SPECS) {
    test(label, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on("pageerror", (err) => jsErrors.push(err.message));

      await page.goto(path);

      // Wait for the page to be fully rendered before touching chips.
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 25_000 });
      await expect(page.locator("h1").first()).toHaveText(headingPattern, { timeout: 5_000 });

      for (const chip of chipsWithPublicCards) {
        // Click the chip button.
        const chipBtn = page.locator(chipTestId(chip));
        await expect(chipBtn).toBeVisible({ timeout: 5_000 });
        await chipBtn.click();

        // After the click the React state update is synchronous, but allow one
        // animation frame for the DOM to settle.
        await page.waitForTimeout(150);

        // At least one hero or tool card must be visible in the filtered view.
        const cards = page.locator(ANY_CARD);
        await expect(cards.first()).toBeVisible({ timeout: 5_000 });

        const count = await cards.count();
        expect(
          count,
          `Chip "${chip}" on ${path} should show ≥1 card, got ${count}`,
        ).toBeGreaterThanOrEqual(1);
      }

      // No JS errors should have occurred during the whole chip-clicking sequence.
      expect(
        jsErrors,
        `Unexpected JS errors on ${label}: ${jsErrors.join("; ")}`,
      ).toHaveLength(0);
    });
  }
});
