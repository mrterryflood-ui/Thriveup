/**
 * SMS service — one-way delivery of referral status links to clients.
 *
 * Provider priority:
 *   1. Twilio — if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER
 *      are all set, SMS is sent via the Twilio Messages REST API (no SDK required).
 *   2. No-op  — if credentials are absent, the attempt is logged at WARN level and
 *      the caller continues normally. Failure to send SMS never blocks referral creation.
 *
 * Security: this module never logs the client phone number or the full status URL.
 */

interface SmsSendResult {
  sent: boolean;
  provider: "twilio" | "none";
  sid?: string;
}

async function sendViaTwilio(
  to: string,
  body: string,
  accountSid: string,
  authToken: string,
  from: string,
): Promise<SmsSendResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data: any = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      `Twilio ${res.status}: ${data?.message || data?.code || "unknown error"}`,
    );
  }

  return { sent: true, provider: "twilio", sid: data.sid };
}

/**
 * Send the referral status link to the client's phone number.
 *
 * @param clientPhone  E.164 or local phone number provided by the CHW.
 * @param statusToken  The opaque token from the referrals table (not a full URL).
 * @param baseUrl      Deployment base URL (e.g. "https://app.example.com"). Falls
 *                     back to the REPLIT_DEV_DOMAIN env var, then a generic note.
 */
export async function sendReferralStatusSms(
  clientPhone: string,
  statusToken: string,
  baseUrl?: string,
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    console.warn(
      "[SMS] Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER). " +
        "Client status-link SMS was not sent.",
    );
    return;
  }

  // Build the status URL without leaking the full phone number into logs.
  const resolvedBase =
    baseUrl ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : null);

  const statusUrl = resolvedBase
    ? `${resolvedBase}/status/${statusToken}`
    : `/status/${statusToken}`;

  const messageBody =
    `Your ThriveUp referral has been submitted. ` +
    `Track your status at any time: ${statusUrl}`;

  try {
    const result = await sendViaTwilio(clientPhone, messageBody, accountSid, authToken, from);
    console.log(`[SMS] Sent referral status link to client. provider=${result.provider} sid=${result.sid}`);
  } catch (err: any) {
    // Log failure but never surface it to the caller — SMS is best-effort.
    console.error("[SMS] Failed to deliver referral status link:", err.message || err);
  }
}
