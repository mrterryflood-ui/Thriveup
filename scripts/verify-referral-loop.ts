/**
 * verify-referral-loop.ts — end-to-end gate for the CHW referral loop.
 *
 * Proves that a schema change, middleware addition, or route refactor can't
 * silently break the closed referral loop. Four sequential checks:
 *
 *   (1) POST /api/referrals (as staff) → 201 with statusUrl + statusToken
 *   (2) statusToken is present in the DB row for the created referral
 *   (3) GET /api/referrals/status/:token → 200 with correct referral data
 *   (4) PATCH /api/referrals/:id/outcome (as staff) → resolvedAt set in DB
 *
 * Run against the dev server:
 *   npx tsx scripts/verify-referral-loop.ts
 *
 * Optional override:
 *   BASE_URL=http://localhost:5000 npx tsx scripts/verify-referral-loop.ts
 */

const BASE = process.env.BASE_URL || "http://localhost:5000";

function fail(msg: string): never {
  console.error(`✗ FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
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
  console.log(`Referral-loop e2e against ${BASE}`);

  await waitForServer();

  // ── Auth setup ─────────────────────────────────────────────────────────────
  // requireStaff resolves the role via DB (req.user.role is never set in-memory).
  // We forge a real session row + signed cookie using the same helper used by
  // the auth e2e suite and the community-brief e2e gate.
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } =
    await import("../tests/e2e/helpers/auth");

  const pgClient = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await pgClient.connect();

  // ── [0] Zero-subscriber precondition ──────────────────────────────────────
  // The task's core requirement: prove the HTTP referral loop (POST → status →
  // PATCH outcome) completes correctly when NO partner webhook subscriber has
  // registered for referral events. fireWebhook() is fire-and-forget; zero
  // subscribers is a documented clean no-op (see verify-referral-webhook.ts).
  // We assert the precondition rather than mutating live subscriptions, so this
  // gate can never suppress a production delivery.
  console.log("\n[0] Zero-subscriber precondition check");
  const subQuery = await pgClient.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM partner_webhooks
      WHERE event IN ('referral.created', 'referral.outcome') AND active = true`,
  );
  const activeCount = parseInt(subQuery.rows[0]?.count ?? "0", 10);
  if (activeCount > 0) {
    fail(
      `Precondition not met: ${activeCount} active referral webhook subscriber(s) exist in this environment. ` +
        `This gate must run in a zero-subscriber environment to prove the loop succeeds without any dispatcher. ` +
        `Deactivate or remove those subscriptions before running this gate.`,
    );
  }
  ok("zero-subscriber precondition confirmed (0 active referral webhook subscribers)");

  const testUser = {
    userId: "e2e-referral-loop",
    email: "e2e-referral-loop@test.local",
    firstName: "E2E",
    lastName: "ReferralLoop",
    role: "case_manager", // staff role required by requireStaff
  };

  let createdId: string | undefined;

  try {
    await ensureTestUser(pgClient, testUser);
    const cookie = await forgeSession(pgClient, testUser);

    // ── (1) POST /api/referrals — staff-gated create ────────────────────────
    console.log("\n[1] POST /api/referrals (as case_manager staff)");
    const createRes = await fetch(`${BASE}/api/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        programCode: "SNAP",
        orgName: "E2E Loop Verify Org",
        clientDisplayName: "E2E Test Client",
        // 555-01xx is the NANP reserved range used for test records — not a real
        // callable number, so it can never accidentally reach a real person.
        clientPhone: "5550100",
        notes: "verify-referral-loop.ts e2e check",
      }),
    });

    if (createRes.status === 401 || createRes.status === 403) {
      fail(
        `${createRes.status} — POST /api/referrals rejected the forged staff session. ` +
          `The role 'case_manager' may no longer satisfy requireStaff, or the session forge is broken.`,
      );
    }
    if (createRes.status !== 201) {
      const body = await createRes.text();
      fail(
        `POST /api/referrals returned ${createRes.status} (expected 201): ${body.slice(0, 300)}`,
      );
    }

    const createBody: any = await createRes.json();
    ok(`201 created — referralId=${createBody.referral?.id}`);

    const referralId: string = createBody.referral?.id;
    if (!referralId) fail("201 response missing referral.id");

    const statusUrl: string = createBody.statusUrl; // "/status/<token>"
    if (!statusUrl || typeof statusUrl !== "string") {
      fail(`201 response missing statusUrl (got ${JSON.stringify(statusUrl)})`);
    }
    ok(`statusUrl present: ${statusUrl}`);

    const orgConfirmUrl: string = createBody.orgConfirmUrl;
    if (!orgConfirmUrl || typeof orgConfirmUrl !== "string") {
      fail(`201 response missing orgConfirmUrl (got ${JSON.stringify(orgConfirmUrl)})`);
    }
    ok(`orgConfirmUrl present: ${orgConfirmUrl}`);

    createdId = referralId;

    // Extract token from "/status/<token>"
    const tokenMatch = statusUrl.match(/\/status\/(.+)$/);
    if (!tokenMatch) fail(`statusUrl "${statusUrl}" does not match /status/<token>`);
    const statusToken = tokenMatch[1];

    // ── (2) DB check — statusToken recorded in the referrals row ───────────
    console.log("\n[2] DB check — statusToken present in row");
    const dbRow = await pgClient.query(
      `SELECT id, status_token, org_confirm_token, status, resolved_at
         FROM referrals WHERE id = $1`,
      [referralId],
    );
    if (dbRow.rowCount === 0) fail(`Referral row ${referralId} not found in DB`);
    const row = dbRow.rows[0];

    if (!row.status_token) fail("referrals row has a NULL status_token");
    if (row.status_token !== statusToken) {
      fail(
        `DB status_token (${row.status_token}) does not match statusUrl token (${statusToken})`,
      );
    }
    ok(`DB status_token matches statusUrl token (${statusToken.slice(0, 12)}…)`);

    if (!row.org_confirm_token) fail("referrals row has a NULL org_confirm_token");
    ok(`DB org_confirm_token present`);

    if (row.resolved_at !== null) {
      fail("Newly created referral already has a resolvedAt — row is pre-resolved");
    }
    ok("resolvedAt is NULL on new referral (correct)");

    // ── (3) GET /api/referrals/status/:token — public status endpoint ───────
    console.log("\n[3] GET /api/referrals/status/:token (public, no auth)");
    const statusRes = await fetch(`${BASE}/api/referrals/status/${statusToken}`);

    if (statusRes.status !== 200) {
      const body = await statusRes.text();
      fail(
        `GET /api/referrals/status/${statusToken} returned ${statusRes.status} (expected 200): ${body.slice(0, 300)}`,
      );
    }

    const statusBody: any = await statusRes.json();
    if (statusBody.orgName !== "E2E Loop Verify Org") {
      fail(`status endpoint returned wrong orgName: ${statusBody.orgName}`);
    }
    if (statusBody.programCode !== "SNAP") {
      fail(`status endpoint returned wrong programCode: ${statusBody.programCode}`);
    }
    // The referrals table default status is "sent" (the referral has been sent
    // to the org but not yet confirmed). "pending" is not a valid initial value.
    if (statusBody.status !== "sent") {
      fail(
        `status endpoint returned unexpected status "${statusBody.status}" (expected "sent" — the default for a newly created referral)`,
      );
    }
    ok(
      `status endpoint → orgName="${statusBody.orgName}", programCode="${statusBody.programCode}", status="${statusBody.status}"`,
    );

    // ── (4) PATCH /api/referrals/:id/outcome — staff updates outcome ─────────
    console.log("\n[4] PATCH /api/referrals/:id/outcome (as case_manager staff)");
    const patchRes = await fetch(`${BASE}/api/referrals/${referralId}/outcome`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ status: "enrolled", notes: "e2e loop verify" }),
    });

    if (patchRes.status !== 200) {
      const body = await patchRes.text();
      fail(
        `PATCH /api/referrals/${referralId}/outcome returned ${patchRes.status} (expected 200): ${body.slice(0, 300)}`,
      );
    }

    const patchBody: any = await patchRes.json();
    if (patchBody.status !== "enrolled") {
      fail(`PATCH returned status "${patchBody.status}" (expected "enrolled")`);
    }
    ok(`PATCH returned status="enrolled"`);

    // Confirm resolvedAt is now set in DB.
    const dbRowAfter = await pgClient.query(
      `SELECT status, resolved_at FROM referrals WHERE id = $1`,
      [referralId],
    );
    const rowAfter = dbRowAfter.rows[0];
    if (!rowAfter.resolved_at) {
      fail("resolvedAt is still NULL after PATCH outcome — the atomic guard or update is broken");
    }
    ok(`DB resolvedAt is set: ${rowAfter.resolved_at.toISOString()}`);
    if (rowAfter.status !== "enrolled") {
      fail(`DB status is "${rowAfter.status}" after PATCH (expected "enrolled")`);
    }
    ok(`DB status="enrolled" persisted`);

    // Confirm immutability: a second PATCH must be rejected 409.
    console.log("\n[5] Immutability: second PATCH must be rejected 409");
    const secondPatch = await fetch(`${BASE}/api/referrals/${referralId}/outcome`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ status: "withdrew" }),
    });
    if (secondPatch.status !== 409) {
      fail(
        `Second PATCH returned ${secondPatch.status} (expected 409) — resolved referrals are not immutable`,
      );
    }
    ok("Second PATCH correctly rejected 409 (resolved referral is immutable)");

    console.log("\n✅ All referral-loop checks passed.");
  } finally {
    // Clean up the test referral row and user/session.
    if (createdId) {
      await pgClient
        .query(`DELETE FROM referrals WHERE id = $1`, [createdId])
        .catch((e: Error) => console.warn(`[cleanup] referral delete failed: ${e.message}`));
    }
    await cleanupTestUser(pgClient, testUser.userId).catch(() => {});
    await pgClient.end().catch(() => {});
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Referral-loop verification crashed:", err);
  process.exit(1);
});
