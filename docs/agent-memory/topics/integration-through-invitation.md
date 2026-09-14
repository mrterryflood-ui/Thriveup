# Integration through Invitation (ITI)

**Named by:** Dr. Terry Flood, 2026-05-24
**Iron Rule:** #8
**Status:** Week 1 shipped 2026-05-24 (schema + routes + component + N. Wilco wiring)
**Scope:** Greater Austin first; replicable nationwide
**Spiritual reference:** "Nobody Knows the Trouble I've Seen / Nobody Knows My Prayer"

---

## What it is

**A dignity primitive for the people doing community work in the shadows** — informal caregivers, peer mentors, promotoras, church mothers, untitled CHWs, driveway journeymen, the cousin who picks you up from TDCJ. The credentialed system doesn't see them. Our intake forms shouldn't repeat that erasure.

ITI brings them into the fold with:
1. **Self-identification** — no credential check, no proof asked
2. **Layered consent** — quote / aggregate / name / route / share-with-funder / invite-to-room / stipend / credentialing — each independent, each revocable, **all default OFF**
3. **Witness loop** — they see who heard them, what was logged, where it went, what came of it, and can correct the record
4. **Credit + compensation rail** — name with consent, stipend if wanted, seat in the room when funders meet
5. **"Bring into the fold" pathway** — if they want it, route to CHW certification / family home daycare license / peer-recovery cert / apprenticeship sponsorship
6. **Anti-extraction guardrails** — no AI summarization without `aggregateMyData=true`; no funder citation without `shareWithFunder=true`; no public naming without `nameMePublicly=true`

This is the **second truth-in-claims primitive**, parallel to `<PartnershipStatus>` (which is honest about funders). ITI is honest about *whose work this actually is*.

---

## Where it lives (cross-platform)

| Hub / surface | Wired in (Week 1) | Planned (Week 2+) |
|---|---|---|
| Community Voice (N. Wilco childcare gaps) | ✅ Yes — `<IntegrationInvitation surface="voice-project" surfaceContext="<slug>" />` injected on project page | Voice/video/WhatsApp drop-in via Talk Your Talk; co-naming of clusters |
| Foster-Youth intake | — | Informal kin caregivers as first-class lane |
| LifeBridge / Benefits Navigation | — | Untitled navigators register, log neighbors helped |
| Justice Hub (RNR/CBI/NRRC) | — | Peer mentors get same credit primitive as licensed clinicians |
| Trade Sims | — | Informal journeymen → apprenticeship sponsorship |
| Whole-Person Health | — | Church mothers / barbers / doulas as recognized first-line listeners |
| Grant proposals (RFP Fidelity engine) | — | Standard "Lived Experts Compensated & Named" section added to `complianceMatrixItems` |
| Partner pipeline | — | Informal partners table (not buried under "community contacts") |
| Public site | — | `<SeenWork>` surface naming shadow workers (with consent) who shaped programs |

---

## Architecture (Week 1)

### Schema (`shared/schema.ts`)
- `integration_invitations` — self-identification, capability `accessToken`, surface attribution, status
- `invitation_consents` — 8 layered toggles, all default `false`
- `recognition_events` — audit trail of being heard (`heard | credited | paid | invited | cited-in-grant | routed-to-service | co-authored | corrected-record | credentialing-referred`)

### Routes (`server/integration-invitation-routes.ts`)
- **Public + capability-token (same pattern as foster-youth-intake-routes.ts):**
  - `POST /api/iti/invitations` — create + return token ONCE
  - `GET /api/iti/invitations/:id` — read own record
  - `PATCH /api/iti/invitations/:id` — update profile
  - `PATCH /api/iti/invitations/:id/consents` — flip any toggle
  - `POST /api/iti/invitations/:id/withdraw` — withdraw + all consents revoked + logged
  - `GET /api/iti/invitations/:id/recognition` — witness loop
- **Admin (`requireAdmin`):**
  - `GET /api/iti/admin/invitations?surface=&surfaceContext=` — list shadow workers per surface
  - `GET /api/iti/admin/invitations/:id` — full record + events
  - `POST /api/iti/admin/invitations/:id/recognize` — log a recognition event

### Component (`client/src/components/integration-invitation.tsx`)
- `<IntegrationInvitation surface=... surfaceContext=... prompt=... description=... suggestedRoleTags=... />`
- State 1 (no token in localStorage): invitation prompt + form
- State 2 (token in localStorage): witness loop dashboard with 8 consent toggles + recognition events
- Capability token persisted in `localStorage` under `iti-token:<surface>:<context>` so invitee can return without an account

---

## Doctrine (load-bearing — don't drift)

1. **All consents default false.** Anti-extraction is the default. The system asks permission, the person grants it explicitly, the person can revoke any time.
2. **Witness loop is always on.** Even with all consents off, the invitee sees what we know and what we've done. Transparency is not a toggle.
3. **No translation tax.** The form accepts free text in their language. Suggested tags are optional and additive — never required, never used as a taxonomy filter.
4. **No credentials, ever.** Self-identification is the whole point. Verification (if ever needed for stipend payout) happens downstream, with consent, with respect.
5. **Stipend pathway is real.** `acceptStipend=true` is not aspirational — it must become a real workflow (Week 3). Don't ask the question if we can't honor the answer.
6. **"In the fold" is welcoming language.** Avoid "lived experience" tokenization phrasing. They're not a category; they're a person doing the work.
7. **Surface-specific framing.** Each surface (Voice, Foster, LifeBridge, etc.) passes its own `prompt` + `description` + `suggestedRoleTags` in language the community there would use.
8. **AI never summarizes a shadow-worker story without `aggregateMyData=true`.** This must be enforced at the AI call site, not at the UI layer. (Wires into `ai-provider.ts` ETHICAL_EI_PREAMBLE — to be extended Week 2.)

---

## Posture B for N. Wilco (companion to ITI)

User chose Posture B for the N. Williamson County childcare project: show the regional briefing's 5 hypotheses (infant slots, CCS subsidy deserts, shift workers, special-needs, bilingual) as **"our current guess — is it true for you? what did we miss?"** rather than pre-set taxonomy categories. **Week 2 deliverable** — a hypothesis-contest UI on the N. Wilco voice project page where residents flag thumbs-up/down + free text on each gap. Each flag becomes an ITI invitation if they choose to be seen.

---

## Open work

- **Week 2 — Voice consent boundary closed:** Voice insights use `ai-provider.ts`, filter every derived metric and AI corpus by `aggregateMyData`, persist source-pin provenance, and revalidate it before public Story exposure. Linked pin creation and service routing lock the invitation row through the consent check and insert.
   1. Keep the optional, nullable `itiInvitationId` and insight `sourcePinIds` migrations in sync with the shared schema.
   2. Preserve the `filterByItiConsent` gate before any ITI-linked text or derived metric reaches an AI or public-story path.
   3. Keep `quoteMe`, `nameMePublicly`, `routeMyInfoToService`, and `shareWithFunder` checks separate; aggregate consent never implies the others.
- **Week 2:** Wire ITI into Foster-Youth intake (informal kin caregivers), LifeBridge (promotoras), Justice Hub (peer mentors). Build the N. Wilco hypothesis-contest UI.
- **Week 3:** Convening rail (named co-authorship workflow), stipend tracking with secure payout, credentialing referral pathways (CHW, family home daycare, peer-recovery, apprenticeship), `<SeenWork>` public-site primitive.
- **Translation:** Wire Talk Your Talk into the ITI form (107 languages/dialects; AAVE/Spanglish honored). Currently `preferredLanguage` is captured but not yet routed to translation.
- **Voice/video intake:** WhatsApp drop-in for people who don't fill out forms.
- **Grant doctrine update:** Add "Lived Experts Compensated & Named" as a standard section in `complianceMatrixItems` so every TCAF-prime proposal includes it.

---

## File pointers

- Schema: `shared/schema.ts` (search "INTEGRATION THROUGH INVITATION")
- Routes: `server/integration-invitation-routes.ts`
- Component: `client/src/components/integration-invitation.tsx`
- Wired into: `client/src/pages/voice/project.tsx` (above the Tabs block)
- Registered in: `server/routes.ts` (`registerIntegrationInvitationRoutes`)
