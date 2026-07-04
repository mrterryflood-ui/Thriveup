# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> smoke: API endpoints respond >> GET /api/ecosystem/registry returns 24 platforms + 7 triads
- Location: tests/e2e/smoke.spec.ts:50:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 24
Received: 26
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("smoke: public pages render", () => {
  4  |   test("landing page", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/.+/);
  7  |   });
  8  | 
  9  |   test("prior-award research page renders summary cards", async ({ page }) => {
  10 |     await page.goto("/grant-prior-awards");
  11 |     await expect(page.getByTestId("page-grant-prior-awards")).toBeVisible();
  12 |     await expect(page.getByTestId("text-page-title")).toContainText("Prior Award Research");
  13 |     await expect(page.getByTestId("text-stat-total")).toBeVisible();
  14 |     await expect(page.getByTestId("text-stat-percent")).toBeVisible();
  15 |     await expect(page.getByTestId("card-methodology")).toBeVisible();
  16 |     await expect(page.getByTestId("card-sources")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("ecosystem orchestration page renders 24 platforms + 7 triads", async ({ page }) => {
  20 |     await page.goto("/ecosystem-orchestration");
  21 |     await expect(page.getByTestId("page-ecosystem-orchestration")).toBeVisible();
  22 |     await expect(page.getByTestId("text-stat-platforms")).toContainText("24");
  23 |     await expect(page.getByTestId("text-stat-triads")).toContainText("7");
  24 |     await page.getByTestId("tab-triads").click();
  25 |     await expect(page.getByTestId("card-triad-health-core-triad")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("ecosystem orchestration: search filter narrows results", async ({ page }) => {
  29 |     await page.goto("/ecosystem-orchestration");
  30 |     await page.getByTestId("input-search").fill("sankofa");
  31 |     await expect(page.getByTestId("card-platform-sankofa")).toBeVisible();
  32 |     await expect(page.getByTestId("card-platform-whole-person-health")).not.toBeVisible();
  33 |   });
  34 | 
  35 |   test("academy village page still loads after folder reorg", async ({ page }) => {
  36 |     await page.goto("/academy");
  37 |     await expect(page.getByTestId("academy-village-page")).toBeVisible();
  38 |   });
  39 | });
  40 | 
  41 | test.describe("smoke: API endpoints respond", () => {
  42 |   test("GET /api/proposal-pipeline/prior-awards/summary returns 200", async ({ request }) => {
  43 |     const res = await request.get("/api/proposal-pipeline/prior-awards/summary");
  44 |     expect(res.status()).toBe(200);
  45 |     const body = await res.json();
  46 |     expect(body).toHaveProperty("proposals");
  47 |     expect(body).toHaveProperty("summary.total");
  48 |   });
  49 | 
  50 |   test("GET /api/ecosystem/registry returns 24 platforms + 7 triads", async ({ request }) => {
  51 |     const res = await request.get("/api/ecosystem/registry");
  52 |     expect(res.status()).toBe(200);
  53 |     const body = await res.json();
> 54 |     expect(body.platformCount).toBe(24);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  55 |     expect(body.triadCount).toBe(7);
  56 |   });
  57 | 
  58 |   test("PATCH prior-awards without auth returns 401", async ({ request }) => {
  59 |     const res = await request.patch("/api/proposal-pipeline/nsf-stem-k12/prior-awards", {
  60 |       data: { priorAwardsReviewed: true, priorAwardsCount: 5 },
  61 |     });
  62 |     expect(res.status()).toBe(401);
  63 |   });
  64 | 
  65 |   test("PATCH prior-awards rejects invalid URL with 401 (auth check first) or 400", async ({ request }) => {
  66 |     const res = await request.patch("/api/proposal-pipeline/nsf-stem-k12/prior-awards", {
  67 |       data: {
  68 |         priorAwardsReviewed: true,
  69 |         priorAwardsCount: 1,
  70 |         priorAwardsLinks: [{ title: "x", url: "not-a-url" }],
  71 |       },
  72 |     });
  73 |     expect([400, 401]).toContain(res.status());
  74 |   });
  75 | });
  76 | 
```