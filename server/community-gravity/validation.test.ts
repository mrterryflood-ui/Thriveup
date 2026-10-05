import test from "node:test";
import assert from "node:assert/strict";
import { insertCommunityNetworkProfileSchema } from "@shared/schema";
import { isUsStateCode } from "@shared/us-state-codes";
import { isHttpUrl, isPublicHttpUrl, parseCommunityCityStateLabel } from "./validation";

test("shared profile schema accepts a real state code and rejects a two-letter lookalike", () => {
  const stateSchema = insertCommunityNetworkProfileSchema.shape.state;
  assert.equal(stateSchema.parse("ca"), "CA");
  assert.equal(stateSchema.safeParse("ZZ").success, false);
  assert.equal(isUsStateCode("PR"), true);
  assert.equal(isUsStateCode("ZZ"), false);
});

test("journey place labels accept accented cities and reject invalid states", () => {
  assert.deepEqual(parseCommunityCityStateLabel("San José, ca"), { city: "San José", state: "CA" });
  assert.deepEqual(parseCommunityCityStateLabel("  Montréal, QC  "), null);
  assert.equal(parseCommunityCityStateLabel("San José, ZZ"), null);
  assert.equal(parseCommunityCityStateLabel("12345, TX"), null);
});

test("profile URLs reject unsafe schemes, credentials, local names, and private IP literals", async () => {
  for (const url of [
    "javascript:alert(1)",
    "https://user:password@example.org/source",
    "http://localhost/source",
    "http://services.local/source",
    "http://127.0.0.1/source",
    "http://10.1.2.3/source",
    "http://[::1]/source",
    "http://[fc00::1]/source",
    "http://[2001:2::1]/source",
    "http://[2001:1::4]/source",
    "http://[2001:4::1]/source",
    "http://[2001:db8::1]/source",
    "http://[2001:1:0:1::3]/source",
    "http://[3fff::1]/source",
    "http://[5f00::1]/source",
    "http://[64:ff9b::1]/source",
    "http://[64:ff9b::a01:203]/source",
  ]) {
    assert.equal(isHttpUrl(url), false, url);
    assert.equal(await isPublicHttpUrl(url), false, url);
  }
});

test("profile hostnames must resolve exclusively to globally routable addresses", async () => {
  const privateResolver = async () => ["203.0.113.8"];
  const mixedResolver = async () => ["8.8.8.8", "10.0.0.4"];
  const publicResolver = async () => ["8.8.8.8", "2001:4860:4860::8888"];

  assert.equal(await isPublicHttpUrl("https://public-looking.example.org/source", privateResolver), false);
  assert.equal(await isPublicHttpUrl("https://mixed.example.org/source", mixedResolver), false);
  assert.equal(await isPublicHttpUrl("https://public.example.org/source", publicResolver), true);
  assert.equal(await isPublicHttpUrl("https://documentation.example.org/source", async () => ["2001:db8::1"]), false);
  assert.equal(await isPublicHttpUrl("https://8.8.8.8/source"), true);
  assert.equal(isHttpUrl("http://[2001:1::3]/source"), true);
  assert.equal(isHttpUrl("http://[2001:20::1]/source"), true);
  assert.equal(isHttpUrl("http://[2001:3::1]/source"), true);
  assert.equal(isHttpUrl("http://[2001:4:112::1]/source"), true);
  assert.equal(isHttpUrl("http://[2001:30::1]/source"), true);
  assert.equal(isHttpUrl("http://[64:ff9b::808:808]/source"), true);
});
