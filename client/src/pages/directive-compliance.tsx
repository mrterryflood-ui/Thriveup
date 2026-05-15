import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight,
  RefreshCw, Send, Target, Activity, Shield, BarChart3,
  ExternalLink, AlertOctagon, Eye, Zap, FileCheck,
  ChevronRight, ChevronDown, Radio, TrendingUp, Globe,
  DollarSign, BookOpen, GraduationCap, Briefcase, Calendar,
  MapPin, Heart, Users, Brain, Loader2,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrainingGuideButton } from "@/components/training-guide";

const ACTIVE_GRANTS = [
  {
    id: "wioa",
    name: "WIOA Adult & Dislocated Worker",
    funder: "Texas Workforce Commission / U.S. DOL",
    amount: "$200K–$500K",
    status: "active",
    deadline: "Rolling",
    category: "workforce",
    alignment: ["Workforce Pipeline", "Credential Attainment", "Job Placement", "Retention Tracking"],
    txStandards: ["TEKS Career Development (§127)", "TWC Workforce Board Standards", "WIOA Title I Performance Measures"],
    keyMetrics: ["Credential attainment rate ≥65%", "Employment rate Q2 ≥72%", "Median earnings Q2 ≥$6,800", "Measurable Skill Gains ≥50%"],
    platforms: ["ThriveUp Academy", "Mission Transition", "LifeBridge"],
  },
  {
    id: "stdavids",
    name: "St. David's Foundation — Community Health & Equity",
    funder: "St. David's Foundation (Austin, TX)",
    amount: "Up to $1M",
    status: "active",
    deadline: "Annual cycle — Letter of Intent required",
    category: "health",
    alignment: ["Whole-Person Health", "Community Health Workers", "Maternal Health", "Social Determinants", "Health Equity", "Behavioral Health Integration"],
    txStandards: ["DSHS Community Health Worker Standards", "TX HHSC Social Determinants Framework", "Maternal Mortality Task Force Recommendations", "SAMHSA Behavioral Health Guidelines"],
    keyMetrics: ["CHW-to-participant ratio 1:30", "Health screening completion ≥80%", "SDOH referral follow-through ≥70%", "Maternal health visit adherence ≥75%", "Behavioral health screening ≥60%", "Community partner retention ≥85%"],
    platforms: ["Sankofa Health", "Whole-Person Health Ecosystem", "Black Maternal Health Network", "ThriveUp Academy", "SafeCogniCare"],
    requiresPartners: false,
    partnerNote: "Direct 501(c)(3) application to St. David's Foundation. Strong preference for Travis County / Central Texas organizations with demonstrated community impact.",
    curriculumAlignment: [
      { module: "Holistic Wellness Planning (9-12)", credential: "Community Health Worker Prep", status: "aligned" },
      { module: "Digital Wellness & Adolescent Health (6-8)", credential: "Youth Health Navigator", status: "aligned" },
      { module: "Nutrition Science (3-5)", credential: "Healthy Living Foundations", status: "aligned" },
      { module: "Life Skills & Leadership (9-12)", credential: "Peer Health Educator", status: "aligned" },
      { module: "Emotional Intelligence (6-8)", credential: "Mental Health First Aid — Youth", status: "aligned" },
      { module: "Growth Mindset & Resilience (3-5)", credential: "Trauma-Informed Care Awareness", status: "planned" },
    ],
    deliverables: [
      "Letter of Intent submitted to St. David's Foundation",
      "Community health needs assessment for Austin/Travis County",
      "CHW training pipeline aligned with DSHS certification standards",
      "Maternal health screening and referral protocol",
      "SDOH navigation system integrated with LifeBridge resources",
      "Annual outcome report: health screenings, referrals, follow-through rates",
    ],
    requiredDocuments: [
      { name: "501(c)(3) Determination Letter", status: "uploaded" },
      { name: "Board of Directors List", status: "uploaded" },
      { name: "Most Recent Audit / Financial Statements", status: "needed" },
      { name: "Organizational Budget (Current Year)", status: "needed" },
      { name: "Program Budget Narrative", status: "needed" },
      { name: "Letters of Community Support", status: "needed" },
      { name: "Logic Model / Theory of Change", status: "uploaded" },
      { name: "Staff Qualifications / Key Personnel CVs", status: "needed" },
    ],
  },
  {
    id: "ssgfox",
    name: "SSG Fox Veterans Grant",
    funder: "SSG Fox Suicide Prevention Grant / VA",
    amount: "$750K",
    status: "active",
    deadline: "Annual",
    category: "veterans",
    alignment: ["Veteran Suicide Prevention", "Peer Support", "Transition Services", "Crisis Intervention"],
    txStandards: ["VA Community Care Standards", "TX Veterans Commission Standards", "SAMHSA Suicide Prevention Guidelines"],
    keyMetrics: ["Crisis response within 24 hours", "Veteran engagement retention ≥60%", "Peer support contact monthly ≥85%", "Safety plan completion 100%"],
    platforms: ["Mission Transition", "SafeReport", "ThriveUp Academy"],
  },
  {
    id: "foundation",
    name: "Foundation Grants (Multiple)",
    funder: "Various foundations",
    amount: "$100K–$500K",
    status: "active",
    deadline: "Varies",
    category: "community",
    alignment: ["Community Development", "Youth Programs", "Reentry Support", "Education Access"],
    txStandards: ["TEA Chapter 110–128 TEKS", "TJJD Reentry Standards", "TDCJ Reentry Guidelines"],
    keyMetrics: ["Program completion rate ≥70%", "Recidivism reduction ≥25%", "Family reunification ≥60%", "Education enrollment ≥80%"],
    platforms: ["ThriveUp Academy", "LifeBridge", "ISSS"],
  },
  {
    id: "twcrfa",
    name: "TWC RFA 32026-00162",
    funder: "Texas Workforce Commission",
    amount: "Up to $2M",
    status: "submitted",
    deadline: "April 10, 2026 at 10AM CDT",
    category: "workforce",
    alignment: ["Skills Development Fund", "Employer-Driven Training", "Industry Partnerships", "Credential Programs"],
    txStandards: ["TWC Skills Development Fund Rules (Chapter 803)", "THECB Credential Standards", "TEA CTE Standards"],
    keyMetrics: ["Training completion ≥80%", "Industry credential attainment ≥70%", "Employer satisfaction ≥90%", "Wage increase ≥15%"],
    platforms: ["ThriveUp Academy", "AI Workforce Academy", "Minority Center of Excellence"],
    contact: "Cassandra Johnson, RFAgrants@twc.texas.gov",
    requiresPartners: true,
    partnerRequirements: [
      "Employer partners committing to hire program completers",
      "Industry advisory board with credential-aligned employers",
      "Community college / THECB-approved training provider",
      "Local workforce board engagement (Capital Area or Rural Capital)",
      "Registered Apprenticeship sponsors (DOL-approved)",
    ],
    curriculumAlignment: [
      { module: "Professional Presence", credential: "TWC Workplace Readiness Certificate", status: "aligned" },
      { module: "Workplace Rights & Responsibilities", credential: "OSHA 10-Hour General Industry", status: "aligned" },
      { module: "Workplace Safety Essentials", credential: "OSHA 10-Hour / OSHA 30-Hour", status: "aligned" },
      { module: "Time & Priority Management", credential: "Project Management Fundamentals", status: "aligned" },
      { module: "Work Ethic & Career Leadership", credential: "National Career Readiness Certificate (NCRC)", status: "aligned" },
      { module: "AI Literacy (6-8 & 9-12)", credential: "AI Foundations Micro-Credential", status: "aligned" },
      { module: "Industry Credential Pathways", credential: "CompTIA IT Fundamentals+ / A+", status: "planned" },
      { module: "Employer-Driven Training", credential: "Customized per employer partner", status: "planned" },
    ],
    deliverables: [
      "Skills Development Fund application with employer commitment letters",
      "Training plan with measurable skill gains tied to industry credentials",
      "Employer satisfaction survey framework (pre/post hiring)",
      "Wage outcome tracking system (baseline → Q2 → Q4)",
      "Credential attainment reporting dashboard",
    ],
    requiredDocuments: [
      { name: "501(c)(3) Determination Letter", status: "uploaded" },
      { name: "SAM.gov Registration (UEI)", status: "uploaded" },
      { name: "Employer Commitment Letters (3+ required)", status: "needed" },
      { name: "Training Curriculum & Credential Mapping", status: "uploaded" },
      { name: "TWC Chapter 803 Compliance Checklist", status: "needed" },
      { name: "Organizational Budget & Cost Allocation Plan", status: "needed" },
      { name: "Board Resolution Authorizing Application", status: "needed" },
      { name: "Prior Grant Performance Reports", status: "needed" },
      { name: "Employer Partnership MOUs", status: "needed" },
      { name: "Wage & Outcome Tracking Plan", status: "uploaded" },
    ],
  },
  {
    id: "rareimpact",
    name: "Rare Impact Fund — Nonclinical Youth Mental Health Workforce",
    funder: "Rare Impact Fund (Selena Gomez, $100M Initiative)",
    amount: "$250K–$500K",
    status: "loi-submitted",
    deadline: "LOI April 10, 2026",
    category: "community",
    alignment: ["Nonclinical Workforce Pipeline", "Youth Mental Health", "Peer Mentor Pathways", "Culturally Responsive Care", "Health Equity"],
    txStandards: ["TEA Equity Standards", "DSHS Community Health Worker Standards", "SAMHSA Youth Mental Health First Aid"],
    keyMetrics: ["Youth served annually ≥500", "Nonclinical provider pipeline ≥50 trainees/year", "Program reach in underserved ZIP codes ≥5", "Culturally responsive training completion ≥80%", "Participant satisfaction ≥85%"],
    platforms: ["ThriveUp Academy", "ISSS", "Perfectly Different", "Sankofa Health Network"],
    requiresPartners: false,
    partnerNote: "No formal partner requirements — direct 501(c)(3) application. 2-year grant cycle.",
    curriculumAlignment: [
      { module: "Social Skills Builder (3-5)", credential: "Youth Peer Support Foundations", status: "aligned" },
      { module: "Emotional Intelligence (6-8)", credential: "Youth Mental Health First Aid", status: "aligned" },
      { module: "Life Skills & Leadership (9-12)", credential: "Peer Mentor Certification", status: "aligned" },
      { module: "AI Literacy — Responsible Use", credential: "Digital Wellness Micro-Credential", status: "aligned" },
      { module: "Holistic Wellness Planning (9-12)", credential: "Community Health Worker Prep", status: "aligned" },
      { module: "Growth Mindset & Resilience (3-5)", credential: "SEL Foundations Badge", status: "aligned" },
    ],
    deliverables: [
      "LOI submitted by April 10, 2026 (DONE)",
      "Full proposal upon invitation (est. May–June 2026)",
      "Nonclinical workforce training curriculum with career pathways",
      "Youth voice integration strategy and peer mentor pipeline",
      "Culturally responsive care framework for Austin communities",
      "2-year outcome measurement plan (trainee retention, placement, satisfaction)",
    ],
    requiredDocuments: [
      { name: "501(c)(3) Determination Letter", status: "uploaded" },
      { name: "Letter of Intent (LOI)", status: "uploaded" },
      { name: "Organizational Overview & Mission Statement", status: "uploaded" },
      { name: "Program Design Narrative", status: "needed" },
      { name: "Youth Voice Integration Plan", status: "needed" },
      { name: "Culturally Responsive Framework Documentation", status: "needed" },
      { name: "Budget Narrative (2-Year)", status: "needed" },
      { name: "Outcome Measurement Plan", status: "needed" },
      { name: "Staff/Trainer Qualifications", status: "needed" },
    ],
  },
  {
    id: "pm-c2-transport",
    name: "PM C2 Transport — Capability Statement Solicitation",
    funder: "U.S. Army / PEO C3T (Program Executive Office Command, Control & Communications-Tactical)",
    amount: "Contract Vehicle (TBD upon award)",
    status: "in_progress",
    deadline: "April 3, 2026 (1300 EST email submission)",
    category: "defense",
    alignment: ["Command & Control Transport", "COMSEC Tier Alignment", "Emergency Communications", "All-Hazard Preparedness", "Geographic Risk Mapping", "Crisis Coordination"],
    txStandards: ["DoD C2 Transport Standards", "COMSEC Compliance (all tiers)", "Army PEO C3T Program Assessment Elements (PAEs)", "NIST Cybersecurity Framework"],
    keyMetrics: ["All 6 PAEs mapped via Emergency Management platform", "COMSEC tier coverage 100%", "C2 transport alignment table complete", "Capability statement submitted by deadline"],
    // HISTORICAL EXCEPTION (DoD C2 Transport pursuit record): Emergency Management + Ecosystem Nexus
    // were the originally-cited platforms in this specific DoD solicitation response. Retained as a faithful
    // record of the pursuit. NOT to be used as a model for new reviewer-facing references; the 15
    // service-platform externalization rule applies everywhere else.
    platforms: ["Emergency Management", "Ecosystem Nexus", "Mission Transition", "Minority Center of Excellence"],
    requiresPartners: false,
    partnerRequirements: [],
    curriculumAlignment: [
      { module: "Emergency Mgmt — PAE 1: Transport Network Ops", credential: "C2 Transport Operations", status: "aligned" },
      { module: "Emergency Mgmt — PAE 2: Network Security", credential: "COMSEC Tier Compliance", status: "aligned" },
      { module: "Emergency Mgmt — PAE 3: Spectrum Management", credential: "Electromagnetic Spectrum Ops", status: "aligned" },
      { module: "Emergency Mgmt — PAE 4: Satellite Communications", credential: "SATCOM Systems", status: "aligned" },
      { module: "Emergency Mgmt — PAE 5: Tactical Radio Systems", credential: "Tactical Communications", status: "aligned" },
      { module: "Emergency Mgmt — PAE 6: Network Modernization", credential: "C2 Modernization & Integration", status: "aligned" },
    ],
    deliverables: [
      "Capability Statement (built and live at /capability-statement)",
      "Full C2 transport alignment table mapping all 6 PAEs",
      "COMSEC tier coverage documentation",
      "Email submission to Army PM C2 Transport by April 3, 2026 at 1300 EST",
      "In-person event preparation for April 28-29, 2026 — Augusta, GA (if selected)",
      "Emergency management platform demonstration materials",
    ],
    requiredDocuments: [
      { name: "Capability Statement", status: "uploaded" },
      { name: "501(c)(3) Determination Letter", status: "uploaded" },
      { name: "SAM.gov Registration (UEI)", status: "uploaded" },
      { name: "C2 Transport Alignment Table (6 PAEs)", status: "uploaded" },
      { name: "COMSEC Tier Mapping Documentation", status: "uploaded" },
      { name: "Email Submission Confirmation (due April 3)", status: "needed" },
      { name: "In-Person Presentation Deck (Augusta, GA — April 28-29)", status: "needed" },
    ],
  },
  {
    id: "spaceforce-skillbridge",
    name: "U.S. Space Force SkillBridge / DoD Transition",
    funder: "U.S. Space Force / Department of Defense",
    amount: "$500K–$1.5M",
    status: "identified",
    deadline: "Rolling / Annual BAA cycles",
    category: "veterans",
    alignment: ["Military-to-Civilian Transition", "SkillBridge Internships", "Space & Cyber Workforce", "AI/ML Training Pipelines", "Credential Translation"],
    txStandards: ["VA Community Care Standards", "TX Veterans Commission Standards", "DoD SkillBridge Program Requirements", "CompTIA Security+ / Space Operations Standards"],
    keyMetrics: ["SkillBridge participant placement ≥85%", "Credential attainment within 90 days ≥75%", "Employer match satisfaction ≥90%", "Retention at 12 months ≥70%"],
    platforms: ["Mission Transition", "SafeReport", "ThriveUp Academy", "Minority Center of Excellence"],
    requiresPartners: true,
    partnerRequirements: [
      "DoD SkillBridge-approved training provider (or pending application)",
      "Employer partners in space, cyber, defense, or tech sectors",
      "Austin-area defense/aerospace contractors (e.g., L3Harris, BAE Systems, Raytheon)",
      "Texas Veterans Commission partnership for state-level coordination",
      "Community college or THECB provider for stackable credentials",
    ],
    curriculumAlignment: [
      { module: "AI Mastery (9-12)", credential: "AI/ML Foundations for Defense", status: "aligned" },
      { module: "Workforce Readiness — Professional Presence", credential: "Military-to-Civilian Communication", status: "aligned" },
      { module: "Work Ethic & Career Leadership", credential: "Leadership in Civilian Orgs", status: "aligned" },
      { module: "AI Literacy — Evaluate & Direct", credential: "CompTIA Security+ Prep", status: "planned" },
      { module: "Career Foundations — Teamwork", credential: "Cross-Functional Team Leadership", status: "aligned" },
      { module: "Time & Priority Management", credential: "PMP / CAPM Fundamentals", status: "planned" },
    ],
    deliverables: [
      "SkillBridge provider application to DoD (pending)",
      "Space/cyber workforce training curriculum with AI integration",
      "Military credential translation matrix (MOS → civilian certs)",
      "Employer partnership pipeline for defense/tech sector",
      "Veteran transition tracking dashboard (separation → training → placement)",
      "Alignment with USSF Guardian Ideal competency framework",
    ],
    requiredDocuments: [
      { name: "501(c)(3) Determination Letter", status: "uploaded" },
      { name: "SAM.gov Registration (UEI)", status: "uploaded" },
      { name: "SkillBridge Provider Application (DD Form)", status: "needed" },
      { name: "DoD-Aligned Training Curriculum", status: "needed" },
      { name: "Military Credential Translation Matrix", status: "needed" },
      { name: "Employer Partner Letters (Defense/Tech)", status: "needed" },
      { name: "Veteran Outcome Tracking Plan", status: "needed" },
      { name: "Cybersecurity Training Accreditation", status: "needed" },
      { name: "TX Veterans Commission Partnership Letter", status: "needed" },
    ],
  },
];

const TX_STANDARDS_ALIGNMENT = [
  {
    category: "Workforce Development",
    icon: Briefcase,
    color: "bg-blue-500",
    standards: [
      { code: "TWC Ch. 803", name: "Skills Development Fund", aligned: true, detail: "Employer-driven training, credential attainment, wage outcomes" },
      { code: "WIOA Title I", name: "Adult/Dislocated Worker Performance", aligned: true, detail: "Employment Q2/Q4, median earnings, credential rate, MSG" },
      { code: "TEKS §127", name: "Career Development", aligned: true, detail: "Career exploration, workplace readiness, industry certifications" },
      { code: "TWC WDB", name: "Workforce Board Standards", aligned: true, detail: "Local board performance measures and reporting" },
    ],
  },
  {
    category: "Education (K-12 & CTE)",
    icon: GraduationCap,
    color: "bg-emerald-500",
    standards: [
      { code: "TEA Ch. 110", name: "English Language Arts & Reading", aligned: true, detail: "Reading comprehension, writing, communication skills" },
      { code: "TEA Ch. 111", name: "Mathematics", aligned: true, detail: "Number sense, algebraic reasoning, data analysis" },
      { code: "TEA Ch. 112", name: "Science", aligned: true, detail: "Scientific inquiry, STEM foundations" },
      { code: "TEA Ch. 113", name: "Social Studies", aligned: true, detail: "Civics, government, economics, history" },
      { code: "TEA Ch. 127-130", name: "Career & Technical Education", aligned: true, detail: "Industry-based certifications, work-based learning" },
      { code: "STAAR", name: "State Assessment Alignment", aligned: true, detail: "Grades 3-8 and EOC assessment prep integration" },
    ],
  },
  {
    category: "Health & Human Services",
    icon: Heart,
    color: "bg-rose-500",
    standards: [
      { code: "DSHS CHW", name: "Community Health Worker Standards", aligned: true, detail: "CHW certification, scope of practice, supervision" },
      { code: "HHSC SDOH", name: "Social Determinants of Health", aligned: true, detail: "Housing, food security, transportation, healthcare access" },
      { code: "MMTF", name: "Maternal Mortality Task Force", aligned: true, detail: "Black maternal health disparities, prenatal care access" },
      { code: "SAMHSA", name: "Suicide Prevention Guidelines", aligned: true, detail: "Evidence-based prevention, crisis intervention, peer support" },
    ],
  },
  {
    category: "Justice & Reentry",
    icon: Shield,
    color: "bg-purple-500",
    standards: [
      { code: "TDCJ", name: "Reentry Guidelines", aligned: true, detail: "Pre-release planning, community supervision, family reunification" },
      { code: "TJJD", name: "Juvenile Justice Standards", aligned: true, detail: "Youth reentry, education continuity, behavioral health" },
      { code: "DOJ BJA", name: "Second Chance Act", aligned: true, detail: "Evidence-based reentry, recidivism reduction, employment" },
      { code: "PREA", name: "Prison Rape Elimination Act", aligned: true, detail: "Safety standards, reporting requirements" },
    ],
  },
  {
    category: "Veterans Services",
    icon: Users,
    color: "bg-slate-500",
    standards: [
      { code: "VA CC", name: "Community Care Standards", aligned: true, detail: "Veteran healthcare access, community provider network" },
      { code: "TVC", name: "Texas Veterans Commission", aligned: true, detail: "Employment services, education benefits, behavioral health" },
      { code: "PREVENTS", name: "Presidential Roadmap (Veteran Suicide)", aligned: true, detail: "Community integration, connectedness, peer support" },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  workforce: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  health: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  veterans: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
  community: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  "loi-submitted": { label: "LOI Submitted", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
  preparing: { label: "Preparing", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  identified: { label: "Identified", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

interface IntelPlatform {
  id: string;
  name: string;
  domain: string;
  status: string;
  connected: boolean;
  lastHeartbeat: string | null;
  heartbeatAgeMinutes: number | null;
  fidelity: { score: number; grade: string; total: number; acknowledged: number; delivered: number; pending: number };
  ackQuality: { verified: number; substantive: number; weak: number; legacy: number };
  completedWork: { directive: string; whatWasDone: string; evidenceUrl: string | null; verificationStatus: string; ackQuality: string; acknowledgedAt: string | null }[];
  overdue: { directive: string; directiveId: string }[];
  grantAlignment: string[];
}

interface IntelReport {
  generatedAt: string;
  ecosystemSummary: {
    total: number;
    connected: number;
    disconnected: number;
    avgFidelity: number;
    avgGrade: string;
    workChainsTriggered: number;
  };
  platforms: IntelPlatform[];
  grantReadiness: Record<string, { platforms: number; avgFidelity: number; overdueTasks: number }>;
  verificationSummary: { verified: number; unverified: number; failed: number; noUrl: number };
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300",
  B: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
  C: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300",
  D: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300",
  F: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  online: CheckCircle2,
  degraded: AlertTriangle,
  offline: XCircle,
  unknown: AlertOctagon,
};

const PLATFORM_STATUS_COLORS: Record<string, string> = {
  online: "text-emerald-600",
  degraded: "text-amber-600",
  offline: "text-red-600",
  unknown: "text-gray-400",
};

function getPriorityScore(p: IntelPlatform): number {
  let score = 0;
  if (p.status === "offline") score += 100;
  if (p.status === "degraded") score += 50;
  score += p.overdue.length * 30;
  score += (100 - p.fidelity.score);
  if (p.fidelity.pending > 0) score += p.fidelity.pending * 10;
  return score;
}

export default function DirectiveCompliancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("grants");
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const { data: intelReport, isLoading, refetch } = useQuery<IntelReport>({
    queryKey: ["/api/ecosystem/intelligence-report"],
    retry: false,
  });

  const resendMutation = useMutation({
    mutationFn: async (platformId: string) => {
      await apiRequest("POST", "/api/ecosystem/resend-directives", { platformId });
    },
    onSuccess: () => {
      toast({ title: "Directives resent", description: "Pending directives have been re-delivered." });
      queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/intelligence-report"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Could not resend directives. Please try again.", variant: "destructive" });
    },
  });

  const totalGrantValue = "$3.55M–$6.25M+ (plus C2 Transport contract)";
  const activeCount = ACTIVE_GRANTS.filter(g => g.status === "active").length;
  const submittedCount = ACTIVE_GRANTS.filter(g => g.status === "submitted" || g.status === "loi-submitted" || g.status === "identified" || g.status === "in_progress").length;
  const totalStandards = TX_STANDARDS_ALIGNMENT.reduce((acc, cat) => acc + cat.standards.length, 0);
  const alignedStandards = TX_STANDARDS_ALIGNMENT.reduce((acc, cat) => acc + cat.standards.filter(s => s.aligned).length, 0);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6" data-testid="directive-compliance-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" data-testid="page-title-compliance">
            <FileCheck className="h-7 w-7 text-primary" />
            Grant Tracking & Standards Alignment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Active grants, Texas standards alignment, ecosystem compliance — The Collaborative Advocate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrainingGuideButton moduleId="directive-compliance" />
          {intelReport && (
            <Button variant="outline" onClick={() => refetch()} className="gap-2" data-testid="button-refresh-compliance">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center border-2 border-primary/20" data-testid="stat-total-funding">
          <CardContent className="pt-4 pb-3">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <div className="text-xl md:text-2xl font-bold text-emerald-600">{totalGrantValue}</div>
            <div className="text-xs text-muted-foreground">Total Grant Pipeline</div>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-active-grants">
          <CardContent className="pt-4 pb-3">
            <Target className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Active Grants</div>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-submitted">
          <CardContent className="pt-4 pb-3">
            <Send className="h-5 w-5 mx-auto mb-1 text-violet-600" />
            <div className="text-2xl font-bold text-violet-600">{submittedCount}</div>
            <div className="text-xs text-muted-foreground">Submitted / LOI</div>
          </CardContent>
        </Card>
        <Card className="text-center" data-testid="stat-tx-standards">
          <CardContent className="pt-4 pb-3">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <div className="text-2xl font-bold text-amber-600">{alignedStandards}/{totalStandards}</div>
            <div className="text-xs text-muted-foreground">TX Standards Aligned</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${intelReport ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="grants" data-testid="tab-grants">
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Active Grants ({ACTIVE_GRANTS.length})
          </TabsTrigger>
          <TabsTrigger value="standards" data-testid="tab-standards">
            <BookOpen className="h-3.5 w-3.5 mr-1" /> TX Standards ({totalStandards})
          </TabsTrigger>
          {intelReport && (
            <TabsTrigger value="ecosystem" data-testid="tab-ecosystem">
              <Globe className="h-3.5 w-3.5 mr-1" /> Ecosystem ({intelReport.platforms.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="grants" className="mt-4 space-y-3">
          {ACTIVE_GRANTS.map((grant) => {
            const isExpanded = expandedGrant === grant.id;
            const statusInfo = STATUS_LABELS[grant.status] || STATUS_LABELS.identified;
            return (
              <Card key={grant.id} className="border-l-4 border-l-primary/40" data-testid={`grant-card-${grant.id}`}>
                <CardContent className="pt-4 pb-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedGrant(isExpanded ? null : grant.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Target className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate" data-testid={`grant-name-${grant.id}`}>{grant.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{grant.funder}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="font-bold text-sm" variant="outline" data-testid={`grant-amount-${grant.id}`}>{grant.amount}</Badge>
                      <Badge className={`text-xs border-0 ${statusInfo.color}`}>{statusInfo.label}</Badge>
                      <Badge className={`text-xs border-0 ${CATEGORY_COLORS[grant.category] || ""}`}>{grant.category}</Badge>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <Separator />

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Deadline
                          </h4>
                          <p className="text-sm text-muted-foreground">{grant.deadline}</p>
                          {"contact" in grant && (
                            <p className="text-xs text-muted-foreground mt-1">Contact: {grant.contact}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" /> Aligned Platforms
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {grant.platforms.map(p => (
                              <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" /> Program Alignment
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {grant.alignment.map(a => (
                            <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> TX Standards Addressed
                        </h4>
                        <div className="space-y-1">
                          {grant.txStandards.map(s => (
                            <div key={s} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <BarChart3 className="h-3.5 w-3.5" /> Key Performance Metrics
                        </h4>
                        <div className="grid md:grid-cols-2 gap-2">
                          {grant.keyMetrics.map(m => (
                            <div key={m} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                              <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {"requiresPartners" in grant && (
                        <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            {(grant as any).requiresPartners ? "Partner Requirements (REQUIRED)" : "No Formal Partners Required"}
                          </h4>
                          {(grant as any).requiresPartners && (grant as any).partnerRequirements ? (
                            <div className="space-y-1.5">
                              {((grant as any).partnerRequirements as string[]).map((p: string) => (
                                <div key={p} className="flex items-start gap-2 text-sm">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">{(grant as any).partnerNote || "Direct 501(c)(3) application — no partner letters required."}</p>
                          )}
                        </div>
                      )}

                      {"curriculumAlignment" in grant && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" /> Curriculum-to-Credential Alignment
                          </h4>
                          <div className="space-y-1.5">
                            {((grant as any).curriculumAlignment as { module: string; credential: string; status: string }[]).map((ca: any) => (
                              <div key={ca.module} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded border">
                                {ca.status === "aligned" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                )}
                                <span className="font-medium min-w-0 flex-1">{ca.module}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{ca.credential}</span>
                                <Badge variant={ca.status === "aligned" ? "default" : "secondary"} className="text-xs shrink-0">
                                  {ca.status === "aligned" ? "Aligned" : "Planned"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {"deliverables" in grant && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <FileCheck className="h-3.5 w-3.5" /> Grant Deliverables
                          </h4>
                          <div className="space-y-1">
                            {((grant as any).deliverables as string[]).map((d: string) => (
                              <div key={d} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {"requiredDocuments" in grant && (() => {
                        const docs = (grant as any).requiredDocuments as { name: string; status: string }[];
                        const uploaded = docs.filter(d => d.status === "uploaded").length;
                        const needed = docs.filter(d => d.status === "needed").length;
                        const pct = Math.round((uploaded / docs.length) * 100);
                        return (
                          <div className={`p-3 rounded-lg border-2 ${needed > 0 ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30" : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"}`}>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${needed > 0 ? "text-red-500" : "text-emerald-500"}`} />
                              Required Documents — {uploaded}/{docs.length} uploaded ({pct}%)
                              {needed > 0 && <Badge variant="destructive" className="text-xs">{needed} MISSING</Badge>}
                            </h4>
                            <Progress value={pct} className="mb-3 h-2" />
                            <div className="grid md:grid-cols-2 gap-1.5">
                              {docs.map((doc) => (
                                <div key={doc.name} className="flex items-center gap-2 text-sm">
                                  {doc.status === "uploaded" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  )}
                                  <span className={doc.status === "needed" ? "font-medium text-red-700 dark:text-red-300" : "text-muted-foreground"}>{doc.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="standards" className="mt-4 space-y-6">
          {TX_STANDARDS_ALIGNMENT.map((category) => (
            <Card key={category.category} data-testid={`standards-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${category.color}`}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  {category.category}
                  <Badge variant="secondary" className="ml-auto">{category.standards.length} standards</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {category.standards.map((standard) => (
                    <div key={standard.code} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                      <div className="mt-0.5">
                        {standard.aligned ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-mono">{standard.code}</Badge>
                          <span className="font-medium text-sm">{standard.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{standard.detail}</p>
                      </div>
                      <Badge className={`shrink-0 text-xs border-0 ${standard.aligned ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                        {standard.aligned ? "Aligned" : "Gap"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {intelReport && (
          <TabsContent value="ecosystem" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="text-center">
                <CardContent className="pt-3 pb-3">
                  <div className="text-2xl font-bold">{intelReport.ecosystemSummary.connected}/{intelReport.ecosystemSummary.total}</div>
                  <div className="text-xs text-muted-foreground">Connected</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-3 pb-3">
                  <div className={`text-2xl font-bold ${intelReport.ecosystemSummary.avgFidelity >= 75 ? "text-emerald-600" : "text-amber-600"}`}>
                    {Math.round(intelReport.ecosystemSummary.avgFidelity)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Fidelity</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-3 pb-3">
                  <div className="text-2xl font-bold">{intelReport.platforms.reduce((a, p) => a + p.overdue.length, 0)}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-3 pb-3">
                  <div className="text-2xl font-bold">{intelReport.platforms.filter(p => p.status === "offline").length}</div>
                  <div className="text-xs text-muted-foreground">Offline</div>
                </CardContent>
              </Card>
            </div>

            {[...intelReport.platforms].sort((a, b) => getPriorityScore(b) - getPriorityScore(a)).map(platform => {
              const StatusIcon = STATUS_ICONS[platform.status] || AlertOctagon;
              const isExpanded = expandedPlatform === platform.id;
              return (
                <Card key={platform.id} data-testid={`platform-row-${platform.id}`}>
                  <CardContent className="pt-3 pb-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-4 w-4 ${PLATFORM_STATUS_COLORS[platform.status]}`} />
                        <span className="font-medium text-sm">{platform.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${GRADE_COLORS[platform.fidelity.grade] || ""} text-xs border-0`}>
                          {platform.fidelity.grade} ({platform.fidelity.score}%)
                        </Badge>
                        <div className="w-20">
                          <Progress value={platform.fidelity.score} className="h-1.5" />
                        </div>
                        <span className="text-xs text-muted-foreground w-24 text-right">
                          {platform.fidelity.acknowledged}/{platform.fidelity.total} done
                        </span>
                        {platform.overdue.length > 0 && (
                          <Badge variant="destructive" className="text-xs">{platform.overdue.length} overdue</Badge>
                        )}
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {platform.overdue.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-red-600">Overdue:</span>
                            {platform.overdue.map((item, idx) => (
                              <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                                {item.directive}
                              </div>
                            ))}
                          </div>
                        )}
                        {platform.completedWork.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-emerald-600">Completed ({platform.completedWork.length}):</span>
                            {platform.completedWork.slice(0, 3).map((work, idx) => (
                              <div key={idx} className="text-xs p-2 bg-emerald-50/50 dark:bg-emerald-950/10 rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                                <span>{work.directive}</span>
                                <Badge className="text-xs border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{work.ackQuality}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); resendMutation.mutate(platform.id); }}
                            disabled={resendMutation.isPending}
                            className="text-xs"
                          >
                            <Send className="h-3 w-3 mr-1" /> Resend Directives
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {Object.keys(intelReport.grantReadiness).length > 0 && (
              <>
                <Separator />
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Grant Readiness by Ecosystem
                </h3>
                {Object.entries(intelReport.grantReadiness).map(([grantName, data]) => (
                  <Card key={grantName} data-testid={`grant-readiness-${grantName}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" /> {grantName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border-0 ${data.avgFidelity >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : data.avgFidelity >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                            {Math.round(data.avgFidelity)}% Fidelity
                          </Badge>
                          {data.overdueTasks > 0 && (
                            <Badge variant="destructive" className="text-xs">{data.overdueTasks} Overdue</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{data.platforms} aligned platforms</span>
                        <Progress value={data.avgFidelity} className="flex-1 h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
