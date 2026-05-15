# Memory Archive

Stale-but-permanent reference material moved out of `replit.md` to keep the active memory lean. **Nothing here is deleted** — it is preserved here in full so future sessions can recover the full record if needed. `replit.md` retains one-line pointers back to entries here.

Last updated: 2026-05-15 PM.

---

## A1. Vann Collaboration Kit — full build detail (May 14, 2026)

**Status:** Built, shipped, in use. Active short-form summary in `replit.md` is sufficient for normal session work; reach for this entry when modifying the kit itself.

- **Docs:** `docs/partners/Vann-Vanntastic-Strategy-Memo.md` + `docs/partners/Vann-Meeting-Brief.md`
- **Pages:** `/partners/vann-hub`, `/partners/family-program-tracker`, `/partners/rfp-storyteller`
- **Schema (7 tables in `shared/schema.ts`):** `community_partner_orgs`, `households`, `household_members`, `community_programs`, `program_enrollments`, `program_attendance`, `community_services`
- **Routes:** `server/community-program-routes.ts`
- **Seed:** `server/seed-vann-demo.ts` (idempotent, runs on boot; logs `[seed] Vann demo seeded: sistahs-cwt, iasis-ccc`)
- **Sidebar group:** `communityPartnersItems` in `app-sidebar.tsx`
- **Leave-behind PPTX:** `scripts/generate-vann-leavebehind-pptx.ts` → `dist/Vann-Collaboration-LeaveBehind.pptx`
- **Two anchor RFPs in storyteller:** SAMHSA Minority BH (federal scaling-up) + Wichita CDBG Public Services (local scaling-out).
- **The three entities at the table:**
  1. **Sistahs Can We Talk Inc.** — KS 501(c)(3) since 2015; primary KS-side grant applicant; Dr. J. Michelle Vann Founder & President; 29th & Grove Wichita; BIPOC women's health, Healthy Me Initiative, free cancer screenings, youth mentoring, digital storytelling.
  2. **Iasis Christian Center** — Pentecostal/Apostolic church, 37+ yrs; Sr Pastor William Vann (spouse) + First Lady Michelle Vann; Wednesday youth programs (Joshua Generation 12+ / Academy of Excellence ≤11, Wed 5:30–7pm w/ meal & transport). **NEVER list as City of Wichita grant applicant without spouse-relationship COI on the face of the application.**
  3. **Vanntastic Solutions LLC** — for-profit executive wellness coaching + speaking + books (*Healthy Plates*, *Stop the Merry-Go-Round*, *Help Along the Journey*, *From Supporting Role to Leading Lady*); never an applicant on nonprofit/government grants.
- **Dr. Vann's affiliations that change strategy:** Sedgwick County Mental Health Advisory Board seat (opens SAMHSA + county discretionary), KSUN Radio 95.9 host, Tabor College Wichita Adjunct, Wichita Public Schools 20-yr veteran, Greater Wichita Ministerial League, WeKan, Health & Wellness Coalition of Wichita, Anthropocene Alliance.
- **Origin of the request (Dr. Vann email, May 13, 2026):** *"Something similar to what you showed for our youth program. I want to be able to track attendance, family structure, and services the families are engaged in."* Pivot from child-protection lens to community-asset lens — family is the unit, not the individual.
- **Lesson:** Dr. Vann has NEVER discussed foster youth with the user. Prior memory falsely claimed she had. Stay in her confirmed lane (wellness coaching, behavioral engagement, women's mindset) until user explicitly opens new topics. General rule: when memory says "user X expressed interest in Y," treat it as a hypothesis to verify with user, not a fact to act on.

---

## A2. Anika Amie ≠ TCAF principal (May 12, 2026)

Name was embedded in inherited RWJF draft + `STRATEGIC-INTELLIGENCE-PLAYBOOK.md` attribution + `server/rag-engine.ts:670` source citation as "TCAF Founder/ED." User does not know this person. RWJF draft quarantined with DO-NOT-USE banner; playbook + RAG stripped of false attribution; principle preserved.

**Permanent rule:** before treating ANY inherited grant draft as TCAF voice, run `rg -i "founder|executive director|project director|principal investigator|applicant name"` and verify every named person is a known TCAF principal.

---

## A3. SafeReport upgrade detail (May 15, 2026 — live at safereports.net)

No longer just mandatory-reporter incident tracking. Now **"Compliance-Grade AI for Clinical Settings"** — Clinical Decision Support (CDS) for behavioral-health workflows, FHIR + CDS Hooks healthcare interop, 0 PHI bytes egressed, HITL default-on, 100% cited recommendations, validated longitudinal screening (PHQ-9/GAD-7/C-SSRS/PCL-5/ACES), 50-state mandatory-reporter coverage, free-forever tier.

**Now belongs in the BH stack alongside Whole-Person Health, not just in the child-welfare stack.**

Files touched:
- `server/grant-routes.ts` — PLATFORM_CAPABILITIES BH + Child & Family Safety areas, PLATFORM_DIRECTORY, TIER1_KEYWORDS added: "clinical decision support", "cds hooks", "fhir", "phi-safe", "human-in-the-loop", "longitudinal screening", "compliance-grade ai"
- `server/ecosystem-connector.ts` — row updated
- `docs/ecosystem-catalog.md` — entry updated

---

## A4. EIN — full incident history (May 12 + May 15, 2026)

**Final truth (primary-source verified 2026-05-15):** EIN is `41-3618003`. Verified from:
- IRS EIN Assignment PDFs in `attached_assets/The_Collaborative_Advocate_EIN_Nonprofit_IRS_*.pdf` (dated 1/14/26 3:51 PM)
- SAM.gov entity record
- Swyft Filings business record
- IRS sa.www4.irs.gov screenshots (user-supplied 2026-05-15)

All four agree on `003`.

**May 12 sweep (WRONG):** Agent replaced `41-3618003` → `41-3618503` across ~61 files claiming the `003` was a typo and `503` was correct per "IRS Letter 947." Agent never opened the IRS PDFs. The PDFs said `003` all along. This sweep was the error.

**May 15 sweep (CORRECTION):** Agent reverted `41-3618503` → `41-3618003` across 72 files (count grew between sweeps as new content was authored using the wrong number). `attached_assets/` left untouched both times.

**Funder-side implications:** Any grant submitted before May 12 with EIN `41-3618003` was CORRECT. Any grant drafted or submitted between May 12 and May 15 with EIN `41-3618503` was WRONG and may need correction. Specific checks:
- **City of Austin AEI FY26** — submitted, verify which EIN appeared on the submitted PDF in AustinFirst portal
- **TWC RFA 32026-00162** — FORM-A-APPLICATION submitted, verify EIN on submitted Form A
- **Spencer Foundation Narrative** — check submission status
- **St. David's WAB2 LOI** — submitted via GivingData 4/27/2026 (before May 12 sweep, so likely correct `003`)
- NSF / DOL / CDMRP / RARE / Borealis / RWJF drafts — drafts only, no correction needed.

**Live public-facing sites:** ThriveUp Academy pages (`landing.tsx`, `grant-command-center.tsx`, etc.) carried wrong `503` for 3 days between sweeps; now correct. M2C / vetmissiontransition.com (separate Replit project) was never touched by either sweep — its `003` has been correct continuously.

**Why this matters:** The May 12 "correction" cited a primary source (Letter 947) that nobody had actually read. The IRS PDFs were on disk the whole time. Permanent lesson: always open the actual file before claiming a typo. Never trust prior memory's claim of verification — verify the verification. (See Iron Rule extensions in `replit.md`.)

---

## A5. Candid (free tier) workflow (May 12, 2026)

User directive — use Candid free tier (candid.org). First priority is claiming TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). NO API access on free tier → no automated wiring into `server/grant-routes.ts` discovery engine; manual RFP Bulletin only. Full workflow detail in `docs/active-commitments.md` "Candid (free tier)" section.

---

## A6. P-L09 & P-L10 — engineering gotchas (still active)

These remain referenced in `.agents/skills/map-gap/lessons-learned.md` and are kept here for retrieval convenience.

- **P-L09 — `pptxgenjs` is CommonJS-default-export.** Under tsx-ESM, `import PptxGenJS from "pptxgenjs"` → `TypeError: PptxGenJS is not a constructor`. Fix:
  ```ts
  import { createRequire } from "node:module";
  const require = createRequire(import.meta.url);
  const PptxGenJS = require("pptxgenjs");
  ```
- **P-L10 — `req.params` typed `string | string[]`.** Destructuring breaks Drizzle `eq()` overload. Always coerce: `const agencyId = String(req.params.agencyId);`.
