---
name: Playwright in this container
description: Worker, memory, and process-lifetime constraints for e2e runs in the Replit workspace.
---
- 1 worker only: 2 workers crash the dev server (ERR_CONNECTION_REFUSED).
- Never run tsc and Playwright concurrently: tsc OOMs (needs 8 GB heap) and kills the Playwright process with it.
- `nohup ... &` and `setsid` launched from a ShellExec command do not survive the call; use ShellExec `run_in_background` for a long gate and poll its log file.
- Registry-driven route walks (200+ routes) are fine in one browser context with chunked tests (~40 routes per test, 3-4 min total).
- Contrast heuristics: an absolutely positioned gradient/photo sibling layer behind hero text must be detected by rect coverage, or every hero text reads as 1:1 against white.
