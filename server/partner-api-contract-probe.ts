/**
 * Partner API contract probe — runs once on production startup.
 *
 * After the server binds to its port (with a short settle delay), this module
 * discovers the production URL from REPLIT_DOMAINS and probes the Partner API
 * surface credential-free:
 *
 *   • GET /api/partner/v1/docs must return 200 with chainweb:read + yhsi:read
 *     scopes advertised and all expected routes listed with correct scope labels.
 *   • Every protected partner route must return 401 or 403, not a stale 404.
 *   • The heartbeat probe (bodyless POST) must reach its auth guard.
 *
 * Results are logged prominently to stdout so operators can see them in the
 * Replit Deployments panel (Publishing → Logs).  The server continues serving
 * regardless of outcome — this probe never crashes the process.
 *
 * URL discovery (production containers only):
 *   1. PARTNER_API_CONTRACT_TARGET env var (explicit override)
 *   2. First non-.replit.dev hostname in REPLIT_DOMAINS (production sets this
 *      to the .replit.app or custom-domain hostname, not the dev hostname)
 *
 * No partner credentials or payloads are sent.
 */

const SETTLE_DELAY_MS = 90_000;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES = 512_000;

// Whitespace-tolerant regex — matches "GET  /path" (two spaces) and "GET /path" (one space).
// Mirrors the regex used in scripts/verify-published-partner-api-contract.ts.
const ROUTE_RE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/;

export const EXPECTED_ENDPOINTS = [
  { method: "GET" as const, path: "/api/partner/v1/chainweb/coefficients", scope: "chainweb:read" },
  { method: "GET" as const, path: "/api/partner/v1/community/brief", scope: "community:read" },
  { method: "GET" as const, path: "/api/partner/v1/chainweb/templates", scope: "chainweb:read" },
  { method: "POST" as const, path: "/api/partner/v1/chainweb/scenarios", scope: "chainweb:read" },
  { method: "GET" as const, path: "/api/partner/v1/chainweb/scenarios/:id", scope: "chainweb:read" },
  { method: "POST" as const, path: "/api/partner/v1/chainweb/scenarios/:id/calculate", scope: "chainweb:read" },
  { method: "POST" as const, path: "/api/partner/v1/chainweb/calculations/:id/narratives", scope: "chainweb:read" },
  { method: "GET" as const, path: "/api/partner/v1/yhsi/metrics", scope: "yhsi:read" },
  { method: "GET" as const, path: "/api/partner/v1/yhsi/outcomes-summary", scope: "yhsi:read" },
  { method: "GET" as const, path: "/api/partner/v1/students/overview", scope: "student:read" },
  { method: "GET" as const, path: "/api/partner/v1/attendance/summary", scope: "student:read" },
  { method: "GET" as const, path: "/api/partner/v1/early-warnings", scope: "student:read" },
  { method: "GET" as const, path: "/api/partner/v1/pathways/overview", scope: "student:read" },
  { method: "POST" as const, path: "/api/partner/v1/heartbeat", scope: null },
] as const;

// ── Docs parsing (exported for tests) ────────────────────────────────────────

/**
 * Parse a docs `endpoints` array into a map of normalized route keys
 * (`"METHOD /path"`, single space) → raw description strings.
 *
 * The live docs format uses two spaces (`GET  /path`).  The ROUTE_RE regex
 * captures method + first non-whitespace token regardless of spacing, then we
 * reconstruct the key with exactly one space.  This matches the approach in
 * scripts/verify-published-partner-api-contract.ts.
 */
export function buildDocMap(endpoints: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const entry of endpoints) {
    const match = ROUTE_RE.exec(entry.trim());
    if (!match) continue;
    const key = `${match[1]} ${match[2]}`; // normalized single-space
    map.set(key, [...(map.get(key) ?? []), entry]);
  }
  return map;
}

/**
 * Extract scope labels from a docs description string.
 * Scope labels appear in parentheses: `(chainweb:read)`.
 */
export function extractScopeLabels(description: string): string[] {
  return [...description.matchAll(/\(([^()]+)\)/g)].map((m) => m[1]);
}

// ── URL discovery ─────────────────────────────────────────────────────────────

function resolveProductionOrigin(): string | null {
  const override = (process.env.PARTNER_API_CONTRACT_TARGET ?? "").trim();
  if (override) {
    try {
      const parsed = new URL(override);
      if (parsed.protocol === "https:" && !parsed.hostname.endsWith(".replit.dev")) {
        return parsed.origin;
      }
    } catch {
      // fall through
    }
  }

  const domainsRaw = (process.env.REPLIT_DOMAINS ?? "").trim();
  for (const domain of domainsRaw.split(",").map((d) => d.trim()).filter(Boolean)) {
    if (!domain.endsWith(".replit.dev")) {
      return `https://${domain}`;
    }
  }
  return null;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function safeFetch(
  url: string,
  init: RequestInit = {},
): Promise<{ status: number; body: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        ...((init.headers as Record<string, string>) ?? {}),
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
    });
    const reader = response.body?.getReader();
    let bodyText = "";
    if (reader) {
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_BODY_BYTES) { await reader.cancel(); break; }
        chunks.push(value);
      }
      reader.releaseLock();
      const all = new Uint8Array(chunks.reduce((a, c) => a + c.byteLength, 0));
      let offset = 0;
      for (const c of chunks) { all.set(c, offset); offset += c.byteLength; }
      bodyText = new TextDecoder().decode(all);
    }
    return { status: response.status, body: bodyText };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Core contract check (exported for tests) ──────────────────────────────────

export async function runContractCheck(
  origin: string,
): Promise<{ passes: number; failures: string[] }> {
  let passes = 0;
  const failures: string[] = [];

  const pass = (label: string) => { passes++; console.log(`  ✓ ${label}`); };
  const fail = (label: string, detail?: string) => {
    failures.push(label);
    console.error(`  ✗ DEPLOYMENT DRIFT: ${label}${detail ? ` — ${detail}` : ""}`);
  };

  // 1. Public docs check
  const docsUrl = `${origin}/api/partner/v1/docs?contract_probe=${Date.now()}`;
  const docs = await safeFetch(docsUrl);
  if (!docs || docs.status !== 200) {
    fail("GET /api/partner/v1/docs must return 200", docs ? `got ${docs.status}` : "unreachable");
  } else {
    pass("GET /api/partner/v1/docs returned 200");

    let parsed: Record<string, unknown> | null = null;
    try { parsed = JSON.parse(docs.body) as Record<string, unknown>; } catch { /* */ }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      fail("docs response must be a JSON object");
    } else {
      pass("docs response is a JSON object");

      // Scopes
      const scopes = new Set(
        (Array.isArray(parsed.scopes) ? parsed.scopes as unknown[] : [])
          .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object")
          .map((s) => String(s.scope))
          .filter(Boolean),
      );
      for (const scope of ["chainweb:read", "yhsi:read"]) {
        if (scopes.has(scope)) pass(`docs advertise ${scope}`);
        else fail(`docs must advertise ${scope}`);
      }

      // Endpoint descriptions — parse with whitespace-tolerant regex
      const rawEndpoints = (Array.isArray(parsed.endpoints) ? parsed.endpoints as unknown[] : [])
        .filter((e): e is string => typeof e === "string");
      const docMap = buildDocMap(rawEndpoints);

      for (const ep of EXPECTED_ENDPOINTS) {
        const key = `${ep.method} ${ep.path}`;
        const matching = docMap.get(key) ?? [];
        if (matching.length > 0) {
          pass(`docs list ${key}`);
          if (ep.scope) {
            const hasScope = matching.some((e) => extractScopeLabels(e).includes(ep.scope as string));
            if (hasScope) pass(`docs map ${key} to ${ep.scope}`);
            else fail(`docs must map ${key} to ${ep.scope}`, "scope label missing");
          }
        } else {
          fail(`docs must list ${key}`);
          if (ep.scope) fail(`docs must map ${key} to ${ep.scope}`, "route not found");
        }
      }
    }
  }

  // 2. Protected route probes (credential-free)
  for (const ep of EXPECTED_ENDPOINTS) {
    const resp = await safeFetch(`${origin}${ep.path}`, { method: ep.method });
    if (!resp) {
      fail(`${ep.method} ${ep.path} unreachable`);
    } else if (resp.status === 401 || resp.status === 403) {
      pass(`${ep.method} ${ep.path} reaches auth guard (${resp.status})`);
    } else {
      fail(`${ep.method} ${ep.path} must return 401/403`, `got ${resp.status}`);
    }
  }

  return { passes, failures };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register the Partner API contract startup probe.  Call once from the server
 * entry point in a `NODE_ENV === "production"` block.  The check runs after a
 * SETTLE_DELAY_MS settle window and is completely non-blocking.
 */
export function startPartnerApiContractProbe(): void {
  setTimeout(async () => {
    const origin = resolveProductionOrigin();
    if (!origin) return; // dev container or no production URL — skip silently

    console.log(`\n[partner-api-contract] Post-publish contract probe (target: ${origin})\n`);

    try {
      const { passes, failures } = await runContractCheck(origin);
      if (failures.length === 0) {
        console.log(
          `\n[partner-api-contract] ✅ PASSED (${passes} checks)`
          + " — Partner API surface matches the expected contract."
          + " Integration-live confirmation is cleared for this deployment.\n",
        );
      } else {
        console.error(
          `\n[partner-api-contract] ❌ FAILED (${failures.length} drift(s) detected)`
          + "\n  Do NOT send a ChildCORE or partner integration-live message."
          + "\n  Fix the reported drift, redeploy, and confirm ✅ in the next startup log.\n",
        );
      }
    } catch (err) {
      console.error(
        `[partner-api-contract] probe crashed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, SETTLE_DELAY_MS);
}
