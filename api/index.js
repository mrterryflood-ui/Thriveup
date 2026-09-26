// Vercel serverless entrypoint.
//
// Vercel sets NODE_ENV=production and VERCEL=1 in the function runtime.
// server/index.ts reads VERCEL and runs in "function mode": no boot
// migrations, no interval timers, no listen(). This module awaits the
// boot promise, restores the original URL (Vercel forwards requests here
// as /api?path=<original> per vercel.json), and hands off to Express.
//
// Replit never touches this file.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mod = require("../dist/index.cjs");
const expressApp = mod.app;
const ready = mod.ready;

export default async function handler(req, res) {
  try {
    if (ready) await ready;
  } catch (err) {
    const detail = err && err.message ? err.message : String(err);
    console.error("[vercel] boot sequence failed:", detail);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Application boot failed", detail }));
    return;
  }

  // Restore the original path from the rewrite workaround (?path=...).
  if (req.url) {
    const u = new URL(req.url, "http://vercel.local");
    const originalPath = u.searchParams.get("path");
    if (originalPath) {
      u.searchParams.delete("path");
      const rest = u.searchParams.toString();
      req.url = originalPath + (rest ? `?${rest}` : "");
    }
  }

  return expressApp(req, res);
}
