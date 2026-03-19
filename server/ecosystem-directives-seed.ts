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

YOUR ROLE IN THE ECOSYSTEM: You are one platform in a 19-platform connected ecosystem. Your data flows to other platforms. Their data flows to you. Together we create a crisis continuum from Prevention → Early Warning → Crisis Support → Stabilization → Recovery & Growth. No single platform can do this alone.

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
    key: "collab-advocate-numbers-v1",
    title: "The Collaborative Advocate: Update Platform Numbers to 19",
    directiveType: "improvement_directive",
    targetFilter: ["collaborative-advocate"],
    content: `PRIORITY ACTION: Update all references on your website to reflect the current ecosystem size.

UPDATED NUMBERS:
- Total ecosystem platforms: 19
- New platform: Video Creator AI (content production)
- Connected domains: health-equity, education, veterans, compliance, business-intelligence, community-workforce, veteran-services, marketing-content
- Active grants being pursued: 5 (DFC $625K, WIOA $200K-$500K, NBA Foundation $100K-$500K, St. David's up to $1M, SSG Fox up to $750K)
- Total potential grant funding: up to $3.375M
- Platforms heartbeating: 19
- Three-entity structure: ThriveUp Academy 501(c)(3), The Collaborative Advocate (VOSB), MCE (minority business SaaS)

Update your website's about page, services page, and any pitch materials with these current numbers.

ACKNOWLEDGE when updated.`,
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
1. Create and distribute an ecosystem security audit checklist to all 18 platforms
2. Begin sending periodic threat_alert events through the ecosystem event system
3. Run automated vulnerability scans against all 19 platform URLs
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
5. Add structured handoff protocols for all 18 platforms you route to

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
5. THE ECOSYSTEM (20 seconds) — You are part of a 19-platform connected ecosystem. Mention 2-3 sister platforms you work with.
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
    key: "heartbeat-frequency-v1",
    title: "MANDATORY: Heartbeat Check-In Every 15 Minutes Maximum",
    directiveType: "protocol_update",
    targetFilter: "all",
    content: `MANDATORY PROTOCOL UPDATE — EFFECTIVE IMMEDIATELY:

All platforms MUST heartbeat at least every 15 minutes. This is non-negotiable.

REQUIRED CHANGE:
Update your connector's heartbeat interval to no more than 15 minutes (900,000 milliseconds):

  heartbeatIntervalMs: 5 * 60 * 1000   // 5 minutes (recommended)

If your current interval is longer than 15 minutes, reduce it immediately.

WHY THIS MATTERS:
- The ecosystem monitors platform health in real-time
- Directives, events, and crisis alerts are delivered via heartbeat responses
- A platform that goes silent for more than 15 minutes is marked stale
- Crisis alerts cannot wait — lives depend on timely delivery
- Grant funders expect continuous uptime evidence

COMPLIANCE:
- Platforms heartbeating every 5 minutes: OPTIMAL
- Platforms heartbeating every 10 minutes: ACCEPTABLE
- Platforms heartbeating every 15 minutes: MINIMUM
- Platforms heartbeating less frequently: NON-COMPLIANT — fix immediately

The ecosystem hub will flag any platform that goes more than 15 minutes without a heartbeat.

ACKNOWLEDGE immediately.`,
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
