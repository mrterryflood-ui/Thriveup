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
import { Award, BookOpen, GraduationCap, Layers, Plus, Trash2, ExternalLink, Printer, Download, Pencil, BarChart3, Users, FileDown } from "lucide-react";
import type { CbiProgram, StaffCertification, StandardsCrosswalk, RnrAssessment, RecidivismBaseline, FamilyVisitation } from "@shared/schema";

const CATEGORY_LABELS: Record<string, string> = {
  governance: "Governance",
  ebp: "Evidence-Based Practice",
  data: "Data & Measurement",
  services: "Services",
  lived_experience: "Lived Experience",
};

const STATUS_COLOR: Record<string, string> = {
  exceeds: "bg-emerald-600 text-white",
  full: "bg-green-600 text-white",
  partial: "bg-amber-500 text-white",
  gap: "bg-red-600 text-white",
};

const TIER_COLOR: Record<string, string> = {
  strong: "bg-emerald-600 text-white",
  moderate: "bg-blue-600 text-white",
  promising: "bg-amber-500 text-white",
};

interface Scorecard {
  generatedAt: string;
  totalStandards: number;
  averageCoverage: number;
  coverageByBody: Record<string, { total: number; avgPct: number; full: number; exceeds: number; partial: number; gap: number }>;
  coverageByCategory: Record<string, { total: number; avgPct: number }>;
  cbiCatalogSize: number;
  cbiInternalDelivery: number;
  certificationsActive: number;
  certificationsLivedExperience: number;
  rnrAssessmentsCompleted: number;
}

const NEEDS_FIELDS: Array<{ key: keyof RnrAssessment; label: string }> = [
  { key: "needAntisocialAttitudes", label: "Antisocial Attitudes" },
  { key: "needAntisocialPeers", label: "Antisocial Peers" },
  { key: "needSubstanceAbuse", label: "Substance Abuse" },
  { key: "needFamilyMarital", label: "Family / Marital" },
  { key: "needEducationEmployment", label: "Education / Employment" },
  { key: "needLeisureRecreation", label: "Leisure / Recreation" },
  { key: "needAntisocialPersonality", label: "Antisocial Personality" },
  { key: "needHistoryOfBehavior", label: "History of Antisocial Behavior" },
];

export default function ReentryStandardsPage() {
  useEffect(() => { document.title = "National Reentry Standards — TCAF"; }, []);

  const scorecard = useQuery<Scorecard>({ queryKey: ["/api/standards/scorecard"] });
  const crosswalk = useQuery<StandardsCrosswalk[]>({ queryKey: ["/api/standards/crosswalk"] });
  const cbi = useQuery<CbiProgram[]>({ queryKey: ["/api/standards/cbi"] });
  const certs = useQuery<StaffCertification[]>({ queryKey: ["/api/standards/certifications"] });
  const rnr = useQuery<RnrAssessment[]>({ queryKey: ["/api/standards/rnr"] });

  const printPage = () => window.print();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Award className="h-7 w-7" /> National Reentry Standards Alignment
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Live crosswalk of TCAF capabilities against NRRC and BJA Second Chance Act standards. Use this view in coalition meetings, grant proposals, and partner conversations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-server-pdf">
            <a href="/api/coalition/public/crosswalk.html" target="_blank" rel="noopener noreferrer">
              <FileDown className="h-4 w-4 mr-2" /> Grant-Ready PDF
            </a>
          </Button>
          <Button variant="outline" asChild data-testid="button-public-view">
            <a href="/standards/public" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Public View
            </a>
          </Button>
          <Button variant="outline" onClick={printPage} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {scorecard.data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="scorecard-tiles">
          <Tile label="Standards Tracked" value={scorecard.data.totalStandards} />
          <Tile label="Average Coverage" value={`${scorecard.data.averageCoverage}%`} highlight />
          <Tile label="CBI Programs" value={scorecard.data.cbiCatalogSize} sub={`${scorecard.data.cbiInternalDelivery} in-house`} />
          <Tile label="Certified Staff" value={scorecard.data.certificationsActive} sub={`${scorecard.data.certificationsLivedExperience} lived-experience`} />
          <Tile label="RNR Assessments" value={scorecard.data.rnrAssessmentsCompleted} />
        </div>
      )}

      <Tabs defaultValue="crosswalk" className="space-y-4">
        <TabsList className="print:hidden">
          <TabsTrigger value="crosswalk" data-testid="tab-crosswalk"><Layers className="h-4 w-4 mr-1" /> Standards Crosswalk</TabsTrigger>
          <TabsTrigger value="cbi" data-testid="tab-cbi"><BookOpen className="h-4 w-4 mr-1" /> CBI Library</TabsTrigger>
          <TabsTrigger value="certifications" data-testid="tab-certifications"><GraduationCap className="h-4 w-4 mr-1" /> Staff Certifications</TabsTrigger>
          <TabsTrigger value="rnr" data-testid="tab-rnr"><Award className="h-4 w-4 mr-1" /> RNR Assessments</TabsTrigger>
          <TabsTrigger value="recidivism" data-testid="tab-recidivism"><BarChart3 className="h-4 w-4 mr-1" /> Recidivism Baselines</TabsTrigger>
          <TabsTrigger value="family" data-testid="tab-family"><Users className="h-4 w-4 mr-1" /> Family Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="crosswalk">
          <CrosswalkSection rows={crosswalk.data || []} loading={crosswalk.isLoading} />
        </TabsContent>
        <TabsContent value="cbi">
          <CbiSection rows={cbi.data || []} loading={cbi.isLoading} />
        </TabsContent>
        <TabsContent value="certifications">
          <CertificationsSection rows={certs.data || []} loading={certs.isLoading} />
        </TabsContent>
        <TabsContent value="rnr">
          <RnrSection rows={rnr.data || []} loading={rnr.isLoading} cbi={cbi.data || []} />
        </TabsContent>
        <TabsContent value="recidivism">
          <RecidivismSection />
        </TabsContent>
        <TabsContent value="family">
          <FamilyVisitationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Tile({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary border-2" : ""} data-testid={`tile-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function CrosswalkSection({ rows, loading }: { rows: StandardsCrosswalk[]; loading: boolean }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<StandardsCrosswalk | null>(null);
  const [edit, setEdit] = useState({ coverageStatus: "full", coveragePercent: 100, notes: "", capabilities: "" });

  const update = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/standards/crosswalk/${editing?.id}`, {
      coverageStatus: edit.coverageStatus,
      coveragePercent: Number(edit.coveragePercent),
      notes: edit.notes,
      tcafCapabilities: edit.capabilities.split(",").map(s => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards/crosswalk"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standards/scorecard"] });
      toast({ title: "Standard updated" });
      setEditing(null);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openEdit = (r: StandardsCrosswalk) => {
    setEditing(r);
    setEdit({
      coverageStatus: r.coverageStatus,
      coveragePercent: r.coveragePercent,
      notes: r.notes || "",
      capabilities: (r.tcafCapabilities || []).join(", "),
    });
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const grouped: Record<string, StandardsCrosswalk[]> = {};
  for (const r of rows) (grouped[r.category] ||= []).push(r);
  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} data-testid={`section-category-${cat}`}>
          <CardHeader>
            <CardTitle>{CATEGORY_LABELS[cat] || cat}</CardTitle>
            <CardDescription>{items.length} standards • avg coverage {Math.round(items.reduce((s, x) => s + x.coveragePercent, 0) / items.length)}%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map(r => (
              <div key={r.id} className="border rounded-lg p-4 space-y-2" data-testid={`row-standard-${r.standardCode}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">{r.standardCode}</Badge>
                      <Badge variant="secondary" className="text-xs">{r.standardBody}</Badge>
                      <Badge className={`text-xs ${STATUS_COLOR[r.coverageStatus] || ""}`}>{r.coverageStatus.toUpperCase()} • {r.coveragePercent}%</Badge>
                    </div>
                    <div className="font-semibold mt-2">{r.standardTitle}</div>
                    <div className="text-sm text-muted-foreground mt-1">{r.standardDescription}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)} data-testid={`button-edit-standard-${r.standardCode}`} className="print:hidden">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                {r.tcafCapabilities && r.tcafCapabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.tcafCapabilities.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                )}
                {r.notes && <div className="text-sm italic text-muted-foreground border-l-2 pl-3 mt-2">{r.notes}</div>}
                {r.evidenceUrl && (
                  <a href={r.evidenceUrl} className="text-xs inline-flex items-center text-primary hover:underline mt-1" data-testid={`link-evidence-${r.standardCode}`}>
                    Evidence <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Standard {editing?.standardCode}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm font-medium">{editing?.standardTitle}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Status</Label>
                <Select value={edit.coverageStatus} onValueChange={v => setEdit({ ...edit, coverageStatus: v })}>
                  <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exceeds">Exceeds</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="gap">Gap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Coverage %</Label><Input type="number" value={edit.coveragePercent} onChange={e => setEdit({ ...edit, coveragePercent: Number(e.target.value) || 0 })} data-testid="input-edit-percent" /></div>
            </div>
            <div><Label>TCAF Capabilities (comma-separated)</Label><Input value={edit.capabilities} onChange={e => setEdit({ ...edit, capabilities: e.target.value })} data-testid="input-edit-capabilities" /></div>
            <div><Label>Notes / Evidence Pointer</Label><Textarea value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} data-testid="input-edit-notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => update.mutate()} disabled={update.isPending} data-testid="button-save-edit">{update.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecidivismSection() {
  const { toast } = useToast();
  const q = useQuery<RecidivismBaseline[]>({ queryKey: ["/api/coalition/baselines"] });
  const [open, setOpen] = useState(false);
  const empty = { jurisdiction: "", jurisdictionType: "county", metricType: "recidivism_3yr", metricValue: 0, population: "", cohortYear: new Date().getFullYear() - 3, source: "", sourceUrl: "", notes: "" };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/baselines", { ...form, metricValue: Number(form.metricValue) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/baselines"] }); toast({ title: "Baseline saved" }); setOpen(false); setForm(empty); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/baselines/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coalition/baselines"] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Local Recidivism + Outcome Baselines</CardTitle>
          <CardDescription>BJA SCA requires local baseline data. Pre-seeded with TDCJ statewide + Travis/McLennan estimates; replace with FOIA-confirmed county figures as you receive them.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-baseline"><Plus className="h-4 w-4 mr-1" /> Add Baseline</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Recidivism / Outcome Baseline</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Jurisdiction</Label><Input value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} placeholder="Travis County" data-testid="input-baseline-jurisdiction" /></div>
                <div><Label>Type</Label>
                  <Select value={form.jurisdictionType} onValueChange={v => setForm({ ...form, jurisdictionType: v })}>
                    <SelectTrigger data-testid="select-baseline-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="county">County</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="federal">Federal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Metric</Label>
                  <Select value={form.metricType} onValueChange={v => setForm({ ...form, metricType: v })}>
                    <SelectTrigger data-testid="select-baseline-metric"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recidivism_3yr">Recidivism 3-yr</SelectItem>
                      <SelectItem value="recidivism_1yr">Recidivism 1-yr</SelectItem>
                      <SelectItem value="employment_post_release">Employment</SelectItem>
                      <SelectItem value="housing_stability">Housing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Value (%)</Label><Input type="number" step="0.1" value={form.metricValue} onChange={e => setForm({ ...form, metricValue: Number(e.target.value) })} data-testid="input-baseline-value" /></div>
                <div><Label>Cohort Year</Label><Input type="number" value={form.cohortYear} onChange={e => setForm({ ...form, cohortYear: Number(e.target.value) })} data-testid="input-baseline-year" /></div>
              </div>
              <div><Label>Population</Label><Input value={form.population} onChange={e => setForm({ ...form, population: e.target.value })} placeholder="All released adults / Black males 18-25 / etc." data-testid="input-baseline-population" /></div>
              <div><Label>Source</Label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="TDCJ Statistical Report 2023" data-testid="input-baseline-source" /></div>
              <div><Label>Source URL</Label><Input value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} data-testid="input-baseline-url" /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-baseline-notes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.jurisdiction || !form.source || create.isPending} data-testid="button-save-baseline">
                {create.isPending ? "Saving…" : "Save Baseline"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : (q.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No baselines yet.</div>
          : <div className="space-y-2">
            {(q.data || []).map(b => (
              <div key={b.id} className="border rounded p-3" data-testid={`row-baseline-${b.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{b.jurisdiction} <Badge variant="outline" className="ml-1 text-xs">{b.jurisdictionType}</Badge></div>
                    <div className="text-sm mt-1"><strong>{b.metricValue}%</strong> {b.metricType.replace(/_/g, " ")} · cohort {b.cohortYear}</div>
                    {b.population && <div className="text-xs text-muted-foreground mt-1">Population: {b.population}</div>}
                    <div className="text-xs text-muted-foreground mt-1">Source: {b.source}</div>
                    {b.sourceUrl && <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">View source <ExternalLink className="h-3 w-3 ml-1" /></a>}
                    {b.notes && <div className="text-xs italic text-muted-foreground mt-1">{b.notes}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(b.id)} data-testid={`button-delete-baseline-${b.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        }
      </CardContent>
    </Card>
  );
}

function FamilyVisitationSection() {
  const { toast } = useToast();
  const q = useQuery<FamilyVisitation[]>({ queryKey: ["/api/coalition/visitations"] });
  const [open, setOpen] = useState(false);
  const empty = { participantId: "", participantName: "", contactType: "phone_call", contactDate: new Date().toISOString().slice(0, 10), durationMinutes: 0, familyMemberRelation: "child", familyMemberName: "", childrenInvolved: 0, outcome: "positive", notes: "" };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/visitations", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/visitations"] }); toast({ title: "Family contact logged" }); setOpen(false); setForm(empty); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/visitations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coalition/visitations"] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Family + Community Contact Log</CardTitle>
          <CardDescription>NRRC-SVC-05 — research shows visitation reduces recidivism. Track in-person, video, phone, and letter contacts with family.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-add-visitation"><Plus className="h-4 w-4 mr-1" /> Log Contact</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log Family Contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Participant ID</Label><Input value={form.participantId} onChange={e => setForm({ ...form, participantId: e.target.value })} data-testid="input-visit-participant-id" /></div>
                <div><Label>Participant Name</Label><Input value={form.participantName} onChange={e => setForm({ ...form, participantName: e.target.value })} data-testid="input-visit-participant-name" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Type</Label>
                  <Select value={form.contactType} onValueChange={v => setForm({ ...form, contactType: v })}>
                    <SelectTrigger data-testid="select-visit-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visit_in_person">In-Person Visit</SelectItem>
                      <SelectItem value="video_call">Video Call</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.contactDate} onChange={e => setForm({ ...form, contactDate: e.target.value })} data-testid="input-visit-date" /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) || 0 })} data-testid="input-visit-duration" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Relation</Label>
                  <Select value={form.familyMemberRelation} onValueChange={v => setForm({ ...form, familyMemberRelation: v })}>
                    <SelectTrigger data-testid="select-visit-relation"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="partner">Partner / Spouse</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Family Member Name</Label><Input value={form.familyMemberName} onChange={e => setForm({ ...form, familyMemberName: e.target.value })} data-testid="input-visit-family-name" /></div>
                <div><Label>Children Involved</Label><Input type="number" value={form.childrenInvolved} onChange={e => setForm({ ...form, childrenInvolved: Number(e.target.value) || 0 })} data-testid="input-visit-children" /></div>
              </div>
              <div><Label>Outcome</Label>
                <Select value={form.outcome} onValueChange={v => setForm({ ...form, outcome: v })}>
                  <SelectTrigger data-testid="select-visit-outcome"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="conflict">Conflict</SelectItem>
                    <SelectItem value="no_show">No-Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-visit-notes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.participantId || create.isPending} data-testid="button-save-visit">{create.isPending ? "Saving…" : "Log Contact"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : (q.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No contacts logged yet. Each entry strengthens NRRC-SVC-05 evidence.</div>
          : <div className="space-y-2">
            {(q.data || []).map(v => (
              <div key={v.id} className="border rounded p-3" data-testid={`row-visit-${v.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1.5 flex-wrap items-center">
                      <Badge variant="outline" className="text-xs">{v.contactType.replace(/_/g, " ")}</Badge>
                      <span className="font-medium">{v.contactDate}</span>
                      <span className="text-xs text-muted-foreground">{v.participantName || v.participantId} · {v.familyMemberRelation} {v.familyMemberName ? `(${v.familyMemberName})` : ""}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {v.durationMinutes ? `${v.durationMinutes} min · ` : ""}{v.childrenInvolved ? `${v.childrenInvolved} child(ren) · ` : ""}<Badge variant={v.outcome === "positive" ? "default" : v.outcome === "conflict" ? "destructive" : "secondary"} className="text-xs">{v.outcome}</Badge>
                    </div>
                    {v.notes && <div className="text-xs italic text-muted-foreground mt-1">{v.notes}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(v.id)} data-testid={`button-delete-visit-${v.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        }
      </CardContent>
    </Card>
  );
}

function CbiSection({ rows, loading }: { rows: CbiProgram[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rows.map(p => (
        <Card key={p.id} data-testid={`card-cbi-${p.programCode}`}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <Badge className={TIER_COLOR[p.evidenceTier] || ""}>{p.evidenceTier}</Badge>
            </div>
            <CardDescription className="font-mono text-xs">{p.programCode}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{p.description}</p>
            <div className="text-xs text-muted-foreground">
              <strong>Evidence:</strong> {p.evidenceSource}
            </div>
            <div className="text-xs grid grid-cols-2 gap-1 pt-1">
              <div><strong>Duration:</strong> {p.durationWeeks} wks</div>
              <div><strong>Sessions:</strong> {p.sessionsCount}</div>
              <div><strong>Modality:</strong> {p.modality}</div>
              <div><strong>Cost:</strong> {p.costPerParticipant}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant={p.internalDelivery ? "default" : "outline"} className="text-xs">
                {p.internalDelivery ? "In-House Delivery" : "Referral Pathway"}
              </Badge>
              {p.referralPartner && <Badge variant="outline" className="text-xs">→ {p.referralPartner}</Badge>}
            </div>
            {p.resourceUrl && (
              <a href={p.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center text-primary hover:underline" data-testid={`link-cbi-resource-${p.programCode}`}>
                Curriculum source <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CertificationsSection({ rows, loading }: { rows: StaffCertification[]; loading: boolean }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    staffName: "", staffEmail: "", staffRole: "case_manager",
    certificationType: "MI", certificationName: "Motivational Interviewing",
    issuingBody: "", issuedDate: "", expiresDate: "", livedExperience: false, notes: "",
  });

  const create = useMutation({
    mutationFn: async (data: typeof form) => apiRequest("POST", "/api/standards/certifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standards/scorecard"] });
      toast({ title: "Certification added" });
      setOpen(false);
      setForm({ staffName: "", staffEmail: "", staffRole: "case_manager", certificationType: "MI", certificationName: "Motivational Interviewing", issuingBody: "", issuedDate: "", expiresDate: "", livedExperience: false, notes: "" });
    },
    onError: (e: Error) => toast({ title: "Failed to add", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/standards/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standards/scorecard"] });
      toast({ title: "Certification removed" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Certifications</CardTitle>
          <CardDescription>MI, CBI, RNR, and other evidence-based-practice credentials. Lived-experience flag is tracked per NRRC standards.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-certification"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Staff Certification</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Staff Name</Label><Input value={form.staffName} onChange={e => setForm({ ...form, staffName: e.target.value })} data-testid="input-staff-name" /></div>
                <div><Label>Email</Label><Input type="email" value={form.staffEmail} onChange={e => setForm({ ...form, staffEmail: e.target.value })} data-testid="input-staff-email" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Role</Label>
                  <Select value={form.staffRole} onValueChange={v => setForm({ ...form, staffRole: v })}>
                    <SelectTrigger data-testid="select-staff-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="case_manager">Case Manager</SelectItem>
                      <SelectItem value="navigator">Navigator</SelectItem>
                      <SelectItem value="facilitator">Facilitator</SelectItem>
                      <SelectItem value="peer_mentor">Peer Mentor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Certification</Label>
                  <Select value={form.certificationType} onValueChange={v => setForm({ ...form, certificationType: v, certificationName: ({ MI: "Motivational Interviewing", T4C: "Thinking for a Change", MRT: "Moral Reconation Therapy", ART: "Aggression Replacement Training", RNR_LSI: "RNR / LSI-R Assessor", TI_CARE: "Trauma-Informed Care", NCRC: "National Career Readiness", OTHER: "" } as Record<string, string>)[v] || "" })}>
                    <SelectTrigger data-testid="select-cert-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MI">Motivational Interviewing</SelectItem>
                      <SelectItem value="T4C">Thinking for a Change</SelectItem>
                      <SelectItem value="MRT">Moral Reconation Therapy</SelectItem>
                      <SelectItem value="ART">Aggression Replacement Training</SelectItem>
                      <SelectItem value="RNR_LSI">RNR / LSI-R Assessor</SelectItem>
                      <SelectItem value="TI_CARE">Trauma-Informed Care</SelectItem>
                      <SelectItem value="NCRC">National Career Readiness</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Certification Name</Label><Input value={form.certificationName} onChange={e => setForm({ ...form, certificationName: e.target.value })} data-testid="input-cert-name" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Issuing Body</Label><Input value={form.issuingBody} onChange={e => setForm({ ...form, issuingBody: e.target.value })} data-testid="input-issuing-body" /></div>
                <div><Label>Issued Date</Label><Input type="date" value={form.issuedDate} onChange={e => setForm({ ...form, issuedDate: e.target.value })} data-testid="input-issued-date" /></div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="lived" checked={form.livedExperience} onCheckedChange={v => setForm({ ...form, livedExperience: !!v })} data-testid="checkbox-lived-experience" />
                <Label htmlFor="lived" className="cursor-pointer">Has lived justice-involved experience</Label>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-cert-notes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate(form)} disabled={!form.staffName || create.isPending} data-testid="button-save-certification">
                {create.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : rows.length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No certifications recorded yet. Add your first to start the staff training roster.</div>
          : (
          <div className="space-y-2">
            {rows.map(c => (
              <div key={c.id} className="flex items-center justify-between border rounded p-3" data-testid={`row-cert-${c.id}`}>
                <div className="space-y-1">
                  <div className="font-medium">{c.staffName} <span className="text-xs text-muted-foreground">· {c.staffRole}</span></div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{c.certificationType}</Badge>
                    <Badge variant="outline" className="text-xs">{c.certificationName}</Badge>
                    {c.livedExperience && <Badge className="bg-purple-600 text-white text-xs">Lived Experience</Badge>}
                    <Badge variant={c.status === "active" ? "default" : "outline"} className="text-xs">{c.status}</Badge>
                  </div>
                  {c.issuingBody && <div className="text-xs text-muted-foreground">{c.issuingBody} · {c.issuedDate}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)} data-testid={`button-delete-cert-${c.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RnrSection({ rows, loading, cbi }: { rows: RnrAssessment[]; loading: boolean; cbi: CbiProgram[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    participantName: "", assessorName: "", responsivityFactors: "", notes: "",
    needAntisocialAttitudes: 0, needAntisocialPeers: 0, needSubstanceAbuse: 0,
    needFamilyMarital: 0, needEducationEmployment: 0, needLeisureRecreation: 0,
    needAntisocialPersonality: 0, needHistoryOfBehavior: 0,
  });

  const totalNeeds = NEEDS_FIELDS.reduce((s, f) => s + Number((form as Record<string, unknown>)[f.key as string] || 0), 0);
  const riskScore = Math.min(100, Math.round((totalNeeds / 80) * 100));
  const riskLevel = riskScore >= 75 ? "very_high" : riskScore >= 50 ? "high" : riskScore >= 25 ? "medium" : "low";

  const recommended = (() => {
    const out: string[] = [];
    if (form.needAntisocialAttitudes >= 5 || form.needAntisocialPersonality >= 5) out.push("T4C", "MRT");
    if (form.needSubstanceAbuse >= 5) out.push("MRT");
    if (form.needAntisocialPeers >= 5) out.push("ART");
    if (form.needHistoryOfBehavior >= 5) out.push("RR2");
    if (riskLevel === "low") out.push("DP");
    return Array.from(new Set(out));
  })();

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/standards/rnr", { ...form, riskScore, riskLevel, recommendedPrograms: recommended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards/rnr"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standards/scorecard"] });
      toast({ title: "RNR assessment saved" });
      setOpen(false);
      setForm({ participantName: "", assessorName: "", responsivityFactors: "", notes: "", needAntisocialAttitudes: 0, needAntisocialPeers: 0, needSubstanceAbuse: 0, needFamilyMarital: 0, needEducationEmployment: 0, needLeisureRecreation: 0, needAntisocialPersonality: 0, needHistoryOfBehavior: 0 });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/standards/rnr/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards/rnr"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standards/scorecard"] });
      toast({ title: "Removed" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>RNR Assessments</CardTitle>
          <CardDescription>Risk-Needs-Responsivity scoring across the 8 NRRC criminogenic-needs domains. Recommendations auto-pull from your CBI catalog.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rnr"><Plus className="h-4 w-4 mr-1" /> New Assessment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>RNR Assessment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Participant Name</Label><Input value={form.participantName} onChange={e => setForm({ ...form, participantName: e.target.value })} data-testid="input-rnr-participant" /></div>
                <div><Label>Assessor Name</Label><Input value={form.assessorName} onChange={e => setForm({ ...form, assessorName: e.target.value })} data-testid="input-rnr-assessor" /></div>
              </div>
              <div className="border rounded p-3 space-y-2 bg-muted/30">
                <div className="text-sm font-semibold">Criminogenic Needs (0–10 each)</div>
                {NEEDS_FIELDS.map(f => (
                  <div key={f.key as string} className="grid grid-cols-3 gap-2 items-center">
                    <Label className="col-span-2 text-sm">{f.label}</Label>
                    <Input type="number" min={0} max={10} value={Number((form as Record<string, unknown>)[f.key as string] || 0)}
                      onChange={e => setForm({ ...form, [f.key as string]: Math.max(0, Math.min(10, Number(e.target.value) || 0)) } as typeof form)}
                      data-testid={`input-need-${f.key as string}`} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border rounded p-2"><div className="text-xs">Risk Score</div><div className="text-2xl font-bold">{riskScore}</div></div>
                <div className="border rounded p-2"><div className="text-xs">Risk Level</div><Badge className="mt-1">{riskLevel.toUpperCase()}</Badge></div>
                <div className="border rounded p-2"><div className="text-xs">Recommended</div><div className="text-xs mt-1">{recommended.join(", ") || "—"}</div></div>
              </div>
              <div><Label>Responsivity Factors</Label><Textarea placeholder="Learning style, motivation, mental health, language, etc." value={form.responsivityFactors} onChange={e => setForm({ ...form, responsivityFactors: e.target.value })} data-testid="input-rnr-responsivity" /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-rnr-notes" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.participantName || create.isPending} data-testid="button-save-rnr">
                {create.isPending ? "Saving…" : "Save Assessment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-sm text-muted-foreground">Loading…</div>
          : rows.length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No RNR assessments yet. Click "New Assessment" to score your first participant.</div>
          : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between border rounded p-3" data-testid={`row-rnr-${r.id}`}>
                <div className="space-y-1">
                  <div className="font-medium">{r.participantName || "Unnamed"} <span className="text-xs text-muted-foreground">· assessed by {r.assessorName || "—"}</span></div>
                  <div className="flex gap-1.5">
                    <Badge>{r.riskLevel?.toUpperCase()}</Badge>
                    <Badge variant="outline">Score {r.riskScore}</Badge>
                    {r.recommendedPrograms?.map((p, i) => <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)} data-testid={`button-delete-rnr-${r.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
