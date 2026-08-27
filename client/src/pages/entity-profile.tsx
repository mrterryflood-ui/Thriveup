import { useEffect, useId, useRef, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { Building2, ExternalLink, FileCheck2, Loader2, Radio, RefreshCw, Send, ShieldCheck } from "lucide-react";

interface MirrorResponse {
  organizationId: string;
  organizationName?: string;
  receivedAt: string | null;
  active: boolean;
  status: "received" | "not_received";
  source: "grantpathpro" | "thriveup" | null;
  projection?: {
    status: "received" | "unavailable";
    disclosure: string;
    source: { label: string; receivedAt: string; sourceType: string } | null;
    needs: string[];
    gaps: string[];
    residentPriorities: string[];
    services: string[];
    knownFundingSignals: string[];
  };
}

type OpportunityLane = "grants" | "procurement_contracting" | "sponsorship_in_kind" | "research_technology_transfer" | "capacity_building" | "partnership";

interface OpportunityPackageResponse {
  organizationId: string;
  package: {
    contractVersion: "v1";
    opportunityLanes: Array<{
      lane: OpportunityLane;
      evidenceStatus: string;
      rationale: string;
      verificationRequired: string;
    }>;
    communityMirror: {
      status: string;
      disclosure: string;
      needs: string[];
      gaps: string[];
      residentPriorities: string[];
      services: string[];
      knownFundingSignals: string[];
    };
    readiness: {
      knownSignals: string[];
      documentedNeeds: string[];
      serviceGaps: string[];
      scaleStrategy: { scaleUp: string; scaleOut: string; status: string };
      actions: string[];
      unknowns: string[];
    };
    collaboration: { categories: string[]; status: string };
    privacy: { organizationPrivateByDefault: boolean; crossOrganizationLearning: string };
  };
  authorization: { allowed: boolean; reason: string };
}

interface OpportunityFeedback {
  id: string;
  status: string;
  sourceLabel: string;
  receivedAt: string;
  decisionAt: string | null;
  awardAmount: number | null;
  amountDisclosure: string;
  funderFeedback: string | null;
  lesson: string | null;
}

interface OpportunityHandoff {
  id: string;
  deliveryState: "previewed" | "delivered" | "rejected" | "unavailable" | "delivery_unknown";
  deliveryDetail: string | null;
  authorizedAt: string;
  externalPursuitId: string | null;
  opportunityPackage: {
    handoff?: {
      selectedOpportunity?: { title?: string; lane?: string; sourceLabel?: string };
    };
  };
  feedback: OpportunityFeedback[];
}

interface OpportunityHandoffHistoryResponse {
  handoffs: OpportunityHandoff[];
}

const laneLabels: Record<OpportunityLane, string> = {
  grants: "Grants",
  procurement_contracting: "Procurement & contracting",
  sponsorship_in_kind: "Sponsorship & in-kind support",
  research_technology_transfer: "Research & technology transfer",
  capacity_building: "Capacity building",
  partnership: "Partnership paths",
};

function deliveryBadgeVariant(state: string): "default" | "secondary" | "destructive" | "outline" {
  if (state === "delivered") return "default";
  if (state === "rejected") return "destructive";
  if (state === "unavailable") return "secondary";
  if (state === "delivery_unknown") return "destructive";
  return "outline";
}

const deliveryStateLabels: Record<OpportunityHandoff["deliveryState"], string> = {
  previewed: "Awaiting delivery check",
  delivered: "GrantPathPro receipt confirmed",
  rejected: "Partner did not accept",
  unavailable: "Delivery not configured",
  delivery_unknown: "Delivery needs reconciliation",
};

function handoffStatusNotice(state: string, detail: string | null | undefined) {
  const safeDetail = detail || "No delivery detail was provided.";
  if (state === "delivered") return `GrantPathPro confirmed receipt of this handoff package. ${safeDetail}`;
  return `Authorization recorded; no partner handoff is complete. ${safeDetail}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "time not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "time not available" : date.toLocaleString();
}

function snapshotItems(snapshot: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = snapshot[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
  }
  return [];
}

function MirrorList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function EntityProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<OpportunityLane>("grants");
  const [sourceType, setSourceType] = useState<"primary_source" | "organization_provided" | "unverified_exploration">("unverified_exploration");
  const [sourceCheckedAt, setSourceCheckedAt] = useState("");
  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [handoffNotice, setHandoffNotice] = useState<string | null>(null);
  const [sourceUrlError, setSourceUrlError] = useState<string | null>(null);
  const [sourceCheckedAtError, setSourceCheckedAtError] = useState<string | null>(null);
  const [isSubmittingHandoff, setIsSubmittingHandoff] = useState(false);
  const [reconcilingHandoffId, setReconcilingHandoffId] = useState<string | null>(null);
  const requestIdRef = useRef("");
  const activeOrgIdRef = useRef(id);
  const asyncGenerationRef = useRef(0);
  const mutationGenerationRef = useRef(0);
  const authorizationDescriptionId = useId();
  const mirror = useQuery<MirrorResponse>({
    queryKey: ["/api/organizations", id, "grantpathpro-mirror"],
    queryFn: () => apiRequest("GET", `/api/organizations/${encodeURIComponent(id)}/grantpathpro-mirror`).then(r => r.json()),
    enabled: Boolean(id),
  });
  const opportunityPackage = useQuery<OpportunityPackageResponse>({
    queryKey: ["/api/organizations", id, "opportunity-package"],
    queryFn: () => apiRequest("GET", `/api/organizations/${encodeURIComponent(id)}/opportunity-package`).then(r => r.json()),
    enabled: Boolean(id),
  });
  const handoffHistory = useQuery<OpportunityHandoffHistoryResponse>({
    queryKey: ["/api/organizations", id, "opportunity-handoffs"],
    queryFn: () => apiRequest("GET", `/api/organizations/${encodeURIComponent(id)}/opportunity-handoffs`).then(r => r.json()),
    enabled: Boolean(id),
  });

  useEffect(() => {
    asyncGenerationRef.current += 1;
    mutationGenerationRef.current += 1;
    activeOrgIdRef.current = id;
    setEmbedUrl(null);
    setEmbedError(null);
    setSelectedLane("grants");
    setSourceType("unverified_exploration");
    setSourceCheckedAt("");
    setOpportunityTitle("");
    setSourceLabel("");
    setSourceUrl("");
    setSourceUrlError(null);
    setSourceCheckedAtError(null);
    setAuthorizationConfirmed(false);
    setHandoffError(null);
    setHandoffNotice(null);
    setSourceCheckedAtError(null);
    setIsSubmittingHandoff(false);
    setReconcilingHandoffId(null);
    try {
      requestIdRef.current = window.sessionStorage.getItem(`gpp-opportunity-pending:${id}`) || "";
    } catch {
      requestIdRef.current = "";
    }
  }, [id]);

  async function openGrantPathPro(mode: "iframe" | "redirect") {
    const requestedOrgId = id;
    const generation = asyncGenerationRef.current;
    setEmbedError(null);
    const popup = mode === "redirect" ? window.open("", "_blank", "noopener,noreferrer") : null;
    if (mode === "redirect" && !popup) {
      setEmbedError("Your browser blocked the GrantPathPro window. Allow pop-ups for this site, then try again.");
      return;
    }
    try {
      const response = await apiRequest("GET", `/api/consortium/gpp-embed?orgId=${encodeURIComponent(id)}&mode=${mode}`);
      const payload = await response.json() as { deepLinkUrl?: string };
      if (!payload.deepLinkUrl) throw new Error("GrantPathPro did not return a launch URL.");
      if (activeOrgIdRef.current !== requestedOrgId || asyncGenerationRef.current !== generation) {
        popup?.close();
        return;
      }
      if (mode === "redirect" && popup) popup.location.href = payload.deepLinkUrl;
      else setEmbedUrl(payload.deepLinkUrl);
    } catch (error) {
      popup?.close();
      if (activeOrgIdRef.current === requestedOrgId && asyncGenerationRef.current === generation) {
        setEmbedError(error instanceof Error ? error.message : "GrantPathPro is unavailable.");
      }
    }
  }

  async function authorizeOpportunityHandoff() {
    const requestedOrgId = id;
    const generation = asyncGenerationRef.current;
    const mutation = ++mutationGenerationRef.current;
    setHandoffError(null);
    setHandoffNotice(null);
    if (!opportunityTitle.trim() || !sourceLabel.trim() || !authorizationConfirmed) {
      setHandoffError("Name the opportunity, provide its source label, and explicitly confirm authorization before continuing.");
      return;
    }
    if (sourceType === "primary_source" && (!sourceUrl.trim() || !sourceCheckedAt)) {
      if (!sourceUrl.trim()) setSourceUrlError("A current primary source requires an HTTPS URL.");
      if (!sourceCheckedAt) setSourceCheckedAtError("A current primary source requires the date it was checked.");
      return;
    }
    if (sourceUrl.trim()) {
      try {
        if (new URL(sourceUrl.trim()).protocol !== "https:") throw new Error("invalid source URL");
      } catch {
        setSourceUrlError("Enter a valid HTTPS source URL or leave this field blank.");
        return;
      }
    }
    setSourceUrlError(null);
    setIsSubmittingHandoff(true);
    try {
      if (!requestIdRef.current) {
        requestIdRef.current = typeof crypto?.randomUUID === "function"
          ? crypto.randomUUID()
          : `browser-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      try { window.sessionStorage.setItem(`gpp-opportunity-pending:${requestedOrgId}`, requestIdRef.current); } catch { /* private storage may be unavailable */ }
      const response = await apiRequest("POST", `/api/organizations/${encodeURIComponent(id)}/opportunity-handoffs`, {
        contractVersion: "v1",
        authorizationConfirmed: true,
        requestId: requestIdRef.current,
        selectedOpportunity: {
          title: opportunityTitle.trim(),
          lane: selectedLane,
          sourceType,
          sourceLabel: sourceLabel.trim(),
          ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
          ...(sourceCheckedAt ? { sourceCheckedAt: new Date(sourceCheckedAt).toISOString() } : {}),
        },
      });
      const payload = await response.json() as { deliveryState: string; deliveryDetail?: string | null };
      if (activeOrgIdRef.current !== requestedOrgId || asyncGenerationRef.current !== generation || mutationGenerationRef.current !== mutation) return;
      setHandoffNotice(handoffStatusNotice(payload.deliveryState, payload.deliveryDetail));
      setAuthorizationConfirmed(false);
      if (payload.deliveryState === "delivered" || payload.deliveryState === "rejected") {
        try { window.sessionStorage.removeItem(`gpp-opportunity-pending:${requestedOrgId}`); } catch { /* private storage may be unavailable */ }
        requestIdRef.current = "";
      }
      await handoffHistory.refetch().catch(() => undefined);
    } catch (error) {
      if (activeOrgIdRef.current === requestedOrgId && asyncGenerationRef.current === generation && mutationGenerationRef.current === mutation) {
        setHandoffError(error instanceof Error ? error.message : "The handoff could not be recorded.");
      }
    } finally {
      if (activeOrgIdRef.current === requestedOrgId && asyncGenerationRef.current === generation && mutationGenerationRef.current === mutation) {
        setIsSubmittingHandoff(false);
      }
    }
  }

  async function reconcileHandoff(handoffId: string) {
    const requestedOrgId = id;
    const generation = asyncGenerationRef.current;
    const mutation = ++mutationGenerationRef.current;
    setHandoffError(null);
    setHandoffNotice(null);
    setReconcilingHandoffId(handoffId);
    try {
      const response = await apiRequest("POST", `/api/organizations/${encodeURIComponent(id)}/opportunity-handoffs/${encodeURIComponent(handoffId)}/reconcile`);
      const payload = await response.json() as { deliveryState: string; deliveryDetail?: string | null };
      if (activeOrgIdRef.current !== requestedOrgId || asyncGenerationRef.current !== generation || mutationGenerationRef.current !== mutation) return;
      setHandoffNotice(handoffStatusNotice(payload.deliveryState, payload.deliveryDetail));
      await handoffHistory.refetch().catch(() => undefined);
    } catch (error) {
      if (activeOrgIdRef.current === requestedOrgId && asyncGenerationRef.current === generation && mutationGenerationRef.current === mutation) {
        setHandoffError(error instanceof Error ? error.message : "The handoff could not be reconciled.");
      }
    } finally {
      if (activeOrgIdRef.current === requestedOrgId && asyncGenerationRef.current === generation && mutationGenerationRef.current === mutation) setReconcilingHandoffId(null);
    }
  }

  const projection = mirror.data?.projection;
  const needs = projection?.needs ?? [];
  const gaps = projection?.gaps ?? [];
  const priorities = projection?.residentPriorities ?? [];
  const packageData = opportunityPackage.data?.package;
  const lanes = Array.isArray(packageData?.opportunityLanes) ? packageData.opportunityLanes : [];
  const communityMirror = packageData?.communityMirror;
  const readiness = packageData?.readiness;
  const collaboration = packageData?.collaboration;
  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Entity profile</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            {mirror.data?.organizationName || "Organization"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Organization ID: {id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => mirror.refetch()} disabled={mirror.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${mirror.isFetching ? "animate-spin" : ""}`} /> Refresh Mirror
          </Button>
          <Button onClick={() => openGrantPathPro("redirect")}>
            <ExternalLink className="h-4 w-4 mr-2" /> Open GrantPathPro
          </Button>
        </div>
      </div>

      {mirror.error && <Alert variant="destructive"><AlertDescription>{mirror.error instanceof Error ? mirror.error.message : "Could not load this entity."}</AlertDescription></Alert>}
      {embedError && <Alert variant="destructive"><AlertDescription>{embedError}</AlertDescription></Alert>}
      {handoffError && <Alert variant="destructive"><AlertDescription>{handoffError}</AlertDescription></Alert>}
      {handoffNotice && <Alert><AlertDescription>{handoffNotice}</AlertDescription></Alert>}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>GrantPathPro Mirror</CardTitle>
          {mirror.data?.status === "received" ? (
            <Badge variant={mirror.data.active ? "default" : "secondary"}>
              <Radio className="h-3 w-3 mr-1" /> {mirror.data.active ? "Recent snapshot" : "Snapshot older than 7 days"}
            </Badge>
          ) : <Badge variant="outline">No snapshot received</Badge>}
        </CardHeader>
        <CardContent>
          {mirror.isLoading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading Mirror snapshot…</p> : projection?.status === "received" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Last received {formatDate(mirror.data?.receivedAt)}.
                Source: {projection.source?.label ?? "source not available"} · received {formatDate(projection.source?.receivedAt ?? mirror.data?.receivedAt)}. Shown as received, not independently verified.
              </p>
              <p className="text-xs text-muted-foreground">{projection?.disclosure ?? "Snapshot fields are shown as received and are not independently verified."}</p>
              {(needs.length > 0 || gaps.length > 0 || priorities.length > 0) && (
                <div className="grid gap-4 md:grid-cols-3 border rounded-md p-4">
                  <MirrorList title="Needs" items={needs} />
                  <MirrorList title="Gaps" items={gaps} />
                  <MirrorList title="Resident priorities" items={priorities} />
                </div>
              )}
              <MirrorList title="Services reported in the snapshot" items={projection?.services ?? []} />
              <MirrorList title="Known funding signals" items={projection?.knownFundingSignals ?? []} />
              <p className="text-xs text-muted-foreground">Raw partner payloads are retained server-side and are not rendered in the browser.</p>
            </div>
          ) : <p className="text-sm text-muted-foreground">No Mirror snapshot has been received for this organization yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5" /> Community Opportunity Mirror</CardTitle>
          <p className="text-sm text-muted-foreground">
            Explore adjacent paths from this organization’s documented profile. These are exploration lanes—not eligibility, availability, award, deadline, or partner-commitment findings.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {opportunityPackage.isLoading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading opportunity package…</p> : opportunityPackage.error ? (
            <Alert variant="destructive"><AlertDescription>{opportunityPackage.error instanceof Error ? opportunityPackage.error.message : "Could not load the opportunity package."}</AlertDescription></Alert>
          ) : packageData ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {lanes.map((lane) => (
                  <div key={lane.lane} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">{laneLabels[lane.lane]}</h3>
                      <Badge variant="outline">{(typeof lane.evidenceStatus === "string" ? lane.evidenceStatus.replace(/_/g, " ") : "") || "unknown evidence status"}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{lane.rationale || "No rationale is available."}</p>
                    <p className="mt-2 text-xs text-muted-foreground"><strong>Before pursuing:</strong> {lane.verificationRequired || "Confirm current requirements and fit."}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground space-y-3">
                <p><strong>Community evidence status:</strong> {communityMirror?.status ?? "unknown"}. {communityMirror?.disclosure ?? "No community evidence status was returned."}</p>
                <strong>Known profile signals:</strong> {readiness?.knownSignals?.length ? readiness.knownSignals.join(", ") : "None recorded yet."}
                <MirrorList title="Documented community needs" items={readiness?.documentedNeeds ?? []} />
                <MirrorList title="Service gaps" items={readiness?.serviceGaps ?? []} />
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {(readiness?.unknowns ?? []).map((unknown) => <li key={unknown}>{unknown}</li>)}
                </ul>
              </div>
              <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-2">
                <strong>Scale strategy (advisory)</strong>
                <p><strong>Scale up:</strong> {readiness?.scaleStrategy?.scaleUp ?? "No scale-up guidance is available."}</p>
                <p><strong>Scale out:</strong> {readiness?.scaleStrategy?.scaleOut ?? "No scale-out guidance is available."}</p>
                <p className="text-xs">{readiness?.scaleStrategy?.status ?? "Advisory only; verify fit before acting."}</p>
              </div>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <strong>Potential collaborator categories:</strong> {collaboration?.categories?.join(", ") || "None recorded."}. {collaboration?.status ?? "Potential only; partner willingness is unknown."}
              </div>
            </>
          ) : opportunityPackage.data ? <Alert variant="destructive"><AlertDescription>The opportunity package response was incomplete. Refresh and try again; no handoff was authorized.</AlertDescription></Alert> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correct or add community knowledge</CardTitle>
          <p className="text-sm text-muted-foreground">
            Invite a community member or informal caregiver to describe what is happening in their own words. Participation and every sharing choice are voluntary; this does not alter the organization’s private handoff.
          </p>
        </CardHeader>
        <CardContent>
          <IntegrationInvitation
            surface="direct"
            surfaceContext={`organization:${id}`}
            prompt="What should this organization understand about the community?"
            description="Share only what you want to share. All consent choices start off, and you can withdraw them later."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Authorize a GrantPathPro handoff</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review the opportunity and source before authorizing. Opening GrantPathPro or viewing this package does not authorize a handoff.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Opportunity lane
              <select
                aria-label="Select opportunity lane"
                data-testid="opportunity-handoff-lane"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"
                value={selectedLane}
                onChange={(event) => setSelectedLane(event.target.value as OpportunityLane)}
              >
                {Object.entries(laneLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              Opportunity name
              <input aria-label="Opportunity name" data-testid="opportunity-handoff-title" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={opportunityTitle} onChange={(event) => setOpportunityTitle(event.target.value)} placeholder="Name the source-backed opportunity or exploration target" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Source type
              <select aria-label="Opportunity source type" data-testid="opportunity-handoff-source-type" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={sourceType} onChange={(event) => setSourceType(event.target.value as typeof sourceType)}>
                <option value="primary_source">Current primary source</option>
                <option value="organization_provided">Organization-provided context</option>
                <option value="unverified_exploration">Unverified exploration target</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              Source label
              <input aria-label="Opportunity source label" data-testid="opportunity-handoff-source-label" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="e.g., agency notice, partner conversation, organization research" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Source URL <span className="font-normal text-muted-foreground">{sourceType === "primary_source" ? "(required for a primary source)" : "(optional)"}</span>
              <input aria-label="Opportunity source URL" aria-invalid={Boolean(sourceUrlError)} aria-describedby={sourceUrlError ? "opportunity-source-url-error" : undefined} data-testid="opportunity-handoff-source-url" type="url" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" />
              {sourceUrlError && <span id="opportunity-source-url-error" className="block text-xs font-normal text-destructive">{sourceUrlError}</span>}
            </label>
            <label className="space-y-1 text-sm font-medium">
              Source checked at <span className="font-normal text-muted-foreground">{sourceType === "primary_source" ? "(required for a primary source)" : "(optional)"}</span>
              <input aria-label="Opportunity source checked at" aria-invalid={Boolean(sourceCheckedAtError)} aria-describedby={sourceCheckedAtError ? "opportunity-source-checked-at-error" : undefined} data-testid="opportunity-handoff-source-checked-at" type="datetime-local" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={sourceCheckedAt} onChange={(event) => { setSourceCheckedAt(event.target.value); setSourceCheckedAtError(null); }} />
              {sourceCheckedAtError && <span id="opportunity-source-checked-at-error" className="block text-xs font-normal text-destructive">{sourceCheckedAtError}</span>}
            </label>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox id="authorize-handoff" aria-describedby={authorizationDescriptionId} data-testid="opportunity-handoff-authorize" checked={authorizationConfirmed} onCheckedChange={(checked) => setAuthorizationConfirmed(checked === true)} />
            <label id={authorizationDescriptionId} htmlFor="authorize-handoff" className="text-sm leading-5">
              I authorize ThriveUp to send this specific v1 opportunity package to GrantPathPro for internal pursuit intake only. The package includes the organization profile, selected source-labeled opportunity, readiness signals, and stated unknowns. It does not authorize partner, funder, or collaborator outreach; submit an application; or guarantee any outcome.
            </label>
          </div>
          {opportunityPackage.data && !opportunityPackage.data.authorization.allowed && <p className="text-sm text-muted-foreground">{opportunityPackage.data.authorization.reason} Ask an organization owner to authorize this handoff.</p>}
          <Button data-testid="opportunity-handoff-submit" aria-label="Authorize and send opportunity handoff" onClick={authorizeOpportunityHandoff} disabled={isSubmittingHandoff || opportunityPackage.isLoading || Boolean(opportunityPackage.error) || opportunityPackage.data?.authorization.allowed === false}>
            {isSubmittingHandoff ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Authorize handoff
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Private handoff & outcome history</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {handoffHistory.isLoading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading private handoff history…</p> : handoffHistory.error ? (
            <Alert variant="destructive"><AlertDescription>{handoffHistory.error instanceof Error ? handoffHistory.error.message : "Could not load the handoff history."}</AlertDescription></Alert>
          ) : handoffHistory.data?.handoffs.length ? handoffHistory.data.handoffs.map((handoff) => (
            <div key={handoff.id} className="rounded-md border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{handoff.opportunityPackage.handoff?.selectedOpportunity?.title || "Authorized opportunity package"}</p>
                  <p className="text-xs text-muted-foreground">Authorized {formatDate(handoff.authorizedAt)} · {handoff.opportunityPackage.handoff?.selectedOpportunity?.sourceLabel || "source label not available"}</p>
                </div>
                <Badge variant={deliveryBadgeVariant(handoff.deliveryState)}>{deliveryStateLabels[handoff.deliveryState] ?? "Unknown delivery state"}</Badge>
              </div>
              {handoff.deliveryDetail && <p className="text-sm text-muted-foreground">{handoff.deliveryDetail}</p>}
               {["previewed", "unavailable", "delivery_unknown"].includes(handoff.deliveryState) && (
                 <div className="flex flex-wrap items-center gap-2">
                   <Button variant="outline" size="sm" data-testid={`opportunity-handoff-reconcile-${handoff.id}`} onClick={() => reconcileHandoff(handoff.id)} disabled={reconcilingHandoffId === handoff.id}>
                     {reconcilingHandoffId === handoff.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                     Reconcile same handoff
                   </Button>
                    <span className="text-xs text-muted-foreground">Retries the original idempotency key; it does not create a replacement pursuit or authorize outreach.</span>
                 </div>
               )}
              {handoff.feedback.length > 0 ? (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">GrantPathPro feedback</p>
                  {handoff.feedback.map((feedback) => (
                    <div key={feedback.id} className="rounded bg-muted p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{(typeof feedback.status === "string" ? feedback.status.replace(/_/g, " ") : "unknown status")}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(feedback.receivedAt)}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Source: {feedback.sourceLabel}</p>
                      {feedback.amountDisclosure === "shared" && typeof feedback.awardAmount === "number" && Number.isFinite(feedback.awardAmount) && <p className="mt-1">Reported award amount: ${feedback.awardAmount.toLocaleString()}</p>}
                      {feedback.funderFeedback && <p className="mt-1"><strong>Feedback:</strong> {feedback.funderFeedback}</p>}
                      {feedback.lesson && <p className="mt-1"><strong>Lesson:</strong> {feedback.lesson}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No partner feedback has been received for this handoff. Outcomes remain private to this organization.</p>}
            </div>
          )) : <p className="text-sm text-muted-foreground">No authorized handoffs yet. Packages remain private to this organization, and cross-organization learning is disabled by default.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Continue in GrantPathPro</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Open the embedded GrantPathPro workspace without leaving this entity profile.</p>
          <Button variant="outline" onClick={() => openGrantPathPro("iframe")}>Load embedded workspace</Button>
          {embedUrl && <iframe title="GrantPathPro workspace" src={embedUrl} className="w-full min-h-[720px] rounded-md border" />}
        </CardContent>
      </Card>
    </div>
  );
}