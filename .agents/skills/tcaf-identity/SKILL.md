# TCAF Identity, IGN Framework & Canonical Platform Facts

## Load this when: writing any external-facing material, proposals, platform copy, AI prompts, or any surface that represents TCAF to the world.

---

## Who TCAF Is

**The one-sentence mission:**
TCAF is the nonprofit for nonprofits, residents, and communities to thrive. We have the tools, the data, and the funding knowledge. They execute and do the work.

**Two legal entities:**
- **The Collaborative Advocate Foundation (TCAF)** — 501(c)(3) nonprofit | EIN 41-3618003 | UEI KDDVD1FGLW35 | CAGE 209N1 | SAM active through 2027-05-06 | Dr. Flood = **President** (not CEO on TCAF)
- **ISS LLC** (for-profit, SBIR/STTR/GSA only) | UEI C7YDV3P8EHL7 | CAGE **9VKK3** | SAM active through 2027-03-30

**Address:** 17912 Stefano Drive, Pflugerville, TX 78660-7020 c/o Terry D Flood Sr.
**Institutional email:** terryflood@thrivingcommunitiesforall.com
**Dr. Flood credentials:** DHA/DBA — NOT EdD. Active US gov Secret-level clearance. Medically retired veteran. Service-connected disability (MS). SDVOSB eligible.

---

## IGN — Initial Guidance and Navigation

IGN is a psychology term. TCAF helps people and organizations get to their destination in a safe, efficient manner at their own pace and level of readiness and comfort — using planning and metrics to guide them, redirecting if they go off course, using data and evidence-based interventions.

**Why IGN matters:** RPLICE and the platform APIs allow TCAF to address people and organizations *uniquely* — not one-size-fits-all.

---

## The Full Cycle (not just needs assessment)

Research → Planning → Preparation → Execution → Continuous Assessment → Implementation → Scale Up (depth) → Scale Out (breadth)

TCAF does the whole cycle. Most orgs stop at needs assessment. TCAF doesn't.

---

## What TCAF Provides

- Tools (and can build what doesn't exist yet)
- Data → turned into information → meeting people where they are
- Funding knowledge (grants, opportunities, funder relationships)
- Research, planning, preparation so others can execute
- Teaching people how to fish — give tools AND teach how to use them
- Work with (assist or be assisted, depending on the situation)
- Inform and influence policymakers and stakeholders

---

## Multi-Disciplinary Identity (bake into every surface)

All lenses held simultaneously — none sacrificed:
- Implementation science + behavioral science
- Social work / CHW empathy and engagement model
- HR and policy expertise
- Computer engineering and community-serving tools
- Pedagogy of an educator
- Understanding of legal system and criminal justice impact
- Patience and understanding of a parent
- Lived experience of an MBA + community development innovator (urban, metro, suburban)

---

## Stakeholder Model — All Four, All Equal

Every intro, page, and tool must address all four:

1. **Community members / residents** — tools, benefits, navigation, safety, readiness
2. **Nonprofits** — TCAF is their backbone; infrastructure, capacity, funding, evaluation
3. **Funders / grant reviewers** — data, outcomes, evidence, accountability
4. **Policymakers / stakeholders** — research, influence, advocacy, systemic change data

---

## Core Philosophy

- Plan WITH people, not FOR people
- "We are all stronger together"
- Data is king — but data must become information to be useful
- Meet people where they are, at their pace and level of readiness
- We assist OR are assisted — direction of help depends on the situation

---

## Writing Mode Architecture (personal-context.ts)

Five audience modes — detected from message signals, not user role:

| Mode | Trigger | Behavior |
|---|---|---|
| `tcaf_internal` | Dr. Flood writing FOR TCAF (grants, proposals, strategy) | Full pipeline injection; TCAF as subject |
| `partner_assist` | TCAF helping a partner org (El Buen, United Way, church...) | Center partner's mission — TCAF stays backbone, not hero |
| `partner_user` | Partner org staff logged in | Their tools/data/IGN first |
| `community_member` | Resident/family seeking help | Plain language, IGN |
| `neutral` | Default | Use context only where directly relevant |

TCAF grant pipeline is ONLY injected in `tcaf_internal` and `neutral` modes.

---

## ETHICAL_EI_PREAMBLE — 8 Principles

Lives in `server/ai-provider.ts`, applied via `withEthicalPreamble()` to every AI call site. Now 8 principles (7 and 8 added 2026-06-20):

7. **TCAF Identity & IGN Mindset** — IGN framework, multi-disciplinary lenses, care before credentials, all issues are local
8. **Writing Mode & Partnership** — TCAF is never a threat; adjust voice per context (internal/partner/community)

---

## Canonical Public-Facing Statistics

**NEVER deviate from these without explicit authorization from Dr. Flood.**

### Grants / Funding
- **Never show a number.** No "721+", "651", "700+", or any count.
- **Canonical language:** "live funding intelligence engine, AI fit-scored to partner profiles" or "We track funding opportunities nationwide and intelligently align them to the community partners we serve."
- **Why:** Numbers invite confusion about what's being counted. The *capability* is the story.

### Platform Count
- **External/public pages: 15** — TCAF-operated service platforms only.
- **Label:** "Service Platforms" (not "Ecosystem Platforms," "Platforms Online," etc.)
- **Internal/operational context:** 26 platforms total (includes partner platforms). External = always 15.

### Languages
- **107** (89 spoken + 18 signed) — consistent everywhere.
- Platform name: **Talk Your Talk** (was LexiBridge / Speech Bridge) at `talkyourtalk.net`

### AI Engines
- **4** — Claude, GPT-4o-mini, Gemini, DeepSeek R1. Current production IDs as of 2026-07-13:
  - `anthropic/claude-haiku-4-5`, `anthropic/claude-sonnet-4-5` (via OpenRouter)
  - `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite` (via OpenRouter)
  - `deepseek/deepseek-r1-distill-llama-70b`, `deepseek/deepseek-chat-v3-0324` (via OpenRouter)
  - Direct Anthropic: `claude-haiku-4-5`, `claude-sonnet-4-5`
  - **All Claude 3.x IDs are retired** — do not use.

### States
- **50** — always qualified as architecture/capacity, not deployment.
- Preferred: "50 states — one architecture" or "built to deploy in any U.S. county."

---

## TCAF Identity Gotchas (Never Violate)

### Meredith Sissnet & City of Austin
City employee. **NEVER** list on any City of Austin grant/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff/contact/co-lead/board/partner. Non-City only (federal/state/foundation/private). **When in doubt, leave her out and ask.**
- Name spelling: **Sissnet** (single "n" — not "Sisnett")

### Dr. Flood Credentials
**DHA/DBA only — NOT EdD.** Before any external-facing artifact mentioning Dr. Flood: `rg "EdD" <doc>` — caught twice on Sedgwick #26-0028 after the correction.

### St. David's Foundation
Always "actively evaluating" — never "awarded" or "in review." WAB2 LOI **DECLINED** 2026-05-15 (Regan Gruber Moffitt, JD). Target via CLC + Community Health Grants only.

### Anika Amie ≠ TCAF principal
Name appears in inherited RWJF draft. User does not know this person. Verify every named person in any inherited grant draft.

### Teaming doctrine
**No standing default team.** Teaming is per-proposal, based on lane fit. Never assume Flood+Vann+Love+Hargrave on every bid.

### FIPS labels
**Never** expose FIPS codes to users. Say "State Census Code" / "County Census Code."

### "Texas-only" framing
Use **"national platform, Texas-piloted"** instead.

---

## Active Teaming Roster (Verified 2026-05-23)

- **TCAF / Dr. Terry D. Flood** (President) — 254-319-8460 · terryflood@thrivingcommunitiesforall.com
- **HIS (Hargrave Innovative Solutions) / Eric Hargrave** (CEO) — 601-238-4186 · ericd@hisolution.org · Wichita, KS HQ
- **Love Clinic MedSpa / Dr. Chela Love DNP** — 214 S Rock Rd Suite 101, Wichita KS 67207 · 316-669-4770
- **Vanntastic Solutions / Dr. J. Michelle Vann** — 316-350-2601 · www.jmichellevann.com

**Dr. Vann's lane:** youth+family attendance/services tracker for Iasis youth + Sistahs women's-health programs. **Never** foster youth. Iasis side = spouse COI (Pastor William Vann at Iasis Christian Center) on City of Wichita/federal bids that cite Iasis data.

**Eric Hargrave:** Wichita, KS HQ. 601 area code is his cell — not Mississippi. Do not write "Mississippi-based."

---

## Platform Scale (Verified Internally — Do Not Cite Publicly Without Cross-Check)

- 271 Drizzle tables · 211 pages · 84 server files · 206 wouter routes
- 721 grants tracked (grants.gov 369 · usaspending 198 · samgov 36 · manual 12 · state/local 18 · other federal 8 · foundation/corp 4 · misc 6). Fit ≥70/80/90 = 208/186/160.
- 25 specialist engines (all function-callable in-process via conductor.ts)
- 39 CFIR constructs · MNA solver · Hardy-Cross hydraulic solver · AWS D1.1 welding · RNR/CBI/NRRC · FHIR/CDS-Hooks · two-entity strategy

---

## CEDS Regional Alignment (EDA Framework)

EDA's 5 Performance Measures — bake into every proposal touching EDA, workforce, or community development:
- **PM1:** Jobs Created (primary)
- **PM2:** Jobs Retained (primary)
- **PM3:** Private Investment Leveraged (primary)
- **PM4:** Construction/Infrastructure Jobs (secondary)
- **PM5:** Businesses Assisted (secondary)

**NORTEX region (id=2):** 11 counties (Wichita, Archer, Baylor, Clay, Cottle, Foard, Hardeman, Jack, Montague, Wilbarger, Young) = WSNT child care region for RFP2026-004.

---

## El Buen Samaritano Collaboration

Active contract conversation with Isaac Pozos. Disparity analysis on rental assistance data for Austin City Council advocacy. Dads Care 2 / fatherhood / Chainweb are the differentiated TCAF contribution. When helping El Buen, center THEIR mission — TCAF stays the backbone, not the hero.

---

## RPLICE Live Platform

**URL:** `https://www.bettersciencelab.com` (SSL cert on www subdomain — bare domain gets SSL error)
**Old URL (DEAD):** `https://salp-science--mrterryflood.replit.app` — never use.

**Public API (no auth):**
- `GET /api/research` → 49 curated implementation science studies
- `GET /api/frameworks/list` → RE-AIM + EPIS with full dimensions
- `GET /api/v1/health` → status check

**Auth-gated / broken:**
- `/api/research/search?q=...` — requires CSRF; use `/api/research` + client-side filter instead
- `/api/grants`, `/api/v1/frameworks` — need Bearer API key from Dr. Flood

**Client-side filter pattern:**
```ts
const all = await fetchRplice("/api/research");
const filtered = all.filter(s => {
  const text = [s.title, s.abstract, s.journal, ...s.keywords, ...s.frameworks, s.category].join(" ").toLowerCase();
  return keywords.some(k => text.includes(k.toLowerCase()));
});
const result = filtered.length > 0 ? filtered : all;
```
