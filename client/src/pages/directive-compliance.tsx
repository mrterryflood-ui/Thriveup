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
  MapPin, Heart, Users, Brain,
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
    name: "St. David's Foundation",
    funder: "St. David's Foundation (Austin, TX)",
    amount: "Up to $1M",
    status: "active",
    deadline: "Annual cycle",
    category: "health",
    alignment: ["Whole-Person Health", "Community Health Workers", "Maternal Health", "Social Determinants"],
    txStandards: ["DSHS Community Health Worker Standards", "TX HHSC Social Determinants Framework", "Maternal Mortality Task Force Recommendations"],
    keyMetrics: ["CHW-to-participant ratio 1:30", "Health screening completion ≥80%", "SDOH referral follow-through ≥70%", "Maternal health visit adherence ≥75%"],
    platforms: ["Sankofa Health", "Whole-Person Health Ecosystem", "Black Maternal Health Network"],
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
    platforms: ["Mission Transition", "Shield Atlas", "ThriveUp Academy"],
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
  },
  {
    id: "rareimpact",
    name: "Rare Impact Fund",
    funder: "Rare Impact Fund",
    amount: "TBD",
    status: "loi-submitted",
    deadline: "LOI April 10, 2026",
    category: "community",
    alignment: ["Community Impact", "Youth Empowerment", "Education Equity", "Workforce Readiness"],
    txStandards: ["TEA Equity Standards", "Community Impact Measurement Standards"],
    keyMetrics: ["Youth served annually", "Program reach in underserved ZIP codes", "Community partnership count", "Participant satisfaction ≥85%"],
    platforms: ["ThriveUp Academy", "ISSS", "WholeMind Learning"],
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

  const { data: intelReport, refetch } = useQuery<IntelReport>({
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
    onError: () => {
      toast({ title: "Resend failed", description: "Could not resend directives.", variant: "destructive" });
    },
  });

  const totalGrantValue = "$3.05M–$4.75M+";
  const activeCount = ACTIVE_GRANTS.filter(g => g.status === "active").length;
  const submittedCount = ACTIVE_GRANTS.filter(g => g.status === "submitted" || g.status === "loi-submitted").length;
  const totalStandards = TX_STANDARDS_ALIGNMENT.reduce((acc, cat) => acc + cat.standards.length, 0);
  const alignedStandards = TX_STANDARDS_ALIGNMENT.reduce((acc, cat) => acc + cat.standards.filter(s => s.aligned).length, 0);

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
