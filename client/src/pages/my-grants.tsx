import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { OpportunityManager } from "@/components/opportunity-manager";
import { Trophy, FileText, ExternalLink, Trash2, TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";
import { useState } from "react";

type Tracking = { id: string; grantId: string; orgId: string; status: string; notes?: string | null; awardAmount?: number | null; appliedAt?: string | null; decidedAt?: string | null };
type Grant = { id: string; title: string; agency?: string | null; fundingAmount?: string | null; deadline?: string | null; sourceUrl?: string | null };
type TrackedRow = { tracking: Tracking; grant: Grant };
type WinRate = { summary: { totalTracked: number; submitted: number; awarded: number; declined: number; pending: number; awardAmount: number; winRatePct: number } };

const STATUS_OPTIONS = ["interested","pursuing","drafting","submitted","awarded","declined","withdrawn"];

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "awarded") return "default";
  if (status === "declined" || status === "withdrawn") return "destructive";
  if (status === "submitted") return "secondary";
  return "outline";
}

export default function MyGrantsPage() {
  const { toast } = useToast();
  const { data: tracked, isLoading } = useQuery<{ tracked: TrackedRow[] }>({ queryKey: ["/api/me/grants/tracked"] });
  const { data: winRate } = useQuery<WinRate>({ queryKey: ["/api/me/grants/win-rate"] });
  const [editing, setEditing] = useState<Record<string, { awardAmount?: string; notes?: string }>>({});

  const updateStatus = useMutation({
    mutationFn: async (vars: { grantId: string; status: string; awardAmount?: number; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/me/grants/${vars.grantId}/track`, vars);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/tracked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/win-rate"] });
      toast({ title: "Updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const untrack = useMutation({
    mutationFn: async (grantId: string) => apiRequest("DELETE", `/api/me/grants/${grantId}/track`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/tracked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/win-rate"] });
      toast({ title: "Removed from tracker" });
    },
  });

  const s = winRate?.summary;

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">My grants</h1>
          <p className="text-muted-foreground mt-1">Track every grant you're pursuing. Mark wins and losses to build your real win rate.</p>
        </div>
        <Link href="/grants"><Button data-testid="button-browse-grants">Browse grants</Button></Link>
      </div>

      <OpportunityManager />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold" data-testid="stat-total">{s?.totalTracked ?? 0}</div><div className="text-xs text-muted-foreground">Tracked</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold" data-testid="stat-pending">{s?.pending ?? 0}</div><div className="text-xs text-muted-foreground">In progress</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1" data-testid="stat-awarded"><Trophy className="w-5 h-5" />{s?.awarded ?? 0}</div><div className="text-xs text-muted-foreground">Awarded</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold flex items-center gap-1" data-testid="stat-amount"><DollarSign className="w-5 h-5" />{((s?.awardAmount ?? 0) / 1000).toFixed(0)}K</div><div className="text-xs text-muted-foreground">Total awarded</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold flex items-center gap-1" data-testid="stat-winrate"><TrendingUp className="w-5 h-5" />{s?.winRatePct ?? 0}%</div><div className="text-xs text-muted-foreground">Win rate (of submitted)</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tracked grants</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : !tracked || tracked.tracked.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No grants tracked yet.</p>
              <Link href="/grants"><Button data-testid="button-find-grants">Find grants that fit</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tracked.tracked.map(({ tracking, grant }) => {
                const edit = editing[tracking.grantId] || {};
                return (
                  <div key={tracking.id} className="border rounded-lg p-4" data-testid={`row-tracked-${tracking.grantId}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className="font-semibold flex-1">{grant.title}</h3>
                          <Badge variant={statusVariant(tracking.status)} data-testid={`badge-status-${tracking.grantId}`}>{tracking.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {grant.agency} · {grant.fundingAmount ?? "amount unspecified"}
                          {grant.deadline && ` · due ${new Date(grant.deadline).toLocaleDateString()}`}
                        </div>
                        {tracking.notes && <div className="text-sm mt-2 italic">{tracking.notes}</div>}
                        {tracking.awardAmount ? <div className="text-sm mt-1 text-green-600 dark:text-green-400 font-semibold">Awarded: ${tracking.awardAmount.toLocaleString()}</div> : null}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {grant.sourceUrl && <a href={grant.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Source</a>}
                        <Link href={`/grant-narrative?grantId=${grant.id}`}><Button size="sm" variant="outline" data-testid={`button-write-${grant.id}`}>Write draft</Button></Link>
                        {tracking.status === "awarded" && (
                          <Link href="/won-proposals"><Button size="sm" variant="secondary" data-testid={`button-save-winning-${grant.id}`}><Trophy className="w-3 h-3 mr-1" />Save winning draft</Button></Link>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => untrack.mutate(grant.id)} data-testid={`button-remove-${grant.id}`}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="text-xs text-muted-foreground">Status</label>
                        <Select value={tracking.status} onValueChange={status => updateStatus.mutate({ grantId: grant.id, status })}>
                          <SelectTrigger data-testid={`select-status-${grant.id}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Awarded $ (if won)</label>
                        <Input type="number" placeholder="0" value={edit.awardAmount ?? (tracking.awardAmount ?? "")} onChange={e => setEditing({...editing, [tracking.grantId]: { ...edit, awardAmount: e.target.value }})} data-testid={`input-amount-${grant.id}`} />
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ grantId: grant.id, status: tracking.status, awardAmount: edit.awardAmount ? Number(edit.awardAmount) : undefined, notes: edit.notes })} data-testid={`button-save-${grant.id}`}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
