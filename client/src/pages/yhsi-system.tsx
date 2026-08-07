// YHSI System Improvement — staff console for the systems-level YHSI work:
// CES (assessment/prioritization/diversion), Partner registry (MOUs),
// YAB governance (members/decisions/stipends), Sage compliance (spending caps
// + MCU export), and the HUD PIT landscape (official imported data only).
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ListOrdered, Building2, Users2, Receipt, Map, Plus, Download, Upload } from "lucide-react";

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default function YhsiSystemPage() {
  const { toast } = useToast();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="page-yhsi-system">
      <PageHeader
        title="YHSI System Improvement"
        description="Systems-level tooling: youth coordinated entry, partner MOUs, Youth Action Board governance, Sage compliance, and the KS + nationwide homelessness landscape."
      />

      <Tabs defaultValue="ces">
        <TabsList>
          <TabsTrigger value="ces" data-testid="tab-ces"><ListOrdered className="h-4 w-4 mr-1" /> CES Queue</TabsTrigger>
          <TabsTrigger value="partners" data-testid="tab-partners"><Building2 className="h-4 w-4 mr-1" /> Partners</TabsTrigger>
          <TabsTrigger value="yab" data-testid="tab-yab"><Users2 className="h-4 w-4 mr-1" /> Youth Action Board</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance"><Receipt className="h-4 w-4 mr-1" /> Sage Compliance</TabsTrigger>
          <TabsTrigger value="landscape" data-testid="tab-landscape"><Map className="h-4 w-4 mr-1" /> Landscape</TabsTrigger>
        </TabsList>

        <TabsContent value="ces" className="mt-6 space-y-6"><CesTab /></TabsContent>
        <TabsContent value="partners" className="mt-6 space-y-6"><PartnersTab /></TabsContent>
        <TabsContent value="yab" className="mt-6 space-y-6"><YabTab /></TabsContent>
        <TabsContent value="compliance" className="mt-6 space-y-6"><ComplianceTab /></TabsContent>
        <TabsContent value="landscape" className="mt-6 space-y-6"><LandscapeTab /></TabsContent>
      </Tabs>
    </div>
  );

  // ═══ CES ═══════════════════════════════════════════════════════════════
  function CesTab() {
    const { data: queue, isLoading, error: queueError, refetch: refetchQueue } = useQuery<any[]>({ queryKey: ["/api/yhsi/ces/queue"] });
    const { data: summary } = useQuery<any>({ queryKey: ["/api/yhsi/ces/summary"] });
    const { data: participants } = useQuery<any[]>({ queryKey: ["/api/yhsi/participants"] });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>({ participantId: "", assessmentType: "ty_vi_spdat", acuityScore: "", prioritizationTier: "medium", diversionAttempted: false, diversionOutcome: "pending", notes: "" });

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", `/api/yhsi/participants/${form.participantId}/ces-assessments`, {
        assessmentType: form.assessmentType,
        acuityScore: Number(form.acuityScore),
        prioritizationTier: form.prioritizationTier,
        diversionAttempted: form.diversionAttempted,
        diversionOutcome: form.diversionAttempted ? form.diversionOutcome : undefined,
        notes: form.notes || undefined,
      })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/ces/queue"] });
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/ces/summary"] });
        setShowForm(false);
        toast({ title: "Assessment recorded" });
      },
      onError: (e: Error) => toast({ title: "Failed to record assessment", description: e.message, variant: "destructive" }),
    });

    const tierBadge = (t: string) => t === "high" ? <Badge variant="destructive">HIGH</Badge> : t === "medium" ? <Badge variant="secondary">MED</Badge> : <Badge variant="outline">LOW</Badge>;

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Youth-specific coordinated entry: standardized assessment, prioritization by tier + acuity, and family/kin diversion first.</p>
          <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-assessment"><Plus className="h-4 w-4 mr-1" /> New assessment</Button>
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Assessments" value={summary.assessments ?? "<5"} />
            <StatCard label="Diversion attempted" value={summary.diversionAttemptRate != null ? `${summary.diversionAttemptRate}%` : "—"} />
            <StatCard label="Diversion success" value={summary.diversionSuccessRate != null ? `${summary.diversionSuccessRate}%` : "—"} />
            <StatCard label="High acuity share" value={summary.highAcuityShare != null ? `${summary.highAcuityShare}%` : "—"} />
          </div>
        )}
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Participant</Label>
                <Select value={form.participantId} onValueChange={(v) => setForm({ ...form, participantId: v })}>
                  <SelectTrigger data-testid="select-ces-participant"><SelectValue placeholder="Choose participant" /></SelectTrigger>
                  <SelectContent>{(participants ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.preferredName || p.firstName || p.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tool</Label>
                <Select value={form.assessmentType} onValueChange={(v) => setForm({ ...form, assessmentType: v })}>
                  <SelectTrigger data-testid="select-ces-tool"><SelectValue /></SelectTrigger>
                  <SelectContent>{["ty_vi_spdat", "next_step_tool", "local_youth_tool", "other"].map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Acuity score (0–100)</Label><Input data-testid="input-acuity" type="number" min="0" max="100" value={form.acuityScore} onChange={(e) => setForm({ ...form, acuityScore: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Prioritization tier</Label>
                <Select value={form.prioritizationTier} onValueChange={(v) => setForm({ ...form, prioritizationTier: v })}>
                  <SelectTrigger data-testid="select-ces-tier"><SelectValue /></SelectTrigger>
                  <SelectContent>{["high", "medium", "low"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex items-end gap-2 pb-1">
                <Checkbox id="diversion" checked={form.diversionAttempted} onCheckedChange={(c) => setForm({ ...form, diversionAttempted: c === true })} data-testid="checkbox-diversion" />
                <Label htmlFor="diversion">Diversion attempted</Label>
              </div>
              {form.diversionAttempted && (
                <div className="space-y-1">
                  <Label>Diversion outcome</Label>
                  <Select value={form.diversionOutcome} onValueChange={(v) => setForm({ ...form, diversionOutcome: v })}>
                    <SelectTrigger data-testid="select-diversion-outcome"><SelectValue /></SelectTrigger>
                    <SelectContent>{["diverted_family", "diverted_kin", "diverted_other", "not_diverted", "pending"].map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Input data-testid="input-ces-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex items-end"><Button data-testid="button-save-assessment" disabled={!form.participantId || form.acuityScore === "" || createMutation.isPending} onClick={() => createMutation.mutate()}>Record</Button></div>
            </CardContent>
          </Card>
        )}
        {queueError ? <QueryError label="the CES queue" onRetry={() => refetchQueue()} /> : isLoading ? <Skeleton className="h-32 w-full" /> : (queue?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-ces-empty">No assessments yet. The queue orders youth by tier, then acuity — highest need first.</p>
        ) : (
          <div className="space-y-2">
            {queue!.map((q, i) => (
              <Card key={q.id} data-testid={`ces-row-${q.id}`}>
                <CardContent className="pt-4 pb-4 flex items-center gap-3 justify-between flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-muted-foreground w-8">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{q.preferredName || q.firstName || q.participantId.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{q.assessmentType.replace(/_/g, " ").toUpperCase()} · score {q.acuityScore} · assessed {fmtDate(q.assessedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.diversionAttempted && <Badge variant="outline">{(q.diversionOutcome ?? "pending").replace(/_/g, " ")}</Badge>}
                    {tierBadge(q.prioritizationTier)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  // ═══ Partners ══════════════════════════════════════════════════════════
  function PartnersTab() {
    const SYSTEM_TYPES = ["k12_mckinney_vento", "child_welfare", "juvenile_justice", "workforce", "coc_hmis", "healthcare", "housing_provider", "other"];
    const MOU_STATUSES = ["none", "drafting", "signed", "expired"];
    const { data: partners, isLoading, error: partnersError, refetch: refetchPartners } = useQuery<any[]>({ queryKey: ["/api/yhsi/partners"] });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>({ name: "", systemType: "k12_mckinney_vento", contactName: "", contactEmail: "", contactPhone: "", mouStatus: "none", mouExpiresAt: "", dataSharing: false, notes: "" });

    const createMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/partners", {
        ...form,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        mouExpiresAt: form.mouExpiresAt || undefined,
        notes: form.notes || undefined,
      })).json(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/partners"] });
        setShowForm(false);
        toast({ title: "Partner added" });
      },
      onError: (e: Error) => toast({ title: "Failed to add partner", description: e.message, variant: "destructive" }),
    });

    const mouMutation = useMutation({
      mutationFn: async ({ id, mouStatus }: { id: string; mouStatus: string }) => (await apiRequest("PATCH", `/api/yhsi/partners/${id}`, { mouStatus })).json(),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/yhsi/partners"] }),
      onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Every institution a youth can fall through the cracks between: K-12 McKinney-Vento, child welfare, juvenile justice, workforce, CoC/HMIS. MOU + data-sharing status per partner, with 60-day expiry alerts.</p>
          <Button size="sm" onClick={() => setShowForm((s) => !s)} data-testid="button-new-partner"><Plus className="h-4 w-4 mr-1" /> Add partner</Button>
        </div>
        {showForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2"><Label>Organization</Label><Input data-testid="input-partner-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. USD 259 McKinney-Vento Program" /></div>
              <div className="space-y-1">
                <Label>System type</Label>
                <Select value={form.systemType} onValueChange={(v) => setForm({ ...form, systemType: v })}>
                  <SelectTrigger data-testid="select-partner-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{SYSTEM_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Contact name</Label><Input data-testid="input-partner-contact" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input data-testid="input-partner-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input data-testid="input-partner-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>MOU status</Label>
                <Select value={form.mouStatus} onValueChange={(v) => setForm({ ...form, mouStatus: v })}>
                  <SelectTrigger data-testid="select-partner-mou"><SelectValue /></SelectTrigger>
                  <SelectContent>{MOU_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>MOU expires</Label><Input data-testid="input-partner-mou-expiry" type="date" value={form.mouExpiresAt} onChange={(e) => setForm({ ...form, mouExpiresAt: e.target.value })} /></div>
              <div className="space-y-1 flex items-end gap-2 pb-1">
                <Checkbox id="datasharing" checked={form.dataSharing} onCheckedChange={(c) => setForm({ ...form, dataSharing: c === true })} data-testid="checkbox-data-sharing" />
                <Label htmlFor="datasharing">Data-sharing agreement in place</Label>
              </div>
              <div className="flex items-end"><Button data-testid="button-save-partner" disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>Add</Button></div>
            </CardContent>
          </Card>
        )}
        {partnersError ? <QueryError label="the partner registry" onRetry={() => refetchPartners()} /> : isLoading ? <Skeleton className="h-32 w-full" /> : (partners?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-partners-empty">No partners registered. Start with USD 259, Turning Point, the CoC lead agency (KS-502), DCF, and the workforce board.</p>
        ) : (
          <div className="space-y-2">
            {partners!.map((p) => (
              <Card key={p.id} data-testid={`partner-${p.id}`} className={p.mouAlert === "expired" ? "border-destructive" : undefined}>
                <CardContent className="pt-4 pb-4 flex items-center gap-3 justify-between flex-wrap">
                  <div>
                    <p className="text-sm font-medium">{p.name} <Badge variant="outline" className="ml-1">{p.systemType.replace(/_/g, " ")}</Badge></p>
                    <p className="text-xs text-muted-foreground">
                      {p.contactName || "No contact"} {p.contactEmail && `· ${p.contactEmail}`} {p.mouExpiresAt && `· MOU expires ${fmtDate(p.mouExpiresAt)}`}
                      {p.dataSharing && " · data-sharing ✓"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.mouAlert === "expiring_soon" && <Badge variant="destructive">MOU expires in {p.daysToExpiry}d</Badge>}
                    {p.mouAlert === "expired" && <Badge variant="destructive">MOU EXPIRED</Badge>}
                    <Select value={p.mouStatus} onValueChange={(mouStatus) => mouMutation.mutate({ id: p.id, mouStatus })}>
                      <SelectTrigger className="w-28" data-testid={`select-mou-${p.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{MOU_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  // ═══ YAB ═══════════════════════════════════════════════════════════════
  function YabTab() {
    const { data: summary } = useQuery<any>({ queryKey: ["/api/yhsi/yab/summary"] });
    const { data: members, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useQuery<any[]>({ queryKey: ["/api/yhsi/yab/members"] });
    const { data: decisions, error: decisionsError, refetch: refetchDecisions } = useQuery<any[]>({ queryKey: ["/api/yhsi/yab/decisions"] });
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [showDecisionForm, setShowDecisionForm] = useState(false);
    const [memberForm, setMemberForm] = useState<any>({ displayName: "", role: "member", stipendRate: "" });
    const [decisionForm, setDecisionForm] = useState<any>({ meetingDate: "", topic: "", decision: "", voteSummary: "" });
    const [stipendMember, setStipendMember] = useState<string>("");
    const [stipendAmount, setStipendAmount] = useState<string>("");

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yhsi/yab/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yhsi/yab/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yhsi/yab/decisions"] });
    };

    const memberMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/yab/members", { displayName: memberForm.displayName, role: memberForm.role, stipendRate: memberForm.stipendRate ? Number(memberForm.stipendRate) : undefined })).json(),
      onSuccess: () => { invalidate(); setShowMemberForm(false); toast({ title: "Member added" }); },
      onError: (e: Error) => toast({ title: "Failed to add member", description: e.message, variant: "destructive" }),
    });
    const decisionMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/yab/decisions", { ...decisionForm, voteSummary: decisionForm.voteSummary || undefined })).json(),
      onSuccess: () => { invalidate(); setShowDecisionForm(false); toast({ title: "Decision recorded" }); },
      onError: (e: Error) => toast({ title: "Failed to record decision", description: e.message, variant: "destructive" }),
    });
    const decisionStatusMutation = useMutation({
      mutationFn: async ({ id, body }: { id: string; body: any }) => (await apiRequest("PATCH", `/api/yhsi/yab/decisions/${id}`, body)).json(),
      onSuccess: invalidate,
      onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });
    const stipendMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/yab/stipends", { memberId: stipendMember, amount: Number(stipendAmount), purpose: "meeting" })).json(),
      onSuccess: () => { invalidate(); setStipendAmount(""); toast({ title: "Stipend recorded" }); },
      onError: (e: Error) => toast({ title: "Failed to record stipend", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <p className="text-sm text-muted-foreground">Authentic youth governance: membership, per-meeting stipends (paid, not symbolic), and a decisions log proving co-design authority — the YHSI compliance backbone.</p>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Active members" value={summary.activeMembers} />
            <StatCard label="Decisions adopted" value={summary.adoptionRate != null ? `${summary.adoptionRate}%` : "—"} />
            <StatCard label="Co-design sign-offs" value={summary.coDesignSignoffs} />
            <StatCard label="Stipends YTD" value={`$${Number(summary.stipendYtdPaid ?? 0).toLocaleString()}`} />
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Members</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowMemberForm((s) => !s)} data-testid="button-new-member"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showMemberForm && (
                <div className="grid gap-2 rounded-lg border p-3">
                  <div className="space-y-1"><Label>Display name / alias</Label><Input data-testid="input-member-name" value={memberForm.displayName} onChange={(e) => setMemberForm({ ...memberForm, displayName: e.target.value })} placeholder="Chosen name — legal name never required" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Role</Label>
                      <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v })}>
                        <SelectTrigger data-testid="select-member-role"><SelectValue /></SelectTrigger>
                        <SelectContent>{["member", "co_chair", "chair"].map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Stipend/meeting ($)</Label><Input data-testid="input-member-stipend" type="number" min="0" value={memberForm.stipendRate} onChange={(e) => setMemberForm({ ...memberForm, stipendRate: e.target.value })} /></div>
                  </div>
                  <Button size="sm" data-testid="button-save-member" disabled={!memberForm.displayName.trim() || memberMutation.isPending} onClick={() => memberMutation.mutate()}>Add member</Button>
                </div>
              )}
              {membersError ? <QueryError label="YAB members" onRetry={() => refetchMembers()} /> : membersLoading ? <Skeleton className="h-16 w-full" /> : (members?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-members-empty">No members yet.</p>
              ) : members!.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border p-2" data-testid={`member-${m.id}`}>
                  <div>
                    <p className="text-sm font-medium">{m.displayName} <Badge variant="outline" className="ml-1">{m.role.replace(/_/g, " ")}</Badge></p>
                    <p className="text-xs text-muted-foreground">joined {fmtDate(m.joinedAt)}{m.stipendRate ? ` · $${m.stipendRate}/meeting` : ""}</p>
                  </div>
                  <Badge variant={m.status === "active" ? "secondary" : "outline"}>{m.status}</Badge>
                </div>
              ))}
              {(members?.length ?? 0) > 0 && (
                <div className="flex gap-2 items-end pt-2 border-t">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Record stipend payment</Label>
                    <Select value={stipendMember} onValueChange={setStipendMember}>
                      <SelectTrigger data-testid="select-stipend-member"><SelectValue placeholder="Member" /></SelectTrigger>
                      <SelectContent>{members!.map((m) => <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input className="w-24" data-testid="input-stipend-amount" type="number" min="0" placeholder="$" value={stipendAmount} onChange={(e) => setStipendAmount(e.target.value)} />
                  <Button size="sm" data-testid="button-pay-stipend" disabled={!stipendMember || !stipendAmount || stipendMutation.isPending} onClick={() => stipendMutation.mutate()}>Record</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Decisions log</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowDecisionForm((s) => !s)} data-testid="button-new-decision"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showDecisionForm && (
                <div className="grid gap-2 rounded-lg border p-3">
                  <div className="space-y-1"><Label>Meeting date</Label><Input data-testid="input-decision-date" type="date" value={decisionForm.meetingDate} onChange={(e) => setDecisionForm({ ...decisionForm, meetingDate: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Topic</Label><Input data-testid="input-decision-topic" value={decisionForm.topic} onChange={(e) => setDecisionForm({ ...decisionForm, topic: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Decision</Label><Textarea rows={2} data-testid="input-decision-text" value={decisionForm.decision} onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Vote summary</Label><Input data-testid="input-decision-vote" value={decisionForm.voteSummary} onChange={(e) => setDecisionForm({ ...decisionForm, voteSummary: e.target.value })} placeholder="e.g. 7 for / 1 against / 2 abstain" /></div>
                  <Button size="sm" data-testid="button-save-decision" disabled={!decisionForm.meetingDate || !decisionForm.topic.trim() || !decisionForm.decision.trim() || decisionMutation.isPending} onClick={() => decisionMutation.mutate()}>Record decision</Button>
                </div>
              )}
              {decisionsError ? <QueryError label="the decisions log" onRetry={() => refetchDecisions()} /> : (decisions?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-decisions-empty">No decisions logged yet.</p>
              ) : decisions!.slice(0, 15).map((d) => (
                <div key={d.id} className="rounded-lg border p-3 space-y-1" data-testid={`decision-${d.id}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium flex-1">{d.topic}</p>
                    <Select value={d.status} onValueChange={(status) => decisionStatusMutation.mutate({ id: d.id, body: { status } })}>
                      <SelectTrigger className="w-32" data-testid={`select-decision-status-${d.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{["proposed", "adopted", "implemented", "declined"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">{fmtDate(d.meetingDate)} {d.voteSummary && `· ${d.voteSummary}`}</p>
                  <p className="text-xs">{d.decision}</p>
                  <div className="flex items-center gap-2">
                    <Checkbox id={`signoff-${d.id}`} checked={d.coDesignSignoff} onCheckedChange={(c) => decisionStatusMutation.mutate({ id: d.id, body: { coDesignSignoff: c === true } })} data-testid={`checkbox-signoff-${d.id}`} />
                    <Label htmlFor={`signoff-${d.id}`} className="text-xs">Youth co-design sign-off on final implementation</Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // ═══ Sage compliance ═════════════════════════════════════════════════════
  function ComplianceTab() {
    const { data: summary, isLoading, error: summaryError, refetch: refetchSummary } = useQuery<any>({ queryKey: ["/api/yhsi/sage/spending-summary"] });
    const [showCatForm, setShowCatForm] = useState(false);
    const [catForm, setCatForm] = useState<any>({ category: "", capPercent: "", budgetedAmount: "" });
    const [entryCat, setEntryCat] = useState("");
    const [entryAmount, setEntryAmount] = useState("");
    const [entryDesc, setEntryDesc] = useState("");

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/yhsi/sage/spending-summary"] });
    const catMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/sage/categories", { category: catForm.category, capPercent: catForm.capPercent ? Number(catForm.capPercent) : undefined, budgetedAmount: Number(catForm.budgetedAmount) })).json(),
      onSuccess: () => { invalidate(); setShowCatForm(false); toast({ title: "Category added" }); },
      onError: (e: Error) => toast({ title: "Failed to add category", description: e.message, variant: "destructive" }),
    });
    const entryMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/sage/entries", { categoryId: entryCat, amount: Number(entryAmount), description: entryDesc })).json(),
      onSuccess: () => { invalidate(); setEntryAmount(""); setEntryDesc(""); toast({ title: "Spending recorded" }); },
      onError: (e: Error) => toast({ title: "Failed to record spending", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Eligible-activity spending vs. federal caps, plus a Sage-ready Milestone Chart Update (MCU) export. Missed caps and milestones are how grants get rescinded.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowCatForm((s) => !s)} data-testid="button-new-category"><Plus className="h-4 w-4 mr-1" /> Category</Button>
            <Button size="sm" asChild data-testid="button-mcu-export"><a href="/api/yhsi/sage/mcu-export"><Download className="h-4 w-4 mr-1" /> MCU export (CSV)</a></Button>
          </div>
        </div>
        {showCatForm && (
          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-4 gap-3">
              <div className="space-y-1 sm:col-span-2"><Label>Category</Label><Input data-testid="input-cat-name" value={catForm.category} onChange={(e) => setCatForm({ ...catForm, category: e.target.value })} placeholder="e.g. Admin (10% cap)" /></div>
              <div className="space-y-1"><Label>Federal cap % (blank = none)</Label><Input data-testid="input-cat-cap" type="number" min="0" max="100" value={catForm.capPercent} onChange={(e) => setCatForm({ ...catForm, capPercent: e.target.value })} /></div>
              <div className="space-y-1"><Label>Budgeted ($)</Label><Input data-testid="input-cat-budget" type="number" min="0" value={catForm.budgetedAmount} onChange={(e) => setCatForm({ ...catForm, budgetedAmount: e.target.value })} /></div>
              <div className="flex items-end"><Button data-testid="button-save-category" disabled={!catForm.category.trim() || !catForm.budgetedAmount || catMutation.isPending} onClick={() => catMutation.mutate()}>Add</Button></div>
            </CardContent>
          </Card>
        )}
        {summaryError ? <QueryError label="the spending summary" onRetry={() => refetchSummary()} /> : isLoading ? <Skeleton className="h-32 w-full" /> : (summary?.categories?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-compliance-empty">No spending categories yet. Set up the budget structure from the award letter (including the admin cap).</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total budget" value={`$${Number(summary.totalBudget).toLocaleString()}`} />
              <StatCard label="Total spent" value={`$${Number(summary.totalSpent).toLocaleString()}`} />
            </div>
            <div className="space-y-2">
              {summary.categories.map((c: any) => (
                <Card key={c.id} data-testid={`category-${c.id}`} className={c.overCap || c.overBudget ? "border-destructive" : undefined}>
                  <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">{c.category} {c.capPercent != null && <Badge variant="outline" className="ml-1">cap {c.capPercent}%</Badge>}</p>
                      <p className="text-xs text-muted-foreground">${Number(c.spent).toLocaleString()} of ${Number(c.budgetedAmount).toLocaleString()} ({c.utilizationPct ?? 0}%)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.overCap && <Badge variant="destructive">OVER FEDERAL CAP</Badge>}
                      {c.overBudget && !c.overCap && <Badge variant="destructive">Over budget</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="pt-6 flex gap-2 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-40">
                  <Label>Record spending</Label>
                  <Select value={entryCat} onValueChange={setEntryCat}>
                    <SelectTrigger data-testid="select-entry-category"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{summary.categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.category}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input className="w-28" data-testid="input-entry-amount" type="number" min="0" placeholder="$" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} />
                <Input className="flex-1 min-w-40" data-testid="input-entry-desc" placeholder="Description" value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} />
                <Button data-testid="button-save-entry" disabled={!entryCat || !entryAmount || !entryDesc.trim() || entryMutation.isPending} onClick={() => entryMutation.mutate()}>Record</Button>
              </CardContent>
            </Card>
          </>
        )}
      </>
    );
  }

  // ═══ Landscape ═══════════════════════════════════════════════════════════
  function LandscapeTab() {
    const [stateCode, setStateCode] = useState("KS");
    const { data: national, isLoading, error: nationalError, refetch: refetchNational } = useQuery<any>({ queryKey: ["/api/yhsi/pit/national"] });
    const { data: stateData } = useQuery<any>({ queryKey: [`/api/yhsi/pit/state/${stateCode}`] });
    const [showImport, setShowImport] = useState(false);
    const [importForm, setImportForm] = useState<any>({ source: "", year: String(new Date().getFullYear() - 1), csv: "" });

    const importMutation = useMutation({
      mutationFn: async () => (await apiRequest("POST", "/api/yhsi/pit/import", { source: importForm.source, year: Number(importForm.year), csv: importForm.csv })).json(),
      onSuccess: (r: any) => {
        queryClient.invalidateQueries({ queryKey: ["/api/yhsi/pit/national"] });
        queryClient.invalidateQueries({ queryKey: [`/api/yhsi/pit/state/${stateCode}`] });
        setShowImport(false);
        toast({ title: `Imported ${r.imported} CoCs`, description: r.skipped ? `${r.skipped} non-CoC rows skipped` : undefined });
      },
      onError: (e: Error) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
    });

    return (
      <>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Kansas + nationwide youth homelessness from HUD's official Point-in-Time counts. Data appears here only after importing the official HUD file — nothing is estimated or invented.</p>
          <Button size="sm" variant="outline" onClick={() => setShowImport((s) => !s)} data-testid="button-import-pit"><Upload className="h-4 w-4 mr-1" /> Import HUD PIT CSV</Button>
        </div>
        {showImport && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="text-xs text-muted-foreground">Download "PIT Counts by CoC" from huduser.gov, open the year's sheet, save as CSV, and paste it below. Column headers are matched automatically.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2"><Label>Source (filename or URL of the HUD file)</Label><Input data-testid="input-pit-source" value={importForm.source} onChange={(e) => setImportForm({ ...importForm, source: e.target.value })} placeholder="2007-2024-PIT-Counts-by-CoC.xlsx (huduser.gov)" /></div>
                <div className="space-y-1"><Label>PIT year</Label><Input data-testid="input-pit-year" type="number" min="2007" value={importForm.year} onChange={(e) => setImportForm({ ...importForm, year: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>CSV content</Label><Textarea rows={6} data-testid="input-pit-csv" value={importForm.csv} onChange={(e) => setImportForm({ ...importForm, csv: e.target.value })} placeholder="CoC Number,CoC Name,Overall Homeless, 2024,..." /></div>
              <Button data-testid="button-run-import" disabled={!importForm.source.trim() || !importForm.csv.trim() || importMutation.isPending} onClick={() => importMutation.mutate()}>{importMutation.isPending ? "Importing…" : "Import"}</Button>
            </CardContent>
          </Card>
        )}
        {nationalError ? <QueryError label="the PIT landscape data" onRetry={() => refetchNational()} /> : isLoading ? <Skeleton className="h-32 w-full" /> : !national?.year ? (
          <p className="text-sm text-muted-foreground" data-testid="text-landscape-empty">{national?.note ?? "No PIT data imported yet."}</p>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">PIT {national.year}</Badge>
              <span className="text-xs text-muted-foreground">Source: {national.source}</span>
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-xs">State drill-down</Label>
                <Input className="w-16" maxLength={2} data-testid="input-state-code" value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase())} />
              </div>
            </div>
            {stateData?.cocs?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">{stateCode} continuums of care</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-state-cocs">
                    <thead><tr className="border-b text-left"><th className="py-2 pr-4 font-medium">CoC</th><th className="py-2 px-3">Year</th><th className="py-2 px-3">Overall</th><th className="py-2 px-3">Unaccompanied youth &lt;25</th><th className="py-2 px-3">Unsheltered</th></tr></thead>
                    <tbody>
                      {stateData.cocs.map((c: any) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{c.cocNumber} — {c.cocName}</td>
                          <td className="py-2 px-3">{c.year}</td>
                          <td className="py-2 px-3">{c.overallHomeless?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-3">{c.unaccompaniedYouthUnder25?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-3">{c.unshelteredHomeless?.toLocaleString() ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base">Nationwide by state ({national.year})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-national">
                  <thead><tr className="border-b text-left"><th className="py-2 pr-4 font-medium">State</th><th className="py-2 px-3">CoCs</th><th className="py-2 px-3">Overall homeless</th><th className="py-2 px-3">Unaccompanied youth &lt;25</th><th className="py-2 px-3">Unsheltered</th></tr></thead>
                  <tbody>
                    {national.states.map((s: any) => (
                      <tr key={s.state} className={`border-b last:border-0 ${s.state === stateCode ? "bg-muted/50" : ""}`}>
                        <td className="py-2 pr-4 font-medium">{s.state}</td>
                        <td className="py-2 px-3">{s.cocs}</td>
                        <td className="py-2 px-3">{s.overallHomeless.toLocaleString()}</td>
                        <td className="py-2 px-3">{s.unaccompaniedYouthUnder25.toLocaleString()}</td>
                        <td className="py-2 px-3">{s.unshelteredHomeless.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </>
    );
  }

  // A failed request must never masquerade as "no records" — staff could
  // mistake an outage for absence of youth or financial data.
  function QueryError({ label, onRetry }: { label: string; onRetry: () => void }) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-destructive" data-testid="text-query-error">Couldn't load {label}. This is a loading error — it does not mean there are no records.</p>
          <Button size="sm" variant="outline" onClick={onRetry} data-testid="button-retry">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  function StatCard({ label, value }: { label: string; value: any }) {
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value ?? "—"}</p>
        </CardContent>
      </Card>
    );
  }
}
