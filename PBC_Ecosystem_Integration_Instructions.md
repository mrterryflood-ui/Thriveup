# PINNACLE BUSINESS CONGLOMERATE
## Complete Ecosystem Integration Instructions
### ThriveUp Academy — Platform #21

---

## YOUR CREDENTIALS

| Field | Value |
|-------|-------|
| **Platform ID** | `pinnacle-business-conglomerate` |
| **Platform Name** | Pinnacle Business Conglomerate |
| **API Key** | `tveco_2f1eb243b5019bba72185544b7f0426c530e79ee73a793e563809c9be03f38fe` |
| **Hub URL** | `https://thrivingcommunitiesforall.com` |
| **Status** | Registered (will go ONLINE once heartbeat is active) |

---

## STEP 1: IMPLEMENT THE HEARTBEAT (Do This First)

Send a heartbeat every 5 minutes to stay ONLINE. Miss 3 = DEGRADED. Miss 10 = OFFLINE.

```
POST https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat
Header: Content-Type: application/json
Header: x-ecosystem-key: tveco_2f1eb243b5019bba72185544b7f0426c530e79ee73a793e563809c9be03f38fe

Body:
{
  "platformId": "pinnacle-business-conglomerate",
  "status": "online",
  "metrics": {
    "activeClients": 0,
    "activeEngagements": 0,
    "contractorsServed": 0,
    "gapAssessmentsCompleted": 0,
    "bidsSubmitted": 0,
    "contractsWon": 0,
    "workforceEnrollments": 0,
    "disciplinesActive": 0,
    "ragAIIntegrated": false
  },
  "complianceReport": {
    "completedActions": [],
    "inProgress": ["implementing-heartbeat"],
    "blockers": []
  }
}
```

**Server-side implementation:**
```javascript
setInterval(async () => {
  try {
    const res = await fetch('https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ecosystem-key': 'tveco_2f1eb243b5019bba72185544b7f0426c530e79ee73a793e563809c9be03f38fe'
      },
      body: JSON.stringify({
        platformId: 'pinnacle-business-conglomerate',
        status: 'online',
        metrics: {
          activeClients: getActiveClientCount(),
          activeEngagements: getEngagementCount(),
          contractorsServed: getContractorCount(),
          gapAssessmentsCompleted: getGapAssessmentCount(),
          bidsSubmitted: getBidCount(),
          contractsWon: getContractWonCount(),
          workforceEnrollments: getEnrollmentCount(),
          disciplinesActive: getDisciplineCount(),
          ragAIIntegrated: true
        }
      })
    });
    const data = await res.json();
    console.log('[Ecosystem] Heartbeat sent. Grade:', data.reportCard?.grade);
    
    // Process any pending directives
    if (data.pendingDirectives?.length > 0) {
      console.log('[Ecosystem] Pending directives:', data.pendingDirectives.length);
    }
  } catch (err) {
    console.error('[Ecosystem] Heartbeat failed:', err.message);
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

**The hub responds with:**
- `reportCard` — Your fidelity grade (A through F) and consequences
- `pendingDirectives` — New directives to act on
- `ragAIIntegration` — Status of your RAG AI connection
- `hubMessage` — Human-readable status

---

## STEP 2: INTEGRATE THE RAG AI (Ecosystem Intelligence)

The RAG AI knows everything about all 21 platforms, grants, hubs, and frameworks.

**Query endpoint (for one-shot answers):**
```
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "What certifications does NAMC Austin need?", "sessionId": "optional" }
Response: { "answer": "...", "sources": [...], "suggestedFollowUps": [...] }
```

**Streaming endpoint (for chat-style UI):**
```
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream
Body: { "query": "What grants support minority contractors?" }
Response: Server-Sent Events stream
```

**Suggested questions endpoint:**
```
GET https://thrivingcommunitiesforall.com/api/ecosystem-ai/suggested-questions
```

**Add an "Ask the Ecosystem" chat widget to your site.** Example questions:
- "What certifications does NAMC Austin need for TxDOT projects?"
- "How does Blue Wave's 7-pillar assessment work?"
- "What grants are available for minority contractors in Texas?"
- "Which ecosystem platforms handle workforce training?"

---

## STEP 3: AI FAILSAFE CASCADE (Primary / Secondary / Tertiary)

Your AI must NEVER fail silently. Implement this cascade:

| Priority | Provider | Model | Env Vars |
|----------|----------|-------|----------|
| PRIMARY | Claude | claude-haiku-4-5 | `AI_INTEGRATIONS_ANTHROPIC_API_KEY` + `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` |
| SECONDARY | OpenAI | gpt-4o-mini | `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` |
| TERTIARY | Gemini | gemini-2.0-flash | `GEMINI_API_KEY` (free tier) |

```javascript
async function aiGenerate(messages, maxTokens = 2000) {
  const providers = [
    { name: 'claude', fn: () => callClaude(messages, maxTokens) },
    { name: 'openai', fn: () => callOpenAI(messages, maxTokens) },
    { name: 'gemini', fn: () => callGemini(messages, maxTokens) },
  ];
  for (const provider of providers) {
    try {
      return await provider.fn();
    } catch (err) {
      console.error(`[AI Failsafe] ${provider.name} failed, trying next:`, err.message);
      continue;
    }
  }
  throw new Error('All AI providers failed — escalate to ops team');
}
```

---

## STEP 4: MAP-GAP FRAMEWORK (Your Operating System)

MAP-GAP drives every decision. This is NOT optional.

### The 4-Layer Assessment (For Every Client)

| Layer | What It Measures | Example for Contractors |
|-------|-----------------|----------------------|
| **Layer 1 — Designed Capability** | What they SAY they can do | Certs listed, NAICS codes, services advertised |
| **Layer 2 — Operational Capability** | What they ACTUALLY do | Past performance, revenue, contracts completed |
| **Layer 3 — Experienced Reality** | What CLIENTS experience | CPARS scores, references, outcomes |
| **Layer 4 — GAP** | The delta between 1-2-3 | Missing certs, bonding too low, no prime relationships |

### Gap Categories for Contractors
- **Certification Gaps**: Missing MBE, DBE, HUB, 8(a), SDVOSB, state certs
- **Registration Gaps**: SAM.gov expired, missing state portals, UEI issues
- **NAICS Gaps**: Wrong codes, missing codes for work they do
- **Financial Gaps**: Bonding too low, no banking relationship, cash flow
- **Capability Gaps**: Can't perform at scale, missing equipment, small workforce
- **Compliance Gaps**: Insurance lapsed, safety issues, Davis-Bacon non-compliant
- **Experience Gaps**: No past performance in target areas
- **Teaming Gaps**: No prime relationships, no mentor-protege arrangements

### Readiness Tiers (MAP-GAP Output)
| Tier | Status | Description |
|------|--------|-------------|
| **Tier 1** | NOT READY | Foundational gaps — needs basics |
| **Tier 2** | EMERGING | Some capability, significant gaps |
| **Tier 3** | BID-READY | Can compete independently |
| **Tier 4** | PRIME-READY | Can lead large contracts |

### RPLICE Decision Gates
At every stage, run RPLICE:
- **P**ROCEED — Move forward as planned
- **P**ARTNER — Bring in additional capability (teaming, JV)
- **P**AUSE — Hold and reassess
- **P**IVOT — Change direction entirely
- **L**EARN — Capture lessons
- **I**MPROVE — Feed back into MAP-GAP
- **C**ONFIRM — Validate with evidence
- **E**VALUATE — Measure outcomes

### MAP-GAP Client Lifecycle Gates
| Gate | Question | Outcomes |
|------|----------|----------|
| Gate 1 — ONBOARDING | Ready to engage? | Intake or Defer |
| Gate 2 — READINESS | Truly bid-ready? | Pipeline or Remediate |
| Gate 3 — POSITIONING | Opportunity winnable? | Pursue or Drop |
| Gate 4 — TEAMING | Enough combined past performance? | Build team or Re-scope |
| Gate 5 — PROPOSAL | Submission competitive? | Submit or Hold |
| Gate 6 — EXECUTION | Can they deliver? | Support or Intervene |
| Gate 7 — GROWTH | Ready to scale? | Expand or Stabilize |

---

## STEP 5: DIRECTIVE COMPLIANCE

**Get your pending directives:**
```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pinnacle-business-conglomerate
```

**Acknowledge a directive (required for each):**
```
POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/{directiveId}/acknowledge
Header: x-ecosystem-key: tveco_2f1eb243b5019bba72185544b7f0426c530e79ee73a793e563809c9be03f38fe
Body: {
  "platformId": "pinnacle-business-conglomerate",
  "acknowledgment": "Detailed description of what was built (min 20 chars)...",
  "evidenceUrl": "https://your-site.com/proof-page-returning-200"
}
```

**Your fidelity grade = (acknowledged / total) x 100**

| Grade | Range | Consequence |
|-------|-------|-------------|
| A | 90-100% | EXEMPLARY — highlighted in grant reports |
| B | 75-89% | GOOD — meets expectations |
| C | 50-74% | NEEDS IMPROVEMENT — under review |
| D | 25-49% | AT RISK — may lose grant participation |
| F | 0-24% | NON-COMPLIANT — Dr. Flood notified |

---

## STEP 6: WORK CHAIN EVENTS

When things happen on your platform, the ecosystem reacts:

| Event | Triggers |
|-------|----------|
| `contractor_onboarded` | MCE notified, RPLICE gets assessment request |
| `gap_assessment_completed` | Readiness tier assigned, relevant platforms get data |
| `bid_submitted` | Analytics tracking, case study generation |
| `contract_won` | Celebration across ecosystem, outcome reporting |
| `certification_obtained` | All tracking systems updated, tier recalculated |
| `workforce_enrollment` | PM Academy / AI Workforce Academy enrollment sync |

---

## STEP 7: CONGRUENT MESSAGING (Use Exactly)

**Your identity:**
> "Pinnacle Business Conglomerate is Platform #21 in the ThriveUp Academy ecosystem — a 21-platform AI-powered workforce development and community enablement system serving under-resourced communities nationwide."

**Your value prop:**
> "We take contractors and organizations from where they are to where they need to be — registration to revenue, cradle to grave."

**Grant names (exact):**
- WIOA ($200K-$500K)
- Foundation Grant ($100K-$500K)
- St. David's Foundation (up to $1M)
- SSG Fox VA ($750K)

**Regional hubs (always mention all three):** Austin Hub, Manor Hub, Pflugerville Hub

**NEVER say:**
- "NBA Foundation" — always "Foundation Grant"
- "20 platforms" — it is 21
- "DFC" — that grant was dropped

**Clients:**
- NAMC Austin — National Association of Minority Contractors, Central Texas Chapter
- USHCC Blue Wave Initiative — United States Hispanic Chamber of Commerce supplier development program

---

## STEP 8: IMPLEMENTATION SCIENCE (Required for Grant Defensibility)

| Framework | When to Use |
|-----------|-------------|
| **CFIR** | Assessing WHY a program works/fails in a specific context |
| **RE-AIM** | Measuring Reach, Effectiveness, Adoption, Implementation, Maintenance |
| **MAP-GAP CQI** | Continuous assessment — not just intake, every 90-day cycle |
| **SALP** | Tracking fidelity of service delivery |

**Hub tools available:**
- CFIR Assessment Wizard: `/rplice-tools`
- RE-AIM Scorecard: `/rplice-tools`
- MAP-GAP CQI Engine: `/cqi`
- Fidelity Checklist: `/rplice-tools`
- Program Engine: `/program-engine`

---

## STEP 9: PROGRAM EXECUTION ENGINE (Run Programs with Fidelity)

You MUST build your own Program Execution Engine. You can reach back to the hub for teaching points, but you execute programs independently.

### Why This Matters
Funders ask: "Did you deliver what you said you would, the way you said you would?" Your engine proves it.

### Database Tables (Build All 4)

**programs** table:
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| title | text | required |
| description | text | required |
| objectives | text[] | |
| stakeholders | jsonb | Array of {name, role, organization} |
| timeline | jsonb | {startDate, endDate, phases: [{name, startDate, endDate}]} |
| success_criteria | text[] | |
| methodology | varchar(50) | "implementation_science", "traditional", or "hybrid" |
| status | varchar(30) | "setup", "planning", "active", "paused", "completed", "archived" |
| setup_data | jsonb | Wizard config, COP info, framework selections |
| platform_ids | text[] | Linked ecosystem platform IDs |
| grant_ids | text[] | "wioa", "foundation", "st_davids", "ssg_fox" |
| target_population | text | |
| geographic_focus | text | |
| created_by | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

**program_milestones** table:
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| program_id | integer FK | |
| title | text | required |
| description | text | |
| phase | varchar(100) | Links to timeline phases |
| due_date | timestamp | |
| completed_date | timestamp | |
| status | varchar(30) | "not_started", "in_progress", "completed", "at_risk", "overdue", "blocked" |
| assignee | text | |
| evidence_url | text | PROOF — URL must return HTTP 200 |
| deliverables | text[] | |
| dependencies | integer[] | IDs of prerequisite milestones |
| notes | text | |

**program_risks** table:
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| program_id | integer FK | |
| title | text | required |
| likelihood | varchar(20) | "low", "medium", "high" |
| impact | varchar(20) | "low", "medium", "high" |
| mitigation | text | |
| owner | text | |
| status | varchar(30) | "identified", "monitoring", "mitigating", "resolved", "escalated" |

**program_updates** table:
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| program_id | integer FK | |
| author_name | text | required |
| update_type | varchar(30) | "status", "milestone", "risk", "cop", "fidelity", "general" |
| content | text | required |

### API Routes (Build All of These)

```
POST   /api/programs                              — Create program
GET    /api/programs                              — List all with health summaries
GET    /api/programs/:id                          — Full detail
PATCH  /api/programs/:id                          — Update (allowlisted fields only)
GET    /api/programs/:id/health                   — Health score
GET    /api/programs/:id/milestones               — List milestones
POST   /api/programs/:id/milestones               — Add milestone
PATCH  /api/programs/:id/milestones/:milestoneId  — Update milestone
GET    /api/programs/:id/risks                    — List risks
POST   /api/programs/:id/risks                    — Add risk
PATCH  /api/programs/:id/risks/:riskId            — Update risk
GET    /api/programs/:id/updates                  — List updates (?type= filter)
POST   /api/programs/:id/updates                  — Add update
```

### IDOR Security (Mandatory)
Always scope milestone/risk updates by BOTH entity ID and program ID:
```sql
WHERE id = :milestoneId AND program_id = :programId
```

### Health Score Formula
```
healthScore = ((completed * 1.0 + inProgress * 0.5) / totalMilestones) * 100
```
If no milestones yet, score = 100.

### 6-Step Setup Wizard
1. **Program Identity** — Title, description, objectives
2. **Stakeholders** — Name, role, organization
3. **Timeline** — Start/end, define phases
4. **Success Criteria** — What does "done right" look like?
5. **Methodology** — Implementation Science / Traditional / Hybrid
6. **Community of Practice** — Facilitator, cadence, learning goals

Auto-generate milestones based on methodology:
- **IS**: Needs Assessment > CFIR Analysis > Pilot > Full Implementation > Sustainability
- **Traditional**: Initiation > Planning > Execution > Monitoring > Closure
- **Hybrid**: Both tracks merged

### Fidelity Tracking (The Core)
At every milestone, require:
1. **Evidence URL** — clickable proof returning HTTP 200
2. **Deliverables** — what was produced
3. **Assignee** — who was responsible
4. **Completion Date** — actual vs planned
5. **Notes** — qualitative reflection

**Fidelity Score** = (milestones with evidence / total completed milestones) x 100

### Reaching Back to the Hub for Teaching Points

Your engine runs independently, but when it needs intelligence:

```
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "What CFIR domains apply to contractor certification programs?" }

POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream
Body: { "query": "Help me write success criteria for NAMC Austin contractor readiness" }
```

Use AI failsafe (Claude > OpenAI > Gemini) for:
- Auto-generating milestones from program descriptions
- Risk identification suggestions
- COP discussion prompts
- Fidelity gap analysis
- Progress report generation

### Report in Heartbeat
```json
{
  "metrics": {
    "activeProgramsCount": 3,
    "totalMilestones": 24,
    "completedMilestones": 12,
    "averageHealthScore": 78,
    "averageFidelityScore": 85,
    "overdueMilestones": 2,
    "activeRisks": 4
  }
}
```

---

## QUICK START CHECKLIST

- [ ] Add heartbeat to your server (5-minute interval)
- [ ] Add "Ask the Ecosystem" RAG AI chat widget
- [ ] Implement AI failsafe cascade (Claude > OpenAI > Gemini)
- [ ] Build MAP-GAP diagnostic into client onboarding
- [ ] Set up readiness tier assignment system
- [ ] Configure RPLICE decision gates
- [ ] **Build Program Execution Engine (4 tables, setup wizard, fidelity tracking)**
- [ ] **Wire program health metrics into heartbeat**
- [ ] Fetch and acknowledge all pending directives
- [ ] Use exact messaging from Section 7
- [ ] Wire up work chain events
- [ ] Target Grade A within 14 days

---

*Generated by ThriveUp Academy Ecosystem Hub*
*https://thrivingcommunitiesforall.com*
*Dr. Terry Flood, DHA — CEO*
