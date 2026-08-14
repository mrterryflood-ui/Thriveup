---
name: inbound-verification-pattern
description: Non-negotiable pattern for verifying/scrubbing AI-to-AI and partner inbound data before it is stored, cached, or fed into an AI prompt/RAG/public output.
---

# AI-to-AI / partner inbound verification

Never trust inbound AI-to-AI or partner data bidirectionally by default. Checking auth/key
presence is not enough — the payload's *content* must be schema/range/enum-checked before it is
treated as ground truth or surfaced.

**Shared helper:** `server/inbound-verification.ts` — `verifyInboundPayload<T>(raw, schema)` →
`{ clean, rejections }`. Declarative `InboundSchema` (field → type/required/min/max/maxLength/
enum/maxItems/itemMaxLength; types include `url`). Invalid fields are dropped/nulled, never
coerced into a plausible value. `recordInboundVerification()` writes every rejection to the
append-only `inboundVerificationLog` table (non-fatal). `rejectionsToCorrectionNote()` produces a
structured, sender-facing correction to include in the response wherever the route talks back.

**Why:** several inbound paths (gun-violence registry sync, Civic Signal webhook/pull, RPLICE
inbound events, ecosystem heartbeat complianceReport, sitesync `/inject`, partner API `/push`)
fed directly into AI prompts, RAG context, or admin/public views while only checking auth — a
malformed or out-of-range field from a sibling platform could become "ground truth" silently.
This mirrors the discipline `ai-claim-grounding.ts` applies to *outbound* AI claims, but for
*inbound* structured JSON.

**How to apply:** any new AI-to-AI or partner-facing endpoint that stores or forwards
partner-provided fields must define an `InboundSchema`, call `verifyInboundPayload`, log
rejections via `recordInboundVerification`, and surface `corrections` in the response — see the
"AI-to-AI / Partner Inbound Verification" section of `.agents/skills/platform-engineering/SKILL.md`
for the full applied pattern and worked examples (gun-violence sync, Civic Signal, RPLICE,
ecosystem heartbeat, sitesync inject, partner push).
