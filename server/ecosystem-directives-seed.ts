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

YOUR ROLE IN THE ECOSYSTEM: You are one platform in a 20-platform connected ecosystem. Your data flows to other platforms. Their data flows to you. Together we create a crisis continuum from Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth. No single platform can do this alone.

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
- 'dfc' — Drug-Free Communities
- 'wioa' — WIOA Title I Youth
- 'nba-foundation' — NBA Foundation
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

THE ECOSYSTEM IS NOW 19 PLATFORMS STRONG.

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
    title: "Mission Transition + M2C: Define Swim Lanes",
    directiveType: "improvement_directive",
    targetFilter: ["mission-transition", "m2c"],
    content: `PRIORITY ACTION: Publish a clear swim lane document defining who handles what phase of veteran transition.

Proposed split:
- Mission Transition: STRATEGIC planning — pre-separation, timeline management, identity transition, long-range career mapping
- M2C Transition: PRACTICAL execution — skills translation, benefits enrollment, community connections, day-to-day transition support

Handoff point: The separation date milestone. Mission Transition hands off strategic plan, M2C executes it.

Both platforms should share veteran profile data so the user never has to re-enter information.

Deadline: 1 week. ACKNOWLEDGE with your proposed swim lane boundaries.`,
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
3. Slices data by grant (DFC, WIOA, NBA Foundation, St. David's, SSG Fox)
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
5. THE ECOSYSTEM (20 seconds) — You are part of a 20-platform connected ecosystem. Mention 2-3 sister platforms you work with.
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

The Collaborative Advocate: Update your site to reflect 20 platforms across the ecosystem. Update all references from 19 to 20 platforms.

ALL PLATFORMS: Update any internal references to ecosystem size from 19 to 20 platforms.

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
A mobile-friendly storytelling platform where Austin residents can share their stories, access resources, and engage with hyper-local opportunities. Every story connects to action through ThriveUp's 20-platform ecosystem.

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

ThriveUp Academy has deployed dedicated regional hubs for three Central Texas communities. Same 20-platform ecosystem, adapted for each community's unique context using implementation science principles (CFIR, RE-AIM).

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
