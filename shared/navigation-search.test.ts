import { test } from "node:test";
import assert from "node:assert/strict";
import { rankNavigationSearch } from "./navigation-search";

const items = [
  { label: "My Grants", path: "/my-grants", group: "Get funded", keywords: "pipeline opportunities" },
  { label: "Grant Hub", path: "/grants", group: "Get funded", keywords: "funding grants" },
  { label: "Resource Finder", path: "/resources", group: "Help", keywords: "food assistance housing rent" },
  { label: "Résumé practice", path: "/resume", group: "Work", keywords: "career résumé" },
];
test("matches multiple words across fields instead of requiring a verbatim phrase", () => {
  assert.equal(rankNavigationSearch(items, "grant pipeline")[0]?.path, "/my-grants");
});
test("ranks exact label above keyword/category matches", () => {
  assert.equal(rankNavigationSearch(items, "Grant Hub")[0]?.path, "/grants");
});
test("handles plain-language filler, case, punctuation and accents", () => {
  assert.equal(rankNavigationSearch(items, "I need help with FOOD assistance")[0]?.path, "/resources");
  assert.equal(rankNavigationSearch(items, "resume")[0]?.path, "/resume");
});
test("never widens an already-authorized input catalog", () => {
  assert.equal(rankNavigationSearch(items.slice(2), "grant").length, 0);
});
test("returns no invented matches and preserves empty-query ordering", () => {
  assert.deepEqual(rankNavigationSearch(items, "quantum submarine"), []);
  assert.deepEqual(rankNavigationSearch(items, ""), items);
});