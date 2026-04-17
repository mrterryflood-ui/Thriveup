import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Database, RefreshCw, Sparkles, ExternalLink, MapPin, Users, FileText, AlertTriangle, Link2, Shield, ShieldAlert, Lightbulb, Network } from "lucide-react";

interface Claim<T = number | string> {
  value: T | null;
  unit?: string;
  source: string;
  asOfDate: string | null;
  geographyKey: string | null;
  confidence: "verified" | "modeled" | "estimated" | "unverified";
  methodology?: string;
  url?: string;
}

interface MetroStory {
  metro: { id: string; name: string; state: string; focusZip: string; district: string; character: string; anchorZips: string[] };
  dataFreshness: { asOfDate: string | null; dataSources: string | null; refreshedAt: string | null };
  counts: Record<string, Claim>;
  fatherhoodGap: Record<string, Claim>;
  riskFactors: { key: string; label: string; weight: number; claim: Claim }[];
  riskIndex: number | null;
  protectiveFactors: { key: string; label: string; claim?: Claim; value?: any; source?: string }[];
  crimeProfile: Record<string, Claim | number | null>;
  rootCauses: { cause: string; narrative: string; citesStepIds: string[]; evidenceId: string | null }[];
  recommendedSolutions: { solution: string; addresses: string[]; deliveryPartners: string[]; platformModules: string[]; fundingFit: string[]; kpi: string }[];
  communityResources: any[];
  zipDetail: any[];
  partners: any[];
  chainedStory: string[];
}

interface CorridorStory {
  corridor: { id: string; name: string };
  generatedAt: string;
  metros: { waco: MetroStory; austin: MetroStory };
  comparison: {
    symmetry: string[];
    alignment: { layer: string; waco: string; austin: string; rail: string }[];
    differences: string[];
    numericSymmetry: Record<string, { waco: number | null; austin: number | null; deltaPct: number | null }>;
  };
  grantPipeline: any[];
  narrative: { headline: string; arc: { beat: string; text: string }[] };
  chainWeb: { steps: { id: string; label: string; source: string; sourceUrl: string; dependsOn: string[] }[]; legend: string; runEndpoint: string; statusEndpoint: string };
  sources: { id: string; name: string; url: string; role: string }[];
}

function ConfidenceBadge({ c }: { c: Claim["confidence"] }) {
  const map = {
    verified: "bg-emerald-100 text-emerald-900 border-emerald-300",
    modeled: "bg-amber-100 text-amber-900 border-amber-300",
    estimated: "bg-orange-100 text-orange-900 border-orange-300",
    unverified: "bg-rose-100 text-rose-900 border-rose-300",
  } as const;
  return <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${map[c]}`} data-testid={`badge-confidence-${c}`}>{c}</Badge>;
}

function ClaimRow({ label, claim }: { label: string; claim: Claim }) {
  const fmt = (v: any, unit?: string) => {
    if (v == null) return "—";
    if (typeof v === "number") return unit === "USD" ? `$${v.toLocaleString()}` : `${v.toLocaleString()}${unit && unit !== "USD" ? " " + unit : ""}`;
    return String(v);
  };
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`row-claim-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm font-medium" data-testid={`text-value-${label.toLowerCase().replace(/\s+/g, '-')}`}>{fmt(claim.value, claim.unit)}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {claim.source}{claim.asOfDate ? ` · ${claim.asOfDate}` : ""}
        </div>
        {claim.methodology && <div className="text-[10px] italic text-muted-foreground mt-0.5">method: {claim.methodology}</div>}
      </div>
      <ConfidenceBadge c={claim.confidence} />
    </div>
  );
}

function MetroCard({ story, accent }: { story: MetroStory; accent: string }) {
  return (
    <Card className="border-2" style={{ borderColor: accent }} data-testid={`card-metro-${story.metro.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg" data-testid={`title-metro-${story.metro.id}`}>{story.metro.name}</CardTitle>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> Focus ZIP {story.metro.focusZip} · {story.metro.district}
            </div>
            <Badge variant="outline" className="mt-2 text-xs">{story.metro.character} pattern</Badge>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">data as of</div>
            <div className="text-xs font-mono">{story.dataFreshness.asOfDate ?? "—"}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-2 mb-1">County baseline (Census ACS · CDC PLACES · BLS)</div>
        <ClaimRow label="Total population" claim={story.counts.totalPopulation} />
        <ClaimRow label="Poverty rate" claim={story.counts.povertyRate} />
        <ClaimRow label="Median income" claim={story.counts.medianIncome} />
        <ClaimRow label="Unemployment" claim={story.counts.unemployment} />
        <ClaimRow label="SVI percentile" claim={story.counts.svi} />
        <ClaimRow label="Health burden" claim={story.counts.healthBurden} />
        <ClaimRow label="Food access" claim={story.counts.foodAccess} />

        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1">Black-youth fatherhood gap (modeled from verified base)</div>
        <ClaimRow label="Black population" claim={story.fatherhoodGap.blackPopulation} />
        <ClaimRow label="Children in single-parent HH" claim={story.fatherhoodGap.blackChildrenSingleParent} />
        <ClaimRow label="Disconnected youth 16–24" claim={story.fatherhoodGap.disconnectedBlackYouth} />
        <ClaimRow label="Mentor gap" claim={story.fatherhoodGap.mentorGap} />

        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2 flex items-center gap-1">
          <Users className="w-3 h-3" /> ZIP-level intelligence ({story.zipDetail.length} ZIPs)
        </div>
        {story.zipDetail.length === 0 && (
          <div className="text-xs text-muted-foreground italic" data-testid={`text-no-zip-${story.metro.id}`}>
            No ZIP rows seeded for these anchors yet — run "Refresh data" below or seed neighborhood intelligence.
          </div>
        )}
        {story.zipDetail.slice(0, 3).map((z) => (
          <div key={z.zip} className="text-xs border rounded p-2 bg-muted/40" data-testid={`row-zip-${z.zip}`}>
            <div className="font-mono font-semibold">{z.zip} · {z.neighborhood}</div>
            <div className="text-muted-foreground">pop {z.population ?? "—"} · poverty {z.povertyRate ?? "—"}% · juvenile rate {z.juvenileOffenseRate ?? "—"} · hotspot {z.hotspotLevel}</div>
          </div>
        ))}

        {/* RISK FACTORS */}
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Risk factors
          {story.riskIndex != null && (
            <Badge variant="outline" className="ml-auto text-[10px] bg-rose-50 dark:bg-rose-950 border-rose-300">risk index {story.riskIndex}</Badge>
          )}
        </div>
        {story.riskFactors.map((r) => <ClaimRow key={r.key} label={r.label} claim={r.claim} />)}

        {/* PROTECTIVE FACTORS */}
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1 flex items-center gap-1">
          <Shield className="w-3 h-3" /> Protective factors
        </div>
        {story.protectiveFactors.map((p) => (
          <div key={p.key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-xs" data-testid={`row-protective-${p.key}`}>
            <div>
              <div>{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.claim?.source ?? p.source}</div>
            </div>
            <div className="font-mono font-medium">
              {p.claim ? (p.claim.value ?? "—") + (p.claim.unit ? ` ${p.claim.unit}` : "") : (p.value ?? "—")}
            </div>
          </div>
        ))}

        {/* CRIME PROFILE */}
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1">Crime profile</div>
        {story.crimeProfile && typeof story.crimeProfile.violent === "object" && story.crimeProfile.violent && <ClaimRow label="Violent crime" claim={story.crimeProfile.violent as Claim} />}
        {story.crimeProfile && typeof story.crimeProfile.property === "object" && story.crimeProfile.property && <ClaimRow label="Property crime" claim={story.crimeProfile.property as Claim} />}
        {story.crimeProfile && typeof story.crimeProfile.homicide === "object" && story.crimeProfile.homicide && <ClaimRow label="Homicide" claim={story.crimeProfile.homicide as Claim} />}
        {story.crimeProfile && typeof story.crimeProfile.aggravatedAssault === "object" && story.crimeProfile.aggravatedAssault && <ClaimRow label="Aggravated assault" claim={story.crimeProfile.aggravatedAssault as Claim} />}
        <div className="text-[11px] text-muted-foreground mt-1">
          Focus ZIP {story.metro.focusZip}: crime index {String(story.crimeProfile?.focusZipCrimeIndex ?? "—")} · violent rate {String(story.crimeProfile?.focusZipViolentRate ?? "—")} · juvenile rate {String(story.crimeProfile?.focusZipJuvenileRate ?? "—")}
        </div>

        {/* ROOT CAUSES */}
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1">Root causes</div>
        <ul className="space-y-2 text-xs">
          {story.rootCauses.map((rc, i) => (
            <li key={i} className="border-l-2 border-amber-400 pl-2" data-testid={`row-root-cause-${i}`}>
              <div className="font-semibold">{rc.cause}</div>
              <div className="text-muted-foreground">{rc.narrative}</div>
              {rc.citesStepIds.length > 0 && (
                <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                  cites chain step{rc.citesStepIds.length > 1 ? "s" : ""}: {rc.citesStepIds.join(" · ")}
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* RECOMMENDED SOLUTIONS */}
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> Recommended solutions
        </div>
        <ul className="space-y-2 text-xs">
          {story.recommendedSolutions.map((s, i) => (
            <li key={i} className="border rounded p-2 bg-muted/30" data-testid={`row-solution-${i}`}>
              <div className="font-semibold">{s.solution}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Addresses: {s.addresses.join(", ")}</div>
              <div className="text-[11px] text-muted-foreground">Partners: {s.deliveryPartners.join(", ")}</div>
              <div className="text-[11px] text-muted-foreground">Modules: {s.platformModules.join(" · ")}</div>
              <div className="text-[11px] text-muted-foreground">Funding: {s.fundingFit.join(" · ")}</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">KPI: {s.kpi}</div>
            </li>
          ))}
        </ul>

        {/* COMMUNITY RESOURCES */}
        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1">
          Community resources ({story.communityResources.length})
        </div>
        {story.communityResources.length === 0 && (
          <div className="text-[11px] text-muted-foreground italic">No partners matched this metro yet.</div>
        )}
        {story.communityResources.slice(0, 6).map((p, i) => (
          <div key={i} className="text-[11px] py-1 border-b border-border/50 last:border-0" data-testid={`row-resource-${i}`}>
            <span className="font-semibold">{p.name}</span> — {p.type ?? "—"} · {p.city ?? "—"} {p.isActive === false ? <Badge variant="outline" className="ml-1 text-[9px]">inactive</Badge> : null}
            {p.mou && p.mou !== "none" && <Badge variant="outline" className="ml-1 text-[9px]">MOU: {p.mou}</Badge>}
          </div>
        ))}

        <div className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-1">Chained story</div>
        <ol className="space-y-1 text-xs list-decimal pl-4 text-foreground" data-testid={`list-chained-${story.metro.id}`}>
          {story.chainedStory.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function CorridorIntelligencePage() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<CorridorStory>({ queryKey: ["/api/corridor/story"] });

  const refresh = useMutation({
    mutationFn: () => apiRequest("POST", "/api/corridor/refresh"),
    onSuccess: () => {
      toast({ title: "TX ingestion complete", description: "Refreshed Census, PLACES, SVI, BLS, food access, education." });
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/story"] });
    },
    onError: (e: any) => toast({ title: "Refresh failed", description: e.message, variant: "destructive" }),
  });

  const chainweb = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/corridor/chainweb/run");
      return r.json();
    },
    onSuccess: (res: any) => {
      const rows = res?.report?.totalEvidenceWritten ?? 0;
      const ok = res?.report?.summary?.succeeded ?? 0;
      const fail = res?.report?.summary?.failed ?? 0;
      toast({ title: `Chain web complete — ${rows} evidence rows written`, description: `${ok} steps ok · ${fail} failed. Pulls Census poverty, family structure, education, CDC PLACES, SVI, FBI crime. Each step cites the step before it.` });
      queryClient.invalidateQueries({ queryKey: ["/api/corridor/story"] });
    },
    onError: (e: any) => toast({ title: "Chain web failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="container max-w-7xl py-8 space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Hero */}
      <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 text-white" data-testid="section-hero">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" /> Corridor Intelligence · single source of truth
        </div>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight" data-testid="text-hero-title">{data.narrative.headline}</h1>
        <p className="text-sm text-amber-100 mt-2">{data.corridor.name} · synthesized {new Date(data.generatedAt).toLocaleString()}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" variant="secondary" onClick={() => chainweb.mutate()} disabled={chainweb.isPending} data-testid="button-run-chainweb">
            <Network className={`w-4 h-4 mr-1 ${chainweb.isPending ? "animate-spin" : ""}`} /> Run chain web (pull & link all)
          </Button>
          <Button size="sm" variant="secondary" onClick={() => refresh.mutate()} disabled={refresh.isPending} data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 mr-1 ${refresh.isPending ? "animate-spin" : ""}`} /> Refresh GIS base
          </Button>
          <a href="/api/corridor/story" target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" data-testid="button-raw-json">
              <Database className="w-4 h-4 mr-1" /> Raw story JSON
            </Button>
          </a>
          <a href="/corridor/evidence">
            <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" data-testid="button-evidence-vault">
              <Database className="w-4 h-4 mr-1" /> Evidence vault
            </Button>
          </a>
        </div>
      </div>

      {/* Story arc */}
      <Card data-testid="card-narrative-arc">
        <CardHeader><CardTitle className="text-lg">The single story · 6 connected beats</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {data.narrative.arc.map((b, i) => (
              <li key={i} className="flex gap-3 items-start" data-testid={`row-beat-${i}`}>
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold grid place-items-center">{i + 1}</div>
                <div>
                  <div className="font-semibold text-sm">{b.beat}</div>
                  <div className="text-sm text-muted-foreground">{b.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Chain web */}
      <Card data-testid="card-chainweb">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="w-4 h-4" /> Chain web · every fact linked to its source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">{data.chainWeb.legend}</div>
          <ol className="space-y-2">
            {data.chainWeb.steps.map((s, i) => (
              <li key={s.id} className="flex items-start gap-2" data-testid={`row-chainweb-${s.id}`}>
                <div className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-xs font-bold grid place-items-center">{i + 1}</div>
                <div className="flex-1 text-xs">
                  <div className="font-semibold">{s.label}</div>
                  <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline inline-flex items-center gap-1">
                    {s.source} <ExternalLink className="w-3 h-3" />
                  </a>
                  {s.dependsOn.length > 0 && (
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> cites: {s.dependsOn.join(" · ")}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <Button size="sm" onClick={() => chainweb.mutate()} disabled={chainweb.isPending} data-testid="button-run-chainweb-inline">
              <Network className={`w-4 h-4 mr-1 ${chainweb.isPending ? "animate-spin" : ""}`} />
              {chainweb.isPending ? "Running…" : "Run chain web now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two metros */}
      <div className="grid md:grid-cols-2 gap-4" data-testid="section-metros">
        <MetroCard story={data.metros.waco} accent="#9B1C2E" />
        <MetroCard story={data.metros.austin} accent="#0B2545" />
      </div>

      {/* Comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card data-testid="card-symmetry">
          <CardHeader><CardTitle className="text-base">Symmetry · what's the same</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">{data.comparison.symmetry.map((s, i) => <li key={i} className="flex gap-2"><ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{s}</li>)}</ul>
          </CardContent>
        </Card>
        <Card data-testid="card-alignment">
          <CardHeader><CardTitle className="text-base">Alignment · where they meet</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {data.comparison.alignment.map((a, i) => (
                <div key={i} className="border rounded p-2 bg-muted/30">
                  <div className="font-semibold">{a.layer}</div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <div><span className="text-muted-foreground">Waco:</span> {a.waco}</div>
                    <div><span className="text-muted-foreground">Austin:</span> {a.austin}</div>
                  </div>
                  <div className="mt-1 text-amber-700 dark:text-amber-400 text-[11px]">↳ {a.rail}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-differences">
          <CardHeader><CardTitle className="text-base">Differences · what's unique</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">{data.comparison.differences.map((d, i) => <li key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />{d}</li>)}</ul>
          </CardContent>
        </Card>
      </div>

      {/* Numeric symmetry */}
      <Card data-testid="card-numeric-symmetry">
        <CardHeader><CardTitle className="text-base">Numeric symmetry — does the data actually mirror?</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(data.comparison.numericSymmetry).map(([k, v]) => (
              <div key={k} className="border rounded p-3 text-center" data-testid={`tile-symmetry-${k}`}>
                <div className="text-xs uppercase text-muted-foreground">{k}</div>
                <div className="text-sm font-mono mt-1">W: {v.waco != null ? v.waco.toFixed(1) : "—"}</div>
                <div className="text-sm font-mono">A: {v.austin != null ? v.austin.toFixed(1) : "—"}</div>
                <div className={`text-[11px] mt-1 ${v.deltaPct == null ? "text-muted-foreground" : Math.abs(v.deltaPct) < 15 ? "text-emerald-600" : "text-amber-600"}`}>
                  Δ {v.deltaPct != null ? v.deltaPct.toFixed(0) + "%" : "—"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grant pipeline */}
      <Card data-testid="card-grant-pipeline">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Corridor-relevant grant pipeline ({data.grantPipeline.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.grantPipeline.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No grants matched corridor keywords yet — run grants discovery in Grants module.</div>
          ) : (
            <div className="space-y-1 text-sm">
              {data.grantPipeline.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0" data-testid={`row-grant-${g.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{g.title}</div>
                    <div className="text-xs text-muted-foreground">{g.funder ?? "—"} · {g.amount ?? "—"} · deadline {g.deadline ? new Date(g.deadline).toLocaleDateString() : "—"}</div>
                  </div>
                  {g.fitScore != null && <Badge variant="outline" className="font-mono">fit {g.fitScore}</Badge>}
                  {g.sourceUrl && <a href={g.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" /></a>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sources */}
      <Card data-testid="card-sources">
        <CardHeader><CardTitle className="text-base">Data sources powering this story</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {data.sources.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="border rounded p-2 hover:bg-muted/50 transition" data-testid={`link-source-${s.id}`}>
                <div className="font-semibold text-sm flex items-center gap-1">{s.name} <ExternalLink className="w-3 h-3" /></div>
                <div className="text-muted-foreground">{s.role}</div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
