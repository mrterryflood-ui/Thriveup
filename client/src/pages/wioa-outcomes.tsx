import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Briefcase, DollarSign, Clock, Users, BarChart3, RefreshCw, Download } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { EcosystemGateway } from "@/components/ecosystem-gateway";

interface Placement {
  id: string;
  userId: string;
  userName: string;
  employerName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  wage: number;
  hoursPerWeek: number;
  status: string;
  placementSource?: string;
  createdAt: string;
}

interface Enrollment {
  id: string;
  userId: string;
  userName: string;
  programId: string;
  status: string;
  enrollmentDate: string;
  actualCompletion?: string;
  attendanceRate?: number;
  credentialsEarned: string[];
}

interface Program {
  id: string;
  name: string;
  programType: string;
  durationWeeks: number;
}

function pct(n: number, d: number) {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function weeksToPlacement(enrollDate: string, startDate: string) {
  const e = new Date(enrollDate).getTime();
  const s = new Date(startDate).getTime();
  return Math.max(0, Math.round((s - e) / (1000 * 60 * 60 * 24 * 7)));
}

function MetricCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted/50`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WIOAOutcomesPage() {
  const { data: placements = [], isLoading: placementsLoading, dataUpdatedAt, refetch } = useQuery<Placement[]>({
    queryKey: ["/api/workforce/placements/all"],
    refetchInterval: 300000,
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/workforce/enrollments"],
    refetchInterval: 300000,
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/workforce/training-programs"],
  });

  const isLoading = placementsLoading || enrollmentsLoading;

  const activePlacements = placements.filter(p => p.status === "active" || p.status === "placed");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");
  const totalEnrolled = enrollments.length;
  const placedCount = activePlacements.length;

  const wages = activePlacements.filter(p => p.wage > 0).map(p => Number(p.wage));
  const avgWage = avg(wages);

  const retentionEligible = placements.filter(p => {
    if (!p.startDate) return false;
    const start = new Date(p.startDate).getTime();
    const now = Date.now();
    return (now - start) >= 90 * 24 * 60 * 60 * 1000;
  });
  const retained = retentionEligible.filter(p => p.status === "active" || !p.endDate);
  const retentionRate = retentionEligible.length ? Math.round((retained.length / retentionEligible.length) * 100) : null;

  const timeToPlace = placements
    .filter(p => p.startDate && p.createdAt)
    .map(p => weeksToPlacement(p.createdAt, p.startDate))
    .filter(w => w >= 0 && w < 104);
  const avgWeeks = avg(timeToPlace);

  const programMap: Record<string, string> = {};
  programs.forEach(p => { programMap[p.id] = p.name; });

  const byProgram: Record<string, { name: string; enrolled: number; placed: number; avgWage: number }> = {};
  enrollments.forEach(e => {
    const key = e.programId;
    if (!byProgram[key]) byProgram[key] = { name: programMap[key] ?? e.programId, enrolled: 0, placed: 0, avgWage: 0 };
    byProgram[key].enrolled++;
  });
  placements.forEach(p => {
    const enroll = enrollments.find(e => e.userId === p.userId);
    if (enroll) {
      const key = enroll.programId;
      if (byProgram[key]) byProgram[key].placed++;
    }
  });
  const programRows = Object.values(byProgram).sort((a, b) => b.enrolled - a.enrolled).slice(0, 10);

  const bySource: Record<string, number> = {};
  placements.forEach(p => {
    const src = p.placementSource ?? "Unknown";
    bySource[src] = (bySource[src] ?? 0) + 1;
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  const exportCSV = () => {
    const rows = [
      ["Name", "Employer", "Job Title", "Start Date", "Wage ($/hr)", "Status"],
      ...placements.map(p => [p.userName, p.employerName, p.jobTitle, p.startDate, String(p.wage), p.status]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "wioa-outcomes.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium mb-2">
              <BarChart3 className="h-3.5 w-3.5" />
              WIOA Performance Standards
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Employment Outcome Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Live placement rates, wage data, and 90-day retention — the metrics funders use to renew grants.</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
            <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-refresh-outcomes">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} data-testid="button-export-csv">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Placement Rate"
              value={pct(placedCount, totalEnrolled)}
              sub={`${placedCount} of ${totalEnrolled} enrolled`}
              icon={TrendingUp}
              color="text-emerald-600"
            />
            <MetricCard
              label="Avg Wage at Placement"
              value={avgWage ? `$${avgWage.toFixed(2)}/hr` : "—"}
              sub={`${wages.length} placements with wage data`}
              icon={DollarSign}
              color="text-blue-600"
            />
            <MetricCard
              label="90-Day Retention"
              value={retentionRate !== null ? `${retentionRate}%` : "—"}
              sub={`${retained.length} of ${retentionEligible.length} eligible`}
              icon={Users}
              color="text-violet-600"
            />
            <MetricCard
              label="Avg Time to Employment"
              value={timeToPlace.length ? `${avgWeeks.toFixed(1)} wks` : "—"}
              sub="Enrollment → first placement"
              icon={Clock}
              color="text-amber-600"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-600" /> Outcomes by Program
              </CardTitle>
              <CardDescription>Placement rate per training program</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
              ) : programRows.length > 0 ? (
                <div className="space-y-3">
                  {programRows.map(row => (
                    <div key={row.name} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{row.name}</span>
                          <span className="text-muted-foreground shrink-0 ml-2">{pct(row.placed, row.enrolled)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: row.enrolled ? `${Math.round((row.placed / row.enrolled) * 100)}%` : "0%" }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.enrolled} enrolled · {row.placed} placed</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No program data yet — placements will appear here as they're recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" /> Recent Placements
              </CardTitle>
              <CardDescription>Last {Math.min(placements.length, 10)} employment outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
              ) : placements.length > 0 ? (
                <div className="space-y-3">
                  {[...placements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map(p => (
                    <div key={p.id} className="flex items-start justify-between gap-2 py-2 border-b last:border-0" data-testid={`row-placement-${p.id}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.userName}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.jobTitle} @ {p.employerName}</div>
                        <div className="text-xs text-muted-foreground">{p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-emerald-600">{p.wage ? `$${Number(p.wage).toFixed(2)}/hr` : "—"}</div>
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs mt-0.5">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No placements recorded yet. Use the Workforce Pell page to log the first one.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {Object.keys(bySource).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Placement Sources</CardTitle>
              <CardDescription>How participants are connecting to employers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, n]) => (
                  <div key={src} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <span className="font-medium">{src}</span>
                    <Badge variant="secondary" className="text-xs">{n}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <EcosystemGateway
          context={["evaluation", "outcomes", "grants", "workforce", "employment", "research"]}
          title="Connected Measurement Infrastructure"
          subtitle="WIOA outcome data flows directly to RPLICE for implementation science reporting, LifeBridge for SDOH gap identification, and the grant pipeline for renewal narratives."
        />

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium mb-1">📋 WIOA Performance Standard Benchmarks (PY 2025)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              {[
                { label: "Employment Rate (Q2)", target: "≥ 60%", current: pct(placedCount, totalEnrolled) },
                { label: "Employment Rate (Q4)", target: "≥ 55%", current: retentionRate !== null ? `${retentionRate}%` : "—" },
                { label: "Median Earnings (Q2)", target: "≥ $5,300/qtr", current: avgWage ? `$${(avgWage * 13 * 40).toLocaleString()}/yr` : "—" },
                { label: "Credential Attainment", target: "≥ 55%", current: pct(completedEnrollments.filter(e => e.credentialsEarned?.length > 0).length, completedEnrollments.length) },
              ].map(m => (
                <div key={m.label} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{m.current}</p>
                  <p className="text-xs text-muted-foreground">Target: {m.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
