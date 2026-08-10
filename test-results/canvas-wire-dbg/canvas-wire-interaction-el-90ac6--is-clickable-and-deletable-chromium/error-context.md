# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: canvas-wire-interaction.spec.ts >> electrical canvas: wire start persists, wire is clickable and deletable
- Location: tests/e2e/canvas-wire-interaction.spec.ts:63:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/academy/trade-sims/electrical/ohms-law
Call log:
  - navigating to "http://localhost:5000/academy/trade-sims/electrical/ohms-law", waiting until "load"

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
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/academy/trade-sims/electrical/ohms-law
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
  88  |     // A straight same-row wire has a zero-height geometry bbox, which
  89  |     // Playwright treats as "not visible" — click via real mouse coordinates
  90  |     // at the wire midpoint instead (still exercises real DOM hit-testing).
  91  |     const wire = wireHits.last();
  92  |     const box = await wire.boundingBox();
  93  |     if (box && box.width >= 2 && box.height >= 2) {
  94  |       await wire.click();
  95  |     } else {
  96  |       const [ba, bb] = [await termA.boundingBox(), await termB.boundingBox()];
  97  |       if (!ba || !bb) throw new Error("terminal bounding boxes unavailable");
  98  |       await page.mouse.click(
  99  |         (ba.x + ba.width / 2 + bb.x + bb.width / 2) / 2,
  100 |         (ba.y + ba.height / 2 + bb.y + bb.height / 2) / 2,
  101 |       );
  102 |     }
  103 |     const deleteBtn = page.getByTestId(c.deleteButton);
  104 |     await expect(deleteBtn).toBeVisible();
  105 | 
  106 |     // 4. Delete it.
  107 |     await deleteBtn.click();
  108 |     await expect(wireHits).toHaveCount(wiresBefore);
  109 |     await expect(deleteBtn).not.toBeVisible();
  110 |   });
  111 | }
  112 | 
```