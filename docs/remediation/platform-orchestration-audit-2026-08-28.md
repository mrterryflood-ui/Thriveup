# Platform Orchestration Audit — 2026-08-28

## Executive finding

The platform already contains a substantial set of real specialist capabilities,
but it does not yet present one shared, stakeholder-specific operating journey.
The strongest existing spine is:

> **issue / question → place and time → evidence → resource options → human-selected action → follow-up → outcomes → report and learning**

The code currently implements meaningful pieces of every stage, but those pieces
are distributed across Community Impact, Time–Place–Need, Navigator/RAG,
Chainweb, partner directories, Community Events & Impact, grant/reporting
surfaces, and operations views. They do not yet share one durable handoff
record that carries the same issue, geography, evidence references, consent
state, action, owner, follow-up, and outcome context from one surface to the
next.

The truthful platform description is therefore:

> **An interconnected decision-support and navigation system that combines
> place-based evidence, available resources, accountable partner action, and
> reporting while exposing uncertainty and data gaps.**

It is not an oracle, an automatic decision-maker, a surveillance system, or a
guarantee that a listed resource has current capacity.

The community and partner mission remain the protagonists. TCAF is the
backbone that helps people and organizations move from concern to coordinated,
evidence-grounded action:

> **You are not alone. We have the resources, and we see you.**

## Scope and evidence

This is a read-only architecture and product-surface audit. No broad UI,
database, or orchestration changes were made.

Evidence was pulled from the current workspace, including:

- `client/src/components/app-sidebar.tsx`
- `client/src/App.tsx`
- `server/orchestration/engine-registry.ts`
- `server/orchestration/conductor.ts`
- `server/time-place-need-conductor.ts`
- `server/conductor-routes.ts`
- `client/src/pages/community-impact.tsx`
- `client/src/pages/ecosystem-orchestration.tsx`
- `client/src/pages/partner-portal.tsx`
- `server/nonprofit-events-routes.ts`
- `server/routes.ts`
- `docs/grants/tcaf-capabilities-inventory-2026-05-17.md`
- `docs/remediation/full-platform-page-audit-2026-08.md`

Current scale signals observed in code:

- 271 frontend page files
- 403 route declarations in `client/src/App.tsx`
- 297 sidebar title declarations
- 26 engine IDs in the orchestration registry
- 15 Community Events & Impact API routes
- one public Time–Place–Need conductor endpoint

These are inventory signals, not impact claims. They show breadth; they do not
prove that every capability is equally mature, coordinated, or appropriate for
every stakeholder.

## State taxonomy

| State | Meaning | Required language |
|---|---|---|
| **Real** | Current code and a live route or verified focused check demonstrate the capability. | “Available” or “implemented,” with scope and source |
| **Partial** | A working capability is bounded by geography, role, freshness, missing handoff, or incomplete downstream behavior. | “Available within these limits” |
| **Stub / in-memory** | Static, local-only, process-local, demo, or otherwise non-durable behavior. | “Prototype,” “practice,” or “not durable” |
| **Aspirational** | A useful target that is not evidenced by the current implementation. | “Planned” or “target state” |

## Current orchestration map

| Spine stage | Current reality | State | Main boundary |
|---|---|---|---|
| **Issue / question** | Public Community Impact accepts a location; Time–Place–Need accepts a structured need with category, urgency, population, language, accessibility, requested time, and optional live research. Navigator and RAG provide additional question-driven entry points. | **Real / partial** | There is no shared issue identity across these entry points. |
| **Place / time** | ZIP/ZCTA, city, county, state, and county-aware resolution exist. Time–Place–Need derives local date/time/season and business-hours context. | **Real** | Geography grain and limitations are not carried consistently into every next tool. |
| **Evidence** | Community Impact uses Census-backed indicators, evidence panels, provenance, RPLICE context for authenticated callers, and explicit observed/derived/model disclosures. Chainweb supplies a scenario model with counterfactual/intervention framing. | **Real / partial** | Evidence references are shown in outputs but are not yet a shared handoff object for action and reporting. |
| **Resources** | Resource-directory search and partner matching return source-listed resources and local partners. The public Time–Place–Need path explicitly labels capacity as unknown and tells a human navigator to confirm hours, eligibility, accessibility, and acceptance. | **Real / partial** | The resource result is navigation support, not live availability or automatic matching. |
| **Human decision / action** | Community Events & Impact supports organization-scoped events, aggregate attendance, evidence-linked needs, accountable actions, consent-gated stories, audit history, and report preparation. The archive-locking behavior has a focused development proof. | **Real** | It is a separate private workspace; a public brief or Time–Place–Need result does not become an event/action record. |
| **Follow-up** | Event actions have completion evidence, and other program/referral systems contain their own follow-up concepts. | **Partial** | There is no visible cross-surface “who owns the next step, by when, and what changed” loop tying the originating issue to the action. |
| **Outcome / impact** | Event reports, partner/outcome systems, Community Impact exports, funder dashboards, and public/private reporting surfaces exist. | **Partial** | Different reports are assembled from different sources and are not yet one consistent snapshot of the same intervention thread. |
| **Learning / coordination** | The engine registry, Conductor, RAG/context plumbing, Chainweb, RPLICE bridge, agent communication, heartbeat/event-bus patterns, and read-only Ecosystem Orchestration page exist. | **Real / partial** | The registry page is a catalog of platforms/triads, not a live “next best tool” or cross-stakeholder work queue. |

## What is real now

### 1. A real public place-based evidence entry point

`/api/conductor/community-brief` and `client/src/pages/community-impact.tsx`
form the most complete public front door currently in the code:

- accepts ZIP, city, county, and related geography forms;
- resolves county and ZIP/ZCTA scope without silently converting a county
  question into one ZIP;
- exposes Census geography coverage and analytical-unit disclosures;
- applies cache and rate controls before expensive upstream/AI work;
- returns evidence panels, systems indicators, population context, and
  bounded narrative output;
- distinguishes unavailable historical views;
- links onward to grant and Chainweb surfaces;
- keeps authenticated RPLICE intelligence separate from anonymous output.

This is a strong evidence and orientation surface. It is not yet a case,
action, referral, or follow-up workspace.

### 2. A real structured issue-to-resource composer

`server/time-place-need-conductor.ts` provides a single structured request
shape for a community need. It:

- normalizes need categories such as housing, health, food, benefits,
  workforce, child care, youth, safety, and transportation;
- selects relevant non-PII intelligence domains;
- resolves place and time context;
- searches source-listed resources and active community partners;
- can perform time-sensitive research only as lead generation;
- discloses that listed resources are not proof of current capacity;
- rate-limits and caps in-flight public work.

This is the natural seed of the shared spine, but it currently returns a
response rather than creating a durable, human-owned handoff.

### 3. Real orchestration and protection boundaries

`server/orchestration/engine-registry.ts` and
`server/orchestration/conductor.ts` provide real composition mechanics:

- engines declare domains, geography grains, sources, invocation mode,
  refresh cadence, and PII status;
- non-PII engines can be selected by domain or explicit engine ID;
- PII-touching engines are blocked from ordinary aggregation;
- the explicit college-access AI path requires both an engine ID and a
  question-scoped payload;
- facts carry engine, source, and fetched-at metadata;
- skipped or unavailable engines are exposed rather than silently omitted;
- narrative generation is instructed to distinguish observed data from
  modeled scenarios and to fail rather than ship a fabricated fallback.

This is a real safety-oriented orchestration layer. It is not yet a complete
stakeholder workflow coordinator.

### 4. A real private nonprofit action workspace

The Community Events & Impact surface is the strongest current partner-side
action layer. It is protected by authentication, database-backed organization
membership/ownership, and staff authorization. Its server routes cover:

- workspace access;
- event creation, update, and archive;
- aggregate attendance;
- need links;
- actions and completion evidence;
- consent-gated stories;
- audit history;
- suppressed internal reports.

Archive permanence is backed by transaction-scoped parent locking and database
guards, with a focused development race proof. This is materially more than a
mock. The remaining gap is not whether the workspace exists; it is whether
other entry points can hand a partner into it without losing the originating
issue, place, evidence, or uncertainty.

### 5. Real cross-platform wiring, with a read-only catalog surface

`server/routes.ts` mounts the relevant families for RAG, Navigator, Chainweb,
Conductor, Community Brief, partner APIs, outcome/reporting, RPLICE, health,
grants, and program management. The Ecosystem Orchestration page consumes
`/api/ecosystem/registry` and displays platform roles, domains, sends/receives,
grant alignment, features, and triads.

That page is useful for orientation and governance. It does not currently
execute a coordinated case or tell a resident, nonprofit, funder, or operator
what the next authorized step is.

## What is partial or must be labeled carefully

### Evidence is not the same as an outcome

Community Impact correctly exposes observed indicators and model disclosures,
but the UI still has a strong narrative/export orientation. A generated brief
can inform a decision; it does not certify that an intervention caused an
outcome. Historical and counterfactual views must continue to retain their
current geography, vintage, and model limitations.

### Resources are not confirmed capacity

The Time–Place–Need response is unusually honest here: capacity is withheld
when there is no current acceptance/freshness proof. That behavior must remain
visible in every downstream card, export, and partner handoff. “Listed,”
“platform-verified,” “accepting,” and “available now” are different claims.

### Engine registry breadth is not equal operational maturity

The registry makes limitations visible, including route-only invocation,
geographic restrictions, unavailable consent categories, and engines whose
aggregate path is safe only because it selects counts rather than individual
fields. A future UI must not flatten these into one green “connected” badge.

### RAG and AI are context providers, not autonomous coordinators

Community context, RPLICE, Chainweb, and AI providers can support grounded
answers and scenario analysis. They do not authorize a referral, enroll a
person, assign a nonprofit, publish a story, or execute a consequential
action. Human authorization remains required at the consequence threshold.

### Partner Portal is a good organization home, not yet the operating spine

Partner Portal already offers onboarding, organization profile/documents,
focus-area tool suggestions, resource/partner/benefits links, and a gated
Community Events & Impact spotlight. Those are valuable pieces. Its tool
recommendations are presently focus-area tiles and quick links, not a
context-preserving next-step queue driven by a specific need and place.

### Existing static, local, or process-local features need a separate label

The prior full-platform page audit identifies multiple surfaces where behavior
is static, localStorage-backed, demo-like, or otherwise not durable, including
parts of the Academy, pathway/wizard experiences, longitudinal views, and
some AI/curriculum surfaces. These may be useful prototypes or learning tools,
but they must not be silently included as verified community impact evidence or
as durable cross-platform coordination.

## Stakeholder journeys

### Resident: “I need help now”

**Best current path:** `Get help` / Navigator / Time–Place–Need →
source-listed resources and local partners → human confirmation.

**What works:** plain-language need categories, place resolution, urgency,
language/accessibility fields, resource disclosures, public access, and
Navigator/benefit/resource destinations.

**What is missing:** one clear resident-facing status such as “what happens
next,” an explicit safe handoff to a human navigator when capacity is unknown,
and a durable way for the resident to understand whether they are browsing,
requesting contact, or participating in a follow-up process. The platform must
not solve this by collecting attendee identities, inferring demographics, or
silently matching a person to an organization.

### Nonprofit partner: “I see a need and need to coordinate”

**Best current path:** Partner Portal → Community Events & Impact, with
resource directory, benefits, community map, and collaboration links.

**What works:** organization setup, organization-scoped access, capacity
signals, private event planning, aggregate attendance, evidence-linked needs,
accountable actions, consent-gated stories, audit history, and suppressed
reports.

**What is missing:** a one-click, reviewable handoff from a brief or need
analysis into a partner-owned work item that preserves source references,
geography, need category, uncertainty, candidate resources, action owner,
follow-up date, and consent choices. The partner must choose and confirm the
action; the system must not auto-assign or auto-enroll.

### Funder: “I need credible need, action, and outcome evidence”

**Best current path:** Community Impact brief → export/report surfaces →
staff-controlled funder impact/reporting views.

**What works:** evidence and model disclosures, Community Impact exports,
partner/outcome/reporting routes, and a staff-gated Funder Impact Dashboard.

**What is missing:** a single evidence chain that shows, for one funded effort,
the original observed need, the selected response, the accountable
organization, the consent boundary, the follow-up, and the observed outcome
without mixing modeled values, small cells, self-report, partner report, and
verified external data. Funder reporting must be claim-specific and
suppression-first.

### Policymaker or community stakeholder: “What is happening here, and what
could change?”

**Best current path:** Community Impact → Community Compare / equity /
neighborhood / policy and transparency surfaces → Chainweb scenario.

**What works:** place-based system views, comparison paths, equity and
neighborhood surfaces, evidence framing, and scenario/counterfactual
disclosures.

**What is missing:** a compact “decision packet” that states: what is observed,
what is derived, what is modeled, what is unavailable, which community
partners are positioned to act, what decision is being requested, and how
success will be checked. The answer should be useful without presenting TCAF
as the subject of the story.

### Staff/operator: “I need to keep the system coordinated and safe”

**Best current path:** Ops Center, Ecosystem Orchestration, Conductor,
Chainweb, RPLICE, partner/outcome/reporting tools.

**What works:** registry metadata, engine selection, provenance, PII-wall
rules, rate/cost controls in several paths, inbound verification patterns,
heartbeat/event-bus architecture, and staff authorization boundaries.

**What is missing:** one operational view of unresolved handoffs, stale
evidence, rejected/corrected partner data, failed downstream actions, missing
owners, and reports awaiting review. A platform catalog is not the same as a
coordination queue.

## Ideal target state

The target is not a new “super-engine.” It is a small, durable orchestration
contract that existing specialist organs can read and write:

```text
Need or question
  → place + time + audience
  → evidence references and freshness
  → resource options with verification status
  → human-selected action and accountable owner
  → consent / privacy boundary
  → follow-up date and completion evidence
  → observed outcomes with suppression and source labels
  → stakeholder-specific report
  → learning / next authorized step
```

The contract should preserve:

- issue/need category and plain-language description;
- geography type, resolved geography, and disclosure;
- requested time and timezone where relevant;
- evidence references, source type, fetched time, and freshness;
- observed / derived / self-reported / partner-reported / modeled status;
- candidate resources and capacity status;
- human-selected action, owner, due date, and completion evidence;
- organization and role authorization;
- story consent as a separate field and workflow;
- aggregate-only attendance and small-cell suppression;
- report audience and export authorization;
- explicit unresolved gaps and rejected/corrected inputs.

This is a handoff envelope, not permission to connect every table to every
engine. The PII wall, no-surveillance boundary, consent defaults, and
human-authorization threshold remain stronger than convenience.

## MAP–GAP bridge plan

This first cycle should stay to five workstreams. Each workstream is a
separate improvement cycle with its own proof; security/data-integrity work
must not be mixed with cosmetic navigation work.

### Workstream 1 — Make capability truth visible

**Priority:** P0 — trust and governance

Create one shared capability-status vocabulary for engine cards, resource
cards, exports, partner handoffs, and operator views:

- available and source/freshness shown;
- partial scope shown;
- unavailable reason shown;
- source-listed versus verified versus capacity-unknown shown;
- observed versus derived versus modeled shown;
- prototype/local-only behavior excluded from impact evidence.

**Acceptance proof:** a capability matrix generated from the registry and
route/page metadata has no unlabeled “live,” “connected,” “verified,” or
“impact” claim without a source, scope, and current status.

**Why first:** without this, better orchestration would only make unsupported
confidence travel faster.

### Workstream 2 — Establish one task-first front door and handoff

**Priority:** P1 — findability and continuity

Design one role-aware start experience around the task, not the subsystem:

- resident: “I need help”;
- nonprofit: “I need to understand and act on a community need”;
- funder/stakeholder: “I need an evidence-grounded community view”;
- operator: “I need to review and coordinate active work”.

The front door should route into existing surfaces and carry a reviewable
issue/place/time context rather than duplicating their specialist logic.

**Acceptance proof:** a user can start from each stakeholder entry point, reach
the correct existing tool within two clear steps, see why it was suggested,
and preserve the same place/need/evidence context after the handoff.

**Constraint:** suggestions are transparent and user-selected. No automatic
matching, enrollment, surveillance, or hidden assignment.

### Workstream 3 — Connect analysis to partner-owned action

**Priority:** P1 — mission execution

Add a deliberate “save / hand off to partner workspace” transition from
Time–Place–Need and the appropriate Community Impact outputs. The transition
must show the partner what will be copied, what remains a model or lead, and
what still needs human confirmation.

**Acceptance proof:** a nonprofit can review and accept a need context, create
or attach an event/action, assign an accountable owner, record completion
evidence, and see the original evidence and uncertainty disclosures without
copy/paste or silent data expansion.

**Constraint:** private event data, attendee identities, and consent-gated
stories remain separate from public aggregate briefs.

### Workstream 4 — Close follow-up, outcome, and reporting symmetry

**Priority:** P2 — funder and community credibility

Build the reporting bridge around the same accepted action record:

- action status and due date;
- completion evidence;
- follow-up observation;
- source/claim type;
- small-cell suppression;
- consent and audience;
- report-ready narrative generated only from eligible claims.

**Acceptance proof:** one action can be traced forward to its follow-up and
report, while a report cannot imply an outcome that lacks eligible evidence.
Observed, derived, partner-reported, self-reported, and modeled values remain
visibly distinct.

### Workstream 5 — Harden the handoff boundaries

**Priority:** P1 for security/data integrity; execute separately from UI polish

Resolve the existing residuals at the boundaries that a shared spine would
stress most:

- unexpected event-route/database errors must not become misleading 400s or
  leak raw infrastructure errors;
- reads used for workspace/report views need a consistent snapshot where
  cross-query drift matters;
- stale edits need an explicit version or updated-at precondition;
- child authorization should establish tenant scope before locking cross-tenant
  rows;
- database immutability and audit append-only protections should cover direct
  bypass paths, not only routes;
- client state should refresh after collaborator archive/mutation conflicts;
- any new AI/context handoff must retain the ethical preamble, PII wall,
  rate/cost limits, and source disclosures.

**Acceptance proof:** focused API, database, and browser checks demonstrate
authorization, stale-write rejection, immutable archive behavior, truthful
error contracts, report freshness, and no PII/context leakage across the
handoff.

## Navigation model recommendation

Do not add another permanent subsystem-heavy mega-menu. Use a small task-first
spine with context-aware next steps:

1. **Start here** — choose the task in plain language.
2. **Understand** — place-based evidence and what is unknown.
3. **Find options** — resources, partners, and verification status.
4. **Act together** — organization-owned event/action workspace.
5. **Check back** — follow-up, outcome, and report.
6. **Operate safely** — staff-only health, governance, rejected inputs, and
   unresolved handoffs.

Existing specialist tools should remain reachable from the relevant step,
but the user should not need to know whether the underlying capability is
called Chainweb, RPLICE, RAG, Conductor, equity loss, or a partner directory.
The system should explain what a tool does, why it is the next option, and what
it cannot prove.

## Stakeholder message to preserve

### Resident

> You are not alone. We have the resources, and we see you. We can help you
> understand what is available near you, what still needs to be confirmed, and
> what the next human step is.

### Nonprofit

> Your mission and your community are the story. We help you turn a concern
> into a shared understanding, an accountable action, and evidence you can
> stand behind.

### Funder or policymaker

> See what is observed, what is modeled, what is available, what is missing,
> who is acting, and how progress will be checked—without overstating what the
> data can prove.

### Staff/operator

> Keep the right evidence, resource, partner, authorization, and report
> connected at the right time, while making uncertainty and unresolved work
> impossible to hide.

## Limits and deferred decisions

- This audit did not implement the shared handoff contract.
- It did not re-run the long validation suite; the current workflow snapshot
  shows several checks running concurrently, and the prior application
  failure was a port collision (`EADDRINUSE`), not a code-quality result.
- It did not make a production claim. Development evidence and production
  publication remain separate.
- It did not certify every page or endpoint. The existing page-by-page audit
  contains additional security, privacy, performance, and endpoint-contract
  findings that should be scheduled by severity rather than mixed into this
  product-spine cycle.
- “Next best tool” must remain a transparent recommendation, not automatic
  matching or a hidden decision about a person or organization.

## Bottom line

The platform does not need a larger list of tools to become coordinated. It
needs a visible, honest spine that lets each stakeholder move through the
right existing tool while preserving context, consent, source, uncertainty,
accountability, and follow-up.

**TCAF is the backbone. The community, resident, nonprofit, funder, and
stakeholder missions are the protagonists.**