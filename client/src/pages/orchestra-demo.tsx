import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Brain, Globe, Landmark, Loader2, Music, Search, Sparkles, CheckCircle2, XCircle,
} from "lucide-react";

type PhaseName = "providers" | "community" | "research" | "synthesis";

interface PhaseState {
  status: "idle" | "running" | "done" | "error";
  ms?: number;
  data?: Record<string, unknown>;
  message?: string;
}

interface OrchestraStatus {
  providers: Array<{ name: string; model: string; isFree: boolean }>;
  activeProvider: { name: string; model: string };
  perplexity: boolean;
  collaborative: {
    enginesAvailable: Array<{ id: string; model: string }>;
    engineCount: number;
    ragEnabled: boolean;
    rpliceEnabled: boolean;
    mapGapEnabled: boolean;
    status: string;
  };
  orchestration: {
    communityContext: boolean;
    censusLive: boolean;
    rplice: boolean;
    mapGap: boolean;
    rag: boolean;
  };
}

const PHASE_META: Record<PhaseName, { title: string; desc: string; icon: typeof Brain }> = {
  providers: { title: "AI Provider Health", desc: "Claude chain · Gemini · OpenRouter · Perplexity", icon: Activity },
  community: { title: "Community Intelligence", desc: "Live Census ACS + RPLICE framework for the ZIP", icon: Landmark },
  research: { title: "Perplexity Live Research", desc: "Real-time web research with citations", icon: Search },
  synthesis: { title: "Collaborative Synthesis", desc: "All engines + RAG + RPLICE + MAP-GAP, inside community context", icon: Brain },
};

const initialPhases: Record<PhaseName, PhaseState> = {
  providers: { status: "idle" },
  community: { status: "idle" },
  research: { status: "idle" },
  synthesis: { status: "idle" },
};

export default function OrchestraDemoPage() {
  const [zip, setZip] = useState("78653");
  const [question, setQuestion] = useState("");
  const [phases, setPhases] = useState<Record<PhaseName, PhaseState>>(initialPhases);
  const [running, setRunning] = useState(false);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const { data: status } = useQuery<OrchestraStatus>({ queryKey: ["/api/orchestra/status"] });

  useEffect(() => () => { esRef.current?.close(); }, []);

  const run = () => {
    esRef.current?.close();
    setPhases(initialPhases);
    setTotalMs(null);
    setFatalError(null);
    setRunning(true);

    const params = new URLSearchParams({ zip });
    if (question.trim()) params.set("question", question.trim());
    const es = new EventSource(`/api/orchestra/run?${params.toString()}`);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "phase") {
          const name = msg.phase as PhaseName;
          setPhases(prev => ({
            ...prev,
            [name]: msg.status === "start"
              ? { status: "running" }
              : msg.status === "done"
                ? { status: "done", ms: msg.ms, data: msg }
                : { status: "error", message: msg.message },
          }));
        } else if (msg.type === "done") {
          setTotalMs(msg.totalMs);
          setRunning(false);
          es.close();
        } else if (msg.type === "fatal") {
          setFatalError(String(msg.message || "The orchestra run failed unexpectedly."));
          setRunning(false);
          es.close();
        }
      } catch { /* ignore malformed frame */ }
    };
    es.onerror = () => {
      setRunning(false);
      setFatalError(prev => prev ?? "Connection lost. If you are not signed in as a TCAF admin, this endpoint returns 401/403 — sign in and try again.");
      es.close();
    };
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-orchestra-title">The Full Orchestra</h1>
        </div>
        <p className="text-muted-foreground">
          Every engine, one community. Enter any ZIP code in the country and watch Census, RPLICE,
          Perplexity live research, the RAG knowledge base, and the collaborative AI engines hand
          data to each other in real time.
        </p>
      </div>

      {status && (
        <Card data-testid="card-orchestra-status">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Platform Brain Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {status.collaborative.enginesAvailable.map(e => (
              <Badge key={e.id} variant="secondary" data-testid={`badge-engine-${e.id}`}>{e.id} · {e.model}</Badge>
            ))}
            <Badge variant={status.perplexity ? "default" : "destructive"} data-testid="badge-perplexity">
              Perplexity {status.perplexity ? "live" : "offline"}
            </Badge>
            <Badge variant={status.orchestration.censusLive ? "default" : "destructive"} data-testid="badge-census">
              Census {status.orchestration.censusLive ? "live" : "offline"}
            </Badge>
            {status.orchestration.rplice && <Badge data-testid="badge-rplice">RPLICE</Badge>}
            {status.orchestration.mapGap && <Badge data-testid="badge-mapgap">MAP-GAP</Badge>}
            {status.orchestration.rag && <Badge data-testid="badge-rag">RAG</Badge>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Input
            value={zip}
            onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="ZIP code (any community nationwide)"
            className="sm:w-48"
            data-testid="input-orchestra-zip"
          />
          <Input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Optional question (default: highest-leverage investments + funding streams)"
            className="flex-1"
            data-testid="input-orchestra-question"
          />
          <Button onClick={run} disabled={running || zip.length !== 5} data-testid="button-orchestra-run">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
            {running ? "Conducting…" : "Run the Orchestra"}
          </Button>
        </CardContent>
      </Card>

      {fatalError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6 text-sm text-destructive" data-testid="text-fatal-error">
            <XCircle className="h-4 w-4 shrink-0" /> {fatalError}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {(Object.keys(PHASE_META) as PhaseName[]).map(name => {
          const meta = PHASE_META[name];
          const st = phases[name];
          const Icon = meta.icon;
          return (
            <Card key={name} data-testid={`card-phase-${name}`} className={st.status === "running" ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {meta.title}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-normal">
                    {st.ms != null && <span className="text-muted-foreground">{(st.ms / 1000).toFixed(1)}s</span>}
                    {st.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {st.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" data-testid={`status-done-${name}`} />}
                    {st.status === "error" && <XCircle className="h-4 w-4 text-destructive" data-testid={`status-error-${name}`} />}
                  </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{meta.desc}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {st.status === "error" && <p className="text-destructive" data-testid={`text-error-${name}`}>{st.message}</p>}

                {name === "providers" && st.status === "done" && (
                  <div className="flex flex-wrap gap-1.5">
                    {(st.data?.providers as string[] | undefined)?.map(p => (
                      <Badge key={p} variant="outline">{p}</Badge>
                    ))}
                    {(st.data?.collaborativeEngines as string[] | undefined)?.map(e => (
                      <Badge key={e} variant="secondary">{e}</Badge>
                    ))}
                  </div>
                )}

                {name === "community" && st.status === "done" && (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs" data-testid="text-community-preview">
                    {String(st.data?.preview || "")}
                  </pre>
                )}

                {name === "research" && st.status === "done" && (
                  <>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs" data-testid="text-research-preview">
                      {String(st.data?.preview || "")}
                    </pre>
                    <div className="flex flex-wrap gap-1.5">
                      {(st.data?.citations as string[] | undefined)?.slice(0, 10).map((c, i) => (
                        <a key={i} href={c} target="_blank" rel="noreferrer" className="max-w-64 truncate text-xs text-primary underline" data-testid={`link-citation-${i}`}>{c}</a>
                      ))}
                    </div>
                  </>
                )}

                {name === "synthesis" && st.status === "done" && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {(st.data?.engines as Array<{ id: string; ok: boolean; ms: number }> | undefined)?.map(e => (
                        <Badge key={e.id} variant={e.ok ? "default" : "destructive"}>
                          {e.id} {e.ok ? `· ${(e.ms / 1000).toFixed(1)}s` : "· failed"}
                        </Badge>
                      ))}
                      {st.data?.ragChunks != null && <Badge variant="outline">RAG · {String(st.data.ragChunks)} chunks</Badge>}
                      {st.data?.consensusMethod != null && <Badge variant="outline">{String(st.data.consensusMethod)}</Badge>}
                    </div>
                    <div className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm" data-testid="text-synthesis">
                      {String(st.data?.synthesis || "")}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalMs != null && (
        <p className="text-center text-sm text-muted-foreground" data-testid="text-total-time">
          Full orchestra run completed in {(totalMs / 1000).toFixed(1)}s
        </p>
      )}
    </div>
  );
}
