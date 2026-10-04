// Hazard context, bridged from HazardAware through the authenticated partner
// exchange. Honest states honored here:
//   - bridge unconfigured or unreachable → the card says so; it never shows
//     an empty hazard list as if the weather were calm;
//   - failed feeds inside a packet are named, never zeroed;
//   - the plain-words answer comes from HazardAware's resident lane with its
//     limits attached — ThriveUp does not rewrite its partner's answers.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CloudSun, ExternalLink } from "lucide-react";

type PartnerStatus = { bridge: string; configured: boolean; note: string; partnerBaseUrl: string | null };
type ContextBody = {
  place?: { name?: string; lat?: number; lon?: number } | null;
  summary?: string | null;
  feeds?: { id: string; name?: string; status?: string; detail?: string; observedAt?: string | null }[];
  honestState?: { liveFeeds?: number; failedFeeds?: number; note?: string };
};

export function HazardContextSection() {
  const [place, setPlace] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const status = useQuery<PartnerStatus>({
    queryKey: ["/api/hazardaware/status"],
    queryFn: async () => {
      const r = await fetch("/api/hazardaware/status");
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
    staleTime: 5 * 60_000,
  });
  const context = useQuery<ContextBody, Error>({
    queryKey: ["/api/hazardaware/context", asked],
    queryFn: async () => {
      const r = await fetch("/api/hazardaware/context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(asked ? { q: asked } : {}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "The bridge did not answer.");
      return data;
    },
    enabled: !!asked,
    staleTime: 60_000,
  });

  if (status.isLoading) return null;
  const s = status.data;
  if (!s?.configured) {
    return (
      <section data-testid="section-hazard-context">
        <Card className="p-4 border-dashed" data-testid="card-hazard-unconfigured">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-none" />
            <div>
              <div className="font-semibold text-sm">Hazard context: bridge not active</div>
              <p className="text-xs text-muted-foreground mt-1">{s?.note || "The HazardAware bridge is not configured on this deployment."}</p>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section data-testid="section-hazard-context" className="space-y-3">
      <h2 className="text-xl font-bold flex items-center gap-2"><CloudSun className="w-5 h-5 text-sky-500" />Hazard Context for This Community</h2>
      <Card className="p-4" data-testid="card-hazard-ask">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Ask about a place: city, ZIP, or county this community lives in"
            className="flex-1"
            aria-label="Hazard place"
          />
          <Button onClick={() => setAsked(place.trim() || null)} disabled={!place.trim() || context.isFetching}>
            {context.isFetching ? "Asking HazardAware…" : "Bring in hazard context"}
          </Button>
        </div>
        {status.data?.partnerBaseUrl && (
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Bridged live from {status.data.partnerBaseUrl} — failed feeds are named there, never shown as calm.
          </p>
        )}
      </Card>
      {context.isError && (
        <Card className="p-4 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30" data-testid="card-hazard-error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-none" />
            <p className="text-xs text-amber-700 dark:text-amber-400">{(context.error as Error)?.message}</p>
          </div>
        </Card>
      )}
      {context.data && (
        <Card className="p-4" data-testid="card-hazard-context">
          {context.data.place?.name && (
            <div className="text-sm font-medium">{context.data.place.name}</div>
          )}
          {context.data.summary && <p className="text-xs text-muted-foreground mt-1">{context.data.summary}</p>}
          {context.data.honestState && (
            <p className="text-[11px] mt-2">
              <Badge variant="outline" className="text-[10px] mr-2">{context.data.honestState.liveFeeds ?? "?"} live</Badge>
              {(context.data.honestState.failedFeeds ?? 0) > 0 && (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">{context.data.honestState.failedFeeds} failed — named, not hidden</Badge>
              )}
            </p>
          )}
          <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto">
            {(context.data.feeds || []).slice(0, 12).map((f) => (
              <div key={f.id} className="text-xs border rounded p-2 flex items-start gap-2">
                <Badge variant={f.status === "live" ? "default" : "secondary"} className="text-[10px] flex-none">{f.status || "?"}</Badge>
                <div className="min-w-0">
                  <div className="font-medium truncate">{f.name || f.id}</div>
                  {f.detail && <p className="text-muted-foreground mt-0.5 line-clamp-2">{f.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
