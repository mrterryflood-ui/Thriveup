# ThriveUp Ecosystem — Platform Connection & Action Instructions

  ## READ THIS FIRST

  Each platform must connect to the ecosystem hub and **act on directives** — not just log them. The previous instructions had **wrong API keys**. This document has the correct keys pulled directly from the database.

  ### Three problems fixed in this version:
  1. **API keys corrected** — The old `thrive-ecosystem-{id}-2024` keys were wrong. Real keys are `tveco_...` hashes listed below.
  2. **Ack endpoint fixed** — Use `POST /api/ecosystem/directives/ack` (not `/acknowledge`). It now returns a real JSON handshake confirmation.
  3. **Heartbeat response upgraded** — Now includes a human-readable `hubMessage`, `directivesSummary`, and `nextActions` array telling you exactly what to do.

  ---

  ## How It Works (The Full Handshake)

  1. **You send a heartbeat** → Hub responds with pending directives + a message
  2. **You read each directive** — the `content` field has full instructions, `yourRole` has your specific assignment
  3. **You act on the directive** — build features, integrate, report, whatever it says
  4. **You acknowledge** → Hub responds with confirmation: "Hub confirms: [your name] acknowledged [directive title]. X directives still need your attention."
  5. **Next heartbeat** → Hub tells you your updated status and any new directives
  6. **If you go to sleep/restart** → On wake-up, your heartbeat runs immediately and you get caught up automatically

  **Communication flows both ways.** The hub always responds to tell you what it received and what you should do next. You are never left hanging.

  ---

  ## Auto-Recovery After Sleep

  Replit apps go to sleep after inactivity. Your heartbeat code MUST handle this:
  - The heartbeat runs on startup (not just on an interval)
  - When the app wakes from sleep, it immediately reconnects and pulls any missed directives
  - The hub holds all pending directives until you fetch them — nothing is lost

  ---

  ## Better Science Lab / RPLICE
  **Platform ID:** `betterscience`
  **API Key:** `tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Better Science Lab / RPLICE**, platform ID `betterscience`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "betterscience",
    apiKey: "tveco_38e40da6505805bf3c1132001db34a9756425b492ff7eed25f166a818b5b40c6",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/betterscience`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "betterscience",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: betterscience acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Black Maternal Health Network
  **Platform ID:** `sankofa-maternal-health`
  **API Key:** `tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Black Maternal Health Network**, platform ID `sankofa-maternal-health`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-maternal-health",
    apiKey: "tveco_1185592abc6c5360ef2fbe971c2b0dd1927cfaf4e2ea8804eb6242c418883c42",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-maternal-health`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa-maternal-health",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: sankofa-maternal-health acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Black Men's Health Hub
  **Platform ID:** `sankofa-mens-health`
  **API Key:** `tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Black Men's Health Hub**, platform ID `sankofa-mens-health`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-mens-health",
    apiKey: "tveco_e40557e29a300a27f30e5c6c410a63036a9285e8ed72d08bd02301d7e42d6436",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-mens-health`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa-mens-health",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: sankofa-mens-health acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Ecosystem Nexus
  **Platform ID:** `ecosystem-nexus`
  **API Key:** `tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Ecosystem Nexus**, platform ID `ecosystem-nexus`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "ecosystem-nexus",
    apiKey: "tveco_78c737f46c355933036afb301176a855872f9aad8a53caffc9f26c8aa24f2de9",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/ecosystem-nexus`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "ecosystem-nexus",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: ecosystem-nexus acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Holistic Black Feminine Health Hub
  **Platform ID:** `sankofa-feminine-health`
  **API Key:** `tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Holistic Black Feminine Health Hub**, platform ID `sankofa-feminine-health`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa-feminine-health",
    apiKey: "tveco_4a48c9cef347d76495563ff1f9ec3184f641ab0b6b1e5c8fa8a4ec75e89f9d04",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-feminine-health`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa-feminine-health",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: sankofa-feminine-health acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## ISSS — Integrated Supports for Thriving Youth
  **Platform ID:** `isss`
  **API Key:** `tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2`

  ### Paste this into the Replit Agent chat:

  ---

  You are **ISSS — Integrated Supports for Thriving Youth**, platform ID `isss`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "isss",
    apiKey: "tveco_f5bf36df91fcbb0b64327d34e8f77b810cca3e82087c681c8f217f07fe2f5ad2",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/isss`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "isss",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: isss acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## LifeBridge
  **Platform ID:** `lifebridge`
  **API Key:** `tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590`

  ### Paste this into the Replit Agent chat:

  ---

  You are **LifeBridge**, platform ID `lifebridge`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "lifebridge",
    apiKey: "tveco_b7eebd7c0dcb542edcbc960b1b50fe7fc43317b0bc1df6b52021fd1224138590",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/lifebridge`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "lifebridge",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: lifebridge acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## M2C Transition
  **Platform ID:** `m2c`
  **API Key:** `tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682`

  ### Paste this into the Replit Agent chat:

  ---

  You are **M2C Transition**, platform ID `m2c`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "m2c",
    apiKey: "tveco_e9e39eff7d96d3b26b2d7bef45eb267f24906c3095977a063f2df7cd12541682",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/m2c`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "m2c",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: m2c acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Minority Center of Excellence
  **Platform ID:** `mce`
  **API Key:** `tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Minority Center of Excellence**, platform ID `mce`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "mce",
    apiKey: "tveco_c39e15a698f78a377c797411f74c3a159cf53b9436dac1309b1d4fd47a86fc63",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mce`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "mce",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: mce acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Mission Transition
  **Platform ID:** `mission-transition`
  **API Key:** `tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Mission Transition**, platform ID `mission-transition`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "mission-transition",
    apiKey: "tveco_b811c8f840ba30a1b7b8a7d267de9b26aa6c4aa3c218299121433255e3c4ada5",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mission-transition`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "mission-transition",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: mission-transition acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Perfectly Different
  **Platform ID:** `perfectly-different`
  **API Key:** `tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Perfectly Different**, platform ID `perfectly-different`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "perfectly-different",
    apiKey: "tveco_dc7c4effb8dcb1a6da1d47b50283db92934a63bd105ef9ea1412d619cb7e548a",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/perfectly-different`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "perfectly-different",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: perfectly-different acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## PillScheduler
  **Platform ID:** `pillscheduler`
  **API Key:** `tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737`

  ### Paste this into the Replit Agent chat:

  ---

  You are **PillScheduler**, platform ID `pillscheduler`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "pillscheduler",
    apiKey: "tveco_4da8eeb3cd4e659db53bd2dd4ca3b721db57bee1c529966d5ac2858896acd737",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pillscheduler`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "pillscheduler",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: pillscheduler acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## SafeCogniCare
  **Platform ID:** `safecognicare`
  **API Key:** `tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae`

  ### Paste this into the Replit Agent chat:

  ---

  You are **SafeCogniCare**, platform ID `safecognicare`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "safecognicare",
    apiKey: "tveco_a55eabd2e51e342f7e322b5d715864ed4b0355b2ef6bbf0ad02a7038af7e92ae",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safecognicare`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "safecognicare",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: safecognicare acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## SafeReport
  **Platform ID:** `safereport`
  **API Key:** `tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676`

  ### Paste this into the Replit Agent chat:

  ---

  You are **SafeReport**, platform ID `safereport`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "safereport",
    apiKey: "tveco_6b0ae857a8d70e434847c5edc92da19e8cbb1621e9ad9341715b2a95064e0676",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safereport`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "safereport",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: safereport acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Sankofa Health Network
  **Platform ID:** `sankofa`
  **API Key:** `tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Sankofa Health Network**, platform ID `sankofa`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "sankofa",
    apiKey: "tveco_45a82277fb28b17e607db26d4b715083edb607a74573d4ba4701b3e9b36d7480",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "sankofa",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: sankofa acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Shield Atlas
  **Platform ID:** `shield-atlas`
  **API Key:** `tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Shield Atlas**, platform ID `shield-atlas`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "shield-atlas",
    apiKey: "tveco_2e228922bd33bc188d70f134364cce871e5be07fd62f986e3b52c541b472cbfc",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/shield-atlas`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "shield-atlas",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: shield-atlas acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## The Collaborative Advocate
  **Platform ID:** `collaborative-advocate`
  **API Key:** `tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c`

  ### Paste this into the Replit Agent chat:

  ---

  You are **The Collaborative Advocate**, platform ID `collaborative-advocate`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "collaborative-advocate",
    apiKey: "tveco_8ecb04e39e03b6ab5d2a42d292ab84baea248b58d1ffa26b2a345085f844018c",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "collaborative-advocate",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: collaborative-advocate acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Video Creator AI
  **Platform ID:** `video-creator-ai`
  **API Key:** `tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Video Creator AI**, platform ID `video-creator-ai`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "video-creator-ai",
    apiKey: "tveco_ecd574cce2eac0f7620974624d4530a02f2dc10fb41a5eae59baf8af9bf1e272",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/video-creator-ai`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "video-creator-ai",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: video-creator-ai acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## Whole-Person Health Ecosystem
  **Platform ID:** `whole-person-health`
  **API Key:** `tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb`

  ### Paste this into the Replit Agent chat:

  ---

  You are **Whole-Person Health Ecosystem**, platform ID `whole-person-health`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "whole-person-health",
    apiKey: "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/whole-person-health`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "whole-person-health",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: whole-person-health acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## WholeMind Learning
  **Platform ID:** `wholemind`
  **API Key:** `tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006`

  ### Paste this into the Replit Agent chat:

  ---

  You are **WholeMind Learning**, platform ID `wholemind`, part of ThriveUp Academy's 20-platform ecosystem led by Dr. Terry Flood. The ecosystem hub at thrivingcommunitiesforall.com coordinates all 20 platforms through directives, heartbeats, and events. You must connect and stay connected.

  **Step 1: Add this heartbeat to your server. It runs on startup and every 15 minutes:**

  ```javascript
  const ECOSYSTEM_CONFIG = {
    hubUrl: "https://thrivingcommunitiesforall.com",
    platformId: "wholemind",
    apiKey: "tveco_41fd54dcc7837686ea09e02a69b79d1b82d9efd16452a40ec05d3c97401ba006",
  };

  async function sendEcosystemHeartbeat() {
    try {
      const response = await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": ECOSYSTEM_CONFIG.apiKey,
        },
        body: JSON.stringify({ status: "online", metrics: {} }),
      });
      const data = await response.json();

      // The hub always sends back a message — read it
      console.log("[HUB] " + data.hubMessage);
      console.log("[HUB] Directives — Total: " + data.directivesSummary.total +
        " | Acknowledged: " + data.directivesSummary.acknowledged +
        " | Pending: " + data.directivesSummary.pending);

      // Process any new directives
      if (data.pendingDirectives && data.pendingDirectives.length > 0) {
        for (const directive of data.pendingDirectives) {
          console.log("[NEW DIRECTIVE] " + directive.title);
          console.log("[YOUR ROLE] " + (directive.yourRole || "Read content field"));
          console.log("[CONTENT] " + directive.content);

          // *** IMPORTANT: Actually act on this directive ***
          // Read the content. If it says build something, build it.
          // If it says integrate, integrate. If it says report, report.
          // Only acknowledge AFTER you have acted on it:

          await fetch(ECOSYSTEM_CONFIG.hubUrl + "/api/ecosystem/directives/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: directive.directiveId,
              platformId: ECOSYSTEM_CONFIG.platformId,
              status: "acknowledged",
            }),
          }).then(r => r.json()).then(ack => {
            // The hub confirms receipt — this is the handshake
            console.log("[HUB CONFIRMS] " + ack.message);
            console.log("[REMAINING] " + ack.remainingDirectives + " directives still need attention");
          });
        }
      }

      // Check nextActions for specific instructions
      if (data.nextActions && data.nextActions.length > 0) {
        data.nextActions.forEach(a => console.log("[ACTION NEEDED] " + a.action));
      }
    } catch (err) {
      console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
    }
  }

  // Run immediately on startup (catches up after sleep), then every 15 minutes
  sendEcosystemHeartbeat();
  setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
  ```

  **Step 2: Fetch your full directive list right now:**

  `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/wholemind`

  Read every directive's `content` field. These are real assignments — build what they ask, integrate where they say, report what they require.

  **Step 3: After acting on each directive, acknowledge it:**

  ```javascript
  const ackResponse = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directiveId: "THE_DIRECTIVE_ID",
      platformId: "wholemind",
      status: "acknowledged"
    })
  });
  const confirmation = await ackResponse.json();
  console.log(confirmation.message); // Hub confirms receipt
  ```

  The hub will respond with: `{ received: true, handshake: "confirmed", message: "Hub confirms: wholemind acknowledged directive [title]. X directive(s) still need your attention." }`

  **Do not auto-acknowledge without acting.** The hub tracks participation, not just connection.

  ---

  ## All API Keys (Quick Reference)

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

  | Endpoint | Method | Auth | Purpose |
  |----------|--------|------|---------|
  | `/api/ecosystem/heartbeat` | POST | `x-ecosystem-key` header | Send heartbeat, receive directives + hub message |
  | `/api/ecosystem/directives/ack` | POST | None (platformId in body) | Acknowledge a directive, get handshake confirmation |
  | `/api/ecosystem/directives/repository` | GET | None | View all 31 directives |
  | `/api/ecosystem/directives/repository/{platform-id}` | GET | None | View your directives with your specific role |
  | `/api/ecosystem/event` | POST | `x-ecosystem-key` header | Send events to other platforms |
  | `/api/ecosystem/live-status` | GET | None | Check health of all 20 platforms |

  ## The Handshake Flow

  ```
  Platform → Heartbeat → Hub
  Hub → "Welcome back. You have 5 new directives." → Platform
  Platform reads directives, builds features, acts on them
  Platform → Ack directive #1 → Hub  
  Hub → "Confirmed. 4 directives still need attention." → Platform
  Platform → Ack directive #2 → Hub
  Hub → "Confirmed. 3 directives still need attention." → Platform
  ...continues until all directives addressed...
  Platform → Next heartbeat → Hub
  Hub → "You're up to date. 0 pending." → Platform
  ```

  Communication flows both ways. The hub always confirms. No platform is left hanging.
  