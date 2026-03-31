import type { SectionTutorialProps } from "@/components/section-tutorial";

type TutorialDef = Omit<SectionTutorialProps, "sectionName"> & { sectionName: string };

export const SECTION_TUTORIALS: Record<string, TutorialDef> = {
  dashboard: {
    sectionName: "dashboard",
    headline: "How to Use Your Dashboard",
    description: "Your personal command center — track progress, attendance, and daily engagement at a glance.",
    accentColor: "blue",
    steps: [
      { title: "Check your daily streak", description: "The attendance tracker shows your consecutive days of engagement. Log in daily to maintain your streak and earn recognition.", tip: "Streaks reset after 48 hours of inactivity — even weekends count." },
      { title: "Review your progress metrics", description: "The progress cards show completion rates across curriculum modules, assessments, and community activities.", tip: "Click any metric card to drill down into specific areas." },
      { title: "Follow your recommended next steps", description: "The AI companion suggests your next learning activity based on your pathway, progress, and goals." },
      { title: "Check community highlights", description: "See what's happening across the ThriveUp ecosystem — new events, peer achievements, and resource updates." },
    ],
    examples: [
      { title: "New Workforce Trainee — First Week", scenario: "Maria just enrolled in the CHW certification pathway. Her dashboard shows 0/12 modules complete, suggests starting with Module 1 (Community Health Foundations), and highlights an upcoming virtual orientation session.", outcome: "Maria clicks the suggested module and begins her first lesson. Her streak counter starts at Day 1." },
      { title: "Returning Veteran — Career Transition", scenario: "James, a recently separated Army veteran, logs into his dashboard. It shows his MOS translation progress (60% complete), upcoming mentor session with a civilian hiring manager, and 3 new job matches from the employer connections tool.", outcome: "James reviews his job matches and schedules a mock interview through the Mentor Network." },
    ],
    tips: [
      "Your dashboard personalizes based on your role — student, parent, workforce trainee, or administrator each see different widgets.",
      "The AI companion learns from your activity patterns and will proactively suggest resources when you seem stuck.",
      "Export your progress report anytime from the sidebar for use in grant reporting or personal records.",
    ],
  },

  "ecosystem-hub": {
    sectionName: "ecosystem-hub",
    headline: "How to Use the Ecosystem Hub",
    description: "Monitor all 24 ThriveUp platforms in real time — health status, data flows, compliance grades, and coordination.",
    accentColor: "cyan",
    steps: [
      { title: "Check the health dashboard", description: "The platform grid shows real-time status for all 24 platforms. Green = online, red = offline, yellow = degraded. The hub pinger checks every 10 minutes.", tip: "Platforms that were sleeping get 'woken up' automatically by the pinger." },
      { title: "Review platform triads", description: "Platforms are organized into functional triads (Health Core, Education & Youth, Safety & Accessibility, etc.). Each triad has a lead platform responsible for coordination.", tip: "Click any platform card to see its full capability profile and data flow connections." },
      { title: "Check compliance grades", description: "Each platform receives a letter grade (A-F) based on directive acknowledgment. The hub has 89 active directives covering identity, integration, and grant alignment." },
      { title: "Monitor data flows", description: "The ecosystem map shows which platforms send and receive data from each other. Look for bottlenecks or disconnected platforms." },
    ],
    examples: [
      { title: "Grant Reviewer Verification", scenario: "A St. David's Foundation reviewer asks 'How do your platforms actually work together?' You open the Ecosystem Hub and show all 24 platforms online with real-time health checks, organized into 8 functional triads with bidirectional data flows.", outcome: "The reviewer sees live proof that this isn't a slide deck — it's a functioning ecosystem with verifiable health metrics and integration depth." },
      { title: "Platform Outage Response", scenario: "Shield Atlas shows 'offline' status. You check the health logs and see it went down 30 minutes ago. The pinger automatically tried the .replit.app fallback URL and woke it up on the next cycle.", outcome: "Shield Atlas returns to 'online' status within 10 minutes without any manual intervention. The incident is logged for compliance reporting." },
    ],
    tips: [
      "The Ecosystem Hub is your strongest proof point for grant applications — it shows real, live infrastructure, not just plans.",
      "Use the 'Wake All' function before a demo to ensure all 24 platforms are responsive.",
      "Each platform's grant alignment tags tell you exactly which grant narratives it supports.",
    ],
  },

  "grant-packages": {
    sectionName: "grant-packages",
    headline: "How to Use Grant Packages",
    description: "Generate complete, grant-ready document packages with auto-populated data from across the ecosystem.",
    accentColor: "green",
    steps: [
      { title: "Select your target grant", description: "Choose from active grants: WIOA, St. David's Health Equity, We All Benefit 2.0, SSG Fox VA, or Foundation grants. Each has pre-configured requirements and data sources.", tip: "The system knows which platforms align with each grant and pulls only relevant data." },
      { title: "Review auto-populated sections", description: "The package builder pulls live data from platform metrics, Census demographics, outcome reports, and staffing plans to fill narrative sections automatically." },
      { title: "Customize and refine", description: "Edit any auto-generated section. The AI narrative builder can rephrase, expand, or tighten language to match funder expectations.", tip: "Use 'funder voice' mode to match the tone and vocabulary each foundation prefers." },
      { title: "Export your package", description: "Download as PDF, Word, or share a live link. Packages include the narrative, budget justification, logic model, org chart, and supporting data tables." },
    ],
    examples: [
      { title: "St. David's Health Equity ($1M)", scenario: "You're preparing the St. David's collaborative health equity application. The system pulls Travis County health disparity data, CHW deployment metrics from Sankofa Health Network, maternal health outcomes from the Black Maternal Health Hub, and SafeCogniCare elder care data — all auto-populated into the required format.", outcome: "A 40-page grant package with live data citations, logic model, and budget justification — assembled in 20 minutes instead of 3 weeks." },
      { title: "SSG Fox VA ($750K)", scenario: "The SSG Fox application requires veteran transition outcome data. The package builder pulls Mission Transition (M2C) career placement rates, Whole-Person Health crisis intervention metrics, and LifeBridge housing stability data for veteran participants.", outcome: "Every data point in the narrative is traceable to a live platform with verifiable metrics — no invented numbers." },
      { title: "Austin FC Dream Starter ($100K)", scenario: "You need to show community impact in Austin. The system pulls data from the Austin Initiative page, Voices of Austin community input, and Third Spaces mapping to demonstrate neighborhood-level engagement.", outcome: "A focused 10-page application that ties youth program outcomes directly to Austin community development goals." },
    ],
    tips: [
      "Always run 'Refresh Data' before generating a package to ensure you have the latest platform metrics.",
      "The RPLICE Tools page can generate Census data analyses for any city — use these to strengthen your demographic justification.",
      "Save package templates after customizing them — they become reusable for future grant cycles.",
    ],
  },

  "justice-command-center": {
    sectionName: "justice-command-center",
    headline: "How to Use the Justice Command Center",
    description: "Criminal justice analytics, data storytelling, and evidence-based intervention planning across 25+ cities.",
    accentColor: "red",
    steps: [
      { title: "Start with the Data Storyteller", description: "Select any preset city (Wilmington NC, Austin TX, Buffalo NY, and 20+ more) or enter a custom city. The system pulls live Census demographics, gun violence data, and neighborhood conditions.", tip: "The Data Storyteller is the default tab — it's designed to be your first stop." },
      { title: "Generate a data story", description: "Click 'Generate Data Story' to have the AI weave gun violence statistics, demographic data, and neighborhood conditions into a compelling narrative. Add context like 'Focus on the school-to-prison pipeline' for targeted analysis.", tip: "Add optional context to guide the AI — mention specific neighborhoods, schools, or themes." },
      { title: "Explore the Crime Map & Overlays", description: "Switch to the Crime Map tab to see neighborhood-level gun violence data overlaid with poverty rates, school locations, and community resources.", tip: "Dr. Flood's principle: county averages lie — tract-level data tells the truth. Zoom into neighborhoods." },
      { title: "Use for grant narratives", description: "Every data story and map visualization can be exported and embedded in grant applications as evidence of community need." },
    ],
    examples: [
      { title: "Buffalo, NY — East Side Disparity", scenario: "Select Buffalo NY from the preset cities. The system reveals that the East Side (predominantly Black neighborhoods around Orchard Park/Hamburg) has gun violence rates 8x higher than West Side neighborhoods, with poverty above 40% and household income below $22,000.", outcome: "A data story that proves crime doesn't just 'happen' — it maps directly to disinvestment, poverty concentration, and educational access gaps. This becomes grant evidence." },
      { title: "Wilmington, NC — Creekwood to Laney Pipeline", scenario: "Select Wilmington and add context: 'Focus on Creekwood neighborhood feeding into Laney High School.' The AI analyzes how housing project conditions, school discipline rates, and limited employment options create a pipeline from neighborhood to justice system.", outcome: "A neighborhood-level narrative connecting housing → school → outcomes that demonstrates exactly where intervention dollars should go." },
      { title: "Austin, TX — East vs. North Disparity", scenario: "Select Austin and explore the gentrification corridor. East Austin (historically Black/Latino) shows displacement patterns as property values rise, while crime migrates with displaced populations into North Austin suburbs.", outcome: "Data proving Dr. Flood's principle: crime migrates with gentrification. When you push people out of neighborhoods, the problems follow — they don't disappear." },
    ],
    tips: [
      "Dr. Flood's core insight: 2-parent households below 60% → poverty above 17% — every single time. The data stories prove this.",
      "Education is the #1 protective factor. The Data Storyteller connects educational access to crime outcomes automatically.",
      "Compare two cities side-by-side to show that these patterns are national, not local — funders need to see systemic evidence.",
      "Use the 'Risk Assessment' view to identify intervention priority zones within any city.",
    ],
  },

  "rplice-tools": {
    sectionName: "rplice-tools",
    headline: "How to Use RPLICE Research Tools",
    description: "Pull live Census data, generate demographic analyses, and build evidence bases for any community in America.",
    accentColor: "purple",
    steps: [
      { title: "Select a region", description: "Choose from preset regions (Buffalo NY, Wilmington NC, Austin TX, San Antonio TX, Houston TX) or enter any county by FIPS code. The system pulls live American Community Survey data.", tip: "Use the preset regions first to see what the tool can do, then try your own community." },
      { title: "Review the demographic dashboard", description: "The tool displays poverty rates, median income, educational attainment, race/ethnicity breakdown, housing data, and health insurance coverage — all from Census Bureau ACS 5-year estimates." },
      { title: "Generate a disparity analysis", description: "The AI analyzes the data through an implementation science lens — identifying disparities, protective factors, risk indicators, and intervention opportunities.", tip: "The analysis uses Dr. Flood's 7 disciplines framework: Implementation Science, Criminal Justice, HR Management, I-O Psychology, Education, Social Science, Healthcare & Public Health." },
      { title: "Export for grant writing", description: "Every data point and analysis can be exported as formatted sections ready to paste into grant narratives. Citations are auto-generated." },
    ],
    examples: [
      { title: "Travis County for St. David's Application", scenario: "Select Austin TX (Travis County). The tool pulls ACS data showing median household income of $75,413 overall — but when broken down by tract, East Austin tracts show $32,000-$38,000. This disparity within the county average is exactly what St. David's wants to see.", outcome: "A demographic profile that exposes within-county disparities — proving Dr. Flood's principle that county averages mask the truth. This becomes the 'Community Need' section of the St. David's application." },
      { title: "Erie County for Buffalo Analysis", scenario: "Select Buffalo NY (Erie County). The tool reveals that the East Side has poverty rates above 40%, educational attainment below high school for 28% of adults, and single-parent household rates above 65%.", outcome: "An evidence base showing that every protective factor (education, household structure, income) is below threshold in specific neighborhoods — making the case for targeted intervention." },
      { title: "Grant Budget Justification", scenario: "You need to justify hiring 5 Community Health Workers for a $250K grant. The RPLICE tool pulls population density, health access gaps, and language barriers for the target census tracts to calculate the CHW-to-population ratio.", outcome: "Data-driven staffing justification: 'At 1 CHW per 2,500 residents in underserved tracts, 5 CHWs cover the 12,500 residents in target neighborhoods with documented health access barriers.'" },
    ],
    tips: [
      "The Census API has daily rate limits — if you hit the limit, the tool will tell you. Try again the next day or use cached data.",
      "Always compare county-level to tract-level data. The disparity between them is often the strongest argument in a grant narrative.",
      "The 'Generate Grant Data Package' button creates a formatted output ready for copy-paste into applications.",
      "Save analyses — they persist and can be updated when new ACS data releases annually.",
    ],
  },

  "program-engine": {
    sectionName: "program-engine",
    headline: "How to Use the Program Engine",
    description: "Design, deploy, and track evidence-based programs with built-in implementation science frameworks.",
    accentColor: "amber",
    steps: [
      { title: "Choose a program template or start fresh", description: "The engine includes templates for CHW deployment, youth workforce, veteran transition, maternal health, and more — each pre-loaded with evidence-based components and outcome measures." },
      { title: "Configure your program parameters", description: "Set your target population, geographic area, duration, staffing model, and budget. The engine auto-calculates dosage requirements (how much service each participant needs).", tip: "Use the dosage calculator — funders love seeing that you know exactly how much intervention each participant needs." },
      { title: "Map to implementation frameworks", description: "Every program is mapped to CFIR (implementation barriers/facilitators) and RE-AIM (reach, effectiveness, adoption, implementation, maintenance). This generates your evaluation plan automatically." },
      { title: "Deploy and track", description: "Once designed, the program deploys across relevant ecosystem platforms. Outcome data flows back automatically for real-time monitoring." },
    ],
    examples: [
      { title: "CHW Certification Program — Travis County", scenario: "You design a 12-week Community Health Worker certification program targeting 30 participants in East Austin. The engine calculates: 48 contact hours per participant, 3 CHW instructors needed, $4,200 per-participant cost, and maps the curriculum to Texas DSHS CHW competencies.", outcome: "A fully designed program with budget, staffing, curriculum, and evaluation plan — ready to submit as part of a WIOA or St. David's grant application." },
      { title: "Youth Workforce Development — Summer Program", scenario: "You need a 6-week summer workforce program for 50 youth ages 16-24 in Pflugerville. The engine templates include WIOA youth elements (tutoring, work experience, leadership), calculates per-participant costs, and assigns platforms: WholeMind (academic), Panther Village (engagement), Workforce Dashboard (tracking).", outcome: "A WIOA-compliant youth program design with all 14 required youth elements addressed, dosage calculations, and a logic model showing inputs → activities → outputs → outcomes." },
    ],
    tips: [
      "Every program designed here automatically generates a logic model — save yourself hours of manual work.",
      "The 'Program Lifecycle' page shows where each program is in its implementation journey.",
      "Link programs to specific grants so outcome data flows into your grant reporting automatically.",
    ],
  },

  "program-designer": {
    sectionName: "program-designer",
    headline: "How to Use the Program Designer",
    description: "Interactive drag-and-drop program design with AI-assisted component selection and evidence mapping.",
    accentColor: "teal",
    steps: [
      { title: "Define your program's core identity", description: "Name your program, set the target population, geography, and primary outcomes you want to achieve. The AI suggests evidence-based program components based on your inputs." },
      { title: "Select program components", description: "Choose from a library of evidence-based components: case management, peer mentoring, skills training, crisis intervention, health navigation, etc. Each component shows its evidence base and required resources." },
      { title: "Set outcome measures", description: "For each component, the designer suggests validated outcome measures (e.g., PHQ-9 for depression, employment rates for workforce programs). These become your evaluation framework.", tip: "Funders want to see validated instruments — the designer only suggests measures with published reliability data." },
      { title: "Generate your program document", description: "Export a complete program design document including theory of change, logic model, implementation timeline, and evaluation plan." },
    ],
    examples: [
      { title: "Veteran Peer Support Network", scenario: "You're designing a peer support program for recently separated veterans in the Austin metro. The designer suggests: battle buddy pairing (evidence: VA peer support RCTs), MOS career translation workshops, benefits navigation, and crisis safety planning (C-SSRS protocol).", outcome: "A 4-component program with validated outcomes (PCL-5 for PTSD, PHQ-9 for depression, employment at 90 days) mapped to Mission Transition (M2C) and Whole-Person Health platforms." },
      { title: "Community Health Worker Pipeline", scenario: "You design a CHW training-to-employment pipeline. The designer maps: classroom instruction (48 hrs), supervised practicum (160 hrs), certification exam prep, and employer placement. Each phase has completion criteria and quality benchmarks.", outcome: "A workforce pipeline program that satisfies both WIOA performance indicators and Texas DSHS CHW certification requirements in a single design." },
    ],
    tips: [
      "Use the 'Evidence Strength' indicators — programs with strong evidence bases score higher in competitive grant reviews.",
      "The designer connects to RPLICE Tools — you can pull demographic data directly into your program rationale.",
      "Save designs as templates so you can quickly adapt them for different communities or funders.",
    ],
  },

  "staffing-plan": {
    sectionName: "staffing-plan",
    headline: "How to Use the Staffing Plan",
    description: "Build org charts, calculate FTE requirements, and generate budget-ready staffing justifications for grants.",
    accentColor: "orange",
    steps: [
      { title: "Review the org structure", description: "The staffing plan shows TCAF's organizational structure — from Dr. Terry Flood (Executive Director) through program directors, coordinators, and frontline staff. Each position shows FTE allocation, salary range, and funding source." },
      { title: "Add or modify positions", description: "Add new positions for grant applications. The system auto-calculates fully-loaded costs (salary + 25% fringe benefits) and maps positions to specific grant budgets.", tip: "When adding a position for a specific grant, tag it with the grant name — the grant package builder will pull it automatically." },
      { title: "Generate staffing justifications", description: "For each position, the system generates a narrative justification explaining why the role is necessary, what the person will do, and how their work connects to program outcomes." },
      { title: "Export for budget narratives", description: "Export the staffing plan as a formatted table with position title, FTE, annual salary, fringe, total cost, and funding source — ready for grant budget sections." },
    ],
    examples: [
      { title: "St. David's Health Equity Staffing", scenario: "The $1M St. David's application needs a staffing plan. You add: 1 Program Director (1.0 FTE, $75K), 2 Program Coordinators (1.0 FTE each, $52K), 5 Community Health Workers (1.0 FTE each, $42K), and 1 Data Analyst (0.5 FTE, $60K). Total personnel: $539K including fringe.", outcome: "A staffing table with justifications like: 'Community Health Workers will maintain caseloads of 50 participants each, conducting home visits, health screenings, and resource navigation in target census tracts where CHW-to-population ratios currently exceed 1:15,000.'" },
      { title: "SSG Fox VA Team Structure", scenario: "The $750K SSG Fox application requires veteran-specific staffing. You build a team: Veteran Transition Coordinator, 3 Peer Support Specialists (all veterans themselves), Benefits Navigator, and Crisis Response Specialist. Each role is justified with veteran population data.", outcome: "A veteran-focused staffing plan where every hire has military experience requirements justified by research showing veteran peer support improves engagement by 3x over civilian-only staff." },
    ],
    tips: [
      "Use the '3 Business Entities' structure: TCAF (nonprofit programs), CIP LLC (consulting/contracts), M&T Consulting (technical services).",
      "Fringe benefit rates vary by funder — St. David's typically accepts 25%, federal grants may require actual rates.",
      "Include in-kind contributions to show organizational commitment beyond the grant ask.",
    ],
  },

  "presentations": {
    sectionName: "presentations",
    headline: "How to Use Stakeholder Presentations",
    description: "Generate funder-ready presentation decks with live ecosystem data, outcome metrics, and community evidence.",
    accentColor: "purple",
    steps: [
      { title: "Select your audience", description: "Choose the presentation type: Foundation/Funder, Government Agency, Community Partners, Corporate Sponsors, or Board of Directors. Each audience gets a tailored narrative and emphasis." },
      { title: "Choose included sections", description: "Toggle sections on/off: Mission & Vision, Ecosystem Overview, Platform Demo, Outcome Data, Community Need, Budget Summary, Team Bios, and Ask/Call to Action." },
      { title: "Review auto-generated slides", description: "The system generates presentation content using live data from the ecosystem. Outcome metrics, platform counts, and demographic data are pulled in real-time.", tip: "Every number in the presentation is traceable to a live data source — no invented statistics." },
      { title: "Present or export", description: "Present directly from the browser or export as PDF. The live version updates in real-time if platform data changes." },
    ],
    examples: [
      { title: "St. David's Foundation Meeting", scenario: "You're meeting with Christina Thompson at St. David's. The presentation emphasizes: Travis County health disparities (Census data), 24-platform ecosystem (live health status), CHW deployment model (staffing plan), and health equity outcomes (platform metrics).", outcome: "A 15-slide deck where every data point is live — when the reviewer asks 'Are these real numbers?' you can click through to the actual platform dashboards." },
      { title: "WIOA Board Presentation", scenario: "You're presenting to the local workforce board. The deck focuses on: youth employment outcomes, training completion rates, employer partner count, credential attainment, and follow-up employment at 6 and 12 months.", outcome: "A workforce-focused presentation that speaks the board's language — WIOA performance indicators, common measures, and cost-per-participant calculations." },
    ],
    tips: [
      "Always do a 'Refresh Data' before a live presentation to ensure metrics are current.",
      "The 'Ecosystem Story' page provides the narrative arc — use it as your opening before diving into data.",
      "Keep funder meetings to 15 slides max. The detail lives in the grant package — the presentation sells the vision.",
    ],
  },

  "coalition": {
    sectionName: "coalition",
    headline: "How to Use the Coalition Dashboard",
    description: "Track partner organizations, shared goals, and collaborative impact across the ThriveUp coalition.",
    accentColor: "orange",
    steps: [
      { title: "View coalition members", description: "See all partner organizations, their roles (lead, support, data, aligned), and contribution areas. Each partner's engagement level and last activity is tracked." },
      { title: "Track shared objectives", description: "Coalition objectives show progress across all partners. Each objective has measurable targets, assigned leads, and timeline milestones.", tip: "Shared objectives map directly to grant deliverables — when a coalition partner achieves a milestone, it counts for everyone." },
      { title: "Monitor collaborative activities", description: "See joint events, cross-referrals, shared trainings, and coordinated outreach. Activity logs show which partners are actively engaged vs. passive." },
      { title: "Generate coalition reports", description: "Export coalition activity reports for grant compliance. These show funder that the 'collaborative' in your application is real, not just a letter of support." },
    ],
    examples: [
      { title: "St. David's Collaborative Requirement", scenario: "St. David's Health Equity grants require genuine collaboration, not just MOUs. The Coalition Dashboard shows 12 active partner organizations with documented cross-referrals, joint programming, and shared data.", outcome: "Evidence of real collaboration: 'In Q1, partner organizations made 89 cross-referrals, co-hosted 6 community events, and shared participant outcome data across 4 health platforms.'" },
      { title: "Austin FC Community Partnership", scenario: "The Dream Starter application needs to show community roots. The Coalition Dashboard displays partnerships with Austin-area schools, community centers, faith organizations, and youth-serving nonprofits.", outcome: "A partner map showing deep community integration — not a new organization parachuting in, but one embedded in the community fabric." },
    ],
    tips: [
      "Active partners (logged activity in the last 30 days) carry more weight than passive partners in grant reviews.",
      "Track letters of support and MOUs here — the system flags which partners have submitted them and which haven't.",
      "Coalition data feeds directly into grant package narratives under 'Collaborative Approach' sections.",
    ],
  },

  "workforce-dashboard": {
    sectionName: "workforce-dashboard",
    headline: "How to Use the Workforce Dashboard",
    description: "Track participant enrollment, training progress, credential attainment, and employment outcomes across all workforce programs.",
    accentColor: "blue",
    steps: [
      { title: "Review enrollment funnel", description: "See how many participants are at each stage: referred → enrolled → active → completed → employed. Drop-off rates between stages identify where people fall through the cracks.", tip: "High drop-off between 'enrolled' and 'active' usually means barriers to attendance — childcare, transportation, or schedule conflicts." },
      { title: "Monitor training completion", description: "Track which programs have the highest completion rates and which need intervention. Real-time progress bars show cohort advancement." },
      { title: "Track credential attainment", description: "See how many participants have earned industry-recognized credentials, certifications, or licenses. This is a primary WIOA performance indicator." },
      { title: "Measure employment outcomes", description: "Employment at exit, 6-month follow-up, and 12-month follow-up rates. Median earnings data shows wage impact.", tip: "WIOA requires 2nd and 4th quarter follow-up employment — make sure your tracking captures these specific timeframes." },
    ],
    examples: [
      { title: "CHW Cohort Tracking", scenario: "Cohort 1 (January start, 30 participants): 28 completed classroom training, 25 passed the certification exam, 22 are employed as CHWs within 90 days. The dashboard shows a 73% enrollment-to-employment conversion rate.", outcome: "Grant-ready outcome data: '73% of enrolled participants achieved CHW certification and employment within 90 days, exceeding the 60% target and demonstrating program effectiveness.'" },
      { title: "WIOA Performance Reporting", scenario: "The workforce board needs quarterly WIOA common measures. The dashboard auto-calculates: Employment Rate 2nd Quarter (78%), Employment Rate 4th Quarter (71%), Median Earnings ($34,200), Credential Attainment (82%), Measurable Skill Gains (91%).", outcome: "One-click WIOA performance report that meets federal reporting requirements without manual data compilation." },
    ],
    tips: [
      "The 'Dosage Report' page connects here — it shows whether participants are getting enough service hours to achieve outcomes.",
      "Flag participants who miss 2+ consecutive sessions — early intervention prevents dropout.",
      "Employment outcome data is the #1 metric funders care about. Make sure every employed graduate is documented.",
    ],
  },

  "ops-center": {
    sectionName: "ops-center",
    headline: "How to Use the Operations Center",
    description: "Real-time operational monitoring of all 24 platforms, enforcement cycles, heartbeat tracking, and system-wide coordination.",
    accentColor: "rose",
    steps: [
      { title: "Monitor system health", description: "The ops center shows every platform's status, last heartbeat time, response latency, and any active alerts. Green across the board means the ecosystem is fully operational." },
      { title: "Review enforcement cycles", description: "See which platforms have acknowledged their directives (compliance grades A-F). Non-compliant platforms are flagged with specific unacknowledged directives listed." },
      { title: "Check heartbeat timing", description: "Each platform sends a heartbeat signal. Stale heartbeats (>24 hours) indicate the platform may need attention or has connectivity issues.", tip: "Stale heartbeats don't always mean a platform is down — it may just mean the heartbeat endpoint isn't configured." },
      { title: "Trigger manual operations", description: "Use the manual controls to force a ping cycle, re-send directives, or generate an ad-hoc compliance report." },
    ],
    examples: [
      { title: "Pre-Demo Health Check", scenario: "Before a funder meeting, you open the Ops Center to verify all 24 platforms are online. You see 22 online, 2 degraded. You trigger a manual wake cycle and both degraded platforms come back to full health within 2 minutes.", outcome: "When the funder asks for a live demo, every single platform responds — proving the ecosystem is real and operational, not vaporware." },
      { title: "Weekly Compliance Report", scenario: "You generate the weekly report card: Hub is Grade A (100%), 5 platforms are Grade B (80%+), 12 are Grade C (50%+), 6 are Grade F (not started). You identify the F-grade platforms and send them specific remediation instructions.", outcome: "A documented compliance improvement trajectory — from 1 compliant platform to 18 over 6 weeks — showing continuous quality improvement for grant reporting." },
    ],
    tips: [
      "The Ops Center is the 'proof of life' for the entire ecosystem — bookmark it for quick access before any meeting.",
      "Compliance grades improve when platforms acknowledge directives with real evidence URLs — not auto-generated responses.",
      "The enforcement engine runs twice daily (6 AM and 6 PM CST). Manual triggers supplement but don't replace the schedule.",
    ],
  },

  "case-studies": {
    sectionName: "case-studies",
    headline: "How to Use Case Studies",
    description: "Real-world examples of ThriveUp's impact — ready-to-use narratives for grant applications and stakeholder meetings.",
    accentColor: "green",
    steps: [
      { title: "Browse by category", description: "Case studies are organized by domain: Health Equity, Workforce Development, Criminal Justice, Youth Development, Veteran Services, and Community Building." },
      { title: "Read the full narrative", description: "Each case study follows a standard format: Challenge → Approach → Platforms Used → Outcomes → Lessons Learned. This matches the format most funders expect." },
      { title: "Copy for grant applications", description: "Each case study has a 'Copy for Grant' button that formats the narrative for direct paste into applications, with proper citations and data references.", tip: "Customize the opening paragraph to match your specific funder's language and priorities." },
      { title: "Link to live data", description: "Case studies reference live platform data — click any metric to see the current value in the source platform." },
    ],
    examples: [
      { title: "East Austin Health Navigation", scenario: "A case study documenting how 3 Sankofa Health platforms (Health Network, Feminine Health, Maternal Health) coordinated to provide wraparound health services in 78702 and 78721 zip codes. 150 participants received health navigation, 89% connected to a primary care provider within 30 days.", outcome: "A compelling narrative for St. David's: 'Through coordinated health navigation across three specialized platforms, TCAF connected 150 East Austin residents to primary care — closing the access gap in neighborhoods where 34% of adults had no usual source of care.'" },
      { title: "Veteran Transition Success", scenario: "A case study of the first M2C cohort: 25 recently separated veterans, 22 completed the transition program, 20 employed within 90 days, with median starting salary of $48,000. One participant's story (anonymized) shows the journey from separation anxiety to civilian career launch.", outcome: "Human-centered evidence for SSG Fox: real outcomes with a real story that funders remember long after the numbers fade." },
    ],
    tips: [
      "Funders remember stories, not statistics. Lead with the human narrative, then back it up with data.",
      "Case studies that show failure + learning + improvement are more credible than ones that claim perfection.",
      "Update case studies quarterly with fresh outcome data to keep them current for rolling grant deadlines.",
    ],
  },

  "business-plan": {
    sectionName: "business-plan",
    headline: "How to Use the Business Plan",
    description: "The comprehensive organizational blueprint — entity structure, revenue model, growth projections, and sustainability strategy.",
    accentColor: "amber",
    steps: [
      { title: "Understand the 3-entity structure", description: "TCAF (501(c)(3), EIN 41-3618003) handles nonprofit programs and grants. CIP LLC (EIN 41-4996540) manages consulting contracts. M&T Consulting (EIN 41-4952178) provides technical services. Each entity has a distinct revenue purpose.", tip: "When applying for grants, always use TCAF. CIP and M&T handle earned revenue to maintain sustainability beyond grant funding." },
      { title: "Review the revenue model", description: "The business plan shows how grants, contracts, consulting fees, and platform licensing create a diversified revenue stream. No single funding source exceeds 30% of total revenue.", tip: "Diversified revenue is the #1 thing sustainability reviewers look for in grant applications." },
      { title: "Check growth projections", description: "Year 1-5 projections show realistic growth tied to specific milestones: grant awards, platform launches, community partnerships, and participant enrollment." },
      { title: "Export for applications", description: "Many foundation grants require a business plan or sustainability plan. Export the relevant sections formatted for the specific funder's requirements." },
    ],
    examples: [
      { title: "Sustainability Section for St. David's", scenario: "St. David's wants to know 'How will this continue after our funding ends?' The business plan shows: Year 1-2 grant-funded build, Year 2-3 earned revenue from CIP consulting contracts begins, Year 3-5 platform licensing and Medicaid reimbursement for CHW services create ongoing revenue.", outcome: "A credible sustainability narrative: 'By Year 3, TCAF projects 40% of operating costs covered by earned revenue through CHW Medicaid reimbursement ($52/visit) and CIP consulting contracts, reducing grant dependence from 90% to 55%.'" },
      { title: "Board Governance for Foundation Applications", scenario: "Foundation grants require evidence of strong governance. The business plan includes board composition (7 members), meeting frequency (quarterly), committee structure (Finance, Programs, Governance), and conflict of interest policies.", outcome: "A governance section that demonstrates organizational maturity — critical for large grants ($500K+) where funders need confidence in fiscal management." },
    ],
    tips: [
      "The 3-entity structure isn't unusual for nonprofits — many have affiliated LLCs for earned revenue. Explain it clearly so funders don't see it as a red flag.",
      "Always include Cash App ($MRTDFLOOD) and PayPal (paypal.me/TERRYFLOODCEO) as community donation channels in the revenue diversification section.",
      "Update financial projections quarterly — stale numbers undermine credibility.",
    ],
  },
};
