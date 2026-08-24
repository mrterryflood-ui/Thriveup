/**
 * Canonical outbound GrantPathPro configuration.
 *
 * Partner credentials are server-only and are never serialized into a
 * client-facing payload.
 */
export function getGrantPathProOutboundConfig(): {
  url: string | null;
  apiKey: string | null;
  configured: boolean;
} {
  const configuredUrl = process.env.GPP_API_URL?.trim() || null;
  const url = configuredUrl && isSafePartnerUrl(configuredUrl) ? configuredUrl : null;
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
  const candidateUrl = explicitUrl || (outbound.url ? `${new URL(outbound.url).origin}/thriveup/embed` : null);
  const url = candidateUrl && isSafePartnerUrl(candidateUrl) ? candidateUrl : null;
  const partnerKey = process.env.THRIVEUP_PARTNER_KEY?.trim() || outbound.apiKey;
  return { url, partnerKey, configured: Boolean(url && partnerKey) };
}

export function getGrantPathProMirrorConfig(): {
  url: string | null;
  outboundKey: string | null;
  configured: boolean;
} {
  const candidateUrl = process.env.GPP_MIRROR_URL?.trim() || null;
  const url = candidateUrl && isSafePartnerUrl(candidateUrl) ? candidateUrl : null;
  // Never send THRIVEUP_INGEST_KEY to a partner: it authenticates writes into
  // ThriveUp. The receiver needs a distinct GPP-issued outbound credential.
  const outbound = getGrantPathProOutboundConfig();
  const outboundKey = process.env.GPP_MIRROR_OUTBOUND_KEY?.trim() || outbound.apiKey;
  return { url, outboundKey, configured: Boolean(url && outboundKey) };
}

/**
 * A v1 opportunity handoff requires its own explicit receiver. We do not
 * derive a destination from GPP_API_URL: that URL's existing endpoints have
 * different contracts, and guessing would turn a consequential handoff into
 * an untraceable export.
 */
export function getGrantPathProOpportunityHandoffConfig(): {
  url: string | null;
  apiKey: string | null;
  configured: boolean;
} {
  const candidateUrl = process.env.GPP_OPPORTUNITY_HANDOFF_URL?.trim() || null;
  const url = candidateUrl && isSafePartnerUrl(candidateUrl) ? candidateUrl : null;
  // GrantPath Pro's supplied v1 receiver authenticates ThriveUp with the
  // existing THRIVEUP_INGEST_KEY as a Bearer credential. An explicitly
  // provisioned handoff key takes precedence when available.
  const apiKey = process.env.GPP_OPPORTUNITY_HANDOFF_API_KEY?.trim()
    || process.env.THRIVEUP_INGEST_KEY?.trim()
    || null;
  return { url, apiKey, configured: Boolean(url && apiKey) };
}

function isSafePartnerUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
    const configuredHosts = (process.env.GPP_ALLOWED_HOSTS || "trustworthy-sheep-515.convex.site")
      .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
    return configuredHosts.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}