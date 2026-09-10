/**
 * Post-publish Partner API contract check.
 *
 * Runs the credential-free Partner API contract verifier against the published
 * deployment.  A passing exit code (0) is required before any ChildCORE or
 * external-partner integration is confirmed live.
 *
 * This is a manual operator gate.  It requires PUBLISHED_BASE_URL to be set
 * to the published app's HTTPS URL, which the operator copies from the Replit
 * Deployments panel (Adjust settings → Published URL) after each publish.
 * The development workspace's REPLIT_DOMAINS env var contains only the
 * .replit.dev dev-workspace hostname — not the production domain — so URL
 * discovery from env vars alone is not attempted here.
 *
 * Usage (run from the workspace after every publish):
 *   PUBLISHED_BASE_URL=https://easyailearning.com \
 *     npx tsx scripts/post-publish-partner-api-check.ts
 *
 * Exit codes:
 *   0  All contract checks passed.  Integration-live confirmation is cleared.
 *   1  One or more contract checks failed (deployment drift detected).
 *      Do NOT confirm any partner integration live — fix the drift and
 *      republish before re-running.
 *   2  Configuration error (missing, invalid, or dev-workspace URL).
 *      The check did not run; no contract claim is made.
 *
 * Safety: No partner credentials or partner payloads are sent.
 * The URL is parsed to extract only its sanitized origin before logging;
 * credentials, tokens, or query strings in a mistaken URL are never printed.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

// ── URL validation ────────────────────────────────────────────────────────────

const rawUrl = (process.env.PUBLISHED_BASE_URL ?? "").trim();

if (!rawUrl) {
  console.error(
    "\n❌ POST-PUBLISH PARTNER API CHECK NOT RUN\n"
    + "\n"
    + "   PUBLISHED_BASE_URL is not set.\n"
    + "\n"
    + "   After publishing the app, copy the production URL from the Replit\n"
    + "   Deployments panel (Adjust settings → Published URL) and run:\n"
    + "\n"
    + "     PUBLISHED_BASE_URL=https://easyailearning.com \\\n"
    + "       npx tsx scripts/post-publish-partner-api-check.ts\n"
    + "\n"
    + "   Do NOT confirm any partner integration live without a passing (exit 0)\n"
    + "   result from this check.\n",
  );
  process.exit(2);
}

// Parse the URL to extract only the safe origin for logging.
// This prevents credentials, signed tokens, or query parameters in a
// mistakenly-constructed URL from appearing in workflow or terminal logs.
let safeDisplayOrigin: string;
try {
  const parsed = new URL(rawUrl);
  safeDisplayOrigin = parsed.origin; // strips username, password, path, query, hash
} catch {
  console.error(
    "\n❌ POST-PUBLISH PARTNER API CHECK NOT RUN\n"
    + "\n"
    + "   PUBLISHED_BASE_URL is not a valid URL.\n"
    + "   Provide an HTTPS origin URL (e.g. https://easyailearning.com).\n",
  );
  process.exit(2);
}

// Reject .replit.dev URLs — those are the dev-workspace domain, not a
// production deployment.  An operator who copies a URL from the workspace
// preview bar instead of the Deployments panel gets a clear error here.
if (safeDisplayOrigin.includes(".replit.dev")) {
  console.error(
    "\n❌ POST-PUBLISH PARTNER API CHECK NOT RUN\n"
    + "\n"
    + `   PUBLISHED_BASE_URL resolves to a dev-workspace domain (.replit.dev).\n`
    + "   Copy the published URL from the Replit Deployments panel\n"
    + "   (Adjust settings → Published URL) — it ends in .replit.app or is\n"
    + "   your configured custom domain.\n",
  );
  process.exit(2);
}

// ── Run the verifier ──────────────────────────────────────────────────────────

// Log the sanitized origin only — never rawUrl, which may contain credentials.
console.log(`\nPost-publish Partner API contract check`);
console.log(`Target: ${safeDisplayOrigin}\n`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const verifierPath = path.join(__dirname, "verify-published-partner-api-contract.ts");

const result = spawnSync(
  "npx",
  ["tsx", verifierPath],
  {
    env: {
      ...process.env,
      // Pass only the validated origin (no credentials, query, hash).
      // Also clear any BASE_URL alias so the verifier enforces HTTPS.
      PUBLISHED_BASE_URL: safeDisplayOrigin,
      BASE_URL: "",
    },
    stdio: "inherit",
  },
);

const code = result.status ?? 1;

if (code === 0) {
  console.log("\n✅ Post-publish Partner API contract check PASSED.");
  console.log(
    "   Docs, auth guards, and route coverage match the required surface.\n"
    + "   Integration-live confirmation is cleared for this deployment.",
  );
  process.exit(0);
}

if (code === 2) {
  // Verifier rejected its own configuration (invalid URL shape, wrong
  // protocol, credentials embedded, etc.).
  console.error(
    "\n❌ POST-PUBLISH PARTNER API CHECK NOT RUN (verifier configuration error)\n"
    + "\n"
    + `   The verifier rejected the target URL.\n`
    + "   The URL must be an HTTPS origin without credentials, query string,\n"
    + "   hash, or path (e.g. https://easyailearning.com).\n",
  );
  process.exit(2);
}

// exit code 1: contract drift detected.
console.error(
  "\n❌ Post-publish Partner API contract check FAILED.\n"
  + "\n"
  + "   At least one deployment drift was detected (see ✗ lines above).\n"
  + "\n"
  + "   Required action:\n"
  + "     1. Fix the reported drift in the workspace.\n"
  + "     2. Republish the app.\n"
  + "     3. Re-run this check and confirm exit 0 before sending any\n"
  + "        ChildCORE or partner integration-live confirmation.\n",
);
process.exit(1);
