import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePlacesRows, getGovernmentPlaces, readGovernmentJson, PLACES_DATASETS } from "./government-places";
import { governmentRequestSchema, governmentDraft, governmentRequestFromDraft, governmentDraftFromSearch, GOVERNMENT_RESOURCES } from "@shared/government-coordination";
import { relevantGovernmentMeasures, coordinateGovernmentEvidence } from "./government-coordination";

const row = (overrides: Record<string, unknown> = {}) => ({
  locationid: "01001", locationname: "Autauga", stateabbr: "AL",
  year: "2023", measureid: "DIABETES", measure: "Diagnosed diabetes among adults",
  category: "Health Outcomes", data_value_unit: "%", data_value_type: "Crude prevalence",
  data_value: "12.5", low_confidence_limit: "11", high_confidence_limit: "14",
  totalpop18plus: "45000", ...overrides,
});

test("geography contract enforces exact lengths, no query injection, unknown fields or role privilege", () => {
  for (const [geography, id] of [["county", "01001"], ["tract", "01001020100"], ["place", "0100100"], ["zcta", "35004"]]) {
    assert.equal(governmentRequestSchema.safeParse({ geography, id, need: "health" }).success, true);
  }
  for (const r of [
    { geography: "tract", id: "01001", need: "health" },
    { geography: "county", id: "01001' OR 1=1", need: "health" },
    { geography: "zip", id: "35004", need: "health" },
    { geography: "county", id: "01001", need: "health", role: "admin" },
    { geography: "county", id: "01001", need: "health", url: "https://untrusted.invalid" },
  ]) assert.equal(governmentRequestSchema.safeParse(r).success, false);
});

test("normalization preserves actual year, confidence interval and denominator", () => {
  const r = normalizePlacesRows([row()], "01001");
  assert.equal(r.measures[0].year, 2023);
  assert.equal(r.measures[0].value, 12.5);
  assert.equal(r.measures[0].population, 45000);
  assert.equal(r.measures[0].method, "modeled");
  assert.equal(r.measures[0].lower95, 11);
  assert.equal(r.rejectedRows, 0);
});

test("unknown future measure IDs are ingested without a hardcoded six/forty-measure allowlist", () => {
  assert.equal(normalizePlacesRows([row({ measureid: "NEW_MEASURE" })]).measures[0].id, "NEW_MEASURE");
});

test("missing/suppressed is null, not zero; observed zero remains zero", () => {
  assert.equal(normalizePlacesRows([row({ data_value: null, low_confidence_limit: null, high_confidence_limit: null, totalpop18plus: null, data_value_footnote: null })]).measures[0].value, null);
  assert.equal(normalizePlacesRows([row({ data_value: undefined, low_confidence_limit: undefined, high_confidence_limit: undefined })]).measures[0].value, null);
  assert.equal(normalizePlacesRows([row({ data_value: "0", low_confidence_limit: "0", high_confidence_limit: "0" })]).measures[0].value, 0);
});

test("invalid ranges, sentinels, partial numerics, mismatched geography and age-adjusted estimates are rejected", () => {
  for (const r of [
    row({ data_value: "12.5junk" }), row({ data_value: "-1" }), row({ data_value: "101" }),
    row({ low_confidence_limit: "15" }), row({ year: "9999" }),
    row({ locationid: "01003" }), row({ data_value_type: "Age-adjusted prevalence" }),
  ]) assert.equal(normalizePlacesRows([r], "01001").rejectedRows, 1);
});

test("latest year wins; conflicting same-year measures fail visibly", () => {
  assert.equal(normalizePlacesRows([row({ year: "2022" }), row()]).measures.length, 1);
  assert.equal(normalizePlacesRows([row(), row({ year: "2022" })]).measures[0].year, 2023);
  assert.throws(() => normalizePlacesRows([row(), row({ data_value: "13" })]), /conflicting/);
});

test("need changes prioritization without inventing measures or making personal claims", () => {
  const measures = normalizePlacesRows([
    row(), row({ measureid: "HOUSINSECU", measure: "Housing insecurity in the past 12 months", category: "Health-Related Social Needs" }),
  ]).measures;
  assert.deepEqual(relevantGovernmentMeasures(measures, "housing").map(m => m.id), ["HOUSINSECU"]);
  assert.deepEqual(relevantGovernmentMeasures(measures, "food").map(m => m.id), ["DIABETES"]);
});

test("handoff preserves county versus ZCTA; draft is validated and not an automatic action", () => {
  const request = { geography: "county", id: "48453", need: "housing", role: "resident" } as const;
  const draft = governmentDraft(request);
  assert.deepEqual(governmentRequestFromDraft(draft), request);
  assert.equal(governmentRequestFromDraft(`${draft}\n${draft}`), null);
  assert.equal(governmentRequestFromDraft("My budget is 48453"), null);
  assert.equal(governmentDraftFromSearch("?governmentGeography=county&governmentId=48453&governmentNeed=housing&governmentRole=resident"), draft);
  assert.equal(governmentDraftFromSearch("?governmentGeography=county&governmentId=48453&governmentNeed=housing&governmentRole=admin"), "");
});

test("education/recovery do not trigger irrelevant CDC fan-out; selected role does not change tool access", async () => {
  const bundle = await coordinateGovernmentEvidence({ geography: "county", id: "48453", need: "education", role: "chw" });
  assert.equal(bundle.evidence, null);
  assert.equal(bundle.error, null);
  assert.equal(bundle.tools.find(t => t.path === "/chw-dashboard")?.access, "staff");
  assert.equal(bundle.handoff.geography, "county:48453");
  assert.equal(bundle.resources.some(r => r.id === "college-scorecard"), true);
  assert.equal(bundle.resources.find(r => r.id === "fcc")?.access, "account-or-license");
  assert.equal(GOVERNMENT_RESOURCES.find(r => r.id === "data-gov")?.access, "catalog-key");
});

test("bounded reader uses exact source, live release metadata, deduplication and cache", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requests.push(url);
    assert.equal(new URL(url).hostname, "data.cdc.gov");
    return Response.json(url.includes("/api/views/")
      ? { id: PLACES_DATASETS.county, name: "PLACES County Data 2025 release", rowsUpdatedAt: 1764547200 }
      : new URL(url).searchParams.has("$select") ? [{ measureid: "DIABETES" }] : [row()]);
  }) as typeof fetch;
  try {
    const [a, b] = await Promise.all([
      getGovernmentPlaces({ geography: "county", id: "01001" }),
      getGovernmentPlaces({ geography: "county", id: "01001" }),
    ]);
    assert.equal(a.snapshot?.release, "PLACES County Data 2025 release");
    assert.equal(a.snapshot?.measures.length, 1);
    assert.equal(a.snapshot, b.snapshot);
    assert.equal(requests.length, 3);
    await getGovernmentPlaces({ geography: "county", id: "01001" });
    assert.equal(requests.length, 3);
    assert.equal(new URL(requests.find(u => u.includes("/resource/") && !new URL(u).searchParams.has("$select"))!).searchParams.get("$where"), "locationid='01001' AND data_value_type='Crude prevalence'");
    const invalid = await getGovernmentPlaces({ geography: "county", id: "bad" });
    assert.equal(invalid.snapshot, null);
    assert.equal(requests.length, 3);
    assert.equal(a.snapshot?.coverage.datasetMeasureCount, 1);
    assert.deepEqual(a.snapshot?.coverage.unavailableMeasureIds, []);
  } finally { globalThis.fetch = originalFetch; }
});

test("upstream HTTP/body failures surface and are negatively cached, not empty successful evidence", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response("down", { status: 503 }); }) as typeof fetch;
  try {
    const a = await getGovernmentPlaces({ geography: "county", id: "01003" });
    assert.equal(a.snapshot, null);
    assert.match(a.error!, /could not be retrieved/);
    await getGovernmentPlaces({ geography: "county", id: "01003" });
    assert.equal(calls, 1); // County metadata already cached by the previous test.
    globalThis.fetch = (async () => new Response("x".repeat(100))) as typeof fetch;
    await assert.rejects(readGovernmentJson("https://data.cdc.gov/resource/example.json", 1000, 10), /safe size/);
  } finally { globalThis.fetch = originalFetch; }
});

test("all four geography adapters use distinct canonical datasets", () => {
  assert.equal(new Set(Object.values(PLACES_DATASETS)).size, 4);
});

test("stalled response body is deadline-bounded and explicitly cancelled", async () => {
  const originalFetch = globalThis.fetch;
  let cancelled = false;
  globalThis.fetch = (async () => new Response(new ReadableStream({
    pull() { return new Promise(() => {}); },
    cancel() { cancelled = true; },
  }))) as typeof fetch;
  try {
    await assert.rejects(readGovernmentJson("https://data.cdc.gov/resource/example.json", 20, 1000));
    assert.equal(cancelled, true);
  } finally { globalThis.fetch = originalFetch; }
});
