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

const ADMIN_EMAIL = "mr.terryflood@gmail.com";

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
) {
  const { client, fromEmail } = await getResendClient();
  await safeSend(() => client.emails.send({
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
