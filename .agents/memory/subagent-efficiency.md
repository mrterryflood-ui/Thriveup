---
name: Subagent efficiency doctrine
description: How to run parallel subagents without timeout waste and redundant exploration cost.
---
Rule: pre-explore ONCE before spawning build subagents. Exploration inside a build subagent adds 2-4 min per agent with no code output for that time. One fast explore subagent returning exact file:line pointers pays for itself immediately.
**Why:** Multiple build waves timed out (300s) because each subagent spent its first half exploring before writing code. The user pays per token and per minute.
**How to apply:**
1. Run ONE explore subagent first: exact file paths, schema field names, existing patterns, route URLs.
2. Pass those exact paths/patterns to every build subagent — zero exploration budget for them.
3. Use 600s timeout on waitForJob for large build subagents, not 300s default.
4. Do NOT have build subagents run full `tsc --noEmit` — that costs 30-60s each. Main agent runs tsc ONCE at the end.
5. Scope each build subagent to 1-3 tightly related files. "Build X, Y, Z, register in routes, update sidebar, add client page, write tests" = one agent timing out. Split it.
6. DB migrations: drizzle-kit push needs TTY. Write a `scripts/migrate-*.ts` using raw `db.execute(sql\`...\`)` and run with npx tsx from workspace root (NOT /tmp).
