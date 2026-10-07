# IT Service Management (ITSM) Compliance Framework
**Organization:** Thriving Communities for All (TCAF) / ThriveUp
**Version:** 1.0 — Effective July 2, 2026
**Owner:** Dr. Terry Flood, President, TCAF
**Contact:** terryflood@thrivingcommunitiesforall.com
**Review cycle:** Annually or upon material change to the platform

---

## 1. Purpose & Scope

This framework establishes TCAF's IT Service Management practices aligned with ITIL 4 principles. It governs the 15 public-facing platforms operated under the ThriveUp / Ecosystem umbrella, covering service delivery, incident response, change management, and problem resolution.

This document satisfies ITSM compliance requirements for:
- Federal cooperative agreements (OMB Circular A-130, FISMA-adjacent reviews)
- State government technology contracts (TX DIR requirements)
- Healthcare IT partner agreements requiring ITIL-aligned SLAs
- Enterprise ecosystem partner onboarding (FHIR/CDS-Hooks integration partners)

---

## 2. Service Catalog

### Tier 1 — Mission-Critical Services (99.9% uptime target)

| Service ID | Service Name | URL | Description | Populations Served |
|---|---|---|---|---|
| SVC-001 | ThriveUp Platform | thriveupcademy.com | Primary educational and workforce development hub; AI Workforce Academy, Trade Sims, Career Explorer, 55+ pathways | Youth, adult learners, justice-involved, foster youth |
| SVC-002 | Whole-Person Health Ecosystem | mentalwellnesssupport.net | Behavioral-health safety floor; C-SSRS/PHQ-9/GAD-7 screenings, safety plans, 20,670+ resources, offline PWA | All populations; crisis-adjacent |
| SVC-003 | SafeReport Compliance Platform | safereports.net | Mandatory-reporter incident management; 50-state regulation DB, 7-stage lifecycle, tamper-evident audit trails, court-admissible records | Clinicians, educators, mandatory reporters |
| SVC-004 | Community Voice | thrivingcommunitiesforall.com | Participant intake, benefits navigation, community issue-surfacing, ITI (Integration Through Invitation) | Under-resourced community members |

### Tier 2 — High-Availability Services (99.5% uptime target)

| Service ID | Service Name | Description | Populations Served |
|---|---|---|---|
| SVC-005 | Trade Sims | 5-trade simulation engine (plumbing, electrical, HVAC, welding, carpentry); 75 lessons, industry-grade physics engines (MNA, Hardy-Cross, AWS D1.1); 10-language AI tutor | Workforce trainees, CTE students |
| SVC-006 | AI Workforce Academy | 6-track, 29-module AI workforce curriculum; 24+ hands-on projects; credential routing at 80% completion | Youth, adult re-skilling |
| SVC-007 | Career Explorer | 55+ career pathways across 12 industries; versioned plan revisions; WIOA-aligned | Job seekers, case managers |
| SVC-008 | Justice & Reentry Platform | RNR/CBI/NRRC-aligned reentry support; credential pathways; employment bridge | Justice-involved individuals |
| SVC-009 | Foster Youth Transition Engine | ETV, Chafee, Medicaid-to-26, state-specific extended foster care; housing + credential bridge | Current and former foster youth |
| SVC-010 | Sankofa Health Network | Health-equity gateway; culturally-responsive BH assessments; GIS resource matching | Black, Latino, Indigenous, immigrant communities |

### Tier 3 — Standard Services (99.0% uptime target)

| Service ID | Service Name | Description |
|---|---|---|
| SVC-011 | Ecosystem Nexus | Cross-platform health monitoring, heartbeat tracking (25 platforms), bilateral exchange protocols |
| SVC-012 | Partner API Hub | External integration layer; `tcaf_*` scoped API keys, audit-logged, rate-limited |
| SVC-013 | Grant Command Center | Internal grant pipeline management; compliance matrix; RFP fidelity engine |
| SVC-014 | Chainweb Workforce Intelligence | Regional labor-market signal aggregation; CEDS EDA-aligned (PM1-PM5); 12 TX EDD regions |
| SVC-015 | Navigator (AI Benefits Guide) | Audience-aware benefits navigation; live DB context injection; 107-language support |

---

## 3. Service Level Agreements (SLAs)

### 3.1 Uptime SLAs by Tier

| Tier | Target Uptime | Max Allowed Monthly Downtime | Measurement Window |
|---|---|---|---|
| Tier 1 (Mission-Critical) | 99.9% | 43.8 minutes/month | Rolling 30 days, 24×7 |
| Tier 2 (High-Availability) | 99.5% | 3.65 hours/month | Rolling 30 days, 24×7 |
| Tier 3 (Standard) | 99.0% | 7.3 hours/month | Business hours (M-F 8am–6pm CT) |

### 3.2 Incident Response SLAs

| Priority | Definition | Examples | Initial Response | Status Update Cadence | Target Resolution |
|---|---|---|---|---|---|
| **P1 — Critical** | Complete service outage OR data integrity risk OR active crisis-routing failure | SVC-001/002/003 down; SafeReport cannot accept submissions; Whole-Person Health crisis routing broken | **1 hour** (24×7) | Every 30 minutes | **4 hours** |
| **P2 — High** | Partial service outage affecting >25% of users OR security event OR Tier 2 service down | AI tutor returning errors for majority of sessions; Partner API authentication failures; Trade Sims physics engine broken | **4 hours** (24×7) | Every 2 hours | **8 hours** |
| **P3 — Medium** | Degraded performance OR Tier 3 service down OR non-critical feature broken | Slow load times; Ecosystem Nexus heartbeat gaps; Career Explorer pathway display error | **1 business day** | Once per business day | **3 business days** |
| **P4 — Low** | Cosmetic issues OR documentation requests OR minor UI bugs | Copy errors; icon misalignment; feature requests | **2 business days** | Upon resolution | **5 business days** |

### 3.3 SLA Credits (where contractually applicable)

| SLA Miss | Credit Applied to Contract Value |
|---|---|
| Uptime 99.9% → 99.5% | 5% |
| Uptime 99.5% → 99.0% | 10% |
| Uptime below 99.0% | 25% |
| P1 response > 2 hours | 5% |
| P1 unresolved > 8 hours | 10% additional |

Credits are calculated on the affected month's contract value and applied to the following billing period.

---

## 4. Incident Management

### 4.1 Incident Lifecycle (7 Stages)

```
DETECT → LOG → CLASSIFY → ASSIGN → INVESTIGATE → RESOLVE → CLOSE
```

| Stage | Owner | Action | Tool/Record |
|---|---|---|---|
| **1. Detect** | Automated monitoring OR user report | Platform health check fires alert OR user submits report | Ecosystem Nexus heartbeat system; `/api/agent/health` |
| **2. Log** | First responder (Dr. Flood or designated ops lead) | Create incident record with timestamp, affected service, reporter, initial impact assessment | `docs/itsm/incident-log.md` (append-only) |
| **3. Classify** | First responder | Assign priority (P1–P4) using criteria in §3.2 | Incident log |
| **4. Assign** | Dr. Flood | Route to technical owner; notify affected partners if P1/P2 | Email + SMS to owner |
| **5. Investigate** | Technical owner | Root-cause analysis; document findings in incident record | Incident log |
| **6. Resolve** | Technical owner | Apply fix; verify service restoration; document resolution steps | Incident log + git commit |
| **7. Close** | Dr. Flood | Confirm with reporter/partner; schedule post-incident review if P1/P2; deposit lessons to `docs/itsm/known-errors.md` | Incident log closed |

### 4.2 Escalation Path

```
Technical Owner (30 min no response)
    → Dr. Terry Flood, President — terryflood@thrivingcommunitiesforall.com
        → Replit Platform Support (infrastructure-level outages)
            → Funder/Partner Notification (if P1 exceeds 2 hours or involves data)
```

### 4.3 Security Incident Protocol

Security events (unauthorized access, credential exposure, data breach, injection attack) are automatically elevated to P1 and trigger:
1. Immediate service isolation (if active exploitation detected)
2. Replit security contact notified within 1 hour
3. Affected partners notified within 24 hours
4. Regulatory notification per applicable law (HIPAA BAA, state breach laws) within 72 hours

---

## 5. Change Management

### 5.1 Change Categories

| Type | Definition | Examples | Approval Required |
|---|---|---|---|
| **Standard** | Pre-approved, low-risk, routine changes | Content updates, SLA language, seed data, copy changes | None — follows checklist |
| **Normal** | Planned changes requiring review | New routes, schema migrations, new API integrations, dependency updates | Dr. Flood sign-off + staging test |
| **Emergency** | Unplanned change required to resolve a P1/P2 incident | Hotfix to broken auth, security patch, critical dependency vulnerability | Dr. Flood verbal approval; documented post-facto within 24 hours |

### 5.2 Normal Change Process

```
1. Draft change description + impact assessment
2. Test in development environment (npm run dev)
3. Run typecheck: npm run typecheck
4. Run E2E: npx playwright test (for UI-bearing changes)
5. Dr. Flood approval (written — email or session note)
6. Deploy to production
7. Monitor for 30 minutes post-deploy
8. Document in session log: docs/agent-memory/sessions/YYYY-MM-DD.md
```

**Forbidden changes without explicit instruction:**
- `vite.config.ts`, `drizzle.config.ts`, `package.json` — per TCAF user preferences

### 5.3 Change Freeze Windows

| Window | Duration | Trigger |
|---|---|---|
| Pre-submission freeze | 48 hours before any grant submission deadline | Grant calendar |
| Post-deploy monitoring | 30 minutes after any production deployment | Automatic |
| Funder review period | Duration of active site review by funder | Notified by Dr. Flood |

---

## 6. Problem Management

### 6.1 Problem vs. Incident

- **Incident:** a single disruption to service (fix it fast, restore service)
- **Problem:** the underlying cause of one or more incidents (investigate root cause, prevent recurrence)

### 6.2 Problem Record Threshold

A problem record is opened when:
- Same incident type recurs 3+ times within 30 days
- A P1 incident is closed (always triggers problem investigation)
- A security incident occurs (always triggers problem investigation)

### 6.3 Known Error Database

`docs/itsm/known-errors.md` — append-only log of confirmed problems with:
- Problem ID
- Affected service(s)
- Root cause (confirmed or suspected)
- Workaround available (Y/N + description)
- Fix status (investigating / fix-in-progress / fix-deployed / accepted-risk)

---

## 7. Configuration Management (CMDB — Lightweight)

### 7.1 Configuration Items (CIs)

| CI Category | Items | Record Location |
|---|---|---|
| **Applications** | 15 public-facing services (SVC-001 through SVC-015) | `docs/ecosystem-catalog.md` |
| **Infrastructure** | Replit hosting environment, PostgreSQL DB, object storage | `docs/agent-memory/topics/architecture.md` |
| **Integrations** | OpenAI, Anthropic, OpenRouter, Resend, Replit Auth, Object Storage | `.replit` + environment secrets |
| **External APIs** | Census API, SAM.gov, Nominatim/OSM | `server/community-api-routes.ts` |
| **Partner API connections** | Chainweb, ecosystem partners, `tcaf_*` key holders | `server/partner-api-hub-routes.ts` |
| **DNS / Domains** | 15 live domains (verified in `docs/ecosystem-catalog.md`) | Replit Publishing → Domains |

### 7.2 CI Verification Protocol

Before any proposal, partnership agreement, or funder meeting that references a service's availability:
1. Run `scripts/ecosystem-alignment-scan.sh` — verifies live DNS for all registered platforms
2. Probe `/api/agent/health` — confirms DB and AI provider connectivity
3. Do NOT claim uptime for platforms marked ❌ in `docs/ecosystem-catalog.md`

---

## 8. Roles & Responsibilities (RACI)

| Process | Dr. Flood (President) | Technical Owner (AI Agent / Dev) | Partner Orgs |
|---|---|---|---|
| Incident detection | Informed | **Responsible** | Accountable (report) |
| Incident classification | **Accountable** | Responsible | Consulted |
| P1/P2 resolution | **Accountable** | Responsible | Informed |
| Change approval | **Accountable** | Responsible | Consulted |
| SLA reporting | **Accountable** | Responsible | Informed |
| Problem management | **Accountable** | Responsible | Informed |
| CMDB updates | **Accountable** | Responsible | — |

---

## 9. Compliance Attestation

This framework is adopted as of **July 2, 2026** by Thriving Communities for All (TCAF), EIN 41-3618003, operating as ThriveUp.

**ITIL 4 alignment:** This framework applies ITIL 4 guiding principles — focus on value, progress iteratively, collaborate and promote visibility, think and work holistically, keep it simple and practical — sized appropriately for a mission-driven nonprofit operating at community scale.

**Federal alignment:** Designed to satisfy OMB Circular A-130 (Managing Information as a Strategic Resource) and NIST SP 800-53 operational controls for service continuity, incident response (IR family), and configuration management (CM family).

**Review and update authority:** Dr. Terry Flood, President, TCAF. Framework is reviewed annually or upon material change to the platform, funder requirements, or regulatory environment.

---

## 10. Related Documents

| Document | Location | Purpose |
|---|---|---|
| Ecosystem Catalog | `docs/ecosystem-catalog.md` | Authoritative platform registry |
| Capabilities Inventory | `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` | Full technical capabilities (funder-facing) |
| RFP Fidelity Doctrine | `docs/grants/RFP-FIDELITY-DOCTRINE.md` | Proposal compliance standards |
| Threat Model | `threat_model.md` | Security architecture and trust boundaries |
| Incident Log | `docs/itsm/incident-log.md` | Append-only incident record (create on first incident) |
| Known Errors | `docs/itsm/known-errors.md` | Problem management database (create on first problem) |
| Active Commitments | `docs/active-commitments.md` | Operational outstanding items |
