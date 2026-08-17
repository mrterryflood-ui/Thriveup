/**
 * Verification script: CHW visit ↔ screening FK
 *
 * Tests:
 *  1. Happy path: POST /api/chw/visits with NO clientScreeningId (free-text only)
 *  2. Happy path: POST /api/chw/visits WITH a valid clientScreeningId assigned to this CHW
 *  3. 403 path: POST /api/chw/visits with a clientScreeningId that belongs to a different CHW
 *  4. 404 path: POST /api/chw/visits with a non-existent clientScreeningId
 *  5. GET /api/chw/visits returns visits with caseRef when linked
 *
 * Cleans up its own test rows.
 */

const BASE = "http://localhost:5000";

let passed = 0;
let failed = 0;
const results: string[] = [];

function ok(label: string) {
  passed++;
  results.push(`  ✓ ${label}`);
}
function fail(label: string, detail?: string) {
  failed++;
  results.push(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

async function run() {
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } =
    await import("../tests/e2e/helpers/auth");

  const pgClient = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await pgClient.connect();

  // Use numeric-parseable IDs so the integer chw_user_id column accepts them
  const CHW_USER_ID = "88881";
  const CHW_USER_ID_B = "88882";
  let screeningIdForChwA = "";
  let visitIdFreeText = "";
  let visitIdLinked = "";

  // Cleanup from previous crashed runs
  await pgClient.query(`DELETE FROM chw_visits WHERE chw_user_id IN ($1, $2)`,
    [parseInt(CHW_USER_ID), parseInt(CHW_USER_ID_B)]).catch(() => {});
  await pgClient.query(`DELETE FROM benefits_screenings WHERE referred_to_chw_id IN ($1, $2)`,
    [CHW_USER_ID, CHW_USER_ID_B]).catch(() => {});
  await cleanupTestUser(pgClient, CHW_USER_ID).catch(() => {});
  await cleanupTestUser(pgClient, CHW_USER_ID_B).catch(() => {});

  try {
    // ── Create two CHW test users ─────────────────────────────────────────────
    await ensureTestUser(pgClient, {
      userId: CHW_USER_ID,
      email: "e2e-chw-a@test.local",
      firstName: "CHW",
      lastName: "TestA",
      role: "staff",
    });
    await ensureTestUser(pgClient, {
      userId: CHW_USER_ID_B,
      email: "e2e-chw-b@test.local",
      firstName: "CHW",
      lastName: "TestB",
      role: "staff",
    });

    // Forge sessions
    const cookieA = await forgeSession(pgClient, {
      userId: CHW_USER_ID,
      email: "e2e-chw-a@test.local",
      firstName: "CHW",
      lastName: "TestA",
    });

    // Insert a screening assigned to CHW A
    const screenRes = await pgClient.query(
      `INSERT INTO benefits_screenings
         (screening_type, referred_to_chw_id, status)
       VALUES ('SNAP', $1, 'completed')
       RETURNING id`,
      [CHW_USER_ID]
    );
    screeningIdForChwA = screenRes.rows[0].id;

    // ── [1] Happy path: free-text only (no clientScreeningId) ────────────────
    const r1 = await fetch(`${BASE}/api/chw/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        visitDate: "2025-01-15",
        visitType: "Follow-Up",
        clientDisplayName: "E2E Walk-In Client",
        durationMinutes: 30,
        notes: "Free-text visit test",
      }),
    });
    if (r1.status === 201) {
      const d1 = await r1.json();
      visitIdFreeText = d1.visit?.id ?? "";
      ok("[1] POST /api/chw/visits (free-text) → 201");
      if (!d1.visit?.clientScreeningId) ok("[1] clientScreeningId is null for free-text visit");
      else fail("[1] clientScreeningId should be null", d1.visit.clientScreeningId);
    } else {
      fail("[1] POST /api/chw/visits (free-text)", `HTTP ${r1.status}: ${await r1.text()}`);
    }

    // ── [2] Happy path: with valid clientScreeningId ──────────────────────────
    const r2 = await fetch(`${BASE}/api/chw/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        visitDate: "2025-01-16",
        visitType: "Initial Assessment",
        clientScreeningId: screeningIdForChwA,
        durationMinutes: 60,
        notes: "Linked screening visit test",
      }),
    });
    if (r2.status === 201) {
      const d2 = await r2.json();
      visitIdLinked = d2.visit?.id ?? "";
      ok("[2] POST /api/chw/visits (with valid clientScreeningId) → 201");
      if (d2.visit?.clientScreeningId === screeningIdForChwA) ok("[2] clientScreeningId stored correctly");
      else fail("[2] clientScreeningId mismatch", JSON.stringify(d2.visit?.clientScreeningId));
    } else {
      fail("[2] POST /api/chw/visits (with valid clientScreeningId)", `HTTP ${r2.status}: ${await r2.text()}`);
    }

    // ── [3] 403 path: clientScreeningId belongs to CHW A but CHW B tries it ──
    // First we need a screening assigned to CHW A, and CHW B tries to use it.
    // Forge a session for CHW B:
    const cookieB = await forgeSession(pgClient, {
      userId: CHW_USER_ID_B,
      email: "e2e-chw-b@test.local",
      firstName: "CHW",
      lastName: "TestB",
    });

    const r3 = await fetch(`${BASE}/api/chw/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({
        visitDate: "2025-01-17",
        visitType: "Follow-Up",
        clientScreeningId: screeningIdForChwA, // This screening belongs to CHW A
        notes: "Cross-CHW mismatch test",
      }),
    });
    if (r3.status === 403) {
      ok("[3] POST /api/chw/visits cross-CHW screening mismatch → 403");
    } else {
      fail("[3] Expected 403 for cross-CHW mismatch", `got HTTP ${r3.status}: ${await r3.text()}`);
    }

    // ── [4] 404 path: non-existent clientScreeningId ─────────────────────────
    const r4 = await fetch(`${BASE}/api/chw/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        visitDate: "2025-01-18",
        visitType: "Follow-Up",
        clientScreeningId: "nonexistent-screening-id-99999",
        notes: "Not-found test",
      }),
    });
    if (r4.status === 404) {
      ok("[4] POST /api/chw/visits with non-existent screeningId → 404");
    } else {
      fail("[4] Expected 404 for non-existent screeningId", `got HTTP ${r4.status}: ${await r4.text()}`);
    }

    // ── [5] GET /api/chw/visits shows caseRef for linked visit ───────────────
    const r5 = await fetch(`${BASE}/api/chw/visits`, {
      headers: { Cookie: cookieA },
    });
    if (r5.status === 200) {
      const d5 = await r5.json();
      const visits: any[] = d5.visits ?? [];
      const linkedVisit = visits.find((v: any) => v.clientScreeningId === screeningIdForChwA);
      const freeVisit = visits.find((v: any) => v.id === visitIdFreeText);

      if (linkedVisit) {
        ok("[5] GET /api/chw/visits → linked visit found");
        if (linkedVisit.caseRef && linkedVisit.caseRef.screeningId === screeningIdForChwA)
          ok("[5] Linked visit has caseRef with correct screeningId");
        else
          fail("[5] Linked visit missing/wrong caseRef", JSON.stringify(linkedVisit.caseRef));
      } else {
        fail("[5] Linked visit not found in GET response");
      }

      if (freeVisit) {
        ok("[5] GET /api/chw/visits → free-text visit found");
        if (!freeVisit.caseRef) ok("[5] Free-text visit has no caseRef (backward compat)");
        else fail("[5] Free-text visit should not have caseRef", JSON.stringify(freeVisit.caseRef));
        if (freeVisit.clientName === "E2E Walk-In Client") ok("[5] Free-text visit shows clientDisplayName as clientName");
        else fail("[5] Free-text clientName wrong", freeVisit.clientName);
      } else {
        fail("[5] Free-text visit not found in GET response");
      }
    } else {
      fail("[5] GET /api/chw/visits", `HTTP ${r5.status}`);
    }

  } finally {
    // Cleanup: remove test visits and screenings
    await pgClient.query(`DELETE FROM chw_visits WHERE chw_user_id IN ($1, $2)`,
      [parseInt(CHW_USER_ID), parseInt(CHW_USER_ID_B)]).catch(() => {});
    if (screeningIdForChwA) await pgClient.query(`DELETE FROM benefits_screenings WHERE id = $1`, [screeningIdForChwA]).catch(() => {});
    await cleanupTestUser(pgClient, CHW_USER_ID).catch(() => {});
    await cleanupTestUser(pgClient, CHW_USER_ID_B).catch(() => {});
    await pgClient.end().catch(() => {});
  }

  console.log("\nCHW Screening FK verification results:");
  results.forEach((r) => console.log(r));
  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
