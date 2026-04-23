# RPLICE v2 — NSF 26-508 Hub Adoption Kit

Adopt the AI-Ready America coordination protocol for your state in four steps.

## What you get

- **Live Hub Workbench** — pick your state, see real federal partners, real state programs, AI-grounded local intelligence with citations, and a generated NSF-compliant LOI you can edit and submit.
- **Coordination protocol** — RPLICE v2: byte-identical resident-reference dedup, canonical program slugs, federated event vocabulary, catalog growth across peers.
- **Federation membership** — when discoveries land at any peer, all peers see them. The national catalog grows from on-the-ground coordination, not central edict.

## Four-step adoption

### 1. Visit the Hub Workbench
Open `https://<host>/nsf-techaccess-hub` and select your jurisdiction. Confirm the federal partners (USDA-NIFA Cooperative Extension, DOL American Job Centers, SBA SBDCs) and the baseline state programs are accurate. File corrections via the Discoveries panel.

### 2. Run live intelligence
Click **Refresh Intelligence** to pull current AI initiatives, recent federal AI awards, and workforce-program activity in your state. Findings are cached 24h and citation-backed.

### 3. Generate your LOI
Enter your lead institution, UEI, PI, and partner roster. Click **Generate LOI**. Review the markdown, edit as needed, export, submit via Research.gov by the LOI deadline (Round 1: June 16, 2026).

### 4. Register as an RPLICE peer
Email the steward at `rplice@thriveupacademy.org` with your hub name, state code, and inbound webhook URL. You'll receive a peer ID and shared secret. Your hub joins the federation; discoveries you confirm propagate to all peers; events you emit reach the network.

## Architecture summary

| Layer | What it is | File |
|---|---|---|
| Jurisdictions | All 56 (50 states + DC + 5 territories) | `shared/nationwide/jurisdictions.ts` |
| Federal partners | Real Cooperative Extension + AJC + SBDC per jurisdiction | `shared/nationwide/federal-partners.ts` |
| State programs | Medicaid, SNAP, SHIP baseline + deeper seeds for TX/CA/NY/FL/IL | `shared/nationwide/state-programs.ts` |
| Federal programs | 24 programs (SNAP, Medicaid, SSDI, etc.) with canonical slugs | `shared/nationwide/federal-programs.ts` |
| Resident-ref hash | Byte-identical SHA-256 dedup key | `shared/nationwide/resident-ref.ts` |
| Eligibility engine | Pure function evaluator | `shared/nationwide/eligibility.ts` |
| LOI generator | Pure markdown renderer | `shared/nationwide/loi-generator.ts` |
| Live intelligence | Perplexity sonar-pro via OpenRouter | `server/hub-intelligence.ts` |
| Discovery persistence | `nationwide_discoveries` table (24h cache) | `shared/schema.ts` |
| Federation handshake | `GET /api/rplice/sync` v2 | `server/benefits-routes.ts` |

## Cost guardrails

- Live intelligence calls cost ~1-2K tokens each; cached 24h per (state, query).
- Daily token cap configurable via `HUB_INTEL_DAILY_TOKEN_CAP` env var (default 200K).
- Generator runs offline-only when `includeLive=false`.

## Federation invariants (do not modify)

- `residentRef` SHA-256 formula
- Canonical slugs (`federal:snap`, `state:tx:healthcare-access:texas-medicaid-...`)
- Event vocabulary (`benefit.enrollment.updated`, `eligibility.screened`, `benefitProgram.discovered`, `grantPartner.registered`, `grantPartner.tagged`)
- Dedup key: `peer | residentRef | programSlug | status`
- Echo protection: `x-rplice-relay` header

Any peer that breaks an invariant breaks federation. Submit changes via PR; ratified changes get a `CATALOG_VERSION` bump committed in lockstep across peers.
