/** Phase 2 classification lane — learn-work. Keys are App.tsx route paths. */
import type { RouteClassificationLane } from "../route-registry.types";

export const LANE_LEARN_WORK: RouteClassificationLane = {
  "/academy": {
    title: "Learn skills or explore careers", description: "Explore the learning village, classmates, learning activities, and career planning tools.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/", "/tools"], downstream: ["/academy/lessons", "/academy/careers", "/academy/avatar"], guide: "Want to build skills → Learning village → choose a learning activity or career tool",
  },
  "/academy/admin-video-script": {
    title: "Create a learning-hub video", description: "Review and copy an administrator-focused video script or submit it to the video rendering pipeline.", outcome: "operate", audiences: ["agency-government", "nonprofit-cbo"], upstream: ["/academy/admin", "/academy/phased-rollout"], downstream: ["/academy/admin", "/academy/course-creator", "/implementation"], guide: "Need a learning-hub presentation → Video Script Generator → copy the script or request a render",
  },
  "/academy/announcements": {
    title: "Announcements", description: "Read learning-hub news from teachers and administrators, with publishing controls for administrators.", outcome: "connect", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/teacher-dashboard"], downstream: ["/academy"], guide: "Need learning-hub updates → Announcements → read the latest notices",
  },
  "/academy/avatar": {
    title: "My Avatar", description: "Customize your learning-hub avatar, view classmates, and review your latest personality check-in.", outcome: "learn", audiences: ["students-youth"], upstream: ["/academy"], downstream: ["/academy/self-assessment", "/academy"], guide: "Want to personalize your learning identity → My Avatar → save your avatar or update your check-in",
  },
  "/academy/calendar": {
    title: "Calendar", description: "Browse learning events and competitions by date, with event creation and deletion for administrators.", outcome: "connect", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/teacher-dashboard"], downstream: ["/academy"], guide: "Need to know what is coming up → Learning Calendar → review an event's time and details",
  },
  "/academy/campus": {
    title: "Build Campus", description: "Create a virtual campus project and advance its building phases using your learning-hub wallet.", outcome: "learn", audiences: ["students-youth"], upstream: ["/academy", "/academy/lessons"], downstream: ["/academy"], guide: "Want to practice project planning → Campus Builder → name and fund a virtual campus project",
  },
  "/academy/careers": {
    title: "Career Explorer", description: "Explore career pathways, bookmark interests, and take a school-to-career readiness assessment.", outcome: "work-earn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/workforce"], downstream: ["/academy"], guide: "Unsure which career fits → Career Explorer → assess readiness and save career interests",
  },
  "/academy/competitions": {
    title: "Competitions", description: "Enter learning-hub competitions and review entries, leaderboards, and your competition history.", outcome: "learn", audiences: ["students-youth"], upstream: ["/academy", "/academy/houses"], downstream: ["/academy/games", "/academy"], guide: "Want to test your skills → Competitions → enter a challenge or visit the game room",
  },
  "/academy/course-creator": {
    title: "Course Creator", description: "Create, edit, and publish learning-hub courses with modules, lessons, and enrollment tracking.", outcome: "operate", audiences: ["agency-government", "nonprofit-cbo"], upstream: ["/academy/admin", "/academy/phased-rollout"], downstream: ["/academy"], guide: "Need to publish learning content → Course Creator → build modules and publish a course", access: "admin",
  },
  "/academy/dreams": {
    title: "Dream Design", description: "Create or edit a dream profile with career and college aspirations, goals, strengths, and growth areas.", outcome: "work-earn", audiences: ["students-youth"], upstream: ["/academy", "/academy/careers"], downstream: ["/academy"], guide: "Want to plan your future → Dream Design → save your goals and aspirations",
  },
  "/academy/financial-literacy": {
    title: "Financial Literacy", description: "Read money-skills modules with real-world stories, vocabulary, and lessons about financial decisions.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/stocks", "/academy/marketplace"], downstream: ["/academy"], guide: "Need to understand money decisions → Financial Literacy → explore a module and its lessons",
  },
  "/academy/games": {
    title: "Game Room", description: "Choose a dominoes game mode and difficulty and review game ratings and leaderboards.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/competitions"], downstream: ["/academy/games/dominoes/:id", "/academy"], guide: "Want to practice strategic reasoning → Game Room → choose a mode and start dominoes",
  },
  "/academy/games/dominoes/:id": {
    title: "Play dominoes", description: "Play a dominoes session, review the result, and start another game.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy/games"], downstream: ["/academy/games", "/academy/games/dominoes/:id"], guide: "Ready for a strategy game → Dominoes → finish the session and review your result",
  },
  "/academy/help": {
    title: "Help & FAQ", description: "Search student FAQs about learning activities, rewards, and how to use the platform.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy"], downstream: ["/academy"], guide: "Unsure how a learning feature works → Help & FAQ → find an answer and return to the learning hub",
  },
  "/academy/houses": {
    title: "House Points", description: "Review house standings, merit categories, recent awards, and rewards, with a point-awarding form.", outcome: "learn", audiences: ["students-youth", "agency-government"], upstream: ["/academy", "/academy/hub"], downstream: ["/academy"], guide: "Want to understand house recognition → House Points → review standings and merit activities",
  },
  "/academy/hub": {
    title: "Learning Hub", description: "Review learning activity, house membership, power scores, and daily quests or choose career-mode tools.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/dashboard"], downstream: ["/academy/quests", "/academy/power", "/academy/houses"], guide: "Need a starting point for learning activities → Learning Hub → choose a quest or learning tool",
  },
  "/academy/journal": {
    title: "My Journal", description: "Write daily or weekly reflections with mood ratings and review your past entries.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy"], downstream: ["/academy"], guide: "Want to reflect on your learning → My Journal → save a reflection and review past entries",
  },
  "/academy/lessons": {
    title: "Life Lessons", description: "Read how learning-hub activities teach life and business skills and open the related practice tools.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy"], downstream: ["/academy/stocks", "/academy/wallet", "/academy/campus"], guide: "Want practical life skills → Life Lessons → read a lesson and try its learning-hub activity",
  },
  "/academy/marketplace": {
    title: "Marketplace", description: "Browse classmates' listings and practice buying, selling, and tracking trades in the learning economy.", outcome: "learn", audiences: ["students-youth"], upstream: ["/academy", "/academy/lessons"], downstream: ["/academy/financial-literacy", "/academy"], guide: "Want to practice peer commerce → Marketplace → browse a listing or create your own",
  },
  "/academy/mentor-finder": {
    title: "Find a Mentor", description: "Browse mentor and business-partner resources and submit a mentor outreach request.", outcome: "connect", audiences: ["students-youth", "resident-family", "nonprofit-cbo"], upstream: ["/academy", "/academy/careers"], downstream: ["/academy"], guide: "Need a mentor or partner → Mentor Finder → browse resources or submit an outreach request",
  },
  "/academy/mentors": {
    title: "Mentor Network", description: "Browse mentor profiles, request mentorship, and track your requests, with example profiles labeled separately.", outcome: "connect", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/careers"], downstream: ["/academy"], guide: "Want professional guidance → Mentor Network → choose a mentor and send a request",
  },
  "/academy/merch": {
    title: "Shop learning-hub merchandise", description: "Browse fundraising merchandise and track orders, with a preview catalog when no items are available.", outcome: "fund", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/wallet"], downstream: ["/academy"], guide: "Want to support student fundraising → Academy Merch Shop → select an available item and place an order",
  },
  "/academy/pathway": {
    title: "My Pathway", description: "Create and revise a career pathway plan with education goals, stage tracking, and portfolio evidence.", outcome: "work-earn", audiences: ["students-youth"], upstream: ["/academy", "/academy/careers"], downstream: ["/academy"], guide: "Need a school-to-career plan → My Pathway → set goals and add evidence of progress",
  },
  "/academy/phased-rollout": {
    title: "Implementation Roadmap", description: "Review the learning platform's quarterly deployment phases, readiness checklists, and administrator milestones.", outcome: "operate", audiences: ["agency-government", "nonprofit-cbo"], upstream: ["/implementation", "/academy/admin"], downstream: ["/academy/admin", "/academy/course-creator", "/implementation"], guide: "Need to plan a learning-platform rollout → Implementation Roadmap → review milestones and open an implementation tool",
  },
  "/academy/power": {
    title: "Panther Power", description: "Review your learning-hub empowerment score by category, learning streaks, and level progression.", outcome: "see-the-data", audiences: ["students-youth"], upstream: ["/academy", "/academy/quests", "/academy/hub"], downstream: [], guide: "Want to understand your progress → Panther Power → review category scores and ways to earn points",
  },
  "/academy/progress-report": {
    title: "Progress Report", description: "View and print an academic snapshot of completed lessons, streaks, achievements, and growth scores.", outcome: "see-the-data", audiences: ["students-youth", "resident-family", "agency-government"], upstream: ["/academy", "/teacher-dashboard"], downstream: [], guide: "Need a learning progress summary → Progress Report → review or print the report",
  },
  "/academy/quests": {
    title: "Daily Quests", description: "Complete daily learning challenges, claim rewards, and review your Panther Power progress.", outcome: "learn", audiences: ["students-youth"], upstream: ["/academy", "/academy/hub", "/academy/wallet"], downstream: ["/academy/power", "/dashboard"], guide: "Need a daily learning activity → Daily Quests → complete a challenge and claim its reward",
  },
  "/academy/scenarios": {
    title: "Adventures", description: "Play branching decision scenarios and review the consequences of your choices and past runs.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy"], downstream: [], guide: "Want to practice life decisions safely → Adventures → choose a scenario and reflect on its outcome",
  },
  "/academy/self-assessment": {
    title: "Daily Check-In", description: "Record your mood, energy, stress, reflections, and support needs and review previous check-ins.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/avatar", "/academy/thrive"], downstream: [], guide: "Want to reflect on how you feel → Daily Check-In → save today's ratings and support needs",
  },
  "/academy/staar-prep": {
    title: "STAAR Test Prep", description: "Choose a grade and subject to study STAAR guides, take practice tests, and review topic mastery.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/subjects"], downstream: ["/academy"], guide: "Need STAAR practice → STAAR Test Prep → study a topic and take a practice assessment",
  },
  "/academy/stocks": {
    title: "Stock Market", description: "Practice investing with simulated learning-hub money and review stock prices and portfolio performance.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/wallet", "/academy/lessons"], downstream: ["/academy/financial-literacy", "/academy"], guide: "Want to learn investing without real-money risk → Stock Market → study prices and try a simulated trade",
  },
  "/academy/thrive": {
    title: "Thrive Dashboard", description: "Review and refresh your personalized six-domain Thrive scores, score history, and early warning flags.", outcome: "see-the-data", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/academy/hub"], downstream: ["/academy/self-assessment", "/academy"], guide: "Want to understand your growth → Thrive Dashboard → review your scores and complete a check-in",
  },
  "/academy/trade-sims": {
    title: "Trade Sims", description: "Choose a skilled trade and explore simulation-based lessons with a timed public preview before sign-in.", outcome: "work-earn", audiences: ["resident-family", "students-youth", "veterans"], upstream: ["/workforce", "/academy", "/concepts"], downstream: ["/academy/trade-sims/:tradeSlug", "/workforce", "/academy"], guide: "Want to explore a skilled trade → Trade Sims → choose a trade and start its lessons",
  },
  "/academy/trade-sims/:tradeSlug": {
    title: "Explore trade lessons", description: "Browse a trade's lesson sequence and review completion and mastery-based unlock status.", outcome: "learn", audiences: ["resident-family", "students-youth", "veterans"], upstream: ["/academy/trade-sims", "/workforce", "/mos-translator"], downstream: ["/academy/trade-sims/:tradeSlug/:lessonSlug", "/academy/trade-sims"], guide: "Ready to learn a trade → Trade lessons → open an available lesson",
  },
  "/academy/trade-sims/:tradeSlug/:lessonSlug": {
    title: "Practice a trade skill", description: "Study a trade concept, complete guided and solo practice, experiment in a sandbox, and record a debrief.", outcome: "learn", audiences: ["resident-family", "students-youth", "veterans"], upstream: ["/academy/trade-sims/:tradeSlug"], downstream: ["/academy/trade-sims/:tradeSlug", "/academy/trade-sims/:tradeSlug/certify", "/academy/trade-sims/:tradeSlug/transcript"], guide: "Need hands-on trade practice → Trade lesson → complete the solo challenge and review your next step",
  },
  "/academy/trade-sims/:tradeSlug/certify": {
    title: "Find trade credentials and apprenticeships", description: "Explore credential sponsors and apprenticeship locators and unlock practice questions through lesson completion.", outcome: "work-earn", audiences: ["resident-family", "students-youth", "veterans"], upstream: ["/academy/trade-sims/:tradeSlug/:lessonSlug", "/workforce"], downstream: ["/academy/trade-sims/:tradeSlug", "/academy/trade-sims/:tradeSlug/transcript", "/academy/trade-sims"], guide: "Ready for a credential pathway → Credentials & Apprenticeships → practice questions or contact a sponsor",
  },
  "/academy/trade-sims/:tradeSlug/transcript": {
    title: "View your trade skills transcript", description: "View and print lesson-level training evidence and download an issued completion certificate when available.", outcome: "work-earn", audiences: ["resident-family", "students-youth", "veterans"], upstream: ["/academy/trade-sims/:tradeSlug/certify", "/academy/trade-sims/:tradeSlug/:lessonSlug", "/workforce"], downstream: ["/academy/trade-sims/:tradeSlug/certify", "/academy/trade-sims"], guide: "Need evidence of trade training → Skills Transcript → print your record or download your certificate",
  },
  "/academy/wallet": {
    title: "My Wallet", description: "Review your virtual learning-hub balance and transactions and use coins for campus funding or investing practice.", outcome: "learn", audiences: ["students-youth"], upstream: ["/academy", "/academy/lessons"], downstream: ["/academy/stocks", "/academy/merch", "/academy/quests"], guide: "Want to manage learning-hub coins → My Wallet → review transactions or choose an earning and spending activity",
  },
  "/achievements": {
    title: "Achievements", description: "Review earned badges, credentials, ranks, and milestones from learning activities.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/dashboard", "/academy"], downstream: ["/subjects"], guide: "Want to see learning recognition → Achievements → review badges or start a subject to earn more",
  },
  "/ag-trade-sims": {
    title: "Ag Trade Simulations", description: "Run irrigation, soil amendment, and cover crop simulations and explore agricultural credential resources.", outcome: "work-earn", audiences: ["rural-farm", "students-youth"], upstream: ["/rural-workforce", "/rural-intel", "/tools"], downstream: [], guide: "Need to practice farm management decisions → Ag Trade Simulations → enter farm parameters and review recommendations",
  },
  "/ai-tools": {
    title: "AI Creation Studio", description: "Explore AI literacy modules and open creation tools as their learning requirements are completed.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/sparky", "/workforce-readiness"], downstream: ["/ai-tools/:toolKey"], guide: "Want to learn AI creation skills → AI Creation Studio → complete a module and open its tool",
  },
  "/ai-workforce": {
    title: "AI Workforce Academy", description: "Browse AI workforce training tracks, curriculum outlines, learning paths, and presentation views.", outcome: "learn", audiences: ["resident-family", "students-youth", "nonprofit-cbo"], upstream: ["/tools", "/workforce"], downstream: [], guide: "Need an AI skills learning plan → AI Workforce Academy → select a track and review its curriculum",
  },
  "/apprenticeship": {
    title: "Apprenticeship Tracker", description: "Redirects to /apprenticeship-tracker.", outcome: "operate", audiences: [], upstream: [], downstream: [], guide: "Alias of /apprenticeship-tracker", aliasOf: "/apprenticeship-tracker",
  },
  "/apprenticeship-tracker": {
    title: "Apprenticeship Tracker", description: "Explore a sample apprenticeship management dashboard with competency and hour-tracking demonstrations and an AI career coach.", outcome: "operate", audiences: ["agency-government", "nonprofit-cbo"], upstream: ["/transition-plans", "/workforce-dashboard"], downstream: ["/fafsa-navigator", "/transition-plans", "/workforce-employers"], guide: "Need to understand apprenticeship coordination → Apprenticeship Tracker → review the sample lifecycle or ask the career coach",
  },
  "/career-pathways": {
    title: "Career Explorer", description: "Redirects to /academy/careers.", outcome: "work-earn", audiences: [], upstream: [], downstream: [], guide: "Alias of /academy/careers", aliasOf: "/academy/careers",
  },
  "/certificates": {
    title: "Certificates", description: "View earned curriculum completion certificates and open an individual certificate for printing.", outcome: "work-earn", audiences: ["students-youth", "resident-family"], upstream: ["/curriculum", "/achievements"], downstream: ["/certificates/:id", "/curriculum"], guide: "Need proof of completed learning → Certificates → open and print an earned certificate",
  },
  "/child-care": {
    title: "Child Care Overview", description: "Review Texas child care subsidy structures, access gaps, economic context, and regional policy analyses.", outcome: "see-the-data", audiences: ["agency-government", "nonprofit-cbo", "resident-family"], upstream: ["/tools", "/child-care/national"], downstream: ["/child-care/national", "/child-care-wilco", "/child-care-workforce"], guide: "Need to understand child care access gaps → Child Care Overview → explore national data or a regional analysis",
  },
  "/child-care-north-texas": {
    title: "North Texas Region", description: "Review the North Texas child care service region, contract targets, performance measures, and timeline.", outcome: "see-the-data", audiences: ["agency-government", "nonprofit-cbo", "rural-farm"], upstream: ["/child-care", "/child-care-workforce"], downstream: ["/child-care", "/child-care-wilco", "/child-care-workforce"], guide: "Need regional child care planning evidence → North Texas Region → review service targets and policy context",
  },
  "/child-care-wilco": {
    title: "Williamson County Initiative", description: "Review Williamson County child care coverage gaps and proposed partnership and quality improvement opportunities.", outcome: "see-the-data", audiences: ["agency-government", "nonprofit-cbo", "resident-family"], upstream: ["/child-care", "/child-care/national"], downstream: ["/child-care", "/child-care-north-texas", "/child-care-workforce"], guide: "Need Williamson County child care context → Williamson County Initiative → examine gaps and workforce policy options",
  },
  "/child-care-workforce": {
    title: "Workforce Connection & Policy", description: "Review evidence connecting child care access to employment and proposed changes to child care funding policy.", outcome: "see-the-data", audiences: ["agency-government", "nonprofit-cbo", "funder-evaluator"], upstream: ["/child-care", "/child-care-wilco", "/child-care-north-texas"], downstream: ["/child-care", "/child-care-wilco", "/child-care-north-texas"], guide: "Need the workforce case for child care investment → Workforce Connection & Policy → review policy options and regional evidence",
  },
  "/child-care/national": {
    title: "National Supply & Economic Context", description: "Compare Census child care establishment and child-population data, review economic pressure context, and look up counties.", outcome: "see-the-data", audiences: ["agency-government", "nonprofit-cbo", "funder-evaluator"], upstream: ["/child-care", "/tools"], downstream: ["/child-care", "/child-care-wilco", "/community-compare"], guide: "Need national child care supply evidence → National Supply & Economic Context → compare states and look up a county",
  },
  "/concepts": {
    title: "Concepts", description: "Browse short hands-on engineering explainers by topic and open an interactive concept page.", outcome: "learn", audiences: ["resident-family", "students-youth"], upstream: ["/academy", "/tools"], downstream: ["/concepts/oil-pumpjack", "/concepts/transformer", "/academy/trade-sims"], guide: "Curious about how engineering works → Concepts → open an explainer or continue to Trade Sims",
  },
  "/curriculum-documents/:id": {
    title: "Read a curriculum document", description: "Read a curriculum guide, lesson plan, or rubric with standards and attachments, with editing controls available.", outcome: "learn", audiences: ["agency-government", "nonprofit-cbo", "students-youth"], upstream: ["/curriculum-documents", "/teacher-dashboard"], downstream: ["/curriculum-documents", "/curriculum/:levelId", "/module/:moduleId"], guide: "Need a teaching or learning document → Curriculum document → read attachments or open the linked module",
  },
  "/curriculum-documents/new": {
    title: "Create a curriculum document", description: "Draft and save a curriculum document with level, module, grade-band, and standards information.", outcome: "operate", audiences: ["agency-government", "nonprofit-cbo"], upstream: ["/curriculum-documents", "/teacher-dashboard"], downstream: ["/curriculum-documents/:id", "/curriculum-documents"], guide: "Need to publish a teaching document → Create Curriculum Document → save it and review the document",
  },
  "/curriculum/:levelId": {
    title: "Explore a curriculum level", description: "Browse a level's modules and completion requirements and see personal progress when signed in.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/curriculum", "/curriculum-documents/:id"], downstream: ["/module/:moduleId", "/curriculum"], guide: "Ready for a curriculum level → Curriculum level → choose a module and work toward its requirements",
  },
  "/employer/register": {
    title: "Register as a fair-chance employer", description: "Submit an employer partnership application with hiring commitments and desired trade credentials for team review.", outcome: "work-earn", audiences: ["nonprofit-cbo", "agency-government", "rural-farm"], upstream: ["/workforce-employers", "/workforce"], downstream: [], guide: "Want to hire credentialed candidates → Employer registration → submit a fair-chance partnership application",
  },
  "/farm-cooperative": {
    title: "Join the producer data cooperative", description: "Enroll in the producer cooperative, control data-sharing consents, submit farm data, and request insights.", outcome: "connect", audiences: ["rural-farm"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Want control over shared farm data → Producer Data Cooperative → enroll and choose your consent settings",
  },
  "/farm-profitability": {
    title: "Farm Profitability Navigator", description: "Calculate a crop enterprise budget using editable inputs and USDA benchmarks and compare commodities.", outcome: "work-earn", audiences: ["rural-farm"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Need to assess farm earnings → Farm Profitability Navigator → enter costs and compare crop budgets",
  },
  "/farmworker-iti": {
    title: "Find farmworker support and pathways", description: "Explore benefits and stipend pathways or enroll privately with layered consent controls in English or Spanish.", outcome: "get-help", audiences: ["rural-farm", "resident-family"], upstream: ["/rural-workforce", "/tools"], downstream: [], guide: "Need farmworker benefits or recognition → Farmworker ITI → screen for benefits or enroll on your terms",
  },
  "/fsa-eligibility": {
    title: "FSA / NRCS Eligibility", description: "Screen farm details for USDA program eligibility and find application links and local agency offices.", outcome: "get-help", audiences: ["rural-farm"], upstream: ["/farm-profitability", "/rural-intel", "/tools"], downstream: [], guide: "Need USDA farm program support → FSA / NRCS Eligibility → enter farm details and contact the relevant office",
  },
  "/invasive-species": {
    title: "Invasive Species Watch", description: "Review priority species and local sightings, report an observation, and request treatment guidance.", outcome: "see-the-data", audiences: ["rural-farm", "agency-government"], upstream: ["/rural-intel", "/rural-alerts", "/tools"], downstream: [], guide: "Concerned about invasive species → Invasive Species Watch → check sightings or report an observation",
  },
  "/lesson/:lessonId": {
    title: "Complete a lesson", description: "Read a curriculum lesson and mark it complete to update your learning progress.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/module/:moduleId"], downstream: ["/module/:moduleId", "/subjects", "/curriculum"], guide: "Ready to learn a module topic → Lesson → read the content and mark it complete",
  },
  "/mentorship-directory": {
    title: "Mentors & Pathways", description: "Search mentorship programs by ZIP code or browse curated Austin programs and contact the providers.", outcome: "connect", audiences: ["students-youth", "resident-family", "veterans"], upstream: ["/workforce", "/academy/careers", "/tools"], downstream: [], guide: "Need a mentorship program near you → Mentorship Directory → search your ZIP code and contact a provider",
  },
  "/mos-translator": {
    title: "MOS Translator", description: "Map a military occupation to civilian jobs, credential options, training gaps, and relevant Trade Sims.", outcome: "work-earn", audiences: ["veterans"], upstream: ["/workforce", "/tools"], downstream: ["/academy/trade-sims", "/workforce-pell", "/navigator"], guide: "Need to translate military experience into work → MOS Translator → identify a training gap and start a trade pathway",
  },
  "/producer-voice": {
    title: "Producer Voice", description: "Share farm and ranch challenges anonymously and browse or upvote other producers' reports.", outcome: "connect", audiences: ["rural-farm"], upstream: ["/rural-intel", "/farm-cooperative", "/tools"], downstream: [], guide: "Want agricultural barriers heard → Producer Voice → submit a challenge or support another producer's report",
  },
  "/quiz/:moduleId": {
    title: "Take a module quiz", description: "Answer module quiz questions and review your score, mastery result, and feedback.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/module/:moduleId"], downstream: ["/module/:moduleId", "/curriculum", "/dashboard"], guide: "Ready to check your learning → Module Quiz → submit answers and review your mastery result",
  },
  "/resume-builder": {
    title: "Resume Builder", description: "Build and save a resume across guided sections while reviewing a live preview.", outcome: "work-earn", audiences: ["students-youth", "resident-family", "returning-citizens"], upstream: ["/workforce-readiness", "/safe-passage/employment-pathway", "/workforce"], downstream: [], guide: "Need a resume for work → Resume Builder → enter your experience and save your resume",
  },
  "/rural-alerts": {
    title: "Rural Situational Intel", description: "Review state-specific weather, wildfire, disaster, disease, and drought alerts with primary-source resource links.", outcome: "see-the-data", audiences: ["rural-farm", "agency-government"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Need to monitor threats to a rural community → Rural Situational Intel → review alerts and open the relevant source",
  },
  "/rural-connectivity": {
    title: "Rural Connectivity", description: "Check broadband and service-desert indicators and explore connectivity alternatives and infrastructure funding programs.", outcome: "get-help", audiences: ["rural-farm", "agency-government", "nonprofit-cbo"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Need rural connectivity or infrastructure support → Rural Connectivity → check your location and explore providers or programs",
  },
  "/rural-health": {
    title: "Rural Healthcare Hub", description: "Find farm-stress support, health centers, telehealth resources, and rural health program information.", outcome: "get-help", audiences: ["rural-farm", "resident-family", "caregivers-chws"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Need rural health support → Rural Healthcare Hub → contact a support line or find a health center",
  },
  "/rural-housing": {
    title: "Rural Housing Hub", description: "Screen for rural housing programs and review loan, repair, rental assistance, and housing cost-burden resources.", outcome: "get-help", audiences: ["rural-farm", "resident-family", "nonprofit-cbo"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Need rural housing support → Rural Housing Hub → screen your household and contact a program office",
  },
  "/rural-intel": {
    title: "County Ag Intelligence", description: "Search a county to review agricultural, population, soil, and species data with source links.", outcome: "see-the-data", audiences: ["rural-farm", "agency-government"], upstream: ["/tools"], downstream: ["/invasive-species"], guide: "Need evidence about a farming county → County Ag Intelligence → search the county and inspect source data",
  },
  "/rural-workforce": {
    title: "Rural Workforce Pipeline", description: "Build an agricultural career pathway and explore training programs, credentials, wages, and land-grant resources.", outcome: "work-earn", audiences: ["rural-farm", "students-youth"], upstream: ["/rural-intel", "/tools"], downstream: [], guide: "Need an agricultural career plan → Rural Workforce Pipeline → build a pathway and contact a training provider",
  },
  "/rural-workforce/:countyFips": {
    title: "Review county workforce context", description: "Review a Texas county's community indicators and gap diagnosis and open a local workforce support locator.", outcome: "see-the-data", audiences: ["rural-farm", "agency-government", "nonprofit-cbo"], upstream: ["/rural-workforce", "/rural-intel"], downstream: ["/rural-workforce"], guide: "Need county-specific workforce context → County workforce context → review the evidence and find local workforce support",
  },
  "/safe-passage/employment-pathway": {
    title: "Plan safe employment after abuse", description: "Explore survivor-focused employment readiness, interview guidance, workplace safety, financial separation, and support resources.", outcome: "work-earn", audiences: ["resident-family"], upstream: ["/safe-passage"], downstream: ["/safe-passage", "/safe-passage/benefits-bridge", "/resume-builder"], guide: "Need safe economic independence → Employment & Economic Independence → plan workplace safety or build a resume",
  },
  "/shadow-worker-hub": {
    title: "Shadow Worker Hub", description: "Explore recognition, stipend tiers, and credential pathways for informal community work and join through consent-based self-identification.", outcome: "work-earn", audiences: ["caregivers-chws", "resident-family", "nonprofit-cbo"], upstream: ["/workforce", "/tools"], downstream: ["/contact", "/data-council"], guide: "Want informal work recognized → Shadow Worker Hub → identify your role and review recognition pathways",
  },
  "/sparky": {
    title: "Sparky (Adult Companion)", description: "Chat with an adult AI companion about careers, learner support, parenting, self-care, and platform resources.", outcome: "get-help", audiences: ["resident-family", "returning-citizens", "veterans"], upstream: ["/academy", "/workforce-readiness", "/tools"], downstream: ["/ai-tools", "/privacy"], guide: "Need guidance as an adult learner or supporter → Sparky → ask a question or explore adult AI tools",
  },
  "/subjects": {
    title: "Subjects", description: "Browse academic subjects by grade band and open a subject's learning modules.", outcome: "learn", audiences: ["students-youth", "resident-family"], upstream: ["/academy", "/achievements", "/dashboard"], downstream: ["/subject/:subjectId"], guide: "Need a subject to study → Subjects → choose a grade band and open a subject",
  },
  "/transition-plans": {
    title: "Transition Plans", description: "Explore demonstration postsecondary plans, build an in-session plan, and consult an AI transition advisor.", outcome: "operate", audiences: ["agency-government", "nonprofit-cbo"], upstream: ["/workforce-dashboard", "/apprenticeship-tracker"], downstream: ["/fafsa-navigator", "/workforce-dashboard", "/apprenticeship-tracker"], guide: "Need to coordinate postsecondary transitions → Transition Plans → review a demonstration or draft a plan",
  },
  "/verify/trade-cert/:certificateId": {
    title: "Verify a trade certificate", description: "Verify a shared completion certificate and review its holder's training evidence and credential-preparation pathways.", outcome: "work-earn", audiences: ["nonprofit-cbo", "agency-government", "resident-family"], upstream: ["/academy/trade-sims/:tradeSlug/transcript"], downstream: [], guide: "Need to confirm a learner's training → Trade Certificate Verification → inspect the certificate and training evidence",
  },
  "/workforce": {
    title: "Workforce Pathways", description: "Explore trade retraining requirements and connect to simulations, transcripts, credentials, and next-step workforce tools.", outcome: "work-earn", audiences: ["resident-family", "veterans", "returning-citizens"], upstream: ["/academy/trade-sims", "/tools"], downstream: ["/academy/trade-sims", "/academy/trade-sims/:tradeSlug/certify", "/academy/trade-sims/:tradeSlug/transcript"], guide: "Need a retraining pathway → Workforce Pathways → pick a trade and start free practice",
  },
  "/workforce-assessment": {
    title: "Workforce Assessment", description: "Assess skills, work history, education, employment barriers, and career interests to create a workforce development plan.", outcome: "work-earn", audiences: ["resident-family", "returning-citizens", "students-youth"], upstream: ["/workforce", "/tools"], downstream: ["/workforce-training", "/workforce-employers"], guide: "Need a personalized employment plan → Workforce Assessment → complete the assessment and explore recommended training",
  },
  "/workforce-employers": {
    title: "Employer Connections", description: "Browse barrier-friendly employers and open positions or submit an employer partnership registration.", outcome: "work-earn", audiences: ["resident-family", "returning-citizens", "nonprofit-cbo"], upstream: ["/workforce", "/workforce-assessment", "/apprenticeship-tracker"], downstream: [], guide: "Need a barrier-friendly employer → Employer Connections → review an employer or open position",
  },
  "/workforce-pell": {
    title: "Workforce Pell Grant", description: "Estimate short-term training aid, compare Pell and WIOA funding, explore trade programs, and report a job placement when signed in.", outcome: "get-help", audiences: ["resident-family", "students-youth", "veterans"], upstream: ["/workforce", "/mos-translator"], downstream: ["/academy/trade-sims/:tradeSlug", "/academy/trade-sims/:tradeSlug/certify"], guide: "Need help paying for short-term training → Workforce Pell Grant → estimate aid and explore a training pathway",
  },
  "/workforce-readiness": {
    title: "Workforce Readiness", description: "Explore a five-module workforce curriculum with resume-building activities and connected learning tools.", outcome: "work-earn", audiences: ["resident-family", "students-youth", "returning-citizens"], upstream: ["/workforce", "/tools"], downstream: ["/curriculum", "/resume-builder"], guide: "Need job-readiness skills → Workforce Readiness → start a curriculum module and build your resume",
  },
  "/workforce-training": {
    title: "Workforce Training", description: "Browse training programs, enroll, track enrollment progress, and review credential and provider information.", outcome: "work-earn", audiences: ["resident-family", "students-youth", "returning-citizens"], upstream: ["/workforce-assessment", "/workforce", "/tools"], downstream: [], guide: "Need training for employment → Workforce Training → choose a program and enroll",
  },
};
