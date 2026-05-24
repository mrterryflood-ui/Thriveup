# Session Log Format

One file per session. Append-only. Name: `YYYY-MM-DD.md` (use the date the session ended).

If multiple sessions happen in one day, append to the same file with a new `## Session N — HH:MM CT` header.

## Required sections per session

```markdown
# Session Log — YYYY-MM-DD

## Context
What the user asked for. 1–3 lines.

## Decisions
- Key calls made this session (architecture, scope, trade-offs)
- Anything the user explicitly chose (with option text if multiple were offered)

## Facts surfaced (new)
- New facts discovered or verified this session that weren't already in memory
- Each one should be **promoted** to the relevant `topics/<x>.md` if it's stable

## Files touched
- List with one-line "what changed" notes

## Open items / next session pickup
- What's still in flight
- What the user is waiting on (deadlines, partner deliverables)

## Iron Rule violations (if any)
- Honest log of any rule slips this session + the correction

## Memory hygiene
- Lines added to which topic files
- Anything promoted from CURRENT.md → archive
- Anything moved from topics/gotchas.md → archive/resolved-gotchas.md
```

## Promotion discipline

The session log captures **everything**. The topic files only get the **stable** subset. Rule of thumb:

- Will this fact still be true in 30 days? → promote to `topics/`
- Is it about today's task only? → leave in `sessions/` and let it cool off into history
- Is it a new gotcha that affects future work? → promote to `topics/gotchas.md` immediately

## Cleanup cadence

- **Weekly:** recompile `CURRENT.md` from the last 7 days of sessions + the topic files
- **Monthly:** sweep `topics/gotchas.md` — move resolved ones to `archive/resolved-gotchas.md` with `resolved YYYY-MM-DD: <why>` markers
- **Quarterly:** topic files over ~300 lines get the oldest stable entries rolled into `archive/A-series.md` with a one-line pointer left behind
