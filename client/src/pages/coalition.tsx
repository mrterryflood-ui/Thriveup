import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, CheckCircle2, Building2, Calendar, Target,
  BarChart3, DollarSign, TrendingUp, Shield, ClipboardList,
  Trash2, MapPin, Mail, Phone, UserPlus, Briefcase,
} from "lucide-react";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import type {
  Coalition, CoalitionSector, CoalitionMember, CoalitionMeeting,
  CoalitionActionItem, CoalitionCapacityAssessment, CommunityActionPlan,
  CostMatchRecord, CommunityPartner,
} from "@shared/schema";

type TabId = "overview" | "sectors" | "meetings" | "capacity" | "plans" | "cost-match" | "sustainability";

interface DashboardData {
  sectorCoverage: number;
  representedSectors: number;
  totalSectors: number;
  totalMembers: number;
  totalMeetings: number;
  completedMeetings: number;
  totalActionItems: number;
  completedActions: number;
  latestCapacityScore: number;
  totalCostMatch: number;
  totalPlans: number;
  capacityTrend: Array<{ score: number; date: string }>;
}

const SPF_PHASES = [
  { value: "assessment", label: "Assessment", description: "Assess community needs and resources" },
  { value: "capacity", label: "Capacity Building", description: "Build coalition capacity and infrastructure" },
  { value: "planning", label: "Planning", description: "Develop strategic prevention plan" },
  { value: "implementation", label: "Implementation", description: "Execute prevention strategies" },
  { value: "evaluation", label: "Evaluation", description: "Measure outcomes and refine approach" },
];

const CONTRIBUTION_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "in_kind", label: "In-Kind" },
  { value: "volunteer_hours", label: "Volunteer Hours" },
  { value: "partner_contribution", label: "Partner Contribution" },
];

export default function CoalitionPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [coalitionId, setCoalitionId] = useState<string | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [memberData, setMemberData] = useState({ coalitionId: "", sectorId: "", partnerId: "", memberName: "", role: "", organization: "", email: "", phone: "" });
  const [meetingData, setMeetingData] = useState({ coalitionId: "", title: "", scheduledDate: "", location: "", agenda: "", minutes: "", attendeeIds: [] as string[], status: "scheduled" });
  const [planData, setPlanData] = useState({ coalitionId: "", title: "", spfPhase: "assessment", status: "draft", goals: "", objectives: "", strategies: "", responsibleParties: "", timeline: "", evaluationMetrics: "" });
  const [costData, setCostData] = useState({ coalitionId: "", contributorName: "", contributionType: "cash", description: "", dollarValue: "", hoursContributed: "", dateRecorded: "" });
  const [assessmentData, setAssessmentData] = useState({ coalitionId: "", organizationalCapacity: 50, leadershipEffectiveness: 50, substanceAbuseKnowledge: 50, communityEngagement: 50 });

  const { data: rawAllCoalitions, isLoading: coalitionsLoading } = useQuery<Coalition[]>({ queryKey: ["/api/coalitions"] });
  const allCoalitions = rawAllCoalitions ?? [];

  useEffect(() => {
    if (allCoalitions.length > 0 && !coalitionId) {
      setCoalitionId(allCoalitions[0].id);
    }
  }, [allCoalitions, coalitionId]);

  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ["/api/coalitions", coalitionId, "dashboard"],
    enabled: !!coalitionId,
  });
  const { data: rawSectors } = useQuery<CoalitionSector[]>({
    queryKey: ["/api/coalitions", coalitionId, "sectors"],
    enabled: !!coalitionId,
  });
  const sectors = rawSectors ?? [];
  const { data: rawMembers } = useQuery<CoalitionMember[]>({
    queryKey: ["/api/coalitions", coalitionId, "members"],
    enabled: !!coalitionId,
  });
  const members = rawMembers ?? [];
  const { data: rawMeetings } = useQuery<CoalitionMeeting[]>({
    queryKey: ["/api/coalitions", coalitionId, "meetings"],
    enabled: !!coalitionId,
  });
  const meetings = rawMeetings ?? [];
  const { data: rawActionItems } = useQuery<CoalitionActionItem[]>({
    queryKey: ["/api/coalitions", coalitionId, "action-items"],
    enabled: !!coalitionId,
  });
  const actionItems = rawActionItems ?? [];
  const { data: rawAssessments } = useQuery<CoalitionCapacityAssessment[]>({
    queryKey: ["/api/coalitions", coalitionId, "capacity-assessments"],
    enabled: !!coalitionId,
  });
  const assessments = rawAssessments ?? [];
  const { data: rawPlans } = useQuery<CommunityActionPlan[]>({
    queryKey: ["/api/coalitions", coalitionId, "action-plans"],
    enabled: !!coalitionId,
  });
  const plans = rawPlans ?? [];
  const { data: rawCostRecords } = useQuery<CostMatchRecord[]>({
    queryKey: ["/api/coalitions", coalitionId, "cost-match"],
    enabled: !!coalitionId,
  });
  const costRecords = rawCostRecords ?? [];

  interface CostMatchCompliance {
    totalMatch: number; totalCash: number; totalInKind: number;
    totalVolunteerHoursDollars: number; totalVolunteerHours: number;
    totalPartnerContributions: number; dfcGrantAmount: number;
    matchRatio: number; isCompliant: boolean; recordCount: number;
    breakdown: Record<string, { amount: number; pct: number; hours?: number }>;
  }
  const { data: compliance } = useQuery<CostMatchCompliance>({
    queryKey: ["/api/coalitions", coalitionId, "cost-match-compliance"],
    enabled: !!coalitionId,
  });

  interface SectorPartnerMap {
    sectors: Array<{
      sectorId: string; sectorNumber: number; sectorName: string;
      isRepresented: boolean; mappedPartnerTypes: string[];
      suggestedPartners: Array<{ id: string; name: string; type: string; contactName: string | null }>;
      suggestedCount: number;
    }>;
    totalSectors: number; potentialCoverage: number;
  }
  const { data: sectorPartnerMap } = useQuery<SectorPartnerMap>({
    queryKey: ["/api/coalitions", coalitionId, "sector-partner-map"],
    enabled: !!coalitionId,
  });

  const { data: rawPartners } = useQuery<CommunityPartner[]>({ queryKey: ["/api/partners"] });
  const partners = rawPartners ?? [];

  const invalidateAll = () => {
    if (!coalitionId) return;
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "sectors"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "members"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "meetings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "action-items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "capacity-assessments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "action-plans"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "cost-match"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "cost-match-compliance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coalitions", coalitionId, "sector-partner-map"] });
  };

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/coalitions/seed-default", {});
      return res.json();
    },
    onSuccess: (data: Coalition) => {
      setCoalitionId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/coalitions"] });
      toast({ title: "Coalition created with 12 DFC sectors" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coalition-members", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowMemberForm(false);
      setMemberData({ coalitionId: "", sectorId: "", partnerId: "", memberName: "", role: "", organization: "", email: "", phone: "" });
      toast({ title: "Member added to coalition" });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/coalition-members/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Member removed" }); },
  });

  const addMeetingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coalition-meetings", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowMeetingForm(false);
      setMeetingData({ coalitionId: "", title: "", scheduledDate: "", location: "", agenda: "", minutes: "", attendeeIds: [], status: "scheduled" });
      toast({ title: "Meeting scheduled" });
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/coalition-meetings/${id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Meeting updated" }); },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/coalition-meetings/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Meeting deleted" }); },
  });

  const addActionItemMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coalition-action-items", data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Action item added" }); },
  });

  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/coalition-action-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Action item updated" }); },
  });

  const submitAssessmentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coalition-capacity-assessments", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowAssessment(false);
      setAssessmentData({ coalitionId: "", organizationalCapacity: 50, leadershipEffectiveness: 50, substanceAbuseKnowledge: 50, communityEngagement: 50 });
      toast({ title: "Capacity assessment submitted" });
    },
  });

  const addPlanMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coalition-action-plans", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowPlanForm(false);
      setPlanData({ coalitionId: "", title: "", spfPhase: "assessment", status: "draft", goals: "", objectives: "", strategies: "", responsibleParties: "", timeline: "", evaluationMetrics: "" });
      toast({ title: "Action plan created" });
    },
  });

  const deleteActionItemMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/coalition-action-items/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Action item deleted" }); },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/coalition-capacity-assessments/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Assessment deleted" }); },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/coalition-action-plans/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Action plan deleted" }); },
  });

  const deleteCostMatchMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/coalition-cost-match/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Cost match record deleted" }); },
  });

  const addCostMatchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coalition-cost-match", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowCostForm(false);
      setCostData({ coalitionId: "", contributorName: "", contributionType: "cash", description: "", dollarValue: "", hoursContributed: "", dateRecorded: "" });
      toast({ title: "Cost match record added" });
    },
  });

  const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "sectors", label: "Sector Map", icon: Target },
    { id: "meetings", label: "Meetings", icon: Calendar },
    { id: "capacity", label: "Capacity", icon: TrendingUp },
    { id: "plans", label: "Action Plans", icon: ClipboardList },
    { id: "cost-match", label: "Cost Match", icon: DollarSign },
    { id: "sustainability", label: "Sustainability", icon: Shield },
  ];

  if (coalitionsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (allCoalitions.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center space-y-6">
        <Users className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold" data-testid="text-coalition-title">DFC Coalition Management</h1>
        <p className="text-muted-foreground">No coalition has been created yet. Initialize the 12-sector DFC coalition to get started.</p>
        <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-create-coalition">
          <Plus className="mr-2 h-4 w-4" />
          {seedMutation.isPending ? "Creating..." : "Create DFC Coalition"}
        </Button>
      </div>
    );
  }

  const currentCoalition = allCoalitions.find(c => c.id === coalitionId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-coalition-title">DFC Coalition Dashboard</h1>
        <p className="text-muted-foreground mt-1">{currentCoalition?.name || "12-Sector Coalition Management"}</p>
        {currentCoalition?.mission && (
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl" data-testid="text-coalition-mission">{currentCoalition.mission}</p>
        )}
        {currentCoalition?.formationDate && (
          <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-coalition-formation-date">Formed: {currentCoalition.formationDate}</p>
        )}
      </div>

      {dashboard && (() => {
        const healthScore = Math.round(
          (dashboard.sectorCoverage * 0.3) +
          (dashboard.latestCapacityScore * 0.3) +
          (dashboard.totalMembers > 0 ? Math.min(dashboard.totalMembers / 24 * 100, 100) : 0) * 0.2 +
          (dashboard.completedActions > 0 ? Math.min(dashboard.completedActions / Math.max(dashboard.totalActionItems, 1) * 100, 100) : 0) * 0.2
        );
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3 text-center" data-testid="card-stat-health-score">
              <p className={`text-2xl font-bold ${healthScore >= 60 ? "text-emerald-600" : healthScore >= 30 ? "text-amber-600" : "text-red-600"}`}>{healthScore}</p>
              <p className="text-xs text-muted-foreground">Health Score</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-stat-sector-coverage">
              <p className="text-2xl font-bold text-primary">{dashboard.sectorCoverage}%</p>
              <p className="text-xs text-muted-foreground">{dashboard.representedSectors}/{dashboard.totalSectors} Sectors</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-stat-members">
              <p className="text-2xl font-bold text-emerald-600">{dashboard.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-stat-capacity">
              <p className="text-2xl font-bold text-blue-600">{dashboard.latestCapacityScore}</p>
              <p className="text-xs text-muted-foreground">Capacity Score</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-stat-cost-match">
              <p className="text-2xl font-bold text-amber-600">${dashboard.totalCostMatch.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Cost Match Total</p>
            </Card>
          </div>
        );
      })()}

      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            data-testid={`tab-coalition-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5" data-testid="card-sector-summary">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> 12-Sector Coverage</h3>
              <div className="mb-3">
                <Progress value={dashboard?.sectorCoverage ?? 0} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">{dashboard?.representedSectors ?? 0} of {dashboard?.totalSectors ?? 12} sectors represented</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sectors.map(sector => (
                  <div key={sector.id} className="flex items-center gap-2 text-sm" data-testid={`sector-indicator-${sector.sectorNumber}`}>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${sector.isRepresented ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    <span className={sector.isRepresented ? "" : "text-muted-foreground"}>{sector.sectorName}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5" data-testid="card-meeting-summary">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" /> Meeting Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Meetings</span>
                  <span className="text-sm font-semibold">{dashboard?.totalMeetings ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-semibold">{dashboard?.completedMeetings ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Action Items</span>
                  <span className="text-sm font-semibold">{dashboard?.totalActionItems ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Actions Completed</span>
                  <span className="text-sm font-semibold">{dashboard?.completedActions ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>

          {assessments.length > 0 && (
            <Card className="p-5" data-testid="card-capacity-overview">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Latest Capacity Assessment</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Organizational", value: assessments[0].organizationalCapacity },
                  { label: "Leadership", value: assessments[0].leadershipEffectiveness },
                  { label: "Substance Knowledge", value: assessments[0].substanceAbuseKnowledge },
                  { label: "Community Engagement", value: assessments[0].communityEngagement },
                ].map(dim => (
                  <div key={dim.label} className="text-center">
                    <p className="text-2xl font-bold">{dim.value}</p>
                    <p className="text-xs text-muted-foreground">{dim.label}</p>
                    <Progress value={dim.value} className="h-2 mt-1" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "sectors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">12-Sector Map</h2>
            <Button onClick={() => { setShowMemberForm(true); setMemberData(d => ({ ...d, coalitionId: coalitionId || "" })); }} data-testid="button-add-member">
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </div>

          {showMemberForm && (
            <Card className="p-5 space-y-4" data-testid="card-member-form">
              <h3 className="font-semibold">Add Coalition Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sector</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={memberData.sectorId} onChange={e => setMemberData(d => ({ ...d, sectorId: e.target.value }))} data-testid="select-member-sector">
                    <option value="">Select sector...</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.sectorNumber}. {s.sectorName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Link Existing Partner</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={memberData.partnerId} onChange={e => {
                    const p = partners.find(pp => pp.id === e.target.value);
                    if (p) {
                      setMemberData(d => ({ ...d, partnerId: p.id, memberName: p.contactName || p.name, organization: p.name, email: p.contactEmail || "", phone: p.contactPhone || "" }));
                    } else {
                      setMemberData(d => ({ ...d, partnerId: "" }));
                    }
                  }} data-testid="select-member-partner">
                    <option value="">Manual entry (no partner link)</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input value={memberData.memberName} onChange={e => setMemberData(d => ({ ...d, memberName: e.target.value }))} data-testid="input-member-name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Input value={memberData.role} onChange={e => setMemberData(d => ({ ...d, role: e.target.value }))} data-testid="input-member-role" />
                </div>
                <div>
                  <label className="text-sm font-medium">Organization</label>
                  <Input value={memberData.organization} onChange={e => setMemberData(d => ({ ...d, organization: e.target.value }))} data-testid="input-member-org" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={memberData.email} onChange={e => setMemberData(d => ({ ...d, email: e.target.value }))} data-testid="input-member-email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={memberData.phone} onChange={e => setMemberData(d => ({ ...d, phone: e.target.value }))} data-testid="input-member-phone" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addMemberMutation.mutate({ ...memberData, coalitionId: coalitionId || "", partnerId: memberData.partnerId || undefined })} disabled={!memberData.memberName || addMemberMutation.isPending} data-testid="button-submit-member">
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
                <Button variant="outline" onClick={() => setShowMemberForm(false)} data-testid="button-cancel-member">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map(sector => {
              const sectorMembers = members.filter(m => m.sectorId === sector.id);
              return (
                <Card key={sector.id} className={`p-4 ${sector.isRepresented ? "border-emerald-500/40" : "border-muted-foreground/20"}`} data-testid={`card-sector-${sector.sectorNumber}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={sector.isRepresented ? "default" : "secondary"} className="text-xs">
                        #{sector.sectorNumber}
                      </Badge>
                      <h4 className="text-sm font-semibold">{sector.sectorName}</h4>
                    </div>
                    {sector.isRepresented ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Badge variant="outline" className="text-xs">Gap</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{sector.description}</p>
                  {(() => {
                    const mapping = sectorPartnerMap?.sectors.find(s => s.sectorId === sector.id);
                    if (mapping && mapping.mappedPartnerTypes.length > 0) {
                      return (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground">Mapped partner types: {mapping.mappedPartnerTypes.join(", ")}</p>
                          {mapping.suggestedCount > 0 && !sector.isRepresented && (
                            <p className="text-xs text-emerald-600">{mapping.suggestedCount} existing partner{mapping.suggestedCount !== 1 ? "s" : ""} could fill this sector</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {sectorMembers.length > 0 ? (
                    <div className="space-y-1.5">
                      {sectorMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs" data-testid={`member-${m.id}`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{m.memberName}</span>
                            {m.organization && <span className="text-muted-foreground truncate">({m.organization})</span>}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteMemberMutation.mutate(m.id)} data-testid={`button-delete-member-${m.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No representatives assigned</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "meetings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Coalition Meetings</h2>
            <Button onClick={() => { setShowMeetingForm(true); setMeetingData(d => ({ ...d, coalitionId: coalitionId || "" })); }} data-testid="button-add-meeting">
              <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
            </Button>
          </div>

          {showMeetingForm && (
            <Card className="p-5 space-y-4" data-testid="card-meeting-form">
              <h3 className="font-semibold">Schedule Meeting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={meetingData.title} onChange={e => setMeetingData(d => ({ ...d, title: e.target.value }))} data-testid="input-meeting-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={meetingData.scheduledDate} onChange={e => setMeetingData(d => ({ ...d, scheduledDate: e.target.value }))} data-testid="input-meeting-date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input value={meetingData.location} onChange={e => setMeetingData(d => ({ ...d, location: e.target.value }))} data-testid="input-meeting-location" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Agenda</label>
                <Textarea value={meetingData.agenda} onChange={e => setMeetingData(d => ({ ...d, agenda: e.target.value }))} rows={3} data-testid="input-meeting-agenda" />
              </div>
              <div>
                <label className="text-sm font-medium">Sector Attendance</label>
                <p className="text-xs text-muted-foreground mb-1">Select sectors represented at this meeting</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {sectors.map(s => (
                    <label key={s.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={meetingData.attendeeIds.includes(s.id)} onChange={e => {
                        setMeetingData(d => ({
                          ...d,
                          attendeeIds: e.target.checked
                            ? [...d.attendeeIds, s.id]
                            : d.attendeeIds.filter(id => id !== s.id)
                        }));
                      }} data-testid={`checkbox-attendance-${s.sectorNumber}`} />
                      <span>#{s.sectorNumber} {s.sectorName}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addMeetingMutation.mutate({ ...meetingData, coalitionId: coalitionId || "", attendeeIds: meetingData.attendeeIds })} disabled={!meetingData.title || addMeetingMutation.isPending} data-testid="button-submit-meeting">
                  {addMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
                </Button>
                <Button variant="outline" onClick={() => setShowMeetingForm(false)} data-testid="button-cancel-meeting">Cancel</Button>
              </div>
            </Card>
          )}

          {meetings.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground" data-testid="card-no-meetings">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No meetings scheduled yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {meetings.map(meeting => {
                const meetingActions = actionItems.filter(a => a.meetingId === meeting.id);
                return (
                  <Card key={meeting.id} className="p-4" data-testid={`card-meeting-${meeting.id}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h4 className="font-semibold">{meeting.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                          {meeting.scheduledDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {meeting.scheduledDate}</span>}
                          {meeting.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {meeting.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={meeting.status === "completed" ? "default" : "secondary"}>
                          {meeting.status}
                        </Badge>
                        {meeting.status === "scheduled" && (
                          <Button variant="outline" size="sm" onClick={() => updateMeetingMutation.mutate({ id: meeting.id, status: "completed" })} data-testid={`button-complete-meeting-${meeting.id}`}>
                            Mark Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMeetingMutation.mutate(meeting.id)} data-testid={`button-delete-meeting-${meeting.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {meeting.agenda && <p className="text-sm text-muted-foreground mt-2">{meeting.agenda}</p>}

                    {(() => {
                      const attendees = Array.isArray(meeting.attendeeIds) ? meeting.attendeeIds as string[] : [];
                      if (attendees.length > 0) {
                        const attendedSectors = sectors.filter(s => attendees.includes(s.id));
                        return (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Sector Attendance ({attendedSectors.length}/{sectors.length})</p>
                            <div className="flex gap-1 flex-wrap">
                              {attendedSectors.map(s => (
                                <Badge key={s.id} variant="secondary" className="text-xs">#{s.sectorNumber} {s.sectorName}</Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {meeting.minutes && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm" data-testid={`meeting-minutes-${meeting.id}`}>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Minutes</p>
                        <p className="whitespace-pre-wrap">{meeting.minutes}</p>
                      </div>
                    )}

                    {meeting.status === "completed" && !meeting.minutes && (
                      <MeetingMinutesInline meetingId={meeting.id} onSave={(minutes) => updateMeetingMutation.mutate({ id: meeting.id, minutes })} isPending={updateMeetingMutation.isPending} />
                    )}

                    {meetingActions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Action Items</p>
                        {meetingActions.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm" data-testid={`action-item-${item.id}`}>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className={`h-3.5 w-3.5 ${item.status === "completed" ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                              <span className={item.status === "completed" ? "line-through text-muted-foreground" : ""}>{item.description}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.status !== "completed" && (
                                <Button variant="ghost" size="sm" onClick={() => updateActionItemMutation.mutate({ id: item.id, status: "completed" })} data-testid={`button-complete-action-${item.id}`}>
                                  Done
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteActionItemMutation.mutate(item.id)} data-testid={`button-delete-action-${item.id}`}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <AddActionItemInline
                        meetingId={meeting.id}
                        coalitionId={coalitionId || ""}
                        onAdd={(data) => addActionItemMutation.mutate(data)}
                        isPending={addActionItemMutation.isPending}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "capacity" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Capacity Assessment</h2>
            <Button onClick={() => { setShowAssessment(true); setAssessmentData(d => ({ ...d, coalitionId: coalitionId || "" })); }} data-testid="button-new-assessment">
              <Plus className="mr-2 h-4 w-4" /> New Assessment
            </Button>
          </div>

          {showAssessment && (
            <Card className="p-5 space-y-5" data-testid="card-assessment-form">
              <h3 className="font-semibold">Coalition Capacity Assessment</h3>
              <p className="text-sm text-muted-foreground">Rate each dimension from 0-100</p>
              {[
                { key: "organizationalCapacity" as const, label: "Organizational Capacity", desc: "Structure, governance, bylaws, financial management" },
                { key: "leadershipEffectiveness" as const, label: "Leadership Effectiveness", desc: "Decision-making, vision, delegation, succession" },
                { key: "substanceAbuseKnowledge" as const, label: "Substance Abuse Knowledge", desc: "Understanding of prevention science and local substance use data" },
                { key: "communityEngagement" as const, label: "Community Engagement", desc: "Outreach, cultural competency, sector participation" },
              ].map(dim => (
                <div key={dim.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">{dim.label}</label>
                    <span className="text-sm font-bold">{assessmentData[dim.key]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{dim.desc}</p>
                  <input
                    type="range" min="0" max="100" value={assessmentData[dim.key]}
                    onChange={e => setAssessmentData(d => ({ ...d, [dim.key]: parseInt(e.target.value) }))}
                    className="w-full"
                    data-testid={`slider-${dim.key}`}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={() => submitAssessmentMutation.mutate({ ...assessmentData, coalitionId: coalitionId || "" })} disabled={submitAssessmentMutation.isPending} data-testid="button-submit-assessment">
                  {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
                </Button>
                <Button variant="outline" onClick={() => setShowAssessment(false)} data-testid="button-cancel-assessment">Cancel</Button>
              </div>
            </Card>
          )}

          {assessments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground" data-testid="card-no-assessments">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No capacity assessments completed yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {assessments.map((a, i) => (
                <Card key={a.id} className="p-4" data-testid={`card-assessment-${a.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Assessment {assessments.length - i}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.overallScore >= 70 ? "default" : "secondary"}>Score: {a.overallScore}</Badge>
                      {a.assessedAt && <span className="text-xs text-muted-foreground">{new Date(a.assessedAt).toLocaleDateString()}</span>}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteAssessmentMutation.mutate(a.id)} data-testid={`button-delete-assessment-${a.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Organizational", value: a.organizationalCapacity },
                      { label: "Leadership", value: a.leadershipEffectiveness },
                      { label: "Substance Knowledge", value: a.substanceAbuseKnowledge },
                      { label: "Community", value: a.communityEngagement },
                    ].map(dim => (
                      <div key={dim.label}>
                        <p className="text-xs text-muted-foreground">{dim.label}</p>
                        <Progress value={dim.value} className="h-2 mt-1" />
                        <p className="text-xs font-semibold mt-0.5">{dim.value}/100</p>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const recs = Array.isArray(a.recommendations) ? a.recommendations as string[] : [];
                    if (recs.length === 0) return null;
                    return (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Recommendations</p>
                        <ul className="space-y-1">
                          {recs.map((rec: string, idx: number) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <Target className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">SPF Action Plans</h2>
            <Button onClick={() => { setShowPlanForm(true); setPlanData(d => ({ ...d, coalitionId: coalitionId || "" })); }} data-testid="button-add-plan">
              <Plus className="mr-2 h-4 w-4" /> New Plan
            </Button>
          </div>

          {showPlanForm && (
            <Card className="p-5 space-y-4" data-testid="card-plan-form">
              <h3 className="font-semibold">Create Action Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={planData.title} onChange={e => setPlanData(d => ({ ...d, title: e.target.value }))} data-testid="input-plan-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">SPF Phase</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={planData.spfPhase} onChange={e => setPlanData(d => ({ ...d, spfPhase: e.target.value }))} data-testid="select-plan-phase">
                    {SPF_PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Goals</label>
                <Textarea value={planData.goals} onChange={e => setPlanData(d => ({ ...d, goals: e.target.value }))} rows={2} placeholder="What are the overall goals? (one per line)" data-testid="input-plan-goals" />
              </div>
              <div>
                <label className="text-sm font-medium">Objectives</label>
                <Textarea value={planData.objectives} onChange={e => setPlanData(d => ({ ...d, objectives: e.target.value }))} rows={2} placeholder="Specific, measurable objectives (one per line)" data-testid="input-plan-objectives" />
              </div>
              <div>
                <label className="text-sm font-medium">Strategies</label>
                <Textarea value={planData.strategies} onChange={e => setPlanData(d => ({ ...d, strategies: e.target.value }))} rows={2} placeholder="Evidence-based strategies to achieve objectives (one per line)" data-testid="input-plan-strategies" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Responsible Parties</label>
                  <Textarea value={planData.responsibleParties} onChange={e => setPlanData(d => ({ ...d, responsibleParties: e.target.value }))} rows={2} placeholder="Who is responsible? (one per line)" data-testid="input-plan-responsible" />
                </div>
                <div>
                  <label className="text-sm font-medium">Timeline</label>
                  <Textarea value={planData.timeline} onChange={e => setPlanData(d => ({ ...d, timeline: e.target.value }))} rows={2} placeholder="Key milestones and deadlines" data-testid="input-plan-timeline" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Evaluation Metrics</label>
                <Textarea value={planData.evaluationMetrics} onChange={e => setPlanData(d => ({ ...d, evaluationMetrics: e.target.value }))} rows={2} placeholder="How will success be measured? (one per line)" data-testid="input-plan-metrics" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const toList = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean);
                  addPlanMutation.mutate({
                    coalitionId: coalitionId || "",
                    title: planData.title,
                    spfPhase: planData.spfPhase,
                    status: planData.status,
                    goals: toList(planData.goals),
                    objectives: toList(planData.objectives),
                    strategies: toList(planData.strategies),
                    responsibleParties: toList(planData.responsibleParties),
                    timeline: toList(planData.timeline),
                    evaluationMetrics: toList(planData.evaluationMetrics),
                  });
                }} disabled={!planData.title || addPlanMutation.isPending} data-testid="button-submit-plan">
                  {addPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
                <Button variant="outline" onClick={() => setShowPlanForm(false)} data-testid="button-cancel-plan">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {SPF_PHASES.map(phase => {
              const phasePlans = plans.filter(p => p.spfPhase === phase.value);
              return (
                <Card key={phase.value} className="p-4" data-testid={`card-phase-${phase.value}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{phase.label}</h4>
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
                    </div>
                    <Badge variant="secondary">{phasePlans.length} plan{phasePlans.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  {phasePlans.length > 0 && (
                    <div className="space-y-3 mt-2">
                      {phasePlans.map(plan => {
                        const goals = Array.isArray(plan.goals) ? plan.goals as string[] : [];
                        const objectives = Array.isArray(plan.objectives) ? plan.objectives as string[] : [];
                        const strategies = Array.isArray(plan.strategies) ? plan.strategies as string[] : [];
                        const responsible = Array.isArray(plan.responsibleParties) ? plan.responsibleParties as string[] : [];
                        const timeline = Array.isArray(plan.timeline) ? plan.timeline as string[] : [];
                        const metrics = Array.isArray(plan.evaluationMetrics) ? plan.evaluationMetrics as string[] : [];
                        const hasDetail = goals.length > 0 || objectives.length > 0 || strategies.length > 0;
                        return (
                          <div key={plan.id} className="border rounded p-3" data-testid={`plan-${plan.id}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{plan.title}</span>
                              <div className="flex items-center gap-1">
                                <Badge variant={plan.status === "active" ? "default" : "outline"} className="text-xs">{plan.status}</Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deletePlanMutation.mutate(plan.id)} data-testid={`button-delete-plan-${plan.id}`}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {hasDetail && (
                              <div className="space-y-2 mt-2">
                                {goals.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Goals</p>
                                    <ul className="list-disc list-inside text-xs space-y-0.5">{goals.map((g, i) => <li key={i}>{g}</li>)}</ul>
                                  </div>
                                )}
                                {objectives.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Objectives</p>
                                    <ul className="list-disc list-inside text-xs space-y-0.5">{objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
                                  </div>
                                )}
                                {strategies.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Strategies</p>
                                    <ul className="list-disc list-inside text-xs space-y-0.5">{strategies.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                  </div>
                                )}
                                {responsible.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Responsible Parties</p>
                                    <ul className="list-disc list-inside text-xs space-y-0.5">{responsible.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                  </div>
                                )}
                                {timeline.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Timeline</p>
                                    <ul className="list-disc list-inside text-xs space-y-0.5">{timeline.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                  </div>
                                )}
                                {metrics.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Evaluation Metrics</p>
                                    <ul className="list-disc list-inside text-xs space-y-0.5">{metrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "cost-match" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Cost Match Tracking</h2>
            <Button onClick={() => { setShowCostForm(true); setCostData(d => ({ ...d, coalitionId: coalitionId || "" })); }} data-testid="button-add-cost-match">
              <Plus className="mr-2 h-4 w-4" /> Log Contribution
            </Button>
          </div>

          {showCostForm && (
            <Card className="p-5 space-y-4" data-testid="card-cost-form">
              <h3 className="font-semibold">Log Cost Match Contribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Contributor Name</label>
                  <Input value={costData.contributorName} onChange={e => setCostData(d => ({ ...d, contributorName: e.target.value }))} data-testid="input-cost-contributor" />
                </div>
                <div>
                  <label className="text-sm font-medium">Contribution Type</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={costData.contributionType} onChange={e => setCostData(d => ({ ...d, contributionType: e.target.value }))} data-testid="select-cost-type">
                    {CONTRIBUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Dollar Value</label>
                  <Input type="number" value={costData.dollarValue} onChange={e => setCostData(d => ({ ...d, dollarValue: e.target.value }))} data-testid="input-cost-value" />
                </div>
                <div>
                  <label className="text-sm font-medium">Hours Contributed</label>
                  <Input type="number" value={costData.hoursContributed} onChange={e => setCostData(d => ({ ...d, hoursContributed: e.target.value }))} data-testid="input-cost-hours" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={costData.dateRecorded} onChange={e => setCostData(d => ({ ...d, dateRecorded: e.target.value }))} data-testid="input-cost-date" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={costData.description} onChange={e => setCostData(d => ({ ...d, description: e.target.value }))} rows={2} data-testid="input-cost-description" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addCostMatchMutation.mutate({ ...costData, coalitionId: coalitionId || "" })} disabled={!costData.contributorName || !costData.dollarValue || addCostMatchMutation.isPending} data-testid="button-submit-cost-match">
                  {addCostMatchMutation.isPending ? "Logging..." : "Log Contribution"}
                </Button>
                <Button variant="outline" onClick={() => setShowCostForm(false)} data-testid="button-cancel-cost-match">Cancel</Button>
              </div>
            </Card>
          )}

          {compliance && (
            <Card className="p-4 mb-4" data-testid="card-cost-match-compliance">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                DFC Match Compliance
                <Badge variant={compliance.isCompliant ? "default" : "secondary"} className="ml-auto">
                  {compliance.isCompliant ? "Compliant" : `${compliance.matchRatio}% of Required`}
                </Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">${compliance.totalMatch.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Match</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">${compliance.totalCash.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Cash</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">${compliance.totalInKind.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">In-Kind</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{compliance.totalVolunteerHours.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Volunteer Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">${compliance.totalPartnerContributions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Partner Contributions</p>
                </div>
              </div>
              <Progress value={Math.min(compliance.matchRatio, 100)} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {compliance.matchRatio}% match against ${compliance.dfcGrantAmount.toLocaleString()}/yr DFC grant (100% match required)
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4" data-testid="card-cost-match-total">
              <h3 className="font-semibold mb-3">Match Summary</h3>
              <p className="text-3xl font-bold text-primary">${costRecords.reduce((sum, r) => sum + parseFloat(r.dollarValue || "0"), 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Contributions</p>
              <div className="mt-3 space-y-2">
                {CONTRIBUTION_TYPES.map(t => {
                  const typeTotal = costRecords.filter(r => r.contributionType === t.value).reduce((sum, r) => sum + parseFloat(r.dollarValue || "0"), 0);
                  return (
                    <div key={t.value} className="flex justify-between text-sm">
                      <span>{t.label}</span>
                      <span className="font-semibold">${typeTotal.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Total Volunteer Hours</p>
                <p className="text-lg font-bold">{costRecords.reduce((sum, r) => sum + parseFloat(r.hoursContributed || "0"), 0).toLocaleString()} hrs</p>
              </div>
            </Card>
            <Card className="p-4" data-testid="card-cost-match-records">
              <h3 className="font-semibold mb-3">Recent Records</h3>
              {costRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cost match records yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {costRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0" data-testid={`cost-record-${record.id}`}>
                      <div>
                        <p className="font-medium">{record.contributorName}</p>
                        <p className="text-xs text-muted-foreground">{record.description || record.contributionType}</p>
                        {parseFloat(record.hoursContributed || "0") > 0 && (
                          <p className="text-xs text-muted-foreground">{record.hoursContributed} hrs</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${parseFloat(record.dollarValue || "0").toLocaleString()}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCostMatchMutation.mutate(record.id)} data-testid={`button-delete-cost-${record.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "sustainability" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sustainability Planning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5" data-testid="card-funding-diversification">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Funding Diversification</h3>
              <div className="space-y-3">
                {[
                  { source: "DFC Grant", status: "Active", pct: 40 },
                  { source: "Local Government", status: "Target", pct: 20 },
                  { source: "Foundation Grants", status: "Target", pct: 15 },
                  { source: "Corporate Sponsors", status: "Target", pct: 15 },
                  { source: "In-Kind/Volunteer", status: "Active", pct: 10 },
                ].map(item => (
                  <div key={item.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.source}</span>
                      <Badge variant={item.status === "Active" ? "default" : "outline"} className="text-xs">{item.status}</Badge>
                    </div>
                    <Progress value={item.pct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-0.5">{item.pct}% of budget</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5" data-testid="card-sustainability-checklist">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Sustainability Checklist</h3>
              <div className="space-y-2">
                {[
                  { task: "Establish 501(c)(3) or fiscal sponsor", done: true },
                  { task: "Develop multi-year strategic plan", done: false },
                  { task: "Build diversified funding portfolio", done: false },
                  { task: "Create succession plan for leadership", done: false },
                  { task: "Establish data collection systems", done: true },
                  { task: "Develop community partnership MOUs", done: true },
                  { task: "Train next generation of coalition leaders", done: false },
                  { task: "Secure local government support", done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" data-testid={`sustainability-check-${i}`}>
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span className={item.done ? "" : "text-muted-foreground"}>{item.task}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
      <DFCCrossNav currentPage="coalition" />
    </div>
  );
}

function MeetingMinutesInline({ meetingId, onSave, isPending }: { meetingId: string; onSave: (minutes: string) => void; isPending: boolean }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  if (!show) {
    return (
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShow(true)} data-testid={`button-add-minutes-${meetingId}`}>
        <Plus className="mr-1 h-3 w-3" /> Add Minutes
      </Button>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      <Textarea placeholder="Record meeting minutes..." value={text} onChange={e => setText(e.target.value)} rows={3} data-testid={`input-minutes-${meetingId}`} />
      <div className="flex gap-2">
        <Button size="sm" disabled={!text || isPending} onClick={() => { onSave(text); setText(""); setShow(false); }} data-testid={`button-save-minutes-${meetingId}`}>Save Minutes</Button>
        <Button variant="ghost" size="sm" onClick={() => setShow(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function AddActionItemInline({ meetingId, coalitionId, onAdd, isPending }: { meetingId: string; coalitionId: string; onAdd: (data: Record<string, unknown>) => void; isPending: boolean }) {
  const [text, setText] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShow(true)} data-testid={`button-add-action-${meetingId}`}>
        <Plus className="mr-1 h-3 w-3" /> Add Action Item
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input className="flex-1 min-w-[200px]" placeholder="Action item description" value={text} onChange={e => setText(e.target.value)} data-testid={`input-action-desc-${meetingId}`} />
      <Input className="w-32" placeholder="Assigned to" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} data-testid={`input-action-assigned-${meetingId}`} />
      <Button size="sm" disabled={!text || isPending} onClick={() => { onAdd({ meetingId, coalitionId, description: text, assignedTo, status: "pending" }); setText(""); setAssignedTo(""); setShow(false); }} data-testid={`button-submit-action-${meetingId}`}>
        Add
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShow(false)} data-testid={`button-cancel-action-${meetingId}`}>Cancel</Button>
    </div>
  );
}
