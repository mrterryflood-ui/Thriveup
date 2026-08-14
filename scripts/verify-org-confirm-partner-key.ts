/**
 * verify-org-confirm-partner-key.ts — proves that a partner org can close the
 * enrollment loop end-to-end using a tcaf_ API key, without any staff login.
 *
 * Four sequential checks:
 *
 *   (1) POST /api/referrals (as staff) → 201 with orgConfirmUrl in the response
 *       body, confirming the staff user receives the URL to forward to the org.
 *   (2) PATCH /api/referrals/:id/outcome with x-partner-key (inbound:write) →
 *       200, confirming the org can resolve the referral programmatically.
 *   (3) PATCH again → 409, confirming the immutability guard holds even for
 *       the partner-key path.
 *   (4) PATCH with a valid key whose partnerName does NOT match the referral's
 *       orgName → 403, confirming cross-org isolation.
 *
 * Run against the dev server:
 *   npx tsx scripts/verify-org-confirm-partner-key.ts
 */

import { createHash, randomBytes } from "crypto";
import { db } from "../server/storage";
import { referrals } from "@shared/schema";
import { eq } from "drizzle-orm";

const BASE = process.env.BASE_URL || "http://localhost:5000";

function fail(msg: string): never {
  console.error(`✗ FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll the root until the server responds (up to 60 s). */
async function waitForServer(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3000) });
      if (r.status < 600) return;
    } catch {
      /* not ready yet */
    }
    await sleep(2000);
  }
  fail("Server did not become reachable within 60 s.");
}

async function run() {
  console.log(`Partner-key enrollment loop e2e against ${BASE}`);

  await waitForServer();

  // ── Auth + DB setup ────────────────────────────────────────────────────────
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } =
    await import("../tests/e2e/helpers/auth");

  const pgClient = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await pgClient.connect();

  const testUser = {
    userId: "e2e-partner-key-181",
    email: "e2e-partner-key-181@test.local",
    firstName: "E2E",
    lastName: "PartnerKeyGate",
    role: "case_manager",
  };

  // Org names used by this script.
  const TARGET_ORG = "E2E PartnerKey Verify Org";
  const OTHER_ORG  = "E2E PartnerKey Other Org";

  // Test key plaintexts — tcaf_ prefix required by requirePartnerAuth.
  // randomBytes suffix ensures no collision across parallel runs.
  const suffix        = randomBytes(4).toString("hex");
  const KEY_MATCH     = `tcaf_e2epkv_match_${suffix}`;    // partnerName === TARGET_ORG
  const KEY_MISMATCH  = `tcaf_e2epkv_mismatch_${suffix}`; // partnerName === OTHER_ORG

  let createdId: string | undefined;
  let keyMatchId: string | undefined;
  let keyMismatchId: string | undefined;
  let r2Id: string | undefined;

  try {
    // ── Insert two test partner keys directly in the DB ──────────────────────
    // generateKey() is a server-side helper; here we replicate just the hash
    // so the script stays self-contained.  keyPrefix stores the first 12 chars
    // of the plaintext for admin display (no security function).
    const insertKey = async (plaintext: string, partnerName: string) => {
      const keyHash   = hashKey(plaintext);
      const keyPrefix = plaintext.slice(0, 12);
      const res = await pgClient.query<{ id: string }>(
        `INSERT INTO partner_api_keys
           (partner_name, partner_email, key_hash, key_prefix, scopes, active, notes)
         VALUES ($1, $2, $3, $4, ARRAY['inbound:write']::text[], true, $5)
         RETURNING id`,
        [
          partnerName,
          "e2e-test@test.local",
          keyHash,
          keyPrefix,
          "inserted by verify-org-confirm-partner-key.ts — safe to delete",
        ],
      );
      return res.rows[0].id;
    };

    keyMatchId    = await insertKey(KEY_MATCH,    TARGET_ORG);
    keyMismatchId = await insertKey(KEY_MISMATCH, OTHER_ORG);
    ok(`test partner keys provisioned (match=${keyMatchId.slice(0, 8)}… mismatch=${keyMismatchId.slice(0, 8)}…)`);

    // ── [0] Forge a staff session ─────────────────────────────────────────────
    await ensureTestUser(pgClient, testUser);
    const cookie = await forgeSession(pgClient, testUser);
    ok("staff session forged for case_manager");

    // ── (1) POST /api/referrals — staff-gated create ─────────────────────────
    console.log("\n[1] POST /api/referrals (as case_manager) — verify orgConfirmUrl in response");
    const createRes = await fetch(`${BASE}/api/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        programCode: "SNAP",
        orgName: TARGET_ORG,
        clientDisplayName: "E2E PartnerKey Client",
        notes: "verify-org-confirm-partner-key.ts e2e check",
      }),
    });

    if (createRes.status === 401 || createRes.status === 403) {
      fail(
        `${createRes.status} — POST /api/referrals rejected the forged staff session. ` +
          `Role 'case_manager' may no longer satisfy requireStaff, or the session forge is broken.`,
      );
    }
    if (createRes.status !== 201) {
      const body = await createRes.text();
      fail(`POST /api/referrals returned ${createRes.status} (expected 201): ${body.slice(0, 300)}`);
    }

    const createBody: any = await createRes.json();
    createdId = createBody.referral?.id;
    if (!createdId) fail("201 response missing referral.id");
    ok(`201 created — referralId=${createdId}`);

    // Verify orgConfirmUrl is present in the staff-facing HTTP response.
    // (It is intentionally excluded from the fireWebhook payload so the
    //  one-time mutation token never leaks to all webhook subscribers.)
    const orgConfirmUrl: string = createBody.orgConfirmUrl;
    if (!orgConfirmUrl || typeof orgConfirmUrl !== "string") {
      fail(`201 response missing orgConfirmUrl (got ${JSON.stringify(orgConfirmUrl)})`);
    }
    ok(`orgConfirmUrl present in 201 response: ${orgConfirmUrl}`);

    // statusUrl should also be present — belt-and-suspenders.
    const statusUrl: string = createBody.statusUrl;
    if (!statusUrl || typeof statusUrl !== "string") {
      fail(`201 response missing statusUrl (got ${JSON.stringify(statusUrl)})`);
    }
    ok(`statusUrl present: ${statusUrl}`);

    // ── (2) PATCH with matching partner key → 200 ─────────────────────────────
    console.log("\n[2] PATCH /api/referrals/:id/outcome with matching x-partner-key → 200");
    const patchRes = await fetch(`${BASE}/api/referrals/${createdId}/outcome`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-partner-key": KEY_MATCH,
      },
      body: JSON.stringify({ status: "enrolled" }),
    });

    if (patchRes.status !== 200) {
      const body = await patchRes.text();
      fail(
        `PATCH with matching partner key returned ${patchRes.status} (expected 200): ${body.slice(0, 300)}`,
      );
    }

    const patchBody: any = await patchRes.json();
    if (patchBody.status !== "enrolled") {
      fail(`PATCH response status is '${patchBody.status}' (expected 'enrolled')`);
    }
    ok(`200 — status updated to 'enrolled' via partner key (no staff login)`);

    // Confirm resolvedAt is set in the DB.
    const dbRow = await pgClient.query(
      `SELECT resolved_at, status FROM referrals WHERE id = $1`,
      [createdId],
    );
    if (dbRow.rowCount === 0) fail(`Referral row ${createdId} not found in DB after PATCH`);
    const row = dbRow.rows[0];
    if (!row.resolved_at) fail("resolvedAt is still NULL after partner-key PATCH");
    if (row.status !== "enrolled") fail(`DB status is '${row.status}' (expected 'enrolled')`);
    ok(`DB row confirmed: resolvedAt set, status='enrolled'`);

    // ── (3) Second PATCH → 409 immutability guard ──────────────────────────────
    console.log("\n[3] PATCH again (same partner key) → 409 immutability guard");
    const patch2Res = await fetch(`${BASE}/api/referrals/${createdId}/outcome`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-partner-key": KEY_MATCH,
      },
      body: JSON.stringify({ status: "withdrew" }),
    });

    if (patch2Res.status !== 409) {
      const body = await patch2Res.text();
      fail(
        `Second PATCH returned ${patch2Res.status} (expected 409 immutability): ${body.slice(0, 300)}`,
      );
    }
    ok(`409 — immutability guard held on second partner-key PATCH`);

    // ── (4) PATCH with mismatched partner key → 403 cross-org isolation ────────
    console.log("\n[4] PATCH with mismatched partner key (other org) → 403");
    // Use a fresh referral so the resolved state from step (2) doesn't interfere.
    // Use Drizzle ORM so the nanoid $defaultFn fires properly (raw SQL won't trigger it).
    const [r2] = await db
      .insert(referrals)
      .values({ programCode: "SNAP", orgName: TARGET_ORG })
      .returning({ id: referrals.id });
    r2Id = r2.id;

    const patch3Res = await fetch(`${BASE}/api/referrals/${r2Id}/outcome`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-partner-key": KEY_MISMATCH, // key for OTHER_ORG, referral is for TARGET_ORG
      },
      body: JSON.stringify({ status: "enrolled" }),
    });

    // Cleanup the second referral row now (success path); the outer finally
    // also covers r2Id so a thrown exception before this point still cleans it up.
    await db.delete(referrals).where(eq(referrals.id, r2Id)).catch(() => {});
    r2Id = undefined;

    if (patch3Res.status !== 403) {
      const body = await patch3Res.text();
      fail(
        `Mismatched-org PATCH returned ${patch3Res.status} (expected 403 cross-org isolation): ${body.slice(0, 300)}`,
      );
    }
    ok(`403 — cross-org isolation held: mismatch key cannot resolve another org's referral`);

  } finally {
    // ── Cleanup ──────────────────────────────────────────────────────────────
    if (createdId) {
      await db.delete(referrals).where(eq(referrals.id, createdId)).catch(() => {});
    }
    if (keyMatchId) {
      await pgClient.query(`DELETE FROM partner_api_keys WHERE id = $1`, [keyMatchId]).catch(() => {});
    }
    if (keyMismatchId) {
      await pgClient.query(`DELETE FROM partner_api_keys WHERE id = $1`, [keyMismatchId]).catch(() => {});
    }
    await cleanupTestUser(pgClient, testUser).catch(() => {});
    await pgClient.end().catch(() => {});
  }

  console.log("\n✅ All partner-key enrollment loop checks passed.");
  process.exit(0);
}

run().catch((e) => {
  console.error("\n❌ Verification failed:", e);
  process.exit(1);
});
