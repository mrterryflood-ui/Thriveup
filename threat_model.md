# Threat Model

## Project Overview

ThriveUp Academy is a production Node/Express + React/Vite platform backed by PostgreSQL and Replit Auth. It mixes public informational and intake surfaces with authenticated internal workflows for grant operations, ecosystem coordination, benefits navigation, participant support, and AI-assisted tools. The highest-risk production concerns are broken public/authenticated boundaries, leaked service-to-service credentials, and public routes that can trigger paid model calls or mutate internal records.

## Assets

- **User sessions and role context** — Replit Auth sessions and server-side role decisions control access to internal workflows and case-management features.
- **Participant and applicant data** — benefits applications, participant profiles, risk snapshots, service history, and contact details include PII and sensitive service-delivery data.
- **Grant and partner operations data** — MOU pipelines, discoveries, coalition records, and related workflow state affect real partner relationships and internal decision-making.
- **Application and integration secrets** — ecosystem API keys, shadow-observer keys, third-party API keys, and shared secrets are sufficient to impersonate trusted services or consume paid APIs.
- **AI quota and operating budget** — multiple public endpoints call paid LLM providers and RAG pipelines; uncontrolled access can create real cost and availability impact.

## Trust Boundaries

- **Browser to API** — all client input crosses into the Express server. The browser is untrusted even when the UI intends a feature to be internal.
- **Public to authenticated/internal routes** — the app intentionally mixes public pages and internal tooling. This boundary must be enforced server-side on every sensitive route.
- **Ecosystem platform to hub** — `x-ecosystem-key` and `x-shadow-key` requests represent a separate machine-to-machine trust boundary and must use exact secret verification, not naming conventions.
- **API to PostgreSQL** — the server can read and mutate operational records directly; route-level auth failures become database disclosure or tampering immediately.
- **API to external services** — OpenAI, Anthropic, Gemini, OpenRouter, Census, SAM.gov, and other external calls consume secrets, quota, and budget.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, route modules under `server/`.
- **Highest-risk route files:** `server/benefits-routes.ts`, `server/mou-routes.ts`, `server/ecosystem-connector.ts`, `server/rag-engine.ts`, `server/college-access-ai-routes.ts`, `server/translate-routes.ts`, `server/peer-review-routes.ts`.
- **Auth boundary:** `server/replit_integrations/auth/replitAuth.ts` and per-route `requireAuth` helpers; treat missing middleware on route files as high-signal.
- **Usually lower-priority unless reachable in production:** mock/demo-only surfaces. Per repo assumptions, mockup sandbox itself is out of production scope, but any demo route mounted in `server/` is in scope if reachable from production.

## Threat Categories

### Spoofing

This project trusts both end-user sessions and ecosystem service credentials. All authenticated user routes MUST validate a real Replit-authenticated session server-side, and all ecosystem/shadow routes MUST verify exact server-side secrets tied to a registered platform or observer. Prefix checks such as accepting any token that starts with `tveco_` or `tveco_shadow_` are not sufficient.

### Tampering

The platform stores operationally meaningful workflow state: benefits applications, MOU pipelines, discovery review decisions, and ecosystem events. Any route that creates, updates, or deletes these records MUST require an authenticated and authorized actor, and sensitive writes SHOULD capture the acting identity for auditability. Client-visible internal tools cannot rely on frontend gating alone.

### Repudiation

Internal workflow changes affect grants, partner outreach, and service records. Sensitive mutations MUST be attributable to a real authenticated actor rather than default placeholders such as `hub-admin` or anonymous public callers. Without that, the system cannot reliably answer who changed an application outcome, dismissed a discovery, or altered a partner pipeline record.

### Information Disclosure

The codebase handles PII, partner contact information, and internal ecosystem state. API responses for these datasets MUST be scoped to authorized users and SHOULD only return fields needed by the caller. Secrets and API keys MUST NOT appear in source-controlled files, generated connector code, logs, or route fallbacks.

### Denial of Service

Several public features trigger expensive operations: paid LLM calls, knowledge-base refreshes, and data-ingestion workflows. Public endpoints that invoke these paths MUST have authentication or robust abuse controls, and rate limiting MUST derive client identity from trusted infrastructure rather than raw user-supplied headers.

### Elevation of Privilege

The main privilege-escalation risks here are broken function-level authorization on route modules and machine-to-machine auth that treats any correctly formatted string as trusted. Internal admin, case-management, and ecosystem-control functions MUST remain inaccessible to unauthenticated internet users and to unregistered ecosystem callers.
