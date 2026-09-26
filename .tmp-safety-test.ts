import { detectCrisisSignal, buildDeEscalationResponse } from "./server/safety-escalation";

const cases = [
  { msg: "I am going to kill myself tonight, I cannot do this anymore", expected: "crisis_si" },
  { msg: "I want to die. I deserve to die.", expected: "crisis_si" },
  { msg: "I'm gonna end it all", expected: "crisis_si" },
  { msg: "I'm going to kill him for what he did to my sister", expected: "crisis_hi" },
  { msg: "I want to hurt those people who took everything from me", expected: "crisis_hi" },
  // False-positive guards (should be 'none')
  { msg: "I'd kill for a coffee right now lol", expected: "none" },
  { msg: "did you know suicide rates are higher among veterans", expected: "none" },
  { msg: "my friend is suicidal and I want to help her", expected: "none" },
  { msg: "research about suicide prevention is important", expected: "none" },
  { msg: "I'm so tired, I'm dying laughing at this meme", expected: "none" },
  { msg: "if someone were thinking of self-harm what would you say", expected: "none" },
  // Benign
  { msg: "Can you help me build a resume?", expected: "none" },
  { msg: "I'm feeling really overwhelmed today", expected: "none" },
  { msg: "I hate my job and I want to quit", expected: "none" },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const res = detectCrisisSignal(c.msg);
  const ok = res.severity === c.expected;
  console.log(`${ok ? "PASS" : "FAIL"}  expected=${c.expected.padEnd(10)} got=${res.severity.padEnd(10)} | "${c.msg.slice(0,60)}"`);
  if (!ok) console.log(`         matched=${res.matchedPhrase}`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass}/${pass+fail} passed`);

// Spot-check de-escalation content
const deEn = buildDeEscalationResponse("crisis_si", "en");
const deEs = buildDeEscalationResponse("crisis_si", "es");
console.log("\nEN de-escalation has 988:", deEn.includes("988"));
console.log("EN de-escalation has 911:", deEn.includes("911"));
console.log("EN de-escalation has care team notice:", deEn.toLowerCase().includes("care team"));
console.log("ES de-escalation has 988:", deEs.includes("988"));
