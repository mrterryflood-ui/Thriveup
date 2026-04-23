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
import { Sparkles, Download, RefreshCw, ExternalLink, MapPin, Building2, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Jurisdiction { code: string; name: string; capital: string; fips: string; type: string; }
interface ExtensionPartner { institution: string; url: string; }
interface FederalPartnerSet { jurisdictionCode: string; jurisdictionName: string; extension: ExtensionPartner; americanJobCenterLocator: string; sbdcLocator: string; }
interface BenefitProgram { slug: string; programName: string; portalUrl: string; phone: string; area: string; }
interface StateSnapshot { jurisdiction: Jurisdiction; federalPartners: FederalPartnerSet; programs: BenefitProgram[]; }
interface Finding { text: string; citations: string[]; retrievedAt: string; cached: boolean; source: string; }
interface IntelBundle { stateCode: string; aiInitiatives: Finding; recentFederalAwards: Finding; workforcePrograms: Finding; budget: { used: number; cap: number; resetsAt: string }; }
interface LoiResult { markdown: string; citations: string[]; jurisdictionName: string; partnerCount: number; programCount: number; }

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
