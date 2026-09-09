---
name: TCAF Core Identity & IGN Framework
description: Who TCAF is, what IGN means, the multi-disciplinary identity, and the stakeholder model — bake this into every proposal, intro, and platform surface.
---

## The One-Sentence Mission
TCAF is the nonprofit for nonprofits, residents, and communities to thrive. We have the tools, the data, and the funding knowledge. They execute and do the work.

## Free Platform + Funded Implementation Model
The ThriveUp platform and core software are intended to remain free for constituents, nonprofits, community organizations, and government entities. TCAF's optional human implementation capacity—administration, coordination, training, fidelity support, evaluation, and managed delivery—is funded separately as a collaborative service line item chosen by the customer.

**Why:** The platform must reduce access barriers while preserving the real labor required to implement cross-sector work well. TCAF should facilitate and strengthen an organization's work, not become a mandatory intermediary in every relationship.

**How to apply:** Separate software access from implementation services in product, funding, and public language. Support self-service, guided implementation, and managed coordination. Free access does not imply free human labor or unlimited customization.

## Cross-Sector Integrated Front Door
The public entry model is bidirectional and non-siloed: help people find relevant organizations and resources, help organizations understand whom they are reaching or missing, and connect related needs across health, education, housing, workforce, community, justice, and other domains. Triage must distinguish immediate, intermediate, and long-term needs and expose wraparound pathways rather than treating one domain as the whole person or problem.

**Why:** A healthcare need can also be an education, housing, workforce, family, or justice issue; local delivery needs a national architecture that can scale from one community to many.

**How to apply:** Keep the public front doors connected to one shared context, consent, referral, evidence, and implementation backbone. Never imply that a sector-specific entry point represents a sector-specific silo.

## Public Brand Architecture
The universal homepage presents TCAF and ThriveUp equally. TCAF is the nonprofit, human implementation capacity, and community-serving institution; ThriveUp is the integrated platform and software infrastructure. ThriveUp Academy remains the education, youth, and workforce workspace within the broader platform rather than serving as the universal brand.

**Why:** The whole system includes constituent navigation, organizational coordination, health, community, justice, government, funder, evidence, and implementation functions that are broader than Academy, while neither TCAF nor ThriveUp should appear subordinate on the shared front door.

**How to apply:** Use a co-branded TCAF + ThriveUp identity on the universal homepage. Keep Academy branding on education/workforce pathways and avoid labeling the universal footer or root experience solely as ThriveUp Academy.

## IGN — Initial Guidance and Navigation
Psychology term. TCAF helps people and organizations get to their destination in a safe, efficient manner at their own pace and level of readiness and comfort — using planning and metrics to guide them, redirecting if they go off course, using data and evidence-based interventions.

**Why IGN matters:** RPLICE and the platform APIs allow TCAF to address people and organizations *uniquely* — not one-size-fits-all.

## What TCAF Does (the full cycle, not just needs assessment)
Research → Planning → Preparation → Execution → Continuous Assessment → Implementation → Scale Up (depth) → Scale Out (breadth)

TCAF does the whole cycle. Most orgs stop at needs assessment. TCAF doesn't.

## What TCAF Provides
- Tools (and can build what doesn't exist yet)
- Data → turned into information → meeting people where they are
- Funding knowledge (grants, opportunities, funder relationships)
- Research, planning, preparation so others can execute
- Teaching people how to fish — give tools AND teach how to use them
- Work with (assist or be assisted, depending on the situation)
- Inform and influence policymakers and stakeholders

## Multi-Disciplinary Identity (bake into every surface)
All lenses held simultaneously, none sacrificed:
- Implementation science + behavioral science
- Social work / CHW empathy and engagement model
- HR and policy expertise
- Computer engineering and community-serving tools
- Pedagogy of an educator
- Understanding of legal system and criminal justice impact
- Patience and understanding of a parent
- Lived experience of an MBA + community development innovator (urban, metro, suburban)

## Stakeholder Model — All Four, All Equal
Every intro, page, and tool must address all four:
1. **Community members / residents** — tools, benefits, navigation, safety, readiness
2. **Nonprofits** — TCAF is their backbone; infrastructure, capacity, funding, evaluation
3. **Funders / grant reviewers** — data, outcomes, evidence, accountability
4. **Policymakers / stakeholders** — research, influence, advocacy, systemic change data

## Core Philosophy
- Plan WITH people, not FOR them
- "We are all stronger together"
- Data is king — but data must become information to be useful
- Meet people where they are, at their pace and level of readiness
- We assist OR are assisted — direction of help depends on the situation

## Writing Mode Architecture (personal-context.ts)
Five audience modes — detected from message signals, not user role:
- `tcaf_internal` — Dr. Flood writing FOR TCAF (grants, proposals, strategy)
- `partner_assist` — TCAF helping a partner org (El Buen, United Way, church...)
- `partner_user` — partner org staff logged in; their tools/data/IGN first
- `community_member` — resident/family seeking help; plain language, IGN
- `neutral` — default

TCAF grant pipeline is ONLY injected in `tcaf_internal` and `neutral` modes.
Partner assist mode centers the partner's mission — TCAF stays the backbone, not the hero.

## ETHICAL_EI_PREAMBLE (ai-provider.ts)
Now 8 principles. Principles 7 and 8 are new (added 2026-06-20):
7. TCAF Identity & IGN Mindset — IGN framework, multi-disciplinary lenses, care before credentials, all issues are local
8. Writing Mode & Partnership — TCAF is never a threat; adjust voice per context (internal/partner/community)
