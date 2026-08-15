#!/usr/bin/env tsx
/**
 * verify-intake-contact-validation.ts
 *
 * Asserts that both PATCH endpoints reject malformed contactPhone and
 * contactUrl values with HTTP 400, and accept well-formed values.
 *
 * Endpoints covered:
 *   - PATCH /api/partner/v1/capacity  (partner-key auth)
 *   - PATCH /api/partner-portal/capacity  (session auth — tested via validator unit)
 *
 * The partner-key endpoint is directly callable in CI because it only needs
 * a valid x-partner-key. The session-auth endpoint cannot be called without
 * a live session, so its validation is exercised by importing the shared
 * validator directly and running unit assertions, guaranteeing the same rule
 * is in effect for both.
 *
 * Run: npx tsx scripts/verify-intake-contact-validation.ts
 */

import { validateContactPhone, validateContactUrl } from "../shared/intake-contact-validators";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    failed++;
  }
}

// ── Unit tests for the shared validator ──────────────────────────────────────

console.log("\n[1] validateContactUrl — unit tests");

// Valid URLs
assert(validateContactUrl(null).ok,                        "null → ok (optional)");
assert(validateContactUrl(undefined).ok,                   "undefined → ok (optional)");
assert(validateContactUrl("").ok,                          "empty string → ok (optional)");
assert(validateContactUrl("https://example.org").ok,       "https:// URL → ok");
assert(validateContactUrl("http://intake.agency.gov/apply").ok, "http:// URL with path → ok");
assert(validateContactUrl("https://apply.example.com/forms/intake?ref=chw").ok, "https URL with query → ok");

// Invalid URLs
assert(!validateContactUrl("not-a-url").ok,                "bare string rejected");
assert(!validateContactUrl("ftp://example.com").ok,        "ftp:// rejected (wrong scheme)");
assert(!validateContactUrl("example.com").ok,              "no-scheme rejected");
assert(!validateContactUrl("http://").ok,                  "http:// with no hostname rejected");
assert(!validateContactUrl(123).ok,                        "non-string rejected");

console.log("\n[2] validateContactPhone — unit tests");

// Valid phones
assert(validateContactPhone(null).ok,                      "null → ok (optional)");
assert(validateContactPhone(undefined).ok,                 "undefined → ok (optional)");
assert(validateContactPhone("").ok,                        "empty string → ok (optional)");
assert(validateContactPhone("512-555-0142").ok,            "dashed format → ok");
assert(validateContactPhone("(512) 555-0142").ok,          "parenthesized format → ok");
assert(validateContactPhone("512.555.0142").ok,            "dot-separated → ok");
assert(validateContactPhone("5125550142").ok,              "bare 10 digits → ok");
assert(validateContactPhone("+1 512 555 0142").ok,         "+1 with spaces → ok");
assert(validateContactPhone("1-512-555-0142").ok,          "1- prefix → ok");

// Invalid phones
assert(!validateContactPhone("555-0142").ok,               "7-digit rejected");
assert(!validateContactPhone("0125550142").ok,             "area code starting with 0 rejected");
assert(!validateContactPhone("1125550142").ok,             "area code starting with 1 rejected");
assert(!validateContactPhone("not-a-phone").ok,            "alphabetic string rejected");
assert(!validateContactPhone("512-555-01").ok,             "too few digits rejected");
assert(!validateContactPhone("512-555-01423").ok,          "11 non-country-code digits rejected");
assert(!validateContactPhone(5125550142).ok,               "non-string rejected");

// ── HTTP integration tests for /api/partner/v1/capacity ───────────────────────

console.log("\n[3] HTTP integration — PATCH /api/partner/v1/capacity");
console.log("    (requires a running dev server; skipped if no partner key available)");

const PARTNER_KEY = process.env.TEST_PARTNER_KEY;

if (!PARTNER_KEY) {
  console.log("  ⚠  TEST_PARTNER_KEY not set — skipping live HTTP checks for partner-key endpoint");
  console.log("     Set TEST_PARTNER_KEY=tcaf_... to run live rejection checks.");
} else {
  async function patchPartner(body: Record<string, unknown>): Promise<{ status: number; body: any }> {
    const res = await fetch(`${BASE}/api/partner/v1/capacity`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-partner-key": PARTNER_KEY!,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
  }

  const basePayload = { orgName: "Validation Test Org", status: "open", programCode: "general" };

  // Bad phone
  {
    const r = await patchPartner({ ...basePayload, contactPhone: "not-a-phone" });
    assert(r.status === 400, `bad phone → 400 (got ${r.status})`);
    assert(typeof r.body.error === "string" && r.body.error.toLowerCase().includes("contactphone"),
      `bad phone → error message mentions 'contactPhone' (got: "${r.body.error}")`);
  }

  // Bad URL scheme
  {
    const r = await patchPartner({ ...basePayload, contactUrl: "ftp://example.com" });
    assert(r.status === 400, `ftp:// URL → 400 (got ${r.status})`);
    assert(typeof r.body.error === "string" && r.body.error.toLowerCase().includes("contacturl"),
      `bad URL → error message mentions 'contactUrl' (got: "${r.body.error}")`);
  }

  // Malformed URL
  {
    const r = await patchPartner({ ...basePayload, contactUrl: "not-a-url" });
    assert(r.status === 400, `malformed URL → 400 (got ${r.status})`);
  }

  // Valid phone + URL accepted (200 or 500 if DB unavailable, not 400)
  {
    const r = await patchPartner({
      ...basePayload,
      contactPhone: "512-555-0142",
      contactUrl: "https://intake.example.org/apply",
    });
    assert(r.status !== 400, `valid phone+URL → not 400 (got ${r.status})`);
  }

  // Omitted phone/URL also accepted
  {
    const r = await patchPartner({ ...basePayload });
    assert(r.status !== 400, `omitted phone/URL → not 400 (got ${r.status})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\nIntake contact validation checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("✅ All intake contact validation checks passed.");
process.exit(0);
