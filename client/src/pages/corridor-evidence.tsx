import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Upload, FileText, ExternalLink } from "lucide-react";

interface MetricCatalogEntry { key: string; label: string; unit: string; }
interface GeographyCatalogEntry { key: string; label: string; type: string; }
interface EvidenceRow {
  id: string; geographyKey: string; geographyType: string; metricKey: string;
  metricLabel: string; value: number; unit: string | null; asOfDate: string | null;
  sourceName: string; sourceUrl: string | null; documentTitle: string | null;
  pageReference: string | null; methodology: string | null; verifiedBy: string | null;
  confidence: string; notes: string | null;
}
interface EvidenceResponse {
  evidence: EvidenceRow[];
  metricCatalog: MetricCatalogEntry[];
  geographyCatalog: GeographyCatalogEntry[];
}

export default function CorridorEvidencePage() {
  const { toast } = useToast();
  const [filterMetro, setFilterMetro] = useState<string>("all");

  const { data, isLoading } = useQuery<EvidenceResponse>({
    queryKey: ["/api/corridor/evidence", filterMetro],
    queryFn: async () => {
      const r = await fetch(`/api/corridor/evidence?metro=${filterMetro}`);
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
  });

  const [form, setForm] = useState({
    geographyKey: "", geographyType: "county", metricKey: "", metricLabel: "",
    value: "", unit: "", asOfDate: "", sourceName: "", sourceUrl: "",
    documentTitle: "", pageReference: "", methodology: "", verifiedBy: "",
    notes: "", confidence: "verified",
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => apiRequest("POST", "/api/corridor/evidence", payload),
    onSuccess: () => {
      toast({ title: "Evidence saved", description: "Synthesis will pick this up on next /api/corridor/story call." });
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/evidence"] });
      setForm({ ...form, value: "", asOfDate: "", sourceName: "", sourceUrl: "", documentTitle: "", pageReference: "", methodology: "", notes: "" });
    },
    onError: (err: any) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/corridor/evidence/${id}`),
    onSuccess: () => {
      toast({ title: "Evidence deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/evidence"] });
    },
  });

  const fetchRaceMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/corridor/refresh-race", {}),
    onSuccess: (data: any) => {
      toast({ title: "Census ACS race+age fetched", description: `${data.result?.updated ?? 0} verified evidence rows written.` });
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/evidence"] });
    },
    onError: (err: any) => toast({ title: "Fetch failed", description: err.message, variant: "destructive" }),
  });

  const handleMetricChange = (key: string) => {
    const m = data?.metricCatalog.find((x) => x.key === key);
    setForm({ ...form, metricKey: key, metricLabel: m?.label ?? "", unit: m?.unit ?? form.unit });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.geographyKey || !form.metricKey || !form.value || !form.sourceName) {
      toast({ title: "Missing fields", description: "Geography, metric, value, and source are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ ...form, value: parseFloat(form.value) });
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-7xl" data-testid="page-corridor-evidence">
      <div className="flex items-center justify-between">
        <Link href="/corridor">
          <Button variant="ghost" size="sm" data-testid="link-back-corridor"><ArrowLeft className="h-4 w-4 mr-2" />Back to Corridor</Button>
        </Link>
        <Button
          onClick={() => fetchRaceMutation.mutate()}
          disabled={fetchRaceMutation.isPending}
          data-testid="button-fetch-race"
        >
          <Upload className="h-4 w-4 mr-2" />
          {fetchRaceMutation.isPending ? "Fetching…" : "Auto-fetch Census ACS race+age"}
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Community Evidence Vault</h1>
        <p className="text-muted-foreground mt-1">
          Verified facts uploaded here override modeled values in the corridor synthesis. Every claim renders with full source citation in the deck and live story.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add new evidence</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Geography *</Label>
              <Select value={form.geographyKey} onValueChange={(v) => {
                const g = data?.geographyCatalog.find((x) => x.key === v);
                setForm({ ...form, geographyKey: v, geographyType: g?.type ?? "county" });
              }}>
                <SelectTrigger data-testid="select-geography"><SelectValue placeholder="Pick a geography" /></SelectTrigger>
                <SelectContent>
                  {data?.geographyCatalog.map((g) => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Metric *</Label>
              <Select value={form.metricKey} onValueChange={handleMetricChange}>
                <SelectTrigger data-testid="select-metric"><SelectValue placeholder="Pick a metric" /></SelectTrigger>
                <SelectContent>
                  {data?.metricCatalog.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value *</Label>
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} data-testid="input-value" />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. children, %, USD" data-testid="input-unit" />
            </div>
            <div>
              <Label>As-of date</Label>
              <Input type="date" value={form.asOfDate} onChange={(e) => setForm({ ...form, asOfDate: e.target.value })} data-testid="input-asof" />
            </div>
            <div>
              <Label>Confidence</Label>
              <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v })}>
                <SelectTrigger data-testid="select-confidence"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified (primary source)</SelectItem>
                  <SelectItem value="estimated">Estimated (partner intake / extrapolated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Source name *</Label>
              <Input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} placeholder="e.g. TEA TAPR 2023-24, Waco ISD Discipline Action Group" data-testid="input-source-name" />
            </div>
            <div className="md:col-span-2">
              <Label>Source URL</Label>
              <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://…" data-testid="input-source-url" />
            </div>
            <div>
              <Label>Document title</Label>
              <Input value={form.documentTitle} onChange={(e) => setForm({ ...form, documentTitle: e.target.value })} data-testid="input-doc-title" />
            </div>
            <div>
              <Label>Page reference</Label>
              <Input value={form.pageReference} onChange={(e) => setForm({ ...form, pageReference: e.target.value })} placeholder="e.g. Table 3, page 12" data-testid="input-page-ref" />
            </div>
            <div className="md:col-span-2">
              <Label>Methodology</Label>
              <Textarea value={form.methodology} onChange={(e) => setForm({ ...form, methodology: e.target.value })} placeholder="How was this number derived? What does it count exactly?" data-testid="input-methodology" />
            </div>
            <div>
              <Label>Verified by</Label>
              <Input value={form.verifiedBy} onChange={(e) => setForm({ ...form, verifiedBy: e.target.value })} placeholder="Your name / partner org" data-testid="input-verified-by" />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="input-notes" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-evidence">
                <Upload className="h-4 w-4 mr-2" />{createMutation.isPending ? "Saving…" : "Save verified evidence"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Evidence in the vault {data && <span className="text-sm font-normal text-muted-foreground ml-2">({data.evidence.length} rows)</span>}</CardTitle>
          <Select value={filterMetro} onValueChange={setFilterMetro}>
            <SelectTrigger className="w-48" data-testid="select-filter-metro"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Both metros</SelectItem>
              <SelectItem value="waco-mclennan">Waco / McLennan</SelectItem>
              <SelectItem value="austin-travis">Austin / Travis</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading…</p> : (
            <div className="space-y-3">
              {data?.evidence.length === 0 && <p className="text-muted-foreground text-sm">No evidence uploaded yet. Add your first row above, or click "Auto-fetch Census ACS" to seed verified Black population counts.</p>}
              {data?.evidence.map((e) => (
                <div key={e.id} className="border rounded-lg p-4 flex items-start justify-between gap-4" data-testid={`evidence-row-${e.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={e.confidence === "verified" ? "default" : "secondary"}>{e.confidence}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">{e.geographyKey}</span>
                      <span className="text-xs text-muted-foreground">{e.geographyType}</span>
                    </div>
                    <p className="font-semibold">{e.metricLabel}</p>
                    <p className="text-2xl font-bold text-primary mt-1" data-testid={`text-value-${e.id}`}>
                      {e.value.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{e.unit}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 flex-wrap">
                      <FileText className="h-3 w-3" />{e.sourceName}
                      {e.documentTitle && <span> — {e.documentTitle}</span>}
                      {e.pageReference && <span className="italic"> ({e.pageReference})</span>}
                      {e.asOfDate && <span> · as of {e.asOfDate}</span>}
                      {e.sourceUrl && <a href={e.sourceUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-primary hover:underline" data-testid={`link-source-${e.id}`}><ExternalLink className="h-3 w-3 ml-0.5" /></a>}
                    </p>
                    {e.methodology && <p className="text-xs text-muted-foreground italic mt-1">{e.methodology}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(e.id)} data-testid={`button-delete-${e.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
