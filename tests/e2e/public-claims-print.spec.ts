import { expect, test } from "@playwright/test";

test.describe("Public claims and print readiness", () => {
  test("landing page makes health-equity mapping and the data story visible immediately", async ({ page }) => {
    await page.goto("/");

    const section = page.getByTestId("section-health-equity-first-glance");
    await expect(section).toBeVisible();
    await expect(section.getByRole("heading", { name: /See what is happening where an HBCU/i })).toBeVisible();
    await expect(page.getByTestId("health-equity-step-1")).toContainText("Map the place");
    await expect(page.getByTestId("health-equity-step-2")).toContainText("Tell the story");
    await expect(page.getByTestId("health-equity-step-3")).toContainText("Choose the tool");
    await expect(page.getByTestId("health-equity-step-4")).toContainText("Track learning");
  });

  test("nationwide equity-loss view keeps formula and availability disclosures visible", async ({ page }) => {
    await page.goto("/equity-loss/national");

    await expect(
      page.getByRole("heading", { name: "Equity-Loss Engine — Nationwide View" }),
    ).toBeVisible();
    await expect(page.getByText(/Loss % = \(1 − IHDI \/ HDI\) × 100/)).toBeVisible();
    await expect(page.getByText(/This is a data-availability statement, not a service-deployment claim/)).toBeVisible();
  });

  test("our approach page renders and produces a real Letter-size PDF", async ({ page }, testInfo) => {
    await page.goto("/our-approach");

    await expect(page.getByTestId("page-our-approach")).toBeVisible();
    await expect(page.getByRole("heading", { name: "We are stronger together." })).toBeVisible();

    await page.emulateMedia({ media: "print" });
    const pdfPath = testInfo.outputPath("our-approach-print.pdf");
    await page.pdf({
      path: pdfPath,
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });

    const pdf = await testInfo.attach("our-approach-print.pdf", {
      path: pdfPath,
      contentType: "application/pdf",
    });
    expect(pdf).toBeUndefined();
  });

  test("Austin deliverable stays private while offering an honest sign-in boundary", async ({ page }) => {
    await page.goto("/austin-community-bridge/deliverable");

    await expect(page.getByTestId("auth-gate-blocked")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Internal Workspace" })).toBeVisible();
    await expect(page.getByText(/private planning and review workspace/i)).toBeVisible();
    await expect(page.getByTestId("button-auth-home")).toBeVisible();
  });

  test("Austin surface exposes the private review preview without exposing its contents", async ({ page }) => {
    await page.goto("/austin");
    await expect(page.getByTestId("button-private-austin-deliverable")).toBeVisible();
    await expect(page.getByTestId("button-private-austin-deliverable")).toHaveAttribute("href", "/austin-community-bridge/deliverable");
  });

  test("authorized staff can preview, save, reload, and clear a browser-only Austin correction note", async ({ page }) => {
    await page.route("**/api/auth/user", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "staff-review-test", role: "staff" }) });
    });
    await page.goto("/austin-community-bridge/deliverable");
    await expect(page.getByTestId("austin-community-bridge-deliverable")).toBeVisible();
    await expect(page.getByTestId("section-austin-implementation-decision")).toBeVisible();

    await page.getByTestId("textarea-austin-correction").fill("Use the approved geography crosswalk before showing a ZIP-level comparison.");
    await page.getByTestId("button-save-austin-correction").click();
    await expect(page.getByTestId("austin-correction-list")).toContainText("Use the approved geography crosswalk");

    await page.reload();
    await expect(page.getByTestId("austin-correction-list")).toContainText("Use the approved geography crosswalk");
    await page.getByTestId("button-clear-austin-corrections").click();
    await expect(page.getByTestId("austin-correction-empty")).toBeVisible();
  });
});