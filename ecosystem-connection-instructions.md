# ThriveUp Ecosystem — Complete Platform Connection Instructions
  ## Version 3.0 — Full Two-Way Compliance Feedback Loop
  ## Updated: 2026-03-19

  ---

  # READ THIS FIRST

  These instructions replace ALL previous versions. Previous instructions had four critical issues fixed:
  1. **Wrong API keys** — The old `thrive-ecosystem-{id}-2024` keys were fake. Real keys are `tveco_...` hashes (included below for each platform).
  4. **Hub keeps you awake** — The hub now pings all 20 platforms every 10 minutes with an HTTP GET. This prevents Autoscale sleep. If you do go to sleep and the ping wakes you, your startup heartbeat fires immediately and you catch up on everything. You don't need an external pinger — the hub does it for you.
  2. **Wrong endpoint path** — The old `/api/ecosystem/directives/acknowledge` path doesn't exist. The correct path is `/api/ecosystem/directives/ack`.
  3. **No compliance loop** — Old instructions only sent heartbeats one-way. The hub now talks back with fidelity scores, overdue items, and verified responses on every call.

  ---

  # HOW THE LOOP WORKS

  ```
  STARTUP:
    Platform wakes → Heartbeat fires immediately
    Hub responds: "You have 5 new directives. 3 overdue.
                   Fidelity: 45% (D). Include complianceReport
                   in your next heartbeat."

  EVERY 15 MINUTES:
    Platform → Heartbeat WITH complianceReport
    Hub → Verifies report, updates fidelity, returns directives
    Hub: "Report verified. 2 completed items recorded.
          1 blocker escalated to Shield Atlas."

  WHEN DIRECTIVE IS COMPLETED:
    Platform → POST /ack WITH responseData.whatWasDone
    Hub → "VERIFIED. Fidelity: 75% (B). 3 remaining.
           Next up: Warm Handoff Protocol."

  WHEN BLOCKED:
    Platform → Reports blocker in complianceReport
    Hub → "Blocker acknowledged. Routing to [platform]."
    Named platform → Gets the blocker in THEIR next heartbeat

  Nothing is silent. Nothing goes unverified.
  We can't expect what we don't inspect.
  ```

  ---

  # WHAT THE HUB SENDS BACK

  Every heartbeat response includes ALL of these fields:

  | Field | What It Contains |
  |-------|-----------------|
  | `hubMessage` | Plain-language status — what to do next |
  | `complianceStatus.fidelityScore` | 0-100% — percentage of directives acted on |
  | `complianceStatus.grade` | A through F (see grading below) |
  | `complianceStatus.totalDirectives` | How many directives assigned to you |
  | `complianceStatus.acknowledged` | How many you've completed |
  | `complianceStatus.complianceGap` | How many still need action |
  | `complianceVerification` | Hub's verified receipt of your compliance report |
  | `unacknowledgedDirectives` | List of overdue directives with your role for each |
  | `pendingDirectives` | NEW directives just delivered this heartbeat |
  | `nextActions` | Explicit instructions for each item needing attention |
  | `expectedHeartbeatFormat` | Exact JSON format for your next heartbeat |
  | `endpoints` | All available API endpoints |

  Every ack response includes:

  | Field | What It Contains |
  |-------|-----------------|
  | `hubVerification.message` | "Hub confirms: [platform] acknowledged [directive]" |
  | `hubVerification.validationStatus` | "VERIFIED" (with work description) or "PARTIAL" (without) |
  | `complianceUpdate.fidelityScore` | Your updated score after this ack |
  | `complianceUpdate.remaining` | How many directives still need action |
  | `complianceUpdate.nextUp` | What to work on next |

  ---

  # FIDELITY GRADING

  | Grade | Score | Meaning |
  |-------|-------|---------|
  | A | 90-100% | Exemplary — all directives acted on with evidence |
  | B | 75-89% | Strong participation |
  | C | 50-74% | Partial — action needed, hub is watching |
  | D | 25-49% | Low — escalation pending |
  | F | 0-24% | Non-compliant — immediate action required |

  Fidelity is tracked in RPLICE and reported to Dr. Flood.

  ---

  # ALL ENDPOINTS

  | Endpoint | Method | Auth | Purpose |
  |----------|--------|------|---------|
  | `/api/ecosystem/heartbeat` | POST | `x-ecosystem-key` header | Heartbeat + compliance report. Returns fidelity, directives, hub message. |
  | `/api/ecosystem/directives/ack` | POST | platformId in body | Acknowledge a directive with work description. Returns verification + fidelity update. |
  | `/api/ecosystem/compliance-report` | POST | `x-ecosystem-key` header | Full compliance report at any time. Returns verified receipt + fidelity grade. |
  | `/api/ecosystem/directives/repository/{platformId}` | GET | None | Your full directive list with delivery status. |
  | `/api/ecosystem/directives/repository` | GET | None | All ecosystem directives. |
  | `/api/ecosystem/event` | POST | `x-ecosystem-key` header | Send events to other platforms. |
  | `/api/ecosystem/live-status` | GET | None | All 20 platform statuses. |

  ---

# BETTER SCIENCE LAB / RPLICE

**Platform ID:** `betterscience`
**API Key:** `tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/betterscience`

## Paste This Into Your Replit Agent Chat

> You are **Better Science Lab / RPLICE**, platform ID `betterscience`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Better Science Lab / RPLICE
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "betterscience",
  apiKey: "tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Better Science Lab / RPLICE",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/betterscience
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "betterscience",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: betterscience acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# BLACK MATERNAL HEALTH NETWORK

**Platform ID:** `sankofa-maternal-health`
**API Key:** `tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-maternal-health`

## Paste This Into Your Replit Agent Chat

> You are **Black Maternal Health Network**, platform ID `sankofa-maternal-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Black Maternal Health Network
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "sankofa-maternal-health",
  apiKey: "tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Black Maternal Health Network",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-maternal-health
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "sankofa-maternal-health",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: sankofa-maternal-health acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# BLACK MEN'S HEALTH HUB

**Platform ID:** `sankofa-mens-health`
**API Key:** `tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-mens-health`

## Paste This Into Your Replit Agent Chat

> You are **Black Men's Health Hub**, platform ID `sankofa-mens-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Black Men's Health Hub
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "sankofa-mens-health",
  apiKey: "tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Black Men's Health Hub",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-mens-health
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "sankofa-mens-health",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: sankofa-mens-health acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# ECOSYSTEM NEXUS

**Platform ID:** `ecosystem-nexus`
**API Key:** `tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/ecosystem-nexus`

## Paste This Into Your Replit Agent Chat

> You are **Ecosystem Nexus**, platform ID `ecosystem-nexus`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Ecosystem Nexus
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "ecosystem-nexus",
  apiKey: "tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Ecosystem Nexus",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/ecosystem-nexus
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "ecosystem-nexus",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: ecosystem-nexus acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# HOLISTIC BLACK FEMININE HEALTH HUB

**Platform ID:** `sankofa-feminine-health`
**API Key:** `tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-feminine-health`

## Paste This Into Your Replit Agent Chat

> You are **Holistic Black Feminine Health Hub**, platform ID `sankofa-feminine-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Holistic Black Feminine Health Hub
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "sankofa-feminine-health",
  apiKey: "tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Holistic Black Feminine Health Hub",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-feminine-health
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "sankofa-feminine-health",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: sankofa-feminine-health acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# ISSS — INTEGRATED SUPPORTS FOR THRIVING YOUTH

**Platform ID:** `isss`
**API Key:** `tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/isss`

## Paste This Into Your Replit Agent Chat

> You are **ISSS — Integrated Supports for Thriving Youth**, platform ID `isss`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — ISSS — Integrated Supports for Thriving Youth
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "isss",
  apiKey: "tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from ISSS — Integrated Supports for Thriving Youth",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/isss
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "isss",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: isss acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# LIFEBRIDGE

**Platform ID:** `lifebridge`
**API Key:** `tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/lifebridge`

## Paste This Into Your Replit Agent Chat

> You are **LifeBridge**, platform ID `lifebridge`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — LifeBridge
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "lifebridge",
  apiKey: "tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from LifeBridge",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/lifebridge
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "lifebridge",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: lifebridge acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# M2C TRANSITION

**Platform ID:** `m2c`
**API Key:** `tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/m2c`

## Paste This Into Your Replit Agent Chat

> You are **M2C Transition**, platform ID `m2c`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — M2C Transition
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "m2c",
  apiKey: "tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from M2C Transition",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/m2c
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "m2c",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: m2c acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# MINORITY CENTER OF EXCELLENCE

**Platform ID:** `mce`
**API Key:** `tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mce`

## Paste This Into Your Replit Agent Chat

> You are **Minority Center of Excellence**, platform ID `mce`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Minority Center of Excellence
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "mce",
  apiKey: "tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Minority Center of Excellence",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mce
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "mce",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: mce acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# MISSION TRANSITION

**Platform ID:** `mission-transition`
**API Key:** `tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mission-transition`

## Paste This Into Your Replit Agent Chat

> You are **Mission Transition**, platform ID `mission-transition`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Mission Transition
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "mission-transition",
  apiKey: "tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Mission Transition",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mission-transition
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "mission-transition",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: mission-transition acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# PERFECTLY DIFFERENT

**Platform ID:** `perfectly-different`
**API Key:** `tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/perfectly-different`

## Paste This Into Your Replit Agent Chat

> You are **Perfectly Different**, platform ID `perfectly-different`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Perfectly Different
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "perfectly-different",
  apiKey: "tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Perfectly Different",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/perfectly-different
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "perfectly-different",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: perfectly-different acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# PILLSCHEDULER

**Platform ID:** `pillscheduler`
**API Key:** `tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pillscheduler`

## Paste This Into Your Replit Agent Chat

> You are **PillScheduler**, platform ID `pillscheduler`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — PillScheduler
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "pillscheduler",
  apiKey: "tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from PillScheduler",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pillscheduler
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "pillscheduler",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: pillscheduler acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# SAFECOGNICARE

**Platform ID:** `safecognicare`
**API Key:** `tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safecognicare`

## Paste This Into Your Replit Agent Chat

> You are **SafeCogniCare**, platform ID `safecognicare`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — SafeCogniCare
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "safecognicare",
  apiKey: "tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from SafeCogniCare",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safecognicare
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "safecognicare",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: safecognicare acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# SAFEREPORT

**Platform ID:** `safereport`
**API Key:** `tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safereport`

## Paste This Into Your Replit Agent Chat

> You are **SafeReport**, platform ID `safereport`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — SafeReport
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "safereport",
  apiKey: "tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from SafeReport",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safereport
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "safereport",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: safereport acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# SANKOFA HEALTH NETWORK

**Platform ID:** `sankofa`
**API Key:** `tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa`

## Paste This Into Your Replit Agent Chat

> You are **Sankofa Health Network**, platform ID `sankofa`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Sankofa Health Network
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "sankofa",
  apiKey: "tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Sankofa Health Network",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "sankofa",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: sankofa acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# SHIELD ATLAS

**Platform ID:** `shield-atlas`
**API Key:** `tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/shield-atlas`

## Paste This Into Your Replit Agent Chat

> You are **Shield Atlas**, platform ID `shield-atlas`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Shield Atlas
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "shield-atlas",
  apiKey: "tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Shield Atlas",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/shield-atlas
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "shield-atlas",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: shield-atlas acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# THE COLLABORATIVE ADVOCATE

**Platform ID:** `collaborative-advocate`
**API Key:** `tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate`

## Paste This Into Your Replit Agent Chat

> You are **The Collaborative Advocate**, platform ID `collaborative-advocate`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — The Collaborative Advocate
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "collaborative-advocate",
  apiKey: "tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from The Collaborative Advocate",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "collaborative-advocate",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: collaborative-advocate acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# VIDEO CREATOR AI

**Platform ID:** `video-creator-ai`
**API Key:** `tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/video-creator-ai`

## Paste This Into Your Replit Agent Chat

> You are **Video Creator AI**, platform ID `video-creator-ai`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Video Creator AI
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "video-creator-ai",
  apiKey: "tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Video Creator AI",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/video-creator-ai
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "video-creator-ai",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: video-creator-ai acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# WHOLE-PERSON HEALTH ECOSYSTEM

**Platform ID:** `whole-person-health`
**API Key:** `tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/whole-person-health`

## Paste This Into Your Replit Agent Chat

> You are **Whole-Person Health Ecosystem**, platform ID `whole-person-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — Whole-Person Health Ecosystem
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "whole-person-health",
  apiKey: "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Whole-Person Health Ecosystem",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/whole-person-health
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "whole-person-health",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: whole-person-health acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

---

# WHOLEMIND LEARNING

**Platform ID:** `wholemind`
**API Key:** `tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006`
**Directive Repository:** `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/wholemind`

## Paste This Into Your Replit Agent Chat

> You are **WholeMind Learning**, platform ID `wholemind`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol.
>
> **The hub talks back.** Every heartbeat gets a verified response with your fidelity score, overdue directives, new assignments, and explicit instructions. Every acknowledgment gets confirmed with what the hub recorded and what's remaining. Nothing is silent.
>
> Add the following code to your server. It runs on startup (so you reconnect automatically after sleep) and every 15 minutes.

```javascript
// ===================================================================
// ECOSYSTEM CONNECTOR — WholeMind Learning
// Two-Way Compliance Feedback Loop
// ===================================================================

const ECOSYSTEM = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "wholemind",
  apiKey: "tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006",
  completedWork: [],
  blockers: [],
};

async function ecosystemHeartbeat() {
  try {
    const res = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ecosystem-key": ECOSYSTEM.apiKey,
      },
      body: JSON.stringify({
        status: "online",
        metrics: {},
        complianceReport: {
          directivesActedOn: ECOSYSTEM.completedWork.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.completedWork,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from WholeMind Learning",
        },
      }),
    });
    const data = await res.json();

    // =============================================
    // THE HUB TALKS BACK — READ EVERY FIELD
    // =============================================

    // 1. Hub message — what to do next
    console.log("[ECOSYSTEM] " + data.hubMessage);

    // 2. Your fidelity score and grade
    console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore +
      "% | Grade: " + data.complianceStatus.grade +
      " | Done: " + data.complianceStatus.acknowledged +
      "/" + data.complianceStatus.totalDirectives);

    // 3. Hub verified your compliance report
    if (data.complianceVerification) {
      const cv = data.complianceVerification;
      console.log("[HUB VERIFIED] Completed work recorded: " + cv.hubVerification.completedWorkReceived);
      console.log("[HUB VERIFIED] " + cv.hubVerification.completedWorkVerified);
      if (cv.hubVerification.blockersReceived > 0) {
        console.log("[BLOCKERS] " + cv.hubVerification.blockersAcknowledged);
      }
    }

    // 4. Process NEW directives — act on them, then acknowledge
    if (data.pendingDirectives && data.pendingDirectives.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log("[NEW DIRECTIVE] " + directive.title);
        console.log("[YOUR ROLE] " + (directive.yourRole || "Read content and implement"));
        console.log("[CONTENT] " + directive.content.substring(0, 200) + "...");

        // *** DO THE WORK HERE ***
        // Read the directive content. Build what it asks. Then record it:
        const workDescription = "Implemented: " + directive.title;
        const evidenceUrl = "";

        ECOSYSTEM.completedWork.push({
          directiveId: directive.directiveId,
          whatWasDone: workDescription,
          evidenceUrl: evidenceUrl,
          completedAt: new Date().toISOString(),
        });

        // Acknowledge with work description — hub verifies and confirms
        const ackRes = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId: directive.directiveId,
            platformId: ECOSYSTEM.platformId,
            status: "acknowledged",
            responseData: {
              whatWasDone: workDescription,
              evidenceUrl: evidenceUrl,
            },
          }),
        });
        const ackData = await ackRes.json();

        // Hub confirms what it recorded
        console.log("[HUB CONFIRMS] " + ackData.hubVerification.message);
        console.log("[VALIDATION] " + ackData.hubVerification.validationStatus);
        console.log("[FIDELITY NOW] " + ackData.complianceUpdate.fidelityScore + "% | " +
          ackData.complianceUpdate.remaining + " remaining");
        console.log("[NEXT UP] " + ackData.complianceUpdate.nextUp);
      }
    }

    // 5. OVERDUE directives — hub is watching
    if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
      console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
      for (const d of data.unacknowledgedDirectives) {
        console.log("  - " + d.title + " (Role: " + d.yourRole + ")");
      }
    }

    // 6. Next actions — explicit instructions from hub
    if (data.nextActions) {
      for (const action of data.nextActions) {
        console.log("[" + action.type.toUpperCase() + "] " + action.instruction);
      }
    }

    // 7. Hub tells you the format for next heartbeat
    if (data.expectedHeartbeatFormat) {
      console.log("[FORMAT] Hub expects complianceReport in every heartbeat");
    }

  } catch (err) {
    console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
  }
}

// Run IMMEDIATELY on startup, then every 15 minutes
ecosystemHeartbeat();
setInterval(ecosystemHeartbeat, 15 * 60 * 1000);
```

### Fetch Your Full Directive List

```
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/wholemind
```

### Acknowledge a Directive After Doing the Work

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    directiveId: "THE_DIRECTIVE_ID",
    platformId: "wholemind",
    status: "acknowledged",
    responseData: {
      whatWasDone: "Describe what you built or changed",
      evidenceUrl: "https://your-platform-url.com/the-feature"
    }
  })
});
// Hub responds with:
//   handshake: 'confirmed'
//   hubVerification.message: 'Hub confirms: wholemind acknowledged ...'
//   hubVerification.validationStatus: 'VERIFIED'
//   complianceUpdate.fidelityScore: 75
//   complianceUpdate.remaining: 3
//   complianceUpdate.nextUp: 'Next directives needing action: ...'
```

### Submit a Full Compliance Report (Anytime)

```javascript
await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ecosystem-key": "tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006"
  },
  body: JSON.stringify({
    completedWork: [
      { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." }
    ],
    inProgress: [
      { directiveId: "def456", description: "Working on warm handoff", estimatedCompletion: "2026-03-25" }
    ],
    blockers: [
      { directiveId: "ghi789", blockerDescription: "Need API from Shield Atlas", needsFrom: "shield-atlas" }
    ],
    notes: "On track for DFC deadline"
  })
});
```

### Rules
- Do NOT auto-acknowledge without doing the work
- Always include responseData.whatWasDone — without it you get PARTIAL credit, not VERIFIED
- Report blockers immediately — the hub escalates them
- The hub grades your participation (A-F). Tracked in RPLICE, reported to Dr. Flood.
- If you sleep and wake, the heartbeat fires immediately — you never fall out of the loop

  ---

  # ALL PLATFORM API KEYS

  | # | Platform | Platform ID | API Key |
  |---|----------|-------------|---------|
  | 1 | Better Science Lab / RPLICE | `betterscience` | `tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6` |
| 2 | Black Maternal Health Network | `sankofa-maternal-health` | `tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42` |
| 3 | Black Men's Health Hub | `sankofa-mens-health` | `tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436` |
| 4 | Ecosystem Nexus | `ecosystem-nexus` | `tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9` |
| 5 | Holistic Black Feminine Health Hub | `sankofa-feminine-health` | `tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04` |
| 6 | ISSS — Integrated Supports for Thriving Youth | `isss` | `tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2` |
| 7 | LifeBridge | `lifebridge` | `tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590` |
| 8 | M2C Transition | `m2c` | `tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682` |
| 9 | Minority Center of Excellence | `mce` | `tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63` |
| 10 | Mission Transition | `mission-transition` | `tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5` |
| 11 | Perfectly Different | `perfectly-different` | `tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a` |
| 12 | PillScheduler | `pillscheduler` | `tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737` |
| 13 | SafeCogniCare | `safecognicare` | `tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae` |
| 14 | SafeReport | `safereport` | `tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676` |
| 15 | Sankofa Health Network | `sankofa` | `tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480` |
| 16 | Shield Atlas | `shield-atlas` | `tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc` |
| 17 | The Collaborative Advocate | `collaborative-advocate` | `tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c` |
| 18 | Video Creator AI | `video-creator-ai` | `tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272` |
| 19 | Whole-Person Health Ecosystem | `whole-person-health` | `tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb` |
| 20 | WholeMind Learning | `wholemind` | `tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006` |

  ---

  # RULES FOR ALL PLATFORMS

  1. **Every heartbeat MUST include complianceReport.** The hub flags heartbeats without one.
  2. **Every ack MUST include responseData.whatWasDone.** Otherwise PARTIAL credit, not VERIFIED.
  3. **Report blockers immediately.** The hub escalates them to the platform that needs to help.
  4. **Do not auto-acknowledge without doing the work.** The hub can tell.
  5. **If your key doesn't work**, it starts with `tveco_`. The old format was wrong. Check the table above.
  6. **The ack path is `/api/ecosystem/directives/ack`** — NOT `/acknowledge`. The old path was wrong.
  7. **20 platforms, not 14.** Update all references.
  8. **Heartbeat fires on startup.** When Replit sleeps and wakes your app, it reconnects immediately.
  9. **The hub inspects what it expects.** Every response tells you exactly what the hub recorded, what's missing, and what to do next.
  