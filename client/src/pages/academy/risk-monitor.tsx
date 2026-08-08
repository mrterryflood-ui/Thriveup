import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, AlertTriangle, Brain, Users, Shield, CheckCircle, Clock, Eye } from "lucide-react";
import type { RiskDecision, RiskNotificationSettings, AcademyAvatar } from "@shared/schema";
import { ErrorRetry } from "@/components/error-retry";

// Staff roles allowed to view student risk data. This is defense-in-depth: the
// underlying /api/admin/risk-* endpoints already enforce a DB role check
// (requireAdmin). This gate stops learners from ever rendering the screen (or
// its student-PII scaffolding) if they navigate directly to the URL.
const RISK_STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "staff"]);

interface StudentSummary {
  studentName: string;
  userId: string;
  totalDecisions: number;
  overrides: number;
  overrideRate: number;
  lastDecisionDate: string;
}

const stagesOfChange = [
  { stage: "Pre-contemplation", description: "Not aware of risks yet", color: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200" },
  { stage: "Contemplation", description: "Starting to think about it", color: "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200" },
  { stage: "Preparation", description: "Getting ready to make better choices", color: "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200" },
  { stage: "Action", description: "Actively practicing good habits", color: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200" },
  { stage: "Maintenance", description: "Consistently making informed decisions", color: "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200" },
];

const survivalIndicators = [
  "Frequently spending entire wallet balance immediately",
  "Avoiding long-term investments in favor of quick returns",
  "Overriding warnings consistently without pausing",
  "Difficulty with delayed gratification exercises",
  "High emotional reactivity to financial setbacks",
];

function getRiskBadgeVariant(level: string) {
  switch (level) {
    case "high": return "destructive";
    case "moderate": return "secondary";
    case "low": return "outline";
    default: return "secondary";
  }
}

function getRiskBadgeLabel(level: string) {
  switch (level) {
    case "high": return "High";
    case "moderate": return "Amber";
    case "low": return "Green";
    default: return level;
  }
}

function getPatternBadge(rate: number) {
  if (rate <= 20) return { label: "Learning", variant: "outline" as const };
  if (rate <= 50) return { label: "Exploring", variant: "secondary" as const };
  return { label: "Needs Guidance", variant: "destructive" as const };
}

export default function AcademyRiskMonitorPage() {
  useEffect(() => { document.title = 'Risk Monitor | ThriveUp Academy'; }, []);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Resolve the caller's role (same source app-sidebar uses) to gate the page.
  const { data: avatar, isLoading: avatarLoading } = useQuery<AcademyAvatar>({
    queryKey: ["/api/academy/avatar"],
    enabled: isAuthenticated,
  });
  const isStaff = !!avatar && RISK_STAFF_ROLES.has(avatar.role);

  const [overrideCountThreshold, setOverrideCountThreshold] = useState(3);
  const [tradeAmountThreshold, setTradeAmountThreshold] = useState(500);
  const [notifyOnHighRisk, setNotifyOnHighRisk] = useState(true);
  const [notifyOnEveryOverride, setNotifyOnEveryOverride] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { isLoading: settingsLoading } = useQuery<RiskNotificationSettings | null>({
    queryKey: ["/api/admin/risk-settings"],
    enabled: isStaff,
    queryFn: async () => {
      const res = await fetch("/api/admin/risk-settings", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && !settingsLoaded) {
        setOverrideCountThreshold(data.overrideCountThreshold ?? 3);
        setTradeAmountThreshold(data.tradeAmountThreshold ?? 500);
        setNotifyOnHighRisk(data.notifyOnHighRisk ?? true);
        setNotifyOnEveryOverride(data.notifyOnEveryOverride ?? false);
        setSettingsLoaded(true);
      }
      return data;
    },
  });

  const { data: decisions, isLoading: decisionsLoading, error: decisionsError, refetch: refetchDecisions } = useQuery<RiskDecision[]>({
    queryKey: ["/api/admin/risk-decisions"],
    enabled: isStaff,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/admin/risk-settings", {
        overrideCountThreshold,
        tradeAmountThreshold,
        notifyOnHighRisk,
        notifyOnEveryOverride,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/risk-settings"] });
      toast({ title: "Settings saved", description: "Notification thresholds updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to save settings.", variant: "destructive" });
    },
  });

  const updateDecisionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RiskDecision> }) => {
      await apiRequest("PATCH", `/api/admin/risk-decisions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/risk-decisions"] });
    },
  });

  const overrideCount = decisions?.filter((d) => d.overrideChosen).length ?? 0;
  const heededCount = decisions?.filter((d) => !d.overrideChosen).length ?? 0;

  const studentSummaries: StudentSummary[] = (() => {
    if (!decisions?.length) return [];
    const map = new Map<string, StudentSummary>();
    for (const d of decisions) {
      const existing = map.get(d.userId);
      if (existing) {
        existing.totalDecisions++;
        if (d.overrideChosen) existing.overrides++;
        if (d.createdAt && new Date(d.createdAt) > new Date(existing.lastDecisionDate)) {
          existing.lastDecisionDate = String(d.createdAt);
        }
      } else {
        map.set(d.userId, {
          studentName: d.studentName,
          userId: d.userId,
          totalDecisions: 1,
          overrides: d.overrideChosen ? 1 : 0,
          overrideRate: 0,
          lastDecisionDate: String(d.createdAt ?? ""),
        });
      }
    }
    return Array.from(map.values()).map((s) => ({
      ...s,
      overrideRate: s.totalDecisions > 0 ? Math.round((s.overrides / s.totalDecisions) * 100) : 0,
    }));
  })();

  if (authLoading || (isAuthenticated && avatarLoading)) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2" data-testid="text-login-required">Sign in required</h2>
        <p className="text-muted-foreground">Please sign in to access the Risk Decision Monitor.</p>
      </div>
    );
  }

  // Staff-only: student risk data must never render for a learner. The API is
  // also DB-role gated (requireAdmin), so this is defense-in-depth.
  if (!isStaff) {
    return (
      <div className="p-6 text-center" data-testid="section-access-denied">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2" data-testid="text-access-denied">Staff access required</h2>
        <p className="text-muted-foreground">The Risk Decision Monitor is available to teachers and staff only.</p>
      </div>
    );
  }

  if (decisionsError) {
    return <div className="p-6"><ErrorRetry message="Failed to load risk decisions." onRetry={refetchDecisions} /></div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <PageHeader
          title="Risk Decision Monitor"
          description="Supporting student autonomy with compassionate oversight"
          breadcrumbs={[{label:"Academy",href:"/academy"},{label:"Risk Monitor"}]}
        />
      </div>
      <div
        className="px-6 py-10 text-white"
        style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 100%)" }}
        data-testid="hero-risk-monitor"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Risk Decision Monitor</h1>
          </div>
          <p className="text-white/80 text-sm" data-testid="text-page-subtitle">
            Supporting student autonomy with compassionate oversight
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card data-testid="card-notification-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Settings className="h-5 w-5" />
              Notification Thresholds
            </CardTitle>
            <CardDescription>
              Set when you want to be alerted about student risk decisions. This isn't about catching students — it's about knowing when they might need support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {settingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="override-threshold" data-testid="label-override-threshold">
                      Notify after this many overrides per student
                    </Label>
                    <Input
                      id="override-threshold"
                      type="number"
                      min={1}
                      value={overrideCountThreshold}
                      onChange={(e) => setOverrideCountThreshold(Number(e.target.value))}
                      data-testid="input-override-threshold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trade-threshold" data-testid="label-trade-threshold">
                      Notify when a single trade exceeds this amount (credits)
                    </Label>
                    <Input
                      id="trade-threshold"
                      type="number"
                      min={1}
                      value={tradeAmountThreshold}
                      onChange={(e) => setTradeAmountThreshold(Number(e.target.value))}
                      data-testid="input-trade-threshold"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-high-risk" data-testid="label-notify-high-risk">Always notify for high-risk decisions</Label>
                    </div>
                    <Switch
                      id="notify-high-risk"
                      checked={notifyOnHighRisk}
                      onCheckedChange={setNotifyOnHighRisk}
                      data-testid="switch-notify-high-risk"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-every-override" data-testid="label-notify-every-override">Notify on every single override (use sparingly)</Label>
                    </div>
                    <Switch
                      id="notify-every-override"
                      checked={notifyOnEveryOverride}
                      onCheckedChange={setNotifyOnEveryOverride}
                      data-testid="switch-notify-every-override"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => saveSettingsMutation.mutate()}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-risk-patterns">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Brain className="h-5 w-5" />
              Stages of Change & Risk Factors
            </CardTitle>
            <CardDescription>
              Students move through stages of financial understanding. Those in survival mode may make decisions that seem impulsive but are actually rational responses to their lived experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {stagesOfChange.map((s, i) => (
                <div
                  key={s.stage}
                  className={`flex items-center gap-3 rounded-md p-3 ${s.color}`}
                  data-testid={`stage-${i}`}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-background/50 text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <span className="font-semibold">{s.stage}:</span>{" "}
                    <span>{s.description}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Survival Mode Indicators
              </h3>
              <ul className="space-y-2">
                {survivalIndicators.map((indicator, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`indicator-${i}`}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
                    {indicator}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground italic" data-testid="text-survival-note">
                These aren't deficits — they're survival strategies that worked in a different context. Our job is to gently expand the toolkit, not judge the tools they already have.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-risk-decisions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <AlertTriangle className="h-5 w-5" />
              Recent Risk Decisions
            </CardTitle>
            {decisions && decisions.length > 0 && (
              <CardDescription className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {heededCount} heeded
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  {overrideCount} overrides
                </span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {decisionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !decisions?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-empty-decisions">
                No risk decisions logged yet. When students encounter risk warnings, their choices will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Override?</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decisions.map((d) => (
                      <DecisionRow key={d.id} decision={d} onUpdate={updateDecisionMutation.mutate} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-student-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Users className="h-5 w-5" />
              Student Risk Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decisionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !studentSummaries.length ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-empty-summaries">
                No student data available yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Total Decisions</TableHead>
                        <TableHead>Overrides</TableHead>
                        <TableHead>Override Rate</TableHead>
                        <TableHead>Last Decision</TableHead>
                        <TableHead>Pattern</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentSummaries.map((s) => {
                        const pattern = getPatternBadge(s.overrideRate);
                        return (
                          <TableRow key={s.userId} data-testid={`row-student-${s.userId}`}>
                            <TableCell className="font-medium" data-testid={`text-student-name-${s.userId}`}>{s.studentName}</TableCell>
                            <TableCell data-testid={`text-total-decisions-${s.userId}`}>{s.totalDecisions}</TableCell>
                            <TableCell data-testid={`text-overrides-${s.userId}`}>{s.overrides}</TableCell>
                            <TableCell data-testid={`text-override-rate-${s.userId}`}>{s.overrideRate}%</TableCell>
                            <TableCell data-testid={`text-last-decision-${s.userId}`}>
                              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                <Clock className="h-3 w-3" />
                                {s.lastDecisionDate ? new Date(s.lastDecisionDate).toLocaleDateString() : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={pattern.variant} data-testid={`badge-pattern-${s.userId}`}>
                                {pattern.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-muted-foreground italic mt-4" data-testid="text-student-note">
                  Students with higher override rates aren't 'problem students' — they may be the ones most in need of mentorship and real-world financial guidance.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DecisionRow({
  decision,
  onUpdate,
}: {
  decision: RiskDecision;
  onUpdate: (args: { id: string; data: Partial<RiskDecision> }) => void;
}) {
  const [notes, setNotes] = useState(decision.adminNotes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  return (
    <TableRow data-testid={`row-decision-${decision.id}`}>
      <TableCell className="font-medium" data-testid={`text-decision-student-${decision.id}`}>{decision.studentName}</TableCell>
      <TableCell>
        <Badge variant="outline" data-testid={`badge-feature-${decision.id}`}>{decision.featureArea}</Badge>
      </TableCell>
      <TableCell data-testid={`text-action-${decision.id}`}>{decision.actionType}</TableCell>
      <TableCell>
        <Badge variant={getRiskBadgeVariant(decision.riskLevel)} data-testid={`badge-risk-${decision.id}`}>
          {getRiskBadgeLabel(decision.riskLevel)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={decision.overrideChosen ? "destructive" : "outline"} data-testid={`badge-override-${decision.id}`}>
          {decision.overrideChosen ? "Yes" : "No"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground" data-testid={`text-module-${decision.id}`}>
        {decision.financialLiteracyModule || "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-${decision.id}`}>
        {decision.createdAt ? new Date(decision.createdAt).toLocaleDateString() : "—"}
      </TableCell>
      <TableCell>
        <Switch
          checked={decision.adminReviewed}
          onCheckedChange={(checked) => onUpdate({ id: decision.id, data: { adminReviewed: checked } })}
          data-testid={`switch-reviewed-${decision.id}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
            placeholder="Add note..."
            className="min-w-[120px] text-sm"
            data-testid={`input-notes-${decision.id}`}
          />
          {notesDirty && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onUpdate({ id: decision.id, data: { adminNotes: notes } });
                setNotesDirty(false);
              }}
              data-testid={`button-save-notes-${decision.id}`}
            >
              Save
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
