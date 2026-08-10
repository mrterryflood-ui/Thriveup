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
  process.exit(0);
}

run().catch((err) => {
  console.error("e2e run crashed:", err);
  process.exit(1);
});
