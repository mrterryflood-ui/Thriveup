# Retrieval discipline audit: Thriveup (2026-09-30)

Standard: Integrated Implementation Intelligence `platform-doctrine/references/disciplined-retrieval.md` (R1–R8) and `evidence-knowledge-graph.md` (K1–K8).
Shared core: `retrieval-core.ts` (the same file in every product repo; reference implementation in the Community Violence Register).

## Reviewed by hand: Navigator chat (`server/navigator-routes.ts` `/api/navigator/chat`)

### Already disciplined (kept)
- Prompt rules forbid fabricated numbers, acronym expansions, grades and projected outcomes.
- The full response is buffered and passed through `applyNavigatorGrounding` before the client or the database sees it. Ungrounded census, gun-violence and grant-count claims are redacted, and each decision goes to the claim chain.
- The resource engine and Perplexity research supply context, and `sourceMetadata` is sent with each answer.

### Finding
- **Contacts unchecked (R1/R2).** The prompt asks for "names, phone numbers, websites, addresses when available", but grounding covered only named statistics. A phone number or link from model memory reached people seeking reentry, housing or crisis help unchecked.

### Changed
| Rule | Change |
|---|---|
| R1/R2 | `server/contact-grounding.ts` `groundContacts` runs after `applyNavigatorGrounding` on all three output paths (main, OpenRouter fallback, last resort). Phone numbers not in the supplied context are withheld and replaced with a pointer to 211 and the provider's official site. The N11 lines 911, 988 and 211 always pass. Links to domains not in the context get a visible verify note. |
| R8 | `server/__tests__/contact-grounding.test.ts`: 3/3 pass under the repo's own `tsx --test` runner. `navigator-routes.ts` is syntax-checked. |

### Limits
- Street addresses aren't checked.
- Withheld phones and unverified links aren't yet written to the claim chain; they appear only in the visible text.
- The full test suite and typecheck weren't run in the audit sandbox.
- `collaborative-ai.ts`, `ai-provider.ts` and the other model-calling files below weren't changed.

## Every model-calling file (static scan)

9 files call a model. The scan looks for code patterns; ✓ means the pattern is present, not that the rule is met. A · means no sign of it, which is a lead for review, not proof of a gap. Only the paths under "Reviewed by hand" were read line by line.

| File | Calls | R1 | R2/3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| `server/ai-provider.ts` | 20 | ✓ | ✓ | ✓ | · | ✓ | · | ✓ |
| `server/collaborative-ai.ts` | 6 | ✓ | ✓ | ✓ | · | · | · | · |
| `server/foster-youth-intake-routes.ts` | 3 | ✓ | ✓ | ✓ | · | · | ✓ | · |
| `server/navigator-routes.ts` | 2 | ✓ | ✓ | ✓ | ✓ | ✓ | · | · |
| `server/grant-routes.ts` | 1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · |
| `server/hub-intelligence.ts` | 1 | ✓ | ✓ | ✓ | · | ✓ | · | · |
| `server/peer-review-routes.ts` | 1 | ✓ | ✓ | ✓ | · | ✓ | · | · |
| `server/routes.ts` | 1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `server/translate-routes.ts` | 1 | · | · | · | · | · | · | · |

Totals: R1 8/9, R2/3 8/9, R4 8/9, R5 3/9, R6 6/9, R7 3/9, R8 2/9.

## Limits of this audit
- The static scan can miss grounding done in a caller or helper file, and it can credit a file whose pattern exists but is not applied to the model call.
- R8 ✓ means a test file mentions the module name, not that the retrieval behaviour is tested.
- Unwired paths are listed as residuals above. They are not fixed by this PR.
