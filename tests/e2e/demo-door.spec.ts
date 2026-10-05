import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";
const WIDTHS = [375, 1024, 1440] as const;

for (const width of WIDTHS) {
  test(`demo door renders anonymously at ${width}px with no auth wall, widget, or overflow`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const failedApi: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() === 401 && !response.url().includes("/api/auth/")) {
        failedApi.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`${BASE}/demo?audience=banks&place=78634&present=1`, { waitUntil: "networkidle" });
    const door = page.getByTestId("demo-door");
    await expect(door).toBeVisible();
    await expect(door).toHaveAttribute("data-audience", "banks");
    await expect(page.getByTestId("demo-cta")).toBeVisible();
    await expect(page.getByTestId("demo-funding-ask").or(page.getByTestId("demo-report-format")).first()).toBeAttached();

    // No auth wall.
    await expect(page.getByText(/sign in to (view|continue)/i)).toHaveCount(0);

    // No fixed-position floating widgets over the content (help / Navigator launchers).
    const floating = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.position === "fixed" && rect.width > 0 && rect.height > 0 &&
          rect.width < 200 && rect.height < 200 && rect.bottom > innerHeight - 160 && rect.right > innerWidth - 160;
      })
      .map((el) => `${el.tagName}.${el.className}`.slice(0, 120)));
    expect(floating, "floating widgets near the bottom-right corner").toEqual([]);

    // No horizontal overflow.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    // Every benchmark carries a source link.
    const benchmarks = page.getByTestId("demo-benchmark");
    const count = await benchmarks.count();
    for (let i = 0; i < count; i++) {
      await expect(benchmarks.nth(i).locator("a[href^='http']").first()).toBeVisible();
    }

    await page.screenshot({ path: `screenshots/demo-door/demo-banks-${width}.png`, fullPage: true });
    expect(failedApi).toEqual([]);
    await context.close();
  });
}

test("demo door shows all four audience views anonymously", async ({ page }) => {
  for (const audience of ["banks", "schools", "governments", "entities"]) {
    await page.goto(`${BASE}/demo?audience=${audience}&place=78634`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("demo-door")).toBeVisible();
    await expect(page.getByTestId("demo-cta")).toBeVisible();
    await expect(page.getByTestId("demo-measurement-note")).toContainText("measurable once local data is connected");
  }
});
