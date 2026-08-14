import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SDOHImpactChain } from "@/components/sdoh-impact-chain";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import {
  Users, MapPin, Shield, Heart, Building2, Target, TrendingUp,
  AlertTriangle, CheckCircle2, Loader2, ArrowRight, Globe,
  HandHeart, FileText, Phone, Mail, ChevronDown, ChevronUp,
  Landmark, Star, Sparkles, DollarSign, Activity, BookOpen,
  Stethoscope, Baby, Home, UserCheck, BarChart3, Zap, Network,
  Brain, MessageSquare, ChevronRight, ExternalLink, Calendar,
  Printer, Download, Search
} from "lucide-react";

function ExpandableCard({ id, title, subtitle, badges, icon: Icon, iconColor, children, defaultOpen }: {
  id: string; title: string; subtitle: string; badges?: Array<{ text: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
  icon: any; iconColor: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <Card className={`transition-all duration-300 ${open ? 'ring-2 ring-primary/20 shadow-lg' : 'hover:shadow-md'}`} data-testid={`card-${id}`}>
      <button className="w-full text-left" onClick={() => setOpen(!open)} data-testid={`button-expand-${id}`}>
        <div className="flex items-center gap-4 p-4 md:p-6">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {badges?.map((b, i) => <Badge key={i} variant={b.variant || "secondary"} className="hidden md:inline-flex">{b.text}</Badge>)}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-transform ${open ? 'rotate-180 bg-primary/10' : 'bg-muted'}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </button>
      {open && <div className="border-t px-4 pb-6 md:px-6 pt-4">{children}</div>}
    </Card>
  );
}

interface InsightResponse {
  insight: string;
  dataSnapshot?: { tractCount?: number };
}

interface ExecSummaryResponse {
  summary: string;
  generatedAt: string;
  dataSnapshot?: { totalEligible?: number; tracts?: number };
}

interface DashboardOverview {
  totalGap?: number;
  totalTracts?: number;
  totalEligible?: number;
  totalEnrolled?: number;
  totalPartners?: number;
  gapRate?: number;
}

interface CountyEntry {
  name: string;
  fips: string;
  [key: string]: unknown;
}

interface PartnerRoleEntry {
  county: string;
  role: string;
  description: string;
  ein?: string;
  [key: string]: unknown;
}

interface CoalitionLead {
  name?: string;
  role?: string;
  description?: string;
  ein?: string;
}

interface PartnerTier {
  tier: string;
  description: string;
  current: number;
  target: number;
}

interface DataMethodology {
  source?: string;
  variables?: string[];
  tractLevel?: string;
  methodology?: string;
}

interface CoalitionDashboard {
  overview?: DashboardOverview;
  counties?: CountyEntry[];
  partnerRolesNeeded?: PartnerRoleEntry[];
  coalitionStructure?: { lead?: CoalitionLead; partnerTiers?: PartnerTier[] };
  dataMethodology?: DataMethodology;
  dataProvenance?: { totalRows: number; demoRows: number; hasDemoData: boolean };
}

function AIInsightPanel({ countyFips, countyName }: { countyFips: string; countyName: string }) {
  const [question, setQuestion] = useState("");
  const insightMutation = useMutation<InsightResponse, Error, string | undefined>({
    mutationFn: async (q?: string) => {
      const res = await apiRequest("POST", "/api/benefits/coalition/ai-insight", { countyFips, question: q || undefined });
      return res.json();
    },
  });

  return (
    <div className="space-y-3 mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-600" />
        <h4 className="font-bold text-sm">AI Neighborhood Intelligence</h4>
        <Badge variant="outline" className="text-xs">RAG + Census ACS</Badge>
      </div>
      <div className="flex gap-2">
        <Input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={`Ask about ${countyName} — barriers, neighborhoods, outreach strategies...`}
          className="flex-1 bg-white dark:bg-background"
          data-testid={`input-ai-question-${countyFips}`}
        />
        <Button size="sm" onClick={() => insightMutation.mutate(question || undefined)} disabled={insightMutation.isPending} data-testid={`button-ai-ask-${countyFips}`}>
          {insightMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
        </Button>
      </div>
      {!insightMutation.data && !insightMutation.isPending && (
        <div className="flex gap-2 flex-wrap">
          {[
            "Where are the biggest gaps?",
            "What outreach works here?",
            "Which partners are missing?",
          ].map(q => (
            <button key={q} onClick={() => { setQuestion(q); insightMutation.mutate(q); }}
              className="text-xs px-3 py-1 rounded-full border hover:bg-primary/5 transition-colors" data-testid={`chip-${q.substring(0,10)}`}>
              {q}
            </button>
          ))}
        </div>
      )}
      {insightMutation.isPending && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-background/50">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-sm text-muted-foreground">Analyzing {countyName} data across all Census tracts...</span>
        </div>
      )}
      {insightMutation.data?.insight && (
        <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-white dark:bg-background border" data-testid={`ai-insight-${countyFips}`}>
          <div className="whitespace-pre-wrap text-sm">{insightMutation.data.insight}</div>
        </div>
      )}
    </div>
  );
}

export default function CoalitionPortalPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("plan");
  const [joinData, setJoinData] = useState({
    name: "", organizationType: "", county: "", contactName: "",
    contactEmail: "", contactPhone: "", servicesOffered: "", notes: "",
  });

  const { data: dashboard, isLoading } = useQuery<CoalitionDashboard>({ queryKey: ["/api/benefits/coalition/dashboard"] });

  const execSummaryMutation = useMutation<ExecSummaryResponse>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/coalition/ai-exec-summary", {});
      return res.json();
    },
  });

  const collabMatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/coalition/ai-collab-match", {
        organizationType: joinData.organizationType,
        county: joinData.county,
        services: joinData.servicesOffered,
        description: joinData.name,
      });
      return res.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/partners", {
        name: joinData.name, organizationType: joinData.organizationType, county: joinData.county,
        contactName: joinData.contactName, contactEmail: joinData.contactEmail, contactPhone: joinData.contactPhone,
        servicesOffered: joinData.servicesOffered.split(",").map(s => s.trim()).filter(Boolean),
        notes: joinData.notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Welcome to the Coalition!", description: "We'll be in touch within 48 hours." });
      setJoinData({ name: "", organizationType: "", county: "", contactName: "", contactEmail: "", contactPhone: "", servicesOffered: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/coalition/dashboard"] });
    },
    onError: () => toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading coalition intelligence...</p>
        </div>
      </div>
    );
  }

  const d = dashboard;
  const overview = d?.overview || {};
  const counties = d?.counties || [];
  const rolesNeeded = d?.partnerRolesNeeded || [];
  const coalition = d?.coalitionStructure || {};
  const methodology = d?.dataMethodology || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50/30 dark:from-blue-950/20 dark:via-background dark:to-green-950/10" data-testid="coalition-portal">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-sm px-3 py-1">St. David's Foundation · We All Benefit 2.0</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-portal-title">
            5-County Benefits Intelligence Coalition
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            Closing the enrollment gap for <strong className="text-foreground">{(overview.totalGap || 700000).toLocaleString()}</strong> eligible residents
            through data-driven, community-powered outreach across Central Texas.
          </p>
          {dashboard?.dataProvenance?.hasDemoData && (
            <p className="mb-3">
              <Badge variant="outline" className="text-xs text-amber-600" data-testid="badge-demo-data">
                Demo data — {dashboard.dataProvenance.demoRows} of {dashboard.dataProvenance.totalRows} benefits rows are illustrative examples, not verified enrollment counts
              </Badge>
            </p>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-blue-600 text-white"><Landmark className="h-3 w-3 mr-1" /> TCAF · 501(c)(3)</Badge>
            <Badge variant="outline"><Shield className="h-3 w-3 mr-1" /> Veteran-Founded · Black-Led</Badge>
            <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" /> 5 Counties · {overview.totalTracts || 501} Neighborhoods</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Eligible", value: (overview.totalEligible || 0).toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Enrolled", value: (overview.totalEnrolled || 0).toLocaleString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
            { label: "Gap", value: (overview.totalGap || 0).toLocaleString(), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
            { label: "Partners", value: String(overview.totalPartners || 0), icon: Network, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
            { label: "Neighborhoods", value: String(overview.totalTracts || 0), icon: MapPin, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className={stat.bg}>
                <CardContent className="pt-3 pb-3 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                  <p className="text-lg md:text-xl font-bold" data-testid={`stat-${stat.label.toLowerCase()}`}>{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full">
            <TabsTrigger value="plan" data-testid="tab-plan">The Plan</TabsTrigger>
            <TabsTrigger value="counties" data-testid="tab-counties">Counties</TabsTrigger>
            <TabsTrigger value="coalition" data-testid="tab-coalition">Coalition</TabsTrigger>
            <TabsTrigger value="sdoh" data-testid="tab-sdoh">SDOH Chain</TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">Data</TabsTrigger>
            <TabsTrigger value="join" data-testid="tab-join">Join</TabsTrigger>
            <TabsTrigger value="summary" data-testid="tab-summary">Exec Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-4">
            <ExpandableCard id="opportunity" title="The Opportunity" subtitle="St. David's We All Benefit 2.0 — $35M over 3 years" icon={DollarSign} iconColor="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" badges={[{ text: "LOI: April 27" }, { text: "$35M" }]} defaultOpen>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  St. David's Foundation is investing <strong>$35 million over three years</strong> to increase public benefits enrollment
                  across Travis, Williamson, Hays, Bastrop, and Caldwell counties. They want infrastructure, not silos — fragmented community organizations connected by data and coordinated by a tech-enabled backbone.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Key Dates</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2"><Badge variant="destructive" className="text-[10px]">DUE</Badge> LOI: April 27, 2026 at 5 PM CT</li>
                      <li className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">NEXT</Badge> Full Application: June 18, 2026 (if LOI accepted)</li>
                      <li className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">START</Badge> Funding begins: January 2027</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> What They Measure</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" /> Increased enrollment in public benefits</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" /> Renewals sustained (equally valued)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" /> Culturally responsive outreach</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" /> Reduced fragmentation</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" /> Geographic precision (neighborhood level)</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-yellow-600 shrink-0" /> <strong>Key resources from St. David's:</strong> Funding Opportunity Overview with rubric, CHNA, Community Voices Project, Pathways to Health Equity Strategic Plan, Benefits Enrollment Infrastructure Map. Read the rubric before writing the LOI.</p>
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard id="problem" title="The Problem" subtitle={`${(overview.totalGap || 670000).toLocaleString()} eligible people not enrolled — ${overview.gapRate || 40}% gap rate`} icon={AlertTriangle} iconColor="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" badges={[{ text: `${overview.gapRate || 40}% gap`, variant: "destructive" as const }]}>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Across five counties, <strong>{(overview.totalGap || 670000).toLocaleString()} people</strong> are eligible for benefits they're not receiving.
                  The problem isn't that benefits don't exist — it's that no single organization has the reach, the data, or the relationships to connect every eligible person
                  to every program they qualify for.
                </p>
                <div className="space-y-2">
                  {counties.map((c: any) => (
                    <div key={c.fips} className="flex items-center gap-3 p-3 rounded-lg border">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Pop. {(c.population || 0).toLocaleString()} · {c.tractCount} neighborhoods · {c.highNeedTracts} high-need</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-red-600">{(c.gap || 0).toLocaleString()} gap</p>
                        <p className="text-xs text-muted-foreground">{c.enrollmentRate}% enrolled</p>
                      </div>
                      <Progress value={c.enrollmentRate} className="w-16 h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard id="approach" title="How It Works" subtitle="Identify → Screen → Connect → Enroll & Retain" icon={Zap} iconColor="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" badges={[{ text: "4-Step Model" }]}>
              <div className="space-y-4">
                <p className="text-muted-foreground">TCAF is the <strong>coalition backbone</strong> — the data platform and coordination engine that makes existing organizations work together as one system instead of isolated efforts.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { step: "1", title: "Identify", desc: "Census ACS data pinpoints which neighborhoods have the largest gaps and what barriers exist — language, transportation, digital access. Down to the block level.", icon: Search, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
                    { step: "2", title: "Screen", desc: "CHWs use our 3-minute screener to check 9 programs at once — in the field, at churches, at food pantries, door-to-door. Works offline on any phone.", icon: UserCheck, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
                    { step: "3", title: "Connect", desc: "The system matches each person with the right navigator who speaks their language, serves their area, and has capacity. No wrong doors.", icon: Network, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
                    { step: "4", title: "Enroll & Retain", desc: "Navigators walk through applications, track status, and send renewal reminders. People don't lose benefits they already have.", icon: Shield, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className={`rounded-xl p-5 ${item.color}`}>
                        <Badge className="mb-2">Step {item.step}</Badge>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5" />
                          <h3 className="font-bold text-lg">{item.title}</h3>
                        </div>
                        <p className="text-sm">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard id="targets" title="3-Year Targets" subtitle="Year 1 infrastructure → Year 2 scale → Year 3 sustainability" icon={TrendingUp} iconColor="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" badges={[{ text: "$35M" }]}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { year: "Year 1", pct: 15, budget: "$13.7M", focus: "Infrastructure + pilot neighborhoods", targets: ["Deploy in 3 highest-need tracts per county", "Train 15 CHWs across 5 counties", "Register 10 new coalition partners", "Screen 100,000 residents", "Enroll 35,000 in new benefits"] },
                  { year: "Year 2", pct: 35, budget: "$18.2M", focus: "Scale across all 5 counties", targets: ["Expand to all high-need tracts", "Train 35 CHWs total", "25 active coalition partners", "Screen 250,000 residents", "Enroll 100,000 in new benefits"] },
                  { year: "Year 3", pct: 50, budget: "$14M", focus: "Full coverage + sustainability", targets: ["All 501 tracts active", "50 CHWs trained and deployed", "Self-sustaining partner network", "Screen 400,000+ residents", "Enroll 150,000+ in new benefits"] },
                ].map(y => (
                  <Card key={y.year} className="border-2">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{y.year}</h3>
                        <Badge>{y.budget}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{y.focus}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={y.pct} className="flex-1 h-3" />
                        <span className="text-sm font-bold">{y.pct}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Close {y.pct}% of enrollment gap</p>
                      <div className="space-y-1.5">
                        {y.targets.map(t => (
                          <p key={t} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /> {t}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ExpandableCard>

            <ExpandableCard id="why" title="Why This Matters" subtitle="Better enrollment = better health = better outcomes for everyone" icon={Heart} iconColor="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" badges={[{ text: "We All Benefit" }]}>
              <div className="space-y-3">
                <p className="text-muted-foreground text-base leading-relaxed">
                  We saw this with criminal justice reform — when you connect the right intervention to the right person at the right time, outcomes change.
                  A family that gets SNAP, Medicaid, and EITC together doesn't just eat better. They make fewer ER visits. Their kids do better in school.
                  Their stress goes down. They can plan ahead instead of just surviving.
                </p>
                <p className="text-muted-foreground text-base leading-relaxed font-medium">
                  That's not just good for them. That's good for all of us. That's why it's called <strong>We All Benefit</strong>.
                </p>
              </div>
            </ExpandableCard>
          </TabsContent>

          <TabsContent value="counties" className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Every neighborhood is different. Select a county to see the real data, existing partners, gaps that need filling, and AI-powered insights.
            </p>
            {counties.map((county: any) => (
              <ExpandableCard key={county.fips} id={`county-${county.fips}`}
                title={county.name}
                subtitle={`Pop. ${(county.population || 0).toLocaleString()} · ${county.enrollmentRate}% enrolled · ${county.tractCount} neighborhoods`}
                icon={MapPin}
                iconColor={county.enrollmentRate < 57 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : county.enrollmentRate < 60 ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"}
                badges={[
                  { text: `${(county.gap || 0).toLocaleString()} gap`, variant: "destructive" as const },
                  { text: county.strategy === "build" ? "Build Capacity" : "Strengthen" },
                ]}>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Eligible", value: (county.eligible || 0).toLocaleString(), color: "text-blue-600" },
                      { label: "Enrolled", value: (county.enrolled || 0).toLocaleString(), color: "text-green-600" },
                      { label: "Gap", value: (county.gap || 0).toLocaleString(), color: "text-red-600" },
                      { label: "Barrier Index", value: String(county.avgBarrierIndex || 0), color: "text-orange-600" },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground uppercase">Poverty Rate</p>
                      <p className="font-bold">{Math.round(county.povertyRate || 0)}%</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground uppercase">High-Need Areas</p>
                      <p className="font-bold text-red-600">{county.highNeedTracts} of {county.tractCount}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground uppercase">Existing Partners</p>
                      <p className="font-bold text-purple-600">{county.facilitatorCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground uppercase">Strategy</p>
                      <p className="font-bold">{county.strategy === "build" ? "Build" : "Strengthen"}</p>
                    </div>
                  </div>

                  {county.facilitators?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Existing Partners</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {county.facilitators.map((f: any) => (
                          <div key={f.name} className="flex items-start gap-3 p-3 rounded-xl border bg-green-50/30 dark:bg-green-950/10">
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{f.type}</p>
                              <div className="flex gap-1 flex-wrap mt-1">
                                {f.services?.slice(0, 4).map((s: string) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rolesNeeded.filter((r: any) => r.county === county.name).length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Partners Needed</h4>
                      <div className="space-y-2">
                        {rolesNeeded.filter((r: any) => r.county === county.name).map((r: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/10">
                            <Star className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-sm">{r.role}</p>
                              <p className="text-sm text-muted-foreground">{r.description}</p>
                              <Button size="sm" variant="outline" className="mt-2" onClick={() => { setJoinData({...joinData, county: county.name}); setActiveTab("join"); }}>
                                <HandHeart className="h-3 w-3 mr-1" /> Fill this role
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <AIInsightPanel countyFips={county.fips} countyName={county.name} />
                </div>
              </ExpandableCard>
            ))}
          </TabsContent>

          <TabsContent value="coalition" className="space-y-4">
            <ExpandableCard id="lead" title={coalition.lead?.name || "TCAF"} subtitle={coalition.lead?.role || "Coalition Lead"} icon={Landmark} iconColor="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" badges={[{ text: "501(c)(3)" }, { text: "Coalition Lead" }]} defaultOpen>
              <div className="space-y-3">
                <p className="text-muted-foreground">{coalition.lead?.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">EIN: {coalition.lead?.ein}</Badge>
                  <Badge variant="outline"><Shield className="h-3 w-3 mr-1" /> Veteran-Founded</Badge>
                  <Badge variant="outline"><Heart className="h-3 w-3 mr-1" /> Black-Led</Badge>
                  <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" /> Williamson County</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p><strong>Three entities work as one:</strong></p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>TCAF (EIN 41-3618003) — Grants, nonprofit operations, community relationships</li>
                    <li>CIP LLC (EIN 41-4996540) — Technology development, AI, data engineering</li>
                    <li>M&T Consulting (EIN 41-4952178) — Staffing, payroll, CHW employment</li>
                  </ul>
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard id="structure" title="Coalition Structure" subtitle="A big tent — many organizations, one shared mission" icon={Network} iconColor="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" badges={[{ text: `${overview.totalPartners || 0} partners` }]}>
              <div className="space-y-4">
                {coalition.partnerTiers?.map((tier: any) => (
                  <div key={tier.tier} className="p-5 rounded-xl border-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base">{tier.tier}</h4>
                      <Badge variant={tier.current >= tier.target ? "default" : "secondary"}>
                        {tier.current} of {tier.target} target
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                    <Progress value={(tier.current / tier.target) * 100} className="h-3" />
                  </div>
                ))}
              </div>
            </ExpandableCard>

            <ExpandableCard id="hhsc" title="HHSC Community Partner Program" subtitle="State certification pathway — Levels 1-3" icon={BookOpen} iconColor="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" badges={[{ text: "CPP" }]}>
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  The Texas HHSC Community Partner Program enables organizations to officially assist with benefits applications. Coalition members can enter at any level — start where you are, grow from there.
                </p>
                {[
                  { level: "1", name: "Community Partner", hours: "4 hours online", desc: "Refer community members, distribute benefits information, host HHSC outreach events", color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" },
                  { level: "2", name: "Certified Application Assister", hours: "16 hours training", desc: "Help complete applications for SNAP, Medicaid, CHIP, TANF. Access HHSC portal for tracking.", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" },
                  { level: "3", name: "Certified Enrollment Counselor", hours: "40 hours + supervised practice", desc: "Full HHSC system access. Process applications end-to-end. Handle complex cases and appeals.", color: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800" },
                ].map(l => (
                  <div key={l.level} className={`p-4 rounded-xl border ${l.color}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge>Level {l.level}</Badge>
                      <h4 className="font-bold">{l.name}</h4>
                      <Badge variant="outline" className="ml-auto">{l.hours}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{l.desc}</p>
                  </div>
                ))}
                <a href="https://www.hhs.texas.gov/about/community-engagement" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                  Register at HHSC <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </ExpandableCard>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <ExpandableCard id="methodology" title="Data Methodology" subtitle="Real Census data. Transparent methodology. Neighborhood-level precision." icon={BarChart3} iconColor="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" badges={[{ text: "Census ACS" }]} defaultOpen>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-bold text-sm mb-1">Primary Source</h4>
                  <p className="text-sm text-muted-foreground">{methodology.source}</p>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-2">Census Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {methodology.variables?.map((v: string) => (
                      <div key={v} className="flex items-center gap-2 text-sm p-2 rounded-lg border"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /><span>{v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-950/10 border border-green-200 dark:border-green-800">
                  <h4 className="font-bold text-sm mb-1">Why Neighborhood Level?</h4>
                  <p className="text-sm text-muted-foreground">{methodology.tractLevel}</p>
                </div>
                <p className="text-sm text-muted-foreground">{methodology.methodology}</p>
              </div>
            </ExpandableCard>

            <ExpandableCard id="barriers" title="Barrier Index Methodology" subtitle="5 dimensions weighted to predict enrollment difficulty" icon={Activity} iconColor="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" badges={[{ text: "0-100 scale" }]}>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Each neighborhood gets a weighted barrier score predicting how hard it is to reach and enroll people:</p>
                {[
                  { name: "Limited English Proficiency", weight: 25, variable: "B16004", desc: "Population speaking English less than 'very well' — drives need for bilingual CHWs and translated materials" },
                  { name: "No Vehicle Access", weight: 20, variable: "B08141", desc: "Workers with no vehicle — proxy for transportation barriers to application offices" },
                  { name: "No Broadband Access", weight: 20, variable: "B28002", desc: "Households without internet — limits online applications, requires paper/phone alternatives" },
                  { name: "Immigration Status Anxiety", weight: 15, variable: "B05001", desc: "Non-citizen population — proxy for fear, trust barriers, mixed-status families avoiding system contact" },
                  { name: "Poverty Concentration", weight: 20, variable: "B17001", desc: "Population below federal poverty level — time poverty, stress, competing survival needs" },
                ].map(b => (
                  <div key={b.name} className="p-4 rounded-xl border">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-base font-bold">{b.weight}%</Badge>
                      <h4 className="font-bold text-sm">{b.name}</h4>
                      <Badge variant="outline" className="text-[10px] ml-auto">{b.variable}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          </TabsContent>

          <TabsContent value="join" className="space-y-4">
            <Card className="border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
              <CardContent className="pt-6 text-center space-y-3">
                <HandHeart className="h-14 w-14 mx-auto text-green-600" />
                <h2 className="text-2xl font-bold">Join the We All Benefit Coalition</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Health clinic, food bank, faith community, school district, government agency — if you serve people in our 5 counties, there's a role for you. We'll show you exactly where you fit.
                </p>
              </CardContent>
            </Card>

            <ExpandableCard id="what-partners-do" title="What Coalition Partners Do" subtitle="6 ways to participate — pick what fits your capacity" icon={Users} iconColor="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { role: "Host enrollment events", desc: "Open your space for benefits screening days. We bring the navigators, the tech, and the outreach — you bring the community trust.", icon: Building2 },
                  { role: "Refer community members", desc: "When you see someone struggling, send them to a 3-minute screening. We handle enrollment, follow-up, and renewals.", icon: ArrowRight },
                  { role: "Provide navigation", desc: "Your staff uses our screening tool during intakes — 9 programs checked at once. We train you and provide ongoing support.", icon: UserCheck },
                  { role: "Share local knowledge", desc: "You know your neighborhood. Tell us which blocks need what, and we target accordingly. Your intel makes the data come alive.", icon: MapPin },
                  { role: "Co-brand outreach", desc: "Your trusted name on our materials opens doors we can't open alone. Community trust is the most valuable asset.", icon: HandHeart },
                  { role: "Track outcomes together", desc: "See real-time impact — how many people you've helped enroll, dollars brought into your community, barriers removed.", icon: BarChart3 },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.role} className="p-4 rounded-xl border hover:shadow-md transition-shadow">
                      <Icon className="h-6 w-6 text-primary mb-2" />
                      <p className="font-bold text-sm mb-1">{item.role}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </ExpandableCard>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Express Interest</CardTitle>
                <CardDescription>Fill this out and we'll show you exactly where you fit — plus we'll be in touch within 48 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Organization Name</Label><Input value={joinData.name} onChange={e => setJoinData({...joinData, name: e.target.value})} placeholder="Your organization" data-testid="input-org-name" /></div>
                  <div>
                    <Label>Organization Type</Label>
                    <Select value={joinData.organizationType} onValueChange={v => setJoinData({...joinData, organizationType: v})}>
                      <SelectTrigger data-testid="select-org-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {["Nonprofit", "FQHC / Health Center", "Food Bank / Pantry", "Faith Community", "School / ISD", "Government Agency", "Community Action Agency", "Health Plan", "Foundation", "Community Organization", "Other"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Primary County</Label>
                  <Select value={joinData.county} onValueChange={v => setJoinData({...joinData, county: v})}>
                    <SelectTrigger data-testid="select-join-county"><SelectValue placeholder="Select county" /></SelectTrigger>
                    <SelectContent>
                      {["Travis County", "Williamson County", "Hays County", "Bastrop County", "Caldwell County"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Contact Name</Label><Input value={joinData.contactName} onChange={e => setJoinData({...joinData, contactName: e.target.value})} placeholder="Your name" data-testid="input-contact-name" /></div>
                  <div><Label>Email</Label><Input value={joinData.contactEmail} onChange={e => setJoinData({...joinData, contactEmail: e.target.value})} placeholder="email@org.com" data-testid="input-contact-email" /></div>
                  <div><Label>Phone</Label><Input value={joinData.contactPhone} onChange={e => setJoinData({...joinData, contactPhone: e.target.value})} placeholder="(512) 555-0000" data-testid="input-contact-phone" /></div>
                </div>
                <div><Label>Services you provide</Label><Input value={joinData.servicesOffered} onChange={e => setJoinData({...joinData, servicesOffered: e.target.value})} placeholder="e.g., SNAP enrollment, health navigation, food distribution" data-testid="input-services" /></div>
                <div><Label>Anything else?</Label><Textarea value={joinData.notes} onChange={e => setJoinData({...joinData, notes: e.target.value})} placeholder="Tell us about your organization" data-testid="input-notes" /></div>

                <div className="flex gap-3">
                  {joinData.name && joinData.organizationType && joinData.county && (
                    <Button variant="outline" onClick={() => collabMatchMutation.mutate()} disabled={collabMatchMutation.isPending} data-testid="button-see-fit">
                      {collabMatchMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                      Show Me Where I Fit
                    </Button>
                  )}
                  <Button onClick={() => joinMutation.mutate()} disabled={!joinData.name || !joinData.organizationType || !joinData.county || !joinData.contactEmail || joinMutation.isPending} className="flex-1" size="lg" data-testid="button-submit-join">
                    {joinMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><HandHeart className="h-4 w-4 mr-2" /> Join the Coalition</>}
                  </Button>
                </div>

                {collabMatchMutation.data?.match && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 space-y-4" data-testid="collab-match-result">
                    <div className="flex items-center gap-3">
                      <Brain className="h-6 w-6 text-purple-600" />
                      <div>
                        <h3 className="font-bold">{collabMatchMutation.data.match.roleTitle}</h3>
                        <p className="text-sm text-muted-foreground">{collabMatchMutation.data.match.whyYouMatter}</p>
                      </div>
                      <Badge className="ml-auto shrink-0">{collabMatchMutation.data.match.fitScore}% fit</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><h4 className="font-bold text-sm mb-2">Gaps You Fill</h4>{collabMatchMutation.data.match.specificGapsYouFill?.map((g: string) => <p key={g} className="text-xs flex items-start gap-1.5 mb-1"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /> {g}</p>)}</div>
                      <div><h4 className="font-bold text-sm mb-2">You'd Work Alongside</h4>{collabMatchMutation.data.match.workAlongside?.map((o: string) => <p key={o} className="text-xs flex items-start gap-1.5 mb-1"><Users className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" /> {o}</p>)}</div>
                    </div>
                    <div><h4 className="font-bold text-sm mb-2">Your First 90 Days</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { label: "First 30 Days", items: collabMatchMutation.data.match.first30Days },
                          { label: "Days 30-60", items: collabMatchMutation.data.match.first60Days },
                          { label: "Days 60-90", items: collabMatchMutation.data.match.first90Days },
                        ].map(phase => (
                          <div key={phase.label} className="p-3 rounded-lg border bg-white dark:bg-background">
                            <p className="font-bold text-xs mb-1">{phase.label}</p>
                            {phase.items?.map((item: string) => <p key={item} className="text-[11px] text-muted-foreground flex items-start gap-1 mb-0.5"><ChevronRight className="h-3 w-3 shrink-0 mt-0.5" /> {item}</p>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4 text-center space-y-2">
                <p className="text-sm font-medium">Questions? Reach out directly:</p>
                <a href="mailto:president@thecollaborativeadvocate.org" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Mail className="h-4 w-4" /> president@thecollaborativeadvocate.org</a>
                <p className="text-xs text-muted-foreground">The Collaborative Advocate Foundation · 501(c)(3) · EIN 41-3618003<br />17912 Stefano Drive, Pflugerville, TX 78660 · Williamson County</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card className="border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardContent className="pt-6 text-center space-y-4">
                <FileText className="h-14 w-14 mx-auto text-blue-600" />
                <h2 className="text-2xl font-bold">Executive Summary Generator</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Generate a comprehensive executive summary using AI and real Census data from all 5 counties and {overview.totalTracts || 501} neighborhoods.
                  This document is designed to share with coalition partners, Meredith, and potential collaborators.
                </p>
                <Button onClick={() => execSummaryMutation.mutate()} disabled={execSummaryMutation.isPending} size="lg" data-testid="button-generate-summary">
                  {execSummaryMutation.isPending ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating with AI (this takes ~30 seconds)...</>
                  ) : execSummaryMutation.data ? (
                    <><Sparkles className="h-5 w-5 mr-2" /> Regenerate Executive Summary</>
                  ) : (
                    <><Brain className="h-5 w-5 mr-2" /> Generate Executive Summary</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {execSummaryMutation.data?.summary && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Executive Summary</CardTitle>
                      <CardDescription>Generated {new Date(execSummaryMutation.data.generatedAt).toLocaleString()} · Data: {execSummaryMutation.data.dataSnapshot?.totalEligible?.toLocaleString()} eligible across {execSummaryMutation.data.dataSnapshot?.tracts} tracts</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(execSummaryMutation.data.summary); toast({ title: "Copied!", description: "Executive summary copied to clipboard." }); }} data-testid="button-copy-summary">
                        <FileText className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-summary">
                        <Printer className="h-3 w-3 mr-1" /> Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="exec-summary-content">
                    <div className="whitespace-pre-wrap">{execSummaryMutation.data.summary}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sdoh" className="space-y-4">
            <SDOHImpactChain />
          </TabsContent>
        </Tabs>

        <DFCCrossNav currentPage="coalition" />
      </div>
    </div>
  );
}
