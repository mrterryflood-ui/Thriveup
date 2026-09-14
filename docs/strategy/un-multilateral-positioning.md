# Global, Local-First, Multilateral-Aligned Platform Positioning

**Status:** Internal strategy and product boundary  
**Updated:** 2026-09-13

## The accurate position

ThriveUp is not a UN agency, UN vendor, official SDG reporting system, humanitarian cluster tool, or replacement for a country office. It is a global-by-design, local-first implementation platform that can support the global effort by making the path from evidence to locally owned action more honest, usable, and measurable.

RPLICE is the research, evidence, implementation-science, and community-intelligence backbone. ThriveUp is the country- and community-facing delivery layer: consent, safeguarding, referrals, assignments, outcomes, and local observations. TCAF can provide optional implementation support, training, coordination, and fidelity work; the free software remains usable without purchasing TCAF services.

This boundary is consistent with the UN 2030 Agenda and its 17 SDGs, the 2024 Pact for the Future and Global Digital Compact, and UNDP's emphasis on local solutions, local ownership, and local action. These are alignment anchors, not partnership claims.

## What the attached RPLICE/UN note confirms

- **Signals:** WHO Global Health Observatory, WHO outbreak/news paths, World Bank WDI, ISO 3166/M49 metadata, and a broader catalog of UN-family and UN-adjacent sources.
- **Mechanisms:** Diagnostic Implementation Science, DIScovery disposition, implementation incongruence, CFIR/RE-AIM/ERIC, MAP-GAP, provenance, warrants, and fail-closed export gates.
- **Delivery:** RPLICE validates and frames evidence; ThriveUp and local partners own action; learning returns through federation.
- **Honest limits:** only a subset of catalogued sources are live adapters; global coverage metadata is not the same as country statistics; partner-reported information must remain labeled; RPLICE does not own case management or safeguarding.

## Domestic and international surface boundaries

Community Voice is a domestic implementation surface in the current product:
its active projects, crisis-review language, service routing, and local operating
assumptions are not presented as international infrastructure. Whole-Person
Health and LifeBridge are not international delivery systems, so the platform
must not imply that a crisis signal from another country can be routed to them.

An international community-voice surface may be added later only when a country
adapter has a local owner, language/accessibility contract, legal and
safeguarding review, service destinations, connectivity plan, and an explicit
human escalation agreement. Until then, international users should enter
through the evidence, implementation, or country-adapter path rather than a
translated copy of the domestic Voice experience.

Perplexity or another live research provider may accelerate source discovery and
triage. It is not the evidence authority: every externally visible claim still
needs a primary source, geography/date match, provenance class, and an honest
availability state.

## The optimal system architecture

### 1. One journey spine, not one tool per SDG

Every interaction should preserve:

`issue → place/time → evidence → owner → action → follow-up → outcome → consent boundary → unresolved gap`

The shared operating loop is:

`Sense → Question → Understand → Diagnose → Decide → Act → Measure → Learn → Adapt`

This keeps health, education, housing, livelihoods, child/family services, safety, climate, and governance connected without claiming that one engine solves every goal.

### 2. An adapter layer before international scale

Every country or territory needs explicit adapters for:

- geography and administrative levels;
- languages, scripts, translation, and accessibility;
- legal, privacy, safeguarding, and consent requirements;
- connectivity and offline/low-bandwidth operation;
- local service-system vocabulary, referral destinations, and operating hours;
- source availability, evidence depth, data residency, and partner authority.

No adapter may silently map international geography to U.S. FIPS or invent local numeric coverage.

### 3. Evidence must carry its own limits

Every number or claim shown to a resident, partner, funder, policymaker, or AI system needs an evidence class and provenance:

- observed;
- partner-reported;
- derived;
- modeled;
- framework-only / not a statistic.

Source, retrieval time, geography, confidence, and known gaps stay visible. A catalog entry is not a live feed. A framework is not a measured outcome.

### 4. Country ownership is a product rule

Local partners decide the problem definition, the acceptable action, the referral authority, the language, and the success measures. The platform should make their work easier without turning RPLICE or TCAF into the owner of local decisions.

Consequential decisions require human authorization. The platform can recommend, route, document, and measure; it cannot authorize a benefit denial, safeguarding outcome, clinical decision, enforcement action, or public claim by itself.

## Twenty-five-year design horizon

The UN's formal shared framework is the 2030 Agenda; the 2024 Pact for the Future also asks Member States to consider development beyond 2030. ThriveUp should therefore use a 25-year design horizon without describing that horizon as an official UN plan:

1. **Foundation:** stable journey, evidence, consent, provenance, and country-context contracts.
2. **Localization:** reusable country, language, geography, legal, safeguarding, connectivity, and service-system adapters. Domestic methods are hypotheses to adapt, not defaults to export.
3. **Country-owned pilots:** one or more partner-led implementations with local data and measures, starting with a bounded lane such as child/family services, health, or implementation learning.
4. **Federated learning:** share de-identified lessons and implementation patterns, not raw case data; preserve source and local authority.
5. **Intergenerational continuity:** make the system useful to future residents, practitioners, researchers, and policymakers without requiring them to inherit today's software assumptions.

## The target front door

The public front door should not begin with a dashboard, SDG number, or organizational intake form. It begins with a person and a place:

1. **Choose a situation:** I need help; I want to understand my community; I serve people; I want to implement or evaluate.
2. **Name the place safely:** country and broad administrative/community context first; a precise address is not required.
3. **Choose language and access needs:** show only languages and channels that are actually available.
4. **Choose the next step:** Navigator, local resource/referral, community voice, evidence workspace, or partner setup.
5. **Set the consent boundary:** what may be remembered, shared, aggregated, cited, or routed; defaults remain off.
6. **Return a truthful receipt:** what the platform knows, what it does not know, what source class was used, who owns the next action, and how to withdraw or correct.

The homepage now introduces this as three connected doors. The landing page
collects role and goal and routes into a selected flow; it does not pretend that
one global form can already provide local services everywhere:

- people and families;
- local implementers;
- evidence, funding, and policy users.

The same journey spine sits underneath all three.

## Recommended UN-facing language

> RPLICE is an implementation-science and evidence-integrity layer that can consume open multilateral signals, apply provenance and local diagnostic methods, and connect evidence to country-owned delivery through ThriveUp and local partners. It strengthens monitoring-to-action and leave-no-one-behind stratification without claiming to be part of the UN system, an official SDG reporting tool, or a humanitarian operations platform.

## Build order

1. Finish the current international community-context and consent contract.
2. Add one authenticated RPLICE exchange-contract fetch with schema validation and fail-soft availability.
3. Add an SDG implementation map as metadata: goal/domain/framework/action, never fabricated SDG scores.
4. Wire two catalogued registries only after their provenance, refresh, error, and local-use contracts are tested.
5. Add one country-owned pilot override with a local partner and local measures.
6. Add residency, multilingual science, offline, and safeguarding/legal adapters before expanding countries or making institutional pitches.

## Claims we must not make

- Do not say ThriveUp or RPLICE is a UN partner, vendor, agency, or official reporting system without a signed, verified relationship.
- Do not say all UN data is live or that all 249 countries have equal statistical depth.
- Do not present SDG alignment as SDG certification.
- Do not expose a country or community's modeled estimate as an observed outcome.
- Do not replace local government, country teams, safeguarding authorities, or community leadership.