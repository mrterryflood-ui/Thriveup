import { test } from "node:test";
import assert from "node:assert/strict";
import { HUTTO_PLACE, isHuttoPlace } from "../../shared/places/hutto";
import { describeJourneyPlace, placeToZip, parseJourneyContext } from "../../shared/journey-context";
import { HUTTO_FACTS, HUTTO_JOURNEY, HUTTO_READY_LINKS, HUTTO_READY_TITLE } from "../../shared/hutto-ready";

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
