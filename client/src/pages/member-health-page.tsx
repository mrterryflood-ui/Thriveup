/**
 * Member Health Engagement Engine — Population Health Dashboard
 *
 * Plan-agnostic managed-care engagement platform: Medicaid MCO, Medicare
 * Advantage, FQHC, ACO, Commercial. Tracks HEDIS care gaps, member outreach
 * campaigns, CHW escalations, and benefit utilization in one place.
 *
 * Tabs: Overview · Members · Campaigns · CHW Queue · HEDIS Catalog
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Local fetch helpers — correct (method, url, body?) overload + JSON parse
async function meGet<T>(url: string): Promise<T> {
  const r = await apiRequest("GET", url);
  return r.json() as Promise<T>;
}
async function mePost<T>(url: string, body?: unknown): Promise<T> {
  const r = await apiRequest("POST", url, body);
  return r.json() as Promise<T>;
}
async function mePatch<T>(url: string, body?: unknown): Promise<T> {
  const r = await apiRequest("PATCH", url, body);
  return r.json() as Promise<T>;
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EvidenceSummary } from "@/components/evidence-label";
import { useToast } from "@/hooks/use-toast";
import {
  HeartPulse, Users, ClipboardList, Bell, BookOpen,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Send,
  UserPlus, Upload, Filter, ChevronRight, Activity,
  Stethoscope, Building2, Plus
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface PopulationStats {
  members: { total: number; withEmail: number; withPhone: number; optedOut: number };
  careGaps: { measureCode: string; category: string; measureName: string; priority: number; openCount: number; closedCount: number }[];
  riskDistribution: { riskTier: string; count: number }[];
  campaigns: { total: number; sent: number; avgDeliveryRate: number; avgResponseRate: number };
}

interface Member {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  riskTier: string; sdohFlags: string[]; preferredLanguage: string; addressZip: string;
  planOrgId: string; entrySource: string; createdAt: string;
  openCareGapCount?: number;
}

interface Campaign {
  id: string; name: string; status: string; channel: string;
  totalRecipients: number; totalDelivered: number; totalResponded: number;
  sentAt: string; createdAt: string; description: string;
  targetMeasureCodes: string[]; targetRiskTiers: string[];
}

interface HedisMeasure {
  id: string; measureCode: string; measureName: string; category: string;
  description: string; clinicalPriority: number; starsWeight: string;
  gapDefinition: string; closureCriteria: string; eligiblePopulation: string;
}

interface CareGapRow {
  gap: { status: string; priority: number; dueDate: string; closedAt: string };
  measure: { measureCode: string; measureName: string; category: string };
}

interface CHWEngagement {
  engagement: { id: string; status: string; priority: number; escalationReason: string; openCareGapCount: number; chwNotes: string; createdAt: string };
  member: { id: string; firstName: string; lastName: string; riskTier: string; addressZip: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  rising: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  very_high: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  Preventive: "text-blue-700",
  Chronic: "text-orange-700",
  "Behavioral Health": "text-purple-700",
  Pharmacy: "text-teal-700",
  Maternal: "text-pink-700",
  Utilization: "text-gray-700",
};

function priorityLabel(p: number) {
  return ["", "Critical", "High", "Medium", "Low", "Info"][p] ?? "Medium";
}

function riskLabel(r: string) {
  return { low: "Low", rising: "Rising", high: "High", very_high: "Very High" }[r] ?? r;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ planOrgId }: { planOrgId: string }) {
  const { data, isLoading } = useQuery<PopulationStats>({
    queryKey: ["/api/member-engagement/population", planOrgId],
    queryFn: () => meGet<PopulationStats>(`/api/member-engagement/population${planOrgId ? `?planOrgId=${planOrgId}` : ""}`),
    enabled: true,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading population data…</div>;
  if (!data) return null;

  const topGaps = (data.careGaps ?? [])
    .filter(g => g.openCount > 0)
    .sort((a, b) => a.priority - b.priority || b.openCount - a.openCount)
    .slice(0, 8);

  const riskOrder = ["very_high", "high", "rising", "low"];
  const sortedRisk = riskOrder
    .map(tier => data.riskDistribution.find(r => r.riskTier === tier))
    .filter(Boolean) as { riskTier: string; count: number }[];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Members" value={data.members?.total ?? 0} color="blue" />
        <KpiCard icon={AlertTriangle} label="Open Care Gaps" value={topGaps.reduce((s, g) => s + g.openCount, 0)} color="orange" />
        <KpiCard icon={Send} label="Campaigns Sent" value={data.campaigns?.sent ?? 0} color="green" />
        <KpiCard icon={Activity} label="Avg Response Rate" value={`${data.campaigns?.avgResponseRate ?? 0}%`} color="purple" />
      </div>
      <EvidenceSummary
        claims={[{
          value: data.members?.total ?? 0,
          unit: "members",
          source: "TCAF Platform Administrative Records",
          sourceId: "platform-program-enrollment",
          asOfDate: null,
          geographyKey: planOrgId || null,
          confidence: "verified",
          decisionCaption: "Use these administrative metrics to coordinate outreach and care-gap follow-up.",
        }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top care gaps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Open Care Gaps</CardTitle>
            <CardDescription>By HEDIS measure — sorted by clinical priority</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topGaps.length === 0 && <p className="text-sm text-muted-foreground">No open gaps recorded yet.</p>}
            {topGaps.map(g => {
              const total = g.openCount + g.closedCount;
              const closurePct = total > 0 ? Math.round((g.closedCount / total) * 100) : 0;
              return (
                <div key={g.measureCode} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <span className={`text-xs font-semibold ${CATEGORY_COLORS[g.category] ?? "text-gray-700"}`}>{g.measureCode}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{g.measureName}</div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${closurePct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-medium text-orange-600">{g.openCount} open</span>
                    <div className="text-xs text-muted-foreground">{closurePct}% closed</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Risk tier distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Member Risk Distribution</CardTitle>
            <CardDescription>Drives outreach prioritization and CHW escalation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedRisk.length === 0 && <p className="text-sm text-muted-foreground">No members enrolled yet.</p>}
            {sortedRisk.map(r => {
              const total = data.members?.total ?? 1;
              const pct = Math.round((r.count / total) * 100);
              return (
                <div key={r.riskTier} className="flex items-center gap-3">
                  <Badge className={`w-24 justify-center ${RISK_COLORS[r.riskTier]}`}>{riskLabel(r.riskTier)}</Badge>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${r.riskTier === "very_high" ? "bg-red-500" : r.riskTier === "high" ? "bg-orange-400" : r.riskTier === "rising" ? "bg-yellow-400" : "bg-green-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-semibold">{r.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Campaign performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Outreach Campaign Performance</CardTitle>
          <CardDescription>Email-first; SMS-ready when carrier account is configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Stat label="Total Campaigns" value={data.campaigns?.total ?? 0} />
            <Stat label="Campaigns Sent" value={data.campaigns?.sent ?? 0} />
            <Stat label="Avg Delivery Rate" value={`${data.campaigns?.avgDeliveryRate ?? 0}%`} />
            <Stat label="Avg Response Rate" value={`${data.campaigns?.avgResponseRate ?? 0}%`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab({ planOrgId }: { planOrgId: string }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", riskTier: "low", planOrgId });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/member-engagement/members", planOrgId, riskFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (planOrgId) params.set("planOrgId", planOrgId);
      if (riskFilter !== "all") params.set("riskTier", riskFilter);
      return meGet<Member[]>(`/api/member-engagement/members?${params}`);
    },
  });

  const addMutation = useMutation({
    mutationFn: (body: typeof form) => mePost<Member>("/api/member-engagement/members", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/member-engagement/members"] }); setAddOpen(false); toast({ title: "Member added" }); },
    onError: () => toast({ title: "Failed to add member", variant: "destructive" }),
  });

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return !q || `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Risk tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="very_high">Very High</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="rising">Rising</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><UserPlus className="h-4 w-4" />Add Member</Button>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-8">Loading members…</div>}

      <div className="space-y-2">
        {filtered.map(m => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{m.firstName} {m.lastName}</span>
                  <Badge className={RISK_COLORS[m.riskTier] ?? "bg-gray-100"}>{riskLabel(m.riskTier)}</Badge>
                  {m.sdohFlags?.slice(0, 2).map(f => (
                    <Badge key={f} variant="outline" className="text-xs">{f.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {m.email && <span className="mr-3">{m.email}</span>}
                  {m.phone && <span className="mr-3">{m.phone}</span>}
                  {m.addressZip && <span>ZIP {m.addressZip}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground capitalize">{m.entrySource?.replace(/_/g, " ")}</div>
                <div className="text-xs text-muted-foreground">{m.preferredLanguage}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No members found. Add a member or import a roster.</p>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Member Manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div>
              <Label>Risk Tier</Label>
              <Select value={form.riskTier} onValueChange={v => setForm(f => ({ ...f, riskTier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="rising">Rising</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very_high">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate({ ...form, planOrgId })} disabled={!form.firstName || !form.lastName || addMutation.isPending}>
              {addMutation.isPending ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Campaigns Tab ─────────────────────────────────────────────────────────────

function CampaignsTab({ planOrgId }: { planOrgId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", channel: "email", messageSubject: "", messageBody: "",
    callToAction: "", callToActionUrl: "", targetRiskTiers: [] as string[],
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/member-engagement/campaigns", planOrgId],
    queryFn: () => meGet<Campaign[]>(`/api/member-engagement/campaigns${planOrgId ? `?planOrgId=${planOrgId}` : ""}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form & { planOrgId: string }) =>
      mePost<Campaign>("/api/member-engagement/campaigns", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/member-engagement/campaigns"] }); setCreateOpen(false); toast({ title: "Campaign created" }); },
    onError: () => toast({ title: "Failed to create campaign", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => mePost<{ recipients: number; delivered: number }>(`/api/member-engagement/campaigns/${id}/send`),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/member-engagement/campaigns"] });
      toast({ title: `Campaign sent to ${data.recipients} members (${data.delivered} delivered)` });
    },
    onError: () => toast({ title: "Campaign send failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />New Campaign</Button>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-8">Loading campaigns…</div>}

      <div className="space-y-3">
        {campaigns.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.name}</span>
                    <Badge className={STATUS_COLORS[c.status] ?? "bg-gray-100"}>{c.status}</Badge>
                    <Badge variant="outline" className="capitalize">{c.channel}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>}
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{c.totalRecipients} recipients</span>
                    <span>{c.totalDelivered} delivered</span>
                    <span>{c.totalResponded} responded</span>
                  </div>
                </div>
                {c.status === "draft" && (
                  <Button size="sm" variant="outline" className="gap-1 shrink-0"
                    onClick={() => sendMutation.mutate(c.id)}
                    disabled={sendMutation.isPending}>
                    <Send className="h-3.5 w-3.5" />
                    {sendMutation.isPending ? "Sending…" : "Send"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && campaigns.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No campaigns yet. Create your first outreach campaign.</p>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Outreach Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Q3 Mammogram Outreach" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email (Resend)</SelectItem>
                  <SelectItem value="sms">SMS (configure carrier)</SelectItem>
                  <SelectItem value="phone">Phone / IVR</SelectItem>
                  <SelectItem value="mail">Direct Mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Email Subject</Label><Input value={form.messageSubject} onChange={e => setForm(f => ({ ...f, messageSubject: e.target.value }))} placeholder="Your annual wellness visit is overdue" /></div>
            <div>
              <Label>Message Body *</Label>
              <Textarea value={form.messageBody} onChange={e => setForm(f => ({ ...f, messageBody: e.target.value }))}
                placeholder="Hi {{firstName}}, we noticed you haven't had your annual wellness visit yet this year. Your PCP {{pcpName}} can schedule you now…"
                rows={5} />
              <p className="text-xs text-muted-foreground mt-1">Supports: {"{{firstName}}"}, {"{{lastName}}"}, {"{{pcpName}}"}, {"{{dueDate}}"}</p>
            </div>
            <div><Label>Call to Action (button text)</Label><Input value={form.callToAction} onChange={e => setForm(f => ({ ...f, callToAction: e.target.value }))} placeholder="Schedule My Appointment" /></div>
            <div><Label>CTA URL</Label><Input value={form.callToActionUrl} onChange={e => setForm(f => ({ ...f, callToActionUrl: e.target.value }))} placeholder="https://…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, planOrgId })} disabled={!form.name || !form.messageBody || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── CHW Queue Tab ─────────────────────────────────────────────────────────────

function CHWQueueTab() {
  const [statusFilter, setStatusFilter] = useState("queued");

  const { data: queue = [], isLoading } = useQuery<CHWEngagement[]>({
    queryKey: ["/api/member-engagement/chw-queue", statusFilter],
    queryFn: () => meGet<CHWEngagement[]>(`/api/member-engagement/chw-queue?status=${statusFilter}`),
  });

  const qc = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      mePatch<CHWEngagement>(`/api/member-engagement/chw-queue/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/member-engagement/chw-queue"] }); toast({ title: "Engagement updated" }); },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const ESCALATION_LABELS: Record<string, string> = {
    no_response_2_touches: "No response after 2 outreach touches",
    high_risk_flag: "High-risk flag triggered",
    new_member: "New member — introductory contact",
    member_request: "Member requested CHW support",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{queue.length} {statusFilter} engagements</span>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-8">Loading queue…</div>}

      <div className="space-y-3">
        {queue.map(({ engagement: e, member: m }) => (
          <Card key={e.id} className="border-l-4" style={{ borderLeftColor: e.priority <= 1 ? "#ef4444" : e.priority <= 2 ? "#f97316" : "#3b82f6" }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.firstName} {m.lastName}</span>
                    <Badge className={RISK_COLORS[m.riskTier] ?? "bg-gray-100"}>{riskLabel(m.riskTier)}</Badge>
                    <span className="text-xs text-muted-foreground">Priority {priorityLabel(e.priority)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ESCALATION_LABELS[e.escalationReason] ?? e.escalationReason}</p>
                  {e.openCareGapCount > 0 && (
                    <p className="text-sm mt-1"><span className="text-orange-600 font-medium">{e.openCareGapCount}</span> open care gaps</p>
                  )}
                  {e.chwNotes && <p className="text-sm italic mt-1 text-muted-foreground">"{e.chwNotes}"</p>}
                </div>
                {e.status === "queued" && (
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: e.id, body: { status: "in_progress" } })}>
                    Start
                  </Button>
                )}
                {e.status === "in_progress" && (
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: e.id, body: { status: "resolved", resolutionSummary: "Contact completed" } })}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Resolve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && queue.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No {statusFilter} engagements.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HEDIS Catalog Tab ─────────────────────────────────────────────────────────

function HEDISCatalogTab() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: measures = [], isLoading } = useQuery<HedisMeasure[]>({
    queryKey: ["/api/member-engagement/hedis-measures"],
    queryFn: () => meGet<HedisMeasure[]>("/api/member-engagement/hedis-measures"),
  });

  const categories = ["all", ...Array.from(new Set(measures.map(m => m.category)))];

  const filtered = measures.filter(m => {
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || `${m.measureCode} ${m.measureName}`.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search measure code or name…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-8">Loading HEDIS catalog…</div>}

      <div className="space-y-3">
        {filtered.map(m => (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 text-center w-16">
                  <span className={`text-lg font-bold ${CATEGORY_COLORS[m.category] ?? "text-gray-700"}`}>{m.measureCode}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">P{m.clinicalPriority}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.measureName}</span>
                    <Badge variant="outline" className="text-xs">{m.category}</Badge>
                    <Badge variant="outline" className="text-xs">⭐ {m.starsWeight}x</Badge>
                  </div>
                  {m.eligiblePopulation && <p className="text-xs text-muted-foreground mt-1 font-medium">Who: {m.eligiblePopulation}</p>}
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.gapDefinition}</p>
                  <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Closes with:</span> {m.closureCriteria}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No measures match your filter.</p>}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = { blue: "text-blue-600 bg-blue-50", orange: "text-orange-600 bg-orange-50", green: "text-green-600 bg-green-50", purple: "text-purple-600 bg-purple-50" };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ── Org Selector ──────────────────────────────────────────────────────────────

function OrgSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", planType: "mixed", contactEmail: "", state: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: orgs = [] } = useQuery<{ id: string; name: string; planType: string }[]>({
    queryKey: ["/api/member-engagement/orgs"],
    queryFn: () => meGet<{ id: string; name: string; planType: string }[]>("/api/member-engagement/orgs"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => mePost<{ id: string; name: string; planType: string }>("/api/member-engagement/orgs", body),
    onSuccess: (org: any) => {
      qc.invalidateQueries({ queryKey: ["/api/member-engagement/orgs"] });
      onChange(org.id);
      setCreateOpen(false);
      toast({ title: "Health plan org created" });
    },
    onError: () => toast({ title: "Failed to create org", variant: "destructive" }),
  });

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select health plan org…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All orgs</SelectItem>
            {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name} <span className="text-muted-foreground capitalize ml-1">({o.planType})</span></SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setCreateOpen(true)} title="Add health plan org"><Building2 className="h-4 w-4" /></Button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Health Plan Org</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Org Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Central Texas Medicaid MCO" /></div>
            <div>
              <Label>Plan Type</Label>
              <Select value={form.planType} onValueChange={v => setForm(f => ({ ...f, planType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicaid">Medicaid MCO</SelectItem>
                  <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="fqhc">FQHC</SelectItem>
                  <SelectItem value="aco">ACO</SelectItem>
                  <SelectItem value="mixed">Mixed / Multi-line</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
            <div><Label>Primary State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="TX" maxLength={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Org"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────

export default function MemberHealthPage() {
  const [planOrgId, setPlanOrgId] = useState("__all__");
  // Normalize sentinel "all orgs" value → empty string for API calls
  const effectiveOrgId = planOrgId === "__all__" ? "" : planOrgId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <HeartPulse className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Member Health Engagement</h1>
              <p className="text-sm text-muted-foreground">
                HEDIS care gap management · Outreach campaigns · CHW escalations · Benefit utilization
              </p>
            </div>
          </div>
          <div className="sm:ml-auto w-full sm:w-72">
            <OrgSelector value={planOrgId === "__all__" ? "" : planOrgId} onChange={v => setPlanOrgId(v || "__all__")} />
          </div>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5 hidden sm:block" />Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 hidden sm:block" />Members
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5 text-xs sm:text-sm">
              <Bell className="h-3.5 w-3.5 hidden sm:block" />Campaigns
            </TabsTrigger>
            <TabsTrigger value="chw-queue" className="gap-1.5 text-xs sm:text-sm">
              <Stethoscope className="h-3.5 w-3.5 hidden sm:block" />CHW Queue
            </TabsTrigger>
            <TabsTrigger value="hedis" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-3.5 w-3.5 hidden sm:block" />HEDIS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab planOrgId={effectiveOrgId} />
          </TabsContent>
          <TabsContent value="members" className="mt-6">
            <MembersTab planOrgId={effectiveOrgId} />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab planOrgId={effectiveOrgId} />
          </TabsContent>
          <TabsContent value="chw-queue" className="mt-6">
            <CHWQueueTab />
          </TabsContent>
          <TabsContent value="hedis" className="mt-6">
            <HEDISCatalogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
