/**
 * Focused ChildCORE documentation-target check.
 *
 * This is intentionally separate from the protected monitoring route. A stale
 * external docs target should be visible to maintainers without preventing an
 * authenticated operator from opening the dashboard and seeing its honest
 * unavailable state.
 */
import { getChildCOREIntegrationConfig } from "../server/childcore-config";

const { docsUrl } = await getChildCOREIntegrationConfig();
const timeoutMs = 6_000;

function fail(message: string): never {
  console.error(`✗ ChildCORE docs target: ${message}`);
  process.exit(1);
}

if (!docsUrl) fail("docsUrl is missing from the shared integration configuration");

let parsed: URL;
try {
  parsed = new URL(docsUrl);
} catch {
  fail(`docsUrl is not a valid URL: ${docsUrl}`);
}

if (parsed.protocol !== "https:") {
  fail(`docsUrl must use HTTPS: ${docsUrl}`);
}

try {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response = await fetch(docsUrl, {
    method: "HEAD",
    redirect: "error",
    signal: controller.signal,
  });

  // Some documentation hosts reject HEAD even when the page is available.
  if (response.status === 405) {
    response = await fetch(docsUrl, {
      method: "GET",
      redirect: "error",
      signal: controller.signal,
    });
  }
  clearTimeout(timer);

  if (response.status >= 400) {
    fail(`returned HTTP ${response.status}: ${docsUrl}`);
  }
  console.log(`✓ ChildCORE docs target reachable (${response.status}): ${docsUrl}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`⚠ ChildCORE docs target could not be checked (${message}); monitoring remains available.`);
  process.exit(0);
}