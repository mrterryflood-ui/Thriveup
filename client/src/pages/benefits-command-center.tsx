import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RelatedTools } from "@/components/related-tools";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, RefreshCw, Users, Activity, Heart, Shield, Home, Briefcase,
  AlertTriangle, BarChart3, FileText, Globe, Search, Loader2, ChevronRight,
  Building2, Phone, Mail, Plus, Target, TrendingUp, TrendingDown,
  CheckCircle2, Clock, ArrowRight, Layers, Eye, Zap, UserCheck,
  GraduationCap, Truck, Wifi, WifiOff, Languages, Ban,
  HandHeart, Stethoscope, Baby, DollarSign, ClipboardList, Navigation,
} from "lucide-react";

type TabId = "command" | "gis" | "barriers" | "map" | "partners" | "chw" | "navigator" | "hhsc" | "metrics" | "outreach";

const COUNTY_COLORS: Record<string, string> = {
  "48453": "#3b82f6",
  "48491": "#8b5cf6",
  "48209": "#22c55e",
  "48021": "#f97316",
  "48055": "#ef4444",
};

const BENEFIT_ICONS: Record<string, typeof Heart> = {
  SNAP: Home, Medicaid: Stethoscope, CHIP: Baby, EITC: DollarSign,
  WIC: Heart, SSI: Shield, SSDI: Shield, Marketplace: Building2, CTC: Users,
};

const BENEFIT_COLORS: Record<string, string> = {
  SNAP: "#22c55e", Medicaid: "#3b82f6", CHIP: "#06b6d4", EITC: "#eab308",
  WIC: "#ec4899", SSI: "#8b5cf6", SSDI: "#a855f7", Marketplace: "#f97316", CTC: "#14b8a6",
};

function getGapColor(gap: number): string {
  if (gap >= 50) return "#ef4444";
  if (gap >= 35) return "#f97316";
  if (gap >= 20) return "#eab308";
  return "#22c55e";
}

function getBarrierColor(index: number): string {
  if (index >= 25) return "#ef4444";
  if (index >= 15) return "#f97316";
  if (index >= 8) return "#eab308";
  return "#22c55e";
}

function CommandDashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/command-center/stats"] });

  const ingestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/ingest", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Data Ingested", description: `Loaded ${data.ingested} records from Census ACS for ${data.counties} counties.` });
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/command-center/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/enrollment-data"] });
    },
    onError: () => toast({ title: "Ingest Failed", description: "Could not fetch Census data.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!stats?.hasData) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center" data-testid="card-no-data">
          <div className="space-y-4">
            <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">Load 5-County Benefits Data</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Pull enrollment gap data from Census ACS for all 5 Central Texas counties:
              Travis, Williamson, Hays, Bastrop, and Caldwell.
            </p>
            <Button size="lg" onClick={() => ingestMutation.mutate()} disabled={ingestMutation.isPending} data-testid="button-ingest-data">
              {ingestMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ingesting...</> : <><RefreshCw className="h-4 w-4 mr-2" /> Load Census Data</>}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const counties = stats.countySummaries ? Object.values(stats.countySummaries) as any[] : [];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-900/10 border-blue-500/30 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">TCAF Benefits Intelligence System</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Covering 5 Central Texas counties (Travis · Williamson · Hays · Bastrop · Caldwell). Travis = strengthen existing capacity. Williamson, Hays, Bastrop, Caldwell = build/expand. Both new enrollments AND renewals are tracked. Mixed-status families are explicitly served.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4" data-testid="stat-total-gap">
          <div className="flex flex-col items-center text-center gap-1">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold">{stats.totals.overallGap}%</span>
            <span className="text-xs text-muted-foreground">Overall Enrollment Gap</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-total-eligible">
          <div className="flex flex-col items-center text-center gap-1">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{(stats.totals.totalEligible || 0).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Total Eligible</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-partners">
          <div className="flex flex-col items-center text-center gap-1">
            <Building2 className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats.totals.partners}</span>
            <span className="text-xs text-muted-foreground">Partners</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-chws">
          <div className="flex flex-col items-center text-center gap-1">
            <HandHeart className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.totals.chws}</span>
            <span className="text-xs text-muted-foreground">CHWs Deployed</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {counties.map((county: any) => (
          <Card key={county.fips} className="relative overflow-hidden" data-testid={`card-county-${county.fips}`}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: COUNTY_COLORS[county.fips] }} />
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{county.name.replace(" County", "")}</CardTitle>
                <Badge variant={county.strategy === "strengthen" ? "default" : "secondary"} className="text-xs">
                  {county.strategy}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <span className="text-3xl font-bold" style={{ color: getGapColor(county.averageGap) }}>
                  {county.averageGap}%
                </span>
                <p className="text-xs text-muted-foreground">Avg Enrollment Gap</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Population</span>
                  <span className="font-medium">{(county.population || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eligible</span>
                  <span className="font-medium">{(county.totalEligible || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrolled</span>
                  <span className="font-medium">{(county.totalEnrolled || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barrier Index</span>
                  <span className="font-medium" style={{ color: getBarrierColor(county.averageBarrierIndex) }}>
                    {county.averageBarrierIndex}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renewals At Risk</span>
                  <span className="font-medium text-orange-500">{county.renewalsAtRisk}</span>
                </div>
              </div>
              <Progress value={county.overallParticipationRate} className="h-1.5" />
              <p className="text-xs text-center text-muted-foreground">{county.overallParticipationRate}% participation</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => ingestMutation.mutate()} disabled={ingestMutation.isPending} data-testid="button-refresh-data">
          <RefreshCw className={`h-4 w-4 mr-2 ${ingestMutation.isPending ? "animate-spin" : ""}`} /> Refresh Census Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollment Gap by Benefit Type</CardTitle>
          <CardDescription>Across all 5 counties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {counties.length > 0 && counties[0].benefitBreakdown?.map((b: any) => {
              const totals = counties.reduce(
                (acc: any, c: any) => {
                  const match = c.benefitBreakdown?.find((x: any) => x.type === b.type);
                  if (match) {
                    acc.eligible += match.eligible || 0;
                    acc.enrolled += match.enrolled || 0;
                  }
                  return acc;
                },
                { eligible: 0, enrolled: 0 }
              );
              const gap = totals.eligible > 0 ? Math.round((1 - totals.enrolled / totals.eligible) * 100) : 0;
              const Icon = BENEFIT_ICONS[b.type] || Heart;
              return (
                <div key={b.type} className="flex items-center gap-3" data-testid={`benefit-row-${b.type}`}>
                  <Icon className="h-4 w-4 shrink-0" style={{ color: BENEFIT_COLORS[b.type] }} />
                  <span className="text-sm font-medium w-24">{b.type}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${100 - gap}%`, backgroundColor: BENEFIT_COLORS[b.type] }}
                    />
                  </div>
                  <span className="text-sm font-bold w-16 text-right" style={{ color: getGapColor(gap) }}>
                    {gap}% gap
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GisMapPanel() {
  const { data: stats } = useQuery<any>({ queryKey: ["/api/benefits/command-center/stats"] });
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const [mapLayer, setMapLayer] = useState<"gaps" | "barriers" | "facilitators">("gaps");
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const { data: facilitators } = useQuery<any>({
    queryKey: ["/api/benefits/facilitators", selectedCounty],
    enabled: !!selectedCounty && mapLayer === "facilitators",
  });
  const { data: barriers } = useQuery<any>({
    queryKey: ["/api/benefits/barriers", selectedCounty],
    enabled: !!selectedCounty && mapLayer === "barriers",
  });

  const countySummaries = stats?.countySummaries ? Object.values(stats.countySummaries) as any[] : [];

  const getRadius = (county: any) => {
    if (mapLayer === "gaps") return Math.max(15, Math.min(50, (county.averageGap || 0) * 1.2));
    if (mapLayer === "barriers") return Math.max(15, Math.min(50, (county.averageBarrierIndex || 0) * 2));
    return 25;
  };

  const getColor = (county: any) => {
    if (mapLayer === "gaps") return getGapColor(county.averageGap || 0);
    if (mapLayer === "barriers") return getBarrierColor(county.averageBarrierIndex || 0);
    return COUNTY_COLORS[county.fips] || "#3b82f6";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm font-medium">Map Layer:</Label>
        {(["gaps", "barriers", "facilitators"] as const).map(layer => (
          <Button
            key={layer}
            size="sm"
            variant={mapLayer === layer ? "default" : "outline"}
            onClick={() => setMapLayer(layer)}
            data-testid={`button-layer-${layer}`}
          >
            {layer === "gaps" ? <><AlertTriangle className="h-3 w-3 mr-1" /> Enrollment Gaps</> :
             layer === "barriers" ? <><Ban className="h-3 w-3 mr-1" /> Barrier Index</> :
             <><Building2 className="h-3 w-3 mr-1" /> Facilitators</>}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden" data-testid="card-gis-map">
            <div style={{ height: "500px" }}>
              <MapContainer
                center={[30.25, -97.65]}
                zoom={9}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                {countySummaries.map((county: any) => (
                  <CircleMarker
                    key={county.fips}
                    center={[county.lat, county.lng]}
                    radius={getRadius(county)}
                    pathOptions={{
                      fillColor: getColor(county),
                      color: getColor(county),
                      weight: 2,
                      opacity: 0.8,
                      fillOpacity: 0.35,
                    }}
                    eventHandlers={{
                      click: () => setSelectedCounty(county.fips),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{county.name}</p>
                        <p>Population: {(county.population || 0).toLocaleString()}</p>
                        <p>Enrollment Gap: <strong style={{ color: getGapColor(county.averageGap) }}>{county.averageGap}%</strong></p>
                        <p>Barrier Index: <strong style={{ color: getBarrierColor(county.averageBarrierIndex) }}>{county.averageBarrierIndex}</strong></p>
                        <p>Eligible: {(county.totalEligible || 0).toLocaleString()}</p>
                        <p>Enrolled: {(county.totalEnrolled || 0).toLocaleString()}</p>
                        <p>Strategy: <em>{county.strategy}</em></p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                {mapLayer === "facilitators" && facilitators?.knownFacilitators?.map((f: any, i: number) => (
                  <CircleMarker
                    key={`fac-${i}`}
                    center={[f.lat, f.lng]}
                    radius={8}
                    pathOptions={{ fillColor: "#22c55e", color: "#16a34a", weight: 2, opacity: 0.9, fillOpacity: 0.6 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{f.name}</p>
                        <p className="text-gray-500">{f.type}</p>
                        <p>Services: {f.services?.join(", ")}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mapLayer === "gaps" ? (
                <>
                  <p className="text-xs text-muted-foreground">Circle size = enrollment gap magnitude</p>
                  {[
                    { label: "Critical (≥50%)", color: "#ef4444" },
                    { label: "High (35-49%)", color: "#f97316" },
                    { label: "Moderate (20-34%)", color: "#eab308" },
                    { label: "Low (<20%)", color: "#22c55e" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-xs">{l.label}</span>
                    </div>
                  ))}
                </>
              ) : mapLayer === "barriers" ? (
                <>
                  <p className="text-xs text-muted-foreground">Circle size = barrier index magnitude</p>
                  {[
                    { label: "Severe (≥25)", color: "#ef4444" },
                    { label: "High (15-24)", color: "#f97316" },
                    { label: "Moderate (8-14)", color: "#eab308" },
                    { label: "Low (<8)", color: "#22c55e" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-xs">{l.label}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Click a county to show its facilitators</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs">Community Facilitator</span>
                  </div>
                  {(counties || []).map((c: any) => (
                    <Button
                      key={c.fips}
                      size="sm"
                      variant={selectedCounty === c.fips ? "default" : "outline"}
                      className="w-full justify-start text-xs"
                      onClick={() => setSelectedCounty(c.fips)}
                      data-testid={`button-map-county-${c.fips}`}
                    >
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COUNTY_COLORS[c.fips] }} />
                      {c.name}
                    </Button>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {selectedCounty && barriers && mapLayer === "barriers" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{stats?.countySummaries?.[selectedCounty]?.name} Barriers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {barriers.barriers?.map((b: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{b.name}</span>
                    <span className="font-bold" style={{ color: getBarrierColor(b.value) }}>{b.value?.toFixed(1)}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedCounty && stats?.countySummaries?.[selectedCounty] && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{stats.countySummaries[selectedCounty].name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Gap</span><span className="font-bold">{stats.countySummaries[selectedCounty].averageGap}%</span></div>
                <div className="flex justify-between"><span>Eligible</span><span>{stats.countySummaries[selectedCounty].totalEligible?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Enrolled</span><span>{stats.countySummaries[selectedCounty].totalEnrolled?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Renewals At Risk</span><span className="text-orange-500">{stats.countySummaries[selectedCounty].renewalsAtRisk}</span></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function BarriersPanel() {
  const [selectedCounty, setSelectedCounty] = useState("48453");
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const { data: barriers, isLoading } = useQuery<any>({
    queryKey: ["/api/benefits/barriers", selectedCounty],
    enabled: !!selectedCounty,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedCounty} onValueChange={setSelectedCounty}>
          <SelectTrigger className="w-[220px]" data-testid="select-barrier-county">
            <SelectValue placeholder="Select county" />
          </SelectTrigger>
          <SelectContent>
            {(counties || []).map((c: any) => (
              <SelectItem key={c.fips} value={c.fips}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : barriers ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center" data-testid="stat-barrier-index">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" style={{ color: getBarrierColor(barriers.barrierIndex) }} />
              <span className="text-3xl font-bold" style={{ color: getBarrierColor(barriers.barrierIndex) }}>
                {barriers.barrierIndex?.toFixed(1)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Enrollment Barrier Index</p>
            </Card>
            <Card className="p-4 text-center" data-testid="stat-shadow-pop">
              <Ban className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {barriers.shadowPopulationIndicator?.toFixed(1)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Shadow Population Risk</p>
            </Card>
            <Card className="p-4" data-testid="stat-recommendation">
              <Zap className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-sm">{barriers.recommendation}</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barrier Breakdown</CardTitle>
              <CardDescription>Higher values indicate stronger barriers to enrollment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {barriers.barriers?.map((b: any, i: number) => {
                const icons: Record<string, typeof MapPin> = {
                  language: Languages, transportation: Truck, digital: WifiOff, immigration: Ban, economic: DollarSign,
                };
                const Icon = icons[b.category] || AlertTriangle;
                return (
                  <div key={i} className="space-y-1" data-testid={`barrier-${b.category}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: getBarrierColor(b.value) }}>
                          {b.value?.toFixed(1)}%
                        </span>
                        <Badge variant="outline" className="text-xs">weight: {(b.weight * 100).toFixed(0)}%</Badge>
                      </div>
                    </div>
                    <Progress value={b.value} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function FacilitatorsPanel() {
  const [selectedCounty, setSelectedCounty] = useState("48453");
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const { data: facilitators, isLoading } = useQuery<any>({
    queryKey: ["/api/benefits/facilitators", selectedCounty],
    enabled: !!selectedCounty,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedCounty} onValueChange={setSelectedCounty}>
          <SelectTrigger className="w-[220px]" data-testid="select-facilitator-county">
            <SelectValue placeholder="Select county" />
          </SelectTrigger>
          <SelectContent>
            {(counties || []).map((c: any) => (
              <SelectItem key={c.fips} value={c.fips}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <a href="https://stdavidsfoundation.org/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" data-testid="link-st-davids-map">
            <Globe className="h-4 w-4 mr-2" /> St. David's Resource Map
          </Button>
        </a>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{facilitators?.totalAssets || 0} Community Assets</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilitators?.knownFacilitators?.map((f: any, i: number) => (
              <Card key={i} data-testid={`card-facilitator-${i}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{f.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">{f.type}</Badge>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.services?.map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {facilitators?.registeredPartners?.length > 0 && (
            <>
              <Separator />
              <h3 className="font-semibold">Registered TCAF Partners</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilitators.registeredPartners.map((p: any) => (
                  <Card key={p.id} data-testid={`card-partner-${p.id}`}>
                    <CardContent className="pt-4">
                      <p className="font-medium text-sm">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{p.organizationType}</Badge>
                        {p.hhscCppLevel && <Badge className="text-xs">CPP Level {p.hhscCppLevel}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PartnerHub() {
  const { toast } = useToast();
  const { data: partners, isLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/partners"] });
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [county, setCounty] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/benefits/partners", {
        name, organizationType: orgType, county,
        contactName: contactName || null, contactEmail: contactEmail || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/partners"] });
      toast({ title: "Partner Added" });
      setShowForm(false);
      setName(""); setOrgType(""); setCounty(""); setContactName(""); setContactEmail("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add partner.", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-lg" data-testid="text-partners-header">Partner Collaboration Hub</h3>
          <p className="text-sm text-muted-foreground">TCAF as the connective backbone - coordinate CHW deployment, share data, avoid duplication</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-partner">
          <Plus className="h-4 w-4 mr-1" /> Add Partner
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Organization Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Foundation Communities" data-testid="input-partner-name" />
              </div>
              <div>
                <Label>Organization Type</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger data-testid="select-partner-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {["Nonprofit", "FQHC", "Government", "Food Bank", "Church", "Library", "School", "Health Plan", "CAA", "Community Center"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>County</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger data-testid="select-partner-county"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(counties || []).map((c: any) => (
                      <SelectItem key={c.fips} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} data-testid="input-partner-contact" />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} data-testid="input-partner-email" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!name || !orgType || !county || createMutation.isPending} data-testid="button-submit-partner">
                {createMutation.isPending ? "Saving..." : "Save Partner"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (partners || []).length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No partners registered yet. Add enrollment partners to coordinate coverage.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(partners || []).map((p: any) => (
            <Card key={p.id} data-testid={`card-partner-list-${p.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{p.organizationType}</Badge>
                      <Badge variant="secondary" className="text-xs">{p.county}</Badge>
                      {p.hhscCppLevel && <Badge className="text-xs">CPP L{p.hhscCppLevel}</Badge>}
                      {p.isVitaSite && <Badge className="text-xs bg-yellow-500">VITA</Badge>}
                    </div>
                    {p.contactEmail && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {p.contactEmail}
                      </div>
                    )}
                  </div>
                  {p.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChwNetwork() {
  const { toast } = useToast();
  const { data: chws, isLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/chw-network"] });
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [county, setCounty] = useState("");
  const [langs, setLangs] = useState("");
  const [org, setOrg] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/benefits/chw-network", {
        name, role, county,
        languages: langs ? langs.split(",").map(l => l.trim()) : [],
        affiliatedOrg: org || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/chw-network"] });
      toast({ title: "CHW Added" });
      setShowForm(false);
      setName(""); setRole(""); setCounty(""); setLangs(""); setOrg("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add CHW.", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-lg" data-testid="text-chw-header">CHW & Champion Network</h3>
          <p className="text-sm text-muted-foreground">Community Health Workers, benefits navigators, and trusted community leaders - the last mile of enrollment</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-chw">
          <Plus className="h-4 w-4 mr-1" /> Add CHW/Champion
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} data-testid="input-chw-name" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger data-testid="select-chw-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {["Community Health Worker", "Benefits Navigator", "Enrollment Counselor", "Community Champion", "Promotora", "Peer Support"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>County</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger data-testid="select-chw-county"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(counties || []).map((c: any) => (
                      <SelectItem key={c.fips} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Languages (comma-separated)</Label>
                <Input value={langs} onChange={e => setLangs(e.target.value)} placeholder="English, Spanish" data-testid="input-chw-languages" />
              </div>
              <div>
                <Label>Affiliated Organization</Label>
                <Input value={org} onChange={e => setOrg(e.target.value)} data-testid="input-chw-org" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!name || !role || !county || createMutation.isPending} data-testid="button-submit-chw">
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (chws || []).length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No CHWs or champions registered. These trusted community members are the last mile of enrollment.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(chws || []).map((chw: any) => (
            <Card key={chw.id} data-testid={`card-chw-${chw.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{chw.name}</p>
                    <p className="text-xs text-muted-foreground">{chw.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{chw.county}</Badge>
                      {chw.affiliatedOrg && <span className="text-xs text-muted-foreground">{chw.affiliatedOrg}</span>}
                    </div>
                    {chw.languages?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {chw.languages.map((l: string) => (
                          <Badge key={l} variant="outline" className="text-xs">
                            <Languages className="h-3 w-3 mr-1" />{l}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Capacity: {chw.activeCases || 0}/{chw.capacity || 20}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VirtualNavigator() {
  const { toast } = useToast();
  const [householdSize, setHouseholdSize] = useState("1");
  const [annualIncome, setAnnualIncome] = useState("");
  const [hasChildren, setHasChildren] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isElderly, setIsElderly] = useState(false);
  const [currentBenefits, setCurrentBenefits] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const screenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/screenings", {
        screeningType: "virtual",
        householdSize: parseInt(householdSize),
        annualIncome: parseFloat(annualIncome) || 0,
        hasChildren,
        isPregnant,
        isDisabled,
        isElderly,
        currentBenefits,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/screenings"] });
      toast({ title: "Screening Complete", description: `Found ${data.gapBenefits?.length || 0} potential benefits.` });
    },
    onError: () => toast({ title: "Error", description: "Screening failed.", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-green-900/10 border-green-500/30 dark:bg-green-900/20">
        <div className="flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">Virtual Eligibility Screener</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Screen for SNAP, Medicaid/CHIP, EITC, WIC, SSI/SSDI, Marketplace, CTC eligibility. The platform handles everything it can digitally, then creates a warm handoff to a CHW or partner for in-person support.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Household Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Household Size</Label>
                <Select value={householdSize} onValueChange={setHouseholdSize}>
                  <SelectTrigger data-testid="select-household-size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Annual Household Income ($)</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="e.g., 25000" data-testid="input-annual-income" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Has children under 18</Label>
                <Switch checked={hasChildren} onCheckedChange={setHasChildren} data-testid="switch-has-children" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Pregnant</Label>
                <Switch checked={isPregnant} onCheckedChange={setIsPregnant} data-testid="switch-pregnant" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Has a disability</Label>
                <Switch checked={isDisabled} onCheckedChange={setIsDisabled} data-testid="switch-disabled" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Age 65+</Label>
                <Switch checked={isElderly} onCheckedChange={setIsElderly} data-testid="switch-elderly" />
              </div>
            </div>

            <div>
              <Label>Currently receiving (select all that apply)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {["SNAP", "Medicaid", "CHIP", "EITC", "WIC", "SSI", "SSDI", "Marketplace", "CTC"].map(b => (
                  <Button
                    key={b}
                    variant={currentBenefits.includes(b) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentBenefits(prev =>
                      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
                    )}
                    data-testid={`button-current-${b}`}
                  >
                    {b}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={() => screenMutation.mutate()} disabled={!annualIncome || screenMutation.isPending} data-testid="button-screen">
              {screenMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Screening...</> : <><Search className="h-4 w-4 mr-2" /> Screen for Benefits</>}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card data-testid="card-screening-result">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> Screening Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.gapBenefits?.length > 0 ? (
                <>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${result.estimatedAnnualValue?.toLocaleString()}/year
                    </p>
                    <p className="text-sm text-muted-foreground">Estimated annual value of unclaimed benefits</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">You may be eligible for:</h4>
                    <div className="space-y-2">
                      {result.gapBenefits.map((b: string) => {
                        const Icon = BENEFIT_ICONS[b] || Heart;
                        return (
                          <div key={b} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20" data-testid={`result-benefit-${b}`}>
                            <Icon className="h-4 w-4" style={{ color: BENEFIT_COLORS[b] }} />
                            <span className="font-medium text-sm">{b}</span>
                            <Badge variant="secondary" className="text-xs ml-auto">Not receiving</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {result.eligibleBenefits?.filter((b: string) => result.currentBenefits?.includes(b)).length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Already receiving:</h4>
                      <div className="flex flex-wrap gap-1">
                        {result.currentBenefits?.map((b: string) => (
                          <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Next Step: Warm Handoff</p>
                    <p className="text-xs text-muted-foreground">Connect with a CHW or partner organization for in-person enrollment assistance</p>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="button-handoff">
                      <HandHeart className="h-4 w-4 mr-2" /> Find Nearest Navigator
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-medium">All eligible benefits are being received</p>
                  <p className="text-sm text-muted-foreground mt-1">Renewals should still be tracked to prevent lapses.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function HhscPathway() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/hhsc-cpp"] });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-purple-900/10 border-purple-500/30 dark:bg-purple-900/20">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">HHSC Community Partner Program</h3>
            <p className="text-xs text-muted-foreground mt-1">{data?.keySignal}</p>
          </div>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">{data?.overview}</p>
      <p className="text-sm font-medium">{data?.recommendation}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.levels?.map((level: any) => (
          <Card key={level.level} className="relative overflow-hidden" data-testid={`card-cpp-level-${level.level}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${level.level === 1 ? "bg-green-500" : level.level === 2 ? "bg-blue-500" : "bg-purple-500"}`} />
            <CardHeader className="pt-5">
              <div className="flex items-center gap-2">
                <Badge variant={level.level === 3 ? "default" : "secondary"}>Level {level.level}</Badge>
                <CardTitle className="text-base">{level.name}</CardTitle>
              </div>
              <CardDescription>{level.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">REQUIREMENTS</p>
                <ul className="space-y-1">
                  {level.requirements.map((r: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">CAPABILITIES</p>
                <ul className="space-y-1">
                  {level.capabilities.map((c: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center pt-2 border-t">
                <span className="text-lg font-bold">{level.trainingHours}h</span>
                <p className="text-xs text-muted-foreground">Training Required</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <a href={data?.enrollmentUrl} target="_blank" rel="noopener noreferrer">
          <Button data-testid="button-hhsc-enroll">
            <Globe className="h-4 w-4 mr-2" /> Visit HHSC CPP Enrollment
          </Button>
        </a>
      </div>
    </div>
  );
}

function MetricsPanel() {
  const { data: metrics, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/metrics"] });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Virtual-to-In-Person Pipeline</CardTitle>
          <CardDescription>How many people move through each stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {[
              { label: "Screened", value: metrics.pipeline.screened, icon: Search },
              { label: "Handed Off", value: metrics.pipeline.handedOff, icon: HandHeart },
              { label: "Enrolled", value: metrics.pipeline.enrolled, icon: CheckCircle2 },
              { label: "Renewed", value: metrics.pipeline.renewed, icon: RefreshCw },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                <div className="text-center p-3 rounded-lg bg-muted/50" data-testid={`pipeline-${stage.label.toLowerCase()}`}>
                  <stage.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className="text-xl font-bold block">{stage.value}</span>
                  <span className="text-xs text-muted-foreground">{stage.label}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3-Year Enrollment Targets</CardTitle>
          <CardDescription>Aligned with CTX Benefits Initiative outcome targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.threeYearTargets?.map((t: any) => {
              const Icon = BENEFIT_ICONS[t.benefitType] || Heart;
              return (
                <div key={t.benefitType} className="space-y-2" data-testid={`target-${t.benefitType}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: BENEFIT_COLORS[t.benefitType] }} />
                      <span className="text-sm font-medium">{t.benefitType}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Gap: {t.currentGap?.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-muted/50">
                      <span className="font-bold block">{t.year1Target?.toLocaleString()}</span>
                      <span className="text-muted-foreground">Year 1 (15%)</span>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <span className="font-bold block">{t.year2Target?.toLocaleString()}</span>
                      <span className="text-muted-foreground">Year 2 (35%)</span>
                    </div>
                    <div className="p-2 rounded bg-primary/10">
                      <span className="font-bold block text-primary">{t.year3Target?.toLocaleString()}</span>
                      <span className="text-muted-foreground">Year 3 (50%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Renewal Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50" data-testid="renewals-pending">
              <Clock className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
              <span className="text-2xl font-bold">{metrics.renewals.pending?.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground">Renewals Pending</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20" data-testid="renewals-at-risk">
              <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-red-500" />
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.renewals.atRisk?.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground">At Risk of Lapsing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CTX Benefits Initiative Alignment</CardTitle>
          <CardDescription>Program evaluation criteria — 5-county region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Increased enrollment in core benefits", key: "increasedEnrollment" },
              { label: "Stronger community hubs with culturally responsive practices", key: "strongerCommunityHubs" },
              { label: "Culturally and linguistically responsive services", key: "culturallyResponsive" },
              { label: "Co-location and coordination among providers", key: "coLocationCoordination" },
              { label: "Reduced fragmentation in service delivery", key: "reducedFragmentation" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-2" data-testid={`alignment-${item.key}`}>
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OutreachPanel() {
  const [selectedCounty, setSelectedCounty] = useState("48453");
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const { data: strategy, isLoading } = useQuery<any>({
    queryKey: ["/api/benefits/outreach-strategy", selectedCounty],
    enabled: !!selectedCounty,
  });

  const strategyIcons: Record<string, typeof MapPin> = {
    "Virtual-First": Wifi, "Virtual + Phone Follow-up": Phone,
    "In-Person at Community Hub": Building2, "Mobile Outreach Van": Truck,
    "Trusted Messenger / Accompaniment": HandHeart,
  };

  const priorityColors: Record<string, string> = {
    primary: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    secondary: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedCounty} onValueChange={setSelectedCounty}>
          <SelectTrigger className="w-[220px]" data-testid="select-outreach-county">
            <SelectValue placeholder="Select county" />
          </SelectTrigger>
          <SelectContent>
            {(counties || []).map((c: any) => (
              <SelectItem key={c.fips} value={c.fips}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : strategy?.strategies ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barrier Profile: {strategy.countyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3 text-center text-xs">
                {[
                  { label: "English", value: strategy.barrierProfile.limitedEnglish, icon: Languages },
                  { label: "Vehicle", value: strategy.barrierProfile.noVehicle, icon: Truck },
                  { label: "Broadband", value: strategy.barrierProfile.noBroadband, icon: WifiOff },
                  { label: "Non-Citizen", value: strategy.barrierProfile.nonCitizen, icon: Ban },
                  { label: "Poverty", value: strategy.barrierProfile.poverty, icon: DollarSign },
                ].map((b) => (
                  <div key={b.label} className="p-2 rounded-lg bg-muted/50">
                    <b.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <span className="font-bold block" style={{ color: getBarrierColor(b.value) }}>
                      {b.value?.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">{b.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold">Recommended Engagement Strategies</h3>
            {strategy.strategies.map((s: any, i: number) => {
              const Icon = strategyIcons[s.approach] || Navigation;
              return (
                <Card key={i} data-testid={`strategy-${i}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{s.approach}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[s.priority] || ""}`}>
                            {s.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">{s.suitability}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BenefitsCommandCenterPage() {
  const [activeTab, setActiveTab] = useState<TabId>("command");
  const { data: provenanceStats } = useQuery<any>({ queryKey: ["/api/benefits/command-center/stats"] });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">Benefits Command Center</h1>
          {provenanceStats?.dataProvenance?.hasDemoData && (
            <Badge variant="outline" className="text-xs text-amber-600" data-testid="badge-demo-data">
              Demo data — {provenanceStats.dataProvenance.demoRows} of {provenanceStats.dataProvenance.totalRows} rows are illustrative examples, not verified enrollment counts
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          5-County Benefits Intelligence System — Travis, Williamson, Hays, Bastrop, Caldwell
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
            <TabsTrigger value="command" data-testid="tab-command">Command Center</TabsTrigger>
            <TabsTrigger value="gis" data-testid="tab-gis">GIS Map</TabsTrigger>
            <TabsTrigger value="barriers" data-testid="tab-barriers">Barriers</TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-facilitators">Facilitators</TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
            <TabsTrigger value="chw" data-testid="tab-chw">CHW Network</TabsTrigger>
            <TabsTrigger value="navigator" data-testid="tab-navigator">Navigator</TabsTrigger>
            <TabsTrigger value="hhsc" data-testid="tab-hhsc">HHSC CPP</TabsTrigger>
            <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
            <TabsTrigger value="outreach" data-testid="tab-outreach">Outreach</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="command"><CommandDashboard /></TabsContent>
        <TabsContent value="gis"><GisMapPanel /></TabsContent>
        <TabsContent value="barriers"><BarriersPanel /></TabsContent>
        <TabsContent value="map"><FacilitatorsPanel /></TabsContent>
        <TabsContent value="partners"><PartnerHub /></TabsContent>
        <TabsContent value="chw"><ChwNetwork /></TabsContent>
        <TabsContent value="navigator"><VirtualNavigator /></TabsContent>
        <TabsContent value="hhsc"><HhscPathway /></TabsContent>
        <TabsContent value="metrics"><MetricsPanel /></TabsContent>
        <TabsContent value="outreach"><OutreachPanel /></TabsContent>
      </Tabs>

      <RelatedTools exclude={["how-to-apply"]} />
    </div>
  );
}
