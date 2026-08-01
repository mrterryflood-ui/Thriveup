---
name: Double Helix AI Verification Protocol
description: Two-strand build+verify loop rule — BUILD agent and VERIFY subagent interleave on every feature until zero gaps, then mandatory Architect review. Applies to every build session.
---

# Double Helix AI Verification Protocol

## The Rule
Every build session runs two permanently interleaved strands:
- **BUILD strand** — main agent implements the feature following Iron Rules
- **VERIFY strand** — independent subagent reads the result cold, checks every Iron Rule, and reports findings explicitly (pass/fail per rule, per file, per edge case)

## Cycle
1. BUILD implements a section
2. VERIFY reads it cold and reports all gaps
3. BUILD fixes every finding
4. VERIFY re-checks
5. Repeat until VERIFY finds **zero gaps**
6. Iron Rule 19 Architect review is mandatory — neither strand can declare done without it
7. Session verification record written to `.verification/` at session end

## The DNA metaphor
The two strands always work the **same axis** (same feature) but from **opposite perspectives**:
- Builder assumes it works
- Verifier assumes it's broken

## Why
No single-agent build catches its own blind spots. The alternating build/fix/verify cycle prevents silent failures that pass local checks but break invariants. The architect review is the final structural gate before the helix record closes.

## How to apply
- On any non-trivial build task, dispatch a VERIFY subagent immediately after each implementation chunk (not at the end)
- VERIFY must check: Iron Rule compliance, edge cases, data integrity, type safety, CI gate adherence
- Never short-circuit to architect review without a clean VERIFY pass first
- Record the helix trace (BUILD steps → VERIFY findings → fixes → re-verify) in `.verification/<feature>-<date>.md`
