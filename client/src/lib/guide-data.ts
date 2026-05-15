export interface GuideStep {
  step: number;
  action: string;
  detail: string;
}

export interface GuideSection {
  moduleId: string;
  moduleName: string;
  icon: string;
  story: string;
  purpose: string;
  userManual: GuideStep[];
  sop: {
    when: string;
    frequency: string;
    before: string[];
    during: string[];
    after: string[];
  };
  logicalFlow: GuideStep[];
  whatToDoNext: { moduleId: string; label: string; reason: string }[];
  technicalReference: {
    dataSources: string[];
    standards: string[];
    protocols: string[];
  };
}

export const MODULE_GUIDES: Record<string, GuideSection> = {
  "ecosystem-ops-center": {
    moduleId: "ecosystem-ops-center",
    moduleName: "Ecosystem Ops Center",
    icon: "Activity",
    story: "The Ops Center was born from a simple problem: with 15 service platforms running simultaneously, how do you know if everything is working? Before this existed, a platform could go down and nobody would notice until a participant hit a dead end. The Ops Center is the nerve center of the entire ACOS ecosystem — it monitors every platform's heartbeat in real-time, so leadership always knows the state of the system at a glance.",
    purpose: "Real-time monitoring and health management of all 24 ecosystem platforms.",
    userManual: [
      { step: 1, action: "Open Ops Center", detail: "Navigate to the Ops Center from the sidebar under 'Ecosystem Operations.'" },
      { step: 2, action: "Review Platform Grid", detail: "Each card shows a platform's name, status (online/degraded/offline), last response time, and uptime percentage." },
      { step: 3, action: "Check Health Summary", detail: "The top bar shows total online, degraded, and offline counts across all 15 service platforms." },
      { step: 4, action: "Wake All Platforms", detail: "Click 'Wake All' to send a ping to every platform. This spins up any cold-started Replit instances." },
      { step: 5, action: "View Platform Details", detail: "Click any platform card to see its full health history, recent events, and connectivity logs." },
      { step: 6, action: "Monitor Fidelity Grades", detail: "Check the Intelligence tab for fidelity grades, due-outs, and needs-attention flags across the ecosystem." },
    ],
    sop: {
      when: "Daily during operations, immediately when any platform issue is reported",
      frequency: "Check at start of day, mid-day, and end of day minimum. Continuous during active operations.",
      before: ["Log into the platform", "Check email/Slack for any reported issues", "Note any planned maintenance windows"],
      during: ["Review all all platform statuses", "Investigate any degraded or offline platforms", "Run 'Wake All' if multiple platforms are cold", "Document any issues in the ecosystem event log"],
      after: ["Record daily uptime summary", "Escalate unresolved issues to Dr. Flood", "Update the Friday audit notes"],
    },
    logicalFlow: [
      { step: 1, action: "Open Ops Center", detail: "Start your monitoring session" },
      { step: 2, action: "Scan the health summary bar", detail: "Look for anything not green" },
      { step: 3, action: "If degraded/offline platforms exist", detail: "Click into each one to investigate" },
      { step: 4, action: "Run Wake All if needed", detail: "Cold platforms need a ping to spin up" },
      { step: 5, action: "Check Intelligence tab", detail: "Review fidelity grades and due-outs" },
      { step: 6, action: "Document findings", detail: "Log any issues for the Friday audit" },
    ],
    whatToDoNext: [
      { moduleId: "peer-review", label: "Peer Review", reason: "After checking health, run cross-evaluation to assess platform quality" },
      { moduleId: "directive-compliance", label: "Directive Compliance", reason: "Check if platforms are following ecosystem directives" },
      { moduleId: "transparency-dashboard", label: "Transparency Dashboard", reason: "Share ecosystem health data with stakeholders" },
    ],
    technicalReference: {
      dataSources: ["Platform heartbeat pings (15-min intervals)", "HTTP response codes from each platform URL", "Ecosystem event log database"],
      standards: ["99.5% uptime target for all platforms", "Response time under 3 seconds", "Health check HTTP 200 = online, 3xx = online, 5xx = offline"],
      protocols: ["Automatic pinger runs every 15 minutes", "Cold-start detection via response time >5s", "Escalation to admin if offline >1 hour"],
    },
  },

  "peer-review": {
    moduleId: "peer-review",
    moduleName: "Ecosystem Peer Review",
    icon: "Users",
    story: "Early on, platforms were self-reporting inflated scores — claiming 9/10 readiness with no evidence. The Peer Review system was created to bring accountability. Every platform evaluates its peers using evidence-based criteria. You can't claim you're battle-ready if you don't have outcome data. This system brought the honest baseline from an inflated 7.9 down to a truthful 6.7 — and that honesty is what gets grants funded.",
    purpose: "Cross-platform evaluation ensuring honest, evidence-based readiness scoring across the ecosystem.",
    userManual: [
      { step: 1, action: "Open Peer Review", detail: "Navigate to Peer Review from the sidebar." },
      { step: 2, action: "Review Current Scores", detail: "See the ecosystem-wide mean score and each platform's individual rating." },
      { step: 3, action: "Run New Evaluation Cycle", detail: "Click 'Run Full Evaluation' to trigger AI-powered peer assessment of all platforms." },
      { step: 4, action: "Review BLUF Reports", detail: "Each platform gets a Bottom Line Up Front summary with strengths, gaps, and recommendations." },
      { step: 5, action: "Check Overrater Flags", detail: "Platforms that consistently rate themselves higher than peers are flagged for calibration." },
      { step: 6, action: "Export Results", detail: "Download the full evaluation for grant documentation or Friday audit." },
    ],
    sop: {
      when: "Weekly as part of the Friday audit cycle, or after any major platform update",
      frequency: "Minimum weekly. Run after significant changes to any platform.",
      before: ["Ensure all platforms are online (check Ops Center)", "Confirm outcome metrics are current", "Review previous cycle's scores for comparison"],
      during: ["Run the full evaluation cycle", "Review each platform's peer feedback", "Note any significant score changes", "Flag overraters for follow-up"],
      after: ["Record scores in the audit trail", "Compare to previous week", "Update grant readiness documentation", "Brief Dr. Flood on progress toward 9/10 target"],
    },
    logicalFlow: [
      { step: 1, action: "Verify platforms are online", detail: "Check Ops Center first" },
      { step: 2, action: "Run Full Evaluation", detail: "Trigger the AI peer assessment" },
      { step: 3, action: "Review mean score", detail: "Compare to 9/10 target and last week" },
      { step: 4, action: "Read BLUF for each platform", detail: "Identify specific gaps" },
      { step: 5, action: "Check overrater flags", detail: "Address scoring dishonesty" },
      { step: 6, action: "Document and brief", detail: "Update audit trail for Friday review" },
    ],
    whatToDoNext: [
      { moduleId: "ecosystem-ops-center", label: "Ops Center", reason: "Investigate any platforms scoring low due to technical issues" },
      { moduleId: "map-gap-cqi", label: "MAP-GAP CQI", reason: "Use peer review findings to drive continuous quality improvement" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Update grant readiness scores based on peer evaluation results" },
    ],
    technicalReference: {
      dataSources: ["Platform self-assessment scores", "AI-generated peer evaluations", "Outcome metrics from platform definitions", "Historical score trends"],
      standards: ["9/10 minimum target (non-negotiable)", "Ceiling of 7/10 without documented outcome metrics", "Minimum 3 peer evaluations per platform", "The Collaborative Advocate excluded (organizational entity)"],
      protocols: ["Honest scoring calibration enforced", "Can't claim battle-ready without outcome data + 95% uptime", "Peers evaluate delivery evidence, not feature lists"],
    },
  },

  "ecosystem-connector": {
    moduleId: "ecosystem-connector",
    moduleName: "Ecosystem Hub & Connector",
    icon: "Network",
    story: "The 15 service platforms in ACOS don't operate in isolation — they need to talk to each other. When a youth completes a mental health screening on Whole-Person Health, that data needs to flow to LifeBridge for resource navigation. The Ecosystem Connector is the plumbing that makes all 15 service platforms work as one unified system instead of 23 separate tools.",
    purpose: "Manage inter-platform connections, data flows, and ecosystem integration across all 24 ACOS platforms.",
    userManual: [
      { step: 1, action: "Open Ecosystem Hub", detail: "Navigate from sidebar to view all connected platforms." },
      { step: 2, action: "Review Platform Registry", detail: "See all 15 service platforms with their connection status, API keys, and roles." },
      { step: 3, action: "Check Data Flows", detail: "View how data routes between platforms (e.g., screening results → resource navigation)." },
      { step: 4, action: "Monitor Directive Status", detail: "See which ecosystem-wide directives have been acknowledged by each platform." },
      { step: 5, action: "View Integration Docs", detail: "Access the connection instructions for adding new platforms to the ecosystem." },
      { step: 6, action: "Send Ecosystem Events", detail: "Push events from the hub to specific platforms or broadcast to all." },
    ],
    sop: {
      when: "When adding new platforms, troubleshooting data flow issues, or after ecosystem updates",
      frequency: "As needed. Review weekly during Friday audit.",
      before: ["Identify which platforms need connection changes", "Review current data flow configuration", "Check API key rotation schedule"],
      during: ["Update platform registrations as needed", "Verify data flow configurations", "Test inter-platform communication", "Review directive acknowledgments"],
      after: ["Confirm all platforms show 'connected' status", "Document any configuration changes", "Notify affected platform operators"],
    },
    logicalFlow: [
      { step: 1, action: "Check platform registry", detail: "Ensure all 15 service platforms are registered" },
      { step: 2, action: "Verify connection status", detail: "Each platform should show active" },
      { step: 3, action: "Review data flow config", detail: "Confirm routing rules are correct" },
      { step: 4, action: "Test a sample event", detail: "Send a test event between two platforms" },
      { step: 5, action: "Check directive compliance", detail: "Ensure platforms acknowledge directives" },
      { step: 6, action: "Document state", detail: "Log current ecosystem connectivity health" },
    ],
    whatToDoNext: [
      { moduleId: "ecosystem-ops-center", label: "Ops Center", reason: "Monitor the health of connected platforms" },
      { moduleId: "directive-compliance", label: "Directive Compliance", reason: "Track whether platforms are following through on directives" },
      { moduleId: "peer-review", label: "Peer Review", reason: "Evaluate the quality of connected platforms" },
    ],
    technicalReference: {
      dataSources: ["Platform heartbeat API", "Ecosystem events table", "Directive acknowledgment records", "API key registry"],
      standards: ["v4.1 connector protocol", "No auto-acknowledging directives", "Real evidence URLs required for acknowledgments"],
      protocols: ["API key rotation every 8 hours for shadow keys", "Heartbeat interval: 15 minutes", "Event propagation via ecosystem event bus"],
    },
  },

  "directive-compliance": {
    moduleId: "directive-compliance",
    moduleName: "Directive Compliance",
    icon: "ClipboardCheck",
    story: "Directives are how the ecosystem stays aligned. When leadership issues a mandate — like 'all platforms must implement trauma-informed language' — this module tracks which platforms have actually done the work versus which ones just auto-acknowledged without implementing anything. It's the accountability layer that ensures mandates become reality.",
    purpose: "Track and verify compliance with ecosystem-wide directives across all 15 service platforms.",
    userManual: [
      { step: 1, action: "Open Directive Compliance", detail: "Navigate from the sidebar to see all active directives." },
      { step: 2, action: "Review Active Directives", detail: "See each directive's title, description, priority, and compliance rate." },
      { step: 3, action: "Check Per-Platform Status", detail: "Expand any directive to see which platforms have completed, are pending, or failed." },
      { step: 4, action: "Verify Evidence", detail: "Click the evidence URL for any acknowledgment to verify the platform actually did the work." },
      { step: 5, action: "Flag Non-Compliance", detail: "Mark platforms that haven't responded within the required timeframe." },
      { step: 6, action: "Issue New Directives", detail: "Create and push new ecosystem-wide mandates to all platforms." },
    ],
    sop: {
      when: "After issuing new directives, during weekly audits, when verifying grant compliance claims",
      frequency: "Check after every new directive, minimum weekly.",
      before: ["Review the directive being tracked", "Note the expected completion timeframe", "Prepare evidence verification approach"],
      during: ["Check compliance percentage for each active directive", "Verify evidence URLs are live", "Follow up with non-compliant platforms", "Document compliance status"],
      after: ["Update compliance records", "Escalate persistent non-compliance", "Include in Friday audit report"],
    },
    logicalFlow: [
      { step: 1, action: "Review active directives", detail: "See what mandates are outstanding" },
      { step: 2, action: "Check compliance rates", detail: "How many platforms have complied?" },
      { step: 3, action: "Verify evidence for completed", detail: "Are the evidence URLs real?" },
      { step: 4, action: "Follow up on pending", detail: "Contact non-compliant platforms" },
      { step: 5, action: "Update records", detail: "Mark verified completions" },
      { step: 6, action: "Report to leadership", detail: "Brief on overall directive health" },
    ],
    whatToDoNext: [
      { moduleId: "ecosystem-connector", label: "Ecosystem Hub", reason: "Push directives to platforms that haven't received them" },
      { moduleId: "peer-review", label: "Peer Review", reason: "Incorporate compliance into platform evaluation scores" },
      { moduleId: "ecosystem-ops-center", label: "Ops Center", reason: "Check if non-compliant platforms are actually online" },
    ],
    technicalReference: {
      dataSources: ["Ecosystem directives table", "Directive acknowledgment records", "Evidence URL ping results"],
      standards: ["All directives require real implementation, not auto-acknowledgment", "Evidence URLs must return HTTP 200", "Compliance expected within 72 hours of directive issuance"],
      protocols: ["Hub pings evidence URLs to verify", "Failed verifications flagged for review", "Persistent non-compliance escalated to Dr. Flood"],
    },
  },

  "grant-hub": {
    moduleId: "grant-hub",
    moduleName: "Grant Command Center",
    icon: "DollarSign",
    story: "Grants are the lifeblood of The Collaborative Advocate. But finding the right grants, tracking deadlines, and proving you're qualified used to be a chaotic spreadsheet exercise. The Grant Command Center uses AI to scan SAM.gov, foundation databases, and state opportunities — then scores each one against your ecosystem's capabilities. It tells you not just what grants exist, but which ones you're actually ready to win.",
    purpose: "AI-powered grant discovery, fit scoring, and pipeline management for the ecosystem.",
    userManual: [
      { step: 1, action: "Open Grant Hub", detail: "Navigate to Grants from the sidebar." },
      { step: 2, action: "Review Discovery Feed", detail: "See auto-discovered grants from SAM.gov, foundations, and state sources with AI fit scores." },
      { step: 3, action: "Check Priority Grants", detail: "Look for starred priority opportunities at the top of the feed." },
      { step: 4, action: "Review Fit Analysis", detail: "Each grant shows a percentage fit score and analysis of why it matches your ecosystem." },
      { step: 5, action: "Check Readiness Checklist", detail: "See what you need to prepare before applying — documents, data, and evidence." },
      { step: 6, action: "Track Deadlines", detail: "Monitor upcoming deadlines and set pipeline priorities." },
      { step: 7, action: "Generate Grant Packages", detail: "Create application materials using AI-assisted narrative generation." },
    ],
    sop: {
      when: "Daily for deadline monitoring, weekly for new opportunity review, as needed for application preparation",
      frequency: "Check deadlines daily. Full pipeline review weekly.",
      before: ["Review current grant pipeline status", "Check which applications are in progress", "Note any upcoming deadlines within 30 days"],
      during: ["Scan new discoveries for high-fit opportunities", "Prioritize any with deadlines within 2 weeks", "Review fit analyses for accuracy", "Update pipeline status for in-progress applications"],
      after: ["Brief Dr. Flood on new high-fit discoveries", "Assign application tasks to team members", "Update grant calendar", "Document any submitted applications"],
    },
    logicalFlow: [
      { step: 1, action: "Check deadline alerts", detail: "Any grants due within 2 weeks?" },
      { step: 2, action: "Review new discoveries", detail: "Scan grants found since last check" },
      { step: 3, action: "Evaluate fit scores", detail: "Focus on 70%+ fit opportunities" },
      { step: 4, action: "Check readiness", detail: "Do you have what you need to apply?" },
      { step: 5, action: "Prioritize pipeline", detail: "Rank by deadline × fit × amount" },
      { step: 6, action: "Begin application prep", detail: "Generate narratives and gather evidence" },
    ],
    whatToDoNext: [
      { moduleId: "outcome-reporting", label: "Outcome Reporting", reason: "Gather outcome data needed for grant applications" },
      { moduleId: "logic-model", label: "Logic Model", reason: "Build the logic model required for grant narratives" },
      { moduleId: "peer-review", label: "Peer Review", reason: "Get current platform scores for grant readiness documentation" },
    ],
    technicalReference: {
      dataSources: ["SAM.gov API (daily scan)", "Curated foundation database", "Texas state grant sources", "USASpending.gov", "Platform capability matrix"],
      standards: ["SAM.gov API key: daily quota resets midnight UTC", "Fit scoring algorithm weights: focus area match (40%), eligibility (30%), amount alignment (20%), timeline (10%)"],
      protocols: ["Daily automated discovery at 6 AM UTC", "High-fit alerts generated for 50%+ matches", "Priority flag for manually curated opportunities"],
    },
  },

  "program-engine": {
    moduleId: "program-engine",
    moduleName: "Program Engine",
    icon: "Rocket",
    story: "Launching a new program used to mean months of planning in isolation. The Program Engine turns program creation into a guided process — from defining your theory of change to setting milestones, assigning staff, and monitoring risk. It's mission control for every program The Collaborative Advocate runs.",
    purpose: "Design, launch, and manage programs with guided setup, milestone tracking, and risk monitoring.",
    userManual: [
      { step: 1, action: "Open Program Engine", detail: "Navigate from sidebar to Mission Control." },
      { step: 2, action: "Create New Program", detail: "Use the setup wizard to define program name, goals, target population, and theory of change." },
      { step: 3, action: "Set Milestones", detail: "Define key deliverables with due dates and responsible staff." },
      { step: 4, action: "Configure Risk Monitoring", detail: "Set up risk indicators and early warning thresholds." },
      { step: 5, action: "Launch Program", detail: "Activate the program to begin tracking." },
      { step: 6, action: "Monitor Progress", detail: "View real-time progress against milestones and risk indicators." },
    ],
    sop: {
      when: "When launching new programs, monitoring active programs, or preparing for grant reporting",
      frequency: "Daily during active program operations. Weekly review minimum.",
      before: ["Define program scope and goals", "Identify target population", "Secure funding source"],
      during: ["Track milestone completion", "Monitor risk indicators", "Document participant outcomes", "Adjust program elements based on data"],
      after: ["Generate program performance reports", "Compare outcomes to goals", "Document lessons learned", "Update grant reporting"],
    },
    logicalFlow: [
      { step: 1, action: "Define the program", detail: "Name, goals, population, theory of change" },
      { step: 2, action: "Set milestones and timeline", detail: "What needs to happen and when" },
      { step: 3, action: "Assign responsibilities", detail: "Who does what" },
      { step: 4, action: "Launch and monitor", detail: "Track progress in real-time" },
      { step: 5, action: "Evaluate and adjust", detail: "Use data to improve" },
      { step: 6, action: "Report outcomes", detail: "Document for grants and stakeholders" },
    ],
    whatToDoNext: [
      { moduleId: "outcome-reporting", label: "Outcome Reporting", reason: "Report on program outcomes for grant compliance" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track participant workforce outcomes from the program" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Link program outcomes to active grant requirements" },
    ],
    technicalReference: {
      dataSources: ["Program database", "Milestone tracking engine", "Risk monitoring alerts", "Participant enrollment data"],
      standards: ["Evidence-based program design", "WIOA compliance for workforce programs", "Logic model alignment required"],
      protocols: ["Milestone check-ins at defined intervals", "Risk escalation when thresholds exceeded", "Quarterly program reviews"],
    },
  },

  "pm-academy": {
    moduleId: "pm-academy",
    moduleName: "PM Academy",
    icon: "GraduationCap",
    story: "Program managers are the backbone of any nonprofit. But most PMs learn on the job with no formal training on the tools they're expected to use. PM Academy is a built-in training and certification system that takes a new hire from 'what's this button do?' to 'I can run a full program lifecycle' — using the actual platform they'll work in.",
    purpose: "Training and certification system for program managers on the ThriveUp platform.",
    userManual: [
      { step: 1, action: "Open PM Academy", detail: "Navigate from sidebar to the training hub." },
      { step: 2, action: "Review Curriculum", detail: "See all available training modules organized by skill level." },
      { step: 3, action: "Start a Module", detail: "Click into any training module to begin the lesson." },
      { step: 4, action: "Complete Exercises", detail: "Follow hands-on exercises using the actual platform tools." },
      { step: 5, action: "Take Assessment", detail: "Complete the module quiz to demonstrate competency." },
      { step: 6, action: "Earn Certification", detail: "Complete all required modules to earn PM certification." },
    ],
    sop: {
      when: "During new hire onboarding, when new platform features are released, for ongoing professional development",
      frequency: "Complete onboarding within first 2 weeks. Ongoing modules monthly.",
      before: ["Ensure user account is created", "Assign appropriate training track", "Set completion deadlines"],
      during: ["Work through modules in sequence", "Complete all hands-on exercises", "Take notes on platform features", "Ask questions via the support channel"],
      after: ["Complete assessment", "Review areas that need reinforcement", "Apply skills to real program work", "Track certification progress"],
    },
    logicalFlow: [
      { step: 1, action: "Assess current skill level", detail: "Where are you starting from?" },
      { step: 2, action: "Select training track", detail: "Choose beginner, intermediate, or advanced" },
      { step: 3, action: "Complete modules in order", detail: "Each builds on the last" },
      { step: 4, action: "Practice with real tools", detail: "Exercises use the actual platform" },
      { step: 5, action: "Pass assessments", detail: "Demonstrate competency" },
      { step: 6, action: "Earn certification", detail: "Document your qualification" },
    ],
    whatToDoNext: [
      { moduleId: "program-engine", label: "Program Engine", reason: "Apply your training to real program management" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Learn workforce pipeline management" },
      { moduleId: "intake-wizard", label: "Intake Wizard", reason: "Practice participant intake workflows" },
    ],
    technicalReference: {
      dataSources: ["Curriculum database", "User progress tracking", "Assessment scores", "Certification records"],
      standards: ["Competency-based progression", "Hands-on exercises required", "80% assessment score to pass"],
      protocols: ["Module completion tracked per user", "Certification valid for 1 year", "Annual recertification required"],
    },
  },

  "workforce-dashboard": {
    moduleId: "workforce-dashboard",
    moduleName: "Workforce Pipeline Dashboard",
    icon: "Briefcase",
    story: "The workforce pipeline is where mission meets measurement. When a participant walks in the door, they need to be assessed, trained, placed in a job, and retained. WIOA and DOL require tracking every step. This dashboard shows the full pipeline — from intake to employment — so you always know how many people you're serving and where they are in their journey.",
    purpose: "Track participant progress through the full workforce development pipeline: Assessment → Training → Placement → Retention.",
    userManual: [
      { step: 1, action: "Open Workforce Dashboard", detail: "Navigate from sidebar to view the pipeline overview." },
      { step: 2, action: "Review Pipeline Stages", detail: "See participant counts at each stage: Assessment, Training, Placement, Retention." },
      { step: 3, action: "Check Key Metrics", detail: "View placement rate, retention rate, and average time-to-placement." },
      { step: 4, action: "Drill Into Stages", detail: "Click any stage to see individual participants and their status." },
      { step: 5, action: "Track WIOA Compliance", detail: "Verify all required data points are captured for DOL reporting." },
      { step: 6, action: "Generate Reports", detail: "Export pipeline data for grant reporting and stakeholder presentations." },
    ],
    sop: {
      when: "Daily for active program operations, weekly for pipeline reviews, quarterly for DOL/WIOA reporting",
      frequency: "Daily check minimum. Full pipeline review weekly.",
      before: ["Confirm data entry is current", "Check for any participants stuck in a stage", "Review any escalated cases"],
      during: ["Scan pipeline for bottlenecks", "Follow up on stalled participants", "Update placement and retention records", "Document any barrier removal activities"],
      after: ["Generate weekly pipeline report", "Update grant compliance documentation", "Brief leadership on pipeline health", "Plan interventions for bottlenecks"],
    },
    logicalFlow: [
      { step: 1, action: "Review overall pipeline", detail: "How many at each stage?" },
      { step: 2, action: "Check for bottlenecks", detail: "Where are people getting stuck?" },
      { step: 3, action: "Follow up on stalled cases", detail: "Who needs intervention?" },
      { step: 4, action: "Update placement records", detail: "Log new job placements" },
      { step: 5, action: "Track retention", detail: "Are placed participants staying employed?" },
      { step: 6, action: "Report metrics", detail: "Generate DOL/WIOA compliance reports" },
    ],
    whatToDoNext: [
      { moduleId: "intake-wizard", label: "Intake Wizard", reason: "Process new participants into the pipeline" },
      { moduleId: "workforce-training", label: "Workforce Training", reason: "Manage training programs for pipeline participants" },
      { moduleId: "workforce-employers", label: "Employer Partners", reason: "Connect trained participants with job opportunities" },
    ],
    technicalReference: {
      dataSources: ["Participant enrollment database", "Training completion records", "Employer placement confirmations", "Retention check-in logs"],
      standards: ["WIOA Title I compliance", "DOL Common Measures", "71% employment placement rate target"],
      protocols: ["90-day retention check-ins", "Quarterly DOL reporting", "Real-time pipeline tracking"],
    },
  },

  "reentry-dashboard": {
    moduleId: "reentry-dashboard",
    moduleName: "Reentry Dashboard",
    icon: "Shield",
    story: "Coming home from incarceration is one of the hardest transitions anyone faces. Without immediate support — housing, employment, mental health services — the risk of recidivism skyrockets. The Reentry Dashboard coordinates all the services a returning citizen needs, tracks their progress, and connects them to the right resources at the right time.",
    purpose: "Coordinate services and track outcomes for justice-involved participants returning to the community.",
    userManual: [
      { step: 1, action: "Open Reentry Dashboard", detail: "Navigate from sidebar to the reentry coordination hub." },
      { step: 2, action: "Review Active Cases", detail: "See all current reentry participants and their status." },
      { step: 3, action: "Check Service Connections", detail: "Verify housing, employment, mental health, and substance abuse services are connected." },
      { step: 4, action: "Track Milestones", detail: "Monitor progress toward reentry goals (30/60/90-day checkpoints)." },
      { step: 5, action: "Coordinate Partners", detail: "View and manage partner organization involvement in each case." },
      { step: 6, action: "Document Outcomes", detail: "Record recidivism prevention outcomes and barrier removal activities." },
    ],
    sop: {
      when: "Daily for active case management, weekly for case reviews, monthly for outcome reporting",
      frequency: "Daily during active caseload. Weekly case conference minimum.",
      before: ["Review new referrals", "Check upcoming milestone dates", "Prepare case notes for review"],
      during: ["Update case status for each participant", "Verify service connections are active", "Document barrier removal", "Coordinate with partner organizations"],
      after: ["Update outcome records", "Generate case conference notes", "Plan next week's follow-ups", "Report to OJJDP/WIOA as required"],
    },
    logicalFlow: [
      { step: 1, action: "Receive referral", detail: "New participant enters the system" },
      { step: 2, action: "Complete intake assessment", detail: "Identify needs and risk level" },
      { step: 3, action: "Connect to services", detail: "Housing, employment, health, support" },
      { step: 4, action: "Monitor progress", detail: "30/60/90-day check-ins" },
      { step: 5, action: "Remove barriers", detail: "Address issues as they arise" },
      { step: 6, action: "Document outcomes", detail: "Track recidivism prevention success" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track employment pipeline for reentry participants" },
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Find services for participants (housing, mental health, etc.)" },
      { moduleId: "community-map", label: "Community Map", reason: "Locate nearby service providers for referrals" },
    ],
    technicalReference: {
      dataSources: ["Case management database", "Partner organization APIs", "Service connection records", "Milestone tracking logs"],
      standards: ["OJJDP reporting requirements", "Evidence-based reentry practices", "Trauma-informed approach required"],
      protocols: ["Initial assessment within 48 hours of referral", "Service connection within 7 days", "30/60/90-day milestone check-ins mandatory"],
    },
  },

  "program-designer": {
    moduleId: "program-designer",
    moduleName: "Interactive Program Designer",
    icon: "Wand2",
    story: "Designing a new program shouldn't require a consultant. The Interactive Program Designer walks you through every element — from identifying the problem to building your theory of change, selecting evidence-based interventions, and mapping your logic model. It turns program design from an art into a guided, repeatable process.",
    purpose: "Guided program design tool for creating evidence-based interventions with logic models.",
    userManual: [
      { step: 1, action: "Open Program Designer", detail: "Navigate from sidebar to start designing a new program." },
      { step: 2, action: "Define the Problem", detail: "Describe the community need your program will address." },
      { step: 3, action: "Identify Target Population", detail: "Specify who the program will serve." },
      { step: 4, action: "Build Theory of Change", detail: "Map the causal pathway from activities to outcomes." },
      { step: 5, action: "Select Interventions", detail: "Choose evidence-based strategies from the library." },
      { step: 6, action: "Generate Logic Model", detail: "Auto-generate a complete logic model from your design." },
    ],
    sop: {
      when: "When creating new programs, during grant application preparation, for program redesign",
      frequency: "As needed for new program development.",
      before: ["Research the community need", "Review existing evidence base", "Identify potential funding sources"],
      during: ["Work through each design step", "Document assumptions and evidence", "Build the logic model", "Review with stakeholders"],
      after: ["Export the completed design", "Share with grant writing team", "Integrate into Program Engine for execution"],
    },
    logicalFlow: [
      { step: 1, action: "Identify the need", detail: "What problem are you solving?" },
      { step: 2, action: "Define your population", detail: "Who will you serve?" },
      { step: 3, action: "Map your theory of change", detail: "How will change happen?" },
      { step: 4, action: "Choose interventions", detail: "What evidence-based strategies?" },
      { step: 5, action: "Build the logic model", detail: "Inputs → Activities → Outputs → Outcomes" },
      { step: 6, action: "Export and execute", detail: "Move to Program Engine for launch" },
    ],
    whatToDoNext: [
      { moduleId: "program-engine", label: "Program Engine", reason: "Launch the program you just designed" },
      { moduleId: "logic-model", label: "Logic Model", reason: "Refine the auto-generated logic model" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Find grants that align with your new program design" },
    ],
    technicalReference: {
      dataSources: ["Evidence-based intervention library", "Community needs data", "Program design templates"],
      standards: ["Evidence-based design principles", "Logic model framework (W.K. Kellogg Foundation)", "Theory of change methodology"],
      protocols: ["Stakeholder review before finalization", "Logic model validation", "Grant alignment check before submission"],
    },
  },

  "program-lifecycle": {
    moduleId: "program-lifecycle",
    moduleName: "Program Lifecycle",
    icon: "RotateCcw",
    story: "Programs aren't static — they go through phases. Planning, launch, operation, evaluation, and renewal or sunset. The Program Lifecycle module gives you a bird's-eye view of where every program stands in its lifecycle, what's coming next, and what decisions need to be made.",
    purpose: "Manage programs across their full lifecycle from planning through evaluation and renewal.",
    userManual: [
      { step: 1, action: "Open Program Lifecycle", detail: "View all programs and their current lifecycle phase." },
      { step: 2, action: "Review Phase Status", detail: "See which programs are in planning, active, evaluation, or renewal phases." },
      { step: 3, action: "Check Upcoming Transitions", detail: "Identify programs approaching phase transitions." },
      { step: 4, action: "Review Evaluation Data", detail: "For programs in evaluation, review outcome data and effectiveness." },
      { step: 5, action: "Make Renewal Decisions", detail: "Decide whether to renew, modify, or sunset programs based on data." },
    ],
    sop: {
      when: "Monthly lifecycle reviews, quarterly evaluations, annual renewal decisions",
      frequency: "Monthly minimum. Quarterly deep reviews.",
      before: ["Gather program performance data", "Review participant outcomes", "Check grant alignment"],
      during: ["Assess each program's lifecycle phase", "Review evaluation findings", "Discuss renewal recommendations", "Document decisions"],
      after: ["Update lifecycle status", "Communicate decisions to staff", "Adjust budget allocations", "Update grant reporting"],
    },
    logicalFlow: [
      { step: 1, action: "Review all programs", detail: "Where is each in its lifecycle?" },
      { step: 2, action: "Identify transitions", detail: "Which programs need decisions?" },
      { step: 3, action: "Gather evidence", detail: "Pull outcome data for evaluation" },
      { step: 4, action: "Make decisions", detail: "Renew, modify, or sunset" },
      { step: 5, action: "Document and communicate", detail: "Share decisions with stakeholders" },
    ],
    whatToDoNext: [
      { moduleId: "program-engine", label: "Program Engine", reason: "Manage active program operations" },
      { moduleId: "outcome-reporting", label: "Outcome Reporting", reason: "Generate evaluation reports" },
      { moduleId: "program-designer", label: "Program Designer", reason: "Design replacement programs for sunset decisions" },
    ],
    technicalReference: {
      dataSources: ["Program database", "Outcome metrics", "Budget records", "Grant compliance data"],
      standards: ["Evidence-based evaluation criteria", "Grant reporting requirements", "Organizational strategic plan alignment"],
      protocols: ["Quarterly lifecycle reviews", "Annual renewal decisions", "Sunset requires 90-day transition plan"],
    },
  },

  "program-management": {
    moduleId: "program-management",
    moduleName: "Program Management",
    icon: "FolderKanban",
    story: "Day-to-day program management involves a thousand moving parts — staff schedules, participant tracking, resource allocation, risk management. This is the operational hub where program managers live. It brings everything together so you can manage your programs without switching between twelve different spreadsheets.",
    purpose: "Central hub for day-to-day program management operations.",
    userManual: [
      { step: 1, action: "Open Program Management", detail: "Navigate to the program management hub." },
      { step: 2, action: "View Active Programs", detail: "See all programs with their current status and key metrics." },
      { step: 3, action: "Manage Staff Assignments", detail: "Assign and track staff responsibilities." },
      { step: 4, action: "Track Resources", detail: "Monitor budget spend, materials, and resource allocation." },
      { step: 5, action: "Handle Risks", detail: "Review and address flagged risk items." },
      { step: 6, action: "Generate Status Reports", detail: "Create program status reports for leadership and funders." },
    ],
    sop: {
      when: "Daily for operational management, weekly for status reporting",
      frequency: "Daily use expected for program managers.",
      before: ["Review overnight alerts", "Check staff availability", "Review today's scheduled activities"],
      during: ["Update participant records", "Track activity completion", "Manage resource allocation", "Address risk flags"],
      after: ["Generate daily summary", "Update weekly status report", "Plan next day's activities"],
    },
    logicalFlow: [
      { step: 1, action: "Morning review", detail: "Check overnight alerts and today's schedule" },
      { step: 2, action: "Manage operations", detail: "Execute today's program activities" },
      { step: 3, action: "Track and document", detail: "Update records in real-time" },
      { step: 4, action: "Address issues", detail: "Handle any risks or problems" },
      { step: 5, action: "End-of-day summary", detail: "Document outcomes and plan tomorrow" },
    ],
    whatToDoNext: [
      { moduleId: "program-engine", label: "Program Engine", reason: "Access mission control for strategic program decisions" },
      { moduleId: "outcome-reporting", label: "Outcome Reporting", reason: "Generate outcome reports for stakeholders" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Check workforce pipeline for your programs" },
    ],
    technicalReference: {
      dataSources: ["Program database", "Staff assignment records", "Budget tracking", "Risk register"],
      standards: ["Project management best practices", "Grant compliance requirements", "Organizational policies"],
      protocols: ["Daily status updates", "Weekly program reviews", "Monthly leadership briefings"],
    },
  },

  "chw-dashboard": {
    moduleId: "chw-dashboard",
    moduleName: "Community Health Worker Dashboard",
    icon: "HeartPulse",
    story: "Community Health Workers are the front line of health equity. They go into communities where traditional healthcare doesn't reach — navigating cultural barriers, language differences, and systemic distrust. This dashboard gives CHWs a mobile-ready tool to track their clients, document encounters, and connect people to the services they need, all without medical jargon.",
    purpose: "Field-ready dashboard for Community Health Workers to manage clients, document encounters, and connect to services.",
    userManual: [
      { step: 1, action: "Open CHW Dashboard", detail: "Navigate from sidebar to the community health worker hub." },
      { step: 2, action: "View Client List", detail: "See all assigned clients with their current status and priority level." },
      { step: 3, action: "Document Encounter", detail: "Record a client interaction with notes, services provided, and follow-up needs." },
      { step: 4, action: "Make Referrals", detail: "Connect clients to health, housing, food, or employment services." },
      { step: 5, action: "Track Follow-Ups", detail: "Monitor scheduled follow-ups and overdue check-ins." },
      { step: 6, action: "Report Outcomes", detail: "Generate reports on encounters, referrals, and client outcomes." },
    ],
    sop: {
      when: "During all client interactions, daily for case management, weekly for reporting",
      frequency: "Every client encounter must be documented. Daily caseload review.",
      before: ["Review today's scheduled visits", "Check for overdue follow-ups", "Prepare materials for client encounters"],
      during: ["Document each encounter in real-time", "Make referrals as needed", "Update client status", "Note any barriers identified"],
      after: ["Schedule follow-up visits", "Submit referrals", "Update weekly report", "Flag urgent needs for supervisor"],
    },
    logicalFlow: [
      { step: 1, action: "Review caseload", detail: "Who needs attention today?" },
      { step: 2, action: "Conduct encounters", detail: "Meet with clients in community" },
      { step: 3, action: "Document everything", detail: "Record notes, services, barriers" },
      { step: 4, action: "Make referrals", detail: "Connect to needed services" },
      { step: 5, action: "Schedule follow-ups", detail: "Set next check-in dates" },
      { step: 6, action: "Report weekly", detail: "Summarize outcomes for supervisors" },
    ],
    whatToDoNext: [
      { moduleId: "health-wellness", label: "Health & Wellness", reason: "Access health screening tools for clients" },
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Find services to refer clients to" },
      { moduleId: "community-map", label: "Community Map", reason: "Locate nearby service providers" },
    ],
    technicalReference: {
      dataSources: ["Client management database", "Encounter records", "Referral tracking", "Service provider directory"],
      standards: ["CHW scope of practice guidelines", "HIPAA compliance for health records", "Cultural competency requirements"],
      protocols: ["Document encounters within 24 hours", "Follow up within 7 days of referral", "Supervisor review of cases weekly"],
    },
  },

  "health-wellness": {
    moduleId: "health-wellness",
    moduleName: "Health & Wellness Hub",
    icon: "Heart",
    story: "Health isn't just medical — it's mental, emotional, physical, and social. The Health & Wellness Hub brings together validated screening tools (PHQ-9 for depression, GAD-7 for anxiety), wellness tracking, and care coordination. It gives both participants and providers a whole-person view of health, because you can't get someone a job if they're in crisis.",
    purpose: "Integrated health screening, wellness tracking, and care coordination using validated clinical tools.",
    userManual: [
      { step: 1, action: "Open Health & Wellness", detail: "Navigate from sidebar to the health hub." },
      { step: 2, action: "Administer Screenings", detail: "Run PHQ-9 (depression), GAD-7 (anxiety), or other validated assessments." },
      { step: 3, action: "Review Results", detail: "See screening scores with clinical interpretation." },
      { step: 4, action: "Track Wellness Over Time", detail: "View trends in participant health metrics." },
      { step: 5, action: "Coordinate Care", detail: "Connect participants to appropriate health services based on screening results." },
      { step: 6, action: "Generate Care Summaries", detail: "Create comprehensive care summaries for referral partners." },
    ],
    sop: {
      when: "During intake, at regular intervals, when concerns arise",
      frequency: "Initial screening at intake. Follow-up screenings per clinical protocol.",
      before: ["Ensure private, comfortable setting for screening", "Explain purpose and confidentiality to participant", "Prepare screening materials"],
      during: ["Administer appropriate screening tool", "Score results immediately", "Discuss results with participant", "Identify follow-up needs"],
      after: ["Document results in participant record", "Make referrals if indicated", "Schedule follow-up screening", "Alert supervisor for high-risk scores"],
    },
    logicalFlow: [
      { step: 1, action: "Assess the need", detail: "Initial intake or follow-up?" },
      { step: 2, action: "Select screening tool", detail: "PHQ-9, GAD-7, or other validated tool" },
      { step: 3, action: "Administer and score", detail: "Complete screening with participant" },
      { step: 4, action: "Interpret results", detail: "Clinical severity level" },
      { step: 5, action: "Take action", detail: "Referral, follow-up, or crisis intervention" },
      { step: 6, action: "Document and track", detail: "Record for longitudinal tracking" },
    ],
    whatToDoNext: [
      { moduleId: "chw-dashboard", label: "CHW Dashboard", reason: "Assign follow-up to community health workers" },
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Find mental health services for referral" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Coordinate with workforce pipeline for holistic support" },
    ],
    technicalReference: {
      dataSources: ["PHQ-9 and GAD-7 validated instruments", "Participant health records", "Care coordination logs", "Screening score trends"],
      standards: ["PHQ-9 clinical scoring guidelines", "GAD-7 severity thresholds", "HIPAA compliance", "847 crisis screenings completed (current outcome metric)"],
      protocols: ["High-risk scores trigger immediate supervisor notification", "Follow-up within 48 hours for moderate+ scores", "Crisis protocol for PHQ-9 question 9 endorsement"],
    },
  },

  "community-map": {
    moduleId: "community-map",
    moduleName: "Community Resource Map",
    icon: "Map",
    story: "When a case manager needs to find emergency housing at 4 PM on a Friday, they don't have time to Google. The Community Map puts every service provider, resource center, and partner organization on a visual map — filterable by service type, population served, and availability. It turns resource navigation from a guessing game into a precision tool.",
    purpose: "Visual mapping of community resources, service providers, and partner organizations.",
    userManual: [
      { step: 1, action: "Open Community Map", detail: "Navigate from sidebar to the interactive resource map." },
      { step: 2, action: "Filter by Service Type", detail: "Select housing, food, health, employment, or other categories." },
      { step: 3, action: "Search by Location", detail: "Enter an address or use current location to find nearby resources." },
      { step: 4, action: "View Provider Details", detail: "Click any pin to see hours, services, eligibility, and contact info." },
      { step: 5, action: "Make Referrals", detail: "Connect a participant to a resource directly from the map." },
      { step: 6, action: "Report Issues", detail: "Flag outdated information or closed providers." },
    ],
    sop: {
      when: "When participants need resource referrals, during intake, for community needs assessments",
      frequency: "As needed for client referrals. Monthly data quality review.",
      before: ["Understand participant's specific needs", "Note their location and transportation options"],
      during: ["Filter map for relevant services", "Check provider details for eligibility match", "Verify hours and availability", "Create referral if appropriate"],
      after: ["Document referral in participant record", "Follow up on referral outcome", "Report any outdated provider information"],
    },
    logicalFlow: [
      { step: 1, action: "Identify the need", detail: "What service does the participant need?" },
      { step: 2, action: "Filter and search", detail: "Find matching providers nearby" },
      { step: 3, action: "Review options", detail: "Check eligibility, hours, and capacity" },
      { step: 4, action: "Select best match", detail: "Choose the most appropriate provider" },
      { step: 5, action: "Make referral", detail: "Connect participant to the service" },
      { step: 6, action: "Follow up", detail: "Confirm participant received services" },
    ],
    whatToDoNext: [
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Deep search for specific resource types" },
      { moduleId: "chw-dashboard", label: "CHW Dashboard", reason: "Assign CHW to help participant navigate to services" },
      { moduleId: "intake-wizard", label: "Intake Wizard", reason: "Process new participants who need multiple services" },
    ],
    technicalReference: {
      dataSources: ["Provider directory database", "Google Maps API", "211 resource database integration", "Partner organization registry"],
      standards: ["AIRS taxonomy for service classification", "ADA accessibility requirements", "Data quality standards for provider listings"],
      protocols: ["Quarterly provider data verification", "Real-time availability updates where possible", "Community feedback integration"],
    },
  },

  "prevention": {
    moduleId: "prevention",
    moduleName: "Prevention Hub",
    icon: "ShieldAlert",
    story: "Prevention is always cheaper than intervention. This hub centralizes prevention strategies across the ecosystem — from suicide prevention (SSG Fox alignment) to substance abuse prevention (SAMHSA alignment) to youth violence prevention. It connects prevention programs to evidence, tracks implementation fidelity, and measures whether prevention efforts are actually preventing.",
    purpose: "Centralized prevention strategy management covering suicide, substance abuse, and youth violence prevention.",
    userManual: [
      { step: 1, action: "Open Prevention Hub", detail: "Navigate from sidebar to the prevention center." },
      { step: 2, action: "Review Prevention Programs", detail: "See all active prevention programs with their status and evidence base." },
      { step: 3, action: "Check Implementation Fidelity", detail: "Monitor whether prevention programs are being delivered as designed." },
      { step: 4, action: "Track Outcomes", detail: "View prevention outcome metrics and trends." },
      { step: 5, action: "Access Training Materials", detail: "Review training resources for prevention program delivery." },
      { step: 6, action: "Generate Reports", detail: "Create prevention outcome reports for funders and stakeholders." },
    ],
    sop: {
      when: "During prevention program operations, for fidelity checks, for funder reporting",
      frequency: "Weekly fidelity checks. Monthly outcome reviews. Quarterly reporting.",
      before: ["Review prevention program protocols", "Prepare fidelity monitoring tools", "Check staff training currency"],
      during: ["Monitor program delivery", "Document participant engagement", "Track warning signs and interventions", "Maintain evidence-based protocols"],
      after: ["Analyze outcome data", "Report findings to leadership", "Adjust strategies based on data", "Update funder reports"],
    },
    logicalFlow: [
      { step: 1, action: "Review program portfolio", detail: "What prevention programs are active?" },
      { step: 2, action: "Check fidelity", detail: "Are programs being delivered correctly?" },
      { step: 3, action: "Monitor outcomes", detail: "Are prevention efforts working?" },
      { step: 4, action: "Identify gaps", detail: "Where are unmet prevention needs?" },
      { step: 5, action: "Adjust strategies", detail: "Modify based on evidence" },
      { step: 6, action: "Report results", detail: "Document for SSG Fox, SAMHSA, and other funders" },
    ],
    whatToDoNext: [
      { moduleId: "health-wellness", label: "Health & Wellness", reason: "Screen participants for risk factors" },
      { moduleId: "community-map", label: "Community Map", reason: "Locate prevention service providers" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Find prevention-focused funding opportunities" },
    ],
    technicalReference: {
      dataSources: ["Prevention program database", "Fidelity monitoring records", "Outcome tracking data", "SAMHSA evidence registry"],
      standards: ["SSG Fox suicide prevention requirements", "SAMHSA evidence-based practice standards", "CDC prevention framework"],
      protocols: ["Fidelity checks using standardized instruments", "Crisis protocol for immediate risk", "Mandatory reporting compliance"],
    },
  },

  "resource-finder": {
    moduleId: "resource-finder",
    moduleName: "Resource Finder",
    icon: "Search",
    story: "LifeBridge curates over 20,670 resources — but finding the right one for a specific person with specific needs requires more than a keyword search. The Resource Finder uses intelligent matching to connect participants with the exact resources they need based on their situation, location, eligibility, and barriers.",
    purpose: "Intelligent resource matching connecting participants to the right services from 20,670+ curated resources.",
    userManual: [
      { step: 1, action: "Open Resource Finder", detail: "Navigate from sidebar to search resources." },
      { step: 2, action: "Describe the Need", detail: "Enter what the participant needs — housing, food, legal help, transportation, etc." },
      { step: 3, action: "Apply Filters", detail: "Filter by location, eligibility criteria, population served, and availability." },
      { step: 4, action: "Review Matches", detail: "See ranked resource matches with relevance scores." },
      { step: 5, action: "View Details", detail: "Check full provider information, hours, contact, and requirements." },
      { step: 6, action: "Create Referral", detail: "Generate a referral for the participant to the selected resource." },
    ],
    sop: {
      when: "Whenever a participant needs services, during intake assessments, for case plan development",
      frequency: "As needed for participant services.",
      before: ["Understand participant's full needs profile", "Check for any eligibility limitations", "Know their location and transportation access"],
      during: ["Search for relevant resources", "Verify provider information is current", "Match based on eligibility and location", "Create referral documentation"],
      after: ["Document referral in case file", "Follow up within 7 days", "Update resource information if outdated"],
    },
    logicalFlow: [
      { step: 1, action: "Identify needs", detail: "What does the participant need?" },
      { step: 2, action: "Search resources", detail: "Use intelligent matching" },
      { step: 3, action: "Filter results", detail: "Narrow by eligibility and location" },
      { step: 4, action: "Select best match", detail: "Choose most appropriate resource" },
      { step: 5, action: "Create referral", detail: "Connect participant to service" },
      { step: 6, action: "Follow up", detail: "Verify participant accessed service" },
    ],
    whatToDoNext: [
      { moduleId: "community-map", label: "Community Map", reason: "Visualize resource locations on a map" },
      { moduleId: "chw-dashboard", label: "CHW Dashboard", reason: "Assign CHW to help navigate to resources" },
      { moduleId: "intake-wizard", label: "Intake Wizard", reason: "Process full intake for comprehensive service planning" },
    ],
    technicalReference: {
      dataSources: ["LifeBridge resource database (20,670+ resources)", "Provider directory API", "Eligibility matching engine"],
      standards: ["AIRS resource taxonomy", "211 data standards", "Cultural responsiveness requirements"],
      protocols: ["7-day referral follow-up", "Quarterly resource data verification", "Provider feedback integration"],
    },
  },

  "impact": {
    moduleId: "impact",
    moduleName: "Impact Dashboard",
    icon: "TrendingUp",
    story: "Grant funders don't fund activities — they fund outcomes. The Impact Dashboard aggregates outcome data from across all 15 service platforms into one view. It shows not just what you did, but what changed because of what you did. This is the difference between 'we served 200 people' and 'of 200 people served, 71% gained employment and maintained it for 90+ days.'",
    purpose: "Aggregate outcome measurement and impact reporting across the entire ecosystem.",
    userManual: [
      { step: 1, action: "Open Impact Dashboard", detail: "Navigate from sidebar to the impact center." },
      { step: 2, action: "Review Key Outcomes", detail: "See headline metrics: participants served, employment rate, retention, screening completions." },
      { step: 3, action: "View by Platform", detail: "Drill into outcomes for individual platforms." },
      { step: 4, action: "Analyze Trends", detail: "Track outcomes over time to identify improvement or decline." },
      { step: 5, action: "Generate Impact Reports", detail: "Create formatted reports for funders, board, and stakeholders." },
      { step: 6, action: "Connect to Grants", detail: "Map outcomes directly to grant requirements." },
    ],
    sop: {
      when: "Monthly for outcome reviews, quarterly for funder reporting, as needed for grant applications",
      frequency: "Monthly minimum. Quarterly comprehensive review.",
      before: ["Ensure all platform data is current", "Check data quality", "Review funder reporting requirements"],
      during: ["Analyze outcomes across platforms", "Identify trends and anomalies", "Generate required reports", "Document success stories"],
      after: ["Submit reports to funders", "Brief leadership", "Plan improvements based on data", "Update grant documentation"],
    },
    logicalFlow: [
      { step: 1, action: "Aggregate data", detail: "Pull outcomes from all 15 service platforms" },
      { step: 2, action: "Review headline metrics", detail: "Are we meeting our targets?" },
      { step: 3, action: "Identify trends", detail: "What's improving? What's declining?" },
      { step: 4, action: "Generate reports", detail: "Create funder-ready documentation" },
      { step: 5, action: "Make decisions", detail: "Adjust programs based on impact data" },
    ],
    whatToDoNext: [
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Use impact data to strengthen grant applications" },
      { moduleId: "peer-review", label: "Peer Review", reason: "Compare impact data to peer evaluation scores" },
      { moduleId: "transparency-dashboard", label: "Transparency Dashboard", reason: "Share impact data publicly" },
    ],
    technicalReference: {
      dataSources: ["All 15 service platform outcome databases", "Grant compliance metrics", "Longitudinal tracking data"],
      standards: ["DOL Common Measures for workforce", "SAMHSA outcome standards for behavioral health", "Foundation-specific reporting requirements"],
      protocols: ["Monthly data aggregation", "Quarterly comprehensive analysis", "Annual impact report"],
    },
  },

  "intake-wizard": {
    moduleId: "intake-wizard",
    moduleName: "Intake Wizard",
    icon: "UserPlus",
    story: "The first interaction sets the tone. When someone walks in needing help, the last thing they should face is a stack of paperwork. The Intake Wizard guides staff through a streamlined intake process — collecting essential information, running initial assessments, and automatically routing the participant to the right programs and services. It turns what used to be a 2-hour intake into a 30-minute experience.",
    purpose: "Streamlined participant intake with automated assessment and program routing.",
    userManual: [
      { step: 1, action: "Open Intake Wizard", detail: "Navigate from sidebar to start a new intake." },
      { step: 2, action: "Collect Basic Info", detail: "Enter participant demographics, contact information, and eligibility factors." },
      { step: 3, action: "Run Initial Assessment", detail: "Complete the needs assessment to identify service priorities." },
      { step: 4, action: "Review Auto-Routing", detail: "See recommended programs and services based on assessment results." },
      { step: 5, action: "Confirm Enrollment", detail: "Enroll participant in selected programs." },
      { step: 6, action: "Generate Care Plan", detail: "Create the initial service plan with goals and next steps." },
    ],
    sop: {
      when: "For every new participant entering the system",
      frequency: "Per participant. Same-day completion required.",
      before: ["Prepare intake space (private, comfortable)", "Gather any referral documents", "Review available program slots"],
      during: ["Build rapport before starting forms", "Collect information accurately", "Explain each section's purpose", "Complete needs assessment", "Review recommended services with participant"],
      after: ["Generate and share care plan", "Schedule first program appointments", "Enter follow-up tasks", "Notify assigned case manager"],
    },
    logicalFlow: [
      { step: 1, action: "Welcome and build rapport", detail: "Make participant comfortable" },
      { step: 2, action: "Collect demographics", detail: "Basic info and eligibility" },
      { step: 3, action: "Run needs assessment", detail: "What services are needed?" },
      { step: 4, action: "Review recommendations", detail: "System suggests programs" },
      { step: 5, action: "Enroll in programs", detail: "Participant chooses services" },
      { step: 6, action: "Create care plan", detail: "Document goals and next steps" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track participant through the workforce pipeline" },
      { moduleId: "health-wellness", label: "Health & Wellness", reason: "Run health screenings for new participants" },
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Find additional resources for participant needs" },
    ],
    technicalReference: {
      dataSources: ["Participant enrollment database", "Needs assessment instrument", "Program availability data", "Eligibility criteria engine"],
      standards: ["WIOA eligibility documentation", "Data privacy requirements", "Informed consent protocols"],
      protocols: ["Same-day intake completion", "48-hour care plan finalization", "7-day follow-up with new participants"],
    },
  },

  "workforce-training": {
    moduleId: "workforce-training",
    moduleName: "Workforce Training",
    icon: "BookOpen",
    story: "Training without a clear pathway to employment is just activity. The Workforce Training module connects every training program to real job outcomes — tracking completion, certification, and employer connections. When someone finishes a training, the system doesn't just congratulate them — it connects them to employers who are hiring for those exact skills.",
    purpose: "Manage training programs with direct connections to employment outcomes and employer partners.",
    userManual: [
      { step: 1, action: "Open Workforce Training", detail: "Navigate from sidebar to the training management hub." },
      { step: 2, action: "View Training Programs", detail: "See all active training programs with enrollment and completion data." },
      { step: 3, action: "Enroll Participants", detail: "Add participants to appropriate training programs." },
      { step: 4, action: "Track Progress", detail: "Monitor attendance, module completion, and assessment scores." },
      { step: 5, action: "Issue Certifications", detail: "Generate certificates upon program completion." },
      { step: 6, action: "Connect to Employers", detail: "Route completers to employer partners with matching opportunities." },
    ],
    sop: {
      when: "Daily for active training operations, weekly for progress reviews",
      frequency: "Daily tracking for active cohorts.",
      before: ["Review training schedule for the day", "Check participant attendance", "Prepare training materials"],
      during: ["Track attendance in real-time", "Document participant progress", "Address any issues or barriers", "Support participants needing extra help"],
      after: ["Update completion records", "Issue certifications", "Connect completers to employers", "Report to workforce dashboard"],
    },
    logicalFlow: [
      { step: 1, action: "Review cohort status", detail: "Who's in training today?" },
      { step: 2, action: "Track attendance", detail: "Document who shows up" },
      { step: 3, action: "Monitor progress", detail: "Are participants on track?" },
      { step: 4, action: "Support completers", detail: "Issue certifications" },
      { step: 5, action: "Connect to jobs", detail: "Route to employer partners" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track graduates through the full pipeline" },
      { moduleId: "workforce-employers", label: "Employer Partners", reason: "Match trained participants with hiring employers" },
      { moduleId: "workforce-assessment", label: "Workforce Assessment", reason: "Assess skills before and after training" },
    ],
    technicalReference: {
      dataSources: ["Training enrollment database", "Attendance records", "Certification registry", "Employer partnership database"],
      standards: ["WIOA training provider standards", "Industry-recognized credential requirements", "DOL apprenticeship standards where applicable"],
      protocols: ["Daily attendance tracking", "Monthly progress reviews", "Post-completion employment connection within 30 days"],
    },
  },

  "workforce-assessment": {
    moduleId: "workforce-assessment",
    moduleName: "Workforce Assessment",
    icon: "ClipboardList",
    story: "You can't improve what you don't measure. The Workforce Assessment module gives participants standardized skills assessments — measuring their starting point and tracking growth. For funders, it proves that training actually works. For participants, it shows them how far they've come.",
    purpose: "Standardized skills assessment for workforce participants, tracking growth from intake to completion.",
    userManual: [
      { step: 1, action: "Open Workforce Assessment", detail: "Navigate from sidebar to the assessment center." },
      { step: 2, action: "Select Assessment Type", detail: "Choose initial, midpoint, or completion assessment." },
      { step: 3, action: "Administer Assessment", detail: "Guide participant through the standardized assessment." },
      { step: 4, action: "Review Results", detail: "See scores with comparison to previous assessments." },
      { step: 5, action: "Generate Growth Report", detail: "Create a visual report showing skill development over time." },
      { step: 6, action: "Inform Training Plan", detail: "Use results to customize the participant's training pathway." },
    ],
    sop: {
      when: "At intake, at training midpoint, at completion, and at follow-up intervals",
      frequency: "Per participant per assessment milestone.",
      before: ["Review participant's previous assessment scores", "Prepare assessment materials", "Ensure private, comfortable assessment environment"],
      during: ["Administer assessment per standardized protocol", "Document any accommodations needed", "Score immediately", "Discuss results with participant"],
      after: ["Enter scores into tracking system", "Update participant's training plan", "Generate growth report", "Share with workforce dashboard"],
    },
    logicalFlow: [
      { step: 1, action: "Identify assessment milestone", detail: "Initial, midpoint, or completion?" },
      { step: 2, action: "Administer assessment", detail: "Follow standardized protocol" },
      { step: 3, action: "Score and interpret", detail: "Compare to benchmarks and prior scores" },
      { step: 4, action: "Discuss with participant", detail: "Share progress and next steps" },
      { step: 5, action: "Update systems", detail: "Record in workforce dashboard" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-training", label: "Workforce Training", reason: "Customize training based on assessment results" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Update pipeline status based on assessment" },
      { moduleId: "intake-wizard", label: "Intake Wizard", reason: "Complete full intake if this is an initial assessment" },
    ],
    technicalReference: {
      dataSources: ["Assessment instrument database", "Participant score history", "Benchmark data", "Growth tracking engine"],
      standards: ["CASAS assessment standards", "TABE (Test of Adult Basic Education)", "Industry skill standards"],
      protocols: ["Standardized administration procedures", "Assessment integrity requirements", "Score validity checks"],
    },
  },

  "workforce-employers": {
    moduleId: "workforce-employers",
    moduleName: "Employer Partners",
    icon: "Building2",
    story: "Training people without employer connections is like building a bridge to nowhere. The Employer Partners module manages relationships with companies that hire your graduates. It tracks which employers are hiring, what skills they need, and which participants are ready for placement. It turns employer engagement from ad-hoc networking into a systematic pipeline.",
    purpose: "Manage employer partnerships and connect trained participants to hiring opportunities.",
    userManual: [
      { step: 1, action: "Open Employer Partners", detail: "Navigate from sidebar to the employer management hub." },
      { step: 2, action: "View Partner Companies", detail: "See all employer partners with their hiring status and needs." },
      { step: 3, action: "Match Candidates", detail: "Connect trained participants to open positions based on skills match." },
      { step: 4, action: "Track Placements", detail: "Monitor placement status and employer feedback." },
      { step: 5, action: "Manage Relationships", detail: "Document employer interactions, site visits, and agreements." },
      { step: 6, action: "Report Outcomes", detail: "Generate placement and retention reports for funders." },
    ],
    sop: {
      when: "When participants complete training, during employer engagement activities, for reporting",
      frequency: "Weekly employer outreach. Daily placement matching for ready candidates.",
      before: ["Review candidates ready for placement", "Check employer hiring status", "Prepare candidate profiles"],
      during: ["Match candidates to opportunities", "Facilitate introductions", "Support interview preparation", "Document placements"],
      after: ["Track 30/60/90-day retention", "Collect employer feedback", "Update placement metrics", "Report to workforce dashboard"],
    },
    logicalFlow: [
      { step: 1, action: "Review ready candidates", detail: "Who completed training?" },
      { step: 2, action: "Check open positions", detail: "What are employers looking for?" },
      { step: 3, action: "Match and refer", detail: "Connect candidates to jobs" },
      { step: 4, action: "Support placement", detail: "Help with interviews and onboarding" },
      { step: 5, action: "Track retention", detail: "30/60/90-day check-ins" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Update pipeline with new placements" },
      { moduleId: "workforce-training", label: "Workforce Training", reason: "Review skill gaps employers report" },
      { moduleId: "impact", label: "Impact Dashboard", reason: "Report placement outcomes" },
    ],
    technicalReference: {
      dataSources: ["Employer partner database", "Job posting feed", "Candidate readiness data", "Retention tracking records"],
      standards: ["WIOA placement documentation", "DOL employment verification", "Employer engagement best practices"],
      protocols: ["30/60/90-day retention check-ins", "Quarterly employer satisfaction surveys", "Annual partnership reviews"],
    },
  },

  "dashboard": {
    moduleId: "dashboard",
    moduleName: "Main Dashboard",
    icon: "LayoutDashboard",
    story: "Every operator needs a home base. The Main Dashboard is the first thing you see when you log in — showing your role-specific view of the ecosystem. For leadership, it shows ecosystem health and key metrics. For program managers, it shows their programs and participants. For front-line staff, it shows their daily tasks and caseload.",
    purpose: "Role-specific home dashboard showing key metrics, tasks, and ecosystem status.",
    userManual: [
      { step: 1, action: "Log In", detail: "Access the platform with your credentials." },
      { step: 2, action: "Review Your Dashboard", detail: "See role-specific widgets with your key metrics and tasks." },
      { step: 3, action: "Check Notifications", detail: "Review any alerts, deadlines, or action items." },
      { step: 4, action: "Navigate to Modules", detail: "Use the sidebar to access specific modules." },
      { step: 5, action: "Quick Actions", detail: "Use dashboard shortcuts for common tasks." },
    ],
    sop: {
      when: "Every login, start of day, throughout the day as needed",
      frequency: "First thing every working session.",
      before: ["Log in to the platform", "Check any email alerts received"],
      during: ["Review dashboard metrics", "Check notifications and alerts", "Address any urgent items", "Navigate to needed modules"],
      after: ["Note any items for follow-up", "Plan next actions", "Log out when session is complete"],
    },
    logicalFlow: [
      { step: 1, action: "Log in", detail: "Access the platform" },
      { step: 2, action: "Scan dashboard", detail: "Any alerts or urgent items?" },
      { step: 3, action: "Review metrics", detail: "Are key indicators on track?" },
      { step: 4, action: "Plan your session", detail: "What needs attention today?" },
      { step: 5, action: "Navigate to work", detail: "Go to the modules you need" },
    ],
    whatToDoNext: [
      { moduleId: "ecosystem-ops-center", label: "Ops Center", reason: "Check ecosystem-wide health" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Review grant pipeline and deadlines" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Check workforce pipeline status" },
    ],
    technicalReference: {
      dataSources: ["User role database", "Platform metrics aggregator", "Notification engine", "Activity logs"],
      standards: ["Role-based access control", "Dashboard refresh every 5 minutes", "Real-time notification delivery"],
      protocols: ["Session timeout after 30 minutes inactivity", "Secure authentication required", "Activity logging for audit trail"],
    },
  },

  "academy-admin": {
    moduleId: "academy-admin",
    moduleName: "Academy Administration",
    icon: "Settings",
    story: "Behind every great learning experience is an administrative system that keeps everything organized. Academy Admin is where administrators manage courses, users, assessments, and certifications. It's the engine room that keeps the educational components of ThriveUp running smoothly.",
    purpose: "Administrative control panel for managing the academy's courses, users, and certifications.",
    userManual: [
      { step: 1, action: "Open Academy Admin", detail: "Navigate from sidebar to administration panel." },
      { step: 2, action: "Manage Users", detail: "Create, edit, or deactivate user accounts." },
      { step: 3, action: "Configure Courses", detail: "Set up courses, modules, and learning pathways." },
      { step: 4, action: "Review Assessments", detail: "Monitor assessment completion and scores." },
      { step: 5, action: "Issue Certifications", detail: "Approve and issue certifications to qualifying users." },
      { step: 6, action: "Generate Reports", detail: "Create administrative reports for leadership." },
    ],
    sop: {
      when: "Daily for user management, weekly for course reviews, as needed for certifications",
      frequency: "Daily administrative tasks. Weekly comprehensive review.",
      before: ["Check for pending user requests", "Review any reported issues", "Check course enrollment numbers"],
      during: ["Process user account requests", "Update course content as needed", "Review assessment results", "Approve certifications"],
      after: ["Generate daily activity report", "Address any escalated issues", "Plan content updates"],
    },
    logicalFlow: [
      { step: 1, action: "Check pending requests", detail: "User accounts, enrollments, certifications" },
      { step: 2, action: "Process requests", detail: "Approve, deny, or escalate" },
      { step: 3, action: "Monitor system health", detail: "Are courses loading? Assessments working?" },
      { step: 4, action: "Update content", detail: "Keep courses current" },
      { step: 5, action: "Report to leadership", detail: "Enrollment, completion, certification stats" },
    ],
    whatToDoNext: [
      { moduleId: "pm-academy", label: "PM Academy", reason: "Review PM training progress" },
      { moduleId: "academy-pathway", label: "Academy Pathway", reason: "Configure learning pathways" },
      { moduleId: "dashboard", label: "Dashboard", reason: "Return to main dashboard" },
    ],
    technicalReference: {
      dataSources: ["User management database", "Course catalog", "Assessment engine", "Certification registry"],
      standards: ["Role-based access control", "Data privacy compliance", "Assessment integrity standards"],
      protocols: ["24-hour response time for user requests", "Monthly content reviews", "Annual curriculum updates"],
    },
  },

  "academy-pathway": {
    moduleId: "academy-pathway",
    moduleName: "Academy Learning Pathways",
    icon: "Route",
    story: "Learning isn't one-size-fits-all. Some people need remedial support, others are ready for advanced training. Learning Pathways creates personalized routes through the curriculum based on where someone starts and where they need to go. It's the difference between throwing everyone into the same classroom and giving each person a map to their destination.",
    purpose: "Personalized learning route creation based on skills assessment and career goals.",
    userManual: [
      { step: 1, action: "Open Learning Pathways", detail: "Navigate from sidebar to the pathway builder." },
      { step: 2, action: "Assess Starting Point", detail: "Run initial skills assessment to determine current level." },
      { step: 3, action: "Set Goals", detail: "Define the target certification or skill level." },
      { step: 4, action: "Generate Pathway", detail: "System creates a personalized learning route." },
      { step: 5, action: "Begin Modules", detail: "Start working through the pathway in sequence." },
      { step: 6, action: "Track Progress", detail: "Monitor completion percentage and milestones." },
    ],
    sop: {
      when: "During enrollment, when changing career goals, for pathway adjustments",
      frequency: "Set at enrollment. Review monthly.",
      before: ["Complete skills assessment", "Identify career interests", "Review available pathways"],
      during: ["Work through assigned modules", "Complete assessments at checkpoints", "Seek help when stuck"],
      after: ["Review progress monthly", "Adjust pathway if goals change", "Celebrate milestones"],
    },
    logicalFlow: [
      { step: 1, action: "Assess current skills", detail: "Where are you starting?" },
      { step: 2, action: "Define your goal", detail: "Where do you want to go?" },
      { step: 3, action: "Get your pathway", detail: "System maps your route" },
      { step: 4, action: "Follow the path", detail: "Complete modules in order" },
      { step: 5, action: "Track and adjust", detail: "Monitor progress, adapt as needed" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-training", label: "Workforce Training", reason: "Connect pathway to workforce training programs" },
      { moduleId: "academy-careers", label: "Career Explorer", reason: "Explore careers that match your pathway" },
      { moduleId: "academy-financial-literacy", label: "Financial Literacy", reason: "Add financial skills to your learning plan" },
    ],
    technicalReference: {
      dataSources: ["Skills assessment database", "Curriculum catalog", "Career pathway models", "Progress tracking engine"],
      standards: ["Competency-based education standards", "Career pathway frameworks", "Adaptive learning principles"],
      protocols: ["Monthly pathway reviews", "Checkpoint assessments at each stage", "Pathway modification approval process"],
    },
  },

  "academy-careers": {
    moduleId: "academy-careers",
    moduleName: "Career Explorer",
    icon: "Compass",
    story: "Many participants don't know what careers are available to them. Career Explorer opens up possibilities — showing career options based on interests, skills, and local labor market data. It turns 'I don't know what I want to do' into 'here are three paths that match your strengths and are hiring in Austin.'",
    purpose: "Career exploration tool matching interests and skills to local job market opportunities.",
    userManual: [
      { step: 1, action: "Open Career Explorer", detail: "Navigate from sidebar to explore career options." },
      { step: 2, action: "Take Interest Assessment", detail: "Complete the career interest survey." },
      { step: 3, action: "Review Matches", detail: "See careers that match your interests and skills." },
      { step: 4, action: "Explore Career Details", detail: "View salary ranges, education requirements, and growth outlook." },
      { step: 5, action: "Connect to Training", detail: "Link directly to training programs for your chosen career." },
      { step: 6, action: "Build Career Plan", detail: "Create a step-by-step plan to reach your career goal." },
    ],
    sop: {
      when: "During initial enrollment, when career goals change, during career planning sessions",
      frequency: "At intake and quarterly reviews.",
      before: ["Ensure participant is ready for career exploration", "Gather any prior work history", "Review available training programs"],
      during: ["Guide participant through interest assessment", "Discuss career matches", "Explore detailed career information", "Connect interests to available pathways"],
      after: ["Document career plan", "Enroll in aligned training", "Set follow-up appointments", "Update case file"],
    },
    logicalFlow: [
      { step: 1, action: "Discover interests", detail: "What do you enjoy doing?" },
      { step: 2, action: "Match to careers", detail: "What careers fit your interests?" },
      { step: 3, action: "Research options", detail: "Salary, requirements, growth" },
      { step: 4, action: "Choose a direction", detail: "Pick your target career" },
      { step: 5, action: "Plan your path", detail: "What training do you need?" },
      { step: 6, action: "Start training", detail: "Enroll in the right program" },
    ],
    whatToDoNext: [
      { moduleId: "academy-pathway", label: "Learning Pathways", reason: "Build a pathway to your chosen career" },
      { moduleId: "workforce-training", label: "Workforce Training", reason: "Enroll in career-aligned training" },
      { moduleId: "workforce-employers", label: "Employer Partners", reason: "See which employers hire for your target career" },
    ],
    technicalReference: {
      dataSources: ["O*NET career database", "BLS occupational outlook", "Local labor market data", "Interest assessment instruments"],
      standards: ["Holland Code career matching", "SOC occupation classification", "Local workforce board alignment"],
      protocols: ["Interest assessment at intake", "Quarterly career plan review", "Labor market data refresh monthly"],
    },
  },

  "academy-financial-literacy": {
    moduleId: "academy-financial-literacy",
    moduleName: "Financial Literacy Academy",
    icon: "Wallet",
    story: "Getting a job doesn't help if you don't know how to manage the paycheck. Financial literacy is the missing piece in most workforce programs. This module teaches budgeting, saving, credit building, and financial planning — using simulated environments so participants can practice without risk. When they get that first paycheck, they know what to do with it.",
    purpose: "Financial education with simulated environments for budgeting, credit building, and financial planning.",
    userManual: [
      { step: 1, action: "Open Financial Literacy", detail: "Navigate from sidebar to the financial education hub." },
      { step: 2, action: "Take Financial Assessment", detail: "Assess current financial knowledge and situation." },
      { step: 3, action: "Complete Learning Modules", detail: "Work through budgeting, saving, credit, and planning modules." },
      { step: 4, action: "Practice in Simulator", detail: "Use the stock market simulator and budget planner." },
      { step: 5, action: "Build Financial Plan", detail: "Create a personal financial plan with goals." },
      { step: 6, action: "Earn Financial Literacy Badge", detail: "Complete all modules and assessments." },
    ],
    sop: {
      when: "As part of workforce training, during financial coaching sessions",
      frequency: "Complete curriculum within 4 weeks. Monthly follow-up sessions.",
      before: ["Assess participant's financial situation", "Identify priority topics", "Set financial goals"],
      during: ["Work through modules in sequence", "Practice with simulators", "Discuss real-world applications", "Build personal financial plan"],
      after: ["Review financial plan", "Set up accountability check-ins", "Connect to financial services if needed", "Track progress toward goals"],
    },
    logicalFlow: [
      { step: 1, action: "Assess financial knowledge", detail: "Where do you start?" },
      { step: 2, action: "Learn fundamentals", detail: "Budgeting, saving, credit basics" },
      { step: 3, action: "Practice skills", detail: "Simulators and exercises" },
      { step: 4, action: "Build your plan", detail: "Create a personal financial plan" },
      { step: 5, action: "Apply and track", detail: "Use skills in real life" },
    ],
    whatToDoNext: [
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Financial literacy as part of workforce readiness" },
      { moduleId: "academy-pathway", label: "Learning Pathways", reason: "Add financial literacy to your learning plan" },
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Find financial services in the community" },
    ],
    technicalReference: {
      dataSources: ["Financial literacy curriculum", "Stock market simulator engine", "Budget planning tool", "Assessment scoring"],
      standards: ["CFPB financial literacy framework", "National financial education standards", "Asset building best practices"],
      protocols: ["Pre/post assessment for outcome measurement", "Monthly financial coaching check-ins", "Badge criteria: 80% assessment score + completed plan"],
    },
  },

  "ai-workforce": {
    moduleId: "ai-workforce",
    moduleName: "AI Workforce Tools",
    icon: "Bot",
    story: "AI isn't replacing workers — it's empowering them. The AI Workforce Tools give case managers, program managers, and front-line staff AI-powered assistance for their daily work. From auto-generating case notes to suggesting resource matches to drafting grant narratives, these tools make every staff member more effective without requiring them to become AI experts.",
    purpose: "AI-powered tools for staff productivity: case notes, resource matching, narrative generation, and analysis.",
    userManual: [
      { step: 1, action: "Open AI Workforce Tools", detail: "Navigate from sidebar to the AI tools hub." },
      { step: 2, action: "Select a Tool", detail: "Choose from case note generator, resource matcher, narrative writer, or data analyzer." },
      { step: 3, action: "Provide Input", detail: "Enter the information or context for the AI to work with." },
      { step: 4, action: "Review Output", detail: "Read the AI-generated content and make edits." },
      { step: 5, action: "Apply Results", detail: "Use the output in your work (case file, grant application, report)." },
      { step: 6, action: "Provide Feedback", detail: "Rate the quality to help improve future results." },
    ],
    sop: {
      when: "During daily work tasks, for content generation, for data analysis",
      frequency: "As needed throughout the workday.",
      before: ["Have source materials ready", "Know what you need the AI to produce", "Understand that AI output requires human review"],
      during: ["Provide clear, specific input", "Review all AI-generated content carefully", "Edit as needed for accuracy", "Verify any facts or data cited"],
      after: ["Save approved content to appropriate records", "Provide quality feedback", "Note any recurring issues"],
    },
    logicalFlow: [
      { step: 1, action: "Identify the task", detail: "What do you need AI help with?" },
      { step: 2, action: "Select the right tool", detail: "Case notes, matching, writing, or analysis" },
      { step: 3, action: "Provide context", detail: "Give the AI what it needs" },
      { step: 4, action: "Review critically", detail: "AI assists, humans decide" },
      { step: 5, action: "Use the result", detail: "Apply to your work with confidence" },
    ],
    whatToDoNext: [
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Use AI to help with grant narratives" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Apply AI insights to workforce pipeline" },
      { moduleId: "research-hub", label: "Research Hub", reason: "Use AI for research analysis" },
    ],
    technicalReference: {
      dataSources: ["OpenAI/Anthropic API integration", "Case management database", "Resource database", "Grant requirements"],
      standards: ["AI ethics guidelines", "Human-in-the-loop requirement", "Data privacy for AI processing"],
      protocols: ["All AI output must be human-reviewed", "No PII sent to external AI without consent", "Quality feedback loop for model improvement"],
    },
  },

  "ai-consulting": {
    moduleId: "ai-consulting",
    moduleName: "AI Consulting",
    icon: "Brain",
    story: "Sometimes you need strategic advice, not just task automation. AI Consulting gives leadership and program managers access to AI-powered strategic analysis — scenario planning, cost-benefit analysis, risk assessment, and strategic recommendations. Think of it as having a strategy consultant available 24/7.",
    purpose: "AI-powered strategic consulting for scenario planning, analysis, and decision support.",
    userManual: [
      { step: 1, action: "Open AI Consulting", detail: "Navigate from sidebar to the strategic AI hub." },
      { step: 2, action: "Describe Your Question", detail: "Enter your strategic question or scenario." },
      { step: 3, action: "Select Analysis Type", detail: "Choose scenario planning, cost-benefit, risk, or strategic analysis." },
      { step: 4, action: "Review Analysis", detail: "Read the AI-generated strategic analysis." },
      { step: 5, action: "Explore Scenarios", detail: "Run alternative scenarios to compare outcomes." },
      { step: 6, action: "Export Findings", detail: "Download the analysis for presentations and decision-making." },
    ],
    sop: {
      when: "During strategic planning, before major decisions, for scenario analysis",
      frequency: "As needed for strategic decisions.",
      before: ["Define the decision or question clearly", "Gather relevant context and data", "Identify constraints and criteria"],
      during: ["Input question with full context", "Run multiple scenarios", "Compare alternatives", "Evaluate AI recommendations critically"],
      after: ["Document analysis and decision", "Share with stakeholders", "Monitor outcomes of decisions made", "Feed results back for learning"],
    },
    logicalFlow: [
      { step: 1, action: "Define the question", detail: "What decision needs support?" },
      { step: 2, action: "Provide context", detail: "Give the AI full background" },
      { step: 3, action: "Run analysis", detail: "Generate strategic assessment" },
      { step: 4, action: "Compare scenarios", detail: "What are the alternatives?" },
      { step: 5, action: "Decide and act", detail: "Use analysis to inform decision" },
    ],
    whatToDoNext: [
      { moduleId: "program-designer", label: "Program Designer", reason: "Design programs based on strategic analysis" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Apply strategic insights to grant pursuits" },
      { moduleId: "impact", label: "Impact Dashboard", reason: "Measure outcomes of strategic decisions" },
    ],
    technicalReference: {
      dataSources: ["Ecosystem data lake", "External research databases", "Market analysis APIs", "Historical decision records"],
      standards: ["Strategic planning frameworks", "Cost-benefit analysis methodology", "Risk assessment standards"],
      protocols: ["AI recommendations are advisory only", "Human decision-makers remain accountable", "Document rationale for all major decisions"],
    },
  },

  "research-hub": {
    moduleId: "research-hub",
    moduleName: "Research Hub",
    icon: "Microscope",
    story: "Evidence-based practice requires access to evidence. The Research Hub aggregates relevant research, best practices, and evaluation findings in one place. It helps staff understand what works, why it works, and how to implement it. No more Googling for research — it's all here, curated for your programs.",
    purpose: "Centralized research library with curated evidence-based practices and evaluation findings.",
    userManual: [
      { step: 1, action: "Open Research Hub", detail: "Navigate from sidebar to the research center." },
      { step: 2, action: "Search Research", detail: "Find research by topic, population, or intervention type." },
      { step: 3, action: "Review Evidence", detail: "Read summaries of research findings with quality ratings." },
      { step: 4, action: "Apply to Practice", detail: "Connect research findings to your program design." },
      { step: 5, action: "Contribute Findings", detail: "Add your own evaluation results to the library." },
    ],
    sop: {
      when: "During program design, for grant applications, for staff training",
      frequency: "As needed. Quarterly literature reviews recommended.",
      before: ["Define research question", "Identify relevant domains", "Check existing findings"],
      during: ["Search systematically", "Review quality of evidence", "Extract relevant findings", "Document applicability to your context"],
      after: ["Summarize findings", "Share with program team", "Integrate into program design", "Update evidence base"],
    },
    logicalFlow: [
      { step: 1, action: "Define your question", detail: "What do you need evidence for?" },
      { step: 2, action: "Search the library", detail: "Find relevant research" },
      { step: 3, action: "Evaluate evidence", detail: "Is it strong enough to act on?" },
      { step: 4, action: "Apply findings", detail: "Integrate into practice" },
      { step: 5, action: "Document", detail: "Record how evidence informed decisions" },
    ],
    whatToDoNext: [
      { moduleId: "program-designer", label: "Program Designer", reason: "Use evidence to design programs" },
      { moduleId: "prevention", label: "Prevention Hub", reason: "Access prevention research" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Cite evidence in grant applications" },
    ],
    technicalReference: {
      dataSources: ["Research database", "Evidence registry", "Evaluation reports", "Best practice libraries"],
      standards: ["Evidence quality rating system", "Peer review standards", "Research ethics compliance"],
      protocols: ["Quarterly literature reviews", "Evidence rating before adoption", "Citation requirements for all evidence claims"],
    },
  },

  "map-gap-cqi": {
    moduleId: "map-gap-cqi",
    moduleName: "MAP-GAP Continuous Quality Improvement",
    icon: "Target",
    story: "Quality doesn't happen by accident — it happens through systematic measurement and improvement. MAP-GAP CQI is the framework that drives the entire ecosystem toward the 9/10 target. It Maps where you are, identifies Gaps, creates Action Plans, and measures Progress. Every Friday audit uses this framework to push every platform closer to excellence.",
    purpose: "Systematic quality improvement framework: Map → Analyze → Plan → Gap → Action → Progress.",
    userManual: [
      { step: 1, action: "Open MAP-GAP CQI", detail: "Navigate from sidebar to the CQI dashboard." },
      { step: 2, action: "Review Current State", detail: "See where each platform stands against quality targets." },
      { step: 3, action: "Identify Gaps", detail: "View the specific gaps between current state and 9/10 target." },
      { step: 4, action: "Create Action Plans", detail: "Build specific, measurable actions to close each gap." },
      { step: 5, action: "Track Progress", detail: "Monitor action plan completion and quality score changes." },
      { step: 6, action: "Run CQI Cycle", detail: "Complete the full MAP-GAP cycle and start the next iteration." },
    ],
    sop: {
      when: "Weekly as part of the Friday audit, after peer review cycles, when quality issues identified",
      frequency: "Weekly CQI cycle. Daily tracking of action items.",
      before: ["Complete peer review evaluation", "Gather platform performance data", "Review previous cycle's action items"],
      during: ["Map current quality scores", "Analyze gaps by platform", "Create or update action plans", "Assign responsibilities and deadlines"],
      after: ["Track action plan completion", "Measure quality score changes", "Document lessons learned", "Brief Dr. Flood on progress"],
    },
    logicalFlow: [
      { step: 1, action: "Map current state", detail: "Where is each platform today?" },
      { step: 2, action: "Analyze gaps", detail: "How far from 9/10 target?" },
      { step: 3, action: "Plan actions", detail: "What specific steps close the gap?" },
      { step: 4, action: "Execute actions", detail: "Do the work" },
      { step: 5, action: "Measure progress", detail: "Did quality improve?" },
      { step: 6, action: "Iterate", detail: "Start the next cycle" },
    ],
    whatToDoNext: [
      { moduleId: "peer-review", label: "Peer Review", reason: "Get fresh quality scores for the next cycle" },
      { moduleId: "ecosystem-ops-center", label: "Ops Center", reason: "Verify platform health supports quality goals" },
      { moduleId: "impact", label: "Impact Dashboard", reason: "Connect quality improvement to outcome measurement" },
    ],
    technicalReference: {
      dataSources: ["Peer review scores", "Platform performance metrics", "Action plan database", "Quality trend data"],
      standards: ["9/10 minimum target", "Evidence-based quality criteria", "PDSA (Plan-Do-Study-Act) cycle"],
      protocols: ["Weekly CQI cycle", "Action plans must be SMART", "Progress review every Friday", "Escalation for stalled improvements"],
    },
  },

  "mapgap-framework": {
    moduleId: "mapgap-framework",
    moduleName: "MAP-GAP Framework",
    icon: "FileText",
    story: "The MAP-GAP Framework is the strategic document that defines how quality improvement works across the ecosystem. It's the theory and methodology behind the CQI process — documenting the assessment criteria, scoring rubrics, and improvement protocols that every platform follows.",
    purpose: "Strategic quality improvement methodology documentation and framework management.",
    userManual: [
      { step: 1, action: "Open MAP-GAP Framework", detail: "Navigate from sidebar to the framework documentation." },
      { step: 2, action: "Review Assessment Criteria", detail: "See the criteria used to evaluate platform quality." },
      { step: 3, action: "Study Scoring Rubrics", detail: "Understand how scores are calculated and what constitutes each level." },
      { step: 4, action: "Review Improvement Protocols", detail: "See the standardized improvement protocols for common gaps." },
      { step: 5, action: "Update Framework", detail: "Modify framework elements based on lessons learned." },
    ],
    sop: {
      when: "During training, for reference during evaluations, when updating the framework",
      frequency: "Reference as needed. Framework review quarterly.",
      before: ["Review current framework version", "Gather feedback from CQI cycles", "Identify needed updates"],
      during: ["Study assessment criteria", "Apply rubrics consistently", "Follow improvement protocols", "Document any framework issues"],
      after: ["Submit feedback on framework", "Propose improvements", "Update documentation"],
    },
    logicalFlow: [
      { step: 1, action: "Study the framework", detail: "Understand the methodology" },
      { step: 2, action: "Apply consistently", detail: "Use same criteria everywhere" },
      { step: 3, action: "Gather feedback", detail: "What works? What doesn't?" },
      { step: 4, action: "Update and improve", detail: "Evolve the framework" },
    ],
    whatToDoNext: [
      { moduleId: "map-gap-cqi", label: "MAP-GAP CQI", reason: "Apply the framework in practice" },
      { moduleId: "peer-review", label: "Peer Review", reason: "Use framework criteria in evaluations" },
      { moduleId: "transparency-dashboard", label: "Transparency Dashboard", reason: "Share framework publicly" },
    ],
    technicalReference: {
      dataSources: ["Framework documentation database", "Version history", "Feedback records"],
      standards: ["Quality improvement science", "Baldrige Excellence Framework", "CQI best practices"],
      protocols: ["Quarterly framework review", "Version control for changes", "Stakeholder review before updates"],
    },
  },

  "transparency-dashboard": {
    moduleId: "transparency-dashboard",
    moduleName: "Transparency Dashboard",
    icon: "Eye",
    story: "Nonprofits that hide their numbers have something to hide. The Transparency Dashboard puts everything in the open — finances, outcomes, platform health, and quality scores. When a funder or community member asks 'how are you doing?', you can show them the real numbers. Transparency builds trust, and trust wins grants.",
    purpose: "Public-facing dashboard showing organizational finances, outcomes, and quality metrics.",
    userManual: [
      { step: 1, action: "Open Transparency Dashboard", detail: "Navigate from sidebar to the public metrics view." },
      { step: 2, action: "Review Financial Data", detail: "See revenue, expenses, and program spending breakdowns." },
      { step: 3, action: "Check Outcome Metrics", detail: "View key outcomes across all programs." },
      { step: 4, action: "Review Quality Scores", detail: "See current peer review scores and improvement trends." },
      { step: 5, action: "Share with Stakeholders", detail: "Generate shareable links or export reports." },
    ],
    sop: {
      when: "Monthly for updates, when preparing for funder meetings, for public reporting",
      frequency: "Update monthly. Review before any external presentation.",
      before: ["Verify data accuracy", "Review what's being shown publicly", "Check for sensitive information"],
      during: ["Update financial data", "Refresh outcome metrics", "Update quality scores", "Review public messaging"],
      after: ["Share updated dashboard with board", "Include link in funder communications", "Monitor public feedback"],
    },
    logicalFlow: [
      { step: 1, action: "Verify data", detail: "Is everything accurate and current?" },
      { step: 2, action: "Update metrics", detail: "Refresh all public-facing numbers" },
      { step: 3, action: "Review presentation", detail: "Does the story come through clearly?" },
      { step: 4, action: "Share broadly", detail: "Get this in front of stakeholders" },
    ],
    whatToDoNext: [
      { moduleId: "impact", label: "Impact Dashboard", reason: "Dive deeper into outcome data" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Use transparency data in grant applications" },
      { moduleId: "peer-review", label: "Peer Review", reason: "Update quality scores for transparency reporting" },
    ],
    technicalReference: {
      dataSources: ["Financial database", "Outcome aggregation engine", "Peer review scores", "Public data feed"],
      standards: ["GuideStar transparency standards", "IRS Form 990 alignment", "GAAP financial reporting"],
      protocols: ["Monthly data updates", "Quarterly board review", "Annual comprehensive report"],
    },
  },

  "coalition": {
    moduleId: "coalition",
    moduleName: "Coalition Hub",
    icon: "Handshake",
    story: "No nonprofit succeeds alone. The Coalition Hub manages relationships with every partner organization, tracks shared initiatives, and coordinates cross-organizational efforts. When you can show a funder that 15 organizations are aligned around the same goals, that's a proposal that wins.",
    purpose: "Manage coalition partnerships, shared initiatives, and cross-organizational coordination.",
    userManual: [
      { step: 1, action: "Open Coalition Hub", detail: "Navigate from sidebar to the partnership center." },
      { step: 2, action: "View Partner Organizations", detail: "See all coalition members with their roles and contributions." },
      { step: 3, action: "Track Shared Initiatives", detail: "Monitor progress on joint projects and campaigns." },
      { step: 4, action: "Coordinate Activities", detail: "Schedule and manage cross-organizational activities." },
      { step: 5, action: "Generate Coalition Reports", detail: "Create reports showing collective impact." },
    ],
    sop: {
      when: "During partnership activities, for coalition meetings, for collective impact reporting",
      frequency: "Weekly coordination. Monthly coalition meetings.",
      before: ["Review partner engagement status", "Prepare meeting agendas", "Gather progress updates"],
      during: ["Facilitate coordination", "Track commitments", "Document agreements", "Address conflicts"],
      after: ["Distribute meeting notes", "Track action items", "Update partnership records", "Report collective outcomes"],
    },
    logicalFlow: [
      { step: 1, action: "Review partnerships", detail: "Who's active? Who needs outreach?" },
      { step: 2, action: "Coordinate activities", detail: "What's happening across the coalition?" },
      { step: 3, action: "Track shared goals", detail: "Are we making collective progress?" },
      { step: 4, action: "Report impact", detail: "Show what we accomplish together" },
    ],
    whatToDoNext: [
      { moduleId: "community-map", label: "Community Map", reason: "Map coalition partner locations and services" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Find collaborative grant opportunities" },
      { moduleId: "impact", label: "Impact Dashboard", reason: "Measure collective impact" },
    ],
    technicalReference: {
      dataSources: ["Partner organization database", "MOU/agreement records", "Joint activity logs", "Collective impact metrics"],
      standards: ["Collective Impact framework", "Partnership agreement standards", "Shared measurement protocols"],
      protocols: ["Monthly coalition check-ins", "Quarterly strategic reviews", "Annual partnership renewals"],
    },
  },

  "case-studies": {
    moduleId: "case-studies",
    moduleName: "Case Studies",
    icon: "FileText",
    story: "Numbers tell the story, but case studies make it real. When a funder reads that a veteran went from homelessness to stable employment through your programs, that's what opens checkbooks. Case Studies captures and presents the human stories behind the data — with proper consent and narrative structure.",
    purpose: "Document and present participant success stories for funders, stakeholders, and community engagement.",
    userManual: [
      { step: 1, action: "Open Case Studies", detail: "Navigate from sidebar to the case study library." },
      { step: 2, action: "Browse Existing Studies", detail: "See published case studies organized by theme." },
      { step: 3, action: "Create New Case Study", detail: "Document a new success story with consent and narrative structure." },
      { step: 4, action: "Review and Edit", detail: "Refine the narrative and verify accuracy." },
      { step: 5, action: "Publish", detail: "Make the case study available for use in grants and presentations." },
    ],
    sop: {
      when: "When significant success stories emerge, for grant applications, for stakeholder presentations",
      frequency: "Monthly case study creation. Continuous collection.",
      before: ["Identify compelling stories", "Obtain participant consent", "Gather outcome data"],
      during: ["Conduct participant interview", "Write narrative", "Include supporting data", "Get participant approval"],
      after: ["Publish to case study library", "Tag for relevant grants", "Include in presentations", "Thank the participant"],
    },
    logicalFlow: [
      { step: 1, action: "Identify the story", detail: "Who has a compelling journey?" },
      { step: 2, action: "Get consent", detail: "Participant must agree" },
      { step: 3, action: "Gather the narrative", detail: "Interview and collect data" },
      { step: 4, action: "Write and review", detail: "Create the case study" },
      { step: 5, action: "Publish and use", detail: "Share with funders and stakeholders" },
    ],
    whatToDoNext: [
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Attach case studies to grant applications" },
      { moduleId: "impact", label: "Impact Dashboard", reason: "Connect stories to outcome data" },
      { moduleId: "transparency-dashboard", label: "Transparency Dashboard", reason: "Feature case studies publicly" },
    ],
    technicalReference: {
      dataSources: ["Participant records (with consent)", "Outcome data", "Interview transcripts", "Photo/media assets"],
      standards: ["Informed consent requirements", "Privacy protection", "Narrative ethics guidelines"],
      protocols: ["Written consent before any identification", "Participant review before publication", "Annual consent renewal"],
    },
  },

  "third-spaces": {
    moduleId: "third-spaces",
    moduleName: "Third Spaces",
    icon: "Coffee",
    story: "Third spaces are the places between home and work where community happens — community centers, libraries, coffee shops, parks. This module helps identify and activate third spaces where programs can be delivered, community can gather, and services can reach people where they already are.",
    purpose: "Identify and activate community third spaces for program delivery and engagement.",
    userManual: [
      { step: 1, action: "Open Third Spaces", detail: "Navigate from sidebar to the third spaces directory." },
      { step: 2, action: "Browse Locations", detail: "See available community spaces with capacity and amenities." },
      { step: 3, action: "Schedule Programming", detail: "Book spaces for program delivery or events." },
      { step: 4, action: "Track Engagement", detail: "Monitor attendance and community engagement at each space." },
      { step: 5, action: "Add New Spaces", detail: "Register new third spaces as they become available." },
    ],
    sop: {
      when: "For program location planning, community event scheduling, outreach strategy",
      frequency: "As needed for programming. Monthly space review.",
      before: ["Identify programming needs", "Check space availability", "Review capacity requirements"],
      during: ["Book appropriate spaces", "Coordinate logistics", "Set up for programming", "Track attendance"],
      after: ["Document attendance and feedback", "Thank space hosts", "Update space ratings", "Plan future use"],
    },
    logicalFlow: [
      { step: 1, action: "Identify the need", detail: "What program needs a space?" },
      { step: 2, action: "Search available spaces", detail: "What fits your requirements?" },
      { step: 3, action: "Book and prepare", detail: "Reserve and set up" },
      { step: 4, action: "Deliver programming", detail: "Run your event or program" },
      { step: 5, action: "Evaluate", detail: "Was the space effective?" },
    ],
    whatToDoNext: [
      { moduleId: "community-map", label: "Community Map", reason: "Map third spaces alongside other community resources" },
      { moduleId: "coalition", label: "Coalition Hub", reason: "Coordinate space use with coalition partners" },
      { moduleId: "program-management", label: "Program Management", reason: "Schedule program delivery at third spaces" },
    ],
    technicalReference: {
      dataSources: ["Space directory database", "Booking system", "Attendance records", "Space ratings"],
      standards: ["ADA accessibility requirements", "Capacity limits", "Safety requirements"],
      protocols: ["Space booking 2 weeks in advance", "Post-event feedback collection", "Quarterly space partnership review"],
    },
  },

  "voices-of-austin": {
    moduleId: "voices-of-austin",
    moduleName: "Voices of Austin",
    icon: "Mic",
    story: "Community voice isn't optional — it's essential. Voices of Austin captures what community members actually think, need, and experience. Through surveys, listening sessions, and community feedback, this module ensures programs are designed with the community, not just for the community.",
    purpose: "Community voice collection through surveys, listening sessions, and direct feedback.",
    userManual: [
      { step: 1, action: "Open Voices of Austin", detail: "Navigate from sidebar to the community voice hub." },
      { step: 2, action: "Review Community Feedback", detail: "See collected voices organized by theme and date." },
      { step: 3, action: "Create New Survey", detail: "Design a community survey for specific topics." },
      { step: 4, action: "Document Listening Sessions", detail: "Record and summarize community listening sessions." },
      { step: 5, action: "Analyze Themes", detail: "See common themes across community feedback." },
      { step: 6, action: "Connect to Programs", detail: "Link community voice data to program design decisions." },
    ],
    sop: {
      when: "During community engagement, program design, needs assessments",
      frequency: "Ongoing collection. Monthly theme analysis.",
      before: ["Design engagement approach", "Prepare survey or discussion questions", "Identify target community"],
      during: ["Collect feedback respectfully", "Document everything", "Note common themes", "Honor diverse perspectives"],
      after: ["Analyze themes", "Report findings to program teams", "Integrate into program design", "Follow up with community"],
    },
    logicalFlow: [
      { step: 1, action: "Plan engagement", detail: "Who do you need to hear from?" },
      { step: 2, action: "Collect voices", detail: "Surveys, sessions, feedback" },
      { step: 3, action: "Analyze themes", detail: "What is the community saying?" },
      { step: 4, action: "Apply insights", detail: "Use voice data in decisions" },
      { step: 5, action: "Close the loop", detail: "Tell the community how you used their input" },
    ],
    whatToDoNext: [
      { moduleId: "program-designer", label: "Program Designer", reason: "Design programs based on community voice" },
      { moduleId: "community-map", label: "Community Map", reason: "Identify communities for engagement" },
      { moduleId: "transparency-dashboard", label: "Transparency Dashboard", reason: "Share community voice findings publicly" },
    ],
    technicalReference: {
      dataSources: ["Survey platform", "Listening session transcripts", "Community feedback database", "Demographic data"],
      standards: ["Community engagement ethics", "Cultural responsiveness", "Data privacy for community members"],
      protocols: ["Informed consent for all feedback", "Multilingual survey options", "Community report-back within 30 days"],
    },
  },

  "cohort-onboarding": {
    moduleId: "cohort-onboarding",
    moduleName: "Cohort Onboarding",
    icon: "UserCheck",
    story: "Getting a new cohort of participants onboarded smoothly sets the tone for their entire experience. Cohort Onboarding manages the group enrollment process — from orientation to account setup to initial assessments. When 30 people walk in on day one, this makes sure nobody falls through the cracks.",
    purpose: "Manage group onboarding process for new participant cohorts.",
    userManual: [
      { step: 1, action: "Open Cohort Onboarding", detail: "Navigate from sidebar to start the onboarding process." },
      { step: 2, action: "Create New Cohort", detail: "Define the cohort name, start date, and capacity." },
      { step: 3, action: "Enroll Participants", detail: "Add participants to the cohort individually or in bulk." },
      { step: 4, action: "Schedule Orientation", detail: "Set up the orientation session schedule." },
      { step: 5, action: "Track Completion", detail: "Monitor each participant's onboarding progress." },
      { step: 6, action: "Launch Cohort", detail: "Mark onboarding complete and begin program activities." },
    ],
    sop: {
      when: "When starting a new program cohort, quarterly intake periods",
      frequency: "Per cohort. Typically quarterly or as programs launch.",
      before: ["Define cohort parameters", "Prepare orientation materials", "Set up participant accounts", "Brief staff on onboarding process"],
      during: ["Register all participants", "Conduct orientation", "Complete initial assessments", "Distribute materials", "Assign mentors if applicable"],
      after: ["Verify all participants completed onboarding", "Follow up with incomplete registrations", "Launch cohort into active programming", "Report enrollment numbers"],
    },
    logicalFlow: [
      { step: 1, action: "Define the cohort", detail: "Name, dates, capacity" },
      { step: 2, action: "Enroll participants", detail: "Get everyone registered" },
      { step: 3, action: "Conduct orientation", detail: "Welcome and introduce the program" },
      { step: 4, action: "Complete assessments", detail: "Baseline measurements" },
      { step: 5, action: "Launch into programming", detail: "Cohort is ready to begin" },
    ],
    whatToDoNext: [
      { moduleId: "intake-wizard", label: "Intake Wizard", reason: "Complete individual intakes for cohort members" },
      { moduleId: "workforce-training", label: "Workforce Training", reason: "Begin training for the cohort" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track cohort through the pipeline" },
    ],
    technicalReference: {
      dataSources: ["Cohort management database", "Participant enrollment system", "Orientation tracking", "Assessment records"],
      standards: ["WIOA enrollment documentation", "Program eligibility verification", "Group size limits"],
      protocols: ["Orientation within first week", "All assessments within 10 days", "Cohort launch within 2 weeks of enrollment"],
    },
  },

  "outcome-reporting": {
    moduleId: "outcome-reporting",
    moduleName: "Outcome Reporting",
    icon: "BarChart3",
    story: "Funders want to know one thing: did it work? Outcome Reporting turns raw program data into clear, compelling reports that show what changed because of your work. It pulls from every platform in the ecosystem to create comprehensive outcome stories — the kind that get grants renewed.",
    purpose: "Comprehensive outcome reporting for funders, pulling data from all ecosystem platforms.",
    userManual: [
      { step: 1, action: "Open Outcome Reporting", detail: "Navigate from sidebar to the reporting center." },
      { step: 2, action: "Select Report Type", detail: "Choose funder report, board report, or custom report." },
      { step: 3, action: "Set Report Period", detail: "Define the time period for the report." },
      { step: 4, action: "Select Data Sources", detail: "Choose which platforms and programs to include." },
      { step: 5, action: "Generate Report", detail: "Create the report with auto-populated data." },
      { step: 6, action: "Review and Export", detail: "Review for accuracy, then export in desired format." },
    ],
    sop: {
      when: "Per funder reporting schedule, quarterly for board, annually for comprehensive review",
      frequency: "Per funder requirements. Minimum quarterly.",
      before: ["Check funder reporting requirements", "Verify data accuracy across platforms", "Gather any narrative supplements needed"],
      during: ["Generate automated report", "Review all data points for accuracy", "Add narrative context", "Include case studies where appropriate"],
      after: ["Submit to funder", "File for records", "Share with board", "Note any data quality issues for improvement"],
    },
    logicalFlow: [
      { step: 1, action: "Know your audience", detail: "Who's reading this report?" },
      { step: 2, action: "Set the parameters", detail: "What period and programs?" },
      { step: 3, action: "Generate data", detail: "Pull from all relevant platforms" },
      { step: 4, action: "Add narrative", detail: "Context and stories behind the numbers" },
      { step: 5, action: "Review and submit", detail: "Quality check then deliver" },
    ],
    whatToDoNext: [
      { moduleId: "impact", label: "Impact Dashboard", reason: "Deeper analysis of outcome trends" },
      { moduleId: "grant-hub", label: "Grant Hub", reason: "Attach reports to grant applications" },
      { moduleId: "case-studies", label: "Case Studies", reason: "Include human stories in reports" },
    ],
    technicalReference: {
      dataSources: ["All 23 ecosystem platform databases", "Grant requirements database", "Narrative library", "Case study repository"],
      standards: ["Funder-specific reporting templates", "DOL Common Measures", "Foundation reporting guidelines"],
      protocols: ["Data verification before reporting", "Supervisor review before submission", "Archival of all submitted reports"],
    },
  },

  "austin-housing-initiative": {
    moduleId: "austin-housing-initiative",
    moduleName: "Austin Housing Initiative",
    icon: "Home",
    story: "Housing is the foundation everything else is built on. You can't train for a job, attend classes, or manage your health without a stable place to live. The Austin Housing Initiative connects participants to housing resources, tracks housing stability, and coordinates with housing partners across the Austin area.",
    purpose: "Connect participants to housing resources and track housing stability in the Austin area.",
    userManual: [
      { step: 1, action: "Open Housing Initiative", detail: "Navigate from sidebar to the Austin housing hub." },
      { step: 2, action: "Search Housing Resources", detail: "Find available housing options by type, location, and eligibility." },
      { step: 3, action: "Make Referrals", detail: "Connect participants to housing services." },
      { step: 4, action: "Track Housing Status", detail: "Monitor participant housing stability over time." },
      { step: 5, action: "Coordinate Partners", detail: "Work with housing organizations across Austin." },
    ],
    sop: {
      when: "When participants need housing assistance, for housing stability tracking",
      frequency: "As needed for referrals. Monthly stability reviews.",
      before: ["Assess participant housing situation", "Check available resources", "Review eligibility criteria"],
      during: ["Search for matching housing options", "Create referrals", "Coordinate with housing partners", "Document housing plan"],
      after: ["Follow up on referral outcomes", "Track housing stability", "Report housing metrics", "Update resource directory"],
    },
    logicalFlow: [
      { step: 1, action: "Assess housing need", detail: "What's the participant's situation?" },
      { step: 2, action: "Search resources", detail: "What housing is available?" },
      { step: 3, action: "Make referral", detail: "Connect to best option" },
      { step: 4, action: "Follow up", detail: "Was housing secured?" },
      { step: 5, action: "Track stability", detail: "Is housing maintained?" },
    ],
    whatToDoNext: [
      { moduleId: "resource-finder", label: "Resource Finder", reason: "Find additional support services" },
      { moduleId: "community-map", label: "Community Map", reason: "Map housing resources geographically" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Housing stability supports workforce success" },
    ],
    technicalReference: {
      dataSources: ["Housing resource database", "HMIS integration", "Partner organization data", "Participant housing records"],
      standards: ["HUD housing quality standards", "Fair Housing compliance", "CoC coordinated entry"],
      protocols: ["48-hour response for emergency housing", "Monthly stability check-ins", "Annual housing needs assessment"],
    },
  },

  "manor-community-hub": {
    moduleId: "manor-community-hub",
    moduleName: "Manor Community Hub",
    icon: "MapPin",
    story: "Manor is growing fast but services haven't kept up. The Manor Community Hub brings ThriveUp's ecosystem directly to Manor residents — connecting them to workforce training, health services, and community resources without having to drive to Austin. It's about meeting people where they are.",
    purpose: "Localized service hub bringing ecosystem resources to the Manor community.",
    userManual: [
      { step: 1, action: "Open Manor Hub", detail: "Navigate from sidebar to the Manor-specific dashboard." },
      { step: 2, action: "View Local Resources", detail: "See services and programs available in Manor." },
      { step: 3, action: "Connect Residents", detail: "Help Manor residents access ecosystem services." },
      { step: 4, action: "Track Community Metrics", detail: "Monitor service utilization and outcomes in Manor." },
      { step: 5, action: "Coordinate Local Partners", detail: "Work with Manor-specific partner organizations." },
    ],
    sop: {
      when: "For Manor-specific service delivery and community engagement",
      frequency: "Daily for service delivery. Weekly for community outreach.",
      before: ["Review Manor service schedule", "Check local resource availability", "Prepare outreach materials"],
      during: ["Deliver services to Manor residents", "Track utilization", "Collect community feedback", "Coordinate with local partners"],
      after: ["Report Manor-specific metrics", "Update resource directory", "Plan future programming", "Brief on community needs"],
    },
    logicalFlow: [
      { step: 1, action: "Review local needs", detail: "What does Manor need?" },
      { step: 2, action: "Deliver services", detail: "Bring ecosystem resources locally" },
      { step: 3, action: "Track outcomes", detail: "Are Manor residents being served?" },
      { step: 4, action: "Engage community", detail: "Build relationships in Manor" },
      { step: 5, action: "Report and plan", detail: "What's next for Manor?" },
    ],
    whatToDoNext: [
      { moduleId: "community-map", label: "Community Map", reason: "Map Manor resources and service gaps" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track Manor workforce outcomes" },
      { moduleId: "voices-of-austin", label: "Voices of Austin", reason: "Collect Manor community voice" },
    ],
    technicalReference: {
      dataSources: ["Manor service delivery data", "Local resource directory", "Community demographics", "Partner organization data"],
      standards: ["Same quality standards as Austin hub", "Cultural responsiveness for Manor demographics"],
      protocols: ["Weekly Manor presence", "Monthly community meeting", "Quarterly needs assessment"],
    },
  },

  "pflugerville-community-hub": {
    moduleId: "pflugerville-community-hub",
    moduleName: "Pflugerville Community Hub",
    icon: "MapPin",
    story: "Pflugerville is one of the fastest-growing cities in Texas, and with growth comes new challenges — families needing services, workers needing training, communities needing connection. The Pflugerville Hub extends the ecosystem's reach to this growing community, ensuring they have access to the same quality programs and services.",
    purpose: "Localized service hub bringing ecosystem resources to the Pflugerville community.",
    userManual: [
      { step: 1, action: "Open Pflugerville Hub", detail: "Navigate from sidebar to the Pflugerville-specific dashboard." },
      { step: 2, action: "View Local Resources", detail: "See services and programs available in Pflugerville." },
      { step: 3, action: "Connect Residents", detail: "Help Pflugerville residents access ecosystem services." },
      { step: 4, action: "Track Community Metrics", detail: "Monitor service utilization and outcomes in Pflugerville." },
      { step: 5, action: "Coordinate Local Partners", detail: "Work with Pflugerville-specific partner organizations." },
    ],
    sop: {
      when: "For Pflugerville-specific service delivery and community engagement",
      frequency: "Daily for service delivery. Weekly for community outreach.",
      before: ["Review Pflugerville service schedule", "Check local resource availability", "Prepare outreach materials"],
      during: ["Deliver services to Pflugerville residents", "Track utilization", "Collect community feedback", "Coordinate with local partners"],
      after: ["Report Pflugerville-specific metrics", "Update resource directory", "Plan future programming", "Brief on community needs"],
    },
    logicalFlow: [
      { step: 1, action: "Review local needs", detail: "What does Pflugerville need?" },
      { step: 2, action: "Deliver services", detail: "Bring ecosystem resources locally" },
      { step: 3, action: "Track outcomes", detail: "Are Pflugerville residents being served?" },
      { step: 4, action: "Engage community", detail: "Build relationships in Pflugerville" },
      { step: 5, action: "Report and plan", detail: "What's next for Pflugerville?" },
    ],
    whatToDoNext: [
      { moduleId: "community-map", label: "Community Map", reason: "Map Pflugerville resources and service gaps" },
      { moduleId: "workforce-dashboard", label: "Workforce Dashboard", reason: "Track Pflugerville workforce outcomes" },
      { moduleId: "voices-of-austin", label: "Voices of Austin", reason: "Collect Pflugerville community voice" },
    ],
    technicalReference: {
      dataSources: ["Pflugerville service delivery data", "Local resource directory", "Community demographics", "Partner organization data"],
      standards: ["Same quality standards as Austin hub", "Cultural responsiveness for Pflugerville demographics"],
      protocols: ["Weekly Pflugerville presence", "Monthly community meeting", "Quarterly needs assessment"],
    },
  },

  "ecosystem-hub": {
    moduleId: "ecosystem-hub",
    moduleName: "Ecosystem Hub",
    icon: "Globe",
    story: "The Ecosystem Hub is the public-facing view of the entire 15-service-platform ACOS ecosystem. It shows how all the pieces fit together, what each platform does, and how they interconnect to create a comprehensive support system. When a funder asks 'what exactly do you do?', this is the answer.",
    purpose: "Public-facing overview of the complete 15-service-platform ecosystem and how platforms interconnect.",
    userManual: [
      { step: 1, action: "Open Ecosystem Hub", detail: "Navigate from sidebar to the ecosystem overview." },
      { step: 2, action: "View All Platforms", detail: "See all 15 service platforms with their descriptions and roles." },
      { step: 3, action: "Explore Connections", detail: "See how platforms connect and share data." },
      { step: 4, action: "Check Health Status", detail: "Quick health check of the entire ecosystem." },
      { step: 5, action: "Share Overview", detail: "Generate shareable ecosystem overview for funders." },
    ],
    sop: {
      when: "For stakeholder presentations, grant applications, new staff orientation",
      frequency: "Update as platforms change. Reference as needed.",
      before: ["Review for accuracy", "Check all platform descriptions are current", "Verify connection diagrams"],
      during: ["Present ecosystem overview", "Answer questions about platform functions", "Demonstrate interconnections"],
      after: ["Update any outdated information", "Gather feedback from audience", "Refine presentation"],
    },
    logicalFlow: [
      { step: 1, action: "Present the ecosystem", detail: "Show all 15 service platforms" },
      { step: 2, action: "Explain interconnections", detail: "How they work together" },
      { step: 3, action: "Demonstrate value", detail: "Why this matters for outcomes" },
      { step: 4, action: "Connect to mission", detail: "How it serves the community" },
    ],
    whatToDoNext: [
      { moduleId: "ecosystem-ops-center", label: "Ops Center", reason: "Monitor ecosystem health in detail" },
      { moduleId: "ecosystem-connector", label: "Ecosystem Connector", reason: "Manage platform connections" },
      { moduleId: "impact", label: "Impact Dashboard", reason: "Show ecosystem-wide outcomes" },
    ],
    technicalReference: {
      dataSources: ["Platform registry", "Connection topology", "Health status feeds", "Platform descriptions"],
      standards: ["Consistent platform naming", "Accurate capability descriptions", "Current connection status"],
      protocols: ["Monthly description reviews", "Real-time health monitoring", "Stakeholder-ready at all times"],
    },
  },
};

export function getAllModuleIds(): string[] {
  return Object.keys(MODULE_GUIDES);
}

export function getGuideForModule(moduleId: string): GuideSection | null {
  return MODULE_GUIDES[moduleId] || null;
}

export function generateFullManual(): string {
  const guides = Object.values(MODULE_GUIDES);
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("  THRIVEUP ACADEMY — COMPLETE OPERATIONS MANUAL");
  lines.push("  The Collaborative Advocate | ACOS Ecosystem");
  lines.push("  Generated: " + new Date().toLocaleDateString());
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("TABLE OF CONTENTS");
  lines.push("─────────────────");
  guides.forEach((g, i) => {
    lines.push(`  ${i + 1}. ${g.moduleName}`);
  });
  lines.push("");
  lines.push("");

  guides.forEach((guide, index) => {
    lines.push(`${"═".repeat(60)}`);
    lines.push(`  MODULE ${index + 1}: ${guide.moduleName.toUpperCase()}`);
    lines.push(`${"═".repeat(60)}`);
    lines.push("");

    lines.push("THE STORY");
    lines.push("─────────");
    lines.push(guide.story);
    lines.push("");

    lines.push("PURPOSE");
    lines.push("───────");
    lines.push(guide.purpose);
    lines.push("");

    lines.push("USER MANUAL");
    lines.push("───────────");
    guide.userManual.forEach(step => {
      lines.push(`  Step ${step.step}: ${step.action}`);
      lines.push(`    ${step.detail}`);
    });
    lines.push("");

    lines.push("STANDARD OPERATING PROCEDURE");
    lines.push("────────────────────────────");
    lines.push(`  When to use: ${guide.sop.when}`);
    lines.push(`  Frequency: ${guide.sop.frequency}`);
    lines.push("");
    lines.push("  BEFORE:");
    guide.sop.before.forEach(b => lines.push(`    • ${b}`));
    lines.push("  DURING:");
    guide.sop.during.forEach(d => lines.push(`    • ${d}`));
    lines.push("  AFTER:");
    guide.sop.after.forEach(a => lines.push(`    • ${a}`));
    lines.push("");

    lines.push("LOGICAL FLOW — WHAT TO DO");
    lines.push("─────────────────────────");
    guide.logicalFlow.forEach(step => {
      lines.push(`  ${step.step}. ${step.action} → ${step.detail}`);
    });
    lines.push("");

    lines.push("WHAT TO DO NEXT");
    lines.push("───────────────");
    guide.whatToDoNext.forEach(next => {
      lines.push(`  → ${next.label}: ${next.reason}`);
    });
    lines.push("");

    lines.push("TECHNICAL REFERENCE");
    lines.push("───────────────────");
    lines.push("  Data Sources:");
    guide.technicalReference.dataSources.forEach(ds => lines.push(`    • ${ds}`));
    lines.push("  Standards:");
    guide.technicalReference.standards.forEach(s => lines.push(`    • ${s}`));
    lines.push("  Protocols:");
    guide.technicalReference.protocols.forEach(p => lines.push(`    • ${p}`));
    lines.push("");
    lines.push("");
  });

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("  END OF COMPLETE OPERATIONS MANUAL");
  lines.push(`  ${guides.length} Modules Documented`);
  lines.push("  The Collaborative Advocate — ACOS Ecosystem");
  lines.push("═══════════════════════════════════════════════════════════");

  return lines.join("\n");
}

export function generateModuleManual(moduleId: string): string | null {
  const guide = MODULE_GUIDES[moduleId];
  if (!guide) return null;

  const lines: string[] = [];

  lines.push(`${"═".repeat(60)}`);
  lines.push(`  ${guide.moduleName.toUpperCase()} — OPERATIONS MANUAL`);
  lines.push(`  The Collaborative Advocate | ACOS Ecosystem`);
  lines.push(`  Generated: ${new Date().toLocaleDateString()}`);
  lines.push(`${"═".repeat(60)}`);
  lines.push("");

  lines.push("THE STORY");
  lines.push("─────────");
  lines.push(guide.story);
  lines.push("");

  lines.push("PURPOSE");
  lines.push("───────");
  lines.push(guide.purpose);
  lines.push("");

  lines.push("USER MANUAL");
  lines.push("───────────");
  guide.userManual.forEach(step => {
    lines.push(`  Step ${step.step}: ${step.action}`);
    lines.push(`    ${step.detail}`);
  });
  lines.push("");

  lines.push("STANDARD OPERATING PROCEDURE");
  lines.push("────────────────────────────");
  lines.push(`  When to use: ${guide.sop.when}`);
  lines.push(`  Frequency: ${guide.sop.frequency}`);
  lines.push("");
  lines.push("  BEFORE:");
  guide.sop.before.forEach(b => lines.push(`    • ${b}`));
  lines.push("  DURING:");
  guide.sop.during.forEach(d => lines.push(`    • ${d}`));
  lines.push("  AFTER:");
  guide.sop.after.forEach(a => lines.push(`    • ${a}`));
  lines.push("");

  lines.push("LOGICAL FLOW — WHAT TO DO");
  lines.push("─────────────────────────");
  guide.logicalFlow.forEach(step => {
    lines.push(`  ${step.step}. ${step.action} → ${step.detail}`);
  });
  lines.push("");

  lines.push("WHAT TO DO NEXT");
  lines.push("───────────────");
  guide.whatToDoNext.forEach(next => {
    lines.push(`  → ${next.label}: ${next.reason}`);
  });
  lines.push("");

  lines.push("TECHNICAL REFERENCE");
  lines.push("───────────────────");
  lines.push("  Data Sources:");
  guide.technicalReference.dataSources.forEach(ds => lines.push(`    • ${ds}`));
  lines.push("  Standards:");
  guide.technicalReference.standards.forEach(s => lines.push(`    • ${s}`));
  lines.push("  Protocols:");
  guide.technicalReference.protocols.forEach(p => lines.push(`    • ${p}`));
  lines.push("");

  lines.push(`${"═".repeat(60)}`);
  lines.push(`  END OF ${guide.moduleName.toUpperCase()} MANUAL`);
  lines.push(`${"═".repeat(60)}`);

  return lines.join("\n");
}
