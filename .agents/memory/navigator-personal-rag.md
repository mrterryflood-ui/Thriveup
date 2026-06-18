---
name: Navigator Personal RAG
description: Personal context retrieval layer for the AI Navigator — what it queries, how audience mode works, and the two design constraints.
---

## What it does

`server/personal-context.ts` — called inside the Navigator's chat route when a user is authenticated. Queries live DB data and injects it as factual background context into the system prompt.

**Data sources queried:**
- `proposalPipeline` — active grant proposals (title, agency, status, deadline, next actions)
- `communityPartnerOrgs` — partner orgs (name, contact, mission summary, notes)
- `initiatives` — user's saved initiatives (filtered by `authorId = userId`)
- `stakeholderCommitments` — non-delivered commitments (sector, type, status, contact)

## Injection point

`server/navigator-routes.ts` line ~633:
```
fullSystemPrompt = NAVIGATOR_SYSTEM_PROMPT + contextData + personalContextBlock + modeInstruction
```

Personal context block sits between the organizational RAG context and the response mode instruction.

## Audience mode detection

Detects from the user's message text (lowercase keyword matching):

- **External mode** — message contains known external org/person names (El Buen, Isaac Pozos, United Way, Dr. Vann, TWC, Austin Public Health, etc.) or generic external signals ("help them", "for them", "proposal for", etc.)
- **Internal mode** — message contains self-referential signals ("my grant", "my pipeline", "what do I have", etc.)
- **Neutral** — everything else

Audience mode changes the system prompt addendum:
- External → "focus on what THEY need, not on TCAF's funding goals or platform sales"
- Internal → "use this context to give an accurate answer about your specific situation"
- Neutral → "use only where directly relevant"

## Design constraints (user-stated, non-negotiable)

1. **NOT a sales pitch** — context block is labeled "for accuracy only, not for promotion." The AI should use the facts to be accurate, not to promote ThriveUp.
2. **Audience-aware** — if the user is asking about an external org's needs (El Buen analysis, Isaac Pozos meeting, etc.), the Navigator focuses on THEIR situation, not on TCAF's grant pipeline or capabilities.

**Why:** Dr. Flood stated both constraints explicitly. The Navigator is a tool to help him think clearly, not a marketing engine. When he's helping an external org, the context should serve that org's needs.

## Non-fatal design

All DB queries are wrapped in try/catch. A failed query silently omits that section rather than breaking the Navigator response. Personal context only activates for authenticated users — anonymous users are unaffected.
