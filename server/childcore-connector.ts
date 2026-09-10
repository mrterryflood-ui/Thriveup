/**
 * ChildCORE Partner API Connector
 *
 * Live API:  https://useful-viper-536.convex.site/api/v1/
 * Docs:      https://childcore.app/docs/partner-api
 * Service:   ChildCORE Partner API v1.0.0
 *
 * Authentication: Authorization: Bearer <CHILDCORE_API_KEY>
 * CHILDCORE_API_KEY is the credential ChildCORE issued to ThriveUp.
 * /ping is the only unauthenticated endpoint.
 *
 * Data flows:
 *   PULL (ThriveUp ← ChildCORE):
 *     GET /api/v1/community/{zip}/providers — community providers for a ZIP
 *     GET /api/v1/community/{zip}/schools   — school intelligence for a ZIP
 *     GET /api/v1/community/{geo}/sdoh      — social determinants data
 *     GET /api/v1/community/{geo}/impact    — aggregate community impact data
 *     GET /api/v1/ping                       — health check (no auth)
 *
 *   PUSH (ThriveUp → ChildCORE):
 *     POST /api/v1/push — ThriveUp sends community activity/outcome events
 *
 * Failure policy: every function returns null on error, never throws.
 * A ChildCORE outage degrades community context; it never crashes a route.
 */

const CHILDCORE_BASE = "https://useful-viper-536.convex.site/api/v1";
const TIMEOUT_MS = 8000;

function getApiKey(): string {
  return (process.env.CHILDCORE_API_KEY || "").trim();
}

export function isChildCOREConfigured(): boolean {
  return Boolean(getApiKey());
}

// ─── Transport helpers ────────────────────────────────────────────────────────

async function coreGet(path: string, requireAuth = true): Promise<any> {
  if (requireAuth && !isChildCOREConfigured()) return null;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (requireAuth) {
      headers["Authorization"] = `Bearer ${getApiKey()}`;
      headers["X-ChildCORE-Key"] = getApiKey();
    }
    const resp = await fetch(`${CHILDCORE_BASE}${path}`, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!resp.ok) {
      console.warn(`[ChildCORE] GET ${path} → ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (err) {
    console.warn("[ChildCORE] GET error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function corePost(path: string, body: Record<string, unknown>): Promise<any> {
  if (!isChildCOREConfigured()) return null;
  try {
    const resp = await fetch(`${CHILDCORE_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getApiKey()}`,
        "X-ChildCORE-Key": getApiKey(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!resp.ok) {
      console.warn(`[ChildCORE] POST ${path} → ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (err) {
    console.warn("[ChildCORE] POST error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ─── Health probe ─────────────────────────────────────────────────────────────

export async function probeChildCORE(): Promise<{
  ok: boolean;
  reachable: boolean;
  authenticated: boolean;
  latencyMs: number;
  service?: string;
  version?: string;
  configured: boolean;
}> {
  const configured = isChildCOREConfigured();
  const t0 = Date.now();
  const [data, authenticatedProbe] = await Promise.all([
    coreGet("/ping", false),
    configured ? coreGet("/community/78701/providers") : Promise.resolve(null),
  ]);
  const reachable = data?.status === "ok";
  const authenticated = authenticatedProbe !== null;
  return {
    ok: reachable && authenticated,
    reachable,
    authenticated,
    latencyMs: Date.now() - t0,
    service: data?.service,
    version: data?.version,
    configured,
  };
}

// ─── Community intelligence pull ─────────────────────────────────────────────

export async function getChildCOREProviders(zip: string): Promise<any> {
  if (!zip) return null;
  return coreGet(`/community/${encodeURIComponent(zip)}/providers`);
}

export async function getChildCORESchools(zip: string): Promise<any> {
  if (!zip) return null;
  return coreGet(`/community/${encodeURIComponent(zip)}/schools`);
}

export async function getChildCORESDOH(geo: string): Promise<any> {
  if (!geo) return null;
  return coreGet(`/community/${encodeURIComponent(geo)}/sdoh`);
}

export async function getChildCOREImpact(geo: string): Promise<any> {
  if (!geo) return null;
  return coreGet(`/community/${encodeURIComponent(geo)}/impact`);
}

// ─── Combined community fetch for a ZIP ──────────────────────────────────────

export interface ChildCORECommunityData {
  zip: string;
  providers: any;
  schools: any;
  sdoh: any;
  impact: any;
}

export async function getChildCORECommunityData(zip: string): Promise<ChildCORECommunityData | null> {
  if (!zip || !isChildCOREConfigured()) return null;

  const [providers, schools, sdoh, impact] = await Promise.all([
    getChildCOREProviders(zip).catch(() => null),
    getChildCORESchools(zip).catch(() => null),
    getChildCORESDOH(zip).catch(() => null),
    getChildCOREImpact(zip).catch(() => null),
  ]);

  // Return null if every call failed — keeps AI context clean
  if (!providers && !schools && !sdoh && !impact) return null;

  return { zip, providers, schools, sdoh, impact };
}

// ─── AI context block builder ─────────────────────────────────────────────────
// Converts raw ChildCORE API payloads into the same line-based evidence format
// used by Census and RPLICE blocks, so the AI sees one coherent community picture.

export function buildChildCOREContextBlock(data: ChildCORECommunityData): string {
  const lines: string[] = [];
  lines.push(`[CHILDCORE PARTNER DATA — ZIP ${data.zip}]`);

  if (data.providers) {
    const list: any[] = Array.isArray(data.providers)
      ? data.providers
      : (data.providers?.providers ?? data.providers?.items ?? []);
    if (list.length > 0) {
      const names = list.slice(0, 5).map((p: any) =>
        p.name || p.organizationName || p.providerName || "Provider"
      );
      lines.push(
        `• Community providers: ${names.join(" · ")}` +
        (list.length > 5 ? ` and ${list.length - 5} more` : "")
      );
    }
  }

  if (data.schools) {
    const list: any[] = Array.isArray(data.schools)
      ? data.schools
      : (data.schools?.schools ?? data.schools?.items ?? []);
    if (list.length > 0) {
      const names = list.slice(0, 4).map((s: any) =>
        s.name || s.schoolName || "School"
      );
      lines.push(
        `• Schools serving this ZIP: ${names.join(" · ")}` +
        (list.length > 4 ? ` and ${list.length - 4} more` : "")
      );
    }
  }

  if (data.sdoh) {
    const sdoh = data.sdoh;
    const summary = sdoh.summary || sdoh.description || sdoh.narrative;
    if (summary) lines.push(`• SDOH summary: ${summary}`);
    const factors: any[] = Array.isArray(sdoh.factors)
      ? sdoh.factors
      : (Array.isArray(sdoh.domains) ? sdoh.domains : []);
    if (factors.length > 0) {
      const top = factors.slice(0, 4)
        .map((f: any) => {
          const label = f.domain || f.name || f.factor || "Factor";
          const val = f.value ?? f.score ?? f.level ?? "present";
          return `${label}: ${val}`;
        })
        .join(" · ");
      if (top) lines.push(`• Social determinants: ${top}`);
    }
  }

  if (data.impact) {
    const imp = data.impact;
    if (imp.totalServed != null) lines.push(`• Individuals served (ChildCORE-tracked): ${Number(imp.totalServed).toLocaleString()}`);
    if (imp.programCount != null) lines.push(`• Active programs in registry: ${imp.programCount}`);
    const summary = imp.summary || imp.highlights || imp.description;
    if (summary) lines.push(`• Impact summary: ${summary}`);
  }

  lines.push(
    "Source: ChildCORE Partner API (live, partner-reported).",
    "Evidence class: Partner (report what ChildCORE records; do not represent as independently verified)."
  );

  return lines.join("\n");
}

// ─── Outbound push: ThriveUp → ChildCORE ─────────────────────────────────────

export interface ChildCOREPushPayload {
  event: string;
  zip?: string;
  data: Record<string, unknown>;
}

export async function pushToChildCORE(
  payload: ChildCOREPushPayload
): Promise<{ ok: boolean; response?: any; error?: string }> {
  if (!isChildCOREConfigured()) {
    return { ok: false, error: "CHILDCORE_API_KEY not configured" };
  }
  const fullPayload = {
    source: "thriveup",
    timestamp: new Date().toISOString(),
    ...payload,
  };
  const result = await corePost("/push", fullPayload as unknown as Record<string, unknown>);
  return result
    ? { ok: true, response: result }
    : { ok: false, error: "ChildCORE push returned no response" };
}

// ─── Typed YHSI event push ────────────────────────────────────────────────────

/**
 * Push a typed YHSI lifecycle event to ChildCORE.
 * ChildCORE uses this to match younger siblings (McKinney-Vento family linkage).
 *
 * Privacy boundary — only the following fields are sent; NO name, DOB, SSN,
 * phone, or address ever crosses the wire:
 *   participantRef  — ThriveUp's opaque UUID (not a name or SSN)
 *   ageRange        — bucketed age band (12-14 / 15-17 / 18-21 / 22-26)
 *   schoolDistrict  — e.g. "USD 259" (no individual identifier)
 *   mcKinneyVentoStatus — "identified" | "suspected" | "not_identified" | null
 *   stateCode       — 2-letter state
 *
 * Failure is logged but never rethrows — a ChildCORE outage must not block enrollment.
 */
export async function pushYHSIEventToChildCORE(
  eventType: "yhsi_enrollment" | "thrive_score_update" | "early_warning_trigger",
  participant: {
    id: string;
    ageAtContact?: number | null;
    stateCode?: string | null;
    schoolDistrict?: string | null;
    mckinneyVentoStatus?: string | null;
  },
): Promise<void> {
  const age = participant.ageAtContact ?? null;
  const ageRange = age == null ? null
    : age <= 14 ? "12-14"
    : age <= 17 ? "15-17"
    : age <= 21 ? "18-21"
    : "22-26";

  const result = await pushToChildCORE({
    event: eventType,
    data: {
      participantRef: participant.id,   // opaque UUID
      ageRange,
      schoolDistrict: participant.schoolDistrict ?? null,
      mcKinneyVentoStatus: participant.mckinneyVentoStatus ?? null,
      stateCode: participant.stateCode ?? null,
    },
  });

  if (!result.ok) {
    console.warn(`[ChildCORE] ${eventType} push failed:`, result.error);
  } else {
    console.info(`[ChildCORE] ${eventType} pushed — ref: ${participant.id.slice(0, 8)}...`);
  }
}

// ─── Connection status summary ────────────────────────────────────────────────

export async function getChildCOREConnectionStatus(): Promise<{
  configured: boolean;
  pingOk: boolean;
  reachable: boolean;
  authenticated: boolean;
  latencyMs: number;
  service?: string;
  version?: string;
  baseUrl: string;
  docsUrl: string;
}> {
  const probe = await probeChildCORE();
  return {
    configured: probe.configured,
    pingOk: probe.ok,
    reachable: probe.reachable,
    authenticated: probe.authenticated,
    latencyMs: probe.latencyMs,
    service: probe.service,
    version: probe.version,
    baseUrl: CHILDCORE_BASE,
    docsUrl: "https://childcore.app/docs/partner-api",
  };
}
