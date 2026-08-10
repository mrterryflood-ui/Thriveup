import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Home, Heart, AlertTriangle, Users, ArrowRight,
  Pill, ShieldCheck, Activity, Download, ClipboardList,
  CheckCircle2, Clock, Phone, RefreshCw, Plus, TrendingUp
} from "lucide-react";

const TABS = [
  { id: "dashboard",   label: "Dashboard",         icon: Activity },
  { id: "sud",         label: "SUD Assessments",   icon: ClipboardList },
  { id: "recovery",    label: "Recovery Plans",     icon: TrendingUp },
  { id: "housing",     label: "Housing First",      icon: Home },
  { id: "handoffs",    label: "Warm Handoffs",      icon: ArrowRight },
  { id: "coaches",     label: "Peer Coaches",       icon: Users },
  { id: "crisis",      label: "Crisis Routing",     icon: AlertTriangle },
  { id: "harm",        label: "Harm Reduction",     icon: ShieldCheck },
  { id: "mat",         label: "MAT Coordination",   icon: Pill },
  { id: "continuum",   label: "Continuum of Care",  icon: Heart },
  { id: "hmis",        label: "HMIS Export",        icon: Download },
];

const RISK_COLOR: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const PHASE_COLOR: Record<string, string> = {
  pre_contemplation: "bg-gray-100 text-gray-700",
  contemplation: "bg-blue-100 text-blue-800",
  preparation: "bg-purple-100 text-purple-800",
  action: "bg-emerald-100 text-emerald-800",
  maintenance: "bg-green-100 text-green-800",
};

// ── AUDIT-C questions ─────────────────────────────────────────────────────────
const AUDIT_C = [
  { key: "q1", label: "How often did you have a drink containing alcohol in the past year?", options: [{ v: 0, l: "Never" }, { v: 1, l: "Monthly or less" }, { v: 2, l: "2–4 times/month" }, { v: 3, l: "2–3 times/week" }, { v: 4, l: "4+ times/week" }] },
  { key: "q2", label: "How many drinks did you have on a typical day?", options: [{ v: 0, l: "1–2" }, { v: 1, l: "3–4" }, { v: 2, l: "5–6" }, { v: 3, l: "7–9" }, { v: 4, l: "10+" }] },
  { key: "q3", label: "How often did you have 6 or more drinks on one occasion?", options: [{ v: 0, l: "Never" }, { v: 1, l: "Less than monthly" }, { v: 2, l: "Monthly" }, { v: 3, l: "Weekly" }, { v: 4, l: "Daily or almost daily" }] },
];

const DAST_10 = [
  "Have you used drugs other than those required for medical reasons?",
  "Do you abuse more than one drug at a time?",
  "Are you unable to stop using drugs when you want to?",
  "Have you ever had blackouts or flashbacks as a result of drug use?",
  "Do you ever feel bad or guilty about your drug use?",
  "Does your spouse or parents ever complain about your involvement with drugs?",
  "Have you neglected your family because of your use of drugs?",
  "Have you engaged in illegal activities in order to obtain drugs?",
  "Have you ever experienced withdrawal symptoms when you stopped taking drugs?",
  "Have you had medical problems as a result of your drug use?",
];

const CAGE = [
  "Have you ever felt you should Cut down on your drinking?",
  "Have people Annoyed you by criticizing your drinking?",
  "Have you ever felt bad or Guilty about your drinking?",
  "Have you ever had a drink first thing in the morning (Eye-opener) to steady your nerves?",
];

export default function StreetsProgramPage() {
  const [tab, setTab] = useState("dashboard");
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background" data-testid="page-streets">
      {/* Header */}
      <div className="border-b bg-card px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold" data-testid="text-streets-title">STREETS Program</h1>
              <p className="text-xs text-muted-foreground">Safety Through Recovery, Engagement, and Evidence-based Treatment and Support</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 flex-wrap mt-3">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.id ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"}`}
                  data-testid={`tab-${t.id}`}>
                  <Icon className="h-3.5 w-3.5" />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {tab === "dashboard"  && <DashboardTab />}
        {tab === "sud"        && <SudTab />}
        {tab === "recovery"   && <RecoveryTab />}
        {tab === "housing"    && <HousingTab />}
        {tab === "handoffs"   && <HandoffsTab />}
        {tab === "coaches"    && <CoachesTab />}
        {tab === "crisis"     && <CrisisTab />}
        {tab === "harm"       && <HarmTab />}
        {tab === "mat"        && <MatTab />}
        {tab === "continuum"  && <ContinuumTab />}
        {tab === "hmis"       && <HmisTab />}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data, isLoading, refetch } = useQuery<any>({ queryKey: ["/api/streets/dashboard"] });
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading dashboard…</div>;
  const d = data || {};
  const stats = [
    { label: "SUD Assessments", value: d.sudAssessments ?? 0, sub: `${d.highRisk ?? 0} high/severe risk`, color: "text-orange-600", icon: ClipboardList },
    { label: "Recovery Plans", value: d.recoveryPlans ?? 0, sub: `${d.inAction ?? 0} in action/maintenance`, color: "text-emerald-600", icon: TrendingUp },
    { label: "Housing Intakes", value: d.housingIntakes ?? 0, sub: `${d.housed ?? 0} housed · ${d.priority1 ?? 0} priority 1`, color: "text-blue-600", icon: Home },
    { label: "Warm Handoffs", value: d.warmHandoffs ?? 0, sub: `${d.handoffsConnected ?? 0} connected`, color: "text-purple-600", icon: ArrowRight },
    { label: "Peer Coaches", value: d.activeCoaches ?? 0, sub: "active ITI coaches", color: "text-pink-600", icon: Users },
    { label: "Crisis Events", value: d.crisisEvents ?? 0, sub: `${d.followUpPending ?? 0} follow-ups pending`, color: "text-red-600", icon: AlertTriangle },
    { label: "Harm Reduction", value: d.harmReductionServices ?? 0, sub: `${d.overdoseReversals ?? 0} overdose reversals`, color: "text-teal-600", icon: ShieldCheck },
    { label: "MAT Referrals", value: d.matReferrals ?? 0, sub: `${d.matEnrolled ?? 0} enrolled`, color: "text-indigo-600", icon: Pill },
    { label: "CoC Events", value: d.cocEvents ?? 0, sub: "continuum interactions", color: "text-amber-600", icon: Heart },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Program Overview</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-dashboard"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} data-testid={`card-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${s.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">STREETS Program — TCAF + Cortney Jones, MSW / Change 1</p>
          <p className="text-xs text-muted-foreground">Safety Through Recovery, Engagement, and Evidence-based Treatment and Support · HHS / SAMHSA · Up to $3M annually · Multi-year</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── SUD Assessments ────────────────────────────────────────────────────────────
function SudTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", assessorName: "", assessmentType: "audit_c", responses: {}, clinicalNotes: "", referralRecommended: false });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/sud-assessments"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/sud-assessments", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "Assessment saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/sud-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", assessorName: "", assessmentType: "audit_c", responses: {}, clinicalNotes: "", referralRecommended: false });
    },
    onError: (err: any) => toast({ title: "Error saving assessment", description: err?.message, variant: "destructive" }),
  });

  const questions = form.assessmentType === "audit_c" ? AUDIT_C : form.assessmentType === "dast_10" ? DAST_10 : CAGE;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">New SUD Screening</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name *" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-sud-client" />
          <Input placeholder="Assessor name" value={form.assessorName} onChange={e => setForm((f: any) => ({ ...f, assessorName: e.target.value }))} data-testid="input-sud-assessor" />
          <Select value={form.assessmentType} onValueChange={v => setForm((f: any) => ({ ...f, assessmentType: v, responses: {} }))} data-testid="select-assessment-type">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="audit_c">AUDIT-C (Alcohol Use)</SelectItem>
              <SelectItem value="dast_10">DAST-10 (Drug Use)</SelectItem>
              <SelectItem value="cage">CAGE (Alcohol)</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            {form.assessmentType === "audit_c" && AUDIT_C.map(q => (
              <div key={q.key} className="space-y-1">
                <p className="text-xs font-medium">{q.label}</p>
                <Select value={String(form.responses[q.key] ?? "")} onValueChange={v => setForm((f: any) => ({ ...f, responses: { ...f.responses, [q.key]: parseInt(v) } }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{q.options.map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            {(form.assessmentType === "dast_10" ? DAST_10 : form.assessmentType === "cage" ? CAGE : []).map((q, i) => (
              <div key={i} className="flex items-start gap-3">
                <input type="checkbox" id={`q${i}`} checked={!!form.responses[`q${i}`]}
                  onChange={e => setForm((f: any) => ({ ...f, responses: { ...f.responses, [`q${i}`]: e.target.checked } }))}
                  className="mt-0.5" />
                <label htmlFor={`q${i}`} className="text-xs cursor-pointer">{q}</label>
              </div>
            ))}
          </div>

          <Textarea placeholder="Clinical notes" value={form.clinicalNotes} onChange={e => setForm((f: any) => ({ ...f, clinicalNotes: e.target.value }))} className="text-sm" rows={2} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.referralRecommended} onChange={e => setForm((f: any) => ({ ...f, referralRecommended: e.target.checked }))} />
            Referral to treatment recommended
          </label>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.clientName || mutation.isPending} data-testid="button-save-sud">
            {mutation.isPending ? "Saving…" : "Save Assessment"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Assessments</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.assessments?.length ? <p className="text-sm text-muted-foreground text-center py-6">No assessments yet.</p> :
              data.assessments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30" data-testid={`row-sud-${a.id}`}>
                  <div>
                    <p className="text-sm font-medium">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{a.assessmentType.toUpperCase().replace("_", "-")} · Score: {a.totalScore} · {new Date(a.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLOR[a.riskLevel]}`}>{a.riskLevel}</span>
                    {a.referralRecommended && <Badge variant="outline" className="text-xs">Referral</Badge>}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Recovery Plans ─────────────────────────────────────────────────────────────
function RecoveryTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", currentPhase: "contemplation", recoveryCapitalScore: 0, primarySubstance: "", primaryClinician: "", strengths: "", barriers: "", goals: [] });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/recovery-plans"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/recovery-plans", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "Recovery plan created" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/recovery-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", currentPhase: "contemplation", recoveryCapitalScore: 0, primarySubstance: "", primaryClinician: "", strengths: "", barriers: "", goals: [] });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const PHASES = ["pre_contemplation", "contemplation", "preparation", "action", "maintenance"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">New Recovery Plan (ROSC)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name *" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-recovery-client" />
          <Input placeholder="Primary substance" value={form.primarySubstance} onChange={e => setForm((f: any) => ({ ...f, primarySubstance: e.target.value }))} />
          <Input placeholder="Primary clinician" value={form.primaryClinician} onChange={e => setForm((f: any) => ({ ...f, primaryClinician: e.target.value }))} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recovery Phase (Stages of Change)</p>
            <Select value={form.currentPhase} onValueChange={v => setForm((f: any) => ({ ...f, currentPhase: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHASES.map(p => <SelectItem key={p} value={p}>{p.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recovery Capital Score (0–100)</p>
            <Input type="number" min={0} max={100} value={form.recoveryCapitalScore} onChange={e => setForm((f: any) => ({ ...f, recoveryCapitalScore: parseInt(e.target.value) }))} />
          </div>
          <Textarea placeholder="Client strengths" value={form.strengths} onChange={e => setForm((f: any) => ({ ...f, strengths: e.target.value }))} rows={2} />
          <Textarea placeholder="Barriers to recovery" value={form.barriers} onChange={e => setForm((f: any) => ({ ...f, barriers: e.target.value }))} rows={2} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.clientName || mutation.isPending} data-testid="button-save-recovery">
            {mutation.isPending ? "Saving…" : "Create Recovery Plan"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Active Recovery Plans</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.plans?.length ? <p className="text-sm text-muted-foreground text-center py-6">No plans yet.</p> :
              data.plans.map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg border hover:bg-muted/30" data-testid={`row-recovery-${p.id}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{p.clientName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_COLOR[p.currentPhase] || "bg-gray-100"}`}>{p.currentPhase.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.primarySubstance || "—"} · Capital Score: {p.recoveryCapitalScore}/100 · {p.primaryClinician || "No clinician"}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Housing First ──────────────────────────────────────────────────────────────
function HousingTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", currentHousingStatus: "unsheltered", chronicallyHomeless: false, veteranStatus: false, disabilityStatus: false, vulnerabilityScore: 0, caseworker: "", notes: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/housing-intakes"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/housing-intakes", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "Intake saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/housing-intakes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", currentHousingStatus: "unsheltered", chronicallyHomeless: false, veteranStatus: false, disabilityStatus: false, vulnerabilityScore: 0, caseworker: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });
  const houseMutation = useMutation({
    mutationFn: async (id: string) => { const r = await apiRequest("PATCH", `/api/streets/housing-intakes/${id}/housed`, {}); return r.json(); },
    onSuccess: () => {
      toast({ title: "Marked as housed ✓" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/housing-intakes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const HOUSING_STATUSES = ["unsheltered", "emergency_shelter", "transitional", "doubled_up", "at_risk"];
  const TIER_COLOR: Record<string, string> = { "1": "bg-red-100 text-red-800", "2": "bg-orange-100 text-orange-800", "3": "bg-yellow-100 text-yellow-800" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Housing First Intake</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name *" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-housing-client" />
          <Select value={form.currentHousingStatus} onValueChange={v => setForm((f: any) => ({ ...f, currentHousingStatus: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOUSING_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-2">
            {[["chronicallyHomeless", "Chronically Homeless"], ["veteranStatus", "Veteran"], ["disabilityStatus", "Disability"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={form[k]} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.checked }))} />
                {l}
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Vulnerability Score (VI-SPDAT 0–17)</p>
            <Input type="number" min={0} max={17} value={form.vulnerabilityScore} onChange={e => setForm((f: any) => ({ ...f, vulnerabilityScore: parseInt(e.target.value) }))} />
          </div>
          <Input placeholder="Caseworker" value={form.caseworker} onChange={e => setForm((f: any) => ({ ...f, caseworker: e.target.value }))} />
          <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.clientName || mutation.isPending} data-testid="button-save-housing">
            {mutation.isPending ? "Saving…" : "Save Intake"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Active Intakes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.intakes?.length ? <p className="text-sm text-muted-foreground text-center py-6">No intakes yet.</p> :
              data.intakes.map((i: any) => (
                <div key={i.id} className={`p-3 rounded-lg border ${i.housingSecuredAt ? "opacity-50" : ""}`} data-testid={`row-housing-${i.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{i.clientName}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TIER_COLOR[i.priorityTier]}`}>P{i.priorityTier}</span>
                        {i.housingSecuredAt && <Badge className="text-xs bg-green-100 text-green-800">Housed ✓</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{i.currentHousingStatus.replace(/_/g, " ")} · Score: {i.vulnerabilityScore} · {i.caseworker || "No caseworker"}</p>
                    </div>
                    {!i.housingSecuredAt && <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => houseMutation.mutate(i.id)} data-testid={`button-housed-${i.id}`}>Mark Housed</Button>}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Warm Handoffs ──────────────────────────────────────────────────────────────
function HandoffsTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", fromProviderName: "", fromProviderType: "street_outreach", toProviderName: "", toProviderType: "behavioral_health", handoffReason: "", coordinatedBy: "", followUpDate: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/warm-handoffs"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/warm-handoffs", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "Warm handoff documented" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/warm-handoffs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", fromProviderName: "", fromProviderType: "street_outreach", toProviderName: "", toProviderType: "behavioral_health", handoffReason: "", coordinatedBy: "", followUpDate: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });
  const outcomeMutation = useMutation({
    mutationFn: async ({ id, outcome }: any) => { const r = await apiRequest("PATCH", `/api/streets/warm-handoffs/${id}/outcome`, { outcome }); return r.json(); },
    onSuccess: () => {
      toast({ title: "Outcome recorded" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/warm-handoffs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const PROVIDER_TYPES = ["street_outreach", "shelter", "behavioral_health", "primary_care", "peer_support", "legal", "housing", "mat_clinic", "recovery_housing"];
  const OUTCOME_COLOR: Record<string, string> = { connected: "text-green-600", enrolled: "text-emerald-600", no_contact: "text-red-500", refused: "text-orange-500" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Document Warm Handoff</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name *" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-handoff-client" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="From provider *" value={form.fromProviderName} onChange={e => setForm((f: any) => ({ ...f, fromProviderName: e.target.value }))} />
            <Select value={form.fromProviderType} onValueChange={v => setForm((f: any) => ({ ...f, fromProviderType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVIDER_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="To provider *" value={form.toProviderName} onChange={e => setForm((f: any) => ({ ...f, toProviderName: e.target.value }))} />
            <Select value={form.toProviderType} onValueChange={v => setForm((f: any) => ({ ...f, toProviderType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVIDER_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Reason for handoff *" value={form.handoffReason} onChange={e => setForm((f: any) => ({ ...f, handoffReason: e.target.value }))} rows={2} />
          <Input placeholder="Coordinated by" value={form.coordinatedBy} onChange={e => setForm((f: any) => ({ ...f, coordinatedBy: e.target.value }))} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.clientName || !form.fromProviderName || !form.toProviderName || mutation.isPending} data-testid="button-save-handoff">
            {mutation.isPending ? "Saving…" : "Document Handoff"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Handoffs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.handoffs?.length ? <p className="text-sm text-muted-foreground text-center py-6">No handoffs documented yet.</p> :
              data.handoffs.map((h: any) => (
                <div key={h.id} className="p-3 rounded-lg border" data-testid={`row-handoff-${h.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{h.clientName}</p>
                      <p className="text-xs text-muted-foreground">{h.fromProviderName} → {h.toProviderName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.handoffDate).toLocaleDateString()}</p>
                    </div>
                    {h.outcome ? <span className={`text-xs font-medium ${OUTCOME_COLOR[h.outcome] || ""}`}>{h.outcome}</span> :
                      <div className="flex gap-1 flex-wrap">
                        {["connected", "enrolled", "no_contact", "refused"].map(o => (
                          <button key={o} onClick={() => outcomeMutation.mutate({ id: h.id, outcome: o })}
                            className="text-[10px] px-1.5 py-0.5 border rounded hover:bg-muted" data-testid={`button-outcome-${h.id}-${o}`}>{o}</button>
                        ))}
                      </div>}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Peer Coaches ───────────────────────────────────────────────────────────────
function CoachesTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ name: "", email: "", phone: "", yearsInRecovery: "", primarySubstance: "", bio: "", stipendAmount: "", credentialingPathway: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/peer-coaches"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/peer-coaches", { ...form, yearsInRecovery: parseInt(form.yearsInRecovery) || 0, stipendAmount: parseFloat(form.stipendAmount) || 0 }); return r.json(); },
    onSuccess: () => {
      toast({ title: "Peer coach enrolled" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/peer-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ name: "", email: "", phone: "", yearsInRecovery: "", primarySubstance: "", bio: "", stipendAmount: "", credentialingPathway: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enroll Peer Recovery Coach</CardTitle>
          <p className="text-xs text-muted-foreground">Integration Through Invitation — stipended, credentialed, real</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Full name *" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} data-testid="input-coach-name" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Years in recovery" type="number" value={form.yearsInRecovery} onChange={e => setForm((f: any) => ({ ...f, yearsInRecovery: e.target.value }))} />
            <Input placeholder="Primary substance" value={form.primarySubstance} onChange={e => setForm((f: any) => ({ ...f, primarySubstance: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Stipend amount $" type="number" value={form.stipendAmount} onChange={e => setForm((f: any) => ({ ...f, stipendAmount: e.target.value }))} />
            <Input placeholder="Credentialing pathway" value={form.credentialingPathway} onChange={e => setForm((f: any) => ({ ...f, credentialingPathway: e.target.value }))} />
          </div>
          <Textarea placeholder="Bio / recovery story (optional)" value={form.bio} onChange={e => setForm((f: any) => ({ ...f, bio: e.target.value }))} rows={3} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} data-testid="button-save-coach">
            {mutation.isPending ? "Enrolling…" : "Enroll Coach"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Active Coaches</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.coaches?.length ? <p className="text-sm text-muted-foreground text-center py-6">No coaches enrolled yet.</p> :
              data.coaches.map((c: any) => (
                <div key={c.id} className="p-3 rounded-lg border" data-testid={`row-coach-${c.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.yearsInRecovery} yrs recovery · {c.primarySubstance || "—"}</p>
                      <p className="text-xs text-muted-foreground">Clients: {c.activeClients}/{c.maxClients} · Stipend: ${c.stipendAmount || 0}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${c.stipendStatus === "active" ? "border-green-500 text-green-600" : ""}`}>{c.stipendStatus}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Crisis Routing ─────────────────────────────────────────────────────────────
function CrisisTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", crisisType: "suicidal_ideation", acuityLevel: "moderate", disposition: "line_988", respondedBy: "", notes: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/crisis-log"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/crisis-log", { ...form, followUpRequired: true }); return r.json(); },
    onSuccess: () => {
      toast({ title: "Crisis event logged" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/crisis-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", crisisType: "suicidal_ideation", acuityLevel: "moderate", disposition: "line_988", respondedBy: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });
  const followUpMutation = useMutation({
    mutationFn: async ({ id, outcome }: any) => { const r = await apiRequest("PATCH", `/api/streets/crisis-log/${id}/follow-up`, { outcome }); return r.json(); },
    onSuccess: () => {
      toast({ title: "Follow-up completed" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/crisis-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const ACUITY_COLOR: Record<string, string> = { low: "text-green-600", moderate: "text-yellow-600", high: "text-orange-600", imminent: "text-red-600" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-red-200 dark:border-red-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Log Crisis Event</CardTitle>
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
            <Phone className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">988 Suicide & Crisis Lifeline — Call or text 988</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name (or Anonymous)" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-crisis-client" />
          <Select value={form.crisisType} onValueChange={v => setForm((f: any) => ({ ...f, crisisType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["suicidal_ideation", "overdose", "psychiatric", "domestic_violence", "housing_loss", "other"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.acuityLevel} onValueChange={v => setForm((f: any) => ({ ...f, acuityLevel: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["low", "moderate", "high", "imminent"].map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)} acuity</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.disposition} onValueChange={v => setForm((f: any) => ({ ...f, disposition: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[["line_988", "988 Lifeline"], ["line_911", "911 Emergency"], ["csu", "Crisis Stabilization Unit"], ["ed", "Emergency Department"], ["mobile_crisis", "Mobile Crisis Team"], ["peer", "Peer Support"], ["shelter", "Emergency Shelter"], ["de_escalated", "De-escalated on scene"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Responded by" value={form.respondedBy} onChange={e => setForm((f: any) => ({ ...f, respondedBy: e.target.value }))} />
          <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} />
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="button-save-crisis">
            {mutation.isPending ? "Logging…" : "Log Crisis Event"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Crisis Log</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.entries?.length ? <p className="text-sm text-muted-foreground text-center py-6">No events logged yet.</p> :
              data.entries.map((e: any) => (
                <div key={e.id} className={`p-3 rounded-lg border ${e.followUpRequired && !e.followUpCompleted ? "border-orange-300 dark:border-orange-800/50" : ""}`} data-testid={`row-crisis-${e.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{e.clientName || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{e.crisisType.replace(/_/g, " ")} · {e.disposition.replace(/_/g, " ")}</p>
                      <span className={`text-xs font-medium ${ACUITY_COLOR[e.acuityLevel]}`}>{e.acuityLevel} acuity</span>
                    </div>
                    {e.followUpRequired && !e.followUpCompleted ?
                      <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => followUpMutation.mutate({ id: e.id, outcome: "Follow-up completed" })} data-testid={`button-followup-${e.id}`}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Follow-up done
                      </Button> : e.followUpCompleted ? <Badge className="text-xs bg-green-100 text-green-800">Followed up ✓</Badge> : null}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Harm Reduction ─────────────────────────────────────────────────────────────
function HarmTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", anonymous: false, serviceType: "naloxone", quantityProvided: 1, overdoseReversal: false, substanceInvolved: "", linkedToTreatment: false, providedBy: "", location: "", notes: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/harm-reduction"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/harm-reduction", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "Service logged" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/harm-reduction"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", anonymous: false, serviceType: "naloxone", quantityProvided: 1, overdoseReversal: false, substanceInvolved: "", linkedToTreatment: false, providedBy: "", location: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const SERVICE_TYPES = [["naloxone", "Naloxone (Narcan)"], ["syringes", "Syringe Exchange"], ["test_strips", "Fentanyl Test Strips"], ["overdose_reversal", "Overdose Reversal Documented"], ["wound_care", "Wound Care"], ["education", "Harm Reduction Education"], ["linkage", "Treatment Linkage"]];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Log Harm Reduction Service</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.anonymous} onChange={e => setForm((f: any) => ({ ...f, anonymous: e.target.checked, clientName: e.target.checked ? "Anonymous" : "" }))} />
            Anonymous client
          </label>
          {!form.anonymous && <Input placeholder="Client name" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-harm-client" />}
          <Select value={form.serviceType} onValueChange={v => setForm((f: any) => ({ ...f, serviceType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SERVICE_TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Qty provided" type="number" min={0} value={form.quantityProvided} onChange={e => setForm((f: any) => ({ ...f, quantityProvided: parseInt(e.target.value) }))} />
            <Input placeholder="Substance involved" value={form.substanceInvolved} onChange={e => setForm((f: any) => ({ ...f, substanceInvolved: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={form.overdoseReversal} onChange={e => setForm((f: any) => ({ ...f, overdoseReversal: e.target.checked }))} />
              Overdose reversal
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={form.linkedToTreatment} onChange={e => setForm((f: any) => ({ ...f, linkedToTreatment: e.target.checked }))} />
              Linked to treatment
            </label>
          </div>
          <Input placeholder="Provided by" value={form.providedBy} onChange={e => setForm((f: any) => ({ ...f, providedBy: e.target.value }))} />
          <Input placeholder="Location" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="button-save-harm">
            {mutation.isPending ? "Logging…" : "Log Service"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Service Log</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.services?.length ? <p className="text-sm text-muted-foreground text-center py-6">No services logged yet.</p> :
              data.services.map((s: any) => (
                <div key={s.id} className={`p-3 rounded-lg border ${s.overdoseReversal ? "border-red-300 bg-red-50/20" : ""}`} data-testid={`row-harm-${s.id}`}>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.clientName || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{s.serviceType.replace(/_/g, " ")} {s.quantityProvided > 0 ? `× ${s.quantityProvided}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.serviceDate).toLocaleDateString()} · {s.location || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {s.overdoseReversal && <Badge className="text-xs bg-red-100 text-red-800">Reversal</Badge>}
                      {s.linkedToTreatment && <Badge className="text-xs bg-blue-100 text-blue-800">Treatment Link</Badge>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── MAT Coordination ───────────────────────────────────────────────────────────
function MatTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", medication: "buprenorphine", clinicName: "", clinicPhone: "", clinicAddress: "", prescribingProvider: "", barriers: "", coordinatedBy: "", notes: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/mat"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/mat", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "MAT referral created" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/mat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", medication: "buprenorphine", clinicName: "", clinicPhone: "", clinicAddress: "", prescribingProvider: "", barriers: "", coordinatedBy: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });
  const enrollMutation = useMutation({
    mutationFn: async (id: string) => { const r = await apiRequest("PATCH", `/api/streets/mat/${id}`, { status: "enrolled", enrollmentDate: new Date().toISOString() }); return r.json(); },
    onSuccess: () => {
      toast({ title: "Enrollment confirmed" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/mat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const STATUS_COLOR: Record<string, string> = { referred: "bg-yellow-100 text-yellow-800", enrolled: "bg-blue-100 text-blue-800", active: "bg-green-100 text-green-800", on_hold: "bg-gray-100 text-gray-700", discharged: "bg-red-100 text-red-800" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">MAT Coordination Referral</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name *" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-mat-client" />
          <Select value={form.medication} onValueChange={v => setForm((f: any) => ({ ...f, medication: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[["buprenorphine", "Buprenorphine (Subutex)"], ["methadone", "Methadone"], ["naltrexone", "Naltrexone (oral)"], ["vivitrol", "Vivitrol (injectable naltrexone)"], ["suboxone", "Suboxone (buprenorphine/naloxone)"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Clinic / prescriber name" value={form.clinicName} onChange={e => setForm((f: any) => ({ ...f, clinicName: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Clinic phone" value={form.clinicPhone} onChange={e => setForm((f: any) => ({ ...f, clinicPhone: e.target.value }))} />
            <Input placeholder="Prescribing provider" value={form.prescribingProvider} onChange={e => setForm((f: any) => ({ ...f, prescribingProvider: e.target.value }))} />
          </div>
          <Input placeholder="Clinic address" value={form.clinicAddress} onChange={e => setForm((f: any) => ({ ...f, clinicAddress: e.target.value }))} />
          <Textarea placeholder="Barriers to enrollment" value={form.barriers} onChange={e => setForm((f: any) => ({ ...f, barriers: e.target.value }))} rows={2} />
          <Input placeholder="Coordinated by" value={form.coordinatedBy} onChange={e => setForm((f: any) => ({ ...f, coordinatedBy: e.target.value }))} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.clientName || mutation.isPending} data-testid="button-save-mat">
            {mutation.isPending ? "Saving…" : "Create MAT Referral"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">MAT Records</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.records?.length ? <p className="text-sm text-muted-foreground text-center py-6">No MAT records yet.</p> :
              data.records.map((m: any) => (
                <div key={m.id} className="p-3 rounded-lg border" data-testid={`row-mat-${m.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{m.clientName}</p>
                      <p className="text-xs text-muted-foreground">{m.medication} · {m.clinicName || "No clinic"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.referralDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status]}`}>{m.status}</span>
                      {m.status === "referred" && <Button size="sm" variant="outline" className="text-xs" onClick={() => enrollMutation.mutate(m.id)} data-testid={`button-enroll-${m.id}`}>Mark Enrolled</Button>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Continuum of Care ──────────────────────────────────────────────────────────
function ContinuumTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ clientName: "", providerName: "", providerType: "outreach", eventType: "enrollment", outcome: "", nextStep: "", documentedBy: "", notes: "" });
  const { data, refetch } = useQuery<any>({ queryKey: ["/api/streets/continuum"] });
  const mutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/streets/continuum", form); return r.json(); },
    onSuccess: () => {
      toast({ title: "CoC event logged" });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/continuum"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streets/dashboard"] });
      setForm({ clientName: "", providerName: "", providerType: "outreach", eventType: "enrollment", outcome: "", nextStep: "", documentedBy: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
  });

  const PROVIDER_TYPES = ["outreach", "shelter", "treatment", "housing", "employment", "legal", "peer", "primary_care", "mat_clinic", "recovery_housing"];
  const EVENT_TYPES = ["enrollment", "service", "handoff", "exit", "follow_up", "crisis", "milestone"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Log Continuum Event</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Client name *" value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} data-testid="input-coc-client" />
          <Input placeholder="Provider / organization name *" value={form.providerName} onChange={e => setForm((f: any) => ({ ...f, providerName: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.providerType} onValueChange={v => setForm((f: any) => ({ ...f, providerType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVIDER_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.eventType} onValueChange={v => setForm((f: any) => ({ ...f, eventType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Outcome" value={form.outcome} onChange={e => setForm((f: any) => ({ ...f, outcome: e.target.value }))} />
          <Textarea placeholder="Next step" value={form.nextStep} onChange={e => setForm((f: any) => ({ ...f, nextStep: e.target.value }))} rows={2} />
          <Input placeholder="Documented by" value={form.documentedBy} onChange={e => setForm((f: any) => ({ ...f, documentedBy: e.target.value }))} />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.clientName || !form.providerName || mutation.isPending} data-testid="button-save-coc">
            {mutation.isPending ? "Saving…" : "Log CoC Event"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Continuum Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!data?.events?.length ? <p className="text-sm text-muted-foreground text-center py-6">No events yet.</p> :
              data.events.map((e: any) => (
                <div key={e.id} className="p-3 rounded-lg border" data-testid={`row-coc-${e.id}`}>
                  <p className="text-sm font-medium">{e.clientName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">{e.eventType}</Badge>
                    <span className="text-xs text-muted-foreground">{e.providerName}</span>
                    <span className="text-xs text-muted-foreground">· {new Date(e.eventDate).toLocaleDateString()}</span>
                  </div>
                  {e.nextStep && <p className="text-xs text-muted-foreground mt-1">Next: {e.nextStep}</p>}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── HMIS Export ────────────────────────────────────────────────────────────────
function HmisTab() {
  const { data, isLoading, refetch } = useQuery<any>({ queryKey: ["/api/streets/hmis-export"] });

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tcaf-hmis-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">HMIS-Compatible Data Export</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-hmis"><RefreshCw className="h-4 w-4" /></Button>
              <Button size="sm" onClick={handleDownload} disabled={!data || isLoading} data-testid="button-download-hmis">
                <Download className="h-4 w-4 mr-1.5" />Download JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Generating export…</p> : !data ? null : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ["Total Clients Served", data.summary?.totalClientsServed ?? 0],
                  ["Housing Placements", data.summary?.housingPlacements ?? 0],
                  ["Warm Handoffs Completed", data.summary?.warmHandoffsCompleted ?? 0],
                  ["MAT Enrollments", data.summary?.matEnrollments ?? 0],
                  ["Crisis Events", data.summary?.crisisEvents ?? 0],
                  ["Client Enrollments", data.clientEnrollments?.length ?? 0],
                ].map(([l, v]) => (
                  <div key={l} className="p-3 rounded-lg border bg-muted/20">
                    <p className="text-xl font-bold text-blue-600">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs font-semibold mb-1">Export Metadata</p>
                <p className="text-xs text-muted-foreground">System: {data.exportMeta?.system}</p>
                <p className="text-xs text-muted-foreground">Exported: {data.exportMeta?.exportedAt ? new Date(data.exportMeta.exportedAt).toLocaleString() : "—"}</p>
                <p className="text-xs text-muted-foreground">Format: {data.exportMeta?.version}</p>
                <p className="text-xs text-muted-foreground">EIN: {data.exportMeta?.ein}</p>
              </div>
              <p className="text-xs text-muted-foreground">This export maps to HMIS CSV 2024 field standards. Submit alongside your CoC annual performance report or as a supplemental data file with federal reporting.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
