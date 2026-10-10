import { test, expect } from "@playwright/test";

// Public /hutto route (Hutto Ready integrated demo). Mirrors tests/e2e/demo-door.spec.ts:
// anonymous render across viewports, place form, six cross-platform links, directory
// filtering, landmark structure, no floating widgets, and no horizontal overflow.
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";
const WIDTHS = [375, 1024, 1440] as const;
const HUTTO_TITLE = "Hutto Ready — Every Link, One Community | ThriveUp";

const STRIP = [
  { key: "thriveup", text: /ThriveUp[\s\S]*Community front door/, href: "/hutto" },
  { key: "childcore", text: /ChildCORE[\s\S]*Early childhood/, href: "https://childcorelearning.com/hutto" },
  { key: "lineready", text: /LineReady[\s\S]*Workforce pathways/, href: "https://linereadylabs.com/hutto" },
  { key: "finlitspark", text: /FinLitSpark[\s\S]*Financial readiness/, href: "https://financetrainingandtrading.com/hutto" },
  { key: "hazardaware", text: /HazardAware[\s\S]*Emergency readiness/, href: "https://www.clearsignalresponse.tech/hutto" },
  { key: "fundingpathpro", text: /Funding Path Pro[\s\S]*Grants and funding/, href: "https://pursuitsfundingprofessionals.com/hutto" },
] as const;

for (const width of WIDTHS) {
  test(`/hutto renders anonymously at ${width}px with six links, no auth wall, widget, or overflow`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const failedApi: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() === 401 && !response.url().includes("/api/auth/")) {
        failedApi.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`${BASE}/hutto`, { waitUntil: "networkidle" });
    const root = page.getByTestId("hutto-ready-page");
    await expect(root).toBeVisible();
    await expect(page).toHaveTitle(HUTTO_TITLE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hutto Ready — Every Link, One Community");
    await expect(page.getByText(/sign in to (view|continue)/i)).toHaveCount(0);

    // Exactly one main landmark (the app shell's), and the page root is not a nested <main>.
    await expect(page.locator("main")).toHaveCount(1);
    expect(await root.evaluate((el) => el.tagName)).not.toBe("MAIN");

    // Required labels.
    await expect(page.getByTestId("hutto-disclaimer")).toContainText("Not affiliated with, endorsed by, or sponsored by these organizations.");
    await expect(page.getByTestId("hutto-composite-label")).toHaveText("Illustrative composite family, not a real Hutto record");
    await expect(page.getByTestId("hutto-sponsor-slot")).toHaveText("Community sponsor: to be confirmed");
    // VeraBank is a conversation partner, never presented as the sponsor.
    await expect(page.getByTestId("hutto-stakeholder-verabank")).not.toContainText(/sponsor/i);

    // Every new-tab source link announces that it opens a new tab.
    const newTabLinks = root.locator("a[target='_blank']");
    expect(await newTabLinks.count()).toBeGreaterThan(0);
    const names = await newTabLinks.evaluateAll((els) => els.map((el) => `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`));
    for (const name of names) expect(name).toContain("(opens in a new tab)");

    // Integration Through Invitation is offered before the footer (replit.md Iron Rule 8).
    await expect(page.getByTestId("focused-invitation-toggle")).toBeVisible();
    expect(await page.evaluate(() => {
      const toggle = document.querySelector("[data-testid='focused-invitation-toggle']");
      const footer = document.querySelector("[data-testid='hutto-ready-page'] footer");
      return !!toggle && !!footer && !!(toggle.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);

    // Six-link strip in spec order; ThriveUp is "You are here".
    const strip = page.getByTestId("hutto-ready-strip");
    await expect(strip.locator("li")).toHaveCount(6);
    for (const [i, item] of STRIP.entries()) {
      const link = strip.locator("li").nth(i).getByTestId(`hutto-strip-${item.key}`);
      await expect(link).toHaveText(item.text);
      await expect(link).toHaveAttribute("href", item.href);
    }
    await expect(page.getByTestId("hutto-strip-thriveup")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("hutto-strip-thriveup")).toContainText(/you are here/i);

    // Six numbered journey stops; external stops deep-link to each platform's /hutto page.
    for (let n = 1; n <= 6; n++) await expect(page.getByTestId(`hutto-stop-${n}`)).toBeVisible();
    await expect(page.getByTestId("hutto-stop-1").locator("a[href^='/411?place=']")).toBeVisible();
    for (const [i, item] of STRIP.slice(1).entries()) {
      await expect(page.getByTestId(`hutto-stop-${i + 2}`).locator(`a[href='${item.href}']`)).toBeVisible();
    }

    // No fixed-position floating widgets (Navigator / help launchers) near the bottom-right corner.
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

    expect(failedApi).toEqual([]);
    await context.close();
  });
}

test("/hutto place form recognizes Hutto inputs and rejects other places", async ({ page }) => {
  await page.goto(`${BASE}/hutto`, { waitUntil: "domcontentloaded" });
  const input = page.getByTestId("hutto-place-input");
  const submit = page.getByTestId("hutto-place-submit");
  const result = page.getByTestId("hutto-place-result");
  await expect(input).toBeVisible();

  for (const value of ["Hutto", "Hutto, TX", "78634", "Hutto ISD", "Hutto Independent School District"]) {
    await input.fill(value);
    await submit.click();
    await expect(result).toContainText("Recognized: Hutto, TX (78634), Williamson County");
    await expect(result.locator("a")).toHaveAttribute("href", `/411?place=${encodeURIComponent(value)}`);
  }

  await input.fill("Round Rock, TX");
  await submit.click();
  await expect(result).toContainText("Not a Hutto input");

  await input.fill("   ");
  await expect(submit).toBeDisabled();
});

test("/hutto lists only Hutto / Williamson County directory records and ZIP 78634 mentorship programs", async ({ page }) => {
  await page.goto(`${BASE}/hutto`, { waitUntil: "domcontentloaded" });
  const directory = page.getByTestId("hutto-directory-records").locator(":scope > li");
  const mentorship = page.getByTestId("hutto-mentorship-records").locator(":scope > li");
  await expect(directory.first()).toBeVisible();
  await expect(mentorship.first()).toBeVisible();
  await expect(page.getByTestId("hutto-resources-empty")).toHaveCount(0);

  const directoryTexts = await directory.allInnerTexts();
  expect(directoryTexts.length).toBeGreaterThan(0);
  for (const text of directoryTexts) expect(text, "directory record names Hutto or Williamson").toMatch(/\bhutto\b|williamson/i);
  // National organizations are excluded even if they mention the county.
  expect(directoryTexts.join("\n")).not.toMatch(/\bNAACP\b|\bACLU\b/);

  expect((await mentorship.allInnerTexts()).length).toBeGreaterThan(0);
});

test("/hutto/ (trailing slash) renders the page and keeps floating overlays suppressed", async ({ page }) => {
  await page.goto(`${BASE}/hutto/`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("hutto-ready-page")).toBeVisible();
  await expect(page.getByTestId("button-open-navigator")).toHaveCount(0);
  await expect(page.getByTestId("contextual-help-trigger")).toHaveCount(0);
  const floating = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("body *"))
    .filter((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.position === "fixed" && rect.width > 0 && rect.height > 0 &&
        rect.width < 200 && rect.height < 200 && rect.bottom > innerHeight - 160 && rect.right > innerWidth - 160;
    }).length);
  expect(floating).toBe(0);
});

test("SPA navigation from /demo to /hutto sets the Hutto document title", async ({ page }) => {
  await page.goto(`${BASE}/demo?place=Hutto`, { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(HUTTO_TITLE);
  await page.getByTestId("demo-hutto-link").click();
  await expect(page.getByTestId("hutto-ready-page")).toBeVisible();
  await expect(page).toHaveURL(/\/hutto$/);
  await expect(page).toHaveTitle(HUTTO_TITLE);
});

test("/hutto place input placeholder meets 4.5:1 contrast", async ({ page }) => {
  await page.goto(`${BASE}/hutto`, { waitUntil: "domcontentloaded" });
  const ratio = await page.getByTestId("hutto-place-input").evaluate((el) => {
    const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = ([r, g, b]: number[]) => [r, g, b].map((v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; })
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
    const fg = lum(parse(getComputedStyle(el, "::placeholder").color));
    const bg = lum(parse(getComputedStyle(el).backgroundColor));
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
