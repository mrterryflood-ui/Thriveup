// Boundary tests for shared/foster-eligibility.ts.
// Run: npx tsx scripts/test-foster-eligibility.ts
import { checkEligibility, screenParticipantGaps, type EligibilityInput, type Verdict } from "../shared/foster-eligibility";

let failures = 0;
function expect(desc: string, input: EligibilityInput, key: string, want: Verdict) {
  const r = checkEligibility(input).find((x) => x.key === key);
  const got = r?.eligible ?? "(absent)";
  if (got !== want) { failures++; console.error(`FAIL ${desc}: ${key} got ${got}, want ${want}`); }
  else console.log(`ok   ${desc}: ${key}=${got}`);
}
const base = { housingUnstable: false, unaccompanied: false, careAfter14: true };

// Chafee bands
expect("in care, 13", { age: 13, fosterStatus: "current", ...base, careAfter14: false }, "chafee", "maybe");
expect("in care, 14", { age: 14, fosterStatus: "current", ...base }, "chafee", "likely");
expect("former, 17", { age: 17, fosterStatus: "former", ...base }, "chafee", "maybe");
expect("former, 18", { age: 18, fosterStatus: "former", ...base }, "chafee", "likely");
expect("former, 21", { age: 21, fosterStatus: "former", ...base }, "chafee", "likely");
expect("former, 22", { age: 22, fosterStatus: "former", ...base }, "chafee", "maybe"); // other states to 23
expect("former, 24", { age: 24, fosterStatus: "former", ...base }, "chafee", "no");
expect("adopted16, 19", { age: 19, fosterStatus: "adopted16", ...base }, "chafee", "likely");
expect("adopted16, 22", { age: 22, fosterStatus: "adopted16", ...base }, "chafee", "maybe");
expect("never in care, 18", { age: 18, fosterStatus: "never", ...base }, "chafee", "no");

// ETV: requires care after 14, ends at 26
expect("former 20, care only before 14", { age: 20, fosterStatus: "former", ...base, careAfter14: false }, "etv", "maybe");
expect("former 20, care after 14", { age: 20, fosterStatus: "former", ...base }, "etv", "likely");
expect("former 26, care after 14", { age: 26, fosterStatus: "former", ...base }, "etv", "likely");
expect("former 27", { age: 27, fosterStatus: "former", ...base }, "etv", "no");
expect("in care, 13 — ETV never likely under 14", { age: 13, fosterStatus: "current", ...base, careAfter14: false }, "etv", "maybe");

// McKinney-Vento: housing only
expect("stable housing", { age: 16, fosterStatus: "never", ...base }, "mckinney_vento", "no");
expect("unstable housing", { age: 16, fosterStatus: "never", ...base, housingUnstable: true }, "mckinney_vento", "likely");

// FAFSA: unstable AND unaccompanied only
expect("unstable + with parent", { age: 17, fosterStatus: "never", ...base, housingUnstable: true, unaccompanied: false }, "fafsa_independent", "maybe");
expect("unstable + unaccompanied", { age: 17, fosterStatus: "never", ...base, housingUnstable: true, unaccompanied: true }, "fafsa_independent", "likely");
// stable housing → no FAFSA result at all
{
  const r = checkEligibility({ age: 17, fosterStatus: "never", ...base }).find((x) => x.key === "fafsa_independent");
  if (r) { failures++; console.error("FAIL stable housing should produce no FAFSA row"); } else console.log("ok   stable housing: no FAFSA row");
}

// Anti-overstatement sweep: no "likely" ETV without careAfter14; no "likely"
// FAFSA without unaccompanied; no "likely" chafee outside documented bands.
for (let age = 12; age <= 28; age++) {
  for (const fs of ["current", "former", "adopted16", "never"] as const) {
    for (const hu of [true, false]) for (const un of [true, false]) for (const ca of [true, false]) {
      const rs = checkEligibility({ age, fosterStatus: fs, housingUnstable: hu, unaccompanied: un, careAfter14: ca });
      for (const r of rs) {
        if (r.eligible !== "likely") continue;
        if (r.key === "etv" && (!ca || age < 14 || age > 26 || fs === "never")) { failures++; console.error(`FAIL sweep ETV likely: age=${age} fs=${fs} ca=${ca}`); }
        if (r.key === "fafsa_independent" && (!hu || !un)) { failures++; console.error(`FAIL sweep FAFSA likely: hu=${hu} un=${un}`); }
        if (r.key === "chafee") {
          const okBand = (fs === "current" && age >= 14) || (fs === "former" && age >= 18 && age <= 21) || (fs === "adopted16" && age <= 21);
          if (!okBand) { failures++; console.error(`FAIL sweep Chafee likely: age=${age} fs=${fs}`); }
        }
        if (r.key === "mckinney_vento" && !hu) { failures++; console.error(`FAIL sweep MV likely with stable housing`); }
      }
    }
  }
}
// ── Staff gap-screening sweep: unverified facts must NEVER yield "likely"
// for Chafee/ETV/FAFSA (only McKinney-Vento — housing IS on file — may).
for (let age = 12; age <= 28; age++) {
  for (const fh of [true, false]) for (const hu of [true, false]) {
    for (const r of screenParticipantGaps({ age, fosterCareHistory: fh, housingUnstable: hu })) {
      if (r.eligible === "likely" && r.key !== "mckinney_vento") {
        failures++; console.error(`FAIL gap-screen likely ${r.key}: age=${age} fh=${fh} hu=${hu}`);
      }
    }
  }
}
// Reviewer's specific cases: minor with historical-but-not-current care;
// 14-26 with unknown after-14 timing — no likely Chafee/ETV.
{
  const cases = [
    { age: 15, fosterCareHistory: true, housingUnstable: false },
    { age: 20, fosterCareHistory: true, housingUnstable: true },
  ];
  for (const c of cases) {
    const bad = screenParticipantGaps(c).filter((r) => r.eligible === "likely" && (r.key === "chafee" || r.key === "etv"));
    if (bad.length) { failures++; console.error(`FAIL endpoint case ${JSON.stringify(c)}: ${bad.map((b) => b.key)}`); }
    else console.log(`ok   gap-screen case age=${c.age}: no likely Chafee/ETV`);
  }
}
console.log(failures === 0 ? "\nALL BOUNDARY TESTS PASSED (incl. exhaustive anti-overstatement sweep)" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
