/**
 * verify-equity-loss-frames.ts
 *
 * Regression guard for the specific architecture bug caught during this
 * feature's Phase 2 red-team: computeAllFrames() must never produce three
 * identical frame values from a real request. If someone reintroduces the
 * "call computeEquityLoss three times with identical inputs" pattern, this
 * gate fails loudly instead of shipping silently.
 *
 * Also checks the endpoint's basic contract: 3 frames, suppression/tier
 * fields present, county classification present.
 */

async function main() {
  const base = process.env.EQUITY_LOSS_PROBE_URL || "http://localhost:5000";
  // Cook County, IL — known-good, covered by both ACS and USALEEP.
  const url = `${base}/api/equity-loss/county/17/031`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} → HTTP ${res.status} (is the server running?)`);
  }
  const body = await res.json();

  const frames = body.frames;
  if (!frames?.vsParentCounty || !frames?.vsState || !frames?.vsNationalPeerClass) {
    throw new Error("Response missing one or more of the three required frames");
  }

  const refs = [
    frames.vsParentCounty.referenceLossPct,
    frames.vsState.referenceLossPct,
    frames.vsNationalPeerClass.referenceLossPct,
  ].filter((v) => v !== null);

  if (refs.length < 2) {
    throw new Error("Fewer than 2 frames returned a non-null referenceLossPct — cannot verify divergence");
  }
  const allIdentical = refs.every((v) => v === refs[0]);
  if (allIdentical) {
    throw new Error(
      "REGRESSION: all frame reference values are identical — this is the exact " +
      "structural bug caught in Phase 2 (computeAllFrames calling computeEquityLoss " +
      "with identical inputs for every frame). See docs/equity-loss-phase1-2-decisions.md.",
    );
  }
  console.log(`✓ frame references diverge: ${JSON.stringify(refs)}`);

  for (const [name, row] of Object.entries(frames)) {
    if (name === "divergencePct" || name === "divergenceInterpretation") continue;
    const r = row as any;
    if (!r.suppressed && (r.tier === undefined || r.assumptionText === undefined)) {
      throw new Error(`Frame ${name} missing required tier/assumption disclosure fields`);
    }
  }
  console.log("✓ every non-suppressed frame discloses its trust tier and assumption text");

  if (!body.county?.fips || !body.county?.ruralityBand) {
    throw new Error("Response missing county classification fields");
  }
  console.log(`✓ county classification present: ${body.county.name}, ${body.county.state} (${body.county.ruralityBand})`);

  console.log("\n✅ All equity-loss frame verification checks passed.");
}

main().catch((e) => {
  console.error("[verify-equity-loss-frames] FAILED:", e.message);
  process.exit(1);
});
