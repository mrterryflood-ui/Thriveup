---
name: Verification resource budget
description: Keep full-project compiler checks and browser/Vite verification from competing inside a constrained workspace.
---

Serialize full-project TypeScript/build work and browser/Vite verification when the container's memory budget cannot safely accommodate both. Cap the compiler below the container limit and keep incremental state in temporary storage for subsequent changed-source checks.

**Why:** A workspace restart interrupted a concurrent full compiler and real-browser pass in an observed 8-GiB container. No causal telemetry survived, so this is a resource-budget precaution rather than a confirmed OOM diagnosis.

**How to apply:** Inspect the actual memory limit, preserve concise verification output outside ephemeral background stdout, run compiler/build first, then start the application and browser checks. Do not rerun unchanged passing checks; resumed work must distinguish interrupted checks from completed proof.