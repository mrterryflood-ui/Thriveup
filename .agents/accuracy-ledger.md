# Accuracy & Continuous-Learning Ledger

Started 2026-08-15, per the Order of Operations doctrine
(`.agents/skills/order-of-operations/SKILL.md`, Phase 5 Addendum). Every
Phase 5 close deposits one entry here. Read as a whole, this is the honest
answer to "is the system getting more accurate over time" — not a summary
written from impression.

**Format per entry:** Date | Subsystem | Claim | How verified | Outcome | Class

---

## 2026-09-09 — Production publish CommonJS startup

**Claim:** The latest publish failure was caused by a production-bundle startup
exception rather than a build compilation failure or database schema problem.

**Verified by:** deployment build history and build logs; production runtime logs
showing `TypeError: Invalid URL` with undefined input; source inspection of the
seed module; a fresh `npm run build`; and a local launch of the exact
`dist/index.cjs` artifact with `NODE_ENV=production`, which returned HTTP 200
from `/` with zero invalid-URL matches.

**Outcome:** Confirmed and corrected in the workspace. The published service
still requires a user-initiated republish before this fix is live.

**Class:** Production compatibility gap between a CommonJS bundle and an
`import.meta.url` CLI guard.

---

## 2026-08-26 — Austin Community Bridge planning blueprint

**Claim:** A planning-only blueprint can responsibly frame a candidate
Austin intervention without identifying a priority area, implying an approved
partnership, or treating a resource overlay as proof of a response gap.

**Verified by:** direct review of the finished blueprint; repository
whitespace check; and an independent document review focused on geographic
validity, falsifiable classification rules, consent/safeguarding, claims
authorization, and implementation-science boundaries.

**Outcome:** Partially overturned, then corrected before release. The first
draft correctly deferred implementation and public claims, but did not yet
make the geography method, classification thresholds, response-gap evidence,
youth safeguards, and claims-release record explicit enough. The final
blueprint now makes those preconditions and stop conditions discoverable.

**Class:** Methodology and stakeholder-governance gap caught during planning,
before data analysis, recruitment, public release, or application build.

---

## 2026-08-26 — Austin organization-fit, authority, and evidence-screen records

**Claim:** Public mission/context statements and TCAF/ISS formation records can
support a limited organization-fit matrix without treating a compatible mission
as an accepted pilot role or an authorization to use data, cultural knowledge,
youth participation, or public claims. A targeted screen of the live RPLICE
catalog can expose evidence gaps without treating framework or setting-limited
metadata as evidence that the Austin bundle is effective.

**Verified by:** visual review of the attached Texas formation records; direct
fetches of the AACHD/MEND, Six Square, E4 Youth, and City of Austin primary
pages; direct retrieval of the 49-record public RPLICE catalog; an independent
cold-read audit; and records that name every unsupported authority as
unresolved.

**Outcome:** Confirmed for private planning records only. The source review
supports considering a cultural-steward contact for Six Square, youth
co-design contact for E4 Youth, and a potential planning/evidence-backbone
contribution for TCAF after authorization. The live-library screen finds
framework/process support and limited adjacent sources, not direct evidence
for the full candidate bundle. It does not support an assigned role, data
ownership, youth recruitment, City mandate, partnership claim, MEND governance
conclusion, EBI label, or outcome claim.

**Class:** Stakeholder-authorization and source-quality boundary preserved
before outreach, evidence classification, public release, or build work.

---

## 2026-08-15 — Equity-Loss Engine build cycle

**Claim 1:** The provided acceptance test (`atkinson.test`) should pass
UNDP HDR25 fixture rows at a ±0.05 tolerance.
**Verified by:** running the test harness directly (`npx tsx`).
**Outcome:** Overturned. 4 of 10 fixture rows failed — real propagated
rounding error reached 0.087 points. The underlying formula was independently
confirmed correct (all other property tests passed); only the test's
tolerance was wrong.
**Class:** Methodology gap (test tolerance didn't match real-world rounding
propagation through a compounded geometric mean).

**Claim 2:** `computeAllFrames`'s three comparison frames (vs. parent
county / vs. state / vs. national peer class) produce genuinely different
numbers, as the spec's own stated goal requires ("three frames, never
collapsed").
**Verified by:** reading the function's actual data flow before building a
route or UI on top of it.
**Outcome:** Overturned. The function computes identical output for all
three frames from identical input — `divergencePct` was structurally always
`0`. Caught during Phase 2 (plan red-team), before Phase 3/4 build, per the
Order of Operations doctrine — this is the doctrine's first real catch.
**Class:** Architecture gap (a function whose signature promised something
its implementation didn't do).

**Claim 3:** DB-level enforcement (reference-row immutability trigger,
tier-2-assumption-required constraint, geographic-dispersion-capped-at-tier-2
constraint) actually blocks the writes it's meant to block.
**Verified by:** live `psql` attempts to perform each forbidden write and
observing the rejection (not read-only inspection of the DDL).
**Outcome:** Confirmed, all three.
**Class:** — (positive confirmation; no gap).

**Running tally (as of Claim 3):** 2 confirmed, 2 overturned (both caught
before shipping, not after). Too few entries yet to show a trend — do not
claim one is forming. The next honest data point is whether the *same
class* of finding (architecture gap, methodology gap) recurs in the next
build cycle despite this session's fixes; if it does, the guard didn't
generalize and that is itself the next entry.

---

## 2026-08-15 — Equity-Loss Engine, Phase 3/4 build close (same cycle)

**Claim 4:** After threading real `referenceLossPct` values through
`computeAllFrames`, the three frames actually diverge numerically for a
real county (not just structurally capable of it).
**Verified by:** a live end-to-end request (`GET
/api/equity-loss/county/17/031`, Cook County IL) against the running
server, reading the actual returned numbers.
**Outcome:** Confirmed. National reference 12.62%, state reference 12.65%,
peer-class reference 13.71% (all distinct) against the county's own
13.71% loss — divergence is no longer structurally zero. This is the
direct fix-verification for Claim 2's architecture gap.
**Class:** — (positive confirmation; closes the Claim 2 gap).

**Claim 5:** The Census ACS fetch module works keyless the way the
older, already-shipped call sites in `community-api-routes.ts` /
`benefits-routes.ts` do.
**Verified by:** running the new fetch against the live Census API and
inspecting the raw HTTP response with `curl -v`.
**Outcome:** Overturned. Census now hard-enforces its API key requirement
(302 redirect to `missing_key.html`, not a clean 4xx) — a live-environment
behavior change from what the existing code's un-keyed fallback assumed.
Fixed by reusing the already-provisioned `CENSUS_API_KEY` env var. Existing
call sites still have the silent keyless-fallback path; they were not
independently re-verified this session and may be exposed to the same
issue under load.
**Class:** Environment-drift gap (an external API's actual enforcement
behavior no longer matches what the codebase's existing pattern assumed).

**Claim 6:** The peer-class benchmark batch script would compute a real
loss value for its representative county once given correct ACS+USALEEP
inputs.
**Verified by:** running the actual script against the live DB and
external APIs, not just reading its logic.
**Outcome:** Overturned on first run (0/12 computed — silently swallowed
`tracts.length === 0`, root cause: the script called the USALEEP fetch
with a county name missing the required state suffix, e.g. "Cook County"
instead of "Cook County, IL"). Confirmed after fix (11/12 computed).
**Class:** Implementation gap (a parameter-formatting mismatch between two
of this session's own new modules, not caught by types since both take a
plain string).

**Running tally (full cycle):** 3 confirmed, 5 overturned — every overturn
was caught by actually running the code against live data/DB before
declaring the step done, not by reading the code. That pattern (read-only
review missing real-environment failures; live execution catching them) is
now this cycle's dominant signal — worth checking for again next cycle
before it's called a trend.

---

## 2026-08-15 — Follow-up cycle: peer-class gap fix, USALEEP exclusion fix,
## Civic Signal wiring

**Claim 7:** The batch script's remaining unbenchmarked peer class
(rural/declining/South) has no usable representative county.
**Verified by:** re-running the isolated county computation directly and
reading the actual suppression reason returned.
**Outcome:** Overturned. The representative county (Van Zandt, TX) trips
the engine's own `high_growth_unreliable_denominator` rule — legitimate
suppression, not a bug. Fixed by widening the picker to try the top 5
candidates per class instead of only the single largest.
**Class:** Design gap (a single-candidate picker had no fallback for a
representative county that is itself legitimately suppressed).

**Claim 8:** `USALEEP_EXCLUDED_STATES = ['ME', 'WI']` (hardcoded in the
engine, described as a known coverage gap) is accurate.
**Verified by:** live queries against the CDC USALEEP Socrata API for both
states.
**Outcome:** Overturned. Both states returned full tract-level coverage —
ME: 55 tracts for one sampled county + a state aggregate row; WI: 225
tracts for one sampled county + a state aggregate row. The original
assumption was never re-verified against the live source before being
encoded as a constant. Fixed by removing the hardcoded state list and
deriving the "coverage gap" suppression reason directly from an empty
returned distribution, for any state.
**Class:** Unverified-assumption gap (a claim about an external dataset's
coverage was encoded as fact without checking it against the live source).

**Claim 9:** The Civic Signal outbound connector (`pushChainwebToCivicSignal`
et al.) is functional now that its credentials (`CIVIC_SIGNAL_BASE_URL`,
`THRIVEUP_INBOUND_KEY`) are present in the environment — memory from an
earlier session described it as "STUB, awaiting credentials."
**Verified by:** live calls against the actual power2thepeople.net
endpoints (both direct curl and through the new `/api/civic-signal` routes).
**Outcome:** Overturned twice. First, a stray non-ASCII character in the
secret's value crashed `fetch()` with an opaque ByteString error before any
network call happened. After sanitizing the header value, the real network
calls still fail: the pull endpoint returns 401 (invalid key) and the
ingest endpoint returns 403 (missing browser Origin header) — external,
Civic-Signal-side issues, not fixable from this codebase. The inbound half
(webhook receiving lessons) was independently live-tested and confirmed
fully working.
**Class:** Environment/external-dependency gap (stale memory said "stub
pending credentials"; actual state was "credentials present, code live,
external endpoints reject the calls" — a materially different and more
specific failure mode that a superficial recheck would have missed).

**Running tally (both cycles):** 3 confirmed, 8 overturned. Every single
overturn across both cycles was caught by live execution, never by reading
code or trusting a prior claim (including this session's own prior
memory). The standing lesson: for this project, "verified by reading the
code/docs" is not sufficient evidence for any claim about live data,
external APIs, or prior-session memory — only an actual live call counts.

---

## 2026-08-27 — Connecticut nationwide equity-loss geography alignment

**Claim:** A nationwide source with legacy Connecticut county labels can be
joined to the current Planning Region denominator without fabricating
geography, and the report can accurately distinguish analytical record
coverage from service deployment.

**Verified by:** live CDC USALEEP and Census relationship-file resolution;
the selected completed development batch; direct API/route checks; focused
crosswalk, direct-lookup, and partial-jurisdiction tests; full
access-model validation; direct visual capture; six independent adversarial
audits; and an independent architecture review.

**Outcome:** Confirmed after the original name-only join was overturned. The
authoritative identifier chain uniquely resolved 775 of 783 live Connecticut
source tracts across all nine Planning Regions and excluded eight
boundary-spanning tracts rather than assigning them. The report now names its
analytical coverage categories honestly, and both batch paths reject a partial
result instead of publishing it as completed.

**Class:** Geography-vintage and coverage-semantics gap caught and guarded
before release. The development preview proxy separately returned HTTP 502
despite a healthy local listener; that limits browser-interaction proof, not
the source/batch/API evidence.

**Validation note:** The first platform-wide completion run had two unrelated
Youth Mode response waits time out under concurrent validation. Re-running the
unchanged lock-protected suite immediately passed all five real flows. This is
evidence of validation-environment contention, not grounds to claim a product
regression is fixed or to weaken the gate.

---

## 2026-08-28 — Community Events archive/child-write concurrency

**Claim:** An archived Community Event cannot receive a final concurrent child
write after its archive transaction commits.

**Verified by:** normal development startup applying forward migrations; a
focused live server/database verifier; direct final-state queries; strict
TypeScript plus the integrated-flow foundation check; memory health and formal
preflight; local authenticated browser rendering; six independent adversarial
audit domains; and an isolated architecture review.

**Outcome:** Confirmed. The first concurrency test used a timer and could not
prove that each competing write had reached the contested lock. Independent
review overturned that proof method before completion. The revised test
observes the actual PostgreSQL blocking chain from attendance, need, action,
and story writers to the uncommitted archive transaction, then confirms each
write is rejected and its stored baseline remains unchanged. The first
all-project authentication-gate run then caught a verifier-only unhandled
expected rejection; result handling was moved to query launch, and both the
focused verifier and complete gate passed. Direct child-table truncation also
fails closed. A subsequent main-branch rebase retained the incoming
in-transaction lifecycle validation with the archival guards; the restarted
application and focused, full-gate, TypeScript, preflight, and memory checks
passed again on the merged source.

**Class:** Concurrency-proof methodology gap caught during verification and
converted into a deterministic database-level regression guard before release.

---

## 2026-09-13 — Journey spine, ChildCORE, and AI smoke closeout

**Claim:** The integrated journey and ChildCORE changes preserve authorization,
privacy, suppression, and partner-disclosure boundaries, and the configured AI
engines are live.

**Verified by:** zero-error TypeScript/integrated-flow foundation validation;
seed, memory, AI-preamble, YHSI, access-model, equity-loss, and security gates;
direct five-engine chat probes; route-coverage inspection; live public/guarded
HTTP probes; and a browser preview of the changed community surface.

**Outcome:** Confirmed for the implemented server and data contracts. The
five-engine smoke probe passed after replacing stale/incompatible model choices
with directly verified models. The youth-mode browser gate completed 1/5;
four tests failed on persistence/UI waits or a connection refusal, so it is not
represented as passing. An uncaught background DeepSeek timeout was separately
fixed and the app restarted cleanly afterward.

**Class:** Environment/provider drift was caught by direct execution rather than
startup logs; browser E2E contention remains an unresolved verification gap.

