import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, ExternalLink, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import type { GrantManagementResponse } from "@shared/grant-management";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentOrgId } from "@/hooks/use-current-org";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Scope = "entity" | "corpus";
type StateFilter = "active" | "dismissed" | "all" | "untracked";
type ManagementAction = "dismiss" | "restore" | "archive" | "purge";

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

async function responseError(response: Response) {
  try {
    const body = await response.json();
    return body.message || body.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export function OpportunityManager({ defaultScope = "entity" }: { defaultScope?: Scope }) {
  const { user, isLoading: authLoading } = useAuth();
  const { orgId } = useCurrentOrgId();
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [filter, setFilter] = useState<StateFilter>("active");
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<ManagementAction | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuerySearch(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const queryKey = useMemo(() => ["/api/grants/management", user?.id ?? "anonymous", orgId, scope, page, querySearch, filter] as const, [user?.id, orgId, scope, page, querySearch, filter]);
  const { data, error, isLoading, isFetching, refetch } = useQuery<GrantManagementResponse>({
    queryKey,
    enabled: !authLoading,
    queryFn: async () => {
      const params = new URLSearchParams({ scope, page: String(page), search: querySearch, state: filter });
      const response = await fetch(`/api/grants/management?${params}`, { credentials: "include", headers: orgId ? { "x-org-id": orgId } : {} });
      if (!response.ok) throw new Error(await responseError(response));
      return response.json();
    },
    refetchInterval: query => query.state.data?.refresh.status === "running" ? 5000 : false,
  });

  useEffect(() => {
    setSelected([]);
    setAction(null);
    setConfirmation("");
  }, [scope, filter, page, querySearch, user?.id, orgId]);

  useEffect(() => {
    if (data?.refresh.status !== "running") return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [data?.refresh.status]);

  const selectedRows = data?.rows.filter(row => selected.includes(row.id)) ?? [];
  const selectedHasUndismissed = selectedRows.some(row => row.entityStatus !== "dismissed");
  const selectedHasDismissed = selectedRows.some(row => row.entityStatus === "dismissed");
  const visibleAllSelected = Boolean(data?.rows.length && data.rows.every(row => selected.includes(row.id)));
  const elapsed = data?.refresh.startedAt
    ? Math.max(0, Math.floor((clock - new Date(data.refresh.startedAt).getTime()) / 1000))
    : null;
  const canManage = data?.canManageEntity === true;
  const admin = data?.isAdmin === true;
  const showCorpus = admin;
  const canSelect = scope === "corpus" ? admin : canManage;

  const invalidateAfterWrite = () => {
    for (const key of ["/api/grants", "/api/grants/stats", "/api/me/grants/tracked", "/api/me/grants/win-rate", "/api/grants/management"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const startRefresh = async () => {
    setRefreshError("");
    try {
      const response = await apiRequest("POST", "/api/grants/management/refresh", {});
      if (!response.ok) throw new Error(await responseError(response));
      await response.json();
      await refetch();
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Could not start refresh.");
    }
  };

  const submitBulk = async () => {
    if (!action || !data || selected.length === 0 || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const entityAction = scope === "entity";
      const payload: { ids: string[]; action: ManagementAction; confirmation?: string } = { ids: selected, action };
      if (action === "purge") payload.confirmation = confirmation;
      const url = entityAction ? "/api/me/grants/bulk" : "/api/grants/management/bulk";
      const response = await apiRequest("POST", url, payload);
      if (!response.ok) throw new Error(await responseError(response));
      await response.json();
      setAction(null);
      setSelected([]);
      setConfirmation("");
      invalidateAfterWrite();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "The selected opportunities could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected(current => checked
      ? current.length >= 100 ? current : current.includes(id) ? current : [...current, id]
      : current.filter(item => item !== id));
  };
  const toggleVisible = () => {
    if (!data) return;
    setSelected(current => visibleAllSelected
      ? current.filter(id => !data.rows.some(row => row.id === id))
      : [...new Set([...current, ...data.rows.map(row => row.id)])].slice(0, 100));
  };
  const openAction = (next: ManagementAction) => { setAction(next); setActionError(""); setConfirmation(""); };
  const actionLabel = action === "dismiss" ? "Dismiss" : action === "restore" ? "Restore" : action === "archive" ? "Archive" : "Permanently purge";
  const purgeReady = action !== "purge" || confirmation === `PURGE ${selected.length}`;

  return (
    <Card className="border-primary/15 shadow-sm" data-testid="opportunity-manager">
      <CardHeader className="gap-4 border-b bg-muted/20 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Opportunity management</CardTitle>
            {data?.scope === "corpus" && <Badge variant="secondary">Shared corpus</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect the shared funding record, or manage what appears in your organization&apos;s queue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showCorpus && <Button size="sm" variant={scope === "corpus" ? "default" : "outline"} onClick={() => { setScope(scope === "corpus" ? "entity" : "corpus"); setPage(1); }} data-testid="button-corpus-scope">{scope === "corpus" ? "Organization view" : "Shared corpus"}</Button>}
          <Button size="sm" variant="outline" onClick={() => { setRefreshError(""); refetch(); }} disabled={isFetching} data-testid="button-reload-counts"><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Reload counts</Button>
          {(canManage || admin) && <Button size="sm" onClick={startRefresh} disabled={data?.refresh.status === "running"} data-testid="button-refresh-sources"><RefreshCw className="mr-2 h-4 w-4" />Refresh sources</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {error && <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" data-testid="management-load-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p>{error instanceof Error ? error.message : "Could not load opportunity management."}</p><p className="mt-1">A profile or sign-in may be required to inspect this management view.</p><Button className="mt-2 h-8" size="sm" variant="outline" onClick={() => refetch()}>Try again</Button></div></div>}
        {refreshError && <p role="alert" className="text-sm text-destructive" data-testid="refresh-error">{refreshError}</p>}
        {data && <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" data-testid="management-summary">
            <Metric label="Shared corpus" value={data.summary.corpus} detail="Includes archived" />
            <Metric label="Not archived" value={data.summary.activeCorpus} detail="Not a verified-open count" />
            <Metric label="Archived" value={data.summary.archived} />
            <Metric label="Added · 7 days" value={data.summary.added7Days} />
            <Metric label="Added · 30 days" value={data.summary.added30Days} />
            <Metric label="Legacy pipeline entries" value={data.summary.legacyPipelineEntries} detail="Separate curated table" />
            <Metric label="Not in any entity pipeline" value={data.summary.notInAnyEntityPipeline} detail="Untracked by every entity" />
            <Metric label="Organization tracked" value={data.summary.entityTracked} />
            <Metric label="Organization dismissed" value={data.summary.entityDismissed} />
            <Metric label="Cached research queries" value={data.summary.cachedResearchQueries} detail="Queries, not opportunities" />
            <Metric label="Last corpus write" value={formatDate(data.summary.lastCorpusWrite)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/15 p-3 text-sm">
            <div>
              <span className="font-medium">Source refresh: </span>
              <span className="capitalize">{data.refresh.status}</span>
              {data.refresh.status === "running" && elapsed !== null && <span className="ml-2 text-muted-foreground">Running for {Math.floor(elapsed / 60)}m {elapsed % 60}s</span>}
              {data.refresh.status === "complete" && <span className="ml-2 text-muted-foreground">{data.refresh.imported ?? "Not reported"} new · {data.refresh.skipped ?? "Not reported"} skipped</span>}
              {data.refresh.status === "failed" && <span role="alert" className="ml-2 text-destructive">{data.refresh.error || "Refresh failed"}</span>}
              {data.refresh.startedAt && <span className="ml-2 text-muted-foreground">Started {formatDate(data.refresh.startedAt)}</span>}
            </div>
            <div className="flex gap-3 text-xs">
              <Link href="/proposal-pipeline" className="underline underline-offset-2">Proposal pipeline <ExternalLink className="inline h-3 w-3" /></Link>
              <Link href="/my-grants" className="underline underline-offset-2">My grants <ExternalLink className="inline h-3 w-3" /></Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Refresh job status is held in process memory and may reset if the server restarts.</p>
          {!canManage && <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm" data-testid="management-access-note"><ShieldAlert className="h-4 w-4 shrink-0" /><p>Sign in with an organization profile to dismiss or restore opportunities. You can still inspect records available to your account.</p></div>}
          {data.scope === "corpus" && admin && <p className="text-xs text-muted-foreground">Shared corpus totals include archived records. Purge is a permanent global deletion; server protections prevent deleting records linked to tracked or pipeline data.</p>}
        </>}
        {isLoading && <div className="space-y-3" aria-label="Loading opportunities" data-testid="management-loading"><div className="h-9 animate-pulse rounded bg-muted" /><div className="h-16 animate-pulse rounded bg-muted" /><div className="h-16 animate-pulse rounded bg-muted" /></div>}
        {data && !error && <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Input aria-label="Search title or agency" placeholder="Search title or agency" value={search} onChange={event => setSearch(event.target.value.slice(0, 200))} className="w-full md:w-64" data-testid="input-management-search" />
              <select aria-label="Opportunity state" value={filter} onChange={event => { setFilter(event.target.value as StateFilter); setPage(1); }} className="h-10 rounded-md border bg-background px-3 text-sm" data-testid="select-management-state">
                <option value="active">Not archived</option><option value="dismissed">{scope === "corpus" ? "Archived in corpus" : "Dismissed by entity"}</option><option value="all">All</option><option value="untracked">Untracked</option>
              </select>
            </div>
            {selected.length > 0 && <div className="flex flex-wrap items-center gap-2" data-testid="selection-actions">
              <span className="text-sm text-muted-foreground">{selected.length} selected</span>
              {scope === "entity" && canManage && selectedHasUndismissed && <Button size="sm" variant="outline" onClick={() => openAction("dismiss")}>Dismiss selected</Button>}
              {scope === "entity" && canManage && selectedHasDismissed && <Button size="sm" variant="outline" onClick={() => openAction("restore")}>Restore selected</Button>}
              {scope === "corpus" && admin && <>
                <Button size="sm" variant="outline" onClick={() => openAction("archive")}>Archive selected</Button>
                <Button size="sm" variant="outline" onClick={() => openAction("restore")}>Restore selected</Button>
                <Button size="sm" variant="destructive" onClick={() => openAction("purge")}>Purge selected</Button>
              </>}
            </div>}
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr>
              <th className="w-10 p-3"><input type="checkbox" aria-label="Select visible opportunities" checked={visibleAllSelected} onChange={toggleVisible} disabled={!canSelect} /></th>
                <th className="p-3">Opportunity</th><th className="p-3">Agency</th><th className="p-3">Corpus status</th><th className="p-3">Entity status</th><th className="p-3">Added</th>
              </tr></thead>
              <tbody>
                {data.rows.map(row => <tr key={row.id} className="border-t align-top hover:bg-muted/20" data-testid={`management-row-${row.id}`}>
                  <td className="p-3"><input type="checkbox" aria-label={`Select ${row.title}`} checked={selected.includes(row.id)} onChange={event => toggleRow(row.id, event.target.checked)} disabled={!canSelect || (!selected.includes(row.id) && selected.length >= 100)} /></td>
                  <td className="max-w-sm p-3"><div className="font-medium">{row.title || "Untitled opportunity"}</div>{row.source && <div className="mt-1 text-xs text-muted-foreground">{row.source}</div>}</td>
                  <td className="p-3">{row.agency || "Not listed"}</td>
                  <td className="p-3"><Badge variant={row.status === "archived" ? "secondary" : "outline"}>{row.status || "Unknown"}</Badge></td>
                  <td className="p-3">{row.entityStatus || "Not in this entity pipeline"}</td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">{formatDate(row.createdAt)}</td>
                </tr>)}
                {data.rows.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No opportunities match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground" data-testid="management-count">Showing {data.total === 0 ? 0 : (page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of {data.total} · 50 per page · selection capped at 100</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage(value => Math.max(1, value - 1))}><ArrowLeft className="mr-1 h-4 w-4" />Previous</Button>
              <span aria-live="polite">Page {page}</span>
              <Button size="sm" variant="outline" disabled={page * data.pageSize >= data.total || isFetching} onClick={() => setPage(value => value + 1)}>Next<ArrowRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        </>}
      </CardContent>
      <AlertDialog open={action !== null} onOpenChange={open => { if (!open && !busy) { setAction(null); setActionError(""); setConfirmation(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action === "purge" ? "Permanently purge opportunities?" : `${actionLabel} opportunities?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {action === "dismiss" && "Dismissal only hides these records from your organization’s queue. Shared records remain in the corpus and may be rediscovered."}
              {action === "restore" && (scope === "entity" ? "Restore these records as tracked pursuits in your organization’s queue. Existing notes and history are retained." : "Restore these records in the shared corpus.")}
              {action === "archive" && "Archive these records in the shared corpus. This does not remove the underlying record."}
              {action === "purge" && "This permanently deletes selected records globally. Downstream references may be affected; records linked to tracked or pipeline data are protected by the server. Deleted records may later be rediscovered."}
              <span className="mt-2 block font-medium">{selected.length} selected. This action cannot be undone where applicable.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {action === "purge" && <Input aria-label={`Type PURGE ${selected.length} to confirm`} placeholder={`Type PURGE ${selected.length}`} value={confirmation} onChange={event => setConfirmation(event.target.value)} data-testid="input-purge-confirmation" />}
          {actionError && <p role="alert" className="text-sm text-destructive" data-testid="bulk-action-error">{actionError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !purgeReady} onClick={event => { event.preventDefault(); void submitBulk(); }} data-testid="button-confirm-bulk">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number | null; detail?: string }) {
  return <div className="min-w-0 rounded-md border bg-background p-3">
    <div className="truncate text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 break-words text-lg font-semibold">{value === null ? "Not available" : typeof value === "number" ? value.toLocaleString() : value}</div>
    {detail && <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div>}
  </div>;
}