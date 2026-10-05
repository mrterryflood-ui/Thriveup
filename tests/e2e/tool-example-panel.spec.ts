import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { isShellLessRoute } from "../../shared/shell-less-routes";

/**
 * R8a gate — every real route renders its registry-driven "How this fits" panel.
 * Registry-driven, not a hardcoded list: every live, literal, public route in shared/route-registry.generated.json
 * (aliases redirect; dynamic routes need an id; restricted routes are covered per-tier by access-truth-matrix;
 * shell-less decks/embeds in shared/shell-less-routes.ts have no frame by design).
 * Run: npx playwright test tests/e2e/tool-example-panel.spec.ts
 */
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
type Entry = { path: string; access: string; aliasOf?: string; title: string };
const registry = (JSON.parse(readFileSync(new URL("../../shared/route-registry.generated.json", import.meta.url), "utf8")) as { entries: Entry[] }).entries;
const ROUTES = registry.filter((e) => !e.aliasOf && e.access === "public" && !e.path.includes(":") && e.path !== "/" && !isShellLessRoute(e.path));
const CHUNK = Number(process.env.EXAMPLE_PANEL_CHUNK || 40);

for (let start = 0; start < ROUTES.length; start += CHUNK) {
  const slice = ROUTES.slice(start, start + CHUNK);
  test(`routes ${start + 1}–${start + slice.length} of ${ROUTES.length} render the example panel`, async ({ browser }) => {
    test.setTimeout(CHUNK * 20_000);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const missing: string[] = [];
    for (const r of slice) {
      try {
        await page.goto(`${BASE}${r.path}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
        const frame = page.getByTestId("page-frame");
        await frame.waitFor({ state: "visible", timeout: 15_000 });
        if (await page.getByTestId("page-frame-toggle").getAttribute("aria-expanded") === "false") await page.getByTestId("page-frame-toggle").click();
        const panel = page.getByTestId("tool-example-panel");
        await panel.waitFor({ state: "visible", timeout: 5_000 });
        if ((await panel.getAttribute("data-route")) !== r.path) missing.push(`${r.path}: panel is for ${await panel.getAttribute("data-route")}`);
        if (!(await page.getByTestId("tool-example-description").count()) && !(await page.getByTestId("page-frame-guide").count())) missing.push(`${r.path}: panel has neither description nor guide`);
      } catch (e) {
        missing.push(`${r.path}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
    expect(missing, "routes without a working example panel").toEqual([]);
    await ctx.close();
  });
}

// R1 step 6 + R8a: the panel's upstream/downstream links carry the current journey context.
test("example panel links propagate the journey context", async ({ page }) => {
  await page.goto(`${BASE}/411?place=78634&audience=caregivers-chws`);
  if (await page.getByTestId("page-frame-toggle").getAttribute("aria-expanded") === "false") await page.getByTestId("page-frame-toggle").click();
  const hrefs = await page.getByTestId("page-frame-downstream").locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) { expect(h).toContain("place=78634"); expect(h).toContain("audience=caregivers-chws"); }
});
