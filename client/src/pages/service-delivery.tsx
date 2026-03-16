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
  ClipboardList, Plus, Clock, Users, BarChart3, AlertCircle,
  CheckCircle2, Calendar, MapPin, User, Search, ChevronDown, ChevronRight,
  FileText, Activity
} from "lucide-react";
import type { ParticipantProfile, ServiceRecord } from "@shared/schema";

const SERVICE_CATEGORIES = [
  { value: "case_management", label: "Case Management" },
  { value: "workforce_training", label: "Workforce Training" },
  { value: "education", label: "Education" },
  { value: "housing_assistance", label: "Housing Assistance" },
  { value: "mental_health", label: "Mental Health" },
  { value: "substance_abuse", label: "Substance Abuse Treatment" },
  { value: "legal_aid", label: "Legal Aid" },
  { value: "mentoring", label: "Mentoring" },
  { value: "financial_coaching", label: "Financial Coaching" },
  { value: "transportation", label: "Transportation" },
  { value: "childcare", label: "Childcare" },
];

const OUTCOME_OPTIONS = ["Successful", "In progress", "Needs follow-up", "Referred out", "No show", "Cancelled"];

interface ServiceFormData {
  participantId: string;
  serviceCategory: string;
  serviceType: string;
  providerName: string;
  serviceDate: string;
  durationMinutes: number;
  location: string;
  notes: string;
  outcome: string;
  followUpNeeded: boolean;
  followUpDate: string;
  followUpNotes: string;
}

const emptyServiceForm: ServiceFormData = {
  participantId: "", serviceCategory: "", serviceType: "", providerName: "",
  serviceDate: new Date().toISOString().split("T")[0], durationMinutes: 60,
  location: "", notes: "", outcome: "", followUpNeeded: false, followUpDate: "", followUpNotes: "",
};

function DosageSummary({ records }: { records: ServiceRecord[] }) {
  const dosageByCategory: Record<string, number> = {};
  records.forEach(r => {
    dosageByCategory[r.serviceCategory] = (dosageByCategory[r.serviceCategory] || 0) + (r.durationMinutes || 0);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="dosage-summary">
      {Object.entries(dosageByCategory).map(([cat, mins]) => {
        const label = SERVICE_CATEGORIES.find(c => c.value === cat)?.label || cat;
        const hours = (mins / 60).toFixed(1);
        return (
          <div key={cat} className="p-2 rounded bg-muted/50 text-center">
            <p className="text-lg font-bold text-primary">{hours}h</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function ServiceDelivery() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceForm, setServiceForm] = useState<ServiceFormData>(emptyServiceForm);
  const [view, setView] = useState<"services" | "caseload">("services");
  const [assigningFacilitator, setAssigningFacilitator] = useState(false);
  const [facilitatorInput, setFacilitatorInput] = useState("");

  const { data: participants = [] } = useQuery<ParticipantProfile[]>({ queryKey: ["/api/intake/participants"] });
  const { data: serviceRecords = [] } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/intake/services", selectedParticipant],
    enabled: !!selectedParticipant,
  });
  const { data: allServices = [] } = useQuery<ServiceRecord[]>({ queryKey: ["/api/intake/services/all"] });
  const { data: caseloadData } = useQuery<{
    totalParticipants: number;
    activeParticipants: number;
    totalServiceHours: number;
    followUpsNeeded: number;
    servicesByCategory: Record<string, number>;
    recentServices: ServiceRecord[];
    facilitatorCaseloads: Array<{ facilitatorId: string; participantCount: number; serviceHours: number; followUps: number }>;
    serviceGaps: Array<{ participantId: string; participantName: string; missingCategories: string[]; facilitatorId: string | null }>;
  }>({ queryKey: ["/api/intake/caseload"] });

  const filteredParticipants = participants.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const res = await apiRequest("POST", "/api/intake/services", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intake/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intake/caseload"] });
      setShowForm(false);
      setServiceForm(emptyServiceForm);
      toast({ title: "Service recorded successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const assignFacilitatorMutation = useMutation({
    mutationFn: async ({ participantId, facilitatorId }: { participantId: string; facilitatorId: string }) => {
      const res = await apiRequest("PATCH", `/api/intake/participants/${participantId}`, { assignedFacilitatorId: facilitatorId || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intake/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intake/caseload"] });
      setAssigningFacilitator(false);
      setFacilitatorInput("");
      toast({ title: "Facilitator assigned successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const selectedProfile = participants.find(p => p.id === selectedParticipant);

  const followUps = allServices.filter(s => s.followUpNeeded && s.status !== "follow_up_completed");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-service-title">
            {view === "services" ? "Service Delivery" : "Caseload Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {view === "services" ? "Track services provided to participants" : "Monitor caseloads, follow-ups, and service gaps"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "services" ? "default" : "outline"} onClick={() => setView("services")} data-testid="button-view-services">
            <ClipboardList className="mr-2 h-4 w-4" /> Services
          </Button>
          <Button variant={view === "caseload" ? "default" : "outline"} onClick={() => setView("caseload")} data-testid="button-view-caseload">
            <BarChart3 className="mr-2 h-4 w-4" /> Caseload
          </Button>
          <Button onClick={() => { setShowForm(!showForm); if (selectedParticipant) setServiceForm(prev => ({ ...prev, participantId: selectedParticipant })); }} data-testid="button-log-service">
            <Plus className="mr-2 h-4 w-4" /> Log Service
          </Button>
        </div>
      </div>

      {view === "caseload" && caseloadData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center" data-testid="stat-total-participants">
              <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{caseloadData.totalParticipants}</p>
              <p className="text-sm text-muted-foreground">Total Participants</p>
            </Card>
            <Card className="p-4 text-center" data-testid="stat-active-participants">
              <Activity className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-600">{caseloadData.activeParticipants}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </Card>
            <Card className="p-4 text-center" data-testid="stat-service-hours">
              <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{caseloadData.totalServiceHours.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </Card>
            <Card className="p-4 text-center" data-testid="stat-follow-ups">
              <AlertCircle className="h-6 w-6 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-amber-600">{caseloadData.followUpsNeeded}</p>
              <p className="text-sm text-muted-foreground">Follow-ups Needed</p>
            </Card>
          </div>

          {caseloadData.servicesByCategory && (
            <Card className="p-5" data-testid="card-service-breakdown">
              <h3 className="font-semibold mb-3">Service Hours by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(caseloadData.servicesByCategory).map(([cat, mins]) => (
                  <div key={cat} className="p-3 rounded-lg border text-center">
                    <p className="text-xl font-bold text-primary">{((mins as number) / 60).toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">{SERVICE_CATEGORIES.find(c => c.value === cat)?.label || cat}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {followUps.length > 0 && (
            <Card className="p-5" data-testid="card-follow-ups">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" /> Upcoming Follow-ups</h3>
              <div className="space-y-2">
                {followUps.slice(0, 10).map(s => {
                  const participant = participants.find(p => p.id === s.participantId);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{participant ? `${participant.firstName} ${participant.lastName}` : "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{SERVICE_CATEGORIES.find(c => c.value === s.serviceCategory)?.label} - {s.followUpDate || "No date set"}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{s.followUpNotes || "Follow-up needed"}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {caseloadData.facilitatorCaseloads && caseloadData.facilitatorCaseloads.length > 0 && (
            <Card className="p-5" data-testid="card-facilitator-caseloads">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Facilitator Caseloads</h3>
              <div className="space-y-2">
                {caseloadData.facilitatorCaseloads.map(fc => (
                  <div key={fc.facilitatorId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{fc.facilitatorId === "unassigned" ? "Unassigned" : fc.facilitatorId}</p>
                      <p className="text-xs text-muted-foreground">{fc.participantCount} participants | {fc.serviceHours.toFixed(1)}h services</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {fc.followUps > 0 && <Badge className="text-xs bg-amber-600">{fc.followUps} follow-ups</Badge>}
                      <Badge variant="outline" className="text-xs">{fc.participantCount} assigned</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {caseloadData.serviceGaps && caseloadData.serviceGaps.length > 0 && (
            <Card className="p-5" data-testid="card-service-gaps">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-600" /> Service Gaps</h3>
              <p className="text-xs text-muted-foreground mb-3">Participants with identified needs that have not yet received matching services.</p>
              <div className="space-y-2">
                {caseloadData.serviceGaps.map(gap => (
                  <div key={gap.participantId} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{gap.participantName}</p>
                      {gap.facilitatorId && <Badge variant="outline" className="text-xs">Assigned: {gap.facilitatorId}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {gap.missingCategories.map(cat => (
                        <Badge key={cat} variant="destructive" className="text-xs">
                          {SERVICE_CATEGORIES.find(c => c.value === cat)?.label || cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5" data-testid="card-participant-list">
            <h3 className="font-semibold mb-3">All Participants</h3>
            <div className="space-y-2">
              {participants.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelectedParticipant(p.id); setView("services"); }}
                  data-testid={`caseload-participant-${p.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.referralSource || "No referral"} | {p.housingStatus || "Housing unknown"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {view === "services" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-search-participants"
              />
            </div>
            {filteredParticipants.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground" data-testid="card-no-participants">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No participants found</p>
                <Button variant="link" size="sm" className="mt-1" onClick={() => window.location.href = "/intake"} data-testid="link-start-intake">Start new intake</Button>
              </Card>
            ) : (
              filteredParticipants.map(p => (
                <Card
                  key={p.id}
                  className={`p-4 cursor-pointer transition-colors ${selectedParticipant === p.id ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setSelectedParticipant(p.id)}
                  data-testid={`card-participant-${p.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{p.firstName} {p.lastName}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                    {p.referralSource && <Badge variant="outline" className="text-xs">{p.referralSource}</Badge>}
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {showForm && (
              <Card className="p-5 space-y-4" data-testid="card-service-form">
                <h3 className="font-semibold">Log New Service</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Participant *</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={serviceForm.participantId}
                      onChange={e => setServiceForm(p => ({ ...p, participantId: e.target.value }))}
                      data-testid="select-service-participant"
                    >
                      <option value="">Select participant...</option>
                      {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Service Category *</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={serviceForm.serviceCategory}
                      onChange={e => setServiceForm(p => ({ ...p, serviceCategory: e.target.value }))}
                      data-testid="select-service-category"
                    >
                      <option value="">Select category...</option>
                      {SERVICE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Service Type *</label>
                    <Input value={serviceForm.serviceType} onChange={e => setServiceForm(p => ({ ...p, serviceType: e.target.value }))} placeholder="e.g., Individual counseling session" data-testid="input-service-type" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Provider/Facilitator</label>
                    <Input value={serviceForm.providerName} onChange={e => setServiceForm(p => ({ ...p, providerName: e.target.value }))} placeholder="Name of provider" data-testid="input-provider-name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input type="date" value={serviceForm.serviceDate} onChange={e => setServiceForm(p => ({ ...p, serviceDate: e.target.value }))} data-testid="input-service-date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (minutes) *</label>
                    <Input type="number" min={1} value={serviceForm.durationMinutes} onChange={e => setServiceForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))} data-testid="input-duration" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input value={serviceForm.location} onChange={e => setServiceForm(p => ({ ...p, location: e.target.value }))} placeholder="Office, virtual, community..." data-testid="input-location" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Outcome</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={serviceForm.outcome}
                      onChange={e => setServiceForm(p => ({ ...p, outcome: e.target.value }))}
                      data-testid="select-outcome"
                    >
                      <option value="">Select outcome...</option>
                      {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea value={serviceForm.notes} onChange={e => setServiceForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Session notes..." data-testid="input-service-notes" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={serviceForm.followUpNeeded} onChange={e => setServiceForm(p => ({ ...p, followUpNeeded: e.target.checked }))} data-testid="checkbox-follow-up" />
                  <span className="text-sm font-medium">Follow-up needed</span>
                </label>
                {serviceForm.followUpNeeded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/30">
                    <div>
                      <label className="text-sm font-medium">Follow-up Date</label>
                      <Input type="date" value={serviceForm.followUpDate} onChange={e => setServiceForm(p => ({ ...p, followUpDate: e.target.value }))} data-testid="input-follow-up-date" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Follow-up Notes</label>
                      <Input value={serviceForm.followUpNotes} onChange={e => setServiceForm(p => ({ ...p, followUpNotes: e.target.value }))} placeholder="What needs to happen next..." data-testid="input-follow-up-notes" />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => createServiceMutation.mutate(serviceForm)}
                    disabled={!serviceForm.participantId || !serviceForm.serviceCategory || !serviceForm.serviceType || !serviceForm.serviceDate || createServiceMutation.isPending}
                    data-testid="button-submit-service"
                  >
                    {createServiceMutation.isPending ? "Saving..." : "Save Service Record"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-service">Cancel</Button>
                </div>
              </Card>
            )}

            {selectedParticipant && selectedProfile ? (
              <>
                <Card className="p-5" data-testid="card-participant-detail">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-lg">{selectedProfile.firstName} {selectedProfile.lastName}</h2>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="default" className="text-xs">{selectedProfile.status}</Badge>
                        {selectedProfile.referralSource && <Badge variant="outline" className="text-xs">{selectedProfile.referralSource}</Badge>}
                        {selectedProfile.housingStatus && <Badge variant="outline" className="text-xs">{selectedProfile.housingStatus}</Badge>}
                        {selectedProfile.employmentStatus && <Badge variant="outline" className="text-xs">{selectedProfile.employmentStatus}</Badge>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => { setShowForm(true); setServiceForm(prev => ({ ...prev, participantId: selectedParticipant })); }} data-testid="button-add-service-for-participant">
                      <Plus className="mr-1 h-3 w-3" /> Log Service
                    </Button>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-muted/30 border" data-testid="section-facilitator-assignment">
                    <p className="text-xs font-medium text-muted-foreground mb-2">FACILITATOR ASSIGNMENT</p>
                    {assigningFacilitator ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-8 text-sm"
                          placeholder="Facilitator ID or name..."
                          value={facilitatorInput}
                          onChange={e => setFacilitatorInput(e.target.value)}
                          data-testid="input-facilitator-id"
                        />
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={assignFacilitatorMutation.isPending}
                          onClick={() => assignFacilitatorMutation.mutate({ participantId: selectedParticipant!, facilitatorId: facilitatorInput })}
                          data-testid="button-save-facilitator"
                        >
                          {assignFacilitatorMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setAssigningFacilitator(false)} data-testid="button-cancel-facilitator">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{selectedProfile.assignedFacilitatorId || selectedProfile.assignedCaseManagerId || "Not assigned"}</p>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setAssigningFacilitator(true); setFacilitatorInput(selectedProfile.assignedFacilitatorId || ""); }} data-testid="button-assign-facilitator">
                          {selectedProfile.assignedFacilitatorId ? "Reassign" : "Assign"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedProfile.immediateNeeds && selectedProfile.immediateNeeds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">IMMEDIATE NEEDS</p>
                      <div className="flex flex-wrap gap-1">{selectedProfile.immediateNeeds.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}</div>
                    </div>
                  )}
                </Card>

                {serviceRecords.length > 0 && (
                  <Card className="p-5" data-testid="card-dosage-tracking">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Service Dosage</h3>
                    <DosageSummary records={serviceRecords} />
                    <p className="text-xs text-muted-foreground mt-2">Total: {(serviceRecords.reduce((a, r) => a + (r.durationMinutes || 0), 0) / 60).toFixed(1)} hours across {serviceRecords.length} sessions</p>
                  </Card>
                )}

                <Card className="p-5" data-testid="card-service-history">
                  <h3 className="font-semibold mb-3">Service History</h3>
                  {serviceRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No services recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {serviceRecords.map(s => (
                        <div key={s.id} className="p-3 rounded-lg border" data-testid={`service-record-${s.id}`}>
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="text-sm font-medium">{s.serviceType}</p>
                              <p className="text-xs text-muted-foreground">{SERVICE_CATEGORIES.find(c => c.value === s.serviceCategory)?.label}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {s.serviceDate}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {s.durationMinutes} min</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.providerName && <Badge variant="outline" className="text-xs"><User className="h-3 w-3 mr-1" />{s.providerName}</Badge>}
                            {s.location && <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{s.location}</Badge>}
                            {s.outcome && <Badge variant="secondary" className="text-xs">{s.outcome}</Badge>}
                            {s.followUpNeeded && <Badge className="text-xs bg-amber-600">Follow-up needed</Badge>}
                          </div>
                          {s.notes && <p className="text-xs text-muted-foreground mt-2">{s.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center text-muted-foreground" data-testid="card-select-participant">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Select a participant to view their service history</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
