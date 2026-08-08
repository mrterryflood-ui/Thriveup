// YHSI Operations — staff console for HUD CPD-2600-DC-0035.
// Tabs: Referrals (USD 259 → Turning Point pipeline), Participants (youth data
// layer + HMIS export), Voice Review, Biannual Reports. Admin/staff only.
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ErrorRetry } from "@/components/error-retry";
import { Users, GitBranch, Megaphone, FileText, Download, Plus, TrendingUp, Landmark, HeartHandshake, AlarmClock } from "lucide-react";

// Draft persistence: staff forms live inside tab panels that unmount on tab
// switch, silently discarding half-typed input. We persist each form's draft
// to sessionStorage (keyed by form name) so a tab switch — or accidental
// navigation within the session — no longer loses work. Drafts are cleared on
// successful submit. sessionStorage (not localStorage) keeps drafts scoped to
// the tab session, matching the ephemeral nature of these forms.
const DRAFT_PREFIX = "yhsi-ops-draft:";
function loadDraft<T>(name: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + name);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}
function clearDraft(name: string) {
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + name);
  } catch {
    // sessionStorage unavailable (private mode / disabled) — nothing to clear.
  }
}
// Persist `form` under `name` whenever it changes. Restore happens via
// loadDraft() in the useState initializer at each form's mount.
function useFormDraft(name: string, form: unknown) {
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_PREFIX + name, JSON.stringify(form));
    } catch {
      // sessionStorage unavailable — drafts simply won't persist this session.
    }
  }, [name, form]);
}

const REFERRAL_STATUSES = ["initiated", "contacted", "enrolled", "in_service", "completed", "closed_unresolved", "declined"];
const SERVICE_TYPES = ["housing_navigation", "case_management", "education_reengagement", "employment", "behavioral_health", "basic_needs", "legal", "other"];

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default function YhsiOpsPage() {
  const { toast } = useToast();

  const { data: metrics } = useQuery<any>({ queryKey: ["/api/yhsi/metrics"] });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="page-yhsi-ops">
      <PageHeader
        title="YHSI Operations"
        description="Youth Homelessness System Improvement (HUD CPD-2600-DC-0035) — referral pathway, youth data layer, youth voice review, and biannual HUD reporting."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Participants" value={metrics?.participants} testId="metric-participants" />
        <MetricCard label="Referrals" value={metrics?.referrals?.total} testId="metric-referrals" />
        <MetricCard label="Resolution rate" value={metrics?.referrals?.resolutionRate != null ? `${metrics.referrals.resolutionRate}%` : "—"} testId="metric-resolution" />
        <MetricCard label="Youth input incorporated" value={metrics?.youthVoice?.incorporated} testId="metric-voice" />
      </div>

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals" data-testid="tab-referrals"><GitBranch className="h-4 w-4 mr-1" /> Referrals</TabsTrigger>
          <TabsTrigger value="participants" data-testid="tab-participants"><Users className="h-4 w-4 mr-1" /> Participants</TabsTrigger>
          <TabsTrigger value="voice" data-testid="tab-voice"><Megaphone className="h-4 w-4 mr-1" /> Youth Voice</TabsTrigger>
          <TabsTrigger value="outcomes" data-testid="tab-outcomes"><TrendingUp className="h-4 w-4 mr-1" /> Outcomes</TabsTrigger>
          <TabsTrigger value="entitlements" data-testid="tab-entitlements"><Landmark className="h-4 w-4 mr-1" /> Chafee/ETV</TabsTrigger>
          <TabsTrigger value="fidelity" data-testid="tab-fidelity"><HeartHandshake className="h-4 w-4 mr-1" /> Fidelity</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports"><FileText className="h-4 w-4 mr-1" /> HUD Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="mt-6 space-y-6"><ReferralsTab /></TabsContent>
        <TabsContent value="participants" className="mt-6 space-y-6"><ParticipantsTab /></TabsContent>
        <TabsContent value="voice" className="mt-6 space-y-6"><VoiceTab /></TabsContent>
        <TabsContent value="outcomes" className="mt-6 space-y-6"><OutcomesTab /></TabsContent>
        <TabsContent value="entitlements" className="mt-6 space-y-6"><EntitlementsTab /></TabsContent>
        <TabsContent value="fidelity" className="mt-6 space-y-6"><FidelityTab /></TabsContent>
        <TabsContent value="reports" className="mt-6 space-y-6"><MilestonesPanel /><ReportsTab /></TabsContent>
      </Tabs>
    </div>
  );

  function MetricCard({ label, value, testId }: { label: string; value: any; testId: string }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-2xl font-bold" data-testid={testId}>{value ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    );
  }

  function ReferralsTab() {
    const REFERRAL_FORM_DEFAULTS = { sourceOrg: "USD 259 McKinney-Vento", destinationOrg: "Turning Point", serviceType: "housing_navigation", urgency: "routine", notes: "" };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(() => loadDraft("referral", REFERRAL_FORM_DEFAULTS));
    useFormDraft("referral", form);
    const { data: referrals, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/referrals"] });

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/referrals", form)).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/referrals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/metrics"] });
        clearDraft("referral");
        setForm(REFERRAL_FORM_DEFAULTS);
        setShowForm(false);
        toast({ title: "Referral created" });
      },
      onError: (e: Error) => toast({ title: "Failed to create referral", description: e.message, variant: "destructive" }),
    });

    const statusMutation = useMutation({
      mutationFn: async ({ id, status }: { id: string; status: string }) => {
        const body: any = { status };
        if (["completed", "closed_unresolved", "declined"].includes(status)) body.resolvedAt = new Date().toISOString();
        return (await apiRequest("PATCH", `/api/yhsi/referrals/${id}`, body)).json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/referrals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/metrics"] });
      },
      onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">USD 259 → Turning Point → services pipeline. Logging a contact-type touchpoint auto-stamps first contact and advances the status.</p>
          <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-referral"><Plus className="h-4 w-4 mr-1" /> New referral</Button>
        </div>
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Source org</Label><Input data-testid="input-source-org" value={form.sourceOrg} onChange={(e) => setForm({ ...form, sourceOrg: e.target.value })} /></div>
              <div className="space-y-1"><Label>Destination org</Label><Input data-testid="input-destination-org" value={form.destinationOrg} onChange={(e) => setForm({ ...form, destinationOrg: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Service type</Label>
                <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
                  <SelectTrigger data-testid="select-service-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                  <SelectTrigger data-testid="select-urgency"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="crisis">Crisis</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="routine">Routine</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea data-testid="input-referral-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div><Button data-testid="button-save-referral" disabled={createMutation.isPending || !form.sourceOrg.trim() || !form.destinationOrg.trim()} onClick={() => createMutation.mutate()}>Create</Button></div>
            </CardContent>
          </Card>
        )}
        {isLoading ? <Skeleton className="h-32 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load referrals. Please try again." onRetry={() => void refetch()} />
        ) : (referrals?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-referrals-empty">No referrals yet.</p>
        ) : (
          <div className="space-y-2">
            {referrals!.map((r) => (
              <Card key={r.id} data-testid={`referral-${r.id}`}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm">{r.sourceOrg} → {r.destinationOrg}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.serviceType.replace(/_/g, " ")} · {r.urgency} · initiated {fmtDate(r.initiatedAt)} · first contact {fmtDate(r.firstContactAt)}
                      </p>
                      {r.notes && <p className="text-xs text-muted-foreground truncate max-w-xl">{r.notes}</p>}
                    </div>
                    <Select value={r.status} onValueChange={(status) => statusMutation.mutate({ id: r.id, status })}>
                      <SelectTrigger className="w-44" data-testid={`select-status-${r.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{REFERRAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <TouchpointLog referralId={r.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  // Touchpoint log — the data lives server-side (GET/POST
  // /api/yhsi/referrals/:id/touchpoints) but the page never surfaced it. Show
  // the log and let staff add a touchpoint; a contact-type touchpoint is what
  // auto-stamps firstContactAt server-side (see server/yhsi-routes.ts).
  function TouchpointLog({ referralId }: { referralId: string }) {
    const TOUCHPOINT_TYPES = ["outreach_call", "meeting", "warm_handoff", "service_start", "status_check", "closure"];
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ touchpointType: "outreach_call", summary: "" });
    const { data: touchpoints, isLoading, isError, refetch } = useQuery<any[]>({
      queryKey: ["/api/yhsi/referrals", referralId, "touchpoints"],
      enabled: open,
    });

    const addMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", `/api/yhsi/referrals/${referralId}/touchpoints`, { touchpointType: form.touchpointType, summary: form.summary || undefined })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/referrals", referralId, "touchpoints"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/referrals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/metrics"] });
        setForm({ touchpointType: "outreach_call", summary: "" });
        toast({ title: "Touchpoint logged" });
      },
      onError: (e: Error) => toast({ title: "Failed to log touchpoint", description: e.message, variant: "destructive" }),
    });

    return (
      <div className="border-t pt-2">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen((o) => !o)} data-testid={`button-touchpoints-${referralId}`}>
          {open ? "Hide" : "Show"} touchpoint log
        </Button>
        {open && (
          <div className="mt-2 space-y-2">
            {isLoading ? <Skeleton className="h-12 w-full" /> : isError ? (
              <ErrorRetry message="Couldn't load touchpoints. Please try again." onRetry={() => void refetch()} />
            ) : (touchpoints?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground" data-testid={`text-touchpoints-empty-${referralId}`}>No touchpoints logged yet.</p>
            ) : (
              <ul className="space-y-1">
                {touchpoints!.map((t) => (
                  <li key={t.id} className="text-xs text-muted-foreground" data-testid={`touchpoint-${t.id}`}>
                    <span className="font-medium">{t.touchpointType.replace(/_/g, " ")}</span> · {fmtDate(t.occurredAt)}{t.summary ? ` — ${t.summary}` : ""}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <Select value={form.touchpointType} onValueChange={(v) => setForm({ ...form, touchpointType: v })}>
                <SelectTrigger className="w-40 h-8" data-testid={`select-touchpoint-type-${referralId}`}><SelectValue /></SelectTrigger>
                <SelectContent>{TOUCHPOINT_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-8 max-w-xs" placeholder="Summary (optional)" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} data-testid={`input-touchpoint-summary-${referralId}`} />
              <Button size="sm" className="h-8" disabled={addMutation.isPending} onClick={() => addMutation.mutate()} data-testid={`button-add-touchpoint-${referralId}`}>Log touchpoint</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ParticipantsTab() {
    const PARTICIPANT_FORM_DEFAULTS = { preferredName: "", ageAtContact: "", mckinneyVentoStatus: "identified", livingSituation: "doubled_up", educationStatus: "enrolled", employmentStatus: "unknown", schoolDistrict: "USD 259", referralSource: "usd259_mckinney_vento", consentOnFile: false };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(() => loadDraft("participant", PARTICIPANT_FORM_DEFAULTS));
    useFormDraft("participant", form);
    const { data: participants, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/participants"] });

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/participants", {
        ...form,
        ageAtContact: form.ageAtContact ? Number(form.ageAtContact) : undefined,
      })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/participants"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/metrics"] });
        clearDraft("participant");
        setForm(PARTICIPANT_FORM_DEFAULTS);
        setShowForm(false);
        toast({ title: "Participant added" });
      },
      onError: (e: Error) => toast({ title: "Failed to add participant", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Youth data layer — McKinney-Vento status, housing, education, employment. PII stays here; exports are de-identified by default.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild data-testid="button-hmis-export">
              <a href="/api/yhsi/hmis/export.csv"><Download className="h-4 w-4 mr-1" /> HMIS export (de-identified)</a>
            </Button>
            <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-participant"><Plus className="h-4 w-4 mr-1" /> Add participant</Button>
          </div>
        </div>
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Preferred name</Label><Input data-testid="input-preferred-name" value={form.preferredName} onChange={(e) => setForm({ ...form, preferredName: e.target.value })} /></div>
              <div className="space-y-1"><Label>Age at contact</Label><Input data-testid="input-age" type="number" min={12} max={26} value={form.ageAtContact} onChange={(e) => setForm({ ...form, ageAtContact: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>McKinney-Vento</Label>
                <Select value={form.mckinneyVentoStatus} onValueChange={(v) => setForm({ ...form, mckinneyVentoStatus: v })}>
                  <SelectTrigger data-testid="select-mv-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{["identified", "suspected", "not_identified", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Living situation</Label>
                <Select value={form.livingSituation} onValueChange={(v) => setForm({ ...form, livingSituation: v })}>
                  <SelectTrigger data-testid="select-living"><SelectValue /></SelectTrigger>
                  <SelectContent>{["doubled_up", "shelter", "unsheltered", "transitional", "hotel_motel", "housed_at_risk", "other"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Education</Label>
                <Select value={form.educationStatus} onValueChange={(v) => setForm({ ...form, educationStatus: v })}>
                  <SelectTrigger data-testid="select-education"><SelectValue /></SelectTrigger>
                  <SelectContent>{["enrolled", "disengaged", "graduated", "ged_track", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Employment</Label>
                <Select value={form.employmentStatus} onValueChange={(v) => setForm({ ...form, employmentStatus: v })}>
                  <SelectTrigger data-testid="select-employment"><SelectValue /></SelectTrigger>
                  <SelectContent>{["employed_ft", "employed_pt", "seeking", "not_seeking", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>School district</Label><Input data-testid="input-district" value={form.schoolDistrict} onChange={(e) => setForm({ ...form, schoolDistrict: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Consent on file</Label>
                <Select value={String(form.consentOnFile)} onValueChange={(v) => setForm({ ...form, consentOnFile: v === "true" })}>
                  <SelectTrigger data-testid="select-consent"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-end"><Button data-testid="button-save-participant" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>Add</Button></div>
            </CardContent>
          </Card>
        )}
        {isLoading ? <Skeleton className="h-32 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load participants. Please try again." onRetry={() => void refetch()} />
        ) : (participants?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-participants-empty">No participants yet.</p>
        ) : (
          <div className="space-y-2">
            {participants!.map((p) => (
              <Card key={p.id} data-testid={`participant-${p.id}`}>
                <CardContent className="pt-4 pb-4 flex flex-wrap gap-2 items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{p.preferredName || p.firstName || "(no name recorded)"} {p.ageAtContact ? `· ${p.ageAtContact}` : ""}</p>
                    <div className="flex gap-1 flex-wrap">
                      {p.mckinneyVentoStatus && <Badge variant="outline">MV: {p.mckinneyVentoStatus.replace(/_/g, " ")}</Badge>}
                      {p.livingSituation && <Badge variant="secondary">{p.livingSituation.replace(/_/g, " ")}</Badge>}
                      {p.educationStatus && <Badge variant="outline">{p.educationStatus.replace(/_/g, " ")}</Badge>}
                      {!p.consentOnFile && <Badge variant="destructive">no consent on file</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Added {fmtDate(p.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  function VoiceTab() {
    const { data: entries, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/voice"] });
    const [impactDrafts, setImpactDrafts] = useState<Record<string, string>>(() => loadDraft<Record<string, string>>("voice-impact", {}));
    useFormDraft("voice-impact", impactDrafts);

    const reviewMutation = useMutation({
      mutationFn: async ({ id, status, impactNote }: { id: string; status: string; impactNote?: string }) =>
        (await apiRequest("PATCH", `/api/yhsi/voice/${id}`, impactNote !== undefined ? { status, impactNote } : { status })).json(),
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/voice"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/metrics"] });
        // Clear this entry's persisted impact draft now that it's saved.
        setImpactDrafts((prev) => {
          const next = { ...prev };
          delete next[variables.id];
          return next;
        });
        toast({ title: "Entry updated" });
      },
      onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <p className="text-sm text-muted-foreground">Marking an entry <strong>incorporated</strong> requires an impact note — that note is what the young person sees, and it's the evidence behind the HUD Youth Leadership certification.</p>
        {isLoading ? <Skeleton className="h-32 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load youth voice entries. Please try again." onRetry={() => void refetch()} />
        ) : (entries?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-voice-empty">No youth input yet. Share the Youth Voice link: <code>/youth-voice</code></p>
        ) : (
          <div className="space-y-3">
            {entries!.map((e) => (
              <Card key={e.id} data-testid={`voice-entry-${e.id}`}>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex gap-2 flex-wrap items-center">
                    <Badge variant={e.status === "incorporated" ? "default" : "outline"}>{e.status.replace(/_/g, " ")}</Badge>
                    <span className="text-sm font-medium">{e.contributorAlias || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">{e.ageRange !== "prefer_not" ? e.ageRange : ""} · {e.inputType.replace(/_/g, " ")} · {fmtDate(e.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{e.body}</p>
                  {e.impactNote && <p className="text-sm text-muted-foreground rounded bg-muted/50 p-2 whitespace-pre-wrap">Impact: {e.impactNote}</p>}
                  <div className="flex gap-2 flex-wrap items-end">
                    {e.status !== "incorporated" && (
                      <>
                        <Textarea
                          className="max-w-xl"
                          rows={2}
                          placeholder="Impact note (required to mark incorporated): what changed because of this input?"
                          value={impactDrafts[e.id] ?? ""}
                          onChange={(ev) => setImpactDrafts({ ...impactDrafts, [e.id]: ev.target.value })}
                          aria-label="Impact note"
                          data-testid={`input-impact-${e.id}`}
                        />
                        <Button size="sm" data-testid={`button-incorporate-${e.id}`}
                          disabled={!((impactDrafts[e.id] ?? "").trim()) || reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: e.id, status: "incorporated", impactNote: impactDrafts[e.id].trim() })}>
                          Mark incorporated
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-reviewed-${e.id}`} disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: e.id, status: "reviewed" })}>
                          Mark reviewed
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  function OutcomesTab() {
    const MILESTONE_LABELS: Record<string, string> = {
      at_contact: "At contact", day_30: "30 days", day_90: "90 days", day_180: "180 days", day_365: "365 days", month_6: "6 months", month_12: "12 months", exit: "Exit",
    };
    const { data: summary, isLoading, isError, refetch } = useQuery<any>({ queryKey: ["/api/yhsi/outcomes-summary"] });
    const { data: participants } = useQuery<any[]>({ queryKey: ["/api/yhsi/participants"] });
    const SNAPSHOT_FORM_DEFAULTS = { participantId: "", snapshotType: "day_90", housingStatus: "stable_permanent", educationStatus: "enrolled", employmentStatus: "unknown", hsCompletion: "on_track", postSecondaryStatus: "not_enrolled", hourlyWage: "", livableWage: "false", mentorConnections: "", mhScaleUsed: "", mhScaleScore: "" };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(() => loadDraft("snapshot", SNAPSHOT_FORM_DEFAULTS));
    useFormDraft("snapshot", form);

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", `/api/yhsi/participants/${form.participantId}/snapshots`, {
        snapshotType: form.snapshotType,
        housingStatus: form.housingStatus,
        educationStatus: form.educationStatus,
        employmentStatus: form.employmentStatus,
        hsCompletion: form.hsCompletion,
        postSecondaryStatus: form.postSecondaryStatus,
        hourlyWage: form.hourlyWage ? Number(form.hourlyWage) : undefined,
        livableWage: form.livableWage === "true",
        mentorConnections: form.mentorConnections !== "" ? Number(form.mentorConnections) : undefined,
        mhScaleUsed: form.mhScaleUsed || undefined,
        mhScaleScore: form.mhScaleScore !== "" ? Number(form.mhScaleScore) : undefined,
      })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/outcomes-summary"] });
        clearDraft("snapshot");
        setForm(SNAPSHOT_FORM_DEFAULTS);
        setShowForm(false);
        toast({ title: "Outcome milestone recorded" });
      },
      onError: (e: Error) => toast({ title: "Failed to record milestone", description: e.message, variant: "destructive" }),
    });

    const OUTCOME_ROWS: Array<{ key: string; label: string }> = [
      { key: "youthTracked", label: "Youth tracked" },
      { key: "stableHousingRate", label: "Stable housing %" },
      { key: "hsCompletionOrOnTrackRate", label: "HS completed / on track %" },
      { key: "postSecondaryRate", label: "Post-secondary / apprenticeship %" },
      { key: "employmentRate", label: "Employed %" },
      { key: "livableWageRate", label: "Livable wage %" },
      { key: "twoPlusStableAdultsRate", label: "≥2 stable adult supports %" },
      { key: "mhByScale", label: "MH (by validated scale)" },
    ];

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Longitudinal, funder-language outcomes at 30/90/180/365 days and 6/12 months. Small cohorts (&lt;5) are withheld automatically.</p>
          <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-snapshot"><Plus className="h-4 w-4 mr-1" /> Record milestone</Button>
        </div>
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Participant</Label>
                <Select value={form.participantId} onValueChange={(v) => setForm({ ...form, participantId: v })}>
                  <SelectTrigger data-testid="select-snapshot-participant"><SelectValue placeholder="Choose participant" /></SelectTrigger>
                  <SelectContent>{(participants ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.preferredName || p.firstName || p.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Milestone</Label>
                <Select value={form.snapshotType} onValueChange={(v) => setForm({ ...form, snapshotType: v })}>
                  <SelectTrigger data-testid="select-snapshot-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(MILESTONE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Housing</Label>
                <Select value={form.housingStatus} onValueChange={(v) => setForm({ ...form, housingStatus: v })}>
                  <SelectTrigger data-testid="select-snapshot-housing"><SelectValue /></SelectTrigger>
                  <SelectContent>{["stable_permanent", "stable_temporary", "doubled_up", "shelter", "unsheltered", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>HS completion</Label>
                <Select value={form.hsCompletion} onValueChange={(v) => setForm({ ...form, hsCompletion: v })}>
                  <SelectTrigger data-testid="select-snapshot-hs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["completed", "on_track", "ged_track", "disengaged", "na", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Post-secondary</Label>
                <Select value={form.postSecondaryStatus} onValueChange={(v) => setForm({ ...form, postSecondaryStatus: v })}>
                  <SelectTrigger data-testid="select-snapshot-postsec"><SelectValue /></SelectTrigger>
                  <SelectContent>{["enrolled", "apprenticeship", "applied", "not_enrolled", "na", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Employment</Label>
                <Select value={form.employmentStatus} onValueChange={(v) => setForm({ ...form, employmentStatus: v })}>
                  <SelectTrigger data-testid="select-snapshot-employment"><SelectValue /></SelectTrigger>
                  <SelectContent>{["employed_ft", "employed_pt", "seeking", "not_seeking", "unknown"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Hourly wage ($)</Label><Input data-testid="input-wage" type="number" step="0.25" min="0" value={form.hourlyWage} onChange={(e) => setForm({ ...form, hourlyWage: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Livable wage?</Label>
                <Select value={form.livableWage} onValueChange={(v) => setForm({ ...form, livableWage: v })}>
                  <SelectTrigger data-testid="select-livable"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No / N-A</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Stable adult supports (#)</Label><Input data-testid="input-mentors" type="number" min="0" max="20" value={form.mentorConnections} onChange={(e) => setForm({ ...form, mentorConnections: e.target.value })} /></div>
              <div className="space-y-1"><Label>MH scale (e.g. PHQ-9)</Label><Input data-testid="input-mh-scale" value={form.mhScaleUsed} onChange={(e) => setForm({ ...form, mhScaleUsed: e.target.value })} /></div>
              <div className="space-y-1"><Label>MH score</Label><Input data-testid="input-mh-score" type="number" value={form.mhScaleScore} onChange={(e) => setForm({ ...form, mhScaleScore: e.target.value })} /></div>
              <div className="flex items-end"><Button data-testid="button-save-snapshot" disabled={!form.participantId || createMutation.isPending} onClick={() => createMutation.mutate()}>Record</Button></div>
            </CardContent>
          </Card>
        )}
        {isLoading ? <Skeleton className="h-40 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load outcomes summary. Please try again." onRetry={() => void refetch()} />
        ) : !summary?.milestoneOrder?.length ? (
          <p className="text-sm text-muted-foreground" data-testid="text-outcomes-empty">No outcome milestones recorded yet. Record milestones at contact, then 30/90/180/365 days.</p>
        ) : (
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-outcomes">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium">Measure</th>
                    {summary.milestoneOrder.map((m: string) => <th key={m} className="py-2 px-3 font-medium">{MILESTONE_LABELS[m] || m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {OUTCOME_ROWS.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                      {summary.milestoneOrder.map((m: string) => {
                        const v = summary.byMilestone[m]?.[row.key];
                        if (row.key === "mhByScale") {
                          const scales = v && typeof v === "object" ? Object.entries(v as Record<string, { n: number; avg: number }>) : [];
                          return <td key={m} className="py-2 px-3">{scales.length === 0 ? "—" : scales.map(([s, d]) => `${s}: ${d.avg}`).join(", ")}</td>;
                        }
                        return <td key={m} className="py-2 px-3">{v === null || v === undefined ? "—" : row.key.endsWith("Rate") ? `${v}%` : v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-3">{summary.suppressionNote}</p>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  function EntitlementsTab() {
    const ENTITLEMENT_TYPES = ["chafee", "etv", "medicaid_former_foster", "fafsa_independent", "mckinney_vento_services", "snap", "other"];
    const ENT_STATUSES = ["offered", "declined", "applied", "enrolled", "denied", "ineligible"];
    const { data: summary } = useQuery<any>({ queryKey: ["/api/yhsi/entitlements/summary"] });
    const { data: entitlements, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/entitlements"] });
    const { data: participants } = useQuery<any[]>({ queryKey: ["/api/yhsi/participants"] });
    const ENTITLEMENT_FORM_DEFAULTS = { participantId: "", entitlementType: "chafee", status: "offered", annualValue: "", notes: "" };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(() => loadDraft("entitlement", ENTITLEMENT_FORM_DEFAULTS));
    useFormDraft("entitlement", form);

    const nameOf = (id: string) => {
      const p = (participants ?? []).find((x) => x.id === id);
      return p ? (p.preferredName || p.firstName || id.slice(0, 8)) : id.slice(0, 8);
    };

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", `/api/yhsi/participants/${form.participantId}/entitlements`, {
        entitlementType: form.entitlementType,
        status: form.status,
        annualValue: form.annualValue ? Number(form.annualValue) : undefined,
        notes: form.notes || undefined,
      })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/entitlements"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/entitlements/summary"] });
        clearDraft("entitlement");
        setForm(ENTITLEMENT_FORM_DEFAULTS);
        setShowForm(false);
        toast({ title: "Entitlement tracked" });
      },
      onError: (e: Error) => toast({ title: "Failed to track entitlement", description: e.message, variant: "destructive" }),
    });

    const statusMutation = useMutation({
      mutationFn: async ({ id, status }: { id: string; status: string }) => (await apiRequest("PATCH", `/api/yhsi/entitlements/${id}`, { status })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/entitlements"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/entitlements/summary"] });
      },
      onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });

    function GapChecklist({ onTrack }: { onTrack: (participantId: string, entitlementType: string) => void }) {
      const { data, error, refetch } = useQuery<any>({ queryKey: ["/api/yhsi/entitlements/gaps"] });
      if (error) return (
        <Card className="border-destructive"><CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-destructive" data-testid="text-gaps-error">Couldn't load the gap checklist — a loading error, not an empty checklist.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-gaps-retry">Retry</Button>
        </CardContent></Card>
      );
      if (!data || (data.gaps?.length ?? 0) === 0) return null;
      return (
        <Card className="border-amber-500/50" data-testid="card-gap-checklist">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">Possible entitlement gaps — {data.gaps.length} youth to review</p>
              <p className="text-xs text-muted-foreground">{data.note}</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.gaps.map((g: any) => (
                <div key={g.participantId} className="rounded-md border p-2 text-sm" data-testid={`gap-${g.participantId}`}>
                  <p className="font-medium">{g.name} <span className="text-xs text-muted-foreground">age {g.age}{g.fosterCareHistory ? " · foster care history" : ""}</span></p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {g.missing.map((m: any) => (
                      <Button key={m.key} size="sm" variant="outline" className="h-7 text-xs" title={m.why} onClick={() => onTrack(g.participantId, m.entitlementType)} data-testid={`button-gap-${g.participantId}-${m.key}`}>
                        {m.screen === "likely" ? "⚑ " : ""}{m.entitlementType.replace(/_/g, " ")} — track it
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Chafee, ETV, and other federal entitlements — track offered → applied → enrolled so every youth accesses what they're legally entitled to.</p>
          <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-entitlement"><Plus className="h-4 w-4 mr-1" /> Track entitlement</Button>
        </div>
        <GapChecklist onTrack={(participantId, entitlementType) => { setForm((f: any) => ({ ...f, participantId, entitlementType })); setShowForm(true); }} />
        {(summary?.byType?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {summary.byType.map((t: any) => (
              <Card key={t.entitlementType}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-medium">{t.entitlementType.replace(/_/g, " ").toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    Offered: {t.offeredRate != null ? `${t.offeredRate}%` : "—"} · Enrolled of offered: {t.enrolledRateOfOffered != null ? `${t.enrolledRateOfOffered}%` : "—"}
                    {t.annualDollarsToYouth != null && <> · ${Math.round(t.annualDollarsToYouth).toLocaleString()}/yr to youth</>}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Participant</Label>
                <Select value={form.participantId} onValueChange={(v) => setForm({ ...form, participantId: v })}>
                  <SelectTrigger data-testid="select-ent-participant"><SelectValue placeholder="Choose participant" /></SelectTrigger>
                  <SelectContent>{(participants ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.preferredName || p.firstName || p.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Entitlement</Label>
                <Select value={form.entitlementType} onValueChange={(v) => setForm({ ...form, entitlementType: v })}>
                  <SelectTrigger data-testid="select-ent-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{ENTITLEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Annual value ($, once enrolled)</Label><Input data-testid="input-ent-value" type="number" min="0" value={form.annualValue} onChange={(e) => setForm({ ...form, annualValue: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Input data-testid="input-ent-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex items-end"><Button data-testid="button-save-entitlement" disabled={!form.participantId || createMutation.isPending} onClick={() => createMutation.mutate()}>Track</Button></div>
            </CardContent>
          </Card>
        )}
        {isLoading ? <Skeleton className="h-32 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load entitlements. Please try again." onRetry={() => void refetch()} />
        ) : (entitlements?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-entitlements-empty">Nothing tracked yet. Every participant should have Chafee and ETV rows — even "ineligible" is worth recording.</p>
        ) : (
          <div className="space-y-2">
            {entitlements!.map((e) => (
              <Card key={e.id} data-testid={`entitlement-${e.id}`}>
                <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-3 justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{nameOf(e.participantId)} · {e.entitlementType.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">Offered {fmtDate(e.offeredAt)} {e.appliedAt && <>· applied {fmtDate(e.appliedAt)}</>} {e.enrolledAt && <>· enrolled {fmtDate(e.enrolledAt)}</>} {e.annualValue ? <>· ${Number(e.annualValue).toLocaleString()}/yr</> : null}</p>
                    {e.barriers && <p className="text-xs text-destructive">Barrier: {e.barriers}</p>}
                  </div>
                  <Select value={e.status} onValueChange={(status) => statusMutation.mutate({ id: e.id, status })}>
                    <SelectTrigger className="w-36" data-testid={`select-ent-status-${e.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{ENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  function FidelityTab() {
    const DOMAINS: Array<{ key: string; label: string }> = [
      { key: "scoreRespectAgency", label: "Respect & agency" },
      { key: "scoreStrengthsBased", label: "Strengths-based framing" },
      { key: "scoreStaffRegulation", label: "Staff self-regulation" },
      { key: "scoreGentleTransitions", label: "Gentle transitions" },
      { key: "scoreYouthVoiceChoice", label: "Youth voice & choice" },
    ];
    const { data: summary } = useQuery<any[]>({ queryKey: ["/api/yhsi/fidelity/summary"] });
    const { data: observations, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/fidelity"] });
    const FIDELITY_FORM_DEFAULTS = { observerRole: "supervisor", programArea: "", scoreRespectAgency: 3, scoreStrengthsBased: 3, scoreStaffRegulation: 3, scoreGentleTransitions: 3, scoreYouthVoiceChoice: 3, strengths: "", growthAreas: "" };
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(() => loadDraft("fidelity", FIDELITY_FORM_DEFAULTS));
    useFormDraft("fidelity", form);

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/fidelity", { ...form, strengths: form.strengths || undefined, growthAreas: form.growthAreas || undefined })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/fidelity"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/fidelity/summary"] });
        clearDraft("fidelity");
        setForm(FIDELITY_FORM_DEFAULTS);
        setShowForm(false);
        toast({ title: "Observation recorded" });
      },
      onError: (e: Error) => toast({ title: "Failed to record observation", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Quarterly trauma-informed practice fidelity — scored observations across SAMHSA-aligned domains, by staff, supervisors, or trained youth peers.</p>
          <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-observation"><Plus className="h-4 w-4 mr-1" /> New observation</Button>
        </div>
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Observer role</Label>
                <Select value={form.observerRole} onValueChange={(v) => setForm({ ...form, observerRole: v })}>
                  <SelectTrigger data-testid="select-observer-role"><SelectValue /></SelectTrigger>
                  <SelectContent>{["staff", "supervisor", "youth_peer", "external"].map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Program area</Label><Input data-testid="input-program-area" value={form.programArea} onChange={(e) => setForm({ ...form, programArea: e.target.value })} placeholder="e.g. drop-in center, housing navigation" /></div>
              {DOMAINS.map((d) => (
                <div key={d.key} className="space-y-1">
                  <Label>{d.label} (1–5)</Label>
                  <Select value={String(form[d.key])} onValueChange={(v) => setForm({ ...form, [d.key]: Number(v) })}>
                    <SelectTrigger data-testid={`select-${d.key}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1"><Label>Strengths</Label><Textarea rows={2} data-testid="input-strengths" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
              <div className="space-y-1"><Label>Growth areas</Label><Textarea rows={2} data-testid="input-growth" value={form.growthAreas} onChange={(e) => setForm({ ...form, growthAreas: e.target.value })} /></div>
              <div><Button data-testid="button-save-observation" disabled={!form.programArea.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>Record</Button></div>
            </CardContent>
          </Card>
        )}
        {(summary?.length ?? 0) > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Quarterly trend</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-fidelity-trend">
                <thead><tr className="border-b text-left"><th className="py-2 pr-4 font-medium">Quarter</th><th className="py-2 px-3">Obs.</th>{DOMAINS.map((d) => <th key={d.key} className="py-2 px-3 font-medium">{d.label}</th>)}</tr></thead>
                <tbody>
                  {summary!.map((q: any) => (
                    <tr key={q.quarter} className="border-b last:border-0">
                      <td className="py-2 pr-4">{q.quarter}</td>
                      <td className="py-2 px-3">{q.n ?? "<5"}</td>
                      <td className="py-2 px-3">{q.respectAgency ?? "—"}</td>
                      <td className="py-2 px-3">{q.strengthsBased ?? "—"}</td>
                      <td className="py-2 px-3">{q.staffRegulation ?? "—"}</td>
                      <td className="py-2 px-3">{q.gentleTransitions ?? "—"}</td>
                      <td className="py-2 px-3">{q.youthVoiceChoice ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        {isLoading ? <Skeleton className="h-24 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load fidelity observations. Please try again." onRetry={() => void refetch()} />
        ) : (observations?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-fidelity-empty">No observations yet. Aim for at least 5 per quarter so trend averages can be released.</p>
        ) : (
          <div className="space-y-2">
            {observations!.slice(0, 20).map((o) => (
              <Card key={o.id} data-testid={`observation-${o.id}`}>
                <CardContent className="pt-4 pb-4 space-y-1">
                  <div className="flex gap-2 items-center flex-wrap">
                    <Badge variant="outline">{o.observerRole.replace(/_/g, " ")}</Badge>
                    <span className="text-sm font-medium">{o.programArea}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(o.observedAt)}</span>
                    <Badge variant="secondary">avg {((Number(o.scoreRespectAgency) + Number(o.scoreStrengthsBased) + Number(o.scoreStaffRegulation) + Number(o.scoreGentleTransitions) + Number(o.scoreYouthVoiceChoice)) / 5).toFixed(1)}</Badge>
                  </div>
                  {o.growthAreas && <p className="text-xs text-muted-foreground">Growth: {o.growthAreas}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  function MilestonesPanel() {
    const MILESTONE_TYPES = ["hud_biannual_report", "project_plan_update", "budget_report", "drawdown", "site_visit", "renewal_application", "other"];
    const MILESTONE_FORM_DEFAULTS = { title: "", milestoneType: "hud_biannual_report", grantLabel: "HUD YHSI CPD-2600-DC-0035", dueAt: "" };
    const { data: milestones, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/milestones"] });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(() => loadDraft("milestone", MILESTONE_FORM_DEFAULTS));
    useFormDraft("milestone", form);

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/milestones", form)).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/milestones"] });
        clearDraft("milestone");
        setForm(MILESTONE_FORM_DEFAULTS);
        setShowForm(false);
        toast({ title: "Milestone added" });
      },
      onError: (e: Error) => toast({ title: "Failed to add milestone", description: e.message, variant: "destructive" }),
    });

    const submitMutation = useMutation({
      mutationFn: async (id: string) => (await apiRequest("PATCH", `/api/yhsi/milestones/${id}`, { status: "submitted" })).json(),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/yhsi/milestones"] }),
      onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
      mutationFn: async (id: string) => (await apiRequest("DELETE", `/api/yhsi/milestones/${id}`)).json(),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/yhsi/milestones"] }),
      onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
    });

    const alertBadge = (m: any) =>
      m.alert === "overdue" ? <Badge variant="destructive">OVERDUE {Math.abs(m.daysUntil)}d</Badge>
      : m.alert === "due_soon" ? <Badge variant="destructive">Due in {m.daysUntil}d</Badge>
      : m.alert === "approaching" ? <Badge variant="secondary">Due in {m.daysUntil}d</Badge>
      : m.status === "submitted" ? <Badge variant="outline">Submitted</Badge>
      : <Badge variant="outline">{m.daysUntil}d out</Badge>;

    return (
      <Card className={milestones?.some((m: any) => m.alert === "overdue") ? "border-destructive" : undefined}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><AlarmClock className="h-4 w-4" /> Compliance milestones</CardTitle>
            <CardDescription>Biannual HUD updates and other deadlines — missed milestones risk rescission.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)} data-testid="button-new-milestone"><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <div className="grid sm:grid-cols-4 gap-3 rounded-lg border p-3">
              <div className="space-y-1 sm:col-span-2"><Label>Title</Label><Input data-testid="input-milestone-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Biannual project plan update #1" /></div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.milestoneType} onValueChange={(v) => setForm({ ...form, milestoneType: v })}>
                  <SelectTrigger data-testid="select-milestone-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{MILESTONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Due date</Label><Input data-testid="input-milestone-due" type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-3"><Label>Grant</Label><Input data-testid="input-milestone-grant" value={form.grantLabel} onChange={(e) => setForm({ ...form, grantLabel: e.target.value })} /></div>
              <div className="flex items-end"><Button size="sm" data-testid="button-save-milestone" disabled={!form.title.trim() || !form.dueAt || createMutation.isPending} onClick={() => createMutation.mutate()}>Add</Button></div>
            </div>
          )}
          {isLoading ? <Skeleton className="h-16 w-full" /> : isError ? (
            <ErrorRetry message="Couldn't load milestones. Please try again." onRetry={() => void refetch()} />
          ) : (milestones?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-milestones-empty">No milestones yet. Add the HUD biannual report dates as soon as the award letter arrives.</p>
          ) : (
            milestones!.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border p-3" data-testid={`milestone-${m.id}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.grantLabel} · {m.milestoneType.replace(/_/g, " ")} · due {fmtDate(m.dueAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alertBadge(m)}
                  {m.status === "upcoming" && <Button size="sm" variant="outline" data-testid={`button-milestone-done-${m.id}`} disabled={submitMutation.isPending} onClick={() => submitMutation.mutate(m.id)}>Mark submitted</Button>}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid={`button-milestone-delete-${m.id}`} disabled={deleteMutation.isPending}>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete compliance milestone?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes "{m.title}" ({m.grantLabel} · due {fmtDate(m.dueAt)}). Deleted milestones aren't recoverable, and a missed HUD deadline can risk rescission. This can't be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid={`button-cancel-milestone-delete-${m.id}`}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(m.id)}
                          className="bg-destructive text-destructive-foreground"
                          data-testid={`button-confirm-milestone-delete-${m.id}`}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  function ReportsTab() {
    const REPORT_FORM_DEFAULTS = { periodStart: "", periodEnd: "" };
    const { data: reports, isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ["/api/yhsi/reports"] });
    const [period, setPeriod] = useState(() => loadDraft("report", REPORT_FORM_DEFAULTS));
    useFormDraft("report", period);
    const { periodStart, periodEnd } = period;
    const setPeriodStart = (v: string) => setPeriod((p) => ({ ...p, periodStart: v }));
    const setPeriodEnd = (v: string) => setPeriod((p) => ({ ...p, periodEnd: v }));

    const generateMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/reports/generate", { periodStart, periodEnd })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/reports"] });
        clearDraft("report");
        setPeriod(REPORT_FORM_DEFAULTS);
        toast({ title: "Draft report generated", description: "Review and edit the narrative before finalizing." });
      },
      onError: (e: Error) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
    });

    const finalizeMutation = useMutation({
      mutationFn: async (id: string) => (await apiRequest("PATCH", `/api/yhsi/reports/${id}`, { status: "final" })).json(),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/yhsi/reports"] }),
      onError: (e: Error) => toast({ title: "Finalize failed", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate biannual HUD progress report</CardTitle>
            <CardDescription>Metrics are computed from live referral + outcome data; the narrative is AI-drafted from those numbers only, then human-edited. Missing biannual reports can get YHSI funding rescinded.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap items-end">
            <div className="space-y-1"><Label>Period start</Label><Input data-testid="input-period-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
            <div className="space-y-1"><Label>Period end</Label><Input data-testid="input-period-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
            <Button data-testid="button-generate-report" disabled={!periodStart || !periodEnd || generateMutation.isPending} onClick={() => generateMutation.mutate()}>
              {generateMutation.isPending ? "Generating…" : "Generate draft"}
            </Button>
          </CardContent>
        </Card>
        {isLoading ? <Skeleton className="h-24 w-full" /> : isError ? (
          <ErrorRetry message="Couldn't load reports. Please try again." onRetry={() => void refetch()} />
        ) : (reports?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-reports-empty">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports!.map((r) => (
              <Card key={r.id} data-testid={`report-${r.id}`}>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={r.status === "final" ? "default" : "outline"}>{r.status}</Badge>
                    {r.incomplete && <Badge variant="destructive" data-testid={`badge-incomplete-${r.id}`}>Incomplete — narrative required</Badge>}
                    <span className="text-sm font-medium">{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</span>
                    {r.status !== "final" && (
                      <Button size="sm" variant="outline" data-testid={`button-finalize-${r.id}`} disabled={finalizeMutation.isPending || r.incomplete} title={r.incomplete ? "Write the report narrative before finalizing" : undefined} onClick={() => finalizeMutation.mutate(r.id)}>Finalize</Button>
                    )}
                    <Button size="sm" variant="outline" asChild data-testid={`button-pdf-${r.id}`}>
                      <a href={`/api/yhsi/reports/${r.id}/pdf`} download>Download HUD PDF</a>
                    </Button>
                  </div>
                  {r.narrative && <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Narrative</summary><p className="whitespace-pre-wrap mt-2">{r.narrative}</p></details>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }
}
