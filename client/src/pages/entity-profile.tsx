import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, ExternalLink, FileCheck2, Loader2, Radio, RefreshCw, Send, ShieldCheck } from "lucide-react";

interface MirrorResponse {
  organizationId: string;
  organizationName?: string;
  snapshot: Record<string, unknown> | null;
  receivedAt: string | null;
  active: boolean;
  status: "received" | "not_received";
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
    readiness: { knownSignals: string[]; unknowns: string[] };
    collaboration: { categories: string[]; status: string };
    privacy: { organizationPrivateByDefault: boolean; crossOrganizationLearning: string };
  };
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
  deliveryState: "previewed" | "delivered" | "rejected" | "unavailable";
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

function deliveryBadgeVariant(state: OpportunityHandoff["deliveryState"]): "default" | "secondary" | "destructive" | "outline" {
  if (state === "delivered") return "default";
  if (state === "rejected") return "destructive";
  if (state === "unavailable") return "secondary";
  return "outline";
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
  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [handoffNotice, setHandoffNotice] = useState<string | null>(null);
  const [isSubmittingHandoff, setIsSubmittingHandoff] = useState(false);
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

  async function openGrantPathPro(mode: "iframe" | "redirect") {
    setEmbedError(null);
    try {
      const response = await apiRequest("GET", `/api/consortium/gpp-embed?orgId=${encodeURIComponent(id)}&mode=${mode}`);
      const payload = await response.json() as { deepLinkUrl?: string };
      if (!payload.deepLinkUrl) throw new Error("GrantPathPro did not return a launch URL.");
      if (mode === "redirect") window.open(payload.deepLinkUrl, "_blank", "noopener,noreferrer");
      else setEmbedUrl(payload.deepLinkUrl);
    } catch (error) {
      setEmbedError(error instanceof Error ? error.message : "GrantPathPro is unavailable.");
    }
  }

  async function authorizeOpportunityHandoff() {
    setHandoffError(null);
    setHandoffNotice(null);
    if (!opportunityTitle.trim() || !sourceLabel.trim() || !authorizationConfirmed) {
      setHandoffError("Name the opportunity, provide its source label, and explicitly confirm authorization before continuing.");
      return;
    }
    setIsSubmittingHandoff(true);
    try {
      const response = await apiRequest("POST", `/api/organizations/${encodeURIComponent(id)}/opportunity-handoffs`, {
        contractVersion: "v1",
        authorizationConfirmed: true,
        selectedOpportunity: {
          title: opportunityTitle.trim(),
          lane: selectedLane,
          sourceType: sourceUrl.trim() ? "primary_source" : "unverified_exploration",
          sourceLabel: sourceLabel.trim(),
          ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
        },
      });
      const payload = await response.json() as { deliveryState: string; deliveryDetail: string };
      setHandoffNotice(`Handoff recorded: ${payload.deliveryState}. ${payload.deliveryDetail}`);
      setAuthorizationConfirmed(false);
      await handoffHistory.refetch();
    } catch (error) {
      setHandoffError(error instanceof Error ? error.message : "The handoff could not be recorded.");
    } finally {
      setIsSubmittingHandoff(false);
    }
  }

  const snapshot = mirror.data?.snapshot;
  const needs = snapshot ? snapshotItems(snapshot, ["needs", "communityNeeds", "identifiedNeeds"]) : [];
  const gaps = snapshot ? snapshotItems(snapshot, ["gaps", "serviceGaps", "identifiedGaps"]) : [];
  const priorities = snapshot ? snapshotItems(snapshot, ["residentPriorities", "priorities", "communityPriorities"]) : [];
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
              <Radio className="h-3 w-3 mr-1" /> {mirror.data.active ? "Stream active" : "Needs refresh"}
            </Badge>
          ) : <Badge variant="outline">No snapshot received</Badge>}
        </CardHeader>
        <CardContent>
          {mirror.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : snapshot ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Last received {mirror.data?.receivedAt ? new Date(mirror.data.receivedAt).toLocaleString() : "unknown"}.
                This is partner-provided Mirror data, shown as received.
              </p>
              {(needs.length > 0 || gaps.length > 0 || priorities.length > 0) && (
                <div className="grid gap-4 md:grid-cols-3 border rounded-md p-4">
                  <MirrorList title="Needs" items={needs} />
                  <MirrorList title="Gaps" items={gaps} />
                  <MirrorList title="Resident priorities" items={priorities} />
                </div>
              )}
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
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
          {opportunityPackage.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : opportunityPackage.error ? (
            <Alert variant="destructive"><AlertDescription>{opportunityPackage.error instanceof Error ? opportunityPackage.error.message : "Could not load the opportunity package."}</AlertDescription></Alert>
          ) : opportunityPackage.data && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {opportunityPackage.data.package.opportunityLanes.map((lane) => (
                  <div key={lane.lane} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">{laneLabels[lane.lane]}</h3>
                      <Badge variant="outline">{lane.evidenceStatus.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{lane.rationale}</p>
                    <p className="mt-2 text-xs text-muted-foreground"><strong>Before pursuing:</strong> {lane.verificationRequired}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                <strong>Known profile signals:</strong> {opportunityPackage.data.package.readiness.knownSignals.length ? opportunityPackage.data.package.readiness.knownSignals.join(", ") : "None recorded yet."}
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {opportunityPackage.data.package.readiness.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
                </ul>
              </div>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <strong>Potential collaborator categories:</strong> {opportunityPackage.data.package.collaboration.categories.join(", ")}. {opportunityPackage.data.package.collaboration.status}
              </div>
            </>
          )}
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
              Source label
              <input aria-label="Opportunity source label" data-testid="opportunity-handoff-source-label" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="e.g., agency notice, partner conversation, organization research" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Source URL <span className="font-normal text-muted-foreground">(optional)</span>
              <input aria-label="Opportunity source URL" data-testid="opportunity-handoff-source-url" type="url" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" />
            </label>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox id="authorize-handoff" aria-label="Confirm opportunity handoff authorization" data-testid="opportunity-handoff-authorize" checked={authorizationConfirmed} onCheckedChange={(checked) => setAuthorizationConfirmed(checked === true)} />
            <label htmlFor="authorize-handoff" className="text-sm leading-5">
              I authorize ThriveUp to send this specific v1 opportunity package to GrantPathPro. I understand this starts a pursuit-workflow handoff only; it does not submit an application, contact a funder, or guarantee any outcome.
            </label>
          </div>
          <Button data-testid="opportunity-handoff-submit" aria-label="Authorize and send opportunity handoff" onClick={authorizeOpportunityHandoff} disabled={isSubmittingHandoff}>
            {isSubmittingHandoff ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Authorize handoff
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Private handoff & outcome history</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {handoffHistory.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : handoffHistory.error ? (
            <Alert variant="destructive"><AlertDescription>{handoffHistory.error instanceof Error ? handoffHistory.error.message : "Could not load the handoff history."}</AlertDescription></Alert>
          ) : handoffHistory.data?.handoffs.length ? handoffHistory.data.handoffs.map((handoff) => (
            <div key={handoff.id} className="rounded-md border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{handoff.opportunityPackage.handoff?.selectedOpportunity?.title || "Authorized opportunity package"}</p>
                  <p className="text-xs text-muted-foreground">Authorized {new Date(handoff.authorizedAt).toLocaleString()} · {handoff.opportunityPackage.handoff?.selectedOpportunity?.sourceLabel || "source label not available"}</p>
                </div>
                <Badge variant={deliveryBadgeVariant(handoff.deliveryState)}>{handoff.deliveryState}</Badge>
              </div>
              {handoff.deliveryDetail && <p className="text-sm text-muted-foreground">{handoff.deliveryDetail}</p>}
              {handoff.feedback.length > 0 ? (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">GrantPathPro feedback</p>
                  {handoff.feedback.map((feedback) => (
                    <div key={feedback.id} className="rounded bg-muted p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{feedback.status.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(feedback.receivedAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Source: {feedback.sourceLabel}</p>
                      {feedback.amountDisclosure === "shared" && feedback.awardAmount !== null && <p className="mt-1">Reported award amount: ${feedback.awardAmount.toLocaleString()}</p>}
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