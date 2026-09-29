/**
 * Partner API Contract Registry
 *
 * Single source of truth for every route in the ThriveUp Partner API.
 * This file is intentionally free of DB / Express / server imports so it can
 * be consumed by both the server (to generate /docs and perform route-coverage
 * checks) and by standalone scripts (to drive the post-publish verifier) with
 * a plain `npx tsx` invocation.
 *
 * Design rules:
 *  - One entry per logical route (aliases listed separately).
 *  - `auth.kind === "public"` → no middleware at all.
 *  - `auth.kind === "partner"` with `scope: null` → requirePartnerAuth, any scope.
 *  - `auth.kind === "partner"` with `scope: string` → requirePartnerAuth + requireScope(scope).
 *  - `probe: true` → the post-publish verifier will probe this route without
 *    credentials and require a 401/403 response (i.e., the route exists and is
 *    auth-gated). Do NOT set this for public routes.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type PartnerRouteAuth =
  | { readonly kind: "public" }
  | { readonly kind: "partner"; readonly scope: string | null };

export type PartnerRouteEntry = {
  readonly method: HttpMethod;
  /** Express-style path, e.g. "/api/partner/v1/chainweb/scenarios/:id" */
  readonly path: string;
  readonly auth: PartnerRouteAuth;
  /** Human-readable summary used in the /docs endpoint string list */
  readonly description: string;
  /**
   * When true, the post-publish verifier probes this route without credentials
   * and expects 401 or 403. Must be false/absent for public routes.
   */
  readonly probe?: boolean;
};

export const PARTNER_API_SCOPES = [
  { scope: "content:read", description: "Ecosystem platform list and content export" },
  { scope: "platforms:read", description: "Live platform health status and metadata" },
  { scope: "health:read", description: "MS provider intelligence, public health-platform URLs, and RPLICE MS evidence links" },
  { scope: "community:read", description: "Community impact metrics, service-platform summary, and community brief generation" },
  { scope: "benefits:read", description: "Public benefits program catalog" },
  { scope: "impact:read", description: "Community intervention impact scores and outcome data" },
  { scope: "student:read", description: "AGGREGATE, suppression-floored youth metrics only — no per-student PII. See students/* endpoints." },
  { scope: "chainweb:read", description: "Chainweb ROI coefficients, templates, scenarios, calculations, and narratives" },
  { scope: "yhsi:read", description: "AGGREGATE, floor-5-suppressed YHSI metrics and outcome summaries" },
  { scope: "inbound:write", description: "POST governed aggregate/event data into ThriveUp; person-level referral writes are closed" },
  { scope: "outcomes:read", description: "Read aggregated outcome data — trade sim completion counts, employer-ready metrics (no PII, aggregate only)" },
  { scope: "certs:read", description: "Verify and read certificate records — check whether a cert ID is valid and retrieve holder/trade/issued info" },
  { scope: "capacity:read", description: "Read this partner's own capacity entries" },
  { scope: "capacity:write", description: "Create or update this partner's capacity entries" },
] as const;

// These routes intentionally remain registered to return 410 Gone with a
// privacy-preserving migration message. They are not part of the live public
// contract and should not be reported as unexpected registration drift.
const DEPRECATED_PARTNER_API_PATHS = new Set([
  "/api/partner/v1/students/:userId/thrive",
  "/api/partner/v1/students/:userId/assessments",
  "/api/partner/v1/students/:userId/pathway",
  "/api/partner/v1/students/reflections",
  "/api/partner/v1/foster-youth/refer",
]);

export const PARTNER_API_CONTRACT: readonly PartnerRouteEntry[] = [
  // ── Public ────────────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/docs",
    auth: { kind: "public" },
    description: "this schema (public)",
  },

  // ── Any partner scope ──────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/health",
    auth: { kind: "partner", scope: null },
    description: "auth check + key info (any scope)",
  },
  {
    method: "POST",
    path: "/api/partner/v1/heartbeat",
    auth: { kind: "partner", scope: null },
    description: "platform keepalive (any scope)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/webhooks",
    auth: { kind: "partner", scope: null },
    description: "list your registered webhooks (any scope)",
  },
  {
    method: "POST",
    path: "/api/partner/v1/webhooks",
    auth: { kind: "partner", scope: null },
    description: "register a webhook; secret shown ONCE (any scope)",
  },
  {
    method: "DELETE",
    path: "/api/partner/v1/webhooks/:id",
    auth: { kind: "partner", scope: null },
    description: "deactivate a webhook (any scope)",
  },

  // ── content:read ───────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/export",
    auth: { kind: "partner", scope: "content:read" },
    description: "content export (content:read)",
  },

  // ── platforms:read ─────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/platforms",
    auth: { kind: "partner", scope: "platforms:read" },
    description: "live platform list (platforms:read)",
  },
  {
    method: "GET",
    path: "/api/partner/v1/ms/intelligence",
    auth: { kind: "partner", scope: "health:read" },
    description: "MS provider leads, public health-platform URLs, national sources, and RPLICE MS links (health:read); query: location?, focus?",
    probe: true,
  },

  // ── community:read ─────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/community",
    auth: { kind: "partner", scope: "community:read" },
    description: "community service summary (community:read)",
  },
  {
    method: "GET",
    path: "/api/partner/v1/community-opportunities",
    auth: { kind: "partner", scope: "community:read" },
    description: "state and county grant opportunities (community:read); query: state (required), county?",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/community-brief",
    auth: { kind: "partner", scope: "community:read" },
    description:
      "on-demand community brief for any geography (community:read); query: location (required), populationSize?, timeHorizon?",
  },
  {
    method: "GET",
    path: "/api/partner/v1/community/brief",
    auth: { kind: "partner", scope: "community:read" },
    description:
      "compatibility alias for community-brief (community:read); query: location (required), populationSize?, timeHorizon?",
    // Probed because it is the ChildCORE-contract path that must stay live
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/community-story",
    auth: { kind: "partner", scope: "community:read" },
    description: "aggregate community story pack for a geography (community:read)",
  },
  {
    method: "POST",
    path: "/api/partner/v1/community-brief/subscribe",
    auth: { kind: "partner", scope: "community:read" },
    description:
      "subscribe to scheduled community briefs (community:read); body: {location, webhookUrl, frequency: 'daily'|'weekly'|'on-change'}",
  },
  {
    method: "GET",
    path: "/api/partner/v1/subscriptions",
    auth: { kind: "partner", scope: "community:read" },
    description: "list brief subscriptions for your key (community:read)",
  },
  {
    method: "DELETE",
    path: "/api/partner/v1/subscriptions/:id",
    auth: { kind: "partner", scope: "community:read" },
    description: "deactivate a brief subscription (community:read)",
  },

  // ── benefits:read ──────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/benefits",
    auth: { kind: "partner", scope: "benefits:read" },
    description: "benefits program catalog (benefits:read)",
  },

  // ── impact:read ────────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/impact",
    auth: { kind: "partner", scope: "impact:read" },
    description: "community impact metrics (impact:read)",
  },

  // ── student:read ───────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/students/overview",
    auth: { kind: "partner", scope: "student:read" },
    description: "AGGREGATE cohort metrics, suppression-floored (student:read)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/attendance/summary",
    auth: { kind: "partner", scope: "student:read" },
    description: "AGGREGATE attendance metrics, suppression-floored (student:read)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/early-warnings",
    auth: { kind: "partner", scope: "student:read" },
    description: "AGGREGATE early-warning counts, suppression-floored (student:read)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/pathways/overview",
    auth: { kind: "partner", scope: "student:read" },
    description: "AGGREGATE pathway distribution, suppression-floored (student:read)",
    probe: true,
  },

  // ── chainweb:read ──────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/chainweb/coefficients",
    auth: { kind: "partner", scope: "chainweb:read" },
    description: "evidence coefficients for ROI scenarios (chainweb:read)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/chainweb/templates",
    auth: { kind: "partner", scope: "chainweb:read" },
    description: "quick-start ROI scenario templates (chainweb:read)",
    probe: true,
  },
  {
    method: "POST",
    path: "/api/partner/v1/chainweb/scenarios",
    auth: { kind: "partner", scope: "chainweb:read" },
    description: "create a partner-owned ROI scenario (chainweb:read)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/chainweb/scenarios/:id",
    auth: { kind: "partner", scope: "chainweb:read" },
    description: "read a partner-owned ROI scenario (chainweb:read)",
    probe: true,
  },
  {
    method: "POST",
    path: "/api/partner/v1/chainweb/scenarios/:id/calculate",
    auth: { kind: "partner", scope: "chainweb:read" },
    description: "calculate ROI scenario (chainweb:read)",
    probe: true,
  },
  {
    method: "POST",
    path: "/api/partner/v1/chainweb/calculations/:id/narratives",
    auth: { kind: "partner", scope: "chainweb:read" },
    description: "generate scenario narrative (chainweb:read)",
    probe: true,
  },

  // ── yhsi:read ──────────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/yhsi/metrics",
    auth: { kind: "partner", scope: "yhsi:read" },
    description: "aggregate YHSI metrics, floor-5 suppressed (yhsi:read)",
    probe: true,
  },
  {
    method: "GET",
    path: "/api/partner/v1/yhsi/outcomes-summary",
    auth: { kind: "partner", scope: "yhsi:read" },
    description: "aggregate YHSI outcome milestones (yhsi:read)",
    probe: true,
  },

  // ── outcomes:read ──────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/outcomes/trade-completions",
    auth: { kind: "partner", scope: "outcomes:read" },
    description:
      "AGGREGATE trade sim completion counts by trade slug, past 30/60/90 days (outcomes:read)",
  },

  // ── certs:read ─────────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/certificates/verify/:certId",
    auth: { kind: "partner", scope: "certs:read" },
    description: "verify a trade certificate by ID (certs:read)",
  },

  // ── capacity:read / capacity:write ────────────────────────────────────────
  {
    method: "GET",
    path: "/api/partner/v1/capacity",
    auth: { kind: "partner", scope: "capacity:read" },
    description: "read this partner's capacity entries (capacity:read)",
  },
  {
    method: "PATCH",
    path: "/api/partner/v1/capacity",
    auth: { kind: "partner", scope: "capacity:write" },
    description: "create or update this partner's capacity entries (capacity:write)",
  },

  // ── inbound:write ──────────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/api/partner/v1/push",
    auth: { kind: "partner", scope: "inbound:write" },
    description: "push data to ThriveUp (inbound:write)",
  },
] as const;

// ── Derived utilities ────────────────────────────────────────────────────────

/**
 * Formats a registry entry into the endpoint string used in the /docs response.
 * Format: "METHOD /path/... — description"
 */
export function buildDocsEndpointLine(entry: PartnerRouteEntry): string {
  return `${entry.method} ${entry.path} — ${entry.description}`;
}

/**
 * Returns all entries that the post-publish verifier should probe.
 * Each entry must respond 401 or 403 when called without credentials.
 * The returned `scope` field is what the verifier looks for inside parentheses
 * in the docs listing (null means no specific scope label is required).
 */
export function getVerifierProbes(): ReadonlyArray<{
  method: "GET" | "POST";
  path: string;
  scope: string | null;
}> {
  return PARTNER_API_CONTRACT.filter((e) => e.probe).map((e) => ({
    method: e.method as "GET" | "POST",
    path: e.path,
    scope: e.auth.kind === "partner" ? (e.auth.scope ?? null) : null,
  }));
}

/**
 * Inspects an Express app's registered routes and returns which registry
 * entries are absent and which `/api/partner/v1/*` routes are registered but
 * absent from the registry.  Skips public-auth entries (docs) since they are
 * always registered.
 *
 * Pass the result to logRouteRegistrationDrift() for development-time
 * warnings. This function intentionally avoids throwing so the server can
 * still start in production even if there is temporary drift.
 */
export function auditRouteRegistration(app: {
  _router?: { stack?: unknown[] };
  router?: { stack?: unknown[] };
  locals?: { partnerMountedRoutes?: string[] };
}): { missing: string[]; extra: string[] } {
  // Express 4 exposes _router; Express 5 exposes the lazily-created router
  // as app.router. Support both so a missing property never becomes a false
  // clean audit.
  const routerStack = app._router?.stack ?? app.router?.stack;
  if (!Array.isArray(routerStack)) {
    return { missing: ["<router-stack-unavailable>"], extra: [] };
  }

  // Collect all registered routes from the Express router stack.
  const registered = new Set<string>();
  function walk(layers: unknown[]): void {
    for (const layer of layers) {
      const l = layer as {
        route?: { methods?: Record<string, boolean>; path?: string };
        handle?: { stack?: unknown[] };
      };
      if (l.route?.path && l.route.methods) {
        for (const [method, active] of Object.entries(l.route.methods)) {
          if (active && method !== "_all") {
            registered.add(`${method.toUpperCase()} ${l.route.path}`);
          }
        }
      } else if (l.handle?.stack) {
        walk(l.handle.stack);
      }
    }
  }
  walk(routerStack);

  // Build expected set from registry (partner-only routes — the ones that must be present).
  const expected: Record<string, PartnerRouteEntry> = {};
  for (const entry of PARTNER_API_CONTRACT) {
    expected[`${entry.method} ${entry.path}`] = entry;
  }

  const missing: string[] = [];
  // Express 5 does not retain a mount path on nested Router layers until a
  // request matches them. The route registrar records externally mounted
  // partner routes on app.locals after mounting them; use that runtime
  // registration evidence rather than a path-only exemption.
  const mountedPartnerRoutes = new Set(app.locals?.partnerMountedRoutes ?? []);
  for (const key of Object.keys(expected)) {
    const [method, ...pathParts] = key.split(" ");
    const path = pathParts.join(" ");
    const isMountedRoute = mountedPartnerRoutes.has(key);
    if (!registered.has(key) && !isMountedRoute) missing.push(key);
  }

  const extra: string[] = [];
  for (const key of Array.from(registered)) {
    if (!key.includes("/api/partner/v1/")) continue;
    const path = key.replace(/^[A-Z]+ /, "");
    if (DEPRECATED_PARTNER_API_PATHS.has(path)) continue;
    if (!Object.prototype.hasOwnProperty.call(expected, key)) extra.push(key);
  }

  return { missing, extra };
}
