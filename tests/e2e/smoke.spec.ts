import { test, expect } from "@playwright/test";

test.describe("smoke: public pages render", () => {
  test("landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
  });

  test("prior-award research page renders summary cards", async ({ page }) => {
    await page.goto("/grant-prior-awards");
    await expect(page.getByTestId("page-grant-prior-awards")).toBeVisible();
    await expect(page.getByTestId("text-page-title")).toContainText("Prior Award Research");
    await expect(page.getByTestId("text-stat-total")).toBeVisible();
    await expect(page.getByTestId("text-stat-percent")).toBeVisible();
    await expect(page.getByTestId("card-methodology")).toBeVisible();
    await expect(page.getByTestId("card-sources")).toBeVisible();
  });

  test("ecosystem orchestration page renders 24 platforms + 7 triads", async ({ page }) => {
    await page.goto("/ecosystem-orchestration");
    await expect(page.getByTestId("page-ecosystem-orchestration")).toBeVisible();
    await expect(page.getByTestId("text-stat-platforms")).toContainText("24");
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

  test("GET /api/ecosystem/registry returns 24 platforms + 7 triads", async ({ request }) => {
    const res = await request.get("/api/ecosystem/registry");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.platformCount).toBe(24);
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
