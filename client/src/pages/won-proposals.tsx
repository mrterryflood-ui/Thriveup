import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Save, Trash2, Sparkles, Plus } from "lucide-react";

type Win = {
  id: string;
  orgId: string;
  grantId?: string | null;
  funderName: string;
  funderType: string;
  dollarAmount?: number | null;
  projectTitle?: string | null;
  draftText: string;
  awardedAt?: string | null;
  createdAt: string;
};

const FUNDER_TYPES = ["government", "foundation", "corporate", "state", "local"];

export default function WonProposalsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ wins: Win[] }>({ queryKey: ["/api/me/won-proposals"] });
  const [edits, setEdits] = useState<Record<string, Partial<Win>>>({});
  const [newWin, setNewWin] = useState({ funderName: "", funderType: "government", projectTitle: "", dollarAmount: "", draftText: "" });
  const [showNew, setShowNew] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/me/won-proposals", {
        ...newWin,
        dollarAmount: newWin.dollarAmount ? Number(newWin.dollarAmount) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/won-proposals"] });
      setShowNew(false);
      setNewWin({ funderName: "", funderType: "government", projectTitle: "", dollarAmount: "", draftText: "" });
      toast({ title: "Added", description: "Future drafts will mirror this winning voice." });
    },
    onError: (e: Error) => toast({ title: "Add failed", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<Win> }) => {
      const res = await apiRequest("PATCH", `/api/me/won-proposals/${vars.id}`, vars.patch);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/won-proposals"] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/me/won-proposals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/won-proposals"] });
      toast({ title: "Removed" });
    },
  });

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title"><Trophy className="w-7 h-7 text-yellow-500" />Winning Proposals Library</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">Save your winning grant drafts here. When you generate a new RFP draft, the system retrieves your top 3 most relevant wins (same funder, similar dollar tier) and tells the AI to mirror your voice — the cadence, framing, and evidence patterns that have worked for you before.</p>
        </div>
        <Button onClick={() => setShowNew(s => !s)} data-testid="button-add-win"><Plus className="w-4 h-4 mr-1" />Add a winning proposal</Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle>Add a winning proposal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Funder name *</label>
                <Input value={newWin.funderName} onChange={e => setNewWin({ ...newWin, funderName: e.target.value })} placeholder="e.g. St. David's Foundation" data-testid="input-new-funder" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Funder type</label>
                <Select value={newWin.funderType} onValueChange={v => setNewWin({ ...newWin, funderType: v })}>
                  <SelectTrigger data-testid="select-new-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{FUNDER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Project title</label>
                <Input value={newWin.projectTitle} onChange={e => setNewWin({ ...newWin, projectTitle: e.target.value })} placeholder="e.g. Pflugerville Holistic Services" data-testid="input-new-title" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Awarded amount ($)</label>
                <Input type="number" value={newWin.dollarAmount} onChange={e => setNewWin({ ...newWin, dollarAmount: e.target.value })} placeholder="e.g. 75000" data-testid="input-new-amount" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Winning draft text *</label>
              <Textarea rows={10} value={newWin.draftText} onChange={e => setNewWin({ ...newWin, draftText: e.target.value })} placeholder="Paste the narrative that won. The more authentic-voice text you provide, the better the AI can mirror you." data-testid="textarea-new-draft" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => create.mutate()} disabled={!newWin.funderName || !newWin.draftText || create.isPending} data-testid="button-save-new"><Save className="w-4 h-4 mr-1" />{create.isPending ? "Saving…" : "Save winning proposal"}</Button>
              <Button variant="ghost" onClick={() => setShowNew(false)} data-testid="button-cancel-new">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Your winning library ({data?.wins.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Loading…</div> : (data?.wins ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No winning proposals saved yet. When you mark a tracked grant as "awarded" in My Grants, we'll create a stub for you to fill in.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.wins ?? []).map(w => {
                const e = edits[w.id] ?? {};
                const draftText = e.draftText ?? w.draftText;
                const isStub = w.draftText.startsWith("[Paste your winning");
                return (
                  <div key={w.id} className="border rounded-lg p-4 space-y-3" data-testid={`row-win-${w.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{w.projectTitle || "Untitled project"}</h3>
                          <Badge variant="outline">{w.funderType}</Badge>
                          {isStub && <Badge variant="destructive">draft text missing</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {w.funderName}{w.dollarAmount ? ` · $${w.dollarAmount.toLocaleString()}` : ""}{w.awardedAt ? ` · awarded ${new Date(w.awardedAt).toISOString().slice(0,7)}` : ""}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(w.id)} data-testid={`button-remove-win-${w.id}`}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <Textarea rows={isStub ? 6 : 4} value={draftText} onChange={ev => setEdits({ ...edits, [w.id]: { ...e, draftText: ev.target.value } })} className="font-mono text-xs" data-testid={`textarea-win-${w.id}`} />
                    {(e.draftText !== undefined && e.draftText !== w.draftText) && (
                      <Button size="sm" onClick={() => update.mutate({ id: w.id, patch: { draftText: e.draftText! } })} disabled={update.isPending} data-testid={`button-save-win-${w.id}`}><Save className="w-4 h-4 mr-1" />Save</Button>
                    )}
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
