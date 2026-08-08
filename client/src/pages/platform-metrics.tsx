import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { Link } from "wouter";
import {
  Users, TrendingUp, TrendingDown, Minus, BarChart3, Shield,
  GraduationCap, Briefcase, Target, ClipboardCheck, Heart, Mail,
  Download, Camera,
} from "lucide-react";

// Public aggregate values may be a measured number, a suppressed count like
// "<5", or the sentinel "not yet reported" for unmeasured values.
type MetricValue = number | string;

interface PlatformMetrics {
  engagement: { totalUsers: MetricValue; activeUsers30d: MetricValue; lessonsCompleted: MetricValue; quizzesCompleted: MetricValue };
  prevention: { youthReached: MetricValue; modulesCompleted: MetricValue; avgScore: MetricValue };
  coalition: { classroomsActive: MetricValue; certificatesIssued: MetricValue };
  workforce: { careerAssessments: MetricValue; jobPlacements: MetricValue };
  grants: { applicationsInProgress: MetricValue; totalFundingSecured: MetricValue };
  facilitator: { totalFacilitators: MetricValue; sessionsDelivered: MetricValue; avgFidelity: MetricValue; totalDosageHours: MetricValue };
  parent: { modulesCompleted: MetricValue; familyAssessments: MetricValue };
  email: { inquiriesReceived: MetricValue; responseRate: MetricValue };
}

function TrendIcon({ value, previous }: { value: number; previous?: number }) {
  if (!previous || value === previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (value > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

const NOT_YET_REPORTED = "not yet reported";

function MetricCard({ label, value, unit, icon: Icon, href, color }: {
  label: string; value: MetricValue; unit?: string; icon: typeof Users; href?: string; color: string;
}) {
  const notReported = value === NOT_YET_REPORTED;
  const display = notReported
    ? "Not yet reported"
    : typeof value === "number" && unit === "$"
      ? `$${value.toLocaleString()}`
      : `${value}`;
  const suffix = !notReported && unit && unit !== "$" ? ` ${unit}` : "";

  const content = (
    <Card className={href ? "hover-elevate cursor-pointer" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p
              className={notReported ? "text-sm font-medium text-muted-foreground italic" : "text-2xl font-bold"}
              data-testid={`text-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {display}{suffix}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function MetricSection({ title, icon: Icon, children, color }: {
  title: string; icon: typeof Users; children: React.ReactNode; color: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

export default function PlatformMetricsPage() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Public read-only aggregates — no auth required. Values are non-sensitive
  // rollups; people counts below the suppression floor come back masked, and
  // unmeasured values arrive as "not yet reported".
  const { data: metrics, isLoading } = useQuery<PlatformMetrics>({
    queryKey: ["/api/public/platform-metrics"],
  });

  const snapshotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/metrics/snapshot"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metrics/stored"] });
      toast({ title: "Snapshot captured", description: "Metrics snapshot saved for reporting" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!metrics) return <p className="p-6 text-muted-foreground" data-testid="text-no-metrics">No metrics data available right now. Please try again later.</p>;

  const m = metrics;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <PageHeader
          title="Platform Metrics"
          description="Comprehensive metrics dashboard across all platform categories"
        />
        {isAuthenticated && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => snapshotMutation.mutate()} disabled={snapshotMutation.isPending} data-testid="button-snapshot">
              <Camera className="mr-2 h-4 w-4" />
              {snapshotMutation.isPending ? "Capturing..." : "Capture Snapshot"}
            </Button>
          </div>
        )}
      </div>

      <MetricSection title="Engagement" icon={Users} color="text-blue-500">
        <MetricCard label="Total Users" value={m.engagement.totalUsers} icon={Users} color="text-blue-500" href="/dashboard" />
        <MetricCard label="Active Users (30d)" value={m.engagement.activeUsers30d} icon={Users} color="text-blue-400" />
        <MetricCard label="Lessons Completed" value={m.engagement.lessonsCompleted} icon={GraduationCap} color="text-blue-600" href="/curriculum" />
        <MetricCard label="Quizzes Completed" value={m.engagement.quizzesCompleted} icon={ClipboardCheck} color="text-blue-300" />
      </MetricSection>

      <MetricSection title="Prevention" icon={Shield} color="text-green-500">
        <MetricCard label="Youth Reached" value={m.prevention.youthReached} icon={Users} color="text-green-500" href="/prevention" />
        <MetricCard label="Modules Completed" value={m.prevention.modulesCompleted} icon={GraduationCap} color="text-green-400" />
        <MetricCard label="Avg Score" value={m.prevention.avgScore} unit="%" icon={TrendingUp} color="text-green-600" />
      </MetricSection>

      <MetricSection title="Coalition" icon={Users} color="text-purple-500">
        <MetricCard label="Classrooms Active" value={m.coalition.classroomsActive} icon={GraduationCap} color="text-purple-500" href="/classrooms" />
        <MetricCard label="Certificates Issued" value={m.coalition.certificatesIssued} icon={Target} color="text-purple-400" href="/certificates" />
      </MetricSection>

      <MetricSection title="Workforce" icon={Briefcase} color="text-orange-500">
        <MetricCard label="Career Assessments" value={m.workforce.careerAssessments} icon={ClipboardCheck} color="text-orange-500" href="/workforce-assessment" />
        <MetricCard label="Job Placements" value={m.workforce.jobPlacements} icon={Briefcase} color="text-orange-400" />
      </MetricSection>

      <MetricSection title="Grants" icon={Target} color="text-red-500">
        <MetricCard label="Applications In Progress" value={m.grants.applicationsInProgress} icon={Target} color="text-red-500" href="/grants" />
        <MetricCard label="Total Funding Secured" value={m.grants.totalFundingSecured} unit="$" icon={TrendingUp} color="text-red-400" />
      </MetricSection>

      <MetricSection title="Facilitator" icon={ClipboardCheck} color="text-indigo-500">
        <MetricCard label="Total Facilitators" value={m.facilitator.totalFacilitators} icon={Users} color="text-indigo-500" href="/facilitator-hub" />
        <MetricCard label="Sessions Delivered" value={m.facilitator.sessionsDelivered} icon={ClipboardCheck} color="text-indigo-400" />
        <MetricCard label="Avg Fidelity" value={m.facilitator.avgFidelity} unit="/5" icon={TrendingUp} color="text-indigo-600" />
        <MetricCard label="Dosage Hours" value={m.facilitator.totalDosageHours} unit="hrs" icon={BarChart3} color="text-indigo-300" />
      </MetricSection>

      <MetricSection title="Parent Engagement" icon={Heart} color="text-pink-500">
        <MetricCard label="Modules Completed" value={m.parent.modulesCompleted} icon={GraduationCap} color="text-pink-500" href="/parent-education" />
        <MetricCard label="Family Assessments" value={m.parent.familyAssessments} icon={ClipboardCheck} color="text-pink-400" />
      </MetricSection>

      <MetricSection title="Email & Outreach" icon={Mail} color="text-teal-500">
        <MetricCard label="Inquiries Received" value={m.email.inquiriesReceived} icon={Mail} color="text-teal-500" />
        <MetricCard label="Response Rate" value={m.email.responseRate} unit="%" icon={TrendingUp} color="text-teal-400" />
      </MetricSection>
    </div>
  );
}
