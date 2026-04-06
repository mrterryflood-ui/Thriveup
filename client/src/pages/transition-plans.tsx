import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Briefcase,
  Home,
  CheckCircle2,
  Circle,
  Plus,
  FileText,
  Target,
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Bus,
  Baby,
  Shield,
  ClipboardCheck,
  ArrowRight,
  Star,
  Clock,
  Brain,
  Sparkles,
  Loader2,
  ChevronRight,
  Compass,
  Activity,
  BarChart3,
  Zap,
  DollarSign,
  Lightbulb,
  Search,
} from "lucide-react";
import { Link } from "wouter";

interface TransitionPlan {
  id: string;
  studentName: string;
  studentId: string;
  educationGoalType: string;
  educationGoalDetails: string;
  careerGoal: string;
  careerField: string;
  independentLivingSkills: Record<string, boolean>;
  readinessScores: ReadinessScores;
  supportServices: string[];
  status: string;
  createdDate: string;
  lastUpdated: string;
  isExample?: boolean;
}

interface CollegeApplication {
  id: string;
  planId: string;
  collegeName: string;
  collegeType: string;
  applicationStatus: string;
  financialAidStatus: string;
  submittedDate: string;
  decisionDate: string;
}

interface Credential {
  id: string;
  planId: string;
  credentialName: string;
  credentialType: string;
  issuingOrg: string;
  status: string;
  earnedDate: string;
  expirationDate: string;
  isStackable: boolean;
}

interface ReadinessScores {
  academic: number;
  career: number;
  personalSocial: number;
}

interface FollowUp {
  id: string;
  planId: string;
  checkMonth: number;
  employmentStatus: string;
  educationStatus: string;
  credentialProgress: string;
  wageInfo: string;
  notes: string;
  completedDate: string;
}

interface AIAdvisorResponse {
  answer: string;
  engines: Array<{
    engine: string;
    model: string;
    responseTimeMs: number;
    hasResponse: boolean;
    error?: string;
  }>;
  ragContext?: { sources: string[] };
  frameworks?: string[];
  consensusMethod?: string;
  totalTimeMs?: number;
}

const EDUCATION_GOAL_TYPES = [
  { value: "4-year", label: "4-Year College/University" },
  { value: "2-year", label: "2-Year Community College" },
  { value: "certificate", label: "Certificate Program" },
  { value: "credential", label: "Industry Credential" },
  { value: "apprenticeship", label: "Registered Apprenticeship" },
  { value: "military", label: "Military Service" },
];

const COLLEGE_TYPES = [
  { value: "4-year-public", label: "4-Year Public University" },
  { value: "4-year-private", label: "4-Year Private University" },
  { value: "2-year-community", label: "Community College" },
  { value: "technical", label: "Technical/Vocational School" },
  { value: "hbcu", label: "HBCU" },
  { value: "hsi", label: "Hispanic-Serving Institution" },
];

const APPLICATION_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "submitted", label: "Submitted" },
  { value: "accepted", label: "Accepted" },
  { value: "enrolled", label: "Enrolled" },
  { value: "deferred", label: "Deferred" },
  { value: "denied", label: "Denied" },
];

const FINANCIAL_AID_STATUSES = [
  { value: "not-started", label: "Not Started" },
  { value: "fafsa-submitted", label: "FAFSA Submitted" },
  { value: "award-received", label: "Award Letter Received" },
  { value: "accepted", label: "Aid Accepted" },
  { value: "pending", label: "Pending Review" },
];

const CREDENTIAL_TYPES = [
  { value: "industry-cert", label: "Industry Certification" },
  { value: "license", label: "Professional License" },
  { value: "stackable", label: "Stackable Credential" },
  { value: "digital-badge", label: "Digital Badge" },
  { value: "micro-credential", label: "Micro-Credential" },
];

const INDEPENDENT_LIVING_SKILLS = [
  { key: "budgeting", label: "Budgeting & Financial Management", icon: TrendingUp },
  { key: "housing", label: "Housing Search & Lease Understanding", icon: Home },
  { key: "transportation", label: "Transportation Planning", icon: Bus },
  { key: "healthInsurance", label: "Health Insurance Navigation", icon: Heart },
  { key: "cooking", label: "Meal Planning & Cooking", icon: Home },
  { key: "timeManagement", label: "Time Management & Scheduling", icon: Clock },
  { key: "selfAdvocacy", label: "Self-Advocacy Skills", icon: Users },
  { key: "conflictResolution", label: "Conflict Resolution", icon: Shield },
];

const SUPPORT_SERVICES = [
  { key: "tutoring", label: "Academic Tutoring", icon: BookOpen },
  { key: "mentoring", label: "Mentoring", icon: Users },
  { key: "transportation", label: "Transportation Assistance", icon: Bus },
  { key: "housing", label: "Housing Support", icon: Home },
  { key: "childcare", label: "Childcare Services", icon: Baby },
  { key: "counseling", label: "Counseling Services", icon: Heart },
  { key: "legalAid", label: "Legal Aid", icon: Shield },
  { key: "careerCoaching", label: "Career Coaching", icon: Briefcase },
];

const FOLLOW_UP_MONTHS = [1, 2, 3, 6, 9, 12];

const LIFECYCLE_STEPS = [
  {
    label: "Assessment",
    icon: ClipboardCheck,
    tools: ["Self-Assessment", "Readiness Gauges"],
    outcomes: ["Baseline scores", "Barrier identification"],
  },
  {
    label: "Goal Setting",
    icon: Target,
    tools: ["ITP Builder", "Career Explorer"],
    outcomes: ["Education goals", "Career goals"],
  },
  {
    label: "Plan Development",
    icon: FileText,
    tools: ["Transition Plan Builder", "Support Services"],
    outcomes: ["Individualized plan", "Service coordination"],
  },
  {
    label: "Implementation",
    icon: Zap,
    tools: ["My Journey", "FAFSA Navigator"],
    outcomes: ["Enrollment", "Credential pursuit"],
  },
  {
    label: "Monitoring",
    icon: Activity,
    tools: ["Readiness Dashboard", "AI Advisor"],
    outcomes: ["Progress tracking", "Intervention triggers"],
  },
  {
    label: "Post-Exit Follow-Up",
    icon: BarChart3,
    tools: ["12-Month Tracker", "Outcome Reports"],
    outcomes: ["Employment data", "WIOA compliance"],
  },
];

const CROSS_PAGE_LINKS = [
  { label: "FAFSA Navigator", href: "/fafsa-navigator", icon: DollarSign, description: "Financial aid guidance" },
  { label: "Apprenticeship Pathways", href: "/apprenticeship-tracker", icon: Briefcase, description: "Career apprenticeships" },
  { label: "Workforce Dashboard", href: "/workforce-dashboard", icon: BarChart3, description: "Employment pipeline" },
  { label: "Career Exploration", href: "/academy/careers", icon: Compass, description: "Explore career paths" },
  { label: "Opportunity Youth", href: "/opportunity-youth", icon: Users, description: "Re-engagement programs" },
  { label: "My Journey", href: "/my-journey", icon: MapPin, description: "30-day onboarding" },
  { label: "Benefits Screener", href: "/benefits-screener", icon: Shield, description: "Eligibility screening" },
];

const SAMPLE_PLANS: TransitionPlan[] = [
  {
    id: "tp-1",
    studentName: "Marcus Johnson",
    studentId: "STU-2024-001",
    educationGoalType: "2-year",
    educationGoalDetails: "Austin Community College - Business Administration",
    careerGoal: "Small Business Owner",
    careerField: "Business & Entrepreneurship",
    independentLivingSkills: {
      budgeting: true, housing: true, transportation: true,
      healthInsurance: false, cooking: true, timeManagement: true,
      selfAdvocacy: true, conflictResolution: false,
    },
    readinessScores: { academic: 72, career: 65, personalSocial: 80 },
    supportServices: ["mentoring", "transportation", "careerCoaching"],
    status: "active",
    createdDate: "2025-09-01",
    lastUpdated: "2026-04-15",
    isExample: true,
  },
  {
    id: "tp-2",
    studentName: "Aisha Williams",
    studentId: "STU-2024-002",
    educationGoalType: "4-year",
    educationGoalDetails: "Texas State University - Computer Science",
    careerGoal: "Software Developer",
    careerField: "Technology",
    independentLivingSkills: {
      budgeting: true, housing: false, transportation: true,
      healthInsurance: true, cooking: true, timeManagement: true,
      selfAdvocacy: true, conflictResolution: true,
    },
    readinessScores: { academic: 85, career: 78, personalSocial: 90 },
    supportServices: ["tutoring", "mentoring"],
    status: "active",
    createdDate: "2025-08-15",
    lastUpdated: "2026-04-10",
    isExample: true,
  },
  {
    id: "tp-3",
    studentName: "David Hernandez",
    studentId: "STU-2024-003",
    educationGoalType: "credential",
    educationGoalDetails: "CompTIA A+ and Network+ Certifications",
    careerGoal: "IT Support Technician",
    careerField: "Information Technology",
    independentLivingSkills: {
      budgeting: false, housing: false, transportation: false,
      healthInsurance: false, cooking: true, timeManagement: false,
      selfAdvocacy: false, conflictResolution: true,
    },
    readinessScores: { academic: 58, career: 45, personalSocial: 55 },
    supportServices: ["tutoring", "mentoring", "transportation", "housing", "counseling"],
    status: "active",
    createdDate: "2025-10-01",
    lastUpdated: "2026-04-12",
    isExample: true,
  },
];

const SAMPLE_APPLICATIONS: CollegeApplication[] = [
  {
    id: "ca-1", planId: "tp-1", collegeName: "Austin Community College",
    collegeType: "2-year-community", applicationStatus: "enrolled",
    financialAidStatus: "accepted", submittedDate: "2025-11-15", decisionDate: "2025-12-01",
  },
  {
    id: "ca-2", planId: "tp-2", collegeName: "Texas State University",
    collegeType: "4-year-public", applicationStatus: "accepted",
    financialAidStatus: "award-received", submittedDate: "2025-10-01", decisionDate: "2026-01-15",
  },
  {
    id: "ca-3", planId: "tp-2", collegeName: "University of Texas at Austin",
    collegeType: "4-year-public", applicationStatus: "submitted",
    financialAidStatus: "fafsa-submitted", submittedDate: "2025-11-01", decisionDate: "",
  },
  {
    id: "ca-4", planId: "tp-2", collegeName: "Huston-Tillotson University",
    collegeType: "hbcu", applicationStatus: "accepted",
    financialAidStatus: "accepted", submittedDate: "2025-09-15", decisionDate: "2025-11-30",
  },
];

const SAMPLE_CREDENTIALS: Credential[] = [
  {
    id: "cr-1", planId: "tp-1", credentialName: "QuickBooks Certified User",
    credentialType: "industry-cert", issuingOrg: "Intuit",
    status: "earned", earnedDate: "2026-02-15", expirationDate: "2029-02-15", isStackable: true,
  },
  {
    id: "cr-2", planId: "tp-3", credentialName: "CompTIA A+",
    credentialType: "industry-cert", issuingOrg: "CompTIA",
    status: "in-progress", earnedDate: "", expirationDate: "", isStackable: true,
  },
  {
    id: "cr-3", planId: "tp-3", credentialName: "CompTIA Network+",
    credentialType: "industry-cert", issuingOrg: "CompTIA",
    status: "planned", earnedDate: "", expirationDate: "", isStackable: true,
  },
  {
    id: "cr-4", planId: "tp-2", credentialName: "AWS Cloud Practitioner",
    credentialType: "industry-cert", issuingOrg: "Amazon Web Services",
    status: "earned", earnedDate: "2026-03-01", expirationDate: "2029-03-01", isStackable: true,
  },
];

const SAMPLE_FOLLOWUPS: FollowUp[] = [
  {
    id: "fu-1", planId: "tp-1", checkMonth: 1, employmentStatus: "employed-part-time",
    educationStatus: "enrolled", credentialProgress: "On track",
    wageInfo: "$15.50/hr", notes: "Settled into ACC schedule, working part-time at H-E-B",
    completedDate: "2026-02-01",
  },
  {
    id: "fu-2", planId: "tp-1", checkMonth: 3, employmentStatus: "employed-part-time",
    educationStatus: "enrolled", credentialProgress: "Completed QuickBooks cert",
    wageInfo: "$16.00/hr", notes: "Strong academic performance, considering adding marketing minor",
    completedDate: "2026-04-01",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "enrolled":
    case "accepted":
    case "earned":
    case "completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "submitted":
    case "in-progress":
    case "fafsa-submitted":
    case "award-received":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "planning":
    case "planned":
    case "not-started":
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "denied":
    case "deferred":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "";
  }
}

function getReadinessLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Ready", color: "text-emerald-600" };
  if (score >= 60) return { label: "Developing", color: "text-blue-600" };
  if (score >= 40) return { label: "Emerging", color: "text-amber-600" };
  return { label: "Beginning", color: "text-red-600" };
}

function ExampleBadge() {
  return (
    <Badge
      variant="secondary"
      className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] shrink-0"
      data-testid="badge-example"
    >
      EXAMPLE
    </Badge>
  );
}

function ExampleNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 mt-3" data-testid="note-example">
      <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-300">{text}</p>
    </div>
  );
}

function TransitionLifecycle() {
  return (
    <Card className="p-5" data-testid="card-lifecycle">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4" /> Transition Planning Lifecycle
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {LIFECYCLE_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <div key={step.label} className="relative" data-testid={`lifecycle-step-${i}`}>
              <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-semibold mb-1">{step.label}</p>
                <div className="space-y-0.5">
                  {step.tools.map(t => (
                    <p key={t} className="text-[10px] text-muted-foreground">{t}</p>
                  ))}
                </div>
                <div className="mt-2 space-y-0.5">
                  {step.outcomes.map(o => (
                    <p key={o} className="text-[10px] text-emerald-600 dark:text-emerald-400">{o}</p>
                  ))}
                </div>
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute top-1/3 -right-2 z-10">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CrossPageNav() {
  return (
    <Card className="p-5" data-testid="card-cross-page-nav">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Compass className="h-4 w-4" /> Connected Tools & Resources
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {CROSS_PAGE_LINKS.map(link => {
          const NavIcon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover-elevate cursor-pointer"
                data-testid={`link-nav-${link.href.replace(/\//g, "-").slice(1)}`}
              >
                <NavIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{link.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function AITransitionAdvisor({ plans }: { plans: TransitionPlan[] }) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<AIAdvisorResponse | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const advisorMutation = useMutation({
    mutationFn: async (payload: { question: string; studentProfile?: Record<string, unknown> }) => {
      const res = await apiRequest("POST", "/api/transition/ai-advisor", payload);
      return res.json() as Promise<AIAdvisorResponse>;
    },
    onSuccess: (data) => {
      setAiResponse(data);
      setActiveAction(null);
    },
    onError: (err: Error) => {
      toast({ title: "AI Advisor Error", description: err.message, variant: "destructive" });
      setActiveAction(null);
    },
  });

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    setActiveAction("custom");
    advisorMutation.mutate({ question });
  };

  const handleGeneratePlan = () => {
    setActiveAction("generate");
    const samplePlan = plans[0];
    advisorMutation.mutate({
      question: "Generate a comprehensive personalized transition plan for this student. Include specific milestones, timelines, recommended services, and measurable goals aligned with WIOA requirements.",
      studentProfile: samplePlan ? {
        age: 18,
        gradeLevel: "12th",
        postSecondaryGoal: samplePlan.educationGoalDetails,
        employmentGoal: samplePlan.careerGoal,
        strengths: ["Self-advocacy", "Time management"],
        barriers: ["Transportation", "Financial literacy"],
      } : {
        age: 17,
        gradeLevel: "11th",
        postSecondaryGoal: "Community College",
        employmentGoal: "Entry-level career",
        strengths: ["Motivation", "Communication"],
        barriers: ["Academic gaps", "Limited work experience"],
      },
    });
  };

  const handlePredictReadiness = () => {
    setActiveAction("readiness");
    const avgScores = plans.length > 0 ? {
      academic: Math.round(plans.reduce((s, p) => s + p.readinessScores.academic, 0) / plans.length),
      career: Math.round(plans.reduce((s, p) => s + p.readinessScores.career, 0) / plans.length),
      personalSocial: Math.round(plans.reduce((s, p) => s + p.readinessScores.personalSocial, 0) / plans.length),
    } : { academic: 50, career: 50, personalSocial: 50 };

    advisorMutation.mutate({
      question: `Analyze these current readiness scores and predict timeline to full readiness (80%+ in all domains). Academic: ${avgScores.academic}%, Career: ${avgScores.career}%, Personal/Social: ${avgScores.personalSocial}%. Provide specific interventions for each domain and estimated months to reach readiness thresholds.`,
      studentProfile: {
        age: 18,
        gradeLevel: "12th",
        barriers: ["Transportation", "Limited work experience"],
        strengths: ["Self-advocacy", "Motivation"],
      },
    });
  };

  const handleRecommendServices = () => {
    setActiveAction("services");
    advisorMutation.mutate({
      question: "Based on this student's profile, recommend specific support services with justification. Include local Austin/Travis County resources, community organizations, and WIOA-funded programs. Prioritize services by urgency and impact.",
      studentProfile: {
        age: 18,
        gradeLevel: "12th",
        postSecondaryGoal: "Community College",
        employmentGoal: "IT Support",
        barriers: ["Transportation", "Housing instability", "Limited financial literacy"],
        strengths: ["Technical aptitude", "Self-motivation"],
        currentServices: ["Academic tutoring", "Mentoring"],
      },
    });
  };

  return (
    <Card className="p-5" data-testid="card-ai-advisor">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">AI Transition Advisor</h3>
        <Badge variant="secondary" className="text-[10px]">4-Engine Collaborative AI</Badge>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGeneratePlan}
          disabled={advisorMutation.isPending}
          data-testid="button-ai-generate-plan"
        >
          {activeAction === "generate" && advisorMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Generate My Transition Plan
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePredictReadiness}
          disabled={advisorMutation.isPending}
          data-testid="button-ai-predict-readiness"
        >
          {activeAction === "readiness" && advisorMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-1" />
          )}
          Predict My Readiness
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRecommendServices}
          disabled={advisorMutation.isPending}
          data-testid="button-ai-recommend-services"
        >
          {activeAction === "services" && advisorMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-1" />
          )}
          Recommend Support Services
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Textarea
          placeholder="Ask the AI Transition Advisor any question about postsecondary planning, readiness, services, or WIOA compliance..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="text-sm min-h-[60px]"
          data-testid="input-ai-question"
        />
        <Button
          onClick={handleAskQuestion}
          disabled={advisorMutation.isPending || !question.trim()}
          data-testid="button-ai-ask"
        >
          {activeAction === "custom" && advisorMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {advisorMutation.isPending && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-primary/5" data-testid="status-ai-loading">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">AI engines collaborating...</p>
            <p className="text-xs text-muted-foreground">Querying 4 AI engines with RAG, RPLICE, and MAP-GAP frameworks</p>
          </div>
        </div>
      )}

      {aiResponse && !advisorMutation.isPending && (
        <div className="space-y-4" data-testid="section-ai-response">
          <div className="p-4 rounded-md bg-muted/30">
            <p className="text-sm whitespace-pre-wrap" data-testid="text-ai-answer">{aiResponse.answer}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="section-engine-metadata">
            {aiResponse.engines.map((engine, i) => (
              <div key={i} className="p-2 rounded-md bg-muted/20 text-center" data-testid={`engine-${engine.engine}`}>
                <p className="text-[10px] font-semibold truncate">{engine.engine}</p>
                <p className="text-[10px] text-muted-foreground truncate">{engine.model}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {engine.hasResponse ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-[9px] text-muted-foreground">{engine.responseTimeMs}ms</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            {aiResponse.frameworks && aiResponse.frameworks.length > 0 && (
              <Badge variant="outline" className="text-[10px]" data-testid="badge-frameworks">
                Frameworks: {aiResponse.frameworks.join(", ")}
              </Badge>
            )}
            {aiResponse.ragContext?.sources && aiResponse.ragContext.sources.length > 0 && (
              <Badge variant="outline" className="text-[10px]" data-testid="badge-rag-sources">
                RAG Sources: {aiResponse.ragContext.sources.length}
              </Badge>
            )}
            {aiResponse.consensusMethod && (
              <Badge variant="outline" className="text-[10px]" data-testid="badge-consensus">
                {aiResponse.consensusMethod}
              </Badge>
            )}
            {aiResponse.totalTimeMs && (
              <span className="text-muted-foreground" data-testid="text-total-time">
                Total: {aiResponse.totalTimeMs}ms
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function HolisticDashboard({ plans }: { plans: TransitionPlan[] }) {
  const activePlans = plans.filter(p => p.status === "active").length;
  const avgAcademic = plans.length > 0 ? Math.round(plans.reduce((s, p) => s + p.readinessScores.academic, 0) / plans.length) : 0;
  const avgCareer = plans.length > 0 ? Math.round(plans.reduce((s, p) => s + p.readinessScores.career, 0) / plans.length) : 0;
  const avgPersonal = plans.length > 0 ? Math.round(plans.reduce((s, p) => s + p.readinessScores.personalSocial, 0) / plans.length) : 0;
  const avgOverall = plans.length > 0 ? Math.round((avgAcademic + avgCareer + avgPersonal) / 3) : 0;

  const totalApps = SAMPLE_APPLICATIONS.length;
  const acceptedApps = SAMPLE_APPLICATIONS.filter(a => a.applicationStatus === "accepted" || a.applicationStatus === "enrolled").length;
  const acceptanceRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0;

  const totalCreds = SAMPLE_CREDENTIALS.length;
  const earnedCreds = SAMPLE_CREDENTIALS.filter(c => c.status === "earned").length;
  const credRate = totalCreds > 0 ? Math.round((earnedCreds / totalCreds) * 100) : 0;

  const followUpCompliance = FOLLOW_UP_MONTHS.length > 0
    ? Math.round((SAMPLE_FOLLOWUPS.length / FOLLOW_UP_MONTHS.length) * 100)
    : 0;

  const employedFollowups = SAMPLE_FOLLOWUPS.filter(f => f.employmentStatus.includes("employed")).length;
  const employmentRate = SAMPLE_FOLLOWUPS.length > 0
    ? Math.round((employedFollowups / SAMPLE_FOLLOWUPS.length) * 100)
    : 0;

  const metrics = [
    { label: "Active Plans", value: activePlans, icon: FileText, color: "from-blue-500 to-blue-600", progress: null },
    { label: "Avg. Readiness", value: `${avgOverall}%`, icon: Star, color: "from-amber-500 to-amber-600", progress: avgOverall },
    { label: "College Acceptance", value: `${acceptanceRate}%`, icon: GraduationCap, color: "from-emerald-500 to-emerald-600", progress: acceptanceRate },
    { label: "Credential Attainment", value: `${credRate}%`, icon: Award, color: "from-purple-500 to-purple-600", progress: credRate },
    { label: "WIOA Follow-Up", value: `${followUpCompliance}%`, icon: Shield, color: "from-sky-500 to-sky-600", progress: followUpCompliance },
    { label: "Post-Exit Employment", value: `${employmentRate}%`, icon: Briefcase, color: "from-rose-500 to-rose-600", progress: employmentRate },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="section-holistic-dashboard">
      {metrics.map((m, i) => {
        const MIcon = m.icon;
        return (
          <Card key={m.label} className="p-4" data-testid={`metric-${m.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md bg-gradient-to-br ${m.color}`}>
                <MIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
            <p className="text-lg font-bold" data-testid={`text-metric-${i}`}>{m.value}</p>
            {m.progress !== null && (
              <Progress value={m.progress} className="h-1 mt-2" />
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ReadinessGauge({ label, score, icon: Icon }: { label: string; score: number; icon: typeof GraduationCap }) {
  const level = getReadinessLevel(score);
  return (
    <div className="space-y-2" data-testid={`gauge-readiness-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${level.color}`}>{score}%</span>
          <Badge variant="secondary" className={`text-[10px] ${getStatusColor(score >= 80 ? "earned" : score >= 60 ? "in-progress" : "planned")}`}>
            {level.label}
          </Badge>
        </div>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

function PlanBuilder({ onSave }: { onSave: (plan: Partial<TransitionPlan>) => void }) {
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [educationGoalType, setEducationGoalType] = useState("");
  const [educationGoalDetails, setEducationGoalDetails] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [careerField, setCareerField] = useState("");
  const [livingSkills, setLivingSkills] = useState<Record<string, boolean>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleSkill = (key: string) => {
    setLivingSkills(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleService = (key: string) => {
    setSelectedServices(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const handleSubmit = () => {
    onSave({
      studentName,
      educationGoalType,
      educationGoalDetails,
      careerGoal,
      careerField,
      independentLivingSkills: livingSkills,
      supportServices: selectedServices,
      readinessScores: { academic: 50, career: 50, personalSocial: 50 },
      status: "active",
      isExample: false,
    });
  };

  return (
    <Card className="p-6" data-testid="card-plan-builder">
      <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
        <Target className="h-5 w-5" /> Individual Transition Plan Builder
      </h2>
      <p className="text-sm text-muted-foreground mb-6">Step {step} of 4</p>

      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
            data-testid={`progress-itp-step-${s}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4" data-testid="section-itp-step-1">
          <p className="text-sm font-medium">Student Information & Education Goals</p>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Student Name</label>
            <Input
              placeholder="Full name"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              data-testid="input-student-name"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Education Goal Type</label>
            <Select value={educationGoalType} onValueChange={setEducationGoalType}>
              <SelectTrigger data-testid="select-education-goal">
                <SelectValue placeholder="Select education goal" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_GOAL_TYPES.map(g => (
                  <SelectItem key={g.value} value={g.value} data-testid={`option-goal-${g.value}`}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Education Goal Details</label>
            <Input
              placeholder="e.g., Austin Community College - Business Administration"
              value={educationGoalDetails}
              onChange={e => setEducationGoalDetails(e.target.value)}
              data-testid="input-education-details"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!studentName || !educationGoalType} data-testid="button-next-step-1">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4" data-testid="section-itp-step-2">
          <p className="text-sm font-medium">Career Goals</p>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Career Goal</label>
            <Input
              placeholder="What career do you want to pursue?"
              value={careerGoal}
              onChange={e => setCareerGoal(e.target.value)}
              data-testid="input-career-goal"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Career Field</label>
            <Select value={careerField} onValueChange={setCareerField}>
              <SelectTrigger data-testid="select-career-field">
                <SelectValue placeholder="Select career field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="business">Business & Entrepreneurship</SelectItem>
                <SelectItem value="trades">Skilled Trades</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="creative">Creative Arts & Media</SelectItem>
                <SelectItem value="public-service">Public Service</SelectItem>
                <SelectItem value="manufacturing">Advanced Manufacturing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step-2">Back</Button>
            <Button onClick={() => setStep(3)} disabled={!careerGoal} data-testid="button-next-step-2">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4" data-testid="section-itp-step-3">
          <p className="text-sm font-medium">Independent Living Skills Assessment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INDEPENDENT_LIVING_SKILLS.map(skill => {
              const checked = livingSkills[skill.key] || false;
              const SkillIcon = skill.icon;
              return (
                <div
                  key={skill.key}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${checked ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/30"}`}
                  onClick={() => toggleSkill(skill.key)}
                  data-testid={`skill-${skill.key}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${checked ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"}`}>
                    {checked && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <SkillIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{skill.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back-step-3">Back</Button>
            <Button onClick={() => setStep(4)} data-testid="button-next-step-3">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4" data-testid="section-itp-step-4">
          <p className="text-sm font-medium">Support Services Needed</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORT_SERVICES.map(service => {
              const selected = selectedServices.includes(service.key);
              const ServiceIcon = service.icon;
              return (
                <div
                  key={service.key}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${selected ? "bg-blue-50 dark:bg-blue-900/20" : "bg-muted/30"}`}
                  onClick={() => toggleService(service.key)}
                  data-testid={`service-${service.key}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selected ? "bg-blue-500 text-white" : "border border-muted-foreground/30"}`}>
                    {selected && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <ServiceIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{service.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setStep(3)} data-testid="button-back-step-4">Back</Button>
            <Button onClick={handleSubmit} data-testid="button-create-plan">
              Create Transition Plan
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PlanCard({ plan, applications, credentials, followUps, onSelect }: {
  plan: TransitionPlan;
  applications: CollegeApplication[];
  credentials: Credential[];
  followUps: FollowUp[];
  onSelect: () => void;
}) {
  const completedSkills = Object.values(plan.independentLivingSkills).filter(Boolean).length;
  const totalSkills = Object.keys(plan.independentLivingSkills).length;
  const skillsPercent = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;
  const avgReadiness = Math.round(
    (plan.readinessScores.academic + plan.readinessScores.career + plan.readinessScores.personalSocial) / 3
  );
  const earnedCredentials = credentials.filter(c => c.status === "earned").length;

  return (
    <Card
      className={`p-4 hover-elevate cursor-pointer ${plan.isExample ? "border-amber-300 dark:border-amber-700" : ""}`}
      onClick={onSelect}
      data-testid={`card-plan-${plan.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="font-semibold" data-testid={`text-plan-name-${plan.id}`}>{plan.studentName}</h3>
          <p className="text-xs text-muted-foreground">{plan.studentId}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {plan.isExample && <ExampleBadge />}
          <Badge variant="secondary" className={getStatusColor(plan.status)} data-testid={`badge-plan-status-${plan.id}`}>
            {plan.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">{plan.educationGoalDetails}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">{plan.careerGoal}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-md bg-muted/30">
          <p className="text-lg font-bold">{avgReadiness}%</p>
          <p className="text-[10px] text-muted-foreground">Readiness</p>
        </div>
        <div className="p-2 rounded-md bg-muted/30">
          <p className="text-lg font-bold">{applications.length}</p>
          <p className="text-[10px] text-muted-foreground">Applications</p>
        </div>
        <div className="p-2 rounded-md bg-muted/30">
          <p className="text-lg font-bold">{earnedCredentials}</p>
          <p className="text-[10px] text-muted-foreground">Credentials</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Independent Living Skills</span>
          <span className="font-medium">{completedSkills}/{totalSkills}</span>
        </div>
        <Progress value={skillsPercent} className="h-1.5" />
      </div>

      {plan.isExample && (
        <ExampleNote text="This is an example transition plan — create real plans by completing the student intake process and working with your transition coordinator to set personalized goals." />
      )}
    </Card>
  );
}

function PlanDetail({ plan, applications, credentials, followUps }: {
  plan: TransitionPlan;
  applications: CollegeApplication[];
  credentials: Credential[];
  followUps: FollowUp[];
}) {
  const [showAppForm, setShowAppForm] = useState(false);
  const [showCredForm, setShowCredForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  const completedSkills = Object.values(plan.independentLivingSkills).filter(Boolean).length;
  const totalSkills = Object.keys(plan.independentLivingSkills).length;
  const skillsPercent = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

  return (
    <div className="space-y-6">
      {plan.isExample && (
        <div className="flex items-start gap-3 p-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40" data-testid="banner-example-plan">
          <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Example Plan</p>
              <ExampleBadge />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This is a demonstration plan showing system capabilities. Real plans are created through the student intake process with your transition coordinator. Data shown here is fictional and for illustration purposes only.
            </p>
          </div>
        </div>
      )}

      <Card className="p-5" data-testid="card-plan-overview">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-lg" data-testid="text-detail-name">{plan.studentName}</h2>
            <p className="text-sm text-muted-foreground">{plan.studentId} | Last updated: {plan.lastUpdated}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {plan.isExample && <ExampleBadge />}
            <Badge variant="secondary" className={getStatusColor(plan.status)}>{plan.status}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Education Goal</p>
                <p className="text-sm font-medium" data-testid="text-education-goal">{plan.educationGoalDetails}</p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {EDUCATION_GOAL_TYPES.find(g => g.value === plan.educationGoalType)?.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Career Goal</p>
                <p className="text-sm font-medium" data-testid="text-career-goal">{plan.careerGoal}</p>
                <Badge variant="outline" className="text-[10px] mt-1">{plan.careerField}</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5" data-testid="card-readiness-assessment">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" /> Transition Readiness Assessment
        </h3>
        <div className="space-y-4">
          <ReadinessGauge label="Academic" score={plan.readinessScores.academic} icon={GraduationCap} />
          <ReadinessGauge label="Career" score={plan.readinessScores.career} icon={Briefcase} />
          <ReadinessGauge label="Personal/Social" score={plan.readinessScores.personalSocial} icon={Users} />
        </div>
        <div className="mt-4 p-3 rounded-md bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Overall Readiness</span>
            <span className="text-sm font-bold">
              {Math.round((plan.readinessScores.academic + plan.readinessScores.career + plan.readinessScores.personalSocial) / 3)}%
            </span>
          </div>
          <Progress
            value={Math.round((plan.readinessScores.academic + plan.readinessScores.career + plan.readinessScores.personalSocial) / 3)}
            className="h-2 mt-2"
          />
        </div>
      </Card>

      <Card className={`p-5 ${plan.isExample ? "border-amber-200 dark:border-amber-800/40" : ""}`} data-testid="card-college-applications">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> College Applications ({applications.length})
            </h3>
            {plan.isExample && <ExampleBadge />}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAppForm(true)} data-testid="button-add-application">
            <Plus className="h-4 w-4 mr-1" /> Add Application
          </Button>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-applications">No applications tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {applications.map(app => (
              <div key={app.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30 flex-wrap" data-testid={`app-${app.id}`}>
                <div>
                  <p className="text-sm font-medium" data-testid={`text-college-name-${app.id}`}>{app.collegeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {COLLEGE_TYPES.find(t => t.value === app.collegeType)?.label}
                    {app.submittedDate && ` | Submitted: ${app.submittedDate}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={getStatusColor(app.applicationStatus)} data-testid={`badge-app-status-${app.id}`}>
                    {APPLICATION_STATUSES.find(s => s.value === app.applicationStatus)?.label}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${getStatusColor(app.financialAidStatus)}`} data-testid={`badge-aid-status-${app.id}`}>
                    {FINANCIAL_AID_STATUSES.find(s => s.value === app.financialAidStatus)?.label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {plan.isExample && applications.length > 0 && (
          <ExampleNote text="These are example college applications showing how the system tracks application status, financial aid progress, and decision timelines. Real applications are added as students apply to colleges." />
        )}
      </Card>

      <Card className={`p-5 ${plan.isExample ? "border-amber-200 dark:border-amber-800/40" : ""}`} data-testid="card-credentials">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4" /> Credential Attainment ({credentials.length})
            </h3>
            {plan.isExample && <ExampleBadge />}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowCredForm(true)} data-testid="button-add-credential">
            <Plus className="h-4 w-4 mr-1" /> Add Credential
          </Button>
        </div>
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-credentials">No credentials tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {credentials.map(cred => (
              <div key={cred.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30 flex-wrap" data-testid={`cred-${cred.id}`}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" data-testid={`text-cred-name-${cred.id}`}>{cred.credentialName}</p>
                    {cred.isStackable && (
                      <Badge variant="outline" className="text-[10px]">Stackable</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cred.issuingOrg} | {CREDENTIAL_TYPES.find(t => t.value === cred.credentialType)?.label}
                    {cred.earnedDate && ` | Earned: ${cred.earnedDate}`}
                  </p>
                </div>
                <Badge variant="secondary" className={getStatusColor(cred.status)} data-testid={`badge-cred-status-${cred.id}`}>
                  {cred.status === "in-progress" ? "In Progress" : cred.status.charAt(0).toUpperCase() + cred.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {plan.isExample && credentials.length > 0 && (
          <ExampleNote text="These are example credentials demonstrating how the system tracks industry certifications, stackable credentials, and professional licenses. Real credentials are recorded as students earn them." />
        )}
      </Card>

      <Card className="p-5" data-testid="card-independent-living">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Home className="h-4 w-4" /> Independent Living Skills
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {completedSkills} of {totalSkills} skills demonstrated ({skillsPercent}%)
        </p>
        <Progress value={skillsPercent} className="h-2 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INDEPENDENT_LIVING_SKILLS.map(skill => {
            const checked = plan.independentLivingSkills[skill.key] || false;
            const SkillIcon = skill.icon;
            return (
              <div
                key={skill.key}
                className={`flex items-center gap-3 p-3 rounded-md ${checked ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/30"}`}
                data-testid={`living-skill-${skill.key}`}
              >
                {checked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <SkillIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`text-sm ${checked ? "" : "text-muted-foreground"}`}>{skill.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5" data-testid="card-support-services">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Support Services
        </h3>
        <div className="flex flex-wrap gap-2">
          {plan.supportServices.map(serviceKey => {
            const service = SUPPORT_SERVICES.find(s => s.key === serviceKey);
            if (!service) return null;
            const ServiceIcon = service.icon;
            return (
              <Badge key={serviceKey} variant="secondary" data-testid={`badge-service-${serviceKey}`}>
                <ServiceIcon className="h-3 w-3 mr-1" />
                {service.label}
              </Badge>
            );
          })}
        </div>
      </Card>

      <Card className="p-5" data-testid="card-follow-up">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" /> 12-Month Post-Exit Follow-Up
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowFollowUpForm(true)} data-testid="button-add-followup">
            <Plus className="h-4 w-4 mr-1" /> Record Check-In
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {FOLLOW_UP_MONTHS.map(month => {
            const completed = followUps.some(f => f.checkMonth === month);
            return (
              <div
                key={month}
                className={`flex flex-col items-center p-2 rounded-md min-w-[48px] ${completed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/30"}`}
                data-testid={`followup-month-${month}`}
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
                <span className="text-[10px] text-muted-foreground mt-1">Mo {month}</span>
              </div>
            );
          })}
        </div>
        {followUps.length > 0 && (
          <div className="space-y-3">
            {followUps.map(fu => (
              <div key={fu.id} className="p-3 rounded-md bg-muted/30" data-testid={`followup-${fu.id}`}>
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium">Month {fu.checkMonth} Check-In</span>
                  <span className="text-xs text-muted-foreground">{fu.completedDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Employment: </span>
                    <span className="font-medium">{fu.employmentStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Education: </span>
                    <span className="font-medium">{fu.educationStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Wage: </span>
                    <span className="font-medium">{fu.wageInfo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credentials: </span>
                    <span className="font-medium">{fu.credentialProgress}</span>
                  </div>
                </div>
                {fu.notes && (
                  <p className="text-xs text-muted-foreground">{fu.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {followUps.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="text-no-followups">
            No follow-up check-ins recorded yet. WIOA requires quarterly check-ins for 12 months post-exit.
          </p>
        )}
      </Card>

      <Card className="p-5 border-blue-200 dark:border-blue-800/50" data-testid="card-wioa-compliance">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" /> WIOA Performance Measures Alignment
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground">Credential Attainment</p>
            <p className="font-bold text-lg" data-testid="text-wioa-credentials">
              {credentials.filter(c => c.status === "earned").length}/{credentials.length}
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground">College Enrollment</p>
            <p className="font-bold text-lg" data-testid="text-wioa-enrollment">
              {applications.filter(a => a.applicationStatus === "enrolled").length > 0 ? "Yes" : "No"}
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground">Follow-Up Completed</p>
            <p className="font-bold text-lg" data-testid="text-wioa-followups">
              {followUps.length}/{FOLLOW_UP_MONTHS.length}
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground">Measurable Skill Gain</p>
            <p className="font-bold text-lg" data-testid="text-wioa-skills">
              {skillsPercent}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TransitionPlansPage() {
  useEffect(() => { document.title = "Postsecondary Transition Plans | ThriveUp Academy"; }, []);

  const [plans, setPlans] = useState<TransitionPlan[]>(SAMPLE_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const planApplications = selectedPlan ? SAMPLE_APPLICATIONS.filter(a => a.planId === selectedPlan.id) : [];
  const planCredentials = selectedPlan ? SAMPLE_CREDENTIALS.filter(c => c.planId === selectedPlan.id) : [];
  const planFollowUps = selectedPlan ? SAMPLE_FOLLOWUPS.filter(f => f.planId === selectedPlan.id) : [];

  const handleCreatePlan = (planData: Partial<TransitionPlan>) => {
    const newPlan: TransitionPlan = {
      id: `tp-${Date.now()}`,
      studentName: planData.studentName || "New Student",
      studentId: `STU-${new Date().getFullYear()}-${String(plans.length + 1).padStart(3, "0")}`,
      educationGoalType: planData.educationGoalType || "",
      educationGoalDetails: planData.educationGoalDetails || "",
      careerGoal: planData.careerGoal || "",
      careerField: planData.careerField || "",
      independentLivingSkills: planData.independentLivingSkills || {},
      readinessScores: planData.readinessScores || { academic: 50, career: 50, personalSocial: 50 },
      supportServices: planData.supportServices || [],
      status: "active",
      createdDate: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      isExample: false,
    };
    setPlans(prev => [...prev, newPlan]);
    setShowBuilder(false);
    setSelectedPlanId(newPlan.id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="section-transition-plans">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Postsecondary Transition Plans"
          description="AI-powered transition planning with college tracking, credential tracking, and WIOA-aligned post-exit follow-up"
          icon={<GraduationCap className="h-7 w-7" />}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/fafsa-navigator">
            <Button variant="outline" size="sm" data-testid="link-fafsa-navigator">
              <DollarSign className="h-4 w-4 mr-1" /> FAFSA
            </Button>
          </Link>
          <Link href="/workforce-dashboard">
            <Button variant="outline" size="sm" data-testid="link-workforce-dashboard">
              <TrendingUp className="h-4 w-4 mr-1" /> Workforce
            </Button>
          </Link>
          <Link href="/apprenticeship-tracker">
            <Button variant="outline" size="sm" data-testid="link-apprenticeship-tracker">
              <Briefcase className="h-4 w-4 mr-1" /> Apprenticeships
            </Button>
          </Link>
        </div>
      </div>

      <TransitionLifecycle />

      <HolisticDashboard plans={plans} />

      <AITransitionAdvisor plans={plans} />

      <CrossPageNav />

      {selectedPlan ? (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPlanId(null)}
            className="mb-4"
            data-testid="button-back-to-list"
          >
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Back to All Plans
          </Button>
          <PlanDetail
            plan={selectedPlan}
            applications={planApplications}
            credentials={planCredentials}
            followUps={planFollowUps}
          />
        </div>
      ) : showBuilder ? (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBuilder(false)}
            className="mb-4"
            data-testid="button-cancel-builder"
          >
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Cancel
          </Button>
          <PlanBuilder onSave={handleCreatePlan} />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-semibold">Transition Plans ({plans.length})</h2>
            <Button onClick={() => setShowBuilder(true)} data-testid="button-new-plan">
              <Plus className="h-4 w-4 mr-1" /> New Transition Plan
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                applications={SAMPLE_APPLICATIONS.filter(a => a.planId === plan.id)}
                credentials={SAMPLE_CREDENTIALS.filter(c => c.planId === plan.id)}
                followUps={SAMPLE_FOLLOWUPS.filter(f => f.planId === plan.id)}
                onSelect={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>

          <Card className="p-5 mt-6" data-testid="card-aggregate-dashboard">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Aggregate Transition Outcomes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">College Enrollment Rate</p>
                <p className="font-bold text-lg" data-testid="text-agg-enrollment">
                  {Math.round((SAMPLE_APPLICATIONS.filter(a => a.applicationStatus === "enrolled").length / Math.max(plans.length, 1)) * 100)}%
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Credential Rate</p>
                <p className="font-bold text-lg" data-testid="text-agg-credentials">
                  {Math.round((SAMPLE_CREDENTIALS.filter(c => c.status === "earned").length / Math.max(SAMPLE_CREDENTIALS.length, 1)) * 100)}%
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Follow-Up Compliance</p>
                <p className="font-bold text-lg" data-testid="text-agg-followups">
                  {SAMPLE_FOLLOWUPS.length}/{FOLLOW_UP_MONTHS.length * plans.filter(p => p.isExample).length || 1}
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">Avg. Readiness Score</p>
                <p className="font-bold text-lg" data-testid="text-agg-readiness">
                  {plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + (p.readinessScores.academic + p.readinessScores.career + p.readinessScores.personalSocial) / 3, 0) / plans.length) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
