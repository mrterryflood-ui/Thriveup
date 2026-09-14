import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectNavigatorContextGeography,
  sanitizeNavigatorContextGeography,
  updateNavigatorUserContext,
} from "../navigator-context";

test("Navigator geography extraction persists only the displayed location fields", () => {
  assert.deepEqual(
    detectNavigatorContextGeography(
      "I need housing help in Austin, tx. My ZIP code is 78753.",
    ),
    { zip: "78753", city: "Austin", state: "TX" },
  );
});

test("Navigator geography extraction supports city and state without a ZIP", () => {
  assert.deepEqual(
    detectNavigatorContextGeography("I am in New Orleans, Louisiana"),
    { city: "New Orleans", state: "Louisiana" },
  );
});

test("Navigator geography extraction ignores unrelated five-digit numbers", () => {
  for (const message of [
    "My annual income is 50000.",
    "My case number is 12345.",
    "I graduated in 2024 and need housing help.",
    "Can you help me?",
    "I need food or housing.",
    "Is Oregon funding available?",
    "I am in need of housing.",
    "I am at risk.",
    "I work in health care.",
    "I am from a low income family.",
    "I live in pain or fear.",
    "I am in need of housing in Texas.",
    "I live in fear of violence in California.",
    "I am at risk of homelessness in Oregon.",
  ]) {
    assert.equal(detectNavigatorContextGeography(message), null, message);
  }
});

test("Navigator geography extraction handles punctuation and state abbreviations", () => {
  assert.deepEqual(
    detectNavigatorContextGeography("I am in St. Louis, MO"),
    { city: "St. Louis", state: "MO" },
  );
  assert.deepEqual(
    detectNavigatorContextGeography("I am in Detroit, mi"),
    { city: "Detroit", state: "MI" },
  );
  assert.deepEqual(
    detectNavigatorContextGeography("I am in Washington, D.C."),
    { city: "Washington, D.C", state: "DC" },
  );
  assert.deepEqual(
    detectNavigatorContextGeography("My city is Austin."),
    { city: "Austin" },
  );
});

test("Navigator geography correction replaces stale fields atomically", () => {
  assert.deepEqual(
    updateNavigatorUserContext(
      { geography: { zip: "78753", city: "Austin", state: "TX" }, source: "navigator" },
      { city: "Detroit", state: "MI" },
    ),
    { geography: { city: "Detroit", state: "MI" }, source: "navigator" },
  );
});

test("Navigator geography sanitization drops unsupported or unsafe fields", () => {
  assert.deepEqual(
    sanitizeNavigatorContextGeography({
      zip: "78753",
      city: "Austin",
      state: "TX",
      county: "453",
      notes: "untrusted context",
      unsafe: "line\nbreak",
    }),
    { zip: "78753", city: "Austin", state: "TX", county: "453" },
  );
  assert.deepEqual(
    sanitizeNavigatorContextGeography({
      county: "Travis",
      unsafe: "line\nbreak",
    }),
    null,
  );
  assert.deepEqual(
    sanitizeNavigatorContextGeography({ state: "TX", county: "48453" }),
    { state: "TX", county: "48453" },
  );
  assert.deepEqual(
    sanitizeNavigatorContextGeography({ state: "TX", county: "06037" }),
    { state: "TX" },
  );
  assert.deepEqual(
    sanitizeNavigatorContextGeography({ state: "TX", county: "1234" }),
    { state: "TX" },
  );
  assert.deepEqual(
    sanitizeNavigatorContextGeography({ state: "TX", countyFips: "48453" }),
    { state: "TX", county: "48453" },
  );
});