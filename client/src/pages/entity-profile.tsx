import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, ExternalLink, Loader2, Radio, RefreshCw } from "lucide-react";

interface MirrorResponse {
  organizationId: string;
  organizationName?: string;
  snapshot: Record<string, unknown> | null;
  receivedAt: string | null;
  active: boolean;
  status: "received" | "not_received";
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
  const mirror = useQuery<MirrorResponse>({
    queryKey: ["/api/organizations", id, "grantpathpro-mirror"],
    queryFn: () => apiRequest("GET", `/api/organizations/${encodeURIComponent(id)}/grantpathpro-mirror`).then(r => r.json()),
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