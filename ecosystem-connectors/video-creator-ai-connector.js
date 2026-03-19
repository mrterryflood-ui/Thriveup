// ============================================================
// ThriveUp Ecosystem Connector — Video Creator AI
// Generated: 2026-03-19
// Platform ID: video-creator-ai
// Role: content-production (Marketing & Content)
// Grant Alignment: dfc, wioa, ssg-fox, st-davids
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you are alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
//   - "video_assets"
//   - "presentation_decks"
//   - "marketing_content"
//   - "training_materials"
// Data this platform RECEIVES:
//   - "platform_descriptions"
//   - "grant_narratives"
//   - "outcome_data"
//   - "brand_guidelines"
//   - "service_descriptions"
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "https://thrivingcommunitiesforall.com",
  platformId: "video-creator-ai",
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  heartbeatIntervalMs: 5 * 60 * 1000,
};

async function sendHeartbeat(metrics = {}) {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ platformId: THRIVE_ECOSYSTEM_CONFIG.platformId, metrics, timestamp: new Date().toISOString() }),
    });
    const data = await response.json();
    if (data.pendingEvents?.length > 0) {
      for (const event of data.pendingEvents) { await handleIncomingEvent(event); }
    }
    if (data.pendingDirectives?.length > 0) {
      for (const directive of data.pendingDirectives) {
        console.log(`[ThriveUp Ecosystem] Directive received: ${directive.title}`);
        await acknowledgeDirective(directive.id);
      }
    }
    return data;
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Heartbeat failed:", error.message);
  }
}

async function sendEcosystemEvent(eventType, eventData, targetPlatformId = null) {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ eventType, eventData, targetPlatformId }),
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Event send failed:", error.message);
  }
}

async function acknowledgeDirective(directiveId) {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/directives/${directiveId}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ platformId: THRIVE_ECOSYSTEM_CONFIG.platformId, status: "acknowledged" }),
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Directive acknowledgment failed:", error.message);
  }
}

async function handleIncomingEvent(event) {
  console.log(`[ThriveUp Ecosystem] Received: ${event.eventType} from ${event.sourcePlatformId}`);
  // Event types you will receive from the ecosystem:
  //   platform_descriptions — descriptions of platforms needing video content
  //   grant_narratives — grant narrative text for video/presentation creation
  //   outcome_data — outcome metrics for impact videos
  //   brand_guidelines — branding info from platforms
  //   service_descriptions — service details for promotional content
}

async function getIntegrationDoc() {
  try {
    const response = await fetch(`${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/integration-doc`, {
      headers: { "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Failed to fetch integration doc:", error.message);
  }
}

setInterval(() => sendHeartbeat(), THRIVE_ECOSYSTEM_CONFIG.heartbeatIntervalMs);
sendHeartbeat();
console.log("[ThriveUp Ecosystem] Video Creator AI connector initialized — ID: video-creator-ai");

if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, acknowledgeDirective, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
