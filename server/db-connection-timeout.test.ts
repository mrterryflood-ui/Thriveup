import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_DB_CONNECTION_TIMEOUT_MS } from "./db-connection-timeout";

test("gives a cold database more than five seconds to establish a connection", () => {
  assert.equal(DEFAULT_DB_CONNECTION_TIMEOUT_MS, 12_000);
  const config = readFileSync(new URL("../.replit", import.meta.url), "utf8");
  assert.match(config, /^DB_CONNECTION_TIMEOUT_MS = "12000"$/m);
});