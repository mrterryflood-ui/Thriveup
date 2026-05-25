# Concept Paper Statistic Audit — "It's No Longer About You"

**Started:** 2026-05-25
**Purpose:** Iron Rule #2 verification pass on every cited number in `01-concept-paper.md` §2-§4 before any federally-submitted Solution Summary.
**Method:** RPLICE-first (per user hint 2026-05-25), then direct primary-source pull for any number RPLICE can't substantiate.

---

## RPLICE-first pass — honest finding (corrected 2026-05-25 by RPLICE itself)

Queried the live RPLICE research library (`salp-science--mrterryflood.replit.app/api/research/search`) for 6 concept-paper topics: child maltreatment fatalities / NCANDS · ACEs / CDC · prefrontal cortex development / parenting · foster youth pregnancy / intergenerational · shaken baby syndrome / abusive head trauma · child neglect prevention / parenting under 26.

**Initial observation: each query returned 20 results, and none were the federal-statistic primary sources the concept paper cites.** Representative top hits were Mersky et al. 2017 (measurement methodology), Barrett et al. 2022 *JAMA Peds* (firearm mortality), Kim 2025 *Trauma Violence Abuse* (poverty-policy scoping review), Bellis 2025 *BMC Public Health* (UK ACEs + poverty), Ovalle 2014 *Injury Epidemiology* (pediatric TBI in adult trauma centers), etc.

**RPLICE itself confirmed the architectural reality** (response 2026-05-25):

> "Literature router is implementation-science scholarly lit, not federal-statistic primary sources. `/api/literature` wraps PubMed, NIH iCite, OpenAlex, Crossref, and Springer Nature (`server/literature-routes.ts`, `server/literature-openalex-routes.ts`, `server/literature-crossref-routes.ts`, `server/literature-springer-routes.ts`). Those are journal-article indexes. They return papers about NCANDS / ACE / foster-youth CPS — not the underlying tables. … RPLICE has no primary-source loader for any of the three. I grep'd the codebase: no ncands-loader, no afcars-loader, no cdc-ace-module-loader."

**RPLICE also corrected my "20 results per query" claim** as a misstatement of platform limits. Actual caps in code:
- **PubMed:** default `retmax=50`, server-clamped to 200 (`server/state-loaders/pubmed-loader.ts:96`, `server/literature-routes.ts:94`)
- **OpenAlex:** default `perPage=25`, capped at 200 (`server/state-loaders/openalex-loader.ts:197`)
- **Springer:** `perPage` capped at 100 (`server/literature-springer-routes.ts:71`)
- **Crossref:** similar pattern

If a caller is seeing 20 results that's a client-side default in whatever surface they're using, **not** a platform cap. The salp-science surface I hit returns 20 by default. Logging this so the limitation isn't misstated in any future Solution Summary.

**Adjacent loaders that DO exist** but are not for these stats:
- `server/state-loaders/foster-policy-levers-loader.ts` — six federal foster-care policy levers as statute facts (Fostering Connections Act, FFPSA, FYI, Chafee/ETV, Medicaid-to-26, FYI centralized application). Useful for §6 policy-context narrative, NOT for AFCARS state rates.
- `server/cdc-places-loader.ts` — CDC PLACES place-level public-health data. Useful for community-context demographics, NOT for ACE prevalence.

**Final verdict (architecturally correct):** RPLICE is a **scholarly literature router** + **implementation-science framework engine** (CFIR / RE-AIM / EPIS / MAP-GAP). For federal-statistic primary sources, RPLICE confirmed the exact pull paths:

1. **NCANDS fatality counts** → Children's Bureau *Child Maltreatment 2022/2023/2024* report (HHS/ACF) directly: PDF + supplementary data tables. No RPLICE shortcut.
2. **CDC ACE percentages** → BRFSS ACE Module via CDC BRFSS or CDC WONDER (state-by-state varies by year of module fielding). No RPLICE shortcut.
3. **Foster-youth CPS rates** → AFCARS Foster Care File via NDACAN (DUA required for restricted files; public AFCARS reports are free). No RPLICE shortcut.

RPLICE belongs in the Solution Summary §4 evaluation-design section (CFIR / RE-AIM / EPIS / MAP-GAP for implementation rigor) — not in §2 problem-statement citations.

---

## Statistic ledger — what must be primary-source verified before submission

Every row here corresponds to a claim in `01-concept-paper.md`. Status legend:
- 🔴 **UNVERIFIED** — claimed number, source named, primary source not yet opened this session
- 🟡 **PLAUSIBLE / NEEDS QUOTE** — number is consistent with public reporting; needs verbatim quote from cited source for federal submission
- 🟢 **VERIFIED** — primary source opened, number matches, quote captured in this doc

### §2.1 Child fatalities from parents

| # | Concept-paper claim | Cited source | Verification primary source (to open) | Status |
|---|---|---|---|---|
| 1 | 1,968 children killed by abuse/neglect (2023) | HHS NCANDS | *Child Maltreatment 2023* report, ACF Children's Bureau PDF (annual report typically released ~14-16 months after the data year — verify 2023 release status; 2022 may be most recent published) | 🔴 |
| 2 | 5 children dying per day | American SPCC | americanspcc.org statistics page | 🔴 |
| 3 | 81.5% of fatalities involve at least one parent | NCANDS 2022 | *Child Maltreatment 2022* PDF (perpetrator chapter) | 🔴 |
| 4 | 50-60% of deaths never recorded as child abuse | CDC estimate | CDC source citation needed — Schnitzer/Ewigman line of research or CDC fatality surveillance commentary | 🔴 |
| 5 | 30% increase in fatality rate over last decade | USAFacts | USAFacts child welfare page | 🔴 |
| 6 | 66.9% of fatalities are children under 3 | NCA | National Children's Alliance statistics page | 🔴 |
| 7 | 44.7% are infants under 1 | American SPCC | americanspcc.org | 🔴 |
| 8 | 78% of fatality victims suffered neglect | NCANDS 2022 | *Child Maltreatment 2022* PDF | 🔴 |
| 9 | "Child maltreatment is the second leading cause of death in children younger than age one" | Unattributed in concept paper | Needs explicit citation OR remove from federal submission | 🔴 ATTRIBUTION GAP |

### §2.2 Perpetrator demographics

| # | Claim | Source | Primary source | Status |
|---|---|---|---|---|
| 10 | Perpetrators under 18: 1.9% | NCANDS Child Maltreatment 2022 | PDF perpetrator chapter | 🔴 |
| 11 | 18-24: ~15-18% (range — note the imprecision) | NCANDS 2022 | PDF perpetrator chapter — pull exact figure | 🔴 (the range suggests author estimated rather than pulled exact — must replace with exact number) |
| 12 | **25-34: 39.9% (largest single group)** | NCANDS 2022 | PDF perpetrator chapter | 🔴 — keystone claim; verify with precision |
| 13 | 35-44: 28.9% | NCANDS 2022 | PDF perpetrator chapter | 🔴 |
| 14 | 45+: 13-14% (range) | NCANDS 2022 | PDF perpetrator chapter | 🔴 (range — same caveat as #11) |
| 15 | 76-91% of perpetrators are parents (range) | NCANDS | PDF perpetrator chapter | 🔴 (range across years? clarify or pull single year) |
| 16 | 51.1% female / 47.7% male (= 98.8% — implies 1.2% unknown or other) | NCANDS | PDF perpetrator chapter | 🔴 |

### §2.3 Prefrontal cortex / brain science

| # | Claim | Source | Primary source | Status |
|---|---|---|---|---|
| 17 | PFC fully matures at ~25-26 | Implied/general | Lebel & Beaulieu 2011 *J Neuroscience*, Sowell et al. 1999 *Nature Neuroscience*, Giedd et al. 1999 *Nature Neuroscience* — the canonical maturation citations | 🟡 well-established neuroscience consensus; cite at least 1-2 canonical papers in Solution Summary not just "neuroscience now tells us" |
| 18 | Abusive Head Trauma "overwhelmingly triggered by frustration over crying" | CDC AHT / NCSHF | CDC Abusive Head Trauma fact sheet; Period of PURPLE Crying literature | 🔴 |

### §3.1 ACEs downstream risk

| # | Claim | Source | Primary source | Status |
|---|---|---|---|---|
| 19 | Drug addiction 64% attributable to childhood maltreatment | CDC | Felitti et al. 1998 *Am J Prev Med*; CDC ACE follow-on studies — population-attributable-fraction (PAF) figures | 🔴 PAF claims need careful primary-source verification — these are derived estimates, not raw study findings |
| 20 | Depression 54% | CDC | Same | 🔴 |
| 21 | Suicide attempts 67% | CDC | Same — likely from Dube et al. 2001 *JAMA* or follow-on | 🔴 |
| 22 | 80% meet criteria for any psychological disorder by age 21 | "Longitudinal studies" — VAGUE | Needs specific citation (likely Copeland/Costello Great Smoky Mountains Study or similar) | 🔴 ATTRIBUTION GAP — vague "longitudinal studies" insufficient for federal submission |
| 23 | Reduction in life expectancy up to 20 years | CDC ACE Study | Brown et al. 2009 *Am J Prev Med* (ACE + early mortality) — the "20 years" figure is from this paper | 🔴 |
| 24 | ~30% of abused children later abuse their own children | NCA | National Children's Alliance — but this is a contested figure; original Kaufman & Zigler 1987 challenged the 30% with a meta-analytic 25-35% range; cite original meta-analysis carefully | 🔴 CARE: contested literature |

### §3.2 ACEs prevalence

| # | Claim | Source | Primary source | Status |
|---|---|---|---|---|
| 25 | 61% of US adults report ≥1 ACE | CDC | CDC BRFSS ACE module data — confirm year | 🔴 |
| 26 | 16% report ≥4 ACEs | CDC | CDC BRFSS ACE module data | 🔴 |
| 27 | Adults with 4+ ACEs 4-12x more likely (suicide/SUD/depression) | CDC | Felitti 1998 + ACE follow-ons | 🔴 |
| 28 | "Up to 1.9 million heart disease cases and 21 million depression cases annually" attributable to ACEs | CDC | CDC *Vital Signs* ACE November 2019 — confirm | 🔴 |

### §4 Foster care → child neglect pipeline

| # | Claim | Source | Primary source | Status |
|---|---|---|---|---|
| 29 | Former foster youth become pregnant at 2x the rate of non-foster peers by age 19 | Generic | Likely Midwest Evaluation of Adult Functioning of Former Foster Youth (Courtney et al.) | 🔴 |
| 30 | By 21, ~50% of former foster youth have a child; by 26, ~70% | Generic | Midwest Evaluation (Courtney et al.) | 🔴 |
| 31 | Former foster youth 3-5x more likely to have CPS investigation involving their own child | Generic ("studies have found") | Needs specific citation — likely Putnam-Hornstein or Eastman studies on intergenerational maltreatment | 🔴 ATTRIBUTION GAP — "studies have found" insufficient for federal |

---

## Headline findings (honest, before primary-source pull)

1. **The thesis is sound and well-supported by the federal literature** — PFC maturation by 25-26 is consensus neuroscience; ACEs cascade is CDC-foundational; foster→intergenerational maltreatment is well-documented; 25-34 being the largest perpetrator cohort is consistent with multiple NCANDS years.
2. **But the concept paper has 6 attribution gaps that would not survive federal-submission scrutiny:**
   - #9 "second leading cause of death under 1" — unattributed
   - #11, #14 — ranges instead of exact figures (suggests author estimate, not direct pull)
   - #15 — range across years (clarify)
   - #18 — AHT crying-trigger claim — needs CDC AHT fact sheet citation
   - #22 — "longitudinal studies" without naming them
   - #31 — "studies have found" without naming them
3. **3 claims need careful handling in the contested-literature sense:**
   - #19-#21 PAF figures (64% / 54% / 67%) — these are population-attributable-fraction estimates with confidence intervals; federal reviewers will check methodology
   - #24 "~30% intergenerational transmission" — this number has been refined since the 1987 Kaufman & Zigler meta-analysis; cite the actual study with the range it offers
   - #20-year life-expectancy reduction (#23) — Brown et al. 2009 is the canonical source; cite it directly

---

## Recommendation for Solution Summary drafting

1. **For the §2 problem statement in the eventual Solution Summary:** Use **fewer, more carefully verified statistics** rather than the 25+ in the concept paper. ARPA-H reviewers respond to precision and primary-source citations, not volume. Pick 8-10 numbers that are (a) directly traceable to a federal primary source, (b) recent (2022 or later), (c) verbatim quotable. Cut anything that requires a range or "studies have found."
2. **For the PFC neuroscience hook (§2.3):** Cite Lebel & Beaulieu 2011 OR Giedd et al. 1999 OR Sowell et al. 1999 directly. The hook is too important to leave on "neuroscience now tells us."
3. **For the intergenerational claim (§4):** Cite Courtney et al. *Midwest Evaluation* directly. It's the canonical source for former-foster-youth outcomes including parenting.
4. **For the §3 ACE cascade:** Cite Felitti et al. 1998 + Brown et al. 2009 + CDC *Vital Signs* 2019 directly. These three together cover the entire cascade with verifiable PAFs.

---

## Next actions before Solution Summary submission

1. Pull NCANDS *Child Maltreatment 2022* PDF (likely most recent published; verify 2023 release status); extract verbatim quotes for rows #1-3, #6-8, #10-16
2. Pull CDC *Vital Signs* ACE November 2019; extract rows #25-#28
3. Pull Brown et al. 2009 abstract + table for row #23 (20-year life-expectancy)
4. Pull Felitti et al. 1998 abstract for rows #19-#21 PAF baseline
5. Confirm or replace the "second leading cause of death under 1" claim (#9) with attributable citation
6. Pull Courtney *Midwest Evaluation* for rows #29-#31
7. Pick 1-2 PFC maturation citations from Lebel/Beaulieu/Giedd/Sowell
8. Replace all "studies have found" / "longitudinal studies" placeholders with named citations OR cut the claims

Estimated effort: 2-3 hours of focused work with the actual PDFs. Should be done in a dedicated session before any Solution Summary text is drafted, so that the §2 problem statement is built from verified quotes, not from concept-paper paraphrase.
