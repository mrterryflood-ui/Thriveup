/**
 * Verify the published Partner API contract before an external partner is told
 * that a deployment is ready.
 *
 * This check sends no partner data:
 * - GET /docs is public and must advertise the current scopes and routes.
 * - Protected routes are probed without a key and must reach authorization
 *   middleware (401/403), not fall through to a stale deployment's 404.
 * - The heartbeat probe is a bodyless POST, so it never sends partner data.
 * - ChildCORE auth is checked with the configured key and an empty records
 *   array; the endpoint rejects it before inserting metrics or an audit row.
 *
 * Usage:
 *   PUBLISHED_BASE_URL=https://published.example.com \
 *     npx tsx scripts/verify-published-partner-api-contract.ts
 *
 * BASE_URL is accepted as a local/manual-test alias. The check refuses to run
 * without one of these variables so an accidental default cannot certify the
 * wrong deployment.
 *
 * The set of routes to verify is driven by the shared contract registry at
 * server/partner-api-contract.ts — entries with probe: true are the ones
 * probed here.  Add a route there (with probe: true) and it is automatically
 * included in this check on the next run.
 */

import { getVerifierProbes } from "../server/partner-api-contract";

type JsonObject = Record<string, unknown>;

type BoundedResponse = {
  response: Response;
  finish: () => void;
};
const configuredBaseUrl = process.env.PUBLISHED_BASE_URL ?? process.env.BASE_URL;
const isPublishedTarget = Boolean(process.env.PUBLISHED_BASE_URL);
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_DOCS_BODY_BYTES = 1_000_000;
let baseOrigin = "";
let failures = 0;

// Probe targets come from the shared contract registry (server/partner-api-contract.ts).
// Any route with probe: true is included here automatically — there is no
// separate list to keep in sync.
const EXPECTED_PUBLIC_ENDPOINTS = getVerifierProbes();
const CHILDCORE_COUNTY_METRICS_PATH = "/api/childcore/county-metrics/ingest";

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

async function fetchWithoutCredentials(path: string, init?: RequestInit): Promise<BoundedResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-cache, no-store");
  headers.set("Pragma", "no-cache");

  try {
    const response = await fetch(endpoint(path), {
      ...init,
      cache: "no-store",
      headers,
      redirect: "manual",
      signal: controller.signal,
    });

    if (new URL(response.url).origin !== baseOrigin) {
      fail(
        `${init?.method ?? "GET"} ${path} returned from an unexpected origin`,
        `received ${response.url}`,
      );
      controller.abort();
      clearTimeout(timeout);
      return null;
    }

    return {
      response,
      finish: () => clearTimeout(timeout),
    };
  } catch (error) {
    clearTimeout(timeout);
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
  const docsPath = `/api/partner/v1/docs?contract_check=${Date.now()}`;
  const request = await fetchWithoutCredentials(docsPath);
  if (!request) return;
  const { response, finish } = request;

  try {
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
    check(
      "public Partner API docs cannot retain stale cached contract data",
      /no-store/i.test(response.headers.get("cache-control") ?? ""),
      "expected Cache-Control: no-store",
    );

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
    const documentedEndpoints = new Map<string, string[]>();
    for (const description of endpoints) {
      const match = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/.exec(description.trim());
      if (!match) continue;
      const routeKey = `${match[1]} ${match[2]}`;
      documentedEndpoints.set(routeKey, [
        ...(documentedEndpoints.get(routeKey) ?? []),
        description,
      ]);
    }

    for (const expected of EXPECTED_PUBLIC_ENDPOINTS) {
      const routeKey = `${expected.method} ${expected.path}`;
      const matchingDescriptions = documentedEndpoints.get(routeKey) ?? [];
      check(
        `public docs list ${routeKey}`,
        matchingDescriptions.length > 0,
        "exact method/path entry is missing from the published /docs response",
      );
      if (expected.scope) {
        const hasExactScope = matchingDescriptions.some((description) => {
          const scopeLabels = [...description.matchAll(/\(([^()]+)\)/g)]
            .map((match) => match[1]);
          return scopeLabels.includes(expected.scope);
        });
        check(
          `public docs map ${routeKey} to ${expected.scope}`,
          hasExactScope,
          "documented route is missing its exact expected scope label",
        );
      }
    }

    const inboundPushContract = docs.inboundPushContract;
    const childcoreContract = inboundPushContract && typeof inboundPushContract === "object"
      ? (inboundPushContract as JsonObject).childcoreCountyMetrics
      : null;
    check(
      "public docs publish the ChildCORE county-metrics ingest contract",
      Boolean(childcoreContract && typeof childcoreContract === "object"),
      "inboundPushContract.childcoreCountyMetrics is missing",
    );
    if (childcoreContract && typeof childcoreContract === "object") {
      const contract = childcoreContract as JsonObject;
      check(
        "ChildCORE county-metrics docs identify the exact method and path",
        contract.method === "POST" && contract.path === CHILDCORE_COUNTY_METRICS_PATH,
        "expected POST /api/childcore/county-metrics/ingest",
      );
      check(
        "ChildCORE county-metrics docs provide the current production URL",
        contract.url === `https://easyailearning.com${CHILDCORE_COUNTY_METRICS_PATH}`,
        "published absolute URL does not match ThriveUp's verified production origin",
      );
      check(
        "ChildCORE county-metrics docs require inbound:write",
        contract.requiredScope === "inbound:write",
        "expected requiredScope inbound:write",
      );
      check(
        "ChildCORE county-metrics docs describe complete response statuses",
        contract.successStatus === 202
          && contract.allRejectedStatus === 400
          && contract.storageFailureStatus === 503,
        "expected partial/success 202, all-rejected 400, and storage-failure 503",
      );
    }
    check(
      "public docs list the ChildCORE county-metrics route",
      documentedEndpoints.has(`POST ${CHILDCORE_COUNTY_METRICS_PATH}`),
      "exact method/path entry is missing from the published /docs response",
    );
  } finally {
    finish();
  }
}

async function verifyProtectedRoute(
  label: string,
  method: "GET" | "POST",
  path: string,
): Promise<void> {
  const request = await fetchWithoutCredentials(path, { method });
  if (!request) return;
  const { response, finish } = request;

  try {
    check(
      `${label} reaches its authorization guard without credentials`,
      response.status === 401 || response.status === 403,
      `returned HTTP ${response.status}; expected 401 or 403, not a stale 404`,
    );
    await response.body?.cancel();
  } finally {
    finish();
  }
}

async function verifyChildCOREAuthenticatedIngress(): Promise<void> {
  const key = process.env.THRIVEUP_API_KEY?.trim();
  if (!key) {
    fail("ChildCORE authenticated ingest probe has a configured THRIVEUP_API_KEY");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );
  try {
    const response = await fetch(endpoint(CHILDCORE_COUNTY_METRICS_PATH), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
      // An empty batch is rejected after identity and scope checks, before any
      // metric rows or ingestion audit records can be written.
      body: JSON.stringify({ records: [] }),
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    if (new URL(response.url).origin !== baseOrigin) {
      fail("ChildCORE authenticated ingest returned from the expected origin");
      await response.body?.cancel();
      return;
    }

    check(
      "ChildCORE key authenticates and passes inbound:write on the ingest route",
      response.status === 400,
      `returned HTTP ${response.status}; expected the empty-batch validation response (400)`,
    );
    if (response.status === 400) {
      const body = await readJson(response);
      check(
        "ChildCORE authenticated probe stopped at empty-batch validation",
        body?.error === "'records' must be a non-empty array",
        "unexpected validation response",
      );
    } else {
      await response.body?.cancel();
    }

    const invalidKeyResponse = await fetch(endpoint(CHILDCORE_COUNTY_METRICS_PATH), {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-childcore-contract-probe",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store",
      },
      body: JSON.stringify({ records: [] }),
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    check(
      "ChildCORE ingest rejects an unrecognized credential",
      invalidKeyResponse.status === 403,
      `returned HTTP ${invalidKeyResponse.status}; expected 403`,
    );
    await invalidKeyResponse.body?.cancel();
  } catch (error) {
    const kind = error instanceof DOMException && error.name === "TimeoutError"
      ? "request timed out"
      : "network, TLS, or redirect failure";
    fail("ChildCORE authenticated ingest probe was reachable", kind);
  } finally {
    clearTimeout(timeout);
  }
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
    [
      ...EXPECTED_PUBLIC_ENDPOINTS.map((expected) =>
        verifyProtectedRoute(
          `${expected.method} ${expected.path}`,
          expected.method,
          expected.path,
        ),
      ),
      verifyProtectedRoute(
        "ChildCORE county-metrics ingestion",
        "POST",
        CHILDCORE_COUNTY_METRICS_PATH,
      ),
    ],
  );
  await verifyChildCOREAuthenticatedIngress();

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
