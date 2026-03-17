import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, Download, Filter, Users, BarChart3,
  Activity, Zap, Brain, BookOpen, MessageCircle,
  Briefcase, Map, Target, Gamepad2,
} from "lucide-react";

interface DosageSummary {
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  uniqueParticipants: number;
  byToolType: Record<string, { sessions: number; totalMinutes: number }>;
  byParticipant: Array<{
    userId: string;
    totalMinutes: number;
    totalHours: number;
    sessions: number;
    toolTypesUsed: number;
  }>;
}

interface ServiceHoursEntry {
  userId: string;
  totalMinutes: number;
  totalHours: number;
  toolBreakdown: Array<{
    toolType: string;
    minutes: number;
    hours: number;
  }>;
}

interface CohortSummary {
  id: string;
  name: string;
  status: string;
}

interface DashboardData {
  cohorts: CohortSummary[];
}

const toolTypeIcons: Record<string, typeof Clock> = {
  ai_chat: Brain,
  lesson: BookOpen,
  assessment: Target,
  navigator: MessageCircle,
  career_explorer: Briefcase,
  game: Gamepad2,
  scenario: Map,
  quiz: Zap,
};

const toolTypeLabels: Record<string, string> = {
  ai_chat: "AI Chat / Tools",
  lesson: "Lessons",
  assessment: "Assessments",
  navigator: "Navigator",
  career_explorer: "Career Explorer",
  game: "Games",
  scenario: "Adventures",
  quiz: "Quizzes",
  course: "Courses",
  self_assessment: "Self Assessment",
  journal: "Journal",
  financial_literacy: "Financial Literacy",
};

export default function DosageReportPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    userId: "", toolType: "", startDate: "", endDate: "", cohortId: "",
  });
  const [activeView, setActiveView] = useState<"summary" | "service-hours">("summary");

  const queryParams = new URLSearchParams();
  if (filters.userId) queryParams.set("userId", filters.userId);
  if (filters.toolType) queryParams.set("toolType", filters.toolType);
  if (filters.startDate) queryParams.set("startDate", filters.startDate);
  if (filters.endDate) queryParams.set("endDate", filters.endDate);
  if (filters.cohortId) queryParams.set("cohortId", filters.cohortId);

  const { data: summary, isLoading: summaryLoading } = useQuery<DosageSummary>({
    queryKey: ["/api/dosage/summary", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/dosage/summary?${queryParams.toString()}`, { credentials: "include" });
      return res.json();
    },
  });

  const serviceHoursParams = new URLSearchParams();
  if (filters.userId) serviceHoursParams.set("userId", filters.userId);
  if (filters.toolType) serviceHoursParams.set("toolType", filters.toolType);
  if (filters.startDate) serviceHoursParams.set("startDate", filters.startDate);
  if (filters.endDate) serviceHoursParams.set("endDate", filters.endDate);
  if (filters.cohortId) serviceHoursParams.set("cohortId", filters.cohortId);

  const { data: serviceHours, isLoading: hoursLoading } = useQuery<ServiceHoursEntry[]>({
    queryKey: ["/api/dosage/service-hours", serviceHoursParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/dosage/service-hours?${serviceHoursParams.toString()}`, { credentials: "include" });
      return res.json();
    },
    enabled: activeView === "service-hours",
  });

  const { data: dashboard } = useQuery<DashboardData>({ queryKey: ["/api/pilot/dashboard"] });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.toolType) params.set("toolType", filters.toolType);
      if (filters.cohortId) params.set("cohortId", filters.cohortId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      const res = await fetch(`/api/dosage/export/csv?${params.toString()}`, { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "dosage_report.csv"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Dosage report exported" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dosage-title">Dosage & Service Hours Report</h1>
          <p className="text-muted-foreground mt-1">Cross-tool engagement tracking and WIOA-compatible service hour reports</p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export-dosage">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="p-4" data-testid="card-dosage-filters">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Participant ID</label>
            <Input placeholder="Filter by user" value={filters.userId} onChange={e => setFilters(p => ({ ...p, userId: e.target.value }))} data-testid="input-filter-user" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tool Type</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.toolType} onChange={e => setFilters(p => ({ ...p, toolType: e.target.value }))} data-testid="select-filter-tool">
              <option value="">All Tools</option>
              {Object.entries(toolTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Start Date</label>
            <Input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} data-testid="input-filter-start" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End Date</label>
            <Input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} data-testid="input-filter-end" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cohort</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.cohortId} onChange={e => setFilters(p => ({ ...p, cohortId: e.target.value }))} data-testid="select-filter-cohort">
              <option value="">All Cohorts</option>
              {dashboard?.cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant={activeView === "summary" ? "default" : "outline"} size="sm" onClick={() => setActiveView("summary")} data-testid="button-view-summary">
          <BarChart3 className="mr-1 h-4 w-4" /> Summary
        </Button>
        <Button variant={activeView === "service-hours" ? "default" : "outline"} size="sm" onClick={() => setActiveView("service-hours")} data-testid="button-view-hours">
          <Clock className="mr-1 h-4 w-4" /> Service Hours (WIOA)
        </Button>
      </div>

      {activeView === "summary" && (
        <>
          {summary && summary.totalHours !== undefined && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center" data-testid="card-dosage-hours">
                <p className="text-2xl font-bold text-primary">{summary.totalHours}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </Card>
              <Card className="p-4 text-center" data-testid="card-dosage-sessions">
                <p className="text-2xl font-bold text-emerald-600">{summary.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </Card>
              <Card className="p-4 text-center" data-testid="card-dosage-participants">
                <p className="text-2xl font-bold text-blue-600">{summary.uniqueParticipants}</p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </Card>
              <Card className="p-4 text-center" data-testid="card-dosage-avg">
                <p className="text-2xl font-bold text-violet-600">
                  {summary.uniqueParticipants > 0 ? Math.round(summary.totalMinutes / summary.uniqueParticipants) : 0}
                </p>
                <p className="text-xs text-muted-foreground">Avg Min/Person</p>
              </Card>
            </div>
          )}

          {summary && summary.byToolType && Object.keys(summary.byToolType).length > 0 && (
            <Card className="p-5" data-testid="card-tool-breakdown">
              <h3 className="font-semibold mb-4">Engagement by Tool Type</h3>
              <div className="space-y-3">
                {Object.entries(summary.byToolType)
                  .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
                  .map(([toolType, data]) => {
                    const Icon = toolTypeIcons[toolType] || Activity;
                    const label = toolTypeLabels[toolType] || toolType;
                    const pct = summary.totalMinutes > 0 ? (data.totalMinutes / summary.totalMinutes) * 100 : 0;
                    return (
                      <div key={toolType} className="flex items-center gap-3" data-testid={`row-tool-${toolType}`}>
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">{data.sessions} sessions · {Math.round(data.totalMinutes)} min</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full">
                            <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {summary && summary.byParticipant && summary.byParticipant.length > 0 && (
            <Card className="p-5" data-testid="card-participant-dosage">
              <h3 className="font-semibold mb-4">Per-Participant Dosage</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Participant</th>
                      <th className="text-right py-2 px-2">Sessions</th>
                      <th className="text-right py-2 px-2">Minutes</th>
                      <th className="text-right py-2 px-2">Hours</th>
                      <th className="text-right py-2 pl-2">Tools Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byParticipant.map(p => (
                      <tr key={p.userId} className="border-b last:border-0" data-testid={`row-participant-${p.userId}`}>
                        <td className="py-2 pr-4 font-medium">{p.userId}</td>
                        <td className="text-right py-2 px-2">{p.sessions}</td>
                        <td className="text-right py-2 px-2">{p.totalMinutes}</td>
                        <td className="text-right py-2 px-2">{p.totalHours}</td>
                        <td className="text-right py-2 pl-2">{p.toolTypesUsed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {summaryLoading && (
            <div className="text-center py-12 text-muted-foreground">Loading dosage data...</div>
          )}
        </>
      )}

      {activeView === "service-hours" && (
        <>
          <Card className="p-5" data-testid="card-service-hours">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">WIOA Total Service Hours Report</h3>
            </div>
            {hoursLoading && <p className="text-muted-foreground text-center py-6">Loading service hours...</p>}
            {serviceHours && serviceHours.length === 0 && (
              <p className="text-muted-foreground text-center py-6">No service hours recorded yet</p>
            )}
            {serviceHours && serviceHours.length > 0 && (
              <div className="space-y-4">
                {serviceHours.map(entry => (
                  <div key={entry.userId} className="border rounded-lg p-4" data-testid={`card-hours-${entry.userId}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.userId}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{entry.totalMinutes} min</Badge>
                        <Badge className="bg-primary text-primary-foreground">{entry.totalHours} hrs</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {entry.toolBreakdown.map(tb => {
                        const Icon = toolTypeIcons[tb.toolType] || Activity;
                        return (
                          <div key={tb.toolType} className="flex items-center gap-2 p-2 rounded bg-muted text-xs">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{toolTypeLabels[tb.toolType] || tb.toolType}</span>
                            <span className="ml-auto font-medium">{tb.hours}h</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
