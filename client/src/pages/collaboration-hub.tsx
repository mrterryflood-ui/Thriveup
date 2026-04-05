import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Handshake, Building2, Users, ArrowRightLeft, Target, Search,
  Plus, CheckCircle2, Clock, AlertTriangle, ExternalLink, Mail,
  Phone, MapPin, Globe, FileText, TrendingUp, Send, UserPlus,
  ArrowRight, ArrowLeft, BarChart3, Shield,
} from "lucide-react";
import type { CommunityPartner, PartnershipRequest, SharedOutcome, ExternalWarmHandoff } from "@shared/schema";

const ORG_TYPES = ["nonprofit", "government", "healthcare", "education", "faith-based", "business", "community-group", "research"];
const FOCUS_AREAS = ["workforce-development", "youth-education", "reentry-services", "mental-health", "substance-abuse", "housing", "food-security", "legal-aid", "healthcare", "technology", "data-research", "advocacy", "veteran-services", "disability-services"];
const URGENCY_LEVELS = ["standard", "urgent", "emergency"];
const OUTCOME_CATEGORIES = ["workforce", "education", "health", "justice", "housing", "community-engagement", "research"];
const METRIC_TYPES = ["count", "percentage", "rate", "score", "currency"];

function PartnerDirectory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const { data: partnersRaw, isLoading } = useQuery<CommunityPartner[]>({
    queryKey: ["/api/collaboration/partners", search, categoryFilter],
  });
  const partners = partnersRaw ?? [];

  const filtered = partners.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.city?.toLowerCase().includes(s) && !p.description?.toLowerCase().includes(s)) return false;
    }
    if (categoryFilter !== "all" && p.type !== categoryFilter && !p.serviceCategories?.includes(categoryFilter)) return false;
    return true;
  });

  const { data: partnerDetail } = useQuery({
    queryKey: ["/api/collaboration/partners", selectedPartner],
    enabled: !!selectedPartner,
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search partners by name, city, or service..."
            className="pl-9"
            data-testid="input-partner-search"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-partner-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ORG_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {partners.length === 0 ? "No partners yet. Use the Partnership Requests tab to start onboarding organizations." : "No partners match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(partner => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPartner(partner.id)} data-testid={`card-partner-${partner.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm truncate" data-testid={`text-partner-name-${partner.id}`}>{partner.name}</h4>
                      {partner.isVerified && <Badge variant="default" className="text-xs"><Shield className="h-3 w-3 mr-1" />Verified</Badge>}
                      {partner.mouStatus === "active" && <Badge variant="secondary" className="text-xs">MOU Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{partner.description || "No description"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <Badge variant="outline" className="text-xs">{partner.type.replace(/-/g, " ")}</Badge>
                      {partner.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{partner.city}, {partner.state}</span>}
                      {partner.participantsServed ? <span className="flex items-center gap-1"><Users className="h-3 w-3" />{partner.participantsServed} served</span> : null}
                    </div>
                  </div>
                </div>
                {partner.serviceCategories && partner.serviceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {partner.serviceCategories.slice(0, 4).map(c => (
                      <Badge key={c} variant="secondary" className="text-xs">{c.replace(/-/g, " ")}</Badge>
                    ))}
                    {partner.serviceCategories.length > 4 && <Badge variant="secondary" className="text-xs">+{partner.serviceCategories.length - 4}</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPartner && partnerDetail && (
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" data-testid="text-partner-detail-name">
                <Building2 className="h-5 w-5" />
                {(partnerDetail as any).partner?.name}
              </DialogTitle>
            </DialogHeader>
            <PartnerDetailView detail={partnerDetail as any} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PartnerDetailView({ detail }: { detail: { partner: CommunityPartner; referrals: any[]; engagements: any[]; outcomes: SharedOutcome[]; handoffs: ExternalWarmHandoff[]; mous: any[] } }) {
  const p = detail.partner;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {p.contactName && <div><span className="text-muted-foreground">Contact:</span> {p.contactName}</div>}
        {p.contactEmail && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.contactEmail}</div>}
        {p.contactPhone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.contactPhone}</div>}
        {p.website && <div className="flex items-center gap-1"><Globe className="h-3 w-3" /><a href={p.website} target="_blank" className="text-primary hover:underline">{p.website}</a></div>}
        {p.address && <div className="col-span-2 flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}, {p.city}, {p.state} {p.zipCode}</div>}
      </div>
      {p.description && <p className="text-sm">{p.description}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{detail.referrals.length}</p><p className="text-xs text-muted-foreground">Referrals</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{detail.engagements.length}</p><p className="text-xs text-muted-foreground">Engagements</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{detail.outcomes.length}</p><p className="text-xs text-muted-foreground">Shared Outcomes</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{detail.handoffs.length}</p><p className="text-xs text-muted-foreground">Warm Handoffs</p></CardContent></Card>
      </div>
    </div>
  );
}

function PartnershipRequestsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const { data: requestsRaw, isLoading } = useQuery<PartnershipRequest[]>({ queryKey: ["/api/collaboration/partnership-requests"] });
  const requests = requestsRaw ?? [];

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/collaboration/partnership-requests/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/partnership-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/partners"] });
      toast({ title: "Partner Onboarded", description: "Organization has been added to the partner directory." });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes?: string }) => {
      await apiRequest("PATCH", `/api/collaboration/partnership-requests/${id}`, { status, reviewNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/partnership-requests"] });
      toast({ title: "Request Updated" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const onboarded = requests.filter(r => r.status === "onboarded");
  const declined = requests.filter(r => r.status === "declined");

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" data-testid="text-requests-title">Partnership Requests</h3>
          <p className="text-sm text-muted-foreground">Review incoming partnership inquiries and onboard new organizations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-new-request">
          <Plus className="h-4 w-4 mr-1" /> Add Request
        </Button>
      </div>

      {showForm && <PartnershipRequestForm onClose={() => setShowForm(false)} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-pending-count">{pending.length}</p><p className="text-xs text-muted-foreground">Pending Review</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{approved.length}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600 dark:text-green-400">{onboarded.length}</p><p className="text-xs text-muted-foreground">Onboarded</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-muted-foreground">{declined.length}</p><p className="text-xs text-muted-foreground">Declined</p></CardContent></Card>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No partnership requests yet. Share your partnership inquiry link to start receiving requests from organizations.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id} data-testid={`card-request-${req.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm">{req.organizationName}</h4>
                      <Badge variant={req.status === "pending" ? "destructive" : req.status === "approved" ? "default" : req.status === "onboarded" ? "default" : "secondary"} className="text-xs">
                        {req.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{req.organizationType.replace(/-/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{req.contactName} — {req.contactEmail}</p>
                    {req.mission && <p className="text-xs line-clamp-2">{req.mission}</p>}
                    {req.focusAreas && req.focusAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {req.focusAreas.map(a => <Badge key={a} variant="secondary" className="text-xs">{a.replace(/-/g, " ")}</Badge>)}
                      </div>
                    )}
                    {req.geographicArea && <p className="text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3 inline mr-1" />{req.geographicArea}</p>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {req.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateMutation.mutate({ id: req.id, status: "approved" })} data-testid={`button-approve-request-${req.id}`}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: req.id, status: "declined" })} data-testid={`button-decline-request-${req.id}`}>
                          Decline
                        </Button>
                      </>
                    )}
                    {req.status === "approved" && (
                      <Button size="sm" onClick={() => convertMutation.mutate(req.id)} disabled={convertMutation.isPending} data-testid={`button-onboard-${req.id}`}>
                        <UserPlus className="h-4 w-4 mr-1" /> Onboard to Directory
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PartnershipRequestForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    organizationName: "", organizationType: "nonprofit", ein: "", website: "",
    contactName: "", contactTitle: "", contactEmail: "", contactPhone: "",
    mission: "", focusAreas: [] as string[], geographicArea: "",
    populationsServed: [] as string[], collaborationInterests: [] as string[],
    proposedActivities: "", annualBudget: "", staffSize: 0, yearsOperating: 0,
    existingPartnerships: "", howHeardAboutUs: "", status: "pending", reviewNotes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/collaboration/partnership-requests", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/partnership-requests"] });
      toast({ title: "Partnership Request Created" });
      onClose();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function toggleArrayItem(field: "focusAreas" | "collaborationInterests", item: string) {
    const current = form[field];
    setForm({ ...form, [field]: current.includes(item) ? current.filter(i => i !== item) : [...current, item] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Partnership Request</CardTitle>
        <CardDescription>Add an organization that wants to partner with ThriveUp</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Organization Name *</Label>
            <Input value={form.organizationName} onChange={e => setForm({ ...form, organizationName: e.target.value })} data-testid="input-req-org-name" />
          </div>
          <div className="space-y-1">
            <Label>Organization Type *</Label>
            <Select value={form.organizationType} onValueChange={v => setForm({ ...form, organizationType: v })}>
              <SelectTrigger data-testid="select-req-org-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Contact Name *</Label>
            <Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} data-testid="input-req-contact-name" />
          </div>
          <div className="space-y-1">
            <Label>Contact Email *</Label>
            <Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} data-testid="input-req-contact-email" />
          </div>
          <div className="space-y-1">
            <Label>Contact Phone</Label>
            <Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} data-testid="input-req-contact-phone" />
          </div>
          <div className="space-y-1">
            <Label>Contact Title</Label>
            <Input value={form.contactTitle} onChange={e => setForm({ ...form, contactTitle: e.target.value })} data-testid="input-req-contact-title" />
          </div>
          <div className="space-y-1">
            <Label>Website</Label>
            <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} data-testid="input-req-website" />
          </div>
          <div className="space-y-1">
            <Label>Geographic Area</Label>
            <Input value={form.geographicArea} onChange={e => setForm({ ...form, geographicArea: e.target.value })} placeholder="e.g., Austin, Travis County" data-testid="input-req-geo" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Mission</Label>
          <Textarea value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })} rows={2} data-testid="input-req-mission" />
        </div>
        <div className="space-y-1">
          <Label>Focus Areas</Label>
          <div className="flex flex-wrap gap-1">
            {FOCUS_AREAS.map(a => (
              <Badge key={a} variant={form.focusAreas.includes(a) ? "default" : "outline"} className="cursor-pointer text-xs"
                onClick={() => toggleArrayItem("focusAreas", a)} data-testid={`badge-focus-${a}`}>
                {a.replace(/-/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label>Proposed Activities</Label>
          <Textarea value={form.proposedActivities} onChange={e => setForm({ ...form, proposedActivities: e.target.value })} rows={2} placeholder="How do you envision collaborating?" data-testid="input-req-activities" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.organizationName || !form.contactName || !form.contactEmail || mutation.isPending} data-testid="button-submit-request">
            {mutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SharedOutcomesTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const { data: outcomesRaw, isLoading } = useQuery<SharedOutcome[]>({ queryKey: ["/api/collaboration/shared-outcomes"] });
  const outcomes = outcomesRaw ?? [];
  const { data: partnersRaw2 } = useQuery<CommunityPartner[]>({ queryKey: ["/api/collaboration/partners"] });
  const partners = partnersRaw2 ?? [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      await apiRequest("PATCH", `/api/collaboration/shared-outcomes/${id}`, { currentValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/shared-outcomes"] });
      toast({ title: "Outcome Updated" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]));

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" data-testid="text-outcomes-title">Shared Outcomes</h3>
          <p className="text-sm text-muted-foreground">Track metrics jointly with partner organizations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-new-outcome">
          <Plus className="h-4 w-4 mr-1" /> Add Outcome
        </Button>
      </div>

      {showForm && <SharedOutcomeForm partners={partners} onClose={() => setShowForm(false)} />}

      {outcomes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No shared outcomes yet. Create one to start tracking joint metrics with partner organizations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outcomes.map(outcome => {
            const progress = outcome.targetValue ? Math.min(100, Math.round(((outcome.currentValue || 0) / outcome.targetValue) * 100)) : 0;
            return (
              <Card key={outcome.id} data-testid={`card-outcome-${outcome.id}`}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm">{outcome.outcomeName}</h4>
                      <p className="text-xs text-muted-foreground">{partnerMap[outcome.partnerId] || "Unknown Partner"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{outcome.outcomeCategory}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{outcome.currentValue || 0} / {outcome.targetValue || "—"} {outcome.unit}</span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {outcome.partnerContribution && <div><span className="text-muted-foreground">Partner:</span> {outcome.partnerContribution}</div>}
                    {outcome.thriveUpContribution && <div><span className="text-muted-foreground">ThriveUp:</span> {outcome.thriveUpContribution}</div>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SharedOutcomeForm({ partners, onClose }: { partners: CommunityPartner[]; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    partnerId: "", outcomeName: "", outcomeCategory: "workforce", metricType: "count",
    targetValue: 0, currentValue: 0, unit: "", reportingPeriod: "quarterly",
    partnerContribution: "", thriveUpContribution: "", dataSource: "", verificationMethod: "", notes: "", status: "active",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/collaboration/shared-outcomes", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/shared-outcomes"] });
      toast({ title: "Shared Outcome Created" });
      onClose();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Shared Outcome</CardTitle>
        <CardDescription>Define a metric to track jointly with a partner</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Partner Organization *</Label>
            <Select value={form.partnerId} onValueChange={v => setForm({ ...form, partnerId: v })}>
              <SelectTrigger data-testid="select-outcome-partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
              <SelectContent>
                {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Outcome Category</Label>
            <Select value={form.outcomeCategory} onValueChange={v => setForm({ ...form, outcomeCategory: v })}>
              <SelectTrigger data-testid="select-outcome-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTCOME_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, ch => ch.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Outcome Name *</Label>
            <Input value={form.outcomeName} onChange={e => setForm({ ...form, outcomeName: e.target.value })} placeholder="e.g., Workforce placements via joint referrals" data-testid="input-outcome-name" />
          </div>
          <div className="space-y-1">
            <Label>Target Value</Label>
            <Input type="number" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} data-testid="input-outcome-target" />
          </div>
          <div className="space-y-1">
            <Label>Unit</Label>
            <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g., participants, %, dollars" data-testid="input-outcome-unit" />
          </div>
          <div className="space-y-1">
            <Label>Partner Contribution</Label>
            <Input value={form.partnerContribution} onChange={e => setForm({ ...form, partnerContribution: e.target.value })} placeholder="What does the partner contribute?" data-testid="input-outcome-partner-contrib" />
          </div>
          <div className="space-y-1">
            <Label>ThriveUp Contribution</Label>
            <Input value={form.thriveUpContribution} onChange={e => setForm({ ...form, thriveUpContribution: e.target.value })} placeholder="What does ThriveUp contribute?" data-testid="input-outcome-thriveup-contrib" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.partnerId || !form.outcomeName || mutation.isPending} data-testid="button-submit-outcome">
            {mutation.isPending ? "Creating..." : "Create Shared Outcome"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WarmHandoffsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [directionFilter, setDirectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: handoffsRaw, isLoading } = useQuery<ExternalWarmHandoff[]>({ queryKey: ["/api/collaboration/warm-handoffs"] });
  const handoffs = handoffsRaw ?? [];
  const { data: partnersRaw3 } = useQuery<CommunityPartner[]>({ queryKey: ["/api/collaboration/partners"] });
  const partners = partnersRaw3 ?? [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, outcomeNotes }: { id: string; status: string; outcomeNotes?: string }) => {
      await apiRequest("PATCH", `/api/collaboration/warm-handoffs/${id}`, { status, outcomeNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/warm-handoffs"] });
      toast({ title: "Handoff Updated" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]));

  const filtered = handoffs.filter(h => {
    if (directionFilter !== "all" && h.direction !== directionFilter) return false;
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    return true;
  });

  const outbound = handoffs.filter(h => h.direction === "outbound");
  const inbound = handoffs.filter(h => h.direction === "inbound");
  const active = handoffs.filter(h => h.status === "initiated" || h.status === "accepted");

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold" data-testid="text-handoffs-title">External Warm Handoffs</h3>
          <p className="text-sm text-muted-foreground">Refer participants to and from community partner organizations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-new-handoff">
          <Plus className="h-4 w-4 mr-1" /> New Handoff
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-blue-600 dark:text-blue-400"><ArrowRight className="h-5 w-5 inline mr-1" />{outbound.length}</p><p className="text-xs text-muted-foreground">Outbound</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600 dark:text-green-400"><ArrowLeft className="h-5 w-5 inline mr-1" />{inbound.length}</p><p className="text-xs text-muted-foreground">Inbound</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600 dark:text-amber-400"><Clock className="h-5 w-5 inline mr-1" />{active.length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-handoff-direction"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-handoff-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="initiated">Initiated</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && <WarmHandoffForm partners={partners} onClose={() => setShowForm(false)} />}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No warm handoffs yet. Create one to refer a participant to or from a partner organization.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(handoff => (
            <Card key={handoff.id} data-testid={`card-handoff-${handoff.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {handoff.direction === "outbound" ? (
                        <Badge variant="default" className="text-xs"><ArrowRight className="h-3 w-3 mr-1" />Outbound</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs"><ArrowLeft className="h-3 w-3 mr-1" />Inbound</Badge>
                      )}
                      <Badge variant={handoff.urgency === "emergency" ? "destructive" : handoff.urgency === "urgent" ? "default" : "outline"} className="text-xs">
                        {handoff.urgency}
                      </Badge>
                      <Badge variant={handoff.status === "completed" ? "default" : handoff.status === "declined" ? "destructive" : "secondary"} className="text-xs">
                        {handoff.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {handoff.direction === "outbound" ? "To" : "From"}: {partnerMap[handoff.partnerId] || "Unknown"}
                    </p>
                    {handoff.participantName && <p className="text-xs text-muted-foreground">Participant: {handoff.participantName}</p>}
                    <p className="text-xs"><strong>Service:</strong> {handoff.serviceNeeded}</p>
                    {handoff.referralReason && <p className="text-xs text-muted-foreground mt-1">{handoff.referralReason}</p>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {handoff.status === "initiated" && (
                      <>
                        <Button size="sm" onClick={() => updateMutation.mutate({ id: handoff.id, status: "accepted" })} data-testid={`button-accept-handoff-${handoff.id}`}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: handoff.id, status: "declined" })}>
                          Decline
                        </Button>
                      </>
                    )}
                    {handoff.status === "accepted" && (
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: handoff.id, status: "completed" })} data-testid={`button-complete-handoff-${handoff.id}`}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WarmHandoffForm({ partners, onClose }: { partners: CommunityPartner[]; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    partnerId: "", direction: "outbound", participantName: "", participantId: "",
    serviceNeeded: "", urgency: "standard", referralReason: "", currentServices: "",
    specialConsiderations: "", contactMethod: "email", partnerContactName: "", partnerContactEmail: "",
    status: "initiated",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/collaboration/warm-handoffs", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/warm-handoffs"] });
      toast({ title: "Warm Handoff Created" });
      onClose();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New External Warm Handoff</CardTitle>
        <CardDescription>Refer a participant to or from a community partner</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Direction *</Label>
            <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
              <SelectTrigger data-testid="select-handoff-dir"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Outbound (We refer to partner)</SelectItem>
                <SelectItem value="inbound">Inbound (Partner refers to us)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Partner Organization *</Label>
            <Select value={form.partnerId} onValueChange={v => setForm({ ...form, partnerId: v })}>
              <SelectTrigger data-testid="select-handoff-partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
              <SelectContent>
                {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Participant Name</Label>
            <Input value={form.participantName} onChange={e => setForm({ ...form, participantName: e.target.value })} data-testid="input-handoff-participant" />
          </div>
          <div className="space-y-1">
            <Label>Urgency</Label>
            <Select value={form.urgency} onValueChange={v => setForm({ ...form, urgency: v })}>
              <SelectTrigger data-testid="select-handoff-urgency"><SelectValue /></SelectTrigger>
              <SelectContent>
                {URGENCY_LEVELS.map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Service Needed *</Label>
            <Input value={form.serviceNeeded} onChange={e => setForm({ ...form, serviceNeeded: e.target.value })} placeholder="e.g., Mental health assessment, job placement, housing support" data-testid="input-handoff-service" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Referral Reason</Label>
            <Textarea value={form.referralReason} onChange={e => setForm({ ...form, referralReason: e.target.value })} rows={2} data-testid="input-handoff-reason" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Special Considerations</Label>
            <Textarea value={form.specialConsiderations} onChange={e => setForm({ ...form, specialConsiderations: e.target.value })} rows={2} placeholder="e.g., language needs, accessibility, trauma-informed approach" data-testid="input-handoff-considerations" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.partnerId || !form.serviceNeeded || mutation.isPending} data-testid="button-submit-handoff">
            {mutation.isPending ? "Creating..." : "Create Warm Handoff"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PublicInquiryTab() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    organizationName: "", organizationType: "nonprofit", contactName: "", contactEmail: "",
    contactPhone: "", mission: "", focusAreas: [] as string[], geographicArea: "",
    collaborationInterests: [] as string[], proposedActivities: "", status: "pending", reviewNotes: "",
    populationsServed: [] as string[],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/collaboration/partnership-inquiry", form);
    },
    onSuccess: () => {
      toast({ title: "Inquiry Submitted", description: "We'll review your request and respond within 5 business days." });
      setSubmitted(true);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function toggleFocus(item: string) {
    setForm({ ...form, focusAreas: form.focusAreas.includes(item) ? form.focusAreas.filter(i => i !== item) : [...form.focusAreas, item] });
  }

  const COLLAB_OPTIONS = ["joint-programs", "data-sharing", "warm-handoffs", "grant-collaboration", "research-partnership", "resource-sharing", "co-located-services", "capacity-building"];

  function toggleCollab(item: string) {
    setForm({ ...form, collaborationInterests: form.collaborationInterests.includes(item) ? form.collaborationInterests.filter(i => i !== item) : [...form.collaborationInterests, item] });
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold" data-testid="text-inquiry-success">Partnership Inquiry Submitted</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Thank you for your interest in partnering with ThriveUp Academy and The Collaborative Advocate Foundation.
            Our team will review your inquiry and respond within 5 business days.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Questions? Contact us at <a href="mailto:mr.terryflood@gmail.com" className="text-primary hover:underline">mr.terryflood@gmail.com</a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold" data-testid="text-inquiry-title">Partner With ThriveUp</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          ThriveUp Academy and The Collaborative Advocate Foundation partner with nonprofits, government agencies, healthcare providers, businesses, and community organizations across Central Texas to create collaborative solutions for workforce development, youth education, reentry services, and community health.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partnership Inquiry Form</CardTitle>
          <CardDescription>Tell us about your organization and how you'd like to collaborate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Organization Name *</Label>
              <Input value={form.organizationName} onChange={e => setForm({ ...form, organizationName: e.target.value })} data-testid="input-inquiry-org-name" />
            </div>
            <div className="space-y-1">
              <Label>Organization Type *</Label>
              <Select value={form.organizationType} onValueChange={v => setForm({ ...form, organizationType: v })}>
                <SelectTrigger data-testid="select-inquiry-org-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Your Name *</Label>
              <Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} data-testid="input-inquiry-name" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} data-testid="input-inquiry-email" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} data-testid="input-inquiry-phone" />
            </div>
            <div className="space-y-1">
              <Label>Geographic Area</Label>
              <Input value={form.geographicArea} onChange={e => setForm({ ...form, geographicArea: e.target.value })} placeholder="e.g., Austin, Travis County, Central Texas" data-testid="input-inquiry-geo" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Your Organization's Mission</Label>
            <Textarea value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })} rows={2} data-testid="input-inquiry-mission" />
          </div>
          <div className="space-y-1">
            <Label>Focus Areas (select all that apply)</Label>
            <div className="flex flex-wrap gap-1">
              {FOCUS_AREAS.map(a => (
                <Badge key={a} variant={form.focusAreas.includes(a) ? "default" : "outline"} className="cursor-pointer text-xs"
                  onClick={() => toggleFocus(a)} data-testid={`badge-inquiry-focus-${a}`}>
                  {a.replace(/-/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>How would you like to collaborate? (select all that apply)</Label>
            <div className="flex flex-wrap gap-1">
              {COLLAB_OPTIONS.map(c => (
                <Badge key={c} variant={form.collaborationInterests.includes(c) ? "default" : "outline"} className="cursor-pointer text-xs"
                  onClick={() => toggleCollab(c)} data-testid={`badge-inquiry-collab-${c}`}>
                  {c.replace(/-/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tell us more about your proposed collaboration</Label>
            <Textarea value={form.proposedActivities} onChange={e => setForm({ ...form, proposedActivities: e.target.value })} rows={3} data-testid="input-inquiry-activities" />
          </div>
          <Button onClick={() => mutation.mutate()} className="w-full" disabled={!form.organizationName || !form.contactName || !form.contactEmail || mutation.isPending} data-testid="button-submit-inquiry">
            <Send className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Submitting..." : "Submit Partnership Inquiry"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CollaborationHubPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPartners: number; pendingRequests: number; activeOutcomes: number; totalHandoffs: number; activeHandoffs: number;
  }>({ queryKey: ["/api/collaboration/stats"] });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Handshake className="h-6 w-6 text-primary" />
          Collaboration Hub
        </h1>
        <p className="text-muted-foreground">
          Partner with nonprofits, agencies, and community organizations to amplify collective impact
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary" data-testid="text-stat-partners">{statsLoading ? "—" : stats?.totalPartners || 0}</p>
            <p className="text-xs text-muted-foreground">Active Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-stat-pending">{statsLoading ? "—" : stats?.pendingRequests || 0}</p>
            <p className="text-xs text-muted-foreground">Pending Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-stat-outcomes">{statsLoading ? "—" : stats?.activeOutcomes || 0}</p>
            <p className="text-xs text-muted-foreground">Shared Outcomes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-stat-handoffs">{statsLoading ? "—" : stats?.totalHandoffs || 0}</p>
            <p className="text-xs text-muted-foreground">Warm Handoffs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-stat-active">{statsLoading ? "—" : stats?.activeHandoffs || 0}</p>
            <p className="text-xs text-muted-foreground">Active Handoffs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="directory" data-testid="tab-directory">
            <Building2 className="h-4 w-4 mr-1.5" /> Partner Directory
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <UserPlus className="h-4 w-4 mr-1.5" /> Partnership Requests
          </TabsTrigger>
          <TabsTrigger value="outcomes" data-testid="tab-outcomes">
            <Target className="h-4 w-4 mr-1.5" /> Shared Outcomes
          </TabsTrigger>
          <TabsTrigger value="handoffs" data-testid="tab-handoffs">
            <ArrowRightLeft className="h-4 w-4 mr-1.5" /> Warm Handoffs
          </TabsTrigger>
          <TabsTrigger value="inquiry" data-testid="tab-inquiry">
            <Send className="h-4 w-4 mr-1.5" /> Partner Inquiry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory"><PartnerDirectory /></TabsContent>
        <TabsContent value="requests"><PartnershipRequestsTab /></TabsContent>
        <TabsContent value="outcomes"><SharedOutcomesTab /></TabsContent>
        <TabsContent value="handoffs"><WarmHandoffsTab /></TabsContent>
        <TabsContent value="inquiry"><PublicInquiryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
