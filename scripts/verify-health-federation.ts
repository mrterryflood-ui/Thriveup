// Verifies the health federation gateway: both partner connectivity
// checks respond, and each connector either returns real content or an
// explicit offline status (never silent failure / fabricated data).
// Static checks always run; live-network assertions warn (not fail) if
// the partner itself is down — the point is that we DETECT the outage.

import express from "express";
import { FEDERATED_PARTNERS, getFederatedContent, checkPartnerConnectivity } from "../server/health-federation";
import { registerHealthFederationRoutes } from "../server/health-federation-routes";

let failures = 0;
function fail(msg: string) { console.error(`FAIL: ${msg}`); failures++; }
function pass(msg: string) { console.log(`ok: ${msg}`); }

async function main() {
  // 1. Static config sanity
  if (FEDERATED_PARTNERS.length !== 2) fail(`expected 2 partners, got ${FEDERATED_PARTNERS.length}`);
  for (const p of FEDERATED_PARTNERS) {
    if (!p.aiCompanion?.url?.startsWith("https://")) fail(`${p.id}: missing AI companion deep link`);
    if (!p.tools?.length) fail(`${p.id}: no tool deep links`);
    if (!p.baseUrl.startsWith("https://")) fail(`${p.id}: bad baseUrl`);
  }
  pass("partner config: 2 partners, AI companion + tool deep links present");

  // 2. Connectivity check must return a structured result for every partner
  const statuses = await checkPartnerConnectivity();
  if (statuses.length !== FEDERATED_PARTNERS.length) fail("connectivity check missing partners");
  for (const s of statuses) {
    if (typeof s.ok !== "boolean" || !s.checkedAt) fail(`${s.partnerId}: malformed connectivity result`);
    if (!s.ok) console.warn(`WARN: partner ${s.partnerId} is OFFLINE (${s.error}) — detected, not silent`);
    else pass(`${s.partnerId} reachable (${s.latencyMs}ms)`);
  }

  // 3. Each connector returns ok-with-content or explicit offline — never throws
  for (const p of FEDERATED_PARTNERS) {
    const result = await getFederatedContent(p.id);
    if (result.status === "ok") {
      const c = result.content;
      if (!c.conditions.length) fail(`${p.id}: ok status but zero conditions`);
      if (!c.attribution.toLowerCase().includes("sister platform")) fail(`${p.id}: missing source attribution`);
      pass(`${p.id}: live content — ${c.conditions.length} conditions, attribution present`);
    } else if (result.status === "offline") {
      if (!result.error) fail(`${p.id}: offline status without error detail`);
      console.warn(`WARN: ${p.id} offline — explicit error surfaced: ${result.error}`);
    } else {
      fail(`${p.id}: unknown federation result status`);
    }
  }

  // 4. Route-level regression: /status must never be shadowed by /:partnerId —
  //    it must answer 200 (all ok) or 503 (any partner down) with a structured body.
  await new Promise<void>((resolve) => {
    const app = express();
    registerHealthFederationRoutes(app);
    const server = app.listen(0, async () => {
      const port = (server.address() as { port: number }).port;
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health/federation/status`);
        const body = (await res.json()) as { allOk?: boolean; partners?: unknown[] };
        if (res.status !== 200 && res.status !== 503) fail(`/status returned HTTP ${res.status}, expected 200 or 503`);
        else if (typeof body.allOk !== "boolean" || !Array.isArray(body.partners)) fail("/status body missing allOk/partners");
        else if (res.status === 200 && !body.allOk) fail("/status 200 but allOk=false");
        else if (res.status === 503 && body.allOk) fail("/status 503 but allOk=true");
        else pass(`/status route reachable (HTTP ${res.status}, allOk=${body.allOk}) — not shadowed by :partnerId`);

        const bogus = await fetch(`http://127.0.0.1:${port}/api/health/federation/bogus`);
        if (bogus.status !== 404) fail(`unknown partner returned HTTP ${bogus.status}, expected 404`);
        else pass("unknown partner id returns 404");
      } catch (e: any) {
        fail(`route-level status check errored: ${e?.message || e}`);
      } finally {
        server.close(() => resolve());
      }
    });
  });

  if (failures > 0) { console.error(`${failures} failure(s)`); process.exit(1); }
  console.log("verify-health-federation: all checks passed");
}

main().catch((e) => { console.error("FAIL (unhandled):", e); process.exit(1); });
