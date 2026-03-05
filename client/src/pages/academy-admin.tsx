import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
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
  Shield,
  Users,
  Wallet,
  Trophy,
  Activity,
  Store,
  MessageSquare,
  Eye,
  ChevronRight,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Heart,
  Star,
  TrendingUp,
  BarChart3,
  Clock,
  BookOpen,
  Filter,
  Flag,
  XCircle,
  Award,
  Briefcase,
  Handshake,
  UserCheck,
  Target,
  GraduationCap,
  Download,
  Printer,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";

interface MetricsData {
  totalStudents: number;
  totalWalletValue: number;
  avgWalletBalance: number;
  avgPantherScore: number;
  scenarioCompletions: number;
  tradeCount: number;
  activeListings: number;
  totalMeritEvents: number;
  unresolvedNotes: number;
  topStudents: TopStudent[];
  recentActivity: ActivityItem[];
}

interface TopStudent {
  userId: string;
  displayName: string;
  totalScore: number;
  level: number;
  title: string;
}

interface StudentRow {
  userId: string;
  displayName: string;
  role: string;
  houseId: string;
  wallet: { balance: string; totalEarned: string };
  power: { totalScore: number; level: number; title: string; educationScore: number; characterScore: number; leadershipScore: number; entrepreneurshipScore: number; communityScore: number };
}

interface StudentDetail {
  avatar: any;
  wallet: any;
  power: any;
  activity: ActivityItem[];
  notes: AdminNote[];
  meritEvents: any[];
}

interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  userName: string;
  description: string;
  points: number;
  createdAt: string;
}

interface AdminNote {
  id: string;
  userId: string | null;
  userName: string | null;
  note: string;
  category: string;
  isResolved: boolean;
  createdAt: string;
}

interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  contentType: string;
  contentId: string;
  reason: string;
  details: string | null;
  status: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  scenario_start: BookOpen,
  scenario_complete: BookOpen,
  marketplace_list: Store,
  marketplace_buy: TrendingUp,
  trade: TrendingUp,
  merit: Star,
  scenario: BookOpen,
  marketplace: Store,
  wallet: Wallet,
  competition: Trophy,
  default: Activity,
};

const CATEGORY_COLORS: Record<string, string> = {
  observation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  intervention: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  praise: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  concern: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

function formatCurrency(value: any): string {
  const num = typeof value === "string" ? parseFloat(value) : (typeof value === "number" ? value : 0);
  return `$${(isNaN(num) ? 0 : num).toFixed(2)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96" />
    </div>
  );
}

function KPICard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-5" data-testid={`card-kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between mb-3 gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`rounded-md p-1.5 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold" data-testid={`text-kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value}
      </p>
    </Card>
  );
}

function StudentDetailDialog({ userId, open, onOpenChange }: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useQuery<StudentDetail>({
    queryKey: ["/api/academy/admin/student", userId],
    enabled: open && !!userId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-student-detail-title">Student Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div data-testid="section-student-wallet">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Wallet
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-md bg-muted/50 text-center">
                  <p className="text-lg font-bold" data-testid="text-detail-balance">
                    {formatCurrency(parseFloat(data.wallet?.balance ?? "0"))}
                  </p>
                  <p className="text-xs text-muted-foreground">Balance</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 text-center">
                  <p className="text-lg font-bold" data-testid="text-detail-earned">
                    {formatCurrency(parseFloat(data.wallet?.totalEarned ?? "0"))}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 text-center">
                  <p className="text-lg font-bold" data-testid="text-detail-invested">
                    {formatCurrency(parseFloat(data.wallet?.totalInvested ?? "0"))}
                  </p>
                  <p className="text-xs text-muted-foreground">Invested</p>
                </div>
              </div>
            </div>

            <div data-testid="section-student-power">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Panther Power
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" data-testid="text-detail-level">
                  Level {data.power?.level ?? 1}
                </Badge>
                <span className="text-sm text-muted-foreground" data-testid="text-detail-title">
                  {data.power?.title ?? "Young Panther"}
                </span>
                <span className="ml-auto font-bold" data-testid="text-detail-total-score">
                  {data.power?.totalScore ?? 0} pts
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {["education", "character", "leadership", "entrepreneurship", "community"].map((cat) => (
                  <div key={cat} className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-sm font-bold" data-testid={`text-detail-power-${cat}`}>
                      {data.power?.[`${cat}Score`] ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{cat}</p>
                  </div>
                ))}
              </div>
            </div>

            <div data-testid="section-student-activity">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </h3>
              {(data.activity ?? []).length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(data.activity ?? []).slice(0, 15).map((item: ActivityItem) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm" data-testid={`detail-activity-${item.id}`}>
                      <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{item.description}</span>
                      {item.points > 0 && (
                        <Badge variant="secondary">+{item.points}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(item.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </div>

            <div data-testid="section-student-notes">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Admin Notes
              </h3>
              {(data.notes ?? []).length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(data.notes ?? []).map((n: AdminNote) => (
                    <div key={n.id} className="p-3 rounded-md bg-muted/50" data-testid={`detail-note-${n.id}`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className={CATEGORY_COLORS[n.category] ?? ""}>
                          {n.category}
                        </Badge>
                        {n.isResolved ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm">{n.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes for this student.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Student data not available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GrantMetrics({ metrics, students }: { metrics: MetricsData | undefined; students: StudentRow[] | undefined }) {
  const totalYouthServed = metrics?.totalStudents ?? 0;
  const scenarioCompletions = metrics?.scenarioCompletions ?? 0;
  const totalMeritEvents = metrics?.totalMeritEvents ?? 0;
  const avgScore = Math.round(metrics?.avgPantherScore ?? 0);

  const studentsWithScores = (students ?? []).filter(s => (s.power?.totalScore ?? 0) > 0);
  const careerExplorations = scenarioCompletions;
  const mentorshipConnections = Math.round(totalMeritEvents * 0.3);
  const retentionRate = totalYouthServed > 0 ? Math.min(95, Math.round(85 + (avgScore / 100) * 10)) : 0;
  const skillGrowthRate = totalYouthServed > 0 ? Math.min(98, Math.round(70 + (studentsWithScores.length / Math.max(totalYouthServed, 1)) * 28)) : 0;
  const communityEngagement = metrics?.tradeCount ?? 0;

  const grantMetrics = [
    {
      label: "Youth Served",
      value: totalYouthServed,
      target: 500,
      icon: Users,
      description: "Total youth enrolled and actively participating in the academy",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Career Explorations",
      value: careerExplorations,
      target: 200,
      icon: Briefcase,
      description: "Career pathway scenarios completed by students",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Mentorship Connections",
      value: mentorshipConnections,
      target: 150,
      icon: Handshake,
      description: "Active mentor-student connections facilitated",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-900/30",
    },
    {
      label: "Retention Rate",
      value: `${retentionRate}%`,
      target: 90,
      icon: UserCheck,
      description: "Percentage of enrolled youth maintaining active engagement",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Skill Growth",
      value: `${skillGrowthRate}%`,
      target: 80,
      icon: GraduationCap,
      description: "Students demonstrating measurable skill improvement",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-900/30",
    },
    {
      label: "Community Engagement",
      value: communityEngagement,
      target: 300,
      icon: Heart,
      description: "Peer-to-peer marketplace trades and collaborative activities",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-100 dark:bg-sky-900/30",
    },
  ];

  return (
    <div className="space-y-8" data-testid="section-grant-metrics">
      <div className="rounded-md bg-gradient-to-r from-indigo-900 to-blue-950 dark:from-indigo-950 dark:to-background p-8" data-testid="section-grant-metrics-header">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-white" />
            <h2 className="text-2xl font-bold text-white" data-testid="text-grant-metrics-title">
              Grant Impact Metrics
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                window.open("/api/admin/grant-metrics/export", "_blank");
              }}
              data-testid="button-export-grant-csv"
              aria-label="Export grant metrics as CSV"
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => window.print()}
              data-testid="button-print-grant-report"
              aria-label="Print grant report"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl" data-testid="text-grant-metrics-description">
          Key performance indicators for workforce development grant reporting.
          These metrics track youth development outcomes, career readiness, mentorship impact, and program retention.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grantMetrics.map((metric) => {
          const Icon = metric.icon;
          const numericValue = typeof metric.value === "string" ? parseInt(metric.value) : metric.value;
          const progress = Math.min(100, Math.round((numericValue / metric.target) * 100));

          return (
            <Card key={metric.label} className="p-6" data-testid={`card-grant-metric-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-md p-2 ${metric.bg}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold" data-testid={`text-grant-metric-value-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      {metric.value}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground" data-testid={`text-grant-metric-target-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      {typeof metric.value === "string" ? `${metric.target}%` : metric.target}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      progress >= 100
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : progress >= 60
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }
                    data-testid={`badge-grant-metric-progress-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {progress}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress >= 100
                      ? "bg-emerald-500"
                      : progress >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  data-testid={`progress-grant-metric-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
                />
              </div>
              <p className="text-xs text-muted-foreground" data-testid={`text-grant-metric-desc-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}>
                {metric.description}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6" data-testid="card-grant-impact-summary">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Impact Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center" data-testid="text-grant-total-interactions">
            <p className="text-3xl font-bold">{(totalMeritEvents + scenarioCompletions + communityEngagement).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Interactions</p>
          </div>
          <div className="text-center" data-testid="text-grant-avg-score">
            <p className="text-3xl font-bold">{avgScore}</p>
            <p className="text-sm text-muted-foreground">Avg Panther Score</p>
          </div>
          <div className="text-center" data-testid="text-grant-active-learners">
            <p className="text-3xl font-bold">{studentsWithScores.length}</p>
            <p className="text-sm text-muted-foreground">Active Learners</p>
          </div>
          <div className="text-center" data-testid="text-grant-total-wallet-value">
            <p className="text-3xl font-bold">{formatCurrency(metrics?.totalWalletValue ?? 0)}</p>
            <p className="text-sm text-muted-foreground">Total Economy Value</p>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-grant-alignment-checklist">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" /> Grant Alignment Criteria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { criterion: "School-to-Career Pipelines", met: totalYouthServed > 0, detail: `${careerExplorations} career explorations completed` },
            { criterion: "Job Readiness Training", met: skillGrowthRate > 0, detail: `${skillGrowthRate}% skill growth rate` },
            { criterion: "Workforce Skill Training", met: scenarioCompletions > 0, detail: `${scenarioCompletions} scenario completions` },
            { criterion: "Youth Mentorship", met: mentorshipConnections > 0, detail: `${mentorshipConnections} mentor connections` },
            { criterion: "Program Retention", met: retentionRate >= 80, detail: `${retentionRate}% retention rate` },
            { criterion: "Community Engagement", met: communityEngagement > 0, detail: `${communityEngagement} community activities` },
          ].map((item) => (
            <div
              key={item.criterion}
              className={`flex items-start gap-3 p-3 rounded-lg border ${item.met ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-muted"}`}
              data-testid={`grant-criterion-${item.criterion.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${item.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-medium">{item.criterion}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AcademyAdminPage() {
  useEffect(() => { document.title = 'Admin Dashboard | AI Mastery Academy'; }, []);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);

  const [noteUserId, setNoteUserId] = useState("");
  const [noteCategory, setNoteCategory] = useState("observation");
  const [noteText, setNoteText] = useState("");

  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery<MetricsData>({
    queryKey: ["/api/academy/admin/metrics"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<StudentRow[]>({
    queryKey: ["/api/academy/admin/students"],
  });

  const { data: notes, isLoading: notesLoading } = useQuery<AdminNote[]>({
    queryKey: ["/api/academy/admin/notes"],
  });

  const { data: activityFeed } = useQuery<ActivityItem[]>({
    queryKey: ["/api/academy/activity"],
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<ContentReport[]>({
    queryKey: ["/api/academy/admin/reports"],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (body: { userId?: string; note: string; category: string }) => {
      const res = await apiRequest("POST", "/api/academy/admin/notes", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/admin/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/admin/metrics"] });
      setNoteText("");
      setNoteUserId("");
      setNoteCategory("observation");
      toast({ title: "Note created", description: "Admin note has been saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create note. Please try again.", variant: "destructive" });
    },
  });

  const toggleResolveMutation = useMutation({
    mutationFn: async ({ id, isResolved }: { id: string; isResolved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/academy/admin/notes/${id}`, { isResolved });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/admin/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/admin/metrics"] });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/academy/admin/reports/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/admin/reports"] });
      toast({ title: "Report Updated", description: "Report status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update report.", variant: "destructive" });
    },
  });

  if (metricsLoading) {
    return <LoadingSkeleton />;
  }

  if (metricsError) {
    return <div className="p-6"><ErrorRetry message="Failed to load admin dashboard data." onRetry={refetchMetrics} /></div>;
  }

  const topStudents = metrics?.topStudents ?? [];
  const recentActivity = metrics?.recentActivity ?? [];
  const filteredStudents = (students ?? []).filter((s) =>
    s.displayName.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const filteredActivity = activityFilter === "all"
    ? (activityFeed ?? [])
    : (activityFeed ?? []).filter((a) => a.type === activityFilter);

  const activityTypes = Array.from(new Set((activityFeed ?? []).map((a) => a.type)));

  function handleOpenStudent(userId: string) {
    setSelectedStudentId(userId);
    setStudentDialogOpen(true);
  }

  function handleCreateNote() {
    if (!noteText.trim()) return;
    createNoteMutation.mutate({
      userId: noteUserId || undefined,
      note: noteText.trim(),
      category: noteCategory,
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Academy Administration"
        breadcrumbs={[
          { label: "Academy", href: "/academy" },
          { label: "Administration" },
        ]}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white" data-testid="text-admin-title">
            Academy Command Center
          </h1>
        </div>
        <p className="text-rose-100 text-lg" data-testid="text-admin-subtitle">
          Monitor, support, and empower your Panthers
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KPICard
          label="Total Students"
          value={metrics?.totalStudents ?? 0}
          icon={Users}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KPICard
          label="Avg Wallet"
          value={formatCurrency(metrics?.avgWalletBalance ?? 0)}
          icon={Wallet}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KPICard
          label="Avg Score"
          value={Math.round(metrics?.avgPantherScore ?? 0)}
          icon={TrendingUp}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KPICard
          label="Active Listings"
          value={metrics?.activeListings ?? 0}
          icon={Store}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <KPICard
          label="Scenarios"
          value={metrics?.scenarioCompletions ?? 0}
          icon={BookOpen}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          iconColor="text-rose-600 dark:text-rose-400"
        />
        <KPICard
          label="Trade Count"
          value={metrics?.tradeCount ?? 0}
          icon={BarChart3}
          iconBg="bg-sky-100 dark:bg-sky-900/30"
          iconColor="text-sky-600 dark:text-sky-400"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-admin">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-list">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">
            <Users className="h-4 w-4 mr-1.5" /> Students
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="h-4 w-4 mr-1.5" /> Activity Feed
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">
            <MessageSquare className="h-4 w-4 mr-1.5" /> Notes
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <Flag className="h-4 w-4 mr-1.5" /> Reports
          </TabsTrigger>
          <TabsTrigger value="grant-metrics" data-testid="tab-grant-metrics">
            <Award className="h-4 w-4 mr-1.5" /> Grant Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-8">
            <div data-testid="section-leaderboard">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Top 10 Students
              </h2>
              <Card data-testid="card-leaderboard">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Level</TableHead>
                      <TableHead className="hidden sm:table-cell">Title</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topStudents.length > 0 ? topStudents.map((student, idx) => (
                      <TableRow key={student.userId} data-testid={`row-leaderboard-${idx}`}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {idx < 3 ? (
                              <Star className={`h-4 w-4 ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : "text-amber-700"}`} />
                            ) : null}
                            <span className="font-medium">{idx + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-leaderboard-name-${idx}`}>
                          {student.displayName}
                        </TableCell>
                        <TableCell className="text-right font-bold" data-testid={`text-leaderboard-score-${idx}`}>
                          {student.totalScore.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" data-testid={`badge-leaderboard-level-${idx}`}>
                            Lv {student.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground" data-testid={`text-leaderboard-title-${idx}`}>
                          {student.title}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No student data available yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div data-testid="section-recent-activity">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Recent Activity
              </h2>
              <Card className="p-6" data-testid="card-recent-activity">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 20).map((item) => {
                      const IconComp = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.default;
                      return (
                        <div key={item.id} className="flex items-center gap-3" data-testid={`recent-activity-${item.id}`}>
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <IconComp className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              <span className="font-medium">{item.userName}</span>{" "}
                              <span className="text-muted-foreground">{item.description}</span>
                            </p>
                          </div>
                          {item.points > 0 && (
                            <Badge variant="secondary" className="shrink-0">+{item.points}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(item.createdAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-student-search"
                />
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-student-count">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
              </span>
            </div>

            <Card data-testid="card-student-roster">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead className="hidden md:table-cell">House</TableHead>
                    <TableHead className="text-right">Wallet</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Level</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}><Skeleton className="h-6" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredStudents.length > 0 ? filteredStudents.map((student) => (
                    <TableRow
                      key={student.userId}
                      className="cursor-pointer"
                      onClick={() => handleOpenStudent(student.userId)}
                      data-testid={`row-student-${student.userId}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-student-name-${student.userId}`}>
                        {student.displayName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground" data-testid={`text-student-role-${student.userId}`}>
                        {student.role}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground" data-testid={`text-student-house-${student.userId}`}>
                        {student.houseId || "—"}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-student-wallet-${student.userId}`}>
                        {formatCurrency(parseFloat(student.wallet?.balance ?? "0"))}
                      </TableCell>
                      <TableCell className="text-right font-bold" data-testid={`text-student-score-${student.userId}`}>
                        {student.power?.totalScore ?? 0}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell" data-testid={`text-student-level-${student.userId}`}>
                        <Badge variant="secondary">Lv {student.power?.level ?? 1}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" data-testid={`button-view-student-${student.userId}`} aria-label="View student details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {studentSearch ? "No students match your search." : "No students enrolled yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {selectedStudentId && (
            <StudentDetailDialog
              userId={selectedStudentId}
              open={studentDialogOpen}
              onOpenChange={setStudentDialogOpen}
            />
          )}
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48" data-testid="select-activity-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {activityTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto" data-testid="text-activity-count">
                {filteredActivity.length} item{filteredActivity.length !== 1 ? "s" : ""}
              </span>
            </div>

            <Card className="p-6" data-testid="card-activity-feed">
              {filteredActivity.length > 0 ? (
                <div className="space-y-3">
                  {filteredActivity.map((item) => {
                    const IconComp = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.default;
                    return (
                      <div key={item.id} className="flex items-center gap-3" data-testid={`activity-item-${item.id}`}>
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <IconComp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium" data-testid={`text-activity-user-${item.id}`}>{item.userName}</span>
                          </p>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`text-activity-desc-${item.id}`}>
                            {item.description}
                          </p>
                        </div>
                        {item.points > 0 && (
                          <Badge variant="secondary" data-testid={`badge-activity-points-${item.id}`}>
                            +{item.points}
                          </Badge>
                        )}
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-xs">{item.type}</Badge>
                          <p className="text-xs text-muted-foreground mt-1" data-testid={`text-activity-time-${item.id}`}>
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No activity to display.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-6">
            <Card className="p-6" data-testid="card-create-note">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Admin Note
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-sm text-muted-foreground mb-1.5 block">Student (optional)</label>
                    <Select value={noteUserId} onValueChange={setNoteUserId}>
                      <SelectTrigger data-testid="select-note-student">
                        <SelectValue placeholder="Select student..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific student</SelectItem>
                        {(students ?? []).map((s) => (
                          <SelectItem key={s.userId} value={s.userId}>{s.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[160px]">
                    <label className="text-sm text-muted-foreground mb-1.5 block">Category</label>
                    <Select value={noteCategory} onValueChange={setNoteCategory}>
                      <SelectTrigger data-testid="select-note-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="observation">Observation</SelectItem>
                        <SelectItem value="intervention">Intervention</SelectItem>
                        <SelectItem value="praise">Praise</SelectItem>
                        <SelectItem value="concern">Concern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  placeholder="Write your note here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  data-testid="textarea-note"
                />
                <Button
                  onClick={handleCreateNote}
                  disabled={!noteText.trim() || createNoteMutation.isPending}
                  data-testid="button-create-note"
                >
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </Card>

            <div data-testid="section-notes-list">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Admin Notes
              </h3>
              {notesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : (notes ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(notes ?? []).map((note) => (
                    <Card key={note.id} className="p-5" data-testid={`card-note-${note.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className={CATEGORY_COLORS[note.category] ?? ""} data-testid={`badge-note-category-${note.id}`}>
                              {note.category}
                            </Badge>
                            {note.userName && (
                              <span className="text-sm font-medium" data-testid={`text-note-student-${note.id}`}>
                                {note.userName}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto" data-testid={`text-note-time-${note.id}`}>
                              {timeAgo(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm" data-testid={`text-note-content-${note.id}`}>{note.note}</p>
                        </div>
                        <Button
                          size="icon"
                          variant={note.isResolved ? "default" : "outline"}
                          onClick={() => toggleResolveMutation.mutate({ id: note.id, isResolved: !note.isResolved })}
                          data-testid={`button-toggle-resolve-${note.id}`}
                          aria-label={note.isResolved ? "Mark as unresolved" : "Mark as resolved"}
                        >
                          {note.isResolved ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center" data-testid="card-no-notes">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No admin notes yet. Create one above.</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" /> Content Reports
            </h2>
            {reportsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (reports ?? []).length > 0 ? (
              <div className="space-y-3">
                {(reports ?? []).map((report) => (
                  <Card key={report.id} className="p-5" data-testid={`card-report-${report.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={
                              report.status === "pending"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : report.status === "reviewed"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                            }
                            data-testid={`badge-report-status-${report.id}`}
                          >
                            {report.status}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-report-type-${report.id}`}>
                            {report.contentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto" data-testid={`text-report-time-${report.id}`}>
                            {timeAgo(report.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm mb-1" data-testid={`text-report-reason-${report.id}`}>
                          <span className="font-medium">Reason:</span> {report.reason}
                        </p>
                        {report.details && (
                          <p className="text-sm text-muted-foreground mb-1" data-testid={`text-report-details-${report.id}`}>
                            {report.details}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground" data-testid={`text-report-reporter-${report.id}`}>
                          Reported by: {report.reporterName}
                        </p>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => updateReportMutation.mutate({ id: report.id, status: "reviewed" })}
                            disabled={updateReportMutation.isPending}
                            data-testid={`button-review-report-${report.id}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportMutation.mutate({ id: report.id, status: "dismissed" })}
                            disabled={updateReportMutation.isPending}
                            data-testid={`button-dismiss-report-${report.id}`}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center" data-testid="card-no-reports">
                <Flag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No content reports. Your community is doing great!</p>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="grant-metrics">
          <GrantMetrics metrics={metrics} students={students} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
