import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertTriangle, CheckCircle2, FileSearch, Sparkles, Trash2, Loader2 } from "lucide-react";

type Item = {
  id: string;
  grantId: string;
  reqNumber: string;
  rfpSection: string;
  sectionType: "L" | "M" | "C" | "other";
  requirementVerbatim: string;
  requirementType: "shall" | "must" | "will" | "should" | "may" | "informational";
  scoringWeight: number | null;
  sourceKind: string;
  evidenceRef: string;
  workaroundProposed: string;
  answeringSectionName: string;
  status: "open" | "covered" | "workaround" | "gap";
  confidence: number;
};

type Audit = {
  ok: boolean;
  totalShallMust: number;
  covered: number;
  withWorkaround: number;
  gaps: Array<{ reqNumber: string; rfpSection: string; sectionType: string; requirementVerbatim: string; reason: string }>;
  sectionLNoncompliance: Array<{ reqNumber: string; rfpSection: string; requirementVerbatim: string; reason: string }>;
};

function statusBadge(status: Item["status"]) {
  const map = {
    open: "bg-slate-200 text-slate-800",
    covered: "bg-green-100 text-green-800",
    workaround: "bg-amber-100 text-amber-900",
    gap: "bg-red-100 text-red-800",
  } as const;
  return <Badge className={map[status]} data-testid={`badge-status-${status}`}>{status}</Badge>;
}

function sectionTypeBadge(t: Item["sectionType"]) {
  const map = {
    L: { c: "bg-red-100 text-red-900 border-red-300", label: "L — Instructions (format-critical)" },
    M: { c: "bg-indigo-100 text-indigo-900 border-indigo-300", label: "M — Evaluation (scored)" },
    C: { c: "bg-blue-100 text-blue-900 border-blue-300", label: "C — Scope" },
    other: { c: "bg-slate-100 text-slate-700 border-slate-300", label: "Other" },
  } as const;
  return <Badge variant="outline" className={map[t].c}>{map[t].label}</Badge>;
}

export default function RfpFidelityPage() {
  const params = useParams<{ grantId: string }>();
  const grantId = params.grantId;
  const { toast } = useToast();
  const [draftSectionsForAudit, setDraftSectionsForAudit] = useState("");

  const { data: meta } = useQuery<{ grant: { id: string; title: string; agency: string | null }; docs: { base: boolean; amendments: number; qa: number } }>({
    queryKey: ["/api/me/rfp-fidelity", grantId, "grant-meta"],
    enabled: !!grantId,
  });

  const { data: matrixData, isLoading } = useQuery<{ items: Item[] }>({
    queryKey: ["/api/me/rfp-fidelity", grantId],
    enabled: !!grantId,
  });
  const items = matrixData?.items ?? [];

  const [audit, setAudit] = useState<Audit | null>(null);

  const extractMut = useMutation({
    mutationFn: async (meetingNotes: string) => {
      const r = await apiRequest("POST", `/api/me/rfp-fidelity/${grantId}/extract`, { meetingNotes });
      return r.json();
    },
    onSuccess: (d) => {
      toast({ title: "Compliance matrix extracted", description: `${d.counts.total} items (L:${d.counts.L} M:${d.counts.M} C:${d.counts.C})` });
      queryClient.invalidateQueries({ queryKey: ["/api/me/rfp-fidelity", grantId] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Extract failed", description: e?.message ?? "Unknown error" }),
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Item> }) => {
      const r = await apiRequest("PATCH", `/api/me/rfp-fidelity/items/${id}`, patch);
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/me/rfp-fidelity", grantId] }),
    onError: (e: any) => toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "Unknown error" }),
  });

  const workaroundMut = useMutation({
    mutationFn: async ({ id, rfpAllowsTeaming }: { id: string; rfpAllowsTeaming: boolean | null }) => {
      const r = await apiRequest("POST", `/api/me/rfp-fidelity/items/${id}/workaround`, { rfpAllowsTeaming });
      return r.json();
    },
    onSuccess: (d, vars) => {
      if (d.workaround) {
        patchMut.mutate({ id: vars.id, patch: { workaroundProposed: d.workaround, status: "workaround" } });
        toast({ title: "Workaround proposed", description: d.workaround });
      } else {
        toast({ title: "No workaround needed", description: d.reasoning });
      }
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Workaround failed", description: e?.message ?? "Unknown error" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/me/rfp-fidelity/items/${id}`);
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/me/rfp-fidelity", grantId] }),
  });

  const auditMut = useMutation({
    mutationFn: async () => {
      const qs = encodeURIComponent(draftSectionsForAudit);
      const r = await apiRequest("GET", `/api/me/rfp-fidelity/${grantId}/audit?draftSections=${qs}`);
      return r.json();
    },
    onSuccess: (d: { audit: Audit }) => {
      setAudit(d.audit);
      toast({
        title: d.audit.ok ? "Audit passed" : "Audit failed",
        description: d.audit.ok
          ? `All ${d.audit.totalShallMust} shall/must items covered.`
          : `${d.audit.gaps.length} gap(s) — ${d.audit.sectionLNoncompliance.length} are Section L (pre-rejection risk).`,
        variant: d.audit.ok ? "default" : "destructive",
      });
    },
  });

  const grouped: Record<string, Item[]> = { L: [], M: [], C: [], other: [] };
  for (const it of items) (grouped[it.sectionType] ?? grouped.other).push(it);

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6" data-testid="rfp-fidelity-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">RFP Fidelity Engine</h1>
        <p className="text-muted-foreground">
          Write TO the reviewer, in THEIR language, in THEIR order, against THEIR scoring criteria. Reality is fixed; framing is ours.
        </p>
        {meta?.grant && (
          <div className="mt-2 text-sm" data-testid="text-grant-meta">
            <strong>{meta.grant.title}</strong> · {meta.grant.agency ?? "agency unknown"} · Docs on file: base {meta.docs.base ? "✓" : "✗"} · {meta.docs.amendments} amendment(s) · {meta.docs.qa} Q&A
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5" /> Step 1 — Extract Compliance Matrix</CardTitle>
          <CardDescription>Pulls every shall/must/will/should/may + page limits + format requirements verbatim from base RFP + amendments + Q&A + (optional) meeting notes. Source precedence: Q&A &gt; Amendment &gt; Base &gt; Meeting notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            id="meetingNotes"
            placeholder="(optional) paste pre-bid meeting notes, debrief notes, or call summaries — these are treated as binding clarifications"
            rows={3}
            data-testid="input-meeting-notes"
          />
          <Button
            onClick={() => {
              const el = document.getElementById("meetingNotes") as HTMLTextAreaElement | null;
              extractMut.mutate(el?.value ?? "");
            }}
            disabled={extractMut.isPending}
            data-testid="button-extract-matrix"
          >
            {extractMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSearch className="h-4 w-4 mr-2" />}
            Extract / Re-extract Matrix
          </Button>
        </CardContent>
      </Card>

      {(["L", "M", "C", "other"] as const).map((t) => grouped[t].length > 0 && (
        <Card key={t}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sectionTypeBadge(t)}
              <span className="text-sm text-muted-foreground">{grouped[t].length} item(s)</span>
            </CardTitle>
            {t === "L" && (
              <CardDescription className="text-red-700">
                ⚠ Section L noncompliance = rejection BEFORE Section M is scored. Confirm every format/page/font/attachment item.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {grouped[t].map((it) => (
              <div key={it.id} className="border rounded-md p-4 space-y-3" data-testid={`item-${it.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">{it.reqNumber}</Badge>
                      <Badge variant="secondary">{it.requirementType.toUpperCase()}</Badge>
                      {it.scoringWeight ? <Badge>{it.scoringWeight} pts</Badge> : null}
                      {statusBadge(it.status)}
                      <span className="text-xs text-muted-foreground">{it.rfpSection}</span>
                    </div>
                    <p className="mt-2 italic text-sm">"{it.requirementVerbatim}"</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(it.id)} data-testid={`button-delete-${it.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Evidence reference (our proof)</label>
                    <Input
                      defaultValue={it.evidenceRef}
                      onBlur={(e) => e.target.value !== it.evidenceRef && patchMut.mutate({ id: it.id, patch: { evidenceRef: e.target.value } })}
                      data-testid={`input-evidence-${it.id}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Answering draft section name</label>
                    <Input
                      defaultValue={it.answeringSectionName}
                      onBlur={(e) => e.target.value !== it.answeringSectionName && patchMut.mutate({ id: it.id, patch: { answeringSectionName: e.target.value } })}
                      data-testid={`input-section-${it.id}`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">Workaround (only if there's a real gap — hybrid posture)</label>
                    <Textarea
                      rows={2}
                      defaultValue={it.workaroundProposed}
                      onBlur={(e) => e.target.value !== it.workaroundProposed && patchMut.mutate({ id: it.id, patch: { workaroundProposed: e.target.value } })}
                      data-testid={`input-workaround-${it.id}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Status</label>
                    <Select value={it.status} onValueChange={(v) => patchMut.mutate({ id: it.id, patch: { status: v as Item["status"] } })}>
                      <SelectTrigger data-testid={`select-status-${it.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">open — not yet decided</SelectItem>
                        <SelectItem value="covered">covered — we meet this requirement</SelectItem>
                        <SelectItem value="workaround">workaround — covered via partner / phased approach</SelectItem>
                        <SelectItem value="gap">gap — disclose honestly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Confidence (0–100)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={it.confidence}
                      onBlur={(e) => {
                        const n = Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10)));
                        if (n !== it.confidence) patchMut.mutate({ id: it.id, patch: { confidence: n } });
                      }}
                      data-testid={`input-confidence-${it.id}`}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => workaroundMut.mutate({ id: it.id, rfpAllowsTeaming: null })}
                    disabled={workaroundMut.isPending}
                    data-testid={`button-workaround-${it.id}`}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> AI propose workaround (hybrid)
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No compliance matrix yet. Upload your base RFP (and any amendments / Q&A) via the RFP Writer page, then click <strong>Extract</strong> above.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Step 3 — Final Fidelity Audit</CardTitle>
          <CardDescription>Runs after you generate a draft. Confirms every shall/must has an answering section OR a workaround. Section L gaps are flagged separately as pre-rejection risk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="text-xs font-medium">Draft section names (one per line, OR separated by ||)</label>
          <Textarea
            rows={4}
            value={draftSectionsForAudit}
            onChange={(e) => setDraftSectionsForAudit(e.target.value.replaceAll("\n", "||"))}
            placeholder="A. Statement of Need||B. Project Approach||C. Past Performance||..."
            data-testid="input-audit-sections"
          />
          <Button onClick={() => auditMut.mutate()} disabled={auditMut.isPending} data-testid="button-run-audit">
            {auditMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Run Audit
          </Button>
          {audit && (
            <div className={`mt-4 p-4 rounded-md ${audit.ok ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"} border`} data-testid="audit-result">
              <p className="font-semibold flex items-center gap-2">
                {audit.ok ? <CheckCircle2 className="h-4 w-4 text-green-700" /> : <AlertTriangle className="h-4 w-4 text-red-700" />}
                {audit.ok ? "Submit-ready" : "Not yet submit-ready"}
              </p>
              <p className="text-sm mt-1">Mandatory items: {audit.totalShallMust} · Covered: {audit.covered} · Workaround: {audit.withWorkaround} · Gaps: {audit.gaps.length}</p>
              {audit.sectionLNoncompliance.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold text-red-800">⚠ Section L noncompliance (will be rejected before scoring):</p>
                  <ul className="list-disc ml-5 text-sm">
                    {audit.sectionLNoncompliance.map((g) => (
                      <li key={g.reqNumber}><strong>{g.reqNumber}</strong> — {g.requirementVerbatim} <em>({g.reason})</em></li>
                    ))}
                  </ul>
                </div>
              )}
              {audit.gaps.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">All gaps ({audit.gaps.length})</summary>
                  <ul className="list-disc ml-5 text-sm mt-2">
                    {audit.gaps.map((g) => (
                      <li key={g.reqNumber}><strong>{g.reqNumber}</strong> ({g.sectionType}) — {g.requirementVerbatim} <em>({g.reason})</em></li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
