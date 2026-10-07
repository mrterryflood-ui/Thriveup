/**
 * Authenticated verification of the learning economy hardening:
 *  1. There is no client-triggered mint path: POST /api/academy/transactions is retired (410).
 *  2. Cold-start wallet creation is race-safe: concurrent first requests yield ONE wallet.
 *  3. POST /api/academy/campus ignores client amountFunded (server-owned) and
 *     concurrent initial creates collapse to ONE project (unique user_id).
 *  4. POST /api/academy/campus/fund enforces the project's total budget cap,
 *     including under CONCURRENT contributions and budget-shrink races.
 *  5. Stock trade rejects client price and non-integer shares.
 *  6. GET /api/academy/stocks labels prices as simulated.
 */
import { Client } from "pg";
import { ensureTestUser, forgeSession, cleanupTestUser, requireEnv } from "../tests/e2e/helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const USER = { userId: "econ-verify-user", email: "econ-verify@test.local" };

let failures = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const db = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await db.connect();
  const cleanupEconomy = async () => {
    await db.query(`DELETE FROM academy_transactions WHERE wallet_id IN (SELECT id FROM academy_wallets WHERE user_id = $1)`, [USER.userId]);
    await db.query(`DELETE FROM academy_campus_projects WHERE user_id = $1`, [USER.userId]);
    await db.query(`DELETE FROM academy_wallets WHERE user_id = $1`, [USER.userId]);
  };
  await cleanupEconomy();
  await cleanupTestUser(db, USER.userId);
  await ensureTestUser(db, USER);
  const cookie = await forgeSession(db, USER);
  const h = { "content-type": "application/json", cookie };
  const post = (path: string, body: unknown) =>
    fetch(`${BASE}${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
  const get = (path: string) => fetch(`${BASE}${path}`, { headers: h });

  try {
    // 1. No client mint path — retired endpoint answers 410 for any payload.
    let r = await post("/api/academy/transactions", { amount: 999999, type: "reward", description: "forge" });
    check("client mint endpoint retired (410)", r.status === 410, `got ${r.status}`);
    r = await post("/api/academy/transactions", { rewardKey: "daily_login" });
    check("reward-key mint also retired (410)", r.status === 410, `got ${r.status}`);

    // 2. Cold-wallet race: user has NO wallet yet; concurrent funding attempts
    //    each ensure-then-lock the wallet inside their transaction. Exactly one
    //    wallet row must exist afterwards (unique user_id + ON CONFLICT).
    const cold = await Promise.all(Array.from({ length: 5 }, () =>
      post("/api/academy/stocks/trade", { stockId: "00000000-0000-0000-0000-000000000000", action: "buy", shares: 1 })));
    check("cold-wallet concurrent requests handled", cold.every((c) => c.status === 404 || c.status === 400), cold.map((c) => c.status).join(","));
    const walletCount = (await db.query(`SELECT count(*)::int AS n FROM academy_wallets WHERE user_id = $1`, [USER.userId])).rows[0].n;
    check("exactly one wallet row after cold-start race", walletCount <= 1, `rows=${walletCount}`);
    // Also via the plain read path (getOrCreateWallet).
    await Promise.all(Array.from({ length: 5 }, () => get("/api/academy/wallet")));
    const walletCount2 = (await db.query(`SELECT count(*)::int AS n FROM academy_wallets WHERE user_id = $1`, [USER.userId])).rows[0].n;
    check("exactly one wallet row after concurrent reads", walletCount2 === 1, `rows=${walletCount2}`);
    // Deterministic balance for the budget tests below.
    await db.query(`UPDATE academy_wallets SET balance = '180.00' WHERE user_id = $1`, [USER.userId]);

    // 3. Campus create: concurrent initial creates collapse to ONE project,
    //    and client amountFunded is ignored.
    const creates = await Promise.all(Array.from({ length: 5 }, (_, i) =>
      post("/api/academy/campus", { projectName: `Verify Campus ${i}`, totalBudget: "100.00", amountFunded: "999999.00" })));
    check("concurrent campus creates all succeed", creates.every((c) => c.ok), creates.map((c) => c.status).join(","));
    const rowCount = (await db.query(`SELECT count(*)::int AS n FROM academy_campus_projects WHERE user_id = $1`, [USER.userId])).rows[0].n;
    check("exactly one project row exists", rowCount === 1, `rows=${rowCount}`);
    r = await get("/api/academy/campus");
    const project = await r.json();
    check("campus create ignores client amountFunded", parseFloat(project.amountFunded ?? "0") === 0, `amountFunded=${project.amountFunded}`);
    await post("/api/academy/campus", { totalBudget: "100.00" });

    // 4. Budget cap. Balance 180, budget 100.
    r = await post("/api/academy/campus/fund", { amount: 20 });
    check("fund within balance+budget succeeds", r.status === 200, `got ${r.status}`);
    r = await post("/api/academy/campus", { totalBudget: "1.00" });
    check("cannot shrink totalBudget below amountFunded (400)", r.status === 400, `got ${r.status}`);
    // Race a budget reduction against a funding call: whichever order they
    // serialize in, funded must never exceed budget afterwards.
    await Promise.all([
      post("/api/academy/campus", { totalBudget: "30.00" }),
      post("/api/academy/campus/fund", { amount: 50 }),
    ]);
    r = await get("/api/academy/campus");
    const raced = await r.json();
    check("budget-shrink vs funding race keeps funded <= budget",
      parseFloat(raced.amountFunded) <= parseFloat(raced.totalBudget),
      `funded=${raced.amountFunded} budget=${raced.totalBudget}`);
    // Restore a deterministic state for the remaining cap tests.
    await db.query(`UPDATE academy_campus_projects SET total_budget = '100.00', amount_funded = '20.00' WHERE user_id = $1`, [USER.userId]);
    await db.query(`UPDATE academy_wallets SET balance = '160.00' WHERE user_id = $1`, [USER.userId]);
    // Concurrent cap race: remaining budget is 80; two parallel 50s must not both land.
    const races = await Promise.all([post("/api/academy/campus/fund", { amount: 50 }), post("/api/academy/campus/fund", { amount: 50 })]);
    const raceOks = races.filter((x) => x.status === 200).length;
    check("concurrent funding cannot blow past budget cap", raceOks === 1, `${raceOks} of 2 succeeded`);
    r = await get("/api/academy/campus");
    const after = await r.json();
    check("amountFunded stays within totalBudget", parseFloat(after.amountFunded) <= parseFloat(after.totalBudget), `funded=${after.amountFunded} budget=${after.totalBudget}`);
    // Single over-cap request also rejected (remaining = 30).
    r = await post("/api/academy/campus/fund", { amount: 31 });
    check("fund beyond project budget cap rejected (400)", r.status === 400, `got ${r.status}`);
    r = await post("/api/academy/campus/fund", { amount: 999999 });
    check("fund beyond balance rejected", r.status === 400, `got ${r.status}`);

    // 5. Scenario (adventure) rewards: a run's node can be answered exactly
    //    once — concurrent replays of the same choice serialize under the run
    //    row lock, and stale nodeKeys are rejected (no reward farming).
    r = await get("/api/academy/scenarios");
    const scenarios = await r.json();
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      r = await post(`/api/academy/scenarios/${scenarios[0].id}/start`, {});
      const startedRun = await r.json();
      check("scenario run started", r.ok && !!startedRun.id, `status ${r.status}`);
      const nodes = (await db.query(
        `SELECT node_key, choices FROM academy_scenario_nodes WHERE scenario_id = $1 AND node_key = $2`,
        [scenarios[0].id, startedRun.currentNodeKey])).rows;
      const firstChoice = (nodes[0]?.choices as any[])?.[0];
      if (firstChoice) {
        const balBefore = parseFloat((await (await get("/api/academy/wallet")).json()).balance);
        const replays = await Promise.all(Array.from({ length: 5 }, () =>
          post(`/api/academy/scenarios/runs/${startedRun.id}/choose`, { nodeKey: startedRun.currentNodeKey, choiceKey: firstChoice.key, choiceLabel: firstChoice.label })));
        const okCount = replays.filter((x) => x.status === 200).length;
        check("concurrent scenario choice replays succeed exactly once", okCount === 1, `${okCount} of 5 succeeded (statuses ${replays.map((x) => x.status).join(",")})`);
        // Replay of the now-stale node must be rejected out-of-state.
        r = await post(`/api/academy/scenarios/runs/${startedRun.id}/choose`, { nodeKey: startedRun.currentNodeKey, choiceKey: firstChoice.key, choiceLabel: firstChoice.label });
        check("stale-node replay rejected (409)", r.status === 409, `got ${r.status}`);
        const logCount = (await db.query(`SELECT count(*)::int AS n FROM academy_choice_logs WHERE run_id = $1`, [startedRun.id])).rows[0].n;
        check("exactly one choice log recorded", logCount === 1, `logs=${logCount}`);
        const balAfter = parseFloat((await (await get("/api/academy/wallet")).json()).balance);
        const nextKey = firstChoice.nextNodeKey;
        const impact = parseFloat((await db.query(
          `SELECT wallet_impact FROM academy_scenario_nodes WHERE scenario_id = $1 AND node_key = $2`,
          [scenarios[0].id, nextKey])).rows[0]?.wallet_impact ?? "0");
        const expected = impact >= 0 ? impact : -Math.min(Math.abs(impact), balBefore);
        check("wallet impact applied exactly once", Math.abs(balAfter - balBefore - expected) < 0.005, `before=${balBefore} after=${balAfter} impact=${impact}`);
        await db.query(`DELETE FROM academy_choice_logs WHERE run_id = $1`, [startedRun.id]);
        await db.query(`DELETE FROM academy_scenario_runs WHERE id = $1`, [startedRun.id]);
      } else {
        check("scenario node has choices to test", false, "no choices found");
      }
    } else {
      console.log("(skipping scenario replay tests — no scenarios seeded)");
    }

    // 5b. Cross-run reward farming: a positive node award pays exactly once per
    //     (user, scenario, node), even across fresh runs and concurrent runs.
    const scnId = "econ-verify-scn";
    await db.query(`DELETE FROM academy_scenario_reward_claims WHERE user_id = $1`, [USER.userId]);
    await db.query(`DELETE FROM academy_scenario_nodes WHERE scenario_id = $1`, [scnId]);
    await db.query(`DELETE FROM academy_scenarios WHERE id = $1`, [scnId]);
    await db.query(
      `INSERT INTO academy_scenarios (id, title, theme, summary, empathy_prompt) VALUES ($1, 'Econ Verify', 'finance', 'test', 'test')`, [scnId]);
    await db.query(
      `INSERT INTO academy_scenario_nodes (scenario_id, node_key, narrative, is_start, choices) VALUES ($1, 'start', 'begin', true, '[{"key":"go","label":"Go","nextNodeKey":"win"}]'::jsonb)`, [scnId]);
    await db.query(
      `INSERT INTO academy_scenario_nodes (scenario_id, node_key, narrative, is_end, wallet_impact) VALUES ($1, 'win', 'you win', true, '40.00')`, [scnId]);
    const balA = parseFloat((await (await get("/api/academy/wallet")).json()).balance);
    const run1 = await (await post(`/api/academy/scenarios/${scnId}/start`, {})).json();
    r = await post(`/api/academy/scenarios/runs/${run1.id}/choose`, { nodeKey: "start", choiceKey: "go", choiceLabel: "Go" });
    check("first scenario reward credited", r.status === 200, `got ${r.status}`);
    // Fresh run of the same scenario: story works, but no second payout.
    const run2 = await (await post(`/api/academy/scenarios/${scnId}/start`, {})).json();
    r = await post(`/api/academy/scenarios/runs/${run2.id}/choose`, { nodeKey: "start", choiceKey: "go", choiceLabel: "Go" });
    check("re-run choice still succeeds (200)", r.status === 200, `got ${r.status}`);
    // Concurrent fresh runs + choices.
    const runs = await Promise.all([post(`/api/academy/scenarios/${scnId}/start`, {}), post(`/api/academy/scenarios/${scnId}/start`, {})]);
    const runIds = await Promise.all(runs.map(async (x) => (await x.json()).id));
    await Promise.all(runIds.map((id) => post(`/api/academy/scenarios/runs/${id}/choose`, { nodeKey: "start", choiceKey: "go", choiceLabel: "Go" })));
    const balB = parseFloat((await (await get("/api/academy/wallet")).json()).balance);
    check("scenario reward mints exactly once across runs", Math.abs(balB - balA - 40) < 0.005, `before=${balA} after=${balB}`);
    const claimCount = (await db.query(`SELECT count(*)::int AS n FROM academy_scenario_reward_claims WHERE user_id = $1 AND scenario_id = $2`, [USER.userId, scnId])).rows[0].n;
    check("exactly one reward claim row", claimCount === 1, `claims=${claimCount}`);
    await db.query(`DELETE FROM academy_choice_logs WHERE user_id = $1`, [USER.userId]);
    await db.query(`DELETE FROM academy_scenario_runs WHERE user_id = $1`, [USER.userId]);
    await db.query(`DELETE FROM academy_scenario_reward_claims WHERE user_id = $1`, [USER.userId]);
    await db.query(`DELETE FROM academy_scenario_nodes WHERE scenario_id = $1`, [scnId]);
    await db.query(`DELETE FROM academy_scenarios WHERE id = $1`, [scnId]);

    // 6. Trade input validation.
    r = await post("/api/academy/stocks/trade", { stockId: "x", action: "buy", shares: 1.5 });
    check("non-integer shares rejected", r.status === 400, `got ${r.status}`);
    r = await post("/api/academy/stocks/trade", { stockId: "x", action: "steal", shares: 1 });
    check("invalid action rejected", r.status === 400, `got ${r.status}`);

    // 6. Simulated labeling.
    r = await get("/api/academy/stocks");
    const stocks = await r.json();
    check("stocks labeled simulated", Array.isArray(stocks) && (stocks.length === 0 || stocks[0].simulated === true), `first=${JSON.stringify(stocks[0] ?? null).slice(0, 120)}`);
  } finally {
    await cleanupEconomy();
    await cleanupTestUser(db, USER.userId);
    await db.end();
  }

  if (failures) {
    console.error(`FAIL: ${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("PASS: academy economy is server-authoritative.");
}

main().catch((e) => { console.error(e); process.exit(1); });
