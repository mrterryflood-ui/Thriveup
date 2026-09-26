// Temporary diagnostic function: reports the exact crash point of the
// serverless bundle without needing runtime log access. Delete after fix.
import { createRequire } from "node:module";

export default async function handler(req, res) {
  const out = {
    node: process.version,
    env: process.env.VERCEL ?? null,
    envNames: Object.keys(process.env)
      .filter((k) => /POSTGRES|DATABASE|VERCEL|SESSION|THRIVE|NEON|NODE/i.test(k))
      .map((k) => (/(URL|SECRET|KEY)/i.test(k) ? `${k}=<set>` : `${k}=${process.env[k]}`)),
  };
  try {
    const require = createRequire(import.meta.url);
    out.resolved = require.resolve("../dist/index.cjs");
    const mod = require("../dist/index.cjs");
    out.moduleKeys = Object.keys(mod);
    out.appType = typeof mod.app;
    if (mod.ready) {
      try {
        await mod.ready;
        out.boot = "resolved";
      } catch (e) {
        out.boot = "rejected: " + String(e && e.message ? e.message : e).slice(0, 400);
      }
    }
    return res.status(200).json(out);
  } catch (err) {
    out.requireError = String((err && err.stack) || err).slice(0, 2000);
    return res.status(500).json(out);
  }
}
