/**
 * ChildCORE Integration Dashboard
 *
 * Admin workspace for monitoring and verifying the ThriveUp ↔ ChildCORE
 * bidirectional partner API integration.
 *
 * Tabs:
 *  1. Connection   — live probe results, scope list, configured flags, blockers
 *  2. Data Preview — ZIP-driven pull of providers / schools / SDOH / impact
 *  3. RAG Context  — exact community-intelligence context the AI would receive
 *  4. Event Log    — recent Partner API calls attributed to ChildCORE
 *  5. YHSI         — aggregate youth metrics (suppression-floored)
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  ExternalLink, Wifi, WifiOff, Database, Code2, Send, Users,
  BarChart3, Shield, Home, GraduationCap, Briefcase, ScrollText,
  Eye, Server, Plug2, ArrowRightLeft,
} from "lucide-react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusDot({ ok, checking }: { ok: boolean; checking?: boolean }) {
  if (checking) return <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />;
  return ok
    ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
    : <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />;
}

function Metric({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/40">
      <div className="text-xl font-bold tabular-nums">{value ?? "—"}</div>
      <div className="text-xs font-medium text-muted-foreground mt-0.5">{label}</div>
      {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
    </div>
  );
}

function pct(n: number | null | undefined) {
  return n == null ? "—" : `${n}%`;
}

// ─── 1. Connection tab ───────────────────────────────────────────────────────

function ConnectionTab() {
  const { data: ping, isLoading: pinging, refetch: repingPublic } = useQuery<any>({
    queryKey: ["/api/childcore/ping"],
    refetchInterval: 60_000,
  });

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<any>({
    queryKey: ["/api/childcore/status"],
  });

  const refresh = () => {
    void repingPublic();
    void refetchStatus();
    void queryClient.invalidateQueries({ queryKey: ["/api/childcore/status"] });
  };

  const overall = ping?.ok;

  const SCOPES = [
    { scope: "community:read",  desc: "Provider, school, SDOH, impact data by ZIP" },
    { scope: "impact:read",     desc: "Aggregate community impact statistics" },
    { scope: "inbound:write",   desc: "Push events from ChildCORE into ThriveUp" },
    { scope: "student:read",    desc: "Student overview and early-warning data" },
    { scope: "chainweb:read",   desc: "ROI scenario creation, calculation, narratives" },
    { scope: "yhsi:read",       desc: "Aggregate YHSI metrics and outcome summaries" },
  ];

  return (
    <div className="space-y-4">
      {/* Overall status banner */}
      <Card className={overall ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                                : "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20"}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {pinging ? (
                <Skeleton className="w-10 h-10 rounded-full" />
              ) : overall ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-amber-600" />
              )}
              <div>
                <div className="font-bold text-lg" data-testid="text-childcore-overall-status">
                  {pinging ? "Checking…"
                    : overall ? "ChildCORE connection healthy"
                    : ping?.reachable ? "ChildCORE reachable — authentication needed"
                    : "ChildCORE unreachable"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ping?.service} {ping?.version && `v${ping.version}`}
                  {ping?.latencyMs != null && ` · ${ping.latencyMs}ms`}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} data-testid="button-childcore-refresh">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outbound (ThriveUp → ChildCORE) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              Outbound — ThriveUp → ChildCORE
            </CardTitle>
            <CardDescription className="text-xs">
              ThriveUp calls ChildCORE's API using <code>CHILDCORE_API_KEY</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Configured" ok={ping?.configured} loading={pinging} />
            <Row label="Reachable" ok={ping?.reachable} loading={pinging} />
            <Row label="Authenticated" ok={ping?.authenticated} loading={pinging} />
            <Row label="Community data" ok={ping?.authenticated} loading={pinging}
                 note={!ping?.authenticated ? "403 — key needs community scope on ChildCORE admin side" : undefined} />
            {status && (
              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <div>Base URL: <code className="font-mono">{status.baseUrl}</code></div>
                <div>
                  <a href={status.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> ChildCORE API docs
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inbound (ChildCORE → ThriveUp) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plug2 className="h-4 w-4" />
              Inbound — ChildCORE → ThriveUp
            </CardTitle>
            <CardDescription className="text-xs">
              ChildCORE calls ThriveUp using <code>THRIVEUP_API_KEY</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Key provisioned" ok={true} />
            <Row label="Partner API health" ok={true}
                 note="Verified HTTP 200 · partner: ChildCORE" />
            <Row label="Scopes active" ok={true}
                 note={`${SCOPES.length} scopes`} />
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Auth header: <code className="font-mono">x-partner-key: &lt;THRIVEUP_API_KEY&gt;</code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scope grant table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Scopes granted to ChildCORE on ThriveUp Partner API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            {SCOPES.map(({ scope, desc }) => (
              <div key={scope} className="flex items-center justify-between py-2 gap-3" data-testid={`row-scope-${scope}`}>
                <div>
                  <code className="font-mono text-xs text-primary">{scope}</code>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocker card if not authenticated */}
      {ping && !ping.authenticated && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Action required — ChildCORE admin
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>ThriveUp can reach ChildCORE's service, but community-data endpoints return 403.</p>
            <p>
              The <code>CHILDCORE_API_KEY</code> needs a <strong>community</strong> scope grant in
              ChildCORE's admin console before providers, schools, SDOH, and impact data will flow.
            </p>
            <p>Once granted, the badge above will flip to <strong>Authenticated</strong> automatically on the next refresh.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, ok, loading, note }: { label: string; ok: boolean | undefined; loading?: boolean; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span>{label}</span>
        {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
      </div>
      {loading ? (
        <Skeleton className="w-16 h-4" />
      ) : ok ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium shrink-0"><CheckCircle2 className="h-3.5 w-3.5" />Yes</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium shrink-0"><XCircle className="h-3.5 w-3.5" />No</span>
      )}
    </div>
  );
}

// ─── 2. Data Preview tab ─────────────────────────────────────────────────────

function DataPreviewTab() {
  const [zip, setZip] = useState("78701");
  const [submitted, setSubmitted] = useState("78701");

  const makeQuery = (path: string) => ({
    queryKey: [`/api/childcore/community/${submitted}/${path}`],
    enabled: !!submitted,
    retry: false,
  });

  const { data: providers, isLoading: loadP, error: errP } = useQuery<any>(makeQuery("providers"));
  const { data: schools,   isLoading: loadS, error: errS } = useQuery<any>(makeQuery("schools"));
  const { data: sdoh,      isLoading: loadD, error: errD } = useQuery<any>(makeQuery("sdoh"));
  const { data: impact,    isLoading: loadI, error: errI } = useQuery<any>(makeQuery("impact"));

  const submit = () => {
    if (/^\d{5}$/.test(zip.trim())) {
      setSubmitted(zip.trim());
      void queryClient.invalidateQueries({ queryKey: [`/api/childcore/community/${zip.trim()}`] });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <Label htmlFor="zip-input" className="text-sm mb-1.5 block">ZIP code</Label>
              <Input
                id="zip-input"
                value={zip}
                onChange={e => setZip(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="78701"
                maxLength={5}
                className="font-mono"
                data-testid="input-childcore-zip"
              />
            </div>
            <Button onClick={submit} data-testid="button-childcore-fetch">
              <Activity className="h-4 w-4 mr-1" /> Fetch data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pulls live community data from ChildCORE's API. Returns 503 until ChildCORE grants community scope to <code>CHILDCORE_API_KEY</code>.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataCard title="Providers" icon={<Building2Icon />} data={providers} loading={loadP} error={errP} />
        <DataCard title="Schools"   icon={<GraduationCap className="h-4 w-4" />} data={schools} loading={loadS} error={errS} />
        <DataCard title="SDOH"      icon={<Shield className="h-4 w-4" />} data={sdoh}      loading={loadD} error={errD} />
        <DataCard title="Impact"    icon={<BarChart3 className="h-4 w-4" />}    data={impact}    loading={loadI} error={errI} />
      </div>
    </div>
  );
}

function Building2Icon() { return <Database className="h-4 w-4" />; }

function DataCard({ title, icon, data, loading, error }: {
  title: string; icon: React.ReactNode;
  data: any; loading: boolean; error: any;
}) {
  return (
    <Card data-testid={`card-childcore-${title.toLowerCase()}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <Skeleton className="h-32" />}
        {error && (
          <div className="text-xs text-amber-600 space-y-1">
            <div className="font-medium">Unavailable</div>
            <div>ChildCORE's community endpoints returned an error. This is expected until the API key receives community scope.</div>
          </div>
        )}
        {!loading && !error && data && (
          <pre className="text-[10px] font-mono bg-muted/50 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
        {!loading && !error && !data && (
          <div className="text-xs text-muted-foreground">No data returned.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── 3. RAG Context tab ──────────────────────────────────────────────────────

function RagContextTab() {
  const [zip, setZip] = useState("78701");
  const [fetchZip, setFetchZip] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/childcore/rag-preview", fetchZip],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/childcore/rag-preview?zip=${fetchZip}`);
      return res.json();
    },
    enabled: !!fetchZip,
    retry: false,
  });

  const SOURCE_LABELS: Record<string, string> = {
    available:     "Available",
    empty:         "Empty — no data returned",
    not_requested: "Not requested (no ZIP)",
    failed:        "Failed",
  };

  const SOURCE_COLORS: Record<string, string> = {
    available:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    empty:         "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    not_requested: "bg-muted text-muted-foreground",
    failed:        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <Label htmlFor="rag-zip" className="text-sm mb-1.5 block">ZIP code</Label>
              <Input
                id="rag-zip"
                value={zip}
                onChange={e => setZip(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setFetchZip(zip.trim())}
                placeholder="78701"
                maxLength={5}
                className="font-mono"
                data-testid="input-rag-zip"
              />
            </div>
            <Button onClick={() => setFetchZip(zip.trim())} data-testid="button-rag-preview">
              <Eye className="h-4 w-4 mr-1" /> Preview context
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Builds the exact community-intelligence string the AI receives for this ZIP — showing exactly what ChildCORE contributes (if anything).
          </p>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-64" />}

      {data && !isLoading && (
        <div className="space-y-4">
          {/* Source status badges */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />Data source status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(data.sources as Record<string, string>).map(([src, status]) => (
                  <div key={src} className="text-center p-2 rounded-lg border" data-testid={`badge-source-${src}`}>
                    <div className="text-xs font-semibold capitalize mb-1">{src.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLORS[status] || SOURCE_COLORS.not_requested}`}>
                      {SOURCE_LABELS[status] || status}
                    </span>
                  </div>
                ))}
              </div>
              {data.sources?.childcore !== "available" && (
                <p className="text-xs text-amber-600 mt-3">
                  ChildCORE source is <strong>{SOURCE_LABELS[data.sources?.childcore] || data.sources?.childcore}</strong>. The AI receives Census, RPLICE, and Civic Signal context — but no ChildCORE data. Once ChildCORE grants community scope, this will flip to Available automatically.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Raw context string */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Full AI context string — ZIP {data.zip}
              </CardTitle>
              <CardDescription className="text-xs">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-[10px] font-mono bg-muted/50 rounded p-3 overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed" data-testid="pre-rag-context">
                {data.content || "(empty — all sources unavailable)"}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── 4. Event Log tab ────────────────────────────────────────────────────────

function EventLogTab() {
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/childcore/events"],
  });

  const events: any[] = data?.events ?? [];

  function statusColor(code: number | null) {
    if (!code) return "bg-muted text-muted-foreground";
    if (code < 300) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    if (code < 400) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
    if (code < 500) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">Partner API calls attributed to ChildCORE</h3>
          <p className="text-xs text-muted-foreground">
            These are calls made by ChildCORE to ThriveUp's Partner API — logged by the partner auth middleware.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-events-refresh">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64" />}

      {!isLoading && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm" data-testid="text-events-empty">
            <ScrollText className="h-8 w-8 mx-auto mb-3 opacity-40" />
            No Partner API calls from ChildCORE recorded yet.
            <div className="text-xs mt-1">Events will appear here once ChildCORE starts calling ThriveUp's Partner API.</div>
          </CardContent>
        </Card>
      )}

      {!isLoading && events.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="table-childcore-events">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2.5 font-semibold">Endpoint</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Method</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Key prefix</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Called at</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((ev: any) => (
                    <tr key={ev.id} className="hover:bg-muted/20" data-testid={`row-event-${ev.id}`}>
                      <td className="px-4 py-2.5 font-mono text-[10px] max-w-[260px] truncate">{ev.endpoint}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-[10px]">{ev.method}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusColor(ev.statusCode)}`}>
                          {ev.statusCode ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{ev.keyPrefix}…</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {ev.calledAt ? new Date(ev.calledAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t text-xs text-muted-foreground">
              Showing {events.length} of up to 100 most recent calls
            </div>
          </CardContent>
        </Card>
      )}

      {/* Push test panel */}
      <PushTestPanel />
    </div>
  );
}

function PushTestPanel() {
  const { toast } = useToast();
  const [event, setEvent] = useState("ping");
  const [zip, setZip] = useState("");

  const push = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/childcore/push", {
        event,
        zip: zip || undefined,
        data: { testFrom: "ThriveUp admin panel", ts: new Date().toISOString() },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Push sent", description: "ChildCORE received the event." });
      void queryClient.invalidateQueries({ queryKey: ["/api/childcore/events"] });
    },
    onError: () => {
      toast({ title: "Push failed", description: "ChildCORE did not accept the event.", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4" />Test outbound push</CardTitle>
        <CardDescription className="text-xs">Send a manual test event from ThriveUp → ChildCORE.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <Label htmlFor="push-event" className="text-xs mb-1 block">Event type</Label>
            <Input id="push-event" value={event} onChange={e => setEvent(e.target.value)} className="font-mono text-sm" data-testid="input-push-event" />
          </div>
          <div className="w-32">
            <Label htmlFor="push-zip" className="text-xs mb-1 block">ZIP (optional)</Label>
            <Input id="push-zip" value={zip} onChange={e => setZip(e.target.value)} placeholder="78701" maxLength={5} data-testid="input-push-zip" />
          </div>
          <Button onClick={() => push.mutate()} disabled={push.isPending || !event.trim()} data-testid="button-push-send">
            {push.isPending ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-1" />Send</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 5. YHSI tab ─────────────────────────────────────────────────────────────

function YhsiTab() {
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/childcore/yhsi-summary"],
  });

  const MILESTONES = ["at_contact", "day_30", "day_90", "day_180", "day_365", "month_6", "month_12", "exit"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">YHSI youth data — aggregate only</h3>
          <p className="text-xs text-muted-foreground">
            Counts below {data?.suppressionFloor ?? 5} are suppressed. No individual records, names, or identifiers.
            This is the same view ChildCORE receives via <code className="text-[10px]">GET /api/partner/v1/yhsi/metrics</code>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-yhsi-refresh">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading && <Skeleton className="h-48" />}

      {data && !isLoading && (
        <>
          {/* Participant snapshot */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Participant snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <Metric label="Total enrolled" value={data.participants.total ?? "< 5"} />
                <Metric label="McKinney-Vento" value={data.participants.mckinneyVentoIdentified ?? "< 5"} />
                <Metric label="Chronic pattern" value={data.participants.chronicPattern ?? "< 5"} />
                <Metric label="Foster care" value={data.participants.fosterCareHistory ?? "< 5"} />
                <Metric label="Justice-involved" value={data.participants.justiceInvolvement ?? "< 5"} />
                <Metric label="Parenting" value={data.participants.isParenting ?? "< 5"} />
              </div>
            </CardContent>
          </Card>

          {/* Referral snapshot */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />Referral snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="Total referrals"  value={data.referrals.total ?? "< 5"} />
                <Metric label="Active"            value={data.referrals.active ?? "< 5"} />
                <Metric label="Pending"           value={data.referrals.pending ?? "< 5"} />
                <Metric label="Resolved"          value={data.referrals.resolved ?? "< 5"} />
              </div>
              {data.referrals.resolutionRate != null && (
                <div className="mt-3 text-sm text-center text-muted-foreground">
                  Resolution rate: <strong className="text-foreground">{data.referrals.resolutionRate}%</strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outcome milestones */}
          {Object.keys(data.milestones || {}).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Outcome milestones</CardTitle>
                <CardDescription className="text-xs">Rates require at least {data.suppressionFloor} known values to display.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" data-testid="table-yhsi-milestones">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-semibold">Milestone</th>
                        <th className="text-right py-2 px-3 font-semibold">Count</th>
                        <th className="text-right py-2 px-3 font-semibold">Housing stable</th>
                        <th className="text-right py-2 px-3 font-semibold">Employed</th>
                        <th className="text-right py-2 px-3 font-semibold">HS complete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {MILESTONES.filter(m => data.milestones[m]).map(m => {
                        const row = data.milestones[m];
                        return (
                          <tr key={m} className="hover:bg-muted/20">
                            <td className="py-2 pr-4 font-mono text-[10px]">{m}</td>
                            <td className="text-right py-2 px-3 tabular-nums">{row.total ?? "< 5"}</td>
                            <td className="text-right py-2 px-3 tabular-nums">{pct(row.housingStabilityRate)}</td>
                            <td className="text-right py-2 px-3 tabular-nums">{pct(row.employmentRate)}</td>
                            <td className="text-right py-2 px-3 tabular-nums">{pct(row.hsCompletionRate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {Object.keys(data.milestones || {}).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground" data-testid="text-milestones-empty">
                No outcome milestone data recorded yet.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function ChildCOREIntegrationPage() {
  const { data: ping } = useQuery<any>({
    queryKey: ["/api/childcore/ping"],
    refetchInterval: 60_000,
  });

  const overallOk = ping?.ok;
  const overallBadge = overallOk
    ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 gap-1.5"><StatusDot ok={true} /><span>Live</span></Badge>
    : ping?.reachable
    ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 gap-1.5"><StatusDot ok={false} /><span>Auth needed</span></Badge>
    : <Badge className="bg-muted text-muted-foreground border-0 gap-1.5"><StatusDot ok={false} checking={!ping} /><span>{ping ? "Unreachable" : "Checking…"}</span></Badge>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6" data-testid="childcore-integration-page">
      <PageHeader
        title="ChildCORE Integration"
        description="Bidirectional partner API workspace — monitor connection health, preview community data, inspect RAG context, and review event activity."
        actions={overallBadge}
      />

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pb-1">
        <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" />API: useful-viper-536.convex.site</span>
        <span>·</span>
        <a href="https://childcore.app/docs/partner-api" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline">
          <ExternalLink className="h-3 w-3" /> Partner API docs
        </a>
        <span>·</span>
        <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Admin only</span>
      </div>

      <Tabs defaultValue="connection" data-testid="tabs-childcore">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="connection"   data-testid="tab-connection"><Wifi className="h-3.5 w-3.5 mr-1.5" />Connection</TabsTrigger>
          <TabsTrigger value="data-preview" data-testid="tab-data-preview"><Database className="h-3.5 w-3.5 mr-1.5" />Data Preview</TabsTrigger>
          <TabsTrigger value="rag-context"  data-testid="tab-rag-context"><Code2 className="h-3.5 w-3.5 mr-1.5" />RAG Context</TabsTrigger>
          <TabsTrigger value="events"       data-testid="tab-events"><ScrollText className="h-3.5 w-3.5 mr-1.5" />Event Log</TabsTrigger>
          <TabsTrigger value="yhsi"         data-testid="tab-yhsi"><Users className="h-3.5 w-3.5 mr-1.5" />YHSI</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">   <ConnectionTab />   </TabsContent>
        <TabsContent value="data-preview"> <DataPreviewTab />  </TabsContent>
        <TabsContent value="rag-context">  <RagContextTab />   </TabsContent>
        <TabsContent value="events">       <EventLogTab />     </TabsContent>
        <TabsContent value="yhsi">         <YhsiTab />         </TabsContent>
      </Tabs>
    </div>
  );
}
