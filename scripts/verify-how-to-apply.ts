// Verification gate for the guided "How to Apply" benefits walkthroughs.
//
// Enforces parity so a program can never silently vanish from the guided flow:
//   1. Every BENEFIT_NAVIGATION program (server catalog) has APPLY_PROGRAM_META
//      (shared guide data) and vice versa — no orphans in either direction.
//   2. Every program's applicationUrl parses as a valid http(s) URL, and every
//      state-aware nav entry resolves for a spot-check of states.
//   3. Every program resolves a non-empty stage walkthrough.
//   4. The client screener's BENEFIT_INFO map covers every program (so no
//      result card is silently dropped) and links into the how-to-apply page.
//   5. The How to Apply page + App route + resource-finder linking exist.
//   6. UnemploymentInsurance and WorkersComp carry a state-variance disclosure.
//
// Runs as part of the directory-links validation gate.
// (Actual URL liveness is covered by scripts/verify-directory-links.ts, which
// scans all client pages — including the new how-to-apply page.)

import { readFileSync } from "fs";
import { BENEFIT_NAVIGATION } from "../server/benefits-screener-fix";
import { getBenefitNav } from "../server/benefits-local-nav";
import { APPLY_PROGRAM_META, getApplyStages } from "../shared/benefits-apply-guides";

let failures = 0;
function fail(msg: string) {
  failures++;
  console.error(`✗ ${msg}`);
}
function ok(msg: string) {
  console.log(`✓ ${msg}`);
}

const serverCodes = Object.keys(BENEFIT_NAVIGATION).sort();
const metaCodes = Object.keys(APPLY_PROGRAM_META).sort();

// 1. Catalog parity in both directions
for (const c of serverCodes) {
  if (!APPLY_PROGRAM_META[c]) fail(`BENEFIT_NAVIGATION program "${c}" missing from APPLY_PROGRAM_META (shared/benefits-apply-guides.ts)`);
}
for (const c of metaCodes) {
  if (!BENEFIT_NAVIGATION[c]) fail(`APPLY_PROGRAM_META program "${c}" missing from BENEFIT_NAVIGATION (server/benefits-screener-fix.ts)`);
}
if (failures === 0) ok(`Catalog parity: ${serverCodes.length} programs in lockstep (server ↔ shared)`);

// 2. URLs parse + state-aware nav resolves
const SPOT_STATES = [undefined, "TX", "CA", "NY", "IL"];
for (const c of serverCodes) {
  for (const st of SPOT_STATES) {
    const nav = { ...BENEFIT_NAVIGATION[c], ...(getBenefitNav(st, c) || {}) };
    if (!nav.applicationUrl) {
      fail(`${c} (state=${st ?? "none"}): no applicationUrl`);
      continue;
    }
    try {
      const u = new URL(nav.applicationUrl);
      if (!/^https?:$/.test(u.protocol)) fail(`${c} (state=${st ?? "none"}): applicationUrl is not http(s): ${nav.applicationUrl}`);
    } catch {
      fail(`${c} (state=${st ?? "none"}): applicationUrl does not parse: ${nav.applicationUrl}`);
    }
    if (!nav.documentsRequired || nav.documentsRequired.length === 0) fail(`${c}: empty documentsRequired`);
  }
}
if (failures === 0) ok(`Application URLs + docs resolve for all programs across ${SPOT_STATES.length} state variants`);

// 3. Stages
for (const c of serverCodes) {
  const stages = getApplyStages(c);
  if (!stages || stages.length < 3) fail(`${c}: stage walkthrough missing or too short`);
  for (const s of stages) {
    if (!s.title?.trim() || !s.detail?.trim()) fail(`${c}: stage with empty title/detail`);
  }
}
if (failures === 0) ok("Every program resolves a full stage-by-stage walkthrough");

// 4. Client screener coverage + link-through
const screenerSrc = readFileSync("client/src/pages/benefits-screener.tsx", "utf-8");
for (const c of serverCodes) {
  // BENEFIT_INFO keys appear as `  <Code>: {` at the top of the map
  const keyRe = new RegExp(`^\\s{2}${c}:\\s*\\{`, "m");
  if (!keyRe.test(screenerSrc)) fail(`benefits-screener.tsx BENEFIT_INFO is missing "${c}" — its result card would be silently dropped`);
}
if (!screenerSrc.includes("/benefits/how-to-apply/")) {
  fail("benefits-screener.tsx does not link into /benefits/how-to-apply/ — screener results lost the guided walkthrough link");
}
if (failures === 0) ok("Screener renders a card for every program and links to the walkthrough");

// 5. Page, route, resource-finder wiring
const pageSrc = readFileSync("client/src/pages/benefits-how-to-apply.tsx", "utf-8");
if (!pageSrc.includes("/api/benefits/how-to-apply/")) fail("how-to-apply page does not call the guide API");
if (!pageSrc.includes("/api/benefits/how-to-apply/chat")) fail("how-to-apply page is missing the AI chat panel endpoint call");
const appSrc = readFileSync("client/src/App.tsx", "utf-8");
if (!appSrc.includes("/benefits/how-to-apply/:program")) fail("App.tsx is missing the /benefits/how-to-apply/:program route");
const finderSrc = readFileSync("client/src/pages/resource-finder.tsx", "utf-8");
if (!finderSrc.includes("/benefits/how-to-apply/")) fail("resource-finder.tsx no longer links benefit entries into the how-to-apply page");
const routesSrc = readFileSync("server/benefits-routes.ts", "utf-8");
if (!routesSrc.includes("/api/benefits/how-to-apply/:program")) fail("server guide endpoint /api/benefits/how-to-apply/:program missing");
if (!routesSrc.includes("/api/benefits/how-to-apply/chat")) fail("server chat endpoint /api/benefits/how-to-apply/chat missing");
if (failures === 0) ok("Page, route, server endpoints, and resource-finder wiring all present");

// 6. State-variance disclosure for state-run programs
for (const c of ["UnemploymentInsurance", "WorkersComp"]) {
  if (!APPLY_PROGRAM_META[c]?.stateVariance?.trim()) {
    fail(`${c}: missing plain-language state-variance disclosure`);
  }
}
if (failures === 0) ok("State-run programs carry state-variance disclosures");

if (failures > 0) {
  console.error(`\n${failures} how-to-apply verification failure(s).`);
  process.exit(1);
}
console.log("\nAll how-to-apply walkthrough checks passed.");
