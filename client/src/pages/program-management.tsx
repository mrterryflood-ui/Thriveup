import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Plus, Users, Building2, Calendar, HandCoins, Shield, Handshake,
  TrendingUp, CheckCircle, Clock, AlertTriangle, Search, Trash2, Edit,
  LayoutDashboard, DollarSign, ClipboardList, Sparkles,
} from "lucide-react";
import type {
  GrantProject, StaffingPlan, FacilityPlan, ProgramSchedule,
  InKindContribution, ComplianceCalendarItem, SustainabilityPlan, AdjacentAgency,
} from "@shared/schema";

const PROJECT_STATUSES = ["pre-award", "awarded", "active", "closeout", "completed"];
const STAFFING_STATUSES = ["planned", "posted", "interviewing", "hired", "onboarded"];
const FACILITY_TYPES = ["office", "classroom", "meeting-space", "community-center"];
const FACILITY_STATUSES = ["searching", "identified", "negotiating", "secured"];
const ACTIVITY_TYPES = ["curriculum-session", "coalition-meeting", "training", "community-event", "assessment", "reporting"];
const RECURRENCE_OPTIONS = ["one-time", "weekly", "biweekly", "monthly", "quarterly", "annually"];
const SCHEDULE_STATUSES = ["scheduled", "completed", "cancelled"];
const CONTRIBUTOR_TYPES = ["partner-org", "volunteer", "donor", "government", "business", "faith-based"];
const CONTRIBUTION_TYPES = ["space", "time", "materials", "services", "equipment"];
const VERIFICATION_STATUSES = ["pending", "documented", "verified"];
const COMPLIANCE_TASK_TYPES = ["semi-annual-report", "annual-review", "site-visit", "data-submission", "financial-report", "audit-prep"];
const COMPLIANCE_STATUSES = ["upcoming", "in-progress", "submitted", "approved"];
const SUSTAINABILITY_TYPES = ["diversified-funding", "fee-for-service", "partnership", "community-ownership", "institutional-adoption"];
const SUSTAINABILITY_STATUSES = ["exploring", "planning", "implementing", "established"];
const AGENCY_TYPES = ["government", "nonprofit", "education", "healthcare", "faith-based", "business"];
const RELATIONSHIP_TYPES = ["potential-partner", "active-partner", "competitor", "funder", "referral-source"];
const AGENCY_STATUSES = ["identified", "contacted", "engaged", "formalized"];

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    "pre-award": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "awarded": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "active": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "closeout": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "completed": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    "planned": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    "posted": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "interviewing": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "hired": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "onboarded": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    "searching": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "identified": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "negotiating": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "secured": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "scheduled": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "documented": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "verified": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "upcoming": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "submitted": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    "exploring": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    "planning": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "implementing": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "established": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "contacted": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "engaged": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "formalized": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
}

function formatCurrency(val: string | number | null | undefined): string {
  const num = parseFloat(String(val || "0"));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
}

function DashboardTab() {
  const { data: dashboard, isLoading } = useQuery<any>({
    queryKey: ["/api/program-management/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!dashboard) return <p className="text-muted-foreground" data-testid="text-no-dashboard">No data available</p>;

  const kpis = [
    { label: "Total Projects", value: dashboard.totalProjects, icon: Briefcase, color: "text-blue-500" },
    { label: "Active Projects", value: dashboard.activeProjects, icon: TrendingUp, color: "text-green-500" },
    { label: "Staff Filled", value: `${dashboard.staffPositions?.fillPercent || 0}%`, sub: `${dashboard.staffPositions?.filled || 0}/${dashboard.staffPositions?.total || 0}`, icon: Users, color: "text-purple-500" },
    { label: "Facilities Secured", value: `${dashboard.facilities?.securedPercent || 0}%`, sub: `${dashboard.facilities?.secured || 0}/${dashboard.facilities?.total || 0}`, icon: Building2, color: "text-orange-500" },
    { label: "Compliance On Track", value: `${dashboard.compliance?.onTrackPercent || 0}%`, sub: `${dashboard.compliance?.onTrack || 0}/${dashboard.compliance?.total || 0}`, icon: Shield, color: "text-emerald-500" },
    { label: "In-Kind Total", value: formatCurrency(dashboard.inKindMatch?.totalValue), sub: `${dashboard.inKindMatch?.verifiedCount || 0} verified`, icon: HandCoins, color: "text-amber-500" },
    { label: "Sustainability", value: dashboard.sustainability?.established || 0, sub: `of ${dashboard.sustainability?.total || 0} strategies`, icon: TrendingUp, color: "text-teal-500" },
    { label: "Upcoming Deadlines", value: dashboard.upcomingDeadlines?.length || 0, sub: "next 30 days", icon: AlertTriangle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-8 w-8 ${kpi.color} shrink-0`} />
                <div>
                  <p className="text-2xl font-bold" data-testid={`text-kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dashboard.upcomingDeadlines && dashboard.upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Upcoming Compliance Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.upcomingDeadlines.map((d: ComplianceCalendarItem) => (
                <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-deadline-${d.id}`}>{d.taskName}</p>
                    <p className="text-xs text-muted-foreground">{d.taskType} &middot; {d.responsiblePerson || "Unassigned"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{d.dueDate}</span>
                    <Badge className={statusColor(d.status)} data-testid={`badge-deadline-status-${d.id}`}>{d.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ grantName: "", fundingSource: "", awardAmount: "", startDate: "", endDate: "", status: "pre-award", projectDirector: "", description: "" });

  const { data: projects, isLoading } = useQuery<GrantProject[]>({ queryKey: ["/api/program-management/projects"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/program-management/projects", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/program-management/projects"] }); queryClient.invalidateQueries({ queryKey: ["/api/program-management/dashboard"] }); setShowForm(false); toast({ title: "Project created" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/program-management/projects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/program-management/projects"] }); queryClient.invalidateQueries({ queryKey: ["/api/program-management/dashboard"] }); toast({ title: "Project deleted" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/program-management/projects/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/program-management/projects"] }); queryClient.invalidateQueries({ queryKey: ["/api/program-management/dashboard"] }); },
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">Grant Projects</h3>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-project">
          <Plus className="h-4 w-4 mr-2" /> Add Project
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Grant Name" value={form.grantName} onChange={(e) => setForm({ ...form, grantName: e.target.value })} data-testid="input-grant-name" />
              <Input placeholder="Funding Source" value={form.fundingSource} onChange={(e) => setForm({ ...form, fundingSource: e.target.value })} data-testid="input-funding-source" />
              <Input placeholder="Award Amount" type="number" value={form.awardAmount} onChange={(e) => setForm({ ...form, awardAmount: e.target.value })} data-testid="input-award-amount" />
              <Input placeholder="Project Director" value={form.projectDirector} onChange={(e) => setForm({ ...form, projectDirector: e.target.value })} data-testid="input-project-director" />
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} data-testid="input-start-date" />
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-end-date" />
            </div>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger data-testid="select-project-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-project-description" />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.grantName || !form.fundingSource || !form.awardAmount || createMutation.isPending} data-testid="button-save-project">
                {createMutation.isPending ? "Saving..." : "Save Project"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-project">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {projects?.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold" data-testid={`text-project-name-${project.id}`}>{project.grantName}</h4>
                    <Badge className={statusColor(project.status)} data-testid={`badge-project-status-${project.id}`}>{project.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{project.fundingSource} &middot; {formatCurrency(project.awardAmount)}</p>
                  {project.projectDirector && <p className="text-xs text-muted-foreground">Director: {project.projectDirector}</p>}
                  {project.description && <p className="text-sm mt-1">{project.description}</p>}
                  {project.startDate && <p className="text-xs text-muted-foreground mt-1">{project.startDate} - {project.endDate || "ongoing"}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Select value={project.status} onValueChange={(v) => updateMutation.mutate({ id: project.id, data: { status: v } })}>
                    <SelectTrigger className="w-32" data-testid={`select-update-status-${project.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(project.id)} data-testid={`button-delete-project-${project.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!projects || projects.length === 0) && (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-projects">No grant projects yet. Add your first project above.</p>
        )}
      </div>
    </div>
  );
}

function EntityListTab<T extends { id: string }>({
  title,
  projectIdKey,
  apiBase,
  queryKeyBase,
  fields,
  statusOptions,
  statusField,
  icon: Icon,
}: {
  title: string;
  projectIdKey: string;
  apiBase: string;
  queryKeyBase: string;
  fields: { key: string; label: string; type: "text" | "number" | "date" | "select" | "textarea"; options?: string[]; required?: boolean }[];
  statusOptions: string[];
  statusField: string;
  icon: any;
}) {
  const { toast } = useToast();
  const { data: projects } = useQuery<GrantProject[]>({ queryKey: ["/api/program-management/projects"] });
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const effectiveProject = selectedProject || (projects && projects.length > 0 ? projects[0]?.id : "");

  const { data: items, isLoading } = useQuery<T[]>({
    queryKey: [queryKeyBase, effectiveProject],
    queryFn: () => fetch(`/api/program-management/projects/${effectiveProject}/${apiBase}`).then(r => r.json()),
    enabled: !!effectiveProject,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/program-management/${apiBase}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyBase, effectiveProject] });
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/dashboard"] });
      setShowForm(false);
      setForm({});
      toast({ title: `${title} created` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/program-management/${apiBase}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyBase, effectiveProject] });
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/dashboard"] });
      toast({ title: `${title} deleted` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/program-management/${apiBase}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyBase, effectiveProject] });
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/dashboard"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={effectiveProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48" data-testid={`select-project-filter-${apiBase}`}><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.grantName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setShowForm(!showForm); setForm({ [projectIdKey]: effectiveProject }); }} disabled={!effectiveProject} data-testid={`button-add-${apiBase}`}>
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((field) => {
                if (field.type === "select") {
                  return (
                    <Select key={field.key} value={form[field.key] || ""} onValueChange={(v) => setForm({ ...form, [field.key]: v })}>
                      <SelectTrigger data-testid={`select-${field.key}`}><SelectValue placeholder={field.label} /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  );
                }
                if (field.type === "textarea") {
                  return <Textarea key={field.key} placeholder={field.label} value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="col-span-full" data-testid={`input-${field.key}`} />;
                }
                return <Input key={field.key} type={field.type} placeholder={field.label} value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} data-testid={`input-${field.key}`} />;
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => createMutation.mutate({ ...form, [projectIdKey]: effectiveProject })} disabled={createMutation.isPending} data-testid={`button-save-${apiBase}`}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid={`button-cancel-${apiBase}`}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {(items as any[])?.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" data-testid={`text-item-${item.id}`}>
                        {item[fields[0]?.key] || item.id}
                      </p>
                      <Badge className={statusColor(item[statusField])} data-testid={`badge-status-${item.id}`}>{item[statusField]}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      {fields.slice(1, 4).map(f => item[f.key] ? <span key={f.key}>{f.label}: {f.type === "number" && f.key.includes("alary") ? formatCurrency(item[f.key]) : item[f.key]}</span> : null)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select value={item[statusField]} onValueChange={(v) => updateMutation.mutate({ id: item.id, data: { [statusField]: v } })}>
                      <SelectTrigger className="w-32" data-testid={`select-status-${item.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-${item.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!items || (items as any[]).length === 0) && (
            <p className="text-center text-muted-foreground py-8" data-testid={`text-no-${apiBase}`}>
              {effectiveProject ? `No ${title.toLowerCase()} yet.` : "Select a project first."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InKindTab() {
  return (
    <EntityListTab
      title="In-Kind Match"
      projectIdKey="grantProjectId"
      apiBase="in-kind"
      queryKeyBase="/api/program-management/in-kind"
      statusField="verificationStatus"
      statusOptions={VERIFICATION_STATUSES}
      icon={HandCoins}
      fields={[
        { key: "contributorName", label: "Contributor Name", type: "text", required: true },
        { key: "contributorType", label: "Contributor Type", type: "select", options: CONTRIBUTOR_TYPES },
        { key: "contributionType", label: "Contribution Type", type: "select", options: CONTRIBUTION_TYPES },
        { key: "estimatedValue", label: "Estimated Value ($)", type: "number" },
        { key: "documentedDate", label: "Date Documented", type: "date" },
        { key: "verificationStatus", label: "Verification Status", type: "select", options: VERIFICATION_STATUSES },
        { key: "matchCategory", label: "Match Category", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}

function SustainabilityPartnersTab() {
  const { toast } = useToast();
  const { data: projects } = useQuery<GrantProject[]>({ queryKey: ["/api/program-management/projects"] });
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [discovering, setDiscovering] = useState(false);
  const [focusArea, setFocusArea] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const effectiveProject = selectedProject || (projects && projects.length > 0 ? projects[0]?.id : "");

  const { data: agencies, isLoading: agenciesLoading } = useQuery<AdjacentAgency[]>({
    queryKey: ["/api/program-management/agencies", effectiveProject],
    queryFn: () => fetch(`/api/program-management/projects/${effectiveProject}/agencies`).then(r => r.json()),
    enabled: !!effectiveProject,
  });

  const { data: sustainItems, isLoading: sustainLoading } = useQuery<SustainabilityPlan[]>({
    queryKey: ["/api/program-management/sustainability", effectiveProject],
    queryFn: () => fetch(`/api/program-management/projects/${effectiveProject}/sustainability`).then(r => r.json()),
    enabled: !!effectiveProject,
  });

  const createAgencyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/program-management/agencies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/agencies", effectiveProject] });
      toast({ title: "Agency added" });
    },
  });

  const deleteAgencyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/program-management/agencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/agencies", effectiveProject] });
      toast({ title: "Agency removed" });
    },
  });

  const discoverMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/program-management/adjacent-agencies/discover", data),
    onSuccess: async (response) => {
      const result = await response.json();
      setSuggestions(result.suggestions || []);
      setDiscovering(false);
    },
    onError: () => {
      setDiscovering(false);
      toast({ title: "Discovery failed", description: "Could not reach AI service", variant: "destructive" });
    },
  });

  const createSustainMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/program-management/sustainability", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/sustainability", effectiveProject] });
      toast({ title: "Strategy added" });
    },
  });

  const deleteSustainMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/program-management/sustainability/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-management/sustainability", effectiveProject] });
      toast({ title: "Strategy removed" });
    },
  });

  const [sustainForm, setSustainForm] = useState({ strategy: "", strategyType: "diversified-funding", timeline: "", status: "exploring", estimatedRevenue: "", notes: "" });
  const [showSustainForm, setShowSustainForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={effectiveProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48" data-testid="select-project-sustain"><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.grantName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Sustainability Strategies</CardTitle>
          <Button size="sm" onClick={() => setShowSustainForm(!showSustainForm)} disabled={!effectiveProject} data-testid="button-add-sustainability">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {showSustainForm && (
            <div className="space-y-3 mb-4 p-3 border rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Strategy" value={sustainForm.strategy} onChange={e => setSustainForm({ ...sustainForm, strategy: e.target.value })} data-testid="input-sustain-strategy" />
                <Select value={sustainForm.strategyType} onValueChange={v => setSustainForm({ ...sustainForm, strategyType: v })}>
                  <SelectTrigger data-testid="select-sustain-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUSTAINABILITY_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Timeline" value={sustainForm.timeline} onChange={e => setSustainForm({ ...sustainForm, timeline: e.target.value })} data-testid="input-sustain-timeline" />
                <Input type="number" placeholder="Estimated Revenue" value={sustainForm.estimatedRevenue} onChange={e => setSustainForm({ ...sustainForm, estimatedRevenue: e.target.value })} data-testid="input-sustain-revenue" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => { createSustainMutation.mutate({ ...sustainForm, grantProjectId: effectiveProject }); setShowSustainForm(false); setSustainForm({ strategy: "", strategyType: "diversified-funding", timeline: "", status: "exploring", estimatedRevenue: "", notes: "" }); }} disabled={!sustainForm.strategy} data-testid="button-save-sustain">Save</Button>
                <Button size="sm" variant="outline" onClick={() => setShowSustainForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {sustainLoading ? <Skeleton className="h-16" /> : (
            <div className="space-y-2">
              {sustainItems?.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-sustain-${item.id}`}>{item.strategy}</p>
                    <p className="text-xs text-muted-foreground">{item.strategyType} &middot; {item.timeline || "TBD"} {item.estimatedRevenue ? `&middot; ${formatCurrency(item.estimatedRevenue)}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={statusColor(item.status)}>{item.status}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => deleteSustainMutation.mutate(item.id)} data-testid={`button-delete-sustain-${item.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {(!sustainItems || sustainItems.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No sustainability strategies yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Handshake className="h-4 w-4" /> Adjacent Agencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground mb-1 block">Focus Area</label>
              <Input placeholder="e.g., Youth Prevention" value={focusArea} onChange={e => setFocusArea(e.target.value)} data-testid="input-discover-focus" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <Input placeholder="e.g., Killeen, TX" value={location} onChange={e => setLocation(e.target.value)} data-testid="input-discover-location" />
            </div>
            <Button onClick={() => { setDiscovering(true); discoverMutation.mutate({ focusArea, location, grantProjectId: effectiveProject }); }} disabled={!focusArea || discoverMutation.isPending} data-testid="button-discover-agencies">
              <Sparkles className="h-4 w-4 mr-2" /> {discoverMutation.isPending ? "Discovering..." : "AI Discover"}
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/30">
              <p className="text-sm font-medium">AI Suggestions</p>
              {suggestions.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-md bg-background">
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-suggestion-${i}`}>{s.agencyName}</p>
                    <p className="text-xs text-muted-foreground">{s.agencyType} &middot; {s.focusArea} &middot; {s.relationship}</p>
                    {s.reasoning && <p className="text-xs text-muted-foreground mt-1">{s.reasoning}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => createAgencyMutation.mutate({ grantProjectId: effectiveProject, agencyName: s.agencyName, agencyType: s.agencyType, focusArea: s.focusArea, relationship: s.relationship, status: "identified" })} data-testid={`button-add-suggestion-${i}`}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {agenciesLoading ? <Skeleton className="h-16" /> : (
            <div className="space-y-2">
              {agencies?.map(agency => (
                <div key={agency.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-agency-${agency.id}`}>{agency.agencyName}</p>
                    <p className="text-xs text-muted-foreground">{agency.agencyType} &middot; {agency.focusArea} &middot; {agency.relationship}</p>
                    {agency.contactName && <p className="text-xs text-muted-foreground">{agency.contactName} {agency.contactEmail ? `(${agency.contactEmail})` : ""}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={statusColor(agency.status)}>{agency.status}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => deleteAgencyMutation.mutate(agency.id)} data-testid={`button-delete-agency-${agency.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {(!agencies || agencies.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No agencies added yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgramManagementPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Briefcase className="h-6 w-6" /> Program Management
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">Post-award grant project management, staffing, facilities, compliance, and sustainability planning</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects"><Briefcase className="h-4 w-4 mr-1" /> Projects</TabsTrigger>
          <TabsTrigger value="staffing" data-testid="tab-staffing"><Users className="h-4 w-4 mr-1" /> Staffing</TabsTrigger>
          <TabsTrigger value="facilities" data-testid="tab-facilities"><Building2 className="h-4 w-4 mr-1" /> Facilities</TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule"><Calendar className="h-4 w-4 mr-1" /> Schedule</TabsTrigger>
          <TabsTrigger value="inkind" data-testid="tab-inkind"><HandCoins className="h-4 w-4 mr-1" /> In-Kind</TabsTrigger>
          <TabsTrigger value="sustainability" data-testid="tab-sustainability"><Handshake className="h-4 w-4 mr-1" /> Sustainability</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="projects"><ProjectsTab /></TabsContent>
        <TabsContent value="staffing">
          <EntityListTab
            title="Staffing Plan"
            projectIdKey="grantProjectId"
            apiBase="staffing"
            queryKeyBase="/api/program-management/staffing"
            statusField="status"
            statusOptions={STAFFING_STATUSES}
            icon={Users}
            fields={[
              { key: "positionTitle", label: "Position Title", type: "text", required: true },
              { key: "qualifications", label: "Qualifications", type: "text" },
              { key: "fte", label: "FTE", type: "number" },
              { key: "salary", label: "Salary", type: "number" },
              { key: "status", label: "Status", type: "select", options: STAFFING_STATUSES },
              { key: "hiredPersonName", label: "Hired Person", type: "text" },
              { key: "startDate", label: "Start Date", type: "date" },
            ]}
          />
        </TabsContent>
        <TabsContent value="facilities">
          <EntityListTab
            title="Facility Plans"
            projectIdKey="grantProjectId"
            apiBase="facilities"
            queryKeyBase="/api/program-management/facilities"
            statusField="status"
            statusOptions={FACILITY_STATUSES}
            icon={Building2}
            fields={[
              { key: "name", label: "Facility Name", type: "text", required: true },
              { key: "facilityType", label: "Facility Type", type: "select", options: FACILITY_TYPES },
              { key: "address", label: "Address", type: "text" },
              { key: "capacity", label: "Capacity", type: "number" },
              { key: "monthlyRate", label: "Monthly Rate ($)", type: "number" },
              { key: "status", label: "Status", type: "select", options: FACILITY_STATUSES },
              { key: "inKindContributor", label: "In-Kind Contributor", type: "text" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>
        <TabsContent value="schedule">
          <EntityListTab
            title="Program Schedule"
            projectIdKey="grantProjectId"
            apiBase="schedules"
            queryKeyBase="/api/program-management/schedules"
            statusField="status"
            statusOptions={SCHEDULE_STATUSES}
            icon={Calendar}
            fields={[
              { key: "activityName", label: "Activity Name", type: "text", required: true },
              { key: "activityType", label: "Activity Type", type: "select", options: ACTIVITY_TYPES },
              { key: "scheduledDate", label: "Scheduled Date", type: "date" },
              { key: "recurrence", label: "Recurrence", type: "select", options: RECURRENCE_OPTIONS },
              { key: "facilitator", label: "Facilitator", type: "text" },
              { key: "location", label: "Location", type: "text" },
              { key: "status", label: "Status", type: "select", options: SCHEDULE_STATUSES },
              { key: "attendeeCount", label: "Attendee Count", type: "number" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>
        <TabsContent value="inkind"><InKindTab /></TabsContent>
        <TabsContent value="sustainability"><SustainabilityPartnersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
