import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Users, ExternalLink, Search, Activity, Shield, AlertCircle, CheckCircle2 } from "lucide-react";

type Tile = {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  color?: string;
  total: number;
  admins: number;
  active7d: number;
  hasSecret: boolean;
  lastEventAt?: string | null;
};

type Member = {
  id: string;
  platformId: string;
  platformName: string;
  platformBaseUrl: string | null;
  externalUserId: string;
  email?: string | null;
  displayName?: string | null;
  role: string;
  zip?: string | null;
  county?: string | null;
  conditions?: string[] | null;
  navigatorEngaged: boolean;
  appointmentsBooked: number;
  loginCount: number;
  firstSeenAt?: string | null;
  lastLoginAt?: string | null;
  lastEventAt?: string | null;
};

export default function NetworkMembersPage() {
  const [platform, setPlatform] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [q, setQ] = useState<string>("");

  const summary = useQuery<{ ok: boolean; platforms: Tile[] }>({ queryKey: ["/api/network/summary"] });

  const memberParams = new URLSearchParams();
  if (platform !== "all") memberParams.set("platform", platform);
  if (role !== "all") memberParams.set("role", role);
  if (q) memberParams.set("q", q);
  const memberQs = memberParams.toString();
  const members = useQuery<{ ok: boolean; members: Member[]; total: number }>({
    queryKey: ["/api/network/members", platform, role, q],
    queryFn: async () => {
      const r = await fetch(`/api/network/members${memberQs ? `?${memberQs}` : ""}`, { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
  });

  const tiles = summary.data?.platforms ?? [];
  const totals = tiles.reduce(
    (acc, t) => ({
      members: acc.members + (t.total ?? 0),
      admins: acc.admins + (t.admins ?? 0),
      active7d: acc.active7d + (t.active7d ?? 0),
    }),
    { members: 0, admins: 0, active7d: 0 },
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ecosystem Federation</div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-title">
              <Users className="h-7 w-7" /> Network Members
            </h1>
            <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
              Unified roster across HerHealth Network, Bible Study Buddies, and other federated platforms. Each platform
              keeps its own auth and data — this view mirrors signed signup/login/engagement events. Click any member to
              jump back to their source platform.
            </p>
          </div>
          <Link href="/health-network">
            <Button variant="outline" size="sm" data-testid="link-back-network">← Health Network</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold" data-testid="stat-platforms">{tiles.length}</div><div className="text-xs text-muted-foreground">Federated platforms</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold" data-testid="stat-total-members">{totals.members.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total members</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold" data-testid="stat-admins">{totals.admins}</div><div className="text-xs text-muted-foreground">Admins across network</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold" data-testid="stat-active7d">{totals.active7d}</div><div className="text-xs text-muted-foreground">Active in last 7 days</div></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <Card key={t.id} className="overflow-hidden" data-testid={`tile-platform-${t.id}`}>
              <div className={`h-2 bg-gradient-to-r ${t.color ?? "from-slate-400 to-slate-600"}`} />
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    <a href={t.baseUrl} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:underline truncate flex items-center gap-1">
                      {t.baseUrl.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {t.hasSecret ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Live</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1 border-amber-500 text-amber-600"><AlertCircle className="h-3 w-3" /> Secret needed</Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div><div className="text-lg font-bold">{t.total}</div><div className="text-[10px] text-muted-foreground">members</div></div>
                  <div><div className="text-lg font-bold">{t.admins}</div><div className="text-[10px] text-muted-foreground">admins</div></div>
                  <div><div className="text-lg font-bold">{t.active7d}</div><div className="text-[10px] text-muted-foreground">7d active</div></div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setPlatform(t.id)} data-testid={`button-filter-${t.id}`}>
                  Filter to this platform →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or name…" className="pl-8" data-testid="input-search" />
              </div>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-[200px]" data-testid="select-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  {tiles.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[140px]" data-testid="select-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {members.isLoading && <div className="py-12 text-center text-muted-foreground">Loading…</div>}
            {members.isError && <div className="py-8 text-center text-destructive">Failed to load. You may need admin access.</div>}
            {members.data && members.data.members.length === 0 && (
              <div className="py-12 text-center text-muted-foreground border rounded-md border-dashed">
                No members yet. Once a federated platform starts posting signed events to <code>/api/network/events</code>, members will appear here.
              </div>
            )}

            {members.data && members.data.members.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2 pr-2">Member</th>
                      <th className="text-left py-2 pr-2">Platform</th>
                      <th className="text-left py-2 pr-2">Role</th>
                      <th className="text-left py-2 pr-2">Geo</th>
                      <th className="text-right py-2 pr-2">Logins</th>
                      <th className="text-right py-2 pr-2">Appts</th>
                      <th className="text-left py-2 pr-2">Last login</th>
                      <th className="text-right py-2">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.data.members.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/30" data-testid={`row-member-${m.id}`}>
                        <td className="py-2 pr-2">
                          <div className="font-medium">{m.displayName ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{m.email ?? m.externalUserId}</div>
                        </td>
                        <td className="py-2 pr-2"><Badge variant="outline">{m.platformName}</Badge></td>
                        <td className="py-2 pr-2">
                          {m.role === "admin"
                            ? <Badge className="bg-violet-600 text-white text-[10px]"><Shield className="h-3 w-3 mr-1" />admin</Badge>
                            : <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>}
                        </td>
                        <td className="py-2 pr-2 text-xs text-muted-foreground">{[m.county, m.zip].filter(Boolean).join(" · ") || "—"}</td>
                        <td className="py-2 pr-2 text-right font-mono">{m.loginCount}</td>
                        <td className="py-2 pr-2 text-right font-mono">{m.appointmentsBooked}</td>
                        <td className="py-2 pr-2 text-xs">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : "—"}</td>
                        <td className="py-2 text-right">
                          {m.platformBaseUrl && (
                            <a href={m.platformBaseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary hover:underline">
                              Source <ExternalLink className="h-3 w-3 ml-0.5" />
                            </a>
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

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Hooking up a new platform</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Each federated platform posts signed events to <code>POST /api/network/events</code> with header <code>X-Network-Platform</code> and HMAC-SHA256 in <code>X-Network-Signature</code>.</p>
            <p>Full integration spec lives in the repo at <code>docs/integrations/HERHEALTH-NETWORK-INTEGRATION.md</code> — drop-in Node.js sender, event types, lifecycle hooks, and the test-signature endpoint.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
