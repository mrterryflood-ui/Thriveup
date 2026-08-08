/**
 * Concurrency test for trade certificate issuance.
 *
 * Asserts the (user_id, source_key) unique index + onConflictDoNothing keeps
 * both issuance paths race-safe:
 *  A) N concurrent final-lesson completion POSTs → exactly 1 certificate
 *  B) N concurrent transcript GETs (lazy issuance) → exactly 1 certificate,
 *     carrying the learner's real name (not "Learner")
 *
 * Run: node tests/cert-issuance-concurrency.mjs  (server must be on :5000)
 */
import { Client } from "pg";
import crypto from "crypto";

const BASE = "http://127.0.0.1:5000";
const userId = "e2e-cert-race-user";
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const fail = (msg) => { console.error("FAIL:", msg); process.exitCode = 1; };
const cleanup = async () => {
  await db.query(`DELETE FROM trade_sims_lesson_progress WHERE user_id=$1`, [userId]);
  await db.query(`DELETE FROM certificates WHERE user_id=$1`, [userId]);
  await db.query(`DELETE FROM outcome_tracking WHERE user_id=$1`, [userId]);
  await db.query(`DELETE FROM sessions WHERE sess->'passport'->'user'->'claims'->>'sub'=$1`, [userId]);
  await db.query(`DELETE FROM academy_avatars WHERE user_id=$1`, [userId]);
  await db.query(`DELETE FROM users WHERE id=$1`, [userId]);
};
await cleanup();

await db.query(
  `INSERT INTO users (id, email, first_name, last_name) VALUES ($1,$2,$3,$4)`,
  [userId, "race@test.local", "Rae", "Certsworth"]
);
// forge session (same approach as tests/e2e/helpers/auth.ts)
const sid = crypto.randomBytes(24).toString("hex");
const expires = new Date(Date.now() + 3600000);
await db.query(`INSERT INTO sessions (sid, sess, expire) VALUES ($1,$2,$3)`, [sid, JSON.stringify({
  cookie: { originalMaxAge: 3600000, expires: expires.toISOString(), secure: true, httpOnly: true, path: "/" },
  passport: { user: { claims: { sub: userId, email: "race@test.local", first_name: "Rae", last_name: "Certsworth" }, expires_at: Math.floor(expires.getTime()/1000) } },
}), expires]);
const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(sid).digest("base64").replace(/=+$/, "");
const cookie = `connect.sid=${encodeURIComponent("s:" + sid + "." + sig)}`;

const { rows: lessons } = await db.query(
  `SELECT l.id FROM trade_sims_lessons l JOIN trade_sims_trades t ON l.trade_id=t.id
   WHERE t.slug='electrical' AND l.active ORDER BY l.day_number`);
if (lessons.length < 2) { fail("need electrical lessons seeded"); process.exit(1); }
const finalLesson = lessons[lessons.length - 1].id;

// ── Scenario A: complete all but the last lesson in DB, then race the final POST ──
await db.query(
  `INSERT INTO trade_sims_lesson_progress (user_id, lesson_id, status, attempt_count)
   SELECT $1, l.id, 'completed', 1 FROM trade_sims_lessons l WHERE l.id = ANY($2::int[])`,
  [userId, lessons.slice(0, -1).map(l => l.id)]);

const N = 6;
// Note: concurrent duplicate POSTs may 500 on the progress table's own
// unique index (pre-existing check-then-insert upsert; separate concern).
// This test's invariant is the CERTIFICATE count: at least one completion
// must land, and no matter how many events fire, exactly one cert exists.
const statuses = await Promise.all(Array.from({ length: N }, () =>
  fetch(`${BASE}/api/trade-sims/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ lessonId: finalLesson, status: "completed" }),
  }).then(r => r.status)));
if (!statuses.includes(200)) fail(`no progress POST succeeded: ${statuses.join(",")}`);
// learner events fire async (void fireLearnerEvent) — give them a moment
await new Promise(r => setTimeout(r, 3000));

let { rows: [a] } = await db.query(
  `SELECT count(*)::int AS n, min(user_name) AS name FROM certificates WHERE user_id=$1`, [userId]);
if (a.n !== 1) fail(`Scenario A: expected exactly 1 certificate after ${N} concurrent completions, got ${a.n}`);
else console.log("PASS A: concurrent final-lesson completions issued exactly 1 certificate");
if (a.name !== "Rae Certsworth") fail(`Scenario A: normal completion cert must carry the real name, got "${a.name}"`);
else console.log("PASS A2: normal-completion certificate carries the learner's real name:", a.name);

// ── Scenario B: wipe cert, race N concurrent transcript GETs (lazy issuance) ──
await db.query(`DELETE FROM certificates WHERE user_id=$1`, [userId]);
await Promise.all(Array.from({ length: N }, () =>
  fetch(`${BASE}/api/trade-sims/transcript/electrical`, { headers: { cookie } })
    .then(r => r.json())
    .then(d => { if (!d.certificate) fail("transcript returned no certificate"); })));
const { rows: [b] } = await db.query(
  `SELECT count(*)::int AS n, min(user_name) AS name, min(source_key) AS sk FROM certificates WHERE user_id=$1`, [userId]);
if (b.n !== 1) fail(`Scenario B: expected exactly 1 certificate after ${N} concurrent transcript GETs, got ${b.n}`);
else console.log("PASS B: concurrent transcript GETs lazily issued exactly 1 certificate");
if (b.name !== "Rae Certsworth") fail(`Scenario B: expected real learner name, got "${b.name}"`);
else console.log("PASS B2: certificate carries the learner's real name:", b.name);
if (b.sk !== "trade-sim:electrical") fail(`Scenario B: expected source_key trade-sim:electrical, got "${b.sk}"`);
else console.log("PASS B3: source_key =", b.sk);

// ── Scenario C: legacy cert (NULL source_key) is claimed, not duplicated ──
await db.query(`DELETE FROM certificates WHERE user_id=$1`, [userId]);
await db.query(
  `INSERT INTO certificates (user_id, user_name, level_id, level_title, source_key)
   VALUES ($1, 'Learner', 1, 'Electrical Trade Certification', NULL)`, [userId]);
const legacyResp = await (await fetch(`${BASE}/api/trade-sims/transcript/electrical`, { headers: { cookie } })).json();
const { rows: [c] } = await db.query(
  `SELECT count(*)::int AS n, min(user_name) AS name, min(source_key) AS sk FROM certificates WHERE user_id=$1`, [userId]);
if (c.n !== 1) fail(`Scenario C: legacy cert should be claimed, not duplicated — got ${c.n} rows`);
else console.log("PASS C: legacy NULL-source_key certificate was claimed, not duplicated");
if (c.sk !== "trade-sim:electrical" || c.name !== "Rae Certsworth")
  fail(`Scenario C: claim should backfill source_key + real name, got sk="${c.sk}" name="${c.name}"`);
else console.log("PASS C2: claim backfilled source_key and repaired placeholder name");

// ── Scenario C3: TWO legacy NULL-source_key duplicates — claim one, retire the other ──
await db.query(`DELETE FROM certificates WHERE user_id=$1`, [userId]);
await db.query(
  `INSERT INTO certificates (user_id, user_name, level_id, level_title, source_key, issued_at)
   VALUES ($1,'Learner',1,'Electrical Trade Certification',NULL, now() - interval '2 days'),
          ($1,'Learner',1,'Electrical Trade Certification',NULL, now() - interval '1 day')`, [userId]);
const dupResp = await fetch(`${BASE}/api/trade-sims/transcript/electrical`, { headers: { cookie } });
const dupData = await dupResp.json();
if (dupResp.status !== 200 || !dupData.certificate) fail(`Scenario C3: transcript with duplicate legacy certs must succeed, got ${dupResp.status}`);
const { rows: dup } = await db.query(
  `SELECT source_key, user_name, issued_at FROM certificates WHERE user_id=$1 ORDER BY issued_at`, [userId]);
if (dup.length !== 2) fail(`Scenario C3: legacy rows must be preserved, got ${dup.length}`);
if (dup[0].source_key !== "trade-sim:electrical" || dup[0].user_name !== "Rae Certsworth")
  fail(`Scenario C3: EARLIEST legacy row should be claimed with real name, got ${JSON.stringify(dup[0])}`);
else if (dup[1].source_key !== null)
  fail(`Scenario C3: the later duplicate should stay retired (NULL source_key), got ${dup[1].source_key}`);
else console.log("PASS C3: with two legacy duplicates, earliest is claimed, other retired, transcript 200");
const dupVerify = await (await fetch(`${BASE}/api/trade-sims/verify/${dupData.certificate.id}`)).json();
if (!dupVerify.valid) fail("Scenario C3: claimed duplicate-legacy cert must verify publicly");
else console.log("PASS C4: claimed certificate verifies publicly");
// idempotent: a second transcript GET must not touch the retired row
await fetch(`${BASE}/api/trade-sims/transcript/electrical`, { headers: { cookie } });
const { rows: [c5] } = await db.query(
  `SELECT count(*)::int AS keyed FROM certificates WHERE user_id=$1 AND source_key IS NOT NULL`, [userId]);
if (c5.keyed !== 1) fail(`Scenario C3: repeat transcript GET must keep exactly 1 keyed cert, got ${c5.keyed}`);
else console.log("PASS C5: repeat request keeps exactly one keyed certificate");

// ── Scenario D: public verification link works from a clean context (no cookies) ──
const certId = dupData.certificate?.id; // C3's claimed cert is the surviving keyed one
if (!certId) fail("Scenario D: transcript did not return a certificate id");
const v = await (await fetch(`${BASE}/api/trade-sims/verify/${certId}`)).json(); // NO auth headers
if (!v.valid || v.certificate?.holderName !== "Rae Certsworth" || v.tradeSlug !== "electrical")
  fail(`Scenario D: public verify must show the HOLDER's record without auth, got ${JSON.stringify(v).slice(0, 200)}`);
else console.log("PASS D: public verify endpoint resolves the holder's transcript with no auth");
if (!(v.summary?.completedLessons >= 1) || !/NOT an industry certification/.test(v.disclaimer ?? ""))
  fail("Scenario D: verify payload missing evidence or disclaimer");
else console.log("PASS D2: verify payload carries lesson evidence and the anti-fabrication disclaimer");
const bogus = await fetch(`${BASE}/api/trade-sims/verify/00000000-0000-0000-0000-000000000000`);
if (bogus.status !== 404) fail(`Scenario D: bogus certificate id should 404, got ${bogus.status}`);
else console.log("PASS D3: unknown certificate id returns 404");

await cleanup();
await db.end();
console.log(process.exitCode ? "RESULT: FAIL" : "RESULT: ALL PASS");
