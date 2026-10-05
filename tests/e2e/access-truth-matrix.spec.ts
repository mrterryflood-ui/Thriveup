import { test, expect, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { forgeSession, ensureTestUser, cleanupTestUser, requireEnv } from "./helpers/auth";
import { readFileSync } from "node:fs";
const navigationManifest = JSON.parse(readFileSync(new URL("../../shared/route-nav.generated.json", import.meta.url), "utf8"));

/**
 * R2 gate — one source of access truth. The /tools directory, page frame, and sidebar all read the
 * route registry through shared/route-access. This matrix proves, per viewer tier, that:
 *  - anonymous never sees a registry-restricted destination,
 *  - each tier sees exactly the registry-visible rows for the reconciled drift routes,
 *  - /hub/legacy lands on /workspaces.
 * Run: npx playwright test tests/e2e/access-truth-matrix.spec.ts
 */
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const USERS = {
  authenticated: { userId: "e2e-access-truth-student", email: "e2e-access-truth-student@test.local", role: "student" },
  staff: { userId: "e2e-access-truth-teacher", email: "e2e-access-truth-teacher@test.local", role: "teacher" },
  admin: { userId: "e2e-access-truth-admin", email: "e2e-access-truth-admin@test.local", role: "admin" },
} as const;
type Tier = "anonymous" | keyof typeof USERS;

const slug = (p: string) => p.replace(/[^a-z0-9]+/gi, "-");
const REGISTRY_RESTRICTED = ["/grants", "/my-grants", "/grants/applications", "/rfp-fidelity", "/grant-narrative", "/loi-writer", "/grant-packages", "/won-proposals", "/apex-accelerators", "/regional-briefing", "/my-journey", "/my-household", "/my-documents", "/my-appointments"];
/** path → lowest tier that sees it (registry tiers after R2 reconciliation). */
const EXPECTATIONS: Array<{ path: string; visibleFrom: Tier }> = [
  { path: "/reentry", visibleFrom: "anonymous" },
  { path: "/health-network", visibleFrom: "anonymous" },
  { path: "/collaboration-hub", visibleFrom: "anonymous" },
  { path: "/platform-metrics", visibleFrom: "anonymous" },
  { path: "/classrooms", visibleFrom: "authenticated" },
  { path: "/teacher-dashboard", visibleFrom: "authenticated" },
  { path: "/funder-dashboard", visibleFrom: "staff" },
  { path: "/academy/risk-monitor", visibleFrom: "staff" },
  { path: "/stakeholder-map", visibleFrom: "admin" },
];
const ORDER: Tier[] = ["anonymous", "authenticated", "staff", "admin"];
const TITLES: Record<string, string> = Object.fromEntries((navigationManifest as Array<{ path: string; title: string }>).map((r) => [r.path, r.title]));

test.describe("Access truth matrix (registry is the only predicate)", () => {
  let db: Client;
  const cookies: Partial<Record<Tier, string>> = {};

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    for (const [tier, u] of Object.entries(USERS) as Array<[keyof typeof USERS, (typeof USERS)[keyof typeof USERS]]>) {
      await cleanupTestUser(db, u.userId);
      await ensureTestUser(db, { ...u, firstName: "E2E", lastName: "AccessTruth" });
      cookies[tier] = await forgeSession(db, { userId: u.userId, email: u.email });
    }
  });
  test.afterAll(async () => {
    for (const u of Object.values(USERS)) await cleanupTestUser(db, u.userId);
    await db.end();
  });

  async function open(browser: Browser, tier: Tier, path: string): Promise<Page> {
    const ctx = await browser.newContext(tier === "anonymous" ? {} : { extraHTTPHeaders: { Cookie: cookies[tier]! } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    return page;
  }

  for (const tier of ORDER) {
    test(`${tier}: /tools directory shows exactly the registry-visible rows`, async ({ browser }) => {
      const page = await open(browser, tier, "/tools");
      await expect(page.getByTestId("tools-result-count")).toBeVisible({ timeout: 20_000 });
      // viewer role resolves asynchronously; wait for the count to settle on a non-zero value.
      await expect.poll(async () => (await page.getByTestId("tools-result-count").textContent()) ?? "", { timeout: 20_000 }).toMatch(/^[1-9]\d* matching/);
      await page.waitForTimeout(1500);
      // Groups collapse to 12 rows; a search query expands them, so look each path up by its registry title.
      const lookup = async (path: string, shouldSee: boolean) => {
        const title = TITLES[path];
        await page.getByTestId("tools-search").fill(title);
        await expect(page.getByTestId(`tool-link-${slug(path)}`), `${tier} ${shouldSee ? "should" : "must not"} see ${path}`).toHaveCount(shouldSee ? 1 : 0);
      };
      for (const { path, visibleFrom } of EXPECTATIONS) await lookup(path, ORDER.indexOf(tier) >= ORDER.indexOf(visibleFrom));
      if (tier === "anonymous") for (const path of REGISTRY_RESTRICTED) await lookup(path, false);
      await page.context().close();
    });
  }

  test("page frame on a public page never lists a restricted next step for anonymous", async ({ browser }) => {
    const page = await open(browser, "anonymous", "/411");
    await expect(page.getByTestId("page-frame")).toBeVisible();
    for (const path of REGISTRY_RESTRICTED) await expect(page.getByTestId(`page-frame-next-${slug(path)}`)).toHaveCount(0);
    await page.context().close();
  });

  test("/hub/legacy is an alias of /workspaces", async ({ browser }) => {
    const page = await open(browser, "anonymous", "/hub/legacy");
    await expect(page).toHaveURL(/\/workspaces$/);
    await page.context().close();
  });
});
