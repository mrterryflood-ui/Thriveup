/**
 * Canonical outbound GrantPathPro configuration.
 *
 * The inbound ThriveUp key is deliberately separate and must never be reused
 * for outbound delivery or serialized into a client-facing payload.
 */
export function getGrantPathProOutboundConfig(): {
  url: string | null;
  apiKey: string | null;
  configured: boolean;
} {
  const url = process.env.GPP_API_URL?.trim() || null;
  // THRIVE_GPP_API_KEY is the canonical name. The two legacy names remain
  // accepted so existing deployments fail explicitly only when no usable
  // credential exists, rather than silently falling into preview mode.
  const apiKey = process.env.THRIVE_GPP_API_KEY?.trim()
    || process.env.GPP_API_KEY?.trim()
    || process.env.GRANTPATHPRO_WEBHOOK_API_KEY?.trim()
    || null;

  return { url, apiKey, configured: Boolean(url && apiKey) };
}

export function getGrantPathProDisplayOrigin(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}