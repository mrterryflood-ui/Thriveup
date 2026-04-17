import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { FileText, Presentation, FileBarChart, Radio, Link2, AlertTriangle, CheckCircle2, Circle, Download, RefreshCw, Play, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DocReport = {
  doc: {
    id: string;
    filename: string;
    fullPath: string;
    kind: string;
    format: string;
    audience: string;
    counties: string[];
    sizeBytes: number;
    modifiedAt: string;
    mentionsMetricKeys: string[];
    mentionsPartners: string[];
    mentionsGrants: string[];
    chainWebSteps: string[];
    livePullsFromApi: boolean;
    buildScript?: string;
  };
  connection: {
    status: "fully-connected" | "partially-connected" | "static";
    score: number;
    evidenceMatched: Array<{ metricKey: string; metricLabel: string; value: number | null; unit: string | null; confidence: string | null; asOfDate: string | null; sourceName: string | null; county: string }>;
    partnersMatched: Array<{ id: string; name: string; county: string; mouStatus: string | null }>;
    grantsMatched: Array<{ id: string; funder: string; program: string; amount: number | null; status: string | null }>;
    chainWebStepsMatched: string[];
    livePullsFromApi: boolean;
    buildScript?: string;
    issues: string[];
  };
};

type DocsResponse = {
  ok: boolean;
  generatedAt: string;
  summary: {
    total: number;
    fullyConnected: number;
    partiallyConnected: number;
    static: number;
    liveFromApi: number;
    avgScore: number;
  };
  docs: DocReport[];
};

function iconForKind(kind: string) {
  if (kind === "deck") return <Presentation className="h-4 w-4" />;
  if (kind === "analysis" || kind === "brief") return <FileBarChart className="h-4 w-4" />;
  if (kind === "loi" || kind === "rfp" || kind === "narrative") return <FileText className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function statusBadge(s: DocReport["connection"]["status"]) {
  if (s === "fully-connected")
    return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid={`badge-status-${s}`}><CheckCircle2 className="h-3 w-3 mr-1" />Fully connected</Badge>;
  if (s === "partially-connected")
    return <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid={`badge-status-${s}`}><Link2 className="h-3 w-3 mr-1" />Partially connected</Badge>;
  return <Badge className="bg-slate-500 hover:bg-slate-600 text-white" data-testid={`badge-status-${s}`}><Circle className="h-3 w-3 mr-1" />Static</Badge>;
}

export default function CorridorDocsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useQuery<DocsResponse>({
    queryKey: ["/api/corridor/docs"],
  });

  const rebuild = useMutation({
    mutationFn: () => apiRequest("POST", "/api/corridor/docs/rebuild"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/docs"] });
      toast({ title: "Rescanned", description: "Document registry refreshed from attached_assets/." });
    },
    onError: (err: any) => toast({ title: "Rescan failed", description: String(err?.message ?? err), variant: "destructive" }),
  });

  const regenerate = useMutation<any>({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/corridor/docs/regenerate");
      return r;
    },
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/docs"] });
      const okCount = (r?.results ?? []).filter((x: any) => x.ok).length;
      const total = (r?.results ?? []).length;
      toast({ title: "Decks regenerated", description: `${okCount}/${total} build scripts ran against live data. PPTX + DOCX updated.` });
    },
    onError: (err: any) => toast({ title: "Regenerate failed", description: String(err?.message ?? err), variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">I-35 Corridor · Connected Documents</div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Austin + Waco Documents</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Every Austin/Waco document in the system — decks, briefs, LOIs, RFPs, assessments — cross-referenced against the
              live chain-web evidence, partner directory, and grant pipeline. Green = fully wired to live data.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/corridor">
              <Button variant="outline" size="sm" data-testid="link-back-corridor">← Corridor</Button>
            </Link>
            <Link href="/corridor/docs/live">
              <Button size="sm" variant="default" data-testid="link-live-view">
                <ExternalLink className="h-4 w-4 mr-2" /> Live document view
              </Button>
            </Link>
            <Button size="sm" onClick={() => regenerate.mutate()} disabled={regenerate.isPending} data-testid="button-regenerate">
              <Play className={`h-4 w-4 mr-2 ${regenerate.isPending ? "animate-pulse" : ""}`} />
              {regenerate.isPending ? "Regenerating…" : "Regenerate PPTX + DOCX"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => rebuild.mutate()} disabled={rebuild.isPending} data-testid="button-rescan">
              <RefreshCw className={`h-4 w-4 mr-2 ${rebuild.isPending ? "animate-spin" : ""}`} />
              Rescan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading} data-testid="button-refresh">
              <Radio className="h-4 w-4 mr-2" />
              Refresh status
            </Button>
          </div>
        </div>

        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Documents</div><div className="text-2xl font-bold" data-testid="text-summary-total">{data.summary.total}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Fully connected</div><div className="text-2xl font-bold text-emerald-600" data-testid="text-summary-fully">{data.summary.fullyConnected}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Partial</div><div className="text-2xl font-bold text-amber-600" data-testid="text-summary-partial">{data.summary.partiallyConnected}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Static</div><div className="text-2xl font-bold text-slate-500" data-testid="text-summary-static">{data.summary.static}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Avg connection score</div><div className="text-2xl font-bold" data-testid="text-summary-score">{data.summary.avgScore}</div></CardContent></Card>
          </div>
        )}

        {isLoading && <div className="text-center py-16 text-muted-foreground">Loading documents…</div>}
        {isError && <div className="text-center py-16 text-destructive">Failed to load documents.</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data?.docs?.map((r) => (
            <Card key={r.doc.id} data-testid={`card-doc-${r.doc.id}`} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-1">{iconForKind(r.doc.kind)}</div>
                    <div className="min-w-0">
                      <CardTitle className="text-base break-words" data-testid={`text-doc-filename-${r.doc.id}`}>{r.doc.filename}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline">{r.doc.kind}</Badge>
                        <Badge variant="outline">{r.doc.format}</Badge>
                        <Badge variant="outline">{r.doc.audience}</Badge>
                        {r.doc.counties.includes("waco") && <Badge variant="secondary">Waco</Badge>}
                        {r.doc.counties.includes("austin") && <Badge variant="secondary">Austin</Badge>}
                        {r.doc.livePullsFromApi && <Badge className="bg-indigo-600 text-white"><Radio className="h-3 w-3 mr-1" />Live from API</Badge>}
                      </div>
                    </div>
                  </div>
                  {statusBadge(r.connection.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Connection strength</span>
                    <span data-testid={`text-score-${r.doc.id}`}>{r.connection.score}/100</span>
                  </div>
                  <Progress value={r.connection.score} />
                </div>

                {r.connection.evidenceMatched.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Live evidence cited ({r.connection.evidenceMatched.length})
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {r.connection.evidenceMatched.slice(0, 8).map((e, i) => (
                        <div key={i} className="text-xs flex items-center justify-between gap-2 border-l-2 border-emerald-500 pl-2 py-0.5" data-testid={`text-evidence-${r.doc.id}-${i}`}>
                          <span className="truncate">
                            <Badge variant="outline" className="mr-1 text-[10px] px-1 py-0">{e.county}</Badge>
                            {e.metricLabel}
                          </span>
                          <span className="font-mono whitespace-nowrap">
                            {e.value != null ? e.value.toLocaleString() : "—"}{e.unit ? ` ${e.unit}` : ""}
                          </span>
                        </div>
                      ))}
                      {r.connection.evidenceMatched.length > 8 && (
                        <div className="text-xs text-muted-foreground">+ {r.connection.evidenceMatched.length - 8} more</div>
                      )}
                    </div>
                  </div>
                )}

                {r.connection.chainWebStepsMatched.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Chain-web steps backing this doc</div>
                    <div className="flex flex-wrap gap-1">
                      {r.connection.chainWebStepsMatched.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]" data-testid={`badge-step-${r.doc.id}-${s}`}>{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {r.connection.partnersMatched.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Partners ({r.connection.partnersMatched.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {r.connection.partnersMatched.slice(0, 6).map((p) => (
                        <Badge key={p.id} variant="secondary" className="text-[10px]" data-testid={`badge-partner-${r.doc.id}-${p.id}`}>{p.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {r.connection.grantsMatched.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Grants ({r.connection.grantsMatched.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {r.connection.grantsMatched.slice(0, 6).map((g) => (
                        <Badge key={g.id} className="text-[10px] bg-violet-600 text-white" data-testid={`badge-grant-${r.doc.id}-${g.id}`}>
                          {g.funder}{g.program ? ` · ${g.program}` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {r.connection.issues.length > 0 && (
                  <div className="rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      <AlertTriangle className="h-3 w-3" /> Connection issues
                    </div>
                    <ul className="text-xs text-amber-900 dark:text-amber-100 list-disc ml-4 space-y-0.5">
                      {r.connection.issues.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>{(r.doc.sizeBytes / 1024).toFixed(0)} KB · updated {new Date(r.doc.modifiedAt).toLocaleDateString()}</span>
                  <a href={`/${r.doc.fullPath}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline" data-testid={`link-download-${r.doc.id}`}>
                    <Download className="h-3 w-3" /> open
                  </a>
                </div>

                {r.doc.buildScript && (
                  <div className="text-[11px] text-muted-foreground">
                    Build: <code className="bg-muted px-1 rounded">{r.doc.buildScript}</code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
