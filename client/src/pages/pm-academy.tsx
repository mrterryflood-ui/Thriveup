import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain, Sparkles, BarChart3, Shield, Users, Rocket,
  CheckCircle2, Clock, BookOpen, Target, Award, Zap, Globe,
  Layers, ChevronRight, GraduationCap, ArrowRight, Star,
  Briefcase, TrendingUp, FileText, Lightbulb, Settings,
  Workflow, ClipboardCheck, LayoutDashboard, Route, RefreshCw,
  Activity, Scale, Wrench, MessageSquare, Eye, Lock,
  ChevronDown, ChevronUp, AlertTriangle, HeartHandshake,
  Network, Puzzle, FlaskConical, Microscope, Building2,
  Presentation,
} from "lucide-react";
import { ModulePresenter, PresentButton } from "@/components/module-presenter";

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

interface TrackModule {
  title: string;
  topics: string[];
  duration: string;
  project?: string;
  memoryAid?: string;
}

interface Track {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Brain;
  color: string;
  gradient: string;
  difficulty: Difficulty;
  duration: string;
  description: string;
  whoIsItFor: string[];
  outcomes: string[];
  modules: TrackModule[];
  tools: string[];
  certification: string;
  careerPaths: string[];
  platformConnections: string[];
}

const TRACKS: Track[] = [
  {
    id: "pm-essentials",
    title: "PM Essentials",
    subtitle: "Your First Steps in Project Management",
    icon: ClipboardCheck,
    color: "text-sky-600 dark:text-sky-400",
    gradient: "from-sky-400 to-cyan-500",
    difficulty: "beginner",
    duration: "2 weeks",
    description: "Never managed a project before? Start here. In two weeks you'll understand the language, the process, and the mindset of project management — and you'll practice it on a real community project in ThriveUp's Program Management suite.",
    whoIsItFor: [
      "Anyone who's never formally managed a project",
      "Community organizers running events and programs",
      "Parents coordinating complex family or school activities",
      "New nonprofit employees stepping into coordination roles",
    ],
    outcomes: [
      "Understand the difference between a project, a program, and a portfolio",
      "Know the 5 process groups and when each kicks in",
      "Create a scope statement, schedule, and budget for any project",
      "Identify and communicate with stakeholders effectively",
      "Use ThriveUp's Program Management suite to track a real project",
    ],
    modules: [
      {
        title: "Module 1: What Is Project Management?",
        topics: [
          "Projects vs. programs vs. portfolios — what's the difference?",
          "Why PM matters: the cost of 'winging it'",
          "The PM mindset: think before you act, track while you act, learn after you act",
          "Real examples: managing a community health fair, a grant-funded program, a contract",
        ],
        duration: "2 days",
        project: "Identify a real project in your life — we'll manage it through this course",
      },
      {
        title: "Module 2: The 5 Process Groups",
        topics: [
          "Initiating — defining WHAT and WHY",
          "Planning — figuring out HOW, WHEN, and WHO",
          "Executing — doing the actual work",
          "Monitoring & Controlling — are we on track?",
          "Closing — wrapping up and capturing lessons",
        ],
        duration: "2 days",
        project: "Map your project to all 5 process groups using a one-page planner",
        memoryAid: "I.P.E.M.C. — 'I Plan Every Move Carefully'",
      },
      {
        title: "Module 3: Scope, Schedule & Budget",
        topics: [
          "The triple constraint — and why you can't have all three",
          "Writing a scope statement that prevents scope creep",
          "Building a simple schedule with milestones",
          "Budget basics: estimate, track, adjust",
        ],
        duration: "3 days",
        project: "Create a scope statement, milestone schedule, and budget for your project using ThriveUp's tools",
        memoryAid: "The Triple Constraint — 'ScoSBu' (like Scooby) — Scope, Schedule, Budget. Pick two, the third adjusts.",
      },
      {
        title: "Module 4: Stakeholders & Communication",
        topics: [
          "Who are your stakeholders? (hint: more than you think)",
          "The RACI matrix — who does what",
          "Communication planning: who needs to know what, and when",
          "Managing expectations — the real PM superpower",
        ],
        duration: "3 days",
        project: "Build a RACI matrix and communication plan for your project",
        memoryAid: "RACI — Responsible (does the work), Accountable (owns the outcome), Consulted (gives input), Informed (kept in the loop)",
      },
    ],
    tools: ["ThriveUp Program Management Suite", "Google Sheets/Excel", "Trello or Kanban boards"],
    certification: "ThriveUp PM Essentials Certificate",
    careerPaths: ["Community Project Coordinator", "Nonprofit Program Assistant", "Team Lead", "Ready for PM Professional Track"],
    platformConnections: [
      "Practice in: ThriveUp Program Management Suite — set up and track your project",
      "Explore: Program Lifecycle page — see how projects flow through stages",
      "Reference: Logic Model — connect your project to outcomes",
    ],
  },
  {
    id: "pm-professional",
    title: "PM Professional",
    subtitle: "Master the Discipline of Project Management",
    icon: Briefcase,
    color: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-400 to-purple-500",
    difficulty: "intermediate",
    duration: "4 weeks",
    description: "You've managed projects. Now master the discipline. This track covers the PMBOK knowledge areas, risk management, Agile vs. Waterfall decision-making, and earned value — all while running a real grant-funded project through RPLICE.",
    whoIsItFor: [
      "People managing projects who want formal PM knowledge",
      "Anyone preparing for the CAPM certification exam",
      "Nonprofit managers overseeing grant-funded programs",
      "Professionals transitioning into PM roles",
    ],
    outcomes: [
      "Know all 10 PMBOK knowledge areas and when to apply each",
      "Choose the right methodology: Agile, Waterfall, or Hybrid",
      "Build and maintain a risk register (RAID log)",
      "Track project health using Earned Value basics",
      "Manage scope changes without losing control",
      "Be fully prepared for the CAPM certification exam",
    ],
    modules: [
      {
        title: "Module 1: The 10 Knowledge Areas",
        topics: [
          "Integration Management — how it all fits together",
          "Scope Management — what's in and what's out",
          "Schedule Management — timelines that work",
          "Cost Management — budgets that hold",
          "Quality Management — getting it right, not just getting it done",
          "Resource Management — people, equipment, materials",
          "Communication Management — the right info to the right people",
          "Risk Management — planning for what could go wrong",
          "Procurement Management — buying and contracting",
          "Stakeholder Management — keeping everyone aligned",
        ],
        duration: "5 days",
        project: "Create a project management plan covering all 10 knowledge areas for a grant-funded program",
        memoryAid: "10 Knowledge Areas: 'I Saw Six Crazy Raccoons Quickly Catch Several Possums' — Integration, Scope, Schedule, Cost, Resource, Quality, Communication, Stakeholder, Procurement, Risk",
      },
      {
        title: "Module 2: Agile vs. Waterfall vs. Hybrid",
        topics: [
          "Waterfall: when you know exactly what you're building",
          "Agile: when requirements will change (they usually do)",
          "Scrum basics: sprints, standups, retrospectives",
          "Kanban: visualizing workflow and limiting work-in-progress",
          "Hybrid: mixing approaches for the real world",
          "Choosing the right approach for community programs",
        ],
        duration: "5 days",
        project: "Run a 1-week sprint for a component of your project using Scrum",
        memoryAid: "Waterfall = 'Plan the whole house, then build it.' Agile = 'Build one room, get feedback, build the next.' Hybrid = 'Plan the house, but build room by room.'",
      },
      {
        title: "Module 3: Risk Management & the RAID Log",
        topics: [
          "Risk identification: what COULD go wrong?",
          "Risk analysis: how likely, how bad?",
          "Risk response: avoid, mitigate, transfer, accept",
          "The RAID log: Risks, Assumptions, Issues, Dependencies",
          "Turning risk management into a habit, not a one-time exercise",
        ],
        duration: "5 days",
        project: "Build a complete RAID log for your project and present your top 5 risks with response plans",
        memoryAid: "RAID — Risks (what could happen), Assumptions (what we're counting on), Issues (what's already happening), Dependencies (what we're waiting on)",
      },
      {
        title: "Module 4: Earned Value & Change Control",
        topics: [
          "Earned Value Management: are we getting our money's worth?",
          "The three key numbers: PV, EV, AC (Planned Value, Earned Value, Actual Cost)",
          "CPI and SPI: are we over budget? Behind schedule?",
          "Change control: how to handle 'can you just add this one thing?'",
          "Scope creep: the silent project killer",
        ],
        duration: "5 days",
        project: "Calculate EVM metrics for your project and present a status report to stakeholders",
        memoryAid: "EVM in plain English: PV = what you PLANNED to spend by now. EV = what you actually GOT DONE. AC = what you actually SPENT. If EV > AC, you're under budget. If EV > PV, you're ahead of schedule.",
      },
    ],
    tools: ["ThriveUp Program Management Suite", "RPLICE Program Lifecycle", "Microsoft Project / Smartsheet", "RAID Log Template"],
    certification: "ThriveUp PM Professional Certificate + CAPM Exam Ready",
    careerPaths: ["Project Manager", "Grant Program Manager", "Operations Manager", "Ready for Implementation Science PM Track"],
    platformConnections: [
      "Practice in: RPLICE — run a project through the full Program Lifecycle Tracker",
      "Use: Program Designer wizard to design your capstone intervention",
      "Apply: MAP-GAP CQI to track your project's continuous improvement",
    ],
  },
  {
    id: "implementation-science-pm",
    title: "Implementation Science PM",
    subtitle: "Program Management for Social Impact",
    icon: FlaskConical,
    color: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-400 to-teal-500",
    difficulty: "advanced",
    duration: "4 weeks",
    description: "This is what makes ThriveUp different. No other training program teaches traditional PM fused with implementation science. Learn how CFIR, RE-AIM, and SALP turn good programs into evidence-based programs. Manage grant-funded community interventions with the rigor of a research lab and the heart of a community organizer.",
    whoIsItFor: [
      "Program managers at nonprofits and social impact organizations",
      "Grant-funded project leads who need implementation rigor",
      "Anyone managing WIOA, SAMHSA, or foundation-funded programs",
      "Professionals who want to bridge the gap between research and practice",
    ],
    outcomes: [
      "Apply CFIR to adapt programs to local community contexts",
      "Use RE-AIM to evaluate program reach, effectiveness, and sustainability",
      "Track fidelity using SALP — measure whether you did it right, not just whether you did it",
      "Run MAP-GAP continuous quality improvement cycles",
      "Navigate the Three Realities: Research, Political, and Ground-Level",
      "Build and defend logic models that connect activities to outcomes",
    ],
    modules: [
      {
        title: "Module 1: Implementation Science Meets PM",
        topics: [
          "What is implementation science? (Moving research into practice)",
          "Why most programs fail: the implementation gap",
          "How traditional PM and implementation science complement each other",
          "The RPLICE vision: business rigor + academic evidence + community heart",
        ],
        duration: "5 days",
        project: "Analyze a failed community program — identify where better implementation science could have saved it",
      },
      {
        title: "Module 2: CFIR — Adapting to Your Community",
        topics: [
          "The 5 CFIR domains: Intervention, Outer Setting, Inner Setting, Individuals, Process",
          "Outer Setting: politics, funding, community needs — the forces beyond your control",
          "Inner Setting: your organization's culture, capacity, readiness",
          "Adaptation vs. drift: changing the approach while keeping the core",
          "Austin vs. Manor vs. Pflugerville: same program, different adaptations",
        ],
        duration: "5 days",
        project: "Use RPLICE's Three Realities diagnostic to analyze your community context, then create a CFIR adaptation plan",
        memoryAid: "CFIR's 5 Domains: 'I Only Inspire Incredible Programs' — Intervention, Outer setting, Inner setting, Individuals, Process",
      },
      {
        title: "Module 3: RE-AIM & SALP — Measuring What Matters",
        topics: [
          "Reach: are you actually reaching the people who need it?",
          "Effectiveness: is it actually working?",
          "Adoption: are partners and staff actually using it?",
          "Implementation: are you doing it the way it was designed?",
          "Maintenance: will it last after the grant ends?",
          "SALP fidelity indicators: the difference between 'we did it' and 'we did it right'",
        ],
        duration: "5 days",
        project: "Design a RE-AIM evaluation plan for a community intervention and define SALP fidelity indicators",
        memoryAid: "RE-AIM: Think of it as 5 questions every program must answer — Who are we reaching? Does it work? Are people using it? Are we doing it right? Will it last?",
      },
      {
        title: "Module 4: MAP-GAP & Logic Models — The Continuous Loop",
        topics: [
          "MAP-GAP: Measure → Analyze → Plan → Gap → Action → Progress",
          "Running a MAP-GAP cycle in real-time using RPLICE dashboards",
          "Logic models: connecting inputs → activities → outputs → outcomes → impact",
          "The Three Realities: Research Reality, Political Reality, Ground Reality",
          "Grant compliance as implementation fidelity (not just paperwork)",
        ],
        duration: "5 days",
        project: "Run a full MAP-GAP cycle on a real program and build a logic model that maps to grant reporting requirements",
        memoryAid: "MAP-GAP: Measure (what's happening?), Analyze (why?), Plan (what's the fix?), Gap (what's the gap?), Action (fix it!), Progress (did it work?)",
      },
    ],
    tools: ["RPLICE Platform", "Program Designer Wizard", "Program Lifecycle Tracker", "MAP-GAP CQI Dashboard", "Logic Model Builder"],
    certification: "ThriveUp Implementation Science PM Certificate",
    careerPaths: ["Implementation Specialist", "Research-to-Practice Coordinator", "Grant Program Director", "Community Health Program Manager"],
    platformConnections: [
      "Built on: RPLICE — the implementation science engine that fuses business PM with academic rigor",
      "Use: Program Designer to create CFIR-adapted interventions",
      "Track: Program Lifecycle through all 6 stages (Discovery → Improvement)",
      "Measure: MAP-GAP CQI for continuous quality improvement",
      "Build: Logic Model page to connect activities to outcomes",
    ],
  },
  {
    id: "pm-leadership-cert",
    title: "PM Leadership & Certification",
    subtitle: "Get Certified, Lead Programs, Coach Teams",
    icon: Award,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-400 to-orange-500",
    difficulty: "expert",
    duration: "4 weeks",
    description: "The capstone. PMP exam preparation with real-world practice, plus Lean Six Sigma fundamentals and portfolio management. You'll finish this track ready to sit for the PMP exam AND lead multi-program operations.",
    whoIsItFor: [
      "Experienced PMs preparing for the PMP certification exam",
      "Program directors managing multiple projects simultaneously",
      "Professionals who want to add Lean Six Sigma to their toolkit",
      "Anyone stepping into a PM leadership or coaching role",
    ],
    outcomes: [
      "Master PMP exam content: formulas, ITTOs, situational questions",
      "Understand program management vs. project management (PgMP concepts)",
      "Apply Lean Six Sigma DMAIC for process improvement",
      "Manage a portfolio of projects with strategic alignment",
      "Coach and mentor other project managers",
      "Be ready to sit for the PMP exam with confidence",
    ],
    modules: [
      {
        title: "Module 1: PMP Exam Deep Dive",
        topics: [
          "PMBOK 7th Edition: principles-based approach",
          "The 12 PM principles and 8 performance domains",
          "ITTOs strategy: Inputs, Tools & Techniques, Outputs",
          "Formulas you need: EVM, PERT, critical path, float",
          "Situational question strategy: 'What should the PM do FIRST?'",
          "Practice exam simulation with walk-through explanations",
        ],
        duration: "7 days",
        project: "Complete 200 practice questions with 80%+ pass rate, then explain your reasoning for the hardest 10",
        memoryAid: "PMP Formula Cheat: CPI = EV/AC (am I on budget?), SPI = EV/PV (am I on schedule?). Greater than 1 = good. Less than 1 = trouble.",
      },
      {
        title: "Module 2: Lean Six Sigma Essentials",
        topics: [
          "DMAIC: Define, Measure, Analyze, Improve, Control",
          "Voice of the Customer (VOC) and Critical to Quality (CTQ)",
          "Process mapping and value stream analysis",
          "Root cause analysis: 5 Whys and Fishbone diagrams",
          "Statistical basics: variation, standard deviation, control charts",
          "How Lean Six Sigma enhances PM (eliminating waste in projects)",
        ],
        duration: "7 days",
        project: "Run a DMAIC cycle on a real process improvement — identify waste, implement a fix, measure the improvement",
        memoryAid: "DMAIC — 'Don't Make Assumptions, Improve Continuously' — Define (the problem), Measure (current performance), Analyze (root cause), Improve (fix it), Control (keep it fixed)",
      },
      {
        title: "Module 3: Portfolio & Program Management",
        topics: [
          "Program management: managing related projects for combined benefits",
          "Portfolio management: aligning projects to organizational strategy",
          "Strategic alignment: does this project support our mission?",
          "Resource allocation across multiple projects",
          "Benefits realization: measuring whether we achieved the strategic goal",
          "The ThriveUp ecosystem as a portfolio: 20 platforms, one mission",
        ],
        duration: "7 days",
        project: "Create a portfolio view of ThriveUp's ecosystem platforms, prioritize 5 for strategic investment, and defend your rationale",
      },
      {
        title: "Module 4: PM Leadership & Capstone",
        topics: [
          "Leading vs. managing: the PM as servant leader",
          "Building high-performance teams in community settings",
          "Coaching and mentoring other PMs",
          "Emotional intelligence in project leadership",
          "Conflict resolution and negotiation",
          "Capstone: manage a full program cycle with stakeholder presentation",
        ],
        duration: "7 days",
        project: "Manage a complete program cycle in RPLICE/MCE from design through evaluation, present findings to a stakeholder panel",
      },
    ],
    tools: ["RPLICE Full Suite", "MCE Contract Management", "ThriveUp Ecosystem Hub", "PMP Exam Prep Materials", "Six Sigma Templates"],
    certification: "ThriveUp PM Leadership Certificate + PMP Exam Ready + Lean Six Sigma Green Belt Foundations",
    careerPaths: ["Senior Project Manager", "Program Director", "Portfolio Manager", "PM Consultant", "Chief Operations Officer"],
    platformConnections: [
      "Capstone in: RPLICE + MCE — manage a full program cycle with real stakeholders",
      "Portfolio view: Ecosystem Hub — see all 20 platforms as a managed portfolio",
      "Process improvement: Apply DMAIC to any platform's operational workflow",
      "Leadership: Coach a peer through the PM Essentials track as part of your capstone",
    ],
  },
  {
    id: "contract-pm",
    title: "Contract & Grant PM",
    subtitle: "Manage Federal Contracts and Grants Like a Pro",
    icon: Scale,
    color: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-400 to-pink-500",
    difficulty: "intermediate",
    duration: "3 weeks",
    description: "Federal contracts and grants have their own rules. This track teaches you to manage WIOA programs, foundation grants, and government contracts with compliance built into every step — even if you've never touched a federal award before. MCE's tools enforce the process so you learn while you do.",
    whoIsItFor: [
      "Nonprofit staff managing grant-funded programs",
      "Small business owners pursuing government contracts",
      "MCE users who need PM discipline for contract execution",
      "Anyone working with WIOA, SAMHSA, or foundation funding",
    ],
    outcomes: [
      "Understand the grant/contract lifecycle from award to closeout",
      "Track compliance milestones and reporting deadlines without dropping anything",
      "Manage deliverables, budgets, and timelines for funded programs",
      "Build and maintain audit-ready documentation",
      "Use MCE's tools to manage contracts with PM fidelity",
    ],
    modules: [
      {
        title: "Module 1: The Grant & Contract Lifecycle",
        topics: [
          "Pre-award: finding opportunities, writing proposals, budget development",
          "Award: negotiation, terms and conditions, setting up systems",
          "Implementation: executing the work plan, tracking milestones",
          "Reporting: quarterly reports, annual reviews, financial reconciliation",
          "Closeout: final reports, audits, lessons learned",
        ],
        duration: "5 days",
        project: "Map a grant lifecycle for a WIOA-funded workforce program using ThriveUp's compliance calendar",
        memoryAid: "Grant Lifecycle: 'FAIR Close' — Find it, Apply, Implement, Report, Close out",
      },
      {
        title: "Module 2: Compliance & Reporting",
        topics: [
          "Federal reporting requirements: what, when, and how",
          "Financial compliance: allowable vs. unallowable costs",
          "In-kind match documentation: proving your match",
          "Site visit preparation: what auditors look for",
          "Building a compliance calendar that runs itself",
        ],
        duration: "5 days",
        project: "Set up a complete compliance calendar for a funded program and document 3 in-kind contributions with evidence",
      },
      {
        title: "Module 3: Contract Execution with MCE",
        topics: [
          "Scope of work vs. deliverables vs. milestones",
          "Managing subcontractors and partners",
          "Change orders: when and how to modify a contract",
          "Invoice management and payment tracking",
          "Using MCE to track contracts with PM discipline",
        ],
        duration: "5 days",
        project: "Set up a contract management workflow in MCE with milestones, deliverables, and status tracking",
        memoryAid: "Contract Health Check: 'SDICP' — Scope (clear?), Deliverables (defined?), Invoices (tracked?), Changes (documented?), Payments (on time?)",
      },
    ],
    tools: ["MCE Contract Management", "ThriveUp Compliance Calendar", "Program Management Suite", "In-Kind Match Documentation Tools"],
    certification: "ThriveUp Contract & Grant PM Certificate",
    careerPaths: ["Grant Program Manager", "Contract Administrator", "Compliance Officer", "Nonprofit Operations Director"],
    platformConnections: [
      "Practice in: MCE — manage contracts with PM discipline baked into the tool",
      "Track in: Program Management Suite — compliance calendar, staffing, facilities",
      "Reference: APEX Accelerators page — government contracting resources",
      "Apply: Grant Packages — see how managed grants flow through the system",
    ],
  },
];

const LEARNING_PATHS = [
  {
    name: "Community Leader",
    description: "Never managed a project? Start here and finish confident.",
    tracks: ["pm-essentials"],
    duration: "2 weeks",
    icon: Users,
  },
  {
    name: "Certified PM",
    description: "Go from basics to CAPM-ready in 6 weeks.",
    tracks: ["pm-essentials", "pm-professional"],
    duration: "6 weeks",
    icon: GraduationCap,
  },
  {
    name: "Grant & Contract Manager",
    description: "Master the compliance and execution side of funded programs.",
    tracks: ["pm-essentials", "contract-pm"],
    duration: "5 weeks",
    icon: Scale,
  },
  {
    name: "Implementation Scientist",
    description: "The path no one else offers. Traditional PM fused with implementation science.",
    tracks: ["pm-essentials", "pm-professional", "implementation-science-pm"],
    duration: "10 weeks",
    icon: FlaskConical,
  },
  {
    name: "PM Executive",
    description: "The full journey. From first project to PMP certification and beyond.",
    tracks: ["pm-essentials", "pm-professional", "implementation-science-pm", "pm-leadership-cert"],
    duration: "14 weeks",
    icon: Rocket,
  },
];

const MEMORY_AIDS = [
  { acronym: "I.P.E.M.C.", meaning: "I Plan Every Move Carefully", concept: "5 Process Groups: Initiating, Planning, Executing, Monitoring & Controlling, Closing" },
  { acronym: "ScoSBu", meaning: "Like Scooby!", concept: "Triple Constraint: Scope, Schedule, Budget" },
  { acronym: "RACI", meaning: "Who does what?", concept: "Responsible, Accountable, Consulted, Informed" },
  { acronym: "RAID", meaning: "Your risk radar", concept: "Risks, Assumptions, Issues, Dependencies" },
  { acronym: "SMART", meaning: "Goals that work", concept: "Specific, Measurable, Achievable, Relevant, Time-bound" },
  { acronym: "DMAIC", meaning: "Don't Make Assumptions, Improve Continuously", concept: "Define, Measure, Analyze, Improve, Control (Lean Six Sigma)" },
  { acronym: "RE-AIM", meaning: "5 questions every program must answer", concept: "Reach, Effectiveness, Adoption, Implementation, Maintenance" },
  { acronym: "CFIR", meaning: "Adapt without drifting", concept: "5 Domains: Intervention, Outer Setting, Inner Setting, Individuals, Process" },
  { acronym: "MAP-GAP", meaning: "Continuous improvement loop", concept: "Measure, Analyze, Plan → Gap, Action, Progress" },
  { acronym: "FAIR Close", meaning: "Grant lifecycle in 5 steps", concept: "Find it, Apply, Implement, Report, Close out" },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  beginner: { label: "Beginner", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  intermediate: { label: "Intermediate", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
  advanced: { label: "Advanced", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
  expert: { label: "Expert", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-900/30" },
};

function TrackCard({ track, onSelect }: { track: Track; onSelect: () => void }) {
  const Icon = track.icon;
  const diff = DIFFICULTY_CONFIG[track.difficulty];
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-2 hover:border-primary/30"
      onClick={onSelect}
      data-testid={`track-card-${track.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${track.gradient} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <Badge className={`${diff.bg} ${diff.color} border-0 text-xs`}>{diff.label}</Badge>
        </div>
        <CardTitle className="text-lg mt-3">{track.title}</CardTitle>
        <CardDescription className="text-sm">{track.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{track.duration}</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{track.modules.length} modules</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{track.description}</p>
        <Button variant="ghost" className="mt-3 p-0 h-auto text-primary" data-testid={`explore-track-${track.id}`}>
          Explore Track <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function TrackDetail({ track, onBack }: { track: Track; onBack: () => void }) {
  const Icon = track.icon;
  const diff = DIFFICULTY_CONFIG[track.difficulty];
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [presentingModule, setPresentingModule] = useState<number | null>(null);
  const [presentingAll, setPresentingAll] = useState(false);

  const presenterConfig = {
    trackTitle: track.title,
    trackSubtitle: track.subtitle,
    gradient: track.gradient,
    modules: track.modules,
    certification: track.certification,
  };

  return (
    <div className="space-y-6" data-testid={`track-detail-${track.id}`}>
      {(presentingAll || presentingModule !== null) && (
        <ModulePresenter
          config={presenterConfig}
          moduleIndex={presentingModule !== null ? presentingModule : undefined}
          onClose={() => { setPresentingAll(false); setPresentingModule(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="mb-2" data-testid="back-to-tracks">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> Back to All Tracks
        </Button>
        <Button onClick={() => setPresentingAll(true)} className="gap-2" data-testid="button-present-all-pm">
          <Presentation className="h-4 w-4" /> Present Full Track
        </Button>
      </div>

      <div className={`bg-gradient-to-r ${track.gradient} rounded-2xl p-6 md:p-8 text-white`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <Badge className="bg-white/20 text-white border-0 mb-2">{diff.label} · {track.duration}</Badge>
            <h2 className="text-2xl md:text-3xl font-bold">{track.title}</h2>
            <p className="text-lg mt-1 opacity-90">{track.subtitle}</p>
          </div>
        </div>
        <p className="mt-4 text-white/90 text-base leading-relaxed max-w-3xl">{track.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Who Is This For?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {track.whoIsItFor.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> What You'll Be Able to Do</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {track.outcomes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Where This Connects to Your Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {track.platformConnections.map((conn, i) => (
              <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-primary/5">
                <Network className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{conn}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Course Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {track.modules.map((mod, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <button
                  className="flex-1 flex items-center gap-3 text-left"
                  onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                  data-testid={`module-toggle-${track.id}-${i}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{mod.title}</span>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {mod.duration}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <PresentButton onClick={() => setPresentingModule(i)} />
                  {expandedModule === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expandedModule === i && (
                <div className="p-4 pt-0 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Topics Covered</h4>
                    <ul className="space-y-1.5">
                      {mod.topics.map((topic, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {mod.project && (
                    <div className="bg-primary/5 rounded-lg p-3">
                      <h4 className="text-xs font-semibold uppercase text-primary mb-1 flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5" /> Hands-On Project
                      </h4>
                      <p className="text-sm">{mod.project}</p>
                    </div>
                  )}
                  {mod.memoryAid && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                      <h4 className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5" /> Memory Aid
                      </h4>
                      <p className="text-sm font-medium">{mod.memoryAid}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Tools You'll Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {track.tools.map((tool, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{tool}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-primary">{track.certification}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Career Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {track.careerPaths.map((path, i) => (
                <Badge key={i} variant="outline" className="text-xs">{path}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PMAcademyPage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tracks");

  const track = TRACKS.find(t => t.id === selectedTrack);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6" data-testid="pm-academy-page">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white">
            <ClipboardCheck className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold" data-testid="page-title">Program Management Academy</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Learn it here. Apply it in RPLICE. Execute it in MCE. Manage it across the ecosystem.
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto italic">
          Traditional PM rigor + implementation science depth + community heart. No other program teaches all three.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">5</div>
          <div className="text-xs text-muted-foreground">Tracks</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">19</div>
          <div className="text-xs text-muted-foreground">Modules</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">14</div>
          <div className="text-xs text-muted-foreground">Weeks (Full Path)</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">3</div>
          <div className="text-xs text-muted-foreground">Certifications</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-bold text-primary">10</div>
          <div className="text-xs text-muted-foreground">Memory Aids</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracks" data-testid="tab-tracks">Tracks</TabsTrigger>
          <TabsTrigger value="paths" data-testid="tab-paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="memory" data-testid="tab-memory">Memory Aids</TabsTrigger>
          <TabsTrigger value="approach" data-testid="tab-approach">Our Approach</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="mt-6">
          {track ? (
            <TrackDetail track={track} onBack={() => setSelectedTrack(null)} />
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Choose Your Track</h2>
                <p className="text-sm text-muted-foreground mt-1">From first-time project manager to PMP-certified leader</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TRACKS.map(t => (
                  <TrackCard key={t.id} track={t} onSelect={() => setSelectedTrack(t.id)} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paths" className="mt-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Learning Paths</h2>
              <p className="text-sm text-muted-foreground mt-1">Recommended sequences based on your goals</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {LEARNING_PATHS.map((path, i) => {
                const PathIcon = path.icon;
                const pathTracks = path.tracks.map(id => TRACKS.find(t => t.id === id)!).filter(Boolean);
                return (
                  <Card key={i} className="overflow-hidden" data-testid={`learning-path-${i}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <PathIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{path.name}</CardTitle>
                          <CardDescription>{path.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{path.duration}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pathTracks.map((pt, j) => {
                          const TIcon = pt.icon;
                          const diff = DIFFICULTY_CONFIG[pt.difficulty];
                          return (
                            <div key={j} className="flex items-center gap-3">
                              {j > 0 && <div className="w-5 flex justify-center"><ArrowRight className="h-3 w-3 text-muted-foreground" /></div>}
                              {j === 0 && <div className="w-5" />}
                              <div
                                className="flex-1 flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => { setSelectedTrack(pt.id); setActiveTab("tracks"); }}
                              >
                                <div className={`p-1.5 rounded-md bg-gradient-to-br ${pt.gradient} text-white`}>
                                  <TIcon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{pt.title}</span>
                                  <span className="text-xs text-muted-foreground ml-2">{pt.duration}</span>
                                </div>
                                <Badge className={`${diff.bg} ${diff.color} border-0 text-xs`}>{diff.label}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                        <Award className="h-3.5 w-3.5" />
                        <span>{pathTracks.length} track{pathTracks.length > 1 ? "s" : ""} · {pathTracks.reduce((a, t) => a + t.modules.length, 0)} modules</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" /> Memory Aids & Mnemonics
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Simple tricks to remember complex concepts — use these before any exam</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {MEMORY_AIDS.map((aid, i) => (
                <Card key={i} className="border-l-4 border-l-amber-400" data-testid={`memory-aid-${i}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">{aid.acronym}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{aid.concept}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">"{aid.meaning}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approach" className="mt-6">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Our Approach</h2>
              <p className="text-sm text-muted-foreground mt-1">Why this program is different from every PM course out there</p>
            </div>

            <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <Puzzle className="h-5 w-5 text-violet-600 dark:text-violet-400" /> The Three-Layer Architecture
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/70 dark:bg-black/20 rounded-lg">
                    <div className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-primary" /> Layer 1: Learn It
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The PM Academy teaches concepts, frameworks, and certification prep. Warm, engaging, full of memory aids and walk-throughs.
                    </p>
                  </div>
                  <div className="p-4 bg-white/70 dark:bg-black/20 rounded-lg">
                    <div className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <Workflow className="h-4 w-4 text-primary" /> Layer 2: Apply It
                    </div>
                    <p className="text-sm text-muted-foreground">
                      RPLICE, MCE, and the Ecosystem Hub provide real tools — wizards, dashboards, compliance tracking — where PM comes alive.
                    </p>
                  </div>
                  <div className="p-4 bg-white/70 dark:bg-black/20 rounded-lg">
                    <div className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-primary" /> Layer 3: Connect It
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Every lesson points to a platform tool. Every platform tool links back to the lesson. Learning and doing form a continuous loop.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Scale className="h-5 w-5 text-primary" /> What Makes This Different
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { other: "Study flashcards about risk registers", ours: "Build a real risk register in RPLICE for a live community program" },
                    { other: "Watch videos about stakeholder management", ours: "Use the Coalition Dashboard to manage actual stakeholders" },
                    { other: "Memorize PMBOK theory in isolation", ours: "Learn PM concepts AND implementation science together — the only program that does both" },
                    { other: "Practice on fake case studies", ours: "Practice on YOUR community's real programs" },
                    { other: "Certification prep only", ours: "Cert prep PLUS community impact — two outcomes, one curriculum" },
                    { other: "One methodology fits all", ours: "Agile, Waterfall, Hybrid, AND implementation science — choose what fits your context" },
                  ].map((row, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border">
                      <div className="shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">vs</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground line-through">{row.other}</p>
                        <p className="text-sm font-medium text-primary mt-1">{row.ours}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <HeartHandshake className="h-5 w-5 text-primary" /> Our Teaching Philosophy
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Warm & Engaging at Every Level", desc: "We explain like friends, not textbooks. A RACI matrix sounds corporate, but it answers the simplest question in any project: who's doing what? We start with the plain English, then give you the technical term." },
                    { title: "Walk-Through, Talk-Through", desc: "Every concept gets a guided walk-through with a real community example. We don't just tell you what a risk register is — we build one together for a real program, step by step." },
                    { title: "Memory First", desc: "Before any exam, you need recall. Every major concept gets a mnemonic, acronym, or visual anchor. I.P.E.M.C., RAID, DMAIC — these aren't just letters, they're shortcuts your brain can grab under pressure." },
                    { title: "Practice on Real Work", desc: "Your platforms ARE the classroom. RPLICE, MCE, and the Ecosystem Hub aren't simulations — they're production tools managing real community programs. You learn by doing real work that matters." },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-primary" /> Certification Targets
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <h4 className="font-semibold text-sm">CAPM</h4>
                    <p className="text-xs text-muted-foreground mt-1">Certified Associate in Project Management. Entry-level, no experience required. Perfect first certification.</p>
                    <Badge className="mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-xs">After PM Professional Track</Badge>
                  </div>
                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <h4 className="font-semibold text-sm">PMP</h4>
                    <p className="text-xs text-muted-foreground mt-1">Project Management Professional. The gold standard. Requires 3+ years PM experience.</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-xs">After PM Leadership Track</Badge>
                  </div>
                  <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <h4 className="font-semibold text-sm">Lean Six Sigma Green Belt</h4>
                    <p className="text-xs text-muted-foreground mt-1">Process improvement certification. DMAIC methodology for eliminating waste and variation.</p>
                    <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-xs">Foundations in PM Leadership Track</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <Microscope className="h-5 w-5 text-primary" /> The RPLICE Fusion
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  RPLICE was built to fuse the lessons of the business world with implementation science — and vice versa. 
                  The PM Academy is where you learn the frameworks. RPLICE is where those frameworks come alive with 
                  real dashboards, guided wizards, and workflow tools that enforce PM discipline while conducting 
                  evidence-based community work. MCE brings the same rigor to contract and business management, 
                  ensuring even non-certified users can manage federal contracts with fidelity — because the platform 
                  guides every step. The Ecosystem Hub ties it together, because the ecosystem itself is a portfolio 
                  of 20 interdependent platforms that need program management to function as one.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
