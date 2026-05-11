import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Info, Check, X, HelpCircle, ExternalLink } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";
import { STATE_POLICIES, POLICY_DIMENSIONS, FEDERAL_FLOOR_NOTE, type PolicyFact, type StatePolicy } from "@/data/foster-youth/state-policies";

function StatusIcon({ p }: { p: PolicyFact }) {
  if (p.active === true) return <Check className="w-4 h-4 text-green-600" data-testid="icon-status-yes" />;
  if (p.active === false) return <X className="w-4 h-4 text-rose-600" data-testid="icon-status-no" />;
  return <HelpCircle className="w-4 h-4 text-muted-foreground" data-testid="icon-status-unknown" />;
}

function PolicyCell({ p }: { p: PolicyFact }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1"><StatusIcon p={p} /><span className="text-xs">{p.active === true ? "Yes" : p.active === false ? "No" : "Unverified"}</span></div>
      {p.statute && <div className="text-xs font-mono text-muted-foreground">{p.statute}</div>}
      {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
      {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline inline-flex items-center gap-1">Source <ExternalLink className="w-3 h-3" /></a>}
    </div>
  );
}

export default function PolicyComparisonPage() {
  const [a, setA] = useState("TX");
  const [b, setB] = useState("CA");
  const stateA = useMemo(() => STATE_POLICIES.find(s => s.code === a) as StatePolicy, [a]);
  const stateB = useMemo(() => STATE_POLICIES.find(s => s.code === b) as StatePolicy, [b]);

  // Aggregate "what's working" — count states with each statute-confirmed extension.
  const counts = useMemo(() => {
    return POLICY_DIMENSIONS.map(d => ({
      key: d.key,
      label: d.label,
      yes: STATE_POLICIES.filter(s => s[d.key].active === true).length,
      no: STATE_POLICIES.filter(s => s[d.key].active === false).length,
      unverified: STATE_POLICIES.filter(s => s[d.key].active === null).length,
    }));
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-foster-youth-policy-comparison">
      <CrisisStrip />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Scale className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">State Foster-Care Policy Comparison</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Non-adversarial. We surface what's working in each state so we can lift the floor everywhere. Every "Yes" cites a statute or official source. Every "Unverified" is honest about what we have not confirmed in this build — never invented.
        </p>
      </div>

      <Alert data-testid="alert-federal-floor">
        <Info className="h-4 w-4" />
        <AlertTitle>Federal floor applies to all 50 states + DC</AlertTitle>
        <AlertDescription>{FEDERAL_FLOOR_NOTE}</AlertDescription>
      </Alert>

      <Alert data-testid="alert-roadmap">
        <Info className="h-4 w-4" />
        <AlertTitle>What's live vs. roadmap (honest disclosure)</AlertTitle>
        <AlertDescription className="space-y-1">
          <div><strong>Live:</strong> verified state-statute facts for each policy dimension; per-state source URLs; "what's working across the country" rollup.</div>
          <div><strong>Roadmap:</strong> 30-year longitudinal causal model linking policy adoption → NYTD/AFCARS outcomes. Requires NDACAN restricted-access micro-data (≈18 month approval) and a peer-reviewed analytic plan. We will not pretend we have the model when we don't.</div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="compare" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compare" data-testid="tab-compare">Two-state comparison</TabsTrigger>
          <TabsTrigger value="rollup" data-testid="tab-rollup">What's working nationally</TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-matrix">All-state matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pick two states to compare</CardTitle>
              <CardDescription>Designed to lift learning from one to another, not to shame.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Select value={a} onValueChange={setA}>
                    <SelectTrigger data-testid="select-state-a"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATE_POLICIES.map(s => <SelectItem key={s.code} value={s.code} data-testid={`option-state-a-${s.code}`}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={b} onValueChange={setB}>
                    <SelectTrigger data-testid="select-state-b"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATE_POLICIES.map(s => <SelectItem key={s.code} value={s.code} data-testid={`option-state-b-${s.code}`}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border" data-testid="table-comparison">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Policy dimension</th>
                  <th className="p-2 text-left">{stateA.name}</th>
                  <th className="p-2 text-left">{stateB.name}</th>
                </tr>
              </thead>
              <tbody>
                {POLICY_DIMENSIONS.map(d => (
                  <tr key={d.key} className="border-t" data-testid={`row-dim-${d.key}`}>
                    <td className="p-2 align-top">
                      <div className="font-medium">{d.label}</div>
                      <div className="text-xs text-muted-foreground">{d.help}</div>
                    </td>
                    <td className="p-2 align-top"><PolicyCell p={stateA[d.key]} /></td>
                    <td className="p-2 align-top"><PolicyCell p={stateB[d.key]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="rollup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What's working across the country</CardTitle>
              <CardDescription>Counts of states with each policy currently active in our verified set. Honest about the unverified column.</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground"><tr><th className="py-1">Policy</th><th>Active</th><th>Not active</th><th>Unverified in this build</th></tr></thead>
                <tbody>
                  {counts.map(c => (
                    <tr key={c.key} className="border-t" data-testid={`rollup-${c.key}`}>
                      <td className="py-2">{c.label}</td>
                      <td><Badge variant="default">{c.yes}</Badge></td>
                      <td><Badge variant="outline">{c.no}</Badge></td>
                      <td><Badge variant="secondary">{c.unverified}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border" data-testid="table-all-states">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">State</th>
                  {POLICY_DIMENSIONS.map(d => <th key={d.key} className="p-2 text-left">{d.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {STATE_POLICIES.map(s => (
                  <tr key={s.code} className="border-t align-top" data-testid={`matrix-state-${s.code}`}>
                    <td className="p-2 font-medium whitespace-nowrap">{s.name} <span className="opacity-60">({s.code})</span></td>
                    {POLICY_DIMENSIONS.map(d => <td key={d.key} className="p-2"><StatusIcon p={s[d.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
