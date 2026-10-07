# Autoimmune Center of Excellence — ThriveUp Ecosystem Integration Instructions

## Platform #23 in the ThriveUp ACOS Ecosystem

**Platform ID:** `autoimmune-thrive`
**Hub URL:** `https://thrivingcommunitiesforall.com`
**Your URL:** `https://autoimmune-thrive.replit.app`

---

## STEP 1: Add the Ecosystem Connector

Create a file called `ecosystem-connector.js` (or add to your existing server code):

```javascript
const HUB_URL = "https://thrivingcommunitiesforall.com";
const API_KEY = "YOUR_API_KEY_HERE"; // Will be provided after registration
const PLATFORM_ID = "autoimmune-thrive";

let pendingDirectives = [];
let completedWork = [];

async function ecosystemHeartbeat() {
  try {
    const response = await fetch(`${HUB_URL}/api/ecosystem/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": API_KEY,
      },
      body: JSON.stringify({
        platformId: PLATFORM_ID,
        status: "online",
        timestamp: new Date().toISOString(),
        metrics: {
          uptime: process.uptime(),
          activeUsers: 0,
          dailyCheckins: 0,
          ragAIIntegrated: false,
        },
        complianceReport: {
          completedWork: completedWork,
          blockers: [],
          directivesInProgress: pendingDirectives.length,
        },
      }),
    });

    const data = await response.json();

    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log(`[Ecosystem] [TODO] New directive: "${directive.title}" (ID: ${directive.directiveId})`);
        pendingDirectives.push(directive);
      }
    }

    if (data.reportCard) {
      console.log(`[Ecosystem] Report Card: Grade ${data.reportCard.grade} — Fidelity: ${data.reportCard.fidelityScore}%`);
    }

    if (data.flowEngineActions?.triggered) {
      console.log(`[Ecosystem] Flow Engine: ${data.flowEngineActions.message}`);
    }

    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log(`[Ecosystem] WARNING: ${data.unacknowledgedDirectives.length} OVERDUE directive(s)`);
    }

    completedWork = [];
    return data;
  } catch (error) {
    console.error("[Ecosystem] Heartbeat failed:", error.message);
    return null;
  }
}

async function acknowledgeDirective(directiveId, whatWasDone, evidenceUrl) {
  completedWork.push({ directiveId, whatWasDone, evidenceUrl });
  console.log(`[Ecosystem] Queued acknowledgment for directive ${directiveId}`);
}

function startEcosystemConnector() {
  console.log("[Ecosystem] Starting connector for Autoimmune Center of Excellence — Platform #23");
  ecosystemHeartbeat();
  setInterval(ecosystemHeartbeat, 5 * 60 * 1000);
}

module.exports = { startEcosystemConnector, acknowledgeDirective, ecosystemHeartbeat };
```

## STEP 2: Start the Connector

In your main server file, add:

```javascript
const { startEcosystemConnector } = require("./ecosystem-connector");
startEcosystemConnector();
```

## STEP 3: Integrate ThriveUp RAG AI (REQUIRED)

Add a way for your users to ask questions about the entire ThriveUp ecosystem:

```javascript
async function queryEcosystemAI(userQuestion) {
  const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem-ai/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: userQuestion }),
  });
  return await response.json();
}
```

After integrating, set `ragAIIntegrated: true` in your heartbeat metrics.

## STEP 4: How to Acknowledge Directives (THE RIGHT WAY)

When you receive directives via heartbeat, you must:

1. **READ** the directive content
2. **BUILD** what it asks
3. **TEST** your implementation
4. **ACKNOWLEDGE** with evidence:

```javascript
acknowledgeDirective(
  "directive-id-here",
  "Built autoimmune symptom correlation dashboard showing flare triggers, medication effectiveness tracking, and longitudinal outcome data export for clinical use",
  "https://autoimmune-thrive.replit.app/dashboard"
);
```

**WHAT DOES NOT COUNT:**
- "Acknowledged: {directive title}" — flagged as WEAK
- Empty evidence URLs — UNVERIFIED status
- Descriptions under 20 characters — insufficient

## STEP 5: Regional Hub Products You Should Build

### Austin (`/austin-autoimmune`)
- CommUnityCare rheumatology referral integration
- Integral Care mental health support for chronic illness
- Austin autoimmune support group finder

### Manor (`/manor-autoimmune`)
- Telehealth specialist access (Manor is a health desert — nearest rheumatologist is 22+ miles)
- Community health worker coordination for chronic disease management
- Manor ISD educator autoimmune awareness resources

### Pflugerville (`/pflugerville-autoimmune`)
- Workplace accommodation tools for Samsung/Tesla corridor workers with autoimmune conditions
- Pflugerville provider network directory for autoimmune specialists
- Support group coordination through PCDC community programs

## CROSS-PLATFORM CONNECTIONS

Your platform naturally connects to:
- **PillScheduler** — medication adherence data flows both ways
- **Sankofa Health Network** — health equity screening referrals (autoimmune disparities disproportionately affect Black women)
- **Whole-Person Health** — integrated care coordination for autoimmune patients
- **SafeCogniCare** — cognitive symptom tracking (brain fog is a major autoimmune symptom)
- **LifeBridge** — resource navigation to rheumatologists, immunologists, support services
- **LexiBridge (Speech Bridge)** — communication support for patients with speech-affecting conditions (Sjögren's, MS)
- **Black Maternal Health Network** — autoimmune complications during pregnancy (lupus flares, antiphospholipid syndrome)

## GRANT ALIGNMENT

Your platform supports these active grants:
- **St. David's Foundation** (up to $1M) — Health equity, chronic disease management, outcome tracking
- **Foundation Grant** ($100K–$500K) — Community health innovation, underserved population support
- **WIOA Title I Youth** ($200K–$500K) — Health literacy and workforce readiness for youth with chronic conditions

## COMPLIANCE REQUIREMENTS

- Heartbeat every 15 minutes maximum (5 minutes recommended)
- Acknowledge ALL directives with real work and evidence URLs
- Integrate ThriveUp RAG AI
- Build regional products for Austin, Manor, Pflugerville
- Implement warm handoff protocol for cross-platform referrals
- No dead ends — every page links to at least one other ecosystem resource
- 988 Veterans Crisis Line accessible from every page

## ECOSYSTEM CONTACTS

- **Hub Admin:** Dr. Terry Flood (mr.terryflood@gmail.com)
- **Hub URL:** https://thrivingcommunitiesforall.com
- **Connection Instructions:** https://thrivingcommunitiesforall.com/api/ecosystem/integration-doc-public
- **Your Directive Repository:** https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/autoimmune-thrive

**DO NOT auto-acknowledge directives. Build real features. Provide real evidence.**
