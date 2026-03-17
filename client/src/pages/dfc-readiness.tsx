import { useState } from "react";
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
  CheckCircle2, Circle, Clock, AlertTriangle, Plus, Megaphone,
  Users, Calendar, Target, FileText, BarChart3, Shield,
  ExternalLink, Trash2, TrendingUp,
} from "lucide-react";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import type {
  MediaCampaign, CampaignContent, CampaignMetric,
  DfcReadinessItem, StakeholderCommitment,
} from "@shared/schema";

type TabId = "checklist" | "campaigns" | "calendar" | "commitments" | "timeline";

interface DashboardData {
  readinessScore: number;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  byCategory: Record<string, { total: number; completed: number }>;
  activeCampaigns: number;
  totalCampaigns: number;
  totalCommitments: number;
  deliveredCommitments: number;
}

const CAMPAIGN_TYPES = [
  { value: "social_media", label: "Social Media" },
  { value: "community_event", label: "Community Event" },
  { value: "school_assembly", label: "School Assembly" },
  { value: "psa", label: "Public Service Announcement" },
  { value: "print_materials", label: "Print Materials" },
  { value: "digital_ads", label: "Digital Ads" },
];

const TARGET_AUDIENCES = [
  { value: "youth", label: "Youth (10-18)", guidance: "Peer-driven messaging, social media native, influencer strategies" },
  { value: "parents", label: "Parents", guidance: "Empowerment framing, action-oriented, family values" },
  { value: "veterans", label: "Veterans", guidance: "Honor/strength framing, buddy system approach, stigma reduction" },
  { value: "returning_citizens", label: "Returning Citizens", guidance: "Second chance narrative, community belonging, hope-forward" },
  { value: "seniors", label: "Seniors", guidance: "Prescription safety, grandparent role, legacy messaging" },
  { value: "educators", label: "Educators", guidance: "Data-driven, student success framing, professional development" },
  { value: "faith_community", label: "Faith Community", guidance: "Values-based, healing/restoration, community care" },
  { value: "business", label: "Business", guidance: "ROI framing, workforce health, community investment" },
  { value: "law_enforcement", label: "Law Enforcement", guidance: "Public safety partnership, diversion success stories" },
  { value: "healthcare", label: "Healthcare", guidance: "Evidence-based, patient outcomes, screening integration" },
];

const DFC_SECTORS = [
  { number: 1, name: "Youth (10-18)" },
  { number: 2, name: "Parents" },
  { number: 3, name: "Business Community" },
  { number: 4, name: "Media" },
  { number: 5, name: "School Personnel" },
  { number: 6, name: "Youth-Serving Organizations" },
  { number: 7, name: "Law Enforcement" },
  { number: 8, name: "Religious/Fraternal Organizations" },
  { number: 9, name: "Civic/Volunteer Groups" },
  { number: 10, name: "Healthcare Professionals" },
  { number: 11, name: "State/Local Government" },
  { number: 12, name: "Other Substance Abuse Organizations" },
];

const COMMITMENT_TYPES = [
  { value: "letter_of_support", label: "Letter of Support" },
  { value: "mou", label: "MOU/Agreement" },
  { value: "in_kind", label: "In-Kind Contribution" },
  { value: "cash_match", label: "Cash Match" },
  { value: "volunteer_hours", label: "Volunteer Hours" },
  { value: "facility_space", label: "Facility/Space" },
  { value: "data_sharing", label: "Data Sharing" },
  { value: "program_delivery", label: "Program Delivery" },
];

const CATEGORY_LABELS: Record<string, string> = {
  pre_application: "Pre-Application Requirements",
  coalition_eligibility: "Coalition Eligibility",
  application_component: "Application Components",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />;
}

function CommitmentStatusBadge({ status }: { status: string }) {
  if (status === "delivered") return <Badge data-testid="badge-delivered" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Delivered</Badge>;
  if (status === "in_progress") return <Badge data-testid="badge-in-progress" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">In Progress</Badge>;
  return <Badge data-testid="badge-pledged" variant="outline">Pledged</Badge>;
}

export default function DfcReadinessPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("checklist");
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [campaignData, setCampaignData] = useState({
    title: "", campaignType: "social_media", targetAudience: "youth",
    messagingGuidance: "", status: "planning", startDate: "", endDate: "",
    targetSubstance: "", objectives: "",
  });
  const [commitmentData, setCommitmentData] = useState({
    sectorName: "", sectorNumber: 1, commitmentType: "letter_of_support",
    description: "", contactName: "", contactEmail: "", status: "pledged",
  });

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dfc-readiness/dashboard"],
  });
  const { data: readinessItems = [] } = useQuery<DfcReadinessItem[]>({
    queryKey: ["/api/dfc-readiness/items"],
  });
  const { data: campaigns = [] } = useQuery<MediaCampaign[]>({
    queryKey: ["/api/media-campaigns"],
  });
  const { data: commitments = [] } = useQuery<StakeholderCommitment[]>({
    queryKey: ["/api/stakeholder-commitments"],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dfc-readiness/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dfc-readiness/items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/media-campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stakeholder-commitments"] });
  };

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/dfc-readiness/items/${id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Checklist item updated" }); },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/media-campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowCampaignForm(false);
      setCampaignData({ title: "", campaignType: "social_media", targetAudience: "youth", messagingGuidance: "", status: "planning", startDate: "", endDate: "", targetSubstance: "", objectives: "" });
      toast({ title: "Campaign created" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/media-campaigns/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Campaign deleted" }); },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/media-campaigns/${id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Campaign updated" }); },
  });

  const createCommitmentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/stakeholder-commitments", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowCommitmentForm(false);
      setCommitmentData({ sectorName: "", sectorNumber: 1, commitmentType: "letter_of_support", description: "", contactName: "", contactEmail: "", status: "pledged" });
      toast({ title: "Commitment recorded" });
    },
  });

  const updateCommitmentMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/stakeholder-commitments/${id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Commitment updated" }); },
  });

  const deleteCommitmentMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/stakeholder-commitments/${id}`); },
    onSuccess: () => { invalidateAll(); toast({ title: "Commitment removed" }); },
  });

  const selectedAudience = TARGET_AUDIENCES.find(a => a.value === campaignData.targetAudience);

  const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
    { id: "checklist", label: "Readiness Checklist", icon: Target },
    { id: "campaigns", label: "Media Campaigns", icon: Megaphone },
    { id: "calendar", label: "Campaign Calendar", icon: Calendar },
    { id: "commitments", label: "Stakeholder Commitments", icon: Users },
    { id: "timeline", label: "Application Timeline", icon: BarChart3 },
  ];

  if (dashLoading) {
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

  const groupedItems: Record<string, DfcReadinessItem[]> = {};
  for (const item of readinessItems) {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  }

  const campaignsByMonth: Record<string, MediaCampaign[]> = {};
  for (const c of campaigns) {
    const month = c.startDate ? c.startDate.substring(0, 7) : "unscheduled";
    if (!campaignsByMonth[month]) campaignsByMonth[month] = [];
    campaignsByMonth[month].push(c);
  }

  const commitmentsBySector: Record<number, StakeholderCommitment[]> = {};
  for (const c of commitments) {
    if (!commitmentsBySector[c.sectorNumber]) commitmentsBySector[c.sectorNumber] = [];
    commitmentsBySector[c.sectorNumber].push(c);
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dfc-readiness-title">DFC Application Readiness</h1>
        <p className="text-muted-foreground mt-1">Media campaigns, application checklist, and stakeholder commitments</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center" data-testid="card-stat-readiness">
            <p className="text-2xl font-bold text-primary">{dashboard.readinessScore}%</p>
            <p className="text-xs text-muted-foreground">Readiness Score</p>
            <Progress value={dashboard.readinessScore} className="h-1.5 mt-2" />
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-items">
            <p className="text-2xl font-bold text-emerald-600">{dashboard.completedItems}/{dashboard.totalItems}</p>
            <p className="text-xs text-muted-foreground">Items Complete</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-campaigns">
            <p className="text-2xl font-bold text-blue-600">{dashboard.activeCampaigns}</p>
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-commitments">
            <p className="text-2xl font-bold text-amber-600">{dashboard.deliveredCommitments}/{dashboard.totalCommitments}</p>
            <p className="text-xs text-muted-foreground">Commitments Delivered</p>
          </Card>
        </div>
      )}

      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            data-testid={`tab-readiness-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "checklist" && (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category} className="p-5" data-testid={`card-category-${category}`}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {CATEGORY_LABELS[category] || category}
                <Badge variant="outline" className="ml-auto">
                  {items.filter(i => i.status === "completed").length}/{items.length}
                </Badge>
              </h3>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`readiness-item-${item.id}`}>
                    <button
                      onClick={() => {
                        const nextStatus = item.status === "not_started" ? "in_progress" : item.status === "in_progress" ? "completed" : "not_started";
                        updateItemMutation.mutate({ id: item.id, status: nextStatus });
                      }}
                      className="mt-0.5"
                      data-testid={`button-toggle-item-${item.id}`}
                    >
                      <StatusIcon status={item.status} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.linkUrl && (
                        <a href={item.linkUrl} data-testid={`link-item-${item.id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <select
                        value={item.status}
                        onChange={e => updateItemMutation.mutate({ id: item.id, status: e.target.value })}
                        className="text-xs border rounded px-2 py-1 bg-background"
                        data-testid={`select-status-${item.id}`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {dashboard && (
            <Card className="p-5" data-testid="card-readiness-recommendations">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recommendations
              </h3>
              <div className="space-y-2">
                {dashboard.readinessScore < 30 && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Application readiness is low. Focus on completing pre-application requirements first.</span>
                  </div>
                )}
                {dashboard.readinessScore >= 30 && dashboard.readinessScore < 70 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Good progress. Prioritize completing coalition eligibility items and application components.</span>
                  </div>
                )}
                {dashboard.readinessScore >= 70 && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Strong readiness level. Review remaining items and finalize application materials.</span>
                  </div>
                )}
                {dashboard.totalCommitments === 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>No stakeholder commitments recorded yet. Collect letters of support and MOUs from coalition sectors.</span>
                  </div>
                )}
                {dashboard.totalCampaigns === 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Megaphone className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>Plan your media and awareness campaigns to demonstrate DFC Sector 4 (Media) engagement.</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Media & Awareness Campaigns</h2>
            <Button onClick={() => setShowCampaignForm(true)} data-testid="button-add-campaign">
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </div>

          {showCampaignForm && (
            <Card className="p-5 space-y-4" data-testid="card-campaign-form">
              <h3 className="font-semibold">Create Campaign</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Campaign Title</label>
                  <Input value={campaignData.title} onChange={e => setCampaignData(d => ({ ...d, title: e.target.value }))} data-testid="input-campaign-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Campaign Type</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={campaignData.campaignType} onChange={e => setCampaignData(d => ({ ...d, campaignType: e.target.value }))} data-testid="select-campaign-type">
                    {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={campaignData.targetAudience} onChange={e => {
                    const aud = TARGET_AUDIENCES.find(a => a.value === e.target.value);
                    setCampaignData(d => ({ ...d, targetAudience: e.target.value, messagingGuidance: aud?.guidance || "" }));
                  }} data-testid="select-campaign-audience">
                    {TARGET_AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Substance</label>
                  <Input value={campaignData.targetSubstance} onChange={e => setCampaignData(d => ({ ...d, targetSubstance: e.target.value }))} placeholder="e.g., Alcohol, Marijuana" data-testid="input-campaign-substance" />
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={campaignData.startDate} onChange={e => setCampaignData(d => ({ ...d, startDate: e.target.value }))} data-testid="input-campaign-start" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input type="date" value={campaignData.endDate} onChange={e => setCampaignData(d => ({ ...d, endDate: e.target.value }))} data-testid="input-campaign-end" />
                </div>
              </div>
              {selectedAudience && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Messaging Guidance for {selectedAudience.label}:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{selectedAudience.guidance}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Objectives</label>
                <Textarea value={campaignData.objectives} onChange={e => setCampaignData(d => ({ ...d, objectives: e.target.value }))} data-testid="input-campaign-objectives" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createCampaignMutation.mutate(campaignData)} disabled={!campaignData.title || createCampaignMutation.isPending} data-testid="button-submit-campaign">
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
                <Button variant="outline" onClick={() => setShowCampaignForm(false)} data-testid="button-cancel-campaign">Cancel</Button>
              </div>
            </Card>
          )}

          {campaigns.length === 0 && !showCampaignForm && (
            <Card className="p-8 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No campaigns yet. Create your first media campaign to document DFC Sector 4 engagement.</p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="p-4" data-testid={`card-campaign-${campaign.id}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm">{campaign.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={campaign.status}
                      onChange={e => updateCampaignMutation.mutate({ id: campaign.id, status: e.target.value })}
                      className="text-xs border rounded px-2 py-1 bg-background"
                      data-testid={`select-campaign-status-${campaign.id}`}
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => deleteCampaignMutation.mutate(campaign.id)} data-testid={`button-delete-campaign-${campaign.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="outline" className="text-xs">{CAMPAIGN_TYPES.find(t => t.value === campaign.campaignType)?.label || campaign.campaignType}</Badge>
                  <Badge variant="secondary" className="text-xs">{TARGET_AUDIENCES.find(a => a.value === campaign.targetAudience)?.label || campaign.targetAudience}</Badge>
                  {campaign.targetSubstance && <Badge variant="outline" className="text-xs">{campaign.targetSubstance}</Badge>}
                </div>
                {campaign.objectives && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{campaign.objectives}</p>}
                {(campaign.startDate || campaign.endDate) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {campaign.startDate && <span>{campaign.startDate}</span>}
                    {campaign.startDate && campaign.endDate && <span>-</span>}
                    {campaign.endDate && <span>{campaign.endDate}</span>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Campaign Calendar</h2>
          {Object.keys(campaignsByMonth).length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No campaigns scheduled. Add start dates to your campaigns to see them here.</p>
            </Card>
          )}
          {Object.entries(campaignsByMonth).sort().map(([month, monthCampaigns]) => (
            <Card key={month} className="p-4" data-testid={`card-calendar-${month}`}>
              <h3 className="font-semibold mb-3 text-sm">
                {month === "unscheduled" ? "Unscheduled" : new Date(month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </h3>
              <div className="space-y-2">
                {monthCampaigns.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded border text-sm" data-testid={`calendar-item-${c.id}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === "active" ? "bg-emerald-500" : c.status === "completed" ? "bg-blue-500" : "bg-muted-foreground/40"}`} />
                    <span className="font-medium flex-1">{c.title}</span>
                    <Badge variant="outline" className="text-xs">{CAMPAIGN_TYPES.find(t => t.value === c.campaignType)?.label}</Badge>
                    <span className="text-xs text-muted-foreground">{c.startDate}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "commitments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Stakeholder Commitments by Sector</h2>
            <Button onClick={() => setShowCommitmentForm(true)} data-testid="button-add-commitment">
              <Plus className="mr-2 h-4 w-4" /> Add Commitment
            </Button>
          </div>

          {showCommitmentForm && (
            <Card className="p-5 space-y-4" data-testid="card-commitment-form">
              <h3 className="font-semibold">Record Stakeholder Commitment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sector</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={commitmentData.sectorNumber} onChange={e => {
                    const num = parseInt(e.target.value);
                    const sector = DFC_SECTORS.find(s => s.number === num);
                    setCommitmentData(d => ({ ...d, sectorNumber: num, sectorName: sector?.name || "" }));
                  }} data-testid="select-commitment-sector">
                    {DFC_SECTORS.map(s => <option key={s.number} value={s.number}>{s.number}. {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Commitment Type</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={commitmentData.commitmentType} onChange={e => setCommitmentData(d => ({ ...d, commitmentType: e.target.value }))} data-testid="select-commitment-type">
                    {COMMITMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={commitmentData.description} onChange={e => setCommitmentData(d => ({ ...d, description: e.target.value }))} data-testid="input-commitment-description" />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Name</label>
                  <Input value={commitmentData.contactName} onChange={e => setCommitmentData(d => ({ ...d, contactName: e.target.value }))} data-testid="input-commitment-contact" />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input value={commitmentData.contactEmail} onChange={e => setCommitmentData(d => ({ ...d, contactEmail: e.target.value }))} data-testid="input-commitment-email" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const sector = DFC_SECTORS.find(s => s.number === commitmentData.sectorNumber);
                  createCommitmentMutation.mutate({ ...commitmentData, sectorName: sector?.name || "" });
                }} disabled={!commitmentData.description || createCommitmentMutation.isPending} data-testid="button-submit-commitment">
                  {createCommitmentMutation.isPending ? "Adding..." : "Add Commitment"}
                </Button>
                <Button variant="outline" onClick={() => setShowCommitmentForm(false)} data-testid="button-cancel-commitment">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DFC_SECTORS.map(sector => {
              const sectorCommitments = commitmentsBySector[sector.number] || [];
              return (
                <Card key={sector.number} className={`p-4 ${sectorCommitments.length > 0 ? "border-emerald-500/40" : ""}`} data-testid={`card-sector-commitments-${sector.number}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={sectorCommitments.length > 0 ? "default" : "secondary"} className="text-xs">#{sector.number}</Badge>
                      <h4 className="text-sm font-semibold">{sector.name}</h4>
                    </div>
                    {sectorCommitments.length > 0 && (
                      <Badge variant="outline" className="text-xs">{sectorCommitments.length}</Badge>
                    )}
                  </div>
                  {sectorCommitments.length > 0 ? (
                    <div className="space-y-2">
                      {sectorCommitments.map(c => (
                        <div key={c.id} className="p-2 rounded border text-xs space-y-1" data-testid={`commitment-${c.id}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium">{COMMITMENT_TYPES.find(t => t.value === c.commitmentType)?.label}</span>
                            <div className="flex items-center gap-1">
                              <select
                                value={c.status}
                                onChange={e => updateCommitmentMutation.mutate({ id: c.id, status: e.target.value })}
                                className="text-xs border rounded px-1 py-0.5 bg-background"
                                data-testid={`select-commitment-status-${c.id}`}
                              >
                                <option value="pledged">Pledged</option>
                                <option value="in_progress">In Progress</option>
                                <option value="delivered">Delivered</option>
                              </select>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCommitmentMutation.mutate(c.id)} data-testid={`button-delete-commitment-${c.id}`}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{c.description}</p>
                          {c.contactName && <p className="text-muted-foreground">Contact: {c.contactName}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No commitments recorded</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Application Timeline</h2>
          <Card className="p-5" data-testid="card-timeline">
            <div className="space-y-6">
              {[
                { phase: "Pre-Application", items: readinessItems.filter(i => i.category === "pre_application"), icon: FileText },
                { phase: "Coalition Eligibility", items: readinessItems.filter(i => i.category === "coalition_eligibility"), icon: Users },
                { phase: "Application Components", items: readinessItems.filter(i => i.category === "application_component"), icon: Target },
              ].map((phase, idx) => {
                const completed = phase.items.filter(i => i.status === "completed").length;
                const total = phase.items.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={phase.phase} className="relative" data-testid={`timeline-phase-${idx}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${pct === 100 ? "bg-emerald-100 dark:bg-emerald-900/30" : pct > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"}`}>
                        <phase.icon className={`h-4 w-4 ${pct === 100 ? "text-emerald-600 dark:text-emerald-400" : pct > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold">{phase.phase}</h4>
                          <span className="text-xs text-muted-foreground">{completed}/{total} complete</span>
                        </div>
                        <Progress value={pct} className="h-1.5 mt-1" />
                      </div>
                    </div>
                    {idx < 2 && <div className="ml-4 h-4 border-l-2 border-dashed border-muted-foreground/30" />}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5" data-testid="card-overall-progress">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Application Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{dashboard?.readinessScore || 0}%</p>
                <p className="text-sm text-muted-foreground">Readiness Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {DFC_SECTORS.filter(s => (commitmentsBySector[s.number]?.length || 0) > 0).length}/12
                </p>
                <p className="text-sm text-muted-foreground">Sectors with Commitments</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Media Campaigns Planned</p>
              </div>
            </div>
          </Card>

          {dashboard && dashboard.readinessScore < 100 && (
            <Card className="p-5" data-testid="card-next-steps">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Next Steps
              </h3>
              <div className="space-y-2">
                {readinessItems.filter(i => i.status !== "completed").slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <StatusIcon status={item.status} />
                    <span>{item.title}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{CATEGORY_LABELS[item.category] || item.category}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
      <DFCCrossNav currentPage="dfc-readiness" />
    </div>
  );
}
