/**
 * Probe: gun-violence story PDF renders correctly when keyNumbers is empty.
 *
 * Mirrors the exact HTML-generation logic from
 * client/src/pages/gun-violence-intelligence.tsx (lines 705–728) so that
 * any future drift in that template is caught by a failing assertion here.
 */

function buildPrintHtml(story: {
  headline: string;
  subhead?: string;
  body?: string[];
  keyNumbers?: { value: string; label: string }[];
  callToAction?: string;
}): string {
  const statsHtml = (story.keyNumbers ?? [])
    .map(
      (kn) =>
        `<div class="stat"><div class="stat-value">${kn.value}</div><div class="stat-label">${kn.label}</div></div>`,
    )
    .join("");

  const bodyHtml = (story.body ?? []).map((p) => `<p>${p}</p>`).join("");

  return `<!DOCTYPE html><html><head><title>${story.headline}</title><style>
body{font-family:Georgia,serif;max-width:740px;margin:48px auto;color:#111;line-height:1.75;padding:0 24px}
h1{font-size:26px;margin-bottom:6px;line-height:1.3}
.subhead{color:#555;font-size:15px;margin-bottom:28px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}
.stat{border:1px solid #ddd;border-radius:8px;padding:14px;text-align:center}
.stat-value{font-size:22px;font-weight:bold;color:#be123c}
.stat-label{font-size:11px;color:#666;margin-top:3px}
p{margin:14px 0}
.cta{background:#f5f0ff;border:1px solid #c084fc;border-radius:8px;padding:16px;margin-top:28px;font-weight:600;color:#6b21a8}
.footer{margin-top:48px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:14px}
@media print{body{margin:24px auto}}
</style></head><body>
<h1>${story.headline}</h1>
${story.subhead ? `<p class="subhead">${story.subhead}</p>` : ""}
${statsHtml ? `<div class="stats">${statsHtml}</div>` : ""}
${bodyHtml}
${story.callToAction ? `<div class="cta">${story.callToAction}</div>` : ""}
<div class="footer">Data sources: CDC WONDER &middot; FBI UCR &middot; NCVS &middot; WISQARS &middot; RPLICE &middot; GVA &mdash; TCAF Gun Violence Intelligence Hub &middot; Generated ${new Date().toLocaleDateString()}</div>
</body></html>`;
}

// ── helpers ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// ── scenario 1: keyNumbers = [] ────────────────────────────────────────────────

console.log("\nScenario 1: keyNumbers = [] (sparse data geography)");
{
  const html = buildPrintHtml({
    headline: "Gun Violence in Rural Garza County",
    subhead: "A community navigating rising incidents with limited resources",
    body: [
      "Garza County has seen a 12% increase in firearm incidents over the past three years.",
      "Community health workers report that access to mental health services remains a core gap.",
    ],
    keyNumbers: [],
    callToAction: "Contact your county health department to learn about available resources.",
  });

  // Must be well-formed HTML
  assert("Starts with DOCTYPE", html.startsWith("<!DOCTYPE html>"));
  assert("Contains <html>", html.includes("<html>"));
  assert("Contains </html>", html.includes("</html>"));
  assert("Contains <body>", html.includes("<body>"));
  assert("Contains </body>", html.includes("</body>"));

  // Required sections present
  assert("Headline present", html.includes("<h1>Gun Violence in Rural Garza County</h1>"));
  assert("Subhead present", html.includes(`<p class="subhead">`));
  assert("Body paragraph 1 present", html.includes("12% increase"));
  assert("Body paragraph 2 present", html.includes("mental health services"));
  assert("CTA present", html.includes(`<div class="cta">`));
  assert("Footer present", html.includes(`<div class="footer">`));
  assert("Footer data sources present", html.includes("CDC WONDER"));
  assert("Footer attribution present", html.includes("TCAF Gun Violence Intelligence Hub"));

  // Stats grid MUST be absent (no empty wrapper div)
  assert(
    "Stats grid absent when keyNumbers=[]",
    !html.includes(`<div class="stats">`),
    "empty stats wrapper should be suppressed",
  );
}

// ── scenario 2: keyNumbers = undefined (field omitted entirely) ───────────────

console.log("\nScenario 2: keyNumbers field omitted (field entirely absent from AI response)");
{
  const html = buildPrintHtml({
    headline: "Firearm Safety in Metro Areas",
    subhead: "How city planning shapes gun violence outcomes",
    body: ["Dense urban environments present unique challenges for intervention programs."],
    // keyNumbers intentionally not set
    callToAction: "Join a local advocacy group to push for evidence-based solutions.",
  });

  assert("Starts with DOCTYPE", html.startsWith("<!DOCTYPE html>"));
  assert("Headline present", html.includes("<h1>Firearm Safety in Metro Areas</h1>"));
  assert("Body present", html.includes("Dense urban environments"));
  assert("CTA present", html.includes(`<div class="cta">`));
  assert("Footer present", html.includes("TCAF Gun Violence Intelligence Hub"));
  assert(
    "Stats grid absent when keyNumbers=undefined",
    !html.includes(`<div class="stats">`),
  );
}

// ── scenario 3: keyNumbers present — grid SHOULD appear ──────────────────────

console.log("\nScenario 3: keyNumbers present — grid must appear (regression guard)");
{
  const html = buildPrintHtml({
    headline: "Chicago Gun Violence Overview",
    subhead: "2023 incident data",
    body: ["Chicago recorded significant firearm incidents last year."],
    keyNumbers: [
      { value: "3,561", label: "Incidents" },
      { value: "18%", label: "YoY change" },
      { value: "82%", label: "Survival rate" },
      { value: "47", label: "Avg age" },
    ],
    callToAction: "Support local violence interrupters.",
  });

  assert("Headline present", html.includes("<h1>Chicago Gun Violence Overview</h1>"));
  assert("Stats grid present when keyNumbers non-empty", html.includes(`<div class="stats">`));
  assert("First stat value present", html.includes("3,561"));
  assert("Second stat label present", html.includes("YoY change"));
  assert("Footer present", html.includes("TCAF Gun Violence Intelligence Hub"));
}

// ── scenario 4: no subhead, no CTA ───────────────────────────────────────────

console.log("\nScenario 4: subhead and callToAction absent — no broken placeholder divs");
{
  const html = buildPrintHtml({
    headline: "Minimal Story",
    body: ["Only a body paragraph."],
    keyNumbers: [],
  });

  assert("Headline present", html.includes("<h1>Minimal Story</h1>"));
  assert("Body present", html.includes("Only a body paragraph."));
  assert("No subhead placeholder", !html.includes(`class="subhead"`));
  assert("No CTA placeholder", !html.includes(`class="cta"`));
  assert("No empty stats wrapper", !html.includes(`<div class="stats">`));
  assert("Footer still present", html.includes("TCAF Gun Violence Intelligence Hub"));
}

// ── summary ────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(56)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
