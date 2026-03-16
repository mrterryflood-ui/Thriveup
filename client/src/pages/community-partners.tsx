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
  Globe, MapPin, Users, BarChart3, Trash2, ArrowRight, FileText
} from "lucide-react";
import type { CommunityPartner, PartnerReferral } from "@shared/schema";

interface PartnerImpact {
  totalPartners: number;
  verifiedPartners: number;
  withMOU: number;
  totalReferrals: number;
  completedReferrals: number;
  partnerStats: Array<{
    partnerId: string; partnerName: string; type: string;
    totalReferrals: number; completed: number; pending: number; active: number;
    completionRate: number; mouStatus: string; isVerified: boolean;
  }>;
}

interface PartnerDetail extends CommunityPartner {
  referrals: PartnerReferral[];
}

const PARTNER_TYPES = [
  "Mental Health Services", "Substance Abuse Treatment", "Housing Services",
  "Employment Services", "Education/GED", "Legal Aid", "Mentoring",
  "Youth Development", "Family Services", "Healthcare", "Food Assistance",
  "Transportation", "Financial Coaching", "Faith-Based Organization",
];

export default function CommunityPartnersPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralData, setReferralData] = useState({ userId: "", serviceType: "", notes: "" });
  const [formData, setFormData] = useState({
    name: "", type: "", description: "", contactName: "", contactEmail: "",
    contactPhone: "", address: "", city: "", state: "", zipCode: "",
    website: "", serviceArea: "", serviceCategories: "",
  });

  const { data: partners = [], isLoading, error: partnersError, refetch: refetchPartners } = useQuery<CommunityPartner[]>({ queryKey: ["/api/partners"] });
  const { data: impact } = useQuery<PartnerImpact>({ queryKey: ["/api/partners/dashboard/impact"] });
  const { data: partnerDetail } = useQuery<PartnerDetail>({
    queryKey: ["/api/partners", selectedPartner],
    enabled: !!selectedPartner,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/partners", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/dashboard/impact"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/partners", selectedPartner] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/dashboard/impact"] });
      setShowReferralForm(false);
      setReferralData({ userId: "", serviceType: "", notes: "" });
      toast({ title: "Referral created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/partners/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/dashboard/impact"] });
      if (selectedPartner) setSelectedPartner(null);
      toast({ title: "Partner removed" });
    },
  });

  const handleSubmit = () => {
    const cats = formData.serviceCategories.split(",").map(s => s.trim()).filter(Boolean);
    createMutation.mutate({ ...formData, serviceCategories: cats.length ? cats : undefined });
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-partners-title">Community Partner Network</h1>
          <p className="text-muted-foreground mt-1">Partner organizations, referral workflows, and impact tracking</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-partner" aria-label="Add partner organization">
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>

      {impact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center" data-testid="card-stat-total-partners">
            <p className="text-2xl font-bold text-primary">{impact.totalPartners}</p>
            <p className="text-sm text-muted-foreground">Partners</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-verified">
            <p className="text-2xl font-bold text-emerald-600">{impact.verifiedPartners}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-with-mou">
            <p className="text-2xl font-bold text-blue-600">{impact.withMOU}</p>
            <p className="text-sm text-muted-foreground">Active MOUs</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-referrals">
            <p className="text-2xl font-bold text-violet-600">{impact.totalReferrals}</p>
            <p className="text-sm text-muted-foreground">Total Referrals</p>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="p-6 space-y-4" data-testid="card-partner-form">
          <h2 className="font-semibold text-lg">Add Partner Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Organization Name</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Organization name" data-testid="input-partner-name" aria-label="Organization name" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} data-testid="select-partner-type" aria-label="Partner type">
                <option value="">Select type...</option>
                {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Contact Name</label>
              <Input value={formData.contactName} onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))} data-testid="input-partner-contact" aria-label="Contact name" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={formData.contactEmail} onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))} data-testid="input-partner-email" aria-label="Contact email" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={formData.contactPhone} onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))} data-testid="input-partner-phone" aria-label="Phone" />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} data-testid="input-partner-website" aria-label="Website" />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} data-testid="input-partner-city" aria-label="City" />
            </div>
            <div>
              <label className="text-sm font-medium">State</label>
              <Input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} maxLength={2} data-testid="input-partner-state" aria-label="State" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} data-testid="input-partner-description" aria-label="Description" />
          </div>
          <div>
            <label className="text-sm font-medium">Service Categories (comma-separated)</label>
            <Input value={formData.serviceCategories} onChange={e => setFormData(p => ({ ...p, serviceCategories: e.target.value }))} placeholder="counseling, job training, housing" data-testid="input-partner-categories" aria-label="Service categories" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.type || createMutation.isPending} data-testid="button-submit-partner" aria-label="Add partner">
              {createMutation.isPending ? "Adding..." : "Add Partner"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} aria-label="Cancel" data-testid="button-cancel-partner">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-lg" data-testid="text-directory-heading">Partner Directory</h2>
          {partnersError ? (
            <Card className="p-6 text-center" data-testid="card-partners-error">
              <Handshake className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-medium">Failed to load partners</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchPartners()} data-testid="button-retry-partners" aria-label="Retry loading partners">Retry</Button>
            </Card>
          ) : isLoading ? (
            <Card className="p-4 text-center text-muted-foreground">Loading...</Card>
          ) : partners.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground" data-testid="card-no-partners">
              <Handshake className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No partner organizations yet</p>
            </Card>
          ) : (
            partners.map(partner => (
              <Card
                key={partner.id}
                className={`p-4 cursor-pointer transition-colors ${selectedPartner === partner.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedPartner(partner.id)}
                data-testid={`card-partner-${partner.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm truncate">{partner.name}</p>
                  {partner.isVerified && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                </div>
                <Badge variant="secondary" className="text-xs">{partner.type}</Badge>
                {partner.mouStatus === "active" && <Badge variant="outline" className="text-xs ml-1">MOU Active</Badge>}
              </Card>
            ))
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
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setShowReferralForm(true)} data-testid="button-new-referral" aria-label="Create referral">
                      <ArrowRight className="mr-1 h-4 w-4" /> Refer
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate(partnerDetail.id)} aria-label="Delete partner" data-testid="button-delete-partner">
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
                </div>
                {partnerDetail.serviceCategories?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {partnerDetail.serviceCategories.map((cat: string) => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                    ))}
                  </div>
                )}
              </Card>

              {showReferralForm && (
                <Card className="p-5 space-y-3" data-testid="card-referral-form">
                  <h3 className="font-semibold">Create Referral to {partnerDetail.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Youth ID</label>
                      <Input value={referralData.userId} onChange={e => setReferralData(p => ({ ...p, userId: e.target.value }))} data-testid="input-referral-user" aria-label="Youth ID" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Service Type</label>
                      <Input value={referralData.serviceType} onChange={e => setReferralData(p => ({ ...p, serviceType: e.target.value }))} data-testid="input-referral-service" aria-label="Service type" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea value={referralData.notes} onChange={e => setReferralData(p => ({ ...p, notes: e.target.value }))} rows={2} data-testid="input-referral-notes" aria-label="Referral notes" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => referralMutation.mutate({ ...referralData, partnerId: partnerDetail.id, referredBy: "case_manager" })} disabled={!referralData.userId || referralMutation.isPending} data-testid="button-submit-referral" aria-label="Submit referral">
                      {referralMutation.isPending ? "Submitting..." : "Submit Referral"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowReferralForm(false)} aria-label="Cancel" data-testid="button-cancel-referral">Cancel</Button>
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
                          <p className="text-xs text-muted-foreground">{ref.serviceType} - {new Date(ref.createdAt).toLocaleDateString()}</p>
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
              <p>Select a partner to view details and manage referrals</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
