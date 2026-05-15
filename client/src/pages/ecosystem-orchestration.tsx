import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Globe, Users, ExternalLink, Search } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  url: string;
  role: string;
  domain: string;
  description: string;
  grantAlignment: string[];
  sends: string[];
  receives: string[];
  featureCount: number;
}

interface Triad {
  id: string;
  name: string;
  description: string;
  members: string[];
  leadPlatform: string;
  domain: string;
  grantAlignment: string[];
}

interface RegistryResponse {
  platformCount: number;
  triadCount: number;
  domainCount: number;
  domains: string[];
  platforms: Platform[];
  triads: Triad[];
}

export default function EcosystemOrchestrationPage() {
  const { data, isLoading } = useQuery<RegistryResponse>({
    queryKey: ["/api/ecosystem/registry"],
  });
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const filteredPlatforms = useMemo(() => {
    if (!data?.platforms) return [];
    const q = search.toLowerCase();
    return data.platforms.filter(p =>
      (domainFilter === "all" || p.domain === domainFilter) &&
      (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
    );
  }, [data?.platforms, search, domainFilter]);

  const platformById = useMemo(() => {
    const map = new Map<string, Platform>();
    data?.platforms.forEach(p => map.set(p.id, p));
    return map;
  }, [data?.platforms]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6" data-testid="page-ecosystem-orchestration">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Ecosystem Orchestration</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Read-only co-manager view of the 15-service-platform ecosystem: each platform's role, domain, data flows,
          grant alignment, and the triads that coordinate them. For live operations and health, see the
          internal Ops Center.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Platforms" value={data?.platformCount ?? "—"} testid="stat-platforms" icon={Globe} />
        <StatCard label="Triads" value={data?.triadCount ?? "—"} testid="stat-triads" icon={Users} />
        <StatCard label="Domains" value={data?.domainCount ?? "—"} testid="stat-domains" icon={Activity} />
        <StatCard label="Architecture" value="ACOS" testid="stat-arch" icon={Activity} />
      </div>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList>
          <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
          <TabsTrigger value="triads" data-testid="tab-triads">Triads</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <FilterChip active={domainFilter === "all"} onClick={() => setDomainFilter("all")} testid="filter-all">
                All ({data?.platforms.length ?? 0})
              </FilterChip>
              {data?.domains.map(d => (
                <FilterChip
                  key={d}
                  active={domainFilter === d}
                  onClick={() => setDomainFilter(d)}
                  testid={`filter-${d}`}
                >
                  {d} ({data.platforms.filter(p => p.domain === d).length})
                </FilterChip>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlatforms.map(p => (
                <Card key={p.id} data-testid={`card-platform-${p.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate" data-testid={`text-name-${p.id}`}>{p.name}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs" data-testid={`badge-role-${p.id}`}>{p.role}</Badge>
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-domain-${p.id}`}>{p.domain}</Badge>
                        </div>
                      </div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`link-platform-${p.id}`}
                        aria-label={`Open ${p.name} in a new tab`}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" aria-hidden="true" />
                      </a>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                      <Stat label="Features" value={p.featureCount} />
                      <Stat label="Sends" value={p.sends.length} />
                      <Stat label="Receives" value={p.receives.length} />
                    </div>
                    {p.grantAlignment.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {p.grantAlignment.map(g => (
                          <Badge key={g} variant="outline" className="text-xs" data-testid={`badge-grant-${p.id}-${g}`}>{g}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredPlatforms.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground text-center py-8">No platforms match.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="triads" className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.triads.map(t => (
                <Card key={t.id} data-testid={`card-triad-${t.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base" data-testid={`text-triad-name-${t.id}`}>{t.name}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">{t.domain}</Badge>
                          <Badge variant="outline" className="text-xs">Lead: {platformById.get(t.leadPlatform)?.name ?? t.leadPlatform}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {t.members.map(m => (
                        <Badge
                          key={m}
                          variant={m === t.leadPlatform ? "default" : "outline"}
                          className="text-xs"
                          data-testid={`badge-member-${t.id}-${m}`}
                        >
                          {platformById.get(m)?.name ?? m}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, testid, icon: Icon }: { label: string; value: any; testid: string; icon: any }) {
  return (
    <Card data-testid={`card-${testid}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-8 w-8 text-primary" />
        <div>
          <div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div>
          <div className="text-2xl font-bold" data-testid={`text-${testid}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterChip({ active, onClick, children, testid }: { active: boolean; onClick: () => void; children: React.ReactNode; testid: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border ${active ? "bg-primary text-primary-foreground border-primary" : "hover-elevate"}`}
      data-testid={`button-${testid}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
