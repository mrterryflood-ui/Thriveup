# ThriveUp Partner Onboarding Walkthrough

**Audience:** Dr. Flood + every affiliated entity (HIS, Love Clinic, Vanntastic, Sistahs CWT, ISS LLC) who needs to set up their organization, upload supporting documents, and start tracking grants they are pursuing.

**Time required:** 10–15 minutes per organization.

---

## Live link to share with every partner

Send this single URL to anyone you want self-serving on the platform — Hargrave, Dr. Love, Dr. Vann, anyone else. It's smart: if they're already signed in it skips the walkthrough and routes them to the right place automatically.

> **https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/partners/join**

(Once you point a custom domain at the published app, swap the host for that — the path `/partners/join` stays the same.)

You can also send the short version: **`/join`** off the same host.

---

## The 3-step self-serve flow (what every partner does)

### Step 1 — Sign in

- Open the partner link above.
- Click **"Sign in"** (top right or the big CTA on the page).
- Replit Auth handles it — no new password to remember.
- After login they're sent straight to the org wizard.

Direct link if you'd rather skip the landing page: [**/api/login**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/api/login?returnTo=/onboarding/org)

### Step 2 — Create the organization profile (5 min)

The wizard at [**/onboarding/org**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/onboarding/org) walks them through:

1. **Identity** — legal name, EIN, 501(c)(3) status.
2. **Mission** — one paragraph + the elevator pitch / capability statement text.
3. **Focus areas** + **populations served** (pick from the lists).
4. **Geography** — state + counties served.
5. **Budget range** + website URL.

Click **Create profile**. The wizard sends them straight to the document library (Step 3).

### Step 3 — Upload supporting documents

Lands automatically on [**/settings/documents**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/settings/documents).

For each document:
1. Pick the **entity** it belongs to (HIS, Love Clinic, Vanntastic, Sistahs CWT, TCAF, ISS LLC, or type a custom name).
2. Pick the **document kind** (see checklist below).
3. Drag and drop up to **20 files at once** (50 MB each).
4. Optionally tag with a note.

Files upload directly to private object storage and stay scoped to that organization. Only the org owner can edit, replace, or delete them.

---

## What every entity should upload (document checklist)

| Document kind                 | Required? | Notes                                                                                 |
|-------------------------------|-----------|---------------------------------------------------------------------------------------|
| Capability statement          | **Yes**   | 1–2 page PDF. Used in every joint proposal.                                            |
| 501(c)(3) determination letter | If 501c3 | Letter 947 for TCAF. Skip for for-profit entities.                                    |
| W-9                           | **Yes**   | Required by almost every funder + government contract.                                 |
| Certificate of insurance (COI)| **Yes**   | Most government RFPs require general liability + workers' comp.                        |
| Past performance writeups     | **Yes**   | At least 3 — projects of similar size or scope.                                        |
| Resume / CV — key staff       | **Yes**   | At minimum the PI / Project Director.                                                  |
| Professional licenses         | If applicable | MD/DNP/NP/LPC/etc. Required for Love Clinic, Sistahs CWT clinical staff.            |
| Org chart                     | Recommended | Helpful for any teaming RFP.                                                          |
| Audited financials            | If 501c3 + over the threshold | Required for federal pass-through > ~$750K.                                          |
| DUNS legacy reference         | Skip      | Replaced by UEI — enter the UEI in the Org Profile instead.                            |

**Tag each file with its entity** so when you're assembling a teaming submission for HIS + TCAF + Love Clinic, you can filter the library by entity and pull the right set.

---

## Federal contracting identifiers — fill these in once

At [**/settings/organization**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/settings/organization), scroll to the **Federal contracting identifiers** card. Each entity needs:

- **UEI** (Unique Entity ID, 12-char) — pulled from SAM.gov.
- **CAGE code** (5-char) — pulled from SAM.gov.
- **SAM status** — Active / Expired / Not registered.
- **NAICS codes** — comma-separated. Pick the ones you can actually deliver under. Common ones we use:
  - `611430` Professional & Management Development Training
  - `611699` All Other Misc Schools & Instruction
  - `621498` All Other Outpatient Care Centers
  - `624190` Other Individual & Family Services
  - `541611` Administrative Management Consulting
- **PSC codes** — comma-separated. Used by federal contracting:
  - `R408` Program Management / Support Services
  - `R499` Other Professional Services
  - `Q201` Medical — General Health Care
  - `U008` Education / Training Services

Save once and these auto-flow into every proposal export.

**Already on file for our entities (do NOT re-key — verify only):**
- **TCAF** — UEI `KDDVD1FGLW35` · CAGE `209N1` · SAM Active to 2027-05-06.
- **ISS LLC** — UEI `C7YDV3P8EHL7` · CAGE `9VKK3` · SAM Active to 2027-03-30.

---

## Loading the grants you're pursuing

1. Open [**/grants**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grants) — Live Grant Opportunities.
2. The fit-score is calculated against your org profile, so the higher the score, the better the match for your mission + populations + geography.
3. On any grant card, click the green **"Pursue"** button. It flips to a **"Tracking"** badge.
4. The grant now lives on [**/my-grants**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/my-grants) — My Grants & Win Rate.

From `/my-grants` you can:
- Mark stage (Researching → Drafting → Submitted → Won / Lost).
- See win rate by funder, by stage, by month.
- Open the AI proposal drafter for any pursued grant.

To remove a grant from your pipeline, click **"Tracking"** again — it toggles back to **"Pursue"**.

If you can't find a specific RFP in the live feed, use [**/grants/search**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grants/search) or paste the source URL into [**/grants/manual-add**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grants/manual-add).

---

## Loading the partners you're teaming with

The pattern is: **each partner self-onboards.** You do not enter their data for them.

For each entity in your network:

1. Send them the partner link: `…/partners/join`.
2. They sign in, complete the org wizard, and upload their docs.
3. Once they have a profile, head to [**/teaming-network**](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/teaming-network) — Teaming Network & Capabilities — to see them and add them to a teaming arrangement on a specific RFP.

For any RFP you're pursuing as a team, open the grant on `/my-grants`, click **"Build teaming arrangement"**, and pick the partner entities + assign lanes. Their org profile + capability docs auto-attach.

---

## Where everything lives (sidebar map)

Every logged-in user sees a **My Organization** group at the top of the sidebar (right after Programs). Two entries:

- **Organization Profile** → [/settings/organization](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/settings/organization)
- **Document Library** → [/settings/documents](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/settings/documents)

Just below it, the **Grant Engine** group has everything funder-facing:

- **This Week (Monday Brief)** → [/this-week](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/this-week)
- **Live Grant Opportunities** → [/grants](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grants)
- **My Grants & Win Rate** → [/my-grants](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/my-grants)
- **Winning Proposals Library** → [/won-proposals](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/won-proposals)
- **Teaming Network & Capabilities** → [/teaming-network](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/teaming-network)
- **RFP-Driven Writer** → [/grant-narrative](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grant-narrative)
- **RFP Fidelity Engine** → [/rfp-fidelity](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/rfp-fidelity)
- **Application Tracker** → [/grants/applications](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grants/applications)

---

## A 10-minute first session, step by step

For a brand-new partner (e.g., Eric Hargrave for HIS):

1. **0:00** — Click the partner link.
2. **0:30** — Sign in (Replit Auth, one click).
3. **1:00** — Org wizard: HIS legal name, EIN, mission, focus = "Government contracting / compliance / program management," populations = "All," state = KS, counties = Sedgwick, budget = $100K–$500K, website.
4. **6:00** — Lands on Document Library. Drop in: capability statement, W-9, COI, 3 past-performance writeups, Eric's resume.
5. **9:00** — Hop to Organization Profile, add UEI + CAGE + SAM status + NAICS (`541611`, `611430`) + PSC (`R408`, `R499`).
6. **10:00** — Done. Open `/grants`, click Pursue on every Sedgwick / federal RFP in HIS's lane. They now show on HIS's `/my-grants` board.

---

## Day-to-day workflow once everything is loaded

**Every Monday morning** — open [/this-week](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/this-week) for the Monday Brief: grants closing in the next 14 days, decisions pending, ship targets.

**When a new RFP drops** — find it on [/grants](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/grants), click **Pursue**, then open [/rfp-fidelity](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/rfp-fidelity) → pick the grant → run the **compliance matrix extractor** → use the **rubric-aware drafter** to write each Section M paragraph against the funder's own scoring criteria.

**When teaming on an RFP** — open the grant on `/my-grants`, build the teaming arrangement, pick the entities (TCAF + HIS + Love Clinic, etc.), and their docs auto-attach. Hands off, no chasing files.

**When a decision comes back** — flip the stage on `/my-grants` (Won / Lost). Win rate updates automatically.

---

## Troubleshooting

**"I signed in but I don't see Organization Profile in the sidebar."**
→ Hard refresh (Cmd-Shift-R / Ctrl-Shift-R). The sidebar group only renders for authenticated sessions.

**"I clicked Pursue and got an error."**
→ Sign-in prompt = your session expired. "Set up your org first" = you haven't completed [/onboarding/org](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/onboarding/org) yet.

**"My document upload failed at 50 MB."**
→ Per-file cap is 50 MB. Split a large PDF (combined past-performance writeups, full audited financials) into separate uploads.

**"I'm hitting an upload rate limit."**
→ 60 signed upload URLs per user per hour. If you genuinely need more, pause and resume after the hour rolls — or batch your remaining files into a tighter set.

**"A partner uploaded the wrong file to the wrong entity."**
→ Only the partner who owns that org can delete it. They open [/settings/documents](https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev/settings/documents), filter by entity, and delete.

**"I want to swap teaming partners on a specific RFP."**
→ `/my-grants` → open the grant → edit the teaming arrangement. Teaming is per-proposal, never a standing default.

---

## What's intentionally NOT in this flow

- **You don't upload on behalf of partners.** Each entity self-serves. Send them the link.
- **There's no admin invitation panel.** The partner link is the invitation.
- **There's no global "all docs across all orgs" view.** Each org sees only its own. That's by design — partner docs are their property.
- **You don't manage NAICS / PSC for Love Clinic / HIS / Vanntastic.** Each entity manages their own federal IDs on their own profile.

---

*Generated 2026-05-23. Live host: `55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev`. Swap the host once a custom domain is attached — every path stays the same.*
