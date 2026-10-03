# Alpha — external AI oversight findings

## Requested end-state
Address the supplied cross-platform AI honesty-layer handoff without fabricating source, evaluation results, or weakening binding safety controls.

## Observed evidence and hypotheses
1. Existing closed-form numeric grounding may already cover part of the proposed mechanism: server/ai-claim-grounding.ts mechanically removes unsupported numeric claims on wired statistic surfaces.
2. The proposed honesty verdict is distinct from enforcement: it can supplement mandatory grounding, but cannot replace safety gates with non-blocking annotations.
3. The cited secondary entry point may be inactive: registerChatRoutes has a definition/export, but a repository search found no registration call. Active consumers must be traced before integration.

server/ai-provider.ts returns strings for generateAIResponse and callback streams for streamAIResponse. Changing either default contract would affect many consumers. Any optional facts/verdict extension must preserve those contracts and propagate the verdict through active server/UI response paths.

## Authority and boundaries
- No change to credentials or existing provider availability/fallback/deadline policy.
- ThriveUp-specific money, percentage, count and FTE vocabulary and community/grants/foster-youth golden cases; do not reuse unrelated hazard/defense fixtures.
- Supplied model scores 0.94/0.88 have no attached evaluation provenance; they must not be labeled measured ThriveUp performance.
- Caller-provided facts must not be promoted to independently retrieved evidence.
- Mechanical numeric checks cannot certify arbitrary prose, causality or real-world truth.

## Source blocker
The attachment is a description, not a module implementation. override/gate/evals/registry and their dependency definitions were not supplied or found locally. Requested a repository/folder URL or source upload before importing the shared layer. No substitute implementation, static model score, price assumption, or external module integration has been fabricated.

## Omega
Pending source provision and implementation. Review findings are observed; no AI-layer build or live-model evaluation is claimed.