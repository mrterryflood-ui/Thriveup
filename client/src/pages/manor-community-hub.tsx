import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import {
  Home, Users, Briefcase, Heart, Shield, Building2,
  TrendingUp, MapPin, Globe, ArrowRight, CheckCircle2,
  AlertTriangle, Target, Brain, Award, Star,
  GraduationCap, Stethoscope, Baby, UserCheck,
  Printer, Share2, ExternalLink, ChevronRight,
  BarChart3, Landmark, DollarSign, Clock, Zap,
  Mic, Sparkles, Play, Radio, School, Wifi,
  TreePine, Hammer, Truck, ShieldCheck, HandHeart,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { TrainingGuideButton } from "@/components/training-guide";

const MANOR_STATS = [
  { icon: Users, label: "Population", value: "16,300+", color: "bg-teal-500", detail: "Fastest-growing corridor in TX" },
  { icon: TrendingUp, label: "Growth Rate", value: "89%", color: "bg-emerald-500", detail: "Population growth 2010–2023" },
  { icon: Home, label: "Median Home", value: "$310K", color: "bg-blue-500", detail: "More affordable than Austin ($435K)" },
  { icon: Users, label: "Hispanic/Latino", value: "52%", color: "bg-amber-500", detail: "Majority-minority community" },
  { icon: DollarSign, label: "Median Income", value: "$68,900", color: "bg-purple-500", detail: "Below Austin metro average" },
  { icon: School, label: "Manor ISD", value: "10,500+", color: "bg-indigo-500", detail: "Students across 16 campuses" },
  { icon: Briefcase, label: "Commute", value: "78%", color: "bg-rose-500", detail: "Residents work outside Manor" },
  { icon: AlertTriangle, label: "Service Gap", value: "Critical", color: "bg-red-500", detail: "Zero comprehensive social infra" },
];

const MANOR_NEEDS_ASSESSMENT = [
  {
    category: "Workforce & Economic Development",
    severity: "critical",
    findings: [
      "78% of Manor residents commute outside city limits for work — $4,200/yr avg commute cost",
      "No local workforce development center or career training facility",
      "I-35 corridor construction creating 15,000+ jobs — Manor residents lack pathways to access them",
      "Small business ecosystem underdeveloped — only 340 registered businesses for 16,000+ residents",
      "Youth unemployment (16-24) estimated at 18% — no local internship or apprenticeship pipeline",
    ],
    platforms: ["Mission Transition", "MCE", "Collaborative Advocate", "ThriveUp Academy"],
    solutions: [
      "Mobile workforce hub — career assessments, resume building, interview prep",
      "I-35 Construction Career Pathway — CDL, heavy equipment, safety certifications",
      "Small Business Accelerator — SBA 8(a), HUBZone, WOSB certification support",
      "Manor Youth Employment Pipeline — partner with Manor ISD for work-based learning",
    ],
  },
  {
    category: "Housing Stability",
    severity: "high",
    findings: [
      "Median home price $310K — requiring $77K+ household income to afford",
      "43% of renters are cost-burdened (paying >30% of income on housing)",
      "Limited affordable housing stock — only 2 dedicated affordable developments",
      "No local housing navigation or rental assistance coordination",
      "Growing displacement pressure as Austin expands eastward into Manor",
    ],
    platforms: ["LifeBridge", "M2C Transition"],
    solutions: [
      "Housing Resource Navigator — connect residents to HACA, Section 8, TDHCA programs",
      "First-time homebuyer pathway — down payment assistance, credit building",
      "Anti-displacement strategy — community land trust exploration",
      "Emergency rental assistance coordination with Travis County CDBG",
    ],
  },
  {
    category: "Health & Wellness",
    severity: "high",
    findings: [
      "No hospital within city limits — nearest ER is 15+ miles (Dell Seton, St. David's)",
      "One community health clinic serving 16,000+ residents",
      "Mental health provider shortage — 1 provider per 4,100 residents (vs. 1:350 recommended)",
      "Diabetes prevalence 14.2% — 40% above state average",
      "Maternal health desert — zero OB/GYN within city limits",
    ],
    platforms: ["Whole-Person Health", "Sankofa Health", "Black Maternal Health", "PillScheduler"],
    solutions: [
      "Telehealth bridge — PHQ-9, GAD-7 screenings via platform, warm handoff to providers",
      "Community Health Worker deployment — culturally responsive, bilingual",
      "Medication adherence program — PillScheduler for chronic disease management",
      "Maternal health mobile unit coordination — prenatal, postpartum support",
    ],
  },
  {
    category: "Youth & Education",
    severity: "high",
    findings: [
      "Manor ISD graduation rate: 87% — below state average of 90%",
      "40% of students economically disadvantaged",
      "Limited after-school programming — gaps in STEM, arts, career exploration",
      "No dedicated youth mental health resources in schools",
      "College-going rate declining — 52% to 47% over 3 years",
    ],
    platforms: ["ISSS", "WholeMind Learning", "Perfectly Different", "ThriveUp Academy"],
    solutions: [
      "School-based wraparound services — ISSS model deployment in Manor ISD",
      "After-school STEM + career exploration — aligned with I-35 workforce needs",
      "Youth mental health first aid — train teachers and counselors",
      "College & career readiness pipeline — dual credit, certifications, internships",
    ],
  },
  {
    category: "Digital Infrastructure & Access",
    severity: "moderate",
    findings: [
      "Broadband coverage gaps in rural Manor outskirts",
      "23% of households lack reliable internet access",
      "No public computer lab or digital literacy center",
      "City using ESRI for 3rd Spaces mapping — opportunity for data integration",
      "Limited digital government services — most require in-person Austin trips",
    ],
    platforms: ["Shield Atlas", "Ecosystem Nexus", "Video Creator AI"],
    solutions: [
      "Digital inclusion initiative — partner with city on broadband expansion",
      "Community tech hub — computer access, digital literacy training",
      "ESRI integration — overlay ThriveUp ecosystem data on city's 3rd Spaces map",
      "Virtual service delivery — reduce need for Austin trips via telehealth/tele-services",
    ],
  },
];

const MANOR_PARTNERSHIPS = [
  { name: "City of Manor", contact: "Communications & Technology Teams", status: "Active conversation", type: "Government", priority: "immediate" },
  { name: "Manor ISD", contact: "Family Resource Center", status: "Partnership ready", type: "Education", priority: "immediate" },
  { name: "Manor Economic Dev Corp", contact: "Director", status: "Discovery", type: "Economic Dev", priority: "high" },
  { name: "PCDC (Pflugerville)", contact: "Jerry W. Jones Jr.", status: "Cross-regional partner", type: "Economic Dev", priority: "high" },
  { name: "Travis County", contact: "CDBG Office", status: "Survey deadline March 31", type: "Government", priority: "urgent" },
  { name: "CommUnity Care", contact: "Manor Health Center", status: "Service partner", type: "Health", priority: "high" },
  { name: "St. David's Foundation", contact: "Community Health Fund", status: "Opens March 30", type: "Funder", priority: "immediate" },
  { name: "Capital Area Council of Govts", contact: "Regional Planning", status: "Planning partner", type: "Government", priority: "moderate" },
];

const MANOR_OPPORTUNITIES = [
  { title: "Manor Community Impact Grant", amount: "$25K–$100K", source: "City of Manor", deadline: "Rolling", type: "Municipal" },
  { title: "Travis County CDBG", amount: "Up to $500K", source: "HUD via Travis County", deadline: "March 31 Survey", type: "Federal" },
  { title: "St. David's Foundation", amount: "Up to $1M", source: "St. David's", deadline: "Opens March 30", type: "Foundation" },
  { title: "TWC Skills Development Fund", amount: "$150K matching", source: "Texas Workforce Commission", deadline: "Rolling", type: "State" },
  { title: "USDA Rural Development", amount: "$50K–$500K", source: "USDA", deadline: "Rolling", type: "Federal" },
  { title: "21st Century Community Learning", amount: "$200K–$500K", source: "TEA", deadline: "Annual", type: "Education" },
  { title: "TxDOT On-the-Job Training", amount: "Varies", source: "TxDOT", deadline: "Per project", type: "Workforce" },
  { title: "EPA Environmental Justice Grant", amount: "$150K–$1M", source: "EPA", deadline: "Annual", type: "Federal" },
];

const ECOSYSTEM_FOR_MANOR = [
  { platform: "LifeBridge", role: "Housing navigation & resource finder", manorFocus: "Connect residents to HACA, TDHCA, emergency rental assistance", icon: Home, color: "bg-blue-500" },
  { platform: "Mission Transition", role: "Career pathways & workforce", manorFocus: "I-35 construction careers, CDL training, apprenticeships", icon: Briefcase, color: "bg-emerald-500" },
  { platform: "MCE", role: "Business development", manorFocus: "Manor small business accelerator, SBA certifications", icon: Building2, color: "bg-purple-500" },
  { platform: "Whole-Person Health", role: "Health screenings", manorFocus: "Telehealth bridge for health desert, PHQ-9/GAD-7", icon: Stethoscope, color: "bg-rose-500" },
  { platform: "ISSS", role: "School wraparound", manorFocus: "Manor ISD deployment, after-school programs", icon: School, color: "bg-indigo-500" },
  { platform: "WholeMind Learning", role: "Adaptive education", manorFocus: "STAAR prep, college readiness, career exploration", icon: GraduationCap, color: "bg-violet-500" },
  { platform: "Sankofa Health", role: "Culturally responsive care", manorFocus: "Bilingual health content for 52% Hispanic community", icon: Heart, color: "bg-pink-500" },
  { platform: "Video Creator AI", role: "Content production", manorFocus: "Manor community stories → Roku channel content", icon: Play, color: "bg-amber-500" },
  { platform: "RPLICE", role: "Quality & research", manorFocus: "Outcome tracking, grant compliance, evidence base", icon: Brain, color: "bg-slate-500" },
  { platform: "Voices of Austin", role: "Community storytelling", manorFocus: "Manor-specific story collection and needs intelligence", icon: Mic, color: "bg-orange-500" },
];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return <Badge className={`text-xs ${colors[severity] || ""}`}>{severity.toUpperCase()}</Badge>;
}

export default function ManorCommunityHubPage() {
  const [activeTab, setActiveTab] = useState("assessment");

  useEffect(() => {
    document.title = "Manor Community Hub | ThriveUp Academy";
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="manor-community-hub-page">
      <PageHeader
        title="Built for Manor"
        description="Right tools. Right community. Right time. 24 platforms adapted for Manor's unique context."
        actions={
          <div className="flex gap-2 flex-wrap">
            <TrainingGuideButton moduleId="manor-community-hub" />
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/austin"} data-testid="button-austin-link">
              <MapPin className="h-4 w-4 mr-1" /> Austin Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/pflugerville"} data-testid="button-pflugerville-link">
              <MapPin className="h-4 w-4 mr-1" /> Pflugerville Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-manor">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-emerald-700 to-green-800 text-white p-8 md:p-12" data-testid="hero-manor">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-teal-300 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-green-300 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <Badge className="bg-white/20 text-white border-white/30 mb-4" data-testid="badge-manor">
            <TreePine className="h-3 w-3 mr-1" /> Manor, Texas — Community Hub
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Improving How Residents Navigate Services
          </h1>
          <p className="text-xl text-teal-100 mb-3">
            A digital and media-based approach that acts as a front door — helping Manor residents
            understand exactly what they need, where to go, and how to take action.
          </p>
          <p className="text-lg text-teal-200 mb-6">
            It reduces confusion, increases utilization, and helps the City's investments go further.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1"><Users className="h-3.5 w-3.5 mr-1" /> 16,300+ Residents</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Globe className="h-3.5 w-3.5 mr-1" /> 24 Platforms</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Wifi className="h-3.5 w-3.5 mr-1" /> ESRI Compatible</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><HandHeart className="h-3.5 w-3.5 mr-1" /> Community-Driven</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MANOR_STATS.map((stat) => (
          <Card key={stat.label} className="text-center hover:shadow-lg transition-shadow" data-testid={`stat-manor-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="pt-5 pb-4">
              <div className={`mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-sm font-medium">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-l-4 border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/20" data-testid="card-manor-knockout">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold mb-2">The Manor Opportunity</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Manor is the fastest-growing community in the Austin metro — 89% population growth since 2010.
                But growth without social infrastructure creates gaps. 78% of residents leave Manor to work.
                There's no workforce center, no hospital, one health clinic for 16,000+ people, and critical
                gaps in youth services. The infrastructure exists in Austin — but Manor residents can't reach it.
              </p>
              <p className="font-semibold text-teal-700 dark:text-teal-400">
                We don't bring residents to services. We bring services to residents — digitally, immediately, and in their language.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-manor">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="assessment" className="text-xs md:text-sm" data-testid="tab-manor-assessment">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Needs Assessment
          </TabsTrigger>
          <TabsTrigger value="ecosystem" className="text-xs md:text-sm" data-testid="tab-manor-ecosystem">
            <Globe className="h-3.5 w-3.5 mr-1" /> Ecosystem Fit
          </TabsTrigger>
          <TabsTrigger value="partnerships" className="text-xs md:text-sm" data-testid="tab-manor-partnerships">
            <HandHeart className="h-3.5 w-3.5 mr-1" /> Partnerships
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="text-xs md:text-sm" data-testid="tab-manor-opportunities">
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Funding
          </TabsTrigger>
          <TabsTrigger value="interconnect" className="text-xs md:text-sm" data-testid="tab-manor-interconnect">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Regional Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="mt-6 space-y-6" data-testid="content-manor-assessment">
          <div>
            <h2 className="text-2xl font-bold mb-2">Manor Community Needs Assessment</h2>
            <p className="text-muted-foreground mb-6">
              Comprehensive gap analysis across 5 domains — with specific solutions mapped to ThriveUp ecosystem platforms.
            </p>
          </div>

          {MANOR_NEEDS_ASSESSMENT.map((domain) => (
            <Card key={domain.category} className="overflow-hidden" data-testid={`card-assessment-${domain.category.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">{domain.category}</CardTitle>
                  <SeverityBadge severity={domain.severity} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Key Findings
                  </h4>
                  <ul className="space-y-1.5">
                    {domain.findings.map((finding, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-red-400" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ThriveUp Solutions
                  </h4>
                  <ul className="space-y-1.5">
                    {domain.solutions.map((solution, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  <span className="text-xs text-muted-foreground mr-2">Platforms:</span>
                  {domain.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ecosystem" className="mt-6 space-y-6" data-testid="content-manor-ecosystem">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ecosystem Adapted for Manor</h2>
            <p className="text-muted-foreground mb-6">
              Same 24-platform infrastructure — customized for Manor's demographics, geography, and needs.
              Every platform has a Manor-specific deployment strategy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ECOSYSTEM_FOR_MANOR.map((item) => (
              <Card key={item.platform} className="hover:shadow-md transition-shadow" data-testid={`card-eco-${item.platform.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{item.platform}</span>
                        <Badge variant="outline" className="text-xs">{item.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.manorFocus}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-teal-200 dark:border-teal-800" data-testid="card-esri-integration">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-600" /> ESRI 3rd Spaces Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manor already uses ESRI for 3rd Spaces mapping. ThriveUp's ecosystem data layers directly
                into their existing GIS infrastructure — no rip and replace, pure enhancement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-black/20">
                  <h4 className="font-semibold text-sm mb-1">Story Heat Maps</h4>
                  <p className="text-xs text-muted-foreground">Community stories geolocated by neighborhood — shows where needs concentrate</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-black/20">
                  <h4 className="font-semibold text-sm mb-1">Resource Overlays</h4>
                  <p className="text-xs text-muted-foreground">Available services, gaps, and coverage areas layered on city maps</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-black/20">
                  <h4 className="font-semibold text-sm mb-1">Outcome Tracking</h4>
                  <p className="text-xs text-muted-foreground">Geographic view of service utilization, referral completion, and impact</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partnerships" className="mt-6 space-y-6" data-testid="content-manor-partnerships">
          <div>
            <h2 className="text-2xl font-bold mb-2">Partnership Pipeline</h2>
            <p className="text-muted-foreground mb-6">Active and target partnerships for Manor deployment.</p>
          </div>

          <div className="space-y-3">
            {MANOR_PARTNERSHIPS.map((partner) => (
              <Card key={partner.name} className="hover:shadow-md transition-shadow" data-testid={`card-partner-${partner.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">{partner.name}</span>
                        <Badge variant="outline" className="text-xs">{partner.type}</Badge>
                        <Badge className={`text-xs ${
                          partner.priority === "immediate" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          partner.priority === "urgent" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          partner.priority === "high" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>{partner.priority}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{partner.contact}</span> — {partner.status}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-6 space-y-6" data-testid="content-manor-opportunities">
          <div>
            <h2 className="text-2xl font-bold mb-2">Manor Funding Pipeline</h2>
            <p className="text-muted-foreground mb-6">Grants and funding aligned with Manor community needs.</p>
          </div>

          <div className="space-y-3">
            {MANOR_OPPORTUNITIES.map((opp) => (
              <Card key={opp.title} className="hover:shadow-md transition-shadow" data-testid={`card-fund-${opp.title.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">{opp.title}</h4>
                        <Badge variant="outline" className="text-xs">{opp.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opp.source}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{opp.amount}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {opp.deadline}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interconnect" className="mt-6 space-y-6" data-testid="content-manor-interconnect">
          <div>
            <h2 className="text-2xl font-bold mb-2">Regional Network</h2>
            <p className="text-muted-foreground mb-6">
              Manor doesn't operate in isolation. Three regional hubs share the same 24-platform ecosystem —
              what strengthens one community strengthens all three.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-teal-500 bg-teal-50/30 dark:bg-teal-950/10" data-testid="card-region-manor">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <MapPin className="h-5 w-5" /> Manor
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-medium">Focus: Growth Without Gaps</p>
                <ul className="text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Workforce access (78% commute out)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Health desert (no hospital)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Youth pipeline (Manor ISD)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> ESRI 3rd Spaces integration</li>
                </ul>
                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">You are here</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/austin"} data-testid="card-region-austin">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <MapPin className="h-5 w-5" /> Austin
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-medium">Focus: Housing & Equity Crisis</p>
                <ul className="text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> $435K median home price</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 48,000+ unit affordable gap</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 3,238 homeless (PIT 2025)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 5 active grants ($3M+ pipeline)</li>
                </ul>
                <Badge variant="outline" className="text-xs">View Austin Hub <ArrowRight className="h-3 w-3 ml-1" /></Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/pflugerville"} data-testid="card-region-pflugerville">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                  <MapPin className="h-5 w-5" /> Pflugerville
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-medium">Focus: Infrastructure Before Growth</p>
                <ul className="text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 330 affordable units coming (2027)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> CDBG entitlement city</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> PCDC partnership ($150K+ grants)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Zero social infrastructure</li>
                </ul>
                <Badge variant="outline" className="text-xs">View Pflugerville Hub <ArrowRight className="h-3 w-3 ml-1" /></Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-teal-50 via-blue-50 to-violet-50 dark:from-teal-950/20 dark:via-blue-950/20 dark:to-violet-950/20" data-testid="card-shared-infrastructure">
            <CardHeader>
              <CardTitle>Shared Infrastructure — What Overlaps and Why It Matters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                All three regions share the same 24-platform ecosystem. This isn't redundancy — it's scale.
                A workforce training program that works in Manor also works in Pflugerville. Health screenings
                validated in Austin deploy identically in Manor. The evidence base grows with every region.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { label: "Shared Workforce Pipeline", detail: "I-35 corridor jobs serve all 3 regions", icon: Briefcase },
                  { label: "Shared Health Network", detail: "Telehealth bridge covers all health deserts", icon: Stethoscope },
                  { label: "Shared Content Channel", detail: "Roku/CTV stories from all communities", icon: Play },
                  { label: "Shared Evidence Base", detail: "RE-AIM/CFIR outcomes compound across sites", icon: Brain },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-white/60 dark:bg-black/20 text-center">
                    <item.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <h4 className="font-semibold text-xs mb-1">{item.label}</h4>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BackToTop />
    </div>
  );
}