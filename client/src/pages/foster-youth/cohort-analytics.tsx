import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, BarChart3, Sparkles, Users, FileText, MapPin, Activity } from "lucide-react";

interface AnalyticsResponse {
  windowDays: number;
  totals: { intakes: number; analyzed: number; documents: number };
  byState: Array<{ state_code: string; n: number }>;
  byEvent: Array<{ event_type: string; n: number }>;
  recentIntakes: Array<{
    id: string; firstName: string | null; preferredName: string | null;
    age: number | null; stateCode: string | null;
    aiAnalyzedAt: string | null; aiSummary: string | null;
    createdAt: string;
  }>;
}

export default function FosterYouthCohortAnalyticsPage() {
  const [days, setDays] = useState("30");
  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/foster-youth/cohort-analytics", days],
    queryFn: async () => {
      const r = await fetch(`/api/foster-youth/cohort-analytics?days=${days}`);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });

  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-cohort-analytics">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 shadow-md">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2">Admin · cohort analytics</Badge>
            <h1 className="text-3xl font-bold" data-testid="text-analytics-title">Foster Youth cohort — data story</h1>
            <p className="text-muted-foreground">Every wizard step, document upload, and AI analysis tagged <code>cohort=foster-youth</code>.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm">Window:</span>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32" data-testid="select-window-trigger"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertTitle>Could not load analytics</AlertTitle>
            <AlertDescription>{(error as Error).message}. (Admin/case-manager role required.)</AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card data-testid="card-stat-intakes">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Intakes</CardTitle>
                </CardHeader>
                <CardContent><div className="text-3xl font-bold" data-testid="stat-intakes">{data.totals.intakes}</div></CardContent>
              </Card>
              <Card data-testid="card-stat-analyzed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Sparkles className="h-4 w-4" /> AI-analyzed</CardTitle>
                </CardHeader>
                <CardContent><div className="text-3xl font-bold" data-testid="stat-analyzed">{data.totals.analyzed}</div></CardContent>
              </Card>
              <Card data-testid="card-stat-documents">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" /> Documents</CardTitle>
                </CardHeader>
                <CardContent><div className="text-3xl font-bold" data-testid="stat-documents">{data.totals.documents}</div></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card data-testid="card-by-state">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> By state</CardTitle></CardHeader>
                <CardContent>
                  {data.byState.length === 0 ? <p className="text-sm text-muted-foreground">No intakes yet.</p> : (
                    <ul className="space-y-1 text-sm" data-testid="list-by-state">
                      {data.byState.map((s) => (
                        <li key={s.state_code} className="flex justify-between" data-testid={`row-state-${s.state_code}`}>
                          <span>{s.state_code}</span><span className="font-mono">{s.n}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card data-testid="card-by-event">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Event mix</CardTitle></CardHeader>
                <CardContent>
                  {data.byEvent.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : (
                    <ul className="space-y-1 text-sm" data-testid="list-by-event">
                      {data.byEvent.map((e) => (
                        <li key={e.event_type} className="flex justify-between" data-testid={`row-event-${e.event_type}`}>
                          <span>{e.event_type}</span><span className="font-mono">{e.n}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-recent-intakes">
              <CardHeader>
                <CardTitle className="text-base">Recent intakes</CardTitle>
                <CardDescription>Most recent 25 in the window. AI summary shown when generated.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentIntakes.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : (
                  <ul className="space-y-3" data-testid="list-recent-intakes">
                    {data.recentIntakes.map((r) => (
                      <li key={r.id} className="rounded border p-3" data-testid={`row-intake-${r.id}`}>
                        <div className="flex justify-between flex-wrap gap-2">
                          <div className="font-semibold">
                            {r.preferredName || r.firstName || "(anonymous)"} · {r.stateCode ?? "??"} · age {r.age ?? "?"}
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        {r.aiSummary && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{r.aiSummary}</p>}
                        {!r.aiAnalyzedAt && <Badge variant="outline" className="mt-2 text-xs">Not yet analyzed</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
