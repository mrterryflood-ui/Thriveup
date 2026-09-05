import { test, expect } from "@playwright/test";

const NATIONAL_ENDPOINT = "**/api/childcare/national-overview";

test.describe("National childcare overview", () => {
  test("supports state exploration, partial-source recovery, and county lookup", async ({ page }) => {
    let servedPartialResponse = false;

    await page.route("**/api/childcare/search?location=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stateFips: "17",
          countyFips: "031",
          county: "Cook",
          displayName: "Cook County, IL",
          summary: {
            totalProviders: 1234,
            totalLicensedCapacity: null,
            dataSource: "Census CBP 2022 NAICS 6244",
            retrievedAt: "2026-09-05T00:00:00.000Z",
          },
          slotGap: {
            estimatedDemand: 456789,
            slotGap: null,
            coverageRate: null,
            methodology: "Establishment density is a screening signal, not licensed capacity.",
            dataSource: "Census CBP 2022 + ACS 2022 B01001",
          },
          warnings: ["Census establishments are not licensed slots or confirmed openings."],
        }),
      });
    });

    await page.route(NATIONAL_ENDPOINT, async (route) => {
      const response = await route.fetch();
      if (servedPartialResponse) {
        await route.fulfill({ response });
        return;
      }

      const body = await response.json() as {
        coverage: { statesWithCompleteData: number };
        states: Array<{ dataStatus: string }>;
      };
      body.coverage.statesWithCompleteData = 0;
      if (body.states[0]) body.states[0].dataStatus = "partial";
      servedPartialResponse = true;
      await route.fulfill({
        status: response.status(),
        headers: { ...response.headers(), "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    });

    await page.goto("/child-care/national", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("page-child-care-national")).toBeVisible();
    await expect(page.getByTestId("card-national-state-table")).toBeVisible();

    // The partial response must be visible and recoverable without a full reload.
    const refreshPartial = page.getByTestId("button-refresh-partial-national");
    await expect(refreshPartial).toBeVisible();
    await refreshPartial.click();
    await expect(refreshPartial).toBeHidden({ timeout: 90_000 });
    await expect(page.getByTestId("state-row-48")).toBeVisible();

    // State search and sort remain interactive after recovery.
    await page.getByTestId("input-state-search").fill("Texas");
    await expect(page.getByTestId("state-row-48")).toBeVisible();
    await expect(page.getByTestId("state-search-empty")).toBeHidden();
    await page.getByTestId("button-sort-state").click();
    await expect(page.getByTestId("button-sort-state")).toHaveAttribute("aria-pressed", "true");

    // Selecting a state focuses the real county input and carries the hint forward.
    await page.getByTestId("link-state-detail-48").click();
    await expect(page.getByTestId("input-national-county-search")).toBeFocused();
    await expect(page.getByText(/State selected from the comparison: Texas/)).toBeVisible();

    // County lookup uses the live public search contract and renders the result.
    const countyInput = page.getByTestId("input-national-county-search");
    await countyInput.fill("Cook County, IL");
    await page.getByTestId("button-national-county-search").click();
    await expect(page.getByTestId("national-county-result")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId("national-county-result")).toContainText("Cook");

    // Source links must remain HTTPS-only.
    const sourceLinks = page.getByRole("link", { name: /Open source|Read the United for ALICE/ });
    const sourceCount = await sourceLinks.count();
    expect(sourceCount).toBeGreaterThan(0);
    for (let index = 0; index < sourceCount; index += 1) {
      await expect(sourceLinks.nth(index)).toHaveAttribute("href", /^https:\/\//);
    }
  });
});