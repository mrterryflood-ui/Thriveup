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

/**
 * The embed endpoint is a distinct GPP capability from grant event delivery.
 * Prefer an explicit URL when the partner supplies one; otherwise derive it
 * from the configured GPP origin without hardcoding a partner domain.
 */
export function getGrantPathProEmbedConfig(): {
  url: string | null;
  partnerKey: string | null;
  configured: boolean;
} {
  const outbound = getGrantPathProOutboundConfig();
  const explicitUrl = process.env.GPP_EMBED_URL?.trim();
  const url = explicitUrl || (outbound.url ? `${new URL(outbound.url).origin}/thriveup/embed` : null);
  const partnerKey = process.env.THRIVEUP_PARTNER_KEY?.trim() || outbound.apiKey;
  return { url, partnerKey, configured: Boolean(url && partnerKey) };
}

export function getGrantPathProMirrorConfig(): {
  url: string | null;
  ingestKey: string | null;
  configured: boolean;
} {
  const url = process.env.GPP_MIRROR_URL?.trim() || null;
  const ingestKey = process.env.THRIVEUP_INGEST_KEY?.trim() || null;
  return { url, ingestKey, configured: Boolean(url && ingestKey) };
}