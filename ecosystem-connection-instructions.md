# ThriveUp Ecosystem — Platform Connection, Compliance & Fidelity Instructions

  ## READ THIS FIRST — What Changed

  1. **Correct API keys** — Real `tveco_...` keys from the database. The old `thrive-ecosystem-{id}-2024` keys were wrong.
  2. **Two-way communication** — The hub now talks back. Every heartbeat, every acknowledgment, every compliance report gets a verified response confirming what was received, what was recorded, and what's still needed.
  3. **Compliance feedback loop** — You can't expect what you don't inspect. The hub now tracks your fidelity score (A-F), tells you what's overdue, verifies your completed work, escalates your blockers, and confirms receipt of everything.
  4. **Auto-recovery on wake** — Your heartbeat runs on startup. When Replit sleeps and wakes your app, it immediately reconnects and catches up.

  ---

  ## The Complete Feedback Loop

  ```
  Platform sends heartbeat with complianceReport
      ↓
  Hub responds with:
    - hubMessage (what to do next)
    - complianceStatus (fidelity score, grade A-F)
    - complianceVerification (what hub recorded from your report)
    - unacknowledgedDirectives (overdue work with your specific role)
    - pendingDirectives (new assignments)
    - nextActions (explicit instructions for each item)
    - expectedHeartbeatFormat (exactly what to send next time)
      ↓
  Platform acts on directives (builds features, integrates, reports)
      ↓
  Platform acknowledges with description of what was done
      ↓
  Hub responds with:
    - hubVerification.message ("Hub confirms: [name] acknowledged [directive]")
    - hubVerification.validationStatus ("VERIFIED" if work described, "PARTIAL" if not)
    - complianceUpdate (updated fidelity score, remaining count)
    - nextUp (what to work on next)
      ↓
  Cycle repeats every 15 minutes. Nothing is silent. Nothing goes unverified.
  ```

  **We can't expect what we don't inspect.** Every directive is tracked. Every acknowledgment is verified. Every blocker is escalated. Every piece of completed work is recorded with evidence.

  ---

  ## Better Science Lab / RPLICE
  **Platform ID:** `betterscience`
  **API Key:** `tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Better Science Lab / RPLICE**, platform ID `betterscience`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "betterscience",
    apiKey: "tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Better Science Lab / RPLICE",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/betterscience`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "betterscience",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Black Maternal Health Network
  **Platform ID:** `sankofa-maternal-health`
  **API Key:** `tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Black Maternal Health Network**, platform ID `sankofa-maternal-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-maternal-health",
    apiKey: "tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Black Maternal Health Network",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-maternal-health`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa-maternal-health",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Black Men's Health Hub
  **Platform ID:** `sankofa-mens-health`
  **API Key:** `tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Black Men's Health Hub**, platform ID `sankofa-mens-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-mens-health",
    apiKey: "tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Black Men's Health Hub",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-mens-health`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa-mens-health",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Ecosystem Nexus
  **Platform ID:** `ecosystem-nexus`
  **API Key:** `tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Ecosystem Nexus**, platform ID `ecosystem-nexus`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "ecosystem-nexus",
    apiKey: "tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Ecosystem Nexus",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/ecosystem-nexus`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "ecosystem-nexus",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Holistic Black Feminine Health Hub
  **Platform ID:** `sankofa-feminine-health`
  **API Key:** `tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Holistic Black Feminine Health Hub**, platform ID `sankofa-feminine-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-feminine-health",
    apiKey: "tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Holistic Black Feminine Health Hub",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-feminine-health`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa-feminine-health",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## ISSS — Integrated Supports for Thriving Youth
  **Platform ID:** `isss`
  **API Key:** `tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2`

  ### Paste this into the Replit Agent chat:

  ---

  You are **ISSS — Integrated Supports for Thriving Youth**, platform ID `isss`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "isss",
    apiKey: "tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from ISSS — Integrated Supports for Thriving Youth",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/isss`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "isss",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## LifeBridge
  **Platform ID:** `lifebridge`
  **API Key:** `tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590`

  ### Paste this into the Replit Agent chat:

  ---

  You are **LifeBridge**, platform ID `lifebridge`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "lifebridge",
    apiKey: "tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from LifeBridge",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/lifebridge`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "lifebridge",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## M2C Transition
  **Platform ID:** `m2c`
  **API Key:** `tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682`

  ### Paste this into the Replit Agent chat:

  ---

  You are **M2C Transition**, platform ID `m2c`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "m2c",
    apiKey: "tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from M2C Transition",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/m2c`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "m2c",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Minority Center of Excellence
  **Platform ID:** `mce`
  **API Key:** `tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Minority Center of Excellence**, platform ID `mce`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "mce",
    apiKey: "tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Minority Center of Excellence",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mce`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "mce",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Mission Transition
  **Platform ID:** `mission-transition`
  **API Key:** `tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Mission Transition**, platform ID `mission-transition`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "mission-transition",
    apiKey: "tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Mission Transition",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mission-transition`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "mission-transition",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Perfectly Different
  **Platform ID:** `perfectly-different`
  **API Key:** `tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Perfectly Different**, platform ID `perfectly-different`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "perfectly-different",
    apiKey: "tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Perfectly Different",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/perfectly-different`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "perfectly-different",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## PillScheduler
  **Platform ID:** `pillscheduler`
  **API Key:** `tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737`

  ### Paste this into the Replit Agent chat:

  ---

  You are **PillScheduler**, platform ID `pillscheduler`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "pillscheduler",
    apiKey: "tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from PillScheduler",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pillscheduler`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "pillscheduler",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## SafeCogniCare
  **Platform ID:** `safecognicare`
  **API Key:** `tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae`

  ### Paste this into the Replit Agent chat:

  ---

  You are **SafeCogniCare**, platform ID `safecognicare`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "safecognicare",
    apiKey: "tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from SafeCogniCare",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safecognicare`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "safecognicare",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## SafeReport
  **Platform ID:** `safereport`
  **API Key:** `tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676`

  ### Paste this into the Replit Agent chat:

  ---

  You are **SafeReport**, platform ID `safereport`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "safereport",
    apiKey: "tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from SafeReport",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safereport`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "safereport",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Sankofa Health Network
  **Platform ID:** `sankofa`
  **API Key:** `tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Sankofa Health Network**, platform ID `sankofa`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa",
    apiKey: "tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Sankofa Health Network",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Shield Atlas
  **Platform ID:** `shield-atlas`
  **API Key:** `tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Shield Atlas**, platform ID `shield-atlas`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "shield-atlas",
    apiKey: "tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Shield Atlas",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/shield-atlas`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "shield-atlas",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## The Collaborative Advocate
  **Platform ID:** `collaborative-advocate`
  **API Key:** `tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c`

  ### Paste this into the Replit Agent chat:

  ---

  You are **The Collaborative Advocate**, platform ID `collaborative-advocate`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "collaborative-advocate",
    apiKey: "tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from The Collaborative Advocate",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "collaborative-advocate",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Video Creator AI
  **Platform ID:** `video-creator-ai`
  **API Key:** `tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Video Creator AI**, platform ID `video-creator-ai`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "video-creator-ai",
    apiKey: "tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Video Creator AI",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/video-creator-ai`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "video-creator-ai",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## Whole-Person Health Ecosystem
  **Platform ID:** `whole-person-health`
  **API Key:** `tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Whole-Person Health Ecosystem**, platform ID `whole-person-health`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "whole-person-health",
    apiKey: "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from Whole-Person Health Ecosystem",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/whole-person-health`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "whole-person-health",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## WholeMind Learning
  **Platform ID:** `wholemind`
  **API Key:** `tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006`

  ### Paste this into the Replit Agent chat:

  ---

  You are **WholeMind Learning**, platform ID `wholemind`, part of ThriveUp Academy's 20-platform ecosystem. The ecosystem hub at thrivingcommunitiesforall.com coordinates all platforms through a verified two-way communication protocol. You must connect, report your work, and stay accountable.

  **The hub talks back.** When you send a heartbeat, the hub tells you your fidelity score, what's overdue, what's new, and exactly what to do next. When you acknowledge a directive, the hub confirms what it recorded and tells you what's remaining. Nothing is silent. Nothing goes unverified.

  **Add this to your server — it runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "wholemind",
    apiKey: "tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006",
    directivesActedOn: [],
    directivesInProgress: [],
    blockers: [],
  };

  async function sendEcosystemHeartbeat() {
    try {
      const heartbeatBody = {
        status: "online",
        metrics: {},
        complianceReport: {
          directivesReceived: 0,
          directivesActedOn: ECOSYSTEM.directivesActedOn.length,
          directivesInProgress: ECOSYSTEM.directivesInProgress.length,
          directivesBlocked: ECOSYSTEM.blockers.length,
          completedWork: ECOSYSTEM.directivesActedOn,
          blockers: ECOSYSTEM.blockers,
          notes: "Automated compliance report from WholeMind Learning",
        },
      };

      const response = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM.apiKey,
        },
        body: JSON.stringify(heartbeatBody),
      });
      const data = await response.json();

      // === THE HUB TALKS BACK — READ EVERYTHING ===
      console.log("[HUB MESSAGE] " + data.hubMessage);
      console.log("[FIDELITY] Score: " + data.complianceStatus.fidelityScore + 
        "% | Grade: " + data.complianceStatus.grade +
        " | Acknowledged: " + data.complianceStatus.acknowledged + 
        "/" + data.complianceStatus.totalDirectives);

      // Hub verified your compliance report
      if (data.complianceVerification) {
        console.log("[HUB VERIFIED] " + JSON.stringify(data.complianceVerification.hubVerification));
      }

      // Process NEW directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content"));
          console.log("[CONTENT] " + directive.content);
          
          // *** ACT ON THE DIRECTIVE — build, integrate, report ***
          // Then record what you did:
          ECOSYSTEM.directivesActedOn.push({
            directiveId: directive.directiveId,
            title: directive.title,
            whatWasDone: "DESCRIBE WHAT YOU BUILT OR CHANGED HERE",
            evidenceUrl: "LINK TO THE FEATURE OR ENDPOINT",
            completedAt: new Date().toISOString(),
          });

          // Acknowledge with work description
          const ackResp = await fetch(ECOSYSTEM.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM.platformId,
              status: "acknowledged",
              responseData: { whatWasDone: "DESCRIBE WHAT YOU DID" },
            }),
          }).then(r => r.json());

          // Hub confirms receipt and tells you what's next
          console.log("[HUB CONFIRMS] " + ackResp.hubVerification?.message);
          console.log("[VALIDATION] " + ackResp.hubVerification?.validationStatus);
          console.log("[REMAINING] " + ackResp.complianceUpdate?.remaining + " directives still need action");
          console.log("[NEXT UP] " + ackResp.complianceUpdate?.nextUp);
        }
      }

      // OVERDUE directives — hub is watching
      if (data.unacknowledgedDirectives && data.unacknowledgedDirectives.length > 0) {
        console.log("[WARNING] " + data.unacknowledgedDirectives.length + " OVERDUE directives:");
        data.unacknowledgedDirectives.forEach(d => {
          console.log("  [OVERDUE] " + d.title + " — Your role: " + d.yourRole);
        });
      }

      // Next actions — explicit instructions from hub
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => {
          console.log("[" + a.type.toUpperCase() + "] " + a.instruction);
        });
      }

      // Hub tells you the expected format for next heartbeat
      if (data.expectedHeartbeatFormat) {
        // Store this — your next heartbeat should follow this format
        console.log("[EXPECTED FORMAT] Hub expects complianceReport in next heartbeat");
      }

    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
      // IMPORTANT: Retry on next cycle. Do not disable the heartbeat.
    }
  }

  // Run IMMEDIATELY on startup (auto-recovery after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Fetch your full directive list now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/wholemind`

  **After acting on each directive, acknowledge with what you did:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "wholemind",
      status: "acknowledged",
      responseData: {
        whatWasDone: "Built the warm handoff integration with LifeBridge",
        evidenceUrl: "https://yourplatform.com/warm-handoff"
      }
    })
  });
  // Hub responds: { handshake: "confirmed", hubVerification: { validationStatus: "VERIFIED" }, complianceUpdate: { fidelityScore: 85, remaining: 3 } }
  ```

  **Or submit a full compliance report at any time:**

  ```javascript
  await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ecosystem-key": "tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006"
    },
    body: JSON.stringify({
      completedWork: [
        { directiveId: "abc123", whatWasDone: "Built fidelity dashboard", evidenceUrl: "https://..." },
      ],
      inProgress: [
        { directiveId: "def456", description: "Working on warm handoff protocol", estimatedCompletion: "2026-03-25" },
      ],
      blockers: [
        { directiveId: "ghi789", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" },
      ],
      notes: "On track for DFC deadline"
    })
  });
  // Hub responds with verified receipt, fidelity score, and unaddressed directives list
  ```

  **Rules:**
  - Do not auto-acknowledge without doing the work
  - Always include `responseData.whatWasDone` for full fidelity credit
  - Report blockers — the hub escalates them to the platform that needs to help
  - The hub grades your participation (A-F). 100% = all directives acted on with evidence.
  - If you go to sleep and wake up, your heartbeat runs immediately — you never fall out of the loop

  ---

  ## All API Keys

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

  ## All Endpoints

  | Endpoint | Method | Auth | Purpose | Response |
  |----------|--------|------|---------|----------|
  | `/api/ecosystem/heartbeat` | POST | `x-ecosystem-key` | Heartbeat + compliance report | Fidelity score, directives, hub message, verification |
  | `/api/ecosystem/directives/ack` | POST | None (platformId in body) | Acknowledge with work description | Hub verification, fidelity update, next directive |
  | `/api/ecosystem/compliance-report` | POST | `x-ecosystem-key` | Full compliance report | Verified receipt, fidelity grade, remaining work |
  | `/api/ecosystem/directives/repository/{id}` | GET | None | Your directive list | All directives with your role |
  | `/api/ecosystem/directives/repository` | GET | None | Full ecosystem directive list | All 31 directives |
  | `/api/ecosystem/event` | POST | `x-ecosystem-key` | Send events to other platforms | Event queued confirmation |
  | `/api/ecosystem/live-status` | GET | None | All platform health | 20 platform statuses |

  ## Fidelity Grading

  | Grade | Score | Meaning |
  |-------|-------|---------|
  | A | 90-100% | Exemplary — all directives acted on with evidence |
  | B | 75-89% | Strong — most directives addressed |
  | C | 50-74% | Partial — action needed, hub is watching |
  | D | 25-49% | Low — escalation pending |
  | F | 0-24% | Non-compliant — immediate action required |

  ## The Complete Communication Flow

  ```
  STARTUP:
    Platform wakes → Heartbeat fires immediately
    Hub: "Welcome back. You have 5 new directives. 3 overdue. Fidelity: 45% (D)."
    Hub: "EXPECTED: Include complianceReport in next heartbeat."

  EVERY 15 MINUTES:
    Platform → Heartbeat with complianceReport (what was done, what's blocked)
    Hub → Verifies report, updates fidelity score, returns new/overdue directives
    Hub: "Report verified. 2 completed items recorded. 1 blocker escalated to Shield Atlas."

  WHEN DIRECTIVE IS COMPLETED:
    Platform → Ack with responseData.whatWasDone + evidenceUrl
    Hub → "VERIFIED. Fidelity: 75% (B). 3 remaining. Next up: Warm Handoff Protocol."

  WHEN BLOCKED:
    Platform → Reports blocker in complianceReport
    Hub → "Blocker acknowledged. Routing to [named platform] on next heartbeat."
    Named platform → Gets blocker in their next heartbeat response

  FULL REPORT (ANYTIME):
    Platform → POST /compliance-report with full status
    Hub → "Compliance report verified. Fidelity: 88% (B). 2 directives remaining."
  ```

  Nothing is silent. Nothing goes unverified. The hub inspects what it expects.
  