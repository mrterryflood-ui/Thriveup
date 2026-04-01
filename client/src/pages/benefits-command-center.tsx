import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, Shield, DollarSign, Users, MapPin, AlertTriangle, Activity,
  TrendingUp, Building2, Target, Globe, Search, ChevronRight,
  Eye, ArrowRight, FileText, CheckCircle2, Handshake, Home,
  Briefcase, Phone, BarChart, Sparkles, Network, Star,
  Baby, Landmark, UtensilsCrossed, ShieldCheck, Truck,
  Wifi, WifiOff, Car, Languages, UserCheck, ClipboardList,
  ArrowUpRight, CircleDot, Layers, BookOpen, Calendar
} from "lucide-react";

type TabId = "overview" | "counties" | "barriers" | "partners" | "chw" | "navigator" | "hhsc" | "metrics" | "modality";

const TAB_ITEMS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "5-County Overview", icon: Globe },
  { id: "counties", label: "County Deep Dive", icon: MapPin },
  { id: "barriers", label: "Barriers & Facilitators", icon: AlertTriangle },
  { id: "partners", label: "Partner Hub", icon: Handshake },
  { id: "chw", label: "CHW Network", icon: UserCheck },
  { id: "navigator", label: "Virtual Navigator", icon: Sparkles },
  { id: "hhsc", label: "HHSC CPP Pathway", icon: ShieldCheck },
  { id: "metrics", label: "3-Year Targets", icon: Target },
  { id: "modality", label: "Outreach Modalities", icon: Truck },
];

const BENEFIT_ICONS: Record<string, any> = {
  snap: UtensilsCrossed, wic: Baby, medicaid: Heart, chip: Shield,
  marketplace: Building2, eitc: DollarSign, ctc: Users, ssi: Landmark, ssdi: Briefcase,
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function OverviewTab() {
  const { data: overview, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/overview"] });
  const { data: counties, isLoading: countiesLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });

  if (isLoading || countiesLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <p className="text-sm text-muted-foreground">Total Enrollment Gap</p>
          <p className="text-2xl font-bold text-red-600" data-testid="text-total-gap">{formatNumber(overview?.region?.totalGap || 0)}</p>
          <p className="text-xs text-muted-foreground">Eligible but not enrolled</p>
        </Card>
        <Card className="p-4 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <p className="text-sm text-muted-foreground">Currently Enrolled</p>
          <p className="text-2xl font-bold text-green-600" data-testid="text-total-enrolled">{formatNumber(overview?.region?.totalEnrolled || 0)}</p>
          <p className="text-xs text-muted-foreground">Across all benefits</p>
        </Card>
        <Card className="p-4 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-sm text-muted-foreground">Total Eligible</p>
          <p className="text-2xl font-bold text-blue-600" data-testid="text-total-eligible">{formatNumber(overview?.region?.totalEligible || 0)}</p>
          <p className="text-xs text-muted-foreground">5-county region</p>
        </Card>
        <Card className="p-4 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <p className="text-sm text-muted-foreground">Regional Population</p>
          <p className="text-2xl font-bold text-purple-600" data-testid="text-total-population">{formatNumber(overview?.region?.totalPopulation || 0)}</p>
          <p className="text-xs text-muted-foreground">Travis, Williamson, Hays, Bastrop, Caldwell</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Enrollment Gap by Benefit Type</h3>
        <div className="space-y-3">
          {overview?.benefits?.map((b: any) => {
            const Icon = BENEFIT_ICONS[b.id] || Heart;
            return (
              <div key={b.id} className="flex items-center gap-3" data-testid={`row-benefit-${b.id}`}>
                <Icon className="h-5 w-5 shrink-0" style={{ color: b.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{b.name} <span className="text-muted-foreground">({b.category})</span></span>
                    <span className="text-muted-foreground">{b.participationRate}% enrolled · {formatNumber(b.totalGap)} gap</span>
                  </div>
                  <Progress value={b.participationRate} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counties?.map((c: any) => (
          <Card key={c.fips} className="p-4" data-testid={`card-county-${c.fips}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">{c.name}</h4>
                <p className="text-sm text-muted-foreground">Pop: {formatNumber(c.population)}</p>
              </div>
              <Badge variant={c.strategy === "strengthen" ? "default" : "secondary"}>
                {c.strategy === "strengthen" ? "Strengthen" : "Build"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Participation Rate</span>
                <span className="font-medium">{c.participationRate}%</span>
              </div>
              <Progress value={c.participationRate} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>Enrollment Gap</span>
                <span className="font-medium text-red-600">{formatNumber(c.totalGap)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Barrier Index</span>
                <Badge variant={c.barrierIndex > 60 ? "destructive" : c.barrierIndex > 40 ? "secondary" : "default"} className="text-xs">
                  {c.barrierIndex}/100
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CountyDeepDiveTab() {
  const [selectedFips, setSelectedFips] = useState("48491");
  const { data: counties } = useQuery<any[]>({ queryKey: ["/api/benefits/counties"] });
  const { data: county, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/county", selectedFips] });

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {counties?.map((c: any) => (
          <Button key={c.fips} variant={selectedFips === c.fips ? "default" : "outline"} size="sm"
            onClick={() => setSelectedFips(c.fips)} data-testid={`button-county-${c.fips}`}>
            {c.name.replace(" County", "")}
          </Button>
        ))}
      </div>

      {isLoading ? <Skeleton className="h-64" /> : county && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Population</p>
              <p className="text-xl font-bold">{formatNumber(county.population)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Infrastructure</p>
              <Badge>{county.enrollmentInfrastructure}</Badge>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Barrier Index</p>
              <p className="text-xl font-bold text-orange-600">{county.barrierIndex}/100</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Recommended Approach</p>
              <Badge variant="secondary" className="text-xs">{county.recommendedModality?.replace(/-/g, " ")}</Badge>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Benefits Enrollment by Type</h3>
            <div className="space-y-4">
              {county.benefits?.map((b: any) => {
                const Icon = BENEFIT_ICONS[b.id] || Heart;
                return (
                  <div key={b.id} className="border rounded-lg p-3" data-testid={`detail-benefit-${b.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: b.color }} />
                        <span className="font-medium">{b.name}</span>
                        <Badge variant="outline" className="text-xs">{b.category}</Badge>
                      </div>
                      <span className="text-sm font-medium">{b.participationRate}% enrolled</span>
                    </div>
                    <Progress value={b.participationRate} className="h-2 mb-2" />
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>Eligible: {formatNumber(b.eligible)}</span>
                      <span>Enrolled: {formatNumber(b.enrolled)}</span>
                      <span className="text-red-600 font-medium">Gap: {formatNumber(b.gap)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Barrier Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {county.barriers && Object.entries(county.barriers as Record<string, number>).map(([key, value]) => {
                const labels: Record<string, { label: string; icon: any }> = {
                  limitedEnglish: { label: "Limited English", icon: Languages },
                  noVehicle: { label: "No Vehicle", icon: Car },
                  noBroadband: { label: "No Broadband", icon: WifiOff },
                  nonCitizen: { label: "Non-Citizen", icon: Globe },
                  poverty: { label: "Poverty Rate", icon: DollarSign },
                };
                const meta = labels[key] || { label: key, icon: AlertTriangle };
                const Icon = meta.icon;
                return (
                  <div key={key} className="text-center p-3 border rounded-lg">
                    <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{value}%</p>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Zip Codes Served</h3>
            <div className="flex gap-2 flex-wrap">
              {county.zipCodes?.map((z: string) => (
                <Badge key={z} variant="outline">{z}</Badge>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function BarriersTab() {
  const { data: barriers, isLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/barriers"] });

  if (isLoading) return <Skeleton className="h-64" />;

  const barrierLabels = [
    { key: "limitedEnglish", label: "Limited English Proficiency", icon: Languages, description: "Population with limited English creates language barriers for benefits applications" },
    { key: "noVehicle", label: "No Vehicle Access", icon: Car, description: "Lack of transportation prevents reaching enrollment offices and partner sites" },
    { key: "noBroadband", label: "No Broadband Access", icon: WifiOff, description: "Digital divide prevents online applications and virtual navigator sessions" },
    { key: "nonCitizen", label: "Non-Citizen Population", icon: Globe, description: "Immigration-related fear and mixed-status family complexity — explicitly named by St. David's as a barrier they want addressed" },
    { key: "poverty", label: "Poverty Concentration", icon: DollarSign, description: "Concentrated poverty indicates high need and compounding barriers" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
        <h3 className="text-lg font-semibold mb-2">Enrollment Barrier Index</h3>
        <p className="text-sm text-muted-foreground">Composite score (0-100) weighing five key barriers that prevent eligible people from enrolling in benefits. Higher scores indicate neighborhoods where people are most likely in the shadows — needing trusted, culturally responsive, in-person support.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barriers?.sort((a: any, b: any) => b.barrierIndex - a.barrierIndex).map((county: any) => (
          <Card key={county.fips} className="p-4" data-testid={`card-barrier-${county.fips}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{county.name}</h4>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: county.barrierIndex > 60 ? '#ef4444' : county.barrierIndex > 40 ? '#f97316' : '#22c55e' }}>
                  {county.barrierIndex}
                </p>
                <p className="text-xs text-muted-foreground">Barrier Index</p>
              </div>
            </div>
            <Progress value={county.barrierIndex} className="h-3 mb-3" />
            <div className="space-y-1 text-sm">
              {barrierLabels.map(bl => (
                <div key={bl.key} className="flex justify-between">
                  <span className="text-muted-foreground">{bl.label}</span>
                  <span className="font-medium">{county.barriers[bl.key]}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Badge variant="secondary" className="text-xs">{county.recommendedModality?.replace(/-/g, " ")}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Barrier Definitions</h3>
        <div className="space-y-4">
          {barrierLabels.map(bl => {
            const Icon = bl.icon;
            return (
              <div key={bl.key} className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{bl.label}</p>
                  <p className="text-sm text-muted-foreground">{bl.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function PartnersTab() {
  const { data: partners, isLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/partners"] });

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  const grouped = (partners || []).reduce((acc: any, p: any) => {
    if (!acc[p.countyName]) acc[p.countyName] = [];
    acc[p.countyName].push(p);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    community_hub: "Community Hub", health_center: "Health Center", food_pantry: "Food Pantry",
    workforce: "Workforce Services", community_action: "Community Action Agency", church: "Faith-Based",
    library: "Library", school: "School",
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
        <h3 className="text-lg font-semibold mb-2">Partner Collaboration Hub</h3>
        <p className="text-sm text-muted-foreground">TCAF serves as the technology backbone — sharing enrollment gap data, coordinating CHW deployment, and tracking coverage to avoid duplication. Partners bring trusted faces, local presence, and enrollment expertise. Use St. David's resource map by county to find complementary organizations.</p>
      </Card>

      {Object.entries(grouped).map(([county, countyPartners]: [string, any]) => (
        <div key={county}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {county}
            <Badge variant="outline">{countyPartners.length} partners</Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {countyPartners.map((p: any) => (
              <Card key={p.id} className="p-4" data-testid={`card-partner-${p.id}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{p.organizationName}</h4>
                    <Badge variant="outline" className="text-xs mt-1">{typeLabels[p.partnerType] || p.partnerType}</Badge>
                  </div>
                  <Badge variant={p.capacityStatus === "active" ? "default" : "secondary"} className="text-xs">
                    {p.capacityStatus}
                  </Badge>
                </div>
                {p.servicesProvided && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {p.servicesProvided.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  {p.languages && <p>Languages: {p.languages.join(", ")}</p>}
                  {p.hhscCppLevel && <p>HHSC CPP Level: <span className="font-medium text-foreground">{p.hhscCppLevel}</span></p>}
                  {p.isVitaSite && <Badge variant="outline" className="text-xs">VITA Site</Badge>}
                  {p.zipCode && <p>Zip: {p.zipCode}</p>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChwNetworkTab() {
  const { data: chws, isLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/chw-network"] });

  return (
    <div className="space-y-6">
      <Card className="p-6 border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
        <h3 className="text-lg font-semibold mb-2">Community Health Workers & Champions Network</h3>
        <p className="text-sm text-muted-foreground">CHWs and trusted community champions are the "last mile" of benefits enrollment — the people who physically accompany clients through the process, speak their language, understand their fears, and have earned the community's trust. This is how we reach people in the shadows.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold" data-testid="text-chw-count">{chws?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Active CHWs/Champions</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">{chws?.reduce((s: number, c: any) => s + (c.enrollmentsCompleted || 0), 0) || 0}</p>
          <p className="text-sm text-muted-foreground">Enrollments Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <p className="text-2xl font-bold">{chws?.reduce((s: number, c: any) => s + (c.renewalsCompleted || 0), 0) || 0}</p>
          <p className="text-sm text-muted-foreground">Renewals Completed</p>
        </Card>
      </div>

      {chws && chws.length > 0 ? (
        <div className="space-y-3">
          {chws.map((chw: any) => (
            <Card key={chw.id} className="p-4" data-testid={`card-chw-${chw.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{chw.name}</h4>
                  <p className="text-sm text-muted-foreground">{chw.role}</p>
                </div>
                <Badge variant={chw.status === "active" ? "default" : "secondary"}>{chw.status}</Badge>
              </div>
              {chw.languages && <div className="flex gap-1 mt-2">{chw.languages.map((l: string) => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}</div>}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <UserCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h4 className="font-semibold mb-2">Build Your CHW Network</h4>
          <p className="text-sm text-muted-foreground mb-4">No CHWs registered yet. As TCAF builds partnerships, add Community Health Workers and trusted community champions who will provide in-person enrollment support in each neighborhood.</p>
          <div className="text-sm text-left max-w-md mx-auto space-y-2">
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Bilingual navigators for mixed-status families</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Culturally matched by neighborhood</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Trained on SNAP, Medicaid, CHIP, EITC enrollment</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Trusted voices already embedded in community</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function VirtualNavigatorTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10">
        <h3 className="text-lg font-semibold mb-2">Virtual Benefits Navigator</h3>
        <p className="text-sm text-muted-foreground">The platform handles as much as possible virtually — eligibility screening, benefits matching, document prep, appointment scheduling — then creates a warm handoff to in-person support when someone needs to be met where they are.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" /> AI Eligibility Screening</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Quick Intake</p>
                <p className="text-muted-foreground">Household size, income, age of children, county of residence — simple questions in the client's preferred language</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Benefits Matching</p>
                <p className="text-muted-foreground">AI screens for eligibility across SNAP, Medicaid, CHIP, EITC, WIC, SSI/SSDI, Marketplace — shows all benefits the household may qualify for</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Document Checklist</p>
                <p className="text-muted-foreground">Generates personalized list of required documents for each benefit application</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge className="mt-0.5">4</Badge>
              <div>
                <p className="font-medium">Warm Handoff</p>
                <p className="text-muted-foreground">Connects to nearest CHW or partner organization for in-person enrollment support if needed</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600" /> Renewal Pipeline</h4>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">St. David's explicitly values renewal support equally with new enrollments. Keeping benefits is as hard as getting them.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="font-medium">Renewal Tracking</p>
                  <p className="text-xs text-muted-foreground">Flag clients approaching renewal deadlines 60/30/14 days out</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Proactive Outreach</p>
                  <p className="text-xs text-muted-foreground">Automated SMS/call reminders in client's preferred language</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Re-enrollment Support</p>
                  <p className="text-xs text-muted-foreground">Pre-fill renewal forms with existing data, flag changed circumstances</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <UserCheck className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">CHW Follow-Up</p>
                  <p className="text-xs text-muted-foreground">Assign CHW for in-person renewal help if client is at risk of losing benefits</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-semibold mb-3">Virtual → In-Person Pipeline</h4>
        <div className="flex items-center justify-between text-center">
          {[
            { label: "Virtual Screening", icon: Sparkles, color: "text-purple-600" },
            { label: "Benefits Matched", icon: CheckCircle2, color: "text-blue-600" },
            { label: "Documents Prepped", icon: FileText, color: "text-cyan-600" },
            { label: "CHW Handoff", icon: Handshake, color: "text-orange-600" },
            { label: "Enrolled", icon: Star, color: "text-green-600" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="text-center">
                <step.icon className={`h-6 w-6 mx-auto mb-1 ${step.color}`} />
                <p className="text-xs font-medium">{step.label}</p>
              </div>
              {i < 4 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function HhscCppTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/hhsc-cpp"] });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
        <h3 className="text-lg font-semibold mb-2">{data?.program}</h3>
        <p className="text-sm text-muted-foreground">{data?.description}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.levels?.map((level: any) => (
          <Card key={level.level} className={`p-6 ${level.level === 3 ? 'border-green-500 ring-1 ring-green-500' : ''}`} data-testid={`card-cpp-level-${level.level}`}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={level.level === 3 ? "default" : "secondary"} className="text-lg px-3 py-1">Level {level.level}</Badge>
              <h4 className="font-semibold">{level.name}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{level.description}</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Requirements</p>
                <ul className="text-sm space-y-1">
                  {level.requirements?.map((r: string) => (
                    <li key={r} className="flex items-start gap-2"><CircleDot className="h-3 w-3 mt-1 shrink-0" />{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Capabilities</p>
                <ul className="text-sm space-y-1">
                  {level.capabilities?.map((c: string) => (
                    <li key={c} className="flex items-start gap-2"><CheckCircle2 className="h-3 w-3 mt-1 text-green-600 shrink-0" />{c}</li>
                  ))}
                </ul>
              </div>
              <Badge variant="outline" className="text-xs">{level.timeToAchieve}</Badge>
              {level.note && <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-2">{level.note}</p>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">TCAF's CPP Journey Plan</h3>
        <div className="space-y-3">
          {data?.tcafPlan?.timeline?.map((phase: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded-lg" data-testid={`row-cpp-phase-${i}`}>
              <Badge variant="outline" className="shrink-0">{phase.duration}</Badge>
              <div className="flex-1">
                <p className="font-medium">{phase.phase}</p>
              </div>
              <Badge variant={phase.status === "completed" ? "default" : "secondary"} className="text-xs">{phase.status}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm"><span className="font-semibold">Current Level:</span> {data?.tcafPlan?.currentLevel} → <span className="font-semibold">Target:</span> Level {data?.tcafPlan?.targetLevel}</p>
        </div>
      </Card>
    </div>
  );
}

function MetricsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/benefits/metrics"] });

  if (isLoading) return <Skeleton className="h-64" />;

  const countyGroups = (data?.targets || []).reduce((acc: any, t: any) => {
    if (!acc[t.countyName]) acc[t.countyName] = [];
    acc[t.countyName].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Current Gap</p>
          <p className="text-2xl font-bold text-red-600" data-testid="text-metrics-gap">{formatNumber(data?.summary?.totalCurrentGap || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Year 1 Target</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(data?.summary?.totalYear1 || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Year 2 Target</p>
          <p className="text-2xl font-bold text-purple-600">{formatNumber(data?.summary?.totalYear2 || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">3-Year Total</p>
          <p className="text-2xl font-bold text-green-600">{formatNumber(data?.summary?.totalTarget || 0)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">3-Year Enrollment Targets</h3>
        <p className="text-sm text-muted-foreground mb-4">Year 1: 15% gap closure | Year 2: 25% gap closure | Year 3: 30% gap closure — achievable, data-driven, with fidelity tracked through MAP-GAP.</p>
      </Card>

      {Object.entries(countyGroups).map(([county, targets]: [string, any]) => (
        <Card key={county} className="p-6">
          <h4 className="font-semibold mb-3">{county}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Benefit</th>
                  <th className="text-right py-2">Gap</th>
                  <th className="text-right py-2">Yr 1</th>
                  <th className="text-right py-2">Yr 2</th>
                  <th className="text-right py-2">Yr 3</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">New Rate</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t: any) => (
                  <tr key={t.benefitType} className="border-b last:border-0" data-testid={`row-target-${county}-${t.benefitType}`}>
                    <td className="py-2 font-medium">{t.benefitName}</td>
                    <td className="text-right text-red-600">{formatNumber(t.currentGap)}</td>
                    <td className="text-right">{formatNumber(t.year1Target)}</td>
                    <td className="text-right">{formatNumber(t.year2Target)}</td>
                    <td className="text-right">{formatNumber(t.year3Target)}</td>
                    <td className="text-right font-medium text-green-600">{formatNumber(t.totalTarget)}</td>
                    <td className="text-right">
                      <Badge variant="outline" className="text-xs">{t.targetRate}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ModalityTab() {
  const { data, isLoading } = useQuery<any[]>({ queryKey: ["/api/benefits/modality-recommendations"] });

  if (isLoading) return <Skeleton className="h-64" />;

  const modalityIcons: Record<string, any> = {
    "virtual-first": Wifi, "hybrid": Network, "trusted-partner": Handshake,
    "mobile-outreach": Truck, "in-person-accompany": UserCheck,
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-950/10">
        <h3 className="text-lg font-semibold mb-2">Multi-Modal Outreach Strategy</h3>
        <p className="text-sm text-muted-foreground">Each neighborhood gets the right approach based on its barrier profile. Virtual where we can, in-person through trusted people where we must. Mobile van for rural areas (explicitly approved by St. David's). Always through people the community already trusts.</p>
      </Card>

      {data?.map((county: any) => {
        const Icon = modalityIcons[county.modality] || Globe;
        return (
          <Card key={county.fips} className="p-6" data-testid={`card-modality-${county.fips}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">{county.name}</h4>
                <p className="text-sm text-muted-foreground">Barrier Index: {county.barrierIndex}/100</p>
              </div>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <Badge>{county.details?.name}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{county.details?.description}</p>
            <div className="grid grid-cols-2 gap-2">
              {county.details?.tools?.map((tool: string) => (
                <div key={tool} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                  {tool}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3"><span className="font-medium">Best for:</span> {county.details?.bestFor}</p>
          </Card>
        );
      })}

      {data?.[0]?.allModalities && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Available Modalities</h3>
          <div className="space-y-4">
            {Object.entries(data[0].allModalities as Record<string, any>).map(([key, mod]: [string, any]) => {
              const Icon = modalityIcons[key] || Globe;
              return (
                <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{mod.name}</p>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                    <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Best for:</span> {mod.bestFor}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function BenefitsCommandCenterPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabContent: Record<TabId, JSX.Element> = {
    overview: <OverviewTab />,
    counties: <CountyDeepDiveTab />,
    barriers: <BarriersTab />,
    partners: <PartnersTab />,
    chw: <ChwNetworkTab />,
    navigator: <VirtualNavigatorTab />,
    hhsc: <HhscCppTab />,
    metrics: <MetricsTab />,
    modality: <ModalityTab />,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="benefits-command-center">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold">Benefits Command Center</h1>
            <p className="text-muted-foreground">We All Benefit 2.0 · 5-County Enrollment Intelligence · St. David's Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">LOI Due: April 27</Badge>
          <Badge variant="outline">$35M over 3 years</Badge>
          <Badge variant="outline">15-25 grants</Badge>
          <Badge variant="outline">Travis · Williamson · Hays · Bastrop · Caldwell</Badge>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6 border-b pb-4">
        {TAB_ITEMS.map(tab => (
          <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm"
            onClick={() => setActiveTab(tab.id)} className="gap-1.5" data-testid={`tab-${tab.id}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {tabContent[activeTab]}
    </div>
  );
}
