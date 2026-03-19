// ============================================================
// ThriveUp Ecosystem Connector — Whole-Person Health Ecosystem
// Generated: 2026-03-19T02:19:06.129Z
// Platform ID: whole-person-health
// Role: hub
// Grant Alignment: ssg-fox, samhsa, st-davids, dfc, wioa
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you are alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
//   - "screening_results"
//   - "safety_plan_status"
//   - "resource_referrals"
//   - "crisis_events"
//   - "care_summaries"
// Data this platform RECEIVES:
//   - "veteran_profiles"
//   - "transition_status"
//   - "life_event_assessments"
//   - "research_updates"
//   - "youth_referrals"
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "https://55376bb2-2aea-463e-b6a9-2c1d5c123d53-00-5trt8miml0vw.janeway.replit.dev",
  platformId: "whole-person-health",
  apiKey: "tveco_4c4e4a57d0c6b4273870f88062586af4d35d7fbf4edf1e025623ab19d1e7bcdb",
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

async function handleIncomingEvent(event) {
  console.log(`[ThriveUp Ecosystem] Received: ${event.eventType} from ${event.sourcePlatformId}`);
  // TODO: Add your platform-specific event handling here
  // Common event types across the ecosystem:
  //   screening_completed, crisis_alert, veteran_referred, transition_milestone,
  //   life_event_risk, research_update, youth_enrolled, resource_referral,
  //   safety_plan_created, medication_alert, cognitive_assessment, incident_report
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
console.log("[ThriveUp Ecosystem] Whole-Person Health Ecosystem connector initialized — ID: whole-person-health");

if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
