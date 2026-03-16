import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Handshake, Plus, CheckCircle2, Building2, Phone, Mail,
  Globe, MapPin, Users, BarChart3, Trash2, ArrowRight, FileText,
  Church, Shield, GraduationCap, Heart, Home, Briefcase, Scale,
  UserPlus, Clock, Calendar, Target, TrendingUp, AlertTriangle,
  Eye, Send, PenLine, Award
} from "lucide-react";
import type { CommunityPartner, PartnerReferral, PartnerEngagement, MouDocument, AmbassadorProfile } from "@shared/schema";

interface PartnerImpact {
  totalPartners: number;
  verifiedPartners: number;
  withMOU: number;
  totalReferrals: number;
  completedReferrals: number;
  totalEngagements: number;
  totalVolunteerHours: number;
  totalParticipantsServed: number;
  totalResourcesDistributed: number;
  activeMOUs: number;
  pendingMOUs: number;
  expiringMOUs: number;
  activeAmbassadors: number;
  totalAmbassadors: number;
  partnersByType: Record<string, number>;
  partnerStats: Array<{
    partnerId: string; partnerName: string; type: string;
    totalReferrals: number; completed: number; pending: number; active: number;
    completionRate: number; mouStatus: string; isVerified: boolean;
    volunteerHours: number; eventsHosted: number; participantsServed: number;
    hiringCommitments: number; hiringFulfilled: number; diversionReferrals: number;
  }>;
}

interface PartnerDetail extends CommunityPartner {
  referrals: PartnerReferral[];
  engagements: PartnerEngagement[];
  mous: MouDocument[];
}

interface CollectiveImpactReport {
  reportTitle: string;
  generatedAt: string;
  region: string;
  overview: { totalPartners: number; verifiedPartners: number; activeMOUs: number; serviceTypesCovered: number };
  referralOutcomes: { totalReferrals: number; completedReferrals: number; activeReferrals: number; completionRate: number; uniqueParticipants: number };
  communityEngagement: { totalEngagements: number; totalVolunteerHours: number; totalParticipantsServed: number; totalResourcesDistributed: number; facilitySharedEvents: number; engagementsByType: Record<string, { count: number; volunteerHours: number; participantsServed: number }> };
  employmentImpact: { totalHiringCommitments: number; totalHiringFulfilled: number; fulfillmentRate: number };
  justiceImpact: { totalDiversionReferrals: number };
  serviceBreakdown: Record<string, { partners: number; referrals: number; completed: number }>;
}

interface CoordinationData {
  partners: Array<{
    id: string; name: string; type: string; city: string | null; state: string | null;
    isVerified: boolean | null; mouStatus: string | null; services: string[];
    referralCount: number; completedReferrals: number; engagementCount: number;
    volunteerHours: number; participantsServed: number; programsOffered: string[]; capacity: number | null;
  }>;
  serviceGaps: string[];
  ambassadors: AmbassadorProfile[];
  summary: { totalPartners: number; totalReferrals: number; totalEngagements: number; totalVolunteerHours: number; totalParticipantsServed: number; serviceTypesCovered: number; serviceGapsCount: number };
}

const PARTNER_TYPES = [
  "Community Organization", "Church/Faith-Based", "Law Enforcement",
  "Community Policing Commission", "Recidivism Prevention Task Force",
  "School/Education", "Healthcare Provider", "Housing Authority",
  "Employer", "Legal Aid", "Substance Abuse Treatment",
  "Mentoring Program", "Mental Health Services", "Youth Development",
  "Family Services", "Food Assistance", "Transportation", "Financial Coaching",
];

const ENGAGEMENT_TYPES = [
  "Volunteer Event", "Community Event", "Facility Sharing", "Food Pantry",
  "Job Fair", "Training Workshop", "Community Policing Event",
  "Diversion Program", "Literacy Program", "Health Screening",
  "Resource Distribution", "Mentoring Session", "Support Group",
];

function getPartnerIcon(type: string) {
  const iconMap: Record<string, typeof Building2> = {
    "Church/Faith-Based": Church,
    "Law Enforcement": Shield,
    "School/Education": GraduationCap,
    "Healthcare Provider": Heart,
    "Housing Authority": Home,
    "Employer": Briefcase,
    "Legal Aid": Scale,
    "Mentoring Program": Users,
    "Community Policing Commission": Shield,
    "Recidivism Prevention Task Force": Target,
  };
  return iconMap[type] || Building2;
}

type TabId = "directory" | "coordination" | "ambassadors" | "mou" | "impact";

export default function CommunityPartnersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("directory");
  const [showForm, setShowForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [showMouForm, setShowMouForm] = useState(false);
  const [showAmbassadorForm, setShowAmbassadorForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [referralData, setReferralData] = useState({ userId: "", serviceType: "", notes: "" });
  const [engagementData, setEngagementData] = useState({ engagementType: "", title: "", description: "", volunteerHours: 0, participantsServed: 0, resourcesDistributed: 0, facilityShared: false, facilityDetails: "", eventDate: "", impactNotes: "" });
  const [mouData, setMouData] = useState({ title: "", terms: "", signatoryName: "", signatoryTitle: "", startDate: "", endDate: "", renewalDate: "", notes: "" });
  const [ambassadorData, setAmbassadorData] = useState({ name: "", email: "", phone: "", role: "ambassador", assignedCommunity: "", assignedRegion: "", bio: "", specializations: "" });
  const [formData, setFormData] = useState({
    name: "", type: "", description: "", contactName: "", contactEmail: "",
    contactPhone: "", address: "", city: "", state: "", zipCode: "",
    website: "", serviceArea: "", serviceCategories: "", programsOffered: "",
    facilitiesAvailable: "", capacity: "",
  });

  const { data: partners = [], isLoading, error: partnersError, refetch: refetchPartners } = useQuery<CommunityPartner[]>({ queryKey: ["/api/partners"] });
  const { data: impact } = useQuery<PartnerImpact>({ queryKey: ["/api/partners/dashboard/impact"] });
  const { data: partnerDetail } = useQuery<PartnerDetail>({
    queryKey: ["/api/partners", selectedPartner],
    enabled: !!selectedPartner,
  });
  const { data: ambassadors = [] } = useQuery<AmbassadorProfile[]>({ queryKey: ["/api/ambassadors"] });
  const { data: allMous = [] } = useQuery<MouDocument[]>({ queryKey: ["/api/mou-documents"] });
  const { data: coordination } = useQuery<CoordinationData>({ queryKey: ["/api/partners/dashboard/coordination"] });
  const { data: collectiveImpact } = useQuery<CollectiveImpactReport>({ queryKey: ["/api/partners/dashboard/collective-impact"] });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    queryClient.invalidateQueries({ queryKey: ["/api/partners/dashboard/impact"] });
    queryClient.invalidateQueries({ queryKey: ["/api/partners/dashboard/coordination"] });
    queryClient.invalidateQueries({ queryKey: ["/api/partners/dashboard/collective-impact"] });
    queryClient.invalidateQueries({ queryKey: ["/api/mou-documents"] });
    queryClient.invalidateQueries({ queryKey: ["/api/ambassadors"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/partners", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowForm(false);
      toast({ title: "Partner organization added" });
    },
  });

  const referralMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/partner-referrals", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowReferralForm(false);
      setReferralData({ userId: "", serviceType: "", notes: "" });
      toast({ title: "Referral created" });
    },
  });

  const engagementMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/partner-engagements", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowEngagementForm(false);
      setEngagementData({ engagementType: "", title: "", description: "", volunteerHours: 0, participantsServed: 0, resourcesDistributed: 0, facilityShared: false, facilityDetails: "", eventDate: "", impactNotes: "" });
      toast({ title: "Engagement logged" });
    },
  });

  const mouMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/mou-documents", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowMouForm(false);
      setMouData({ title: "", terms: "", signatoryName: "", signatoryTitle: "", startDate: "", endDate: "", renewalDate: "", notes: "" });
      toast({ title: "MOU document created" });
    },
  });

  const mouUpdateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/mou-documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "MOU updated" });
    },
  });

  const ambassadorMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/ambassadors", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowAmbassadorForm(false);
      setAmbassadorData({ name: "", email: "", phone: "", role: "ambassador", assignedCommunity: "", assignedRegion: "", bio: "", specializations: "" });
      toast({ title: "Ambassador invited" });
    },
  });

  const ambassadorUpdateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/ambassadors/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Ambassador updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/partners/${id}`); },
    onSuccess: () => {
      invalidateAll();
      if (selectedPartner) setSelectedPartner(null);
      toast({ title: "Partner removed" });
    },
  });

  const handleSubmit = () => {
    const cats = formData.serviceCategories.split(",").map(s => s.trim()).filter(Boolean);
    const progs = formData.programsOffered.split(",").map(s => s.trim()).filter(Boolean);
    const facilities = formData.facilitiesAvailable.split(",").map(s => s.trim()).filter(Boolean);
    createMutation.mutate({
      ...formData,
      serviceCategories: cats.length ? cats : undefined,
      programsOffered: progs.length ? progs : undefined,
      facilitiesAvailable: facilities.length ? facilities : undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
    });
  };

  const filteredPartners = filterType ? partners.filter(p => p.type === filterType) : partners;

  const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
    { id: "directory", label: "Partner Directory", icon: Building2 },
    { id: "coordination", label: "Coordination", icon: Users },
    { id: "ambassadors", label: "Ambassadors", icon: UserPlus },
    { id: "mou", label: "MOU Management", icon: FileText },
    { id: "impact", label: "Collective Impact", icon: TrendingUp },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-partners-title">Stakeholder Ecosystem</h1>
          <p className="text-muted-foreground mt-1">Community partners, ambassadors, coordination, and collective impact</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "directory" && (
            <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-partner">
              <Plus className="mr-2 h-4 w-4" /> Add Partner
            </Button>
          )}
          {activeTab === "ambassadors" && (
            <Button onClick={() => setShowAmbassadorForm(!showAmbassadorForm)} data-testid="button-invite-ambassador">
              <UserPlus className="mr-2 h-4 w-4" /> Invite Ambassador
            </Button>
          )}
        </div>
      </div>

      {impact && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center" data-testid="card-stat-total-partners">
            <p className="text-2xl font-bold text-primary">{impact.totalPartners}</p>
            <p className="text-xs text-muted-foreground">Partners</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-verified">
            <p className="text-2xl font-bold text-emerald-600">{impact.verifiedPartners}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-with-mou">
            <p className="text-2xl font-bold text-blue-600">{impact.activeMOUs}</p>
            <p className="text-xs text-muted-foreground">Active MOUs</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-referrals">
            <p className="text-2xl font-bold text-violet-600">{impact.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-ambassadors">
            <p className="text-2xl font-bold text-amber-600">{impact.activeAmbassadors}</p>
            <p className="text-xs text-muted-foreground">Ambassadors</p>
          </Card>
        </div>
      )}

      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "directory" && (
        <>
          {showForm && (
            <Card className="p-6 space-y-4" data-testid="card-partner-form">
              <h2 className="font-semibold text-lg">Add Partner Organization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Organization name" data-testid="input-partner-name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} data-testid="select-partner-type">
                    <option value="">Select type...</option>
                    {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Name</label>
                  <Input value={formData.contactName} onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))} data-testid="input-partner-contact" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={formData.contactEmail} onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))} data-testid="input-partner-email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={formData.contactPhone} onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))} data-testid="input-partner-phone" />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} data-testid="input-partner-website" />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} data-testid="input-partner-city" />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} maxLength={2} data-testid="input-partner-state" />
                </div>
                <div>
                  <label className="text-sm font-medium">Service Area</label>
                  <Input value={formData.serviceArea} onChange={e => setFormData(p => ({ ...p, serviceArea: e.target.value }))} placeholder="e.g., Metro Atlanta" data-testid="input-partner-service-area" />
                </div>
                <div>
                  <label className="text-sm font-medium">Capacity</label>
                  <Input type="number" value={formData.capacity} onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))} placeholder="Max participants" data-testid="input-partner-capacity" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} data-testid="input-partner-description" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Categories (comma-separated)</label>
                  <Input value={formData.serviceCategories} onChange={e => setFormData(p => ({ ...p, serviceCategories: e.target.value }))} placeholder="counseling, job training" data-testid="input-partner-categories" />
                </div>
                <div>
                  <label className="text-sm font-medium">Programs Offered (comma-separated)</label>
                  <Input value={formData.programsOffered} onChange={e => setFormData(p => ({ ...p, programsOffered: e.target.value }))} placeholder="GED prep, life skills" data-testid="input-partner-programs" />
                </div>
                <div>
                  <label className="text-sm font-medium">Facilities Available (comma-separated)</label>
                  <Input value={formData.facilitiesAvailable} onChange={e => setFormData(p => ({ ...p, facilitiesAvailable: e.target.value }))} placeholder="meeting room, gym" data-testid="input-partner-facilities" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.type || createMutation.isPending} data-testid="button-submit-partner">
                  {createMutation.isPending ? "Adding..." : "Add Partner"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-partner">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="flex gap-2 flex-wrap items-center">
            <label className="text-sm font-medium">Filter by type:</label>
            <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)} data-testid="select-filter-type">
              <option value="">All Types</option>
              {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {filterType && <Button variant="ghost" size="sm" onClick={() => setFilterType("")} data-testid="button-clear-filter">Clear</Button>}
            <span className="text-sm text-muted-foreground ml-auto">{filteredPartners.length} partner{filteredPartners.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
              {partnersError ? (
                <Card className="p-6 text-center" data-testid="card-partners-error">
                  <Handshake className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-sm font-medium">Failed to load partners</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchPartners()} data-testid="button-retry-partners">Retry</Button>
                </Card>
              ) : isLoading ? (
                <Card className="p-4 text-center text-muted-foreground">Loading...</Card>
              ) : filteredPartners.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground" data-testid="card-no-partners">
                  <Handshake className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No partner organizations found</p>
                </Card>
              ) : (
                filteredPartners.map(partner => {
                  const Icon = getPartnerIcon(partner.type);
                  return (
                    <Card
                      key={partner.id}
                      className={`p-4 cursor-pointer transition-colors ${selectedPartner === partner.id ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedPartner(partner.id)}
                      data-testid={`card-partner-${partner.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-sm truncate">{partner.name}</p>
                        </div>
                        {partner.isVerified && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1">
                        <Badge variant="secondary" className="text-xs">{partner.type}</Badge>
                        {partner.mouStatus === "active" && <Badge variant="outline" className="text-xs">MOU Active</Badge>}
                        {partner.city && <Badge variant="outline" className="text-xs">{partner.city}</Badge>}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedPartner && partnerDetail ? (
                <>
                  <Card className="p-5" data-testid="card-partner-detail">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-lg">{partnerDetail.name}</h2>
                          {partnerDetail.isVerified && <Badge className="bg-emerald-600 text-white">Verified</Badge>}
                        </div>
                        <Badge variant="secondary" className="mt-1">{partnerDetail.type}</Badge>
                        {partnerDetail.mouStatus && partnerDetail.mouStatus !== "none" && (
                          <Badge variant="outline" className="ml-1 mt-1">MOU: {partnerDetail.mouStatus}</Badge>
                        )}
                        {partnerDetail.description && <p className="text-sm text-muted-foreground mt-3">{partnerDetail.description}</p>}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowReferralForm(true)} data-testid="button-new-referral">
                          <ArrowRight className="mr-1 h-4 w-4" /> Refer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowEngagementForm(true)} data-testid="button-new-engagement">
                          <Calendar className="mr-1 h-4 w-4" /> Log Engagement
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowMouForm(true)} data-testid="button-new-mou">
                          <FileText className="mr-1 h-4 w-4" /> New MOU
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate(partnerDetail.id)} data-testid="button-delete-partner">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {partnerDetail.contactName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{partnerDetail.contactName}</span>
                        </div>
                      )}
                      {partnerDetail.contactEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{partnerDetail.contactEmail}</span>
                        </div>
                      )}
                      {partnerDetail.contactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{partnerDetail.contactPhone}</span>
                        </div>
                      )}
                      {partnerDetail.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={partnerDetail.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{partnerDetail.website}</a>
                        </div>
                      )}
                      {(partnerDetail.city || partnerDetail.state) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{[partnerDetail.city, partnerDetail.state].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                      {partnerDetail.capacity && (
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>Capacity: {partnerDetail.capacity}</span>
                        </div>
                      )}
                    </div>

                    {partnerDetail.type === "Employer" && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Hiring Commitments</h4>
                        <div className="flex gap-4 text-sm">
                          <span>Committed: <strong>{partnerDetail.hiringCommitments || 0}</strong></span>
                          <span>Fulfilled: <strong>{partnerDetail.hiringFulfilled || 0}</strong></span>
                          <span>Rate: <strong>{partnerDetail.hiringCommitments ? Math.round(((partnerDetail.hiringFulfilled || 0) / partnerDetail.hiringCommitments) * 100) : 0}%</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.type === "Law Enforcement" && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Diversion Program</h4>
                        <p className="text-sm">Diversion Referrals: <strong>{partnerDetail.diversionReferrals || 0}</strong></p>
                      </div>
                    )}

                    {partnerDetail.type === "Church/Faith-Based" && (
                      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">Volunteer Program</h4>
                        <div className="flex gap-4 text-sm">
                          <span>Volunteers: <strong>{partnerDetail.volunteerCount || 0}</strong></span>
                          <span>Total Hours: <strong>{partnerDetail.totalVolunteerHours || 0}</strong></span>
                          <span>Events Hosted: <strong>{partnerDetail.eventsHosted || 0}</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.type === "School/Education" && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg" data-testid="card-education-metrics">
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">Education Partnership</h4>
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span>Participants Served: <strong>{partnerDetail.participantsServed || 0}</strong></span>
                          <span>Capacity: <strong>{partnerDetail.capacity || "N/A"}</strong></span>
                          <span>Events Hosted: <strong>{partnerDetail.eventsHosted || 0}</strong></span>
                        </div>
                        {partnerDetail.programsOffered && partnerDetail.programsOffered.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Programs: Literacy, GED, Tutoring</p>
                            <div className="flex flex-wrap gap-1">
                              {partnerDetail.programsOffered.map((prog: string) => (
                                <Badge key={prog} variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-300">{prog}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {partnerDetail.referrals && partnerDetail.referrals.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span>Student Referrals: <strong>{partnerDetail.referrals.length}</strong></span>
                            <span className="ml-3">Completed: <strong>{partnerDetail.referrals.filter((r: PartnerReferral) => r.status === "completed").length}</strong></span>
                          </div>
                        )}
                      </div>
                    )}

                    {partnerDetail.type === "Healthcare Provider" && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg" data-testid="card-healthcare-metrics">
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Healthcare Services</h4>
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span>Participants Served: <strong>{partnerDetail.participantsServed || 0}</strong></span>
                          <span>Capacity: <strong>{partnerDetail.capacity || "N/A"}</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.type === "Housing Authority" && (
                      <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-950 rounded-lg" data-testid="card-housing-metrics">
                        <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200 mb-2">Housing Services</h4>
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span>Participants Served: <strong>{partnerDetail.participantsServed || 0}</strong></span>
                          <span>Capacity: <strong>{partnerDetail.capacity || "N/A"}</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.type === "Community Policing Commission" && (
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg" data-testid="card-policing-metrics">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Community Policing</h4>
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span>Events Hosted: <strong>{partnerDetail.eventsHosted || 0}</strong></span>
                          <span>Participants Served: <strong>{partnerDetail.participantsServed || 0}</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.type === "Recidivism Prevention Task Force" && (
                      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg" data-testid="card-recidivism-metrics">
                        <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">Recidivism Prevention</h4>
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span>Diversion Referrals: <strong>{partnerDetail.diversionReferrals || 0}</strong></span>
                          <span>Participants Served: <strong>{partnerDetail.participantsServed || 0}</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.type === "Mentoring Program" && (
                      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg" data-testid="card-mentoring-metrics">
                        <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Mentoring Program</h4>
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span>Volunteers: <strong>{partnerDetail.volunteerCount || 0}</strong></span>
                          <span>Participants Served: <strong>{partnerDetail.participantsServed || 0}</strong></span>
                          <span>Total Hours: <strong>{partnerDetail.totalVolunteerHours || 0}</strong></span>
                        </div>
                      </div>
                    )}

                    {partnerDetail.serviceCategories && partnerDetail.serviceCategories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {partnerDetail.serviceCategories.map((cat: string) => (
                          <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    {partnerDetail.programsOffered && partnerDetail.programsOffered.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Programs Offered</p>
                        <div className="flex flex-wrap gap-1">
                          {partnerDetail.programsOffered.map((prog: string) => (
                            <Badge key={prog} variant="secondary" className="text-xs">{prog}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {showReferralForm && (
                    <Card className="p-5 space-y-3" data-testid="card-referral-form">
                      <h3 className="font-semibold">Create Referral to {partnerDetail.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Youth ID</label>
                          <Input value={referralData.userId} onChange={e => setReferralData(p => ({ ...p, userId: e.target.value }))} data-testid="input-referral-user" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Service Type</label>
                          <Input value={referralData.serviceType} onChange={e => setReferralData(p => ({ ...p, serviceType: e.target.value }))} data-testid="input-referral-service" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea value={referralData.notes} onChange={e => setReferralData(p => ({ ...p, notes: e.target.value }))} rows={2} data-testid="input-referral-notes" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => referralMutation.mutate({ ...referralData, partnerId: partnerDetail.id, referredBy: "case_manager" })} disabled={!referralData.userId || referralMutation.isPending} data-testid="button-submit-referral">
                          {referralMutation.isPending ? "Submitting..." : "Submit Referral"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowReferralForm(false)} data-testid="button-cancel-referral">Cancel</Button>
                      </div>
                    </Card>
                  )}

                  {showEngagementForm && (
                    <Card className="p-5 space-y-3" data-testid="card-engagement-form">
                      <h3 className="font-semibold">Log Engagement for {partnerDetail.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Engagement Type</label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={engagementData.engagementType} onChange={e => setEngagementData(p => ({ ...p, engagementType: e.target.value }))} data-testid="select-engagement-type">
                            <option value="">Select type...</option>
                            {ENGAGEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Title</label>
                          <Input value={engagementData.title} onChange={e => setEngagementData(p => ({ ...p, title: e.target.value }))} data-testid="input-engagement-title" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Event Date</label>
                          <Input type="date" value={engagementData.eventDate} onChange={e => setEngagementData(p => ({ ...p, eventDate: e.target.value }))} data-testid="input-engagement-date" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Volunteer Hours</label>
                          <Input type="number" value={engagementData.volunteerHours} onChange={e => setEngagementData(p => ({ ...p, volunteerHours: parseFloat(e.target.value) || 0 }))} data-testid="input-engagement-hours" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Participants Served</label>
                          <Input type="number" value={engagementData.participantsServed} onChange={e => setEngagementData(p => ({ ...p, participantsServed: parseInt(e.target.value) || 0 }))} data-testid="input-engagement-participants" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Resources Distributed</label>
                          <Input type="number" value={engagementData.resourcesDistributed} onChange={e => setEngagementData(p => ({ ...p, resourcesDistributed: parseInt(e.target.value) || 0 }))} data-testid="input-engagement-resources" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea value={engagementData.description} onChange={e => setEngagementData(p => ({ ...p, description: e.target.value }))} rows={2} data-testid="input-engagement-description" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={engagementData.facilityShared} onChange={e => setEngagementData(p => ({ ...p, facilityShared: e.target.checked }))} data-testid="checkbox-facility-shared" />
                        <label className="text-sm font-medium">Facility Shared</label>
                        {engagementData.facilityShared && (
                          <Input className="ml-2 flex-1" placeholder="Facility details" value={engagementData.facilityDetails} onChange={e => setEngagementData(p => ({ ...p, facilityDetails: e.target.value }))} data-testid="input-facility-details" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => engagementMutation.mutate({ ...engagementData, partnerId: partnerDetail.id })} disabled={!engagementData.engagementType || !engagementData.title || engagementMutation.isPending} data-testid="button-submit-engagement">
                          {engagementMutation.isPending ? "Logging..." : "Log Engagement"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowEngagementForm(false)} data-testid="button-cancel-engagement">Cancel</Button>
                      </div>
                    </Card>
                  )}

                  {showMouForm && (
                    <Card className="p-5 space-y-3" data-testid="card-mou-form">
                      <h3 className="font-semibold">Create MOU for {partnerDetail.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">MOU Title</label>
                          <Input value={mouData.title} onChange={e => setMouData(p => ({ ...p, title: e.target.value }))} data-testid="input-mou-title" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Signatory Name</label>
                          <Input value={mouData.signatoryName} onChange={e => setMouData(p => ({ ...p, signatoryName: e.target.value }))} data-testid="input-mou-signatory" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Signatory Title</label>
                          <Input value={mouData.signatoryTitle} onChange={e => setMouData(p => ({ ...p, signatoryTitle: e.target.value }))} data-testid="input-mou-signatory-title" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Start Date</label>
                          <Input type="date" value={mouData.startDate} onChange={e => setMouData(p => ({ ...p, startDate: e.target.value }))} data-testid="input-mou-start" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Date</label>
                          <Input type="date" value={mouData.endDate} onChange={e => setMouData(p => ({ ...p, endDate: e.target.value }))} data-testid="input-mou-end" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Renewal Date</label>
                          <Input type="date" value={mouData.renewalDate} onChange={e => setMouData(p => ({ ...p, renewalDate: e.target.value }))} data-testid="input-mou-renewal" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Terms</label>
                        <Textarea value={mouData.terms} onChange={e => setMouData(p => ({ ...p, terms: e.target.value }))} rows={3} data-testid="input-mou-terms" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => mouMutation.mutate({ ...mouData, partnerId: partnerDetail.id, status: "draft" })} disabled={!mouData.title || mouMutation.isPending} data-testid="button-submit-mou">
                          {mouMutation.isPending ? "Creating..." : "Create MOU Draft"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowMouForm(false)} data-testid="button-cancel-mou">Cancel</Button>
                      </div>
                    </Card>
                  )}

                  {partnerDetail.mous?.length > 0 && (
                    <Card className="p-5" data-testid="card-mou-list">
                      <h3 className="font-semibold mb-3">MOU Documents ({partnerDetail.mous.length})</h3>
                      <div className="space-y-2">
                        {partnerDetail.mous.map((mou: MouDocument) => (
                          <div key={mou.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{mou.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {mou.startDate ? new Date(mou.startDate).toLocaleDateString() : "No start date"} - {mou.endDate ? new Date(mou.endDate).toLocaleDateString() : "No end date"}
                              </p>
                            </div>
                            <Badge variant={mou.status === "active" || mou.status === "signed" ? "default" : "secondary"}>{mou.status}</Badge>
                            <div className="flex gap-1">
                              {mou.status === "draft" && (
                                <Button variant="ghost" size="sm" onClick={() => mouUpdateMutation.mutate({ id: mou.id, status: "sent" })} data-testid={`button-send-mou-${mou.id}`}>
                                  <Send className="h-3 w-3" />
                                </Button>
                              )}
                              {mou.status === "sent" && (
                                <Button variant="ghost" size="sm" onClick={() => mouUpdateMutation.mutate({ id: mou.id, status: "signed", signedDate: new Date().toISOString() })} data-testid={`button-sign-mou-${mou.id}`}>
                                  <PenLine className="h-3 w-3" />
                                </Button>
                              )}
                              {mou.status === "signed" && (
                                <Button variant="ghost" size="sm" onClick={() => mouUpdateMutation.mutate({ id: mou.id, status: "active" })} data-testid={`button-activate-mou-${mou.id}`}>
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {partnerDetail.engagements?.length > 0 && (
                    <Card className="p-5" data-testid="card-engagements-list">
                      <h3 className="font-semibold mb-3">Engagement History ({partnerDetail.engagements.length})</h3>
                      <div className="space-y-2">
                        {partnerDetail.engagements.map((eng: PartnerEngagement) => (
                          <div key={eng.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{eng.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {eng.engagementType} {eng.eventDate ? `- ${new Date(eng.eventDate).toLocaleDateString()}` : ""}
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {eng.volunteerHours ? <span>{eng.volunteerHours}h</span> : null}
                              {eng.participantsServed ? <span>{eng.participantsServed} served</span> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {partnerDetail.referrals?.length > 0 && (
                    <Card className="p-5" data-testid="card-referrals-list">
                      <h3 className="font-semibold mb-3">Referral History ({partnerDetail.referrals.length})</h3>
                      <div className="space-y-2">
                        {partnerDetail.referrals.map((ref: PartnerReferral) => (
                          <div key={ref.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            <div className="flex-1">
                              <p className="text-sm font-medium">User: {ref.userId}</p>
                              <p className="text-xs text-muted-foreground">{ref.serviceType} - {ref.createdAt ? new Date(String(ref.createdAt)).toLocaleDateString() : "N/A"}</p>
                            </div>
                            <Badge variant={ref.status === "completed" ? "default" : "secondary"}>{ref.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="p-8 text-center text-muted-foreground" data-testid="card-select-partner">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Select a partner to view details, manage referrals, engagements, and MOUs</p>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "coordination" && coordination && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 text-center" data-testid="card-coord-partners">
              <p className="text-2xl font-bold text-primary">{coordination.summary.totalPartners}</p>
              <p className="text-xs text-muted-foreground">Active Partners</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-coord-services">
              <p className="text-2xl font-bold text-emerald-600">{coordination.summary.serviceTypesCovered}</p>
              <p className="text-xs text-muted-foreground">Service Types</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-coord-hours">
              <p className="text-2xl font-bold text-blue-600">{coordination.summary.totalVolunteerHours.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Volunteer Hours</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-coord-served">
              <p className="text-2xl font-bold text-violet-600">{coordination.summary.totalParticipantsServed}</p>
              <p className="text-xs text-muted-foreground">Participants Served</p>
            </Card>
          </div>

          {coordination.serviceGaps.length > 0 && (
            <Card className="p-4 border-amber-200 dark:border-amber-800" data-testid="card-service-gaps">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Service Gaps Identified</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">The following service types are not yet covered by any partner in this community:</p>
              <div className="flex flex-wrap gap-1">
                {coordination.serviceGaps.map(gap => (
                  <Badge key={gap} variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">{gap}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5" data-testid="card-coordination-table">
            <h3 className="font-semibold mb-4">Multi-Agency Coordination</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Organization</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">Location</th>
                    <th className="text-center py-2 px-3 font-medium">Referrals</th>
                    <th className="text-center py-2 px-3 font-medium">Engagements</th>
                    <th className="text-center py-2 px-3 font-medium">Vol. Hours</th>
                    <th className="text-center py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coordination.partners.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          {p.name}
                          {p.isVerified && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        </div>
                      </td>
                      <td className="py-2 px-3"><Badge variant="secondary" className="text-xs">{p.type}</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">{[p.city, p.state].filter(Boolean).join(", ") || "-"}</td>
                      <td className="py-2 px-3 text-center">{p.referralCount} ({p.completedReferrals})</td>
                      <td className="py-2 px-3 text-center">{p.engagementCount}</td>
                      <td className="py-2 px-3 text-center">{p.volunteerHours.toFixed(0)}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={p.mouStatus === "active" ? "default" : "outline"} className="text-xs">{p.mouStatus || "none"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {coordination.ambassadors.length > 0 && (
            <Card className="p-5" data-testid="card-coord-ambassadors">
              <h3 className="font-semibold mb-3">Community Ambassadors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coordination.ambassadors.map((a: AmbassadorProfile) => (
                  <div key={a.id} className="p-3 rounded-lg border flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.assignedCommunity || a.assignedRegion || "Unassigned"}</p>
                    </div>
                    <Badge variant={a.status === "active" ? "default" : "secondary"} className="ml-auto text-xs">{a.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "ambassadors" && (
        <div className="space-y-6">
          {showAmbassadorForm && (
            <Card className="p-6 space-y-4" data-testid="card-ambassador-form">
              <h2 className="font-semibold text-lg">Invite Ambassador / Ground Partner</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input value={ambassadorData.name} onChange={e => setAmbassadorData(p => ({ ...p, name: e.target.value }))} data-testid="input-ambassador-name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={ambassadorData.email} onChange={e => setAmbassadorData(p => ({ ...p, email: e.target.value }))} data-testid="input-ambassador-email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={ambassadorData.phone} onChange={e => setAmbassadorData(p => ({ ...p, phone: e.target.value }))} data-testid="input-ambassador-phone" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ambassadorData.role} onChange={e => setAmbassadorData(p => ({ ...p, role: e.target.value }))} data-testid="select-ambassador-role">
                    <option value="ambassador">Ambassador</option>
                    <option value="community_liaison">Community Liaison</option>
                    <option value="program_coordinator">Program Coordinator</option>
                    <option value="volunteer_coordinator">Volunteer Coordinator</option>
                    <option value="outreach_specialist">Outreach Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Assigned Community</label>
                  <Input value={ambassadorData.assignedCommunity} onChange={e => setAmbassadorData(p => ({ ...p, assignedCommunity: e.target.value }))} placeholder="e.g., South Atlanta" data-testid="input-ambassador-community" />
                </div>
                <div>
                  <label className="text-sm font-medium">Assigned Region</label>
                  <Input value={ambassadorData.assignedRegion} onChange={e => setAmbassadorData(p => ({ ...p, assignedRegion: e.target.value }))} data-testid="input-ambassador-region" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea value={ambassadorData.bio} onChange={e => setAmbassadorData(p => ({ ...p, bio: e.target.value }))} rows={2} data-testid="input-ambassador-bio" />
              </div>
              <div>
                <label className="text-sm font-medium">Specializations (comma-separated)</label>
                <Input value={ambassadorData.specializations} onChange={e => setAmbassadorData(p => ({ ...p, specializations: e.target.value }))} placeholder="youth mentoring, job placement" data-testid="input-ambassador-specializations" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const specs = ambassadorData.specializations.split(",").map(s => s.trim()).filter(Boolean);
                  ambassadorMutation.mutate({ ...ambassadorData, specializations: specs.length ? specs : undefined });
                }} disabled={!ambassadorData.name || ambassadorMutation.isPending} data-testid="button-submit-ambassador">
                  {ambassadorMutation.isPending ? "Inviting..." : "Send Invitation"}
                </Button>
                <Button variant="outline" onClick={() => setShowAmbassadorForm(false)} data-testid="button-cancel-ambassador">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambassadors.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground col-span-full" data-testid="card-no-ambassadors">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No ambassadors yet. Invite local ground partners to join the ecosystem.</p>
              </Card>
            ) : (
              ambassadors.map(amb => (
                <Card key={amb.id} className="p-4" data-testid={`card-ambassador-${amb.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{amb.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{amb.role?.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <Badge variant={amb.status === "active" ? "default" : amb.status === "onboarding" ? "secondary" : "outline"} className="text-xs">{amb.status}</Badge>
                  </div>
                  {amb.assignedCommunity && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" /> {amb.assignedCommunity}
                    </div>
                  )}
                  {amb.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" /> {amb.email}
                    </div>
                  )}
                  {amb.specializations && amb.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {amb.specializations.map(s => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1 mt-3">
                    {amb.status === "invited" && (
                      <Button variant="outline" size="sm" onClick={() => ambassadorUpdateMutation.mutate({ id: amb.id, status: "onboarding" })} data-testid={`button-onboard-${amb.id}`}>
                        Begin Onboarding
                      </Button>
                    )}
                    {amb.status === "onboarding" && (
                      <Button variant="outline" size="sm" onClick={() => ambassadorUpdateMutation.mutate({ id: amb.id, status: "active" })} data-testid={`button-activate-${amb.id}`}>
                        Activate
                      </Button>
                    )}
                    {amb.status === "active" && (
                      <Button variant="ghost" size="sm" onClick={() => ambassadorUpdateMutation.mutate({ id: amb.id, status: "inactive" })} data-testid={`button-deactivate-${amb.id}`}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "mou" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 text-center" data-testid="card-mou-active">
              <p className="text-2xl font-bold text-emerald-600">{allMous.filter(m => m.status === "active" || m.status === "signed").length}</p>
              <p className="text-xs text-muted-foreground">Active MOUs</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-mou-draft">
              <p className="text-2xl font-bold text-blue-600">{allMous.filter(m => m.status === "draft").length}</p>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-mou-sent">
              <p className="text-2xl font-bold text-amber-600">{allMous.filter(m => m.status === "sent").length}</p>
              <p className="text-xs text-muted-foreground">Sent / Pending</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-mou-expired">
              <p className="text-2xl font-bold text-red-600">{allMous.filter(m => m.status === "expired").length}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </Card>
          </div>

          {allMous.filter(m => {
            if (!m.endDate) return false;
            const days = (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            return days > 0 && days <= 90;
          }).length > 0 && (
            <Card className="p-4 border-amber-200 dark:border-amber-800" data-testid="card-mou-renewal-alert">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Renewal Reminders</h3>
              </div>
              <div className="space-y-2">
                {allMous.filter(m => {
                  if (!m.endDate) return false;
                  const days = (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                  return days > 0 && days <= 90;
                }).map(m => {
                  const daysLeft = Math.ceil((new Date(m.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const partnerName = partners.find(p => p.id === m.partnerId)?.name || "Unknown";
                  return (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded border border-amber-200 dark:border-amber-800">
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{partnerName}</p>
                      </div>
                      <Badge variant="outline" className="text-amber-700 dark:text-amber-300">{daysLeft} days remaining</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5" data-testid="card-all-mous">
            <h3 className="font-semibold mb-4">All MOU Documents</h3>
            {allMous.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No MOU documents yet. Create one from a partner's detail view.</p>
            ) : (
              <div className="space-y-2">
                {allMous.map(mou => {
                  const partnerName = partners.find(p => p.id === mou.partnerId)?.name || "Unknown Partner";
                  return (
                    <div key={mou.id} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`row-mou-${mou.id}`}>
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mou.title}</p>
                        <p className="text-xs text-muted-foreground">{partnerName}</p>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {mou.startDate ? new Date(mou.startDate).toLocaleDateString() : ""} - {mou.endDate ? new Date(mou.endDate).toLocaleDateString() : ""}
                      </div>
                      <Badge variant={mou.status === "active" || mou.status === "signed" ? "default" : mou.status === "expired" ? "destructive" : "secondary"} className="text-xs">{mou.status}</Badge>
                      <div className="flex gap-1">
                        {mou.status === "draft" && (
                          <Button variant="ghost" size="sm" onClick={() => mouUpdateMutation.mutate({ id: mou.id, status: "sent" })} data-testid={`button-mou-send-${mou.id}`}>
                            <Send className="h-3 w-3 mr-1" /> Send
                          </Button>
                        )}
                        {mou.status === "sent" && (
                          <Button variant="ghost" size="sm" onClick={() => mouUpdateMutation.mutate({ id: mou.id, status: "signed", signedDate: new Date().toISOString() })} data-testid={`button-mou-sign-${mou.id}`}>
                            <PenLine className="h-3 w-3 mr-1" /> Sign
                          </Button>
                        )}
                        {mou.status === "signed" && (
                          <Button variant="ghost" size="sm" onClick={() => mouUpdateMutation.mutate({ id: mou.id, status: "active" })} data-testid={`button-mou-activate-${mou.id}`}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "impact" && collectiveImpact && (
        <div className="space-y-6">
          <Card className="p-5" data-testid="card-impact-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{collectiveImpact.reportTitle}</h2>
                <p className="text-sm text-muted-foreground">Region: {collectiveImpact.region} | Generated: {new Date(collectiveImpact.generatedAt).toLocaleDateString()}</p>
              </div>
              <Award className="h-8 w-8 text-primary opacity-60" />
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 text-center" data-testid="card-impact-partners">
              <p className="text-2xl font-bold text-primary">{collectiveImpact.overview.totalPartners}</p>
              <p className="text-xs text-muted-foreground">Active Partners</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-impact-participants">
              <p className="text-2xl font-bold text-emerald-600">{collectiveImpact.referralOutcomes.uniqueParticipants}</p>
              <p className="text-xs text-muted-foreground">Unique Participants</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-impact-completion">
              <p className="text-2xl font-bold text-blue-600">{collectiveImpact.referralOutcomes.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Referral Completion</p>
            </Card>
            <Card className="p-3 text-center" data-testid="card-impact-mous">
              <p className="text-2xl font-bold text-violet-600">{collectiveImpact.overview.activeMOUs}</p>
              <p className="text-xs text-muted-foreground">Active MOUs</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5" data-testid="card-impact-referrals">
              <h3 className="font-semibold mb-4">Referral Outcomes</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-medium">{collectiveImpact.referralOutcomes.totalReferrals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-emerald-600">{collectiveImpact.referralOutcomes.completedReferrals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-blue-600">{collectiveImpact.referralOutcomes.activeReferrals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">{collectiveImpact.referralOutcomes.completionRate}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-5" data-testid="card-impact-engagement">
              <h3 className="font-semibold mb-4">Community Engagement</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Engagements</span>
                  <span className="font-medium">{collectiveImpact.communityEngagement.totalEngagements}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volunteer Hours</span>
                  <span className="font-medium text-blue-600">{collectiveImpact.communityEngagement.totalVolunteerHours.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participants Served</span>
                  <span className="font-medium text-emerald-600">{collectiveImpact.communityEngagement.totalParticipantsServed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resources Distributed</span>
                  <span className="font-medium">{collectiveImpact.communityEngagement.totalResourcesDistributed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Facility Sharing Events</span>
                  <span className="font-medium">{collectiveImpact.communityEngagement.facilitySharedEvents}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5" data-testid="card-impact-employment">
              <h3 className="font-semibold mb-4">Employment Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hiring Commitments</span>
                  <span className="font-medium">{collectiveImpact.employmentImpact.totalHiringCommitments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Positions Fulfilled</span>
                  <span className="font-medium text-emerald-600">{collectiveImpact.employmentImpact.totalHiringFulfilled}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fulfillment Rate</span>
                  <span className="font-medium">{collectiveImpact.employmentImpact.fulfillmentRate}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-5" data-testid="card-impact-justice">
              <h3 className="font-semibold mb-4">Justice Diversion Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Diversion Referrals</span>
                  <span className="font-medium text-amber-600">{collectiveImpact.justiceImpact.totalDiversionReferrals}</span>
                </div>
              </div>
            </Card>
          </div>

          {Object.keys(collectiveImpact.serviceBreakdown).length > 0 && (
            <Card className="p-5" data-testid="card-impact-services">
              <h3 className="font-semibold mb-4">Service Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Service Type</th>
                      <th className="text-center py-2 px-3 font-medium">Partners</th>
                      <th className="text-center py-2 px-3 font-medium">Referrals</th>
                      <th className="text-center py-2 px-3 font-medium">Completed</th>
                      <th className="text-center py-2 px-3 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(collectiveImpact.serviceBreakdown).map(([type, data]) => (
                      <tr key={type} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">{type}</td>
                        <td className="py-2 px-3 text-center">{data.partners}</td>
                        <td className="py-2 px-3 text-center">{data.referrals}</td>
                        <td className="py-2 px-3 text-center">{data.completed}</td>
                        <td className="py-2 px-3 text-center">{data.referrals > 0 ? Math.round((data.completed / data.referrals) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {Object.keys(collectiveImpact.communityEngagement.engagementsByType).length > 0 && (
            <Card className="p-5" data-testid="card-impact-engagement-types">
              <h3 className="font-semibold mb-4">Engagement Type Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Engagement Type</th>
                      <th className="text-center py-2 px-3 font-medium">Count</th>
                      <th className="text-center py-2 px-3 font-medium">Volunteer Hours</th>
                      <th className="text-center py-2 px-3 font-medium">Participants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(collectiveImpact.communityEngagement.engagementsByType).map(([type, data]) => (
                      <tr key={type} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">{type}</td>
                        <td className="py-2 px-3 text-center">{data.count}</td>
                        <td className="py-2 px-3 text-center">{data.volunteerHours.toFixed(0)}</td>
                        <td className="py-2 px-3 text-center">{data.participantsServed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
