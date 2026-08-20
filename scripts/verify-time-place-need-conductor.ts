import assert from "node:assert/strict";
import express from "express";
import { registerTimePlaceNeedConductorRoutes } from "../server/time-place-need-conductor";

async function post(base: string, body: unknown) {
  return fetch(`${base}/api/conductor/time-place-need`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function main() {
  const app = express();
  app.use(express.json());
  registerTimePlaceNeedConductorRoutes(app);
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const malformed = await post(base, {
      location: "ZZ",
      need: { category: "heat" },
      liveResearch: false,
    });
    assert.equal(malformed.status, 400);

    const nonexistentZip = await post(base, {
      location: "99999",
      need: { category: "heat" },
      liveResearch: false,
    });
    assert.equal(nonexistentZip.status, 400);

    const response = await post(base, {
      location: "Austin, TX",
      need: {
        category: "cooling",
        urgency: "urgent",
        description: "Find a cooling center today",
      },
      liveResearch: false,
    });
    assert.equal(response.status, 200);
    const result = await response.json() as any;

    assert.equal(result.contract, "time-place-need/v1");
    assert.equal(result.place.resolved.state, "TX");
    assert.equal(result.place.resolved.countyFips, "48453");
    assert.match(result.time.localDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(result.time.localTime, /^\d{2}:\d{2}$/);
    assert.ok(["winter", "spring", "summer", "fall"].includes(result.time.season));
    assert.equal(result.liveLocalResearch.status, "not-requested");
    assert.ok(["available", "unavailable"].includes(result.outcomeSnapshot.status));
    assert.ok(result.enginePlan.requestedDomains.includes("health"));
    assert.ok(result.enginePlan.requestedDomains.includes("roi-causal"));
    assert.deepEqual(result.enginePlan.executedEngineIds, ["chainweb-engine"]);
    assert.ok(Array.isArray(result.chainwebOutcomeContext));
    assert.ok(Array.isArray(result.localResources.disclosures));

    for (const partner of result.localResources.localPartners) {
      assert.equal("contactEmail" in partner, false);
      assert.equal("contactName" in partner, false);
      assert.equal(partner.capacity, null);
      assert.equal(partner.capacityStatus, "unknown");
    }
    for (const fact of result.chainwebOutcomeContext) {
      assert.deepEqual(Object.keys(fact.data || {}).sort(), [
        "evidenceAvailable",
        "evidenceType",
        "geographyScope",
      ]);
    }

    console.log("time-place-need conductor HTTP contract: PASS");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});