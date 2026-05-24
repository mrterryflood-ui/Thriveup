# Agent Memory — INDEX (Retrieval Router)

**Read this at session start.** It tells the agent where everything lives and what to load when.

---

## Read order

| When | Read |
|---|---|
| **Session start** | `replit.md` → `docs/agent-memory/INDEX.md` (this file) → `docs/agent-memory/CURRENT.md` → most-recent session log in `sessions/` |
| **Task start** | Only the relevant `topics/<x>.md` file (or `archive/A-series.md` if the task references an A-number) |
| **Task end** | Append to `docs/agent-memory/sessions/YYYY-MM-DD.md`. Promote stable facts into the right `topics/` file. |
| **Weekly (or when CURRENT.md drifts)** | Recompile `CURRENT.md` from `sessions/` + `topics/`. |
| **Before external work** | `npx tsx scripts/memory-health.ts` — must exit 0. |

## File layout

```
replit.md                        ← rules + pointers ONLY (~40 lines, never facts)
docs/agent-memory/
  INDEX.md                        ← this file (retrieval router)
  CURRENT.md                      ← distilled active memory (100–200 lines max)
  sessions/
    YYYY-MM-DD.md                 ← per-session log, append-only
    README.md                     ← session log format guide
  topics/
    grants.md                     ← grant strategy, discovery, pipeline, submission rules
    partners.md                   ← TCAF facts, two-entity strategy, teaming doctrine + rosters
    gotchas.md                    ← live gotchas (resolved ones move to archive)
    architecture.md               ← stack, codebase scale, where things live, decisions
    ecosystem.md                  ← 15 public platforms + caveats
  archive/
    A-series.md                   ← chronological A1–A27+ historical (was docs/memory-archive.md)
    resolved-gotchas.md           ← gotchas that no longer apply (with resolution date)
```

## Topic → file map (recall router)

| If the task touches… | Open |
|---|---|
| Grants / pipeline / fit scores / discovery / submissions / Sedgwick / Lake Worth / NSF / Promise Neighborhoods / SSG Fox | `topics/grants.md` |
| Partners / teaming / Hargrave / Love / Vann / Sisnett / TCAF identifiers / ISS LLC | `topics/partners.md` |
| Anti-patterns / things-to-avoid / load-bearing rules | `topics/gotchas.md` |
| Codebase structure / page locations / route patterns / DB tables / stack | `topics/architecture.md` |
| Ecosystem platforms / TYT / WPH / LifeBridge / SafeReport / Civic Signal | `topics/ecosystem.md` |
| Historical A1–A27 decisions (referenced by number) | `archive/A-series.md` |

## What goes where (write router)

| Fact type | Destination |
|---|---|
| Iron Rule change | `replit.md` (and recompile agent knowledge) |
| Decision / new fact discovered this session | `sessions/YYYY-MM-DD.md` first |
| Stable fact (won't change next week) | Promote from session log → `topics/<x>.md` |
| Anti-pattern / new gotcha | `topics/gotchas.md` |
| Numbered milestone with cross-references (A-series) | `archive/A-series.md` |
| Gotcha that no longer applies | Move from `topics/gotchas.md` → `archive/resolved-gotchas.md` with resolved-YYYY-MM-DD marker |

## Forbidden

- Adding facts to `replit.md`. Rules and pointers only.
- Letting `CURRENT.md` exceed ~200 lines. Recompile it.
- Deleting from `sessions/` or `archive/`. Append-only.
- Skipping the session-end deposit. The whole system fails without it.
