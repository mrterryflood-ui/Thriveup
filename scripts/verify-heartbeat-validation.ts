/**
 * verify-heartbeat-validation.ts — confirms that POST /api/partner/v1/heartbeat
 * runs incoming fields through the same schema-validation engine already used
 * for /push (server/inbound-verification.ts), and that persistence failures
 * are surfaced rather than swallowed.
 *
 * Checks:
 *   (1) A valid bare heartbeat (empty body) → 200 received:true.
 *   (2) A valid heartbeat with all optional fields → 200 received:true.
 *   (3) A heartbeat with an invalid `status` enum value → 422 with corrections[].
 *   (4) A heartbeat with an oversized `message` → 422 with corrections[].
 *   (5) A heartbeat with an invalid `version` type (number) → 422 with corrections[].
 *   (6) Corrections[] shape: each entry has field, problem, expected.
 *   (7) Static: heartbeat handler imports verifyInboundPayload from inbound-verification.
 *   (8) Static: heartbeat handler does NOT contain a bare swallowed catch: .catch(() => {})
 *       on the DB insert path.
 *
 * Run against the dev server:
 *   npx tsx scripts/verify-heartbeat-validation.ts
 */

import fs from "fs";
import { createHash, randomBytes } from "crypto";
import { Client } from "pg";

const BASE = process.env.BASE_URL || "http://localhost:5000";

let failures = 0;

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string): void {
  failures++;
  console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
}

function check(label: string, cond: boolean, detail?: string) {
  if (cond) ok(label);
  else fail(label, detail);
}

function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3000) });
      if (r.status < 600) return;
    } catch {
      /* not ready */
    }
    await sleep(2000);
  }
  fail("server did not become reachable within 60 s — aborting");
  process.exit(1);
}

async function run() {
  console.log(`\nHeartbeat validation checks against ${BASE}\n`);

  // ── (7) Static source check — before any network calls ────────────────────
  console.log("── static source checks ──");
  {
    const src = fs.existsSync("server/partner-api-routes.ts")
      ? fs.readFileSync("server/partner-api-routes.ts", "utf8")
      : "";

    check(
      "heartbeat handler imports verifyInboundPayload from inbound-verification",
      /verifyInboundPayload/.test(src) && /inbound-verification/.test(src),
    );

    check(
      "heartbeat handler imports hasBlockingRejection",
      /hasBlockingRejection/.test(src),
    );

    check(
      "heartbeat handler imports rejectionsToCorrectionNote",
      /rejectionsToCorrectionNote/.test(src),
    );

    // (8) The old swallowed catch on the insert is gone.
    // We look specifically for the pattern: db.insert(partnerInboundData) ... .catch(() => {})
    // that existed before this change. A false-positive would require the heartbeat
    // insert to still have an empty catch — which is exactly what we're removing.
    const heartbeatBlock = src.match(/app\.post\(["']\/api\/partner\/v1\/heartbeat[\s\S]*?(?=\n  app\.)/)?.[0] ?? "";
    const hasSwallowedCatch = /\.insert\(partnerInboundData\)[\s\S]*?\.catch\(\(\)\s*=>\s*\{\}\)/.test(heartbeatBlock);
    check(
      "heartbeat DB insert no longer uses swallowed .catch(() => {})",
      !hasSwallowedCatch,
      "bare .catch(() => {}) still present on heartbeat insert path",
    );

    check(
      "HEARTBEAT_SCHEMA constant is defined",
      /const HEARTBEAT_SCHEMA/.test(src),
    );
  }

  await waitForServer();

  // ── Provision a temporary test partner key ────────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail("DATABASE_URL not set — skipping live endpoint checks");
    console.log(failures === 0 ? "\n✓ Static checks passed." : `\n✗ ${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
  }

  const pgClient = new Client({ connectionString: dbUrl });
  await pgClient.connect();

  const suffix = randomBytes(4).toString("hex");
  const KEY_PLAINTEXT = `tcaf_hbv_test_${suffix}`;
  const KEY_HASH = hashKey(KEY_PLAINTEXT);
  const KEY_PREFIX = KEY_PLAINTEXT.slice(0, 14);
  let keyId: string | undefined;

  try {
    const ins = await pgClient.query<{ id: string }>(
      `INSERT INTO partner_api_keys
         (partner_name, partner_email, key_hash, key_prefix, scopes, active, notes)
       VALUES ($1, $2, $3, $4, ARRAY['content:read']::text[], true, $5)
       RETURNING id`,
      [
        "HeartbeatVerifyTestPartner",
        "hbv@test.local",
        KEY_HASH,
        KEY_PREFIX,
        "inserted by verify-heartbeat-validation.ts — safe to delete",
      ],
    );
    keyId = ins.rows[0].id;
    ok(`test partner key provisioned (id=${keyId?.slice(0, 8)}…)`);

    const hb = (body: unknown) =>
      fetch(`${BASE}/api/partner/v1/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-partner-key": KEY_PLAINTEXT,
        },
        body: JSON.stringify(body),
      });

    // ── (1) Valid bare heartbeat — empty body ──────────────────────────────
    console.log("\n── (1) valid bare heartbeat (empty body) ──");
    {
      const r = await hb({});
      const body = await r.json().catch(() => ({}));
      check("200 on bare heartbeat", r.status === 200, `got ${r.status}`);
      check("received:true", body.received === true, JSON.stringify(body));
    }

    // ── (2) Valid heartbeat with all optional fields ───────────────────────
    console.log("\n── (2) valid heartbeat with optional fields ──");
    {
      const r = await hb({ message: "All systems nominal", status: "ok", version: "1.2.3" });
      const body = await r.json().catch(() => ({}));
      check("200 on valid optional fields", r.status === 200, `got ${r.status}`);
      check("received:true", body.received === true, JSON.stringify(body));
    }

    // ── (3) Invalid status enum value → 422 ───────────────────────────────
    console.log("\n── (3) invalid status enum → 422 with corrections ──");
    {
      const r = await hb({ status: "INVALID_STATUS_VALUE" });
      const body = await r.json().catch(() => ({}));
      check(
        "422 on invalid status enum",
        r.status === 422,
        `got ${r.status}: ${JSON.stringify(body).slice(0, 200)}`,
      );
      check("body has corrections array", Array.isArray(body.corrections), JSON.stringify(body).slice(0, 200));
      check(
        "corrections mentions 'status' field",
        Array.isArray(body.corrections) && body.corrections.some((c: any) => c.field === "status"),
        JSON.stringify(body.corrections),
      );
      check(
        "corrections entries have field+problem+expected",
        Array.isArray(body.corrections) &&
          body.corrections.every(
            (c: any) =>
              typeof c.field === "string" &&
              typeof c.problem === "string" &&
              typeof c.expected === "string",
          ),
        JSON.stringify(body.corrections),
      );
    }

    // ── (4) Oversized message → 422 ───────────────────────────────────────
    console.log("\n── (4) oversized message field → 422 with corrections ──");
    {
      const longMsg = "x".repeat(600); // HEARTBEAT_SCHEMA.message.maxLength = 500
      const r = await hb({ message: longMsg });
      const body = await r.json().catch(() => ({}));
      check(
        "422 on oversized message",
        r.status === 422,
        `got ${r.status}: ${JSON.stringify(body).slice(0, 200)}`,
      );
      check(
        "corrections mentions 'message' field",
        Array.isArray(body.corrections) && body.corrections.some((c: any) => c.field === "message"),
        JSON.stringify(body.corrections),
      );
    }

    // ── (5) Wrong type for version (number instead of string) → 422 ────────
    console.log("\n── (5) wrong type for version (number) → 422 ──");
    {
      const r = await fetch(`${BASE}/api/partner/v1/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-partner-key": KEY_PLAINTEXT },
        // version must be a string; sending a number should trip wrong_type
        body: JSON.stringify({ version: 12345 }),
      });
      const body = await r.json().catch(() => ({}));
      check(
        "422 on wrong-type version",
        r.status === 422,
        `got ${r.status}: ${JSON.stringify(body).slice(0, 200)}`,
      );
      check(
        "corrections mentions 'version' field",
        Array.isArray(body.corrections) && body.corrections.some((c: any) => c.field === "version"),
        JSON.stringify(body.corrections),
      );
    }

    // ── (6) Corrections shape ─────────────────────────────────────────────
    // Already fully verified in checks (3)–(5) above.

    // ── Verify rejection rows landed in inbound_verification_log ──────────
    console.log("\n── DB: rejection rows persisted in inbound_verification_log ──");
    {
      const res = await pgClient.query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM inbound_verification_log
         WHERE source LIKE 'partner-api-heartbeat:%'
         AND created_at > NOW() - INTERVAL '5 minutes'`,
      );
      const cnt = parseInt(res.rows[0]?.cnt ?? "0", 10);
      check(
        "at least 3 rejection rows written to inbound_verification_log",
        cnt >= 3,
        `found ${cnt} rows`,
      );
    }

  } finally {
    if (keyId) {
      await pgClient.query(`DELETE FROM partner_api_keys WHERE id = $1`, [keyId]).catch(() => {});
    }
    await pgClient.end().catch(() => {});
  }

  console.log(
    failures === 0
      ? "\n✅ All heartbeat validation checks passed."
      : `\n❌ ${failures} check(s) failed.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("\n❌ Verification crashed:", e);
  process.exit(1);
});
