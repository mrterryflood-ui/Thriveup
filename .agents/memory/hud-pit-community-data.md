---
name: HUD PIT nationwide community data
description: hud_pit_counts dataset + public /community-data lookup; import quirks, refresh rules, honest-labeling constraints
---

# HUD PIT Nationwide Community Data

- Dataset: `hud_pit_counts` — 6,884 rows, all 385 CoCs, 2007–2024, from the official huduser.gov "PIT Counts by CoC" AHAR companion workbook. Provenance label on every row; import is all-or-nothing transactional.
- Public surface: `/community-data` page + `/api/community-data/pit/*` (search by name/state/ZIP, per-CoC trend) + `POST /api/community-data/research` (Perplexity Sonar, refuses uncited answers, 10/hr/IP).
- Staff refresh: `POST /api/community-data/pit/refresh` — huduser.gov-only https allowlist, `redirect: "manual"` (SSRF: a redirect from an allowlisted host can point anywhere — never follow), 60MB cap, 60s timeout.

**Import quirks (cost real debugging time):**
- huduser.gov blocks plain fetch/curl — needs a browser User-Agent.
- `.xlsb` under tsx ESM: must use `XLSX.read(readFileSync(path))`, not `XLSX.readFile()`.
- Sheet names are years; column headers sometimes suffixed ", YYYY". Parser must abort (not skip) on unrecognized rows that carry count data; permitted non-data rows: blank, "Total", paragraph-length footnotes.
- Unaccompanied-youth counts only exist from 2015 — earlier years are legitimately null, surface that on any chart.

**Why:** anti-fabrication doctrine — official figures only, cited, with vintage shown; UI copy must not claim "present" currency beyond the latest imported year (label the latest data year dynamically).

**How to apply:** any new consumer of this table (Navigator, conductor engines, reports) should cite "HUD PIT Estimates by CoC, huduser.gov" and pass through the null-vs-zero distinction untouched.
