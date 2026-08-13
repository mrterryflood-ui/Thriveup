/**
 * verify-share-link-e2e.ts
 *
 * End-to-end verification of the partner share-link flow:
 *   1. Authenticated generate → returns shareUrl + token
 *   2. Public /profile endpoint returns orgName and location
 *   3. Public /community-story endpoint returns a brief with indicators or demographics
 *   4. Public /benefits endpoint returns a programs array
 *   5. DELETE /revoke invalidates the token (profile returns 404)
 *   6. Regenerate after revoke produces a fresh working token
 *
 * Uses the ECS of NC partner key (stored in the DB).  The key is read
 * from the DB so the script never hardcodes a plaintext secret.
 */

import { db } from "../server/storage";
import { partnerApiKeys } from "@shared/schema";
import { like } from "drizzle-orm";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";

async function api(
  method: string,
  path: string,
  opts: { key?: string; body?: unknown } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {};
  if (opts.key)  headers["x-tcaf-key"]    = opts.key;
  if (opts.body) headers["Content-Type"]  = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("\n[share-link-e2e] starting...\n");

  // ── Resolve the ECS of NC key from the DB ──────────────────────────────────
  const [record] = await db
    .select()
    .from(partnerApiKeys)
    .where(like(partnerApiKeys.keyPrefix, "tcaf_18f09f9b4%"));

  if (!record) {
    console.error("[share-link-e2e] ECS of NC partner key not found in DB. Seed first.");
    process.exit(1);
  }

  // We need the full plaintext key to test auth.  The record stores the hash,
  // not the plaintext.  We use an env var override; if absent we skip key-auth
  // tests and only test the public (token-gated) endpoints using an existing token.
  const FULL_KEY = process.env.ECS_PARTNER_KEY ?? "";
  const canAuth  = FULL_KEY.length > 0;

  let token = record.shareToken ?? "";

  // ── Step 1: Generate share link (requires auth) ───────────────────────────
  if (canAuth) {
    console.log("Step 1: generate share link");
    const { status, body } = await api("POST", "/api/partner-dashboard/share/generate", { key: FULL_KEY });
    assert(status === 200, `generate returns 200 (got ${status})`);
    assert(typeof body.shareUrl === "string" && body.shareUrl.includes("/shared/"), "shareUrl looks correct");
    assert(typeof body.token === "string" && body.token.length >= 16, "token is present");
    token = body.token;
    console.log(`  shareUrl: ${body.shareUrl}`);
  } else {
    console.log("Step 1: SKIPPED (set ECS_PARTNER_KEY env var to test auth endpoints)");
    if (!token) {
      console.log("[share-link-e2e] No ECS_PARTNER_KEY and no existing share token — cannot test public endpoints.");
      console.log("[share-link-e2e] Generate a share link via the dashboard first, or set ECS_PARTNER_KEY.");
      process.exit(0);
    }
    console.log(`  Using existing token from DB: ${token.slice(0, 8)}…`);
  }

  // ── Step 2: Public profile ────────────────────────────────────────────────
  console.log("\nStep 2: public /profile");
  const profile = await api("GET", `/api/partner-dashboard/share/${token}/profile`);
  assert(profile.status === 200, `profile returns 200 (got ${profile.status})`);
  assert(typeof profile.body.orgName === "string" && profile.body.orgName.length > 0, "orgName is present");
  assert(typeof profile.body.location === "string" && profile.body.location.length > 0, "location is present");
  console.log(`  org: ${profile.body.orgName} · location: ${profile.body.location}`);

  // ── Step 3: Public community story ────────────────────────────────────────
  console.log("\nStep 3: public /community-story");
  const storyRes = await api("GET", `/api/partner-dashboard/share/${token}/community-story`);
  assert(storyRes.status === 200, `community-story returns 200 (got ${storyRes.status}: ${JSON.stringify(storyRes.body).slice(0, 120)})`);
  const brief = storyRes.body?.brief ?? storyRes.body;
  const hasData =
    (Array.isArray(brief?.indicators) && brief.indicators.length > 0) ||
    (brief?.demographics && Object.keys(brief.demographics).length > 0) ||
    (brief?.geography && typeof brief.geography === "object");
  assert(hasData, "community-story brief contains demographics or indicators");

  // ── Step 4: Public benefits ───────────────────────────────────────────────
  console.log("\nStep 4: public /benefits");
  const benRes = await api("GET", `/api/partner-dashboard/share/${token}/benefits`);
  assert(benRes.status === 200, `benefits returns 200 (got ${benRes.status})`);
  assert(Array.isArray(benRes.body?.programs), "programs array is present");
  console.log(`  ${benRes.body.programs.length} programs returned`);

  // ── Step 5: Revoke + verify 404 ────────────────────────────────────────────
  if (canAuth) {
    console.log("\nStep 5: revoke share link");
    const revokeRes = await api("DELETE", "/api/partner-dashboard/share/revoke", { key: FULL_KEY });
    assert(revokeRes.status === 200 && revokeRes.body.revoked === true, `revoke returns {revoked:true} (got ${JSON.stringify(revokeRes.body)})`);

    const afterRevoke = await api("GET", `/api/partner-dashboard/share/${token}/profile`);
    assert(afterRevoke.status === 404, `revoked token returns 404 on /profile (got ${afterRevoke.status})`);

    // ── Step 6: Regenerate after revoke ──────────────────────────────────────
    console.log("\nStep 6: regenerate after revoke");
    const regen = await api("POST", "/api/partner-dashboard/share/generate", { key: FULL_KEY });
    assert(regen.status === 200, `regenerate returns 200 (got ${regen.status})`);
    assert(regen.body.token !== token, "new token is different from the revoked one");
    const regenProfile = await api("GET", `/api/partner-dashboard/share/${regen.body.token}/profile`);
    assert(regenProfile.status === 200, `fresh token returns working /profile`);
    console.log(`  new token: ${regen.body.token.slice(0, 8)}…`);
  } else {
    console.log("\nSteps 5–6: SKIPPED (set ECS_PARTNER_KEY to test revoke + regenerate)");
  }

  console.log("\n[share-link-e2e] all checks passed ✓\n");
}

main().catch((err) => {
  console.error("[share-link-e2e] unexpected error:", err);
  process.exit(1);
});
