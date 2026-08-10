import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, CheckCircle2, BookOpen, MapPin, Calendar, Activity, ArrowRight, Target, ExternalLink } from "lucide-react";
import { Link } from "wouter";

function RiskScoreBadge({ score }: { score: number }) {
  const tier = score >= 70 ? { label: "High", color: "bg-red-500/15 text-red-700 dark:text-red-300" }
    : score >= 50 ? { label: "Moderate", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" }
    : { label: "Low", color: "bg-green-500/15 text-green-700 dark:text-green-300" };
  return (
    <div className={`rounded-md px-3 py-2 ${tier.color}`} data-testid="risk-score-badge">
      <p className="text-xs uppercase tracking-wide opacity-80">Overall Risk</p>
      <p className="text-2xl font-bold">{score} <span className="text-sm font-normal opacity-80">/ 100</span></p>
      <p className="text-xs">{tier.label} tier</p>
    </div>
  );
}

export default function CaseManagerView() {
  const chainQuery = useQuery<any>({
    // Use the canonical fetched URL as the query key so cache reads/writes and
    // any external invalidations key on the exact endpoint being fetched
    // (previously the segmented key did not match the URL string).
    queryKey: ["/api/case-manager/demo/risk-chain"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/case-manager/demo/risk-chain");
      return res.json();
    },
  });

  if (chainQuery.isLoading) return <div className="p-6"><p className="text-sm text-muted-foreground">Loading risk profile...</p></div>;
  if (!chainQuery.data) return <div className="p-6"><p className="text-sm text-muted-foreground">No data.</p></div>;

  const { profile, riskSnapshot, complianceEvents } = chainQuery.data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="page-case-manager">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7" /> Case Manager / Probation Officer View</h1>
          <p className="text-sm text-muted-foreground">Same profile, same evidence the resident sees — lens shifted to compliance and outcomes. No silos, no duplicate intakes, no waiting for records to catch up.</p>
        </div>
        <Link href={`/resident-journey`}>
          <Button variant="outline" className="gap-2" data-testid="link-resident-view">Resident View <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>

      <Card data-testid="card-resident-summary">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-2xl font-bold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">Age {profile.age} · {profile.location.city}, {profile.location.state} {profile.location.zip}</p>
              <p className="text-sm mt-1"><strong>Supervision:</strong> {profile.supervisionStatus}</p>
              <p className="text-sm"><strong>Released:</strong> {profile.releaseDate}</p>
            </div>
            {riskSnapshot && <RiskScoreBadge score={riskSnapshot.overallRiskScore || 0} />}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-risk-factors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><AlertTriangle className="h-5 w-5" /> Risk Factors</CardTitle>
            <CardDescription>What the ChainWeb evidence flags as elevated.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(riskSnapshot?.riskFactors || []).map((rf: any, i: number) => (
                <li key={i} className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3" data-testid={`risk-${i}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{rf.factor}</p>
                    <Badge variant="outline" className="text-xs shrink-0">{rf.severity}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card data-testid="card-protective-factors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircle2 className="h-5 w-5" /> Protective Factors</CardTitle>
            <CardDescription>What's working in this resident's favor — strengthen these.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(riskSnapshot?.protectiveFactors || []).map((pf: any, i: number) => (
                <li key={i} className="rounded-md border border-green-500/30 bg-green-500/5 p-3" data-testid={`protective-${i}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{pf.factor}</p>
                    <Badge variant="outline" className="text-xs shrink-0">{pf.strength}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recommended-interventions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Recommended Next Interventions</CardTitle>
          <CardDescription>Ordered by impact on this resident's specific factor profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {(riskSnapshot?.recommendedInterventions || []).map((rec: any, i: number) => (
              <li key={i} className="flex gap-3" data-testid={`intervention-${i}`}>
                <div className="rounded-full bg-primary/10 h-7 w-7 flex items-center justify-center shrink-0 text-sm font-bold">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="font-medium text-sm">{rec.intervention}</p>
                    <Badge variant={rec.priority === "highest" ? "destructive" : "outline"} className="text-xs">{rec.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.rationale}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card data-testid="card-chainweb-citations">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> ChainWeb — Primary Source Evidence</CardTitle>
          <CardDescription>Every risk and protective factor above traces back to one of these. No assertion without a citation.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(riskSnapshot?.chainwebCitations || []).map((c: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" data-testid={`chainweb-citation-${i}`}>
                <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <a href={c.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{c.source}</a>
                  <p className="text-xs text-muted-foreground">{c.relevance}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card data-testid="card-compliance-events">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Compliance Activity</CardTitle>
          <CardDescription>Reentry-domain events from the resident's journey. Updated automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          {complianceEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No compliance events yet.</p>
          ) : (
            <ol className="space-y-2">
              {complianceEvents.map((e: any) => (
                <li key={e.id} className="flex items-start justify-between gap-2 border-b last:border-0 pb-2 last:pb-0" data-testid={`compliance-${e.id}`}>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{e.eventTitle}</p>
                      {e.stateAtEvent && <Badge variant="outline" className="text-xs mt-1">{e.stateAtEvent}</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.occurredAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
