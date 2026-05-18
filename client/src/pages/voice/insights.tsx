import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, Download, Send, MapPin, ShieldAlert, BarChart3, Brain, Heart, Globe2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Theme = {
  title: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  memberPinIds: string[];
  recommendedPlatforms: string[];
  confidence: number;
};

type Insight = {
  id: number;
  generatedAt: string;
  pinCount: number;
  themes: Theme[];
  sentimentTimeline: Array<{ date: string; positive: number; neutral: number; negative: number; mixed: number; crisis: number }>;
  stakeholderBreakdown: Record<string, number>;
  modelUsed: string;
  syncedToStoryAt: string | null;
};

type Project = { id: number; slug: string; name: string; description: string | null };

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  negative: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  mixed: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

function PlatformBadge({ slug }: { slug: string }) {
  const labels: Record<string, string> = {
    "whole-person-health": "Whole-Person Health",
    "lifebridge": "LifeBridge",
    "safe-cogni-care": "SafeCogniCare",
    "sankofa-health-network": "Sankofa Health Network",
    "trade-sims": "Trade Sims",
    "mission-transition": "Mission Transition",
    "isss": "ISSS",
    "foster-youth": "Foster Youth Wizard",
    "civic-signal": "Civic Signal",
  };
  return <Badge variant="secondary" data-testid={`badge-platform-${slug}`}>{labels[slug] ?? slug}</Badge>;
}

export default function VoiceInsightsPage() {
  const [, params] = useRoute("/voice/:slug/insights");
  const slug = params?.slug ?? "";
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const projectQ = useQuery<{ project: Project }>({ queryKey: ["/api/voice/projects", slug], enabled: !!slug });
  const insightQ = useQuery<{ insight: Insight | null }>({ queryKey: ["/api/voice/projects", slug, "insights", "latest"], enabled: !!slug });

  const project = projectQ.data?.project;
  const insight = insightQ.data?.insight ?? null;

  const generate = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/voice/projects/${slug}/insights/generate`, {}),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/voice/projects", slug, "insights", "latest"] });
      toast({ title: "Themes ready", description: "Thank you for listening — your community's voice is clustered below." });
    },
    onError: async (err: Error) => {
      let msg = err.message;
      try { const j = JSON.parse(err.message); msg = j.error ?? msg; } catch { /* keep */ }
      setError(msg);
    },
  });

  const sync = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/voice/insights/${insight!.id}/sync`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/voice/projects", slug, "insights", "latest"] });
      toast({ title: "Story page updated", description: "Public storytellers will see the latest themes." });
    },
    onError: async () => toast({ title: "Sync failed", variant: "destructive" }),
  });

  const downloadJson = () => {
    if (!insight) return;
    const blob = new Blob([JSON.stringify(insight, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `voice-insights-${slug}-${insight.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalSent = insight ? insight.sentimentTimeline.reduce((acc, d) => ({
    positive: acc.positive + d.positive, negative: acc.negative + d.negative, neutral: acc.neutral + d.neutral, mixed: acc.mixed + d.mixed, crisis: acc.crisis + d.crisis,
  }), { positive: 0, negative: 0, neutral: 0, mixed: 0, crisis: 0 }) : null;

  return (
    <div className="container max-w-6xl py-8 px-4">
      <Link href={`/voice/${slug}`} data-testid="link-back-project">
        <Button variant="ghost" size="sm" className="mb-3"><ArrowLeft className="h-4 w-4 mr-1" />Back to map</Button>
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Brain className="h-7 w-7 text-primary" aria-hidden="true" /> Insights
          </h1>
          <p className="text-muted-foreground mt-1">{project?.name ?? "Loading…"}</p>
        </div>
        <div className="flex items-center gap-2">
          {insight && <Button variant="outline" size="sm" onClick={downloadJson} data-testid="button-export"><Download className="h-4 w-4 mr-1" />Export JSON</Button>}
          {insight && (
            <Button variant={insight.syncedToStoryAt ? "outline" : "default"} size="sm" onClick={() => sync.mutate()} disabled={sync.isPending} data-testid="button-sync-story">
              <Send className="h-4 w-4 mr-1" />{insight.syncedToStoryAt ? "Re-sync to story" : "Publish to story page"}
            </Button>
          )}
          <Button onClick={() => generate.mutate()} disabled={generate.isPending} data-testid="button-generate">
            <Sparkles className="h-4 w-4 mr-1" />{generate.isPending ? "Listening…" : insight ? "Regenerate themes" : "Generate themes"}
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      {!insight && !insightQ.isLoading && (
        <Card data-testid="card-empty-state">
          <CardContent className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="h-6 w-6 text-primary" /></div>
            <h2 className="text-xl font-semibold">No themes yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">When you generate themes, we'll cluster every voice into 3–7 specific findings you can act on. Each theme routes to the right TCAF platform.</p>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending} data-testid="button-generate-empty">
              <Sparkles className="h-4 w-4 mr-1" />{generate.isPending ? "Listening to your community…" : "Generate first themes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {insight && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card data-testid="card-stat-pins"><CardContent className="pt-5"><div className="text-3xl font-bold">{insight.pinCount}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />voices heard</div></CardContent></Card>
            <Card data-testid="card-stat-themes"><CardContent className="pt-5"><div className="text-3xl font-bold">{insight.themes.length}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><BarChart3 className="h-3 w-3" />themes clustered</div></CardContent></Card>
            <Card data-testid="card-stat-crisis"><CardContent className="pt-5"><div className="text-3xl font-bold">{totalSent?.crisis ?? 0}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><ShieldAlert className="h-3 w-3" />routed to safety net</div></CardContent></Card>
            <Card data-testid="card-stat-model"><CardContent className="pt-5"><div className="text-sm font-medium font-mono">{insight.modelUsed}</div><div className="text-xs text-muted-foreground mt-1">{new Date(insight.generatedAt).toLocaleString()}</div></CardContent></Card>
          </div>

          {totalSent && (
            <Card data-testid="card-sentiment">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4" /> Sentiment of the voices we heard</CardTitle></CardHeader>
              <CardContent>
                <div className="flex h-3 rounded-full overflow-hidden border">
                  {(["positive","mixed","neutral","negative"] as const).map((k) => {
                    const total = totalSent.positive + totalSent.negative + totalSent.neutral + totalSent.mixed;
                    const pct = total > 0 ? (totalSent[k] / total) * 100 : 0;
                    if (pct === 0) return null;
                    return <div key={k} className={`${k === "positive" ? "bg-emerald-500" : k === "negative" ? "bg-rose-500" : k === "mixed" ? "bg-amber-500" : "bg-muted-foreground/30"}`} style={{ width: `${pct}%` }} title={`${k}: ${totalSent[k]}`} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />Positive {totalSent.positive}</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />Mixed {totalSent.mixed}</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30 mr-1" />Neutral {totalSent.neutral}</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />Negative {totalSent.negative}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> What we heard</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {insight.themes.map((t, i) => (
                <Card key={i} data-testid={`theme-${i}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base">{t.title}</CardTitle>
                      <Badge variant="outline" className={SENTIMENT_COLOR[t.sentiment] ?? SENTIMENT_COLOR.neutral} data-testid={`theme-sentiment-${i}`}>{t.sentiment}</Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">{t.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground mb-2">{t.memberPinIds.length} voice{t.memberPinIds.length === 1 ? "" : "s"} · {Math.round(t.confidence * 100)}% confidence</div>
                    {t.recommendedPlatforms.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium flex items-center gap-1"><Globe2 className="h-3 w-3" /> Route to</div>
                        <div className="flex flex-wrap gap-1.5">{t.recommendedPlatforms.map((p) => <PlatformBadge key={p} slug={p} />)}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">Narrative-only — no automatic routing.</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card data-testid="card-stakeholders">
            <CardHeader className="pb-3"><CardTitle className="text-base">Who showed up</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(insight.stakeholderBreakdown).map(([k, n]) => (
                  <Badge key={k} variant="outline" data-testid={`stakeholder-${k}`}>{k}: {n}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
