import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Building2, Upload, AlertTriangle, ShieldCheck, Users, Info, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FosterYouthAgency, FosterYouthAgencyCase } from "@shared/schema";

const TIER_COLORS: Record<string, string> = { stable: "#16a34a", watch: "#eab308", elevated: "#f97316", critical: "#dc2626" };
const TIER_LABELS: Record<string, string> = { stable: "Stable", watch: "Watch", elevated: "Elevated", critical: "Critical — coordinate now" };

export default function StatePortalPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [openCase, setOpenCase] = useState<FosterYouthAgencyCase | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Agencies list
  const agenciesQ = useQuery<{ agencies: FosterYouthAgency[] }>({ queryKey: ["/api/foster-youth/agencies"] });
  const agencies = agenciesQ.data?.agencies || [];
  useEffect(() => {
    if (!selectedAgency && agencies.length) setSelectedAgency(agencies[0].id);
  }, [agencies, selectedAgency]);

  // Cases for the selected agency
  const casesQ = useQuery<{ cases: FosterYouthAgencyCase[] }>({
    queryKey: ["/api/foster-youth/agency", selectedAgency, "cases"],
    enabled: !!selectedAgency,
    queryFn: async () => {
      const r = await fetch(`/api/foster-youth/agency/${selectedAgency}/cases`, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });
  const cases = casesQ.data?.cases || [];
  const filtered = useMemo(() => tierFilter === "all" ? cases : cases.filter(c => c.riskTier === tierFilter), [cases, tierFilter]);
  const stratData = useMemo(() => {
    const t = { stable: 0, watch: 0, elevated: 0, critical: 0 } as Record<string, number>;
    cases.forEach(c => { t[c.riskTier] = (t[c.riskTier] || 0) + 1; });
    return Object.entries(t).map(([tier, n]) => ({ tier, n }));
  }, [cases]);

  // Create agency
  const [agencyDraft, setAgencyDraft] = useState({ id: "", name: "", stateCode: "TX", agencyType: "state", contactName: "", contactEmail: "", status: "demo" });
  const createAgencyM = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/foster-youth/agencies", agencyDraft);
      return r.json();
    },
    onSuccess: (j: { agency?: FosterYouthAgency }) => {
      qc.invalidateQueries({ queryKey: ["/api/foster-youth/agencies"] });
      if (j.agency?.id) setSelectedAgency(j.agency.id);
      setAgencyDraft({ id: "", name: "", stateCode: "TX", agencyType: "state", contactName: "", contactEmail: "", status: "demo" });
      toast({ title: "Agency created", description: j.agency?.name || "" });
    },
    onError: (e: Error) => toast({ title: "Could not create agency", description: e.message, variant: "destructive" }),
  });

  // Bulk CSV upload
  const uploadM = useMutation({
    mutationFn: async (csv: string) => {
      const r = await apiRequest("POST", "/api/foster-youth/agency/cases/bulk-csv", { agencyId: selectedAgency, csv });
      return r.json();
    },
    onSuccess: (j: { inserted: number; errorCount: number; stratification: Record<string, number> }) => {
      qc.invalidateQueries({ queryKey: ["/api/foster-youth/agency", selectedAgency, "cases"] });
      toast({
        title: `Uploaded ${j.inserted} cases`,
        description: `Stable ${j.stratification.stable} · Watch ${j.stratification.watch} · Elevated ${j.stratification.elevated} · Critical ${j.stratification.critical}${j.errorCount ? ` · ${j.errorCount} skipped` : ""}`,
      });
    },
    onError: (e: Error) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "CSV must be ≤ 2 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadM.mutate(String(reader.result || ""));
    reader.readAsText(f);
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-foster-youth-state-portal">
      <CrisisStrip />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">State-Agency Foster-Youth Portal</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Designed for state &amp; county child-welfare agencies to upload de-identified caseload data, see who needs coordinated attention, and route every youth to the right stakeholders before they age out unsupported. Modeled on the child and family services intelligence pattern used at <a className="underline" href="https://childcore.app" target="_blank" rel="noreferrer">childcore.app</a>.
        </p>
      </div>

      <Alert data-testid="alert-honest-disclosure">
        <Info className="h-4 w-4" />
        <AlertTitle>Honest disclosure — what's live vs. what's roadmap</AlertTitle>
        <AlertDescription className="space-y-1">
          <div><strong>Live today:</strong> deterministic, citation-backed risk stratification engine; CSV bulk upload (≤5,000 rows / 2MB); per-agency caseload view; ISS-style stakeholder coordination panel.</div>
          <div><strong>Roadmap (needs MOU):</strong> direct integration with state CCWIS systems, FERPA/HIPAA data-sharing agreements, SOC 2 audit, NDACAN longitudinal data ingest, real-time school SIS / Medicaid / court-data interoperability.</div>
          <div><strong>Privacy:</strong> uploads must be DE-IDENTIFIED. We never accept name, SSN, address, or DOB — only an agency-internal case ID + a coarse age in years.</div>
          <div><strong>Tenant scope (today):</strong> this is a single-tenant TCAF pilot. Every TCAF privileged user (admin / case manager / teacher) can read every agency on this instance. Per-agency membership scoping is roadmap and will land before the first external state-agency MOU goes live.</div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="caseload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="caseload" data-testid="tab-caseload">Caseload</TabsTrigger>
          <TabsTrigger value="upload" data-testid="tab-upload">Upload CSV</TabsTrigger>
          <TabsTrigger value="agency" data-testid="tab-agency">Agencies</TabsTrigger>
          <TabsTrigger value="method" data-testid="tab-method">Method &amp; Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="caseload" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <Label>Agency</Label>
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger data-testid="select-agency"><SelectValue placeholder="Pick an agency" /></SelectTrigger>
                <SelectContent>
                  {agencies.map(a => (
                    <SelectItem key={a.id} value={a.id} data-testid={`option-agency-${a.id}`}>
                      {a.name} <span className="opacity-60 ml-1">({a.stateCode} · {a.status})</span>
                    </SelectItem>
                  ))}
                  {!agencies.length && <SelectItem value="__none" disabled>No agencies — create one in the Agencies tab</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Risk tier</Label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tiers</SelectItem>
                  <SelectItem value="critical" data-testid="option-tier-critical">Critical</SelectItem>
                  <SelectItem value="elevated" data-testid="option-tier-elevated">Elevated</SelectItem>
                  <SelectItem value="watch" data-testid="option-tier-watch">Watch</SelectItem>
                  <SelectItem value="stable" data-testid="option-tier-stable">Stable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stratification</CardTitle>
              <CardDescription>Counts by tier — surface critical cases first.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]" data-testid="chart-stratification">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stratData}>
                    <XAxis dataKey="tier" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="n">
                      {stratData.map((d, i) => <Cell key={i} fill={TIER_COLORS[d.tier] || "#888"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cases ({filtered.length})</CardTitle>
              <CardDescription>Click a row to see triggered factors and recommended stakeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              {casesQ.isLoading ? <div>Loading…</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="py-2">Case ID</th><th>Age</th><th>Placement</th><th>Months in care</th><th>Placements</th><th>Tier</th><th className="text-right">Score</th></tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => (
                        <tr key={c.id} className="border-t hover:bg-accent/40 cursor-pointer" data-testid={`row-case-${c.externalCaseId}`} onClick={() => setOpenCase(c)}>
                          <td className="py-2 font-mono">{c.externalCaseId}</td>
                          <td>{c.ageYears ?? "—"}</td>
                          <td>{c.currentPlacementType || "—"}</td>
                          <td>{c.monthsInCare ?? "—"}</td>
                          <td>{c.placementCount ?? "—"}</td>
                          <td><Badge style={{ backgroundColor: TIER_COLORS[c.riskTier], color: "#fff" }} data-testid={`badge-tier-${c.riskTier}`}>{TIER_LABELS[c.riskTier]}</Badge></td>
                          <td className="text-right font-semibold">{c.riskScore}</td>
                        </tr>
                      ))}
                      {!filtered.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No cases yet — upload a CSV to populate this agency.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk-upload caseload CSV</CardTitle>
              <CardDescription>De-identified rows only. Score is computed server-side and is NOT user-editable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild data-testid="button-download-sample"><a href="/api/foster-youth/agency/sample-csv"><Download className="w-4 h-4 mr-1" /> Download sample CSV</a></Button>
                <Button onClick={() => fileRef.current?.click()} disabled={!selectedAgency || uploadM.isPending} data-testid="button-upload-csv">
                  <Upload className="w-4 h-4 mr-1" /> {uploadM.isPending ? "Uploading…" : "Upload CSV"}
                </Button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} data-testid="input-file-csv" />
              </div>
              <div className="text-xs text-muted-foreground">
                Required columns: <code>externalCaseId, ageYears, currentPlacementType, monthsInCare, placementCount, schoolDisruptions, ageAtFirstRemoval, hasIep, mentalHealthDx, mhInTreatment, priorRunaway, justiceContact, pregnantOrParenting, siblingsSeparated, permanentConnectionAdult, pregEducDocsComplete, lgbtqPlus, notes</code>. Allowed placements: family, kinship, group_home, RTC, ILP, emergency, runaway, unknown. Max 5,000 rows / 2MB.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agency" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Add an agency</CardTitle><CardDescription>Use a stable id like <code>TX-DFPS</code> or <code>CA-CDSS-LA</code>.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <div><Label>Agency id</Label><Input placeholder="TX-DFPS" value={agencyDraft.id} onChange={e => setAgencyDraft({ ...agencyDraft, id: e.target.value })} data-testid="input-agency-id" /></div>
              <div><Label>Name</Label><Input placeholder="Texas DFPS" value={agencyDraft.name} onChange={e => setAgencyDraft({ ...agencyDraft, name: e.target.value })} data-testid="input-agency-name" /></div>
              <div><Label>State</Label><Input maxLength={2} placeholder="TX" value={agencyDraft.stateCode} onChange={e => setAgencyDraft({ ...agencyDraft, stateCode: e.target.value.toUpperCase() })} data-testid="input-agency-state" /></div>
              <div><Label>Type</Label>
                <Select value={agencyDraft.agencyType} onValueChange={v => setAgencyDraft({ ...agencyDraft, agencyType: v })}>
                  <SelectTrigger data-testid="select-agency-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="tribal">Tribal</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Contact name</Label><Input value={agencyDraft.contactName} onChange={e => setAgencyDraft({ ...agencyDraft, contactName: e.target.value })} data-testid="input-agency-contact" /></div>
              <div><Label>Contact email</Label><Input type="email" value={agencyDraft.contactEmail} onChange={e => setAgencyDraft({ ...agencyDraft, contactEmail: e.target.value })} data-testid="input-agency-email" /></div>
              <div className="md:col-span-2">
                <Button onClick={() => createAgencyM.mutate()} disabled={!agencyDraft.name || !agencyDraft.stateCode || createAgencyM.isPending} data-testid="button-create-agency">
                  {createAgencyM.isPending ? "Creating…" : "Create agency"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Agencies on file ({agencies.length})</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {agencies.map(a => (
                  <li key={a.id} className="flex items-center justify-between border-b py-1" data-testid={`agency-row-${a.id}`}>
                    <span><strong>{a.name}</strong> <span className="opacity-60">({a.id} · {a.stateCode})</span></span>
                    <Badge variant={a.status === "active" ? "default" : "outline"}>{a.status}</Badge>
                  </li>
                ))}
                {!agencies.length && <li className="text-muted-foreground">No agencies yet.</li>}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="method" className="space-y-4">
          <Card data-testid="card-method">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> How risk is scored</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Every factor is rule-based with a published source. The total maps to a tier — <strong>tiers communicate urgency of system response, never deficit in the youth.</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Placement instability</strong> (&gt;5 placements, +25) — Midwest Study, Courtney et al. 2011 (Chapin Hall)</li>
                <li><strong>School disruption</strong> (&gt;3 changes, +15) — National Working Group on Foster Care &amp; Education</li>
                <li><strong>Long congregate stay</strong> (&gt;36 mo in group/RTC, +20) — Casey Family Programs</li>
                <li><strong>Prior runaway / AWOL</strong> (+15) — NYTD outcomes</li>
                <li><strong>Justice-system crossover</strong> (+15) — Vera Institute</li>
                <li><strong>Untreated mental-health diagnosis</strong> (+10) — AAP/Casey</li>
                <li><strong>No identified lifelong connection adult</strong> (+10) — Midwest Study</li>
                <li><strong>Sibling separation</strong> (+5) — Casey</li>
                <li><strong>Late entry to care (≥12)</strong> (+5)</li>
                <li><strong>Pregnant or parenting</strong> (+10) — CSSP</li>
                <li><strong>LGBTQ+</strong> (+5; system-response signal, not deficit) — True Colors United</li>
                <li><strong>IEP active but transition docs incomplete</strong> (+5) — IDEA §300.43</li>
              </ul>
              <div className="text-xs text-muted-foreground">Tiers: 0–19 Stable · 20–39 Watch · 40–59 Elevated · 60+ Critical.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!openCase} onOpenChange={(o) => !o && setOpenCase(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-case-detail">
          <DialogHeader>
            <DialogTitle>Case {openCase?.externalCaseId}</DialogTitle>
            <DialogDescription>De-identified case detail — risk breakdown and stakeholder coordination.</DialogDescription>
          </DialogHeader>
          {openCase && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge style={{ backgroundColor: TIER_COLORS[openCase.riskTier], color: "#fff" }} data-testid="badge-detail-tier">{TIER_LABELS[openCase.riskTier]}</Badge>
                <span className="text-2xl font-bold">{openCase.riskScore}</span>
                <span className="text-muted-foreground">composite risk score</span>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-1 mb-1"><AlertTriangle className="w-4 h-4 text-orange-500" /> Triggered factors</h4>
                <ul className="space-y-1 text-sm">
                  {(openCase.riskFactors as Array<{ id: string; label: string; points: number; citation: string; sourceUrl: string }> | null || []).map(f => (
                    <li key={f.id} data-testid={`factor-${f.id}`}>
                      <strong>+{f.points}</strong> · {f.label}
                      <a href={f.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground ml-2 underline">{f.citation}</a>
                    </li>
                  ))}
                  {!(openCase.riskFactors as unknown[] | null)?.length && <li className="text-muted-foreground">No risk factors triggered — youth currently presents as stable.</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-1 mb-1"><Users className="w-4 h-4 text-primary" /> Recommended stakeholders to loop in (ISS-style)</h4>
                <ul className="text-sm list-disc pl-6">
                  {(useCaseStakeholders(openCase)).map(s => <li key={s} data-testid={`stakeholder-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{s}</li>)}
                </ul>
              </div>
              {openCase.notes && <div className="text-sm bg-muted p-2 rounded">{openCase.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useCaseStakeholders(c: FosterYouthAgencyCase): string[] {
  const tier = c.riskTier as "stable" | "watch" | "elevated" | "critical";
  const base = ["Caseworker", "Foster parent / placement", "School counselor"];
  if (tier === "stable") return [...base, "ILP coordinator (yearly check)"];
  if (tier === "watch") return [...base, "ILP coordinator", "Healthcare PCP"];
  if (tier === "elevated") return [...base, "ILP coordinator", "Healthcare PCP", "Mental-health clinician", "CASA / GAL", "Court (next hearing)"];
  return [...base, "ILP coordinator", "Healthcare PCP", "Mental-health clinician", "CASA / GAL", "Court (emergency review)", "PHA (FYI voucher pre-screen)", "Education advocate"];
}
