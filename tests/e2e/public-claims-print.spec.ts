import { expect, test } from "@playwright/test";

test.describe("Public claims and print readiness", () => {
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
});