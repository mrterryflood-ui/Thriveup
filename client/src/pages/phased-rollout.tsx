import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import {
  ArrowLeft,
  CheckCircle2,
  ShoppingBag,
  Brain,
  Building2,
  Clock,
  Rocket,
  Users,
  Shield,
  Server,
  Code2,
  TrendingUp,
  Wallet,
  BookOpen,
  Zap,
  Sparkles,
  MessageSquare,
  Presentation,
  GraduationCap,
  BarChart3,
  Trophy,
  Map,
  Flag,
  Briefcase,
  Route,
  Activity,
  Gamepad2,
  Target,
  Heart,
  DollarSign,
  Database,
  Lock,
  Globe,
  FileText,
  Settings,
  AlertTriangle,
  ChevronRight,
  Layers,
  Link as LinkIcon,
  Monitor,
  ClipboardCheck,
} from "lucide-react";

const PHASES = [
  {
    id: 1,
    title: "The Print Shop",
    subtitle: "Real Merchandise, Real Revenue, Real Impact",
    tagline: "Where entrepreneurship becomes tangible -- physical products, actual revenue, college tuition funded",
    timeline: "Quarter 1 (Q1)",
    status: "Ready to Launch",
    icon: ShoppingBag,
    color: "from-rose-900 to-red-800",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  },
  {
    id: 2,
    title: "AI Training Ground",
    subtitle: "AI Companions + Creation Studio",
    tagline: "Teaching students to think with AI, not just use it",
    timeline: "Quarter 2 (Q2)",
    status: "Ready to Launch",
    icon: Brain,
    color: "from-violet-900 to-purple-800",
    badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  },
  {
    id: 3,
    title: "The Virtual Village",
    subtitle: "Stock Market + Campus + Full Ecosystem",
    tagline: "Building the world they'll lead",
    timeline: "Quarter 3 (Q3)",
    status: "Ready to Launch",
    icon: Building2,
    color: "from-emerald-900 to-teal-800",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
];

const PHASE_STORIES = [
  "This is not a simulation. The Print Shop is a real business producing physical merchandise -- t-shirts, hoodies, hats, and branded gear that students design, price, and sell. Revenue goes directly to college tuition funds through the UBO partnership. Families hold the products in their hands. The community sees real results. Students learn entrepreneurship by doing it, not reading about it. Admins manage inventory, approve designs, track orders, and report revenue to the district every step of the way.",
  "Spark becomes every student's personal learning companion -- emotionally intelligent, grade-band aware, bilingual. Students don't just consume AI; they master it through the AI Course, unlocking creation tools one by one. By the end, they're building presentations, business plans, and video scripts. Sparky supports parents and teachers with evidence-based strategies. Admins control AI configuration, monitor safety guardrails, review usage analytics, and manage course content throughout the quarter.",
  "The full Panther Village comes alive. Students trade stocks, build virtual campuses, compete in academic challenges, earn house points, and track their longitudinal journey from 6th grade through graduation. The Thrive system watches over every student. Career pathways connect today's learning to tomorrow's opportunities. Admins manage the entire ecosystem -- from early warning interventions to mentor approvals, competition scheduling to progress reporting. This is where every phase converges into a living, breathing ecosystem.",
];

const PHASE_FEATURES = [
  [
    { name: "Merch Store", path: "/academy/merch", desc: "Product catalog, ordering system, order tracking" },
    { name: "Panther Wallet", path: "/academy/wallet", desc: "Virtual currency, transaction history" },
    { name: "Financial Literacy", path: "/academy/financial-literacy", desc: "15 modules, 975 Panther Power points" },
    { name: "Panther Power Score", path: "/academy/power", desc: "Unified empowerment metric" },
  ],
  [
    { name: "Spark AI Companion", path: "/ai-companion", desc: "Grade-band emotional intelligence, Socratic questioning, safety guardrails" },
    { name: "Sparky Adult Companion", path: "/sparky", desc: "Parent/teacher support, evidence-based strategies" },
    { name: "AI Creation Studio", path: "/ai-tools", desc: "10 tools with wizard workflows" },
    { name: "AI Course Modules", path: "/ai-tools", desc: "Progressive unlocking system (complete module to unlock tool)" },
    { name: "LMS Course Creator", path: "/academy/course-creator", desc: "Admin course building with 10 categories" },
  ],
  [
    { name: "Stock Market", path: "/academy/stocks", desc: "Simulated trading, portfolio management, community portfolio" },
    { name: "Panther Village", path: "/academy", desc: "Interactive campus landing with building navigation" },
    { name: "Build Your Campus", path: "/academy/campus", desc: "Virtual campus construction project" },
    { name: "Academic Competitions", path: "/academy/competitions", desc: "Challenges with house system" },
    { name: "House System", path: "/academy/houses", desc: "Merit events, house points, inter-house rivalry" },
    { name: "Career Explorer", path: "/academy/careers", desc: "50+ career pathways" },
    { name: "My Pathway", path: "/academy/pathway", desc: "Longitudinal tracker grades 6-12+" },
    { name: "Mentor Network", path: "/academy/mentors", desc: "Professional connections" },
    { name: "Thrive", path: "/academy/thrive", desc: "Six-domain scoring, early warning system" },
    { name: "Game Room", path: "/academy/games", desc: "ELO-rated educational games" },
    { name: "Scenarios & Marketplace", path: "/academy/scenarios", desc: "Decision simulations, peer trading" },
    { name: "Daily Quests", path: "/academy/quests", desc: "Engagement system" },
    { name: "Dream Profile", path: "/academy/dreams", desc: "Student aspiration mapping" },
    { name: "Journal", path: "/academy/journal", desc: "Student reflection" },
    { name: "Attendance", path: "/academy/attendance", desc: "Real-time tracking" },
    { name: "Progress Reports", path: "/academy/progress-report", desc: "Analytics" },
    { name: "Cross-Platform Integration", path: "/academy/integration", desc: "ISSS connectivity" },
  ],
];

const STAKEHOLDER_DATA = [
  {
    items: [
      { label: "Revenue Model", value: "Real physical merchandise sales through UBO partnership -- t-shirts, hoodies, branded gear shipped to real customers", icon: DollarSign },
      { label: "Parent Engagement", value: "Families hold physical products in their hands. This is not virtual -- it is tangible proof of student work", icon: Users },
      { label: "Community Impact", value: "Every dollar of revenue goes toward college tuition funds. Community fundraising events amplify reach", icon: Heart },
      { label: "Admin Role (Q1)", value: "Admins approve product designs, manage inventory levels, oversee order fulfillment, generate quarterly revenue reports, coordinate UBO partnership logistics, and host parent information sessions", icon: Settings },
      { label: "Success Metrics", value: "Physical orders shipped, total revenue generated, families participating, tuition dollars raised, inventory turnover rate", icon: BarChart3 },
      { label: "Risk Level", value: "Low -- this is the most concrete, visible phase. Physical products create immediate credibility with families and district leadership", icon: Shield },
    ],
  },
  {
    items: [
      { label: "Educational Impact", value: "AI literacy as a core competency, not an add-on. Students learn to think critically with AI tools", icon: GraduationCap },
      { label: "Differentiation", value: "No other K-12 platform has grade-band emotional AI with progressive tool unlocking", icon: Sparkles },
      { label: "Parent Trust", value: "Spark has full safety guardrails; Sparky gives parents their own companion for support and understanding", icon: Shield },
      { label: "Admin Role (Q2)", value: "Admins configure AI providers, set safety thresholds, review conversation analytics, create and publish courses through LMS Course Creator, approve tool unlock progressions, monitor student engagement, and run teacher PD sessions", icon: Settings },
      { label: "Success Metrics", value: "AI interactions per student, tools unlocked, projects created, course completions, parent Sparky adoption rate", icon: BarChart3 },
      { label: "Risk Level", value: "Medium -- requires teacher PD on AI integration, parent communication about AI safety. Admin-led parent nights mitigate this", icon: AlertTriangle },
    ],
  },
  {
    items: [
      { label: "Full Ecosystem", value: "Every feature interconnected -- stocks fund merch, AI builds business plans, careers guide pathways. The real and virtual worlds merge", icon: Layers },
      { label: "Longitudinal Impact", value: "Tracking students from 6th grade through college. Every achievement, pathway, and milestone captured", icon: Route },
      { label: "District Scalability", value: "Implementation guide with cost calculators at /implementation. Ready for multi-campus deployment", icon: Globe },
      { label: "Community Building", value: "House system, competitions, and mentorship create belonging. Mentor verification ensures student safety", icon: Users },
      { label: "Admin Role (Q3)", value: "Admins manage Thrive early warnings and interventions, approve mentors, schedule competitions, oversee stock market parameters, review longitudinal progress, generate district-level analytics, and coordinate cross-platform ISSS integration", icon: Settings },
      { label: "Success Metrics", value: "Thrive scores, career pathway completions, mentor connections, graduation tracking, early warning resolution rate", icon: BarChart3 },
      { label: "Risk Level", value: "Low-medium -- complex but all components are built and tested. Admin-managed phased activation within this quarter recommended", icon: Shield },
    ],
  },
];

const IS_ARCHITECTURE_DATA = [
  {
    items: [
      { label: "Systems", value: "Merch catalog DB, order management, wallet/transaction engine, UBO fulfillment pipeline", icon: Server },
      { label: "Integrations", value: "UBO fundraising partner API, payment processing, shipping/fulfillment tracking", icon: LinkIcon },
      { label: "Data", value: "Order analytics, wallet balance reporting, financial literacy progress, quarterly revenue dashboards", icon: Database },
      { label: "Security", value: "Transaction integrity, wallet balance validation, order audit trail", icon: Lock },
      { label: "Infrastructure", value: "Object storage for product images, PostgreSQL for orders/wallets, admin approval workflows", icon: Monitor },
      { label: "Admin Controls", value: "Product approval queue, inventory management console, revenue reporting, order status dashboard, UBO partnership coordination panel", icon: Settings },
    ],
  },
  {
    items: [
      { label: "Systems", value: "AI provider abstraction layer, SSE streaming, tool catalog, unlock tracking, course management", icon: Server },
      { label: "Integrations", value: "Google Gemini (default), OpenAI fallback, Replit AI fallback -- admin-switchable", icon: LinkIcon },
      { label: "Data", value: "Conversation logs (privacy-compliant), tool usage analytics, unlock progression, course enrollment metrics", icon: Database },
      { label: "Security", value: "Content filtering, age-appropriate responses, no PII in AI prompts, admin-configurable safety thresholds", icon: Lock },
      { label: "Infrastructure", value: "Streaming API endpoints, configurable provider switching, rate limiting, LMS course authoring", icon: Monitor },
      { label: "Admin Controls", value: "AI provider configuration panel, safety threshold settings, usage analytics dashboard, LMS Course Creator with 10 categories, student progress monitoring", icon: Settings },
    ],
  },
  {
    items: [
      { label: "Systems", value: "Stock engine, portfolio tracker, Thrive scoring engine, GIS context engine, early warning system", icon: Server },
      { label: "Integrations", value: "CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data (GIS), ISSS cross-platform", icon: LinkIcon },
      { label: "Data", value: "Longitudinal student records, thrive analytics, career tracking, mentor matching, district-level reporting", icon: Database },
      { label: "Security", value: "Student data privacy (FERPA), mentor verification, GIS data handling, role-based access control", icon: Lock },
      { label: "Infrastructure", value: "Full PostgreSQL schema (40+ tables), real-time dashboards, admin tooling, cross-platform sync", icon: Monitor },
      { label: "Admin Controls", value: "Thrive early warning intervention panel, mentor approval workflow, competition scheduler, stock market parameter controls, progress report generator, ISSS integration manager", icon: Settings },
    ],
  },
];

const ENGINEERING_DATA = [
  {
    items: [
      { label: "API Endpoints", value: "/api/academy/merch, /api/academy/merch/orders, /api/academy/wallet, /api/academy/financial-literacy" },
      { label: "Database Tables", value: "academy_merch_items, academy_merch_orders, academy_wallets, academy_transactions" },
      { label: "Dependencies", value: "None -- fully self-contained module, ready for Q1 launch" },
      { label: "Admin APIs", value: "POST/PUT/DELETE /api/academy/merch (admin-only CRUD), order status management, inventory controls" },
      { label: "Test Coverage", value: "Order flow, wallet transactions, financial literacy module completion, admin CRUD operations" },
      { label: "Deployment", value: "Feature flags for gradual rollout within Q1. Admin dashboard live from day one" },
    ],
  },
  {
    items: [
      { label: "API Endpoints", value: "/api/ai/chat (SSE stream), /api/ai-tools, /api/ai-tools/modules, /api/ai-tools/projects" },
      { label: "AI Provider", value: "server/ai-provider.ts - provider-agnostic with Gemini default, admin-switchable" },
      { label: "Database Tables", value: "ai_tool_catalog, ai_tool_unlocks, ai_tool_projects, academy_courses, course_modules, course_lessons" },
      { label: "Admin APIs", value: "Course Creator CRUD (/api/courses), AI provider config, safety threshold management, usage analytics export" },
      { label: "Dependencies", value: "Q1 wallet system (Panther Power points from AI completions)" },
      { label: "Configuration", value: "GEMINI_API_KEY (default), OPENAI_API_KEY (fallback), district-configurable by admin" },
      { label: "Test Coverage", value: "AI response safety, tool unlock flow, streaming, project save/load, course CRUD, admin controls" },
    ],
  },
  {
    items: [
      { label: "API Endpoints", value: "/api/academy/stocks, /api/academy/portfolio, /api/thrive, /api/careers, /api/pathway, /api/mentors, etc." },
      { label: "Core Engines", value: "server/thrive-engine.ts, server/early-warning.ts, server/gis-engine.ts" },
      { label: "Database", value: "40+ interconnected tables across all modules" },
      { label: "Admin APIs", value: "Thrive intervention endpoints, mentor approval workflow, competition management, stock market parameter config, district analytics export" },
      { label: "Dependencies", value: "Q1 & Q2 (wallet, AI, financial literacy feed into this ecosystem)" },
      { label: "Cross-Platform", value: "server/cross-platform-api.ts for ISSS integration, admin-managed sync configuration" },
      { label: "Test Coverage", value: "Stock trades, Thrive scoring, early warning triggers, career pathway CRUD, admin intervention flows" },
    ],
  },
];

const READINESS_CATEGORIES = [
  "Code Complete",
  "Database Ready",
  "API Tested",
  "Admin Tools",
  "Accessibility",
  "Documentation",
];

const QUICK_LINKS = [
  { name: "Admin Dashboard", path: "/academy/admin", desc: "Monitor students, activity, and system health", icon: Shield },
  { name: "Course Creator", path: "/academy/course-creator", desc: "Build and manage learning modules", icon: BookOpen },
  { name: "Implementation Guide", path: "/implementation", desc: "District rollout with cost calculators", icon: ClipboardCheck },
  { name: "Risk Monitor", path: "/academy/risk-monitor", desc: "Track risks and mitigation status", icon: AlertTriangle },
  { name: "Admin Tutorial", path: "/academy/admin-tutorial", desc: "Step-by-step admin walkthrough", icon: Presentation },
  { name: "Video Script Generator", path: "/academy/admin-video-script", desc: "Create promotional video scripts", icon: FileText },
  { name: "Progress Reports", path: "/academy/progress-report", desc: "Student analytics and reporting", icon: BarChart3 },
  { name: "Thrive Dashboard", path: "/academy/thrive", desc: "Six-domain Thrive scoring", icon: Activity },
];

function PhaseCard({
  phase,
  phaseIndex,
  perspective,
  navigate,
}: {
  phase: typeof PHASES[0];
  phaseIndex: number;
  perspective: string;
  navigate: (path: string) => void;
}) {
  const PhaseIcon = phase.icon;


  useEffect(() => { document.title = "Phased Rollout Plan | ThriveUp Academy"; }, []);
  return (
    <Card data-testid={`card-phase-${phase.id}-${perspective}`} className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`rounded-md p-2.5 bg-gradient-to-br ${phase.color}`}>
              <PhaseIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid={`text-phase-title-${phase.id}`}>
                Phase {phase.id}: {phase.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{phase.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" data-testid={`badge-timeline-${phase.id}`}>
              <Clock className="h-3 w-3 mr-1" />
              {phase.timeline}
            </Badge>
            <Badge variant="secondary" className={phase.badgeColor} data-testid={`badge-status-${phase.id}`}>
              <Rocket className="h-3 w-3 mr-1" />
              {phase.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary italic mb-3" data-testid={`text-tagline-${phase.id}`}>
            "{phase.tagline}"
          </p>
          <p className="text-sm text-muted-foreground" data-testid={`text-story-${phase.id}`}>
            {PHASE_STORIES[phaseIndex]}
          </p>
        </div>

        {perspective === "stakeholder" && (
          <>
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Platform Features Ready
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHASE_FEATURES[phaseIndex].map((feat) => (
                  <div
                    key={feat.name}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50 cursor-pointer hover-elevate"
                    onClick={() => navigate(feat.path)}
                    data-testid={`link-feature-${feat.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{feat.name}</p>
                      <p className="text-xs text-muted-foreground">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Stakeholder Perspective
              </h4>
              <div className="space-y-3">
                {STAKEHOLDER_DATA[phaseIndex].items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3" data-testid={`text-stakeholder-${phase.id}-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      <div className="rounded-md p-1.5 bg-primary/10 shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {perspective === "architecture" && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> IS Architecture
            </h4>
            <div className="space-y-3">
              {IS_ARCHITECTURE_DATA[phaseIndex].items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3" data-testid={`text-arch-${phase.id}-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <div className="rounded-md p-1.5 bg-primary/10 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {perspective === "engineering" && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" /> Engineering Details
            </h4>
            <div className="space-y-3">
              {ENGINEERING_DATA[phaseIndex].items.map((item) => (
                <div key={item.label} className="flex items-start gap-2" data-testid={`text-eng-${phase.id}-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PhasedRolloutPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("stakeholder");

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" data-testid="page-phased-rollout">
      <PageHeader
        title="Implementation Roadmap"
        description="A quarterly deployment plan bridging the real and virtual worlds -- with admin leadership at every milestone."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rollout" }]}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-6 sm:p-8 mb-8"
        data-testid="section-hero"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-hero-title">
          Phased Rollout: From Vision to Village
        </h1>
        <p className="text-rose-100 text-base sm:text-lg mb-6" data-testid="text-hero-subtitle">
          A quarterly deployment plan bridging the real and virtual worlds -- with admin leadership at every milestone, delivering measurable impact from real products to living ecosystems
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {PHASES.map((phase, idx) => (
            <div key={phase.id} className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
                data-testid={`badge-phase-indicator-${phase.id}`}
              >
                <phase.icon className="h-3.5 w-3.5 mr-1.5" />
                Phase {phase.id}: {phase.title}
              </Badge>
              {idx < PHASES.length - 1 && (
                <ChevronRight className="h-4 w-4 text-rose-300 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-perspective">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-list-perspective">
          <TabsTrigger value="stakeholder" data-testid="tab-stakeholder">
            <Users className="h-4 w-4 mr-1.5" />
            Stakeholder View
          </TabsTrigger>
          <TabsTrigger value="architecture" data-testid="tab-architecture">
            <Server className="h-4 w-4 mr-1.5" />
            IS Architecture View
          </TabsTrigger>
          <TabsTrigger value="engineering" data-testid="tab-engineering">
            <Code2 className="h-4 w-4 mr-1.5" />
            Engineering View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stakeholder">
          {PHASES.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              phaseIndex={idx}
              perspective="stakeholder"
              navigate={navigate}
            />
          ))}
        </TabsContent>

        <TabsContent value="architecture">
          {PHASES.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              phaseIndex={idx}
              perspective="architecture"
              navigate={navigate}
            />
          ))}
        </TabsContent>

        <TabsContent value="engineering">
          {PHASES.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              phaseIndex={idx}
              perspective="engineering"
              navigate={navigate}
            />
          ))}
        </TabsContent>
      </Tabs>

      <Card className="mb-8" data-testid="card-story-arc">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-story-arc-title">
            <Route className="h-5 w-5 text-primary" />
            The Story Arc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 via-violet-500 to-emerald-500" />
            <div className="space-y-8 pl-10">
              {PHASES.map((phase, idx) => {
                const PhaseIcon = phase.icon;
                const narratives = [
                  "Q1: Students launch a real business. Physical merchandise -- designed, priced, and sold by students -- ships to real customers. Revenue funds college tuition through UBO. Admins manage inventory, approve designs, and report revenue to the district. Families hold the proof in their hands.",
                  "Q2: Students learn to think with AI, not just use it. Spark becomes their personal learning companion. They unlock creation tools by mastering AI literacy modules. Admins configure providers, monitor safety, and build curriculum through the Course Creator. Parents meet Sparky.",
                  "Q3: The full village comes alive. Every previous quarter feeds into a living ecosystem where students trade stocks, compete in challenges, track their journey from 6th grade to graduation, and build the world they'll lead. Admins orchestrate the entire ecosystem -- interventions, mentors, competitions, and district-level analytics.",
                ];
                return (
                  <div key={phase.id} className="relative" data-testid={`story-arc-phase-${phase.id}`}>
                    <div className={`absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center`}>
                      <PhaseIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Phase {phase.id}: {phase.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{narratives[idx]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Card className="mt-6 p-4 bg-muted/50" data-testid="card-story-summary">
            <p className="text-sm text-center italic text-muted-foreground">
              "Quarter by quarter, the virtual and real worlds converge. By graduation, students haven't just learned -- they've built real businesses, mastered AI, and led communities. Admins have guided every step."
            </p>
          </Card>
        </CardContent>
      </Card>

      <Card className="mb-8" data-testid="card-readiness-scorecard">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-readiness-title">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Readiness Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-readiness">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Category</th>
                  {PHASES.map((phase) => (
                    <th key={phase.id} className="pb-3 px-4 text-center font-medium text-muted-foreground">
                      Phase {phase.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {READINESS_CATEGORIES.map((category) => (
                  <tr key={category} className="border-b last:border-b-0" data-testid={`row-readiness-${category.toLowerCase().replace(/\s+/g, "-")}`}>
                    <td className="py-3 pr-4 font-medium text-sm">{category}</td>
                    {PHASES.map((phase) => (
                      <td key={phase.id} className="py-3 px-4 text-center">
                        <CheckCircle2
                          className="h-5 w-5 text-emerald-500 mx-auto"
                          data-testid={`icon-ready-${category.toLowerCase().replace(/\s+/g, "-")}-phase-${phase.id}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr data-testid="row-readiness-notes">
                  <td colSpan={4} className="pt-4 text-xs text-muted-foreground">
                    All phases meet WCAG 2.1 AA accessibility standards with full bilingual (English/Spanish) support.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8" data-testid="card-admin-involvement">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-admin-title">
            <Settings className="h-5 w-5 text-primary" />
            Admin Involvement: Quarter by Quarter
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Administrators are not observers -- they are active leaders in every phase of the rollout.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                quarter: "Q1: The Print Shop",
                color: "from-rose-900 to-red-800",
                icon: ShoppingBag,
                checkpoints: [
                  { month: "Month 1", tasks: "Onboard UBO partnership, configure merch catalog, approve initial product designs, set pricing tiers, launch parent information campaign" },
                  { month: "Month 2", tasks: "Monitor order fulfillment, manage inventory restocking, review financial literacy module engagement, host first community fundraising event" },
                  { month: "Month 3", tasks: "Generate quarterly revenue report, analyze wallet transaction trends, review student financial literacy progress, prepare Q2 transition briefing for stakeholders" },
                ],
              },
              {
                quarter: "Q2: AI Training Ground",
                color: "from-violet-900 to-purple-800",
                icon: Brain,
                checkpoints: [
                  { month: "Month 4", tasks: "Configure AI provider (Gemini/OpenAI), set safety thresholds, launch teacher PD sessions, publish first courses through LMS Course Creator, host parent AI safety night" },
                  { month: "Month 5", tasks: "Monitor AI conversation analytics, review tool unlock progressions, manage course enrollments, assess student engagement metrics, coordinate Sparky rollout to parents" },
                  { month: "Month 6", tasks: "Generate AI usage report, review safety incident logs (if any), evaluate course completion rates, prepare Q3 transition with ecosystem integration plan" },
                ],
              },
              {
                quarter: "Q3: The Virtual Village",
                color: "from-emerald-900 to-teal-800",
                icon: Building2,
                checkpoints: [
                  { month: "Month 7", tasks: "Launch stock market with initial parameters, activate house system and competitions, begin mentor verification and approvals, configure Thrive scoring domains" },
                  { month: "Month 8", tasks: "Monitor early warning system, manage intervention workflows, review longitudinal pathway data, schedule academic competitions, coordinate ISSS cross-platform sync" },
                  { month: "Month 9", tasks: "Generate comprehensive district analytics, review full-year student progress, produce longitudinal reports, plan next academic year expansion, present ecosystem impact to district leadership" },
                ],
              },
            ].map((q) => {
              const QIcon = q.icon;
              return (
                <div key={q.quarter} data-testid={`admin-quarter-${q.quarter.slice(0, 2).toLowerCase()}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`rounded-md p-1.5 bg-gradient-to-br ${q.color}`}>
                      <QIcon className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm">{q.quarter}</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-8">
                    {q.checkpoints.map((cp) => (
                      <Card key={cp.month} className="p-3 bg-muted/30">
                        <p className="text-xs font-semibold text-primary mb-1">{cp.month}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{cp.tasks}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8" data-testid="section-quick-links">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.name}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => navigate(link.path)}
                data-testid={`card-quicklink-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md p-2 bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{link.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{link.path}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
