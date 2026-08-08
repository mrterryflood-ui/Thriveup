import { test, expect } from "@playwright/test";
import { Client } from "pg";
import fs from "fs";
import { execFileSync } from "child_process";
import {
  forgeSession,
  ensureTestUser,
  cleanupTestUser,
  requireEnv,
} from "./helpers/auth";

/**
 * End-to-end verification of the HUD biannual report PDF flow (Task: confirm
 * the HUD PDF downloads correctly from the Reports tab as a real staff user).
 *
 * Signed-in staff session is forged per the shared helper (Replit OIDC can't
 * be scripted); everything after sign-in exercises the REAL flows:
 *  - generate a draft report on /yhsi-ops → HUD Reports tab (UI)
 *  - click "Download HUD PDF" and capture the browser download
 *  - assert the filename is YHSI-HUD-Report-<start>_to_<end>-DRAFT.pdf
 *  - assert it's a valid PDF and suppressed (null) metrics render as
 *    "<5 (suppressed)"
 *  - finalize the report (narrative set via the real PATCH endpoint) and
 *    confirm the final download drops the -DRAFT suffix
 *
 * Run: npx playwright test tests/e2e/hud-report-pdf.spec.ts
 */

const STAFF_ID = "e2e-hud-pdf-staff";
const STAFF_EMAIL = "e2e-hud-pdf-staff@test.local";
// Distant past period: guaranteed zero activity → participants metric is 0
// (not suppressed) but any 1–4 cells elsewhere stay suppressed; more
// importantly the duplicate-period guard won't collide with real reports.
const PERIOD_START = "2001-01-01";
const PERIOD_END = "2001-06-30";

function pdfText(pdfPath: string): string {
  return execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
}

test.describe("HUD report PDF end-to-end (staff)", () => {
  let db: Client;
  let cookie: string;

  test.beforeAll(async () => {
    db = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await db.connect();
    await cleanupTestUser(db, STAFF_ID);
    await ensureTestUser(db, {
      userId: STAFF_ID,
      email: STAFF_EMAIL,
      firstName: "E2E",
      lastName: "HudPdf",
      // /yhsi-ops is adminOnly in the client router (RequireAuth adminOnly);
      // admin also passes the server-side requireStaff gate.
      role: "admin",
    });
    // The client-side RequireAuth adminOnly gate reads users.is_tcaf_admin
    // from /api/auth/user (the users row carries no role field) — set it so
    // the /yhsi-ops page renders; server routes still check academy_avatars.
    await db.query(`UPDATE users SET is_tcaf_admin = true WHERE id = $1`, [STAFF_ID]);
    // Remove any leftover test report for this period (duplicate-period guard).
    await db.query(
      `DELETE FROM yhsi_reports WHERE period_start = $1 AND period_end = $2`,
      [PERIOD_START, PERIOD_END]
    );
    cookie = await forgeSession(db, { userId: STAFF_ID, email: STAFF_EMAIL });
  });

  test.afterAll(async () => {
    await db.query(
      `DELETE FROM yhsi_reports WHERE period_start = $1 AND period_end = $2`,
      [PERIOD_START, PERIOD_END]
    );
    await cleanupTestUser(db, STAFF_ID);
    await db.end();
  });

  test("generate draft on Reports tab, download PDF, verify suppression + final naming", async ({ browser }) => {
    test.setTimeout(180_000); // report generation includes an AI narrative call

    const [name, value] = cookie.split("=");
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addCookies([
      { name, value: decodeURIComponent(value), url: "http://localhost:5000" },
    ]);
    const page = await context.newPage();

    // ── Staff opens /yhsi-ops → HUD Reports tab ──
    await page.goto("/yhsi-ops");
    await expect(page.getByTestId("tab-reports")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("tab-reports").click();

    // ── Generate a draft report ──
    await page.getByTestId("input-period-start").fill(PERIOD_START);
    await page.getByTestId("input-period-end").fill(PERIOD_END);
    await page.getByTestId("button-generate-report").click();

    // Report card appears once generation (incl. AI narrative attempt) finishes.
    const reportCard = page.locator('[data-testid^="report-"]').first();
    await expect(reportCard).toBeVisible({ timeout: 120_000 });

    // Find OUR report's id from the DB (list may contain other reports).
    const { rows } = await db.query(
      `SELECT id, status FROM yhsi_reports WHERE period_start = $1 AND period_end = $2`,
      [PERIOD_START, PERIOD_END]
    );
    expect(rows.length).toBe(1);
    const reportId = rows[0].id as string;
    expect(rows[0].status).toBe("draft");

    // ── Click "Download HUD PDF" and capture the download ──
    const ourCard = page.getByTestId(`report-${reportId}`);
    await ourCard.scrollIntoViewIfNeeded();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      ourCard.getByTestId(`button-pdf-${reportId}`).click(),
    ]);
    expect(download.suggestedFilename()).toBe(
      `YHSI-HUD-Report-${PERIOD_START}_to_${PERIOD_END}-DRAFT.pdf`
    );
    const draftPath = test.info().outputPath("draft.pdf");
    await download.saveAs(draftPath);

    // ── Valid PDF + suppressed cells render as "<5 (suppressed)" ──
    const head = fs.readFileSync(draftPath).subarray(0, 5).toString("latin1");
    expect(head).toBe("%PDF-");
    const text = pdfText(draftPath);
    expect(text).toContain("Youth Homelessness System Improvement (YHSI)");
    expect(text).toContain("Biannual Progress Report");
    expect(text).toContain(`${PERIOD_START} to ${PERIOD_END}`);
    expect(text).toContain("DRAFT");
    // The empty period yields null resolution/stability rates → suppressed text.
    expect(text).toContain("<5 (suppressed)");

    // ── Finalize (real PATCH sets a genuine narrative first, since the AI
    // draft may be the non-finalizable placeholder), then re-download ──
    const patch = await context.request.patch(`/api/yhsi/reports/${reportId}`, {
      data: {
        narrative:
          "No program activity occurred during this reporting period. Referral, housing stability, and youth voice metrics are all zero or suppressed; tracking continues next period.",
        status: "final",
      },
    });
    expect(patch.status()).toBe(200);

    await page.reload();
    await page.getByTestId("tab-reports").click();
    const finalCard = page.getByTestId(`report-${reportId}`);
    await expect(finalCard).toBeVisible({ timeout: 15_000 });
    await finalCard.scrollIntoViewIfNeeded();
    const [finalDownload] = await Promise.all([
      page.waitForEvent("download"),
      finalCard.getByTestId(`button-pdf-${reportId}`).click(),
    ]);
    expect(finalDownload.suggestedFilename()).toBe(
      `YHSI-HUD-Report-${PERIOD_START}_to_${PERIOD_END}.pdf`
    );
    const finalPath = test.info().outputPath("final.pdf");
    await finalDownload.saveAs(finalPath);
    const finalText = pdfText(finalPath);
    expect(finalText).toContain("FINAL");
    expect(finalText).toContain("No program activity occurred");

    await context.close();
  });
});
