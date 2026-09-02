import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { formatCivicSignalRAGContext, type CivicSignalLesson } from "../civic-signal-connector";

const fixture: CivicSignalLesson = {
  id: "lesson-test",
  lesson: "Residents preferred evening enrollment hours when transportation was limited.",
  topic: "workforce",
  state: "TX",
  source: "verified_partner_lesson",
  sourceDate: "2026-08-31",
  confidence: "moderate",
  receivedAt: "2026-09-02T00:00:00.000Z",
  contentHash: "a".repeat(64),
  roiImplication: "More flexible access may improve reach; verify locally before modeling.",
};

test("Civic Signal context preserves partner provenance and evidence boundaries", () => {
  const context = formatCivicSignalRAGContext([fixture], "live Civic Signal pull plus durable verified lessons");

  assert.match(context, /CIVIC SIGNAL/);
  assert.match(context, /partner-supplied adaptation lesson/);
  assert.match(context, /Do not restate as a local observed measure/);
  assert.match(context, /Residents preferred evening enrollment hours/);
  assert.match(context, /Source: verified_partner_lesson/);
  assert.match(context, /Source date: 2026-08-31/);
  assert.match(context, /Availability: live Civic Signal pull/);
});

test("Civic Signal orchestration is wired into the shared geography context", () => {
  const contextBuilder = readFileSync("server/rplice-intelligence.ts", "utf8");
  const middleware = readFileSync("server/community-context.ts", "utf8");
  const migration = readFileSync("migrations/20260902_civic_signal_lessons.sql", "utf8");

  assert.match(contextBuilder, /getCivicSignalRAGContextAsync/);
  assert.match(contextBuilder, /COMMUNITY DATA-LED STORY \+ ACTION ORCHESTRA/);
  assert.match(middleware, /warmCommunityContext\(zip\)/);
  assert.match(middleware, /runWithCommunityContext\(context/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "civic_signal_lessons"/);
  assert.match(migration, /content_hash/);
  assert.match(migration, /source_date/);
});

test("Civic Signal uses the current partner-exchange contract", () => {
  const connector = readFileSync("server/civic-signal-connector.ts", "utf8");
  assert.match(connector, /partner-exchange\/v1\/thriveup-lessons\/query/);
  assert.match(connector, /method: "POST"/);
});

test("empty partner context stays empty instead of inventing a lesson", () => {
  assert.equal(formatCivicSignalRAGContext([]), "");
});