import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Sparkles, Loader2, ExternalLink, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GrantHit {
  id: string;
  title: string;
  agency: string | null;
  funding_amount: string | null;
  deadline: string | null;
  fit_score: number | null;
  status: string | null;
  source_url: string | null;
  cfda: string | null;
  snippet: string;
}
interface PlatformHit {
  name: string;
  url: string | null;
  role: string | null;
  description: string | null;
}

export default function RegionalBriefingPage() {
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [extracted, setExtracted] = useState<{ region: string; topic: string } | null>(null);
  const [grants, setGrants] = useState<GrantHit[]>([]);
  const [platforms, setPlatforms] = useState<PlatformHit[]>([]);
  const { toast } = useToast();

  async function run() {
    const q = question.trim();
    if (!q) {
      toast({ title: "Type a question first", variant: "destructive" });
      return;
    }
    setStreaming(true);
    setBriefing("");
    setExtracted(null);
    setGrants([]);
    setPlatforms([]);
    try {
      const res = await fetch("/api/regional-briefing/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.trim();
          if (!line.startsWith("data:")) continue;
          let payload: {
            context?: { region?: string; topic?: string; grants?: GrantHit[]; platforms?: PlatformHit[] };
            content?: string;
            error?: string;
            done?: boolean;
          } | null = null;
          try {
            payload = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          if (!payload) continue;
          if (payload.error) throw new Error(payload.error);
          if (payload.context) {
            setGrants(payload.context.grants ?? []);
            setPlatforms(payload.context.platforms ?? []);
            if (payload.context.region && payload.context.topic) {
              setExtracted({ region: payload.context.region, topic: payload.context.topic });
            }
          }
          if (typeof payload.content === "string") {
            setBriefing((prev) => prev + (payload!.content ?? ""));
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Briefing failed";
      toast({ title: "Briefing failed", description: message, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void run();
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl" data-testid="page-regional-briefing">
      <PageHeader
        title="Regional Briefing"
        description="Ask anything about any region + topic. The AI figures out the region + topic from your question, pulls every matching grant from our pipeline, every relevant TCAF platform, and streams back a primary-source briefing with ALL the solutions."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Community Intelligence" },
          { label: "Regional Briefing" },
        ]}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Ask the AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder='e.g., "Tell me the issues with childcare infrastructure in North Williamson County and every TCAF solution we can deploy."'
            data-testid="input-question"
            className="text-base"
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to run</p>
            <Button onClick={run} disabled={streaming} data-testid="button-run-briefing">
              {streaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {streaming ? "Working…" : "Run briefing"}
            </Button>
          </div>
          {extracted && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Badge variant="outline" data-testid="badge-extracted-region">Region: {extracted.region}</Badge>
              <Badge variant="outline" data-testid="badge-extracted-topic">Topic: {extracted.topic}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Briefing</CardTitle>
          </CardHeader>
          <CardContent>
            {!briefing && !streaming && (
              <p className="text-sm text-muted-foreground">Type your question above. The answer will stream here with sections for what's happening, verifiable data, matching grants, and all solutions.</p>
            )}
            {streaming && !briefing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Figuring out region + topic, pulling grants + platforms, then synthesizing…
              </div>
            )}
            <pre className="whitespace-pre-wrap text-sm leading-6 font-sans" data-testid="text-briefing">
              {briefing}
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Matching grants ({grants.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
              {grants.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
              {grants.map((g) => (
                <div key={g.id} className="border-l-2 border-primary/40 pl-3" data-testid={`grant-${g.id}`}>
                  <div className="text-xs font-semibold leading-tight">{g.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{g.agency ?? "—"}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {g.funding_amount && <Badge variant="secondary" className="text-[10px]">{g.funding_amount}</Badge>}
                    {g.deadline && <Badge variant="outline" className="text-[10px]">Due {g.deadline}</Badge>}
                    {typeof g.fit_score === "number" && <Badge className="text-[10px]">Fit {g.fit_score}</Badge>}
                    {g.status && <Badge variant="outline" className="text-[10px]">{g.status}</Badge>}
                  </div>
                  {g.source_url && (
                    <a
                      href={g.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary inline-flex items-center gap-1 mt-1 hover:underline"
                      data-testid={`link-grant-${g.id}`}
                    >
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">TCAF platforms in scope ({platforms.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[260px] overflow-y-auto">
              {platforms.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
              {platforms.map((p) => (
                <div key={p.name} className="text-xs" data-testid={`platform-${p.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="font-semibold">{p.name}</div>
                  {p.role && <div className="text-[10px] text-muted-foreground">{p.role}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
