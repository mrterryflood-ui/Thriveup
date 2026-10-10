import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HUTTO_PLACE, isHuttoPlace } from "../../shared/places/hutto";
import { describeJourneyPlace, placeToZip, parseJourneyContext } from "../../shared/journey-context";
import { HUTTO_FACTS, HUTTO_JOURNEY, HUTTO_ORCHESTRATION, HUTTO_READY_LINKS, HUTTO_READY_TITLE, HUTTO_STAKEHOLDERS } from "../../shared/hutto-ready";
import { resolvePlace } from "../community-banks/profile";

const SPEC_INPUTS = ["Hutto", "hutto", "Hutto, TX", "Hutto, Texas", "Hutto TX", "78634", "Hutto ISD", "Hutto Independent School District"];

test("every spec input resolves to Hutto by name", () => {
  for (const input of SPEC_INPUTS) {
    assert.equal(isHuttoPlace(input), true, input);
    const place = parseJourneyContext(`?place=${encodeURIComponent(input)}`).place;
    assert.equal(place, input, `journey context keeps ${input}`);
    assert.equal(describeJourneyPlace(input), "Hutto, TX (78634)", input);
    assert.equal(placeToZip(input), "78634", input);
  }
});

// resolvePlace() backs both /api/community-banks/profile and /api/community-gravity/map.
// The Hutto branch returns before any DB or network lookup, so this runs without Postgres.
test("server resolvePlace() resolves every spec input to Hutto, Williamson County", async () => {
  for (const input of SPEC_INPUTS) {
    const result = await resolvePlace(input);
    assert.equal(result.ok, true, input);
    if (!result.ok) continue;
    assert.equal(result.geography.label, "Hutto, TX (78634) · Williamson County", input);
    assert.equal(result.geography.state, "TX", input);
    assert.deepEqual(result.geography.counties, [{ fips: "48491", name: "Williamson County" }], input);
  }
});

test("server resolvePlace() leaves non-Hutto curated cities unchanged", async () => {
  const result = await resolvePlace("Round Rock, TX");
  assert.equal(result.ok, true);
  if (result.ok) assert.doesNotMatch(result.geography.label, /Hutto/);
});

test("orchestration copy keeps unconnected handoffs and receipts in the proposed state", () => {
  for (const step of HUTTO_ORCHESTRATION.filter(o => /named person|Measure/.test(o.step))) {
    assert.match(step.text, /^Proposed:/, step.step);
    assert.doesNotMatch(step.text, /^Each handoff (goes|leaves)/, step.step);
  }
});

test("non-Hutto places are unchanged (no default city, no name inference)", () => {
  assert.equal(isHuttoPlace("Round Rock, TX"), false);
  assert.equal(isHuttoPlace("Huttonsville"), false);
  assert.equal(describeJourneyPlace("78701"), "ZIP 78701");
  assert.equal(placeToZip("Austin, TX"), null);
  assert.equal(describeJourneyPlace("county:48491"), "County FIPS 48491");
});

test("canonical Hutto record matches the spec", () => {
  assert.equal(HUTTO_PLACE.label, "Hutto, TX (78634)");
  assert.equal(HUTTO_PLACE.countyFips, "48491");
  assert.equal(HUTTO_PLACE.countyName, "Williamson County");
});

test("Hutto Ready strip and journey follow the spec", () => {
  assert.equal(HUTTO_READY_TITLE, "Hutto Ready — Every Link, One Community");
  assert.deepEqual(HUTTO_READY_LINKS.map(l => `${l.name} — ${l.label}`), [
    "ThriveUp — Community front door",
    "ChildCORE — Early childhood",
    "LineReady — Workforce pathways",
    "FinLitSpark — Financial readiness",
    "HazardAware — Emergency readiness",
    "Funding Path Pro — Grants and funding",
  ]);
  for (const l of HUTTO_READY_LINKS) assert.match(l.href, /^https:\/\/[^/]+\/hutto$/);
  assert.deepEqual(HUTTO_JOURNEY.map(s => s.n), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(HUTTO_JOURNEY.map(s => s.platform), HUTTO_READY_LINKS.map(l => l.key));
  for (const f of Object.values(HUTTO_FACTS)) assert.match(f.href, /^https:\/\//, f.id);
});

test("binding spec is committed and every displayed fact source is one of its allowed facts", () => {
  const spec = readFileSync(resolve(process.cwd(), "docs/hutto/HUTTO_DEMO_SPEC.md"), "utf8");
  for (const f of Object.values(HUTTO_FACTS)) assert.ok(spec.includes(f.href), `${f.id} source is listed in the spec`);
  for (const l of HUTTO_READY_LINKS) assert.ok(spec.includes(l.href), `${l.name} URL is listed in the spec`);
});

test("VeraBank is never presented as a sponsor (neutral sponsor slot renders separately)", () => {
  const veraBank = HUTTO_STAKEHOLDERS.find(s => s.org === "VeraBank");
  assert.ok(veraBank);
  for (const line of veraBank.gets) assert.doesNotMatch(line, /sponsor/i, line);
});

test("place display surfaces route the raw ZIP through describeJourneyPlace()", () => {
  const gravity = readFileSync(resolve(process.cwd(), "client/src/pages/community-gravity.tsx"), "utf8");
  assert.match(gravity, /organizations to know near \$\{describeJourneyPlace\(broadPlace\)\}/);
  assert.match(gravity, /Map for \{describeJourneyPlace\(broadPlace\)\}/);
  const landing = readFileSync(resolve(process.cwd(), "client/src/pages/outcome-landing.tsx"), "utf8");
  assert.match(landing, /const placeLabel = rawPlace \? describeJourneyPlace\(rawPlace\)/);
});
