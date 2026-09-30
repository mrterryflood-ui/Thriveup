import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const URL = "https://thegunviolenceproject.com";

test("The Gun Violence Project is featured beside the public pathway cards", () => {
  const landing = readFileSync("client/src/pages/landing.tsx", "utf8");
  const featuredStart = landing.indexOf("const FEATURED_SERVICE_PLATFORMS");
  const featuredEnd = landing.indexOf("] as const;", featuredStart);
  const featured = landing.slice(featuredStart, featuredEnd);

  assert.ok(featuredStart > 0, "featured pathway list exists");
  assert.equal(featured.split(URL).length - 1, 1);
  assert.match(featured, /name: "The Gun Violence Project"/);
  assert.match(featured, /not a completeness claim/);
  assert.match(landing, /target=\{opensInsideThriveUp \? undefined : "_blank"\}/);
  assert.match(landing, /rel=\{opensInsideThriveUp \? undefined : "noopener noreferrer"\}/);
});

test("The Gun Violence Project is listed once in the connected-sites directory", () => {
  const sidebar = readFileSync("client/src/components/app-sidebar.tsx", "utf8");
  const start = sidebar.indexOf("const connectedSiteItems");
  const end = sidebar.indexOf("];", start);
  const directory = sidebar.slice(start, end);

  assert.equal(directory.split(URL).length - 1, 1);
  assert.match(directory, /title: "The Gun Violence Project"/);
  assert.match(sidebar, /"The Gun Violence Project": "Public data stories/);
  assert.match(sidebar, /target=\{item\.url\.startsWith\("https:\/\/"\) \? "_blank" : undefined\}/);
  assert.match(sidebar, /rel=\{item\.url\.startsWith\("https:\/\/"\) \? "noopener noreferrer" : undefined\}/);
});
