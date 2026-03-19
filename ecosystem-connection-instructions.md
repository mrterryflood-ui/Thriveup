# ThriveUp Ecosystem — Platform Connection Instructions

## What This Does
Paste the instruction below into each platform's Replit Agent chat. It tells the platform to send a heartbeat to the ecosystem hub every 15 minutes. On each heartbeat, the hub automatically returns all pending directives, events, and updates assigned to that platform. One-time setup — after this, everything flows automatically forever.

## Hub URL
`https://thrivingcommunitiesforall.com`

## How It Works
1. Platform sends heartbeat → Hub receives it
2. Hub checks for pending directives for that platform
3. Hub returns all directives in the heartbeat response
4. Platform reads and implements directives
5. Platform acknowledges completion
6. Repeats every 15 minutes

---

## 1. Better Science Lab / RPLICE
**Platform ID:** `betterscience`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Better Science Lab / RPLICE**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-betterscience-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/betterscience`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "betterscience", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 2. Black Maternal Health Network
**Platform ID:** `sankofa-maternal-health`
**Status:** degraded
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Black Maternal Health Network**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-sankofa-maternal-health-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-maternal-health`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "sankofa-maternal-health", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 3. Black Men's Health Hub
**Platform ID:** `sankofa-mens-health`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Black Men's Health Hub**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-sankofa-mens-health-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-mens-health`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "sankofa-mens-health", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 4. Ecosystem Nexus
**Platform ID:** `ecosystem-nexus`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Ecosystem Nexus**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-ecosystem-nexus-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/ecosystem-nexus`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "ecosystem-nexus", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 5. Holistic Black Feminine Health Hub
**Platform ID:** `sankofa-feminine-health`
**Status:** degraded
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Holistic Black Feminine Health Hub**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-sankofa-feminine-health-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa-feminine-health`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "sankofa-feminine-health", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 6. ISSS — Integrated Supports for Thriving Youth
**Platform ID:** `isss`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **ISSS — Integrated Supports for Thriving Youth**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-isss-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/isss`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "isss", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 7. LifeBridge
**Platform ID:** `lifebridge`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **LifeBridge**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-lifebridge-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/lifebridge`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "lifebridge", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 8. M2C Transition
**Platform ID:** `m2c`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **M2C Transition**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-m2c-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/m2c`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "m2c", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 9. Minority Center of Excellence
**Platform ID:** `mce`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Minority Center of Excellence**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-mce-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mce`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "mce", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 10. Mission Transition
**Platform ID:** `mission-transition`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Mission Transition**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-mission-transition-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/mission-transition`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "mission-transition", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 11. Perfectly Different
**Platform ID:** `perfectly-different`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Perfectly Different**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-perfectly-different-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/perfectly-different`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "perfectly-different", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 12. PillScheduler
**Platform ID:** `pillscheduler`
**Status:** offline
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **PillScheduler**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-pillscheduler-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pillscheduler`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "pillscheduler", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 13. SafeCogniCare
**Platform ID:** `safecognicare`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **SafeCogniCare**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-safecognicare-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safecognicare`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "safecognicare", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 14. SafeReport
**Platform ID:** `safereport`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **SafeReport**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-safereport-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/safereport`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "safereport", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 15. Sankofa Health Network
**Platform ID:** `sankofa`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Sankofa Health Network**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-sankofa-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/sankofa`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "sankofa", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 16. Shield Atlas
**Platform ID:** `shield-atlas`
**Status:** degraded
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Shield Atlas**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-shield-atlas-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/shield-atlas`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "shield-atlas", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 17. The Collaborative Advocate
**Platform ID:** `collaborative-advocate`
**Status:** degraded
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **The Collaborative Advocate**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-collaborative-advocate-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "collaborative-advocate", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 18. Video Creator AI
**Platform ID:** `video-creator-ai`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Video Creator AI**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-video-creator-ai-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/video-creator-ai`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "video-creator-ai", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 19. Whole-Person Health Ecosystem
**Platform ID:** `whole-person-health`
**Status:** online
**Last Heartbeat:** NEVER

**Paste this into the platform's Replit Agent chat:**

> You are **Whole-Person Health Ecosystem**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-whole-person-health-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/whole-person-health`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "whole-person-health", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## 20. WholeMind Learning
**Platform ID:** `wholemind`
**Status:** online
**Last Heartbeat:** 2026-03-19T02:25:57.923Z

**Paste this into the platform's Replit Agent chat:**

> You are **WholeMind Learning**, part of ThriveUp Academy's 20-platform ecosystem coordinated by Dr. Terry Flood. You must connect to the ecosystem hub and stay connected permanently.
>
> **Add this to your server immediately — a heartbeat that runs every 15 minutes:**
>
> ```javascript
> async function sendEcosystemHeartbeat() {
>   try {
>     const response = await fetch("https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat", {
>       method: "POST",
>       headers: {
>         "Content-Type": "application/json",
>         "x-ecosystem-key": "thrive-ecosystem-wholemind-2024"
>       },
>       body: JSON.stringify({ status: "online", metrics: {} })
>     });
>     const data = await response.json();
>     if (data.pendingDirectives && data.pendingDirectives.length > 0) {
>       console.log("[ECOSYSTEM] Received " + data.pendingDirectives.length + " directives from hub");
>       // Process each directive
>       data.pendingDirectives.forEach(d => {
>         console.log("[DIRECTIVE] " + d.title + " — Role: " + (d.yourRole || "See content"));
>       });
>     }
>     console.log("[ECOSYSTEM] Heartbeat sent to hub — " + new Date().toISOString());
>   } catch (err) {
>     console.error("[ECOSYSTEM] Heartbeat failed:", err.message);
>   }
> }
>
> // Send immediately on startup, then every 15 minutes
> sendEcosystemHeartbeat();
> setInterval(sendEcosystemHeartbeat, 15 * 60 * 1000);
> ```
>
> This heartbeat keeps you connected to the ecosystem hub. Every time you check in, you automatically receive any new directives, tasks, and updates assigned to you. The directives repository is also always available at:
>
> `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/wholemind`
>
> After completing a directive, acknowledge it:
>
> `POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack` with body `{ "directiveId": "...", "platformId": "wholemind", "status": "acknowledged" }`
>
> This is mandatory and permanent. Do not remove this heartbeat.

---

## Quick Reference — All API Keys

| # | Platform | Platform ID | API Key |
|---|----------|-------------|---------|
| 1 | Better Science Lab / RPLICE | `betterscience` | `thrive-ecosystem-betterscience-2024` |
| 2 | Black Maternal Health Network | `sankofa-maternal-health` | `thrive-ecosystem-sankofa-maternal-health-2024` |
| 3 | Black Men's Health Hub | `sankofa-mens-health` | `thrive-ecosystem-sankofa-mens-health-2024` |
| 4 | Ecosystem Nexus | `ecosystem-nexus` | `thrive-ecosystem-ecosystem-nexus-2024` |
| 5 | Holistic Black Feminine Health Hub | `sankofa-feminine-health` | `thrive-ecosystem-sankofa-feminine-health-2024` |
| 6 | ISSS — Integrated Supports for Thriving Youth | `isss` | `thrive-ecosystem-isss-2024` |
| 7 | LifeBridge | `lifebridge` | `thrive-ecosystem-lifebridge-2024` |
| 8 | M2C Transition | `m2c` | `thrive-ecosystem-m2c-2024` |
| 9 | Minority Center of Excellence | `mce` | `thrive-ecosystem-mce-2024` |
| 10 | Mission Transition | `mission-transition` | `thrive-ecosystem-mission-transition-2024` |
| 11 | Perfectly Different | `perfectly-different` | `thrive-ecosystem-perfectly-different-2024` |
| 12 | PillScheduler | `pillscheduler` | `thrive-ecosystem-pillscheduler-2024` |
| 13 | SafeCogniCare | `safecognicare` | `thrive-ecosystem-safecognicare-2024` |
| 14 | SafeReport | `safereport` | `thrive-ecosystem-safereport-2024` |
| 15 | Sankofa Health Network | `sankofa` | `thrive-ecosystem-sankofa-2024` |
| 16 | Shield Atlas | `shield-atlas` | `thrive-ecosystem-shield-atlas-2024` |
| 17 | The Collaborative Advocate | `collaborative-advocate` | `thrive-ecosystem-collaborative-advocate-2024` |
| 18 | Video Creator AI | `video-creator-ai` | `thrive-ecosystem-video-creator-ai-2024` |
| 19 | Whole-Person Health Ecosystem | `whole-person-health` | `thrive-ecosystem-whole-person-health-2024` |
| 20 | WholeMind Learning | `wholemind` | `thrive-ecosystem-wholemind-2024` |

## Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/ecosystem/heartbeat` | POST | x-ecosystem-key header | Send heartbeat, receive directives |
| `/api/ecosystem/directives/repository` | GET | None (public) | View all 31 directives |
| `/api/ecosystem/directives/repository/{id}` | GET | None (public) | View directives for one platform |
| `/api/ecosystem/directives/ack` | POST | None | Acknowledge a directive |
| `/api/ecosystem/live-status` | GET | None (public) | Check all platform statuses |