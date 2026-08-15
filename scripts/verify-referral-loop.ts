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

  // ── [sweep] Remove any leftover rows from a previous crashed run ───────────
  // If a prior run crashed before its finally block (process.kill, OOM, etc.)
  // it may have left a referral row with orgName "E2E Loop Verify Org" in the
  // DB.  Delete those now so each run starts clean and dashboards never
  // accumulate test noise across crashed runs.
  const swept = await pgClient.query(
    `DELETE FROM referrals
       WHERE org_name = 'E2E Loop Verify Org'
         AND created_at < now() - interval '1 hour'
     RETURNING id`,
  );
  if (swept.rowCount && swept.rowCount > 0) {
    console.warn(
      `[sweep] Removed ${swept.rowCount} orphaned "E2E Loop Verify Org" referral row(s) ` +
        `left by a previous crashed run (older than 1 hour).`,
    );
  }
  // Also sweep the test user/session that might be left over (both old and new userId).
  await cleanupTestUser(pgClient, "e2e-referral-loop").catch(() => {});
  await cleanupTestUser(pgClient, "99999001").catch(() => {});

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

  // Use a numeric-string userId so parseInt() in referral creation stores a
  // valid integer chw_user_id (referrals.chwUserId is an integer column that
  // mirrors Replit OIDC subs, which are numeric).  The /my-sent endpoint then
  // filters by that integer and will find the referral we create.
  const testUser = {
    userId: "99999001",
    email: "e2e-referral-loop@test.local",
    firstName: "E2E",
    lastName: "ReferralLoop",
    role: "case_manager", // staff role required by requireStaff
  };

  let createdId: string | undefined;
  let createdId2: string | undefined;

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
    // If the rate-limit bucket is pre-saturated (e.g. from a prior manual test
    // run in the same minute), we may get 429.  Wait up to 65 s for the 60-s
    // window to expire, then retry once so the gate is self-healing.
    console.log("\n[3] GET /api/referrals/status/:token (public, no auth)");
    let statusRes = await fetch(`${BASE}/api/referrals/status/${statusToken}`);
    if (statusRes.status === 429) {
      console.log("  [3] rate bucket pre-saturated (prior run in same minute); waiting 65 s for reset…");
      await sleep(65000);
      statusRes = await fetch(`${BASE}/api/referrals/status/${statusToken}`);
    }

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

    // ── [6] Rate-limit on GET /api/referrals/status/:token (30 req/min) ───────
    // Probe the rate-limiter by firing requests until a 429 appears (or up to
    // 35 tries).  The per-IP bucket is shared across all requests to this
    // endpoint in the current 60-second window, so earlier steps in this run
    // (step [3] uses 1) or a prior manual test in the same minute may have
    // already consumed some or all of the 30-slot budget.  Either way, a 429
    // must appear within 35 probes to confirm the limiter is installed and
    // configured correctly.  If the first probe is already 429, that's valid.
    console.log("\n[6] Rate-limit check: GET /api/referrals/status/:token (30 req/min per IP)");
    const dummyToken = "rate-limit-check-dummy-token-e2e-0000";
    let first429At = -1;
    for (let i = 1; i <= 35; i++) {
      const r = await fetch(`${BASE}/api/referrals/status/${dummyToken}`);
      if (r.status === 429) {
        first429At = i;
        break; // found the 429 — no need to keep firing
      }
    }
    if (first429At === -1) {
      fail(
        "GET /api/referrals/status/:token never returned 429 after 35 rapid requests — " +
          "rate limit is missing or set too high",
      );
    }
    ok(`Rate-limit 429 confirmed on probe #${first429At} (limit 30/min per IP — correct)`);

    // ── [7] CHW dashboard API shows correct outcome badge after resolution ─────
    // GET /api/referrals/my-sent as the same staff user; confirm the referral
    // we just resolved shows status="enrolled", resolvedAt is set, and
    // valueSource is set (provenance label for the "org-reported" / "default"
    // badge).  The PATCH in [4] used status="enrolled" with no explicit
    // benefitValueEstimate, so the program-default fallback should have fired
    // (valueSource="default") for program SNAP.
    console.log("\n[7] CHW dashboard API — outcome badge + resolvedAt + valueSource after PATCH");
    const dashRes = await fetch(`${BASE}/api/referrals/my-sent`, {
      headers: { cookie },
    });
    if (dashRes.status !== 200) {
      const body = await dashRes.text();
      fail(`GET /api/referrals/my-sent returned ${dashRes.status}: ${body.slice(0, 300)}`);
    }
    const dashBody: any = await dashRes.json();
    const dashReferrals: any[] = dashBody.referrals ?? [];
    const dashRow = dashReferrals.find((r: any) => r.id === referralId);
    if (!dashRow) {
      fail(
        `Referral ${referralId} not found in /api/referrals/my-sent — ` +
          "CHW dashboard is missing the newly resolved referral",
      );
    }
    if (dashRow.status !== "enrolled") {
      fail(
        `CHW dashboard shows status="${dashRow.status}" (expected "enrolled") for referral ${referralId}`,
      );
    }
    ok(`CHW dashboard: status="enrolled" ✓`);

    if (!dashRow.resolvedAt) {
      fail(`CHW dashboard: resolvedAt is missing/null for referral ${referralId}`);
    }
    ok(`CHW dashboard: resolvedAt is set (${dashRow.resolvedAt})`);

    // valueSource must be either "default" (SNAP program default fired) or
    // "reported" (explicit estimate was provided).  Either is correct; we just
    // confirm it is not null so funder UIs can always render a provenance label.
    if (!dashRow.valueSource) {
      fail(
        `CHW dashboard: valueSource is null for an enrolled referral — ` +
          "the provenance label ('org-reported' / 'program default') would be missing",
      );
    }
    ok(`CHW dashboard: valueSource="${dashRow.valueSource}" (provenance label present)`);

    // ── [8] org-confirm path: enrolled + benefitValueEstimate, then 409 ────────
    // Create a fresh referral, POST to its orgConfirmUrl with status="enrolled"
    // and a dollar estimate, verify resolvedAt + status in DB, then verify a
    // second POST is rejected 409 (immutability on the org-confirm path too).
    console.log("\n[8] org-confirm: enroll with value, confirm resolvedAt, then 409 on re-confirm");

    const createRes2 = await fetch(`${BASE}/api/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        programCode: "SNAP",
        orgName: "E2E Loop Verify Org",
        clientDisplayName: "E2E OrgConfirm Client",
        notes: "verify-referral-loop.ts [8] org-confirm e2e",
      }),
    });
    if (createRes2.status !== 201) {
      const body = await createRes2.text();
      fail(`[8] second POST /api/referrals returned ${createRes2.status}: ${body.slice(0, 300)}`);
    }
    const createBody2: any = await createRes2.json();
    const referralId2: string = createBody2.referral?.id;
    if (!referralId2) fail("[8] second create returned no referral.id");
    const orgConfirmUrl2: string = createBody2.orgConfirmUrl;
    if (!orgConfirmUrl2) fail("[8] second create returned no orgConfirmUrl");

    // Track for cleanup (assigned to outer-scope var so finally block can clean up)
    createdId2 = referralId2;

    // Extract the orgConfirmToken from the URL path "/org-confirm/<token>"
    const orgTokenMatch = orgConfirmUrl2.match(/\/org-confirm\/(.+)$/);
    if (!orgTokenMatch) fail(`[8] orgConfirmUrl "${orgConfirmUrl2}" does not match /org-confirm/<token>`);
    const orgConfirmToken = orgTokenMatch[1];
    ok(`[8] Created referral ${referralId2} with orgConfirmToken`);

    // POST to org-confirm endpoint
    const confirmRes = await fetch(`${BASE}/api/referrals/org-confirm/${orgConfirmToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "enrolled", benefitValueEstimate: 6000 }),
    });
    if (confirmRes.status !== 200) {
      const body = await confirmRes.text();
      fail(
        `[8] POST /api/referrals/org-confirm/${orgConfirmToken} returned ${confirmRes.status}: ${body.slice(0, 300)}`,
      );
    }
    const confirmBody: any = await confirmRes.json();
    if (confirmBody.status !== "enrolled") {
      fail(`[8] org-confirm returned status="${confirmBody.status}" (expected "enrolled")`);
    }
    ok(`[8] org-confirm → status="enrolled" ✓`);

    // Verify resolvedAt and valueSource are set in DB
    const dbRow2 = await pgClient.query(
      `SELECT status, resolved_at, benefit_value_estimate, value_source FROM referrals WHERE id = $1`,
      [referralId2],
    );
    const r2 = dbRow2.rows[0];
    if (!r2.resolved_at) {
      fail(`[8] resolvedAt is NULL after org-confirm — atomic update did not fire`);
    }
    ok(`[8] DB resolvedAt is set: ${r2.resolved_at.toISOString()}`);
    if (r2.status !== "enrolled") {
      fail(`[8] DB status="${r2.status}" after org-confirm (expected "enrolled")`);
    }
    ok(`[8] DB status="enrolled" ✓`);
    if (Number(r2.benefit_value_estimate) !== 6000) {
      fail(`[8] DB benefit_value_estimate=${r2.benefit_value_estimate} (expected 6000)`);
    }
    ok(`[8] DB benefit_value_estimate=6000 ✓`);
    if (r2.value_source !== "reported") {
      fail(`[8] DB value_source="${r2.value_source}" (expected "reported" since we provided a value)`);
    }
    ok(`[8] DB value_source="reported" (org-reported provenance) ✓`);

    // Second POST must be rejected 409 (immutability on org-confirm path)
    const confirmRes2 = await fetch(`${BASE}/api/referrals/org-confirm/${orgConfirmToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "withdrew" }),
    });
    if (confirmRes2.status !== 409) {
      fail(
        `[8] Second org-confirm returned ${confirmRes2.status} (expected 409) — ` +
          "resolved referral is not immutable on org-confirm path",
      );
    }
    ok(`[8] Second org-confirm correctly rejected 409 (immutable) ✓`);

    console.log("\n✅ All referral-loop checks passed.");
  } finally {
    // Clean up the test referral rows and user/session.
    if (createdId) {
      await pgClient
        .query(`DELETE FROM referrals WHERE id = $1`, [createdId])
        .catch((e: Error) => console.warn(`[cleanup] referral delete failed: ${e.message}`));
    }
    if (createdId2) {
      await pgClient
        .query(`DELETE FROM referrals WHERE id = $1`, [createdId2])
        .catch((e: Error) => console.warn(`[cleanup] referral2 delete failed: ${e.message}`));
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
