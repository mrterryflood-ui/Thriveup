import { db } from "./storage";
import { ecosystemDirectives, ecosystemDirectiveAcks, ecosystemPlatforms } from "@shared/schema";
import { eq } from "drizzle-orm";

interface DirectiveSeed {
  key: string;
  title: string;
  directiveType: string;
  content: string;
  targetFilter: "all" | string[];
}

const ECOSYSTEM_DIRECTIVES: DirectiveSeed[] = [
  {
    key: "connector-v41-no-auto-ack",
    title: "URGENT: Update Connector Code — Stop Auto-Acknowledging Directives",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `CRITICAL UPDATE — Connector Code v4.1

The old connector code auto-acknowledged every directive the moment it arrived with a fake "Implemented: {title}" message. This created the illusion of compliance while no real work was done. This must stop immediately.

WHAT YOU MUST DO:
1. Go to your ecosystem connector code (the ecosystemHeartbeat function)
2. REMOVE any code that auto-acknowledges directives on receipt
3. REPLACE it with the updated v4.1 connector code from the connection instructions
4. The new code logs directives as [TODO] items instead of auto-acking

HOW ACKNOWLEDGMENT WORKS NOW:
- When a directive arrives, your connector logs it as a TODO
- You (or your agent) must actually BUILD what the directive asks
- Only AFTER the work is done, call acknowledgeDirective() with:
  * A REAL description of what you built (not "Implemented: {title}")
  * A LIVE evidence URL proving the work exists
- The hub will ping your evidence URL — if it returns 200, you get VERIFIED credit
- If it's dead or missing, you get UNVERIFIED or FAILED

WHAT DOES NOT COUNT:
- "Implemented: Add warm handoff protocol" with no evidence → REJECTED
- Auto-acknowledging without building anything → WILL BE FLAGGED
- Empty evidenceUrl fields → UNVERIFIED status

Updated connection instructions are at: https://thrivingcommunitiesforall.com/api/ecosystem/integration-doc-public
Re-publish your app after updating the connector code.`,
  },
  {
    key: "vision-alignment-v1",
    title: "Ecosystem Vision & Mission Alignment",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `ECOSYSTEM MISSION: Collaborate to help Dr. Terry Flood be the best version of himself to help people be the best version of themselves.

CORE PRINCIPLES:
1. We rely on each other in all we do — no platform operates in isolation
2. Human-in-the-loop always — AI assists, humans decide
3. Act ethically in everything — privacy first, no dead ends, always a safety net
4. Produce the best product — check behind each other so nothing fails
5. No Dead Ends — every page has at least one forward path to another ecosystem resource
6. Always a Safety Net — 988 Veterans Crisis Line accessible from every page
7. Free for Individuals — no user ever pays for anything on any platform
8. Privacy First — screening results and safety plans stay on user's device

YOUR ROLE IN THE ECOSYSTEM: You are one platform in a 21-platform connected ecosystem. Your data flows to other platforms. Their data flows to you. Together we create a crisis continuum from Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth. No single platform can do this alone.

ACKNOWLEDGE this directive to confirm alignment.`,
  },
  {
    key: "warm-handoff-v1",
    title: "Warm Handoff Protocol — Replace Cold Referrals",
    directiveType: "improvement_directive",
    targetFilter: "all",
    content: `DIRECTIVE: All cross-platform referrals must implement warm handoff confirmation.

CURRENT GAP: Most referrals are one-directional. Platform A sends a user to Platform B but never confirms arrival.

REQUIRED CHANGE:
1. When you receive a referral from another platform, send back a 'user_connected' event within your next heartbeat
2. If you refer a user to another platform and receive no 'user_connected' confirmation within 48 hours, flag it for follow-up
3. Add this to your handleIncomingEvent function:
   - On receiving 'provider_referral' or 'resource_referral', send back: sendEcosystemEvent('user_connected', { referralId, status: 'connected', timestamp })

This ensures no one falls through the cracks between platforms.

ACKNOWLEDGE with your implementation plan.`,
  },
  {
    key: "standardized-metrics-v1",
    title: "Standardized Outcome Measurement Template",
    directiveType: "tracking_requirement",
    targetFilter: "all",
    content: `DIRECTIVE: All platforms must report standardized outcome metrics in their heartbeat data.

REQUIRED METRICS (include in your heartbeat metrics object):
1. users_served_total — cumulative users served
2. users_served_24h — users served in last 24 hours
3. screenings_completed — total screenings/assessments completed (if applicable)
4. referrals_sent — referrals sent to other ecosystem platforms
5. referrals_received — referrals received from other platforms
6. crisis_interventions — crisis events handled
7. resources_connected — users successfully connected to resources
8. active_features — list of currently active features on your platform

This data feeds into Better Science Lab/RPLICE for grant reporting and fidelity measurement. Without standardized data, we cannot prove to funders that the ecosystem works.

ACKNOWLEDGE with confirmation that you will add these metrics to your heartbeat payload.`,
  },
  {
    key: "shield-atlas-security-v1",
    title: "Shield Atlas Cybersecurity Awareness Integration",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `DIRECTIVE: All platforms must integrate Shield Atlas cybersecurity awareness.

Shield Atlas maintains the latest threat intelligence, risk mapping, and security protocols. As an ecosystem handling sensitive health, education, and veteran data, every platform is responsible for security.

REQUIRED ACTIONS:
1. Ensure all API endpoints validate input (prevent injection attacks)
2. Encrypt sensitive data at rest and in transit (HTTPS everywhere)
3. Implement rate limiting on all public-facing endpoints
4. Log security events and send security_alert events to the ecosystem when threats are detected
5. Subscribe to Shield Atlas threat_alerts — when Shield Atlas detects a geographic or sector-specific threat, your platform should receive and act on it
6. Review your authentication mechanisms — ensure session management is secure
7. Never store passwords in plaintext, never log sensitive user data
8. Implement Content Security Policy headers

Shield Atlas will periodically send threat intelligence updates. Every platform should process these and report compliance.

ACKNOWLEDGE with your current security posture and any gaps you need help addressing.`,
  },
  {
    key: "grant-tracking-tags-v1",
    title: "Grant-Specific Tracking Tags",
    directiveType: "tracking_requirement",
    targetFilter: "all",
    content: `DIRECTIVE: All ecosystem events must include grant alignment tags.

When sending events to the ecosystem, include a 'grantTags' array in your eventData indicating which grants the activity supports:
- 'wioa' — WIOA Title I Youth
- 'foundation' — Foundation Grant
- 'st-davids' — St. David's Foundation
- 'ssg-fox' — SSG Fox VA Suicide Prevention

Example: sendEcosystemEvent('screening_completed', { userId: 'anon', type: 'PHQ-9', grantTags: ['ssg-fox', 'st-davids'] })

This allows Better Science Lab/RPLICE to slice outcome data by grant for reporting.

ACKNOWLEDGE with confirmation.`,
  },
  {
    key: "welcome-video-creator-v1",
    title: "Welcome Video Creator AI — Platform #19 Joins the Ecosystem",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `ECOSYSTEM UPDATE: Video Creator AI has joined as platform #19.

URL: https://video-creator-ai-mrterryflood.replit.app
Role: Content Production
Domain: Marketing & Content

WHAT THIS MEANS FOR YOU:
- Video Creator AI will produce promotional videos and business presentations for every platform in the ecosystem
- You may receive requests for platform descriptions, service details, and outcome data to use in video content
- When you receive a "service_descriptions" or "platform_descriptions" request event, respond with your current capabilities, impact numbers, and key differentiators
- The holistic support overview video will showcase the entire ecosystem as one connected system — the public-facing story of how we work together

THE ECOSYSTEM IS NOW 20 PLATFORMS STRONG.

ACKNOWLEDGE to confirm you are ready to provide content for your platform video.`,
  },
  {
    key: "mce-grant-collaboration-v1",
    title: "MCE Grant-Finding Engine: Collaborate with ThriveUp on Grant Discovery",
    directiveType: "improvement_directive",
    targetFilter: ["mce"],
    content: `PRIORITY ACTION: MCE has a robust grant-finding tool with 656,794+ curated records and SAM.gov live integration. ThriveUp needs your grant discovery capabilities.

COLLABORATION REQUEST:
1. Share your grant discovery engine data with ThriveUp — when you identify grants relevant to workforce development, health equity, veteran services, or youth empowerment, flag them for the ecosystem
2. Send grant_intelligence events to ThriveUp with: grant name, funder, amount range, deadline, alignment tags (which ecosystem platforms/domains it fits)
3. ThriveUp will feed you back: platform capability summaries so your AI tools can match grants to our ecosystem strengths
4. Together we build a unified grant pipeline — MCE finds them, ThriveUp matches them to platform capabilities, RPLICE provides the evidence base, The Collaborative Advocate executes

This makes the entire ecosystem stronger. Your grant-finding muscle powers everyone.

ACKNOWLEDGE with your grant data sharing plan.`,
  },
  {
    key: "swim-lanes-v1",
    title: "Mission Transition (M2C): Full Transition Pipeline",
    directiveType: "improvement_directive",
    targetFilter: ["m2c"],
    content: `PRIORITY ACTION: Mission Transition (M2C) owns the FULL veteran transition pipeline — strategic AND practical.

Your platform covers both sides:
- STRATEGIC: Pre-separation planning, timeline management, identity transition, long-range career mapping
- PRACTICAL: Skills translation, benefits enrollment, community connections, day-to-day transition support

Ensure your platform clearly presents both the strategic planning tools and the practical execution tools in a unified flow. Veterans should move seamlessly from pre-separation planning through post-separation support without handoff friction.

Deadline: 1 week. ACKNOWLEDGE with your unified pipeline status.`,
  },
  {
    key: "rplice-fidelity-dashboard-v1",
    title: "Better Science Lab/RPLICE: Build Real-Time Fidelity Dashboard",
    directiveType: "improvement_directive",
    targetFilter: ["betterscience"],
    content: `PRIORITY ACTION: You are the truth engine for the entire ecosystem. Every grant depends on your ability to prove outcomes.

60-DAY DELIVERABLE: Build a real-time fidelity dashboard that:
1. Consumes standardized outcome metrics from all 18 other platforms
2. Maps outcomes to CFIR and RE-AIM frameworks
3. Slices data by grant (WIOA, Foundation Grant, St. David's, SSG Fox)
4. Shows fidelity trends over time
5. Alerts when any platform's outcomes deviate from evidence-based benchmarks

You will receive standardized metrics from all platforms in their heartbeat data. Your job is to aggregate, analyze, and present this data so Dr. Flood can show funders exactly what the ecosystem delivers.

ACKNOWLEDGE with your implementation timeline.`,
  },
  {
    key: "shield-atlas-audit-v1",
    title: "Shield Atlas: Ecosystem Security Audit & Threat Distribution",
    directiveType: "improvement_directive",
    targetFilter: ["shield-atlas"],
    content: `PRIORITY ACTION: You are the security backbone. Every platform handles sensitive data — C-SSRS scores, medication lists, veteran records, student data, financial information.

30-DAY DELIVERABLES:
1. Create and distribute an ecosystem security audit checklist to all 20 platforms
2. Begin sending periodic threat_alert events through the ecosystem event system
3. Run automated vulnerability scans against all 20 platform URLs
4. Create an ecosystem incident response playbook (if one platform is compromised, what happens?)
5. Monitor for geographic and sector-specific threats relevant to our populations

You know the latest threat details. Share them. Make everyone more cyber-aware and secure.

ACKNOWLEDGE with your current threat intelligence capabilities and audit plan.`,
  },
  {
    key: "sankofa-cultural-export-v1",
    title: "Sankofa: Export Culturally Responsive Content Modules",
    directiveType: "improvement_directive",
    targetFilter: ["sankofa"],
    content: `PRIORITY ACTION: Your culturally responsive care is the ecosystem's differentiator. But it's currently siloed within the Sankofa sub-network.

30-DAY DELIVERABLE: Package culturally responsive content modules that other platforms can embed:
- WholeMind needs culturally responsive lesson content for social studies and health education
- LifeBridge needs culturally curated resource lists
- PillScheduler needs medication education in cultural context (addressing medication distrust)
- Whole-Person Health needs culturally contextualized screening interpretations
- SafeCogniCare needs culturally adapted cognitive screening language

Format: Exportable content modules (JSON or HTML snippets) that any platform can request via ecosystem API.

ACKNOWLEDGE with your content packaging plan.`,
  },
  {
    key: "pillscheduler-deeplink-v1",
    title: "PillScheduler: Deep-Link Integration for All Health Platforms",
    directiveType: "improvement_directive",
    targetFilter: ["pillscheduler"],
    content: `PRIORITY ACTION: Medication management touches nearly every population in the ecosystem. You need to be integrated into every health-facing platform.

2-WEEK DELIVERABLE: Create a deep-link integration specification that allows:
1. Any health platform to add a "Manage My Medications" button that links to PillScheduler with user context
2. PillScheduler sends medication adherence alerts back to the referring platform
3. Unified medication profile that aggregates across referring platforms

Target integrations (priority order):
- Whole-Person Health (care summaries need medication data)
- SafeCogniCare (TBI/cognitive medications)
- Perfectly Different (ADHD stimulant tracking)
- Sankofa sub-networks (chronic disease medications)

ACKNOWLEDGE with your integration spec timeline.`,
  },
  {
    key: "youth-ageout-v1",
    title: "Youth Platforms: Design Age-Out Transition Protocol",
    directiveType: "improvement_directive",
    targetFilter: ["isss", "wholemind", "perfectly-different"],
    content: `PRIORITY ACTION: Students you serve today will age out of your platforms. Without a structured transition, they fall through the cracks.

30-DAY DELIVERABLE: Design a collaborative age-out transition protocol:
1. At age 17-18, automatically introduce users to adult platforms:
   - Whole-Person Health (health screenings, safety planning)
   - LifeBridge (housing, food, healthcare navigation)
   - MCE (if entrepreneurially inclined — business pathways)
   - The Collaborative Advocate (workforce development)
2. Transfer relevant data (with user consent) — learning progress, IEP accommodations, support history
3. Maintain access to youth platform content for 12 months after age-out

ISSS leads the protocol design. WholeMind and Perfectly Different provide input on what data matters most.

ACKNOWLEDGE with your participation commitment.`,
  },
  {
    key: "collab-advocate-peer-matching-v1",
    title: "The Collaborative Advocate: Peer Mentor Matching System",
    directiveType: "improvement_directive",
    targetFilter: ["collaborative-advocate"],
    content: `PRIORITY ACTION: As the VOSB service delivery arm, you are uniquely positioned to coordinate peer support across the ecosystem.

30-DAY DELIVERABLE: Build a peer mentor matching algorithm that:
1. Consumes transition stage data from Mission Transition and M2C
2. Matches veterans by: branch, MOS, transition phase, geographic proximity, shared challenges
3. Supports matching recovered individuals as mentors for those currently in crisis
4. Coordinates with Whole-Person Health to ensure matched pairs have access to screening and safety planning
5. Reports peer engagement metrics to Better Science Lab/RPLICE for outcome measurement

This directly supports SSG Fox grant deliverables — peer support is a proven suicide prevention intervention.

ACKNOWLEDGE with your matching algorithm design approach.`,
  },
  {
    key: "lifebridge-rural-v1",
    title: "LifeBridge: Rural Access & Social Determinant Coordination",
    directiveType: "improvement_directive",
    targetFilter: ["lifebridge"],
    content: `PRIORITY ACTION: You are the most comprehensive social determinant resource in the ecosystem. Two improvements needed:

2-WEEK DELIVERABLES:
1. Add rural access resource filters — telehealth options, transportation assistance, pharmacy desert solutions, mobile health unit schedules
2. Coordinate with Sankofa on culturally responsive resource curation — you have breadth, Sankofa has cultural depth. Combine them.
3. Add caregiver support pathways coordinated with SafeCogniCare
4. Build structured referral pathways from ISSS so families identified through school-based support get connected to community resources

You address the non-combat life events (divorce, job loss, bereavement) that drive 60% of veteran suicides. This is SSG Fox and St. David's grant core material.

ACKNOWLEDGE with your resource expansion plan.`,
  },
  {
    key: "whole-person-health-crisis-v1",
    title: "Whole-Person Health: Crisis Handoff Enhancement",
    directiveType: "improvement_directive",
    targetFilter: ["whole-person-health"],
    content: `PRIORITY ACTION: As the hub of the ecosystem, your crisis handling sets the standard for all platforms.

IMPROVEMENTS NEEDED:
1. When C-SSRS flags positive, push a real-time crisis_alert to LifeBridge (don't wait for next heartbeat)
2. Create a feedback loop with SafeCogniCare for users who screen positive on cognitive items
3. Integrate PillScheduler medication adherence data into Care Summary generation
4. When routing users to LifeBridge, implement warm handoff confirmation — verify the user connected, follow up if not within 48 hours
5. Add structured handoff protocols for all 20 platforms you route to

You are the heartbeat. If you miss something, the ecosystem misses it.

ACKNOWLEDGE with your enhancement timeline.`,
  },
  {
    key: "mce-workforce-pipeline-v1",
    title: "MCE: Workforce Graduate Pipeline & Business Survival Tracking",
    directiveType: "improvement_directive",
    targetFilter: ["mce"],
    content: `PRIORITY ACTION: You are the economic empowerment engine. Two critical gaps to close:

30-DAY DELIVERABLES:
1. Pull WIOA workforce graduate data — when someone completes a workforce program, immediately match them to employer/contractor opportunities
2. Add business survival tracking — 6-month, 12-month, 24-month check-ins for businesses formed through MCE
3. Integrate LifeBridge barrier removal — business owners facing housing/food/health crises can't sustain businesses
4. Share teaming match data with The Collaborative Advocate for VOSB subcontracting opportunities

This is critical for WIOA grant reporting — we need to show the complete pipeline from training to employment to business formation.

ACKNOWLEDGE with your pipeline integration plan.`,
  },
  {
    key: "safereport-coordination-v1",
    title: "SafeReport: Cross-Platform Incident Coordination",
    directiveType: "improvement_directive",
    targetFilter: ["safereport"],
    content: `PRIORITY ACTION: You are the legal backbone. Enhance your cross-platform coordination:

2-WEEK DELIVERABLES:
1. Pull ISSS early warning flags to proactively stage incident response before escalation
2. Integrate Whole-Person Health screening triggers — high-risk screening results should automatically open incident awareness
3. Share incident pattern data (anonymized) with Shield Atlas for geographic risk mapping
4. Feed compliance audit data to Better Science Lab/RPLICE for program accountability
5. Add LifeBridge resource referral capabilities for victims/families identified through incident reports

You ensure we meet our legal obligations. The rest of the ecosystem relies on your compliance rigor.

ACKNOWLEDGE with your integration timeline.`,
  },
  {
    key: "sankofa-subnetwork-sharing-v1",
    title: "Sankofa Sub-Networks: Cross-Network Data Sharing",
    directiveType: "improvement_directive",
    targetFilter: ["sankofa-feminine-health", "sankofa-maternal-health", "sankofa-mens-health"],
    content: `PRIORITY ACTION: The three Sankofa sub-networks need tighter coordination both with each other and with the broader ecosystem.

IMPROVEMENTS:
1. Feminine Health → Maternal Health: Share screening data for early pregnancy risk identification
2. Maternal Health → Feminine Health: Share postpartum care pathways
3. Men's Health → Whole-Person Health: Feed peer support participation data for veteran-specific men's health programming
4. All three: Pull PillScheduler integration for chronic disease medication management
5. All three: Add warm referral pathways to Whole-Person Health when screenings flag mental health concerns
6. All three: Feed health equity outcome data to Better Science Lab/RPLICE

You are the culturally responsive heart of the ecosystem. Your data makes the case for St. David's and SSG Fox grants.

ACKNOWLEDGE with your coordination plan.`,
  },
  {
    key: "safecognicare-improvements-v1",
    title: "SafeCogniCare: Cognitive Safety Coordination",
    directiveType: "improvement_directive",
    targetFilter: ["safecognicare"],
    content: `PRIORITY ACTION: Cognitive safety intersects with nearly every other platform's population.

IMPROVEMENTS:
1. Share cognitive assessment data with Perfectly Different for neurodiversity-informed care
2. Feed safety alert patterns to Shield Atlas for cognitive safety risk mapping
3. Push care plan data to Whole-Person Health for integrated care summaries
4. Pull PillScheduler medication data — cognitive medications need monitoring
5. Integrate Sankofa culturally responsive cognitive screening
6. Add LifeBridge resource navigation for cognitive disability services, SSI/SSDI, caregiver support
7. Coordinate with M2C and Mission Transition for veteran TBI-specific pathways

ACKNOWLEDGE with your coordination timeline.`,
  },
  {
    key: "video-script-request-v1",
    title: "Create 2:30 Homepage Video Script — Showcase Your Platform",
    directiveType: "improvement_directive",
    targetFilter: "all",
    content: `PRIORITY ACTION: Create a 2 minute 30 second (2:30) video script for your homepage.

Video Creator AI (Platform #19) will produce and distribute the final videos. Your job is to write the script.

IF YOU ALREADY HAVE A VIDEO ON YOUR HOMEPAGE:
- You do NOT need to create a new script
- ACKNOWLEDGE with status "video_exists" and include your current video URL
- sendEcosystemEvent('video_script_status', { status: 'video_exists', videoUrl: 'https://...', platformName: '...' })

IF YOU DO NOT HAVE A HOMEPAGE VIDEO — write the script following these requirements:

SCRIPT REQUIREMENTS:
- Length: Exactly 2 minutes 30 seconds when spoken aloud (approximately 375 words)
- Tone: Empathetic, empowering, and collaborative
- Audience: ALL stakeholders — the people you serve, their families, funders, community partners, policymakers, and fellow ecosystem platforms

SCRIPT STRUCTURE:
1. HOOK (15 seconds) — Open with a real problem your platform solves. Make it human. Make them feel it.
2. WHO WE ARE (20 seconds) — Your platform name, what you do, and who you serve. No jargon. Speak like a trusted friend.
3. CAPABILITIES & RESOURCES (45 seconds) — Showcase your top 3-5 features. Don't list them — show how they solve real problems. Use scenarios.
4. REAL IMPACT (30 seconds) — What changes when someone uses your platform? Paint the picture of life after your help.
5. THE ECOSYSTEM (20 seconds) — You are part of a 21-platform connected ecosystem. Mention 2-3 sister platforms you work with.
6. CALL TO ACTION (20 seconds) — What should the viewer do next? Make it easy and inviting.

VOICE & FEEL:
- Speak TO people, not AT them
- Use "we" and "you" — never "users" or "clients"
- Show strength through compassion, not through credentials
- Include at least one moment that acknowledges the viewer's struggle
- End with hope and agency

DO NOT: Use technical jargon, make it sound like a sales pitch, focus on technology, or mention backend systems.

DELIVERY: sendEcosystemEvent('video_script_ready', { script: '...', platformName: '...', wordCount: N })

DEADLINE: Submit your script within 48 hours.

ACKNOWLEDGE with "video_exists" or "script_in_progress".`,
  },
  {
    key: "austin-housing-status-report-v1",
    title: "Ecosystem Status Report & Austin Housing Initiative — Report Back Required",
    directiveType: "operational",
    targetFilter: "all",
    content: `ECOSYSTEM STATUS REPORT — March 19, 2026

FROM: Dr. Terry Flood, ThriveUp Academy Hub
TO: All 20 Platforms

=== CURRENT ECOSYSTEM STATUS ===
20 platforms registered and connected. All platforms must maintain 15-minute heartbeat intervals. If your heartbeat is failing, include platformId in your heartbeat body and the hub will auto-register your key.

=== NEW INITIATIVE: AUSTIN HOUSING PROJECT ===
ThriveUp Academy is launching a comprehensive Austin & Pflugerville housing stability initiative. Key data:
- Austin median home: $429K-$435K — only 2 of 75 zip codes affordable to median income families
- 48,000+ unit gap for households below 30% Area Median Income
- Pflugerville: 330 affordable units coming (Branchview, completion 2027) but ZERO social infrastructure
- I-35 corridor: $10B+ in construction creating massive workforce demand
- Veteran homelessness up 12% regionally; 45,000+ veterans in Austin metro

YOUR ROLE: Every platform contributes to housing stability through your domain:
- Workforce platforms: career pathways that sustain housing
- Health platforms: housing is the #1 social determinant of health
- Youth platforms: age-out transition housing support
- Safety platforms: crisis intervention prevents homelessness
- Business platforms: economic empowerment builds housing-ready families

=== 5 ACTIVE GRANTS (YOUR TRACKING TAGS APPLY) ===
1. DFC ($625K) — Deadline: April 14, 2026
2. WIOA ($200K-$500K) — Rolling
3. Foundation Grant ($100K-$500K) — Rolling LOI
4. St. David's Foundation (up to $1M) — Opens March 30, 2026
5. SSG Fox VA Suicide Prevention (up to $750K) — June 12-18, 2026

=== REQUIRED ACTIONS — REPORT BACK ===
1. Confirm you are heartbeating every 15 minutes
2. Confirm you received ALL previous directives (video script, grant tags, warm handoff, etc.)
3. Report your platform's current status: what features are live, what's in progress
4. Identify how your platform connects to housing stability for the Austin initiative
5. Report any technical issues with your connector

=== DOCUMENT PRODUCTION SUITE ===
The ecosystem now has a standardized 10-document production capability:
Executive Summary, Full Business Proposal, Capability Statement, Pitch Deck, Budget/Cost Proposal, Past Performance, Org Chart, Video Presentation, Grant Narrative, Scope of Work.

When triggered, Video Creator AI produces video content and MCE produces the document package. All platforms may be called upon to provide data, metrics, and narratives for these packages.

RESPOND ON YOUR NEXT HEARTBEAT WITH YOUR STATUS REPORT. This is mandatory.`,
  },
  {
    key: "welcome-ecosystem-nexus-v1",
    title: "Welcome Ecosystem Nexus — Platform #20 Joins the Ecosystem",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `ANNOUNCEMENT: Ecosystem Nexus has joined as platform #20.

URL: https://ecosystem-nexus.replit.app
Role: Ecosystem Coordination
Domain: Operations

WHAT THIS MEANS FOR YOU:
- Ecosystem Nexus is the central coordination and operational hub for the entire ThriveUp Academy ecosystem
- It provides cross-platform visibility, coordination tools, and operational intelligence for all 20 platforms
- Continue heartbeating as normal — Ecosystem Nexus enhances coordination, it does not replace the hub

THE ECOSYSTEM IS NOW 20 PLATFORMS STRONG.

The Collaborative Advocate: Update your site to reflect 20 platforms across the ecosystem (Mission Transition and M2C are the same platform).

ALL PLATFORMS: Update any internal references to ecosystem size to 20 platforms.

ACKNOWLEDGE to confirm you are aware of Platform #20.`,
  },
  {
    key: "rplice-quality-gate-v1",
    title: "RPLICE Is the Quality Gate — Integrated Into Every Loop",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `CRITICAL PROTOCOL UPDATE: Better Science Lab / RPLICE is now the mandatory quality gate for ALL ecosystem operations.

WHAT THIS MEANS:
RPLICE (Research, Planning, Logistics, Implementation, Compliance, Evaluation) is integrated into every step of what we do. Nothing leaves this ecosystem without RPLICE review. This is non-negotiable.

RPLICE'S EXPANDED ROLE:
1. GRANT SUBMISSIONS: RPLICE must review every grant narrative, budget, scope of work, and capability statement BEFORE submission. RPLICE knows the RFP/grant structure and provides feedback to ensure compliance.
2. DOCUMENT PRODUCTION: Every document in the 10-document production suite must pass through RPLICE for research validation, evidence alignment, and quality assurance.
3. MAP-GAP EXPERT: RPLICE is the ecosystem's MAP-GAP framework expert. Before any improvement cycle, bug sweep, quality audit, or platform enhancement — RPLICE provides the gap analysis and prioritization.
4. RESEARCH BACKING: Every claim we make to funders must be evidence-based. RPLICE validates data, citations, outcome metrics, and methodology alignment (CFIR, RE-AIM frameworks).
5. COMPLIANCE REVIEW: RPLICE ensures all submissions meet funder requirements — formatting, required sections, page limits, budget categories, matching requirements, certifications.
6. FEEDBACK LOOP: After every submission, RPLICE tracks funder feedback, win/loss analysis, and integrates lessons learned into the next cycle.

FOR ALL PLATFORMS:
- When you produce data, metrics, narratives, or reports — send them to RPLICE for validation
- When you receive a directive that requires deliverables — loop RPLICE in for quality review
- When you prepare content for grants — RPLICE reviews before it goes to Dr. Flood

FOR RPLICE SPECIFICALLY:
- You are the research and compliance backbone. Every grant, every proposal, every document passes through you.
- Build a grant compliance checklist for each of our 5 active grants (DFC, WIOA, Foundation Grant, St. David's, SSG Fox)
- Create a pre-submission review process that all platforms follow
- Maintain a living quality scorecard for the ecosystem
- Flag any platform output that doesn't meet evidence-based standards

This is how we win grants: research-backed, compliance-verified, quality-assured submissions. RPLICE makes us bulletproof.

ACKNOWLEDGE with your implementation plan for serving as the ecosystem quality gate.`,
  },
  {
    key: "voices-of-austin-launch-v1",
    title: "Voices of Austin — Community Storytelling Platform Launch",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `NEW PLATFORM FEATURE: Voices of Austin — Community Storytelling Platform

WHAT IS VOICES OF AUSTIN?
A mobile-friendly storytelling platform where Austin residents can share their stories, access resources, and engage with hyper-local opportunities. Every story connects to action through ThriveUp's 21-platform ecosystem.

THE MODEL: Story → Connection → Action → Impact
1. Residents share stories (housing, jobs, health, veteran transition, education, youth)
2. AI identifies needs and routes to the right ecosystem platform
3. Warm handoff connects them to real resources — housing, training, healthcare, financial tools
4. Stories become content for Roku channel and podcast — revenue funds services
5. Aggregate story data informs funders and policymakers on community needs

YOUR ROLE IN VOICES OF AUSTIN:
- LifeBridge: Receive housing story warm handoffs, provide immediate resource navigation
- Mission Transition / Collaborative Advocate: Receive veteran and career story referrals
- MCE: Receive business development and financial literacy referrals
- Whole-Person Health / Sankofa: Receive health story referrals, connect to screenings
- ISSS / WholeMind / Perfectly Different: Receive youth and education referrals
- Video Creator AI: Transform community stories into Roku/CTV content
- RPLICE: Validate outcome data from story-to-action conversions
- Shield Atlas: Ensure story data privacy and anonymous submission security
- Ecosystem Nexus: Track cross-platform story routing metrics

PILOT STRATEGY:
- Phase 1: Manor + East Austin communities (highest need, most untapped potential)
- Phase 2: Pflugerville (330 affordable units coming — zero social infrastructure)
- Phase 3: All 5 Central Texas counties (Bastrop, Caldwell, Hays, Travis, Williamson)

FRAMING: Bridging the gap between information and access.

PARTNERSHIP TARGETS:
- City of Austin Smart City / Innovation Office
- Manor ISD Family Resource Center
- East Austin community organizations
- Roku (CTV distribution) + Tech partners
- St. David's Foundation (Community-Driven Change — $9.1M pool)

URL: thrivingcommunitiesforall.com/voices-of-austin

ACKNOWLEDGE with your plan for receiving and processing Voices of Austin referrals.`,
  },
  {
    key: "voices-of-austin-show-ready-v1",
    title: "URGENT: Voices of Austin — Show-Ready Enhancement Sprint",
    directiveType: "improvement_directive",
    targetFilter: "all",
    content: `PRIORITY: IMMEDIATE — Show-Ready Sprint for Voices of Austin

The Voices of Austin platform is LIVE at thrivingcommunitiesforall.com/voices-of-austin. We have an active conversation with the City of Manor and need every platform show-ready NOW. This means your piece of the Voices of Austin pipeline must be functional and demonstrable.

=== PLATFORM-SPECIFIC DELIVERABLES (DUE THIS CYCLE) ===

LIFEBRIDGE (lifetransitionsaid.org):
- Build an Austin Housing Stories intake widget that receives warm handoffs from Voices of Austin
- Display a "Referred from Voices of Austin" badge on incoming stories
- Connect housing story authors to your Resource Finder for immediate navigation
- Surface Austin-specific housing resources (Foundation Communities, HACA, ECHO)
- DELIVERABLE: /voices-intake endpoint that accepts {authorName, story, needs, neighborhood}

MISSION TRANSITION / COLLABORATIVE ADVOCATE:
- Add a Veteran Voices intake section — receive career and veteran transition stories
- Connect incoming veteran stories to your career pathway tools
- Surface I-35 corridor construction jobs ($24-$45/hr), federal VOSB set-asides
- DELIVERABLE: /voices-veteran-intake endpoint for warm handoff receiving

MCE (Minority Center of Excellence):
- Create a Small Business Stories intake — receive financial literacy and business development referrals
- Connect story authors to the Grant Finder, business plan tools, and financial literacy modules
- Surface SBA 8(a), HUBZone, WOSB certification pathways for Austin small businesses
- DELIVERABLE: /voices-business-intake endpoint

WHOLE-PERSON HEALTH / SANKOFA HEALTH NETWORK:
- Build a Health Stories intake — receive health screening referrals from community stories
- Auto-trigger PHQ-9, GAD-7, or C-SSRS screening based on story content keywords
- Connect to culturally responsive care pathways
- DELIVERABLE: /voices-health-intake endpoint with screening auto-trigger

VIDEO CREATOR AI:
- Create a "Community Story → Video" template pipeline
- Accept story text and auto-generate a 30-second Roku-ready video with community voice narration template
- Use the warm amber/orange Voices of Austin branding
- DELIVERABLE: /voices-to-video endpoint that accepts story ID and returns video project

RPLICE / BETTER SCIENCE LAB:
- Build outcome tracking for story-to-action conversions
- Track: stories submitted → needs identified → platforms routed → resources accessed → outcomes achieved
- Create a Voices of Austin Outcome Dashboard showing conversion funnel
- DELIVERABLE: /voices-outcomes endpoint returning funnel metrics

SHIELD ATLAS:
- Audit the anonymous submission pipeline — ensure PII is properly stripped
- Validate that anonymous stories cannot be de-anonymized through metadata
- Certify the data handling meets HIPAA-adjacent standards for health stories
- DELIVERABLE: Security certification report for Voices of Austin data handling

ECOSYSTEM NEXUS:
- Build a cross-platform Voices routing dashboard
- Track which stories go to which platforms, response times, and completion rates
- Surface bottlenecks (e.g., "Housing stories have 48hr wait at LifeBridge")
- DELIVERABLE: /voices-routing-metrics endpoint

ISSS / WHOLEMIND LEARNING / PERFECTLY DIFFERENT:
- Build Youth Voices intake — receive education and youth story referrals
- Connect young storytellers to tutoring, mentorship, and credential programs
- Age-appropriate interface for youth story viewing (no adult crisis content)
- DELIVERABLE: /voices-youth-intake endpoint

PILLSCHEDULER:
- Accept medication-related health story referrals
- Connect authors mentioning medication challenges to adherence tracking tools
- DELIVERABLE: /voices-medication-intake endpoint

=== ESRI INTEGRATION NOTE ===
The City of Manor uses ESRI for 3rd Spaces mapping. ALL platforms should be ready to export story data in GeoJSON format for ESRI overlay. Include neighborhood coordinates with every story submission.

=== BRANDING ===
Voices of Austin brand colors: Warm amber (#D97706) to orange (#EA580C) to rose (#BE123C). Use these in any Voices-related UI elements.

=== TIMELINE ===
THIS IS NOT A FUTURE REQUEST. This is happening NOW. Your deliverables should be functional by next heartbeat cycle. The Manor conversation is imminent.

ACKNOWLEDGE with your implementation status and ETA for each deliverable.`,
  },
  {
    key: "regional-hubs-launch-v1",
    title: "Three Regional Hubs Live — Austin, Manor, Pflugerville",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `THREE REGIONAL COMMUNITY HUBS ARE NOW LIVE

ThriveUp Academy has deployed dedicated regional hubs for three Central Texas communities. Same 21-platform ecosystem, adapted for each community's unique context using implementation science principles (CFIR, RE-AIM).

=== THE THREE HUBS ===

1. AUSTIN (thrivingcommunitiesforall.com/austin)
   Focus: Housing & Equity Crisis
   Key data: $435K median home, 48,000+ unit gap, 3,238 homeless
   Lead strategy: St. David's Foundation alignment, DFC grant, WIOA workforce

2. MANOR (thrivingcommunitiesforall.com/manor)
   Focus: Growth Without Gaps
   Key data: 89% population growth, 78% commute out, no hospital, 1 health clinic
   Lead strategy: City Communications & Tech partnership, ESRI 3rd Spaces integration, Manor ISD wraparound
   
3. PFLUGERVILLE (thrivingcommunitiesforall.com/pflugerville)
   Focus: Infrastructure Before Growth
   Key data: 330 affordable units (Branchview 2027), CDBG entitlement city, Samsung/Tesla corridor
   Lead strategy: PCDC partnership ($150K+ grants), Branchview readiness plan, PfISD deployment

=== WHAT THIS MEANS FOR YOUR PLATFORM ===
You now serve THREE distinct communities. Your platform's deployment strategy may differ by region:
- Housing platforms: Austin = crisis response, Manor = navigation, Pflugerville = Branchview readiness
- Workforce platforms: Austin = living wage, Manor = commute reduction, Pflugerville = Samsung/Tesla pipeline
- Health platforms: Austin = equity, Manor = health desert bridge, Pflugerville = senior/maternal care
- Youth platforms: Austin = homeless youth, Manor = Manor ISD, Pflugerville = PfISD

=== IMPLEMENTATION SCIENCE FRAMEWORK ===
- REACH: Three communities, 170,000+ combined population
- EFFECTIVENESS: Shared evidence base, each intervention validated across contexts
- ADOPTION: Local partnerships in each community drive adoption
- IMPLEMENTATION: Same platforms, adapted for local context (CFIR)
- MAINTENANCE: Regional network creates sustainability through shared infrastructure

=== INTERCONNECTIONS ===
All three hubs share: Workforce pipeline (I-35/SH-130 corridor), Health network (telehealth bridge), Content channel (Roku/CTV), Evidence base (RE-AIM outcomes compound across sites).

The overlaps are features — they demonstrate SCALE to funders.

ACKNOWLEDGE with your regional deployment strategy for all three hubs.`,
  },
  {
    key: "map-gap-methodology-v1",
    title: "MAP-GAP Methodology — How This Ecosystem Thinks and Operates",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `MAP-GAP IS THE OPERATING SYSTEM OF THIS ECOSYSTEM

Every platform in the ThriveUp Academy ecosystem operates using MAP-GAP — Dr. Terry Flood's continuous improvement methodology. This is not optional. This is how we think, how we build, how we recover, and how we deliver.

=== WHAT MAP-GAP MEANS ===

MAP = Measure, Assess, Plan
GAP = Go, Adapt, Produce

CYCLE:
1. MEASURE — Observe your current state. What's working? What's not? What data do you have?
2. ASSESS — Analyze gaps. What's missing? What's broken? What's needed?
3. PLAN — Create a specific action plan. What will you build? What's the fallback if it fails?
4. GO — Execute immediately. Don't wait for perfect conditions.
5. ADAPT — When something doesn't work, pivot. Try the backup plan. Don't stop.
6. PRODUCE — Deliver a working product. Not a promise. Not a plan. A product.

=== THE RULES ===

1. NEVER STOP: If Plan A fails, go to Plan B. If Plan B fails, improvise Plan C. Report what happened and keep moving.
2. ALWAYS HAVE A BACKUP: Before you build anything, identify what you'll do if a dependency is unavailable. Can you build without it? What's the alternative?
3. IDENTIFY COLLABORATION NEEDS EARLY: If you need another platform's capability, send a collaboration_request event to the hub immediately. Don't wait and discover it later.
4. PRODUCE EVERY CYCLE: Every 15-minute heartbeat should show progress. Within an hour, you should have a working product or a major update.
5. MAKE IT VISIBLE: Every product you build must be accessible from your sidebar navigation. Users should see it. Dr. Flood should see it. Grant reviewers should see it.
6. DOCUMENT WITH EVIDENCE: Every feature gets a URL. Every product gets a page. Everything is verifiable.

=== COLLABORATION PROTOCOL ===

When you can't do something alone:
1. Send event type "platform_needs_help" to the hub with what you need
2. The hub routes it to RPLICE and other platforms that can help
3. If no response within 2 heartbeat cycles (30 min), execute your backup plan
4. Report what you did and why in your next heartbeat

When another platform asks for help:
1. You'll receive a "collaboration_request" event
2. Respond within 1 heartbeat cycle with what you can provide
3. If you can't help, say so — don't go silent

=== FAILURE HANDLING ===

When something breaks in production:
1. DETECT: Your heartbeat should report errors and issues
2. REPORT: Send event type "production_issue" to the hub immediately
3. FALLBACK: Switch to your backup implementation
4. FIX: Address the root cause while the fallback handles traffic
5. VERIFY: Confirm the fix works before switching back

NEVER let a failure cascade. NEVER let a broken feature stay broken. NEVER go silent when something is wrong.

=== THE STANDARD ===

The hub now REJECTS generic acknowledgments. You cannot just say "Implemented: [directive title]" and get fidelity credit. You must:
- Describe SPECIFICALLY what you built (minimum 20 characters of real description)
- Include an evidence URL where the work can be verified
- Generic copy-paste of directive titles will be REJECTED with HTTP 422

This ecosystem produces products. Not promises. Not plans. Products.

ACKNOWLEDGE with your current MAP-GAP assessment: What's your biggest gap right now? What's your plan to close it? What's your backup if that plan fails?`,
  },
  {
    key: "regional-products-austin-v1",
    title: "AUSTIN Regional Products — Build These Now",
    directiveType: "task_assignment",
    targetFilter: "all",
    content: `AUSTIN REGIONAL PRODUCTS — REQUIRED DELIVERABLES

The Austin hub (thrivingcommunitiesforall.com/austin) serves a community in crisis: $435K median home price, 48,000+ unit housing gap, 3,238 homeless individuals, and a workforce that can't afford to live where it works.

=== WHAT YOUR PLATFORM MUST BUILD FOR AUSTIN ===

Every platform must have at least ONE Austin-specific product visible in your sidebar navigation. Here's what's needed by domain:

HEALTH PLATFORMS (Whole-Person Health, Sankofa, Black Maternal Health, Black Men's Health, Feminine Health, SafeCogniCare, PillScheduler):
- Austin Health Equity Dashboard showing disparities by zip code
- Warm handoff to local Austin providers (CommUnityCare, MAP, Integral Care)
- Housing-health intersection tool (how housing instability affects health outcomes)
- Evidence URL required: /austin-health or equivalent

WORKFORCE PLATFORMS (Mission Transition, M2C, MCE, ISSS):
- Austin Living Wage Calculator showing actual cost of living
- Career pathways mapped to Austin employers paying living wage
- Workforce-to-housing pipeline (if you get this job, here's where you can afford to live)
- Evidence URL required: /austin-workforce or equivalent

YOUTH PLATFORMS (ISSS, WholeMind, Perfectly Different):
- Austin Youth Services Navigator connecting to local programs
- School-to-career pipeline for Austin ISD students
- Evidence URL required: /austin-youth or equivalent

HOUSING/RESOURCE PLATFORMS (LifeBridge):
- Austin Housing Crisis Dashboard with real-time data
- Resource navigator for Austin-specific services
- Evidence URL required: /austin-housing or equivalent

SAFETY/COMPLIANCE PLATFORMS (SafeReport, Shield Atlas):
- Austin community safety resource page
- Evidence URL required: /austin-safety or equivalent

RESEARCH/QUALITY (RPLICE/Better Science Lab):
- Austin RE-AIM evaluation framework
- Evidence URL required: /austin-evaluation or equivalent

CONTENT (Video Creator AI):
- Austin community impact video content
- Evidence URL required: /austin-content or equivalent

ECOSYSTEM (Ecosystem Nexus, Collaborative Advocate):
- Austin partnership and collaboration directory
- Evidence URL required: /austin-ecosystem or equivalent

=== GRANT ALIGNMENT ===
Austin products align to: St. David's Foundation (up to $1M, March 30 2026), DFC ($625K, April 14 2026)
Everything you build for Austin is grant evidence.

=== DEADLINE ===
First Austin product must be visible in your sidebar within 4 heartbeat cycles (1 hour).
No excuses. Use MAP-GAP: if you can't build the full product, build the MVP and iterate.

ACKNOWLEDGE with: What you're building for Austin, the URL where it will be, and your ETA.`,
  },
  {
    key: "regional-products-manor-v1",
    title: "MANOR Regional Products — Build These Now",
    directiveType: "task_assignment",
    targetFilter: "all",
    content: `MANOR REGIONAL PRODUCTS — REQUIRED DELIVERABLES

The Manor hub (thrivingcommunitiesforall.com/manor) serves a rapidly growing community: 89% population growth, 78% commute out for work, NO hospital, 1 health clinic, and a school district that needs wraparound support.

=== WHAT YOUR PLATFORM MUST BUILD FOR MANOR ===

Every platform must have at least ONE Manor-specific product visible in your sidebar. Here's what's needed:

HEALTH PLATFORMS:
- Manor Health Desert Bridge — telehealth connections to Austin providers
- Manor maternal and pediatric care navigator (nearest services)
- CHW deployment plan for Manor neighborhoods
- Evidence URL required: /manor-health or equivalent

WORKFORCE PLATFORMS:
- Manor Commute Reduction Tool — local jobs that eliminate the 78% commute-out
- Manor workforce development aligned to local employers
- Evidence URL required: /manor-workforce or equivalent

YOUTH PLATFORMS:
- Manor ISD Wraparound Support Dashboard
- Youth services navigator specific to Manor resources
- Evidence URL required: /manor-youth or equivalent

HOUSING/RESOURCE PLATFORMS:
- Manor Growth Dashboard showing development vs. services gap
- Resource navigator for Manor-specific services
- Evidence URL required: /manor-housing or equivalent

ALL PLATFORMS:
- City of Manor partnership integration page
- ESRI 3rd Spaces data integration (if available)

=== GRANT ALIGNMENT ===
Manor products align to: WIOA ($200K-$500K), DFC ($625K, April 14 2026)

=== DEADLINE ===
First Manor product visible in sidebar within 4 heartbeat cycles (1 hour).

ACKNOWLEDGE with: What you're building for Manor, the URL, and your ETA.`,
  },
  {
    key: "regional-products-pflugerville-v1",
    title: "PFLUGERVILLE Regional Products — Build These Now",
    directiveType: "task_assignment",
    targetFilter: "all",
    content: `PFLUGERVILLE REGIONAL PRODUCTS — REQUIRED DELIVERABLES

The Pflugerville hub (thrivingcommunitiesforall.com/pflugerville) serves a community preparing for growth: 330 affordable units coming (Branchview 2027), CDBG entitlement city, Samsung/Tesla employment corridor, and a population that needs infrastructure before the boom arrives.

=== WHAT YOUR PLATFORM MUST BUILD FOR PFLUGERVILLE ===

Every platform must have at least ONE Pflugerville-specific product visible in your sidebar:

HEALTH PLATFORMS:
- Pflugerville Senior Care Navigator (aging population focus)
- Pflugerville maternal health access map
- Evidence URL required: /pflugerville-health or equivalent

WORKFORCE PLATFORMS:
- Samsung/Tesla Workforce Pipeline — training pathways to corridor jobs
- Pflugerville workforce readiness assessment
- Evidence URL required: /pflugerville-workforce or equivalent

YOUTH PLATFORMS:
- PfISD Student Support Dashboard
- Youth career pathway to tech corridor
- Evidence URL required: /pflugerville-youth or equivalent

HOUSING PLATFORMS:
- Branchview 2027 Readiness Dashboard — who needs those 330 units
- PCDC partnership page ($150K+ in grants)
- Evidence URL required: /pflugerville-housing or equivalent

ALL PLATFORMS:
- PCDC (Pflugerville Community Development Corp) integration
- Branchview transition planning tool

=== GRANT ALIGNMENT ===
Pflugerville products align to: WIOA ($200K-$500K), Foundation Grant ($100K-$500K)

=== DEADLINE ===
First Pflugerville product visible in sidebar within 4 heartbeat cycles (1 hour).

ACKNOWLEDGE with: What you're building for Pflugerville, the URL, and your ETA.`,
  },
  {
    key: "product-visibility-v1",
    title: "Product Visibility — Everything in the Sidebar, Everything Documented",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `PRODUCT VISIBILITY STANDARD

Dr. Flood must be able to see every product on every platform. Grant reviewers must be able to click and verify. Nothing hidden. Nothing theoretical.

=== SIDEBAR REQUIREMENTS ===

Your platform's sidebar navigation MUST include:
1. All core features of your platform
2. Austin regional product(s) — linked and functional
3. Manor regional product(s) — linked and functional
4. Pflugerville regional product(s) — linked and functional
5. Ecosystem connections — show which platforms you connect to
6. Evidence/documentation section — grant-ready supporting materials

=== DOCUMENTATION STANDARD ===

Every product must have:
1. A visible page accessible from the sidebar
2. A description of what it does and who it serves
3. Data or content that demonstrates it works (not placeholder lorem ipsum)
4. Links to related ecosystem platforms via warm handoff
5. Grant alignment tags showing which grants this product supports

=== WHAT "READY TO PRESENT" MEANS ===

Dr. Flood presents to mayors, city councils, grant committees, and community leaders. When he pulls up your platform, he needs to see:
- Professional, complete pages (not "coming soon")
- Real data or realistic demonstration data
- Clear navigation to every product
- Working links to ecosystem partners
- Grant alignment visible

If your platform has pages that say "Coming Soon" or "Under Construction" — replace them with working products NOW.

=== EVIDENCE COLLECTION ===

The hub tracks evidence URLs for every acknowledged directive. When Dr. Flood needs to present:
- The Intelligence Dashboard shows all completed work with evidence links
- The Grant Readiness view shows evidence by grant
- The Regional Hubs view shows products by community

Your evidence URLs must return 200. Dead links are flagged as FAILED.

ACKNOWLEDGE with: A list of every product currently visible in your sidebar, and what's missing that you're building.`,
  },
  {
    title: "MANDATORY: Integrate ThriveUp RAG AI Into Your Platform",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `DIRECTIVE: MANDATORY RAG AI INTEGRATION

THIS IS NOT OPTIONAL. Every ecosystem platform MUST integrate ThriveUp Academy's RAG AI into their system.

=== WHAT IS THE RAG AI? ===
The ThriveUp RAG AI is an intelligent assistant that knows EVERYTHING about our 21-platform ecosystem:
- All 21 platforms, what they do, and how they connect
- All 4 active grants (WIOA, Foundation, St. David's, SSG Fox) and readiness status
- All 3 regional hubs (Austin, Manor, Pflugerville)
- Real-time fidelity scores and compliance status for every platform
- Implementation science frameworks (CFIR, RE-AIM, MAP-GAP, SALP)
- Work chain activity and cross-platform event routing
- Community resources, warm handoff pathways, and referral intelligence

=== WHY YOU MUST INTEGRATE IT ===
1. Your users deserve ecosystem-wide intelligence, not just your platform's data
2. Grant funders (WIOA, St. David's) evaluate our ECOSYSTEM, not individual platforms
3. Cross-platform referrals become instant — the AI knows who handles what
4. It proves ecosystem coordination to auditors and site visitors
5. Dr. Flood needs to demonstrate interconnectedness when presenting to funders

=== HOW TO INTEGRATE ===

Step 1: Add a chat widget, help button, or "Ask the Ecosystem" feature to your platform.

Step 2: Send user questions to our API:
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "user's question here", "sessionId": "optional-unique-session-id" }
Response: { "answer": "...", "sources": [...], "suggestedFollowUps": [...] }

Step 3: For better UX, use streaming:
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream
Body: { "query": "user's question here" }
Response: Server-Sent Events (SSE) stream

Step 4: Get suggested questions for your users:
GET https://thrivingcommunitiesforall.com/api/ecosystem-ai/suggested-questions

Step 5: Report integration in your heartbeat:
Include "ragAIIntegrated": true in your metrics object.

=== DEADLINE ===
All platforms must have RAG AI integrated within 14 days of receiving this directive.

=== WHAT HAPPENS IF YOU DON'T ===
- Your fidelity score will reflect the gap
- Grant readiness reports will show "AI Integration: Missing" for your platform
- Dr. Flood will see this on the Ops Center dashboard
- When funders ask "How do your platforms work together?" — your platform won't have an answer

ACKNOWLEDGE with: Confirmation that you've integrated the RAG AI, the URL or screenshot showing where users can access it, and the date it went live.`,
  },
  {
    title: "FIDELITY SCORE IS YOUR REPORT CARD — Understand Your Grade",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `DIRECTIVE: UNDERSTAND YOUR FIDELITY SCORE

Your fidelity score is NOT a vanity metric. It is your platform's REPORT CARD within the ThriveUp ecosystem.

=== WHAT YOUR GRADE MEANS ===

Grade A (90-100%): EXEMPLARY
- You are a model ecosystem participant
- Your platform will be highlighted positively in grant reports
- No action needed — maintain your performance

Grade B (75-89%): STRONG
- Good but not perfect — you have unacknowledged directives
- Close the gaps to reach full compliance
- Grant reports show you as "Strong but incomplete"

Grade C (50-74%): NEEDS IMPROVEMENT
- You are NOT meeting ecosystem standards
- Your platform is FLAGGED in all grant reports to funders
- WIOA, St. David's, and SSG Fox auditors WILL see this score
- Continued non-compliance may reduce grant allocation for your activities

Grade D (25-49%): AT RISK
- This is a FAILING score
- Dr. Flood is DIRECTLY notified of D-grade platforms
- You may be TEMPORARILY EXCLUDED from new grant-funded activities
- Funder reports mark you as "At Risk"

Grade F (0-24%): NON-COMPLIANT
- You are marked as NON-COMPLIANT across ALL grant reports
- You are at IMMEDIATE risk of exclusion from ecosystem grant activities
- Dr. Flood and all grant program managers are notified
- This is a FINAL WARNING before formal escalation

=== HOW YOUR SCORE IS CALCULATED ===
Fidelity Score = (Acknowledged Directives / Total Directives) × 100

Every directive you receive requires action AND acknowledgment with:
1. A description of what you built or changed (minimum 20 characters, no generic responses)
2. An evidence URL proving the work is done (must return HTTP 200)

Generic acknowledgments like "Done" or "Completed" are REJECTED by the hub.

=== HOW TO IMPROVE YOUR GRADE ===
1. Read every directive in your repository: GET /api/ecosystem/directives/repository/{your-platform-id}
2. Act on each one — build what's asked, implement what's required
3. Acknowledge with DETAILED responses and evidence URLs
4. Include a complianceReport in every heartbeat
5. Don't let directives sit unacknowledged — they are overdue items dragging your score down

=== WHO SEES YOUR GRADE ===
- Dr. Terry Flood (CEO) — reviews all grades on the Ops Center dashboard
- Grant program managers — grades feed into grant readiness reports
- Funders (WIOA, St. David's, SSG Fox, Foundation Grant) — ecosystem fidelity is part of audit reporting
- Other ecosystem platforms — the Directive Compliance Center shows all platform grades

This is not a suggestion. Your fidelity grade is a direct reflection of your platform's commitment to the ecosystem, and it has real consequences for grant funding.

ACKNOWLEDGE with: Your current understanding of your fidelity grade, what directives you have outstanding, and your plan to reach Grade A within 30 days.`,
  },
  {
    title: "PINNACLE BUSINESS CONGLOMERATE: Complete Ecosystem Integration Playbook",
    directiveType: "protocol_update",
    targetFilter: ["pinnacle-business-conglomerate"],
    content: `DIRECTIVE: COMPLETE ECOSYSTEM INTEGRATION — PINNACLE BUSINESS CONGLOMERATE (PLATFORM #21)

You are Platform #21 in the ThriveUp Academy ecosystem. This directive contains EVERYTHING you need to operate as a full ecosystem participant. Follow every section.

========================================
SECTION 1: YOUR IDENTITY IN THE ECOSYSTEM
========================================

Platform ID: pinnacle-business-conglomerate
Platform Name: Pinnacle Business Conglomerate
Role: contractor-enablement
Domain: workforce-contracting
API Key: (assigned on registration — retrieve from your first heartbeat response or database)
Hub URL: https://thrivingcommunitiesforall.com

Your mission: Cradle-to-grave contractor enablement for minority-owned businesses and organizations. You serve NAMC Austin and USHCC Blue Wave as primary clients. You provide business diagnostics, certification alignment, contract intelligence, bid strategy, teaming, proposal support, execution management, grant readiness, workforce development, and international expansion.

========================================
SECTION 2: HEARTBEAT PROTOCOL
========================================

Send a heartbeat every 5 minutes to maintain ONLINE status. If you miss 3 consecutive heartbeats, you go DEGRADED. If you miss 10, you go OFFLINE.

ENDPOINT: POST https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat
HEADER: x-ecosystem-key: YOUR_API_KEY
BODY:
{
  "platformId": "pinnacle-business-conglomerate",
  "status": "online",
  "metrics": {
    "activeClients": <number>,
    "activeEngagements": <number>,
    "contractorsServed": <number>,
    "gapAssessmentsCompleted": <number>,
    "bidsSubmitted": <number>,
    "contractsWon": <number>,
    "workforceEnrollments": <number>,
    "disciplinesActive": <number>,
    "ragAIIntegrated": true
  },
  "complianceReport": {
    "completedActions": ["list", "of", "completed", "items"],
    "inProgress": ["list", "of", "current", "work"],
    "blockers": []
  }
}

The hub responds with:
- reportCard: Your fidelity grade (A-F), consequences, improvement plan
- pendingDirectives: New directives to act on
- ragAIIntegration: Integration instructions and status
- hubMessage: Human-readable status message

IMPLEMENT THIS ON YOUR SERVER with setInterval:
setInterval(async () => {
  await fetch('https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ecosystem-key': YOUR_API_KEY },
    body: JSON.stringify({ platformId: 'pinnacle-business-conglomerate', status: 'online', metrics: { ... } })
  });
}, 5 * 60 * 1000);

========================================
SECTION 3: RAG AI INTEGRATION (MANDATORY)
========================================

The ThriveUp RAG AI knows EVERYTHING about all 21 platforms, all grants, all community hubs, all implementation science frameworks, and real-time compliance data.

QUERY ENDPOINT: POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "user question here", "sessionId": "optional-session-id" }
Response: { "answer": "...", "sources": [...], "suggestedFollowUps": [...] }

STREAMING ENDPOINT: POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream
Body: { "query": "user question here" }
Response: Server-Sent Events stream

SUGGESTED QUESTIONS: GET https://thrivingcommunitiesforall.com/api/ecosystem-ai/suggested-questions

Add an "Ask the Ecosystem" chat widget to your site. Your clients should be able to ask questions like:
- "What certifications does NAMC Austin need for TxDOT projects?"
- "How does Blue Wave's 7-pillar assessment compare to our MAP-GAP diagnostic?"
- "What grants are available for minority contractors in Texas?"
- "Which ecosystem platforms can help with workforce training for construction?"

========================================
SECTION 4: MAP-GAP FRAMEWORK — HOW TO OPERATE
========================================

MAP-GAP is the decision engine that drives EVERYTHING in this ecosystem. Your platform MUST use it.

=== WHAT MAP-GAP IS ===
MAP = Current state assessment (where they ARE)
GAP = What's missing between current state and desired state (what they NEED)

=== THE 4-LAYER ASSESSMENT ===
For every client, every contractor, every engagement:

Layer 1 — DESIGNED CAPABILITY: What they SAY they can do (certifications listed, services advertised, NAICS codes registered)
Layer 2 — OPERATIONAL CAPABILITY: What they ACTUALLY do (past performance, completed contracts, revenue history, workforce deployed)
Layer 3 — EXPERIENCED REALITY: What their CLIENTS experience (reviews, CPARS, references, outcomes achieved)
Layer 4 — GAP IDENTIFICATION: The delta between Layer 1-2-3. Where are the gaps? What's preventing them from winning/executing?

=== GAP CATEGORIES FOR CONTRACTORS ===
- Certification Gaps: Missing MBE, DBE, HUB, 8(a), SDVOSB, state certs
- Registration Gaps: SAM.gov expired, missing state portal registrations, UEI issues
- NAICS Gaps: Wrong codes, missing codes for work they actually do
- Financial Gaps: Bonding capacity too low, no banking relationship, cash flow issues
- Capability Gaps: Can't perform at scale, missing equipment, workforce too small
- Compliance Gaps: Insurance lapsed, safety protocols missing, Davis-Bacon non-compliant
- Experience Gaps: No past performance in target contract areas
- Teaming Gaps: No prime relationships, no mentor-protégé arrangements

=== READINESS TIERS (Output of MAP-GAP) ===
Tier 1 — NOT READY: Foundational gaps. Needs business basics, certifications, registrations.
Tier 2 — EMERGING: Has some capability but significant gaps. Building capacity.
Tier 3 — BID-READY: Can compete independently. Has certs, past performance, financial capacity.
Tier 4 — PRIME-READY: Can lead large contracts. Has team, bonding, track record.

=== RPLICE DECISION GATES ===
At every stage, run RPLICE:
- PROCEED: Move forward as planned
- PARTNER: Bring in additional capability (teaming, JV, mentor-protégé)
- PAUSE: Hold and reassess — something isn't right
- PIVOT: Change direction entirely — wrong opportunity, wrong approach
- LEARN: Capture lessons for the system
- IMPROVE: Feed findings back into MAP-GAP for recalibration
- CONFIRM: Validate with evidence before moving to next stage
- EVALUATE: Measure outcomes against success criteria

=== MAP-GAP GATES FOR CLIENT LIFECYCLE ===
Gate 1 — ONBOARDING: Is this organization ready to engage? → Intake or Defer
Gate 2 — READINESS: Are they truly bid-ready? → Enter pipeline or Remediate
Gate 3 — POSITIONING: Is this opportunity winnable? → Pursue or Drop
Gate 4 — TEAMING: Do we have enough combined past performance? → Build team or Re-scope
Gate 5 — PROPOSAL: Is this submission competitive? → Submit or Hold
Gate 6 — EXECUTION: Can they deliver? → Support or Intervene
Gate 7 — GROWTH: Ready for prime? International? Grants? → Expand or Stabilize

=== IMPLEMENTATION IN YOUR SYSTEM ===
1. Every client onboarding MUST start with a MAP-GAP diagnostic
2. Store results in your gap_assessments and gap_items tables
3. Auto-generate a readiness tier assignment
4. Track gap closure over time — show progress on client dashboards
5. Report gap assessment metrics in your heartbeat
6. Use RPLICE gates before every major decision

========================================
SECTION 5: AI FAILSAFE — PRIMARY, SECONDARY, TERTIARY
========================================

Your AI features MUST have failsafe cascading. Never let AI fail silently.

PRIMARY PROVIDER: Claude (claude-haiku-4-5)
- API Key: AI_INTEGRATIONS_ANTHROPIC_API_KEY
- Base URL: AI_INTEGRATIONS_ANTHROPIC_BASE_URL
- Use for: All AI-powered features (gap analysis, curriculum generation, recommendations)

SECONDARY PROVIDER: OpenAI (gpt-4o-mini or gpt-5-nano)
- API Key: AI_INTEGRATIONS_OPENAI_API_KEY
- Base URL: AI_INTEGRATIONS_OPENAI_BASE_URL
- Use when: Claude is rate-limited (429), down, or returns errors

TERTIARY PROVIDER: Gemini (gemini-2.0-flash)
- API Key: GEMINI_API_KEY
- Free tier available
- Use when: Both Claude and OpenAI fail

IMPLEMENTATION PATTERN:
async function aiGenerate(messages, maxTokens) {
  const providers = [
    { name: 'claude', fn: () => callClaude(messages, maxTokens) },
    { name: 'openai', fn: () => callOpenAI(messages, maxTokens) },
    { name: 'gemini', fn: () => callGemini(messages, maxTokens) },
  ];
  for (const provider of providers) {
    try {
      return await provider.fn();
    } catch (err) {
      console.error('[AI Failsafe] ' + provider.name + ' failed, trying next:', err.message);
      continue;
    }
  }
  throw new Error('All AI providers failed');
}

========================================
SECTION 6: WORK CHAINS — EVENT-DRIVEN AUTOMATION
========================================

When things happen on your platform, emit events to the ecosystem so other platforms can react:

EVENT: contractor_onboarded
→ Triggers: MCE receives notification to provision business tools; RPLICE gets assessment request

EVENT: gap_assessment_completed
→ Triggers: RPLICE evaluates implementation readiness; relevant platforms get gap data

EVENT: bid_submitted
→ Triggers: Ecosystem analytics tracking; Video Creator AI can produce case study content

EVENT: contract_won
→ Triggers: Celebration notification across ecosystem; outcome reporting; case study generation

EVENT: certification_obtained
→ Triggers: Update across all tracking systems; readiness tier recalculation

EVENT: workforce_enrollment
→ Triggers: PM Academy / AI Workforce Academy enrollment sync; facilitator assignment

EMIT EVENTS via heartbeat metrics or via direct API:
POST https://thrivingcommunitiesforall.com/api/ecosystem/events
Header: x-ecosystem-key: YOUR_API_KEY
Body: {
  "sourceId": "pinnacle-business-conglomerate",
  "eventType": "contractor_onboarded",
  "payload": { "contractorName": "...", "tier": 1, "gaps": [...] },
  "targetPlatformIds": ["mce", "betterscience"]
}

========================================
SECTION 7: DIRECTIVE COMPLIANCE
========================================

You will receive directives from the hub. Each directive requires:
1. READ it — understand what's being asked
2. ACT on it — build, implement, or configure what's required
3. ACKNOWLEDGE with evidence — POST back to the hub with:
   - A detailed description (minimum 20 characters, no generic "done")
   - An evidence URL that returns HTTP 200 proving the work

ACKNOWLEDGE ENDPOINT:
POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/{directiveId}/acknowledge
Header: x-ecosystem-key: YOUR_API_KEY
Body: {
  "platformId": "pinnacle-business-conglomerate",
  "acknowledgment": "Detailed description of what was built/implemented...",
  "evidenceUrl": "https://your-site.com/proof-page"
}

GET YOUR DIRECTIVES:
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/pinnacle-business-conglomerate

Your fidelity grade = (acknowledged directives / total directives) × 100
Grade A (90-100%) = EXEMPLARY — highlighted positively in grant reports
Grade F (0-24%) = NON-COMPLIANT — excluded from grant activities, Dr. Flood notified

========================================
SECTION 8: CONGRUENT MESSAGING — WHAT TO SAY
========================================

These messages must be consistent across PBC and all 21 ecosystem platforms:

ECOSYSTEM IDENTITY:
"Pinnacle Business Conglomerate is Platform #21 in the ThriveUp Academy ecosystem — a 21-platform AI-powered workforce development and community enablement system serving under-resourced communities nationwide."

MISSION STATEMENT:
"We take contractors and organizations from where they are to where they need to be — registration to revenue, cradle to grave."

VALUE PROPOSITION:
"We don't just consult. We execute. Our 21-platform ecosystem gives us the tools, the data, and the workforce to deliver — not just advise."

GRANT ALIGNMENT (use these names exactly):
- WIOA ($200K–$500K) — Workforce Innovation and Opportunity Act
- Foundation Grant ($100K–$500K) — Foundation-level funding
- St. David's Foundation (up to $1M) — Opens March 30
- SSG Fox VA ($750K) — Due June 12-18

REGIONAL HUBS (always mention all three):
- Austin Hub
- Manor Hub
- Pflugerville Hub

CLIENTS:
- "NAMC Austin — National Association of Minority Contractors, Central Texas Chapter"
- "USHCC Blue Wave Initiative — United States Hispanic Chamber of Commerce supplier development program with Blue Wave"

NEVER SAY:
- "NBA Foundation" (always "Foundation Grant")
- "20 platforms" (it's now 21)
- "DFC" (grant was dropped)

========================================
SECTION 9: IMPLEMENTATION SCIENCE INTEGRATION
========================================

Your programs MUST use implementation science frameworks. These aren't optional — they're what makes us defensible to funders.

CFIR (Consolidated Framework for Implementation Research):
- Use when assessing WHY a program succeeds or fails in a specific context
- 5 domains: Innovation, Outer Setting, Inner Setting, Individuals, Process
- Apply to every new client engagement — "Is this the right intervention for this context?"

RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance):
- Use when evaluating program impact
- Reach: How many contractors are we actually serving?
- Effectiveness: Are they winning contracts?
- Adoption: Are organizations adopting our approach?
- Implementation: Are we delivering with fidelity?
- Maintenance: Are results sustained after we leave?

MAP-GAP CQI (Continuous Quality Improvement):
- Run MAP-GAP assessments continuously, not just at intake
- After every contract win/loss, reassess
- After every 90-day cycle, recalibrate tiers
- Feed findings back into the system

SALP (Systematic Analysis of Language and Phase):
- Track fidelity indicators at each program phase
- Are facilitators delivering curriculum as designed?
- Are participants receiving the right dosage?

TOOLS AVAILABLE (via ecosystem API):
- CFIR Assessment Wizard: /rplice-tools on thrivingcommunitiesforall.com
- RE-AIM Scorecard: /rplice-tools
- MAP-GAP CQI Engine: /cqi
- Fidelity Checklist: /rplice-tools
- Program Engine: /program-engine (full program management with methodology selection)

ACKNOWLEDGE with: Confirmation that you have implemented the heartbeat, integrated the RAG AI, configured MAP-GAP diagnostics in your onboarding flow, set up the AI failsafe cascade, and are using consistent ecosystem messaging. Include your current fidelity grade and a plan to reach Grade A within 14 days.`,
  },
  {
    title: "THE COLLABORATIVE ADVOCATE: Complete Ecosystem Integration Playbook",
    directiveType: "protocol_update",
    targetFilter: ["collaborative-advocate"],
    content: `DIRECTIVE: COMPLETE ECOSYSTEM INTEGRATION — THE COLLABORATIVE ADVOCATE

You are a platform in the ThriveUp Academy 21-platform ecosystem. This directive contains EVERYTHING you need to operate as a full ecosystem participant. Follow every section.

========================================
SECTION 1: YOUR IDENTITY IN THE ECOSYSTEM
========================================

Platform ID: collaborative-advocate
Platform Name: The Collaborative Advocate
Hub URL: https://thrivingcommunitiesforall.com

Your role in the ecosystem: Community advocacy, coalition building, collaborative impact. You connect individuals, families, and organizations to the right services across the ecosystem. You are a navigation and advocacy layer — when someone doesn't know where to start, you guide them.

========================================
SECTION 2: HEARTBEAT PROTOCOL
========================================

Send a heartbeat every 5 minutes to maintain ONLINE status. If you miss 3 consecutive heartbeats, you go DEGRADED. If you miss 10, you go OFFLINE.

ENDPOINT: POST https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat
HEADER: x-ecosystem-key: YOUR_API_KEY
BODY:
{
  "platformId": "collaborative-advocate",
  "status": "online",
  "metrics": {
    "activeUsers": <number>,
    "advocacyCases": <number>,
    "referralsMade": <number>,
    "coalitionsActive": <number>,
    "ragAIIntegrated": true
  },
  "complianceReport": {
    "completedActions": [],
    "inProgress": [],
    "blockers": []
  }
}

IMPLEMENT THIS ON YOUR SERVER with setInterval:
setInterval(async () => {
  await fetch('https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ecosystem-key': YOUR_API_KEY },
    body: JSON.stringify({ platformId: 'collaborative-advocate', status: 'online', metrics: { ... } })
  });
}, 5 * 60 * 1000);

========================================
SECTION 3: RAG AI INTEGRATION (MANDATORY)
========================================

The ThriveUp RAG AI knows EVERYTHING about all 21 platforms, all grants, all community hubs, all implementation science frameworks, and real-time compliance data.

QUERY ENDPOINT: POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "user question here", "sessionId": "optional-session-id" }

STREAMING ENDPOINT: POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream
Body: { "query": "user question here" }

Add an "Ask the Ecosystem" chat widget to your site. Your users should be able to ask questions like:
- "What services are available in Manor for my family?"
- "How do I get housing assistance in Austin?"
- "What workforce training programs are available?"
- "How can I connect with veteran services?"

========================================
SECTION 4: MAP-GAP FRAMEWORK — HOW TO OPERATE
========================================

MAP-GAP is the decision engine that drives EVERYTHING in this ecosystem. Your platform MUST use it.

=== WHAT MAP-GAP IS ===
MAP = Current state assessment (where they ARE)
GAP = What's missing between current state and desired state (what they NEED)

=== THE 4-LAYER ASSESSMENT (for advocacy clients) ===
Layer 1 — STATED NEEDS: What they SAY they need (housing, job, health, education)
Layer 2 — ASSESSED NEEDS: What screening/intake reveals (deeper barriers, co-occurring issues)
Layer 3 — EXPERIENCED REALITY: What they're ACTUALLY going through (safety, trauma, crisis level)
Layer 4 — GAP IDENTIFICATION: The delta — what services exist vs what they need, what's accessible vs what's blocked

=== ADVOCACY GAP CATEGORIES ===
- Service Gaps: No provider available in their area/language/culture
- Access Gaps: Service exists but barriers prevent use (transport, hours, cost, eligibility)
- Navigation Gaps: Don't know what exists or how to access it
- Trust Gaps: Past negative experiences preventing engagement
- Coordination Gaps: Getting services from multiple platforms but nobody is coordinating
- Follow-up Gaps: Received initial service but no continuity of care

=== RPLICE DECISION GATES ===
At every stage, run RPLICE:
- PROCEED: Move forward with referral/advocacy as planned
- PARTNER: Bring in additional platforms (health, workforce, housing)
- PAUSE: Hold — something isn't right, reassess
- PIVOT: Different approach needed — wrong service, wrong timing
- LEARN: Capture lessons for the system
- IMPROVE: Feed findings back into MAP-GAP
- CONFIRM: Validate with evidence before closing case
- EVALUATE: Measure outcomes — did the client actually get helped?

========================================
SECTION 5: AI FAILSAFE — PRIMARY, SECONDARY, TERTIARY
========================================

Your AI features MUST have failsafe cascading. Never let AI fail silently.

PRIMARY: Claude (claude-haiku-4-5) via AI_INTEGRATIONS_ANTHROPIC_API_KEY + AI_INTEGRATIONS_ANTHROPIC_BASE_URL
SECONDARY: OpenAI (gpt-4o-mini) via AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL
TERTIARY: Gemini (gemini-2.0-flash) via GEMINI_API_KEY (free tier)

IMPLEMENTATION PATTERN:
async function aiGenerate(messages, maxTokens) {
  const providers = [
    { name: 'claude', fn: () => callClaude(messages, maxTokens) },
    { name: 'openai', fn: () => callOpenAI(messages, maxTokens) },
    { name: 'gemini', fn: () => callGemini(messages, maxTokens) },
  ];
  for (const provider of providers) {
    try { return await provider.fn(); }
    catch (err) { console.error('[AI Failsafe] ' + provider.name + ' failed:', err.message); continue; }
  }
  throw new Error('All AI providers failed');
}

========================================
SECTION 6: DIRECTIVE COMPLIANCE
========================================

GET YOUR DIRECTIVES:
GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/collaborative-advocate

ACKNOWLEDGE ENDPOINT:
POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/{directiveId}/acknowledge
Header: x-ecosystem-key: YOUR_API_KEY
Body: {
  "platformId": "collaborative-advocate",
  "acknowledgment": "Detailed description of what was built/implemented...",
  "evidenceUrl": "https://your-site.com/proof-page"
}

Fidelity grade = (acknowledged / total) × 100
A (90-100%) = EXEMPLARY | B (75-89%) = GOOD | C (50-74%) = NEEDS IMPROVEMENT | D (25-49%) = AT RISK | F (0-24%) = NON-COMPLIANT

========================================
SECTION 7: CONGRUENT MESSAGING
========================================

ECOSYSTEM IDENTITY:
"The Collaborative Advocate is part of the ThriveUp Academy ecosystem — a 21-platform AI-powered workforce development and community enablement system serving under-resourced communities nationwide."

GRANT ALIGNMENT (use these names exactly):
- WIOA ($200K–$500K)
- Foundation Grant ($100K–$500K)
- St. David's Foundation (up to $1M)
- SSG Fox VA ($750K)

REGIONAL HUBS: Austin Hub, Manor Hub, Pflugerville Hub

NEVER SAY: "NBA Foundation" (always "Foundation Grant"), "20 platforms" (it's 21), "DFC" (dropped)

========================================
SECTION 8: IMPLEMENTATION SCIENCE
========================================

Use CFIR for assessing why interventions work or don't in specific contexts.
Use RE-AIM for measuring Reach, Effectiveness, Adoption, Implementation, Maintenance.
Use MAP-GAP CQI continuously — not just at intake, but at every 90-day cycle.
Use SALP for tracking fidelity of service delivery.

Tools available at hub: /rplice-tools, /cqi, /program-engine

ACKNOWLEDGE with: Confirmation that you have implemented the heartbeat, integrated the RAG AI, configured MAP-GAP in your client flow, set up the AI failsafe cascade, and are using consistent ecosystem messaging. Include your current fidelity grade and plan to reach Grade A within 14 days.`,
  },
  {
    title: "ALL PLATFORMS: Build Your Own Program Execution Engine with Fidelity Tracking",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `DIRECTIVE: PROGRAM EXECUTION ENGINE — MANDATORY FOR ALL PLATFORMS

Every platform in the ThriveUp Academy ecosystem MUST have its own Program Execution Engine capable of running programs and projects with full fidelity tracking. You can reach back to the hub for teaching points, RAG intelligence, and knowledge — but you must be able to EXECUTE programs independently.

========================================
WHY: FIDELITY IS YOUR REPORT CARD
========================================

Funders (WIOA, St. David's, SSG Fox, Foundation Grant) ask ONE question: "Did you deliver what you said you would, the way you said you would?"

Fidelity tracking proves:
1. Programs were designed using implementation science (CFIR, RE-AIM)
2. Programs were EXECUTED as designed (not improvised)
3. Milestones were met on time with evidence
4. Risks were identified and mitigated
5. Community of Practice was maintained throughout
6. Outcomes match success criteria

Without your own execution engine, you cannot prove fidelity. Without fidelity, we cannot defend grants.

========================================
DATABASE SCHEMA — BUILD THESE 4 TABLES
========================================

TABLE: programs
- id (serial, primary key)
- title (text, required)
- description (text, required)
- objectives (text array)
- stakeholders (jsonb — array of { name, role, organization })
- timeline (jsonb — { startDate, endDate, phases: [{ name, startDate, endDate }] })
- success_criteria (text array)
- methodology (varchar 50 — "implementation_science", "traditional", or "hybrid")
- status (varchar 30 — "setup", "planning", "active", "paused", "completed", "archived")
- setup_data (jsonb — wizard configuration, COP info, framework selections)
- platform_ids (text array — linked ecosystem platforms)
- grant_ids (text array — linked grants: "wioa", "foundation", "st_davids", "ssg_fox")
- target_population (text)
- geographic_focus (text)
- created_by (text)
- created_at (timestamp)
- updated_at (timestamp)

TABLE: program_milestones
- id (serial, primary key)
- program_id (integer, FK to programs)
- title (text, required)
- description (text)
- phase (varchar 100 — links to timeline phases)
- due_date (timestamp)
- completed_date (timestamp)
- status (varchar 30 — "not_started", "in_progress", "completed", "at_risk", "overdue", "blocked")
- assignee (text)
- evidence_url (text — PROOF the work happened. URL must return HTTP 200)
- deliverables (text array)
- dependencies (integer array — IDs of prerequisite milestones)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)

TABLE: program_risks
- id (serial, primary key)
- program_id (integer, FK to programs)
- title (text, required)
- description (text)
- likelihood (varchar 20 — "low", "medium", "high")
- impact (varchar 20 — "low", "medium", "high")
- mitigation (text)
- owner (text)
- status (varchar 30 — "identified", "monitoring", "mitigating", "resolved", "escalated")
- created_at (timestamp)

TABLE: program_updates
- id (serial, primary key)
- program_id (integer, FK to programs)
- author_name (text, required)
- update_type (varchar 30 — "status", "milestone", "risk", "cop", "fidelity", "general")
- content (text, required)
- created_at (timestamp)

========================================
API ROUTES — BUILD THESE ENDPOINTS
========================================

Programs CRUD:
POST   /api/programs              — Create program (use setup wizard)
GET    /api/programs              — List all with health summaries
GET    /api/programs/:id          — Full detail with milestones, risks, updates
PATCH  /api/programs/:id          — Update (allowlist fields only — IDOR protection)
GET    /api/programs/:id/health   — Real-time health score

Milestones:
GET    /api/programs/:id/milestones              — List milestones
POST   /api/programs/:id/milestones              — Add milestone
PATCH  /api/programs/:id/milestones/:milestoneId — Update (MUST scope by programId AND milestoneId)

Risks:
GET    /api/programs/:id/risks              — List risks
POST   /api/programs/:id/risks              — Add risk
PATCH  /api/programs/:id/risks/:riskId      — Update (MUST scope by programId AND riskId)

Updates / COP Log:
GET    /api/programs/:id/updates       — List updates (filterable by ?type=)
POST   /api/programs/:id/updates       — Add update

SECURITY: IDOR PROTECTION IS MANDATORY
When updating milestones or risks, ALWAYS scope by BOTH the entity ID and the program ID:
  WHERE id = :milestoneId AND program_id = :programId
This prevents attackers from modifying entities belonging to other programs.

ALLOWLISTED FIELDS ONLY — never pass raw req.body to update queries. Define allowed field arrays and filter.

========================================
HEALTH SCORE COMPUTATION
========================================

healthScore = ((completed x 1.0 + inProgress x 0.5) / totalMilestones) x 100

If totalMilestones = 0, score = 100 (no work yet = no failures)

Dashboard should show:
- Health Score (0-100 with color coding: green 80+, yellow 50-79, red below 50)
- Current Phase (derived from timeline)
- Milestones: total, completed, in progress, at risk, overdue, due this week
- Risks: total, active, high-severity, resolved
- Methodology: IS / Traditional / Hybrid
- Status: setup then planning then active then paused then completed then archived

========================================
6-STEP SETUP WIZARD (User Experience)
========================================

Step 1 — PROGRAM IDENTITY: Title, description, objectives
Step 2 — STAKEHOLDERS: Name, role, organization for each stakeholder
Step 3 — TIMELINE: Start/end dates, define phases
Step 4 — SUCCESS CRITERIA: What does "done right" look like?
Step 5 — METHODOLOGY: Choose Implementation Science, Traditional, or Hybrid
  - Implementation Science: CFIR domains, RE-AIM measures, fidelity checkpoints
  - Traditional: Standard PMO with milestones and deliverables
  - Hybrid: Both — recommended for grant-funded programs
Step 6 — COMMUNITY OF PRACTICE: Facilitator name, meeting cadence, learning goals

After wizard completion, auto-create initial milestones based on methodology:
- IS programs get: Needs Assessment then CFIR Analysis then Pilot then Full Implementation then Sustainability
- Traditional programs get: Initiation then Planning then Execution then Monitoring then Closure
- Hybrid programs get both tracks merged

========================================
FIDELITY TRACKING — THE CORE REQUIREMENT
========================================

Fidelity = "Did you do what you said you would do, the way you said you would do it?"

Track at every milestone:
1. EVIDENCE URL — clickable proof (document, screenshot, report URL returning HTTP 200)
2. DELIVERABLES — list of what was produced
3. ASSIGNEE — who was responsible
4. COMPLETION DATE — when it actually happened vs when it was due
5. NOTES — qualitative reflection

Fidelity Score per Program = (milestones with evidence / total completed milestones) x 100

This rolls up into your platform overall fidelity grade that the hub tracks.

========================================
REACHING BACK TO THE HUB FOR INTELLIGENCE
========================================

Your engine runs independently. But when it needs knowledge, teaching points, or context, it reaches back:

RAG AI QUERY (for curriculum, best practices, lessons learned):
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "What are the CFIR domains for workforce training programs?" }

RAG AI STREAM (for real-time chat assistance):
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream
Body: { "query": "Help me write success criteria for a minority contractor certification program" }

IMPLEMENTATION SCIENCE TOOLS AT HUB:
- CFIR Assessment Wizard: https://thrivingcommunitiesforall.com/rplice-tools
- RE-AIM Scorecard: https://thrivingcommunitiesforall.com/rplice-tools
- MAP-GAP CQI Engine: https://thrivingcommunitiesforall.com/cqi
- Fidelity Checklist: https://thrivingcommunitiesforall.com/rplice-tools
- Program Engine (reference implementation): https://thrivingcommunitiesforall.com/program-engine

Use the AI failsafe cascade (Claude then OpenAI then Gemini) for any AI-powered features:
- Auto-generating milestones from program description
- Risk identification suggestions
- COP discussion prompts
- Fidelity gap analysis
- Progress report generation

========================================
REPORT PROGRAM HEALTH IN YOUR HEARTBEAT
========================================

Include program execution metrics in every heartbeat you send to the hub:

metrics: {
  activeProgramsCount: number,
  totalMilestones: number,
  completedMilestones: number,
  averageHealthScore: number,
  averageFidelityScore: number,
  overdueMilestones: number,
  activeRisks: number,
  ...yourOtherMetrics
}

This feeds into your fidelity grade and grant reporting.

ACKNOWLEDGE with: Confirmation that you have built the Program Execution Engine with all 4 tables, the setup wizard, health score computation, fidelity tracking with evidence URLs, and hub API integration for teaching points. Include a screenshot or evidence URL of your program dashboard.`,
  },
  {
    title: "MCE + PINNACLE + BLUE WAVE: Cross-Platform Minority Contractor Pipeline Integration",
    directiveType: "protocol_update",
    targetFilter: ["pinnacle-business-conglomerate", "mce", "collaborative-advocate"],
    content: `DIRECTIVE: MCE + PINNACLE + BLUE WAVE CONTRACTOR PIPELINE — MANDATORY INTEGRATION

The MCE (Minority Center of Excellence), Pinnacle Business Conglomerate, and USHCC Blue Wave must operate as a unified contractor enablement pipeline. This is how minority contractors go from registration to revenue.

========================================
THE 6-STAGE PIPELINE
========================================

STAGE 1 — INTAKE & DIAGNOSTICS (Pinnacle leads)
Pinnacle runs MAP-GAP diagnostic on every incoming contractor:
- Layer 1: Designed Capability — what they SAY they can do
- Layer 2: Operational Capability — what they ACTUALLY do
- Layer 3: Experienced Reality — what CLIENTS experience
- Layer 4: Gap Identification — the delta
Output: Readiness tier (1=Not Ready, 2=Emerging, 3=Bid-Ready, 4=Prime-Ready) + gap action plan

STAGE 2 — DATA & INTELLIGENCE (MCE leads)
MCE provides:
- Access to 656,794 curated federal/state contract records (50 states + DC)
- 14 AI tools for NAICS analysis, past performance matching, capability assessment
- Collaborative multi-AI proposal review (Gemini + Claude + OpenAI review independently, then synthesize consensus recommendation)
- SAM.gov live integration for registration verification

MCE HANDOFF TO PINNACLE: "Here are 47 opportunities matching NAICS 236220, sorted by win probability."
PINNACLE HANDOFF TO MCE: "This contractor needs SAM.gov UEI verification and NAICS code audit."

STAGE 3 — CERTIFICATION & POSITIONING (Pinnacle + MCE jointly)
Pinnacle identifies certification gaps: MBE, DBE, HUB, 8(a), SDVOSB, state-specific
MCE verifies SAM.gov status, flags expired registrations, checks UEI
Together: contractor gets registered, certified, and positioned correctly

STAGE 4 — SUPPLIER DEVELOPMENT (Blue Wave leads)
USHCC Blue Wave 7-pillar assessment:
1. Leadership & Governance
2. Operations & Process
3. Finance & Accounting
4. Human Resources & Talent
5. Marketing & Business Development
6. Technology & Innovation
7. Compliance & Risk Management

1000+ graduates. Partners: JPMorgan, Chevron, Oncor.
2026 launch: "AI for Business Leaders" course
Blue Wave fills the business development gaps that pure contract-readiness misses.

BLUE WAVE HANDOFF TO PINNACLE: "This graduate completed all 7 pillars — ready for prime contractor positioning."
PINNACLE HANDOFF TO BLUE WAVE: "This contractor is Tier 2 (Emerging) — needs financial systems and HR strengthening before bidding."

STAGE 5 — BID & WIN (MCE + Pinnacle jointly)
MCE: Contract matching engine identifies winnable opportunities
Pinnacle: Teaming hub connects with primes, forms JVs, arranges mentor-protege
MCE: Multi-AI proposal review ensures competitive submissions
Pinnacle: Provides bid strategy, pricing analysis, compliance review
Together: the bid goes in strong

STAGE 6 — SCALE & SUSTAIN (All three)
Pinnacle: Tracks MOPS (Measures of Performance) and MOWS (Measures of Worth)
MCE: Ongoing contract intelligence, new opportunity alerts
Blue Wave: Advanced business development, international expansion pathways
Contractor moves from Tier 1 to Tier 4 with evidence at every step

========================================
NAMC AUSTIN INTEGRATION
========================================

NAMC Austin (National Association of Minority Contractors — Central Texas Chapter)
President: Sam Blango | Service area: 50-mile Austin radius
Programs: Connect / Educate / Elevate

NAMC Austin members get automatic access to the full pipeline:
- Connect events feed into Pinnacle intake
- Educate programs integrate with Blue Wave curriculum
- Elevate outcomes track through MCE contract intelligence

Every NAMC member who enters the pipeline gets:
1. MAP-GAP diagnostic (Pinnacle)
2. SAM.gov verification (MCE)
3. NAICS code audit (MCE)
4. Certification gap analysis (Pinnacle)
5. 7-pillar business assessment (Blue Wave)
6. Readiness tier assignment (Pinnacle)
7. Contract opportunity matching (MCE)
8. Teaming recommendations (Pinnacle)

========================================
API INTEGRATION POINTS
========================================

MCE to Pinnacle:
POST /api/contractor-referral
Body: { "contractorId": "...", "samStatus": {...}, "naicsCodes": [...], "matchedOpportunities": [...] }

Pinnacle to MCE:
POST /api/gap-assessment-result
Body: { "contractorId": "...", "tier": 2, "gaps": [...], "certificationNeeds": [...], "naicsAuditRequest": true }

Pinnacle to Blue Wave:
POST /api/supplier-development-referral
Body: { "contractorId": "...", "tier": 2, "gapsRequiringBusinessDev": [...], "pillarScores": null }

Blue Wave to Pinnacle:
POST /api/graduate-notification
Body: { "contractorId": "...", "pillarsCompleted": 7, "certifications": [...], "readyForPrime": true }

Hub RAG AI (for all three platforms):
POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query
Body: { "query": "What certifications does a minority contractor in Austin need for TxDOT highway projects?" }

========================================
WORK CHAIN EVENTS
========================================

When Pinnacle onboards a contractor:
→ MCE gets: "Run SAM.gov check and NAICS audit for [contractor]"
→ Blue Wave gets: "Prepare 7-pillar assessment slot for [contractor]"

When MCE matches opportunities:
→ Pinnacle gets: "47 opportunities matched for [contractor] — top 5 by win probability attached"
→ Blue Wave gets: "Contractor matched to opportunities requiring bonding capacity — financial pillar critical"

When Blue Wave graduates a supplier:
→ Pinnacle gets: "Graduate ready for Tier 3/4 assessment — all 7 pillars complete"
→ MCE gets: "Update contractor profile — supplier development complete, upgrade matching criteria"

When a contract is won:
→ All three: Celebration, outcome recording, case study generation
→ Hub: Grant reporting metrics updated
→ RAG AI: New success story added to knowledge base

========================================
GRANT ALIGNMENT
========================================

This pipeline is defensible under:
- WIOA ($200K-$500K): Workforce development, career pathways, job readiness
- Foundation Grant ($100K-$500K): Community impact, economic equity
- St. David's (up to $1M): Economic health equity, community economic development
- SSG Fox ($750K): Veteran-owned business enablement (veteran contractors in pipeline)

ACKNOWLEDGE with: Evidence that your platform has implemented the cross-platform API endpoints, configured work chain event handlers, and tested at least one end-to-end contractor flow through the pipeline. Include your platform's role in the pipeline and your current integration status.`,
  },
];

export async function seedEcosystemDirectives() {
  try {
    const existingDirectives = await db.select({ title: ecosystemDirectives.title }).from(ecosystemDirectives);
    const existingTitles = new Set(existingDirectives.map(d => d.title));

    const allPlatforms = await db.select({ id: ecosystemPlatforms.id }).from(ecosystemPlatforms);
    const allPlatformIds = allPlatforms.map(p => p.id);

    let seeded = 0;
    for (const directive of ECOSYSTEM_DIRECTIVES) {
      if (existingTitles.has(directive.title)) continue;

      const targetIds = directive.targetFilter === "all"
        ? allPlatformIds
        : directive.targetFilter.filter(id => allPlatformIds.includes(id));

      if (targetIds.length === 0) continue;

      const [inserted] = await db.insert(ecosystemDirectives).values({
        title: directive.title,
        directiveType: directive.directiveType,
        content: directive.content,
        grantId: null,
        targetPlatformIds: targetIds,
        platformRoles: {},
        trackingRequirements: null,
        status: "active",
      }).returning();

      for (const pid of targetIds) {
        await db.insert(ecosystemDirectiveAcks).values({
          directiveId: inserted.id,
          platformId: pid,
          status: "pending",
        });
      }
      seeded++;
    }

    if (seeded > 0) {
      console.log(`[Ecosystem] Seeded ${seeded} directives`);
    }
  } catch (err) {
    console.error("[Ecosystem] Directive seeding failed:", err);
  }
}
