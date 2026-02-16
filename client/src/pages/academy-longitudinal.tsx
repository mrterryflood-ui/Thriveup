import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  FileEdit,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Award,
  Star,
  Shield,
  TrendingUp,
  Building2,
  Wrench,
  Rocket,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LongitudinalMetrics {
  activePlans: number;
  graduatedPlans: number;
  pendingRevisions: number;
  pendingMentorRequests: number;
  activeMentorships: number;
  totalAlumni: number;
  ambassadors: number;
  champions: number;
  totalCareers: number;
  totalMilestones: number;
  careerInterests: Record<string, number>;
  pathDistribution: Record<string, number>;
}

interface PathwayPlan {
  id: string;
  studentName: string;
  currentGrade: number;
  primaryCareerInterest: string;
  educationPathType: string;
  status: string;
  revisionsThisYear: number;
  advisorName: string;
}

interface PendingRevision {
  id: string;
  studentName: string;
  studentGrade: number;
  reason: string;
  previousCareerInterest: string;
  requestedChanges: string;
  createdAt: string;
}

interface MentorRequest {
  id: string;
  studentName: string;
  mentorName: string;
  careerField: string;
  message: string;
  status: string;
  createdAt: string;
}

interface AlumniRecord {
  id: string;
  name: string;
  graduationYear: number;
  currentRole: string;
  careerField: string;
  educationPath: string;
  isAmbassador: boolean;
  isChampion: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  graduated: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  alumni: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

const MENTOR_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  declined: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const PATH_ICONS: Record<string, typeof Building2> = {
  college: Building2,
  trade: Wrench,
  tech: Rocket,
  military: Shield,
  entrepreneurship: TrendingUp,
};

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96" />
    </div>
  );
}

function KPICard({ label, value, secondary, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  secondary?: string;
  icon: typeof Target;
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
      {secondary && (
        <p className="text-xs text-muted-foreground mt-1">{secondary}</p>
      )}
    </Card>
  );
}

function DistributionBar({ label, count, total, color }: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3" data-testid={`bar-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <span className="text-sm w-32 truncate capitalize">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground w-12 text-right">{pct}%</span>
      <span className="text-xs text-muted-foreground w-8 text-right">({count})</span>
    </div>
  );
}

function OverviewTab({ metrics }: { metrics: LongitudinalMetrics }) {
  const careerEntries = Object.entries(metrics.careerInterests || {});
  const careerTotal = careerEntries.reduce((sum, [, v]) => sum + v, 0);
  const pathEntries = Object.entries(metrics.pathDistribution || {});
  const pathTotal = pathEntries.reduce((sum, [, v]) => sum + v, 0);

  const careerColors = [
    "bg-rose-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500",
    "bg-violet-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500",
    "bg-orange-500", "bg-cyan-500",
  ];

  const pathColors: Record<string, string> = {
    college: "bg-sky-500",
    trade: "bg-amber-500",
    tech: "bg-violet-500",
    military: "bg-emerald-500",
    entrepreneurship: "bg-rose-500",
  };

  return (
    <div className="space-y-8">
      <div data-testid="section-career-distribution">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-muted-foreground" /> Career Interest Distribution
        </h2>
        <Card className="p-6" data-testid="card-career-distribution">
          {careerEntries.length > 0 ? (
            <div className="space-y-3">
              {careerEntries
                .sort(([, a], [, b]) => b - a)
                .map(([career, count], idx) => (
                  <DistributionBar
                    key={career}
                    label={career}
                    count={count}
                    total={careerTotal}
                    color={careerColors[idx % careerColors.length]}
                  />
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No career interest data available.</p>
          )}
        </Card>
      </div>

      <div data-testid="section-path-distribution">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" /> Education Path Distribution
        </h2>
        <Card className="p-6" data-testid="card-path-distribution">
          {pathEntries.length > 0 ? (
            <div className="space-y-3">
              {pathEntries
                .sort(([, a], [, b]) => b - a)
                .map(([path, count]) => (
                  <DistributionBar
                    key={path}
                    label={path}
                    count={count}
                    total={pathTotal}
                    color={pathColors[path] ?? "bg-gray-500"}
                  />
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No education path data available.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="section-quick-metrics">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2 gap-1">
            <span className="text-sm text-muted-foreground">Active Mentorships</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-active-mentorships">{metrics.activeMentorships}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2 gap-1">
            <span className="text-sm text-muted-foreground">Champions</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-champions">{metrics.champions}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2 gap-1">
            <span className="text-sm text-muted-foreground">Total Milestones</span>
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <Star className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-milestones">{metrics.totalMilestones}</p>
        </Card>
      </div>
    </div>
  );
}

function PathwayPlansTab() {
  const { data: plans, isLoading } = useQuery<PathwayPlan[]>({
    queryKey: ["/api/admin/pathway-plans"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const plansList = plans ?? [];

  if (plansList.length === 0) {
    return (
      <Card className="p-8 text-center" data-testid="empty-plans">
        <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No pathway plans found.</p>
      </Card>
    );
  }

  return (
    <Card data-testid="card-pathway-plans">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Grade</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Career Interest</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Education Path</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-center p-3 font-medium text-muted-foreground hidden md:table-cell">Revisions</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Advisor</th>
            </tr>
          </thead>
          <tbody>
            {plansList.map((plan) => (
              <tr key={plan.id} className="border-b last:border-0" data-testid={`row-plan-${plan.id}`}>
                <td className="p-3 font-medium" data-testid={`text-plan-student-${plan.id}`}>{plan.studentName}</td>
                <td className="p-3 text-muted-foreground">{plan.currentGrade}th</td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{plan.primaryCareerInterest}</span>
                  </div>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 capitalize">
                    {(() => {
                      const PathIcon = PATH_ICONS[plan.educationPathType] ?? Building2;
                      return <PathIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
                    })()}
                    <span>{plan.educationPathType}</span>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className={STATUS_COLORS[plan.status] ?? ""} data-testid={`badge-plan-status-${plan.id}`}>
                    {plan.status}
                  </Badge>
                </td>
                <td className="p-3 text-center hidden md:table-cell" data-testid={`text-plan-revisions-${plan.id}`}>
                  {plan.revisionsThisYear}/3
                </td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{plan.advisorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RevisionQueueTab() {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: revisions, isLoading } = useQuery<PendingRevision[]>({
    queryKey: ["/api/admin/pending-revisions"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/revisions/${id}/approve`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/longitudinal-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pathway-plans"] });
      toast({ title: "Revision Approved", description: "The plan revision has been approved and unlocked." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve revision.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/revisions/${id}/reject`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/longitudinal-metrics"] });
      toast({ title: "Revision Declined", description: "The revision request has been declined." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to decline revision.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  const revisionsList = revisions ?? [];

  if (revisionsList.length === 0) {
    return (
      <Card className="p-8 text-center" data-testid="empty-revisions">
        <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/30 mb-3" />
        <p className="font-medium mb-1">All caught up!</p>
        <p className="text-sm text-muted-foreground">No pending revisions to review.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {revisionsList.map((rev) => (
        <Card key={rev.id} className="p-5" data-testid={`card-revision-${rev.id}`}>
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <p className="font-semibold" data-testid={`text-revision-student-${rev.id}`}>{rev.studentName}</p>
              <p className="text-sm text-muted-foreground">Grade {rev.studentGrade} &middot; {timeAgo(rev.createdAt)}</p>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Pending Review
            </Badge>
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Reason for Revision</p>
            <p className="text-sm text-muted-foreground" data-testid={`text-revision-reason-${rev.id}`}>{rev.reason}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Previous Career Interest</p>
              <p className="text-sm font-medium" data-testid={`text-revision-previous-${rev.id}`}>{rev.previousCareerInterest}</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Requested Changes</p>
              <p className="text-sm font-medium" data-testid={`text-revision-changes-${rev.id}`}>{rev.requestedChanges}</p>
            </div>
          </div>

          <Textarea
            placeholder="Add review notes (optional)..."
            className="mb-3"
            value={reviewNotes[rev.id] ?? ""}
            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [rev.id]: e.target.value }))}
            data-testid={`textarea-revision-notes-${rev.id}`}
          />

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => approveMutation.mutate({ id: rev.id, notes: reviewNotes[rev.id] ?? "" })}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-revision-${rev.id}`}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Approve & Unlock
            </Button>
            <Button
              variant="outline"
              onClick={() => rejectMutation.mutate({ id: rev.id, notes: reviewNotes[rev.id] ?? "" })}
              disabled={rejectMutation.isPending}
              data-testid={`button-decline-revision-${rev.id}`}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Decline
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MentorRequestsTab() {
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<MentorRequest[]>({
    queryKey: ["/api/admin/mentor-requests"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/mentor-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/longitudinal-metrics"] });
      toast({ title: "Request Updated", description: "Mentor request status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update mentor request.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const requestsList = requests ?? [];

  if (requestsList.length === 0) {
    return (
      <Card className="p-8 text-center" data-testid="empty-mentor-requests">
        <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="font-medium mb-1">No Mentor Requests</p>
        <p className="text-sm text-muted-foreground">No mentor requests have been submitted yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requestsList.map((req) => (
        <Card key={req.id} className="p-5" data-testid={`card-mentor-request-${req.id}`}>
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <p className="font-semibold" data-testid={`text-mentor-student-${req.id}`}>{req.studentName}</p>
              <p className="text-sm text-muted-foreground">{timeAgo(req.createdAt)}</p>
            </div>
            <Badge
              variant="secondary"
              className={MENTOR_STATUS_COLORS[req.status] ?? ""}
              data-testid={`badge-mentor-status-${req.id}`}
            >
              {req.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Requested Mentor</p>
              <p className="text-sm font-medium" data-testid={`text-mentor-name-${req.id}`}>{req.mentorName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Career Field</p>
              <p className="text-sm font-medium" data-testid={`text-mentor-field-${req.id}`}>{req.careerField}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-mentor-message-${req.id}`}>{req.message}</p>
            </div>
          </div>

          {req.status === "pending" && (
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={() => updateMutation.mutate({ id: req.id, status: "approved" })}
                disabled={updateMutation.isPending}
                data-testid={`button-approve-mentor-${req.id}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => updateMutation.mutate({ id: req.id, status: "declined" })}
                disabled={updateMutation.isPending}
                data-testid={`button-decline-mentor-${req.id}`}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Decline
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function AlumniTab() {
  const { toast } = useToast();

  const { data: alumni, isLoading } = useQuery<AlumniRecord[]>({
    queryKey: ["/api/alumni"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/alumni/${id}`, { [field]: value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alumni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/longitudinal-metrics"] });
      toast({ title: "Alumni Updated", description: "Alumni record has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update alumni record.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  const alumniList = alumni ?? [];

  if (alumniList.length === 0) {
    return (
      <Card className="p-8 text-center" data-testid="empty-alumni">
        <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="font-medium mb-1">No Alumni Yet</p>
        <p className="text-sm text-muted-foreground">Alumni will appear here once students graduate from the program.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {alumniList.map((alum) => {
        const PathIcon = PATH_ICONS[alum.educationPath] ?? Building2;
        return (
          <Card key={alum.id} className="p-5" data-testid={`card-alumni-${alum.id}`}>
            <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
              <div>
                <p className="font-semibold" data-testid={`text-alumni-name-${alum.id}`}>{alum.name}</p>
                <p className="text-sm text-muted-foreground">Class of {alum.graduationYear}</p>
              </div>
              <GraduationCap className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm" data-testid={`text-alumni-role-${alum.id}`}>{alum.currentRole}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{alum.careerField}</span>
              </div>
              <div className="flex items-center gap-2">
                <PathIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground capitalize">{alum.educationPath}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {alum.isChampion && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" data-testid={`badge-champion-${alum.id}`}>
                  <Award className="h-3 w-3 mr-1" /> Champion
                </Badge>
              )}
              {alum.isAmbassador && (
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" data-testid={`badge-ambassador-${alum.id}`}>
                  <Star className="h-3 w-3 mr-1" /> Ambassador
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={alum.isAmbassador ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMutation.mutate({ id: alum.id, field: "isAmbassador", value: !alum.isAmbassador })}
                disabled={toggleMutation.isPending}
                data-testid={`button-toggle-ambassador-${alum.id}`}
              >
                <Star className="h-3.5 w-3.5 mr-1" />
                {alum.isAmbassador ? "Ambassador" : "Set Ambassador"}
              </Button>
              <Button
                variant={alum.isChampion ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMutation.mutate({ id: alum.id, field: "isChampion", value: !alum.isChampion })}
                disabled={toggleMutation.isPending}
                data-testid={`button-toggle-champion-${alum.id}`}
              >
                <Award className="h-3.5 w-3.5 mr-1" />
                {alum.isChampion ? "Champion" : "Set Champion"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function AcademyLongitudinalPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: metrics, isLoading: metricsLoading } = useQuery<LongitudinalMetrics>({
    queryKey: ["/api/admin/longitudinal-metrics"],
  });

  if (metricsLoading) {
    return <LoadingSkeleton />;
  }

  const m = metrics ?? {
    activePlans: 0, graduatedPlans: 0, pendingRevisions: 0,
    pendingMentorRequests: 0, activeMentorships: 0,
    totalAlumni: 0, ambassadors: 0, champions: 0,
    totalCareers: 0, totalMilestones: 0,
    careerInterests: {}, pathDistribution: {},
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="academy-longitudinal-page">
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white" data-testid="text-longitudinal-title">
            Longitudinal Dashboard
          </h1>
        </div>
        <p className="text-rose-100 text-lg" data-testid="text-longitudinal-subtitle">
          Track Every Panther's Journey from 6th Grade to Their Future
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Active Plans"
          value={m.activePlans}
          icon={Target}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KPICard
          label="Pending Reviews"
          value={m.pendingRevisions}
          icon={FileEdit}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KPICard
          label="Mentor Requests"
          value={m.pendingMentorRequests}
          icon={Users}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          iconColor="text-rose-600 dark:text-rose-400"
        />
        <KPICard
          label="Alumni & Ambassadors"
          value={m.totalAlumni}
          secondary={`${m.ambassadors} ambassador${m.ambassadors !== 1 ? "s" : ""}`}
          icon={GraduationCap}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-longitudinal">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-list">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <TrendingUp className="h-4 w-4 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">
            <Target className="h-4 w-4 mr-1.5" /> Pathway Plans
          </TabsTrigger>
          <TabsTrigger value="revisions" data-testid="tab-revisions">
            <FileEdit className="h-4 w-4 mr-1.5" /> Revision Queue
          </TabsTrigger>
          <TabsTrigger value="mentors" data-testid="tab-mentors">
            <Users className="h-4 w-4 mr-1.5" /> Mentor Requests
          </TabsTrigger>
          <TabsTrigger value="alumni" data-testid="tab-alumni">
            <GraduationCap className="h-4 w-4 mr-1.5" /> Alumni
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab metrics={m} />
        </TabsContent>

        <TabsContent value="plans">
          <PathwayPlansTab />
        </TabsContent>

        <TabsContent value="revisions">
          <RevisionQueueTab />
        </TabsContent>

        <TabsContent value="mentors">
          <MentorRequestsTab />
        </TabsContent>

        <TabsContent value="alumni">
          <AlumniTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
