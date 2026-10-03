import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

function worker(fetch, cacheFailure = false) {
  const listeners = {};
  const writes = [];
  const shell = new Response("offline shell");
  const cache = { match: async () => shell, put: async (...args) => writes.push(args), keys: async () => [] };
  runInNewContext(readFileSync("client/public/sw.js", "utf8"), {
    URL, Request, Response, fetch, console,
    caches: { open: async () => { if (cacheFailure) throw new Error("storage unavailable"); return cache; } },
    self: { location: { origin: "https://app.example" }, addEventListener: (type, fn) => { listeners[type] = fn; } },
  });
  async function navigate(path, mode = "navigate") {
    let promise;
    listeners.fetch({ request: { url: `https://app.example${path}`, method: "GET", mode }, respondWith: value => { promise = value; } });
    return promise ? await promise : null;
  }
  return { navigate, writes };
}

test("root navigation returns the live shell, not cache-first old home", async () => {
  const { navigate, writes } = worker(async () => new Response("live focused shell"));
  assert.equal(await (await navigate("/")).text(), "live focused shell");
  assert.equal(writes.length, 1);
});
test("offline workspace navigation falls back only to public shell", async () => {
  const { navigate, writes } = worker(async () => { throw new Error("offline"); });
  assert.equal(await (await navigate("/workspace/community")).text(), "offline shell");
  assert.equal(writes.length, 0);
});
test("API requests are never cached or given offline shell", async () => {
  const { navigate, writes } = worker(async () => { throw new Error("must not intercept API"); });
  assert.equal(await navigate("/api/auth/user", "same-origin"), null);
  assert.equal(writes.length, 0);
});
test("authenticated page HTML is not stored in static cache", async () => {
  const { navigate, writes } = worker(async () => new Response("private route response"));
  assert.equal(await (await navigate("/my-documents")).text(), "private route response");
  assert.equal(writes.length, 0);
});
test("cache storage failure never discards a healthy live shell", async () => {
  const { navigate } = worker(async () => new Response("live shell despite blocked cache"), true);
  assert.equal(await (await navigate("/")).text(), "live shell despite blocked cache");
});