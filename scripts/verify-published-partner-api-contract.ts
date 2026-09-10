/**
 * Verify the published Partner API contract before an external partner is told
 * that a deployment is ready.
 *
 * This check is intentionally credential-free:
 * - GET /docs is public and must advertise the current scopes and routes.
 * - Protected routes are probed without a key and must reach authorization
 *   middleware (401/403), not fall through to a stale deployment's 404.
 * - The heartbeat probe is a bodyless POST, so it never sends partner data.
 *
 * Usage:
 *   PUBLISHED_BASE_URL=https://published.example.com \
 *     npx tsx scripts/verify-published-partner-api-contract.ts
 *
 * BASE_URL is accepted as a local/manual-test alias. The check refuses to run
 * without one of these variables so an accidental default cannot certify the
 * wrong deployment.
 */

type JsonObject = Record<string, unknown>;

const configuredBaseUrl = process.env.PUBLISHED_BASE_URL ?? process.env.BASE_URL;
const isPublishedTarget = Boolean(process.env.PUBLISHED_BASE_URL);
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_DOCS_BODY_BYTES = 1_000_000;
let baseOrigin = "";
let failures = 0;

const EXPECTED_PUBLIC_ENDPOINTS = [
  { method: "GET", path: "/api/partner/v1/chainweb/coefficients", scope: "chainweb:read" },
  { method: "GET", path: "/api/partner/v1/community/brief", scope: "community:read" },
  { method: "GET", path: "/api/partner/v1/chainweb/templates", scope: "chainweb:read" },
  { method: "POST", path: "/api/partner/v1/chainweb/scenarios", scope: "chainweb:read" },
  { method: "GET", path: "/api/partner/v1/chainweb/scenarios/:id", scope: "chainweb:read" },
  { method: "POST", path: "/api/partner/v1/chainweb/scenarios/:id/calculate", scope: "chainweb:read" },
  { method: "POST", path: "/api/partner/v1/chainweb/calculations/:id/narratives", scope: "chainweb:read" },
  { method: "GET", path: "/api/partner/v1/yhsi/metrics", scope: "yhsi:read" },
  { method: "GET", path: "/api/partner/v1/yhsi/outcomes-summary", scope: "yhsi:read" },
  { method: "GET", path: "/api/partner/v1/students/overview", scope: "student:read" },
  { method: "GET", path: "/api/partner/v1/attendance/summary", scope: "student:read" },
  { method: "GET", path: "/api/partner/v1/early-warnings", scope: "student:read" },
  { method: "GET", path: "/api/partner/v1/pathways/overview", scope: "student:read" },
  { method: "POST", path: "/api/partner/v1/heartbeat", scope: null },
] as const;

function ok(label: string): void {
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string): void {
  failures++;
  console.error(`  ✗ DEPLOYMENT DRIFT: ${label}${detail ? ` — ${detail}` : ""}`);
}

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) ok(label);
  else fail(label, detail);
}

function targetOrigin(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (isPublishedTarget && parsed.protocol !== "https:") return null;
    if (!isPublishedTarget && parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.pathname !== "/" && parsed.pathname !== "") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function endpoint(path: string): string {
  return `${baseOrigin}${path}`;
}

async function fetchWithoutCredentials(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(endpoint(path), {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const kind = error instanceof DOMException && error.name === "TimeoutError"
      ? "request timed out"
      : "network or TLS failure";
    fail(`${init?.method ?? "GET"} ${path} was unreachable`, kind);
    return null;
  }
}

async function readBodyUpTo(response: Response, maxBytes: number): Promise<string | null> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function readJson(response: Response): Promise<JsonObject | null> {
  const body = await readBodyUpTo(response, MAX_DOCS_BODY_BYTES);
  if (body === null) return null;
  try {
    const value: unknown = JSON.parse(body);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as JsonObject
      : null;
  } catch {
    return null;
  }
}

async function verifyDocs(): Promise<void> {
  const response = await fetchWithoutCredentials("/api/partner/v1/docs");
  if (!response) return;

  check(
    "public Partner API docs are present",
    response.status === 200,
    `returned HTTP ${response.status}, expected 200`,
  );
  if (response.status !== 200) {
    await response.body?.cancel();
    return;
  }

  const docs = await readJson(response);
  check(
    "public Partner API docs return a JSON object",
    docs !== null,
    "published /docs returned an unexpected response shape",
  );
  if (!docs) return;

  const scopes = Array.isArray(docs?.scopes) ? docs.scopes : [];
  const scopeNames = new Set(
    scopes
      .filter((scope): scope is JsonObject => Boolean(scope) && typeof scope === "object")
      .map((scope) => scope.scope)
      .filter((scope): scope is string => typeof scope === "string"),
  );

  for (const scope of ["chainweb:read", "yhsi:read"]) {
    check(
      `public docs advertise ${scope}`,
      scopeNames.has(scope),
      `scope is missing from the published /docs response`,
    );
  }

  const endpoints = Array.isArray(docs?.endpoints)
    ? docs.endpoints.filter((value): value is string => typeof value === "string")
    : [];
  const documentedEndpoints = new Set(
    endpoints.flatMap((description) => {
      const match = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/.exec(description.trim());
      return match ? [`${match[1]} ${match[2]}|${description}`] : [];
    }),
  );
  for (const expected of EXPECTED_PUBLIC_ENDPOINTS) {
    const routeKey = `${expected.method} ${expected.path}`;
    const matchingDescription = [...documentedEndpoints]
      .find((entry) => entry.startsWith(`${routeKey}|`))
      ?.slice(routeKey.length + 1);
    check(
      `public docs list ${routeKey}`,
      Boolean(matchingDescription),
      "exact method/path entry is missing from the published /docs response",
    );
    if (expected.scope) {
      check(
        `public docs map ${routeKey} to ${expected.scope}`,
        Boolean(matchingDescription?.includes(`(${expected.scope})`)),
        "documented route is missing its expected scope label",
      );
    }
  }
}

async function verifyProtectedRoute(
  label: string,
  method: "GET" | "POST",
  path: string,
): Promise<void> {
  const response = await fetchWithoutCredentials(path, { method });
  if (!response) return;

  check(
    `${label} reaches its authorization guard without credentials`,
    response.status === 401 || response.status === 403,
    `returned HTTP ${response.status}; expected 401 or 403, not a stale 404`,
  );
  await response.body?.cancel();
}

async function run(): Promise<void> {
  if (!configuredBaseUrl) {
    console.error(
      "DEPLOYMENT DRIFT CHECK NOT RUN: set PUBLISHED_BASE_URL to the published app URL "
      + "(BASE_URL is allowed for an explicit local/manual check).",
    );
    process.exit(2);
  }

  const validatedOrigin = targetOrigin(configuredBaseUrl);
  if (!validatedOrigin) {
    console.error(
      "DEPLOYMENT DRIFT CHECK NOT RUN: base URL must be an origin-only "
      + (isPublishedTarget ? "HTTPS" : "HTTP(S)")
      + " URL without credentials, query, hash, or a path.",
    );
    process.exit(2);
  }
  baseOrigin = validatedOrigin;

  console.log("\nPublished Partner API contract check\n");
  await verifyDocs();
  await Promise.all(
    EXPECTED_PUBLIC_ENDPOINTS.map((expected) =>
      verifyProtectedRoute(`${expected.method} ${expected.path}`, expected.method, expected.path),
    ),
  );

  if (failures > 0) {
    console.error(`\n❌ ${failures} deployment contract check(s) failed.`);
    process.exit(1);
  }

  console.log("\n✅ Published Partner API contract matches the expected workspace surface.");
}

run().catch((error) => {
  console.error(
    `\n❌ DEPLOYMENT DRIFT CHECK FAILED: ${error instanceof Error ? error.message : "unexpected failure"}`,
  );
  process.exit(1);
});