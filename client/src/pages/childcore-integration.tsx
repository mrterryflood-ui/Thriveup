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

import { useEffect, useState } from "react";
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
  Eye, Server, Plug2, ArrowRightLeft, Settings2,
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

function getDisplayHost(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(value).host || null;
  } catch {
    return null;
  }
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
  const { data: capabilities, isLoading: capabilitiesLoading, refetch: refetchCapabilities } = useQuery<any>({
    queryKey: ["/api/childcore/capabilities"],
  });

  const refresh = () => {
    void repingPublic();
    void refetchStatus();
    void refetchCapabilities();
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
  const scopeState = (scope: string) => capabilities?.scopes?.[scope];
  const scopeLabel = (scope: string) => {
    if (capabilitiesLoading) return "Checking…";
    if (scopeState(scope) === "active") return "Active";
    if (scopeState(scope) === "not_granted") return "Not granted";
    if (scopeState(scope) === "key_inactive") return "Key inactive";
    if (scopeState(scope) === "key_not_found") return "Key not provisioned";
    if (scopeState(scope) === "key_not_configured") return "Key not configured";
    return "Unknown";
  };
  const scopeIsActive = (scope: string) => scopeState(scope) === "active";

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
            <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
              {status?.baseUrl ? (
                <div>Base URL: <code className="font-mono">{status.baseUrl}</code></div>
              ) : (
                <div data-testid="text-childcore-metadata-unavailable">Integration metadata unavailable.</div>
              )}
              {status?.docsUrl ? (
                <div>
                  <a href={status.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> ChildCORE API docs
                  </a>
                </div>
              ) : (
                <div data-testid="text-childcore-docs-unavailable">ChildCORE API docs unavailable.</div>
              )}
            </div>
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
            <Row label="Scopes active" ok={capabilities?.keyActive}
                 loading={capabilitiesLoading}
                 note={capabilities?.keyActive ? `${SCOPES.filter(({ scope }) => scopeIsActive(scope)).length}/${SCOPES.length} scopes` : "Live key record is not active"} />
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
                <Badge
                  variant={scopeIsActive(scope) ? "secondary" : "outline"}
                  className={`text-[10px] shrink-0 ${scopeIsActive(scope) ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
                >
                  {scopeLabel(scope)}
                </Badge>
              </div>
            ))}
          </div>
          {capabilities && !capabilities.keyActive && (
            <p className="text-xs text-amber-600 mt-3">
              The page is reading the live Partner API key record. It is not currently active, so protected ChildCORE calls will continue to return 401/403 until the key is reconciled or restored.
            </p>
          )}
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
  const { data: capabilities, isLoading: capabilitiesLoading } = useQuery<any>({
    queryKey: ["/api/childcore/capabilities"],
  });

  const MILESTONES = ["at_contact", "day_30", "day_90", "day_180", "day_365", "month_6", "month_12", "exit"];

  return (
    <div className="space-y-4">
      <CapabilityBanner
        title="ChildCORE YHSI access"
        status={capabilities?.capabilities?.yhsi?.status}
        loading={capabilitiesLoading}
        scope="yhsi:read"
        description="ChildCORE receives aggregate, floor-5-suppressed YHSI outcomes only. Individual records never cross the partner boundary."
      />
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

// ─── 6. Chainweb ROI capability tab ───────────────────────────────────────────

function CapabilityBanner({
  title,
  status,
  loading,
  scope,
  description,
}: {
  title: string;
  status?: "available" | "connecting";
  loading?: boolean;
  scope: string;
  description: string;
}) {
  const available = status === "available";
  return (
    <Card className={available
      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
      : "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20"}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {loading ? <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin mt-0.5" />
            : available ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            : <Clock className="h-5 w-5 text-amber-600 mt-0.5" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{title}</span>
              <Badge variant={available ? "secondary" : "outline"} className={available ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
                {loading ? "Checking…" : available ? "Available" : "Connecting…"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Required scope: <code>{scope}</code>. The state is derived from the live ThriveUp Partner API key record and updates when this tab is refreshed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoiTab() {
  const { data: capabilities, isLoading } = useQuery<any>({
    queryKey: ["/api/childcore/capabilities"],
  });
  const roi = capabilities?.capabilities?.roi;

  return (
    <div className="space-y-4">
      <CapabilityBanner
        title="ChildCORE Chainweb ROI access"
        status={roi?.status}
        loading={isLoading}
        scope="chainweb:read"
        description="When active, ChildCORE can create, calculate, and narrate aggregate ROI scenarios through ThriveUp's Chainweb Partner API."
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />ROI endpoint contract</CardTitle>
          <CardDescription className="text-xs">
            These endpoints are available only after <code>chainweb:read</code> is active for the ChildCORE key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roi?.endpoints?.length ? (
            <div className="space-y-2">
              {roi.endpoints.map((endpoint: string) => (
                <div key={endpoint} className="rounded-md bg-muted/40 px-3 py-2 font-mono text-[11px]">
                  {endpoint}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground" data-testid="text-roi-connecting">
              Connecting to the live scope record…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useQuery<{ baseUrl: string; docsUrl: string }>({
    queryKey: ["/api/childcore/settings"],
    retry: false,
  });
  const [baseUrl, setBaseUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ baseUrl?: string; docsUrl?: string }>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data || dirty) return;
    setBaseUrl(data.baseUrl);
    setDocsUrl(data.docsUrl);
  }, [data, dirty]);

  const save = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/childcore/settings", { baseUrl, docsUrl });
      return response.json() as Promise<{ baseUrl: string; docsUrl: string }>;
    },
    onSuccess: (next) => {
      setBaseUrl(next.baseUrl);
      setDocsUrl(next.docsUrl);
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["/api/childcore/settings"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/childcore/status"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/childcore/ping"] });
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string"
            && (key.startsWith("/api/childcore/community/") || key === "/api/childcore/rag-preview");
        },
      });
      toast({
        title: "ChildCORE destinations saved",
        description: "The connector, monitoring page, and public links now use the new values.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save ChildCORE destinations",
        description: error.message.includes("403")
          ? "Only platform administrators can change ChildCORE destinations."
          : error.message.includes("400")
          ? "Use valid HTTPS destinations and an approved ChildCORE API origin."
          : "The destinations could not be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (isError) {
    const unauthorized = error instanceof Error && /401|403/.test(error.message);
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3" data-testid="text-childcore-settings-unavailable">
          <p>{unauthorized
            ? "Destination settings are available to platform staff only."
            : "ChildCORE destination settings are temporarily unavailable."}</p>
          {!unauthorized && (
            <Button variant="outline" size="sm" onClick={() => void refetch()} data-testid="button-retry-childcore-settings">
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          ChildCORE destinations
        </CardTitle>
        <CardDescription className="text-xs">
          Platform administrators can update the upstream API and external documentation addresses without releasing the app.
          Both values must use HTTPS. Every change is recorded with the staff actor and previous values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors: { baseUrl?: string; docsUrl?: string } = {};
            for (const [field, value] of [["baseUrl", baseUrl], ["docsUrl", docsUrl]] as const) {
              try {
                const parsed = new URL(value.trim());
                if (parsed.protocol !== "https:") nextErrors[field] = "Use an HTTPS URL.";
              } catch {
                nextErrors[field] = "Enter a complete HTTPS URL.";
              }
            }
            setValidationErrors(nextErrors);
            if (Object.keys(nextErrors).length === 0) save.mutate();
          }}
          data-testid="form-childcore-settings"
        >
          <div className="space-y-2">
            <Label htmlFor="childcore-base-url">ChildCORE API base URL</Label>
            <Input
              id="childcore-base-url"
              value={baseUrl}
              onChange={(event) => {
                setBaseUrl(event.target.value);
                setDirty(true);
                setValidationErrors((current) => ({ ...current, baseUrl: undefined }));
              }}
              placeholder="https://example.childcore.org/api/v1"
              type="url"
              required
              disabled={save.isPending}
              aria-invalid={Boolean(validationErrors.baseUrl)}
              aria-describedby={validationErrors.baseUrl ? "childcore-base-url-error" : undefined}
              data-testid="input-childcore-base-url"
            />
            {validationErrors.baseUrl && <p id="childcore-base-url-error" className="text-xs text-destructive" role="alert">{validationErrors.baseUrl}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="childcore-docs-url">External documentation URL</Label>
            <Input
              id="childcore-docs-url"
              value={docsUrl}
              onChange={(event) => {
                setDocsUrl(event.target.value);
                setDirty(true);
                setValidationErrors((current) => ({ ...current, docsUrl: undefined }));
              }}
              placeholder="https://example.childcore.org/docs/partner-api"
              type="url"
              required
              disabled={save.isPending}
              aria-invalid={Boolean(validationErrors.docsUrl)}
              aria-describedby={validationErrors.docsUrl ? "childcore-docs-url-error" : undefined}
              data-testid="input-childcore-docs-url"
            />
            {validationErrors.docsUrl && <p id="childcore-docs-url-error" className="text-xs text-destructive" role="alert">{validationErrors.docsUrl}</p>}
          </div>
          <Button type="submit" disabled={save.isPending} data-testid="button-save-childcore-settings">
            {save.isPending ? "Saving…" : "Save destinations"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function ChildCOREIntegrationPage() {
  const { data: ping } = useQuery<any>({
    queryKey: ["/api/childcore/ping"],
    refetchInterval: 60_000,
  });
  const { data: status, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/childcore/status"],
  });

  const overallOk = ping?.ok;
  const apiHost = getDisplayHost(status?.baseUrl);
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
        <span className="flex items-center gap-1.5" data-testid="text-childcore-upstream">
          <Wifi className="h-3.5 w-3.5" />
          {statusLoading ? "API: checking…" : apiHost ? `API: ${apiHost}` : "API: unavailable"}
        </span>
        <span>·</span>
        {statusLoading ? (
          <span data-testid="text-childcore-header-docs-checking">Partner API docs: checking…</span>
        ) : status?.docsUrl ? (
          <a href={status.docsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> Partner API docs
          </a>
        ) : (
          <span data-testid="text-childcore-header-docs-unavailable">Partner API docs unavailable</span>
        )}
        <span>·</span>
        <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Platform staff only</span>
      </div>

      <Tabs defaultValue="connection" data-testid="tabs-childcore">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="connection"   data-testid="tab-connection"><Wifi className="h-3.5 w-3.5 mr-1.5" />Connection</TabsTrigger>
          <TabsTrigger value="data-preview" data-testid="tab-data-preview"><Database className="h-3.5 w-3.5 mr-1.5" />Data Preview</TabsTrigger>
          <TabsTrigger value="rag-context"  data-testid="tab-rag-context"><Code2 className="h-3.5 w-3.5 mr-1.5" />RAG Context</TabsTrigger>
          <TabsTrigger value="events"       data-testid="tab-events"><ScrollText className="h-3.5 w-3.5 mr-1.5" />Event Log</TabsTrigger>
           <TabsTrigger value="roi"         data-testid="tab-roi"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />ROI</TabsTrigger>
           <TabsTrigger value="yhsi"         data-testid="tab-yhsi"><Users className="h-3.5 w-3.5 mr-1.5" />YHSI</TabsTrigger>
           <TabsTrigger value="settings"    data-testid="tab-settings"><Settings2 className="h-3.5 w-3.5 mr-1.5" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">   <ConnectionTab />   </TabsContent>
        <TabsContent value="data-preview"> <DataPreviewTab />  </TabsContent>
        <TabsContent value="rag-context">  <RagContextTab />   </TabsContent>
        <TabsContent value="events">       <EventLogTab />     </TabsContent>
         <TabsContent value="roi">          <RoiTab />          </TabsContent>
         <TabsContent value="yhsi">         <YhsiTab />         </TabsContent>
          <TabsContent value="settings">     <SettingsTab />     </TabsContent>
      </Tabs>
    </div>
  );
}
