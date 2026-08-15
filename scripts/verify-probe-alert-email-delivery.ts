#!/usr/bin/env tsx
/**
 * Integration check: does the probe alert email actually get accepted by the
 * real Resend API — the same call path community-brief-probe.ts uses when the
 * analyzer goes DOWN?
 *
 * ── What this verifies vs. what it cannot ────────────────────────────────────
 * VERIFIED (by this script):
 *   • getResendClient() obtains Resend credentials from the Replit connector
 *   • client.emails.send() returns a non-error response with a message ID,
 *     proving the Resend wire is live and the API key is valid
 *   • The "from" address / sender the probe would use is accepted by Resend
 *   • The full call path (getResendClient → client.emails.send) that
 *     sendEcosystemUpdate() wraps succeeds end-to-end with a real test email
 *
 * BEST-EFFORT / NOT VERIFIED (inherent limits):
 *   • Inbox delivery — Resend returning HTTP 200 + a message ID is the best
 *     signal available without inbox API access.  Acceptance does not guarantee
 *     inbox placement (spam filters, DNS reputation).
 *   • Production ADMIN_EMAIL reachability — see PRODUCTION GAP section below.
 *
 * ── Rate-limiting tradeoff ───────────────────────────────────────────────────
 * Decision: manually-triggered, NOT part of every CI gate run.
 *
 * Rationale: sending a real email on every gate run (~dozens/day) would
 * generate inbox noise and approach Resend free-tier limits.  A manually-run
 * script gives a crisp, on-demand "is the wire live?" answer.  The gate
 * already exercises the logic layer (mocked) via verify-community-brief-probe-logic.ts;
 * this script is the complementary "is the Resend API actually reachable and
 * accepting messages?" check to run deliberately — e.g., after a Resend
 * connector change, after a suspicious gap in probe alerts, or as part of a
 * staged release review.
 *
 * ── PRODUCTION GAP (surfaced by running this script) ────────────────────────
 * Resend enforces "test mode" when the sending domain is not verified.
 * In test mode it rejects any "to" address that is not the account owner's
 * registered email (mr.terryflood@gmail.com).
 *
 * The real probe calls sendEcosystemUpdate() which hardcodes
 * to: "president@thecollaborativeadvocate.org" (ADMIN_EMAIL).
 * Resend rejects that with:
 *   403 validation_error — "You can only send testing emails to your own
 *   email address (mr.terryflood@gmail.com)."
 *
 * This means: until a custom domain is verified in Resend, every DOWN alert
 * the probe fires will be silently swallowed (sendDownAlert catches the error
 * and logs it, but no email reaches any inbox).
 *
 * Remediation: verify thrivingcommunitiesforall.com (or another owned domain)
 * at https://resend.com/domains and update from_email in the Resend connector
 * settings.  Once done, this script will pass using the real ADMIN_EMAIL
 * (set PROBE_ALERT_TEST_RECIPIENT=president@thecollaborativeadvocate.org).
 *
 * Until then, this script uses the account owner's address (the only address
 * Resend's test mode accepts) to prove the Resend wire itself is live.
 *
 * Usage:
 *   npx tsx scripts/verify-probe-alert-email-delivery.ts
 *
 *   After domain verification, override recipient:
 *   PROBE_ALERT_TEST_RECIPIENT=president@thecollaborativeadvocate.org \
 *     npx tsx scripts/verify-probe-alert-email-delivery.ts
 */

import { Resend } from "resend";

// ── Resend client (same logic as server/email-service.ts getResendClient) ────

async function getResendClient(): Promise<{ client: Resend; fromEmail: string } | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    console.error("  ✗ Resend connector env vars not set (REPLIT_CONNECTORS_HOSTNAME / REPL_IDENTITY)");
    return null;
  }

  let connectionSettings: any;
  try {
    const data: any = await fetch(
      "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
      { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
    ).then((res) => res.json());
    connectionSettings = data.items?.[0];
  } catch (err: any) {
    console.error("  ✗ Failed to fetch Resend connector settings:", err?.message || err);
    return null;
  }

  if (!connectionSettings?.settings?.api_key) {
    console.error("  ✗ Resend API key not found in connector settings");
    return null;
  }

  const configuredFrom = connectionSettings.settings.from_email || "";
  const isFreeDomain =
    configuredFrom.includes("gmail.com") ||
    configuredFrom.includes("yahoo.com") ||
    configuredFrom.includes("hotmail.com") ||
    configuredFrom.includes("outlook.com") ||
    !configuredFrom;

  const fromEmail = isFreeDomain
    ? "ThriveUp Academy <onboarding@resend.dev>"
    : configuredFrom;

  console.log(`  Resend from_email : ${configuredFrom || "(not set)"}`);
  console.log(`  Effective sender  : ${fromEmail}`);
  if (isFreeDomain && configuredFrom) {
    console.log("  ⚠  Free-provider from_email → Resend sandbox sender in use (test mode)");
  }

  return { client: new Resend(connectionSettings.settings.api_key), fromEmail };
}

// ── Config ────────────────────────────────────────────────────────────────────

/**
 * Test recipient.
 *
 * In Resend's test mode (unverified domain), only the account owner's registered
 * address is accepted.  mr.terryflood@gmail.com is that address.
 *
 * Override with PROBE_ALERT_TEST_RECIPIENT once a custom domain is verified —
 * then you can prove that president@thecollaborativeadvocate.org (the real
 * ADMIN_EMAIL the probe sends to) is also accepted.
 */
const TEST_RECIPIENT =
  process.env.PROBE_ALERT_TEST_RECIPIENT || "mr.terryflood@gmail.com";

// ── Test email body ────────────────────────────────────────────────────────────

function buildTestAlertHtml(ts: string, recipient: string): string {
  return `
    <div style="max-width:600px;font-family:Arial,sans-serif">
      <div style="background:#dc3545;color:white;padding:16px;border-radius:6px 6px 0 0">
        <h2 style="margin:0;font-size:18px">Community Impact Analyzer — PROBE DELIVERY INTEGRATION TEST</h2>
        <p style="margin:6px 0 0;font-size:13px;opacity:.9">
          This is a delivery check — NOT a real outage alert.
        </p>
      </div>
      <div style="padding:16px;border:1px solid #ddd;border-top:none;background:white">
        <p style="color:#856404;font-weight:bold;background:#fff3cd;border-left:4px solid #ffc107;padding:10px;border-radius:4px;">
          ✉ This email was sent by <code>scripts/verify-probe-alert-email-delivery.ts</code> to confirm
          that the Resend API path used by the production probe is live and accepting messages.
          No analyzer outage has occurred.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
          <tr>
            <td style="padding:6px 10px;color:#666">Script:</td>
            <td style="padding:6px 10px;font-family:monospace">scripts/verify-probe-alert-email-delivery.ts</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:6px 10px;color:#666">Sent at:</td>
            <td style="padding:6px 10px">${ts}</td>
          </tr>
          <tr>
            <td style="padding:6px 10px;color:#666">Test recipient:</td>
            <td style="padding:6px 10px">${recipient}</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:6px 10px;color:#666">Call path:</td>
            <td style="padding:6px 10px">getResendClient() → client.emails.send() — same as sendEcosystemUpdate()</td>
          </tr>
        </table>
        <div style="background:#d4edda;border-left:4px solid #276749;padding:12px;border-radius:4px;margin-top:12px">
          <strong>If you received this email:</strong>
          <ul style="margin:8px 0 0;padding-left:18px;font-size:13px">
            <li>Resend accepted the message (HTTP 200 + message ID logged to console)</li>
            <li>The Resend connector credentials are valid</li>
            <li>The Resend send path is live and functional</li>
          </ul>
        </div>
        <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;border-radius:4px;margin-top:12px">
          <strong>⚠ Outstanding production gap:</strong>
          <p style="margin:8px 0 0;font-size:13px">
            The real probe alert sends to <code>president@thecollaborativeadvocate.org</code>.
            Resend test mode (no verified domain) rejects that address with a 403.
            Verify a custom domain at <a href="https://resend.com/domains">resend.com/domains</a>,
            then re-run this script with:<br/>
            <code>PROBE_ALERT_TEST_RECIPIENT=president@thecollaborativeadvocate.org npx tsx scripts/verify-probe-alert-email-delivery.ts</code>
          </p>
        </div>
        <p style="font-size:12px;color:#888;margin-top:16px">
          <strong>On inbox delivery:</strong> Resend accepting this message is the best
          externally-verifiable signal available without inbox API access. It does not
          guarantee spam-filter bypass. If you did not receive it, check spam and Resend's
          delivery logs.
        </p>
      </div>
    </div>
  `;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const ts = new Date().toISOString();

  console.log("\n── Community-brief probe alert email delivery check ──");
  console.log(`  Test recipient : ${TEST_RECIPIENT}`);
  console.log(`  Started at     : ${ts}`);
  console.log(`  Call path      : getResendClient() → client.emails.send() (same as sendEcosystemUpdate)\n`);

  const resend = await getResendClient();
  if (!resend) {
    console.error("\n  ✗ FAIL — could not obtain Resend client (see errors above)");
    process.exit(1);
  }

  const subject = "[TEST] Community Brief probe alert delivery check";

  console.log("  Sending test email through the real Resend API...");
  const result = await resend.client.emails.send({
    from: resend.fromEmail,
    to: TEST_RECIPIENT,
    subject: `[Ecosystem] ${subject}`,
    html: buildTestAlertHtml(ts, TEST_RECIPIENT),
  });

  if (result?.error) {
    console.error(`\n  ✗ FAIL — Resend API returned an error:`);
    console.error(`    ${JSON.stringify(result.error)}`);
    console.error("\n  Interpretation:");
    if ((result.error as any).statusCode === 403) {
      console.error("    403 validation_error — Resend test mode: recipient must be the account owner's address.");
      console.error(`    The probe's real ADMIN_EMAIL (president@thecollaborativeadvocate.org) will be rejected`);
      console.error("    until a custom domain is verified at resend.com/domains.");
      console.error(`    Re-run with: PROBE_ALERT_TEST_RECIPIENT=${TEST_RECIPIENT}`);
    } else {
      console.error("    Check the Resend API key, connector settings, and recipient address.");
    }
    process.exit(1);
  }

  const messageId = result?.data?.id;
  if (!messageId) {
    console.error("\n  ✗ FAIL — Resend returned success but no message ID (unexpected response shape)");
    console.error("    Raw result:", JSON.stringify(result));
    process.exit(1);
  }

  console.log(`\n  ✓ PASS — Resend accepted the message`);
  console.log(`    Message ID : ${messageId}`);
  console.log(`    To         : ${TEST_RECIPIENT}`);
  console.log(`    From       : ${resend.fromEmail}`);

  console.log("\n  What this confirms:");
  console.log("    • Resend connector credentials are valid and reachable");
  console.log("    • client.emails.send() — the call sendEcosystemUpdate() wraps — returned HTTP 200");
  console.log("    • The Resend wire is live; the API key is accepted");
  console.log(`    • A test email was dispatched to: ${TEST_RECIPIENT}`);

  console.log("\n  What this does NOT confirm:");
  console.log("    • Inbox placement (Resend accepted ≠ guaranteed inbox delivery)");
  console.log("    • Spam-filter bypass — verify receipt in the inbox and spam folder");
  console.log("    • That the real ADMIN_EMAIL (president@thecollaborativeadvocate.org)");
  console.log("      is reachable — see PRODUCTION GAP below");

  console.log("\n  ⚠  PRODUCTION GAP:");
  console.log("    Resend is in test mode (sending domain not verified).");
  console.log("    The real probe alerts send to president@thecollaborativeadvocate.org,");
  console.log("    which Resend rejects with 403 until a custom domain is verified.");
  console.log("    This means DOWN alerts are currently silently swallowed.");
  console.log("    Remediation: verify thrivingcommunitiesforall.com at resend.com/domains,");
  console.log("    update from_email in Resend connector, then re-run this script with:");
  console.log("    PROBE_ALERT_TEST_RECIPIENT=president@thecollaborativeadvocate.org");

  console.log("\n  To verify inbox receipt: check the inbox/spam for:");
  console.log(`    Subject: [Ecosystem] ${subject}`);
  console.log("\n── Check complete ──\n");
}

main().catch((err) => {
  console.error("\n  ✗ Unexpected error:", err?.message || err);
  process.exit(1);
});
