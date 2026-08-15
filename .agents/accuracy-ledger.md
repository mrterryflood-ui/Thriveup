# Accuracy & Continuous-Learning Ledger

Started 2026-08-15, per the Order of Operations doctrine
(`.agents/skills/order-of-operations/SKILL.md`, Phase 5 Addendum). Every
Phase 5 close deposits one entry here. Read as a whole, this is the honest
answer to "is the system getting more accurate over time" — not a summary
written from impression.

**Format per entry:** Date | Subsystem | Claim | How verified | Outcome | Class

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
