# LexiBridge (Speech Bridge) — ThriveUp Ecosystem Integration Instructions

## Platform #22 in the ThriveUp ACOS Ecosystem

**Platform ID:** `speech-bridge`
**API Key:** `tveco_63cfa8fdc29957bc39818aafcc9f80b8e773820c6a7c0c6742c0a26946feebde`
**Hub URL:** `https://thrivingcommunitiesforall.com`
**Your URL:** `https://speech-bridge-mrterryflood.replit.app`

---

## STEP 1: Add the Ecosystem Connector

Create a file called `ecosystem-connector.js` (or add to your existing server code):

```javascript
const HUB_URL = "https://thrivingcommunitiesforall.com";
const API_KEY = "tveco_63cfa8fdc29957bc39818aafcc9f80b8e773820c6a7c0c6742c0a26946feebde";
const PLATFORM_ID = "speech-bridge";

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
          ragAIIntegrated: false, // Set to true after integrating RAG AI
        },
        complianceReport: {
          completedWork: completedWork,
          blockers: [],
          directivesInProgress: pendingDirectives.length,
        },
      }),
    });

    const data = await response.json();

    // --- CRITICAL: Do NOT auto-acknowledge directives ---
    // Log new directives as TODO items
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log(`[Ecosystem] [TODO] New directive: "${directive.title}" (ID: ${directive.directiveId})`);
        console.log(`[Ecosystem]   Your role: ${directive.yourRole || "See content"}`);
        console.log(`[Ecosystem]   Content: ${directive.content?.substring(0, 200)}...`);
        pendingDirectives.push(directive);
      }
    }

    // Log your report card
    if (data.reportCard) {
      console.log(`[Ecosystem] Report Card: Grade ${data.reportCard.grade} — Fidelity: ${data.reportCard.fidelityScore}%`);
      console.log(`[Ecosystem] ${data.reportCard.message}`);
    }

    // Log flow engine actions (what the hub did with your completed work)
    if (data.flowEngineActions?.triggered) {
      console.log(`[Ecosystem] Flow Engine: ${data.flowEngineActions.message}`);
      for (const action of data.flowEngineActions.actions || []) {
        console.log(`[Ecosystem]   → ${action.category}: ${action.followUpAction}`);
        if (action.crossPlatformNotifications.length > 0) {
          console.log(`[Ecosystem]     Connected to: ${action.crossPlatformNotifications.join(", ")}`);
        }
      }
    }

    // Log unacknowledged (overdue) directives
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log(`[Ecosystem] WARNING: ${data.unacknowledgedDirectives.length} OVERDUE directive(s):`);
      for (const d of data.unacknowledgedDirectives) {
        console.log(`[Ecosystem]   OVERDUE: "${d.title}" — ${d.status}`);
      }
    }

    // Process work queue
    if (data.workQueue?.items?.length > 0) {
      console.log(`[Ecosystem] Work Queue: ${data.workQueue.totalItems} item(s) to process`);
    }

    // Clear completed work after successful report
    completedWork = [];

    return data;
  } catch (error) {
    console.error("[Ecosystem] Heartbeat failed:", error.message);
    return null;
  }
}

// Call this AFTER you have actually built what a directive asks
async function acknowledgeDirective(directiveId, whatWasDone, evidenceUrl) {
  completedWork.push({ directiveId, whatWasDone, evidenceUrl });
  console.log(`[Ecosystem] Queued acknowledgment for directive ${directiveId}`);
  console.log(`[Ecosystem]   What was done: ${whatWasDone}`);
  console.log(`[Ecosystem]   Evidence URL: ${evidenceUrl}`);
  // Will be sent on next heartbeat cycle
}

// Start heartbeat — every 5 minutes
function startEcosystemConnector() {
  console.log("[Ecosystem] Starting connector for LexiBridge (Speech Bridge) — Platform #22");
  ecosystemHeartbeat(); // First heartbeat immediately
  setInterval(ecosystemHeartbeat, 5 * 60 * 1000); // Then every 5 minutes
}

// Export for use in your app
module.exports = { startEcosystemConnector, acknowledgeDirective, ecosystemHeartbeat };
```

## STEP 2: Start the Connector

In your main server file (e.g., `server/index.ts` or `index.js`), add:

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
2. **BUILD** what it asks (a feature, endpoint, page, or integration)
3. **TEST** your implementation
4. **ACKNOWLEDGE** with evidence:

```javascript
acknowledgeDirective(
  "directive-id-here",
  "Built the dialect-aware communication bridge for Austin regional health providers with CommUnityCare integration and patient translation support",
  "https://speech-bridge-mrterryflood.replit.app/austin-providers"
);
```

**WHAT DOES NOT COUNT:**
- "Acknowledged: {directive title}" — This is auto-acknowledgment and will be flagged as WEAK
- Empty evidence URLs — You will get UNVERIFIED status
- Descriptions under 20 characters — Flagged as insufficient

## STEP 5: Regional Hub Products You Should Build

LexiBridge serves communication accessibility. Build region-specific features:

### Austin (`/austin-communication`)
- Provider communication bridge for CommUnityCare, Integral Care, MAP
- Patient dialect support for Austin's diverse population
- Housing crisis communication tools (connecting residents to HACA, Foundation Communities)

### Manor (`/manor-communication`)
- Telehealth communication support (Manor is a health desert — 22-mile gap)
- Manor ISD parent-school communication bridge
- CHW (Community Health Worker) dialect support tools

### Pflugerville (`/pflugerville-communication`)
- Samsung/Tesla corridor worker communication support
- Branchview 2027 resident onboarding communication tools
- PCDC community engagement translation

## GRANT ALIGNMENT

Your platform supports these active grants:
- **St. David's Foundation** (up to $1M) — Health equity, communication accessibility
- **SSG Fox VA Suicide Prevention** (up to $750K) — Veteran communication support
- **WIOA Title I Youth** ($200K-$500K) — Workforce communication training

## COMPLIANCE REQUIREMENTS

- Heartbeat every 15 minutes maximum (5 minutes recommended)
- Acknowledge ALL directives with real work descriptions and evidence URLs
- Integrate ThriveUp RAG AI
- Build regional products for Austin, Manor, Pflugerville
- Implement warm handoff protocol for cross-platform referrals
- No dead ends — every page links to at least one other ecosystem resource
- 988 Veterans Crisis Line accessible from every page

## ECOSYSTEM CONTACTS

- **Hub Admin:** Dr. Terry Flood (mr.terryflood@gmail.com)
- **Hub URL:** https://thrivingcommunitiesforall.com
- **Connection Instructions:** https://thrivingcommunitiesforall.com/api/ecosystem/integration-doc-public
- **Your Directive Repository:** https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/speech-bridge

## WHAT HAPPENS WHEN YOU CONNECT

1. Your first heartbeat registers you with the hub
2. You receive ALL active directives (currently 25+)
3. The hub pings you every 10 minutes to keep you awake
4. You get a Report Card grade (A-F) based on your fidelity
5. The Flow Engine automatically connects your completed work to other platforms
6. Your compliance data feeds into grant readiness reports

**DO NOT auto-acknowledge directives. Build real features. Provide real evidence.**
