# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hud-report-pdf.spec.ts >> HUD report PDF end-to-end (staff) >> generate draft on Reports tab, download PDF, verify suppression + final naming
- Location: tests/e2e/hud-report-pdf.spec.ts:79:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/yhsi-ops
Call log:
  - navigating to "http://localhost:5000/yhsi-ops", waiting until "load"

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
  1   | import { test, expect } from "@playwright/test";
  2   | import { Client } from "pg";
  3   | import fs from "fs";
  4   | import { execFileSync } from "child_process";
  5   | import {
  6   |   forgeSession,
  7   |   ensureTestUser,
  8   |   cleanupTestUser,
  9   |   requireEnv,
  10  | } from "./helpers/auth";
  11  | 
  12  | /**
  13  |  * End-to-end verification of the HUD biannual report PDF flow (Task: confirm
  14  |  * the HUD PDF downloads correctly from the Reports tab as a real staff user).
  15  |  *
  16  |  * Signed-in staff session is forged per the shared helper (Replit OIDC can't
  17  |  * be scripted); everything after sign-in exercises the REAL flows:
  18  |  *  - generate a draft report on /yhsi-ops → HUD Reports tab (UI)
  19  |  *  - click "Download HUD PDF" and capture the browser download
  20  |  *  - assert the filename is YHSI-HUD-Report-<start>_to_<end>-DRAFT.pdf
  21  |  *  - assert it's a valid PDF and suppressed (null) metrics render as
  22  |  *    "<5 (suppressed)"
  23  |  *  - finalize the report (narrative set via the real PATCH endpoint) and
  24  |  *    confirm the final download drops the -DRAFT suffix
  25  |  *
  26  |  * Run: npx playwright test tests/e2e/hud-report-pdf.spec.ts
  27  |  */
  28  | 
  29  | const STAFF_ID = "e2e-hud-pdf-staff";
  30  | const STAFF_EMAIL = "e2e-hud-pdf-staff@test.local";
  31  | // Distant past period: guaranteed zero activity → participants metric is 0
  32  | // (not suppressed) but any 1–4 cells elsewhere stay suppressed; more
  33  | // importantly the duplicate-period guard won't collide with real reports.
  34  | const PERIOD_START = "2001-01-01";
  35  | const PERIOD_END = "2001-06-30";
  36  | 
  37  | function pdfText(pdfPath: string): string {
  38  |   return execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
  39  | }
  40  | 
  41  | test.describe("HUD report PDF end-to-end (staff)", () => {
  42  |   let db: Client;
  43  |   let cookie: string;
  44  | 
  45  |   test.beforeAll(async () => {
  46  |     db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  47  |     await db.connect();
  48  |     await cleanupTestUser(db, STAFF_ID);
  49  |     await ensureTestUser(db, {
  50  |       userId: STAFF_ID,
  51  |       email: STAFF_EMAIL,
  52  |       firstName: "E2E",
  53  |       lastName: "HudPdf",
  54  |       // /yhsi-ops is adminOnly in the client router (RequireAuth adminOnly);
  55  |       // admin also passes the server-side requireStaff gate.
  56  |       role: "admin",
  57  |     });
  58  |     // The client-side RequireAuth adminOnly gate reads users.is_tcaf_admin
  59  |     // from /api/auth/user (the users row carries no role field) — set it so
  60  |     // the /yhsi-ops page renders; server routes still check academy_avatars.
  61  |     await db.query(`UPDATE users SET is_tcaf_admin = true WHERE id = $1`, [STAFF_ID]);
  62  |     // Remove any leftover test report for this period (duplicate-period guard).
  63  |     await db.query(
  64  |       `DELETE FROM yhsi_reports WHERE period_start = $1 AND period_end = $2`,
  65  |       [PERIOD_START, PERIOD_END]
  66  |     );
  67  |     cookie = await forgeSession(db, { userId: STAFF_ID, email: STAFF_EMAIL });
  68  |   });
  69  | 
  70  |   test.afterAll(async () => {
  71  |     await db.query(
  72  |       `DELETE FROM yhsi_reports WHERE period_start = $1 AND period_end = $2`,
  73  |       [PERIOD_START, PERIOD_END]
  74  |     );
  75  |     await cleanupTestUser(db, STAFF_ID);
  76  |     await db.end();
  77  |   });
  78  | 
  79  |   test("generate draft on Reports tab, download PDF, verify suppression + final naming", async ({ browser }) => {
  80  |     test.setTimeout(180_000); // report generation includes an AI narrative call
  81  | 
  82  |     const [name, value] = cookie.split("=");
  83  |     const context = await browser.newContext({ acceptDownloads: true });
  84  |     await context.addCookies([
  85  |       { name, value: decodeURIComponent(value), url: "http://localhost:5000" },
  86  |     ]);
  87  |     const page = await context.newPage();
  88  | 
  89  |     // ── Staff opens /yhsi-ops → HUD Reports tab ──
> 90  |     await page.goto("/yhsi-ops");
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/yhsi-ops
  91  |     await expect(page.getByTestId("tab-reports")).toBeVisible({ timeout: 15_000 });
  92  |     await page.getByTestId("tab-reports").click();
  93  | 
  94  |     // ── Generate a draft report ──
  95  |     await page.getByTestId("input-period-start").fill(PERIOD_START);
  96  |     await page.getByTestId("input-period-end").fill(PERIOD_END);
  97  |     await page.getByTestId("button-generate-report").click();
  98  | 
  99  |     // Report card appears once generation (incl. AI narrative attempt) finishes.
  100 |     const reportCard = page.locator('[data-testid^="report-"]').first();
  101 |     await expect(reportCard).toBeVisible({ timeout: 120_000 });
  102 | 
  103 |     // Find OUR report's id from the DB (list may contain other reports).
  104 |     const { rows } = await db.query(
  105 |       `SELECT id, status FROM yhsi_reports WHERE period_start = $1 AND period_end = $2`,
  106 |       [PERIOD_START, PERIOD_END]
  107 |     );
  108 |     expect(rows.length).toBe(1);
  109 |     const reportId = rows[0].id as string;
  110 |     expect(rows[0].status).toBe("draft");
  111 | 
  112 |     // ── Click "Download HUD PDF" and capture the download ──
  113 |     const ourCard = page.getByTestId(`report-${reportId}`);
  114 |     await ourCard.scrollIntoViewIfNeeded();
  115 |     const [download] = await Promise.all([
  116 |       page.waitForEvent("download"),
  117 |       ourCard.getByTestId(`button-pdf-${reportId}`).click(),
  118 |     ]);
  119 |     expect(download.suggestedFilename()).toBe(
  120 |       `YHSI-HUD-Report-${PERIOD_START}_to_${PERIOD_END}-DRAFT.pdf`
  121 |     );
  122 |     const draftPath = test.info().outputPath("draft.pdf");
  123 |     await download.saveAs(draftPath);
  124 | 
  125 |     // ── Valid PDF + suppressed cells render as "<5 (suppressed)" ──
  126 |     const head = fs.readFileSync(draftPath).subarray(0, 5).toString("latin1");
  127 |     expect(head).toBe("%PDF-");
  128 |     const text = pdfText(draftPath);
  129 |     expect(text).toContain("Youth Homelessness System Improvement (YHSI)");
  130 |     expect(text).toContain("Biannual Progress Report");
  131 |     expect(text).toContain(`${PERIOD_START} to ${PERIOD_END}`);
  132 |     expect(text).toContain("DRAFT");
  133 |     // The empty period yields null resolution/stability rates → suppressed text.
  134 |     expect(text).toContain("<5 (suppressed)");
  135 | 
  136 |     // ── Finalize (real PATCH sets a genuine narrative first, since the AI
  137 |     // draft may be the non-finalizable placeholder), then re-download ──
  138 |     const patch = await context.request.patch(`/api/yhsi/reports/${reportId}`, {
  139 |       data: {
  140 |         narrative:
  141 |           "No program activity occurred during this reporting period. Referral, housing stability, and youth voice metrics are all zero or suppressed; tracking continues next period.",
  142 |         status: "final",
  143 |       },
  144 |     });
  145 |     expect(patch.status()).toBe(200);
  146 | 
  147 |     await page.reload();
  148 |     await page.getByTestId("tab-reports").click();
  149 |     const finalCard = page.getByTestId(`report-${reportId}`);
  150 |     await expect(finalCard).toBeVisible({ timeout: 15_000 });
  151 |     await finalCard.scrollIntoViewIfNeeded();
  152 |     const [finalDownload] = await Promise.all([
  153 |       page.waitForEvent("download"),
  154 |       finalCard.getByTestId(`button-pdf-${reportId}`).click(),
  155 |     ]);
  156 |     expect(finalDownload.suggestedFilename()).toBe(
  157 |       `YHSI-HUD-Report-${PERIOD_START}_to_${PERIOD_END}.pdf`
  158 |     );
  159 |     const finalPath = test.info().outputPath("final.pdf");
  160 |     await finalDownload.saveAs(finalPath);
  161 |     const finalText = pdfText(finalPath);
  162 |     expect(finalText).toContain("FINAL");
  163 |     expect(finalText).toContain("No program activity occurred");
  164 | 
  165 |     await context.close();
  166 |   });
  167 | });
  168 | 
```