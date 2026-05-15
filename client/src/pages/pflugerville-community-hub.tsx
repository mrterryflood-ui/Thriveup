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
  Construction, HardHat, Wrench,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { TrainingGuideButton } from "@/components/training-guide";

const PFLUGERVILLE_STATS = [
  { icon: Users, label: "Population", value: "76,500+", color: "bg-violet-500", detail: "4th largest city in Travis County" },
  { icon: TrendingUp, label: "Growth Rate", value: "56%", color: "bg-purple-500", detail: "Since 2010 Census" },
  { icon: Home, label: "Median Home", value: "$375K", color: "bg-blue-500", detail: "Down from $435K Austin metro" },
  { icon: Users, label: "Diversity Index", value: "78%", color: "bg-amber-500", detail: "One of TX's most diverse cities" },
  { icon: DollarSign, label: "Median Income", value: "$85,200", color: "bg-emerald-500", detail: "Above state avg but below CoL" },
  { icon: Home, label: "Affordable Units", value: "330", color: "bg-indigo-500", detail: "Branchview — completion 2027" },
  { icon: Landmark, label: "CDBG Status", value: "Entitlement", color: "bg-teal-500", detail: "Direct federal funding eligible" },
  { icon: AlertTriangle, label: "Social Infra", value: "Zero", color: "bg-red-500", detail: "No wraparound services built yet" },
];

const PFLUGERVILLE_NEEDS_ASSESSMENT = [
  {
    category: "Affordable Housing & Displacement Prevention",
    severity: "critical",
    findings: [
      "330 affordable units coming at Branchview (completion 2027) — but ZERO social infrastructure planned",
      "Median home $375K — requires $94K household income, pricing out 38% of current residents",
      "Rental costs up 34% since 2020 — avg 2BR now $1,650/mo",
      "No local housing navigation center — residents must travel to Austin for assistance",
      "Growing displacement of long-term residents as development accelerates along SH-130 corridor",
      "CDBG entitlement city status = direct HUD funding access — currently underutilized",
    ],
    platforms: ["LifeBridge", "M2C Transition"],
    solutions: [
      "Pre-Branchview social infrastructure buildout — services ready before 330 units fill",
      "Housing Resource Navigator deployed in Pflugerville — end Austin trips for housing help",
      "CDBG application support — help city maximize entitlement funding for housing stability",
      "First-time homebuyer pipeline — credit building, DPA, TDHCA program navigation",
      "Anti-displacement monitoring — track resident movement, intervene before displacement",
    ],
  },
  {
    category: "Workforce Development & Economic Mobility",
    severity: "critical",
    findings: [
      "SH-130 / I-35 corridor construction creating massive workforce demand — local pipeline underdeveloped",
      "Samsung semiconductor facility (Taylor) and Tesla (Del Valle) creating 20,000+ regional jobs",
      "Only 12% of Pflugerville businesses are minority-owned — despite 78% diversity index",
      "No dedicated workforce development center in Pflugerville",
      "PCDC (Pflugerville Community Development Corp) has $150K+ matching grants available — underutilized",
      "Stacey Pfefferkorn (city workforce contact) and Jerry W. Jones Jr. (PCDC director) identified — outreach planned",
    ],
    platforms: ["Mission Transition", "MCE", "Collaborative Advocate", "ThriveUp Academy"],
    solutions: [
      "Pflugerville Workforce Hub — career assessments, resume building, certification pathways",
      "Construction Career Pipeline — CDL, OSHA, heavy equipment for SH-130/I-35 corridor",
      "Samsung/Tesla Supplier Pipeline — connect minority businesses to Tier 2/3 contracts",
      "PCDC Partnership — leverage $150K matching grants for workforce training programs",
      "Youth-to-Career Pipeline — partner with PfISD for dual credit, internships, apprenticeships",
    ],
  },
  {
    category: "Health & Wellness Infrastructure",
    severity: "high",
    findings: [
      "Two urgent care facilities but no comprehensive community health center",
      "Mental health provider shortage — residents face 6-8 week wait times",
      "Growing senior population (12% over 65) with limited geriatric care options",
      "Pediatric specialist desert — families travel 20+ miles for specialty care",
      "No community-based maternal health services despite 1,100+ annual births",
      "Substance use support services virtually nonexistent within city limits",
    ],
    platforms: ["Whole-Person Health", "Sankofa Health", "Black Maternal Health", "HerHealth Network", "SafeCogniCare"],
    solutions: [
      "Telehealth bridge — immediate PHQ-9, GAD-7, C-SSRS access via platform",
      "Community Health Worker program — bilingual, culturally responsive outreach",
      "Senior wellness initiative — cognitive screening (SafeCogniCare), medication adherence support",
      "Maternal health mobile services — prenatal, postpartum, doula coordination",
      "Substance use navigation — warm handoff to Central TX treatment providers",
    ],
  },
  {
    category: "Youth & Education Services",
    severity: "high",
    findings: [
      "PfISD enrollment: 28,000+ students across 35+ campuses — limited wraparound services",
      "Academic achievement gaps widening for economically disadvantaged students",
      "After-school program waitlists exceeding 400 students in peak seasons",
      "Youth mental health crisis — 1 counselor per 380 students (recommended: 1:250)",
      "Limited career & technical education alignment with regional employer needs",
      "Neurodivergent support services gap — families travel to Austin for evaluations",
    ],
    platforms: ["ISSS", "ThriveUp Academy", "Perfectly Different", "Talk Your Talk"],
    solutions: [
      "ISSS wraparound model in PfISD — school-based social services coordination",
      "Expanded after-school STEM + trades — aligned with Samsung/Tesla/construction pipeline",
      "Youth mental health first response — train 200+ teachers in QPR/MHFA",
      "Neurodivergent support hub — evaluations, accommodations, family resources",
      "Dual credit acceleration — partner with ACC and Texas State for pathways",
    ],
  },
  {
    category: "Civic Infrastructure & Community Connectivity",
    severity: "moderate",
    findings: [
      "Pflugerville lacks a central community hub or multi-service center",
      "Limited public transit connectivity to Austin employment centers",
      "Community organizations fragmented — no coordination mechanism",
      "Veteran population estimated at 6,800+ — no dedicated veteran services center",
      "Digital divide persists in eastern Pflugerville neighborhoods",
      "Parks & recreation strong but lacking integrated social service programming",
    ],
    platforms: ["Civic Signal", "SafeReport", "Talk Your Talk", "Collaborative Advocate"],
    solutions: [
      "Digital Community Hub — ThriveUp as virtual multi-service center for Pflugerville",
      "Veteran Services Portal — Collaborative Advocate as dedicated veteran support",
      "Community Organization Connector — Civic Signal coordinates fragmented services",
      "Content-to-engagement pipeline — Pflugerville stories on Roku/podcast channels",
      "Public transit advocacy — data-driven case for CapMetro route expansion",
    ],
  },
];

const PFLUGERVILLE_PARTNERSHIPS = [
  { name: "PCDC", contact: "Jerry W. Jones Jr., Director", status: "Outreach planned", type: "Economic Dev", priority: "immediate" },
  { name: "City of Pflugerville", contact: "Stacey Pfefferkorn, Workforce", status: "Contact identified", type: "Government", priority: "immediate" },
  { name: "PfISD", contact: "District Administration", status: "Discovery", type: "Education", priority: "high" },
  { name: "Pflugerville Chamber", contact: "Business Development", status: "Outreach planned", type: "Business", priority: "high" },
  { name: "Travis County", contact: "CDBG Office", status: "Entitlement city coordination", type: "Government", priority: "urgent" },
  { name: "St. David's Foundation", contact: "Community Health Fund", status: "Opens March 30", type: "Funder", priority: "immediate" },
  { name: "Samsung (Taylor)", contact: "Community Relations", status: "Supplier diversity pipeline", type: "Corporate", priority: "high" },
  { name: "ACC (Austin Community College)", contact: "Pflugerville Campus", status: "Education partner", type: "Education", priority: "moderate" },
  { name: "Hendrickson/Connally ISD area", contact: "Family services", status: "Growth area targeting", type: "Education", priority: "moderate" },
];

const PFLUGERVILLE_OPPORTUNITIES = [
  { title: "PCDC Community Engagement Grant", amount: "$5K–$150K+", source: "Pflugerville Community Dev Corp", deadline: "Rolling", type: "Municipal" },
  { title: "HUD CDBG Entitlement", amount: "$500K–$2M", source: "HUD Direct", deadline: "Annual action plan", type: "Federal" },
  { title: "St. David's Foundation", amount: "Up to $1M", source: "St. David's", deadline: "Opens March 30", type: "Foundation" },
  { title: "TWC Skills Development Fund", amount: "$150K matching", source: "Texas Workforce Commission", deadline: "Rolling", type: "State" },
  { title: "Samsung Community Fund", amount: "$25K–$250K", source: "Samsung Austin Semiconductor", deadline: "Annual", type: "Corporate" },
  { title: "DFC Comprehensive Grant", amount: "$625K", source: "Drug-Free Communities", deadline: "April 14, 2026", type: "Federal" },
  { title: "WIOA Title I Youth", amount: "$200K–$500K", source: "Workforce Solutions Capital Area", deadline: "Rolling", type: "Federal" },
  { title: "21st Century Learning Centers", amount: "$200K–$500K", source: "TEA", deadline: "Annual", type: "Education" },
  { title: "SAMHSA Community Grants", amount: "$100K–$400K", source: "SAMHSA", deadline: "Annual", type: "Federal" },
  { title: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", source: "VA", deadline: "June 12–18, 2026", type: "Federal" },
];

const ECOSYSTEM_FOR_PFLUGERVILLE = [
  { platform: "LifeBridge", role: "Housing navigator", focus: "Branchview 330-unit readiness, CDBG coordination, DPA programs", icon: Home, color: "bg-blue-500" },
  { platform: "Mission Transition", role: "Career pathways", focus: "Samsung/Tesla supplier pipeline, SH-130 construction careers", icon: Briefcase, color: "bg-emerald-500" },
  { platform: "MCE", role: "Business accelerator", focus: "Minority business development, PCDC grant navigation, supplier diversity", icon: Building2, color: "bg-purple-500" },
  { platform: "Whole-Person Health", role: "Health bridge", focus: "Telehealth for health desert, mental health waitlist reduction", icon: Stethoscope, color: "bg-rose-500" },
  { platform: "ISSS", role: "School wraparound", focus: "PfISD deployment, 28,000 student reach, after-school expansion", icon: School, color: "bg-indigo-500" },
  { platform: "Collaborative Advocate", role: "Veteran services", focus: "6,800+ Pflugerville veterans, VOSB contracts, transition support", icon: Shield, color: "bg-slate-500" },
  { platform: "Talk Your Talk", role: "Communication access", focus: "89 spoken + 18 sign languages — dual credit with ACC, career exploration, STAAR prep", icon: GraduationCap, color: "bg-violet-500" },
  { platform: "Perfectly Different", role: "Neurodivergent support", focus: "Local evaluations, family resources, school accommodations", icon: Brain, color: "bg-pink-500" },
  { platform: "Civic Signal", role: "Civic engagement", focus: "Pflugerville stories → public-comment infrastructure, community engagement content", icon: Play, color: "bg-amber-500" },
  { platform: "Voices of Austin", role: "Community voice", focus: "Pflugerville-specific story collection, needs intelligence", icon: Mic, color: "bg-orange-500" },
];

const BRANCHVIEW_TIMELINE = [
  { phase: "Now (2026)", milestone: "Social infrastructure planning", status: "active", detail: "Build services BEFORE units fill" },
  { phase: "Q3 2026", milestone: "Digital hub deployed", status: "planned", detail: "ThriveUp platforms live for Pflugerville" },
  { phase: "Q4 2026", milestone: "Partnership network active", status: "planned", detail: "PCDC, PfISD, ACC, Samsung connected" },
  { phase: "Q1 2027", milestone: "Workforce pipeline flowing", status: "planned", detail: "Residents trained for regional jobs" },
  { phase: "Q2–Q3 2027", milestone: "Branchview units filling", status: "future", detail: "Services ready, residents supported" },
  { phase: "Q4 2027", milestone: "Full ecosystem operational", status: "future", detail: "330 families with wraparound support" },
];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return <Badge className={`text-xs ${colors[severity] || ""}`}>{severity.toUpperCase()}</Badge>;
}

export default function PflugervilleCommunityHubPage() {
  const [activeTab, setActiveTab] = useState("assessment");

  useEffect(() => {
    document.title = "Pflugerville Community Hub | ThriveUp Academy";
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="pflugerville-community-hub-page">
      <PageHeader
        title="Built for Pflugerville"
        description="Right tools. Right community. Right time. Social infrastructure before the 330 units fill."
        actions={
          <div className="flex gap-2 flex-wrap">
            <TrainingGuideButton moduleId="pflugerville-community-hub" />
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/austin"} data-testid="button-austin-link">
              <MapPin className="h-4 w-4 mr-1" /> Austin Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/manor"} data-testid="button-manor-link">
              <MapPin className="h-4 w-4 mr-1" /> Manor Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-pflugerville">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 text-white p-8 md:p-12" data-testid="hero-pflugerville">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-violet-300 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-300 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <Badge className="bg-white/20 text-white border-white/30 mb-4" data-testid="badge-pflugerville">
            <Building2 className="h-3 w-3 mr-1" /> Pflugerville, Texas — Community Hub
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Build the Infrastructure Before They Move In
          </h1>
          <p className="text-xl text-violet-100 mb-3">
            330 affordable housing units are coming to Branchview in 2027. There is currently zero
            social infrastructure to support those families. We're building it now.
          </p>
          <p className="text-lg text-violet-200 mb-6">
            Implementation science: the right tools for the right task at the right time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1"><Users className="h-3.5 w-3.5 mr-1" /> 76,500+ Residents</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Landmark className="h-3.5 w-3.5 mr-1" /> CDBG Entitlement City</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Globe className="h-3.5 w-3.5 mr-1" /> 15 Service Platforms</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Construction className="h-3.5 w-3.5 mr-1" /> Samsung + Tesla Corridor</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PFLUGERVILLE_STATS.map((stat) => (
          <Card key={stat.label} className="text-center hover:shadow-lg transition-shadow" data-testid={`stat-pville-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
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

      <Card className="border-l-4 border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20" data-testid="card-pflugerville-knockout">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-violet-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold mb-2">The Pflugerville Window</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Pflugerville is a CDBG entitlement city — meaning it receives direct HUD funding annually.
                330 affordable units are coming to Branchview by 2027. Samsung in Taylor and Tesla in Del Valle
                are creating 20,000+ regional jobs. The PCDC has $150K+ in matching grants. Stacey Pfefferkorn
                handles workforce, Jerry W. Jones Jr. directs the PCDC. The contacts are identified, the funding
                mechanisms exist, and the need is documented.
              </p>
              <p className="font-semibold text-violet-700 dark:text-violet-400">
                The window is now. Build the social infrastructure before 330 families move in with nowhere to turn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-pflugerville">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="assessment" className="text-xs md:text-sm" data-testid="tab-pville-assessment">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Assessment
          </TabsTrigger>
          <TabsTrigger value="branchview" className="text-xs md:text-sm" data-testid="tab-pville-branchview">
            <Home className="h-3.5 w-3.5 mr-1" /> Branchview Plan
          </TabsTrigger>
          <TabsTrigger value="ecosystem" className="text-xs md:text-sm" data-testid="tab-pville-ecosystem">
            <Globe className="h-3.5 w-3.5 mr-1" /> Ecosystem Fit
          </TabsTrigger>
          <TabsTrigger value="funding" className="text-xs md:text-sm" data-testid="tab-pville-funding">
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Funding
          </TabsTrigger>
          <TabsTrigger value="interconnect" className="text-xs md:text-sm" data-testid="tab-pville-interconnect">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Regional Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="mt-6 space-y-6" data-testid="content-pville-assessment">
          <div>
            <h2 className="text-2xl font-bold mb-2">Pflugerville Community Needs Assessment</h2>
            <p className="text-muted-foreground mb-6">
              Comprehensive gap analysis across 5 domains — the assessment you've been waiting for.
              Solutions mapped to specific ecosystem platforms with implementation timelines.
            </p>
          </div>

          {PFLUGERVILLE_NEEDS_ASSESSMENT.map((domain) => (
            <Card key={domain.category} className="overflow-hidden" data-testid={`card-assess-${domain.category.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`}>
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

        <TabsContent value="branchview" className="mt-6 space-y-6" data-testid="content-pville-branchview">
          <div>
            <h2 className="text-2xl font-bold mb-2">Branchview Readiness Plan</h2>
            <p className="text-muted-foreground mb-6">
              330 affordable units. Zero social infrastructure. Here's the timeline to fix that before families arrive.
            </p>
          </div>

          <div className="space-y-4">
            {BRANCHVIEW_TIMELINE.map((item, i) => (
              <Card key={item.phase} className={`border-l-4 ${
                item.status === "active" ? "border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10" :
                item.status === "planned" ? "border-l-blue-500" :
                "border-l-gray-300 dark:border-l-gray-700"
              }`} data-testid={`card-timeline-${i}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.status === "active" ? "bg-emerald-500 text-white" :
                        item.status === "planned" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-gray-100 text-gray-500 dark:bg-gray-800"
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.phase}</span>
                          <Badge variant={item.status === "active" ? "default" : "outline"} className="text-xs">
                            {item.status === "active" ? "NOW" : item.status === "planned" ? "Planned" : "Future"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{item.milestone}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-200 dark:border-violet-800" data-testid="card-branchview-services">
            <CardHeader>
              <CardTitle>Services Ready at Move-In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Day 1: Housing Navigator", desc: "LifeBridge resource finder with Pflugerville-specific housing data, utility assistance, tenant rights", icon: Home },
                  { title: "Day 1: Health Bridge", desc: "Telehealth screening (PHQ-9, GAD-7), provider matching, medication-adherence support", icon: Stethoscope },
                  { title: "Day 1: Career Pathway", desc: "Resume builder, job matching for Samsung/Tesla/construction, PCDC grant access for training", icon: Briefcase },
                  { title: "Week 1: School Enrollment", desc: "PfISD navigator, after-school program waitlist management, ISSS wraparound activation", icon: School },
                  { title: "Week 1: Financial Tools", desc: "Credit building pathway, utility budgeting, emergency fund setup via MCE", icon: DollarSign },
                  { title: "Month 1: Community Integration", desc: "Voices of Pflugerville story sharing, neighborhood connections, civic engagement", icon: Users },
                ].map((service) => (
                  <div key={service.title} className="p-4 rounded-lg bg-white/60 dark:bg-black/20">
                    <service.icon className="h-5 w-5 text-violet-600 dark:text-violet-400 mb-2" />
                    <h4 className="font-semibold text-sm mb-1">{service.title}</h4>
                    <p className="text-xs text-muted-foreground">{service.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ecosystem" className="mt-6 space-y-6" data-testid="content-pville-ecosystem">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ecosystem Adapted for Pflugerville</h2>
            <p className="text-muted-foreground mb-6">
              Same 15-service-platform infrastructure — customized for Pflugerville's unique position as a CDBG entitlement city
              with major development catalysts (Samsung, Tesla, Branchview).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ECOSYSTEM_FOR_PFLUGERVILLE.map((item) => (
              <Card key={item.platform} className="hover:shadow-md transition-shadow" data-testid={`card-eco-pville-${item.platform.toLowerCase().replace(/\s+/g, '-')}`}>
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
                      <p className="text-sm text-muted-foreground">{item.focus}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="funding" className="mt-6 space-y-6" data-testid="content-pville-funding">
          <div>
            <h2 className="text-2xl font-bold mb-2">Pflugerville Funding Pipeline</h2>
            <p className="text-muted-foreground mb-6">
              10 funding opportunities totaling $3M+ — including CDBG entitlement, PCDC matching, and regional grants.
            </p>
          </div>

          <div className="space-y-3">
            {PFLUGERVILLE_OPPORTUNITIES.map((opp) => (
              <Card key={opp.title} className="hover:shadow-md transition-shadow" data-testid={`card-fund-pville-${opp.title.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}`}>
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

          <Card className="border-l-4 border-l-emerald-500" data-testid="card-cdbg-advantage">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Landmark className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">CDBG Entitlement City Advantage</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pflugerville receives direct HUD Community Development Block Grant funding annually —
                    no competing through the state. This means predictable, recurring federal dollars for
                    housing, infrastructure, and public services. ThriveUp's platform helps the city maximize
                    these funds by providing the service delivery infrastructure that CDBG programs require.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PFLUGERVILLE_PARTNERSHIPS.map((partner) => (
              <Card key={partner.name} className="hover:shadow-md transition-shadow" data-testid={`card-partner-pville-${partner.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{partner.name}</span>
                    <Badge variant="outline" className="text-xs">{partner.type}</Badge>
                    <Badge className={`text-xs ${
                      partner.priority === "immediate" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      partner.priority === "urgent" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                      partner.priority === "high" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>{partner.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{partner.contact} — {partner.status}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interconnect" className="mt-6 space-y-6" data-testid="content-pville-interconnect">
          <div>
            <h2 className="text-2xl font-bold mb-2">Regional Network</h2>
            <p className="text-muted-foreground mb-6">
              Three communities, one ecosystem. What works here works everywhere — and the evidence compounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/austin"} data-testid="card-region-austin-pville">
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

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/manor"} data-testid="card-region-manor-pville">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <MapPin className="h-5 w-5" /> Manor
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-medium">Focus: Growth Without Gaps</p>
                <ul className="text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 89% population growth</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 78% commute outside Manor</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> No hospital, 1 health clinic</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> ESRI 3rd Spaces integration</li>
                </ul>
                <Badge variant="outline" className="text-xs">View Manor Hub <ArrowRight className="h-3 w-3 ml-1" /></Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-950/10" data-testid="card-region-pflugerville-pville">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                  <MapPin className="h-5 w-5" /> Pflugerville
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-medium">Focus: Infrastructure Before Growth</p>
                <ul className="text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> 330 affordable units (2027)</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> CDBG entitlement city</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Samsung + Tesla corridor</li>
                  <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> $3M+ funding pipeline</li>
                </ul>
                <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">You are here</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-violet-50 via-teal-50 to-blue-50 dark:from-violet-950/20 dark:via-teal-950/20 dark:to-blue-950/20" data-testid="card-shared-infra-pville">
            <CardHeader>
              <CardTitle>Implementation Science: Shared Evidence, Local Adaptation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Every intervention validated in one region strengthens the evidence base for all three.
                RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) outcomes compound
                across sites. CFIR context analysis ensures each deployment fits its community.
                Same science, different contexts, collective impact.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { label: "Shared Workforce Pipeline", detail: "I-35/SH-130 corridor jobs serve all 3 regions", icon: Briefcase },
                  { label: "Shared Health Network", detail: "Telehealth & screening covers health deserts", icon: Stethoscope },
                  { label: "Shared Content Channel", detail: "3 regions → Roku/CTV → one powerful story", icon: Play },
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