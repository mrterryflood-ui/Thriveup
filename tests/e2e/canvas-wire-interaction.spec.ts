/**
 * Regression gate: wire interaction on the visual canvases.
 *
 * Guards the two silent interaction killers found while building the
 * plumbing canvas (both also affected the electrical canvas):
 *   1. Pointer capture retargets the derived click to the <svg>, which used
 *      to instantly cancel every wire-start → the wiring banner must PERSIST
 *      after the pointerup/click that started wiring.
 *   2. The visible wire stroke sat above the transparent hit path and ate
 *      selection clicks → clicking a completed wire must select it so it can
 *      be deleted.
 *
 * Flow per canvas: start wiring from a terminal → assert the wiring banner
 * is still up after the bubbled click → complete the wire on a second
 * terminal → click the wire → delete it.
 *
 * Runs anonymously via the 10-minute trade-sims trial (no auth needed).
 */
import { test, expect, type Page } from "@playwright/test";

async function openGuidedTab(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByTestId("trial-gate-active")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("tab-guided").click();
}

/** Ensure at least one terminal for the kind exists; add via palette if not. */
async function ensureComponent(page: Page, kind: string, terminalTestId: string) {
  const term = page.getByTestId(terminalTestId).first();
  if (!(await term.isVisible().catch(() => false))) {
    await page.getByTestId(`palette-${kind}`).first().click();
  }
  await expect(term).toBeVisible();
  return term;
}

interface CanvasSpec {
  name: string;
  url: string;
  compA: { kind: string; terminal: string };
  compB: { kind: string; terminal: string };
  deleteButton: string; // testid of wire/connection delete button
}

const CANVASES: CanvasSpec[] = [
  {
    name: "electrical",
    url: "/academy/trade-sims/electrical/ohms-law",
    compA: { kind: "battery", terminal: "terminal-battery-pos" },
    compB: { kind: "resistor", terminal: "terminal-resistor-a" },
    deleteButton: "button-delete-wire",
  },
  {
    name: "plumbing",
    url: "/academy/trade-sims/plumbing/water-pressure-flow",
    compA: { kind: "tank", terminal: "terminal-tank-out" },
    compB: { kind: "pipe", terminal: "terminal-pipe-a" },
    deleteButton: "button-delete-connection",
  },
];

for (const c of CANVASES) {
  test(`${c.name} canvas: wire start persists, wire is clickable and deletable`, async ({ page }) => {
    await openGuidedTab(page, c.url);

    const termA = await ensureComponent(page, c.compA.kind, c.compA.terminal);
    const termB = await ensureComponent(page, c.compB.kind, c.compB.terminal);

    const banner = page.getByTestId("wiring-banner");
    const wireHits = page.locator(`[data-testid^="wire-hit-"]`);
    const wiresBefore = await wireHits.count();

    // 1. Start wiring from terminal A. The pointerup + derived click bubble
    //    to the <svg> (pointer capture retargets them) — regression #1 was
    //    that this instantly cancelled wiring. The banner must persist.
    await termA.click();
    await expect(banner).toBeVisible();
    await page.waitForTimeout(400); // let any bubbled click/pointerup settle
    await expect(banner).toBeVisible();

    // 2. Complete the wire on terminal B (different component).
    await termB.click();
    await expect(banner).not.toBeVisible();
    await expect(wireHits).toHaveCount(wiresBefore + 1);

    // 3. Click the new wire — regression #2 was the visible stroke eating
    //    this click. The selection UI (delete button) must appear.
    // A straight same-row wire has a zero-height geometry, which Playwright
    // treats as "not visible" and refuses to click. Instead, compute the
    // midpoint of the wire path in screen coordinates and click with the
    // real mouse — this still exercises genuine DOM hit-testing (regression
    // #2 was exactly the visible stroke sitting above this hit path).
    const wire = wireHits.last();
    const mid = await wire.evaluate((el) => {
      const path = el as SVGPathElement;
      const svg = path.ownerSVGElement!;
      const p = path.getPointAtLength(path.getTotalLength() / 2);
      const vb = svg.viewBox.baseVal;
      const r = svg.getBoundingClientRect();
      return {
        x: r.left + ((p.x - vb.x) / vb.width) * r.width,
        y: r.top + ((p.y - vb.y) / vb.height) * r.height,
      };
    });
    await page.mouse.click(mid.x, mid.y);
    const deleteBtn = page.getByTestId(c.deleteButton);
    await expect(deleteBtn).toBeVisible();

    // 4. Delete it.
    await deleteBtn.click();
    await expect(wireHits).toHaveCount(wiresBefore);
    await expect(deleteBtn).not.toBeVisible();
  });
}
