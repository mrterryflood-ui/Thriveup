import { cloneElement, useEffect, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
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
type Action = { id: string; title: string; ownerLabel: string; dueDate: string | null; status: string; completionEvidence: string | null; nextStep: string | null; followUpObservation: string | null; handoffId?: string | null };
type Story = { id: string; title: string; storyText: string; attributionPreference: string; intendedAudience: string; permittedUses: string[]; consentGranted: boolean; sharingState: string };
type CommunityEvent = {
  id: string; title: string; purpose: string; eventDate: string; startTime: string | null; endTime: string | null; format: string;
  locationName: string | null; locationDetails: string | null; serviceArea: string; status: string; communityNeedFocus: string[];
  updatedAt: string; attendance: Attendance | null; needs: Need[]; actions: Action[]; stories: Story[];
};
type Summary = {
  eventCount: number; archivedEventCount: number; needsLinked: number;
  actions: { total: number; completed: number; blocked: number; overdue: number; withFollowUp: number };
  handoffs: { total: number; pendingReview: number; accepted: number; declined: number };
  attendance: Record<string, { value: number | null; disclosure: string }> & { attendanceRatePct: number | null; attendanceRateDisclosure: string; sourceLabels: string[] };
};
type Handoff = {
  id: string; sourceKind: string; sourceVersion: string; issue: string; geography: string; evidenceRefs: string[];
  freshnessAt: string; claimTypes: string[]; resourceVerification: string; consentBoundary: string;
  unresolvedGaps: string[]; status: string; eventId: string | null; version: number;
};
type Workspace = { organization: { id: string; name: string }; events: CommunityEvent[]; summary: Summary; privacyNotice: string; handoffs: Handoff[] };
type ReportTrace = { handoffId: string; issue: string; geography: string; sourceKind: string; claimTypes: string[]; freshnessAt: string; resourceVerification: string; unresolvedGapCount: number; actionStatus: string; followUpObservation: string; outcomeClaim: string; disclosure: string };
type Report = { disclosure: string; organizations: Array<{ organization: string; orgId: string; summary: Summary; actionTrace: ReportTrace[] }> };
type AuditEntry = { id: string; entityType: string; action: string; createdAt: string; details: Record<string, unknown> };
type OrganizationContext = { organization: { id: string; name: string } | null; role: string | null };
type WorkspaceAccessMember = { userId: string; displayName: string; workspaceRole: string; joinedAt: string; canRevoke: boolean };
type EligibleWorkspaceStaff = { userId: string; displayName: string; joinedAt: string };
type WorkspaceAccessAudit = { action: "granted" | "revoked"; createdAt: string };
type WorkspaceAccess = {
  canAccessWorkspace: boolean;
  access: WorkspaceAccessMember[];
  eligibleStaff: EligibleWorkspaceStaff[];
  audit: WorkspaceAccessAudit[];
};

const emptyEvent = { title: "", purpose: "", eventDate: "", startTime: "", endTime: "", serviceArea: "", format: "in_person", locationName: "", locationDetails: "", communityNeedFocus: "" };
const emptyAttendance = { invitedCount: "", registeredCount: "", attendedCount: "", followUpCount: "", valueSource: "self_reported" };
const emptyReportFilters = { serviceArea: "", needArea: "", startDate: "", endDate: "" };
const emptyNeed = { needArea: "", sourceName: "", sourceUrl: "", geography: "", evidenceStatus: "self_reported", responseExplanation: "" };
const emptyAction = { title: "", ownerLabel: "", dueDate: "", status: "planned", completionEvidence: "", nextStep: "", followUpObservation: "" };
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

function hasHttpStatus(error: unknown, status: number) {
  return error instanceof Error && error.message.startsWith(`${status}:`);
}

type WorkspaceMutationConfig = {
  activeOrgId: string | null;
  activeOrgRef: { current: string | null };
  queryOrgKey: string;
  refresh: (queryOrgKey: string) => Promise<void>;
};

function useWorkspaceMutation<T, V = void>(
  request: (value: V, orgId: string) => Promise<T>,
  success: string,
  { activeOrgId, activeOrgRef, queryOrgKey, refresh }: WorkspaceMutationConfig,
) {
  const { toast } = useToast();
  const mutation = useMutation<T, Error, { value: V; orgId: string; queryOrgKey: string }>({
    mutationFn: ({ value, orgId }) => request(value, orgId),
    onSuccess: async (_data, change) => {
      if (change.orgId !== activeOrgRef.current) return;
      await refresh(change.queryOrgKey);
      if (change.orgId === activeOrgRef.current) toast({ title: success });
    },
    onError: (error, change) => {
      if (change.orgId === activeOrgRef.current) {
        toast({ title: "Could not save", description: error.message, variant: "destructive" });
      }
    },
  });
  return {
    isPending: mutation.isPending && mutation.variables?.orgId === activeOrgId,
    mutate: (value: V, options?: { onSuccess?: (data: T) => void }) => {
      if (!activeOrgId) {
        toast({ title: "Organization context is still loading", description: "Please wait a moment and try again.", variant: "destructive" });
        return;
      }
      mutation.mutate({ value, orgId: activeOrgId, queryOrgKey }, {
        onSuccess: (data, change) => {
          if (change.orgId === activeOrgRef.current) options?.onSuccess?.(data);
        },
      });
    },
  };
}

export default function NonprofitEventsPage() {
  const { toast } = useToast();
  const { orgId } = useCurrentOrgId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendance);
  const [needForm, setNeedForm] = useState(emptyNeed);
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null);
  const [actionForm, setActionForm] = useState(emptyAction);
  const [storyForm, setStoryForm] = useState(emptyStory);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [reportState, setReportState] = useState<{ orgId: string | null; report: Report } | null>(null);
  const [reportFilters, setReportFilters] = useState(emptyReportFilters);
  const [pendingWorkspaceAccessChange, setPendingWorkspaceAccessChange] = useState<{ action: "grant" | "revoke"; userId: string; orgId: string | null } | null>(null);
  const headerForQueryOrg = (targetQueryOrgKey: string) => (
    targetQueryOrgKey === "default" ? undefined : { "x-org-id": targetQueryOrgKey }
  );
  const organizationQueryOrgKey = orgId ?? "default";

  const organizationQuery = useQuery<OrganizationContext>({
    queryKey: ["/api/me/organization", organizationQueryOrgKey],
    queryFn: async ({ queryKey }) => {
      const targetQueryOrgKey = String(queryKey[1] ?? "default");
      return (await apiRequest("GET", "/api/me/organization", undefined, headerForQueryOrg(targetQueryOrgKey))).json();
    },
  });
  const isOwner = organizationQuery.data?.role === "owner";
  const activeWorkspaceOrgId = orgId ?? organizationQuery.data?.organization?.id ?? null;
  const activeOrgIdRef = useRef(activeWorkspaceOrgId);
  activeOrgIdRef.current = activeWorkspaceOrgId;
  const report = reportState?.orgId === activeWorkspaceOrgId ? reportState.report : null;
  const workspaceQueryOrgKey = activeWorkspaceOrgId ?? "default";
  const workspaceAccessQuery = useQuery<WorkspaceAccess>({
    queryKey: ["/api/me/organization/event-workspace-access", workspaceQueryOrgKey],
    queryFn: async ({ queryKey }) => {
      const targetQueryOrgKey = String(queryKey[1] ?? "default");
      return (await apiRequest("GET", "/api/me/organization/event-workspace-access", undefined, headerForQueryOrg(targetQueryOrgKey))).json();
    },
    enabled: isOwner,
    retry: false,
  });
  const canLoadWorkspace = Boolean(organizationQuery.data?.organization)
    && (!isOwner || workspaceAccessQuery.data?.canAccessWorkspace === true);
  const workspaceQuery = useQuery<Workspace>({
    queryKey: ["/api/nonprofit-events/workspace", workspaceQueryOrgKey],
    queryFn: async ({ queryKey }) => {
      const targetQueryOrgKey = String(queryKey[1] ?? "default");
      return (await apiRequest("GET", "/api/nonprofit-events/workspace", undefined, headerForQueryOrg(targetQueryOrgKey))).json();
    },
    enabled: canLoadWorkspace,
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
    setEventForm(emptyEvent);
    setAttendanceForm(emptyAttendance);
    setNeedForm(emptyNeed);
    setEditingNeedId(null);
    setActionForm(emptyAction);
    setStoryForm(emptyStory);
    setEditingStoryId(null);
    setReportState(null);
    setReportFilters(emptyReportFilters);
    setPendingWorkspaceAccessChange(null);
  }, [orgId]);

  useEffect(() => {
    setNeedForm(emptyNeed);
    setEditingNeedId(null);
    setActionForm(emptyAction);
    setStoryForm(emptyStory);
    setEditingStoryId(null);
  }, [selected?.id]);

  const refresh = async (targetQueryOrgKey: string) => {
    await queryClient.invalidateQueries({ queryKey: ["/api/nonprofit-events/workspace", targetQueryOrgKey], exact: true });
  };
  const workspaceMutationConfig: WorkspaceMutationConfig = {
    activeOrgId: activeWorkspaceOrgId,
    activeOrgRef: activeOrgIdRef,
    queryOrgKey: workspaceQueryOrgKey,
    refresh,
  };
  const workspaceApiRequest = (targetOrgId: string, method: string, url: string, data?: unknown) => (
    apiRequest(method, url, data, { "x-org-id": targetOrgId })
  );
  const refreshWorkspaceAccess = async (targetQueryOrgKey: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/me/organization/event-workspace-access", targetQueryOrgKey], exact: true }),
      queryClient.invalidateQueries({ queryKey: ["/api/nonprofit-events/workspace", targetQueryOrgKey], exact: true }),
    ]);
  };
  type WorkspaceAccessChange = { userId: string; orgId: string; queryOrgKey: string };
  const grantWorkspaceStaff = useMutation<unknown, Error, WorkspaceAccessChange>({
    mutationFn: async ({ userId, orgId: targetOrgId }) => {
      const res = await apiRequest("POST", "/api/me/organization/event-workspace-access", { userId }, { "x-org-id": targetOrgId });
      return res.json();
    },
    onSuccess: async (_data, change) => {
      if (change.orgId !== activeOrgIdRef.current) return;
      await refreshWorkspaceAccess(change.queryOrgKey);
      if (change.orgId === activeOrgIdRef.current) toast({ title: "Event-workspace staff access granted" });
    },
    onError: (error, change) => {
      if (change.orgId === activeOrgIdRef.current) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
  });
  const revokeWorkspaceStaff = useMutation<unknown, Error, WorkspaceAccessChange>({
    mutationFn: async ({ userId, orgId: targetOrgId }) => {
      const res = await apiRequest("DELETE", `/api/me/organization/event-workspace-access/${userId}`, undefined, { "x-org-id": targetOrgId });
      return res.json();
    },
    onSuccess: async (_data, change) => {
      if (change.orgId !== activeOrgIdRef.current) return;
      await refreshWorkspaceAccess(change.queryOrgKey);
      if (change.orgId === activeOrgIdRef.current) toast({ title: "Event-workspace staff access revoked" });
    },
    onError: (error, change) => {
      if (change.orgId === activeOrgIdRef.current) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
  });
  const changeWorkspaceAccess = (action: "grant" | "revoke", userId: string) => {
    if (!activeWorkspaceOrgId) {
      toast({ title: "Organization context is still loading", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    const change = { action, userId, orgId: activeWorkspaceOrgId, queryOrgKey: workspaceQueryOrgKey };
    setPendingWorkspaceAccessChange(change);
    const mutation = action === "grant" ? grantWorkspaceStaff : revokeWorkspaceStaff;
    mutation.mutate(change, {
      onSettled: () => setPendingWorkspaceAccessChange((current) => (
        current?.action === action && current.userId === userId && current.orgId === change.orgId ? null : current
      )),
    });
  };
  const createEvent = useWorkspaceMutation(async (_value, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "POST", "/api/nonprofit-events/events", {
      ...eventForm,
      startTime: eventForm.startTime || null,
      endTime: eventForm.endTime || null,
      locationName: eventForm.locationName || null,
      locationDetails: eventForm.locationDetails || null,
      communityNeedFocus: eventForm.communityNeedFocus.split(",").map((item) => item.trim()).filter(Boolean),
    });
    return res.json();
  }, "Event created", workspaceMutationConfig);
  const updateEvent = useWorkspaceMutation<unknown, { id: string; payload: Record<string, unknown> }>(async ({ id, payload }, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "PATCH", `/api/nonprofit-events/events/${id}`, payload);
    return res.json();
  }, "Event details updated", workspaceMutationConfig);
  const saveAttendance = useWorkspaceMutation(async (_value, targetOrgId) => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await workspaceApiRequest(targetOrgId, "PUT", `/api/nonprofit-events/events/${selected.id}/attendance`, {
      invitedCount: toCount(attendanceForm.invitedCount), registeredCount: toCount(attendanceForm.registeredCount),
      attendedCount: toCount(attendanceForm.attendedCount), followUpCount: toCount(attendanceForm.followUpCount),
      valueSource: attendanceForm.valueSource,
    });
    return res.json();
  }, "Aggregate attendance saved", workspaceMutationConfig);
  const addNeed = useWorkspaceMutation(async (_value, targetOrgId) => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await workspaceApiRequest(targetOrgId, "POST", `/api/nonprofit-events/events/${selected.id}/needs`, { ...needForm, sourceUrl: needForm.sourceUrl || null });
    return res.json();
  }, "Community need linked", workspaceMutationConfig);
  const updateNeed = useWorkspaceMutation<unknown, { id: string; payload: Record<string, unknown> }>(async ({ id, payload }, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "PATCH", `/api/nonprofit-events/needs/${id}`, payload);
    return res.json();
  }, "Community need updated", workspaceMutationConfig);
  const removeNeed = useWorkspaceMutation<unknown, string>(async (needId, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "DELETE", `/api/nonprofit-events/needs/${needId}`);
    return res.json();
  }, "Community need removed", workspaceMutationConfig);
  const addAction = useWorkspaceMutation(async (_value, targetOrgId) => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await workspaceApiRequest(targetOrgId, "POST", `/api/nonprofit-events/events/${selected.id}/actions`, { ...actionForm, dueDate: actionForm.dueDate || null, completionEvidence: actionForm.completionEvidence || null, nextStep: actionForm.nextStep || null });
    return res.json();
  }, "Action created", workspaceMutationConfig);
  const updateAction = useWorkspaceMutation<unknown, { id: string; status: string; completionEvidence?: string; followUpObservation?: string }>(async (input, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "PATCH", `/api/nonprofit-events/actions/${input.id}`, { status: input.status, completionEvidence: input.completionEvidence ?? null, ...(input.followUpObservation !== undefined ? { followUpObservation: input.followUpObservation || null } : {}) });
    return res.json();
  }, "Action updated", workspaceMutationConfig);
  const acceptHandoff = useWorkspaceMutation<unknown, { id: string; payload: Record<string, unknown> }>(async ({ id, payload }, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "POST", `/api/nonprofit-events/handoffs/${id}/accept`, payload);
    return res.json();
  }, "Evidence accepted into the workspace", workspaceMutationConfig);
  const declineHandoff = useWorkspaceMutation<unknown, string>(async (handoffId, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "PATCH", `/api/nonprofit-events/handoffs/${handoffId}/decline`);
    return res.json();
  }, "Evidence handoff declined", workspaceMutationConfig);
  const saveStory = useWorkspaceMutation(async (_value, targetOrgId) => {
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
    const res = await workspaceApiRequest(targetOrgId, editingStoryId ? "PATCH" : "POST", editingStoryId ? `/api/nonprofit-events/stories/${editingStoryId}` : `/api/nonprofit-events/events/${selected.id}/stories`, payload);
    return res.json();
  }, "Story saved", workspaceMutationConfig);
  const withdrawStory = useWorkspaceMutation<unknown, string>(async (storyId, targetOrgId) => {
    const res = await workspaceApiRequest(targetOrgId, "PATCH", `/api/nonprofit-events/stories/${storyId}`, { sharingState: "withdrawn" });
    return res.json();
  }, "Story consent withdrawn", workspaceMutationConfig);
  const archiveEvent = useWorkspaceMutation(async (_value, targetOrgId) => {
    if (!selected) throw new Error("Choose an event first.");
    const res = await workspaceApiRequest(targetOrgId, "POST", `/api/nonprofit-events/events/${selected.id}/archive`);
    return res.json();
  }, "Event archived", workspaceMutationConfig);
  const runReport = useMutation<{ report: Report; requestedOrgId: string | null }, Error, string | null>({
    mutationFn: async (requestedOrgId) => {
      const params = new URLSearchParams(Object.entries(reportFilters).filter(([, value]) => value));
      const res = await apiRequest(
        "GET",
        `/api/nonprofit-events/report?${params}`,
        undefined,
        requestedOrgId ? { "x-org-id": requestedOrgId } : undefined,
      );
      return { report: await res.json() as Report, requestedOrgId };
    },
    onSuccess: ({ report: nextReport, requestedOrgId }) => {
      if (requestedOrgId === activeOrgIdRef.current) setReportState({ orgId: requestedOrgId, report: nextReport });
    },
    onError: (error, requestedOrgId) => {
      if (requestedOrgId === activeOrgIdRef.current) {
        toast({ title: "Staff report unavailable", description: error.message, variant: "destructive" });
      }
    },
  });
  const reportPendingForActiveOrg = runReport.isPending && runReport.variables === activeWorkspaceOrgId;
  const reportDateRangeInvalid = Boolean(reportFilters.startDate && reportFilters.endDate && reportFilters.startDate > reportFilters.endDate);

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

  const retryWorkspacePage = () => {
    void organizationQuery.refetch();
    void workspaceAccessQuery.refetch();
    void workspaceQuery.refetch();
  };
  if (organizationQuery.isLoading || (isOwner && workspaceAccessQuery.isLoading)) {
    return <main className="container max-w-7xl py-8" aria-live="polite"><p data-testid="nonprofit-events-loading">Loading your organization workspace…</p></main>;
  }
  if (organizationQuery.isError) {
    return <main className="container max-w-7xl py-8"><ErrorRetry message={(organizationQuery.error as Error).message} onRetry={retryWorkspacePage} /></main>;
  }
  if (!organizationQuery.data?.organization) {
    return <main className="container max-w-7xl py-8"><ErrorRetry message="Choose or create an organization before using the Community Events & Impact workspace." onRetry={retryWorkspacePage} /></main>;
  }
  if (isOwner && workspaceAccessQuery.isError) {
    return <main className="container max-w-7xl py-8"><ErrorRetry message={(workspaceAccessQuery.error as Error).message} onRetry={retryWorkspacePage} /></main>;
  }
  if (isOwner && workspaceAccessQuery.data && !workspaceAccessQuery.data.canAccessWorkspace) {
    return (
      <main className="container max-w-7xl py-6 space-y-6" role="alert" aria-live="assertive" data-testid="nonprofit-events-owner-access-only">
        <PageHeader
          title="Community Events & Impact"
          description={`Manage who can access private event records for ${organizationQuery.data.organization.name}.`}
          breadcrumbs={[{ label: "My Organization", href: "/settings/organization" }, { label: "Community Events & Impact" }]}
        />
        <OwnerWorkspaceAccessPanel
          access={workspaceAccessQuery.data}
          grantPending={grantWorkspaceStaff.isPending && pendingWorkspaceAccessChange?.orgId === activeWorkspaceOrgId}
          revokePending={revokeWorkspaceStaff.isPending && pendingWorkspaceAccessChange?.orgId === activeWorkspaceOrgId}
          grantPendingUserId={pendingWorkspaceAccessChange?.action === "grant" ? pendingWorkspaceAccessChange.userId : undefined}
          revokePendingUserId={pendingWorkspaceAccessChange?.action === "revoke" ? pendingWorkspaceAccessChange.userId : undefined}
          onGrant={(userId) => changeWorkspaceAccess("grant", userId)}
          onRevoke={(userId) => changeWorkspaceAccess("revoke", userId)}
        />
        <Card data-testid="nonprofit-events-private-data-denied">
          <CardHeader><CardTitle className="text-base">Private event records remain protected</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Your owner role lets you manage access. Viewing or changing event records still requires an approved database-backed staff role and active organization-scoped workspace access.</p></CardContent>
        </Card>
      </main>
    );
  }
  if (workspaceQuery.isLoading) return <main className="container max-w-7xl py-8" aria-live="polite"><p data-testid="nonprofit-events-loading">Loading your organization workspace…</p></main>;
  if (workspaceQuery.isError && hasHttpStatus(workspaceQuery.error, 403)) {
    return (
      <main className="container max-w-4xl py-8 space-y-4" role="alert" aria-live="assertive" data-testid="nonprofit-events-access-denied">
        <PageHeader title="Community Events & Impact" description="This private workspace is limited to authorized organization staff." />
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Your current organization membership does not have staff access to private event records. Ask an organization owner if your access should change.</p></CardContent></Card>
      </main>
    );
  }
  if (workspaceQuery.isError) return <main className="container max-w-7xl py-8"><ErrorRetry message={(workspaceQuery.error as Error).message} onRetry={retryWorkspacePage} /></main>;
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
      {isOwner && workspaceAccessQuery.data && <OwnerWorkspaceAccessPanel
        access={workspaceAccessQuery.data}
        grantPending={grantWorkspaceStaff.isPending && pendingWorkspaceAccessChange?.orgId === activeWorkspaceOrgId}
        revokePending={revokeWorkspaceStaff.isPending && pendingWorkspaceAccessChange?.orgId === activeWorkspaceOrgId}
        grantPendingUserId={pendingWorkspaceAccessChange?.action === "grant" ? pendingWorkspaceAccessChange.userId : undefined}
        revokePendingUserId={pendingWorkspaceAccessChange?.action === "revoke" ? pendingWorkspaceAccessChange.userId : undefined}
        onGrant={(userId) => changeWorkspaceAccess("grant", userId)}
        onRevoke={(userId) => changeWorkspaceAccess("revoke", userId)}
      />}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Organization impact summary">
        <SummaryCard icon={<CalendarDays />} label="Active events" value={String(summary.eventCount)} detail={`${summary.archivedEventCount} archived`} />
        <SummaryCard icon={<Users />} label="Attendance" value={countLabel(summary.attendance.attendedCount)} detail={summary.attendance.attendedCount.disclosure} />
        <SummaryCard icon={<HeartHandshake />} label="Needs linked" value={String(summary.needsLinked)} detail="Source and geography recorded" />
        <SummaryCard icon={<ListTodo />} label="Actions" value={`${summary.actions.completed}/${summary.actions.total}`} detail={`${summary.actions.blocked} blocked · ${summary.actions.overdue} overdue`} />
      </section>
      <HandoffReviewPanel
        handoffs={workspace.handoffs.filter((handoff) => handoff.status === "pending_review")}
        events={events}
        pending={acceptHandoff.isPending || declineHandoff.isPending}
        onAccept={(id, payload) => acceptHandoff.mutate({ id, payload })}
        onDecline={(id) => { if (window.confirm("Decline this evidence handoff? It will remain in the review history and will not create an event or action.")) declineHandoff.mutate(id); }}
      />

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Plan an event</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(event) => { event.preventDefault(); createEvent.mutate(undefined, { onSuccess: () => setEventForm(emptyEvent) }); }}>
              <fieldset className="m-0 min-w-0 space-y-3 border-0 p-0" disabled={createEvent.isPending} aria-busy={createEvent.isPending}>
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
                <Button className="w-full" type="submit" data-testid="button-create-community-event"><Plus className="mr-2 h-4 w-4" />Create private event</Button>
              </fieldset>
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
            key={`${activeWorkspaceOrgId ?? "default"}:${selected.id}`}
            event={selected}
            orgId={activeWorkspaceOrgId}
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
               if (!needForm.needArea.trim() || !needForm.geography.trim() || !needForm.sourceName.trim() || !needForm.responseExplanation.trim()) {
                 toast({ title: "Complete the need fields", description: "Need area, geography, source, and response explanation are required.", variant: "destructive" });
                 return;
               }
              const payload = { ...needForm, sourceUrl: needForm.sourceUrl || null };
              if (editingNeedId) updateNeed.mutate({ id: editingNeedId, payload }, { onSuccess: () => { setNeedForm(emptyNeed); setEditingNeedId(null); } });
              else addNeed.mutate(undefined, { onSuccess: () => { setNeedForm(emptyNeed); setEditingNeedId(null); } });
            }}
            onEditNeed={(need) => { setEditingNeedId(need.id); setNeedForm({ needArea: need.needArea, sourceName: need.sourceName, sourceUrl: need.sourceUrl ?? "", geography: need.geography, evidenceStatus: need.evidenceStatus, responseExplanation: need.responseExplanation }); }}
            onCancelNeedEdit={() => { setEditingNeedId(null); setNeedForm(emptyNeed); }}
            onRemoveNeed={(id) => { if (window.confirm("Remove this need link? Its audit history will remain.")) removeNeed.mutate(id); }}
             onAddAction={() => {
               if (!actionForm.title.trim() || !actionForm.ownerLabel.trim()) {
                 toast({ title: "Complete the action fields", description: "An action title and accountable owner are required.", variant: "destructive" });
                 return;
               }
               addAction.mutate(undefined, { onSuccess: () => setActionForm(emptyAction) });
             }}
             onUpdateAction={(input) => updateAction.mutate(input)}
             onSaveStory={() => {
               if (!storyForm.title.trim() || !storyForm.storyText.trim() || (storyForm.readyToShare && !storyForm.permittedUses.trim())) {
                 toast({ title: "Complete the story fields", description: storyForm.readyToShare ? "Title, story draft, and permitted uses are required for approval." : "Title and story draft are required.", variant: "destructive" });
                 return;
               }
               saveStory.mutate(undefined, { onSuccess: () => { setStoryForm(emptyStory); setEditingStoryId(null); } });
             }}
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
         <CardHeader className="flex-row items-center justify-between gap-3"><div><CardTitle className="text-base">Staff reporting</CardTitle><p className="mt-1 text-sm text-muted-foreground">Staff-only, non-identifying aggregate review for this active organization. Stories are never included.</p></div><Button type="button" variant="outline" onClick={() => runReport.mutate(activeWorkspaceOrgId)} disabled={reportPendingForActiveOrg || reportDateRangeInvalid} aria-busy={reportPendingForActiveOrg} data-testid="button-run-nonprofit-report">{reportPendingForActiveOrg ? "Running…" : "Run report"}</Button></CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="m-0 min-w-0 border-0 p-0" disabled={reportPendingForActiveOrg} aria-busy={reportPendingForActiveOrg}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Service area"><Input value={reportFilters.serviceArea} onChange={(event) => setReportFilters({ ...reportFilters, serviceArea: event.target.value })} /></Field>
              <Field label="Need area"><Input value={reportFilters.needArea} onChange={(event) => setReportFilters({ ...reportFilters, needArea: event.target.value })} /></Field>
              <Field label="From"><Input type="date" value={reportFilters.startDate} onChange={(event) => setReportFilters({ ...reportFilters, startDate: event.target.value })} /></Field>
              <Field label="To"><Input type="date" value={reportFilters.endDate} onChange={(event) => setReportFilters({ ...reportFilters, endDate: event.target.value })} /></Field>
            </div>
          </fieldset>
           {reportDateRangeInvalid && <p className="text-sm text-destructive" role="alert">The report start date must be on or before the end date.</p>}
           {runReport.isError && runReport.variables === activeWorkspaceOrgId && <p className="text-sm text-destructive" role="alert">The report could not be generated. Please correct the filters and try again.</p>}
          {report && <div className="space-y-3" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{report.disclosure}</p><Button type="button" size="sm" variant="outline" onClick={downloadReport} data-testid="button-download-nonprofit-report"><Download className="mr-2 h-4 w-4" />Download CSV</Button></div>
            {report.organizations.length === 0 ? <p className="text-sm text-muted-foreground">No records matched these filters.</p> : report.organizations.map((row) => <div key={row.orgId} className="rounded-md border p-3 text-sm"><strong>{row.organization}</strong><p className="mt-1">{row.summary.eventCount} events · attended: {countLabel(row.summary.attendance.attendedCount)} · needs linked: {row.summary.needsLinked} · completed actions: {row.summary.actions.completed}</p></div>)}
          </div>}
        </CardContent>
      </Card>
       <style>{`.control{display:flex;height:2.25rem;width:100%;border-radius:.375rem;border:1px solid hsl(var(--input));background:hsl(var(--background));padding:.25rem .75rem;font-size:.875rem}.control:focus{outline:2px solid hsl(var(--ring));outline-offset:2px}`}</style>
    </main>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{label}</span></div><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function OwnerWorkspaceAccessPanel({
  access,
  grantPending,
  revokePending,
  grantPendingUserId,
  revokePendingUserId,
  onGrant,
  onRevoke,
}: {
  access: WorkspaceAccess;
  grantPending: boolean;
  revokePending: boolean;
  grantPendingUserId?: string;
  revokePendingUserId?: string;
  onGrant: (userId: string) => void;
  onRevoke: (userId: string) => void;
}) {
  const accessChangePending = grantPending || revokePending;
  return (
    <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]" aria-label="Event workspace access management" data-testid="event-workspace-access-panel">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event-workspace staff access</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Organization owners can grant the private workspace to existing organization members who already hold an approved database-backed staff role. Collaborators and ordinary members remain excluded unless this access is explicitly granted.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="sr-only" role="status" aria-live="polite">
            {grantPending ? "Granting staff access…" : revokePending ? "Revoking staff access…" : ""}
          </p>
          <div>
            <h3 className="text-sm font-semibold">Current workspace access</h3>
            <div className="mt-2 space-y-2">
              {access.access.length === 0 && <p className="text-sm text-muted-foreground">No eligible staff currently have private workspace access.</p>}
              {access.access.map((member) => (
                <div key={member.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <div><p className="font-medium">{member.displayName}</p><p className="text-muted-foreground">Organization role: {member.workspaceRole}</p></div>
                  {member.canRevoke
                    ? <Button type="button" size="sm" variant="destructive" aria-label={`Revoke private event-workspace access for ${member.displayName}`} disabled={accessChangePending} onClick={() => { if (window.confirm(`Revoke private event-workspace access for ${member.displayName}?`)) onRevoke(member.userId); }} data-testid={`button-revoke-event-workspace-staff-${member.userId}`}>{revokePending && revokePendingUserId === member.userId ? "Revoking…" : "Revoke access"}</Button>
                    : <Badge variant="outline">Role managed separately</Badge>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Eligible organization staff</h3>
            <p className="mt-1 text-xs text-muted-foreground">Only existing members with approved platform staff status can be added. This action assigns the organization-scoped staff role, not a broader organization administrator role.</p>
            <div className="mt-2 space-y-2">
              {access.eligibleStaff.length === 0 && <p className="text-sm text-muted-foreground">No additional eligible organization staff are available. To authorize someone, ask a platform administrator to give an existing organization member an approved platform staff role. Collaborator accounts cannot be made eligible from this panel.</p>}
              {access.eligibleStaff.map((member) => (
                <div key={member.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <p className="font-medium">{member.displayName}</p>
                  <Button type="button" size="sm" aria-label={`Grant private event-workspace access to ${member.displayName}`} disabled={accessChangePending} onClick={() => { if (window.confirm(`Grant private event-workspace access to ${member.displayName}?`)) onGrant(member.userId); }} data-testid={`button-grant-event-workspace-staff-${member.userId}`}>{grantPending && grantPendingUserId === member.userId ? "Granting…" : "Grant staff access"}</Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card data-testid="event-workspace-access-audit">
        <CardHeader>
          <CardTitle className="text-base">Access-change record</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">An append-only, content-free record of staff-access changes.</p>
        </CardHeader>
        <CardContent className="space-y-2" aria-live="polite">
          {access.audit.length === 0 && <p className="text-sm text-muted-foreground">No access changes recorded yet.</p>}
          {access.audit.map((entry, index) => (
            <div className="border-t py-2 text-sm" key={`${entry.action}-${entry.createdAt}-${index}`}>
              <p className="font-medium">Staff access {entry.action}</p>
              <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function HandoffReviewPanel({
  handoffs,
  events,
  pending,
  onAccept,
  onDecline,
}: {
  handoffs: Handoff[];
  events: CommunityEvent[];
  pending: boolean;
  onAccept: (id: string, payload: Record<string, unknown>) => void;
  onDecline: (id: string) => void;
}) {
  if (handoffs.length === 0) return null;
  return <Card className="border-emerald-200 dark:border-emerald-800" data-testid="panel-evidence-handoff-review">
    <CardHeader>
      <CardTitle className="text-base">Evidence awaiting partner review</CardTitle>
      <p className="text-sm text-muted-foreground">Review the source, freshness, claim types, resource verification, and unresolved gaps before choosing an organization-owned action. Acceptance is always human-selected.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {handoffs.map((handoff) => <HandoffReviewCard key={handoff.id} handoff={handoff} events={events} pending={pending} onAccept={onAccept} onDecline={onDecline} />)}
    </CardContent>
  </Card>;
}

function HandoffReviewCard({
  handoff,
  events,
  pending,
  onAccept,
  onDecline,
}: {
  handoff: Handoff;
  events: CommunityEvent[];
  pending: boolean;
  onAccept: (id: string, payload: Record<string, unknown>) => void;
  onDecline: (id: string) => void;
}) {
  const [eventId, setEventId] = useState("");
  const [eventTitle, setEventTitle] = useState(`${handoff.issue.slice(0, 180)} response`);
  const [eventDate, setEventDate] = useState("");
  const [serviceArea, setServiceArea] = useState(handoff.geography);
  const [actionTitle, setActionTitle] = useState(`Respond to: ${handoff.issue.slice(0, 180)}`);
  const [ownerLabel, setOwnerLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [responseExplanation, setResponseExplanation] = useState("");
  const [followUpObservation, setFollowUpObservation] = useState("");

  const accept = (form: React.FormEvent) => {
    form.preventDefault();
    if (!window.confirm("Accept this handoff? This will create or link a private event, create a linked need, and create an accountable action.")) return;
    const action = {
      title: actionTitle,
      ownerLabel,
      dueDate: dueDate || null,
      status: "planned",
      completionEvidence: null,
      nextStep: "Review progress with the organization team.",
      followUpObservation: followUpObservation || null,
    };
    const payload = eventId
      ? { eventId, needResponseExplanation: responseExplanation, action }
      : {
        newEvent: {
          title: eventTitle,
          purpose: `Partner-selected response to the reviewed need: ${handoff.issue}`,
          eventDate,
          startTime: null,
          endTime: null,
          format: "in_person",
          locationName: null,
          locationDetails: null,
          serviceArea,
          communityNeedFocus: [handoff.issue.slice(0, 160)],
        },
        needResponseExplanation: responseExplanation,
        action,
      };
    onAccept(handoff.id, payload);
  };

  return <div className="rounded-lg border bg-muted/20 p-4" data-testid={`evidence-handoff-${handoff.id}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-semibold">{handoff.issue}</p>
        <p className="mt-1 text-sm text-muted-foreground">{handoff.geography} · {handoff.sourceKind} · refreshed {new Date(handoff.freshnessAt).toLocaleDateString()}</p>
      </div>
      <Badge variant="outline">{handoff.sourceVersion}</Badge>
    </div>
    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
      <span><strong>Claims:</strong> {handoff.claimTypes.join(", ") || "unavailable"}</span>
      <span><strong>Resources:</strong> {handoff.resourceVerification}</span>
      <span><strong>Evidence links:</strong> {handoff.evidenceRefs.length}</span>
    </div>
    <div className="mt-2 text-xs">
      <strong>Reviewable sources:</strong>{" "}
      {handoff.evidenceRefs.length === 0 ? <span className="text-muted-foreground">No source URL was provided.</span> : (
        <ul className="mt-1 list-disc pl-5">
          {handoff.evidenceRefs.map((reference) => /^https?:\/\//.test(reference) && <li key={reference}><a className="underline" href={reference} target="_blank" rel="noreferrer">{reference}</a></li>)}
        </ul>
      )}
    </div>
    <p className="mt-2 text-xs text-muted-foreground"><strong>Consent boundary:</strong> {handoff.consentBoundary}</p>
    {handoff.unresolvedGaps.length > 0 && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300"><strong>Unresolved gaps:</strong> {handoff.unresolvedGaps.join(" · ")}</p>}
    <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={accept}>
      <Field label="Attach to an existing event (optional)"><select className="control" value={eventId} onChange={(input) => setEventId(input.target.value)}><option value="">Create a new private event</option>{events.filter((event) => event.status !== "archived").map((event) => <option key={event.id} value={event.id}>{event.title} · {event.eventDate}</option>)}</select></Field>
      {!eventId && <Field label="New event title"><Input required value={eventTitle} onChange={(input) => setEventTitle(input.target.value)} /></Field>}
      {!eventId && <Field label="Event date"><Input required type="date" value={eventDate} onChange={(input) => setEventDate(input.target.value)} /></Field>}
      {!eventId && <Field label="Service area"><Input required value={serviceArea} onChange={(input) => setServiceArea(input.target.value)} /></Field>}
      <Field label="Organization action"><Input required value={actionTitle} onChange={(input) => setActionTitle(input.target.value)} /></Field>
      <Field label="Accountable owner"><Input required placeholder="Role or team, not a participant" value={ownerLabel} onChange={(input) => setOwnerLabel(input.target.value)} /></Field>
      <Field label="Due date"><Input required type="date" value={dueDate} onChange={(input) => setDueDate(input.target.value)} /></Field>
      <div className="md:col-span-2"><Field label="How this action responds to the reviewed need"><Textarea required value={responseExplanation} onChange={(input) => setResponseExplanation(input.target.value)} /></Field></div>
      <div className="md:col-span-2"><Field label="Follow-up expectation (optional)"><Textarea value={followUpObservation} onChange={(input) => setFollowUpObservation(input.target.value)} /></Field></div>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button type="submit" disabled={pending} data-testid={`button-accept-evidence-handoff-${handoff.id}`}>{pending ? "Saving…" : "Accept: create/link event, need & action"}</Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => onDecline(handoff.id)} data-testid={`button-decline-evidence-handoff-${handoff.id}`}>Decline</Button>
      </div>
    </form>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  const field = cloneElement(children, { id: children.props.id ?? id });
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{field}</div>;
}

function EventDetail(props: {
  event: CommunityEvent; orgId: string | null; attendanceForm: Record<string, string>; setAttendanceForm: (value: any) => void; needForm: typeof emptyNeed; setNeedForm: (value: any) => void;
  editingNeedId: string | null; onSaveEvent: (payload: Record<string, unknown>) => void;
  actionForm: typeof emptyAction; setActionForm: (value: any) => void; storyForm: typeof emptyStory; setStoryForm: (value: any) => void; editingStoryId: string | null;
  onSaveAttendance: () => void; onAddNeed: () => void; onEditNeed: (need: Need) => void; onCancelNeedEdit: () => void; onRemoveNeed: (id: string) => void; onAddAction: () => void; onUpdateAction: (input: { id: string; status: string; completionEvidence?: string; followUpObservation?: string }) => void;
  onSaveStory: () => void; onEditStory: (story: Story) => void; onClearStory: () => void; onWithdrawStory: (id: string) => void; onArchive: () => void; archived: boolean;
  pending: { event: boolean; attendance: boolean; need: boolean; action: boolean; story: boolean };
}) {
  const { event, archived } = props;
  const [eventDraft, setEventDraft] = useState({ title: event.title, purpose: event.purpose, eventDate: event.eventDate, startTime: event.startTime ?? "", endTime: event.endTime ?? "", serviceArea: event.serviceArea, locationName: event.locationName ?? "", locationDetails: event.locationDetails ?? "", format: event.format, status: event.status, communityNeedFocus: event.communityNeedFocus.join(", ") });
  const [actionEvidence, setActionEvidence] = useState<Record<string, string>>({});
  const [actionFollowUp, setActionFollowUp] = useState<Record<string, string>>({});

  useEffect(() => {
    setEventDraft({ title: event.title, purpose: event.purpose, eventDate: event.eventDate, startTime: event.startTime ?? "", endTime: event.endTime ?? "", serviceArea: event.serviceArea, locationName: event.locationName ?? "", locationDetails: event.locationDetails ?? "", format: event.format, status: event.status, communityNeedFocus: event.communityNeedFocus.join(", ") });
    setActionEvidence({});
    setActionFollowUp({});
  }, [event.id, event.updatedAt]);

  const eventMutationPending = Object.values(props.pending).some(Boolean);
  return <fieldset className="m-0 min-w-0 space-y-6 border-0 p-0" disabled={eventMutationPending} aria-busy={eventMutationPending} data-testid="community-event-detail">
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
    <AuditHistory eventId={event.id} orgId={props.orgId} />
    {!archived && <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Aggregate attendance</CardTitle><p className="text-sm text-muted-foreground">Leave a count blank when it is unknown. Do not enter attendee identities or free-text notes.</p></CardHeader><CardContent><div className="grid grid-cols-2 gap-3">{(["invitedCount", "registeredCount", "attendedCount", "followUpCount"] as const).map((field) => <Field key={field} label={field.replace("Count", "").replace(/^./, (char) => char.toUpperCase())}><Input min="0" type="number" value={props.attendanceForm[field]} onChange={(input) => props.setAttendanceForm({ ...props.attendanceForm, [field]: input.target.value })} /></Field>)}</div><div className="mt-3"><Field label="Value source"><select className="control" value={props.attendanceForm.valueSource} onChange={(input) => props.setAttendanceForm({ ...props.attendanceForm, valueSource: input.target.value })}><option value="self_reported">Self-reported</option><option value="observed">Observed aggregate</option><option value="partner_reported">Partner-reported</option><option value="unknown">Unknown</option></select></Field></div><Button className="mt-4" onClick={props.onSaveAttendance} data-testid="button-save-aggregate-attendance">Save attendance</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Community needs & evidence</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Need area"><Input value={props.needForm.needArea} onChange={(input) => props.setNeedForm({ ...props.needForm, needArea: input.target.value })} /></Field><Field label="Geography"><Input value={props.needForm.geography} onChange={(input) => props.setNeedForm({ ...props.needForm, geography: input.target.value })} /></Field><Field label="Source"><Input value={props.needForm.sourceName} onChange={(input) => props.setNeedForm({ ...props.needForm, sourceName: input.target.value })} /></Field><Field label="Evidence status"><select className="control" value={props.needForm.evidenceStatus} onChange={(input) => props.setNeedForm({ ...props.needForm, evidenceStatus: input.target.value })}><option value="self_reported">Self-reported</option><option value="observed">Observed</option><option value="derived">Derived</option><option value="partner_report">Partner report</option><option value="needs_review">Needs review</option></select></Field></div><Field label="Source URL (optional)"><Input type="url" value={props.needForm.sourceUrl} onChange={(input) => props.setNeedForm({ ...props.needForm, sourceUrl: input.target.value })} /></Field><Field label="How this event responds"><Textarea value={props.needForm.responseExplanation} onChange={(input) => props.setNeedForm({ ...props.needForm, responseExplanation: input.target.value })} /></Field><div className="flex gap-2"><Button onClick={props.onAddNeed} data-testid="button-add-community-need">{props.editingNeedId ? "Update need" : "Link need"}</Button>{props.editingNeedId && <Button variant="outline" onClick={props.onCancelNeedEdit}>Cancel</Button>}</div>{event.needs.map((need) => <div className="rounded border p-3 text-sm" key={need.id}><div className="flex justify-between gap-2"><strong>{need.needArea}</strong><span><Button size="sm" variant="ghost" onClick={() => props.onEditNeed(need)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => props.onRemoveNeed(need.id)}>Remove</Button></span></div><p className="text-muted-foreground">{need.geography} · {need.sourceName} · {need.evidenceStatus}</p><p className="mt-1">{need.responseExplanation}</p></div>)}</CardContent></Card>
    </div>}
    {!archived && <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Execution actions</CardTitle><p className="text-sm text-muted-foreground">Completion evidence records activity. Follow-up observations are separate and may remain unavailable.</p></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Action"><Input value={props.actionForm.title} onChange={(input) => props.setActionForm({ ...props.actionForm, title: input.target.value })} /></Field><Field label="Owner"><Input value={props.actionForm.ownerLabel} onChange={(input) => props.setActionForm({ ...props.actionForm, ownerLabel: input.target.value })} /></Field><Field label="Due date"><Input type="date" value={props.actionForm.dueDate} onChange={(input) => props.setActionForm({ ...props.actionForm, dueDate: input.target.value })} /></Field><Field label="Status"><select className="control" value={props.actionForm.status} onChange={(input) => props.setActionForm({ ...props.actionForm, status: input.target.value })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select></Field></div><Field label="Completion evidence (required when completed)"><Textarea value={props.actionForm.completionEvidence} onChange={(input) => props.setActionForm({ ...props.actionForm, completionEvidence: input.target.value })} /></Field><Field label="Next step"><Input value={props.actionForm.nextStep} onChange={(input) => props.setActionForm({ ...props.actionForm, nextStep: input.target.value })} /></Field><Field label="Follow-up expectation"><Textarea value={props.actionForm.followUpObservation} onChange={(input) => props.setActionForm({ ...props.actionForm, followUpObservation: input.target.value })} /></Field><Button onClick={() => { props.onAddAction(); props.setActionForm(emptyAction); }} data-testid="button-add-event-action">Add action</Button>{event.actions.map((action) => <div className="rounded border p-3 text-sm" key={action.id}><div className="flex flex-wrap items-center justify-between gap-2"><strong>{action.title}</strong><span className="flex gap-2"><Badge variant={action.status === "blocked" || actionIsOverdue(action) ? "destructive" : action.status === "completed" ? "default" : "outline"}>{actionIsOverdue(action) ? "overdue" : action.status}</Badge>{action.status !== "completed" && <select aria-label={`Update status for ${action.title}`} className="control h-8 w-32" value={action.status} onChange={(input) => { if (input.target.value !== "completed") props.onUpdateAction({ id: action.id, status: input.target.value }); }}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select>}</span></div><p className="mt-1 text-muted-foreground">Owner: {action.ownerLabel}{action.dueDate ? ` · Due ${action.dueDate}` : ""}</p>{action.nextStep && <p className="mt-1">Next: {action.nextStep}</p>}<div className="mt-3 space-y-2"><Textarea aria-label={`Follow-up observation for ${action.title}`} placeholder="Record a follow-up observation, or leave unavailable" value={actionFollowUp[action.id] ?? action.followUpObservation ?? ""} onChange={(input) => setActionFollowUp({ ...actionFollowUp, [action.id]: input.target.value })} /><Button size="sm" variant="outline" disabled={(actionFollowUp[action.id] ?? action.followUpObservation ?? "") === (action.followUpObservation ?? "")} onClick={() => props.onUpdateAction({ id: action.id, status: action.status, followUpObservation: (actionFollowUp[action.id] ?? "").trim() })}>Save follow-up</Button></div>{action.status !== "completed" && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input aria-label={`Completion evidence for ${action.title}`} placeholder="Record completion evidence before marking complete" value={actionEvidence[action.id] ?? action.completionEvidence ?? ""} onChange={(input) => setActionEvidence({ ...actionEvidence, [action.id]: input.target.value })} /><Button size="sm" variant="outline" disabled={!(actionEvidence[action.id] ?? action.completionEvidence ?? "").trim()} onClick={() => props.onUpdateAction({ id: action.id, status: "completed", completionEvidence: (actionEvidence[action.id] ?? action.completionEvidence ?? "").trim() })}>Mark complete</Button></div>}</div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Community stories</CardTitle><p className="text-sm text-muted-foreground">Human-entered only. A draft is private until all sharing requirements are recorded and approved.</p></CardHeader><CardContent className="space-y-3"><Field label="Story title"><Input value={props.storyForm.title} onChange={(input) => props.setStoryForm({ ...props.storyForm, title: input.target.value })} /></Field><Field label="Story draft"><Textarea value={props.storyForm.storyText} onChange={(input) => props.setStoryForm({ ...props.storyForm, storyText: input.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Attribution preference"><select className="control" value={props.storyForm.attributionPreference} onChange={(input) => props.setStoryForm({ ...props.storyForm, attributionPreference: input.target.value })}><option value="anonymous">Anonymous</option><option value="first_name">First name</option><option value="organization">Organization</option><option value="named">Named</option></select></Field><Field label="Intended audience"><select className="control" value={props.storyForm.intendedAudience} onChange={(input) => props.setStoryForm({ ...props.storyForm, intendedAudience: input.target.value })}><option value="private">Private draft</option><option value="internal_team">Internal team</option><option value="partner">Partner</option><option value="funder">Funder</option><option value="public">Public</option></select></Field></div><Field label="Permitted uses"><Input placeholder="e.g., internal reporting, funder packet" value={props.storyForm.permittedUses} onChange={(input) => props.setStoryForm({ ...props.storyForm, permittedUses: input.target.value })} /></Field><label className="flex gap-2 text-sm"><input type="checkbox" checked={props.storyForm.consentGranted} onChange={(input) => props.setStoryForm({ ...props.storyForm, consentGranted: input.target.checked })} />Explicit consent to the selected use(s) has been recorded.</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={props.storyForm.readyToShare} onChange={(input) => props.setStoryForm({ ...props.storyForm, readyToShare: input.target.checked })} />Approve this story for the selected, non-private audience.</label><div className="flex gap-2"><Button onClick={props.onSaveStory} data-testid="button-save-event-story">{props.editingStoryId ? "Update story" : "Save story"}</Button>{props.editingStoryId && <Button variant="outline" onClick={props.onClearStory}>New draft</Button>}</div>{event.stories.map((story) => <div key={story.id} className="rounded border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{story.title}</strong><Badge variant={story.sharingState === "approved" ? "default" : story.sharingState === "withdrawn" ? "destructive" : "outline"}>{story.sharingState}</Badge></div><p className="mt-1 line-clamp-2">{story.storyText}</p><p className="mt-1 text-muted-foreground">{story.attributionPreference} · {story.intendedAudience}</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => props.onEditStory(story)}>Edit</Button>{story.sharingState === "approved" && <Button size="sm" variant="destructive" onClick={() => props.onWithdrawStory(story.id)}>Withdraw consent</Button>}</div></div>)}</CardContent></Card>
    </div>}
  </fieldset>;
}

function AuditHistory({ eventId, orgId }: { eventId: string; orgId: string | null }) {
  const [visible, setVisible] = useState(false);
  const queryOrgKey = orgId ?? "default";
  const auditQuery = useQuery<{ audit: AuditEntry[] }>({
    queryKey: ["/api/nonprofit-events/events", eventId, "audit", queryOrgKey],
    queryFn: async ({ queryKey }) => {
      const targetQueryOrgKey = String(queryKey[3] ?? "default");
      const headers = targetQueryOrgKey === "default" ? undefined : { "x-org-id": targetQueryOrgKey };
      return (await apiRequest("GET", `/api/nonprofit-events/events/${eventId}/audit`, undefined, headers)).json();
    },
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