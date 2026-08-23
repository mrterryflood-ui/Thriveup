import { test, expect } from "@playwright/test";

test.describe("smoke: public pages render", () => {
  test("landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
  });

  test("prior-award research page is admin-gated for anonymous visitors", async ({ page }) => {
    // /grant-prior-awards is wrapped in RequireAuth adminOnly (client/src/App.tsx),
    // so anonymous visitors must see the auth gate, not the page content.
    await page.goto("/grant-prior-awards");
    // First visit may trigger a cold Vite lazy-chunk compile in dev
    await expect(page.getByTestId("auth-gate-blocked")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("button-auth-login")).toBeVisible();
    await expect(page.getByTestId("page-grant-prior-awards")).not.toBeVisible();
  });

  test("ecosystem orchestration page renders 28 platforms + 7 triads", async ({ page }) => {
    await page.goto("/ecosystem-orchestration");
    await expect(page.getByTestId("page-ecosystem-orchestration")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("text-stat-platforms")).toContainText("28");
    await expect(page.getByTestId("text-stat-triads")).toContainText("7");
    await page.getByTestId("tab-triads").click();
    await expect(page.getByTestId("card-triad-health-core-triad")).toBeVisible();
  });

  test("ecosystem orchestration: search filter narrows results", async ({ page }) => {
    await page.goto("/ecosystem-orchestration");
    await page.getByTestId("input-search").fill("sankofa");
    await expect(page.getByTestId("card-platform-sankofa")).toBeVisible();
    await expect(page.getByTestId("card-platform-whole-person-health")).not.toBeVisible();
  });

  test("academy village page still loads after folder reorg", async ({ page }) => {
    await page.goto("/academy");
    await expect(page.getByTestId("academy-village-page")).toBeVisible();
  });
});

test.describe("smoke: API endpoints respond", () => {
  test("GET /api/proposal-pipeline/prior-awards/summary returns 200", async ({ request }) => {
    const res = await request.get("/api/proposal-pipeline/prior-awards/summary");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("proposals");
    expect(body).toHaveProperty("summary.total");
  });

  test("GET /api/ecosystem/registry returns 28 platforms + 7 triads", async ({ request }) => {
    const res = await request.get("/api/ecosystem/registry");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.platformCount).toBe(28);
    expect(body.triadCount).toBe(7);
  });

  test("PATCH prior-awards without auth returns 401", async ({ request }) => {
    const res = await request.patch("/api/proposal-pipeline/nsf-stem-k12/prior-awards", {
      data: { priorAwardsReviewed: true, priorAwardsCount: 5 },
    });
    expect(res.status()).toBe(401);
  });

  test("PATCH prior-awards rejects invalid URL with 401 (auth check first) or 400", async ({ request }) => {
    const res = await request.patch("/api/proposal-pipeline/nsf-stem-k12/prior-awards", {
      data: {
        priorAwardsReviewed: true,
        priorAwardsCount: 1,
        priorAwardsLinks: [{ title: "x", url: "not-a-url" }],
      },
    });
    expect([400, 401]).toContain(res.status());
  });
});
