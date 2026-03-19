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

  return {
    client: new Resend(connectionSettings.settings.api_key),
    fromEmail: connectionSettings.settings.from_email || "onboarding@resend.dev",
  };
}

const ADMIN_EMAIL = "mr.terryflood@gmail.com";

export async function sendContactInquiry(
  name: string,
  email: string,
  message: string,
  inquiryType: string
) {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
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
  });

  await client.emails.send({
    from: fromEmail,
    to: email,
    subject: "Thank you for contacting ThriveUp Academy",
    html: `
      <h2>Thank you, ${name}!</h2>
      <p>We received your ${inquiryType} inquiry and will respond within 24 hours.</p>
      <p>Best regards,<br/>Dr. Terry Flood, DHA<br/>ThriveUp Academy</p>
    `,
  });
}

export async function sendPartnerNotification(
  partnerEmail: string,
  subject: string,
  content: string
) {
  const { client, fromEmail } = await getResendClient();
  await client.emails.send({
    from: fromEmail,
    to: partnerEmail,
    subject,
    html: content,
  });
}

export async function sendGrantAlert(
  recipientEmail: string,
  grantDetails: { title: string; agency: string; deadline: string; matchScore: number }
) {
  const { client, fromEmail } = await getResendClient();
  await client.emails.send({
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
  });
}

export async function sendEcosystemUpdate(subject: string, htmlContent: string) {
  const { client, fromEmail } = await getResendClient();
  await client.emails.send({
    from: fromEmail,
    to: ADMIN_EMAIL,
    subject: `[Ecosystem] ${subject}`,
    html: htmlContent,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const { client, fromEmail } = await getResendClient();
  await client.emails.send({
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
  });
}
