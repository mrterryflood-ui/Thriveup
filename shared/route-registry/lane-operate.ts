/** Phase 2 classification lane — operate. Keys are App.tsx route paths. */
import type { RouteClassificationLane } from "../route-registry.types";

export const LANE_OPERATE: RouteClassificationLane = {
  "/academy/admin": {
    title: "Admin Dashboard", description: "Review Academy students, activity, support notes, safety reports, and grant metrics.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy"], downstream: ["/academy"],
    guide: "Need to manage the Academy → Admin Dashboard → review students and resolve reports",
  },
  "/academy/admin-tutorial": {
    title: "Admin Guide", description: "Read a slide-by-slide walkthrough of Academy management features and implementation planning.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy/admin"], downstream: ["/academy"],
    guide: "Need management instructions → Admin Guide → use the Academy tools",
  },
  "/academy/attendance": {
    title: "Attendance", description: "Monitor student login activity, attendance summaries, and login streaks.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy/admin", "/teacher-dashboard"], downstream: ["/academy"],
    guide: "Need to check engagement → Attendance → review student login patterns",
  },
  "/academy/integration": {
    title: "Support Portal", description: "Review the Academy support-portal integration guide, data-sync descriptions, and external API endpoints.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy/admin"], downstream: ["/academy"],
    guide: "Need to connect student support → Support Portal → open the external portal or check the API",
  },
  "/academy/longitudinal": {
    title: "Longitudinal Dashboard", description: "Review student pathways, approve plan revisions, manage mentor requests, and update alumni records.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy/admin"], downstream: ["/academy"],
    guide: "Need to follow student development → Longitudinal Dashboard → review pathways and pending requests",
  },
  "/academy/risk-monitor": {
    title: "Risk Monitor", description: "Review student financial-risk decisions and configure notification thresholds for support.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy/admin"], downstream: ["/academy"], access: "staff",
    guide: "Need to identify support needs → Risk Monitor → review decisions and adjust alerts",
  },
  "/academy/student-wizard": {
    title: "Student Setup Wizards", description: "Work through learning-preference, career-pathway, and quarterly-review forms that do not persist selections to an API.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/academy/admin"], downstream: ["/academy"],
    guide: "Need to personalize student support → Student Setup Wizards → review the generated summary",
  },
  "/academy/tutorial": {
    title: "Arthur's Journey", description: "Follow a fictional student's Academy journey and open the learning features used in each chapter.",
    outcome: "learn", audiences: ["students-youth", "resident-family", "nonprofit-cbo"], upstream: ["/academy"], downstream: ["/academy", "/curriculum", "/ai-companion"],
    guide: "Need to understand the Academy → Arthur's Journey → start your own learning journey",
  },
  "/admin/platform-health": {
    title: "Platform Health Monitor", description: "Inspect live system counts, service health, AI provider status, and probe-alert email failures.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/ops-center"], downstream: [], access: "admin",
    guide: "Need to check platform reliability → Platform Health Monitor → refresh status and investigate failures",
  },
  "/admin/studio": {
    title: "Prompt-to-Publish Studio", description: "Generate, edit, validate, publish, and export module manifests with version history.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/tools"], downstream: [],
    guide: "Need to publish a platform tool → Prompt-to-Publish Studio → validate and publish its manifest",
  },
  "/admin/trade-sims-signups": {
    title: "Trade Sims Signups", description: "Review trade-simulation signups and trigger a signup email digest.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/academy/trade-sims", "/academy/admin"], downstream: [],
    guide: "Need to review simulator signups → Trade Sims Signups → refresh records or send a digest",
  },
  "/apex-accelerators": {
    title: "APEX Accelerators", description: "Find an APEX center and review government-contracting counseling, registrations, and certification resources.",
    outcome: "operate", audiences: ["nonprofit-cbo", "veterans"], upstream: ["/business-plan", "/grants"], downstream: ["/business-plan", "/grants", "/ecosystem-story"],
    guide: "Need contracting guidance → APEX Accelerators → contact an APEX counselor",
  },
  "/austin-community-bridge/readiness": {
    title: "Austin EBI Planning", description: "Record intervention protocols, proposed adaptations, evidence, evaluation contracts, and independent planning-approval gates.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/austin-community-bridge/deliverable"], downstream: ["/austin-community-bridge/deliverable", "/community-map", "/resources"],
    guide: "Need approval before action → Austin EBI Planning → document evidence and request planning review",
  },
  "/business-card": {
    title: "Business Card Designer", description: "Customize, preview, and print a TCAF business card in several themes.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/business-documents", "/tools"], downstream: [],
    guide: "Need a TCAF business card → Business Card Designer → preview and print the design",
  },
  "/business-documents": {
    title: "Business Documents", description: "Review entity profiles and document-status checklists, then copy or print available document text.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/business-plan", "/tools"], downstream: [],
    guide: "Need organizational paperwork → Business Documents → copy available text and identify missing documents",
  },
  "/business-plan": {
    title: "Business Plan", description: "Read the ecosystem's organizational model, capabilities, funding strategy, and partnership overview.",
    outcome: "learn", audiences: ["nonprofit-cbo", "funder-evaluator", "agency-government"], upstream: ["/apex-accelerators", "/about"], downstream: ["/contact", "/about", "/ecosystem-story"],
    guide: "Need to understand the organizational model → Business Plan → explore capabilities or discuss a partnership",
  },
  "/case-manager": {
    title: "Review case-management approach", description: "Inspect a demonstration risk-chain profile, protective factors, recommended interventions, and compliance events.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government", "caregivers-chws"], upstream: ["/resident-journey", "/reentry"], downstream: ["/resident-journey"],
    guide: "Need to understand the staff case-review lens → Case-management demonstration → compare the resident view",
  },
  "/case-manager/:id": {
    title: "Review case-management approach", description: "Inspect the same demonstration risk-chain profile regardless of the route's ID parameter.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government", "caregivers-chws"], upstream: ["/resident-journey"], downstream: ["/resident-journey"], access: "staff",
    guide: "Need a staff case-review example → Case-management demonstration → compare the resident view",
  },
  "/childcore-integration": {
    title: "ChildCORE Integration", description: "Probe the ChildCORE connection and inspect community-data previews, AI context, API events, and aggregate youth metrics.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/ops-center"], downstream: [],
    guide: "Need to verify partner integration → ChildCORE Integration → test access and inspect returned data",
  },
  "/chw-dashboard": {
    title: "Community health worker tools", description: "Review caseloads, log visits, submit referrals, and browse resource and professional-training tools with labeled sample resources.",
    outcome: "operate", audiences: ["caregivers-chws", "nonprofit-cbo"], upstream: ["/partner-portal", "/health-network"], downstream: ["/resources", "/shadow-worker-hub"],
    guide: "Need CHW support tools → Community health worker tools → log a visit, submit a referral, or find verified resources",
  },
  "/classrooms": {
    title: "Classrooms", description: "Create classrooms, join with an invite code, and open classroom details.",
    outcome: "learn", audiences: ["students-youth", "nonprofit-cbo", "agency-government"], upstream: ["/teacher-dashboard", "/academy"], downstream: ["/classrooms/wizard", "/classrooms/:classroomId"], access: "authenticated",
    guide: "Need a learning group → Classrooms → create or join a classroom",
  },
  "/classrooms/wizard": {
    title: "Classroom Wizard", description: "Generate classroom objectives, activities, and welcome text with AI, then create the classroom.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/classrooms"], downstream: ["/classrooms/:classroomId", "/classrooms"], access: "authenticated",
    guide: "Need a tailored classroom → Classroom Wizard → review suggestions and create the classroom",
  },
  "/consortium-proposals": {
    title: "Consortium Proposals", description: "Build multi-organization proposals, assign partner sections, merge narratives, and send configured payloads to GrantPathPro.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/proposal-command", "/grants"], downstream: [],
    guide: "Need a joint proposal → Consortium Proposals → assign sections and merge the team narrative",
  },
  "/cqi": {
    title: "MAP-GAP CQI", description: "Manage improvement cycles, record gaps and interventions, and track reassessment and evaluation measures.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/program-lifecycle", "/program-designer"], downstream: [],
    guide: "Need to improve delivery → MAP-GAP CQI → record gaps and reassess interventions",
  },
  "/curriculum-documents": {
    title: "Curriculum Docs", description: "Browse standards-aligned curriculum documents and open or create teaching guides and lesson plans.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/teacher-dashboard", "/curriculum"], downstream: ["/curriculum-documents/new", "/curriculum-documents/:id", "/teacher-dashboard"],
    guide: "Need teaching documents → Curriculum Docs → open a guide or create a document",
  },
  "/directive-compliance": {
    title: "Grant Tracking & Standards Alignment", description: "Review grant readiness, Texas standards alignment, ecosystem compliance, and resend pending platform directives.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/ops-center"], downstream: [],
    guide: "Need to check ecosystem compliance → Grant Tracking & Standards Alignment → review gaps or resend directives",
  },
  "/foster-youth/cohort-analytics": {
    title: "Foster Youth Cohort Analytics", description: "Review foster-youth intake counts, AI analyses, document activity, state breakdowns, and recent intake summaries.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/foster-youth"], downstream: ["/foster-youth"],
    guide: "Need to monitor foster-youth intake → Cohort Analytics → review recent records and activity",
  },
  "/funder-dashboard": {
    title: "Manage Funder Dashboards", description: "Create funder accounts and open or copy token-gated impact-report links.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/ops-center"], downstream: ["/funder/:shareToken"], access: "staff",
    guide: "Need to share funder impact → Manage Funder Dashboards → create an account and share its report",
  },
  "/grant-narrative": {
    title: "RFP / Narrative Writer", description: "Upload solicitation text, extract its rubric, generate and score a grant narrative, and export the draft.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/my-grants", "/rfp-fidelity", "/grant-packages"], downstream: ["/onboarding/org"],
    guide: "Need an RFP-aligned draft → RFP / Narrative Writer → review the rubric and export a revised narrative",
  },
  "/grant-packages": {
    title: "Grant Packages", description: "Assemble funder-specific submission packages with narratives, review checklists, reminders, and execution tasks.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/grants/applications"], downstream: ["/grants", "/grant-narrative", "/program-designer"],
    guide: "Need a complete submission package → Grant Packages → review requirements and prepare submission",
  },
  "/grant-prior-awards": {
    title: "Prior Award Research", description: "Review prior-award research sources and record abstracts reviewed for active proposal pursuits.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/proposal-pipeline", "/grants"], downstream: [],
    guide: "Need funder context before drafting → Prior Award Research → read abstracts and record research",
  },
  "/grants": {
    title: "Live Grant Opportunities", description: "Discover, analyze, ingest, and track funding opportunities with organization-aligned scoring and grant reports.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/my-grants", "/teaming-network", "/grant-packages"], downstream: [],
    guide: "Need an aligned funding opportunity → Live Grant Opportunities → track a pursuit or ingest its solicitation",
  },
  "/grants/applications": {
    title: "Application Tracker", description: "Review a predefined set of joint funding packages, document checklists, deadlines, and submission portals.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grant-packages", "/grants"], downstream: ["/grants"],
    guide: "Need to prepare an active application → Application Tracker → complete the checklist and open the submission portal",
  },
  "/grants/sedgwick-vitality": {
    title: "Sedgwick Vitality (RFP 26-0028)", description: "Review and download the Sedgwick weight-management proposal and strategic analysis, and join its collaboration workspace.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/teaming-network", "/grants"], downstream: ["/grants"],
    guide: "Need to review the Sedgwick bid → Sedgwick Vitality → download the proposal or join its workspace",
  },
  "/healthcare-grants": {
    title: "Healthcare Grants Catalog", description: "Browse health-focused funding opportunities and compare their alignment with the organization's healthcare platforms.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/business-plan"], downstream: ["/transparency-matrix"],
    guide: "Need healthcare funding leads → Healthcare Grants Catalog → review fit and verify the source opportunity",
  },
  "/loi-writer": {
    title: "LOI Writer", description: "Generate and edit a letter of intent and review implementation-framework validation results.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/coalition-portal"], downstream: [],
    guide: "Need a letter of intent → LOI Writer → edit the draft and review validation",
  },
  "/mce-contracts": {
    title: "MCE Contracts", description: "Manage contract opportunities, vendors, compliance tasks, certifications, and contract financial tracking.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/program-management", "/tools"], downstream: [],
    guide: "Need to manage contracting → MCE Contracts → update the pipeline and compliance tasks",
  },
  "/my-grants": {
    title: "My Grants & Win Rate", description: "Update tracked grant statuses, award amounts, and notes while reviewing the organization's recorded win rate.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/teaming-network"], downstream: ["/grants", "/grant-narrative", "/won-proposals"],
    guide: "Need to track funding pursuits → My Grants & Win Rate → update decisions or write a draft",
  },
  "/ops-center": {
    title: "Ops Center", description: "Monitor ecosystem platforms, wake sleeping services, configure keep-alive behavior, and verify deliverables.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/tools"], downstream: ["/funder-dashboard"],
    guide: "Need to manage platform operations → Ops Center → check services and verify deliverables",
  },
  "/organization/events": {
    title: "Community Events & Impact", description: "Manage private organization event plans, attendance, community needs, follow-up work, and learning reports.",
    outcome: "operate", audiences: ["nonprofit-cbo", "caregivers-chws"], upstream: ["/partner-portal", "/settings/organization"], downstream: ["/settings/organization"], access: "staff",
    guide: "Need to coordinate an organization's events → Community Events & Impact → record participation and plan follow-up",
  },
  "/parents": {
    title: "Parent Resources", description: "Explore parent digital-skills and prevention resources, workshop information, and links to your child's progress.",
    outcome: "learn", audiences: ["resident-family", "caregivers-chws"], upstream: ["/academy", "/parents/dashboard"], downstream: ["/parent-education", "/parents/dashboard", "/community"],
    guide: "Need to support your child's learning → Parent Resources → open a module or review their progress",
  },
  "/partner-dashboard/shared/:token": {
    title: "View a Shared Partner Dashboard", description: "View an organization's token-shared community indicators, statement of need, and benefits catalog.",
    outcome: "see-the-data", audiences: ["nonprofit-cbo", "funder-evaluator", "agency-government"], upstream: ["/partner-dashboard"], downstream: ["/for-nonprofits", "/partner-dashboard"],
    guide: "Need to review shared community evidence → Shared Partner Dashboard → inspect indicators or get your own dashboard",
  },
  "/partner-portal": {
    title: "Organization Dashboard", description: "Review organization-specific tools and readiness, manage intake capacity, and open profile, document, and event workspaces.",
    outcome: "operate", audiences: ["nonprofit-cbo", "caregivers-chws"], upstream: ["/onboarding/org", "/settings/organization"], downstream: ["/settings/organization", "/settings/documents", "/organization/events"],
    guide: "Need to coordinate organization work → Organization Dashboard → update capacity or open a workspace",
  },
  "/pm-academy": {
    title: "PM Academy", description: "Explore program-management learning tracks, course-module outlines, practice projects, and career pathways.",
    outcome: "learn", audiences: ["nonprofit-cbo", "agency-government", "resident-family"], upstream: ["/program-management", "/tools"], downstream: [],
    guide: "Need program-management skills → PM Academy → choose a track and study its modules",
  },
  "/prevention-strategies": {
    title: "Prevention Strategies", description: "Compare prevention programs and track local implementations, fidelity, and evaluation information.",
    outcome: "operate", audiences: ["nonprofit-cbo", "caregivers-chws", "agency-government"], upstream: ["/prevention", "/program-management"], downstream: [],
    guide: "Need an evidence-informed prevention approach → Prevention Strategies → compare programs and track implementation",
  },
  "/program-designer": {
    title: "Program Designer", description: "Describe a community problem and context, generate an AI-assisted intervention design, and review its implementation plan.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/program-lifecycle", "/grant-packages"], downstream: ["/grants", "/cqi"],
    guide: "Need an intervention design → Program Designer → review the plan and connect funding or improvement work",
  },
  "/program-engine": {
    title: "Program Engine", description: "Create programs and manage stakeholders, phases, success measures, milestones, risks, and updates.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/program-management", "/tools"], downstream: [],
    guide: "Need to execute a program → Program Engine → launch the program and maintain its operating picture",
  },
  "/program-lifecycle": {
    title: "Program Lifecycle", description: "Explore a predefined program portfolio across lifecycle stages, platform roles, and displayed fidelity measures.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grant-packages", "/program-designer"], downstream: ["/program-designer", "/transparency", "/cqi"],
    guide: "Need a program-lifecycle overview → Program Lifecycle → open design or improvement tools",
  },
  "/program-management": {
    title: "Program Management", description: "Manage grant projects, staffing, facilities, schedules, compliance deadlines, in-kind match, and sustainability plans.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/business-plan", "/pm-academy"], downstream: [],
    guide: "Need to manage funded delivery → Program Management → update project resources and compliance",
  },
  "/proposal-command": {
    title: "Proposal Command", description: "Paste a solicitation, generate and refine a proposal using organization details, and export the resulting document.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/tools"], downstream: [],
    guide: "Need a proposal draft → Proposal Command → review, refine, and export the document",
  },
  "/regional-briefing": {
    title: "Regional Briefing", description: "Generate geographic briefings, compare locations, ask follow-up questions, and save reusable workflows or action plans.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/community-map", "/tools"], downstream: ["/rplice-tools"],
    guide: "Need a regional planning brief → Regional Briefing → review evidence and save an action plan",
  },
  "/rfp-fidelity": {
    title: "RFP Fidelity Engine", description: "Select an uploaded solicitation to review requirement coverage, compliance gaps, and pre-submission audits.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/grant-narrative"], downstream: ["/grant-narrative", "/grants/:grantId/compliance"],
    guide: "Need to check solicitation compliance → RFP Fidelity Engine → open the requirement matrix and audit gaps",
  },
  "/roku-ads": {
    title: "Roku & CTV Ads", description: "Review connected-TV ad formats and revenue estimates, generate ad scripts, and inspect video distribution resources.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/ai-tools", "/video-pipeline"], downstream: ["/ai-tools", "/ai-tools/:toolKey"],
    guide: "Need connected-TV content → Roku & CTV Ads → generate a script and review distribution setup",
  },
  "/sdvosb-tracker": {
    title: "SDVOSB Tracker", description: "Track a predefined certification and contracting checklist and open veteran-business registration and funding resources.",
    outcome: "operate", audiences: ["nonprofit-cbo", "veterans"], upstream: ["/apex-accelerators", "/tools"], downstream: [],
    guide: "Need to track veteran-business readiness → SDVOSB Tracker → update checklist items and open official resources",
  },
  "/settings/documents": {
    title: "Document Library", description: "Upload, tag, browse, and remove organization documents grouped by affiliated entity and document type.",
    outcome: "operate", audiences: ["nonprofit-cbo", "caregivers-chws"], upstream: ["/partner-portal", "/settings/organization"], downstream: ["/partners/join"],
    guide: "Need reusable organization documents → Document Library → upload and tag files for proposal use",
  },
  "/settings/organization": {
    title: "Organization Profile", description: "Update organization details, mission, populations, geography, budget, and contracting identifiers used for grant-fit scoring.",
    outcome: "operate", audiences: ["nonprofit-cbo", "caregivers-chws"], upstream: ["/partner-portal"], downstream: ["/settings/documents", "/onboarding/org"],
    guide: "Need to keep organization context current → Organization Profile → save changes and maintain the document library",
  },
  "/social-media-literacy": {
    title: "Social Media Literacy", description: "Read student and parent modules on social-media safety, critical thinking, boundaries, and digital well-being.",
    outcome: "learn", audiences: ["students-youth", "resident-family", "caregivers-chws"], upstream: ["/parents", "/curriculum"], downstream: ["/curriculum", "/ai-companion"],
    guide: "Need safer social-media habits → Social Media Literacy → read a module and practice its guidance",
  },
  "/stakeholder-map": {
    title: "Stakeholder Engagement Map", description: "Review named stakeholder roles and relationship stages in an internal partnership-pursuit map.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/transparency-matrix"], downstream: ["/transparency-matrix"], access: "authenticated",
    guide: "Need to review partnership status → Stakeholder Engagement Map → check relationship stages or request verification",
  },
  "/teacher-dashboard": {
    title: "Teacher Dashboard", description: "Review your classrooms' student counts, learning scores, and completed lessons, then open classroom details.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/classrooms", "/academy"], downstream: ["/classrooms", "/classrooms/:classroomId"], access: "authenticated",
    guide: "Need classroom progress → Teacher Dashboard → inspect a classroom or create one",
  },
  "/teaming-network": {
    title: "Teaming Network & Capabilities", description: "Review the delivery-partner roster, proposal-specific teams, and active bids scored against their funding rubrics.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/grants", "/my-grants"], downstream: ["/grants", "/this-week", "/my-grants"],
    guide: "Need a proposal-specific team → Teaming Network & Capabilities → review lane fit and pursue an aligned bid",
  },
  "/transparency-matrix": {
    title: "Transparency Matrix", description: "Review stated capability statuses and supporting evidence, then request verification of individual claims.",
    outcome: "see-the-data", audiences: ["funder-evaluator", "agency-government", "nonprofit-cbo"], upstream: ["/healthcare-grants", "/stakeholder-map"], downstream: ["/stakeholder-map", "/about", "/non-discrimination"],
    guide: "Need to verify capabilities → Transparency Matrix → inspect evidence or request documentation",
  },
  "/video-pipeline": {
    title: "Video Pipeline", description: "Submit video scripts for rendering, monitor render jobs, and trigger distribution of completed videos.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/ai-tools", "/roku-ads"], downstream: ["/ai-tools"],
    guide: "Need to produce platform videos → Video Pipeline → submit a script and monitor distribution",
  },
  "/wioa-outcomes": {
    title: "WIOA Outcomes", description: "Review internal employment placements, wages, training-program placement rates, and retention metrics.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/workforce-dashboard", "/workforce-pell"], downstream: [],
    guide: "Need employment reporting → WIOA Outcomes → review placement and retention evidence",
  },
  "/won-proposals": {
    title: "Winning Proposals Library", description: "Save and edit awarded proposal drafts for retrieval as writing examples in future grant narratives.",
    outcome: "operate", audiences: ["nonprofit-cbo"], upstream: ["/my-grants", "/grant-narrative"], downstream: [],
    guide: "Need to reuse successful writing → Winning Proposals Library → save a complete awarded draft",
  },
  "/workforce-dashboard": {
    title: "Workforce Dashboard", description: "Review participant assessment, training, placement, and readiness data and record placements or retention check-ins.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/workforce-training", "/wioa-outcomes"], downstream: ["/workforce-assessment", "/workforce-training", "/workforce-employers"],
    guide: "Need to manage workforce delivery → Workforce Dashboard → record placements and retention check-ins",
  },
  "/yhsi-ops": {
    title: "YHSI Operations", description: "Manage youth-service referrals, participant records, contact touchpoints, voice review, HMIS exports, and biannual reports.",
    outcome: "operate", audiences: ["nonprofit-cbo", "agency-government"], upstream: ["/yhsi-system", "/foster-youth"], downstream: [],
    guide: "Need to coordinate youth housing services → YHSI Operations → update referrals and participant reporting",
  },
};
