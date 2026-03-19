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
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";

const AUSTIN_STATS = [
  { icon: Home, label: "Median Home Price", value: "$435,000", color: "bg-red-500", detail: "Only 2 of 75 zip codes affordable" },
  { icon: Users, label: "Homeless (PIT 2025)", value: "3,238", color: "bg-orange-500", detail: "Up 36% from 2023" },
  { icon: AlertTriangle, label: "Youth Homeless", value: "934", color: "bg-amber-500", detail: "Nearly quadrupled since 2020" },
  { icon: Shield, label: "Veterans Homeless", value: "13%", color: "bg-blue-500", detail: "Of all homeless individuals" },
  { icon: Briefcase, label: "Living Wage Gap", value: "12%", color: "bg-purple-500", detail: "Chance without credentials" },
  { icon: Heart, label: "Cost-Burdened Renters", value: "85%+", color: "bg-pink-500", detail: "ELI renters paying >50% income" },
  { icon: Building2, label: "Housing Units Needed", value: "48,000+", color: "bg-indigo-500", detail: "Below 30% AMI gap" },
  { icon: DollarSign, label: "Family Income Needed", value: "$95K", color: "bg-emerald-500", detail: "To afford median home" },
];

const ECOSYSTEM_PLATFORMS = [
  {
    category: "Housing Stability",
    color: "from-blue-500 to-blue-700",
    platforms: [
      { name: "LifeBridge", role: "Housing transitions, resource navigation, SDOH coordination", impact: "Front door for housing crisis" },
      { name: "M2C Transition", role: "Benefits enrollment, community connections", impact: "Day-to-day veteran & family support" },
    ],
  },
  {
    category: "Workforce Development",
    color: "from-emerald-500 to-emerald-700",
    platforms: [
      { name: "Mission Transition", role: "Career planning, identity transition", impact: "Military-to-civilian workforce" },
      { name: "MCE", role: "Minority business development, certifications", impact: "Job seekers → business owners" },
      { name: "Collaborative Advocate", role: "VOSB service delivery, consulting", impact: "Federal contracting pipeline" },
      { name: "Ecosystem Nexus", role: "Cross-platform coordination", impact: "Workforce tracking & outcomes" },
    ],
  },
  {
    category: "Health & Wellness",
    color: "from-rose-500 to-rose-700",
    platforms: [
      { name: "Whole-Person Health", role: "PHQ-9, GAD-7, C-SSRS screenings", impact: "Catches what ER visits miss" },
      { name: "Sankofa Health Network", role: "Culturally responsive health content", impact: "Addresses racial health disparities" },
      { name: "Black Maternal Health Network", role: "Perinatal & postpartum care", impact: "3x mortality rate crisis" },
      { name: "SafeCogniCare", role: "Cognitive health, TBI assessment", impact: "Veteran-specific care pathways" },
      { name: "PillScheduler", role: "Medication management & adherence", impact: "Prevents $300B annual waste" },
    ],
  },
  {
    category: "Youth & Education",
    color: "from-violet-500 to-violet-700",
    platforms: [
      { name: "ISSS", role: "School-based wraparound services", impact: "934 homeless youth need this" },
      { name: "WholeMind Learning", role: "Adaptive learning, SEL development", impact: "Living-wage career pathways" },
      { name: "Perfectly Different", role: "Neurodivergent support", impact: "1 in 5 children supported" },
    ],
  },
  {
    category: "Safety & Research",
    color: "from-slate-500 to-slate-700",
    platforms: [
      { name: "Shield Atlas", role: "Cybersecurity & data protection", impact: "Protects all platform data" },
      { name: "RPLICE / Better Science Lab", role: "Research validation, CFIR/RE-AIM", impact: "Evidence base that wins grants" },
      { name: "Video Creator AI", role: "AI video production & Roku ads", impact: "Every platform gets a public face" },
    ],
  },
];

const ST_DAVIDS_ALIGNMENT = [
  { priority: "Pathways to Economic Stability for Healthcare Workforce", pool: "$10.1M", platforms: "Mission Transition + MCE + Collaborative Advocate", icon: Briefcase },
  { priority: "Culturally Responsive Mental Health", pool: "$4.2M", platforms: "Sankofa Network + Whole-Person Health", icon: Heart },
  { priority: "Healthy Births, Healthy Communities", pool: "$7.3M", platforms: "Black Maternal Health Network + Sankofa Feminine Health", icon: Baby },
  { priority: "Community-Driven Change", pool: "$9.1M", platforms: "All 20 platforms engage communities in decision-making", icon: Users },
  { priority: "Housing + Health", pool: "$10M+", platforms: "LifeBridge + M2C + Workforce platforms", icon: Home },
  { priority: "Safety Net Clinics", pool: "Core", platforms: "Whole-Person Health screenings for uninsured", icon: Stethoscope },
];

const GRANT_PIPELINE = [
  { name: "DFC Grant", amount: "$625,000", deadline: "April 14, 2026", status: "preparing", entity: "ThriveUp Academy" },
  { name: "St. David's Foundation", amount: "Up to $1M", deadline: "Opens March 30, 2026", status: "priority", entity: "ThriveUp Academy" },
  { name: "WIOA Workforce", amount: "$200K–$500K", deadline: "Rolling", status: "active", entity: "ThriveUp Academy" },
  { name: "Foundation Grants", amount: "$100K–$500K", deadline: "Rolling LOI", status: "active", entity: "ThriveUp Academy" },
  { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12–18, 2026", status: "upcoming", entity: "ThriveUp Academy" },
  { name: "Pflugerville PCDC Community Grant", amount: "$150K+", deadline: "Rolling", status: "discovery", entity: "ThriveUp Academy" },
  { name: "Travis County CDBG", amount: "TBD", deadline: "March 31, 2026 Survey", status: "discovery", entity: "ThriveUp Academy" },
];

const OUTCOMES = [
  { metric: "Individuals Served", target: "5,000+", icon: Users },
  { metric: "Health Screenings", target: "2,000+", icon: Stethoscope },
  { metric: "Workforce Placements", target: "500+", icon: Briefcase },
  { metric: "Housing Stability", target: "300+ families", icon: Home },
  { metric: "Crisis Interventions", target: "200+", icon: Shield },
  { metric: "Warm Handoffs", target: "1,000+", icon: UserCheck },
  { metric: "Veterans Served", target: "500+", icon: Award },
  { metric: "Platforms Connected", target: "20/20", icon: Globe },
];

function StatCard({ stat }: { stat: typeof AUSTIN_STATS[0] }) {
  return (
    <Card className="text-center hover:shadow-lg transition-shadow" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="pt-5 pb-4">
        <div className={`mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2.5 ${stat.color}`}>
          <stat.icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
        <div className="text-sm font-medium">{stat.label}</div>
        <div className="text-xs text-muted-foreground mt-1">{stat.detail}</div>
      </CardContent>
    </Card>
  );
}

export default function AustinHousingInitiativePage() {
  const [activeTab, setActiveTab] = useState("crisis");

  useEffect(() => {
    document.title = "Austin Housing Initiative | ThriveUp Academy";
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="austin-housing-initiative-page">
      <PageHeader
        title="Built for Austin"
        description="20-platform ecosystem addressing Austin's housing, workforce, and health equity crisis"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/manor"} data-testid="button-manor-link">
              <MapPin className="h-4 w-4 mr-1" /> Manor Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/pflugerville"} data-testid="button-pflugerville-link">
              <MapPin className="h-4 w-4 mr-1" /> Pflugerville Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white p-8 md:p-12" data-testid="hero-banner">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-400 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <Badge className="bg-white/20 text-white border-white/30 mb-4" data-testid="badge-ecosystem">
            20-Platform AI Ecosystem
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            We Bring Solutions to Anyone
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-3">
            By meeting them where they are with our comprehensive solutions and suite of tools.
          </p>
          <p className="text-lg text-blue-200 mb-6">
            No problem remains a problem.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Shield className="h-3.5 w-3.5 mr-1" /> Veteran-Founded
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Star className="h-3.5 w-3.5 mr-1" /> Minority-Led
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Award className="h-3.5 w-3.5 mr-1" /> Bronze Star (x2)
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Brain className="h-3.5 w-3.5 mr-1" /> RPLICE Validated
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Zap className="h-3.5 w-3.5 mr-1" /> AI-Powered
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-austin">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="crisis" className="text-xs md:text-sm" data-testid="tab-crisis">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> The Crisis
          </TabsTrigger>
          <TabsTrigger value="ecosystem" className="text-xs md:text-sm" data-testid="tab-ecosystem">
            <Globe className="h-3.5 w-3.5 mr-1" /> 20 Platforms
          </TabsTrigger>
          <TabsTrigger value="alignment" className="text-xs md:text-sm" data-testid="tab-alignment">
            <Target className="h-3.5 w-3.5 mr-1" /> Funder Fit
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs md:text-sm" data-testid="tab-pipeline">
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Grant Pipeline
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="text-xs md:text-sm" data-testid="tab-outcomes">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Outcomes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crisis" className="mt-6 space-y-8" data-testid="content-crisis">
          <div>
            <h2 className="text-2xl font-bold mb-2">Austin by the Numbers</h2>
            <p className="text-muted-foreground mb-6">The data tells the story — and it demands action.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AUSTIN_STATS.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))}
            </div>
          </div>

          <Card className="border-l-4 border-l-red-500" data-testid="card-homelessness-crisis">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Homelessness: The Emergency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span>Estimated any given day</span><span className="font-bold">6,235–6,358</span></div>
                  <div className="flex justify-between text-sm"><span>Became homeless IN Austin</span><span className="font-bold">68%</span></div>
                  <div className="flex justify-between text-sm"><span>First-time homeless</span><span className="font-bold">44%</span></div>
                  <div className="flex justify-between text-sm"><span>In Travis County Jail</span><span className="font-bold">911 (36% of jail pop)</span></div>
                  <div className="flex justify-between text-sm"><span>10-year investment needed</span><span className="font-bold text-red-500">$350 million</span></div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>68% became homeless right here in Austin.</strong> These are our neighbors, not transplants.
                    44% are experiencing homelessness for the first time. Youth homelessness has nearly quadrupled
                    from 247 in 2020 to 934 in 2024.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The current city budget of $30.3M needs to <strong>double to $60M+</strong> — and even that requires
                    the right infrastructure to deploy effectively. That's what ThriveUp provides.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500" data-testid="card-workforce-gap">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Workforce & Housing Gap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-red-500 mb-1">$95K</div>
                  <div className="text-sm text-muted-foreground">Income needed for median home</div>
                  <div className="text-xs text-muted-foreground mt-1">Median income: $80,954</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-blue-500 mb-1">12%</div>
                  <div className="text-sm text-muted-foreground">Living-wage chance without credentials</div>
                  <div className="text-xs text-muted-foreground mt-1">Beyond high school</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-emerald-500 mb-1">$10B+</div>
                  <div className="text-sm text-muted-foreground">I-35 corridor construction</div>
                  <div className="text-xs text-muted-foreground mt-1">Workers need training AND housing</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500" data-testid="card-health-equity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-500" />
                Health Equity Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Black Homeownership</span><span>30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>White Homeownership</span><span>70%</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">40-point homeownership gap — housing instability is the #1 social determinant of health</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Hispanic families face <strong>2.3x cost burden</strong> vs. white families</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>46% of all renters</strong> are cost-burdened across the metro</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Black women <strong>3x more likely</strong> to die in childbirth</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Teachers avg salary $60,821 — AISD building 300+ housing units for educators</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ecosystem" className="mt-6 space-y-8" data-testid="content-ecosystem">
          <div>
            <h2 className="text-2xl font-bold mb-2">The 20-Platform Ecosystem</h2>
            <p className="text-muted-foreground mb-6">
              One connected ecosystem. One entry point. Comprehensive wraparound support. No dead ends. Always a safety net.
            </p>
          </div>

          <Card className="bg-muted/30 border-dashed" data-testid="card-problem-solution">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> The Problem With Current Approaches
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-red-400">x</span> Siloed services that don't communicate</li>
                    <li className="flex items-start gap-2"><span className="text-red-400">x</span> Three separate intakes, three waiting lists</li>
                    <li className="flex items-start gap-2"><span className="text-red-400">x</span> Cold referrals with no follow-up</li>
                    <li className="flex items-start gap-2"><span className="text-red-400">x</span> Manual data collection, annual reports</li>
                    <li className="flex items-start gap-2"><span className="text-red-400">x</span> Reactive crisis response only</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-emerald-500 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> ThriveUp's Answer
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> 20 platforms sharing real-time data</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> One entry point, data follows the person</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> Warm handoff with confirmation tracking</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> AI-powered real-time fidelity dashboard</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> Predictive early warning across platforms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {ECOSYSTEM_PLATFORMS.map((group) => (
            <div key={group.category}>
              <div className={`inline-block bg-gradient-to-r ${group.color} text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4`}>
                {group.category}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.platforms.map((platform) => (
                  <Card key={platform.name} className="hover:shadow-md transition-shadow" data-testid={`card-platform-${platform.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{platform.name}</h4>
                        <Badge variant="outline" className="text-xs">{group.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{platform.role}</p>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <MapPin className="h-3 w-3" />
                        <span>Austin Impact: {platform.impact}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="alignment" className="mt-6 space-y-8" data-testid="content-alignment">
          <div>
            <h2 className="text-2xl font-bold mb-2">St. David's Foundation — Perfect Alignment</h2>
            <p className="text-muted-foreground mb-2">
              St. David's invests <strong>$100M+ annually</strong> across Bastrop, Caldwell, Hays, Travis, and Williamson counties.
            </p>
            <Badge variant="secondary" className="mb-6">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> 100% geographic overlap with ThriveUp service area
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {ST_DAVIDS_ALIGNMENT.map((item) => (
              <Card key={item.priority} className="hover:shadow-md transition-shadow" data-testid={`card-alignment-${item.priority.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h4 className="font-semibold">{item.priority}</h4>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          {item.pool}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <ArrowRight className="h-3 w-3 inline mr-1" />
                        {item.platforms}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-200 dark:border-violet-800" data-testid="card-pflugerville">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-violet-600" />
                Pflugerville — Untapped Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/80 dark:bg-black/20 p-3 rounded-lg">
                  <div className="font-semibold text-violet-700 dark:text-violet-300">CDBG Entitlement City</div>
                  <div className="text-muted-foreground">Direct HUD funding access</div>
                </div>
                <div className="bg-white/80 dark:bg-black/20 p-3 rounded-lg">
                  <div className="font-semibold text-violet-700 dark:text-violet-300">330 Affordable Units Coming</div>
                  <div className="text-muted-foreground">Branchview 2027 — zero social infrastructure</div>
                </div>
                <div className="bg-white/80 dark:bg-black/20 p-3 rounded-lg">
                  <div className="font-semibold text-violet-700 dark:text-violet-300">$150K+ Matching Grants</div>
                  <div className="text-muted-foreground">PCDC workforce grants available</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Pflugerville is investing $80M+ in physical infrastructure but nothing in human infrastructure. 
                ThriveUp fills that gap — workforce pathways, health navigation, veteran services, youth support, and business development.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-differentiators">
            <CardHeader>
              <CardTitle>Why Fund ThriveUp Over Others</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { num: "1", text: "20 platforms for the price of one grant — no other applicant brings this breadth" },
                  { num: "2", text: "AI-powered — we scale without proportional cost increase" },
                  { num: "3", text: "Real-time data — funders see outcomes as they happen, not in annual reports" },
                  { num: "4", text: "RPLICE quality gate — every claim is evidence-based, every metric validated" },
                  { num: "5", text: "Veteran-founded, minority-led — we ARE the population we serve" },
                  { num: "6", text: "Already built. Already running. 20 platforms heartbeating right now." },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.num}
                    </div>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6 space-y-8" data-testid="content-pipeline">
          <div>
            <h2 className="text-2xl font-bold mb-2">Active Grant Pipeline</h2>
            <p className="text-muted-foreground mb-6">Current opportunities in pursuit — all passing through RPLICE quality gate.</p>
          </div>

          <div className="space-y-3">
            {GRANT_PIPELINE.map((grant) => (
              <Card key={grant.name} className="hover:shadow-md transition-shadow" data-testid={`card-grant-${grant.name.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${
                        grant.status === 'priority' ? 'bg-red-500' :
                        grant.status === 'preparing' ? 'bg-amber-500' :
                        grant.status === 'active' ? 'bg-emerald-500' :
                        grant.status === 'upcoming' ? 'bg-blue-500' :
                        'bg-slate-400'
                      }`} />
                      <div>
                        <h4 className="font-semibold">{grant.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {grant.deadline}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{grant.amount}</div>
                        <div className="text-xs text-muted-foreground">{grant.entity}</div>
                      </div>
                      <Badge variant={
                        grant.status === 'priority' ? 'destructive' :
                        grant.status === 'preparing' ? 'default' :
                        grant.status === 'active' ? 'secondary' :
                        'outline'
                      }>
                        {grant.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" data-testid="card-call-to-action">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200">Immediate Action Required</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                    Call St. David's Foundation at <strong>(512) 879-6600</strong> before March 30, 2026 opening.
                    Contact Jerry W. Jones Jr. at PCDC for Pflugerville workforce grant matching.
                    Complete Travis County CDBG survey by March 31.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="mt-6 space-y-8" data-testid="content-outcomes">
          <div>
            <h2 className="text-2xl font-bold mb-2">Year 1 Outcome Targets</h2>
            <p className="text-muted-foreground mb-6">
              Requesting <strong>$750,000–$1,000,000</strong> over 2 years. Every metric RPLICE-validated.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OUTCOMES.map((outcome) => (
              <Card key={outcome.metric} className="text-center hover:shadow-lg transition-shadow" data-testid={`card-outcome-${outcome.metric.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2.5">
                    <outcome.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold mb-0.5">{outcome.target}</div>
                  <div className="text-xs text-muted-foreground">{outcome.metric}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="card-investment-timeline">
            <CardHeader>
              <CardTitle>Investment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Year 1</Badge>
                    <span className="font-bold text-lg">$500K</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Deploy all 20 platforms across Central Texas</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Establish healthcare workforce pathways</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Launch Pflugerville pilot program</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Integrate with existing safety net providers</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">Year 2</Badge>
                    <span className="font-bold text-lg">$250K–$500K</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Scale to all 5 Central Texas counties</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Build real-time fidelity dashboard</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Publish outcomes & present at conferences</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Replicate model for national expansion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-evidence-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-600" />
                Evidence Base — Dr. Terry Flood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Federal Service", value: "20 Years" },
                  { label: "Bronze Star", value: "x2" },
                  { label: "Lean Six Sigma", value: "Green Belt" },
                  { label: "FEMA/NIMS", value: "Certified" },
                ].map((cred) => (
                  <div key={cred.label} className="text-center p-3 bg-white/80 dark:bg-black/20 rounded-lg">
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{cred.value}</div>
                    <div className="text-xs text-muted-foreground">{cred.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                {["CFIR", "RE-AIM", "MAP-GAP", "Warm Handoff", "Crisis Continuum"].map((framework) => (
                  <Badge key={framework} variant="outline" className="justify-center py-1">
                    {framework}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-blue-900 to-purple-900 text-white" data-testid="closing-statement">
            <h3 className="text-2xl font-bold mb-2">This isn't a proposal to build something.</h3>
            <p className="text-xl text-blue-200 mb-4">It's built. It's running. 20 platforms heartbeating right now.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Badge className="bg-white/20 border-white/30 text-white">ThriveUp Academy | 501(c)(3)</Badge>
              <Badge className="bg-white/20 border-white/30 text-white">Dr. Terry Flood, Founder & CEO</Badge>
              <Badge className="bg-white/20 border-white/30 text-white">thrivingcommunitiesforall.com</Badge>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BackToTop />
    </div>
  );
}
