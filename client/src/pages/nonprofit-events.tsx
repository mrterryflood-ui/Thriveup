import { cloneElement, useEffect, useId, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, CalendarDays, CheckCircle2, Download, FileWarning, HeartHandshake, ListTodo, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorRetry } from "@/components/error-retry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentOrgId } from "@/hooks/use-current-org";

type Attendance = {
  id: string; invitedCount: number | null; registeredCount: number | null; attendedCount: number | null; followUpCount: number | null;
  valueSource: string; updatedAt: string;
};
type Need = { id: string; needArea: string; sourceName: string; sourceUrl: string | null; geography: string; evidenceStatus: string; responseExplanation: string };
type Action = { id: string; title: string; ownerLabel: string; dueDate: string | null; status: string; completionEvidence: string | null; nextStep: string | null };
type Story = { id: string; title: string; storyText: string; attributionPreference: string; intendedAudience: string; permittedUses: string[]; consentGranted: boolean; sharingState: string };
type CommunityEvent = {
  id: string; title: string; purpose: string; eventDate: string; startTime: string | null; endTime: string | null; format: string;
  locationName: string | null; locationDetails: string | null; serviceArea: string; status: string; communityNeedFocus: string[];
  updatedAt: string; attendance: Attendance | null; needs: Need[]; actions: Action[]; stories: Story[];
};
type Summary = {
  eventCount: number; archivedEventCount: number; needsLinked: number;
  actions: { total: number; completed: number; blocked: number; overdue: number };
  attendance: Record<string, { value: number | null; disclosure: string }> & { attendanceRatePct: number | null; attendanceRateDisclosure: string; sourceLabels: string[] };
};
type Workspace = { organization: { id: string; name: string }; events: CommunityEvent[]; summary: Summary; privacyNotice: string };
type Report = { disclosure: string; organizations: Array<{ organization: string; orgId: string; summary: Summary }> };
type AuditEntry = { id: string; entityType: string; action: string; createdAt: string; details: Record<string, unknown> };

const emptyEvent = { title: "", purpose: "", eventDate: "", startTime: "", endTime: "", serviceArea: "", format: "in_person", locationName: "", locationDetails: "", communityNeedFocus: "" };
const emptyNeed = { needArea: "", sourceName: "", sourceUrl: "", geography: "", evidenceStatus: "self_reported", responseExplanation: "" };
const emptyAction = { title: "", ownerLabel: "", dueDate: "", status: "planned", completionEvidence: "", nextStep: "" };
const emptyStory = { title: "", storyText: "", attributionPreference: "anonymous", intendedAudience: "private", permittedUses: "", consentGranted: false, readyToShare: false };

function toCount(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function countLabel(value: { value: number | null; disclosure: string }) {
  return value.value === null ? value.disclosure : String(value.value);
}

function actionIsOverdue(action: Action) {
  return Boolean(action.dueDate) && action.dueDate! < new Date().toISOString().slice(0, 10) && action.status !== "completed";
}

function useWorkspaceMutation<T, V = void>(request: (value: V) => Promise<T>, success: string, refresh: () => Promise<void>) {
  const { toast } = useToast();
  return useMutation<T, Error, V>({
    mutationFn: request,
    onSuccess: () => {
      void refresh();
      toast({ title: success });
    },
    onError: (error) => toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });
}

export default function NonprofitEventsPage() {
  const { toast } = useToast();
  const { orgId } = useCurrentOrgId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [attendanceForm, setAttendanceForm] = useState({ invitedCount: "", registeredCount: "", attendedCount: "", followUpCount: "", valueSource: "self_reported" });
  const [needForm, setNeedForm] = useState(emptyNeed);
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null);
  const [actionForm, setActionForm] = useState(emptyAction);
  const [storyForm, setStoryForm] = useState(emptyStory);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [reportFilters, setReportFilters] = useState({ serviceArea: "", needArea: "", startDate: "", endDate: "" });

  const workspaceQuery = useQuery<Workspace>({
    queryKey: ["/api/nonprofit-events/workspace", orgId ?? "default"],
    queryFn: async () => (await apiRequest("GET", "/api/nonprofit-events/workspace")).json(),
  });
  const events = workspaceQuery.data?.events ?? [];
  const selected = useMemo(() => events.find((event) => event.id === selectedId) ?? events[0] ?? null, [events, selectedId]);

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setAttendanceForm({
      invitedCount: selected.attendance?.invitedCount?.toString() ?? "",
      registeredCount: selected.attendance?.registeredCount?.toString() ?? "",
      attendedCount: selected.attendance?.attendedCount?.toString() ?? "",
      followUpCount: selected.attendance?.followUpCount?.toString() ?? "",
       valueSource: selected.attendance?.valueSource ?? "self_reported",
    });
  }, [selected?.id, selected?.attendance?.id, selected?.attendance?.updatedAt]);

  useEffect(() => {
    setSelectedId(null);
    setNeedForm(emptyNeed);
    setEditingNeedId(null);
    setActionForm(emptyAction);
    setStoryForm(emptyStory);
    setEditingStoryId(null);
    setReport(null);
  }, [orgId]);

  useEffect(() => {
    setNeedForm(emptyNeed);
    setEditingNeedId(null);
    setActionForm(emptyAction);
    setStoryForm(emptyStory);
    setEditingStoryId(null);
  }, [selected?.id]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/nonprofit-events/workspace"] });
  };
  const createEvent = useWorkspaceMutation(async () => {
    const res = await apiRequest("POST", "/api/nonprofit-events/events", {
      ...eventForm,
      startTime: eventForm.startTime || null,
      endTime: eventForm.endTime || null,
      locationName: eventForm.locationName || null,
      locationDetails: eventForm.locationDetails || null,
      communityNeedFocus: eventForm.communityNeedFocus.split(",").map((item) => item.trim()).filter(Boolean),
    });
    return res.json();
  }, "Event created", refresh);
  const updateEvent = useWorkspaceMutation<unknown, { id: string; payload: Record<string, unknown> }>(async ({ id, payload }) => {
    const res = await apiRequest("PATCH", `/api/nonprofit-events/events/${id}`, payload);
    return res.json();
  }, "Event details updated", refresh);
  const saveAttendance = useWorkspaceMutation(async () => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await apiRequest("PUT", `/api/nonprofit-events/events/${selected.id}/attendance`, {
      invitedCount: toCount(attendanceForm.invitedCount), registeredCount: toCount(attendanceForm.registeredCount),
      attendedCount: toCount(attendanceForm.attendedCount), followUpCount: toCount(attendanceForm.followUpCount),
       valueSource: attendanceForm.valueSource,
    });
    return res.json();
  }, "Aggregate attendance saved", refresh);
  const addNeed = useWorkspaceMutation(async () => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await apiRequest("POST", `/api/nonprofit-events/events/${selected.id}/needs`, { ...needForm, sourceUrl: needForm.sourceUrl || null });
    return res.json();
  }, "Community need linked", refresh);
  const updateNeed = useWorkspaceMutation<unknown, { id: string; payload: Record<string, unknown> }>(async ({ id, payload }) => {
    const res = await apiRequest("PATCH", `/api/nonprofit-events/needs/${id}`, payload);
    return res.json();
  }, "Community need updated", refresh);
  const removeNeed = useWorkspaceMutation<unknown, string>(async (needId) => {
    const res = await apiRequest("DELETE", `/api/nonprofit-events/needs/${needId}`);
    return res.json();
  }, "Community need removed", refresh);
  const addAction = useWorkspaceMutation(async () => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await apiRequest("POST", `/api/nonprofit-events/events/${selected.id}/actions`, { ...actionForm, dueDate: actionForm.dueDate || null, completionEvidence: actionForm.completionEvidence || null, nextStep: actionForm.nextStep || null });
    return res.json();
  }, "Action created", refresh);
  const updateAction = useWorkspaceMutation<unknown, { id: string; status: string; completionEvidence?: string }>(async (input) => {
    const res = await apiRequest("PATCH", `/api/nonprofit-events/actions/${input.id}`, { status: input.status, completionEvidence: input.completionEvidence ?? null });
    return res.json();
  }, "Action updated", refresh);
  const saveStory = useWorkspaceMutation(async () => {
    if (!selected) throw new Error("Choose an event first.");
    const payload = {
      title: storyForm.title,
      storyText: storyForm.storyText,
      attributionPreference: storyForm.attributionPreference,
      intendedAudience: storyForm.intendedAudience,
      permittedUses: storyForm.permittedUses.split(",").map((item) => item.trim()).filter(Boolean),
      consentGranted: storyForm.consentGranted,
      sharingState: storyForm.readyToShare ? "approved" : "draft",
    };
    const res = await apiRequest(editingStoryId ? "PATCH" : "POST", editingStoryId ? `/api/nonprofit-events/stories/${editingStoryId}` : `/api/nonprofit-events/events/${selected.id}/stories`, payload);
    return res.json();
  }, "Story saved", refresh);
  const withdrawStory = useWorkspaceMutation<unknown, string>(async (storyId) => {
    const res = await apiRequest("PATCH", `/api/nonprofit-events/stories/${storyId}`, { sharingState: "withdrawn" });
    return res.json();
  }, "Story consent withdrawn", refresh);
  const archiveEvent = useWorkspaceMutation(async () => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await apiRequest("POST", `/api/nonprofit-events/events/${selected.id}/archive`);
    return res.json();
  }, "Event archived", refresh);
  const runReport = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams(Object.entries(reportFilters).filter(([, value]) => value));
      const res = await apiRequest("GET", `/api/nonprofit-events/report?${params}`);
      return res.json() as Promise<Report>;
    },
    onSuccess: setReport,
    onError: (error: Error) => toast({ title: "Staff report unavailable", description: error.message, variant: "destructive" }),
  });

  const downloadReport = () => {
    if (!report) return;
    const text = [
      ["Organization", "Events", "Invited", "Registered", "Attended", "Follow-up", "Attendance rate", "Needs linked", "Actions completed", "Blocked actions", "Overdue actions"],
      ...report.organizations.map((row) => [
        row.organization, String(row.summary.eventCount), countLabel(row.summary.attendance.invitedCount), countLabel(row.summary.attendance.registeredCount),
        countLabel(row.summary.attendance.attendedCount), countLabel(row.summary.attendance.followUpCount),
        row.summary.attendance.attendanceRatePct === null ? row.summary.attendance.attendanceRateDisclosure : `${row.summary.attendance.attendanceRatePct}%`,
        String(row.summary.needsLinked), String(row.summary.actions.completed), String(row.summary.actions.blocked), String(row.summary.actions.overdue),
      ]),
    ].map((line) => line.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const anchor = document.createElement("a");
    const objectUrl = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    anchor.href = objectUrl;
    anchor.download = "nonprofit-community-events-report.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  };

  if (workspaceQuery.isLoading) return <main className="container max-w-7xl py-8" aria-live="polite"><p data-testid="nonprofit-events-loading">Loading your organization workspace…</p></main>;
  if (workspaceQuery.isError) return <main className="container max-w-7xl py-8"><ErrorRetry message={(workspaceQuery.error as Error).message} onRetry={() => workspaceQuery.refetch()} /></main>;
  if (!workspaceQuery.data) return <main className="container max-w-7xl py-8"><ErrorRetry message="The event workspace did not return data. Please try again." onRetry={() => workspaceQuery.refetch()} /></main>;
  const workspace = workspaceQuery.data;
  const summary = workspace.summary;

  return (
    <main className="container max-w-7xl py-6 space-y-6" data-testid="nonprofit-events-workspace">
      <PageHeader
        title="Community Events & Impact"
        description={`A private planning and learning workspace for ${workspace.organization.name}.`}
        breadcrumbs={[{ label: "My Organization", href: "/settings/organization" }, { label: "Community Events & Impact" }]}
      />
      <Card className="border-primary/30 bg-primary/5" data-testid="nonprofit-events-privacy-note">
        <CardContent className="p-4 flex gap-3 text-sm">
          <FileWarning className="h-5 w-5 shrink-0 text-primary" />
          <p>{workspace.privacyNotice} Do not enter attendee names, contact details, demographic inferences, or unsupported outcome claims.</p>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Organization impact summary">
        <SummaryCard icon={<CalendarDays />} label="Active events" value={String(summary.eventCount)} detail={`${summary.archivedEventCount} archived`} />
        <SummaryCard icon={<Users />} label="Attendance" value={countLabel(summary.attendance.attendedCount)} detail={summary.attendance.attendedCount.disclosure} />
        <SummaryCard icon={<HeartHandshake />} label="Needs linked" value={String(summary.needsLinked)} detail="Source and geography recorded" />
        <SummaryCard icon={<ListTodo />} label="Actions" value={`${summary.actions.completed}/${summary.actions.total}`} detail={`${summary.actions.blocked} blocked · ${summary.actions.overdue} overdue`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Plan an event</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createEvent.mutate(undefined, { onSuccess: () => setEventForm(emptyEvent) }); }}>
              <Field label="Event title"><Input required value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} data-testid="input-event-title" /></Field>
              <Field label="Purpose"><Textarea required value={eventForm.purpose} onChange={(event) => setEventForm({ ...eventForm, purpose: event.target.value })} data-testid="input-event-purpose" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date"><Input required type="date" value={eventForm.eventDate} onChange={(event) => setEventForm({ ...eventForm, eventDate: event.target.value })} data-testid="input-event-date" /></Field>
                <Field label="Format"><select className="control" value={eventForm.format} onChange={(event) => setEventForm({ ...eventForm, format: event.target.value })}><option value="in_person">In person</option><option value="virtual">Virtual</option><option value="hybrid">Hybrid</option></select></Field>
              </div>
               <div className="grid grid-cols-2 gap-3">
                 <Field label="Start time"><Input type="time" value={eventForm.startTime} onChange={(event) => setEventForm({ ...eventForm, startTime: event.target.value })} /></Field>
                 <Field label="End time"><Input type="time" value={eventForm.endTime} onChange={(event) => setEventForm({ ...eventForm, endTime: event.target.value })} /></Field>
               </div>
              <Field label="Service area"><Input required placeholder="e.g., Wichita, KS" value={eventForm.serviceArea} onChange={(event) => setEventForm({ ...eventForm, serviceArea: event.target.value })} data-testid="input-event-service-area" /></Field>
              <Field label="Location or meeting details"><Input value={eventForm.locationName} onChange={(event) => setEventForm({ ...eventForm, locationName: event.target.value })} /></Field>
              <Field label="Community focus areas"><Input placeholder="Separated by commas" value={eventForm.communityNeedFocus} onChange={(event) => setEventForm({ ...eventForm, communityNeedFocus: event.target.value })} /></Field>
              <Button className="w-full" disabled={createEvent.isPending} type="submit" data-testid="button-create-community-event"><Plus className="mr-2 h-4 w-4" />Create private event</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Organization events</CardTitle></CardHeader>
            <CardContent>
              {events.length === 0 ? <p className="text-sm text-muted-foreground" data-testid="nonprofit-events-empty">No events recorded yet. Start with the event you are planning; attendance and learning records can be added as information becomes available.</p> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {events.map((event) => <button key={event.id} type="button" aria-pressed={selected?.id === event.id} onClick={() => setSelectedId(event.id)} className={`rounded-lg border p-4 text-left transition-colors ${selected?.id === event.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} data-testid={`event-card-${event.id}`}>
                    <div className="flex items-start justify-between gap-2"><strong>{event.title}</strong><Badge variant={event.status === "archived" ? "secondary" : "outline"}>{event.status}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">{event.eventDate} · {event.serviceArea}</p>
                    <p className="mt-2 line-clamp-2 text-sm">{event.purpose}</p>
                  </button>)}
                </div>
              )}
            </CardContent>
          </Card>

          {selected && <EventDetail
            event={selected}
            attendanceForm={attendanceForm}
            setAttendanceForm={setAttendanceForm}
            needForm={needForm}
            setNeedForm={setNeedForm}
            editingNeedId={editingNeedId}
            onSaveEvent={(payload) => updateEvent.mutate({
              id: selected.id,
              payload: { ...payload, startTime: payload.startTime || null, endTime: payload.endTime || null },
            })}
            actionForm={actionForm}
            setActionForm={setActionForm}
            storyForm={storyForm}
            setStoryForm={setStoryForm}
            editingStoryId={editingStoryId}
            onSaveAttendance={() => saveAttendance.mutate()}
            onAddNeed={() => {
              const payload = { ...needForm, sourceUrl: needForm.sourceUrl || null };
              if (editingNeedId) updateNeed.mutate({ id: editingNeedId, payload }, { onSuccess: () => { setNeedForm(emptyNeed); setEditingNeedId(null); } });
              else addNeed.mutate(undefined, { onSuccess: () => { setNeedForm(emptyNeed); setEditingNeedId(null); } });
            }}
            onEditNeed={(need) => { setEditingNeedId(need.id); setNeedForm({ needArea: need.needArea, sourceName: need.sourceName, sourceUrl: need.sourceUrl ?? "", geography: need.geography, evidenceStatus: need.evidenceStatus, responseExplanation: need.responseExplanation }); }}
            onCancelNeedEdit={() => { setEditingNeedId(null); setNeedForm(emptyNeed); }}
            onRemoveNeed={(id) => { if (window.confirm("Remove this need link? Its audit history will remain.")) removeNeed.mutate(id); }}
            onAddAction={() => addAction.mutate(undefined, { onSuccess: () => setActionForm(emptyAction) })}
            onUpdateAction={(input) => updateAction.mutate(input)}
            onSaveStory={() => saveStory.mutate(undefined, { onSuccess: () => { setStoryForm(emptyStory); setEditingStoryId(null); } })}
            onEditStory={(story) => { setEditingStoryId(story.id); setStoryForm({ title: story.title, storyText: story.storyText, attributionPreference: story.attributionPreference, intendedAudience: story.intendedAudience, permittedUses: story.permittedUses.join(", "), consentGranted: story.consentGranted, readyToShare: story.sharingState === "approved" }); }}
            onClearStory={() => { setEditingStoryId(null); setStoryForm(emptyStory); }}
            onWithdrawStory={(id) => withdrawStory.mutate(id)}
            onArchive={() => { if (window.confirm("Archive this event? It will become read-only and cannot be unarchived.")) archiveEvent.mutate(); }}
            archived={selected.status === "archived"}
            pending={{
              event: updateEvent.isPending || archiveEvent.isPending,
              attendance: saveAttendance.isPending,
              need: addNeed.isPending || updateNeed.isPending || removeNeed.isPending,
              action: addAction.isPending || updateAction.isPending,
              story: saveStory.isPending || withdrawStory.isPending,
            }}
          />}
        </div>
      </section>

      <Card data-testid="nonprofit-events-staff-report">
        <CardHeader className="flex-row items-center justify-between gap-3"><div><CardTitle className="text-base">Staff reporting</CardTitle><p className="mt-1 text-sm text-muted-foreground">Staff-only, non-identifying aggregate review for this active organization. Stories are never included.</p></div><Button type="button" variant="outline" onClick={() => runReport.mutate()} disabled={runReport.isPending} data-testid="button-run-nonprofit-report">Run report</Button></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Service area"><Input value={reportFilters.serviceArea} onChange={(event) => setReportFilters({ ...reportFilters, serviceArea: event.target.value })} /></Field>
            <Field label="Need area"><Input value={reportFilters.needArea} onChange={(event) => setReportFilters({ ...reportFilters, needArea: event.target.value })} /></Field>
            <Field label="From"><Input type="date" value={reportFilters.startDate} onChange={(event) => setReportFilters({ ...reportFilters, startDate: event.target.value })} /></Field>
            <Field label="To"><Input type="date" value={reportFilters.endDate} onChange={(event) => setReportFilters({ ...reportFilters, endDate: event.target.value })} /></Field>
          </div>
          {report && <div className="space-y-3" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{report.disclosure}</p><Button type="button" size="sm" variant="outline" onClick={downloadReport} data-testid="button-download-nonprofit-report"><Download className="mr-2 h-4 w-4" />Download CSV</Button></div>
            {report.organizations.length === 0 ? <p className="text-sm text-muted-foreground">No records matched these filters.</p> : report.organizations.map((row) => <div key={row.orgId} className="rounded-md border p-3 text-sm"><strong>{row.organization}</strong><p className="mt-1">{row.summary.eventCount} events · attended: {countLabel(row.summary.attendance.attendedCount)} · needs linked: {row.summary.needsLinked} · completed actions: {row.summary.actions.completed}</p></div>)}
          </div>}
        </CardContent>
      </Card>
      <style>{`.control{display:flex;height:2.25rem;width:100%;border-radius:.375rem;border:1px solid hsl(var(--input));background:hsl(var(--background));padding:.25rem .75rem;font-size:.875rem}.control:focus{outline:2px solid hsl(var(--ring));outline-offset:2px}.control option[value="first_name"],.control option[value="named"]{display:none}`}</style>
    </main>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{label}</span></div><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  const field = cloneElement(children, { id: children.props.id ?? id });
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{field}</div>;
}

function EventDetail(props: {
  event: CommunityEvent; attendanceForm: Record<string, string>; setAttendanceForm: (value: any) => void; needForm: typeof emptyNeed; setNeedForm: (value: any) => void;
  editingNeedId: string | null; onSaveEvent: (payload: Record<string, unknown>) => void;
  actionForm: typeof emptyAction; setActionForm: (value: any) => void; storyForm: typeof emptyStory; setStoryForm: (value: any) => void; editingStoryId: string | null;
  onSaveAttendance: () => void; onAddNeed: () => void; onEditNeed: (need: Need) => void; onCancelNeedEdit: () => void; onRemoveNeed: (id: string) => void; onAddAction: () => void; onUpdateAction: (input: { id: string; status: string; completionEvidence?: string }) => void;
  onSaveStory: () => void; onEditStory: (story: Story) => void; onClearStory: () => void; onWithdrawStory: (id: string) => void; onArchive: () => void; archived: boolean;
  pending: { event: boolean; attendance: boolean; need: boolean; action: boolean; story: boolean };
}) {
  const { event, archived } = props;
  const [eventDraft, setEventDraft] = useState({ title: event.title, purpose: event.purpose, eventDate: event.eventDate, startTime: event.startTime ?? "", endTime: event.endTime ?? "", serviceArea: event.serviceArea, locationName: event.locationName ?? "", locationDetails: event.locationDetails ?? "", format: event.format, status: event.status, communityNeedFocus: event.communityNeedFocus.join(", ") });
  const [actionEvidence, setActionEvidence] = useState<Record<string, string>>({});

  useEffect(() => {
    setEventDraft({ title: event.title, purpose: event.purpose, eventDate: event.eventDate, startTime: event.startTime ?? "", endTime: event.endTime ?? "", serviceArea: event.serviceArea, locationName: event.locationName ?? "", locationDetails: event.locationDetails ?? "", format: event.format, status: event.status, communityNeedFocus: event.communityNeedFocus.join(", ") });
    setActionEvidence({});
  }, [event.id, event.updatedAt]);

  return <div className="space-y-6" data-testid="community-event-detail">
    <Card><CardHeader className="flex-row items-center justify-between gap-3"><div><CardTitle>{event.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{event.eventDate} · {event.format.replace("_", " ")} · {event.serviceArea}</p></div>{!archived && <Button variant="outline" onClick={props.onArchive} data-testid="button-archive-community-event"><Archive className="mr-2 h-4 w-4" />Archive</Button>}</CardHeader><CardContent><p className="text-sm">{event.purpose}</p>{archived && <p className="mt-3 text-sm text-muted-foreground">This event is archived and read-only, preserving its audit trail.</p>}</CardContent></Card>
    {!archived && <Card><CardHeader><CardTitle className="text-base">Event planning details</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-2" onSubmit={(form) => { form.preventDefault(); props.onSaveEvent({ ...eventDraft, locationName: eventDraft.locationName || null, locationDetails: eventDraft.locationDetails || null, communityNeedFocus: eventDraft.communityNeedFocus.split(",").map((item) => item.trim()).filter(Boolean) }); }}><Field label="Event title"><Input required value={eventDraft.title} onChange={(input) => setEventDraft({ ...eventDraft, title: input.target.value })} /></Field><Field label="Date"><Input required type="date" value={eventDraft.eventDate} onChange={(input) => setEventDraft({ ...eventDraft, eventDate: input.target.value })} /></Field><Field label="Purpose"><Textarea required value={eventDraft.purpose} onChange={(input) => setEventDraft({ ...eventDraft, purpose: input.target.value })} /></Field><Field label="Service area"><Input required value={eventDraft.serviceArea} onChange={(input) => setEventDraft({ ...eventDraft, serviceArea: input.target.value })} /></Field><Field label="Format"><select className="control" value={eventDraft.format} onChange={(input) => setEventDraft({ ...eventDraft, format: input.target.value })}><option value="in_person">In person</option><option value="virtual">Virtual</option><option value="hybrid">Hybrid</option></select></Field><Field label="Status"><select className="control" value={eventDraft.status} onChange={(input) => setEventDraft({ ...eventDraft, status: input.target.value })}><option value="planned">Planned</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option></select></Field><Field label="Location or meeting details"><Input value={eventDraft.locationName} onChange={(input) => setEventDraft({ ...eventDraft, locationName: input.target.value })} /></Field><Field label="Community focus areas"><Input value={eventDraft.communityNeedFocus} onChange={(input) => setEventDraft({ ...eventDraft, communityNeedFocus: input.target.value })} /></Field><div className="md:col-span-2"><Button type="submit" data-testid="button-save-event-details">Save event details</Button></div></form></CardContent></Card>}
    {!archived && <Card>
      <CardHeader><CardTitle className="text-base">Schedule & location</CardTitle><p className="text-sm text-muted-foreground">Planning details only. Do not add attendee contact information.</p></CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(form) => {
          form.preventDefault();
          props.onSaveEvent({
            startTime: eventDraft.startTime || null,
            endTime: eventDraft.endTime || null,
            locationName: eventDraft.locationName || null,
            locationDetails: eventDraft.locationDetails || null,
          });
        }}>
          <Field label="Start time"><Input type="time" value={eventDraft.startTime} onChange={(input) => setEventDraft({ ...eventDraft, startTime: input.target.value })} /></Field>
          <Field label="End time"><Input type="time" value={eventDraft.endTime} onChange={(input) => setEventDraft({ ...eventDraft, endTime: input.target.value })} /></Field>
          <Field label="Location name"><Input value={eventDraft.locationName} onChange={(input) => setEventDraft({ ...eventDraft, locationName: input.target.value })} /></Field>
          <Field label="Location details"><Input value={eventDraft.locationDetails} onChange={(input) => setEventDraft({ ...eventDraft, locationDetails: input.target.value })} /></Field>
          <div className="md:col-span-2"><Button type="submit" disabled={props.pending.event} data-testid="button-save-event-schedule">Save schedule & location</Button></div>
        </form>
      </CardContent>
    </Card>}
    <AuditHistory eventId={event.id} />
    {!archived && <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Aggregate attendance</CardTitle><p className="text-sm text-muted-foreground">Leave a count blank when it is unknown. Do not enter attendee identities or free-text notes.</p></CardHeader><CardContent><div className="grid grid-cols-2 gap-3">{(["invitedCount", "registeredCount", "attendedCount", "followUpCount"] as const).map((field) => <Field key={field} label={field.replace("Count", "").replace(/^./, (char) => char.toUpperCase())}><Input min="0" type="number" value={props.attendanceForm[field]} onChange={(input) => props.setAttendanceForm({ ...props.attendanceForm, [field]: input.target.value })} /></Field>)}</div><div className="mt-3"><Field label="Value source"><select className="control" value={props.attendanceForm.valueSource} onChange={(input) => props.setAttendanceForm({ ...props.attendanceForm, valueSource: input.target.value })}><option value="self_reported">Self-reported</option><option value="observed">Observed aggregate</option><option value="partner_reported">Partner-reported</option><option value="unknown">Unknown</option></select></Field></div><Button className="mt-4" onClick={props.onSaveAttendance} data-testid="button-save-aggregate-attendance">Save attendance</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Community needs & evidence</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Need area"><Input value={props.needForm.needArea} onChange={(input) => props.setNeedForm({ ...props.needForm, needArea: input.target.value })} /></Field><Field label="Geography"><Input value={props.needForm.geography} onChange={(input) => props.setNeedForm({ ...props.needForm, geography: input.target.value })} /></Field><Field label="Source"><Input value={props.needForm.sourceName} onChange={(input) => props.setNeedForm({ ...props.needForm, sourceName: input.target.value })} /></Field><Field label="Evidence status"><select className="control" value={props.needForm.evidenceStatus} onChange={(input) => props.setNeedForm({ ...props.needForm, evidenceStatus: input.target.value })}><option value="self_reported">Self-reported</option><option value="observed">Observed</option><option value="derived">Derived</option><option value="partner_report">Partner report</option><option value="needs_review">Needs review</option></select></Field></div><Field label="Source URL (optional)"><Input type="url" value={props.needForm.sourceUrl} onChange={(input) => props.setNeedForm({ ...props.needForm, sourceUrl: input.target.value })} /></Field><Field label="How this event responds"><Textarea value={props.needForm.responseExplanation} onChange={(input) => props.setNeedForm({ ...props.needForm, responseExplanation: input.target.value })} /></Field><div className="flex gap-2"><Button onClick={props.onAddNeed} data-testid="button-add-community-need">{props.editingNeedId ? "Update need" : "Link need"}</Button>{props.editingNeedId && <Button variant="outline" onClick={props.onCancelNeedEdit}>Cancel</Button>}</div>{event.needs.map((need) => <div className="rounded border p-3 text-sm" key={need.id}><div className="flex justify-between gap-2"><strong>{need.needArea}</strong><span><Button size="sm" variant="ghost" onClick={() => props.onEditNeed(need)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => props.onRemoveNeed(need.id)}>Remove</Button></span></div><p className="text-muted-foreground">{need.geography} · {need.sourceName} · {need.evidenceStatus}</p><p className="mt-1">{need.responseExplanation}</p></div>)}</CardContent></Card>
    </div>}
    {!archived && <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Execution actions</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Action"><Input value={props.actionForm.title} onChange={(input) => props.setActionForm({ ...props.actionForm, title: input.target.value })} /></Field><Field label="Owner"><Input value={props.actionForm.ownerLabel} onChange={(input) => props.setActionForm({ ...props.actionForm, ownerLabel: input.target.value })} /></Field><Field label="Due date"><Input type="date" value={props.actionForm.dueDate} onChange={(input) => props.setActionForm({ ...props.actionForm, dueDate: input.target.value })} /></Field><Field label="Status"><select className="control" value={props.actionForm.status} onChange={(input) => props.setActionForm({ ...props.actionForm, status: input.target.value })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select></Field></div><Field label="Completion evidence (required when completed)"><Textarea value={props.actionForm.completionEvidence} onChange={(input) => props.setActionForm({ ...props.actionForm, completionEvidence: input.target.value })} /></Field><Field label="Next step"><Input value={props.actionForm.nextStep} onChange={(input) => props.setActionForm({ ...props.actionForm, nextStep: input.target.value })} /></Field><Button onClick={() => { props.onAddAction(); props.setActionForm(emptyAction); }} data-testid="button-add-event-action">Add action</Button>{event.actions.map((action) => <div className="rounded border p-3 text-sm" key={action.id}><div className="flex flex-wrap items-center justify-between gap-2"><strong>{action.title}</strong><span className="flex gap-2"><Badge variant={action.status === "blocked" || actionIsOverdue(action) ? "destructive" : action.status === "completed" ? "default" : "outline"}>{actionIsOverdue(action) ? "overdue" : action.status}</Badge>{action.status !== "completed" && <select aria-label={`Update status for ${action.title}`} className="control h-8 w-32" value={action.status} onChange={(input) => { if (input.target.value !== "completed") props.onUpdateAction({ id: action.id, status: input.target.value }); }}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select>}</span></div><p className="mt-1 text-muted-foreground">Owner: {action.ownerLabel}{action.dueDate ? ` · Due ${action.dueDate}` : ""}</p>{action.nextStep && <p className="mt-1">Next: {action.nextStep}</p>}{action.status !== "completed" && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input aria-label={`Completion evidence for ${action.title}`} placeholder="Record completion evidence before marking complete" value={actionEvidence[action.id] ?? action.completionEvidence ?? ""} onChange={(input) => setActionEvidence({ ...actionEvidence, [action.id]: input.target.value })} /><Button size="sm" variant="outline" disabled={!(actionEvidence[action.id] ?? action.completionEvidence ?? "").trim()} onClick={() => props.onUpdateAction({ id: action.id, status: "completed", completionEvidence: (actionEvidence[action.id] ?? action.completionEvidence ?? "").trim() })}>Mark complete</Button></div>}</div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Community stories</CardTitle><p className="text-sm text-muted-foreground">Human-entered only. A draft is private until all sharing requirements are recorded and approved.</p></CardHeader><CardContent className="space-y-3"><Field label="Story title"><Input value={props.storyForm.title} onChange={(input) => props.setStoryForm({ ...props.storyForm, title: input.target.value })} /></Field><Field label="Story draft"><Textarea value={props.storyForm.storyText} onChange={(input) => props.setStoryForm({ ...props.storyForm, storyText: input.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Attribution preference"><select className="control" value={props.storyForm.attributionPreference} onChange={(input) => props.setStoryForm({ ...props.storyForm, attributionPreference: input.target.value })}><option value="anonymous">Anonymous</option><option value="first_name">First name</option><option value="organization">Organization</option><option value="named">Named</option></select></Field><Field label="Intended audience"><select className="control" value={props.storyForm.intendedAudience} onChange={(input) => props.setStoryForm({ ...props.storyForm, intendedAudience: input.target.value })}><option value="private">Private draft</option><option value="internal_team">Internal team</option><option value="partner">Partner</option><option value="funder">Funder</option><option value="public">Public</option></select></Field></div><Field label="Permitted uses"><Input placeholder="e.g., internal reporting, funder packet" value={props.storyForm.permittedUses} onChange={(input) => props.setStoryForm({ ...props.storyForm, permittedUses: input.target.value })} /></Field><label className="flex gap-2 text-sm"><input type="checkbox" checked={props.storyForm.consentGranted} onChange={(input) => props.setStoryForm({ ...props.storyForm, consentGranted: input.target.checked })} />Explicit consent to the selected use(s) has been recorded.</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={props.storyForm.readyToShare} onChange={(input) => props.setStoryForm({ ...props.storyForm, readyToShare: input.target.checked })} />Approve this story for the selected, non-private audience.</label><div className="flex gap-2"><Button onClick={props.onSaveStory} data-testid="button-save-event-story">{props.editingStoryId ? "Update story" : "Save story"}</Button>{props.editingStoryId && <Button variant="outline" onClick={props.onClearStory}>New draft</Button>}</div>{event.stories.map((story) => <div key={story.id} className="rounded border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{story.title}</strong><Badge variant={story.sharingState === "approved" ? "default" : story.sharingState === "withdrawn" ? "destructive" : "outline"}>{story.sharingState}</Badge></div><p className="mt-1 line-clamp-2">{story.storyText}</p><p className="mt-1 text-muted-foreground">{story.attributionPreference} · {story.intendedAudience}</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => props.onEditStory(story)}>Edit</Button>{story.sharingState === "approved" && <Button size="sm" variant="destructive" onClick={() => props.onWithdrawStory(story.id)}>Withdraw consent</Button>}</div></div>)}</CardContent></Card>
    </div>}
  </div>;
}

function AuditHistory({ eventId }: { eventId: string }) {
  const [visible, setVisible] = useState(false);
  const auditQuery = useQuery<{ audit: AuditEntry[] }>({
    queryKey: ["/api/nonprofit-events/events", eventId, "audit"],
    queryFn: async () => (await apiRequest("GET", `/api/nonprofit-events/events/${eventId}/audit`)).json(),
    enabled: visible,
  });
  return <Card data-testid="community-event-audit">
    <CardHeader className="flex-row items-center justify-between gap-3">
      <div><CardTitle className="text-base">Activity history</CardTitle><p className="mt-1 text-sm text-muted-foreground">An append-only record of workspace changes. Story narratives are never stored here.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => setVisible(!visible)} aria-expanded={visible} data-testid="button-toggle-event-audit">{visible ? "Hide history" : "View history"}</Button>
    </CardHeader>
    {visible && <CardContent aria-live="polite">
      {auditQuery.isLoading && <p className="text-sm text-muted-foreground">Loading activity history…</p>}
      {auditQuery.isError && <p className="text-sm text-destructive" role="alert">Activity history could not be loaded.</p>}
      {auditQuery.data?.audit.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
      {auditQuery.data?.audit.map((entry) => <div className="border-t py-2 text-sm" key={entry.id}>
        <span className="font-medium">{entry.entityType.replace("_", " ")} {entry.action}</span>
        <span className="ml-2 text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
      </div>)}
    </CardContent>}
  </Card>;
}