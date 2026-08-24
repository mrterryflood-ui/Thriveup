/**
 * verify-gpp-endpoint.ts
 * ───────────────────────
 * Validates the configured v1 Community Opportunity Handoff contract.
 *
 * This deliberately does not POST a "probe" to the live partner. A successful
 * POST can create a partner-side pursuit, so live probing would violate the
 * deliberate-authorization boundary. The companion local receiver test proves
 * Bearer authentication and idempotency; runtime delivery keeps every non-2xx
 * response in a truthful rejected state.
 */
import { spawnSync } from "node:child_process";
import { getGrantPathProOpportunityHandoffConfig } from "../server/grantpathpro-config";

const genericApiUrl = process.env.GPP_API_URL?.trim() || null;
const handoffUrl = process.env.GPP_OPPORTUNITY_HANDOFF_URL?.trim() || null;
const handoffKey = process.env.GPP_OPPORTUNITY_HANDOFF_API_KEY?.trim() || null;

function fail(message: string): never {
  console.error(`[gpp-handoff-guard] FAIL — ${message}`);
  process.exit(1);
}

function parseSafeHttpsUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed : null;
  } catch {
    return null;
  }
}

function main() {
  if (!genericApiUrl && !handoffUrl) {
    console.log("[gpp-handoff-guard] GrantPathPro is not configured — live delivery remains unavailable.");
    return;
  }

  if (!handoffUrl) {
    fail("GPP_API_URL is configured without GPP_OPPORTUNITY_HANDOFF_URL. The generic API origin must never be guessed as a consequential handoff receiver.");
  }
  if (!handoffKey) {
    const runtimeConfig = getGrantPathProOpportunityHandoffConfig();
    if (runtimeConfig.configured) {
      fail("Runtime reports a configured handoff receiver without the dedicated handoff credential expected by this guard.");
    }
    console.warn("[gpp-handoff-guard] Dedicated outbound credential is not configured — delivery is intentionally unavailable and no partner request can be sent.");
    return;
  }

  const runtimeConfig = getGrantPathProOpportunityHandoffConfig();
  if (!runtimeConfig.configured || !runtimeConfig.url || !runtimeConfig.apiKey) {
    fail("GPP_OPPORTUNITY_HANDOFF_URL does not satisfy the runtime partner URL allow-list or lacks a usable runtime credential.");
  }

  const parsed = parseSafeHttpsUrl(runtimeConfig.url);
  if (!parsed) {
    fail("GPP_OPPORTUNITY_HANDOFF_URL must be an absolute HTTPS URL without embedded credentials.");
  }
  if (!parsed.pathname.endsWith("/thriveup/mirror")) {
    fail("GPP_OPPORTUNITY_HANDOFF_URL must target the documented /thriveup/mirror receiver.");
  }

  console.log(`[gpp-handoff-guard] Explicit receiver configured: ${parsed.origin}${parsed.pathname}`);
  console.log("[gpp-handoff-guard] Running safe local Bearer/idempotency receiver contract test (no live partner request).");
  const result = spawnSync("npx", ["tsx", "scripts/verify-gpp-opportunity-stub.ts"], { stdio: "inherit" });
  if (result.error) fail(`local receiver contract test could not start: ${result.error.message}`);
  if (result.status !== 0) fail(`local receiver contract test exited with status ${result.status ?? "unknown"}.`);

  console.log("[gpp-handoff-guard] PASS — explicit receiver configuration and safe delivery contract are valid. Live delivery remains truthful: only a receiver 2xx becomes delivered.");
}

main();
