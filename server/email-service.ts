import { Resend } from "resend";

async function getResendClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    throw new Error("Resend connector not available");
  }

  const connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
  )
    .then((res) => res.json())
    .then((data: any) => data.items?.[0]);

  if (!connectionSettings?.settings?.api_key) {
    throw new Error("Resend not connected");
  }

  const configuredFrom = connectionSettings.settings.from_email || "";
  const isGmail = configuredFrom.toLowerCase().includes("gmail.com");
  const isYahoo = configuredFrom.toLowerCase().includes("yahoo.com");
  const isHotmail = configuredFrom.toLowerCase().includes("hotmail.com") || configuredFrom.toLowerCase().includes("outlook.com");
  const useFreeProvider = isGmail || isYahoo || isHotmail || !configuredFrom;

  const fromEmail = useFreeProvider
    ? "ThriveUp Academy <onboarding@resend.dev>"
    : configuredFrom;

  if (useFreeProvider && configuredFrom) {
    console.log(`[Email] Overriding from_email: "${configuredFrom}" is not a verified domain. Using Resend default sender. To fix permanently, verify your custom domain (e.g. thrivingcommunitiesforall.com) at https://resend.com/domains`);
  }

  return {
    client: new Resend(connectionSettings.settings.api_key),
    fromEmail,
  };
}

const ADMIN_EMAIL = "president@thecollaborativeadvocate.org";

async function safeSend(sendFn: () => Promise<any>, context: string): Promise<boolean> {
  try {
    const result = await sendFn();
    if (result?.error) {
      console.error(`[Email] FAILED (${context}):`, JSON.stringify(result.error));
      return false;
    }
    console.log(`[Email] SENT (${context}): id=${result?.data?.id || "unknown"}`);
    return true;
  } catch (err: any) {
    console.error(`[Email] ERROR (${context}):`, err.message || err);
    return false;
  }
}

export async function sendContactInquiry(
  name: string,
  email: string,
  message: string,
  inquiryType: string
) {
  const { client, fromEmail } = await getResendClient();

  await safeSend(() => client.emails.send({
    from: fromEmail,
    to: ADMIN_EMAIL,
    subject: `[ThriveUp] New ${inquiryType} inquiry from ${name}`,
    html: `
      <h2>New Contact Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Type:</strong> ${inquiryType}</p>
      <hr/>
      <p>${message.replace(/\n/g, "<br/>")}</p>
    `,
  }), `contact-inquiry-admin from ${name}`);

  await safeSend(() => client.emails.send({
    from: fromEmail,
    to: email,
    subject: "Thank you for contacting ThriveUp Academy",
    html: `
      <h2>Thank you, ${name}!</h2>
      <p>We received your ${inquiryType} inquiry and will respond within 24 hours.</p>
      <p>Best regards,<br/>Dr. Terry Flood, DHA<br/>ThriveUp Academy</p>
    `,
  }), `contact-inquiry-confirmation to ${email}`);
}

export async function sendPartnerNotification(
  partnerEmail: string,
  subject: string,
  content: string
): Promise<boolean> {
  const { client, fromEmail } = await getResendClient();
  return await safeSend(() => client.emails.send({
    from: fromEmail,
    to: partnerEmail,
    subject,
    html: content,
  }), `partner-notification to ${partnerEmail}`);
}

export async function sendGrantAlert(
  recipientEmail: string,
  grantDetails: { title: string; agency: string; deadline: string; matchScore: number }
) {
  const { client, fromEmail } = await getResendClient();
  await safeSend(() => client.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: `[ThriveUp] Grant Opportunity: ${grantDetails.title}`,
    html: `
      <h2>Grant Opportunity Match</h2>
      <p><strong>Title:</strong> ${grantDetails.title}</p>
      <p><strong>Agency:</strong> ${grantDetails.agency}</p>
      <p><strong>Deadline:</strong> ${grantDetails.deadline}</p>
      <p><strong>Match Score:</strong> ${grantDetails.matchScore}%</p>
      <hr/>
      <p>Log in to ThriveUp Academy to view full details and start your application.</p>
    `,
  }), `grant-alert to ${recipientEmail}`);
}

export async function sendEcosystemUpdate(subject: string, htmlContent: string) {
  const { client, fromEmail } = await getResendClient();
  return await safeSend(() => client.emails.send({
    from: fromEmail,
    to: ADMIN_EMAIL,
    subject: `[Ecosystem] ${subject}`,
    html: htmlContent,
  }), `ecosystem-update: ${subject}`);
}

export async function sendNeighborhoodReport(profile: any, recipientEmail: string) {
  const { client, fromEmail } = await getResendClient();
  const goingWellHtml = (profile.goingWell || []).map((i: any) => `<li style="color:#276749;margin-bottom:8px;"><strong>${i.label}:</strong> ${i.detail}</li>`).join("");
  const needsAttnHtml = (profile.needsAttention || []).map((i: any) => `<li style="margin-bottom:12px;"><strong style="color:#c53030;">${i.label}</strong> (${i.value}${typeof i.value === 'number' && i.value < 100 ? '%' : ''})<br/>${i.detail}<br/><em style="color:#1a365d;">Solution: ${i.solution}</em></li>`).join("");

  return await safeSend(() => client.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: `Neighborhood Intelligence Report: ${profile.neighborhoodName || profile.zipCode}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#1a365d;padding:20px;color:white;text-align:center;">
          <h1 style="margin:0;font-size:22px;">Neighborhood Intelligence Report</h1>
          <p style="margin:5px 0 0;font-size:14px;">${profile.neighborhoodName || ''} | ZIP ${profile.zipCode} | ${profile.countyName || ''}, ${profile.stateName || ''}</p>
        </div>
        <div style="padding:20px;background:#f7fafc;">
          <p style="color:#666;font-size:12px;font-style:italic;border-left:3px solid #d69e2e;padding-left:10px;">This report presents data — not judgment. These are known statistical characteristics of your geographic area. Every neighborhood has strengths and challenges.</p>
          <h2 style="color:#1a365d;">Community Snapshot</h2>
          <p><strong>Population:</strong> ${(profile.population || 0).toLocaleString()} | <strong>Median Income:</strong> $${(profile.medianIncome || 0).toLocaleString()} | <strong>SVI Score:</strong> ${profile.sviScore || 'N/A'}</p>
          ${goingWellHtml ? `<h2 style="color:#276749;">What's Going Well</h2><ul>${goingWellHtml}</ul>` : ''}
          ${needsAttnHtml ? `<h2 style="color:#c53030;">Areas That Need Attention</h2><ul style="list-style:none;padding-left:0;">${needsAttnHtml}</ul>` : ''}
          <hr style="border:1px solid #e2e8f0;"/>
          <p style="font-size:11px;color:#999;">Data: U.S. Census Bureau ACS 5-Year Estimates | Methodology: CDC/ATSDR SVI | Generated by ThriveUp Academy</p>
          <p style="font-size:11px;color:#999;">Visit <a href="https://www.thrivingcommunitiesforall.com">thrivingcommunitiesforall.com</a> to run more reports and download full presentations.</p>
        </div>
      </div>
    `,
  }), `neighborhood-report to ${recipientEmail}`);
}

export async function sendCoalitionOutreach(opts: {
  to: string; subject: string; html: string; replyTo?: string; cc?: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const result = await client.emails.send({
      from: fromEmail,
      to: opts.to,
      cc: opts.cc,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
    } as any);
    if (result?.error) {
      console.error("[Email] Outreach FAILED:", JSON.stringify(result.error));
      return { ok: false, error: result.error.message || JSON.stringify(result.error) };
    }
    console.log(`[Email] Outreach SENT to ${opts.to}: id=${result?.data?.id}`);
    return { ok: true, id: result?.data?.id };
  } catch (err: any) {
    console.error("[Email] Outreach ERROR:", err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
}

export async function sendCrisisEscalation(opts: {
  severity: "crisis_si" | "crisis_hi" | string;
  userId: string | null;
  surface: string;
  matchedPhrase: string;
  triggeringMessage: string;
  conversation: Array<{ role: string; content: string }>;
  escalationRecordId: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const severityLabel = opts.severity === "crisis_si"
      ? "SUICIDAL ENDORSEMENT (SI)"
      : opts.severity === "crisis_hi"
        ? "HOMICIDAL ENDORSEMENT (HI)"
        : `OTHER (${opts.severity})`;

    const conversationHtml = opts.conversation.map((m) => {
      const isUser = m.role === "user";
      const bg = isUser ? "#fff3cd" : "#e7f3ff";
      const border = isUser ? "#ffc107" : "#0d6efd";
      const label = isUser ? "USER" : "AI";
      const safe = (m.content || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
      return `<div style="margin:8px 0;padding:10px;background:${bg};border-left:3px solid ${border};border-radius:4px;"><strong style="font-size:11px;color:#666;">${label}</strong><div style="margin-top:4px;font-size:13px;">${safe}</div></div>`;
    }).join("");

    const triggeringSafe = opts.triggeringMessage.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const matchedSafe = (opts.matchedPhrase || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const result = await client.emails.send({
      from: fromEmail,
      to: ADMIN_EMAIL,
      subject: `[CRISIS ESCALATION — ${severityLabel}] User ${opts.userId || "anonymous"} on ${opts.surface}`,
      html: `
        <div style="max-width:720px;font-family:Arial,sans-serif;">
          <div style="background:#dc3545;color:white;padding:16px;border-radius:6px 6px 0 0;">
            <h1 style="margin:0;font-size:20px;">Crisis Escalation: ${severityLabel}</h1>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">A ThriveUp Academy AI conversation triggered the safety escalation rule. A human review is required.</p>
          </div>
          <div style="padding:16px;border:1px solid #ddd;border-top:none;border-radius:0 0 6px 6px;background:white;">
            <table style="width:100%;font-size:13px;margin-bottom:12px;">
              <tr><td style="padding:4px 8px;color:#666;">Triggered at:</td><td style="padding:4px 8px;"><strong>${new Date().toISOString()}</strong></td></tr>
              <tr><td style="padding:4px 8px;color:#666;">User ID:</td><td style="padding:4px 8px;"><code>${opts.userId || "anonymous"}</code></td></tr>
              <tr><td style="padding:4px 8px;color:#666;">Surface:</td><td style="padding:4px 8px;"><code>${opts.surface}</code></td></tr>
              <tr><td style="padding:4px 8px;color:#666;">Severity:</td><td style="padding:4px 8px;"><strong style="color:#dc3545;">${severityLabel}</strong></td></tr>
              <tr><td style="padding:4px 8px;color:#666;">Audit record:</td><td style="padding:4px 8px;"><code>${opts.escalationRecordId || "(db write failed)"}</code></td></tr>
            </table>

            <div style="background:#fff3cd;border-left:4px solid #dc3545;padding:12px;margin:12px 0;border-radius:4px;">
              <strong style="font-size:12px;color:#856404;">MATCHED PHRASE</strong>
              <div style="margin-top:6px;font-size:14px;font-family:monospace;">${matchedSafe || "(none captured)"}</div>
            </div>

            <div style="background:#f8d7da;border-left:4px solid #dc3545;padding:12px;margin:12px 0;border-radius:4px;">
              <strong style="font-size:12px;color:#721c24;">TRIGGERING MESSAGE (most recent user input)</strong>
              <div style="margin-top:6px;font-size:14px;white-space:pre-wrap;">${triggeringSafe}</div>
            </div>

            <h3 style="font-size:14px;margin:18px 0 8px;border-bottom:1px solid #ddd;padding-bottom:6px;">Full conversation captured (privacy-promise exception)</h3>
            ${conversationHtml}

            <div style="margin-top:18px;padding:12px;background:#e7f3ff;border-radius:4px;font-size:12px;color:#0d3a5c;">
              <strong>Recommended action:</strong> Reach out to the user (if identified) within 1 hour. The AI delivered a de-escalation response with 988 / 911 / Crisis Text Line. If user is identified by ID, look up contact via /case-manager. If anonymous, no direct contact possible — document for pattern review.
            </div>
          </div>
          <p style="font-size:11px;color:#999;margin-top:12px;text-align:center;">Generated automatically by ThriveUp Academy safety escalation system. This email is the ONE documented exception to AI conversation privacy.</p>
        </div>
      `,
    } as any);

    if (result?.error) {
      console.error("[Email] CRISIS ESCALATION FAILED:", JSON.stringify(result.error));
      return { ok: false, error: result.error.message || JSON.stringify(result.error) };
    }
    console.log(`[Email] CRISIS ESCALATION SENT: id=${result?.data?.id} severity=${opts.severity} surface=${opts.surface}`);
    return { ok: true, id: result?.data?.id };
  } catch (err: any) {
    console.error("[Email] CRISIS ESCALATION ERROR:", err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
}

/**
 * Daily digest of new Trade Sims signups. Sent to Dr. Flood's institutional
 * inbox. Caller passes the unsent rows; route flips notifiedInDigest=true
 * only after this returns true.
 */
export async function sendTradeSimsDigestEmail(rows: Array<{
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
  totalVisits: number;
  trialMsUsedBeforeLogin: number | null;
  lastPath: string | null;
}>): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    const to = "terryflood@thrivingcommunitiesforall.com";

    const fmtTrial = (ms: number | null) => {
      if (ms == null) return "—";
      const sec = Math.round(ms / 1000);
      return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    };
    const fmtDate = (d: Date | string) => {
      const dt = typeof d === "string" ? new Date(d) : d;
      return dt.toLocaleString("en-US", { timeZone: "America/Chicago" });
    };

    const tableRows = rows
      .map((r) => {
        const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email || r.userId;
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${name}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.email ?? "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${fmtDate(r.firstSeenAt)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.totalVisits}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${fmtTrial(r.trialMsUsedBeforeLogin)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.lastPath ?? "—"}</td>
        </tr>`;
      })
      .join("");

    const subject =
      rows.length === 0
        ? `[ThriveUp] Trade Sims daily digest — no new signups`
        : `[ThriveUp] Trade Sims daily digest — ${rows.length} new signup${rows.length === 1 ? "" : "s"}`;

    const body =
      rows.length === 0
        ? `<p>No new Trade Sims signups in the last 24 hours.</p>`
        : `<p>${rows.length} new Trade Sims signup${rows.length === 1 ? "" : "s"} since the last digest:</p>
           <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">
             <thead>
               <tr style="text-align:left;background:#f5f5f5">
                 <th style="padding:6px 10px">Name</th>
                 <th style="padding:6px 10px">Email</th>
                 <th style="padding:6px 10px">First seen (CT)</th>
                 <th style="padding:6px 10px">Visits</th>
                 <th style="padding:6px 10px">Trial used</th>
                 <th style="padding:6px 10px">Last path</th>
               </tr>
             </thead>
             <tbody>${tableRows}</tbody>
           </table>`;

    return await safeSend(
      () =>
        client.emails.send({
          from: fromEmail,
          to,
          subject,
          html: `<div style="font-family:system-ui,sans-serif">
            <h2>Trade Sims daily digest</h2>
            ${body}
            <p style="font-size:12px;color:#888;margin-top:24px">
              Full list at <a href="https://thrivingcommunitiesforall.com/admin/trade-sims-signups">/admin/trade-sims-signups</a>.
              Sent automatically every 24 hours.
            </p>
          </div>`,
        }),
      `trade-sims-digest:${rows.length}`,
    );
  } catch (err: any) {
    console.error("[Email] sendTradeSimsDigestEmail failed:", err?.message || err);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const { client, fromEmail } = await getResendClient();
  await safeSend(() => client.emails.send({
    from: fromEmail,
    to: email,
    subject: "Welcome to ThriveUp Academy!",
    html: `
      <h2>Welcome to ThriveUp Academy, ${name}!</h2>
      <p>We're excited to have you join our community.</p>
      <p>ThriveUp Academy is a comprehensive workforce development and community enablement platform designed to help youth, families, and communities thrive.</p>
      <p>Get started by exploring your dashboard and setting up your profile.</p>
      <p>Best regards,<br/>The ThriveUp Academy Team</p>
    `,
  }), `welcome-email to ${email}`);
}
