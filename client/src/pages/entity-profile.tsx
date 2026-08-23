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
      const payload = await response.json() as { url?: string };
      if (!payload.url) throw new Error("GrantPathPro did not return a launch URL.");
      if (mode === "redirect") window.open(payload.url, "_blank", "noopener,noreferrer");
      else setEmbedUrl(payload.url);
    } catch (error) {
      setEmbedError(error instanceof Error ? error.message : "GrantPathPro is unavailable.");
    }
  }

  const snapshot = mirror.data?.snapshot;
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