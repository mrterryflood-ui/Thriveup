import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * R4 gate — the 12 stakeholder-visible story-walk routes at 375 / 1024 / 1440.
 * Mechanical defect checks (no human eyeballing required to fail):
 *  - no horizontal page overflow at any width,
 *  - no clipped text (element whose text overflows a hidden box without an ellipsis),
 *  - every visible interactive control is at least 44×44 CSS px on the phone width
 *    (the platform's min-h-11 standard),
 *  - body text contrast ≥ 4.5:1 (≥ 3:1 for large text) against its effective background,
 *  - no "Internal tool" grade badge (these are stakeholder-grade surfaces by definition).
 * Full-page screenshots land in screenshots/r4/ for the human review the plan also asks for.
 * Run: npx playwright test tests/e2e/presentation-grade.spec.ts
 */
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const PLACE = "Hutto, TX";
const ROUTES = ["/411", "/benefits-screener", "/parents", "/academy/financial-literacy", "/academy/careers", "/impact", "/community-analysis", "/corridor-intelligence", "/chainweb", "/community-gravity", "/community-banks", "/community-map"];
const WIDTHS = [375, 1024, 1440] as const;
const OUT = "screenshots/r4";
mkdirSync(OUT, { recursive: true });

type Audit = { overflow: number; clipped: string[]; smallTargets: string[]; lowContrast: string[] };

async function audit(page: Page, phone: boolean): Promise<Audit> {
  return page.evaluate((phone) => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width <= 1 && r.height <= 1) return false; // sr-only
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
    };
    const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.getAttribute("data-testid") ? `[${el.getAttribute("data-testid")}]` : ""} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40)}"`;
    const overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);

    const clipped: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      if (!visible(el) || !el.textContent?.trim()) continue;
      const cs = getComputedStyle(el);
      const hidesX = cs.overflowX === "hidden" || cs.overflowX === "clip";
      if (!hidesX || cs.textOverflow === "ellipsis") continue;
      if ((cs as unknown as { webkitLineClamp?: string }).webkitLineClamp && (cs as unknown as { webkitLineClamp?: string }).webkitLineClamp !== "none") continue; // intentional line-clamp
      if (el.children.length > 0) continue; // only leaf text boxes
      if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) clipped.push(describe(el));
    }

    const smallTargets: string[] = [];
    if (phone) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [role=button], [role=tab]"))) {
        if (!visible(el)) continue;
        if (el.closest("[data-testid='page-frame']")) continue; // frame already gated by min-h-11
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) continue;
        const inline = getComputedStyle(el).display === "inline" && el.tagName === "A" && el.closest("p, li, span");
        if (inline) continue; // inline prose links are governed by line height, exempt per WCAG 2.5.8
        if (el.getAttribute("role") === "switch") { if (r.height < 24 || r.width < 24) smallTargets.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`); continue; } // WCAG 2.5.8 AA floor for toggles
        if (r.width < 44 || r.height < 44) smallTargets.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }

    const parse = (c: string): [number, number, number, number] | null => {
      const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const lum = ([r, g, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const blend = (fg: number[], bg: number[]) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
    const bgOf = (el: Element | null): number[] | null => {
      let acc: number[] | null = null;
      const target = el?.getBoundingClientRect();
      for (let n: Element | null = el; n; n = n.parentElement) {
        // Hero pattern: an absolutely positioned sibling layer (gradient / photo) covers the text's box.
        if (n !== el && target) {
          for (const layer of Array.from(n.children)) {
            if (layer === el || layer.contains(el!)) continue;
            const lcs = getComputedStyle(layer);
            if (lcs.position !== "absolute" && lcs.position !== "fixed") continue;
            const lr = layer.getBoundingClientRect();
            if (lr.left > target.left || lr.top > target.top || lr.right < target.right || lr.bottom < target.bottom) continue;
            if (lcs.backgroundImage !== "none") return null;
            const lc = parse(lcs.backgroundColor);
            if (lc && lc[3] > 0) { acc = acc ? blend(acc, lc) : lc; if (lc[3] >= 1) return acc; }
          }
        }
        const cs = getComputedStyle(n);
        if (cs.backgroundImage !== "none" && !(acc && acc[3] >= 1)) return null; // gradient/photo: not mechanically decidable
        const c = parse(cs.backgroundColor);
        if (c && c[3] > 0) { acc = acc ? blend(acc, c) : c; if (c[3] >= 1) return acc; }
      }
      return acc ? blend(acc, [255, 255, 255, 1]) : [255, 255, 255, 1];
    };
    const lowContrast: string[] = [];
    const seen = new Set<string>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode as Text; const el = t.parentElement; if (!el || !t.textContent?.trim() || !visible(el)) continue;
      if (el.closest("script, style, svg, [aria-hidden='true']")) continue;
      const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) continue;
      const bg = bgOf(el); if (!bg) continue; const f = fg[3] < 1 ? blend(fg, bg) : fg;
      const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (ratio < need) { const d = `${describe(el)} ${ratio.toFixed(2)}:1`; if (!seen.has(d)) { seen.add(d); lowContrast.push(d); } }
    }
    return { overflow, clipped, smallTargets, lowContrast };
  }, phone);
}

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} @ ${width}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, colorScheme: "light" });
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${BASE}${route}?place=${encodeURIComponent(PLACE)}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
      await page.waitForTimeout(800);
      const slug = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-/, "");
      await page.screenshot({ path: `${OUT}/${slug}-${width}.jpg`, fullPage: true, quality: 60, type: "jpeg" });
      const a = await audit(page, width === 375);
      const h1 = await page.locator("h1").count();
      await expect(page.getByTestId("page-frame-grade").filter({ hasText: "Internal tool" }), "stakeholder surface must not be graded internal").toHaveCount(0);
      const defects = [
        ...(h1 === 0 ? ["no <h1> landmark"] : []),
        ...errors.map((e) => `js error: ${e}`),
        ...(a.overflow > 1 ? [`horizontal overflow ${a.overflow}px`] : []),
        ...a.clipped.map((c) => `clipped: ${c}`),
        ...a.smallTargets.map((c) => `small target: ${c}`),
        ...a.lowContrast.map((c) => `contrast: ${c}`),
      ];
      expect(defects, `${route} @ ${width}`).toEqual([]);
      await ctx.close();
    });
  }
}
