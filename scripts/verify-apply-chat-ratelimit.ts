// Probe: the public how-to-apply chat endpoint's per-IP rate limit must NOT be
// bypassable by spoofing X-Forwarded-For.
//
// The limiter keys on Express's req.ip (resolved through the trusted-proxy
// config set at boot), so rotating a forged X-Forwarded-For header on every
// request must still exhaust ONE bucket and hit 429 within the window.
//
// Cost-safe: every probe request uses an unknown program, which the handler
// rejects with 400 AFTER the rate-limit middleware runs — so the probe
// exercises the limiter without ever triggering a paid AI call.
//
// Run against the running dev server: npx tsx scripts/verify-apply-chat-ratelimit.ts

const BASE = process.env.BASE_URL || "http://localhost:5000";
const LIMIT = 10;

async function main() {
  let saw429 = false;
  let sawUnexpected: string | null = null;

  for (let i = 1; i <= LIMIT + 3; i++) {
    const res = await fetch(`${BASE}/api/benefits/how-to-apply/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Rotate a forged client IP every request. If the limiter trusted this
        // header raw, every request would land in a fresh bucket and we would
        // never see a 429.
        "X-Forwarded-For": `203.0.113.${i}, 10.0.0.1`,
      },
      body: JSON.stringify({ program: "NotARealProgram", message: "probe" }),
    });
    if (res.status === 429) {
      saw429 = true;
      console.log(`✓ Request ${i} with spoofed X-Forwarded-For → 429 (limiter keyed on trusted req.ip, not the forged header)`);
      break;
    }
    if (res.status !== 400) {
      sawUnexpected = `request ${i} returned ${res.status} (expected 400 below the limit, 429 at it)`;
      break;
    }
  }

  if (sawUnexpected) {
    console.error(`✗ ${sawUnexpected}`);
    process.exit(1);
  }
  if (!saw429) {
    console.error(`✗ Sent ${LIMIT + 3} requests with rotating spoofed X-Forwarded-For and never hit 429 — the per-IP rate limit is bypassable via header spoofing.`);
    process.exit(1);
  }
  console.log("Spoofed-forwarded-header rate-limit probe passed.");
}

main().catch((err) => {
  console.error("Probe crashed (is the dev server running on :5000?):", err?.message || err);
  process.exit(1);
});
