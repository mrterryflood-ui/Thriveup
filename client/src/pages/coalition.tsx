import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Handshake, FileSignature, Users, Plus, Trash2, ExternalLink, CalendarCheck, Mail, Send } from "lucide-react";
import type { CoalitionPartner, LetterOfCollaboration, GovernanceMeeting } from "@shared/schema";

const MOU_COLOR: Record<string, string> = {
  signed: "bg-green-600 text-white", drafted: "bg-blue-600 text-white",
  requested: "bg-amber-500 text-white", expired: "bg-red-600 text-white", none: "bg-slate-400 text-white",
};
const LETTER_COLOR: Record<string, string> = {
  received: "bg-green-600 text-white", sent: "bg-blue-600 text-white",
  drafted: "bg-amber-500 text-white", requested: "bg-slate-400 text-white", declined: "bg-red-600 text-white",
};

export default function CoalitionPage() {
  useEffect(() => { document.title = "Coalition Operations — TCAF"; }, []);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Handshake className="h-7 w-7" /> Coalition Operations</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Partners, letters of collaboration, and multi-tier governance meetings — the BJA SCA artifacts that make our reentry coalition fundable.
        </p>
      </div>
      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners" data-testid="tab-partners"><Users className="h-4 w-4 mr-1" /> Partners</TabsTrigger>
          <TabsTrigger value="letters" data-testid="tab-letters"><FileSignature className="h-4 w-4 mr-1" /> Letters of Collaboration</TabsTrigger>
          <TabsTrigger value="governance" data-testid="tab-governance"><CalendarCheck className="h-4 w-4 mr-1" /> Governance Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="partners"><PartnersSection /></TabsContent>
        <TabsContent value="letters"><LettersSection /></TabsContent>
        <TabsContent value="governance"><GovernanceSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function PartnersSection() {
  const { toast } = useToast();
  const q = useQuery<CoalitionPartner[]>({ queryKey: ["/api/coalition/partners"] });
  const [open, setOpen] = useState(false);
  const empty = {
    organizationName: "", partnerType: "treatment", contactName: "", contactEmail: "", contactPhone: "",
    county: "", state: "TX", website: "", servicesOffered: [] as string[],
    mouStatus: "none", livedExperienceLed: false, notes: "",
  };
  const [form, setForm] = useState(empty);
  const [services, setServices] = useState("");

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/partners", { ...form, servicesOffered: services.split(",").map(s => s.trim()).filter(Boolean) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/partners"] }); toast({ title: "Partner added" }); setOpen(false); setForm(empty); setServices(""); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/partners/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/partners"] }); toast({ title: "Removed" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Coalition Partners</CardTitle>
          <CardDescription>DOC, jail, treatment, faith, employer, housing, and education partners. Tracks MOU status + lived-experience-led flag.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-partner"><Plus className="h-4 w-4 mr-1" /> Add Partner</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Partner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Organization Name</Label><Input value={form.organizationName} onChange={e => setForm({ ...form, organizationName: e.target.value })} data-testid="input-partner-name" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Partner Type</Label>
                  <Select value={form.partnerType} onValueChange={v => setForm({ ...form, partnerType: v })}>
                    <SelectTrigger data-testid="select-partner-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doc">Department of Corrections</SelectItem>
                      <SelectItem value="jail">County Jail / Sheriff</SelectItem>
                      <SelectItem value="probation">Probation / Parole</SelectItem>
                      <SelectItem value="treatment">Treatment Provider</SelectItem>
                      <SelectItem value="faith">Faith-Based</SelectItem>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="education">Education / Workforce</SelectItem>
                      <SelectItem value="training">Training / TA</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>MOU Status</Label>
                  <Select value={form.mouStatus} onValueChange={v => setForm({ ...form, mouStatus: v })}>
                    <SelectTrigger data-testid="select-mou-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="drafted">Drafted</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} data-testid="input-contact-name" /></div>
                <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} data-testid="input-contact-email" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>County</Label><Input value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} placeholder="Travis, McLennan…" data-testid="input-partner-county" /></div>
                <div><Label>State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} data-testid="input-partner-state" /></div>
              </div>
              <div><Label>Website</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://…" data-testid="input-partner-website" /></div>
              <div><Label>Services (comma-separated)</Label><Input value={services} onChange={e => setServices(e.target.value)} placeholder="housing, employment, MI training" data-testid="input-partner-services" /></div>
              <div className="flex items-center gap-2">
                <Checkbox id="le" checked={form.livedExperienceLed} onCheckedChange={v => setForm({ ...form, livedExperienceLed: !!v })} data-testid="checkbox-le-led" />
                <Label htmlFor="le">Lived-experience led organization</Label>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-partner-notes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.organizationName || create.isPending} data-testid="button-save-partner">
                {create.isPending ? "Saving…" : "Save Partner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : (q.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No partners yet. Add Beacon Online Training (Dr. Barry Gregory) seeded by default; add more as you build the coalition.</div>
          : <div className="space-y-2">
            {(q.data || []).map(p => (
              <div key={p.id} className="border rounded p-3" data-testid={`row-partner-${p.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.organizationName}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{p.partnerType}</Badge>
                      <Badge className={`text-xs ${MOU_COLOR[p.mouStatus || "none"]}`}>MOU: {p.mouStatus}</Badge>
                      {p.livedExperienceLed && <Badge className="bg-purple-600 text-white text-xs">Lived-Experience Led</Badge>}
                      {p.county && <Badge variant="outline" className="text-xs">{p.county}, {p.state}</Badge>}
                    </div>
                    {p.contactName && <div className="text-xs text-muted-foreground mt-1">{p.contactName} · {p.contactEmail}</div>}
                    {p.servicesOffered && p.servicesOffered.length > 0 && (
                      <div className="text-xs mt-1"><strong>Services:</strong> {p.servicesOffered.join(", ")}</div>
                    )}
                    {p.notes && <div className="text-xs italic text-muted-foreground mt-1">{p.notes}</div>}
                    {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">{p.website} <ExternalLink className="h-3 w-3 ml-1" /></a>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)} data-testid={`button-delete-partner-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        }
      </CardContent>
    </Card>
  );
}

type OutreachTemplate = { id: string; partnerName: string; to: string; contactPerson: string; grantOpportunity: string; subject: string; body: string; };

function ComposeOutreachDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const templates = useQuery<OutreachTemplate[]>({ queryKey: ["/api/coalition/outreach/templates"], enabled: open });
  const [selected, setSelected] = useState<string>("");
  const [form, setForm] = useState({ to: "", subject: "", body: "", partnerName: "", grantOpportunity: "", contactPerson: "" });

  const loadTemplate = (id: string) => {
    setSelected(id);
    const t = (templates.data || []).find(x => x.id === id);
    if (t) setForm({ to: t.to, subject: t.subject, body: t.body, partnerName: t.partnerName, grantOpportunity: t.grantOpportunity, contactPerson: t.contactPerson });
  };

  const send = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/outreach/send", { ...form, trackAsLetter: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coalition/letters"] });
      toast({ title: "Outreach sent", description: `Email delivered to ${form.to} and tracked as a letter.` });
      setOpen(false); setSelected(""); setForm({ to: "", subject: "", body: "", partnerName: "", grantOpportunity: "", contactPerson: "" });
    },
    onError: (e: Error) => toast({ title: "Send failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-compose-outreach"><Mail className="h-4 w-4 mr-1" /> Compose Outreach</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Compose Coalition Outreach Email</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Start from template</Label>
            <Select value={selected} onValueChange={loadTemplate}>
              <SelectTrigger data-testid="select-outreach-template"><SelectValue placeholder="Pick a prefilled draft, or write from scratch" /></SelectTrigger>
              <SelectContent>
                {(templates.data || []).map(t => <SelectItem key={t.id} value={t.id}>{t.partnerName} — {t.grantOpportunity}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>To</Label><Input type="email" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} placeholder="recipient@example.org" data-testid="input-outreach-to" /></div>
            <div><Label>Partner Name</Label><Input value={form.partnerName} onChange={e => setForm({ ...form, partnerName: e.target.value })} data-testid="input-outreach-partner" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Grant Opportunity</Label><Input value={form.grantOpportunity} onChange={e => setForm({ ...form, grantOpportunity: e.target.value })} data-testid="input-outreach-grant" /></div>
            <div><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} data-testid="input-outreach-contact" /></div>
          </div>
          <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} data-testid="input-outreach-subject" /></div>
          <div><Label>Body</Label><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="min-h-[300px] font-serif text-sm" data-testid="input-outreach-body" /></div>
          <div className="text-xs text-muted-foreground">Sent via Resend. Auto-tracked in Letters of Collaboration as <Badge variant="outline" className="text-xs">SENT</Badge> with the body archived in notes.</div>
        </div>
        <DialogFooter>
          <Button onClick={() => send.mutate()} disabled={!form.to || !form.subject || !form.body || send.isPending} data-testid="button-send-outreach">
            <Send className="h-4 w-4 mr-1" />{send.isPending ? "Sending…" : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LettersSection() {
  const { toast } = useToast();
  const q = useQuery<LetterOfCollaboration[]>({ queryKey: ["/api/coalition/letters"] });
  const [open, setOpen] = useState(false);
  const empty = { partnerName: "", grantOpportunity: "", letterStatus: "requested", contactPerson: "", requestedDate: "", receivedDate: "", letterUrl: "", notes: "" };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/letters", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/letters"] }); toast({ title: "Letter tracked" }); setOpen(false); setForm(empty); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/coalition/letters/${id}`, { letterStatus: status, ...(status === "received" ? { receivedDate: new Date().toISOString().slice(0, 10) } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coalition/letters"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/letters/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/letters"] }); toast({ title: "Removed" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Letters of Collaboration</CardTitle>
          <CardDescription>BJA SCA + most federal grants require letters from correctional partners. Track requested → drafted → sent → received.</CardDescription>
        </div>
        <div className="flex gap-2">
          <ComposeOutreachDialog />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-letter"><Plus className="h-4 w-4 mr-1" /> Track Letter</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Track Letter of Collaboration</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Partner / Organization</Label><Input value={form.partnerName} onChange={e => setForm({ ...form, partnerName: e.target.value })} placeholder="TDCJ, Travis County Sheriff…" data-testid="input-letter-partner" /></div>
              <div><Label>Grant Opportunity</Label><Input value={form.grantOpportunity} onChange={e => setForm({ ...form, grantOpportunity: e.target.value })} placeholder="BJA SCA 2026" data-testid="input-letter-grant" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Status</Label>
                  <Select value={form.letterStatus} onValueChange={v => setForm({ ...form, letterStatus: v })}>
                    <SelectTrigger data-testid="select-letter-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="drafted">Drafted</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} data-testid="input-letter-contact" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Requested Date</Label><Input type="date" value={form.requestedDate} onChange={e => setForm({ ...form, requestedDate: e.target.value })} data-testid="input-letter-requested" /></div>
                <div><Label>Received Date</Label><Input type="date" value={form.receivedDate} onChange={e => setForm({ ...form, receivedDate: e.target.value })} data-testid="input-letter-received" /></div>
              </div>
              <div><Label>Letter URL (when uploaded)</Label><Input value={form.letterUrl} onChange={e => setForm({ ...form, letterUrl: e.target.value })} data-testid="input-letter-url" /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-letter-notes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.partnerName || !form.grantOpportunity || create.isPending} data-testid="button-save-letter">
                {create.isPending ? "Saving…" : "Track Letter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : (q.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No letters tracked yet. Add the BJA SCA letter from TDCJ to close the BJA-SCA-02 gap.</div>
          : <div className="space-y-2">
            {(q.data || []).map(l => (
              <div key={l.id} className="border rounded p-3" data-testid={`row-letter-${l.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{l.partnerName}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                      <Badge variant="outline" className="text-xs">{l.grantOpportunity}</Badge>
                      <Badge className={`text-xs ${LETTER_COLOR[l.letterStatus]}`}>{l.letterStatus.toUpperCase()}</Badge>
                      {l.contactPerson && <span className="text-xs text-muted-foreground">· {l.contactPerson}</span>}
                    </div>
                    {(l.requestedDate || l.receivedDate) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {l.requestedDate && `Requested ${l.requestedDate}`}{l.requestedDate && l.receivedDate && " · "}{l.receivedDate && `Received ${l.receivedDate}`}
                      </div>
                    )}
                    {l.notes && <div className="text-xs italic text-muted-foreground mt-1">{l.notes}</div>}
                    {l.letterUrl && <a href={l.letterUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">View letter <ExternalLink className="h-3 w-3 ml-1" /></a>}
                  </div>
                  <div className="flex gap-1">
                    <Select value={l.letterStatus} onValueChange={v => update.mutate({ id: l.id, status: v })}>
                      <SelectTrigger className="h-8 w-[120px] text-xs" data-testid={`select-update-letter-${l.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requested">Requested</SelectItem>
                        <SelectItem value="drafted">Drafted</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(l.id)} data-testid={`button-delete-letter-${l.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </CardContent>
    </Card>
  );
}

function GovernanceSection() {
  const { toast } = useToast();
  const q = useQuery<GovernanceMeeting[]>({ queryKey: ["/api/coalition/governance-meetings"] });
  const [open, setOpen] = useState(false);
  const empty = { meetingTier: "core", meetingDate: new Date().toISOString().slice(0, 10), cadence: "monthly", attendeeCount: 0, livedExperienceCount: 0, agenda: "", decisionsRecorded: "", minutesUrl: "", notes: "" };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/governance-meetings", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/governance-meetings"] }); toast({ title: "Meeting logged" }); setOpen(false); setForm(empty); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/governance-meetings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coalition/governance-meetings"] }),
  });

  const tierBadge: Record<string, string> = {
    core: "bg-blue-600 text-white", full: "bg-purple-600 text-white", executive: "bg-emerald-600 text-white",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Multi-Tier Governance Meetings</CardTitle>
          <CardDescription>NRRC-GOV-03 requires Core (monthly), Full (quarterly), and Executive (semi-annual) coalition cadence with documented decisions.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-meeting"><Plus className="h-4 w-4 mr-1" /> Log Meeting</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log Governance Meeting</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Tier</Label>
                  <Select value={form.meetingTier} onValueChange={v => setForm({ ...form, meetingTier: v })}>
                    <SelectTrigger data-testid="select-meeting-tier"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core (monthly)</SelectItem>
                      <SelectItem value="full">Full Coalition (quarterly)</SelectItem>
                      <SelectItem value="executive">Executive (semi-annual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.meetingDate} onChange={e => setForm({ ...form, meetingDate: e.target.value })} data-testid="input-meeting-date" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Cadence</Label>
                  <Select value={form.cadence} onValueChange={v => setForm({ ...form, cadence: v })}>
                    <SelectTrigger data-testid="select-meeting-cadence"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Attendees</Label><Input type="number" value={form.attendeeCount} onChange={e => setForm({ ...form, attendeeCount: Number(e.target.value) || 0 })} data-testid="input-meeting-attendees" /></div>
                <div><Label>Lived-Exp</Label><Input type="number" value={form.livedExperienceCount} onChange={e => setForm({ ...form, livedExperienceCount: Number(e.target.value) || 0 })} data-testid="input-meeting-le" /></div>
              </div>
              <div><Label>Agenda</Label><Textarea value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} data-testid="input-meeting-agenda" /></div>
              <div><Label>Decisions Recorded</Label><Textarea value={form.decisionsRecorded} onChange={e => setForm({ ...form, decisionsRecorded: e.target.value })} data-testid="input-meeting-decisions" /></div>
              <div><Label>Minutes URL</Label><Input value={form.minutesUrl} onChange={e => setForm({ ...form, minutesUrl: e.target.value })} data-testid="input-meeting-minutes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={create.isPending} data-testid="button-save-meeting">{create.isPending ? "Saving…" : "Log Meeting"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : (q.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No governance meetings logged yet. Log your most recent core/full/executive meeting to flip NRRC-GOV-03 from PARTIAL to FULL.</div>
          : <div className="space-y-2">
            {(q.data || []).map(m => (
              <div key={m.id} className="border rounded p-3" data-testid={`row-meeting-${m.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1.5 flex-wrap items-center">
                      <Badge className={`text-xs ${tierBadge[m.meetingTier]}`}>{m.meetingTier.toUpperCase()}</Badge>
                      <span className="font-semibold">{m.meetingDate}</span>
                      {m.cadence && <Badge variant="outline" className="text-xs">{m.cadence}</Badge>}
                      <span className="text-xs text-muted-foreground">{m.attendeeCount} attendees · {m.livedExperienceCount} lived-experience</span>
                    </div>
                    {m.agenda && <div className="text-sm mt-1"><strong>Agenda:</strong> {m.agenda}</div>}
                    {m.decisionsRecorded && <div className="text-sm mt-1"><strong>Decisions:</strong> {m.decisionsRecorded}</div>}
                    {m.minutesUrl && <a href={m.minutesUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">Minutes <ExternalLink className="h-3 w-3 ml-1" /></a>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(m.id)} data-testid={`button-delete-meeting-${m.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        }
      </CardContent>
    </Card>
  );
}
