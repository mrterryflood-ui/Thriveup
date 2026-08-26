import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, FileText, LockKeyhole, MapPinned, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";

type Gate = {
  id: string; gateKey: string; label: string; requiredDecision: string; status: string; effectiveStatus: string;
  classification: string; namedApprover: string | null; decisionRecord: string | null; reviewedAt: string | null;
  revalidateAt: string | null; notes: string | null; updatedAt: string;
};
type Source = {
  id: string; sourceTitle: string; sourceType: string; geography: string; vintage: string; permittedUse: string;
  applicability: string; limitations: string; sourceReference: string; sourceUrl: string | null; correctsSourceId: string | null; createdAt: string;
};
type Tabletop = { id: string; title: string; scenario: string; stakeholderSetting: string; learningQuestion: string; decisionOwnerCategory: string; actionLearningCadence: string; isSimulated: boolean; createdAt: string; };
type Workspace = {
  packet: { title: string; planningState: string; boundaryStatus: string; boundaryLabel: string; boundarySource: string; boundaryMethod: string; boundaryRecordedAt: string | null; baselineMethod: string; dataVintage: string; updatedAt: string; stakeholderCategories: string[]; stakeholderSettings: string[]; };
  gates: Gate[]; sources: Source[]; tabletops: Tabletop[]; auditEvents: Array<{ id: string; eventType: string; createdAt: string; actorUserId: string | null }>;
  safeguards: Record<string, boolean>;
};

const queryKey = ["/api/east-austin/readiness"];
const blockedActionText = "No pilot execution, recruitment, referral operations, partner-data import, public mapping/classification, cultural-story collection, or publication is enabled.";

function statusTone(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "ready_for_review") return "bg-blue-100 text-blue-900 border-blue-200";
  if (status === "expired") return "bg-rose-100 text-rose-900 border-rose-200";
  return "bg-amber-100 text-amber-900 border-amber-200";
}

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hasDraftValue(draft: Partial<Gate>, field: keyof Gate) {
  return Object.prototype.hasOwnProperty.call(draft, field);
}

export default function EastAustinApprovalReadinessPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [gateDrafts, setGateDrafts] = useState<Record<string, Partial<Gate>>>({});
  const { data, isLoading, error } = useQuery<Workspace>({ queryKey, queryFn: getQueryFn({ on401: "sessionExpired" }) });

  useEffect(() => { document.title = "East Austin Approval Readiness | Private Workspace"; }, []);

  const blockedCount = useMemo(() => data?.gates.filter((gate) => gate.effectiveStatus !== "approved").length ?? 6, [data]);
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const mutation = useMutation({
    mutationFn: async ({ method, path, body }: { method: string; path: string; body: unknown }) => {
      const response = await apiRequest(method, `/api/east-austin/readiness${path}`, body);
      return response.json();
    },
    onSuccess: () => { setMessage("Server record updated. This does not authorize pilot activity or publication."); refresh(); },
    onError: (err: Error) => setMessage(err.message || "The server record could not be updated."),
  });

  function submitGate(event: FormEvent<HTMLFormElement>, gate: Gate) {
    event.preventDefault();
    const draft = gateDrafts[gate.id] || {};
    mutation.mutate({
      method: "PATCH",
      path: `/gates/${gate.gateKey}`,
      body: {
        status: draft.status ?? gate.status,
        classification: draft.classification ?? gate.classification,
        namedApprover: draft.namedApprover ?? gate.namedApprover,
        decisionRecord: draft.decisionRecord ?? gate.decisionRecord,
        ...(hasDraftValue(draft, "reviewedAt") ? { reviewedAt: draft.reviewedAt ? new Date(draft.reviewedAt).toISOString() : null } : {}),
        ...(hasDraftValue(draft, "revalidateAt") ? { revalidateAt: draft.revalidateAt ? new Date(draft.revalidateAt).toISOString() : null } : {}),
        notes: draft.notes ?? gate.notes,
        expectedUpdatedAt: gate.updatedAt,
      },
    });
  }

  function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    mutation.mutate({ method: "POST", path: "/sources", body: { ...values, sourceUrl: values.sourceUrl || null, correctsSourceId: values.correctsSourceId || null } }, { onSuccess: () => form.reset() });
  }

  function submitTabletop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    mutation.mutate({ method: "POST", path: "/tabletops", body: values }, { onSuccess: () => form.reset() });
  }

  if (isLoading) return <main className="max-w-7xl mx-auto p-6"><Card><CardContent className="p-6">Loading private readiness record…</CardContent></Card></main>;
  if (error || !data) return <main className="max-w-4xl mx-auto p-6"><Card className="border-destructive"><CardContent className="p-6 space-y-3">The private readiness record could not be loaded. It remains unavailable rather than showing unverified information.<br /><Button onClick={() => refresh()} data-testid="button-retry-east-austin-readiness">Retry loading</Button></CardContent></Card></main>;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6" data-testid="east-austin-approval-readiness">
      <PageHeader
        title="East Austin Community Bridge — Approval Readiness"
        description="Private, server-backed planning record. It is not a pilot, partnership announcement, public map, or effectiveness claim."
        actions={<Button variant="outline" size="sm" asChild><Link href="/austin-community-bridge/deliverable"><ArrowLeft className="h-4 w-4 mr-2" /> Private deliverable</Link></Button>}
      />

      <Card className="border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white" data-testid="east-austin-readiness-hero">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-white/15 text-white border-white/25">Private staff workspace</Badge>
            <Badge className="bg-amber-300/20 text-amber-100 border-amber-200/30">Six-square geography provisional</Badge>
            <Badge className="bg-rose-300/20 text-rose-100 border-rose-200/30">{blockedCount} release gate{blockedCount === 1 ? "" : "s"} not approved</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Approval before action.</h1>
          <p className="mt-3 max-w-4xl text-slate-200 leading-relaxed">{blockedActionText}</p>
        </CardContent>
      </Card>

      {message && <div role="status" className="rounded-lg border bg-muted px-4 py-3 text-sm" data-testid="east-austin-readiness-message">{message}</div>}

      <section aria-labelledby="operating-surfaces-heading" data-testid="east-austin-operating-surfaces">
        <Card>
          <CardHeader>
            <CardTitle id="operating-surfaces-heading">Map, understand, compare, and act</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
            <Link href="/community-map" className="rounded-lg border p-4 hover:border-primary">
              <strong>Map conditions by location</strong><br />
              <span className="text-muted-foreground">Community Map: place context and locally relevant conditions.</span>
            </Link>
            <Link href="/community-impact" className="rounded-lg border p-4 hover:border-primary">
              <strong>Understand community impact</strong><br />
              <span className="text-muted-foreground">Community Impact: evidence, interventions, and learning context.</span>
            </Link>
            <Link href="/resources" className="rounded-lg border p-4 hover:border-primary">
              <strong>Find resources and next steps</strong><br />
              <span className="text-muted-foreground">Resource Finder: available supports by need and location.</span>
            </Link>
            <Link href="/navigator" className="rounded-lg border p-4 hover:border-primary">
              <strong>Learn about a neighborhood</strong><br />
              <span className="text-muted-foreground">Navigator: grounded questions with clear limits and sources.</span>
            </Link>
            <Link href="/equity-loss/national" className="rounded-lg border p-4 hover:border-primary">
              <strong>Compare states and disparities</strong><br />
              <span className="text-muted-foreground">Nationwide Equity-Loss: availability-aware state and county comparisons.</span>
            </Link>
            <Link href="/policy-engine" className="rounded-lg border p-4 hover:border-primary">
              <strong>Review policy context</strong><br />
              <span className="text-muted-foreground">Policy Engine: policy options and their implementation questions.</span>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6" aria-labelledby="scope-heading">
        <Card>
          <CardHeader><CardTitle id="scope-heading" className="flex items-center gap-2"><MapPinned className="h-5 w-5" /> Provisional territory record</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><p className="font-semibold">{data.packet.boundaryLabel}</p><Badge variant="outline" className="mt-2">{readable(data.packet.boundaryStatus)}</Badge></div>
            <dl className="grid sm:grid-cols-2 gap-3">
              <div><dt className="text-muted-foreground">Boundary source</dt><dd>{data.packet.boundarySource}</dd></div>
              <div><dt className="text-muted-foreground">Boundary method</dt><dd>{data.packet.boundaryMethod}</dd></div>
              <div><dt className="text-muted-foreground">Baseline method</dt><dd>{data.packet.baselineMethod}</dd></div>
              <div><dt className="text-muted-foreground">Data vintage</dt><dd>{data.packet.dataVintage}</dd></div>
            </dl>
            <p className="text-muted-foreground">A geographic classification is blocked until a reproducible boundary, source, method, vintage, date, and approval are recorded.</p>
            <details className="rounded border p-3">
              <summary className="cursor-pointer font-semibold">Record geography and baseline method</summary>
              <form className="mt-3 grid sm:grid-cols-2 gap-3" onSubmit={(event) => {
                event.preventDefault();
                const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                mutation.mutate({ method: "PATCH", path: "/geography", body: { ...values, boundaryRecordedAt: new Date(String(values.boundaryRecordedAt)).toISOString(), expectedUpdatedAt: data.packet.updatedAt } });
              }}>
                <label className="text-xs font-medium sm:col-span-2">Boundary label<input required name="boundaryLabel" defaultValue={data.packet.boundaryLabel} className="mt-1 w-full rounded border bg-background p-2" /></label>
                <label className="text-xs font-medium">Boundary source<input required name="boundarySource" defaultValue={data.packet.boundarySource} className="mt-1 w-full rounded border bg-background p-2" /></label>
                <label className="text-xs font-medium">Boundary method<input required name="boundaryMethod" defaultValue={data.packet.boundaryMethod} className="mt-1 w-full rounded border bg-background p-2" /></label>
                <label className="text-xs font-medium">Baseline method<input required name="baselineMethod" defaultValue={data.packet.baselineMethod} className="mt-1 w-full rounded border bg-background p-2" /></label>
                <label className="text-xs font-medium">Data vintage<input required name="dataVintage" defaultValue={data.packet.dataVintage} className="mt-1 w-full rounded border bg-background p-2" /></label>
                <label className="text-xs font-medium">Boundary record date<input required type="datetime-local" name="boundaryRecordedAt" defaultValue={asDateTimeLocal(data.packet.boundaryRecordedAt)} className="mt-1 w-full rounded border bg-background p-2" /></label>
                <Button type="submit" size="sm" className="w-fit" disabled={mutation.isPending}>Save geography record</Button>
              </form>
            </details>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Stakeholder settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">{data.packet.stakeholderCategories.map((category) => <Badge key={category} variant="secondary">{readable(category)}</Badge>)}</div>
            <div className="flex flex-wrap gap-2">{data.packet.stakeholderSettings.map((setting) => <Badge key={setting} variant="outline">{readable(setting)}</Badge>)}</div>
            <p className="text-sm text-muted-foreground">These are planning categories, not participant lists or partner commitments.</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="gates-heading" className="space-y-4" data-testid="east-austin-readiness-gates">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Six independent release gates</p><h2 id="gates-heading" className="text-2xl font-bold">Nothing moves forward because another gate looks ready.</h2></div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.gates.map((gate) => {
            const draft = gateDrafts[gate.id] || {};
            return <Card key={gate.id} className="flex flex-col">
              <CardHeader className="pb-3"><div className="flex items-start justify-between gap-2"><CardTitle className="text-base">{gate.label}</CardTitle><Badge className={statusTone(gate.effectiveStatus)}>{readable(gate.effectiveStatus)}</Badge></div></CardHeader>
              <CardContent className="flex flex-col flex-1 gap-3 text-sm">
                <p>{gate.requiredDecision}</p>
                <p className="text-muted-foreground">Classification: {readable(gate.classification)}</p>
                <details className="rounded border p-3">
                  <summary className="cursor-pointer font-semibold">Record staff review</summary>
                  <form className="mt-3 space-y-2" onSubmit={(event) => submitGate(event, gate)}>
                    <label className="block text-xs font-medium">Status<select className="mt-1 w-full rounded border bg-background p-2" value={draft.status ?? gate.status} onChange={(event) => setGateDrafts((current) => ({ ...current, [gate.id]: { ...draft, status: event.target.value } }))}><option value="blocked">Blocked</option><option value="ready_for_review">Ready for review</option><option value="approved">Approved</option><option value="expired">Expired</option></select></label>
                    <label className="block text-xs font-medium">Named approver<input className="mt-1 w-full rounded border bg-background p-2" value={draft.namedApprover ?? gate.namedApprover ?? ""} onChange={(event) => setGateDrafts((current) => ({ ...current, [gate.id]: { ...draft, namedApprover: event.target.value } }))} /></label>
                    <label className="block text-xs font-medium">Decision record / reference<input className="mt-1 w-full rounded border bg-background p-2" value={draft.decisionRecord ?? gate.decisionRecord ?? ""} onChange={(event) => setGateDrafts((current) => ({ ...current, [gate.id]: { ...draft, decisionRecord: event.target.value } }))} /></label>
                    <label className="block text-xs font-medium">Reviewed at<input type="datetime-local" className="mt-1 w-full rounded border bg-background p-2" value={hasDraftValue(draft, "reviewedAt") ? draft.reviewedAt ?? "" : asDateTimeLocal(gate.reviewedAt)} onChange={(event) => setGateDrafts((current) => ({ ...current, [gate.id]: { ...draft, reviewedAt: event.target.value || null } }))} /></label>
                    <label className="block text-xs font-medium">Revalidate at (optional)<input type="datetime-local" className="mt-1 w-full rounded border bg-background p-2" value={hasDraftValue(draft, "revalidateAt") ? draft.revalidateAt ?? "" : asDateTimeLocal(gate.revalidateAt)} onChange={(event) => setGateDrafts((current) => ({ ...current, [gate.id]: { ...draft, revalidateAt: event.target.value || null } }))} /></label>
                    <label className="block text-xs font-medium">Review notes<textarea className="mt-1 w-full rounded border bg-background p-2" rows={2} value={draft.notes ?? gate.notes ?? ""} onChange={(event) => setGateDrafts((current) => ({ ...current, [gate.id]: { ...draft, notes: event.target.value } }))} /></label>
                    <Button type="submit" size="sm" disabled={mutation.isPending}>Save server record</Button>
                  </form>
                </details>
              </CardContent>
            </Card>;
          })}
        </div>
      </section>

      <section className="grid xl:grid-cols-2 gap-6">
        <Card data-testid="east-austin-source-register">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Source and evidence register</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.sources.length === 0 ? <p className="text-sm text-muted-foreground">No source has been recorded yet. Absence is visible; do not infer a baseline or an evidence claim.</p> : data.sources.map((source) => <article key={source.id} className="rounded border p-3 text-sm space-y-1"><div className="flex justify-between gap-2"><strong>{source.sourceTitle}</strong><Badge variant="outline">{readable(source.applicability)}</Badge></div><p>{source.geography} · {source.vintage} · {readable(source.sourceType)}</p><p className="text-muted-foreground">Reference: {source.sourceReference}</p><p className="text-muted-foreground">Permitted use: {source.permittedUse}</p><p className="text-muted-foreground">Limitations: {source.limitations}</p>{source.correctsSourceId && <p className="text-muted-foreground">Corrects prior source record: {source.correctsSourceId}</p>}{source.sourceUrl && <a className="text-primary underline" href={source.sourceUrl} target="_blank" rel="noreferrer">Open supplied source</a>}</article>)}
            <form onSubmit={submitSource} className="border-t pt-4 grid sm:grid-cols-2 gap-3">
              <p className="sm:col-span-2 text-sm font-semibold">Add a planning source — no person-level or partner-operational data</p>
              <label className="text-xs font-medium">Title<input required name="sourceTitle" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium">Type<select required name="sourceType" className="mt-1 w-full rounded border bg-background p-2"><option value="public_data">Public data</option><option value="public_evidence">Public evidence</option><option value="internal_planning">Internal planning</option><option value="restricted_pending">Restricted pending</option></select></label>
              <label className="text-xs font-medium">Geography<input required name="geography" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium">Vintage<input required name="vintage" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Permitted use<textarea required name="permittedUse" rows={2} className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium">Applicability<select required name="applicability" className="mt-1 w-full rounded border bg-background p-2"><option value="direct_match">Direct match</option><option value="related_setting_limited">Related / setting-limited</option><option value="process_support">Process support</option><option value="not_yet_mapped">Not yet mapped</option></select></label>
              <label className="text-xs font-medium">Reference<input required name="sourceReference" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Limitations<textarea required name="limitations" rows={2} className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Public URL (optional)<input type="url" name="sourceUrl" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Correct a prior source (optional)<select name="correctsSourceId" className="mt-1 w-full rounded border bg-background p-2"><option value="">New source record</option>{data.sources.map((source) => <option key={source.id} value={source.id}>{source.sourceTitle}</option>)}</select></label>
              <p className="sm:col-span-2 text-xs text-muted-foreground">The register is append-only. To correct a source, add its replacement and identify the prior record; historical evidence remains visible for review.</p>
              <Button type="submit" className="w-fit" disabled={mutation.isPending}>Add source record</Button>
            </form>
          </CardContent>
        </Card>

        <Card data-testid="east-austin-tabletop">
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Simulated MESH-informed tabletop</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="inline h-4 w-4 mr-1" /> Tabletop entries are planning simulations for shared intelligence, readiness, training, and coordination. They do not copy MESH materials or establish Austin approval.</div>
            {data.tabletops.length === 0 ? <p className="text-sm text-muted-foreground">No simulated tabletop has been recorded.</p> : data.tabletops.map((tabletop) => <article key={tabletop.id} className="rounded border p-3 text-sm space-y-1"><div className="flex justify-between gap-2"><strong>{tabletop.title}</strong><Badge variant="outline">Simulated</Badge></div><p>{tabletop.scenario}</p><p className="text-muted-foreground">Setting: {readable(tabletop.stakeholderSetting)} · Owner category: {tabletop.decisionOwnerCategory}</p><p className="text-muted-foreground">Learning cadence: {tabletop.actionLearningCadence}</p></article>)}
            <form onSubmit={submitTabletop} className="border-t pt-4 grid sm:grid-cols-2 gap-3">
              <p className="sm:col-span-2 text-sm font-semibold">Record a simulated readiness exercise</p>
              <label className="text-xs font-medium sm:col-span-2">Title<input required name="title" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Scenario<textarea required name="scenario" rows={2} className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium">Stakeholder setting<select required name="stakeholderSetting" className="mt-1 w-full rounded border bg-background p-2"><option value="inner_setting">Inner setting</option><option value="outer_setting">Outer setting</option><option value="cross_setting">Cross-setting</option></select></label>
              <label className="text-xs font-medium">Decision owner category<input required name="decisionOwnerCategory" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Learning question<textarea required name="learningQuestion" rows={2} className="mt-1 w-full rounded border bg-background p-2" /></label>
              <label className="text-xs font-medium sm:col-span-2">Action-learning cadence<input required name="actionLearningCadence" placeholder="e.g., review after simulated exercise; no implementation action" className="mt-1 w-full rounded border bg-background p-2" /></label>
              <Button type="submit" className="w-fit" disabled={mutation.isPending}>Add simulated tabletop</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Planning-only safeguards</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">{Object.entries(data.safeguards).map(([key, value]) => <p key={key} className="flex gap-2"><LockKeyhole className="h-4 w-4 mt-0.5 text-muted-foreground" /> {readable(key)}: {value ? "enforced" : "not established"}</p>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Decision history</CardTitle></CardHeader>
          <CardContent>{data.auditEvents.length === 0 ? <p className="text-sm text-muted-foreground">No server audit events are available.</p> : <ol className="space-y-2 text-sm">{data.auditEvents.map((event) => <li key={event.id} className="border-l-2 pl-3"><span className="font-semibold">{readable(event.eventType)}</span><br /><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()} · actor recorded server-side</span></li>)}</ol>}</CardContent>
        </Card>
      </section>
    </main>
  );
}