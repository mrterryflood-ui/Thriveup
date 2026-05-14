import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Trash2, Briefcase, CheckCircle2, Clock, AlertCircle,
  Building2, ArrowRight, Download
} from "lucide-react";

interface StaffingEntry {
  id: string;
  roleTitle: string;
  grantRole: string;
  department: string | null;
  fte: string;
  qualifications: string | null;
  responsibilities: string | null;
  currentStaff: string | null;
  status: string;
  grantProgram: string | null;
  createdAt: string;
}

const GRANT_ROLE_TEMPLATES: Record<string, Array<{ roleTitle: string; grantRole: string; department: string; fte: string; qualifications: string; responsibilities: string }>> = {
  WIOA: [
    { roleTitle: "Program Director", grantRole: "WIOA Youth Program Director", department: "Administration", fte: "1.0", qualifications: "Master's degree in education, social work, or related field. 5+ years workforce development experience.", responsibilities: "Overall program management, grant compliance, stakeholder engagement, performance oversight" },
    { roleTitle: "Career Navigator", grantRole: "WIOA Youth Career Counselor", department: "Workforce", fte: "2.0", qualifications: "Bachelor's degree. Career counseling certification preferred. Experience with opportunity youth.", responsibilities: "Individual career planning, employer connections, job placement support, follow-up services" },
    { roleTitle: "Data Analyst", grantRole: "Performance Analyst", department: "Operations", fte: "1.0", qualifications: "Bachelor's in data science or related. Experience with WIOA reporting requirements.", responsibilities: "Performance tracking, DOL reporting, outcome data analysis, continuous improvement" },
    { roleTitle: "Youth Engagement Specialist", grantRole: "Youth Outreach Worker", department: "Programs", fte: "2.0", qualifications: "Associates degree or equivalent experience. Lived experience valued.", responsibilities: "Recruitment, retention, mentoring, peer support, community outreach" },
  ],
  OJJDP: [
    { roleTitle: "Reentry Program Manager", grantRole: "OJJDP Program Coordinator", department: "Case Management", fte: "1.0", qualifications: "Master's in criminal justice, social work, or related. Reentry program experience required.", responsibilities: "Reentry program design, case management oversight, court liaison, reporting" },
    { roleTitle: "Case Manager", grantRole: "Reentry Case Manager", department: "Case Management", fte: "3.0", qualifications: "Bachelor's in social work or related. Case management certification preferred.", responsibilities: "Individual case plans, service coordination, progress monitoring, family engagement" },
    { roleTitle: "Behavioral Health Specialist", grantRole: "Licensed Counselor", department: "Health Services", fte: "1.0", qualifications: "LPC, LCSW, or equivalent. Trauma-informed care training. Experience with justice-involved youth.", responsibilities: "Mental health assessment, individual/group counseling, crisis intervention, treatment planning" },
    { roleTitle: "Community Liaison", grantRole: "Community Engagement Coordinator", department: "Partnerships", fte: "1.0", qualifications: "Bachelor's degree. Strong community relationships. Lived experience valued.", responsibilities: "Partner agency coordination, community resource connection, advisory board support" },
  ],
  SAMHSA: [
    { roleTitle: "Clinical Director", grantRole: "SAMHSA Clinical Supervisor", department: "Health Services", fte: "1.0", qualifications: "Doctoral or master's in psychology, social work, or counseling. Clinical supervision license.", responsibilities: "Clinical program oversight, staff supervision, treatment protocol development, quality assurance" },
    { roleTitle: "Behavioral Health Counselor", grantRole: "Licensed Behavioral Health Provider", department: "Health Services", fte: "2.0", qualifications: "LPC, LCSW, LMFT, or equivalent. SAMHSA evidence-based practice training.", responsibilities: "Individual and group therapy, substance use assessment, behavioral health screening" },
    { roleTitle: "Peer Support Specialist", grantRole: "Peer Support Worker (Texas Peer Specialist certification pathway in progress)", department: "Programs", fte: "2.0", qualifications: "Personal recovery experience. Active enrollment in or completion of Texas Certified Peer Specialist (CPS) training (Via Hope or HHSC-approved provider). Cultural competency training. Honest disclosure: peer specialists are workforce-pathway hires; certification is in-progress, not pre-credentialed.", responsibilities: "Peer mentoring, recovery coaching, navigation support, community connection — under supervision of clinically-licensed program lead" },
    { roleTitle: "Wellness Coordinator", grantRole: "Health & Wellness Program Coordinator", department: "Programs", fte: "1.0", qualifications: "Bachelor's in public health or related. Health education certification preferred.", responsibilities: "Wellness programming, prevention education, health resource coordination, family engagement" },
  ],
};

const STATUS_CONFIG = {
  filled: { label: "Filled", icon: CheckCircle2, color: "text-emerald-600" },
  planned: { label: "Planned", icon: Clock, color: "text-amber-600" },
  vacant: { label: "Vacant", icon: AlertCircle, color: "text-red-600" },
  recruiting: { label: "Recruiting", icon: Users, color: "text-blue-600" },
};

const ORG_STRUCTURE = [
  {
    entity: "The Collaborative Advocate LLC",
    color: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-400",
    role: "Grant Applicant of Record & Compliance",
    positions: [
      { title: "Executive Director", fte: "1.0", focus: "Strategic leadership, grant compliance, interagency coordination" },
      { title: "Grants & Compliance Manager", fte: "1.0", focus: "Federal reporting, financial oversight, audit readiness" },
      { title: "Administrative Coordinator", fte: "0.5", focus: "Office operations, scheduling, documentation" },
    ],
  },
  {
    entity: "ThriveUp Academy",
    color: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    textColor: "text-emerald-700 dark:text-emerald-400",
    role: "Direct Youth Services & Programs",
    positions: [
      { title: "Program Director", fte: "1.0", focus: "Program design, daily operations, staff supervision" },
      { title: "Career Navigator (x2)", fte: "2.0", focus: "Career pathway facilitation, employer engagement" },
      { title: "Case Manager (x3)", fte: "3.0", focus: "Individual case management, goal-setting, service coordination" },
      { title: "Behavioral Health Specialist", fte: "1.0", focus: "Screening, counseling, crisis intervention" },
      { title: "Youth Engagement Specialist (x2)", fte: "2.0", focus: "Outreach, recruitment, peer mentoring" },
      { title: "Data & Outcomes Analyst", fte: "1.0", focus: "Performance tracking, outcome reporting" },
    ],
  },
  {
    entity: "Minority Center of Excellence",
    color: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    textColor: "text-violet-700 dark:text-violet-400",
    role: "Contracting & Employer Partnerships",
    positions: [
      { title: "Center Director", fte: "1.0", focus: "Employer partnerships, government contracting strategy" },
      { title: "Business Development Manager", fte: "1.0", focus: "Employer recruitment, job placement coordination" },
      { title: "Certification Specialist", fte: "0.5", focus: "Small business certification support, vendor registration" },
    ],
  },
];

export default function StaffingPlanPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState<"org" | "roles">("org");
  const [form, setForm] = useState({
    roleTitle: "", grantRole: "", department: "", fte: "1.0", qualifications: "", responsibilities: "", currentStaff: "", status: "planned", grantProgram: "",
  });

  const { data: rawEntries, isLoading } = useQuery<StaffingEntry[]>({ queryKey: ["/api/staffing-plan"] });
  const entries = rawEntries ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/staffing-plan", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staffing-plan"] });
      setShowForm(false);
      setForm({ roleTitle: "", grantRole: "", department: "", fte: "1.0", qualifications: "", responsibilities: "", currentStaff: "", status: "planned", grantProgram: "" });
      toast({ title: "Staffing entry added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/staffing-plan/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staffing-plan"] });
      toast({ title: "Entry removed" });
    },
  });

  const applyTemplate = (grantType: string) => {
    const template = GRANT_ROLE_TEMPLATES[grantType];
    if (!template) return;
    const promises = template.map((entry) =>
      apiRequest("POST", "/api/staffing-plan", { ...entry, grantProgram: grantType, status: "planned" })
    );
    Promise.all(promises).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/staffing-plan"] });
      toast({ title: `${grantType} staffing template applied` });
    });
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ["Role Title", "Grant Role", "Department", "FTE", "Status", "Grant Program", "Qualifications", "Responsibilities", "Current Staff"];
    const rows = entries.map((e) => [e.roleTitle, e.grantRole, e.department || "", e.fte, e.status, e.grantProgram || "", e.qualifications || "", e.responsibilities || "", e.currentStaff || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ThriveUp_Staffing_Plan.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Staffing plan exported" });
  };

  const totalFTE = entries.reduce((sum, e) => sum + parseFloat(e.fte || "0"), 0);
  const filledCount = entries.filter((e) => e.status === "filled").length;
  const vacantCount = entries.filter((e) => e.status === "vacant" || e.status === "recruiting").length;
  const departments = Array.from(new Set(entries.filter((e) => e.department).map((e) => e.department!)));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <SectionTutorial {...SECTION_TUTORIALS["staffing-plan"]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-staffing-title">Staffing Plan</h1>
          <p className="text-muted-foreground mt-1">Organizational structure and grant-required positions across three entities</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCSV} disabled={entries.length === 0} data-testid="button-export-csv">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-role">
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center" data-testid="stat-total-roles">
            <p className="text-2xl font-bold text-primary">{entries.length}</p>
            <p className="text-sm text-muted-foreground">Total Roles</p>
          </Card>
          <Card className="p-4 text-center" data-testid="stat-total-fte">
            <p className="text-2xl font-bold text-blue-600">{totalFTE.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Total FTE</p>
          </Card>
          <Card className="p-4 text-center" data-testid="stat-filled">
            <p className="text-2xl font-bold text-emerald-600">{filledCount}</p>
            <p className="text-sm text-muted-foreground">Filled</p>
          </Card>
          <Card className="p-4 text-center" data-testid="stat-vacant">
            <p className="text-2xl font-bold text-red-600">{vacantCount}</p>
            <p className="text-sm text-muted-foreground">Open Positions</p>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant={activeView === "org" ? "default" : "outline"} onClick={() => setActiveView("org")} data-testid="button-view-org">
          <Building2 className="mr-2 h-4 w-4" /> Organizational Chart
        </Button>
        <Button variant={activeView === "roles" ? "default" : "outline"} onClick={() => setActiveView("roles")} data-testid="button-view-roles">
          <Briefcase className="mr-2 h-4 w-4" /> Role Roster
        </Button>
      </div>

      {activeView === "org" && (
        <div className="space-y-4">
          <Card className="p-5" data-testid="card-org-chart">
            <h2 className="font-semibold text-lg mb-1">Three-Entity Organizational Structure</h2>
            <p className="text-sm text-muted-foreground mb-4">ThriveUp operates through three coordinated entities, each with distinct responsibilities</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ORG_STRUCTURE.map((org, orgIdx) => (
                <div key={org.entity} className="flex items-start gap-2">
                  <div className={`flex-1 ${org.color} ${org.borderColor} border rounded-lg p-4`}>
                    <h3 className={`font-semibold ${org.textColor} mb-0.5`}>{org.entity}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{org.role}</p>
                    <div className="space-y-2">
                      {org.positions.map((pos) => (
                        <div key={pos.title} className="bg-background rounded p-2.5 border">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-medium">{pos.title}</span>
                            <Badge variant="secondary" className="text-[10px]">{pos.fte} FTE</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{pos.focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {orgIdx < ORG_STRUCTURE.length - 1 && (
                    <div className="hidden md:flex items-center pt-16">
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeView === "roles" && (
        <>
          <Card className="p-5" data-testid="card-templates">
            <h2 className="font-semibold text-lg mb-1">Quick-Start Templates</h2>
            <p className="text-sm text-muted-foreground mb-4">Apply a pre-built staffing template based on grant requirements</p>
            <div className="flex flex-wrap gap-3">
              {Object.keys(GRANT_ROLE_TEMPLATES).map((grantType) => (
                <Button key={grantType} variant="outline" onClick={() => applyTemplate(grantType)} data-testid={`button-template-${grantType.toLowerCase()}`}>
                  <Briefcase className="mr-2 h-4 w-4" /> {grantType} Template ({GRANT_ROLE_TEMPLATES[grantType].length} roles)
                </Button>
              ))}
            </div>
          </Card>

          {showForm && (
            <Card className="p-5 space-y-4" data-testid="card-role-form">
              <h2 className="font-semibold">Add Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Role Title *</label>
                  <Input value={form.roleTitle} onChange={(e) => setForm((p) => ({ ...p, roleTitle: e.target.value }))} data-testid="input-role-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Grant Role Title *</label>
                  <Input value={form.grantRole} onChange={(e) => setForm((p) => ({ ...p, grantRole: e.target.value }))} data-testid="input-grant-role" />
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} data-testid="input-department" />
                </div>
                <div>
                  <label className="text-sm font-medium">FTE</label>
                  <Input value={form.fte} onChange={(e) => setForm((p) => ({ ...p, fte: e.target.value }))} data-testid="input-fte" />
                </div>
                <div>
                  <label className="text-sm font-medium">Grant Program</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.grantProgram} onChange={(e) => setForm((p) => ({ ...p, grantProgram: e.target.value }))} data-testid="select-grant-program">
                    <option value="">Select...</option>
                    <option value="WIOA">WIOA</option>
                    <option value="OJJDP">OJJDP</option>
                    <option value="SAMHSA">SAMHSA</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} data-testid="select-status">
                    <option value="planned">Planned</option>
                    <option value="recruiting">Recruiting</option>
                    <option value="filled">Filled</option>
                    <option value="vacant">Vacant</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Qualifications</label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" value={form.qualifications} onChange={(e) => setForm((p) => ({ ...p, qualifications: e.target.value }))} data-testid="input-qualifications" />
              </div>
              <div>
                <label className="text-sm font-medium">Responsibilities</label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" value={form.responsibilities} onChange={(e) => setForm((p) => ({ ...p, responsibilities: e.target.value }))} data-testid="input-responsibilities" />
              </div>
              <div>
                <label className="text-sm font-medium">Current Staff (if filled)</label>
                <Input value={form.currentStaff} onChange={(e) => setForm((p) => ({ ...p, currentStaff: e.target.value }))} data-testid="input-current-staff" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.roleTitle || !form.grantRole || createMutation.isPending} data-testid="button-submit-role">
                  {createMutation.isPending ? "Adding..." : "Add Role"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-role">Cancel</Button>
              </div>
            </Card>
          )}

          {departments.length > 0 && (
            <Card className="p-5" data-testid="card-dept-summary">
              <h2 className="font-semibold text-lg mb-3">Department Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {departments.map((dept) => {
                  const deptEntries = entries.filter((e) => e.department === dept);
                  const deptFTE = deptEntries.reduce((sum, e) => sum + parseFloat(e.fte || "0"), 0);
                  return (
                    <div key={dept} className="p-3 bg-muted rounded-lg text-center">
                      <p className="font-semibold text-sm">{dept}</p>
                      <p className="text-lg font-bold text-primary">{deptEntries.length}</p>
                      <p className="text-xs text-muted-foreground">{deptFTE.toFixed(1)} FTE</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {entries.map((entry) => {
              const statusConf = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
              const StatusIcon = statusConf.icon;
              return (
                <Card key={entry.id} className="p-4" data-testid={`card-role-${entry.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{entry.roleTitle}</h3>
                        <Badge variant="outline">{entry.grantRole}</Badge>
                        {entry.grantProgram && <Badge className="bg-primary/10 text-primary">{entry.grantProgram}</Badge>}
                        <div className={`flex items-center gap-1 text-xs ${statusConf.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" /> {statusConf.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        {entry.department && <span>{entry.department}</span>}
                        <span>FTE: {entry.fte}</span>
                        {entry.currentStaff && <span>Staff: {entry.currentStaff}</span>}
                      </div>
                      {entry.qualifications && (
                        <p className="text-sm mt-2 text-muted-foreground"><span className="font-medium text-foreground">Qualifications:</span> {entry.qualifications}</p>
                      )}
                      {entry.responsibilities && (
                        <p className="text-sm mt-1 text-muted-foreground"><span className="font-medium text-foreground">Responsibilities:</span> {entry.responsibilities}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry.id)} data-testid={`button-delete-role-${entry.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {entries.length === 0 && !isLoading && (
            <Card className="p-8 text-center text-muted-foreground" data-testid="empty-staffing">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium mb-1">No staffing plan entries yet</p>
              <p className="text-sm">Use a grant template above to auto-populate roles, or add roles manually.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
