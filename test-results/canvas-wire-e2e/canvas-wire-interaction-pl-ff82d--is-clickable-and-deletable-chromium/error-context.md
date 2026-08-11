# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: canvas-wire-interaction.spec.ts >> plumbing canvas: wire start persists, wire is clickable and deletable
- Location: tests/e2e/canvas-wire-interaction.spec.ts:63:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/academy/trade-sims/plumbing/water-pressure-flow
Call log:
  - navigating to "http://localhost:5000/academy/trade-sims/plumbing/water-pressure-flow", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1   | /**
  2   |  * Regression gate: wire interaction on the visual canvases.
  3   |  *
  4   |  * Guards the two silent interaction killers found while building the
  5   |  * plumbing canvas (both also affected the electrical canvas):
  6   |  *   1. Pointer capture retargets the derived click to the <svg>, which used
  7   |  *      to instantly cancel every wire-start → the wiring banner must PERSIST
  8   |  *      after the pointerup/click that started wiring.
  9   |  *   2. The visible wire stroke sat above the transparent hit path and ate
  10  |  *      selection clicks → clicking a completed wire must select it so it can
  11  |  *      be deleted.
  12  |  *
  13  |  * Flow per canvas: start wiring from a terminal → assert the wiring banner
  14  |  * is still up after the bubbled click → complete the wire on a second
  15  |  * terminal → click the wire → delete it.
  16  |  *
  17  |  * Runs anonymously via the 10-minute trade-sims trial (no auth needed).
  18  |  */
  19  | import { test, expect, type Page } from "@playwright/test";
  20  | 
  21  | async function openGuidedTab(page: Page, url: string) {
> 22  |   await page.goto(url);
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/academy/trade-sims/plumbing/water-pressure-flow
  23  |   await expect(page.getByTestId("trial-gate-active")).toBeVisible({ timeout: 15_000 });
  24  |   await page.getByTestId("tab-guided").click();
  25  | }
  26  | 
  27  | /** Ensure at least one terminal for the kind exists; add via palette if not. */
  28  | async function ensureComponent(page: Page, kind: string, terminalTestId: string) {
  29  |   const term = page.getByTestId(terminalTestId).first();
  30  |   if (!(await term.isVisible().catch(() => false))) {
  31  |     await page.getByTestId(`palette-${kind}`).first().click();
  32  |   }
  33  |   await expect(term).toBeVisible();
  34  |   return term;
  35  | }
  36  | 
  37  | interface CanvasSpec {
  38  |   name: string;
  39  |   url: string;
  40  |   compA: { kind: string; terminal: string };
  41  |   compB: { kind: string; terminal: string };
  42  |   deleteButton: string; // testid of wire/connection delete button
  43  | }
  44  | 
  45  | const CANVASES: CanvasSpec[] = [
  46  |   {
  47  |     name: "electrical",
  48  |     url: "/academy/trade-sims/electrical/ohms-law",
  49  |     compA: { kind: "battery", terminal: "terminal-battery-pos" },
  50  |     compB: { kind: "resistor", terminal: "terminal-resistor-a" },
  51  |     deleteButton: "button-delete-wire",
  52  |   },
  53  |   {
  54  |     name: "plumbing",
  55  |     url: "/academy/trade-sims/plumbing/water-pressure-flow",
  56  |     compA: { kind: "tank", terminal: "terminal-tank-out" },
  57  |     compB: { kind: "pipe", terminal: "terminal-pipe-a" },
  58  |     deleteButton: "button-delete-connection",
  59  |   },
  60  | ];
  61  | 
  62  | for (const c of CANVASES) {
  63  |   test(`${c.name} canvas: wire start persists, wire is clickable and deletable`, async ({ page }) => {
  64  |     await openGuidedTab(page, c.url);
  65  | 
  66  |     const termA = await ensureComponent(page, c.compA.kind, c.compA.terminal);
  67  |     const termB = await ensureComponent(page, c.compB.kind, c.compB.terminal);
  68  | 
  69  |     const banner = page.getByTestId("wiring-banner");
  70  |     const wireHits = page.locator(`[data-testid^="wire-hit-"]`);
  71  |     const wiresBefore = await wireHits.count();
  72  | 
  73  |     // 1. Start wiring from terminal A. The pointerup + derived click bubble
  74  |     //    to the <svg> (pointer capture retargets them) — regression #1 was
  75  |     //    that this instantly cancelled wiring. The banner must persist.
  76  |     await termA.click();
  77  |     await expect(banner).toBeVisible();
  78  |     await page.waitForTimeout(400); // let any bubbled click/pointerup settle
  79  |     await expect(banner).toBeVisible();
  80  | 
  81  |     // 2. Complete the wire on terminal B (different component).
  82  |     await termB.click();
  83  |     await expect(banner).not.toBeVisible();
  84  |     await expect(wireHits).toHaveCount(wiresBefore + 1);
  85  | 
  86  |     // 3. Click the new wire — regression #2 was the visible stroke eating
  87  |     //    this click. The selection UI (delete button) must appear.
  88  |     // A straight same-row wire has a zero-height geometry, which Playwright
  89  |     // treats as "not visible" and refuses to click. Instead, compute the
  90  |     // midpoint of the wire path in screen coordinates and click with the
  91  |     // real mouse — this still exercises genuine DOM hit-testing (regression
  92  |     // #2 was exactly the visible stroke sitting above this hit path).
  93  |     const wire = wireHits.last();
  94  |     const mid = await wire.evaluate((el) => {
  95  |       const path = el as SVGPathElement;
  96  |       const svg = path.ownerSVGElement!;
  97  |       const p = path.getPointAtLength(path.getTotalLength() / 2);
  98  |       const vb = svg.viewBox.baseVal;
  99  |       const r = svg.getBoundingClientRect();
  100 |       return {
  101 |         x: r.left + ((p.x - vb.x) / vb.width) * r.width,
  102 |         y: r.top + ((p.y - vb.y) / vb.height) * r.height,
  103 |       };
  104 |     });
  105 |     await page.mouse.click(mid.x, mid.y);
  106 |     const deleteBtn = page.getByTestId(c.deleteButton);
  107 |     await expect(deleteBtn).toBeVisible();
  108 | 
  109 |     // 4. Delete it.
  110 |     await deleteBtn.click();
  111 |     await expect(wireHits).toHaveCount(wiresBefore);
  112 |     await expect(deleteBtn).not.toBeVisible();
  113 |   });
  114 | }
  115 | 
```