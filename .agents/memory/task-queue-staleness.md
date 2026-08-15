---
name: Task queue can go stale vs live code
description: Before building from a project-task backlog, verify each item against the live codebase — many "open" tasks are often already resolved.
---

When asked to work through a large backlog of proposed project tasks, verify-before-build (dispatch read-only explorers against live code/tests, not just the task text) before writing any code.

**Why:** In one pass across 45 proposed tasks, 30 were already fully implemented in the live codebase (verified with file/line evidence) and 1 had a stale premise (asked to downgrade a model that had already been upgraded past the requested target). Only ~13 were real remaining work. Task descriptions are written once and don't auto-update as other work incidentally resolves them.

**How to apply:** Dispatch parallel read-only explorer subagents grouped by feature area to check each task's actual current state before dispatching build subagents. This avoids redundant work and catches tasks whose premise has been overtaken by other changes.
