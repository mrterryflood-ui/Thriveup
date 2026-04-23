import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Download, RefreshCw, ExternalLink, MapPin, Building2, FileText, Handshake, CheckCircle2, XCircle, Network, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Jurisdiction { code: string; name: string; capital: string; fips: string; type: string; }
interface ExtensionPartner { institution: string; url: string; }
interface FederalPartnerSet { jurisdictionCode: string; jurisdictionName: string; extension: ExtensionPartner; americanJobCenterLocator: string; sbdcLocator: string; }
interface BenefitProgram { slug: string; programName: string; portalUrl: string; phone: string; area: string; }
interface StateSnapshot { jurisdiction: Jurisdiction; federalPartners: FederalPartnerSet; programs: BenefitProgram[]; }
interface Finding { text: string; citations: string[]; retrievedAt: string; cached: boolean; source: string; }
interface IntelBundle { stateCode: string; aiInitiatives: Finding; recentFederalAwards: Finding; workforcePrograms: Finding; budget: { used: number; cap: number; resetsAt: string }; }
interface LoiResult { markdown: string; citations: string[]; jurisdictionName: string; partnerCount: number; programCount: number; }
interface HubMou { id: string; hubStateCode: string; partnerOrg: string; partnerRole: string; contactName: string | null; contactEmail: string | null; status: string; notes: string | null; updatedAt: string; }
interface Discovery { id: string; stateCode: string; queryType: string; text: string | null; citations: string[] | null; status: string; reviewedBy: string | null; reviewedAt: string | null; retrievedAt: string; }
interface FedPeer { id: string; url: string; lastMirrorAt: string | null; lastMirrorOk: boolean | null; successCount: number; failureCount: number; }
interface FedStatus { ok: boolean; peers: FedPeer[]; lastEventAt: string | null; mirrorLog: Array<{ at: string; targetId: string; eventType: string; ok: boolean }>; }

const MOU_STATUSES = ["planned", "outreached", "letter_sent", "committed", "signed", "declined"];
function mouStatusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "signed" || s === "committed") return "default";
  if (s === "declined") return "destructive";
  if (s === "letter_sent" || s === "outreached") return "secondary";
  return "outline";
}

const DEADLINE = new Date("2026-06-16T22:00:00Z");

function daysTo(d: Date): number { return Math.ceil((d.getTime() - Date.now()) / 86400000); }

export default function NsfTechAccessHubPage() {
  const { toast } = useToast();
  const [stateCode, setStateCode] = useState("TX");
  const [leadOrg, setLeadOrg] = useState("ThriveUp Community Action Foundation (TCAF)");
  const [leadOrgUei, setLeadOrgUei] = useState("KDDVD1FGLW35");
  const [leadOrgPi, setLeadOrgPi] = useState("");
  const [includeLive, setIncludeLive] = useState(true);
  const [loi, setLoi] = useState<LoiResult | null>(null);

  const { data: jurisdictions } = useQuery<Jurisdiction[]>({ queryKey: ["/api/nsf/jurisdictions"] });
  const { data: snapshot, isLoading: snapLoading } = useQuery<StateSnapshot>({ queryKey: ["/api/nsf/state", stateCode] });
  const { data: intel, isLoading: intelLoading, refetch: refetchIntel, isFetching: intelFetching } = useQuery<IntelBundle>({
    queryKey: ["/api/nsf/intelligence", stateCode],
    enabled: false,
  });
  const { data: mousData } = useQuery<{ stateCode: string; mous: HubMou[] }>({ queryKey: ["/api/nsf/mous", stateCode] });
  const { data: discoveriesData } = useQuery<{ count: number; discoveries: Discovery[] }>({ queryKey: ["/api/nsf/discoveries", stateCode] });
  const { data: federation } = useQuery<FedStatus>({ queryKey: ["/api/nsf/federation-status"], refetchInterval: 30000 });

  const updateMouMut = useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const r = await apiRequest("PATCH", `/api/nsf/mous/${v.id}`, { status: v.status });
      return await r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/nsf/mous", stateCode] }); },
  });
  const addMouMut = useMutation({
    mutationFn: async (v: { partnerOrg: string; partnerRole: string }) => {
      const r = await apiRequest("POST", "/api/nsf/mous", { hubStateCode: stateCode, ...v, status: "planned" });
      return await r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/nsf/mous", stateCode] }); setNewMouOrg(""); setNewMouRole(""); },
  });
  const deleteMouMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/nsf/mous/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/nsf/mous", stateCode] }); },
  });
  const reviewDiscoveryMut = useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const r = await apiRequest("PATCH", `/api/nsf/discoveries/${v.id}`, { status: v.status });
      return await r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/nsf/discoveries", stateCode] }); },
  });
  const [newMouOrg, setNewMouOrg] = useState("");
  const [newMouRole, setNewMouRole] = useState("");

  const generateMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/nsf/generate-loi", { stateCode, leadOrg, leadOrgUei, leadOrgPi, includeLive });
      return await r.json() as LoiResult;
    },
    onSuccess: (data) => { setLoi(data); toast({ title: "LOI generated", description: `${data.jurisdictionName} — ${data.programCount} programs, ${data.citations.length} citations.` }); },
    onError: (err) => { toast({ title: "Generation failed", description: String(err), variant: "destructive" }); },
  });

  const downloadLoi = () => {
    if (!loi) return;
    const blob = new Blob([loi.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NSF-26-508-LOI-${stateCode}-Hub.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const days = daysTo(DEADLINE);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">NSF 26-508 TechAccess Hub Workbench</h1>
          <p className="text-muted-foreground mt-1">AI-Ready America Coordination Hub — live for all 56 jurisdictions</p>
        </div>
        <Card className="p-4 flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Round 1 LOI deadline</div>
            <div className="text-lg font-semibold">June 16, 2026</div>
          </div>
          <Badge variant={days < 30 ? "destructive" : days < 60 ? "default" : "secondary"} data-testid="badge-days-remaining">{days} days</Badge>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Jurisdiction</Label>
            <Select value={stateCode} onValueChange={setStateCode}>
              <SelectTrigger data-testid="select-jurisdiction"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-96">
                {jurisdictions?.map(j => (<SelectItem key={j.code} value={j.code}>{j.code} — {j.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lead Institution</Label>
            <Input value={leadOrg} onChange={e => setLeadOrg(e.target.value)} data-testid="input-lead-org" />
          </div>
          <div>
            <Label>UEI</Label>
            <Input value={leadOrgUei} onChange={e => setLeadOrgUei(e.target.value)} data-testid="input-uei" />
          </div>
          <div>
            <Label>Principal Investigator</Label>
            <Input value={leadOrgPi} onChange={e => setLeadOrgPi(e.target.value)} placeholder="Optional" data-testid="input-pi" />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="snapshot">
        <TabsList>
          <TabsTrigger value="snapshot" data-testid="tab-snapshot"><MapPin className="w-4 h-4 mr-1" />State Snapshot</TabsTrigger>
          <TabsTrigger value="intelligence" data-testid="tab-intelligence"><Sparkles className="w-4 h-4 mr-1" />Live Intelligence</TabsTrigger>
          <TabsTrigger value="mous" data-testid="tab-mous"><Handshake className="w-4 h-4 mr-1" />Partner MOUs ({mousData?.mous?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="discoveries" data-testid="tab-discoveries"><CheckCircle2 className="w-4 h-4 mr-1" />Discoveries ({discoveriesData?.count ?? 0})</TabsTrigger>
          <TabsTrigger value="federation" data-testid="tab-federation"><Network className="w-4 h-4 mr-1" />Federation</TabsTrigger>
          <TabsTrigger value="loi" data-testid="tab-loi"><FileText className="w-4 h-4 mr-1" />Generate LOI</TabsTrigger>
        </TabsList>

        <TabsContent value="snapshot" className="space-y-4">
          {snapLoading ? <Skeleton className="h-64" /> : snapshot && (
            <>
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" />Federal Partner Plug-Ins</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">USDA-NIFA Cooperative Extension:</span>{" "}
                    <a href={snapshot.federalPartners.extension.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1" data-testid="link-extension">
                      {snapshot.federalPartners.extension.institution} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div><span className="text-muted-foreground">DOL American Job Centers:</span>{" "}
                    <a href={snapshot.federalPartners.americanJobCenterLocator} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1" data-testid="link-ajc">
                      {snapshot.jurisdiction.name} AJC locator <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div><span className="text-muted-foreground">SBA Small Business Development Centers:</span>{" "}
                    <a href={snapshot.federalPartners.sbdcLocator} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1" data-testid="link-sbdc">
                      {snapshot.jurisdiction.name} SBDC locator <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-3">State Programs ({snapshot.programs.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {snapshot.programs.map(p => (
                    <a key={p.slug} href={p.portalUrl} target="_blank" rel="noopener noreferrer" className="border rounded p-2 hover:bg-muted/50" data-testid={`link-program-${p.slug}`}>
                      <div className="font-medium">{p.programName}</div>
                      <div className="text-xs text-muted-foreground">{p.area} · {p.phone}</div>
                    </a>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Live AI-Grounded Intelligence</h3>
                <p className="text-xs text-muted-foreground">Powered by Perplexity sonar-pro · Cached 24h per state</p>
              </div>
              <Button onClick={() => refetchIntel()} disabled={intelFetching} data-testid="button-refresh-intel">
                <RefreshCw className={`w-4 h-4 mr-2 ${intelFetching ? "animate-spin" : ""}`} />
                {intel ? "Refresh" : "Run Research"}
              </Button>
            </div>
            {intelLoading || intelFetching ? <Skeleton className="h-64" /> : intel ? (
              <div className="space-y-4">
                {[
                  { label: "Current AI Initiatives", f: intel.aiInitiatives },
                  { label: "Recent Federal AI Awards", f: intel.recentFederalAwards },
                  { label: "Workforce AI Programs", f: intel.workforcePrograms },
                ].map(({ label, f }) => (
                  <div key={label} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{label}</h4>
                      <Badge variant="outline" className="text-xs">{f.cached ? "cached" : f.source}</Badge>
                    </div>
                    <div className="text-sm whitespace-pre-wrap" data-testid={`text-finding-${label.replace(/\s/g,"-").toLowerCase()}`}>{f.text || "(no findings)"}</div>
                    {f.citations.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Sources: {f.citations.map((c, i) => (<a key={i} href={c} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mr-2">[{i + 1}]</a>))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">Daily token budget: {intel.budget.used.toLocaleString()} / {intel.budget.cap.toLocaleString()} · Resets {new Date(intel.budget.resetsAt).toLocaleString()}</div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Click "Run Research" to pull live state-specific AI readiness intelligence with citations.</p>}
          </Card>
        </TabsContent>

        <TabsContent value="mous" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Partner MOU Pipeline — {stateCode}</h3>
            <div className="space-y-2">
              {mousData?.mous?.map(m => (
                <div key={m.id} className="border rounded p-3 flex items-start justify-between gap-4" data-testid={`mou-${m.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{m.partnerOrg}</div>
                    <div className="text-xs text-muted-foreground">{m.partnerRole}</div>
                    {m.contactEmail && <div className="text-xs mt-1">{m.contactName ? `${m.contactName} · ` : ""}<a href={`mailto:${m.contactEmail}`} className="text-primary hover:underline">{m.contactEmail}</a></div>}
                    {m.notes && <div className="text-xs mt-1 text-muted-foreground">{m.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={mouStatusVariant(m.status)}>{m.status}</Badge>
                    <Select value={m.status} onValueChange={(v) => updateMouMut.mutate({ id: m.id, status: v })}>
                      <SelectTrigger className="w-36 h-8" data-testid={`select-mou-status-${m.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{MOU_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => deleteMouMut.mutate(m.id)} data-testid={`button-delete-mou-${m.id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {(!mousData?.mous || mousData.mous.length === 0) && <p className="text-sm text-muted-foreground">No MOUs yet for {stateCode}. Add the first below.</p>}
            </div>
            <div className="border-t mt-4 pt-3 flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]"><Label className="text-xs">Partner organization</Label><Input value={newMouOrg} onChange={e => setNewMouOrg(e.target.value)} placeholder="e.g., State Workforce Board" data-testid="input-new-mou-org" /></div>
              <div className="flex-1 min-w-[200px]"><Label className="text-xs">Role</Label><Input value={newMouRole} onChange={e => setNewMouRole(e.target.value)} placeholder="e.g., Workforce — DOL/ETA alignment" data-testid="input-new-mou-role" /></div>
              <Button onClick={() => addMouMut.mutate({ partnerOrg: newMouOrg, partnerRole: newMouRole })} disabled={!newMouOrg || !newMouRole || addMouMut.isPending} data-testid="button-add-mou"><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">MOUs in status <code>outreached / letter_sent / committed / signed</code> auto-populate the LOI partner roster when you generate.</p>
          </Card>
        </TabsContent>

        <TabsContent value="discoveries" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Live Intelligence Discoveries — {stateCode}</h3>
            {discoveriesData?.discoveries?.length ? (
              <div className="space-y-3">
                {discoveriesData.discoveries.map(d => (
                  <div key={d.id} className="border rounded p-3" data-testid={`discovery-${d.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{d.queryType}</Badge>
                        <Badge variant={d.status === "confirmed" ? "default" : d.status === "dismissed" ? "destructive" : "secondary"}>{d.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(d.retrievedAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap mb-2">{d.text?.slice(0, 600)}{(d.text?.length ?? 0) > 600 ? "…" : ""}</div>
                    {d.citations && d.citations.length > 0 && (<div className="text-xs text-muted-foreground mb-2">Sources: {d.citations.map((c, i) => <a key={i} href={c} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mr-2">[{i + 1}]</a>)}</div>)}
                    {d.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => reviewDiscoveryMut.mutate({ id: d.id, status: "confirmed" })} data-testid={`button-confirm-${d.id}`}><CheckCircle2 className="w-3 h-3 mr-1" />Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => reviewDiscoveryMut.mutate({ id: d.id, status: "dismissed" })} data-testid={`button-dismiss-${d.id}`}><XCircle className="w-3 h-3 mr-1" />Dismiss</Button>
                      </div>
                    )}
                    {d.reviewedBy && <div className="text-xs text-muted-foreground mt-1">Reviewed by {d.reviewedBy} · {d.reviewedAt && new Date(d.reviewedAt).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No discoveries yet. Run live intelligence to populate.</p>}
            <p className="text-xs text-muted-foreground mt-3">Confirmed discoveries persist in the catalog; dismissed entries are kept for audit but flagged.</p>
          </Card>
        </TabsContent>

        <TabsContent value="federation" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">RPLICE v2 Federation Status</h3>
            <div className="text-xs text-muted-foreground mb-3">Last network event: {federation?.lastEventAt ? new Date(federation.lastEventAt).toLocaleString() : "(none yet)"}</div>
            {federation?.peers?.length ? (
              <div className="space-y-2">
                {federation.peers.map(p => (
                  <div key={p.id} className="border rounded p-3 flex items-center justify-between" data-testid={`peer-${p.id}`}>
                    <div>
                      <div className="font-medium">{p.id}</div>
                      <div className="text-xs text-muted-foreground">{p.url}</div>
                    </div>
                    <div className="text-right text-xs">
                      <Badge variant={p.lastMirrorOk === true ? "default" : p.lastMirrorOk === false ? "destructive" : "secondary"}>{p.lastMirrorOk === null ? "no traffic" : p.lastMirrorOk ? "ok" : "fail"}</Badge>
                      <div className="text-muted-foreground mt-1">last: {p.lastMirrorAt ? new Date(p.lastMirrorAt).toLocaleString() : "—"}</div>
                      <div className="text-muted-foreground">{p.successCount} ok · {p.failureCount} fail</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No active peer mirroring detected.</p>}
            {federation?.mirrorLog && federation.mirrorLog.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Recent mirror log</h4>
                <div className="space-y-1 text-xs font-mono">
                  {federation.mirrorLog.slice(0, 8).map((m, i) => (
                    <div key={i} className={m.ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                      {new Date(m.at).toLocaleTimeString()} · {m.targetId} · {m.eventType} · {m.ok ? "ok" : "fail"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="loi" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Generate Letter of Intent</h3>
                <p className="text-xs text-muted-foreground">NSF-compliant markdown · ready to review and submit via Research.gov</p>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={includeLive} onChange={e => setIncludeLive(e.target.checked)} data-testid="checkbox-include-live" /> Include live intelligence</label>
                <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending} data-testid="button-generate-loi">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generateMut.isPending ? "Generating..." : "Generate LOI"}
                </Button>
                {loi && <Button variant="outline" onClick={downloadLoi} data-testid="button-download-loi"><Download className="w-4 h-4 mr-2" />Download .md</Button>}
              </div>
            </div>
            {loi ? (
              <Textarea value={loi.markdown} onChange={e => setLoi({ ...loi, markdown: e.target.value })} className="font-mono text-xs min-h-[600px]" data-testid="textarea-loi" />
            ) : <p className="text-sm text-muted-foreground">Configure jurisdiction and lead-org details above, then generate.</p>}
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-muted/30">
        <h3 className="font-semibold text-sm mb-2">Hub Adoption Kit</h3>
        <p className="text-xs text-muted-foreground">This workbench is the open kit. Any state Coordination Hub can point at this URL, pick their jurisdiction, generate their own LOI, and adopt RPLICE v2 as their coordination protocol. Documentation: <code className="text-xs">shared/nationwide/hub-adoption-kit/README.md</code></p>
      </Card>
    </div>
  );
}
