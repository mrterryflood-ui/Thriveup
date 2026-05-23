import { useState } from "react";
import { TrainingGuideButton } from "@/components/training-guide";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JobPlacement, RetentionCheck, TrainingEnrollment, WorkforceAssessment, JobReadinessChecklist, EmployerPartner } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Users,
  GraduationCap,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Target,
  ArrowRight,
  Shield,
  ClipboardCheck,
  Building2,
  DollarSign,
  FileText,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";

interface DashboardData {
  totalAssessments: number;
  totalEnrollments: number;
  totalPlacements: number;
  totalEmployers: number;
  totalPrograms: number;
  totalRetentionChecks: number;
  trainingCompletionRate: number;
  activePlacements: number;
  overallRetentionRate: number;
  retentionByPeriod: {
    thirtyDay: { total: number; retained: number };
    ninetyDay: { total: number; retained: number };
    sixMonth: { total: number; retained: number };
    twelveMonth: { total: number; retained: number };
  };
  pipelineStages: {
    assessment: number;
    training: number;
    placed: number;
    retained: number;
  };
}

interface ReadinessData {
  resumeComplete?: boolean;
  interviewSkills?: boolean;
  professionalAttire?: boolean;
  transportationPlan?: boolean;
  childcarePlan?: boolean;
  backgroundDisclosure?: boolean;
  bankAccount?: boolean;
  identificationDocs?: boolean;
  notes?: string;
  [key: string]: boolean | string | undefined;
}

function StatCard({ label, value, icon: Icon, color, testId }: { label: string; value: string | number; icon: LucideIcon; color: string; testId: string }) {
  return (
    <Card className="p-4" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function PipelineStage({ label, count, total, color, testId }: { label: string; count: number; total: number; color: string; testId: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="text-center" data-testid={testId}>
      <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${color} text-white font-bold text-lg`}>
        {count}
      </div>
      <p className="text-xs font-medium">{label}</p>
      {total > 0 && <p className="text-xs text-muted-foreground">{percentage}%</p>}
    </div>
  );
}

interface PlacementFormData {
  userId: string;
  userName: string;
  employerId: string;
  employerName: string;
  jobTitle: string;
  startDate: string;
  wage: string;
  hoursPerWeek: string;
  benefits: string;
  placementSource: string;
}

interface RetentionFormData {
  placementId: string;
  userId: string;
  checkPeriodDays: string;
  employmentStatus: string;
  currentWage: string;
  wageChange: string;
  promoted: boolean;
  satisfactionRating: string;
  notes: string;
}

export default function WorkforceDashboardPage() {
  const { toast } = useToast();
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [showRetentionForm, setShowRetentionForm] = useState(false);
  const [placementForm, setPlacementForm] = useState<PlacementFormData>({
    userId: "", userName: "", employerId: "", employerName: "",
    jobTitle: "", startDate: "", wage: "", hoursPerWeek: "",
    benefits: "", placementSource: "",
  });
  const [retentionForm, setRetentionForm] = useState<RetentionFormData>({
    placementId: "", userId: "", checkPeriodDays: "30",
    employmentStatus: "employed", currentWage: "", wageChange: "",
    promoted: false, satisfactionRating: "", notes: "",
  });

  const { data: dashboard, isLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["/api/workforce/dashboard"],
    retry: false,
  });

  const { data: placements } = useQuery<JobPlacement[]>({
    queryKey: ["/api/workforce/placements/all"],
  });

  const { data: retentionChecks } = useQuery<RetentionCheck[]>({
    queryKey: ["/api/workforce/retention-checks"],
  });

  const { data: enrollments } = useQuery<TrainingEnrollment[]>({
    queryKey: ["/api/workforce/enrollments/all"],
  });

  const { data: assessments } = useQuery<WorkforceAssessment[]>({
    queryKey: ["/api/workforce/assessments/all"],
  });

  const { data: employers } = useQuery<EmployerPartner[]>({
    queryKey: ["/api/workforce/employers"],
  });

  const { data: readiness } = useQuery<ReadinessData>({
    queryKey: ["/api/workforce/readiness"],
  });

  const readinessMutation = useMutation({
    mutationFn: async (data: ReadinessData) => {
      const res = await apiRequest("POST", "/api/workforce/readiness", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/readiness"] });
      toast({ title: "Updated", description: "Job readiness checklist updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const placementMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/workforce/placements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/placements/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/dashboard"] });
      toast({ title: "Placement Recorded", description: "Job placement has been recorded successfully." });
      setShowPlacementForm(false);
      setPlacementForm({ userId: "", userName: "", employerId: "", employerName: "", jobTitle: "", startDate: "", wage: "", hoursPerWeek: "", benefits: "", placementSource: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const retentionMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/workforce/retention-checks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/retention-checks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/dashboard"] });
      toast({ title: "Check-In Recorded", description: "Retention check-in has been recorded." });
      setShowRetentionForm(false);
      setRetentionForm({ placementId: "", userId: "", checkPeriodDays: "30", employmentStatus: "employed", currentWage: "", wageChange: "", promoted: false, satisfactionRating: "", notes: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleReadiness = (field: string) => {
    const current: ReadinessData = readiness || {};
    readinessMutation.mutate({ ...current, [field]: !current[field] });
  };

  const handlePlacementSubmit = () => {
    const selectedEmployer = (employers || []).find(e => e.id === placementForm.employerId);
    placementMutation.mutate({
      userId: placementForm.userId,
      userName: placementForm.userName,
      employerId: placementForm.employerId,
      employerName: selectedEmployer?.companyName || placementForm.employerName,
      jobTitle: placementForm.jobTitle,
      startDate: new Date(placementForm.startDate).toISOString(),
      wage: placementForm.wage || undefined,
      hoursPerWeek: placementForm.hoursPerWeek ? parseInt(placementForm.hoursPerWeek) : undefined,
      benefits: placementForm.benefits || undefined,
      placementSource: placementForm.placementSource || undefined,
    });
  };

  const handleRetentionSubmit = () => {
    const placement = (placements || []).find(p => p.id === retentionForm.placementId);
    retentionMutation.mutate({
      placementId: retentionForm.placementId,
      userId: placement?.userId || retentionForm.userId,
      checkPeriodDays: parseInt(retentionForm.checkPeriodDays),
      employmentStatus: retentionForm.employmentStatus,
      currentWage: retentionForm.currentWage || undefined,
      wageChange: retentionForm.wageChange || undefined,
      promoted: retentionForm.promoted,
      satisfactionRating: retentionForm.satisfactionRating ? parseInt(retentionForm.satisfactionRating) : undefined,
      notes: retentionForm.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (dashboardError) {
    const msg = (dashboardError as Error).message || "";
    const isAdminGate = msg.includes("401") || msg.includes("403") || /unauthor|forbidden/i.test(msg);
    return (
      <div className="p-6 max-w-3xl mx-auto" data-testid="section-workforce-dashboard-error">
        <Card className="p-6 border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-900/10">
          <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" /> {isAdminGate ? "Admin access required" : "Workforce dashboard unavailable"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isAdminGate
              ? "The Workforce Pipeline Dashboard reads aggregate placement, retention, and readiness data across all participants. Only authenticated admin staff can view it. Sign in as admin to load the dashboard."
              : `We couldn't load the dashboard data. (${msg || "Unknown error"})`}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" data-testid="link-workforce-assessment">
              <Link href="/workforce-assessment">Workforce Assessment</Link>
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="link-workforce-training">
              <Link href="/workforce-training">Workforce Training</Link>
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="link-workforce-employers">
              <Link href="/workforce-employers">Employer Connections</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const d = dashboard || {} as DashboardData;
  const retentionByPeriod = d.retentionByPeriod || { thirtyDay: { total: 0, retained: 0 }, ninetyDay: { total: 0, retained: 0 }, sixMonth: { total: 0, retained: 0 }, twelveMonth: { total: 0, retained: 0 } };
  const pipelineStages = d.pipelineStages || { assessment: 0, training: 0, placed: 0, retained: 0 };

  const readinessItems = [
    { key: "resumeComplete", label: "Resume Complete", icon: FileText },
    { key: "interviewSkills", label: "Interview Skills", icon: Users },
    { key: "professionalAttire", label: "Professional Attire", icon: Briefcase },
    { key: "transportationPlan", label: "Transportation Plan", icon: ArrowRight },
    { key: "childcarePlan", label: "Childcare Plan", icon: Users },
    { key: "backgroundDisclosure", label: "Background Disclosure Strategy", icon: Shield },
    { key: "bankAccount", label: "Bank Account", icon: DollarSign },
    { key: "identificationDocs", label: "ID Documents", icon: ClipboardCheck },
  ];

  const readinessComplete = readinessItems.filter(item => readiness?.[item.key]).length;
  const readinessPercentage = Math.round((readinessComplete / readinessItems.length) * 100);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="section-workforce-dashboard">
      <SectionTutorial {...SECTION_TUTORIALS["workforce-dashboard"]} />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Workforce Pipeline Dashboard"
          description="Track workforce development outcomes across assessment, training, placement, and retention"
          icon={<BarChart3 className="h-7 w-7" />}
        />
        <TrainingGuideButton moduleId="workforce-dashboard" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="section-dashboard-stats">
        <StatCard label="Assessments" value={d.totalAssessments || 0} icon={ClipboardCheck} color="bg-gradient-to-br from-blue-500 to-blue-600" testId="card-stat-assessments" />
        <StatCard label="Training Enrollments" value={d.totalEnrollments || 0} icon={GraduationCap} color="bg-gradient-to-br from-purple-500 to-purple-600" testId="card-stat-enrollments" />
        <StatCard label="Job Placements" value={d.totalPlacements || 0} icon={Briefcase} color="bg-gradient-to-br from-emerald-500 to-emerald-600" testId="card-stat-placements" />
        <StatCard label="Employer Partners" value={d.totalEmployers || 0} icon={Building2} color="bg-gradient-to-br from-amber-500 to-amber-600" testId="card-stat-employers" />
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Button onClick={() => setShowPlacementForm(true)} data-testid="button-record-placement">
          <Plus className="h-4 w-4 mr-2" /> Record Placement
        </Button>
        <Button variant="outline" onClick={() => setShowRetentionForm(true)} data-testid="button-record-retention">
          <Plus className="h-4 w-4 mr-2" /> Record Retention Check-In
        </Button>
      </div>

      <Card className="p-6 mb-6" data-testid="card-pipeline-funnel">
        <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" /> Workforce Pipeline
        </h2>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <PipelineStage label="Assessment" count={pipelineStages.assessment || 0} total={pipelineStages.assessment || 1} color="bg-blue-500" testId="stage-assessment" />
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <PipelineStage label="Training" count={pipelineStages.training || 0} total={pipelineStages.assessment || 1} color="bg-purple-500" testId="stage-training" />
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <PipelineStage label="Placed" count={pipelineStages.placed || 0} total={pipelineStages.assessment || 1} color="bg-emerald-500" testId="stage-placed" />
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <PipelineStage label="Retained" count={pipelineStages.retained || 0} total={pipelineStages.placed || 1} color="bg-amber-500" testId="stage-retained" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-5" data-testid="card-training-metrics">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Training Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">{d.trainingCompletionRate || 0}%</span>
              </div>
              <Progress value={d.trainingCompletionRate || 0} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Programs</span>
                <span className="font-medium">{d.totalPrograms || 0}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Active Enrollments</span>
                <span className="font-medium">{d.totalEnrollments || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="card-retention-metrics">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Retention Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Overall Retention</span>
                <span className="font-medium">{d.overallRetentionRate || 0}%</span>
              </div>
              <Progress value={d.overallRetentionRate || 0} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span>30-Day</span>
                <span className="font-medium">
                  {retentionByPeriod.thirtyDay?.retained || 0}/{retentionByPeriod.thirtyDay?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span>90-Day</span>
                <span className="font-medium">
                  {retentionByPeriod.ninetyDay?.retained || 0}/{retentionByPeriod.ninetyDay?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span>6-Month</span>
                <span className="font-medium">
                  {retentionByPeriod.sixMonth?.retained || 0}/{retentionByPeriod.sixMonth?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span>12-Month</span>
                <span className="font-medium">
                  {retentionByPeriod.twelveMonth?.retained || 0}/{retentionByPeriod.twelveMonth?.total || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 mb-6" data-testid="card-job-readiness">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Job Readiness Checklist
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {readinessComplete} of {readinessItems.length} items complete ({readinessPercentage}%)
        </p>
        <Progress value={readinessPercentage} className="h-2 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {readinessItems.map(item => {
            const checked = readiness?.[item.key] || false;
            const ItemIcon = item.icon;
            return (
              <div
                key={item.key}
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${checked ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/30 hover:bg-muted/50"}`}
                onClick={() => toggleReadiness(item.key)}
                data-testid={`readiness-${item.key}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${checked ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"}`}>
                  {checked && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <ItemIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {(placements || []).length > 0 && (
        <Card className="p-5 mb-6" data-testid="card-recent-placements">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Recent Placements
          </h3>
          <div className="space-y-3">
            {(placements || []).slice(0, 5).map((placement) => (
              <div key={placement.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30" data-testid={`placement-${placement.id}`}>
                <div>
                  <p className="text-sm font-medium">{placement.userName}</p>
                  <p className="text-xs text-muted-foreground">{placement.jobTitle} at {placement.employerName}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className={placement.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}>
                    {placement.status}
                  </Badge>
                  {placement.wage && <p className="text-xs text-muted-foreground mt-1">{placement.wage}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(retentionChecks || []).length > 0 && (
        <Card className="p-5 mb-6" data-testid="card-recent-retention">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Recent Retention Check-Ins
          </h3>
          <div className="space-y-3">
            {(retentionChecks || []).slice(0, 5).map((check) => {
              const placement = (placements || []).find(p => p.id === check.placementId);
              return (
                <div key={check.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30" data-testid={`retention-${check.id}`}>
                  <div>
                    <p className="text-sm font-medium">{placement?.userName || "Participant"} — {check.checkPeriodDays}-Day Check</p>
                    <p className="text-xs text-muted-foreground">{placement?.jobTitle || "N/A"} at {placement?.employerName || "N/A"}</p>
                  </div>
                  <Badge variant="secondary" className={check.employmentStatus === "employed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}>
                    {check.employmentStatus}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-5 mb-6 border-blue-200 dark:border-blue-800/50" data-testid="card-grant-compliance">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Grant Compliance Summary (WIOA/DOL/DOJ)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Participants Assessed</p>
            <p className="font-bold text-lg">{d.totalAssessments || 0}</p>
          </div>
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Training Completion</p>
            <p className="font-bold text-lg">{d.trainingCompletionRate || 0}%</p>
          </div>
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Employment Rate</p>
            <p className="font-bold text-lg">
              {d.totalAssessments > 0 ? Math.round(((d.activePlacements || 0) / (d.totalAssessments || 1)) * 100) : 0}%
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Retention Rate</p>
            <p className="font-bold text-lg">{d.overallRetentionRate || 0}%</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/workforce-assessment">
          <Button variant="outline" data-testid="button-go-assessment">
            <ClipboardCheck className="h-4 w-4 mr-2" /> Workforce Assessment
          </Button>
        </Link>
        <Link href="/workforce-training">
          <Button variant="outline" data-testid="button-go-training">
            <GraduationCap className="h-4 w-4 mr-2" /> Training Programs
          </Button>
        </Link>
        <Link href="/workforce-employers">
          <Button variant="outline" data-testid="button-go-employers">
            <Building2 className="h-4 w-4 mr-2" /> Employer Partners
          </Button>
        </Link>
      </div>

      <Dialog open={showPlacementForm} onOpenChange={setShowPlacementForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Job Placement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" data-testid="form-placement">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Participant User ID</label>
                <Input value={placementForm.userId} onChange={(e) => setPlacementForm(f => ({ ...f, userId: e.target.value }))} placeholder="User ID" data-testid="input-placement-userId" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Participant Name</label>
                <Input value={placementForm.userName} onChange={(e) => setPlacementForm(f => ({ ...f, userName: e.target.value }))} placeholder="Full name" data-testid="input-placement-userName" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Employer</label>
              <Select value={placementForm.employerId} onValueChange={(v) => { const emp = (employers || []).find(e => e.id === v); setPlacementForm(f => ({ ...f, employerId: v, employerName: emp?.companyName || "" })); }}>
                <SelectTrigger data-testid="select-placement-employer"><SelectValue placeholder="Select employer" /></SelectTrigger>
                <SelectContent>
                  {(employers || []).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Job Title</label>
              <Input value={placementForm.jobTitle} onChange={(e) => setPlacementForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="Job title" data-testid="input-placement-jobTitle" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <Input type="date" value={placementForm.startDate} onChange={(e) => setPlacementForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-placement-startDate" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Wage</label>
                <Input value={placementForm.wage} onChange={(e) => setPlacementForm(f => ({ ...f, wage: e.target.value }))} placeholder="e.g., $15/hr" data-testid="input-placement-wage" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hours/Week</label>
                <Input type="number" value={placementForm.hoursPerWeek} onChange={(e) => setPlacementForm(f => ({ ...f, hoursPerWeek: e.target.value }))} placeholder="40" data-testid="input-placement-hours" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Placement Source</label>
                <Input value={placementForm.placementSource} onChange={(e) => setPlacementForm(f => ({ ...f, placementSource: e.target.value }))} placeholder="e.g., Job Fair, Referral" data-testid="input-placement-source" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Benefits</label>
              <Input value={placementForm.benefits} onChange={(e) => setPlacementForm(f => ({ ...f, benefits: e.target.value }))} placeholder="e.g., Health insurance, PTO" data-testid="input-placement-benefits" />
            </div>
            <Button
              onClick={handlePlacementSubmit}
              disabled={!placementForm.userId || !placementForm.userName || !placementForm.employerId || !placementForm.jobTitle || !placementForm.startDate || placementMutation.isPending}
              className="w-full"
              data-testid="button-submit-placement"
            >
              {placementMutation.isPending ? "Saving..." : "Record Placement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRetentionForm} onOpenChange={setShowRetentionForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Retention Check-In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" data-testid="form-retention">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Placement</label>
              <Select value={retentionForm.placementId} onValueChange={(v) => { const p = (placements || []).find(pl => pl.id === v); setRetentionForm(f => ({ ...f, placementId: v, userId: p?.userId || "" })); }}>
                <SelectTrigger data-testid="select-retention-placement"><SelectValue placeholder="Select placement" /></SelectTrigger>
                <SelectContent>
                  {(placements || []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.userName} — {p.jobTitle} at {p.employerName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Check-In Period</label>
                <Select value={retentionForm.checkPeriodDays} onValueChange={(v) => setRetentionForm(f => ({ ...f, checkPeriodDays: v }))}>
                  <SelectTrigger data-testid="select-retention-period"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30-Day</SelectItem>
                    <SelectItem value="90">90-Day</SelectItem>
                    <SelectItem value="180">180-Day (6 Month)</SelectItem>
                    <SelectItem value="365">365-Day (12 Month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Employment Status</label>
                <Select value={retentionForm.employmentStatus} onValueChange={(v) => setRetentionForm(f => ({ ...f, employmentStatus: v }))}>
                  <SelectTrigger data-testid="select-retention-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="promoted">Promoted</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                    <SelectItem value="new_position">New Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Current Wage</label>
                <Input value={retentionForm.currentWage} onChange={(e) => setRetentionForm(f => ({ ...f, currentWage: e.target.value }))} placeholder="e.g., $17/hr" data-testid="input-retention-wage" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Wage Change</label>
                <Input value={retentionForm.wageChange} onChange={(e) => setRetentionForm(f => ({ ...f, wageChange: e.target.value }))} placeholder="e.g., +$2/hr" data-testid="input-retention-wageChange" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Satisfaction (1-5)</label>
                <Input type="number" min="1" max="5" value={retentionForm.satisfactionRating} onChange={(e) => setRetentionForm(f => ({ ...f, satisfactionRating: e.target.value }))} placeholder="1-5" data-testid="input-retention-satisfaction" />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={retentionForm.promoted} onChange={(e) => setRetentionForm(f => ({ ...f, promoted: e.target.checked }))} data-testid="input-retention-promoted" />
                  <span className="text-sm">Promoted</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea value={retentionForm.notes} onChange={(e) => setRetentionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes about this check-in..." rows={3} data-testid="input-retention-notes" />
            </div>
            <Button
              onClick={handleRetentionSubmit}
              disabled={!retentionForm.placementId || retentionMutation.isPending}
              className="w-full"
              data-testid="button-submit-retention"
            >
              {retentionMutation.isPending ? "Saving..." : "Record Check-In"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
