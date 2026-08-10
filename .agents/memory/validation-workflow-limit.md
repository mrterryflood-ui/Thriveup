---
name: Validation workflow 10-slot limit
description: The workflow API caps configureWorkflow adds at 10 workflows; setValidationCommand is the sanctioned way to add validation gates, and sibling test files should be chained into one combined gate.
---

The rule: `configureWorkflow` refuses to ADD any workflow once the project has 10+ workflows (updates to existing names still work; removals work). `setValidationCommand` (validation skill) succeeds where `configureWorkflow` fails and produces the same `isValidation` workflow entry in `.replit`.

**Why:** Hit 2026-08-10 while adding the automotive sag-rubric gate — project already had 15 workflows, every add was rejected with "Workflow limit exceeded (15/10)". Removing `plumbing-sims` didn't help because re-adding was still blocked; only `setValidationCommand` got the gate registered.

**How to apply:** When adding a new CI-style test gate, use `setValidationCommand`, not `configureWorkflow`. Chain sibling self-running test files with `&&` into one gate (e.g. `trade-sims` runs plumbing flow-solver + backflow-rubric + automotive sag-rubric) instead of one workflow per test file — slots are scarce and each gate costs one.
