import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TradeSimsLogin } from "@shared/schema";

interface SignupsResponse {
  signups: TradeSimsLogin[];
  count: number;
}

function formatTrialMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

function formatWhen(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString();
}

function nameOf(row: TradeSimsLogin): string {
  const first = row.firstName ?? "";
  const last = row.lastName ?? "";
  const full = `${first} ${last}`.trim();
  return full || row.email || row.userId;
}

function TradeSimsSignupsInner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<SignupsResponse>({
    queryKey: ["/api/admin/trade-sims-signups"],
  });

  const digestMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/trade-sims-signups/send-digest");
      return r.json();
    },
    onSuccess: (res: any) => {
      toast({
        title: "Digest triggered",
        description: res?.sent?.ok
          ? `Sent. ${res?.sent?.count ?? 0} signup(s) reported.`
          : `Not sent: ${res?.sent?.reason || "unknown"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-sims-signups"] });
    },
    onError: (err: any) => {
      toast({
        title: "Digest failed",
        description: err?.message || "Could not send digest.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container max-w-6xl py-8 px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Trade Sims Signups
          </h1>
          <p className="text-muted-foreground text-sm">
            Every authenticated visitor to a Trade Sims page. New signups roll up into the daily digest email.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-sims-signups"] })}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => digestMutation.mutate()}
            disabled={digestMutation.isPending}
            data-testid="button-send-digest"
          >
            <Mail className="h-4 w-4 mr-1" />
            {digestMutation.isPending ? "Sending…" : "Send digest now"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Total signups
            </CardDescription>
            <CardTitle className="text-3xl" data-testid="stat-total">
              {isLoading ? "…" : data?.count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Awaiting digest
            </CardDescription>
            <CardTitle className="text-3xl" data-testid="stat-pending-digest">
              {isLoading
                ? "…"
                : data?.signups.filter((s) => !s.notifiedInDigest).length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trial length</CardDescription>
            <CardTitle className="text-3xl">10 min</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All signups (most recent first)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && (
            <div className="text-sm text-destructive" data-testid="text-error">
              Could not load signups.
            </div>
          )}
          {data && data.signups.length === 0 && (
            <div className="text-sm text-muted-foreground" data-testid="text-empty">
              No signups yet. Anonymous trials run for 10 minutes — when someone signs in, they show up here.
            </div>
          )}
          {data && data.signups.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-signups">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">First seen</th>
                    <th className="py-2 pr-3">Last seen</th>
                    <th className="py-2 pr-3">Visits</th>
                    <th className="py-2 pr-3">Trial used</th>
                    <th className="py-2 pr-3">Last path</th>
                    <th className="py-2 pr-3">Digest</th>
                  </tr>
                </thead>
                <tbody>
                  {data.signups.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-b-0"
                      data-testid={`row-signup-${row.userId}`}
                    >
                      <td className="py-2 pr-3 font-medium" data-testid={`text-name-${row.userId}`}>
                        {nameOf(row)}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{row.email || "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{formatWhen(row.firstSeenAt)}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{formatWhen(row.lastSeenAt)}</td>
                      <td className="py-2 pr-3" data-testid={`text-visits-${row.userId}`}>
                        {row.totalVisits}
                      </td>
                      <td className="py-2 pr-3" data-testid={`text-trial-used-${row.userId}`}>
                        {formatTrialMs(row.trialMsUsedBeforeLogin)}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground max-w-[20ch] truncate" title={row.lastPath ?? ""}>
                        {row.lastPath || "—"}
                      </td>
                      <td className="py-2 pr-3">
                        {row.notifiedInDigest ? (
                          <Badge variant="secondary">sent</Badge>
                        ) : (
                          <Badge>pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TradeSimsSignupsPage() {
  return (
    <RequireAuth adminOnly>
      <TradeSimsSignupsInner />
    </RequireAuth>
  );
}
