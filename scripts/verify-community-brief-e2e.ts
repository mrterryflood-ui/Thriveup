// End-to-end anonymous Community Impact brief gate.
//
// The flagship "no account required" Community Impact analyzer was once dead in
// production because an auth gate 401'd every anonymous visitor. The
// security-probes gate asserts the contract shape (reachable, no PII); THIS
// gate goes further and performs a FULL anonymous brief for a known ZIP against
// the running app — exercising the real Census fetch + AI narrative path — and
// fails loudly on any of the silent-breakage modes:
//
//   • 401/403  → login wall regression (the original outage)
//   • 429 loop → rate limiter starving even a single honest anonymous run
//   • 5xx      → Census/AI upstream path broken (502 = honest upstream fail)
//   • 2xx with an empty/missing narrative or missing core sections → the brief
//     "succeeds" but is hollow — exactly the silent breakage this gate exists for
//
// Run against the running dev server:  npx tsx scripts/verify-community-brief-e2e.ts
// Optional: BASE_URL=http://localhost:5000 ZIP=78660 npx tsx scripts/verify-community-brief-e2e.ts

const BASE = process.env.BASE_URL || "http://localhost:5000";
const ZIP = process.env.ZIP || "78660"; // Pflugerville, TX — known-good ZCTA
const PATH = "/api/conductor/community-brief";

// Same PII / internal-data patterns as security-probes: a full anonymous brief
// must never carry PII or the authenticated-only RPLICE intelligence block.
const PII_FIELD_PATTERN = /\b(email|phone|ssn|firstName|lastName|fullName|dateOfBirth|dob|address1|streetAddress|userId|studentId|guardianName|contactName|caseNotes)\b/i;
const INTERNAL_RPLICE_PATTERN = /"(rplice|actionPlanMilestones|outcomeBaselines|activeActionPlans|activeBaselines|interventionAssignments|assessmentCounts)"\s*:/i;

function fail(msg: string): never {
  console.error(`✗ FAIL: ${msg}`);
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postBrief(): Promise<{ status: number; text: string; retryAfter: number | null }> {
  const res = await fetch(`${BASE}${PATH}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ location: ZIP, populationSize: 10000, timeHorizon: 25 }),
  });
  const text = await res.text();
  const ra = res.headers.get("retry-after");
  return { status: res.status, text, retryAfter: ra ? parseInt(ra, 10) : null };
}

async function run() {
  console.log(`Anonymous community-brief e2e against ${BASE}${PATH} (ZIP ${ZIP})`);

  // Up to 3 attempts total. A single 429 with a sane Retry-After is honored
  // once (another gate may have just spent the per-IP budget); persistent 429s
  // are the "429-loop" failure mode and fail the gate loudly.
  const MAX_ATTEMPTS = 3;
  const MAX_WAIT_S = 120;
  let last: { status: number; text: string; retryAfter: number | null } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      last = await postBrief();
    } catch (err) {
      fail(`request error (server unreachable?): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (last.status !== 429) break;
    const wait = Math.min(last.retryAfter ?? 60, MAX_WAIT_S);
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`  429 rate-limited (attempt ${attempt}/${MAX_ATTEMPTS}); honoring Retry-After ≈ ${wait}s once...`);
      await sleep(wait * 1000);
    }
  }

  const { status, text } = last!;

  if (status === 401 || status === 403) {
    fail(`${status} — the public analyzer is behind a login wall again (the original production outage).`);
  }
  if (status === 429) {
    fail(`429-loop — anonymous caller could not complete a single brief after ${MAX_ATTEMPTS} attempts. Rate limiter is starving legitimate anonymous use.`);
  }
  if (status >= 500) {
    fail(`${status} — upstream (Census/AI narrative) path is broken: ${text.slice(0, 300)}`);
  }
  if (status < 200 || status >= 300) {
    fail(`unexpected ${status} for known-good ZIP ${ZIP}: ${text.slice(0, 300)}`);
  }

  let brief: any;
  try {
    brief = JSON.parse(text);
  } catch {
    fail(`200 but response is not valid JSON: ${text.slice(0, 200)}`);
  }

  // Core sections a real full brief must carry.
  const missing: string[] = [];
  if (typeof brief.narrative !== "string" || brief.narrative.trim().length < 200) {
    missing.push(`narrative (got ${typeof brief.narrative === "string" ? `${brief.narrative.trim().length} chars` : typeof brief.narrative} — AI narrative path is broken or hollow)`);
  }
  if (typeof brief.overallScore !== "number") missing.push("overallScore");
  if (!brief.systemsScores || typeof brief.systemsScores !== "object" || Object.keys(brief.systemsScores).length === 0) missing.push("systemsScores");
  if (!brief.demographics || typeof brief.demographics.povertyRate !== "number") missing.push("demographics.povertyRate (real Census data)");
  if (!brief.solutions || !Array.isArray(brief.solutions.grants)) missing.push("solutions.grants");
  if (!brief.generatedAt) missing.push("generatedAt");
  if (missing.length > 0) {
    fail(`200 but the brief is hollow — missing/invalid: ${missing.join("; ")}`);
  }

  // Anonymous responses must never carry PII or the internal RPLICE block.
  const pii = text.match(PII_FIELD_PATTERN);
  if (pii) fail(`anonymous brief contains a PII-looking field: ${pii[0]}`);
  const rplice = text.match(INTERNAL_RPLICE_PATTERN);
  if (rplice) fail(`anonymous brief leaks the internal RPLICE block: ${rplice[0]}`);

  console.log(`✓ PASS: full anonymous brief for ${ZIP} → 200; narrative ${brief.narrative.trim().length} chars; ${Object.keys(brief.systemsScores).length} systems scores; poverty rate ${brief.demographics.povertyRate}%; no PII; no internal RPLICE block.`);

  // ── Authed positive contract + public-share strip contract ────────────────
  // 1. An AUTHENTICATED analyst must receive the RPLICE block (the feature).
  // 2. Sharing that authed brief through the public share endpoint must strip
  //    the block server-side, so a share link can never exfiltrate it.
  // Uses the forged-session helper (real sessions-table row + signed cookie).
  await runAuthedAndShareChecks();
  process.exit(0);
}

async function runAuthedAndShareChecks() {
  const { Client } = await import("pg");
  const { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } = await import(
    "../tests/e2e/helpers/auth"
  );

  const db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await db.connect();
  const user = { userId: "e2e-brief-rplice", email: "e2e-brief-rplice@test.local" };
  try {
    await ensureTestUser(db, user);
    const cookie = await forgeSession(db, user);

    // Authed brief: same ZIP is now cached, so this is a cheap cache-hit; the
    // RPLICE block is attached per-response, never cached, so it must appear.
    // The anonymous run above may have spent the per-IP rate budget, so honor
    // Retry-After up to twice before failing.
    let res!: Response;
    let authedText = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      res = await fetch(`${BASE}${PATH}`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ location: ZIP, populationSize: 10000, timeHorizon: 25 }),
      });
      authedText = await res.text();
      if (res.status !== 429) break;
      const wait = Math.min(parseInt(res.headers.get("retry-after") ?? "60", 10) || 60, 120);
      if (attempt < 3) {
        console.warn(`  429 on authed brief (attempt ${attempt}/3); waiting ≈ ${wait}s...`);
        await sleep(wait * 1000);
      }
    }
    if (!res.ok) fail(`authed brief request failed with ${res.status}: ${authedText.slice(0, 200)}`);
    let authedBrief: any;
    try {
      authedBrief = JSON.parse(authedText);
    } catch {
      fail(`authed brief 200 but response is not valid JSON`);
    }
    if (!("rplice" in authedBrief)) {
      fail(`authenticated brief is missing the RPLICE research block — signed-in analysts lost their research-grade detail.`);
    }
    console.log(`✓ PASS: authenticated brief carries the RPLICE block (rplice ${authedBrief.rplice === null ? "null (upstream unavailable — key present)" : "populated"}).`);

    // Share the authed brief (rplice and all) — the server must strip it.
    const shareRes = await fetch(`${BASE}/api/conductor/community-brief/share`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(authedBrief),
    });
    if (shareRes.status === 429) {
      console.warn(`  ? share endpoint rate-limited (429) this run — strip contract also asserted by security-probes.`);
      return;
    }
    if (!shareRes.ok) fail(`share POST failed with ${shareRes.status}`);
    const { shareId } = (await shareRes.json()) as { shareId: string };
    const getRes = await fetch(`${BASE}/api/conductor/community-brief/share/${shareId}`);
    const sharedText = await getRes.text();
    if (!getRes.ok) fail(`share GET failed with ${getRes.status}`);
    const leak = sharedText.match(INTERNAL_RPLICE_PATTERN);
    if (leak) {
      fail(`publicly shared brief leaks the internal RPLICE block (${leak[0]}) — share links are an anonymous exfiltration path.`);
    }
    console.log(`✓ PASS: public share retrieval of an authed brief carries NO internal RPLICE data (stripped server-side).`);

    // Legacy-row regression: rows written BEFORE the POST-side strip existed
    // may carry rplice. Seed one directly and assert the public GET strips it
    // (and scrubs the stored row).
    const legacyId = `lgcy${Date.now().toString(36)}`.slice(0, 8);
    await db.query(
      `INSERT INTO brief_shares (id, location, brief_data, created_at, expires_at)
       VALUES ($1, $2, $3, now(), now() + interval '1 day')`,
      [legacyId, "Legacy Probe, TX", JSON.stringify({ geography: { displayName: "Legacy Probe, TX" }, overallScore: 42, rplice: { reasoning: "legacy", assessmentCounts: { cfir: 1 } } })]
    );
    try {
      const legacyRes = await fetch(`${BASE}/api/conductor/community-brief/share/${legacyId}`);
      const legacyText = await legacyRes.text();
      if (!legacyRes.ok) fail(`legacy share GET failed with ${legacyRes.status}`);
      const legacyLeak = legacyText.match(INTERNAL_RPLICE_PATTERN);
      if (legacyLeak) {
        fail(`legacy stored share row leaks the internal RPLICE block (${legacyLeak[0]}) — GET must strip defensively.`);
      }
      console.log(`✓ PASS: legacy share row with stored rplice is stripped on public retrieval.`);
    } finally {
      await db.query(`DELETE FROM brief_shares WHERE id = $1`, [legacyId]).catch(() => {});
    }
  } finally {
    await cleanupTestUser(db, user.userId).catch(() => {});
    await db.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error("e2e run crashed:", err);
  process.exit(1);
});
