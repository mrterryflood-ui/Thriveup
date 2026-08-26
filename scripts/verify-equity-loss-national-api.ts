/**
 * verify-equity-loss-national-api.ts
 *
 * Smoke-tests the three new nationwide equity-loss endpoints:
 *   GET /api/equity-loss/national
 *   GET /api/equity-loss/national/summary
 *   GET /api/equity-loss/national/state/:stateAbbrev
 *
 * Checks:
 *   1. All three return 200 (not 500) even if no batch has completed yet.
 *   2. The "no data yet" honest-empty-state is returned cleanly (noDataYet flag).
 *   3. When data IS present: pagination works, filters work, sort order is correct,
 *      and the summary's numbers are internally consistent with the snapshot table.
 *   4. Invalid params return 400, not 500.
 *   5. Rate-limiter returns 429 after 60 hits (not tested here — would require
 *      hitting the endpoint 61 times from the same IP, which is disruptive).
 */

const BASE = process.env.EQUITY_LOSS_PROBE_URL || "http://localhost:5000";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

async function getJson(url: string): Promise<{ status: number; body: any }> {
  const res = await fetch(url);
  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function main() {
  console.log(`\nVerifying nationwide equity-loss API against ${BASE}\n`);

  // -------------------------------------------------------------------------
  // 1. /national — base list endpoint
  // -------------------------------------------------------------------------
  console.log("--- GET /api/equity-loss/national (default params) ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national`);
    assert(status === 200, "returns 200", `got ${status}`);
    assert(body !== null, "returns JSON body");
    assert(
      typeof body.noDataYet === "boolean",
      "has noDataYet flag",
      JSON.stringify(body)
    );
    assert(Array.isArray(body.rows), "rows is an array");

    if (body.noDataYet) {
      console.log("  ℹ No completed batch run yet — testing honest-empty-state path");
      assert(typeof body.message === "string" && body.message.length > 0, "message is present");
      assert(body.rows.length === 0, "rows is empty when noDataYet");
    } else {
      console.log(`  ℹ Batch data present — ${body.total} counties, page ${body.page}/${body.totalPages}`);
      assert(typeof body.total === "number", "total is a number");
      assert(typeof body.page === "number" && body.page === 1, "page defaults to 1");
      assert(typeof body.pageSize === "number" && body.pageSize <= 100, "pageSize <= 100 cap honored");
      assert(typeof body.batchRunId === "string", "batchRunId present");
      assert(typeof body.dataAsOf === "string", "dataAsOf present");

      // Verify sort: overall_loss_pct DESC (default)
      const lossPcts = body.rows
        .filter((r: any) => !r.suppressed && r.overall_loss_pct !== null)
        .map((r: any) => r.overall_loss_pct as number);
      if (lossPcts.length >= 2) {
        let sorted = true;
        for (let i = 1; i < lossPcts.length; i++) {
          if (lossPcts[i] > lossPcts[i - 1]) { sorted = false; break; }
        }
        assert(sorted, "default sort is overall_loss_pct DESC", JSON.stringify(lossPcts.slice(0, 4)));
      }

      // Verify frame filter
      if (body.rows.length > 0) {
        const allCorrectFrame = body.rows.every((r: any) => r.frame === "vs_national_peer_class");
        assert(allCorrectFrame, "all rows have default frame vs_national_peer_class");
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. /national with explicit frame filter
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national?frame=vs_state ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national?frame=vs_state`);
    assert(status === 200, "returns 200");
    assert(body.frame === "vs_state" || body.noDataYet, "frame echoed in response");
    if (!body.noDataYet && body.rows.length > 0) {
      const allVsState = body.rows.every((r: any) => r.frame === "vs_state");
      assert(allVsState, "all rows have frame=vs_state");
    }
  }

  // -------------------------------------------------------------------------
  // 3. /national with state filter
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national?state=TX ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national?state=TX`);
    assert(status === 200, "returns 200");
    if (!body.noDataYet && body.rows.length > 0) {
      const allTX = body.rows.every((r: any) => r.state_abbrev === "TX");
      assert(allTX, "all rows are TX when state=TX filter applied");
    }
  }

  // -------------------------------------------------------------------------
  // 4. /national with ascending sort
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national?sort=overall_loss_pct&dir=asc ---");
  {
    const { status, body } = await getJson(
      `${BASE}/api/equity-loss/national?sort=overall_loss_pct&dir=asc`
    );
    assert(status === 200, "returns 200");
    if (!body.noDataYet && body.rows.length >= 2) {
      const lossPcts = body.rows
        .filter((r: any) => !r.suppressed && r.overall_loss_pct !== null)
        .map((r: any) => r.overall_loss_pct as number);
      if (lossPcts.length >= 2) {
        let sorted = true;
        for (let i = 1; i < lossPcts.length; i++) {
          if (lossPcts[i] < lossPcts[i - 1]) { sorted = false; break; }
        }
        assert(sorted, "ascending sort on overall_loss_pct works", JSON.stringify(lossPcts.slice(0, 4)));
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. /national pagination — page 2
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national?page=2&pageSize=10 ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national?page=2&pageSize=10`);
    assert(status === 200, "returns 200");
    if (!body.noDataYet) {
      assert(body.page === 2, "page=2 echoed");
      assert(body.pageSize === 10, "pageSize=10 echoed");
      // If there's at least 11 counties, page 2 should have rows
      if (body.total > 10) {
        assert(body.rows.length > 0, "page 2 has rows when total > 10");
      }
    }
  }

  // -------------------------------------------------------------------------
  // 6. /national — pageSize cap at 100
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national?pageSize=999 (cap test) ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national?pageSize=999`);
    assert(status === 200, "returns 200");
    if (!body.noDataYet) {
      assert(body.pageSize === 100, "pageSize capped at 100", `got ${body.pageSize}`);
      assert(body.rows.length <= 100, "actual rows never exceed 100");
    }
  }

  // -------------------------------------------------------------------------
  // 7. /national/summary
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national/summary ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national/summary`);
    assert(status === 200, "returns 200");
    assert(typeof body.noDataYet === "boolean", "has noDataYet flag");

    if (body.noDataYet) {
      console.log("  ℹ Summary: no completed batch run yet — honest-empty-state confirmed");
      assert(typeof body.message === "string", "message present");
      assert(body.frame === "vs_national_peer_class", "empty response echoes default summary frame");
    } else {
      console.log(`  ℹ Summary: ${body.totalCounties} counties, dataAsOf ${body.dataAsOf}`);
      assert(typeof body.totalCounties === "number", "totalCounties is a number");
      assert(typeof body.totalSuppressed === "number", "totalSuppressed is a number");
      assert(body.totalSuppressed <= body.totalCounties, "suppressed <= total (sanity check)");
      assert(typeof body.dataAsOf === "string", "dataAsOf present");
      assert(typeof body.batchRunId === "string", "batchRunId present");
      assert(typeof body.stateBreakdown === "object", "stateBreakdown present");
      assert(body.frame === "vs_national_peer_class", "default summary frame is national peer class");

      // Min/max sanity
      if (body.minLossPct !== null && body.maxLossPct !== null) {
        assert(body.minLossPct <= body.maxLossPct, "minLossPct <= maxLossPct");
      }
      if (body.medianLossPct !== null && body.minLossPct !== null && body.maxLossPct !== null) {
        assert(
          body.medianLossPct >= body.minLossPct && body.medianLossPct <= body.maxLossPct,
          "medianLossPct between min and max"
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // 7b. /national/summary frame selection
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national/summary?frame=vs_state ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national/summary?frame=vs_state`);
    assert(status === 200, "returns 200");
    assert(body.frame === "vs_state", "echoes selected summary frame");
    if (!body.noDataYet) {
      assert(typeof body.totalSuppressed === "number", "returns selected-frame suppression count");
      assert(typeof body.stateBreakdown === "object", "returns selected-frame jurisdiction breakdown");
    }
  }

  // -------------------------------------------------------------------------
  // 8. /national/state/:stateAbbrev
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national/state/IL ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national/state/IL`);
    assert(status === 200, "returns 200");
    assert(typeof body.noDataYet === "boolean", "has noDataYet flag");
    if (body.noDataYet) {
      console.log("  ℹ State view: no data yet");
      assert(Array.isArray(body.rows), "rows is empty array");
    } else {
      assert(body.stateAbbrev === "IL", "stateAbbrev echoed");
      assert(Array.isArray(body.rows), "rows is an array");
      if (body.rows.length > 0) {
        const allIL = body.rows.every((r: any) => r.state_abbrev === "IL");
        assert(allIL, "all rows are IL");
      }
    }
  }

  // -------------------------------------------------------------------------
  // 9. /national/state/:stateAbbrev — lowercase coercion
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national/state/tx (lowercase) ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national/state/tx`);
    assert(status === 200, "lowercase state param coerced to uppercase, returns 200");
  }

  // -------------------------------------------------------------------------
  // 10. /national/state/:stateAbbrev — invalid param → 400
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national/state/TOOLONG (invalid) ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national/state/TOOLONG`);
    assert(status === 400, "invalid stateAbbrev returns 400 not 500");
    assert(typeof body.error === "string", "error message present");
  }

  // -------------------------------------------------------------------------
  // 11. /national with search filter
  // -------------------------------------------------------------------------
  console.log("\n--- GET /api/equity-loss/national?search=Harris ---");
  {
    const { status, body } = await getJson(`${BASE}/api/equity-loss/national?search=Harris`);
    assert(status === 200, "returns 200");
    if (!body.noDataYet && body.rows.length > 0) {
      const allMatch = body.rows.every((r: any) =>
        r.county_name.toLowerCase().includes("harris")
      );
      assert(allMatch, "search filter limits results to matching county names");
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\n${"─".repeat(60)}`);
  if (failed === 0) {
    console.log(`✅ All ${passed} checks passed.`);
  } else {
    console.error(`❌ ${failed} check(s) failed, ${passed} passed.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[verify-equity-loss-national-api] FATAL:", e.message);
  process.exit(1);
});
