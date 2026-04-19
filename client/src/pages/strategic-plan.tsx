import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Trash2 } from "lucide-react";
import type { StrategicPlan } from "@shared/schema";

interface Goal { goal: string; measure: string; target: string; actual: string; status: string }

export default function StrategicPlanPage() {
  useEffect(() => { document.title = "Strategic Plan — TCAF"; }, []);
  const { toast } = useToast();
  const q = useQuery<StrategicPlan[]>({ queryKey: ["/api/coalition/strategic-plans"] });
  const [open, setOpen] = useState(false);
  const empty = {
    planName: "TCAF Reentry Strategic Plan", planYear: new Date().getFullYear(),
    visionStatement: "Eliminate the recidivism-recurrence cycle in the I-35 corridor through evidence-based, lived-experience-led collaboration.",
    missionStatement: "TCAF coordinates a multi-platform reentry ecosystem aligning workforce, behavioral health, housing, and family-unification services with NRRC and BJA SCA standards.",
    goals: [
      { goal: "Reduce 3-year recidivism in target counties by 15%", measure: "TDCJ + county reincarceration rate", target: "15% reduction", actual: "baseline pending", status: "in_progress" },
      { goal: "Certify 10 staff in evidence-based curricula", measure: "Active certifications", target: "10", actual: "0", status: "in_progress" },
      { goal: "Sign MOUs with 5 correctional partners", measure: "Signed MOUs", target: "5", actual: "0", status: "in_progress" },
    ] as Goal[],
    approvedDate: "", approvedBy: "", status: "draft",
  };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/coalition/strategic-plans", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coalition/strategic-plans"] }); toast({ title: "Strategic plan saved" }); setOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/coalition/strategic-plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coalition/strategic-plans"] }),
  });

  const updateGoal = (i: number, key: keyof Goal, val: string) => {
    const goals = [...form.goals]; goals[i] = { ...goals[i], [key]: val };
    setForm({ ...form, goals });
  };
  const addGoal = () => setForm({ ...form, goals: [...form.goals, { goal: "", measure: "", target: "", actual: "", status: "in_progress" }] });
  const removeGoal = (i: number) => setForm({ ...form, goals: form.goals.filter((_, idx) => idx !== i) });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="h-7 w-7" /> Coalition Strategic Plan</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            NRRC-GOV-02 requires a strategic plan with measurable goals + performance measures. Build one here that maps directly to your real performance data.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-new-plan"><Plus className="h-4 w-4 mr-1" /> New Plan</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Strategic Plan Builder</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><Label>Plan Name</Label><Input value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} data-testid="input-plan-name" /></div>
                <div><Label>Year</Label><Input type="number" value={form.planYear} onChange={e => setForm({ ...form, planYear: Number(e.target.value) })} data-testid="input-plan-year" /></div>
              </div>
              <div><Label>Vision Statement</Label><Textarea value={form.visionStatement} onChange={e => setForm({ ...form, visionStatement: e.target.value })} data-testid="input-vision" /></div>
              <div><Label>Mission Statement</Label><Textarea value={form.missionStatement} onChange={e => setForm({ ...form, missionStatement: e.target.value })} data-testid="input-mission" /></div>
              <div className="space-y-2 border rounded p-3 bg-muted/30">
                <div className="flex items-center justify-between"><Label className="font-semibold">Goals + Performance Measures</Label>
                  <Button size="sm" variant="outline" onClick={addGoal} data-testid="button-add-goal"><Plus className="h-3 w-3 mr-1" /> Add Goal</Button>
                </div>
                {form.goals.map((g, i) => (
                  <div key={i} className="border rounded p-2 space-y-1.5 bg-background" data-testid={`form-goal-${i}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">G{i + 1}</span>
                      <Input className="flex-1" placeholder="Goal statement" value={g.goal} onChange={e => updateGoal(i, "goal", e.target.value)} data-testid={`input-goal-${i}`} />
                      <Button size="icon" variant="ghost" onClick={() => removeGoal(i)} data-testid={`button-remove-goal-${i}`}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <Input placeholder="Measure" value={g.measure} onChange={e => updateGoal(i, "measure", e.target.value)} data-testid={`input-goal-measure-${i}`} />
                      <Input placeholder="Target" value={g.target} onChange={e => updateGoal(i, "target", e.target.value)} data-testid={`input-goal-target-${i}`} />
                      <Input placeholder="Actual" value={g.actual} onChange={e => updateGoal(i, "actual", e.target.value)} data-testid={`input-goal-actual-${i}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Approved Date</Label><Input type="date" value={form.approvedDate} onChange={e => setForm({ ...form, approvedDate: e.target.value })} data-testid="input-approved-date" /></div>
                <div><Label>Approved By</Label><Input value={form.approvedBy} onChange={e => setForm({ ...form, approvedBy: e.target.value })} data-testid="input-approved-by" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={create.isPending} data-testid="button-save-plan">{create.isPending ? "Saving…" : "Save Plan"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? <div>Loading…</div>
        : (q.data || []).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No strategic plans yet. Click "New Plan" to start with a 3-goal default; edit and approve when ready.</div>
        : <div className="space-y-4">
          {(q.data || []).map(p => {
            const goals = (p.goals as unknown as Goal[]) || [];
            return (
              <Card key={p.id} data-testid={`row-plan-${p.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{p.planName} <Badge variant="outline" className="ml-2">{p.planYear}</Badge> <Badge variant={p.status === "active" ? "default" : "secondary"} className="ml-1">{p.status}</Badge></CardTitle>
                      {p.approvedBy && <CardDescription>Approved {p.approvedDate} by {p.approvedBy}</CardDescription>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)} data-testid={`button-delete-plan-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.visionStatement && <div className="text-sm"><strong>Vision:</strong> {p.visionStatement}</div>}
                  {p.missionStatement && <div className="text-sm"><strong>Mission:</strong> {p.missionStatement}</div>}
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Goals + Performance Measures</div>
                    {goals.map((g, i) => (
                      <div key={i} className="border rounded p-2 text-sm" data-testid={`view-goal-${p.id}-${i}`}>
                        <div className="font-medium">G{i + 1}. {g.goal}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Measure:</strong> {g.measure} · <strong>Target:</strong> {g.target} · <strong>Actual:</strong> {g.actual} · <Badge variant="outline" className="text-xs ml-1">{g.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}
