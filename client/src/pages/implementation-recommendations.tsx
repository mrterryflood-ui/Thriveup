import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BackToTop } from "@/components/back-to-top";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  GraduationCap,
  ClipboardCheck,
  Brain,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  Lock,
  Unlock,
  BookOpen,
  Gamepad2,
  Briefcase,
  Sparkles,
  Calculator,
  TrendingUp,
  AlertCircle,
  CircleDot,
  Milestone,
} from "lucide-react";

interface GradeData {
  grade: number;
  label: string;
  features: string[];
  phasing: string;
  subjectIntegration: Record<string, string>;
  aiToolAccess: string[];
  aiGating: string;
  developmental: string[];
  rationale: string;
  wauTarget: string;
  aiModules: string;
  financialLiteracy: string;
}

const GRADE_DATA: GradeData[] = [
  {
    grade: 6,
    label: "6th Grade",
    features: [
      "Panther Village + Avatar customization (engagement gateway)",
      "Spark AI companion (guided, scaffolded)",
      "Game Room with play-budget mechanics",
      "Career Explorer (introductory)",
      "AI Creation Studio (basic tools, Week 4)",
    ],
    phasing: "Week 1: Panther Village + Avatar | Week 2: Add Spark | Week 3: Games + Career Explorer | Week 4: AI Tools",
    subjectIntegration: {
      Math: "Budget games, wallet math, basic stock concepts",
      Science: "Spark-guided inquiry prompts, simple data collection",
      ELA: "Journal writing, Spark conversation practice, letter tracing",
      "Social Studies": "Community scenarios, house governance intro",
      "PE/Health": "Breathing exercises, emotion check-ins, wellness quests",
      Electives: "Avatar design, creative expression tools",
    },
    aiToolAccess: ["Story Writer (basic)", "Quiz Maker (teacher-curated)", "Image Describer"],
    aiGating: "Teacher-approved access only. Maximum 3 AI tools unlocked. Session time limits enforced.",
    developmental: [
      "Concrete operational thinking - needs tangible, relatable examples",
      "Peer comparison sensitivity - use cooperative over competitive mechanics",
      "Short attention spans - chunk activities into 10-15 min segments",
      "Identity formation beginning - avatar customization drives engagement",
    ],
    rationale: "6th graders need maximum scaffolding and concrete experiences. Phased rollout prevents overwhelm. AI tools introduced last to build digital literacy foundation first.",
    wauTarget: "60% weekly active users",
    aiModules: "5-6 modules (reduced from 10)",
    financialLiteracy: "6-8 core modules of 15 (concrete, relatable concepts)",
  },
  {
    grade: 7,
    label: "7th Grade",
    features: [
      "All 6th grade features unlocked from start",
      "Expanded Game Room (competitive modes)",
      "Career Explorer (interest inventories)",
      "AI Creation Studio (5-6 tools)",
      "Financial Literacy intermediate modules",
    ],
    phasing: "Week 1: Full village + Spark | Week 2: Games + Career | Week 3: AI Tools + Financial Literacy",
    subjectIntegration: {
      Math: "Stock market simulation, percentage/ratio via wallet",
      Science: "AI-assisted research questions, hypothesis building",
      ELA: "Creative writing with AI feedback, persuasive essays",
      "Social Studies": "Economic systems via marketplace, civic engagement scenarios",
      "PE/Health": "Goal-setting dashboards, health literacy modules",
      Electives: "Digital art creation, music exploration tools",
    },
    aiToolAccess: ["Story Writer", "Quiz Maker", "Image Describer", "Code Explorer (intro)", "Research Helper"],
    aiGating: "Student-initiated with teacher oversight. 5 tools available. Usage dashboard visible to teachers.",
    developmental: [
      "Beginning abstract thinking - can handle multi-step problems",
      "Increased social awareness - group projects and house competitions",
      "Growing independence - reduce scaffolding by 20%",
      "Risk-taking behavior emerging - needs clear digital citizenship guidance",
    ],
    rationale: "7th graders are ready for increased autonomy but still need guardrails. Faster feature rollout reflects growing digital comfort. Competitive elements engage this age group.",
    wauTarget: "65% weekly active users",
    aiModules: "7 modules",
    financialLiteracy: "9-10 modules (adding saving/investing basics)",
  },
  {
    grade: 8,
    label: "8th Grade",
    features: [
      "Full platform access with minimal gating",
      "Advanced Game Room (strategy games)",
      "Career Explorer (pathway mapping)",
      "AI Creation Studio (7-8 tools)",
      "Marketplace with peer trading",
      "Portfolio introduction",
    ],
    phasing: "Week 1: Full access | Week 2: Portfolio setup + Advanced AI",
    subjectIntegration: {
      Math: "Data analysis projects, statistical thinking via Thrive scores",
      Science: "AI-assisted experiment design, data visualization",
      ELA: "Research papers with AI research tools, media literacy",
      "Social Studies": "Global economics simulation, leadership scenarios",
      "PE/Health": "Personal wellness plans, mental health awareness",
      Electives: "Entrepreneurship projects, digital portfolio building",
    },
    aiToolAccess: ["All basic tools", "Code Explorer", "Research Helper", "Presentation Builder", "Data Analyzer"],
    aiGating: "Self-directed with periodic teacher check-ins. 8 tools available. Students manage own usage.",
    developmental: [
      "Formal operational thinking developing - abstract reasoning",
      "Future orientation increasing - career/college prep resonates",
      "Peer influence peak - leverage social features positively",
      "Identity consolidation - portfolio work supports self-reflection",
    ],
    rationale: "8th grade is the transition year. Students should demonstrate self-regulation with AI tools. Portfolio introduction prepares for high school expectations.",
    wauTarget: "70% weekly active users",
    aiModules: "8 modules",
    financialLiteracy: "11-12 modules (credit, budgeting, entrepreneurship basics)",
  },
  {
    grade: 9,
    label: "9th Grade",
    features: [
      "Full platform + high school pathway tools",
      "Career Explorer with internship connections",
      "AI Creation Studio (full suite)",
      "Mentorship matching",
      "Digital portfolio (required)",
      "Cross-class competitions",
    ],
    phasing: "Week 1: Full access + Portfolio requirement | Week 2: Mentorship onboarding",
    subjectIntegration: {
      Math: "Financial modeling, investment analysis projects",
      Science: "AI-powered lab reports, research methodology",
      ELA: "College essay prep, professional communication",
      "Social Studies": "Policy analysis, community impact projects",
      "PE/Health": "Nutrition planning, stress management tools",
      Electives: "Industry exploration, skill certification paths",
    },
    aiToolAccess: ["Full AI Creation Studio", "Advanced Code Editor", "Business Plan Generator", "Resume Builder"],
    aiGating: "Open access with quality monitoring. All tools available. Teacher receives weekly AI usage summaries.",
    developmental: [
      "Abstract thinking matured - ready for complex problem-solving",
      "Career awareness critical - connect learning to future goals",
      "Social identity exploration - diverse project options important",
      "Executive function developing - support self-management skills",
    ],
    rationale: "High school entry requires portfolio accountability. Full AI access prepares for college/career digital literacy. Mentorship provides adult guidance beyond classroom.",
    wauTarget: "72% weekly active users",
    aiModules: "Full 10 modules",
    financialLiteracy: "13 modules (investing, taxes, financial planning)",
  },
  {
    grade: 10,
    label: "10th Grade",
    features: [
      "Advanced portfolio building",
      "Industry mentor connections",
      "Peer tutoring/mentoring tools",
      "Leadership roles in houses",
      "Competition design (student-created)",
      "Financial literacy certification track",
    ],
    phasing: "Continuous access - feature unlocks based on portfolio milestones",
    subjectIntegration: {
      Math: "AP prep integration, real-world data projects",
      Science: "Research paper workflow, peer review system",
      ELA: "Publication portfolio, creative writing collections",
      "Social Studies": "Mock government, economic policy debates",
      "PE/Health": "Fitness goal tracking, community health projects",
      Electives: "Entrepreneurship capstone prep, technical certifications",
    },
    aiToolAccess: ["Full suite + peer collaboration tools", "AI Teaching Assistant mode", "Prompt Engineering basics"],
    aiGating: "Self-managed. Students can become AI tool mentors for younger grades. Quality metrics tracked.",
    developmental: [
      "Identity vs role confusion resolution - leadership opportunities",
      "Increasing autonomy need - student-directed learning paths",
      "Career crystallization beginning - internship readiness",
      "Metacognition developing - self-assessment capabilities",
    ],
    rationale: "10th graders benefit from leadership roles and peer mentoring. Portfolio milestones replace time-based gating. Student agency in competition design increases engagement.",
    wauTarget: "75% weekly active users",
    aiModules: "Full 10 + advanced electives",
    financialLiteracy: "Full 15 modules (stock market, retirement planning)",
  },
  {
    grade: 11,
    label: "11th Grade",
    features: [
      "College/career readiness dashboard",
      "Advanced mentorship (industry professionals)",
      "Student ambassador program",
      "Cross-school competition access",
      "Financial literacy practicum",
      "AI tool creation (prompt engineering)",
    ],
    phasing: "Full autonomy - milestone-based feature celebrations",
    subjectIntegration: {
      Math: "SAT/ACT prep integration, statistical research projects",
      Science: "Independent research projects, conference presentations",
      ELA: "College application essays, scholarship writing",
      "Social Studies": "Civic engagement projects, voter registration",
      "PE/Health": "Wellness program design, community health advocacy",
      Electives: "Startup incubator, patent/IP exploration",
    },
    aiToolAccess: ["Full suite + custom prompt creation", "AI Ethics curriculum", "Cross-platform AI tools"],
    aiGating: "Autonomous. Students contribute to AI tool improvement. Peer review of AI outputs required for major projects.",
    developmental: [
      "Future planning intensifies - college/career urgency",
      "Increased responsibility capacity - real-world project management",
      "Moral reasoning advancement - AI ethics discussions",
      "Independence preparation - self-directed learning essential",
    ],
    rationale: "11th grade is college prep crunch time. Platform becomes a portfolio showcase and application support tool. AI ethics curriculum prepares for responsible technology use.",
    wauTarget: "78% weekly active users",
    aiModules: "Full curriculum + AI ethics",
    financialLiteracy: "Full 15 + investment practicum",
  },
  {
    grade: 12,
    label: "12th Grade",
    features: [
      "Capstone portfolio completion",
      "Alumni network preview",
      "College transition tools",
      "Financial independence planning",
      "Legacy project (contribute back to platform)",
      "Peer mentoring certification",
    ],
    phasing: "Graduation pathway - legacy contributions and knowledge transfer",
    subjectIntegration: {
      Math: "Personal finance capstone, investment portfolio review",
      Science: "Research publication support, STEM career connections",
      ELA: "Professional writing portfolio, communication mastery",
      "Social Studies": "Civic leadership capstone, community impact report",
      "PE/Health": "Lifetime wellness plan, health literacy certification",
      Electives: "Career launch preparation, entrepreneurship pitch events",
    },
    aiToolAccess: ["Full suite + legacy tool creation", "Mentor dashboard access", "AI portfolio analyzer"],
    aiGating: "Full autonomy. Students can create AI tools for younger students. Capstone requires AI ethics reflection.",
    developmental: [
      "Transition anxiety - needs concrete next-step planning",
      "Legacy motivation - contributing to community is meaningful",
      "Full abstract reasoning - complex project management",
      "Independence readiness - minimal institutional scaffolding",
    ],
    rationale: "12th grade focuses on transition and legacy. Students demonstrate mastery through teaching others. Portfolio completion and alumni network access prepare for post-graduation success.",
    wauTarget: "80% weekly active users",
    aiModules: "Full curriculum + capstone project",
    financialLiteracy: "Full 15 + financial independence plan",
  },
];

interface ChecklistItem {
  id: string;
  label: string;
  status: "not_started" | "in_progress" | "complete";
  owner: string;
  targetDate: string;
  notes: string;
}

interface ChecklistPhase {
  title: string;
  timeline: string;
  items: ChecklistItem[];
}

const INITIAL_CHECKLIST: ChecklistPhase[] = [
  {
    title: "Phase 1: Pilot Planning",
    timeline: "Weeks 1-4",
    items: [
      { id: "p1-1", label: "4-week pilot with one classroom (not all 60 students)", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p1-2", label: "Baseline data collection (current tech proficiency, reading levels, engagement patterns)", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p1-3", label: "Teacher co-design sessions (align tools with actual instruction planning)", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p1-4", label: "Parent information sessions and Sparky onboarding path", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p1-5", label: "Accessibility audit with actual students (dyslexia mode, screen readers)", status: "not_started", owner: "", targetDate: "", notes: "" },
    ],
  },
  {
    title: "Phase 2: Data & Compliance",
    timeline: "Weeks 2-6",
    items: [
      { id: "p2-1", label: "AI cost projection model (per-student API costs from pilot data)", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p2-2", label: "FERPA/COPPA compliance review for AI conversation logs", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p2-3", label: "Data retention and deletion policy documentation", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p2-4", label: "Student data privacy training for all staff", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p2-5", label: "Parental consent workflows for AI interactions (COPPA for under-13)", status: "not_started", owner: "", targetDate: "", notes: "" },
    ],
  },
  {
    title: "Phase 3: Scaling Preparation",
    timeline: "Weeks 4-8",
    items: [
      { id: "p3-1", label: "Analyze pilot usage patterns and adjust feature phasing", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p3-2", label: "Teacher professional development (PD) sessions", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p3-3", label: "Technical infrastructure stress testing", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p3-4", label: "Intervention playbook calibration from IGN-Thrive data", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p3-5", label: "Cross-platform integration testing (ISSS Student Support Portal)", status: "not_started", owner: "", targetDate: "", notes: "" },
    ],
  },
  {
    title: "Phase 4: Full Rollout",
    timeline: "Week 8+",
    items: [
      { id: "p4-1", label: "Phased feature release schedule", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p4-2", label: "Ongoing monitoring dashboards", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p4-3", label: "Monthly review cycles with administration", status: "not_started", owner: "", targetDate: "", notes: "" },
      { id: "p4-4", label: "Student/teacher/parent feedback loops", status: "not_started", owner: "", targetDate: "", notes: "" },
    ],
  },
];

const AI_STRENGTHS = [
  { title: "Socratic Questioning", evidence: "Hattie effect size 0.48 - proven pedagogical approach for deeper learning", icon: Brain },
  { title: "Grade-Band Specificity", evidence: "Differentiated prompts and scaffolding per developmental stage (6-8, 9-10, 11-12)", icon: GraduationCap },
  { title: "Emotional Intelligence Layer", evidence: "Growth mindset reinforcement embedded in all AI responses, aligned with Dweck research", icon: Lightbulb },
  { title: "Safety Guardrails", evidence: "Spark (student) vs Sparky (adult) separation ensures age-appropriate interactions", icon: Shield },
  { title: "Bilingual Support", evidence: "English/Spanish support for diverse learner populations, reducing language barriers", icon: Users },
  { title: "Zero-Cost AI Infrastructure", evidence: "Default free AI via Google Gemini Flash. School districts can also bring their own enterprise AI provider (OpenAI, Anthropic, etc.) with zero code changes.", icon: Unlock },
];

const AI_GAPS = [
  { gap: "No formative assessment loop", action: "Connect Spark conversation patterns to Thrive scoring for real-time learning insights" },
  { gap: "No teacher visibility into AI interactions", action: "Build AI interaction summary dashboard showing conversation themes and learning patterns" },
  { gap: "Module-gating assumes linear learning", action: "Allow 2-3 unlocked \"starter\" tools so students can explore before committing to a path" },
  { gap: "Prompt engineering fragility", action: "Implement output quality monitoring system with automated flagging of off-topic/low-quality responses" },
  { gap: "No collaborative AI use", action: "Design pair/group AI tool sessions where students collaborate on AI-assisted projects" },
];

const SUSTAINABILITY_RISKS = [
  { risk: "API cost modeling at scale (MITIGATED)", detail: "Default configuration uses Google Gemini Flash with a free API key — no per-call charges. District scaling from 60 to 6,000+ students does not increase AI costs on the free tier. Schools can optionally switch to a paid provider if needed.", severity: "low" as const },
  { risk: "Model vendor dependency (MITIGATED)", detail: "Provider abstraction layer automatically detects which AI provider is configured and routes all features through it. Switch between Gemini, OpenAI, or other providers by changing one environment variable — no code changes required.", severity: "low" as const },
  { risk: "Data privacy at scale", detail: "FERPA and COPPA compliance becomes exponentially complex with more students and AI interactions. Requires clear data retention policies and parental consent workflows.", severity: "high" as const },
  { risk: "Teacher training burden", detail: "Each new feature requires PD hours. Teacher burnout risk increases without adequate support. Phased rollout mitigates this by spreading training across weeks.", severity: "medium" as const },
  { risk: "Content freshness cycle", detail: "AI curriculum, career data, and financial literacy content require regular updates to stay relevant. Recommend quarterly content review cycles.", severity: "medium" as const },
];

const TIMELINE_PHASES = [
  { title: "Pre-Pilot Preparation", weeks: "Weeks 1-2", items: ["Stakeholder alignment meetings", "Technical environment setup", "Baseline data collection tools", "Parent/community notification"], color: "bg-blue-500" },
  { title: "4-Week Pilot Phase", weeks: "Weeks 3-6", items: ["Single classroom deployment (15-20 students)", "Daily usage monitoring", "Weekly teacher check-ins", "Student feedback collection", "AI interaction quality review"], color: "bg-emerald-500" },
  { title: "Analysis & Adjustment", weeks: "Weeks 7-8", items: ["Pilot data analysis and reporting", "Feature phasing adjustments", "Cost model validation", "Accessibility improvements", "Compliance documentation finalization"], color: "bg-amber-500" },
  { title: "Phased Full Rollout", weeks: "Weeks 9-12", items: ["Expand to full 6th grade (60 students)", "Teacher PD for expanded deployment", "Monitoring dashboard activation", "Parent engagement campaign", "House system and competition launch"], color: "bg-violet-500" },
  { title: "Ongoing Monitoring", weeks: "Week 13+", items: ["Monthly administration review cycles", "Quarterly feature assessment", "Annual curriculum alignment review", "Student outcome tracking", "Continuous improvement cycles"], color: "bg-rose-500" },
];

const SUBJECTS = ["Math", "Science", "ELA", "Social Studies", "PE/Health", "Electives"] as const;

function StatusBadge({ status }: { status: string }) {
  const config = {
    not_started: { label: "Not Started", variant: "secondary" as const },
    in_progress: { label: "In Progress", variant: "default" as const },
    complete: { label: "Complete", variant: "outline" as const },
  };
  const c = config[status as keyof typeof config] || config.not_started;
  return <Badge variant={c.variant} data-testid={`badge-status-${status}`}>{c.label}</Badge>;
}

function RiskBadge({ severity }: { severity: string }) {
  if (severity === "high") return <Badge variant="destructive" data-testid={`badge-risk-severity-high`}>High Risk</Badge>;
  if (severity === "low") return <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400" data-testid={`badge-risk-severity-low`}>Mitigated</Badge>;
  return <Badge variant="secondary" data-testid={`badge-risk-severity-medium`}>Medium Risk</Badge>;
}

function GradeCard({ data, expanded, onToggle }: { data: GradeData; expanded: boolean; onToggle: () => void }) {

  useEffect(() => { document.title = "Implementation Guide | AI Mastery Academy"; }, []);
  return (
    <Card data-testid={`card-grade-${data.grade}`}>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="rounded-md p-2 bg-gradient-to-br from-rose-900 to-red-950">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid={`text-grade-title-${data.grade}`}>{data.label}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">WAU Target: {data.wauTarget}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{data.aiModules}</Badge>
            <Badge variant="secondary">{data.financialLiteracy}</Badge>
            <Button size="icon" variant="ghost" data-testid={`button-toggle-grade-${data.grade}`} aria-label={expanded ? "Collapse grade details" : "Expand grade details"}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Feature Phasing
            </h4>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-phasing-${data.grade}`}>{data.phasing}</p>
            <div className="flex flex-wrap gap-1.5">
              {data.features.map((f, i) => (
                <Badge key={i} variant="secondary" data-testid={`badge-feature-${data.grade}-${i}`}>{f}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Subject Integration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUBJECTS.map((subject) => (
                <div key={subject} className="p-3 rounded-md bg-muted/50" data-testid={`card-subject-${data.grade}-${subject.toLowerCase().replace(/\//g, "-")}`}>
                  <p className="text-sm font-medium mb-1">{subject}</p>
                  <p className="text-xs text-muted-foreground">{data.subjectIntegration[subject]}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" /> AI Tool Access
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {data.aiToolAccess.map((tool, i) => (
                <Badge key={i} variant="outline" data-testid={`badge-ai-tool-${data.grade}-${i}`}>
                  {data.grade <= 7 ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                  {tool}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground" data-testid={`text-ai-gating-${data.grade}`}>{data.aiGating}</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" /> Developmental Considerations
            </h4>
            <ul className="space-y-1.5">
              {data.developmental.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`text-dev-${data.grade}-${i}`}>
                  <CircleDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-md bg-muted/30">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Adjustment Rationale
            </h4>
            <p className="text-sm text-muted-foreground" data-testid={`text-rationale-${data.grade}`}>{data.rationale}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function GradeByGradePlan() {
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set([6]));

  function toggleGrade(grade: number) {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  }

  function expandAll() {
    setExpandedGrades(new Set(GRADE_DATA.map((g) => g.grade)));
  }

  function collapseAll() {
    setExpandedGrades(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Comprehensive feature and integration recommendations for each grade level, from maximum scaffolding (6th) to full autonomy (12th).
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">Expand All</Button>
          <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">Collapse All</Button>
        </div>
      </div>
      {GRADE_DATA.map((data) => (
        <GradeCard
          key={data.grade}
          data={data}
          expanded={expandedGrades.has(data.grade)}
          onToggle={() => toggleGrade(data.grade)}
        />
      ))}
    </div>
  );
}

function PreRolloutChecklist() {
  const [phases, setPhases] = useState<ChecklistPhase[]>(INITIAL_CHECKLIST);

  function updateItem(phaseIdx: number, itemIdx: number, updates: Partial<ChecklistItem>) {
    setPhases((prev) => {
      const next = prev.map((phase, pi) => {
        if (pi !== phaseIdx) return phase;
        return {
          ...phase,
          items: phase.items.map((item, ii) => {
            if (ii !== itemIdx) return item;
            return { ...item, ...updates };
          }),
        };
      });
      return next;
    });
  }

  function cycleStatus(current: ChecklistItem["status"]): ChecklistItem["status"] {
    if (current === "not_started") return "in_progress";
    if (current === "in_progress") return "complete";
    return "not_started";
  }

  const totalItems = phases.reduce((sum, p) => sum + p.items.length, 0);
  const completedItems = phases.reduce((sum, p) => sum + p.items.filter((i) => i.status === "complete").length, 0);
  const inProgressItems = phases.reduce((sum, p) => sum + p.items.filter((i) => i.status === "in_progress").length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="secondary" data-testid="badge-checklist-total">{completedItems}/{totalItems} Complete</Badge>
        <Badge variant="default" data-testid="badge-checklist-progress">{inProgressItems} In Progress</Badge>
        <div className="flex-1 min-w-[200px]">
          <div className="h-2 rounded-full bg-muted overflow-visible">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
              data-testid="progress-checklist"
            />
          </div>
        </div>
      </div>

      {phases.map((phase, phaseIdx) => (
        <Card key={phase.title} data-testid={`card-phase-${phaseIdx + 1}`}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg" data-testid={`text-phase-title-${phaseIdx + 1}`}>{phase.title}</CardTitle>
              <Badge variant="outline">{phase.timeline}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {phase.items.map((item, itemIdx) => (
              <div key={item.id} className="space-y-2 p-3 rounded-md bg-muted/30" data-testid={`checklist-item-${item.id}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.status === "complete"}
                    onCheckedChange={() => updateItem(phaseIdx, itemIdx, { status: cycleStatus(item.status) })}
                    data-testid={`checkbox-${item.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.status === "complete" ? "line-through text-muted-foreground" : ""}`} data-testid={`text-checklist-${item.id}`}>
                      {item.label}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Select
                        value={item.status}
                        onValueChange={(val) => updateItem(phaseIdx, itemIdx, { status: val as ChecklistItem["status"] })}
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`select-status-${item.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Owner"
                        value={item.owner}
                        onChange={(e) => updateItem(phaseIdx, itemIdx, { owner: e.target.value })}
                        className="w-[150px]"
                        data-testid={`input-owner-${item.id}`}
                      />
                      <Input
                        type="date"
                        value={item.targetDate}
                        onChange={(e) => updateItem(phaseIdx, itemIdx, { targetDate: e.target.value })}
                        className="w-[160px]"
                        data-testid={`input-date-${item.id}`}
                      />
                    </div>
                    <Textarea
                      placeholder="Notes..."
                      value={item.notes}
                      onChange={(e) => updateItem(phaseIdx, itemIdx, { notes: e.target.value })}
                      className="mt-2 text-sm"
                      rows={2}
                      data-testid={`textarea-notes-${item.id}`}
                    />
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AIFrameworkEvaluation() {
  const [studentCount, setStudentCount] = useState(60);
  const [interactionsPerDay, setInteractionsPerDay] = useState(5);
  const [useFreeTier, setUseFreeTier] = useState(true);
  const AVG_COST_PER_INTERACTION_PAID = 0.015;
  const AVG_COST_PER_INTERACTION = useFreeTier ? 0 : AVG_COST_PER_INTERACTION_PAID;
  const SCHOOL_DAYS_PER_MONTH = 20;
  const monthlyCost = studentCount * interactionsPerDay * AVG_COST_PER_INTERACTION * SCHOOL_DAYS_PER_MONTH;
  const { data: providerInfo } = useQuery<{name: string, model: string, isFree: boolean}>({ queryKey: ["/api/ai-provider"] });

  return (
    <div className="space-y-8">
      <div data-testid="section-ai-strengths">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Framework Strengths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_STRENGTHS.map((s, i) => (
            <Card key={i} className="p-5" data-testid={`card-strength-${i}`}>
              <div className="flex items-start gap-3">
                <div className="rounded-md p-2 bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                  <s.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm" data-testid={`text-strength-title-${i}`}>{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`text-strength-evidence-${i}`}>{s.evidence}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div data-testid="section-ai-gaps">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Identified Gaps & Recommendations
        </h3>
        <div className="space-y-3">
          {AI_GAPS.map((g, i) => (
            <Card key={i} className="p-5" data-testid={`card-gap-${i}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm" data-testid={`text-gap-title-${i}`}>{g.gap}</p>
                  <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-muted/50">
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground" data-testid={`text-gap-action-${i}`}>{g.action}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div data-testid="section-sustainability-risks">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" /> Sustainability Risks
        </h3>
        <div className="space-y-3">
          {SUSTAINABILITY_RISKS.map((r, i) => (
            <Card key={i} className="p-5" data-testid={`card-risk-${i}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <RiskBadge severity={r.severity} />
                  <p className="font-semibold text-sm" data-testid={`text-risk-title-${i}`}>{r.risk}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2" data-testid={`text-risk-detail-${i}`}>{r.detail}</p>
            </Card>
          ))}
        </div>
      </div>

      <div data-testid="section-open-source-strategy">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Unlock className="h-5 w-5 text-emerald-500" /> Free & Open-Source AI Strategy
        </h3>
        <Card className="p-6 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-md p-2 bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold" data-testid="text-free-ai-title">Configurable AI Provider Architecture</p>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-free-ai-detail">
                This platform uses a provider abstraction layer that automatically detects which AI provider is configured and routes all AI features through it. By default, it uses Google Gemini Flash (gemini-2.0-flash) via a free API key from Google AI Studio — no per-call charges. School districts can plug in their own AI provider (OpenAI, Anthropic, etc.) just by setting an API key — no code changes needed. Set GEMINI_API_KEY for free Gemini, OPENAI_API_KEY for OpenAI, or other providers as they are added.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-muted/50" data-testid="card-ai-model-current">
              <p className="text-sm font-semibold mb-1">Default (Free)</p>
              <Badge variant="outline" className="mb-2 border-emerald-500 text-emerald-600 dark:text-emerald-400">gemini-2.0-flash</Badge>
              <p className="text-xs text-muted-foreground">Google Gemini Flash. Free via Google AI Studio API key. Ideal for student interactions, Spark/Sparky, and AI Creation Studio.</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50" data-testid="card-ai-model-upgrade">
              <p className="text-sm font-semibold mb-1">School-Managed</p>
              <Badge variant="outline" className="mb-2">gpt-4o-mini or higher</Badge>
              <p className="text-xs text-muted-foreground">OpenAI models. School pays OpenAI directly. Set OPENAI_API_KEY to activate. No code changes required.</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50" data-testid="card-ai-model-premium">
              <p className="text-sm font-semibold mb-1">Extensible</p>
              <Badge variant="outline" className="mb-2">Any Provider</Badge>
              <p className="text-xs text-muted-foreground">Architecture supports adding Anthropic Claude, Mistral, or other providers. Contact your admin to configure.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h4 className="font-semibold text-sm mb-3">Why This Eliminates Cost as a Barrier</h4>
          <div className="space-y-2">
            {[
              "Default provider (Gemini Flash) requires only a free Google AI Studio API key — no credit card needed",
              "No per-student or per-interaction billing on the free tier",
              "Provider abstraction layer — switch between Gemini, OpenAI, or other providers by changing one environment variable",
              "School districts can bring their own enterprise AI contract and plug it in directly",
              "Built-in safety filters on Gemini protect student interactions by default",
              "Streaming responses minimize perceived latency for interactive AI features",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-free-benefit-${i}`}>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div data-testid="section-cost-calculator">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> Cost Comparison Calculator
          </h3>
          {providerInfo && (
            <Badge
              variant={providerInfo.isFree ? "outline" : "secondary"}
              className={providerInfo.isFree ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : ""}
              data-testid="badge-active-provider"
            >
              {providerInfo.name}: {providerInfo.model}
            </Badge>
          )}
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={useFreeTier}
                onCheckedChange={(checked) => setUseFreeTier(!!checked)}
                data-testid="checkbox-free-tier"
              />
              <label className="text-sm font-medium cursor-pointer" onClick={() => setUseFreeTier(!useFreeTier)}>
                Use Google Gemini Flash (Free)
              </label>
            </div>
            {useFreeTier && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                $0 / month
              </Badge>
            )}
            {!useFreeTier && (
              <Badge variant="secondary">
                Paid API pricing shown below
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Number of Students</label>
              <Input
                type="number"
                min={1}
                max={100000}
                value={studentCount}
                onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                data-testid="input-student-count"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">AI Interactions / Student / Day</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={interactionsPerDay}
                onChange={(e) => setInteractionsPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                data-testid="input-interactions-per-day"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cost per Interaction</label>
              <Input value={useFreeTier ? "$0.000 (Free)" : `$${AVG_COST_PER_INTERACTION.toFixed(3)}`} disabled data-testid="input-cost-per-interaction" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-md text-center ${useFreeTier ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/50"}`}>
              <p className="text-sm text-muted-foreground">Daily Cost</p>
              <p className="text-2xl font-bold" data-testid="text-daily-cost">
                {useFreeTier ? "$0.00" : `$${(studentCount * interactionsPerDay * AVG_COST_PER_INTERACTION).toFixed(2)}`}
              </p>
            </div>
            <div className={`p-4 rounded-md text-center ${useFreeTier ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/50"}`}>
              <p className="text-sm text-muted-foreground">Monthly Cost (20 school days)</p>
              <p className="text-2xl font-bold" data-testid="text-monthly-cost">
                {useFreeTier ? "$0.00" : `$${monthlyCost.toFixed(2)}`}
              </p>
            </div>
            <div className={`p-4 rounded-md text-center ${useFreeTier ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/50"}`}>
              <p className="text-sm text-muted-foreground">Annual Cost (180 school days)</p>
              <p className="text-2xl font-bold" data-testid="text-annual-cost">
                {useFreeTier ? "$0.00" : `$${(studentCount * interactionsPerDay * AVG_COST_PER_INTERACTION * 180).toFixed(2)}`}
              </p>
            </div>
          </div>
          {useFreeTier && (
            <div className="mt-4 p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300" data-testid="text-free-tier-note">
                Using Google Gemini Flash with a free API key from Google AI Studio. No per-call charges regardless of student count or usage volume. The school can switch to a paid provider at any time by setting a different API key.
              </p>
            </div>
          )}
          {!useFreeTier && (
            <p className="text-xs text-muted-foreground mt-4">
              Comparison estimates based on typical paid API pricing. Toggle "Free" above to see the zero-cost Google Gemini configuration.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function RolloutTimeline() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Phased rollout timeline from pre-pilot through ongoing monitoring. Each phase builds on validated outcomes from the previous phase.
      </p>
      <div className="relative ml-6">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
        {TIMELINE_PHASES.map((phase, i) => (
          <div key={i} className="relative pl-8 pb-10 last:pb-0" data-testid={`timeline-phase-${i}`}>
            <div className={`absolute left-0 top-1 -translate-x-1/2 w-4 h-4 rounded-full ${phase.color} ring-4 ring-background`} />
            <Card className="p-5">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Milestone className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold" data-testid={`text-timeline-title-${i}`}>{phase.title}</h4>
                </div>
                <Badge variant="outline" data-testid={`badge-timeline-weeks-${i}`}>{phase.weeks}</Badge>
              </div>
              <ul className="space-y-1.5">
                {phase.items.map((item, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`text-timeline-item-${i}-${j}`}>
                    <CircleDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ImplementationRecommendationsPage() {
  const [activeTab, setActiveTab] = useState("grade-plan");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-8 mb-8"
        data-testid="section-impl-hero"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white" data-testid="text-impl-heading">
            Implementation Recommendations
          </h1>
        </div>
        <p className="text-rose-100 text-lg" data-testid="text-impl-subtitle">
          District Administrator Planning Guide
        </p>
        <p className="text-rose-200 text-sm mt-2 max-w-2xl" data-testid="text-impl-description">
          Grade-by-grade deployment strategy, pre-rollout checklists, AI framework evaluation, and phased rollout timeline for the AI Mastery Academy platform.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-impl">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-impl-list">
          <TabsTrigger value="grade-plan" data-testid="tab-grade-plan">
            <GraduationCap className="h-4 w-4 mr-1.5" /> Grade-by-Grade Plan
          </TabsTrigger>
          <TabsTrigger value="checklist" data-testid="tab-checklist">
            <ClipboardCheck className="h-4 w-4 mr-1.5" /> Pre-Rollout Checklist
          </TabsTrigger>
          <TabsTrigger value="ai-framework" data-testid="tab-ai-framework">
            <Brain className="h-4 w-4 mr-1.5" /> AI Framework Evaluation
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            <Clock className="h-4 w-4 mr-1.5" /> Rollout Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grade-plan" data-testid="content-grade-plan">
          <GradeByGradePlan />
        </TabsContent>

        <TabsContent value="checklist" data-testid="content-checklist">
          <PreRolloutChecklist />
        </TabsContent>

        <TabsContent value="ai-framework" data-testid="content-ai-framework">
          <AIFrameworkEvaluation />
        </TabsContent>

        <TabsContent value="timeline" data-testid="content-timeline">
          <RolloutTimeline />
        </TabsContent>
      </Tabs>
      <BackToTop />
    </div>
  );
}