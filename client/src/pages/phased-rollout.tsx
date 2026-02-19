import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    subtitle: "Panther Merch Store + Fundraising",
    tagline: "Where entrepreneurship becomes tangible",
    timeline: "Weeks 1-4",
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
    timeline: "Weeks 5-10",
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
    timeline: "Weeks 11-16",
    status: "Ready to Launch",
    icon: Building2,
    color: "from-emerald-900 to-teal-800",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
];

const PHASE_STORIES = [
  "Students design merchandise, learn pricing, manage inventory, and fundraise for college tuition through the UBO partnership. This is where virtual learning produces real-world results -- actual products, actual revenue, actual impact.",
  "Spark becomes every student's personal learning companion -- emotionally intelligent, grade-band aware, bilingual. Students don't just consume AI; they master it through the AI Course, unlocking creation tools one by one. By the end, they're building presentations, business plans, and video scripts. Sparky supports parents and teachers with evidence-based strategies.",
  "The full Panther Village comes alive. Students trade stocks, build virtual campuses, compete in academic challenges, earn house points, and track their longitudinal journey from 6th grade through graduation. The IGN-Thrive system watches over every student. Career pathways connect today's learning to tomorrow's opportunities. This is where every phase converges into a living, breathing ecosystem.",
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
    { name: "IGN-Thrive", path: "/academy/thrive", desc: "Six-domain scoring, early warning system" },
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
      { label: "Revenue Model", value: "Real merchandise sales through UBO partnership", icon: DollarSign },
      { label: "Parent Engagement", value: "Tangible products families can see and support", icon: Users },
      { label: "Community Impact", value: "College tuition fundraising from day one", icon: Heart },
      { label: "Success Metrics", value: "Orders placed, revenue generated, families engaged, tuition funds raised", icon: BarChart3 },
      { label: "Risk Level", value: "Low -- this is the most concrete, visible phase", icon: Shield },
    ],
  },
  {
    items: [
      { label: "Educational Impact", value: "AI literacy as a core competency, not an add-on", icon: GraduationCap },
      { label: "Differentiation", value: "No other K-12 platform has grade-band emotional AI with progressive tool unlocking", icon: Sparkles },
      { label: "Parent Trust", value: "Spark has full safety guardrails; Sparky gives parents their own companion", icon: Shield },
      { label: "Success Metrics", value: "AI interactions per student, tools unlocked, projects created, course completions", icon: BarChart3 },
      { label: "Risk Level", value: "Medium -- requires teacher PD on AI integration, parent communication about AI safety", icon: AlertTriangle },
    ],
  },
  {
    items: [
      { label: "Full Ecosystem", value: "Every feature interconnected -- stocks fund merch, AI builds business plans, careers guide pathways", icon: Layers },
      { label: "Longitudinal Impact", value: "Tracking students from 6th grade through college", icon: Route },
      { label: "District Scalability", value: "Implementation guide with cost calculators at /implementation", icon: Globe },
      { label: "Community Building", value: "House system, competitions, and mentorship create belonging", icon: Users },
      { label: "Success Metrics", value: "Thrive scores, career pathway completions, mentor connections, graduation tracking", icon: BarChart3 },
      { label: "Risk Level", value: "Low-medium -- complex but all components are built and tested; phased activation within this phase recommended", icon: Shield },
    ],
  },
];

const IS_ARCHITECTURE_DATA = [
  {
    items: [
      { label: "Systems", value: "Merch catalog DB, order management, wallet/transaction engine", icon: Server },
      { label: "Integrations", value: "UBO fundraising partner API, payment processing readiness", icon: LinkIcon },
      { label: "Data", value: "Order analytics, wallet balance reporting, financial literacy progress", icon: Database },
      { label: "Security", value: "Transaction integrity, wallet balance validation", icon: Lock },
      { label: "Infrastructure", value: "Object storage for product images, PostgreSQL for orders/wallets", icon: Monitor },
    ],
  },
  {
    items: [
      { label: "Systems", value: "AI provider abstraction layer, SSE streaming, tool catalog, unlock tracking", icon: Server },
      { label: "Integrations", value: "Google Gemini (default), OpenAI fallback, Replit AI fallback", icon: LinkIcon },
      { label: "Data", value: "Conversation logs (privacy-compliant), tool usage analytics, unlock progression", icon: Database },
      { label: "Security", value: "Content filtering, age-appropriate responses, no PII in AI prompts", icon: Lock },
      { label: "Infrastructure", value: "Streaming API endpoints, configurable provider switching, rate limiting", icon: Monitor },
    ],
  },
  {
    items: [
      { label: "Systems", value: "Stock engine, portfolio tracker, Thrive scoring engine, GIS context engine, early warning system", icon: Server },
      { label: "Integrations", value: "CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data (GIS), ISSS cross-platform", icon: LinkIcon },
      { label: "Data", value: "Longitudinal student records, thrive analytics, career tracking, mentor matching", icon: Database },
      { label: "Security", value: "Student data privacy (FERPA), mentor verification, GIS data handling", icon: Lock },
      { label: "Infrastructure", value: "Full PostgreSQL schema (40+ tables), real-time dashboards, admin tooling", icon: Monitor },
    ],
  },
];

const ENGINEERING_DATA = [
  {
    items: [
      { label: "API Endpoints", value: "/api/academy/merch, /api/academy/merch/orders, /api/academy/wallet" },
      { label: "Database Tables", value: "academy_merch_items, academy_merch_orders, academy_wallets, academy_transactions" },
      { label: "Dependencies", value: "None -- fully self-contained module" },
      { label: "Test Coverage", value: "Order flow, wallet transactions, financial literacy module completion" },
      { label: "Deployment", value: "Feature flags for gradual merchant rollout" },
    ],
  },
  {
    items: [
      { label: "API Endpoints", value: "/api/ai/chat (SSE stream), /api/ai-tools, /api/ai-tools/modules, /api/ai-tools/projects" },
      { label: "AI Provider", value: "server/ai-provider.ts - provider-agnostic with Gemini default" },
      { label: "Database Tables", value: "ai_tool_catalog, ai_tool_unlocks, ai_tool_projects, ai_tool_attachments" },
      { label: "Dependencies", value: "Phase 1 wallet system (Panther Power points from AI completions)" },
      { label: "Configuration", value: "GEMINI_API_KEY (default), OPENAI_API_KEY (fallback), district-configurable" },
      { label: "Test Coverage", value: "AI response safety, tool unlock flow, streaming, project save/load" },
    ],
  },
  {
    items: [
      { label: "API Endpoints", value: "/api/academy/stocks, /api/academy/portfolio, /api/thrive, /api/careers, /api/pathway, /api/mentors, etc." },
      { label: "Core Engines", value: "server/thrive-engine.ts, server/early-warning.ts, server/gis-engine.ts" },
      { label: "Database", value: "40+ interconnected tables across all modules" },
      { label: "Dependencies", value: "Phases 1 & 2 (wallet, AI, financial literacy feed into this ecosystem)" },
      { label: "Cross-Platform", value: "server/cross-platform-api.ts for ISSS integration" },
      { label: "Test Coverage", value: "Stock trades, Thrive scoring, early warning triggers, career pathway CRUD" },
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
  { name: "Thrive Dashboard", path: "/academy/thrive", desc: "Six-domain IGN-Thrive scoring", icon: Activity },
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
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-6 sm:p-8 mb-8"
        data-testid="section-hero"
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-200 mb-4"
          onClick={() => navigate("/academy/admin")}
          data-testid="button-back-admin"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Admin
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-hero-title">
          Phased Rollout: From Vision to Village
        </h1>
        <p className="text-rose-100 text-base sm:text-lg mb-6" data-testid="text-hero-subtitle">
          A strategic deployment plan bridging the real and virtual worlds -- delivering measurable impact at every phase
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
                  "Students start by creating real products -- merchandise they design, price, and sell. Revenue flows to college tuition funds through the UBO partnership. Families see tangible results from day one.",
                  "Students learn to think with AI, not just use it. Spark becomes their personal learning companion. They unlock creation tools by mastering AI literacy modules. By the end, they're building presentations and business plans.",
                  "The full village comes alive. Every previous phase feeds into a living ecosystem where students trade stocks, compete in challenges, track their journey from 6th grade to graduation, and build the world they'll lead.",
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
              "Each phase builds on the last. By graduation, they haven't just learned -- they've built something."
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
