import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Wand2 } from "lucide-react";
import type { OutcomeReportNrrc, RecidivismBaseline } from "@shared/schema";

export default function OutcomeReportsNrrcPage() {
  useEffect(() => { document.title = "Funder Outcome Reports — TCAF"; }, []);
  const { toast } = useToast();
  const reports = useQuery<OutcomeReportNrrc[]>({ queryKey: ["/api/coalition/outcome-reports"] });
  const baselines = useQuery<RecidivismBaseline[]>({ queryKey: ["/api/coalition/baselines"] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reportName: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()} Outcome Report`,
    reportingPeriod: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
    funder: "BJA Second Chance Act",
    recidivismBaselineId: "",
  });

  const generate = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/outcome-reports/auto-generate", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/outcome-reports"] }); toast({ title: "Report generated from real data" }); setOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/outcome-reports/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coalition/outcome-reports"] }),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-7 w-7" /> Funder Outcome Reports</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Quarterly + annual reports auto-populated from your real RNR assessments, certifications, partners, and family-contact records — exactly what BJA SCA, NRRC, and most federal funders require.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-generate-report"><Wand2 className="h-4 w-4 mr-1" /> Auto-Generate Report</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Auto-Generate Funder Report</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Report Name</Label><Input value={form.reportName} onChange={e => setForm({ ...form, reportName: e.target.value })} data-testid="input-report-name" /></div>
              <div><Label>Reporting Period</Label><Input value={form.reportingPeriod} onChange={e => setForm({ ...form, reportingPeriod: e.target.value })} placeholder="Q1 2026, FY2026…" data-testid="input-report-period" /></div>
              <div><Label>Funder</Label><Input value={form.funder} onChange={e => setForm({ ...form, funder: e.target.value })} data-testid="input-report-funder" /></div>
              <div>
                <Label>Recidivism Baseline (optional)</Label>
                <Select value={form.recidivismBaselineId} onValueChange={v => setForm({ ...form, recidivismBaselineId: v })}>
                  <SelectTrigger data-testid="select-baseline"><SelectValue placeholder="Choose baseline…" /></SelectTrigger>
                  <SelectContent>
                    {(baselines.data || []).map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.jurisdiction} — {b.metricValue}% ({b.cohortYear})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/30">
                The report will pull live counts from RNR assessments, active certifications, coalition partners, and family-contact records, then write a draft narrative you can edit.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => generate.mutate()} disabled={generate.isPending} data-testid="button-confirm-generate">
                {generate.isPending ? "Generating…" : "Generate from Real Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {reports.isLoading ? <div>Loading…</div>
        : (reports.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No outcome reports yet. Click "Auto-Generate Report" to draft one from your live data.</div>
        : <div className="space-y-4">
          {(reports.data || []).map(r => (
            <Card key={r.id} data-testid={`row-report-${r.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{r.reportName}</CardTitle>
                    <CardDescription>{r.reportingPeriod} · Funder: {r.funder} · <Badge variant={r.status === "final" ? "default" : "secondary"} className="ml-1">{r.status}</Badge></CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)} data-testid={`button-delete-report-${r.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <Stat label="Participants" value={r.participantsServed || 0} />
                  <Stat label="RNR Done" value={r.rnrAssessmentsCompleted || 0} />
                  <Stat label="CBI Referrals" value={r.cbiReferrals || 0} />
                  <Stat label="Employment" value={r.employmentPlacements || 0} />
                  <Stat label="Housing" value={r.housingPlacements || 0} />
                </div>
                {r.recidivismRate != null && (
                  <div className="text-sm"><strong>Local recidivism baseline:</strong> {r.recidivismRate}%</div>
                )}
                {r.narrativeSummary && (
                  <div className="border-l-4 border-primary pl-3 text-sm whitespace-pre-wrap">{r.narrativeSummary}</div>
                )}
                {r.successes && <div className="text-sm"><strong>Successes:</strong> {r.successes}</div>}
                {r.challenges && <div className="text-sm"><strong>Challenges:</strong> {r.challenges}</div>}
                {r.generatedFromData && <Badge variant="outline" className="text-xs">Auto-generated from live data</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-2">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
